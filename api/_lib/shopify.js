// Shopify adapter — hosted checkout through a DRAFT ORDER.
//
// How it works: checkout prices every line on the server (catalog.js / atd.js),
// then this file creates a Shopify draft order made of CUSTOM line items
// (title, sku, price, quantity; no Shopify product or variant is created,
// read or changed) and returns the draft order's `invoiceUrl`. The browser is
// sent there, the shopper pays on Shopify's own checkout, and the finished
// order lives in Shopify, where Flow, the order emails and Order Printer see
// it like any other order.
//
// What is real and checked: the mutation and every input field name were
// validated against the Shopify Admin GraphQL schema (DraftOrderInput, API
// version 2026-07). The request is NOT run anywhere by this repository; the
// tests use a mocked fetch.
//
// Rules this file keeps:
//   * Only server-side prices are sent. Dealer cost never reaches Shopify: the
//     priced lines from catalog.js carry no cost field at all.
//   * No discounts: automatic discounts and discount codes are switched off
//     on the draft order itself.
//   * No guessed URLs. A response without an https invoiceUrl is an error,
//     never a fallback link.
//   * Mobile install is never paid here; it stays an order request.
//
// Order requests (checkout's "request" mode, and every mobile install) also
// become a draft order, through buildRequestDraftInput: the same custom lines
// and attributes, tagged "order-request", and NO invoice is sent. The shop
// confirms price and availability, then clicks "Send invoice" in Shopify.
//
// See docs/integrations/shopify-checkout.md.

export const SHOPIFY_TIMEOUT_MS = 8000;
export const SHOPIFY_RETRY_DELAY_MS = 250;

/**
 * Cart-attribute values the Shopify theme, the Flow workflows and the
 * order-confirmation email already key on (shopify/sections/td-cart.liquid,
 * td-product.liquid). They must match character for character.
 */
export const DELIVERY_ATTRIBUTE = Object.freeze({
  ship: "Ship to my address",
  pickup: "Ship to store for install (Extreme Tires, Sunrise)",
});

/** Title of the $0.00 shipping line on the draft order. */
export const SHIPPING_LINE_TITLE = Object.freeze({
  ship: "Free Shipping",
  pickup: "Pickup at Extreme Tires (Sunrise, FL)",
});

/**
 * `Delivery` value for a mobile install request's draft. Only request drafts
 * carry it (mobile is never paid online). The ATD forwarder does not know it,
 * so a paid mobile order is flagged for the shop rather than sent to ATD.
 */
export const MOBILE_DELIVERY_ATTRIBUTE = "Mobile install at my address";

export const SOURCE_ATTRIBUTE = "TireDrop live (Vercel)";
export const ORDER_TAG = "vercel-live";
export const REQUEST_TAG = "order-request";

/** Tag naming how the order is delivered, on every draft this API creates. */
export const DELIVERY_TAG = Object.freeze({
  ship: "ship-to-home",
  pickup: "ship-to-store",
  mobile: "mobile-install",
});

/** First line of every order-request draft's note. */
export const REQUEST_NOTE_HEADING =
  "Request only — confirm price and availability, then Send invoice.";

export const DRAFT_ORDER_CREATE = `mutation draftOrderCreate($input: DraftOrderInput!) {
  draftOrderCreate(input: $input) {
    draftOrder { id name invoiceUrl }
    userErrors { field message }
  }
}`;

export class ShopifyCheckoutError extends Error {
  constructor(message, { status = 502, retryable = false, userErrors = null } = {}) {
    super(message);
    this.name = "ShopifyCheckoutError";
    this.status = status;
    this.retryable = retryable;
    // Shopify's own userErrors, when it returned any. Logged, not shown.
    this.userErrors = userErrors;
  }
}

// ---- Mapping (pure, tested) -------------------------------------------------

const money = (n) => ({ amount: Number(n).toFixed(2), currencyCode: "USD" });

/**
 * "+1XXXXXXXXXX" for a valid North American number, else null so the field is
 * left out: Shopify rejects the whole draft order over a phone it cannot
 * parse, and the phone is also in the note.
 */
export function toE164(phone) {
  let digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  // NANP: area code and exchange both start 2-9.
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) return null;
  return `+1${digits}`;
}

/** Shopify addresses want first and last name apart. */
export function splitName(name) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: null, lastName: parts[0] ?? "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.at(-1) };
}

