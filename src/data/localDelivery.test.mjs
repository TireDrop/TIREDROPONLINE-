// Local delivery zones: the pure rules in localDelivery.js, the data that
// `npm run build:hubs` generates, and the /local-delivery page's wiring and
// copy rules (no partner name, no hub places, no dates, speeds or fees).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

import {
  LOCAL_DELIVERY_AREAS_URL,
  LOCAL_DELIVERY_RADIUS_MILES,
  LOCAL_DELIVERY_ZIPS_URL,
  areaForZip,
  inZoneByCoords,
  isContiguous,
  isZipInZone,
  milesBetween,
  nearestHubIndex,
  nearestHubMiles,
  packAreas,
  packZips,
  projectLower48,
  zoneGapMiles,
} from "./localDelivery.js";
import { FOOTER_COLUMNS } from "./business.js";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const SOURCE = JSON.parse(read("./deliveryHubs.source.json"));
const GENERATED = JSON.parse(read("./deliveryHubs.generated.json"));
const ZIPS_RAW = read("../../public/data/local-delivery-zips.json");
const ZONES = JSON.parse(ZIPS_RAW);
const AREAS_RAW = read("../../public/data/local-delivery-areas.json");
const AREAS = JSON.parse(AREAS_RAW);
const TRUCKS = read("../components/delivery/deliveryTrucks.js");
const PAGE = read("../pages/shipping/LocalDeliveryPage.jsx");
const APP = read("../App.jsx");
const SHIPPING = read("../pages/ShippingPage.jsx");
// The page minus its code comments: what can reach a visitor.
const COPY = PAGE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/* ------------------------------- pure rules ------------------------------- */

test("radius is a named 40-mile placeholder", () => {
  assert.equal(LOCAL_DELIVERY_RADIUS_MILES, 40);
  assert.match(read("./localDelivery.js"), /placeholder until the partner confirms the radius/i);
});

test("milesBetween: haversine, in miles", () => {
  assert.equal(milesBetween(33.45, -112.07, 33.45, -112.07), 0);
  // One degree of latitude is about 69 miles.
  assert.ok(Math.abs(milesBetween(30, -90, 31, -90) - 69.1) < 0.2);
  // Phoenix to Tucson is about 107 miles in a straight line.
  const d = milesBetween(33.4484, -112.074, 32.2226, -110.9747);
  assert.ok(d > 100 && d < 112, `got ${d}`);
});

test("nearestHubMiles: nearest valid hub, Infinity when there is none", () => {
  const hubs = [
    { lat: 33.4484, lng: -112.074 },
    { lat: 32.2226, lng: -110.9747 },
    { lat: "x", lng: null },
  ];
  assert.ok(nearestHubMiles(32.25, -110.98, hubs) < 3);
  assert.equal(nearestHubMiles(32.25, -110.98, []), Infinity);
  assert.equal(nearestHubMiles(32.25, -110.98, null), Infinity);
  assert.equal(nearestHubMiles(NaN, -110.98, hubs), Infinity);
  assert.equal(nearestHubMiles(95, -110.98, hubs), Infinity);
});

test("inZoneByCoords: inside the radius only", () => {
  const hubs = [{ lat: 30, lng: -90 }];
  assert.equal(inZoneByCoords(30.5, -90, hubs), true); // ~35 mi
  assert.equal(inZoneByCoords(30.6, -90, hubs), false); // ~41 mi
  assert.equal(inZoneByCoords(30.6, -90, hubs, 50), true);
  assert.equal(inZoneByCoords(30.5, -90, []), false);
});

test("packZips and isZipInZone round-trip; suffixes never match across neighbours", () => {
  const zones = { zips: packZips(["85004", "85006", "85006", "33351-1234", "bad"]) };
  assert.deepEqual(zones.zips, { 333: "51", 850: "0406" });
  assert.equal(isZipInZone("85004", zones), true);
  assert.equal(isZipInZone(" 85006-0001 ", zones), true);
  assert.equal(isZipInZone("333511234", zones), true);
  // "0406" contains "40", but 85040 is not in the list.
  assert.equal(isZipInZone("85040", zones), false);
  assert.equal(isZipInZone("85005", zones), false);
  assert.equal(isZipInZone("8500", zones), false);
  assert.equal(isZipInZone("", zones), false);
  assert.equal(isZipInZone(null, zones), false);
  assert.equal(isZipInZone("85004", null), false);
  assert.equal(isZipInZone("85004", { zips: { 850: 404 } }), false);
});

