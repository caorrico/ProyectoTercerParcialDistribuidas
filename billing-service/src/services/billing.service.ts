import { AppDataSource } from '../utils/database';
import { Factura, EstadoFactura } from '../entities';
import { billingProducer } from '../messaging/billing.producer';

const TASA_IMPUESTO = 0.15; // 15% IVA

export interface CreateFacturaInput {
  pedidoId: number;
  clienteId: number;
  subtotal: number;
  descuento?: number;
  tipoEntrega?: string;
  zonaId?: string;
  observaciones?: string;
}

export interface FacturaFiltro {
  estado?: EstadoFactura;
  clienteId?: number;
  pedidoId?: number;
  zonaId?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

export class BillingService {
  private facturaRepository = AppDataSource.getRepository(Factura);

  async generarFactura(input: CreateFacturaInput): Promise<Factura> {
    const { pedidoId, clienteId, subtotal, descuento = 0, tipoEntrega, zonaId, observaciones } = input;

    // Calcular impuestos y total
    const baseImponible = subtotal - descuento;
    const impuestos = Number((baseImponible * TASA_IMPUESTO).toFixed(2));
    const total = Number((baseImponible + impuestos).toFixed(2));

    const factura = this.facturaRepository.create({
      pedidoId,
      clienteId,
      subtotal,
      descuento,
      impuestos,
      total,
      tipoEntrega,
      zonaId,
      observaciones,
      estado: EstadoFactura.BORRADOR
    });

    await this.facturaRepository.save(factura);
    await billingProducer.publishFacturaCreada(factura);

    return factura;
  }

  async obtenerFactura(id: number): Promise<Factura | null> {
    return this.facturaRepository.findOne({ where: { id } });
  }

  async obtenerFacturaPorNumero(numeroFactura: string): Promise<Factura | null> {
    return this.facturaRepository.findOne({ where: { numeroFactura } });
  }

  async listarFacturas(filtro?: FacturaFiltro): Promise<Factura[]> {
    const queryBuilder = this.facturaRepository.createQueryBuilder('factura');

    if (filtro) {
      if (filtro.estado) {
        queryBuilder.andWhere('factura.estado = :estado', { estado: filtro.estado });
      }
      if (filtro.clienteId) {
        queryBuilder.andWhere('factura.clienteId = :clienteId', { clienteId: filtro.clienteId });
      }
      if (filtro.pedidoId) {
        queryBuilder.andWhere('factura.pedidoId = :pedidoId', { pedidoId: filtro.pedidoId });
      }
      if (filtro.zonaId) {
        queryBuilder.andWhere('factura.zonaId = :zonaId', { zonaId: filtro.zonaId });
      }
      if (filtro.fechaDesde) {
        queryBuilder.andWhere('factura.createdAt >= :fechaDesde', { fechaDesde: filtro.fechaDesde });
      }
      if (filtro.fechaHasta) {
        queryBuilder.andWhere('factura.createdAt <= :fechaHasta', { fechaHasta: filtro.fechaHasta });
      }
    }

    queryBuilder.orderBy('factura.createdAt', 'DESC');
    return queryBuilder.getMany();
  }

  async listarFacturasPorCliente(clienteId: number): Promise<Factura[]> {
    return this.facturaRepository.find({
      where: { clienteId },
      order: { createdAt: 'DESC' }
    });
  }

  async emitirFactura(id: number): Promise<Factura> {
    const factura = await this.facturaRepository.findOne({ where: { id } });
    if (!factura) {
      throw new Error('Factura no encontrada');
    }

    if (factura.estado !== EstadoFactura.BORRADOR) {
      throw new Error('Solo se pueden emitir facturas en estado BORRADOR');
    }

    factura.estado = EstadoFactura.EMITIDA;
    factura.fechaEmision = new Date();

    await this.facturaRepository.save(factura);
    await billingProducer.publishFacturaEmitida(factura);

    return factura;
  }

