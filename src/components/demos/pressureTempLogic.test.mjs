// Pure-logic tests for D4, Pressure vs temperature.
//   node --test src/components/demos/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ATM_PSI,
  ESTIMATE_NOTE,
  HOT_TIRE_CALLOUT,
  PRESSURE_DEFAULTS,
  PRESSURE_PRESETS,
  RANKINE_OFFSET,
  TABLE_TEMPS,
  TPMS_NOTE,
  fmtPsi,
  gasLawPsi,
  matchPreset,
  pressureReading,
  readFillTemp,
  readNowTemp,
  readPsi,
  ruleOfThumbPsi,
} from "./pressureTempLogic.js";
import { BANNED_WORDS } from "./demoLogic.js";
import { SOURCES } from "./sources.js";

/** Every string reachable in a value, for the house-rules sweep. */
function strings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object")
    Object.values(value).forEach((v) => strings(v, out));
  return out;
}

/** House rules, plus D4's own: never a recommended or target pressure. */
function assertHouseRules(value, where) {
  for (const s of strings(value)) {
    assert.ok(!BANNED_WORDS.test(s), `${where}: banned word in "${s}"`);
    assert.ok(!/recommend/i.test(s), `${where}: "recommend" in "${s}"`);
    assert.ok(
      !/\b(set|inflate|fill|add air)\b[^.]*\bto \d/i.test(s),
      `${where}: a pressure to set in "${s}"`,
    );
    assert.ok(!/should (be|read)/i.test(s), `${where}: target wording in "${s}"`);
  }
}

const close = (actual, expected, tol, msg) =>
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `${msg ?? ""} expected ${expected} ± ${tol}, got ${actual}`,
  );

/* ---------------- The two formulas ---------------- */

test("pressure: gas law is P2 = (P1+14.7)(T2+459.67)/(T1+459.67) − 14.7", () => {
  assert.equal(ATM_PSI, 14.7);
  assert.equal(RANKINE_OFFSET, 459.67);
  const expected = ((35 + 14.7) * (95 + 459.67)) / (78 + 459.67) - 14.7;
  assert.equal(gasLawPsi(35, 78, 95), expected);
  close(gasLawPsi(35, 78, 95), 36.571, 0.001);
});

test("pressure: gas law matches the article's worked examples (35 PSI)", () => {
  // docs/content/pilot-verification.md, tire-pressure-temperature.
  close(gasLawPsi(35, 75, 95) - 35, 1.9, 0.05, "75→95");
  close(gasLawPsi(35, 70, 90) - 35, 1.9, 0.05, "70→90");
  close(gasLawPsi(35, 90, 70) - 35, -1.8, 0.05, "90→70");
  close(gasLawPsi(35, 80, 55) - 35, -2.3, 0.05, "80→55");
});

test("pressure: rule of thumb is 1 PSI per 10°F", () => {
  assert.equal(ruleOfThumbPsi(35, 78, 95), 36.7);
  assert.equal(ruleOfThumbPsi(35, 82, 48), 31.6);
  assert.equal(ruleOfThumbPsi(35, 70, 80), 36);
  assert.equal(ruleOfThumbPsi(35, 80, 70), 34);
});

test("pressure: same temperature gives the same pressure", () => {
  for (const t of [-20, 0, 48, 78, 110]) {
    close(gasLawPsi(35, t, t), 35, 1e-9, `${t}°F`);
    assert.equal(ruleOfThumbPsi(35, t, t), 35);
  }
});

test("pressure: gas law runs both ways and rises with temperature", () => {
  const there = gasLawPsi(35, 72, 96);
  close(gasLawPsi(there, 96, 72), 35, 1e-9, "round trip");
  let prev = -Infinity;
  for (let t = 30; t <= 110; t += 5) {
    const p = gasLawPsi(35, 78, t);
    assert.ok(p > prev, `${t}°F`);
    prev = p;
  }
  // Absolute pressure scales, so a higher fill pressure moves more per degree.
  assert.ok(gasLawPsi(80, 78, 110) - 80 > gasLawPsi(20, 78, 110) - 20);
});

test("pressure: formulas reject non-numbers and absolute zero", () => {
  for (const bad of [NaN, Infinity, undefined, null, "35"]) {
    assert.equal(gasLawPsi(bad, 78, 95), null, String(bad));
    assert.equal(ruleOfThumbPsi(bad, 78, 95), null, String(bad));
  }
  assert.equal(gasLawPsi(35, -RANKINE_OFFSET, 95), null);
  assert.equal(gasLawPsi(35, 78, -500), null);
});

