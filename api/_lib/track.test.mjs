// Track My Order tests (POST /api/track). Run with: npm run test:api
// Shopify is mocked; nothing here touches a real store.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { createTrackHandler, resetTrackRateLimit, NOT_FOUND, TRACK_RATE_LIMIT } from "../track.js";
import { parseLookup, requestSearch, orderSearch, trackingUrl, publicOrder } from "./track.js";

const ENV = Object.freeze({
  SHOPIFY_STORE_DOMAIN: "tiredrop-test.myshopify.com",
  SHOPIFY_ADMIN_TOKEN: "shpat_test_token",
});

const ORDER = Object.freeze({
  name: "#1001",
  createdAt: "2026-09-20T15:04:00Z",
  email: "Buyer@Example.com",
  cancelledAt: null,
  displayFinancialStatus: "PAID",
  displayFulfillmentStatus: "FULFILLED",
  tags: ["vercel-live", "ship-to-home", "atd-submitted"],
  customAttributes: [
    { key: "Delivery", value: "Ship to my address" },
    { key: "Order ref", value: "TD-260920-ABCDEF" },
  ],
  shippingLine: { title: "Free Shipping" },
  lineItems: {
    nodes: [
      { title: "Continental TrueContact Tour 225/45R17", quantity: 4, currentQuantity: 4 },
      { title: "Removed line", quantity: 1, currentQuantity: 0 },
    ],
  },
  fulfillments: [
    { trackingInfo: [{ company: "FedEx", number: "123456789012", url: null }] },
    { trackingInfo: [{ company: "UPS", number: "1Z999", url: "https://www.ups.com/track?tracknum=1Z999" }] },
  ],
});

const DRAFT = Object.freeze({
  createdAt: "2026-09-29T13:00:00Z",
  status: "OPEN",
  email: "buyer@example.com",
  tags: ["order-request", "vercel-live", "ship-to-store"],
  note2: "Request only — confirm price and availability, then Send invoice.\nTireDrop order request TD-260929-HJK234",
  customAttributes: [
    { key: "Delivery", value: "Ship to store for install (Extreme Tires, Sunrise)" },
    { key: "Order ref", value: "TD-260929-HJK234" },
  ],
  lineItems: { nodes: [{ title: "Michelin Defender2 215/55R17", quantity: 4 }] },
  order: null,
});

function mockShopify({ orders = [ORDER], drafts = [DRAFT], fail = null } = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body);
    const op = body.query.match(/^query (\w+)/)[1];
    calls.push({ op, variables: body.variables, token: init.headers["X-Shopify-Access-Token"] });
    if (fail) return fail();
    // A search that "matches" loosely: return everything, so the handler's
    // own email / name / ref check is what decides.
    if (op === "trackOrder") return Response.json({ data: { orders: { nodes: structuredClone(orders) } } });
    if (op === "trackRequest") return Response.json({ data: { draftOrders: { nodes: structuredClone(drafts) } } });
    throw new Error(`unexpected ${op}`);
  };
  return { calls, fetchImpl };
}

let ipCounter = 0;
async function post(handler, body, { ip } = {}) {
  ipCounter += 1;
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(text) { this.body = text === undefined ? undefined : JSON.parse(text); },
  };
  await handler({ method: "POST", headers: { "x-forwarded-for": ip ?? `10.0.0.${ipCounter}` }, body }, res);
  return res;
}

const handlerWith = (shop, env = ENV) =>
  createTrackHandler({ env: { ...env }, shopify: { fetchImpl: shop.fetchImpl, retryDelayMs: 0 } });

beforeEach(() => resetTrackRateLimit());

