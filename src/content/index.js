/**
 * The content system, as the app sees it.
 *
 * Every Markdown file under src/content is parsed at build time, in Node, by
 * ./core.js: the same parser the sitemap uses through ./node.js, so the two
 * can never disagree. The browser never gets the Markdown or the parser
 * (only ./store.js's queries). It gets:
 *
 *   - here, "virtual:content-summaries": each article's list fields (title,
 *     description, hub, category, dates, reading time), enough for every
 *     card, hub, index and route, and no bodies;
 *   - in ./details.js, one chunk per article with the rest of its
 *     frontmatter and its body already rendered to HTML, loaded only by that
 *     article's page.
 * Both come from the tiredrop-content plugin in vite.config.js.
 *
 *   src/content/learn/<hub>/<slug>.md  ->  /learn/<hub>/<slug>
 *   src/content/blog/<slug>.md         ->  /blog/<slug>
 *   src/content/learn/hubs.json        ->  the hub list
 *
 * Drafts (`draft: true`) and `_`-prefixed sample files render only in dev and
 * in `--mode preview` builds. The production build leaves them out of the
 * bundle altogether, and neither ever reaches the routes or the sitemap.
 */
import hubs from "./learn/hubs.json";
import summaries from "virtual:content-summaries";
import { createStore } from "./store.js";

export {
  AUTHOR,
  BLOG_CATEGORIES,
  DEFAULT_CTA,
  canonicalSitePath,
  isExternalUrl,
} from "./store.js";

/** True in `vite` dev and in `vite build --mode preview`. */
export const SHOW_DRAFTS =
  import.meta.env.DEV || import.meta.env.MODE === "preview";

// The summaries are already only what this build shows (the plugin filters
// by the same rule), so includeDrafts just keeps dev drafts in.
const store = createStore({
  articles: summaries,
  hubs,
  includeDrafts: SHOW_DRAFTS,
});

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
