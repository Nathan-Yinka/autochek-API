import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OfferStatus } from '../entities/offer.entity';
import { UserSummaryDto } from '../../loans/dto/user-summary.dto';

export class OfferResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Loan application ID' })
  loanApplicationId: string;

  @ApiPropertyOptional({ type: UserSummaryDto, description: 'Admin who created the offer' })
  admin?: UserSummaryDto;

  @ApiProperty({ example: 'BACKOFFICE', description: 'Lender/institution code' })
  lenderCode: string;

  @ApiProperty({ example: 3000000, description: 'Offered loan amount in NGN' })
  offeredLoanAmount: number;

  @ApiProperty({ example: 0.18, description: 'Annual Percentage Rate (APR) - 0.18 = 18%' })
  apr: number;

  @ApiProperty({ example: 48, description: 'Loan term in months' })
  termMonths: number;

  @ApiProperty({ example: 125000, description: 'Monthly payment amount' })
  monthlyPayment: number;

  @ApiProperty({ example: 1000000, description: 'Total interest over loan term' })
  totalInterest: number;

  @ApiPropertyOptional({ example: 0.63, description: 'Loan-to-Value ratio at offer time' })
  ltvAtOffer?: number;

  @ApiProperty({ example: 'ISSUED', enum: OfferStatus })
  status: OfferStatus;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z', description: 'When the offer expires' })
  expiresAt?: Date;

  @ApiPropertyOptional({ example: 'Special promotion rate', description: 'Additional notes about the offer' })
  notes?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;
}

