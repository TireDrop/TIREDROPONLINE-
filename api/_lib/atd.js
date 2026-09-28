// ATD (American Tire Distributors) adapter — tire data, dealer cost and stock
// through ATD's "Ship to Home" program.
//
// STATUS: UNCONFIRMED. No ATD credentials or API documentation exist yet.
// Everything below that talks to ATD is a clearly marked placeholder:
//
//   * ENDPOINTS are null on purpose. Until a path is filled in from ATD's
//     docs, LIVE mode throws AtdNotConfirmedError (HTTP 501) instead of
//     guessing a URL. Nothing here is a real ATD endpoint.
//   * atdAuthHeaders, build*Request, extractAtdList, extractAtdItem and
//     mapAtdProduct are the only places that know ATD's wire format. Each carries a
//     TODO(confirm with ATD docs) naming what needs checking.
//
// What IS real and tested: the timeout, the single retry, the 5-minute
// in-memory cache, the retail pricing formula and the fail-loud behaviour.
// See docs/integrations/atd.md for the questions to put to the ATD rep.
//
// ORDER PLACEMENT (placeAtdOrder, getAtdOrderStatus, cancelAtdOrder) is used
// by the ATD forwarder (api/_lib/forwarder.js, docs/integrations/atd-forwarder.md).
// It follows the same rules: endpoints null until confirmed, every wire
// field a TODO(confirm with ATD docs), and one extra rule of its own — an
// order is NEVER retried automatically, because a retry after a lost answer
// could buy the same tires twice.

import { Buffer } from "node:buffer";
import { BUSINESS } from "../../src/data/business.js";

export const ATD_TIMEOUT_MS = 4500; // x2 attempts stays inside a 10s function
export const ATD_RETRY_DELAY_MS = 250;
export const ATD_CACHE_TTL_MS = 5 * 60 * 1000;
const ATD_CACHE_MAX_ENTRIES = 200;

/**
 * Request paths, relative to ATD_API_BASE.
 *
 * TODO(confirm with ATD docs): fill each in from ATD's API reference. They
 * are null because we do not know them, and a guessed path would send real
 * credentials to a URL nobody has checked.
 */
export const ENDPOINTS = Object.freeze({
  searchBySize: null, // TODO(confirm with ATD docs): catalog/inventory search by tire size
  searchByVehicle: null, // TODO(confirm with ATD docs): fitment search by year/make/model, if ATD offers it
  lookupSkus: null, // TODO(confirm with ATD docs): price + stock for specific SKUs (used at checkout)
  // TODO(confirm with ATD docs): one product's details, price and stock by
  // SKU, for its product page. It may turn out to be the same call as
  // lookupSkus with a single SKU; if so, point both at the same path.
  getBySku: null,
  // TODO(confirm with ATD docs): submit a Ship to Home order (consumer or
  // store delivery address, SKUs, quantities, our reference). POST expected.
  placeOrder: null,
  // TODO(confirm with ATD docs): an order's status and shipment tracking by
  // ATD order / PO number. Unknown whether ATD offers polling at all, or only
  // webhooks (question 10 in docs/integrations/atd.md).
  orderStatus: null,
  // TODO(confirm with ATD docs): cancel an order before it ships, and the
  // cutoff after which it can no longer be cancelled.
  cancelOrder: null,
});

export const ATD_ORDER_TIMEOUT_MS = 10000; // one attempt only; see placeAtdOrder

export class AtdError extends Error {
  constructor(message, { status = 502, retryable = false, upstreamStatus = null } = {}) {
    super(message);
    this.name = "AtdError";
    this.status = status;
    this.retryable = retryable;
    // ATD's own HTTP status, when it answered with one.
    this.upstreamStatus = upstreamStatus;
  }
}

export class AtdNotConfirmedError extends AtdError {
  constructor(endpointName) {
    super(
      `The ATD "${endpointName}" endpoint is not configured: confirm with ATD docs, then fill in ENDPOINTS.${endpointName} in api/_lib/atd.js (see docs/integrations/atd.md). No request was sent.`,
      { status: 501 },
    );
    this.name = "AtdNotConfirmedError";
    this.endpointName = endpointName;
  }
}

