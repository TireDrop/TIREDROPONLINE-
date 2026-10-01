// Pure-logic tests for the maintenance demos (D8 rotation, D14 noise).
//   node --test src/components/demos/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

import { BANNED_WORDS } from "./demoLogic.js";
import {
  DRIVETRAINS,
  NOISE_CAUSES,
  NOISE_DEFAULTS,
  NOISE_MAX_CAUSES,
  NOISE_NOTE,
  NOISE_QUESTIONS,
  NOISE_RULES,
  POSITIONS,
  ROTATION_DEFAULTS,
  ROTATION_INTERVAL,
  ROTATION_PATTERNS,
  SETUPS,
  TREAD_TYPES,
  answerLabels,
  rankCauses,
  rotationPattern,
} from "./maintenanceLogic.js";
import { SOURCES } from "./sources.js";

/** Every string reachable in a value, for the house-rules sweep. */
function strings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object")
    Object.values(value).forEach((v) => strings(v, out));
  return out;
}

// The demoLogic sweep also bans "<n> miles"; D8's TIA interval is the one
// mileage figure these demos state, and it is checked on its own below.
function assertHouseRules(value, where) {
  for (const s of strings(value)) {
    assert.ok(!BANNED_WORDS.test(s), `${where}: banned word in "${s}"`);
    // "Diagnosis" only ever appears as "not a diagnosis".
    assert.ok(
      !/diagnos/i.test(s) || /not a diagnosis/.test(s),
      `${where}: diagnosis claim in "${s}"`,
    );
    assert.ok(!/\b(most likely|probably|definitely|arrive|today|tomorrow|discount|coupon|deal|% off)\b/i.test(s), `${where}: off-limits wording in "${s}"`);
  }
}

const STATUS_WORDS = [
  "Replace",
  "Consider replacing",
  "Have it inspected",
  "Keep checking monthly",
];

/* ---------------- D8 rotation ---------------- */

const EXPECTED = {
  // drivetrain → pattern for a square, non-directional set
  fwd: "forwardCross",
  rwd: "rearwardCross",
  awd: "xPattern",
  "4wd": "rearwardCross",
};

const combos = [];
for (const d of DRIVETRAINS)
  for (const t of TREAD_TYPES)
    for (const s of SETUPS)
      combos.push({ drivetrain: d.value, tread: t.value, setup: s.value });

test("rotation: 4 drivetrains × 2 treads × 2 setups = 16 combinations", () => {
  assert.equal(combos.length, 16);
  assert.deepEqual(
    DRIVETRAINS.map((d) => d.value),
    ["fwd", "rwd", "awd", "4wd"],
  );
  assert.deepEqual(TREAD_TYPES.map((t) => t.value), ["non", "dir"]);
  assert.deepEqual(SETUPS.map((s) => s.value), ["square", "stag"]);
});

test("rotation: every combination gets the right pattern", () => {
  for (const c of combos) {
    const p = rotationPattern(c);
    const where = JSON.stringify(c);
    assert.ok(p, where);
    let want;
    if (c.setup === "stag" && c.tread === "dir") want = "none";
    else if (c.setup === "stag") want = "sideToSide";
    else if (c.tread === "dir") want = "frontToBack";
    else want = EXPECTED[c.drivetrain];
    assert.equal(p.id, want, where);
    assert.equal(p.rotates, want !== "none", where);
    assert.equal(p.interval, ROTATION_INTERVAL, where);
    assert.deepEqual(p.sources, ["S18", "C5"], where);
  }
});

test("rotation: named cases read as the prototype does", () => {
  const p = (drivetrain, tread = "non", setup = "square") =>
    rotationPattern({ drivetrain, tread, setup });
  assert.equal(p("fwd").name, "Forward cross");
  assert.equal(p("rwd").name, "Rearward cross");
  assert.equal(p("4wd").name, "Rearward cross");
  assert.equal(p("awd").name, "X-pattern");
  for (const d of ["fwd", "rwd", "awd", "4wd"]) {
    assert.equal(p(d, "dir").name, "Front-to-back", d);
    assert.equal(p(d, "non", "stag").name, "Side-to-side", d);
    assert.equal(p(d, "dir", "stag").name, "No rotation", d);
    assert.match(p(d, "dir", "stag").why, /Ask us about your setup/);
  }
  assert.deepEqual(rotationPattern(ROTATION_DEFAULTS).id, "forwardCross");
});

