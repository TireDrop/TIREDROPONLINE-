// Tire geometry, date codes and tread depth — the arithmetic behind the
// customer-facing tools.
//
// Every number here is derived from the size marking itself or from published
// industry practice. Nothing is invented, and where a figure is an
// approximation the function says so, because a tool that quietly rounds off
// someone's speedometer error is worse than no tool.

const MM_PER_INCH = 25.4;
const INCHES_PER_MILE = 63360;

/**
 * Splits a size marking into its parts.
 *
 * Handles the two markings a US shopper will actually read off a sidewall:
 *
 *   P-metric   215/60R16, LT265/70R17 121S, 225/45ZR17, P205/55R16 91V
 *   Flotation  31x10.50R15, 33X12.50R20LT — the inch-based marking on
 *              light-truck and off-road tires, where overall diameter is
 *              stated outright instead of implied by an aspect ratio
 *
 * Returns null for anything that is not a size, so a caller can tell "not
 * typed yet" from "typed wrong".
 */
export function parseSize(input) {
  if (!input) return null;
  const s = String(input).toUpperCase().replace(/\s+/g, "");

  // Flotation first: it is unambiguous, and it would otherwise fall through
  // the metric pattern and come back as nothing.
  const flot = s.match(
    /^(\d{2}(?:\.\d+)?)X(\d{1,2}(?:\.\d+)?)(R|D|B|-)?(\d{2}(?:\.\d)?)(LT|P)?$/,
  );
  if (flot) {
    const [, diameter, widthIn, construction, rim, service] = flot;
    return {
      format: "flotation",
      service: service === "LT" ? "LT" : "P",
      // This marking states diameter and width in inches directly.
      flotationDiameter: Number(diameter),
      widthIn: Number(widthIn),
      width: Number(widthIn) * MM_PER_INCH,
      aspect: null,
      construction: construction === "-" ? "D" : (construction ?? "R"),
      rimDiameter: Number(rim),
      loadIndex: null,
      speedRating: null,
      normalized: `${diameter}x${widthIn}R${rim}`,
    };
  }

  // P-metric. The pattern allows a speed rating in front of the R
  // (225/45ZR17), which is how Z-rated tires have been marked for decades.
  const m = s.match(
    /^(P|LT|ST)?(\d{3})\/(\d{2,3})([A-Z]{0,2})(R|D|B|-)(\d{2}(?:\.\d)?)(?:(\d{2,3})([A-Z]{1,2}))?$/,
  );
  if (!m) return null;

  const [
    ,
    service,
    width,
    aspect,
    inlineSpeed,
    construction,
    rim,
    loadIndex,
    speedRating,
  ] = m;
  return {
    format: "metric",
    service: service ?? "P",
    width: Number(width),
    aspect: Number(aspect),
    construction: construction === "-" ? "D" : construction,
    rimDiameter: Number(rim),
    loadIndex: loadIndex ?? null,
    // A trailing rating wins over one marked inline, since that is the one
    // the tire is actually certified to.
    speedRating: speedRating ?? (inlineSpeed || null),
    normalized: `${width}/${aspect}R${rim}`,
  };
}

/**
 * The dimensions a size implies.
 *
 * These are the nominal figures the marking describes. A mounted tire under
 * load sits a little shorter than its free diameter, so revolutions per mile
 * in the real world runs slightly higher than the figure here — which is why
 * `revsPerMile` is labelled as unloaded wherever it is shown.
 */
export function sizeGeometry(input) {
  const size = typeof input === "string" ? parseSize(input) : input;
  if (!size) return null;

  // A flotation size states its diameter; a metric one implies it from the
  // aspect ratio, which is a percentage of the section width.
  const isFlotation = size.format === "flotation";
  const sidewallIn = isFlotation
    ? (size.flotationDiameter - size.rimDiameter) / 2
    : (size.width * (size.aspect / 100)) / MM_PER_INCH;
  const sidewallMm = sidewallIn * MM_PER_INCH;
  const overallDiameter = isFlotation
    ? size.flotationDiameter
    : size.rimDiameter + sidewallIn * 2;
  const circumference = Math.PI * overallDiameter;

  return {
    ...size,
    sectionWidthMm: size.width,
    sectionWidthIn: size.width / MM_PER_INCH,
    sidewallMm,
    sidewallIn,
    overallDiameter,
    circumference,
    revsPerMile: INCHES_PER_MILE / circumference,
  };
}

/** Fitment guidance. Beyond about 3% the speedometer and ABS start to care. */
const DIAMETER_TOLERANCE = 3;

/**
 * Compares a replacement size against the one on the car.
 *
 * The speedometer reads off wheel rotations, so a taller tire covers more
 * ground per turn and the needle reads low. `actualAt` answers the question
 * people are really asking: at an indicated 60, how fast am I going?
 */
