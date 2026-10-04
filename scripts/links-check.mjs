/**
 * Internal links on the BUILT site. Reads every dist/**.html page and
 * vercel.json; no browser, no network. Only real <a href> links count: the
 * nav, the footer and the /sitemap page do, the XML sitemap does not.
 *
 * Reports:
 *   (a) orphan pages: no other page links to them;
 *   (b) blog and Learn articles that never send the reader to a shop or tool
 *       page (/tires, /wheels, /install, /schedule, a tool page or an
 *       embedded demo) from their own copy, related links or own CTA (the
 *       closing box every article shares does not count);
 *   (c) broken internal links: a path with no page, no file, no rewrite and
 *       no redirect, which Vercel answers with the 404 page.
 * Also lists, without failing: indexable pages that only the nav, footer or
 * /sitemap link to (no other page mentions them in its own content), and
 * internal links that go through a vercel.json redirect (an extra hop: link
 * the destination instead). (b) does not fail the run either.
 *
 * Exits 1 on any broken link, or on an orphan that is meant to be indexed
 * (a noindex page such as /cart may be reached only by script).
 *
 *   npm run build && npm run check:links
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { TOOL_PAGES } from "../src/components/demos/toolPages.js";
import {
  anchorHrefs,
  articleSendsOn,
  isArticleRoute,
  isNoindex,
  mainContentHtml,
  parkedLinks,
  parkedProblems,
  routeOf,
  routeOfFile,
  vercelSourceRegex,
} from "../src/lib/internalLinks.js";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const DIST = resolve(ROOT, "dist");
const t0 = performance.now();

if (!existsSync(join(DIST, "index.html"))) {
  console.error("check:links: no build in dist/. Run `npm run build` first.");
  process.exit(1);
}

// Served for unknown paths and for /tires/p/:sku, never linked as pages.
const NOT_PAGES = new Set(["404.html", "spa.html"]);
const TOOL_PATHS = [
  ...TOOL_PAGES.map((t) => t.path),
  "/tire-check",
  "/tire-size",
  "/find-my-tires",
  "/tire-size-finder",
  "/compare",
];

const vercel = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8"));
const redirects = (vercel.redirects ?? []).map((r) => ({ ...r, re: vercelSourceRegex(r.source) }));
const rewrites = (vercel.rewrites ?? []).map((r) => ({ ...r, re: vercelSourceRegex(r.source) }));

const files = readdirSync(DIST, { recursive: true })
  .map((f) => f.replace(/\\/g, "/"))
  .filter((f) => f.endsWith(".html") && !f.startsWith(".vite/"))
  .sort();

const pages = new Map(); // route -> { file, html, noindex }
for (const f of files) {
  if (NOT_PAGES.has(f)) continue;
  const html = readFileSync(join(DIST, f), "utf8");
  pages.set(routeOfFile(f), { file: `dist/${f}`, html, noindex: isNoindex(html) });
}

/** "page" | "file" | "rewrite" | "redirect" | null (a 404). */
function resolveRoute(route) {
  if (pages.has(route)) return "page";
  const file = join(DIST, route);
  if (file.startsWith(DIST) && existsSync(file) && statSync(file).isFile()) return "file";
  if (rewrites.some((r) => r.re.test(route))) return "rewrite";
  if (redirects.some((r) => r.re.test(route))) return "redirect";
  return null;
}

const inbound = new Map([...pages.keys()].map((r) => [r, new Set()]));
// Links from another page's own content (not nav, footer, breadcrumb or /sitemap).
const contentInbound = new Map([...pages.keys()].map((r) => [r, new Set()]));
for (const [from, { html }] of pages) {
  if (from === "/sitemap") continue;
  for (const route of anchorHrefs(mainContentHtml(html)).map(routeOf)) {
    if (route && route !== from && contentInbound.has(route)) contentInbound.get(route).add(from);
  }
}
const broken = []; // { from, href }
const viaRedirect = new Map(); // route -> Set(from)
// 404.html's links are still checked, since every mistyped URL shows them.
const sources = [...pages].concat(
  existsSync(join(DIST, "404.html"))
    ? [["(404 page)", { file: "dist/404.html", html: readFileSync(join(DIST, "404.html"), "utf8") }]]
    : [],
);
for (const [from, { file, html }] of sources) {
  for (const href of anchorHrefs(html)) {
    const route = routeOf(href);
    if (!route) continue;
    const kind = resolveRoute(route);
    if (!kind) broken.push({ from: file, href });
    else if (kind === "page" && route !== from) inbound.get(route).add(from);
    else if (kind === "redirect") {
      if (!viaRedirect.has(route)) viaRedirect.set(route, new Set());
      viaRedirect.get(route).add(file);
    }
  }
}

