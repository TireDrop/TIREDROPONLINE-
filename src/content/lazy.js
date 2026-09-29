/**
 * Lazy-loads a Learn or Blog route page (or anything else rendered into
 * prerendered HTML). Same function the rest of the app uses:
 * `lazyPage(key, importer)`, where `key` is the module's path under src/
 * (e.g. "pages/learn/ArticlePage.jsx") and must match the build manifest.
 */
export { lazyPage } from "../lib/lazyPage.js";