test("rotation: every pattern is a permutation, so no tire is lost", () => {
  for (const [id, pat] of Object.entries(ROTATION_PATTERNS)) {
    assert.deepEqual(Object.keys(pat.moves).sort(), [...POSITIONS].sort(), id);
    assert.deepEqual(Object.values(pat.moves).sort(), [...POSITIONS].sort(), id);
  }
  for (const c of combos) {
    const p = rotationPattern(c);
    const where = JSON.stringify(c);
    assert.deepEqual(p.steps.map((s) => s.from), POSITIONS, where);
    assert.deepEqual(p.steps.map((s) => s.to).sort(), [...POSITIONS].sort(), where);
    assert.equal(new Set(p.steps.map((s) => s.to)).size, 4, where);
  }
});

test("rotation: the moves each pattern is known for", () => {
  const m = (id) => ROTATION_PATTERNS[id].moves;
  // Forward cross: drive-axle fronts straight back, rears cross forward.
  assert.deepEqual(m("forwardCross"), { LF: "LR", RF: "RR", LR: "RF", RR: "LF" });
  // Rearward cross: drive-axle rears straight forward, fronts cross back.
  assert.deepEqual(m("rearwardCross"), { LF: "RR", RF: "LR", LR: "LF", RR: "RF" });
  // X: every tire changes side and axle.
  for (const [from, to] of Object.entries(m("xPattern"))) {
    assert.notEqual(from[0], to[0], from);
    assert.notEqual(from[1], to[1], from);
  }
  // Directional tires never change side.
  for (const [from, to] of Object.entries(m("frontToBack"))) {
    assert.equal(from[0], to[0], from);
    assert.notEqual(from[1], to[1], from);
  }
  // Staggered tires never change axle.
  for (const [from, to] of Object.entries(m("sideToSide"))) {
    assert.equal(from[1], to[1], from);
    assert.notEqual(from[0], to[0], from);
  }
  // No rotation: every tire stays put.
  for (const [from, to] of Object.entries(m("none"))) assert.equal(from, to);
});

test("rotation: the text list always has four lines", () => {
  const fwd = rotationPattern({ drivetrain: "fwd", tread: "non", setup: "square" });
  assert.deepEqual(
    fwd.steps.map((s) => s.text),
    [
      "Left front → Left rear",
      "Right front → Right rear",
      "Left rear → Right front",
      "Right rear → Left front",
    ],
  );
  const none = rotationPattern({ drivetrain: "awd", tread: "dir", setup: "stag" });
  assert.equal(none.steps.length, 4);
  assert.equal(none.steps[0].text, "Left front: stays in place");
  assert.ok(none.steps.every((s) => !s.moves));
});

test("rotation: interval and owner's manual", () => {
  assert.equal(
    ROTATION_INTERVAL,
    "Typical interval: every 5,000–7,000 miles (TIA). Your owner's manual comes first.",
  );
});

test("rotation: unknown choices return null", () => {
  assert.equal(rotationPattern(null), null);
  assert.equal(rotationPattern({}), null);
  assert.equal(rotationPattern({ drivetrain: "6wd", tread: "non", setup: "square" }), null);
  assert.equal(rotationPattern({ drivetrain: "fwd", tread: "x", setup: "square" }), null);
  assert.equal(rotationPattern({ drivetrain: "fwd", tread: "non", setup: "x" }), null);
});

test("rotation: all strings follow house rules", () => {
  assertHouseRules([DRIVETRAINS, TREAD_TYPES, SETUPS], "options");
  for (const c of combos) assertHouseRules(rotationPattern(c), JSON.stringify(c));
});

/* ---------------- D14 noise and vibration ---------------- */

const ids = (answers, rules) => rankCauses(answers, rules).causes.map((c) => c.id);

