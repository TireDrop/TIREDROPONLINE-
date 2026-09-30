// Track My Order (POST /api/track, the /track page).
//
// A shopper gives an order number ("#1001" or "1001") or a TireDrop request
// reference ("TD-260929-ABC234") plus the email they used. The order is read
// from the Shopify Admin API and returned ONLY when its email matches,
// exactly and case-insensitively. Anything else (no such order, another
// email, a malformed number) gets the same "not found", so the endpoint
// cannot be used to learn which order numbers or emails exist.
//
// What goes back is deliberately small: order name, date, payment and
// fulfilment status, how it is delivered, line titles and quantities,
// tracking numbers with a carrier link, and where the tires are with our
// supplier (from the forwarder's atd-* tags). No prices, no address, no
// phone, no delivery dates. The one exception: a PAID order that involves
// installation also carries `booking`, the "Schedule your install" call to
// action (api/_lib/booking.js), which hands the customer's own name, phone
// and vehicle back to them for the booking form, or a booking link already
// filled with them.
//
// Queries validated against the Admin GraphQL schema (2026-07). Scopes:
// read_orders (+ read_merchant_managed_fulfillment_orders, which the
// forwarder already has, for fulfilment tracking) and read_draft_orders.
// Orders older than 60 days need read_all_orders; without it they read as
// not found. Nothing here has been run against the real store.

import { DELIVERY_ATTRIBUTE, MOBILE_DELIVERY_ATTRIBUTE, REQUEST_TAG, shopifyGraphQL } from "./shopify.js";
import { createRateLimiter } from "./ratelimit.js";

/**
 * One limiter for every endpoint that checks an order number against an
 * email: /api/track and /api/book-install count against the same budget
 * (per warm instance, per client IP), so the booking endpoint is not a
 * second way to guess.
 */
export const TRACK_RATE_LIMIT = 10;
export const TRACK_RATE_WINDOW_MS = 10 * 60 * 1000;
export const orderLookupLimiter = createRateLimiter({
  limit: TRACK_RATE_LIMIT,
  windowMs: TRACK_RATE_WINDOW_MS,
});

/**
 * What /track and the install booking read of an order. `installBooking` is
 * the order metafield tiredrop.install_booking (api/_lib/installBooking.js),
 * set once the customer books the install.
 */
export const ORDER_FIELDS = `id
      name
      createdAt
      email
      note
      cancelledAt
      displayFinancialStatus
      displayFulfillmentStatus
      tags
      customAttributes { key value }
      shippingLine { title }
      lineItems(first: 20) { nodes { title quantity currentQuantity } }
      fulfillments(first: 10) { trackingInfo(first: 10) { company number url } }
      installBooking: metafield(namespace: "tiredrop", key: "install_booking") { value }`;

export const TRACK_ORDER_QUERY = `query trackOrder($query: String!) {
  orders(first: 5, query: $query) {
    nodes {
      ${ORDER_FIELDS}
    }
  }
}`;

export const TRACK_REQUEST_QUERY = `query trackRequest($query: String!) {
  draftOrders(first: 25, query: $query) {
    nodes {
      createdAt
      status
      email
      tags
      note2
      customAttributes { key value }
      lineItems(first: 20) { nodes { title quantity } }
      order { name }
    }
  }
}`;

// ---- Input -----------------------------------------------------------------------

/** Request refs from api/_lib/orders.js makeOrderRef: TD-<yymmdd>-<6 chars>. */
const REF_RE = /^TD-(\d{2})(\d{2})(\d{2})-([A-HJ-NP-Z2-9]{6})$/;
// Deliberately narrower than RFC 5322: nothing that means something in
// Shopify's search syntax (spaces, quotes, colons, parentheses) gets through.
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

/**
 * `{ kind: "order", name: "#1001" }`, `{ kind: "request", ref, date }` or
 * null for anything else.
 */
