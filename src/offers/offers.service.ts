import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer, OfferStatus } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferStatusDto } from './dto/update-offer-status.dto';
import { LoanApplicationStatus } from '../loans/entities/loan-application.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private offersRepository: Repository<Offer>,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  async create(createOfferDto: CreateOfferDto, adminId?: string): Promise<Offer> {
    return await this.offersRepository.manager.transaction(async (transactionalEntityManager) => {
      const loanApplication = await transactionalEntityManager
        .createQueryBuilder()
        .select('loan')
        .from('loan_applications', 'loan')
        .where('loan.id = :id', { id: createOfferDto.loanApplicationId })
        .getRawOne();

      if (!loanApplication) {
        throw new NotFoundException('Loan application not found');
      }

      if (loanApplication.loan_status === LoanApplicationStatus.REJECTED || 
          loanApplication.loan_status === LoanApplicationStatus.CANCELLED) {
        throw new BadRequestException(
          `Cannot create offer for loan with status: ${loanApplication.loan_status}`,
        );
      }

      const monthlyPayment = this.calculateMonthlyPayment(
        createOfferDto.offeredLoanAmount,
        createOfferDto.apr,
        createOfferDto.termMonths,
      );

      const totalInterest = (monthlyPayment * createOfferDto.termMonths) - createOfferDto.offeredLoanAmount;

      const ltvAtOffer = loanApplication.loan_snapshotLoanValue
        ? (createOfferDto.offeredLoanAmount / loanApplication.loan_snapshotLoanValue)
        : null;

      const expiresAt = createOfferDto.expiresAt
        ? new Date(createOfferDto.expiresAt)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const offer = this.offersRepository.create({
        loanApplicationId: createOfferDto.loanApplicationId,
        adminId,
        lenderCode: createOfferDto.lenderCode || 'BACKOFFICE',
        offeredLoanAmount: createOfferDto.offeredLoanAmount,
        apr: createOfferDto.apr,
        termMonths: createOfferDto.termMonths,
        monthlyPayment,
        totalInterest,
        ltvAtOffer: ltvAtOffer || undefined,
        expiresAt,
        notes: createOfferDto.notes,
        status: OfferStatus.ISSUED,
      });

      const savedOffer = await transactionalEntityManager.save(Offer, offer);
      const offerId = Array.isArray(savedOffer) ? savedOffer[0].id : savedOffer.id;

      await transactionalEntityManager
        .createQueryBuilder()
        .update('loan_applications')
        .set({ status: LoanApplicationStatus.PENDING_OFFER })
        .where('id = :id', { id: createOfferDto.loanApplicationId })
        .execute();

      const offerWithLoan = await transactionalEntityManager.findOne(Offer, {
        where: { id: offerId },
        relations: ['application'],
      });

      // Only notify if loan has a userId (not a guest application)
      if (loanApplication.loan_userId) {
        await this.notificationsService.notifyOfferCreated(
          loanApplication.loan_userId,
          offerId,
          monthlyPayment,
        );

        await this.notificationsService.notifyLoanApproved(
          loanApplication.loan_userId,
          createOfferDto.loanApplicationId,
          createOfferDto.offeredLoanAmount,
        );
      }

      return offerWithLoan!;
    });
  }

  private calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    termMonths: number,
  ): number {
    const monthlyRate = annualRate / 12;

    if (monthlyRate === 0) {
      return principal / termMonths;
    }

    const monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);

    return Math.round(monthlyPayment * 100) / 100;
  }

  async findAll(): Promise<Offer[]> {
    return this.offersRepository.find({
      relations: ['application'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId?: string): Promise<Offer> {
    const query = this.offersRepository
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.application', 'loan')
      .where('offer.id = :id', { id });

    if (userId) {
      query.andWhere('loan.userId = :userId', { userId });
    }

    const offer = await query.getOne();

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Check if offer has expired
    await this.checkAndUpdateExpiry(offer);

    return offer;
  }

  /**
   * Check if offer has expired and update status if needed
   */
  private async checkAndUpdateExpiry(offer: Offer): Promise<void> {
    if (offer.status === OfferStatus.ISSUED && offer.expiresAt && new Date() > new Date(offer.expiresAt)) {
      offer.status = OfferStatus.EXPIRED;
      await this.offersRepository.save(offer);
      throw new BadRequestException('This offer has expired');
    }
  }

  async findUserOffers(userId: string): Promise<Offer[]> {
    const offers = await this.offersRepository
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.application', 'loan')
      .where('loan.userId = :userId', { userId })
      .orderBy('offer.createdAt', 'DESC')
      .getMany();

    // Check and update expired offers
    await Promise.all(
      offers.map(async (offer) => {
        if (offer.status === OfferStatus.ISSUED && offer.expiresAt && new Date() > new Date(offer.expiresAt)) {
          offer.status = OfferStatus.EXPIRED;
          await this.offersRepository.save(offer);
        }
      }),
    );

    return offers;
  }

  async findByLoanApplicationId(loanApplicationId: string): Promise<Offer[]> {
    return this.offersRepository.find({
      where: { loanApplicationId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
    id: string,
    updateOfferStatusDto: UpdateOfferStatusDto,
  ): Promise<Offer> {
    const offer = await this.offersRepository.findOne({
      where: { id },
      relations: ['application'],
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Check expiry before allowing status update
    if (offer.status === OfferStatus.ISSUED && offer.expiresAt && new Date() > new Date(offer.expiresAt)) {
      offer.status = OfferStatus.EXPIRED;
      await this.offersRepository.save(offer);
      throw new BadRequestException('This offer has expired and cannot be updated');
    }

    if (offer.status !== OfferStatus.ISSUED) {
      throw new BadRequestException(
        `Cannot update offer with status: ${offer.status}`,
      );
    }

    offer.status = updateOfferStatusDto.status;
    return this.offersRepository.save(offer);
  }

  /**
   * Accept offer (user accepts the financing terms)
   */
  async acceptOffer(id: string, userId: string): Promise<Offer> {
    return await this.offersRepository.manager.transaction(async (transactionalEntityManager) => {
      const offer = await transactionalEntityManager
        .createQueryBuilder('offer', 'offer')
        .leftJoinAndSelect('offer.application', 'loan')
        .where('offer.id = :id', { id })
        .andWhere('loan.userId = :userId', { userId })
        .getOne();

      if (!offer) {
        throw new NotFoundException('Offer not found');
      }

      // Check expiry
      if (offer.status === OfferStatus.ISSUED && offer.expiresAt && new Date() > new Date(offer.expiresAt)) {
        offer.status = OfferStatus.EXPIRED;
        await transactionalEntityManager.save(offer);
        throw new BadRequestException('This offer has expired');
      }

      if (offer.status !== OfferStatus.ISSUED) {
        throw new BadRequestException(
          `Cannot accept offer with status: ${offer.status}`,
        );
      }

      // Update offer status to ACCEPTED
      offer.status = OfferStatus.ACCEPTED;
      const savedOffer = await transactionalEntityManager.save(offer);

      // Update loan application status to APPROVED
      await transactionalEntityManager
        .createQueryBuilder()
        .update('loan_applications')
        .set({ status: LoanApplicationStatus.APPROVED })
        .where('id = :id', { id: offer.loanApplicationId })
        .execute();

      // Notify admin that user accepted the offer
      await this.notificationsService.notifyOfferAccepted(
        offer.adminId || undefined,
        offer.id,
        offer.offeredLoanAmount,
        userId,
      );

      // Reload offer with relations
      const finalOffer = await transactionalEntityManager.findOne(Offer, {
        where: { id: offer.id },
        relations: ['application'],
      });

      return finalOffer!;
    });
  }

  /**
   * Decline offer with reason (user can provide note)
   */
  async declineOffer(id: string, userId: string, declineNote?: string): Promise<Offer> {
    const offer = await this.offersRepository
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.application', 'loan')
      .where('offer.id = :id', { id })
      .andWhere('loan.userId = :userId', { userId })
      .getOne();

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Check expiry
    if (offer.status === OfferStatus.ISSUED && offer.expiresAt && new Date() > new Date(offer.expiresAt)) {
      offer.status = OfferStatus.EXPIRED;
      await this.offersRepository.save(offer);
      throw new BadRequestException('This offer has expired');
    }

    if (offer.status !== OfferStatus.ISSUED) {
      throw new BadRequestException(
        `Cannot decline offer with status: ${offer.status}`,
      );
    }

    offer.status = OfferStatus.DECLINED;
    if (declineNote) {
      offer.notes = offer.notes
        ? `${offer.notes}\n\n[User declined]: ${declineNote}`
        : `[User declined]: ${declineNote}`;
    }

    return this.offersRepository.save(offer);
  }
}
