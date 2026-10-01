// The saved fitment selection (tiredrop.fitment.v1): a door-jamb size the
// shopper confirmed, with an optional rear size, survives a save and a load;
// entries from before `rear` existed still read.
//   node --test src/data/fitment*.test.mjs   (npm run test:fitment)
import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";

import { loadSelection, saveSelection } from "./vehicles.js";

const KEY = "tiredrop.fitment.v1";
let store;

beforeEach(() => {
  store = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
  };
});
afterEach(() => {
  delete globalThis.window;
});

test("a staggered door-jamb size on a vehicle is kept, front and rear", () => {
  const saved = saveSelection({
    type: "vehicle",
    year: "2019",
    make: "BMW",
    model: "3 Series",
    size: "225/40R19",
    rear: "255/35R19",
  });
  assert.deepEqual(saved, {
    type: "vehicle",
    year: "2019",
    make: "BMW",
    model: "3 Series",
    size: "225/40R19",
    rear: "255/35R19",
  });
  assert.deepEqual(loadSelection(), saved);
});

test("a rear size alone is not a confirmed size and is dropped", () => {
  const saved = saveSelection({
    type: "vehicle",
    year: "2019",
    make: "BMW",
    model: "3 Series",
    rear: "255/35R19",
  });
  assert.equal(saved.rear, undefined);
});

test("size-only keeps a rear size too", () => {
  saveSelection({ type: "size", size: "225/40R19", rear: "255/35R19" });
  assert.deepEqual(loadSelection(), {
    type: "size",
    size: "225/40R19",
    rear: "255/35R19",
  });
});

test("an entry saved before `rear` existed still reads the same", () => {
  store.set(
    KEY,
    JSON.stringify({ type: "vehicle", year: "2019", make: "Ford", model: "F-150", size: "LT275/65R18" }),
  );
  assert.deepEqual(loadSelection(), {
    type: "vehicle",
    year: "2019",
    make: "Ford",
    model: "F-150",
    size: "LT275/65R18",
  });
});
