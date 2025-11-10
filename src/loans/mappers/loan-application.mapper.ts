import { LoanApplication } from '../entities/loan-application.entity';
import { LoanApplicationResponseDto } from '../dto/loan-application-response.dto';
import { UserSummaryDto } from '../dto/user-summary.dto';
import { User } from '../../users/entities/user.entity';

export class LoanApplicationMapper {
  static toUserSummary(user: User): UserSummaryDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
    };
  }

  static toResponseDto(loanApplication: LoanApplication): LoanApplicationResponseDto {
    return {
      id: loanApplication.id,
      user: loanApplication.user ? this.toUserSummary(loanApplication.user) : undefined,
      vehicleId: loanApplication.vehicleId,
      applicantName: loanApplication.applicantName,
      applicantEmail: loanApplication.applicantEmail,
      applicantPhone: loanApplication.applicantPhone,
      listingPrice: loanApplication.listingPrice,
      snapshotRetailValue: loanApplication.snapshotRetailValue,
      snapshotLoanValue: loanApplication.snapshotLoanValue,
      valuationFetchedAt: loanApplication.valuationFetchedAt,
      requestedDownPaymentPct: loanApplication.requestedDownPaymentPct,
      requestedTermMonths: loanApplication.requestedTermMonths,
      desiredMonthlyPayment: loanApplication.desiredMonthlyPayment,
      desiredInterestRate: loanApplication.desiredInterestRate,
      currency: loanApplication.currency,
      ltvCap: loanApplication.ltvCap,
      plannedDownAmount: loanApplication.plannedDownAmount,
      initialNeeded: loanApplication.initialNeeded,
      maxFinance: loanApplication.maxFinance,
      validatedLoanAmount: loanApplication.validatedLoanAmount,
      requiredExtraDown: loanApplication.requiredExtraDown,
      impliedMonthlyPayment: loanApplication.impliedMonthlyPayment,
      impliedTotalInterest: loanApplication.impliedTotalInterest,
      eligibilityStatus: loanApplication.eligibilityStatus,
      eligibilityReasons: loanApplication.eligibilityReasons,
      status: loanApplication.status,
      isGuest: loanApplication.isGuest,
      createdAt: loanApplication.createdAt,
      updatedAt: loanApplication.updatedAt,
    };
  }

  static toResponseDtoArray(loanApplications: LoanApplication[]): LoanApplicationResponseDto[] {
    return loanApplications.map(app => this.toResponseDto(app));
  }
}

