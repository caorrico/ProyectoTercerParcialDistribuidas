import { pedidoQueries } from './queries/pedido.query';
import { pedidoMutations } from './mutations/pedido.mutation';

export const resolvers = {
  Query: {
    ...pedidoQueries
  },
  Mutation: {
    ...pedidoMutations
  }
};
