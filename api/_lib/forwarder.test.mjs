// ATD forwarder tests. Run with: npm run test:api
//
// Shopify and ATD are both mocked. The Shopify mock is a tiny in-memory
// store: it applies tagsAdd / tagsRemove / metafieldsSet to its orders and
// answers the three order searches the way Shopify's search would, so a
// second sweep sees what the first one wrote.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getConfig } from "./config.js";
import {
  sweep,
  submitSearch,
  stuckSearch,
  trackingSearch,
  skipReason,
  toAtdOrder,
  classifyAtdOrderError,
  STUCK_AFTER_MS,
  UNKNOWN_OUTCOME,
} from "./forwarder.js";
import {
  AtdError,
  AtdNotConfirmedError,
  ENDPOINTS,
  STORE_SHIP_TO,
  placeAtdOrder,
  getAtdOrderStatus,
  cancelAtdOrder,
} from "./atd.js";
import { createAtdSweepHandler } from "../cron/atd-sweep.js";
import { statusBody } from "../status.js";

// ---- fixtures ---------------------------------------------------------------

const NOW = Date.parse("2026-09-28T15:00:00Z");
const CRON_SECRET = "cron-test-secret";

const ENV = Object.freeze({
  ATD_API_BASE: "https://atd.example.test/api",
  ATD_API_KEY: "k",
  ATD_API_SECRET: "s",
  ATD_ACCOUNT_NUMBER: "1",
  ATD_SHIP_TO: "2",
  PRICE_MARKUP_PCT: "20",
  FREIGHT_PER_TIRE: "10",
  SHOPIFY_STORE_DOMAIN: "tiredrop-test.myshopify.com",
  SHOPIFY_ADMIN_TOKEN: "shpat_test_token",
  ATD_ORDERING_ENABLED: "true",
  CRON_SECRET,
});

const cfg = (over = {}) => getConfig({ ...ENV, ...over });

// Placeholder paths for the mocked ATD; the real ENDPOINTS stay null.
// SUBMIT_ONLY leaves the tracking pass off so submit tests see only orders.
const SUBMIT_ONLY = Object.freeze({ placeOrder: "orders" });
const CONFIRMED = Object.freeze({ placeOrder: "orders", orderStatus: "orders/status" });

let nextId = 1000;
function shopifyOrder(over = {}) {
  nextId += 1;
  return {
    id: `gid://shopify/Order/${nextId}`,
    name: `#${nextId}`,
    createdAt: new Date(NOW - 60 * 60 * 1000).toISOString(),
    test: false,
    cancelledAt: null,
    tags: ["vercel-live", "ship-to-home"],
    note: "TireDrop live order TD-260928-ABCDEF",
    email: "buyer@example.com",
    phone: "+19545550100",
    displayFinancialStatus: "PAID",
    displayFulfillmentStatus: "UNFULFILLED",
    customAttributes: [
      { key: "Delivery", value: "Ship to my address" },
      { key: "Source", value: "TireDrop live (Vercel)" },
      { key: "Order ref", value: "TD-260928-ABCDEF" },
    ],
    risk: { recommendation: "ACCEPT", assessments: [{ riskLevel: "LOW" }] },
    shippingAddress: {
      firstName: "Test",
      lastName: "Buyer",
      name: "Test Buyer",
      company: null,
      address1: "1 Main St",
      address2: "Apt 4",
      city: "Orlando",
      provinceCode: "FL",
      zip: "32801",
      countryCodeV2: "US",
      phone: "+19545550100",
    },
    lineItems: {
      pageInfo: { hasNextPage: false },
      nodes: [{ id: "gid://shopify/LineItem/1", sku: "ATD-1", name: "Continental TrueContact Tour 225/45R17", quantity: 4, currentQuantity: 4 }],
    },
    atdPo: null,
    sendingLock: null,
    fulfillmentOrders: {
      nodes: [{ id: "gid://shopify/FulfillmentOrder/1", status: "OPEN", supportedActions: [{ action: "CREATE_FULFILLMENT" }] }],
    },
    ...over,
  };
}

const storeOrder = (over = {}) =>
  shopifyOrder({
    tags: ["vercel-live", "ship-to-store"],
    customAttributes: [{ key: "Delivery", value: "Ship to store for install (Extreme Tires, Sunrise)" }],
    shippingAddress: null,
    ...over,
  });

