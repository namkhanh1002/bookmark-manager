import { useCallback, useEffect, useState } from "react";
import { listTags } from "../services/tagService";
import type { Tag } from "../types";
import { useDataChange } from "./useDataChange";

interface TagsResult {
  key: number;
  tags: Tag[];
  error: string | null;
}

export function useTags() {
  const [result, setResult] = useState<TagsResult | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    listTags(controller.signal)
      .then((tags) => {
        setResult({ key: tick, tags, error: null });
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setResult((previous) => ({ key: tick, tags: previous?.tags ?? [], error: err.message }));
      });

    return () => controller.abort();
  }, [tick]);

  const refresh = useCallback(() => setTick((value) => value + 1), []);
  useDataChange(refresh);

  const loading = result === null || result.key !== tick;

  return {
    tags: result?.tags ?? [],
    loading,
    error: loading ? null : (result?.error ?? null),
    refresh,
  };
}
