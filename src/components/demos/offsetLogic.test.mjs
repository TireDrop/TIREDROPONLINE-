// Pure-logic tests for the wheel offset and clearance tool.
//   node --test src/components/demos/offsetLogic.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  BANDS,
  LIMITS,
  MM_PER_INCH,
  OFFSET_DEFAULTS,
  OFFSET_EXAMPLES,
  OFFSET_NOTE,
  RANGES,
  backspacingMm,
  bandFor,
  compareWheels,
  fmtBoth,
  fmtIn,
  fmtMm,
  inchesToMm,
  mmToInches,
  readNumber,
  readWheel,
  wheelPosition,
  worstBand,
} from "./offsetLogic.js";
import { BANNED_WORDS } from "./demoLogic.js";
import { compareSizes } from "../../data/tireMath.js";

const near = (a, b, eps = 1e-9) =>
  assert.ok(Math.abs(a - b) < eps, `${a} is not within ${eps} of ${b}`);

/** Every string a shopper can read in a value (not the state and key tags). */
function strings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) if (k !== "state" && k !== "key") strings(v, out);
  return out;
}

const wheel = (width, offset, diameter = "") => ({ width, offset, diameter });
const run = (cur, nxt, tires = {}) => compareWheels({ current: cur, next: nxt, tires });

/* ------------------------------ units ------------------------------ */

test("units: 25.4 mm to the inch, both ways", () => {
  assert.equal(MM_PER_INCH, 25.4);
  near(inchesToMm(9), 228.6);
  near(mmToInches(228.6), 9);
  near(mmToInches(inchesToMm(7.5)), 7.5);
});

test("formats: one decimal at most in mm, two in inches, never a minus", () => {
  assert.equal(fmtMm(22.7), "22.7 mm");
  assert.equal(fmtMm(10), "10 mm");
  assert.equal(fmtMm(-12.7), "12.7 mm");
  assert.equal(fmtMm(0.04), "0 mm");
  assert.equal(fmtMm(-0.04), "0 mm");
  assert.equal(fmtMm(6.349), "6.3 mm");
  assert.equal(fmtIn(25.4), "1.00 in");
  assert.equal(fmtIn(-12.7), "0.50 in");
  assert.equal(fmtIn(10), "0.39 in");
  assert.equal(fmtBoth(22.7), "22.7 mm (0.89 in)");
});

test("readNumber: plain numbers, signs and typing quirks", () => {
  assert.equal(readNumber("9"), 9);
  assert.equal(readNumber(" 8.5 "), 8.5);
  assert.equal(readNumber("-12"), -12);
  assert.equal(readNumber("−12"), -12, "a true minus sign");
  assert.equal(readNumber("+35"), 35);
  assert.equal(readNumber(".5"), 0.5);
  for (const bad of ["", "  ", "abc", "1e3", "9x", "NaN", "Infinity", "1,5", "--5", null, undefined]) {
    assert.equal(readNumber(bad), null, `"${bad}"`);
  }
});

/* ------------------------------ formulas ------------------------------ */

test("backspacing: half the width plus the offset", () => {
  // 9 in wide = 228.6 mm, half = 114.3 mm.
  near(backspacingMm(9, 0), 114.3);
  near(backspacingMm(9, 18), 132.3);
  near(backspacingMm(9, -12), 102.3);
  // The inch form: width / 2 + offset / 25.4.
  near(mmToInches(backspacingMm(9, 18)), 9 / 2 + 18 / 25.4);
  near(mmToInches(backspacingMm(8, 35)), 8 / 2 + 35 / 25.4);
});

test("readWheel: reads a full wheel and its backspacing", () => {
  const w = readWheel(wheel("9", "18", "20"));
  assert.equal(w.state, "ok");
  assert.equal(w.widthIn, 9);
  assert.equal(w.offsetMm, 18);
  assert.equal(w.diameterIn, 20);
  near(w.backspacingMm, 132.3);
  assert.equal(readWheel(wheel("9", "18")).diameterIn, null, "diameter is optional");
});

