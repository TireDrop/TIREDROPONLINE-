// The standalone demo tool pages (toolPages.js): copy follows the house
// rules, every link goes somewhere real, and the routes, redirects and
// registry agree with each other.
//
//   node --test src/components/demos/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { TOOL_PAGES, TOOL_PAGE_ALIASES } from "./toolPages.js";
import { BANNED_WORDS } from "./demoLogic.js";
import { findCompetitorHosts, findCompetitorNames } from "../../lib/competitors.js";
import { getService } from "../../data/services.js";
import { contentRoutes } from "../../content/node.js";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const APP = read("../../App.jsx");
const INDEX = read("./index.js");
const TOOL_REDIRECT = read("../../pages/tools/ToolRedirect.jsx");
const VERCEL = JSON.parse(read("../../../vercel.json"));

function strings(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

// Never promised: deals, dates, reviews. Status words stay the shared four.
const OFF_LIMITS = [
  BANNED_WORDS,
  /\b(discount|coupon|rebate|deal|sale|promo)s?\b/i,
  /\b(deliver(y|ed|s)?|arriv(e|es|al)|in \d+ days?|by (monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow))\b/i,
  /\b(customer|verified|5-star) reviews?\b|\b\d(\.\d)? stars?\b|\bsince (19|20)\d\d\b/i,
  /\bsafe to drive\b/i,
];

test("tool pages: seven, one per demo, each registered", () => {
  assert.deepEqual(
    TOOL_PAGES.map((t) => t.id),
    [
      "load-speed-check",
      "plus-size-speedo",
      "pressure-temp",
      "damage-map",
      "noise-vibration",
      "rotation-pattern",
      "wheel-offset",
    ],
  );
  for (const t of TOOL_PAGES) {
    assert.match(INDEX, new RegExp(`"${t.id}": loadDemo\\(`), `${t.id} in DEMOS`);
  }
});

test("tool pages: copy follows the house rules", () => {
  for (const t of TOOL_PAGES) {
    for (const s of strings(t)) {
      for (const re of OFF_LIMITS) assert.ok(!re.test(s), `${t.id}: ${re} in "${s}"`);
    }
    const sentences = t.intro.split(/(?<=[.!?])\s+(?=[A-Z])/);
    assert.ok(sentences.length >= 2 && sentences.length <= 3, `${t.id} intro: ${sentences.length} sentences`);
    assert.ok(t.faq.length >= 3 && t.faq.length <= 4, `${t.id}: ${t.faq.length} FAQs`);
    assert.ok(t.howTo.length >= 3, `${t.id}: how-to steps`);
    assert.ok(`${t.seoTitle} | TireDrop`.length <= 60, `${t.id}: title too long`);
    assert.ok(t.description.length <= 160, `${t.id}: description ${t.description.length}`);
  }
  const titles = TOOL_PAGES.map((t) => t.seoTitle);
  assert.equal(new Set(titles).size, titles.length, "duplicate titles");
});

test("tool pages: routed in App.jsx, one path each", () => {
  const paths = TOOL_PAGES.map((t) => t.path);
  assert.equal(new Set(paths).size, paths.length);
  for (const t of TOOL_PAGES) {
    assert.match(t.path, /^\/[a-z0-9-]+$/);
    assert.ok(
      APP.includes(`path="${t.path}"\n              element={<DemoToolPage tool="${t.id}" />}`),
      `${t.path} → DemoToolPage tool="${t.id}" in App.jsx`,
    );
  }
});

test("tool pages: /tools/<id> redirects on the server and in the app", () => {
  const redirects = new Map(VERCEL.redirects.map((r) => [r.source, r]));
  for (const [alias, path] of Object.entries(TOOL_PAGE_ALIASES)) {
    const r = redirects.get(`/tools/${alias}`);
    assert.ok(r, `vercel.json has no redirect for /tools/${alias}`);
    assert.equal(r.destination, path);
    assert.equal(r.statusCode, 301);
  }
  // The in-app redirect lives in ToolRedirect.jsx (a lazy page), routed from App.jsx.
  assert.match(TOOL_REDIRECT, /\.\.\.TOOL_PAGE_ALIASES/);
  assert.match(APP, /path="\/tools\/:tool" element=\{<ToolRedirect \/>\}/);
});

test("tool pages: related articles are published, bookings are real services", () => {
  const live = new Set(contentRoutes());
  const sitePages = new Set([
    "/tire-size",
    "/tire-check",
    "/find-my-tires",
    ...TOOL_PAGES.map((t) => t.path),
  ]);
  for (const t of TOOL_PAGES) {
    const articles = t.related.filter((p) => /^\/(learn|blog)\//.test(p));
    assert.ok(articles.length >= 1 && articles.length <= 3, `${t.id}: ${articles.length} articles`);
    for (const p of articles) assert.ok(live.has(p), `${t.id}: ${p} is not a published article`);
    for (const p of t.related.filter((x) => !articles.includes(x)))
      assert.ok(sitePages.has(p), `${t.id}: ${p} is not a known page`);
    assert.ok(t.services.length >= 1, `${t.id}: no booking`);
    for (const slug of t.services) assert.ok(getService(slug), `${t.id}: no service "${slug}"`);
  }
});

test("wheel offset page: the three bands, the vehicle caveat and the phone check are on the page", () => {
  const t = TOOL_PAGES.find((x) => x.id === "wheel-offset");
  assert.equal(t.path, "/wheel-offset-calculator");
  const text = strings(t).join(" ");
  assert.match(text, /not a fitment promise/);
  assert.match(text, /brakes, struts, (the )?fender lip, suspension and steering lock/);
  assert.match(text, /confirms? fitment (by phone )?before any wheel ships/);
  // Never says a combination works: "fits", "will clear", "approved".
  assert.ok(!/\b(fits|will fit|will clear|approved?)\b/i.test(text), "no fit promise");
  // No competitor names or links (the shared list in src/lib/competitors.js).
  assert.deepEqual(findCompetitorNames(text), []);
  assert.deepEqual(findCompetitorHosts(text), []);
  assert.ok(t.related.includes("/learn/fitment/wheel-offset-backspacing"));
});

test("wheel offset page: linked from the nav, the Learn tool list, the fitment guidance and the hub", () => {
  const BUSINESS = read("../../data/business.js");
  assert.equal((BUSINESS.match(/\/wheel-offset-calculator/g) ?? []).length, 2, "tools menu and footer");
  assert.match(read("../../pages/learn/LearnIndexPage.jsx"), /to: "\/wheel-offset-calculator"/);
  assert.match(read("../../pages/shop/WheelsPage.jsx"), /\/wheel-offset-calculator/);
  assert.match(read("../../content/learn/hubs.json"), /"href": "\/wheel-offset-calculator"/);
});
