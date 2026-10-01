// POST /api/newsletter, with Shopify mocked. Run with: npm run test:api

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { createNewsletterHandler } from "../newsletter.js";
import { fillToken } from "../../src/data/formGuard.js";
import { statusBody } from "../status.js";
import { getConfig } from "./config.js";
import { clearShopifyTokenCache } from "./shopify.js";
import {
  CUSTOMER_BY_EMAIL,
  CUSTOMER_CREATE,
  EMAIL_CONSENT_UPDATE,
  RATE_LIMIT,
  TAGS_ADD,
  resetNewsletterRateLimit,
} from "./newsletter.js";

const SHOPIFY_ENV = Object.freeze({
  SHOPIFY_STORE_DOMAIN: "tiredrop-test.myshopify.com",
  SHOPIFY_ADMIN_TOKEN: "shpat_test_token",
});
const CUSTOMER_ID = "gid://shopify/Customer/42";
const SUBSCRIBED = { marketingState: "SUBSCRIBED", marketingOptInLevel: "SINGLE_OPT_IN" };

let savedError;
let errors;
beforeEach(() => {
  resetNewsletterRateLimit();
  clearShopifyTokenCache();
  savedError = console.error;
  errors = [];
  console.error = (...args) => errors.push(args.join(" "));
});
afterEach(() => {
  console.error = savedError;
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

// What a real page sends with every form: the fill-time token of a form that
// was on screen for 8 seconds (src/data/formGuard.js). A test that sends its
// own `ft` (or none) keeps it.
const withFillToken = (body) =>
  body && typeof body === "object" && !Array.isArray(body) && !("ft" in body)
    ? { ...body, ft: fillToken(1_000_000, 1_008_000) }
    : body;

async function post(handler, body, headers = {}) {
  const res = mockRes();
  await handler({ method: "POST", headers, body: withFillToken(body) }, res);
  return res;
}

/**
 * A Shopify Admin endpoint that answers each operation from `replies`, keyed
 * by the query text. Records every call.
 */
function mockShopify(replies) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url: String(url), query: body.query, variables: body.variables });
    const reply = replies[body.query];
    if (!reply) throw new Error(`unexpected operation: ${body.query.slice(0, 40)}`);
    return Response.json(typeof reply === "function" ? reply(body.variables) : reply);
  };
  return { calls, deps: { fetchImpl, retryDelayMs: 0 } };
}

const created = { data: { customerCreate: { customer: { id: CUSTOMER_ID }, userErrors: [] } } };
const taken = {
  data: {
    customerCreate: {
      customer: null,
      userErrors: [{ field: ["email"], message: "Email has already been taken" }],
    },
  },
};

const liveHandler = (deps) => createNewsletterHandler({ env: { ...SHOPIFY_ENV }, shopify: deps });

test("newsletter: a new email becomes a subscribed customer tagged newsletter, popup, vercel", async () => {
  const { calls, deps } = mockShopify({ [CUSTOMER_CREATE]: created });
  const res = await post(liveHandler(deps), { email: "  New@Example.com ", source: "popup" });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
  assert.equal(res.headers["cache-control"], "no-store");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://tiredrop-test.myshopify.com/admin/api/2026-07/graphql.json");
  assert.deepEqual(calls[0].variables, {
    input: {
      email: "new@example.com",
      emailMarketingConsent: SUBSCRIBED,
      tags: ["newsletter", "popup", "vercel"],
    },
  });
});

test("newsletter: an existing customer is found by email, subscribed and tagged", async () => {
  const { calls, deps } = mockShopify({
    [CUSTOMER_CREATE]: taken,
    [CUSTOMER_BY_EMAIL]: {
      data: { customer: { id: CUSTOMER_ID, defaultEmailAddress: { marketingState: "UNSUBSCRIBED" } } },
    },
    [EMAIL_CONSENT_UPDATE]: {
      data: { customerEmailMarketingConsentUpdate: { customer: { id: CUSTOMER_ID }, userErrors: [] } },
    },
    [TAGS_ADD]: { data: { tagsAdd: { node: { id: CUSTOMER_ID }, userErrors: [] } } },
  });
  const res = await post(liveHandler(deps), { email: "known@example.com" });

  assert.equal(res.statusCode, 200);
  // Same answer as a new sign-up: the endpoint does not reveal accounts.
  assert.deepEqual(res.body, { ok: true });
  assert.deepEqual(calls.map((c) => c.query), [
    CUSTOMER_CREATE,
    CUSTOMER_BY_EMAIL,
    EMAIL_CONSENT_UPDATE,
    TAGS_ADD,
  ]);
  assert.deepEqual(calls[1].variables, { identifier: { emailAddress: "known@example.com" } });
  assert.deepEqual(calls[2].variables, {
    input: { customerId: CUSTOMER_ID, emailMarketingConsent: SUBSCRIBED },
  });
  assert.deepEqual(calls[3].variables, { id: CUSTOMER_ID, tags: ["newsletter", "popup", "vercel"] });
});

