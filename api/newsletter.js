// POST /api/newsletter   { email, source?: "popup" | "footer", website? }
//
// Signs an email up for the TireDrop newsletter as a Shopify customer with
// email marketing consent (see api/_lib/newsletter.js).
//
// Spam guard (api/_lib/spam.js): per-IP rate limit (5 in 10 minutes), a 2 KB
// body cap, the `website` honeypot and the `ft` fill-time token
// (src/data/formGuard.js). A bot gets the normal success and nothing is sent
// to Shopify; the block is logged without the email.
//
// Responses (all JSON, never cached):
//   200 { ok: true }                   signed up (new or existing customer;
//                                      the answer is the same, so it cannot
//                                      be used to test whether an email has
//                                      an account)
//   400 { error }                      bad email or body (no `ft`: a page
//                                      from before the guard, "reload")
//   413 { error }                      body over 2 KB
//   429 { error }                      too many attempts from this client
//   503 { configured: false, error }   Shopify is not configured
//   502/504 { error }                  Shopify refused or did not answer
//
// /api/status reports `newsletter: "on" | "off"`; the pop-up only renders
// when it is "on", so no email is ever collected into nowhere.

import { getConfig } from "./_lib/config.js";
import { HttpError, methodNotAllowed, readJsonBody, send } from "./_lib/http.js";
import { validateNewsletter } from "./_lib/validate.js";
import { ShopifyCheckoutError } from "./_lib/shopify.js";
import { clientIp, rateLimited, subscribeEmail } from "./_lib/newsletter.js";
import {
  BODY_LIMITS,
  STALE_PAGE,
  inspectSubmission,
  logBlocked,
  logRateLimited,
} from "./_lib/spam.js";

const NO_STORE = { "Cache-Control": "no-store" };
const FAILED = "We couldn't sign you up just now. Please try again in a few minutes.";

/** The handler, with `env` and Shopify deps (e.g. fetchImpl) injectable for tests. */
export function createNewsletterHandler({ env, shopify = {}, now = Date.now } = {}) {
  return async function handler(req, res) {
    if (req.method !== "POST") return methodNotAllowed(res, "POST");

    const config = getConfig(env);
    if (config.newsletter.mode !== "on") {
      if (config.shopify.issues.length) {
        console.error("[newsletter] Shopify misconfigured:", config.shopify.issues.join(" "));
      }
      return send(
        res,
        503,
        { configured: false, error: "Newsletter sign-up is not available yet." },
        NO_STORE,
      );
    }

    if (rateLimited(clientIp(req), now())) {
      logRateLimited("newsletter");
      return send(
        res,
        429,
        { error: "Too many sign-up attempts. Please wait a few minutes and try again." },
        { ...NO_STORE, "Retry-After": "600" },
      );
    }

    try {
      const body = await readJsonBody(req, { maxBytes: BODY_LIMITS.newsletter });
      // Honeypot, too fast or a forged token: answer like a success, send
      // nothing anywhere.
      const guard = inspectSubmission(body, { env: env ?? process.env });
      if (guard.verdict === "bot") {
        logBlocked("newsletter", guard);
        return send(res, 200, { ok: true }, NO_STORE);
      }
      if (guard.verdict === "stale") return send(res, 400, { error: STALE_PAGE }, NO_STORE);

      const checked = validateNewsletter(body);
      if (!checked.ok) return send(res, 400, { error: checked.error }, NO_STORE);
      if (checked.bot) return send(res, 200, { ok: true }, NO_STORE);

      const { email, source } = checked.value;
      await subscribeEmail(email, source, config.shopify, shopify);
      return send(res, 200, { ok: true }, NO_STORE);
    } catch (err) {
      if (err instanceof HttpError) {
        return send(res, err.status, { error: err.message }, NO_STORE);
      }
      if (err instanceof ShopifyCheckoutError) {
        console.error(
          "[newsletter]",
          err.message,
          err.userErrors ? JSON.stringify(err.userErrors) : "",
        );
        const status = err.status >= 500 ? err.status : 502;
        return send(res, status, { error: FAILED }, NO_STORE);
      }
      console.error("[newsletter] unexpected error", err);
      return send(res, 500, { error: FAILED }, NO_STORE);
    }
  };
}

export default createNewsletterHandler();
