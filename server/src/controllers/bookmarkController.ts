import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { requireUserId } from "../middleware/auth";
import { paramId } from "../lib/http";
import {
  archiveBookmark,
  createBookmark,
  deleteBookmark,
  exportBookmarks,
  getBookmark,
  getStats,
  listBookmarks,
  pinBookmark,
  restoreBookmark,
  unpinBookmark,
  updateBookmark,
  visitBookmark,
} from "../services/bookmarkService";
import { importBookmarks } from "../services/importService";
import { fetchMetadata } from "../services/metadataService";
import type {
  CreateBookmarkInput,
  ImportBookmarksInput,
  ListBookmarksQuery,
  UpdateBookmarkInput,
} from "../validators/schemas";

export const listHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const query = req.query as unknown as ListBookmarksQuery;
  const result = await listBookmarks(userId, query);
  res.json({ success: true, ...result });
});

export const getHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const bookmark = await getBookmark(userId, paramId(req));
  res.json({ success: true, data: bookmark });
});

export const createHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const input = req.body as CreateBookmarkInput;
  const bookmark = await createBookmark(userId, input);
  res.status(201).json({ success: true, data: bookmark });
});

export const updateHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const input = req.body as UpdateBookmarkInput;
  const bookmark = await updateBookmark(userId, paramId(req), input);
  res.json({ success: true, data: bookmark });
});

export const removeHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  await deleteBookmark(userId, paramId(req));
  res.json({ success: true, data: { id: paramId(req) } });
});

const flagHandler =
  (action: (userId: string, id: string) => Promise<unknown>, message: string) =>
  asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const bookmark = await action(userId, paramId(req));
    res.json({ success: true, data: bookmark, message });
  });

export const pinHandler = flagHandler(pinBookmark, "Đã ghim dấu trang");
export const unpinHandler = flagHandler(unpinBookmark, "Đã bỏ ghim dấu trang");
export const archiveHandler = flagHandler(archiveBookmark, "Đã lưu trữ dấu trang");
export const restoreHandler = flagHandler(restoreBookmark, "Đã khôi phục dấu trang");

export const visitHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const bookmark = await visitBookmark(userId, paramId(req));
  res.json({ success: true, data: bookmark });
});

export const statsHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const stats = await getStats(userId);
  res.json({ success: true, data: stats });
});

export const exportHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const bookmarks = await exportBookmarks(userId);
  res.json({ success: true, data: bookmarks });
});

export const importHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const input = req.body as ImportBookmarksInput;
  const result = await importBookmarks(userId, input);
  res.status(201).json({ success: true, data: result });
});

export const metadataHandler = asyncHandler(async (req: Request, res: Response) => {
  requireUserId(req);
  const { url } = req.body as { url: string };
  const metadata = await fetchMetadata(url);
  res.json({ success: true, data: metadata });
});
