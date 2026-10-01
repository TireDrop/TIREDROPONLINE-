// Fitment answers: what every tire card, product page, Compare, the cart and
// checkout say about whether a tire fits.
//   node --test src/data/*.test.mjs   (npm run test:fitment)
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  checkFit,
  compareCrown,
  factorySizes,
  fitSizeOf,
  optionId,
  readSize,
  resolveSelection,
  selectionSizeText,
  sizeSearch,
  sizesOf,
} from "./fitmentCheck.js";
import { FITMENT_TRIMS } from "./fitment.js";
import { TIRES } from "./products.js";

const BANNED = /\b(safe|safer|safely|fine|guaranteed?|OK)\b/i;

/** Every string in a value, for the wording sweep. */
function strings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object")
    Object.values(value).forEach((v) => strings(v, out));
  return out;
}
function assertWording(answer, where) {
  for (const s of strings(answer))
    assert.ok(!BANNED.test(s), `${where}: banned word in "${s}"`);
}

const vehicle = (year, make, model, extra = {}) => ({
  type: "vehicle",
  year,
  make,
  model,
  ...extra,
});
const fit = (size, selection, tables) =>
  checkFit(size, resolveSelection(selection, tables));

// Trims and staggered fitments the shipped tables do not carry (see
// FITMENT_TRIMS): made-up vehicles, so nothing here reads as real data.
const TABLES = {
  base: {
    "Testco|Roadster": ["225/45R17", "sports"],
    "Testco|Hauler": ["265/70R17", "truck"],
  },
  years: {
    "Testco|Roadster": [
      [2015, 2019, "225/45R17"],
      [2020, 2026, "235/40R18"],
    ],
    "Testco|Hauler": [[2010, 2026, "265/70R17"]],
  },
  trims: {
    "Testco|Roadster": [
      [
        2020,
        2026,
        [
          { trim: "Base", front: "235/40R18" },
          { trim: "Sport", front: "235/40R18", alternates: ["235/35R19"] },
          { trim: "Track", front: "245/35ZR19", rear: "275/30ZR19" },
        ],
      ],
    ],
    "Testco|Hauler": [
      [
        2010,
        2026,
        [
          { trim: "Work", front: "LT265/70R17" },
          { trim: "Crew", front: "LT265/70R17" },
        ],
      ],
    ],
  },
};

/* ------------------------------ sizes ------------------------------ */

test("readSize: P-metric, Z-rated, LT, euro C, flotation, junk", () => {
  assert.equal(readSize("225/45R17").key, "225/45R17");
  assert.equal(
    readSize("225/45ZR17").key,
    "225/45R17",
    "ZR is a speed marking, not a size",
  );
  assert.equal(readSize("225/45 ZR 17 94W").key, "225/45R17");
  assert.equal(readSize("P225/45R17 91V").key, "225/45R17");
  assert.equal(readSize("P225/45R17").service, "P");
  assert.equal(readSize("225/45R17").service, null);

  const lt = readSize("LT265/70R17 121/118S");
  assert.equal(lt.key, "265/70R17");
  assert.equal(lt.service, "LT");
  assert.equal(lt.display, "LT265/70R17");
  assert.equal(readSize("265/70R17LT").service, "LT");
  assert.equal(
    readSize("235/65R16C 121/119R").service,
    "LT",
    "euro C is a commercial casing",
  );
  assert.equal(readSize("ST225/75R15").service, "ST");

  const flot = readSize("33x12.50R20LT");
  assert.equal(flot.format, "flotation");
  assert.equal(flot.key, "33x12.5R20");
  assert.equal(
    readSize("33X12.5R20").key,
    flot.key,
    "10.50 and 10.5 are one size",
  );
  assert.equal(flot.service, "LT");

  for (const junk of ["", null, undefined, "225/45", "tires", "225/45R"]) {
    assert.equal(readSize(junk), null, String(junk));
  }
});

test("sizeSearch filters /tires to one size", () => {
  assert.equal(sizeSearch("LT245/75R16"), "/tires?w=245&a=75&d=16");
  assert.equal(sizeSearch("33x12.50R20"), null);
});

/* --------------------------- no selection --------------------------- */

test("no vehicle or size chosen: check fitment, never a block", () => {
  for (const sel of [
    null,
    undefined,
    {},
    { type: "vehicle" },
    { type: "size", size: "nope" },
  ]) {
    const a = fit("225/45R17", sel);
    assert.equal(a.status, "check");
    assert.equal(a.code, "no-selection");
    assert.equal(a.title, "Check fitment");
    assertWording(a, "no selection");
  }
});

/* ------------------------- vehicle, exact match ------------------------- */