const has = (o, t) => o.tags.includes(t);

/**
 * In-memory Shopify. `rawSearch` returns every order for every search, as a
 * lagging search index might, to exercise the forwarder's own re-checks.
 */
function mockShopify(orders, { sequence = [], rawSearch = false, refuse = {} } = {}) {
  let digest = 0;
  const calls = [];
  const byId = new Map(orders.map((o) => [o.id, o]));
  const ok = (data) => Response.json({ data });
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body);
    const [, , op] = body.query.match(/^(query|mutation) (\w+)/);
    const v = body.variables;
    calls.push({ op, variables: v });
    if (refuse[op]) {
      const r = refuse[op](v);
      if (r) return r;
    }
    switch (op) {
      case "forwarderOrders": {
        const q = v.query;
        let nodes = orders;
        if (!rawSearch) {
          nodes = / tag:atd-sending /.test(` ${q} `)
            ? orders.filter((o) => has(o, "atd-sending") && !has(o, "atd-submitted") && !has(o, "atd-failed"))
            : orders.filter((o) => has(o, "vercel-live") && o.displayFinancialStatus === "PAID" &&
              !["atd-submitted", "atd-failed", "atd-sending", "fraud-review"].some((t) => has(o, t)) && !o.cancelledAt);
        }
        sequence.push(`shopify:query:${/ tag:atd-sending /.test(` ${q} `) ? "stuck" : "submit"}`);
        return ok({ orders: { pageInfo: { hasNextPage: false }, nodes: structuredClone(nodes) } });
      }
      case "forwarderTracking": {
        const nodes = rawSearch ? orders : orders.filter((o) => has(o, "atd-submitted") && !has(o, "atd-inbound-to-store") &&
          o.displayFulfillmentStatus === "UNFULFILLED");
        sequence.push("shopify:query:tracking");
        return ok({ orders: { pageInfo: { hasNextPage: false }, nodes: structuredClone(nodes) } });
      }
      case "forwarderMetafieldsSet": {
        const userErrors = [];
        for (const m of v.metafields) {
          const o = byId.get(m.ownerId);
          sequence.push(`shopify:metafield:${m.key}`);
          if (m.key === "atd_sending_at") {
            if ("compareDigest" in m && (o.sendingLock?.compareDigest ?? null) !== m.compareDigest) {
              userErrors.push({ field: ["metafields", "0", "compareDigest"], message: "The resource has been updated since it was loaded.", code: "STALE_OBJECT" });
              continue;
            }
            digest += 1;
            o.sendingLock = { value: m.value, compareDigest: `digest-${digest}` };
          }
          if (m.key === "atd_po") o.atdPo = { value: m.value };
          o.metafields = { ...(o.metafields ?? {}), [m.key]: m.value };
        }
        return ok({ metafieldsSet: { metafields: [], userErrors } });
      }
      case "forwarderTagsAdd": {
        const o = byId.get(v.id);
        for (const t of v.tags) if (!has(o, t)) o.tags.push(t);
        sequence.push(`shopify:tagsAdd:${v.tags.join(",")}`);
        return ok({ tagsAdd: { node: { id: v.id }, userErrors: [] } });
      }
      case "forwarderTagsRemove": {
        const o = byId.get(v.id);
        o.tags = o.tags.filter((t) => !v.tags.includes(t));
        sequence.push(`shopify:tagsRemove:${v.tags.join(",")}`);
        return ok({ tagsRemove: { node: { id: v.id }, userErrors: [] } });
      }
      case "forwarderOrderNote": {
        byId.get(v.input.id).note = v.input.note;
        sequence.push("shopify:note");
        return ok({ orderUpdate: { order: { id: v.input.id }, userErrors: [] } });
      }
      case "forwarderFulfillmentCreate": {
        sequence.push("shopify:fulfill");
        return ok({ fulfillmentCreate: { fulfillment: { id: "gid://shopify/Fulfillment/1", status: "SUCCESS" }, userErrors: [] } });
      }
      default:
        throw new Error(`unexpected Shopify operation ${op}`);
    }
  };
  return {
    calls,
    fetchImpl,
    writes: () => calls.filter((c) => !["forwarderOrders", "forwarderTracking"].includes(c.op)),
  };
}

