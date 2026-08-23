import { useCallback, useEffect, useState } from "react";

export type TenderScope = "all" | "national" | "county";

const SCOPE_KEY = "ta_ticker_scope";
const COUNTIES_KEY = "ta_ticker_counties";
const EVENT = "ta-county-focus-change";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Landing-page focus: national vs county scope plus selected counties. Shared across components. */
export function useCountyFocus() {
  const [scope, setScopeState] = useState<TenderScope>(() => read<TenderScope>(SCOPE_KEY, "all"));
  const [counties, setCountiesState] = useState<string[]>(() => read<string[]>(COUNTIES_KEY, []));

  useEffect(() => {
    const sync = () => {
      setScopeState(read<TenderScope>(SCOPE_KEY, "all"));
      setCountiesState(read<string[]>(COUNTIES_KEY, []));
    };
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const persist = useCallback((key: string, value: unknown) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable — keep in-memory state only */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const setScope = useCallback(
    (next: TenderScope) => {
      setScopeState(next);
      persist(SCOPE_KEY, next);
    },
    [persist],
  );

  const setCounties = useCallback(
    (next: string[]) => {
      setCountiesState(next);
      persist(COUNTIES_KEY, next);
    },
    [persist],
  );

  const toggleCounty = useCallback(
    (county: string) => {
      const next = counties.includes(county)
        ? counties.filter((c) => c !== county)
        : [...counties, county];
      setCounties(next);
    },
    [counties, setCounties],
  );

  return { scope, setScope, counties, setCounties, toggleCounty };
}
