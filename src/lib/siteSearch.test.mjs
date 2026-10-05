// The store search's matching and size normalising (siteSearch.js) and its
// page index (sitePages.js), with the real catalog, content and router.
//   node --test src/lib/siteSearch.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  GROUP_LABEL,
  extractSize,
  normalizeText,
  readTypedSize,
  readVehicle,
  searchPath,
  searchSite,
  sizePath,
  submitPath,
} from "./siteSearch.js";
import { STATIC_PAGES, buildPageIndex, pageIndexContent } from "./sitePages.js";
import { paramToSize, parseTiresQuery } from "./tiresUrl.js";
import { loadContent } from "../content/node.js";
import {
  TIRES,
  TIRE_BRAND_NAMES,
  TIRE_CATEGORIES,
  WHEELS,
  WHEEL_BRAND_NAMES,
} from "../data/products.js";
import { MAKES } from "../data/vehicleList.js";
import { BANNED_WORDS } from "../components/demos/demoLogic.js";
import { allRoutes } from "../../scripts/generate-seo-files.mjs";

const PAGES = buildPageIndex(pageIndexContent(loadContent()));
const DATA = {
  pages: PAGES,
  tires: TIRES,
  wheels: WHEELS,
  tireBrands: TIRE_BRAND_NAMES,
  wheelBrands: WHEEL_BRAND_NAMES,
  categories: TIRE_CATEGORIES,
  makes: MAKES.map((m) => m[0]),
};
const typeahead = (q) => searchSite(q, DATA, { limit: 8 });
const full = (q) => searchSite(q, DATA);
const paths = (r) => r.groups.flatMap((g) => g.items.map((i) => i.path));
const group = (r, id) => r.groups.find((g) => g.id === id)?.items ?? [];

/* ------------------------------ sizes ------------------------------ */

test("a complete size in every common spelling reads as the same size", () => {
  for (const typed of [
    "225/45R17",
    "225/45r17",
    "2254517",
    "225 45 17",
    "225/45-17",
    "225-45-17",
    "225/45/17",
    "P225/45R17",
    "p225/45r17",
    "225/45ZR17",
    "225/45R17 94W",
    " 225 / 45 R 17 ",
  ]) {
    const s = readTypedSize(typed);
    assert.ok(s?.complete, typed);
    assert.equal(s.display, "225/45R17", typed);
    assert.equal(s.param, "225-45r17", typed);
    assert.equal(sizePath(s), "/tires?size=225-45r17", typed);
  }
});

test("LT, C and flotation sizes keep their markings", () => {
  assert.equal(readTypedSize("LT265/70R17").display, "LT265/70R17");
  assert.equal(readTypedSize("lt 265 70 17").param, "lt265-70r17");
  assert.equal(readTypedSize("265/70R17LT").display, "265/70R17LT");
  assert.equal(readTypedSize("235/65R16C").display, "235/65R16C");
  const f = readTypedSize("31x10.5r15");
  assert.equal(f.display, "31x10.50R15LT");
  assert.equal(sizePath(f), "/tires?size=31x10.50r15lt");
  assert.equal(readTypedSize("33X12.50R20LT").display, "33x12.50R20LT");
  // Every param is one /tires reads back to the same size.
  for (const typed of ["225/45R17", "LT265/70R17", "235/65R16C", "31x10.5r15"]) {
    const s = readTypedSize(typed);
    assert.equal(paramToSize(s.param), s.display, typed);
  }
});

test("a size is recognised from its first digits, partial as it is typed", () => {
  assert.deepEqual(
    pick(readTypedSize("225"), ["complete", "width", "aspect", "rim"]),
    { complete: false, width: 225, aspect: null, rim: null },
  );
  assert.equal(readTypedSize("225/4").aspectStart, "4");
  assert.equal(readTypedSize("2254").aspectStart, "4");
  const wa = readTypedSize("225/45");
  assert.deepEqual(pick(wa, ["complete", "width", "aspect"]), { complete: false, width: 225, aspect: 45 });
  assert.equal(sizePath(wa), "/tires?w=225&a=45");
  assert.equal(readTypedSize("22545").aspect, 45);
  assert.equal(readTypedSize("225/45R").rim, null);
  assert.equal(readTypedSize("225451").rimStart, "1");
  assert.equal(sizePath(readTypedSize("225")), "/tires?w=225");
});

