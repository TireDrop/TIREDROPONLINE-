// GET /api/status — which integrations are live. Never includes secrets:
// only modes, the API version, and (when something is misconfigured) an
// `issues` list that names environment variables but not their values.

import { getConfig } from "./_lib/config.js";
import { methodNotAllowed, send } from "./_lib/http.js";

export default function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return methodNotAllowed(res, "GET");
  }
  const config = getConfig();
  const body = {
    atd: config.atd.mode,
    shopify: config.shopify.mode,
    checkout: config.checkout,
    version: config.version,
  };
  if (config.issues.length) body.issues = config.issues;
  return send(res, 200, body, { "Cache-Control": "no-store" });
}
