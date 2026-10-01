// Run with: npm run test:api
//
// The spam guard on the public write endpoints (api/_lib/spam.js): the
// honeypot, the fill-time token (src/data/formGuard.js), the content checks,
// the per-IP rate limits and the body size caps, on /api/forms,
// /api/checkout, /api/newsletter and /api/book-install. Shopify is a mocked
// fetch that records every call; a blocked submission must make none.

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";

import { createFormsHandler, resetFormsRateLimit } from "../forms.js";
import { createCheckoutHandler, resetCheckoutRateLimit, CHECKOUT_RATE_LIMIT } from "../checkout.js";
import { createNewsletterHandler } from "../newsletter.js";
import { resetNewsletterRateLimit } from "./newsletter.js";
import { createBookInstallHandler, resetBookInstallRateLimit, BOOK_INSTALL_RATE_LIMIT } from "../book-install.js";
import { resetTrackRateLimit } from "../track.js";
import { clearShopifyTokenCache } from "./shopify.js";
import { readJsonBody } from "./http.js";
import {
  BODY_LIMITS,
  MAX_LINKS,
  STALE_PAGE,
  contentSpamReason,
  inspectSubmission,
  minFillMs,
} from "./spam.js";
import {
  FILL_TOKEN_FIELD,
  MIN_FILL_MS,
  fillToken,
  guardFields,
  noteFormStart,
  readFillToken,
} from "../../src/data/formGuard.js";

const SHOPIFY_ENV = Object.freeze({
  SHOPIFY_STORE_DOMAIN: "tiredrop-test.myshopify.com",
  SHOPIFY_ADMIN_TOKEN: "shpat_test_token",
});
const NOW = Date.parse("2026-09-28T18:05:00Z");

// A form on screen for `ms` milliseconds, by the visitor's clock (which may
// be anything: only the difference is read).
const shown = (ms) => fillToken(1_700_000_000_000, 1_700_000_000_000 + ms);
const HUMAN = shown(9000);

let logged;
let saved;
beforeEach(() => {
  resetFormsRateLimit();
  resetCheckoutRateLimit();
  resetNewsletterRateLimit();
  resetBookInstallRateLimit();
  resetTrackRateLimit();
  clearShopifyTokenCache();
  logged = [];
  saved = { warn: console.warn, error: console.error, log: console.log };
  console.warn = (...a) => logged.push(a.join(" "));
  console.error = (...a) => logged.push(a.join(" "));
});
afterEach(() => {
  Object.assign(console, saved);
});

/** A Shopify that records calls and answers every lead operation successfully. */
function recordingShopify() {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body);
    const op = /^(?:query|mutation)\s+(\w+)/.exec(body.query.trim())[1];
    calls.push(op);
    const data = {
      leadCustomer: { customer: null },
      leadCustomerCreate: { customerCreate: { customer: { id: "gid://shopify/Customer/1" }, userErrors: [] } },
      leadNoteUpdate: { customerUpdate: { customer: { id: "gid://shopify/Customer/1" }, userErrors: [] } },
      leadMetafieldSet: { metafieldsSet: { metafields: [{ id: "m" }], userErrors: [] } },
      leadTagsAdd: { tagsAdd: { node: { id: "gid://shopify/Customer/1" }, userErrors: [] } },
      draftOrderCreate: { draftOrderCreate: { draftOrder: { id: "gid://shopify/DraftOrder/1", name: "#D1", invoiceUrl: "https://x.test/i" }, userErrors: [] } },
      customerCreate: { customerCreate: { customer: { id: "gid://shopify/Customer/2" }, userErrors: [] } },
      trackOrder: { orders: { nodes: [] } },
    }[op];
    if (!data) throw new Error(`unexpected ${op}`);
    return Response.json({ data });
  };
  return { calls, fetchImpl };
}

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(text) { this.body = text === undefined ? undefined : JSON.parse(text); },
  };
}