test("years, ZIP codes, phone fragments and words are not sizes", () => {
  for (const typed of ["2019", "2019 bmw", "33325", "954", "220", "999/45R17", "225/47R17", "225/45R99", "abc", "", "R17", "225x"]) {
    assert.equal(readTypedSize(typed), null, typed);
  }
});

test("a size inside a longer search is found, with the rest kept", () => {
  const { size, rest } = extractSize("michelin 225/45r17");
  assert.equal(size.display, "225/45R17");
  assert.equal(rest, "michelin");
  assert.equal(extractSize("tires 2254517 please").size.display, "225/45R17");
  assert.equal(extractSize("rotation").size, null);
});

/* ----------------------------- vehicles ----------------------------- */

test("a year, make and model reads as a vehicle for /tires", () => {
  const v = readVehicle("2019 BMW 3 Series", DATA.makes);
  assert.deepEqual(v, {
    year: "2019",
    make: "BMW",
    model: "3 Series",
    path: "/tires?year=2019&make=bmw&model=3+series",
  });
  assert.equal(readVehicle("ford f-150 2020", DATA.makes).path, "/tires?year=2020&make=ford&model=f-150");
  assert.equal(readVehicle("2021 land rover range rover", DATA.makes).make, "Land Rover");
  assert.equal(readVehicle("2019 bmw", DATA.makes), null, "a model is needed");
  assert.equal(readVehicle("1850 ford f-150", DATA.makes), null);
  assert.equal(readVehicle("2019 banana split", DATA.makes), null);
  // /tires reads it back as the same vehicle.
  const sel = parseTiresQuery(v.path.split("?")[1], { makes: DATA.makes }).selection;
  assert.deepEqual([sel.year, sel.make, sel.model], ["2019", "BMW", "3 Series"]);
});

/* ------------------------------ search ------------------------------ */

test("typing a partial size suggests the size first, and catalog sizes it could be", () => {
  const r = typeahead("225/45");
  assert.equal(r.groups[0].id, "sizes");
  const sizes = group(r, "sizes");
  assert.ok(sizes.some((i) => i.path === "/tires?w=225&a=45"));
  assert.ok(sizes.some((i) => i.label === "Shop 225/45R17 tires"));
  for (const item of group(r, "products")) assert.match(item.detail, /^225\/45R\d\d/);

  const done = typeahead("2254517");
  assert.equal(done.groups[0].items[0].label, "Shop 225/45R17 tires");
  assert.equal(done.groups[0].items[0].path, "/tires?size=225-45r17");
});

test("typing a brand suggests the brand and its tires", () => {
  const r = typeahead("continental");
  assert.equal(group(r, "brands")[0].path, "/tires?brand=continental");
  const products = group(r, "products");
  assert.ok(products.length >= 2);
  assert.ok(products.every((i) => i.label.startsWith("Continental ")));
  // The full results list every Continental in the catalog.
  const all = group(full("continental"), "products");
  assert.equal(all.length, TIRES.filter((t) => t.brand === "Continental").length);
  // A one-letter typo still finds it.
  assert.ok(group(typeahead("contnental"), "products").length > 0);
});

test("a model name finds the product", () => {
  const sample = TIRES[0];
  const r = typeahead(sample.model);
  assert.ok(paths(r).includes(`/tires/${sample.slug}`));
});

test("rotation and mobile find the right pages", () => {
  const rotation = paths(typeahead("rotation"));
  assert.ok(rotation.includes("/tire-rotation-pattern"), rotation.join(" "));
  assert.ok(rotation.includes("/services/tire-rotation"), rotation.join(" "));

  const mobile = group(typeahead("mobile"), "pages");
  assert.equal(mobile[0].path, "/mobile-service");
  assert.ok(paths(full("mobile")).filter((p) => p.startsWith("/mobile-service/")).length >= 7);

  const tesla = paths(full("tesla"));
  assert.ok(tesla.includes("/learn/tesla"));
  assert.ok(tesla.filter((p) => p.startsWith("/learn/tesla/")).length >= 5);

  for (const [q, path] of [
    ["plus size", "/plus-size-calculator"],
    ["wheel offset", "/wheel-offset-calculator"],
    ["load speed", "/load-speed-check"],
    ["pressure temperature", "/tire-pressure-temperature"],
    ["repaired", "/can-my-tire-be-repaired"],
    ["shaking", "/car-shaking-checker"],
    ["tire size", "/tire-size"],
    ["shipping", "/shipping"],
    ["financing", "/financing"],
    ["returns", "/terms#returns"],
    ["contact", "/contact"],
    ["faq", "/contact"],
    ["wheels", "/wheels"],
    ["install", "/install"],
    ["sunrise", "/mobile-service/sunrise-fl"],
    ["flat tire", "/services/tire-repair"],
  ]) {
    assert.ok(paths(typeahead(q)).includes(path), `${q} -> ${path}: ${paths(typeahead(q)).join(" ")}`);
  }
});

