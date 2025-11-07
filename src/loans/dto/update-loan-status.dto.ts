import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoanApplicationStatus } from '../entities/loan-application.entity';

export class UpdateLoanStatusDto {
  @ApiProperty({ enum: LoanApplicationStatus, example: LoanApplicationStatus.APPROVED })
  @IsEnum(LoanApplicationStatus)
  status: LoanApplicationStatus;

  @ApiPropertyOptional({ example: 'Insufficient credit history' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