/* ----------------------------- generated data ----------------------------- */

test("source hubs: city, state, lat, lng only", () => {
  assert.ok(SOURCE.length > 0);
  for (const h of SOURCE) {
    assert.deepEqual(Object.keys(h), ["city", "state", "lat", "lng"]);
    assert.match(h.state, /^[A-Z]{2}$/);
    assert.ok(Number.isFinite(h.lat) && Number.isFinite(h.lng), h.city);
  }
});

test("generated map matches the source and carries no place names", () => {
  assert.equal(GENERATED.hubs.length, SOURCE.length, "rerun npm run build:hubs");
  assert.equal(GENERATED.viewBox, "0 0 975 610");
  assert.equal(GENERATED.radiusMiles, LOCAL_DELIVERY_RADIUS_MILES, "rerun npm run build:hubs");
  GENERATED.hubs.forEach((h, i) => {
    assert.deepEqual(Object.keys(h), ["x", "y", "lat", "lng"]);
    assert.ok(h.x >= 0 && h.x <= 975 && h.y >= 0 && h.y <= 610);
    assert.equal(h.lat, SOURCE[i].lat);
  });
  const text = JSON.stringify(GENERATED);
  for (const { city } of SOURCE) assert.ok(!text.includes(`"${city}`), city);
  assert.match(GENERATED.land, /^M[\d.,LZM-]+$/);
});

test("zone ZIPs: within budget, and the known fixtures", () => {
  assert.equal(ZONES.radiusMiles, LOCAL_DELIVERY_RADIUS_MILES, "rerun npm run build:hubs");
  assert.ok(gzipSync(ZIPS_RAW).length <= 80 * 1024, "over 80 KB gzipped");
  for (const [p, s] of Object.entries(ZONES.zips)) {
    assert.match(p, /^\d{3}$/);
    assert.match(s, /^(\d{2})+$/);
  }
  const count = Object.values(ZONES.zips).reduce((n, s) => n + s.length / 2, 0);
  assert.equal(count, ZONES.count);
  // Cross-checked against the coordinator's independent run of the same list.
  for (const zip of ["33351", "33139", "32801", "10001"])
    assert.equal(isZipInZone(zip, ZONES), true, zip);
  assert.equal(isZipInZone("59801", ZONES), false, "59801 (Missoula)");
  // Every hub's own position is in zone by coordinates.
  for (const h of SOURCE) assert.ok(inZoneByCoords(h.lat, h.lng, SOURCE), h.city);
  assert.equal(LOCAL_DELIVERY_ZIPS_URL, "/data/local-delivery-zips.json");
});

/* --------------------------------- page --------------------------------- */

test("page: routed, linked from /shipping and the footer", () => {
  assert.match(APP, /path="\/local-delivery" element=\{<LocalDeliveryPage \/>\}/);
  assert.match(SHIPPING, /to="\/local-delivery"/);
  const ship = FOOTER_COLUMNS.find((c) => c.title === "Shipping & Install");
  assert.ok(ship.links.some((l) => l.to === "/local-delivery"));
  assert.match(PAGE, /to="\/tires"/);
  assert.match(PAGE, /to="\/shipping"/);
});

test("page: the map has one text alternative and decorative icons", () => {
  assert.match(PAGE, /`Map of the U\.S\. showing \$\{MAP\.hubs\.length\} local delivery hubs`/);
  assert.match(PAGE, /role="img"\s+aria-label=\{MAP_LABEL\}/);
  assert.equal((PAGE.match(/<g aria-hidden="true">/g) ?? []).length, 2);
  // The page never imports the named hub list.
  assert.doesNotMatch(PAGE, /from "[^"]*deliveryHubs\.source/);
});

