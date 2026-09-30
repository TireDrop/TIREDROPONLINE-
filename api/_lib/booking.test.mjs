// Install scheduling hand-off tests (api/_lib/booking.js, INSTALL_BOOKING_URL
// in config.js, src/data/booking.js). Run with: npm run test:api
// Pure functions only; the webhook and /track paths are in webhooks.test.mjs
// and track.test.mjs.

import { test } from "node:test";
import assert from "node:assert/strict";

import { BOOKING_PLACEHOLDERS, getConfig, readBookingTemplate } from "./config.js";
import { statusBody } from "../status.js";
import {
  bookingRefFor,
  contactFromNote,
  fillBookingUrl,
  hasInstallLine,
  installKind,
  needsBooking,
  restPayloadToNode,
  vehicleFor,
} from "./booking.js";
import {
  bookingRefParam,
  bookingRefTag,
  parseBookingRef,
  schedulePath,
} from "../../src/data/booking.js";
import { splitVehicle } from "../../src/data/vehicles.js";

const TEMPLATE =
  "https://booking.example.com/book/{orderRef}?name={name}&email={email}&phone={phone}&vehicle={vehicle}";

// ---- INSTALL_BOOKING_URL -------------------------------------------------------------

test("booking config: unset is internal with no issue; https with known placeholders is external", () => {
  assert.deepEqual(readBookingTemplate(undefined), { mode: "internal", template: null, issues: [] });
  assert.deepEqual(readBookingTemplate("   "), { mode: "internal", template: null, issues: [] });
  assert.deepEqual(readBookingTemplate(` ${TEMPLATE} `), { mode: "external", template: TEMPLATE, issues: [] });
  // No placeholders at all is fine too: a plain booking page.
  assert.equal(readBookingTemplate("https://tireguru.example.net/shop/123/book").mode, "external");
  assert.deepEqual(BOOKING_PLACEHOLDERS, ["orderRef", "name", "email", "phone", "vehicle"]);

  const cfg = getConfig({ INSTALL_BOOKING_URL: TEMPLATE });
  assert.equal(cfg.booking.mode, "external");
  assert.deepEqual(cfg.issues, []);
  assert.equal(getConfig({}).booking.mode, "internal");
});

test("booking config: anything but a clean https link is refused, flagged, and falls back to /schedule", () => {
  const refused = [
    ["http://booking.example.com/{orderRef}", /must be an https:\/\/ URL/],
    ["booking.example.com/{orderRef}", /must be an https:\/\/ URL/],
    ["javascript:alert(1)//https://x", /must be an https:\/\/ URL/],
    ["ftp://booking.example.com/", /must be an https:\/\/ URL/],
    ["https://{name}.example.com/book", /plain host/],
    ["https://user:pw@booking.example.com/book", /plain host/],
    ["https:///book", /https|plain host/],
    ["https://booking.example.com/book?who={customer}", /unknown placeholder \(\{customer\}\)/],
    ["https://booking.example.com/book?who={name", /unknown placeholder/],
    ["https://booking.example.com/book now", /spaces/],
  ];
  for (const [value, message] of refused) {
    const read = readBookingTemplate(value);
    assert.equal(read.mode, "internal", value);
    assert.equal(read.template, null, value);
    assert.match(read.issues[0], message, value);
    assert.match(read.issues[0], /Install booking uses \/schedule/, value);
    const body = statusBody(getConfig({ INSTALL_BOOKING_URL: value }));
    assert.equal(body.booking, "internal", value);
    assert.ok(body.issues.some((i) => i.startsWith("INSTALL_BOOKING_URL")), value);
  }
});

test("booking config: status shows only the mode, never the link; TIREGURU_* never sets it", () => {
  const secretish = "https://book.example.com/s/very-private-shop-token/{orderRef}";
  const body = statusBody(getConfig({ INSTALL_BOOKING_URL: secretish }));
  assert.equal(body.booking, "external");
  assert.equal(body.issues, undefined);
  assert.ok(!JSON.stringify(body).includes("very-private-shop-token"), "the link never reaches /api/status");
  assert.equal(statusBody(getConfig({})).booking, "internal");

  const tg = getConfig({ TIREGURU_BOOKING_URL: TEMPLATE });
  assert.equal(tg.booking.mode, "internal", "the retired TIREGURU_ prefix is not a booking link");
  assert.ok(tg.issues.some((i) => i.includes("TIREGURU_BOOKING_URL is ignored")));
  // A booking link never switches payment on.
  assert.equal(getConfig({ INSTALL_BOOKING_URL: TEMPLATE }).checkout, "request");
});

// ---- the link builder --------------------------------------------------------------------

