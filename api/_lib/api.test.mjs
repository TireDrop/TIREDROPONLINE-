// Run with: npm run test:api   (node --test api/_lib)

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { parseSizeQuery, checkShipState, validateTiresQuery } from "./validate.js";
import { getConfig } from "./config.js";
import { searchAtd, clearAtdCache, retailPrice, AtdNotConfirmedError, getBySku } from "./atd.js";
import { buildHostedLinkUrl } from "./tireguru.js";
import statusHandler from "../status.js";
import tiresHandler from "../tires.js";
import checkoutHandler, { paymentModeFor, createCheckoutHandler } from "../checkout.js";
import { buildOrder } from "./orders.js";
import {
  createDraftCheckout,
  clearShopifyTokenCache,
  ShopifyCheckoutError,
  DRAFT_ORDER_CREATE,
  shopifyGraphQL,
  toE164,
} from "./shopify.js";

// ---- helpers ----------------------------------------------------------------

const INTEGRATION_VARS = /^(ATD_|TIREGURU_|SHOPIFY_|ORDER_WEBHOOK_URL$|PRICE_MARKUP_PCT$|FREIGHT_PER_TIRE$|CRON_SECRET$)/;
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
  clearShopifyTokenCache();
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

const LIVE_ATD_ENV = Object.freeze({
  ATD_API_BASE: "https://atd.example.test/api",
  ATD_API_KEY: "k",
  ATD_API_SECRET: "s",
  ATD_ACCOUNT_NUMBER: "1",
  ATD_SHIP_TO: "2",
  PRICE_MARKUP_PCT: "20",
  FREIGHT_PER_TIRE: "10",
});

const SHOPIFY_ENV = Object.freeze({
  SHOPIFY_STORE_DOMAIN: "tiredrop-test.myshopify.com",
  SHOPIFY_ADMIN_TOKEN: "shpat_test_token",
});

const INVOICE_URL = "https://tiredrop-test.myshopify.com/12345/invoices/abcdef";
// An odd dealer cost, so the test can prove the figure never leaves the server.
const DEALER_COST = 87.35; // retail = 87.35 * 1.20 + 10 = 114.82

/**
 * Deps for createCheckoutHandler with ATD (lookupSkus) and Shopify mocked.
 * `shopifyReply` is what the GraphQL endpoint answers.
 */
function liveDeps(shopifyReply = () => Response.json({
  data: {
    draftOrderCreate: {
      draftOrder: { id: "gid://shopify/DraftOrder/1", name: "#D1", invoiceUrl: INVOICE_URL },
      userErrors: [],
    },
  },
})) {
  const shopifyCalls = [];
  const atdFetch = async (url) => {
    const skus = new URL(url).searchParams.get("skus").split(",");
    return Response.json(skus.map((sku) => ({
      sku, dealerCost: DEALER_COST, brand: "Continental", model: "TrueContact Tour", size: "225/45R17", quantityAvailable: 8,
    })));
  };
  const shopifyFetch = async (url, init) => {
    shopifyCalls.push({ url: String(url), headers: init.headers, raw: init.body, body: JSON.parse(init.body) });
    return shopifyReply(shopifyCalls.length);
  };
  return {
    shopifyCalls,
    deps: {
      atd: { fetchImpl: atdFetch, endpoints: { lookupSkus: "placeholder" }, retryDelayMs: 0 },
      shopify: { fetchImpl: shopifyFetch, retryDelayMs: 0 },
    },
  };
}

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
  assert.equal(res.body.shopify, "off");
  assert.equal("tireguru" in res.body, false, "Tire Guru is retired");
  assert.equal(res.body.checkout, "request");
  assert.equal(res.body.forwarder, "off");
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

test("Tire Guru variables are ignored and flagged; they never switch payment on", () => {
  const cfg = getConfig({ ...LIVE_ATD_ENV, TIREGURU_CHECKOUT_URL: "https://pay.example.com/x" });
  assert.equal(cfg.checkout, "request");
  assert.equal("tireguru" in cfg, false);
  assert.ok(cfg.issues.some((i) => i.includes("TIREGURU_CHECKOUT_URL is ignored")));
});

