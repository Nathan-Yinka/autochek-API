import { Controller, Get, UseGuards, ClassSerializerInterceptor, UseInterceptors, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UserFilterDto } from './dto/user-filter.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiEndpoint('Get current user profile', 'User profile retrieved successfully')
  async getProfile(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiEndpoint(
    'Get all users with filters (Admin only)',
    'Users retrieved successfully',
    200,
    [{ status: 403, description: 'Admin access required' }],
  )
  async findAll(@Query() filterDto: UserFilterDto): Promise<PaginatedResponse<User>> {
    return this.usersService.findAllWithFilters(filterDto);
  }
}