test("booking link: every placeholder is filled URL-encoded", () => {
  const url = fillBookingUrl(TEMPLATE, {
    orderRef: "#1001",
    name: "Ana María O'Neil & Co",
    email: "a+b@example.com",
    phone: "(954) 555-0100",
    vehicle: "2020 Toyota Camry LE/SE?x=1#frag",
  });
  assert.equal(
    url,
    "https://booking.example.com/book/%231001?name=Ana%20Mar%C3%ADa%20O%27Neil%20%26%20Co&email=a%2Bb%40example.com&phone=(954)%20555-0100&vehicle=2020%20Toyota%20Camry%20LE%2FSE%3Fx%3D1%23frag",
  );
  const parsed = new URL(url);
  assert.equal(parsed.host, "booking.example.com");
  assert.equal(parsed.pathname, "/book/%231001");
  assert.equal(parsed.hash, "", "a # in a value cannot start a fragment");
  assert.deepEqual(Object.fromEntries(parsed.searchParams), {
    name: "Ana María O'Neil & Co",
    email: "a+b@example.com",
    phone: "(954) 555-0100",
    vehicle: "2020 Toyota Camry LE/SE?x=1#frag",
  });
});

test("booking link: missing values fill as empty; the same placeholder twice; nothing else is touched", () => {
  assert.equal(
    fillBookingUrl("https://b.example.com/?r={orderRef}&again={orderRef}&v={vehicle}", { orderRef: "TD-260929-ABC234" }),
    "https://b.example.com/?r=TD-260929-ABC234&again=TD-260929-ABC234&v=",
  );
  assert.equal(fillBookingUrl("https://b.example.com/shop/7", { name: "x" }), "https://b.example.com/shop/7");
  assert.equal(fillBookingUrl("", { name: "x" }), null);
  assert.equal(fillBookingUrl(null, {}), null);
  // A value can never move the link to another host or scheme.
  const sneaky = fillBookingUrl("https://b.example.com/{name}", { name: "@evil.example.com/x" });
  assert.equal(new URL(sneaky).host, "b.example.com");
  assert.equal(fillBookingUrl("http://b.example.com/{name}", { name: "x" }), null);
});

// ---- order facts ------------------------------------------------------------------------

const node = (over = {}) => ({
  name: "#1001",
  displayFinancialStatus: "PAID",
  displayFulfillmentStatus: "UNFULFILLED",
  cancelledAt: null,
  tags: [],
  customAttributes: [],
  shippingLine: { title: "Free Shipping" },
  lineItems: { nodes: [{ title: "Michelin Defender2 215/55R17" }] },
  note: "",
  ...over,
});

test("install kind: ship-to-store, pickup, mobile and install lines count; plain shipping does not", () => {
  assert.equal(installKind(node({ customAttributes: [{ key: "Delivery", value: "Ship to store for install (Extreme Tires, Sunrise)" }] })), "shop");
  assert.equal(installKind(node({ tags: ["ship-to-store"] })), "shop");
  assert.equal(installKind(node({ shippingLine: { title: "Pickup at Extreme Tires (Sunrise, FL)" } })), "shop");
  assert.equal(installKind(node({ customAttributes: [{ key: "Delivery", value: "Mobile install at my address" }] })), "mobile");
  assert.equal(installKind(node({ tags: ["mobile-install"] })), "mobile");
  assert.equal(installKind(node({ lineItems: { nodes: [{ title: "Tire" }, { title: "Tire Installation (per tire)" }] } })), "shop");
  assert.equal(
    installKind(node({ note: "TireDrop live order TD-260929-ABC234\nCustomer notes: Vehicle: 2020 Toyota Camry\nInstall at the shop: 4x Michelin Defender2" })),
    "shop",
  );
  assert.equal(installKind(node()), null);
  assert.equal(installKind(node({ tags: ["ship-to-home"], customAttributes: [{ key: "Delivery", value: "Ship to my address" }] })), null);
  assert.equal(hasInstallLine(node({ note: "Customer notes: please do not install anything" })), false);
});

test("needs booking: paid, not cancelled, not fulfilled, and an install", () => {
  const store = { tags: ["ship-to-store"] };
  assert.equal(needsBooking(node(store)), true);
  assert.equal(needsBooking(node({ ...store, displayFinancialStatus: "PENDING" })), false);
  assert.equal(needsBooking(node({ ...store, displayFinancialStatus: "REFUNDED" })), false);
  assert.equal(needsBooking(node({ ...store, cancelledAt: "2026-09-29T10:00:00Z" })), false);
  assert.equal(needsBooking(node({ ...store, displayFulfillmentStatus: "FULFILLED" })), false);
  assert.equal(needsBooking(node()), false, "shipped to the customer: nothing to book");
  assert.equal(needsBooking(null), false);
});

