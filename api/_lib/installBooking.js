// Booking the install of a PAID order (POST /api/book-install, the inline
// panel on /track, and /schedule?order= through /api/forms).
// docs/integrations/install-scheduling.md.
//
// The order is checked the way /track checks it: the order number (or the
// site's TD- ref) AND the email on the order (case-insensitive), then paid,
// not cancelled, not fulfilled, and involving installation (needsBooking /
// installKind in api/_lib/booking.js, the webhook's own rule). Anything else
// is the same "not found".
//
// Booking writes, in this order:
//   1. orderUpdate: the order note gets one line appended (the note already
//      there is kept):
//        Install booked (customer request): Thursday, October 1, 2026, 8:00 – 10:00 AM. Notes: …
//      and the order metafield tiredrop.install_booking (json: day, window,
//      notes, bookedAt) is set in the same call.
//   2. The booking lead: the customer (found by the order's email, else
//      created) gets the lead text, starting "[BOOKED] #1001: <day> <window>",
//      and the tags install-booking and order-<ref>. That fires the existing
//      "Website lead alert" Flow, which emails info@ (api/_lib/leads.js).
//   3. tagsAdd install-booked on the ORDER. This is the commit: from here the
//      order counts as booked, and the Flow "Needs scheduling alert" (order
//      paid, wait 24 hours, needs-scheduling AND NOT install-booked) stays
//      quiet.
//   4. tagsRemove needs-scheduling on the order.
// A failure at any step stops there, is logged with what was and was not
// done, and is answered as a failure: nothing claims a booking that is not
// on the order. A retry is safe: the note line is not appended twice, and a
// booking that got as far as step 3 is answered as already booked.
//
// Idempotent: an order already tagged install-booked is answered with its
// booking (from the metafield, else from the note line) and nothing changes.
//
// Operations validated against the Admin GraphQL schema (2026-07). Scopes:
// read_orders, write_orders (checked first with appHasScope, as the webhook
// does), read_customers and write_customers (the lead).

import {
  BOOKING_TAGS_ADD,
  INSTALL_BOOKED_TAG,
  NEEDS_SCHEDULING_TAG,
  WRITE_ORDERS,
  bookingRefFor,
  hasTag,
  installKind,
  needsBooking,
  readOrderContact,
  vehicleFor,
} from "./booking.js";
import { ORDER_FIELDS, TRACK_ORDER_QUERY, normalizeEmail, orderSearch, sameEmail } from "./track.js";
import { appHasScope, shopifyGraphQL, toE164 } from "./shopify.js";
import { findOrCreateLeadCustomer, formatLead, saveLead } from "./leads.js";
import { cleanText } from "./validate.js";
import {
  INSTALL_BOOKING_TAG,
  PAID_BOOKING_MAX_DAYS,
  PAID_BOOKING_MIN_DAYS,
  bookingRefTag,
  formatInstallDay,
  installSlotErrors,
  installWindow,
  parseBookingRef,
  parseInstallDay,
  shopToday,
} from "../../src/data/booking.js";
import { BUSINESS } from "../../src/data/business.js";
import { MOBILE_AREA_ERROR, isInServiceArea } from "../../src/data/serviceArea.js";

export const BOOKING_METAFIELD = Object.freeze({
  namespace: "tiredrop",
  key: "install_booking",
  type: "json",
});

export const BOOKING_NOTE_PREFIX = "Install booked (customer request): ";
export const BOOKING_NOTES_MAX = 500;

/** Orders under one email, newest first: how a TD- ref is found. */
export const BOOKING_ORDERS_BY_EMAIL = `query bookingOrdersByEmail($query: String!) {
  orders(first: 10, query: $query, sortKey: CREATED_AT, reverse: true) {
    nodes {
      ${ORDER_FIELDS}
    }
  }
}`;

export const BOOKING_ORDER_UPDATE = `mutation bookingOrderUpdate($input: OrderInput!) {
  orderUpdate(input: $input) {
    order { id }
    userErrors { field message }
  }
}`;

/**
 * The service address ZIP of a mobile-install order. Its own read, so a store
 * whose app may not read addresses still books (the check is then skipped:
 * checkout already held the order to the ZIP rule).
 */
export const BOOKING_SERVICE_ZIP_QUERY = `query bookingServiceZip($id: ID!) {
  order(id: $id) {
    shippingAddress { zip }
  }
}`;

