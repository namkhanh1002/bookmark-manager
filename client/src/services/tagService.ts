import { api } from "../lib/api";
import type { Tag } from "../types";

export async function listTags(signal?: AbortSignal): Promise<Tag[]> {
  const res = await api<Tag[]>("/api/tags", { signal });
  return res.data;
}

export async function createTag(payload: { name: string; color?: string }): Promise<Tag> {
  const res = await api<Tag>("/api/tags", { method: "POST", body: payload });
  return res.data;
}

export async function updateTag(id: string, payload: { name?: string; color?: string }): Promise<Tag> {
  const res = await api<Tag>(`/api/tags/${id}`, { method: "PATCH", body: payload });
  return res.data;
}

export async function deleteTag(id: string): Promise<void> {
  await api(`/api/tags/${id}`, { method: "DELETE" });
}
