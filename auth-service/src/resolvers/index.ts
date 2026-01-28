import { authQueries } from './queries/auth.query';
import { authMutations } from './mutations/auth.mutation';

export const resolvers = {
  Query: {
    ...authQueries
  },
  Mutation: {
    ...authMutations
  }
};
