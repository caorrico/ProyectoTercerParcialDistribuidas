import { fleetQueries } from './queries/fleet.query';
import { fleetMutations } from './mutations/fleet.mutation';
import { TipoVehiculo } from '../entities';

export const resolvers = {
  Query: {
    ...fleetQueries
  },
  Mutation: {
    ...fleetMutations
  },
  VehiculoGQL: {
    __resolveType(obj: any) {
      if (obj.tipoMoto) return 'Moto';
      if (obj.tipoAuto) return 'Liviano';
      if (obj.capacidadToneladas) return 'Camion';
      return null;
    },
  },
};