function lineItem(line) {
  const attributes = [
    line.size ? { key: "Size", value: String(line.size) } : null,
    line.brand ? { key: "Brand", value: String(line.brand) } : null,
  ].filter(Boolean);
  return {
    title: line.title,
    sku: line.sku,
    quantity: line.qty,
    originalUnitPriceWithCurrency: money(line.price),
    requiresShipping: true,
    taxable: true,
    ...(attributes.length ? { customAttributes: attributes } : {}),
  };
}

function noteFor(order) {
  const f = order.fulfillment;
  return [
    `TireDrop live order ${order.orderRef}`,
    `Customer: ${order.customer.name}, ${order.customer.phone}`,
    `Delivery: ${DELIVERY_ATTRIBUTE[f.type]}`,
    order.notes ? `Customer notes: ${order.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * The DraftOrderInput for one priced order. Only "ship" and "pickup" orders
 * are paid through Shopify.
 */
export function buildDraftOrderInput(order) {
  const f = order.fulfillment;
  if (f.type !== "ship" && f.type !== "pickup") {
    throw new ShopifyCheckoutError(
      `A "${f.type}" order is not paid through Shopify.`,
      { status: 500 },
    );
  }
  const phone = toE164(order.customer.phone);

  const input = {
    email: order.customer.email,
    ...(phone ? { phone } : {}),
    note: noteFor(order),
    tags: [ORDER_TAG, DELIVERY_TAG[f.type]],
    customAttributes: [
      { key: "Delivery", value: DELIVERY_ATTRIBUTE[f.type] },
      { key: "Source", value: SOURCE_ATTRIBUTE },
      { key: "Order ref", value: order.orderRef },
    ],
    lineItems: order.lines.map(lineItem),
    shippingLine: {
      title: SHIPPING_LINE_TITLE[f.type],
      priceWithCurrency: money(0),
    },
    // No discounts or coupons on these orders.
    acceptAutomaticDiscounts: false,
    allowDiscountCodesInCheckout: false,
  };

  if (f.type === "ship") {
    const a = f.address;
    input.shippingAddress = {
      ...splitName(order.customer.name),
      address1: a.line1,
      ...(a.line2 ? { address2: a.line2 } : {}),
      city: a.city,
      provinceCode: a.state,
      zip: a.zip,
      countryCode: "US",
      ...(phone ? { phone } : {}),
    };
    if (!input.shippingAddress.firstName) delete input.shippingAddress.firstName;
  }
  return input;
}

/** The request draft note's line about the email nobody verified. */
export const REQUEST_EMAIL_UNVERIFIED =
  "Email UNVERIFIED (typed on the website): confirm it with the customer by phone before you send the invoice.";

/**
 * The DraftOrderInput for an ORDER REQUEST: nothing is charged and no invoice
 * is sent. It is the checkout draft (same custom lines at the server's
 * prices, same Delivery / Source / Order ref attributes, discounts off) with
 * the "order-request" tag and a note telling the shop what to do. Mobile
 * install requests are drafts too, addressed to the service address, with no
 * shipping line: the install is quoted on the call and added before the
 * invoice goes out. `customerId` links the draft to the customer; the caller
 * passes it only for a customer this request created (api/_lib/orders.js),
 * never for an existing one, since nobody verified the email.
 */
export function buildRequestDraftInput(order, { customerId = null } = {}) {
  const f = order.fulfillment;
  const mobile = f.type === "mobile";
  const input = buildDraftOrderInput(
    mobile ? { ...order, fulfillment: { ...f, type: "ship" } } : order,
  );
  const delivery = mobile ? MOBILE_DELIVERY_ATTRIBUTE : DELIVERY_ATTRIBUTE[f.type];
  input.tags = [REQUEST_TAG, ORDER_TAG, DELIVERY_TAG[f.type]];
  input.note = [
    REQUEST_NOTE_HEADING,
    mobile
      ? "Mobile install: add the install charge quoted on the call before you send the invoice."
      : null,
    `TireDrop order request ${order.orderRef}`,
    `Customer: ${order.customer.name}, ${order.customer.phone}`,
    REQUEST_EMAIL_UNVERIFIED,
    `Delivery: ${delivery}`,
    order.notes ? `Customer notes: ${order.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  if (mobile) {
    input.customAttributes = input.customAttributes.map((a) =>
      a.key === "Delivery" ? { key: "Delivery", value: delivery } : a,
    );
    delete input.shippingLine;
  }
  if (customerId) input.purchasingEntity = { customerId };
  return input;
}

// ---- Transport (tested with a mocked fetch) ---------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const graphqlUrl = (cfg) =>
  `https://${cfg.domain}/admin/api/${cfg.apiVersion}/graphql.json`;

/** Shopify's OAuth token endpoint, used by the client credentials grant. */
export const tokenUrl = (cfg) => `https://${cfg.domain}/admin/oauth/access_token`;

/**
 * One POST with a timeout and exactly one retry on a network error, timeout,
 * 429 or 5xx. Other 4xx are not retried.
 *
 * A retried draftOrderCreate can, if the first attempt reached Shopify but its
 * answer was lost, leave one extra unpaid draft order behind. That is
 * harmless (drafts are not orders and charge nothing) and is the trade for not
 * failing a checkout on one dropped connection.
 */
async function postWithRetry(url, init, what, deps) {
  const {
    fetchImpl = globalThis.fetch,
    timeoutMs = SHOPIFY_TIMEOUT_MS,
    retryDelayMs = SHOPIFY_RETRY_DELAY_MS,
  } = deps;
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) await sleep(retryDelayMs);
    try {
      const res = await fetchImpl(url, {
        method: "POST",
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) {
        try {
          return await res.json();
        } catch {
          throw new ShopifyCheckoutError(`Shopify ${what} returned a response that is not JSON.`);
        }
      }
      const retryable = res.status === 429 || res.status >= 500;
      lastError = new ShopifyCheckoutError(
        `Shopify ${what} responded with HTTP ${res.status}.`,
        { retryable },
      );
      if (!retryable) throw lastError;
    } catch (err) {
      if (err instanceof ShopifyCheckoutError) {
        if (!err.retryable) throw err;
        lastError = err;
      } else {
        const timedOut = err?.name === "TimeoutError" || err?.name === "AbortError";
        lastError = new ShopifyCheckoutError(
          timedOut
            ? `Shopify ${what} did not respond within ${timeoutMs} ms.`
            : `Could not reach Shopify for ${what} (${err?.message ?? "network error"}).`,
          { status: timedOut ? 504 : 502, retryable: true },
        );
      }
    }
  }
  throw lastError;
}

// Client-credentials tokens last 24 hours; one is kept per warm function
// instance and renewed five minutes before it runs out.
let cachedToken = null;

/** Test hook. */
export function clearShopifyTokenCache() {
  cachedToken = null;
}

/**
 * The Admin API access token: SHOPIFY_ADMIN_TOKEN as given, or one fetched
 * with the client credentials grant (SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET)
 * for apps made in the Shopify Dev Dashboard.
 */
export async function getAccessToken(cfg, deps = {}) {
  if (cfg.auth === "token") return cfg.token;
  if (cfg.auth !== "client-credentials") {
    throw new ShopifyCheckoutError("Shopify is not configured.", { status: 503 });
  }
  const now = (deps.now ?? Date.now)();
  if (
    cachedToken &&
    cachedToken.domain === cfg.domain &&
    cachedToken.clientId === cfg.clientId &&
    cachedToken.expiresAt > now
  ) {
    return cachedToken.token;
  }
  const json = await postWithRetry(
    tokenUrl(cfg),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
      }).toString(),
    },
    "token request",
    deps,
  );
  if (typeof json?.access_token !== "string" || !json.access_token) {
    throw new ShopifyCheckoutError("Shopify token request did not return an access_token.");
  }
  const lifetimeS = Number.isFinite(json.expires_in) ? json.expires_in : 86399;
  cachedToken = {
    domain: cfg.domain,
    clientId: cfg.clientId,
    token: json.access_token,
    expiresAt: now + Math.max(0, lifetimeS - 300) * 1000,
  };
  return cachedToken.token;
}