// ---- Pricing (real, tested) -------------------------------------------------

const cents = (n) => Math.round(n * 100) / 100;

/**
 * Retail price per tire from ATD dealer cost: markup, then freight folded in,
 * because the storefront advertises shipping as free.
 */
export function retailPrice(dealerCost, atdConfig) {
  const cost = Number(dealerCost);
  if (!Number.isFinite(cost) || cost <= 0) return null;
  return cents(
    cost * (1 + (atdConfig.markupPct ?? 0) / 100) +
      (atdConfig.freightPerTire ?? 0),
  );
}

// ---- Wire-format mapping (PLACEHOLDERS) -------------------------------------

/**
 * TODO(confirm with ATD docs): the auth scheme. Unknown whether ATD uses an
 * API key header, HTTP Basic, OAuth2 client credentials (key + secret
 * exchanged for a bearer token), or signed requests. This placeholder sends
 * HTTP Basic with key:secret, and exists only so the rest of the pipeline can
 * be exercised; replace it wholesale once the scheme is known.
 */
export function atdAuthHeaders(cfg) {
  const token = Buffer.from(`${cfg.key}:${cfg.secret}`).toString("base64");
  return {
    Authorization: `Basic ${token}`,
    Accept: "application/json",
  };
}

/**
 * TODO(confirm with ATD docs): parameter names for a size search, and whether
 * account / ship-to go in the query, a header or the body.
 */
export function buildSizeSearchRequest(size, cfg, endpoints = ENDPOINTS) {
  if (!endpoints.searchBySize) throw new AtdNotConfirmedError("searchBySize");
  return {
    method: "GET",
    path: endpoints.searchBySize,
    query: {
      // Placeholder parameter names — not from ATD docs.
      size: size.normalized,
      account: cfg.accountNumber,
      shipTo: cfg.shipTo,
    },
  };
}

/** TODO(confirm with ATD docs): vehicle fitment search parameters. */
export function buildVehicleSearchRequest(vehicle, cfg, endpoints = ENDPOINTS) {
  if (!endpoints.searchByVehicle) {
    throw new AtdNotConfirmedError("searchByVehicle");
  }
  return {
    method: "GET",
    path: endpoints.searchByVehicle,
    query: {
      // Placeholder parameter names — not from ATD docs.
      year: String(vehicle.year),
      make: vehicle.make,
      model: vehicle.model,
      account: cfg.accountNumber,
      shipTo: cfg.shipTo,
    },
  };
}

/** TODO(confirm with ATD docs): how to price/stock-check a list of SKUs. */
export function buildSkuLookupRequest(skus, cfg, endpoints = ENDPOINTS) {
  if (!endpoints.lookupSkus) throw new AtdNotConfirmedError("lookupSkus");
  return {
    method: "GET",
    path: endpoints.lookupSkus,
    query: {
      // Placeholder parameter names — not from ATD docs.
      skus: skus.join(","),
      account: cfg.accountNumber,
      shipTo: cfg.shipTo,
    },
  };
}

/** TODO(confirm with ATD docs): single-product lookup parameters. */
export function buildGetBySkuRequest(sku, cfg, endpoints = ENDPOINTS) {
  if (!endpoints.getBySku) throw new AtdNotConfirmedError("getBySku");
  return {
    method: "GET",
    path: endpoints.getBySku,
    query: {
      // Placeholder parameter names — not from ATD docs.
      sku,
      account: cfg.accountNumber,
      shipTo: cfg.shipTo,
    },
  };
}

/**
 * TODO(confirm with ATD docs): where the product list sits in a response.
 * The placeholder accepts a bare array or an `items` array and fails loudly
 * on anything else rather than returning an empty result that looks real.
 */
