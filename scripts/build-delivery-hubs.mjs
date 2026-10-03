/**
 * Builds the /local-delivery map and zone data from the hub list.
 *
 *   npm run build:hubs                         rebuild from the current list
 *   npm run build:hubs -- --from hubs.json     replace the list, then rebuild
 *
 * Input: src/data/deliveryHubs.source.json, [{ city, state, lat, lng }]. A hub
 * with no lat/lng gets the mean of its city's ZIP centroids (the "zipcodes"
 * package) and the file is written back, so a new list can be just
 * [{ city, state }]. `--from` takes the same shape (or { hubs: [...] }).
 * The city names stay in that file: code only, never rendered as text.
 *
 * Output (committed, so the normal build never runs this or needs the
 * devDependencies it uses):
 *   src/data/deliveryHubs.generated.json  { viewBox, land, borders,
 *     haloRadius, hubs: [{ x, y, lat, lng }] }. Land and borders are from
 *     us-atlas states-albers-10m (already projected), and the hubs go through
 *     the same projection: geoAlbersUsa().scale(1300).translate([487.5, 305]).
 *   src/data/deliveryHubsMini.generated.json  { viewBox, land, hubs: [[x, y]] }:
 *     a coarse copy for the home page teaser, no coordinates.
 *   public/data/local-delivery-zips.json  { radiusMiles, count, zips }: every
 *     US 5-digit ZIP whose centroid is within LOCAL_DELIVERY_RADIUS_MILES of a
 *     hub, packed by 3-digit prefix (packZips in src/data/localDelivery.js).
 *   public/data/local-delivery-areas.json  { radiusMiles, count, areas }: one
 *     row per 3-digit ZIP prefix in the contiguous states (the average of its
 *     ZIPs, so an area and never an address): map x/y, the nearest hub's
 *     index in the list above, and the miles from the zone edge in steps of
 *     5 (packAreas). The page fetches it only after a ZIP is checked, to zoom
 *     the map to that area. A prefix with ZIPs in a zone is centred on those,
 *     so an in-zone answer lands inside the zone.
 *
 * Not part of `npm run build`.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { geoAlbersUsa, geoPath, geoTransform } from "d3-geo";
import { feature, mesh } from "topojson-client";

import {
  LOCAL_DELIVERY_RADIUS_MILES,
  inZoneByCoords,
  isContiguous,
  milesBetween,
  nearestHubIndex,
  packAreas,
  packZips,
  zoneGapMiles,
} from "../src/data/localDelivery.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const zipcodes = require("zipcodes");

const SOURCE = resolve(ROOT, "src/data/deliveryHubs.source.json");
const GENERATED = resolve(ROOT, "src/data/deliveryHubs.generated.json");
const MINI = resolve(ROOT, "src/data/deliveryHubsMini.generated.json");
const ZIPS_OUT = resolve(ROOT, "public/data/local-delivery-zips.json");
const AREAS_OUT = resolve(ROOT, "public/data/local-delivery-areas.json");

const fail = (msg) => {
  console.error(`build:hubs: ${msg}`);
  process.exit(1);
};

/* ------------------------------ the hub list ------------------------------ */

const fromIdx = process.argv.indexOf("--from");
let raw;
try {
  raw = JSON.parse(
    readFileSync(fromIdx > -1 ? resolve(process.argv[fromIdx + 1]) : SOURCE, "utf8"),
  );
} catch (e) {
  fail(`cannot read the hub list: ${e.message}`);
}
const list = Array.isArray(raw) ? raw : raw?.hubs;
if (!Array.isArray(list) || list.length === 0) fail("the hub list is empty");

const cityCentroid = (city, state) => {
  const hits = zipcodes
    .lookupByName(city, state)
    .filter((z) => z.country === "US" && Number.isFinite(z.latitude));
  if (!hits.length) return null;
  const mean = (k) => hits.reduce((s, z) => s + z[k], 0) / hits.length;
  return { lat: +mean("latitude").toFixed(4), lng: +mean("longitude").toFixed(4) };
};

