// The order's Vehicle / Size source / Fitment attributes and tags
// (api/_lib/fitmentAttrs.js), and how they reach the draft order and lead.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  FITMENT_TAGS,
  fitmentAttributes,
  fitmentFields,
  orderFitment,
  readFitment,
} from "./fitmentAttrs.js";
import { validateCheckout } from "./validate.js";
import { buildOrder, orderRequestFields } from "./orders.js";
import { buildDraftOrderInput, buildRequestDraftInput } from "./shopify.js";
import { skipReason } from "./forwarder.js";

const line = (size, qty = 4, sku = size) => ({
  sku,
  title: `Tire ${size}`,
  brand: "Test",
  size,
  qty,
  price: 150,
  lineTotal: 150 * qty,
});
const attr = (input, key) => input.customAttributes.find((a) => a.key === key)?.value;

test("readFitment keeps what checks out and drops the rest", () => {
  assert.deepEqual(
    readFitment({ vehicle: " 2021  BMW M340i ", front: "225/40r19", rear: "255/35ZR19", source: "scan-door" }),
    { vehicle: "2021 BMW M340i", front: "225/40R19", rear: "255/35R19", source: "scan-door" },
  );
  // Same front and rear is not staggered.
  assert.equal(readFitment({ front: "225/45R17", rear: "225/45R17" }).rear, null);
  // Bad pieces are dropped, never an error.
  const odd = readFitment({ vehicle: "<script>", front: "not a size", source: "hacked" });
  assert.equal(odd, null);
  assert.deepEqual(readFitment({ vehicle: "2019 Toyota Camry", front: "x", source: "nope" }), {
    vehicle: "2019 Toyota Camry",
    front: null,
    rear: null,
    source: null,
  });
  for (const raw of [null, "x", 3, [], {}]) assert.equal(readFitment(raw), null);
});

test("orderFitment: a matching cart is OK", () => {
  const fit = orderFitment(readFitment({ vehicle: "2019 Toyota Camry", front: "215/55R17", source: "vehicle" }), [line("215/55R17")]);
  assert.equal(fit.status, "match");
  assert.match(fit.summary, /^OK: the cart matches 215\/55R17/);
  assert.deepEqual(fit.tags, []);
});

test("orderFitment: a tire that is not the shopper's size is CHECK + fitment-check", () => {
  const fit = orderFitment(readFitment({ vehicle: "2019 Toyota Camry", front: "215/55R17", source: "typed" }), [line("225/45R17")]);
  assert.equal(fit.status, "check");
  assert.match(fit.summary, /^CHECK: the cart has 225\/45R17, but the size on file is 215\/55R17/);
  assert.deepEqual(fit.tags, [FITMENT_TAGS.check]);
});

test("orderFitment: staggered 2+2 is STAGGERED; one size only is CHECK; scanned is tagged", () => {
  const fitment = readFitment({ vehicle: "2021 BMW M340i", front: "225/40R19", rear: "255/35R19", source: "scan-door" });
  const both = orderFitment(fitment, [line("225/40R19", 2, "F"), line("255/35R19", 2, "R")]);
  assert.equal(both.status, "staggered");
  assert.equal(both.summary, "STAGGERED: 2 front 225/40R19 + 2 rear 255/35R19.");
  assert.deepEqual(both.tags.sort(), [FITMENT_TAGS.scanned, FITMENT_TAGS.staggered].sort());
  assert.equal(both.sourceLabel, "Scanned door sticker");

  const frontOnly = orderFitment(fitment, [line("225/40R19", 4)]);
  assert.equal(frontOnly.status, "check");
  assert.match(frontOnly.summary, /has only the front size/);
  assert.ok(frontOnly.tags.includes(FITMENT_TAGS.check));
  assert.ok(frontOnly.tags.includes(FITMENT_TAGS.staggered));
});

test("orderFitment: a vehicle with no size on file is UNCONFIRMED (no hold tag); wheels only says so", () => {
  const fit = orderFitment(readFitment({ vehicle: "2019 BMW 4 Series", source: "vehicle" }), [line("225/45R17")]);
  assert.equal(fit.status, "unconfirmed");
  assert.deepEqual(fit.tags, [FITMENT_TAGS.unconfirmed]);
  const wheels = orderFitment(readFitment({ front: "225/45R17" }), [{ ...line(null), size: null }]);
  assert.equal(wheels.status, "no-tires");
  assert.equal(orderFitment(null, [line("225/45R17")]), null);
});

