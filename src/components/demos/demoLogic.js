// Pure logic behind the Learn demos: no React, no DOM, so it runs in the
// node test runner and in a build-time prerender alike.
//
// The arithmetic is reused from src/data/tireMath.js (parseSize,
// sizeGeometry, decodeDot, treadStatus). What lives here is the layer on top:
// the plain-English readings, the shared status vocabulary and the source IDs
// each statement rests on (docs/content/learn-plan.md §4 and §6).
//
// House rules apply to every string in this file. A tire is never called
// "safe", "OK" or "fine". tireMath's statuses ("replace" | "soon" |
// "inspect" | "monitor") and their labels (STATUS_LABELS) are the one
// vocabulary; the demos reuse those labels rather than restating them.

import {
  STATUS_LABELS,
  TREAD,
  decodeDot,
  parseSize,
  sizeGeometry,
  treadStatus,
} from "../../data/tireMath.js";
import { LOAD_INDEX_KG, SPEED_MPH, loadPounds } from "./ratingTables.js";

/* ------------------------------------------------------------------ *
 * Shared status vocabulary (learn-plan §4)
 * ------------------------------------------------------------------ */

export const STATUS = {
  replace: { key: "replace", label: STATUS_LABELS.replace },
  mfrReplace: { key: "mfrReplace", label: "Manufacturers recommend replacing" },
  consider: { key: "consider", label: STATUS_LABELS.soon },
  inspect: { key: "inspect", label: STATUS_LABELS.inspect },
  monitor: { key: "monitor", label: STATUS_LABELS.monitor },
};

/** Words no demo may ever show (house rules, learn-plan §0.3 and §4). */
export const BANNED_WORDS = /\b(safe|safer|safely|fine|guaranteed?|OK)\b/i;

const MM_PER_INCH = 25.4;
const commas = (n) => Math.round(n).toLocaleString("en-US");
const trimNum = (n, d = 1) => String(Number(n.toFixed(d)));

/* ------------------------------------------------------------------ *
 * Tread depth (D1)
 * ------------------------------------------------------------------ */

export const TREAD_MAX = 10;

/** 32nds of an inch → millimetres. */
export const toMm = (n32) => (n32 * MM_PER_INCH) / 32;

/** "4" or "4.5" — how a depth in 32nds is printed. */
export const fmt32 = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

const TREAD_BANDS = {
  replace: {
    status: STATUS.replace,
    summary:
      "At or below 2/32 in. NHTSA and USTMA use 2/32 in as the point to replace a tire; it is where the tread-wear bars sit flush with the tread.",
    detail:
      "Replace the tire, and have the other tires on the car checked too.",
    sources: ["S1", "S13"],
  },
  consider: {
    status: STATUS.consider,
    summary:
      "Between 2/32 and 4/32 in. Per Consumer Reports' worn-tire testing, consider replacing at 4/32 in, because wet-road braking gets worse as tread wears.",
    detail:
      "Measure three grooves on every tire; the shallowest reading is the one that counts.",
    sources: ["S31", "C3"],
  },
  monitor: {
    status: STATUS.monitor,
    summary:
      "Deeper than 4/32 in. Keep checking monthly, in three grooves across the tire, because tread rarely wears evenly.",
    detail:
      "Have it inspected if one tire, or one edge of a tire, is wearing faster than the rest.",
    sources: ["S1", "S13"],
  },
};

export const COIN_TESTS = {
  penny: { key: "penny", coin: "Penny", person: "Lincoln", headAt: TREAD.legal },
  quarter: {
    key: "quarter",
    coin: "Quarter",
    person: "Washington",
    headAt: TREAD.wetRisk,
  },
};

/**
 * A coin pushed head-first into a groove: the top of the head sits `headAt`
 * 32nds above the coin's edge, so the whole head shows once the groove is no
 * deeper than that. Same rule as treadStatus().pennyTest / quarterTest.
 */
export function coinReading(depth, coinKey) {
  const c = COIN_TESTS[coinKey];
  const visible = depth <= c.headAt;
  return {
    ...c,
    visible,
    text: visible
      ? `All of ${c.person}'s head is visible, so the tread is at or below ${c.headAt}/32 in.`
      : `The top of ${c.person}'s head is hidden, so the tread is deeper than ${c.headAt}/32 in.`,
  };
}