test("exact OE match on the shipped table: fits, and says what it is based on", () => {
  // 2019 Tacoma: 245/75R16 (2005-2023 generation row).
  const a = fit("245/75R16", vehicle("2019", "Toyota", "Tacoma"));
  assert.equal(a.status, "fits");
  assert.equal(a.title, "Fits your 2019 Toyota Tacoma");
  assert.match(
    a.detail,
    /^Matches the typical factory size on file for a 2019 Toyota Tacoma \(245\/75R16\)/,
  );
  assert.match(a.detail, /door-jamb sticker/);
  assert.deepEqual(a.sizes, ["245/75R16"]);
  assertWording(a, "exact");
});

test("mismatch: doesn't fit, names both sizes", () => {
  const a = fit("265/70R17", vehicle("2019", "Toyota", "Tacoma"));
  assert.equal(a.status, "no-fit");
  assert.equal(a.title, "Doesn't fit your 2019 Toyota Tacoma");
  assert.equal(
    a.detail,
    "This tire is 265/70R17. The typical factory size on file for a 2019 Toyota Tacoma is 245/75R16.",
  );
  assert.deepEqual(
    a.sizes,
    ["245/75R16"],
    "See tires that fit goes to the right size",
  );
  assertWording(a, "mismatch");
});

test("make and model match without regard to case", () => {
  assert.equal(
    fit("245/75R16", vehicle("2019", "toyota", "TACOMA")).status,
    "fits",
  );
});

/* ---------------------------- year-aware ---------------------------- */

test("year boundaries pick the generation's size", () => {
  // Tacoma: 2005-2023 245/75R16, 2024-2026 245/70R17.
  assert.equal(
    fit("245/75R16", vehicle("2023", "Toyota", "Tacoma")).status,
    "fits",
  );
  assert.equal(
    fit("245/75R16", vehicle("2024", "Toyota", "Tacoma")).status,
    "no-fit",
  );
  assert.equal(
    fit("245/70R17", vehicle("2024", "Toyota", "Tacoma")).status,
    "fits",
  );
  // Camry: 2017 205/65R16, 2018 215/55R17.
  assert.equal(
    fit("205/65R16", vehicle("2017", "Toyota", "Camry")).status,
    "fits",
  );
  assert.equal(
    fit("215/55R17", vehicle("2018", "Toyota", "Camry")).status,
    "fits",
  );
  assert.equal(
    fit("205/65R16", vehicle("2018", "Toyota", "Camry")).status,
    "no-fit",
  );
});

test("a year the table has no size for is a check, not a guess", () => {
  // Tacoma rows start in 2005; Colorado skips 2013-2014.
  for (const sel of [
    vehicle("2004", "Toyota", "Tacoma"),
    vehicle("2013", "Chevrolet", "Colorado"),
  ]) {
    const a = fit("245/75R16", sel);
    assert.equal(a.status, "check", sel.year);
    assert.equal(a.code, "no-year");
    assertWording(a, "no-year");
  }
});

test("a vehicle not on file at all is a check, with a pointer to the sidewall", () => {
  const a = fit("205/55R16", vehicle("2019", "Kia", "Soul"));
  assert.equal(a.status, "check");
  assert.equal(a.code, "no-record");
  assert.match(a.detail, /2019 Kia Soul/);
  // "Other / not listed" leaves the model blank.
  assert.equal(fit("205/55R16", vehicle("2019", "Kia", "")).code, "no-record");
});

/* --------------------------- trims, staggered --------------------------- */

test("multi-trim: sizes differ by trim, nothing picked → fits some trims, with the sizes", () => {
  const sel = vehicle("2022", "Testco", "Roadster");
  const resolved = resolveSelection(sel, TABLES);
  assert.equal(resolved.basis, "trim");
  assert.equal(resolved.chosen, null);
  assert.equal(resolved.choices.length, 2, "Base and Sport share one size");

  const a = checkFit("235/40R18", resolved);
  assert.equal(a.status, "check");
  assert.equal(a.code, "some-trims");
  assert.equal(a.title, "Fits some trims — confirm your size");
  assert.match(
    a.detail,
    /235\/40R18 or front 245\/35ZR19, rear 275\/30ZR19 depending on trim/,
  );
  assert.equal(a.choices.length, 2);
  assert.match(selectionSizeText(resolved), /by trim$/);
  assertWording(a, "some trims");

  // A size no trim takes is still a plain no.
  assert.equal(checkFit("205/55R16", resolved).status, "no-fit");
});

