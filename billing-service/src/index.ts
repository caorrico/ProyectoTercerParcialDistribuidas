import 'reflect-metadata';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './typeDefs/schema';
import { resolvers } from './resolvers';
import { initializeDatabase } from './utils/database';
import { connectRabbitMQ, closeRabbitMQ } from './messaging/rabbitmq.config';
import dotenv from 'dotenv';

dotenv.config();

interface Context {
  user?: {
    userId: number;
    username: string;
    roles: string[];
  };
}

const startServer = async () => {
  await initializeDatabase();
  await connectRabbitMQ();

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

  const { url } = await startStandaloneServer(server, {
    listen: { port: parseInt(process.env.PORT || '4004') },
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
  });

  console.log(`🚀 Billing Service corriendo en ${url}`);
  console.log(`📊 GraphQL Playground disponible en ${url}`);

  process.on('SIGINT', async () => {
    await closeRabbitMQ();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await closeRabbitMQ();
    process.exit(0);
  });
};

startServer().catch((error) => {
  console.error('Error al iniciar el servidor:', error);
  process.exit(1);
});
