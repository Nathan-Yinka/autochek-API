import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateValuationDto {
  @ApiProperty({ example: '1HGCM82633A123456' })
  @IsString()
  vin: string;
}
