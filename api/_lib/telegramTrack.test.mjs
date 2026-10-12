// Telegram order tracking (api/_lib/telegramTrack.js + api/webhooks/telegram.js).
// Run with: npm run test:api. Shopify is mocked; nothing real is called.

import { test } from "node:test";
import assert from "node:assert/strict";

import { createTelegramWebhookHandler } from "./telegramWebhook.js";
import { extractLookup, formatTrackReply, NOT_FOUND_TEXT } from "./telegramTrack.js";
import { createRateLimiter } from "./ratelimit.js";

const SECRET = "tg_webhook_secret_value";
const ENV = {
  TELEGRAM_WEBHOOK_SECRET: SECRET,
  SHOPIFY_STORE_DOMAIN: "tiredrop-test.myshopify.com",
  SHOPIFY_CLIENT_ID: "client-id",
  SHOPIFY_CLIENT_SECRET: "shpss_secret",
};

const orderNode = (over = {}) => ({
  id: "gid://shopify/Order/1",
  name: "#1042",
  createdAt: "2026-10-10T14:00:00Z",
  email: "buyer@example.com",
  note: "",
  cancelledAt: null,
  displayFinancialStatus: "PAID",
  displayFulfillmentStatus: "FULFILLED",
  tags: ["ship-to-home", "atd-submitted"],
  customAttributes: [{ key: "Delivery", value: "Ship to my address" }],
  shippingLine: { title: "Free shipping" },
  lineItems: { nodes: [{ title: "Michelin Pilot Sport 4S 245/40R18", quantity: 4, currentQuantity: 4 }] },
  fulfillments: [{ trackingInfo: [{ company: "UPS", number: "1Z999AA10123456784", url: "https://www.ups.com/track?tracknum=1Z999AA10123456784" }] }],
  installBooking: null,
  ...over,
});

function shopifyWith(nodes) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    if (String(url).endsWith("/admin/oauth/access_token")) {
      return Response.json({ access_token: "shpat_x", expires_in: 86399 });
    }
    calls.push(JSON.parse(init.body).variables);
    return Response.json({ data: { orders: { nodes } } });
  };
  return { calls, shopify: { fetchImpl, retryDelayMs: 0 } };
}

const quiet = () => ({ log: () => {}, warn: () => {}, error: () => {}, info: () => {} });
const update = (text, chat = { id: 777, type: "private" }) => ({ update_id: 1, message: { message_id: 1, chat, text } });
const req = (body, secret = SECRET) =>
  new Request("https://tiredroponline.com/api/webhooks/telegram", {
    method: "POST",
    headers: { "content-type": "application/json", ...(secret == null ? {} : { "x-telegram-bot-api-secret-token": secret }) },
    body: JSON.stringify(body),
  });
const handler = (nodes = [orderNode()], extra = {}) => {
  const s = shopifyWith(nodes);
  return {
    s,
    h: createTelegramWebhookHandler({
      env: { ...ENV, ...extra.env },
      deps: { shopify: s.shopify, log: quiet(), limiter: extra.limiter ?? createRateLimiter({ limit: 10, windowMs: 600000 }) },
    }),
  };
};

test("telegram-track: pulls an order number and an email out of free text", () => {
  assert.deepEqual(extractLookup("#1042 Buyer@Example.com"), {
    lookup: { kind: "order", name: "#1042" },
    email: "buyer@example.com",
  });
  assert.equal(extractLookup("order 1042 buyer@example.com").lookup.name, "#1042");
  assert.equal(extractLookup("my order is 1042").missing, "email");
  assert.equal(extractLookup("buyer@example.com").missing, "order");
  assert.equal(extractLookup("hello there").missing, "both");
});

test("telegram-track: wrong or missing secret is a 401 and nothing is looked up", async () => {
  const { h, s } = handler();
  assert.equal((await h(req(update("#1042 buyer@example.com"), "nope"))).status, 401);
  assert.equal((await h(req(update("#1042 buyer@example.com"), null))).status, 401);
  assert.equal(s.calls.length, 0);
  const off = createTelegramWebhookHandler({ env: { ...ENV, TELEGRAM_WEBHOOK_SECRET: "" }, deps: { log: quiet() } });
  assert.equal((await off(req(update("hi")))).status, 503);
});

