import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BookmarkFormDialog } from "../bookmarks/BookmarkFormDialog";

interface AddBookmarkContextValue {
  openAddDialog: () => void;
}

const AddBookmarkContext = createContext<AddBookmarkContextValue>({ openAddDialog: () => undefined });

export function useAddBookmark(): AddBookmarkContextValue {
  return useContext(AddBookmarkContext);
}

export function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <AddBookmarkContext.Provider value={{ openAddDialog: () => setAddOpen(true) }}>
      <div className="min-h-screen bg-background">
        <div className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
          <Sidebar />
        </div>

        {sidebarOpen && (
          <div className="lg:hidden">
            <div
              className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[1px]"
              onClick={() => setSidebarOpen(false)}
              aria-hidden
            />
            <div className="fixed inset-y-0 left-0 z-50 shadow-2xl">
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="absolute -right-11 top-4 rounded-lg bg-card p-2 text-muted-foreground shadow-lg transition hover:text-foreground"
                aria-label="Đóng điều hướng"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="lg:pl-64">
          <Header onMenuClick={() => setSidebarOpen(true)} onAddClick={() => setAddOpen(true)} />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>

        <BookmarkFormDialog open={addOpen} onOpenChange={setAddOpen} />
      </div>
    </AddBookmarkContext.Provider>
  );
}