test("track: a matching order number and email returns only the public status", async () => {
  const shop = mockShopify();
  for (const order of ["#1001", "1001", " # 1001 "]) {
    const res = await post(handlerWith(shop), { order, email: "BUYER@example.com " });
    assert.equal(res.statusCode, 200, order);
    assert.equal(res.headers["cache-control"], "no-store");
    assert.deepEqual(res.body, {
      found: true,
      kind: "order",
      order: {
        name: "#1001",
        createdAt: "2026-09-20T15:04:00Z",
        cancelled: false,
        financialStatus: "paid",
        fulfillmentStatus: "fulfilled",
        delivery: "ship",
        lines: [{ title: "Continental TrueContact Tour 225/45R17", quantity: 4 }],
        tracking: [
          { number: "123456789012", company: "FedEx", url: "https://www.fedex.com/fedextrack/?trknbr=123456789012" },
          { number: "1Z999", company: "UPS", url: "https://www.ups.com/track?tracknum=1Z999" },
        ],
        supplier: "ordered",
      },
    });
  }
  const text = JSON.stringify((await post(handlerWith(shop), { order: "1001", email: "buyer@example.com" })).body);
  assert.ok(!/Example\.com|TD-260920|vercel-live|price|address/i.test(text), "no email, ref, tags, prices or address leak");
  assert.deepEqual(shop.calls[0].variables, { query: "name:#1001 email:buyer@example.com" });
});

test("track: a wrong email (or unknown number, or honeypot) gets the same generic not-found", async () => {
  const shop = mockShopify();
  const wrong = await post(handlerWith(shop), { order: "#1001", email: "someone@else.com" });
  assert.equal(wrong.statusCode, 404);
  assert.deepEqual(wrong.body, { found: false, error: NOT_FOUND });

  const unknown = await post(handlerWith(mockShopify({ orders: [] })), { order: "#9999", email: "buyer@example.com" });
  assert.deepEqual([unknown.statusCode, unknown.body], [404, { found: false, error: NOT_FOUND }]);

  // The search returning another order is not enough: the name must match too.
  const otherName = await post(handlerWith(shop), { order: "#100", email: "buyer@example.com" });
  assert.equal(otherName.statusCode, 404);

  const before = shop.calls.length;
  const bot = await post(handlerWith(shop), { order: "#1001", email: "buyer@example.com", website: "http://spam" });
  assert.deepEqual([bot.statusCode, bot.body], [404, { found: false, error: NOT_FOUND }]);
  assert.equal(shop.calls.length, before, "a honeypot hit never reaches Shopify");
});

test("track: a TD- request ref finds the order-request draft by ref and email", async () => {
  const shop = mockShopify();
  const res = await post(handlerWith(shop), { order: "td-260929-hjk234", email: "buyer@example.com" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    found: true,
    kind: "request",
    request: {
      ref: "TD-260929-HJK234",
      createdAt: "2026-09-29T13:00:00Z",
      status: "open",
      orderName: null,
      delivery: "ship-to-store",
      lines: [{ title: "Michelin Defender2 215/55R17", quantity: 4 }],
    },
  });
  assert.equal(shop.calls[0].op, "trackRequest");
  assert.equal(shop.calls[0].variables.query, "tag:order-request created_at:>='2026-09-28' created_at:<'2026-10-01'");

  const wrongEmail = await post(handlerWith(shop), { order: "TD-260929-HJK234", email: "x@example.com" });
  assert.equal(wrongEmail.statusCode, 404);
  const wrongRef = await post(handlerWith(shop), { order: "TD-260929-HJK235", email: "buyer@example.com" });
  assert.equal(wrongRef.statusCode, 404);
  // Only drafts tagged order-request count.
  const untagged = await post(handlerWith(mockShopify({ drafts: [{ ...DRAFT, tags: ["vercel-live"] }] })), { order: "TD-260929-HJK234", email: "buyer@example.com" });
  assert.equal(untagged.statusCode, 404);
  // Paid since: the order name comes back so the shopper can track it.
  const paid = await post(handlerWith(mockShopify({ drafts: [{ ...DRAFT, status: "COMPLETED", order: { name: "#1042" } }] })), { order: "TD-260929-HJK234", email: "buyer@example.com" });
  assert.equal(paid.body.request.status, "completed");
  assert.equal(paid.body.request.orderName, "#1042");
});

