/**
 * Client for the site's own API (`/api/*`, Vercel functions).
 *
 * Tire data comes from ATD through `/api/tires`; orders go through
 * `/api/checkout`, which (when online payment is on) creates a Shopify draft
 * order and hands back Shopify's hosted checkout to pay on. The front end
 * never talks to ATD or the Shopify Admin API directly — the keys live on the
 * server.
 *
 * The site still has to work when there is no API behind it: `vite dev`
 * without `vercel dev`, a static preview, or a function that is down. So:
 *   - search falls back to the sample catalog in products.js,
 *   - checkout falls back to request mode with `delivered: false`, which the
 *     checkout page turns into "this did not reach the shop, please call",
 *   - status falls back to sample data and request-mode checkout.
 * What never falls back is a real answer from the API: a 4xx carrying
 * `{ error }` is the server rejecting the input (an Alaska address, an
 * unknown SKU), and it is thrown as an ApiError for the page to show.
 */

import { TIRES } from "./products.js";
import { oeSizeFor } from "./fitment.js";

// `?.` keeps this importable outside Vite (node scripts, tests).
const BASE = String(import.meta.env?.VITE_API_BASE || "/api").replace(
  /\/+$/,
  "",
);

const TIMEOUT_MS = { status: 5000, search: 9000, checkout: 25000, newsletter: 15000, forms: 20000 };

/** A real rejection from the API. `message` is safe to show a shopper. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * The API could not be reached, or answered with something not ours.
 * `absent` marks the definite case — this host has no API at all (a bare
 * 404/405, or the SPA's HTML) — as opposed to a timeout or a network blip.
 */
class Unreachable extends Error {
  constructor(reason, { absent = false } = {}) {
    super(reason);
    this.name = "Unreachable";
    this.absent = absent;
  }
}

/**
 * One request with a timeout. Resolves the parsed JSON of a 2xx; throws
 * ApiError for a 4xx that carries `{ error }`, Unreachable for everything else
 * (network failure, timeout, a 404 from a host with no functions, HTML from a
 * static server, a 5xx).
 */
async function request(path, { method = "GET", body, timeout } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : null),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    throw new Unreachable(
      err?.name === "AbortError" ? "timed out" : "network error",
    );
  } finally {
    clearTimeout(timer);
  }

  const isJson = /json/i.test(res.headers.get("content-type") || "");
  let data = null;
  if (isJson) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (res.ok) {
    if (!data || typeof data !== "object") {
      throw new Unreachable("not json", { absent: true });
    }
    return data;
  }

  // Checkout answers 502 with a full request-mode body when the order was
  // built but could not be passed on to the shop. That is still an answer:
  // it carries the real order reference and `delivered: false`.
  if (data && typeof data === "object" && typeof data.mode === "string") {
    return data;
  }

  // A 4xx with our error shape is a decision the server made about the input.
  // A bare 404/405 (no JSON) means there is no API on this host.
  if (
    res.status >= 400 &&
    res.status < 500 &&
    data &&
    typeof data.error === "string" &&
    data.error.trim()
  ) {
    throw new ApiError(data.error.trim(), res.status);
  }
  throw new Unreachable(`HTTP ${res.status}`, {
    absent: !data && (res.status === 404 || res.status === 405),
  });
}

/* ------------------------------------------------------------------ */
/*  Status                                                             */
/* ------------------------------------------------------------------ */

/** What the site assumes when it cannot ask: sample data, request checkout. */
export const OFFLINE_STATUS = Object.freeze({
  atd: "sample",
  shopify: "off",
  checkout: "request",
  newsletter: "off",
  forms: "off",
  version: null,
  offline: true,
});

const ABSENT_STATUS = Object.freeze({ ...OFFLINE_STATUS, absent: true });

let statusPromise = null;

/** False only when this host definitely has no API. */
const apiPresent = () => getStatus().then((s) => !s.absent);

