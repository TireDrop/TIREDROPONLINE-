/**
 * Prerenders every route to static HTML after `vite build`.
 *
 * Without this, every URL served the same index.html: the home page's title
 * and social card, no canonical, and an empty <div id="root"> until the
 * JavaScript ran. Link previews (WhatsApp, Facebook, iMessage, Slack) never
 * run it, and crawlers that do run it get to it late.
 *
 * How: Vite builds src/entry-server.jsx for Node, and each route is rendered
 * with React's server renderer inside a StaticRouter — the real app, not a
 * headless browser. Each route becomes dist/<route>.html (dist/index.html for
 * "/") holding its own <title>, description, canonical, Open Graph/Twitter
 * tags, robots and JSON-LD, and the rendered page. src/main.jsx hydrates it.
 *
 * Also writes:
 *   dist/404.html  the not-found page. Vercel serves it, with status 404, for
 *                  any path that has no file and no rewrite.
 *   dist/spa.html  the unrendered app shell, for the one family of routes that
 *                  cannot be prerendered: /tires/p/:sku, whose tires come
 *                  from the live distributor API (vercel.json rewrites to it).
 *
 * The route list is scripts/generate-seo-files.mjs's allRoutes(): the router's
 * static routes, every catalog product and service and every mobile city
 * page (src/data/cityPages.js), plus every content
 * route (/learn, /blog) that src/content/index.js lists, read from the server
 * bundle (see the hook in src/entry-server.jsx). With the content routes
 * known, the sitemap is regenerated to include them, with their lastmod.
 *
 * The build FAILS, naming the route, if any page:
 *   - throws or suspends without resolving while rendering,
 *   - renders no <h1>, or less than MIN_TEXT characters of text,
 *   - renders the 404 page (a route with no <Route> to match it),
 *   - has no Seo head, or a canonical that is not its own URL,
 *   - is meant to be indexed but says noindex,
 *   - shares its <title> with another indexable page.
 * It also fails if a <Navigate> route in App.jsx has no redirect in
 * vercel.json, since those paths no longer fall through to the app.
 *
 *   npm run build            (vite build && node scripts/prerender.mjs)
 */
import { build } from "vite";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { isSpanishPath, langFor } from "../src/data/spanishRoutes.js";
import {
  EXCLUDE,
  allRoutes,
  generateSeoFiles,
  navigateRoutes,
} from "./generate-seo-files.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = resolve(ROOT, "dist");
const SSR_OUT = resolve(ROOT, "node_modules/.cache/prerender");
const MIN_TEXT = 200;

const started = Date.now();
const fail = (msg) => {
  throw new Error(`prerender: ${msg}`);
};

/* ------------------------------ inputs ------------------------------ */

const manifestPath = resolve(DIST, ".vite/manifest.json");
if (!existsSync(manifestPath))
  fail("dist/.vite/manifest.json is missing. Run `vite build` first.");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const template = readFileSync(resolve(DIST, "index.html"), "utf8");
if (!template.includes('<div id="root"></div>'))
  fail("dist/index.html has no empty #root. Has it already been prerendered?");

// Paths the router hands to <Navigate> must be real redirects on Vercel now
// that unknown paths get a 404 instead of the app.
const vercel = JSON.parse(readFileSync(resolve(ROOT, "vercel.json"), "utf8"));
const redirected = new Set((vercel.redirects ?? []).map((r) => r.source));
const unredirected = navigateRoutes().filter((p) => !redirected.has(p));
if (unredirected.length)
  fail(
    `${unredirected.join(", ")} ${unredirected.length === 1 ? "is a" : "are"} ` +
      `<Navigate> route(s) in App.jsx with no redirect in vercel.json. Add one.`,
  );

/* ---------------------------- SSR bundle ---------------------------- */

await build({
  root: ROOT,
  logLevel: "warn",
  build: {
    ssr: "src/entry-server.jsx",
    outDir: SSR_OUT,
    emptyOutDir: true,
    manifest: false,
    copyPublicDir: false,
  },
});
const server = await import(
  pathToFileURL(resolve(SSR_OUT, "entry-server.js")).href
);
await server.preloadAll();

