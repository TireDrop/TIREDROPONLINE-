// Pure logic behind D4, Pressure vs temperature (learn-plan §4): no React, no
// DOM, so it runs in the node test runner and in a build-time prerender alike.
//
// Two estimates, side by side:
//   Rule of thumb  about 1 PSI per 10°F (USTMA, Bridgestone; learn-plan C2).
//   Gas law        Gay-Lussac's law on absolute pressure and temperature:
//                  P2 = (P1 + 14.7) × (T2 + 459.67) / (T1 + 459.67) − 14.7
//                  with P in gauge PSI and T in °F.
//
// House rules: this never outputs a recommended pressure. The only pressure
// anyone should set is "your door-sticker value", cold; every number here is
// labelled as an estimate of what a gauge would read.

/** Standard atmospheric pressure, PSI: gauge + this = absolute. */
export const ATM_PSI = 14.7;
/** °F + this = degrees Rankine (absolute). */
export const RANKINE_OFFSET = 459.67;

/** Input ranges the demo accepts. */
export const PSI_RANGE = { min: 20, max: 80 };
export const FILL_TEMP_RANGE = { min: -20, max: 120 };
export const NOW_TEMP_RANGE = { min: 30, max: 110 };

/** The table fallback's rows, °F. */
export const TABLE_TEMPS = [40, 50, 60, 70, 80, 90, 100, 110];

/** FMVSS No. 138: the warning must light at 25% below the placard value. */
export const TPMS_FRACTION = 0.75;

export const PRESSURE_DEFAULTS = { psi: "35", fillTemp: "78", nowTemp: 95 };

export const PRESSURE_PRESETS = [
  {
    id: "miami",
    label: "July Miami: 7 am → 3 pm",
    fillTemp: 78,
    nowTemp: 95,
    text: "Filled at 78°F on a July morning in Miami, read again at 95°F that afternoon.",
  },
  {
    id: "front",
    label: "Cold-front morning",
    fillTemp: 82,
    nowTemp: 48,
    text: "Filled on an 82°F afternoon, read again at 48°F the morning a cold front comes through.",
  },
  {
    id: "garage",
    label: "A/C garage → driveway",
    fillTemp: 72,
    nowTemp: 96,
    text: "Filled at 72°F in an air-conditioned garage, read again after sitting on a 96°F driveway.",
  },
];

const finite = (...ns) => ns.every((n) => typeof n === "number" && Number.isFinite(n));

/**
 * Rule of thumb: about 1 PSI per 10°F. Returns the estimated gauge reading,
 * or null for non-numbers.
 */
export function ruleOfThumbPsi(psi, fillTemp, nowTemp) {
  if (!finite(psi, fillTemp, nowTemp)) return null;
  return psi + (nowTemp - fillTemp) / 10;
}

/**
 * Gas law: P2 = (P1 + 14.7)(T2 + 459.67)/(T1 + 459.67) − 14.7, gauge PSI and
 * °F. Returns null for non-numbers or a temperature at or below absolute zero.
 */
export function gasLawPsi(psi, fillTemp, nowTemp) {
  if (!finite(psi, fillTemp, nowTemp)) return null;
  const t1 = fillTemp + RANKINE_OFFSET;
  const t2 = nowTemp + RANKINE_OFFSET;
  if (t1 <= 0 || t2 <= 0) return null;
  return ((psi + ATM_PSI) * t2) / t1 - ATM_PSI;
}

/** 36.57 → "36.6". Always one decimal, so a reading never looks exact. */
export const fmtPsi = (n) => (Math.round(n * 10) / 10).toFixed(1);

/**
 * Validates one numeric field. Returns { ok, value?, message? }.
 * Accepts a string (what a text input holds) or a number.
 */
export function readNumber(input, { min, max }, messages) {
  const s = String(input ?? "").trim();
  if (!s) return { ok: false, message: messages.empty };
  if (!/^-?\d+(\.\d+)?$/.test(s)) return { ok: false, message: messages.nan };
  const n = Number(s);
  if (n < min || n > max) return { ok: false, message: messages.range };
  return { ok: true, value: n };
}

const PSI_MESSAGES = {
  empty: "Enter the cold pressure from the sticker in the driver's door jamb, such as 35.",
  nan: "Enter the pressure as a number, such as 35.",
  range: `This demo takes ${PSI_RANGE.min} to ${PSI_RANGE.max} PSI. Check the number on your door sticker.`,
};

const FILL_MESSAGES = {
  empty: "Enter the air temperature when the tires were filled, such as 78.",
  nan: "Enter the temperature as a number of degrees, such as 78.",
  range: `This demo takes ${FILL_TEMP_RANGE.min}°F to ${FILL_TEMP_RANGE.max}°F.`,
};

