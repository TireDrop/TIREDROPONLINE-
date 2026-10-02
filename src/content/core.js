/**
 * The content system's parser: frontmatter parsing, validation, the demo
 * marker split and Markdown rendering. The queries over the parsed articles
 * (hubs, lists, routes, lastmod) live in ./store.js.
 *
 * Nothing in here touches the file system or Vite, and none of it reaches
 * the browser: it runs in Node only.
 *   - src/content/node.js (sitemap, prerender, tests) reads every .md with
 *     fs and hands it to buildContent();
 *   - the tiredrop-content plugin in vite.config.js uses that same store to
 *     give the app article summaries and one pre-rendered chunk per article
 *     (src/content/index.js, src/content/details.js).
 * So the site and the sitemap cannot disagree about which articles exist,
 * what their paths are or when they last changed.
 *
 * The file and frontmatter contract lives in docs/prompts/blog-learn-build.md
 * and is summarised on buildContent() below.
 */
import { CORE_SCHEMA, load as loadYaml } from "js-yaml";
import { Marked } from "marked";
import {
  AUTHOR,
  BLOG_CATEGORIES,
  DEFAULT_CTA,
  LIST_FIELDS,
  asString,
  canonicalSitePath,
  createStore,
  isContentPath,
  isExternalUrl,
  normalizeHubs,
} from "./store.js";

export {
  AUTHOR,
  BLOG_CATEGORIES,
  DEFAULT_CTA,
  LIST_FIELDS,
  ORIGIN,
  articleSummary,
  canonicalSitePath,
  createStore,
  isExternalUrl,
} from "./store.js";

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;
const WORDS_PER_MINUTE = 225;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

export function slugify(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z0-9#]+;/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" };

/** Strips tags and decodes the few entities marked emits. */
export function plainText(html) {
  return String(html ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ENTITIES[e])
    .trim();
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isValidDate(text) {
  if (!DATE.test(text)) return false;
  const d = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(text);
}

/** Maps a frontmatter category to `{ slug, label }`, or null when missing. */
export function normalizeCategory(value) {
  const text = asString(value);
  if (!text) return null;
  const key = text.toLowerCase();
  const known = BLOG_CATEGORIES.find(
    (c) =>
      c.slug === key ||
      c.label.toLowerCase() === key ||
      slugify(c.label) === slugify(text) ||
      c.aliases.includes(key),
  );
  if (known) return { slug: known.slug, label: known.label };
  return { slug: slugify(text) || "other", label: text };
}

/* ------------------------------------------------------------------ *
 * Frontmatter
 * ------------------------------------------------------------------ */

const FRONTMATTER =
  /^\uFEFF?---[ \t]*\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/;

/**
 * Splits a Markdown file into its YAML frontmatter and body.
 *
 * YAML is read with the core schema, so `date: 2026-10-06` stays the string
 * "2026-10-06" rather than becoming a Date in some other time zone.
 * Throws on YAML that does not parse, or that is not a mapping.
 */
export function parseFrontmatter(raw) {
  const text = String(raw ?? "");
  const match = FRONTMATTER.exec(text);
  if (!match) return { data: {}, body: text.replace(/^\uFEFF/, "") };
  const data = match[1] ? loadYaml(match[1], { schema: CORE_SCHEMA }) : {};
  if (data != null && (typeof data !== "object" || Array.isArray(data))) {
    throw new Error("frontmatter must be a YAML mapping (key: value lines)");
  }
  return { data: data ?? {}, body: text.slice(match[0].length) };
}

/* ------------------------------------------------------------------ *
 * Demo markers
 * ------------------------------------------------------------------ */

const DEMO_LINE = /^[ \t]*\[\[demo:([a-z0-9][a-z0-9-]*)\]\][ \t]*$/i;
const FENCE = /^[ \t]{0,3}(`{3,}|~{3,})/;

/**
 * Splits a body on demo markers: a line that is exactly `[[demo:<id>]]`.
 * Returns `[{ type: "markdown", text }, { type: "demo", id }, ...]`, with
 * blank Markdown runs dropped. A marker inside a fenced code block is left as
 * code.
 */
export function splitDemoMarkers(body) {
  const segments = [];
  let buffer = [];
  let fence = null;

  const flush = () => {
    const text = buffer.join("\n");
    if (text.trim()) segments.push({ type: "markdown", text });
    buffer = [];
  };

  for (const line of String(body ?? "").split(/\r?\n/)) {
    const open = FENCE.exec(line);
    if (fence) {
      if (open && open[1][0] === fence[0] && open[1].length >= fence.length)
        fence = null;
      buffer.push(line);
      continue;
    }
    if (open) {
      fence = open[1];
      buffer.push(line);
      continue;
    }
    const demo = DEMO_LINE.exec(line);
    if (demo) {
      flush();
      segments.push({ type: "demo", id: demo[1].toLowerCase() });
    } else {
      buffer.push(line);
    }
  }
  flush();
  return segments;
}

/* ------------------------------------------------------------------ *
 * Markdown -> HTML
 * ------------------------------------------------------------------ */

// One document renders at a time (rendering is synchronous), so the renderer
// reads its per-document state from here: the heading ids already used and
// the table of contents being collected.
let doc = null;

function uniqueId(text) {
  const base = slugify(text) || "section";
  let id = base;
  let n = 2;
  while (doc.ids.has(id)) id = `${base}-${n++}`;
  doc.ids.add(id);
  return id;
}

const markdown = new Marked({
  gfm: true,
  renderer: {
    heading({ tokens, depth }) {
      const html = this.parser.parseInline(tokens);
      const text = plainText(html);
      // The H1 is the article title. A stray `#` in the body renders as an
      // H2 so a page never carries two.
      const level = Math.max(2, depth);
      const id = uniqueId(text);
      if (level === 2) doc.toc.push({ id, text });
      return `<h${level} id="${id}">${html}</h${level}>\n`;
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const titleAttr = title ? ` title="${escapeAttr(title)}"` : "";
      if (isExternalUrl(href)) {
        return `<a href="${escapeAttr(href)}"${titleAttr} target="_blank" rel="noopener">${text}<span class="sr-only"> (opens in a new tab)</span></a>`;
      }
      const internal = canonicalSitePath(href);
      // A Learn or Blog page that is not published (yet) renders as plain
      // text rather than a link to a 404.
      if (
        internal &&
        doc.isLive &&
        isContentPath(internal) &&
        !doc.isLive(internal)
      ) {
        doc.dead.push(internal);
        return text;
      }
      if (internal) {
        return `<a href="${escapeAttr(internal)}"${titleAttr} data-internal="">${text}</a>`;
      }
      return `<a href="${escapeAttr(href)}"${titleAttr}>${text}</a>`;
    },
  },
});