/**
 * Turns a GraphQL response into its `data`, or throws ShopifyCheckoutError on
 * top-level `errors` or on a non-empty `userErrors` list under any root
 * field (every Shopify mutation payload carries one).
 */
export function readGraphQLResponse(json) {
  if (Array.isArray(json?.errors) && json.errors.length) {
    const messages = json.errors.map((e) => e?.message).filter(Boolean).join("; ");
    throw new ShopifyCheckoutError(`Shopify rejected the request: ${messages || "GraphQL error"}.`);
  }
  const data = json?.data;
  if (!data || typeof data !== "object") {
    throw new ShopifyCheckoutError("Shopify returned no data.");
  }
  const userErrors = Object.values(data).flatMap((payload) =>
    Array.isArray(payload?.userErrors) ? payload.userErrors : [],
  );
  if (userErrors.length) {
    const messages = userErrors
      .map((e) => [Array.isArray(e?.field) ? e.field.join(".") : null, e?.message].filter(Boolean).join(": "))
      .join("; ");
    throw new ShopifyCheckoutError(`Shopify refused the request: ${messages}.`, { userErrors });
  }
  return data;
}

/**
 * One Admin GraphQL call: authenticates (static token or client credentials),
 * applies the timeout and the single retry on network errors, timeouts, 429
 * and 5xx, and returns `data`, throwing ShopifyCheckoutError on top-level
 * `errors` or any `userErrors`. Shared by every Shopify call this API makes.
 */
