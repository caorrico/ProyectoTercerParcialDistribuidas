import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './utils/database';
import { connectAndConsume, closeConnection } from './rabbitmq/rabbitmq.service';
import { notificationService } from './notifications/service/notification.service';
import { Severity } from './notifications/entity/Notification.entity';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
});

// Obtener todas las notificaciones
app.get('/notifications', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const notifications = await notificationService.findAll(limit);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// Obtener notificaciones por microservicio
app.get('/notifications/microservice/:microservice', async (req, res) => {
  try {
    const notifications = await notificationService.findByMicroservice(req.params.microservice);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// Obtener notificaciones por severidad
app.get('/notifications/severity/:severity', async (req, res) => {
  try {
    const severity = req.params.severity.toUpperCase() as Severity;
    const notifications = await notificationService.findBySeverity(severity);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// Obtener notificaciones pendientes
app.get('/notifications/pending', async (_, res) => {
  try {
    const notifications = await notificationService.findUnprocessed();
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// Obtener estadísticas
app.get('/notifications/stats', async (_, res) => {
  try {
    const stats = await notificationService.getStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Marcar como procesada
app.patch('/notifications/:id/process', async (req, res) => {
  try {
    const notification = await notificationService.markAsProcessed(req.params.id);
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar notificación' });
  }
});

const startServer = async () => {
  await initializeDatabase();
  await connectAndConsume();

  const PORT = process.env.PORT;
  app.listen(PORT, () => {
    console.log(`Notification Service corriendo en http://localhost:15672`);
    console.log(`API REST disponible para consultas`);
  });

  process.on('SIGINT', async () => {
    await closeConnection();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await closeConnection();
    process.exit(0);
  });
};

startServer().catch((error) => {
  console.error('Error al iniciar el servidor:', error);
  process.exit(1);
});
