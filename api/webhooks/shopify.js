// POST /api/webhooks/shopify — Shopify order webhooks.
//
// Topics (the X-Shopify-Topic header):
//   orders/paid         place THIS order with ATD now (forwardOrder in
//                       api/_lib/forwarder.js), behind the same gates as the
//                       cron: the ATD_ORDERING_ENABLED kill switch, Shopify
//                       and ATD live, risk ACCEPT with nothing PENDING (a
//                       pending order is left for the cron), no fraud-review
//                       and no atd-* tag.
//                       Also, whatever the forwarder does: an order that
//                       involves installation (ship-to-store / pickup,
//                       mobile, or an install line) is tagged
//                       needs-scheduling (api/_lib/booking.js; tagsAdd,
//                       idempotent, needs write_orders). A missing scope or
//                       a failed tag is logged and never fails the delivery.
//                       docs/integrations/install-scheduling.md.
//   orders/cancelled    ATD has (or may have) the order: try cancelAtdOrder
//                       (skipped while its endpoint is unconfirmed) and tag
//                       atd-cancel-needed. Not sent yet: tag
//                       cancelled-before-atd.
//   orders/fulfilled,
//   fulfillments/create logged only, for now.
//   anything else       200, ignored.
// The daily cron (api/cron/atd-sweep.js) stays the backup for anything a
// delivery missed.
//
// Security: every delivery must carry X-Shopify-Hmac-Sha256, the base64
// HMAC-SHA256 of the RAW request body. The key is SHOPIFY_WEBHOOK_SECRET
// (webhooks created in Shopify admin, Settings -> Notifications -> Webhooks)
// or SHOPIFY_CLIENT_SECRET (webhooks registered by the app); both are tried,
// each compared in constant time. Anything else is a 401 and nothing is read
// from the body.
//
// Raw body: this is a Web-standard handler (`export async function POST`),
// so Vercel hands over the untouched request and `request.arrayBuffer()`
// reads the raw stream. A classic `(req, res)` handler would not work here:
// Vercel's Node helpers read and buffer the body before the handler runs
// (turned off only project-wide, with NODEJS_HELPERS=0), and a re-serialised
// JSON body does not match Shopify's signature.
//
// Idempotency: X-Shopify-Webhook-Id (one delivery) and X-Shopify-Event-Id
// (one shop action, shared by duplicate subscriptions) are remembered in an
// in-memory LRU per warm instance, so a retry is answered 200 and ignored.
// The real lock is on the order itself: the forwarder's atd-* tags and its
// compare-and-set claim, which also stop a retry that lands on another
// instance.
//
// Speed: Shopify waits 5 s for the whole request. The answer is sent right
// after the checks, and the work continues under Vercel's waitUntil (the
// function may run to maxDuration in vercel.json). Where waitUntil is not
// available (tests, other hosts) the work runs first and a failure answers
// 500, so Shopify retries.
//
// Responses: 200 { ok, ... } | 400 bad JSON | 401 bad signature |
// 413 too large | 503 { configured: false } no secret | 500 work failed.
//
// Setup for Justin: docs/integrations/webhooks.md.

import { createHmac, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import { getConfig } from "../_lib/config.js";
import { forwardOrder, handleOrderCancelled } from "../_lib/forwarder.js";
import { installKind, markNeedsScheduling, restPayloadToNode } from "../_lib/booking.js";

export const WEBHOOK_MAX_BYTES = 1024 * 1024;
export const DEDUPE_MAX_ENTRIES = 2000;

const NO_STORE = { "Cache-Control": "no-store" };

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...NO_STORE },
  });

// ---- Signature -----------------------------------------------------------------

/**
 * True when `header` is the base64 HMAC-SHA256 of `raw` under any of
 * `secrets`. Every candidate is compared in constant time.
 */
