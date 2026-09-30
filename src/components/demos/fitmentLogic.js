// Pure logic behind the two fitment demos: D5 Load & Speed check and D6
// Plus-Size & Speedometer (docs/content/learn-plan.md §4). No React, no DOM,
// so it runs in the node test runner and in a build-time prerender alike.
//
// Same pattern as demoLogic.js, kept in its own module so the fitment demos
// can ship without touching the other demos' logic. The arithmetic is reused:
// parseSize, sizeGeometry and compareSizes from src/data/tireMath.js, and the
// standard load-index and speed-symbol tables from src/data/loadSpeedTables.js.
//
// House rules apply to every string in this file: never "safe", "OK" or
// "fine" (BANNED_WORDS in demoLogic.js), and for D6 never "fits" or
// "approved" (FITMENT_BANNED below). A size change is never approved here;
// the reader is told to have fitment confirmed.

import { compareSizes, parseSize } from "../../data/tireMath.js";
import {
  LBS_PER_KG,
  LOAD_INDEX_MAX,
  LOAD_INDEX_MIN,
  loadKg,
  speedSymbol,
} from "../../data/loadSpeedTables.js";

/** Words the fitment demos may never show (learn-plan §4, D6 rules risk). */
export const FITMENT_BANNED = /\b(fits?|approved?)\b/i;

const MM_PER_INCH = 25.4;
const commas = (n) => Math.round(n).toLocaleString("en-US");
const one = (n) => n.toFixed(1);
/** Signed with a true minus sign, e.g. "+20 mm", "−12 mm". */
const signed = (text, n) => (n > 0 ? `+${text}` : n < 0 ? `−${text}` : text);

/* ------------------------------------------------------------------ *
 * D5 Load index & speed rating check
 * ------------------------------------------------------------------ */

/** The two results a comparison can give. Worded per the approved demo. */
export const LOAD_SPEED_VERDICT = {
  meets: { key: "meets", label: "Meets or exceeds your current tire" },
  below: {
    key: "below",
    label: "Below your current tire. Not recommended by tire makers",
  },
};

/** Shown under the result, always. */
export const SPEED_RATING_NOTE =
  "A speed rating is the speed a tire was tested to carry its load. It is not a recommended driving speed.";

export const LOAD_RANGE_NOTES = [
  "SL (standard load) is the default when a tire shows no load marking.",
  "XL (extra load) and LT tires carry more at higher pressures, per the tire maker's load and inflation tables. We confirm fitment on every order.",
  "LT tires often show two load indexes, such as 121/118. The second is for pairs on dual rear wheels; the first is the one compared here.",
  "Start from the load index and speed rating your vehicle maker specifies, on the door placard or in the owner's manual. The tires on the car now may not match it.",
];

export const LOAD_SPEED_DEFAULTS = {
  current: { load: 94, speed: "V" },
  candidate: { load: 91, speed: "H" },
};

// A size in front of the load and speed, as printed on the sidewall:
// 225/45R17, 225/45ZR17, LT265/70R17, 265/70R17LT, 33x12.50R20LT.
const LEADING_SIZE =
  /^(?:(?:P|LT|ST)?\d{3}\/\d{2,3}[A-Z]{0,2}(?:R|D|B|-)\d{2}(?:\.\d)?(?:LT)?|\d{2}(?:\.\d+)?X\d{1,2}(?:\.\d+)?(?:R|D|B|-)?\d{2}(?:\.\d)?(?:LT)?)\s*/;

/**
 * Reads what someone typed off the sidewall: "94V", "94 V", "121/118S",
 * "98Y XL" or a whole size such as "225/45R17 94W".
 *
 * Returns { state } where state is one of:
 *   empty | incomplete | error | decoded
 * and, when decoded, { load, dualLoad, speed, xl }.
 */