export const BOOKING_TAGS_REMOVE = `mutation bookingTagsRemove($id: ID!, $tags: [String!]!) {
  tagsRemove(id: $id, tags: $tags) {
    node { id }
    userErrors { field message }
  }
}`;

// ---- Answers (safe to show; none says whether an order exists) --------------------

export const BOOK_NOT_FOUND =
  `We couldn't find a paid install order with that number and email. Check both against your confirmation email, or call the shop at ${BUSINESS.phone}.`;
export const BOOK_FAILED =
  `We couldn't save your install request just now, so it is not in yet. Please try again in a minute, or call the shop at ${BUSINESS.phone}.`;
/** A mobile-install order whose service ZIP is outside the area (400). */
export const BOOK_OUT_OF_AREA = MOBILE_AREA_ERROR;
export const BOOK_UNAVAILABLE =
  `Online install requests aren't available right now. Please call the shop at ${BUSINESS.phone} to set up your install.`;

// ---- Input (pure, tested) ------------------------------------------------------------

/**
 * Validates `{ order, email, day, window, notes?, website? }`. `order` is an
 * order number ("#1001", "1001") or the site's ref ("TD-260929-ABC234").
 * `day` is "YYYY-MM-DD", tomorrow to 60 days out in Florida, not a Sunday;
 * `window` one of /schedule's windows (4 – 6 PM weekdays only).
 * Returns `{ ok: true, bot: true }` (honeypot), `{ ok: false, error, field }`
 * or `{ ok: true, value: { ref, email, day, window, notes } }`.
 */
export function validateBookInstall(body, now = new Date()) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Send the booking as a JSON object.", field: null };
  }
  if (cleanText(body.website)) return { ok: true, bot: true };
  const ref = parseBookingRef(cleanText(body.order));
  if (!ref) {
    return { ok: false, error: "Enter your order number (like #1001).", field: "order" };
  }
  const email = normalizeEmail(body.email);
  if (!email) return { ok: false, error: "Enter the email address on the order.", field: "email" };
  const day = cleanText(body.day ?? body.date);
  const window = cleanText(body.window);
  const slot = checkSlot({ day, window }, now);
  if (slot) return { ok: false, ...slot };
  const notes = cleanText(body.notes);
  if (notes.length > BOOKING_NOTES_MAX) {
    return { ok: false, error: `Notes are too long (${BOOKING_NOTES_MAX} characters at most).`, field: "notes" };
  }
  return { ok: true, bot: false, value: { ref, email, day, window, notes } };
}

/** `{ error, field }` for a bad day or window (paid-booking rules), else null. */
export function checkSlot({ day, window }, now = new Date()) {
  const errors = installSlotErrors(
    { date: day, window },
    { today: shopToday(now), minDays: PAID_BOOKING_MIN_DAYS, maxDays: PAID_BOOKING_MAX_DAYS },
  );
  if (errors.date) return { error: errors.date, field: "day" };
  if (errors.window) return { error: errors.window, field: "window" };
  return null;
}

// ---- The booking on an order (pure, tested) -------------------------------------------

/** The public view of a booking: `{ day, window, dayLabel, windowLabel, notes }`. */
export function publicBooking({ day, window, notes = "" }) {
  return {
    day,
    window,
    dayLabel: formatInstallDay(day),
    windowLabel: installWindow(window)?.label ?? "",
    notes: notes || "",
  };
}

/** The line appended to the order note. */
export function bookingNoteLine({ day, window, notes }) {
  const b = publicBooking({ day, window, notes });
  return `${BOOKING_NOTE_PREFIX}${b.dayLabel}, ${b.windowLabel}. Notes: ${b.notes || "none"}`;
}

/**
 * The note with `line` added on a line of its own at the end. Everything
 * already in the note is kept; a line already there is not added again (a
 * retried booking).
 */
export function appendNoteLine(note, line) {
  const old = String(note ?? "").replace(/\s+$/, "");
  if (old.split("\n").some((l) => l.trim() === line)) return old;
  return old ? `${old}\n${line}` : line;
}

const NOTE_LINE_RE = /^Install booked \(customer request\): ([A-Za-z]+, [A-Za-z]+ \d{1,2}, \d{4}), (.+?)\. Notes: (.*)$/;