/** Everything the gauge shows for one depth, or null for a bad value. */
export function treadReading(input) {
  if (input === null || input === undefined || input === "") return null;
  const depth = Number(input);
  if (!Number.isFinite(depth) || depth < 0 || depth > 32) return null;

  // tireMath returns "replace" | "soon" | "monitor"; its "soon" is this
  // gauge's "consider" band (same label, "Consider replacing").
  const t = treadStatus(depth);
  const key =
    t.status === "replace"
      ? "replace"
      : t.status === "soon"
        ? "consider"
        : "monitor";
  const band = TREAD_BANDS[key];
  const mm = toMm(depth);

  return {
    depth,
    mm,
    mmText: mm.toFixed(1),
    band: key,
    status: band.status,
    summary: band.summary,
    detail: band.detail,
    sources: band.sources,
    wearBars: {
      flush: depth <= TREAD.legal,
      gap32: Math.max(0, depth - TREAD.legal),
    },
    penny: coinReading(depth, "penny"),
    quarter: coinReading(depth, "quarter"),
    valueText: `${fmt32(depth)}/32 inch, ${mm.toFixed(1)} millimeters. ${band.status.label}.`,
  };
}

/* ------------------------------------------------------------------ *
 * DOT date code (D2)
 * ------------------------------------------------------------------ */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Markers on the 0–12 year timeline, with the source each rests on. */
export const AGE_MARKERS = [
  {
    years: 5,
    label: "5 years",
    text: "Bridgestone recommends having tires inspected by a tire professional at least once a year from 5 years on, spare included.",
    sources: ["S46", "S47"],
  },
  {
    years: 6,
    label: "6 to 10 years",
    text: "NHTSA notes that some vehicle and tire makers recommend replacing tires somewhere between 6 and 10 years, regardless of tread.",
    sources: ["S1"],
  },
  {
    years: 10,
    label: "10 years",
    text: "Bridgestone recommends replacing tires 10 years after they were made, regardless of tread depth.",
    sources: ["S46"],
  },
];

export const TIMELINE_YEARS = 12;

/** The status and note for a tire's age in years. */
export function ageBand(ageYears) {
  if (ageYears >= 10) {
    return {
      status: STATUS.mfrReplace,
      text: "Older than 10 years. Manufacturers such as Bridgestone recommend replacing tires 10 years after they were made, regardless of tread depth.",
      sources: ["S46"],
    };
  }
  if (ageYears >= 5) {
    return {
      status: STATUS.inspect,
      text: "Between 5 and 10 years. Bridgestone recommends a professional inspection at least once a year from 5 years on, and NHTSA notes some makers recommend replacing at 6 to 10 years. Check your tire and vehicle maker's guidance.",
      sources: ["S46", "S47", "S1"],
    };
  }
  return {
    status: STATUS.monitor,
    text: "Under 5 years. Age is only one factor: keep checking tread, pressure and sidewalls monthly, and have the tire inspected if you see cracks, bulges or damage.",
    sources: ["S1"],
  };
}

/** 7.26 → "About 7 years, 3 months". */
export function ageText(ageYears) {
  const totalMonths = Math.floor(ageYears * 12 + 1e-9);
  if (totalMonths < 1) return "Less than a month";
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  const parts = [];
  if (y) parts.push(`${y} year${y === 1 ? "" : "s"}`);
  if (m) parts.push(`${m} month${m === 1 ? "" : "s"}`);
  return `About ${parts.join(", ")}`;
}

/**
 * Reads what someone typed: the last four DOT digits (WWYY), a full TIN
 * ("DOT U2LL LMLR 2319"), or a pre-2000 three-digit code.
 *
 * `now` is optional so a prerender can decode week and year without a clock;
 * the age is only computed when a date is passed (the component passes the
 * browser's date from an effect).
 *
 * Returns { state } where state is one of:
 *   empty | incomplete | error | legacy | decoded
 */
