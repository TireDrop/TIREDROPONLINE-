// The chat widget's pure parts: request building, the fetch wrapper, reply
// parsing, storage. Node only.
//
//   node --test src/components/chat/chatClient.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ChatError,
  MAX_CHARS,
  MAX_MESSAGES,
  normalizeTires,
  STORAGE_KEY,
  buildRequestMessages,
  clip,
  isChatHidden,
  loadHistory,
  normalizeSources,
  parseReply,
  saveHistory,
  sendChat,
} from "./chatClient.js";

const ok = (json) => async () => ({ ok: true, status: 200, json: async () => json });
const fail = (status, json) => async () => ({ ok: false, status, json: async () => json });

test("hidden on cart and checkout, shown elsewhere", () => {
  for (const p of ["/cart", "/checkout", "/checkout/", "/scroll-story"]) assert.equal(isChatHidden(p), true, p);
  for (const p of ["/", "/tires", "/cartoon", "/checkout-help", "/tires/x"]) assert.equal(isChatHidden(p), false, p);
});

test("request keeps the newest 12, starts and ends with the visitor, clips long replies", () => {
  const history = [];
  for (let i = 0; i < 10; i++) {
    history.push({ role: "user", content: `q${i}` }, { role: "assistant", content: "a".repeat(2000) });
  }
  history.push({ role: "user", content: "last" });
  const out = buildRequestMessages(history);
  assert.ok(out.length <= MAX_MESSAGES);
  assert.equal(out[0].role, "user");
  assert.equal(out.at(-1).content, "last");
  assert.ok(out.every((m) => m.content.length <= MAX_CHARS));
});

test("error bubbles never go to the server", () => {
  const out = buildRequestMessages([
    { role: "user", content: "hi" },
    { role: "assistant", content: "Sorry, something broke", error: true },
    { role: "user", content: "again" },
  ]);
  assert.deepEqual(out, [
    { role: "user", content: "hi" },
    { role: "user", content: "again" },
  ]);
});

test("clip cuts on a word and stays within the limit", () => {
  const s = clip("word ".repeat(400));
  assert.ok(s.length <= MAX_CHARS);
  assert.ok(s.endsWith("…"));
  assert.equal(clip("short"), "short");
});

test("sendChat posts the wire format and returns the reply", async () => {
  let seen;
  const out = await sendChat(
    [{ role: "user", content: "Is shipping free?" }],
    "/tires",
    async (url, init) => {
      seen = { url, init };
      return { ok: true, status: 200, json: async () => ({ reply: " Yes. ", sources: [{ title: "Shipping", path: "/shipping" }], handoff: false, mode: "live" }) };
    },
  );
  assert.equal(seen.url, "/api/chat");
  assert.equal(seen.init.method, "POST");
  assert.deepEqual(JSON.parse(seen.init.body), { messages: [{ role: "user", content: "Is shipping free?" }], page: "/tires" });
  assert.deepEqual(out, { reply: "Yes.", sources: [{ title: "Shipping", path: "/shipping" }], tires: [], handoff: false, mode: "live" });
});

test("sendChat maps failures to ChatError", async () => {
  const msgs = [{ role: "user", content: "hi" }];
  await assert.rejects(sendChat(msgs, "/", fail(503, { error: "down", handoff: true })), (e) => e instanceof ChatError && e.status === 503 && e.handoff);
  await assert.rejects(sendChat(msgs, "/", fail(429, { error: "slow down" })), (e) => e.status === 429 && e.handoff === false);
  await assert.rejects(sendChat(msgs, "/", fail(500, null)), (e) => e.status === 500 && e.handoff);
  await assert.rejects(sendChat(msgs, "/", ok({ reply: "" })), (e) => e instanceof ChatError);
  await assert.rejects(sendChat(msgs, "/", async () => { throw new TypeError("offline"); }), (e) => e.status === 0 && e.handoff);
  await assert.rejects(sendChat([], "/", ok({})), (e) => e.status === 400);
});

test("sendChat aborts after the timeout", async () => {
  const hang = (_url, { signal }) =>
    new Promise((_, reject) => signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))));
  await assert.rejects(sendChat([{ role: "user", content: "hi" }], "/", hang, { timeoutMs: 20 }), (e) => e.status === 0);
});

test("sources: site paths only, deduped, max 3", () => {
  const out = normalizeSources([
    { title: "A", path: "/a" },
    { title: "Evil", path: "https://evil.example/x" },
    { title: "Evil2", path: "//evil.example" },
    { title: "Dup", path: "/a" },
    { path: "/b" },
    { title: "C", path: "/c" },
    { title: "D", path: "/d" },
  ]);
  assert.deepEqual(out, [{ title: "A", path: "/a" }, { title: "/b", path: "/b" }, { title: "C", path: "/c" }]);
  assert.deepEqual(normalizeSources(null), []);
});

test("parseReply: paragraphs and bullets, no markup", () => {
  assert.deepEqual(parseReply("**Yes**, free.\nTo 48 states.\n\n- one\n- two\n\nCall us."), [
    { type: "p", text: "Yes, free. To 48 states." },
    { type: "ul", items: ["one", "two"] },
    { type: "p", text: "Call us." },
  ]);
  assert.deepEqual(parseReply(""), []);
});

test("history round-trips and survives blocked or corrupt storage", () => {
  const store = new Map();
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) };
  const h = [
    { role: "user", content: "hi" },
    { role: "assistant", content: "hello", sources: [{ title: "T", path: "/t" }], handoff: true },
  ];
  saveHistory(h, storage);
  const back = loadHistory(storage);
  assert.equal(back[1].handoff, true);
  assert.deepEqual(back[1].sources, [{ title: "T", path: "/t" }]);
  saveHistory([], storage);
  assert.equal(store.has(STORAGE_KEY), false);
  store.set(STORAGE_KEY, "{not json");
  assert.deepEqual(loadHistory(storage), []);
  const throwing = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() {} };
  assert.deepEqual(loadHistory(throwing), []);
  assert.doesNotThrow(() => saveHistory(h, throwing));
  assert.deepEqual(loadHistory(null), []);
});

test("normalizeTires: real paths only, max 3, price only as a number, image only https", () => {
  const good = { brand: "Continental", model: "VikingContact 7", size: "225/45R17", loadIndex: "94", speedRating: "T", accent: "#E03A1E", href: "/tires/continental-vikingcontact-7-225-45r17" };
  const out = normalizeTires([
    good,
    { ...good, href: "/tires/a", price: 142.5, inStock: true, image: "https://cdn.example/x.jpg" },
    { ...good, href: "//evil.example/x" },
    { ...good, href: "https://evil.example/x" },
    { ...good, href: "/tires/b", price: "free", image: "http://insecure/x.jpg", accent: "red" },
    { ...good, href: "/tires/c" },
    { ...good, href: "/tires/d" },
    { brand: "", model: "x", size: "y", href: "/tires/e" },
  ]);
  assert.equal(out.length, 3);
  assert.equal(out[0].price, null);
  assert.equal(out[1].price, 142.5);
  assert.equal(out[1].inStock, true);
  assert.equal(out[1].image, "https://cdn.example/x.jpg");
  assert.equal(out[2].price, null);
  assert.equal(out[2].image, null);
  assert.equal(out[2].accent, null);
  assert.deepEqual(normalizeTires(undefined), []);
});
