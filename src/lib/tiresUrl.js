/**
 * The /tires address bar: what is being shopped for, the filters and the
 * sort, as human-readable query parameters, so a link is shareable and the
 * back button restores the page.
 *
 *   /tires?year=2019&make=ford&model=f-150
 *   /tires?size=265-70r17&season=all-season&type=all-terrain
 *         &brand=continental,nitto&price=100-250&speed=h&load=110
 *         &load_range=e&warranty=60000&rim=17&sort=price-asc
 *
 *   year, make, model   the vehicle (make and model lowercased, spaces as +)
 *   size                a sidewall size: 265-70r17, lt265-70r17, 31x10.50r15lt
 *                       (265/70R17 and LT265/70R17 are read too)
 *   rear                the rear size of a staggered door-jamb entry, only
 *                       with size: size=225-40r19&rear=255-35r19
 *   season              all-season, all-weather, summer, winter (a list)
 *   type                touring, performance, highway, all-terrain,
 *                       mud-terrain, commercial (a list)
 *   brand, category     catalog brands and categories, as slugs (lists)
 *   price               price per tire: 100-250, 100- or -250
 *   speed               minimum speed rating: h = H or higher
 *   load                minimum load index: 110 = 110 or higher
 *   load_range          load ranges / XL (a list): e, xl
 *   runflat             1 = run-flat tires only
 *   warranty            minimum treadwear warranty in miles: 60000
 *   rim                 rim diameters (a list): 17,18
 *   w, a, d             a partial size typed into the finder (filters only)
 *   sort                price-asc, price-desc, warranty, brand, wear, wet
 *   view, search        page states: view=brands, search=vehicle|size
 *
 * The older keys (vy/vmk/vmd, brands, cats, dia, minp, maxp) are still read
 * and rewritten into these. Anything unknown or malformed is dropped rather
 * than guessed at, except campaign and click ids (utm_*, gclid and the
 * like), which analytics reads and which are kept as they are. There is no
 * pagination on /tires, so there is no page=.
 *
 * Pure: no React, no window. `vocab` supplies the lists that turn a slug
 * back into the catalog's own spelling (brands, categories, makes, models);
 * without it a value is title-cased, and a model gets modelFromUrl()'s
 * best guess ("cx-5" -> "CX-5").
 */

import { readSize, vehicleLabel } from "../data/fitmentCheck.js";

export const SEASON_VALUES = ["all-season", "all-weather", "summer", "winter"];
export const TYPE_VALUES = [
  "touring",
  "performance",
  "highway",
  "all-terrain",
  "mud-terrain",
  "commercial",
];
/** Speed ratings, slowest first. */
export const SPEED_ORDER = ["L", "M", "N", "P", "Q", "R", "S", "T", "U", "H", "V", "W", "Y"];
export const SORT_VALUES = ["best", "price-asc", "price-desc", "warranty", "brand", "wear", "wet"];

export const EMPTY_TIRE_FILTERS = Object.freeze({
  seasons: [],
  types: [],
  brands: [],
  categories: [],
  diameters: [],
  minPrice: "",
  maxPrice: "",
  speed: "",
  load: "",
  loadRanges: [],
  runFlat: false,
  warranty: "",
});

// The same list src/main.jsx lets hydrate: read by analytics, never a page.
const TRACKING =
  /^(utm_[a-z_]+|gclid|gbraid|wbraid|dclid|fbclid|msclkid|ttclid|twclid|li_fat_id|mc_cid|mc_eid|_gl|_ga|_kx|srsltid)$/i;

const MIN_YEAR = 1960;
// Manufacturers sell next year's models well before the year turns.
const maxYear = () => new Date().getFullYear() + 2;

/** Lowercase, punctuation folded to "-": "Truck & SUV" -> "truck-suv". */
export const slug = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Spelling-blind: "F-150", "f150" and "F 150" are one model. */
const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const titleCase = (s) =>
  s.replace(/(^|[\s-])([a-z])/g, (_, sep, c) => sep + c.toUpperCase());

/** The catalog's spelling of `raw` from `list`, or null. */
export function spellingIn(list, raw) {
  const n = norm(raw);
  if (!n) return null;
  return (list ?? []).find((item) => norm(item) === n) ?? null;
}
const pick = spellingIn;

