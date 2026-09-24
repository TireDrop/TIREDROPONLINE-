import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// Side-by-side comparison, the way every large tire retailer does it: tick a
// few models in the catalog, a tray slides up, and one button opens a table
// that puts their prices and specs in the same columns.
//
// Four is the ceiling because that is how many columns fit a laptop screen
// without the table turning into a spreadsheet.

const MAX_COMPARE = 4;
const STORAGE_KEY = "tiredrop.compare.v1";

const CompareContext = createContext(null);

/** Reads the saved picks, tolerating private mode and blocked storage. */
function readStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed)
      ? parsed.filter((s) => typeof s === "string").slice(0, MAX_COMPARE)
      : null;
  } catch {
    return null;
  }
}

export function CompareProvider({ children }) {
  // Slugs, not whole products — the catalog is the source of truth and a
  // stored copy would go stale the moment a price changes.
  const [slugs, setSlugs] = useState([]);

  // Comparison outlives a page load, the same way the cart does. Without this
  // a refresh — or opening /compare in a new tab — silently empties the table
  // the shopper just built.
  useEffect(() => {
    const saved = readStorage();
    if (saved?.length) setSlugs(saved);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
    } catch {
      /* private mode or blocked storage — the picks stay in memory only */
    }
  }, [slugs]);

  const toggle = useCallback((slug) => {
    setSlugs((current) =>
      current.includes(slug)
        ? current.filter((s) => s !== slug)
        : current.length >= MAX_COMPARE
          ? current
          : [...current, slug],
    );
  }, []);

  const remove = useCallback(
    (slug) => setSlugs((current) => current.filter((s) => s !== slug)),
    [],
  );

  const clear = useCallback(() => setSlugs([]), []);

  const value = useMemo(
    () => ({
      slugs,
      count: slugs.length,
      max: MAX_COMPARE,
      isFull: slugs.length >= MAX_COMPARE,
      has: (slug) => slugs.includes(slug),
      toggle,
      remove,
      clear,
    }),
    [slugs, toggle, remove, clear],
  );

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside a CompareProvider");
  return ctx;
}

export { MAX_COMPARE };