async function post(handler, body, headers = {}) {
  const res = mockRes();
  await handler({ method: "POST", headers: { "x-forwarded-for": "203.0.113.20", ...headers }, body }, res);
  return res;
}

const deps = (shop, extra = {}) => ({ shopify: { fetchImpl: shop.fetchImpl, retryDelayMs: 0 }, now: () => NOW, ...extra });
const forms = (shop, env = SHOPIFY_ENV) => createFormsHandler({ env, ...deps(shop) });
const checkout = (shop, env = SHOPIFY_ENV) => createCheckoutHandler({ env, ...deps(shop) });
const newsletter = (shop, env = { ...SHOPIFY_ENV }) => createNewsletterHandler({ env, ...deps(shop) });
const bookInstall = (shop, env = SHOPIFY_ENV) => createBookInstallHandler({ env, ...deps(shop) });

const CONTACT = Object.freeze({
  form: "contact",
  name: "Pat Lee",
  email: "pat@example.com",
  phone: "(954) 555-0100",
  message: "Do you have 225/45R17 in stock? See https://example.com/my-car.jpg",
  website: "",
  ft: HUMAN,
});

const ORDER = Object.freeze({
  items: [{ sku: "t-cont-truecontact-tour", qty: 4 }],
  delivery: "pickup",
  customer: { name: "Test Buyer", email: "buyer@example.com", phone: "954-555-0100" },
  notes: "Vehicle: 2019 Honda Civic",
  website: "",
  ft: HUMAN,
});

const BOOKING = Object.freeze({
  order: "#1002",
  email: "buyer@example.com",
  day: "2026-10-01",
  window: "8-10am",
  notes: "",
  website: "",
  ft: HUMAN,
});

/** No line of the log carries the visitor's name, email, phone or message. */
function assertNoPersonalData(lines) {
  for (const line of lines) {
    assert.doesNotMatch(line, /pat@|buyer@|Pat Lee|Test Buyer|555-0100|225\/45R17|203\.0\.113/, line);
  }
}

// ---- the token -----------------------------------------------------------------------

test("fill token: round-trips the elapsed time; forged, malformed or oversized tokens read as null", () => {
  const t = fillToken(1_700_000_000_000, 1_700_000_004_321);
  assert.deepEqual(readFillToken(t), { startedAt: 1_700_000_000_000, elapsedMs: 4321 });
  const [v, a, b, sum] = t.split(".");
  assert.equal(readFillToken([v, a, (99999).toString(36), sum].join(".")), null, "elapsed changed by hand");
  assert.equal(readFillToken([v, a, b, "zzzz"].join(".")), null, "checksum");
  assert.equal(readFillToken(["2", a, b, sum].join(".")), null, "version");
  for (const bad of [undefined, null, 42, "", "1.2.3", "1.-1.2.3", `${t}.x`, "1.".padEnd(80, "a")]) {
    assert.equal(readFillToken(bad), null, String(bad));
  }
  // A clock running backwards between render and submit reads as 0, not negative.
  assert.equal(readFillToken(fillToken(5000, 1000)).elapsedMs, 0);
});

test("fill token (browser side): guardFields sends the honeypot and how long the form was on screen", () => {
  const trap = { id: "contact-website", value: "" };
  const form = { elements: { namedItem: (n) => (n === "website" ? trap : null) } };
  noteFormStart("contact-website", 1_000_000);
  noteFormStart("contact-website", 1_005_000); // a re-render does not move the start
  const g = guardFields(form, 1_009_500);
  assert.equal(g.website, "");
  // The start may be pulled earlier to the page's own start, never later.
  assert.ok(readFillToken(g[FILL_TOKEN_FIELD]).elapsedMs >= 9500);
  trap.value = "http://spam.example";
  assert.equal(guardFields(form).website, "http://spam.example");
  // A form without a trap still sends a token (timed from the page's start).
  assert.ok(readFillToken(guardFields(null)[FILL_TOKEN_FIELD]));
});

// ---- the verdicts ------------------------------------------------------------------------