export function readServiceDescription(input) {
  let s = String(input ?? "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return { state: "empty" };

  const xl = /\b(XL|EXTRA LOAD)\b/.test(s);
  s = s.replace(/\b(XL|EXTRA LOAD|SL)\b/g, " ").trim();
  s = s.replace(LEADING_SIZE, "").replace(/\s+/g, "");

  const m = s.match(/^(\d{1,3})(?:\/(\d{0,3}))?([A-Z]?)$/);
  if (!m) {
    return {
      state: "error",
      message:
        "Type the load index and speed rating from the sidewall, such as 94V.",
    };
  }
  const [, loadText, dualText, letter] = m;

  if (loadText.length < 2 || (dualText !== undefined && dualText.length < 2)) {
    return {
      state: "incomplete",
      message: "Keep typing: a load index is 2 or 3 digits, such as 94V.",
    };
  }

  const load = Number(loadText);
  if (!loadKg(load)) {
    return {
      state: "error",
      message: `Load index ${load} is outside the ${LOAD_INDEX_MIN}–${LOAD_INDEX_MAX} table. Check the tire maker's load chart for it.`,
    };
  }

  if (!letter) {
    return {
      state: "incomplete",
      message: `Add the speed letter after ${load}, such as ${load}V.`,
    };
  }
  if (letter === "Z") {
    return {
      state: "error",
      message:
        "Z is an older open-ended marking for over 149 mph, with no single test speed. Use the letter printed after the load index, or the tire maker's spec.",
    };
  }
  if (!speedSymbol(letter)) {
    return {
      state: "error",
      message: `"${letter}" isn't in the L to Y speed-rating table. Check the letter after the load index.`,
    };
  }

  return {
    state: "decoded",
    load,
    dualLoad: dualText ? Number(dualText) : null,
    speed: letter,
    xl,
  };
}

/** Everything shown for one load index. */
export function loadFacts(index) {
  const kg = loadKg(index);
  if (!kg) return null;
  const lbs = Math.round(kg * LBS_PER_KG);
  const kg4 = kg * 4;
  const lbs4 = Math.round(kg4 * LBS_PER_KG);
  return {
    index: Number(index),
    kg,
    lbs,
    kg4,
    lbs4,
    perTireText: `${commas(lbs)} lb (${commas(kg)} kg) per tire`,
    setText: `${commas(lbs4)} lb (${commas(kg4)} kg) for four`,
  };
}

/** Everything shown for one speed symbol. */
export function speedFacts(symbol) {
  const s = speedSymbol(symbol);
  if (!s) return null;
  return { ...s, text: `${s.symbol}, tested to ${s.mph} mph (${s.kmh} km/h)` };
}

const verdictFor = (meets) =>
  meets ? LOAD_SPEED_VERDICT.meets : LOAD_SPEED_VERDICT.below;

/**
 * Compares the tire being considered with the current one. Each side is
 * { load, speed }. Returns null if either side isn't in the tables.
 */
export function compareLoadSpeed(current, candidate) {
  const curLoad = loadFacts(current?.load);
  const newLoad = loadFacts(candidate?.load);
  const curSpeed = speedFacts(current?.speed);
  const newSpeed = speedFacts(candidate?.speed);
  if (!curLoad || !newLoad || !curSpeed || !newSpeed) return null;

  const loadMeets = newLoad.index >= curLoad.index;
  const lbsDiff = Math.abs(newLoad.lbs - curLoad.lbs);
  const loadText =
    newLoad.index === curLoad.index
      ? `Same load index, ${curLoad.index}: up to ${curLoad.perTireText}.`
      : loadMeets
        ? `Load index ${newLoad.index} carries up to ${newLoad.perTireText}, ${commas(lbsDiff)} lb more per tire than ${curLoad.index}.`
        : `Load index ${newLoad.index} carries up to ${newLoad.perTireText}, ${commas(lbsDiff)} lb less per tire than your current ${curLoad.index}.`;

  const speedMeets = newSpeed.mph >= curSpeed.mph;
  const speedText =
    newSpeed.symbol === curSpeed.symbol
      ? `Same speed rating, ${curSpeed.symbol}: tested to ${curSpeed.mph} mph.`
      : speedMeets
        ? `${newSpeed.symbol} is tested to ${newSpeed.mph} mph, above ${curSpeed.symbol} (${curSpeed.mph} mph).`
        : `${newSpeed.symbol} is tested to ${newSpeed.mph} mph, below your current ${curSpeed.symbol} (${curSpeed.mph} mph).`;

  const allMeet = loadMeets && speedMeets;
  const belowOn = [!loadMeets && "load index", !speedMeets && "speed rating"]
    .filter(Boolean)
    .join(" and ");
  const headline = allMeet
    ? "Meets or exceeds your current tire on load index and speed rating."
    : `Below your current tire on ${belowOn}. Not recommended by tire makers.`;
  // Per Michelin (S35): replacements match or exceed the vehicle maker's
  // load index and speed rating. Said only when the candidate falls short.
  const advice = allMeet
    ? null
    : `Replacement tires should match or exceed the ${belowOn} your vehicle maker specifies.`;

  return {
    meets: allMeet,
    verdict: verdictFor(allMeet),
    headline,
    advice,
    load: {
      current: curLoad,
      candidate: newLoad,
      meets: loadMeets,
      verdict: verdictFor(loadMeets),
      text: loadText,
    },
    speed: {
      current: curSpeed,
      candidate: newSpeed,
      meets: speedMeets,
      verdict: verdictFor(speedMeets),
      text: speedText,
    },
    live: [headline, loadText, speedText, advice].filter(Boolean).join(" "),
    note: SPEED_RATING_NOTE,
    sources: ["S35", "S54"],
  };
}

/* ------------------------------------------------------------------ *
 * D6 Plus-size & speedometer
 * ------------------------------------------------------------------ */

export const PLUS_SIZE_DEFAULTS = { from: "215/55R17", to: "235/45R18" };

export const PLUS_SIZE_EXAMPLES = [
  { from: "205/55R16", to: "225/40R18", label: "Plus two" },
  { from: "LT265/70R17 121/118S", to: "LT285/70R17 121/118S", label: "LT, wider" },
  { from: "265/70R16", to: "31x10.50R15", label: "Flotation" },
];

export const SPEEDO_SPEEDS = [30, 45, 60, 70];

export const GUIDELINE = 3;

export const GUIDELINE_NOTE =
  "3% is a guideline, not a fitment approval. Load index, clearance and wheel width all matter. Have fitment confirmed before you order.";

const SERVICE_NAME = { P: "P-metric", LT: "LT (light truck)", ST: "ST (trailer)" };

// What a size looks like part-way through typing it, including a full size
// with a load index but no speed letter yet (225/45R17 94).
const INCOMPLETE_SIZE = new RegExp(
  [
    /^(P|L|LT|S|ST)?\d{0,3}(\/\d{0,3}([A-Z]{0,2}\d?)?)?$/.source,
    /^\d{2}(\.\d*)?(X(\d{1,2}(\.\d*)?)?(R\d?)?)?$/.source,
    /^(P|LT|ST)?\d{3}\/\d{2,3}[A-Z]{0,2}R\d{2}(LT)?\d{1,3}(\/\d{0,3})?$/.source,
    /^\d{2}(\.\d+)?X\d{1,2}(\.\d+)?R\d{2}(LT)?\d{1,3}(\/\d{0,3})?$/.source,
  ].join("|"),
);

/**
 * Splits off what parseSize() doesn't take: an XL marking, a trailing LT,
 * and a load index (single or dual) and speed rating after the size.
 */
function splitSize(compact) {
  let s = compact;
  const xl = /XL$/.test(s);
  if (xl) s = s.slice(0, -2);

  const flot = s.match(
    /^(\d{2}(?:\.\d+)?X\d{1,2}(?:\.\d+)?(?:R|D|B|-)?\d{2}(?:\.\d)?)(LT)?(?:(\d{2,3})(?:\/(\d{2,3}))?([A-Z]{1,2}))?$/,
  );
  if (flot) {
    const [, core, lt, load, dual, speed] = flot;
    return { core: core + (lt ?? ""), lt: Boolean(lt), load, dual, speed, xl };
  }

  const metric = s.match(
    /^((?:P|LT|ST)?\d{3}\/\d{2,3}[A-Z]{0,2}(?:R|D|B|-)\d{2}(?:\.\d)?)(LT)?(?:(\d{2,3})(?:\/(\d{2,3}))?([A-Z]{1,2}))?(LT)?$/,
  );
  if (metric) {
    const [, core, lt1, load, dual, speed, lt2] = metric;
    return { core, lt: Boolean(lt1 || lt2), load, dual, speed, xl };
  }
  return null;
}

/**
 * Reads one typed size for the plus-size demo: P-metric, LT (prefix or
 * suffix, with a dual load index) and flotation sizes all work, with or
 * without a load index and speed rating.
 *
 * Returns { state: "empty" | "incomplete" | "error" | "decoded", ... }.
 * When decoded: { size, label, loadIndex, speedRating }, where `size` is
 * parseSize()'s object and `label` is the size as it will be shown.
 */
export function readSize(input) {
  const raw = String(input ?? "").toUpperCase().trim();
  if (!raw) return { state: "empty" };
  const compact = raw.replace(/\s+/g, "");

  const split = splitSize(compact);
  const parsed = split ? parseSize(split.core) : null;
  if (!parsed) {
    if (INCOMPLETE_SIZE.test(compact)) {
      return {
        state: "incomplete",
        message: "Keep typing: a full size looks like 225/45R17.",
      };
    }
    return {
      state: "error",
      message:
        "That doesn't read as a tire size. Try one like 225/45R17, LT265/70R17 or 31x10.50R15.",
    };
  }

  const size = { ...parsed };
  if (split.lt) size.service = "LT";
  if (split.load) size.loadIndex = split.load;
  if (split.speed) size.speedRating = split.speed;

  const marked = split.lt || /^(P|LT|ST)\d/.test(compact);
  const label =
    size.format === "flotation"
      ? `${size.normalized}${size.service === "LT" ? "LT" : ""}`
      : `${marked ? size.service : ""}${size.normalized}`;

  return {
    state: "decoded",
    size,
    label,
    loadIndex: size.loadIndex ? Number(size.loadIndex) : null,
    dualLoad: split.dual ? Number(split.dual) : null,
    speedRating: size.speedRating ?? null,
    xl: split.xl,
  };
}

/**
 * "+0.1%", "−3.5%", "0%". One decimal, but never so rounded that a change
 * outside the 3% guideline reads as exactly 3.0%, or a real change as 0.0%.
 */
export function pctText(pct) {
  const a = Math.abs(pct);
  if (a < 1e-9) return "0%";
  let d = 1;
  if (a < 0.05 || (a > GUIDELINE && a < GUIDELINE + 0.05)) d = 2;
  let text = a.toFixed(d);
  if (Number(text) === 0) return pct > 0 ? "+<0.01%" : "−<0.01%";
  return signed(`${text}%`, pct);
}

/** "a 17-inch", "an 18-inch". */
const aInch = (n) => `${/^(8|11|18)(\.|$)/.test(String(n)) ? "an" : "a"} ${n}-inch`;

/** "+20 mm", "−12 mm" or "Same", from the rounded figures shown beside it. */
const mmChange = (fromMm, toMm) => {
  const d = Math.round(toMm) - Math.round(fromMm);
  return d === 0 ? "Same" : signed(`${commas(Math.abs(d))} mm`, d);
};

const inchMm = (inches) =>
  `${one(inches)} in (${commas(inches * MM_PER_INCH)} mm)`;
const mmIn = (mm) => `${commas(mm)} mm (${one(mm / MM_PER_INCH)} in)`;

/** The load-index line for D6, when both sizes carry one. */
function plusSizeLoad(a, b) {
  if (!a.loadIndex || !b.loadIndex) {
    return {
      state: "missing",
      text: "Add the load index to both sizes, such as 225/40R18 92W, to compare it. The new tire's load index should match or exceed your vehicle maker's.",
    };
  }
  const cur = loadFacts(a.loadIndex);
  const next = loadFacts(b.loadIndex);
  if (!cur || !next) {
    return {
      state: "outside",
      text: `A load index outside the ${LOAD_INDEX_MIN}–${LOAD_INDEX_MAX} table can't be compared here. Check the tire maker's load chart.`,
    };
  }
  const meets = next.index >= cur.index;
  return {
    state: "compared",
    meets,
    verdict: verdictFor(meets),
    text:
      next.index === cur.index
        ? `Load index: both ${cur.index}, up to ${cur.perTireText}.`
        : meets
          ? `Load index: ${cur.index} → ${next.index}, up to ${next.perTireText}.`
          : `Load index: ${cur.index} → ${next.index}, up to ${next.perTireText}, ${commas(cur.lbs - next.lbs)} lb less per tire. Replacement tires should match or exceed the load index your vehicle maker specifies.`,
  };
}

/**
 * Compares a current and a new size. Returns { state: "waiting", from, to }
 * until both read as sizes, then everything the demo shows.
 */
export function comparePlusSize(fromInput, toInput) {
  const a = readSize(fromInput);
  const b = readSize(toInput);
  if (a.state !== "decoded" || b.state !== "decoded") {
    return { state: "waiting", from: a, to: b };
  }

  const c = compareSizes(a.size, b.size);
  const pct = c.diameterChange;
  const same = Math.abs(pct) < 1e-9;
  const dir = same ? "same" : pct > 0 ? "taller" : "shorter";
  const ratio = c.to.overallDiameter / c.from.overallDiameter;

  const diameterSentence = same
    ? `Both sizes have the same overall diameter, ${inchMm(c.from.overallDiameter)}.`
    : `The new size is ${pctText(pct).replace(/^[+−]/, "")} ${dir} overall: ${one(c.from.overallDiameter)} in → ${one(c.to.overallDiameter)} in (${commas(c.from.overallDiameter * MM_PER_INCH)} → ${commas(c.to.overallDiameter * MM_PER_INCH)} mm).`;

  const guideline = c.withinTolerance
    ? {
        within: true,
        label: `Within the common ${GUIDELINE}% guideline`,
        text: `The overall diameter changes by ${GUIDELINE}% or less, the range fitment guides commonly work to.`,
      }
    : {
        within: false,
        label: `Outside the common ${GUIDELINE}% guideline`,
        text: `The overall diameter changes by more than ${GUIDELINE}%. Your speedometer, odometer and other systems that read wheel speed are set up for the original size.`,
      };

  const rimChange = c.to.rimDiameter - c.from.rimDiameter;
  const rows = [
    {
      key: "diameter",
      label: "Overall diameter",
      from: `${one(c.from.overallDiameter)} in`,
      to: `${one(c.to.overallDiameter)} in`,
      change: pctText(pct),
    },
    {
      key: "sidewall",
      label: "Sidewall height",
      from: mmIn(c.from.sidewallMm),
      to: mmIn(c.to.sidewallMm),
      change: mmChange(c.from.sidewallMm, c.to.sidewallMm),
    },
    {
      key: "revs",
      label: "Revs per mile",
      sub: "unloaded",
      from: commas(c.from.revsPerMile),
      to: commas(c.to.revsPerMile),
      change: pctText(c.revsChange),
    },
    {
      key: "width",
      label: "Section width",
      from: `${commas(c.from.sectionWidthMm)} mm`,
      to: `${commas(c.to.sectionWidthMm)} mm`,
      change: mmChange(c.from.sectionWidthMm, c.to.sectionWidthMm),
    },
    {
      key: "rim",
      label: "Wheel diameter",
      from: `${c.from.rimDiameter} in`,
      to: `${c.to.rimDiameter} in`,
      change: rimChange === 0 ? "Same" : signed(`${Math.abs(rimChange)} in`, rimChange),
    },
  ];

  const speedo = SPEEDO_SPEEDS.map((indicated) => {
    const actual = c.actualAt(indicated);
    return { indicated, actual, actualText: `${one(actual)} mph` };
  });
  const at60 = one(c.actualAt(60));
  const speedoSentence = same
    ? "Your speedometer would read the same as it does now."
    : `At an indicated 60 mph you'd actually be going about ${at60} mph. A ${dir} tire makes the speedometer read ${dir === "taller" ? "low" : "high"}.`;

  const notes = [];
  if (!c.sameRim) {
    notes.push(
      `The new size mounts on ${aInch(c.to.rimDiameter)} wheel instead of ${aInch(c.from.rimDiameter)} one, so it needs different wheels.`,
    );
  }
  if (c.from.service !== c.to.service) {
    notes.push(
      `The current size is ${SERVICE_NAME[c.from.service] ?? c.from.service} and the new one is ${SERVICE_NAME[c.to.service] ?? c.to.service}. They use different load and inflation tables, so compare them with the tire maker's tables.`,
    );
  }

  const load = plusSizeLoad(a, b);
  const toolHref = `/tire-size?size=${encodeURIComponent(a.label)}&vs=${encodeURIComponent(b.label)}`;

  return {
    state: "compared",
    from: a,
    to: b,
    pct,
    pctText: pctText(pct),
    direction: dir,
    ratio,
    diameterSentence,
    diameters: { from: c.from.overallDiameter, to: c.to.overallDiameter },
    rims: { from: c.from.rimDiameter, to: c.to.rimDiameter },
    guideline,
    rows,
    speedo,
    speedoSentence,
    notes,
    load,
    note: GUIDELINE_NOTE,
    toolHref,
    live: `${diameterSentence} ${guideline.label}. ${speedoSentence}`,
    sources: ["S42", "C14", "S35"],
  };
}
