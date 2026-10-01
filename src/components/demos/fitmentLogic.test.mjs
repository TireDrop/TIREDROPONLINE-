// Pure-logic tests for the fitment demos (D5 load & speed, D6 plus-size).
//   node --test src/components/demos/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  FITMENT_BANNED,
  GUIDELINE_NOTE,
  LOAD_RANGE_NOTES,
  LOAD_SPEED_DEFAULTS,
  LOAD_SPEED_VERDICT,
  PLUS_SIZE_DEFAULTS,
  PLUS_SIZE_EXAMPLES,
  SPEED_RATING_NOTE,
  SPEEDO_SPEEDS,
  compareLoadSpeed,
  comparePlusSize,
  loadFacts,
  pctText,
  readServiceDescription,
  readSize,
  speedFacts,
} from "./fitmentLogic.js";
import { BANNED_WORDS } from "./demoLogic.js";
import { LOAD_INDEX_KG as OLD_KG, SPEED_MPH } from "./ratingTables.js";
import {
  LOAD_INDEXES,
  LOAD_INDEX_KG,
  SPEED_SYMBOLS,
  loadKg,
  loadLbs,
  speedSymbol,
} from "../../data/loadSpeedTables.js";
import { compareSizes } from "../../data/tireMath.js";

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
    assert.ok(!FITMENT_BANNED.test(s), `${where}: "fits"/"approved" in "${s}"`);
    assert.ok(!/\d[\d,]*\s*(miles|mi)\b/i.test(s), `${where}: mileage in "${s}"`);
    assert.ok(
      !/\b(deliver(y|ed|s)?|arriv(e|es|al)|discount|coupon|deal)\b/i.test(s),
      `${where}: delivery or discount wording in "${s}"`,
    );
  }
}

/* ---------------- Tables ---------------- */

test("tables: load index 60–126, contiguous and rising", () => {
  assert.equal(LOAD_INDEXES[0], 60);
  assert.equal(LOAD_INDEXES.at(-1), 126);
  assert.equal(LOAD_INDEXES.length, 67);
  for (let i = 1; i < LOAD_INDEXES.length; i += 1) {
    assert.equal(LOAD_INDEXES[i], LOAD_INDEXES[i - 1] + 1);
    assert.ok(LOAD_INDEX_KG[LOAD_INDEXES[i]] > LOAD_INDEX_KG[LOAD_INDEXES[i - 1]]);
  }
  assert.equal(loadKg(60), 250);
  assert.equal(loadKg(91), 615);
  assert.equal(loadKg(94), 670);
  assert.equal(loadKg(126), 1700);
  assert.equal(loadLbs(94), 1477);
  assert.equal(loadLbs(121), 3197);
});

test("tables: agree with the existing 71–126 copy in ratingTables.js", () => {
  for (const [index, kg] of Object.entries(OLD_KG)) {
    assert.equal(LOAD_INDEX_KG[index], kg, `load index ${index}`);
  }
  for (const s of SPEED_SYMBOLS) assert.equal(SPEED_MPH[s.symbol], s.mph, s.symbol);
});

test("tables: out-of-range and junk load indexes give null", () => {
  for (const v of [59, 127, 0, -1, "", null, undefined, "94V", "9", 94.5, "abc"]) {
    assert.equal(loadKg(v), null, String(v));
    assert.equal(loadLbs(v), null, String(v));
  }
  assert.equal(loadKg("94"), 670);
});

test("tables: speed symbols L to Y, slowest first, H between U and V", () => {
  assert.deepEqual(
    SPEED_SYMBOLS.map((s) => s.symbol).join(""),
    "LMNPQRSTUHVWY",
  );
  for (let i = 1; i < SPEED_SYMBOLS.length; i += 1) {
    assert.ok(SPEED_SYMBOLS[i].mph > SPEED_SYMBOLS[i - 1].mph);
    assert.ok(SPEED_SYMBOLS[i].kmh > SPEED_SYMBOLS[i - 1].kmh);
  }
  assert.deepEqual(speedSymbol("h"), { symbol: "H", mph: 130, kmh: 210 });
  assert.equal(speedSymbol("V").mph, 149);
  assert.equal(speedSymbol("W").mph, 168);
  assert.equal(speedSymbol("Y").mph, 186);
  assert.equal(speedSymbol("Z"), null);
  assert.equal(speedSymbol(""), null);
});