test("multi-trim: picking the trim's size settles it, and names the trim", () => {
  const base = resolveSelection(vehicle("2022", "Testco", "Roadster"), TABLES);
  const sport = base.options[1];
  const resolved = resolveSelection(
    vehicle("2022", "Testco", "Roadster", { pick: optionId(sport) }),
    TABLES,
  );
  // Base and Sport share a size, so the pick lands on the first with it.
  assert.equal(resolved.chosen.front, "235/40R18");
  const a = checkFit("235/40R18", resolved);
  assert.equal(a.status, "fits");
  assert.equal(a.title, "Fits your 2022 Testco Roadster Base");
  assert.equal(
    a.detail,
    "Matches the factory size for your 2022 Testco Roadster Base (235/40R18).",
  );
  assert.equal(checkFit("245/35R19", resolved).status, "no-fit");
});

test("every trim on file takes the size: fits without asking", () => {
  const resolved = resolveSelection(
    vehicle("2015", "Testco", "Hauler"),
    TABLES,
  );
  assert.ok(resolved.chosen, "one distinct size is chosen for the shopper");
  const a = checkFit("LT265/70R17 121/118S", resolved);
  assert.equal(a.status, "fits");
  assert.match(
    a.detail,
    /Matches the factory size for your 2015 Testco Hauler/,
  );
});

test("staggered: both sizes shown, the tire fits the axle it matches", () => {
  const all = resolveSelection(vehicle("2022", "Testco", "Roadster"), TABLES);
  const track = all.options[2];
  const resolved = resolveSelection(
    vehicle("2022", "Testco", "Roadster", { pick: optionId(track) }),
    TABLES,
  );
  assert.equal(
    selectionSizeText(resolved),
    "front 245/35ZR19, rear 275/30ZR19",
  );
  assert.deepEqual(sizesOf(resolved), ["245/35ZR19", "275/30ZR19"]);

  const front = checkFit("245/35R19", resolved);
  assert.equal(front.status, "fits");
  assert.equal(front.axle, "front");
  assert.equal(
    front.title,
    "Fits the front of your 2022 Testco Roadster Track",
  );
  assert.match(front.detail, /rear axle takes 275\/30ZR19/);

  const rear = checkFit("275/30ZR19 (95Y)", resolved);
  assert.equal(rear.axle, "rear");
  assert.equal(rear.title, "Fits the rear of your 2022 Testco Roadster Track");
  assert.match(rear.detail, /front axle takes 245\/35ZR19/);

  const neither = checkFit("255/35R19", resolved);
  assert.equal(neither.status, "no-fit");
  assert.match(neither.detail, /front 245\/35ZR19, rear 275\/30ZR19/);
  [front, rear, neither].forEach((a) => assertWording(a, "staggered"));
});

test("alternates count only when listed; plus sizes are never inferred", () => {
  const all = resolveSelection(vehicle("2022", "Testco", "Roadster"), TABLES);
  const sport = resolveSelection(
    vehicle("2022", "Testco", "Roadster", { pick: optionId(all.options[1]) }),
    TABLES,
  );
  // Base and Sport share a front size, so the pick resolves to Base, which
  // lists no alternate: the alternate only counts for the trim that lists it.
  assert.equal(checkFit("235/35R19", sport).status, "no-fit");

  const sportOnly = {
    ...TABLES,
    trims: {
      "Testco|Roadster": [
        [
          2020,
          2026,
          [{ trim: "Sport", front: "235/40R18", alternates: ["235/35R19"] }],
        ],
      ],
    },
  };
  const a = fit("235/35R19", vehicle("2022", "Testco", "Roadster"), sportOnly);
  assert.equal(a.status, "fits");
  assert.equal(a.code, "match-alternate");
  assert.match(a.detail, /alternate size listed/);
  // A plus size of the 2019 Tacoma's 245/75R16 is still a no.
  assert.equal(
    fit("265/70R17", vehicle("2019", "Toyota", "Tacoma")).status,
    "no-fit",
  );
});

test("trim rows win only for the years they cover", () => {
  const sizes = factorySizes(
    { year: "2017", make: "Testco", model: "Roadster" },
    TABLES,
  );
  assert.equal(sizes.basis, "typical");
  assert.equal(sizes.options[0].front, "225/45R17");
});

test("the shipped trim table is empty: no trim data invented", () => {
  assert.deepEqual(FITMENT_TRIMS, {});
});

/* ------------------------------ size-only ------------------------------ */

