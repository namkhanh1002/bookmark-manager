import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "../ui/button";
import { cn } from "../../lib/utils";
import type { PageMeta } from "../../types";

interface PaginationProps {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  const result: (number | "gap")[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) result.push("gap");
    result.push(page);
    previous = page;
  }
  return result;
}

export function Pagination({ meta, onPageChange, disabled = false }: PaginationProps) {
  if (meta.total <= meta.limit && meta.page === 1) return null;

  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        Hiển thị {start}–{end} trong tổng số {meta.total}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={disabled || meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
          className={cn(buttonVariants({ variant: "outline", size: "iconSm" }), "disabled:opacity-40")}
          aria-label="Trang trước"
        >
          <ChevronLeft />
        </button>

        {pageWindow(meta.page, meta.totalPages).map((entry, index) =>
          entry === "gap" ? (
            <span key={`gap-${index}`} className="px-1.5 text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              disabled={disabled}
              onClick={() => onPageChange(entry)}
              aria-current={entry === meta.page ? "page" : undefined}
              className={cn(
                buttonVariants({ variant: entry === meta.page ? "default" : "ghost", size: "iconSm" }),
              )}
            >
              {entry}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={disabled || meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
          className={cn(buttonVariants({ variant: "outline", size: "iconSm" }), "disabled:opacity-40")}
          aria-label="Trang sau"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
