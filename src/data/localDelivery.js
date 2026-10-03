// Local delivery zones around our distribution partner's hubs (/local-delivery).
//
// Not live yet: the partner has not confirmed the radius, consumer delivery or
// a start date (docs/integrations/atd.md, "Still unconfirmed"). Until it does,
// this only answers "is my ZIP near a hub?"; checkout never reads it.
//
// The data comes from `npm run build:hubs` (scripts/build-delivery-hubs.mjs):
//   src/data/deliveryHubs.source.json     the hub list, for code only, never
//                                         rendered as text
//   src/data/deliveryHubs.generated.json  the map: viewBox, paths, projected hubs
//   public/data/local-delivery-zips.json  ZIPs within the radius, fetched only
//                                         when someone checks a ZIP
//   public/data/local-delivery-areas.json ZIP-prefix centroids for the map's
//                                         area zoom (see the bottom of this
//                                         file), fetched with the ZIPs
//
// Plain JavaScript with no browser imports, so the build script and the tests
// run it under Node.

import { zip5 } from "./serviceArea.js";

/** Miles from a hub that count as in zone. Placeholder until the partner confirms the radius. */
export const LOCAL_DELIVERY_RADIUS_MILES = 40;

/** Where the page fetches the zone ZIPs from (public/data/…). */
export const LOCAL_DELIVERY_ZIPS_URL = "/data/local-delivery-zips.json";

const EARTH_RADIUS_MILES = 3958.8;
const rad = (deg) => (deg * Math.PI) / 180;

const isLatLng = (lat, lng) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180;

