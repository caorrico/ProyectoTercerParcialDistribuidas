import { Router, Request, Response } from 'express';
import { fleetService } from '../services/fleet.service';
import { EstadoVehiculo, TipoVehiculo, TipoEstado } from '../entities';

const router = Router();

// ==================== VEHÍCULOS ====================

// GET /api/fleet/vehiculos - Listar todos los vehículos
router.get('/vehiculos', async (req: Request, res: Response) => {
  try {
    const { tipo, disponibles } = req.query;

    let vehiculos;
    if (disponibles === 'true') {
      vehiculos = await fleetService.listarVehiculosDisponibles();
    } else if (tipo) {
      vehiculos = await fleetService.listarVehiculosPorTipo(tipo as TipoVehiculo);
    } else {
      vehiculos = await fleetService.listarVehiculos();
    }

    res.json(vehiculos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/fleet/vehiculos/:id - Obtener vehículo por ID
router.get('/vehiculos/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const vehiculo = await fleetService.obtenerVehiculo(id);

    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    res.json(vehiculo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/fleet/vehiculos/placa/:placa - Obtener vehículo por placa
router.get('/vehiculos/placa/:placa', async (req: Request, res: Response) => {
  try {
    const vehiculo = await fleetService.obtenerVehiculoPorPlaca(req.params.placa);

    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    res.json(vehiculo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/fleet/vehiculos/moto - Crear moto
router.post('/vehiculos/moto', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const moto = await fleetService.crearMoto(req.body, user);
    res.status(201).json(moto);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/fleet/vehiculos/liviano - Crear vehículo liviano
router.post('/vehiculos/liviano', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const liviano = await fleetService.crearLiviano(req.body, user);
    res.status(201).json(liviano);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/fleet/vehiculos/camion - Crear camión
router.post('/vehiculos/camion', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const camion = await fleetService.crearCamion(req.body, user);
    res.status(201).json(camion);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/fleet/vehiculos/:placa/estado - Actualizar estado del vehículo
router.patch('/vehiculos/:placa/estado', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { estado } = req.body;

    if (!estado || !Object.values(EstadoVehiculo).includes(estado)) {
      return res.status(400).json({
        error: `Estado inválido. Debe ser: ${Object.values(EstadoVehiculo).join(', ')}`
      });
    }

    const vehiculo = await fleetService.actualizarEstadoVehiculo(
      req.params.placa,
      estado,
      user
    );
    res.json(vehiculo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== REPARTIDORES ====================

// GET /api/fleet/repartidores - Listar repartidores
router.get('/repartidores', async (req: Request, res: Response) => {
  try {
    const { zonaId, activos } = req.query;

    let repartidores;
    if (zonaId) {
      repartidores = await fleetService.listarRepartidoresPorZona(zonaId as string);
    } else if (activos === 'true') {
      repartidores = await fleetService.listarRepartidoresActivos();
    } else {
      repartidores = await fleetService.listarRepartidores();
    }

    res.json(repartidores);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/fleet/repartidores/:id - Obtener repartidor por ID
router.get('/repartidores/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const repartidor = await fleetService.obtenerRepartidor(id);

    if (!repartidor) {
      return res.status(404).json({ error: 'Repartidor no encontrado' });
    }

    res.json(repartidor);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/fleet/repartidores - Crear repartidor
router.post('/repartidores', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const repartidor = await fleetService.crearRepartidor(req.body, user);
    res.status(201).json(repartidor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/fleet/repartidores/:id/asignar-vehiculo - Asignar vehículo
router.post('/repartidores/:id/asignar-vehiculo', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const id = req.params.id;
    const { placa } = req.body;

    if (!placa) {
      return res.status(400).json({ error: 'placa es requerida' });
    }

    const repartidor = await fleetService.asignarVehiculo(id, placa, user);
    res.json(repartidor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/fleet/repartidores/:id/ubicacion - Actualizar ubicación
router.patch('/repartidores/:id/ubicacion', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const id = req.params.id;
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'lat y lng son requeridos' });
    }

    const repartidor = await fleetService.actualizarUbicacionRepartidor(
      id,
      parseFloat(lat),
      parseFloat(lng),
      user
    );
    res.json(repartidor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/fleet/repartidores/:id/estado - Cambiar estado del repartidor
router.patch('/repartidores/:id/estado', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const id = req.params.id;
    const { estado } = req.body;

    if (!estado || !Object.values(TipoEstado).includes(estado)) {
      return res.status(400).json({
        error: `Estado inválido. Debe ser: ${Object.values(TipoEstado).join(', ')}`
      });
    }

    const repartidor = await fleetService.cambiarEstadoRepartidor(id, estado, user);
    res.json(repartidor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/fleet/estadisticas - Obtener estadísticas de flota
router.get('/estadisticas', async (req: Request, res: Response) => {
  try {
    const { zonaId } = req.query;
    const estadisticas = await fleetService.obtenerFlotaActiva(zonaId as string);
    res.json(estadisticas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