const hubs = list.map((h, i) => {
  const city = String(h?.city ?? "").trim();
  const state = String(h?.state ?? "").trim().toUpperCase();
  let lat = Number(h?.lat ?? h?.latitude);
  let lng = Number(h?.lng ?? h?.lon ?? h?.longitude);
  if (h?.lat == null || h?.lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    const c = city && state ? cityCentroid(city, state) : null;
    if (!c) fail(`hub ${i + 1} (${city || "?"}, ${state || "?"}) has no lat/lng and no ZIP match`);
    ({ lat, lng } = c);
  }
  return { city, state, lat, lng };
});

/* -------------------------------- the map -------------------------------- */

const atlas = JSON.parse(
  readFileSync(require.resolve("us-atlas/states-albers-10m.json"), "utf8"),
);
const projection = geoAlbersUsa().scale(1300).translate([487.5, 305]);

// Drops points closer than MIN_STEP to the last one kept. The atlas is drawn
// for a 975-wide canvas; at the page's widest that is about one CSS pixel, so
// the outline looks the same at a fraction of the bytes.
const MIN_STEP = 2;
const thinner = (minStep) =>
  geoTransform({
    lineStart() {
      this.last = null;
      this.stream.lineStart();
    },
    point(x, y) {
      if (this.last && Math.hypot(x - this.last[0], y - this.last[1]) < minStep) return;
      this.last = [x, y];
      this.stream.point(x, y);
    },
  });
const path = geoPath(thinner(MIN_STEP)).digits(0);

// Islets under MIN_ISLAND map units across are dropped: invisible at phone
// width, and the Aleutians and the Maine coast alone are a third of the bytes.
const MIN_ISLAND = 4;
const dropIslets = (d, minIsland = MIN_ISLAND) =>
  d
    .split(/(?=M)/)
    .filter((sub) => {
      const n = sub.match(/-?\d+(?:\.\d+)?/g).map(Number);
      const xs = n.filter((_, i) => i % 2 === 0);
      const ys = n.filter((_, i) => i % 2 === 1);
      return Math.max(...xs) - Math.min(...xs) + Math.max(...ys) - Math.min(...ys) >= minIsland;
    })
    .join("");
const land = dropIslets(path(feature(atlas, atlas.objects.nation)));
const borders = path(mesh(atlas, atlas.objects.states, (a, b) => a !== b));

// The zone halo, in map units: LOCAL_DELIVERY_RADIUS_MILES north of each hub,
// averaged. Only a picture; the ZIP list decides who is in a zone.
const MILES_PER_DEG_LAT = 69.05;
const projected = hubs.map((h) => {
  const p = projection([h.lng, h.lat]);
  if (!p) fail(`${h.city}, ${h.state} is outside the map projection`);
  const q = projection([h.lng, h.lat + LOCAL_DELIVERY_RADIUS_MILES / MILES_PER_DEG_LAT]);
  return { x: +p[0].toFixed(1), y: +p[1].toFixed(1), lat: h.lat, lng: h.lng, r: Math.hypot(q[0] - p[0], q[1] - p[1]) };
});
const haloRadius = +(projected.reduce((s, h) => s + h.r, 0) / projected.length).toFixed(1);

const generated = {
  "//": "Generated by `npm run build:hubs` (scripts/build-delivery-hubs.mjs). Do not edit.",
  viewBox: "0 0 975 610",
  radiusMiles: LOCAL_DELIVERY_RADIUS_MILES,
  haloRadius,
  hubs: projected.map(({ x, y, lat, lng }) => ({ x, y, lat, lng })),
  land,
  borders,
};

// The home page teaser (HomeLocalDelivery in src/pages/HomePage.jsx): the
// same map drawn about 300px wide, so a much coarser outline and whole-unit
// hub positions, with no borders, no coordinates and no halos. A few KB in
// the home page's HTML instead of the full map's 30+.
const MINI_STEP = 9;
const MINI_ISLAND = 24;
const mini = {
  "//": generated["//"],
  viewBox: generated.viewBox,
  land: dropIslets(geoPath(thinner(MINI_STEP)).digits(0)(feature(atlas, atlas.objects.nation)), MINI_ISLAND),
  hubs: projected.map(({ x, y }) => [Math.round(x), Math.round(y)]),
};

