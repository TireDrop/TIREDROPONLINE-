/**
 * Builds the site chatbot's knowledge file: api/_lib/chatKnowledge.generated.json
 *
 *   { "built": ISO, "sourceHash": "...", "chunks": [{ id, path, title, text }] }
 *
 * Everything a visitor can read on the site goes in, so the bot can answer
 * from the site's own words and cite the page:
 *   - every prerendered, indexable page in dist/ (pages, services, mobile
 *     city pages, state shipping pages, tools, Learn, blog, terms, privacy,
 *     FAQs...), cut down to its <main> content with markup, scripts, forms and
 *     buttons removed. The header, footer and nav sit outside <main>, so they
 *     are not repeated 200 times;
 *   - facts from the data files that the footer/header carry rather than the
 *     page body: business.js (phone, address, hours, email), the service
 *     price list (services.js), the service area (serviceArea.js) and the
 *     page directory (src/lib/sitePages.js).
 *
 * Left out on purpose:
 *   - noindex pages (cart, checkout, track, search, compare, reviews, the
 *     unapproved Spanish test pages), the 404 and the app shell;
 *   - one page per catalog product (/tires/<slug>, /wheels/<slug>): prices
 *     and stock come from the live catalog lookup, never from a snapshot;
 *   - text that repeats on many pages (shared FAQ blocks, trust strips): kept
 *     once, on the shortest path that has it.
 *
 * Runs after the prerender in `npm run build`, so it reads dist/ as the
 * prerender left it. `npm run check:chat-kb` (scripts/chat-kb-check.mjs)
 * fails when the committed file no longer matches the content it is built
 * from. The file is committed, like src/data/deliveryHubs.generated.json.
 *
 *   node scripts/build-chat-knowledge.mjs          write the file
 *   node scripts/build-chat-knowledge.mjs --stdout print the stats only
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const DIST = resolve(ROOT, "dist");
export const OUT = resolve(ROOT, "api/_lib/chatKnowledge.generated.json");

/** Target chunk size in characters (the contract says about 600-900). */
export const CHUNK_MIN = 380;
export const CHUNK_MAX = 900;
/** A line on at least this many pages is boilerplate: kept on one page only. */
export const BOILERPLATE_PAGES = 6;
/** Hard ceiling the check enforces on the committed file. */
export const MAX_BYTES = 1_500_000;

/* ----------------------------- HTML to text ----------------------------- */

const NAMED = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  mdash: "—", ndash: "–", hellip: "…", rsquo: "’", lsquo: "‘",
  rdquo: "”", ldquo: "“", middot: "·", times: "×", deg: "°",
  frac12: "½", copy: "©", reg: "®", trade: "™", bull: "•",
};

export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : " ";
    }
    return NAMED[e.toLowerCase()] ?? " ";
  });
}

const DROP = /<(script|style|svg|noscript|button|select|template|textarea|form|dialog|iframe|canvas|nav)\b[^>]*>[\s\S]*?<\/\1>/gi;
const BLOCK = /<\/?(address|article|aside|blockquote|body|caption|dd|details|div|dl|dt|fieldset|figcaption|figure|footer|header|hr|main|nav|ol|p|pre|section|summary|table|tbody|thead|tfoot|tr|ul)\b[^>]*>/gi;

/** The text of the first <main>…</main> in a page, or "" when there is none. */
export function mainHtml(html) {
  const start = html.search(/<main\b/i);
  if (start < 0) return "";
  const end = html.indexOf("</main>", start);
  return html.slice(start, end < 0 ? undefined : end);
}

/**
 * Plain lines from an HTML fragment. Headings come out as "\u0001text" so the
 * caller can tell them from body lines; list items start with "- ".
 */
