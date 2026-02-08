import { fleetService, CreateMotoInput, CreateLivianoInput, CreateCamionInput, CreateRepartidorInput } from '../../services/fleet.service';
import { EstadoVehiculo, TipoEstado } from '../../entities';

export const fleetMutations = {
  crearMoto: async (_: unknown, { input }: { input: CreateMotoInput }, context: any) => {
    return fleetService.crearMoto(input, context.user);
  },

  crearLiviano: async (_: unknown, { input }: { input: CreateLivianoInput }, context: any) => {
    return fleetService.crearLiviano(input, context.user);

  },

  crearCamion: async (_: unknown, { input }: { input: CreateCamionInput }, context: any) => {
    return fleetService.crearCamion(input, context.user);
  },

  actualizarEstadoVehiculo: async (_: unknown, { placa, estado }: { placa: string; estado: EstadoVehiculo }, context: any) => {
    return fleetService.actualizarEstadoVehiculo(placa, estado, context.user);
  },

  crearRepartidor: async (_: unknown, { input }: { input: CreateRepartidorInput }, context: any) => {
    return fleetService.crearRepartidor(input, context.user);
  },

  asignarVehiculo: async (_: unknown, { repartidorId, placa }: { repartidorId: string; placa: string }, context: any) => {
    return fleetService.asignarVehiculo(repartidorId, placa, context.user);
  },

  actualizarUbicacionRepartidor: async (_: unknown, { id, lat, lng }: { id: string; lat: number; lng: number }, context: any) => {
    return fleetService.actualizarUbicacionRepartidor(id, lat, lng, context.user);
  },

  cambiarEstadoRepartidor: async (_: unknown, { id, estado }: { id: string; estado: TipoEstado }, context: any) => {
    return fleetService.cambiarEstadoRepartidor(id, estado, context.user);
  }
};
