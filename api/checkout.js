// POST /api/checkout
//   { items: [{ sku, qty }], delivery: "ship" | "pickup" | "mobile",
//     customer: { name, email, phone },
//     address?: { line1, line2, city, state, zip }, notes? }
//
// The server prices every line itself; any client price is ignored.
// Shipping is free to the 48 contiguous states + DC, "pickup" is free
// ship-to-store at Extreme Tires in Sunrise, and "mobile" is van install at
// the customer's address inside Miami-Dade, Broward or Palm Beach county.
// Mobile needs an FL address whose ZIP passes isInServiceArea()
// (src/data/serviceArea.js).
//
// Responses:
//   { mode: "redirect", url, orderRef, total }   Shopify-hosted checkout
//       When Shopify checkout is live (`checkout: "shopify"` in /api/status),
//       ship and pickup orders become a Shopify draft order of custom line
//       items at the server's prices, and `url` is its invoiceUrl. The shopper
//       pays there and the order lands in Shopify (api/_lib/shopify.js).
//   { mode: "request", orderRef, total, delivered, paid: false, ... }
//       No payment taken. The request is recorded in Shopify: a lead on the
//       customer, which Shopify Flow emails to info@, and a draft order with
//       no invoice sent (api/_lib/orders.js). `delivered` says whether that
//       actually reached the shop. With Shopify off it is only logged
//       (`delivered: false`, 200); a Shopify failure is a 502.
// Mobile orders are always "request", with `delivery: "mobile"`, `total` as
// the tires total and `installNote: "Install quoted on the call"`: the van
// is booked and the install priced on the phone, so nothing is charged here.
//
// Spam guard (api/_lib/spam.js): per-IP rate limit (CHECKOUT_RATE_LIMIT in
// 10 minutes, 429), a 16 KB body cap (413), the `website` honeypot, the `ft`
// fill-time token and conservative content checks on the name, address and
// notes. A bot gets a request-mode answer that looks delivered, and nothing
// is priced, created or sent; the block is logged without personal data. A
// body without `ft` (a page loaded before the guard) is a 400 asking for a
// reload.
//
// Another customer's data: the order request's lead never writes an
// existing customer's note (api/_lib/leads.js), and its draft is linked to
// the customer only when this request created that customer; the draft's
// note says the email is unverified (api/_lib/orders.js).

import { getConfig } from "./_lib/config.js";
import { HttpError, methodNotAllowed, readJsonBody, send } from "./_lib/http.js";
import { validateCheckout } from "./_lib/validate.js";
import { priceLines } from "./_lib/catalog.js";
import {
  buildOrder,
  deliverOrderRequest,
  makeOrderRef,
  MOBILE_INSTALL_NOTE,
} from "./_lib/orders.js";
import { createDraftCheckout, ShopifyCheckoutError } from "./_lib/shopify.js";
import { AtdError } from "./_lib/atd.js";
import { clientIp, createRateLimiter } from "./_lib/ratelimit.js";
import {
  BODY_LIMITS,
  STALE_PAGE,
  inspectSubmission,
  logBlocked,
  logRateLimited,
} from "./_lib/spam.js";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Order attempts per client IP (per warm instance). Each one that passes can
 * create a customer and a draft order, so the budget is small; a shopper
 * correcting a rejected address a few times stays well inside it.
 */
export const CHECKOUT_RATE_LIMIT = 10;
export const CHECKOUT_RATE_WINDOW_MS = 10 * 60 * 1000;
const limiter = createRateLimiter({ limit: CHECKOUT_RATE_LIMIT, windowMs: CHECKOUT_RATE_WINDOW_MS });

/** Test hook. */
export function resetCheckoutRateLimit() {
  limiter.reset();
}

/** What the content check reads: the person's name, then address and notes. */
export function checkoutContent(body) {
  const c = body?.customer && typeof body.customer === "object" ? body.customer : {};
  const a = body?.address && typeof body.address === "object" ? body.address : {};
  return {
    names: [c.name],
    texts: [a.line1, a.line2, a.city, a.zip, body?.notes],
  };
}

