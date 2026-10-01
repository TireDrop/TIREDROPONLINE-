// GET /api/vehicles and the build's vPIC snapshot (api/_lib/vehicles.js),
// with vPIC played by scripts/vpic-mock.mjs.
// Run with: npm run test:api

import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";

import handler from "../vehicles.js";
import {
  CACHE_LONG,
  CACHE_PARTIAL,
  NO_STORE,
  UPSTREAM_RETRIES,
  UPSTREAM_TIMEOUT_MS,
  buildSnapshot,
  clearVehiclesCache,
  vehiclesAnswer,
} from "./vehicles.js";
import { MODELS, vpicBody, vpicFetch } from "../../scripts/vpic-mock.mjs";

const realFetch = globalThis.fetch;
const realError = console.error;

beforeEach(() => {
  clearVehiclesCache();
  console.error = () => {};
});
afterEach(() => {
  globalThis.fetch = realFetch;
  console.error = realError;
});

function mockRes() {
  const headers = {};
  return {
    statusCode: 200,
    headers,
    body: undefined,
    setHeader(k, v) {
      headers[k.toLowerCase()] = v;
    },
    end(text) {
      this.body = text === undefined ? undefined : JSON.parse(text);
    },
  };
}

async function get(query) {
  const res = mockRes();
  await handler({ method: "GET", query }, res);
  return res;
}

/** A fetch that records each URL and answers from the fixtures. */
function recordingFetch() {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push(String(url));
    return vpicFetch(url, init);
  };
  return { calls, fetchImpl };
}

/** A fetch that never answers until aborted, the way a hung vPIC looks. */
const hangingFetch = (url, { signal } = {}) =>
  new Promise((_, reject) => {
    signal?.addEventListener("abort", () =>
      reject(new DOMException("The operation was aborted.", "AbortError")),
    );
  });

// ---- the fixtures the checks rely on ------------------------------------------

test("the vPIC mock has realistic BMW and Audi model names", () => {
  const bmw = MODELS.BMW[1];
  const names = [...bmw.car, ...bmw.truck, ...bmw.mpv].map(([n]) => n);
  for (const m of ["3 Series", "4 Series", "5 Series", "M3", "X3", "X5", "X7", "Z4", "i4"]) {
    assert.ok(names.includes(m), `BMW ${m}`);
  }
  const body = vpicBody(
    "https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/BMW/modelyear/2019/vehicletype/mpv?format=json",
  );
  assert.equal(body.Results[0].Make_Name, "BMW");
  assert.ok(body.Results.every((r) => r.VehicleTypeName.startsWith("Multipurpose")));
  // Every year at once (the snapshot's request) answers too.
  const all = vpicBody(
    "https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/Audi/vehicletype/car?format=json",
  );
  assert.ok(all.Results.some((r) => r.Model_Name === "A4"));
});

// ---- kind=models ---------------------------------------------------------------

test("models: every BMW model vPIC lists for the year, merged with the size table, cached a day at the edge", async () => {
  globalThis.fetch = recordingFetch().fetchImpl;
  const res = await get({ kind: "models", make: "BMW", year: "2019" });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.kind, "models");
  assert.equal(res.body.make, "BMW");
  assert.equal(res.body.year, "2019");
  assert.equal(res.body.source, "nhtsa");
  for (const m of ["3 Series", "4 Series", "M3", "X5", "X7", "i4"]) {
    assert.ok(res.body.models.includes(m), `lists ${m}`);
  }
  // The size table's 3 Series, 5 Series, X3 and X5 are listed once each.
  assert.equal(res.body.models.filter((m) => m === "3 Series").length, 1);
  assert.equal(res.body.models.length, 28);
  assert.deepEqual(res.body.models.slice(0, 4), ["2 Series", "3 Series", "4 Series", "5 Series"]);
  assert.equal(res.body.partial, undefined);

  const cache = res.headers["cache-control"];
  assert.equal(cache, CACHE_LONG);
  assert.match(cache, /\bpublic\b/);
  assert.match(cache, /\bs-maxage=86400\b/);
  assert.match(cache, /\bstale-while-revalidate=\d+/);
  assert.match(res.headers["content-type"], /application\/json/);
});

