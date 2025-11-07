/**
 * WebSocket Event Types
 * Used for real-time communication between server and clients
 */
export enum SocketEvent {
  // Connection events
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  
  // Heartbeat
  PING = 'ping',
  PONG = 'pong',

  // Notification event
  NOTIFICATION = 'notification',
  
  // Error event
  ERROR = 'error',
}

/**
 * Notification Types
 * Specific types of notifications sent through WebSocket
 */
export enum NotificationType {
  // Loan application notifications
  LOAN_SUBMITTED = 'loan_submitted',
  LOAN_STATUS_UPDATED = 'loan_status_updated',
  LOAN_APPROVED = 'loan_approved',
  LOAN_REJECTED = 'loan_rejected',
  
  // Offer notifications
  OFFER_CREATED = 'offer_created',
  OFFER_ACCEPTED = 'offer_accepted',
  OFFER_DECLINED = 'offer_declined',
  OFFER_EXPIRED = 'offer_expired',
  
  // General notifications
  SYSTEM_ALERT = 'system_alert',
}

