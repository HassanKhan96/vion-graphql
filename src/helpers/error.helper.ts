import { GraphQLError } from "graphql";

export function throwGraphQLError(message: string, code: string) {
  throw new GraphQLError(message, {
    extensions: {
      code,
    },
  });
}

export function throwDBError(message: string = "Failed to fetch") {
  throwGraphQLError(message, "DB_ERROR");
}

export function throwDBConnectionError(error: Error) {
  console.log(error);
  throwGraphQLError("Error: Cannot connect to Database", "DB_CONNECTION");
}

export class CustomError extends Error {
  code: string;
  statusCode: number;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    stack?: string,
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.stack = stack;
  }
}

export class BadRequestError extends CustomError {
  constructor(message: string = "Bad Request", stack?: string) {
    super(message, "BAD_REQUEST", 400, stack);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = "Unauthorized", stack?: string) {
    super(message, "UNAUTHORIZED", 401, stack);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = "Forbidden", stack?: string) {
    super(message, "FORBIDDEN", 403, stack);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = "Not Found", stack?: string) {
    super(message, "NOT_FOUND", 404, stack);
  }
}

export class InternalServerError extends CustomError {
  constructor(message: string = "Internal Server Error", stack?: string) {
    super(message, "INTERNAL_SERVER_ERROR", 500, stack);
  }
}