const allAnswers = [];
for (const w of NOISE_QUESTIONS[0].options)
  for (const f of NOISE_QUESTIONS[1].options)
    for (const h of NOISE_QUESTIONS[2].options)
      allAnswers.push({ when: w.value, feel: f.value, hear: h.value });

test("noise: the rules table only names known causes and answers", () => {
  const causeIds = new Set(NOISE_CAUSES.map((c) => c.id));
  assert.equal(causeIds.size, NOISE_CAUSES.length);
  assert.deepEqual(
    NOISE_CAUSES.map((c) => c.id),
    ["balance", "round", "bent", "align", "rotor", "bearing", "joint", "tread"],
  );
  for (const rule of NOISE_RULES) {
    for (const [q, v] of Object.entries(rule.if)) {
      const question = NOISE_QUESTIONS.find((x) => x.id === q);
      assert.ok(question, `unknown question ${q}`);
      assert.ok(question.options.some((o) => o.value === v), `${q}=${v}`);
    }
    for (const [cause, pts] of Object.entries(rule.points)) {
      assert.ok(causeIds.has(cause), cause);
      assert.ok(Number.isInteger(pts) && pts > 0, `${cause} ${pts}`);
    }
  }
  // Every cause can be reached by some answer.
  for (const c of NOISE_CAUSES) {
    assert.ok(NOISE_RULES.some((r) => r.points[c.id]), c.id);
  }
});

test("noise: the rules table's scores, cause by cause", () => {
  const scores = (a) =>
    Object.fromEntries(rankCauses(a).causes.map((c) => [c.id, c.score]));
  assert.deepEqual(scores({ when: "hwy", feel: "wheel", hear: "none" }), {
    balance: 5,
    round: 2,
    bent: 2,
    align: 1,
  });
  assert.deepEqual(scores({ when: "brake", feel: "pedal", hear: "grind" }), {
    rotor: 9,
    bearing: 1,
  });
  // The one two-answer rule: braking felt in the steering wheel.
  assert.deepEqual(scores({ when: "brake", feel: "wheel", hear: "none" }), {
    rotor: 5,
    balance: 2,
    align: 1,
  });
  assert.deepEqual(scores({ when: "brake", feel: "seat", hear: "none" }), {
    rotor: 4,
    balance: 1,
    round: 1,
    tread: 1,
  });
});

test("noise: ranked by points, most first", () => {
  assert.deepEqual(ids({ when: "hwy", feel: "wheel", hear: "none" }), [
    "balance",
    "round",
    "bent",
    "align",
  ]);
  assert.deepEqual(ids({ when: "always", feel: "seat", hear: "thump" }), [
    "round", // 2 + 1 + 3
    "tread", // 1 + 1 + 1
    "bent", // 2
    "balance", // 1
  ]);
  assert.deepEqual(ids({ when: "brake", feel: "pedal", hear: "grind" }), [
    "rotor",
    "bearing",
  ]);
});

test("noise: ties keep the causes table's order", () => {
  // Round and bent both score 2; round comes first in NOISE_CAUSES.
  assert.deepEqual(ids({ when: "low", feel: "none", hear: "none" }), [
    "round",
    "bent",
  ]);
  // Joint and tread both score 3 behind bearing's 5.
  assert.deepEqual(ids({ when: "turn", feel: "none", hear: "hum" }), [
    "bearing",
    "joint",
    "tread",
  ]);
  // Two ties at the cut-off: balance = tread = 4, round = bearing = 3,
  // bent = 2 drops off the end of the top four.
  const r = rankCauses({ when: "hwy", feel: "seat", hear: "hum" });
  assert.deepEqual(
    r.causes.map((c) => [c.id, c.score]),
    [
      ["balance", 4],
      ["tread", 4],
      ["round", 3],
      ["bearing", 3],
    ],
  );
});