test("Shopify alone does not take payment on sample prices", () => {
  const cfg = getConfig(SHOPIFY_ENV);
  assert.equal(cfg.shopify.mode, "live");
  assert.equal(cfg.shopify.ok, true);
  assert.equal(cfg.checkout, "request");
  assert.ok(cfg.issues.some((i) => i.includes("ATD is in sample mode")));
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

// ---- mobile install ---------------------------------------------------------

const mobileOrder = (address = {}) =>
  validOrder({
    delivery: "mobile",
    address: { line1: "10 NW 1st Ave", city: "Coral Springs", state: "FL", zip: "33065", ...address },
  });

const AREA_ERROR =
  "Mobile install covers Miami-Dade, Broward and Palm Beach counties. Choose ship-to-home or ship-to-store instead.";

test("mobile install accepts an in-area ZIP and keeps the city as typed", async () => {
  const res = await call(checkoutHandler, { method: "POST", body: mobileOrder({ city: "Fort Lauderdale", zip: "33301" }) });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.mode, "request");
  assert.equal(res.body.delivery, "mobile");
  assert.equal(res.body.paid, false);
  assert.equal(res.body.total, 568, "tires only: 4 x $142, no install labour added");
  assert.equal(res.body.installNote, "Install quoted on the call");
  assert.equal(res.body.serviceAddress.city, "Fort Lauderdale");
  assert.equal(res.body.serviceAddress.state, "FL");
});

test("mobile install covers all three counties by ZIP, whatever the city says", async () => {
  for (const [city, zip] of [
    ["Sunrise", "33351"],
    ["Miami Beach", "33139"],
    ["West Palm Beach", "33401"],
    ["Boca Raton", "33431"],
    ["Sunrise", "33351-1234"],
  ]) {
    const res = await call(checkoutHandler, { method: "POST", body: mobileOrder({ city, zip }) });
    assert.equal(res.statusCode, 200, `${city} ${zip}`);
    assert.equal(res.body.delivery, "mobile");
  }
});

test("mobile install turns away a ZIP outside the three counties with a 400", async () => {
  for (const [city, zip] of [
    ["Key West", "33040"],
    ["Stuart", "34997"],
    ["Sunrise", "34997"],
  ]) {
    const res = await call(checkoutHandler, { method: "POST", body: mobileOrder({ city, zip }) });
    assert.equal(res.statusCode, 400, `${city} ${zip}`);
    assert.equal(res.body.error, AREA_ERROR);
  }
});

test("ship orders are not held to the mobile ZIP rule", async () => {
  const res = await call(checkoutHandler, {
    method: "POST",
    body: validOrder({ delivery: "ship", address: { line1: "1 Main St", city: "New York", state: "NY", zip: "10001" } }),
  });
  assert.equal(res.statusCode, 200);
});

test("mobile install rejects a non-FL state with a 400", async () => {
  const res = await call(checkoutHandler, { method: "POST", body: mobileOrder({ state: "GA" }) });
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /state must be FL/);
});

test("mobile install needs the address and a phone number", async () => {
  const noAddress = await call(checkoutHandler, { method: "POST", body: validOrder({ delivery: "mobile", address: undefined }) });
  assert.equal(noAddress.statusCode, 400);
  assert.match(noAddress.body.error, /address/);
  const noZip = await call(checkoutHandler, { method: "POST", body: mobileOrder({ zip: "" }) });
  assert.equal(noZip.statusCode, 400);
  const body = mobileOrder();
  body.customer = { ...body.customer, phone: "" };
  const noPhone = await call(checkoutHandler, { method: "POST", body });
  assert.equal(noPhone.statusCode, 400);
  assert.match(noPhone.body.error, /Phone/);
});

