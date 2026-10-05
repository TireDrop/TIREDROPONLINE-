/**
 * Content loader tests: node --test "src/content/*.test.mjs"
 * (npm run test:content).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { readFileSync } from "node:fs";
import {
  AUTHOR,
  LIST_FIELDS,
  articleDetail,
  articleSummary,
  buildContent,
  createStore,
  canonicalSitePath,
  locateFile,
  normalizeCategory,
  parseFrontmatter,
  renderBody,
  splitDemoMarkers,
} from "./core.js";
import { loadContent, readContentFiles, readHubs } from "./node.js";
import { hostOf, isResourceHost } from "../lib/competitors.js";

const HUBS = [
  { slug: "tread", title: "Tread & Wear", description: "Tread.", order: 3 },
  { slug: "basics", title: "Tire Basics", description: "Basics.", order: 1 },
  { slug: "age", title: "Tire Age", description: "Age.", order: 10 },
];

function md(front, body = "Intro paragraph.\n\n## First\n\nText.\n") {
  const lines = Object.entries(front).map(
    ([k, v]) => `${k}: ${JSON.stringify(v)}`,
  );
  return `---\n${lines.join("\n")}\n---\n${body}`;
}

const base = (extra = {}) => ({
  title: "A title",
  description: "A description.",
  date: "2026-10-01",
  updated: "2026-10-03",
  author: AUTHOR,
  ...extra,
});

const FILES = {
  "./learn/tread/tread-depth.md": md(
    base({ hub: "tread", title: "Tread depth" }),
  ),
  "./learn/tread/penny-test.md": md(
    base({ hub: "tread", date: "2026-10-05", updated: "2026-10-05" }),
  ),
  "./learn/basics/tire-types.md": md(base({ hub: "basics", draft: true })),
  "./learn/age/_sample-age.md": md(base({ hub: "age" })),
  "./blog/hurricane-check.md": md(
    base({ category: "HUR", date: "2026-10-02", updated: "2026-10-09" }),
  ),
  "./blog/nitrogen-myth.md": md(
    base({ category: "myths", date: "2026-10-04", updated: "2026-10-04" }),
  ),
  "./blog/_sample-post.md": md(base({ category: "WX", draft: true })),
};

/* ---------------------------- frontmatter ---------------------------- */

test("parseFrontmatter reads YAML and keeps dates as strings", () => {
  const { data, body } = parseFrontmatter(
    "---\ntitle: Tread depth\ndate: 2026-09-29\ndraft: true\ndemo: null\nfaq:\n  - q: One?\n    a: Yes.\nsecondaryKeywords: [a, b]\n---\n\n## Hello\n",
  );
  assert.equal(data.title, "Tread depth");
  assert.equal(data.date, "2026-09-29");
  assert.equal(typeof data.date, "string");
  assert.equal(data.draft, true);
  assert.equal(data.demo, null);
  assert.deepEqual(data.faq, [{ q: "One?", a: "Yes." }]);
  assert.deepEqual(data.secondaryKeywords, ["a", "b"]);
  assert.equal(body, "\n## Hello\n");
});

test("parseFrontmatter handles CRLF, a BOM, empty and missing frontmatter", () => {
  assert.equal(
    parseFrontmatter("\uFEFF---\r\ntitle: X\r\n---\r\nBody").data.title,
    "X",
  );
  assert.equal(
    parseFrontmatter("\uFEFF---\r\ntitle: X\r\n---\r\nBody").body,
    "Body",
  );
  assert.deepEqual(parseFrontmatter("---\n---\nBody"), {
    data: {},
    body: "Body",
  });
  assert.deepEqual(parseFrontmatter("Just text"), {
    data: {},
    body: "Just text",
  });
});

test("parseFrontmatter rejects YAML that is not a mapping or does not parse", () => {
  assert.throws(() => parseFrontmatter("---\n- a\n- b\n---\nx"), /mapping/);
  assert.throws(() => parseFrontmatter("---\ntitle: [unclosed\n---\nx"));
});

test("locateFile maps paths to sections, hubs and slugs", () => {
  assert.deepEqual(locateFile("./learn/tread/tread-depth.md"), {
    section: "learn",
    hub: "tread",
    slug: "tread-depth",
    sample: false,
  });
  assert.deepEqual(locateFile("blog/_sample-post.md"), {
    section: "blog",
    hub: null,
    slug: "sample-post",
    sample: true,
  });
  assert.equal(locateFile("./learn/hubs.json"), null);
  assert.equal(locateFile("./learn/tread/deeper/x.md"), null);
});

/* ------------------------- drafts and routes ------------------------- */

test("production content leaves out drafts and _ samples", () => {
  const store = buildContent({ files: FILES, hubs: HUBS });
  assert.deepEqual(
    store.getLearnArticles().map((a) => a.path),
    ["/learn/tread/tread-depth", "/learn/tread/penny-test"],
  );
  assert.deepEqual(
    store.getBlogPosts().map((a) => a.path),
    ["/blog/nitrogen-myth", "/blog/hurricane-check"],
  );
  assert.equal(store.getArticle("learn", "basics", "tire-types"), null);
  assert.equal(store.getArticle("learn", "age", "sample-age"), null);
  assert.equal(store.getArticle("blog", null, "sample-post"), null);
  assert.deepEqual(store.problems, []);
});

test("dev and preview show drafts and samples, marked as not public", () => {
  const store = buildContent({ files: FILES, hubs: HUBS, includeDrafts: true });
  const draft = store.getArticle("learn", "basics", "tire-types");
  const sample = store.getArticle("learn", "age", "sample-age");
  assert.equal(draft.public, false);
  assert.equal(draft.draft, true);
  assert.equal(sample.public, false);
  assert.equal(sample.sample, true);
  assert.equal(store.getBlogPosts().length, 3);
  assert.equal(store.getHub("basics").count, 1);
});

test("contentRoutes lists only public paths, even when drafts show", () => {
  const expected = [
    "/learn",
    "/learn/tread",
    "/learn/tread/tread-depth",
    "/learn/tread/penny-test",
    "/blog",
    "/blog/nitrogen-myth",
    "/blog/hurricane-check",
  ];
  for (const includeDrafts of [false, true]) {
    const store = buildContent({ files: FILES, hubs: HUBS, includeDrafts });
    assert.deepEqual(store.contentRoutes(), expected);
  }
});

