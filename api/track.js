// POST /api/track   { order: "#1001" | "1001" | "TD-260929-ABC234", email, website? }
//
// The Track My Order page (/track). Looks the order up in Shopify by number
// AND email and answers only when the email matches (api/_lib/track.js).
// `website` is a honeypot the page hides from people.
//
// Responses (all JSON, never cached):
//   200 { found: true, kind: "order", order }       a Shopify order; a paid
//                                                   install order also has
//                                                   order.booking (see
//                                                   api/_lib/booking.js):
//                                                   the booking panel, or
//                                                   the booked day and window
//   200 { found: true, kind: "request", request }   a TD- order request (draft)
//   404 { found: false, error }                     no match: the same answer
//                                                   for a wrong number, a wrong
//                                                   email or a filled honeypot
//   400 { error }                                   not an order number / email
//   429 { error }                                   too many lookups
//   503 { configured: false, error }                Shopify is not configured
//   502/504 { error }                               Shopify refused or timed out

import { getConfig } from "./_lib/config.js";
import { HttpError, methodNotAllowed, readJsonBody, send } from "./_lib/http.js";
import { ShopifyCheckoutError } from "./_lib/shopify.js";
import {
  lookupOrder,
  orderLookupLimiter,
  TRACK_RATE_LIMIT,
  TRACK_RATE_WINDOW_MS,
  validateTrack,
} from "./_lib/track.js";
import { bookingForOrder } from "./_lib/booking.js";
import { readInstallBooking } from "./_lib/installBooking.js";
import { clientIp } from "./_lib/ratelimit.js";

const NO_STORE = { "Cache-Control": "no-store" };
const FAILED = "We couldn't look that up just now. Please try again, or call the shop.";
export const NOT_FOUND =
  "We couldn't find an order with that number and email. Check both against your confirmation email, or call the shop.";

// Shared with /api/book-install (api/_lib/track.js orderLookupLimiter).
export { TRACK_RATE_LIMIT, TRACK_RATE_WINDOW_MS };
const limiter = orderLookupLimiter;

/** Test hook. */
export function resetTrackRateLimit() {
  limiter.reset();
}

/** The handler, with `env` and Shopify deps (e.g. fetchImpl) injectable for tests. */
export function createTrackHandler({ env, shopify = {}, now = Date.now } = {}) {
  return async function handler(req, res) {
    if (req.method !== "POST") return methodNotAllowed(res, "POST");

    const config = getConfig(env);
    if (!(config.shopify.mode === "live" && config.shopify.ok)) {
      if (config.shopify.issues.length) {
        console.error("[track] Shopify misconfigured:", config.shopify.issues.join(" "));
      }
      return send(
        res,
        503,
        { configured: false, error: "Order lookup isn't available yet. Please call the shop." },
        NO_STORE,
      );
    }

    if (limiter.hit(clientIp(req), now())) {
      return send(
        res,
        429,
        { error: "Too many lookups from this connection. Please wait a few minutes, or call the shop." },
        { ...NO_STORE, "Retry-After": "600" },
      );
    }

    try {
      const checked = validateTrack(await readJsonBody(req));
      if (!checked.ok) return send(res, 400, { error: checked.error }, NO_STORE);
      // Honeypot filled: the same answer as a miss, and Shopify is not asked.
      if (checked.bot) return send(res, 404, { found: false, error: NOT_FOUND }, NO_STORE);

      const found = await lookupOrder(checked.value, config.shopify, shopify, {
        booking: (node) =>
          bookingForOrder(node, config, shopify, {
            email: checked.value.email,
            readBooking: readInstallBooking,
          }),
      });
      if (!found) return send(res, 404, { found: false, error: NOT_FOUND }, NO_STORE);
      return send(res, 200, { found: true, ...found }, NO_STORE);
    } catch (err) {
      if (err instanceof HttpError) {
        return send(res, err.status, { error: err.message }, NO_STORE);
      }
      if (err instanceof ShopifyCheckoutError) {
        console.error("[track]", err.message);
        const status = err.status >= 500 ? err.status : 502;
        return send(res, status, { error: FAILED }, NO_STORE);
      }
      console.error("[track] unexpected error", err);
      return send(res, 500, { error: FAILED }, NO_STORE);
    }
  };
}

export default createTrackHandler();
