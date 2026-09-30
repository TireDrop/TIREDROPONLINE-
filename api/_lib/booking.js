// Install scheduling after payment: the hand-off from a PAID order that
// involves installation to the shop's scheduler (Tire Guru), however the shop
// ends up taking bookings. docs/integrations/install-scheduling.md.
//
//   * orders/paid webhook: an install order gets the tag "needs-scheduling"
//     (markNeedsScheduling), which a Shopify Flow turns into an email to
//     info@. Idempotent, and never fails the webhook.
//   * /track: a paid, unfulfilled install order gets a "Schedule your
//     install" call to action (bookingForOrder):
//       - already booked (tag install-booked): the requested day and window;
//       - INSTALL_BOOKING_URL set: that link, filled on the SERVER with the
//         verified order's details (fillBookingUrl), and nothing else;
//       - not set: the inline booking panel (POST /api/book-install,
//         api/_lib/installBooking.js), which tags the order install-booked.
//         /schedule?order=<ref> keeps working and books the same way.
//
// "Involves installation" (installKind): ship-to-store / pickup at the shop
// (install at the shop), mobile install, or an install line on the order.
//
// Shopify operations validated against Admin GraphQL 2026-07. Scopes:
// write_orders for the tag (the ATD forwarder already needs it), read_orders
// for the contact read on /track.

import { BOOKING_PLACEHOLDERS } from "./config.js";
import { appHasScope, shopifyGraphQL } from "./shopify.js";
import { deliveryType } from "./track.js";
import { parseBookingRef, schedulePath } from "../../src/data/booking.js";

export const NEEDS_SCHEDULING_TAG = "needs-scheduling";
/**
 * Put on the ORDER once the customer has booked (api/_lib/installBooking.js).
 * The Flow "Needs scheduling alert" (order paid, wait 24 hours) only emails
 * info@ when the order has needs-scheduling and NOT install-booked.
 */
export const INSTALL_BOOKED_TAG = "install-booked";
export const WRITE_ORDERS = "write_orders";

export const BOOKING_TAGS_ADD = `mutation bookingTagsAdd($id: ID!, $tags: [String!]!) {
  tagsAdd(id: $id, tags: $tags) {
    node { id }
    userErrors { field message }
  }
}`;

/**
 * The contact on a paid order, read only after /track has matched the order
 * by number AND email, and only to hand the customer's own details back to
 * them for the booking. Separate from the lookup so a store whose app may
 * not read these fields still answers /track (the booking just starts
 * without them).
 */
export const BOOKING_CONTACT_QUERY = `query bookingContact($id: ID!) {
  order(id: $id) {
    phone
    shippingAddress { name phone }
    billingAddress { name phone }
    customer { displayName }
  }
}`;

// ---- Order facts (pure, tested) ------------------------------------------------

export const hasTag = (node, tag) =>
  (node?.tags ?? []).some((t) => String(t).trim().toLowerCase() === tag);
const attribute = (node, key) =>
  (node?.customAttributes ?? []).find((a) => a?.key === key)?.value ?? null;

// The order note as checkout writes it (api/_lib/shopify.js noteFor, then the
// customer's notes from CheckoutPage): "Customer: Name, phone",
// "Customer notes: Vehicle: 2020 Toyota Camry LE", "Install at the shop: …".
const NOTE_LINE = (label) =>
  new RegExp(`^\\s*(?:Customer notes:\\s*)?${label}:[ \\t]*(.+)$`, "im");

/** True when a line item or the checkout note says the tires are installed. */
export function hasInstallLine(node) {
  const lines = node?.lineItems?.nodes ?? [];
  if (lines.some((l) => /\binstall(ation|ed)?\b/i.test(String(l?.title ?? l?.name ?? "")))) {
    return true;
  }
  return NOTE_LINE("Install at the shop").test(String(node?.note ?? ""));
}

/**
 * "shop" (install at the shop: ship-to-store, pickup, or an install line),
 * "mobile" (van install at the customer's address) or null (shipped, no
 * install). `node` is a GraphQL order (or restPayloadToNode's shape).
 */
export function installKind(node) {
  const delivery = deliveryType(node);
  if (delivery === "mobile") return "mobile";
  if (delivery === "ship-to-store" || delivery === "pickup") return "shop";
  return hasInstallLine(node) ? "shop" : null;
}

/**
 * An orders/* webhook body (REST shape) as the fields installKind reads:
 * tags, Delivery attribute, shipping line, line titles and note.
 */
