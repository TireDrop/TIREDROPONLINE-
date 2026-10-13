import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

import {
  CHUNK_MAX,
  OUT,
  assemble,
  chunkLines,
  decodeEntities,
  htmlToLines,
  isIndexable,
  mainHtml,
  pageTitle,
  pathForFile,
} from "./build-chat-knowledge.mjs";
import { noindexPaths, validate } from "./chat-kb-check.mjs";

test("htmlToLines keeps text, marks headings, drops chrome", () => {
  const lines = htmlToLines(
    `<nav><a>Home</a></nav><h1>Free   shipping</h1><p>48 states&nbsp;+ DC</p>
     <script>alert(1)</script><svg><path d="x"/></svg><button>Buy</button>
     <ul><li>One</li><li>Two &amp; three</li></ul><form><label>Name</label></form>
     <table><tr><td>Hours</td><td>8 AM</td></tr></table>`,
  );
  assert.deepEqual(lines, ["\u0001Free shipping", "48 states + DC", "- One", "- Two & three", "Hours | 8 AM"]);
});

test("htmlToLines drops demo output but keeps the caption, and source lists", () => {
  const lines = htmlToLines(
    `<p>Intro</p><figure data-demo="x"><section><p>0.1% taller</p></section><figcaption>Text version: compares sizes</figcaption></figure>
     <section aria-labelledby="sources"><h2>Sources</h2><ol><li>Michelin</li></ol></section>`,
  );
  assert.deepEqual(lines, ["Intro", "Text version: compares sizes"]);
});

test("mainHtml, pageTitle, isIndexable, pathForFile", () => {
  const html = `<title>Shipping | TireDrop</title><meta name="robots" content="index, follow" /><body><header>x</header><main id="m"><p>Hi</p></main><footer>f</footer>`;
  assert.equal(mainHtml(html), '<main id="m"><p>Hi</p>');
  assert.equal(pageTitle(html), "Shipping");
  assert.equal(isIndexable(html), true);
  assert.equal(isIndexable(html.replace("index, follow", "noindex, follow")), false);
  assert.equal(pathForFile("/d", "/d/index.html"), "/");
  assert.equal(pathForFile("/d", "/d/learn/a/b.html"), "/learn/a/b");
});

test("decodeEntities", () => {
  assert.equal(decodeEntities("Tom &amp; Jerry&#x27;s &#8212; ok &bogus;"), "Tom & Jerry's — ok  ");
});

test("chunkLines keeps the heading, respects the size cap, folds a tiny tail", () => {
  const para = "Free shipping covers the 48 contiguous states and DC. ".repeat(40);
  const chunks = chunkLines(["\u0001Shipping", para, "short tail"]);
  assert.ok(chunks.length >= 2);
  for (const c of chunks) {
    assert.ok(c.length <= CHUNK_MAX + 150, `chunk of ${c.length}`);
    assert.ok(c.startsWith("Shipping\n"));
  }
  assert.ok(chunks.at(-1).includes("short tail"));
});

test("assemble keeps repeated boilerplate once, on the shortest path", () => {
  const shared = "This sentence is shared by every single city page on the whole site.";
  const pages = ["/a-long-path", "/b", "/c", "/d", "/e", "/f", "/g"].map((path) => ({
    path,
    title: path,
    lines: ["\u0001H", `${shared}`, `Only on ${path}: a fact that belongs to this page alone, with detail.`],
  }));
  const chunks = assemble(pages);
  assert.equal(chunks.filter((c) => c.text.includes(shared)).length, 1);
  assert.equal(chunks.find((c) => c.text.includes(shared)).path, "/b");
  assert.equal(new Set(chunks.map((c) => c.id)).size, chunks.length);
});

test("validate flags noindex, product and malformed chunks", () => {
  const good = { id: "a-0", path: "/shipping", title: "Shipping", text: "Free shipping to 48 states and DC." };
  const doc = (chunks) => ({ built: "2026-10-13T00:00:00Z", chunks });
  assert.deepEqual(validate(doc([good]), { min: 1 }), []);
  assert.match(validate(doc([{ ...good, path: "/cart" }]), { min: 1, noindex: new Set(["/cart"]) })[0], /noindex/);
  assert.match(validate(doc([{ ...good, path: "/tires/nitto-motivo-245-45r19" }]), { min: 1 })[0], /product/);
  assert.match(validate(doc([good, good]), { min: 1 })[0], /duplicate/);
  assert.match(validate(doc([]), { min: 1 })[0], /only 0 chunks/);
});

// The committed file, when present: structurally sound and nothing noindex.
// (Freshness against the sources is `npm run check:chat-kb`.)
test("the committed knowledge file is sound", { skip: !existsSync(OUT) }, async () => {
  const raw = readFileSync(OUT, "utf8");
  const problems = validate(JSON.parse(raw), { noindex: await noindexPaths(), bytes: Buffer.byteLength(raw) });
  assert.deepEqual(problems, []);
});