test("pressure: readings print with one decimal", () => {
  assert.equal(fmtPsi(36.571), "36.6");
  assert.equal(fmtPsi(35), "35.0");
  assert.equal(fmtPsi(-0.04), "0.0");
  assert.equal(fmtPsi(-3.12), "-3.1");
  assert.equal(fmtPsi(31.649), "31.6");
});

/* ---------------- Input validation ---------------- */

test("pressure: door-sticker PSI must be 20–80", () => {
  assert.deepEqual(readPsi("35"), { ok: true, value: 35 });
  assert.deepEqual(readPsi(" 35.5 "), { ok: true, value: 35.5 });
  assert.equal(readPsi("20").ok, true);
  assert.equal(readPsi("80").ok, true);
  for (const bad of ["", "   ", null, "abc", "35psi", "19.9", "80.1", "-35", "3 5"]) {
    const r = readPsi(bad);
    assert.equal(r.ok, false, String(bad));
    assert.ok(r.message, String(bad));
  }
  assert.match(readPsi("").message, /door jamb/);
  assert.match(readPsi("100").message, /20 to 80 PSI/);
});

test("pressure: fill temperature takes −20 to 120°F, negatives included", () => {
  assert.deepEqual(readFillTemp("-5"), { ok: true, value: -5 });
  assert.equal(readFillTemp("-20").ok, true);
  assert.equal(readFillTemp("120").ok, true);
  assert.equal(readFillTemp("-21").ok, false);
  assert.equal(readFillTemp("121").ok, false);
  assert.equal(readFillTemp("").ok, false);
  assert.equal(readFillTemp("hot").ok, false);
});

test("pressure: temperature now is the 30–110°F slider", () => {
  assert.equal(readNowTemp(30).ok, true);
  assert.equal(readNowTemp(110).ok, true);
  assert.equal(readNowTemp(29).ok, false);
  assert.equal(readNowTemp(111).ok, false);
});

/* ---------------- Presets ---------------- */

test("pressure: the three presets", () => {
  assert.deepEqual(
    PRESSURE_PRESETS.map((p) => [p.label, p.fillTemp, p.nowTemp]),
    [
      ["July Miami: 7 am → 3 pm", 78, 95],
      ["Cold-front morning", 82, 48],
      ["A/C garage → driveway", 72, 96],
    ],
  );
  assert.equal(matchPreset("78", 95).id, "miami");
  assert.equal(matchPreset(82, 48).id, "front");
  assert.equal(matchPreset("72", "96").id, "garage");
  assert.equal(matchPreset(78, 96), null);
  // The default state is the first preset, so it shows as pressed.
  assert.equal(
    matchPreset(PRESSURE_DEFAULTS.fillTemp, PRESSURE_DEFAULTS.nowTemp).id,
    "miami",
  );
  for (const p of PRESSURE_PRESETS) {
    assert.equal(pressureReading({ psi: "35", ...p }).state, "estimated", p.id);
  }
});

test("pressure: preset directions (heat up, cold front down)", () => {
  const miami = pressureReading({ psi: "35", fillTemp: 78, nowTemp: 95 });
  assert.equal(miami.direction, "higher");
  assert.equal(miami.gasText, "36.6 PSI");
  assert.equal(miami.thumbText, "36.7 PSI");

  const front = pressureReading({ psi: "35", fillTemp: 82, nowTemp: 48 });
  assert.equal(front.direction, "lower");
  assert.equal(front.gasText, "31.9 PSI");
  assert.equal(front.thumbText, "31.6 PSI");
  assert.match(front.change, /about 3\.1 PSI lower/);

  const garage = pressureReading({ psi: "35", fillTemp: 72, nowTemp: 96 });
  assert.equal(garage.direction, "higher");
});

/* ---------------- The full reading ---------------- */

test("pressure: reading labels estimates and names the door-sticker value", () => {
  const r = pressureReading({ psi: "35", fillTemp: "78", nowTemp: 95 });
  assert.equal(r.state, "estimated");
  assert.equal(r.placard, 35);
  assert.match(r.summary, /your door-sticker value of 35 PSI/);
  assert.match(r.summary, /about 36\.6 PSI by the gas law/);
  assert.match(r.summary, /36\.7 PSI by the rule of thumb/);
  assert.match(r.valueText, /estimated 36\.6 PSI/);
  assert.match(ESTIMATE_NOTE, /estimates/);
  assert.match(ESTIMATE_NOTE, /door-sticker value/);
  assert.match(ESTIMATE_NOTE, /cold/);
});

