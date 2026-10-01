/**
 * Vehicle Identification Numbers (VINs): tidy one up and check it before it
 * is sent anywhere. Pure functions, shared by the Tire Size Finder page and
 * the server (api/_lib/scanTireSize.js), so a VIN read off a photo and a VIN
 * typed by hand pass the same test.
 *
 * A VIN is 17 characters, digits and capital letters without I, O or Q
 * (they read too much like 1 and 0). Position 9 is a check digit computed
 * from the other 16 (49 CFR 565.15), so most single-character typos and
 * misreads are caught here, before NHTSA is asked.
 */

const ALLOWED = /^[A-HJ-NPR-Z0-9]{17}$/;

// Letter values for the check digit (I, O and Q are never used).
// prettier-ignore
const VALUES = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

/** Upper case, with spaces, dashes and dots taken out ("1hg cm-82633..."). */
export function normalizeVin(input) {
  return String(input ?? "")
    .toUpperCase()
    .replace(/[\s\-.]/g, "");
}

/**
 * The check digit position 9 should hold for these 17 characters ("0"-"9"
 * or "X"), or null when they are not 17 allowed characters.
 */
export function vinCheckDigit(vin) {
  const v = normalizeVin(vin);
  if (!ALLOWED.test(v)) return null;
  let sum = 0;
  for (let i = 0; i < 17; i += 1) {
    const ch = v[i];
    const value = /\d/.test(ch) ? Number(ch) : VALUES[ch];
    sum += value * WEIGHTS[i];
  }
  const rest = sum % 11;
  return rest === 10 ? "X" : String(rest);
}

/**
 * What is wrong with a VIN, or null when it passes:
 *   "empty"        nothing typed
 *   "length"       not 17 characters
 *   "letters"      I, O, Q or a character a VIN never has
 *   "check-digit"  17 good characters whose check digit does not match:
 *                  almost always one character typed or read wrong
 */
export function vinProblem(input) {
  const v = normalizeVin(input);
  if (!v) return "empty";
  if (v.length !== 17) return "length";
  if (!ALLOWED.test(v)) return "letters";
  if (vinCheckDigit(v) !== v[8]) return "check-digit";
  return null;
}

/** True for a 17-character VIN whose check digit matches. */
export const isValidVin = (input) => vinProblem(input) === null;

/** What to tell a shopper about a VIN that did not pass. */
export function vinProblemText(problem) {
  switch (problem) {
    case "empty":
      return "Type the 17-character VIN.";
    case "length":
      return "A VIN is exactly 17 characters. Check for a missing or extra character.";
    case "letters":
      return "A VIN never uses the letters I, O or Q. Those are usually the numbers 1 and 0.";
    case "check-digit":
      return "That VIN doesn't add up. One character is usually typed or read wrong; check it against your registration or the windshield plate.";
    default:
      return "";
  }
}
