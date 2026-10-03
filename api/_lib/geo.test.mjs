// Run with: npm run test:api
// GET /api/geo (api/geo.js, api/_lib/geo.js) and the Permissions-Policy that
// lets /local-delivery ask for the device location at all.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { parseGeoHeaders } from "./geo.js";
import geoHandler from "../geo.js";

const FULL = {
  "x-vercel-ip-country": "US",
  "x-vercel-ip-postal-code": "33351",
  "x-vercel-ip-latitude": "26.1650",
  "x-vercel-ip-longitude": "-80.2690",
  "x-vercel-ip-city": "Fort%20Lauderdale",
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
  });
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
});

// Root cause of "Use my location never works": the site-wide header had
// geolocation=(), which blocks the Geolocation API on every page. It must
// stay (self): our own pages may ask, embedded third-party frames may not.
test("vercel.json Permissions-Policy allows geolocation for our own origin only", () => {
  const config = JSON.parse(readFileSync(new URL("../../vercel.json", import.meta.url), "utf8"));
  const values = config.headers
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
