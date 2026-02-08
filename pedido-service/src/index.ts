import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './typeDefs/schema';
import { resolvers } from './resolvers';
import { initializeDatabase } from './utils/database';
import { connectRabbitMQ, closeRabbitMQ } from './messaging/rabbitmq.config';
import pedidoController from './controllers/pedido.controller';
import dotenv from 'dotenv';

dotenv.config();

interface Context {
  user?: {
    userId: number;
    username: string;
    roles: string[];
  };
}

// Middleware para extraer usuario del header (inyectado por el gateway)
const extractUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userHeader = req.headers['x-user-info'];

  if (userHeader && typeof userHeader === 'string') {
    try {
      (req as any).user = JSON.parse(userHeader);
    } catch {
      // Header inválido
    }
  }

  next();
};

const startServer = async () => {
  await initializeDatabase();
  await connectRabbitMQ();

  const app = express();

  // Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(extractUser);

  // Health check
  app.get('/health', (_, res) => {
    res.json({
      status: 'ok',
      service: 'pedido-service',
      timestamp: new Date().toISOString()
    });
  });

  // REST API routes
  app.use('/api/pedidos', pedidoController);

  // Apollo Server
  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    introspection: true,
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      return {
        message: error.message,
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        path: error.path
      };
    }
  });

  await server.start();

  // GraphQL endpoint
  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }): Promise<Context> => {
      const userHeader = req.headers['x-user-info'];
      if (userHeader && typeof userHeader === 'string') {
        try {
          return { user: JSON.parse(userHeader) };
        } catch {
          return {};
        }
      }
      return {};
    }
  }));

  const PORT = parseInt(process.env.PORT || '4002');
  app.listen(PORT, () => {
    console.log(`\n🚀 Pedido Service corriendo en http://localhost:${PORT}`);
    console.log(`📊 GraphQL Playground: http://localhost:${PORT}/graphql`);
    console.log(`🔗 REST API: http://localhost:${PORT}/api/pedidos`);
    console.log(`❤️  Health: http://localhost:${PORT}/health\n`);
  });

  // Manejo de cierre graceful
  process.on('SIGINT', async () => {
    console.log('Cerrando conexiones...');
    await closeRabbitMQ();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Cerrando conexiones...');
    await closeRabbitMQ();
    process.exit(0);
  });
};

startServer().catch((error) => {
  console.error('Error al iniciar el servidor:', error);
  process.exit(1);
});
