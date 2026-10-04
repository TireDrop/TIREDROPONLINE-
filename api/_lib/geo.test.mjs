// Run with: npm run test:api
// GET /api/geo (api/_lib/geo.js, served by api/status.js through a
// vercel.json rewrite) and the Permissions-Policy that lets /local-delivery
// ask for the device location at all.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

import { parseGeoHeaders } from "./geo.js";
import statusHandler from "../status.js";

const FULL = {
  "x-vercel-ip-country": "US",
  "x-vercel-ip-postal-code": "33351",
  "x-vercel-ip-latitude": "26.1650",
  "x-vercel-ip-longitude": "-80.2690",
  "x-vercel-ip-city": "Fort%20Lauderdale",
  "x-vercel-ip-country-region": "FL",
};

function mockRes() {
  const res = { headers: {}, statusCode: 0, body: "" };
  res.setHeader = (k, v) => (res.headers[k.toLowerCase()] = v);
  res.end = (b = "") => (res.body = b);
  return res;
}

test("parseGeoHeaders: a full U.S. answer", () => {
  assert.deepEqual(parseGeoHeaders(FULL), {
    available: true,
    country: "US",
    zip: "33351",
    lat: 26.165,
    lng: -80.269,
    city: "Fort Lauderdale",
    region: "FL",
  });
});

test("parseGeoHeaders: region is a two-letter U.S. state, else null", () => {
  const regionOf = (raw, country = "US") =>
    parseGeoHeaders({ ...FULL, "x-vercel-ip-country": country, "x-vercel-ip-country-region": raw }).region;
  assert.equal(regionOf("fl"), "FL");
  assert.equal(regionOf(""), null);
  assert.equal(regionOf("<b>"), null);
  assert.equal(regionOf("FLA"), null);
  assert.equal(regionOf("ON", "CA"), null); // only U.S. states are shown
});

test("parseGeoHeaders: no headers (local preview) is unavailable", () => {
  assert.deepEqual(parseGeoHeaders({}), { available: false });
  assert.deepEqual(parseGeoHeaders(undefined), { available: false });
  assert.deepEqual(parseGeoHeaders({ "x-vercel-ip-country": "USA" }), { available: false });
  assert.deepEqual(parseGeoHeaders({ "x-vercel-ip-country": "<b>" }), { available: false });
});

test("parseGeoHeaders: ZIP is 5 digits, U.S. only", () => {
  assert.equal(parseGeoHeaders({ ...FULL, "x-vercel-ip-postal-code": "33351-1234" }).zip, "33351");
  assert.equal(parseGeoHeaders({ ...FULL, "x-vercel-ip-postal-code": "3335" }).zip, null);
  assert.equal(parseGeoHeaders({ ...FULL, "x-vercel-ip-postal-code": "abcde" }).zip, null);
  assert.equal(parseGeoHeaders({ ...FULL, "x-vercel-ip-postal-code": undefined }).zip, null);
  const ca = parseGeoHeaders({ ...FULL, "x-vercel-ip-country": "ca", "x-vercel-ip-postal-code": "12345" });
  assert.equal(ca.country, "CA");
  assert.equal(ca.zip, null);
});

test("parseGeoHeaders: coordinates are range-checked and come as a pair", () => {
  const coords = (lat, lng) => {
    const g = parseGeoHeaders({ ...FULL, "x-vercel-ip-latitude": lat, "x-vercel-ip-longitude": lng });
    return [g.lat, g.lng];
  };
  assert.deepEqual(coords("25.77", "-80.19"), [25.77, -80.19]);
  assert.deepEqual(coords("91", "-80.19"), [null, null]);
  assert.deepEqual(coords("25.77", "-181"), [null, null]);
  assert.deepEqual(coords("25.77", ""), [null, null]);
  assert.deepEqual(coords("1e2", "5"), [null, null]);
  assert.deepEqual(coords("NaN", "Infinity"), [null, null]);
  assert.deepEqual(coords("0", "0"), [null, null]); // Vercel's "unknown"
});

