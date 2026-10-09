import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateBody, validateParams, validateQuery } from "../middleware/validate";
import { metadataLimiter } from "../middleware/rateLimit";
import {
  createBookmarkSchema,
  idParamSchema,
  importBookmarksSchema,
  listBookmarksQuerySchema,
  metadataSchema,
  updateBookmarkSchema,
} from "../validators/schemas";
import {
  archiveHandler,
  createHandler,
  exportHandler,
  getHandler,
  importHandler,
  listHandler,
  metadataHandler,
  pinHandler,
  removeHandler,
  restoreHandler,
  statsHandler,
  unpinHandler,
  updateHandler,
  visitHandler,
} from "../controllers/bookmarkController";

export const bookmarkRouter = Router();

bookmarkRouter.use(requireAuth);

bookmarkRouter.get("/", validateQuery(listBookmarksQuerySchema), listHandler);
bookmarkRouter.get("/export", exportHandler);
bookmarkRouter.get("/stats", statsHandler);
bookmarkRouter.post("/metadata", metadataLimiter, validateBody(metadataSchema), metadataHandler);
bookmarkRouter.post("/import", validateBody(importBookmarksSchema), importHandler);
bookmarkRouter.post("/", validateBody(createBookmarkSchema), createHandler);
bookmarkRouter.get("/:id", validateParams(idParamSchema), getHandler);
bookmarkRouter.patch(
  "/:id",
  validateParams(idParamSchema),
  validateBody(updateBookmarkSchema),
  updateHandler,
);
bookmarkRouter.delete("/:id", validateParams(idParamSchema), removeHandler);
bookmarkRouter.post("/:id/pin", validateParams(idParamSchema), pinHandler);
bookmarkRouter.post("/:id/unpin", validateParams(idParamSchema), unpinHandler);
bookmarkRouter.post("/:id/archive", validateParams(idParamSchema), archiveHandler);
bookmarkRouter.post("/:id/restore", validateParams(idParamSchema), restoreHandler);
bookmarkRouter.post("/:id/visit", validateParams(idParamSchema), visitHandler);
