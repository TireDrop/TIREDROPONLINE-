// Tire Guru adapter — payments and orders.
//
// STATUS: UNCONFIRMED. No Tire Guru credentials or API documentation exist
// yet, and it is not known whether Tire Guru offers a public API, a hosted
// payment link, or an embeddable payment form. Two paths are prepared:
//
//   1. API ("api"): TIREGURU_API_BASE + TIREGURU_API_KEY + TIREGURU_STORE_ID.
//      Creates a hosted checkout session server-side and redirects to it.
//      ENDPOINTS.createCheckout is null on purpose, so this path throws
//      TireGuruNotConfirmedError (HTTP 501) until it is filled in from Tire
//      Guru's docs. Nothing here is a real Tire Guru endpoint.
//
//   2. Hosted link ("link"): TIREGURU_CHECKOUT_URL only. For the case where
//      Tire Guru gives the shop a payment page URL rather than an API. The
//      URL may carry {orderRef}, {total}, {email}, {name} and {phone}
//      placeholders, which are filled in and URL-encoded here.
//      TODO(confirm with Tire Guru docs): which parameters, if any, a hosted
//      payment link accepts, and whether an amount passed in the URL can be
//      tampered with (if so, the link path must not be used for payment).
//
// Neither path marks anything as paid. Payment status can only come back from
// Tire Guru itself (a webhook or a lookup), which is still an open question —
// see docs/integrations/tireguru.md.

export const TIREGURU_TIMEOUT_MS = 8000;

/**
 * TODO(confirm with Tire Guru docs): the path that creates a hosted checkout
 * or payment session. Null until confirmed — a guessed path would send the
 * shop's API key to a URL nobody has checked.
 */
export const ENDPOINTS = Object.freeze({
  createCheckout: null,
});

export class TireGuruError extends Error {
  constructor(message, { status = 502 } = {}) {
    super(message);
    this.name = "TireGuruError";
    this.status = status;
  }
}

export class TireGuruNotConfirmedError extends TireGuruError {
  constructor(endpointName) {
    super(
      `Tire Guru API mode is on, but the "${endpointName}" endpoint has not been confirmed from Tire Guru's documentation yet. Fill in ENDPOINTS.${endpointName} in api/_lib/tireguru.js, or use TIREGURU_CHECKOUT_URL (see docs/integrations/tireguru.md).`,
      { status: 501 },
    );
    this.name = "TireGuruNotConfirmedError";
  }
}

function assertHttps(url, what) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new TireGuruError(`${what} is not a valid URL.`);
  }
  if (parsed.protocol !== "https:") {
    throw new TireGuruError(`${what} must be https.`);
  }
  return parsed.toString();
}

// ---- Hosted link (fallback) -------------------------------------------------

/**
 * Fills the TIREGURU_CHECKOUT_URL template for one order.
 * TODO(confirm with Tire Guru docs): parameter names the link accepts.
 */
export function buildHostedLinkUrl(order, cfg) {
  const values = {
    orderRef: order.orderRef,
    total: order.total.toFixed(2),
    email: order.customer.email,
    name: order.customer.name,
    phone: order.customer.phone,
  };
  const filled = cfg.checkoutUrl.replace(/\{([a-zA-Z]+)\}/g, (match, key) =>
    key in values ? encodeURIComponent(values[key]) : match,
  );
  return assertHttps(filled, "TIREGURU_CHECKOUT_URL");
}

// ---- API (PLACEHOLDERS) -----------------------------------------------------

/**
 * TODO(confirm with Tire Guru docs): auth header and scheme.
 * Placeholder: bearer token.
 */
export function tireGuruAuthHeaders(cfg) {
  return {
    Authorization: `Bearer ${cfg.key}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

/**
 * Maps a TireDrop order onto a Tire Guru checkout request body.
 *
 * TODO(confirm with Tire Guru docs): every field name is a placeholder. Open
 * questions: does Tire Guru want its own part numbers or ATD's; does it need
 * an existing customer record first; how is ship-to-home vs. install at the
 * shop expressed; is tax computed by Tire Guru; where are the return and
 * cancel URLs set.
 */
export function buildCheckoutRequest(order, cfg, endpoints = ENDPOINTS) {
  if (!endpoints.createCheckout) {
    throw new TireGuruNotConfirmedError("createCheckout");
  }
  return {
    method: "POST",
    path: endpoints.createCheckout,
    body: {
      storeId: cfg.storeId,
      reference: order.orderRef,
      currency: "USD",
      customer: order.customer,
      fulfillment: order.fulfillment,
      lines: order.lines.map((line) => ({
        sku: line.sku,
        description: line.title,
        quantity: line.qty,
        unitPrice: line.price,
      })),
      total: order.total,
      notes: order.notes,
    },
  };
}

/**
 * TODO(confirm with Tire Guru docs): where the hosted checkout URL sits in the
 * response. Fails loudly rather than redirecting somewhere unexpected.
 */
export function extractCheckoutUrl(json) {
  const url = json?.checkoutUrl;
  if (typeof url !== "string") {
    throw new TireGuruError(
      "Tire Guru response did not include a checkout URL in the expected place (see extractCheckoutUrl in api/_lib/tireguru.js).",
    );
  }
  return assertHttps(url, "The Tire Guru checkout URL");
}

async function callTireGuru(request, cfg, deps) {
  const { fetchImpl = globalThis.fetch, timeoutMs = TIREGURU_TIMEOUT_MS } = deps;
  const url = `${cfg.base.replace(/\/+$/, "")}/${request.path.replace(/^\/+/, "")}`;
  let res;
  try {
    // Deliberately not retried: creating a checkout is not known to be
    // idempotent, and a retry could create two.
    res = await fetchImpl(url, {
      method: request.method,
      headers: tireGuruAuthHeaders(cfg),
      body: JSON.stringify(request.body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new TireGuruError(
      `Could not reach Tire Guru (${err?.name === "TimeoutError" ? "timed out" : (err?.message ?? "network error")}).`,
    );
  }
  if (!res.ok) {
    throw new TireGuruError(`Tire Guru responded with HTTP ${res.status}.`);
  }
  try {
    return await res.json();
  } catch {
    throw new TireGuruError("Tire Guru returned a response that is not JSON.");
  }
}

/**
 * Returns the URL to send the shopper to for payment.
 */
export async function createCheckoutRedirect(order, cfg, deps = {}) {
  const { endpoints = ENDPOINTS } = deps;
  if (cfg.via === "api") {
    const request = buildCheckoutRequest(order, cfg, endpoints);
    const json = await callTireGuru(request, cfg, deps);
    return extractCheckoutUrl(json);
  }
  if (cfg.via === "link") return buildHostedLinkUrl(order, cfg);
  throw new TireGuruError("Tire Guru is not configured.", { status: 503 });
}
