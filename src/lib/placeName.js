// "You're near Wynwood, Miami, FL": the place name shown on /local-delivery
// when the visitor has allowed their device location. One reverse-geocode
// call from the browser, to BigDataCloud's free client-side endpoint (no key;
// its fair use policy allows it for the live position of the device that is
// calling, with the visitor's consent, which is exactly this).
//
// Privacy, all of it enforced here: the coordinates are rounded to 3
// decimals (about 100 m) and are the only data sent besides the language;
// nothing is stored, logged or sent to analytics; the answer is a string the
// page keeps in memory for the current result. Only the neighborhood, city
// and state are read from the reply: a street, house number or ZIP in it is
// never looked at. Every browser dependency is passed in (like geoLocate.js),
// so the logic runs under node --test.

export const REVERSE_GEOCODE_HOST = "https://api.bigdatacloud.net";
const ENDPOINT = `${REVERSE_GEOCODE_HOST}/data/reverse-geocode-client`;
export const REVERSE_GEOCODE_TIMEOUT_MS = 4000;

/** About 100 m: enough for a neighborhood, too coarse for a house. */
export function roundCoord(n) {
  return Math.round(n * 1000) / 1000;
}

/** The request URL: rounded latitude, longitude and the language, nothing else. Null for bad coordinates. */
export function reverseGeocodeUrl(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const q = new URLSearchParams({
    latitude: String(roundCoord(lat)),
    longitude: String(roundCoord(lng)),
    localityLanguage: "en",
  });
  return `${ENDPOINT}?${q}`;
}

// Letters (any script), spaces and the punctuation place names use. No
// digits, so a ZIP or a house number can never pass for a name.
const NAME = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]{0,39}$/u;

const name = (v) => (typeof v === "string" && NAME.test(v.trim()) ? v.trim() : null);

/**
 * "Neighborhood, City, ST" from a reverse-geocode body, using only its
 * `locality` (neighborhood), `city`, `principalSubdivisionCode` ("US-FL")
 * and `countryCode` fields. The neighborhood is dropped when it repeats the
 * city. Without either name there is no place (null); the state alone is
 * never a place. A state is added only for the U.S.
 */
export function placeFromReverse(body) {
  if (!body || typeof body !== "object") return null;
  const locality = name(body.locality);
  const city = name(body.city);
  const names = locality && city && locality.toLowerCase() !== city.toLowerCase() ? [locality, city] : [city ?? locality];
  if (!names[0]) return null;
  const state =
    body.countryCode === "US" && typeof body.principalSubdivisionCode === "string"
      ? /^US-([A-Z]{2})$/.exec(body.principalSubdivisionCode)?.[1]
      : null;
  return [...names, ...(state ? [state] : [])].join(", ");
}

/**
 * The place name for a device position, or null when the call fails, is slow
 * (past `timeoutMs`), is blocked, or answers with nothing usable. Never throws.
 */
export async function lookupPlace(lat, lng, { fetchImpl = globalThis.fetch, timeoutMs = REVERSE_GEOCODE_TIMEOUT_MS } = {}) {
  const url = reverseGeocodeUrl(lat, lng);
  if (!url || typeof fetchImpl !== "function") return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetchImpl(url, {
      signal: ctrl.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return null;
    return placeFromReverse(await r.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** "Sunrise, FL" for the connection-based answer: the city and state from /api/geo, or null without a city. */
export function approxPlace(city, region) {
  const c = name(city);
  if (!c) return null;
  const st = typeof region === "string" && /^[A-Z]{2}$/.test(region) ? region : null;
  return st ? `${c}, ${st}` : c;
}