export function extractAtdList(json) {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.items)) return json.items;
  throw new AtdError(
    "ATD response did not contain a product list in the expected place (see extractAtdList in api/_lib/atd.js).",
  );
}

/**
 * Maps one ATD product record onto the /api/tires item shape.
 *
 * TODO(confirm with ATD docs): every source field name below is a
 * placeholder. The dealer cost is used to compute `price` and is never passed
 * through — it must not reach the browser.
 */
export function mapAtdProduct(raw, atdConfig) {
  const sku = raw?.sku; // TODO(confirm with ATD docs)
  const cost = raw?.dealerCost; // TODO(confirm with ATD docs): which price field is our cost for Ship to Home
  const price = retailPrice(cost, atdConfig);
  if (!sku || price === null) {
    throw new AtdError(
      "ATD product record is missing a SKU or a usable cost (see mapAtdProduct in api/_lib/atd.js).",
    );
  }
  const brand = raw.brand ?? null; // TODO(confirm with ATD docs)
  const model = raw.model ?? null; // TODO(confirm with ATD docs)
  const size = raw.size ?? null; // TODO(confirm with ATD docs)
  // TODO(confirm with ATD docs): is stock a count, a per-warehouse list, or a
  // flag? Unknown stock stays null rather than being reported as available.
  const qty = Number.isFinite(raw.quantityAvailable)
    ? raw.quantityAvailable
    : null;
  return {
    id: `atd-${sku}`,
    sku: String(sku),
    brand,
    model,
    size,
    loadIndex: raw.loadIndex != null ? String(raw.loadIndex) : null, // TODO(confirm with ATD docs)
    speedRating: raw.speedRating ?? null, // TODO(confirm with ATD docs)
    price,
    available: qty === null ? null : qty > 0,
    qty,
    image: typeof raw.imageUrl === "string" ? raw.imageUrl : null, // TODO(confirm with ATD docs)
    title: [brand, model, size].filter(Boolean).join(" ") || String(sku),
  };
}

// ---- Transport (real, tested) -----------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildUrl(base, path, query) {
  const url = new URL(
    `${base.replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`,
  );
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  }
  return url;
}

/**
 * One ATD call with a timeout and exactly one retry on timeouts, network
 * errors, 429 and 5xx. Other 4xx responses are not retried.
 */
export async function atdFetch(request, cfg, deps = {}) {
  const {
    fetchImpl = globalThis.fetch,
    timeoutMs = ATD_TIMEOUT_MS,
    retryDelayMs = ATD_RETRY_DELAY_MS,
    // 1 turns the retry off. Order placement and cancellation pass 1: those
    // calls change something at ATD, so a retry is not safe.
    attempts = 2,
  } = deps;
  const url = buildUrl(cfg.base, request.path, request.query);
  const init = {
    method: request.method ?? "GET",
    headers: {
      ...atdAuthHeaders(cfg),
      ...(request.body ? { "Content-Type": "application/json" } : {}),
    },
    body: request.body ? JSON.stringify(request.body) : undefined,
  };

  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt > 0) await sleep(retryDelayMs);
    try {
      const res = await fetchImpl(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) {
        try {
          return await res.json();
        } catch {
          throw new AtdError("ATD returned a response that is not JSON.");
        }
      }
      const retryable = res.status === 429 || res.status >= 500;
      lastError = new AtdError(`ATD responded with HTTP ${res.status}.`, {
        retryable,
        upstreamStatus: res.status,
      });
      if (!retryable) throw lastError;
    } catch (err) {
      if (err instanceof AtdError) {
        if (!err.retryable) throw err;
        lastError = err;
      } else {
        const timedOut = err?.name === "TimeoutError" || err?.name === "AbortError";
        lastError = new AtdError(
          timedOut
            ? `ATD did not respond within ${timeoutMs} ms.`
            : `Could not reach ATD (${err?.message ?? "network error"}).`,
          { status: timedOut ? 504 : 502, retryable: true },
        );
      }
    }
  }
  throw lastError;
}

