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
