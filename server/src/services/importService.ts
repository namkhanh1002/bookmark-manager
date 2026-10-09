import { createBookmark, archiveBookmark, type BookmarkDto } from "./bookmarkService";
import { findOrCreateTag } from "./tagService";
import type { ImportBookmarksInput } from "../validators/schemas";

export interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
}

export async function importBookmarks(
  userId: string,
  input: ImportBookmarksInput,
): Promise<ImportResult> {
  let imported = 0;
  let skipped = 0;

  for (const item of input.bookmarks) {
    try {
      const tagIds: string[] = [];
      for (const tagName of item.tags ?? []) {
        tagIds.push(await findOrCreateTag(userId, tagName));
      }

      const created: BookmarkDto = await createBookmark(userId, {
        title: item.title,
        url: item.url,
        description: item.description,
        tagIds,
        isPinned: item.isPinned,
      });

      if (item.isArchived) await archiveBookmark(userId, created.id);
      imported += 1;
    } catch {
      skipped += 1;
    }
  }

  return { imported, skipped, total: input.bookmarks.length };
}