/** The answer a bot gets: an order request that looks sent. Nothing was. */
function botAnswer(body) {
  const delivery = ["ship", "pickup", "mobile"].includes(body?.delivery) ? body.delivery : "ship";
  return {
    mode: "request",
    orderRef: makeOrderRef(),
    total: null,
    delivered: true,
    paid: false,
    delivery,
  };
}

/**
 * "redirect" when this order goes to the online payment page, "request"
 * otherwise. Online payment needs the checkout provider to be live
 * (`config.checkout` is anything but "request"), and never applies to mobile
 * install: that is booked and priced on the call.
 */
export function paymentModeFor(order, config) {
  if (order.fulfillment.type === "mobile") return "request";
  return config.checkout !== "request" ? "redirect" : "request";
}

/**
 * The handler, with its outside world injectable for tests: `env` (defaults
 * to process.env), `atd` (deps for the ATD lookup, e.g. fetchImpl and
 * endpoints) and `shopify` (deps for the draft order, e.g. fetchImpl).
 */
export function createCheckoutHandler({ env, atd = {}, shopify = {}, now = Date.now } = {}) {
  return async function handler(req, res) {
    if (req.method !== "POST") return methodNotAllowed(res, "POST");

    if (limiter.hit(clientIp(req), now())) {
      logRateLimited("checkout");
      return send(
        res,
        429,
        { error: "Too many order attempts from this connection. Please wait a few minutes, or call the shop." },
        { ...NO_STORE, "Retry-After": "600" },
      );
    }

    try {
      const body = await readJsonBody(req, { maxBytes: BODY_LIMITS.checkout });
      const guard = inspectSubmission(body, { env: env ?? process.env, content: checkoutContent(body) });
      if (guard.verdict === "bot") {
        logBlocked("checkout", guard);
        return send(res, 200, botAnswer(body), NO_STORE);
      }
      if (guard.verdict === "stale") return send(res, 400, { error: STALE_PAGE }, NO_STORE);

      const checked = validateCheckout(body);
      if (!checked.ok) return send(res, 400, { error: checked.error }, NO_STORE);

      // Fail loudly on any half-configured integration this order would touch.
      const config = getConfig(env);
      const blocking = [
        ...config.atd.issues.filter(() => config.atd.mode === "live"),
        ...config.shopify.issues,
      ];
      if (blocking.length) {
        console.error("[checkout] misconfigured:", blocking.join(" "));
        return send(
          res,
          503,
          { error: "Checkout is temporarily unavailable. Please try again in a few minutes, or call the shop." },
          NO_STORE,
        );
      }

      const lines = await priceLines(checked.value.items, config, atd);
      const order = buildOrder(checked.value, lines);

      if (paymentModeFor(order, config) === "redirect") {
        const url = await createDraftCheckout(order, config.shopify, shopify);
        return send(
          res,
          200,
          { mode: "redirect", url, orderRef: order.orderRef, total: order.total },
          NO_STORE,
        );
      }

      const result = await deliverOrderRequest(order, config.shopify, shopify);
      const response = {
        mode: "request",
        orderRef: order.orderRef,
        total: order.total,
        delivered: result.delivered,
        paid: false,
        delivery: order.fulfillment.type,
        shipping: order.shipping,
        lines: order.lines,
      };
      if (order.fulfillment.type === "pickup") {
        response.pickup = order.fulfillment.location;
      }
      if (order.fulfillment.type === "mobile") {
        // `total` above is the tires only; install labour is not added.
        response.installNote = MOBILE_INSTALL_NOTE;
        response.serviceAddress = order.fulfillment.address;
      }
      // Shopify refusing is a server-side failure; Shopify switched off is a
      // supported state the UI explains.
      const status = result.reason === "shopify-error" ? 502 : 200;
      return send(res, status, response, NO_STORE);
    } catch (err) {
      if (err instanceof HttpError || err instanceof AtdError || err instanceof ShopifyCheckoutError) {
        if (!(err instanceof HttpError)) {
          console.error("[checkout]", err.message, err.userErrors ? JSON.stringify(err.userErrors) : "");
        }
        return send(res, err.status, { error: err.message }, NO_STORE);
      }
      console.error("[checkout] unexpected error", err);
      return send(res, 500, { error: "Checkout failed. Nothing was charged." }, NO_STORE);
    }
  };
}

export default createCheckoutHandler();
