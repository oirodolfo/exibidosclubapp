import { useEffect, useState } from "react";

/**
 * Returns a debounced value that updates after `delayMs` of no changes.
 * Cancels previous timer on each update.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);

    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
