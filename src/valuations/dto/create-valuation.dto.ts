import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateValuationDto {
  @ApiProperty({ example: '5FRYD4H66GB592800' })
  @IsString()
  vin: string;
}