export function parseLookup(raw) {
  const text = String(raw ?? "").trim().replace(/\s+/g, "").toUpperCase();
  const num = text.match(/^(?:#|NO\.?|ORDER#?)?(\d{1,10})$/);
  if (num) return { kind: "order", name: `#${num[1]}` };
  const ref = text.match(REF_RE);
  if (ref) {
    const [, yy, mm, dd] = ref;
    const date = new Date(Date.UTC(2000 + Number(yy), Number(mm) - 1, Number(dd)));
    if (date.getUTCMonth() !== Number(mm) - 1) return null;
    return { kind: "request", ref: text, date };
  }
  return null;
}

export function normalizeEmail(raw) {
  const email = String(raw ?? "").trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email) ? email : null;
}

/**
 * `{ ok: true, value: { lookup, email } }`, `{ ok: true, bot: true }` for a
 * filled honeypot, or `{ ok: false, error }` with a message safe to show.
 */
export function validateTrack(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Enter your order number and email." };
  }
  if (typeof body.website === "string" && body.website.trim() !== "") return { ok: true, bot: true };
  const lookup = parseLookup(body.order);
  if (!lookup) {
    return { ok: false, error: "Enter your order number (like #1001) or your request reference (TD-…)." };
  }
  const email = normalizeEmail(body.email);
  if (!email) return { ok: false, error: "Enter the email address you used at checkout." };
  return { ok: true, value: { lookup, email } };
}

// ---- Search strings -----------------------------------------------------------------

export function orderSearch(name, email) {
  return `name:${name} email:${email}`;
}

const ymd = (d) => d.toISOString().slice(0, 10);

/** Request drafts created around the ref's date (the ref is dated in UTC). */
export function requestSearch(date) {
  const DAY = 24 * 60 * 60 * 1000;
  const from = new Date(date.getTime() - DAY);
  const to = new Date(date.getTime() + 2 * DAY);
  return `tag:${REQUEST_TAG} created_at:>='${ymd(from)}' created_at:<'${ymd(to)}'`;
}

// ---- Mapping (pure, tested) --------------------------------------------------------------

const hasTag = (node, tag) => (node.tags ?? []).some((t) => String(t).toLowerCase() === tag);
const attribute = (node, key) => (node.customAttributes ?? []).find((a) => a?.key === key)?.value ?? null;
export const sameEmail = (a, b) => typeof a === "string" && a.trim().toLowerCase() === b;

/** "ship" | "ship-to-store" | "mobile" | "pickup" | null. */
export function deliveryType(node) {
  const attr = attribute(node, "Delivery");
  if (attr === DELIVERY_ATTRIBUTE.ship) return "ship";
  if (attr === DELIVERY_ATTRIBUTE.pickup) return "ship-to-store";
  if (attr === MOBILE_DELIVERY_ATTRIBUTE) return "mobile";
  if (hasTag(node, "ship-to-store")) return "ship-to-store";
  if (hasTag(node, "ship-to-home")) return "ship";
  if (hasTag(node, "mobile-install")) return "mobile";
  const line = String(node.shippingLine?.title ?? "");
  if (/pick\s?-?up/i.test(line)) return "pickup";
  return line ? "ship" : null;
}

/** Where the order is with our supplier, from the forwarder's tags. */
export function supplierState(node) {
  if (hasTag(node, "atd-inbound-to-store")) return "inbound-to-store";
  if (hasTag(node, "atd-submitted")) return "ordered";
  return null;
}

