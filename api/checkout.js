// POST /api/checkout
//   { items: [{ sku, qty }], delivery: "ship" | "pickup" | "mobile",
//     customer: { name, email, phone },
//     address?: { line1, line2, city, state, zip }, notes? }
//
// The server prices every line itself; any client price is ignored.
// Shipping is free to the 48 contiguous states + DC, "pickup" is free
// ship-to-store at Extreme Tires in Sunrise, and "mobile" is van install at
// the customer's address inside the South Florida install area
// (BUSINESS.installArea). Mobile needs an FL address in one of those cities.
//
// Responses:
//   { mode: "redirect", url, orderRef, total }   Shopify-hosted checkout
//       When Shopify checkout is live (`checkout: "shopify"` in /api/status),
//       ship and pickup orders become a Shopify draft order of custom line
//       items at the server's prices, and `url` is its invoiceUrl. The shopper
//       pays there and the order lands in Shopify (api/_lib/shopify.js).
//   { mode: "request", orderRef, total, delivered, paid: false, ... }
//       No payment taken. `delivered` says whether the order request actually
//       reached the shop (via ORDER_WEBHOOK_URL).
// Mobile orders are always "request", with `delivery: "mobile"`, `total` as
// the tires total and `installNote: "Install quoted on the call"`: the van
// is booked and the install priced on the phone, so nothing is charged here.

import { getConfig } from "./_lib/config.js";
import { HttpError, methodNotAllowed, readJsonBody, send } from "./_lib/http.js";
import { validateCheckout } from "./_lib/validate.js";
import { priceLines } from "./_lib/catalog.js";
import {
  buildOrder,
  deliverOrderRequest,
  MOBILE_INSTALL_NOTE,
} from "./_lib/orders.js";
import { createDraftCheckout, ShopifyCheckoutError } from "./_lib/shopify.js";
import { AtdError } from "./_lib/atd.js";

const NO_STORE = { "Cache-Control": "no-store" };

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
export function createCheckoutHandler({ env, atd = {}, shopify = {} } = {}) {
  return async function handler(req, res) {
    if (req.method !== "POST") return methodNotAllowed(res, "POST");

    try {
      const body = await readJsonBody(req);
      const checked = validateCheckout(body);
      if (!checked.ok) return send(res, 400, { error: checked.error }, NO_STORE);

      // Fail loudly on any half-configured integration this order would touch.
      const config = getConfig(env);
      const blocking = [
        ...config.atd.issues.filter(() => config.atd.mode === "live"),
        ...config.shopify.issues,
        ...config.orderWebhook.issues,
      ];
      if (blocking.length) {
        console.error("[checkout] misconfigured:", blocking.join(" "));
        return send(
          res,
          503,
          { error: `Checkout is misconfigured. ${blocking.join(" ")}` },
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

      const result = await deliverOrderRequest(order, config.orderWebhook.url);
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
      // A configured webhook that failed is a server-side failure; an absent
      // webhook is a supported state the UI explains.
      const status = result.reason === "webhook-error" ? 502 : 200;
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
