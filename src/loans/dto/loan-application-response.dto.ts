import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoanApplicationStatus, EligibilityStatus } from '../entities/loan-application.entity';
import { Currency } from '../../common/enums/currency.enum';
import { UserSummaryDto } from './user-summary.dto';

export class LoanApplicationResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiPropertyOptional({ type: UserSummaryDto })
  user?: UserSummaryDto;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Vehicle ID' })
  vehicleId: string;

  @ApiProperty({ example: 'John Doe' })
  applicantName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  applicantEmail: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  applicantPhone?: string;

  // Pricing & Valuation
  @ApiProperty({ example: 5000000, description: 'Vehicle listing price' })
  listingPrice: number;

  @ApiPropertyOptional({ example: 5000000, description: 'Retail market value snapshot' })
  snapshotRetailValue?: number;

  @ApiPropertyOptional({ example: 4750000, description: 'Loan value snapshot' })
  snapshotLoanValue?: number;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z', description: 'When valuation was fetched' })
  valuationFetchedAt?: Date;

  // Loan Request Details
  @ApiProperty({ example: 0.40, description: 'Down payment percentage (0.40 = 40%)' })
  requestedDownPaymentPct: number;

  @ApiProperty({ example: 48, description: 'Desired loan term in months' })
  requestedTermMonths: number;

  @ApiProperty({ example: 125000, description: 'Desired monthly payment (applicant preference)' })
  desiredMonthlyPayment: number;

  @ApiProperty({ example: 0.18, description: 'Desired interest rate (applicant preference)' })
  desiredInterestRate: number;

  @ApiProperty({ example: Currency.NGN, enum: Currency })
  currency: Currency;

  // Loan Calculations
  @ApiProperty({ example: 1.10, description: 'Loan-to-Value cap applied' })
  ltvCap: number;

  @ApiPropertyOptional({ example: 2000000, description: 'Planned down payment amount' })
  plannedDownAmount?: number;

  @ApiPropertyOptional({ example: 3000000, description: 'Initial loan amount needed' })
  initialNeeded?: number;

  @ApiPropertyOptional({ example: 5225000, description: 'Maximum financeable amount' })
  maxFinance?: number;

  @ApiPropertyOptional({ example: 3000000, description: 'Validated loan amount' })
  validatedLoanAmount?: number;

  @ApiPropertyOptional({ example: 0, description: 'Additional down payment required' })
  requiredExtraDown?: number;

  @ApiPropertyOptional({ example: 125000, description: 'Estimated monthly payment' })
  impliedMonthlyPayment?: number;

  @ApiPropertyOptional({ example: 1000000, description: 'Estimated total interest' })
  impliedTotalInterest?: number;

  // Eligibility
  @ApiPropertyOptional({ example: 'ELIGIBLE', enum: EligibilityStatus })
  eligibilityStatus?: EligibilityStatus;

  @ApiPropertyOptional({ example: 'All requirements met', description: 'Eligibility details' })
  eligibilityReasons?: string;

  // Application Status
  @ApiProperty({ example: 'SUBMITTED', enum: LoanApplicationStatus })
  status: LoanApplicationStatus;

  @ApiProperty({ example: false, description: 'Whether this is a guest application' })
  isGuest: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;
}

