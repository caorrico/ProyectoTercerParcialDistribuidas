import 'reflect-metadata';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './typeDefs/schema';
import { resolvers } from './resolvers';
import { initializeDatabase } from './utils/database';
import { authService } from './services/auth.service';
import dotenv from 'dotenv';
import 'dotenv/config';


dotenv.config();

interface Context {
  user?: {
    userId: number;
    username: string;
    roles: string[];
    zonaId?: string;
    tipoFlota?: string;
  };
}

const startServer = async () => {
  // Inicializar base de datos
  await initializeDatabase();

  // Crear servidor Apollo
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

  // Iniciar servidor
  const { url } = await startStandaloneServer(server, {
    listen: { port: parseInt(process.env.PORT || '4001') },
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
  });

  console.log(`🚀 Auth Service corriendo en ${url}`);
  console.log(`📊 GraphQL Playground disponible en ${url}`);
};

startServer().catch((error) => {
  console.error('Error al iniciar el servidor:', error);
  process.exit(1);
});
