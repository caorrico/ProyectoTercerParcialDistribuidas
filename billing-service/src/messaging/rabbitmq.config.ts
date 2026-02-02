import amqp, { Channel, ConsumeMessage, ChannelModel } from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

export const EXCHANGE_NAME = 'logiflow.events';
export const BILLING_QUEUE = 'billing.events';

export const ROUTING_KEYS = {
  FACTURA_CREADA: 'factura.creada',
  FACTURA_EMITIDA: 'factura.emitida',
  FACTURA_PAGADA: 'factura.pagada',
  FACTURA_ANULADA: 'factura.anulada'
} as const;

let connection: ChannelModel;
let channel: Channel;

export const connectRabbitMQ = async (): Promise<Channel> => {
  if (channel) return channel;

  const rabbitUrl =
    process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';

  connection = await amqp.connect(rabbitUrl);
  channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
  await channel.assertQueue(BILLING_QUEUE, { durable: true });

  for (const key of Object.values(ROUTING_KEYS)) {
    await channel.bindQueue(BILLING_QUEUE, EXCHANGE_NAME, key);
  }

  return channel;
};

export const getChannel = (): Channel => {
  if (!channel) {
    throw new Error('RabbitMQ no inicializado');
  }
  return channel;
};

export const closeRabbitMQ = async (): Promise<void> => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
  } catch (error) {
    console.error('Error closing RabbitMQ connection:', error);
  }
};