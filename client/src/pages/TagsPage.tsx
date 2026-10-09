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
      toast({ title: "Tag deleted", description: `"${deleting.name}" was removed from your bookmarks.`, variant: "success" });
    } catch (err) {
      toast({
        title: "Could not delete tag",
        description: err instanceof ApiError ? err.message : "Please try again.",
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
        title: "Could not update color",
        description: err instanceof ApiError ? err.message : "Please try again.",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Tags</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Group related bookmarks. Deleting a tag never deletes the bookmarks themselves.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          New tag
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
          title="Could not load tags"
          description={error}
          action={{ label: "Try again", onClick: refresh }}
        />
      ) : tags.length === 0 ? (
        <EmptyState
          icon={<TagsIcon className="size-6" />}
          title="No tags yet"
          description="Create your first tag to start grouping bookmarks by topic, project or priority."
          action={{ label: "Create a tag", onClick: openCreate }}
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
                    {tag.count ?? 0} bookmark{(tag.count ?? 0) === 1 ? "" : "s"} · created{" "}
                    {formatDate(tag.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  <Button size="iconSm" variant="ghost" onClick={() => openEdit(tag)} aria-label="Rename tag">
                    <Pencil />
                  </Button>
                  <Button
                    size="iconSm"
                    variant="ghost"
                    onClick={() => setDeleting(tag)}
                    aria-label="Delete tag"
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
                      <Palette className="size-3.5" /> Color
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-56">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Tag color
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
                          aria-label={`Set color ${color}`}
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
                  Preview
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
        title="Delete this tag?"
        description={`"${deleting?.name}" will be removed from every bookmark that uses it. The bookmarks themselves are kept.`}
        confirmLabel="Delete tag"
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
      setError("Tag name is required");
      return;
    }
    setBusy(true);
    try {
      if (tag) await updateTag(tag.id, { name: name.trim(), color });
      else await createTag({ name: name.trim(), color });
      toast({ title: tag ? "Tag updated" : "Tag created", description: name.trim(), variant: "success" });
      onSaved();
      onCancel();
    } catch (err) {
      toast({
        title: tag ? "Could not update tag" : "Could not create tag",
        description: err instanceof ApiError ? err.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{tag ? "Edit tag" : "New tag"}</DialogTitle>
        <DialogDescription>
          Tags are shared across bookmarks and can be renamed or recolored anytime.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="tag-name">Name</Label>
          <Input
            id="tag-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(undefined);
            }}
            placeholder="e.g. Design inspiration"
            maxLength={40}
            autoFocus
          />
          <FieldError message={error} />
        </div>

        <div className="space-y-1.5">
          <Label>Color</Label>
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
                aria-label={`Color ${option}`}
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
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy && <Spinner className="size-3.5" />}
          {tag ? "Save changes" : "Create tag"}
        </Button>
      </DialogFooter>
    </form>
  );
}
