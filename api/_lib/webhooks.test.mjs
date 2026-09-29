// Shopify webhook tests (api/webhooks/shopify.js). Run with: npm run test:api
//
// Shopify and ATD are mocked: Shopify is a tiny in-memory store that answers
// the forwarder's single-order read and applies its writes, so a second
// delivery sees what the first one wrote. Nothing here touches a real store.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

import {
  createShopifyWebhookHandler,
  orderGid,
  resetWebhookDedupe,
  verifyShopifyHmac,
} from "../webhooks/shopify.js";
import { getConfig } from "./config.js";
import { statusBody } from "../status.js";
import { ORDER_QUERY } from "./forwarder.js";

const SECRET = "whsec_admin_signing_key";
const CLIENT_SECRET = "shpss_app_client_secret";

const ENV = Object.freeze({
  ATD_API_BASE: "https://atd.example.test/api",
  ATD_API_KEY: "k",
  ATD_API_SECRET: "s",
  ATD_ACCOUNT_NUMBER: "1",
  ATD_SHIP_TO: "2",
  PRICE_MARKUP_PCT: "20",
  FREIGHT_PER_TIRE: "10",
  SHOPIFY_STORE_DOMAIN: "tiredrop-test.myshopify.com",
  SHOPIFY_CLIENT_ID: "client-id",
  SHOPIFY_CLIENT_SECRET: CLIENT_SECRET,
  SHOPIFY_WEBHOOK_SECRET: SECRET,
  // The kill switch is ON in these tests unless a test turns it off.
  ATD_ORDERING_ENABLED: "true",
});

const PLACE = Object.freeze({ placeOrder: "orders", cancelOrder: "orders/cancel" });

let nextId = 5000;
function order(over = {}) {
  nextId += 1;
  return {
    id: `gid://shopify/Order/${nextId}`,
    name: `#${nextId}`,
    createdAt: "2026-09-29T14:00:00Z",
    test: false,
    cancelledAt: null,
    tags: ["vercel-live", "ship-to-home"],
    note: "TireDrop live order TD-260929-ABCDEF",
    email: "buyer@example.com",
    phone: "+19545550100",
    displayFinancialStatus: "PAID",
    displayFulfillmentStatus: "UNFULFILLED",
    customAttributes: [{ key: "Delivery", value: "Ship to my address" }],
    risk: { recommendation: "ACCEPT", assessments: [{ riskLevel: "LOW" }] },
    shippingAddress: {
      firstName: "Test", lastName: "Buyer", name: "Test Buyer", company: null,
      address1: "1 Main St", address2: null, city: "Orlando", provinceCode: "FL",
      zip: "32801", countryCodeV2: "US", phone: "+19545550100",
    },
    lineItems: {
      pageInfo: { hasNextPage: false },
      nodes: [{ id: "gid://shopify/LineItem/1", sku: "ATD-1", name: "Tire", quantity: 4, currentQuantity: 4 }],
    },
    atdPo: null,
    atdError: null,
    sendingLock: null,
    ...over,
  };
}

/** In-memory Shopify for the operations the webhook path uses. */
function mockShopify(orders) {
  const calls = [];
  const byId = new Map(orders.map((o) => [o.id, o]));
  let digest = 0;
  const ok = (data) => Response.json({ data });
  const fetchImpl = async (url, init) => {
    if (String(url).endsWith("/admin/oauth/access_token")) {
      return Response.json({ access_token: "shpat_from_client_credentials", expires_in: 86399 });
    }
    const body = JSON.parse(init.body);
    const [, , op] = body.query.match(/^(query|mutation) (\w+)/);
    const v = body.variables;
    calls.push({ op, variables: v });
    switch (op) {
      case "forwarderOrder":
        return ok({ order: byId.has(v.id) ? structuredClone(byId.get(v.id)) : null });
      case "forwarderMetafieldsSet": {
        const userErrors = [];
        for (const m of v.metafields) {
          const o = byId.get(m.ownerId);
          if (m.key === "atd_sending_at") {
            if ((o.sendingLock?.compareDigest ?? null) !== m.compareDigest) {
              userErrors.push({ field: ["metafields"], message: "stale", code: "STALE_OBJECT" });
              continue;
            }
            digest += 1;
            o.sendingLock = { value: m.value, compareDigest: `d${digest}` };
          }
          if (m.key === "atd_po") o.atdPo = { value: m.value };
          if (m.key === "atd_error") o.atdError = { value: m.value };
        }
        return ok({ metafieldsSet: { metafields: [], userErrors } });
      }
      case "forwarderTagsAdd": {
        const o = byId.get(v.id);
        for (const t of v.tags) if (!o.tags.includes(t)) o.tags.push(t);
        return ok({ tagsAdd: { node: { id: v.id }, userErrors: [] } });
      }
      case "forwarderTagsRemove": {
        const o = byId.get(v.id);
        o.tags = o.tags.filter((t) => !v.tags.includes(t));
        return ok({ tagsRemove: { node: { id: v.id }, userErrors: [] } });
      }
      case "forwarderOrderNote":
        byId.get(v.input.id).note = v.input.note;
        return ok({ orderUpdate: { order: { id: v.input.id }, userErrors: [] } });
      default:
        throw new Error(`unexpected Shopify operation ${op}`);
    }
  };
  return { calls, fetchImpl };
}

