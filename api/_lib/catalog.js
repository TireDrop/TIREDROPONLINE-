// Tire search and server-side pricing, in either mode:
//
//   sample — the representative catalog in src/data/products.js, filtered
//            with the same size parser and fitment table the frontend uses.
//            Prices there are already retail. Stock is unknown, so every
//            sample item reports available: null and qty: null.
//   live   — ATD, through api/_lib/atd.js.
//
// Vehicle searches resolve to the typical original-equipment size from
// src/data/fitment.js in both modes, unless ATD's own fitment endpoint has
// been confirmed (see ENDPOINTS.searchByVehicle in atd.js).

import { TIRES } from "../../src/data/products.js";
import { FITMENT, oeSizeFor } from "../../src/data/fitment.js";
import { parseSize } from "../../src/data/tireMath.js";
import { ENDPOINTS as ATD_ENDPOINTS, lookupAtdSkus, searchAtd } from "./atd.js";
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
 * Case-insensitive lookup in the fitment table. Returns the OE size record,
 * or null when the vehicle is not in the table. The table is year-agnostic.
 */
export function resolveVehicle(make, model) {
  const canonical = FITMENT_KEYS.get(`${make}|${model}`.toLowerCase());
  if (!canonical) return null;
  const [m, mo] = canonical;
  const oe = oeSizeFor(m, mo);
  return oe ? { make: m, model: mo, ...oe } : null;
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
    const fitment = resolveVehicle(query.make, query.model);
    echo.size = fitment?.size ?? null;
    echo.fitment = fitment
      ? {
          size: fitment.size,
          bodyStyle: fitment.bodyStyle,
          source: "typical original-equipment size; check the sidewall",
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
    return {
      sku,
      title: item.title,
      qty,
      price: item.price,
      lineTotal: cents(item.price * qty),
    };
  });
}
