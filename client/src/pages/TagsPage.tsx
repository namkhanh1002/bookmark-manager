import { useState } from "react";
import type { FormEvent } from "react";
import { Check, Palette, Pencil, Plus, Tags as TagsIcon, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { EmptyState } from "../components/ui/empty-state";
import { FieldError, Input, Label } from "../components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Skeleton, Spinner } from "../components/ui/skeleton";
import { useToast } from "../context/ToastContext";
import { useTags } from "../hooks/useTags";
import { emitDataChange } from "../hooks/useDataChange";
import { ApiError } from "../lib/api";
import { cn, formatDate, TAG_COLORS } from "../lib/utils";
import { createTag, deleteTag, updateTag } from "../services/tagService";
import type { Tag } from "../types";

export function TagsPage() {
  const { tags, loading, error, refresh } = useTags();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState<Tag | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (tag: Tag) => {
    setEditing(tag);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteTag(deleting.id);
      emitDataChange();
      refresh();
      toast({ title: "Đã xóa thẻ", description: `Đã xóa "${deleting.name}" khỏi các dấu trang của bạn.`, variant: "success" });
    } catch (err) {
      toast({
        title: "Không thể xóa thẻ",
        description: err instanceof ApiError ? err.message : "Vui lòng thử lại.",
        variant: "error",
      });
    }
  };

  const handleColorChange = async (tag: Tag, color: string) => {
    try {
      await updateTag(tag.id, { color });
      emitDataChange();
      refresh();
    } catch (err) {
      toast({
        title: "Không thể cập nhật màu",
        description: err instanceof ApiError ? err.message : "Vui lòng thử lại.",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Thẻ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Nhóm các dấu trang liên quan với nhau. Xóa thẻ không bao giờ xóa các dấu trang.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          Thẻ mới
        </Button>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<TagsIcon className="size-6" />}
          title="Không thể tải thẻ"
          description={error}
          action={{ label: "Thử lại", onClick: refresh }}
        />
      ) : tags.length === 0 ? (
        <EmptyState
          icon={<TagsIcon className="size-6" />}
          title="Chưa có thẻ nào"
          description="Tạo thẻ đầu tiên để bắt đầu nhóm dấu trang theo chủ đề, dự án hoặc mức độ ưu tiên."
          action={{ label: "Tạo thẻ", onClick: openCreate }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <article
              key={tag.id}
              className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
                    <h2 className="truncate text-base font-semibold text-foreground">{tag.name}</h2>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(tag.count ?? 0) === 1 ? "1 dấu trang" : `${tag.count ?? 0} dấu trang`} · tạo ngày{" "}
                    {formatDate(tag.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  <Button size="iconSm" variant="ghost" onClick={() => openEdit(tag)} aria-label="Đổi tên thẻ">
                    <Pencil />
                  </Button>
                  <Button
                    size="iconSm"
                    variant="ghost"
                    onClick={() => setDeleting(tag)}
                    aria-label="Xóa thẻ"
                    className="hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      <Palette className="size-3.5" /> Màu
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-56">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Màu thẻ
                    </p>
                    <div className="grid grid-cols-6 gap-2">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => void handleColorChange(tag, color)}
                          className={cn(
                            "flex size-7 items-center justify-center rounded-full transition hover:scale-110",
                            tag.color.toLowerCase() === color.toLowerCase() && "ring-2 ring-ring ring-offset-2 ring-offset-popover",
                          )}
                          style={{ backgroundColor: color }}
                          aria-label={`Đặt màu ${color}`}
                        >
                          {tag.color.toLowerCase() === color.toLowerCase() && (
                            <Check className="size-3.5 text-white" strokeWidth={3} />
                          )}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <span
                  className="rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ backgroundColor: `${tag.color}1a`, color: tag.color }}
                >
                  Xem trước
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <TagFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        tag={editing}
        onSaved={() => {
          emitDataChange();
          refresh();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Xóa thẻ này?"
        description={`"${deleting?.name}" sẽ bị xóa khỏi mọi dấu trang đang sử dụng nó. Các dấu trang vẫn được giữ nguyên.`}
        confirmLabel="Xóa thẻ"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

function TagFormDialog({
  open,
  onOpenChange,
  tag,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: Tag | null;
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <DialogContent className="max-w-md">
          <TagFormBody
            key={tag?.id ?? "new"}
            tag={tag}
            onCancel={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}

function TagFormBody({
  tag,
  onCancel,
  onSaved,
}: {
  tag: Tag | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(tag?.name ?? "");
  const [color, setColor] = useState(tag?.color ?? TAG_COLORS[0]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Tên thẻ là bắt buộc");
      return;
    }
    setBusy(true);
    try {
      if (tag) await updateTag(tag.id, { name: name.trim(), color });
      else await createTag({ name: name.trim(), color });
      toast({ title: tag ? "Đã cập nhật thẻ" : "Đã tạo thẻ", description: name.trim(), variant: "success" });
      onSaved();
      onCancel();
    } catch (err) {
      toast({
        title: tag ? "Không thể cập nhật thẻ" : "Không thể tạo thẻ",
        description: err instanceof ApiError ? err.message : "Vui lòng thử lại.",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{tag ? "Sửa thẻ" : "Thẻ mới"}</DialogTitle>
        <DialogDescription>
          Các thẻ được dùng chung giữa các dấu trang và có thể đổi tên hoặc đổi màu bất cứ lúc nào.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="tag-name">Tên</Label>
          <Input
            id="tag-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(undefined);
            }}
            placeholder="VD: Cảm hứng thiết kế"
            maxLength={40}
            autoFocus
          />
          <FieldError message={error} />
        </div>

        <div className="space-y-1.5">
          <Label>Màu</Label>
          <div className="flex flex-wrap gap-2">
            {TAG_COLORS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setColor(option)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full transition hover:scale-110",
                  color.toLowerCase() === option.toLowerCase() &&
                    "ring-2 ring-ring ring-offset-2 ring-offset-card",
                )}
                style={{ backgroundColor: option }}
                aria-label={`Màu ${option}`}
              >
                {color.toLowerCase() === option.toLowerCase() && (
                  <Check className="size-4 text-white" strokeWidth={3} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          Hủy
        </Button>
        <Button type="submit" disabled={busy}>
          {busy && <Spinner className="size-3.5" />}
          {tag ? "Lưu thay đổi" : "Tạo thẻ"}
        </Button>
      </DialogFooter>
    </form>
  );
}
