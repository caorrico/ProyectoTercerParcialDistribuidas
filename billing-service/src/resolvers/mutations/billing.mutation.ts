import { billingService, CreateFacturaInput } from '../../services/billing.service';

// Roles permitidos para operaciones de facturación
const ROLES_GERENTE = ['ROLE_GERENTE', 'ROLE_ADMIN'];

// Helper para verificar permisos
const requireGerente = (user: any) => {
  if (!user) {
    throw new Error('No autenticado');
  }

  const hasPermission = user.roles?.some((role: string) =>
    ROLES_GERENTE.includes(role)
  );

  if (!hasPermission) {
    throw new Error('Solo un Gerente o Admin puede realizar esta acción');
  }
};

export const billingMutations = {
  generarFactura: async (
    _: unknown,
    { input }: { input: CreateFacturaInput },
    context: { user?: { userId: string; roles: string[] } }
  ) => {
    requireGerente(context.user);
    return billingService.generarFactura(input);
  },

  emitirFactura: async (
    _: unknown,
    { id }: { id: string },
    context: { user?: { userId: string; roles: string[] } }
  ) => {
    requireGerente(context.user);
    return billingService.emitirFactura(id);
  },

  registrarPago: async (
    _: unknown,
    { id, metodoPago }: { id: string; metodoPago: string }
  ) => {
    // Registrar pago no requiere ser gerente
    return billingService.registrarPago(id, metodoPago);
  },

  anularFactura: async (
    _: unknown,
    { id, motivo }: { id: string; motivo: string },
    context: { user?: { userId: string; roles: string[] } }
  ) => {
    requireGerente(context.user);
    return billingService.anularFactura(id, motivo);
  }
};
