// Run with: npm run test:api   (node --test api/_lib)

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { parseSizeQuery, checkShipState, validateTiresQuery } from "./validate.js";
import { getConfig } from "./config.js";
import { searchAtd, clearAtdCache, retailPrice, AtdNotConfirmedError } from "./atd.js";
import { buildHostedLinkUrl } from "./tireguru.js";
import statusHandler from "../status.js";
import tiresHandler from "../tires.js";
import checkoutHandler from "../checkout.js";

// ---- helpers ----------------------------------------------------------------

const INTEGRATION_VARS = /^(ATD_|TIREGURU_|ORDER_WEBHOOK_URL$|PRICE_MARKUP_PCT$|FREIGHT_PER_TIRE$)/;
let savedEnv;
let savedWarn;
let warnings;

beforeEach(() => {
  savedEnv = { ...process.env };
  for (const key of Object.keys(process.env)) {
    if (INTEGRATION_VARS.test(key)) delete process.env[key];
  }
  savedWarn = console.warn;
  warnings = [];
  console.warn = (...args) => warnings.push(args.join(" "));
  clearAtdCache();
});

afterEach(() => {
  process.env = savedEnv;
  console.warn = savedWarn;
});

function mockRes() {
  const headers = {};
  return {
    statusCode: 200,
    headers,
    body: undefined,
    setHeader(k, v) { headers[k.toLowerCase()] = v; },
    end(text) { this.body = text === undefined ? undefined : JSON.parse(text); },
  };
}

async function call(handler, req) {
  const res = mockRes();
  await handler({ headers: {}, ...req }, res);
  return res;
}

const validOrder = (over = {}) => ({
  items: [{ sku: "t-cont-truecontact-tour", qty: 4 }],
  delivery: "ship",
  customer: { name: "Test Buyer", email: "buyer@example.com", phone: "954-555-0100" },
  address: { line1: "1 Main St", city: "Orlando", state: "FL", zip: "32801" },
  ...over,
});

// ---- size parsing -----------------------------------------------------------

test("size parsing accepts standard and loose formats", () => {
  for (const input of ["225/45R17", "225/45r17", "225/45ZR17", "P225/45R17 91V", "225/45/17", "225 45 17", "225-45-17", "2254517"]) {
    const r = parseSizeQuery(input);
    assert.equal(r.ok, true, input);
    assert.equal(r.value.normalized, "225/45R17", input);
  }
  assert.equal(parseSizeQuery("33x12.50R20LT").ok, true);
});

test("size parsing rejects garbage and impossible sizes", () => {
  for (const input of ["", "abc", "225/45", "999/45R17", "225/10R17", "<script>"]) {
    const r = parseSizeQuery(input);
    assert.equal(r.ok, false, input);
    assert.ok(r.error.length > 0);
  }
});

test("GET /api/tires returns 400 with { error } on a bad size", async () => {
  const res = await call(tiresHandler, { method: "GET", query: { size: "banana" } });
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /isn't a tire size/);
});

test("tires query needs size or a full vehicle, not both", () => {
  assert.equal(validateTiresQuery({}).ok, false);
  assert.equal(validateTiresQuery({ year: "2020", make: "Toyota" }).ok, false);
  assert.equal(validateTiresQuery({ size: "225/45R17", make: "Toyota" }).ok, false);
  assert.equal(validateTiresQuery({ size: "225/45R17", limit: "0" }).ok, false);
  assert.equal(validateTiresQuery({ year: "2020", make: "Toyota", model: "Camry" }).ok, true);
});

// ---- free-shipping area -----------------------------------------------------

test("free shipping covers the 48 contiguous states and DC only", () => {
  for (const s of ["FL", "fl", "CA", "DC", "ME", "WA", "TX"]) {
    assert.equal(checkShipState(s).ok, true, s);
  }
  for (const s of ["AK", "HI", "PR", "GU", "VI", "AE"]) {
    const r = checkShipState(s);
    assert.equal(r.ok, false, s);
    assert.match(r.error, /48 contiguous states and DC/);
  }
  assert.equal(checkShipState("XX").ok, false);
  assert.equal(checkShipState("").ok, false);
});

test("checkout rejects a ship order to Alaska", async () => {
  const body = validOrder({ address: { line1: "1 Main St", city: "Anchorage", state: "AK", zip: "99501" } });
  const res = await call(checkoutHandler, { method: "POST", body });
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /Alaska/);
});

// ---- server-side repricing --------------------------------------------------

test("checkout reprices on the server and ignores client prices", async () => {
  const body = validOrder({
    items: [
      { sku: "t-cont-truecontact-tour", qty: 4, price: 1, total: 4 }, // $142 each in products.js
      { sku: "t-nexen-npriz-ah5", qty: 2, price: 0.01 }, // $98 each
    ],
  });
  const res = await call(checkoutHandler, { method: "POST", body });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.total, 142 * 4 + 98 * 2);
  assert.deepEqual(res.body.lines.map((l) => l.price), [142, 98]);
});

test("checkout rejects unknown SKUs", async () => {
  const res = await call(checkoutHandler, {
    method: "POST",
    body: validOrder({ items: [{ sku: "not-a-real-sku", qty: 4 }] }),
  });
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /couldn't find/);
});