function mockAtd(reply = () => Response.json({ poNumber: "PO-900" })) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const call = { url: new URL(url), method: init.method, body: init.body ? JSON.parse(init.body) : null };
    calls.push(call);
    return reply(call);
  };
  return { calls, fetchImpl };
}

const quietLog = () => {
  const lines = [];
  const push = (...a) => lines.push(a.join(" "));
  return { lines, log: { log: push, warn: push, error: push, info: push } };
};

function setup(orders, { env = ENV, endpoints = PLACE, atdReply, waitUntil = null } = {}) {
  const shop = mockShopify(orders);
  const atd = mockAtd(atdReply);
  const { log, lines } = quietLog();
  const handler = createShopifyWebhookHandler({
    env: { ...env },
    waitUntil,
    deps: {
      shopify: { fetchImpl: shop.fetchImpl, retryDelayMs: 0 },
      atd: { fetchImpl: atd.fetchImpl, retryDelayMs: 0, endpoints },
      now: () => Date.parse("2026-09-29T15:00:00Z"),
      log,
    },
  });
  return { shop, atd, lines, handler };
}

const sign = (raw, secret = SECRET) => createHmac("sha256", secret).update(raw).digest("base64");

let deliveries = 0;
function delivery(topic, payload, { secret = SECRET, hmac, webhookId, eventId, shop = "tiredrop-test.myshopify.com" } = {}) {
  deliveries += 1;
  const raw = JSON.stringify(payload);
  return new Request("https://tiredroponline.com/api/webhooks/shopify", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-shopify-topic": topic,
      "x-shopify-hmac-sha256": hmac ?? sign(raw, secret),
      "x-shopify-webhook-id": webhookId ?? `wh-${deliveries}`,
      "x-shopify-event-id": eventId ?? `ev-${deliveries}`,
      "x-shopify-shop-domain": shop,
      "x-shopify-api-version": "2026-07",
    },
    body: raw,
  });
}

/** The REST-shaped body Shopify sends for orders/* topics. */
const payloadFor = (o) => ({
  id: Number(o.id.split("/").pop()),
  admin_graphql_api_id: o.id,
  name: o.name,
  email: o.email,
});

async function call(handler, request) {
  const res = await handler(request);
  return { status: res.status, body: await res.json() };
}

beforeEach(() => resetWebhookDedupe());

// ---- signature --------------------------------------------------------------

test("webhook: a valid HMAC over the raw body is processed", async () => {
  const o = order();
  const r = setup([o]);
  const res = await call(r.handler, delivery("orders/paid", payloadFor(o)));
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { ok: true, result: "submitted", reason: null });
  assert.equal(r.atd.calls.length, 1);

  // The app's client secret is accepted too (webhooks the app registers).
  const o2 = order();
  const r2 = setup([o2]);
  const res2 = await call(r2.handler, delivery("orders/paid", payloadFor(o2), { secret: CLIENT_SECRET }));
  assert.equal(res2.status, 200);
  assert.equal(res2.body.result, "submitted");
});