/** The newest booking line in an order note, or null. */
export function bookingFromNote(note) {
  const lines = String(note ?? "").split("\n").map((l) => l.trim()).reverse();
  for (const line of lines) {
    const m = NOTE_LINE_RE.exec(line);
    if (!m) continue;
    const day = parseInstallDay(m[1]);
    const w = installWindow(m[2]);
    if (!day || !w) continue;
    return { day, window: w.value, notes: m[3] === "none" ? "" : m[3] };
  }
  return null;
}

/** The booking in the metafield's JSON, or null. */
export function bookingFromMetafield(value) {
  if (typeof value !== "string" || !value) return null;
  try {
    const b = JSON.parse(value);
    const w = installWindow(b?.window);
    if (!b || !parseInstallDay(formatInstallDay(b.day)) || !w) return null;
    return {
      day: b.day,
      window: w.value,
      notes: typeof b.notes === "string" ? b.notes : "",
      bookedAt: typeof b.bookedAt === "string" ? b.bookedAt : null,
    };
  } catch {
    return null;
  }
}

/**
 * The booking stored on an order (the metafield, else the note line), as
 * publicBooking, or null when the order carries none.
 */
export function readInstallBooking(node) {
  const b = bookingFromMetafield(node?.installBooking?.value) ?? bookingFromNote(node?.note);
  return b ? publicBooking(b) : null;
}

/**
 * The lead text for info@: "[BOOKED] #1001: Thursday, October 1, 2026
 * 8:00 – 10:00 AM" on the first line, then the lead as every website form
 * writes it (name, email, phone, then the booking's own fields).
 */
export function bookedLeadText({ orderName, ref, booking, name, email, phone, install, vehicle, fields = [], source }, now = new Date()) {
  const b = publicBooking(booking);
  const where = install === "mobile"
    ? "Mobile install at the customer's address (on the order)"
    : `At the shop (${BUSINESS.shop.full})`;
  return [
    `[BOOKED] ${orderName}: ${b.dayLabel} ${b.windowLabel}`,
    formatLead(
      {
        form: "booking",
        name,
        email,
        phone,
        fields: [
          ["Paid order", ref && ref !== orderName ? `${orderName} (${ref})` : orderName],
          ["Requested day", b.dayLabel],
          ["Requested window", b.windowLabel],
          ["Where", where],
          ["Vehicle", vehicle],
          ...fields,
          ["Customer notes", b.notes],
          ["Booked from", source],
          ["Next step", `The order is tagged ${INSTALL_BOOKED_TAG}. This is the customer's requested day and window: confirm the exact time with them and book it in Tire Guru.`],
        ],
      },
      now,
    ),
  ].join("\n");
}

// ---- Shopify ------------------------------------------------------------------------------

/**
 * The order `ref` names, only when its email matches (case-insensitive), or
 * null. An order number is searched with its email, as /track does; a TD-
 * ref is found among that email's orders by its "Order ref" attribute (or
 * checkout note).
 */
export async function findOrderForBooking({ ref, email }, cfg, deps = {}) {
  if (ref.startsWith("#")) {
    const data = await shopifyGraphQL(cfg, TRACK_ORDER_QUERY, { query: orderSearch(ref, email) }, deps);
    return (data?.orders?.nodes ?? []).find(
      (o) => String(o?.name ?? "").toUpperCase() === ref && sameEmail(o.email, email),
    ) ?? null;
  }
  const data = await shopifyGraphQL(cfg, BOOKING_ORDERS_BY_EMAIL, { query: `email:${email}` }, deps);
  return (data?.orders?.nodes ?? []).find(
    (o) => sameEmail(o.email, email) && bookingRefFor(o) === ref,
  ) ?? null;
}

/**
 * The 5-digit ZIP the van would drive to on a mobile-install order, or null
 * when the order has none or Shopify will not say (logged, never thrown).
 */
export async function readServiceZip(node, cfg, deps = {}) {
  const log = deps.log ?? console;
  try {
    const data = await shopifyGraphQL(cfg, BOOKING_SERVICE_ZIP_QUERY, { id: node.id }, deps);
    const zip = String(data?.order?.shippingAddress?.zip ?? "").trim();
    return zip || null;
  } catch (err) {
    log.warn(`[book-install] ${node.name ?? node.id}: service ZIP not read (${err?.message}); booking without the area check.`);
    return null;
  }
}

