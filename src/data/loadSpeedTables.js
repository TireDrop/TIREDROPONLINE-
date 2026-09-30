// The standard load-index and speed-symbol tables, in one module.
//
// Published by the tire makers the Learn plan cites: Michelin, Load Rating &
// Speed Rating (S35) and Goodyear, Tire Load Index (S54), in
// docs/content/learn-plan.md §6. These are the industry-standard figures,
// not TireDrop's own.
//
// Load index 60–126 covers passenger, crossover, SUV and most light-truck
// fitments. Anything outside it is a commercial or specialty fitment, and
// callers say so instead of guessing.
//
// The older page-local copies (src/pages/tools/TireSizePage.jsx, 71–126) and
// src/components/demos/ratingTables.js hold the same figures for a narrower
// range; both can import from here instead.

/** Load index → maximum load per tire in kilograms (60–126). */
export const LOAD_INDEX_KG = {
  60: 250, 61: 257, 62: 265, 63: 272, 64: 280, 65: 290, 66: 300, 67: 307,
  68: 315, 69: 325, 70: 335, 71: 345, 72: 355, 73: 365, 74: 375, 75: 387,
  76: 400, 77: 412, 78: 425, 79: 437, 80: 450, 81: 462, 82: 475, 83: 487,
  84: 500, 85: 515, 86: 530, 87: 545, 88: 560, 89: 580, 90: 600, 91: 615,
  92: 630, 93: 650, 94: 670, 95: 690, 96: 710, 97: 730, 98: 750, 99: 775,
  100: 800, 101: 825, 102: 850, 103: 875, 104: 900, 105: 925, 106: 950,
  107: 975, 108: 1000, 109: 1030, 110: 1060, 111: 1090, 112: 1120,
  113: 1150, 114: 1180, 115: 1215, 116: 1250, 117: 1285, 118: 1320,
  119: 1360, 120: 1400, 121: 1450, 122: 1500, 123: 1550, 124: 1600,
  125: 1650, 126: 1700,
};

export const LOAD_INDEX_MIN = 60;
export const LOAD_INDEX_MAX = 126;

/** Every load index in the table, ascending. */
export const LOAD_INDEXES = Object.keys(LOAD_INDEX_KG)
  .map(Number)
  .sort((a, b) => a - b);

export const LBS_PER_KG = 2.20462;

/** Max load per tire in kg for a load index, or null outside the table. */
export function loadKg(index) {
  const s = String(index ?? "").trim();
  if (!/^\d{2,3}$/.test(s)) return null;
  return LOAD_INDEX_KG[Number(s)] ?? null;
}

/** Max load per tire in pounds (rounded), or null outside the table. */
export function loadLbs(index) {
  const kg = loadKg(index);
  return kg ? Math.round(kg * LBS_PER_KG) : null;
}

/**
 * Speed symbols L to Y, slowest first, with the lab test speed each stands
 * for. The km/h figures are the defined values; mph is how the US industry
 * prints them. H sits between U and V, so compare by speed, never by letter.
 *
 * Z is left out on purpose: it is an older open-ended marking (over 149 mph)
 * with no single test speed, so it can't be ranked against the others.
 */
export const SPEED_SYMBOLS = [
  { symbol: "L", mph: 75, kmh: 120 },
  { symbol: "M", mph: 81, kmh: 130 },
  { symbol: "N", mph: 87, kmh: 140 },
  { symbol: "P", mph: 93, kmh: 150 },
  { symbol: "Q", mph: 99, kmh: 160 },
  { symbol: "R", mph: 106, kmh: 170 },
  { symbol: "S", mph: 112, kmh: 180 },
  { symbol: "T", mph: 118, kmh: 190 },
  { symbol: "U", mph: 124, kmh: 200 },
  { symbol: "H", mph: 130, kmh: 210 },
  { symbol: "V", mph: 149, kmh: 240 },
  { symbol: "W", mph: 168, kmh: 270 },
  { symbol: "Y", mph: 186, kmh: 300 },
];

/** Speed symbol → { symbol, mph, kmh }. */
export const SPEED_BY_SYMBOL = Object.fromEntries(
  SPEED_SYMBOLS.map((s) => [s.symbol, s]),
);

/** The entry for a speed symbol ("v" works too), or null if it isn't L–Y. */
export function speedSymbol(symbol) {
  return SPEED_BY_SYMBOL[String(symbol ?? "").trim().toUpperCase()] ?? null;
}
