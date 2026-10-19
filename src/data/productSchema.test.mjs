// Product / Offer JSON-LD (productSchema.js), behind the switches in
// seoFlags.js. The markup must stay off until the real distributor catalog is
// live, must never carry ratings or reviews, and must say no more than the
// sample data and the site's own terms say.
//
//   npm run test:data      (node --test "src/data/*.test.mjs")
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  PRODUCT_AVAILABILITY_ENABLED,
  PRODUCT_SCHEMA_ENABLED,
  RETURN_WINDOW_DAYS,
} from "./seoFlags.js";
import {
  SHIPPING_REGIONS,
  priceNumber,
  productSchema,
  validGtin,
} from "./productSchema.js";
import { TIRES, WHEELS } from "./products.js";
import { STATES } from "./stateList.js";

const ORIGIN = "https://tiredroponline.com";
const ALL = [...TIRES, ...WHEELS];
const ON = { enabled: true };

/** Every key in the tree, at any depth. */
function keysOf(value, out = []) {
  if (Array.isArray(value)) value.forEach((v) => keysOf(v, out));
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) {
      out.push(k);
      keysOf(v, out);
    }
  return out;
}

/** Every object in the tree. */
function objectsOf(value, out = []) {
  if (Array.isArray(value)) value.forEach((v) => objectsOf(v, out));
  else if (value && typeof value === "object") {
    out.push(value);
    Object.values(value).forEach((v) => objectsOf(v, out));
  }
  return out;
}

test("the switch decides: off emits nothing, for every sample product", () => {
  for (const p of ALL) {
    assert.equal(productSchema(p, { enabled: false }), null, p.slug);
    // With no override, the module follows seoFlags.js exactly.
    assert.equal(productSchema(p) === null, !PRODUCT_SCHEMA_ENABLED, p.slug);
  }
  assert.equal(productSchema(null, ON), null);
});

test("the repo's own defaults are conservative", () => {
  // These two are Justin's decisions; they ship unset. If one is flipped
  // on purpose, update docs/integrations/product-structured-data.md too.
  assert.equal(typeof PRODUCT_SCHEMA_ENABLED, "boolean");
  assert.ok(RETURN_WINDOW_DAYS === null || Number.isInteger(RETURN_WINDOW_DAYS));
  assert.equal(typeof PRODUCT_AVAILABILITY_ENABLED, "boolean");
});

test("switch on: a valid Product + Offer for every sample product", () => {
  for (const p of ALL) {
    const kind = p.kind;
    const node = productSchema(p, { ...ON, kind });
    const path = `${kind === "wheel" ? "wheels" : "tires"}/${p.slug}`;
    const url = `${ORIGIN}/${path}`;
    assert.equal(node["@type"], "Product", p.slug);
    assert.equal(node["@id"], `${url}#product`);
    assert.equal(node.url, url);
    assert.equal(node.name, `${p.brand} ${p.model}`);
    assert.deepEqual(node.brand, { "@type": "Brand", name: p.brand });
    assert.ok(node.description.length > 20, p.slug);
    assert.match(node.category, /^(Tires|Wheels) > .+/);

    const o = node.offers;
    assert.equal(o["@type"], "Offer");
    assert.equal(o.url, url);
    assert.equal(o.price, p.price);
    assert.equal(o.priceCurrency, "USD");
    assert.equal(o.itemCondition, "https://schema.org/NewCondition");
    assert.deepEqual(o.seller, { "@id": `${ORIGIN}/#organization` });
  }
});

test("sample data carries no identifiers, photos or stock, so none are emitted", () => {
  for (const p of ALL) {
    const node = productSchema(p, { ...ON, showAvailability: true });
    for (const k of ["sku", "mpn", "gtin", "image"])
      assert.equal(k in node, false, `${p.slug} has no ${k}`);
    assert.equal("availability" in node.offers, false, p.slug);
  }
});

test("shipping: free to the 48 states + DC, never Alaska, Hawaii or territories", () => {
  const { shippingDetails } = productSchema(TIRES[0], ON).offers;
  assert.equal(shippingDetails["@type"], "OfferShippingDetails");
  assert.deepEqual(shippingDetails.shippingRate, {
    "@type": "MonetaryAmount",
    value: 0,
    currency: "USD",
  });
  const dest = shippingDetails.shippingDestination;
  assert.equal(dest["@type"], "DefinedRegion");
  assert.equal(dest.addressCountry, "US");
  assert.equal(dest.addressRegion.length, 49);
  assert.equal(new Set(dest.addressRegion).size, 49);
  assert.ok(dest.addressRegion.includes("DC"));
  for (const code of ["AK", "HI", "PR", "GU", "VI", "AS", "MP"])
    assert.equal(dest.addressRegion.includes(code), false, code);
  assert.deepEqual(
    [...dest.addressRegion].sort(),
    STATES.map((s) => s.abbr).sort(),
  );
  assert.deepEqual(SHIPPING_REGIONS, [...SHIPPING_REGIONS].sort());
});