/* ----------------------------- helpers ----------------------------- */

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Page chunks (and their shared imports) not already loaded by the entry. */
const entryKey = Object.keys(manifest).find((k) => manifest[k].isEntry);
const entryChunks = new Set();
(function walk(key) {
  const chunk = manifest[key];
  if (!chunk || entryChunks.has(chunk.file)) return;
  entryChunks.add(chunk.file);
  (chunk.imports ?? []).forEach(walk);
})(entryKey);

function preloadsFor(pages) {
  const files = new Set();
  const css = new Set();
  const walk = (key) => {
    const chunk = manifest[key];
    if (!chunk) fail(`lazyPage key "${key}" matches no chunk in the build.`);
    if (entryChunks.has(chunk.file) || files.has(chunk.file)) return;
    files.add(chunk.file);
    (chunk.css ?? []).forEach((f) => css.add(f));
    (chunk.imports ?? []).forEach(walk);
  };
  pages.forEach((p) => walk(`src/${p}`));
  return [
    ...[...css].map((f) => `<link rel="stylesheet" crossorigin href="/${f}">`),
    ...[...files].map(
      (f) => `<link rel="modulepreload" crossorigin href="/${f}">`,
    ),
  ];
}

// The tags the Seo component owns. The template's copies are the home page's
// defaults; each page gets its own in their place.
const OWNED = [
  /<title>[\s\S]*?<\/title>\s*/,
  /<meta\s+name="description"[\s\S]*?\/>\s*/,
  /<meta\s+property="og:title"[\s\S]*?\/>\s*/,
  /<meta\s+property="og:description"[\s\S]*?\/>\s*/,
  /<meta\s+property="og:type"[\s\S]*?\/>\s*/,
  /<meta\s+property="og:url"[\s\S]*?\/>\s*/,
  /<meta\s+name="twitter:title"[\s\S]*?\/>\s*/,
  /<meta\s+name="twitter:description"[\s\S]*?\/>\s*/,
  /<!-- No canonical here on purpose\.[\s\S]*?-->\s*/,
];
let base = template;
for (const re of OWNED) {
  if (!re.test(base)) fail(`index.html no longer matches ${re}. Update OWNED.`);
  base = base.replace(re, "");
}

function headTags(head, { canonical = true } = {}) {
  const tags = [`<title>${esc(head.title)}</title>`];
  if (head.description)
    tags.push(`<meta name="description" content="${esc(head.description)}" />`);
  tags.push(`<meta name="robots" content="${esc(head.robots)}" />`);
  if (canonical) tags.push(`<link rel="canonical" href="${esc(head.url)}" />`);
  // hreflang pairs (English page and Spanish twin); none while the Spanish
  // pages are switched off.
  for (const alt of head.alternates ?? [])
    tags.push(
      `<link rel="alternate" hreflang="${esc(alt.hreflang)}" href="${esc(alt.href)}" />`,
    );
  tags.push(
    `<meta property="og:title" content="${esc(head.title)}" />`,
    `<meta property="og:type" content="${esc(head.ogType)}" />`,
  );
  if (canonical)
    tags.push(`<meta property="og:url" content="${esc(head.url)}" />`);
  if (head.description)
    tags.push(
      `<meta property="og:description" content="${esc(head.description)}" />`,
    );
  tags.push(`<meta name="twitter:title" content="${esc(head.title)}" />`);
  if (head.description)
    tags.push(
      `<meta name="twitter:description" content="${esc(head.description)}" />`,
    );
  // "<" escaped so no string in the data can close the script element.
  const json = JSON.stringify(head.jsonLd).replace(/</g, "\\u003c");
  tags.push(
    `<script type="application/ld+json" data-seo="ld">${json}</script>`,
  );
  return tags;
}

