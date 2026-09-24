// Input validation for the public endpoints. Every function returns
// { ok: true, value } or { ok: false, error }, where `error` is a sentence a
// shopper can read, because the frontend shows it as-is.

import { parseSize } from "../../src/data/tireMath.js";
import { BUSINESS } from "../../src/data/business.js";

// ---- Tire sizes ------------------------------------------------------------

/**
 * Accepts the loose ways people type a size ("225/45/17", "225 45 17",
 * "225-45-17", "2254517") on top of everything `parseSize` reads, and returns
 * a string `parseSize` understands. Anything else passes through untouched so
 * `parseSize` can reject it.
 */
export function normalizeSizeInput(raw) {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (parseSize(s)) return s;
  const loose = s.match(/^(P|LT)?\s*(\d{3})[\s/-]*(\d{2})[\s/-]*R?[\s-]*(\d{2})$/);
  if (loose) {
    const [, service = "", width, aspect, rim] = loose;
    return `${service}${width}/${aspect}R${rim}`;
  }
  return s;
}

/** A size query, parsed and range-checked. */
export function parseSizeQuery(raw) {
  const input = String(raw ?? "").trim();
  if (!input) return { ok: false, error: "Enter a tire size, like 225/45R17." };
  if (input.length > 32) {
    return { ok: false, error: "That tire size is too long to be real." };
  }
  const size = parseSize(normalizeSizeInput(input));
  if (!size) {
    return {
      ok: false,
      error: `"${input}" isn't a tire size we can read. Try the format 225/45R17.`,
    };
  }
  // Catch markings that parse but describe no tire anyone makes.
  const plausible =
    size.format === "flotation"
      ? size.flotationDiameter >= 23 &&
        size.flotationDiameter <= 44 &&
        size.rimDiameter >= 14 &&
        size.rimDiameter <= 26
      : size.width >= 125 &&
        size.width <= 455 &&
        size.aspect >= 25 &&
        size.aspect <= 95 &&
        size.rimDiameter >= 12 &&
        size.rimDiameter <= 30;
  if (!plausible) {
    return {
      ok: false,
      error: `"${input}" is outside the range of passenger and light-truck tire sizes.`,
    };
  }
  return { ok: true, value: size };
}

// ---- Shipping area ---------------------------------------------------------

/** The 48 contiguous states plus DC: where shipping is free. */
export const FREE_SHIPPING_STATES = new Set([
  "AL", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "ID", "IL",
  "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO",
  "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR",
  "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI",
  "WY",
]);

/** US addresses the site does not ship to, named so the error can say which. */
const OUTSIDE_AREA = {
  AK: "Alaska",
  HI: "Hawaii",
  PR: "Puerto Rico",
  GU: "Guam",
  VI: "the U.S. Virgin Islands",
  AS: "American Samoa",
  MP: "the Northern Mariana Islands",
  AA: "APO/FPO (Americas) addresses",
  AE: "APO/FPO (Europe) addresses",
  AP: "APO/FPO (Pacific) addresses",
};

export function checkShipState(raw) {
  const state = String(raw ?? "").trim().toUpperCase();
  if (FREE_SHIPPING_STATES.has(state)) return { ok: true, value: state };
  if (OUTSIDE_AREA[state]) {
    return {
      ok: false,
      error: `We ship free to the 48 contiguous states and DC only, so we can't ship to ${OUTSIDE_AREA[state]}. Call ${BUSINESS.phone} and we'll see what we can do.`,
    };
  }
  return {
    ok: false,
    error: "Enter the two-letter state code for the shipping address, like FL.",
  };
}

// ---- GET /api/tires --------------------------------------------------------

const text = (v) => (typeof v === "string" ? v.trim() : "");
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 100;

export function validateTiresQuery(query = {}) {
  const size = text(query.size);
  const year = text(query.year);
  const make = text(query.make);
  const model = text(query.model);
  const brand = text(query.brand);
  const rawLimit = text(query.limit);
  const hasVehicle = Boolean(year || make || model);

  let limit = DEFAULT_LIMIT;
  if (rawLimit) {
    if (!/^\d{1,3}$/.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > MAX_LIMIT) {
      return { ok: false, error: `limit must be a whole number from 1 to ${MAX_LIMIT}.` };
    }
    limit = Number(rawLimit);
  }
  if (brand.length > 40) return { ok: false, error: "brand is too long." };

  if (size && hasVehicle) {
    return {
      ok: false,
      error: "Search by size or by vehicle (year, make and model), not both.",
    };
  }

  if (size) {
    const parsed = parseSizeQuery(size);
    if (!parsed.ok) return parsed;
    return {
      ok: true,
      value: { type: "size", size: parsed.value, brand: brand || null, limit },
    };
  }

  if (hasVehicle) {
    const missing = [
      !year && "year",
      !make && "make",
      !model && "model",
    ].filter(Boolean);
    if (missing.length) {
      return {
        ok: false,
        error: `A vehicle search needs year, make and model. Missing: ${missing.join(", ")}.`,
      };
    }
    const maxYear = new Date().getFullYear() + 2;
    if (!/^\d{4}$/.test(year) || Number(year) < 1950 || Number(year) > maxYear) {
      return { ok: false, error: `year must be a four-digit year from 1950 to ${maxYear}.` };
    }
    if (make.length > 40 || model.length > 60) {
      return { ok: false, error: "make or model is too long." };
    }
    return {
      ok: true,
      value: {
        type: "vehicle",
        year: Number(year),
        make,
        model,
        brand: brand || null,
        limit,
      },
    };
  }

  return {
    ok: false,
    error: "Search needs a tire size (size=225/45R17) or a vehicle (year, make and model).",
  };
}

