import { Controller, Get, Param, Patch, UseGuards, ParseUUIDPipe, Body, Query, ForbiddenException, ParseBoolPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { BulkReadDto } from './dto/bulk-read.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiEndpoint('Get notifications', 'Notifications retrieved successfully')
  @ApiQuery({ 
    name: 'admin', 
    required: false, 
    type: Boolean, 
    description: 'Set to true to fetch admin notifications (requires admin role)',
    example: false
  })
  async getUserNotifications(
    @CurrentUser() user: User,
    @Query('admin', new ParseBoolPipe({ optional: true })) isAdmin?: boolean,
  ): Promise<Notification[]> {
    // If requesting admin notifications
    if (isAdmin === true) {
      // Check if user is admin
      if (user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Admin access required to view admin notifications');
      }
      return this.notificationsService.getAdminNotifications();
    }
    
    // Return user's own notifications
    return this.notificationsService.getUserNotifications(user.id);
  }

  @Patch(':id/read')
  @ApiEndpoint('Mark notification as read', 'Notification marked as read')
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('bulk/read')
  @ApiEndpoint('Mark multiple notifications as read', 'Notifications marked as read')
  async markMultipleAsRead(
    @Body() bulkReadDto: BulkReadDto,
    @CurrentUser() user: User,
  ): Promise<{ updated: number }> {
    return this.notificationsService.markMultipleAsRead(
      bulkReadDto.notificationIds,
      user.id,
    );
  }
}

