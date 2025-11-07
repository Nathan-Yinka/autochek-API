import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { VehicleStatus } from '../entities/vehicle.entity';

export class VehicleFilterDto extends PaginationDto {
  @ApiPropertyOptional({ 
    description: 'Filter by vehicle status (comma-separated for multiple: LISTED,INSPECTED). Use "all" to show all statuses. Default: LISTED,INSPECTED',
    enum: [...Object.values(VehicleStatus), 'all']
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by owner ID (e.g., uuid). Use "owner" to get vehicles posted by authenticated user'
  })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ 
    description: 'Search by make, model, or VIN (e.g., "Toyota Camry")'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by vehicle make (e.g., Toyota, Honda, Ford)'
  })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by vehicle type (e.g., foreign_used, local_used, brand_new)'
  })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by region (e.g., Lagos, Abuja, Port Harcourt)'
  })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by minimum year (e.g., 2020)'
  })
  @IsOptional()
  minYear?: number;

  @ApiPropertyOptional({ 
    description: 'Filter by maximum year (e.g., 2024)'
  })
  @IsOptional()
  maxYear?: number;

  @ApiPropertyOptional({ 
    description: 'Filter by minimum listing price (e.g., 1000000)'
  })
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ 
    description: 'Filter by maximum listing price (e.g., 10000000)'
  })
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ 
    description: 'Filter by loan availability (e.g., true or false)'
  })
  @IsOptional()
  @IsString()
  isLoanAvailable?: string;
}

