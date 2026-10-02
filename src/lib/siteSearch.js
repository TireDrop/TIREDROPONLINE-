/**
 * Store-wide search: what the header's typeahead and /search suggest for
 * what a shopper typed. Pure: no React, no window, no fetch, so the unit
 * tests (siteSearch.test.mjs) run it under Node with the same data.
 *
 *   searchSite("225/45", data)       -> the size, and catalog sizes it starts
 *   searchSite("michelin", data)     -> the brand, then its tires
 *   searchSite("rotation", data)     -> the rotation tool, service and guides
 *   searchSite("2019 bmw 3 series")  -> that vehicle on /tires
 *
 * Groups, in order: sizes, vehicles, brands, products, pages. `data` is
 *
 *   tires, wheels        catalog products (src/data/products.js), or what
 *                        the tire search API answered for a typed size
 *                        (`sizeProducts`)
 *   tireBrands,          brand names (TIRE_BRAND_NAMES, WHEEL_BRAND_NAMES)
 *   wheelBrands
 *   categories           tire categories (TIRE_CATEGORIES)
 *   makes                vehicle make names (src/data/vehicleList.js)
 *   pages                the page index (src/lib/sitePages.js): every page,
 *                        tool, service, city page and guide, built from the
 *                        router's own data so nothing links to a missing page
 *
 * With `limit` (the typeahead's 8) each group is capped and the groups share
 * the rows in turn, so a brand search still shows a page or two. Without
 * it, every match is returned (the /search page).
 */

/* ------------------------------------------------------------------ *
 * Text
 * ------------------------------------------------------------------ */

