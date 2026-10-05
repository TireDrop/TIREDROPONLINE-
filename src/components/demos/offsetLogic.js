// Pure logic behind the wheel offset and clearance tool (/wheel-offset-calculator).
// No React, no DOM, so it runs in the node test runner and in a build-time
// prerender alike.
//
// Pure geometry, no outside facts. A wheel's offset (ET, in mm) is the
// distance from its centerline to its mounting surface, and its width is
// the figure in the size (the 9 in 18x9). From those two numbers:
//
//   backspacing  = width / 2 + offset         (width in mm: 12.7 mm per inch)
//   outer face   = what is left of the width past the mounting surface
//
// so going from one wheel to another moves the outer face by
//   (old offset - new offset) + (new width - old width) / 2,
// and the inner edge (toward the suspension) by
//   (new offset - old offset) + (new width - old width) / 2.
// Tires are treated the same way, centered on the wheel, using the nominal
// section width in the size marking (tireMath.js; readSize() in fitmentLogic.js).
//
// House rule: nothing here ever promises that a combination works. The three
// bands are generic geometry guides, not a fitment promise: they only say how
// far the numbers moved, and when to ask us. offsetLogic.test.mjs sweeps every
// string for the words the house rules rule out.

import { compareSizes } from "../../data/tireMath.js";
import { readSize } from "./fitmentLogic.js";

export const MM_PER_INCH = 25.4;

/* ------------------------------ ranges ------------------------------ */

/** What a shopper could really type for each wheel number. */
export const RANGES = {
  width: { min: 4, max: 16, unit: "inches" },
  offset: { min: -150, max: 150, unit: "mm" },
  diameter: { min: 10, max: 30, unit: "inches" },
};

/* ------------------------------ bands ------------------------------ *
 * Generic geometry guides, in the units each result is shown in. A result is
 * "close" up to the first limit, "different" up to the second and "large"
 * beyond it, judged on the figure as shown (one decimal).
 *
 *   wheel and tire edges   6 mm (about 1/4 in) and 19 mm (about 3/4 in)
 *   tire section width     10 mm (one common size step) and 25 mm (about 1 in)
 *   tire overall diameter  1.5% and 3% (3% is the figure fitment guides use,
 *                          and the one the plus size calculator shows)
 */
export const LIMITS = {
  edge: { close: 6, different: 19 },
  tireWidth: { close: 10, different: 25 },
  diameter: { close: 1.5, different: 3 },
};

export const BANDS = {
  close: {
    key: "close",
    rank: 0,
    label: "Close to your current setup",
    short: "Close to your current setup",
  },
  different: {
    key: "different",
    rank: 1,
    label: "Noticeably different: have the fit checked",
    short: "Noticeably different: have the fit checked",
  },
  large: {
    key: "large",
    rank: 2,
    label: "Large change: call us before you order",
    short: "Large change: call us before you order",
  },
};

/** The band for a size of change, on the figure as shown (one decimal). */
export function bandFor(change, limits) {
  const shown = Math.abs(Number(Math.abs(change).toFixed(1)));
  if (shown <= limits.close) return BANDS.close;
  if (shown <= limits.different) return BANDS.different;
  return BANDS.large;
}

/** The worst of several bands (the biggest change decides the headline). */
export function worstBand(bands) {
  return bands.reduce((w, b) => (b.rank > w.rank ? b : w), BANDS.close);
}

/* --------------------------- number formats --------------------------- */

/** "18", "22.7", "6.4": one decimal at most, no trailing ".0", never "-0". */
export const fmtMm = (mm) => {
  const n = Number(Math.abs(mm).toFixed(1));
  return `${n} mm`;
};
/** "0.71 in": two decimals, always. */
export const fmtIn = (mm) => `${Math.abs(mm / MM_PER_INCH).toFixed(2)} in`;
/** "22.7 mm (0.89 in)". */
export const fmtBoth = (mm) => `${fmtMm(mm)} (${fmtIn(mm)})`;
/** Inches to mm, for the width: 9 in is 228.6 mm. */
export const inchesToMm = (inches) => inches * MM_PER_INCH;
export const mmToInches = (mm) => mm / MM_PER_INCH;

