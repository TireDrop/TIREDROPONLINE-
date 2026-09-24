// POST /api/checkout
//   { items: [{ sku, qty }], delivery: "ship" | "pickup",
//     customer: { name, email, phone },
//     address?: { line1, line2, city, state, zip }, notes? }
//
// The server prices every line itself; any client price is ignored.
// Shipping is free to the 48 contiguous states + DC, and "pickup" is free
// ship-to-store at Extreme Tires in Sunrise.
//
// Responses:
//   { mode: "redirect", url, orderRef, total }   Tire Guru hosted payment
//   { mode: "request", orderRef, total, delivered, paid: false, ... }
//       No payment taken. `delivered` says whether the order request actually
//       reached the shop (via ORDER_WEBHOOK_URL).

import { getConfig } from "./_lib/config.js";
import { HttpError, methodNotAllowed, readJsonBody, send } from "./_lib/http.js";
import { validateCheckout } from "./_lib/validate.js";
import { priceLines } from "./_lib/catalog.js";
import { buildOrder, deliverOrderRequest } from "./_lib/orders.js";
import { createCheckoutRedirect, TireGuruError } from "./_lib/tireguru.js";
import { AtdError } from "./_lib/atd.js";

const NO_STORE = { "Cache-Control": "no-store" };

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, "POST");

  try {
    const body = await readJsonBody(req);
    const checked = validateCheckout(body);
    if (!checked.ok) return send(res, 400, { error: checked.error }, NO_STORE);

    // Fail loudly on any half-configured integration this order would touch.
    const config = getConfig();
    const blocking = [
      ...config.atd.issues.filter(() => config.atd.mode === "live"),
      ...config.tireguru.issues,
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

    const lines = await priceLines(checked.value.items, config);
    const order = buildOrder(checked.value, lines);

    if (config.checkout === "tireguru") {
      const url = await createCheckoutRedirect(order, config.tireguru);
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
    // A configured webhook that failed is a server-side failure; an absent
    // webhook is a supported state the UI explains.
    const status = result.reason === "webhook-error" ? 502 : 200;
    return send(res, status, response, NO_STORE);
  } catch (err) {
    if (err instanceof HttpError || err instanceof AtdError || err instanceof TireGuruError) {
      if (!(err instanceof HttpError)) console.error("[checkout]", err.message);
      return send(res, err.status, { error: err.message }, NO_STORE);
    }
    console.error("[checkout] unexpected error", err);
    return send(res, 500, { error: "Checkout failed. Nothing was charged." }, NO_STORE);
  }
}