/** Mocked ATD. `reply(request)` returns a Response; defaults to a PO. */
function mockAtd({ sequence = [], reply } = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const u = new URL(url);
    const call = { url: u, method: init.method, body: init.body ? JSON.parse(init.body) : null, headers: init.headers };
    calls.push(call);
    sequence.push(`atd:${init.method}:${u.pathname.replace(/^\/api\//, "")}`);
    if (reply) return reply(call, calls.length);
    return Response.json({ poNumber: "PO-777" });
  };
  return { calls, fetchImpl };
}

const quietLog = () => {
  const lines = [];
  const push = (...a) => lines.push(a.join(" "));
  return { lines, log: { log: push, warn: push, error: push, info: push } };
};

function run(orders, { atdReply, endpoints = SUBMIT_ONLY, config = cfg(), now = () => NOW, rawSearch, refuse } = {}) {
  const sequence = [];
  const shop = mockShopify(orders, { sequence, rawSearch, refuse });
  const atd = mockAtd({ sequence, reply: atdReply });
  const { log, lines } = quietLog();
  const deps = {
    shopify: { fetchImpl: shop.fetchImpl, retryDelayMs: 0 },
    atd: { fetchImpl: atd.fetchImpl, retryDelayMs: 0, ...(endpoints ? { endpoints } : {}) },
    now,
    log,
  };
  return { sequence, shop, atd, lines, deps, go: () => sweep(config, deps) };
}

const summaryOf = (s) => ({ checked: s.checked, submitted: s.submitted, failed: s.failed, skipped: s.skipped, tracked: s.tracked });

// ---- submitting ---------------------------------------------------------------

test("forwarder: a paid, ACCEPTed ship-to-home order is sent to ATD once, to the customer's address", async () => {
  const order = shopifyOrder();
  const r = run([order]);
  const s = await r.go();
  assert.deepEqual(summaryOf(s), { checked: 1, submitted: 1, failed: 0, skipped: {}, tracked: 0 });
  assert.deepEqual(s.errors, []);

  assert.equal(r.atd.calls.length, 1);
  const [call] = r.atd.calls;
  assert.equal(call.method, "POST");
  assert.equal(call.url.toString(), "https://atd.example.test/api/orders");
  assert.deepEqual(call.body, {
    clientReference: order.name,
    account: "1",
    shipTo: "2",
    deliveryType: "residential",
    deliveryAddress: {
      name: "Test Buyer",
      company: null,
      address1: "1 Main St",
      address2: "Apt 4",
      city: "Orlando",
      state: "FL",
      zip: "32801",
      country: "US",
      phone: "+19545550100",
    },
    lines: [{ sku: "ATD-1", quantity: 4 }],
  });
  assert.ok(!/price|cost|amount/i.test(JSON.stringify(call.body)), "no prices go to ATD");
  assert.ok(!JSON.stringify(call.body).includes("buyer@example.com"), "the customer's email stays in Shopify");

  // The order now carries the result.
  assert.deepEqual(order.tags.filter((t) => t.startsWith("atd-")), ["atd-submitted"]);
  assert.equal(order.metafields.atd_po, "PO-777");
  assert.match(order.note, /^TireDrop live order TD-260928-ABCDEF\nATD forwarder 2026-09-28T15:00:00\.000Z: placed with ATD, PO PO-777$/);

  // A second sweep sees atd-submitted and sends nothing.
  const again = await sweep(cfg(), r.deps);
  assert.equal(again.checked, 0);
  assert.equal(r.atd.calls.length, 1, "never sent twice");
});

test("forwarder: writes happen in a safe order around the single ATD call", async () => {
  const r = run([shopifyOrder()]);
  await r.go();
  assert.deepEqual(r.sequence, [
    "shopify:query:stuck",
    "shopify:query:submit",
    // claim: compare-and-set timestamp, then the tag that hides it from other sweeps
    "shopify:metafield:atd_sending_at",
    "shopify:tagsAdd:atd-sending",
    "atd:POST:orders",
    // result: PO first (so a crash here is recoverable), then atd-submitted,
    // the note, and only then atd-sending comes off
    "shopify:metafield:atd_po",
    "shopify:tagsAdd:atd-submitted",
    "shopify:note",
    "shopify:tagsRemove:atd-sending",
  ]);
  const claim = r.shop.calls.find((c) => c.op === "forwarderMetafieldsSet").variables.metafields[0];
  assert.deepEqual(claim, {
    ownerId: claim.ownerId,
    namespace: "tiredrop",
    key: "atd_sending_at",
    type: "single_line_text_field",
    value: "2026-09-28T15:00:00.000Z",
    compareDigest: null,
  });
  const po = r.shop.calls.filter((c) => c.op === "forwarderMetafieldsSet")[1].variables.metafields[0];
  assert.deepEqual(
    { namespace: po.namespace, key: po.key, type: po.type, value: po.value, cas: "compareDigest" in po },
    { namespace: "tiredrop", key: "atd_po", type: "single_line_text_field", value: "PO-777", cas: false },
  );
});

