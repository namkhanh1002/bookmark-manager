import { useState } from "react";
import { Check, Plus, Tags } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Spinner } from "../ui/skeleton";
import { TagBadge } from "../ui/tag-badge";
import { createTag } from "../../services/tagService";
import { useTags } from "../../hooks/useTags";
import { useToast } from "../../context/ToastContext";
import { cn, TAG_COLORS } from "../../lib/utils";
import { ApiError } from "../../lib/api";
import type { Tag } from "../../types";

interface TagMultiSelectProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function TagMultiSelect({ selectedIds, onChange }: TagMultiSelectProps) {
  const { tags, refresh } = useTags();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const selected: Tag[] = tags.filter((tag) => selectedIds.includes(tag.id));

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id]);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const tag = await createTag({ name, color: TAG_COLORS[name.length % TAG_COLORS.length] });
      setNewName("");
      refresh();
      onChange([...selectedIds, tag.id]);
    } catch (err) {
      toast({
        title: "Không thể tạo thẻ",
        description: err instanceof ApiError ? err.message : "Vui lòng thử lại.",
        variant: "error",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-card px-2 py-1.5">
        {selected.length === 0 && (
          <span className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
            <Tags className="size-3.5" /> Chưa chọn thẻ nào
          </span>
        )}
        {selected.map((tag) => (
          <TagBadge key={tag.id} tag={tag} onRemove={() => toggle(tag.id)} />
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="ml-auto inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Thêm thẻ"
            >
              <Plus className="size-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2">
            <div className="scrollbar-thin max-h-64 space-y-0.5 overflow-y-auto">
              {tags.length === 0 && (
                <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                  Chưa có thẻ nào. Hãy tạo thẻ đầu tiên bên dưới.
                </p>
              )}
              {tags.map((tag) => {
                const active = selectedIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggle(tag.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-muted"
                  >
                    <span
                      className="flex size-4 items-center justify-center rounded border"
                      style={{
                        borderColor: active ? tag.color : "var(--border)",
                        backgroundColor: active ? tag.color : "transparent",
                      }}
                    >
                      {active && <Check className="size-3 text-white" strokeWidth={3} />}
                    </span>
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="min-w-0 flex-1 truncate">{tag.name}</span>
                    <span className="text-xs text-muted-foreground">{tag.count ?? 0}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex gap-1.5 border-t border-border pt-2">
              <Input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleCreate();
                  }
                }}
                placeholder="Tên thẻ mới"
                className="h-8"
                maxLength={40}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleCreate()}
                disabled={creating || !newName.trim()}
              >
                {creating ? <Spinner className="size-3.5" /> : <Plus className="size-3.5" />}
                Thêm
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags
            .filter((tag) => !selectedIds.includes(tag.id))
            .slice(0, 6)
            .map((tag) => (
              <button key={tag.id} type="button" onClick={() => toggle(tag.id)} className={cn("transition hover:opacity-80")}>
                <TagBadge tag={{ name: `+ ${tag.name}`, color: tag.color }} />
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
