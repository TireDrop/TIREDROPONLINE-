// Load-index and speed-symbol tables for the Learn demos.
//
// These are the standard published tables (Goodyear S54 and Michelin S35 in
// docs/content/learn-plan.md). They mirror the page-local copies in
// src/pages/tools/TireSizePage.jsx, which are not exported. When the reserved
// `load-speed` demo is built, both should move to one module in src/data.

/** Load index → maximum load per tire in kilograms (71–126 only). */
export const LOAD_INDEX_KG = {
  71: 345, 72: 355, 73: 365, 74: 375, 75: 387, 76: 400, 77: 412, 78: 425,
  79: 437, 80: 450, 81: 462, 82: 475, 83: 487, 84: 500, 85: 515, 86: 530,
  87: 545, 88: 560, 89: 580, 90: 600, 91: 615, 92: 630, 93: 650, 94: 670,
  95: 690, 96: 710, 97: 730, 98: 750, 99: 775, 100: 800, 101: 825, 102: 850,
  103: 875, 104: 900, 105: 925, 106: 950, 107: 975, 108: 1000, 109: 1030,
  110: 1060, 111: 1090, 112: 1120, 113: 1150, 114: 1180, 115: 1215,
  116: 1250, 117: 1285, 118: 1320, 119: 1360, 120: 1400, 121: 1450,
  122: 1500, 123: 1550, 124: 1600, 125: 1650, 126: 1700,
};

export const LBS_PER_KG = 2.20462;

/** Max load in pounds for a load index, or null outside the table. */
export function loadPounds(index) {
  const kg = LOAD_INDEX_KG[Number(index)];
  return kg ? Math.round(kg * LBS_PER_KG) : null;
}

/** Speed symbol → the lab test speed in mph. Z is open-ended (149+). */
export const SPEED_MPH = {
  L: 75,
  M: 81,
  N: 87,
  P: 93,
  Q: 99,
  R: 106,
  S: 112,
  T: 118,
  U: 124,
  H: 130,
  V: 149,
  W: 168,
  Y: 186,
};