test("forwarder: a ship-to-store order is sent to the Sunrise shop's address", async () => {
  const order = storeOrder();
  const r = run([order]);
  const s = await r.go();
  assert.equal(s.submitted, 1);
  const body = r.atd.calls[0].body;
  assert.equal(body.deliveryType, "store");
  assert.deepEqual(body.deliveryAddress, {
    name: "Extreme Tires",
    company: "Extreme Tires",
    address1: "7712 West Oakland Park Blvd",
    address2: null,
    city: "Sunrise",
    state: "FL",
    zip: "33351",
    country: "US",
    phone: "(954) 773-1896",
  });
  assert.deepEqual(body.deliveryAddress, { ...STORE_SHIP_TO });
});

test("forwarder: pending or missing risk assessments wait for the next sweep", async () => {
  const pending = shopifyOrder({ risk: { recommendation: "ACCEPT", assessments: [{ riskLevel: "PENDING" }] } });
  const none = shopifyOrder({ risk: { recommendation: "NONE", assessments: [] } });
  const investigate = shopifyOrder({ risk: { recommendation: "INVESTIGATE", assessments: [{ riskLevel: "MEDIUM" }] } });
  const cancel = shopifyOrder({ risk: { recommendation: "CANCEL", assessments: [{ riskLevel: "HIGH" }] } });
  const r = run([pending, none, investigate, cancel]);
  const s = await r.go();
  assert.deepEqual(summaryOf(s), {
    checked: 4,
    submitted: 0,
    failed: 0,
    skipped: { "risk-pending": 1, "risk-not-assessed": 1, "risk-investigate": 1, "risk-cancel": 1 },
    tracked: 0,
  });
  assert.equal(r.atd.calls.length, 0);
  assert.deepEqual(r.shop.writes(), [], "nothing written: they are looked at again next sweep");
});

test("forwarder: fraud-review orders are kept out by the search and skipped if they slip through", async () => {
  assert.match(submitSearch(NOW), /(^| )tag_not:fraud-review( |$)/);
  const r = run([shopifyOrder({ tags: ["vercel-live", "ship-to-home", "fraud-review"] })], { rawSearch: true });
  const s = await r.go();
  assert.deepEqual(s.skipped, { "fraud-review": 1 });
  assert.equal(r.atd.calls.length, 0);
  assert.deepEqual(r.shop.writes(), []);
});

test("forwarder: other skips — fulfilled, unpaid, cancelled, test orders", async () => {
  const test = shopifyOrder({ test: true });
  const r = run([
    shopifyOrder({ displayFulfillmentStatus: "FULFILLED" }),
    shopifyOrder({ displayFulfillmentStatus: "PARTIALLY_FULFILLED" }),
    shopifyOrder({ displayFinancialStatus: "PENDING" }),
    shopifyOrder({ cancelledAt: "2026-09-28T14:00:00Z" }),
    test,
  ], { rawSearch: true });
  const s = await r.go();
  assert.deepEqual(s.skipped, {
    "fulfillment-fulfilled": 1,
    "fulfillment-partially_fulfilled": 1,
    "not-paid": 1,
    cancelled: 1,
    "test-order": 1,
  });
  assert.equal(r.atd.calls.length, 0);

  // Test orders go through only with ATD_FORWARD_TEST_ORDERS=true (sandbox).
  assert.equal(skipReason(test, { forwardTestOrders: true }), null);
  const sandbox = run([shopifyOrder({ test: true })], { config: cfg({ ATD_FORWARD_TEST_ORDERS: "true" }) });
  assert.equal((await sandbox.go()).submitted, 1);
});

