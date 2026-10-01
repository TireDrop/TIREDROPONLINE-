/**
 * Validates the JSON-LD in the prerendered build: every dist/**.html page
 * (dist/<route>.html, and dist/<route>/index.html if the layout ever changes).
 *
 * For each page:
 *   - every <script type="application/ld+json"> parses as JSON;
 *   - every {"@id": ...} reference resolves to a node on the same page;
 *   - no value is null or an empty string (a "geo": null is a broken pin);
 *   - no ratings or reviews anywhere (house rule until reviews are real):
 *     no aggregateRating, review(s), Review, AggregateRating or Rating;
 *   - Google's required properties per type: Organization, WebSite,
 *     WebPage, LocalBusiness (the shop: AutoRepair/AutoPartsStore), Service,
 *     Product (only with an offer: price and currency), Article,
 *     BreadcrumbList, FAQPage (kept only where it already was);
 *   - BreadcrumbList: at most one per page; exactly one on every indexable
 *     page except home, none on home; ends at the page's canonical URL; and
 *     matches the visible <nav aria-label="Breadcrumb"> trail, level for
 *     level: same depth, same parent names and links. A page with no visible
 *     trail gets Home > page only;
 *   - BUSINESS.geo, once pasted into src/data/business.js, reaches the shop
 *     as GeoCoordinates with the same numbers.
 *
 * Prints what each route type emits, then any failures. Exit 1 on failure.
 *
 *   npm run build && npm run check:schema
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { BUSINESS } from "../src/data/business.js";
import { AUTHOR } from "../src/content/core.js";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const DIST = resolve(ROOT, "dist");
const ORIGIN = `https://${BUSINESS.domain}`;

if (!existsSync(join(DIST, "index.html"))) {
  console.error("No build in dist/. Run `npm run build` first.");
  process.exit(1);
}

/* ------------------------------ helpers ------------------------------ */

const failures = [];
let page = "";
const fail = (msg) => failures.push(`${page}: ${msg}`);

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory())
      return name === "assets" || name.startsWith(".") ? [] : htmlFiles(path);
    return name.endsWith(".html") ? [path] : [];
  });
}

/** dist/tires.html -> /tires, dist/index.html -> /, dist/a/index.html -> /a */
function routeOf(file) {
  const rel = relative(DIST, file)
    .replace(/\\/g, "/")
    .replace(/\.html$/, "");
  if (rel === "index") return "/";
  return `/${rel.replace(/\/index$/, "")}`;
}

const decode = (s) =>
  s
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCodePoint(parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();

const typesOf = (node) => [].concat(node?.["@type"] ?? []);
const isType = (node, ...names) => typesOf(node).some((t) => names.includes(t));
const isRef = (v) =>
  v &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  Object.keys(v).length === 1 &&
  "@id" in v;
const isAbsUrl = (v) => typeof v === "string" && /^https:\/\/[^\s]+$/.test(v);
const sameUrl = (a, b) => {
  try {
    return decodeURI(a) === decodeURI(b);
  } catch {
    return a === b;
  }
};

/** Every object in the tree, with its path. */
function* walk(value, path = "$") {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++)
      yield* walk(value[i], `${path}[${i}]`);
  } else if (value && typeof value === "object") {
    yield [value, path];
    for (const [k, v] of Object.entries(value)) yield* walk(v, `${path}.${k}`);
  }
}

const LOCAL_BUSINESS = [
  "LocalBusiness",
  "AutoRepair",
  "AutoPartsStore",
  "AutomotiveBusiness",
  "Store",
  "TireShop",
];
const DAYS = new Set([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]);
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const ISO_DATE =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;

// FAQ rich results are retired. FAQPage stays only where it already was;
// a new route family carrying one fails here.
const FAQ_ALLOWED = [
  /^\/blog\/[^/]+$/,
  /^\/learn\/[^/]+\/[^/]+$/,
  /^\/mobile-service(\/[^/]+)?$/,
];