test("models: asks vPIC for cars, trucks and SUVs/vans of that make and year", async () => {
  const { calls, fetchImpl } = recordingFetch();
  const answer = await vehiclesAnswer({ kind: "models", make: "audi", year: "2021" }, { fetchImpl });
  assert.equal(answer.status, 200);
  assert.equal(answer.body.make, "Audi", "the make in its listed spelling");
  assert.deepEqual(
    calls.map((u) => u.replace(/^.*GetModelsForMakeYear/, "")).sort(),
    [
      "/make/Audi/modelyear/2021/vehicletype/car?format=json",
      "/make/Audi/modelyear/2021/vehicletype/mpv?format=json",
      "/make/Audi/modelyear/2021/vehicletype/truck?format=json",
    ],
  );
  assert.ok(calls.every((u) => u.startsWith("https://vpic.nhtsa.dot.gov/api/vehicles/")));
  assert.equal(answer.body.models.length, 18);
  assert.ok(answer.body.models.includes("Q5") && answer.body.models.includes("A4"));
});

test("models: Scion comes out of vPIC's Toyota list, and Toyota leaves it out", async () => {
  const { fetchImpl } = recordingFetch();
  const scion = await vehiclesAnswer({ kind: "models", make: "Scion", year: "2014" }, { fetchImpl });
  assert.ok(scion.body.models.includes("xB"));
  assert.ok(!scion.body.models.includes("Camry"));
  const toyota = await vehiclesAnswer({ kind: "models", make: "Toyota", year: "2014" }, { fetchImpl });
  assert.ok(toyota.body.models.includes("Tacoma"));
  assert.ok(!toyota.body.models.some((m) => /Scion|xB/.test(m)));
});

test("models: a second ask for the same make and year is answered without vPIC", async () => {
  const { calls, fetchImpl } = recordingFetch();
  await vehiclesAnswer({ kind: "models", make: "BMW", year: "2020" }, { fetchImpl });
  assert.equal(calls.length, 3);
  const again = await vehiclesAnswer({ kind: "models", make: "BMW", year: "2020" }, { fetchImpl });
  assert.equal(calls.length, 3, "no new vPIC call");
  assert.equal(again.cache, CACHE_LONG);
  assert.ok(again.body.models.includes("4 Series"));
  // memo: false always asks.
  await vehiclesAnswer({ kind: "models", make: "BMW", year: "2020" }, { fetchImpl, memo: false });
  assert.equal(calls.length, 6);
});

test("models: a hung vPIC is abandoned after the timeout, retried once, and answered 502 that is never cached", async () => {
  assert.ok(UPSTREAM_TIMEOUT_MS * (UPSTREAM_RETRIES + 1) < 10000, "inside a 10 s function");
  let calls = 0;
  const started = Date.now();
  const answer = await vehiclesAnswer(
    { kind: "models", make: "BMW", year: "2019" },
    {
      fetchImpl: (url, init) => {
        calls += 1;
        return hangingFetch(url, init);
      },
      timeoutMs: 30,
    },
  );
  assert.ok(Date.now() - started < 1000, "gave up promptly");
  assert.equal(calls, 3 * (UPSTREAM_RETRIES + 1), "each type tried twice");
  assert.equal(answer.status, 502);
  assert.equal(answer.body.upstream, true);
  assert.match(answer.body.error, /vPIC/);
  assert.equal(answer.cache, NO_STORE);

  // Through the handler: the same, with no-store.
  globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) });
  const res = await get({ kind: "models", make: "BMW", year: "2019" });
  assert.equal(res.statusCode, 502);
  assert.equal(res.headers["cache-control"], "no-store");
  assert.equal(res.body.upstream, true);
});

test("models: a slow first answer is retried and the retry's answer used", async () => {
  const seen = new Map();
  const answer = await vehiclesAnswer(
    { kind: "models", make: "BMW", year: "2019" },
    {
      fetchImpl: (url, init) => {
        const n = seen.get(url) ?? 0;
        seen.set(url, n + 1);
        return n === 0 ? hangingFetch(url, init) : vpicFetch(url);
      },
      timeoutMs: 30,
    },
  );
  assert.equal(answer.status, 200);
  assert.ok(answer.body.models.includes("X5"));
});

test("models: when only some vehicle types answer, the list is sent but cached briefly and not remembered", async () => {
  const { calls, fetchImpl } = recordingFetch();
  const flaky = (url, init) =>
    /vehicletype\/mpv/.test(url)
      ? Promise.resolve({ ok: false, status: 500, json: async () => ({}) })
      : fetchImpl(url, init);
  const answer = await vehiclesAnswer({ kind: "models", make: "BMW", year: "2019" }, { fetchImpl: flaky, retries: 0 });
  assert.equal(answer.status, 200);
  assert.equal(answer.body.partial, true);
  assert.equal(answer.cache, CACHE_PARTIAL);
  assert.ok(answer.body.models.includes("4 Series"));
  // The size table's X3 and X5 are still there although vPIC's SUVs failed.
  assert.ok(answer.body.models.includes("X5"));
  const before = calls.length;
  await vehiclesAnswer({ kind: "models", make: "BMW", year: "2019" }, { fetchImpl });
  assert.equal(calls.length, before + 3, "a partial answer is not reused");
});

