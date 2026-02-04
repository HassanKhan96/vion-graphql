import { sign, verify } from "jsonwebtoken";
import { UnauthorizedError } from "./error.helper";

type JwtPayload = {
  id: string;
  email: string;
};

export const generateAuthToken = (
  payload: JwtPayload,
  expiresIn: any = "1h",
  secret: string = process.env.JWT_SECRET as string,
): string => {
  const token = sign(payload, secret, {
    expiresIn,
  });
  return token;
};

export const generateAccessToken = (payload: JwtPayload) => {
  return generateAuthToken(payload, "24h", process.env.JWT_SECRET as string);
};

export const generateRefreshToken = (payload: JwtPayload) => {
  return generateAuthToken(
    payload,
    "7d",
    process.env.REFRESH_TOKEN_SECRET as string,
  );
};

export const verifyAuthToken = (
  token: string,
  secret: string = process.env.JWT_SECRET as string,
): any => {
  try {
    const decoded = verify(token, secret);
    return decoded;
  } catch (error: any) {
    throw new UnauthorizedError("Invalid or expired token");
  }
};

export const verifyAccessToken = (token: string): any => {
  return verifyAuthToken(token, process.env.JWT_SECRET as string);
};

export const verifyRefreshToken = (token: string): any => {
  return verifyAuthToken(token, process.env.REFRESH_TOKEN_SECRET as string);
};