test("size-only: match fits, anything else is not your size", () => {
  const sel = { type: "size", size: "225/45ZR17" };
  const yes = fit("225/45R17", sel);
  assert.equal(yes.status, "fits");
  assert.equal(yes.title, "Matches your size (225/45R17)");
  const no = fit("225/50R17", sel);
  assert.equal(no.status, "no-fit");
  assert.equal(no.title, "Not your size (225/45R17)");
  assert.equal(
    no.detail,
    "This tire is 225/50R17. You're shopping for 225/45R17.",
  );
  assertWording([yes, no], "size-only");
});

test("a size the shopper gave for their vehicle wins over the table", () => {
  const sel = vehicle("2019", "Toyota", "Tacoma", { size: "265/70R16" });
  const a = fit("265/70R16", sel);
  assert.equal(a.status, "fits");
  assert.equal(a.title, "Matches your size (265/70R16)");
  assert.equal(
    a.detail,
    "Matches the size you gave us for your 2019 Toyota Tacoma (265/70R16).",
  );
  const b = fit("245/75R16", sel);
  assert.equal(b.status, "no-fit");
  assert.match(
    b.detail,
    /The size you gave us for your 2019 Toyota Tacoma is 265\/70R16/,
  );
});

/* --------------------------- LT and flotation --------------------------- */

test("LT against a P-metric or bare size: same dimensions is a check, not a fit", () => {
  const a = fit("LT245/75R16 120/116S", vehicle("2019", "Toyota", "Tacoma"));
  assert.equal(a.status, "check");
  assert.equal(a.code, "casing");
  assert.match(a.detail, /light-truck \(LT\)/);
  const b = fit("245/75R16", { type: "size", size: "LT245/75R16" });
  assert.equal(b.status, "check");
  assert.match(b.detail, /not marked LT/);
  assert.equal(
    fit("LT245/75R16", { type: "size", size: "245/75R16LT" }).status,
    "fits",
  );
  assertWording([a, b], "casing");
});

test("trailer tires never fit a vehicle", () => {
  const a = fit("ST245/75R16", vehicle("2019", "Toyota", "Tacoma"));
  assert.equal(a.status, "no-fit");
  assert.equal(a.code, "trailer");
});

test("flotation sizes match flotation sizes only", () => {
  const sel = { type: "size", size: "33x12.50R20LT" };
  assert.equal(fit("33X12.5R20 114Q", sel).status, "fits");
  assert.equal(fit("35x12.50R20LT", sel).status, "no-fit");
  assert.equal(fit("315/60R20", sel).status, "no-fit");
});

test("an unreadable tire size is a check", () => {
  const a = fit("see sidewall", vehicle("2019", "Toyota", "Tacoma"));
  assert.equal(a.status, "check");
  assert.equal(a.code, "bad-size");
});

/* ------------------------------ catalog ------------------------------ */

test("every catalog tire size reads, and its own size fits a size-only search", () => {
  for (const t of TIRES) {
    assert.ok(readSize(t.size), t.size);
    assert.equal(
      fit(t.size, { type: "size", size: t.size }).status,
      "fits",
      t.size,
    );
  }
});

/* ------------------------------ compare ------------------------------ */

test("compare crowns only tires of one size that fit", () => {
  assert.deepEqual(compareCrown(["225/45R17", "225/45ZR17"]), {
    crown: true,
    reason: null,
    sizes: ["225/45R17"],
  });
  const mixed = compareCrown(["225/45R17", "245/40R18", "225/45R17"]);
  assert.equal(mixed.crown, false);
  assert.equal(mixed.reason, "mixed-sizes");
  assert.deepEqual(mixed.sizes, ["225/45R17", "245/40R18"]);
  const noFit = compareCrown(
    ["265/70R17", "265/70R17"],
    [{ status: "no-fit" }, { status: "no-fit" }],
  );
  assert.deepEqual([noFit.crown, noFit.reason], [false, "no-fit"]);
  assert.equal(
    compareCrown(
      ["265/70R17", "265/70R17"],
      [{ status: "check" }, { status: "check" }],
    ).crown,
    true,
  );
});

test("a dual load index marks a catalog tire LT even when its size does not", () => {
  assert.equal(fitSizeOf({ size: "245/75R16", loadIndex: "120/116" }), "LT245/75R16");
  assert.equal(fitSizeOf({ size: "245/75R16", loadIndex: "110" }), "245/75R16");
  assert.equal(fitSizeOf({ size: "LT245/75R16", loadIndex: "120/116" }), "LT245/75R16");
  assert.equal(fitSizeOf({ size: "245/75R16" }), "245/75R16");
  const vanTire = TIRES.find((t) => t.loadIndex === "120/116" && t.size === "245/75R16");
  const a = fit(fitSizeOf(vanTire), vehicle("2019", "Toyota", "Tacoma"));
  assert.equal(a.status, "check");
  assert.equal(a.code, "casing");
});