// ---- POST /api/checkout ----------------------------------------------------

export const MAX_LINES = 10;
export const MAX_QTY_PER_LINE = 12;
export const MAX_TIRES_PER_ORDER = 24;

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;
const ZIP = /^\d{5}(-\d{4})?$/;

function field(obj, key, { required = true, max = 120, label = key } = {}) {
  const value = text(obj?.[key]);
  if (!value) {
    return required ? { error: `${label} is required.` } : { value: "" };
  }
  if (value.length > max) return { error: `${label} is too long.` };
  return { value };
}

/**
 * Validates a checkout body. Prices are deliberately not read: anything the
 * client sends besides sku and qty is ignored, and the server prices every
 * line itself.
 */
export function validateCheckout(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Send the order as a JSON object." };
  }

  // Items: merge repeats of the same sku, cap quantities.
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { ok: false, error: "The cart is empty." };
  }
  if (body.items.length > MAX_LINES) {
    return { ok: false, error: `An order can hold at most ${MAX_LINES} different tires.` };
  }
  const merged = new Map();
  for (const item of body.items) {
    const sku = text(item?.sku);
    if (!sku || sku.length > 64 || !/^[\w.\-/]+$/.test(sku)) {
      return { ok: false, error: "Every item needs a valid sku." };
    }
    const qty = item?.qty;
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      return {
        ok: false,
        error: `Quantity for ${sku} must be a whole number from 1 to ${MAX_QTY_PER_LINE}.`,
      };
    }
    merged.set(sku, (merged.get(sku) ?? 0) + qty);
  }
  const items = [...merged].map(([sku, qty]) => ({ sku, qty }));
  if (items.some((i) => i.qty > MAX_QTY_PER_LINE)) {
    return { ok: false, error: `At most ${MAX_QTY_PER_LINE} of any one tire per order.` };
  }
  const totalQty = items.reduce((n, i) => n + i.qty, 0);
  if (totalQty > MAX_TIRES_PER_ORDER) {
    return {
      ok: false,
      error: `Online orders are limited to ${MAX_TIRES_PER_ORDER} tires. Call ${BUSINESS.phone} for fleet orders.`,
    };
  }

  // Delivery.
  const delivery = body.delivery;
  if (delivery !== "ship" && delivery !== "pickup") {
    return { ok: false, error: 'delivery must be "ship" or "pickup".' };
  }

  // Customer.
  const c = body.customer;
  if (!c || typeof c !== "object") {
    return { ok: false, error: "Your name, email and phone are required." };
  }
  const name = field(c, "name", { max: 100, label: "Name" });
  if (name.error) return { ok: false, error: name.error };
  const email = field(c, "email", { max: 254, label: "Email" });
  if (email.error) return { ok: false, error: email.error };
  if (!EMAIL.test(email.value)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const phone = field(c, "phone", { max: 30, label: "Phone" });
  if (phone.error) return { ok: false, error: phone.error };
  const digits = phone.value.replace(/\D/g, "");
  const phoneDigits = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (phoneDigits.length !== 10) {
    return { ok: false, error: "Enter a 10-digit US phone number." };
  }

  // Address: required to ship, ignored for pickup.
  let address = null;
  if (delivery === "ship") {
    const a = body.address;
    if (!a || typeof a !== "object") {
      return { ok: false, error: "A shipping address is required." };
    }
    const line1 = field(a, "line1", { label: "Street address" });
    if (line1.error) return { ok: false, error: line1.error };
    const line2 = field(a, "line2", { required: false, label: "Address line 2" });
    if (line2.error) return { ok: false, error: line2.error };
    const city = field(a, "city", { max: 60, label: "City" });
    if (city.error) return { ok: false, error: city.error };
    const state = checkShipState(a.state);
    if (!state.ok) return state;
    const zip = field(a, "zip", { max: 10, label: "ZIP code" });
    if (zip.error) return { ok: false, error: zip.error };
    if (!ZIP.test(zip.value)) {
      return { ok: false, error: "Enter a 5-digit ZIP code." };
    }
    address = {
      line1: line1.value,
      line2: line2.value || null,
      city: city.value,
      state: state.value,
      zip: zip.value,
    };
  }

  const notes = text(body.notes);
  if (notes.length > 1000) {
    return { ok: false, error: "Notes are limited to 1,000 characters." };
  }

  return {
    ok: true,
    value: {
      items,
      delivery,
      customer: {
        name: name.value,
        email: email.value,
        phone: `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`,
      },
      address,
      notes: notes || null,
    },
  };
}
