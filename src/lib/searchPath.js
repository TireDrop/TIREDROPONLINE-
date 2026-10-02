/**
 * The two pieces of the store search the masthead needs before its matching
 * code (src/lib/siteSearch.js) has loaded. They live here, not there, so the
 * header can import them without pulling the whole search into every page's
 * bundle; siteSearch.js re-exports both.
 */

/** The fewest characters worth searching. */
export const MIN_QUERY = 2;

/** The /search address for a query. */
export const searchPath = (q) => `/search?q=${encodeURIComponent(String(q ?? "").trim())}`;
