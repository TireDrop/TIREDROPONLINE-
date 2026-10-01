// Run with: npm run test:data
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  isValidVin,
  normalizeVin,
  vinCheckDigit,
  vinProblem,
  vinProblemText,
} from "./vin.js";

test("check digit: published examples pass, including an X", () => {
  // 1HGCM82633A004352 is the usual worked example (digit 3);
  // 1M8GDM9AXKP042788 has X in position 9; 17 ones is the trivial case.
  for (const vin of ["1HGCM82633A004352", "1M8GDM9AXKP042788", "11111111111111111"]) {
    assert.equal(vinCheckDigit(vin), vin[8], vin);
    assert.equal(vinProblem(vin), null, vin);
    assert.ok(isValidVin(vin));
  }
});

test("check digit: one wrong character is caught", () => {
  assert.equal(vinProblem("1HGCM82634A004352"), "check-digit", "position 9 changed");
  assert.equal(vinProblem("1HGCM82633A004353"), "check-digit", "last digit changed");
  assert.equal(vinProblem("2HGCM82633A004352"), "check-digit", "first digit changed");
  assert.equal(isValidVin("1HGCM82633A004353"), false);
});

test("length, letters I/O/Q and empty input are each named", () => {
  assert.equal(vinProblem(""), "empty");
  assert.equal(vinProblem("   "), "empty");
  assert.equal(vinProblem("1HGCM82633A00435"), "length");
  assert.equal(vinProblem("1HGCM82633A0043521"), "length");
  assert.equal(vinProblem("1HGCM82633AO04352"), "letters", "letter O");
  assert.equal(vinProblem("IHGCM82633A004352"), "letters", "letter I");
  assert.equal(vinProblem("1HGCM82633A00435Q"), "letters", "letter Q");
  assert.equal(vinProblem("1HGCM82633A00435*"), "letters");
  assert.equal(vinCheckDigit("1HGCM82633AO04352"), null);
});

test("normalizing: case, spaces, dashes and dots", () => {
  assert.equal(normalizeVin(" 1hg cm8-2633.a004352 "), "1HGCM82633A004352");
  assert.equal(vinProblem("1hgcm82633a004352"), null);
  assert.equal(normalizeVin(null), "");
});

test("every problem has words for the shopper, and none promises anything", () => {
  for (const p of ["empty", "length", "letters", "check-digit"]) {
    const text = vinProblemText(p);
    assert.ok(text.length > 10, p);
    assert.doesNotMatch(text, /\b(safe|ok|fine|guarantee)/i, p);
  }
  assert.equal(vinProblemText(null), "");
});
