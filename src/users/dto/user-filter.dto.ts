import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';

export class UserFilterDto {
  @ApiPropertyOptional({
    description: 'Search by name or email (e.g., "John" or "john@example.com")',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: [...Object.values(UserRole), 'all'],
    description: 'Filter by user role (e.g., "admin", "user"). Use "all" to get all roles',
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: 'Page number (e.g., 1, 2, 3...)',
  })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Items per page (e.g., 10, 20, 50)',
  })
  @IsOptional()
  @IsString()
  limit?: string;
}

