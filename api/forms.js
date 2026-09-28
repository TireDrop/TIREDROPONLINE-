// POST /api/forms
//   { form: "contact" | "financing" | "fleet-quote" | "booking",
//     name, email, phone, ...the form's own fields, website? }
//
// The site's own form backend. Each submission becomes a lead on the Shopify
// customer (found by email, else phone, or created without any marketing
// consent) and Shopify Flow emails it to info@ (api/_lib/leads.js,
// docs/integrations/website-leads.md). No third-party form service.
// `website` is a honeypot the forms hide from people.
//
// Responses (all JSON, never cached):
//   200 { ok: true }                   recorded (or a bot filled the honeypot:
//                                      same answer, nothing stored)
//   400 { error }                      bad input; `error` is shown as-is
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
import { clientIp, createRateLimiter } from "./_lib/ratelimit.js";

const NO_STORE = { "Cache-Control": "no-store" };
const FAILED = "We could not send that just now. Please call the shop instead.";

export const FORMS_RATE_LIMIT = 5;
export const FORMS_RATE_WINDOW_MS = 10 * 60 * 1000;
const limiter = createRateLimiter({ limit: FORMS_RATE_LIMIT, windowMs: FORMS_RATE_WINDOW_MS });

/** Test hook. */
export function resetFormsRateLimit() {
  limiter.reset();
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
      return send(
        res,
        429,
        { error: "Too many messages from this connection. Please wait a few minutes, or call the shop." },
        { ...NO_STORE, "Retry-After": "600" },
      );
    }

    try {
      const checked = validateLead(await readJsonBody(req));
      if (!checked.ok) return send(res, 400, { error: checked.error }, NO_STORE);
      // Honeypot filled: answer like a success, store nothing.
      if (checked.bot) return send(res, 200, { ok: true }, NO_STORE);

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
