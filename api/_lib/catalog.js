// Tire search and server-side pricing, in either mode:
//
//   sample — the representative catalog in src/data/products.js, filtered
//            with the same size parser and fitment table the frontend uses.
//            Prices there are already retail. Stock is unknown, so every
//            sample item reports available: null and qty: null.
//   live   — ATD, through api/_lib/atd.js.
//
// Vehicle searches resolve to the factory size for that model year from
// src/data/fitment.js (through src/data/fitmentCheck.js, the same answer the
// pages give) in both modes, unless ATD's own fitment endpoint has been
// confirmed (see ENDPOINTS.searchByVehicle in atd.js).

import { TIRES } from "../../src/data/products.js";
import { FITMENT } from "../../src/data/fitment.js";
import { factorySizes, readSize } from "../../src/data/fitmentCheck.js";
import { parseSize } from "../../src/data/tireMath.js";
import {
  ENDPOINTS as ATD_ENDPOINTS,
  getBySku as getAtdBySku,
  lookupAtdSkus,
  searchAtd,
} from "./atd.js";
import { HttpError } from "./http.js";

// ---- Sample catalog ---------------------------------------------------------

/** products.js tire -> /api/tires item. The sample sku is the product id. */
function toSampleItem(tire) {
  return {
    id: tire.id,
    sku: tire.id,
    brand: tire.brand,
    model: tire.model,
    size: tire.size,
    loadIndex: tire.loadIndex ?? null,
    speedRating: tire.speedRating ?? null,
    price: tire.price,
    available: null, // the sample catalog carries no stock
    qty: null,
    image: null, // the sample catalog carries no product photos
    title: `${tire.brand} ${tire.model} ${tire.size}`,
  };
}

const SAMPLE_ITEMS = TIRES.map(toSampleItem);
const SAMPLE_BY_SKU = new Map(SAMPLE_ITEMS.map((item) => [item.sku, item]));
const SAMPLE_SIZES = new Map(TIRES.map((t) => [t.id, t]));

function matchesSize(item, size) {
  if (size.format !== "metric") return false; // the sample has no flotation sizes
  const tire = SAMPLE_SIZES.get(item.id);
  return (
    tire.width === size.width &&
    tire.aspect === size.aspect &&
    tire.rimDiameter === size.rimDiameter
  );
}

// ---- Vehicle resolution -----------------------------------------------------

const FITMENT_KEYS = new Map(
  Object.keys(FITMENT).map((key) => [key.toLowerCase(), key.split("|")]),
);

/**
 * Case-insensitive lookup in the fitment tables, by model year. Returns
 * `{ make, model, size, bodyStyle, width, aspect, rimDiameter }`, or null
 * when there is no single factory size to search: the vehicle is not on
 * file, the year is outside the generations on file, or the size depends
 * on the trim (or the car is staggered). Null is never a guess.
 */
export function resolveVehicle(make, model, year) {
  const canonical = FITMENT_KEYS.get(`${make}|${model}`.toLowerCase());
  if (!canonical) return null;
  const [m, mo] = canonical;
  const found = factorySizes({ make: m, model: mo, year });
  if (found.status !== "sized") return null;
  const keys = new Set(found.options.map((o) => readSize(o.front)?.key));
  const [only] = found.options;
  if (keys.size !== 1 || only.rear) return null;
  const size = readSize(only.front);
  if (!size || size.format !== "metric") return null;
  return {
    make: m,
    model: mo,
    size: size.key,
    bodyStyle: FITMENT[`${m}|${mo}`]?.[1] ?? null,
    width: size.width,
    aspect: size.aspect,
    rimDiameter: size.rimDiameter,
  };
}

// ---- Search -----------------------------------------------------------------

function applyFilters(items, { brand, limit }) {
  const wanted = brand ? brand.toLowerCase() : null;
  const filtered = wanted
    ? items.filter((item) => (item.brand ?? "").toLowerCase() === wanted)
    : items;
  return filtered.slice(0, limit);
}