test("webhook: a bad, missing or re-serialised HMAC is a 401 and nothing is read", async () => {
  const o = order();
  const r = setup([o]);
  const bad = [
    delivery("orders/paid", payloadFor(o), { secret: "wrong" }),
    delivery("orders/paid", payloadFor(o), { hmac: "" }),
    delivery("orders/paid", payloadFor(o), { hmac: "not base64 at all" }),
    // Signed over different bytes (same JSON, other spacing): the raw body is what counts.
    delivery("orders/paid", payloadFor(o), { hmac: sign(JSON.stringify(payloadFor(o), null, 2)) }),
  ];
  for (const req of bad) {
    const res = await call(r.handler, req);
    assert.equal(res.status, 401);
    assert.deepEqual(res.body, { error: "Unauthorized." });
  }
  assert.equal(r.shop.calls.length, 0);
  assert.equal(r.atd.calls.length, 0);

  const raw = Buffer.from('{"a":1}');
  assert.equal(verifyShopifyHmac(raw, sign(raw), [SECRET]), true);
  assert.equal(verifyShopifyHmac(raw, sign(raw), []), false);
  assert.equal(verifyShopifyHmac(raw, sign(raw, "x"), [SECRET, CLIENT_SECRET]), false);
});

test("webhook: with no secret at all the endpoint answers 503 and status says off", async () => {
  const env = { ...ENV, SHOPIFY_WEBHOOK_SECRET: "", SHOPIFY_CLIENT_SECRET: "", SHOPIFY_CLIENT_ID: "", SHOPIFY_ADMIN_TOKEN: "shpat_x" };
  const o = order();
  const r = setup([o], { env });
  const res = await call(r.handler, delivery("orders/paid", payloadFor(o)));
  assert.equal(res.status, 503);
  assert.equal(res.body.configured, false);
  assert.equal(statusBody(getConfig(env)).webhooks, "off");
  assert.equal(statusBody(getConfig(ENV)).webhooks, "configured");
  assert.equal(statusBody(getConfig({})).webhooks, "off");
  assert.ok(!JSON.stringify(statusBody(getConfig(ENV))).includes(SECRET), "no secret values in status");
});

// ---- idempotency --------------------------------------------------------------

test("webhook: a repeated X-Shopify-Webhook-Id (or event id) is answered 200 and ignored", async () => {
  const o = order();
  const r = setup([o]);
  const first = await call(r.handler, delivery("orders/paid", payloadFor(o), { webhookId: "same", eventId: "e1" }));
  assert.equal(first.body.result, "submitted");
  const retry = await call(r.handler, delivery("orders/paid", payloadFor(o), { webhookId: "same", eventId: "e1" }));
  assert.deepEqual(retry, { status: 200, body: { ok: true, duplicate: true } });
  // A second subscription for the same action: new webhook id, same event id.
  const twin = await call(r.handler, delivery("orders/paid", payloadFor(o), { webhookId: "other", eventId: "e1" }));
  assert.equal(twin.body.duplicate, true);
  assert.equal(r.atd.calls.length, 1);
});

test("webhook: orders/paid + risk ACCEPT forwards once; a later delivery is stopped by the order's tags", async () => {
  const o = order();
  const r = setup([o]);
  const res = await call(r.handler, delivery("orders/paid", payloadFor(o)));
  assert.equal(res.body.result, "submitted");
  assert.equal(r.atd.calls.length, 1);
  assert.equal(r.atd.calls[0].body.clientReference, o.name);
  assert.deepEqual(o.tags.filter((t) => t.startsWith("atd-")), ["atd-submitted"]);
  assert.equal(o.atdPo.value, "PO-900");
  assert.match(o.note, /placed with ATD, PO PO-900/);
  assert.deepEqual(
    r.shop.calls.map((c) => c.op),
    ["forwarderOrder", "forwarderMetafieldsSet", "forwarderTagsAdd", "forwarderMetafieldsSet", "forwarderTagsAdd", "forwarderOrderNote", "forwarderTagsRemove"],
    "one read, then the same claim / send / record writes as the sweep",
  );

  // A new delivery id (another instance, the LRU long gone): atd-submitted stops it.
  resetWebhookDedupe();
  const again = await call(r.handler, delivery("orders/paid", payloadFor(o)));
  assert.deepEqual(again.body, { ok: true, result: "skipped", reason: "already-tagged" });
  assert.equal(r.atd.calls.length, 1, "never sent twice");
});

