import dotenv from 'dotenv';

dotenv.config();

export interface ServiceConfig {
  name: string;
  target: string;
  pathPrefix: string;
  graphql: boolean;
}

export const services: ServiceConfig[] = [
  {
    name: 'auth-service',
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
    pathPrefix: '/auth',
    graphql: true
  },
  {
    name: 'pedido-service',
    target: process.env.PEDIDO_SERVICE_URL || 'http://localhost:4002',
    pathPrefix: '/pedidos',
    graphql: true
  },
  {
    name: 'fleet-service',
    target: process.env.FLEET_SERVICE_URL || 'http://localhost:4003',
    pathPrefix: '/fleet',
    graphql: true
  },
  {
    name: 'billing-service',
    target: process.env.BILLING_SERVICE_URL || 'http://localhost:4004',
    pathPrefix: '/billing',
    graphql: true
  },
  {
    name: 'notification-service',
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4005',
    pathPrefix: '/notifications',
    graphql: false
  }
];

export const JWT_SECRET = process.env.JWT_SECRET || 'logiflow-secret-key-2024';
export const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '60000'); // 1 minuto
export const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '100'); // 100 requests por minuto
