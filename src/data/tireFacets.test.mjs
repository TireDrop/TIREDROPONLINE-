import { test } from "node:test";
import assert from "node:assert/strict";

import { TIRES } from "./products.js";
import { EMPTY_TIRE_FILTERS } from "../lib/tiresUrl.js";
import {
  facetCounts,
  loadIndexOf,
  loadRangeOf,
  matchesFilters,
  runFlatOf,
  seasonOf,
  typesOf,
  warrantyMilesOf,
} from "./tireFacets.js";

const byId = (id) => TIRES.find((t) => t.id === id);
const F = (patch = {}) => ({ ...EMPTY_TIRE_FILTERS, ...patch });

test("every catalog tire reads a season or says nothing (never a guess)", () => {
  assert.equal(seasonOf(byId("t-cont-truecontact-tour")), "all-season");
  assert.equal(seasonOf(byId("t-pirelli-pzero-pz4")), "summer");
  assert.equal(seasonOf(byId("t-cont-vikingcontact-7")), "winter");
  assert.equal(seasonOf(byId("t-pirelli-sottozero-3")), "winter");
  assert.equal(seasonOf(byId("t-michelin-agilis-crossclimate")), "all-weather");
  assert.equal(seasonOf(byId("t-cont-terraincontact-at")), "all-season");
  // "Hybrid all-terrain / mud-terrain" states no season.
  assert.equal(seasonOf(byId("t-nitto-ridge-grappler")), null);
});

test("types", () => {
  assert.deepEqual(typesOf(byId("t-cont-purecontact-ls")), ["touring"]);
  assert.deepEqual(typesOf(byId("t-cont-crosscontact-lx25")), ["highway"]);
  assert.deepEqual(typesOf(byId("t-cont-terraincontact-at")), ["all-terrain"]);
  assert.deepEqual(typesOf(byId("t-nitto-ridge-grappler")), ["all-terrain", "mud-terrain"]);
  assert.deepEqual(typesOf(byId("t-nitto-motivo")), ["performance"]);
  assert.deepEqual(typesOf(byId("t-cont-vancontact-as")), ["commercial"]);
  assert.deepEqual(typesOf(byId("t-cont-vikingcontact-7")), []);
});

test("load, load range, run-flat, warranty parse carefully", () => {
  assert.equal(loadIndexOf(byId("t-cont-vancontact-as")), 120); // "120/116"
  assert.equal(loadIndexOf({ loadIndex: "" }), null);
  assert.equal(loadRangeOf(byId("t-nitto-ridge-grappler")), "E");
  assert.equal(loadRangeOf(byId("t-cont-truecontact-tour")), null);
  assert.equal(runFlatOf(byId("t-cont-truecontact-tour")), false);
  assert.equal(runFlatOf(byId("t-cont-vancontact-as")), null); // unstated
  assert.equal(warrantyMilesOf(byId("t-cont-truecontact-tour")), 80000);
  assert.equal(warrantyMilesOf(byId("t-michelin-agilis-crossclimate")), 60000);
  assert.equal(warrantyMilesOf(byId("t-nitto-nt555-g2")), 0);
  assert.equal(warrantyMilesOf(byId("t-cont-vikingcontact-7")), 0);
  assert.equal(warrantyMilesOf({ warranty: "" }), null);
  assert.equal(warrantyMilesOf({ warranty: "Limited warranty" }), null);
});

test("filters narrow by minimums and lists", () => {
  const n = (f) => TIRES.filter((t) => matchesFilters(t, F(f))).length;
  assert.equal(n({}), TIRES.length);
  assert.ok(n({ speed: "H" }) < TIRES.length);
  assert.ok(TIRES.filter((t) => matchesFilters(t, F({ speed: "V" }))).every((t) => ["V", "W", "Y"].includes(t.speedRating)));
  assert.ok(TIRES.filter((t) => matchesFilters(t, F({ warranty: "70000" }))).every((t) => warrantyMilesOf(t) >= 70000));
  assert.equal(n({ seasons: ["summer"], types: ["touring"] }), 0);
  assert.ok(TIRES.filter((t) => matchesFilters(t, F({ minPrice: "150", maxPrice: "200" }))).every((t) => t.price >= 150 && t.price <= 200));
});

test("facet counts: only data-backed options, a group never narrows its own counts", () => {
  const all = facetCounts(TIRES, F());
  assert.equal(all.runFlat, null, "no run-flat tire in the catalog, so no run-flat filter");
  assert.deepEqual(all.loadRanges.map((o) => o.value), ["E"]);
  assert.deepEqual(all.seasons.map((o) => o.value), ["all-season", "all-weather", "summer", "winter"]);
  const brandTotal = all.brands.reduce((s, o) => s + o.count, 0);
  assert.equal(brandTotal, TIRES.length);

  const nitto = facetCounts(TIRES, F({ brands: ["Nitto"] }));
  // Brand counts ignore the brand filter, so Continental still shows its own.
  assert.equal(nitto.brands.find((o) => o.value === "Continental").count, 7);
  // Other groups count within Nitto.
  assert.equal(nitto.types.find((o) => o.value === "performance").count, 2);

  // Without season data (a live distributor item) there is no season group.
  const live = facetCounts([{ brand: "X", size: "225/45R17", price: 100, speedRating: "V", loadIndex: "94" }], F());
  assert.equal(live.seasons, null);
  assert.equal(live.types, null);
  assert.equal(live.warranty, null);
  assert.equal(live.speed, null, "one rating: nothing to filter");
});