test("page copy: no partner, no places, no dates, speeds, fees or phone", () => {
  const banned = [
    /\bATD\b/, /American Tire/i, /AutoForce/i, /distributors?\b(?! warehouse)/i,
    /same[- ]day/i, /next[- ]day/i, /overnight/i, /\b\d+\s*(hours?|days?|weeks?)\b/i,
    /\bfees?\b/i, /\$\d/, /\(\d{3}\)\s*\d{3}-\d{4}/, /BUSINESS\.phone/,
    /\b(19|20)\d{2}\b/, /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/,
    /safe to drive/i, /discount|coupon|rebate|deal\b/i,
  ];
  for (const re of banned) assert.doesNotMatch(COPY, re, String(re));
  for (const { city } of SOURCE) assert.ok(!COPY.includes(city), city);
  assert.match(PAGE, /rolling out/i);
  assert.match(
    PAGE,
    /You're in a local delivery zone\. Local delivery is rolling out; order now and we ship free while it launches\./,
  );
});

/* ----------------------------- the area zoom ----------------------------- */

test("zoneGapMiles: past the zone edge, to the nearest 5, never under 5", () => {
  assert.equal(zoneGapMiles(40.1), 5); // "0 miles away" would contradict "not in a zone"
  assert.equal(zoneGapMiles(52), 10); // 12 rounds down to 10
  assert.equal(zoneGapMiles(53), 15); // 13 rounds up to 15
  assert.equal(zoneGapMiles(58), 20);
  assert.equal(zoneGapMiles(240.4), 200);
  assert.equal(zoneGapMiles(90, 50), 40);
  assert.equal(zoneGapMiles(Infinity), null); // no valid hub to measure to
  assert.equal(zoneGapMiles(Number.NaN), null);
});

test("nearestHubIndex: the closest hub, -1 for bad input", () => {
  const hubs = [{ lat: 33.45, lng: -112.07 }, { lat: 25.77, lng: -80.19 }, { lat: Number.NaN, lng: 0 }];
  assert.equal(nearestHubIndex(26, -80, hubs), 1);
  assert.equal(nearestHubIndex(33, -111, hubs), 0);
  assert.equal(nearestHubIndex(Number.NaN, 0, hubs), -1);
  assert.equal(nearestHubIndex(33, -111, []), -1);
  assert.equal(nearestHubIndex(33, -111, null), -1);
});

test("projectLower48 reproduces the build's map position for every hub", () => {
  for (const h of GENERATED.hubs) {
    const [x, y] = projectLower48(h.lat, h.lng);
    assert.ok(Math.abs(x - h.x) <= 0.2 && Math.abs(y - h.y) <= 0.2, `${h.x},${h.y} vs ${x},${y}`);
  }
  assert.equal(projectLower48(Number.NaN, -100), null);
  assert.equal(projectLower48(95, -100), null);
});

test("isContiguous: the lower 48 only", () => {
  assert.ok(isContiguous(26.12, -80.25)); // South Florida
  assert.ok(isContiguous(47.6, -122.3)); // Seattle
  assert.ok(!isContiguous(61.2, -149.9)); // Anchorage
  assert.ok(!isContiguous(21.3, -157.8)); // Honolulu
  assert.ok(!isContiguous(18.4, -66.1)); // San Juan
});

test("packAreas and areaForZip round-trip, by prefix", () => {
  const packed = packAreas([
    { prefix: "333", x: 700.12, y: 500.5, hub: 3, gap: 12 },
    { prefix: "334", x: 1, y: 2, hub: 104, gap: 5 },
  ]);
  assert.equal(packed, "333:700.1:500.5:3:2;334:1.0:2.0:104:1;");
  assert.deepEqual(areaForZip("33351", { areas: packed }), { x: 700.1, y: 500.5, hub: 3, gap: 10 });
  assert.deepEqual(areaForZip("33401-1234", { areas: packed }), { x: 1, y: 2, hub: 104, gap: 5 });
  for (const bad of ["33501", "99999", "123", "", null, undefined]) assert.equal(areaForZip(bad, { areas: packed }), null, String(bad));
  assert.equal(areaForZip("33351", null), null);
  assert.equal(areaForZip("33351", { areas: 5 }), null);
  assert.equal(areaForZip("33351", { areas: "333:oops;" }), null);
  // A prefix is matched whole: "33" never matches "333".
  assert.equal(areaForZip("33301", { areas: "233:1:1:0:1;" }), null);
});

