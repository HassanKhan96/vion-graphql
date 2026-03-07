import { GraphQLError } from "graphql";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import {
  getUserByEmail,
  getUserById,
  updateUserAvatar,
} from "../../repositories/user.repositories";
import { QueryUserArgs, ResolversParentTypes } from "../generated/types";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_AVATAR_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const removeDataUrlPrefix = (value: string) => {
  const base64Index = value.indexOf("base64,");
  if (base64Index >= 0) {
    return value.slice(base64Index + "base64,".length);
  }

  return value;
};

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

const mutations = {
  uploadMyAvatar: async (
    _: ResolversParentTypes,
    {
      input,
    }: { input: { base64: string; filename: string; mimeType: string } },
    context: any,
  ) => {
    const userId = context.user?.id;
    if (!userId) {
      throw new GraphQLError("Unauthorized", {
        extensions: {
          code: "UNAUTHORIZED",
        },
      });
    }

    const extension = ALLOWED_AVATAR_TYPES[input.mimeType];
    if (!extension) {
      throw new GraphQLError("Unsupported file type", {
        extensions: {
          code: "BAD_REQUEST",
        },
      });
    }

    const currentUser = await getUserById(userId);

    const rawBase64 = removeDataUrlPrefix(input.base64).replace(/\s/g, "");
    const fileBuffer = Buffer.from(rawBase64, "base64");

    if (!fileBuffer.length) {
      throw new GraphQLError("Invalid file payload", {
        extensions: {
          code: "BAD_REQUEST",
        },
      });
    }

    if (fileBuffer.length > MAX_AVATAR_SIZE) {
      throw new GraphQLError("Avatar file is too large", {
        extensions: {
          code: "BAD_REQUEST",
        },
      });
    }

    const uploadsDir = path.join(process.cwd(), "uploads", "avatars");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeFileName = `${userId}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const fullPath = path.join(uploadsDir, safeFileName);

    await fs.writeFile(fullPath, fileBuffer);

    const avatarUrl = `/uploads/avatars/${safeFileName}`;
    const updatedUser = await updateUserAvatar(userId, avatarUrl);

    const oldAvatar = currentUser?.avatar_url as string | undefined;
    if (oldAvatar && oldAvatar.startsWith("/uploads/avatars/")) {
      const oldPath = path.join(process.cwd(), oldAvatar.replace(/^\//, ""));
      if (oldPath !== fullPath) {
        await fs.unlink(oldPath).catch(() => null);
      }
    }

    return updatedUser;
  },
};

export const userResolvers = {
  Query: queries,
  Mutation: mutations,
};