test("no delivery time, ever: the data has no handling or transit facts", () => {
  const node = productSchema(TIRES[0], { ...ON, returnWindowDays: 30 });
  assert.ok(!keysOf(node).some((k) => /deliveryTime|handlingTime|transitTime|priceValidUntil/.test(k)));
});

test("no return policy while the window is null", () => {
  for (const days of [null, undefined, 0, -5, 1.5, "30", NaN]) {
    const node = productSchema(TIRES[0], { ...ON, returnWindowDays: days });
    assert.equal("hasMerchantReturnPolicy" in node.offers, false, String(days));
  }
});

test("a decided window emits a finite-window policy and nothing unstated", () => {
  const { hasMerchantReturnPolicy: r } = productSchema(WHEELS[0], {
    ...ON,
    returnWindowDays: 30,
  }).offers;
  assert.deepEqual(r, {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "US",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 30,
  });
  // The terms do not fix a return method or who pays; markup must not either.
  assert.equal("returnMethod" in r, false);
  assert.equal("returnFees" in r, false);
  assert.equal("returnShippingFeesAmount" in r, false);
});

test("the terms mention the window whenever RETURN_WINDOW_DAYS is set", () => {
  if (RETURN_WINDOW_DAYS === null) return;
  const terms = readFileSync(
    new URL("../pages/support/LegalPage.jsx", import.meta.url),
    "utf8",
  );
  assert.match(
    terms,
    new RegExp(`\\b${RETURN_WINDOW_DAYS}[- ]days?\\b`),
    `RETURN_WINDOW_DAYS is ${RETURN_WINDOW_DAYS} but LegalPage.jsx never says so`,
  );
});

test("never a rating or a review, even if the record carries one", () => {
  const rated = {
    ...TIRES[0],
    rating: 4.8,
    ratingValue: 4.8,
    reviews: 120,
    reviewCount: 120,
    aggregateRating: { ratingValue: 4.8 },
    review: [{ reviewBody: "great" }],
  };
  for (const p of [...ALL, rated]) {
    const node = productSchema(p, { ...ON, returnWindowDays: 30, showAvailability: true });
    const bad = keysOf(node).filter((k) =>
      /^(aggregateRating|reviews?|reviewRating|reviewCount|ratingValue|ratingCount|bestRating|worstRating)$/i.test(k),
    );
    assert.deepEqual(bad, [], p.slug);
    for (const obj of objectsOf(node))
      assert.ok(
        ![].concat(obj["@type"] ?? []).some((t) => /Review|Rating/.test(t)),
        `${p.slug}: ${obj["@type"]}`,
      );
  }
});

test("prices are numbers in the form Google reads", () => {
  assert.equal(priceNumber(142), 142);
  assert.equal(priceNumber(149.9), 149.9);
  assert.equal(priceNumber(99.999), 100);
  assert.equal(priceNumber(0.1 + 0.2), 0.3);
  assert.equal(priceNumber("142.00"), 142);
  for (const bad of [0, -1, NaN, Infinity, null, undefined, "", "free", "$142", "1,299.50"])
    assert.equal(priceNumber(bad), null, String(bad));

  for (const p of ALL) {
    const { price } = productSchema(p, ON).offers;
    assert.equal(typeof price, "number", p.slug);
    assert.ok(price > 0);
    // "." decimal, no symbol, no thousands separator, at most 2 decimals.
    assert.match(String(price), /^\d+(\.\d{1,2})?$/);
  }
  const offer = JSON.parse(JSON.stringify(productSchema(TIRES[0], ON))).offers;
  assert.equal(offer.priceCurrency, "USD");
  assert.equal(offer.shippingDetails.shippingRate.value, 0);
});

test("a product with no usable price emits nothing (Google rejects a Product with no offer)", () => {
  for (const price of [0, -3, NaN, null, undefined, "n/a"])
    assert.equal(productSchema({ ...TIRES[0], price }, ON), null, String(price));
});

