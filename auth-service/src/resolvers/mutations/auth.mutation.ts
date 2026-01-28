import { authService } from '../../services/auth.service';
import { RegisterInput, LoginInput } from '../../services/interfaces/interfaces';

interface UpdateUsuarioInput {
  username?: string;
  email?: string;
  password?: string;
  zonaId?: string;
  tipoFlota?: string;
  activo?: boolean;
}

export const authMutations = {
  register: async (_: unknown, { input }: { input: RegisterInput }) => {
    return authService.register(input);
  },

  login: async (_: unknown, { input }: { input: LoginInput }) => {
    return authService.login(input);
  },

  refreshToken: async (_: unknown, { token }: { token: string }) => {
    return authService.refreshToken(token);
  },

  updateUsuario: async (_: unknown, { id, input }: { id: string; input: UpdateUsuarioInput }) => {
    return authService.updateUsuario(parseInt(id), input);
  },

  deactivateUsuario: async (_: unknown, { id }: { id: string }) => {
    return authService.deactivateUsuario(parseInt(id));
  }
};