test("contentLastmod uses updated dates, rolled up to hubs and indexes", () => {
  const store = buildContent({ files: FILES, hubs: HUBS, includeDrafts: true });
  assert.equal(store.contentLastmod("/learn/tread/tread-depth"), "2026-10-03");
  assert.equal(store.contentLastmod("/learn/tread"), "2026-10-05");
  assert.equal(store.contentLastmod("/learn"), "2026-10-05");
  assert.equal(store.contentLastmod("/blog"), "2026-10-09");
  // Drafts never contribute, and unknown paths have no date.
  assert.equal(store.contentLastmod("/learn/basics"), null);
  assert.equal(store.contentLastmod("/tires"), null);
});

test("an article that cannot be published is skipped and reported", () => {
  const store = buildContent({
    hubs: HUBS,
    files: {
      "./learn/tread/no-title.md": md(base({ title: "" })),
      "./learn/nowhere/lost.md": md(base()),
      "./blog/bad-date.md": md(base({ date: "2026-13-40" })),
      "./blog/long.md": md(
        base({
          title: "x".repeat(61),
          description: "y".repeat(156),
          category: "WX",
        }),
      ),
      "./blog/Bad_Slug.md": md(base()),
    },
  });
  const errors = store.problems
    .filter((p) => p.level === "error")
    .map((p) => p.file);
  assert.deepEqual(errors.sort(), [
    "./blog/Bad_Slug.md",
    "./blog/bad-date.md",
    "./learn/nowhere/lost.md",
    "./learn/tread/no-title.md",
  ]);
  // Over-long title and description warn but still publish.
  assert.deepEqual(
    store.getBlogPosts().map((a) => a.slug),
    ["long"],
  );
  assert.equal(
    store.problems.filter(
      (p) => p.level === "warn" && p.file === "./blog/long.md",
    ).length,
    2,
  );
});

test("a sample and a real file with the same URL do not both publish", () => {
  const store = buildContent({
    hubs: HUBS,
    includeDrafts: true,
    files: {
      "./blog/_same.md": md(base({ category: "WX" })),
      "./blog/same.md": md(base({ category: "WX" })),
    },
  });
  assert.equal(store.getBlogPosts().length, 1);
  assert.match(store.problems[0].message, /same URL/);
});

test("frontmatter is normalized: author, cta, related, category, faq, sources", () => {
  const store = buildContent({
    hubs: HUBS,
    files: {
      "./blog/post.md": md(
        base({
          author: "Someone Else",
          category: "hur",
          related: [
            "/tools/tire-check",
            "https://tiredroponline.com/install/",
            "not-a-path",
          ],
          cta: { label: "Book", href: "/install" },
          faq: [{ q: "Q?", a: "A." }, { q: "No answer" }],
          sources: [
            {
              title: "NHTSA",
              publisher: "NHTSA",
              url: "https://www.nhtsa.gov/",
            },
            { title: "Bad", url: "ftp://x" },
          ],
          demo: "Tread-Gauge",
        }),
      ),
    },
  });
  const post = store.getArticle("blog", null, "post");
  assert.equal(post.author, AUTHOR);
  assert.deepEqual(post.category, {
    slug: "hurricane",
    label: "Hurricanes & Flooding",
  });
  assert.deepEqual(post.related, ["/tire-check", "/install"]);
  assert.deepEqual(post.cta, { label: "Book", href: "/install" });
  assert.deepEqual(post.faq, [{ q: "Q?", a: "A." }]);
  assert.equal(post.sources.length, 1);
  assert.equal(post.demo, "tread-gauge");
  assert.ok(post.readingMinutes >= 1);
});

test("normalizeCategory accepts codes, slugs and labels", () => {
  assert.equal(normalizeCategory("WX").slug, "weather");
  assert.equal(normalizeCategory("weather").slug, "weather");
  assert.equal(normalizeCategory("Myth-Busting").slug, "myths");
  assert.deepEqual(normalizeCategory("Something New"), {
    slug: "something-new",
    label: "Something New",
  });
  assert.equal(normalizeCategory(""), null);
});

test("canonicalSitePath maps plan paths to real routes", () => {
  assert.equal(
    canonicalSitePath("/tools/tire-size?size=225/65R17"),
    "/tire-size?size=225/65R17",
  );
  assert.equal(canonicalSitePath("/tire-care"), "/learn");
  assert.equal(canonicalSitePath("/learn/tread/"), "/learn/tread");
  assert.equal(canonicalSitePath("https://example.com/x"), null);
  assert.equal(canonicalSitePath("//evil.example"), null);
});

/* ---------------------------- demo markers ---------------------------- */

test("splitDemoMarkers splits on lines that are exactly a marker", () => {
  const body = [
    "Intro.",
    "",
    "[[demo:tread-gauge]]",
    "",
    "## Next",
    "  [[demo:DOT-Date-Reader]]  ",
    "Inline [[demo:size-decoder]] mention stays text.",
    "[[demo:tpms-light]] trailing text stays text too.",
  ].join("\n");
  const segments = splitDemoMarkers(body);
  assert.deepEqual(
    segments.map((s) => (s.type === "demo" ? `demo:${s.id}` : "md")),
    ["md", "demo:tread-gauge", "md", "demo:dot-date-reader", "md"],
  );
  assert.match(
    segments.at(-1).text,
    /Inline \[\[demo:size-decoder\]\] mention/,
  );
});

test("splitDemoMarkers ignores markers inside fenced code", () => {
  const body = "```md\n[[demo:tread-gauge]]\n```\n\n[[demo:utqg-explainer]]";
  const segments = splitDemoMarkers(body);
  assert.deepEqual(
    segments.map((s) => s.type),
    ["markdown", "demo"],
  );
  assert.match(segments[0].text, /\[\[demo:tread-gauge\]\]/);
  assert.equal(segments[1].id, "utqg-explainer");
});

test("splitDemoMarkers with no markers returns one Markdown segment", () => {
  assert.deepEqual(splitDemoMarkers("## A\n\nText"), [
    { type: "markdown", text: "## A\n\nText" },
  ]);
  assert.deepEqual(splitDemoMarkers("[[demo:x]]"), [{ type: "demo", id: "x" }]);
});

