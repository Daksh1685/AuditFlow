
import { useEffect, useRef, useCallback } from "react";

export const DATA_UPDATED_KEY = "auditflow_data_updated";


export function signalDataUpdated() {
  localStorage.setItem(DATA_UPDATED_KEY, Date.now().toString());
}

export function useRefetchOnFocus(refetch: () => void, deps: unknown[] = []) {
  const refetchRef = useRef(refetch);
  useEffect(() => { refetchRef.current = refetch; });

  const lastSeenSignal = useRef<string | null>(null);

  const check = useCallback(() => {
    if (document.visibilityState === "visible") {
      const current = localStorage.getItem(DATA_UPDATED_KEY);
      if (current && current !== lastSeenSignal.current) {
        lastSeenSignal.current = current;
        refetchRef.current();
      }
    }
  }, []);

  useEffect(() => {
    lastSeenSignal.current = localStorage.getItem(DATA_UPDATED_KEY);

    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, deps);
}
