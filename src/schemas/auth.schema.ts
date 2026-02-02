import joi from "joi";

export const loginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().min(6).required(),
});

export const registerSchema = joi.object({
  username: joi.string().min(3).max(50).required(),
  email: joi.string().email().required(),
  password: joi.string().min(6).required(),
});
