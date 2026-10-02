// The state shipping pages (statePages.js, stateList.js): every fact sourced
// and flagged, nothing unverified or conflicting on a page unless the preview
// switch allows it, copy that follows the house rules, wiring that matches
// the router and the sitemap, and live pages that are mostly their own state
// rather than name swaps.
//
//   npm run test:data      (node --test "src/data/*.test.mjs")
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  FACTS_CHECKED,
  FACT_LABELS,
  PREVIEW_SHOW_SEARCH_PRIMARY,
  STATE_DATA,
  STATE_PAGE_SHARED as SHARED,
  buildStatePage,
  isShown,
  shownClimate,
  shownFacts,
} from "./statePages.js";
import {
  STATES,
  STATE_PAGES_LIVE,
  getLiveState,
  getState,
} from "./stateList.js";
import { CITY_PAGES } from "./cityPages.js";
import { BUSINESS, FOOTER_COLUMNS } from "./business.js";
import { BANNED_WORDS } from "../components/demos/demoLogic.js";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const TEMPLATE = read("../pages/shipping/StateShippingPage.jsx");
const HUB = read("../pages/shipping/NationwideShippingPage.jsx");
const SHIPPING = read("../pages/ShippingPage.jsx");
const APP = read("../App.jsx");
const SEO_FILES = read("../../scripts/generate-seo-files.mjs");

const LIVE = STATE_PAGES_LIVE.map((s) => buildStatePage(getLiveState(s)));

/** Every string in a value, skipping URLs (they are not copy). */
function strings(value, key = "") {
  if (key === "url") return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap((v) => strings(v));
  if (value && typeof value === "object")
    return Object.entries(value).flatMap(([k, v]) => strings(v, k));
  return [];
}

const allFacts = (d) => [
  ...Object.values(d.facts ?? {}).filter(Boolean),
  ...(d.climate ?? []),
];

/* ------------------------------ the list ------------------------------ */

test("states: the 48 contiguous states and DC, no Alaska or Hawaii", () => {
  assert.equal(STATES.length, 49);
  const slugs = STATES.map((s) => s.slug);
  assert.equal(new Set(slugs).size, 49, "duplicate slug");
  assert.equal(new Set(STATES.map((s) => s.abbr)).size, 49, "duplicate abbr");
  for (const gone of ["alaska", "hawaii"]) assert.ok(!slugs.includes(gone), gone);
  for (const ab of ["AK", "HI"]) assert.ok(!STATES.some((s) => s.abbr === ab), ab);
  assert.ok(slugs.includes("washington-dc"));
  for (const s of STATES) {
    assert.match(s.slug, /^[a-z]+(-[a-z]+)*$/, s.slug);
    assert.match(s.abbr, /^[A-Z]{2}$/, s.slug);
  }
});

test("states: neighbours exist and border both ways", () => {
  for (const s of STATES) {
    assert.ok(s.neighbors.length >= 1, s.slug);
    for (const n of s.neighbors) {
      const other = getState(n);
      assert.ok(other, `${s.slug}: neighbour "${n}" is not in STATES`);
      assert.ok(other.neighbors.includes(s.slug), `${n} does not list ${s.slug} back`);
    }
  }
});

test("states: every jurisdiction has a data row, and nothing else does", () => {
  assert.deepEqual(
    Object.keys(STATE_DATA).sort(),
    STATES.map((s) => s.slug).sort(),
  );
});

/* ------------------------------ facts ------------------------------ */

const EVIDENCE = ["fetched", "search-primary", "search-secondary"];

