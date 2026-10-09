import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BookmarkPlus, FolderOpen, Inbox, RotateCcw, SearchX } from "lucide-react";
import { BookmarkCard } from "../components/bookmarks/BookmarkCard";
import { BookmarkFormDialog } from "../components/bookmarks/BookmarkFormDialog";
import { Pagination } from "../components/bookmarks/Pagination";
import { Toolbar } from "../components/bookmarks/Toolbar";
import { EmptyState } from "../components/ui/empty-state";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { useBookmarks } from "../hooks/useBookmarks";
import { useTags } from "../hooks/useTags";
import { useAddBookmark } from "../components/layout/AppShell";
import type { Bookmark, BookmarkQuery, SortOption, TagMode, ViewKey } from "../types";

const VIEW_COPY: Record<ViewKey, { title: string; subtitle: string }> = {
  all: { title: "Tất cả dấu trang", subtitle: "Mọi thứ bạn đã lưu ở một nơi." },
  pinned: { title: "Đã ghim", subtitle: "Những liên kết bạn sử dụng nhiều nhất." },
  archived: { title: "Đã lưu trữ", subtitle: "Đã cất giữ — khôi phục bất kỳ lúc nào." },
};

export function BookmarksPage() {
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const { tags } = useTags();
  const { openAddDialog } = useAddBookmark();

  const query: BookmarkQuery = useMemo(() => {
    const viewParam = params.get("view");
    const view: ViewKey = viewParam === "pinned" || viewParam === "archived" ? viewParam : "all";
    const sortParam = params.get("sort");
    const validSorts: SortOption[] = ["recent", "oldest", "recentlyVisited", "mostVisited", "titleAsc", "titleDesc"];

    return {
      view,
      q: params.get("q") ?? "",
      tags: (params.get("tags") ?? "").split(",").filter(Boolean),
      tagMode: params.get("tagMode") === "all" ? "all" : "any",
      sort: validSorts.includes(sortParam as SortOption) ? (sortParam as SortOption) : "recent",
      page: Math.max(1, Number(params.get("page") ?? 1) || 1),
      limit: 12,
    };
  }, [params]);

  const layout: "grid" | "list" = params.get("layout") === "list" ? "list" : "grid";
  const { items, meta, loading, error, refresh } = useBookmarks(query);

  const updateParams = (patch: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    if (resetPage) next.delete("page");
    setParams(next);
  };

  const toggleTag = (tagId: string) => {
    const selected = query.tags.includes(tagId)
      ? query.tags.filter((value) => value !== tagId)
      : [...query.tags, tagId];
    updateParams({ tags: selected.join(",") || null });
  };

  const hasFilters = query.q.length > 0 || query.tags.length > 0;

  const clearFilters = () => {
    const next = new URLSearchParams();
    const view = params.get("view");
    const sort = params.get("sort");
    const currentLayout = params.get("layout");
    if (view) next.set("view", view);
    if (sort) next.set("sort", sort);
    if (currentLayout) next.set("layout", currentLayout);
    setParams(next);
  };

  const copy = VIEW_COPY[query.view];

  if (loading && items.length === 0) {
    return <LoadingState layout={layout} />;
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{copy.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>
        <Button onClick={openAddDialog} className="shadow-sm">
          <BookmarkPlus />
          Thêm dấu trang
        </Button>
      </header>

      <Toolbar
        sort={query.sort}
        onSortChange={(sort) => updateParams({ sort: sort === "recent" ? null : sort })}
        selectedTags={query.tags}
        tags={tags}
        tagMode={query.tagMode}
        onTagToggle={toggleTag}
        onTagModeChange={(mode: TagMode) => updateParams({ tagMode: mode === "any" ? null : mode })}
        onClearTagFilter={() => updateParams({ tags: null })}
        layout={layout}
        onLayoutChange={(next) => updateParams({ layout: next === "grid" ? null : next }, false)}
        total={meta.total}
        loading={loading}
      />

      {error ? (
        <EmptyState
          icon={<Inbox className="size-6" />}
          title="Không thể tải dấu trang của bạn"
          description={error}
          action={{ label: "Thử lại", onClick: refresh }}
        />
      ) : items.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={<SearchX className="size-6" />}
            title="Không có dấu trang nào khớp với bộ lọc"
            description="Hãy thử từ khóa khác, hoặc xóa bộ lọc thẻ đang áp dụng."
            action={{ label: "Xóa bộ lọc", onClick: clearFilters }}
          />
        ) : (
          <EmptyState
            icon={<FolderOpen className="size-6" />}
            title={query.view === "archived" ? "Chưa có gì được lưu trữ" : "Thư viện của bạn đang trống"}
            description={
              query.view === "archived"
                ? "Những dấu trang bạn lưu trữ sẽ hiển thị tại đây, được giữ an toàn cùng các thẻ."
                : "Lưu liên kết đầu tiên và bắt đầu xây dựng kho kiến thức của riêng bạn."
            }
            action={
              query.view === "archived"
                ? { label: "Quay lại tất cả dấu trang", onClick: clearFilters }
                : { label: "Thêm dấu trang đầu tiên", onClick: openAddDialog }
            }
          />
        )
      ) : (
        <>
          <div
            className={
              layout === "grid"
                ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                : "flex flex-col gap-2.5"
            }
          >
            {items.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                layout={layout}
                onEdit={setEditing}
                onTagSelect={toggleTag}
              />
            ))}
          </div>

          <Pagination
            meta={meta}
            disabled={loading}
            onPageChange={(page) => {
              updateParams({ page: page > 1 ? String(page) : null }, false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      )}

      <BookmarkFormDialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)} bookmark={editing} />
    </div>
  );
}

function LoadingState({ layout }: { layout: "grid" | "list" }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className={layout === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-2.5"}>
        {Array.from({ length: 6 }).map((_, index) =>
          layout === "grid" ? (
            <div key={index} className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex gap-3">
                <Skeleton className="size-10" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-9 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-14" />
              </div>
            </div>
          ) : (
            <div key={index} className="flex items-center gap-4 rounded-xl border border-border bg-card p-3">
              <Skeleton className="size-9" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ),
        )}
      </div>
      <div className="flex justify-center gap-2">
        <RotateCcw className="size-4 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
