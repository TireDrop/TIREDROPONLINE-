/**
 * The sources rule on the BUILT site: "no other meta tags or links to other
 * competitors, only resources." Reads every dist/**.html page plus
 * dist/sitemap.xml and dist/robots.txt. No browser, no network.
 *
 * Fails (exit 1), listing file + offending value, when a page:
 *   1. links or loads a competitor domain or any subdomain of one (any
 *      href/src/srcset/action, or a competitor URL anywhere in the source,
 *      inline JSON included);
 *   2. names a competitor in visible text, a <meta> content, the <title>,
 *      alt/title/aria-label text or a JSON-LD string.
 * Then REPORTS (never fails) every other external domain linked from the
 * site, with counts: "known resources" (the allowlist) and "UNREVIEWED"
 * (a warning: a human decides whether it is a resource or a competitor).
 *
 * The lists live in src/lib/competitors.js, shared with src/sourcesRule.test.mjs.
 *
 *   npm run build && npm run check:sources
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { isResourceHost, scanPage } from "../src/lib/competitors.js";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const DIST = resolve(ROOT, "dist");
const t0 = performance.now();

if (!existsSync(join(DIST, "index.html"))) {
  console.error("check:sources: no build in dist/. Run `npm run build` first.");
  process.exit(1);
}

const pages = readdirSync(DIST, { recursive: true })
  .filter((f) => f.endsWith(".html"))
  .map((f) => join(DIST, f))
  .sort();
const files = [
  ...pages.map((path) => ({ path, markup: true })),
  ...["sitemap.xml", "robots.txt"].map((f) => ({ path: join(DIST, f), markup: false })).filter((f) => existsSync(f.path)),
];

const failed = []; // [{ file, failures }]
const linkCounts = new Map(); // host -> { count, first }
for (const { path, markup } of files) {
  const file = relative(ROOT, path);
  const { failures, links } = scanPage(readFileSync(path, "utf8"), { markup });
  if (failures.length) failed.push({ file, failures });
  for (const host of links) {
    const entry = linkCounts.get(host) ?? { count: 0, first: file };
    entry.count += 1;
    linkCounts.set(host, entry);
  }
}

const byCount = ([a, x], [b, y]) => y.count - x.count || a.localeCompare(b);
const known = [...linkCounts].filter(([h]) => isResourceHost(h)).sort(byCount);
const unreviewed = [...linkCounts].filter(([h]) => !isResourceHost(h)).sort(byCount);
const pad = (n) => String(n).padStart(5);

console.log(`External domains linked from the site: ${linkCounts.size}`);
console.log(`  Known resources (${known.length}):`);
for (const [host, { count }] of known) console.log(`  ${pad(count)}  ${host}`);
console.log(`  UNREVIEWED (${unreviewed.length})${unreviewed.length ? ": not failing, but review each one" : ""}:`);
for (const [host, { count, first }] of unreviewed) {
  console.log(`  ${pad(count)}  ${host}  (e.g. ${first})`);
}
for (const [host] of unreviewed) {
  console.warn(`WARNING unreviewed domain ${host}: add it to RESOURCE_DOMAINS (a resource) or COMPETITOR_DOMAINS (a retailer) in src/lib/competitors.js`);
}

const hits = failed.reduce((n, f) => n + f.failures.length, 0);
const took = `${Math.round(performance.now() - t0)} ms`;
console.log(`\nScanned ${pages.length} pages + ${files.length - pages.length} SEO files in ${took}.`);
if (!pages.length) {
  console.error("check:sources: FAILED, no pages found in dist/.");
  process.exit(1);
}
if (failed.length) {
  console.error(`\ncheck:sources: FAILED, ${hits} competitor link(s)/mention(s) in ${failed.length} file(s). Only resources may be cited.`);
  for (const { file, failures } of failed) {
    console.error(`\n${file}`);
    for (const { kind, value } of failures) console.error(`  ${kind}  ${value}`);
  }
  process.exit(1);
}
console.log("check:sources: PASS, no competitor links or mentions.");