export function restPayloadToNode(payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  return {
    tags: String(p.tags ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    customAttributes: (Array.isArray(p.note_attributes) ? p.note_attributes : []).map((a) => ({
      key: a?.name ?? null,
      value: a?.value == null ? null : String(a.value),
    })),
    shippingLine: Array.isArray(p.shipping_lines) && p.shipping_lines[0]
      ? { title: String(p.shipping_lines[0].title ?? "") }
      : null,
    lineItems: {
      nodes: (Array.isArray(p.line_items) ? p.line_items : []).map((l) => ({
        title: String(l?.title ?? l?.name ?? ""),
      })),
    },
    note: typeof p.note === "string" ? p.note : "",
  };
}

/**
 * The reference a booking is linked to: the site's TD- ref (the "Order ref"
 * attribute, else the checkout note) when the order has one, else the
 * Shopify order name ("#1001").
 */
export function bookingRefFor(node) {
  const fromAttr = parseBookingRef(attribute(node, "Order ref") ?? "");
  if (fromAttr && fromAttr.startsWith("TD-")) return fromAttr;
  const inNote = /\bTD-\d{6}-[A-HJ-NP-Z2-9]{6}\b/.exec(String(node?.note ?? ""));
  const fromNote = inNote ? parseBookingRef(inNote[0]) : null;
  if (fromNote) return fromNote;
  return parseBookingRef(String(node?.name ?? ""));
}

const text = (v, max) => {
  const s = typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
  return s.length > max ? s.slice(0, max) : s;
};

/** "2020 Toyota Camry LE" from the "Vehicle" attribute or the checkout note. */
export function vehicleFor(node) {
  const attr = text(attribute(node, "Vehicle") ?? "", 80);
  if (attr) return attr;
  const m = NOTE_LINE("Vehicle").exec(String(node?.note ?? ""));
  return m ? text(m[1], 80) : "";
}

/** Name and phone from checkout's "Customer: Name, phone" note line. */
export function contactFromNote(node) {
  const m = /^\s*Customer:[ \t]*(.+?),[ \t]*([+()\d][\d\s().+-]{6,})\s*$/m.exec(String(node?.note ?? ""));
  return m ? { name: text(m[1], 100), phone: text(m[2], 30) } : { name: "", phone: "" };
}

/** A paid, not cancelled, not yet fulfilled order that involves installation. */
export function needsBooking(node) {
  if (!node || node.cancelledAt) return false;
  if (String(node.displayFinancialStatus ?? "").toUpperCase() !== "PAID") return false;
  if (String(node.displayFulfillmentStatus ?? "").toUpperCase() === "FULFILLED") return false;
  return installKind(node) !== null;
}

// ---- The booking link ---------------------------------------------------------

/**
 * INSTALL_BOOKING_URL with each placeholder replaced by its value,
 * URL-encoded (encodeURIComponent, so "&", "#", "/", "?" and spaces cannot
 * break out of the slot they are in). A missing value fills as "". Returns
 * null when `template` is empty or the result is not an https URL on the
 * template's own host.
 */
export function fillBookingUrl(template, values = {}) {
  if (typeof template !== "string" || !template) return null;
  const pattern = new RegExp(`\\{(${BOOKING_PLACEHOLDERS.join("|")})\\}`, "g");
  const filled = template.replace(pattern, (_, key) =>
    encodeURIComponent(values[key] == null ? "" : String(values[key])),
  );
  try {
    const url = new URL(filled);
    const base = new URL(template.replace(pattern, "x"));
    if (url.protocol !== "https:" || url.host !== base.host) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * The customer's name and phone for a verified order: checkout's own note
 * line first for the name, the order's phone fields first for the phone,
 * then the addresses and the customer. Best effort: if Shopify refuses the
 * read (for example the app may not read customer names and phones), what
 * the note has is used. Resolves `{ name, phone }`.
 */
export async function readOrderContact(node, config, deps = {}, { tag = "[track]" } = {}) {
  const log = deps.log ?? console;
  const noted = contactFromNote(node);
  let name = noted.name;
  let phone = noted.phone;
  if (node?.id) {
    try {
      const data = await shopifyGraphQL(config.shopify, BOOKING_CONTACT_QUERY, { id: node.id }, deps);
      const o = data?.order ?? {};
      name = name || text(o.shippingAddress?.name ?? "", 100) || text(o.billingAddress?.name ?? "", 100) ||
        text(o.customer?.displayName ?? "", 100);
      phone = text(o.phone ?? "", 30) || text(o.shippingAddress?.phone ?? "", 30) ||
        text(o.billingAddress?.phone ?? "", 30) || phone;
    } catch (err) {
      log.warn(`${tag} booking contact for ${node.name ?? "an order"} not read (${err?.message}); the booking starts without it.`);
    }
  }
  return { name, phone };
}

/**
 * The call to action for a verified order, or null when it needs none.
 *   { mode: "booked", ref, install, booking }         already booked: the
 *                                                     requested day and window
 *   { mode: "external", url }                         INSTALL_BOOKING_URL
 *   { mode: "internal", ref, path, install, prefill } the inline booking on
 *                                                     /track (POST
 *                                                     /api/book-install), or
 *                                                     /schedule?order=<ref>
 * `email` is the address /track just matched. `readBooking` (from
 * api/_lib/installBooking.js) reads the stored booking off a booked order.
 */
export async function bookingForOrder(node, config, deps = {}, { email = "", readBooking = null } = {}) {
  if (!needsBooking(node)) return null;
  const log = deps.log ?? console;
  const ref = bookingRefFor(node);
  if (!ref) return null;
  const install = installKind(node);

  if (hasTag(node, INSTALL_BOOKED_TAG)) {
    const booking = readBooking ? readBooking(node) : null;
    return { mode: "booked", ref, install, booking };
  }

  const { name, phone } = await readOrderContact(node, config, deps);
  const vehicle = vehicleFor(node);

  if (config.booking?.mode === "external") {
    const url = fillBookingUrl(config.booking.template, {
      orderRef: ref,
      name,
      email,
      phone,
      vehicle,
    });
    if (url) return { mode: "external", url };
    log.error("[track] INSTALL_BOOKING_URL could not be filled into an https link; falling back to /schedule.");
  }
  return {
    mode: "internal",
    ref,
    path: schedulePath(ref),
    install,
    prefill: { name, email, phone, vehicle },
  };
}

// ---- orders/paid: the needs-scheduling tag ------------------------------------------

/**
 * Tags a paid install order "needs-scheduling" (tagsAdd, which never
 * duplicates a tag). Never throws: the webhook's answer and the ATD
 * forwarder do not depend on it. Resolves `{ result, reason? }`:
 *   "not-install"     nothing to schedule
 *   "already-tagged"  the delivery already carried the tag
 *   "already-booked"  the order is tagged install-booked: nothing to chase
 *   "tagged"
 *   "missing-scope"   the app lacks write_orders: logged, see the doc
 *   "failed"          Shopify refused or did not answer: logged
 * `payload` is the orders/paid body; `deps` the Shopify transport deps
 * (fetchImpl, retryDelayMs, now) plus `log`.
 */
export async function markNeedsScheduling(shopifyCfg, orderId, payload, deps = {}) {
  const log = deps.log ?? console;
  const node = restPayloadToNode(payload);
  const label = payload?.name ?? orderId;
  if (!installKind(node)) return { result: "not-install" };
  if (hasTag(node, NEEDS_SCHEDULING_TAG)) return { result: "already-tagged" };
  // A late or repeated delivery for an order the customer has already booked.
  if (hasTag(node, INSTALL_BOOKED_TAG)) return { result: "already-booked" };

  const missingScope = () => {
    log.error(
      `[webhook] orders/paid ${label}: NOT tagged ${NEEDS_SCHEDULING_TAG}: the Shopify app lacks the ${WRITE_ORDERS} scope. ` +
        "Add it to the app (docs/integrations/install-scheduling.md, \"Scopes\").",
    );
    return { result: "missing-scope" };
  };
  try {
    if ((await appHasScope(shopifyCfg, WRITE_ORDERS, deps)) === false) return missingScope();
  } catch (err) {
    // Could not ask; the write below will say.
    log.warn(`[webhook] orders/paid ${label}: could not read the app's scopes (${err?.message}); trying the tag anyway.`);
  }
  try {
    await shopifyGraphQL(shopifyCfg, BOOKING_TAGS_ADD, { id: orderId, tags: [NEEDS_SCHEDULING_TAG] }, deps);
    log.log(`[webhook] orders/paid ${label}: tagged ${NEEDS_SCHEDULING_TAG}`);
    return { result: "tagged" };
  } catch (err) {
    if (/access denied|access_denied|write_orders|scope/i.test(String(err?.message))) return missingScope();
    log.error(`[webhook] orders/paid ${label}: could not tag ${NEEDS_SCHEDULING_TAG} (${err?.message}). Tag it by hand.`);
    return { result: "failed", reason: String(err?.message ?? "error") };
  }
}
