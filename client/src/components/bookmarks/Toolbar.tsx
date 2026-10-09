import { Check, ChevronDown, LayoutGrid, List, SlidersHorizontal, Tags } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { TagBadge } from "../ui/tag-badge";
import { cn, TAG_COLORS } from "../../lib/utils";
import type { SortOption, Tag, TagMode } from "../../types";

export const SORT_LABELS: Record<SortOption, string> = {
  recent: "Mới nhất",
  oldest: "Cũ nhất",
  recentlyVisited: "Truy cập gần đây",
  mostVisited: "Xem nhiều nhất",
  titleAsc: "Tiêu đề A–Z",
  titleDesc: "Tiêu đề Z–A",
};

interface ToolbarProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  selectedTags: string[];
  tags: Tag[];
  tagMode: TagMode;
  onTagToggle: (tagId: string) => void;
  onTagModeChange: (mode: TagMode) => void;
  onClearTagFilter: () => void;
  layout: "grid" | "list";
  onLayoutChange: (layout: "grid" | "list") => void;
  total: number;
  loading: boolean;
}

export function Toolbar({
  sort,
  onSortChange,
  selectedTags,
  tags,
  tagMode,
  onTagToggle,
  onTagModeChange,
  onClearTagFilter,
  layout,
  onLayoutChange,
  total,
  loading,
}: ToolbarProps) {
  const selectedTagObjects = tags.filter((tag) => selectedTags.includes(tag.id));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {loading ? "Đang tải dấu trang…" : `${total} dấu trang`}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <SlidersHorizontal className="size-3.5" />
                {SORT_LABELS[sort]}
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                <DropdownMenuItem key={option} onSelect={() => onSortChange(option)}>
                  <span className="flex-1">{SORT_LABELS[option]}</span>
                  {sort === option && <Check className="size-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Tags className="size-3.5" />
                Thẻ
                {selectedTags.length > 0 && (
                  <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {selectedTags.length}
                  </span>
                )}
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Lọc theo thẻ
                </p>
                <div className="flex rounded-lg border border-border p-0.5 text-xs">
                  {(["any", "all"] as TagMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onTagModeChange(mode)}
                      className={cn(
                        "rounded-md px-2 py-1 font-medium transition",
                        tagMode === mode
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {mode === "any" ? "Khớp bất kỳ" : "Khớp tất cả"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="scrollbar-thin max-h-64 space-y-0.5 overflow-y-auto">
                {tags.length === 0 && (
                  <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                    Chưa có thẻ nào. Hãy tạo thẻ từ trang Thẻ.
                  </p>
                )}
                {tags.map((tag) => {
                  const active = selectedTags.includes(tag.id);
                  const color = TAG_COLORS.includes(tag.color) || /^#[0-9a-fA-F]{6}$/.test(tag.color) ? tag.color : "#6366f1";
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => onTagToggle(tag.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-muted"
                    >
                      <span
                        className="flex size-4 items-center justify-center rounded border text-[10px] font-bold text-white"
                        style={{
                          borderColor: color,
                          backgroundColor: active ? color : "transparent",
                        }}
                      >
                        {active && "✓"}
                      </span>
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      <span className="min-w-0 flex-1 truncate">{tag.name}</span>
                      <span className="text-xs text-muted-foreground">{tag.count ?? 0}</span>
                    </button>
                  );
                })}
              </div>

              {selectedTags.length > 0 && (
                <div className="mt-3 border-t border-border pt-2">
                  <Button variant="ghost" size="sm" className="w-full" onClick={onClearTagFilter}>
                    Xóa lọc thẻ
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <div className="flex rounded-lg border border-border bg-card p-0.5">
            <button
              type="button"
              onClick={() => onLayoutChange("grid")}
              className={cn(
                "rounded-md p-1.5 transition",
                layout === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Chế độ lưới"
              title="Chế độ lưới"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onLayoutChange("list")}
              className={cn(
                "rounded-md p-1.5 transition",
                layout === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Chế độ danh sách"
              title="Chế độ danh sách"
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {selectedTagObjects.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">
            {tagMode === "all" ? "Khớp tất cả:" : "Khớp bất kỳ:"}
          </span>
          {selectedTagObjects.map((tag) => (
            <TagBadge key={tag.id} tag={tag} onRemove={() => onTagToggle(tag.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
