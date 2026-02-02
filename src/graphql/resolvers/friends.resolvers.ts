import { GraphQLError } from "graphql";
import {
  addFriendRequest,
  getFriendRequestById,
  getMyFriends,
  getMyPendingFriendRequests,
  unFriend,
  updateFriendRequestStatus,
} from "../../repositories/friends.repositories";
import { throwGraphQLError } from "../../helpers/error.helper";
import { MyContext } from "../context/auth.context";
import {
  MutationAcceptFriendRequestArgs,
  ResolversParentTypes,
} from "../generated/types";

const queries = {
  myFriendRequests: async (
    _: ResolversParentTypes,
    __: any,
    context: MyContext,
  ) => {
    if (context.user === null) {
      throw new GraphQLError("Unauthorized", {
        extensions: {
          code: "UNAUTHORIZED",
        },
      });
    }

    const result = await getMyPendingFriendRequests(context.user.id);
    return result;
  },

  myfriends: async (_: ResolversParentTypes, __: any, context: MyContext) => {
    if (context.user === null) {
      throw new GraphQLError("Unauthorized", {
        extensions: {
          code: "UNAUTHORIZED",
        },
      });
    }

    const friends = await getMyFriends(context.user.id);
    return friends;
  },

  unFriend: async (
    _: ResolversParentTypes,
    { userId }: { userId: string },
    context: MyContext,
  ) => {
    if (context.user === null) {
      throw new GraphQLError("Unauthorized", {
        extensions: {
          code: "UNAUTHORIZED",
        },
      });
    }

    return await unFriend(context.user.id, userId);
  },
};

const mutations = {
  sendFriendRequest: async (
    _: ResolversParentTypes,
    args: { toUserId: string },
    context: MyContext,
  ) => {
    if (context.user === null) {
      throw new GraphQLError("Unauthorized", {
        extensions: {
          code: "UNAUTHORIZED",
        },
      });
    }

    if (context.user.id === args.toUserId) {
      throwGraphQLError(
        "Cannot send friend request to yourself",
        "BAD_REQUEST",
      );
    }

    await addFriendRequest(context.user.id, args.toUserId);

    return "Friend request sent";
  },

  acceptFriendRequest: async (
    _: ResolversParentTypes,
    args: MutationAcceptFriendRequestArgs,
    context: MyContext,
  ) => {
    if (context.user === null) {
      throw new GraphQLError("Unauthorized", {
        extensions: {
          code: "UNAUTHORIZED",
        },
      });
    }

    const friendRequest = await getFriendRequestById(args.input.requestId);

    if (friendRequest.user_id2 !== context.user.id) {
      throw new GraphQLError("Unauthorized to accept this friend request", {
        extensions: {
          code: "UNAUTHORIZED",
        },
      });
    }

    const result = await updateFriendRequestStatus(
      args.input.requestId,
      args.input.status,
    );
    return result;
  },
};

export const friendResolvers = {
  Query: queries,
  Mutation: mutations,
};
