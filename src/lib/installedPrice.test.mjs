// The installed-price toggle's math and remembered choice.
//
//   npm run test:lib

import { test, afterEach } from "node:test";
import assert from "node:assert/strict";

import { getService } from "../data/services.js";
import { SET_SIZE } from "../data/pricing.js";
import { cleanParams } from "./analytics.js";
import {
  INSTALLED_KEY,
  INSTALL_SERVICE,
  installQuote,
  installedLines,
  installedTotal,
} from "./installedPrice.js";

afterEach(() => {
  delete globalThis.window;
});

test("the install price is the catalog's tire-installation service", () => {
  const svc = getService("tire-installation");
  assert.equal(INSTALL_SERVICE, svc);
  const quote = installQuote();
  assert.equal(quote.price, svc.priceFrom);
  assert.equal(quote.unit, svc.priceUnit);
  assert.equal(quote.from, true, "priceFrom is a starting price");
  assert.equal(quote.perTire, /per tire/.test(svc.priceUnit));
});

test("tire + installation = total, one tire and a set of four", () => {
  const svc = { priceFrom: 30, priceUnit: "per tire" };
  const lines = installedLines(129.99, svc);
  assert.equal(lines.label, "installed from");
  assert.deepEqual(lines.one, { qty: 1, tire: 129.99, install: 30, total: 159.99 });
  assert.deepEqual(lines.set, { qty: SET_SIZE, tire: 519.96, install: 120, total: 639.96 });
});

test("the live catalog price flows through unchanged", () => {
  const p = getService("tire-installation").priceFrom;
  const lines = installedLines(100);
  assert.equal(lines.one.install, p);
  assert.equal(lines.set.install, p * SET_SIZE);
  assert.equal(lines.set.total, 400 + p * SET_SIZE);
});

test("rounds to the cent (no float drift)", () => {
  const t = installedTotal(33.33, installQuote({ priceFrom: 19.99, priceUnit: "per tire" }), 3);
  assert.deepEqual(t, { qty: 3, tire: 99.99, install: 59.97, total: 159.96 });
});

test("a price for the job is counted once, not per tire", () => {
  const t = installedTotal(100, installQuote({ priceFrom: 40, priceUnit: "per service" }), SET_SIZE);
  assert.deepEqual(t, { qty: SET_SIZE, tire: 400, install: 40, total: 440 });
});

test("no usable price shows nothing rather than a made-up one", () => {
  assert.equal(installedLines(100, { priceUnit: "per tire" }), null);
  assert.equal(installedLines(100, null), null);
  assert.equal(installedLines(Number.NaN, { priceFrom: 30, priceUnit: "per tire" }), null);
  assert.equal(installQuote({ priceFrom: -5 }), null);
});

test("the choice is stored under its own key and storage errors are ignored", async () => {
  const store = new Map();
  const events = {};
  globalThis.window = {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, v),
      removeItem: (k) => store.delete(k),
    },
    addEventListener: (t, fn) => (events[t] = fn),
    removeEventListener: () => {},
  };
  // A fresh module copy, so the cached value starts unread.
  const mod = await import(`./installedPrice.js?case=${Date.now()}`);
  assert.equal(mod.getInstalledShown(), false, "off by default");
  let heard = 0;
  const off = mod.subscribeInstalled(() => heard++);
  mod.setInstalledShown(true);
  assert.equal(mod.getInstalledShown(), true);
  assert.deepEqual(JSON.parse(store.get(INSTALLED_KEY)), { v: 1, on: true });
  assert.equal(heard, 1, "subscribers hear the change");
  mod.setInstalledShown(false);
  assert.equal(store.has(INSTALLED_KEY), false);
  // Another tab changing it is heard too.
  store.set(INSTALLED_KEY, JSON.stringify({ v: 1, on: true }));
  events.storage({ key: INSTALLED_KEY });
  assert.equal(mod.getInstalledShown(), true);
  assert.equal(heard, 3);
  off();

  // Storage that throws (private mode): the choice still works for the page.
  globalThis.window.localStorage = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
    removeItem: () => {
      throw new Error("blocked");
    },
  };
  const mod2 = await import(`./installedPrice.js?case=blocked${Date.now()}`);
  assert.equal(mod2.getInstalledShown(), false);
  mod2.setInstalledShown(true);
  assert.equal(mod2.getInstalledShown(), true);
});

test("GA4 keeps the toggle's state and placement", () => {
  assert.deepEqual(cleanParams({ toggle_state: "on", placement: "results", email: "a@b.co" }), {
    toggle_state: "on",
    placement: "results",
  });
});
