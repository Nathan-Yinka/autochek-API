import { Controller, Get, Param, Patch, UseGuards, ParseUUIDPipe, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { BulkReadDto } from './dto/bulk-read.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiEndpoint('Get user notifications', 'Notifications retrieved successfully')
  async getUserNotifications(@CurrentUser() user: User): Promise<Notification[]> {
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

