// Pure logic behind the maintenance demos, D8 (rotation pattern) and D14
// (noise and vibration): no React, no DOM, so it runs in the node test runner
// and in a build-time prerender alike. Same pattern as demoLogic.js, whose
// shared status vocabulary it reuses.
//
// House rules apply to every string in this file. Nothing here is called
// "safe", "OK" or "fine", and D14 never claims a diagnosis: its ranking is a
// fixed rules table (NOISE_RULES), not a probability.

import { STATUS } from "./demoLogic.js";

/* ------------------------------------------------------------------ *
 * Tire rotation pattern (D8)
 * ------------------------------------------------------------------ */

/** Wheel positions, in the order the step list reads them. */
export const POSITIONS = ["LF", "RF", "LR", "RR"];

export const POSITION_NAMES = {
  LF: "Left front",
  RF: "Right front",
  LR: "Left rear",
  RR: "Right rear",
};

export const DRIVETRAINS = [
  { value: "fwd", label: "Front-wheel drive", hint: "FWD" },
  { value: "rwd", label: "Rear-wheel drive", hint: "RWD" },
  { value: "awd", label: "All-wheel drive", hint: "AWD" },
  { value: "4wd", label: "4-wheel drive", hint: "4WD or 4x4" },
];

export const TREAD_TYPES = [
  {
    value: "non",
    label: "Non-directional",
    hint: "No rotation arrow on the sidewall",
  },
  {
    value: "dir",
    label: "Directional",
    hint: "An arrow on the sidewall shows which way it rolls",
  },
];

export const SETUPS = [
  { value: "square", label: "Same size all around", hint: "Square setup" },
  { value: "stag", label: "Staggered", hint: "Wider tires on the rear" },
];

export const ROTATION_DEFAULTS = { drivetrain: "fwd", tread: "non", setup: "square" };

/**
 * Each pattern moves the tire at `from` to `moves[from]`. Every map covers
 * all four positions and is a permutation, so no tire is lost or doubled.
 */
export const ROTATION_PATTERNS = {
  forwardCross: {
    id: "forwardCross",
    name: "Forward cross",
    why: "Fronts go straight back. Rears cross to the front.",
    moves: { LF: "LR", RF: "RR", LR: "RF", RR: "LF" },
  },
  rearwardCross: {
    id: "rearwardCross",
    name: "Rearward cross",
    why: "Rears go straight forward. Fronts cross to the back.",
    moves: { LF: "RR", RF: "LR", LR: "LF", RR: "RF" },
  },
  xPattern: {
    id: "xPattern",
    name: "X-pattern",
    why: "Every tire moves diagonally, to the opposite side and the other axle.",
    moves: { LF: "RR", RF: "LR", LR: "RF", RR: "LF" },
  },
  frontToBack: {
    id: "frontToBack",
    name: "Front-to-back",
    why: "Directional tires stay on the same side so they keep rolling the way the arrow points.",
    moves: { LF: "LR", RF: "RR", LR: "LF", RR: "RF" },
  },
  sideToSide: {
    id: "sideToSide",
    name: "Side-to-side",
    why: "Wider rears can't move to the front, so tires swap sides on the same axle.",
    moves: { LF: "RF", RF: "LF", LR: "RR", RR: "LR" },
  },
  none: {
    id: "none",
    name: "No rotation",
    why: "Staggered directional tires can't swap sides or axles without being remounted on their wheels. Ask us about your setup.",
    moves: { LF: "LF", RF: "RF", LR: "LR", RR: "RR" },
  },
};

export const ROTATION_INTERVAL =
  "Typical interval: every 5,000–7,000 miles (TIA). Your owner's manual comes first.";

const ROTATION_SOURCES = ["S18", "C5"];

const known = (list, v) => list.some((o) => o.value === v);

/** Which pattern id a drivetrain, tread type and setup call for. */
export function rotationPatternId({ drivetrain, tread, setup }) {
  if (setup === "stag") return tread === "dir" ? "none" : "sideToSide";
  if (tread === "dir") return "frontToBack";
  if (drivetrain === "fwd") return "forwardCross";
  if (drivetrain === "awd") return "xPattern";
  return "rearwardCross"; // rwd and 4wd
}