test("worked examples from the offset guide: outer and inner moves", () => {
  // Against an 18x8 ET45 wheel (src/content/learn/fitment/wheel-offset-backspacing.md).
  const base = wheel("8", "45", "18");
  // Rule 1: lower the offset 10 mm, same width: the whole wheel moves 10 mm out.
  let r = run(base, wheel("8", "35", "18"));
  near(r.outerMm, 10);
  near(r.innerMm, -10, 1e-9); // inner edge moves 10 mm away from the suspension
  // Rule 2: 1 inch wider, same offset: half goes each way.
  r = run(base, wheel("9", "45", "18"));
  near(r.outerMm, 12.7);
  near(r.innerMm, 12.7);
  // Both: 18x9 ET35 is 22.7 out and 2.7 in toward the suspension.
  r = run(base, wheel("9", "35", "18"));
  near(r.outerMm, 22.7, 1e-9);
  near(r.innerMm, 2.7, 1e-9);
  assert.equal(r.widthChangeMm, 25.4);
});

test("inner and outer moves are signed: out and toward the suspension are positive", () => {
  const r = run(wheel("9", "18"), wheel("9", "30"));
  near(r.outerMm, -12, 1e-9);
  near(r.innerMm, 12, 1e-9);
  assert.match(r.rows[0].change, /^12 mm in$/);
  assert.match(r.rows[1].change, /^12 mm toward the suspension$/);
  const out = run(wheel("9", "30"), wheel("9", "18"));
  assert.match(out.rows[0].change, /^12 mm out$/);
  assert.match(out.rows[1].change, /^12 mm away from the suspension$/);
});

test("the change in backspacing equals the inner edge move", () => {
  for (const [a, b] of [
    [wheel("8", "45"), wheel("9", "35")],
    [wheel("9", "18"), wheel("10", "-25")],
    [wheel("7.5", "40"), wheel("7.5", "40")],
  ]) {
    const r = run(a, b);
    near(r.backspace.changeMm, r.innerMm, 1e-9);
  }
});

test("the same wheel twice reads as no change", () => {
  const r = run(wheel("9", "18", "20"), wheel("9", "18", "20"), { current: "275/55R20", next: "275/55R20" });
  assert.equal(r.state, "compared");
  near(r.outerMm, 0);
  near(r.innerMm, 0);
  assert.equal(r.overall.key, "close");
  assert.equal(r.same, true);
  for (const row of r.rows) assert.match(row.change, /^(No change|Same)$/);
  assert.match(r.rows[0].read, /does not move/);
});

test("rounding: figures shown to a tenth of a mm and a hundredth of an inch", () => {
  const r = run(wheel("8", "45"), wheel("9", "35"));
  assert.match(r.rows[0].change, /^22\.7 mm out$/);
  assert.match(r.rows[0].read, /22\.7 mm \(0\.89 in\) out/);
  assert.match(r.backspace.current.text, /^5\.77 in \(146\.6 mm\)$/);
  assert.match(r.backspace.next.text, /^5\.88 in \(149\.3 mm\)$/);
});

test("positions: lips and sidewalls either side of the mounting surface", () => {
  // 9 in wide at ET18: backspacing 132.3, so 132.3 mm inboard, 96.3 mm outboard.
  const p = wheelPosition(9, 18);
  near(p.wheel.inner, -132.3);
  near(p.wheel.outer, 96.3);
  assert.equal(p.tire, null);
  // The tire is centered on the wheel's centerline, which is 18 mm inboard of the face.
  const t = wheelPosition(9, 18, 275);
  near(t.tire.inner, -18 - 137.5);
  near(t.tire.outer, -18 + 137.5);
  // The moves match: wheel and tire edges differ by what the comparison says.
  const r = run(wheel("9", "18"), wheel("9", "8"), { current: "275/55R20", next: "285/55R20" });
  near(r.positions.next.wheel.outer - r.positions.current.wheel.outer, r.outerMm, 1e-9);
  near(r.positions.current.wheel.inner - r.positions.next.wheel.inner, r.innerMm, 1e-9);
  near(r.positions.next.tire.outer - r.positions.current.tire.outer, r.tire.outerMm, 1e-9);
  near(r.positions.current.tire.inner - r.positions.next.tire.inner, r.tire.innerMm, 1e-9);
  assert.equal(run(wheel("9", "18"), wheel("9", "8")).positions.next.tire, null);
});

