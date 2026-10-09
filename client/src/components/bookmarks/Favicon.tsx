import { useState } from "react";
import { cn } from "../../lib/utils";

interface FaviconProps {
  url?: string | null;
  title: string;
  className?: string;
}

export function Favicon({ url, title, className }: FaviconProps) {
  const [failed, setFailed] = useState(false);
  const letter = title.trim().charAt(0).toUpperCase() || "L";

  if (!url || failed) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground",
          className,
        )}
        aria-hidden
      >
        {letter}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn(
        "shrink-0 rounded-lg border border-border bg-white object-contain p-1",
        className,
      )}
    />
  );
}