test("pressure: no change reads as about the same", () => {
  const r = pressureReading({ psi: "35", fillTemp: "80", nowTemp: 80 });
  assert.equal(r.direction, "same");
  assert.match(r.change, /about the same/);
  assert.equal(r.gasText, "35.0 PSI");
});

test("pressure: table covers 40–110°F and marks the row nearest now", () => {
  assert.deepEqual(TABLE_TEMPS, [40, 50, 60, 70, 80, 90, 100, 110]);
  const r = pressureReading({ psi: "35", fillTemp: "78", nowTemp: 95 });
  assert.deepEqual(r.rows.map((row) => row.temp), TABLE_TEMPS);
  assert.deepEqual(
    r.rows.filter((row) => row.current).map((row) => row.temp),
    [100],
  );
  const at80 = r.rows.find((row) => row.temp === 80);
  assert.equal(at80.gasText, `${fmtPsi(gasLawPsi(35, 78, 80))} PSI`);
  assert.equal(at80.thumbText, "35.2 PSI");
  // Below the table, the first row is marked; above it, the last.
  const cold = pressureReading({ psi: "35", fillTemp: "78", nowTemp: 30 });
  assert.equal(cold.rows.find((row) => row.current).temp, 40);
  const hot = pressureReading({ psi: "35", fillTemp: "78", nowTemp: 110 });
  assert.equal(hot.rows.find((row) => row.current).temp, 110);
});

test("pressure: TPMS note only at 25% or more below the door-sticker value", () => {
  const typical = pressureReading({ psi: "35", fillTemp: "82", nowTemp: 48 });
  assert.equal(typical.tpms.low, false);
  assert.equal(typical.tpms.text, null);
  close(typical.tpms.linePsi, 26.25, 1e-9);

  // 20 PSI set at 120°F, read at 30°F: about 27% below.
  const low = pressureReading({ psi: "20", fillTemp: "120", nowTemp: 30 });
  assert.equal(low.tpms.low, true);
  assert.ok(low.tpms.belowPct >= 25, String(low.tpms.belowPct));
  assert.match(low.tpms.text, /27% below your door-sticker value/);
  assert.match(low.tpms.text, /FMVSS No\. 138/);

  // Warmer than at fill: never below.
  const warm = pressureReading({ psi: "35", fillTemp: "70", nowTemp: 100 });
  assert.equal(warm.tpms.low, false);
  assert.equal(warm.tpms.belowPct, 0);
  assert.match(TPMS_NOTE, /25% or more below the door-sticker value/);
});

test("pressure: bad input reports every field that doesn't read", () => {
  const r = pressureReading({ psi: "", fillTemp: "abc", nowTemp: 200 });
  assert.equal(r.state, "error");
  assert.deepEqual(Object.keys(r.errors).sort(), ["fillTemp", "nowTemp", "psi"]);
  const one = pressureReading({ psi: "35", fillTemp: "", nowTemp: 95 });
  assert.deepEqual(Object.keys(one.errors), ["fillTemp"]);
});

test("pressure: callout says not to let air out of a hot tire", () => {
  assert.match(HOT_TIRE_CALLOUT.text, /Don't let air out of a hot tire/);
  assert.match(HOT_TIRE_CALLOUT.text, /3\+ hours/);
});

test("pressure: sources exist", () => {
  const r = pressureReading({ psi: "35", fillTemp: "78", nowTemp: 95 });
  for (const sid of r.sources) assert.ok(SOURCES[sid]?.url, sid);
});

test("pressure: all strings follow house rules and never suggest a PSI", () => {
  assertHouseRules(
    { PRESSURE_PRESETS, HOT_TIRE_CALLOUT, ESTIMATE_NOTE, TPMS_NOTE },
    "constants",
  );
  for (const psi of ["20", "35", "44", "80", "", "x"]) {
    for (const [t1, t2] of [
      [78, 95],
      [82, 48],
      [72, 96],
      [120, 30],
      [-20, 110],
      [60, 60],
    ]) {
      assertHouseRules(
        pressureReading({ psi, fillTemp: String(t1), nowTemp: t2 }),
        `${psi} ${t1}→${t2}`,
      );
    }
  }
});