/* ------------------------------ rendering ------------------------------ */

test("renderBody builds a table of contents with unique ids across demos", () => {
  const out = renderBody(
    "Intro\n\n## Tread depth\n\n[[demo:tread-gauge]]\n\n## Tread depth\n\n### Detail\n\n# Stray H1\n",
  );
  assert.deepEqual(out.toc, [
    { id: "tread-depth", text: "Tread depth" },
    { id: "tread-depth-2", text: "Tread depth" },
    { id: "stray-h1", text: "Stray H1" },
  ]);
  assert.deepEqual(out.demos, ["tread-gauge"]);
  const html = out.segments
    .filter((s) => s.type === "html")
    .map((s) => s.html)
    .join("");
  assert.match(html, /<h3 id="detail">Detail<\/h3>/);
  assert.doesNotMatch(html, /<h1/);
});

test("renderBody marks internal links and opens external ones safely", () => {
  const { segments } = renderBody(
    "See [the check](/tools/tire-check), [NHTSA](https://www.nhtsa.gov/) and [us](https://tiredroponline.com/install).\n\n| a | b |\n|---|---|\n| 1 | 2 |",
  );
  const html = segments[0].html;
  assert.match(html, /<a href="\/tire-check" data-internal="">the check<\/a>/);
  assert.match(
    html,
    /<a href="https:\/\/www.nhtsa.gov\/" target="_blank" rel="noopener">NHTSA/,
  );
  assert.match(html, /<a href="\/install" data-internal="">us<\/a>/);
  assert.match(html, /<div class="table-scroll" tabindex="0" role="region" aria-label="[^"]+"><table>/);
  assert.match(html, /<thead>\s*<tr>\s*<th scope="col">a<\/th>\s*<th scope="col">b<\/th>/);
});

test("links to unpublished Learn/Blog pages render as text and warn", () => {
  const body =
    "See [depth](/learn/tread/tread-depth), [planned](/learn/tread/not-written#x), " +
    "[empty topic](/learn/age), [a draft](/learn/basics/tire-types), [blog](/blog) " +
    "and [shop](/tires).";
  const files = {
    ...FILES,
    "./blog/linker.md": md(
      base({
        category: "WX",
        related: ["/learn/tread/not-written", "/learn/age", "/tires"],
      }),
      body,
    ),
  };
  const store = buildContent({ files, hubs: HUBS, checkLinks: true });
  const post = store.getArticle("blog", null, "linker");
  const { segments, deadLinks } = store.renderArticle(post);
  const html = segments[0].html;
  assert.match(
    html,
    /<a href="\/learn\/tread\/tread-depth" data-internal="">depth<\/a>/,
  );
  assert.match(html, /, planned, empty topic, a draft, <a href="\/blog"/);
  assert.match(html, /<a href="\/tires" data-internal="">shop<\/a>/);
  assert.deepEqual(deadLinks, [
    "/learn/tread/not-written#x",
    "/learn/age",
    "/learn/basics/tire-types",
  ]);
  const warnings = store.problems
    .filter((p) => p.file === "./blog/linker.md")
    .map((p) => p.message);
  assert.equal(
    warnings.filter((m) => /not published; shown as plain text/.test(m)).length,
    3,
  );
  assert.equal(
    warnings.filter((m) => /not published; hidden/.test(m)).length,
    2,
  );
  assert.equal(store.isLive("/learn/tread"), true);
  assert.equal(store.isLive("/learn/age"), false);
  assert.equal(store.isLive("/tires"), true);

  // In dev the draft is visible, so its link works there.
  const dev = buildContent({ files, hubs: HUBS, includeDrafts: true });
  assert.ok(
    !dev
      .renderArticle(dev.getArticle("blog", null, "linker"))
      .deadLinks.includes("/learn/basics/tire-types"),
  );
});

/* ------------------------- the real content dir ------------------------- */

test("the real content directory loads through the Node loader", () => {
  const files = readContentFiles();
  const keys = Object.keys(files);
  assert.ok(keys.every((k) => /^\.\/(learn\/[^/]+|blog)\/[^/]+\.md$/.test(k)));
  const hubs = readHubs();
  assert.equal(hubs.length, 11);
  for (const hub of hubs) {
    assert.ok(
      hub.slug && hub.title && hub.description && Number.isFinite(hub.order),
    );
  }

  const prod = loadContent();
  const errors = prod.problems.filter((p) => p.level === "error");
  assert.deepEqual(errors, [], "every content file must be publishable");
  for (const path of prod.contentRoutes()) {
    assert.doesNotMatch(
      path,
      /\/sample-/,
      `sample leaked into routes: ${path}`,
    );
  }

  const dev = loadContent({ includeDrafts: true });
  assert.ok(
    dev.getArticle("learn", "tread", "sample-tread-depth"),
    "learn sample visible in dev",
  );
  assert.ok(
    dev.getArticle("blog", null, "sample-hurricane-check"),
    "blog sample visible in dev",
  );
  assert.equal(prod.getArticle("learn", "tread", "sample-tread-depth"), null);
});

/* ------------------------- hub extras + Tesla hub ------------------------- */

test("hubs carry an optional intro, note and in-site links", () => {
  const store = buildContent({
    files: FILES,
    hubs: [
      ...HUBS,
      {
        slug: "extra",
        title: "Extra",
        description: "Extra.",
        order: 11,
        intro: "Longer intro.",
        note: "A note.",
        links: [
          { label: "A post", href: "/blog/nitrogen-myth/", text: "See" },
          { label: "Off-site", href: "https://example.com/" },
          { label: "", href: "/blog" },
        ],
      },
    ],
  });
  const hub = store.getHub("extra");
  assert.equal(hub.intro, "Longer intro.");
  assert.equal(hub.note, "A note.");
  assert.deepEqual(hub.links, [
    { label: "A post", text: "See", href: "/blog/nitrogen-myth" },
  ]);
  const plain = store.getHub("tread");
  assert.equal(plain.intro, null);
  assert.equal(plain.note, null);
  assert.deepEqual(plain.links, []);
});

