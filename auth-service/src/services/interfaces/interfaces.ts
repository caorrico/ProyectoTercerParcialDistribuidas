import { RolNombre } from '../../entities';

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  rol: RolNombre;
  zonaId?: string;
  tipoFlota?: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface AuthPayload {
  token: string;
  usuario: {
    id: number;
    username: string;
    email: string;
    roles: string[];
    zonaId?: string;
    tipoFlota?: string;
  };
}

export interface TokenPayload {
  userId: number;
  username: string;
  roles: string[];
  zonaId?: string;
  tipoFlota?: string;
}

export interface RefreshTokenInput {
  token: string;
}