export function verifyShopifyHmac(raw, header, secrets) {
  if (typeof header !== "string" || !header.trim()) return false;
  const given = Buffer.from(header.trim(), "base64");
  if (given.length !== 32) return false;
  let ok = false;
  for (const secret of secrets ?? []) {
    if (!secret) continue;
    const expected = createHmac("sha256", secret).update(raw).digest();
    // No early exit: the time taken does not depend on which key matched.
    if (timingSafeEqual(given, expected)) ok = true;
  }
  return ok;
}

// ---- Dedupe --------------------------------------------------------------------

/** A Map in insertion order: the oldest key goes first once it is full. */
function createLru(max) {
  const map = new Map();
  return {
    has: (key) => map.has(key),
    add(key) {
      map.delete(key);
      map.set(key, true);
      while (map.size > max) map.delete(map.keys().next().value);
    },
    delete: (key) => map.delete(key),
    clear: () => map.clear(),
  };
}

const seen = createLru(DEDUPE_MAX_ENTRIES);

/** Test hook. */
export function resetWebhookDedupe() {
  seen.clear();
}

// ---- Topics --------------------------------------------------------------------

export const TOPICS = Object.freeze({
  paid: "orders/paid",
  cancelled: "orders/cancelled",
  fulfilled: "orders/fulfilled",
  fulfillmentCreated: "fulfillments/create",
});

/** The order's GraphQL id from an orders/* payload, or null. */
export function orderGid(payload) {
  const gid = payload?.admin_graphql_api_id;
  if (typeof gid === "string" && /^gid:\/\/shopify\/Order\/\d+$/.test(gid)) return gid;
  const id = payload?.id;
  if ((typeof id === "number" && Number.isSafeInteger(id) && id > 0) || (typeof id === "string" && /^\d+$/.test(id))) {
    return `gid://shopify/Order/${id}`;
  }
  return null;
}

/** Vercel's waitUntil, read the way @vercel/functions reads it; null elsewhere. */
function vercelWaitUntil() {
  try {
    const ctx = globalThis[Symbol.for("@vercel/request-context")]?.get?.();
    return typeof ctx?.waitUntil === "function" ? ctx.waitUntil.bind(ctx) : null;
  } catch {
    return null;
  }
}

/**
 * The handler, with its outside world injectable for tests: `env`
 * (defaults to process.env), `deps` for the forwarder (shopify / atd fetch
 * mocks, clock, log) and `waitUntil` (defaults to Vercel's, when present;
 * pass null to always finish the work before answering).
 */
