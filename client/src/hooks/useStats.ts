import { useCallback, useEffect, useState } from "react";
import { fetchStats } from "../services/bookmarkService";
import type { Stats } from "../types";
import { useDataChange } from "./useDataChange";

const emptyStats: Stats = { all: 0, pinned: 0, archived: 0 };

export function useStats() {
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    fetchStats(controller.signal)
      .then((result) => {
        if (active) setStats(result);
      })
      .catch(() => {
        if (active) setStats(emptyStats);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [tick]);

  const refresh = useCallback(() => setTick((value) => value + 1), []);
  useDataChange(refresh);

  return { stats, refresh };
}