test("noise: the order doesn't depend on how the rules are listed", () => {
  const reversed = [...NOISE_RULES].reverse();
  const rotated = [...NOISE_RULES.slice(5), ...NOISE_RULES.slice(0, 5)];
  for (const a of allAnswers) {
    const base = rankCauses(a);
    for (const rules of [reversed, rotated]) {
      const other = rankCauses(a, rules);
      assert.deepEqual(other.causes, base.causes, JSON.stringify(a));
    }
    // And the same answers always give the same list.
    assert.deepEqual(rankCauses({ ...a }).causes, base.causes);
  }
});

test("noise: every answer combination gives 1–4 causes, sorted, ranked", () => {
  assert.equal(allAnswers.length, 5 * 4 * 4);
  const order = new Map(NOISE_CAUSES.map((c, i) => [c.id, i]));
  for (const a of allAnswers) {
    const r = rankCauses(a);
    const where = JSON.stringify(a);
    assert.ok(r.causes.length >= 1 && r.causes.length <= NOISE_MAX_CAUSES, where);
    assert.equal(r.message, null, where);
    assert.equal(r.status.label, "Have it inspected", where);
    assert.deepEqual(r.causes.map((c) => c.rank), r.causes.map((_, i) => i + 1));
    for (let i = 1; i < r.causes.length; i++) {
      const [p, c] = [r.causes[i - 1], r.causes[i]];
      assert.ok(
        p.score > c.score || (p.score === c.score && order.get(p.id) < order.get(c.id)),
        `${where}: ${p.id} before ${c.id}`,
      );
    }
    for (const c of r.causes) {
      assert.ok(c.score > 0);
      assert.ok(c.service, c.id);
      assert.equal(
        c.matched.reduce((n, m) => n + m.points, 0),
        c.score,
        `${where}: ${c.id} points add up`,
      );
    }
  }
});

test("noise: each cause says why it was listed and what checks it", () => {
  const [top] = rankCauses({ when: "hwy", feel: "wheel", hear: "none" }).causes;
  assert.equal(top.name, "Wheel out of balance");
  assert.equal(top.service, "Tire balancing");
  assert.equal(
    top.matchedText,
    "Matched: at highway speed (+3), felt in the steering wheel (+2).",
  );
  const rotor = rankCauses({ when: "brake", feel: "wheel", hear: "grind" }).causes[0];
  assert.equal(
    rotor.matchedText,
    "Matched: when braking (+4), when braking and felt in the steering wheel (+1), grinding or scraping (+2).",
  );
});

test("noise: no answers, or unknown ones, list nothing", () => {
  for (const a of [null, {}, { when: "x", feel: "y", hear: "z" }]) {
    const r = rankCauses(a);
    assert.deepEqual(r.causes, []);
    assert.ok(r.message);
    assert.equal(r.status.label, "Have it inspected");
  }
});

test("noise: the note says it is a rules table, not a diagnosis", () => {
  assert.match(
    NOISE_NOTE,
    /^This ranking is a simple rules table, not a diagnosis\. Have it inspected\./,
  );
  assert.deepEqual(rankCauses(NOISE_DEFAULTS).sources, ["S45", "S38"]);
});

test("noise: answer labels for the review line", () => {
  assert.deepEqual(answerLabels(NOISE_DEFAULTS).map((x) => x.label), [
    "At highway speed",
    "Steering wheel",
    "Nothing unusual",
  ]);
  assert.equal(answerLabels({}).every((x) => x.label === null), true);
});

test("noise: all strings follow house rules", () => {
  assertHouseRules([NOISE_CAUSES, NOISE_QUESTIONS], "tables");
  for (const a of allAnswers) assertHouseRules(rankCauses(a), JSON.stringify(a));
});

/* ---------------- Shared ---------------- */

test("status words come from the shared vocabulary only", () => {
  for (const a of allAnswers) {
    assert.ok(STATUS_WORDS.includes(rankCauses(a).status.label));
  }
});

test("every source these demos cite is in sources.js", () => {
  const cited = new Set([
    ...rankCauses(NOISE_DEFAULTS).sources,
    ...rotationPattern(ROTATION_DEFAULTS).sources,
  ]);
  for (const sid of cited) {
    assert.ok(SOURCES[sid]?.url?.startsWith("https://"), sid);
    assert.ok(SOURCES[sid].label, sid);
  }
});
