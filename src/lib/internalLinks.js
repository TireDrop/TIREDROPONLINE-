/**
 * The internal-link rules behind `npm run check:links`
 * (scripts/links-check.mjs), kept pure so src/lib/internalLinks.test.mjs can
 * test them without a build: read the <a href>s out of a page, turn them
 * into site routes, match a route against vercel.json's redirects and
 * rewrites, and tell whether an article sends the reader on to a shop or
 * tool page.
 *
 * Only real <a href> links count. A path that is only in the XML sitemap or
 * in a script never helps a page out of orphanhood, because a crawler
 * following links never sees it there.
 */

const SITE_HOST = /^https?:\/\/(www\.)?tiredroponline\.com(?=[/?#]|$)/i;

const ENTITIES = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", "#39": "'", "#x27": "'" };
const decode = (s) => s.replace(/&(amp|quot|apos|lt|gt|#39|#x27);/gi, (_, e) => ENTITIES[e.toLowerCase()]);

/** Every <a href="..."> value in `html`, entity-decoded, in page order. */
export function anchorHrefs(html) {
  const out = [];
  const re = /<a\b[^>]*?\shref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let m;
  while ((m = re.exec(String(html ?? "")))) out.push(decode(m[1] ?? m[2] ?? "").trim());
  return out;
}

/**
 * The site route an href points at ("/tires", "/learn/age"), or null for
 * anything that is not a page on this site: other hosts, mailto:/tel:,
 * same-page #anchors, /api/ calls. Query and hash are dropped and a
 * trailing slash folded, since vercel.json serves one page per path.
 */
export function routeOf(href) {
  let h = String(href ?? "").trim();
  if (SITE_HOST.test(h)) h = h.replace(SITE_HOST, "") || "/";
  if (!h.startsWith("/") || h.startsWith("//")) return null;
  let path = h.replace(/[?#].*$/, "");
  try {
    path = decodeURI(path);
  } catch {
    /* a malformed escape stays as written, and will not match a page */
  }
  if (path.length > 1) path = path.replace(/\/+$/, "");
  if (!path) path = "/";
  if (path === "/api" || path.startsWith("/api/")) return null;
  return path;
}

/** "dist/learn/age.html" relative path ("learn/age.html") -> "/learn/age". */
export function routeOfFile(rel) {
  const p = String(rel).replace(/\\/g, "/").replace(/\.html$/, "");
  if (p === "index") return "/";
  return `/${p.replace(/\/index$/, "")}`;
}

/**
 * A vercel.json `source` ("/tools/:tool(a|b)", "/blogs/:path*",
 * "/cart/:path+") as a RegExp over a whole path. Covers the path-to-regexp
 * forms vercel.json uses here; an unknown form simply never matches.
 */
export function vercelSourceRegex(source) {
  let re = "";
  const s = String(source);
  for (let i = 0; i < s.length; ) {
    const param = /^\/:(\w+)(\([^)]*\))?([*+?])?/.exec(s.slice(i));
    if (param) {
      const [whole, , inner, mod] = param;
      const one = inner ? inner : "([^/]+)";
      if (mod === "*") re += `(?:/${one}(?:/[^/]+)*)?`;
      else if (mod === "+") re += `/${one}(?:/[^/]+)*`;
      else if (mod === "?") re += `(?:/${one})?`;
      else re += `/${one}`;
      i += whole.length;
      continue;
    }
    re += s[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    i += 1;
  }
  return new RegExp(`^${re}$`);
}

/** Articles: /blog/<slug> and /learn/<hub>/<slug> (hubs and indexes are not). */
export const isArticleRoute = (route) => /^\/blog\/[^/]+$|^\/learn\/[^/]+\/[^/]+$/.test(route);

/**
 * Where an article can send a reader who is ready to act: the shop, an
 * install booking, or a tool. `toolPaths` is the tool pages' paths
 * (src/components/demos/toolPages.js) plus the finder pages.
 */
export function isShopOrToolRoute(route, toolPaths = []) {
  if (/^\/(tires|wheels)(\/|$)/.test(route)) return true;
  if (route === "/tires-shipped" || route === "/install" || route === "/schedule") return true;
  return toolPaths.includes(route);
}

/**
 * The part of an article page that is the article's own: the <article>
 * minus its header (the hub eyebrow) and the closing box every article
 * shares (ContentCta: Shop tires / Book an install / Call), which links the
 * shop whatever the article says and so proves nothing about it.
 */
export function articleOwnHtml(html) {
  const m = /<article\b[^>]*>([\s\S]*)<\/article>/i.exec(String(html ?? ""));
  if (!m) return "";
  return m[1]
    .replace(/<header\b[\s\S]*?<\/header>/i, "")
    .replace(/<section\b[^>]*aria-labelledby="content-cta"[\s\S]*?<\/section>/i, "");
}

/** True when the article links a shop or tool page, or embeds a demo. */
export function articleSendsOn(html, toolPaths = []) {
  const own = articleOwnHtml(html);
  if (/\sdata-demo=/.test(own)) return true;
  return anchorHrefs(own)
    .map(routeOf)
    .some((r) => r && isShopOrToolRoute(r, toolPaths));
}

/**
 * The page's <main> minus its breadcrumb trail: the links a page gives in
 * its own content, as opposed to the header, footer and quick-action bar
 * every page repeats.
 */
export function mainContentHtml(html) {
  const m = /<main\b[^>]*>([\s\S]*)<\/main>/i.exec(String(html ?? ""));
  return m ? m[1].replace(/<nav\b[^>]*aria-label="(?:Breadcrumb|Ruta de navegación)"[\s\S]*?<\/nav>/i, "") : "";
}

/** True when the page's robots meta says noindex. */
export const isNoindex = (html) =>
  /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(String(html ?? ""));

/**
 * Routes taken off the site on purpose. No built page may link to one, none
 * may be built or listed in sitemap.xml, and vercel.json must send each to
 * its stand-in with a temporary (302) redirect so the URL stays recoverable.
 * To bring one back, delete it here (see src/_parked/gallery/README.md).
 */
export const PARKED_ROUTES = [{ route: "/gallery", to: "/about" }];

/** The parked routes that `hrefs` link to (query and hash ignored). */
export function parkedLinks(hrefs, parked = PARKED_ROUTES) {
  const routes = new Set(parked.map((p) => p.route));
  return [...new Set((hrefs ?? []).map(routeOf).filter((r) => r && routes.has(r)))];
}

/**
 * What is wrong with a parked route's setup: `redirects` is vercel.json's
 * redirect list, `sitemapXml` the text of sitemap.xml, `builtRoutes` every
 * route that has a built page. Returns a list of plain-English problems.
 */
export function parkedProblems({ redirects = [], sitemapXml = "", builtRoutes = [] }, parked = PARKED_ROUTES) {
  const problems = [];
  for (const { route, to } of parked) {
    if (builtRoutes.includes(route)) problems.push(`${route} is still built as a page`);
    if (sitemapXml.includes(`<loc>https://tiredroponline.com${route}</loc>`)) problems.push(`${route} is in sitemap.xml`);
    const r = redirects.find((x) => x.source === route);
    if (!r) problems.push(`${route} has no redirect in vercel.json`);
    else if (r.statusCode !== 302) problems.push(`${route} redirects with ${r.statusCode}, not a temporary 302`);
    else if (r.destination !== to) problems.push(`${route} redirects to ${r.destination}, expected ${to}`);
  }
  return problems;
}
