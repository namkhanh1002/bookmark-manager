import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Copy,
  ExternalLink,
  Eye,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { TagBadge } from "../ui/tag-badge";
import { Favicon } from "./Favicon";
import { useToast } from "../../context/ToastContext";
import { emitDataChange } from "../../hooks/useDataChange";
import { ApiError } from "../../lib/api";
import { copyToClipboard } from "../../lib/clipboard";
import { cn, formatCount, formatDate, formatRelativeTime, getDomain } from "../../lib/utils";
import {
  archiveBookmark,
  deleteBookmark,
  pinBookmark,
  restoreBookmark,
  unpinBookmark,
  visitBookmark,
} from "../../services/bookmarkService";
import type { Bookmark } from "../../types";

interface BookmarkCardProps {
  bookmark: Bookmark;
  layout: "grid" | "list";
  onEdit: (bookmark: Bookmark) => void;
  onTagSelect?: (tagId: string) => void;
}

export function BookmarkCard({ bookmark, layout, onEdit, onTagSelect }: BookmarkCardProps) {
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const errorMessage = (err: unknown) =>
    err instanceof ApiError ? err.message : "Không thể thực hiện thao tác.";

  const openLink = () => {
    window.open(bookmark.url, "_blank", "noopener,noreferrer");
    visitBookmark(bookmark.id)
      .then(() => emitDataChange())
      .catch(() => undefined);
  };

  const copyLink = async () => {
    try {
      await copyToClipboard(bookmark.url);
      toast({ title: "Đã sao chép URL", description: bookmark.url, variant: "success" });
    } catch {
      toast({ title: "Không thể sao chép URL", description: "Quyền truy cập bộ nhớ tạm đã bị từ chối.", variant: "error" });
    }
  };

  const runFlagAction = async (
    action: () => Promise<Bookmark>,
    successTitle: string,
    successDescription?: string,
  ) => {
    try {
      await action();
      emitDataChange();
      toast({ title: successTitle, description: successDescription, variant: "success" });
    } catch (err) {
      toast({ title: "Thao tác thất bại", description: errorMessage(err), variant: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBookmark(bookmark.id);
      emitDataChange();
      toast({ title: "Đã xóa dấu trang", description: bookmark.title, variant: "success" });
    } catch (err) {
      toast({ title: "Không thể xóa dấu trang", description: errorMessage(err), variant: "error" });
    }
  };

  const domain = getDomain(bookmark.url);
  const visibleTags = bookmark.tags.slice(0, 3);
  const hiddenTagCount = bookmark.tags.length - visibleTags.length;

  const actions = (
    <>
      <Button size="iconSm" variant="ghost" onClick={openLink} aria-label="Mở liên kết trong tab mới" title="Mở">
        <ExternalLink />
      </Button>
      <Button size="iconSm" variant="ghost" onClick={() => void copyLink()} aria-label="Sao chép URL" title="Sao chép URL">
        <Copy />
      </Button>
      <Button
        size="iconSm"
        variant="ghost"
        onClick={() =>
          void runFlagAction(
            () => (bookmark.isPinned ? unpinBookmark(bookmark.id) : pinBookmark(bookmark.id)),
            bookmark.isPinned ? "Đã bỏ ghim dấu trang" : "Đã ghim dấu trang",
            bookmark.title,
          )
        }
        aria-label={bookmark.isPinned ? "Bỏ ghim dấu trang" : "Ghim dấu trang"}
        title={bookmark.isPinned ? "Bỏ ghim" : "Ghim"}
        className={cn(bookmark.isPinned && "text-primary")}
      >
        {bookmark.isPinned ? <PinOff /> : <Pin />}
      </Button>
      <Button size="iconSm" variant="ghost" onClick={() => onEdit(bookmark)} aria-label="Sửa dấu trang" title="Sửa">
        <Pencil />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="iconSm" variant="ghost" aria-label="Thao tác khác" title="Thao tác khác">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={openLink}>
            <ExternalLink /> Mở trong tab mới
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void copyLink()}>
            <Copy /> Sao chép URL
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              void runFlagAction(
                () =>
                  bookmark.isArchived ? restoreBookmark(bookmark.id) : archiveBookmark(bookmark.id),
                bookmark.isArchived ? "Đã khôi phục dấu trang" : "Đã lưu trữ dấu trang",
                bookmark.title,
              )
            }
          >
            {bookmark.isArchived ? <ArchiveRestore /> : <Archive />}
            {bookmark.isArchived ? "Khôi phục" : "Lưu trữ"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setConfirmDelete(true)}
            className="text-destructive focus:text-destructive [&_svg]:text-destructive"
          >
            <Trash2 /> Xóa vĩnh viễn
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  const meta = (
    <>
      <span className="flex items-center gap-1" title={`${bookmark.viewCount} lượt truy cập`}>
        <Eye className="size-3" />
        {formatCount(bookmark.viewCount)}
      </span>
      <span className="flex items-center gap-1" title={`Lần truy cập cuối: ${formatDate(bookmark.lastVisitedAt)}`}>
        {formatRelativeTime(bookmark.lastVisitedAt ?? bookmark.createdAt)}
      </span>
    </>
  );

  const badges = (
    <>
      {bookmark.isPinned && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
          <Pin className="size-3 fill-current" /> Đã ghim
        </span>
      )}
      {bookmark.isArchived && (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          <Archive className="size-3" /> Đã lưu trữ
        </span>
      )}
    </>
  );

  const tagList = visibleTags.length > 0 && (
    <div className="flex flex-wrap items-center gap-1.5">
      {visibleTags.map((tag) => (
        <TagBadge
          key={tag.id}
          tag={tag}
          role={onTagSelect ? "button" : undefined}
          tabIndex={onTagSelect ? 0 : undefined}
          onClick={onTagSelect ? () => onTagSelect(tag.id) : undefined}
          onKeyDown={
            onTagSelect
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onTagSelect(tag.id);
                  }
                }
              : undefined
          }
          className={cn(onTagSelect && "cursor-pointer hover:opacity-80")}
        />
      ))}
      {hiddenTagCount > 0 && (
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          +{hiddenTagCount}
        </span>
      )}
    </div>
  );

  return (
    <>
      {layout === "grid" ? (
        <article className="group relative flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
          <div className="flex items-start gap-3">
            <button type="button" onClick={openLink} aria-label={`Mở ${bookmark.title}`} className="shrink-0">
              <Favicon url={bookmark.faviconUrl} title={bookmark.title} className="size-10 text-base" />
            </button>
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={openLink}
                className="flex w-full items-center gap-1.5 text-left"
                title={bookmark.url}
              >
                <h3 className="truncate text-sm font-semibold leading-snug text-foreground transition group-hover:text-primary">
                  {bookmark.title}
                </h3>
              </button>
              <p className="truncate text-xs text-muted-foreground">{domain}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1">{badges}</div>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
              {actions}
            </div>
          </div>

          <p className="line-clamp-2 min-h-[2rem] text-xs leading-relaxed text-muted-foreground">
            {bookmark.description || "Không có mô tả."}
          </p>

          <div className="mt-auto space-y-3">
            {tagList}
            <div className="flex items-center justify-between border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-3">{meta}</div>
              <span>Đã thêm {formatDate(bookmark.createdAt)}</span>
            </div>
          </div>
        </article>
      ) : (
        <article className="group flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-all duration-150 hover:border-primary/30 hover:shadow-sm sm:flex-row sm:items-center sm:gap-4">
          <button type="button" onClick={openLink} aria-label={`Mở ${bookmark.title}`} className="shrink-0 self-start sm:self-auto">
            <Favicon url={bookmark.faviconUrl} title={bookmark.title} className="size-9 text-sm" />
          </button>

          <div className="min-w-0 flex-1">
            <button type="button" onClick={openLink} className="flex w-full items-center gap-1.5 text-left" title={bookmark.url}>
              <h3 className="truncate text-sm font-semibold text-foreground transition group-hover:text-primary">
                {bookmark.title}
              </h3>
            </button>
            <p className="truncate text-xs text-muted-foreground">
              {domain} · {bookmark.url.replace(/^https?:\/\//, "").slice(0, 80)}
            </p>
            {bookmark.description && (
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{bookmark.description}</p>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-1">{badges}</div>
          </div>

          <div className="hidden shrink-0 xl:block">{tagList}</div>

          <div className="hidden shrink-0 items-center gap-3 text-[11px] text-muted-foreground md:flex">{meta}</div>

          <div className="flex shrink-0 items-center gap-0.5">{actions}</div>
        </article>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Xóa dấu trang này?"
        description={`"${bookmark.title}" sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