test("guard: honeypot, missing token, forged token and too fast, in that order", () => {
  const env = {};
  assert.deepEqual(inspectSubmission({ ft: HUMAN }, { env }), { verdict: "ok" });
  assert.deepEqual(inspectSubmission({ website: "x", ft: HUMAN }, { env }), { verdict: "bot", reason: "honeypot" });
  assert.deepEqual(inspectSubmission({ website: "x" }, { env }), { verdict: "bot", reason: "honeypot" });
  assert.deepEqual(inspectSubmission({ website: "  " }, { env }), { verdict: "stale" }, "whitespace is not a filled trap");
  assert.deepEqual(inspectSubmission({}, { env }), { verdict: "stale" });
  assert.deepEqual(inspectSubmission({ ft: "1.abc.def.ghi" }, { env }), { verdict: "bot", reason: "bad-token" });
  assert.deepEqual(inspectSubmission({ ft: shown(MIN_FILL_MS - 1) }, { env }), { verdict: "bot", reason: "too-fast", elapsedMs: MIN_FILL_MS - 1 });
  assert.deepEqual(inspectSubmission({ ft: shown(MIN_FILL_MS) }, { env }), { verdict: "ok" });
  // Not an object: left to the endpoint's own validator.
  assert.deepEqual(inspectSubmission(["x"], { env }), { verdict: "ok" });
});

test("guard: SPAM_GUARD_TEST_MODE drops the minimum time, but never in production", () => {
  assert.equal(MIN_FILL_MS, 2000);
  assert.equal(minFillMs({}), MIN_FILL_MS);
  assert.equal(minFillMs({ SPAM_GUARD_TEST_MODE: "1" }), 0);
  assert.equal(minFillMs({ SPAM_GUARD_TEST_MODE: "1", VERCEL_ENV: "preview" }), 0);
  assert.equal(minFillMs({ SPAM_GUARD_TEST_MODE: "1", VERCEL_ENV: "production" }), MIN_FILL_MS);
  assert.equal(minFillMs({ SPAM_GUARD_TEST_MODE: "true" }), MIN_FILL_MS, "only exactly 1");
  const fast = { ft: shown(150) };
  assert.equal(inspectSubmission(fast, { env: { SPAM_GUARD_TEST_MODE: "1" } }).verdict, "ok");
  assert.equal(inspectSubmission(fast, { env: { SPAM_GUARD_TEST_MODE: "1", VERCEL_ENV: "production" } }).verdict, "bot");
  // Test mode still wants a real token and an empty trap.
  assert.equal(inspectSubmission({}, { env: { SPAM_GUARD_TEST_MODE: "1" } }).verdict, "stale");
  assert.equal(inspectSubmission({ ...fast, website: "x" }, { env: { SPAM_GUARD_TEST_MODE: "1" } }).verdict, "bot");
});

test("content: conservative; links in names, link floods, link markup, spam phrase + link", () => {
  const ok = (c) => assert.equal(contentSpamReason(c), null, JSON.stringify(c));
  const spam = (c, reason) => assert.equal(contentSpamReason(c), reason, JSON.stringify(c));

  // What real customers write passes.
  ok({ names: ["Pat O'Neil-Lee", "José Núñez", "Dr. A. Smith Jr."], texts: ["225/45R17 x4, call after 5pm. My email is pat@example.com"] });
  ok({ names: ["Acme.com Fleet"], texts: [] }); // a bare domain is not a link
  ok({ names: ["Pat"], texts: ["Photos: https://a.test/1 https://a.test/2 www.a.test/3"] }); // MAX_LINKS links
  ok({ names: ["Pat"], texts: ["Is the casino exit near your shop? Tires for my SEO agency's van"] }); // phrase, no link
  ok({ names: [undefined, null, 42], texts: [{ nested: "https://x" }, ["https://y"]] }); // non-strings ignored

  spam({ names: ["Get rich https://spam.example"], texts: [] }, "link-in-name");
  spam({ names: ["www.cheap-seo.example"], texts: [] }, "link-in-name");
  spam({ names: ["Pat", '<a href="x">Pat</a>'], texts: [] }, "link-in-name");
  spam({ names: ["Pat"], texts: [Array.from({ length: MAX_LINKS + 1 }, (_, i) => `https://s${i}.example`).join(" ")] }, "too-many-links");
  spam({ names: ["Pat"], texts: ['Great site <a href="https://s.example">click</a>'] }, "link-markup");
  spam({ names: ["Pat"], texts: ["[url=https://s.example]tires[/url]"] }, "link-markup");
  spam({ names: ["Eric"], texts: ["We offer SEO services to rank you #1: https://s.example"] }, "spam-phrase");
  spam({ names: ["Eric"], texts: ["Buy backlinks", "www.s.example"] }, "spam-phrase");
});

