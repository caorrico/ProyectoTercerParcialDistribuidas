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
  Vehiculo: {
    __resolveType(obj: { tipoVehiculo: TipoVehiculo }) {
      switch (obj.tipoVehiculo) {
        case TipoVehiculo.MOTO:
          return 'Moto';
        case TipoVehiculo.LIVIANO:
          return 'Liviano';
        case TipoVehiculo.CAMION:
          return 'Camion';
        default:
          return null;
      }
    }
  }
};