export function htmlToLines(fragment) {
  let h = fragment.replace(/<!--[\s\S]*?-->/g, "");
  // Strip repeatedly: a dropped element can wrap another dropped element.
  for (let i = 0; i < 3; i++) h = h.replace(DROP, " ");
  h = h
    // A live demo shows default numbers that mean nothing out of context; its
    // "Text version of this demo" caption says what it does, so keep that.
    .replace(/<figure\b[^>]*data-demo[^>]*>[\s\S]*?(<figcaption)/gi, "$1")
    // Reference lists and related-article cards repeat other pages' titles.
    .replace(/<section\b[^>]*aria-labelledby="(?:sources|related)"[\s\S]*?<\/section>/gi, " ")
    .replace(/\(opens in a new tab\)/gi, "");
  h = h
    .replace(/<input\b[^>]*>/gi, " ")
    .replace(/<img\b[^>]*>/gi, " ")
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, "\n\u0001$2\n")
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<\/(td|th)>/gi, " | ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(BLOCK, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(h)
    .split("\n")
    .map((l) => l.replace(/[ \t\u00a0]+/g, " ").replace(/(\s\|)+\s*$/, "").trim())
    .filter((l) => l && l !== "-" && l !== "\u0001" && !/^[\s|·•-]+$/.test(l));
}

/* ------------------------------- chunking ------------------------------- */

/** Split one over-long line at sentence ends, never mid-word. */
function splitLong(line, max = CHUNK_MAX) {
  if (line.length <= max) return [line];
  const parts = [];
  let rest = line;
  while (rest.length > max) {
    let cut = Math.max(
      rest.lastIndexOf(". ", max),
      rest.lastIndexOf("? ", max),
      rest.lastIndexOf("! ", max),
    );
    if (cut < max * 0.4) cut = rest.lastIndexOf(" ", max);
    if (cut < 1) cut = max;
    else cut += 1;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

/**
 * Lines (headings marked \u0001) to chunks of about CHUNK_MIN-CHUNK_MAX
 * characters. Every chunk starts with the heading it sits under, so a lone
 * paragraph still says what it is about.
 */
export function chunkLines(lines, { min = CHUNK_MIN, max = CHUNK_MAX } = {}) {
  const chunks = [];
  let heading = "";
  let buf = [];
  let size = 0;
  const flush = () => {
    const body = buf.join("\n").trim();
    if (body) chunks.push(body);
    buf = [];
    size = 0;
  };
  const start = () => {
    if (heading && !buf.length) {
      buf.push(heading);
      size = heading.length;
    }
  };
  for (const raw of lines) {
    if (raw[0] === "\u0001") {
      heading = raw.slice(1).trim();
      if (size >= min) flush();
      if (heading) {
        // A heading inside a running chunk is kept as its own line.
        if (buf.length) {
          buf.push(heading);
          size += heading.length + 1;
        }
      }
      continue;
    }
    for (const line of splitLong(raw, max - (heading.length + 1))) {
      if (size && size + line.length + 1 > max) flush();
      start();
      buf.push(line);
      size += line.length + 1;
    }
  }
  flush();
  // Fold a tiny tail into the chunk before it.
  if (chunks.length > 1) {
    const last = chunks[chunks.length - 1];
    if (last.length < 120 && chunks[chunks.length - 2].length + last.length < max + 150) {
      chunks[chunks.length - 2] += "\n" + last;
      chunks.pop();
    }
  }
  return chunks;
}

/* ------------------------------ page reading ------------------------------ */

/** "/learn/x/y" for dist/learn/x/y.html; "/" for dist/index.html. */
export function pathForFile(dist, file) {
  const rel = relative(dist, file).split(sep).join("/").replace(/\.html$/, "");
  if (rel === "index") return "/";
  return `/${rel}`;
}

/** Product pages are served from the live catalog, not from this file. */
export const isProductPage = (p) => /^\/(tires|wheels)\/[^/]+$/.test(p);

/** Paths that are never knowledge, whatever their robots tag says. */
const NEVER = new Set(["/404", "/spa", "/sitemap", "/search"]);

export function pageTitle(html) {
  const m = /<title>([\s\S]*?)<\/title>/i.exec(html);
  const t = decodeEntities(m ? m[1] : "").replace(/\s+/g, " ").trim();
  return t.replace(/\s*[|–—-]\s*TireDrop\s*$/i, "").trim() || t;
}

export const isIndexable = (html) => {
  const m = /<meta\s+name="robots"\s+content="([^"]*)"/i.exec(html);
  return !!m && /^index\b/i.test(m[1]);
};

function listHtml(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "assets" || e.name === "data") continue;
      out.push(...listHtml(p));
    } else if (e.name.endsWith(".html")) out.push(p);
  }
  return out.sort();
}

