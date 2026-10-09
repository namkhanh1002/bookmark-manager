import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateBody, validateParams } from "../middleware/validate";
import { createTagSchema, idParamSchema, updateTagSchema } from "../validators/schemas";
import { createHandler, listHandler, removeHandler, updateHandler } from "../controllers/tagController";

export const tagRouter = Router();

tagRouter.use(requireAuth);

tagRouter.get("/", listHandler);
tagRouter.post("/", validateBody(createTagSchema), createHandler);
tagRouter.patch("/:id", validateParams(idParamSchema), validateBody(updateTagSchema), updateHandler);
tagRouter.delete("/:id", validateParams(idParamSchema), removeHandler);
