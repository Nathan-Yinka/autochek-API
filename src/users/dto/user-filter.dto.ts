import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';

export class UserFilterDto {
  @ApiPropertyOptional({
    example: 'John',
    description: 'Search by name or email (case-insensitive)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: [...Object.values(UserRole), 'all'],
    example: UserRole.USER,
    description: 'Filter by user role (default: USER). Use "all" to get all roles',
    default: UserRole.USER,
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Items per page',
    default: 10,
  })
  @IsOptional()
  @IsString()
  limit?: string;
}

