/**
 * Generates public/robots.txt and public/sitemap.xml.
 *
 * The route list is derived, never hand-typed: static routes are read out of
 * src/App.jsx (the only place the router is defined) and the parameterised
 * routes are expanded from the catalogs that feed them. Add a <Route> and the
 * sitemap grows with it; delete one and the stale URL disappears. A hand-typed
 * sitemap drifts the first time somebody renames a page, and a sitemap full of
 * 404s is worse than no sitemap at all.
 *
 * Runs automatically on every `vite build` (wired in vite.config.js), and
 * again from scripts/prerender.mjs once every page has rendered. Content
 * routes (/learn, /blog) come from src/content/node.js, which parses the same
 * Markdown with the same code as the app, so they are listed either way. It
 * can also be run on its own:
 *
 *   node scripts/generate-seo-files.mjs
 *
 * Both outputs are written into public/ and committed, so what ships is
 * reviewable in a diff rather than appearing only inside dist/.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  contentLastmod,
  contentProblems,
  contentRoutes,
} from "../src/content/node.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://tiredroponline.com";

/* ------------------------------------------------------------------ *
 * THE ONE SWITCH THAT MATTERS
 *
 * true since 2026-09-29: tiredroponline.com moved to Vercel on 2026-09-28
 * (docs/ops/domain-migration-2026-09-28.md) and is the live store, so
 * robots.txt allows crawling and points at the sitemap.
 *
 * Before launch this was false, and robots.txt said `Disallow: /`: the only
 * reachable deployment was a *.vercel.app preview of a storefront still being
 * finished, and every page canonicalised to a domain that served someone
 * else's site. Set it back to false only to take the whole site out of
 * search.
 *
 * *.vercel.app deployments serve this same robots.txt, but vercel.json sends
 * `X-Robots-Tag: noindex, nofollow` on those hosts, so previews and the
 * project's own vercel.app URL stay out of the index regardless.
 * ------------------------------------------------------------------ */
const ALLOW_INDEXING = true;

/* ---------------------------- route sources ---------------------------- */

/**
 * Static routes, read from the router itself, each with the source file of
 * the page it renders (used for <lastmod>).
 * Skips the `*` catch-all and any `:param` route — those are expanded below
 * from the data that actually populates them — and any route whose element is
 * a `<Navigate>` redirect (e.g. the retired /coupons and /deals), since a
 * sitemap should list destinations, never URLs that bounce somewhere else.
 */
function parseRouter() {
  const src = readFileSync(resolve(ROOT, "src/App.jsx"), "utf8");
  const found = [
    ...src.matchAll(/<Route\s+[^>]*?path="([^"]+)"(?:\s+element=\{<(\w+))?/gs),
  ].map((m) => ({ path: m[1], element: m[2] }));

  // Component name -> page source file, from both the static import
  // (HomePage) and the lazyPage("pages/…", …) declarations.
  const files = new Map();
  for (const m of src.matchAll(/import (\w+) from "\.\/(pages\/[^"]+)"/g))
    files.set(m[1], `src/${m[2]}`);
  for (const m of src.matchAll(/const (\w+) = lazyPage\(\s*"([^"]+)"/g))
    files.set(m[1], `src/${m[2]}`);

  return { found, files };
}

function staticRoutesFromRouter() {
  const { found, files } = parseRouter();
  const routes = found
    .filter((r) => r.element !== "Navigate")
    .filter((r) => r.path !== "*" && !r.path.includes(":"))
    .map((r) => ({ path: r.path, sources: [files.get(r.element)].filter(Boolean) }));
  if (routes.length < 20) {
    throw new Error(
      `Only ${routes.length} static routes parsed out of src/App.jsx — the ` +
        `<Route> markup has probably changed shape. Fix the parser rather ` +
        `than shipping a truncated sitemap.`,
    );
  }
  return routes;
}

