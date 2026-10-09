import type { ReactNode } from "react";
import { Bookmark as BookmarkIcon } from "lucide-react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(99,102,241,0.18), transparent 45%), radial-gradient(circle at 85% 80%, rgba(14,165,233,0.16), transparent 45%)",
        }}
        aria-hidden
      />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <BookmarkIcon className="size-6 fill-current" />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-slate-900/5 sm:p-7">
          {children}
        </div>

        {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}