test("forwarder: a line without a SKU fails the order without calling ATD", async () => {
  const order = shopifyOrder({
    lineItems: {
      pageInfo: { hasNextPage: false },
      nodes: [
        { id: "l1", sku: "ATD-1", name: "Tire A", quantity: 2, currentQuantity: 2 },
        { id: "l2", sku: "", name: "Mystery tire", quantity: 2, currentQuantity: 2 },
      ],
    },
  });
  const r = run([order]);
  const s = await r.go();
  assert.deepEqual(summaryOf(s), { checked: 1, submitted: 0, failed: 1, skipped: {}, tracked: 0 });
  assert.equal(r.atd.calls.length, 0);
  assert.deepEqual(order.tags.filter((t) => t.startsWith("atd-")), ["atd-failed"]);
  assert.match(order.metafields.atd_error, /without a SKU: "Mystery tire"/);
  assert.deepEqual(r.sequence.filter((x) => x.startsWith("shopify:") && !x.includes("query")), [
    "shopify:metafield:atd_error",
    "shopify:tagsAdd:atd-failed",
    "shopify:note",
  ], "never claimed, so no atd-sending to remove");
});

test("forwarder: toAtdOrder merges repeated SKUs and refuses unclear orders", () => {
  const merged = toAtdOrder(shopifyOrder({
    lineItems: {
      pageInfo: { hasNextPage: false },
      nodes: [
        { id: "a", sku: "ATD-1", name: "A", quantity: 2, currentQuantity: 2 },
        { id: "b", sku: " ATD-1 ", name: "A", quantity: 2, currentQuantity: 2 },
        { id: "c", sku: "ATD-2", name: "B", quantity: 1, currentQuantity: 0 }, // removed after checkout
      ],
    },
  }));
  assert.deepEqual(merged.lines, [{ sku: "ATD-1", qty: 4 }]);
  assert.throws(() => toAtdOrder(shopifyOrder({ shippingAddress: null })), /complete shipping address/);
  assert.throws(() => toAtdOrder(shopifyOrder({ tags: ["vercel-live"], customAttributes: [] })), /cannot tell/);
  assert.throws(() => toAtdOrder(shopifyOrder({ tags: ["vercel-live", "ship-to-store"] })), /conflicting delivery/);
  assert.throws(
    () => toAtdOrder(shopifyOrder({ lineItems: { pageInfo: { hasNextPage: true }, nodes: [] } })),
    /more than 20 lines/,
  );
});

test("forwarder: an ATD rejection fails the order; an unknown outcome says check ATD, with no retry", async () => {
  const rejected = shopifyOrder();
  const r1 = run([rejected], { atdReply: () => new Response("bad sku", { status: 422 }) });
  const s1 = await r1.go();
  assert.deepEqual(summaryOf(s1), { checked: 1, submitted: 0, failed: 1, skipped: {}, tracked: 0 });
  assert.deepEqual(rejected.tags.filter((t) => t.startsWith("atd-")), ["atd-failed"]);
  assert.match(rejected.metafields.atd_error, /^ATD rejected the order\. ATD responded with HTTP 422\.$/);
  assert.deepEqual(r1.sequence.slice(2), [
    "shopify:metafield:atd_sending_at",
    "shopify:tagsAdd:atd-sending",
    "atd:POST:orders",
    "shopify:metafield:atd_error",
    "shopify:tagsAdd:atd-failed",
    "shopify:note",
    "shopify:tagsRemove:atd-sending",
  ]);

  for (const reply of [
    () => new Response("down", { status: 503 }),
    () => { throw new TypeError("fetch failed"); },
    () => Response.json({ accepted: true }), // 200 but no PO
  ]) {
    const order = shopifyOrder();
    const r = run([order], { atdReply: reply });
    const s = await r.go();
    assert.equal(s.failed, 1);
    assert.equal(r.atd.calls.length, 1, "an order is never retried");
    assert.ok(order.metafields.atd_error.startsWith(UNKNOWN_OUTCOME), order.metafields.atd_error);
    assert.deepEqual(order.tags.filter((t) => t.startsWith("atd-")), ["atd-failed"]);
  }

  assert.equal(classifyAtdOrderError(new AtdError("x", { upstreamStatus: 400 })), "rejected");
  assert.equal(classifyAtdOrderError(new AtdError("x", { upstreamStatus: 408 })), "unknown");
  assert.equal(classifyAtdOrderError(new AtdError("x", { upstreamStatus: 502 })), "unknown");
});