// ---- /api/forms --------------------------------------------------------------------------

test("forms: honeypot, too fast, forged token and spam content all get { ok: true }, write nothing, and log no personal data", async () => {
  const cases = [
    [{ ...CONTACT, website: "https://spam.example" }, "honeypot"],
    [{ ...CONTACT, ft: shown(400) }, "too-fast"],
    [{ ...CONTACT, ft: "1.kfr9.2n9c.abcde" }, "bad-token"],
    [{ ...CONTACT, name: "https://spam.example" }, "link-in-name"],
    [{ ...CONTACT, message: "a https://1.x b https://2.x c https://3.x d https://4.x" }, "too-many-links"],
    [{ ...CONTACT, form: "fleet-quote", contact: "www.spam.example", name: undefined }, "link-in-name"],
  ];
  for (const [i, [body, reason]] of cases.entries()) {
    const shop = recordingShopify();
    const res = await post(forms(shop), body, { "x-forwarded-for": `198.51.100.${i}` });
    assert.equal(res.statusCode, 200, reason);
    assert.deepEqual(res.body, { ok: true }, reason);
    assert.deepEqual(shop.calls, [], `${reason}: nothing reaches Shopify`);
    assert.ok(logged.some((l) => l.startsWith(`[spam] blocked forms ${reason}`)), `${reason} logged`);
  }
  assert.ok(logged.some((l) => l === "[spam] blocked forms too-fast form=contact elapsedMs=400"));
  assertNoPersonalData(logged);
});

test("forms: a page without the token (loaded before the guard) is told to reload; nothing is stored", async () => {
  const shop = recordingShopify();
  const { ft: _ft, ...old } = CONTACT;
  const res = await post(forms(shop), old);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, STALE_PAGE);
  assert.deepEqual(shop.calls, []);
});

test("forms: a person who took a few seconds (or autofilled and checked) goes through; test mode lets a fast browser check through", async () => {
  const shop = recordingShopify();
  const res = await post(forms(shop), { ...CONTACT, ft: shown(MIN_FILL_MS + 1) });
  assert.deepEqual([res.statusCode, res.body], [200, { ok: true }]);
  assert.ok(shop.calls.includes("leadTagsAdd"), "recorded");

  const fast = recordingShopify();
  const res2 = await post(forms(fast, { ...SHOPIFY_ENV, SPAM_GUARD_TEST_MODE: "1" }), { ...CONTACT, ft: shown(300) }, { "x-forwarded-for": "198.51.100.40" });
  assert.equal(res2.statusCode, 200);
  assert.ok(fast.calls.includes("leadTagsAdd"), "recorded in test mode");

  const prod = recordingShopify();
  await post(forms(prod, { ...SHOPIFY_ENV, SPAM_GUARD_TEST_MODE: "1", VERCEL_ENV: "production" }), { ...CONTACT, ft: shown(300) }, { "x-forwarded-for": "198.51.100.41" });
  assert.deepEqual(prod.calls, [], "the flag does nothing in production");
});

