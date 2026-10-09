import { useRef, useState } from "react";
import { Download, Monitor, Moon, Sun, Upload, User } from "lucide-react";
import { Button, buttonVariants } from "../components/ui/button";
import { Skeleton, Spinner } from "../components/ui/skeleton";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { emitDataChange } from "../hooks/useDataChange";
import { ApiError } from "../lib/api";
import { cn, formatDate } from "../lib/utils";
import { exportBookmarks, importBookmarks } from "../services/bookmarkService";

export function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const bookmarks = await exportBookmarks();
      const payload = {
        app: "bookmark-manager",
        version: 1,
        exportedAt: new Date().toISOString(),
        bookmarks: bookmarks.map((bookmark) => ({
          title: bookmark.title,
          url: bookmark.url,
          description: bookmark.description ?? undefined,
          tags: bookmark.tags.map((tag) => tag.name),
          isPinned: bookmark.isPinned,
          isArchived: bookmark.isArchived,
        })),
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `bookmarks-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      toast({
        title: "Xuất file thành công",
        description: `Đã xuất ${bookmarks.length} dấu trang dưới dạng JSON.`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Xuất file thất bại",
        description: err instanceof ApiError ? err.message : "Vui lòng thử lại.",
        variant: "error",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      const rawList = Array.isArray(parsed)
        ? parsed
        : (parsed as { bookmarks?: unknown })?.bookmarks;

      if (!Array.isArray(rawList)) {
        throw new Error("Tệp phải chứa một danh sách dấu trang");
      }

      const bookmarks = rawList
        .filter(
          (item): item is { title: string; url: string } =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as { title?: unknown }).title === "string" &&
            typeof (item as { url?: unknown }).url === "string",
        )
        .map((item) => {
          const record = item as {
            title: string;
            url: string;
            description?: string;
            tags?: string[];
            isPinned?: boolean;
            isArchived?: boolean;
          };
          return {
            title: record.title,
            url: record.url,
            description: typeof record.description === "string" ? record.description : undefined,
            tags: Array.isArray(record.tags)
              ? record.tags.filter((tag): tag is string => typeof tag === "string")
              : undefined,
            isPinned: Boolean(record.isPinned),
            isArchived: Boolean(record.isArchived),
          };
        });

      if (bookmarks.length === 0) throw new Error("Không tìm thấy dấu trang hợp lệ trong tệp");

      const result = await importBookmarks({ bookmarks });
      emitDataChange();
      toast({
        title: "Nhập file hoàn tất",
        description: `Đã nhập ${result.imported}, bỏ qua ${result.skipped} mục trùng lặp.`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Nhập file thất bại",
        description:
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Tệp JSON không hợp lệ.",
        variant: "error",
      });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Cài đặt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý giao diện, tài khoản và dữ liệu dấu trang của bạn.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <User className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Tài khoản</h2>
        </div>
        <div className="mt-4 space-y-3">
          {user ? (
            <>
              <Row label="Tên" value={user.name ?? "—"} />
              <Row label="Email" value={user.email} />
              <Row label="Thành viên từ" value={formatDate(user.createdAt)} />
            </>
          ) : (
            <>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-64" />
            </>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Monitor className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Giao diện</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Lựa chọn của bạn sẽ được ghi nhớ trên thiết bị này.
        </p>
        <div className="mt-4 inline-flex rounded-xl border border-border bg-background p-1">
          {(
            [
              { key: "light", label: "Sáng", icon: <Sun className="size-4" /> },
              { key: "dark", label: "Tối", icon: <Moon className="size-4" /> },
            ] as const
          ).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setTheme(option.key)}
              className={cn(
                buttonVariants({ variant: theme === option.key ? "default" : "ghost", size: "sm" }),
                "gap-2",
              )}
              aria-pressed={theme === option.key}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Upload className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Dữ liệu</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Xuất thư viện của bạn dưới dạng JSON, hoặc nhập tệp đã xuất trước đó. Các mục trùng lặp
          sẽ được tự động bỏ qua.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => void handleExport()} disabled={exporting}>
            {exporting ? <Spinner className="size-4" /> : <Download />}
            Xuất JSON
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}>
            {importing ? <Spinner className="size-4" /> : <Upload />}
            Nhập JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImportFile(file);
            }}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Giới thiệu</h2>
        <dl className="mt-3 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <div className="flex justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2">
            <dt>Giao diện</dt>
            <dd className="font-medium text-foreground">React · TypeScript · Vite · Tailwind</dd>
          </div>
          <div className="flex justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2">
            <dt>Máy chủ</dt>
            <dd className="font-medium text-foreground">Express · Zod · JWT</dd>
          </div>
          <div className="flex justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2">
            <dt>Cơ sở dữ liệu</dt>
            <dd className="font-medium text-foreground">PostgreSQL · Prisma</dd>
          </div>
          <div className="flex justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2">
            <dt>Phiên bản</dt>
            <dd className="font-medium text-foreground">1.0.0</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
