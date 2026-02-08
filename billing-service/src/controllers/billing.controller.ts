import { Router, Request, Response } from 'express';
import { billingService } from '../services/billing.service';
import { EstadoFactura } from '../entities';

const router = Router();

// Roles permitidos para generar facturas
const ROLES_GENERAR_FACTURA = ['ROLE_GERENTE', 'ROLE_ADMIN'];

// Middleware para verificar rol de gerente
const requireGerente = (req: Request, res: Response, next: Function) => {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const hasPermission = user.roles?.some((role: string) =>
    ROLES_GENERAR_FACTURA.includes(role)
  );

  if (!hasPermission) {
    return res.status(403).json({
      error: 'Solo un Gerente o Admin puede realizar esta acción'
    });
  }

  next();
};

// GET /api/billing/facturas - Listar facturas
router.get('/facturas', async (req: Request, res: Response) => {
  try {
    const { estado, clienteId, pedidoId, zonaId } = req.query;

    const filtro: any = {};
    if (estado) filtro.estado = estado as EstadoFactura;
    if (clienteId) filtro.clienteId = clienteId as string;
    if (pedidoId) filtro.pedidoId = pedidoId as string;
    if (zonaId) filtro.zonaId = zonaId as string;

    const facturas = await billingService.listarFacturas(
      Object.keys(filtro).length > 0 ? filtro : undefined
    );

    res.json(facturas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/billing/facturas/:id - Obtener factura por ID
router.get('/facturas/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const factura = await billingService.obtenerFactura(id);

    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    res.json(factura);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/billing/facturas/numero/:numero - Obtener factura por número
router.get('/facturas/numero/:numero', async (req: Request, res: Response) => {
  try {
    const factura = await billingService.obtenerFacturaPorNumero(req.params.numero);

    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    res.json(factura);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/billing/facturas - Generar factura (solo Gerente)
router.post('/facturas', requireGerente, async (req: Request, res: Response) => {
  try {
    const { pedidoId, clienteId, subtotal, descuento, tipoEntrega, zonaId, observaciones } = req.body;

    if (!pedidoId || !clienteId || subtotal === undefined) {
      return res.status(400).json({
        error: 'pedidoId, clienteId y subtotal son requeridos'
      });
    }

    const factura = await billingService.generarFactura({
      pedidoId,
      clienteId,
      subtotal,
      descuento,
      tipoEntrega,
      zonaId,
      observaciones
    });

    res.status(201).json(factura);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/billing/facturas/:id/emitir - Emitir factura (solo Gerente)
router.post('/facturas/:id/emitir', requireGerente, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const factura = await billingService.emitirFactura(id);
    res.json(factura);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/billing/facturas/:id/pagar - Registrar pago
router.post('/facturas/:id/pagar', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { metodoPago } = req.body;

    if (!metodoPago) {
      return res.status(400).json({ error: 'metodoPago es requerido' });
    }

    const factura = await billingService.registrarPago(id, metodoPago);
    res.json(factura);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/billing/facturas/:id/anular - Anular factura (solo Gerente)
router.post('/facturas/:id/anular', requireGerente, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { motivo } = req.body;

    if (!motivo) {
      return res.status(400).json({ error: 'motivo es requerido' });
    }

    const factura = await billingService.anularFactura(id, motivo);
    res.json(factura);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/billing/kpi/diario - Obtener KPI diario
router.get('/kpi/diario', async (req: Request, res: Response) => {
  try {
    const { fecha, zonaId } = req.query;
    const fechaDate = fecha ? new Date(fecha as string) : new Date();

    const kpi = await billingService.obtenerKPIDiario(fechaDate, zonaId as string);
    res.json(kpi);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/billing/reportes/zona - Reporte por zona
router.get('/reportes/zona', async (req: Request, res: Response) => {
  try {
    const { zonaId, fechaDesde, fechaHasta } = req.query;

    if (!zonaId || !fechaDesde || !fechaHasta) {
      return res.status(400).json({
        error: 'zonaId, fechaDesde y fechaHasta son requeridos'
      });
    }

    const reporte = await billingService.obtenerReporteZona(
      zonaId as string,
      new Date(fechaDesde as string),
      new Date(fechaHasta as string)
    );

    res.json(reporte);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