test("forms: body over 16 KB is a 413, whether Vercel pre-parsed it, declared it, or streamed it", async () => {
  const shop = recordingShopify();
  const big = { ...CONTACT, padding: "x".repeat(BODY_LIMITS.forms) };
  const parsed = await post(forms(shop), big, { "x-forwarded-for": "198.51.100.50" });
  assert.equal(parsed.statusCode, 413);

  const declared = await post(forms(shop), CONTACT, { "x-forwarded-for": "198.51.100.51", "content-length": String(BODY_LIMITS.forms + 1) });
  assert.equal(declared.statusCode, 413);

  const stream = Readable.from([Buffer.from(JSON.stringify(big))]);
  stream.method = "POST";
  stream.headers = { "x-forwarded-for": "198.51.100.52" };
  const res = mockRes();
  await forms(shop)(stream, res);
  assert.equal(res.statusCode, 413);
  assert.deepEqual(shop.calls, []);

  // The largest real form fits easily.
  const longest = { ...CONTACT, message: "é".repeat(2000) };
  assert.equal((await post(forms(shop), longest, { "x-forwarded-for": "198.51.100.53" })).statusCode, 200);
});

test("readJsonBody: the default cap stays 32 KB; a smaller one applies to every kind of body", async () => {
  const body = { a: "x".repeat(3000) };
  assert.deepEqual(await readJsonBody({ body }), body);
  await assert.rejects(readJsonBody({ body }, { maxBytes: 2048 }), (e) => e.status === 413);
  await assert.rejects(readJsonBody({ body: JSON.stringify(body) }, { maxBytes: 2048 }), (e) => e.status === 413);
  await assert.rejects(readJsonBody({ headers: { "content-length": "999999" }, body: {} }), (e) => e.status === 413);
});

// ---- /api/checkout -----------------------------------------------------------------------

test("checkout: a bot gets a request answer that looks sent; nothing is priced, created or sent", async () => {
  for (const [i, body] of [
    { ...ORDER, website: "x" },
    { ...ORDER, ft: shown(100) },
    { ...ORDER, customer: { ...ORDER.customer, name: "http://spam.example" } },
    { ...ORDER, notes: "[url=https://s.example]cheap[/url]" },
  ].entries()) {
    const shop = recordingShopify();
    let atdCalls = 0;
    const handler = createCheckoutHandler({
      env: SHOPIFY_ENV,
      atd: { fetchImpl: async () => { atdCalls += 1; return Response.json([]); } },
      ...deps(shop),
    });
    const res = await post(handler, body, { "x-forwarded-for": `198.51.100.${60 + i}` });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.mode, "request");
    assert.equal(res.body.delivered, true);
    assert.equal(res.body.paid, false);
    assert.match(res.body.orderRef, /^TD-\d{6}-[A-Z2-9]{6}$/);
    assert.deepEqual(shop.calls, [], "no customer, no draft");
    assert.equal(atdCalls, 0, "not even priced");
  }
  assert.equal(logged.filter((l) => l.startsWith("[spam] blocked checkout")).length, 4);
  assertNoPersonalData(logged);
});

test("checkout: no token is a 400 asking for a reload; a real order still goes through", async () => {
  const shop = recordingShopify();
  const { ft: _ft, ...old } = ORDER;
  const stale = await post(checkout(shop), old);
  assert.deepEqual([stale.statusCode, stale.body.error], [400, STALE_PAGE]);
  assert.deepEqual(shop.calls, []);

  const res = await post(checkout(shop), ORDER);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.delivered, true);
  assert.ok(shop.calls.includes("draftOrderCreate"));
});