/* ---------------- D5: reading a sidewall string ---------------- */

test("load-speed: reads 94V, spaced, lower case and XL", () => {
  assert.deepEqual(readServiceDescription("94V"), {
    state: "decoded",
    load: 94,
    dualLoad: null,
    speed: "V",
    xl: false,
  });
  assert.equal(readServiceDescription(" 94 v ").speed, "V");
  const xl = readServiceDescription("98Y XL");
  assert.equal(xl.load, 98);
  assert.equal(xl.xl, true);
  assert.equal(readServiceDescription("98Y Extra Load").xl, true);
});

test("load-speed: LT dual index and full sizes, LT and flotation", () => {
  const lt = readServiceDescription("121/118S");
  assert.equal(lt.load, 121);
  assert.equal(lt.dualLoad, 118);
  assert.equal(lt.speed, "S");
  assert.equal(readServiceDescription("225/45R17 94W").speed, "W");
  assert.equal(readServiceDescription("225/45ZR17 94W XL").load, 94);
  assert.equal(readServiceDescription("LT265/70R17 121/118S").dualLoad, 118);
  assert.equal(readServiceDescription("265/70R17LT 121S").load, 121);
  assert.equal(readServiceDescription("33x12.50R20LT 114Q").load, 114);
});

test("load-speed: empty, partial and invalid input", () => {
  assert.equal(readServiceDescription("").state, "empty");
  assert.equal(readServiceDescription(null).state, "empty");
  assert.equal(readServiceDescription("9").state, "incomplete");
  assert.equal(readServiceDescription("121/").state, "incomplete");
  const noLetter = readServiceDescription("94");
  assert.equal(noLetter.state, "incomplete");
  assert.match(noLetter.message, /94V/);

  assert.equal(readServiceDescription("hello").state, "error");
  assert.equal(readServiceDescription("94VV").state, "error");
  assert.match(readServiceDescription("59V").message, /outside the 60–126 table/);
  assert.match(readServiceDescription("127/124R").message, /outside the 60–126 table/);
  assert.match(readServiceDescription("94Z").message, /open-ended/);
  assert.match(readServiceDescription("94A").message, /L to Y/);
});

/* ---------------- D5: comparison ---------------- */

test("load-speed: figures per tire and for four", () => {
  const f = loadFacts(94);
  assert.equal(f.kg, 670);
  assert.equal(f.lbs, 1477);
  assert.equal(f.kg4, 2680);
  assert.equal(f.lbs4, 5908);
  assert.equal(f.perTireText, "1,477 lb (670 kg) per tire");
  assert.equal(f.setText, "5,908 lb (2,680 kg) for four");
  assert.equal(loadFacts(127), null);
  assert.equal(speedFacts("H").text, "H, tested to 130 mph (210 km/h)");
  assert.equal(speedFacts("Z"), null);
});

test("load-speed: the default pair (94V vs 91H) is below on both", () => {
  const r = compareLoadSpeed(LOAD_SPEED_DEFAULTS.current, LOAD_SPEED_DEFAULTS.candidate);
  assert.equal(r.meets, false);
  assert.equal(r.verdict.label, "Below your current tire. Not recommended by tire makers");
  assert.equal(r.load.verdict.key, "below");
  assert.equal(r.speed.verdict.key, "below");
  assert.equal(
    r.headline,
    "Below your current tire on load index and speed rating. Not recommended by tire makers.",
  );
  assert.match(r.load.text, /121 lb less per tire than your current 94/);
  assert.match(r.speed.text, /130 mph, below your current V \(149 mph\)/);
  assert.match(r.advice, /match or exceed/);
  assert.equal(r.note, SPEED_RATING_NOTE);
  assert.deepEqual(r.sources, ["S35", "S54"]);
});

