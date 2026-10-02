import { test } from "node:test";
import assert from "node:assert/strict";

import {
  EMPTY_TIRE_FILTERS,
  paramToSize,
  parseTiresQuery,
  selectionKey,
  serializeTiresQuery,
  sizeToParam,
  slug,
  searchTitle,
} from "./tiresUrl.js";

const VOCAB = {
  brands: ["BFGoodrich", "Continental", "Michelin", "Nitto"],
  categories: ["All-Season", "Performance", "Truck & SUV", "Winter"],
  makes: ["Ford", "Land Rover", "Mercedes-Benz", "Toyota"],
  models: (make) =>
    ({
      Ford: ["F-150", "Explorer"],
      "Land Rover": ["Range Rover Sport"],
      Toyota: ["4Runner", "Tacoma"],
    })[make] ?? [],
};

const parse = (q) => parseTiresQuery(q, VOCAB);

test("size formats: 265/70R17, 265-70r17, LT265/70R17, ZR, flotation", () => {
  assert.equal(paramToSize("265/70R17"), "265/70R17");
  assert.equal(paramToSize("265-70r17"), "265/70R17");
  assert.equal(paramToSize(" 265-70R17 "), "265/70R17");
  assert.equal(paramToSize("LT265/70R17"), "LT265/70R17");
  assert.equal(paramToSize("lt265-70r17"), "LT265/70R17");
  assert.equal(paramToSize("P225/45R17"), "225/45R17");
  assert.equal(paramToSize("245/40ZR18"), "245/40R18");
  assert.equal(paramToSize("31x10.50r15"), "31x10.50R15LT");
  assert.equal(paramToSize("31x10.50r15lt"), "31x10.50R15LT");

  assert.equal(sizeToParam("265/70R17"), "265-70r17");
  assert.equal(sizeToParam("LT265/70R17"), "lt265-70r17");
  assert.equal(sizeToParam("31x10.50R15LT"), "31x10.50r15lt");
});

test("bad sizes are ignored", () => {
  for (const bad of [
    "",
    "banana",
    "265-70r17-junk",
    "999-99r99",
    "265/70",
    "<script>",
    "265-70r17".repeat(4),
    null,
    undefined,
  ]) {
    assert.equal(paramToSize(bad), null, String(bad));
  }
  assert.equal(sizeToParam("nope"), "");
});

test("vehicle round-trip in readable form", () => {
  const sel = { type: "vehicle", year: "2019", make: "Ford", model: "F-150" };
  const qs = serializeTiresQuery({ selection: sel });
  assert.equal(qs, "year=2019&make=ford&model=f-150");
  assert.deepEqual(parse(qs).selection, sel);

  const lr = { type: "vehicle", year: "2021", make: "Land Rover", model: "Range Rover Sport" };
  const lrq = serializeTiresQuery({ selection: lr });
  assert.equal(lrq, "year=2021&make=land+rover&model=range+rover+sport");
  assert.deepEqual(parse(lrq).selection, lr);
  // Slug spellings resolve too.
  assert.deepEqual(parse("year=2021&make=land-rover&model=range-rover-sport").selection, lr);
});

test("a vehicle the lists do not know is title-cased, not dropped", () => {
  assert.deepEqual(parse("year=2020&make=ford&model=bronco+sport").selection, {
    type: "vehicle",
    year: "2020",
    make: "Ford",
    model: "Bronco Sport",
  });
  assert.deepEqual(parseTiresQuery("year=2020&make=rivian&model=r1t").selection, {
    type: "vehicle",
    year: "2020",
    make: "Rivian",
    model: "R1t",
  });
});

test("size and vehicle-with-size round-trip", () => {
  const size = { type: "size", size: "265/70R17" };
  assert.equal(serializeTiresQuery({ selection: size }), "size=265-70r17");
  assert.deepEqual(parse("size=265-70r17").selection, size);
  assert.deepEqual(parse("size=265/70R17").selection, size);
  assert.deepEqual(parse("size=LT265/70R17").selection, { type: "size", size: "LT265/70R17" });

  const withSize = { type: "vehicle", year: "2019", make: "Ford", model: "F-150", size: "LT275/65R18" };
  const q = serializeTiresQuery({ selection: withSize });
  assert.equal(q, "year=2019&make=ford&model=f-150&size=lt275-65r18");
  assert.deepEqual(parse(q).selection, withSize);
});

