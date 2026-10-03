// Run with: npm run test:lib
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  approxFromGeo,
  deniedThisSession,
  fetchApproxLocation,
  geoPermissionState,
  looksLikeIOS,
  rememberDenied,
} from "./geoLocate.js";

test("approxFromGeo: a U.S. ZIP wins, then U.S. coordinates, else nothing", () => {
  assert.deepEqual(
    approxFromGeo({ available: true, country: "US", zip: "33351", lat: 26.1, lng: -80.2, city: "Sunrise" }),
    { zip: "33351", city: "Sunrise" },
  );
  assert.deepEqual(
    approxFromGeo({ available: true, country: "US", zip: null, lat: 25.77, lng: -80.19, city: null }),
    { lat: 25.77, lng: -80.19, city: null },
  );
  assert.equal(approxFromGeo({ available: true, country: "CA", zip: null, lat: 45, lng: -75 }), null);
  assert.equal(approxFromGeo({ available: false }), null);
  assert.equal(approxFromGeo({ available: false, country: "US", zip: "33351" }), null);
  assert.deepEqual(approxFromGeo({ country: "US", zip: "33351" }), { zip: "33351", city: null });
  assert.equal(approxFromGeo(null), null);
  assert.equal(approxFromGeo("<html>"), null);
  assert.equal(approxFromGeo({ available: true, country: "US", zip: "12", lat: 200, lng: 0 }), null);
  assert.equal(approxFromGeo({ available: true, country: "US", zip: 33351 }), null);
});

const json = (body, ok = true) => async () => ({ ok, json: async () => body });

test("fetchApproxLocation: our JSON, or null for every failure", async () => {
  assert.deepEqual(
    await fetchApproxLocation({ fetchImpl: json({ available: true, country: "US", zip: "33351" }) }),
    { zip: "33351", city: null },
  );
  assert.equal(await fetchApproxLocation({ fetchImpl: json({}, false) }), null);
  assert.equal(
    await fetchApproxLocation({
      fetchImpl: async () => ({ ok: true, json: async () => JSON.parse("<!doctype html>") }),
    }),
    null,
  );
  assert.equal(
    await fetchApproxLocation({
      fetchImpl: async () => {
        throw new TypeError("offline");
      },
    }),
    null,
  );
  assert.equal(await fetchApproxLocation({ fetchImpl: undefined }), null);
});

test("fetchApproxLocation: gives up after the timeout", async () => {
  const hang = (_url, { signal }) =>
    new Promise((_, reject) => signal.addEventListener("abort", () => reject(new Error("aborted"))));
  const t0 = Date.now();
  assert.equal(await fetchApproxLocation({ fetchImpl: hang, timeoutMs: 30 }), null);
  assert.ok(Date.now() - t0 < 1000);
});

test("geoPermissionState: the state, or 'prompt' when it can't be asked", async () => {
  const nav = (state) => ({ permissions: { query: async () => ({ state }) } });
  assert.equal(await geoPermissionState(nav("granted")), "granted");
  assert.equal(await geoPermissionState(nav("denied")), "denied");
  assert.equal(await geoPermissionState(nav("weird")), "prompt");
  assert.equal(await geoPermissionState({}), "prompt"); // iOS Safari < 16
  assert.equal(
    await geoPermissionState({
      permissions: {
        query: async () => {
          throw new TypeError("not supported");
        },
      },
    }),
    "prompt",
  );
});

test("looksLikeIOS", () => {
  assert.ok(looksLikeIOS({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)" }));
  assert.ok(looksLikeIOS({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", maxTouchPoints: 5 }));
  assert.ok(!looksLikeIOS({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", maxTouchPoints: 0 }));
  assert.ok(!looksLikeIOS({ userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8)" }));
  assert.ok(!looksLikeIOS(undefined));
});

test("denied is remembered for the session, and storage errors are swallowed", () => {
  const store = new Map();
  const win = {
    sessionStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) },
  };
  assert.equal(deniedThisSession(win), false);
  rememberDenied(win);
  assert.equal(deniedThisSession(win), true);

  const blocked = {
    get sessionStorage() {
      throw new Error("SecurityError");
    },
  };
  assert.equal(deniedThisSession(blocked), false);
  assert.doesNotThrow(() => rememberDenied(blocked));
});
