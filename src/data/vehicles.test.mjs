/**
 * Where the finders' model lists come from (src/data/vehicles.js), in order:
 * our cached /api/vehicles; vPIC straight from the browser only when there
 * is no API here; the build's snapshot; the size table. Each vPIC request is
 * abandoned after VPIC_TIMEOUT_MS and tried once more. vPIC itself is played
 * by scripts/vpic-mock.mjs, the same stand-in the Playwright checks use,
 * behind a stubbed fetch.
 */
import { afterEach, beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";

import { MODELS, vpicBody, vpicFetch } from "../../scripts/vpic-mock.mjs";
import { vehiclesAnswer } from "../../api/_lib/vehicles.js";
import {
  API_TIMEOUT_MS,
  API_URL,
  SNAPSHOT_URL,
  VPIC_RETRIES,
  VPIC_TIMEOUT_MS,
  modelsFor,
  resetVehicleModels,
} from "./vehicles.js";

const realFetch = globalThis.fetch;
const realInfo = console.info;
const rejections = [];
const onRejection = (e) => rejections.push(e);

/** Lets every queued promise callback run without moving the mocked clock. */
const flush = async () => {
  for (let i = 0; i < 5; i += 1) await new Promise((r) => setImmediate(r));
};

const NO_API = { status: 404, text: "<!doctype html><title>Not found</title>" };
const NO_SNAPSHOT = { status: 404, text: "" };
const VPIC_DOWN = { status: 502, json: { error: "vPIC did not answer", upstream: true } };

/**
 * A fetch that routes /api/vehicles, the snapshot and vPIC to `routes.api`,
 * `routes.snapshot` and `routes.vpic`: each `(url, attempt) => spec`, where
 * spec is `{ status, json | text, delay }`. A delayed answer honours the
 * abort signal the way fetch does.
 */
function stubFetch(routes) {
  const calls = [];
  globalThis.fetch = (input, { signal } = {}) => {
    const url = String(input);
    const kind = url.startsWith(API_URL)
      ? "api"
      : url.startsWith(SNAPSHOT_URL)
        ? "snapshot"
        : "vpic";
    const attempt = calls.filter((c) => c.url === url).length;
    calls.push({ kind, url, attempt });
    const spec = routes[kind](url, attempt);
    const response = () => ({
      ok: spec.status >= 200 && spec.status < 300,
      status: spec.status,
      json: async () => {
        if (spec.json === undefined) throw new SyntaxError("Unexpected token <");
        return spec.json;
      },
    });
    if (!spec.delay) return Promise.resolve(response());
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(response()), spec.delay);
      signal?.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("The operation was aborted.", "AbortError"));
      });
    });
  };
  return calls;
}

const vpicOk = (delays = [0]) => (url, attempt) => ({
  status: 200,
  json: vpicBody(url),
  delay: delays[Math.min(attempt, delays.length - 1)],
});

/** /api/vehicles as the real handler answers it, from the fixtures. */
async function apiBody(make, year) {
  const answer = await vehiclesAnswer(
    { kind: "models", make, year },
    { fetchImpl: vpicFetch, memo: false },
  );
  return { status: answer.status, json: answer.body };
}

const count = (calls, kind) => calls.filter((c) => c.kind === kind).length;

