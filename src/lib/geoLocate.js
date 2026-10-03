// Where is the visitor? For the /local-delivery zone check
// (src/pages/shipping/LocalDeliveryPage.jsx), in two steps:
//   1. approximate, with no prompt: GET /api/geo reads Vercel's IP headers
//      (api/geo.js) and we use a U.S. ZIP, or U.S. coordinates;
//   2. precise, from the Geolocation API, which the browser asks about.
// Every browser dependency is passed in, so the logic runs under node --test.

import { zip5 } from "../data/serviceArea.js";

export const GEO_URL = "/api/geo";
export const GEO_TIMEOUT_MS = 3000;
/** Coarse and cached is plenty for "within 40 miles of a hub?", and fast on phones. */
export const POSITION_OPTIONS = { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 };

const DENIED_KEY = "td-geo-denied";

const isLatLng = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

/**
 * What the page can use from an /api/geo body: { zip, city } for a U.S.
 * ZIP, else { lat, lng, city } for U.S. coordinates, else null (outside the
 * U.S., unavailable, or anything malformed).
 */
export function approxFromGeo(body) {
  // `available` is only ever false (api/geo.js); a U.S. country is the test.
  if (!body || typeof body !== "object" || body.available === false || body.country !== "US") return null;
  const city =
    typeof body.city === "string" && body.city.length > 0 && body.city.length <= 64
      ? body.city
      : null;
  const zip = typeof body.zip === "string" ? zip5(body.zip) : null;
  if (zip) return { zip, city };
  if (isLatLng(body.lat, body.lng)) return { lat: body.lat, lng: body.lng, city };
  return null;
}

/**
 * approxFromGeo() of GET /api/geo, or null when it fails, is slow (past
 * `timeoutMs`), or answers with something that isn't our JSON (local
 * previews serve no /api at all).
 */
export async function fetchApproxLocation({ fetchImpl = globalThis.fetch, timeoutMs = GEO_TIMEOUT_MS } = {}) {
  if (typeof fetchImpl !== "function") return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetchImpl(GEO_URL, {
      signal: ctrl.signal,
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return null;
    return approxFromGeo(await r.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * "granted", "prompt" or "denied" for geolocation. iOS Safari before 16 has
 * no Permissions API, and some browsers throw for this name: both count as
 * "prompt", so the browser itself decides whether to ask.
 */
export async function geoPermissionState(nav) {
  try {
    const status = await nav.permissions.query({ name: "geolocation" });
    return ["granted", "prompt", "denied"].includes(status?.state) ? status.state : "prompt";
  } catch {
    return "prompt";
  }
}

/** Loosely: iPhone, iPod or iPad (iPadOS says "Macintosh" but has touch). */
export function looksLikeIOS(nav) {
  const ua = String(nav?.userAgent ?? "");
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && (nav?.maxTouchPoints ?? 0) > 1);
}

// sessionStorage can be missing or throw (private modes, blocked storage);
// then we simply don't remember, which only costs a repeat prompt.
export function deniedThisSession(win) {
  try {
    return win.sessionStorage.getItem(DENIED_KEY) === "1";
  } catch {
    return false;
  }
}

export function rememberDenied(win) {
  try {
    win.sessionStorage.setItem(DENIED_KEY, "1");
  } catch {
    /* not remembered: see above */
  }
}