/** Lowercase, accents and punctuation folded to spaces: "Truck & SUV" -> "truck and suv". */
export function normalizeText(text) {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9.]+/g, " ")
    .replace(/(^|\s)\.+|\.+(?=\s|$)/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** "tires" and "tire" are one word; so are "guides" and "guide". */
const stem = (word) =>
  word.length > 3 && word.endsWith("s") && !word.endsWith("ss")
    ? word.slice(0, -1)
    : word;

/** The words of a text, normalised and stemmed. */
export function words(text) {
  const n = normalizeText(text);
  return n ? n.split(" ").map(stem) : [];
}

/** Letters and digits only: "BF Goodrich" and "BFGoodrich" compare equal. */
export const compact = (text) =>
  String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

// Words that say nothing about what is wanted on a tire store. They still
// count when they are all there is ("tires").
const GENERIC = new Set(
  [
    "a", "an", "and", "the", "for", "my", "of", "to", "in", "on", "at", "with",
    "how", "what", "is", "do", "does", "i", "me", "near", "best", "new", "buy",
    "shop", "online", "tire", "tires", "page",
  ].map(stem),
);

/** One edit apart (a typo): insert, delete or substitute one character. */
function oneEdit(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  return a.length > b.length
    ? a.slice(i + 1) === b.slice(i)
    : a.slice(i) === b.slice(i + 1);
}

/**
 * How well `token` matches one of `list` (already stemmed words):
 * 3 the whole word, 2 the start of one, 1 a one-letter typo, 0 none.
 */
function tokenScore(token, list, { fuzzy = true } = {}) {
  let best = 0;
  for (const word of list) {
    if (word === token) return 3;
    if (word.startsWith(token)) best = Math.max(best, 2);
    else if (
      fuzzy &&
      best < 1 &&
      token.length >= 5 &&
      (oneEdit(token, word) || oneEdit(token, word.slice(0, token.length)))
    )
      best = 1;
  }
  return best;
}

/** The query's tokens: the meaningful ones, or all of them if none are. */
function queryTokens(text) {
  const all = words(text);
  const meaningful = all.filter((w) => !GENERIC.has(w));
  return meaningful.length ? meaningful : all;
}

/* ------------------------------------------------------------------ *
 * Tire sizes
 * ------------------------------------------------------------------ */

// Metric widths run in 10 mm steps ending in 5 (195, 205, 225 … 355), which
// is also what keeps a year ("2019") or a ZIP ("33325") from reading as one.
const widthOk = (w) => w >= 125 && w <= 455 && w % 10 === 5;
const aspectOk = (a) => a >= 25 && a <= 95 && a % 5 === 0;
const rimOk = (r) => r >= 12 && r <= 30;

const METRIC_CORE =
  /^(\d{3})(?:[\s/-]*(\d{1,2})(?:[\s/-]*Z?R?[\s/-]*(\d{1,2})?)?)?[\s/-]*$/;
const FLOTATION =
  /^(\d{2}(?:\.\d{1,2})?)\s*X\s*(\d{1,2}(?:\.\d{1,2})?)\s*(?:Z?R|-)?\s*(\d{2})\s*(?:LT)?$/;

/**
 * A tire size as typed, complete or partial, or null:
 *
 *   "225/45R17", "2254517", "225 45 17", "225/45-17", "P225/45R17",
 *   "225/45ZR17 94W", "LT265/70R17", "31x10.50R15"   complete
 *   "225", "225/4", "225/45", "22545", "225/45R1"    partial
 *
 * `{ complete, width, aspect, rim, aspectStart, rimStart, display, param }`:
 * `display` is the site's spelling (225/45R17, LT265/70R17,
 * 31x10.50R15LT; a P prefix is dropped, as the rest of the site does),
 * `param` the /tires?size= value (225-45r17). For a partial size `aspect`
 * or `rim` is null and `aspectStart` / `rimStart` hold a digit typed so far.
 */
export function readTypedSize(input) {
  let s = String(input ?? "")
    .toUpperCase()
    .trim()
    .replace(/\s+/g, " ");
  if (!s || s.length > 32) return null;

  const f = FLOTATION.exec(s);
  if (f) {
    const diameter = Number(f[1]);
    const rim = Number(f[3]);
    if (diameter < 26 || diameter > 44 || rim < 14 || rim > 26) return null;
    // 10.5 is written 10.50 on the sidewall.
    const width = /\.\d$/.test(f[2]) ? `${f[2]}0` : f[2];
    const display = `${f[1]}x${width}R${rim}LT`;
    return {
      complete: true,
      flotation: true,
      width: null,
      aspect: null,
      rim,
      aspectStart: "",
      rimStart: "",
      display,
      param: display.toLowerCase(),
    };
  }

  let prefix = "";
  const pre = /^(P|LT|ST)\s*(?=\d)/.exec(s);
  if (pre) {
    prefix = pre[1] === "P" ? "" : pre[1];
    s = s.slice(pre[0].length);
  }
  // A load index and speed rating after the size: "225/45R17 94W".
  s = s.replace(/\s+\d{2,3}(?:\/\d{2,3})?\s?[A-Z]{1,2}$/, "");
  let suffix = "";
  const post = /(\d)\s*(LT|C)$/.exec(s);
  if (post) {
    suffix = post[2];
    s = s.slice(0, post.index + 1);
  }

  const m = METRIC_CORE.exec(s);
  if (!m) return null;
  const width = Number(m[1]);
  if (!widthOk(width)) return null;
  const aspectText = m[2] ?? "";
  const rimText = m[3] ?? "";

  const aspect = aspectText.length === 2 ? Number(aspectText) : null;
  if (aspectText.length === 2 && !aspectOk(aspect)) return null;
  if (aspect == null && rimText) return null;
  const rim = rimText.length === 2 ? Number(rimText) : null;
  if (rimText.length === 2 && !rimOk(rim)) return null;

  const complete = aspect != null && rim != null;
  const display = complete
    ? `${prefix}${width}/${aspect}R${rim}${suffix}`
    : aspect != null
      ? `${width}/${aspect}`
      : String(width);
  return {
    complete,
    flotation: false,
    width,
    aspect,
    rim,
    aspectStart: aspect == null ? aspectText : "",
    rimStart: rim == null ? rimText : "",
    display,
    param: complete ? display.toLowerCase().replace("/", "-") : "",
  };
}

/** Where a typed size is shopped: the size itself, or a partial-size filter on /tires. */
export function sizePath(size) {
  if (!size) return null;
  if (size.complete) return `/tires?size=${size.param}`;
  return size.aspect != null
    ? `/tires?w=${size.width}&a=${size.aspect}`
    : `/tires?w=${size.width}`;
}

const SIZE_IN_TEXT =
  /(?:^|\s)((?:P|LT|ST)?\d{3}[\s/-]?\d{2}[\s/-]*Z?R?[\s/-]*\d{2}(?:LT|C)?)(?=\s|$)/i;

/**
 * A complete size somewhere in a longer query ("michelin 225/45r17"), and
 * the rest of the text: `{ size, rest }`. The whole query is tried first.
 */
export function extractSize(text) {
  const whole = readTypedSize(text);
  if (whole) return { size: whole, rest: "" };
  const m = SIZE_IN_TEXT.exec(String(text ?? ""));
  if (!m) return { size: null, rest: String(text ?? "") };
  const size = readTypedSize(m[1]);
  if (!size?.complete) return { size: null, rest: String(text ?? "") };
  const rest = (text.slice(0, m.index) + " " + text.slice(m.index + m[0].length)).trim();
  return { size, rest };
}

/** True when a product (catalog or API shape) is in the typed size. */
function inSize(product, size) {
  const own = readTypedSize(product.size);
  if (!own) return false;
  if (size.flotation || own.flotation) return size.complete && own.display === size.display;
  if (own.width !== size.width) return false;
  if (size.aspect != null && own.aspect !== size.aspect) return false;
  if (size.aspect == null && size.aspectStart && !String(own.aspect).startsWith(size.aspectStart))
    return false;
  if (size.rim != null && own.rim !== size.rim) return false;
  if (size.rim == null && size.rimStart && !String(own.rim).startsWith(size.rimStart))
    return false;
  return true;
}

function sizeItems(size, tires) {
  const items = [];
  const path = sizePath(size);
  if (size.complete) {
    items.push({
      id: `size:${size.param}`,
      label: `Shop ${size.display} tires`,
      detail: "Tire size",
      path,
    });
    return items;
  }
  // The sizes in the catalog this could be, before the generic filter.
  const known = [];
  for (const t of tires) {
    const own = readTypedSize(t.size);
    if (!own?.complete || own.flotation || known.includes(own.display)) continue;
    if (inSize(t, size)) known.push(own.display);
  }
  known.sort();
  for (const display of known.slice(0, 2)) {
    const r = readTypedSize(display);
    items.push({
      id: `size:${r.param}`,
      label: `Shop ${display} tires`,
      detail: "Tire size",
      path: sizePath(r),
    });
  }
  items.push({
    id: `size:${path}`,
    label:
      size.aspect != null
        ? `Shop ${size.width}/${size.aspect} tires`
        : `Shop ${size.width}-wide tires`,
    detail: size.aspect != null ? "Any rim size" : "Any profile and rim size",
    path,
  });
  return items;
}

/* ------------------------------------------------------------------ *
 * Vehicles
 * ------------------------------------------------------------------ */

const MIN_YEAR = 1981;
const MAX_YEAR = 2027;

// "3 series" -> "3 Series", "f-150" -> "F-150", "rav4" -> "RAV4".
const modelCase = (text) =>
  text
    .split(" ")
    .map((w) => (/\d/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");

const enc = (v) => encodeURIComponent(v).replace(/%20/g, "+");

/**
 * "2019 BMW 3 Series" (or "bmw 3 series 2019") -> the vehicle on /tires:
 * `{ year, make, model, path }`, or null. Needs a year, a make from `makes`
 * and a model after it.
 */
export function readVehicle(text, makes = []) {
  const t = String(text ?? "").trim().replace(/\s+/g, " ");
  const m = /^(\d{4})\s+(.+)$/.exec(t) ?? /^(.+?)\s+(\d{4})$/.exec(t);
  if (!m) return null;
  const [year, rest] = /^\d{4}$/.test(m[1]) ? [m[1], m[2]] : [m[2], m[1]];
  const y = Number(year);
  if (y < MIN_YEAR || y > MAX_YEAR) return null;
  const restNorm = rest.toLowerCase();
  // Longest make first, so "Land Rover" wins over a make called "Land".
  const make = [...makes]
    .sort((a, b) => b.length - a.length)
    .find((name) => {
      const n = name.toLowerCase();
      return restNorm === n || restNorm.startsWith(`${n} `);
    });
  if (!make) return null;
  const model = rest
    .slice(make.length)
    .trim()
    .replace(/[^a-z0-9 .&'+/-]/gi, "")
    .toLowerCase();
  if (!model || model.length > 60) return null;
  return {
    year: String(y),
    make,
    model: modelCase(model),
    path: `/tires?year=${y}&make=${enc(make.toLowerCase())}&model=${enc(model)}`,
  };
}

/* ------------------------------------------------------------------ *
 * Brands and products
 * ------------------------------------------------------------------ */

/** "/tires?brand=" takes the slug, as src/lib/tiresUrl.js writes it. */
const slugOf = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function brandMatches(brand, tokens, text) {
  const own = words(brand);
  if (tokens.every((t) => tokenScore(t, own) >= 2)) return true;
  // "bf goodrich" for BFGoodrich, or a brand then more words.
  const typed = compact(tokens.join(""));
  const name = compact(brand);
  return typed.length >= 2 && (name.startsWith(typed) || compact(text).startsWith(name));
}

function brandItems(query, tokens, { tireBrands = [], wheelBrands = [], categories = [] }) {
  const items = [];
  for (const brand of tireBrands) {
    if (brandMatches(brand, tokens, query))
      items.push({
        id: `brand:tire:${brand}`,
        label: `${brand} tires`,
        detail: "Brand",
        path: `/tires?brand=${slugOf(brand)}`,
        brand,
      });
  }
  for (const brand of wheelBrands) {
    if (brandMatches(brand, tokens, query))
      items.push({
        id: `brand:wheel:${brand}`,
        label: `${brand} wheels`,
        detail: "Brand",
        path: `/wheels?brands=${encodeURIComponent(brand)}`,
        brand,
      });
  }
  for (const category of categories) {
    if (tokens.every((t) => tokenScore(t, words(category), { fuzzy: false }) >= 2))
      items.push({
        id: `category:${category}`,
        label: `${category} tires`,
        detail: "Tire type",
        path: `/tires?category=${slugOf(category)}`,
      });
  }
  return items;
}

/** A product's own page: its catalog slug, else /tires/p/<sku> (live tires). */
export function productPath(p) {
  const base = p.kind === "wheel" ? "/wheels" : "/tires";
  if (p.slug) return `${base}/${p.slug}`;
  const sku = p.sku ?? p.id;
  return p.kind !== "wheel" && sku ? `/tires/p/${encodeURIComponent(sku)}` : null;
}

function productItem(p) {
  const wheel = p.kind === "wheel";
  return {
    id: `product:${p.id ?? p.sku}`,
    label: `${p.brand} ${p.model}`.trim(),
    detail: wheel
      ? [p.diameter ? `${p.diameter}"` : "", p.finish, "wheel"].filter(Boolean).join(" · ")
      : [p.size, p.category].filter(Boolean).join(" · "),
    path: productPath(p),
    brand: p.brand,
  };
}

function productScore(p, tokens) {
  const name = words(`${p.brand} ${p.model}`);
  const other = words(
    [
      p.category,
      p.seasons,
      p.kind === "wheel" ? "wheel rim" : "tire",
      p.finish,
      p.style,
      p.kind === "wheel" && p.diameter ? `${p.diameter} inch` : "",
    ]
      .filter(Boolean)
      .join(" "),
  );
  let score = 0;
  for (const t of tokens) {
    const s = Math.max(tokenScore(t, name) * 2, tokenScore(t, other, { fuzzy: false }));
    if (!s) return 0;
    score += s;
  }
  return score;
}

function productItems({ size, rest, tokens }, { tires = [], wheels = [], sizeProducts }) {
  if (size) {
    const restTokens = queryTokens(rest);
    const pool = sizeProducts ?? tires.filter((t) => inSize(t, size));
    return pool
      .filter((p) => !restTokens.length || productScore(p, restTokens) > 0)
      .map(productItem)
      .filter((i) => i.path);
  }
  return [...tires, ...wheels]
    .map((p) => ({ p, score: productScore(p, tokens) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || `${a.p.brand} ${a.p.model}`.localeCompare(`${b.p.brand} ${b.p.model}`))
    .map((x) => productItem(x.p))
    .filter((i) => i.path);
}

/* ------------------------------------------------------------------ *
 * Pages
 * ------------------------------------------------------------------ */

export const PAGE_TYPE_LABEL = {
  page: "Page",
  tool: "Free tool",
  service: "Service",
  area: "Mobile service area",
  topic: "Learn topic",
  guide: "Guide",
  blog: "Blog",
};

/** Words of a page entry, worked out once per entry. */
const pageWords = new WeakMap();
function wordsOf(page) {
  let w = pageWords.get(page);
  if (!w) {
    w = {
      title: words(page.title),
      keywords: words(page.keywords),
      text: words(page.text),
    };
    pageWords.set(page, w);
  }
  return w;
}

function pageScore(page, tokens, phrase) {
  const w = wordsOf(page);
  let score = 0;
  for (const t of tokens) {
    const s = Math.max(
      tokenScore(t, w.title) * 2,
      tokenScore(t, w.keywords),
      tokenScore(t, w.text, { fuzzy: false }) > 1 ? 1 : 0,
    );
    if (!s) return 0;
    score += s;
  }
  const title = normalizeText(page.title);
  if (phrase && title.startsWith(phrase)) score += 4;
  else if (phrase && title.includes(phrase)) score += 2;
  return score + (page.boost ?? 0);
}

function pageItems(query, tokens, pages = []) {
  const phrase = normalizeText(query);
  return pages
    .map((page) => ({ page, score: pageScore(page, tokens, phrase) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.page.title.length - b.page.title.length)
    .map(({ page }) => ({
      id: `page:${page.path}`,
      label: page.title,
      detail: PAGE_TYPE_LABEL[page.type] ?? "Page",
      path: page.path,
      text: page.text ?? "",
      type: page.type,
    }));
}

/* ------------------------------------------------------------------ *
 * Search
 * ------------------------------------------------------------------ */

export const GROUP_LABEL = {
  sizes: "Tire sizes",
  vehicles: "Vehicles",
  brands: "Brands & tire types",
  products: "Tires & wheels",
  pages: "Pages & guides",
};

/** Per-group caps in the typeahead. */
const CAPS = { sizes: 3, vehicles: 1, brands: 2, products: 3, pages: 4 };

// MIN_QUERY (the fewest characters worth searching) and searchPath (the
// /search address for a query) live in ./searchPath.js, so the masthead can
// use them before this file has loaded.
import { MIN_QUERY, searchPath } from "./searchPath.js";

export { MIN_QUERY, searchPath };

/**
 * `{ query, size, vehicle, groups: [{ id, label, items }], count }` for what
 * was typed. Each item is `{ id, label, detail, path }`. Groups with nothing
 * in them are left out.
 */
export function searchSite(query, data = {}, { limit = Infinity } = {}) {
  const text = String(query ?? "").trim().replace(/\s+/g, " ");
  const empty = { query: text, size: null, vehicle: null, groups: [], count: 0 };
  if (text.length < MIN_QUERY || text.length > 100) return empty;

  const { size, rest } = extractSize(text);
  const tokens = queryTokens(size ? rest : text);
  const vehicle = size ? null : readVehicle(text, data.makes);

  const found = {
    sizes: size ? sizeItems(size, data.tires ?? []) : [],
    vehicles: vehicle
      ? [
          {
            id: `vehicle:${vehicle.path}`,
            label: `Tires for a ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            detail: "Shop by vehicle",
            path: vehicle.path,
          },
        ]
      : [],
    brands: !size && tokens.length ? brandItems(text, tokens, data) : [],
    products: productItems({ size, rest, tokens }, data),
    pages:
      tokens.length && !(size && !rest)
        ? pageItems(size ? rest : text, tokens, data.pages)
        : [],
  };
  if (vehicle) {
    // A vehicle query names a make, not a tire: keep the products and pages
    // it matched on the make alone out of the way.
    found.products = [];
  }

  const order = ["sizes", "vehicles", "brands", "products", "pages"];
  let picked;
  if (Number.isFinite(limit)) {
    // Capped per group, then the groups take turns, so no one kind of
    // answer pushes every other off the list.
    const queues = Object.fromEntries(
      order.map((id) => [id, found[id].slice(0, CAPS[id])]),
    );
    picked = Object.fromEntries(order.map((id) => [id, []]));
    let total = 0;
    let added = true;
    while (total < limit && added) {
      added = false;
      for (const id of order) {
        if (total >= limit) break;
        const next = queues[id].shift();
        if (next) {
          picked[id].push(next);
          total += 1;
          added = true;
        }
      }
    }
  } else {
    picked = found;
  }

  const groups = order
    .filter((id) => picked[id].length)
    .map((id) => ({
      id,
      label: GROUP_LABEL[id],
      items: picked[id].map((item) => ({ ...item, group: id })),
    }));
  return {
    query: text,
    size,
    vehicle,
    groups,
    count: groups.reduce((n, g) => n + g.items.length, 0),
  };
}

/**
 * Where pressing Enter (or the Search button) goes with nothing highlighted,
 * the header search's behaviour from before the typeahead: a size to that
 * size, a brand to its tires, a category to it, a model to its page.
 * Anything else goes to /search.
 */
export function submitPath(query, data = {}) {
  const text = String(query ?? "").trim();
  if (!text) return null;

  const size = readTypedSize(text);
  if (size) return sizePath(size);

  const lower = text.toLowerCase();
  const brands = data.tireBrands ?? [];
  const brand =
    brands.find((b) => b.toLowerCase() === lower) ??
    (lower.length >= 2 ? brands.find((b) => b.toLowerCase().startsWith(lower)) : null);
  if (brand) return `/tires?brand=${slugOf(brand)}`;

  const categories = data.categories ?? [];
  const category =
    categories.find((c) => c.toLowerCase() === lower) ??
    (lower.length >= 3 ? categories.find((c) => c.toLowerCase().includes(lower)) : null);
  if (category) return `/tires?category=${slugOf(category)}`;

  const product =
    lower.length >= 3
      ? (data.tires ?? []).find((t) => `${t.brand} ${t.model}`.toLowerCase().includes(lower))
      : null;
  if (product) return productPath(product);

  const vehicle = readVehicle(text, data.makes);
  if (vehicle) return vehicle.path;

  return searchPath(text);
}
