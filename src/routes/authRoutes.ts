import { Router } from "express";
import * as authController from "../controllers/authController";
import { validate } from "../middlewares/validate";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
const router = Router();

router.post("/login", validate(loginSchema), authController.login);
router.post("/register", validate(registerSchema), authController.register);
router.get("/refresh-token", authController.getNewAccessToken);
router.get("/logout", authController.logout);

export default router;
