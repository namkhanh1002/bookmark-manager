import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { requireUserId } from "../middleware/auth";
import { login, register, getProfile } from "../services/authService";
import type { LoginInput, RegisterInput } from "../validators/schemas";

export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as RegisterInput;
  const result = await register(input);
  res.status(201).json({ success: true, data: result });
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as LoginInput;
  const result = await login(input);
  res.json({ success: true, data: result });
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const user = await getProfile(userId);
  res.json({ success: true, data: user });
});