export function readPages(dist = DIST) {
  if (!existsSync(join(dist, "index.html")))
    throw new Error(
      "dist/ has no prerendered pages. Run `npm run build` (the knowledge file is built after the prerender).",
    );
  const pages = [];
  for (const file of listHtml(dist)) {
    const path = pathForFile(dist, file);
    if (NEVER.has(path) || isProductPage(path)) continue;
    const html = readFileSync(file, "utf8");
    if (!isIndexable(html)) continue;
    const lines = htmlToLines(mainHtml(html));
    if (!lines.length) continue;
    pages.push({ path, title: pageTitle(html), lines });
  }
  return pages;
}

/* ------------------------------ data facts ------------------------------ */

const money = (n) => `$${n}`;

/** Facts the header/footer carry rather than the page body, as extra pages. */
export async function dataPages() {
  const imp = (p) => import(pathToFileURL(resolve(ROOT, p)).href);
  const { BUSINESS } = await imp("src/data/business.js");
  const { SERVICES } = await imp("src/data/services.js");
  const area = await imp("src/data/serviceArea.js");
  const sp = await imp("src/lib/sitePages.js");
  const { loadContent } = await imp("src/content/node.js");

  const pages = [];
  const hours = BUSINESS.hours.map((h) => `${h.days}: ${h.time}`).join("; ");
  pages.push({
    path: "/contact",
    title: "Contact and shop hours",
    lines: [
      "\u0001Business facts",
      `${BUSINESS.name} (${BUSINESS.domain}) is the online tire store of ${BUSINESS.parent}. ${BUSINESS.tagline}`,
      `Phone: ${BUSINESS.phone}. Email: ${BUSINESS.email}.`,
      `Shop: ${BUSINESS.shop.name}, ${BUSINESS.shop.full}.`,
      `Shop hours: ${hours}.`,
      `Free shipping covers ${BUSINESS.shipping.area}. Installation and mobile service are South Florida only (${area.SERVICE_AREA_LABEL}).`,
    ],
  });

  const lines = ["\u0001Auto service price list (from prices)"];
  for (const s of SERVICES) {
    const where = s.mobile ? "at the shop or by mobile van" : "at the Sunrise shop";
    const price = s.priceFrom != null ? `from ${money(s.priceFrom)} ${s.priceUnit ?? ""}`.trim() : "price on request";
    lines.push(`- ${s.name} (${where}): ${price}${s.duration ? `, about ${s.duration}` : ""}. ${s.blurb} Details: /services/${s.slug}`);
  }
  pages.push({ path: "/auto-service", title: "Auto services", lines });

  const index = sp.buildPageIndex(sp.pageIndexContent(loadContent()));
  const directory = ["\u0001Page directory: where to find things on the site"];
  for (const e of index) {
    if (!["page", "tool", "service", "topic"].includes(e.type)) continue;
    if (/^\/(cart|checkout|track|search|compare|reviews)\b/.test(e.path)) continue;
    directory.push(`- ${e.title} (${e.path}): ${e.text}`);
  }
  pages.push({ path: "/learn", title: "Learn and tools", lines: directory });
  return pages;
}

/* ------------------------------- assembly ------------------------------- */

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const slug = (p) => (p === "/" ? "home" : p.replace(/^\/|\W+$/g, "").replace(/\W+/g, "-"));

/**
 * Pages to chunks: boilerplate lines (on BOILERPLATE_PAGES+ pages) kept once,
 * on the shortest path; identical chunks kept once.
 */