test("load-speed: equal values meet", () => {
  const r = compareLoadSpeed({ load: 94, speed: "V" }, { load: 94, speed: "V" });
  assert.equal(r.meets, true);
  assert.equal(r.verdict.label, "Meets or exceeds your current tire");
  assert.match(r.load.text, /^Same load index, 94/);
  assert.match(r.speed.text, /^Same speed rating, V/);
  assert.equal(r.advice, null);
});

test("load-speed: higher on both meets; mixed results name what is below", () => {
  const up = compareLoadSpeed({ load: 91, speed: "H" }, { load: 98, speed: "W" });
  assert.equal(up.meets, true);
  assert.match(up.load.text, /more per tire than 91/);

  const mixed = compareLoadSpeed({ load: 94, speed: "H" }, { load: 98, speed: "T" });
  assert.equal(mixed.load.meets, true);
  assert.equal(mixed.speed.meets, false);
  assert.equal(mixed.meets, false);
  assert.match(mixed.headline, /^Below your current tire on speed rating\./);
  assert.match(mixed.advice, /speed rating your vehicle maker/);
});

test("load-speed: speed compares by mph, not by letter (H is above U)", () => {
  assert.equal(compareLoadSpeed({ load: 94, speed: "U" }, { load: 94, speed: "H" }).speed.meets, true);
  assert.equal(compareLoadSpeed({ load: 94, speed: "H" }, { load: 94, speed: "U" }).speed.meets, false);
  assert.equal(compareLoadSpeed({ load: 94, speed: "T" }, { load: 94, speed: "H" }).speed.meets, true);
});

test("load-speed: anything outside the tables gives null", () => {
  assert.equal(compareLoadSpeed({ load: 59, speed: "V" }, { load: 94, speed: "V" }), null);
  assert.equal(compareLoadSpeed({ load: 94, speed: "Z" }, { load: 94, speed: "V" }), null);
  assert.equal(compareLoadSpeed(null, { load: 94, speed: "V" }), null);
});

test("load-speed: the fixed wording", () => {
  assert.equal(
    SPEED_RATING_NOTE,
    "A speed rating is the speed a tire was tested to carry its load. It is not a recommended driving speed.",
  );
  assert.equal(LOAD_SPEED_VERDICT.meets.label, "Meets or exceeds your current tire");
  assert.equal(
    LOAD_SPEED_VERDICT.below.label,
    "Below your current tire. Not recommended by tire makers",
  );
  assert.ok(LOAD_RANGE_NOTES.some((n) => /\bXL\b/.test(n)));
  assert.ok(LOAD_RANGE_NOTES.some((n) => /\bSL\b/.test(n)));
  assert.ok(LOAD_RANGE_NOTES.some((n) => /\bLT\b/.test(n)));
});

test("load-speed: all strings follow house rules", () => {
  assertHouseRules([LOAD_RANGE_NOTES, SPEED_RATING_NOTE, LOAD_SPEED_VERDICT], "constants");
  for (const s of ["94V", "94", "9", "59V", "94Z", "94A", "hello", "121/118S", "98Y XL"]) {
    assertHouseRules(readServiceDescription(s), s);
  }
  for (const [a, b] of [
    [{ load: 94, speed: "V" }, { load: 91, speed: "H" }],
    [{ load: 94, speed: "V" }, { load: 94, speed: "V" }],
    [{ load: 60, speed: "L" }, { load: 126, speed: "Y" }],
  ]) {
    assertHouseRules(compareLoadSpeed(a, b), `${a.load}${a.speed} vs ${b.load}${b.speed}`);
  }
});

/* ---------------- D6: reading sizes ---------------- */

