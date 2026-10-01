// Install booking for a paid order (POST /api/book-install, and /schedule?order=
// through /api/forms). Run with: npm run test:api
//
// Shopify is a small in-memory store: it answers the order reads and applies
// every write (order note, metafield, tags, the lead customer), so a second
// request sees what the first one wrote. Nothing here touches a real store.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { createBookInstallHandler, resetBookInstallRateLimit } from "../book-install.js";
import { fillToken } from "../../src/data/formGuard.js";
import { createTrackHandler, resetTrackRateLimit, TRACK_RATE_LIMIT } from "../track.js";
import { createFormsHandler, resetFormsRateLimit } from "../forms.js";
import { clearAppScopeCache } from "./shopify.js";
import {
  BOOK_FAILED,
  BOOK_NOT_FOUND,
  BOOK_OUT_OF_AREA,
  BOOKING_NOTE_PREFIX,
  appendNoteLine,
  bookingFromNote,
  bookingNoteLine,
  readInstallBooking,
  validateBookInstall,
} from "./installBooking.js";
import {
  addDays,
  formatInstallDay,
  installSlotErrors,
  parseInstallDay,
  shopToday,
} from "../../src/data/booking.js";

const ENV = Object.freeze({
  SHOPIFY_STORE_DOMAIN: "tiredrop-test.myshopify.com",
  SHOPIFY_ADMIN_TOKEN: "shpat_test_token",
});

// Wednesday 30 September 2026, 10:00 in Florida. Tomorrow is Thursday 1 October.
const NOW = Date.parse("2026-09-30T14:00:00Z");
const TOMORROW = "2026-10-01";
const SATURDAY = "2026-10-03";
const SUNDAY = "2026-10-04";

const STORE_NOTE =
  "TireDrop live order TD-260920-ABCDEF\nCustomer: Buyer Person, (954) 555-0100\nDelivery: Ship to store for install (Extreme Tires, Sunrise)\nCustomer notes: Vehicle: 2020 Toyota Camry LE";

function paidStoreOrder(over = {}) {
  return {
    id: "gid://shopify/Order/7001",
    name: "#1002",
    createdAt: "2026-09-29T15:04:00Z",
    email: "Buyer@Example.com",
    note: STORE_NOTE,
    cancelledAt: null,
    displayFinancialStatus: "PAID",
    displayFulfillmentStatus: "UNFULFILLED",
    tags: ["vercel-live", "ship-to-store", "needs-scheduling"],
    customAttributes: [
      { key: "Delivery", value: "Ship to store for install (Extreme Tires, Sunrise)" },
      { key: "Order ref", value: "TD-260920-ABCDEF" },
    ],
    shippingLine: { title: "Pickup at Extreme Tires (Sunrise, FL)" },
    lineItems: { nodes: [{ title: "Michelin Defender2 215/55R17", quantity: 4, currentQuantity: 4 }] },
    fulfillments: [],
    installBooking: null,
    ...over,
  };
}

/**
 * The in-memory store. `failOn` names an operation that answers with a
 * userError (once, or every time with `failAlways`); `scopes` is what
 * currentAppInstallation lists.
 */
