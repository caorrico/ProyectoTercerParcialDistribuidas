export interface NotificationEvent {
  eventId: string;
  eventType: string;
  microservice: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  message?: string;
  timestamp: string;
  severity?: 'INFO' | 'WARN' | 'ERROR';
  data?: Record<string, unknown>;
}