test("areas file: contiguous prefixes only, area-sized, inside the map and the hub list", () => {
  assert.equal(AREAS.radiusMiles, LOCAL_DELIVERY_RADIUS_MILES);
  assert.equal(LOCAL_DELIVERY_AREAS_URL, "/data/local-delivery-areas.json");
  assert.ok(AREAS_RAW.length < 22 * 1024, `${AREAS_RAW.length} bytes`);
  assert.ok(gzipSync(AREAS_RAW).length < 10 * 1024);
  const rows = AREAS.areas.split(";").filter(Boolean);
  assert.equal(rows.length, AREAS.count);
  for (const row of rows) {
    assert.match(row, /^\d{3}:\d+\.\d:\d+\.\d:\d+:\d+$/);
    const [prefix, x, y, hub, gap] = row.split(":");
    assert.ok(+x >= 0 && +x <= 975 && +y >= 0 && +y <= 610, row);
    assert.ok(+hub < GENERATED.hubs.length, row);
    assert.ok(+gap >= 1, row);
    // Not Alaska (995-999), Hawaii (967-968) or the territories (006-009, 969).
    assert.ok(!/^(99[5-9]|96[789]|00[6-9])/.test(prefix), prefix);
  }
  // Nothing finer than a 3-digit prefix: no 5-digit ZIP appears anywhere in it.
  assert.doesNotMatch(AREAS_RAW, /\d{5}/);
});

test("areas file agrees with the zone ZIPs: in-zone ZIPs land inside their hub's halo", () => {
  for (const zip of ["33351", "10001", "90001", "60601", "30301"]) {
    const area = areaForZip(zip, AREAS);
    assert.ok(area, zip);
    assert.equal(isZipInZone(zip, ZONES), true, zip);
    const hub = GENERATED.hubs[area.hub];
    assert.ok(Math.hypot(area.x - hub.x, area.y - hub.y) <= GENERATED.haloRadius * 1.6, zip);
  }
  // Missoula is nowhere near a hub: a real distance, not a clamp.
  const far = areaForZip("59801", AREAS);
  assert.equal(isZipInZone("59801", ZONES), false);
  assert.ok(far.gap >= 10 && far.gap % 5 === 0, JSON.stringify(far));
  for (const zip of ["99501", "96801", "00601", "99999"]) assert.equal(areaForZip(zip, AREAS), null, zip);
});

test("live layer: no hub names, no partner, no dates, speeds or fees in what it says", () => {
  const code = TRUCKS.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  for (const { city } of SOURCE) assert.ok(!code.includes(city), city);
  assert.doesNotMatch(AREAS_RAW, new RegExp(SOURCE.map((h) => h.city).join("|")));
  for (const re of [/\bATD\b/, /American Tire/i, /same[- ]day/i, /next[- ]day/i, /\bfees?\b/i, /\$\d/, /safe to drive/i]) {
    assert.doesNotMatch(code, re, String(re));
  }
  assert.match(code, /Simulated\. Not live tracking\./);
  assert.match(code, /Animation is off because your device asks for reduced motion\./);
  assert.match(code, /Delivery hub \$\{i \+ 1\} of \$\{N\}/);
});

test("page: the truck layer is a lazy import, after idle, and the page never imports it statically", () => {
  assert.match(PAGE, /import\("\.\.\/\.\.\/components\/delivery\/deliveryTrucks\.js"\)/);
  assert.doesNotMatch(PAGE, /^import .*deliveryTrucks/m);
  assert.doesNotMatch(PAGE, /^import .*deliverySim/m);
  assert.match(PAGE, /requestIdleCallback/);
  // The home page card stays static: it must not know about trucks or the zoom.
  const HOME = read("../pages/HomePage.jsx");
  assert.doesNotMatch(HOME, /deliveryTrucks|deliverySim|local-delivery-areas/);
});
