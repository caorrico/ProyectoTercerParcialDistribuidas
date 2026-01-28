import amqp, { Channel, Connection } from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

export const EXCHANGE_NAME = 'logiflow.events';
export const BILLING_QUEUE = 'billing.events';
export const ROUTING_KEYS = {
  FACTURA_CREADA: 'factura.creada',
  FACTURA_EMITIDA: 'factura.emitida',
  FACTURA_PAGADA: 'factura.pagada',
  FACTURA_ANULADA: 'factura.anulada'
};

let connection: Connection | null = null;
let channel: Channel | null = null;

export const connectRabbitMQ = async (): Promise<Channel> => {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    connection = await amqp.connect(rabbitUrl);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    await channel.assertQueue(BILLING_QUEUE, { durable: true });

    for (const key of Object.values(ROUTING_KEYS)) {
      await channel.bindQueue(BILLING_QUEUE, EXCHANGE_NAME, key);
    }

    console.log('✅ Conectado a RabbitMQ - Billing Service');
    return channel;
  } catch (error) {
    console.error('❌ Error al conectar con RabbitMQ:', error);
    throw error;
  }
};

export const getChannel = (): Channel | null => channel;

export const closeRabbitMQ = async (): Promise<void> => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
  } catch (error) {
    console.error('Error closing RabbitMQ connection:', error);
  }
};
