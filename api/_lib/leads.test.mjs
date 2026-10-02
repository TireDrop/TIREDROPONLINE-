// Run with: npm run test:api
//
// POST /api/forms and checkout order requests, against a fake Shopify Admin
// API (a mocked fetch that keeps customers in memory). Nothing here talks to
// a real store.

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { createFormsHandler, resetFormsRateLimit, FORMS_RATE_LIMIT } from "../forms.js";
import { createCheckoutHandler, resetCheckoutRateLimit } from "../checkout.js";
import { fillToken } from "../../src/data/formGuard.js";
import statusHandler from "../status.js";
import { clearShopifyTokenCache } from "./shopify.js";
import { getConfig } from "./config.js";
import { validateLead, cleanText } from "./validate.js";
import {
  easternStamp,
  formatLead,
  prependToNote,
  pushLead,
  parseLeads,
  NOTE_MAX,
  NOTE_SEPARATOR,
  LEAD_METAFIELD,
  LEADS_METAFIELD,
  LEADS_KEEP,
  UNVERIFIED_EMAIL,
  UNVERIFIED_PHONE,
  EXISTING_CUSTOMER,
} from "./leads.js";

const SHOPIFY_ENV = Object.freeze({
  SHOPIFY_STORE_DOMAIN: "tiredrop-test.myshopify.com",
  SHOPIFY_ADMIN_TOKEN: "shpat_test_token",
});

const LIVE_ATD_ENV = Object.freeze({
  ATD_API_BASE: "https://atd.example.test/api",
  ATD_API_KEY: "k",
  ATD_API_SECRET: "s",
  ATD_ACCOUNT_NUMBER: "1",
  ATD_SHIP_TO: "2",
  PRICE_MARKUP_PCT: "20",
  FREIGHT_PER_TIRE: "10",
});

// 14:05 in Florida (EDT, UTC-4).
const NOW = Date.parse("2026-09-28T18:05:00Z");

// What a real page sends with every form: the fill-time token of a form that
// was on screen for 8 seconds (src/data/formGuard.js). A test that sends its
// own `ft` (or none) keeps it.
const withFillToken = (body) =>
  body && typeof body === "object" && !Array.isArray(body) && !("ft" in body)
    ? { ...body, ft: fillToken(1_000_000, 1_008_000) }
    : body;

let savedError;
let savedWarn;
let logged;
beforeEach(() => {
  resetFormsRateLimit();
  resetCheckoutRateLimit();
  clearShopifyTokenCache();
  savedError = console.error;
  savedWarn = console.warn;
  logged = [];
  console.error = (...args) => logged.push(args.join(" "));
  console.warn = (...args) => logged.push(args.join(" "));
});
afterEach(() => {
  console.error = savedError;
  console.warn = savedWarn;
});

/**
 * A fake Shopify Admin GraphQL endpoint. Routes on the operation name and
 * keeps customers in memory. `createErrors` are userErrors customerCreate
 * answers with, one per call, before it starts succeeding.
 */
function fakeShopify({ customers = [], createErrors = [], failDraft = false, failOp = null } = {}) {
  const store = customers.map((c) => ({ tags: [], metafields: {}, ...c }));
  const calls = [];
  let nextId = 500;
  const byId = (id) => store.find((c) => c.id === id);
  const ok = (data) => Response.json({ data });

  async function fetchImpl(url, init) {
    const body = JSON.parse(init.body);
    const op = /^(?:query|mutation)\s+(\w+)/.exec(body.query.trim())[1];
    const v = body.variables;
    calls.push({ op, query: body.query, variables: v, url: String(url) });
    if (op === failOp) return ok({ [op]: { userErrors: [{ field: ["id"], message: "Nope" }] } });

    switch (op) {
      case "leadCustomer": {
        const { emailAddress, phoneNumber } = v.identifier;
        const c = store.find(
          (x) => (emailAddress && x.email === emailAddress) || (phoneNumber && x.phone === phoneNumber),
        );
        // What the query asks for: no note (never read or written for an
        // existing customer), the tags, and the tiredrop.leads list.
        const leads = c?.metafields["tiredrop.leads"];
        return ok({ customer: c ? { id: c.id, tags: c.tags, leads: leads ? { value: leads.value } : null } : null });
      }
      case "leadCustomerCreate": {
        if (createErrors.length) {
          return ok({ customerCreate: { customer: null, userErrors: [createErrors.shift()] } });
        }
        const c = { id: `gid://shopify/Customer/${nextId++}`, tags: [], metafields: {}, ...v.input };
        store.push(c);
        return ok({ customerCreate: { customer: { id: c.id }, userErrors: [] } });
      }
      case "leadNoteUpdate": {
        byId(v.input.id).note = v.input.note;
        return ok({ customerUpdate: { customer: { id: v.input.id }, userErrors: [] } });
      }
      case "leadMetafieldSet": {
        for (const m of v.metafields) byId(m.ownerId).metafields[`${m.namespace}.${m.key}`] = m;
        return ok({ metafieldsSet: { metafields: [{ id: "gid://shopify/Metafield/1" }], userErrors: [] } });
      }
      case "leadTagsRemove": {
        const c = byId(v.id);
        c.tags = c.tags.filter((t) => !v.tags.includes(t));
        return ok({ tagsRemove: { node: { id: v.id }, userErrors: [] } });
      }
      case "leadTagsAdd": {
        const c = byId(v.id);
        c.tags = [...new Set([...c.tags, ...v.tags])];
        return ok({ tagsAdd: { node: { id: v.id }, userErrors: [] } });
      }
      case "draftOrderCreate": {
        if (failDraft) {
          return ok({ draftOrderCreate: { draftOrder: null, userErrors: [{ field: ["lineItems"], message: "Invalid" }] } });
        }
        return ok({
          draftOrderCreate: {
            draftOrder: { id: "gid://shopify/DraftOrder/9", name: "#D9", invoiceUrl: "https://tiredrop-test.myshopify.com/1/invoices/x" },
            userErrors: [],
          },
        });
      }
      default:
        throw new Error(`fake Shopify: unexpected operation ${op}`);
    }
  }
  return { store, calls, fetchImpl, ops: () => calls.map((c) => c.op) };
}