test("telegram-track: matching order and email gets the public view, with no private data", async () => {
  const { h } = handler();
  const res = await h(req(update("#1042 buyer@example.com")));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.method, "sendMessage");
  assert.equal(body.chat_id, 777);
  assert.equal(body.parse_mode, "HTML");
  assert.match(body.text, /Order #1042/);
  assert.match(body.text, /Paid/);
  assert.match(body.text, /Shipped/);
  assert.match(body.text, /4 × Michelin Pilot Sport 4S 245\/40R18/);
  assert.match(body.text, /1Z999AA10123456784/);
  assert.ok(!/supplier/i.test(body.text), "supplier line is for orders that have not shipped yet");
  assert.ok(!/\$\d|buyer@example\.com|Main St/.test(body.text));
});

test("telegram-track: an unshipped order shows where the tires are with the supplier", async () => {
  const { h } = handler([orderNode({ displayFulfillmentStatus: "UNFULFILLED", fulfillments: [], tags: ["ship-to-home", "atd-inbound-to-store"] })]);
  const body = await (await h(req(update("1042 buyer@example.com")))).json();
  assert.match(body.text, /Being prepared/);
  assert.match(body.text, /on their way to our shop/);
});

test("telegram-track: wrong email, unknown order and Shopify errors all read the same, safely", async () => {
  const wrong = await handler().h(req(update("#1042 someone@else.com")));
  assert.equal((await wrong.json()).text, NOT_FOUND_TEXT);
  const none = await handler([]).h(req(update("#9999 buyer@example.com")));
  assert.equal((await none.json()).text, NOT_FOUND_TEXT);
  const broken = createTelegramWebhookHandler({
    env: ENV,
    deps: { shopify: { fetchImpl: async () => new Response("boom", { status: 500 }), retryDelayMs: 0 }, log: quiet(), limiter: createRateLimiter({ limit: 10, windowMs: 1000 }) },
  });
  const r = await broken(req(update("#1042 buyer@example.com")));
  assert.equal(r.status, 200);
  assert.match((await r.json()).text, /couldn't look that up/);
});

test("telegram-track: groups are ignored, help is answered, and lookups are rate limited per chat", async () => {
  const { h } = handler();
  assert.deepEqual(await (await h(req(update("#1042 buyer@example.com", { id: -5, type: "group" })))).json(), {});
  assert.match((await (await h(req(update("/start")))).json()).text, /order bot/i);
  assert.match((await (await h(req(update("hello")))).json()).text, /order bot/i);
  const limiter = createRateLimiter({ limit: 2, windowMs: 600000 });
  const { h: h2 } = handler([orderNode()], { limiter });
  for (let i = 0; i < 2; i++) await h2(req(update("#1042 buyer@example.com")));
  assert.match((await (await h2(req(update("#1042 buyer@example.com")))).json()).text, /lot of lookups/);
});

test("telegram-track: cancelled orders and unpaid requests are worded honestly", () => {
  const cancelled = formatTrackReply({ kind: "order", order: { name: "#7", cancelled: true, financialStatus: "refunded", fulfillmentStatus: "unfulfilled", delivery: "ship", lines: [], tracking: [], supplier: null } });
  assert.match(cancelled, /cancelled/);
  assert.ok(!/Paid|Being prepared/.test(cancelled));
  const request = formatTrackReply({ kind: "request", request: { ref: "TD-261010-ABC234", status: "open", orderName: null, lines: [{ title: "Tire", quantity: 4 }] } });
  assert.match(request, /Request received/);
});

test("telegram-track: /api/webhooks/shopify?src=telegram is handed to the Telegram handler", async () => {
  const { POST } = await import("../webhooks/shopify.js");
  const prev = process.env.TELEGRAM_WEBHOOK_SECRET;
  process.env.TELEGRAM_WEBHOOK_SECRET = SECRET;
  try {
    const bad = await POST(new Request("https://tiredroponline.com/api/webhooks/shopify?src=telegram", { method: "POST", headers: { "x-telegram-bot-api-secret-token": "wrong" }, body: "{}" }));
    assert.equal(bad.status, 401);
    assert.deepEqual(await bad.json(), { error: "Unauthorized." });
    const hello = await POST(new Request("https://tiredroponline.com/api/webhooks/shopify?src=telegram", { method: "POST", headers: { "x-telegram-bot-api-secret-token": SECRET }, body: JSON.stringify(update("/help")) }));
    assert.equal((await hello.json()).method, "sendMessage");
  } finally {
    if (prev === undefined) delete process.env.TELEGRAM_WEBHOOK_SECRET;
    else process.env.TELEGRAM_WEBHOOK_SECRET = prev;
  }
});
