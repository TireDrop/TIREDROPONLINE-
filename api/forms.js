// POST /api/forms
//   { form: "contact" | "financing" | "fleet-quote" | "booking",
//     name, email, phone, ...the form's own fields, website? }
//   A "booking" may carry `order` (TD-260929-ABC234 or 1001, from
//   /schedule?order=). When that paid install order verifies with the
//   form's email, the booking is made ON THE ORDER, the same as /track's
//   panel (api/_lib/installBooking.js: note line, metafield, lead to info@,
//   tag install-booked, untag needs-scheduling) and the answer carries
//   `booking`. Otherwise it is a lead as before, led by "Paid order" with
//   the customer tags install-booking and order-<ref>
//   (docs/integrations/install-scheduling.md).
//
// The site's own form backend. Each submission becomes a lead on the Shopify
// customer (found by email, else phone, or created without any marketing
// consent) and Shopify Flow emails it to info@ (api/_lib/leads.js,
// docs/integrations/website-leads.md). No third-party form service.
//
// Spam guard (api/_lib/spam.js): per-IP rate limit, a 16 KB body cap, the
// `website` honeypot, the `ft` fill-time token (src/data/formGuard.js) and
// conservative content checks. An EXISTING customer's note is never written
// from here: the lead goes to the tiredrop.last_lead / tiredrop.leads
// metafields and fires the alert tags (api/_lib/leads.js).
//
// Responses (all JSON, never cached):
//   200 { ok: true }                   recorded (or a bot: honeypot, too fast,
//                                      forged token or spam content; same
//                                      answer, nothing stored, logged)
//   200 { ok: true, booking }          a paid order's install booked (or
//                                      already booked: booking.alreadyBooked)
//   400 { error }                      bad input; `error` is shown as-is
//                                      (no `ft`: a page from before the guard,
//                                      "reload the page")
//   413 { error }                      body over 16 KB
//   429 { error }                      too many submissions from this client
//   503 { configured: false, error }   Shopify is not configured
//   502/504 { error }                  Shopify refused or did not answer
//
// /api/status reports `forms: "on" | "off"`; the forms only claim delivery
// when it is "on".

import { getConfig } from "./_lib/config.js";
import { HttpError, methodNotAllowed, readJsonBody, send } from "./_lib/http.js";
import { validateLead } from "./_lib/validate.js";
import { ShopifyCheckoutError } from "./_lib/shopify.js";
import { recordLead } from "./_lib/leads.js";
import { bookFromLead } from "./_lib/installBooking.js";
import { clientIp, createRateLimiter } from "./_lib/ratelimit.js";
import {
  BODY_LIMITS,
  STALE_PAGE,
  inspectSubmission,
  logBlocked,
  logRateLimited,
} from "./_lib/spam.js";

const NO_STORE = { "Cache-Control": "no-store" };
const FAILED = "We could not send that just now. Please call the shop instead.";

export const FORMS_RATE_LIMIT = 5;
export const FORMS_RATE_WINDOW_MS = 10 * 60 * 1000;
const limiter = createRateLimiter({ limit: FORMS_RATE_LIMIT, windowMs: FORMS_RATE_WINDOW_MS });

/** Test hook. */
export function resetFormsRateLimit() {
  limiter.reset();
}

/** Body keys that are not free text a person typed for the shop to read. */
const NOT_TEXT = new Set(["name", "contact", "email", "website", "ft", "form"]);

/** What the content check reads: the person's name, and every other typed value. */
export function formsContent(body) {
  const b = body && typeof body === "object" ? body : {};
  return {
    names: [b.name, b.contact],
    texts: Object.entries(b)
      .filter(([key]) => !NOT_TEXT.has(key))
      .map(([, value]) => value),
  };
}

/** The handler, with `env` and Shopify deps (e.g. fetchImpl) injectable for tests. */
export function createFormsHandler({ env, shopify = {}, now = Date.now } = {}) {
  return async function handler(req, res) {
    if (req.method !== "POST") return methodNotAllowed(res, "POST");

    const config = getConfig(env);
    if (config.forms.mode !== "on") {
      if (config.shopify.issues.length) {
        console.error("[forms] Shopify misconfigured:", config.shopify.issues.join(" "));
      }
      return send(
        res,
        503,
        { configured: false, error: "The website forms are not connected yet." },
        NO_STORE,
      );
    }

    if (limiter.hit(clientIp(req), now())) {
      logRateLimited("forms");
      return send(
        res,
        429,
        { error: "Too many messages from this connection. Please wait a few minutes, or call the shop." },
        { ...NO_STORE, "Retry-After": "600" },
      );
    }

    try {
      const body = await readJsonBody(req, { maxBytes: BODY_LIMITS.forms });
      // A bot (honeypot, too fast, forged token, spam content) is answered
      // like a success and nothing is stored.
      const guard = inspectSubmission(body, { env: env ?? process.env, content: formsContent(body) });
      if (guard.verdict === "bot") {
        logBlocked("forms", guard, { form: body?.form });
        return send(res, 200, { ok: true }, NO_STORE);
      }
      if (guard.verdict === "stale") return send(res, 400, { error: STALE_PAGE }, NO_STORE);

      const checked = validateLead(body);
      if (!checked.ok) return send(res, 400, { error: checked.error }, NO_STORE);
      // Honeypot filled (already caught above; kept as a second line).
      if (checked.bot) return send(res, 200, { ok: true }, NO_STORE);

      // A booking for a paid order, whose order verifies with the email on
      // the form, is booked on the order itself, like /track's panel
      // (tags install-booked, note line, lead to info@). Otherwise the lead
      // is recorded as before.
      if (checked.value.order) {
        const booked = await bookFromLead(checked.value, config, { ...shopify, now });
        if (booked) return send(res, booked.status, booked.body, NO_STORE);
      }

      await recordLead(checked.value, config.shopify, {
        ...shopify,
        now: () => new Date(now()),
      });
      return send(res, 200, { ok: true }, NO_STORE);
    } catch (err) {
      if (err instanceof HttpError) {
        return send(res, err.status, { error: err.message }, NO_STORE);
      }
      if (err instanceof ShopifyCheckoutError) {
        console.error(
          "[forms]",
          err.message,
          err.userErrors ? JSON.stringify(err.userErrors) : "",
        );
        const status = err.status >= 500 ? err.status : 502;
        return send(res, status, { error: FAILED }, NO_STORE);
      }
      console.error("[forms] unexpected error", err);
      return send(res, 500, { error: FAILED }, NO_STORE);
    }
  };
}

export default createFormsHandler();