test("mobile always returns request mode even when a payment provider is live", async () => {
  // The checkout-provider flag is live only with every integration on.
  const live = getConfig({ ...LIVE_ATD_ENV, ...SHOPIFY_ENV });
  assert.equal(live.checkout, "shopify", "payment provider is live");
  const lines = [{ sku: "A1", title: "A1", qty: 4, price: 130, lineTotal: 520 }];
  const input = (delivery, address) => ({
    delivery,
    customer: { name: "T", email: "t@example.com", phone: "(954) 555-0100" },
    address,
    notes: null,
  });
  const addr = { line1: "1 Main St", line2: null, city: "Sunrise", state: "FL", zip: "33351" };
  assert.equal(paymentModeFor(buildOrder(input("ship", addr), lines), live), "redirect");
  assert.equal(paymentModeFor(buildOrder(input("pickup", null), lines), live), "redirect");
  assert.equal(paymentModeFor(buildOrder(input("mobile", addr), lines), live), "request");

  // End to end (mobile becomes a request draft and a lead, never a
  // checkout link): api/_lib/leads.test.mjs.
});

test("an unknown delivery mode is still a 400", async () => {
  const res = await call(checkoutHandler, { method: "POST", body: validOrder({ delivery: "drone" }) });
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /"mobile"/);
});

// ---- one tire by sku ----------------------------------------------------------

test("sku lookups stand alone and must look like a sku", () => {
  assert.deepEqual(validateTiresQuery({ sku: "t-cont-truecontact-tour" }).value, { type: "sku", sku: "t-cont-truecontact-tour" });
  assert.equal(validateTiresQuery({ sku: "x", size: "225/45R17" }).ok, false);
  assert.equal(validateTiresQuery({ sku: "x", make: "Toyota" }).ok, false);
  assert.equal(validateTiresQuery({ sku: "<script>" }).ok, false);
  assert.equal(validateTiresQuery({ sku: "a".repeat(65) }).ok, false);
});