  async registrarPago(id: number, metodoPago: string): Promise<Factura> {
    const factura = await this.facturaRepository.findOne({ where: { id } });
    if (!factura) {
      throw new Error('Factura no encontrada');
    }

    if (factura.estado !== EstadoFactura.EMITIDA) {
      throw new Error('Solo se pueden pagar facturas en estado EMITIDA');
    }

    factura.estado = EstadoFactura.PAGADA;
    factura.fechaPago = new Date();
    factura.metodoPago = metodoPago;

    await this.facturaRepository.save(factura);
    await billingProducer.publishFacturaPagada(factura);

    return factura;
  }

  async anularFactura(id: number, motivo: string): Promise<Factura> {
    const factura = await this.facturaRepository.findOne({ where: { id } });
    if (!factura) {
      throw new Error('Factura no encontrada');
    }

    if (factura.estado === EstadoFactura.ANULADA) {
      throw new Error('La factura ya está anulada');
    }

    factura.estado = EstadoFactura.ANULADA;
    factura.observaciones = (factura.observaciones || '') + `\nAnulada: ${motivo}`;

    await this.facturaRepository.save(factura);
    await billingProducer.publishFacturaAnulada(factura, motivo);

    return factura;
  }

  async obtenerKPIDiario(fecha: Date, zonaId?: string): Promise<{
    totalFacturado: number;
    cantidadFacturas: number;
    facturasPagadas: number;
    facturasAnuladas: number;
    promedioFactura: number;
  }> {
    const startOfDay = new Date(fecha);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(fecha);
    endOfDay.setHours(23, 59, 59, 999);

    const queryBuilder = this.facturaRepository.createQueryBuilder('factura')
      .where('factura.createdAt >= :startOfDay', { startOfDay })
      .andWhere('factura.createdAt <= :endOfDay', { endOfDay });

    if (zonaId) {
      queryBuilder.andWhere('factura.zonaId = :zonaId', { zonaId });
    }

    const facturas = await queryBuilder.getMany();

    const totalFacturado = facturas
      .filter(f => f.estado !== EstadoFactura.ANULADA)
      .reduce((sum, f) => sum + Number(f.total), 0);

    const facturasPagadas = facturas.filter(f => f.estado === EstadoFactura.PAGADA).length;
    const facturasAnuladas = facturas.filter(f => f.estado === EstadoFactura.ANULADA).length;
    const cantidadFacturas = facturas.filter(f => f.estado !== EstadoFactura.ANULADA).length;
    const promedioFactura = cantidadFacturas > 0 ? totalFacturado / cantidadFacturas : 0;

    return {
      totalFacturado: Number(totalFacturado.toFixed(2)),
      cantidadFacturas,
      facturasPagadas,
      facturasAnuladas,
      promedioFactura: Number(promedioFactura.toFixed(2))
    };
  }

  async obtenerReporteZona(zonaId: string, fechaDesde: Date, fechaHasta: Date): Promise<{
    zona: string;
    totalFacturado: number;
    cantidadPedidos: number;
    facturasPorEstado: { estado: string; cantidad: number }[];
  }> {
    const facturas = await this.facturaRepository.find({
      where: { zonaId }
    });

    const facturasEnRango = facturas.filter(f => {
      const created = new Date(f.createdAt);
      return created >= fechaDesde && created <= fechaHasta;
    });

    const totalFacturado = facturasEnRango
      .filter(f => f.estado !== EstadoFactura.ANULADA)
      .reduce((sum, f) => sum + Number(f.total), 0);

    const facturasPorEstado = Object.values(EstadoFactura).map(estado => ({
      estado,
      cantidad: facturasEnRango.filter(f => f.estado === estado).length
    }));

    return {
      zona: zonaId,
      totalFacturado: Number(totalFacturado.toFixed(2)),
      cantidadPedidos: facturasEnRango.length,
      facturasPorEstado
    };
  }
}

export const billingService = new BillingService();
