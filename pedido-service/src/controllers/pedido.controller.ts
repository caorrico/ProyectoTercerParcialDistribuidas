import { Router, Request, Response } from 'express';
import { pedidoService } from '../services/pedido.service';
import { EstadoPedido, TipoEntrega } from '../entities';

const router = Router();

// GET /api/pedidos - Listar pedidos con filtros opcionales
router.get('/', async (req: Request, res: Response) => {
  try {
    const { estado, tipoEntrega, zonaId, clienteId, repartidorId } = req.query;

    const filtro: any = {};
    if (estado) filtro.estado = estado as EstadoPedido;
    if (tipoEntrega) filtro.tipoEntrega = tipoEntrega as TipoEntrega;
    if (zonaId) filtro.zonaId = zonaId as string;
    if (clienteId) filtro.clienteId = clienteId as string;
    if (repartidorId) filtro.repartidorId = repartidorId as string;

    const pedidos = await pedidoService.listarPedidos(
      Object.keys(filtro).length > 0 ? filtro : undefined
    );

    res.json(pedidos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pedidos/:id - Obtener pedido por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const pedido = await pedidoService.obtenerPedido(id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json(pedido);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pedidos/codigo/:codigo - Obtener pedido por código
router.get('/codigo/:codigo', async (req: Request, res: Response) => {
  try {
    const pedido = await pedidoService.obtenerPedidoPorCodigo(req.params.codigo);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json(pedido);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/pedidos - Crear nuevo pedido
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const {
      clienteId,
      direccionOrigen,
      direccionDestino,
      descripcion,
      tipoEntrega,
      zonaId,
      peso,
      latOrigen,
      lngOrigen,
      latDestino,
      lngDestino,
      observaciones,
      fechaEstimadaEntrega
    } = req.body;

    if (!clienteId || !direccionOrigen || !direccionDestino || !descripcion || !tipoEntrega) {
      return res.status(400).json({
        error: 'clienteId, direccionOrigen, direccionDestino, descripcion y tipoEntrega son requeridos'
      });
    }

    const pedido = await pedidoService.crearPedido({
      clienteId,
      direccionOrigen,
      direccionDestino,
      descripcion,
      tipoEntrega,
      zonaId,
      peso,
      latOrigen,
      lngOrigen,
      latDestino,
      lngDestino,
      observaciones,
      fechaEstimadaEntrega
    }, user);

    res.status(201).json(pedido);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/pedidos/:id - Actualizar pedido
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { direccionOrigen, direccionDestino, descripcion, observaciones, fechaEstimadaEntrega } = req.body;

    const pedido = await pedidoService.actualizarPedido(id, {
      direccionOrigen,
      direccionDestino,
      descripcion,
      observaciones,
      fechaEstimadaEntrega
    });

    res.json(pedido);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/pedidos/:id/estado - Cambiar estado del pedido
router.patch('/:id/estado', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { estado } = req.body;

    if (!estado || !Object.values(EstadoPedido).includes(estado)) {
      return res.status(400).json({
        error: `Estado inválido. Debe ser uno de: ${Object.values(EstadoPedido).join(', ')}`
      });
    }

    const pedido = await pedidoService.cambiarEstado(id, estado);
    res.json(pedido);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/pedidos/:id/asignar - Asignar repartidor
router.post('/:id/asignar', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { repartidorId } = req.body;

    if (!repartidorId) {
      return res.status(400).json({ error: 'repartidorId es requerido' });
    }

    const pedido = await pedidoService.asignarRepartidor(id, repartidorId);
    res.json(pedido);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/pedidos/:id/tomar - Repartidor toma un pedido
router.post('/:id/tomar', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const pedidoId = req.params.id;
    const { vehiculoId } = req.body;

    if (!vehiculoId) {
      return res.status(400).json({ error: 'vehiculoId es requerido' });
    }

    const pedido = await pedidoService.tomarPedido({ pedidoId, vehiculoId }, user);
    res.json(pedido);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/pedidos/:id/iniciar-entrega - Iniciar entrega
router.post('/:id/iniciar-entrega', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const pedido = await pedidoService.cambiarEstado(id, EstadoPedido.EN_RUTA);
    res.json(pedido);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/pedidos/:id/confirmar-entrega - Confirmar entrega
router.post('/:id/confirmar-entrega', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const pedido = await pedidoService.cambiarEstado(id, EstadoPedido.ENTREGADO);
    res.json(pedido);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/pedidos/:id/cancelar - Cancelar pedido
router.post('/:id/cancelar', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { motivo } = req.body;

    if (!motivo) {
      return res.status(400).json({ error: 'motivo es requerido' });
    }

    const pedido = await pedidoService.cancelarPedido(id, motivo);
    res.json(pedido);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/pedidos/estadisticas/resumen - Obtener estadísticas
router.get('/estadisticas/resumen', async (req: Request, res: Response) => {
  try {
    const { zonaId } = req.query;
    const estadisticas = await pedidoService.obtenerEstadisticas(zonaId as string);
    res.json(estadisticas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
