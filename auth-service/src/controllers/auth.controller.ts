import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { RolNombre } from '../entities';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username y password son requeridos' });
    }

    const result = await authService.login({ username, password });
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, rol, zonaId, tipoFlota } = req.body;

    if (!username || !email || !password || !rol) {
      return res.status(400).json({
        error: 'Username, email, password y rol son requeridos'
      });
    }

    // Validar rol
    if (!Object.values(RolNombre).includes(rol)) {
      return res.status(400).json({
        error: `Rol inválido. Debe ser uno de: ${Object.values(RolNombre).join(', ')}`
      });
    }

    const result = await authService.register({
      username,
      email,
      password,
      rol,
      zonaId,
      tipoFlota
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/auth/token/refresh
router.post('/token/refresh', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const result = await authService.refreshToken(token);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// GET /api/auth/me - Obtener usuario actual
router.get('/me', async (req: Request, res: Response) => {
  try {
    const userInfo = (req as any).user;

    if (!userInfo) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const usuario = await authService.getUsuarioById(userInfo.userId);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
      roles: usuario.roles.map(r => r.nombre),
      zonaId: usuario.zonaId,
      tipoFlota: usuario.tipoFlota,
      activo: usuario.activo
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/usuarios
router.get('/usuarios', async (req: Request, res: Response) => {
  try {
    const usuarios = await authService.getAllUsuarios();
    res.json(usuarios.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      roles: u.roles.map(r => r.nombre),
      zonaId: u.zonaId,
      tipoFlota: u.tipoFlota,
      activo: u.activo
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/usuarios/:id - Obtener usuario por ID
router.get('/usuarios/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const usuario = await authService.getUsuarioById(id);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
      roles: usuario.roles.map(r => r.nombre),
      zonaId: usuario.zonaId,
      tipoFlota: usuario.tipoFlota,
      activo: usuario.activo
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