export function readDotCode(input, now = null) {
  const raw = String(input ?? "")
    .toUpperCase()
    .trim();
  if (!raw) return { state: "empty" };

  if (/[^A-Z0-9\s-]/.test(raw)) {
    return {
      state: "error",
      message: "Use only the letters and numbers stamped on the sidewall.",
    };
  }

  const compact = raw.replace(/[\s-]/g, "").replace(/^DOT/, "");
  const tail = compact.match(/(\d+)$/);
  const fullTin = compact.length > (tail ? tail[1].length : 0);

  if (!tail) {
    return {
      state: "error",
      message:
        "The date code is the group of digits at the very end of the DOT code, such as 2319.",
    };
  }

  let digits = tail[1];
  const note =
    digits.length > 4
      ? "Only the last four digits are the date code, so that is what was read."
      : null;
  if (digits.length > 4) digits = digits.slice(-4);

  if (digits.length < 3) {
    return fullTin
      ? {
          state: "error",
          message:
            "The DOT code should end in a 4-digit date code (3 digits before 2000).",
        }
      : {
          state: "incomplete",
          message: "Keep typing: the date code is 4 digits, such as 2319.",
        };
  }

  const week = Number(digits.slice(0, 2));
  if (week < 1 || week > 53) {
    return {
      state: "error",
      message: `The first two digits are the week, from 01 to 53. "${digits.slice(0, 2)}" isn't a week.`,
    };
  }

  if (digits.length === 3) {
    return {
      state: "legacy",
      digits,
      week,
      yearDigit: digits[2],
      status: STATUS.mfrReplace,
      message:
        "A 3-digit date code means the tire was built before 2000: the first two digits are the week, the last is the year within the decade. That makes it more than 10 years old, the age at which manufacturers such as Bridgestone recommend replacing a tire.",
      sources: ["S52", "S46"],
    };
  }

  const yy = Number(digits.slice(2));
  const base = {
    state: "decoded",
    digits,
    fullTin,
    note,
    week,
    weekText: digits.slice(0, 2),
    yearText: digits.slice(2),
  };

  if (!now) {
    // No clock yet (prerender): four-digit codes started in 2000.
    return {
      ...base,
      year: 2000 + yy,
      month: null,
      ageYears: null,
      ageText: null,
      band: null,
    };
  }

  const currentYear = now.getFullYear();
  if (2000 + yy > currentYear) {
    return {
      state: "error",
      message: `Four-digit date codes started in 2000, so "${digits.slice(2)}" would be a year that hasn't happened yet. Check the last two digits.`,
    };
  }

  const d = decodeDot(digits, now);
  if (!d || d.legacy) {
    return { state: "error", message: "That date code couldn't be read." };
  }

  // A week later this year than today is a typo, not a new tire. Allow a
  // week of slack for decodeDot's week-to-date approximation.
  if (d.ageYears < -7 / 365.25) {
    return {
      state: "error",
      message: `Week ${d.week} of ${d.year} hasn't happened yet. Check the first two digits.`,
    };
  }

  const ageYears = Math.max(0, d.ageYears);
  return {
    ...base,
    year: d.year,
    month: MONTHS[d.built.getMonth()],
    ageYears,
    ageText: ageText(ageYears),
    band: ageBand(ageYears),
  };
}

/* ------------------------------------------------------------------ *
 * Tire size (D3)
 * ------------------------------------------------------------------ */

const SERVICE_TEXT = {
  P: "P means P-metric: a tire built and load-rated for passenger cars, crossovers and minivans.",
  LT: "LT means light truck: built for heavier loads and higher pressures than a passenger tire. It isn't interchangeable with a P-metric tire of the same size without checking the load and inflation tables.",
  ST: "ST means special trailer: for trailer axles only, never a car or truck.",
};

const CONSTRUCTION_TEXT = {
  R: "R means radial construction: the body cords run straight across the tire from bead to bead, under steel belts. Nearly every road tire sold today is a radial.",
  D: "D (or a dash) means bias-ply construction: the body cords run diagonally. It shows up on trailer, vintage and some off-road tires.",
  B: "B means belted bias: bias-ply cords with a belt laid over them. Rare outside trailer and vintage tires.",
};

export const SIZE_EXAMPLES = [
  "225/45R17 94W",
  "P215/60R16 95H",
  "LT265/70R17 121/118S",
  "33x12.50R20LT 114Q",
];

const incompleteSize = /^(P|LT|ST)?\d{0,3}(\/\d{0,3})?$|^\d{2}(\.\d*)?X?\d{0,2}(\.\d*)?$/;

/**
 * Pulls apart the extras parseSize() doesn't take — a dual load index
 * (121/118S), a trailing LT on a metric size, an XL marking, or a load and
 * speed after a flotation size — and hands it the core it understands.
 */
