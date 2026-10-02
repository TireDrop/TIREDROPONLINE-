// Website leads, stored in Shopify and emailed by Shopify Flow.
//
// Every website form (contact, financing, fleet quote, install booking, size
// quote) and every checkout order request ends up the same way, with no
// third-party form service in between:
//
//   1. The Shopify customer is found by email (else phone) with
//      customerByIdentifier, or created with customerCreate: name, email and
//      phone only. NO marketing consent is ever set here; a contact form does
//      not subscribe anyone. An existing customer's name and email are never
//      changed.
//   2. The lead is written as plain text ("TireDrop contact form — 2026-09-28
//      14:05 ET", then one field per line, the message last). Nobody proves
//      they own the email or phone they type, so the text says so ("Email
//      check: UNVERIFIED …") and is kept apart from what the shop wrote:
//        * the customer metafield tiredrop.last_lead (multi_line_text_field):
//          always the newest lead, the text Flow emails to info@;
//        * the customer metafield tiredrop.leads (json): a capped list of the
//          last LEADS_KEEP leads, newest first, each { at, form, text }, so
//          one submission can never erase another's text;
//        * the customer NOTE only when this submission created the customer.
//          An existing customer's note (what staff wrote, earlier history) is
//          never read, appended to or overwritten from the website: anyone
//          can type anyone's email.
//      Both metafields go in one metafieldsSet call.
//   3. tagsAdd ["new-lead", "lead", "lead-<form>"] (plus any extra tags).
//      Tags are only ever ADDED from here, never removed. The Shopify Flow
//      workflow "Website lead alert" (docs/integrations/website-leads.md)
//      runs on "Customer tags added", emails info@ the customer's
//      tiredrop.last_lead, and removes "new-lead" itself, so the next lead
//      from the same customer adds the tag again and alerts again.
//
// What is real and checked: every operation below was validated against the
// Shopify Admin GraphQL schema (2026-07). Scopes: read_customers and
// write_customers. Nothing here has been run against a real store from this
// repository; the tests use a mocked fetch.

import { shopifyGraphQL, ShopifyCheckoutError } from "./shopify.js";

export const LEAD_METAFIELD = Object.freeze({
  namespace: "tiredrop",
  key: "last_lead",
  type: "multi_line_text_field",
});

/**
 * Every website lead, newest first, capped: a per-lead record that no later
 * submission can rewrite (only push out once LEADS_KEEP newer ones arrive).
 */
export const LEADS_METAFIELD = Object.freeze({
  namespace: "tiredrop",
  key: "leads",
  type: "json",
});
export const LEADS_KEEP = 10;
export const LEADS_MAX_CHARS = 60000;

/** The line every lead with an email carries: nobody verified the address. */
export const UNVERIFIED_EMAIL =
  "UNVERIFIED. Typed on the website; anyone can enter any address. Confirm with the customer before sharing order or account details.";
export const UNVERIFIED_PHONE =
  "UNVERIFIED. Typed on the website; anyone can enter any number. Confirm with the customer before sharing order or account details.";
/** Added for a customer who already existed: where their history is now. */
export const EXISTING_CUSTOMER =
  "Existing customer. Their Shopify note was NOT changed; this and earlier website messages are in the customer metafield tiredrop.leads.";

/** The tag Flow listens for; removed by Flow once the email is sent. */
export const ALERT_TAG = "new-lead";
export const leadTags = (form, extra = []) => [
  ...new Set([ALERT_TAG, "lead", `lead-${form}`, ...extra]),
];

/** The first words of each lead, naming the form it came from. */
export const FORM_TITLES = Object.freeze({
  contact: "TireDrop contact form",
  financing: "TireDrop financing request",
  "fleet-quote": "TireDrop fleet quote request",
  booking: "TireDrop install booking request",
  "size-quote": "TireDrop size quote request",
  "order-request": "TireDrop order request",
});

export const NOTE_SEPARATOR = "\n\n----------\n\n";
export const NOTE_MAX = 4500;
export const NOTE_TRIMMED = "\n[older notes trimmed]";

export const LEAD_CUSTOMER = `query leadCustomer($identifier: CustomerIdentifierInput!) {
  customer: customerByIdentifier(identifier: $identifier) {
    id
    tags
    leads: metafield(namespace: "tiredrop", key: "leads") { value }
  }
}`;

export const LEAD_CUSTOMER_CREATE = `mutation leadCustomerCreate($input: CustomerInput!) {
  customerCreate(input: $input) {
    customer { id }
    userErrors { field message }
  }
}`;

export const LEAD_NOTE_UPDATE = `mutation leadNoteUpdate($input: CustomerInput!) {
  customerUpdate(input: $input) {
    customer { id }
    userErrors { field message }
  }
}`;