function fakeShop({
  orders = [paidStoreOrder()],
  customers = [],
  scopes = ["read_orders", "write_orders", "read_customers", "write_customers"],
  failOn = null,
  failAlways = false,
} = {}) {
  const calls = [];
  let failed = false;
  const store = { orders, customers };
  const byId = (id) => [...store.orders, ...store.customers].find((n) => n.id === id);
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body);
    const op = body.query.match(/^(?:query|mutation) (\w+)/)[1];
    const v = body.variables;
    calls.push({ op, variables: structuredClone(v) });
    if (failOn === op && (failAlways || !failed)) {
      failed = true;
      const root = body.query.match(/\{\s*(\w+)\s*\(/)[1];
      return Response.json({ data: { [root]: { userErrors: [{ field: null, message: "Shopify said no" }] } } });
    }
    switch (op) {
      case "appAccessScopes":
        return Response.json({ data: { currentAppInstallation: { accessScopes: scopes.map((handle) => ({ handle })) } } });
      case "trackOrder":
      case "bookingOrdersByEmail":
        // Loose search: every order comes back, the code's own checks decide.
        return Response.json({ data: { orders: { nodes: structuredClone(store.orders) } } });
      case "bookingServiceZip":
        return Response.json({ data: { order: { shippingAddress: byId(v.id)?.shippingAddress ?? null } } });
      case "bookingContact":
        return Response.json({
          data: { order: { phone: "+19545550199", shippingAddress: null, billingAddress: { name: "Billing Name", phone: null }, customer: { displayName: "Buyer Person" } } },
        });
      case "bookingOrderUpdate": {
        const o = byId(v.input.id);
        o.note = v.input.note;
        for (const m of v.input.metafields ?? []) {
          if (`${m.namespace}.${m.key}` === "tiredrop.install_booking") o.installBooking = { value: m.value };
        }
        return Response.json({ data: { orderUpdate: { order: { id: o.id }, userErrors: [] } } });
      }
      case "bookingTagsAdd":
      case "leadTagsAdd": {
        const n = byId(v.id);
        for (const t of v.tags) if (!n.tags.includes(t)) n.tags.push(t);
        return Response.json({ data: { tagsAdd: { node: { id: n.id }, userErrors: [] } } });
      }
      case "bookingTagsRemove":
      case "leadTagsRemove": {
        const n = byId(v.id);
        n.tags = n.tags.filter((t) => !v.tags.includes(t));
        return Response.json({ data: { tagsRemove: { node: { id: n.id }, userErrors: [] } } });
      }
      case "leadCustomer": {
        const c = store.customers.find((x) => x.email === v.identifier.emailAddress);
        // What the query asks for: no note (it is never read or written for
        // an existing customer).
        const leads = c?.metafields?.["tiredrop.leads"];
        return Response.json({ data: { customer: c ? { id: c.id, tags: c.tags, leads: leads ? { value: leads.value } : null } : null } });
      }
      case "leadCustomerCreate": {
        const c = { id: `gid://shopify/Customer/${900 + store.customers.length}`, email: v.input.email, note: "", tags: [], metafields: {}, input: v.input };
        store.customers.push(c);
        return Response.json({ data: { customerCreate: { customer: { id: c.id }, userErrors: [] } } });
      }
      case "leadNoteUpdate": {
        byId(v.input.id).note = v.input.note;
        return Response.json({ data: { customerUpdate: { customer: { id: v.input.id }, userErrors: [] } } });
      }
      case "leadMetafieldSet": {
        for (const m of v.metafields) byId(m.ownerId).metafields[`${m.namespace}.${m.key}`] = m;
        return Response.json({ data: { metafieldsSet: { metafields: [{ id: "m" }], userErrors: [] } } });
      }
      default:
        throw new Error(`unexpected ${op}`);
    }
  };
  return { calls, store, fetchImpl, ops: () => calls.map((c) => c.op) };
}

function logger() {
  const lines = [];
  const push = (...a) => lines.push(a.join(" "));
  return { lines, log: { log: push, warn: push, error: push } };
}

// What a real page sends with every form: the fill-time token of a form that
// was on screen for 8 seconds (src/data/formGuard.js). A test that sends its
// own `ft` (or none) keeps it.
const withFillToken = (body) =>
  body && typeof body === "object" && !Array.isArray(body) && !("ft" in body)
    ? { ...body, ft: fillToken(1_000_000, 1_008_000) }
    : body;

let ipCounter = 0;
async function post(handler, body, { ip } = {}) {
  ipCounter += 1;
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(text) { this.body = text === undefined ? undefined : JSON.parse(text); },
  };
  await handler({ method: "POST", headers: { "x-forwarded-for": ip ?? `10.1.0.${ipCounter}` }, body: withFillToken(body) }, res);
  return res;
}

function bookHandler(shop, { env = ENV, now = NOW } = {}) {
  const l = logger();
  const handler = createBookInstallHandler({
    env: { ...env },
    shopify: { fetchImpl: shop.fetchImpl, retryDelayMs: 0, log: l.log },
    now: () => now,
  });
  return { handler, lines: l.lines };
}

const REQUEST = Object.freeze({
  order: "#1002",
  email: "buyer@example.com",
  day: TOMORROW,
  window: "8-10am",
  notes: "Locking lug nuts; key is in the glovebox",
  website: "",
});

// The lead only ever ADDS customer tags; the order's needs-scheduling is the
// one tag removed, on the verified order.
const WRITES = ["bookingOrderUpdate", "leadCustomer", "leadCustomerCreate", "leadMetafieldSet", "leadNoteUpdate", "leadTagsAdd", "bookingTagsAdd", "bookingTagsRemove"];

beforeEach(() => {
  resetTrackRateLimit();
  resetFormsRateLimit();
  resetBookInstallRateLimit();
  clearAppScopeCache();
});

// ---- happy path --------------------------------------------------------------------------

// ---- mobile install: the service area (src/data/serviceArea.js) ---------------------------

function paidMobileOrder(zip) {
  return paidStoreOrder({
    note: "TireDrop live order TD-260920-ABCDEF\nCustomer: Buyer Person, (954) 555-0100\nDelivery: Mobile install at my address",
    tags: ["vercel-live", "mobile-install", "needs-scheduling"],
    customAttributes: [
      { key: "Delivery", value: "Mobile install at my address" },
      { key: "Order ref", value: "TD-260920-ABCDEF" },
    ],
    shippingLine: null,
    shippingAddress: zip === null ? null : { zip },
  });
}