test("a vehicle query suggests that vehicle on /tires", () => {
  const r = typeahead("2019 BMW 3 Series");
  assert.equal(r.groups[0].id, "vehicles");
  assert.equal(r.groups[0].items[0].path, "/tires?year=2019&make=bmw&model=3+series");
});

test("the typeahead shows at most 8, in group order, and shares them out", () => {
  const order = Object.keys(GROUP_LABEL);
  for (const q of ["225", "225/45", "continental", "tire", "mobile", "tesla", "all season", "nitto", "repair"]) {
    const r = typeahead(q);
    assert.ok(r.count <= 8, `${q}: ${r.count}`);
    const ids = r.groups.map((g) => g.id);
    assert.deepEqual(ids, [...ids].sort((a, b) => order.indexOf(a) - order.indexOf(b)), q);
  }
  // A brand search still leaves room for pages when there are any.
  const r = typeahead("pirelli");
  assert.ok(group(r, "products").length <= 3);
});

test("nothing is suggested below two characters", () => {
  assert.equal(typeahead("").count, 0);
  assert.equal(typeahead("a").count, 0);
  assert.equal(typeahead(" ").count, 0);
});

test("Enter with nothing highlighted: size, brand, category, model, vehicle, else /search", () => {
  assert.equal(submitPath("2254517", DATA), "/tires?size=225-45r17");
  assert.equal(submitPath("225/45", DATA), "/tires?w=225&a=45");
  assert.equal(submitPath("Continental", DATA), "/tires?brand=continental");
  assert.equal(submitPath("winter", DATA), "/tires?category=winter");
  assert.equal(submitPath(TIRES[0].model, DATA), `/tires/${TIRES[0].slug}`);
  assert.equal(submitPath("2019 bmw 3 series", DATA), "/tires?year=2019&make=bmw&model=3+series");
  assert.equal(submitPath("rotation", DATA), "/search?q=rotation");
  assert.equal(submitPath("mobile tire install", DATA), "/search?q=mobile%20tire%20install");
  assert.equal(submitPath("   ", DATA), null);
  assert.equal(searchPath(" a&b "), "/search?q=a%26b");
});

test("normalizeText folds case, accents and punctuation", () => {
  assert.equal(normalizeText("Truck & SUV"), "truck and suv");
  assert.equal(normalizeText("Pirelli’s Cinturato — P7"), "pirellis cinturato p7");
  assert.equal(normalizeText("31x10.50R15"), "31x10.50r15");
});

/* ------------------------ every path is real ------------------------ */

