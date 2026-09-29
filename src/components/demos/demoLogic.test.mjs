// Pure-logic tests for the Learn demos.
//   node --test src/components/demos/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  AGE_MARKERS,
  BANNED_WORDS,
  TPMS_STATES,
  TREADWEAR_CAVEAT,
  ageBand,
  ageText,
  decodeSize,
  explainUtqg,
  parseUtqgString,
  readDotCode,
  readTreadwear,
  treadReading,
} from "./demoLogic.js";
import { DEMOS, DEMO_META } from "./index.js";

const NOW = new Date(2026, 8, 29); // 29 Sep 2026

/** Every string reachable in a value, for the house-rules sweep. */
function strings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object")
    Object.values(value).forEach((v) => strings(v, out));
  return out;
}

function assertHouseRules(value, where) {
  for (const s of strings(value)) {
    assert.ok(!BANNED_WORDS.test(s), `${where}: banned word in "${s}"`);
    assert.ok(!/\d[\d,]*\s*(miles|mi)\b/i.test(s), `${where}: mileage in "${s}"`);
  }
}

/* ---------------- Tread depth → band ---------------- */

test("tread: depth maps to the shared status vocabulary", () => {
  const band = (d) => treadReading(d).status.label;
  for (const d of [0, 1, 2]) assert.equal(band(d), "Replace", `${d}/32`);
  for (const d of [2.5, 3, 4]) assert.equal(band(d), "Consider replacing", `${d}/32`);
  for (const d of [4.5, 5, 7, 10, 12]) assert.equal(band(d), "Keep checking monthly", `${d}/32`);
});

test("tread: tireMath's 'fine' status never leaks through", () => {
  for (let d = 0; d <= 12; d += 0.5) {
    const r = treadReading(d);
    assert.notEqual(r.band, "fine");
    assertHouseRules(r, `depth ${d}`);
  }
});

test("tread: millimetres, wear bars and coin tests", () => {
  assert.equal(treadReading(4).mmText, "3.2");
  assert.equal(treadReading(2).mmText, "1.6");
  assert.equal(treadReading(10).mmText, "7.9");
  assert.equal(treadReading(0).mmText, "0.0");

  assert.equal(treadReading(2).wearBars.flush, true);
  assert.equal(treadReading(3).wearBars.flush, false);
  assert.equal(treadReading(6).wearBars.gap32, 4);
  assert.equal(treadReading(1).wearBars.gap32, 0);

  // Lincoln's head is 2/32 from the edge, Washington's 4/32.
  assert.equal(treadReading(2).penny.visible, true);
  assert.equal(treadReading(3).penny.visible, false);
  assert.equal(treadReading(4).quarter.visible, true);
  assert.equal(treadReading(5).quarter.visible, false);
  assert.match(treadReading(3).penny.text, /Lincoln/);
  assert.match(treadReading(3).quarter.text, /Washington/);
});

test("tread: bad input returns null", () => {
  for (const v of ["", null, undefined, -1, 33, NaN, "abc", Infinity]) {
    assert.equal(treadReading(v), null, String(v));
  }
  assert.equal(treadReading("6").depth, 6);
});

test("tread: valuetext reads depth, mm and status", () => {
  assert.equal(
    treadReading(4).valueText,
    "4/32 inch, 3.2 millimeters. Consider replacing.",
  );
});

/* ---------------- DOT date code ---------------- */

test("dot: WWYY decodes week, year, month and age", () => {
  const r = readDotCode("2319", NOW);
  assert.equal(r.state, "decoded");
  assert.equal(r.week, 23);
  assert.equal(r.year, 2019);
  assert.equal(r.month, "June");
  assert.ok(r.ageYears > 7.2 && r.ageYears < 7.4, String(r.ageYears));
  assert.equal(r.ageText, "About 7 years, 3 months");
  assert.equal(r.band.status.label, "Have it inspected");
});

test("dot: age bands at 5 and 10 years", () => {
  assert.equal(readDotCode("0125", NOW).band.status.label, "Keep checking monthly");
  assert.equal(readDotCode("0716", NOW).band.status.label, "Manufacturers recommend replacing");
  assert.equal(ageBand(4.99).status.key, "monitor");
  assert.equal(ageBand(5).status.key, "inspect");
  assert.equal(ageBand(9.99).status.key, "inspect");
  assert.equal(ageBand(10).status.key, "mfrReplace");
  assert.equal(ageBand(25).status.key, "mfrReplace");
});

test("dot: week must be 01–53", () => {
  assert.equal(readDotCode("0119", NOW).state, "decoded");
  assert.equal(readDotCode("5319", NOW).state, "decoded");
  assert.equal(readDotCode("5319", NOW).month, "December");
  for (const code of ["0019", "5419", "9919"]) {
    const r = readDotCode(code, NOW);
    assert.equal(r.state, "error", code);
    assert.match(r.message, /01 to 53/);
  }
});