/* ------------------------------ tires ------------------------------ */

test("tires: width and diameter come from the shared tire math", () => {
  const r = run(wheel("9", "18", "20"), wheel("9", "8", "20"), {
    current: "275/55R20",
    next: "285/55R20",
  });
  const c = compareSizes("275/55R20", "285/55R20");
  assert.ok(r.tire);
  near(r.tire.widthChangeMm, c.widthChangeMm);
  near(r.tire.diameterChangePct, c.diameterChange);
  near(r.tire.diameterChangeIn, c.diameterChangeIn);
  assert.equal(r.tire.from, "275/55R20");
  // Tire edges: the wheel's move plus half the tire's width change.
  near(r.tire.outerMm, 10 + 5, 1e-9);
  near(r.tire.innerMm, -10 + 5, 1e-9);
  const keys = r.rows.map((x) => x.key);
  assert.deepEqual(keys, ["outer", "inner", "tireOuter", "tireInner", "tireWidth", "tireDiameter"]);
});

test("tires: a flotation size works, and the tool is fine without tires", () => {
  const r = run(wheel("9", "18", "18"), wheel("10", "-25", "20"), {
    current: "285/70R18",
    next: "33x12.50R20",
  });
  assert.ok(r.tire);
  assert.equal(r.rows.length, 6);
  const wheelsOnly = run(wheel("9", "18"), wheel("10", "-25"));
  assert.equal(wheelsOnly.tire, null);
  assert.deepEqual(wheelsOnly.rows.map((x) => x.key), ["outer", "inner"]);
});

test("tires: one size typed, or a bad size, never breaks the wheel result", () => {
  const one = run(wheel("9", "18"), wheel("9", "8"), { current: "275/55R20", next: "" });
  assert.equal(one.state, "compared");
  assert.equal(one.tire, null);
  assert.equal(one.oneTire, true);
  const bad = run(wheel("9", "18"), wheel("9", "8"), { current: "275/55R20", next: "banana" });
  assert.equal(bad.state, "compared");
  assert.equal(bad.tire, null);
  assert.ok(bad.tireProblems.next, "says what is wrong with the new size");
  const partial = run(wheel("9", "18"), wheel("9", "8"), { current: "275/55R20", next: "285/" });
  assert.ok(partial.tireProblems.next);
});

test("tires: notes when a wheel diameter changes or disagrees with the tire size", () => {
  const changed = run(wheel("9", "18", "18"), wheel("9", "18", "20"));
  assert.ok(changed.notes.some((n) => /18 to 20 inches/.test(n)));
  const mismatch = run(wheel("9", "18", "18"), wheel("9", "18", "20"), {
    current: "285/70R18",
    next: "285/70R18",
  });
  assert.ok(mismatch.notes.some((n) => /new tire size is made for a 18-inch wheel, but the new wheel diameter says 20/.test(n)));
  const quiet = run(wheel("9", "18", "20"), wheel("9", "8", "20"), { current: "275/55R20", next: "285/55R20" });
  assert.deepEqual(quiet.notes, []);
});

/* ------------------------------ bands ------------------------------ */

test("bands: the three labels", () => {
  assert.equal(BANDS.close.label, "Close to your current setup");
  assert.equal(BANDS.different.label, "Noticeably different: have the fit checked");
  assert.equal(BANDS.large.label, "Large change: call us before you order");
});

