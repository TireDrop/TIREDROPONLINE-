// GET /api/geo: approximate visitor location from Vercel's IP-geolocation
// request headers, for the /local-delivery zone check on page load.
//
// Not its own function: the Hobby plan allows 12 per deployment and api/
// already has 12, so vercel.json rewrites /api/geo to /api/status?geo=1 and
// api/status.js hands the request to geoHandler() below.
//
// Vercel adds these to every request it routes to a function:
//   x-vercel-ip-country      ISO 3166-1 alpha-2, e.g. "US"
//   x-vercel-ip-postal-code  e.g. "33351"
//   x-vercel-ip-latitude     e.g. "26.1650"
//   x-vercel-ip-longitude    e.g. "-80.2690"
//   x-vercel-ip-city         URL-encoded, e.g. "Fort%20Lauderdale"
// Locally (vite preview, node --test) none are set, so the answer is
// { available: false }. Nothing here logs or keeps the values.

import { zip5 } from "../../src/data/serviceArea.js";
import { send } from "./http.js";

const NUMBER = /^-?\d{1,3}(?:\.\d{1,8})?$/;
// Letters (any script), spaces and the punctuation real place names use.
const CITY = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]{0,63}$/u;

function header(headers, name) {
  const value = headers?.[name];
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" ? first.trim() : "";
}

function coordinate(raw, limit) {
  if (!NUMBER.test(raw)) return null;
  const n = Number(raw);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
}

function city(raw) {
  if (!raw) return null;
  let decoded;
  try {
    decoded = decodeURIComponent(raw.replace(/\+/g, " ")).trim();
  } catch {
    return null; // malformed %-escape
  }
  return CITY.test(decoded) ? decoded : null;
}

/**
 * { available: true, country, zip, lat, lng, city } from the request
 * headers, or { available: false } when there is no usable country.
 * Every field is validated: anything malformed becomes null rather than
 * reaching the browser. lat and lng come as a pair or not at all, and
 * (0, 0), Vercel's "unknown", counts as not at all.
 */
export function parseGeoHeaders(headers) {
  const country = header(headers, "x-vercel-ip-country").toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) return { available: false };

  let lat = coordinate(header(headers, "x-vercel-ip-latitude"), 90);
  let lng = coordinate(header(headers, "x-vercel-ip-longitude"), 180);
  if (lat === null || lng === null || (lat === 0 && lng === 0)) lat = lng = null;

  return {
    available: true,
    country,
    // A 5-digit ZIP only means something for the U.S.
    zip: country === "US" ? zip5(header(headers, "x-vercel-ip-postal-code")) : null,
    lat,
    lng,
    city: city(header(headers, "x-vercel-ip-city")),
  };
}

/**
 * The /api/geo response. Private and uncached: it is about this one
 * visitor, so no shared cache may keep it. Nothing is logged or stored, and
 * the IP itself is never read.
 */
export function geoHandler(req, res) {
  return send(res, 200, parseGeoHeaders(req.headers), {
    "Cache-Control": "private, no-store",
  });
}
