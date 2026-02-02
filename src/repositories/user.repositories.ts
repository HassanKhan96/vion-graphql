import { getDBClient } from "../configs/db";
import { tryCatch } from "../helpers/tryCatch.helper";
import {
  CustomError,
  InternalServerError,
  throwDBError,
} from "../helpers/error.helper";

export const getUserByEmail = async (email: string) => {
  const db = await getDBClient();

  let promise = db.query("SELECT * FROM users WHERE email = $1", [email]);

  const [data, error] = await tryCatch(promise);

  if (error)
    throw new InternalServerError(
      "Database error while fetching user by email",
    );

  return data.rows[0];
};

export const getUserById = async (id: string) => {
  const db = await getDBClient();

  let promise = db.query("SELECT * FROM users WHERE id = $1", [id]);

  let [data, error] = await tryCatch(promise);

  if (error) throwDBError();

  return data.rows[0];
};

export const createUser = async (input: {
  username: string;
  email: string;
  password: string;
}) => {
  const db = await getDBClient();

  const { username, email, password } = input;

  const query =
    "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *";

  const values = [username, email, password];

  const promise = db.query(query, values);

  const [result, error] = await tryCatch(promise);

  if (error) throwDBError("Failed to create user");

  return result.rows[0];
};