beforeEach(() => {
  resetVehicleModels();
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

test("the timeouts: vPIC 6-8 seconds with one retry; the API a little over the server's two attempts", () => {
  assert.ok(VPIC_TIMEOUT_MS >= 6000 && VPIC_TIMEOUT_MS <= 8000);
  assert.equal(VPIC_RETRIES, 1);
  assert.ok(API_TIMEOUT_MS >= 8000 && API_TIMEOUT_MS <= 12000);
});

test("the API's answer is used: every BMW model, one request, nothing from the browser to vPIC", async () => {
  const body = await apiBody("BMW", "2019");
  const calls = stubFetch({ api: () => body, vpic: vpicOk(), snapshot: () => NO_SNAPSHOT });
  const res = await modelsFor("BMW", "2019");
  assert.equal(res.source, "nhtsa");
  for (const m of ["3 Series", "4 Series", "M3", "X5", "X7"]) assert.ok(res.models.includes(m), m);
  assert.equal(res.models.length, 28);
  assert.deepEqual(calls.map((c) => c.url), [`${API_URL}?kind=models&make=BMW&year=2019`]);

  // Asked again: the answer is kept for the page load.
  await modelsFor("BMW", "2019");
  assert.equal(calls.length, 1);
});

test("the API says vPIC is down: no second wait on vPIC, and with no snapshot the size table, said to be a fallback", async () => {
  const calls = stubFetch({ api: () => VPIC_DOWN, vpic: vpicOk(), snapshot: () => NO_SNAPSHOT });
  const res = await modelsFor("BMW", "2019");
  assert.equal(res.source, "fallback");
  assert.deepEqual(res.models, ["3 Series", "5 Series", "X3", "X5"]);
  assert.equal(count(calls, "vpic"), 0, "vPIC not asked from the browser");
  assert.equal(count(calls, "snapshot"), 1);

  // A failure is not kept: the next pick asks the API again (the snapshot
  // was already found missing for this page load).
  await modelsFor("BMW", "2019");
  assert.equal(count(calls, "api"), 2);
  assert.equal(count(calls, "snapshot"), 1);

  // A make the size table has nothing for: nothing to pick, so the finder
  // asks for the model to be typed.
  const audi = await modelsFor("Audi", "2019");
  assert.deepEqual(audi, { models: [], source: "fallback" });
});

test("the API says vPIC is down and the build left a snapshot: the make's models on file", async () => {
  const snapshot = {
    v: 1,
    years: "all",
    makes: { BMW: ["1 Series", "3 Series", "4 Series", "M3", "X5", "Z3"] },
  };
  stubFetch({ api: () => VPIC_DOWN, vpic: vpicOk(), snapshot: () => ({ status: 200, json: snapshot }) });
  const res = await modelsFor("BMW", "2019");
  assert.equal(res.source, "snapshot");
  assert.deepEqual(res.models, ["1 Series", "3 Series", "4 Series", "5 Series", "M3", "X3", "X5", "Z3"]);
  // A make the snapshot does not carry: the size table.
  const ford = await modelsFor("Ford", "2019");
  assert.equal(ford.source, "fallback");
});

test("an API that never answers counts as vPIC down after API_TIMEOUT_MS", async () => {
  const calls = stubFetch({
    api: () => ({ status: 200, json: {}, delay: 60_000 }),
    vpic: vpicOk(),
    snapshot: () => NO_SNAPSHOT,
  });
  let settled = null;
  modelsFor("Toyota", "2019").then((r) => (settled = r));
  await flush();
  mock.timers.tick(API_TIMEOUT_MS);
  await flush();
  assert.equal(settled?.source, "fallback");
  assert.equal(count(calls, "vpic"), 0);
  assert.deepEqual(rejections, []);
});

test("no API here (a static preview): vPIC straight from the browser", async () => {
  const calls = stubFetch({ api: () => NO_API, vpic: vpicOk(), snapshot: () => NO_SNAPSHOT });
  const res = await modelsFor("BMW", "2021");
  assert.equal(res.source, "nhtsa");
  assert.ok(res.models.includes("4 Series") && res.models.includes("iX"));
  assert.equal(count(calls, "vpic"), 3, "car, truck and mpv");
  assert.ok(calls.filter((c) => c.kind === "vpic").every((c) => /modelyear\/2021\/vehicletype\/(car|truck|mpv)/.test(c.url)));
});

test("no API, and a vPIC that never answers in time: the size table after two timeouts", async () => {
  const calls = stubFetch({ api: () => NO_API, vpic: vpicOk([60_000]), snapshot: () => NO_SNAPSHOT });
  let settled = null;
  modelsFor("Toyota", "2019").then((r) => (settled = r));

  await flush();
  assert.equal(count(calls, "vpic"), 3, "car, truck and mpv requested");
  mock.timers.tick(VPIC_TIMEOUT_MS);
  await flush();
  assert.equal(settled, null, "still waiting on the retry");
  assert.equal(count(calls, "vpic"), 6, "each type tried a second time");

  mock.timers.tick(VPIC_TIMEOUT_MS);
  await flush();
  assert.ok(settled, "answered after two timeouts");
  assert.equal(settled.source, "fallback");
  assert.ok(settled.models.includes("Camry"), "size-table models offered");
  assert.ok(!settled.models.includes("Mirai"), "nothing only vPIC knows");
  assert.equal(count(calls, "vpic"), 6, "no third attempt");
  assert.deepEqual(rejections, [], "no unhandled rejections");
});

test("no API, and a slow first vPIC answer: retried, and the retry's answer used", async () => {
  const calls = stubFetch({ api: () => NO_API, vpic: vpicOk([60_000, 50]), snapshot: () => NO_SNAPSHOT });
  let settled = null;
  modelsFor("Honda", "2020").then((r) => (settled = r));

  await flush();
  mock.timers.tick(VPIC_TIMEOUT_MS);
  await flush();
  mock.timers.tick(50);
  await flush();
  assert.ok(settled);
  assert.equal(settled.source, "nhtsa");
  assert.ok(settled.models.includes("Ridgeline"), "vPIC truck model listed");
  assert.equal(count(calls, "vpic"), 6);
  assert.deepEqual(rejections, []);
});

test("a make the list does not carry, or no year, asks nothing", async () => {
  const calls = stubFetch({ api: () => NO_API, vpic: vpicOk(), snapshot: () => NO_SNAPSHOT });
  assert.deepEqual(await modelsFor("Studebaker", "1960"), { models: [], source: "none" });
  assert.deepEqual(await modelsFor("BMW", ""), { models: [], source: "none" });
  assert.equal(calls.length, 0);
  assert.ok(MODELS.BMW, "the BMW fixture exists");
});
