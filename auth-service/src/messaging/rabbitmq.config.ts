import amqp, { Channel, ChannelModel } from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

const EXCHANGE_NAME = 'logiflow.events';
let connection: ChannelModel | undefined;
let channel: Channel | undefined;

export const connectRabbitMQ = async (): Promise<void> => {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://logiflow:logiflow123@localhost:5672';
    console.log(`🔗 Auth Service: Conectando a RabbitMQ en ${rabbitUrl}`);
    
    connection = await amqp.connect(rabbitUrl);
    console.log(`✅ Auth Service: Conexión establecida`);
    
    channel = await connection.createChannel();
    console.log(`✅ Auth Service: Channel creado`);
    
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    console.log(`✅ Auth Service: Exchange '${EXCHANGE_NAME}' verificado`);
    
    console.log(`✅ Auth Service conectado a RabbitMQ correctamente`);
  } catch (error) {
    console.error('❌ Error conectando a RabbitMQ:', error);
    console.error('   Eventos de usuario NO se publicarán');
    // No lanzar error para que el servicio pueda iniciar sin RabbitMQ
  }
};

export const getChannel = (): Channel | undefined => {
  if (!channel) {
    console.warn('⚠️  getChannel() llamado pero channel es undefined');
  }
  return channel;
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