// Letters-only model-name parts that are written in capitals: "cx" in CX-5,
// "hr" in C-HR, "wrx", "hd". Only these: "ion" and "fit" are words.
// prettier-ignore
const MODEL_ABBREVIATIONS = new Set([
  "amg", "cc", "cl", "cla", "clk", "cls", "cr", "ct", "cts", "cx", "dts", "es", "ev", "ex",
  "fj", "fr", "fx", "gl", "gla", "glb", "glc", "gle", "glk", "gls", "gs", "gt", "gti", "gto",
  "gtr", "gx", "hd", "hhr", "hr", "id", "is", "jx", "lc", "le", "ls", "lt", "lx", "mdx", "mkc",
  "mks", "mkt", "mkx", "mkz", "mx", "nsx", "nv", "nx", "qx", "rc", "rdx", "rl", "rlx", "rs",
  "rsx", "rx", "sc", "se", "sl", "slk", "sq", "srt", "srx", "ss", "ssr", "st", "sti", "sts",
  "suv", "svt", "sx", "tl", "tlx", "tsx", "tt", "tts", "ux", "wrx", "xc", "xe", "xf", "xj",
  "xk", "xl", "xlt", "xt", "xts", "xv", "zdx",
]);

const capital = (w) => w.charAt(0).toUpperCase() + w.slice(1);

/**
 * A model from the URL that no list knows, in a best-guess spelling. The URL
 * is lowercase ("cx-5"), so title case alone gave "Cx-5". Separators and
 * digits stay as they are; a letters-only part is capitalised, or written in
 * capitals when it is a known abbreviation (CX, HR, WRX); inside a part that
 * mixes letters and digits, short letter runs are a code (RAV4, R1T, GLC300)
 * and long ones a word (4Runner). A model typed with any capital is kept as
 * typed ("iX", "e-Tron GT"): someone wrote that spelling on purpose.
 */
export function modelFromUrl(raw) {
  const text = String(raw ?? "").trim();
  if (/[A-Z]/.test(text)) return text;
  return text
    .split(/([^a-z0-9]+)/)
    .map((part, i) => {
      if (i % 2 || !part) return part;
      if (/^[a-z]+$/.test(part)) {
        return part.length <= 3 && MODEL_ABBREVIATIONS.has(part) ? part.toUpperCase() : capital(part);
      }
      return part.replace(/[a-z]+/g, (run) => (run.length <= 3 ? run.toUpperCase() : capital(run)));
    })
    .join("");
}

const list = (params, ...keys) =>
  keys.flatMap((k) =>
    params
      .getAll(k)
      .flatMap((v) => v.split(","))
      .map((v) => v.trim())
      .filter(Boolean),
  );

const uniq = (arr) => [...new Set(arr)];

/* ------------------------------------------------------------------ *
 * Sizes
 * ------------------------------------------------------------------ */

function plausible(r) {
  if (r.format === "flotation") return r.rimDiameter >= 14 && r.rimDiameter <= 26;
  return (
    r.width >= 125 &&
    r.width <= 455 &&
    r.aspect >= 25 &&
    r.aspect <= 95 &&
    r.rimDiameter >= 12 &&
    r.rimDiameter <= 30
  );
}

/**
 * A size as the URL writes it: "265/70R17" -> "265-70r17",
 * "LT265/70R17" -> "lt265-70r17". "" for anything that is not a size.
 */
