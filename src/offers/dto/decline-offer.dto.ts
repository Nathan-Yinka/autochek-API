import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DeclineOfferDto {
  @ApiPropertyOptional({
    example: 'Interest rate is too high for my budget',
    description: 'Reason for declining the offer',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Decline note cannot exceed 500 characters' })
  note?: string;
}

