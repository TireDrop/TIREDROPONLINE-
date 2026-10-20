import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { isStandalone, syncAppModeAttribute } from "./appMode.js";

function fakeDom({ matches = false, navStandalone, attr } = {}) {
  const attrs = new Map(attr ? [["data-app", attr]] : []);
  globalThis.document = {
    documentElement: {
      getAttribute: (k) => (attrs.has(k) ? attrs.get(k) : null),
      setAttribute: (k, v) => attrs.set(k, v),
      removeAttribute: (k) => attrs.delete(k),
    },
  };
  globalThis.window = {
    navigator: { standalone: navStandalone },
    matchMedia: (q) => ({ matches: q === "(display-mode: standalone)" && matches }),
  };
  return attrs;
}

beforeEach(() => {
  delete globalThis.window;
  delete globalThis.document;
});

test("false with no window (prerender)", () => {
  assert.equal(isStandalone(), false);
  assert.equal(syncAppModeAttribute(), false);
});

test("a browser tab is not standalone", () => {
  const attrs = fakeDom();
  assert.equal(isStandalone(), false);
  assert.equal(syncAppModeAttribute(), false);
  assert.equal(attrs.has("data-app"), false);
});

test("display-mode standalone", () => {
  const attrs = fakeDom({ matches: true });
  assert.equal(isStandalone(), true);
  assert.equal(syncAppModeAttribute(), true);
  assert.equal(attrs.get("data-app"), "standalone");
});

test("iOS navigator.standalone", () => {
  const attrs = fakeDom({ navStandalone: true });
  assert.equal(syncAppModeAttribute(), true);
  assert.equal(attrs.get("data-app"), "standalone");
});

test("navigator.standalone false is not standalone", () => {
  fakeDom({ navStandalone: false });
  assert.equal(isStandalone(), false);
});

test("an existing data-app=standalone counts", () => {
  const attrs = fakeDom({ attr: "standalone" });
  assert.equal(isStandalone(), true);
  assert.equal(syncAppModeAttribute(), true);
  assert.equal(attrs.get("data-app"), "standalone");
});

test("matchMedia that throws is treated as a browser tab", () => {
  fakeDom();
  globalThis.window.matchMedia = () => {
    throw new Error("nope");
  };
  assert.equal(isStandalone(), false);
});
