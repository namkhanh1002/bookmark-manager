import { z } from "zod";

const colorPattern = /^#[0-9a-fA-F]{6}$/;

export const createBookmarkSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(300),
  url: z.string().trim().min(1, "URL is required").max(2048),
  description: z.string().trim().max(2000).optional(),
  faviconUrl: z.string().trim().max(2048).nullable().optional(),
  tagIds: z.array(z.string().min(1)).max(30).optional(),
  isPinned: z.boolean().optional(),
});

export const updateBookmarkSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(300).optional(),
    url: z.string().trim().min(1, "URL is required").max(2048).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    faviconUrl: z.string().trim().max(2048).nullable().optional(),
    tagIds: z.array(z.string().min(1)).max(30).optional(),
    isPinned: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

export const listBookmarksQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  tags: z.string().max(500).optional(),
  tagMode: z.enum(["any", "all"]).default("any"),
  archived: z.enum(["true", "false", "all"]).default("false"),
  pinned: z.enum(["true", "false"]).optional(),
  sortBy: z
    .enum(["recent", "oldest", "recentlyVisited", "mostVisited", "titleAsc", "titleDesc"])
    .default("recent"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  pinFirst: z.enum(["true", "false"]).default("true"),
});

export const idParamSchema = z.object({ id: z.string().min(1).max(64) });

export const metadataSchema = z.object({
  url: z.string().trim().min(1, "URL is required").max(2048),
});

export const createTagSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required").max(40),
  color: z.string().regex(colorPattern, "Color must be a hex value like #6366f1").default("#6366f1"),
});

export const updateTagSchema = z
  .object({
    name: z.string().trim().min(1, "Tag name is required").max(40).optional(),
    color: z.string().regex(colorPattern, "Color must be a hex value like #6366f1").optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), { message: "Enter a valid email address" });

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  name: z.string().trim().min(1).max(80).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(128),
});

export const importBookmarksSchema = z.object({
  bookmarks: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(300),
        url: z.string().trim().min(1).max(2048),
        description: z.string().trim().max(2000).optional(),
        tags: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
        isPinned: z.boolean().optional(),
        isArchived: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(500),
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
export type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>;
export type ListBookmarksQuery = z.infer<typeof listBookmarksQuerySchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ImportBookmarksInput = z.infer<typeof importBookmarksSchema>;
