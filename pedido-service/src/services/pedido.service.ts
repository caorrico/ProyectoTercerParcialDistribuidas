import { AppDataSource } from '../utils/database';
import { Pedido, EstadoPedido, TipoEntrega } from '../entities';
import { pedidoProducer } from '../messaging/pedido.producer';

export interface CreatePedidoInput {
  clienteId: number;
  direccionOrigen: string;
  direccionDestino: string;
  descripcion: string;
  tipoEntrega: TipoEntrega;
  zonaId?: string;
  peso?: number;
  latOrigen?: number;
  lngOrigen?: number;
  latDestino?: number;
  lngDestino?: number;
  observaciones?: string;
  fechaEstimadaEntrega?: Date;
}

export interface UpdatePedidoInput {
  direccionOrigen?: string;
  direccionDestino?: string;
  descripcion?: string;
  observaciones?: string;
  fechaEstimadaEntrega?: Date;
}

export interface PedidoFiltro {
  estado?: EstadoPedido;
  tipoEntrega?: TipoEntrega;
  zonaId?: string;
  clienteId?: number;
  repartidorId?: number;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

export class PedidoService {
  private pedidoRepository = AppDataSource.getRepository(Pedido);

  async crearPedido(input: CreatePedidoInput): Promise<Pedido> {
    const pedido = this.pedidoRepository.create({
      ...input,
      estado: EstadoPedido.RECIBIDO
    });

    await this.pedidoRepository.save(pedido);

    // Publicar evento
    await pedidoProducer.publishPedidoCreado(pedido);

    return pedido;
  }

  async obtenerPedido(id: number): Promise<Pedido | null> {
    return this.pedidoRepository.findOne({ where: { id } });
  }

  async obtenerPedidoPorCodigo(codigo: string): Promise<Pedido | null> {
    return this.pedidoRepository.findOne({ where: { codigo } });
  }

  async listarPedidos(filtro?: PedidoFiltro): Promise<Pedido[]> {
    const queryBuilder = this.pedidoRepository.createQueryBuilder('pedido');

    if (filtro) {
      if (filtro.estado) {
        queryBuilder.andWhere('pedido.estado = :estado', { estado: filtro.estado });
      }
      if (filtro.tipoEntrega) {
        queryBuilder.andWhere('pedido.tipoEntrega = :tipoEntrega', { tipoEntrega: filtro.tipoEntrega });
      }
      if (filtro.zonaId) {
        queryBuilder.andWhere('pedido.zonaId = :zonaId', { zonaId: filtro.zonaId });
      }
      if (filtro.clienteId) {
        queryBuilder.andWhere('pedido.clienteId = :clienteId', { clienteId: filtro.clienteId });
      }
      if (filtro.repartidorId) {
        queryBuilder.andWhere('pedido.repartidorId = :repartidorId', { repartidorId: filtro.repartidorId });
      }
      if (filtro.fechaDesde) {
        queryBuilder.andWhere('pedido.createdAt >= :fechaDesde', { fechaDesde: filtro.fechaDesde });
      }
      if (filtro.fechaHasta) {
        queryBuilder.andWhere('pedido.createdAt <= :fechaHasta', { fechaHasta: filtro.fechaHasta });
      }
    }

    queryBuilder.orderBy('pedido.createdAt', 'DESC');
    return queryBuilder.getMany();
  }

  async listarPedidosPorCliente(clienteId: number): Promise<Pedido[]> {
    return this.pedidoRepository.find({
      where: { clienteId },
      order: { createdAt: 'DESC' }
    });
  }

  async listarPedidosPorRepartidor(repartidorId: number): Promise<Pedido[]> {
    return this.pedidoRepository.find({
      where: { repartidorId },
      order: { createdAt: 'DESC' }
    });
  }

  async listarPedidosPorZona(zonaId: string): Promise<Pedido[]> {
    return this.pedidoRepository.find({
      where: { zonaId },
      order: { createdAt: 'DESC' }
    });
  }

  async actualizarPedido(id: number, input: UpdatePedidoInput): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({ where: { id } });
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    Object.assign(pedido, input);
    return this.pedidoRepository.save(pedido);
  }

  async cambiarEstado(id: number, nuevoEstado: EstadoPedido): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({ where: { id } });
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    const estadoAnterior = pedido.estado;