test("bands: boundaries for wheel and tire edges (6 mm and 19 mm)", () => {
  const e = LIMITS.edge;
  assert.equal(bandFor(0, e), BANDS.close);
  assert.equal(bandFor(6, e), BANDS.close, "exactly 6 mm is still close");
  assert.equal(bandFor(-6, e), BANDS.close, "direction does not matter");
  assert.equal(bandFor(6.04, e), BANDS.close, "judged on the figure shown: 6.0");
  assert.equal(bandFor(6.1, e), BANDS.different);
  assert.equal(bandFor(19, e), BANDS.different, "exactly 19 mm is still different");
  assert.equal(bandFor(-19, e), BANDS.different);
  assert.equal(bandFor(19.1, e), BANDS.large);
  assert.equal(bandFor(-80, e), BANDS.large);
});

test("bands: boundaries for tire width (10 mm and 25 mm) and diameter (1.5% and 3%)", () => {
  const w = LIMITS.tireWidth;
  assert.equal(bandFor(10, w), BANDS.close);
  assert.equal(bandFor(10.1, w), BANDS.different);
  assert.equal(bandFor(25, w), BANDS.different);
  assert.equal(bandFor(25.1, w), BANDS.large);
  const d = LIMITS.diameter;
  assert.equal(bandFor(1.5, d), BANDS.close);
  assert.equal(bandFor(-1.5, d), BANDS.close);
  assert.equal(bandFor(1.6, d), BANDS.different);
  assert.equal(bandFor(3, d), BANDS.different);
  assert.equal(bandFor(-3.1, d), BANDS.large);
});

test("bands: the worst result sets the headline", () => {
  assert.equal(worstBand([BANDS.close, BANDS.close]), BANDS.close);
  assert.equal(worstBand([BANDS.close, BANDS.large, BANDS.different]), BANDS.large);
  assert.equal(worstBand([BANDS.different, BANDS.close]), BANDS.different);
  assert.equal(worstBand([]), BANDS.close);
  // 5 mm one way is close; 7 mm one way is different; 25 mm out is large.
  assert.equal(run(wheel("9", "18"), wheel("9", "13")).overall, BANDS.close);
  assert.equal(run(wheel("9", "18"), wheel("9", "11")).overall, BANDS.different);
  assert.equal(run(wheel("9", "18"), wheel("9", "-7")).overall, BANDS.large);
});

test("bands: each row carries its own band and a sentence that names it", () => {
  const r = run(wheel("8", "45"), wheel("9", "35"));
  assert.equal(r.rows[0].band, BANDS.large, "22.7 mm out");
  assert.equal(r.rows[1].band, BANDS.close, "2.7 mm toward the suspension");
  assert.ok(r.rows[0].read.endsWith(`${BANDS.large.label}.`));
  assert.ok(r.rows[1].read.endsWith(`${BANDS.close.label}.`));
  assert.equal(r.overall, BANDS.large);
});

/* ------------------------------ bad input ------------------------------ */

test("input: blank boxes wait, they do not error", () => {
  const empty = readWheel(wheel("", ""));
  assert.equal(empty.state, "empty");
  assert.deepEqual(empty.errors, {});
  const half = readWheel(wheel("9", ""));
  assert.equal(half.state, "incomplete");
  assert.deepEqual(half.missing, ["offset"]);
  const waiting = run(wheel("", ""), wheel("9", "18"));
  assert.equal(waiting.state, "waiting");
  assert.equal(waiting.current.state, "empty");
  assert.equal(waiting.next.state, "ok");
  assert.equal(compareWheels().state, "waiting", "no argument at all");
  assert.equal(compareWheels({ current: null }).state, "waiting");
});

test("input: negative or zero width is an error that says what to do", () => {
  for (const bad of ["-9", "0", "-0.5"]) {
    const w = readWheel(wheel(bad, "18"));
    assert.equal(w.state, "error", bad);
    assert.match(w.errors.width, /more than zero/);
  }
});