test("webhook: risk still pending (or not ACCEPT) does nothing; the cron picks it up", async () => {
  for (const risk of [
    { recommendation: "ACCEPT", assessments: [{ riskLevel: "PENDING" }] },
    { recommendation: "NONE", assessments: [] },
    { recommendation: "INVESTIGATE", assessments: [{ riskLevel: "MEDIUM" }] },
  ]) {
    const o = order({ risk });
    const r = setup([o]);
    const res = await call(r.handler, delivery("orders/paid", payloadFor(o)));
    assert.equal(res.status, 200);
    assert.equal(res.body.result, "skipped");
    assert.match(res.body.reason, /^risk-/);
    assert.equal(r.atd.calls.length, 0);
    assert.deepEqual(r.shop.calls.map((c) => c.op), ["forwarderOrder"], "read only, nothing written");
    assert.deepEqual(o.tags, ["vercel-live", "ship-to-home"]);
  }
  // fraud-review and non-TireDrop orders are left alone too.
  const fraud = order({ tags: ["vercel-live", "ship-to-home", "fraud-review"] });
  const rf = setup([fraud]);
  assert.equal((await call(rf.handler, delivery("orders/paid", payloadFor(fraud)))).body.reason, "fraud-review");
  const theme = order({ tags: [] });
  const rt = setup([theme]);
  assert.equal((await call(rt.handler, delivery("orders/paid", payloadFor(theme)))).body.reason, "not-vercel-live");
  assert.equal(rf.atd.calls.length + rt.atd.calls.length, 0);
});

test("webhook: kill switch off (or ATD not live) means no Shopify read and no ATD call", async () => {
  const cases = [
    { ATD_ORDERING_ENABLED: "" },
    { ATD_ORDERING_ENABLED: "false" },
    { ATD_API_BASE: "", ATD_API_KEY: "", ATD_API_SECRET: "", ATD_ACCOUNT_NUMBER: "", ATD_SHIP_TO: "", PRICE_MARKUP_PCT: "", FREIGHT_PER_TIRE: "" },
  ];
  for (const over of cases) {
    const o = order();
    const r = setup([o], { env: { ...ENV, ...over } });
    const res = await call(r.handler, delivery("orders/paid", payloadFor(o)));
    assert.deepEqual(res, { status: 200, body: { ok: true, ignored: "forwarder-off" } }, JSON.stringify(over));
    assert.equal(r.atd.calls.length, 0);
    assert.equal(r.shop.calls.length, 0);
  }
  // CRON_SECRET only guards the cron; the webhook does not need it.
  assert.equal(getConfig(ENV).forwarder.mode, "off");
  assert.equal(getConfig(ENV).webhooks.forwarding, true);
});

test("webhook: with ATD's placeOrder endpoint unconfirmed (the real null), nothing is claimed or sent", async () => {
  const o = order();
  const r = setup([o], { endpoints: { placeOrder: null, cancelOrder: null } });
  const res = await call(r.handler, delivery("orders/paid", payloadFor(o)));
  assert.deepEqual(res.body, { ok: true, result: "skipped", reason: "place-order-not-configured" });
  assert.equal(r.shop.calls.length, 0);
  assert.equal(r.atd.calls.length, 0);
});

// ---- cancellations --------------------------------------------------------------

test("webhook: orders/cancelled after ATD has it asks ATD to cancel and tags atd-cancel-needed", async () => {
  const o = order({ tags: ["vercel-live", "ship-to-home", "atd-submitted"], atdPo: { value: "PO-321" }, cancelledAt: "2026-09-29T14:30:00Z" });
  const r = setup([o]);
  const res = await call(r.handler, delivery("orders/cancelled", payloadFor(o)));
  assert.deepEqual(res.body, { ok: true, result: "cancel-needed", reason: null });
  assert.equal(r.atd.calls.length, 1);
  assert.equal(r.atd.calls[0].url.pathname, "/api/orders/cancel");
  assert.equal(r.atd.calls[0].body.po, "PO-321");
  assert.ok(o.tags.includes("atd-cancel-needed"));
  assert.match(o.note, /asked ATD to cancel PO PO-321\. Confirm at ATD\./);

  // A repeat delivery (new id) finds the tag and does nothing more.
  const again = await call(r.handler, delivery("orders/cancelled", payloadFor(o)));
  assert.equal(again.body.reason, "already-handled");
  assert.equal(r.atd.calls.length, 1);
});

test("webhook: orders/cancelled with the ATD cancel endpoint null skips ATD but still tags atd-cancel-needed", async () => {
  const o = order({ tags: ["vercel-live", "ship-to-store", "atd-submitted"], atdPo: { value: "PO-555" } });
  const r = setup([o], { endpoints: { placeOrder: "orders", cancelOrder: null } });
  const res = await call(r.handler, delivery("orders/cancelled", payloadFor(o)));
  assert.equal(res.body.result, "cancel-needed");
  assert.equal(r.atd.calls.length, 0);
  assert.ok(o.tags.includes("atd-cancel-needed"));
  assert.match(o.note, /cancel ATD PO PO-555 at ATD by hand \(the ATD cancel endpoint is not configured\)/);

  // An unknown-outcome failure may be at ATD too.
  const unknown = order({ tags: ["vercel-live", "ship-to-home", "atd-failed"], atdError: { value: "unknown outcome — check ATD before retrying. timeout" } });
  const ru = setup([unknown], { endpoints: { placeOrder: "orders", cancelOrder: null } });
  assert.equal((await call(ru.handler, delivery("orders/cancelled", payloadFor(unknown)))).body.result, "cancel-needed");
});

