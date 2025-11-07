import { IsString, IsInt, IsNumber, Min, Max, IsOptional, IsBoolean, IsEnum, IsArray, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType, DriveType } from '../entities/vehicle.entity';
import { Currency } from '../../common/enums/currency.enum';

export class CreateVehicleDto {
  @ApiProperty({ example: '5FRYD4H66GB592800', description: 'Vehicle Identification Number' })
  @IsString()
  vin: string;

  @ApiProperty({ example: 'Toyota', description: 'Vehicle manufacturer' })
  @IsString()
  make: string;

  @ApiProperty({ example: 'Camry', description: 'Vehicle model' })
  @IsString()
  model: string;

  @ApiProperty({ example: 2020, description: 'Manufacturing year' })
  @IsInt()
  @Min(1900)
  @Max(2030)
  year: number;

  @ApiProperty({ example: 25000, description: 'Current mileage' })
  @IsInt()
  @Min(0)
  mileage: number;

  @ApiPropertyOptional({ example: 'foreign_used', description: 'Vehicle type', enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional({ example: 'LE', description: 'Vehicle trim level' })
  @IsOptional()
  @IsString()
  trim?: string;

  @ApiPropertyOptional({ example: 'Excellent condition', description: 'Vehicle condition description' })
  @IsOptional()
  @IsString()
  condition?: string;

  // Technical Specifications
  @ApiPropertyOptional({ example: 'V6 3.5L', description: 'Engine specification' })
  @IsOptional()
  @IsString()
  engine?: string;

  @ApiPropertyOptional({ example: 'Automatic', description: 'Transmission type' })
  @IsOptional()
  @IsString()
  transmission?: string;

  @ApiPropertyOptional({ example: 'automatic', description: 'Drive type', enum: DriveType })
  @IsOptional()
  @IsEnum(DriveType)
  driveType?: DriveType;

  @ApiPropertyOptional({ example: 'petrol', description: 'Fuel type' })
  @IsOptional()
  @IsString()
  fuelType?: string;

  // Appearance
  @ApiPropertyOptional({ example: 'Silver', description: 'Exterior color' })
  @IsOptional()
  @IsString()
  exteriorColor?: string;

  @ApiPropertyOptional({ example: 'Black', description: 'Interior color' })
  @IsOptional()
  @IsString()
  interiorColor?: string;

  // Location
  @ApiPropertyOptional({ example: '123 Victoria Island, Lagos', description: 'Physical location of vehicle' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Lagos', description: 'Geographic region of the vehicle' })
  @IsOptional()
  @IsString()
  region?: string;

  // Pricing
  @ApiPropertyOptional({ example: 5000000, description: 'Asking price in NGN' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  listingPrice?: number;

  @ApiPropertyOptional({ 
    example: Currency.NGN, 
    description: 'Currency of listing price (only NGN supported currently)', 
    default: Currency.NGN,
    enum: Currency 
  })
  @IsOptional()
  @IsEnum(Currency, { message: 'Only NGN currency is supported at this time' })
  currency?: Currency;

  @ApiPropertyOptional({ example: 0.40, description: 'Required down payment percentage (0.40 = 40%)', default: 0.40 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  requiredDownPaymentPct?: number;

  // Valuation (can be auto-filled from evaluate endpoint)
  @ApiPropertyOptional({ example: 5000000, description: 'Retail market value' })
  @IsOptional()
  @IsNumber()
  retailValue?: number;

  @ApiPropertyOptional({ 
    example: 4750000, 
    description: 'Loan value (REQUIRED if isLoanAvailable=true)' 
  })
  @ValidateIf(o => o.isLoanAvailable === true)
  @IsNumber()
  loanValue?: number;

  // Loan Configuration
  @ApiPropertyOptional({ example: true, description: 'Whether loan financing is available for this vehicle', default: true })
  @IsOptional()
  @IsBoolean()
  isLoanAvailable?: boolean;

  @ApiPropertyOptional({ 
    example: 500000, 
    description: 'Minimum loan amount (REQUIRED if isLoanAvailable=true)' 
  })
  @ValidateIf(o => o.isLoanAvailable === true)
  @IsNumber()
  @Min(0)
  minLoanValue?: number;

  @ApiPropertyOptional({ 
    example: 60, 
    description: 'Maximum loan period in months (REQUIRED if isLoanAvailable=true)' 
  })
  @ValidateIf(o => o.isLoanAvailable === true)
  @IsInt()
  @Min(12)
  @Max(120)
  maxLoanPeriodMonths?: number;
}