test("checkout: per-IP rate limit (429 with Retry-After), and a 16 KB body cap", async () => {
  const shop = recordingShopify();
  const handler = checkout(shop);
  for (let i = 0; i < CHECKOUT_RATE_LIMIT; i += 1) {
    assert.notEqual((await post(handler, { ...ORDER, delivery: "drone" })).statusCode, 429);
  }
  const limited = await post(handler, ORDER);
  assert.equal(limited.statusCode, 429);
  assert.equal(limited.headers["retry-after"], "600");
  assert.equal(logged.filter((l) => l === "[spam] rate-limited checkout").length, 1);
  assert.equal((await post(handler, ORDER, { "x-forwarded-for": "198.51.100.70" })).statusCode, 200, "another client is fine");

  const big = await post(handler, { ...ORDER, notes: "x".repeat(BODY_LIMITS.checkout) }, { "x-forwarded-for": "198.51.100.71" });
  assert.equal(big.statusCode, 413);
});

// ---- /api/newsletter ---------------------------------------------------------------------

test("newsletter: honeypot and too fast get { ok: true } with nothing sent; no token is a 400; 2 KB cap", async () => {
  const shop = recordingShopify();
  const h = newsletter(shop);
  const ip = (n) => ({ "x-forwarded-for": `198.51.100.${80 + n}` });
  assert.deepEqual((await post(h, { email: "pat@example.com", website: "x", ft: HUMAN }, ip(1))).body, { ok: true });
  assert.deepEqual((await post(h, { email: "pat@example.com", website: "", ft: shown(300) }, ip(2))).body, { ok: true });
  assert.deepEqual(shop.calls, []);
  const stale = await post(h, { email: "pat@example.com", website: "" }, ip(3));
  assert.deepEqual([stale.statusCode, stale.body.error], [400, STALE_PAGE]);
  const big = await post(h, { email: "pat@example.com", ft: HUMAN, pad: "x".repeat(BODY_LIMITS.newsletter) }, ip(4));
  assert.equal(big.statusCode, 413);
  assert.deepEqual(shop.calls, []);
  assert.deepEqual((await post(h, { email: "pat@example.com", website: "", ft: HUMAN }, ip(5))).body, { ok: true });
  assert.deepEqual(shop.calls, ["customerCreate"]);
  assertNoPersonalData(logged);
});

// ---- /api/book-install -------------------------------------------------------------------

test("book-install: a bot gets the usual 404 with nothing looked up; no token is a 400; own write limit", async () => {
  const shop = recordingShopify();
  const h = bookInstall(shop);
  const ip = (n) => ({ "x-forwarded-for": `198.51.100.${90 + n}` });
  for (const [n, body] of [
    { ...BOOKING, website: "x" },
    { ...BOOKING, ft: shown(10) },
    { ...BOOKING, notes: "<a href='https://s.example'>x</a>" },
  ].entries()) {
    const res = await post(h, body, ip(n));
    assert.equal(res.statusCode, 404);
    assert.match(res.body.error, /couldn't find a paid install order/);
  }
  assert.deepEqual(shop.calls, [], "the order is not even looked up");
  const stale = await post(h, { ...BOOKING, ft: undefined }, ip(5));
  assert.deepEqual([stale.statusCode, stale.body.error, stale.body.field], [400, STALE_PAGE, null]);
  const big = await post(h, { ...BOOKING, notes: "x".repeat(BODY_LIMITS["book-install"]) }, ip(6));
  assert.equal(big.statusCode, 413);

  // The write budget is per client and smaller than the shared lookup one.
  for (let i = 0; i < BOOK_INSTALL_RATE_LIMIT; i += 1) {
    assert.equal((await post(h, BOOKING, ip(7))).statusCode, 404);
  }
  assert.equal((await post(h, BOOKING, ip(7))).statusCode, 429);
  assert.ok(logged.includes("[spam] rate-limited book-install"));
  assertNoPersonalData(logged);
});

// ---- the forms' existing per-IP limit still holds with the guard in front ----------------

test("forms: blocked bots still use up the per-IP budget", async () => {
  const shop = recordingShopify();
  const h = forms(shop);
  for (let i = 0; i < 5; i += 1) await post(h, { ...CONTACT, website: "x" });
  const res = await post(h, CONTACT);
  assert.equal(res.statusCode, 429);
  assert.deepEqual(shop.calls, []);
});