test("dot: future years and weeks are typos", () => {
  assert.equal(readDotCode("2327", NOW).state, "error");
  assert.equal(readDotCode("5226", NOW).state, "error"); // week 52 of this year
  const thisWeek = readDotCode("3926", NOW);
  assert.equal(thisWeek.state, "decoded");
  assert.equal(thisWeek.ageText, "Less than a month");
});

test("dot: pre-2000 three-digit codes", () => {
  const r = readDotCode("238", NOW);
  assert.equal(r.state, "legacy");
  assert.equal(r.week, 23);
  assert.equal(r.yearDigit, "8");
  assert.equal(r.status.label, "Manufacturers recommend replacing");
  assert.match(r.message, /before 2000/);
  assert.equal(readDotCode("008", NOW).state, "error");
});

test("dot: partial, empty, junk and full TINs", () => {
  assert.equal(readDotCode("", NOW).state, "empty");
  assert.equal(readDotCode("   ", NOW).state, "empty");
  assert.equal(readDotCode("2", NOW).state, "incomplete");
  assert.equal(readDotCode("23", NOW).state, "incomplete");
  assert.equal(readDotCode("23/19", NOW).state, "error");
  assert.equal(readDotCode("ABCD", NOW).state, "error");

  const tin = readDotCode("DOT U2LL LMLR 2319", NOW);
  assert.equal(tin.state, "decoded");
  assert.equal(tin.fullTin, true);
  assert.equal(tin.year, 2019);
  assert.equal(readDotCode("dot u2ll lmlr 2319", NOW).year, 2019);

  // A pasted run of more than four digits: the last four are the date.
  const long = readDotCode("122319", NOW);
  assert.equal(long.week, 23);
  assert.ok(long.note);
});

test("dot: no clock (prerender) gives week and year but no age", () => {
  const r = readDotCode("2319");
  assert.equal(r.state, "decoded");
  assert.equal(r.year, 2019);
  assert.equal(r.ageYears, null);
  assert.equal(r.band, null);
});

test("dot: age text", () => {
  assert.equal(ageText(0.05), "Less than a month");
  assert.equal(ageText(1), "About 1 year");
  assert.equal(ageText(1 + 1 / 12), "About 1 year, 1 month");
  assert.equal(ageText(0.5), "About 6 months");
});

test("dot: all strings follow house rules", () => {
  assertHouseRules(AGE_MARKERS, "AGE_MARKERS");
  for (const code of ["2319", "0716", "0125", "238", "0019", "23", "2327"]) {
    assertHouseRules(readDotCode(code, NOW), code);
  }
});

/* ---------------- Size parsing ---------------- */

const tokens = (s) => decodeSize(s).parts.map((p) => p.token).join(" ");

test("size: P-metric with load and speed", () => {
  const r = decodeSize("225/45R17 94W");
  assert.equal(r.state, "decoded");
  assert.equal(tokens("225/45R17 94W"), "225 45 R 17 94 W");
  assert.equal(r.geometry.sidewallText, "101 mm (4.0 in)");
  assert.equal(r.geometry.diameterText, "25.0 in (634 mm)");
  const load = r.parts.find((p) => p.role === "load");
  assert.match(load.text, /1,477 lb \(670 kg\)/);
  const speed = r.parts.find((p) => p.role === "speed");
  assert.match(speed.text, /168 mph/);
  assert.match(speed.text, /not a recommended driving speed/);
});

test("size: explicit P, ZR and XL", () => {
  assert.equal(tokens("P215/60R16 95H"), "P 215 60 R 16 95 H");
  assert.equal(tokens("225/45ZR17 94W"), "225 45 ZR 17 94 W");
  assert.equal(tokens("225/45R17 94W XL"), "225 45 R 17 94 W XL");
  assert.equal(tokens("225 / 45 r 17 94w"), "225 45 R 17 94 W");
});

test("size: LT sizes, including dual load index and trailing LT", () => {
  const r = decodeSize("LT265/70R17 121/118S");
  assert.equal(r.state, "decoded");
  assert.equal(tokens("LT265/70R17 121/118S"), "LT 265 70 R 17 121/118 S");
  assert.equal(r.service, "LT");
  assert.match(r.parts.find((p) => p.role === "load").text, /dual rear wheels/);
  const trailing = decodeSize("265/70R17LT");
  assert.equal(trailing.service, "LT");
  assert.equal(trailing.parts[0].token, "LT");
});

test("size: flotation sizes", () => {
  const r = decodeSize("33x12.50R20");
  assert.equal(r.state, "decoded");
  assert.equal(r.format, "flotation");
  assert.equal(tokens("33x12.50R20"), "33 12.50 R 20");
  assert.equal(r.geometry.sidewallText, "165 mm (6.5 in)");
  assert.equal(r.geometry.diameterText, "33.0 in (838 mm)");

  assert.equal(tokens("33x12.50R20LT 114Q"), "LT 33 12.50 R 20 114 Q");
  assert.equal(tokens("31X10.50R15"), "31 10.50 R 15");
});

test("size: empty, partial and invalid input", () => {
  assert.equal(decodeSize("").state, "empty");
  assert.equal(decodeSize(null).state, "empty");
  assert.equal(decodeSize("225").state, "incomplete");
  assert.equal(decodeSize("225/4").state, "incomplete");
  assert.equal(decodeSize("hello").state, "error");
  assert.equal(decodeSize("225/45X17").state, "error");
});