/** `{ atd, shopify, checkout, newsletter, forms, version }`. Never throws; cached per page load. */
export function getStatus() {
  if (!statusPromise) {
    statusPromise = request("/status", { timeout: TIMEOUT_MS.status })
      .then((s) => ({
        atd: s.atd === "live" ? "live" : "sample",
        shopify: s.shopify === "live" ? "live" : "off",
        checkout: s.checkout === "shopify" ? "shopify" : "request",
        // Only an explicit "on" lets the sign-up pop-up collect an email.
        newsletter: s.newsletter === "on" ? "on" : "off",
        // Only an explicit "on" lets a form say its message was delivered.
        forms: s.forms === "on" ? "on" : "off",
        version: s.version ?? null,
        offline: false,
      }))
      .catch((err) => {
        // No API on this host (plain `vite dev`/`vite preview`, a static
        // host): remember that, so the rest of the page load goes straight
        // to the fallbacks instead of logging a 404 per request.
        if (err?.absent) return ABSENT_STATUS;
        // Otherwise let a later call try again rather than pinning a
        // transient failure.
        statusPromise = null;
        return OFFLINE_STATUS;
      });
  }
  return statusPromise;
}

/* ------------------------------------------------------------------ */
/*  Tire search                                                        */
/* ------------------------------------------------------------------ */

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** "225/45R17", "225/45ZR17", "P225/45R17" → parts, or null. */
export function parseSizeString(size) {
  const m = /^\s*[A-Z]*\s*(\d{3})\s*\/\s*(\d{2})\s*Z?R\s*(\d{2})/i.exec(
    String(size ?? ""),
  );
  if (!m) return null;
  return {
    size: `${m[1]}/${m[2]}R${m[3]}`,
    width: Number(m[1]),
    aspect: Number(m[2]),
    rimDiameter: Number(m[3]),
  };
}

// Install is quoted per tire; the catalog's most common figure is what a live
// tire gets until the API sends one.
const DEFAULT_INSTALL = (() => {
  const counts = new Map();
  TIRES.forEach((t) =>
    counts.set(t.installPrice, (counts.get(t.installPrice) || 0) + 1),
  );
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 25;
})();

function catalogMatch(item) {
  const id = String(item.id ?? "");
  const sku = String(item.sku ?? "");
  const exact = TIRES.find(
    (t) =>
      (id && (t.id === id || t.slug === id)) ||
      (sku && (t.id === sku || t.slug === sku)),
  );
  if (exact) return { product: exact, sameSize: true };

  const brand = norm(item.brand);
  const model = norm(item.model);
  if (!brand || !model) return null;
  const sameModel = TIRES.filter(
    (t) => norm(t.brand) === brand && norm(t.model) === model,
  );
  if (!sameModel.length) return null;
  const size = parseSizeString(item.size)?.size;
  const sameSize = sameModel.find((t) => t.size === size);
  return { product: sameSize || sameModel[0], sameSize: Boolean(sameSize) };
}

/**
 * Turns one API item into the product shape the cards, filters and rankings
 * read. Sample items resolve to their catalog entry, unchanged, so the
 * fallback renders exactly as the catalog always has. Live ATD items keep
 * their own SKU, size, price and stock, and borrow the model-level facts
 * (category, UTQG, warranty) from the catalog entry for the same model when
 * there is one. They carry no slug, because a live tire must not link to a
 * sample page quoting a sample price; their page is /tires/p/:sku instead
 * (see productHref in products.js, and getTire).
 */
export function toProduct(item, source) {
  const match = catalogMatch(item);
  if (source !== "atd" && match?.sameSize) {
    return {
      ...match.product,
      sku: item.sku ?? match.product.id,
      available: item.available ?? null,
      qty: item.qty ?? null,
    };
  }

  const parsed = parseSizeString(item.size);
  const base = match?.product;
  const loadIndex = item.loadIndex ?? base?.loadIndex ?? "";
  const speedRating = item.speedRating ?? base?.speedRating ?? "";
  const specs = base
    ? {
        ...base.specs,
        "Tire Size": parsed?.size ?? item.size,
        "Load Index": String(loadIndex),
        "Speed Rating": String(speedRating),
      }
    : {};

  return {
    id: `atd-${item.sku ?? item.id}`,
    sku: item.sku ?? item.id,
    slug: null,
    kind: "tire",
    brand: item.brand ?? "",
    model: item.model ?? item.title ?? "",
    title: item.title ?? `${item.brand ?? ""} ${item.model ?? ""}`.trim(),
    category: base?.category ?? "Tire",
    seasons: base?.seasons ?? "",
    warranty: base?.warranty ?? "",
    features: [],
    specs,
    price: Number(item.price) || 0,
    installPrice: base?.installPrice ?? DEFAULT_INSTALL,
    accent: base?.accent ?? "#2F6FED",
    size: parsed?.size ?? String(item.size ?? ""),
    width: parsed?.width ?? null,
    aspect: parsed?.aspect ?? null,
    rimDiameter: parsed?.rimDiameter ?? null,
    loadIndex: String(loadIndex),
    speedRating: String(speedRating),
    image: item.image ?? null,
    available: item.available ?? null,
    qty: item.qty ?? null,
    live: true,
  };
}

