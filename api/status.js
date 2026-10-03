// GET /api/status — which integrations are live. Never includes secrets:
// only modes, the API version, and (when something is misconfigured) an
// `issues` list that names environment variables but not their values.
//
// `forwarder` is "on" when the ATD forwarder cron will place orders:
// ATD_ORDERING_ENABLED is "true", checkout is on Shopify with ATD live, and
// CRON_SECRET is set (docs/integrations/atd-forwarder.md).
//
// `newsletter` is "on" when POST /api/newsletter can reach Shopify (Shopify
// fully configured). The React sign-up pop-up only renders when it is "on".
//
// `forms` is "on" when POST /api/forms can record leads in Shopify (Shopify
// fully configured). The site's forms only claim delivery when it is "on".
//
// `webhooks` is "configured" when POST /api/webhooks/shopify can verify a
// delivery (SHOPIFY_WEBHOOK_SECRET or SHOPIFY_CLIENT_SECRET is set), "off"
// otherwise (docs/integrations/webhooks.md).
//
// `booking` is "external" when INSTALL_BOOKING_URL is a usable https link
// template (the /track "Schedule your install" button opens it, filled for
// the verified order), "internal" otherwise (the button opens
// /schedule?order=<ref>). The link itself is never in this body
// (docs/integrations/install-scheduling.md).
//
// `scanner` is "on" when ANTHROPIC_API_KEY is set, so the Tire Size Finder
// (/tire-size-finder) can read a photo; "off" shows "Photo scan coming soon"
// there, and typed VIN and size entry keep working.

import { getConfig } from "./_lib/config.js";
import { getQuery, methodNotAllowed, send } from "./_lib/http.js";
import { geoHandler } from "./_lib/geo.js";
import { ENDPOINTS as ATD_ENDPOINTS } from "./_lib/atd.js";

/** Status body; `endpoints` is injectable for tests. */
export function statusBody(config, endpoints = ATD_ENDPOINTS) {
  const issues = [...config.issues];
  if (config.forwarder.mode === "on") {
    // The forwarder is switched on, but these passes still do nothing.
    if (!endpoints.placeOrder) {
      issues.push(
        "The ATD forwarder is on, but ENDPOINTS.placeOrder in api/_lib/atd.js is not configured (confirm with ATD docs), so no order is placed with ATD.",
      );
    }
    if (!endpoints.orderStatus) {
      issues.push(
        "The ATD forwarder is on, but ENDPOINTS.orderStatus is not configured, so tracking is not synced to Shopify.",
      );
    }
  }
  const body = {
    atd: config.atd.mode,
    shopify: config.shopify.mode,
    checkout: config.checkout,
    forwarder: config.forwarder.mode,
    newsletter: config.newsletter.mode,
    forms: config.forms.mode,
    webhooks: config.webhooks.mode,
    booking: config.booking.mode,
    scanner: config.scanner.mode,
    version: config.version,
  };
  if (issues.length) body.issues = issues;
  return body;
}

export default function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return methodNotAllowed(res, "GET");
  }
  // /api/geo is rewritten here (vercel.json): Hobby allows 12 functions, all taken.
  if (getQuery(req).geo === "1") return geoHandler(req, res);
  return send(res, 200, statusBody(getConfig()), { "Cache-Control": "no-store" });
}