test("a staggered door-jamb entry carries its rear size", () => {
  const veh = { type: "vehicle", year: "2019", make: "Ford", model: "F-150", size: "275/40R20", rear: "315/35R20" };
  const q = serializeTiresQuery({ selection: veh });
  assert.equal(q, "year=2019&make=ford&model=f-150&size=275-40r20&rear=315-35r20");
  assert.deepEqual(parse(q).selection, veh);
  const size = { type: "size", size: "225/40R19", rear: "255/35R19" };
  assert.equal(serializeTiresQuery({ selection: size }), "size=225-40r19&rear=255-35r19");
  assert.deepEqual(parse("size=225-40r19&rear=255-35r19").selection, size);
  // A rear size alone is not a selection; one is part of the key.
  assert.equal(parse("rear=255-35r19").selection, null);
  assert.notEqual(selectionKey(size), selectionKey({ type: "size", size: "225/40R19" }));
  assert.equal(parse("fit=sticker").fit, "sticker");
});

test("bad vehicles are ignored", () => {
  for (const q of [
    "year=19&make=ford&model=f-150",
    "year=1850&make=ford",
    "year=2999&make=ford",
    "year=2019",
    "year=2019&make=<b>&model=x",
    `year=2019&make=ford&model=${"x".repeat(80)}`,
    "make=ford&model=f-150",
  ]) {
    assert.equal(parse(q).selection, null, q);
  }
});

test("legacy keys are read: vy/vmk/vmd, brands, cats, dia, minp/maxp", () => {
  const s = parse("vy=2019&vmk=Ford&vmd=F-150&brands=Continental,Nitto&cats=Truck%20%26%20SUV&dia=17,18&minp=100&maxp=250");
  assert.deepEqual(s.selection, { type: "vehicle", year: "2019", make: "Ford", model: "F-150" });
  assert.deepEqual(s.filters.brands, ["Continental", "Nitto"]);
  assert.deepEqual(s.filters.categories, ["Truck & SUV"]);
  assert.deepEqual(s.filters.diameters, [17, 18]);
  assert.equal(s.filters.minPrice, "100");
  assert.equal(s.filters.maxPrice, "250");
  assert.equal(
    serializeTiresQuery(s),
    "year=2019&make=ford&model=f-150&brand=continental,nitto&category=truck-suv&price=100-250&rim=17,18",
  );
  // The home page tiles' readable single category.
  assert.deepEqual(parse("category=All-Season").filters.categories, ["All-Season"]);
});

test("filters round-trip", () => {
  const state = {
    selection: { type: "size", size: "265/70R17" },
    filters: {
      ...EMPTY_TIRE_FILTERS,
      seasons: ["all-season"],
      types: ["all-terrain", "mud-terrain"],
      brands: ["BFGoodrich", "Michelin"],
      categories: ["Truck & SUV"],
      diameters: [17],
      minPrice: "100",
      maxPrice: "250",
      speed: "H",
      load: "110",
      loadRanges: ["E"],
      runFlat: true,
      warranty: "60000",
    },
    partial: { width: "", aspect: "", diameter: "" },
    sort: "price-asc",
    view: "",
    search: "",
    fit: "",
    tracking: [],
  };
  const qs = serializeTiresQuery(state);
  assert.equal(
    qs,
    "size=265-70r17&season=all-season&type=all-terrain,mud-terrain&brand=bfgoodrich,michelin&category=truck-suv&price=100-250&speed=h&load=110&load_range=e&runflat=1&warranty=60000&rim=17&sort=price-asc",
  );
  assert.deepEqual(parse(qs), state);
  assert.equal(serializeTiresQuery(parse(qs)), qs, "stable");
});

test("open-ended prices, 60k warranty, recommended sort", () => {
  const a = parse("price=100-&warranty=60k&sort=recommended");
  assert.equal(a.filters.minPrice, "100");
  assert.equal(a.filters.maxPrice, "");
  assert.equal(a.filters.warranty, "60000");
  assert.equal(a.sort, "best");
  assert.equal(serializeTiresQuery(a), "price=100-&warranty=60000");
  assert.equal(parse("price=-250").filters.maxPrice, "250");
  // Swapped bounds are put right.
  const b = parse("price=300-100");
  assert.deepEqual([b.filters.minPrice, b.filters.maxPrice], ["100", "300"]);
});

