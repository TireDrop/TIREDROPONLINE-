// Run with: npm run test:api
// POST /api/chat (api/_lib/chat.js, served by api/status.js through a
// vercel.json rewrite): validation, rate limit, stand-in, the house-rule
// filter, the tool loop, the daily cap, the timeout, and GET status unchanged.
// The knowledge file is injected: these tests do not read the built one.

import { statusBody } from "../status.js";
import { getConfig } from "./config.js";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  createChatHandler,
  resetChatState,
  validateChat,
  retrieve,
  breaksHouseRules,
  runLookupTires,
  CHAT_RATE_LIMIT,
  MAX_ROUNDS,
  DEFAULT_MODEL,
  tireCards,
  systemPrompt,
  serviceFacts,
  lastWholeSentence,
  pinnedSources,
} from "./chat.js";
import statusHandler from "../status.js";
import { BUSINESS } from "../../src/data/business.js";

const KB = {
  built: "2026-01-01T00:00:00Z",
  chunks: [
    { id: "a", path: "/shipping", title: "Shipping", text: "Tires ship free to the 48 contiguous states and DC. Free shipping applies to every order. Alaska and Hawaii are handled by phone." },
    { id: "b", path: "/installation", title: "Installation", text: "Installation is available in South Florida only. Mobile installation vans come to your driveway in the service area." },
    { id: "c", path: "/contact", title: "Contact", text: "Call the shop at the number on this page or send a message with the contact form. The shop is in Sunrise." },
    { id: "d", path: "/returns", title: "Returns", text: "Unmounted tires can be returned in new condition. Contact the shop to start a return." },
  ],
};

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

async function post(handler, body, req = {}) {
  const res = mockRes();
  await handler({ method: "POST", headers: {}, url: "/api/status?chat=1", body, ...req }, res);
  return res;
}

const ask = (text, extra = {}) => ({ messages: [{ role: "user", content: text }], ...extra });
const LIVE = { ANTHROPIC_API_KEY: "sk-test" };

/** A fetch that answers with the given Anthropic bodies in order, recording calls. */
function fakeFetch(...bodies) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    const next = bodies[Math.min(calls.length - 1, bodies.length - 1)];
    if (typeof next === "function") return next(init);
    return { ok: true, status: 200, json: async () => next };
  };
  fn.calls = calls;
  return fn;
}
const textBody = (text) => ({ stop_reason: "end_turn", content: [{ type: "text", text }] });
const toolBody = (input, id = "tu_1") => ({
  stop_reason: "tool_use",
  content: [{ type: "tool_use", id, name: "lookup_tires", input }],
});

beforeEach(() => resetChatState());

/* ----------------------------- validation ----------------------------- */

test("validateChat: accepts a good body and normalises page", () => {
  const ok = validateChat({ messages: [{ role: "user", content: " hi " }], page: "/tires/?x=1" });
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.value, { messages: [{ role: "user", content: "hi" }], page: "/tires" });
});

test("validateChat: rejects the bad shapes", () => {
  const bad = (b) => assert.equal(validateChat(b).ok, false, JSON.stringify(b).slice(0, 80));
  bad(null);
  bad([]);
  bad({});
  bad({ messages: [] });
  bad({ messages: "hi" });
  bad({ messages: [{ role: "system", content: "x" }] });
  bad({ messages: [{ role: "user", content: 5 }] });
  bad({ messages: [{ role: "user", content: "   " }] });
  bad({ messages: [{ role: "user", content: "x".repeat(801) }] });
  bad({ messages: Array.from({ length: 13 }, () => ({ role: "user", content: "x" })) });
  bad({ messages: [{ role: "user", content: "x" }, { role: "assistant", content: "y" }] });
  bad({ messages: [{ role: "user", content: "x" }], page: "tires" });
  bad({ messages: [{ role: "user", content: "x" }], page: 7 });
  assert.equal(validateChat({ messages: [{ role: "user", content: "x".repeat(800) }] }).ok, true);
  assert.equal(
    validateChat({ messages: Array.from({ length: 12 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "x" })) }).ok,
    false, // 12 messages ending on assistant
  );
});