export function createShopifyWebhookHandler({ env, deps = {}, waitUntil } = {}) {
  return async function POST(request) {
    const log = deps.log ?? console;
    const config = getConfig(env);
    if (config.webhooks.mode !== "configured") {
      log.error("[webhook] SHOPIFY_WEBHOOK_SECRET (or SHOPIFY_CLIENT_SECRET) is not set; delivery refused.");
      return json(503, { configured: false, error: "Webhooks are not configured." });
    }

    const declared = Number(request.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > WEBHOOK_MAX_BYTES) {
      return json(413, { error: "Body too large." });
    }
    const raw = Buffer.from(await request.arrayBuffer());
    if (raw.length > WEBHOOK_MAX_BYTES) return json(413, { error: "Body too large." });

    if (!verifyShopifyHmac(raw, request.headers.get("x-shopify-hmac-sha256"), config.webhooks.secrets)) {
      log.warn("[webhook] HMAC mismatch; delivery refused.");
      return json(401, { error: "Unauthorized." });
    }

    const topic = String(request.headers.get("x-shopify-topic") ?? "").trim().toLowerCase();
    const webhookId = String(request.headers.get("x-shopify-webhook-id") ?? "").trim();
    const eventId = String(request.headers.get("x-shopify-event-id") ?? "").trim();
    const shopDomain = String(request.headers.get("x-shopify-shop-domain") ?? "").trim().toLowerCase();

    const keys = [webhookId && `w:${webhookId}`, eventId && `e:${topic}:${eventId}`].filter(Boolean);
    if (keys.some((k) => seen.has(k))) {
      log.log(`[webhook] ${topic} ${webhookId || eventId}: duplicate, ignored`);
      return json(200, { ok: true, duplicate: true });
    }

    if (shopDomain && config.shopify.domain && shopDomain !== config.shopify.domain) {
      log.warn(`[webhook] ${topic} from ${shopDomain}, not ${config.shopify.domain}; ignored`);
      return json(200, { ok: true, ignored: "other-shop" });
    }

    let payload;
    try {
      payload = JSON.parse(raw.toString("utf8"));
    } catch {
      return json(400, { error: "Body is not JSON." });
    }

    // ---- which work, if any ------------------------------------------------
    let work = null;
    if (topic === TOPICS.fulfilled || topic === TOPICS.fulfillmentCreated) {
      log.log(`[webhook] ${topic} for ${payload?.name ?? payload?.order_id ?? "an order"}: noted, nothing to do yet`);
      for (const k of keys) seen.add(k);
      return json(200, { ok: true, ignored: "no-op-topic" });
    }
    if (topic !== TOPICS.paid && topic !== TOPICS.cancelled) {
      log.log(`[webhook] ${topic || "(no topic)"}: not handled, ignored`);
      return json(200, { ok: true, ignored: "unknown-topic" });
    }
    const id = orderGid(payload);
    if (!id) return json(200, { ok: true, ignored: "no-order-id" });
    if (!(config.shopify.mode === "live" && config.shopify.ok)) {
      log.error(`[webhook] ${topic} ${id}: Shopify is not configured, so the order cannot be read.`);
      return json(200, { ok: true, ignored: "shopify-not-configured" });
    }
    if (topic === TOPICS.paid) {
      // Install scheduling (api/_lib/booking.js) is separate from the ATD
      // forwarder and does not wait for it: an install order is tagged
      // needs-scheduling whether or not anything goes to ATD. It never
      // throws, so it cannot fail the delivery.
      const scheduling = installKind(restPayloadToNode(payload)) !== null;
      if (!config.webhooks.forwarding && !scheduling) {
        log.log(`[webhook] orders/paid ${payload?.name ?? id}: forwarder off (${config.forwarder.reason}); nothing sent to ATD`);
        for (const k of keys) seen.add(k);
        return json(200, { ok: true, ignored: "forwarder-off" });
      }
      work = async () => {
        const booked = scheduling
          ? await markNeedsScheduling(config.shopify, id, payload, {
              ...(deps.shopify ?? {}),
              log,
              ...(deps.now ? { now: deps.now } : {}),
            })
          : null;
        let outcome;
        if (config.webhooks.forwarding) {
          outcome = await forwardOrder(config, id, deps);
        } else {
          log.log(`[webhook] orders/paid ${payload?.name ?? id}: forwarder off (${config.forwarder.reason}); nothing sent to ATD`);
          outcome = { result: "skipped", reason: "forwarder-off" };
        }
        return booked ? { ...outcome, scheduling: booked.result } : outcome;
      };
    } else {
      work = () => handleOrderCancelled(config, id, deps);
    }

    const run = async () => {
      const outcome = await work();
      log.log(`[webhook] ${topic} ${outcome.order ?? id}:`, JSON.stringify({ ...outcome, summary: undefined }));
      return outcome;
    };

    for (const k of keys) seen.add(k);
    const defer = waitUntil === undefined ? vercelWaitUntil() : waitUntil;
    if (defer) {
      // Answer now; the cron catches anything this run does not finish.
      defer(run().catch((err) => log.error(`[webhook] ${topic} ${id} failed:`, err?.message ?? err)));
      return json(200, { ok: true, accepted: true });
    }
    try {
      const outcome = await run();
      return json(200, {
        ok: true,
        result: outcome.result,
        reason: outcome.reason ?? null,
        ...(outcome.scheduling ? { scheduling: outcome.scheduling } : {}),
      });
    } catch (err) {
      // Forget the delivery so Shopify's retry is processed.
      for (const k of keys) seen.delete(k);
      log.error(`[webhook] ${topic} ${id} failed:`, err?.message ?? err);
      return json(500, { error: "Processing failed; Shopify will retry." });
    }
  };
}

export const POST = createShopifyWebhookHandler();