test("facts: every one is sourced and flagged", () => {
  for (const [slug, d] of Object.entries(STATE_DATA)) {
    for (const [key] of Object.entries(d.facts ?? {}))
      assert.ok(key in FACT_LABELS || key === "penalty", `${slug}: unknown fact "${key}"`);
    for (const f of allFacts(d)) {
      const where = `${slug}: "${f.text.slice(0, 50)}"`;
      assert.ok(f.text.length > 20, where);
      assert.ok(EVIDENCE.includes(f.evidence), `${where}: evidence ${f.evidence}`);
      assert.equal(typeof f.unverified, "boolean", `${where}: no unverified flag`);
      // Only a fact read on the official page itself counts as verified.
      if (f.evidence !== "fetched") assert.equal(f.unverified, true, where);
      assert.ok(f.sources?.length >= 1, `${where}: no source`);
      for (const s of f.sources) {
        assert.ok(s.name, where);
        assert.match(s.url, /^https:\/\/[^\s]+$/, `${where}: ${s.url}`);
      }
    }
  }
});

test("facts: secondary and conflicting facts never render; unverified ones only through the preview switch", () => {
  const base = { text: "x".repeat(30), sources: [] };
  assert.equal(isShown({ ...base, evidence: "search-secondary", unverified: true }), false);
  assert.equal(isShown({ ...base, evidence: "fetched", unverified: false, conflict: true }), false);
  assert.equal(isShown({ ...base, evidence: "fetched", unverified: false }), true);
  assert.equal(isShown(null), false);
  assert.equal(
    isShown({ ...base, evidence: "search-primary", unverified: true }),
    PREVIEW_SHOW_SEARCH_PRIMARY,
  );
  // The pages only ever render through shownFacts/shownClimate.
  for (const p of LIVE)
    for (const f of [...shownFacts(p).map(([, f]) => f), ...shownClimate(p)])
      assert.ok(isShown(f), `${p.slug}: "${f.text.slice(0, 40)}"`);
  assert.match(TEMPLATE, /shownFacts\(page\)/);
  assert.match(TEMPLATE, /shownClimate\(page\)/);
});

test("facts: drafted states have no copy, so they can never render", () => {
  for (const s of STATES) {
    if (STATE_PAGES_LIVE.includes(s.slug)) continue;
    const d = STATE_DATA[s.slug];
    if (!d.hasCopy) assert.equal(buildStatePage(s), null, s.slug);
  }
});

/* ---------------------------- live pages ---------------------------- */

// The bar a state clears before it is routed: rules a shopper there needs,
// and a sourced climate basis for the tire-type advice.
const RULE_FACTS = ["tread", "traction", "studs", "inspection", "emissions", "fee"];
const MIN_RULE_FACTS = 3;
const MIN_CLIMATE = 2;

export function eligibility(slug) {
  const page = buildStatePage(getState(slug));
  if (!page) return { slug, rules: 0, climate: 0, ok: false, reason: "no copy" };
  const rules = shownFacts(page).filter(([k]) => RULE_FACTS.includes(k)).length;
  const climate = shownClimate(page).length;
  // Florida's install-or-ship section (where the vans and the shop work) is
  // first-hand, Florida-only information, and counts as one rule fact.
  const local = page.localInstall ? 1 : 0;
  return {
    slug,
    rules,
    climate,
    ok: rules + local >= MIN_RULE_FACTS && rules >= 2 && climate >= MIN_CLIMATE,
  };
}

test("live pages: the pilot, each clearing the facts bar", () => {
  assert.deepEqual(STATE_PAGES_LIVE, [
    "florida",
    "georgia",
    "texas",
    "california",
    "new-york",
    "north-carolina",
    "colorado",
  ]);
  for (const slug of STATE_PAGES_LIVE) {
    const e = eligibility(slug);
    assert.ok(
      e.ok,
      `${slug}: ${e.rules} rule facts and ${e.climate} climate lines render ` +
        `(needs ${MIN_RULE_FACTS} and ${MIN_CLIMATE}); take it out of STATE_PAGES_LIVE`,
    );
  }
});

