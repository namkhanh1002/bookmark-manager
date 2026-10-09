import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { BookmarkPlus, LogOut, Menu, Moon, Search, Settings, Sun, X } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useDebounce } from "../../hooks/useDebounce";

interface HeaderProps {
  onMenuClick: () => void;
  onAddClick: () => void;
}

export function Header({ onMenuClick, onAddClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [params, setParams] = useSearchParams();

  const onBookmarks = location.pathname === "/bookmarks";
  const urlQuery = params.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(urlQuery);
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  const debouncedSearch = useDebounce(searchInput, 300);

  if (prevUrlQuery !== urlQuery) {
    setPrevUrlQuery(urlQuery);
    setSearchInput(urlQuery);
  }

  useEffect(() => {
    if (!onBookmarks) return;
    if (debouncedSearch === urlQuery) return;
    const next = new URLSearchParams(params);
    if (debouncedSearch) next.set("q", debouncedSearch);
    else next.delete("q");
    next.delete("page");
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, onBookmarks]);

  const initials = (user?.name || user?.email || "?").slice(0, 2).toUpperCase();
  const pageTitle =
    location.pathname === "/tags"
      ? "Tags"
      : location.pathname === "/settings"
        ? "Settings"
        : "Bookmarks";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>

        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-semibold text-foreground">{pageTitle}</p>
          <p className="text-[11px] text-muted-foreground">
            {location.pathname === "/bookmarks"
              ? "Search, sort and filter your library"
              : location.pathname === "/tags"
                ? "Organize your bookmarks with tags"
                : "Preferences and data"}
          </p>
        </div>

        {onBookmarks && (
          <div className="relative min-w-0 flex-1 sm:mx-4 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search bookmarks…"
              aria-label="Search bookmarks"
              className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-9 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>

          <Button onClick={onAddClick} className="hidden sm:inline-flex">
            <BookmarkPlus />
            Add bookmark
          </Button>
          <Button onClick={onAddClick} size="icon" className="sm:hidden" aria-label="Add bookmark">
            <BookmarkPlus />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="ml-1 flex size-9 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground ring-2 ring-transparent transition hover:ring-primary/40"
                aria-label="Account menu"
              >
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
              <p className="truncate px-2.5 pb-2 text-sm text-foreground">{user?.email}</p>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={logout}
                className="text-destructive focus:text-destructive [&_svg]:text-destructive"
              >
                <LogOut /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

