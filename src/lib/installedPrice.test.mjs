// The installed-price toggle's math and remembered choice.
//
//   npm run test:lib

import { test, afterEach } from "node:test";
import assert from "node:assert/strict";

import { getService } from "../data/services.js";
import { SET_SIZE } from "../data/pricing.js";
import { cleanParams } from "./analytics.js";
import { INSTALLED_DEFAULT_FOR_LOCAL } from "../data/installedDefault.js";
import {
  INSTALLED_KEY,
  INSTALL_SERVICE,
  areaFromApprox,
  createInstalledStore,
  decideInstalled,
  parsePreviewFlag,
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

/* ---------------- the local default (off in production) ---------------- */

test("production ships with the local default OFF", () => {
  assert.equal(INSTALLED_DEFAULT_FOR_LOCAL, false);
});

test("decideInstalled: switch off, on and in area, on and out of area, unknown", () => {
  // Switch off: never on by default, in the area or not.
  assert.deepEqual(decideInstalled({ defaultOn: false, inArea: true }), { on: false, source: "off" });
  assert.deepEqual(decideInstalled({ defaultOn: false, inArea: false }), { on: false, source: "off" });
  // Switch on: only a known in-area visitor.
  assert.deepEqual(decideInstalled({ defaultOn: true, inArea: true }), { on: true, source: "default-local" });
  assert.deepEqual(decideInstalled({ defaultOn: true, inArea: false }), { on: false, source: "off" });
  assert.deepEqual(decideInstalled({ defaultOn: true, inArea: null }), { on: false, source: "off" });
  assert.deepEqual(decideInstalled({}), { on: false, source: "off" });
});

test("decideInstalled: the visitor's own choice wins, both ways", () => {
  assert.deepEqual(decideInstalled({ choice: false, defaultOn: true, inArea: true }), { on: false, source: "visitor" });
  assert.deepEqual(decideInstalled({ choice: true, defaultOn: true, inArea: false }), { on: true, source: "visitor" });
  assert.deepEqual(decideInstalled({ choice: true, defaultOn: false, inArea: null }), { on: true, source: "visitor" });
  assert.deepEqual(decideInstalled({ choice: false, preview: "local" }), { on: false, source: "visitor" });
});

test("decideInstalled: the preview flag", () => {
  // local = switch on AND in the area, whatever the real switch and location.
  assert.deepEqual(decideInstalled({ preview: "local", defaultOn: false, inArea: false }), { on: true, source: "preview" });
  // off forces off, even over a remembered choice.
  assert.deepEqual(decideInstalled({ preview: "off", choice: true, defaultOn: true, inArea: true }), { on: false, source: "preview" });
});

test("parsePreviewFlag reads only local and off", () => {
  assert.equal(parsePreviewFlag("?installed=local"), "local");
  assert.equal(parsePreviewFlag("?a=1&installed=off"), "off");
  assert.equal(parsePreviewFlag("?installed=on"), null);
  assert.equal(parsePreviewFlag("?installed="), null);
  assert.equal(parsePreviewFlag(""), null);
  assert.equal(parsePreviewFlag(undefined), null);
});

test("areaFromApprox uses a ZIP only; coordinates alone are unknown", () => {
  assert.equal(areaFromApprox({ zip: "33351" }), true); // Sunrise, Broward
  assert.equal(areaFromApprox({ zip: "33139" }), true); // Miami Beach
  assert.equal(areaFromApprox({ zip: "33040" }), false); // Key West is excluded
  assert.equal(areaFromApprox({ zip: "10001" }), false);
  assert.equal(areaFromApprox({ lat: 26.1, lng: -80.2 }), null);
  assert.equal(areaFromApprox(null), null);
});

/** A fake browser window: Maps for both storages, an address-bar query. */
function fakeWindow({ search = "", ls = new Map(), ss = new Map(), blocked = false } = {}) {
  const box = (m) => ({
    getItem: (k) => {
      if (blocked) throw new Error("blocked");
      return m.has(k) ? m.get(k) : null;
    },
    setItem: (k, v) => {
      if (blocked) throw new Error("blocked");
      m.set(k, v);
    },
    removeItem: (k) => {
      if (blocked) throw new Error("blocked");
      m.delete(k);
    },
  });
  return { location: { search }, localStorage: box(ls), sessionStorage: box(ss), addEventListener() {}, removeEventListener() {}, ls, ss };
}

const tick = () => new Promise((r) => setTimeout(r, 0));
const approx = (zip) => async () => (zip ? { zip, city: null, region: "FL" } : null);

test("store, switch off: never looks the visitor up and stays off", async () => {
  let asked = 0;
  const win = fakeWindow();
  const st = createInstalledStore({ defaultOn: false, getWindow: () => win, lookupApprox: async () => (asked++, { zip: "33351" }) });
  assert.equal(st.getShown(), false);
  const off = st.subscribe(() => {});
  await tick();
  assert.equal(asked, 0, "no /api/geo call when the switch is off");
  assert.equal(st.getShown(), false);
  off();
});

test("store, switch on and in area: starts on after the lookup, once, and says why", async () => {
  let asked = 0;
  const win = fakeWindow();
  const st = createInstalledStore({ defaultOn: true, getWindow: () => win, lookupApprox: async () => (asked++, { zip: "33351" }) });
  assert.equal(st.getShown(), false, "off until the location is known");
  let heard = 0;
  st.subscribe(() => heard++);
  st.subscribe(() => {});
  await tick();
  assert.equal(asked, 1);
  assert.equal(st.getShown(), true);
  assert.equal(st.getSource(), "default-local");
  assert.equal(heard, 1);
  assert.equal(win.ss.get("tiredrop.area.v1"), "in", "remembered for this tab");
  assert.equal(win.ls.size, 0, "the default itself stores nothing in localStorage");
});

test("store, switch on, a later page: the remembered area answers with no lookup", async () => {
  let asked = 0;
  const win = fakeWindow({ ss: new Map([["tiredrop.area.v1", "in"]]) });
  const st = createInstalledStore({ defaultOn: true, getWindow: () => win, lookupApprox: async () => (asked++, null) });
  assert.equal(st.getShown(), true);
  st.subscribe(() => {});
  await tick();
  assert.equal(asked, 0);
});

test("store, switch on and out of area: stays off and remembers that", async () => {
  const win = fakeWindow();
  const st = createInstalledStore({ defaultOn: true, getWindow: () => win, lookupApprox: approx("10001") });
  st.subscribe(() => {});
  await tick();
  assert.equal(st.getShown(), false);
  assert.equal(win.ss.get("tiredrop.area.v1"), "out");
});

test("store, switch on and location unknown: stays off, nothing remembered", async () => {
  const win = fakeWindow();
  const st = createInstalledStore({ defaultOn: true, getWindow: () => win, lookupApprox: approx(null) });
  st.subscribe(() => {});
  await tick();
  assert.equal(st.getShown(), false);
  assert.equal(win.ss.size, 0);
  // A lookup that throws is unknown too.
  const st2 = createInstalledStore({ defaultOn: true, getWindow: () => win, lookupApprox: async () => { throw new Error("net"); } });
  st2.subscribe(() => {});
  await tick();
  assert.equal(st2.getShown(), false);
});

test("store: a remembered choice, on or off, beats the default and skips the lookup", async () => {
  for (const [stored, want] of [[true, true], [false, false]]) {
    let asked = 0;
    const win = fakeWindow({ ls: new Map([[INSTALLED_KEY, JSON.stringify({ v: 1, on: stored })]]), ss: new Map() });
    const st = createInstalledStore({ defaultOn: true, getWindow: () => win, lookupApprox: async () => (asked++, { zip: "33351" }) });
    assert.equal(st.getShown(), want);
    assert.equal(st.getSource(), "visitor");
    st.subscribe(() => {});
    await tick();
    assert.equal(asked, 0, "no lookup once the visitor has chosen");
    assert.equal(st.getShown(), want);
  }
});

test("store: turning an on default off is remembered as a choice (switch on only)", async () => {
  const win = fakeWindow({ ss: new Map([["tiredrop.area.v1", "in"]]) });
  const st = createInstalledStore({ defaultOn: true, getWindow: () => win });
  assert.equal(st.getShown(), true);
  st.set(false);
  assert.equal(st.getShown(), false);
  assert.deepEqual(JSON.parse(win.ls.get(INSTALLED_KEY)), { v: 1, on: false });
  // A new page load: the remembered "off" beats the in-area default.
  const again = createInstalledStore({ defaultOn: true, getWindow: () => win });
  assert.equal(again.getShown(), false);
  // With the switch off, "off" still just removes the key, as before.
  const plain = fakeWindow({ ls: new Map([[INSTALLED_KEY, JSON.stringify({ v: 1, on: true })]]) });
  const st2 = createInstalledStore({ defaultOn: false, getWindow: () => plain });
  st2.set(false);
  assert.equal(plain.ls.has(INSTALLED_KEY), false);
});

test("store: storage blocked: off, no throw, the choice lasts for the page", async () => {
  const win = fakeWindow({ blocked: true });
  const st = createInstalledStore({ defaultOn: true, getWindow: () => win, lookupApprox: approx("33351") });
  assert.equal(st.getShown(), false);
  st.subscribe(() => {});
  await tick();
  assert.equal(st.getShown(), true, "the lookup still works; only the memory is lost");
  st.set(false);
  assert.equal(st.getShown(), false);
  st.set(true);
  assert.equal(st.getShown(), true);
  // No window at all (the server): off, and nothing throws.
  const srv = createInstalledStore({ defaultOn: true, getWindow: () => undefined });
  assert.equal(srv.getShown(), false);
  srv.subscribe(() => {})();
});

test("store, ?installed=local: on at once, no lookup, nothing stored; the visitor can still turn it off", async () => {
  let asked = 0;
  const win = fakeWindow({ search: "?installed=local" });
  const st = createInstalledStore({ defaultOn: false, getWindow: () => win, lookupApprox: async () => (asked++, { zip: "10001" }) });
  assert.equal(st.getShown(), true);
  assert.equal(st.getSource(), "preview");
  st.subscribe(() => {});
  await tick();
  assert.equal(asked, 0);
  st.set(false);
  assert.equal(st.getShown(), false);
  st.set(true);
  assert.equal(win.ls.size + win.ss.size, 0, "the preview flag stores nothing, even when pressed");
});

test("store, ?installed=off: forced off over a remembered on, until the visitor presses it", () => {
  const win = fakeWindow({ search: "?installed=off", ls: new Map([[INSTALLED_KEY, JSON.stringify({ v: 1, on: true })]]) });
  const st = createInstalledStore({ defaultOn: true, getWindow: () => win });
  assert.equal(st.getShown(), false);
  st.set(true);
  assert.equal(st.getShown(), true);
});
