import amqp, { Channel, ConsumeMessage, ChannelModel } from 'amqplib';
import { notificationService } from '../notifications/service/notification.service';
import { NotificationEvent } from './interfaces/notification-event.interface';
import dotenv from 'dotenv';

dotenv.config();

const EXCHANGE_NAME = 'logiflow.events';
const NOTIFICATION_QUEUE = 'notifications.queue';

const ROUTING_PATTERNS = [
  'pedido.*',
  'vehiculo.*',
  'repartidor.*',
  'factura.*'
];

//tipado explícito de amqplib
let connection: ChannelModel;
let channel: Channel;

const handleMessage = async (msg: ConsumeMessage | null) => {
  if (!msg) return;
  try {
    const content = JSON.parse(msg.content.toString()) as NotificationEvent;
    console.log("Mensaje recibido:", content);
    channel.ack(msg);
  } catch (error) {
    console.error("Error procesando mensaje:", error);
    if (channel) channel.nack(msg, false, false);
  }
};

export const connectAndConsume = async (): Promise<void> => {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin123@rabbitmq:5672';
    
    connection = await amqp.connect(rabbitUrl);
    
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

    await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });

    for (const pattern of ROUTING_PATTERNS) {
      await channel.bindQueue(NOTIFICATION_QUEUE, EXCHANGE_NAME, pattern);
      console.log(`Vinculado a patrón: ${pattern}`);
    }

    await channel.prefetch(10);

    // Iniciar consumo
    await channel.consume(NOTIFICATION_QUEUE, handleMessage, { noAck: false });

    console.log('Notification Service conectado a RabbitMQ');
    console.log(`Escuchando en cola: ${NOTIFICATION_QUEUE}`);

  } catch (error) {
    console.error('Error al conectar con RabbitMQ:', error);
    throw error;
  }
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
