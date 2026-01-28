import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/routes.config';

export interface TokenPayload {
  userId: number;
  username: string;
  roles: string[];
  zonaId?: string;
  tipoFlota?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  '/auth',
  '/health',
  '/ws'
];

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Verificar si es una ruta pública
  const isPublicRoute = PUBLIC_ROUTES.some(route => req.path.startsWith(route));

  if (isPublicRoute) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Token no proporcionado' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.user = decoded;

    // Agregar información del usuario al header para los microservicios
    req.headers['x-user-info'] = JSON.stringify(decoded);
    req.headers['x-user-id'] = decoded.userId.toString();
    req.headers['x-user-roles'] = decoded.roles.join(',');

    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Middleware para verificar roles específicos
export const requireRoles = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({ error: 'No tiene permisos para esta acción' });
      return;
    }

    next();
  };
};
