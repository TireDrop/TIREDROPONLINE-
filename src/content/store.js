/**
 * The content store: the queries over a list of articles (hubs, lists,
 * lookups, isLive, routes, lastmod) and the small helpers they share with
 * the parser.
 *
 * Split from ./core.js so the browser can have it without the Markdown and
 * YAML parsers: src/content/index.js runs createStore() on article summaries
 * (LIST_FIELDS) built at build time, while ./core.js's buildContent() runs it
 * on full articles in Node. Anything here must stay free of js-yaml, marked
 * and article bodies.
 */
import { TOOL_PAGE_ALIASES } from "../components/demos/toolPages.js";

export const ORIGIN = "https://tiredroponline.com";

/** The byline on every article. Fixed: no personal names, no credentials. */
export const AUTHOR = "TireDrop Team, Extreme Tires, Sunrise FL";

/** Used when an article has no `cta` of its own. */
export const DEFAULT_CTA = { label: "Shop tires", href: "/tires" };

/**
 * Blog categories. The plan (docs/content/blog-plan.md) names them by code
 * (HUR, WX, ...); frontmatter may use the code, the slug or the label, in any
 * case, and they all land on the same category. Anything else is shown as
 * written rather than dropped.
 */
export const BLOG_CATEGORIES = [
  { slug: "hurricane", label: "Hurricanes & Flooding", aliases: ["hur"] },
  { slug: "weather", label: "Rain, Heat & Weather", aliases: ["wx"] },
  { slug: "travel", label: "Travel & Roadside", aliases: ["trv"] },
  { slug: "local", label: "Local Buying & Service", aliases: ["loc"] },
  { slug: "buying", label: "Buying & Price", aliases: ["buy"] },
  { slug: "myths", label: "Myth-Busting", aliases: ["myth"] },
  { slug: "vehicles", label: "Vehicle Guides", aliases: ["veh", "vehicle"] },
  { slug: "ev-fleet", label: "EV, Truck & Fleet", aliases: ["seg"] },
];

/**
 * Old or planned paths that are not routes, mapped to the page that is.
 * The plans link /tools/tire-check and friends; the tools live at the root.
 */
const PATH_ALIASES = {
  "/tools/tire-size": "/tire-size",
  "/tools/tire-check": "/tire-check",
  "/tools/tread-gauge": "/tire-check",
  "/tools/find-my-tires": "/find-my-tires",
  "/tools/tire-size-finder": "/tire-size-finder",
  // The demo tool pages: /tools/<demo id or planned alias> -> their page.
  ...Object.fromEntries(
    Object.entries(TOOL_PAGE_ALIASES).map(([a, path]) => [`/tools/${a}`, path]),
  ),
  "/tire-care": "/learn",
};

/** YAML may hand back a number or a Date for an unquoted value; keep strings. */
export function asString(value) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

/**
 * Canonical in-site path for a link. Drops our own origin, maps aliases
 * (/tools/tire-check -> /tire-check) and trims a trailing slash. Returns null
 * for anything that is not an in-site path.
 */
