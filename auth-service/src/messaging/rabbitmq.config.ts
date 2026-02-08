import amqp, { Channel, ChannelModel } from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

const EXCHANGE_NAME = 'logiflow.events';
let connection: ChannelModel | undefined;
let channel: Channel | undefined;

export const connectRabbitMQ = async (): Promise<void> => {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://logiflow:logiflow123@localhost:5672';
    
    connection = await amqp.connect(rabbitUrl);
    channel = await connection.createChannel();
    
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    
    console.log('Auth Service conectado a RabbitMQ');
  } catch (error) {
    console.error('Error conectando a RabbitMQ:', error);
    // No lanzar error para que el servicio pueda iniciar sin RabbitMQ
  }
};

export const getChannel = (): Channel | undefined => channel;

export const closeConnection = async (): Promise<void> => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log('RabbitMQ connection closed');
  } catch (error) {
    console.error('Error closing RabbitMQ connection:', error);
  }
};
