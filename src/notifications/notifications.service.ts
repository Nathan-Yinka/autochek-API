import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationType, SocketEvent } from '../common/enums/socket-events.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      userId,
      type,
      title,
      message,
      data,
      isAdmin: false,
    });

    const saved = await this.notificationsRepository.save(notification);

    this.notificationsGateway.sendNotificationToUser(userId, saved);

    return saved;
  }

  async createAdminNotification(
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      userId: undefined,
      type,
      title,
      message,
      data,
      isAdmin: true,
    });

    const saved = await this.notificationsRepository.save(notification);

    // Send to all admins via WebSocket
    this.notificationsGateway.sendToAdmins(saved);

    return saved;
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId, isAdmin: false },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.findByUserId(userId);
  }

  async getAdminNotifications(): Promise<Notification[]> {
    // Simply fetch all notifications where isAdmin = true
    return this.notificationsRepository.find({
      where: { isAdmin: true },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({ 
      where: { id, userId, isAdmin: false } 
    });
    if (!notification) {
      throw new Error('Notification not found');
    }
    notification.read = true;
    return this.notificationsRepository.save(notification);
  }

  async markMultipleAsRead(notificationIds: string[], userId: string): Promise<{ updated: number }> {
    const result = await this.notificationsRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ read: true })
      .where('id IN (:...ids)', { ids: notificationIds })
      .andWhere('userId = :userId', { userId })
      .andWhere('isAdmin = :isAdmin', { isAdmin: false })
      .execute();

    return { updated: result.affected || 0 };
  }

  async notifyLoanSubmitted(userId: string, loanId: string, amount: number): Promise<void> {
    await this.create(
      userId,
      NotificationType.LOAN_SUBMITTED,
      'Loan Application Submitted',
      `Your loan application for $${amount.toLocaleString()} has been submitted and is under review.`,
      { loanId, amount },
    );
  }

  async notifyLoanApproved(userId: string, loanId: string, amount: number): Promise<void> {
    await this.create(
      userId,
      NotificationType.LOAN_APPROVED,
      'Loan Approved!',
      `Great news! Your loan application for $${amount.toLocaleString()} has been approved. Check your offers.`,
      { loanId, amount },
    );
  }

  async notifyLoanRejected(userId: string, loanId: string, reason: string): Promise<void> {
    await this.create(
      userId,
      NotificationType.LOAN_REJECTED,
      'Loan Application Update',
      `Your loan application was not approved. Reason: ${reason}`,
      { loanId, reason },
    );
  }

  async notifyOfferCreated(userId: string, offerId: string, monthlyPayment: number): Promise<void> {
    await this.create(
      userId,
      NotificationType.OFFER_CREATED,
      'New Financing Offer Available',
      `You have a new financing offer with monthly payments of $${monthlyPayment.toFixed(2)}. Review and accept to proceed.`,
      { offerId, monthlyPayment },
    );
  }

  async notifyAdminNewLoan(loanId: string, userName: string, amount: number): Promise<void> {
    // Create ONE notification for all admins
    await this.createAdminNotification(
      NotificationType.LOAN_SUBMITTED,
      'New Loan Application',
      `${userName} applied for a loan of ₦${amount.toLocaleString()}. Review required.`,
      { loanId, amount, userName },
    );
  }

  async notifyOfferAccepted(
    adminId: string | undefined,
    offerId: string,
    amount: number,
    userId: string,
  ): Promise<void> {
    // Create ONE notification for all admins
    await this.createAdminNotification(
      NotificationType.OFFER_ACCEPTED,
      'Offer Accepted',
      `A user has accepted an offer for ₦${amount.toLocaleString()}. Proceed with disbursement.`,
      { offerId, amount, userId },
    );
  }
}
