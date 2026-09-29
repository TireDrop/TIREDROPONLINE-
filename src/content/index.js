/**
 * The content system, as the app sees it.
 *
 * Every Markdown file under src/content is read at build time with
 * import.meta.glob (raw text) and parsed by ./core.js — the same parser the
 * sitemap uses in Node through ./node.js, so the two can never disagree.
 *
 *   src/content/learn/<hub>/<slug>.md  ->  /learn/<hub>/<slug>
 *   src/content/blog/<slug>.md         ->  /blog/<slug>
 *   src/content/learn/hubs.json        ->  the hub list
 *
 * Drafts (`draft: true`) and `_`-prefixed sample files render only in dev and
 * in `--mode preview` builds. The production build leaves `_` files out of the
 * bundle altogether, and neither ever reaches the routes or the sitemap.
 */
import hubs from "./learn/hubs.json";
import { buildContent } from "./core.js";

export {
  AUTHOR,
  BLOG_CATEGORIES,
  DEFAULT_CTA,
  canonicalSitePath,
  isExternalUrl,
} from "./core.js";

/** True in `vite` dev and in `vite build --mode preview`. */
export const SHOW_DRAFTS =
  import.meta.env.DEV || import.meta.env.MODE === "preview";

// Vite needs the glob options written out as literals, so they repeat.
const PUBLISHED = import.meta.glob(
  ["./learn/*/*.md", "./blog/*.md", "!./learn/*/_*.md", "!./blog/_*.md"],
  { query: "?raw", import: "default", eager: true },
);

// Only referenced when drafts show, so a production build drops these
// modules (and their text) from the bundle.
const SAMPLES = SHOW_DRAFTS
  ? import.meta.glob(["./learn/*/_*.md", "./blog/_*.md"], {
      query: "?raw",
      import: "default",
      eager: true,
    })
  : {};

const store = buildContent({
  files: { ...PUBLISHED, ...SAMPLES },
  hubs,
  includeDrafts: SHOW_DRAFTS,
});

if (SHOW_DRAFTS && typeof console !== "undefined") {
  for (const p of store.problems) {
    console[p.level === "error" ? "error" : "warn"](
      `[content] ${p.file}: ${p.message}`,
    );
  }
}

/** Hubs in order: `{ slug, title, description, order, path, count, lastmod }`. */
export const getLearnHubs = () => store.getLearnHubs();

/** One hub by slug, or null. */
export const getHub = (slug) => store.getHub(slug);

/** Learn guides, optionally for one hub: `getLearnArticles({ hub: "tread" })`. */
export const getLearnArticles = (options) => store.getLearnArticles(options);

/** `getArticle("learn", hub, slug)` or `getArticle("blog", null, slug)`. */
export const getArticle = (section, hub, slug) =>
  store.getArticle(section, hub, slug);

/** Whether a /learn or /blog path is published in this build. */
export const isLive = (path) => store.isLive(path);

/** An article by its site path, or null. */
export const getArticleByPath = (path) => store.getArticleByPath(path);

/** Blog posts, newest first, optionally for one category slug. */
export const getBlogPosts = (options) => store.getBlogPosts(options);

/** Categories with at least one post: `{ slug, label, count }`. */
export const getBlogCategories = () => store.getBlogCategories();

/** Every public, non-draft content path (never drafts, even in dev). */
export const contentRoutes = () => store.contentRoutes();

/** YYYY-MM-DD a content path last changed, or null. */
export const contentLastmod = (path) => store.contentLastmod(path);

/** `{ segments, toc, demos }` for an article's body (cached). */
export const renderArticle = (article) => store.renderArticle(article);
