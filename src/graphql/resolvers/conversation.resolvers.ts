import { GraphQLError } from "graphql";
import {
  deleteConversationForUser,
  getAllMessages,
  getMyConversations,
} from "../../repositories/conversation.repositories";

const normalizeBeforeCursor = (before?: string | null) => {
  if (!before) return null;

  if (/^\d+$/.test(before)) {
    const millis = Number(before);
    if (!Number.isFinite(millis)) return null;
    return new Date(millis).toISOString();
  }

  const parsed = Date.parse(before);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
};

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

  getAllConversation: async (_, { conversation_id, limit, before }, context) => {
    let user = context.user;
    if (user === null) {
      console.log(user);
      throw new GraphQLError("Unauthorized", {
        extensions: {
          code: "UNAUTHORIZED",
        },
      });
    }

    const allMessages = await getAllMessages(
      conversation_id,
      user.id,
      limit ?? 15,
      normalizeBeforeCursor(before),
    );

    return allMessages;
  },
};

const mutations = {
  deleteMyConversation: async (_, { conversation_id }, context) => {
    const user = context.user;
    if (user === null) {
      throw new GraphQLError("Unauthorized", {
        extensions: {
          code: "UNAUTHORIZED",
        },
      });
    }

    const deleted = await deleteConversationForUser(conversation_id, user.id);
    if (!deleted) {
      throw new GraphQLError("Conversation not found", {
        extensions: {
          code: "NOT_FOUND",
        },
      });
    }

    return "Conversation deleted";
  },
};

export const conversationResolvers = {
  Query: queries,
  Mutation: mutations,
};