/**
 * Router paths whose element is a <Navigate>. They have no page of their own,
 * so vercel.json must answer them with a real redirect; scripts/prerender.mjs
 * checks that it does.
 */
export function navigateRoutes() {
  return parseRouter()
    .found.filter((r) => r.element === "Navigate")
    .map((r) => r.path);
}

/**
 * Routes that exist but should not be in the sitemap.
 *
 * /cart and /checkout are transactional: empty for every crawler, nothing to
 * rank, and submitting them invites "thin content" flags. robots.txt also
 * disallows them (and /api/), and the Seo component marks them noindex
 * (NOINDEX_ROUTES in src/components/ui/index.jsx).
 *
 * /track (Track My Order) is a lookup form with nothing to rank, and it is
 * noindex too. So is /search: a results page, different for every query.
 */
export const EXCLUDE = new Set(["/cart", "/checkout", "/track", "/search"]);

/**
 * Learn guides and blog posts, from the Markdown in src/content, parsed by the
 * same code the app uses (src/content/core.js). Drafts and `_` sample files
 * are never listed. A content file that cannot be published (no title, a bad
 * date, an unknown hub...) fails the build here rather than silently going
 * missing from the site; limit overruns (a 70-character title) only warn.
 */
function contentRoutesChecked() {
  const problems = contentProblems().filter(
    (p) => !/(^|\/)_[^/]*\.md$/.test(p.file),
  );
  for (const p of problems.filter((p) => p.level === "warn")) {
    console.warn(`content: ${p.file}: ${p.message}`);
  }
  const errors = problems.filter((p) => p.level === "error");
  if (errors.length) {
    throw new Error(
      `Content files that cannot be published:\n` +
        errors
          .map(
            (p) => `  src/content/${p.file.replace(/^\.\//, "")}: ${p.message}`,
          )
          .join("\n"),
    );
  }
  return contentRoutes();
}

/** Priority is advisory and Google ignores it; Bing still reads it. */
function priorityFor(path) {
  if (path === "/") return "1.0";
  if (["/tires", "/wheels", "/shipping", "/install"].includes(path))
    return "0.9";
  if (path.startsWith("/tires/") || path.startsWith("/wheels/")) return "0.7";
  if (path.startsWith("/services/")) return "0.6";
  if (path.startsWith("/mobile-service/")) return "0.7";
  if (/^\/(learn|blog)\/.+/.test(path)) return "0.6";
  if (["/terms", "/privacy", "/accessibility", "/sitemap"].includes(path))
    return "0.3";
  return "0.8";
}

/**
 * Exact paths vercel.json redirects. Vercel answers them before it looks for
 * a file, so they are never pages: not prerendered, not in the sitemap, even
 * if a <Route> or a content source still lists them.
 */