/** A figure typed into a box, as a number, or null when it is not one. */
export function readNumber(input) {
  const s = String(input ?? "")
    .replace(/[−–]/g, "-")
    .replace(/\s+/g, "");
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/* ------------------------------ one wheel ------------------------------ */

/** Backspacing in mm: half the width plus the offset. */
export const backspacingMm = (widthIn, offsetMm) =>
  (inchesToMm(widthIn) / 2) + offsetMm;

/**
 * Reads one wheel's boxes. Width and offset are required; diameter is
 * optional (it may be left blank, but anything typed must be a real figure).
 *
 * Returns { state: "empty" | "incomplete" | "error" | "ok", errors, ... }.
 * When "ok": { widthIn, offsetMm, diameterIn (or null), backspacingMm }.
 */
export function readWheel(input) {
  const { width, offset, diameter } = input ?? {};
  const raw = {
    width: String(width ?? "").trim(),
    offset: String(offset ?? "").trim(),
    diameter: String(diameter ?? "").trim(),
  };
  const errors = {};
  const missing = [];

  const w = readNumber(raw.width);
  if (!raw.width) missing.push("width");
  else if (w === null) errors.width = "Enter the width as a number, like 9 for an 18x9 wheel.";
  else if (w <= 0) errors.width = "The width has to be more than zero. Enter it in inches, like 9.";
  else if (w < RANGES.width.min || w > RANGES.width.max)
    errors.width = `Wheel width is usually between ${RANGES.width.min} and ${RANGES.width.max} inches. Check the figure after the x in the size.`;

  const o = readNumber(raw.offset);
  if (!raw.offset) missing.push("offset");
  else if (o === null) errors.offset = "Enter the offset in mm as a number, like 18 or -12.";
  else if (o < RANGES.offset.min || o > RANGES.offset.max)
    errors.offset = `Offset is usually between ${RANGES.offset.min} and ${RANGES.offset.max} mm. It is stamped on the back of the wheel after ET.`;

  let d = null;
  if (raw.diameter) {
    d = readNumber(raw.diameter);
    if (d === null) errors.diameter = "Enter the diameter in inches as a number, like 20.";
    else if (d < RANGES.diameter.min || d > RANGES.diameter.max)
      errors.diameter = `Wheel diameter is usually between ${RANGES.diameter.min} and ${RANGES.diameter.max} inches.`;
  }

  if (Object.keys(errors).length) return { state: "error", errors, missing };
  if (missing.length === 2 && !raw.diameter) return { state: "empty", errors, missing };
  if (missing.length) return { state: "incomplete", errors, missing };
  return {
    state: "ok",
    errors,
    missing,
    widthIn: w,
    offsetMm: o,
    diameterIn: d,
    backspacingMm: backspacingMm(w, o),
  };
}

/**
 * Where a wheel's lips (and its tire's sidewalls) sit, in mm either side of
 * the mounting surface: negative toward the suspension, positive toward the
 * fender. The wheel's inner lip is its backspacing inboard; the tire is
 * centered on the wheel's centerline, which sits `offset` inboard of the
 * mounting surface. This is what the drawing is made from.
 */
export function wheelPosition(widthIn, offsetMm, tireWidthMm = null) {
  const widthMm = inchesToMm(widthIn);
  const bs = backspacingMm(widthIn, offsetMm);
  const centerMm = -offsetMm;
  return {
    wheel: { inner: -bs, outer: widthMm - bs },
    tire:
      tireWidthMm === null
        ? null
        : { inner: centerMm - tireWidthMm / 2, outer: centerMm + tireWidthMm / 2 },
  };
}

/* ------------------------------ reading text ------------------------------ */

/** "out", "in" or null (no move), from the figure as shown. */
const way = (mm, pos, neg) =>
  Number(Math.abs(mm).toFixed(1)) === 0 ? null : mm > 0 ? pos : neg;

/** "18 mm out", "6 mm in", or "No change". */
const changeText = (mm, pos, neg) => {
  const w = way(mm, pos, neg);
  return w ? `${fmtMm(mm)} ${w}` : "No change";
};

/** The inches beside a mm change, or "" when nothing moved. */
const inchText = (mm) => (way(mm, true, false) ? `(${fmtIn(mm)})` : "");

/** "moves 18 mm (0.71 in) out toward the fender", or "does not move". */
const moveText = (mm, pos, neg) => {
  const w = way(mm, pos, neg);
  return w ? `moves ${fmtBoth(mm)} ${w}` : "does not move";
};

const bandSentence = (band) => `${band.label}.`;

/* --------------------------- the comparison --------------------------- */

/**
 * Compares a current wheel with a new one, and the tires on them when both
 * tire sizes are given.
 *
 *   compareWheels({ current: {width, offset, diameter},
 *                   next:    {width, offset, diameter},
 *                   tires:   { current: "275/55R20", next: "285/55R20" } })
 *
 * Returns { state: "waiting", ... } until both wheels read, then everything
 * the tool shows.
 */
export function compareWheels(input) {
  const { current, next, tires } = input ?? {};
  const a = readWheel(current);
  const b = readWheel(next);
  const tireBoxes = tires ?? {};
  if (a.state !== "ok" || b.state !== "ok") {
    return { state: "waiting", current: a, next: b };
  }

  const widthChangeMm = inchesToMm(b.widthIn - a.widthIn);
  // Positive = further out, toward the fender.
  const outerMm = a.offsetMm - b.offsetMm + widthChangeMm / 2;
  // Positive = closer to the suspension.
  const innerMm = b.offsetMm - a.offsetMm + widthChangeMm / 2;

  const rows = [];
  const add = (row) => rows.push(row);

  const outerBand = bandFor(outerMm, LIMITS.edge);
  const innerBand = bandFor(innerMm, LIMITS.edge);
  add({
    key: "outer",
    label: "Wheel face (outer edge)",
    change: changeText(outerMm, "out", "in"),
    mm: outerMm,
    detail: inchText(outerMm),
    band: outerBand,
    read: `The outer edge of the wheel ${moveText(outerMm, "out, toward the fender", "in, away from the fender")}. ${bandSentence(outerBand)}`,
  });
  add({
    key: "inner",
    label: "Inner edge (toward the suspension)",
    change: changeText(innerMm, "toward the suspension", "away from the suspension"),
    mm: innerMm,
    detail: inchText(innerMm),
    band: innerBand,
    read: `The inner edge of the wheel ${moveText(innerMm, "toward the suspension", "away from the suspension")}. ${bandSentence(innerBand)}`,
  });

  const backspace = {
    current: { mm: a.backspacingMm, text: `${mmToInches(a.backspacingMm).toFixed(2)} in (${fmtMm(a.backspacingMm)})` },
    next: { mm: b.backspacingMm, text: `${mmToInches(b.backspacingMm).toFixed(2)} in (${fmtMm(b.backspacingMm)})` },
    changeMm: b.backspacingMm - a.backspacingMm,
  };

  const notes = [];

  // Wheel diameter: optional, but if it changes the brakes and tire need a look.
  if (a.diameterIn !== null && b.diameterIn !== null && a.diameterIn !== b.diameterIn) {
    notes.push(
      `The wheel diameter changes from ${a.diameterIn} to ${b.diameterIn} inches, so the tire size and the room around the brakes change too.`,
    );
  }

  // Tires: only when both sizes are typed and read as sizes.
  const tireCur = readSize(tireBoxes.current);
  const tireNew = readSize(tireBoxes.next);
  const tireProblems = {};
  for (const [key, t] of [["current", tireCur], ["next", tireNew]]) {
    if (t.state === "error") tireProblems[key] = t.message;
    if (t.state === "incomplete") tireProblems[key] = t.message;
  }
  const oneTire =
    (tireCur.state === "decoded") !== (tireNew.state === "decoded") &&
    tireCur.state !== "incomplete" &&
    tireNew.state !== "incomplete" &&
    tireCur.state !== "error" &&
    tireNew.state !== "error";

  let tire = null;
  let positions = {
    current: wheelPosition(a.widthIn, a.offsetMm),
    next: wheelPosition(b.widthIn, b.offsetMm),
  };
  if (tireCur.state === "decoded" && tireNew.state === "decoded") {
    const c = compareSizes(tireCur.size, tireNew.size);
    const tw = c.widthChangeMm;
    // Tires sit centered on the wheel, so the tire edges move with the
    // wheel plus half of the change in the tire's own width.
    const tireOuterMm = a.offsetMm - b.offsetMm + tw / 2;
    const tireInnerMm = b.offsetMm - a.offsetMm + tw / 2;
    const widthBand = bandFor(tw, LIMITS.tireWidth);
    const diaBand = bandFor(c.diameterChange, LIMITS.diameter);
    const tOuterBand = bandFor(tireOuterMm, LIMITS.edge);
    const tInnerBand = bandFor(tireInnerMm, LIMITS.edge);
    const pct = Number(Math.abs(c.diameterChange).toFixed(1));
    const diaText =
      pct === 0
        ? "does not change"
        : `${c.diameterChange > 0 ? "grows" : "shrinks"} ${pct}% (${Math.abs(c.diameterChangeIn).toFixed(1)} in)`;
    const widthText =
      Number(Math.abs(tw).toFixed(1)) === 0
        ? "does not change"
        : `${tw > 0 ? "grows" : "shrinks"} ${fmtBoth(tw)}`;

    add({
      key: "tireOuter",
      label: "Tire sidewall (outer edge)",
      change: changeText(tireOuterMm, "out", "in"),
      mm: tireOuterMm,
      detail: inchText(tireOuterMm),
      band: tOuterBand,
      read: `The tire's outer sidewall ${moveText(tireOuterMm, "out, toward the fender", "in, away from the fender")}. ${bandSentence(tOuterBand)}`,
    });
    add({
      key: "tireInner",
      label: "Tire sidewall (inner edge)",
      change: changeText(tireInnerMm, "toward the suspension", "away from the suspension"),
      mm: tireInnerMm,
      detail: inchText(tireInnerMm),
      band: tInnerBand,
      read: `The tire's inner sidewall ${moveText(tireInnerMm, "toward the suspension", "away from the suspension")}. ${bandSentence(tInnerBand)}`,
    });
    add({
      key: "tireWidth",
      label: "Tire section width",
      change: widthText === "does not change" ? "Same" : `${tw > 0 ? "+" : "−"}${fmtMm(tw)}`,
      mm: tw,
      detail: inchText(tw),
      band: widthBand,
      read: `The tire ${widthText}: ${Math.round(c.from.sectionWidthMm)} to ${Math.round(c.to.sectionWidthMm)} mm. ${bandSentence(widthBand)}`,
    });
    add({
      key: "tireDiameter",
      label: "Tire overall diameter",
      change: pct === 0 ? "Same" : `${c.diameterChange > 0 ? "+" : "−"}${pct}%`,
      mm: null,
      detail: pct === 0 ? "" : `(${Math.abs(c.diameterChangeIn).toFixed(1)} in)`,
      band: diaBand,
      read: `The tire's overall diameter ${diaText}: ${c.from.overallDiameter.toFixed(1)} to ${c.to.overallDiameter.toFixed(1)} in. ${bandSentence(diaBand)}`,
    });

    positions = {
      current: wheelPosition(a.widthIn, a.offsetMm, c.from.sectionWidthMm),
      next: wheelPosition(b.widthIn, b.offsetMm, c.to.sectionWidthMm),
    };
    tire = {
      from: tireCur.label,
      to: tireNew.label,
      widthChangeMm: tw,
      diameterChangePct: c.diameterChange,
      diameterChangeIn: c.diameterChangeIn,
      diameters: { from: c.from.overallDiameter, to: c.to.overallDiameter },
      sectionWidths: { from: c.from.sectionWidthMm, to: c.to.sectionWidthMm },
      outerMm: tireOuterMm,
      innerMm: tireInnerMm,
    };

    // The size marking names the wheel diameter it mounts on.
    for (const [which, t, w] of [["current", tireCur, a], ["new", tireNew, b]]) {
      if (w.diameterIn !== null && t.size.rimDiameter !== w.diameterIn) {
        notes.push(
          `The ${which} tire size is made for a ${t.size.rimDiameter}-inch wheel, but the ${which} wheel diameter says ${w.diameterIn}. Check both figures.`,
        );
      }
    }
  }

  const overall = worstBand(rows.map((r) => r.band));
  const headline = {
    close: "These two setups sit in nearly the same place.",
    different: "The wheel or tire sits in a noticeably different place.",
    large: "The wheel or tire moves a long way from where it sits now.",
  }[overall.key];

  const live = `${rows[0].read} ${rows[1].read} Overall: ${overall.label}.`;

  return {
    state: "compared",
    current: a,
    next: b,
    outerMm,
    innerMm,
    widthChangeMm,
    backspace,
    rows,
    tire,
    positions,
    tireProblems,
    oneTire,
    notes,
    overall,
    headline,
    live,
    // The same wheel in both boxes: the numbers all read zero, so say so.
    same:
      Number(Math.abs(outerMm).toFixed(1)) === 0 &&
      Number(Math.abs(innerMm).toFixed(1)) === 0 &&
      (!tire || (Number(Math.abs(tire.widthChangeMm).toFixed(1)) === 0 && tire.diameterChangePct === 0)),
  };
}

/* ------------------------------ sample presets ------------------------------ */

/**
 * Worked examples a shopper can load. Numbers are illustrative, not
 * a recommendation for any vehicle: they exist to show how the bands read.
 */
export const OFFSET_EXAMPLES = [
  {
    label: "Truck, lower offset",
    current: { width: "9", offset: "18", diameter: "20" },
    next: { width: "9", offset: "8", diameter: "20" },
    tires: { current: "275/55R20", next: "285/55R20" },
  },
  {
    label: "SUV, small change",
    current: { width: "8", offset: "35", diameter: "18" },
    next: { width: "8", offset: "30", diameter: "18" },
    tires: { current: "235/60R18", next: "235/60R18" },
  },
  {
    label: "SUV, wider wheel",
    current: { width: "8", offset: "35", diameter: "18" },
    next: { width: "9", offset: "35", diameter: "18" },
    tires: { current: "235/60R18", next: "255/55R18" },
  },
  {
    label: "Truck, big swing",
    current: { width: "9", offset: "18", diameter: "18" },
    next: { width: "10", offset: "-25", diameter: "20" },
    tires: { current: "285/70R18", next: "33x12.50R20" },
  },
];

/** The loaded example: the first one, so the prerendered page shows a result. */
export const OFFSET_DEFAULTS = OFFSET_EXAMPLES[0];

/** The page's one-line disclaimer, shown beside the result. */
export const OFFSET_NOTE =
  "These bands are generic geometry guides, not a fitment promise. Clearance also depends on your vehicle: the brakes, struts, fender lip, suspension and steering lock. TireDrop confirms fitment by phone before any wheel ships.";
