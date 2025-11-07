import { IsString, IsNumber, IsOptional, IsEmail, Min, Max, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '../../common/enums/currency.enum';

export class CreateLoanApplicationDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  vehicleId: string;

  @ApiProperty({ example: 'Test User' })
  @IsString()
  applicantName: string;

  @ApiProperty({ example: 'tester@test.com' })
  @IsEmail()
  applicantEmail: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  applicantPhone?: string;

  @ApiProperty({ example: '12345678901', description: 'Bank Verification Number' })
  @IsString()
  bvn: string;

  @ApiPropertyOptional({ example: '12345678901', description: 'National Identification Number' })
  @IsOptional()
  @IsString()
  nin?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: '123 Main Street, Lagos, Nigeria' })
  @IsOptional()
  @IsString()
  residentialAddress?: string;

  @ApiProperty({ example: 5000000, description: 'Requested loan amount in NGN' })
  @IsNumber()
  @Min(100000)
  requestedLoanAmount: number;

  @ApiPropertyOptional({ example: 0.20, description: 'Down payment as percentage (0.20 = 20%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  requestedDownPaymentPct?: number;

  @ApiPropertyOptional({ example: 1000000, description: 'Down payment amount in NGN' })
  @IsOptional()
  @IsNumber()
  requestedDownPaymentAmount?: number;

  @ApiProperty({ example: 48, description: 'Loan term in months' })
  @IsNumber()
  @Min(12)
  @Max(84)
  requestedTermMonths: number;

  @ApiPropertyOptional({ example: 0.18, description: 'Requested APR (0.18 = 18%)' })
  @IsOptional()
  @IsNumber()
  requestedApr?: number;

  @ApiPropertyOptional({ 
    example: Currency.NGN, 
    description: 'Desired loan currency (only NGN supported currently)', 
    default: Currency.NGN,
    enum: Currency 
  })
  @IsOptional()
  @IsEnum(Currency, { message: 'Only NGN currency is supported at this time' })
  desiredLoanCurrency?: Currency;

  @ApiPropertyOptional({ example: 350000, description: 'Desired monthly payment in NGN' })
  @IsOptional()
  @IsNumber()
  desiredMonthlyPayment?: number;

  @ApiPropertyOptional({ example: 28, description: 'Desired interest rate percentage' })
  @IsOptional()
  @IsNumber()
  desiredInterestRate?: number;

  @ApiPropertyOptional({ example: 3000000, description: 'Desired equity contribution (down payment) in NGN' })
  @IsOptional()
  @IsNumber()
  desiredEquityContribution?: number;

  @ApiPropertyOptional({ example: 'Floating/Variable', description: 'Interest rate type' })
  @IsOptional()
  @IsString()
  interestRateType?: string;

  @ApiPropertyOptional({ example: 0, description: 'Desired residual/balloon percentage (0-100)' })
  @IsOptional()
  @IsNumber()
  desiredResidualBalloonPct?: number;

  @ApiPropertyOptional({ example: 15, description: 'Desired repayment date (day of month 1-31)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  desiredRepaymentDate?: number;

  @ApiPropertyOptional({ example: true, description: 'Subscribe to roadworthiness for full loan term' })
  @IsOptional()
  subscribeRoadworthiness?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Subscribe to license renewal for full loan term' })
  @IsOptional()
  subscribeLicenseRenewal?: boolean;

  @ApiPropertyOptional({ example: 'Upfront', description: 'Fee payment preference: Upfront or Monthly', enum: ['Upfront', 'Monthly'] })
  @IsOptional()
  @IsString()
  feePaymentPreference?: string;

  @ApiPropertyOptional({ 
    example: ['Vehicle Registration', 'Insurance (First 12 months)'],
    description: 'Items to pay upfront instead of financing',
    type: [String],
  })
  @IsOptional()
  upfrontPaymentItems?: string[];
}

