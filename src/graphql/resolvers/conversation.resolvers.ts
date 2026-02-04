import { GraphQLError } from "graphql";
import {
  getAllMessages,
  getMyConversations,
} from "../../repositories/conversation.repositories";

const queries = {
  myConversations: async (_, __, context) => {
    if (context.user === null) {
      throw new GraphQLError("Unauthorized", {
        extensions: {
          code: "UNAUTHORIZED",
        },
      });
    }

    const conversations = await getMyConversations(context.user.id);
    return conversations;
  },

  getAllConversation: async (_, { conversation_id }, context) => {
    let user = context.user;
    if (user === null) {
      console.log(user);
      throw new GraphQLError("Unauthorized", {
        extensions: {
          code: "UNAUTHORIZED",
        },
      });
    }

    const allMessages = await getAllMessages(conversation_id, user.id);

    return allMessages;
  },
};

const mutations = {};

export const conversationResolvers = {
  Query: queries,
  Mutation: mutations,
};
