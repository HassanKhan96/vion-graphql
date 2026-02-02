import { hash, compare } from "bcrypt";
import { InternalServerError } from "./error.helper";

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string) => {
  try {
    return await hash(password, SALT_ROUNDS);
  } catch (error) {
    console.log(error);
    throw new InternalServerError("Somehting went wrong");
  }
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string,
) => {
  return await compare(password, hashedPassword);
};
