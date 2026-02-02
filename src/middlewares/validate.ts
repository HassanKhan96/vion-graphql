import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { BadRequestError } from "../helpers/error.helper";

export const validate = (schema: Joi.ObjectSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      console.log(error);
      throw new BadRequestError(error.details[0].message);
    }
    next();
  };
};