test("newsletter: an already-subscribed customer keeps its consent and only gains the tags", async () => {
  const { calls, deps } = mockShopify({
    [CUSTOMER_CREATE]: taken,
    [CUSTOMER_BY_EMAIL]: {
      data: { customer: { id: CUSTOMER_ID, defaultEmailAddress: { marketingState: "SUBSCRIBED" } } },
    },
    [TAGS_ADD]: { data: { tagsAdd: { node: { id: CUSTOMER_ID }, userErrors: [] } } },
  });
  const res = await post(liveHandler(deps), { email: "known@example.com" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(calls.map((c) => c.query), [CUSTOMER_CREATE, CUSTOMER_BY_EMAIL, TAGS_ADD]);
});

test("newsletter: an invalid email is a 400 and Shopify is never called", async () => {
  const { calls, deps } = mockShopify({});
  const handler = liveHandler(deps);
  for (const email of ["", "not-an-email", "a@b", "x".repeat(250) + "@example.com"]) {
    const res = await post(handler, { email });
    assert.equal(res.statusCode, 400, email);
    assert.equal(typeof res.body.error, "string");
  }
  const badSource = await post(handler, { email: "ok@example.com", source: "admin" });
  assert.equal(badSource.statusCode, 400);
  assert.equal(calls.length, 0);
});

test("newsletter: a filled honeypot looks like success but sends nothing", async () => {
  const { calls, deps } = mockShopify({});
  const res = await post(liveHandler(deps), {
    email: "bot@example.com",
    website: "https://spam.example",
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
  assert.equal(calls.length, 0);
});

test("newsletter: with Shopify unconfigured it answers 503 { configured: false }", async () => {
  let called = false;
  const handler = createNewsletterHandler({
    env: {},
    shopify: { fetchImpl: async () => { called = true; return Response.json({}); } },
  });
  const res = await post(handler, { email: "someone@example.com" });
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.configured, false);
  assert.equal(called, false);

  // Half-configured Shopify is not "configured" either.
  const half = createNewsletterHandler({ env: { SHOPIFY_STORE_DOMAIN: "x.myshopify.com" } });
  const res2 = await post(half, { email: "someone@example.com" });
  assert.equal(res2.statusCode, 503);
  assert.equal(res2.body.configured, false);
});

test("newsletter: /api/status reports on only when Shopify is fully configured", () => {
  assert.equal(statusBody(getConfig({})).newsletter, "off");
  assert.equal(statusBody(getConfig({ SHOPIFY_STORE_DOMAIN: "x.myshopify.com" })).newsletter, "off");
  assert.equal(statusBody(getConfig({ ...SHOPIFY_ENV })).newsletter, "on");
});

test("newsletter: Shopify refusing is a 502 with a plain message, details only in the log", async () => {
  const { deps } = mockShopify({
    [CUSTOMER_CREATE]: {
      data: { customerCreate: { customer: null, userErrors: [{ field: ["email"], message: "Email is invalid" }] } },
    },
  });
  const res = await post(liveHandler(deps), { email: "odd@example.com" });
  assert.equal(res.statusCode, 502);
  assert.doesNotMatch(res.body.error, /Shopify/);
  assert.ok(errors.some((e) => /Email is invalid/.test(e)));
});

test("newsletter: repeated attempts from one IP are rate-limited with a 429", async () => {
  const { deps } = mockShopify({ [CUSTOMER_CREATE]: created });
  const handler = liveHandler(deps);
  const headers = { "x-forwarded-for": "203.0.113.9, 10.0.0.1" };
  for (let i = 0; i < RATE_LIMIT; i += 1) {
    const ok = await post(handler, { email: `n${i}@example.com` }, headers);
    assert.equal(ok.statusCode, 200);
  }
  const limited = await post(handler, { email: "again@example.com" }, headers);
  assert.equal(limited.statusCode, 429);
  // Another client is unaffected.
  const other = await post(handler, { email: "other@example.com" }, { "x-forwarded-for": "198.51.100.7" });
  assert.equal(other.statusCode, 200);
});

test("newsletter: only POST", async () => {
  const res = mockRes();
  await liveHandler({})({ method: "GET", headers: {} }, res);
  assert.equal(res.statusCode, 405);
});
