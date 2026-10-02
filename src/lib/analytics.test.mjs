// GA4 conversion events: nothing personal reaches Google.
//
//   npm run test:lib

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import {
  cartParams,
  cleanParams,
  oncePerPage,
  toGaItem,
  trackEvent,
  trackToolUse,
} from "./analytics.js";

let calls;
beforeEach(() => {
  calls = [];
  globalThis.window = {
    location: { pathname: "/tires", search: "", href: "https://tiredroponline.com/tires" },
    gtag: (...args) => calls.push(args),
  };
});
afterEach(() => {
  delete globalThis.window;
});

test("drops personal fields whatever they are called", () => {
  const out = cleanParams({
    form_name: "contact",
    email: "jo@example.com",
    phone: "954-555-0100",
    name: "Jo Driver",
    firstName: "Jo",
    address: "1 Main St",
    street: "1 Main St",
    zip: "33351",
    notes: "call me",
    message: "hello",
    order: "#1001",
    customer: { email: "jo@example.com" },
  });
  assert.deepEqual(out, { form_name: "contact" });
});

test("drops email- and phone-shaped values even under allowed keys", () => {
  assert.deepEqual(cleanParams({ search_term: "jo@example.com" }), {});
  assert.deepEqual(cleanParams({ search_term: "call (954) 555-0100" }), {});
  assert.deepEqual(cleanParams({ search_term: "+1 954.555.0100" }), {});
  assert.deepEqual(cleanParams({ form_name: "9545550100" }), {});
  // Sizes and vehicles pass.
  assert.deepEqual(cleanParams({ search_term: "225/45R17" }), { search_term: "225/45R17" });
  assert.deepEqual(cleanParams({ search_term: "2019 Honda Civic" }), {
    search_term: "2019 Honda Civic",
  });
});

test("a search's result count passes, zero included", () => {
  assert.deepEqual(
    cleanParams({ search_type: "vehicle", search_term: "2019 Toyota Camry", results: 0 }),
    { search_type: "vehicle", search_term: "2019 Toyota Camry", results: 0 },
  );
  trackEvent("view_search_results", { search_type: "tire_size", search_term: "215/55R17", results: 3 });
  assert.deepEqual(calls.at(-1), [
    "event",
    "view_search_results",
    { search_type: "tire_size", search_term: "215/55R17", results: 3 },
  ]);
});

test("items keep GA's item fields only; a numeric SKU survives", () => {
  const out = cleanParams({
    currency: "USD",
    value: 400,
    items: [
      {
        item_id: "1234567890",
        item_name: "N'Priz AH5",
        item_brand: "Nexen",
        price: 100,
        quantity: 4,
        email: "jo@example.com",
        note: "x",
      },
    ],
  });
  assert.deepEqual(out, {
    currency: "USD",
    value: 400,
    items: [
      { item_id: "1234567890", item_name: "N'Priz AH5", item_brand: "Nexen", price: 100, quantity: 4 },
    ],
  });
});

test("trackEvent sends the cleaned params through gtag", () => {
  trackEvent("generate_lead", { form_name: "financing", email: "jo@example.com", phone: "9545550100" });
  assert.deepEqual(calls, [["event", "generate_lead", { form_name: "financing" }]]);
});

test("no-op without gtag or without window (prerender / SSR)", () => {
  delete globalThis.window.gtag;
  assert.doesNotThrow(() => trackEvent("search", { search_term: "225/45R17" }));
  delete globalThis.window;
  assert.doesNotThrow(() => trackEvent("search", { search_term: "225/45R17" }));
  assert.doesNotThrow(() => trackToolUse("tread-gauge"));
});

test("a throwing gtag never breaks the caller; bad event names are ignored", () => {
  globalThis.window.gtag = () => {
    throw new Error("blocked");
  };
  assert.doesNotThrow(() => trackEvent("add_to_cart", {}));
  globalThis.window.gtag = (...a) => calls.push(a);
  trackEvent("Bad Name", {});
  assert.equal(calls.length, 0);
});

test("cart lines map to GA items with sku as item_id", () => {
  const line = {
    id: "t-1",
    sku: "SKU9",
    kind: "tire",
    name: "Pilot Sport 4S",
    brand: "Michelin",
    size: "245/40R18",
    price: 289.99,
    qty: 4,
    install: true,
    key: "t-1:i",
  };
  assert.deepEqual(toGaItem(line), {
    item_id: "SKU9",
    item_name: "Pilot Sport 4S",
    item_brand: "Michelin",
    item_category: "tire",
    item_variant: "245/40R18",
    price: 289.99,
    quantity: 4,
  });
  assert.deepEqual(cartParams([line]).value, 1159.96);
  assert.equal(cartParams([line]).currency, "USD");
});

test("tool_use fires once per page view, again on a new page", () => {
  trackToolUse("tread-gauge");
  trackToolUse("tread-gauge");
  trackToolUse("tpms-light");
  assert.equal(calls.length, 2);
  globalThis.window.location.pathname = "/learn/x";
  trackToolUse("tread-gauge");
  assert.equal(calls.length, 3);
  assert.deepEqual(calls[0], ["event", "tool_use", { tool_id: "tread-gauge" }]);
  let n = 0;
  oncePerPage("k", () => n++);
  oncePerPage("k", () => n++);
  assert.equal(n, 1);
});