/** The query in the API's terms, or null when there is nothing to search. */
export function tireQuery({ size, year, make, model, brand, limit } = {}) {
  const q = {};
  const parsed = size ? parseSizeString(size) : null;
  if (parsed) q.size = parsed.size;
  else if (year && make && model) Object.assign(q, { year, make, model });
  else return null;
  if (brand) q.brand = brand;
  if (limit) q.limit = String(limit);
  return q;
}

const queryKey = (q) => new URLSearchParams(q).toString();

/**
 * The sample catalog answering the same question, synchronously. By size it
 * is an exact size match; by vehicle it is the typical original size from the
 * fitment table, or nothing when the table has no record.
 */
export function searchSample(query) {
  const q = tireQuery(query);
  if (!q) return { source: "sample", query: q, items: [], fallback: true };
  const size =
    q.size ?? (q.make && q.model ? oeSizeFor(q.make, q.model)?.size : null);
  let items = size ? TIRES.filter((t) => t.size === size) : [];
  if (q.brand) items = items.filter((t) => norm(t.brand) === norm(q.brand));
  if (q.limit) items = items.slice(0, Number(q.limit));
  return {
    source: "sample",
    query: q,
    items: items.map((t) => ({ ...t, sku: t.id, available: null, qty: null })),
    fallback: true,
  };
}

const searchCache = new Map();
// Finished live answers, readable synchronously for a first render.
const settled = new Map();

/**
 * `{ source: "atd"|"sample", query, items, fallback }`, items already in the
 * product shape. `fallback` is true when the API was not reached and the
 * sample catalog answered instead. Throws ApiError only when the API itself
 * rejected the query.
 */
export function searchTires(query) {
  const q = tireQuery(query);
  if (!q) return Promise.resolve(searchSample(query));
  const key = queryKey(q);
  if (searchCache.has(key)) return searchCache.get(key);

  const pending = apiPresent()
    .then((present) =>
      present
        ? request(`/tires?${key}`, { timeout: TIMEOUT_MS.search })
        : Promise.reject(new Unreachable("no api", { absent: true })),
    )
    .then((data) => {
      const source = data.source === "atd" ? "atd" : "sample";
      const items = Array.isArray(data.items) ? data.items : [];
      const result = {
        source,
        query: data.query ?? q,
        items: items
          .filter((i) => i && (i.sku || i.id))
          .map((i) => toProduct(i, source)),
        fallback: false,
      };
      settled.set(key, result);
      return result;
    })
    .catch((err) => {
      searchCache.delete(key);
      if (err instanceof ApiError) throw err;
      return searchSample(q);
    });

  searchCache.set(key, pending);
  return pending;
}

/** A finished live search for this query, or null — lets a remount skip the wait. */
export function cachedSearch(query) {
  const q = tireQuery(query);
  return q ? (settled.get(queryKey(q)) ?? null) : null;
}

/* ------------------------------------------------------------------ */
/*  One tire by sku (product pages for tires the catalog doesn't list) */
/* ------------------------------------------------------------------ */

/** The sample catalog's answer for a sku (its id) or slug, or null. */
export function sampleTire(sku) {
  const key = String(sku ?? "").trim();
  const tire = key && TIRES.find((t) => t.id === key || t.slug === key);
  if (!tire) return null;
  return {
    source: "sample",
    product: { ...tire, sku: tire.id, available: null, qty: null },
    fallback: true,
  };
}

const tireCache = new Map();

/**
 * `{ source, product, fallback }` for one sku, the product already in the
 * shape the product page reads, or null when there is no such tire.
 *
 * A 404 from the API is its real answer and resolves null, even if the sample
 * catalog happens to hold that id: a live catalog must not show a sample
 * price. Only when the API cannot be reached does the sample catalog answer.
 * Throws ApiError when the API rejects the lookup itself (a malformed sku).
 */