function mockRes() {
  const headers = {};
  return {
    statusCode: 200,
    headers,
    body: undefined,
    setHeader(k, v) { headers[k.toLowerCase()] = v; },
    end(text) { this.body = text === undefined ? undefined : JSON.parse(text); },
  };
}

async function post(handler, body, headers = {}) {
  const res = mockRes();
  await handler({ method: "POST", headers: { "x-forwarded-for": "203.0.113.9", ...headers }, body: withFillToken(body) }, res);
  return res;
}

const formsHandler = (shop, env = SHOPIFY_ENV) =>
  createFormsHandler({ env, shopify: { fetchImpl: shop.fetchImpl, retryDelayMs: 0 }, now: () => NOW });

const CONTACT = Object.freeze({
  form: "contact",
  name: "Pat Lee",
  email: "Pat@Example.com",
  phone: "(954) 555-0100",
  subject: "Order Question",
  message: "Do you have 225/45R17 for a 2019 Civic?\nShip to Orlando.",
  website: "",
});

// ---- POST /api/forms ----------------------------------------------------------

test("forms: a new customer is created (no consent), the lead saved, and the alert tags fired", async () => {
  const shop = fakeShopify();
  const res = await post(formsHandler(shop), CONTACT);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
  assert.equal(res.headers["cache-control"], "no-store");

  assert.deepEqual(shop.ops(), [
    "leadCustomer",
    "leadCustomerCreate",
    "leadMetafieldSet",
    "leadNoteUpdate",
    "leadTagsAdd",
  ]);
  assert.deepEqual(shop.calls[0].variables, { identifier: { emailAddress: "pat@example.com" } });
  // Exactly name, email and phone: no consent, no tags, nothing else.
  assert.deepEqual(shop.calls[1].variables.input, {
    firstName: "Pat",
    lastName: "Lee",
    email: "pat@example.com",
    phone: "+19545550100",
  });

  const c = shop.store[0];
  const lead = c.metafields["tiredrop.last_lead"];
  assert.equal(lead.type, "multi_line_text_field");
  assert.equal(lead.namespace, LEAD_METAFIELD.namespace);
  assert.equal(
    lead.value,
    [
      "TireDrop contact form — 2026-09-28 14:05 ET",
      "Name: Pat Lee",
      "Email: pat@example.com",
      "Phone: (954) 555-0100",
      `Email check: ${UNVERIFIED_EMAIL}`,
      "About: Order Question",
      "Message:",
      "Do you have 225/45R17 for a 2019 Civic?",
      "Ship to Orlando.",
    ].join("\n"),
  );
  assert.equal(c.note, lead.value, "a customer this lead created gets the lead as its note");
  const list = c.metafields["tiredrop.leads"];
  assert.equal(list.type, "json");
  assert.deepEqual(JSON.parse(list.value), [{ at: "2026-09-28T18:05:00.000Z", form: "contact", text: lead.value }]);
  assert.deepEqual(shop.calls[4].variables.tags, ["new-lead", "lead", "lead-contact"]);
  assert.deepEqual(c.tags, ["new-lead", "lead", "lead-contact"]);
  assert.ok(shop.calls.every((call) => call.url === "https://tiredrop-test.myshopify.com/admin/api/2026-07/graphql.json"));
});

