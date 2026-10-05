// The mobile-install strip's price and coverage lines.
//
//   npm run test:lib

import { test } from "node:test";
import assert from "node:assert/strict";

import { getService } from "../data/services.js";
import { SERVICE_AREA_LABEL } from "../data/serviceArea.js";
import {
  mobileCoverageLine,
  mobileCoverageLineEs,
  mobilePriceLine,
  mobilePriceLineEs,
} from "./mobilePrice.js";

test("the price line is the catalog's install price, never a literal", () => {
  const s = getService("tire-installation");
  const line = mobilePriceLine();
  assert.equal(line.text, `Tire installation from $${s.priceFrom} ${s.priceUnit}`);
  assert.equal(line.from, `from $${s.priceFrom}`);
});

test("it follows the data: another price and unit change the line", () => {
  assert.equal(
    mobilePriceLine({ priceFrom: 30, priceUnit: "per wheel" }).text,
    "Tire installation from $30 per wheel",
  );
  assert.equal(mobilePriceLine({ priceFrom: 27.5, priceUnit: "per tire" }).from, "from $27.50");
});

test("no usable price gives no line, not a made-up one", () => {
  assert.equal(mobilePriceLine({ priceUnit: "per tire" }), null);
  assert.equal(mobilePriceLine({ priceFrom: -1 }), null);
  assert.equal(mobilePriceLine(null), null);
});

test("the line claims no fee, minimum, discount or timing", () => {
  const { text } = mobilePriceLine();
  assert.doesNotMatch(text, /free|fee|minimum|travel|discount|deal|today|hour|min\b/i);
});

test("coverage names the city and county, or the three counties", () => {
  assert.equal(
    mobileCoverageLine({ place: "Sunrise", county: "Broward", area: SERVICE_AREA_LABEL }),
    "Mobile van in Sunrise, Broward County",
  );
  assert.equal(
    mobileCoverageLine({ area: SERVICE_AREA_LABEL }),
    "Mobile van in Miami-Dade, Broward and Palm Beach counties",
  );
});

test("Spanish strip: the same catalog number and unit, only the words differ", () => {
  const s = getService("tire-installation");
  const es = mobilePriceLineEs();
  assert.equal(es.text, `Instalación desde $${s.priceFrom} por llanta`);
  assert.equal(es.from.replace("desde ", ""), mobilePriceLine().from.replace("from ", ""));
  // It follows the data.
  assert.equal(mobilePriceLineEs({ priceFrom: 27.5, priceUnit: "per tire" }).from, "desde $27.50");
});

test("Spanish strip: an unknown unit or no price gives no line, not a wrong one", () => {
  assert.equal(mobilePriceLineEs({ priceFrom: 25, priceUnit: "per axle" }), null);
  assert.equal(mobilePriceLineEs({ priceUnit: "per tire" }), null);
  assert.equal(mobilePriceLineEs(null), null);
  assert.doesNotMatch(mobilePriceLineEs().text, /gratis|descuento|oferta|promoci|hoy|mínimo|minimo|cargo/i);
});

test("Spanish coverage names the city and county, or the three counties", () => {
  assert.equal(
    mobileCoverageLineEs({ place: "Hialeah", county: "Miami-Dade", area: "X" }),
    "Camioneta móvil en Hialeah, condado de Miami-Dade",
  );
  assert.equal(
    mobileCoverageLineEs({ area: "Miami-Dade, Broward y Palm Beach" }),
    "Camioneta móvil en Miami-Dade, Broward y Palm Beach",
  );
});
