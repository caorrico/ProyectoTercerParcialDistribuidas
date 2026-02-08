import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './typeDefs/schema';
import { resolvers } from './resolvers';
import { initializeDatabase } from './utils/database';
import { authService } from './services/auth.service';
import authController from './controllers/auth.controller';
import dotenv from 'dotenv';

dotenv.config();

interface Context {
  user?: {
    userId: string;
    username: string;
    roles: string[];
    zonaId?: string;
    tipoFlota?: string;
  };
}

// Middleware para extraer usuario del token
const extractUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    try {
      const decoded = authService.verifyToken(token);
      (req as any).user = decoded;
    } catch {
      // Token inválido, continuar sin usuario
    }
  }

  next();
};

const startServer = async () => {
  await initializeDatabase();

  const app = express();

  // Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(extractUser);

  // Health check
  app.get('/health', (_, res) => {
    res.json({
      status: 'ok',
      service: 'auth-service',
      timestamp: new Date().toISOString()
    });
  });

  // REST API routes
  app.use('/api/auth', authController);

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
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (token) {
        try {
          const decoded = authService.verifyToken(token);
          return { user: decoded };
        } catch {
          return {};
        }
      }

      return {};
    }
  }));

  const PORT = parseInt(process.env.PORT || '4001');
  app.listen(PORT, () => {
    console.log(`\n🚀 Auth Service corriendo en http://localhost:${PORT}`);
    console.log(`📊 GraphQL Playground: http://localhost:${PORT}/graphql`);
    console.log(`🔗 REST API: http://localhost:${PORT}/api/auth`);
    console.log(`❤️  Health: http://localhost:${PORT}/health\n`);
  });
};

startServer().catch((error) => {
  console.error('Error al iniciar el servidor:', error);
  process.exit(1);
});