test("input: width, offset and diameter outside a sane range are errors", () => {
  assert.match(readWheel(wheel("3.9", "18")).errors.width, /between 4 and 16/);
  assert.match(readWheel(wheel("16.5", "18")).errors.width, /between 4 and 16/);
  assert.equal(readWheel(wheel("4", "18")).state, "ok", "4 is the low end");
  assert.equal(readWheel(wheel("16", "18")).state, "ok", "16 is the high end");
  assert.match(readWheel(wheel("9", "151")).errors.offset, /between -150 and 150/);
  assert.match(readWheel(wheel("9", "-151")).errors.offset, /between -150 and 150/);
  assert.equal(readWheel(wheel("9", "150")).state, "ok");
  assert.equal(readWheel(wheel("9", "-150")).state, "ok");
  assert.match(readWheel(wheel("9", "18", "9")).errors.diameter, /between 10 and 30/);
  assert.match(readWheel(wheel("9", "18", "31")).errors.diameter, /between 10 and 30/);
  assert.equal(RANGES.width.min, 4);
});

test("input: NaN, text and junk are errors, never a crash or NaN on screen", () => {
  for (const bad of ["NaN", "abc", "Infinity", "1e9", "9..5"]) {
    const w = readWheel(wheel(bad, "18"));
    assert.equal(w.state, "error", bad);
    assert.ok(w.errors.width);
    const o = readWheel(wheel("9", bad));
    assert.equal(o.state, "error", bad);
    assert.ok(o.errors.offset);
    const d = readWheel(wheel("9", "18", bad));
    assert.equal(d.state, "error", bad);
    assert.ok(d.errors.diameter);
  }
  assert.equal(readWheel(wheel(9, 18)).state, "ok", "numbers, not just strings");
  assert.equal(readWheel(wheel(NaN, 18)).state, "error");
  assert.equal(readWheel(wheel(undefined, undefined)).state, "empty");
  const r = run(wheel("abc", "18"), wheel("9", "18"));
  assert.equal(r.state, "waiting");
  assert.equal(r.current.state, "error");
});

test("input: a negative offset is normal", () => {
  const w = readWheel(wheel("10", "-25"));
  assert.equal(w.state, "ok");
  near(w.backspacingMm, 127 - 25);
});

/* ------------------------------ presets ------------------------------ */

test("presets: every example reads, and together they show all three bands", () => {
  assert.equal(OFFSET_EXAMPLES.length, 4);
  const bands = new Set();
  for (const ex of OFFSET_EXAMPLES) {
    const r = compareWheels(ex);
    assert.equal(r.state, "compared", ex.label);
    assert.ok(r.tire, `${ex.label} has both tire sizes`);
    bands.add(r.overall.key);
  }
  assert.deepEqual([...bands].sort(), ["close", "different", "large"]);
  const labels = OFFSET_EXAMPLES.map((e) => e.label);
  assert.equal(new Set(labels).size, labels.length);
});

test("presets: the loaded example is the first one and lands in the middle band", () => {
  assert.equal(OFFSET_DEFAULTS, OFFSET_EXAMPLES[0]);
  const r = compareWheels(OFFSET_DEFAULTS);
  assert.equal(r.state, "compared");
  assert.equal(r.overall.key, "different");
  assert.match(r.live, /Overall: Noticeably different: have the fit checked\./);
});

/* ------------------------------ house rules ------------------------------ */

test("house rules: nothing promises a combination works", () => {
  const BANNED = [
    BANNED_WORDS,
    /\b(fits|approved?|will clear|will fit|clears)\b/i,
    /\b(discount|coupon|rebate|deal)s?\b/i,
  ];
  const seen = [];
  for (const ex of OFFSET_EXAMPLES) {
    seen.push(...strings(compareWheels(ex)));
    seen.push(...strings(ex));
  }
  seen.push(
    OFFSET_NOTE,
    ...strings(BANDS),
    ...strings(readWheel(wheel("-1", "999", "x")).errors),
    ...strings(readWheel(wheel("", "x")).errors),
  );
  for (const s of seen) {
    for (const re of BANNED) assert.ok(!re.test(s), `${re} in "${s}"`);
  }
  assert.match(OFFSET_NOTE, /not a fitment promise/);
  assert.match(OFFSET_NOTE, /confirms fitment by phone before any wheel ships/);
  assert.match(OFFSET_NOTE, /brakes, struts, fender lip, suspension and steering lock/);
});
