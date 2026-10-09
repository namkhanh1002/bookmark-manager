export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt?: string;
  count?: number;
}

export interface Bookmark {
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
  tags: Tag[];
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListResponse {
  data: Bookmark[];
  meta: PageMeta;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface Stats {
  all: number;
  pinned: number;
  archived: number;
}

export interface PageMetadata {
  url: string;
  title: string | null;
  description: string | null;
  faviconUrl: string | null;
  source: "remote" | "fallback";
}

export type SortOption =
  | "recent"
  | "oldest"
  | "recentlyVisited"
  | "mostVisited"
  | "titleAsc"
  | "titleDesc";

export type ViewKey = "all" | "pinned" | "archived";

export type TagMode = "any" | "all";

export interface BookmarkQuery {
  view: ViewKey;
  q: string;
  tags: string[];
  tagMode: TagMode;
  sort: SortOption;
  page: number;
  limit: number;
}

export interface BookmarkPayload {
  title: string;
  url: string;
  description?: string;
  faviconUrl?: string | null;
  tagIds?: string[];
  isPinned?: boolean;
  isArchived?: boolean;
}