test("GET /api/tires?sku= returns the sample tire in sample mode", async () => {
  const res = await call(tiresHandler, { method: "GET", query: { sku: "t-cont-truecontact-tour" } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.source, "sample");
  assert.equal(res.body.item.sku, "t-cont-truecontact-tour");
  assert.equal(res.body.item.price, 142);
  assert.equal(res.body.item.available, null);
  assert.equal(res.body.item.qty, null);
});

test("GET /api/tires?sku= is a 404 with { error } for an unknown sku", async () => {
  const res = await call(tiresHandler, { method: "GET", url: "/api/tires?sku=nope-123" });
  assert.equal(res.statusCode, 404);
  assert.match(res.body.error, /couldn't find that tire/);
  assert.equal(res.headers["cache-control"], "no-store");
});

test("GET /api/tires?sku= in live mode fails loudly (501) until the endpoint is confirmed", async () => {
  Object.assign(process.env, {
    ATD_API_BASE: "https://atd.example.test/api",
    ATD_API_KEY: "k",
    ATD_API_SECRET: "s",
    ATD_ACCOUNT_NUMBER: "1",
    ATD_SHIP_TO: "2",
    PRICE_MARKUP_PCT: "20",
    FREIGHT_PER_TIRE: "10",
  });
  const res = await call(tiresHandler, { method: "GET", query: { sku: "A1" } });
  assert.equal(res.statusCode, 501);
  assert.match(res.body.error, /getBySku/);
  await assert.rejects(getBySku("A1", liveAtd), AtdNotConfirmedError);
});

test("ATD getBySku prices with markup + freight, hides cost, caches, and maps 404 to null", async () => {
  let calls = 0;
  const fetchImpl = async (url) => {
    calls += 1;
    const sku = new URL(url).searchParams.get("sku");
    if (sku === "GONE") return new Response("no", { status: 404 });
    if (sku === "EMPTY") return Response.json({ items: [] });
    return Response.json({ sku, dealerCost: 100, brand: "B", model: "M", size: "225/45R17", loadIndex: 94, speedRating: "V", quantityAvailable: 2 });
  };
  const deps = { fetchImpl, endpoints: { getBySku: "placeholder" }, retryDelayMs: 0 };

  const item = await getBySku("A1", liveAtd, deps);
  assert.equal(item.price, 130); // 100 * 1.20 + 10
  assert.equal(item.sku, "A1");
  assert.equal(item.qty, 2);
  assert.equal(item.loadIndex, "94");
  assert.equal("dealerCost" in item, false, "cost never leaves the server");
  assert.ok(!JSON.stringify(item).includes("100"), "no cost figure anywhere");

  await getBySku("A1", liveAtd, deps);
  assert.equal(calls, 1, "served from cache");

  assert.equal(await getBySku("GONE", liveAtd, deps), null);
  assert.equal(calls, 2, "a 404 is not retried");
  assert.equal(await getBySku("EMPTY", liveAtd, deps), null);
});

// ---- Shopify draft-order checkout --------------------------------------------

const liveShopifyHandler = (deps, env = {}) =>
  createCheckoutHandler({ env: { ...LIVE_ATD_ENV, ...SHOPIFY_ENV, ...env }, ...deps });

test("Shopify checkout: ship order becomes a draft order of custom lines at server prices", async () => {
  const { deps, shopifyCalls } = liveDeps();
  const body = validOrder({
    items: [{ sku: "ATD-1", qty: 4, price: 1, total: 4 }], // client price ignored
    notes: "Please call after 5pm",
  });
  const res = await call(liveShopifyHandler(deps), { method: "POST", body });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(
    { mode: res.body.mode, url: res.body.url, total: res.body.total },
    { mode: "redirect", url: INVOICE_URL, total: 459.28 },
  );
  assert.match(res.body.orderRef, /^TD-\d{6}-[A-Z2-9]{6}$/);
  assert.equal(res.headers["cache-control"], "no-store");

  assert.equal(shopifyCalls.length, 1);
  const [sent] = shopifyCalls;
  assert.equal(sent.url, "https://tiredrop-test.myshopify.com/admin/api/2026-07/graphql.json");
  assert.equal(sent.headers["X-Shopify-Access-Token"], "shpat_test_token");
  assert.equal(sent.body.query, DRAFT_ORDER_CREATE);
  assert.match(sent.body.query, /draftOrderCreate\(input: \$input\)/);

  const input = sent.body.variables.input;
  assert.deepEqual(input.lineItems, [{
    title: "Continental TrueContact Tour 225/45R17",
    sku: "ATD-1",
    quantity: 4,
    originalUnitPriceWithCurrency: { amount: "114.82", currencyCode: "USD" },
    requiresShipping: true,
    taxable: true,
    customAttributes: [
      { key: "Size", value: "225/45R17" },
      { key: "Brand", value: "Continental" },
    ],
  }]);
  assert.equal("variantId" in input.lineItems[0], false, "custom line, no Shopify product");
  assert.deepEqual(input.shippingLine, {
    title: "Free Shipping",
    priceWithCurrency: { amount: "0.00", currencyCode: "USD" },
  });
  assert.deepEqual(input.customAttributes, [
    { key: "Delivery", value: "Ship to my address" },
    { key: "Source", value: "TireDrop live (Vercel)" },
    { key: "Order ref", value: res.body.orderRef },
  ]);
  assert.deepEqual(input.shippingAddress, {
    firstName: "Test",
    lastName: "Buyer",
    address1: "1 Main St",
    city: "Orlando",
    provinceCode: "FL",
    zip: "32801",
    countryCode: "US",
    phone: "+19545550100",
  });
  assert.equal(input.email, "buyer@example.com");
  assert.equal(input.phone, "+19545550100");
  assert.deepEqual(input.tags, ["vercel-live", "ship-to-home"]);
  assert.match(input.note, new RegExp(res.body.orderRef));
  assert.match(input.note, /Please call after 5pm/);
  assert.equal(input.acceptAutomaticDiscounts, false, "no discounts");
  assert.equal(input.allowDiscountCodesInCheckout, false, "no discount codes");

  assert.ok(!sent.raw.includes("dealerCost"), "no cost field sent to Shopify");
  assert.ok(!sent.raw.includes(String(DEALER_COST)), "no cost figure sent to Shopify");
});

test("Shopify checkout: pickup uses the ship-to-store attribute and a free pickup line", async () => {
  const { deps, shopifyCalls } = liveDeps();
  const res = await call(liveShopifyHandler(deps), {
    method: "POST",
    body: validOrder({ delivery: "pickup", address: undefined }),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.mode, "redirect");
  const input = shopifyCalls[0].body.variables.input;
  assert.deepEqual(input.shippingLine, {
    title: "Pickup at Extreme Tires (Sunrise, FL)",
    priceWithCurrency: { amount: "0.00", currencyCode: "USD" },
  });
  assert.deepEqual(input.customAttributes[0], {
    key: "Delivery",
    value: "Ship to store for install (Extreme Tires, Sunrise)",
  });
  assert.equal(input.shippingAddress, undefined);
  assert.deepEqual(input.tags, ["vercel-live", "ship-to-store"]);
});

test("Shopify checkout: userErrors are an error, never a redirect", async () => {
  const { deps } = liveDeps(() => Response.json({
    data: { draftOrderCreate: { draftOrder: null, userErrors: [{ field: ["input", "email"], message: "Email is invalid" }] } },
  }));
  const errors = [];
  const savedError = console.error;
  console.error = (...args) => errors.push(args.join(" "));
  try {
    const res = await call(liveShopifyHandler(deps), { method: "POST", body: validOrder() });
    assert.equal(res.statusCode, 502);
    assert.equal(res.body.url, undefined);
    assert.match(res.body.error, /Shopify refused the request: input\.email: Email is invalid/);
    assert.ok(errors.some((e) => e.includes("Email is invalid")), "logged");
  } finally {
    console.error = savedError;
  }
});

const shopifyCfg = (env = SHOPIFY_ENV) => getConfig({ ...LIVE_ATD_ENV, ...env }).shopify;
const pricedOrder = (delivery = "ship") =>
  buildOrder(
    {
      delivery,
      customer: { name: "Test Buyer", email: "t@example.com", phone: "(954) 555-0100" },
      address: delivery === "ship" ? { line1: "1 Main St", line2: null, city: "Orlando", state: "FL", zip: "32801" } : null,
      notes: null,
    },
    [{ sku: "A1", title: "A1", brand: null, size: null, qty: 4, price: 130, lineTotal: 520 }],
  );

test("Shopify checkout: a missing or non-https invoiceUrl is an error, not a guessed link", async () => {
  for (const draftOrder of [{ id: "x", name: "#D1", invoiceUrl: null }, { id: "x", name: "#D1", invoiceUrl: "http://x.test/i" }, null]) {
    const fetchImpl = async () => Response.json({ data: { draftOrderCreate: { draftOrder, userErrors: [] } } });
    await assert.rejects(
      createDraftCheckout(pricedOrder(), shopifyCfg(), { fetchImpl }),
      (err) => err instanceof ShopifyCheckoutError && /invoiceUrl/.test(err.message),
    );
  }
  const graphqlError = async () => Response.json({ errors: [{ message: "Access denied for draftOrderCreate field." }] });
  await assert.rejects(
    createDraftCheckout(pricedOrder(), shopifyCfg(), { fetchImpl: graphqlError }),
    /Access denied/,
  );
});

test("Shopify checkout retries once on 5xx/429/network, never on other 4xx", async () => {
  const ok = Response.json({ data: { draftOrderCreate: { draftOrder: { id: "x", name: "#D1", invoiceUrl: INVOICE_URL }, userErrors: [] } } });
  let calls = 0;
  const flaky = async () => { calls += 1; return calls === 1 ? new Response("busy", { status: 503 }) : ok; };
  assert.equal(await createDraftCheckout(pricedOrder(), shopifyCfg(), { fetchImpl: flaky, retryDelayMs: 0 }), INVOICE_URL);
  assert.equal(calls, 2);

  calls = 0;
  const down = async () => { calls += 1; throw new TypeError("fetch failed"); };
  await assert.rejects(createDraftCheckout(pricedOrder(), shopifyCfg(), { fetchImpl: down, retryDelayMs: 0 }), ShopifyCheckoutError);
  assert.equal(calls, 2, "one retry only");

  calls = 0;
  const denied = async () => { calls += 1; return new Response("no", { status: 401 }); };
  await assert.rejects(createDraftCheckout(pricedOrder(), shopifyCfg(), { fetchImpl: denied, retryDelayMs: 0 }), /HTTP 401/);
  assert.equal(calls, 1);
});

test("Shopify client credentials: token fetched once, cached, then used", async () => {
  const cfg = shopifyCfg({
    SHOPIFY_STORE_DOMAIN: "https://TireDrop-Test.myshopify.com/",
    SHOPIFY_CLIENT_ID: "cid",
    SHOPIFY_CLIENT_SECRET: "csecret",
  });
  assert.equal(cfg.ok, true);
  assert.equal(cfg.auth, "client-credentials");
  assert.equal(cfg.domain, "tiredrop-test.myshopify.com");
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).endsWith("/admin/oauth/access_token")) {
      return Response.json({ access_token: "shpat_fresh", scope: "write_draft_orders", expires_in: 86399 });
    }
    return Response.json({ data: { draftOrderCreate: { draftOrder: { id: "x", name: "#D1", invoiceUrl: INVOICE_URL }, userErrors: [] } } });
  };
  await createDraftCheckout(pricedOrder(), cfg, { fetchImpl });
  await createDraftCheckout(pricedOrder("pickup"), cfg, { fetchImpl });
  assert.deepEqual(calls.map((c) => c.url), [
    "https://tiredrop-test.myshopify.com/admin/oauth/access_token",
    "https://tiredrop-test.myshopify.com/admin/api/2026-07/graphql.json",
    "https://tiredrop-test.myshopify.com/admin/api/2026-07/graphql.json",
  ]);
  const form = new URLSearchParams(calls[0].init.body);
  assert.equal(form.get("grant_type"), "client_credentials");
  assert.equal(form.get("client_id"), "cid");
  assert.equal(form.get("client_secret"), "csecret");
  assert.equal(calls[1].init.headers["X-Shopify-Access-Token"], "shpat_fresh");
});