test("every suggested path is a real route", async () => {
  // allRoutes() re-checks the content and warns about unwritten links;
  // that is content.test.mjs's business, not this test's.
  const warn = console.warn;
  console.warn = () => {};
  let routes;
  try {
    routes = new Set((await allRoutes()).map((r) => r.path));
  } finally {
    console.warn = warn;
  }
  assert.ok(routes.has("/search"), "/search is in the route table");
  const vocab = { brands: TIRE_BRAND_NAMES, categories: TIRE_CATEGORIES, makes: DATA.makes };

  const suggested = new Set(PAGES.map((p) => p.path));
  const queries = [
    "225", "225/45", "2254517", "LT265/70R17", "31x10.5r15", "235", "275/55",
    "rotation", "mobile", "tesla", "brake", "install", "returns", "faq",
    "shipping", "wheels", "winter", "all season", "truck", "commercial",
    "2019 BMW 3 Series", "2020 toyota camry", "toyota", "pressure", "tread",
    "flat", "repair", "sunrise", "davie", "learn", "blog", "track", "cart",
    ...TIRE_BRAND_NAMES, ...WHEEL_BRAND_NAMES, ...TIRES.map((t) => t.model),
    ...PAGES.map((p) => p.title),
  ];
  for (const q of queries) {
    for (const r of [typeahead(q), full(q)]) {
      for (const g of r.groups) for (const i of g.items) suggested.add(i.path);
    }
    suggested.add(submitPath(q, DATA));
    suggested.add(searchPath(q));
  }

  const missing = [];
  for (const path of suggested) {
    const url = new URL(path, "https://tiredroponline.com");
    if (!routes.has(url.pathname)) missing.push(path);
    // /tires links must say something /tires actually reads.
    if (url.pathname === "/tires" && url.search) {
      const state = parseTiresQuery(url.search, vocab);
      const params = url.searchParams;
      if (params.has("size")) assert.ok(state.selection?.size, `${path}: size`);
      if (params.has("brand")) assert.equal(state.filters.brands.length, 1, `${path}: brand`);
      if (params.has("category")) assert.equal(state.filters.categories.length, 1, `${path}: category`);
      if (params.has("year")) assert.equal(state.selection?.type, "vehicle", `${path}: vehicle`);
      if (params.has("w")) assert.ok(state.partial.width, `${path}: width`);
    }
    if (url.pathname === "/wheels" && url.searchParams.has("brands"))
      assert.ok(WHEEL_BRAND_NAMES.includes(url.searchParams.get("brands")), path);
  }
  assert.deepEqual(missing, [], `suggested paths with no route: ${missing.join(", ")}`);
});

test("the page index has every service, city page, tool page and published guide", () => {
  const indexed = new Set(PAGES.map((p) => p.path));
  const content = pageIndexContent(loadContent());
  for (const a of [...content.learn, ...content.blog]) assert.ok(indexed.has(a.path), a.path);
  for (const h of content.hubs.filter((x) => x.count > 0)) assert.ok(indexed.has(`/learn/${h.slug}`), h.slug);
  const app = readFileSync(new URL("../App.jsx", import.meta.url), "utf8");
  for (const m of app.matchAll(/<Route\s+path="(\/[a-z-]+)"\s+element=\{<DemoToolPage/g))
    assert.ok(indexed.has(m[1]), m[1]);
  assert.ok(PAGES.filter((p) => p.type === "service").length >= 10);
  assert.ok(PAGES.filter((p) => p.type === "area").length >= 7);
  // One entry per path.
  assert.equal(indexed.size, PAGES.length);
});

test("hash links point at sections that exist", () => {
  const legal = readFileSync(new URL("../pages/support/LegalPage.jsx", import.meta.url), "utf8");
  for (const p of PAGES.filter((x) => x.path.includes("#"))) {
    const id = p.path.split("#")[1];
    assert.ok(legal.includes(`id: "${id}"`), p.path);
  }
});

/* ------------------------------- copy ------------------------------- */

test("search copy keeps the house rules", () => {
  const files = [
    "./siteSearch.js",
    "./sitePages.js",
    "../components/layout/HeaderSearch.jsx",
    "../pages/SearchPage.jsx",
  ].map((f) => [f, readFileSync(new URL(f, import.meta.url), "utf8")]);
  const shown = STATIC_PAGES.flatMap((p) => [p.title, p.text]);
  for (const [name, text] of [...files, ...shown.map((t) => ["STATIC_PAGES", t])]) {
    assert.ok(!BANNED_WORDS.test(text), `${name}: ${text.match(BANNED_WORDS)?.[0]}`);
    assert.ok(!/\b(discount|coupon|rebate|deals?|promo|% off)\b/i.test(text), `${name}: discounts`);
    assert.ok(!/\b(in \d+ days?|tomorrow|same[- ]day|arrives? by)\b/i.test(text), `${name}: dates`);
    assert.ok(!/\bJustin\b/.test(text), `${name}: owner name`);
    assert.ok(!/\b(\d(\.\d)? stars?|5-star|rated \d)\b/i.test(text), `${name}: ratings`);
  }
});

function pick(obj, keys) {
  return Object.fromEntries(keys.map((k) => [k, obj?.[k]]));
}