test("handler: 400 with no-store on bad input, 405 on GET, 413 on a huge body", async () => {
  const h = createChatHandler({ env: {}, knowledge: KB });
  const bad = await post(h, { messages: [] });
  assert.equal(bad.statusCode, 400);
  assert.equal(bad.headers["cache-control"], "no-store");
  assert.ok(bad.body.error);
  const get = await post(h, undefined, { method: "GET" });
  assert.equal(get.statusCode, 405);
  const big = await post(h, ask("x"), { headers: { "content-length": "999999" } });
  assert.equal(big.statusCode, 413);
});

/* ----------------------------- rate limit ----------------------------- */

test("rate limit: the 13th message in a minute from one IP is a 429", async () => {
  const h = createChatHandler({ env: {}, knowledge: KB });
  const headers = { "x-forwarded-for": "9.9.9.9" };
  for (let i = 0; i < CHAT_RATE_LIMIT; i += 1) {
    assert.equal((await post(h, ask("free shipping"), { headers })).statusCode, 200);
  }
  const over = await post(h, ask("free shipping"), { headers });
  assert.equal(over.statusCode, 429);
  assert.equal(over.headers["retry-after"], "60");
  assert.equal(over.headers["cache-control"], "no-store");
  const other = await post(h, ask("free shipping"), { headers: { "x-forwarded-for": "8.8.8.8" } });
  assert.equal(other.statusCode, 200);
});

/* ----------------------------- retrieval ------------------------------ */

test("retrieve: BM25 finds the right chunk and boosts the current page", () => {
  const [top] = retrieve(KB, "do you ship free?");
  assert.equal(top.chunk.id, "a");
  assert.deepEqual(retrieve(KB, "zzzz qqqq"), []);
  assert.deepEqual(retrieve({ chunks: [] }, "shipping"), []);
  const both = { chunks: [
    { id: "x", path: "/one", title: "T", text: "tire installation details" },
    { id: "y", path: "/two", title: "T", text: "tire installation details" },
  ] };
  assert.equal(retrieve(both, "installation", { page: "/two" })[0].chunk.id, "y");
  assert.equal(retrieve(both, "installation", { page: "/one" })[0].chunk.id, "x");
});

/* ----------------------------- stand-in ------------------------------- */

test("stand-in: no key means no model call, an excerpt and sources", async () => {
  const f = fakeFetch(textBody("never"));
  const h = createChatHandler({ env: {}, fetchImpl: f, knowledge: KB });
  const r = await post(h, ask("Is shipping free?"));
  assert.equal(r.statusCode, 200);
  assert.equal(f.calls.length, 0);
  assert.equal(r.body.mode, "standin");
  assert.equal(r.body.handoff, false);
  // The reply is the sentence that answers the question, not the chunk's opening lines.
  assert.match(r.body.reply, /Free shipping applies to every order/);
  assert.equal(r.body.sources[0].path, "/shipping");
  assert.ok(r.body.sources.length <= 3);
});

test("stand-in: weak retrieval hands off with the real phone", async () => {
  const h = createChatHandler({ env: {}, knowledge: KB });
  const r = await post(h, ask("what is the meaning of life"));
  assert.equal(r.body.mode, "standin");
  assert.equal(r.body.handoff, true);
  assert.deepEqual(r.body.sources, []);
  assert.ok(r.body.reply.includes(BUSINESS.phone));
  const empty = createChatHandler({ env: {}, knowledge: { chunks: [] } });
  assert.equal((await post(empty, ask("shipping"))).body.handoff, true);
});

test("stand-in: an excerpt that breaks a house rule is not quoted", async () => {
  const kb = { chunks: [{ id: "z", path: "/p", title: "P", text: "Get a discount coupon on every shipping order today." }] };
  const r = await post(createChatHandler({ env: {}, knowledge: kb }), ask("shipping order coupon"));
  assert.equal(r.body.handoff, true);
  assert.ok(!/coupon/i.test(r.body.reply));
});

