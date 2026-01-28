import { authService } from '../../services/auth.service';
import { RolNombre } from '../../entities';

interface Context {
  user?: {
    userId: number;
    username: string;
    roles: string[];
  };
}

export const authQueries = {
  usuario: async (_: unknown, { id }: { id: string }) => {
    return authService.getUsuarioById(parseInt(id));
  },

  usuarios: async () => {
    return authService.getAllUsuarios();
  },

  usuariosByRol: async (_: unknown, { rol }: { rol: RolNombre }) => {
    return authService.getUsuariosByRol(rol);
  },

  me: async (_: unknown, __: unknown, context: Context) => {
    if (!context.user) {
      throw new Error('No autenticado');
    }
    return authService.getUsuarioById(context.user.userId);
  },

  verifyToken: async (_: unknown, { token }: { token: string }) => {
    try {
      authService.verifyToken(token);
      return true;
    } catch {
      return false;
    }
  }
};
