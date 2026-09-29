/**
 * The content system for Node: the sitemap generator, the prerenderer and the
 * tests. Reads the same files src/content/index.js globs, from disk, and runs
 * them through the same ./core.js, so routes and lastmod match the app.
 *
 *   import { contentRoutes, contentLastmod } from "../src/content/node.js";
 *
 * Plain JavaScript on purpose: no import.meta.glob, no JSON import attributes.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildContent } from "./core.js";

export const CONTENT_DIR = dirname(fileURLToPath(import.meta.url));

function listMarkdown(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name);
}

/**
 * `{ "./learn/<hub>/<slug>.md": raw, "./blog/<slug>.md": raw }`, the same
 * keys import.meta.glob produces in src/content/index.js.
 */
export function readContentFiles(dir = CONTENT_DIR) {
  const files = {};
  const learnDir = join(dir, "learn");
  if (existsSync(learnDir)) {
    for (const hub of readdirSync(learnDir, { withFileTypes: true })) {
      if (!hub.isDirectory()) continue;
      for (const name of listMarkdown(join(learnDir, hub.name))) {
        files[`./learn/${hub.name}/${name}`] = readFileSync(
          join(learnDir, hub.name, name),
          "utf8",
        );
      }
    }
  }
  for (const name of listMarkdown(join(dir, "blog"))) {
    files[`./blog/${name}`] = readFileSync(join(dir, "blog", name), "utf8");
  }
  return files;
}

export function readHubs(dir = CONTENT_DIR) {
  return JSON.parse(readFileSync(join(dir, "learn", "hubs.json"), "utf8"));
}

/** A fresh store read from disk. Drafts are excluded unless asked for. */
export function loadContent({ dir = CONTENT_DIR, includeDrafts = false } = {}) {
  return buildContent({
    files: readContentFiles(dir),
    hubs: readHubs(dir),
    includeDrafts,
    checkLinks: true,
  });
}

let cached = null;
const store = () => (cached ??= loadContent());

/** Every public, non-draft content path. */
export const contentRoutes = () => store().contentRoutes();

/** YYYY-MM-DD a content path last changed, or null. */
export const contentLastmod = (path) => store().contentLastmod(path);

/** Problems found in the content files (`{ level, file, message }`). */
export const contentProblems = () => store().problems;
