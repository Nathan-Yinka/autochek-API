import { IsString, IsNumber, IsOptional, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOfferDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  loanApplicationId: string;

  @ApiPropertyOptional({ example: 'BACKOFFICE', description: 'Lender code or queue identifier' })
  @IsOptional()
  @IsString()
  lenderCode?: string;

  @ApiProperty({ example: 4500000, description: 'Approved loan amount in NGN' })
  @IsNumber()
  @Min(100000)
  offeredLoanAmount: number;

  @ApiProperty({ example: 0.18, description: 'Annual Percentage Rate (0.18 = 18%)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  apr: number;

  @ApiProperty({ example: 48, description: 'Loan term in months' })
  @IsNumber()
  @Min(12)
  @Max(84)
  termMonths: number;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z', description: 'Offer expiration date' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ example: 'Special offer for premium customer' })
  @IsOptional()
  @IsString()
  notes?: string;
}
