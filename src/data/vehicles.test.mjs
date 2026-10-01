/**
 * The NHTSA vPIC model lookup gives up on a slow answer: each request is
 * abandoned after VPIC_TIMEOUT_MS and tried once more, and when that fails as
 * well the list falls back to the size table (with "Other / not listed" still
 * offered by the picker). vPIC itself is played by scripts/vpic-mock.mjs, the
 * same stand-in the Playwright form checks use, behind a stubbed fetch.
 */
import { afterEach, beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";

import { vpicBody } from "../../scripts/vpic-mock.mjs";
import { VPIC_RETRIES, VPIC_TIMEOUT_MS, modelsFor } from "./vehicles.js";

const realFetch = globalThis.fetch;
const realInfo = console.info;
const rejections = [];
const onRejection = (e) => rejections.push(e);

/** Lets every queued promise callback run without moving the mocked clock. */
const flush = () => new Promise((r) => setImmediate(r));

/**
 * A vPIC that answers each request after `delays[n]` ms (n = how many requests
 * it has seen for that URL), and honours the abort signal the way fetch does.
 */
function stubVpic(delays) {
  const seen = new Map();
  const calls = [];
  globalThis.fetch = (url, { signal } = {}) => {
    const n = seen.get(url) ?? 0;
    seen.set(url, n + 1);
    calls.push({ url, attempt: n });
    const delay = delays[Math.min(n, delays.length - 1)];
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => resolve({ ok: true, status: 200, json: async () => vpicBody(url) }),
        delay,
      );
      signal?.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("The operation was aborted.", "AbortError"));
      });
    });
  };
  return calls;
}

beforeEach(() => {
  mock.timers.enable({ apis: ["setTimeout"] });
  console.info = () => {};
  rejections.length = 0;
  process.on("unhandledRejection", onRejection);
});

afterEach(() => {
  mock.timers.reset();
  globalThis.fetch = realFetch;
  console.info = realInfo;
  process.off("unhandledRejection", onRejection);
});

test("the timeout is 6-8 seconds with one retry", () => {
  assert.ok(VPIC_TIMEOUT_MS >= 6000 && VPIC_TIMEOUT_MS <= 8000);
  assert.equal(VPIC_RETRIES, 1);
});

test("a vPIC that never answers in time falls back to the size table", async () => {
  const calls = stubVpic([60_000]);
  let settled = null;
  modelsFor("Toyota", "2019").then((r) => (settled = r));

  await flush();
  assert.equal(calls.length, 3, "car, truck and mpv requested");
  mock.timers.tick(VPIC_TIMEOUT_MS);
  await flush();
  assert.equal(settled, null, "still waiting on the retry");
  assert.equal(calls.length, 6, "each type tried a second time");

  mock.timers.tick(VPIC_TIMEOUT_MS);
  await flush();
  assert.ok(settled, "answered after two timeouts");
  assert.equal(settled.source, "fallback");
  assert.ok(settled.models.includes("Camry"), "size-table models offered");
  assert.ok(!settled.models.includes("Mirai"), "nothing only vPIC knows");
  assert.equal(calls.length, 6, "no third attempt");
  assert.deepEqual(rejections, [], "no unhandled rejections");
});

test("a slow first answer is retried, and the retry's answer is used", async () => {
  const calls = stubVpic([60_000, 50]);
  let settled = null;
  modelsFor("Honda", "2020").then((r) => (settled = r));

  await flush();
  mock.timers.tick(VPIC_TIMEOUT_MS);
  await flush();
  mock.timers.tick(50);
  await flush();
  await flush();
  assert.ok(settled);
  assert.equal(settled.source, "nhtsa");
  assert.ok(settled.models.includes("Ridgeline"), "vPIC truck model listed");
  assert.equal(calls.length, 6);
  assert.deepEqual(rejections, []);
});

test("a prompt answer needs no retry", async () => {
  const calls = stubVpic([20]);
  let settled = null;
  modelsFor("Ford", "2018").then((r) => (settled = r));
  await flush();
  mock.timers.tick(20);
  await flush();
  await flush();
  assert.equal(settled?.source, "nhtsa");
  assert.ok(settled.models.includes("F-150"));
  assert.equal(calls.length, 3);
});
