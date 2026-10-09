import { NavLink, useLocation, useSearchParams } from "react-router-dom";
import {
  Archive,
  Clock,
  Bookmark as BookmarkIcon,
  Pin,
  Settings,
  Tags as TagsIcon,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStats } from "../../hooks/useStats";
import { useTags } from "../../hooks/useTags";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";

interface SidebarProps {
  onNavigate?: () => void;
}

interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  to: string;
  active: boolean;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { stats } = useStats();
  const { tags } = useTags();
  const { user } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();

  const view = params.get("view") ?? "all";
  const sort = params.get("sort") ?? "recent";
  const onBookmarks = location.pathname === "/bookmarks";

  const allActive =
    onBookmarks && view === "all" && sort !== "recentlyVisited" && sort !== "mostVisited";

  const items: NavItem[] = [
    {
      key: "all",
      label: "All Bookmarks",
      icon: BookmarkIcon,
      count: stats.all,
      to: "/bookmarks",
      active: allActive,
    },
    {
      key: "pinned",
      label: "Pinned",
      icon: Pin,
      count: stats.pinned,
      to: "/bookmarks?view=pinned",
      active: onBookmarks && view === "pinned",
    },
    {
      key: "recent",
      label: "Recently Visited",
      icon: Clock,
      to: "/bookmarks?sort=recentlyVisited",
      active: onBookmarks && view === "all" && sort === "recentlyVisited",
    },
    {
      key: "popular",
      label: "Most Visited",
      icon: TrendingUp,
      to: "/bookmarks?sort=mostVisited",
      active: onBookmarks && view === "all" && sort === "mostVisited",
    },
    {
      key: "archived",
      label: "Archived",
      icon: Archive,
      count: stats.archived,
      to: "/bookmarks?view=archived",
      active: onBookmarks && view === "archived",
    },
  ];

  const initials = (user?.name || user?.email || "?").slice(0, 2).toUpperCase();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <BookmarkIcon className="size-4.5 fill-current" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold text-foreground">Bookmark Manager</p>
          <p className="text-[11px] text-muted-foreground">Personal link library</p>
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <div>
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Library
          </p>
          <ul className="space-y-0.5">
            {items.map((item) => (
              <li key={item.key}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                    item.active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                  aria-current={item.active ? "page" : undefined}
                >
                  <item.icon className={cn("size-4 shrink-0", item.active && "text-primary")} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {typeof item.count === "number" && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                        item.active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {item.count}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tags
          </p>
          <ul className="space-y-0.5">
            {tags.slice(0, 6).map((tag) => {
              const active = location.pathname === "/bookmarks" && (params.get("tags") ?? "").split(",").includes(tag.id);
              return (
                <li key={tag.id}>
                  <NavLink
                    to={`/bookmarks?tags=${encodeURIComponent(tag.id)}`}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                    )}
                  >
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="min-w-0 flex-1 truncate">{tag.name}</span>
                    <span className="text-[11px] tabular-nums text-muted-foreground">{tag.count ?? 0}</span>
                  </NavLink>
                </li>
              );
            })}
            <li>
              <NavLink
                to="/tags"
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  location.pathname === "/tags"
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <TagsIcon className="size-4 shrink-0" />
                <span className="flex-1">Manage tags</span>
                <span className="text-[11px] tabular-nums text-muted-foreground">{tags.length}</span>
              </NavLink>
            </li>
          </ul>
        </div>

        <div>
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            General
          </p>
          <NavLink
            to="/settings"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
              location.pathname === "/settings"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <Settings className="size-4 shrink-0" />
            Settings
          </NavLink>
        </div>
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/50 px-3 py-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initials}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-foreground">{user?.name ?? "Account"}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
