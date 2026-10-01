/**
 * The /tires filters, read only from what each tire's own data states
 * (src/data/products.js, or a live /api/tires item). A tire whose data does
 * not say something is never counted as having it: an unknown season is not
 * "all-season", an unstated warranty is not 0 miles, and a filter group the
 * tires on the page carry no data for is not shown at all.
 *
 *   season      from `seasons`: winter; all-weather (an all-season marked
 *               3PMSF); summer; all-season
 *   type        from `seasons` + `category`: all-terrain / mud-terrain (a
 *               hybrid is both), performance, commercial; otherwise a
 *               passenger all-season is touring and a truck & SUV
 *               all-season is highway
 *   speed       `speedRating`, as a minimum (H or higher)
 *   load        `loadIndex`, as a minimum; a dual index (120/116) counts by
 *               its single-wheel figure
 *   load range  specs "Load Range" (E, or XL when a tire says so)
 *   run-flat    specs "Run Flat": "Yes" only
 *   warranty    the miles in `warranty` ("70,000 mile treadwear"); a tire
 *               with "No mileage warranty" has none
 *
 * Not offered, for lack of data: EV-specific (no tire states it), XL on
 * passenger tires (none is marked), ratings or reviews (there are none), sale
 * or discount (house rule), delivery speed (no arrival promises).
 */

import { SPEED_ORDER } from "../lib/tiresUrl.js";

export const SEASONS = [
  { value: "all-season", label: "All-season" },
  { value: "all-weather", label: "All-weather (3PMSF)" },
  { value: "summer", label: "Summer" },
  { value: "winter", label: "Winter" },
];

export const TYPES = [
  { value: "touring", label: "Touring" },
  { value: "performance", label: "Performance" },
  { value: "highway", label: "Highway (truck & SUV)" },
  { value: "all-terrain", label: "All-terrain" },
  { value: "mud-terrain", label: "Mud-terrain" },
  { value: "commercial", label: "Commercial / light truck" },
];

/** Top speed per rating, mph (the speed-rating chart). */
export const SPEED_MPH = {
  L: 75, M: 81, N: 87, P: 93, Q: 99, R: 106, S: 112, T: 118, U: 124,
  H: 130, V: 149, W: 168, Y: 186,
};

export const WARRANTY_STEPS = [40000, 50000, 60000, 70000, 80000];
export const LOAD_STEPS = [90, 95, 100, 105, 110, 115, 120];

const lower = (v) => String(v ?? "").toLowerCase();

export function seasonOf(tire) {
  const s = lower(tire?.seasons);
  if (!s) return null;
  if (/winter/.test(s)) return "winter";
  if (/all-season/.test(s) && /3pmsf|all-weather/.test(s)) return "all-weather";
  if (/^summer/.test(s)) return "summer";
  if (/all-season/.test(s)) return "all-season";
  return null;
}

export function typesOf(tire) {
  const s = lower(tire?.seasons);
  const c = tire?.category ?? "";
  const out = [];
  if (/all-terrain/.test(s)) out.push("all-terrain");
  if (/mud-terrain/.test(s)) out.push("mud-terrain");
  if (c === "Performance" || /performance/.test(s)) out.push("performance");
  if (c === "Commercial") out.push("commercial");
  if (!out.length && c === "All-Season") out.push("touring");
  if (!out.length && c === "Truck & SUV" && /all-season/.test(s)) out.push("highway");
  return out;
}

/** Position on the speed chart, or -1 when the tire states none. */
export const speedRank = (rating) =>
  SPEED_ORDER.indexOf(String(rating ?? "").trim().toUpperCase());

/** The single-wheel load index, or null. */
export function loadIndexOf(tire) {
  const m = /^(\d{2,3})/.exec(String(tire?.loadIndex ?? "").trim());
  return m ? Number(m[1]) : null;
}

export function loadRangeOf(tire) {
  const r = String(tire?.specs?.["Load Range"] ?? tire?.loadRange ?? "")
    .trim()
    .toUpperCase();
  return /^(XL|[B-F])$/.test(r) ? r : null;
}

export function runFlatOf(tire) {
  const r = lower(tire?.specs?.["Run Flat"] ?? tire?.runFlat);
  if (r === "yes" || r === "true") return true;
  if (r === "no" || r === "false") return false;
  return null;
}

/** Treadwear warranty miles, 0 for "No mileage warranty", null if unstated. */
export function warrantyMilesOf(tire) {
  const w = String(tire?.warranty ?? "");
  if (!w) return null;
  if (/no mileage warranty/i.test(w)) return 0;
  const m = /(\d{1,3}(?:,\d{3})+|\d{4,6})\s*-?\s*mile/i.exec(w);
  return m ? Number(m[1].replace(/,/g, "")) : null;
}

/* ------------------------------------------------------------------ *
 * Matching
 * ------------------------------------------------------------------ */

