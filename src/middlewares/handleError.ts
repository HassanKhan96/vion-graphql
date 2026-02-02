import { NextFunction, Request, Response } from "express";
import { CustomError } from "../helpers/error.helper";

export const handleError = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log(error.stack);

  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    message: error.message || "Internal Server Error",
    code: error.code || "INTERNAL_SERVER_ERROR",
  });
};