test("parseGeoHeaders: city is decoded and rejected when it is not a place name", () => {
  const cityOf = (raw) => parseGeoHeaders({ ...FULL, "x-vercel-ip-city": raw }).city;
  assert.equal(cityOf("S%C3%A3o%20Paulo"), "São Paulo");
  assert.equal(cityOf("Coeur%20d'Alene"), "Coeur d'Alene");
  assert.equal(cityOf("%E0%A4%A"), null); // malformed escape
  assert.equal(cityOf("%3Cscript%3E"), null);
  assert.equal(cityOf("x".repeat(80)), null);
  assert.equal(cityOf(""), null);
});

test("parseGeoHeaders: repeated headers use the first value", () => {
  assert.equal(parseGeoHeaders({ ...FULL, "x-vercel-ip-country": ["US", "CA"] }).country, "US");
});

const vercel = JSON.parse(readFileSync(new URL("../../vercel.json", import.meta.url), "utf8"));
const geoHandler = (req, res) => statusHandler({ ...req, url: "/api/status?geo=1" }, res);

test("GET /api/geo: private, uncached JSON; other methods are refused", () => {
  const res = mockRes();
  geoHandler({ method: "GET", headers: FULL }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["cache-control"], "private, no-store");
  assert.equal(JSON.parse(res.body).zip, "33351");

  const local = mockRes();
  geoHandler({ method: "GET", headers: {} }, local);
  assert.deepEqual(JSON.parse(local.body), { available: false });

  const post = mockRes();
  geoHandler({ method: "POST", headers: FULL }, post);
  assert.equal(post.statusCode, 405);
  assert.equal(post.headers.allow, "GET");

  // Plain /api/status is unchanged and never carries location.
  const status = mockRes();
  statusHandler({ method: "GET", headers: FULL, url: "/api/status" }, status);
  assert.equal(JSON.parse(status.body).zip, undefined);
  assert.equal(status.headers["cache-control"], "no-store");
});

test("vercel.json rewrites /api/geo to the status function", () => {
  assert.ok(
    vercel.rewrites.some((r) => r.source === "/api/geo" && r.destination === "/api/status?geo=1"),
  );
});

// A 13th function fails the whole deployment on the Hobby plan
// (exceeded_serverless_functions_per_deployment), which this caught too late
// once: count them here, where it is cheap.
test("api/ stays within the Hobby plan's 12 functions", () => {
  const count = (dir) =>
    readdirSync(new URL(dir, import.meta.url), { withFileTypes: true }).reduce(
      (n, e) =>
        e.name.startsWith("_") || e.name.startsWith(".")
          ? n
          : e.isDirectory()
            ? n + count(`${dir}${e.name}/`)
            : n + (/\.(js|mjs|cjs|ts)$/.test(e.name) && !/\.test\./.test(e.name) ? 1 : 0),
      0,
    );
  const functions = count("../");
  assert.ok(functions <= 12, `${functions} functions in api/; the Hobby plan allows 12`);
});

// Root cause of "Use my location never works": the site-wide header had
// geolocation=(), which blocks the Geolocation API on every page. It must
// stay (self): our own pages may ask, embedded third-party frames may not.
test("vercel.json Permissions-Policy allows geolocation for our own origin only", () => {
  const values = vercel.headers
    .flatMap((h) => h.headers)
    .filter((h) => h.key.toLowerCase() === "permissions-policy")
    .map((h) => h.value);
  assert.equal(values.length, 1);
  const directives = values[0].split(",").map((d) => d.trim());
  assert.ok(directives.includes("geolocation=(self)"), values[0]);
  assert.ok(!directives.includes("geolocation=()"), values[0]);
  // Everything else stays off.
  for (const d of directives.filter((x) => !x.startsWith("geolocation="))) {
    assert.match(d, /=\(\)$/, d);
  }
});