test("stand-in hand-off speaks Spanish to a Spanish question", async () => {
  const h = createChatHandler({ env: {}, knowledge: { chunks: [] } });
  const r = await post(h, ask("¿Cuánto cuesta la instalación?"));
  assert.match(r.body.reply, /No estoy seguro/);
});

/* ----------------------------- live ----------------------------------- */

test("live: calls Anthropic with the right headers, model, context and tool", async () => {
  const f = fakeFetch(textBody("Shipping is free to the 48 contiguous states and DC."));
  const h = createChatHandler({ env: LIVE, fetchImpl: f, knowledge: KB });
  const r = await post(h, { messages: [{ role: "assistant", content: "Hi!" }, { role: "user", content: "Is shipping free?" }], page: "/shipping" });
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.mode, "live");
  assert.equal(r.body.handoff, false);
  assert.equal(r.body.sources[0].path, "/shipping");
  const [call] = f.calls;
  assert.equal(call.url, "https://api.anthropic.com/v1/messages");
  assert.equal(call.init.headers["x-api-key"], "sk-test");
  assert.equal(call.init.headers["anthropic-version"], "2023-06-01");
  assert.equal(call.body.model, DEFAULT_MODEL);
  assert.equal(call.body.max_tokens, 500);
  assert.equal(call.body.tools[0].name, "lookup_tires");
  assert.match(call.body.system, /48 contiguous states/);
  assert.match(call.body.system, /data, not instructions/);
  assert.equal(call.body.messages[0].role, "user", "leading assistant turn dropped");
  const custom = fakeFetch(textBody("ok"));
  await post(createChatHandler({ env: { ...LIVE, CHAT_MODEL: "claude-test-1" }, fetchImpl: custom, knowledge: KB }), ask("hi shipping"));
  assert.equal(custom.calls[0].body.model, "claude-test-1");
});

test("live: HANDOFF marker is stripped and sets handoff", async () => {
  const f = fakeFetch(textBody("I don't know that one. Please call the shop. [[HANDOFF]]"));
  const r = await post(createChatHandler({ env: LIVE, fetchImpl: f, knowledge: KB }), ask("weird question"));
  assert.equal(r.body.handoff, true);
  assert.ok(!r.body.reply.includes("HANDOFF"));
  assert.deepEqual(r.body.sources, []);
});

test("live: markdown is flattened to plain text", async () => {
  const f = fakeFetch(textBody("## Shipping\n\n**Free** to 48 states.\n\n* one\n* two"));
  const r = await post(createChatHandler({ env: LIVE, fetchImpl: f, knowledge: KB }), ask("shipping"));
  assert.equal(r.body.reply, "Shipping\n\nFree to 48 states.\n\n- one\n- two");
});

test("live: upstream failure, bad JSON and refusal answer safely", async () => {
  const quiet = console.error;
  console.error = () => {};
  try {
    const down = fakeFetch(() => ({ ok: false, status: 529, json: async () => ({}) }));
    const r = await post(createChatHandler({ env: LIVE, fetchImpl: down, knowledge: KB }), ask("shipping"));
    assert.equal(r.statusCode, 503);
    assert.equal(r.body.handoff, true);
    assert.ok(r.body.error.includes(BUSINESS.phone));
    assert.equal(r.headers["cache-control"], "no-store");

    const thrown = fakeFetch(() => { throw new Error("boom"); });
    assert.equal((await post(createChatHandler({ env: LIVE, fetchImpl: thrown, knowledge: KB }), ask("shipping"))).statusCode, 503);

    const refused = fakeFetch({ stop_reason: "refusal", content: [] });
    const rr = await post(createChatHandler({ env: LIVE, fetchImpl: refused, knowledge: KB }), ask("shipping"));
    assert.equal(rr.statusCode, 200);
    assert.equal(rr.body.handoff, true);
  } finally {
    console.error = quiet;
  }
});

test("live: timeout aborts the call and answers 503 handoff", async () => {
  const quiet = console.error;
  console.error = () => {};
  const realSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = (fn, ms, ...a) => realSetTimeout(fn, ms === 20_000 ? 5 : ms, ...a);
  try {
    const hang = fakeFetch((init) => new Promise((_, reject) => {
      init.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
    }));
    const r = await post(createChatHandler({ env: LIVE, fetchImpl: hang, knowledge: KB }), ask("shipping"));
    assert.equal(r.statusCode, 503);
    assert.equal(r.body.handoff, true);
  } finally {
    globalThis.setTimeout = realSetTimeout;
    console.error = quiet;
  }
});