/** Great-circle (haversine) distance in miles between two lat/lng points. */
export function milesBetween(lat1, lng1, lat2, lng2) {
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Miles from (lat, lng) to the nearest hub in `hubs` ([{ lat, lng }]), or
 * Infinity when the point is not a valid coordinate or there are no hubs.
 */
export function nearestHubMiles(lat, lng, hubs) {
  if (!isLatLng(lat, lng) || !Array.isArray(hubs)) return Infinity;
  let best = Infinity;
  for (const h of hubs) {
    if (!isLatLng(h?.lat, h?.lng)) continue;
    best = Math.min(best, milesBetween(lat, lng, h.lat, h.lng));
  }
  return best;
}

/** True when (lat, lng) is within `radius` miles of any hub. */
export function inZoneByCoords(
  lat,
  lng,
  hubs,
  radius = LOCAL_DELIVERY_RADIUS_MILES,
) {
  return nearestHubMiles(lat, lng, hubs) <= radius;
}

/**
 * Packs 5-digit ZIPs as { "<3-digit prefix>": "<2-digit suffixes, joined>" },
 * e.g. ["85004", "85006"] -> { "850": "0406" }. Sorted, deduplicated.
 */
export function packZips(zips) {
  const groups = {};
  for (const z of [...new Set(zips.map(zip5).filter(Boolean))].sort()) {
    const p = z.slice(0, 3);
    groups[p] = (groups[p] ?? "") + z.slice(3);
  }
  return groups;
}

/**
 * True when `zip` is in the packed zone file ({ zips: packZips(...) }).
 * Accepts the same shapes as zip5(): "85004", "85004-1234". Anything
 * unreadable (bad ZIP, missing or malformed data) is false: out of zone.
 */
export function isZipInZone(zip, zoneData) {
  const z = zip5(zip);
  const packed = zoneData?.zips?.[z?.slice(0, 3)];
  if (!z || typeof packed !== "string") return false;
  const suffix = z.slice(3);
  // Step two characters at a time: a plain includes() would match across
  // neighbours ("0406" contains "40").
  for (let i = 0; i + 2 <= packed.length; i += 2) {
    if (packed.slice(i, i + 2) === suffix) return true;
  }
  return false;
}

/* ------------------------- the area zoom (page map) ------------------------- */

/** ZIP-prefix centroids for the map's area zoom, fetched only when a ZIP is checked (public/data/…). */
export const LOCAL_DELIVERY_AREAS_URL = "/data/local-delivery-areas.json";

/**
 * Lower-48 Albers projection, the same one `npm run build:hubs` draws the map
 * and hubs with (d3 geoAlbersUsa, lower 48: parallels 29.5 and 45.5, rotate
 * 96, center -0.6/38.7, scale 1300, translate 487.5/305), written out so the
 * page can place a device position without shipping d3. The test projects
 * every hub with it and compares the map x/y the build stored.
 * Returns [x, y] in map units, or null for a point that is not a coordinate.
 */
const ALBERS = (() => {
  const s0 = Math.sin(rad(29.5));
  const n = (s0 + Math.sin(rad(45.5))) / 2;
  const c = 1 + s0 * (2 * n - s0);
  const raw = (lng, lat) => {
    const r = Math.sqrt(c - 2 * n * Math.sin(rad(lat))) / n;
    const t = rad(lng + 96) * n;
    return [r * Math.sin(t), Math.sqrt(c) / n - r * Math.cos(t)];
  };
  const [cx, cy] = raw(-0.6 - 96, 38.7);
  return (lng, lat) => {
    const [x, y] = raw(lng, lat);
    return [487.5 + 1300 * (x - cx), 305 - 1300 * (y - cy)];
  };
})();

export function projectLower48(lat, lng) {
  if (!isLatLng(lat, lng)) return null;
  const [x, y] = ALBERS(lng, lat);
  return [+x.toFixed(1), +y.toFixed(1)];
}

/** Map is 975 x 610 units; the contiguous states sit well inside it. */
const onMap = (x, y) => x >= 0 && x <= 975 && y >= 0 && y <= 610;

/** Contiguous states only: the zoom has nothing to show for Alaska, Hawaii or the territories. */
export const isContiguous = (lat, lng) =>
  isLatLng(lat, lng) && lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66;

/**
 * Index of the hub nearest (lat, lng), or -1 for a bad point or no hubs. A
 * simulated truck is sent to this hub's zone.
 */
export function nearestHubIndex(lat, lng, hubs) {
  if (!isLatLng(lat, lng) || !Array.isArray(hubs)) return -1;
  let best = -1;
  let bestMiles = Infinity;
  hubs.forEach((h, i) => {
    if (!isLatLng(h?.lat, h?.lng)) return;
    const d = milesBetween(lat, lng, h.lat, h.lng);
    if (d < bestMiles) {
      bestMiles = d;
      best = i;
    }
  });
  return best;
}

/**
 * "About N miles to the nearest zone": the distance past the zone edge,
 * rounded to the nearest 5 and never under 5 (an answer of "0 miles away"
 * would contradict "not in a zone"). `hubMiles` is the distance to the
 * nearest hub.
 */
export function zoneGapMiles(hubMiles, radius = LOCAL_DELIVERY_RADIUS_MILES) {
  if (!Number.isFinite(hubMiles)) return null;
  return Math.max(5, Math.round((hubMiles - radius) / 5) * 5);
}

/**
 * Packs { prefix, x, y, hub, gap } rows as "ppp:x:y:hub:gap;" (map units, hub
 * index into the hub list, gap in steps of 5 miles). Each row is the average
 * of the ZIPs sharing a 3-digit prefix, so it names an area, never an address.
 */
export function packAreas(rows) {
  return rows
    .map((r) => `${r.prefix}:${r.x.toFixed(1)}:${r.y.toFixed(1)}:${r.hub}:${Math.round(r.gap / 5)};`)
    .join("");
}

/**
 * Looks one ZIP's prefix up in the packed areas ({ areas: packAreas(...) }).
 * Returns { x, y, hub, gap } (gap in miles) or null: a bad ZIP, a prefix
 * outside the contiguous states, or missing or malformed data. Scans the
 * string rather than building a table, so a visit that checks one ZIP pays
 * for one pass.
 */
export function areaForZip(zip, areaData) {
  const z = zip5(zip);
  const packed = areaData?.areas;
  if (!z || typeof packed !== "string") return null;
  // Rows start after a ";" (or at the very start), so match ";ppp:" in a copy with a leading one.
  const from = `;${packed}`.indexOf(`;${z.slice(0, 3)}:`);
  if (from < 0) return null;
  const row = packed.slice(from, packed.indexOf(";", from) + 1 || undefined);
  const [x, y, hub, gap] = row.replace(/;$/, "").split(":").slice(1).map(Number);
  if (![x, y, hub, gap].every(Number.isFinite) || !onMap(x, y)) return null;
  return { x, y, hub, gap: gap * 5 };
}
