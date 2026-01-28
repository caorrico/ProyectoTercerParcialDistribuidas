import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import { services, RATE_LIMIT_WINDOW, RATE_LIMIT_MAX } from './config/routes.config';
import { authMiddleware } from './middleware/auth.middleware';
import { initWebSocket, connectRabbitMQForWebSocket, closeRabbitMQ } from './websocket/websocket.service';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Info']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW,
  max: RATE_LIMIT_MAX,
  message: { error: 'Demasiadas peticiones, intente más tarde' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Health check
app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    services: services.map(s => ({ name: s.name, path: s.pathPrefix }))
  });
});

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Auth middleware
app.use(authMiddleware);

// Configurar proxies para cada microservicio
services.forEach(service => {
  const proxyOptions: Options = {
    target: service.target,
    changeOrigin: true,
    pathRewrite: {
      [`^${service.pathPrefix}`]: ''
    },
    onProxyReq: (proxyReq, req: any) => {
      // Pasar headers de autenticación
      if (req.headers['x-user-info']) {
        proxyReq.setHeader('x-user-info', req.headers['x-user-info']);
      }
      if (req.headers['x-user-id']) {
        proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
      }
      if (req.headers['x-user-roles']) {
        proxyReq.setHeader('x-user-roles', req.headers['x-user-roles']);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      // Log de respuesta del servicio
      console.log(`← ${service.name}: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      console.error(`Proxy error to ${service.name}:`, err.message);
      (res as any).status(503).json({
        error: `Servicio ${service.name} no disponible`,
        service: service.name
      });
    }
  };

  app.use(service.pathPrefix, createProxyMiddleware(proxyOptions));
  console.log(`📌 Ruta configurada: ${service.pathPrefix} → ${service.target}`);
});

// Ruta para GraphQL unificado (opcional - Apollo Federation)
app.get('/graphql/services', (_, res) => {
  res.json({
    services: services.filter(s => s.graphql).map(s => ({
      name: s.name,
      url: `${s.target}/graphql`
    }))
  });
});

// Crear servidor HTTP
const server = createServer(app);

// Inicializar WebSocket
initWebSocket(server);

const startServer = async () => {
  // Conectar a RabbitMQ para WebSocket broadcast
  await connectRabbitMQForWebSocket();

  const PORT = process.env.PORT || 4000;
  server.listen(PORT, () => {
    console.log(`\n🚀 API Gateway corriendo en http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
    console.log(`\n📍 Rutas disponibles:`);
    services.forEach(s => {
      console.log(`   ${s.pathPrefix} → ${s.target}`);
    });
    console.log('');
  });

  process.on('SIGINT', async () => {
    console.log('\nCerrando conexiones...');
    await closeRabbitMQ();
    server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await closeRabbitMQ();
    server.close();
    process.exit(0);
  });
};

startServer().catch((error) => {
  console.error('Error al iniciar el servidor:', error);
  process.exit(1);
});
