import { useCallback, useEffect, useState } from "react";
import { listBookmarks } from "../services/bookmarkService";
import type { Bookmark, BookmarkQuery, PageMeta } from "../types";
import { useDataChange } from "./useDataChange";

const DEFAULT_META: PageMeta = { page: 1, limit: 12, total: 0, totalPages: 1 };

interface ResultState {
  key: string;
  items: Bookmark[];
  meta: PageMeta;
  error: string | null;
}

export function useBookmarks(query: BookmarkQuery) {
  const [result, setResult] = useState<ResultState | null>(null);
  const [tick, setTick] = useState(0);

  const queryKey = JSON.stringify(query);
  const currentKey = `${queryKey}#${tick}`;

  useEffect(() => {
    const controller = new AbortController();

    listBookmarks(query, controller.signal)
      .then((data) => {
        setResult({ key: currentKey, items: data.data, meta: data.meta, error: null });
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setResult((previous) => ({
          key: currentKey,
          items: previous?.items ?? [],
          meta: previous?.meta ?? DEFAULT_META,
          error: err.message,
        }));
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey]);

  const refresh = useCallback(() => setTick((value) => value + 1), []);
  useDataChange(refresh);

  const loading = result === null || result.key !== currentKey;

  return {
    items: result?.items ?? [],
    meta: result?.meta ?? DEFAULT_META,
    loading,
    error: loading ? null : (result?.error ?? null),
    refresh,
  };
}