/**
 * The pattern, its step list and the interval note for one set of choices,
 * or null when a choice isn't one of the listed options.
 */
export function rotationPattern(choice) {
  const { drivetrain, tread, setup } = choice ?? {};
  if (
    !known(DRIVETRAINS, drivetrain) ||
    !known(TREAD_TYPES, tread) ||
    !known(SETUPS, setup)
  ) {
    return null;
  }

  const p = ROTATION_PATTERNS[rotationPatternId({ drivetrain, tread, setup })];
  const steps = POSITIONS.map((from) => {
    const to = p.moves[from];
    return {
      from,
      to,
      moves: from !== to,
      text:
        from === to
          ? `${POSITION_NAMES[from]}: stays in place`
          : `${POSITION_NAMES[from]} → ${POSITION_NAMES[to]}`,
    };
  });

  return {
    ...p,
    rotates: steps.some((s) => s.moves),
    steps,
    interval: ROTATION_INTERVAL,
    sources: ROTATION_SOURCES,
  };
}

/* ------------------------------------------------------------------ *
 * Noise and vibration (D14)
 * ------------------------------------------------------------------ */

/**
 * The possible causes. Table order is also the tie-break order: two causes
 * with the same points are always listed in this order.
 */
export const NOISE_CAUSES = [
  { id: "balance", name: "Wheel out of balance", service: "Tire balancing" },
  {
    id: "round",
    name: "Tire out of round or a separated belt",
    service: "Tire inspection",
  },
  { id: "bent", name: "Bent wheel", service: "Wheel inspection" },
  {
    id: "align",
    name: "Alignment wear on the tread",
    service: "Alignment check",
  },
  { id: "rotor", name: "Warped or worn brake rotors", service: "Brake inspection" },
  { id: "bearing", name: "Wheel bearing", service: "Suspension inspection" },
  {
    id: "joint",
    name: "CV joint or steering part",
    service: "Suspension and steering inspection",
  },
  {
    id: "tread",
    name: "Uneven or cupped tread",
    service: "Tire inspection and rotation",
  },
];

/**
 * The three questions. `reason` is how an answer reads in "Matched: …"; an
 * answer without one has no rules.
 */
export const NOISE_QUESTIONS = [
  {
    id: "when",
    legend: "When does it happen?",
    options: [
      { value: "hwy", label: "At highway speed", reason: "at highway speed" },
      { value: "brake", label: "When braking", reason: "when braking" },
      { value: "turn", label: "When turning", reason: "when turning" },
      { value: "always", label: "All the time", reason: "all the time" },
      { value: "low", label: "At low speed", reason: "at low speed" },
    ],
  },
  {
    id: "feel",
    legend: "Where do you feel it?",
    options: [
      { value: "wheel", label: "Steering wheel", reason: "felt in the steering wheel" },
      { value: "seat", label: "Seat or floor", reason: "felt in the seat or floor" },
      { value: "pedal", label: "Brake pedal", reason: "felt in the brake pedal" },
      { value: "none", label: "I don't feel it, I hear it" },
    ],
  },
  {
    id: "hear",
    legend: "What do you hear?",
    options: [
      { value: "none", label: "Nothing unusual" },
      {
        value: "hum",
        label: "Hum or roar that grows with speed",
        reason: "a hum or roar",
      },
      { value: "thump", label: "Rhythmic thump", reason: "a rhythmic thump" },
      { value: "grind", label: "Grinding or scraping", reason: "grinding or scraping" },
    ],
  },
];

export const NOISE_DEFAULTS = { when: "hwy", feel: "wheel", hear: "none" };

/**
 * The rules table. A rule applies when every answer in `if` matches, and
 * then adds `points` to each cause it names. Points only order the list;
 * they are not odds.
 */