test("Shopify phone is sent only as valid E.164", () => {
  assert.equal(toE164("(954) 555-0100"), "+19545550100");
  assert.equal(toE164("1-954-555-0100"), "+19545550100");
  assert.equal(toE164("(123) 555-0100"), null, "area code cannot start with 1");
  assert.equal(toE164("555-0100"), null);
});

test("partial Shopify config fails loud: status lists it and checkout is a 503", async () => {
  const cases = [
    [{ SHOPIFY_STORE_DOMAIN: "tiredrop-test.myshopify.com" }, /Missing: SHOPIFY_ADMIN_TOKEN/],
    [{ SHOPIFY_ADMIN_TOKEN: "shpat_x" }, /Missing: SHOPIFY_STORE_DOMAIN/],
    [{ ...SHOPIFY_ENV, SHOPIFY_STORE_DOMAIN: "tiredroponline.com" }, /myshopify\.com/],
    [{ ...SHOPIFY_ENV, SHOPIFY_API_VERSION: "latest" }, /SHOPIFY_API_VERSION must look like/],
    [{ ...SHOPIFY_ENV, SHOPIFY_API_VERSION: "2025-07" }, /2026-07 or newer/],
    [{ ...SHOPIFY_ENV, SHOPIFY_CLIENT_ID: "cid" }, /not both/],
    [{ SHOPIFY_STORE_DOMAIN: "tiredrop-test.myshopify.com", SHOPIFY_CLIENT_ID: "cid" }, /Missing: SHOPIFY_CLIENT_SECRET/],
  ];
  for (const [env, pattern] of cases) {
    const cfg = getConfig({ ...LIVE_ATD_ENV, ...env });
    assert.equal(cfg.shopify.mode, "live", JSON.stringify(env));
    assert.equal(cfg.shopify.ok, false, JSON.stringify(env));
    assert.equal(cfg.checkout, "request", JSON.stringify(env));
    assert.ok(cfg.issues.some((i) => pattern.test(i)), `${JSON.stringify(env)} -> ${cfg.issues}`);
  }

  process.env.SHOPIFY_STORE_DOMAIN = "tiredrop-test.myshopify.com";
  const status = await call(statusHandler, { method: "GET" });
  assert.equal(status.body.shopify, "live");
  assert.equal(status.body.checkout, "request");
  assert.ok(status.body.issues.some((i) => i.includes("SHOPIFY_ADMIN_TOKEN")));

  const { deps, shopifyCalls } = liveDeps();
  const savedError = console.error;
  console.error = () => {};
  try {
    const res = await call(
      createCheckoutHandler({ env: { ...LIVE_ATD_ENV, SHOPIFY_STORE_DOMAIN: "tiredrop-test.myshopify.com" }, ...deps }),
      { method: "POST", body: validOrder() },
    );
    assert.equal(res.statusCode, 503);
    assert.match(res.body.error, /Shopify is partially configured/);
  } finally {
    console.error = savedError;
  }
  assert.equal(shopifyCalls.length, 0);
});