test("webhook: orders/cancelled before anything went to ATD tags cancelled-before-atd", async () => {
  const o = order({ cancelledAt: "2026-09-29T14:30:00Z" });
  const r = setup([o]);
  const res = await call(r.handler, delivery("orders/cancelled", payloadFor(o)));
  assert.equal(res.body.result, "cancelled-before-atd");
  assert.deepEqual(o.tags, ["vercel-live", "ship-to-home", "cancelled-before-atd"]);
  assert.equal(r.atd.calls.length, 0);
});

// ---- other topics, speed, config ------------------------------------------------

test("webhook: fulfilment topics are logged no-ops; unknown topics are ignored with 200", async () => {
  const o = order();
  const r = setup([o]);
  for (const topic of ["orders/fulfilled", "fulfillments/create"]) {
    const res = await call(r.handler, delivery(topic, payloadFor(o)));
    assert.deepEqual(res, { status: 200, body: { ok: true, ignored: "no-op-topic" } });
  }
  const res = await call(r.handler, delivery("products/update", { id: 1 }));
  assert.deepEqual(res, { status: 200, body: { ok: true, ignored: "unknown-topic" } });
  const other = await call(r.handler, delivery("orders/paid", payloadFor(o), { shop: "someone-else.myshopify.com" }));
  assert.equal(other.body.ignored, "other-shop");
  assert.equal(r.shop.calls.length, 0);
  assert.equal(r.atd.calls.length, 0);
});

test("webhook: with Vercel's waitUntil the answer comes first and the work finishes after", async () => {
  const o = order();
  const pending = [];
  const r = setup([o], { waitUntil: (p) => pending.push(p) });
  const res = await call(r.handler, delivery("orders/paid", payloadFor(o)));
  assert.deepEqual(res, { status: 200, body: { ok: true, accepted: true } });
  assert.equal(pending.length, 1);
  await Promise.all(pending);
  assert.equal(r.atd.calls.length, 1);
  assert.ok(o.tags.includes("atd-submitted"));
});

test("webhook: a Shopify failure answers 500 so Shopify retries, and the retry is not treated as a duplicate", async () => {
  const o = order();
  const r = setup([o]);
  let down = true;
  const handler = createShopifyWebhookHandler({
    env: { ...ENV },
    waitUntil: null,
    deps: {
      shopify: { fetchImpl: (url, init) => (down && !String(url).includes("oauth") ? Promise.resolve(new Response("down", { status: 503 })) : r.shop.fetchImpl(url, init)), retryDelayMs: 0 },
      atd: { fetchImpl: r.atd.fetchImpl, endpoints: PLACE },
      log: quietLog().log,
    },
  });
  const req = () => delivery("orders/paid", payloadFor(o), { webhookId: "retry-me", eventId: "ev-retry" });
  assert.equal((await call(handler, req())).status, 500);
  down = false;
  const second = await call(handler, req());
  assert.equal(second.body.result, "submitted");
  assert.equal(r.atd.calls.length, 1);
});

test("webhook: helpers, the single-order query and vercel.json", () => {
  assert.equal(orderGid({ admin_graphql_api_id: "gid://shopify/Order/12" }), "gid://shopify/Order/12");
  assert.equal(orderGid({ id: 12 }), "gid://shopify/Order/12");
  assert.equal(orderGid({ id: "x" }), null);
  assert.match(ORDER_QUERY, /^query forwarderOrder\(\$id: ID!\) \{\n {2}order\(id: \$id\) \{/);
  const vercel = JSON.parse(readFileSync(new URL("../../vercel.json", import.meta.url), "utf8"));
  assert.ok(vercel.functions["api/webhooks/shopify.js"].maxDuration >= 30);
  for (const { source } of vercel.rewrites) {
    assert.equal(new RegExp(`^${source}$`).test("/api/webhooks/shopify"), false, "the SPA rewrite leaves the webhook alone");
  }
});