function redirectedPaths() {
  try {
    const vercel = JSON.parse(readFileSync(resolve(ROOT, "vercel.json"), "utf8"));
    return new Set(
      (vercel.redirects ?? [])
        .map((r) => r.source)
        .filter((src) => !/[:(*]/.test(src)),
    );
  } catch {
    return new Set();
  }
}

/**
 * Every page route the site serves, indexable or not, as
 * `{ path, sources, lastmod }`. This is the prerender list: the router's
 * static pages, one page per catalog product and service, one per
 * mobile city page (src/data/cityPages.js) and one per live state page
 * (STATE_PAGES_LIVE in src/data/stateList.js).
 *
 * `extra` adds routes this script cannot find on its own, as `{ path,
 * lastmod }`. scripts/prerender.mjs passes the content routes (/learn,
 * /blog) as the built app sees them (src/content/index.js, read from the
 * server bundle; see src/entry-server.jsx). The same routes are also read
 * here in plain Node through src/content/node.js, which checks every
 * content file and fails on one that cannot be published; the two lists
 * come from the same parser, so they agree.
 */
export async function allRoutes({ extra = [] } = {}) {
  const { TIRES, WHEELS } = await import(resolve(ROOT, "src/data/products.js"));
  const { SERVICES } = await import(resolve(ROOT, "src/data/services.js"));
  const { CITY_PAGES } = await import(resolve(ROOT, "src/data/cityPages.js"));
  const { STATE_PAGES_LIVE } = await import(resolve(ROOT, "src/data/stateList.js"));
  const { files } = parseRouter();
  const productFiles = [files.get("ProductPage"), "src/data/products.js"];
  const serviceFiles = [files.get("ServiceDetailPage"), "src/data/services.js"];
  const cityFiles = [files.get("MobileCityPage"), "src/data/cityPages.js"];
  const stateFiles = [files.get("StateShippingPage"), "src/data/statePages.js"];

  // Content routes first: where a path is also a router route (/learn,
  // /blog), the first entry wins, and its lastmod should be the content's
  // (the newest article), not the index page component's git date.
  const routes = [
    ...extra.map((r) => ({ path: r.path, sources: [], lastmod: r.lastmod ?? null })),
    ...contentRoutesChecked().map((path) => ({
      path,
      sources: [],
      lastmod: contentLastmod(path),
    })),
    ...staticRoutesFromRouter(),
    ...TIRES.map((t) => ({ path: `/tires/${t.slug}`, sources: productFiles })),
    ...WHEELS.map((w) => ({ path: `/wheels/${w.slug}`, sources: productFiles })),
    ...SERVICES.map((s) => ({ path: `/services/${s.slug}`, sources: serviceFiles })),
    ...CITY_PAGES.map((c) => ({ path: `/mobile-service/${c.slug}`, sources: cityFiles })),
    // Only the routed state pages: every other state stays unlisted.
    ...STATE_PAGES_LIVE.map((slug) => ({ path: `/tires-shipped/${slug}`, sources: stateFiles })),
  ];

  const redirected = redirectedPaths();
  const byPath = new Map();
  for (const r of routes)
    if (!byPath.has(r.path) && !redirected.has(r.path)) byPath.set(r.path, r);
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
}

/** The indexable routes: what goes in the sitemap. */
async function collectRoutes(extra) {
  return (await allRoutes({ extra })).filter((r) => !EXCLUDE.has(r.path));
}

/* ------------------------------ lastmod ------------------------------ */

/**
 * <lastmod> is the date a page's own source last changed in git: its page
 * component, plus the catalog file for product and service pages. Content
 * routes carry their own date instead (contentLastmod in src/content/). Never the build date: that
 * would claim every page changed on every deploy, and Google stops trusting a
 * lastmod that cries wolf.
 *
 * Shared layout (header, footer) is deliberately not counted; a footer tweak
 * is not a change to seventy pages.
 *
 * Where git cannot answer (no .git in the build container, or a shallow clone
 * whose history stops short of the file's last change) the date already in
 * the committed public/sitemap.xml is kept, so a deploy never invents or
 * drops dates that a full checkout computed.
 */
function gitDates() {
  let shallow = new Set();
  try {
    execFileSync("git", ["rev-parse", "--git-dir"], { cwd: ROOT, stdio: "pipe" });
    const shallowFile = execFileSync("git", ["rev-parse", "--git-path", "shallow"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
    const abs = resolve(ROOT, shallowFile);
    if (existsSync(abs)) shallow = new Set(readFileSync(abs, "utf8").split(/\s+/));
  } catch {
    return null; // no git here
  }
  const cache = new Map();
  return (files) => {
    const key = files.join("\0");
    if (!cache.has(key)) {
      let date = null;
      try {
        const out = execFileSync("git", ["log", "-1", "--format=%H %cs", "--", ...files], {
          cwd: ROOT,
          encoding: "utf8",
        }).trim();
        const [hash, day] = out.split(" ");
        // A shallow clone's oldest commit looks like it touched every file.
        if (hash && !shallow.has(hash)) date = day;
      } catch {
        date = null;
      }
      cache.set(key, date);
    }
    return cache.get(key);
  };
}

function committedLastmods() {
  const out = new Map();
  try {
    const xml = readFileSync(resolve(ROOT, "public/sitemap.xml"), "utf8");
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g))
      out.set(m[1], m[2]);
  } catch {
    /* first run */
  }
  return out;
}

function withLastmod(routes) {
  const fromGit = gitDates();
  const committed = committedLastmods();
  return routes.map((r) => {
    const loc = `${ORIGIN}${r.path}`;
    const lastmod =
      r.lastmod ??
      (fromGit && r.sources.length ? fromGit(r.sources) : null) ??
      committed.get(loc) ??
      null;
    return { ...r, lastmod };
  });
}

/* ------------------------------- output ------------------------------- */

function robotsTxt() {
  const header = [
    "# Generated by scripts/generate-seo-files.mjs on every build.",
    "# Do not hand-edit — change ALLOW_INDEXING in that script instead.",
    "",
  ];

  if (!ALLOW_INDEXING) {
    return [
      ...header,
      "# TireDrop has not launched. tiredroponline.com still points at the",
      "# previous site, so the only reachable deployment is a preview of a",
      "# storefront that is still being finished. Indexing it now would put a",
      "# half-built store and draft legal pages into the index under this",
      "# brand, on a hostname nobody wants ranking.",
      "#",
      "# LAUNCH STEP: set ALLOW_INDEXING = true in",
      "# scripts/generate-seo-files.mjs, rebuild, commit, and verify",
      "# https://tiredroponline.com/robots.txt before submitting the sitemap.",
      "",
      "User-agent: *",
      "Disallow: /",
      "",
      `# Kept here so it is ready the moment the line above becomes "Allow: /".`,
      `Sitemap: ${ORIGIN}/sitemap.xml`,
      "",
    ].join("\n");
  }

  return [
    ...header,
    "User-agent: *",
    "Allow: /",
    "",
    "# Transactional pages. Nothing to rank and nothing a crawler can see.",
    "Disallow: /checkout",
    "Disallow: /cart",
    "",
    "# The site's own JSON API (Vercel functions), not pages.",
    "Disallow: /api/",
    "",
    "# Filter and view states of pages that are already listed on their own.",
    "Disallow: /*?search=",
    "Disallow: /*?view=",
    "",
    `Sitemap: ${ORIGIN}/sitemap.xml`,
    "",
  ].join("\n");
}

function sitemapXml(routes) {
  const urls = routes
    .map(
      ({ path, lastmod }) =>
        `  <url>\n    <loc>${ORIGIN}${path}</loc>\n` +
        (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : "") +
        `    <priority>${priorityFor(path)}</priority>\n  </url>`,
    )
    .join("\n");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<!-- Generated by scripts/generate-seo-files.mjs. Do not hand-edit. -->\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n` +
    `</urlset>\n`
  );
}

export async function generateSeoFiles({ quiet = false, extraRoutes = [] } = {}) {
  const routes = withLastmod(await collectRoutes(extraRoutes));
  writeFileSync(resolve(ROOT, "public/robots.txt"), robotsTxt());
  writeFileSync(resolve(ROOT, "public/sitemap.xml"), sitemapXml(routes));
  if (!quiet) {
    const dated = routes.filter((r) => r.lastmod).length;
    console.log(
      `seo: sitemap.xml with ${routes.length} URLs (${dated} with lastmod), ` +
        `robots.txt ${ALLOW_INDEXING ? "allowing" : "disallowing"} all crawlers`,
    );
  }
  return routes.map((r) => r.path);
}

// Direct invocation: node scripts/generate-seo-files.mjs
if (process.argv[1] && process.argv[1].endsWith("generate-seo-files.mjs")) {
  await generateSeoFiles();
}
