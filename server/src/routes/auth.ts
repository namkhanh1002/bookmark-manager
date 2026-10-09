import { Router } from "express";
import { validateBody } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";
import { loginSchema, registerSchema } from "../validators/schemas";
import { loginHandler, meHandler, registerHandler } from "../controllers/authController";

export const authRouter = Router();

authRouter.post("/register", authLimiter, validateBody(registerSchema), registerHandler);
authRouter.post("/login", authLimiter, validateBody(loginSchema), loginHandler);
authRouter.get("/me", requireAuth, meHandler);