const orphans = [...inbound]
  .filter(([route, from]) => route !== "/" && from.size === 0)
  .map(([route]) => ({ route, ...pages.get(route) }));
const indexableOrphans = orphans.filter((o) => !o.noindex);

const articles = [...pages].filter(([route]) => isArticleRoute(route));
const deadEnds = articles.filter(([, { html }]) => !articleSendsOn(html, TOOL_PATHS));

const took = `${Math.round(performance.now() - t0)} ms`;
console.log(`Internal links: ${pages.size} pages, ${articles.length} articles, read in ${took}.`);

console.log(`\n(a) Orphan pages (no link from any other page): ${orphans.length} (${indexableOrphans.length} indexable)`);
for (const o of orphans) console.log(`  ${o.route}${o.noindex ? "  (noindex)" : ""}`);

console.log(`\n(b) Articles with no link to a shop or tool page: ${deadEnds.length} of ${articles.length}`);
for (const [route] of deadEnds) console.log(`  ${route}`);

// One line per bad href: a broken footer link would otherwise print once per page.
const brokenBy = new Map();
for (const { from, href } of broken) brokenBy.set(href, [...(brokenBy.get(href) ?? []), from]);
console.log(`\n(c) Broken internal links: ${broken.length} (${brokenBy.size} distinct)`);
for (const [href, from] of brokenBy) {
  console.log(`  ${href}  (${from.length} page${from.length === 1 ? "" : "s"}: ${from.slice(0, 3).join(", ")}${from.length > 3 ? ", ..." : ""})`);
}

const navOnly = [...contentInbound]
  .filter(([route, from]) => route !== "/" && from.size === 0 && !pages.get(route).noindex)
  .map(([route]) => route)
  .filter((route) => inbound.get(route).size > 0);
console.log(`\nIndexable pages linked only from the nav, footer or /sitemap (not failing): ${navOnly.length}`);
for (const route of navOnly) console.log(`  ${route}`);

console.log(`\nLinks through a redirect (not failing; link the destination): ${viaRedirect.size}`);
for (const [route, from] of viaRedirect) {
  const to = redirects.find((r) => r.re.test(route)).destination;
  console.log(`  ${route} -> ${to}  (${from.size} page${from.size === 1 ? "" : "s"}, e.g. ${[...from][0]})`);
}

// Parked routes (the Gallery until there are photos): no page links to one,
// none is built or in sitemap.xml, and vercel.json 302s each to its stand-in.
const parkedHits = [];
for (const [, { file, html }] of sources) {
  for (const route of parkedLinks(anchorHrefs(html))) parkedHits.push(`${file} links to ${route}`);
}
const parkedIssues = parkedProblems({
  redirects: vercel.redirects ?? [],
  sitemapXml: existsSync(join(DIST, "sitemap.xml")) ? readFileSync(join(DIST, "sitemap.xml"), "utf8") : "",
  builtRoutes: [...pages.keys()],
});
console.log(`\nParked routes (must not be linked, built or in the sitemap): ${parkedHits.length + parkedIssues.length} problem(s)`);
for (const p of [...parkedHits, ...parkedIssues]) console.log(`  ${p}`);

const problems = [];
if (parkedHits.length || parkedIssues.length) problems.push(`${parkedHits.length + parkedIssues.length} parked-route problem(s)`);
if (broken.length) problems.push(`${broken.length} broken internal link(s)`);
if (indexableOrphans.length) problems.push(`${indexableOrphans.length} indexable orphan page(s)`);
if (problems.length) {
  console.error(`\ncheck:links: FAILED, ${problems.join(" and ")}.`);
  process.exit(1);
}
console.log(
  `\ncheck:links: PASS, no broken links and no indexable orphans${deadEnds.length ? ` (${deadEnds.length} article(s) still to link on)` : ""}.`,
);