test("forwarder: an order stuck in atd-sending for 30+ minutes becomes atd-failed and is never resent", async () => {
  const stuck = shopifyOrder({
    tags: ["vercel-live", "ship-to-home", "atd-sending"],
    sendingLock: { value: new Date(NOW - STUCK_AFTER_MS - 1000).toISOString(), compareDigest: "d1" },
  });
  const young = shopifyOrder({
    tags: ["vercel-live", "ship-to-home", "atd-sending"],
    sendingLock: { value: new Date(NOW - 60 * 1000).toISOString(), compareDigest: "d2" },
  });
  const poSaved = shopifyOrder({
    tags: ["vercel-live", "ship-to-home", "atd-sending"],
    sendingLock: { value: new Date(NOW - STUCK_AFTER_MS - 1000).toISOString(), compareDigest: "d3" },
    atdPo: { value: "PO-555" },
  });
  const r = run([stuck, young, poSaved]);
  const s = await r.go();

  assert.equal(r.atd.calls.length, 0, "nothing is resent");
  assert.equal(s.stuck, 1);
  assert.equal(s.failed, 1);
  assert.equal(s.reconciled, 1);
  assert.deepEqual(stuck.tags.filter((t) => t.startsWith("atd-")), ["atd-failed"]);
  assert.match(stuck.metafields.atd_error, /^unknown outcome — check ATD before retrying\. A sweep started sending this order at 2026-09-28T14:29:59\.000Z/);
  assert.deepEqual(young.tags.filter((t) => t.startsWith("atd-")), ["atd-sending"], "a sweep may still be on it");
  assert.deepEqual(poSaved.tags.filter((t) => t.startsWith("atd-")), ["atd-submitted"], "PO on file: ATD has it");

  // And the next sweep still does not send the failed one.
  await sweep(cfg(), r.deps);
  assert.equal(r.atd.calls.length, 0);
  assert.match(stuckSearch(NOW), /tag:atd-sending/);
});

test("forwarder: a lost claim (another sweep won the compare-and-set) leaves the order alone", async () => {
  const order = shopifyOrder();
  const r = run([order], {
    refuse: {
      forwarderMetafieldsSet: (v) => v.metafields[0].key === "atd_sending_at" && Response.json({
        data: { metafieldsSet: { metafields: [], userErrors: [{ field: ["metafields"], message: "stale", code: "STALE_OBJECT" }] } },
      }),
    },
  });
  const s = await r.go();
  assert.deepEqual(s.skipped, { "claimed-elsewhere": 1 });
  assert.equal(r.atd.calls.length, 0);
  assert.equal(order.tags.includes("atd-sending"), false);
});

test("forwarder: with ATD's order endpoints null, no ATD request and no Shopify write happens", async () => {
  assert.equal(ENDPOINTS.placeOrder, null);
  assert.equal(ENDPOINTS.orderStatus, null);
  assert.equal(ENDPOINTS.cancelOrder, null);
  const order = shopifyOrder();
  const r = run([order], {
    endpoints: null, // the real, null ENDPOINTS
    atdReply: () => { throw new Error("ATD must not be called"); },
  });
  const s = await r.go();
  assert.equal(r.atd.calls.length, 0);
  assert.deepEqual(r.shop.writes(), []);
  assert.equal(s.placeOrder, "not-configured");
  assert.equal(s.tracking, "not-configured");
  assert.deepEqual(order.tags, ["vercel-live", "ship-to-home"]);

  // Called directly, each one refuses before any network call.
  const atdCfg = cfg().atd;
  const noFetch = { fetchImpl: () => { throw new Error("no network"); } };
  await assert.rejects(placeAtdOrder({ reference: "#1", delivery: "ship", shipTo: STORE_SHIP_TO, lines: [] }, atdCfg, noFetch),
    (err) => err instanceof AtdNotConfirmedError && /"placeOrder" endpoint is not configured: confirm with ATD docs/.test(err.message));
  await assert.rejects(getAtdOrderStatus("PO-1", atdCfg, noFetch), /"orderStatus" endpoint is not configured/);
  await assert.rejects(cancelAtdOrder("PO-1", atdCfg, noFetch), /"cancelOrder" endpoint is not configured/);
});