function preparseSize(compact) {
  let s = compact;
  const extras = { dualLoad: null, xl: false, trailingLt: false };

  if (/XL$/.test(s)) {
    extras.xl = true;
    s = s.slice(0, -2);
  }

  // Flotation with a load/speed after it: 33X12.50R20LT114Q.
  const flot = s.match(
    /^(\d{2}(?:\.\d+)?X\d{1,2}(?:\.\d+)?(?:R|D|B|-)?\d{2}(?:\.\d)?)(LT)?(?:(\d{2,3})(?:\/(\d{2,3}))?([A-Z]{1,2}))?$/,
  );
  if (flot) {
    const [, core, lt, load, dual, speed] = flot;
    extras.dualLoad = dual ?? null;
    return { core: core + (lt ?? ""), load: load ?? null, speed: speed ?? null, extras };
  }

  const dual = s.match(
    /^(.*?(?:R|D|B|-)\d{2}(?:\.\d)?)(\d{2,3})\/(\d{2,3})([A-Z]{1,2})$/,
  );
  if (dual && dual[1].includes("/")) {
    extras.dualLoad = dual[3];
    s = dual[1] + dual[2] + dual[4];
  }

  // 265/70R17LT or 265/70R17 121SLT style.
  const lt = s.match(/^(\d{3}\/.*?)LT$/);
  if (lt) {
    extras.trailingLt = true;
    s = lt[1];
  }
  return { core: s, load: null, speed: null, extras };
}

/**
 * Decodes a size into labelled parts plus the nominal geometry.
 *
 * Returns { state: "empty" | "incomplete" | "error" | "decoded", ... }.
 */
export function decodeSize(input) {
  const raw = String(input ?? "").toUpperCase().trim();
  if (!raw) return { state: "empty" };
  const compact = raw.replace(/\s+/g, "");

  const { core, load, speed, extras } = preparseSize(compact);
  const parsed = parseSize(core);

  if (!parsed) {
    if (incompleteSize.test(compact)) {
      return {
        state: "incomplete",
        message: "Keep typing: a full size looks like 225/45R17 94W.",
      };
    }
    return {
      state: "error",
      message:
        "That doesn't read as a tire size. Try one like 225/45R17 94W, LT265/70R17 121/118S or 33x12.50R20.",
    };
  }

  const size = { ...parsed };
  if (load) size.loadIndex = load;
  if (speed) size.speedRating = speed;
  if (extras.trailingLt) size.service = "LT";
  const serviceMarked =
    extras.trailingLt ||
    /^(P|LT|ST)\d/.test(compact) ||
    (parsed.format === "flotation" && parsed.service === "LT");

  const geo = sizeGeometry(size);
  const parts = [];
  const flotation = geo.format === "flotation";

  if (serviceMarked) {
    parts.push({
      role: "service",
      token: geo.service,
      title: "Service type",
      text: SERVICE_TEXT[geo.service],
    });
  }

  if (flotation) {
    // Keep the width as printed ("12.50", not "12.5").
    const printed = compact.match(/^(\d{2}(?:\.\d+)?)X(\d{1,2}(?:\.\d+)?)/);
    parts.push({
      role: "diameter",
      token: printed ? printed[1] : String(geo.flotationDiameter),
      title: "Overall diameter",
      text: `${geo.flotationDiameter} is the overall diameter in inches, stated directly. Flotation sizes like this one have no aspect ratio; the first number is the height of the tire.`,
    });
    parts.push({
      role: "width",
      token: printed ? printed[2] : String(geo.widthIn),
      title: "Section width",
      text: `${printed ? printed[2] : geo.widthIn} is the section width in inches (about ${Math.round(geo.width)} mm), measured sidewall to sidewall on a mounted, inflated tire.`,
    });
  } else {
    parts.push({
      role: "width",
      token: String(geo.width),
      title: "Section width",
      text: `${geo.width} is the section width in millimeters (about ${trimNum(geo.sectionWidthIn)} in), measured sidewall to sidewall on a mounted, inflated tire.`,
    });
    parts.push({
      role: "aspect",
      token: String(geo.aspect),
      title: "Aspect ratio",
      text: `${geo.aspect} is the aspect ratio: the sidewall is ${geo.aspect}% as tall as the tire is wide, about ${Math.round(geo.sidewallMm)} mm (${trimNum(geo.sidewallIn)} in).`,
    });
  }

  const zr = !flotation && /\d{2,3}ZR/.test(compact);
  parts.push({
    role: "construction",
    token: zr ? "ZR" : geo.construction,
    title: "Construction",
    text:
      (CONSTRUCTION_TEXT[geo.construction] ??
        "An uncommon construction letter; check the tire maker's spec sheet.") +
      (zr
        ? " The Z in front of the R is an older speed marking for 149 mph and up; a letter after the load index, if there is one, is the tire's actual rating."
        : ""),
  });

  parts.push({
    role: "rim",
    token: String(geo.rimDiameter),
    title: "Wheel diameter",
    text: `${geo.rimDiameter} is the wheel diameter in inches. The tire mounts only on a ${geo.rimDiameter}-inch wheel.`,
  });

  if (geo.loadIndex) {
    const lbs = loadPounds(geo.loadIndex);
    const kg = LOAD_INDEX_KG[Number(geo.loadIndex)];
    // Pounds for the dual figure only when the single one has them too.
    const dualLbs = extras.dualLoad && lbs ? loadPounds(extras.dualLoad) : null;
    let text = lbs
      ? `${geo.loadIndex} is the load index: a maximum of ${commas(lbs)} lb (${commas(kg)} kg) per tire.`
      : `${geo.loadIndex} is the load index. It's outside the 71–126 range of our table, so check the tire maker's load chart for the figure.`;
    if (extras.dualLoad) {
      text += ` The second number, ${extras.dualLoad}, is the load index when the tire runs as a pair on dual rear wheels${dualLbs ? ` (${commas(dualLbs)} lb each)` : ""}.`;
    }
    text +=
      " Replacement tires should match or exceed the load index your vehicle maker specifies (door placard or owner's manual).";
    parts.push({
      role: "load",
      token: extras.dualLoad
        ? `${geo.loadIndex}/${extras.dualLoad}`
        : String(geo.loadIndex),
      title: "Load index",
      text,
    });
  }

  if (geo.speedRating) {
    const sr = geo.speedRating;
    const mph = SPEED_MPH[sr];
    const text = mph
      ? `${sr} is the speed rating: the tire passed a lab test at up to ${mph} mph. It's a test rating, not a recommended driving speed.`
      : sr === "Z"
        ? "Z is an open-ended speed rating for over 149 mph. It's a test rating, not a recommended driving speed."
        : `${sr} is the speed rating. It isn't in our table, so check the tire maker's spec sheet. It's a test rating, not a recommended driving speed.`;
    parts.push({ role: "speed", token: sr, title: "Speed rating", text });
  }

  if (extras.xl) {
    parts.push({
      role: "xl",
      token: "XL",
      title: "Extra load",
      text: "XL means extra load: the tire carries more weight than a standard-load tire of the same size, at the higher inflation pressure given in the tire maker's tables.",
    });
  }

  const overallMm = geo.overallDiameter * MM_PER_INCH;
  return {
    state: "decoded",
    format: geo.format,
    service: geo.service,
    parts: parts.map((p, i) => ({ ...p, n: i + 1 })),
    geometry: {
      sidewallMm: geo.sidewallMm,
      sidewallIn: geo.sidewallIn,
      overallDiameterIn: geo.overallDiameter,
      overallDiameterMm: overallMm,
      rimDiameterIn: geo.rimDiameter,
      sectionWidthMm: geo.sectionWidthMm,
      sidewallText: `${Math.round(geo.sidewallMm)} mm (${geo.sidewallIn.toFixed(1)} in)`,
      diameterText: `${geo.overallDiameter.toFixed(1)} in (${Math.round(overallMm)} mm)`,
    },
  };
}