export async function shopifyGraphQL(cfg, query, variables = {}, deps = {}) {
  if (cfg?.mode !== "live" || !cfg.ok) {
    throw new ShopifyCheckoutError("Shopify is not configured.", { status: 503 });
  }
  const token = await getAccessToken(cfg, deps);
  const json = await postWithRetry(
    graphqlUrl(cfg),
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    },
    "Admin API",
    deps,
  );
  return readGraphQLResponse(json);
}

/**
 * The invoice URL from draftOrderCreate's `data`. Never falls back to a
 * constructed URL.
 */
export function extractInvoiceUrl(data) {
  const url = data?.draftOrderCreate?.draftOrder?.invoiceUrl;
  let parsed = null;
  try {
    parsed = typeof url === "string" ? new URL(url) : null;
  } catch {
    parsed = null;
  }
  if (!parsed || parsed.protocol !== "https:") {
    throw new ShopifyCheckoutError(
      "Shopify created no usable checkout link (draftOrder.invoiceUrl was missing or not https).",
    );
  }
  return parsed.toString();
}

/**
 * Creates an order-request draft and returns `{ id, name }`. No invoice is
 * sent: draftOrderCreate never sends one, and this API never calls
 * draftOrderInvoiceSend.
 */
export async function createRequestDraft(order, cfg, deps = {}, { customerId } = {}) {
  const input = buildRequestDraftInput(order, { customerId });
  const data = await shopifyGraphQL(cfg, DRAFT_ORDER_CREATE, { input }, deps);
  const draft = data?.draftOrderCreate?.draftOrder;
  if (!draft?.id) throw new ShopifyCheckoutError("Shopify created no draft order.");
  return { id: draft.id, name: draft.name ?? null };
}

/**
 * Creates the draft order and returns its invoiceUrl, the Shopify-hosted
 * checkout the shopper pays on.
 */
export async function createDraftCheckout(order, cfg, deps = {}) {
  const input = buildDraftOrderInput(order);
  const data = await shopifyGraphQL(cfg, DRAFT_ORDER_CREATE, { input }, deps);
  return extractInvoiceUrl(data);
}

// ---- Access scopes ----------------------------------------------------------

/** The scopes this app was granted on the store (validated, Admin 2026-07). */
export const APP_SCOPES_QUERY = `query appAccessScopes {
  currentAppInstallation { accessScopes { handle } }
}`;

export const APP_SCOPES_TTL_MS = 10 * 60 * 1000;

// Per warm function instance, like the token: scopes only change when the
// app is re-installed with a new scope list.
let cachedScopes = null;

/** Test hook. */
export function clearAppScopeCache() {
  cachedScopes = null;
}

/**
 * Whether the app has the access scope `handle` (e.g. "write_orders").
 * Resolves true or false; throws ShopifyCheckoutError when Shopify cannot be
 * asked, so the caller decides whether to try anyway. The answer is cached
 * for APP_SCOPES_TTL_MS.
 */
export async function appHasScope(cfg, handle, deps = {}) {
  const now = (deps.now ?? Date.now)();
  const key = `${cfg?.domain}|${cfg?.clientId || "token"}`;
  if (!cachedScopes || cachedScopes.key !== key || cachedScopes.expiresAt <= now) {
    const data = await shopifyGraphQL(cfg, APP_SCOPES_QUERY, {}, deps);
    const scopes = data?.currentAppInstallation?.accessScopes;
    if (!Array.isArray(scopes)) {
      throw new ShopifyCheckoutError("Shopify did not list the app's access scopes.");
    }
    cachedScopes = {
      key,
      handles: new Set(scopes.map((s) => s?.handle).filter(Boolean)),
      expiresAt: now + APP_SCOPES_TTL_MS,
    };
  }
  return cachedScopes.handles.has(handle);
}