/** True when `node` is an order this booking may be made on. */
export const bookable = (node) => Boolean(node?.id) && needsBooking(node);

const STEP_TEXT = Object.freeze({
  "order-note": "order note + tiredrop.install_booking metafield",
  lead: "booking lead to info@ (install-booking, order-<ref>)",
  "tag-booked": `tag ${INSTALL_BOOKED_TAG}`,
  "untag-scheduling": `remove tag ${NEEDS_SCHEDULING_TAG}`,
});
const STEPS = Object.keys(STEP_TEXT);

/**
 * Books the install on a verified, bookable order `node` (findOrderForBooking
 * + bookable). `request` is `{ email, day, window, notes, name?, phone?,
 * fields?, source }`: `email` the address that matched the order, `name` /
 * `phone` what the customer typed (else the order's own), `fields` extra
 * [label, value] pairs for the lead (the /schedule form's answers).
 *
 * Resolves one of:
 *   { result: "already-booked", booking }   nothing written
 *   { result: "out-of-area" }               a mobile order whose service ZIP
 *                                           is outside the area: nothing
 *                                           written (BOOK_OUT_OF_AREA, 400)
 *   { result: "booked", booking }
 *   { result: "missing-scope" }             the app lacks write_orders
 *   { result: "failed", step, done }        a write failed; logged
 * Never throws for a write; `deps.log` gets the details.
 */
export async function bookOrderInstall(node, request, config, deps = {}) {
  const log = deps.log ?? console;
  const now = deps.now ? new Date(deps.now()) : new Date();
  const cfg = config.shopify;
  const label = node.name ?? node.id;

  if (hasTag(node, INSTALL_BOOKED_TAG)) {
    return { result: "already-booked", booking: readInstallBooking(node) };
  }

  // The van only goes inside the service area (src/data/serviceArea.js).
  if (installKind(node) === "mobile") {
    const zip = await readServiceZip(node, cfg, deps);
    if (zip && !isInServiceArea(zip)) {
      log.warn(`[book-install] ${label}: NOT booked: mobile install at ZIP ${zip}, outside the service area. The customer was told to ship to the shop or call.`);
      return { result: "out-of-area" };
    }
  }

  const missingScope = () => {
    log.error(
      `[book-install] ${label}: NOT booked: the Shopify app lacks the ${WRITE_ORDERS} scope. ` +
        "Add it to the app (docs/integrations/install-scheduling.md, \"Scopes\"). The customer was told to call.",
    );
    return { result: "missing-scope" };
  };
  try {
    if ((await appHasScope(cfg, WRITE_ORDERS, deps)) === false) return missingScope();
  } catch (err) {
    log.warn(`[book-install] ${label}: could not read the app's scopes (${err?.message}); trying anyway.`);
  }

  const booking = {
    day: request.day,
    window: request.window,
    notes: request.notes ?? "",
    bookedAt: now.toISOString(),
  };
  const ref = bookingRefFor(node) ?? node.name;
  const contact = await readOrderContact(node, config, deps, { tag: "[book-install]" });
  const name = cleanText(request.name) || contact.name;
  const phone = cleanText(request.phone) || contact.phone;
  const email = normalizeEmail(request.email) ?? normalizeEmail(node.email);

  const done = [];
  const run = async (step, fn) => {
    try {
      await fn();
      done.push(step);
      return true;
    } catch (err) {
      const left = STEPS.filter((s) => !done.includes(s));
      const scope = /access denied|access_denied|write_orders|scope/i.test(String(err?.message));
      log.error(
        `[book-install] ${label}: FAILED at "${STEP_TEXT[step]}" (${err?.message ?? err}). ` +
          `Done: ${done.map((s) => STEP_TEXT[s]).join("; ") || "nothing"}. ` +
          `Not done: ${left.map((s) => STEP_TEXT[s]).join("; ")}. ` +
          `Requested: ${bookingNoteLine(booking)}` +
          (scope ? ` Check the app's ${WRITE_ORDERS} scope.` : ""),
      );
      return false;
    }
  };
  const failed = (step) => ({ result: "failed", step, done: [...done] });

  if (
    !(await run("order-note", () =>
      shopifyGraphQL(cfg, BOOKING_ORDER_UPDATE, {
        input: {
          id: node.id,
          note: appendNoteLine(node.note, bookingNoteLine(booking)),
          metafields: [{ ...BOOKING_METAFIELD, value: JSON.stringify(booking) }],
        },
      }, deps),
    ))
  ) return failed("order-note");

  if (
    !(await run("lead", async () => {
      const text = bookedLeadText(
        {
          orderName: node.name,
          ref,
          booking,
          name,
          email,
          phone,
          install: installKind(node),
          vehicle: vehicleFor(node),
          fields: request.fields ?? [],
          source: request.source,
        },
        now,
      );
      const customer = await findOrCreateLeadCustomer(
        { name, email, phoneE164: toE164(phone) },
        cfg,
        deps,
      );
      await saveLead(customer, "booking", text, cfg, deps, [INSTALL_BOOKING_TAG, bookingRefTag(ref)]);
    }))
  ) return failed("lead");

  if (
    !(await run("tag-booked", () =>
      shopifyGraphQL(cfg, BOOKING_TAGS_ADD, { id: node.id, tags: [INSTALL_BOOKED_TAG] }, deps),
    ))
  ) return failed("tag-booked");

  if (
    !(await run("untag-scheduling", () =>
      shopifyGraphQL(cfg, BOOKING_TAGS_REMOVE, { id: node.id, tags: [NEEDS_SCHEDULING_TAG] }, deps),
    ))
  ) return failed("untag-scheduling");

  log.log(`[book-install] ${label}: booked (${bookingNoteLine(booking)}); tagged ${INSTALL_BOOKED_TAG}, ${NEEDS_SCHEDULING_TAG} removed, lead sent.`);
  return { result: "booked", booking: publicBooking(booking) };
}

