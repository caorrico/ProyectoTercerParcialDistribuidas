import { billingQueries } from './queries/billing.query';
import { billingMutations } from './mutations/billing.mutation';

export const resolvers = {
  Query: {
    ...billingQueries
  },
  Mutation: {
    ...billingMutations
  }
};