export function canonicalSitePath(href) {
  let text = String(href ?? "").trim();
  if (text.startsWith(ORIGIN)) text = text.slice(ORIGIN.length) || "/";
  if (text.startsWith("//")) return null;
  if (!text.startsWith("/")) return null;
  const cut = text.search(/[?#]/);
  const pathPart = cut === -1 ? text : text.slice(0, cut);
  const rest = cut === -1 ? "" : text.slice(cut);
  let path = pathPart.length > 1 ? pathPart.replace(/\/+$/, "") : pathPart;
  path = PATH_ALIASES[path] ?? path;
  return path + rest;
}

export function isExternalUrl(href) {
  return (
    /^https?:\/\//i.test(String(href ?? "")) && !String(href).startsWith(ORIGIN)
  );
}

const CONTENT_PATH = /^\/(learn|blog)(\/|$)/;
export const isContentPath = (path) => CONTENT_PATH.test(path);

const byLearnOrder = (hubOrder) => (a, b) =>
  (hubOrder.get(a.hub) ?? 99) - (hubOrder.get(b.hub) ?? 99) ||
  a.date.localeCompare(b.date) ||
  a.title.localeCompare(b.title);

const byNewest = (a, b) =>
  b.date.localeCompare(a.date) || a.title.localeCompare(b.title);

const maxDate = (dates) => dates.filter(Boolean).sort().at(-1) ?? null;

/**
 * The fields an article list (cards, hubs, the blog index, routes, lastmod)
 * needs. The browser gets only these for every article (see
 * src/content/index.js); everything else, the body above all, ships in that
 * article's own chunk (articleDetail() in ./core.js).
 */
export const LIST_FIELDS = [
  "section",
  "hub",
  "slug",
  "path",
  "file",
  "sample",
  "draft",
  "public",
  "title",
  "description",
  "category",
  "date",
  "updated",
  "demo",
  "readingMinutes",
];

/** An article cut down to LIST_FIELDS. */
export function articleSummary(article) {
  return Object.fromEntries(LIST_FIELDS.map((k) => [k, article[k]]));
}

export function normalizeHubs(hubs) {
  return [...(hubs ?? [])]
    .map((h) => ({
      slug: asString(h.slug),
      title: asString(h.title),
      description: asString(h.description),
      order: Number(h.order) || 0,
      // Optional, shown on the hub page only: a longer intro, a one-line
      // note (e.g. a no-affiliation disclaimer) and in-site links.
      intro: asString(h.intro) || null,
      note: asString(h.note) || null,
      links: (Array.isArray(h.links) ? h.links : [])
        .map((l) => ({
          label: asString(l?.label),
          text: asString(l?.text) || null,
          href: canonicalSitePath(asString(l?.href)),
        }))
        .filter((l) => l.label && l.href),
    }))
    .sort((a, b) => a.order - b.order);
}

/**
 * The queries over a list of articles: hubs, lists, lookups, routes and
 * lastmod. Needs only LIST_FIELDS, so the browser runs it on summaries
 * (src/content/index.js) while Node runs it on full articles
 * (buildContent()).
 */
export function createStore({ articles: all, hubs, includeDrafts = false }) {
  const hubList = normalizeHubs(hubs);
  const hubOrder = new Map(hubList.map((h) => [h.slug, h.order]));

  const visible = all.filter((a) => includeDrafts || a.public);
  const published = all.filter((a) => a.public);

  const learn = visible
    .filter((a) => a.section === "learn")
    .sort(byLearnOrder(hubOrder));
  const blog = visible.filter((a) => a.section === "blog").sort(byNewest);
  const byPath = new Map(visible.map((a) => [a.path, a]));
  const liveHubPaths = new Set(learn.map((a) => `/learn/${a.hub}`));

  /**
   * Whether an in-site Learn or Blog path leads somewhere in this build:
   * /learn, /blog, a hub with a visible guide, or a visible article. Other
   * paths are not this system's to judge and always count as live.
   */
  const isLive = (href) => {
    const path = (canonicalSitePath(href) ?? href).replace(/[?#].*$/, "");
    if (!isContentPath(path)) return true;
    return (
      path === "/learn" ||
      path === "/blog" ||
      liveHubPaths.has(path) ||
      byPath.has(path)
    );
  };

  // Routes and lastmod: published articles only, whatever the build shows.
  const pubLearn = published
    .filter((a) => a.section === "learn")
    .sort(byLearnOrder(hubOrder));
  const pubBlog = published.filter((a) => a.section === "blog").sort(byNewest);
  const lastmod = new Map();
  for (const a of published) lastmod.set(a.path, a.updated);
  const liveHubs = hubList.filter((h) =>
    pubLearn.some((a) => a.hub === h.slug),
  );
  for (const h of liveHubs)
    lastmod.set(
      `/learn/${h.slug}`,
      maxDate(pubLearn.filter((a) => a.hub === h.slug).map((a) => a.updated)),
    );
  lastmod.set("/learn", maxDate(pubLearn.map((a) => a.updated)));
  lastmod.set("/blog", maxDate(pubBlog.map((a) => a.updated)));

  const routes = [
    "/learn",
    ...liveHubs.map((h) => `/learn/${h.slug}`),
    ...pubLearn.map((a) => a.path),
    "/blog",
    ...pubBlog.map((a) => a.path),
  ];

  /** Hubs in order, each with `path`, `count` (visible articles) and `lastmod`. */
  const getLearnHubs = () =>
    hubList.map((h) => {
      const articles = learn.filter((a) => a.hub === h.slug);
      return {
        ...h,
        path: `/learn/${h.slug}`,
        count: articles.length,
        lastmod: maxDate(articles.map((a) => a.updated)),
      };
    });

  return {
    getLearnHubs,

    getHub(slug) {
      return getLearnHubs().find((h) => h.slug === slug) ?? null;
    },

    getLearnArticles({ hub } = {}) {
      return hub ? learn.filter((a) => a.hub === hub) : [...learn];
    },

    /** `getArticle("learn", "tread", "tread-depth")`, `getArticle("blog", null, slug)`. */
    getArticle(section, hub, slug) {
      const path =
        section === "learn" ? `/learn/${hub}/${slug}` : `/blog/${slug}`;
      return byPath.get(path) ?? null;
    },

    isLive,

    getArticleByPath(path) {
      return byPath.get(canonicalSitePath(path) ?? path) ?? null;
    },

    getBlogPosts({ category } = {}) {
      return category
        ? blog.filter((a) => a.category?.slug === category)
        : [...blog];
    },

    /** Categories that have at least one visible post, with counts. */
    getBlogCategories() {
      const counts = new Map();
      for (const post of blog) {
        if (!post.category) continue;
        const entry = counts.get(post.category.slug) ?? {
          ...post.category,
          count: 0,
        };
        entry.count += 1;
        counts.set(entry.slug, entry);
      }
      const order = BLOG_CATEGORIES.map((c) => c.slug);
      return [...counts.values()].sort(
        (a, b) =>
          (order.indexOf(a.slug) + 1 || 99) -
            (order.indexOf(b.slug) + 1 || 99) || a.label.localeCompare(b.label),
      );
    },

    /**
     * Every public content path: /learn, each hub with a published guide,
     * each published guide, /blog and each published post. A hub with no
     * published guide is a page with nothing on it, so it is left out.
     */
    contentRoutes() {
      return [...routes];
    },

    /** The YYYY-MM-DD a content path last changed, or null. */
    contentLastmod(path) {
      return lastmod.get(path) ?? null;
    },
  };
}
