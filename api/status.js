// GET /api/status — which integrations are live. Never includes secrets:
// only modes, the API version, and (when something is misconfigured) an
// `issues` list that names environment variables but not their values.
//
// `forwarder` is "on" when the ATD forwarder cron will place orders:
// ATD_ORDERING_ENABLED is "true", checkout is on Shopify with ATD live, and
// CRON_SECRET is set (docs/integrations/atd-forwarder.md).

import { getConfig } from "./_lib/config.js";
import { methodNotAllowed, send } from "./_lib/http.js";
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
    version: config.version,
  };
  if (issues.length) body.issues = issues;
  return body;
}

export default function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return methodNotAllowed(res, "GET");
  }
  return send(res, 200, statusBody(getConfig()), { "Cache-Control": "no-store" });
}
