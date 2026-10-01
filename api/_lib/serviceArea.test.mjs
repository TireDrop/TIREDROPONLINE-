// Run with: npm run test:api
// The mobile/install service area rule (src/data/serviceArea.js), shared by
// the checkout page, the schedule page, the ZIP checker and the api:
// POST /api/checkout (mobile), POST /api/forms (a mobile booking) and
// POST /api/book-install (installBooking.test.mjs).

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
import { BUSINESS } from "../../src/data/business.js";
import { validateLead } from "./validate.js";
import { createCheckoutHandler } from "../checkout.js";
import { createFormsHandler, resetFormsRateLimit } from "../forms.js";

const AREA_ERROR =
  "That ZIP is outside our mobile service area (Miami-Dade, Broward and Palm Beach). Ship to our Sunrise shop instead, or call (954) 773-1896.";
const KEYS = ["33001", "33036", "33037", "33040", "33041", "33042", "33043", "33045", "33050", "33051", "33052", "33070"];
// 334 ZIPs outside Palm Beach County: Clewiston (Hendry), Hobe Sound (Martin),
// Moore Haven (Glades), Hobe Sound PO boxes (Martin).
const NOT_PALM_BEACH = ["33440", "33455", "33471", "33475"];
// Sunrise and Fort Lauderdale (Broward), Palm Beach, Hialeah (Miami-Dade).
const ACCEPTED = ["33351", "33301", "33480", "33012"];

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

test("334 ZIPs outside Palm Beach County are out; the rest of Palm Beach stays in", () => {
  for (const z of [...NOT_PALM_BEACH, ...KEYS]) {
    assert.ok(EXCLUDED_ZIPS.includes(z), z);
    assert.equal(isInServiceArea(z), false, z);
    assert.equal(isInServiceArea(`${z}-1234`), false, `${z}-1234`);
  }
  for (const z of [...ACCEPTED, "33401", "33430", "33458", "33469", "33477", "33478", "33496"]) {
    assert.equal(isInServiceArea(z), true, z);
  }
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
    AREA_ERROR,
  );
  assert.ok(MOBILE_AREA_ERROR.endsWith(`call ${BUSINESS.phone}.`), "the phone is the shop's");
  assert.deepEqual(
    SERVICE_AREA_SCHEMA.map((a) => [a["@type"], a.name]),
    [
      ["AdministrativeArea", "Miami-Dade County, FL"],
      ["AdministrativeArea", "Broward County, FL"],
      ["AdministrativeArea", "Palm Beach County, FL"],
    ],
  );
});

// ---- server-side enforcement ------------------------------------------------

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(text) { this.body = text === undefined ? undefined : JSON.parse(text); },
  };
}

let ip = 0;
async function post(handler, body) {
  ip += 1;
  const res = mockRes();
  await handler({ method: "POST", headers: { "x-forwarded-for": `198.18.0.${ip}` }, body }, res);
  return res;
}

test("POST /api/checkout: mobile delivery rejects each excluded ZIP with the area sentence, and takes the in-area ones", async () => {
  // No integrations configured: the mock catalog, nothing leaves the process.
  const handler = createCheckoutHandler({ env: {} });
  const order = (zip) => ({
    items: [{ sku: "t-cont-truecontact-tour", qty: 4 }],
    delivery: "mobile",
    customer: { name: "Test Buyer", email: "buyer@example.com", phone: "954-555-0100" },
    address: { line1: "10 Main St", city: "Anywhere", state: "FL", zip },
  });
  for (const zip of [...NOT_PALM_BEACH, ...KEYS]) {
    const res = await post(handler, order(zip));
    assert.equal(res.statusCode, 400, zip);
    assert.equal(res.body.error, AREA_ERROR, zip);
  }
  for (const zip of ACCEPTED) {
    const res = await post(handler, order(zip));
    assert.equal(res.statusCode, 200, zip);
    assert.equal(res.body.delivery, "mobile", zip);
  }
});

const BOOKING = Object.freeze({
  form: "booking",
  name: "Sam Ortiz",
  email: "sam@example.com",
  phone: "954-555-0134",
  service: "tire-installation",
  year: "2020",
  make: "Toyota",
  model: "Camry",
  locationType: "mobile",
  address: "10 Main St",
  city: "Anywhere",
  date: "2026-10-05",
  window: "10-12pm",
  website: "",
});

test("forms validation: a mobile booking needs an in-area ZIP; an in-shop booking needs none", () => {
  for (const zip of [...NOT_PALM_BEACH, ...KEYS]) {
    assert.deepEqual(validateLead({ ...BOOKING, zip }), { ok: false, error: AREA_ERROR }, zip);
  }
  for (const zip of ["", "abc", "3335"]) {
    assert.deepEqual(validateLead({ ...BOOKING, zip }), { ok: false, error: "Enter a five-digit ZIP code." }, zip);
  }
  for (const zip of [...ACCEPTED, "33351-1234"]) {
    const v = validateLead({ ...BOOKING, zip });
    assert.equal(v.ok, true, zip);
    assert.ok(v.value.fields.some(([label, value]) => label === "ZIP code" && value === zip), zip);
  }
  // In the shop: no ZIP, or one far away, is fine.
  for (const zip of ["", "33455", "10001"]) {
    const v = validateLead({ ...BOOKING, locationType: "shop", address: "", city: "", zip });
    assert.equal(v.ok, true, `shop ${zip}`);
  }
  // Other forms are never held to it.
  assert.equal(validateLead({ form: "contact", email: "a@example.com", zip: "33455" }).ok, true);
});

test("POST /api/forms: a mobile booking outside the area is a 400 before Shopify is asked", async () => {
  resetFormsRateLimit();
  let calls = 0;
  const handler = createFormsHandler({
    env: { SHOPIFY_STORE_DOMAIN: "tiredrop-test.myshopify.com", SHOPIFY_ADMIN_TOKEN: "shpat_test_token" },
    shopify: { fetchImpl: async () => { calls += 1; throw new Error("Shopify must not be called"); }, retryDelayMs: 0 },
  });
  for (const zip of ["33440", "33455", "33471", "33475", "33040"]) {
    resetFormsRateLimit();
    const res = await post(handler, { ...BOOKING, zip });
    assert.equal(res.statusCode, 400, zip);
    assert.equal(res.body.error, AREA_ERROR, zip);
  }
  assert.equal(calls, 0);
});