test("unknown and malformed params are dropped, never guessed", () => {
  const s = parse(
    "season=monsoon,winter&type=hover&brand=acme,nitto&category=nope&rim=7,17,abc&price=cheap&speed=z9&load=9999&load_range=q,e&runflat=maybe&warranty=lots&sort=random&view=grid&search=x&utm_source=mail&fit=evil",
  );
  assert.deepEqual(s.filters.seasons, ["winter"]);
  assert.deepEqual(s.filters.types, []);
  assert.deepEqual(s.filters.brands, ["Nitto"]);
  assert.deepEqual(s.filters.categories, []);
  assert.deepEqual(s.filters.diameters, [17]);
  assert.equal(s.filters.minPrice, "");
  assert.equal(s.filters.speed, "");
  assert.equal(s.filters.load, "");
  assert.deepEqual(s.filters.loadRanges, ["E"]);
  assert.equal(s.filters.runFlat, false);
  assert.equal(s.filters.warranty, "");
  assert.equal(s.sort, "best");
  assert.equal(s.view, "");
  assert.equal(s.search, "");
  assert.equal(s.fit, "");
  // Campaign ids are analytics', so they stay as they came.
  assert.equal(serializeTiresQuery(s), "season=winter&brand=nitto&load_range=e&rim=17&utm_source=mail");
});

test("lists come out in one order, however they were ticked", () => {
  const s = parse("season=winter,summer,all-season&type=commercial,touring&brand=nitto,continental&rim=18,17");
  assert.equal(
    serializeTiresQuery(s),
    "season=all-season,summer,winter&type=touring,commercial&brand=continental,nitto&rim=17,18",
  );
});

test("empty state is an empty query; partial sizes and page states survive", () => {
  assert.equal(serializeTiresQuery(parse("")), "");
  assert.equal(serializeTiresQuery(parse("?")), "");
  const s = parse("?w=225&a=45&d=17&view=brands&search=size");
  assert.deepEqual(s.partial, { width: "225", aspect: "45", diameter: "17" });
  assert.equal(serializeTiresQuery(s), "w=225&a=45&d=17&view=brands&search=size");
  assert.deepEqual(parse("w=2255&a=x&d=17").partial, { width: "", aspect: "", diameter: "17" });
});

test("selectionKey is spelling-blind and ignores a trim pick", () => {
  const url = parse("year=2019&make=ford&model=f150").selection;
  const saved = { type: "vehicle", year: "2019", make: "Ford", model: "F-150", pick: "f|265/70R17" };
  assert.equal(selectionKey(url), selectionKey(saved));
  assert.notEqual(selectionKey(url), selectionKey({ ...saved, year: "2009" }));
  assert.equal(selectionKey({ type: "size", size: "265/70r17" }), selectionKey({ type: "size", size: "265/70R17" }));
  assert.notEqual(selectionKey({ type: "size", size: "LT265/70R17" }), selectionKey({ type: "size", size: "265/70R17" }));
  assert.equal(selectionKey(null), "");
});

test("slug", () => {
  assert.equal(slug("Truck & SUV"), "truck-suv");
  assert.equal(slug("BFGoodrich"), "bfgoodrich");
  assert.equal(slug("  Mercedes-Benz "), "mercedes-benz");
});

test("searchTitle: one line for a search in the URL, none for a bare /tires", () => {
  const vocab = { makes: ["Toyota"], models: () => ["Camry"] };
  assert.equal(
    searchTitle(parseTiresQuery("?year=2019&make=toyota&model=camry", vocab).selection),
    "Tires for your 2019 Toyota Camry",
  );
  assert.equal(searchTitle(parseTiresQuery("?size=225-50r17").selection), "225/50R17 tires");
  assert.equal(
    searchTitle(parseTiresQuery("?size=225-40r19&rear=255-35r19").selection),
    "225/40R19 and 255/35R19 tires",
  );
  // A bare /tires, filters only, or a partial size keeps the full hero.
  assert.equal(searchTitle(parseTiresQuery("").selection), null);
  assert.equal(searchTitle(parseTiresQuery("?season=winter&w=225").selection), null);
  assert.equal(searchTitle(null), null);
});