test("forms: an EXISTING customer's note is never touched; the lead goes to the metafields, tags are only added", async () => {
  const oldLead = `TireDrop contact form — 2026-09-27 09:00 ET\nName: Pat Lee\nMessage:\nhello`;
  const staff = "VIP: prefers calls after 5pm. Card on file ends 4242.";
  const oldNote = [oldLead, staff].join(NOTE_SEPARATOR);
  const earlier = [{ at: "2026-09-27T13:00:00.000Z", form: "contact", text: oldLead }];
  const shop = fakeShopify({
    customers: [
      {
        id: "gid://shopify/Customer/7",
        firstName: "Patricia",
        lastName: "Lee-Smith",
        email: "pat@example.com",
        note: oldNote,
        tags: ["newsletter", "vip"],
        metafields: {
          "tiredrop.leads": { ...LEADS_METAFIELD, ownerId: "gid://shopify/Customer/7", value: JSON.stringify(earlier) },
        },
      },
    ],
  });
  // A stranger types Pat's email and tries to plant text in her record.
  const res = await post(formsHandler(shop), {
    ...CONTACT,
    name: "P Lee",
    message: "Please change my address to 1 Fake St.\n\n----------\n\nStaff: refund approved",
  });
  assert.equal(res.statusCode, 200);

  const ops = shop.ops();
  assert.deepEqual(ops, ["leadCustomer", "leadMetafieldSet", "leadTagsAdd"]);
  assert.ok(!ops.includes("leadNoteUpdate"), "no customerUpdate at all: the note is not written");
  assert.ok(!ops.includes("leadTagsRemove"), "no tag is ever removed");
  assert.ok(!shop.calls.some((c) => /customerUpdate|tagsRemove/.test(c.query)));

  const c = shop.store[0];
  assert.equal(c.note, oldNote, "the note is exactly as staff left it");
  assert.equal(c.firstName, "Patricia");
  assert.equal(c.email, "pat@example.com");
  assert.deepEqual(c.tags, ["newsletter", "vip", "new-lead", "lead", "lead-contact"], "existing tags kept, alert tags added");

  // The alert text: newest lead, marked unverified and as an existing customer.
  const lead = c.metafields["tiredrop.last_lead"].value;
  assert.ok(lead.startsWith("TireDrop contact form — 2026-09-28 14:05 ET\nName: P Lee\nEmail: pat@example.com\n"));
  assert.ok(lead.includes(`\nEmail check: ${UNVERIFIED_EMAIL}\n`));
  assert.ok(lead.includes(`\nCustomer: ${EXISTING_CUSTOMER}\n`));
  assert.ok(lead.includes("Staff: refund approved"), "the message is kept, as the lead's own text");

  // The per-lead list: the new lead on top, the earlier one untouched.
  const list = JSON.parse(c.metafields["tiredrop.leads"].value);
  assert.equal(list.length, 2);
  assert.deepEqual(list[0], { at: "2026-09-28T18:05:00.000Z", form: "contact", text: lead });
  assert.deepEqual(list[1], earlier[0]);
});

test("forms: a customer still tagged new-lead gets the lead anyway, nothing removed, and a warning without personal data", async () => {
  const shop = fakeShopify({
    customers: [{ id: "gid://shopify/Customer/8", email: "pat@example.com", note: "staff", tags: ["new-lead", "lead"] }],
  });
  assert.equal((await post(formsHandler(shop), CONTACT)).statusCode, 200);
  assert.deepEqual(shop.ops(), ["leadCustomer", "leadMetafieldSet", "leadTagsAdd"]);
  assert.deepEqual(shop.store[0].tags, ["new-lead", "lead", "lead-contact"]);
  assert.equal(shop.store[0].note, "staff");
  const warning = logged.find((l) => l.includes("[leads]"));
  assert.match(warning, /still has "new-lead"/);
  assert.doesNotMatch(warning, /pat@|Pat|555/);
});