/* -------------------------------- the ZIPs -------------------------------- */

const inZone = Object.values(zipcodes.codes)
  .filter(
    (z) =>
      z.country === "US" &&
      /^\d{5}$/.test(z.zip) &&
      inZoneByCoords(z.latitude, z.longitude, hubs, LOCAL_DELIVERY_RADIUS_MILES),
  )
  .map((z) => z.zip);
const zipsJson = JSON.stringify({
  radiusMiles: LOCAL_DELIVERY_RADIUS_MILES,
  count: inZone.length,
  zips: packZips(inZone),
});

// One row per 3-digit prefix: the mean position of its ZIPs (of only the ZIPs
// in a zone, when it has any), projected onto the map. Nothing smaller than a
// prefix survives, so the file cannot place anyone more closely than that.
const prefixes = new Map();
for (const z of Object.values(zipcodes.codes)) {
  if (z.country !== "US" || !/^\d{5}$/.test(z.zip) || !isContiguous(z.latitude, z.longitude)) continue;
  const p = z.zip.slice(0, 3);
  const g = prefixes.get(p) ?? { all: [], inZone: [] };
  g.all.push(z);
  if (inZoneByCoords(z.latitude, z.longitude, hubs, LOCAL_DELIVERY_RADIUS_MILES)) g.inZone.push(z);
  prefixes.set(p, g);
}
const mean = (zs, k) => zs.reduce((sum, z) => sum + z[k], 0) / zs.length;
const areaRows = [...prefixes.keys()].sort().flatMap((prefix) => {
  const g = prefixes.get(prefix);
  const at = g.inZone.length ? g.inZone : g.all;
  const lat = mean(at, "latitude");
  const lng = mean(at, "longitude");
  const xy = projection([lng, lat]);
  const hub = nearestHubIndex(lat, lng, hubs);
  if (!xy || hub < 0) return [];
  // The gap is read from where the whole prefix sits, so an out-of-zone ZIP in
  // a prefix that is partly in a zone still gets an honest "about N miles".
  const gap = zoneGapMiles(
    milesBetween(mean(g.all, "latitude"), mean(g.all, "longitude"), hubs[hub].lat, hubs[hub].lng),
    LOCAL_DELIVERY_RADIUS_MILES,
  );
  return [{ prefix, x: xy[0], y: xy[1], hub, gap }];
});
const areasJson = JSON.stringify({
  radiusMiles: LOCAL_DELIVERY_RADIUS_MILES,
  count: areaRows.length,
  areas: packAreas(areaRows),
});

/* -------------------------------- write -------------------------------- */

writeFileSync(SOURCE, JSON.stringify(hubs, null, 2) + "\n");
writeFileSync(GENERATED, JSON.stringify(generated, null, 2) + "\n");
writeFileSync(MINI, JSON.stringify(mini) + "\n");
mkdirSync(dirname(ZIPS_OUT), { recursive: true });
writeFileSync(ZIPS_OUT, zipsJson + "\n");
writeFileSync(AREAS_OUT, areasJson + "\n");

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const genBytes = Buffer.byteLength(JSON.stringify(generated));
console.log(
  `build:hubs: ${hubs.length} hubs, ${inZone.length} ZIPs within ${LOCAL_DELIVERY_RADIUS_MILES} mi\n` +
    `  ${GENERATED.replace(ROOT + "/", "")}: ${kb(genBytes)} (${kb(gzipSync(JSON.stringify(generated)).length)} gzipped)\n` +
    `  ${MINI.replace(ROOT + "/", "")}: ${kb(Buffer.byteLength(JSON.stringify(mini)))}\n` +
    `  ${ZIPS_OUT.replace(ROOT + "/", "")}: ${kb(zipsJson.length)} (${kb(gzipSync(zipsJson).length)} gzipped)\n` +
    `  ${AREAS_OUT.replace(ROOT + "/", "")}: ${areaRows.length} areas, ${kb(areasJson.length)} (${kb(gzipSync(areasJson).length)} gzipped)`,
);
