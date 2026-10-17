/**
 * Fails when the committed chatbot knowledge file is stale, empty or unsafe.
 *
 *   npm run check:chat-kb
 *
 * Needs no build. The file (api/_lib/chatKnowledge.generated.json) records a
 * hash of the sources it was built from (pages, data, content, components,
 * the route list and scripts/build-chat-knowledge.mjs); a changed source
 * means "run `npm run build` and commit the file". It also fails when:
 *   - the file is missing, unparsable, over the size limit or has too few chunks;
 *   - a chunk has a bad shape (id, path, title, text), a duplicate id or an
 *     oversize text;
 *   - a chunk's path is a noindex route (cart, checkout, track, search,
 *     compare, reviews, the unapproved Spanish pages), a catalog product page
 *     or not a path;
 *   - dist/ exists and a chunk's page there says noindex.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  CHUNK_MAX,
  DIST,
  MAX_BYTES,
  OUT,
  isIndexable,
  isProductPage,
  sourceHash,
} from "./build-chat-knowledge.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MIN_CHUNKS = 200;

/** Noindex routes: EXCLUDE (sitemap) plus the Seo component's own list. */
export async function noindexPaths() {
  const { EXCLUDE } = await import(pathToFileURL(resolve(ROOT, "scripts/generate-seo-files.mjs")).href);
  const ui = readFileSync(resolve(ROOT, "src/components/ui/index.jsx"), "utf8");
  const list = /const NOINDEX_ROUTES = \[([\s\S]*?)\];/.exec(ui)?.[1] ?? "";
  const fromUi = [...list.matchAll(/"(\/[^"]*)"/g)].map((m) => m[1]);
  return new Set([...EXCLUDE, ...fromUi, "/404", "/spa", "/sitemap"]);
}

/** Problems with a parsed knowledge file; an empty list means it is sound. */
export function validate(doc, { noindex = new Set(), maxBytes = MAX_BYTES, bytes = 0, min = MIN_CHUNKS } = {}) {
  const problems = [];
  if (!doc || !Array.isArray(doc.chunks)) return ["file has no chunks array"];
  if (!doc.built || Number.isNaN(Date.parse(doc.built))) problems.push("built is not an ISO date");
  if (doc.chunks.length < min) problems.push(`only ${doc.chunks.length} chunks (expected at least ${min})`);
  if (bytes > maxBytes) problems.push(`${bytes} bytes is over the ${maxBytes} byte limit`);
  const ids = new Set();
  for (const c of doc.chunks) {
    const where = `chunk ${c?.id ?? "?"}`;
    if (!c || typeof c.id !== "string" || !c.id) problems.push(`${where}: no id`);
    else if (ids.has(c.id)) problems.push(`${where}: duplicate id`);
    else ids.add(c.id);
    if (typeof c.path !== "string" || !/^\/[^\s?#]*$/.test(c.path)) problems.push(`${where}: bad path ${JSON.stringify(c.path)}`);
    if (typeof c.title !== "string" || !c.title) problems.push(`${where}: no title`);
    if (typeof c.text !== "string" || c.text.trim().length < 20) problems.push(`${where}: text is empty or tiny`);
    else if (c.text.length > CHUNK_MAX + 400) problems.push(`${where}: text is ${c.text.length} chars`);
    if (noindex.has(c.path)) problems.push(`${where}: path ${c.path} is noindex`);
    else if (isProductPage(c.path)) problems.push(`${where}: path ${c.path} is a catalog product page`);
  }
  return problems.slice(0, 40);
}

async function main() {
  if (!existsSync(OUT)) {
    console.error("chat-kb: api/_lib/chatKnowledge.generated.json is missing. Run `npm run build`.");
    process.exit(1);
  }
  const raw = readFileSync(OUT, "utf8");
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (e) {
    console.error(`chat-kb: the knowledge file is not valid JSON: ${e.message}`);
    process.exit(1);
  }
  const problems = validate(doc, { noindex: await noindexPaths(), bytes: Buffer.byteLength(raw) });

  // The deploy runs the build, which rewrites this file from the live sources,
  // so the chatbot always ships current. A committed copy that has fallen
  // behind is only the offline fallback: say so, but do not fail on it.
  const now = await sourceHash();
  if (doc.sourceHash !== now)
    console.log(
      "chat-kb: note: the committed copy is behind the site sources. The deploy rebuilds it, so the live chatbot is current; run `npm run build` and commit it to refresh the fallback.",
    );

  // With a build on disk, also trust the page's own robots tag.
  if (existsSync(join(DIST, "index.html"))) {
    const seen = new Set();
    for (const c of doc.chunks) {
      if (seen.has(c.path)) continue;
      seen.add(c.path);
      const file = join(DIST, c.path === "/" ? "index.html" : `.${c.path}.html`);
      if (existsSync(file) && statSync(file).isFile() && !isIndexable(readFileSync(file, "utf8")))
        problems.push(`${c.path}: the built page says noindex`);
    }
  }

  if (problems.length) {
    console.error(`chat-kb FAILED:\n  - ${problems.join("\n  - ")}`);
    process.exit(1);
  }
  console.log(
    `chat-kb: ok, ${doc.chunks.length} chunks, ${(Buffer.byteLength(raw) / 1024).toFixed(0)} kB, built ${doc.built}`,
  );
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((e) => {
    console.error(`chat-kb: ${e.stack ?? e}`);
    process.exit(1);
  });
}