// ---- Search with a per-instance cache ---------------------------------------

const cache = new Map();

/** Test hook. */
export function clearAtdCache() {
  cache.clear();
}

function cacheGet(key, now) {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (hit.expires <= now) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}

function cacheSet(key, value, now) {
  if (cache.size >= ATD_CACHE_MAX_ENTRIES) {
    cache.delete(cache.keys().next().value); // oldest insertion
  }
  cache.set(key, { value, expires: now + ATD_CACHE_TTL_MS });
}

/**
 * Searches ATD by size ({ type: "size", size }) or vehicle
 * ({ type: "vehicle", year, make, model }). Returns mapped items, unfiltered
 * by brand or limit so one cached result serves every variant of the query.
 */
export async function searchAtd(query, cfg, deps = {}) {
  const { endpoints = ENDPOINTS, now = Date.now } = deps;
  const request =
    query.type === "vehicle"
      ? buildVehicleSearchRequest(query, cfg, endpoints)
      : buildSizeSearchRequest(query.size, cfg, endpoints);

  const key = JSON.stringify([
    cfg.base,
    cfg.accountNumber,
    cfg.shipTo,
    cfg.markupPct,
    cfg.freightPerTire,
    request.path,
    request.query,
  ]);
  const cached = cacheGet(key, now());
  if (cached) return cached;

  const json = await atdFetch(request, cfg, deps);
  const items = extractAtdList(json).map((raw) => mapAtdProduct(raw, cfg));
  cacheSet(key, items, now());
  return items;
}

/**
 * TODO(confirm with ATD docs): the shape of a single-product response. The
 * placeholder accepts one product record, a bare array or an `items` array,
 * and picks the record whose SKU matches. An empty list means "no such SKU".
 */
export function extractAtdItem(json, sku) {
  const records =
    json && typeof json === "object" && !Array.isArray(json) && "sku" in json
      ? [json]
      : extractAtdList(json);
  return records.find((raw) => String(raw?.sku) === String(sku)) ?? null; // TODO(confirm with ATD docs): the SKU field
}

/**
 * One tire by SKU, for its product page: mapped and priced like a search
 * result (markup + freight on dealer cost, cost dropped), or null when ATD
 * does not carry it. Cached like a search, because a product page is a
 * display; checkout re-prices through lookupAtdSkus, uncached.
 *
 * TODO(confirm with ATD docs): whether an unknown SKU is a 404 or an empty
 * result. Both are treated as "not found" here; any other failure throws.
 */
export async function getBySku(sku, cfg, deps = {}) {
  const { endpoints = ENDPOINTS, now = Date.now } = deps;
  const request = buildGetBySkuRequest(sku, cfg, endpoints);
  const key = JSON.stringify([
    "sku",
    cfg.base,
    cfg.accountNumber,
    cfg.shipTo,
    cfg.markupPct,
    cfg.freightPerTire,
    request.path,
    request.query,
  ]);
  const cached = cacheGet(key, now());
  if (cached !== undefined) return cached;

  let json;
  try {
    json = await atdFetch(request, cfg, deps);
  } catch (err) {
    if (err instanceof AtdError && err.upstreamStatus === 404) return null;
    throw err;
  }
  const raw = extractAtdItem(json, sku);
  const item = raw ? mapAtdProduct(raw, cfg) : null;
  cacheSet(key, item, now());
  return item;
}

/**
 * Fresh price and stock for specific SKUs, for checkout. Never cached: the
 * price a customer pays must be the price right now.
 */
export async function lookupAtdSkus(skus, cfg, deps = {}) {
  const { endpoints = ENDPOINTS } = deps;
  const request = buildSkuLookupRequest(skus, cfg, endpoints);
  const json = await atdFetch(request, cfg, deps);
  return extractAtdList(json).map((raw) => mapAtdProduct(raw, cfg));
}

