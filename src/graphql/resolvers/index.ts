import { mergeResolvers } from "@graphql-tools/merge";
import { userResolvers } from "./user.resolvers";
import { friendResolvers } from "./friends.resolvers";
import { conversationResolvers } from "./conversation.resolvers";

export const resolvers = mergeResolvers([
  userResolvers,
  friendResolvers,
  conversationResolvers,
]);
