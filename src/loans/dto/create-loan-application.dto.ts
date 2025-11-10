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

  @ApiProperty({ example: 0.40, description: 'Down payment as percentage (0.40 = 40%)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  requestedDownPaymentPct: number;

  @ApiProperty({ example: 48, description: 'Desired loan term in months' })
  @IsNumber()
  @Min(12)
  @Max(84)
  requestedTermMonths: number;

  @ApiProperty({ example: 125000, description: 'Desired monthly payment in NGN - what the applicant can afford to pay monthly' })
  @IsNumber()
  @Min(0)
  desiredMonthlyPayment: number;

  @ApiProperty({ example: 0.18, description: 'Desired interest rate as decimal (0.18 = 18%) - what the applicant hopes for' })
  @IsNumber()
  @Min(0)
  @Max(1)
  desiredInterestRate: number;
}

