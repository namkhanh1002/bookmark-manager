import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError, badRequest, conflict, notFound } from "../lib/errors";
import { normalizedKey, normalizeUrl } from "../lib/url";
import type {
  CreateBookmarkInput,
  ListBookmarksQuery,
  UpdateBookmarkInput,
} from "../validators/schemas";

export interface TagDto {
  id: string;
  name: string;
  color: string;
}

export interface BookmarkDto {
  id: string;
  title: string;
  url: string;
  normalizedUrl: string;
  description: string | null;
  faviconUrl: string | null;
  viewCount: number;
  lastVisitedAt: string | null;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  tags: TagDto[];
}

type BookmarkWithTags = {
  id: string;
  title: string;
  url: string;
  normalizedUrl: string;
  description: string | null;
  faviconUrl: string | null;
  viewCount: number;
  lastVisitedAt: Date | null;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: { tag: TagDto }[];
};

const bookmarkWithTags = {
  tags: {
    select: {
      tag: { select: { id: true, name: true, color: true } },
    },
  },
} satisfies Prisma.BookmarkInclude;

export function toBookmarkDto(bookmark: BookmarkWithTags): BookmarkDto {
  return {
    id: bookmark.id,
    title: bookmark.title,
    url: bookmark.url,
    normalizedUrl: bookmark.normalizedUrl,
    description: bookmark.description,
    faviconUrl: bookmark.faviconUrl,
    viewCount: bookmark.viewCount,
    lastVisitedAt: bookmark.lastVisitedAt?.toISOString() ?? null,
    isPinned: bookmark.isPinned,
    isArchived: bookmark.isArchived,
    createdAt: bookmark.createdAt.toISOString(),
    updatedAt: bookmark.updatedAt.toISOString(),
    tags: bookmark.tags.map((entry) => entry.tag),
  };
}

