import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OfferStatus } from '../entities/offer.entity';

export class UpdateOfferStatusDto {
  @ApiProperty({ enum: OfferStatus, example: OfferStatus.ACCEPTED })
  @IsEnum(OfferStatus)
  status: OfferStatus;
}