test("live pages: well formed", () => {
  for (const p of LIVE) {
    assert.ok(p, "a live slug has no page");
    assert.ok(p.intro.includes(p.name), `${p.slug}: intro never names the state`);
    assert.ok(p.faq.length >= 4 && p.faq.length <= 5, `${p.slug}: ${p.faq.length} FAQs`);
    assert.ok(p.tireType.length >= 1 && p.tireTypeTitle, p.slug);
    assert.ok(p.shipNote && p.mountNote, p.slug);
    assert.ok(p.dmv?.name, `${p.slug}: no "check ... for current rules" agency`);
    assert.match(p.dmv.url, /^https:\/\//, p.slug);
  }
});

test("live pages: titles and descriptions unique and short", () => {
  for (const p of LIVE) {
    assert.ok(`${p.seoTitle} | ${BUSINESS.name}`.length <= 60, `${p.slug}: title too long`);
    assert.ok(p.seoTitle.includes(p.name), p.slug);
    assert.ok(p.description.length <= 160, `${p.slug}: description ${p.description.length}`);
    assert.ok(p.description.includes(p.name), p.slug);
  }
  const titles = LIVE.map((p) => p.seoTitle);
  const descriptions = LIVE.map((p) => p.description);
  assert.equal(new Set(titles).size, titles.length, "duplicate titles");
  assert.equal(new Set(descriptions).size, descriptions.length, "duplicate descriptions");
  assert.ok(!titles.includes("Tires Shipped Free Nationwide"), "clashes with the hub");
});

/* ---------------------------- copy rules ---------------------------- */

const OFF_LIMITS = [
  BANNED_WORDS, // safe, safer, safely, fine, guaranteed, OK
  /\b(discounts?|coupons?|rebates?|deals?|sales?|promos?|% off)\b/i,
  /\b(deliver(y|ies|ed|s)?|arriv(e|es|al|ing))\b/i,
  /\b(in|within) \d+(\s*(-|–|to)\s*\d+)? (business )?days?\b/i,
  /\b(tomorrow|tonight|same[- ]day|next[- ]day|overnight|right away)\b/i,
  /\b24\s*\/\s*7\b|\baround the clock\b/i,
  /\b(customer|verified|5-star) reviews?\b|\b\d(\.\d)? stars?\b|\brated\b/i,
  /\bsince (19|20)\d\d\b|\b\d+\+? years\b|\byears of experience\b/i,
  /\bsafe to drive\b/i,
  /\b(certified|founder|founded|owned by)\b/i,
  /\b(Justin|Melissa)\b/,
  /\bsales[- ]tax\b/i,
];

// Outside Florida nothing may suggest we install (Florida's page says where).
const INSTALL_CLAIMS =
  /\bwe (install|mount|fit|balance)\b|\bour (vans?|technicians?|installers?)\b|\bbook (an?|the) (install|fitting)\b|\bmobile (van|installation)\b/i;

const offLimits = (text) => OFF_LIMITS.filter((re) => re.test(text));

test("copy: state data and shared copy follow the house rules", () => {
  const all = [
    ...Object.values(STATE_DATA).flatMap((d) => strings(d)),
    ...strings(SHARED),
  ];
  for (const s of all) {
    const hits = offLimits(s);
    assert.deepEqual(hits, [], `${hits.join(" ")} in "${s}"`);
  }
});

test("copy: outside Florida, nothing implies we install", () => {
  for (const s of strings(SHARED))
    assert.ok(!INSTALL_CLAIMS.test(s), `shared: "${s}"`);
  for (const p of LIVE.filter((p) => p.slug !== "florida"))
    for (const s of strings(p))
      assert.ok(!INSTALL_CLAIMS.test(s), `${p.slug}: "${s}"`);
});

test("copy: taxes and fees are calculated at checkout, never a per-state sales-tax rule", () => {
  for (const p of LIVE)
    assert.match(p.shipNote, /calculated at checkout\.$/, p.slug);
  assert.match(HUB, /Taxes and fees are calculated at checkout/);
});

test("copy: law facts sit next to 'check ... for current rules'", () => {
  assert.match(TEMPLATE, /\{SHARED\.legal\} Laws change: check\{" "\}/);
  assert.match(TEMPLATE, /for current rules\./);
  assert.match(SHARED.legal, /not legal advice/);
});

test("copy: template and hub source carry no banned words", () => {
  for (const [name, src] of [
    ["StateShippingPage.jsx", TEMPLATE],
    ["NationwideShippingPage.jsx", HUB],
  ]) {
    assert.ok(!BANNED_WORDS.test(src), `${name}: ${src.match(BANNED_WORDS)?.[0]}`);
    for (const re of OFF_LIMITS.slice(1))
      assert.ok(!re.test(src), `${name}: ${src.match(re)?.[0]}`);
  }
  // The hub says where installation stops.
  assert.match(HUB, /Installation outside Miami-Dade, Broward and Palm Beach counties/);
  assert.match(HUB, /to: "\/terms#returns"/);
});

/* ------------------------------ wiring ------------------------------ */

test("wiring: routed, in the sitemap, linked from the footer and /shipping", () => {
  assert.match(APP, /path="\/tires-shipped" element=\{<NationwideShippingPage \/>\}/);
  assert.match(APP, /path="\/tires-shipped\/:state"\s*\n\s*element=\{<StateShippingPage \/>\}/);
  assert.match(SEO_FILES, /STATE_PAGES_LIVE\.map\(\(slug\) => \(\{ path: `\/tires-shipped\/\$\{slug\}`/);
  const shipCol = FOOTER_COLUMNS.find((c) => c.title === "Shipping & Install");
  assert.ok(shipCol.links.some((l) => l.to === "/tires-shipped"), "footer link");
  // Free shipping covers the 48 contiguous states + DC, so the link says so
  // instead of "nationwide" (and the breadcrumbs use the same words).
  assert.equal(
    shipCol.links.find((l) => l.to === "/tires-shipped").label,
    "Shipping to 48 States + DC",
  );
  assert.match(HUB, /label: "Shipping to 48 States \+ DC"/, "hub breadcrumb");
  assert.match(TEMPLATE, /name: "Shipping to 48 States \+ DC", path: "\/tires-shipped"/, "state breadcrumb");
  assert.match(SHIPPING, /to="\/tires-shipped"/);
  assert.match(HUB, /STATES\.map\(/, "the hub lists every state");
  assert.match(HUB, /live\.has\(s\.slug\)/, "and links only the live ones");
  assert.match(HUB, /to="\/shipping"/, "and points to /shipping for the details");
  // Florida's page links the mobile service hub and every city page.
  assert.match(TEMPLATE, /to="\/mobile-service"/);
  assert.match(TEMPLATE, /CITY_PAGES\.map\(/);
  assert.ok(STATE_DATA.florida.localInstall, "Florida explains install vs ship");
});

/* ------------------------- length and overlap ------------------------- */

const TEMPLATE_TEXT = [
  "Free shipping ·",
  "Tires Shipped Free to",
  "Shop Tires",
  "Find My Tires",
  "State rules",
  "tire rules, with sources",
  "Laws change: check",
  "Source:",
  "(opens in a new tab)",
  "Sources checked",
  "Climate and tire choice",
  "Which tire type for",
  "Install or ship",
  "Mobile installation",
  "Ship to store",
  "Mobile service city pages",
  "Shipping",
  "How shipping to",
  "How shipping works",
  "Mounting",
  "Getting them mounted elsewhere in Florida",
  "Getting them mounted in",
  "What to ask a shop",
  "Questions",
  "Asked about",
  "Neighboring states",
  "More state guides",
  "All states",
];

test("the overlap measure reads the same text the template renders", () => {
  for (const s of TEMPLATE_TEXT) assert.ok(TEMPLATE.includes(s), `"${s}" is not in StateShippingPage.jsx`);
});

/** The visible main-content text of a state page, in reading order. */
export function pageText(p) {
  const sources = (list) =>
    ["Source:", ...list.flatMap((s) => [s.name, "(opens in a new tab)"])];
  const florida = Boolean(p.localInstall);
  const neighbors = p.neighbors.map(getLiveState).filter(Boolean);
  const others = STATE_PAGES_LIVE.filter(
    (s) => s !== p.slug && !p.neighbors.includes(s),
  ).map(getLiveState);
  return [
    "Home", "Shipping to 48 States + DC", p.name,
    `Free shipping · ${p.abbr}`, `Tires Shipped Free to ${p.name}`, p.intro,
    "Shop Tires", "Find My Tires",
    "State rules", `${p.name} tire rules, with sources`,
    `${SHARED.legal} Laws change: check ${p.dmv.name} for current rules.`,
    ...shownFacts(p).flatMap(([k, f]) => [FACT_LABELS[k], f.text, ...sources(f.sources)]),
    `Sources checked ${FACTS_CHECKED}.`,
    "Climate and tire choice", `Which tire type for ${p.name}`,
    p.tireTypeTitle, ...p.tireType,
    ...shownClimate(p).flatMap((c) => [c.text, ...sources(c.sources)]),
    ...(florida
      ? [
          "Install or ship", p.localInstall.title, ...p.localInstall.body,
          "Mobile installation", "Ship to store", "Mobile service city pages",
          ...CITY_PAGES.map((c) => c.name),
        ]
      : []),
    "Shipping", `How shipping to ${p.name} works`,
    ...SHARED.shipSteps.flatMap((s) => [s.title, s.body]),
    `${p.shipNote} How shipping works`,
    "Mounting",
    florida ? "Getting them mounted elsewhere in Florida" : `Getting them mounted in ${p.name}`,
    p.mountNote, SHARED.shopNote,
    "What to ask a shop", ...SHARED.askShop, SHARED.bring,
    "Questions", `Asked about ${p.name}`,
    ...p.faq.flatMap((f) => [f.q, f.a]),
    SHARED.toolsLede, ...SHARED.tools.map((t) => t.label),
    ...(neighbors.length ? ["Neighboring states", ...neighbors.map((s) => s.name)] : []),
    "More state guides", ...others.map((s) => s.name), "All states",
  ].join("\n");
}

const words = (text) => text.toLowerCase().match(/[a-z0-9]+(?:['’][a-z]+)?/g) ?? [];

/**
 * 5-word shingles with the page's own state name replaced by a placeholder,
 * so "Tires Shipped Free to Texas" and "... to Georgia" count as the same
 * sentence: a name swap is not unique text.
 */
function shingles(p, n = 5) {
  const own = new RegExp(`\\b${p.name}\\b`, "gi");
  const w = words(pageText(p).replace(own, "statename"));
  const out = new Set();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" "));
  return out;
}

/** Per live page: words, and the share of its shingles found on no other. */
export function overlapReport() {
  const sets = LIVE.map((p) => [p, shingles(p)]);
  return sets.map(([p, mine]) => {
    const others = new Set(sets.filter(([o]) => o !== p).flatMap(([, s]) => [...s]));
    const unique = [...mine].filter((s) => !others.has(s)).length;
    return { slug: p.slug, words: words(pageText(p)).length, unique: unique / mine.size };
  });
}

const MIN_WORDS = 700;
const MAX_WORDS = 1200;
const MIN_UNIQUE = 0.6;

test("live pages: 700–1,200 words, at least 60% unique to the state", () => {
  for (const r of overlapReport()) {
    assert.ok(r.words >= MIN_WORDS && r.words <= MAX_WORDS, `${r.slug}: ${r.words} words`);
    assert.ok(
      r.unique >= MIN_UNIQUE,
      `${r.slug}: only ${(r.unique * 100).toFixed(1)}% of its text is unique to it`,
    );
  }
});

test("the overlap measure catches a name-swapped page", () => {
  const texas = buildStatePage(getLiveState("texas"));
  const fake = JSON.parse(JSON.stringify(texas).replaceAll("Texas", "Georgia"));
  const a = shingles(texas);
  const b = shingles({ ...fake, name: "Georgia" });
  const shared = [...b].filter((s) => a.has(s)).length / b.size;
  assert.ok(shared > 0.9, `name swap scored only ${(shared * 100).toFixed(1)}% shared`);
});