export const NOISE_RULES = [
  { if: { when: "hwy" }, points: { balance: 3, round: 2, bent: 2 } },
  { if: { when: "brake" }, points: { rotor: 4 } },
  { if: { when: "turn" }, points: { joint: 3, bearing: 2 } },
  { if: { when: "always" }, points: { round: 2, bent: 2, tread: 1 } },
  { if: { when: "low" }, points: { round: 2, bent: 2 } },
  { if: { feel: "wheel" }, points: { balance: 2, align: 1 } },
  { if: { when: "brake", feel: "wheel" }, points: { rotor: 1 } },
  { if: { feel: "seat" }, points: { balance: 1, round: 1, tread: 1 } },
  { if: { feel: "pedal" }, points: { rotor: 3 } },
  { if: { hear: "hum" }, points: { bearing: 3, tread: 3 } },
  { if: { hear: "thump" }, points: { round: 3, tread: 1 } },
  { if: { hear: "grind" }, points: { rotor: 2, bearing: 1 } },
];

export const NOISE_MAX_CAUSES = 4;

export const NOISE_NOTE =
  "This ranking is a simple rules table, not a diagnosis. Have it inspected. A new vibration, or a tire you can see is damaged, needs a look soon.";

const NOISE_SOURCES = ["S45", "S38"];

/** Where an answer sits: question order, then option order. */
function answerKey(questionId, value) {
  const qi = NOISE_QUESTIONS.findIndex((q) => q.id === questionId);
  const oi = qi < 0 ? -1 : NOISE_QUESTIONS[qi].options.findIndex((o) => o.value === value);
  return { key: qi * 100 + oi, reason: NOISE_QUESTIONS[qi]?.options[oi]?.reason ?? value };
}

/** The label of each answer, in question order, for the "Your answers" line. */
export function answerLabels(answers) {
  return NOISE_QUESTIONS.map((q) => {
    const o = q.options.find((x) => x.value === answers?.[q.id]);
    return { question: q.legend, label: o ? o.label : null };
  });
}

/**
 * Scores every cause against the answers, then lists the causes with any
 * points, most points first, ties in NOISE_CAUSES order, at most
 * NOISE_MAX_CAUSES of them. `rules` is a parameter so the tests can show the
 * result doesn't depend on the order the table is written in.
 */
export function rankCauses(answers, rules = NOISE_RULES) {
  const a = answers ?? {};
  const scores = new Map(NOISE_CAUSES.map((c) => [c.id, { score: 0, matched: [] }]));

  for (const rule of rules) {
    const conds = Object.entries(rule.if);
    if (!conds.every(([q, v]) => a[q] === v)) continue;
    const parts = conds.map(([q, v]) => answerKey(q, v)).sort((x, y) => x.key - y.key);
    const match = {
      key: parts[0].key,
      text: parts.map((p) => p.reason).join(" and "),
    };
    for (const [cause, points] of Object.entries(rule.points)) {
      const s = scores.get(cause);
      if (!s) continue;
      s.score += points;
      s.matched.push({ ...match, points });
    }
  }

  const causes = NOISE_CAUSES.map((c, order) => ({ ...c, order, ...scores.get(c.id) }))
    .filter((c) => c.score > 0)
    .sort((x, y) => y.score - x.score || x.order - y.order)
    .slice(0, NOISE_MAX_CAUSES)
    .map((c, i) => {
      // The explanation reads in question order (when, feel, hear), however
      // the rules happen to be listed.
      const matched = [...c.matched]
        .sort((x, y) => x.key - y.key || x.text.localeCompare(y.text))
        .map(({ text, points }) => ({ text, points }));
      return {
        id: c.id,
        name: c.name,
        service: c.service,
        score: c.score,
        rank: i + 1,
        matched,
        matchedText: `Matched: ${matched
          .map((m) => `${m.text} (+${m.points})`)
          .join(", ")}.`,
      };
    });

  return {
    causes,
    status: STATUS.inspect,
    message: causes.length ? null : "Answer the questions above to see possible causes.",
    note: NOISE_NOTE,
    sources: NOISE_SOURCES,
  };
}