const CARRIER_URLS = [
  [/ups/i, (n) => `https://www.ups.com/track?tracknum=${n}`],
  [/fedex|federal express/i, (n) => `https://www.fedex.com/fedextrack/?trknbr=${n}`],
  [/usps|postal/i, (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`],
  [/dhl/i, (n) => `https://www.dhl.com/us-en/home/tracking/tracking-express.html?tracking-id=${n}`],
];

function httpsUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Shopify's tracking URL when it is https, else one built from the carrier. */
export function trackingUrl(company, number) {
  const n = encodeURIComponent(number);
  const hit = CARRIER_URLS.find(([re]) => re.test(String(company ?? "")));
  return hit ? hit[1](n) : null;
}

const lower = (v) => (typeof v === "string" && v ? v.toLowerCase() : null);

/** The public view of one order. Only these fields ever leave the server. */
export function publicOrder(node) {
  const nodes = node.lineItems?.nodes ?? [];
  // currentQuantity drops lines removed after checkout; a fully refunded or
  // cancelled order has none left, so it shows what was ordered instead.
  const current = nodes.some((l) => (l.currentQuantity ?? l.quantity ?? 0) > 0);
  const lines = nodes
    .map((l) => ({
      title: String(l.title ?? ""),
      quantity: current ? (l.currentQuantity ?? l.quantity ?? 0) : (l.quantity ?? 0),
    }))
    .filter((l) => l.title && l.quantity > 0);
  const seen = new Set();
  const tracking = [];
  for (const f of node.fulfillments ?? []) {
    for (const t of f?.trackingInfo ?? []) {
      const number = String(t?.number ?? "").trim();
      if (!number || seen.has(number)) continue;
      seen.add(number);
      tracking.push({
        number,
        company: t.company ? String(t.company) : null,
        url: httpsUrl(t.url) ?? trackingUrl(t.company, number),
      });
    }
  }
  return {
    name: node.name,
    createdAt: node.createdAt,
    cancelled: Boolean(node.cancelledAt),
    financialStatus: lower(node.displayFinancialStatus),
    fulfillmentStatus: lower(node.displayFulfillmentStatus),
    delivery: deliveryType(node),
    lines,
    tracking,
    supplier: supplierState(node),
  };
}

/** "open" | "invoice_sent" | "completed", plus the order name once paid. */
export function publicRequest(node, ref) {
  return {
    ref,
    createdAt: node.createdAt,
    status: lower(node.status),
    orderName: node.order?.name ?? null,
    delivery: deliveryType(node),
    lines: (node.lineItems?.nodes ?? [])
      .map((l) => ({ title: String(l.title ?? ""), quantity: l.quantity ?? 0 }))
      .filter((l) => l.title && l.quantity > 0),
  };
}

// ---- Lookup --------------------------------------------------------------------------

/**
 * `{ kind: "order", order }`, `{ kind: "request", request }` or null (not
 * found, including a wrong email). `cfg` is the Shopify config.
 *
 * `booking`, when given, is called with the matched order's raw node (only
 * after the name AND email matched) and may resolve a call to action to
 * book the install (api/_lib/booking.js bookingForOrder); it is added to the
 * public order as `booking` when not null. Order requests (unpaid) never
 * get one.
 */
export async function lookupOrder({ lookup, email }, cfg, deps = {}, { booking = null } = {}) {
  if (lookup.kind === "order") {
    const data = await shopifyGraphQL(cfg, TRACK_ORDER_QUERY, { query: orderSearch(lookup.name, email) }, deps);
    // The search narrows; this decides. Name AND email must both match.
    const node = (data?.orders?.nodes ?? []).find(
      (o) => String(o?.name ?? "").toUpperCase() === lookup.name && sameEmail(o.email, email),
    );
    if (!node) return null;
    const order = publicOrder(node);
    const cta = booking ? await booking(node) : null;
    if (cta) order.booking = cta;
    return { kind: "order", order };
  }
  const data = await shopifyGraphQL(cfg, TRACK_REQUEST_QUERY, { query: requestSearch(lookup.date) }, deps);
  const node = (data?.draftOrders?.nodes ?? []).find(
    (d) =>
      hasTag(d, REQUEST_TAG) &&
      sameEmail(d.email, email) &&
      (attribute(d, "Order ref") === lookup.ref || String(d.note2 ?? "").includes(lookup.ref)),
  );
  return node ? { kind: "request", request: publicRequest(node, lookup.ref) } : null;
}