const TESTS = {
  seasons: (t, f) => !f.seasons.length || f.seasons.includes(seasonOf(t)),
  types: (t, f) => !f.types.length || typesOf(t).some((x) => f.types.includes(x)),
  brands: (t, f) => !f.brands.length || f.brands.includes(t.brand),
  categories: (t, f) => !f.categories.length || f.categories.includes(t.category),
  diameters: (t, f) => {
    if (!f.diameters.length) return true;
    const d = t.rimDiameter ?? Number(/R(\d{2})/.exec(t.size ?? "")?.[1]);
    return f.diameters.includes(d);
  },
  price: (t, f) => {
    const min = Number(f.minPrice) || 0;
    const max = f.maxPrice === "" ? Infinity : Number(f.maxPrice);
    return t.price >= min && t.price <= max;
  },
  speed: (t, f) => !f.speed || speedRank(t.speedRating) >= speedRank(f.speed),
  load: (t, f) => !f.load || (loadIndexOf(t) ?? -1) >= Number(f.load),
  loadRanges: (t, f) => !f.loadRanges.length || f.loadRanges.includes(loadRangeOf(t)),
  runFlat: (t, f) => !f.runFlat || runFlatOf(t) === true,
  warranty: (t, f) => !f.warranty || (warrantyMilesOf(t) ?? -1) >= Number(f.warranty),
};

/** True when `tire` passes every filter (but the group named `skip`). */
export function matchesFilters(tire, filters, skip = null) {
  return Object.entries(TESTS).every(([group, test]) => group === skip || test(tire, filters));
}

/**
 * Every option the tires in `items` actually offer, each with the count it
 * would show given the other filters (a group never narrows its own counts,
 * so ticking a second brand shows what it adds). Options none of `items`
 * has are left out, and a group with no options is null, so the page only
 * offers filters its tires carry data for.
 */
export function facetCounts(items, filters) {
  const rest = (group) => items.filter((t) => matchesFilters(t, filters, group));
  const options = (group, values, has, label = (v) => v) => {
    const pool = rest(group);
    const out = values
      .filter((v) => items.some((t) => has(t, v)))
      .map((v) => ({
        value: v,
        label: label(v),
        count: pool.filter((t) => has(t, v)).length,
      }));
    return out.length ? out : null;
  };
  const distinct = (read) =>
    [...new Set(items.map(read).filter((v) => v != null && v !== ""))];

  const seasonLabel = Object.fromEntries(SEASONS.map((s) => [s.value, s.label]));
  const typeLabel = Object.fromEntries(TYPES.map((s) => [s.value, s.label]));
  const ranks = distinct((t) => {
    const r = speedRank(t.speedRating);
    return r >= 0 ? r : null;
  }).sort((a, b) => a - b);
  const loads = distinct(loadIndexOf);
  const prices = items.map((t) => t.price).filter((p) => Number.isFinite(p));

  return {
    seasons: options("seasons", SEASONS.map((s) => s.value), (t, v) => seasonOf(t) === v, (v) => seasonLabel[v]),
    types: options("types", TYPES.map((s) => s.value), (t, v) => typesOf(t).includes(v), (v) => typeLabel[v]),
    brands: options("brands", distinct((t) => t.brand).sort(), (t, v) => t.brand === v),
    categories: options("categories", distinct((t) => t.category), (t, v) => t.category === v),
    diameters: options(
      "diameters",
      distinct((t) => t.rimDiameter).sort((a, b) => a - b),
      (t, v) => t.rimDiameter === v,
      (v) => `${v}"`,
    ),
    price: prices.length
      ? { min: Math.min(...prices), max: Math.max(...prices) }
      : null,
    // "H or higher": each rating the tires carry above the slowest, which
    // would filter nothing out.
    speed:
      ranks.length > 1
        ? options(
            "speed",
            ranks.slice(1).map((r) => SPEED_ORDER[r]),
            (t, v) => speedRank(t.speedRating) >= speedRank(v),
            (v) => `${v} or higher (${SPEED_MPH[v]}+ mph)`,
          )
        : null,
    load: loads.length
      ? options(
          "load",
          LOAD_STEPS.filter((s) => s > Math.min(...loads)).map(String),
          (t, v) => (loadIndexOf(t) ?? -1) >= Number(v),
          (v) => `${v} or higher`,
        )
      : null,
    loadRanges: options(
      "loadRanges",
      distinct(loadRangeOf).sort(),
      (t, v) => loadRangeOf(t) === v,
      (v) => (v === "XL" ? "XL (extra load)" : `Load range ${v}`),
    ),
    runFlat: items.some((t) => runFlatOf(t) === true)
      ? { count: rest("runFlat").filter((t) => runFlatOf(t) === true).length }
      : null,
    warranty: options(
      "warranty",
      WARRANTY_STEPS.map(String),
      (t, v) => (warrantyMilesOf(t) ?? -1) >= Number(v),
      (v) => `${Number(v).toLocaleString("en-US")}+ miles`,
    ),
  };
}