// ---- Order placement (used by the ATD forwarder) ----------------------------
//
// The forwarder (api/_lib/forwarder.js) turns a PAID Shopify order into an
// ATD order. Everything that knows ATD's order wire format is below, and all
// of it is a placeholder until ATD's order documentation is in hand.
//
// What is sent: our reference (the Shopify order name, e.g. "#1001"), the ATD
// account and ship-to numbers, where the tires go, and SKU + quantity per
// line. What is NOT sent: any price. ATD bills its own dealer cost; retail
// prices and the customer's email stay in Shopify.

/**
 * Where ship-to-store orders are delivered: the Sunrise shop, built from the
 * single source of business facts (src/data/business.js) so the address is
 * never typed twice.
 */
export const STORE_SHIP_TO = Object.freeze({
  name: BUSINESS.parent, // "Extreme Tires"
  company: BUSINESS.parent,
  address1: BUSINESS.shop.street, // 7712 West Oakland Park Blvd
  address2: null,
  city: BUSINESS.shop.city, // Sunrise
  state: BUSINESS.shop.state, // FL
  zip: BUSINESS.shop.zip, // 33351
  country: "US",
  phone: BUSINESS.phone, // (954) 773-1896
});

/**
 * The request for one ATD order.
 *
 * `order` is the forwarder's neutral shape, never a raw Shopify object:
 *   { reference: "#1001", delivery: "ship" | "pickup",
 *     shipTo: { name, company, address1, address2, city, state, zip, country, phone },
 *     lines: [{ sku, qty }] }
 * For "pickup" the forwarder passes STORE_SHIP_TO as shipTo.
 *
 * TODO(confirm with ATD docs): every body field name below, whether the
 * account / ship-to numbers go in the body, a header or the path, whether a
 * residential flag or a shipping method must be named, and — most important —
 * that ATD rejects or de-duplicates a second order carrying the same client
 * reference. The forwarder never resends an order whose outcome it does not
 * know, but ATD-side de-duplication is the second lock on that door.
 */
export function buildPlaceOrderRequest(order, cfg, endpoints = ENDPOINTS) {
  if (!endpoints.placeOrder) throw new AtdNotConfirmedError("placeOrder");
  const a = order.shipTo;
  return {
    method: "POST",
    path: endpoints.placeOrder,
    body: {
      // Placeholder field names — not from ATD docs.
      clientReference: order.reference, // TODO(confirm with ATD docs): the idempotency / customer PO field
      account: cfg.accountNumber, // TODO(confirm with ATD docs)
      shipTo: cfg.shipTo, // TODO(confirm with ATD docs): our ATD ship-to (billing location) number
      deliveryType: order.delivery === "pickup" ? "store" : "residential", // TODO(confirm with ATD docs)
      deliveryAddress: {
        // TODO(confirm with ATD docs): address field names and length limits.
        name: a.name,
        company: a.company ?? null,
        address1: a.address1,
        address2: a.address2 ?? null,
        city: a.city,
        state: a.state,
        zip: a.zip,
        country: a.country ?? "US",
        phone: a.phone ?? null,
      },
      lines: order.lines.map((l) => ({ sku: l.sku, quantity: l.qty })), // TODO(confirm with ATD docs)
    },
  };
}

/**
 * TODO(confirm with ATD docs): where ATD puts its order / PO number in the
 * answer to an order. The placeholder accepts `poNumber` or `orderNumber`.
 * An answer without one is NOT a success: the forwarder treats it as an
 * unknown outcome (ATD may or may not have taken the order).
 */
export function extractAtdPo(json) {
  const po = json?.poNumber ?? json?.orderNumber; // TODO(confirm with ATD docs)
  if (po === undefined || po === null || String(po).trim() === "") {
    throw new AtdError(
      "ATD answered the order request but returned no order number (see extractAtdPo in api/_lib/atd.js).",
      { upstreamStatus: 200 },
    );
  }
  return String(po).trim();
}

