import { GraphQLError } from "graphql";
import {
  getUserByEmail,
  getUserById,
} from "../../repositories/user.repositories";
import { QueryUserArgs, ResolversParentTypes } from "../generated/types";

const queries = {
  user: async (_: ResolversParentTypes, { id }: QueryUserArgs) => {
    return await getUserById(id);
  },

  userByEmail: async (_: ResolversParentTypes, { email }, context: any) => {
    const userId = context.user?.id;
    if (!userId) {
      throw new GraphQLError("Unauthorized", {
        extensions: {
          code: "UNAUTHORIZED",
        },
      });
    }

    const { password, updated_at, ...user } = await getUserByEmail(email);
    return user;
  },

  me: async (_: ResolversParentTypes, __: {}, context: any) => {
    const userId = context.user?.id;
    if (!userId) {
      throw new GraphQLError("Unauthorized", {
        extensions: {
          code: "UNAUTHORIZED",
        },
      });
    }
    return await getUserById(userId);
  },
};

const mutations = {};

export const userResolvers = {
  Query: queries,
  Mutation: mutations,
};