/* ------------------------------------------------------------------ *
 * TPMS warning light (D11)
 * ------------------------------------------------------------------ */

export const TPMS_STATES = [
  {
    id: "solid",
    label: "Solid on",
    short: "Stays lit while driving",
    headline: "Low-pressure warning",
    status: STATUS.inspect,
    meaning:
      "At least one tire may be well below its recommended pressure. Under FMVSS No. 138, the light must come on when a tire is 25% or more below the vehicle maker's recommended cold pressure (or below a minimum set by the standard, whichever is higher).",
    steps: [
      "Check all four tires with a gauge when they are cold, before driving.",
      "Inflate to the pressure on the vehicle's door placard or in the owner's manual, not the maximum printed on the sidewall.",
      "If the light stays on once the tires are at placard pressure, or a tire keeps losing air, have the tires and the system inspected.",
    ],
    sources: ["S8", "S1"],
  },
  {
    id: "flashing",
    label: "Flashes, then stays on",
    short: "Flashes about 60–90 seconds at start-up, then solid",
    headline: "System malfunction",
    status: STATUS.inspect,
    meaning:
      "The monitoring system has found a fault, such as a sensor that isn't reporting. FMVSS No. 138 has the light flash for about 60 to 90 seconds and then stay on to signal a malfunction. While it does, the system may not be able to warn you about low pressure.",
    steps: [
      "Check all four tires with a gauge when they are cold, since the system may not be watching them.",
      "Inflate to the pressure on the door placard or in the owner's manual.",
      "Have the tire pressure monitoring system inspected.",
    ],
    sources: ["S8", "S1"],
  },
  {
    id: "off",
    label: "Off",
    short: "No light while driving",
    headline: "No warning showing",
    status: STATUS.monitor,
    meaning:
      "No warning is lit, but that doesn't confirm your pressures are right. The warning is built for significant under-inflation (25% below the placard pressure under FMVSS No. 138), so a tire can be low without turning it on. A brief light when you start the car is the bulb check.",
    steps: [
      "Check pressures with a gauge at least monthly and before long trips, when the tires are cold.",
      "Use the pressure on the door placard or in the owner's manual.",
      "Have it inspected if one tire keeps needing air.",
    ],
    sources: ["S1", "S7", "S8"],
  },
];

