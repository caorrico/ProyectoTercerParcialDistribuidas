import { fleetService, CreateMotoInput, CreateLivianoInput, CreateCamionInput, CreateRepartidorInput } from '../../services/fleet.service';
import { EstadoVehiculo, TipoEstado } from '../../entities';

export const fleetMutations = {
  crearMoto: async (_: unknown, { input }: { input: CreateMotoInput }) => {
    return fleetService.crearMoto(input);
  },

  crearLiviano: async (_: unknown, { input }: { input: CreateLivianoInput }) => {
    return fleetService.crearLiviano(input);
  },

  crearCamion: async (_: unknown, { input }: { input: CreateCamionInput }) => {
    return fleetService.crearCamion(input);
  },

  actualizarEstadoVehiculo: async (_: unknown, { placa, estado }: { placa: string; estado: EstadoVehiculo }) => {
    return fleetService.actualizarEstadoVehiculo(placa, estado);
  },

  crearRepartidor: async (_: unknown, { input }: { input: CreateRepartidorInput }) => {
    return fleetService.crearRepartidor(input);
  },

  asignarVehiculo: async (_: unknown, { repartidorId, placa }: { repartidorId: string; placa: string }) => {
    return fleetService.asignarVehiculo(parseInt(repartidorId), placa);
  },

  actualizarUbicacionRepartidor: async (_: unknown, { id, lat, lng }: { id: string; lat: number; lng: number }) => {
    return fleetService.actualizarUbicacionRepartidor(parseInt(id), lat, lng);
  },

  cambiarEstadoRepartidor: async (_: unknown, { id, estado }: { id: string; estado: TipoEstado }) => {
    return fleetService.cambiarEstadoRepartidor(parseInt(id), estado);
  }
};