test("the Tesla hub: six publishable guides that follow the copy rules", () => {
  const hub = readHubs().find((h) => h.slug === "tesla");
  assert.ok(hub, "tesla hub in hubs.json");
  assert.equal(
    hub.note,
    "TireDrop and Extreme Tires are not affiliated with Tesla, Inc.",
  );
  assert.ok(
    hub.links.some((l) => l.href === "/blog/tesla-model-y-tires-guide"),
    "hub links the Model Y blog guide",
  );

  const store = loadContent({ checkLinks: true });
  const guides = store.getLearnArticles({ hub: "tesla" });
  assert.equal(guides.length, 6);
  assert.ok(store.contentRoutes().includes("/learn/tesla"));

  const BANNED = /\b(safe|safer|safely|fine|guaranteed?|OK)\b/i;
  const hubText = [hub.title, hub.description, hub.intro, hub.note].join(" ");
  assert.ok(!BANNED.test(hubText), `hub copy: ${hubText.match(BANNED)?.[0]}`);

  for (const a of guides) {
    const text = [
      a.title,
      a.description,
      a.body,
      ...a.takeaways,
      ...a.faq.flatMap((f) => [f.q, f.a]),
    ].join("\n");
    assert.ok(!BANNED.test(text), `${a.path}: "${text.match(BANNED)?.[0]}"`);
    // No discounts, prices or arrival times.
    assert.doesNotMatch(text, /\$\d|discount|coupon|% off|\bdeal\b/i, a.path);
    assert.doesNotMatch(text, /within \d+ (minutes|hours)|same[- ]day/i, a.path);
    // Never implies a Tesla affiliation.
    assert.doesNotMatch(
      text,
      /(authorized|certified|approved|official) (tesla )?(dealer|service|partner|installer)/i,
      a.path,
    );
    assert.equal(a.date, "2026-10-01", a.path);
    assert.ok(a.keyword, `${a.path}: keyword`);
    assert.ok(a.takeaways.length >= 4, `${a.path}: takeaways`);
    assert.ok(a.faq.length >= 3, `${a.path}: faq`);
    assert.ok(a.sources.length >= 4, `${a.path}: sources`);
    // CTAs: shop by vehicle, mobile install and scheduling.
    for (const href of ["/tires", "/mobile-service", "/schedule"]) {
      assert.ok(a.body.includes(`](${href})`), `${a.path}: links ${href}`);
    }
    // Related links reach the other Tesla guides and nothing unpublished.
    const others = guides.filter((g) => g.path !== a.path).map((g) => g.path);
    for (const p of others)
      assert.ok(a.related.includes(p), `${a.path}: related ${p}`);
    // The blog post owns "Tesla Model Y tires"; no guide targets it.
    assert.doesNotMatch(a.keyword, /model y/i, a.path);
    // 900 to 1,600 words of body text.
    const words = a.body
      .replace(/\[\[demo:[^\]]*\]\]/g, " ")
      .split(/\s+/)
      .filter((w) => /[a-z0-9]/i.test(w)).length;
    assert.ok(words >= 900 && words <= 1600, `${a.path}: ${words} words`);
  }
  const problems = store.problems.filter((p) =>
    p.file.includes("/learn/tesla/"),
  );
  assert.deepEqual(problems, [], "no content warnings for the Tesla guides");
});

/* ------------------------ Buying + Fitment hubs ------------------------ */