// ---- tracking -----------------------------------------------------------------

test("forwarder: ATD tracking creates the Shopify fulfillment and notifies a ship-to-home customer", async () => {
  const home = shopifyOrder({
    tags: ["vercel-live", "ship-to-home", "atd-submitted"],
    atdPo: { value: "PO-777" },
    fulfillmentOrders: {
      nodes: [
        { id: "gid://shopify/FulfillmentOrder/1", status: "OPEN", supportedActions: [{ action: "CREATE_FULFILLMENT" }, { action: "MOVE" }] },
        { id: "gid://shopify/FulfillmentOrder/2", status: "CLOSED", supportedActions: [] },
      ],
    },
  });
  const store = storeOrder({ tags: ["vercel-live", "ship-to-store", "atd-submitted"], atdPo: { value: "PO-888" } });
  const waiting = shopifyOrder({ tags: ["vercel-live", "ship-to-home", "atd-submitted"], atdPo: { value: "PO-999" } });
  const r = run([home, store, waiting], {
    endpoints: CONFIRMED,
    atdReply: (call) => {
      const po = call.url.searchParams.get("po");
      if (po === "PO-999") return Response.json({ status: "processing", shipments: [] });
      return Response.json({ status: "shipped", shipments: [{ carrier: "FedEx", trackingNumber: "123456789012", trackingUrl: "https://www.fedex.com/fedextrack/?trknbr=123456789012" }] });
    },
  });
  const s = await r.go();
  assert.equal(s.tracked, 1);
  assert.equal(s.inbound, 1);
  assert.deepEqual(s.errors, []);
  assert.deepEqual(r.atd.calls.map((c) => [c.method, c.url.pathname, c.url.searchParams.get("po")]), [
    ["GET", "/api/orders/status", "PO-777"],
    ["GET", "/api/orders/status", "PO-888"],
    ["GET", "/api/orders/status", "PO-999"],
  ]);

  const fulfills = r.shop.calls.filter((c) => c.op === "forwarderFulfillmentCreate");
  assert.equal(fulfills.length, 1, "only the ship-to-home order is fulfilled");
  assert.deepEqual(fulfills[0].variables.fulfillment, {
    lineItemsByFulfillmentOrder: [{ fulfillmentOrderId: "gid://shopify/FulfillmentOrder/1" }],
    trackingInfo: { number: "123456789012", url: "https://www.fedex.com/fedextrack/?trknbr=123456789012", company: "FedEx" },
    notifyCustomer: true,
  });

  // Ship-to-store: tracking recorded for the shop, customer not emailed.
  assert.ok(store.tags.includes("atd-inbound-to-store"));
  assert.equal(store.metafields.atd_tracking, "FedEx 123456789012");
  assert.match(store.note, /ATD shipped to the shop: FedEx 123456789012/);
  assert.match(trackingSearch(NOW), /tag:atd-submitted .*fulfillment_status:unfulfilled/);
});

// ---- the cron endpoint ----------------------------------------------------------

async function callCron(handler, headers = {}, method = "GET") {
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(text) { this.body = text === undefined ? undefined : JSON.parse(text); },
  };
  await handler({ method, headers }, res);
  return res;
}

const failFetch = () => { throw new Error("no network call expected"); };
const noNetworkDeps = { shopify: { fetchImpl: failFetch }, atd: { fetchImpl: failFetch } };

test("cron: a wrong, missing or unconfigured CRON_SECRET is a 401", async () => {
  const handler = createAtdSweepHandler({ env: { ...ENV }, deps: noNetworkDeps });
  assert.equal((await callCron(handler, { authorization: "Bearer nope" })).statusCode, 401);
  assert.equal((await callCron(handler, {})).statusCode, 401);
  assert.equal((await callCron(handler, { authorization: CRON_SECRET })).statusCode, 401, "the Bearer prefix is required");

  const noSecret = createAtdSweepHandler({ env: { ...ENV, CRON_SECRET: "" }, deps: noNetworkDeps });
  const res = await callCron(noSecret, { authorization: "Bearer " });
  assert.equal(res.statusCode, 401);
  assert.equal(res.headers["cache-control"], "no-store");

  assert.equal((await callCron(handler, { authorization: `Bearer ${CRON_SECRET}` }, "POST")).statusCode, 405);
});