export const LEAD_METAFIELD_SET = `mutation leadMetafieldSet($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields { id }
    userErrors { field message code }
  }
}`;

export const LEAD_TAGS_ADD = `mutation leadTagsAdd($id: ID!, $tags: [String!]!) {
  tagsAdd(id: $id, tags: $tags) {
    node { id }
    userErrors { field message }
  }
}`;

// ---- Formatting (pure, tested) ----------------------------------------------

/** "2026-09-28 14:05 ET": the shop's own clock, whatever the server's is. */
export function easternStamp(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} ET`;
}

/**
 * The lead as text: heading, then Name / Email / Phone, the check line
 * ("Email check: UNVERIFIED …", or `emailCheck` when the caller matched the
 * email to something, e.g. a paid order), "Customer: Existing customer …"
 * when `existing`, then the form's own fields in order (the message is last
 * in every form's list). A multi-line value starts on the line under its
 * label.
 */
export function formatLead(
  { form, name, email, phone, fields = [], emailCheck = null, existing = false },
  now = new Date(),
) {
  const title = FORM_TITLES[form] ?? `TireDrop ${form} form`;
  const check = email
    ? ["Email check", emailCheck ?? UNVERIFIED_EMAIL]
    : phone
      ? ["Phone check", UNVERIFIED_PHONE]
      : null;
  const pairs = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone],
    ...(check ? [check] : []),
    ...(existing ? [["Customer", EXISTING_CUSTOMER]] : []),
    ...fields,
  ].filter(([, value]) => value !== null && value !== undefined && String(value) !== "");
  return [
    `${title} — ${easternStamp(now)}`,
    ...pairs.map(([label, value]) =>
      String(value).includes("\n") ? `${label}:\n${value}` : `${label}: ${value}`,
    ),
  ].join("\n");
}

// A website lead's first line; a booked install (api/_lib/installBooking.js)
// puts "[BOOKED] #1001: …" on the line above it.
const LEAD_HEADING = /^(?:\[BOOKED\][^\n]*\n)?TireDrop .+ — \d{4}-\d{2}-\d{2} \d{2}:\d{2} ET/;

/**
 * The customer note with `entry` on top. Older entries follow, newest first.
 * Over `max` characters, the OLDEST website leads are dropped first; anything
 * else in the note (text staff wrote) is only cut, from its end, if the note
 * is still too long after that.
 */
export function prependToNote(entry, oldNote, max = NOTE_MAX) {
  const top = entry.length > max ? `${entry.slice(0, max - 1)}…` : entry;
  const old = String(oldNote ?? "").trim();
  if (!old) return top;

  const kept = old.split(NOTE_SEPARATOR);
  const join = () => [top, ...kept].join(NOTE_SEPARATOR);
  while (join().length > max) {
    let oldest = -1;
    for (let i = kept.length - 1; i >= 0; i -= 1) {
      if (LEAD_HEADING.test(kept[i].trim())) {
        oldest = i;
        break;
      }
    }
    if (oldest === -1) break;
    kept.splice(oldest, 1);
  }
  const note = join();
  return note.length > max
    ? note.slice(0, max - NOTE_TRIMMED.length).trimEnd() + NOTE_TRIMMED
    : note;
}

/** First and last name for a new customer ("Cher" is a first name). */
export function splitCustomerName(name) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.at(-1) };
}

// ---- Shopify ------------------------------------------------------------------

const userErrorText = (err) =>
  (err?.userErrors ?? [])
    .map((e) => `${Array.isArray(e?.field) ? e.field.join(".") : ""} ${e?.message ?? ""}`)
    .join(" ");

async function lookup(identifier, cfg, deps) {
  const data = await shopifyGraphQL(cfg, LEAD_CUSTOMER, { identifier }, deps);
  const c = data?.customer;
  return c?.id
    ? {
        id: c.id,
        created: false,
        tags: Array.isArray(c.tags) ? c.tags : [],
        leads: c.leads?.value ?? null,
      }
    : null;
}

/**
 * The customer a lead belongs to: found by email (else by phone), or
 * created with name, email and phone and nothing else. Resolves
 * `{ id, created, tags, leads }` (`leads`: the raw tiredrop.leads value).
 *
 * Two refusals are handled rather than failed on: an email or phone that
 * another request created a moment ago (found again), and a phone Shopify
 * will not take for a new customer, because it is invalid or already belongs
 * to someone else (the customer is created without it; the phone stays in
 * the lead text).
 */
export async function findOrCreateLeadCustomer({ name, email, phoneE164 }, cfg, deps = {}) {
  const identifier = email ? { emailAddress: email } : { phoneNumber: phoneE164 };
  if (!email && !phoneE164) {
    throw new ShopifyCheckoutError("A lead needs an email or a phone to find its customer.", {
      status: 500,
    });
  }
  const found = await lookup(identifier, cfg, deps);
  if (found) return found;

  const input = {
    ...splitCustomerName(name),
    ...(email ? { email } : {}),
    ...(phoneE164 ? { phone: phoneE164 } : {}),
  };
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const data = await shopifyGraphQL(cfg, LEAD_CUSTOMER_CREATE, { input }, deps);
      const id = data?.customerCreate?.customer?.id;
      if (!id) throw new ShopifyCheckoutError("Shopify created no customer for the lead.");
      return { id, created: true, tags: [], leads: null };
    } catch (err) {
      if (!(err instanceof ShopifyCheckoutError) || !err.userErrors) throw err;
      const text = userErrorText(err);
      if (/taken/i.test(text)) {
        // Created by a parallel request since the lookup: use that customer.
        const again = await lookup(identifier, cfg, deps);
        if (again) return again;
      }
      if (email && input.phone && /phone/i.test(text)) {
        delete input.phone;
        continue;
      }
      throw err;
    }
  }
  throw new ShopifyCheckoutError("Shopify would not create the customer for the lead.");
}

/** The tiredrop.leads list as stored (newest first), or [] when unreadable. */
export function parseLeads(value) {
  if (typeof value !== "string" || !value) return [];
  try {
    const list = JSON.parse(value);
    return Array.isArray(list)
      ? list.filter((e) => e && typeof e === "object" && typeof e.text === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * The tiredrop.leads list with `entry` on top: at most LEADS_KEEP entries
 * and LEADS_MAX_CHARS of JSON, the oldest dropped first. Earlier entries are
 * kept exactly as they were.
 */
export function pushLead(entry, oldValue, { keep = LEADS_KEEP, maxChars = LEADS_MAX_CHARS } = {}) {
  const top = { ...entry, text: String(entry.text ?? "").slice(0, NOTE_MAX) };
  const list = [top, ...parseLeads(oldValue)].slice(0, keep);
  while (list.length > 1 && JSON.stringify(list).length > maxChars) list.pop();
  return list;
}

/**
 * Saves `text` on the customer and fires the alert tags:
 *   1. metafieldsSet: tiredrop.last_lead = text, and tiredrop.leads with
 *      the text pushed on top (one call);
 *   2. the customer note = text, ONLY when `customer.created` (this
 *      submission made the customer). An existing customer's note is never
 *      touched;
 *   3. tagsAdd "new-lead", "lead", "lead-<form>" and any `extraTags` (a
 *      booking for a paid order adds "install-booking" and "order-<ref>").
 *      Nothing is ever removed.
 * The text is written before the tags, so Flow always reads the new lead
 * when the tag lands.
 */
export async function saveLead(customer, form, text, cfg, deps = {}, extraTags = []) {
  const { log = console, now = () => new Date() } = deps;
  const leads = pushLead({ at: new Date(now()).toISOString(), form, text }, customer.leads);
  await shopifyGraphQL(
    cfg,
    LEAD_METAFIELD_SET,
    {
      metafields: [
        { ownerId: customer.id, ...LEAD_METAFIELD, value: text },
        { ownerId: customer.id, ...LEADS_METAFIELD, value: JSON.stringify(leads) },
      ],
    },
    deps,
  );
  if (customer.created) {
    await shopifyGraphQL(
      cfg,
      LEAD_NOTE_UPDATE,
      { input: { id: customer.id, note: prependToNote(text, "") } },
      deps,
    );
  }
  if ((customer.tags ?? []).includes(ALERT_TAG)) {
    // Flow removes the tag after each email; still there means an alert is
    // in flight (or Flow failed to finish one). Tags are never removed from
    // here, so this lead's alert depends on another tag being new.
    log.warn(
      `[leads] ${customer.id} still has "${ALERT_TAG}" (Flow has not cleared the last alert); ` +
        "this lead is saved in tiredrop.last_lead and tiredrop.leads.",
    );
  }
  await shopifyGraphQL(cfg, LEAD_TAGS_ADD, { id: customer.id, tags: leadTags(form, extraTags) }, deps);
}

/**
 * Records one validated website form (validateLead's `value`) in Shopify.
 * Resolves `{ customerId, created }`; throws ShopifyCheckoutError when
 * Shopify refuses or cannot be reached.
 */
export async function recordLead(lead, cfg, deps = {}) {
  const { now = () => new Date() } = deps;
  const customer = await findOrCreateLeadCustomer(lead, cfg, deps);
  const text = formatLead({ ...lead, existing: !customer.created }, now());
  await saveLead(customer, lead.form, text, cfg, deps, lead.tags ?? []);
  return { customerId: customer.id, created: customer.created };
}
