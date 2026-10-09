import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link2, Loader2, Pin, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input, Label, Textarea, FieldError } from "../ui/input";
import { Spinner } from "../ui/skeleton";
import { TagMultiSelect } from "./TagMultiSelect";
import { useToast } from "../../context/ToastContext";
import { useDebounce } from "../../hooks/useDebounce";
import { emitDataChange } from "../../hooks/useDataChange";
import { ApiError } from "../../lib/api";
import { createBookmark, fetchPageMetadata, updateBookmark } from "../../services/bookmarkService";
import { cn, safeUrl } from "../../lib/utils";
import type { Bookmark } from "../../types";

interface BookmarkFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookmark?: Bookmark | null;
}

export function BookmarkFormDialog({ open, onOpenChange, bookmark }: BookmarkFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <DialogContent className="max-w-xl">
          <FormBody bookmark={bookmark ?? null} onDone={() => onOpenChange(false)} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function FormBody({ bookmark, onDone }: { bookmark: Bookmark | null; onDone: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState(bookmark?.title ?? "");
  const [url, setUrl] = useState(bookmark?.url ?? "");
  const [description, setDescription] = useState(bookmark?.description ?? "");
  const [tagIds, setTagIds] = useState<string[]>(bookmark?.tags.map((tag) => tag.id) ?? []);
  const [isPinned, setIsPinned] = useState(bookmark?.isPinned ?? false);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(bookmark?.faviconUrl ?? null);
  const [titleTouched, setTitleTouched] = useState(Boolean(bookmark));
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});
  const [busy, setBusy] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const fetchedRef = useRef<string | null>(bookmark?.url ?? null);

  const debouncedUrl = useDebounce(url, 700);

  const fetchMeta = useCallback(
    async (target: string) => {
      const candidate = safeUrl(target);
      if (!candidate || candidate === fetchedRef.current) return;
      fetchedRef.current = candidate;
      setFetchingMeta(true);
      try {
        const meta = await fetchPageMetadata(candidate);
        if (meta.faviconUrl) setFaviconUrl(meta.faviconUrl);
        if (!titleTouched && meta.title) setTitle(meta.title);
        if (!description && meta.description) setDescription(meta.description);
      } catch {
        /* metadata is best effort only */
      } finally {
        setFetchingMeta(false);
      }
    },
    [titleTouched, description],
  );

  useEffect(() => {
    if (!debouncedUrl.trim()) return;
    // Fetching page metadata for the debounced URL: the loading flag must flip
    // before the request settles, which is the legitimate fetching-in-effect case.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMeta(debouncedUrl.trim());
  }, [debouncedUrl, fetchMeta]);

  const validate = () => {
    const next: { title?: string; url?: string } = {};
    if (!title.trim()) next.title = "Title is required";
    if (!url.trim()) next.url = "URL is required";
    else if (!safeUrl(url.trim())) next.url = "Enter a valid URL (https://example.com)";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        url: url.trim(),
        description: description.trim(),
        faviconUrl,
        tagIds,
        isPinned,
      };

      if (bookmark) {
        await updateBookmark(bookmark.id, payload);
        toast({ title: "Bookmark updated", description: "Your changes were saved.", variant: "success" });
      } else {
        await createBookmark(payload);
        toast({ title: "Bookmark added", description: title.trim(), variant: "success" });
      }

      emitDataChange();
      onDone();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      const field = err instanceof ApiError ? err.details?.[0]?.message : undefined;
      toast({ title: bookmark ? "Could not update bookmark" : "Could not add bookmark", description: field ?? message, variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{bookmark ? "Edit bookmark" : "Add bookmark"}</DialogTitle>
        <DialogDescription>
          {bookmark
            ? "Update the details of this saved link."
            : "Paste a URL — we will try to fetch the title, description and favicon for you."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-1.5">
        <Label htmlFor="bookmark-url">URL</Label>
        <div className="relative">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="bookmark-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/article"
            className="pl-9 pr-9"
            autoComplete="off"
            spellCheck={false}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {fetchingMeta ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <button
                type="button"
                onClick={() => void fetchMeta(url.trim())}
                className="rounded p-0.5 text-muted-foreground transition hover:text-primary"
                aria-label="Fetch site metadata"
                title="Fetch title and description"
              >
                <Sparkles className="size-4" />
              </button>
            )}
          </span>
        </div>
        <FieldError message={errors.url} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bookmark-title">Title</Label>
        <Input
          id="bookmark-title"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setTitleTouched(true);
          }}
          placeholder="e.g. React documentation"
          maxLength={300}
        />
        <FieldError message={errors.title} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bookmark-description">Description</Label>
        <Textarea
          id="bookmark-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Why is this link worth saving? (optional)"
          rows={3}
          maxLength={2000}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Tags</Label>
        <TagMultiSelect selectedIds={tagIds} onChange={setTagIds} />
      </div>

      <button
        type="button"
        onClick={() => setIsPinned((value) => !value)}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition",
          isPinned
            ? "border-primary/40 bg-accent text-accent-foreground"
            : "border-border bg-card text-muted-foreground hover:bg-muted",
        )}
      >
        <span className="flex items-center gap-2">
          <Pin className="size-4" />
          Pin this bookmark to the top
        </span>
        <span
          className={cn(
            "relative h-5 w-9 rounded-full transition-colors",
            isPinned ? "bg-primary" : "bg-muted-foreground/30",
          )}
        >
          <span
            className={cn(
              "absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform",
              isPinned && "translate-x-4",
            )}
          />
        </span>
      </button>

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy && <Spinner className="size-3.5" />}
          {bookmark ? "Save changes" : "Add bookmark"}
        </Button>
      </DialogFooter>
    </form>
  );
}
