// POST /api/book-install
//   { order: "#1001" | "1001" | "TD-260929-ABC234", email,
//     day: "YYYY-MM-DD", window: "8-10am" | "10-12pm" | "12-2pm" | "2-4pm" | "4-6pm",
//     notes?, website? }
//
// The inline "Schedule your install" panel on /track. Books the customer's
// REQUESTED day and window on a paid install order: note line + metafield
// tiredrop.install_booking on the order, a booking lead to info@ (Flow
// "Website lead alert"), tag install-booked, untag needs-scheduling
// (api/_lib/installBooking.js, docs/integrations/install-scheduling.md).
// The order is checked like /track: number AND email, then paid, not
// cancelled, not fulfilled, involves installation.
//
// Spam guard (api/_lib/spam.js): the shared order-lookup limit (10 in 10
// minutes, with /api/track) plus its own write limit (5 in 10 minutes), a
// 4 KB body cap, the `website` honeypot, the `ft` fill-time token and the
// content check on the notes. A bot gets the same 404 as a wrong order, and
// nothing is looked up or written.
//
// Responses (all JSON, never cached):
//   200 { ok: true, alreadyBooked: false, booking }   booked now
//   200 { ok: true, alreadyBooked: true, booking }    was already booked;
//                                                     nothing changed
//       booking = { day, window, dayLabel, windowLabel, notes }
//   400 { error, field }                 bad order / email / day / window / notes,
//                                        or (field null) a mobile-install order
//                                        whose service ZIP is outside the area,
//                                        or (field null) no `ft`: a page from
//                                        before the spam guard, "reload"
//   404 { error }                        no bookable order for that number and
//                                        email: the same answer for a wrong
//                                        email, an unknown number, an unpaid,
//                                        cancelled or non-install order, or a
//                                        bot (honeypot, too fast, forged
//                                        token, spam notes)
//   413 { error }                        body over 4 KB
//   429 { error }                        too many lookups (shared with /api/track)
//                                        or bookings from this client
//   503 { configured: false, error }     Shopify is not configured, or the app
//                                        lacks write_orders
//   502/504 { error }                    Shopify refused or timed out, or a
//                                        write failed partway (logged; the
//                                        booking is not claimed)

import { getConfig } from "./_lib/config.js";
import { HttpError, methodNotAllowed, readJsonBody, send } from "./_lib/http.js";
import { ShopifyCheckoutError } from "./_lib/shopify.js";
import { orderLookupLimiter } from "./_lib/track.js";
import { clientIp, createRateLimiter } from "./_lib/ratelimit.js";
import {
  BODY_LIMITS,
  STALE_PAGE,
  inspectSubmission,
  logBlocked,
  logRateLimited,
} from "./_lib/spam.js";
import {
  BOOK_FAILED,
  BOOK_NOT_FOUND,
  BOOK_OUT_OF_AREA,
  BOOK_UNAVAILABLE,
  bookOrderInstall,
  bookable,
  findOrderForBooking,
  validateBookInstall,
} from "./_lib/installBooking.js";

const NO_STORE = { "Cache-Control": "no-store" };

/** Bookings per client IP, on top of the shared order-lookup budget. */
export const BOOK_INSTALL_RATE_LIMIT = 5;
export const BOOK_INSTALL_RATE_WINDOW_MS = 10 * 60 * 1000;
const writeLimiter = createRateLimiter({
  limit: BOOK_INSTALL_RATE_LIMIT,
  windowMs: BOOK_INSTALL_RATE_WINDOW_MS,
});

/** Test hook. */
export function resetBookInstallRateLimit() {
  writeLimiter.reset();
}

/** The handler, with `env`, Shopify deps (fetchImpl, log…) and the clock injectable for tests. */
export function createBookInstallHandler({ env, shopify = {}, now = Date.now } = {}) {
  return async function handler(req, res) {
    if (req.method !== "POST") return methodNotAllowed(res, "POST");
    const log = shopify.log ?? console;

    const config = getConfig(env);
    if (!(config.shopify.mode === "live" && config.shopify.ok)) {
      if (config.shopify.issues.length) {
        log.error("[book-install] Shopify misconfigured:", config.shopify.issues.join(" "));
      }
      return send(res, 503, { configured: false, error: BOOK_UNAVAILABLE }, NO_STORE);
    }

    const ip = clientIp(req);
    const overLookups = orderLookupLimiter.hit(ip, now());
    const overWrites = writeLimiter.hit(ip, now());
    if (overLookups || overWrites) {
      logRateLimited("book-install", log);
      return send(
        res,
        429,
        { error: "Too many tries from this connection. Please wait a few minutes, or call the shop." },
        { ...NO_STORE, "Retry-After": "600" },
      );
    }

    try {
      const body = await readJsonBody(req, { maxBytes: BODY_LIMITS["book-install"] });
      const guard = inspectSubmission(body, { env: env ?? process.env, content: { texts: [body?.notes] } });
      if (guard.verdict === "bot") {
        logBlocked("book-install", guard, { log });
        return send(res, 404, { error: BOOK_NOT_FOUND }, NO_STORE);
      }
      if (guard.verdict === "stale") return send(res, 400, { error: STALE_PAGE, field: null }, NO_STORE);

      const checked = validateBookInstall(body, new Date(now()));
      if (!checked.ok) return send(res, 400, { error: checked.error, field: checked.field }, NO_STORE);
      if (checked.bot) return send(res, 404, { error: BOOK_NOT_FOUND }, NO_STORE);

      const deps = { ...shopify, now };
      const node = await findOrderForBooking(checked.value, config.shopify, deps);
      if (!bookable(node)) return send(res, 404, { error: BOOK_NOT_FOUND }, NO_STORE);

      const outcome = await bookOrderInstall(
        node,
        { ...checked.value, source: "Track My Order (/track)" },
        config,
        deps,
      );
      if (outcome.result === "already-booked" || outcome.result === "booked") {
        return send(
          res,
          200,
          { ok: true, alreadyBooked: outcome.result === "already-booked", booking: outcome.booking },
          NO_STORE,
        );
      }
      if (outcome.result === "out-of-area") {
        return send(res, 400, { error: BOOK_OUT_OF_AREA, field: null }, NO_STORE);
      }
      if (outcome.result === "missing-scope") {
        return send(res, 503, { configured: false, error: BOOK_UNAVAILABLE }, NO_STORE);
      }
      return send(res, 502, { error: BOOK_FAILED }, NO_STORE);
    } catch (err) {
      if (err instanceof HttpError) {
        return send(res, err.status, { error: err.message }, NO_STORE);
      }
      if (err instanceof ShopifyCheckoutError) {
        log.error("[book-install]", err.message);
        const status = err.status >= 500 ? err.status : 502;
        return send(res, status, { error: BOOK_FAILED }, NO_STORE);
      }
      log.error("[book-install] unexpected error", err);
      return send(res, 500, { error: BOOK_FAILED }, NO_STORE);
    }
  };
}

export default createBookInstallHandler();
