// The sources rule on the SOURCE tree, so a competitor link or name fails in
// under a second without a build (`npm run test:sources`). The built site has
// its own gate, `npm run check:sources`; both share src/lib/competitors.js.
//
// Strict on purpose: comments count too, because a "source: Tire Rack" note in
// code is how a citation drifts back into copy.
//
// It lives in src/ rather than src/lib/ so `test:lib` stays green until the
// last offenders are gone; then it joins the required gates.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { findCompetitorHosts, findCompetitorNames } from "./lib/competitors.js";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const TEXT = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".json", ".md", ".mdx", ".yml", ".yaml", ".html", ".css", ".txt", ".xml", ".svg", ".webmanifest"]);
// The rule's own definition and fixtures: the only files allowed to spell the names.
const RULE_FILES = new Set(["src/lib/competitors.js", "src/lib/competitors.test.mjs", "src/sourcesRule.test.mjs"]);

function sourceFiles() {
  const files = ["index.html"];
  for (const dir of ["src", "public"]) {
    for (const f of readdirSync(join(ROOT, dir), { recursive: true })) files.push(join(dir, f));
  }
  return files.filter((f) => TEXT.has(extname(f).toLowerCase()) && !RULE_FILES.has(f.split("\\").join("/")));
}

test("no competitor domain or name anywhere in src/, public/ or index.html", () => {
  const files = sourceFiles();
  assert.ok(files.length > 100, `expected the source tree, found ${files.length} files`);
  const hits = [];
  for (const file of files) {
    readFileSync(join(ROOT, file), "utf8")
      .split("\n")
      .forEach((line, i) => {
        for (const h of findCompetitorHosts(line)) hits.push(`${file}:${i + 1}  ${h.host}`);
        for (const h of findCompetitorNames(line)) hits.push(`${file}:${i + 1}  "${h.match}"`);
      });
  }
  assert.ok(
    hits.length === 0,
    `${hits.length} competitor link(s)/mention(s). Cite a maker, regulator or trade body instead ` +
      `(rule and lists: src/lib/competitors.js):\n  ${hits.join("\n  ")}`,
  );
});
