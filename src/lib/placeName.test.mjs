// Run with: npm run test:lib
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  REVERSE_GEOCODE_HOST,
  approxPlace,
  lookupPlace,
  placeFromReverse,
  reverseGeocodeUrl,
  roundCoord,
} from "./placeName.js";

const WYNWOOD = {
  latitude: 25.8009,
  longitude: -80.1991,
  locality: "Wynwood",
  city: "Miami",
  principalSubdivision: "Florida",
  principalSubdivisionCode: "US-FL",
  countryCode: "US",
  postcode: "33127",
};

const reply = (body, ok = true) => async () => ({ ok, json: async () => body });

test("roundCoord: three decimals, about 100 m", () => {
  assert.equal(roundCoord(25.800912), 25.801);
  assert.equal(roundCoord(-80.199149), -80.199);
  assert.equal(roundCoord(-80.1995), -80.199); // JS rounds half toward +infinity: still 3 decimals
  assert.equal(roundCoord(0), 0);
});

test("reverseGeocodeUrl: rounded latitude, longitude and the language, nothing else", () => {
  const u = new URL(reverseGeocodeUrl(25.800912345, -80.199149876));
  assert.equal(u.origin, REVERSE_GEOCODE_HOST);
  assert.equal(u.pathname, "/data/reverse-geocode-client");
  assert.deepEqual([...u.searchParams.keys()].sort(), ["latitude", "localityLanguage", "longitude"]);
  assert.equal(u.searchParams.get("latitude"), "25.801");
  assert.equal(u.searchParams.get("longitude"), "-80.199");
  assert.equal(u.searchParams.get("localityLanguage"), "en");
  assert.equal(reverseGeocodeUrl(NaN, 1), null);
  assert.equal(reverseGeocodeUrl(91, 0), null);
  assert.equal(reverseGeocodeUrl(0, 181), null);
});

test("placeFromReverse: neighborhood and city, then city alone, then the neighborhood alone", () => {
  assert.equal(placeFromReverse(WYNWOOD), "Wynwood, Miami, FL");
  assert.equal(placeFromReverse({ ...WYNWOOD, locality: "" }), "Miami, FL");
  assert.equal(placeFromReverse({ ...WYNWOOD, locality: undefined }), "Miami, FL");
  assert.equal(placeFromReverse({ ...WYNWOOD, locality: "Miami" }), "Miami, FL"); // repeats the city
  assert.equal(placeFromReverse({ ...WYNWOOD, locality: "miami" }), "Miami, FL");
  assert.equal(placeFromReverse({ ...WYNWOOD, city: "" }), "Wynwood, FL");
});

test("placeFromReverse: a state only for the U.S., never a state alone", () => {
  assert.equal(placeFromReverse({ ...WYNWOOD, principalSubdivisionCode: "" }), "Wynwood, Miami");
  assert.equal(placeFromReverse({ ...WYNWOOD, principalSubdivisionCode: "US-florida" }), "Wynwood, Miami");
  assert.equal(
    placeFromReverse({ locality: "Le Plateau", city: "Montréal", countryCode: "CA", principalSubdivisionCode: "CA-QC" }),
    "Le Plateau, Montréal",
  );
  assert.equal(placeFromReverse({ countryCode: "US", principalSubdivisionCode: "US-FL" }), null);
});

test("placeFromReverse: ignores street, house number and ZIP fields, and numbers posing as names", () => {
  const text = placeFromReverse({
    ...WYNWOOD,
    postcode: "33127",
    postalCode: "33127",
    streetName: "NW 2nd Ave",
    street: "NW 2nd Ave",
    houseNumber: "2520",
    address: "2520 NW 2nd Ave",
  });
  assert.equal(text, "Wynwood, Miami, FL");
  assert.doesNotMatch(text, /\d/);
  assert.equal(placeFromReverse({ ...WYNWOOD, locality: "33127" }), "Miami, FL");
  assert.equal(placeFromReverse({ ...WYNWOOD, locality: "2520 NW 2nd Ave", city: "33127" }), null);
  assert.equal(placeFromReverse({ ...WYNWOOD, locality: "<b>Hi</b>" }), "Miami, FL");
  assert.equal(placeFromReverse({ ...WYNWOOD, locality: "x".repeat(80) }), "Miami, FL");
});

test("placeFromReverse: anything malformed is no place", () => {
  for (const bad of [null, undefined, "", "<html>", 5, [], {}, { locality: 5, city: null }]) {
    assert.equal(placeFromReverse(bad), null);
  }
});

test("lookupPlace: the place for a good answer, and what was asked", async () => {
  let asked;
  const fetchImpl = async (url, init) => {
    asked = { url, init };
    return { ok: true, json: async () => WYNWOOD };
  };
  assert.equal(await lookupPlace(25.800912, -80.199149, { fetchImpl }), "Wynwood, Miami, FL");
  const u = new URL(asked.url);
  assert.equal(u.searchParams.get("latitude"), "25.801");
  assert.equal(u.searchParams.get("longitude"), "-80.199");
  assert.equal(asked.init.credentials, "omit");
  assert.equal(asked.init.referrerPolicy, "no-referrer");
  assert.equal(asked.init.method, undefined); // a plain GET
  assert.equal(asked.init.body, undefined);
});

test("lookupPlace: failure, bad status, bad body, bad input or no fetch is null, never a throw", async () => {
  assert.equal(await lookupPlace(25.8, -80.2, { fetchImpl: reply(WYNWOOD, false) }), null);
  assert.equal(await lookupPlace(25.8, -80.2, { fetchImpl: reply({}) }), null);
  assert.equal(
    await lookupPlace(25.8, -80.2, { fetchImpl: async () => ({ ok: true, json: async () => { throw new Error("not json"); } }) }),
    null,
  );
  assert.equal(await lookupPlace(25.8, -80.2, { fetchImpl: async () => { throw new TypeError("blocked"); } }), null);
  assert.equal(await lookupPlace(Number.NaN, -80.2, { fetchImpl: reply(WYNWOOD) }), null);
  assert.equal(await lookupPlace(25.8, -80.2, { fetchImpl: null }), null);
});

test("lookupPlace: a slow answer is abandoned at the timeout", async () => {
  let aborted = false;
  const fetchImpl = (_url, { signal }) =>
    new Promise((_, reject) => {
      signal.addEventListener("abort", () => {
        aborted = true;
        reject(new DOMException("aborted", "AbortError"));
      });
    });
  const started = Date.now();
  assert.equal(await lookupPlace(25.8, -80.2, { fetchImpl, timeoutMs: 40 }), null);
  assert.ok(aborted);
  assert.ok(Date.now() - started < 1000);
});

test("approxPlace: city and state from the connection, or null without a city", () => {
  assert.equal(approxPlace("Sunrise", "FL"), "Sunrise, FL");
  assert.equal(approxPlace("Sunrise", null), "Sunrise");
  assert.equal(approxPlace("Sunrise", "Florida"), "Sunrise");
  assert.equal(approxPlace(null, "FL"), null);
  assert.equal(approxPlace("", "FL"), null);
  assert.equal(approxPlace("33351", "FL"), null);
});
