// Order assembly and "request mode" delivery.
//
// Request mode is what checkout does when payment is not live (and for every
// mobile install): the order is recorded in Shopify as a lead on the customer
// (form "order-request", emailed to info@ by Shopify Flow, see
// api/_lib/leads.js) and as a DRAFT order with no invoice sent. The shop
// confirms price and availability, then clicks "Send invoice" in Shopify and
// the customer pays on Shopify's checkout. Nothing here charges a card or
// claims one was charged.
//
// The name, email, phone, address and notes are whatever the shopper typed;
// nobody verified the email. So an order request never changes an EXISTING
// customer's data: the lead does not touch their note (api/_lib/leads.js),
// the draft is linked to the customer only when this request created them,
// and the draft's note says the email is unverified. Everything typed lives
// on the draft and in the lead, nowhere else.

import { randomBytes } from "node:crypto";
import { BUSINESS } from "../../src/data/business.js";
import { findOrCreateLeadCustomer, formatLead, saveLead } from "./leads.js";
import { createRequestDraft, toE164 } from "./shopify.js";

const cents = (n) => Math.round(n * 100) / 100;

/** Short, unguessable, readable over the phone: TD-<date>-<6 chars>. */
export function makeOrderRef(now = new Date()) {
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  const bytes = randomBytes(6);
  const tail = [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
  return `TD-${date}-${tail}`;
}

/** The pickup location, from the single source of business facts. */
export const PICKUP_LOCATION = {
  name: BUSINESS.shop.name,
  address: BUSINESS.shop.full,
  phone: BUSINESS.phone,
};

/**
 * Mobile install labour is never priced online: the shop quotes it on the
 * call, once it knows the vehicle and the address. This is the wording every
 * mobile response and order request carries in place of a figure.
 */
export const MOBILE_INSTALL_NOTE = "Install quoted on the call";

function fulfillmentFor(input, shipping) {
  if (input.delivery === "pickup") {
    return { type: "pickup", shipping, location: PICKUP_LOCATION };
  }
  if (input.delivery === "mobile") {
    return {
      type: "mobile",
      shipping,
      address: input.address,
      install: MOBILE_INSTALL_NOTE,
    };
  }
  return { type: "ship", shipping, address: input.address };
}

export function buildOrder(input, lines, now = new Date()) {
  const subtotal = cents(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  const shipping = 0; // free: contiguous US + DC, ship-to-store, or to the van
  return {
    orderRef: makeOrderRef(now),
    createdAt: now.toISOString(),
    currency: "USD",
    customer: input.customer,
    fulfillment: fulfillmentFor(input, shipping),
    lines,
    subtotal,
    shipping,
    // Sales tax and Florida's per-tire fee are not computed here. Shopify's
    // checkout calculates sales tax on paid orders; on order requests the
    // shop adds tax and fees when it takes payment.
    total: subtotal,
    notes: input.notes,
  };
}

const oneLine = (a) =>
  [a.line1, a.line2, `${a.city}, ${a.state} ${a.zip}`].filter(Boolean).join(", ");

const usd = (n) => `$${n.toFixed(2)}`;

/**
 * The order request's own lead fields, as [label, value] pairs, customer
 * notes last. `draft` is the Shopify draft ({ name }) or null when it could
 * not be created.
 */
export function orderRequestFields(order, draft) {
  const f = order.fulfillment;
  const mobile = f.type === "mobile";
  return [
    ["Order ref", order.orderRef],
    [
      "Status",
      "NOT PAID. Request only: nothing was charged. Confirm price and availability with the customer.",
    ],
    [
      "Delivery",
      f.type === "pickup"
        ? `Ship-to-store pickup at ${f.location.name}, ${f.location.address}`
        : mobile
          ? `Mobile install at ${oneLine(f.address)}. ${MOBILE_INSTALL_NOTE}: confirm fitment, schedule the van and quote the install on the call.`
          : `Ship to ${oneLine(f.address)}`,
    ],
    [
      "Items",
      order.lines
        .map((l) => `${l.qty} x ${l.title} (${l.sku}) @ ${usd(l.price)} = ${usd(l.lineTotal)}`)
        .join("\n"),
    ],
    mobile
      ? ["Tires total", `${usd(order.total)} before tax and fees (install not included, ${MOBILE_INSTALL_NOTE.toLowerCase()})`]
      : ["Total", `${usd(order.total)} before tax and fees (shipping free)`],
    [
      "Shopify draft",
      draft
        ? `${draft.name ?? draft.id}: in Shopify, Orders → Drafts. Confirm the price${mobile ? ", add the install" : ""}, then Send invoice.`
        : "NOT created (see the Vercel function log). Enter the order by hand.",
    ],
    ["Customer notes", order.notes],
  ];
}

/**
 * Records an order request in Shopify: the customer and a draft order (no
 * invoice sent), then the lead that alerts info@. Resolves
 * `{ customerId, draft }`. A draft that fails is logged and named as missing
 * in the lead, because the alert still reaches the shop; a lead that fails
 * throws, because then nothing reached anyone.
 */
export async function recordOrderRequest(order, cfg, deps = {}) {
  const { log = console, now = () => new Date() } = deps;
  const c = order.customer;
  const customer = await findOrCreateLeadCustomer(
    { name: c.name, email: c.email, phoneE164: toE164(c.phone) },
    cfg,
    deps,
  );
  let draft = null;
  try {
    draft = await createRequestDraft(order, cfg, deps, {
      customerId: customer.created ? customer.id : null,
    });
  } catch (err) {
    log.error(
      `[checkout] Draft order for request ${order.orderRef} failed (${err?.message}). Order:`,
      JSON.stringify(order),
    );
  }
  const text = formatLead(
    {
      form: "order-request",
      name: c.name,
      email: c.email,
      phone: c.phone,
      existing: !customer.created,
      fields: orderRequestFields(order, draft),
    },
    now(),
  );
  await saveLead(customer, "order-request", text, cfg, deps);
  return { customerId: customer.id, draft };
}

/**
 * Delivers an order request to the shop through Shopify. Returns
 * `{ delivered: true, draft }` or `{ delivered: false, reason }`:
 *   "not-configured"  Shopify is off; the order is only logged, so the UI can
 *                     say plainly that nothing reached the shop.
 *   "shopify-error"   Shopify refused or did not answer; logged in full.
 */
export async function deliverOrderRequest(order, cfg, deps = {}) {
  const { log = console } = deps;
  if (!(cfg?.mode === "live" && cfg.ok)) {
    log.warn(
      `[checkout] Shopify is not configured; order request ${order.orderRef} was NOT sent anywhere. Logged here only:`,
      JSON.stringify(order),
    );
    return { delivered: false, reason: "not-configured" };
  }
  try {
    const { draft } = await recordOrderRequest(order, cfg, deps);
    return { delivered: true, draft };
  } catch (err) {
    log.error(
      `[checkout] Could not record order request ${order.orderRef} in Shopify (${err?.message}). Order:`,
      JSON.stringify(order),
    );
    return { delivered: false, reason: "shopify-error" };
  }
}
