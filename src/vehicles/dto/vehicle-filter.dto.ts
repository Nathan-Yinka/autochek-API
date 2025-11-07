import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { VehicleStatus } from '../entities/vehicle.entity';

export class VehicleFilterDto extends PaginationDto {
  @ApiPropertyOptional({ 
    example: 'LISTED', 
    description: 'Filter by vehicle status (comma-separated for multiple: LISTED,INSPECTED). Use "all" to show all statuses. Default: LISTED,INSPECTED',
    enum: [...Object.values(VehicleStatus), 'all']
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ 
    example: 'owner', 
    description: 'Filter by owner - use "owner" to get vehicles posted by authenticated user, or provide specific userId'
  })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ 
    example: 'Toyota Camry', 
    description: 'Search by make, model, or VIN'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    example: 'Toyota', 
    description: 'Filter by vehicle make'
  })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional({ 
    example: 'foreign_used', 
    description: 'Filter by vehicle type'
  })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional({ 
    example: 'Lagos', 
    description: 'Filter by region'
  })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ 
    example: 2020, 
    description: 'Filter by minimum year'
  })
  @IsOptional()
  minYear?: number;

  @ApiPropertyOptional({ 
    example: 2024, 
    description: 'Filter by maximum year'
  })
  @IsOptional()
  maxYear?: number;

  @ApiPropertyOptional({ 
    example: 1000000, 
    description: 'Filter by minimum listing price'
  })
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ 
    example: 10000000, 
    description: 'Filter by maximum listing price'
  })
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ 
    example: 'true', 
    description: 'Filter by loan availability (true/false)'
  })
  @IsOptional()
  @IsString()
  isLoanAvailable?: string;
}

