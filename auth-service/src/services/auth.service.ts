import { AppDataSource } from '../utils/database';
import { Usuario, Rol, RolNombre } from '../entities';
import {
  RegisterInput,
  LoginInput,
  AuthPayload,
  TokenPayload
} from './interfaces/interfaces';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Validación de configuración crítica
 * Esto se ejecuta al cargar el módulo
 */
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION as jwt.SignOptions['expiresIn'];

if (!JWT_SECRET || !JWT_EXPIRATION) {
  throw new Error('Faltan variables de entorno JWT_SECRET o JWT_EXPIRATION');
}

export class AuthService {
  private usuarioRepository = AppDataSource.getRepository(Usuario);
  private rolRepository = AppDataSource.getRepository(Rol);

  async register(input: RegisterInput): Promise<AuthPayload> {
    const { username, email, password, rol, zonaId, tipoFlota } = input;

    const existingUser = await this.usuarioRepository.findOne({
      where: [{ username }, { email }]
    });

    if (existingUser) {
      throw new Error('El username o email ya está registrado');
    }

    let rolEntity = await this.rolRepository.findOne({
      where: { nombre: rol }
    });

    if (!rolEntity) {
      rolEntity = this.rolRepository.create({ nombre: rol });
      await this.rolRepository.save(rolEntity);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = this.usuarioRepository.create({
      username,
      email,
      password: hashedPassword,
      zonaId,
      tipoFlota,
      roles: [rolEntity],
      activo: true
    });

    await this.usuarioRepository.save(usuario);

    const token = this.generateToken(usuario);

    return {
      token,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        roles: usuario.roles.map(r => r.nombre),
        zonaId: usuario.zonaId,
        tipoFlota: usuario.tipoFlota
      }
    };
  }

  async login(input: LoginInput): Promise<AuthPayload> {
    const { username, password } = input;

    const usuario = await this.usuarioRepository.findOne({
      where: { username },
      relations: ['roles']
    });

    if (!usuario || !usuario.activo) {
      throw new Error('Credenciales inválidas');
    }

    const isValidPassword = await bcrypt.compare(password, usuario.password);

    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    const token = this.generateToken(usuario);

    return {
      token,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        roles: usuario.roles.map(r => r.nombre),
        zonaId: usuario.zonaId,
        tipoFlota: usuario.tipoFlota
      }
    };
  }

  async refreshToken(token: string): Promise<AuthPayload> {
    let decoded: TokenPayload;

    try {
      decoded = jwt.verify(token, JWT_SECRET as string, {
        algorithms: ['HS256']
      }) as unknown as TokenPayload;
    } catch {
      throw new Error('Token inválido o expirado');
    }

    const usuario = await this.usuarioRepository.findOne({
      where: { id: decoded.userId },
      relations: ['roles']
    });

    if (!usuario || !usuario.activo) {
      throw new Error('Token inválido');
    }

    const newToken = this.generateToken(usuario);

    return {
      token: newToken,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        roles: usuario.roles.map(r => r.nombre),
        zonaId: usuario.zonaId,
        tipoFlota: usuario.tipoFlota
      }
    };
  }

  async getUsuarioById(id: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: { id },
      relations: ['roles']
    });
  }

  async getAllUsuarios(): Promise<Usuario[]> {
    return this.usuarioRepository.find({
      relations: ['roles']
    });
  }

  async getUsuariosByRol(rol: RolNombre): Promise<Usuario[]> {
    return this.usuarioRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.roles', 'rol')
      .where('rol.nombre = :rol', { rol })
      .getMany();
  }

  async updateUsuario(
    id: string,
    data: Partial<Usuario>
  ): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id }
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    Object.assign(usuario, data);
    return this.usuarioRepository.save(usuario);
  }

  async deactivateUsuario(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id }
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    usuario.activo = false;
    return this.usuarioRepository.save(usuario);
  }

  private generateToken(usuario: Usuario): string {
    const payload: TokenPayload = {
      userId: usuario.id,
      username: usuario.username,
      roles: usuario.roles.map(r => r.nombre),
      zonaId: usuario.zonaId,
      tipoFlota: usuario.tipoFlota
    };

    return jwt.sign(payload, JWT_SECRET as string, {
      expiresIn: JWT_EXPIRATION
    });
  }

  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET as string, {
      algorithms: ['HS256']
    }) as TokenPayload;
  }
}

export const authService = new AuthService();