// ---- /schedule?order= through /api/forms ----------------------------------------------

/** The /schedule fields that the booking itself carries, left out of the lead's extras. */
const BOOKING_OWN_LABELS = new Set(["Paid order", "Preferred date", "Time window", "Notes"]);

/**
 * A /schedule booking that names a paid order (validateLead's value with
 * `order`). When the order verifies (its number or ref AND the email typed
 * on the form) and can be booked, it is booked exactly like /track's panel
 * (bookOrderInstall), and the answer is returned as `{ status, body }`.
 * Otherwise resolves null and /api/forms records the plain lead as before:
 * an order that does not verify, a phone-only booking, an order Shopify
 * would not read, or an app without write_orders.
 */
export async function bookFromLead(lead, config, deps = {}) {
  const log = deps.log ?? console;
  if (!lead?.order || !lead.email) return null;
  let node;
  try {
    node = await findOrderForBooking({ ref: lead.order, email: lead.email }, config.shopify, deps);
  } catch (err) {
    log.warn(`[forms] booking for ${lead.order}: the order could not be read (${err?.message}); sent as a plain lead.`);
    return null;
  }
  if (!bookable(node)) return null;

  if (hasTag(node, INSTALL_BOOKED_TAG)) {
    return {
      status: 200,
      body: { ok: true, booking: { ...readInstallBooking(node), alreadyBooked: true } },
    };
  }
  const value = (label) => lead.fields.find(([l]) => l === label)?.[1] ?? "";
  const day = value("Preferred date");
  const window = value("Time window");
  const now = deps.now ? new Date(deps.now()) : new Date();
  const slot = checkSlot({ day, window }, now);
  if (slot) return { status: 400, body: { error: slot.error } };

  const notes = cleanText(value("Notes"));
  const outcome = await bookOrderInstall(
    node,
    {
      email: lead.email,
      day,
      window,
      notes: notes.length > BOOKING_NOTES_MAX ? `${notes.slice(0, BOOKING_NOTES_MAX - 1)}…` : notes,
      name: lead.name,
      phone: lead.phone,
      fields: lead.fields.filter(([l]) => !BOOKING_OWN_LABELS.has(l)),
      source: "Schedule page (/schedule?order=)",
    },
    config,
    deps,
  );
  if (outcome.result === "booked") {
    return { status: 200, body: { ok: true, booking: { ...outcome.booking, alreadyBooked: false } } };
  }
  if (outcome.result === "already-booked") {
    return { status: 200, body: { ok: true, booking: { ...outcome.booking, alreadyBooked: true } } };
  }
  if (outcome.result === "missing-scope") return null;
  if (outcome.result === "out-of-area") return { status: 400, body: { error: BOOK_OUT_OF_AREA } };
  return { status: 502, body: { error: BOOK_FAILED } };
}