test("track: bad input is a 400 and never reaches Shopify", async () => {
  const shop = mockShopify();
  for (const body of [
    { order: "", email: "buyer@example.com" },
    { order: "1001 OR tag:vip", email: "buyer@example.com" },
    { order: "TD-261399-ABCDEF", email: "buyer@example.com" },
    { order: "1001", email: "not-an-email" },
    { order: "1001", email: "a@b.com email:x@y.com" },
    { order: "1001", email: 'a"@b.com' },
  ]) {
    const res = await post(handlerWith(shop), body);
    assert.equal(res.statusCode, 400, JSON.stringify(body));
    assert.equal(typeof res.body.error, "string");
  }
  assert.equal(shop.calls.length, 0);
});

test("track: rate limited per client", async () => {
  const shop = mockShopify();
  const handler = handlerWith(shop);
  for (let i = 0; i < TRACK_RATE_LIMIT; i += 1) {
    assert.equal((await post(handler, { order: "1001", email: "buyer@example.com" }, { ip: "203.0.113.9" })).statusCode, 200);
  }
  const limited = await post(handler, { order: "1001", email: "buyer@example.com" }, { ip: "203.0.113.9" });
  assert.equal(limited.statusCode, 429);
  assert.equal(limited.headers["retry-after"], "600");
  assert.equal(shop.calls.length, TRACK_RATE_LIMIT);
  assert.equal((await post(handler, { order: "1001", email: "buyer@example.com" }, { ip: "203.0.113.10" })).statusCode, 200);
});

test("track: unconfigured Shopify is a 503; Shopify errors are 502/504; GET is 405", async () => {
  const shop = mockShopify();
  for (const env of [{}, { SHOPIFY_STORE_DOMAIN: "tiredrop-test.myshopify.com" }]) {
    const res = await post(handlerWith(shop, env), { order: "1001", email: "buyer@example.com" });
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.configured, false);
  }
  assert.equal(shop.calls.length, 0);

  const down = mockShopify({ fail: () => new Response("down", { status: 503 }) });
  const res = await post(handlerWith(down), { order: "1001", email: "buyer@example.com" });
  assert.equal(res.statusCode, 502);
  assert.ok(!/HTTP 503/.test(res.body.error), "Shopify's detail is logged, not shown");

  const get = { statusCode: 0, headers: {}, setHeader(k, v) { this.headers[k] = v; }, end() {} };
  await handlerWith(shop)({ method: "GET", headers: {} }, get);
  assert.equal(get.statusCode, 405);
});

test("track: helpers", () => {
  assert.deepEqual(parseLookup("#1001"), { kind: "order", name: "#1001" });
  assert.equal(parseLookup("TD-260229-ABCDEF"), null, "no 29 Feb in 2026");
  assert.equal(parseLookup("TD-260929-ABCDE0"), null, "0 is not in the ref alphabet");
  assert.equal(orderSearch("#7", "a@b.co"), "name:#7 email:a@b.co");
  assert.match(requestSearch(new Date(Date.UTC(2026, 0, 1))), /created_at:>='2025-12-31' created_at:<'2026-01-03'/);
  assert.equal(trackingUrl("USPS", "9400 1"), "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400%201");
  assert.equal(trackingUrl("Some Freight Co", "1"), null);
  const refunded = publicOrder({ ...ORDER, displayFinancialStatus: "REFUNDED", cancelledAt: "2026-09-21T00:00:00Z", lineItems: { nodes: [{ title: "T", quantity: 4, currentQuantity: 0 }] } });
  assert.deepEqual([refunded.financialStatus, refunded.cancelled, refunded.lines], ["refunded", true, [{ title: "T", quantity: 4 }]]);
  assert.equal(publicOrder({ ...ORDER, tags: ["atd-submitted", "atd-inbound-to-store"] }).supplier, "inbound-to-store");
  assert.equal(publicOrder({ ...ORDER, tags: [], customAttributes: [], shippingLine: { title: "Local pickup" } }).delivery, "pickup");
});