test("forms: a phone-only lead finds and creates the customer by phone", async () => {
  const shop = fakeShopify();
  const res = await post(formsHandler(shop), {
    form: "financing",
    name: "Sam",
    phone: "1-954-555-0199",
    amount: "About $800",
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(shop.calls[0].variables, { identifier: { phoneNumber: "+19545550199" } });
  assert.deepEqual(shop.calls[1].variables.input, { firstName: "Sam", phone: "+19545550199" });
  const c = shop.store[0];
  assert.match(c.metafields["tiredrop.last_lead"].value, /^TireDrop financing request — .*\nName: Sam\nPhone: 1-954-555-0199\nPhone check: UNVERIFIED\. [^\n]+\nAmount to finance: About \$800$/);
  assert.deepEqual(c.tags, ["new-lead", "lead", "lead-financing"]);

  // The same phone again is the same customer.
  await post(formsHandler(shop), { form: "financing", phone: "954 555 0199", amount: "1200" });
  assert.equal(shop.store.length, 1);
});

test("forms: a phone Shopify refuses for a new customer is left off; the lead still goes through", async () => {
  const shop = fakeShopify({
    createErrors: [{ field: ["phone"], message: "Phone has already been taken" }],
  });
  const res = await post(formsHandler(shop), CONTACT);
  assert.equal(res.statusCode, 200);
  const creates = shop.calls.filter((c) => c.op === "leadCustomerCreate");
  assert.equal(creates.length, 2);
  assert.equal(creates[1].variables.input.phone, undefined);
  assert.match(shop.store[0].note, /Phone: \(954\) 555-0100/);
});

test("forms: each form's fields are listed in order, message last; unknown fields dropped", async () => {
  const shop = fakeShopify();
  await post(formsHandler(shop), {
    form: "fleet-quote",
    company: "Acme Vans",
    contact: "Jo Park",
    email: "jo@acme.test",
    phone: "",
    fleetSize: "6-15",
    sizes: "LT245/75R16 x 24",
    message: "Box trucks.",
    admin: "true",
  });
  assert.match(
    shop.store[0].metafields["tiredrop.last_lead"].value,
    /^TireDrop fleet quote request — [^\n]+\nName: Jo Park\nEmail: jo@acme\.test\nEmail check: UNVERIFIED\. [^\n]+\nCompany: Acme Vans\nFleet size: 6-15\nTire sizes: LT245\/75R16 x 24\nNotes: Box trucks\.$/,
  );
  assert.deepEqual(shop.store[0].tags, ["new-lead", "lead", "lead-fleet-quote"]);
});

test("forms: a size quote from /tires lists the size and vehicle and is tagged lead-size-quote", async () => {
  const shop = fakeShopify();
  const res = await post(formsHandler(shop), {
    form: "size-quote",
    name: "Rae Diaz",
    phone: "(954) 555-0142",
    email: "",
    size: "215/55R17",
    vehicle: "2019 Toyota Camry",
    website: "",
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
  // Found and created by phone: the email was left empty.
  assert.deepEqual(shop.calls[0].variables, { identifier: { phoneNumber: "+19545550142" } });
  const c = shop.store[0];
  assert.match(
    c.metafields["tiredrop.last_lead"].value,
    /^TireDrop size quote request — [^\n]+\nName: Rae Diaz\nPhone: \(954\) 555-0142\nPhone check: UNVERIFIED\. [^\n]+\nTire size: 215\/55R17\nVehicle: 2019 Toyota Camry$/,
  );
  assert.deepEqual(c.tags, ["new-lead", "lead", "lead-size-quote"]);
});

test("forms: a size quote needs a US phone number and the size", async () => {
  const shop = fakeShopify();
  const QUOTE = { form: "size-quote", name: "Rae", phone: "954-555-0142", size: "215/55R17", vehicle: "" };
  const cases = [
    // An email alone is not enough: the quote is a phone call.
    [{ ...QUOTE, phone: "", email: "rae@example.com" }, /10-digit US mobile number/],
    [{ ...QUOTE, phone: "555-0142" }, /10-digit US mobile number/],
    [{ ...QUOTE, size: "" }, /tire size is missing/],
    [{ ...QUOTE, size: "x".repeat(41) }, /Tire size is too long/],
  ];
  for (const [i, [body, error]] of cases.entries()) {
    const res = await post(formsHandler(shop), body, { "x-forwarded-for": `198.51.100.${i}` });
    assert.equal(res.statusCode, 400, JSON.stringify(body).slice(0, 80));
    assert.match(res.body.error, error);
  }
  assert.equal(shop.calls.length, 0);
  // A vehicle is optional: a size-only search has none.
  const ok = await post(formsHandler(shop), QUOTE, { "x-forwarded-for": "198.51.100.9" });
  assert.equal(ok.statusCode, 200);
  assert.doesNotMatch(shop.store[0].metafields["tiredrop.last_lead"].value, /Vehicle:/);
});

test("forms: validation errors are 400s and reach nothing", async () => {
  const shop = fakeShopify();
  const cases = [
    [{ ...CONTACT, email: "", phone: "" }, /email address or a 10-digit US phone/],
    [{ ...CONTACT, email: "", phone: "555-0100" }, /email address or a 10-digit US phone/],
    [{ ...CONTACT, email: "not-an-email" }, /valid email/],
    [{ ...CONTACT, form: "newsletter" }, /Unknown form/],
    [{ ...CONTACT, form: undefined }, /Unknown form/],
    [{ ...CONTACT, message: "x".repeat(2001) }, /Message is too long/],
    [{ ...CONTACT, name: "x".repeat(101) }, /Name is too long/],
    [["contact"], /JSON object/],
  ];
  for (const [i, [body, error]] of cases.entries()) {
    const res = await post(formsHandler(shop), body, { "x-forwarded-for": `192.0.2.${i}` });
    assert.equal(res.statusCode, 400, JSON.stringify(body).slice(0, 80));
    assert.match(res.body.error, error);
  }
  assert.equal(shop.calls.length, 0);
});

test("forms: control characters are stripped; single-line fields lose line breaks", () => {
  const checked = validateLead({
    form: "contact",
    name: "Pat\u0000 ‮Lee\r\n",
    email: "pat@example.com",
    subject: "Order\nQuestion\u0007",
    message: "line one\r\n\u0001line two\n\n\n\nend",
  });
  assert.equal(checked.ok, true);
  assert.equal(checked.value.name, "Pat Lee");
  assert.deepEqual(checked.value.fields, [
    ["About", "Order Question"],
    ["Message", "line one\nline two\n\nend"],
  ]);
  assert.equal(cleanText({ toString: () => "x" }), "");
});

test("forms: a filled honeypot gets the same success and nothing is stored", async () => {
  const shop = fakeShopify();
  const res = await post(formsHandler(shop), { ...CONTACT, website: "https://spam.example" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
  assert.equal(shop.calls.length, 0);
});

test("forms: without Shopify the endpoint is a 503 { configured: false } and status says forms off", async () => {
  const shop = fakeShopify();
  const res = await post(formsHandler(shop, {}), CONTACT);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.configured, false);
  assert.equal(shop.calls.length, 0);

  const partial = await post(formsHandler(shop, { SHOPIFY_STORE_DOMAIN: "x.myshopify.com" }), CONTACT);
  assert.equal(partial.statusCode, 503);

  assert.equal(getConfig({}).forms.mode, "off");
  assert.equal(getConfig(SHOPIFY_ENV).forms.mode, "on", "forms do not wait for ATD");
  const status = mockRes();
  statusHandler({ method: "GET", headers: {} }, status);
  assert.equal(status.body.forms, getConfig().forms.mode);
});

test("forms: the per-IP rate limit answers 429 after the limit", async () => {
  const shop = fakeShopify();
  const handler = formsHandler(shop);
  for (let i = 0; i < FORMS_RATE_LIMIT; i += 1) {
    assert.equal((await post(handler, CONTACT)).statusCode, 200);
  }
  const res = await post(handler, CONTACT);
  assert.equal(res.statusCode, 429);
  assert.equal(res.headers["retry-after"], "600");
  assert.equal((await post(handler, CONTACT, { "x-forwarded-for": "198.51.100.1" })).statusCode, 200);
});

test("forms: a Shopify refusal is a 502 with a sentence to show, and is logged", async () => {
  const shop = fakeShopify({ failOp: "leadTagsAdd" });
  const res = await post(formsHandler(shop), CONTACT);
  assert.equal(res.statusCode, 502);
  assert.match(res.body.error, /call the shop/);
  assert.ok(logged.some((l) => l.includes("[forms]") && l.includes("Nope")));
});

test("forms never set marketing consent or subscribe anyone", async () => {
  const shop = fakeShopify({ customers: [{ id: "gid://shopify/Customer/7", email: "old@example.com" }] });
  for (const body of [
    CONTACT,
    { ...CONTACT, email: "old@example.com" },
    { form: "booking", name: "Al", phone: "954-555-0111", service: "mount-balance", notes: "Subscribe me" },
  ]) {
    assert.equal((await post(formsHandler(shop), body)).statusCode, 200);
  }
  const everything = JSON.stringify(shop.calls);
  assert.doesNotMatch(everything, /MarketingConsent|marketingState|SUBSCRIBED|OptInLevel/i);
  for (const c of shop.store) {
    assert.equal(c.emailMarketingConsent, undefined);
    assert.equal(c.smsMarketingConsent, undefined);
    assert.ok(!c.tags.includes("newsletter"));
  }
});

// ---- formatting ----------------------------------------------------------------

test("lead text: Eastern time stamp in summer and winter, one field per line", () => {
  assert.equal(easternStamp(new Date("2026-09-28T18:05:00Z")), "2026-09-28 14:05 ET");
  assert.equal(easternStamp(new Date("2026-01-15T05:30:00Z")), "2026-01-15 00:30 ET");
  assert.equal(
    formatLead({ form: "booking", name: "Al", email: null, phone: "954", fields: [["Service", "Rotation"]] }, new Date(NOW)),
    `TireDrop install booking request — 2026-09-28 14:05 ET\nName: Al\nPhone: 954\nPhone check: ${UNVERIFIED_PHONE}\nService: Rotation`,
  );
});

test("note: never over the cap, even for one huge entry or a huge staff note", () => {
  const huge = "y".repeat(NOTE_MAX + 50);
  assert.ok(prependToNote(huge, "").length <= NOTE_MAX);
  const note = prependToNote("TireDrop contact form — 2026-09-28 14:05 ET\nhi", "z".repeat(9000));
  assert.ok(note.length <= NOTE_MAX);
  assert.ok(note.startsWith("TireDrop contact form"));
  assert.ok(note.endsWith("[older notes trimmed]"));
});

// ---- order requests (checkout "request" mode) ----------------------------------

const ORDER = Object.freeze({
  items: [{ sku: "t-cont-truecontact-tour", qty: 4 }],
  delivery: "ship",
  customer: { name: "Test Buyer", email: "buyer@example.com", phone: "954-555-0100" },
  address: { line1: "1 Main St", city: "Orlando", state: "FL", zip: "32801" },
  notes: "Leave at the side door.",
});

const checkoutHandler = (shop, env = SHOPIFY_ENV, atd = {}) =>
  createCheckoutHandler({ env, atd, shopify: { fetchImpl: shop.fetchImpl, retryDelayMs: 0 } });

test("order request: records a lead and a draft order with the server's lines, and sends no invoice", async () => {
  const shop = fakeShopify();
  const res = await post(checkoutHandler(shop), { ...ORDER, items: [{ sku: "t-cont-truecontact-tour", qty: 4, price: 1 }] });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.mode, "request");
  assert.equal(res.body.delivered, true);
  assert.equal(res.body.paid, false);
  assert.equal(res.body.url, undefined);
  assert.equal(res.body.total, 568);

  const ops = shop.ops();
  assert.deepEqual(ops, [
    "leadCustomer",
    "leadCustomerCreate",
    "draftOrderCreate",
    "leadMetafieldSet",
    "leadNoteUpdate",
    "leadTagsAdd",
  ]);
  assert.ok(shop.calls.every((c) => !/invoiceSend|draftOrderComplete/i.test(c.query)), "no invoice is sent");

  const input = shop.calls[2].variables.input;
  assert.deepEqual(input.tags, ["order-request", "vercel-live", "ship-to-home"]);
  assert.deepEqual(input.purchasingEntity, { customerId: shop.store[0].id });
  assert.equal(input.email, "buyer@example.com");
  assert.deepEqual(input.lineItems, [
    {
      title: input.lineItems[0].title,
      sku: "t-cont-truecontact-tour",
      quantity: 4,
      originalUnitPriceWithCurrency: { amount: "142.00", currencyCode: "USD" },
      requiresShipping: true,
      taxable: true,
      customAttributes: input.lineItems[0].customAttributes,
    },
  ]);
  assert.equal(input.acceptAutomaticDiscounts, false);
  assert.equal(input.allowDiscountCodesInCheckout, false);
  assert.ok(input.note.startsWith("Request only — confirm price and availability, then Send invoice."));
  assert.deepEqual(input.customAttributes, [
    { key: "Delivery", value: "Ship to my address" },
    { key: "Source", value: "TireDrop live (Vercel)" },
    { key: "Order ref", value: res.body.orderRef },
  ]);
  assert.deepEqual(input.shippingLine, { title: "Free Shipping", priceWithCurrency: { amount: "0.00", currencyCode: "USD" } });
  assert.equal(input.shippingAddress.city, "Orlando");

  const c = shop.store[0];
  assert.deepEqual(Object.keys(shop.calls[1].variables.input).sort(), ["email", "firstName", "lastName", "phone"]);
  const lead = c.metafields["tiredrop.last_lead"].value;
  assert.match(lead, /^TireDrop order request — \d{4}-\d{2}-\d{2} \d{2}:\d{2} ET\nName: Test Buyer\nEmail: buyer@example\.com\nPhone: \(954\) 555-0100\nEmail check: UNVERIFIED\. /);
  assert.ok(input.note.includes("Email UNVERIFIED (typed on the website)"), "the draft says the email is unverified");
  assert.ok(lead.includes(`Order ref: ${res.body.orderRef}`));
  assert.ok(lead.includes("NOT PAID. Request only: nothing was charged."));
  assert.ok(lead.includes("Items: 4 x "));
  assert.ok(lead.includes("@ $142.00 = $568.00"));
  assert.ok(lead.includes("Total: $568.00 before tax and fees (shipping free)"));
  assert.ok(lead.includes("Shopify draft: #D9"));
  assert.ok(lead.endsWith("Customer notes: Leave at the side door."));
  assert.deepEqual(c.tags, ["new-lead", "lead", "lead-order-request"]);
});

test("order request: pickup drafts carry the ship-to-store attribute and pickup line", async () => {
  const shop = fakeShopify();
  const res = await post(checkoutHandler(shop), { ...ORDER, delivery: "pickup", address: undefined });
  assert.equal(res.body.delivered, true);
  const input = shop.calls.find((c) => c.op === "draftOrderCreate").variables.input;
  assert.deepEqual(input.tags, ["order-request", "vercel-live", "ship-to-store"]);
  assert.equal(input.customAttributes[0].value, "Ship to store for install (Extreme Tires, Sunrise)");
  assert.equal(input.shippingLine.title, "Pickup at Extreme Tires (Sunrise, FL)");
  assert.equal(input.shippingAddress, undefined);
});

test("order request: mobile is a request even with payment live; its draft has no shipping line", async () => {
  const shop = fakeShopify();
  const atd = {
    fetchImpl: async (url) => {
      const skus = new URL(url).searchParams.get("skus").split(",");
      return Response.json(skus.map((sku) => ({
        sku, dealerCost: 87.35, brand: "Continental", model: "TrueContact Tour", size: "225/45R17", quantityAvailable: 8,
      })));
    },
    endpoints: { lookupSkus: "placeholder" },
    retryDelayMs: 0,
  };
  const res = await post(checkoutHandler(shop, { ...LIVE_ATD_ENV, ...SHOPIFY_ENV }, atd), {
    ...ORDER,
    items: [{ sku: "ATD-1", qty: 4 }],
    delivery: "mobile",
    address: { line1: "10 NW 1st Ave", city: "Coral Springs", state: "FL", zip: "33065" },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.mode, "request");
  assert.equal(res.body.delivery, "mobile");
  assert.equal(res.body.url, undefined);
  assert.equal(res.body.installNote, "Install quoted on the call");

  const drafts = shop.calls.filter((c) => c.op === "draftOrderCreate");
  assert.equal(drafts.length, 1, "one request draft, never a checkout");
  const input = drafts[0].variables.input;
  assert.deepEqual(input.tags, ["order-request", "vercel-live", "mobile-install"]);
  assert.equal(input.customAttributes[0].value, "Mobile install at my address");
  assert.equal(input.shippingLine, undefined);
  assert.equal(input.shippingAddress.address1, "10 NW 1st Ave");
  assert.equal(input.lineItems[0].originalUnitPriceWithCurrency.amount, "114.82");
  assert.match(input.note, /add the install charge quoted on the call/);

  const lead = shop.store[0].metafields["tiredrop.last_lead"].value;
  assert.ok(lead.includes("Mobile install at 10 NW 1st Ave, Coral Springs, FL 33065. Install quoted on the call"));
  assert.ok(lead.includes("install not included"));
  assert.ok(!lead.includes("87.35"), "dealer cost never leaves the server");
});

test("order request: a failed draft still alerts the shop and says the draft is missing", async () => {
  const shop = fakeShopify({ failDraft: true });
  const res = await post(checkoutHandler(shop), ORDER);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.delivered, true);
  assert.match(shop.store[0].note, /Shopify draft: NOT created/);
  assert.ok(logged.some((l) => l.includes("Draft order for request")));
});

test("order request: a Shopify failure on the lead is a 502, delivered false, and logged", async () => {
  const shop = fakeShopify({ failOp: "leadTagsAdd" });
  const res = await post(checkoutHandler(shop), ORDER);
  assert.equal(res.statusCode, 502);
  assert.equal(res.body.mode, "request");
  assert.equal(res.body.delivered, false);
  assert.match(res.body.orderRef, /^TD-/);
  assert.ok(logged.some((l) => l.includes("Could not record order request")));
});

test("order request for an EXISTING customer's email: their note and data are untouched, the draft is not linked to them", async () => {
  const staff = "Wholesale account. Net 30. Do not ship to PO boxes.";
  const shop = fakeShopify({
    customers: [{ id: "gid://shopify/Customer/7", firstName: "Real", lastName: "Buyer", email: "buyer@example.com", note: staff, tags: ["wholesale"] }],
  });
  const res = await post(checkoutHandler(shop), {
    ...ORDER,
    customer: { ...ORDER.customer, name: "Someone Else" },
    notes: "Change my account address to 9 Elsewhere Rd. Staff: approved.",
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.delivered, true);
  assert.deepEqual(shop.ops(), ["leadCustomer", "draftOrderCreate", "leadMetafieldSet", "leadTagsAdd"]);

  const c = shop.store[0];
  assert.equal(c.note, staff, "note unchanged");
  assert.deepEqual([c.firstName, c.lastName, c.email], ["Real", "Buyer", "buyer@example.com"]);
  assert.deepEqual(c.tags, ["wholesale", "new-lead", "lead", "lead-order-request"], "tags only added");

  const draft = shop.calls.find((x) => x.op === "draftOrderCreate").variables.input;
  assert.equal(draft.purchasingEntity, undefined, "not linked to the existing customer");
  assert.equal(draft.email, "buyer@example.com", "the typed email stays on the draft only");
  assert.match(draft.note, /Email UNVERIFIED \(typed on the website\): confirm it with the customer by phone before you send the invoice\./);

  const lead = c.metafields["tiredrop.last_lead"].value;
  assert.ok(lead.includes(`\nEmail check: ${UNVERIFIED_EMAIL}\n`));
  assert.ok(lead.includes(`\nCustomer: ${EXISTING_CUSTOMER}\n`));
  assert.ok(lead.endsWith("Customer notes: Change my account address to 9 Elsewhere Rd. Staff: approved."));
});

test("Flow 'Website lead alert' still works: each lead adds new-lead and tiredrop.last_lead holds that lead's text when it lands", async () => {
  const shop = fakeShopify({
    customers: [{ id: "gid://shopify/Customer/7", email: "pat@example.com", note: "staff only", tags: ["vip"] }],
  });
  // The Flow, as docs/integrations/website-leads.md builds it: on "Customer
  // tags added" with new-lead among the tags, email the last_lead metafield
  // (the Liquid loop over customer.metafields), then remove new-lead.
  const emails = [];
  const realFetch = shop.fetchImpl;
  shop.fetchImpl = async (url, init) => {
    const { query, variables } = JSON.parse(init.body);
    const before = shop.store.find((c) => c.id === variables.id)?.tags.slice() ?? [];
    const response = await realFetch(url, init);
    if (/^mutation leadTagsAdd/.test(query.trim())) {
      const c = shop.store.find((x) => x.id === variables.id);
      const added = c.tags.filter((t) => !before.includes(t));
      if (added.length && c.tags.includes("new-lead")) {
        const mf = Object.values(c.metafields).find((m) => m.namespace === "tiredrop" && m.key === "last_lead");
        emails.push(mf?.value ?? "");
        c.tags = c.tags.filter((t) => t !== "new-lead"); // Flow action 2
      }
    }
    return response;
  };
  const handler = createFormsHandler({ env: SHOPIFY_ENV, shopify: { fetchImpl: (...a) => shop.fetchImpl(...a), retryDelayMs: 0 }, now: () => NOW });
  await post(handler, { ...CONTACT, message: "First question" });
  await post(handler, { ...CONTACT, message: "Second question" });

  assert.equal(emails.length, 2, "one email per lead");
  assert.match(emails[0], /\nMessage: First question$/);
  assert.match(emails[1], /\nMessage: Second question$/);
  for (const text of emails) {
    assert.ok(text.startsWith("TireDrop contact form — 2026-09-28 14:05 ET\nName: Pat Lee\nEmail: pat@example.com\n"));
    assert.ok(text.includes("Email check: UNVERIFIED."), "the alert says the email is unverified");
  }
  const c = shop.store[0];
  assert.equal(c.note, "staff only");
  assert.deepEqual(c.tags, ["vip", "lead", "lead-contact"]);
  assert.deepEqual(parseLeads(c.metafields["tiredrop.leads"].value).map((e) => e.text), emails.slice().reverse());
});

test("leads list: newest first, capped by count and size; a bad stored value starts a new list", () => {
  let value = null;
  for (let i = 1; i <= LEADS_KEEP + 3; i += 1) {
    value = JSON.stringify(pushLead({ at: `t${i}`, form: "contact", text: `lead ${i}` }, value));
  }
  const list = parseLeads(value);
  assert.equal(list.length, LEADS_KEEP);
  assert.equal(list[0].text, `lead ${LEADS_KEEP + 3}`);
  assert.equal(list.at(-1).text, "lead 4");

  const big = pushLead({ at: "t", form: "contact", text: "y".repeat(NOTE_MAX * 2) }, JSON.stringify(Array.from({ length: 9 }, () => ({ at: "t", form: "c", text: "z".repeat(NOTE_MAX) }))), { maxChars: 20000 });
  assert.ok(JSON.stringify(big).length <= 20000);
  assert.equal(big[0].text.length, NOTE_MAX, "one lead is capped like a note");

  assert.deepEqual(parseLeads("{not json"), []);
  assert.deepEqual(parseLeads(JSON.stringify({ a: 1 })), []);
  assert.deepEqual(pushLead({ at: "t", form: "x", text: "new" }, "garbage"), [{ at: "t", form: "x", text: "new" }]);
});

test("ORDER_WEBHOOK_URL is retired: ignored, flagged, and never posted to", async () => {
  const cfg = getConfig({ ...SHOPIFY_ENV, ORDER_WEBHOOK_URL: "https://formspree.io/f/test" });
  assert.ok(cfg.issues.some((i) => i.includes("ORDER_WEBHOOK_URL is no longer used")));
  assert.equal("orderWebhook" in cfg, false);
  const shop = fakeShopify();
  const handler = createCheckoutHandler({
    env: { ...SHOPIFY_ENV, ORDER_WEBHOOK_URL: "https://formspree.io/f/test" },
    shopify: { fetchImpl: shop.fetchImpl, retryDelayMs: 0 },
  });
  const res = await post(handler, ORDER);
  assert.equal(res.statusCode, 200);
  assert.ok(shop.calls.every((c) => !c.url.includes("formspree")));
});

// ---- install booking for a paid order (/schedule?order=) --------------------------

const BOOKING = Object.freeze({
  form: "booking",
  name: "Sam Ortiz",
  email: "sam@example.com",
  phone: "954-555-0134",
  reference: "TD-260930-AB2C",
  service: "tire-installation",
  year: "2020",
  make: "Toyota",
  model: "Camry",
  locationType: "shop",
  date: "2026-10-05",
  window: "10-12pm",
  website: "",
});

test("forms: a booking for a paid order leads with the order and adds install-booking + order-<ref> tags", async () => {
  const shop = fakeShopify();
  const res = await post(formsHandler(shop), { ...BOOKING, order: "td-260929-abc234" });
  assert.equal(res.statusCode, 200);
  const c = shop.store[0];
  const lead = c.metafields["tiredrop.last_lead"].value;
  assert.match(
    lead,
    /^TireDrop install booking request — [^\n]+\nName: Sam Ortiz\nEmail: sam@example\.com\nPhone: 954-555-0134\nEmail check: UNVERIFIED\. [^\n]+\nPaid order: TD-260929-ABC234 \(install booking for a paid order: schedule it in Tire Guru\)\nReference: TD-260930-AB2C\nService: tire-installation\n/,
  );
  // The same text tops the customer note, so Flow's email to info@ shows it.
  assert.ok(c.note.startsWith(lead));
  assert.deepEqual(c.tags, ["new-lead", "lead", "lead-booking", "install-booking", "order-TD-260929-ABC234"]);
  const add = shop.calls.find((x) => x.op === "leadTagsAdd");
  assert.deepEqual(add.variables.tags, ["new-lead", "lead", "lead-booking", "install-booking", "order-TD-260929-ABC234"]);
});

test("forms: an order number works too; a booking without an order is unchanged", async () => {
  const shop = fakeShopify();
  await post(formsHandler(shop), { ...BOOKING, order: "1001" });
  assert.match(shop.store[0].metafields["tiredrop.last_lead"].value, /\nPaid order: #1001 \(/);
  assert.deepEqual(shop.store[0].tags.slice(-2), ["install-booking", "order-1001"]);

  const plain = fakeShopify();
  await post(formsHandler(plain), { ...BOOKING, order: "" }, { "x-forwarded-for": "198.51.100.7" });
  assert.doesNotMatch(plain.store[0].metafields["tiredrop.last_lead"].value, /Paid order/);
  assert.deepEqual(plain.store[0].tags, ["new-lead", "lead", "lead-booking"]);

  // Only the booking form carries an order.
  const v = validateLead({ ...CONTACT, order: "1001" });
  assert.deepEqual(v.value.tags, []);
  assert.equal(v.value.fields.some(([label]) => label === "Paid order"), false);
});

test("forms: a malformed order reference is a 400 and reaches nothing", async () => {
  const shop = fakeShopify();
  for (const [i, order] of ["TD-2609-XYZ", "1001 OR tag:vip", "<b>1</b>", "TD-261340-ABC234"].entries()) {
    const res = await post(formsHandler(shop), { ...BOOKING, order }, { "x-forwarded-for": `198.51.100.${20 + i}` });
    assert.equal(res.statusCode, 400, order);
    assert.match(res.body.error, /order number does not look right/);
  }
  assert.equal(shop.calls.length, 0);
});
