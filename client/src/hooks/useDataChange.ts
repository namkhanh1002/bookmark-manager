import { useEffect } from "react";

export const DATA_EVENT = "bookmark-manager:data-changed";

export function emitDataChange() {
  window.dispatchEvent(new Event(DATA_EVENT));
}

export function useDataChange(callback: () => void) {
  useEffect(() => {
    window.addEventListener(DATA_EVENT, callback);
    return () => window.removeEventListener(DATA_EVENT, callback);
  }, [callback]);
}
