// Telegram order alerts (api/_lib/telegram.js + the orders/paid hook).
// Run with: npm run test:api. Telegram and Shopify are mocked; nothing real is called.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import { createShopifyWebhookHandler, resetWebhookDedupe } from "../webhooks/shopify.js";
import { deliveryLabel, formatOrderMessage, notifyPaidOrder, sendTelegram, telegramConfig } from "./telegram.js";

const TOKEN = "123456:SECRET-BOT-TOKEN";
const CHAT = "-1001234567890";
const WH = "whsec_test";
const ENV = { TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_CHAT_ID: CHAT };

const paid = (over = {}) => ({
  id: 8800123,
  name: "#1042",
  test: false,
  currency: "USD",
  current_total_price: "612.40",
  email: "buyer@example.com",
  phone: "+19545550100",
  tags: "",
  note_attributes: [{ name: "Delivery", value: "Ship to my address" }],
  shipping_lines: [{ title: "Free shipping" }],
  line_items: [{ title: "Michelin Pilot Sport 4S 245/40R18 <XL>", quantity: 4 }],
  shipping_address: {
    name: "Test Buyer", address1: "1 Main St", city: "Orlando", province_code: "FL", zip: "32801", phone: "+19545550100",
  },
  ...over,
});

const mockFetch = (status = 200) => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return new Response("{}", { status });
  };
  return { calls, fetchImpl };
};
const sink = () => {
  const lines = [];
  const push = (...a) => lines.push(a.join(" "));
  return { lines, log: { log: push, warn: push, error: push, info: push } };
};

beforeEach(() => resetWebhookDedupe());

test("telegram: config needs both the token and the chat id", () => {
  assert.deepEqual(telegramConfig(ENV), { token: TOKEN, chatId: CHAT });
  assert.equal(telegramConfig({ TELEGRAM_BOT_TOKEN: TOKEN }), null);
  assert.equal(telegramConfig({}), null);
});

test("telegram: the message has the order facts and none of the customer's personal data", () => {
  const text = formatOrderMessage(paid(), { shopDomain: "tiredrop-test.myshopify.com" });
  assert.match(text, /New TireDrop order #1042/);
  assert.match(text, /\$612\.40/);
  assert.match(text, /4 × Michelin Pilot Sport 4S 245\/40R18 &lt;XL&gt;/); // escaped for HTML mode
  assert.match(text, /Ships to customer/);
  assert.match(text, /Orlando, FL/);
  assert.match(text, /admin\.shopify\.com\/store\/tiredrop-test\/orders\/8800123/);
  for (const secret of ["Test Buyer", "buyer@example.com", "9545550100", "1 Main St", "32801"]) {
    assert.ok(!text.includes(secret), `leaked ${secret}`);
  }
});

test("telegram: install and mobile orders are labelled", () => {
  assert.equal(deliveryLabel(paid({ note_attributes: [], shipping_lines: [], line_items: [{ title: "Tire installation", quantity: 1 }] })), "Install at the shop / pickup");
  assert.equal(deliveryLabel(paid()), "Ships to customer");
});

test("telegram: off without config; on, it posts once and never logs the token", async () => {
  const off = await sendTelegram("hi", { env: {}, fetchImpl: () => assert.fail("must not call") });
  assert.deepEqual(off, { ok: false, skipped: "not-configured" });

  const m = mockFetch(200);
  const { lines, log } = sink();
  assert.deepEqual(await notifyPaidOrder(paid(), { env: ENV, fetchImpl: m.fetchImpl, log }), { ok: true });
  assert.equal(m.calls.length, 1);
  assert.ok(m.calls[0].url.startsWith(`https://api.telegram.org/bot${TOKEN}/sendMessage`));
  assert.equal(m.calls[0].body.chat_id, CHAT);

  const bad = mockFetch(401);
  const r = await notifyPaidOrder(paid(), { env: ENV, fetchImpl: bad.fetchImpl, log });
  assert.deepEqual(r, { ok: false, status: 401 });
  assert.ok(lines.length > 0 && lines.every((l) => !l.includes(TOKEN)), "token must not be logged");

  const boom = await notifyPaidOrder(paid(), { env: ENV, fetchImpl: async () => { throw new Error(`down ${TOKEN}`); }, log });
  assert.deepEqual(boom, { ok: false });
  assert.ok(lines.every((l) => !l.includes(TOKEN)));
});

function webhookDelivery(topic, payload, id) {
  const raw = JSON.stringify(payload);
  return new Request("https://tiredroponline.com/api/webhooks/shopify", {
    method: "POST",
    headers: {
      "x-shopify-topic": topic,
      "x-shopify-hmac-sha256": createHmac("sha256", WH).update(raw).digest("base64"),
      "x-shopify-webhook-id": id,
      "x-shopify-event-id": `e-${id}`,
      "x-shopify-shop-domain": "tiredrop-test.myshopify.com",
    },
    body: raw,
  });
}

const handlerWith = (env, m) =>
  createShopifyWebhookHandler({
    env: { SHOPIFY_STORE_DOMAIN: "tiredrop-test.myshopify.com", SHOPIFY_WEBHOOK_SECRET: WH, ...env },
    waitUntil: null,
    deps: { telegramFetch: m.fetchImpl, log: sink().log },
  });

test("webhook: orders/paid sends one alert even with ATD/Shopify unconfigured; a retry does not double-send", async () => {
  const m = mockFetch(200);
  const h = handlerWith(ENV, m);
  const a = await h(webhookDelivery("orders/paid", paid(), "w1"));
  assert.equal(a.status, 200);
  assert.equal(m.calls.length, 1);
  const b = await h(webhookDelivery("orders/paid", paid(), "w2")); // Shopify retry, new webhook id, same order
  assert.equal(b.status, 200);
  assert.equal(m.calls.length, 1);
});

test("webhook: other topics, and no Telegram config, send nothing and never fail the delivery", async () => {
  const m = mockFetch(200);
  assert.equal((await handlerWith(ENV, m)(webhookDelivery("orders/cancelled", paid(), "w3"))).status, 200);
  assert.equal(m.calls.length, 0);
  assert.equal((await handlerWith({}, m)(webhookDelivery("orders/paid", paid({ id: 9 }), "w4"))).status, 200);
  assert.equal(m.calls.length, 0);
  const failing = mockFetch(500);
  assert.equal((await handlerWith(ENV, failing)(webhookDelivery("orders/paid", paid({ id: 10 }), "w5"))).status, 200);
});