test("book-install: a mobile order whose service ZIP is outside the area is a 400 and nothing is written", async () => {
  for (const zip of ["33440", "33455", "33471", "33475", "33040", "33037", "33455-1234"]) {
    resetTrackRateLimit();
    const shop = fakeShop({ orders: [paidMobileOrder(zip)] });
    const { handler, lines } = bookHandler(shop);
    const res = await post(handler, REQUEST);
    assert.equal(res.statusCode, 400, zip);
    assert.deepEqual(res.body, { error: BOOK_OUT_OF_AREA, field: null }, zip);
    assert.deepEqual(shop.ops(), ["trackOrder", "bookingServiceZip"], zip);
    assert.ok(shop.store.orders[0].tags.includes("needs-scheduling"), zip);
    assert.ok(lines.some((l) => l.includes(`ZIP ${zip}, outside the service area`)), zip);
  }
  assert.equal(
    BOOK_OUT_OF_AREA,
    "That ZIP is outside our mobile service area (Miami-Dade, Broward and Palm Beach). Ship to our Sunrise shop instead, or call (954) 773-1896.",
  );
});

test("book-install: a mobile order inside the area books; no readable ZIP skips the check; shop orders never read it", async () => {
  for (const zip of ["33351", "33301", "33480", "33012", null]) {
    resetTrackRateLimit();
    clearAppScopeCache();
    const shop = fakeShop({ orders: [paidMobileOrder(zip)] });
    const res = await post(bookHandler(shop).handler, REQUEST);
    assert.equal(res.statusCode, 200, String(zip));
    assert.equal(res.body.alreadyBooked, false);
    assert.deepEqual(shop.ops().slice(0, 3), ["trackOrder", "bookingServiceZip", "appAccessScopes"]);
    assert.ok(shop.store.orders[0].tags.includes("install-booked"));
  }
  const store = fakeShop();
  await post(bookHandler(store).handler, REQUEST);
  assert.ok(!store.ops().includes("bookingServiceZip"), "an in-shop install needs no ZIP");
});