test("plus-size: reads P-metric, LT and flotation sizes", () => {
  const p = readSize("225/45R17");
  assert.equal(p.state, "decoded");
  assert.equal(p.label, "225/45R17");
  assert.equal(p.loadIndex, null);
  assert.equal(readSize("P215/60R16 95H").label, "P215/60R16");
  assert.equal(readSize("225/45ZR17 94W XL").loadIndex, 94);
  assert.equal(readSize("225/45ZR17 94W XL").xl, true);

  const lt = readSize("LT265/70R17 121/118S");
  assert.equal(lt.label, "LT265/70R17");
  assert.equal(lt.size.service, "LT");
  assert.equal(lt.loadIndex, 121);
  assert.equal(lt.dualLoad, 118);
  assert.equal(lt.speedRating, "S");
  const trailing = readSize("265/70r17lt");
  assert.equal(trailing.label, "LT265/70R17");
  assert.equal(trailing.size.service, "LT");

  const flot = readSize("33x12.50R20LT 114Q");
  assert.equal(flot.size.format, "flotation");
  assert.equal(flot.label, "33x12.50R20LT");
  assert.equal(flot.loadIndex, 114);
  assert.equal(readSize("31X10.50R15").label, "31x10.50R15");
});

test("plus-size: empty, partial and invalid sizes", () => {
  assert.equal(readSize("").state, "empty");
  assert.equal(readSize(undefined).state, "empty");
  for (const s of ["225", "225/", "225/45", "225/45R1", "LT", "31x10.5", "225/45R17 94"]) {
    assert.equal(readSize(s).state, "incomplete", s);
  }
  for (const s of ["hello", "225/45X17", "225/45R17 94W extra", "94V"]) {
    assert.equal(readSize(s).state, "error", s);
  }
  const w = comparePlusSize("hello", "225/45R17");
  assert.equal(w.state, "waiting");
  assert.equal(w.from.state, "error");
  assert.equal(w.to.state, "decoded");
  assert.equal(comparePlusSize("225/45R17", "").state, "waiting");
});

/* ---------------- D6: comparison ---------------- */

test("plus-size: default (215/55R17 → 235/45R18) is within the guideline", () => {
  const r = comparePlusSize(PLUS_SIZE_DEFAULTS.from, PLUS_SIZE_DEFAULTS.to);
  assert.equal(r.state, "compared");
  assert.equal(r.pctText, "+0.1%");
  assert.equal(r.direction, "taller");
  assert.equal(r.guideline.within, true);
  assert.equal(r.guideline.label, "Within the common 3% guideline");
  const row = (k) => r.rows.find((x) => x.key === k);
  assert.equal(row("diameter").from, "26.3 in");
  assert.equal(row("sidewall").from, "118 mm (4.7 in)");
  assert.equal(row("sidewall").to, "106 mm (4.2 in)");
  assert.equal(row("sidewall").change, "−12 mm");
  assert.equal(row("width").change, "+20 mm");
  assert.equal(row("rim").change, "+1 in");
  assert.equal(row("revs").from, "767");
  assert.match(r.notes[0], /an 18-inch wheel instead of a 17-inch one/);
  assert.equal(r.note, GUIDELINE_NOTE);
  assert.equal(r.toolHref, "/tire-size?size=215%2F55R17&vs=235%2F45R18");
});

test("plus-size: speedometer at 30/45/60/70 is compareSizes().actualAt", () => {
  const r = comparePlusSize("205/55R16", "225/40R18");
  const c = compareSizes("205/55R16", "225/40R18");
  assert.deepEqual(r.speedo.map((s) => s.indicated), SPEEDO_SPEEDS);
  assert.deepEqual(SPEEDO_SPEEDS, [30, 45, 60, 70]);
  for (const s of r.speedo) assert.equal(s.actual, c.actualAt(s.indicated));
  assert.equal(r.speedo[2].actualText, "60.5 mph");
  assert.match(r.speedoSentence, /indicated 60 mph .* about 60\.5 mph/);
  assert.match(r.speedoSentence, /read low/);
  assert.equal(r.ratio, c.to.overallDiameter / c.from.overallDiameter);
});

test("plus-size: a shorter size makes the speedometer read high", () => {
  const r = comparePlusSize("225/40R18", "205/55R16");
  assert.equal(r.direction, "shorter");
  assert.ok(r.pctText.startsWith("−"));
  assert.ok(r.speedo[2].actual < 60);
  assert.match(r.speedoSentence, /read high/);
});