export function assemble(pages) {
  const seen = new Map(); // normalized line -> Set(paths)
  for (const p of pages)
    for (const l of p.lines) {
      if (l[0] === "\u0001" || l.length < 25) continue;
      const k = norm(l);
      if (!seen.has(k)) seen.set(k, new Set());
      seen.get(k).add(p.path);
    }
  const owner = new Map();
  for (const [k, paths] of seen)
    if (paths.size >= BOILERPLATE_PAGES)
      owner.set(
        k,
        [...paths].sort((a, b) => a.length - b.length || a.localeCompare(b))[0],
      );

  const chunks = [];
  const used = new Set();
  const counts = new Map();
  // Fixed pages first so a repeated chunk is credited to the data fact.
  for (const p of pages) {
    const lines = p.lines.filter((l) => {
      if (l[0] === "\u0001" || l.length < 25) return true;
      const o = owner.get(norm(l));
      return !o || o === p.path;
    });
    for (const text of chunkLines(lines)) {
      const k = norm(text);
      if (k.length < 40 || used.has(k)) continue;
      used.add(k);
      const n = counts.get(p.path) ?? 0;
      counts.set(p.path, n + 1);
      chunks.push({ id: `${slug(p.path)}-${n}`, path: p.path, title: p.title, text });
    }
  }
  return chunks;
}

/* ----------------------------- source hash ----------------------------- */

function walk(dir, keep, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, keep, out);
    else if (keep(p)) out.push(p);
  }
  return out;
}

/**
 * A hash of everything the knowledge is built from: the page, data, content
 * and component sources, the route list and this script. It does not depend
 * on file times, so it means the same on a fresh git checkout.
 */
export async function sourceHash() {
  const keep = (p) => /\.(jsx?|mjs|json|md)$/.test(p) && !/\.test\.mjs$/.test(p);
  const files = [
    ...walk(join(ROOT, "src/pages"), keep),
    ...walk(join(ROOT, "src/data"), keep),
    ...walk(join(ROOT, "src/content"), keep),
    ...walk(join(ROOT, "src/components"), (p) => keep(p) && !p.includes(`${sep}chat${sep}`)),
    join(ROOT, "scripts/build-chat-knowledge.mjs"),
  ]
    .filter((p) => !p.endsWith("deliveryHubs.generated.json") && !p.endsWith("deliveryHubsMini.generated.json"))
    .sort();
  const h = createHash("sha256");
  for (const f of files) {
    h.update(relative(ROOT, f));
    h.update("\0");
    h.update(readFileSync(f));
    h.update("\0");
  }
  const { allRoutes } = await import(pathToFileURL(resolve(ROOT, "scripts/generate-seo-files.mjs")).href);
  const { contentRoutes } = await import(pathToFileURL(resolve(ROOT, "src/content/node.js")).href);
  h.update((await allRoutes({ extra: contentRoutes().map((path) => ({ path })) })).map((r) => r.path).join("\n"));
  return h.digest("hex").slice(0, 24);
}

/* -------------------------------- build -------------------------------- */

export async function buildKnowledge({ dist = DIST } = {}) {
  const pages = [...(await dataPages()), ...readPages(dist)];
  return { chunks: assemble(pages), pages: pages.length };
}

export function serialize(doc) {
  return `{"built":${JSON.stringify(doc.built)},"sourceHash":${JSON.stringify(doc.sourceHash)},"chunks":[\n${doc.chunks
    .map((c) => JSON.stringify(c))
    .join(",\n")}\n]}\n`;
}

async function main() {
  const { chunks, pages } = await buildKnowledge();
  const hash = await sourceHash();
  let built = new Date().toISOString();
  // Same content as the committed file: keep its timestamp so a rebuild does
  // not show up as a diff.
  if (existsSync(OUT)) {
    try {
      const prev = JSON.parse(readFileSync(OUT, "utf8"));
      if (prev.sourceHash === hash && JSON.stringify(prev.chunks) === JSON.stringify(chunks))
        built = prev.built;
    } catch {
      /* rewrite it */
    }
  }
  const body = serialize({ built, sourceHash: hash, chunks });
  const bytes = Buffer.byteLength(body);
  if (bytes > MAX_BYTES)
    throw new Error(`chat knowledge is ${bytes} bytes (limit ${MAX_BYTES}). Trim boilerplate in scripts/build-chat-knowledge.mjs.`);
  if (!process.argv.includes("--stdout")) writeFileSync(OUT, body);
  console.log(
    `chat-knowledge: ${chunks.length} chunks from ${pages} pages, ${(bytes / 1024).toFixed(0)} kB` +
      (process.argv.includes("--stdout") ? " (not written)" : ` -> ${relative(ROOT, OUT)}`),
  );
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((e) => {
    console.error(`chat-knowledge: ${e.message}`);
    process.exit(1);
  });
}
