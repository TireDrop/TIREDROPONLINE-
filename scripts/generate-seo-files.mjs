/**
 * Generates public/robots.txt and public/sitemap.xml.
 *
 * The route list is derived, never hand-typed: static routes are read out of
 * src/App.jsx (the only place the router is defined) and the two parameterised
 * routes are expanded from the catalogs that feed them. Add a <Route> and the
 * sitemap grows with it; delete one and the stale URL disappears. A hand-typed
 * sitemap drifts the first time somebody renames a page, and a sitemap full of
 * 404s is worse than no sitemap at all.
 *
 * Runs automatically on every `vite build` (wired in vite.config.js), and can
 * be run on its own:
 *
 *   node scripts/generate-seo-files.mjs
 *
 * Both outputs are written into public/ and committed, so what ships is
 * reviewable in a diff rather than appearing only inside dist/.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://tiredroponline.com";

/* ------------------------------------------------------------------ *
 * THE ONE SWITCH THAT MATTERS
 *
 * TireDrop has not launched. tiredroponline.com still resolves to the old
 * NetDriven site, so the only thing a crawler can reach today is a Vercel
 * deployment of a storefront that is still being finished: the catalog is
 * representative rather than live distributor inventory, the legal pages are
 * drafts awaiting counsel, and checkout takes an order rather than a payment.
 *
 * Letting that be indexed costs something real and buys nothing:
 *
 *  - It would be indexed under the *.vercel.app host, not the brand domain.
 *    That is a duplicate of the eventual site on a URL nobody wants ranking,
 *    and it has to be removed later rather than simply never created.
 *  - Every page canonicalises to tiredroponline.com, which currently serves a
 *    different company's site. A canonical pointing at unrelated content is a
 *    contradictory signal at exactly the moment first impressions are formed.
 *  - "TireDrop" would first enter the index as a half-finished storefront with
 *    draft terms and prices nobody has committed to. Thin and placeholder
 *    content in the index at launch is a hole you climb out of, slowly.
 *
 * Against that, the only cost of waiting is a few weeks of crawl history on a
 * domain that is not live yet. So: disallow everything until launch.
 *
 * AT LAUNCH: flip this to true, re-run the build, commit the regenerated
 * public/robots.txt, and confirm https://tiredroponline.com/robots.txt serves
 * the allowing version before submitting the sitemap in Search Console.
 * ------------------------------------------------------------------ */
const ALLOW_INDEXING = false;

/* ---------------------------- route sources ---------------------------- */

/**
 * Static routes, read from the router itself.
 * Skips the `*` catch-all and any `:param` route — those are expanded below
 * from the data that actually populates them — and any route whose element is
 * a `<Navigate>` redirect (e.g. the retired /coupons and /deals), since a
 * sitemap should list destinations, never URLs that bounce somewhere else.
 */
function staticRoutesFromRouter() {
  const src = readFileSync(resolve(ROOT, "src/App.jsx"), "utf8");
  const found = [
    ...src.matchAll(/<Route\s+[^>]*?path="([^"]+)"(?:\s+element=\{<(\w+))?/gs),
  ]
    .filter((m) => m[2] !== "Navigate")
    .map((m) => m[1]);
  const routes = found.filter((p) => p !== "*" && !p.includes(":"));
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
 * Routes that exist but should not be in the sitemap.
 *
 * /cart and /checkout are transactional: empty for every crawler, nothing to
 * rank, and submitting them invites "thin content" flags. They are not
 * disallowed in robots.txt either — a blocked URL can still be indexed by
 * reference, and there is no crawl budget problem on a 73-page site. Leaving
 * them crawlable and simply unsubmitted is the quieter option.
 */
const EXCLUDE = new Set(["/cart", "/checkout"]);

/** Priority is advisory and Google ignores it; Bing still reads it. */
function priorityFor(path) {
  if (path === "/") return "1.0";
  if (["/tires", "/wheels", "/shipping", "/install"].includes(path))
    return "0.9";
  if (path.startsWith("/tires/") || path.startsWith("/wheels/")) return "0.7";
  if (path.startsWith("/services/")) return "0.6";
  if (["/terms", "/privacy", "/accessibility", "/sitemap"].includes(path))
    return "0.3";
  return "0.8";
}

async function collectRoutes() {
  const { TIRES, WHEELS } = await import(
    resolve(ROOT, "src/data/products.js")
  ).then((m) => m);
  const { SERVICES } = await import(resolve(ROOT, "src/data/services.js"));

  const routes = [
    ...staticRoutesFromRouter(),
    ...TIRES.map((t) => `/tires/${t.slug}`),
    ...WHEELS.map((w) => `/wheels/${w.slug}`),
    ...SERVICES.map((s) => `/services/${s.slug}`),
  ];

  return [...new Set(routes)].filter((p) => !EXCLUDE.has(p)).sort();
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
      (path) =>
        `  <url>\n    <loc>${ORIGIN}${path === "/" ? "/" : path}</loc>\n` +
        `    <priority>${priorityFor(path)}</priority>\n  </url>`,
    )
    .join("\n");

  // No <lastmod>. Stamping today's build date on all 73 URLs would claim every
  // page changed every deploy, which is false; Google discounts a lastmod it
  // cannot trust, so an absent one is worth more than a fabricated one.
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<!-- Generated by scripts/generate-seo-files.mjs. Do not hand-edit. -->\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n` +
    `</urlset>\n`
  );
}

export async function generateSeoFiles({ quiet = false } = {}) {
  const routes = await collectRoutes();
  writeFileSync(resolve(ROOT, "public/robots.txt"), robotsTxt());
  writeFileSync(resolve(ROOT, "public/sitemap.xml"), sitemapXml(routes));
  if (!quiet) {
    console.log(
      `seo: sitemap.xml with ${routes.length} URLs, robots.txt ` +
        `${ALLOW_INDEXING ? "allowing" : "disallowing"} all crawlers`,
    );
  }
  return routes;
}

// Direct invocation: node scripts/generate-seo-files.mjs
if (process.argv[1] && process.argv[1].endsWith("generate-seo-files.mjs")) {
  await generateSeoFiles();
}
