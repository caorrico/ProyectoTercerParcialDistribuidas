import { pedidoService, CreatePedidoInput, UpdatePedidoInput } from '../../services/pedido.service';
import { EstadoPedido } from '../../entities';

export const pedidoMutations = {
  crearPedido: async (_: unknown, { input }: { input: CreatePedidoInput }) => {
    return pedidoService.crearPedido(input);
  },

  actualizarPedido: async (_: unknown, { id, input }: { id: string; input: UpdatePedidoInput }) => {
    return pedidoService.actualizarPedido(parseInt(id), input);
  },

  cambiarEstadoPedido: async (_: unknown, { id, estado }: { id: string; estado: EstadoPedido }) => {
    return pedidoService.cambiarEstado(parseInt(id), estado);
  },

  asignarRepartidor: async (_: unknown, { id, repartidorId }: { id: string; repartidorId: number }) => {
    return pedidoService.asignarRepartidor(parseInt(id), repartidorId);
  },

  cancelarPedido: async (_: unknown, { id, motivo }: { id: string; motivo: string }) => {
    return pedidoService.cancelarPedido(parseInt(id), motivo);
  },

  iniciarEntrega: async (_: unknown, { id }: { id: string }) => {
    return pedidoService.cambiarEstado(parseInt(id), EstadoPedido.EN_RUTA);
  },

  confirmarEntrega: async (_: unknown, { id }: { id: string }) => {
    return pedidoService.cambiarEstado(parseInt(id), EstadoPedido.ENTREGADO);
  }
};