export function compareSizes(fromInput, toInput) {
  const from = sizeGeometry(fromInput);
  const to = sizeGeometry(toInput);
  if (!from || !to) return null;

  const diameterChange =
    ((to.overallDiameter - from.overallDiameter) / from.overallDiameter) * 100;

  const actualAt = (indicated) =>
    indicated * (to.overallDiameter / from.overallDiameter);

  return {
    from,
    to,
    diameterChange,
    diameterChangeIn: to.overallDiameter - from.overallDiameter,
    widthChangeMm: to.sectionWidthMm - from.sectionWidthMm,
    sidewallChangeIn: to.sidewallIn - from.sidewallIn,
    // Ground clearance moves by half the diameter change: the axle rises by
    // the change in radius, not in diameter.
    clearanceChangeIn: (to.overallDiameter - from.overallDiameter) / 2,
    revsChange: ((to.revsPerMile - from.revsPerMile) / from.revsPerMile) * 100,
    actualAt,
    speedoErrorAt60: actualAt(60) - 60,
    withinTolerance: Math.abs(diameterChange) <= DIAMETER_TOLERANCE,
    sameRim: from.rimDiameter === to.rimDiameter,
    tolerance: DIAMETER_TOLERANCE,
  };
}

/**
 * The one status vocabulary for tread and age checks, keyed by the `status`
 * that treadStatus() and decodeDot() return. House rule: nothing here ever
 * calls a tire "safe", "OK" or "fine". The best a check can say is that
 * nothing says replace yet, so keep checking.
 */
export const STATUS_LABELS = {
  monitor: "Keep checking monthly",
  soon: "Consider replacing",
  inspect: "Have it inspected",
  replace: "Replace",
};

/**
 * Decodes the DOT date code — the last four digits of the DOT serial stamped
 * on the sidewall — into the week and year the tire was built.
 *
 * Four digits have been the standard since 2000. Three-digit codes are from
 * the nineties, which makes the tire old enough that the exact year stops
 * mattering, and that is what this reports.
 */
export function decodeDot(input, now = new Date()) {
  const raw = String(input ?? "")
    .toUpperCase()
    .replace(/[^0-9]/g, "");
  if (!raw) return null;

  // People often paste the whole serial; the date is the last four digits.
  const tail = raw.slice(-4);
  if (raw.length === 3) {
    return { legacy: true, weeks: null, message: "Pre-2000 date code" };
  }
  if (tail.length !== 4) return null;

  const week = Number(tail.slice(0, 2));
  const yy = Number(tail.slice(2));
  if (week < 1 || week > 53) return null;

  // Two digits, so the century is inferred: a code that would put the tire in
  // the future belongs to the previous decade.
  const currentYear = now.getFullYear();
  let year = 2000 + yy;
  while (year > currentYear) year -= 100;

  // Week 1 starts on 1 January; close enough for an age in years.
  const built = new Date(year, 0, 1 + (week - 1) * 7);
  const ageYears = (now - built) / (365.25 * 24 * 3600 * 1000);

  const ageStatus =
    ageYears >= 10 ? "replace" : ageYears >= 6 ? "inspect" : "monitor";

  return {
    legacy: false,
    week,
    year,
    built,
    ageYears,
    // Industry guidance, not law: most manufacturers say have a tire
    // inspected yearly past five or six years and replace it by ten
    // regardless of how much tread is left, because the rubber ages whether
    // the tire is driven or not.
    status: ageStatus,
    label: STATUS_LABELS[ageStatus],
  };
}

/** Tread depth thresholds, in 32nds of an inch. */
export const TREAD = {
  new: 10, // a typical new passenger tire; truck and winter tires start deeper
  // Wet stopping distances grow as tread wears toward this line, per
  // Consumer Reports' worn-tire testing; cite that wherever it is shown.
  wetRisk: 4,
  legal: 2, // the bald line in most US states, and the penny test
};

/**
 * What a measured tread depth means, and how much of the tire's usable life
 * is left — measured against the legal limit, not against zero, because the
 * last 2/32" is not yours to use.
 */
export function treadStatus(thirtySeconds, newDepth = TREAD.new) {
  const depth = Number(thirtySeconds);
  if (!Number.isFinite(depth)) return null;

  const usable = Math.max(0, newDepth - TREAD.legal);
  const left = Math.max(0, depth - TREAD.legal);
  const status =
    depth <= TREAD.legal
      ? "replace"
      : depth <= TREAD.wetRisk
        ? "soon"
        : "monitor";

  return {
    depth,
    lifeLeftPct: usable > 0 ? Math.min(100, (left / usable) * 100) : 0,
    status,
    label: STATUS_LABELS[status],
    // The two coins everyone already has in the car.
    pennyTest: depth <= TREAD.legal, // Lincoln's head showing = at or under 2/32"
    quarterTest: depth <= TREAD.wetRisk, // Washington's head showing = at or under 4/32"
  };
}