export function getTire(sku) {
  const key = String(sku ?? "").trim();
  if (!key) return Promise.resolve(null);
  if (tireCache.has(key)) return tireCache.get(key);

  const pending = apiPresent()
    .then((present) =>
      present
        ? request(`/tires?sku=${encodeURIComponent(key)}`, {
            timeout: TIMEOUT_MS.search,
          })
        : Promise.reject(new Unreachable("no api", { absent: true })),
    )
    .then((data) => {
      const item = data.item;
      if (!item || typeof item !== "object" || !(item.sku || item.id)) {
        throw new Unreachable("no item");
      }
      const source = data.source === "atd" ? "atd" : "sample";
      return { source, product: toProduct(item, source), fallback: false };
    })
    .catch((err) => {
      if (err instanceof ApiError) {
        if (err.status === 404) return null;
        tireCache.delete(key);
        throw err;
      }
      tireCache.delete(key);
      return sampleTire(key);
    });

  tireCache.set(key, pending);
  return pending;
}

/* ------------------------------------------------------------------ */
/*  Checkout                                                           */
/* ------------------------------------------------------------------ */

/**
 * Sends the order.
 *
 * Resolves one of:
 *   { mode: "redirect", url }                       — pay on Shopify's checkout
 *   { mode: "request", orderRef, total, delivered } — an order request
 * A mobile install order is always a request; it also carries
 * `delivery: "mobile"` and `installNote` ("Install quoted on the call").
 * When the API cannot be reached it resolves request mode with
 * `delivered: false` and `orderRef: null`, so the page can say plainly that
 * nothing reached the shop. Throws ApiError when the server rejects the order
 * (validation), with a message fit to show inline.
 */
export async function submitCheckout(order) {
  try {
    if (!(await apiPresent())) throw new Unreachable("no api", { absent: true });
    const data = await request("/checkout", {
      method: "POST",
      body: order,
      timeout: TIMEOUT_MS.checkout,
    });
    if (data.mode === "redirect" && /^https:\/\//i.test(String(data.url))) {
      return { mode: "redirect", url: String(data.url) };
    }
    if (data.mode === "request") {
      return {
        mode: "request",
        orderRef: data.orderRef ?? null,
        total: typeof data.total === "number" ? data.total : null,
        delivered: data.delivered === true,
        delivery: typeof data.delivery === "string" ? data.delivery : null,
        installNote:
          typeof data.installNote === "string" ? data.installNote : null,
      };
    }
    if (typeof data.error === "string" && data.error.trim()) {
      throw new ApiError(data.error.trim(), 400);
    }
    // An answer we do not understand is not a placed order.
    return { mode: "request", orderRef: null, total: null, delivered: false };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    return {
      mode: "request",
      orderRef: null,
      total: null,
      delivered: false,
      offline: true,
    };
  }
}

/* ------------------------------------------------------------------ */
/*  Newsletter sign-up                                                 */
/* ------------------------------------------------------------------ */

/**
 * Signs an email up (POST /api/newsletter). Resolves `{ ok: true }`. Throws
 * ApiError when the server rejects the input (bad email, too many tries),
 * with a message safe to show; anything else (unreachable, Shopify down,
 * not configured) throws a plain Error for the caller's generic message.
 * `website` is the honeypot's value, normally empty.
 */
export async function subscribeNewsletter({ email, source = "popup", website = "" }) {
  const data = await request("/newsletter", {
    method: "POST",
    body: { email, source, website },
    timeout: TIMEOUT_MS.newsletter,
  });
  if (data?.ok !== true) throw new Error("unexpected answer");
  return data;
}

/* ------------------------------------------------------------------ */
/*  Website forms                                                      */
/* ------------------------------------------------------------------ */

/**
 * Sends one website form (POST /api/forms), which records it in Shopify for
 * the shop. Resolves `{ ok: true }`. Throws ApiError when the server rejects
 * the input (with a message safe to show); anything else (unreachable,
 * Shopify down, not configured) throws a plain Error.
 */
export async function sendForm(body) {
  const data = await request("/forms", {
    method: "POST",
    body,
    timeout: TIMEOUT_MS.forms,
  });
  if (data?.ok !== true) throw new Error("unexpected answer");
  return data;
}
