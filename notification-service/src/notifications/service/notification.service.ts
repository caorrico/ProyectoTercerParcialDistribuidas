import { AppDataSource } from '../../utils/database';
import { Notification, Severity } from '../entity/Notification.entity';
import { NotificationEvent } from '../../rabbitmq/interfaces/notification-event.interface';

export class NotificationService {
  private notificationRepository = AppDataSource.getRepository(Notification);

  async createFromEvent(event: NotificationEvent): Promise<Notification> {
    // Verificar si ya existe (idempotencia)
    const existing = await this.notificationRepository.findOne({
      where: { eventId: event.id }
    });

    if (existing) {
      console.log(`Evento ${event.id} ya procesado, ignorando...`);
      return existing;
    }

    const notification = this.notificationRepository.create({
      eventId: event.id,
      microservice: event.microservice,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      message: event.message,
      severity: event.severity as Severity,
      eventTimestamp: new Date(event.timestamp),
      data: event.data,
      processed: false
    });

    await this.notificationRepository.save(notification);
    console.log(`📥 Notificación guardada: ${event.action} - ${event.message}`);

    return notification;
  }

  async markAsProcessed(id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) {
      throw new Error('Notificación no encontrada');
    }

    notification.processed = true;
    notification.processedAt = new Date();
    return this.notificationRepository.save(notification);
  }

  async findAll(limit: number = 100): Promise<Notification[]> {
    return this.notificationRepository.find({
      order: { createdAt: 'DESC' },
      take: limit
    });
  }

  async findByMicroservice(microservice: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { microservice },
      order: { createdAt: 'DESC' }
    });
  }

  async findBySeverity(severity: Severity): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { severity },
      order: { createdAt: 'DESC' }
    });
  }

  async findUnprocessed(): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { processed: false },
      order: { createdAt: 'DESC' }
    });
  }

  async getStatistics(): Promise<{
    total: number;
    byMicroservice: { microservice: string; count: number }[];
    bySeverity: { severity: string; count: number }[];
    processed: number;
    pending: number;
  }> {
    const total = await this.notificationRepository.count();
    const processed = await this.notificationRepository.count({ where: { processed: true } });
    const pending = await this.notificationRepository.count({ where: { processed: false } });

    const byMicroserviceRaw = await this.notificationRepository
      .createQueryBuilder('n')
      .select('n.microservice', 'microservice')
      .addSelect('COUNT(*)', 'count')
      .groupBy('n.microservice')
      .getRawMany();

    const bySeverityRaw = await this.notificationRepository
      .createQueryBuilder('n')
      .select('n.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('n.severity')
      .getRawMany();

    return {
      total,
      processed,
      pending,
      byMicroservice: byMicroserviceRaw.map(r => ({ microservice: r.microservice, count: parseInt(r.count) })),
      bySeverity: bySeverityRaw.map(r => ({ severity: r.severity, count: parseInt(r.count) }))
    };
  }
}

export const notificationService = new NotificationService();