test("orders/paid REST payload maps onto the order shape installKind reads", () => {
  const n = restPayloadToNode({
    tags: "vercel-live, ship-to-store ,  ",
    note_attributes: [{ name: "Delivery", value: "Ship to store for install (Extreme Tires, Sunrise)" }],
    shipping_lines: [{ title: "Pickup at Extreme Tires (Sunrise, FL)" }],
    line_items: [{ title: "Tire", name: "Tire - 225/45R17" }, { name: "Install" }],
    note: "hello",
  });
  assert.deepEqual(n, {
    tags: ["vercel-live", "ship-to-store"],
    customAttributes: [{ key: "Delivery", value: "Ship to store for install (Extreme Tires, Sunrise)" }],
    shippingLine: { title: "Pickup at Extreme Tires (Sunrise, FL)" },
    lineItems: { nodes: [{ title: "Tire" }, { title: "Install" }] },
    note: "hello",
  });
  assert.equal(installKind(n), "shop");
  // The minimal payloads Shopify test notifications send.
  assert.equal(installKind(restPayloadToNode({ id: 1, name: "#1" })), null);
  assert.equal(installKind(restPayloadToNode(null)), null);
});

test("booking ref, vehicle and contact come from the order", () => {
  assert.equal(bookingRefFor(node({ customAttributes: [{ key: "Order ref", value: "td-260929-abc234" }] })), "TD-260929-ABC234");
  assert.equal(bookingRefFor(node({ note: "TireDrop live order TD-260929-XYZ789\nCustomer: A B, 954" })), "TD-260929-XYZ789");
  assert.equal(bookingRefFor(node()), "#1001", "a storefront order has only its number");
  assert.equal(bookingRefFor(node({ name: "weird" })), null);

  const note = "TireDrop live order TD-260929-XYZ789\nCustomer: Ana María Pérez, (954) 555-0100\nDelivery: Ship to store for install (Extreme Tires, Sunrise)\nCustomer notes: Vehicle: 2020 Toyota Camry LE\nInstall at the shop: 4x Tire";
  assert.equal(vehicleFor(node({ note })), "2020 Toyota Camry LE");
  assert.equal(vehicleFor(node({ note, customAttributes: [{ key: "Vehicle", value: " 2019  Honda Civic " }] })), "2019 Honda Civic");
  assert.equal(vehicleFor(node()), "");
  assert.deepEqual(contactFromNote(node({ note })), { name: "Ana María Pérez", phone: "(954) 555-0100" });
  assert.deepEqual(contactFromNote(node({ note: "Customer notes: call me" })), { name: "", phone: "" });
});

test("booking ref parsing (shared with /schedule): TD- refs and order numbers only", () => {
  assert.equal(parseBookingRef("TD-260929-ABC234"), "TD-260929-ABC234");
  assert.equal(parseBookingRef(" td-260929-abc234 "), "TD-260929-ABC234");
  assert.equal(parseBookingRef("#1001"), "#1001");
  assert.equal(parseBookingRef("1001"), "#1001");
  for (const bad of ["", "TD-261332-ABC234", "TD-260229-ABC234x", "TD-260929-ABC1O0", "<script>", "1001; drop", "#", "12345678901", null, 42]) {
    assert.equal(parseBookingRef(bad), null, String(bad));
  }
  assert.equal(parseBookingRef("TD-240229-ABC234"), "TD-240229-ABC234", "a leap day is a real date");
  assert.equal(bookingRefParam("#1001"), "1001");
  assert.equal(schedulePath("#1001"), "/schedule?order=1001");
  assert.equal(schedulePath("TD-260929-ABC234"), "/schedule?order=TD-260929-ABC234");
  assert.equal(bookingRefTag("TD-260929-ABC234"), "order-TD-260929-ABC234");
  assert.equal(bookingRefTag("#1001"), "order-1001");
});

test("vehicle text splits into the booking form's year, make and model", () => {
  assert.deepEqual(splitVehicle("2020 Toyota Camry LE"), { year: "2020", make: "Toyota", model: "Camry LE" });
  assert.deepEqual(splitVehicle("2019 Land Rover Range Rover Sport"), { year: "2019", make: "Land Rover", model: "Range Rover Sport" });
  assert.deepEqual(splitVehicle("1978 Studebaker Lark Regal"), { year: "1978", make: "Studebaker", model: "Lark Regal" });
  assert.deepEqual(splitVehicle("Camry"), { year: "", make: "", model: "" });
  assert.deepEqual(splitVehicle(""), { year: "", make: "", model: "" });
});