test("the Buying and Fitment hubs: eight sourced guides that follow the copy rules", () => {
  const store = loadContent({ checkLinks: true });
  const expected = {
    buying: [
      "all-season-vs-all-weather-tires",
      "all-terrain-vs-highway-tires",
      "lt-vs-p-metric",
      "xl-vs-sl-tires",
      "run-flat-tires",
      "ev-tires",
    ],
    fitment: [
      "bolt-pattern",
      "wheel-offset-backspacing",
      "staggered-tires",
      "different-tire-size",
    ],
  };
  const routes = new Set(store.contentRoutes());
  const BANNED = /\b(safe|safer|safely|fine|guaranteed?|OK)\b/i;
  // Real, non-content pages a guide may link out to.
  const SITE_PAGES = new Set([
    "/tires",
    "/wheels",
    "/install",
    "/tire-size-finder",
    "/load-speed-check",
    "/plus-size-calculator",
    "/tire-rotation-pattern",
    "/can-my-tire-be-repaired",
    "/wheel-offset-calculator",
  ]);

  for (const [hub, slugs] of Object.entries(expected)) {
    const hubEntry = readHubs().find((h) => h.slug === hub);
    assert.ok(routes.has(`/learn/${hub}`), `/learn/${hub} is published`);
    assert.ok(hubEntry.links.length >= 2, `${hub}: hub links to tools`);
    const hubText = [hubEntry.title, hubEntry.description, hubEntry.intro].join(" ");
    assert.ok(!BANNED.test(hubText), `${hub} hub copy: ${hubText.match(BANNED)?.[0]}`);

    const guides = store.getLearnArticles({ hub });
    assert.deepEqual(guides.map((g) => g.slug).sort(), [...slugs].sort());
    for (const a of guides) {
      const text = [
        a.title,
        a.description,
        a.body,
        ...a.takeaways,
        ...a.faq.flatMap((f) => [f.q, f.a]),
      ].join("\n");
      assert.ok(!BANNED.test(text), `${a.path}: "${text.match(BANNED)?.[0]}"`);
      assert.doesNotMatch(text, /\$\d|discount|coupon|% off|\bdeals?\b|\bsale\b/i, a.path);
      assert.doesNotMatch(text, /within \d+ (minutes|hours|days)|same[- ]day/i, a.path);
      assert.ok(a.keyword, `${a.path}: keyword`);
      assert.ok(a.takeaways.length >= 4, `${a.path}: takeaways`);
      assert.ok(a.faq.length >= 3, `${a.path}: faq`);
      assert.ok(a.sources.length >= 4, `${a.path}: sources`);
      // Installs are South Florida only, and every guide says so plainly.
      assert.match(a.body, /Miami-Dade, Broward and Palm Beach/, `${a.path}: install area`);
      assert.match(a.body, /48 (contiguous )?states and DC/, `${a.path}: shipping area`);
      // At least three links out to real, non-content pages.
      const out = new Set(
        [...a.body.matchAll(/\]\((\/[^)\s#?]*)/g)]
          .map((m) => m[1])
          .filter((p) => SITE_PAGES.has(p)),
      );
      assert.ok(out.size >= 3, `${a.path}: ${out.size} site-page links`);
      const words = a.body
        .replace(/\[\[demo:[^\]]*\]\]/g, " ")
        .split(/\s+/)
        .filter((w) => /[a-z0-9]/i.test(w)).length;
      assert.ok(words >= 900 && words <= 1500, `${a.path}: ${words} words`);
      // Linked in from at least one other published page.
      const inbound = store
        .getLearnArticles()
        .filter((o) => o.path !== a.path)
        .some((o) => o.body.includes(`](${a.path})`) || o.related.includes(a.path));
      assert.ok(inbound, `${a.path}: no other guide links to it`);
    }
  }
  const problems = store.problems.filter((p) =>
    /\/learn\/(buying|fitment)\//.test(p.file),
  );
  assert.deepEqual(problems, [], "no content warnings for the new guides");
});

/* ------------- Learn gap fill C: linked guides + Basics hub ------------- */

test("Learn gap fill C: eight sourced guides that follow the copy rules", () => {
  const store = loadContent({ checkLinks: true });
  const paths = [
    "/learn/damage/flat-tire-nail",
    "/learn/damage/pothole-curb-damage",
    "/learn/pressure/tpms-sensors",
    "/learn/basics/touring-vs-performance-tires",
    "/learn/basics/tire-types",
    "/learn/basics/parts-of-a-tire",
    "/learn/sidewall/speed-rating",
    "/learn/sidewall/sidewall-markings",
  ];
  const routes = new Set(store.contentRoutes());
  const BANNED = /\b(safe|safer|safely|fine|guaranteed?|OK|A[P]R)\b/i;
  const all = store.getLearnArticles();

  const basics = readHubs().find((h) => h.slug === "basics");
  assert.ok(routes.has("/learn/basics"), "/learn/basics is published");
  assert.ok(basics.links.length >= 2, "basics: hub links to tools");

  for (const p of paths) {
    const a = all.find((o) => o.path === p);
    assert.ok(a, `${p} is published`);
    const text = [
      a.title,
      a.description,
      a.body,
      ...a.takeaways,
      ...a.faq.flatMap((f) => [f.q, f.a]),
    ].join("\n");
    assert.ok(!BANNED.test(text), `${p}: "${text.match(BANNED)?.[0]}"`);
    assert.doesNotMatch(text, /\$\d|disc[o]unt|coup[o]n|reb[a]te|% off|\bdeals?\b|\bsale\b/i, p);
    assert.doesNotMatch(text, /within \d+ (minutes|hours|days)|same[- ]day/i, p);
    assert.ok(a.title.length <= 60, `${p}: title ${a.title.length}`);
    assert.ok(a.description.length <= 155, `${p}: description`);
    assert.ok(a.takeaways.length >= 4, `${p}: takeaways`);
    assert.ok(a.faq.length >= 3, `${p}: faq`);
    assert.ok(a.sources.length >= 4, `${p}: sources`);
    for (const s of a.sources) {
      assert.ok(isResourceHost(hostOf(s.url)), `${p}: source ${s.url}`);
    }
    // Installs are South Florida only; shipping is the 48 states + DC.
    assert.match(a.body, /Miami-Dade, Broward and Palm Beach/, `${p}: install area`);
    assert.match(a.body, /48 (contiguous )?states and DC/, `${p}: shipping area`);
    const words = a.body
      .replace(/\[\[demo:[^\]]*\]\]/g, " ")
      .split(/\s+/)
      .filter((w) => /[a-z0-9]/i.test(w)).length;
    assert.ok(words >= 850 && words <= 1500, `${p}: ${words} words`);
    const inbound = all
      .filter((o) => o.path !== p)
      .some((o) => o.body.includes(`](${p})`) || o.related.includes(p));
    assert.ok(inbound, `${p}: no other guide links to it`);
  }
  const problems = store.problems.filter((pr) =>
    paths.some((p) => pr.file === `.${p.replace(/^\/learn/, "/learn")}.md` || pr.message.includes(p)),
  );
  assert.deepEqual(problems, [], "no content warnings for or about the new guides");
});

/* ------------------------- blog batch 3 ------------------------- */

test("blog batch 3: ten posts follow the house rules and the post format", () => {
  const store = loadContent({ checkLinks: true });
  const slugs = [
    "worn-tires-florida-rain-4-32",
    "best-time-to-buy-tires-south-florida",
    "toyota-rav4-tires-guide",
    "used-car-after-storm-season-tires",
    "choosing-between-tire-brands",
    "toyota-camry-tires-guide",
    "ford-f-150-tires-p-vs-lt",
    "ev-tire-wear-budget",
    "rideshare-driver-tires",
    "honda-cr-v-tires-guide",
  ];
  // The [x] classes keep the house-rules grep on added lines from flagging this test itself.
  const BANNED = /\b(safe|safer|safely|fine|guaranteed?|OK|A[P]R)\b/i;
  const others = [...store.getLearnArticles(), ...store.getBlogPosts()];
  for (const slug of slugs) {
    const a = store.getArticle("blog", null, slug);
    assert.ok(a, `${slug} is published`);
    const text = [
      a.title,
      a.description,
      a.body,
      ...a.takeaways,
      ...a.faq.flatMap((f) => [f.q, f.a]),
    ].join("\n");
    assert.ok(!BANNED.test(text), `${a.path}: "${text.match(BANNED)?.[0]}"`);
    assert.doesNotMatch(text, /\$\d|disc[o]unt|coup[o]n|reb[a]te|% off|\bdeals?\b|sinc[e] (19|20)\d\d/i, a.path);
    assert.doesNotMatch(text, /within \d+ (minutes|hours|days)|same[- ]day/i, a.path);
    assert.ok(a.title.length <= 60, `${a.path}: title ${a.title.length}`);
    assert.ok(a.description.length <= 155, `${a.path}: description ${a.description.length}`);
    assert.ok(a.keyword && a.category, `${a.path}: keyword and category`);
    assert.ok(a.takeaways.length >= 3 && a.takeaways.length <= 5, `${a.path}: takeaways`);
    assert.equal(a.faq.length, 4, `${a.path}: faq`);
    // Sources: at least five, every one a known resource (no retailers).
    assert.ok(a.sources.length >= 5, `${a.path}: sources`);
    for (const s of a.sources)
      assert.ok(isResourceHost(hostOf(s.url)), `${a.path}: source ${s.url}`);
    // 5+ internal links in the body, including the shop.
    const links = new Set([...a.body.matchAll(/\]\((\/[^)\s#?]*)/g)].map((m) => m[1]));
    assert.ok(links.size >= 5, `${a.path}: ${links.size} internal links`);
    assert.ok(links.has("/tires"), `${a.path}: links /tires`);
    const words = a.body
      .replace(/\[\[demo:[^\]]*\]\]/g, " ")
      .split(/\s+/)
      .filter((w) => /[a-z0-9]/i.test(w)).length;
    assert.ok(words >= 900 && words <= 1500, `${a.path}: ${words} words`);
    // Linked in from at least one other published page.
    const inbound = others
      .filter((o) => o.path !== a.path)
      .some((o) => o.body.includes(`](${a.path})`) || o.related.includes(a.path));
    assert.ok(inbound, `${a.path}: no other page links to it`);
  }
  const problems = store.problems.filter((p) =>
    slugs.some((slug) => p.file === `./blog/${slug}.md`),
  );
  assert.deepEqual(problems, [], "no content warnings for batch 3");
});

/* ------------------------- blog batch 4 ------------------------- */

test("blog batch 4: ten posts follow the house rules and the post format", () => {
  const store = loadContent({ checkLinks: true });
  const slugs = [
    "honda-civic-tires-guide",
    "jeep-wrangler-tires-guide",
    "silverado-boat-towing-tires",
    "low-rolling-resistance-hybrids",
    "small-fleet-tire-checklist",
    "curb-pothole-tire-alignment-signs",
    "new-car-tires-wear-out-early",
    "tire-rotation-upsell-myth",
    "unused-tires-still-age-myth",
    "thanksgiving-road-trip-tire-check",
  ];
  // The [x] classes keep the house-rules grep on added lines from flagging this test itself.
  const BANNED = /\b(safe|safer|safely|fine|guaranteed?|OK|A[P]R)\b/i;
  const KNOWN_CATEGORIES = ["hurricane", "weather", "travel", "local", "buying", "myths", "vehicles", "ev-fleet"];
  const others = [...store.getLearnArticles(), ...store.getBlogPosts()];
  for (const slug of slugs) {
    const a = store.getArticle("blog", null, slug);
    assert.ok(a, `${slug} is published`);
    const text = [
      a.title,
      a.description,
      a.body,
      ...a.takeaways,
      ...a.faq.flatMap((f) => [f.q, f.a]),
    ].join("\n");
    assert.ok(!BANNED.test(text), `${a.path}: "${text.match(BANNED)?.[0]}"`);
    assert.doesNotMatch(text, /\$\d|disc[o]unt|coup[o]n|reb[a]te|% off|\bdeals?\b|\bsale\b|sinc[e] (19|20)\d\d/i, a.path);
    assert.doesNotMatch(text, /within \d+ (minutes|hours|days)|same[- ]day/i, a.path);
    assert.ok(a.title.length <= 60, `${a.path}: title ${a.title.length}`);
    assert.ok(a.description.length <= 155, `${a.path}: description ${a.description.length}`);
    assert.ok(a.keyword, `${a.path}: keyword`);
    assert.ok(KNOWN_CATEGORIES.includes(a.category?.slug), `${a.path}: category ${a.category?.slug}`);
    assert.ok(a.takeaways.length >= 3 && a.takeaways.length <= 5, `${a.path}: takeaways`);
    assert.equal(a.faq.length, 4, `${a.path}: faq`);
    // Sources: at least five, every one a known resource (no retailers).
    assert.ok(a.sources.length >= 5, `${a.path}: sources`);
    for (const s of a.sources)
      assert.ok(isResourceHost(hostOf(s.url)), `${a.path}: source ${s.url}`);
    // Shipping and install areas, stated the house way.
    assert.match(a.body, /48 contiguous states and DC/, `${a.path}: shipping area`);
    assert.match(a.body, /Miami-Dade, Broward and Palm Beach/, `${a.path}: install area`);
    // 5+ internal links in the body, including the shop.
    const links = new Set([...a.body.matchAll(/\]\((\/[^)\s#?]*)/g)].map((m) => m[1]));
    assert.ok(links.size >= 5, `${a.path}: ${links.size} internal links`);
    assert.ok(links.has("/tires"), `${a.path}: links /tires`);
    const words = a.body
      .replace(/\[\[demo:[^\]]*\]\]/g, " ")
      .split(/\s+/)
      .filter((w) => /[a-z0-9]/i.test(w)).length;
    assert.ok(words >= 900 && words <= 1500, `${a.path}: ${words} words`);
    // Linked in from at least one page that was already published.
    const inbound = others
      .filter((o) => o.path !== a.path && !slugs.includes(o.slug))
      .some((o) => o.body.includes(`](${a.path})`) || o.related.includes(a.path));
    assert.ok(inbound, `${a.path}: no existing page links to it`);
  }
  const problems = store.problems.filter((p) =>
    slugs.some((slug) => p.file === `./blog/${slug}.md`),
  );
  assert.deepEqual(problems, [], "no content warnings for batch 4");
});

/* ------------------------- blog batch 5 ------------------------- */

test("blog batch 5: ten posts follow the house rules and the post format", () => {
  const store = loadContent({ checkLinks: true });
  const slugs = [
    "florida-sun-dry-rot-tires",
    "flat-tire-on-i-95",
    "tpms-still-need-tire-gauge",
    "cold-front-tpms-light-florida",
    "moving-to-florida-tire-tips",
    "glovebox-tire-kit-florida",
    "back-to-school-car-check-broward",
    "bigger-wheels-myth",
    "turnpike-orlando-drive-tires",
    "alligator-alley-drive-tires",
  ];
  // The [x] classes keep the house-rules grep on added lines from flagging this test itself.
  const BANNED = /\b(safe|safer|safely|fine|guaranteed?|OK|A[P]R)\b/i;
  const KNOWN_CATEGORIES = ["hurricane", "weather", "travel", "local", "buying", "myths", "vehicles", "ev-fleet"];
  const others = [...store.getLearnArticles(), ...store.getBlogPosts()];
  for (const slug of slugs) {
    const a = store.getArticle("blog", null, slug);
    assert.ok(a, `${slug} is published`);
    const text = [
      a.title,
      a.description,
      a.body,
      ...a.takeaways,
      ...a.faq.flatMap((f) => [f.q, f.a]),
    ].join("\n");
    assert.ok(!BANNED.test(text), `${a.path}: "${text.match(BANNED)?.[0]}"`);
    assert.doesNotMatch(text, /\$\d|disc[o]unt|coup[o]n|reb[a]te|% off|\bdeals?\b|\bsale\b|sinc[e] (19|20)\d\d/i, a.path);
    assert.doesNotMatch(text, /within \d+ (minutes|hours|days)|same[- ]day/i, a.path);
    assert.ok(a.title.length <= 60, `${a.path}: title ${a.title.length}`);
    assert.ok(a.description.length <= 155, `${a.path}: description ${a.description.length}`);
    assert.ok(a.keyword, `${a.path}: keyword`);
    assert.ok(KNOWN_CATEGORIES.includes(a.category?.slug), `${a.path}: category ${a.category?.slug}`);
    assert.ok(a.takeaways.length >= 3 && a.takeaways.length <= 5, `${a.path}: takeaways`);
    assert.equal(a.faq.length, 4, `${a.path}: faq`);
    // Sources: at least five, every one a known resource (no retailers).
    assert.ok(a.sources.length >= 5, `${a.path}: sources`);
    for (const s of a.sources)
      assert.ok(isResourceHost(hostOf(s.url)), `${a.path}: source ${s.url}`);
    // Shipping and install areas, stated the house way.
    assert.match(a.body, /48 contiguous states and DC/, `${a.path}: shipping area`);
    assert.match(a.body, /Miami-Dade, Broward and Palm Beach/, `${a.path}: install area`);
    // 5+ internal links in the body, including the shop.
    const links = new Set([...a.body.matchAll(/\]\((\/[^)\s#?]*)/g)].map((m) => m[1]));
    assert.ok(links.size >= 5, `${a.path}: ${links.size} internal links`);
    assert.ok(links.has("/tires"), `${a.path}: links /tires`);
    const words = a.body
      .replace(/\[\[demo:[^\]]*\]\]/g, " ")
      .split(/\s+/)
      .filter((w) => /[a-z0-9]/i.test(w)).length;
    assert.ok(words >= 900 && words <= 1500, `${a.path}: ${words} words`);
    // Linked in from at least one page that was already published.
    const inbound = others
      .filter((o) => o.path !== a.path && !slugs.includes(o.slug))
      .some((o) => o.body.includes(`](${a.path})`) || o.related.includes(a.path));
    assert.ok(inbound, `${a.path}: no existing page links to it`);
  }
  const problems = store.problems.filter((p) =>
    slugs.some((slug) => p.file === `./blog/${slug}.md`),
  );
  assert.deepEqual(problems, [], "no content warnings for batch 5");
});

/* ------------------------- blog reworks -------------------------- */

test("blog reworks (#32, #42): two posts with their own keywords follow the house rules and the post format", () => {
  const store = loadContent({ checkLinks: true });
  const slugs = [
    "tire-recall-notice-what-to-do",
    "packed-car-weight-limit",
  ];
  // Each one links to the Learn guide it sits beside, and doesn't take that guide's keyword.
  const learnTwin = {
    "tire-recall-notice-what-to-do": "/learn/age/tire-recalls-registration",
    "packed-car-weight-limit": "/learn/florida/florida-heat-tires",
  };
  // The [x] classes keep the house-rules grep on added lines from flagging this test itself.
  const BANNED = /\b(safe|safer|safely|fine|guaranteed?|OK|A[P]R)\b/i;
  const KNOWN_CATEGORIES = ["hurricane", "weather", "travel", "local", "buying", "myths", "vehicles", "ev-fleet"];
  const others = [...store.getLearnArticles(), ...store.getBlogPosts()];
  for (const slug of slugs) {
    const a = store.getArticle("blog", null, slug);
    assert.ok(a, `${slug} is published`);
    const text = [
      a.title,
      a.description,
      a.body,
      ...a.takeaways,
      ...a.faq.flatMap((f) => [f.q, f.a]),
    ].join("\n");
    assert.ok(!BANNED.test(text), `${a.path}: "${text.match(BANNED)?.[0]}"`);
    assert.doesNotMatch(text, /\$\d|disc[o]unt|coup[o]n|reb[a]te|% off|\bdeals?\b|\bsale\b|sinc[e] (19|20)\d\d/i, a.path);
    assert.doesNotMatch(text, /within \d+ (minutes|hours|days)|same[- ]day/i, a.path);
    assert.ok(a.title.length <= 60, `${a.path}: title ${a.title.length}`);
    assert.ok(a.description.length <= 155, `${a.path}: description ${a.description.length}`);
    assert.ok(a.keyword, `${a.path}: keyword`);
    assert.ok(KNOWN_CATEGORIES.includes(a.category?.slug), `${a.path}: category ${a.category?.slug}`);
    assert.ok(a.takeaways.length >= 3 && a.takeaways.length <= 5, `${a.path}: takeaways`);
    assert.equal(a.faq.length, 4, `${a.path}: faq`);
    // Sources: at least five, every one a known resource (no retailers).
    assert.ok(a.sources.length >= 5, `${a.path}: sources`);
    for (const s of a.sources)
      assert.ok(isResourceHost(hostOf(s.url)), `${a.path}: source ${s.url}`);
    // Shipping and install areas, stated the house way.
    assert.match(a.body, /48 contiguous states and DC/, `${a.path}: shipping area`);
    assert.match(a.body, /Miami-Dade, Broward and Palm Beach/, `${a.path}: install area`);
    // 5+ internal links in the body, including the shop.
    const links = new Set([...a.body.matchAll(/\]\((\/[^)\s#?]*)/g)].map((m) => m[1]));
    assert.ok(links.size >= 5, `${a.path}: ${links.size} internal links`);
    assert.ok(links.has("/tires"), `${a.path}: links /tires`);
    const twin = store.getArticle("learn", learnTwin[slug].split("/")[2], learnTwin[slug].split("/")[3]);
    assert.ok(links.has(twin.path), `${a.path}: links its Learn guide`);
    assert.notEqual(a.keyword.toLowerCase(), twin.keyword.toLowerCase(), a.path);
    assert.ok(!twin.secondaryKeywords.map((k) => k.toLowerCase()).includes(a.keyword.toLowerCase()), a.path);
    const words = a.body
      .replace(/\[\[demo:[^\]]*\]\]/g, " ")
      .split(/\s+/)
      .filter((w) => /[a-z0-9]/i.test(w)).length;
    assert.ok(words >= 900 && words <= 1500, `${a.path}: ${words} words`);
    // Linked in from at least one page that was already published.
    const inbound = others
      .filter((o) => o.path !== a.path && !slugs.includes(o.slug))
      .some((o) => o.body.includes(`](${a.path})`) || o.related.includes(a.path));
    assert.ok(inbound, `${a.path}: no existing page links to it`);
  }
  const problems = store.problems.filter((p) =>
    slugs.some((slug) => p.file === `./blog/${slug}.md`),
  );
  assert.deepEqual(problems, [], "no content warnings for the reworks");
});

/* --------------- the browser's split: summaries + details --------------- */

// The app gets articleSummary()s in one module and articleDetail() per
// article in its own chunk (vite.config.js); this is what keeps one article
// page from downloading every article's text.
function browserStore(full, includeDrafts) {
  const visible = [...full.getLearnArticles(), ...full.getBlogPosts()];
  return createStore({
    articles: visible.map(articleSummary),
    hubs: HUBS,
    includeDrafts,
  });
}

for (const includeDrafts of [false, true]) {
  test(`a store of summaries answers like the full store (drafts ${includeDrafts ? "shown" : "hidden"})`, () => {
    const full = buildContent({ files: FILES, hubs: HUBS, includeDrafts });
    const lite = browserStore(full, includeDrafts);
    const paths = (list) => list.map((a) => a.path);

    assert.deepEqual(lite.contentRoutes(), full.contentRoutes());
    for (const route of full.contentRoutes())
      assert.equal(lite.contentLastmod(route), full.contentLastmod(route), route);
    assert.deepEqual(lite.getLearnHubs(), full.getLearnHubs());
    assert.deepEqual(lite.getBlogCategories(), full.getBlogCategories());
    assert.deepEqual(paths(lite.getLearnArticles()), paths(full.getLearnArticles()));
    assert.deepEqual(paths(lite.getBlogPosts()), paths(full.getBlogPosts()));
    for (const path of [
      "/learn",
      "/learn/tread",
      "/learn/basics",
      "/learn/tread/tread-depth",
      "/learn/basics/tire-types",
      "/blog/hurricane-check",
      "/blog/sample-post",
      "/blog/nope",
      "/tires",
    ])
      assert.equal(lite.isLive(path), full.isLive(path), path);
  });
}

test("a summary holds list fields only; summary + detail rebuild the article", () => {
  const full = buildContent({ files: FILES, hubs: HUBS, includeDrafts: true });
  for (const article of [...full.getLearnArticles(), ...full.getBlogPosts()]) {
    const summary = articleSummary(article);
    assert.deepEqual(Object.keys(summary), LIST_FIELDS);
    for (const heavy of ["body", "faq", "takeaways", "sources"])
      assert.ok(!(heavy in summary), `${article.path}: summary has ${heavy}`);

    const rendered = full.renderArticle(article);
    const { rendered: shipped, ...rest } = articleDetail(article, rendered);
    assert.ok(!("body" in rest), `${article.path}: detail ships the Markdown`);
    const { body, ...withoutBody } = article;
    assert.ok(body);
    assert.deepEqual({ ...summary, ...rest }, withoutBody);
    assert.deepEqual(shipped, {
      segments: rendered.segments,
      toc: rendered.toc,
      demos: rendered.demos,
    });
  }
});

test("every real article splits cleanly, and the summaries carry no body text", () => {
  const full = loadContent();
  const articles = [...full.getLearnArticles(), ...full.getBlogPosts()];
  assert.ok(articles.length > 0);
  const summaries = JSON.stringify(articles.map(articleSummary));
  for (const a of articles) {
    const detail = articleDetail(a, full.renderArticle(a));
    assert.ok(detail.rendered.segments.length > 0, `${a.path}: empty body`);
    // A line from deep in the body never reaches the summaries module.
    const line = a.body.split("\n").find((l) => l.trim().length > 60);
    if (line) assert.ok(!summaries.includes(line.trim()), `${a.path}: body leaked`);
  }
});

test("every table in every article has named column headings", () => {
  // A blank top-left cell reads as an unnamed column to a screen reader
  // (axe: empty-table-header), so the first column says what its rows are.
  const full = loadContent({ includeDrafts: true });
  for (const a of [...full.getLearnArticles(), ...full.getBlogPosts()]) {
    const html = full
      .renderArticle(a)
      .segments.filter((s) => s.type === "html")
      .map((s) => s.html)
      .join("");
    for (const [cell, attrs, text] of html.matchAll(/<th(\s[^>]*)?>([\s\S]*?)<\/th>/g)) {
      assert.ok(text.replace(/<[^>]+>/g, "").trim(), `${a.path}: empty header cell ${cell}`);
      assert.match(attrs ?? "", /scope="col"/, `${a.path}: ${cell} without scope="col"`);
    }
  }
});

test("the browser-side modules never import the parsers", () => {
  for (const file of ["store.js", "index.js", "details.js"]) {
    const src = readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
    const imports = [...src.matchAll(/^import[\s\S]*?from\s+"([^"]+)"/gm)].map(
      (m) => m[1],
    );
    for (const banned of ["js-yaml", "marked", "./core.js", "./node.js"])
      assert.ok(!imports.includes(banned), `${file} imports ${banned}`);
  }
});