test("book-install: a paid ship-to-store order is booked on the order, and info@ gets a [BOOKED] lead", async () => {
  const shop = fakeShop();
  const { handler, lines } = bookHandler(shop);
  const res = await post(handler, { ...REQUEST, email: " BUYER@example.COM " });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["cache-control"], "no-store");
  assert.deepEqual(res.body, {
    ok: true,
    alreadyBooked: false,
    booking: {
      day: "2026-10-01",
      window: "8-10am",
      dayLabel: "Thursday, October 1, 2026",
      windowLabel: "8:00 – 10:00 AM",
      notes: "Locking lug nuts; key is in the glovebox",
    },
  });
  assert.deepEqual(shop.ops(), ["trackOrder", "appAccessScopes", "bookingContact", ...WRITES]);
  assert.deepEqual(shop.calls[0].variables, { query: "name:#1002 email:buyer@example.com" });

  const order = shop.store.orders[0];
  // Tags: install-booked added, needs-scheduling removed, the rest untouched.
  assert.deepEqual(order.tags, ["vercel-live", "ship-to-store", "install-booked"]);
  assert.deepEqual(shop.calls.find((c) => c.op === "bookingTagsAdd").variables, { id: order.id, tags: ["install-booked"] });
  assert.deepEqual(shop.calls.find((c) => c.op === "bookingTagsRemove").variables, { id: order.id, tags: ["needs-scheduling"] });

  // The note is appended to, never replaced.
  assert.equal(
    order.note,
    `${STORE_NOTE}\nInstall booked (customer request): Thursday, October 1, 2026, 8:00 – 10:00 AM. Notes: Locking lug nuts; key is in the glovebox`,
  );
  assert.ok(order.note.startsWith(STORE_NOTE));

  // The metafield carries the booking as JSON.
  const update = shop.calls.find((c) => c.op === "bookingOrderUpdate").variables.input;
  assert.deepEqual(update.metafields.map(({ namespace, key, type }) => ({ namespace, key, type })), [
    { namespace: "tiredrop", key: "install_booking", type: "json" },
  ]);
  assert.deepEqual(JSON.parse(order.installBooking.value), {
    day: "2026-10-01",
    window: "8-10am",
    notes: "Locking lug nuts; key is in the glovebox",
    bookedAt: "2026-09-30T14:00:00.000Z",
  });

  // The lead: the existing lead mechanism, tagged install-booking + order-<ref>.
  const customer = shop.store.customers[0];
  const lead = customer.metafields["tiredrop.last_lead"].value;
  assert.ok(lead.startsWith("[BOOKED] #1002: Thursday, October 1, 2026 8:00 – 10:00 AM\n"), lead);
  assert.match(lead, /\nTireDrop install booking request — 2026-09-30 10:00 ET\n/);
  assert.match(lead, /\nName: Buyer Person\n/);
  assert.match(lead, /\nEmail: buyer@example\.com\n/);
  assert.match(lead, /\nPhone: \+19545550199\n/);
  // Matched against the order, and the alert says that is all it is.
  assert.match(lead, /\nEmail check: Matches the email on paid order #1002; not otherwise verified\.\n/);
  assert.match(lead, /\nPaid order: #1002 \(TD-260920-ABCDEF\)\n/);
  assert.match(lead, /\nVehicle: 2020 Toyota Camry LE\n/);
  assert.match(lead, /\nWhere: At the shop \(7712 West Oakland Park Blvd, Sunrise, FL 33351\)\n/);
  assert.ok(customer.note.startsWith("[BOOKED] #1002:"), "a NEW customer's note starts with the booked line");
  assert.deepEqual(customer.tags, ["new-lead", "lead", "lead-booking", "install-booking", "order-TD-260920-ABCDEF"]);
  assert.equal(customer.input.email, "buyer@example.com");
  assert.equal(customer.input.phone, "+19545550199");
  assert.ok(lines.some((l) => l.includes("#1002: booked")));
});

test("book-install: a TD- ref finds the order among that email's orders", async () => {
  const other = paidStoreOrder({ id: "gid://shopify/Order/6999", name: "#1001", customAttributes: [{ key: "Delivery", value: "Ship to store for install (Extreme Tires, Sunrise)" }], note: "" });
  const shop = fakeShop({ orders: [other, paidStoreOrder()] });
  const res = await post(bookHandler(shop).handler, { ...REQUEST, order: "td-260920-abcdef" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(shop.calls[0], { op: "bookingOrdersByEmail", variables: { query: "email:buyer@example.com" } });
  assert.ok(shop.store.orders[1].tags.includes("install-booked"));
  assert.ok(!other.tags.includes("install-booked"), "only the order with that ref");
});

// ---- verification ------------------------------------------------------------------------------

test("book-install: wrong email, unknown number, unpaid, cancelled, fulfilled and non-install orders all get the same 404 and nothing is written", async () => {
  const cases = [
    [fakeShop(), { email: "someone@else.com" }],
    [fakeShop(), { order: "#9999" }],
    [fakeShop({ orders: [] }), {}],
    [fakeShop({ orders: [paidStoreOrder({ displayFinancialStatus: "PENDING" })] }), {}],
    [fakeShop({ orders: [paidStoreOrder({ displayFinancialStatus: "PARTIALLY_PAID" })] }), {}],
    [fakeShop({ orders: [paidStoreOrder({ cancelledAt: "2026-09-29T20:00:00Z" })] }), {}],
    [fakeShop({ orders: [paidStoreOrder({ displayFulfillmentStatus: "FULFILLED" })] }), {}],
    [
      fakeShop({
        orders: [paidStoreOrder({
          tags: ["vercel-live", "ship-to-home"],
          customAttributes: [{ key: "Delivery", value: "Ship to my address" }],
          shippingLine: { title: "Free Shipping" },
          note: "TireDrop live order TD-260920-ABCDEF",
        })],
      }),
      {},
    ],
  ];
  for (const [shop, over] of cases) {
    const res = await post(bookHandler(shop).handler, { ...REQUEST, ...over });
    assert.equal(res.statusCode, 404, JSON.stringify(over));
    assert.deepEqual(res.body, { error: BOOK_NOT_FOUND });
    assert.ok(shop.ops().every((op) => op === "trackOrder"), `no write for ${JSON.stringify(over)}: ${shop.ops()}`);
  }
  assert.doesNotMatch(BOOK_NOT_FOUND, /paid\b.*\bnot|unpaid|cancel/i, "the message does not say why");

  // The honeypot: the same 404, and Shopify is never asked.
  const shop = fakeShop();
  const bot = await post(bookHandler(shop).handler, { ...REQUEST, website: "http://spam" });
  assert.deepEqual([bot.statusCode, bot.body], [404, { error: BOOK_NOT_FOUND }]);
  assert.equal(shop.calls.length, 0);
});

// ---- idempotent ---------------------------------------------------------------------------------

test("book-install: an order already tagged install-booked returns its booking and changes nothing", async () => {
  const booked = paidStoreOrder({
    tags: ["vercel-live", "ship-to-store", "install-booked"],
    installBooking: { value: JSON.stringify({ day: "2026-10-06", window: "2-4pm", notes: "", bookedAt: "2026-09-29T18:00:00Z" }) },
  });
  const shop = fakeShop({ orders: [booked] });
  const res = await post(bookHandler(shop).handler, { ...REQUEST, day: "2026-10-09", window: "10-12pm" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    ok: true,
    alreadyBooked: true,
    booking: { day: "2026-10-06", window: "2-4pm", dayLabel: "Tuesday, October 6, 2026", windowLabel: "2:00 – 4:00 PM", notes: "" },
  });
  assert.deepEqual(shop.ops(), ["trackOrder"], "no scope read, no write");
  assert.deepEqual(booked.tags, ["vercel-live", "ship-to-store", "install-booked"]);
  assert.equal(booked.note, STORE_NOTE);

  // With no metafield (booked before it existed, or written by hand), the note line is read.
  const noteOnly = paidStoreOrder({
    tags: ["install-booked", "ship-to-store"],
    note: `${STORE_NOTE}\n${BOOKING_NOTE_PREFIX}Saturday, October 3, 2026, 10:00 AM – 12:00 PM. Notes: none`,
  });
  const shop2 = fakeShop({ orders: [noteOnly] });
  const res2 = await post(bookHandler(shop2).handler, REQUEST);
  assert.deepEqual(res2.body.booking, { day: "2026-10-03", window: "10-12pm", dayLabel: "Saturday, October 3, 2026", windowLabel: "10:00 AM – 12:00 PM", notes: "" });
  assert.equal(res2.body.alreadyBooked, true);
  assert.deepEqual(shop2.ops(), ["trackOrder"]);

  // A second request after a real booking: the first booking stands.
  const shop3 = fakeShop();
  const { handler } = bookHandler(shop3);
  await post(handler, REQUEST);
  const writes = shop3.calls.length;
  const again = await post(handler, { ...REQUEST, day: "2026-10-02", window: "12-2pm" });
  assert.deepEqual([again.body.alreadyBooked, again.body.booking.day, again.body.booking.window], [true, TOMORROW, "8-10am"]);
  assert.equal(shop3.calls.length, writes + 1, "one read, no writes");
  assert.equal(shop3.store.customers[0].tags.filter((t) => t === "install-booking").length, 1);
});

// ---- day and window ------------------------------------------------------------------------------

test("book-install: bad day or window is a 400 naming the field, before Shopify is asked", async () => {
  const shop = fakeShop();
  const { handler } = bookHandler(shop);
  const cases = [
    [{ day: "2026-09-30" }, "day", /Thursday, October 1, 2026 or later/],
    [{ day: "2026-09-29" }, "day", /or later/],
    [{ day: SUNDAY }, "day", /closed Sunday/],
    [{ day: addDays("2026-09-30", 61) }, "day", /up to Sunday, November 29, 2026/],
    [{ day: "2026-02-30" }, "day", /valid date/],
    [{ day: "10/01/2026" }, "day", /valid date/],
    [{ day: "" }, "day", /Pick the day/],
    [{ window: "" }, "window", /Choose an arrival window/],
    [{ window: "6-8pm" }, "window", /one of the arrival windows/],
    [{ window: "8:00 – 10:00 AM" }, "window", /one of the arrival windows/],
    [{ day: SATURDAY, window: "4-6pm" }, "window", /Saturday closes at 4:00 PM/],
    [{ notes: "x".repeat(501) }, "notes", /too long/],
    [{ order: "1002 OR tag:vip" }, "order", /order number/],
    [{ email: "not-an-email" }, "email", /email/],
  ];
  for (const [over, field, message] of cases) {
    const res = await post(handler, { ...REQUEST, ...over });
    assert.equal(res.statusCode, 400, JSON.stringify(over));
    assert.equal(res.body.field, field, JSON.stringify(over));
    assert.match(res.body.error, message, JSON.stringify(over));
  }
  assert.equal(shop.calls.length, 0);

  // The edges that are allowed: tomorrow, day 60, Saturday before 4, 4-6 PM on a weekday.
  for (const over of [{ day: TOMORROW }, { day: addDays("2026-09-28", 60) }, { day: SATURDAY, window: "2-4pm" }, { day: "2026-10-02", window: "4-6pm" }]) {
    const v = validateBookInstall({ ...REQUEST, ...over }, new Date(NOW));
    assert.equal(v.ok, true, JSON.stringify(over));
  }
});

test("booking days are Florida days, whatever the server's clock zone", () => {
  // 23:30 in Florida on 30 September is already 1 October in UTC.
  const lateNight = new Date("2026-10-01T03:30:00Z");
  assert.equal(shopToday(lateNight), "2026-09-30");
  assert.equal(validateBookInstall({ ...REQUEST, day: "2026-10-01" }, lateNight).ok, true, "tomorrow in Florida");
  assert.equal(validateBookInstall({ ...REQUEST, day: "2026-09-30" }, lateNight).ok, false, "today in Florida");
  assert.deepEqual(installSlotErrors({ date: "2026-10-01", window: "8-10am" }, { today: "2026-09-30" }), {});
  assert.equal(formatInstallDay("2026-10-01"), "Thursday, October 1, 2026");
  assert.equal(parseInstallDay("Thursday, October 1, 2026"), "2026-10-01");
  assert.equal(parseInstallDay("Thursday, Octember 1, 2026"), null);
});

// ---- failures ---------------------------------------------------------------------------------------

test("book-install: a Shopify write failing midway is a 502, never a success, and the log says what is left", async () => {
  // The install-booked tag fails after the note and the lead went through.
  const shop = fakeShop({ failOn: "bookingTagsAdd" });
  const { handler, lines } = bookHandler(shop);
  const res = await post(handler, REQUEST);
  assert.equal(res.statusCode, 502);
  assert.deepEqual(res.body, { error: BOOK_FAILED });
  assert.doesNotMatch(BOOK_FAILED, /booked|confirmed|you're all set/i);
  const order = shop.store.orders[0];
  assert.ok(!order.tags.includes("install-booked"));
  assert.ok(order.tags.includes("needs-scheduling"), "the reminder still fires if nobody fixes it");
  assert.ok(!shop.ops().includes("bookingTagsRemove"), "stops at the failed step");
  const logged = lines.find((l) => l.includes("FAILED at"));
  assert.ok(logged, lines.join("\n"));
  assert.match(logged, /FAILED at "tag install-booked"/);
  assert.match(logged, /Done: order note \+ tiredrop\.install_booking metafield; booking lead/);
  assert.match(logged, /Not done: tag install-booked; remove tag needs-scheduling/);

  // The customer tries again: the note line is not added twice, and it books.
  const retry = await post(handler, REQUEST);
  assert.equal(retry.statusCode, 200);
  assert.equal(retry.body.alreadyBooked, false);
  assert.equal(order.note.split("\n").filter((l) => l.startsWith(BOOKING_NOTE_PREFIX)).length, 1);
  assert.deepEqual(order.tags, ["vercel-live", "ship-to-store", "install-booked"]);

  // The first write failing: nothing else is attempted.
  clearAppScopeCache();
  const early = fakeShop({ failOn: "bookingOrderUpdate", failAlways: true });
  const r2 = bookHandler(early);
  const res2 = await post(r2.handler, REQUEST);
  assert.equal(res2.statusCode, 502);
  assert.deepEqual(early.ops(), ["trackOrder", "appAccessScopes", "bookingContact", "bookingOrderUpdate"]);
  assert.equal(early.store.customers.length, 0, "no lead");
  assert.ok(r2.lines.some((l) => /Done: nothing\./.test(l)));

  // Removing needs-scheduling fails last: still reported as a failure. The
  // order is already install-booked, so the Flow stays quiet and a retry
  // shows the booking.
  const late = fakeShop({ failOn: "bookingTagsRemove", failAlways: true });
  const r3 = bookHandler(late);
  assert.equal((await post(r3.handler, REQUEST)).statusCode, 502);
  assert.deepEqual(late.store.orders[0].tags, ["vercel-live", "ship-to-store", "needs-scheduling", "install-booked"]);
  const shown = await post(r3.handler, REQUEST);
  assert.deepEqual([shown.statusCode, shown.body.alreadyBooked], [200, true]);
});

test("book-install: without write_orders nothing is written and the customer is told to call (503)", async () => {
  const shop = fakeShop({ scopes: ["read_orders", "read_customers", "write_customers"] });
  const { handler, lines } = bookHandler(shop);
  const res = await post(handler, REQUEST);
  assert.equal(res.statusCode, 503);
  assert.match(res.body.error, /call the shop at \(954\) 773-1896/);
  assert.deepEqual(shop.ops(), ["trackOrder", "appAccessScopes"]);
  assert.ok(lines.some((l) => /lacks the write_orders scope/.test(l) && l.includes("install-scheduling.md")));
});

test("book-install: Shopify down on the read is a 502; unconfigured is a 503; GET is 405", async () => {
  const down = { calls: [], fetchImpl: async () => new Response("down", { status: 503 }) };
  const res = await post(bookHandler(down).handler, REQUEST);
  assert.equal(res.statusCode, 502);
  assert.doesNotMatch(res.body.error, /HTTP 503/);

  const shop = fakeShop();
  const off = await post(bookHandler(shop, { env: {} }).handler, REQUEST);
  assert.deepEqual([off.statusCode, off.body.configured], [503, false]);
  assert.equal(shop.calls.length, 0);

  const get = { statusCode: 0, headers: {}, setHeader(k, v) { this.headers[k] = v; }, end() {} };
  await bookHandler(shop).handler({ method: "GET", headers: {} }, get);
  assert.equal(get.statusCode, 405);
});

// ---- rate limit ----------------------------------------------------------------------------------------

test("book-install: rate limited per client with the same budget as /api/track", async () => {
  const shop = fakeShop({ orders: [] });
  const book = bookHandler(shop).handler;
  const track = createTrackHandler({ env: { ...ENV }, shopify: { fetchImpl: shop.fetchImpl, retryDelayMs: 0 }, now: () => NOW });
  const ip = "203.0.113.50";
  // Half the budget on /track, the rest on /book-install: together they hit the limit.
  for (let i = 0; i < TRACK_RATE_LIMIT / 2; i += 1) {
    assert.equal((await post(track, { order: "1002", email: "buyer@example.com" }, { ip })).statusCode, 404);
    assert.equal((await post(book, REQUEST, { ip })).statusCode, 404);
  }
  const limited = await post(book, REQUEST, { ip });
  assert.equal(limited.statusCode, 429);
  assert.equal(limited.headers["retry-after"], "600");
  assert.equal((await post(track, { order: "1002", email: "buyer@example.com" }, { ip })).statusCode, 429);
  assert.equal(shop.calls.length, TRACK_RATE_LIMIT);
  assert.equal((await post(book, REQUEST, { ip: "203.0.113.51" })).statusCode, 404, "another client is not affected");
});

// ---- /track shows the booking ----------------------------------------------------------------------------

test("track: a booked order shows its requested day and window instead of the booking panel", async () => {
  const shop = fakeShop();
  await post(bookHandler(shop).handler, REQUEST);
  const track = createTrackHandler({ env: { ...ENV }, shopify: { fetchImpl: shop.fetchImpl, retryDelayMs: 0 } });
  const res = await post(track, { order: "#1002", email: "buyer@example.com" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.order.booking, {
    mode: "booked",
    ref: "TD-260920-ABCDEF",
    install: "shop",
    booking: { day: TOMORROW, window: "8-10am", dayLabel: "Thursday, October 1, 2026", windowLabel: "8:00 – 10:00 AM", notes: "Locking lug nuts; key is in the glovebox" },
  });
  // Even with INSTALL_BOOKING_URL set, a booked order shows the booking.
  const ext = createTrackHandler({
    env: { ...ENV, INSTALL_BOOKING_URL: "https://book.example.com/td?ref={orderRef}" },
    shopify: { fetchImpl: shop.fetchImpl, retryDelayMs: 0 },
  });
  assert.equal((await post(ext, { order: "#1002", email: "buyer@example.com" })).body.order.booking.mode, "booked");

  // Not booked yet: the panel (internal), or only the external link when it is set.
  const fresh = fakeShop();
  const t2 = createTrackHandler({ env: { ...ENV }, shopify: { fetchImpl: fresh.fetchImpl, retryDelayMs: 0 } });
  assert.equal((await post(t2, { order: "#1002", email: "buyer@example.com" })).body.order.booking.mode, "internal");
  const t3 = createTrackHandler({
    env: { ...ENV, INSTALL_BOOKING_URL: "https://book.example.com/td?ref={orderRef}" },
    shopify: { fetchImpl: fresh.fetchImpl, retryDelayMs: 0 },
  });
  assert.deepEqual((await post(t3, { order: "#1002", email: "buyer@example.com" })).body.order.booking, {
    mode: "external",
    url: "https://book.example.com/td?ref=TD-260920-ABCDEF",
  });
});

// ---- /schedule?order= through /api/forms ---------------------------------------------------------------------

const SCHEDULE_BOOKING = Object.freeze({
  form: "booking",
  order: "TD-260920-ABCDEF",
  name: "Sam Buyer",
  email: "buyer@example.com",
  phone: "954-555-0134",
  reference: "TD-260930-AB2C",
  service: "tire-installation",
  year: "2020",
  make: "Toyota",
  model: "Camry",
  locationType: "shop",
  date: "2026-10-02",
  window: "10-12pm",
  notes: "Second choice: Saturday morning",
  website: "",
});

function formsHandler(shop) {
  const l = logger();
  return {
    handler: createFormsHandler({ env: { ...ENV }, shopify: { fetchImpl: shop.fetchImpl, retryDelayMs: 0, log: l.log }, now: () => NOW }),
    lines: l.lines,
  };
}

test("forms: /schedule?order= for a verified paid order books ON the order, the same as /track", async () => {
  const shop = fakeShop();
  const res = await post(formsHandler(shop).handler, SCHEDULE_BOOKING);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    ok: true,
    booking: { day: "2026-10-02", window: "10-12pm", dayLabel: "Friday, October 2, 2026", windowLabel: "10:00 AM – 12:00 PM", notes: "Second choice: Saturday morning", alreadyBooked: false },
  });
  const order = shop.store.orders[0];
  assert.deepEqual(order.tags, ["vercel-live", "ship-to-store", "install-booked"]);
  assert.ok(order.note.startsWith(STORE_NOTE));
  assert.match(order.note, /\nInstall booked \(customer request\): Friday, October 2, 2026, 10:00 AM – 12:00 PM\. Notes: Second choice: Saturday morning$/);
  const lead = shop.store.customers[0].metafields["tiredrop.last_lead"].value;
  assert.ok(lead.startsWith("[BOOKED] #1002: Friday, October 2, 2026 10:00 AM – 12:00 PM\n"));
  // What the customer typed on /schedule wins for name and phone; their form answers ride along.
  assert.match(lead, /\nName: Sam Buyer\nEmail: buyer@example\.com\nPhone: 954-555-0134\n/);
  assert.match(lead, /\nService: tire-installation\n/);
  assert.match(lead, /\nReference: TD-260930-AB2C\n/);
  assert.doesNotMatch(lead, /Preferred date|Time window/, "the day and window are the booking's own lines");
  assert.deepEqual(shop.store.customers[0].tags.slice(-2), ["install-booking", "order-TD-260920-ABCDEF"]);

  // Sent again: already booked, nothing changes.
  const again = await post(formsHandler(shop).handler, { ...SCHEDULE_BOOKING, date: "2026-10-05" });
  assert.equal(again.body.booking.alreadyBooked, true);
  assert.equal(again.body.booking.day, "2026-10-02");
});

test("forms: /schedule?order= that does not verify is recorded as the plain lead, as before", async () => {
  // Another email than the order's: no order write, the old lead.
  const shop = fakeShop();
  const res = await post(formsHandler(shop).handler, { ...SCHEDULE_BOOKING, email: "someone@else.com" });
  assert.deepEqual([res.statusCode, res.body], [200, { ok: true }]);
  assert.deepEqual(shop.store.orders[0].tags, ["vercel-live", "ship-to-store", "needs-scheduling"]);
  assert.equal(shop.store.orders[0].note, STORE_NOTE);
  const lead = shop.store.customers[0].metafields["tiredrop.last_lead"].value;
  assert.match(lead, /^TireDrop install booking request — /);
  assert.match(lead, /\nPaid order: TD-260920-ABCDEF \(install booking for a paid order: schedule it in Tire Guru\)\n/);

  // A verified order with a day the paid-booking rules refuse (today): 400, nothing written.
  const shop2 = fakeShop();
  const bad = await post(formsHandler(shop2).handler, { ...SCHEDULE_BOOKING, date: "2026-09-30" });
  assert.equal(bad.statusCode, 400);
  assert.match(bad.body.error, /Thursday, October 1, 2026 or later/);
  assert.deepEqual(shop2.ops(), ["bookingOrdersByEmail"]);

  // A write failing midway: 502, not a success, so /schedule shows "finish by phone".
  const shop3 = fakeShop({ failOn: "leadTagsAdd", failAlways: true });
  const f = formsHandler(shop3);
  const failed = await post(f.handler, SCHEDULE_BOOKING);
  assert.equal(failed.statusCode, 502);
  assert.ok(f.lines.some((l) => l.includes("FAILED at")));
});

// ---- helpers ----------------------------------------------------------------------------------------------

test("installBooking helpers: note line, append, parse back", () => {
  const line = bookingNoteLine({ day: "2026-10-03", window: "12-2pm", notes: "" });
  assert.equal(line, "Install booked (customer request): Saturday, October 3, 2026, 12:00 – 2:00 PM. Notes: none");
  assert.equal(appendNoteLine("", line), line);
  assert.equal(appendNoteLine("Staff: call first\n\n", line), `Staff: call first\n${line}`);
  assert.equal(appendNoteLine(`A\n${line}`, line), `A\n${line}`, "not twice");
  assert.deepEqual(bookingFromNote(`x\n${line}\ny`), { day: "2026-10-03", window: "12-2pm", notes: "" });
  assert.equal(bookingFromNote("Install booked (customer request): someday, soon. Notes: none"), null);
  assert.equal(readInstallBooking({ installBooking: { value: "{not json" }, note: "" }), null);
  assert.equal(readInstallBooking({ installBooking: { value: JSON.stringify({ day: "2026-10-03", window: "9-11am" }) }, note: "" }), null);
});