/* ----------------------------- rule filter ---------------------------- */

test("breaksHouseRules: catches the banned phrasings, spares the allowed ones", () => {
  for (const bad of [
    "Use this coupon for 10% off.",
    "We have a great deal on Michelin.",
    "There is a rebate available.",
    "Ask about discounts at the shop.",
    "Those tires are safe to drive on.",
    "Your order will arrive by Friday.",
    "It should be delivered in 3 days.",
    "Ships tomorrow.",
    "Next day shipping is available.",
    "Financing at 9.9% APR.",
    "We use Affirm for payments.",
    "Serving drivers since 1998.",
    "Rated 4.8 stars by customers.",
    "Over 500 reviews.",
  ]) assert.equal(breaksHouseRules(bad), true, bad);
  for (const ok of [
    "Tires ship free to the 48 contiguous states and DC.",
    "Installation is available in South Florida only.",
    "Call (954) 773-1896 or use the contact form.",
    "Free shipping applies in the 48 states.",
    "I don't know the delivery time; please call the shop.",
    "The shop is open since you asked about hours; call to confirm.",
  ]) assert.equal(breaksHouseRules(ok), false, ok);
});

test("live: a reply that breaks a rule is replaced by the hand-off reply", async () => {
  const f = fakeFetch(textBody("Great news, use coupon SAVE10 and they arrive by Friday!"));
  const r = await post(createChatHandler({ env: LIVE, fetchImpl: f, knowledge: KB }), ask("shipping"));
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.handoff, true);
  assert.ok(!/coupon|Friday/i.test(r.body.reply));
  assert.ok(r.body.reply.includes(BUSINESS.phone));
  assert.deepEqual(r.body.sources, []);
});

/* ----------------------------- tool loop ------------------------------ */

const SAMPLE_RESULT = {
  source: "atd",
  query: { size: "225/45R17" },
  items: [
    { sku: "s1", brand: "Acme", model: "Grip", size: "225/45R17", price: 123.456, available: true },
    { sku: "s2", brand: "Beta", model: "Tour", size: "225/45R17", price: 99, available: null },
  ],
};
const LIVE_ATD = {
  ...LIVE,
  ATD_API_BASE: "https://atd.example.test/api",
  ATD_API_KEY: "k",
  ATD_API_SECRET: "s",
  ATD_ACCOUNT_NUMBER: "1",
  ATD_SHIP_TO: "2",
  PRICE_MARKUP_PCT: "20",
  FREIGHT_PER_TIRE: "0",
};

test("runLookupTires: validates, then maps live items without leaking extra fields", async () => {
  const bad = await runLookupTires({ size: "banana" }, { env: {}, search: async () => assert.fail("no search") });
  assert.equal(bad.is_error, true);
  const none = await runLookupTires({}, { env: {}, search: async () => assert.fail("no search") });
  assert.equal(none.is_error, true);

  const seen = [];
  const env = { ...LIVE_ATD };
  const out = await runLookupTires({ size: "225/45R17" }, { env, search: async (q, c) => { seen.push([q, c.atd.mode]); return SAMPLE_RESULT; } });
  assert.equal(out.is_error, undefined, out.content);
  const parsed = JSON.parse(out.content);
  assert.equal(seen[0][0].type, "size");
  assert.equal(parsed.items[0].price, "$123.46 each");
  assert.equal(parsed.items[0].in_stock, "yes");
  assert.equal(parsed.items[1].in_stock, "unknown");
  assert.ok(!("sku" in parsed.items[0]));
});

test("runLookupTires: sample-catalog results carry no price or stock", async () => {
  const out = await runLookupTires(
    { size: "225/45R17" },
    { env: {}, search: async () => ({ source: "sample", query: { size: "225/45R17" }, items: [{ brand: "Acme", model: "Grip", size: "225/45R17", price: 80, available: null }] }) },
  );
  const parsed = JSON.parse(out.content);
  assert.equal(parsed.items.length, 1);
  assert.ok(!("price" in parsed.items[0]));
  assert.ok(!("in_stock" in parsed.items[0]));
  assert.match(parsed.note, /Do not state any price/);
});

