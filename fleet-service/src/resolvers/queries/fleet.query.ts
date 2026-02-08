import { fleetService } from '../../services/fleet.service';
import { TipoVehiculo } from '../../entities';

export const fleetQueries = {
  vehiculos: async () => {
    return fleetService.listarVehiculos();
  },

  vehiculosPorTipo: async (_: unknown, { tipo }: { tipo: TipoVehiculo }) => {
    return fleetService.listarVehiculosPorTipo(tipo);
  },

  vehiculosDisponibles: async () => {
    return fleetService.listarVehiculosDisponibles();
  },

  vehiculo: async (_: unknown, { id }: { id: string }) => {
    return fleetService.obtenerVehiculo(id);
  },

  vehiculoPorPlaca: async (_: unknown, { placa }: { placa: string }) => {
    return fleetService.obtenerVehiculoPorPlaca(placa);
  },

  repartidores: async () => {
    return fleetService.listarRepartidores();
  },

  repartidoresActivos: async () => {
    return fleetService.listarRepartidoresActivos();
  },

  repartidoresPorZona: async (_: unknown, { zonaId }: { zonaId: string }) => {
    return fleetService.listarRepartidoresPorZona(zonaId);
  },

  repartidor: async (_: unknown, { id }: { id: string }) => {
    return fleetService.obtenerRepartidor(id);
  },

  flotaActiva: async (_: unknown, { zonaId }: { zonaId?: string }) => {
    return fleetService.obtenerFlotaActiva(zonaId);
  }
};