test("retail price = ATD cost + markup + freight per tire", () => {
  assert.equal(retailPrice(100, { markupPct: 25, freightPerTire: 12.5 }), 137.5);
  assert.equal(retailPrice(0, { markupPct: 25, freightPerTire: 0 }), null);
});

// ---- request-mode fallback with no env --------------------------------------

test("with no env: status is sample/off/request", async () => {
  const res = await call(statusHandler, { method: "GET" });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.atd, "sample");
  assert.equal(res.body.tireguru, "off");
  assert.equal(res.body.checkout, "request");
  assert.equal(res.body.issues, undefined);
  assert.ok(res.body.version);
});

test("with no env: checkout is an undelivered, unpaid order request", async () => {
  const res = await call(checkoutHandler, { method: "POST", body: validOrder() });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.mode, "request");
  assert.equal(res.body.delivered, false);
  assert.equal(res.body.paid, false);
  assert.match(res.body.orderRef, /^TD-\d{6}-[A-Z2-9]{6}$/);
  assert.equal(res.body.total, 568);
  assert.equal(res.headers["cache-control"], "no-store");
  assert.ok(warnings.some((w) => w.includes("was NOT sent")), "order is logged");
});

test("with ORDER_WEBHOOK_URL: the order request is POSTed and reported delivered", async (t) => {
  process.env.ORDER_WEBHOOK_URL = "https://formspree.io/f/test";
  const sent = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    sent.push({ url: String(url), body: JSON.parse(init.body) });
    return new Response("{}", { status: 200 });
  });
  const res = await call(checkoutHandler, { method: "POST", body: validOrder({ delivery: "pickup", address: undefined }) });
  assert.equal(res.body.delivered, true);
  assert.equal(res.body.pickup.address, "7712 West Oakland Park Blvd, Sunrise, FL 33351");
  assert.equal(sent.length, 1);
  assert.match(sent[0].body.message, /NOT PAID/);
});

// ---- fail-loud configuration --------------------------------------------------

test("half-configured ATD is a 503, never a quiet fallback to sample", async () => {
  process.env.ATD_API_KEY = "k";
  const status = await call(statusHandler, { method: "GET" });
  assert.equal(status.body.atd, "live");
  assert.ok(status.body.issues.some((i) => i.includes("ATD_API_BASE")));
  assert.ok(!JSON.stringify(status.body).includes('"k"'), "no secret values");
  const res = await call(tiresHandler, { method: "GET", query: { size: "225/45R17" } });
  assert.equal(res.statusCode, 503);
});

test("Tire Guru alone does not take payment on sample prices", () => {
  const cfg = getConfig({ TIREGURU_CHECKOUT_URL: "https://pay.example.com/x" });
  assert.equal(cfg.tireguru.mode, "live");
  assert.equal(cfg.checkout, "request");
});

test("hosted link template is filled and encoded", () => {
  const url = buildHostedLinkUrl(
    { orderRef: "TD-1", total: 568, customer: { email: "a+b@example.com", name: "A B", phone: "x" } },
    { checkoutUrl: "https://pay.example.com/p?ref={orderRef}&amt={total}&e={email}" },
  );
  assert.equal(url, "https://pay.example.com/p?ref=TD-1&amt=568.00&e=a%2Bb%40example.com");
});

// ---- ATD transport: unconfirmed endpoints, retry, cache -----------------------

const liveAtd = getConfig({
  ATD_API_BASE: "https://atd.example.test/api",
  ATD_API_KEY: "k",
  ATD_API_SECRET: "s",
  ATD_ACCOUNT_NUMBER: "1",
  ATD_SHIP_TO: "2",
  PRICE_MARKUP_PCT: "20",
  FREIGHT_PER_TIRE: "10",
}).atd;
const sizeQuery = { type: "size", size: parseSizeQuery("225/45R17").value };

test("ATD live mode refuses to guess an unconfirmed endpoint", async () => {
  await assert.rejects(searchAtd(sizeQuery, liveAtd), AtdNotConfirmedError);
});

test("ATD search retries once, maps, prices and caches for 5 minutes", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    if (calls === 1) return new Response("busy", { status: 503 });
    return Response.json([{ sku: "A1", dealerCost: 100, brand: "B", model: "M", size: "225/45R17", quantityAvailable: 3 }]);
  };
  let clock = 1_000_000;
  const deps = { fetchImpl, endpoints: { searchBySize: "placeholder" }, retryDelayMs: 0, now: () => clock };

  const first = await searchAtd(sizeQuery, liveAtd, deps);
  assert.equal(calls, 2, "one retry after the 503");
  assert.equal(first[0].price, 130); // 100 * 1.20 + 10
  assert.equal(first[0].available, true);
  assert.equal("dealerCost" in first[0], false, "cost never leaves the server");

  await searchAtd(sizeQuery, liveAtd, deps);
  assert.equal(calls, 2, "served from cache");
  clock += 5 * 60 * 1000 + 1;
  await searchAtd(sizeQuery, liveAtd, deps);
  assert.equal(calls, 3, "cache expired after 5 minutes");
});

test("ATD search does not retry a 4xx", async () => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; return new Response("no", { status: 401 }); };
  await assert.rejects(
    searchAtd(sizeQuery, liveAtd, { fetchImpl, endpoints: { searchBySize: "placeholder" }, retryDelayMs: 0 }),
    /HTTP 401/,
  );
  assert.equal(calls, 1);
});
