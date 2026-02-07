import amqp, { Channel, ConsumeMessage, ChannelModel } from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

export const EXCHANGE_NAME = 'logiflow.events';
export const PEDIDO_QUEUE = 'pedido.events';
export const ROUTING_KEYS = {
  PEDIDO_CREADO: 'pedido.creado',
  PEDIDO_ACTUALIZADO: 'pedido.estado.actualizado',
  PEDIDO_ASIGNADO: 'pedido.asignado',
  PEDIDO_CANCELADO: 'pedido.cancelado',
  PEDIDO_ENTREGADO: 'pedido.entregado',
  PEDIDO_EN_RUTA: 'pedido.en.ruta'
};

let connection: ChannelModel;
let channel: Channel;

export const connectRabbitMQ = async (): Promise<Channel> => {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    connection = await amqp.connect(rabbitUrl);
    channel = await connection.createChannel();

    // Declarar exchange de tipo topic
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

    // Declarar cola
    await channel.assertQueue(PEDIDO_QUEUE, { durable: true });

    // Vincular cola al exchange con los routing keys
    for (const key of Object.values(ROUTING_KEYS)) {
      await channel.bindQueue(PEDIDO_QUEUE, EXCHANGE_NAME, key);
    }

    console.log('✅ Conectado a RabbitMQ - Pedido Service');
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
    console.log('RabbitMQ connection closed');
  } catch (error) {
    console.error('Error closing RabbitMQ connection:', error);
  }
};