/* ------------------------------------------------------------------ *
 * UTQG (D10)
 * ------------------------------------------------------------------ */

export const TRACTION_GRADES = [
  { grade: "AA", text: "AA is the highest traction grade." },
  { grade: "A", text: "A is the second-highest traction grade." },
  { grade: "B", text: "B is the third traction grade." },
  { grade: "C", text: "C is the lowest traction grade." },
];

export const TEMPERATURE_GRADES = [
  {
    grade: "A",
    band: "over 115 mph",
    text: "A is the highest temperature grade: in the lab test it held up at speeds over 115 mph.",
  },
  {
    grade: "B",
    band: "100 to 115 mph",
    text: "B is the middle temperature grade: in the lab test it held up at 100 to 115 mph.",
  },
  {
    grade: "C",
    band: "85 to 100 mph",
    text: "C is the lowest temperature grade: in the lab test it held up at 85 to 100 mph, the minimum passenger tires must meet under federal standards.",
  },
];

export const UTQG_EXAMPLES = ["300 A B", "500 AA A", "700 A B"];

export const TREADWEAR_CAVEAT =
  "Treadwear grades are relative, not miles. Each manufacturer grades its own tires, so they are most useful for comparing tires within one brand. Real tread life depends on driving habits, maintenance, road surfaces and climate.";

/** "500 AA A", "500AAA" or "500 aa a" → { treadwear, traction, temperature }. */
export function parseUtqgString(input) {
  const s = String(input ?? "").toUpperCase().trim();
  const m = s.match(/^(\d{1,4})\s*(AA|A|B|C)\s*(A|B|C)$/);
  if (!m) return null;
  return { treadwear: Number(m[1]), traction: m[2], temperature: m[3] };
}

/** Validates a treadwear entry. Returns { ok, value?, message? }. */
export function readTreadwear(input) {
  const s = String(input ?? "").trim();
  if (!s) return { ok: false, message: "Enter the treadwear number from the sidewall, such as 500." };
  if (!/^\d+$/.test(s)) {
    return { ok: false, message: "Treadwear is a whole number, such as 500." };
  }
  const n = Number(s);
  if (n < 1 || n > 1500) {
    return { ok: false, message: "That's outside the range of treadwear grades. Check the number on the sidewall." };
  }
  return { ok: true, value: n };
}

/** The plain-English reading of a full UTQG marking. */
export function explainUtqg({ treadwear, traction, temperature }) {
  const tw = readTreadwear(treadwear);
  const tr = TRACTION_GRADES.find((g) => g.grade === traction) ?? null;
  const te = TEMPERATURE_GRADES.find((g) => g.grade === temperature) ?? null;

  const ratio = tw.ok ? trimNum(tw.value / 100, 2) : null;
  return {
    marking: `${tw.ok ? tw.value : "—"} ${traction ?? "—"} ${temperature ?? "—"}`,
    treadwear: tw.ok
      ? {
          value: tw.value,
          ratio,
          text: `${tw.value} means the manufacturer graded this tire as wearing ${ratio} times as long as the reference control tire (graded 100) on the government test course.`,
        }
      : { error: tw.message },
    traction: tr
      ? {
          grade: tr.grade,
          text: `${tr.text} Traction grades come from straight-line braking tests on wet asphalt and concrete. They don't include cornering, acceleration, hydroplaning or peak traction.`,
        }
      : null,
    temperature: te
      ? {
          grade: te.grade,
          band: te.band,
          text: `${te.text} The grade measures how well the tire resists and sheds heat on an indoor lab test wheel, for a tire that is properly inflated and not overloaded.`,
        }
      : null,
    caveat: TREADWEAR_CAVEAT,
    sources: ["S9", "S55", "S63"],
  };
}
