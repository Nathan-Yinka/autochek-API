import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserRole } from '../common/enums/user-role.enum';
import { SocketEvent } from '../common/enums/socket-events.enum';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('NotificationsGateway');

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization;
      
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Check if requesting admin room only
      const adminOnly = client.handshake.query.admin === 'true' || client.handshake.auth.admin === true;

      if (adminOnly) {
        // Verify user is admin
        if (user.role !== UserRole.ADMIN) {
          this.logger.warn(`Non-admin user ${user.email} attempted to join admin room`);
          throw new ForbiddenException('Admin access required to connect to admin notifications');
        }

        // Join only admin room (not user-specific room)
        client.data.user = user;
        client.data.adminOnly = true;
        await client.join('admins');
        
        this.logger.log(`Admin ${user.email} connected to admin room only: ${client.id}`);
        
        client.emit(SocketEvent.CONNECTION, {
          message: 'Connected to admin notifications',
          userId: user.id,
          role: user.role,
          adminOnly: true,
        });
      } else {
        // Normal connection - join user room ONLY (not admin room)
        client.data.user = user;
        client.data.adminOnly = false;
        
        const userRoom = `user:${user.id}`;
        await client.join(userRoom);

        this.logger.log(`User ${user.email} connected to personal room: ${client.id}`);

        client.emit(SocketEvent.CONNECTION, {
          message: 'Connected to notifications',
          userId: user.id,
          role: user.role,
          adminOnly: false,
        });
      }
    } catch (error) {
      this.logger.error(`Connection failed: ${error.message}`);
      client.emit(SocketEvent.ERROR, { 
        message: error.message || 'Authentication failed',
        statusCode: error instanceof ForbiddenException ? 403 : 401
      });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      this.logger.log(`User ${user.email} disconnected: ${client.id}`);
    }
  }

  sendNotificationToUser(userId: string, notification: any): void {
    const userRoom = `user:${userId}`;
    this.server.to(userRoom).emit(SocketEvent.NOTIFICATION, notification);
    this.logger.log(`Notification sent to all devices of user ${userId}`);
  }

  sendToAdmins(notification: any): void {
    this.server.to('admins').emit(SocketEvent.NOTIFICATION, notification);
    this.logger.log('Notification sent to all admin devices');
  }

  @SubscribeMessage(SocketEvent.PING)
  handlePing(client: Socket): void {
    client.emit(SocketEvent.PONG, { timestamp: new Date().toISOString() });
  }
}