function renderMarkdown(text) {
  // A keyboard user can only scroll a box they can focus, and each such
  // region needs a name of its own: the table's column headings. GFM header
  // cells are all column headings, so they say so (scope="col").
  return markdown.parse(text).replace(/<table>([\s\S]*?)<\/table>/g, (_, raw) => {
    const body = raw.replace(/<th(?=[\s>])(?![^>]*\bscope=)/g, '<th scope="col"');
    const heads = [...body.matchAll(/<th(?:\s[^>]*)?>([\s\S]*?)<\/th>/g)]
      .map((m) => m[1].replace(/<[^>]+>/g, "").replace(/"/g, "&quot;").trim())
      .filter(Boolean);
    const label = heads.length ? `Table: ${heads.join(", ")}` : "Table";
    return `<div class="table-scroll" tabindex="0" role="region" aria-label="${label}"><table>${body}</table></div>`;
  });
}

/**
 * Renders an article body into `{ segments, toc, demos }`:
 *   segments  `{ type: "html", html }` and `{ type: "demo", id }` in order;
 *   toc       `{ id, text }` for every `##` heading;
 *   demos     the demo ids the body embeds;
 *   deadLinks in-site Learn/Blog paths `isLive(path)` rejected, rendered as
 *             plain text instead of links.
 * Heading ids are unique across the whole article, demo breaks included.
 */
export function renderBody(body, { isLive } = {}) {
  doc = { ids: new Set(), toc: [], dead: [], isLive };
  try {
    const segments = splitDemoMarkers(body).map((s) =>
      s.type === "demo" ? s : { type: "html", html: renderMarkdown(s.text) },
    );
    return {
      segments,
      toc: doc.toc,
      deadLinks: doc.dead,
      demos: segments.filter((s) => s.type === "demo").map((s) => s.id),
    };
  } finally {
    doc = null;
  }
}

export function readingMinutes(body) {
  const words = String(body ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[\[demo:[^\]]*\]\]/g, " ")
    .replace(/[#>*_`|[\]()-]+/g, " ")
    .split(/\s+/)
    .filter((w) => /[a-z0-9]/i.test(w)).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/* ------------------------------------------------------------------ *
 * Files -> articles
 * ------------------------------------------------------------------ */

const LEARN_FILE = /^(?:\.\/)?learn\/([^/]+)\/([^/]+)\.md$/;
const BLOG_FILE = /^(?:\.\/)?blog\/([^/]+)\.md$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Where a content file lives: `{ section, hub, slug, sample }`, or null when
 * the path is not a content file. `sample` marks a leading underscore, which
 * keeps the file out of production entirely (the URL drops the underscore).
 */
export function locateFile(key) {
  const learn = LEARN_FILE.exec(key);
  const blog = learn ? null : BLOG_FILE.exec(key);
  if (!learn && !blog) return null;
  const name = learn ? learn[2] : blog[1];
  const sample = name.startsWith("_");
  return {
    section: learn ? "learn" : "blog",
    hub: learn ? learn[1] : null,
    slug: sample ? name.slice(1) : name,
    sample,
  };
}

function stringList(value) {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.map(asString).filter(Boolean);
}

/**
 * Builds one article from a file, collecting problems rather than throwing:
 * `error` means the article cannot be published, `warn` means it breaks a
 * contract limit but still renders.
 */
function toArticle(key, raw, hubSlugs) {
  const problems = [];
  const error = (message) =>
    problems.push({ level: "error", file: key, message });
  const warn = (message) =>
    problems.push({ level: "warn", file: key, message });

  const where = locateFile(key);
  if (!where) {
    error("not a content path (learn/<hub>/<slug>.md or blog/<slug>.md)");
    return { article: null, problems };
  }
  if (!SLUG.test(where.slug))
    error(`slug "${where.slug}" must be lowercase-kebab-case`);
  if (where.hub && !hubSlugs.has(where.hub))
    error(`hub folder "${where.hub}" is not in learn/hubs.json`);

  let data;
  let body;
  try {
    ({ data, body } = parseFrontmatter(raw));
  } catch (err) {
    error(`frontmatter: ${err.message}`);
    return { article: null, problems };
  }

  const title = asString(data.title);
  const description = asString(data.description);
  if (!title) error("title is missing");
  else if (title.length > TITLE_MAX)
    warn(`title is ${title.length} characters (max ${TITLE_MAX})`);
  if (!description) error("description is missing");
  else if (description.length > DESCRIPTION_MAX)
    warn(
      `description is ${description.length} characters (max ${DESCRIPTION_MAX})`,
    );

  const date = asString(data.date);
  if (!isValidDate(date))
    error(`date "${date}" must be a real YYYY-MM-DD date`);
  let updated = asString(data.updated) || date;
  if (!isValidDate(updated)) {
    warn(`updated "${updated}" must be YYYY-MM-DD; using date`);
    updated = date;
  } else if (isValidDate(date) && updated < date) {
    warn("updated is earlier than date; using date");
    updated = date;
  }

  if (
    where.section === "learn" &&
    data.hub != null &&
    asString(data.hub) !== where.hub
  )
    warn(
      `frontmatter hub "${asString(data.hub)}" differs from its folder "${where.hub}"; the folder wins`,
    );

  const category =
    where.section === "blog" ? normalizeCategory(data.category) : null;
  if (where.section === "blog" && !category) warn("category is missing");

  const author = asString(data.author);
  if (author && author !== AUTHOR) warn(`author must be "${AUTHOR}"; using it`);

  const faq = [];
  for (const item of Array.isArray(data.faq) ? data.faq : []) {
    const q = asString(item?.q);
    const a = asString(item?.a);
    if (q && a) faq.push({ q, a });
    else warn("an faq entry is missing q or a; skipped");
  }

  const sources = [];
  for (const item of Array.isArray(data.sources) ? data.sources : []) {
    const url = asString(item?.url);
    const sourceTitle = asString(item?.title);
    if (/^https?:\/\//i.test(url) && sourceTitle)
      sources.push({
        title: sourceTitle,
        publisher: asString(item?.publisher),
        url,
      });
    else warn(`a source is missing a title or an http(s) url; skipped`);
  }

  const related = [];
  for (const href of stringList(data.related)) {
    const path = canonicalSitePath(href);
    if (path) related.push(path);
    else warn(`related "${href}" is not a site path; skipped`);
  }

  let cta = DEFAULT_CTA;
  if (data.cta && typeof data.cta === "object") {
    const label = asString(data.cta.label);
    const rawHref = asString(data.cta.href);
    const href =
      canonicalSitePath(rawHref) ?? (isExternalUrl(rawHref) ? rawHref : "");
    if (label && href) cta = { label, href };
    else warn("cta needs a label and an href; using the default");
  }

  const demo = asString(data.demo) || null;
  const path =
    where.section === "learn"
      ? `/learn/${where.hub}/${where.slug}`
      : `/blog/${where.slug}`;
  const draft = data.draft === true;

  const article = {
    section: where.section,
    hub: where.hub,
    slug: where.slug,
    path,
    file: key,
    sample: where.sample,
    draft,
    public: !draft && !where.sample,
    title,
    description,
    keyword: asString(data.keyword) || null,
    secondaryKeywords: stringList(data.secondaryKeywords),
    category,
    date,
    updated,
    demo: demo ? demo.toLowerCase() : null,
    faq,
    sources,
    related,
    cta,
    takeaways: stringList(data.takeaways),
    author: AUTHOR,
    body,
    readingMinutes: readingMinutes(body),
  };
  return { article, problems };
}

/**
 * What one article page needs on top of its summary: the rest of the
 * frontmatter (minus the raw body) and the rendered body
 * (`segments`, `toc`, `demos`). `rendered` is renderBody()'s result.
 */
export function articleDetail(article, rendered) {
  const detail = {};
  for (const [k, v] of Object.entries(article))
    if (k !== "body" && !LIST_FIELDS.includes(k)) detail[k] = v;
  return {
    ...detail,
    rendered: {
      segments: rendered.segments,
      toc: rendered.toc,
      demos: rendered.demos,
    },
  };
}

/**
 * Builds the content store.
 *
 *   files          `{ "./learn/<hub>/<slug>.md" | "./blog/<slug>.md": raw }`
 *   hubs           the parsed learn/hubs.json array
 *   includeDrafts  show `draft: true` and `_sample-*` files (dev and preview
 *                  builds only). Routes and lastmod never include them.
 *
 * Articles with an `error` problem are left out everywhere; every problem is
 * reported in `problems` for the loader to print or fail on.
 */
export function buildContent({
  files,
  hubs,
  includeDrafts = false,
  checkLinks = false,
}) {
  const hubSlugs = new Set(normalizeHubs(hubs).map((h) => h.slug));

  const problems = [];
  const all = [];
  const seen = new Map();
  for (const key of Object.keys(files ?? {}).sort()) {
    const result = toArticle(key, files[key], hubSlugs);
    problems.push(...result.problems);
    if (!result.article || result.problems.some((p) => p.level === "error"))
      continue;
    const clash = seen.get(result.article.path);
    if (clash) {
      problems.push({
        level: "error",
        file: key,
        message: `same URL as ${clash} (${result.article.path}); skipped`,
      });
      continue;
    }
    seen.set(result.article.path, key);
    all.push(result.article);
  }

  const store = createStore({ articles: all, hubs, includeDrafts });
  const { isLive } = store;

  // In Node (sitemap, tests) every published body is checked, so a link to
  // an unwritten article shows up as a build warning.
  if (checkLinks) {
    for (const a of all.filter((x) => includeDrafts || x.public)) {
      for (const dead of renderBody(a.body, { isLive }).deadLinks) {
        problems.push({
          level: "warn",
          file: a.file,
          message: `links to ${dead}, which is not published; shown as plain text`,
        });
      }
      for (const path of a.related.filter((p) => !isLive(p))) {
        problems.push({
          level: "warn",
          file: a.file,
          message: `related ${path} is not published; hidden`,
        });
      }
    }
  }

  const rendered = new Map();

  return {
    ...store,
    problems,

    /** Rendered body for an article (cached). See renderBody(). */
    renderArticle(article) {
      if (!rendered.has(article.path))
        rendered.set(article.path, renderBody(article.body, { isLive }));
      return rendered.get(article.path);
    },
  };
}
