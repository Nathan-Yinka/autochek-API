import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EvaluateVehicleDto {
  @ApiProperty({ example: '5FRYD4H66GB592800', description: 'Vehicle Identification Number' })
  @IsString()
  vin: string;

  @ApiPropertyOptional({ example: 50000, description: 'Current vehicle mileage' })
  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;
}

