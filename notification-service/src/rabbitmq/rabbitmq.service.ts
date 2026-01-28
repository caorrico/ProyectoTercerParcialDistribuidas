import amqp, { Channel, Connection, ConsumeMessage } from 'amqplib';
import { notificationService } from '../notifications/service/notification.service';
import { NotificationEvent } from './interfaces/notification-event.interface';
import dotenv from 'dotenv';

dotenv.config();

const EXCHANGE_NAME = 'logiflow.events';
const NOTIFICATION_QUEUE = 'notifications.queue';

// Routing keys que escucha este servicio
const ROUTING_PATTERNS = [
  'pedido.*',
  'vehiculo.*',
  'repartidor.*',
  'factura.*'
];

let connection: Connection | null = null;
let channel: Channel | null = null;

export const connectAndConsume = async (): Promise<void> => {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    connection = await amqp.connect(rabbitUrl);
    channel = await connection.createChannel();

    // Configurar exchange
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

    // Configurar cola
    await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });

    // Vincular cola con patrones de routing
    for (const pattern of ROUTING_PATTERNS) {
      await channel.bindQueue(NOTIFICATION_QUEUE, EXCHANGE_NAME, pattern);
      console.log(`📌 Vinculado a patrón: ${pattern}`);
    }

    // Prefetch para control de carga
    await channel.prefetch(10);

    // Iniciar consumo
    await channel.consume(NOTIFICATION_QUEUE, handleMessage, { noAck: false });

    console.log('✅ Notification Service conectado a RabbitMQ');
    console.log(`🎧 Escuchando en cola: ${NOTIFICATION_QUEUE}`);

  } catch (error) {
    console.error('❌ Error al conectar con RabbitMQ:', error);
    throw error;
  }
};

const handleMessage = async (msg: ConsumeMessage | null): Promise<void> => {
  if (!msg || !channel) return;

  try {
    const content = msg.content.toString();
    const event: NotificationEvent = JSON.parse(content);

    console.log(`📨 Mensaje recibido: ${event.action} de ${event.microservice}`);

    // Guardar en base de datos
    await notificationService.createFromEvent(event);

    // Simular envío de notificación (SMS, email, push)
    await simulateNotificationSend(event);

    // ACK - mensaje procesado correctamente
    channel.ack(msg);

  } catch (error) {
    console.error('❌ Error procesando mensaje:', error);

    // NACK - reencolar para reintento
    if (channel) {
      channel.nack(msg, false, true);
    }
  }
};

const simulateNotificationSend = async (event: NotificationEvent): Promise<void> => {
  // Simular diferentes canales según severidad
  switch (event.severity) {
    case 'ERROR':
      console.log(`🔴 [ALERTA CRÍTICA] ${event.message}`);
      // Aquí iría integración con servicio de SMS/Email urgente
      break;
    case 'WARN':
      console.log(`🟡 [ADVERTENCIA] ${event.message}`);
      // Aquí iría integración con email
      break;
    case 'INFO':
    default:
      console.log(`🟢 [INFO] ${event.message}`);
      // Aquí iría integración con push notification
      break;
  }

  // Marcar como procesada después de "enviar"
  // En producción, esto se haría después de confirmación del servicio de notificaciones
};

export const closeConnection = async (): Promise<void> => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log('RabbitMQ connection closed');
  } catch (error) {
    console.error('Error closing RabbitMQ connection:', error);
  }
};

export const getChannel = (): Channel | null => channel;