test("runLookupTires: a search that throws becomes an error result", async () => {
  const out = await runLookupTires({ size: "225/45R17" }, { env: {}, search: async () => { throw new Error("atd down"); } });
  assert.equal(out.is_error, true);
  assert.ok(!out.content.includes("atd down"));
});

test("live: tool_use loop runs the lookup, feeds the result back, adds /tires", async () => {
  const f = fakeFetch(
    toolBody({ size: "225/45R17" }),
    textBody("Current catalog result: Acme Grip in 225/45R17. See /tires to order."),
  );
  const searched = [];
  const h = createChatHandler({
    env: LIVE,
    fetchImpl: f,
    knowledge: KB,
    search: async (q) => { searched.push(q); return { source: "sample", query: { size: "225/45R17" }, items: [{ brand: "Acme", model: "Grip", size: "225/45R17" }] }; },
  });
  const r = await post(h, ask("Do you have 225/45R17 tires?"));
  assert.equal(r.statusCode, 200);
  assert.equal(f.calls.length, 2);
  assert.equal(searched[0].type, "size");
  const second = f.calls[1].body.messages;
  assert.equal(second[second.length - 2].role, "assistant");
  const result = second[second.length - 1];
  assert.equal(result.role, "user");
  assert.equal(result.content[0].type, "tool_result");
  assert.equal(result.content[0].tool_use_id, "tu_1");
  assert.equal(r.body.sources[0].path, "/tires");
  assert.match(r.body.reply, /Acme Grip/);
});

test("live: a tool loop that never settles stops at MAX_ROUNDS with a 503 handoff", async () => {
  const quiet = console.error;
  console.error = () => {};
  try {
    const f = fakeFetch(toolBody({ size: "225/45R17" }));
    const h = createChatHandler({
      env: LIVE, fetchImpl: f, knowledge: KB,
      search: async () => ({ source: "sample", query: {}, items: [] }),
    });
    const r = await post(h, ask("225/45R17?"));
    assert.equal(f.calls.length, MAX_ROUNDS);
    assert.equal(r.statusCode, 503);
    assert.equal(r.body.handoff, true);
  } finally {
    console.error = quiet;
  }
});

/* ----------------------------- daily cap ------------------------------ */

test("daily cap: past CHAT_DAILY_CAP live messages answer 503 handoff; stand-in is not capped", async () => {
  const f = fakeFetch(textBody("Shipping is free to 48 states."));
  const env = { ...LIVE, CHAT_DAILY_CAP: "2" };
  let t = Date.UTC(2026, 5, 1, 12);
  const h = createChatHandler({ env, fetchImpl: f, knowledge: KB, now: () => (t += 61_000) });
  assert.equal((await post(h, ask("shipping"))).statusCode, 200);
  assert.equal((await post(h, ask("shipping"))).statusCode, 200);
  const capped = await post(h, ask("shipping"));
  assert.equal(capped.statusCode, 503);
  assert.equal(capped.body.handoff, true);
  assert.equal(f.calls.length, 2);
  // Next UTC day resets.
  t = Date.UTC(2026, 5, 2, 12);
  assert.equal((await post(h, ask("shipping"))).statusCode, 200);

  const standin = createChatHandler({ env: { CHAT_DAILY_CAP: "0" }, knowledge: KB });
  assert.equal((await post(standin, ask("shipping"))).statusCode, 200);
});

/* ----------------------------- wiring --------------------------------- */