/** BUSINESS.geo, read the way the Seo component reads it. */
function expectedGeo() {
  const pin = BUSINESS.geo;
  if (pin == null) return null;
  const parts = String(pin)
    .split(",")
    .map((s) => s.trim());
  const [lat, lng] = parts.map(Number);
  const ok =
    parts.length === 2 &&
    parts.every((s) => /^-?\d+(\.\d+)?$/.test(s)) &&
    lat >= 24.3 &&
    lat <= 27.3 &&
    lng >= -82.2 &&
    lng <= -79.8;
  return ok ? { latitude: lat, longitude: lng } : "invalid";
}
const GEO = expectedGeo();
if (GEO === "invalid") {
  page = "src/data/business.js";
  fail(
    `geo is ${JSON.stringify(BUSINESS.geo)}: expected "latitude, longitude" ` +
      `inside South Florida, e.g. "26.1xxxxx, -80.2xxxxx" (latitude first, ` +
      `longitude negative). Nothing is published until it parses.`,
  );
}

/* --------------------------- per-type rules --------------------------- */

function checkNode(node, ids, canonical, route) {
  const need = (cond, msg) =>
    cond || fail(`${typesOf(node).join("+")}: ${msg}`);

  if (isType(node, "Organization") && !isType(node, ...LOCAL_BUSINESS)) {
    need(node.name, "no name");
    need(isAbsUrl(node.url), "no url");
    const logo = typeof node.logo === "string" ? node.logo : node.logo?.url;
    // TireDrop itself must carry its logo; the shop's plain Organization
    // stand-in on non-shop pages has none to give.
    if (node["@id"] === `${ORIGIN}/#organization`)
      need(isAbsUrl(logo), "no logo url");
    if (isAbsUrl(logo) && logo.startsWith(ORIGIN))
      need(
        existsSync(join(DIST, new URL(logo).pathname)),
        `logo ${logo} is not a file in the build`,
      );
  }

  if (isType(node, "WebSite")) {
    need(node.name, "no name");
    need(isAbsUrl(node.url), "no url");
    for (const action of [].concat(node.potentialAction ?? [])) {
      if (!isType(action, "SearchAction")) continue;
      const target = action.target?.urlTemplate ?? action.target;
      need(
        typeof target === "string" && target.includes("{search_term_string}"),
        "SearchAction target has no {search_term_string}",
      );
      need(action["query-input"], "SearchAction has no query-input");
    }
  }

  if (isType(node, "WebPage") && canonical) {
    need(
      node.url === canonical,
      `url ${node.url} is not the canonical ${canonical}`,
    );
    need(node.name, "no name");
  }

  if (isType(node, ...LOCAL_BUSINESS)) {
    need(node.name, "no name");
    const a = node.address ?? {};
    need(isType(a, "PostalAddress"), "address is not a PostalAddress");
    for (const k of [
      "streetAddress",
      "addressLocality",
      "addressRegion",
      "postalCode",
      "addressCountry",
    ])
      need(a[k], `address has no ${k}`);
    need(node.telephone, "no telephone");
    need(isAbsUrl(node.url), "no url");
    const hours = node.openingHoursSpecification ?? [];
    need(Array.isArray(hours) && hours.length, "no openingHoursSpecification");
    for (const h of hours) {
      need(
        isType(h, "OpeningHoursSpecification"),
        "hours entry has the wrong @type",
      );
      const days = [].concat(h.dayOfWeek ?? []);
      need(
        days.length && days.every((d) => DAYS.has(d)),
        `bad dayOfWeek ${JSON.stringify(h.dayOfWeek)}`,
      );
      need(
        HHMM.test(h.opens) && HHMM.test(h.closes),
        `bad opens/closes ${h.opens}-${h.closes}`,
      );
      need(
        !(h.opens >= h.closes),
        `opens ${h.opens} is not before closes ${h.closes}`,
      );
    }
    if (node.geo !== undefined) {
      const { latitude, longitude } = node.geo ?? {};
      need(isType(node.geo, "GeoCoordinates"), "geo is not GeoCoordinates");
      need(
        typeof latitude === "number" && typeof longitude === "number",
        "geo latitude/longitude are not numbers",
      );
    }
    if (GEO && GEO !== "invalid") {
      need(
        node.geo?.latitude === GEO.latitude &&
          node.geo?.longitude === GEO.longitude,
        `geo does not match BUSINESS.geo ${BUSINESS.geo}`,
      );
    }
    if (node.hasMap !== undefined)
      need(isAbsUrl(node.hasMap), "hasMap is not a URL");
  }

  if (isType(node, "Service")) {
    need(node.name, "no name");
    need(node.provider, "no provider");
  }

  if (isType(node, "Product")) {
    need(node.name, "no name");
    need(node.sku, "no sku");
    need(node.brand?.name, "no brand name");
    const offers = [].concat(node.offers ?? []);
    need(
      offers.length,
      "no offers: Google rejects a Product with no offers, review or rating",
    );
    for (const o of offers) {
      need(o.price !== undefined && o.price !== "", "offer has no price");
      need(o.priceCurrency, "offer has no priceCurrency");
    }
    if (node.image !== undefined)
      need([].concat(node.image).every(isAbsUrl), "image is not an https URL");
  }

  if (isType(node, "Article", "BlogPosting", "NewsArticle")) {
    need(node.headline, "no headline");
    need(
      String(node.headline ?? "").length <= 110,
      "headline over 110 characters",
    );
    need(node.image, "no image");
    const authors = [].concat(node.author ?? []);
    need(authors.length, "no author");
    for (const au of authors) {
      need(
        isType(au, "Organization"),
        `author is ${typesOf(au).join("+") || "untyped"}, not an Organization`,
      );
      need(au.name === AUTHOR, `author name "${au.name}" is not "${AUTHOR}"`);
    }
    for (const k of ["datePublished", "dateModified"]) {
      need(
        ISO_DATE.test(node[k] ?? "") && !Number.isNaN(Date.parse(node[k])),
        `${k} "${node[k]}" is not ISO 8601`,
      );
      need(
        Date.parse(node[k]) <= Date.now() + 36e5 * 36,
        `${k} ${node[k]} is in the future`,
      );
    }
    need(
      !(Date.parse(node.dateModified) < Date.parse(node.datePublished)),
      "dateModified is before datePublished",
    );
    need(node.publisher, "no publisher");
  }

  if (isType(node, "FAQPage")) {
    need(
      FAQ_ALLOWED.some((re) => re.test(route)),
      "new FAQPage: FAQ rich results are retired, do not add more",
    );
    const qs = [].concat(node.mainEntity ?? []);
    need(qs.length, "no questions");
    for (const q of qs) {
      need(isType(q, "Question") && q.name, "question with no name");
      need(
        isType(q.acceptedAnswer, "Answer") && q.acceptedAnswer.text,
        `"${q.name}" has no answer text`,
      );
    }
  }

  if (isType(node, "BreadcrumbList")) {
    const items = node.itemListElement ?? [];
    need(items.length >= 2, "fewer than 2 items");
    items.forEach((it, i) => {
      need(isType(it, "ListItem"), `item ${i + 1} is not a ListItem`);
      need(it.position === i + 1, `item ${i + 1} has position ${it.position}`);
      need(
        typeof it.name === "string" && it.name.trim(),
        `item ${i + 1} has no name`,
      );
      const url = typeof it.item === "string" ? it.item : it.item?.["@id"];
      need(
        isAbsUrl(url) && url.startsWith(`${ORIGIN}/`),
        `item ${i + 1} url ${url} is not on ${ORIGIN}`,
      );
    });
    const last = items.at(-1);
    need(
      last && last.item === canonical,
      `last item ${last?.item} is not the canonical ${canonical}`,
    );
  }
}