test("size: load index outside the table gets no pounds figure", () => {
  const r = decodeSize("LT315/75R16 127/124R");
  const load = r.parts.find((p) => p.role === "load");
  assert.match(load.text, /outside the 71–126 range/);
  assert.doesNotMatch(load.text, /\d lb/);
});

test("size: all strings follow house rules", () => {
  for (const s of [
    "225/45R17 94W",
    "LT265/70R17 121/118S",
    "33x12.50R20LT 114Q",
    "225/45ZR17",
    "hello",
  ]) {
    assertHouseRules(decodeSize(s), s);
  }
});

/* ---------------- UTQG ---------------- */

test("utqg: parse printed markings", () => {
  assert.deepEqual(parseUtqgString("500 AA A"), {
    treadwear: 500,
    traction: "AA",
    temperature: "A",
  });
  assert.deepEqual(parseUtqgString("500aaa"), {
    treadwear: 500,
    traction: "AA",
    temperature: "A",
  });
  assert.deepEqual(parseUtqgString(" 300 a b "), {
    treadwear: 300,
    traction: "A",
    temperature: "B",
  });
  assert.equal(parseUtqgString("500 D A"), null);
  assert.equal(parseUtqgString("AA A"), null);
});

test("utqg: treadwear validation", () => {
  assert.equal(readTreadwear("").ok, false);
  assert.equal(readTreadwear("abc").ok, false);
  assert.equal(readTreadwear("5.5").ok, false);
  assert.equal(readTreadwear("0").ok, false);
  assert.equal(readTreadwear("1600").ok, false);
  assert.deepEqual(readTreadwear("500"), { ok: true, value: 500 });
});

test("utqg: treadwear is a ratio to the control tire, never miles", () => {
  const r = explainUtqg({ treadwear: "500", traction: "AA", temperature: "A" });
  assert.equal(r.treadwear.ratio, "5");
  assert.equal(explainUtqg({ treadwear: "320", traction: "A", temperature: "B" }).treadwear.ratio, "3.2");
  assert.match(r.treadwear.text, /control tire \(graded 100\)/);
  assert.match(TREADWEAR_CAVEAT, /relative, not miles/);
  assert.match(TREADWEAR_CAVEAT, /within one brand/);
  assert.equal(r.temperature.band, "over 115 mph");
  assert.match(r.traction.text, /straight-line braking/);
  assertHouseRules(r, "utqg");
});

test("utqg: invalid treadwear still explains the other grades", () => {
  const r = explainUtqg({ treadwear: "x", traction: "C", temperature: "C" });
  assert.ok(r.treadwear.error);
  assert.equal(r.traction.grade, "C");
  assert.equal(r.temperature.band, "85 to 100 mph");
});

/* ---------------- TPMS ---------------- */

test("tpms: three light behaviours with steps and sources", () => {
  assert.deepEqual(
    TPMS_STATES.map((s) => s.id),
    ["solid", "flashing", "off"],
  );
  const flashing = TPMS_STATES.find((s) => s.id === "flashing");
  assert.match(flashing.meaning, /60 to 90 seconds/);
  for (const s of TPMS_STATES) {
    assert.ok(s.steps.length >= 2);
    assert.ok(s.sources.includes("S8") || s.sources.includes("S1"));
    assert.ok(s.steps.some((step) => /gauge/.test(step)));
  }
  assertHouseRules(TPMS_STATES, "TPMS_STATES");
});

/* ---------------- Registry contract ---------------- */

const BUILT = [
  "tread-gauge",
  "dot-date-reader",
  "size-decoder",
  "tpms-light",
  "utqg-explainer",
];
const RESERVED = [
  "pressure-temp",
  "load-speed",
  "plus-size",
  "wear-pattern",
  "rotation",
  "hydroplaning",
  "spare-types",
  "damage-map",
  "noise-vibration",
];

test("registry: DEMOS holds exactly the built demos, code-split", () => {
  assert.deepEqual(Object.keys(DEMOS).sort(), [...BUILT].sort());
  for (const id of BUILT) {
    // React.lazy today; lazyPage() after the prerender merge. Either way a
    // component type, not an already-imported module.
    assert.ok(["object", "function"].includes(typeof DEMOS[id]), id);
    assert.equal(typeof DEMOS[id].default, "undefined", id);
  }
});

test("registry: DEMO_META covers built and reserved ids", () => {
  assert.deepEqual(Object.keys(DEMO_META).sort(), [...BUILT, ...RESERVED].sort());
  for (const [id, meta] of Object.entries(DEMO_META)) {
    assert.ok(meta.title && meta.alt, id);
    const sentences = meta.alt.split(/(?<=[.!?])\s+(?=[A-Z])/);
    assert.ok(sentences.length >= 1 && sentences.length <= 2, `${id}: ${sentences.length} sentences`);
  }
  assertHouseRules(DEMO_META, "DEMO_META");
});
