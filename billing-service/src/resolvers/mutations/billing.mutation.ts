import { billingService, CreateFacturaInput } from '../../services/billing.service';

export const billingMutations = {
  generarFactura: async (_: unknown, { input }: { input: CreateFacturaInput }) => {
    return billingService.generarFactura(input);
  },

  emitirFactura: async (_: unknown, { id }: { id: string }) => {
    return billingService.emitirFactura(parseInt(id));
  },

  registrarPago: async (_: unknown, { id, metodoPago }: { id: string; metodoPago: string }) => {
    return billingService.registrarPago(parseInt(id), metodoPago);
  },

  anularFactura: async (_: unknown, { id, motivo }: { id: string; motivo: string }) => {
    return billingService.anularFactura(parseInt(id), motivo);
  }
};
