// The mobile city pages (cityPages.js): ZIPs inside the service area, copy
// that follows the house rules, wiring that matches the router and the
// sitemap, and pages that are mostly their own city rather than name swaps.
//
//   npm run test:data      (node --test "src/data/*.test.mjs")
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  CITY_PAGES,
  CITY_PAGE_SHARED as SHARED,
  getCityPage,
} from "./cityPages.js";
import {
  SERVICE_AREA_EXAMPLES,
  SERVICE_COUNTIES,
  isInServiceArea,
} from "./serviceArea.js";
import { BUSINESS } from "./business.js";
import { MOBILE_SERVICES } from "./services.js";
import { BANNED_WORDS } from "../components/demos/demoLogic.js";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const TEMPLATE = read("../pages/services/MobileCityPage.jsx");
const ROADSIDE = read("../components/ui/RoadsideHelp.jsx");
const HUB = read("../pages/services/MobileServicePage.jsx");
const APP = read("../App.jsx");
const SEO_FILES = read("../../scripts/generate-seo-files.mjs");

function strings(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

/* ------------------------------ ZIPs ------------------------------ */

// Inside the 334 prefix but outside Palm Beach County (Hendry, Martin and
// Glades), and Sunrise's PO Box ZIP: never listed on a page.
const NEVER_LISTED = ["33440", "33455", "33471", "33475", "33345"];

test("city pages: every listed ZIP is in the service area", () => {
  for (const c of CITY_PAGES) {
    for (const zip of c.zips) {
      assert.match(zip, /^\d{5}$/, `${c.slug}: "${zip}"`);
      assert.ok(isInServiceArea(zip), `${c.slug}: ${zip} fails isInServiceArea()`);
      assert.ok(!NEVER_LISTED.includes(zip), `${c.slug}: ${zip} must not be listed`);
    }
    assert.equal(new Set(c.zips).size, c.zips.length, `${c.slug}: duplicate ZIP`);
  }
});

test("city pages: eligibility stays ZIP-based (city names decide nothing)", () => {
  // The rule takes a ZIP; a city name is never in the service area.
  for (const c of CITY_PAGES) assert.equal(isInServiceArea(c.name), false);
  // The one rule file has no city list in it.
  const rule = read("./serviceArea.js").split("SERVICE_AREA_EXAMPLES")[0];
  for (const c of CITY_PAGES) assert.ok(!rule.includes(`"${c.name}"`), c.name);
});

/* ------------------------------ data ------------------------------ */

test("city pages: the seven wave-1 cities, well formed", () => {
  assert.deepEqual(
    CITY_PAGES.map((c) => c.slug),
    [
      "sunrise-fl",
      "plantation-fl",
      "tamarac-fl",
      "coral-springs-fl",
      "davie-fl",
      "fort-lauderdale-fl",
      "weston-fl",
    ],
  );
  for (const c of CITY_PAGES) {
    assert.match(c.slug, /^[a-z]+(-[a-z]+)*-fl$/, c.slug);
    assert.ok(SERVICE_COUNTIES.includes(c.county), `${c.slug}: county ${c.county}`);
    assert.ok(Number.isInteger(c.population) && c.population > 0, c.slug);
    assert.ok(c.faq.length >= 4 && c.faq.length <= 5, `${c.slug}: ${c.faq.length} FAQs`);
    assert.ok(c.whereWeWork.length >= 1 && c.conditions.length >= 1, c.slug);
    assert.ok(c.intro.includes(c.name), `${c.slug}: intro never names the city`);
    assert.ok(
      new RegExp(`(flat tire help|mobile flat tire repair) in ${c.name}`, "i").test(c.roadside),
      `${c.slug}: roadside lede needs "flat tire help in ${c.name}" or "mobile flat tire repair in ${c.name}"`,
    );
    assert.ok(c.nearby.length >= 2 && c.nearby.length <= 4, `${c.slug}: nearby`);
    for (const n of c.nearby) {
      assert.ok(getCityPage(n), `${c.slug}: nearby "${n}" is not a city page`);
      assert.notEqual(n, c.slug);
    }
  }
});

test("city pages: titles and descriptions are unique and short", () => {
  for (const c of CITY_PAGES) {
    assert.ok(`${c.seoTitle} | ${BUSINESS.name}`.length <= 60, `${c.slug}: title too long`);
    assert.ok(c.seoTitle.includes(c.name), c.slug);
    assert.ok(c.description.length <= 160, `${c.slug}: description ${c.description.length}`);
    assert.ok(c.description.includes(c.name), c.slug);
  }
  const titles = CITY_PAGES.map((c) => c.seoTitle);
  const descriptions = CITY_PAGES.map((c) => c.description);
  assert.equal(new Set(titles).size, titles.length, "duplicate titles");
  assert.equal(new Set(descriptions).size, descriptions.length, "duplicate descriptions");
  assert.ok(!titles.includes("Mobile Tire Installation in South Florida"), "clashes with the hub");
});

test("city pages: every city with a page is a linked service-area example", () => {
  const examples = SERVICE_AREA_EXAMPLES.flatMap((g) => g.cities);
  for (const name of ["Tamarac", "Lauderhill"]) assert.ok(examples.includes(name), name);
  for (const c of CITY_PAGES) assert.ok(examples.includes(c.name), `${c.name} is not an example city`);
});

/* ---------------------------- copy rules ---------------------------- */

// The one approved arrival sentence, and Justin's highway line, are allowed;
// everything else on these lists never appears.
const APPROVED = [/we confirm an arrival window when we book\.?/gi];
const OFF_LIMITS = [
  BANNED_WORDS, // safe, safer, safely, fine, guaranteed, OK
  /\b(discount|coupon|rebate|deal|sale|promo|% off)s?\b/i,
  /\b(deliver(y|ed|s)?|arriv(e|es|al|ing)|in \d+ days?|tomorrow|tonight|same[- ]day|right away|on (its|the) way to you)\b/i,
  /\b\d+\s*(-|–|to)?\s*\d*\s*(min|mins|minutes)\b/i, // drive or arrival times
  /\b\d{1,2}(\.\d+)?\s*(miles?|mi)\b/i, // distances (mileage intervals like 5,000 miles are fine)
  /\b(drive|driving|travel) time\b/i,
  /\b24\s*\/\s*7\b|\b24[- ]hours?\b|\baround the clock\b/i,
  /\b(customer|verified|5-star) reviews?\b|\b\d(\.\d)? stars?\b|\brated\b/i,
  /\bsince (19|20)\d\d\b|\b\d+\+? years\b|\byears of experience\b/i,
  /\bsafe to drive\b/i,
  /\b(certified|founder|founded|owned by)\b|\bowner\b(?!['’]s manual)/i,
  /\b(Justin|Melissa)\b/,
  /\ball of South Florida\b|\bKey (Largo|West)\b|\bMonroe\b|\bMartin County\b/i,
];

function offLimits(text) {
  const t = APPROVED.reduce((s, re) => s.replace(re, ""), text);
  return OFF_LIMITS.filter((re) => re.test(t));
}

test("city pages: copy follows the house rules", () => {
  const all = [...CITY_PAGES.flatMap((c) => strings(c)), ...strings(SHARED)];
  for (const s of all) {
    const hits = offLimits(s);
    assert.deepEqual(hits, [], `${hits.join(" ")} in "${s}"`);
  }
  // The highway line is Justin's wording, word for word.
  assert.equal(
    SHARED.highwayLine,
    "Stuck on a highway or expressway shoulder? For your safety, call 911 or *347 (FDOT Road Rangers) first. Once you're off the highway, call us.",
  );
  assert.ok(SHARED.scope.includes(SHARED.highwayLine));
});

test("hub and roadside copy: no banned words in the page source", () => {
  for (const [name, src] of [
    ["MobileServicePage.jsx", HUB],
    ["MobileCityPage.jsx", TEMPLATE],
    ["RoadsideHelp.jsx", ROADSIDE],
  ]) {
    assert.ok(!BANNED_WORDS.test(src), `${name}: ${src.match(BANNED_WORDS)?.[0]}`);
    assert.ok(!/\b24\s*\/\s*7\b/.test(src), `${name}: 24/7`);
  }
  // Hub H1: "Mobile Tire Installation" and South Florida.
  assert.match(HUB, /title="Mobile Tire Installation in South Florida"/);
});

/* ------------------------------ wiring ------------------------------ */

test("city pages: routed, in the sitemap list, and under the hub", () => {
  assert.match(APP, /path="\/mobile-service\/:city"\s*\n\s*element=\{<MobileCityPage \/>\}/);
  assert.match(SEO_FILES, /CITY_PAGES\.map\(\(c\) => \(\{ path: `\/mobile-service\/\$\{c\.slug\}`/);
  assert.match(HUB, /CITY_PAGES\.map\(/, "the hub links every city page");
});

/* ------------------------- length and overlap ------------------------- */

// The headings and labels MobileCityPage.jsx renders around the data. If the
// template changes one, this list must follow (checked below).
const TEMPLATE_TEXT = [
  "How it works",
  "Bought on TireDrop, fitted where you park",
  "Service area",
  "Neighbourhoods and areas",
  "Main roads",
  "Main ZIP codes",
  "Ship to store",
  "Local notes",
  "By van",
  "Honest scope",
  "What to expect",
  "Questions",
  "Nearby city pages",
  "All mobile service areas",
  "Book Mobile Install",
  "Shop Tires",
];

test("the overlap measure reads the same headings the template renders", () => {
  for (const s of TEMPLATE_TEXT) assert.ok(TEMPLATE.includes(s), `"${s}" is not in MobileCityPage.jsx`);
  for (const s of ["Roadside flat help", "During shop hours", "tire repair service"])
    assert.ok(ROADSIDE.includes(s), `"${s}" is not in RoadsideHelp.jsx`);
});

/** The visible main-content text of a city page, in reading order. */
export function pageText(c) {
  const name = c.name;
  const has = (list, label) => (list.length ? [label, ...list] : []);
  return [
    "Home", "Mobile Tire Service", name,
    `Mobile tire service · ${c.county} County`,
    `Mobile Tire Installation in ${name}, FL`,
    c.intro,
    "Book Mobile Install", `Call ${BUSINESS.phone}`,
    "How it works", "Bought on TireDrop, fitted where you park",
    ...SHARED.howItWorks.flatMap((s) => [s.title, s.body]),
    "Service area", `Where we work in ${name}`,
    ...c.whereWeWork,
    ...has(c.areas, "Neighbourhoods and areas"),
    ...has(c.roads, "Main roads"),
    ...has(c.zips, "Main ZIP codes"),
    SHARED.zipLabel, "Check my ZIP",
    c.route,
    SHARED.shopLine, "Ship to store",
    "Local notes", c.conditionsTitle, ...c.conditions,
    "Roadside flat help", `Flat tire help in ${name}`, c.roadside,
    ...SHARED.roadsideItems.flatMap((s) => [s.title, s.body]),
    "The repair itself is our tire repair service.",
    "During shop hours",
    ...BUSINESS.hours.map((h) => `${h.days}: ${h.time}`),
    "We confirm an arrival window when we book.", `Call ${BUSINESS.phone}`,
    "By van", `What the van does in ${name}`, SHARED.servicesLede,
    ...MOBILE_SERVICES.map((s) => s.name),
    "Honest scope", "What to expect", ...SHARED.scope,
    "Questions", `Asked in ${name}`,
    ...c.faq.flatMap((f) => [f.q, f.a]),
    BUSINESS.tagline, `Book a mobile install in ${name}`, SHARED.ctaBody,
    "Book Mobile Install", "Shop Tires", BUSINESS.phone,
    "Nearby city pages",
    ...c.nearby.map((n) => `Mobile tire installation in ${getCityPage(n).name}`),
    "All mobile service areas",
  ].join("\n");
}

const words = (text) => text.toLowerCase().match(/[a-z0-9]+(?:['’][a-z]+)?/g) ?? [];

/**
 * 5-word shingles with the page's own city name replaced by a placeholder,
 * so "Mobile Tire Installation in Davie" and "... in Weston" count as the
 * same sentence: a name swap is not unique text.
 */
function shingles(c, n = 5) {
  const own = new RegExp(`\\b${c.name}\\b`, "gi");
  const w = words(pageText(c).replace(own, "cityname"));
  const out = new Set();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" "));
  return out;
}

/** Per page: words, and the share of its shingles found on no other city page. */
export function overlapReport() {
  const sets = CITY_PAGES.map((c) => [c, shingles(c)]);
  return sets.map(([c, mine]) => {
    const others = new Set(
      sets.filter(([o]) => o !== c).flatMap(([, s]) => [...s]),
    );
    const unique = [...mine].filter((s) => !others.has(s)).length;
    return {
      slug: c.slug,
      words: words(pageText(c)).length,
      unique: unique / mine.size,
    };
  });
}

const MIN_WORDS = 700;
const MAX_WORDS = 1200;
const MIN_UNIQUE = 0.6;

test("city pages: 700–1,200 words, at least 60% unique to the city", () => {
  for (const r of overlapReport()) {
    assert.ok(r.words >= MIN_WORDS && r.words <= MAX_WORDS, `${r.slug}: ${r.words} words`);
    assert.ok(
      r.unique >= MIN_UNIQUE,
      `${r.slug}: only ${(r.unique * 100).toFixed(1)}% of its text is unique to it`,
    );
  }
});

test("the overlap measure catches a name-swapped page", () => {
  // Weston's copy with the name swapped to Davie must score as a duplicate.
  const weston = getCityPage("weston-fl");
  const fake = JSON.parse(JSON.stringify(weston).replaceAll("Weston", "Davie"));
  const a = shingles(weston);
  const b = shingles({ ...fake, name: "Davie" });
  const shared = [...b].filter((s) => a.has(s)).length / b.size;
  assert.ok(shared > 0.9, `name swap scored only ${(shared * 100).toFixed(1)}% shared`);
});