test("attributes, lead fields and the Flow's words", () => {
  const fit = orderFitment(
    readFitment({ vehicle: "2021 BMW M340i", front: "225/40R19", rear: "255/35R19", source: "scan-sidewall" }),
    [line("225/40R19", 2, "F"), line("255/35R19", 2, "R")],
  );
  const attrs = Object.fromEntries(fitmentAttributes(fit).map((a) => [a.key, a.value]));
  assert.deepEqual(Object.keys(attrs), ["Vehicle", "Size source", "Front size", "Rear size", "Fitment"]);
  // The Flow's conditions: Size source contains "Scanned", Fitment contains "STAGGERED" / "CHECK".
  assert.match(attrs["Size source"], /Scanned/);
  assert.match(attrs.Fitment, /STAGGERED/);
  assert.ok(Object.values(attrs).every((v) => v.length <= 250));
  assert.deepEqual(fitmentAttributes(null), []);
  assert.match(fitmentFields(null)[0][1], /^NOT GIVEN/);
});

const body = (extra = {}) => ({
  items: [{ sku: "F", qty: 2 }, { sku: "R", qty: 2 }],
  delivery: "ship",
  customer: { name: "Test Buyer", email: "t@example.com", phone: "(954) 555-0100" },
  address: { line1: "1 Main St", city: "Orlando", state: "FL", zip: "32801" },
  ...extra,
});

test("checkout: fitment goes through validation onto the paid and request drafts and the lead", () => {
  const checked = validateCheckout(
    body({ fitment: { vehicle: "2021 BMW M340i", front: "225/40R19", rear: "255/35R19", source: "scan-door" } }),
  );
  assert.equal(checked.ok, true);
  const order = buildOrder(checked.value, [line("225/40R19", 2, "F"), line("255/35R19", 2, "R")]);

  const paid = buildDraftOrderInput(order);
  assert.equal(attr(paid, "Vehicle"), "2021 BMW M340i");
  assert.equal(attr(paid, "Size source"), "Scanned door sticker");
  assert.equal(attr(paid, "Fitment"), "STAGGERED: 2 front 225/40R19 + 2 rear 255/35R19.");
  assert.equal(attr(paid, "Delivery"), "Ship to my address", "existing attributes stay first");
  assert.ok(paid.tags.includes("staggered") && paid.tags.includes("size-scanned"));
  assert.match(paid.note, /Fitment: STAGGERED/);

  const request = buildRequestDraftInput(order);
  assert.ok(request.tags.includes("order-request") && request.tags.includes("staggered"));
  assert.equal(attr(request, "Front size"), "225/40R19");

  const lead = Object.fromEntries(orderRequestFields(order, { name: "#D9" }));
  assert.equal(lead.Vehicle, "2021 BMW M340i");
  assert.equal(lead["Size on file"], "225/40R19 front + 255/35R19 rear");
  assert.match(lead.Fitment, /^STAGGERED/);
});

test("checkout: no fitment, or a junk one, never blocks the order", () => {
  for (const fitment of [undefined, null, "x", { source: "hacked" }]) {
    const checked = validateCheckout(body(fitment === undefined ? {} : { fitment }));
    assert.equal(checked.ok, true);
    assert.equal(checked.value.fitment, null);
    const order = buildOrder(checked.value, [line("225/40R19", 4, "F")]);
    const draft = buildDraftOrderInput(order);
    assert.equal(attr(draft, "Fitment"), undefined);
    assert.ok(!draft.tags.some((t) => Object.values(FITMENT_TAGS).includes(t)));
    assert.match(Object.fromEntries(orderRequestFields(order, null)).Fitment, /^NOT GIVEN/);
  }
});

test("the ATD forwarder never places a fitment-check order, even if the Flow did not run", () => {
  const order = {
    tags: ["vercel-live", "ship-to-home", "fitment-check"],
    displayFinancialStatus: "PAID",
    displayFulfillmentStatus: "UNFULFILLED",
    risk: { recommendation: "ACCEPT", assessments: [] },
  };
  assert.equal(skipReason(order), "fitment-check");
  assert.equal(skipReason({ ...order, tags: ["vercel-live", "ship-to-home", "staggered"] }), null);
});
