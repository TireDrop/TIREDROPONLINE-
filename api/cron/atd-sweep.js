// GET /api/cron/atd-sweep — one ATD forwarder sweep (api/_lib/forwarder.js).
//
// Called by Vercel Cron every 5 minutes ("crons" in vercel.json). Vercel
// sends `Authorization: Bearer <CRON_SECRET>` when the CRON_SECRET
// environment variable is set; anything else gets 401, and with no
// CRON_SECRET at all every request gets 401 (fail closed: an open endpoint
// would let anyone trigger ATD orders).
//
// Once authenticated it runs only when the forwarder is ON: Shopify checkout
// configured, ATD live, and ATD_ORDERING_ENABLED exactly "true" (the kill
// switch; off by default). Otherwise it answers 200 { skipped: <reason> }
// and touches nothing — a 200, so Vercel does not report a switched-off
// forwarder as a failing cron job.
//
// Responses:
//   200 { skipped: "..." }                 forwarder off, nothing done
//   200 { ok: true, summary: {...} }       a sweep ran (see forwarder.js)
//   401 { error }                          wrong or missing bearer secret
//   405                                    not GET
//   500 { error }                          the sweep itself crashed
// The summary names orders (#1001) and counts; never secrets or prices.

import { timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import { getConfig } from "../_lib/config.js";
import { methodNotAllowed, send } from "../_lib/http.js";
import { sweep } from "../_lib/forwarder.js";

const NO_STORE = { "Cache-Control": "no-store" };

/** Constant-time check of the Authorization header against the secret. */
export function isAuthorized(req, secret) {
  if (!secret) return false;
  const header = req.headers?.authorization ?? req.headers?.Authorization ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(String(header));
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * The handler, with its outside world injectable for tests: `env`
 * (defaults to process.env) and `deps` for sweep() (shopify / atd fetch
 * mocks, clock, log).
 */
export function createAtdSweepHandler({ env, deps = {} } = {}) {
  return async function handler(req, res) {
    if (req.method !== "GET") return methodNotAllowed(res, "GET");

    const config = getConfig(env);
    if (!isAuthorized(req, config.forwarder.cronSecret)) {
      return send(res, 401, { error: "Unauthorized." }, NO_STORE);
    }
    if (config.forwarder.mode !== "on") {
      return send(res, 200, { skipped: config.forwarder.reason }, NO_STORE);
    }

    try {
      const summary = await sweep(config, deps);
      console.log("[atd-forwarder] sweep", JSON.stringify(summary));
      return send(res, 200, { ok: true, summary }, NO_STORE);
    } catch (err) {
      console.error("[atd-forwarder] sweep crashed", err);
      return send(res, 500, { error: "The ATD sweep failed; see the function log." }, NO_STORE);
    }
  };
}

export default createAtdSweepHandler();
