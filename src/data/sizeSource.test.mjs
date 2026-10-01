// What checkout sends as `fitment` (src/data/sizeSource.js).

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const { fitmentPayload, noteSizeSource } = await import("./sizeSource.js");
const { resolveSelection } = await import("./fitmentCheck.js");

beforeEach(() => store.clear());

test("nothing chosen: nothing sent", () => {
  assert.equal(fitmentPayload(resolveSelection(null)), null);
});

test("a scanned staggered sticker saved with the car is 'scan-door'", () => {
  noteSizeSource("scan-door", "225/40R19", "255/35R19");
  const resolved = resolveSelection({ type: "vehicle", year: "2021", make: "BMW", model: "M340i", size: "225/40R19", rear: "255/35R19" });
  assert.deepEqual(fitmentPayload(resolved), {
    vehicle: "2021 BMW M340i",
    front: "225/40R19",
    rear: "255/35R19",
    source: "scan-door",
  });
});

test("a note for other sizes is ignored: the selection says where the size came from", () => {
  noteSizeSource("scan-sidewall", "245/75R16");
  assert.equal(fitmentPayload(resolveSelection({ type: "size", size: "225/45R17" })).source, "typed");
  assert.equal(
    fitmentPayload(resolveSelection({ type: "vehicle", year: "2019", make: "Toyota", model: "Camry" })).source,
    "vehicle",
  );
  assert.equal(
    fitmentPayload(resolveSelection({ type: "vehicle", year: "2019", make: "Toyota", model: "Camry", size: "215/55R17" })).source,
    "door-jamb",
  );
});

test("a vehicle with no size on file sends the vehicle only", () => {
  assert.deepEqual(fitmentPayload(resolveSelection({ type: "vehicle", year: "2019", make: "BMW", model: "4 Series" })), {
    vehicle: "2019 BMW 4 Series",
    source: "vehicle",
  });
});

test("unknown sources and bad sizes are never noted", () => {
  noteSizeSource("hacked", "225/45R17");
  noteSizeSource("typed", "not a size");
  assert.equal(store.size, 0);
});