    // Validar transición de estado
    this.validarTransicionEstado(estadoAnterior, nuevoEstado);

    pedido.estado = nuevoEstado;

    if (nuevoEstado === EstadoPedido.ENTREGADO) {
      pedido.fechaEntrega = new Date();
    }

    await this.pedidoRepository.save(pedido);

    // Publicar evento
    await pedidoProducer.publishPedidoActualizado(pedido, estadoAnterior);

    if (nuevoEstado === EstadoPedido.ENTREGADO) {
      await pedidoProducer.publishPedidoEntregado(pedido);
    }

    return pedido;
  }

  async asignarRepartidor(id: number, repartidorId: number): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({ where: { id } });
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    if (pedido.estado !== EstadoPedido.RECIBIDO) {
      throw new Error('Solo se pueden asignar pedidos en estado RECIBIDO');
    }

    pedido.repartidorId = repartidorId;
    pedido.estado = EstadoPedido.ASIGNADO;

    await this.pedidoRepository.save(pedido);

    // Publicar eventos
    await pedidoProducer.publishPedidoAsignado(pedido, repartidorId);
    await pedidoProducer.publishPedidoActualizado(pedido, EstadoPedido.RECIBIDO);

    return pedido;
  }

  async cancelarPedido(id: number, motivo: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({ where: { id } });
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    if (pedido.estado === EstadoPedido.ENTREGADO || pedido.estado === EstadoPedido.CANCELADO) {
      throw new Error('No se puede cancelar un pedido entregado o ya cancelado');
    }

    const estadoAnterior = pedido.estado;
    pedido.estado = EstadoPedido.CANCELADO;
    pedido.observaciones = (pedido.observaciones || '') + `\nCancelado: ${motivo}`;

    await this.pedidoRepository.save(pedido);

    // Publicar eventos
    await pedidoProducer.publishPedidoCancelado(pedido, motivo);
    await pedidoProducer.publishPedidoActualizado(pedido, estadoAnterior);

    return pedido;
  }

  async obtenerEstadisticas(zonaId?: string): Promise<{
    total: number;
    recibidos: number;
    asignados: number;
    enRuta: number;
    entregados: number;
    cancelados: number;
  }> {
    const queryBuilder = this.pedidoRepository.createQueryBuilder('pedido');

    if (zonaId) {
      queryBuilder.where('pedido.zonaId = :zonaId', { zonaId });
    }

    const [total, recibidos, asignados, enRuta, entregados, cancelados] = await Promise.all([
      queryBuilder.getCount(),
      this.pedidoRepository.count({ where: zonaId ? { zonaId, estado: EstadoPedido.RECIBIDO } : { estado: EstadoPedido.RECIBIDO } }),
      this.pedidoRepository.count({ where: zonaId ? { zonaId, estado: EstadoPedido.ASIGNADO } : { estado: EstadoPedido.ASIGNADO } }),
      this.pedidoRepository.count({ where: zonaId ? { zonaId, estado: EstadoPedido.EN_RUTA } : { estado: EstadoPedido.EN_RUTA } }),
      this.pedidoRepository.count({ where: zonaId ? { zonaId, estado: EstadoPedido.ENTREGADO } : { estado: EstadoPedido.ENTREGADO } }),
      this.pedidoRepository.count({ where: zonaId ? { zonaId, estado: EstadoPedido.CANCELADO } : { estado: EstadoPedido.CANCELADO } })
    ]);

    return { total, recibidos, asignados, enRuta, entregados, cancelados };
  }

  private validarTransicionEstado(estadoActual: EstadoPedido, nuevoEstado: EstadoPedido): void {
    const transicionesValidas: Record<EstadoPedido, EstadoPedido[]> = {
      [EstadoPedido.RECIBIDO]: [EstadoPedido.ASIGNADO, EstadoPedido.CANCELADO],
      [EstadoPedido.ASIGNADO]: [EstadoPedido.EN_RUTA, EstadoPedido.CANCELADO],
      [EstadoPedido.EN_RUTA]: [EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO],
      [EstadoPedido.ENTREGADO]: [],
      [EstadoPedido.CANCELADO]: []
    };

    if (!transicionesValidas[estadoActual].includes(nuevoEstado)) {
      throw new Error(`Transición de estado inválida: ${estadoActual} -> ${nuevoEstado}`);
    }
  }
}

export const pedidoService = new PedidoService();
