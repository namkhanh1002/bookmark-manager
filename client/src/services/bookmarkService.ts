import { api } from "../lib/api";
import type {
  Bookmark,
  BookmarkPayload,
  BookmarkQuery,
  ListResponse,
  PageMetadata,
  Stats,
} from "../types";

function buildQuery(query: Partial<BookmarkQuery>): string {
  const params = new URLSearchParams();

  if (query.q) params.set("search", query.q);
  if (query.tags && query.tags.length > 0) params.set("tags", query.tags.join(","));
  if (query.tagMode) params.set("tagMode", query.tagMode);
  if (query.sort) params.set("sortBy", query.sort);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  if (query.view === "archived") params.set("archived", "true");
  if (query.view === "pinned") params.set("pinned", "true");

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function listBookmarks(
  query: Partial<BookmarkQuery>,
  signal?: AbortSignal,
): Promise<ListResponse> {
  const res = await api<Bookmark[]>(`/api/bookmarks${buildQuery(query)}`, { signal });
  return { data: res.data, meta: res.meta ?? { page: 1, limit: 12, total: 0, totalPages: 1 } };
}

export async function createBookmark(payload: BookmarkPayload): Promise<Bookmark> {
  const res = await api<Bookmark>("/api/bookmarks", { method: "POST", body: payload });
  return res.data;
}

export async function updateBookmark(id: string, payload: Partial<BookmarkPayload>): Promise<Bookmark> {
  const res = await api<Bookmark>(`/api/bookmarks/${id}`, { method: "PATCH", body: payload });
  return res.data;
}

export async function deleteBookmark(id: string): Promise<void> {
  await api(`/api/bookmarks/${id}`, { method: "DELETE" });
}

async function flagAction(id: string, action: string): Promise<Bookmark> {
  const res = await api<Bookmark>(`/api/bookmarks/${id}/${action}`, { method: "POST" });
  return res.data;
}

export const pinBookmark = (id: string) => flagAction(id, "pin");
export const unpinBookmark = (id: string) => flagAction(id, "unpin");
export const archiveBookmark = (id: string) => flagAction(id, "archive");
export const restoreBookmark = (id: string) => flagAction(id, "restore");
export const visitBookmark = (id: string) => flagAction(id, "visit");

export async function fetchPageMetadata(url: string, signal?: AbortSignal): Promise<PageMetadata> {
  const res = await api<PageMetadata>("/api/bookmarks/metadata", {
    method: "POST",
    body: { url },
    signal,
  });
  return res.data;
}

export async function fetchStats(signal?: AbortSignal): Promise<Stats> {
  const res = await api<Stats>("/api/bookmarks/stats", { signal });
  return res.data;
}

export async function exportBookmarks(): Promise<Bookmark[]> {
  const res = await api<Bookmark[]>("/api/bookmarks/export");
  return res.data;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
}

export async function importBookmarks(payload: {
  bookmarks: {
    title: string;
    url: string;
    description?: string;
    tags?: string[];
    isPinned?: boolean;
    isArchived?: boolean;
  }[];
}): Promise<ImportResult> {
  const res = await api<ImportResult>("/api/bookmarks/import", { method: "POST", body: payload });
  return res.data;
}
