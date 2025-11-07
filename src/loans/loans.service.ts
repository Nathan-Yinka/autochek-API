import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanApplication, LoanApplicationStatus, EligibilityStatus } from './entities/loan-application.entity';
import { CreateLoanApplicationDto } from './dto/create-loan-application.dto';
import { UpdateLoanStatusDto } from './dto/update-loan-status.dto';
import { ValuationsService } from '../valuations/valuations.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Currency } from '../common/enums/currency.enum';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(LoanApplication)
    private loansRepository: Repository<LoanApplication>,
    private valuationsService: ValuationsService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  async create(
    userId: string | null,
    createLoanApplicationDto: CreateLoanApplicationDto,
    isGuest: boolean = false,
  ): Promise<LoanApplication> {
    return await this.loansRepository.manager.transaction(async (transactionalEntityManager) => {
      const vehicle = await transactionalEntityManager
        .createQueryBuilder()
        .select('vehicle')
        .from('vehicles', 'vehicle')
        .where('vehicle.id = :id', { id: createLoanApplicationDto.vehicleId })
        .getRawOne();

      if (!vehicle) {
        throw new NotFoundException('Vehicle not found. Please add vehicle first.');
      }

      // Check if vehicle is available for loans
      if (vehicle.vehicle_isLoanAvailable === false || vehicle.vehicle_isLoanAvailable === 0) {
        throw new BadRequestException('This vehicle is not available for financing.');
      }

      // Check if vehicle has valuation (loanValue must exist)
      if (!vehicle.vehicle_loanValue || vehicle.vehicle_loanValue === null) {
        throw new BadRequestException(
          'This vehicle does not have a valuation yet. Financing is not available at this time.',
        );
      }

      const vehicleLoanValue = vehicle.vehicle_loanValue;

      const listingPrice = vehicle.vehicle_listingPrice || vehicleLoanValue;
      const vehicleRequiredDownPct = vehicle.vehicle_requiredDownPaymentPct;
      const currency = vehicle.vehicle_currency;
      
      // LTV Cap - could come from config or vehicle category
      const ltvCap = 1.10;

      // Calculate down payment
      const plannedDownAmount = createLoanApplicationDto.requestedDownPaymentAmount || 
        (createLoanApplicationDto.requestedDownPaymentPct 
          ? listingPrice * createLoanApplicationDto.requestedDownPaymentPct 
          : listingPrice * vehicleRequiredDownPct);

      // initialNeeded = listingPrice - plannedDownAmount
      const initialNeeded = listingPrice - plannedDownAmount;

      // maxFinance = ltvCap × snapshotLoanValue
      const maxFinance = vehicleLoanValue * ltvCap;

      // validatedLoanAmount = min(initialNeeded, maxFinance)
      const validatedLoanAmount = Math.min(initialNeeded, maxFinance);

      // requiredExtraDown = max(0, initialNeeded - maxFinance)
      const requiredExtraDown = Math.max(0, initialNeeded - maxFinance);

      const eligibility = this.checkEligibility(
        validatedLoanAmount,
        vehicleLoanValue,
        plannedDownAmount,
        requiredExtraDown,
        createLoanApplicationDto.requestedTermMonths,
        vehicleRequiredDownPct,
        listingPrice,
        currency,
      );

      const loanApplication = this.loansRepository.create({
        userId: userId || undefined,
        isGuest,
        vehicleId: vehicle.vehicle_id,
        applicantName: createLoanApplicationDto.applicantName,
        applicantEmail: createLoanApplicationDto.applicantEmail,
        applicantPhone: createLoanApplicationDto.applicantPhone,
        bvn: createLoanApplicationDto.bvn,
        nin: createLoanApplicationDto.nin,
        dateOfBirth: createLoanApplicationDto.dateOfBirth,
        residentialAddress: createLoanApplicationDto.residentialAddress,
        listingPrice,
        snapshotRetailValue: vehicleLoanValue,
        snapshotLoanValue: vehicleLoanValue,
        valuationFetchedAt: new Date(),
        requestedLoanAmount: createLoanApplicationDto.requestedLoanAmount,
        requestedDownPaymentPct: createLoanApplicationDto.requestedDownPaymentPct,
        requestedDownPaymentAmount: plannedDownAmount,
        requestedTermMonths: createLoanApplicationDto.requestedTermMonths,
        requestedApr: createLoanApplicationDto.requestedApr,
        desiredLoanCurrency: createLoanApplicationDto.desiredLoanCurrency || Currency.NGN,
        desiredMonthlyPayment: createLoanApplicationDto.desiredMonthlyPayment,
        desiredInterestRate: createLoanApplicationDto.desiredInterestRate,
        desiredEquityContribution: createLoanApplicationDto.desiredEquityContribution,
        interestRateType: createLoanApplicationDto.interestRateType,
        desiredResidualBalloonPct: createLoanApplicationDto.desiredResidualBalloonPct,
        desiredRepaymentDate: createLoanApplicationDto.desiredRepaymentDate,
        subscribeRoadworthiness: createLoanApplicationDto.subscribeRoadworthiness || false,
        subscribeLicenseRenewal: createLoanApplicationDto.subscribeLicenseRenewal || false,
        feePaymentPreference: createLoanApplicationDto.feePaymentPreference,
        upfrontPaymentItems: createLoanApplicationDto.upfrontPaymentItems,
        ltvCap,
        plannedDownAmount,
        initialNeeded,
        maxFinance,
        validatedLoanAmount,
        requiredExtraDown,
        impliedMonthlyPayment: eligibility.impliedMonthlyPayment,
        impliedTotalInterest: eligibility.impliedTotalInterest,
        eligibilityStatus: eligibility.status,
        eligibilityReasons: JSON.stringify(eligibility.reasons),
        status: eligibility.status === EligibilityStatus.ELIGIBLE 
          ? LoanApplicationStatus.SUBMITTED 
          : LoanApplicationStatus.REJECTED,
      });

      const savedLoan = await transactionalEntityManager.save(LoanApplication, loanApplication);

      const loan = await transactionalEntityManager.findOne(LoanApplication, {
        where: { id: savedLoan.id },
        relations: ['user', 'vehicle'],
      });

      if (loan) {
        // Only notify if user is logged in
        if (userId) {
          await this.notificationsService.notifyLoanSubmitted(
            userId,
            savedLoan.id,
            createLoanApplicationDto.requestedLoanAmount,
          );
        }

        await this.notificationsService.notifyAdminNewLoan(
          savedLoan.id,
          loan.applicantName,
          createLoanApplicationDto.requestedLoanAmount,
        );
      }

      return loan!;
    });
  }

  private checkEligibility(
    validatedLoanAmount: number,
    vehicleLoanValue: number,
    plannedDownAmount: number,
    requiredExtraDown: number,
    termMonths: number,
    vehicleRequiredDownPct: number,
    listingPrice: number,
    currency: string,
  ): {
    status: EligibilityStatus;
    reasons: string[];
    impliedMonthlyPayment: number;
    impliedTotalInterest: number;
  } {
    const reasons: string[] = [];
    const currencySymbol = currency === 'NGN' ? '₦' : currency;

    // Check vehicle's required down payment
    const vehicleMinDown = listingPrice * vehicleRequiredDownPct;
    if (plannedDownAmount < vehicleMinDown) {
      const shortfall = vehicleMinDown - plannedDownAmount;
      const requiredPct = Math.round(vehicleRequiredDownPct * 100);
      reasons.push(`Vehicle requires ${requiredPct}% down payment. Need additional ${currencySymbol}${shortfall.toLocaleString()}`);
      
      return {
        status: EligibilityStatus.NEED_MORE_DOWN,
        reasons,
        impliedMonthlyPayment: 0,
        impliedTotalInterest: 0,
      };
    }

    // Check if extra down is needed (LTV cap exceeded)
    if (requiredExtraDown > 0) {
      reasons.push(`Add ${currencySymbol}${requiredExtraDown.toLocaleString()} to your down payment to qualify`);
      
      return {
        status: EligibilityStatus.NEED_MORE_DOWN,
        reasons,
        impliedMonthlyPayment: 0,
        impliedTotalInterest: 0,
      };
    }

    // Calculate implied payment (using default 25% APR - could be configurable)
    const defaultApr = 0.25;
    const monthlyRate = defaultApr / 12;

    const impliedMonthlyPayment = 
      (validatedLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);

    const impliedTotalInterest = (impliedMonthlyPayment * termMonths) - validatedLoanAmount;

    const downPct = Math.round((plannedDownAmount / (plannedDownAmount + validatedLoanAmount)) * 100);
    reasons.push(`Down ${downPct}% → Finance ${currencySymbol}${validatedLoanAmount.toLocaleString()} → ~${currencySymbol}${Math.round(impliedMonthlyPayment).toLocaleString()}/month for ${termMonths} months`);

    return {
      status: EligibilityStatus.ELIGIBLE,
      reasons,
      impliedMonthlyPayment: Math.round(impliedMonthlyPayment),
      impliedTotalInterest: Math.round(impliedTotalInterest),
    };
  }

  async findAll(userId?: string): Promise<LoanApplication[]> {
    const query = this.loansRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.user', 'user')
      .leftJoinAndSelect('loan.vehicle', 'vehicle')
      .orderBy('loan.createdAt', 'DESC');

    if (userId) {
      query.where('loan.userId = :userId', { userId });
    }

    return query.getMany();
  }

  async findOne(id: string, userId?: string): Promise<LoanApplication> {
    const query = this.loansRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.user', 'user')
      .leftJoinAndSelect('loan.vehicle', 'vehicle')
      .leftJoinAndSelect('loan.offers', 'offers')
      .where('loan.id = :id', { id });

    // If userId provided, ensure it matches (for logged-in users only)
    if (userId) {
      query.andWhere('loan.userId = :userId', { userId });
    }

    const loan = await query.getOne();

    if (!loan) {
      throw new NotFoundException('Loan application not found');
    }

    return loan;
  }

  async claimGuestApplication(userId: string, applicationId: string): Promise<LoanApplication> {
    const application = await this.findOne(applicationId);

    if (!application.isGuest) {
      throw new BadRequestException('This application is not a guest application');
    }

    if (application.userId) {
      throw new BadRequestException('This application has already been claimed');
    }

    if (application.applicantEmail !== await this.getUserEmail(userId)) {
      throw new BadRequestException('Email does not match application email');
    }

    application.userId = userId;
    application.isGuest = false;

    return this.loansRepository.save(application);
  }

  private async getUserEmail(userId: string): Promise<string> {
    const result: any = await this.loansRepository.manager
      .createQueryBuilder()
      .select('user.email')
      .from('users', 'user')
      .where('user.id = :id', { id: userId })
      .getRawOne();
    return result?.user_email || '';
  }

  async updateStatus(
    id: string,
    updateLoanStatusDto: UpdateLoanStatusDto,
  ): Promise<LoanApplication> {
    const loan = await this.findOne(id);

    loan.status = updateLoanStatusDto.status;
    
    if (updateLoanStatusDto.status === LoanApplicationStatus.REJECTED && updateLoanStatusDto.rejectionReason) {
      loan.eligibilityReasons = JSON.stringify([updateLoanStatusDto.rejectionReason]);
    }

    return this.loansRepository.save(loan);
  }

  async getUserLoans(userId: string): Promise<LoanApplication[]> {
    return this.findAll(userId);
  }

  /**
   * Get unclaimed guest applications matching user's email
   */
  async getUnclaimedApplicationsByEmail(email: string): Promise<LoanApplication[]> {
    const applications = await this.loansRepository.find({
      where: {
        applicantEmail: email,
        isGuest: true,
      },
      order: { createdAt: 'DESC' },
    });

    // Filter to only show applications that are not already claimed
    return applications.filter((app) => !app.userId);
  }

  /**
   * Delete a loan application
   * Users can delete their own applications
   * Admins can delete any application
   */
  async deleteApplication(
    applicationId: string,
    userId: string,
    userRole: string,
  ): Promise<{ message: string }> {
    const application = await this.loansRepository.findOne({
      where: { id: applicationId },
      relations: ['offers'],
    });

    if (!application) {
      throw new NotFoundException('Loan application not found');
    }

    // Check if application has active offers
    const hasActiveOffer = application.offers?.some(
      (offer) => offer.status === 'ISSUED' || offer.status === 'ACCEPTED',
    );

    if (hasActiveOffer) {
      throw new BadRequestException('Cannot delete application with active offers');
    }

    // Authorization check
    const isAdmin = userRole === UserRole.ADMIN;
    const isOwner = application.userId === userId;

    // For guest applications, check if email matches
    let canDeleteGuestApp = false;
    if (application.isGuest && !application.userId) {
      const userEmail = await this.getUserEmail(userId);
      canDeleteGuestApp = application.applicantEmail === userEmail;
    }

    // Allow if: Admin OR Owner OR Guest with matching email
    if (!isAdmin && !isOwner && !canDeleteGuestApp) {
      throw new BadRequestException('You are not authorized to delete this application');
    }

    await this.loansRepository.remove(application);

    return {
      message: 'Loan application deleted successfully',
    };
  }
}