/**
 * Places one order with ATD and returns `{ po }`. ONE attempt, never a
 * retry: if the answer is lost, ATD may have the order, and only a person
 * checking ATDOnline can say. The caller decides what an error means
 * (see classifyAtdOrderError in forwarder.js).
 *
 * Only the PO number is returned. ATD's answer may carry dealer cost or
 * totals, so the raw response never leaves this function.
 */
export async function placeAtdOrder(order, cfg, deps = {}) {
  const { endpoints = ENDPOINTS, orderTimeoutMs = ATD_ORDER_TIMEOUT_MS } = deps;
  const request = buildPlaceOrderRequest(order, cfg, endpoints);
  const json = await atdFetch(request, cfg, {
    ...deps,
    timeoutMs: orderTimeoutMs,
    attempts: 1,
  });
  return { po: extractAtdPo(json) };
}

/** TODO(confirm with ATD docs): status lookup parameters. */
export function buildOrderStatusRequest(po, cfg, endpoints = ENDPOINTS) {
  if (!endpoints.orderStatus) throw new AtdNotConfirmedError("orderStatus");
  return {
    method: "GET",
    path: endpoints.orderStatus,
    query: {
      // Placeholder parameter names — not from ATD docs.
      po,
      account: cfg.accountNumber,
    },
  };
}

function httpsUrlOrNull(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * TODO(confirm with ATD docs): the shape of an order-status answer. The
 * placeholder reads `status` and a `shipments` array of
 * `{ carrier, trackingNumber, trackingUrl }`. Shipments without a tracking
 * number are dropped; a tracking URL that is not https is dropped (Shopify
 * builds one from the carrier name instead).
 */
export function extractAtdOrderStatus(json) {
  if (!json || typeof json !== "object") {
    throw new AtdError("ATD order status response was not an object (see extractAtdOrderStatus in api/_lib/atd.js).");
  }
  const shipments = Array.isArray(json.shipments) ? json.shipments : []; // TODO(confirm with ATD docs)
  const tracking = shipments
    .map((s) => ({
      company: s?.carrier ? String(s.carrier) : null, // TODO(confirm with ATD docs)
      number: s?.trackingNumber ? String(s.trackingNumber).trim() : "", // TODO(confirm with ATD docs)
      url: s?.trackingUrl ? httpsUrlOrNull(s.trackingUrl) : null, // TODO(confirm with ATD docs)
    }))
    .filter((t) => t.number !== "");
  return {
    status: typeof json.status === "string" ? json.status : null, // TODO(confirm with ATD docs)
    tracking,
  };
}

/**
 * `{ status, tracking: [{ company, number, url }] }` for one ATD order. A
 * read, so the normal single retry applies.
 */
export async function getAtdOrderStatus(po, cfg, deps = {}) {
  const { endpoints = ENDPOINTS } = deps;
  const request = buildOrderStatusRequest(po, cfg, endpoints);
  return extractAtdOrderStatus(await atdFetch(request, cfg, deps));
}

/** TODO(confirm with ATD docs): cancellation method, path and body. */
export function buildCancelOrderRequest(po, cfg, endpoints = ENDPOINTS) {
  if (!endpoints.cancelOrder) throw new AtdNotConfirmedError("cancelOrder");
  return {
    method: "POST", // TODO(confirm with ATD docs): may be DELETE
    path: endpoints.cancelOrder,
    body: { po, account: cfg.accountNumber }, // Placeholder field names — not from ATD docs.
  };
}

/**
 * Asks ATD to cancel an order. One attempt, like placement. Not called by
 * the sweep: cancelling stays a person's decision (for example after a
 * Shopify refund). Exported so a later admin tool can use it.
 *
 * TODO(confirm with ATD docs): what a successful cancellation answer looks
 * like. The placeholder accepts any 2xx JSON answer as "cancelled".
 */
export async function cancelAtdOrder(po, cfg, deps = {}) {
  const { endpoints = ENDPOINTS } = deps;
  const request = buildCancelOrderRequest(po, cfg, endpoints);
  await atdFetch(request, cfg, { ...deps, attempts: 1 });
  return { cancelled: true };
}
