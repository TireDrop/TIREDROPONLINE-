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

import { Buffer } from "node:buffer";

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
});

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
      `ATD live mode is on, but the ATD "${endpointName}" endpoint has not been confirmed from ATD's documentation yet. Fill in ENDPOINTS.${endpointName} in api/_lib/atd.js (see docs/integrations/atd.md).`,
      { status: 501 },
    );
    this.name = "AtdNotConfirmedError";
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
  for (let attempt = 0; attempt < 2; attempt += 1) {
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