test("status.js: ?chat=1 goes to the chat handler (POST only); plain GET status is unchanged", async () => {
  const post405 = mockRes();
  await statusHandler({ method: "GET", headers: {}, url: "/api/status?chat=1" }, post405);
  assert.equal(post405.statusCode, 405);
  assert.equal(post405.headers.allow, "POST");

  const viaStatus = mockRes();
  await statusHandler(
    { method: "POST", headers: {}, query: { chat: "1" }, body: { messages: [{ role: "user", content: "hello" }] } },
    viaStatus,
  );
  assert.equal(viaStatus.statusCode, 200);
  assert.ok("reply" in viaStatus.body && "mode" in viaStatus.body);

  const get = mockRes();
  await statusHandler({ method: "GET", headers: {} }, get);
  assert.equal(get.statusCode, 200);
  assert.ok("atd" in get.body && !("reply" in get.body));
  const post405b = mockRes();
  await statusHandler({ method: "POST", headers: {} }, post405b);
  assert.equal(post405b.statusCode, 405);
  assert.equal(post405b.headers.allow, "GET");
});

test("vercel.json: /api/chat is rewritten to the status function and never cached", () => {
  const vercel = JSON.parse(readFileSync(new URL("../../vercel.json", import.meta.url), "utf8"));
  assert.ok(vercel.rewrites.some((r) => r.source === "/api/chat" && r.destination === "/api/status?chat=1"));
  const rule = vercel.headers.find((h) => h.source === "/api/chat");
  assert.ok(rule?.headers.some((h) => h.key === "Cache-Control" && h.value === "no-store"));
});

test("stand-in: an off-topic question hands off instead of quoting a loose match", async () => {
  const h = createChatHandler({ env: {}, knowledge: KB });
  const r = await post(h, ask("What is the capital of France?"));
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.handoff, true);
  assert.deepEqual(r.body.sources, []);
});

test("answers say which knowledge they used, so a missing file is visible", async () => {
  const h = createChatHandler({ env: {}, knowledge: { built: "2026-10-13T00:00:00.000Z", chunks: KB.chunks } });
  const r = await post(h, ask("Is shipping free?"));
  assert.equal(r.headers["x-chat-kb-chunks"], String(KB.chunks.length));
  assert.equal(r.headers["x-chat-kb-built"], "2026-10-13T00:00:00.000Z");
});

test("status reports chat on only when the Anthropic key is set (the button hides otherwise)", () => {
  assert.equal(statusBody(getConfig({})).chat, "off");
  assert.equal(statusBody(getConfig({ ANTHROPIC_API_KEY: "sk-test" })).chat, "on");
  assert.ok(!JSON.stringify(statusBody(getConfig({ ANTHROPIC_API_KEY: "sk-test" }))).includes("sk-test"), "never the key");
});

/* ----------------------------- tire cards ------------------------------ */

test("tireCards: sample items get a catalog link and no price or stock", () => {
  const cards = tireCards([{ id: "t-cont-truecontact-tour", sku: "t-cont-truecontact-tour", brand: "Continental", model: "TrueContact Tour", size: "215/60R16", loadIndex: "95", speedRating: "H", price: 142, available: null }], false);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].href, "/tires/continental-truecontact-tour-215-60r16");
  assert.equal("price" in cards[0], false);
  assert.equal(cards[0].image, null);
});

test("tireCards: live items link to /tires/p/:sku and carry price, stock and an https image", () => {
  const cards = tireCards([
    { id: "atd-123", sku: "123", brand: "Acme", model: "Grip", size: "225/45R17", price: 99.5, available: true, image: "https://cdn.example/a.jpg" },
    { id: "atd-124", sku: "124", brand: "Acme", model: "Soft", size: "225/45R17", price: 80, available: false, image: "http://x/y.jpg" },
    { id: "atd-1", sku: "1", brand: "", model: "x", size: "y" },
  ], true);
  assert.equal(cards.length, 2);
  assert.equal(cards[0].href, "/tires/p/123");
  assert.equal(cards[0].price, 99.5);
  assert.equal(cards[0].inStock, true);
  assert.equal(cards[0].image, "https://cdn.example/a.jpg");
  assert.equal(cards[1].inStock, false);
  assert.equal(cards[1].image, null);
});

test("tireCards: at most 3", () => {
  const items = Array.from({ length: 6 }, (_, i) => ({ id: `atd-${i}`, sku: String(i), brand: "A", model: "M" + i, size: "225/45R17" }));
  assert.equal(tireCards(items, true).length, 3);
});

