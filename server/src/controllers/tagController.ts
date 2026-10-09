import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { requireUserId } from "../middleware/auth";
import { paramId } from "../lib/http";
import { createTag, deleteTag, listTags, updateTag } from "../services/tagService";
import type { CreateTagInput, UpdateTagInput } from "../validators/schemas";

export const listHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const tags = await listTags(userId);
  res.json({ success: true, data: tags });
});

export const createHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const input = req.body as CreateTagInput;
  const tag = await createTag(userId, input);
  res.status(201).json({ success: true, data: tag });
});

export const updateHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const input = req.body as UpdateTagInput;
  const tag = await updateTag(userId, paramId(req), input);
  res.json({ success: true, data: tag });
});

export const removeHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  await deleteTag(userId, paramId(req));
  res.json({ success: true, data: { id: paramId(req) } });
});