const NOW_MESSAGES = {
  empty: "Pick the temperature now.",
  nan: "Pick the temperature now.",
  range: `The temperature now runs from ${NOW_TEMP_RANGE.min}°F to ${NOW_TEMP_RANGE.max}°F.`,
};

export const readPsi = (v) => readNumber(v, PSI_RANGE, PSI_MESSAGES);
export const readFillTemp = (v) => readNumber(v, FILL_TEMP_RANGE, FILL_MESSAGES);
export const readNowTemp = (v) => readNumber(v, NOW_TEMP_RANGE, NOW_MESSAGES);

/** The preset whose temperatures match, or null. */
export function matchPreset(fillTemp, nowTemp) {
  return (
    PRESSURE_PRESETS.find(
      (p) => p.fillTemp === Number(fillTemp) && p.nowTemp === Number(nowTemp),
    ) ?? null
  );
}

export const HOT_TIRE_CALLOUT = {
  lead: "Just drove?",
  text: "Tires read higher when they're hot from driving. Don't let air out of a hot tire; check it after the car has been parked for 3+ hours.",
};

export const ESTIMATE_NOTE =
  "These are estimates of what a gauge would read, from air temperature alone. Sun on the tire, recent driving and your gauge all move the real number. Always set pressure to your door-sticker value with the tires cold.";

export const TPMS_NOTE =
  "Under FMVSS No. 138, the tire pressure warning light is designed to come on when a tire is 25% or more below the door-sticker value (or below a minimum the standard sets, whichever is higher). The light is a warning, not a gauge.";

/**
 * Everything D4 shows for one set of inputs.
 *
 * Returns { state: "error", errors } when an input doesn't read, or
 * { state: "estimated", ... } with both estimates, the change, the TPMS check and
 * the 40–110°F table rows.
 */
export function pressureReading({ psi, fillTemp, nowTemp }) {
  const p = readPsi(psi);
  const t1 = readFillTemp(fillTemp);
  const t2 = readNowTemp(nowTemp);
  if (!p.ok || !t1.ok || !t2.ok) {
    const errors = {};
    if (!p.ok) errors.psi = p.message;
    if (!t1.ok) errors.fillTemp = t1.message;
    if (!t2.ok) errors.nowTemp = t2.message;
    return { state: "error", errors };
  }

  const placard = p.value;
  const thumb = ruleOfThumbPsi(placard, t1.value, t2.value);
  const gas = gasLawPsi(placard, t1.value, t2.value);
  const delta = gas - placard;
  const shown = Math.abs(Number(fmtPsi(delta)));
  const direction = shown === 0 ? "same" : delta > 0 ? "higher" : "lower";
  const tpmsLine = placard * TPMS_FRACTION;
  const belowPct = Math.max(0, ((placard - gas) / placard) * 100);
  const tpmsLow = gas <= tpmsLine;

  const change =
    direction === "same"
      ? `That's about the same as when the tires were filled at ${t1.value}°F.`
      : `That's about ${fmtPsi(shown)} PSI ${direction} than when the tires were filled at ${t1.value}°F.`;

  const summary = `At ${t2.value}°F, tires set to your door-sticker value of ${placard} PSI at ${t1.value}°F would read about ${fmtPsi(gas)} PSI by the gas law, or ${fmtPsi(thumb)} PSI by the rule of thumb. ${change}`;

  const nearest = Math.min(
    TABLE_TEMPS[TABLE_TEMPS.length - 1],
    Math.max(TABLE_TEMPS[0], Math.round(t2.value / 10) * 10),
  );

  return {
    state: "estimated",
    placard,
    fillTemp: t1.value,
    nowTemp: t2.value,
    thumb,
    gas,
    delta,
    direction,
    thumbText: `${fmtPsi(thumb)} PSI`,
    gasText: `${fmtPsi(gas)} PSI`,
    summary,
    change,
    valueText: `${t2.value} degrees Fahrenheit, estimated ${fmtPsi(gas)} PSI`,
    tpms: {
      low: tpmsLow,
      linePsi: tpmsLine,
      belowPct,
      text: tpmsLow
        ? `That's ${Math.round(belowPct)}% below your door-sticker value, past the 25% point where FMVSS No. 138 has the tire pressure warning light come on. Check all four tires with a gauge when they're cold and set them to your door-sticker value.`
        : null,
    },
    rows: TABLE_TEMPS.map((t) => ({
      temp: t,
      thumb: ruleOfThumbPsi(placard, t1.value, t),
      gas: gasLawPsi(placard, t1.value, t),
      thumbText: `${fmtPsi(ruleOfThumbPsi(placard, t1.value, t))} PSI`,
      gasText: `${fmtPsi(gasLawPsi(placard, t1.value, t))} PSI`,
      current: t === nearest,
    })),
    sources: ["S13", "C2", "S1", "S2", "S4", "S8"],
  };
}