test("cron: with the kill switch off (or Shopify / ATD not live) nothing runs", async () => {
  const auth = { authorization: `Bearer ${CRON_SECRET}` };
  const cases = [
    [{ ATD_ORDERING_ENABLED: "" }, /ATD_ORDERING_ENABLED is not "true"/],
    [{ ATD_ORDERING_ENABLED: "false" }, /kill switch is off/],
    [{ ATD_ORDERING_ENABLED: "TRUE" }, /is not "true"/],
    [{ SHOPIFY_STORE_DOMAIN: "", SHOPIFY_ADMIN_TOKEN: "" }, /Shopify checkout is not configured/],
    [{ ATD_API_BASE: "", ATD_API_KEY: "", ATD_API_SECRET: "", ATD_ACCOUNT_NUMBER: "", ATD_SHIP_TO: "" }, /ATD is not live/],
  ];
  for (const [over, pattern] of cases) {
    const handler = createAtdSweepHandler({ env: { ...ENV, ...over }, deps: noNetworkDeps });
    const res = await callCron(handler, auth);
    assert.equal(res.statusCode, 200, JSON.stringify(over));
    assert.match(res.body.skipped, pattern);
    assert.equal(res.body.summary, undefined);
  }
});

test("cron: authorized and switched on, it runs a sweep and returns the summary", async () => {
  const r = run([shopifyOrder()]);
  const handler = createAtdSweepHandler({ env: { ...ENV }, deps: r.deps });
  const savedLog = console.log;
  console.log = () => {};
  try {
    const res = await callCron(handler, { authorization: `Bearer ${CRON_SECRET}` });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.summary.submitted, 1);
    assert.equal(r.atd.calls.length, 1);
  } finally {
    console.log = savedLog;
  }
});

// ---- config, status, vercel.json ------------------------------------------------

test("forwarder config: switches never flip ATD to live; status reports forwarder on/off and issues", () => {
  const onlySwitch = getConfig({ ATD_ORDERING_ENABLED: "true" });
  assert.equal(onlySwitch.atd.mode, "sample", "ATD_ORDERING_ENABLED is not an ATD credential");
  assert.equal(onlySwitch.forwarder.mode, "off");
  assert.ok(onlySwitch.issues.some((i) => /ATD_ORDERING_ENABLED is "true" but the forwarder cannot run: Shopify/.test(i)));
  assert.equal(getConfig({ ATD_FORWARD_TEST_ORDERS: "true" }).atd.mode, "sample");

  const off = getConfig({});
  assert.equal(statusBody(off).forwarder, "off");
  assert.equal(statusBody(off).issues, undefined, "off is a normal state");
  assert.ok(getConfig({ ATD_ORDERING_ENABLED: "yes" }).issues.some((i) => /must be "true" or "false"/.test(i)));
  assert.ok(cfg({ CRON_SECRET: "" }).issues.some((i) => /CRON_SECRET is not set/.test(i)));

  const on = cfg();
  assert.equal(on.forwarder.mode, "on");
  const body = statusBody(on);
  assert.equal(body.forwarder, "on");
  assert.ok(body.issues.some((i) => /ENDPOINTS\.placeOrder .* not configured/.test(i)));
  assert.ok(!JSON.stringify(body).includes(CRON_SECRET), "no secret values");
  assert.equal(statusBody(on, CONFIRMED).issues, undefined);
});

test("vercel.json: the cron is scheduled and the SPA rewrite does not swallow it", () => {
  const vercel = JSON.parse(readFileSync(new URL("../../vercel.json", import.meta.url), "utf8"));
  // Once a day while the project is on Hobby (the only schedule Hobby
  // deploys accept); switch to "*/5 * * * *" on Pro. See atd-forwarder.md.
  assert.equal(vercel.crons.length, 1);
  assert.equal(vercel.crons[0].path, "/api/cron/atd-sweep");
  assert.ok(["0 12 * * *", "*/5 * * * *"].includes(vercel.crons[0].schedule), vercel.crons[0].schedule);
  for (const { source } of vercel.rewrites) {
    const re = new RegExp(`^${source}$`);
    assert.equal(re.test("/api/cron/atd-sweep"), false, source);
    assert.equal(re.test("/tires"), true, "the SPA rewrite still works");
  }
  assert.ok(vercel.functions["api/cron/atd-sweep.js"].maxDuration >= 60);
});