test("availability: off by default; on, only from stock the record reports", () => {
  const stocked = (extra) => ({ ...TIRES[0], ...extra });
  // Off: stock on the record is ignored.
  assert.equal(
    "availability" in productSchema(stocked({ qty: 40 }), { ...ON, showAvailability: false }).offers,
    false,
  );
  const on = (p) => productSchema(p, { ...ON, showAvailability: true }).offers.availability;
  assert.equal(on(stocked({ qty: 40 })), "https://schema.org/InStock");
  assert.equal(on(stocked({ qty: 2 })), "https://schema.org/LimitedAvailability");
  assert.equal(on(stocked({ qty: 0 })), "https://schema.org/OutOfStock");
  assert.equal(on(stocked({ available: true })), "https://schema.org/InStock");
  assert.equal(on(stocked({ available: false })), "https://schema.org/OutOfStock");
  // Unknown stock is never reported as available.
  assert.equal(on(stocked({ qty: null, available: null })), undefined);
});

test("identifiers and photos appear only when the record has real ones", () => {
  const feed = {
    ...TIRES[0],
    sku: "ATD-12345",
    mpn: "MPN-9",
    gtin: "036000291452", // a real UPC-A: check digit 2
    image: "https://cdn.example.com/tire.jpg",
  };
  const node = productSchema(feed, ON);
  assert.equal(node.sku, "ATD-12345");
  assert.equal(node.mpn, "MPN-9");
  assert.equal(node.gtin, "036000291452");
  assert.deepEqual(node.image, ["https://cdn.example.com/tire.jpg"]);

  // A bad check digit is no gtin at all; the other fields survive.
  const bad = productSchema({ ...feed, gtin: "036000291453" }, ON);
  assert.equal("gtin" in bad, false);
  assert.equal(bad.sku, "ATD-12345");

  // Images: always absolute https; relative paths are anchored on the site,
  // http and junk are dropped.
  const imgs = productSchema(
    { ...feed, image: null, images: ["/brand/x.jpg", "http://insecure/x.jpg", "x.jpg", "https://cdn.example.com/a.jpg", "https://cdn.example.com/a.jpg"] },
    ON,
  ).image;
  assert.deepEqual(imgs, [`${ORIGIN}/brand/x.jpg`, "https://cdn.example.com/a.jpg"]);
  for (const u of imgs) assert.match(u, /^https:\/\//);
});

test("validGtin", () => {
  assert.equal(validGtin("036000291452"), "036000291452");
  assert.equal(validGtin("4006381333931"), "4006381333931"); // EAN-13
  assert.equal(validGtin("96385074"), "96385074"); // GTIN-8
  assert.equal(validGtin("036000291453"), null);
  assert.equal(validGtin("1234"), null);
  assert.equal(validGtin("abcdefghijkl"), null);
  assert.equal(validGtin(null), null);
});

test("a distributor record with no copy still gets an honest description", () => {
  const feed = { kind: "tire", sku: "S1", brand: "Acme", model: "Road 1", size: "205/55R16", price: 99 };
  const node = productSchema(feed, ON);
  assert.equal(node.description, "Acme Road 1, size 205/55R16.");
  assert.equal(node.url, `${ORIGIN}/tires/p/S1`);
  assert.equal(node.sku, "S1");
  assert.equal("additionalProperty" in node, false);
});

test("wheels carry their own size and category", () => {
  const w = WHEELS[0];
  const node = productSchema(w, { ...ON, kind: "wheel" });
  assert.match(node.url, /\/wheels\//);
  assert.match(node.category, /^Wheels > /);
  assert.equal(node.size, `${w.diameter}x${w.wheelWidth} ${w.boltPattern}`);
});

test("house rules: no discount, delivery-date, APR or safe-to-drive wording", () => {
  const banned =
    /discount|coupon|rebate|\bdeals?\b|\bsale\b|\bAPR\b|safe to drive|arrives?\b|delivered by|in \d+ (business )?days|strikethrough|\bsince \d{4}\b/i;
  for (const p of ALL) {
    const json = JSON.stringify(productSchema(p, { ...ON, returnWindowDays: 30 }));
    assert.doesNotMatch(json, banned, p.slug);
  }
});

test("JSON-LD output is plain JSON: no undefined, null or empty values", () => {
  for (const p of ALL) {
    const node = productSchema(p, { ...ON, returnWindowDays: 30 });
    const round = JSON.parse(JSON.stringify(node));
    assert.deepEqual(round, node, p.slug);
    for (const obj of objectsOf(node))
      for (const [k, v] of Object.entries(obj))
        assert.ok(
          v !== null && v !== "" && !(Array.isArray(v) && !v.length),
          `${p.slug}.${k}`,
        );
  }
});
