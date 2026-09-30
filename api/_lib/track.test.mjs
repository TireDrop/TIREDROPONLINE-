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

// ---- "Schedule your install" (api/_lib/booking.js) -----------------------------------

const STORE_ORDER = Object.freeze({
  ...ORDER,
  id: "gid://shopify/Order/7001",
  name: "#1002",
  displayFulfillmentStatus: "UNFULFILLED",
  tags: ["vercel-live", "ship-to-store"],
  note: "TireDrop live order TD-260920-ABCDEF\nCustomer: Buyer Person, (954) 555-0100\nDelivery: Ship to store for install (Extreme Tires, Sunrise)\nCustomer notes: Vehicle: 2020 Toyota Camry LE",
  customAttributes: [
    { key: "Delivery", value: "Ship to store for install (Extreme Tires, Sunrise)" },
    { key: "Order ref", value: "TD-260920-ABCDEF" },
  ],
  shippingLine: { title: "Pickup at Extreme Tires (Sunrise, FL)" },
  fulfillments: [],
});

const CONTACT = Object.freeze({
  phone: "+19545550199",
  shippingAddress: null,
  billingAddress: { name: "Billing Name", phone: "+19545550111" },
  customer: { displayName: "Customer Display" },
});

/** The track mock plus the booking contact read. */
function bookingShop({ orders = [STORE_ORDER], contact = CONTACT, contactFails = false } = {}) {
  const base = mockShopify({ orders });
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body);
    const op = body.query.match(/^query (\w+)/)[1];
    if (op === "bookingContact") {
      base.calls.push({ op, variables: body.variables });
      if (contactFails) {
        return Response.json({ errors: [{ message: "Access denied for phone field." }] });
      }
      return Response.json({ data: { order: body.variables.id === STORE_ORDER.id ? structuredClone(contact) : null } });
    }
    return base.fetchImpl(url, init);
  };
  return { calls: base.calls, fetchImpl };
}

const quiet = async (fn) => {
  const saved = console.warn;
  const savedErr = console.error;
  const lines = [];
  console.warn = (...a) => lines.push(a.join(" "));
  console.error = (...a) => lines.push(a.join(" "));
  try {
    return { result: await fn(), lines };
  } finally {
    console.warn = saved;
    console.error = savedErr;
  }
};

test("track booking: a paid ship-to-store order gets /schedule?order= with its own contact and vehicle", async () => {
  const shop = bookingShop();
  const res = await post(handlerWith(shop), { order: "#1002", email: "buyer@example.com" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.order.booking, {
    mode: "internal",
    ref: "TD-260920-ABCDEF",
    path: "/schedule?order=TD-260920-ABCDEF",
    install: "shop",
    prefill: {
      // Checkout's own note line wins for the name; the order's phone field wins for the phone.
      name: "Buyer Person",
      email: "buyer@example.com",
      phone: "+19545550199",
      vehicle: "2020 Toyota Camry LE",
    },
  });
  assert.deepEqual(shop.calls.map((c) => c.op), ["trackOrder", "bookingContact"]);
  assert.deepEqual(shop.calls[1].variables, { id: STORE_ORDER.id });
  // The rest of the public order is unchanged.
  assert.equal(res.body.order.delivery, "ship-to-store");
  assert.equal(res.body.order.financialStatus, "paid");
});

test("track booking: a storefront order (no TD- ref, no checkout note) uses its number and the order's contact", async () => {
  const theme = {
    ...STORE_ORDER,
    tags: [],
    note: "",
    customAttributes: [{ key: "Delivery", value: "Ship to store for install (Extreme Tires, Sunrise)" }],
  };
  const shop = bookingShop({ orders: [theme] });
  const res = await post(handlerWith(shop), { order: "1002", email: "buyer@example.com" });
  assert.deepEqual(res.body.order.booking, {
    mode: "internal",
    ref: "#1002",
    path: "/schedule?order=1002",
    install: "shop",
    prefill: { name: "Billing Name", email: "buyer@example.com", phone: "+19545550199", vehicle: "" },
  });
});

test("track booking: with INSTALL_BOOKING_URL the button is that link, filled and encoded on the server", async () => {
  const shop = bookingShop();
  const env = { ...ENV, INSTALL_BOOKING_URL: "https://book.example.com/td?ref={orderRef}&n={name}&e={email}&p={phone}&v={vehicle}" };
  const res = await post(handlerWith(shop, env), { order: "#1002", email: "Buyer@Example.com" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.order.booking, {
    mode: "external",
    url: "https://book.example.com/td?ref=TD-260920-ABCDEF&n=Buyer%20Person&e=buyer%40example.com&p=%2B19545550199&v=2020%20Toyota%20Camry%20LE",
  });
  assert.equal(Object.keys(res.body.order.booking).includes("prefill"), false);
});

test("track booking: a contact read Shopify refuses still gives a booking, from the checkout note", async () => {
  const shop = bookingShop({ contactFails: true });
  const { result: res, lines } = await quiet(() => post(handlerWith(shop), { order: "#1002", email: "buyer@example.com" }));
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.order.booking.prefill, {
    name: "Buyer Person",
    email: "buyer@example.com",
    phone: "(954) 555-0100",
    vehicle: "2020 Toyota Camry LE",
  });
  assert.ok(lines.some((l) => l.includes("booking contact")), "logged");
});

test("track booking: none for unpaid, cancelled, fulfilled or shipped orders, none for requests, none on a miss", async () => {
  for (const over of [
    { displayFinancialStatus: "PENDING" },
    { displayFinancialStatus: "REFUNDED" },
    { cancelledAt: "2026-09-21T00:00:00Z" },
    { displayFulfillmentStatus: "FULFILLED" },
    { tags: ["vercel-live", "ship-to-home"], customAttributes: [{ key: "Delivery", value: "Ship to my address" }], shippingLine: { title: "Free Shipping" }, note: "" },
  ]) {
    const shop = bookingShop({ orders: [{ ...STORE_ORDER, ...over }] });
    const res = await post(handlerWith(shop), { order: "#1002", email: "buyer@example.com" });
    assert.equal(res.statusCode, 200, JSON.stringify(over));
    assert.equal("booking" in res.body.order, false, JSON.stringify(over));
    assert.deepEqual(shop.calls.map((c) => c.op), ["trackOrder"], "no contact read");
  }
  // Wrong email: the same not-found, and the contact is never read.
  const shop = bookingShop();
  const miss = await post(handlerWith(shop), { order: "#1002", email: "someone@else.com" });
  assert.equal(miss.statusCode, 404);
  assert.deepEqual(shop.calls.map((c) => c.op), ["trackOrder"]);
  // An unpaid order request (TD- draft) keeps today's answer.
  const req = await post(handlerWith(mockShopify()), { order: "TD-260929-HJK234", email: "buyer@example.com" });
  assert.equal("booking" in req.body.request, false);
});