test("with no Shopify variables, checkout stays in request mode and never calls Shopify", async () => {
  const { deps, shopifyCalls } = liveDeps();
  const handler = createCheckoutHandler({ env: { ...LIVE_ATD_ENV }, ...deps });
  const res = await call(handler, { method: "POST", body: validOrder({ items: [{ sku: "ATD-1", qty: 4 }] }) });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.mode, "request");
  assert.equal(res.body.paid, false);
  assert.equal(res.body.delivered, false);
  assert.equal(res.body.total, 459.28);
  assert.equal(shopifyCalls.length, 0);
  assert.equal(getConfig({ ...LIVE_ATD_ENV }).checkout, "request");
});

test("shopifyGraphQL is generic: returns data, throws on userErrors under any root field or top-level errors", async () => {
  const cfg = shopifyCfg();
  const seen = [];
  const reply = (json) => async (url, init) => { seen.push(JSON.parse(init.body)); return Response.json(json); };

  const data = await shopifyGraphQL(cfg, "query Q($id: ID!) { order(id: $id) { id } }", { id: "gid://shopify/Order/1" }, {
    fetchImpl: reply({ data: { order: { id: "gid://shopify/Order/1" } } }),
  });
  assert.deepEqual(data, { order: { id: "gid://shopify/Order/1" } });
  assert.deepEqual(seen[0].variables, { id: "gid://shopify/Order/1" });

  await assert.rejects(
    shopifyGraphQL(cfg, "mutation M { tagsAdd { userErrors { field message } } }", {}, {
      fetchImpl: reply({ data: { tagsAdd: { node: null, userErrors: [{ field: ["id"], message: "Not found" }] } } }),
    }),
    (err) => err instanceof ShopifyCheckoutError && /id: Not found/.test(err.message) && err.userErrors.length === 1,
  );
  await assert.rejects(
    shopifyGraphQL(cfg, "query { shop { name } }", {}, { fetchImpl: reply({ errors: [{ message: "Throttled" }] }) }),
    /Throttled/,
  );
  await assert.rejects(
    shopifyGraphQL(getConfig({}).shopify, "query { shop { name } }"),
    (err) => err instanceof ShopifyCheckoutError && err.status === 503,
  );
});