test("models: a make not sold that year needs no vPIC call", async () => {
  const { calls, fetchImpl } = recordingFetch();
  const answer = await vehiclesAnswer({ kind: "models", make: "Tesla", year: "1995" }, { fetchImpl });
  assert.equal(answer.status, 200);
  assert.deepEqual(answer.body.models, []);
  assert.equal(calls.length, 0);
});

test("models: bad queries are 400s that are never cached", async () => {
  globalThis.fetch = async () => {
    throw new Error("vPIC must not be asked");
  };
  for (const query of [
    { kind: "models", make: "BMW" },
    { kind: "models", make: "BMW", year: "19" },
    { kind: "models", make: "BMW", year: "1900" },
    { kind: "models", make: "BMW", year: "2099" },
    { kind: "models", year: "2019" },
    { kind: "models", make: "Bugatti Veyron Super Sport Vitesse Edition XXL", year: "2019" },
    { kind: "models", make: "../../etc", year: "2019" },
    { kind: "models", make: "Harley-Davidson", year: "2019" },
    { kind: "trims", make: "BMW", year: "2019" },
    {},
  ]) {
    const res = await get(query);
    assert.equal(res.statusCode, 400, JSON.stringify(query));
    assert.equal(res.headers["cache-control"], "no-store");
    assert.ok(res.body.error);
  }
});

test("only GET and HEAD", async () => {
  const res = mockRes();
  await handler({ method: "POST", query: { kind: "makes" } }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, "GET");
});

test("the handler reads the query from the URL when there is no req.query", async () => {
  globalThis.fetch = vpicFetch;
  const res = mockRes();
  await handler({ method: "GET", url: "/api/vehicles?kind=models&make=BMW&year=2019" }, res);
  assert.equal(res.statusCode, 200);
  assert.ok(res.body.models.includes("M3"));
});

// ---- kind=makes ----------------------------------------------------------------

test("makes: the makes sold that year, or every make, cached a day", async () => {
  const res = await get({ kind: "makes", year: "2019" });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.source, "curated");
  assert.equal(res.body.year, "2019");
  assert.ok(res.body.makes.includes("BMW") && res.body.makes.includes("Audi"));
  assert.ok(!res.body.makes.includes("Pontiac"), "not sold in 2019");
  assert.equal(res.body.makes.length, 44);
  assert.equal(res.headers["cache-control"], CACHE_LONG);

  const all = await get({ kind: "makes" });
  assert.equal(all.statusCode, 200);
  assert.equal(all.body.makes.length, 71);
  assert.ok(all.body.makes.includes("Pontiac"));

  const bad = await get({ kind: "makes", year: "abcd" });
  assert.equal(bad.statusCode, 400);
});

// ---- the build's snapshot --------------------------------------------------------

test("snapshot: every listed make's models across all years, when vPIC answers", async () => {
  const { calls, fetchImpl } = recordingFetch();
  const snap = await buildSnapshot({ fetchImpl, concurrency: 4 });
  assert.equal(snap.v, 1);
  assert.equal(snap.years, "all");
  assert.equal(Object.keys(snap.makes).length, 71);
  assert.ok(snap.makes.BMW.includes("4 Series") && snap.makes.BMW.includes("X7"));
  assert.ok(snap.makes.Audi.includes("Q5"));
  assert.ok(snap.makes.Scion.includes("xB"));
  // A make vPIC knows nothing about still carries its size-table models.
  assert.ok(Array.isArray(snap.makes.Yugo));
  // All-year requests: no modelyear in the URL.
  assert.ok(calls.every((u) => !/modelyear/.test(u)));
  assert.equal(calls.length, 1 + 71 * 3, "one probe, then three types per make");
});

test("snapshot: an unreachable vPIC is one probe and no snapshot", async () => {
  let calls = 0;
  const snap = await buildSnapshot({
    fetchImpl: (url, init) => {
      calls += 1;
      return hangingFetch(url, init);
    },
    timeoutMs: 30,
  });
  assert.equal(snap, null);
  assert.equal(calls, 1);
});

test("snapshot: a make whose lists did not all answer is left out", async () => {
  const snap = await buildSnapshot({
    fetchImpl: (url, init) =>
      /make\/BMW\/vehicletype\/truck/.test(url)
        ? Promise.resolve({ ok: false, status: 500, json: async () => ({}) })
        : vpicFetch(url, init),
    retries: 0,
  });
  assert.equal(snap.makes.BMW, undefined);
  assert.ok(snap.makes.Audi);
});