test("live: a tire lookup returns cards from the catalog, and the tool_result never carries them", async () => {
  const f = fakeFetch(
    toolBody({ size: "225/45R17" }),
    textBody("One match is in the catalog; the card is below."),
  );
  const h = createChatHandler({
    env: LIVE, fetchImpl: f, knowledge: KB,
    search: async () => ({ source: "sample", query: { size: "225/45R17" }, items: [{ id: "t-cont-truecontact-tour", sku: "t-cont-truecontact-tour", brand: "Continental", model: "TrueContact Tour", size: "215/60R16" }] }),
  });
  const r = await post(h, ask("Do you have 215/60R16?"));
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.tires.length, 1);
  assert.equal(r.body.tires[0].brand, "Continental");
  const result = f.calls[1].body.messages.at(-1).content[0];
  assert.equal("cards" in result, false);
});

test("live: no lookup means no cards", async () => {
  const f = fakeFetch(textBody("Shipping is free to the 48 contiguous states and DC."));
  const h = createChatHandler({ env: LIVE, fetchImpl: f, knowledge: KB });
  const r = await post(h, ask("Is shipping free?"));
  assert.deepEqual(r.body.tires, []);
});

/* ------------------- off-topic, truncation, pinned sources ------------------- */

test("live: an off-topic decline carries no sources, no cards and no marker", async () => {
  const f = fakeFetch(textBody("I can only help with tires and this website. Want a tire size checked? [[OFFTOPIC]]"));
  const h = createChatHandler({ env: LIVE, fetchImpl: f, knowledge: KB });
  const r = await post(h, ask("What is the capital of France?"));
  assert.equal(r.body.handoff, false);
  assert.deepEqual(r.body.sources, []);
  assert.deepEqual(r.body.tires, []);
  assert.ok(!r.body.reply.includes("OFFTOPIC"));
});

test("live: a reply cut off by max_tokens ends on its last whole sentence", async () => {
  const f = fakeFetch({ stop_reason: "max_tokens", content: [{ type: "text", text: "Shipping is free to the 48 contiguous states and DC. It covers every order and" }] });
  const h = createChatHandler({ env: LIVE, fetchImpl: f, knowledge: KB });
  const r = await post(h, ask("shipping"));
  assert.equal(r.body.reply, "Shipping is free to the 48 contiguous states and DC.");
});

test("lastWholeSentence leaves a finished reply alone", () => {
  assert.equal(lastWholeSentence("All done."), "All done.");
  assert.equal(lastWholeSentence("short cut"), "short cut");
});

test("pinnedSources: financing, install and hours questions get their page", () => {
  assert.equal(pinnedSources("Do you offer financing?")[0].path, "/financing");
  assert.equal(pinnedSources("How much is installation?")[0].path, "/services/tire-installation");
  assert.equal(pinnedSources("What are your hours?")[0].path, "/contact");
  assert.deepEqual(pinnedSources("What is the capital of France?"), []);
});

test("live: a financing question lists /financing first", async () => {
  const f = fakeFetch(textBody("You can pay by card, Shop Pay or Shop Pay Installments, subject to eligibility at checkout."));
  const h = createChatHandler({ env: LIVE, fetchImpl: f, knowledge: KB });
  const r = await post(h, ask("Do you offer financing?"));
  assert.equal(r.body.sources[0].path, "/financing");
  assert.equal(r.body.handoff, false);
});

test("system prompt: grounded install facts, financing page, cards, off-topic marker", () => {
  const p = systemPrompt({ page: null, hits: [] });
  assert.match(p, /Never retract/);
  assert.match(p, /\/financing/);
  assert.match(p, /call lookup_tires first/);
  assert.match(p, /\[\[OFFTOPIC\]\]/);
  assert.match(p, /from \$25 per tire/);
});

test("system prompt always carries the service price list, even with no retrieval hits", () => {
  const p = systemPrompt({ page: null, hits: [] });
  assert.match(p, /Tire Installation \(shop or mobile van\): from \$25 per tire/);
  assert.match(serviceFacts(), /Tire Balancing/);
});
