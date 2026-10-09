import { prisma } from "../lib/prisma";
import { conflict, notFound } from "../lib/errors";
import type { CreateTagInput, UpdateTagInput } from "../validators/schemas";

export interface TagWithCount {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  count: number;
}

export async function listTags(userId: string): Promise<TagWithCount[]> {
  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { _count: { select: { bookmarks: true } } },
  });

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    createdAt: tag.createdAt.toISOString(),
    count: tag._count.bookmarks,
  }));
}

export async function createTag(userId: string, input: CreateTagInput): Promise<TagWithCount> {
  const existing = await prisma.tag.findFirst({
    where: { userId, name: { equals: input.name, mode: "insensitive" } },
  });
  if (existing) throw conflict(`Thẻ "${input.name}" đã tồn tại`);

  try {
    const tag = await prisma.tag.create({
      data: { userId, name: input.name, color: input.color },
      include: { _count: { select: { bookmarks: true } } },
    });
    return {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt.toISOString(),
      count: tag._count.bookmarks,
    };
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw conflict(`Thẻ "${input.name}" đã tồn tại`);
    }
    throw err;
  }
}

export async function updateTag(
  userId: string,
  id: string,
  input: UpdateTagInput,
): Promise<TagWithCount> {
  const existing = await prisma.tag.findFirst({ where: { id, userId } });
  if (!existing) throw notFound("Không tìm thấy thẻ");

  if (input.name !== undefined && input.name !== existing.name) {
    const duplicate = await prisma.tag.findFirst({
      where: { userId, name: { equals: input.name, mode: "insensitive" }, NOT: { id } },
    });
    if (duplicate) throw conflict(`Thẻ "${input.name}" đã tồn tại`);
  }

  try {
    const tag = await prisma.tag.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
      },
      include: { _count: { select: { bookmarks: true } } },
    });
    return {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt.toISOString(),
      count: tag._count.bookmarks,
    };
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw conflict("Thẻ với tên này đã tồn tại");
    }
    throw err;
  }
}

export async function deleteTag(userId: string, id: string): Promise<void> {
  const existing = await prisma.tag.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) throw notFound("Không tìm thấy thẻ");
  await prisma.tag.delete({ where: { id } });
}

export async function findOrCreateTag(userId: string, name: string): Promise<string> {
  const trimmed = name.trim().slice(0, 40);
  if (!trimmed) throw new Error("Tên thẻ là bắt buộc");

  const existing = await prisma.tag.findFirst({
    where: { userId, name: { equals: trimmed, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.tag.create({
    data: { userId, name: trimmed, color: pickColor(trimmed) },
    select: { id: true },
  });
  return created.id;
}

const PALETTE = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
];

function pickColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
