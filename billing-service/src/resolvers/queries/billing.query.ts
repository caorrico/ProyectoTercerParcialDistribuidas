import { billingService, FacturaFiltro } from '../../services/billing.service';

export const billingQueries = {
  factura: async (_: unknown, { id }: { id: string }) => {
    return billingService.obtenerFactura(id);
  },

  facturaPorNumero: async (_: unknown, { numeroFactura }: { numeroFactura: string }) => {
    return billingService.obtenerFacturaPorNumero(numeroFactura);
  },

  facturas: async (_: unknown, { filtro }: { filtro?: FacturaFiltro }) => {
    return billingService.listarFacturas(filtro);
  },

  facturasPorCliente: async (_: unknown, { clienteId }: { clienteId: string }) => {
    return billingService.listarFacturasPorCliente(clienteId);
  },

  kpiDiario: async (_: unknown, { fecha, zonaId }: { fecha: string; zonaId?: string }) => {
    return billingService.obtenerKPIDiario(new Date(fecha), zonaId);
  },

  reporteZona: async (_: unknown, { zonaId, fechaDesde, fechaHasta }: { zonaId: string; fechaDesde: string; fechaHasta: string }) => {
    return billingService.obtenerReporteZona(zonaId, new Date(fechaDesde), new Date(fechaHasta));
  }
};
