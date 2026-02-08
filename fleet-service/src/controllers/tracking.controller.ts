import { Router, Request, Response } from 'express';
import { trackingService } from '../services/tracking.service';

const router = Router();

/**
 * POST /api/tracking/track
 * Actualizar ubicación GPS de un repartidor
 */
router.post('/track', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { repartidorId, lat, lng, pedidoId, velocidad, rumbo, precision } = req.body;

    if (!repartidorId || lat === undefined || lng === undefined) {
      return res.status(400).json({
        error: 'repartidorId, lat y lng son requeridos'
      });
    }

    const result = await trackingService.actualizarUbicacion(
      { repartidorId, lat, lng, pedidoId, velocidad, rumbo, precision },
      user.userId,
      user.roles
    );

    res.json({
      success: true,
      repartidorId: result.repartidor.id,
      ubicacion: {
        lat: result.repartidor.latActual,
        lng: result.repartidor.lngActual
      },
      timestamp: result.timestamp
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/tracking/repartidor/:id
 * Obtener última ubicación de un repartidor
 */
router.get('/repartidor/:id', async (req: Request, res: Response) => {
  try {
    const repartidorId = req.params.id;
    const ubicacion = await trackingService.obtenerUltimaUbicacion(repartidorId);

    if (!ubicacion) {
      return res.status(404).json({
        error: 'No hay ubicación registrada para este repartidor'
      });
    }

    res.json(ubicacion);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tracking/repartidor/:id/historial
 * Obtener historial de ubicaciones
 */
router.get('/repartidor/:id/historial', async (req: Request, res: Response) => {
  try {
    const repartidorId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const historial = await trackingService.obtenerHistorialUbicacion(repartidorId, limit);
    res.json(historial);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tracking/activos
 * Obtener todas las ubicaciones activas de repartidores
 */
router.get('/activos', async (req: Request, res: Response) => {
  try {
    const { zonaId } = req.query;
    const ubicaciones = await trackingService.obtenerUbicacionesActivas(zonaId as string);
    res.json(ubicaciones);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tracking/cercanos
 * Obtener repartidores cercanos a una ubicación
 */
router.get('/cercanos', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radio, zonaId } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat y lng son requeridos' });
    }

    const cercanos = await trackingService.obtenerRepartidoresCercanos(
      parseFloat(lat as string),
      parseFloat(lng as string),
      parseFloat(radio as string) || 5,
      zonaId as string
    );

    res.json(cercanos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tracking/batch
 * Actualizar múltiples ubicaciones (para sincronización offline)
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { ubicaciones } = req.body;

    if (!Array.isArray(ubicaciones) || ubicaciones.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de ubicaciones' });
    }

    const resultados = [];

    for (const ubicacion of ubicaciones) {
      try {
        const result = await trackingService.actualizarUbicacion(
          ubicacion,
          user.userId,
          user.roles
        );
        resultados.push({
          repartidorId: ubicacion.repartidorId,
          success: true,
          timestamp: result.timestamp
        });
      } catch (error: any) {
        resultados.push({
          repartidorId: ubicacion.repartidorId,
          success: false,
          error: error.message
        });
      }
    }

    res.json({ resultados });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
