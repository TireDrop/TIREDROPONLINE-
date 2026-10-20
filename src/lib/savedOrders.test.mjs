// Saved orders: what is kept on the device, and that bad storage never breaks it.
//
//   npm run test:lib

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import {
  MAX_LABEL,
  MAX_SAVED_ORDERS,
  SAVED_ORDERS_KEY,
  canSaveOrders,
  forgetAll,
  forgetOrder,
  listSaved,
  normalizeOrder,
  saveOrder,
} from "./savedOrders.js";

function memoryStorage() {
  const map = new Map();
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
  };
}

let store;
beforeEach(() => {
  store = memoryStorage();
  globalThis.localStorage = store;
});
afterEach(() => {
  delete globalThis.localStorage;
});

test("the storage key is the contract", () => {
  assert.equal(SAVED_ORDERS_KEY, "tiredrop.orders.v1");
});

test("save, list and forget one order", () => {
  assert.deepEqual(listSaved(), []);
  const first = saveOrder({ order: "1001", email: " Buyer@Example.com ", label: "  Camry   tires " });
  assert.equal(first.ok, true);
  assert.deepEqual(listSaved(), [{ order: "#1001", email: "buyer@example.com", label: "Camry tires" }]);
  saveOrder({ order: "td-260929-hjk234", email: "buyer@example.com" });
  assert.deepEqual(
    listSaved().map((o) => o.order),
    ["TD-260929-HJK234", "#1001"],
    "newest first",
  );
  assert.deepEqual(forgetOrder("#1001").map((o) => o.order), ["TD-260929-HJK234"]);
  assert.deepEqual(forgetOrder("1001").map((o) => o.order), ["TD-260929-HJK234"], "forgetting an unknown order changes nothing");
  forgetAll();
  assert.deepEqual(listSaved(), []);
  assert.equal(store.map.size, 0, "nothing is left in storage");
});

test("only the order, the email and an optional label are stored", () => {
  saveOrder({ order: "#7", email: "a@b.co", label: "Mine", name: "Jo", phone: "9545550100", token: "x" });
  saveOrder({ order: "#8", email: "a@b.co" });
  const raw = JSON.parse(store.getItem(SAVED_ORDERS_KEY));
  assert.deepEqual(Object.keys(raw), ["orders"]);
  assert.deepEqual(raw.orders, [{ order: "#8", email: "a@b.co" }, { order: "#7", email: "a@b.co", label: "Mine" }]);
});

test("the same order again replaces its entry instead of duplicating it", () => {
  saveOrder({ order: "#1001", email: "old@example.com", label: "Old" });
  saveOrder({ order: "1001", email: "new@example.com" });
  assert.deepEqual(listSaved(), [{ order: "#1001", email: "new@example.com" }]);
});

test("invalid input is refused, a long label is cut", () => {
  for (const bad of [
    { order: "", email: "a@b.co" },
    { order: "1001 OR tag:vip", email: "a@b.co" },
    { order: "#1001", email: "nope" },
    { order: "#1001" },
  ]) {
    assert.deepEqual(saveOrder(bad), { ok: false, reason: "invalid" });
  }
  assert.deepEqual(listSaved(), []);
  saveOrder({ order: "#1", email: "a@b.co", label: "x".repeat(200) });
  assert.equal(listSaved()[0].label.length, MAX_LABEL);
});

test("at most ten orders: the eleventh is refused, not a silent drop", () => {
  for (let i = 1; i <= MAX_SAVED_ORDERS; i += 1) assert.equal(saveOrder({ order: `#${i}`, email: "a@b.co" }).ok, true);
  assert.deepEqual(saveOrder({ order: "#99", email: "a@b.co" }), { ok: false, reason: "full" });
  assert.equal(listSaved().length, MAX_SAVED_ORDERS);
  assert.equal(saveOrder({ order: "#3", email: "c@d.co" }).ok, true, "updating one that is saved still works");
  forgetOrder("#1");
  assert.equal(saveOrder({ order: "#99", email: "a@b.co" }).ok, true);
});

test("damaged or hostile storage reads as empty and is never trusted", () => {
  for (const raw of ["not json", "null", "[]", '{"orders":"x"}', '{"orders":[null,1,{"order":"#1"},{"order":"<script>","email":"a@b.co"}]}']) {
    store.setItem(SAVED_ORDERS_KEY, raw);
    assert.deepEqual(listSaved(), [], raw);
  }
  store.setItem(SAVED_ORDERS_KEY, JSON.stringify({ orders: [{ order: "1001", email: "A@B.CO", label: 5, extra: "x" }, { order: "#1001", email: "a@b.co" }] }));
  assert.deepEqual(listSaved(), [{ order: "#1001", email: "a@b.co" }], "cleaned and de-duplicated");
});

test("blocked storage (private mode) never throws", () => {
  const blocked = () => {
    throw new DOMException("The operation is insecure.", "SecurityError");
  };
  Object.defineProperty(globalThis, "localStorage", { get: blocked, configurable: true });
  assert.deepEqual(listSaved(), []);
  assert.deepEqual(saveOrder({ order: "#1", email: "a@b.co" }), { ok: false, reason: "storage" });
  assert.deepEqual(forgetOrder("#1"), []);
  assert.deepEqual(forgetAll(), []);
  assert.equal(canSaveOrders(), false);
  delete globalThis.localStorage;
  assert.equal(canSaveOrders(), false, "no storage at all (prerender)");
  assert.deepEqual(listSaved(), []);
});

test("a full disk is a refused save, not a crash", () => {
  store.setItem = () => {
    throw new DOMException("quota", "QuotaExceededError");
  };
  assert.deepEqual(saveOrder({ order: "#1", email: "a@b.co" }), { ok: false, reason: "storage" });
  assert.equal(canSaveOrders(), false);
});

test("normalizeOrder", () => {
  assert.equal(normalizeOrder(" no. 1001"), "#1001");
  assert.equal(normalizeOrder("TD-260929-ABC234"), "TD-260929-ABC234");
  assert.equal(normalizeOrder("TD-260929-ABC230"), null, "0 is not in the reference alphabet");
  assert.equal(normalizeOrder(undefined), null);
});
