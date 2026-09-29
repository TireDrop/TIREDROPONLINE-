import { lazy } from "react";

/**
 * Lazy-loads a Learn or Blog route page.
 *
 * TODO(merge with blog-p0): that branch adds src/lib/lazyPage.js, which
 * prerendering needs (preloadable chunks, so a hydrating page never
 * suspends). At merge, replace this whole file with:
 *
 *   export { lazyPage } from "../lib/lazyPage.js";
 *
 * `key` is the module's path under src/ (e.g. "pages/learn/ArticlePage.jsx"),
 * which lazyPage looks up in Vite's build manifest. Until then this is plain
 * React.lazy and the key is unused.
 */
export function lazyPage(key, load) {
  return lazy(load);
}
