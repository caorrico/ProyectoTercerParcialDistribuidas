import WebSocket, { WebSocketServer } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import amqp, { Channel, Connection } from 'amqplib';
import { JWT_SECRET } from '../config/routes.config';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

interface ClientInfo {
  id: string;
  userId?: number;
  username?: string;
  roles?: string[];
  zonaId?: string;
  subscriptions: Set<string>;
}

const clients = new Map<WebSocket, ClientInfo>();
let rabbitChannel: Channel | null = null;
let rabbitConnection: Connection | null = null;

export const initWebSocket = (server: Server): WebSocketServer => {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    const clientId = uuidv4();
    const clientInfo: ClientInfo = {
      id: clientId,
      subscriptions: new Set()
    };

    // Intentar autenticar desde query params
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        clientInfo.userId = decoded.userId;
        clientInfo.username = decoded.username;
        clientInfo.roles = decoded.roles;
        clientInfo.zonaId = decoded.zonaId;
      } catch (error) {
        console.log('WebSocket: Token inválido, conexión anónima');
      }
    }

    clients.set(ws, clientInfo);
    console.log(`🔌 WebSocket conectado: ${clientId} (Usuario: ${clientInfo.username || 'anónimo'})`);

    // Enviar mensaje de bienvenida
    ws.send(JSON.stringify({
      type: 'CONNECTED',
      clientId,
      message: 'Conectado al servidor WebSocket de LogiFlow'
    }));

    // Manejar mensajes del cliente
    ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        handleClientMessage(ws, message, clientInfo);
      } catch (error) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Mensaje inválido' }));
      }
    });

    // Manejar desconexión
    ws.on('close', () => {
      console.log(`🔌 WebSocket desconectado: ${clientId}`);
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error: ${clientId}`, error);
      clients.delete(ws);
    });
  });

  console.log('✅ WebSocket Server iniciado en /ws');
  return wss;
};

const handleClientMessage = (ws: WebSocket, message: any, clientInfo: ClientInfo): void => {
  switch (message.type) {
    case 'SUBSCRIBE':
      // Suscribirse a un tópico
      if (message.topic) {
        clientInfo.subscriptions.add(message.topic);
        ws.send(JSON.stringify({
          type: 'SUBSCRIBED',
          topic: message.topic,
          message: `Suscrito a ${message.topic}`
        }));
        console.log(`📌 Cliente ${clientInfo.id} suscrito a ${message.topic}`);
      }
      break;

    case 'UNSUBSCRIBE':
      // Desuscribirse de un tópico
      if (message.topic) {
        clientInfo.subscriptions.delete(message.topic);
        ws.send(JSON.stringify({
          type: 'UNSUBSCRIBED',
          topic: message.topic
        }));
      }
      break;

    case 'PING':
      ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      break;

    default:
      ws.send(JSON.stringify({ type: 'UNKNOWN', message: 'Tipo de mensaje no reconocido' }));
  }
};

// Broadcast a todos los clientes suscritos a un tópico
export const broadcastToTopic = (topic: string, data: any): void => {
  const message = JSON.stringify({
    type: 'EVENT',
    topic,
    data,
    timestamp: new Date().toISOString()
  });

  clients.forEach((clientInfo, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      // Verificar si el cliente está suscrito al tópico
      const isSubscribed = Array.from(clientInfo.subscriptions).some(sub => {
        // Soporte para wildcards simples
        if (sub.endsWith('*')) {
          return topic.startsWith(sub.slice(0, -1));
        }
        return sub === topic;
      });

      if (isSubscribed) {
        ws.send(message);
      }
    }
  });
};

// Broadcast a todos los clientes
export const broadcastToAll = (data: any): void => {
  const message = JSON.stringify({
    type: 'BROADCAST',
    data,
    timestamp: new Date().toISOString()
  });

  clients.forEach((_, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
};

// Conectar a RabbitMQ para recibir eventos y reenviarlos por WebSocket
export const connectRabbitMQForWebSocket = async (): Promise<void> => {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    rabbitConnection = await amqp.connect(rabbitUrl);
    rabbitChannel = await rabbitConnection.createChannel();

    const EXCHANGE_NAME = 'logiflow.events';
    const WS_QUEUE = 'websocket.broadcast';

    await rabbitChannel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    await rabbitChannel.assertQueue(WS_QUEUE, { durable: false, autoDelete: true });

    // Suscribirse a todos los eventos
    await rabbitChannel.bindQueue(WS_QUEUE, EXCHANGE_NAME, '#');

    await rabbitChannel.consume(WS_QUEUE, (msg) => {
      if (msg) {
        try {
          const event = JSON.parse(msg.content.toString());
          const routingKey = msg.fields.routingKey;

          // Convertir routing key a tópico WebSocket
          const topic = routingKey.replace(/\./g, '/');
          broadcastToTopic(topic, event);

          // También broadcast al tópico genérico
          broadcastToTopic(`${event.microservice}/*`, event);

          rabbitChannel?.ack(msg);
        } catch (error) {
          console.error('Error procesando mensaje para WebSocket:', error);
          rabbitChannel?.nack(msg, false, false);
        }
      }
    }, { noAck: false });

    console.log('✅ Gateway conectado a RabbitMQ para WebSocket broadcast');

  } catch (error) {
    console.error('❌ Error conectando RabbitMQ para WebSocket:', error);
  }
};

export const closeRabbitMQ = async (): Promise<void> => {
  try {
    if (rabbitChannel) await rabbitChannel.close();
    if (rabbitConnection) await rabbitConnection.close();
  } catch (error) {
    console.error('Error cerrando RabbitMQ:', error);
  }
};
