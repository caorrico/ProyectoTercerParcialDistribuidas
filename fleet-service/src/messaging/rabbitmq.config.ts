import amqp, { Channel, ConsumeMessage, ChannelModel } from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

export const EXCHANGE_NAME = 'logiflow.events';
export const FLEET_QUEUE = 'fleet.events';
export const ROUTING_KEYS = {
  VEHICULO_CREADO: 'vehiculo.creado',
  VEHICULO_ACTUALIZADO: 'vehiculo.estado.actualizado',
  REPARTIDOR_CREADO: 'repartidor.creado',
  REPARTIDOR_ACTUALIZADO: 'repartidor.actualizado',
  REPARTIDOR_UBICACION: 'repartidor.ubicacion.actualizada',
  VEHICULO_ASIGNADO: 'vehiculo.asignado'
};

let connection: ChannelModel;
let channel: Channel;

export const connectRabbitMQ = async (): Promise<Channel> => {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin123@rabbitmq:5672';
    connection = await amqp.connect(rabbitUrl);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    await channel.assertQueue(FLEET_QUEUE, { durable: true });

    for (const key of Object.values(ROUTING_KEYS)) {
      await channel.bindQueue(FLEET_QUEUE, EXCHANGE_NAME, key);
    }

    console.log('✅ Conectado a RabbitMQ - Fleet Service');
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
