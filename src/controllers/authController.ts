import { Request, Response } from "express";
import { createUser, getUserByEmail } from "../repositories/user.repositories";
import { hashPassword, verifyPassword } from "../helpers/password";
import {
  generateAccessToken,
  generateAuthToken,
  generateRefreshToken,
  verifyAuthToken,
  verifyRefreshToken,
} from "../helpers/auth-token";
import { BadRequestError, ForbiddenError } from "../helpers/error.helper";

const COOKIE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await getUserByEmail(email);

  if (!user) {
    throw new BadRequestError("Invalid email or password");
  }

  const isPaswordValid = await verifyPassword(password, user.password);

  if (!isPaswordValid) {
    throw new BadRequestError("Invalid email or password");
  }

  const payload = { id: user.id, email: user.email };
  const accessToken = generateAccessToken(payload);

  const refreshToken = generateRefreshToken(payload);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_AGE,
  });

  return res.status(200).json({ accessToken, user });
};

export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  const userExists = await getUserByEmail(email);
  if (userExists) {
    throw new BadRequestError("Email already in use");
  }

  const hashedPassword = await hashPassword(password);

  const user = await createUser({
    username,
    email,
    password: hashedPassword,
  });

  let payload = { id: user.id, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_AGE,
  });
  return res.status(200).json({ accessToken, user });
};

export const getNewAccessToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new ForbiddenError("You are not logged in");
  }

  let decoded: any;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ForbiddenError("You are not logged in");
  }

  const user = await getUserByEmail(decoded.email);
  if (!user) {
    throw new ForbiddenError("You are not logged in");
  }

  const newAccessToken = generateAccessToken({
    id: user.id,
    email: user.email,
  });

  return res.status(200).json({ accessToken: newAccessToken });
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("refreshToken");
  return res.status(200).json({ message: "Logged out successfully" });
};
