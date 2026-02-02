import { Request } from "express";
import { verifyAuthToken } from "./auth-token";

export const authContext = (req: Request) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader) {
    return { user: null };
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    const user = verifyAuthToken(token);
    return { user };
  } catch (error) {
    return { user: null };
  }
};