/**
 * Runs a validated query (see validateTiresQuery) and returns the
 * /api/tires response body.
 */
export async function searchTires(query, config, deps = {}) {
  const live = config.atd.mode === "live";
  const endpoints = deps.endpoints ?? ATD_ENDPOINTS;

  const echo = { type: query.type, brand: query.brand, limit: query.limit };
  let size = null;

  if (query.type === "size") {
    size = query.size;
    echo.size = size.normalized;
  } else {
    Object.assign(echo, {
      year: query.year,
      make: query.make,
      model: query.model,
    });
    const fitment = resolveVehicle(query.make, query.model, query.year);
    echo.size = fitment?.size ?? null;
    echo.fitment = fitment
      ? {
          size: fitment.size,
          bodyStyle: fitment.bodyStyle,
          source: "typical factory size for the model year; check the sidewall",
        }
      : null;

    // ATD's own fitment wins once confirmed.
    if (live && endpoints.searchByVehicle) {
      const items = await searchAtd(query, config.atd, deps);
      echo.fitment = { size: null, bodyStyle: null, source: "ATD fitment" };
      echo.size = null;
      return { source: "atd", query: echo, items: applyFilters(items, query) };
    }
    if (!fitment) {
      return { source: live ? "atd" : "sample", query: echo, items: [] };
    }
    size = parseSize(fitment.size);
  }

  if (live) {
    const items = await searchAtd({ type: "size", size }, config.atd, deps);
    return { source: "atd", query: echo, items: applyFilters(items, query) };
  }
  const items = SAMPLE_ITEMS.filter((item) => matchesSize(item, size));
  return { source: "sample", query: echo, items: applyFilters(items, query) };
}

// ---- One tire by sku (product pages) --------------------------------------

/**
 * `{ source, item }` for one sku, with `item` null when the catalog in play
 * does not carry it. Sample mode reads the sample catalog; live mode asks
 * ATD, priced exactly like a search result (dealer cost never included).
 */
export async function getTireBySku(sku, config, deps = {}) {
  if (config.atd.mode === "live") {
    const item = await getAtdBySku(sku, config.atd, deps);
    return { source: "atd", item };
  }
  return { source: "sample", item: SAMPLE_BY_SKU.get(sku) ?? null };
}

// ---- Server-side pricing for checkout ---------------------------------------

const cents = (n) => Math.round(n * 100) / 100;

/**
 * Prices each { sku, qty } from the server's own source of truth. Any price
 * the client sent was dropped during validation and is never read here.
 * Throws HttpError for unknown SKUs or known-short stock.
 */
export async function priceLines(items, config, deps = {}) {
  const live = config.atd.mode === "live";
  let bySku;
  if (live) {
    const found = await lookupAtdSkus(
      items.map((i) => i.sku),
      config.atd,
      deps,
    );
    bySku = new Map(found.map((item) => [item.sku, item]));
  } else {
    bySku = SAMPLE_BY_SKU;
  }

  return items.map(({ sku, qty }) => {
    const item = bySku.get(sku);
    if (!item) {
      throw new HttpError(
        400,
        `We couldn't find ${sku} in the catalog. Remove it from the cart and search again.`,
      );
    }
    if (item.available === false) {
      throw new HttpError(409, `${item.title} is out of stock.`);
    }
    if (item.qty !== null && item.qty < qty) {
      throw new HttpError(
        409,
        `Only ${item.qty} of ${item.title} ${item.qty === 1 ? "is" : "are"} in stock.`,
      );
    }
    // brand and size ride along for the order record (and the Shopify line
    // item's attributes). Dealer cost is never on `item`, so never here.
    return {
      sku,
      title: item.title,
      brand: item.brand ?? null,
      size: item.size ?? null,
      qty,
      price: item.price,
      lineTotal: cents(item.price * qty),
    };
  });
}
