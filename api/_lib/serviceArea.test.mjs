// Run with: npm run test:api
// The mobile/install service area rule (src/data/serviceArea.js), shared by
// the checkout page, the schedule page and POST /api/checkout.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  isInServiceArea,
  zip5,
  SERVICE_COUNTIES,
  SERVICE_AREA_LABEL,
  SERVICE_AREA_SCHEMA,
  MOBILE_AREA_ERROR,
  EXCLUDED_ZIPS,
} from "../../src/data/serviceArea.js";

test("the three counties are in", () => {
  assert.equal(isInServiceArea("33351"), true, "Sunrise (Broward)");
  assert.equal(isInServiceArea("33139"), true, "Miami Beach (Miami-Dade)");
  assert.equal(isInServiceArea("33401"), true, "West Palm Beach (Palm Beach)");
  assert.equal(isInServiceArea("33431"), true, "Boca Raton");
  assert.equal(isInServiceArea("33030"), true, "Homestead");
  assert.equal(isInServiceArea("33477"), true, "Jupiter");
});

test("the Florida Keys and everything else are out", () => {
  assert.equal(isInServiceArea("33040"), false, "Key West");
  for (const z of EXCLUDED_ZIPS) assert.equal(isInServiceArea(z), false, z);
  assert.equal(isInServiceArea("34997"), false, "Stuart (Martin)");
  assert.equal(isInServiceArea("32801"), false, "Orlando");
  assert.equal(isInServiceArea("10001"), false, "New York");
  assert.equal(isInServiceArea("33501"), false, "335 prefix");
});

test("ZIP+4 and stray spaces are handled", () => {
  assert.equal(isInServiceArea("33351-1234"), true);
  assert.equal(isInServiceArea("333511234"), true);
  assert.equal(isInServiceArea("  33139 "), true);
  assert.equal(isInServiceArea("33040-1234"), false);
  assert.equal(zip5("33401-0001"), "33401");
});

test("empty and invalid ZIPs are rejected", () => {
  for (const z of ["", "   ", null, undefined, "abcde", "3335", "333511", "33351-12", "33351 1234x", 33351.5]) {
    assert.equal(isInServiceArea(z), false, String(z));
  }
});

test("labels, schema and the error sentence", () => {
  assert.deepEqual(SERVICE_COUNTIES, ["Miami-Dade", "Broward", "Palm Beach"]);
  assert.equal(SERVICE_AREA_LABEL, "Miami-Dade, Broward and Palm Beach counties");
  assert.equal(
    MOBILE_AREA_ERROR,
    "Mobile install covers Miami-Dade, Broward and Palm Beach counties. Choose ship-to-home or ship-to-store instead.",
  );
  assert.deepEqual(
    SERVICE_AREA_SCHEMA.map((a) => [a["@type"], a.name]),
    [
      ["AdministrativeArea", "Miami-Dade County, FL"],
      ["AdministrativeArea", "Broward County, FL"],
      ["AdministrativeArea", "Palm Beach County, FL"],
    ],
  );
});
