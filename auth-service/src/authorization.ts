import { RolNombre } from '../src/entities';

export function requireAuth(user: any) {
  if (!user) {
    throw new Error('No autenticado');
  }
}

export function requireRole(
  user: any,
  allowedRoles: RolNombre[]
) {
  requireAuth(user);

  const hasRole = user.roles.some((r: RolNombre) =>
    allowedRoles.includes(r)
  );

  if (!hasRole) {
    throw new Error('No autorizado');
  }
}

export const ADMIN_ROLES = [
  RolNombre.ROLE_ADMIN,
  RolNombre.ROLE_GERENTE,
  RolNombre.ROLE_SUPERVISOR,
  RolNombre.ROLE_CLIENTE,
  RolNombre.ROLE_REPARTIDOR
];