/** The visible <Breadcrumbs> trail: [{ name, href|null }]. */
function visibleTrails(html) {
  return [...html.matchAll(/<nav aria-label="Breadcrumb"[\s\S]*?<\/nav>/g)].map(
    ([nav]) =>
      [...nav.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(([, li]) => {
        const a = /<a [^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/.exec(li);
        if (a) return { name: decode(a[2]), href: decode(a[1]) };
        const span = /<span[^>]*>([\s\S]*?)<\/span>/.exec(li);
        return { name: decode(span ? span[1] : li), href: null };
      }),
  );
}

/* ------------------------------- route types ------------------------------- */

const ROUTE_TYPES = [
  ["home", (r) => r === "/"],
  ["/tires", (r) => r === "/tires"],
  ["product /tires|/wheels/:slug", (r) => /^\/(tires|wheels)\/[^/]+$/.test(r)],
  ["/services/:slug", (r) => /^\/services\/[^/]+$/.test(r)],
  ["/mobile-service", (r) => r === "/mobile-service"],
  ["city /mobile-service/*-fl", (r) => /^\/mobile-service\/[^/]+-fl$/.test(r)],
  [
    "tool pages",
    (r) =>
      /^\/(find-my-tires|tire-size|tire-check|load-speed-check|plus-size-calculator|tire-pressure-temperature|can-my-tire-be-repaired|car-shaking-checker|tire-rotation-pattern)$/.test(
        r,
      ),
  ],
  [
    "learn/blog articles",
    (r) => /^\/(learn\/[^/]+\/[^/]+|blog\/[^/]+)$/.test(r),
  ],
  ["learn/blog hubs", (r) => /^\/(learn|blog)(\/[^/]+)?$/.test(r)],
  ["/locations", (r) => r === "/locations"],
  ["/contact", (r) => r === "/contact"],
  ["other pages", () => true],
];
const summary = new Map(
  ROUTE_TYPES.map(([name]) => [name, { pages: 0, types: new Map() }]),
);

/* --------------------------------- run --------------------------------- */

const files = htmlFiles(DIST).sort();
let blocksTotal = 0;
let crumbsChecked = 0;
let nodesTotal = 0;

for (const file of files) {
  page = relative(ROOT, file);
  const html = readFileSync(file, "utf8");
  const route = routeOf(file);
  const special = route === "/404" || route === "/spa";
  const robots = /<meta name="robots" content="([^"]*)"/.exec(html)?.[1] ?? "";
  const indexable = !special && !/noindex/i.test(robots);
  const canonical = /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1];
  if (!special && !canonical) fail("no canonical link");

  const blocks = [
    ...html.matchAll(
      /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
    ),
  ].map((m) => m[1]);
  blocksTotal += blocks.length;
  if (!blocks.length) {
    if (indexable) fail("no JSON-LD");
    continue;
  }

  const roots = [];
  for (const [i, text] of blocks.entries()) {
    try {
      roots.push(JSON.parse(text));
    } catch (e) {
      fail(`JSON-LD block ${i + 1} does not parse: ${e.message}`);
    }
  }

  const nodes = roots.flatMap((r) =>
    Array.isArray(r["@graph"]) ? r["@graph"] : [r],
  );
  nodesTotal += nodes.length;
  for (const r of roots)
    if (r["@context"] !== "https://schema.org")
      fail(`@context is ${r["@context"]}`);

  // Every @id declared on the page, at any depth, and every reference.
  const ids = new Map();
  for (const [obj] of roots.flatMap((r) => [...walk(r)]))
    if (obj["@id"] && !isRef(obj)) {
      if (ids.has(obj["@id"])) fail(`@id ${obj["@id"]} is declared twice`);
      ids.set(obj["@id"], obj);
    }
  for (const root of roots)
    for (const [obj, path] of walk(root)) {
      if (isRef(obj) && !ids.has(obj["@id"]))
        fail(`${path} references ${obj["@id"]}, which is not on the page`);
      for (const [k, v] of Object.entries(obj)) {
        if (v === null || v === "" || (Array.isArray(v) && !v.length))
          fail(`${path}.${k} is ${JSON.stringify(v)}`);
        if (/^(aggregateRating|reviews?|ratingValue|reviewRating)$/i.test(k))
          fail(
            `${path}.${k}: no rating or review markup until reviews are real`,
          );
      }
      if (isType(obj, "Review", "AggregateRating", "Rating"))
        fail(
          `${path} is a ${typesOf(obj).join("+")}: no rating or review markup`,
        );
      if (isType(obj, "Person"))
        fail(`${path} is a Person: authors are the organization`);
    }

  for (const node of nodes) checkNode(node, ids, canonical, route);

  // Breadcrumbs.
  const lists = nodes.filter((n) => isType(n, "BreadcrumbList"));
  const microdata = (
    html.match(/itemtype="https?:\/\/schema\.org\/BreadcrumbList"/g) ?? []
  ).length;
  if (lists.length + microdata > 1)
    fail(`${lists.length + microdata} BreadcrumbLists (want one)`);
  if (route === "/" && lists.length) fail("home has a BreadcrumbList");
  if (indexable && route !== "/" && lists.length !== 1)
    fail(
      `${lists.length} BreadcrumbLists on an indexable page (want exactly 1)`,
    );

  const visible = visibleTrails(html);
  if (visible.length > 1) fail(`${visible.length} visible breadcrumb trails`);
  if (lists.length === 1) {
    crumbsChecked++;
    const items = lists[0].itemListElement ?? [];
    const trail = visible[0];
    if (!trail) {
      if (items.length !== 2)
        fail(
          `no visible breadcrumb, but the BreadcrumbList has ${items.length} levels (want Home > page)`,
        );
    } else if (trail.length !== items.length) {
      fail(
        `BreadcrumbList "${items.map((i) => i.name).join(" > ")}" does not match the visible ` +
          `"${trail.map((t) => t.name).join(" > ")}"`,
      );
    } else {
      trail.forEach((crumb, i) => {
        const item = items[i];
        if (i === trail.length - 1) return; // the page itself: checked against canonical
        if (crumb.name.toLowerCase() !== String(item.name).toLowerCase())
          fail(
            `breadcrumb level ${i + 1} is "${item.name}", visible "${crumb.name}"`,
          );
        if (!crumb.href || !sameUrl(item.item, `${ORIGIN}${crumb.href}`))
          fail(
            `breadcrumb level ${i + 1} links ${item.item}, visible ${crumb.href}`,
          );
      });
    }
  }

  // Route-type summary.
  const [kind] = ROUTE_TYPES.find(([, test]) => test(route));
  const s = summary.get(kind);
  s.pages++;
  for (const n of nodes) {
    const t = typesOf(n).join("+");
    s.types.set(t, (s.types.get(t) ?? 0) + 1);
  }
}

/* -------------------------------- report -------------------------------- */

console.log(
  `check:schema  ${files.length} pages, ${blocksTotal} JSON-LD blocks, ${nodesTotal} nodes\n`,
);
for (const [kind, { pages, types }] of summary) {
  if (!pages) continue;
  const list = [...types]
    .map(([t, n]) =>
      n === pages
        ? t
        : n % pages
          ? `${t} (${n} of ${pages})`
          : `${t} x${n / pages}`,
    )
    .join(", ");
  console.log(`  ${kind.padEnd(30)} ${String(pages).padStart(3)}  ${list}`);
}
console.log(
  `\n  BreadcrumbLists checked against the visible trail: ${crumbsChecked}` +
    `\n  Shop geo: ${GEO && GEO !== "invalid" ? `${GEO.latitude}, ${GEO.longitude}` : "not published (BUSINESS.geo is null: TODO(geo))"}` +
    `\n  /tires/p/:sku is client-rendered (dist/spa.html) and noindexed: no JSON-LD in its served HTML.`,
);

if (failures.length) {
  console.error(`\n${failures.length} problem(s):`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log("\nOK");
