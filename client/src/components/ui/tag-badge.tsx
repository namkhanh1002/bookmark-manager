import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import type { Tag } from "../../types";

interface TagBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tag: Pick<Tag, "name" | "color">;
  onRemove?: () => void;
}

export function TagBadge({ tag, onRemove, className, ...props }: TagBadgeProps) {
  const color = /^#[0-9a-fA-F]{6}$/.test(tag.color) ? tag.color : "#6366f1";

  return (
    <span
      className={cn(
        "inline-flex max-w-[9rem] items-center gap-1.5 truncate rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5 transition-colors",
        className,
      )}
      style={{
        backgroundColor: `${color}1a`,
        borderColor: `${color}4d`,
        color,
      }}
      {...props}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="truncate">{tag.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRemove();
          }}
          className="-mr-1 rounded-full px-1 hover:bg-black/10 dark:hover:bg-white/10"
          aria-label={`Xóa thẻ ${tag.name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
