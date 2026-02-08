import { AppDataSource } from '../../utils/database';
import { Notification, Severity } from '../entity/Notification.entity';
import { NotificationEvent } from '../../rabbitmq/interfaces/notification-event.interface';

export class NotificationService {
  private notificationRepository = AppDataSource.getRepository(Notification);

  async createFromEvent(event: NotificationEvent): Promise<Notification> {
    // Verificar si ya existe (idempotencia)
    const existing = await this.notificationRepository.findOne({
      where: { eventId: event.eventId }
    });

    if (existing) {
      console.log(`✅ Evento ${event.eventId} ya procesado, ignorando...`);
      return existing;
    }

    // Determinar los valores basándose en eventType si no vienen en el evento
    let action = event.action || event.eventType?.toUpperCase().replace('.', '_') || 'UNKNOWN';
    let entityType = event.entityType || 'UNKNOWN';
    let message = event.message || `Event: ${event.eventType}`;
    let severity = (event.severity || 'INFO') as Severity;
    let entityId = event.entityId || '';

    // Si el evento viene de usuario.*, extraer información
    if (event.microservice === 'auth-service' && event.data) {
      entityType = 'USUARIO';
      entityId = (event.data.usuarioId as string) || 'unknown';
      if (event.eventType === 'usuario.creado') {
        action = 'USUARIO_CREADO';
        message = `Usuario creado: ${event.data.username || 'desconocido'}`;
      } else if (event.eventType === 'usuario.actualizado') {
        action = 'USUARIO_ACTUALIZADO';
        message = `Usuario actualizado: ${event.data.username || 'desconocido'}`;
      } else if (event.eventType === 'usuario.desactivado') {
        action = 'USUARIO_DESACTIVADO';
        message = `Usuario desactivado: ${event.data.username || 'desconocido'}`;
      }
    }

    const notification = this.notificationRepository.create({
      eventId: event.eventId,
      microservice: event.microservice,
      action,
      entityType,
      entityId,
      message,
      severity,
      eventTimestamp: new Date(event.timestamp),
      data: event.data,
      processed: false
    });

    await this.notificationRepository.save(notification);
    console.log(`📝 Notificación guardada: ${action} - ${message}`);

    return notification;
  }

  async markAsProcessed(id: string): Promise<Notification> {
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