export interface BookmarkListResult {
  data: BookmarkDto[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export async function listBookmarks(
  userId: string,
  query: ListBookmarksQuery,
): Promise<BookmarkListResult> {
  const tagIds = (query.tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10);

  const conditions: Prisma.BookmarkWhereInput[] = [];

  if (query.archived === "true") conditions.push({ isArchived: true });
  if (query.archived === "false") conditions.push({ isArchived: false });
  if (query.pinned === "true") conditions.push({ isPinned: true });

  const search = query.search?.trim();
  if (search) {
    conditions.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { url: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (tagIds.length > 0) {
    conditions.push(
      query.tagMode === "all"
        ? { AND: tagIds.map((tagId) => ({ tags: { some: { tagId } } })) }
        : { tags: { some: { tagId: { in: tagIds } } } },
    );
  }

  const where: Prisma.BookmarkWhereInput = {
    userId,
    AND: conditions,
  };

  const orderBy: Prisma.BookmarkOrderByWithRelationInput[] = [];
  const shouldPinFirst =
    query.pinFirst === "true" && query.pinned !== "true" && query.archived !== "true";
  if (shouldPinFirst) orderBy.push({ isPinned: "desc" });

  switch (query.sortBy) {
    case "oldest":
      orderBy.push({ createdAt: "asc" });
      break;
    case "recentlyVisited":
      orderBy.push({ lastVisitedAt: { sort: "desc", nulls: "last" } });
      break;
    case "mostVisited":
      orderBy.push({ viewCount: "desc" }, { createdAt: "desc" });
      break;
    case "titleAsc":
      orderBy.push({ title: "asc" });
      break;
    case "titleDesc":
      orderBy.push({ title: "desc" });
      break;
    default:
      orderBy.push({ createdAt: "desc" });
  }

  const skip = (query.page - 1) * query.limit;

  const [total, items] = await Promise.all([
    prisma.bookmark.count({ where }),
    prisma.bookmark.findMany({
      where,
      orderBy,
      skip,
      take: query.limit,
      include: bookmarkWithTags,
    }),
  ]);

  return {
    data: items.map(toBookmarkDto),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getBookmark(userId: string, id: string): Promise<BookmarkDto> {
  const bookmark = await prisma.bookmark.findFirst({
    where: { id, userId },
    include: bookmarkWithTags,
  });
  if (!bookmark) throw notFound("Không tìm thấy dấu trang");
  return toBookmarkDto(bookmark);
}

async function assertTagsOwned(userId: string, tagIds: string[]): Promise<string[]> {
  const unique = [...new Set(tagIds)];
  if (unique.length === 0) return [];

  const owned = await prisma.tag.count({ where: { id: { in: unique }, userId } });
  if (owned !== unique.length) throw badRequest("Một số thẻ không tồn tại");
  return unique;
}

export async function createBookmark(
  userId: string,
  input: CreateBookmarkInput,
): Promise<BookmarkDto> {
  const url = normalizeUrl(input.url);
  const normalizedUrl = normalizedKey(input.url);
  const tagIds = await assertTagsOwned(userId, input.tagIds ?? []);

  try {
    const created = await prisma.bookmark.create({
      data: {
        userId,
        title: input.title,
        url,
        normalizedUrl,
        description: input.description || null,
        faviconUrl: input.faviconUrl || null,
        isPinned: input.isPinned ?? false,
        tags: {
          create: tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
        },
      },
      include: bookmarkWithTags,
    });
    return toBookmarkDto(created);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err && typeof err === "object" && (err as { code?: string }).code === "P2002") {
      throw conflict("Bạn đã lưu URL này rồi");
    }
    throw err;
  }
}

export async function updateBookmark(
  userId: string,
  id: string,
  input: UpdateBookmarkInput,
): Promise<BookmarkDto> {
  const existing = await prisma.bookmark.findFirst({ where: { id, userId } });
  if (!existing) throw notFound("Không tìm thấy dấu trang");

  const data: Prisma.BookmarkUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description || null;
  if (input.faviconUrl !== undefined) data.faviconUrl = input.faviconUrl || null;
  if (input.isPinned !== undefined) data.isPinned = input.isPinned;
  if (input.isArchived !== undefined) data.isArchived = input.isArchived;

  if (input.url !== undefined) {
    const url = normalizeUrl(input.url);
    const normalizedUrl = normalizedKey(input.url);
    if (normalizedUrl !== existing.normalizedUrl) {
      const duplicate = await prisma.bookmark.findFirst({
        where: { userId, normalizedUrl, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) throw conflict("Bạn đã lưu URL này rồi");
    }
    data.url = url;
    data.normalizedUrl = normalizedUrl;
  }

  if (input.tagIds !== undefined) {
    const tagIds = await assertTagsOwned(userId, input.tagIds);
    data.tags = {
      deleteMany: {},
      create: tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
    };
  }

  try {
    const updated = await prisma.bookmark.update({
      where: { id },
      data,
      include: bookmarkWithTags,
    });
    return toBookmarkDto(updated);
  } catch (err) {
    if (err && typeof err === "object" && (err as { code?: string }).code === "P2002") {
      throw conflict("Bạn đã lưu URL này rồi");
    }
    throw err;
  }
}

export async function deleteBookmark(userId: string, id: string): Promise<void> {
  const existing = await prisma.bookmark.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) throw notFound("Không tìm thấy dấu trang");
  await prisma.bookmark.delete({ where: { id } });
}

async function setFlag(
  userId: string,
  id: string,
  flag: "isPinned" | "isArchived",
  value: boolean,
): Promise<BookmarkDto> {
  const existing = await prisma.bookmark.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) throw notFound("Không tìm thấy dấu trang");

  const updated = await prisma.bookmark.update({
    where: { id },
    data: { [flag]: value },
    include: bookmarkWithTags,
  });
  return toBookmarkDto(updated);
}

export const pinBookmark = (userId: string, id: string) => setFlag(userId, id, "isPinned", true);
export const unpinBookmark = (userId: string, id: string) => setFlag(userId, id, "isPinned", false);
export const archiveBookmark = (userId: string, id: string) =>
  setFlag(userId, id, "isArchived", true);
export const restoreBookmark = (userId: string, id: string) =>
  setFlag(userId, id, "isArchived", false);

export async function visitBookmark(userId: string, id: string): Promise<BookmarkDto> {
  const existing = await prisma.bookmark.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) throw notFound("Không tìm thấy dấu trang");

  const updated = await prisma.bookmark.update({
    where: { id },
    data: { viewCount: { increment: 1 }, lastVisitedAt: new Date() },
    include: bookmarkWithTags,
  });
  return toBookmarkDto(updated);
}

export interface BookmarkStats {
  all: number;
  pinned: number;
  archived: number;
}

export async function getStats(userId: string): Promise<BookmarkStats> {
  const [all, pinned, archived] = await Promise.all([
    prisma.bookmark.count({ where: { userId, isArchived: false } }),
    prisma.bookmark.count({ where: { userId, isArchived: false, isPinned: true } }),
    prisma.bookmark.count({ where: { userId, isArchived: true } }),
  ]);
  return { all, pinned, archived };
}

export async function exportBookmarks(userId: string): Promise<BookmarkDto[]> {
  const items = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: bookmarkWithTags,
  });
  return items.map(toBookmarkDto);
}
