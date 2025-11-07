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
    });

    const saved = await this.notificationsRepository.save(notification);

    this.notificationsGateway.sendNotificationToUser(userId, saved);

    return saved;
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.findByUserId(userId);
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({ 
      where: { id, userId } 
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
    const adminUsers = await this.notificationsRepository.manager
      .createQueryBuilder()
      .select('user.id')
      .from('users', 'user')
      .where('user.role = :role', { role: 'admin' })
      .getRawMany();

    const notification = {
      type: NotificationType.LOAN_SUBMITTED,
      title: 'New Loan Application',
      message: `${userName} applied for a loan of $${amount.toLocaleString()}. Review required.`,
      data: { loanId, amount },
    };

    for (const admin of adminUsers) {
      await this.create(
        admin.user_id,
        NotificationType.LOAN_SUBMITTED,
        notification.title,
        notification.message,
        notification.data,
      );
    }

    this.notificationsGateway.sendToAdmins(notification);
  }

  async notifyOfferAccepted(
    adminId: string | undefined,
    offerId: string,
    amount: number,
    userId: string,
  ): Promise<void> {
    // Notify admin if adminId is provided
    if (adminId) {
      await this.create(
        adminId,
        NotificationType.OFFER_ACCEPTED,
        'Offer Accepted',
        `A user has accepted an offer for $${amount.toLocaleString()}. Proceed with disbursement.`,
        { offerId, amount, userId },
      );
    }

    // Also notify all other admins
    const adminUsers = await this.notificationsRepository.manager
      .createQueryBuilder()
      .select('user.id')
      .from('users', 'user')
      .where('user.role = :role', { role: 'admin' })
      .andWhere('user.id != :adminId', { adminId: adminId || 'none' })
      .getRawMany();

    const notification = {
      type: NotificationType.OFFER_ACCEPTED,
      title: 'Offer Accepted',
      message: `A user has accepted an offer for $${amount.toLocaleString()}. Review and process.`,
      data: { offerId, amount, userId },
    };

    for (const admin of adminUsers) {
      await this.create(
        admin.user_id,
        NotificationType.OFFER_ACCEPTED,
        notification.title,
        notification.message,
        notification.data,
      );
    }

    this.notificationsGateway.sendToAdmins(notification);
  }
}