export function sizeToParam(size) {
  const r = readSize(size);
  if (!r || !plausible(r)) return "";
  return r.display.toLowerCase().replace(/\//g, "-");
}

/**
 * A size from the URL in the site's own spelling ("265/70R17",
 * "LT265/70R17"), or null. Takes 265-70r17, 265/70R17, LT265/70R17,
 * 245/40ZR18 and 31x10.50r15.
 */
export function paramToSize(param) {
  const s = String(param ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!s || s.length > 24) return null;
  // The whole value has to be a size: "265-70r17-junk" is not one.
  const metric = /^(P|LT|ST)?(\d{3})[/-](\d{2,3})Z?R(\d{2})(LT|C)?$/.exec(s);
  const flotation = /^(\d{2}(?:\.\d+)?)X(\d{1,2}(?:\.\d+)?)R(\d{2})(LT)?$/.exec(s);
  let text = null;
  if (metric) {
    const [, prefix = "", width, aspect, rim, suffix = ""] = metric;
    text = `${prefix}${width}/${aspect}R${rim}${suffix}`;
  } else if (flotation) {
    const [, diameter, width, rim] = flotation;
    text = `${diameter}x${width}R${rim}LT`;
  }
  const r = readSize(text);
  return r && plausible(r) ? r.display : null;
}

/* ------------------------------------------------------------------ *
 * The selection
 * ------------------------------------------------------------------ */

/**
 * One string per thing being shopped for, spelling-blind, so the URL's
 * "ford / f-150" and the saved "Ford / F-150" compare equal. A saved trim
 * pick is not part of it: the URL does not carry one.
 */
function rearKey(sel) {
  const rear = sel.size && sel.rear ? readSize(sel.rear) : null;
  return rear ? `|rear ${rear.display.toUpperCase()}` : "";
}

export function selectionKey(sel) {
  if (!sel) return "";
  if (sel.type === "size") {
    const r = readSize(sel.size);
    return r ? `s|${r.display.toUpperCase()}${rearKey(sel)}` : "";
  }
  if (sel.type === "vehicle") {
    const size = sel.size ? readSize(sel.size)?.display.toUpperCase() ?? "" : "";
    return `v|${norm(sel.year)}|${norm(sel.make)}|${norm(sel.model)}|${size}${rearKey(sel)}`;
  }
  return "";
}

const VEHICLE_TEXT = /^[a-z0-9 .&'+/-]+$/i;

function readVehicle(params, vocab) {
  const year = (params.get("year") ?? params.get("vy") ?? "").trim();
  const make = (params.get("make") ?? params.get("vmk") ?? "").trim();
  const model = (params.get("model") ?? params.get("vmd") ?? "").trim();
  if (!year && !make && !model) return null;
  if (!/^\d{4}$/.test(year) || Number(year) < MIN_YEAR || Number(year) > maxYear()) {
    return null;
  }
  if (!make || make.length > 40 || !VEHICLE_TEXT.test(make)) return null;
  if (model && (model.length > 60 || !VEHICLE_TEXT.test(model))) return null;

  const makeName = pick(vocab?.makes, make) ?? titleCase(make);
  const modelName = model
    ? (pick(vocab?.models?.(makeName), model) ?? modelFromUrl(model))
    : "";
  return { type: "vehicle", year, make: makeName, model: modelName };
}

/* ------------------------------------------------------------------ *
 * Parse
 * ------------------------------------------------------------------ */

function readPrice(params) {
  let min = "";
  let max = "";
  const range = (params.get("price") ?? "").trim();
  const m = /^(\d{1,5})?-(\d{1,5})?$/.exec(range) ?? /^(\d{1,5})$/.exec(range);
  if (m) {
    min = m[1] ?? "";
    max = m[2] ?? "";
  } else {
    // The older pair.
    const lo = (params.get("minp") ?? "").trim();
    const hi = (params.get("maxp") ?? "").trim();
    if (/^\d{1,5}$/.test(lo)) min = lo;
    if (/^\d{1,5}$/.test(hi)) max = hi;
  }
  min = min === "" ? "" : String(Number(min));
  max = max === "" ? "" : String(Number(max));
  if (min && max && Number(min) > Number(max)) [min, max] = [max, min];
  return { min, max };
}

const digits = (v, re) => {
  const s = String(v ?? "").trim();
  return re.test(s) ? s : "";
};

/**
 * The page state in a /tires query string (or URLSearchParams):
 *
 *   { selection, filters, partial: { width, aspect, diameter }, sort,
 *     view, search, fit, tracking: [[key, value], ...] }
 *
 * `selection` is null when the URL names no vehicle or size.
 */
export function parseTiresQuery(input, vocab = {}) {
  const params =
    input instanceof URLSearchParams
      ? input
      : new URLSearchParams(String(input ?? "").replace(/^\?/, ""));

  const size = paramToSize(params.get("size"));
  const rear = size ? paramToSize(params.get("rear")) : null;
  const sized = rear ? { size, rear } : { size };
  const vehicle = readVehicle(params, vocab);
  let selection = null;
  if (vehicle) selection = size ? { ...vehicle, ...sized } : vehicle;
  else if (size) selection = { type: "size", ...sized };

  const brands = uniq(
    list(params, "brand", "brands")
      .map((b) => (vocab.brands ? pick(vocab.brands, b) : titleCase(b)))
      .filter(Boolean),
  );
  const categories = uniq(
    list(params, "category", "cats")
      .map((c) => (vocab.categories ? pick(vocab.categories, c) : titleCase(c)))
      .filter(Boolean),
  );
  const diameters = uniq(
    list(params, "rim", "dia")
      .filter((d) => /^\d{2}$/.test(d) && Number(d) >= 12 && Number(d) <= 30)
      .map(Number),
  ).sort((a, b) => a - b);

  const price = readPrice(params);
  const speedRaw = (params.get("speed") ?? "").trim().toUpperCase();
  const load = digits(params.get("load"), /^\d{2,3}$/);
  const warrantyRaw = (params.get("warranty") ?? "").trim().toLowerCase();
  const wk = /^(\d{1,3})k$/.exec(warrantyRaw);
  const warrantyNum = wk ? Number(wk[1]) * 1000 : /^\d{4,6}$/.test(warrantyRaw) ? Number(warrantyRaw) : 0;

  const filters = {
    seasons: uniq(list(params, "season").map((s) => s.toLowerCase())).filter((s) =>
      SEASON_VALUES.includes(s),
    ),
    types: uniq(list(params, "type").map((s) => s.toLowerCase())).filter((s) =>
      TYPE_VALUES.includes(s),
    ),
    brands,
    categories,
    diameters,
    minPrice: price.min,
    maxPrice: price.max,
    speed: SPEED_ORDER.includes(speedRaw) ? speedRaw : "",
    load: load && Number(load) >= 60 && Number(load) <= 150 ? String(Number(load)) : "",
    loadRanges: uniq(list(params, "load_range").map((s) => s.toUpperCase())).filter((s) =>
      /^(XL|[B-F])$/.test(s),
    ),
    runFlat: /^(1|yes|true)$/i.test((params.get("runflat") ?? "").trim()),
    warranty: warrantyNum >= 1000 && warrantyNum <= 150000 ? String(warrantyNum) : "",
  };

  const sortRaw = (params.get("sort") ?? "").trim().toLowerCase();
  const sort = sortRaw === "recommended" ? "best" : SORT_VALUES.includes(sortRaw) ? sortRaw : "best";

  const view = params.get("view") === "brands" ? "brands" : "";
  const search = ["vehicle", "size"].includes(params.get("search")) ? params.get("search") : "";
  const fitRaw = params.get("fit") ?? "";
  const fit = ["change", "vehicle", "size", "sticker"].includes(fitRaw) ? fitRaw : "";

  return {
    selection,
    filters,
    partial: {
      width: digits(params.get("w"), /^\d{3}$/),
      aspect: digits(params.get("a"), /^\d{2,3}$/),
      diameter: digits(params.get("d"), /^\d{2}(\.5)?$/),
    },
    sort,
    view,
    search,
    fit,
    tracking: [...params].filter(([k]) => TRACKING.test(k)),
  };
}

/* ------------------------------------------------------------------ *
 * Serialize
 * ------------------------------------------------------------------ */

// Commas and spaces stay readable: brand=continental,nitto and
// model=range+rover+sport rather than %2C and %20.
const enc = (v) =>
  encodeURIComponent(String(v)).replace(/%2C/gi, ",").replace(/%20/g, "+");

/**
 * The canonical query string (no leading "?") for a page state, in a fixed
 * key order. Empty values and defaults are left out, so /tires with nothing
 * chosen is just /tires.
 */
export function serializeTiresQuery(state = {}) {
  const out = [];
  const add = (k, v) => {
    if (v === "" || v == null || v === false) return;
    if (Array.isArray(v)) {
      if (!v.length) return;
      out.push(`${k}=${v.map(enc).join(",")}`);
      return;
    }
    out.push(`${k}=${enc(v)}`);
  };

  const sel = state.selection;
  if (sel?.type === "vehicle" && sel.year && sel.make) {
    add("year", sel.year);
    add("make", String(sel.make).toLowerCase());
    add("model", String(sel.model ?? "").toLowerCase());
    if (sel.size) {
      add("size", sizeToParam(sel.size));
      if (sel.rear) add("rear", sizeToParam(sel.rear));
    }
  } else if (sel?.type === "size") {
    add("size", sizeToParam(sel.size));
    if (sel.rear) add("rear", sizeToParam(sel.rear));
  }

  // Lists in one order, whatever order they were ticked in, so one page
  // has one address.
  const f = { ...EMPTY_TIRE_FILTERS, ...(state.filters ?? {}) };
  const inOrder = (values, order) =>
    [...values].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const abc = (values) => [...values].sort();
  add("season", inOrder(f.seasons, SEASON_VALUES));
  add("type", inOrder(f.types, TYPE_VALUES));
  add("brand", abc(f.brands.map(slug)));
  add("category", abc(f.categories.map(slug)));
  if (f.minPrice !== "" || f.maxPrice !== "") add("price", `${f.minPrice}-${f.maxPrice}`);
  add("speed", String(f.speed).toLowerCase());
  add("load", f.load);
  add("load_range", abc(f.loadRanges.map((s) => String(s).toLowerCase())));
  add("runflat", f.runFlat ? "1" : "");
  add("warranty", f.warranty);
  add("rim", [...f.diameters].sort((a, b) => a - b));

  const p = state.partial ?? {};
  add("w", p.width);
  add("a", p.aspect);
  add("d", p.diameter);

  if (state.sort && state.sort !== "best") add("sort", state.sort);
  add("view", state.view);
  add("search", state.search);
  (state.tracking ?? []).forEach(([k, v]) => add(k, v));
  return out.join("&");
}

/**
 * The one-line H1 for a search in the address bar ("Tires for your 2019
 * Toyota Camry", "225/50R17 tires"), or null for a bare /tires, which keeps
 * the full hero (src/pages/shop/TiresPage.jsx). Pass the URL's selection:
 * only a bare /tires hydrates the prerendered page (src/main.jsx), so the
 * header the server rendered and the one the browser renders always agree.
 *
 * With no vehicle or size, a partial size with at least a width and an
 * aspect ratio (the header search's /tires?w=245&a=40) titles the page
 * too: "245/40 tires", "245/40R18 tires". A width alone keeps the hero.
 */
export function searchTitle(selection, partial = null) {
  if (selection?.type === "vehicle") return `Tires for your ${vehicleLabel(selection)}`;
  if (selection?.type === "size") {
    const front = readSize(selection.size)?.display;
    const rear = selection.rear ? readSize(selection.rear)?.display : null;
    if (!front) return null;
    return rear ? `${front} and ${rear} tires` : `${front} tires`;
  }
  if (!selection && partial?.width && partial?.aspect) {
    return `${partial.width}/${partial.aspect}${partial.diameter ? `R${partial.diameter}` : ""} tires`;
  }
  return null;
}

/**
 * True when a partial size from the address bar (`{ width, aspect,
 * diameter }`, any of them "") contradicts a size being shopped for: some
 * part it gives differs from that size, front and rear alike. Then the
 * partial is the newer search (typed into the header, or picked in the
 * finder) and the old size gives way to it. No parts, or a size that is
 * not a size, is never a contradiction.
 */
export function partialConflicts(partial, size, rear = null) {
  const p = partial ?? {};
  if (!p.width && !p.aspect && !p.diameter) return false;
  const fits = (marking) => {
    const r = readSize(marking);
    if (!r) return null;
    return (
      (!p.width || String(r.width) === String(p.width)) &&
      (!p.aspect || String(r.aspect) === String(p.aspect)) &&
      (!p.diameter || String(r.rimDiameter) === String(p.diameter))
    );
  };
  const front = fits(size);
  if (front === null) return false;
  return !front && !(rear && fits(rear));
}

/**
 * The selection the /tires search answers against. A remembered vehicle
 * with a door-jamb size the shopper confirmed turns any tire of another
 * size into "Doesn't fit", so a partial size typed over it (the header
 * search's /tires?w=245&a=40) would call the very size being entered a
 * miss. The partial is the newer search: the contradicted door-jamb size
 * (and rear) is left out for this search, the vehicle stays. Pure, so the
 * saved selection is never rewritten; the cart and checkout read it as
 * saved, and still flag a line that misses the confirmed size.
 */
export function selectionForSearch(selection, partial) {
  if (selection?.type !== "vehicle" || !selection.size) return selection;
  if (!partialConflicts(partial, selection.size, selection.rear ?? null)) return selection;
  const { size: _size, rear: _rear, ...vehicle } = selection;
  return vehicle;
}