function page({ head, html, pages, route, canonical = true }) {
  const tags = [...headTags(head, { canonical }), ...preloadsFor(pages)];
  const rootAttrs = [
    route != null ? `data-route="${esc(route)}"` : "",
    pages.length ? `data-pages="${esc(pages.join(","))}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  // <html lang> follows the page: "es" on the Spanish test pages.
  const lang = head.lang ?? "en";
  if (!base.includes('<html lang="en">'))
    fail('index.html no longer opens with <html lang="en">. Update page().');
  return base
    .replace('<html lang="en">', `<html lang="${esc(lang)}">`)
    .replace("</head>", `    ${tags.join("\n    ")}\n  </head>`)
    .replace(
      '<div id="root"></div>',
      `<div id="root" ${rootAttrs}>${html}</div>`,
    );
}

function textOf(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function write(path, contents) {
  const file = resolve(DIST, path === "/" ? "index.html" : `.${path}.html`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, contents);
}

/* ------------------------------ render ------------------------------ */

const ORIGIN = "https://tiredroponline.com";
const contentRoutes = server.contentRoutes();
const routes = await allRoutes({ extra: contentRoutes });

const problems = [];
const titles = new Map();
let bytes = 0;

// The app shell first, before index.html is overwritten with the home page.
writeFileSync(
  resolve(DIST, "spa.html"),
  template.replace(
    "</head>",
    `  <meta name="robots" content="noindex, follow" />\n  </head>`,
  ),
);

for (const { path } of routes) {
  let result;
  try {
    result = await server.render(path);
  } catch (error) {
    problems.push(`${path}: render threw: ${error?.stack ?? error}`);
    continue;
  }
  const { html, head, pages } = result;
  const text = textOf(html);
  const indexable = !EXCLUDE.has(path);
  const expectedUrl = `${ORIGIN}${path}`;

  if (html.includes("<!--$!-->"))
    problems.push(`${path}: a Suspense boundary fell back to client rendering`);
  if (pages.includes("pages/NotFoundPage.jsx"))
    problems.push(`${path}: rendered the 404 page. Does App.jsx have a <Route> for it?`);
  if (!/<h1[\s>]/.test(html)) problems.push(`${path}: no <h1>`);
  if (text.length < MIN_TEXT)
    problems.push(`${path}: only ${text.length} characters of text`);
  if (!head) {
    problems.push(`${path}: no <Seo> rendered`);
    continue;
  }
  if (head.url !== expectedUrl)
    problems.push(`${path}: canonical is ${head.url}, expected ${expectedUrl}`);
  if (indexable && head.robots !== "index, follow")
    problems.push(`${path}: is in the sitemap but renders "${head.robots}"`);
  // The Spanish test pages: out of the sitemap means noindex (the guard).
  if (isSpanishPath(path) && !indexable && head.robots === "index, follow")
    problems.push(`${path}: is a Spanish page kept out of the sitemap but is indexable`);
  if (head.lang !== langFor(path))
    problems.push(`${path}: <html lang> is ${head.lang}, expected ${langFor(path)}`);
  if (indexable) {
    if (titles.has(head.title))
      problems.push(`${path}: same <title> as ${titles.get(head.title)}`);
    else titles.set(head.title, path);
  }

  const out = page({ head, html, pages, route: path });
  bytes += out.length;
  write(path, out);
}

// The 404 page: rendered at a path nothing matches. No canonical and no
// og:url (it answers for every unknown URL), and no data-route, so main.jsx
// renders it fresh instead of hydrating.
{
  const { html, head, pages } = await server.render("/__prerender-not-found__");
  if (!head || !head.robots.startsWith("noindex"))
    problems.push("404.html: the not-found page must render noindex");
  if (!/<h1[\s>]/.test(html)) problems.push("404.html: no <h1>");
  writeFileSync(
    resolve(DIST, "404.html"),
    page({ head, html, pages, route: null, canonical: false }),
  );
}

// The build manifest was only for this script; it has no business being
// served from the site.
rmSync(resolve(DIST, ".vite"), { recursive: true, force: true });

if (problems.length) {
  console.error(
    `\nprerender FAILED on ${problems.length} problem(s):\n  - ` +
      problems.join("\n  - "),
  );
  process.exit(1);
}

// The sitemap written at the start of the build could not see the content
// routes; write it again with them, into public/ (committed) and dist/. Only
// now, once every page has rendered, so a failed build leaves it untouched.
await generateSeoFiles({ extraRoutes: contentRoutes, quiet: true });
writeFileSync(
  resolve(DIST, "sitemap.xml"),
  readFileSync(resolve(ROOT, "public/sitemap.xml")),
);

console.log(
  `prerender: ${routes.length} routes (${contentRoutes.length} from content) ` +
    `+ 404.html + spa.html, ` +
    `${(bytes / 1024).toFixed(0)} kB of HTML, ` +
    `${((Date.now() - started) / 1000).toFixed(1)}s`,
);
