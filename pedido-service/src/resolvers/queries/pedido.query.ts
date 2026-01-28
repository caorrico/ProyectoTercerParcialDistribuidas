import { pedidoService, PedidoFiltro } from '../../services/pedido.service';

export const pedidoQueries = {
  pedido: async (_: unknown, { id }: { id: string }) => {
    return pedidoService.obtenerPedido(parseInt(id));
  },

  pedidoPorCodigo: async (_: unknown, { codigo }: { codigo: string }) => {
    return pedidoService.obtenerPedidoPorCodigo(codigo);
  },

  pedidos: async (_: unknown, { filtro }: { filtro?: PedidoFiltro }) => {
    return pedidoService.listarPedidos(filtro);
  },

  pedidosPorCliente: async (_: unknown, { clienteId }: { clienteId: number }) => {
    return pedidoService.listarPedidosPorCliente(clienteId);
  },

  pedidosPorRepartidor: async (_: unknown, { repartidorId }: { repartidorId: number }) => {
    return pedidoService.listarPedidosPorRepartidor(repartidorId);
  },

  pedidosPorZona: async (_: unknown, { zonaId }: { zonaId: string }) => {
    return pedidoService.listarPedidosPorZona(zonaId);
  },

  estadisticasPedidos: async (_: unknown, { zonaId }: { zonaId?: string }) => {
    return pedidoService.obtenerEstadisticas(zonaId);
  }
};