test("plus-size: equal sizes change nothing", () => {
  const r = comparePlusSize("225/45R17", "225/45 r17");
  assert.equal(r.pctText, "0%");
  assert.equal(r.direction, "same");
  assert.match(r.diameterSentence, /same overall diameter/);
  assert.equal(r.guideline.within, true);
  for (const row of r.rows.filter((x) => x.key !== "diameter" && x.key !== "revs")) {
    assert.equal(row.change, "Same", row.key);
  }
  for (const s of r.speedo) assert.equal(s.actual, s.indicated);
  assert.match(r.speedoSentence, /read the same/);
  assert.deepEqual(r.notes, []);
});

test("plus-size: LT sizes, outside the 3% guideline, with a load check", () => {
  const ex = PLUS_SIZE_EXAMPLES.find((e) => e.from.startsWith("LT"));
  const r = comparePlusSize(ex.from, ex.to);
  assert.equal(r.pctText, "+3.5%");
  assert.equal(r.guideline.within, false);
  assert.equal(r.guideline.label, "Outside the common 3% guideline");
  assert.equal(r.load.state, "compared");
  assert.equal(r.load.meets, true);
  assert.match(r.load.text, /both 121/);
  assert.deepEqual(r.notes, []); // same wheel, both LT
  assert.equal(r.toolHref, "/tire-size?size=LT265%2F70R17&vs=LT285%2F70R17");
});

test("plus-size: P-metric to flotation, and P to LT", () => {
  const f = comparePlusSize("265/70R16", "31x10.50R15");
  assert.equal(f.state, "compared");
  assert.equal(f.pctText, "+1.3%");
  assert.equal(f.rows.find((x) => x.key === "rim").change, "−1 in");
  assert.match(f.notes[0], /a 15-inch wheel instead of a 16-inch one/);

  const lt = comparePlusSize("265/70R17", "LT265/70R17");
  assert.equal(lt.pctText, "0%");
  assert.ok(lt.notes.some((n) => /P-metric .* LT \(light truck\)/.test(n)));
});

test("plus-size: load index below, missing and outside the table", () => {
  const below = comparePlusSize("225/45R17 94W", "225/40R18 92W");
  assert.equal(below.load.state, "compared");
  assert.equal(below.load.verdict.key, "below");
  assert.match(below.load.text, /94 → 92, .* 88 lb less per tire/);

  assert.equal(comparePlusSize("225/45R17", "225/40R18 92W").load.state, "missing");
  assert.equal(
    comparePlusSize("LT315/75R16 127/124R", "LT315/75R16 127/124R").load.state,
    "outside",
  );
});

test("plus-size: percent text never hides a change or rounds past 3%", () => {
  assert.equal(pctText(0), "0%");
  assert.equal(pctText(1.23), "+1.2%");
  assert.equal(pctText(-1.23), "−1.2%");
  assert.equal(pctText(3), "+3.0%");
  assert.equal(pctText(3.01), "+3.01%");
  assert.equal(pctText(-3.02), "−3.02%");
  assert.equal(pctText(0.03), "+0.03%");
  assert.equal(pctText(0.001), "+<0.01%");
});

test("plus-size: the guideline note and house rules", () => {
  assert.equal(
    GUIDELINE_NOTE,
    "3% is a guideline, not a fitment approval. Load index, clearance and wheel width all matter. Have fitment confirmed before you order.",
  );
  assertHouseRules([GUIDELINE_NOTE, PLUS_SIZE_EXAMPLES], "constants");
  for (const [a, b] of [
    [PLUS_SIZE_DEFAULTS.from, PLUS_SIZE_DEFAULTS.to],
    ...PLUS_SIZE_EXAMPLES.map((e) => [e.from, e.to]),
    ["225/45R17", "225/45R17"],
    ["225/45R17 94W", "225/40R18 92W"],
    ["265/70R17", "LT265/70R17"],
    ["hello", "225/4"],
  ]) {
    assertHouseRules(comparePlusSize(a, b), `${a} → ${b}`);
  }
});
