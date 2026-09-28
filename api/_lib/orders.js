// Order assembly and "request mode" delivery.
//
// Request mode is what checkout does when payment is not live: the order is
// sent to the shop as a request (by POSTing JSON to ORDER_WEBHOOK_URL, e.g. a
// Formspree form) and the shop follows up by phone or email to take payment.
// Nothing here charges a card or claims one was charged.

import { randomBytes } from "node:crypto";
import { BUSINESS } from "../../src/data/business.js";

export const WEBHOOK_TIMEOUT_MS = 6000;

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

function summary(order) {
  const f = order.fulfillment;
  const where =
    f.type === "pickup"
      ? `Ship-to-store pickup at ${f.location.name}, ${f.location.address}`
      : f.type === "mobile"
        ? `MOBILE INSTALL at ${oneLine(f.address)}. ${MOBILE_INSTALL_NOTE}: confirm fitment, schedule the van and quote the install on the call.`
        : `Ship to ${oneLine(f.address)}`;
  const heading =
    f.type === "mobile"
      ? `MOBILE INSTALL BOOKING REQUEST ${order.orderRef} — NOT PAID. No card has been charged; call the customer to confirm fitment, schedule the van and take payment.`
      : `ORDER REQUEST ${order.orderRef} — NOT PAID. No card has been charged; contact the customer to confirm stock and take payment.`;
  return [
    heading,
    "",
    ...order.lines.map(
      (l) => `${l.qty} x ${l.title} (${l.sku}) @ $${l.price.toFixed(2)} = $${l.lineTotal.toFixed(2)}`,
    ),
    f.type === "mobile"
      ? `Tires total before tax and fees: $${order.total.toFixed(2)} (install not included — ${MOBILE_INSTALL_NOTE.toLowerCase()})`
      : `Total before tax and fees: $${order.total.toFixed(2)} (shipping free)`,
    "",
    where,
    `Customer: ${order.customer.name}, ${order.customer.email}, ${order.customer.phone}`,
    order.notes ? `Notes: ${order.notes}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/**
 * Sends the order request to ORDER_WEBHOOK_URL. Returns
 * { delivered: true } or { delivered: false, reason }.
 * With no webhook configured it logs the order and reports delivered: false,
 * so the UI can say plainly that nothing reached the shop.
 */
export async function deliverOrderRequest(order, webhookUrl, deps = {}) {
  const {
    fetchImpl = globalThis.fetch,
    log = console,
    timeoutMs = WEBHOOK_TIMEOUT_MS,
  } = deps;

  if (!webhookUrl) {
    log.warn(
      `[checkout] ORDER_WEBHOOK_URL is not set; order request ${order.orderRef} was NOT sent anywhere. Logged here only:`,
      JSON.stringify(order),
    );
    return { delivered: false, reason: "not-configured" };
  }

  const payload = {
    // Formspree conventions: `_subject` sets the email subject, `email` the
    // reply-to. Other receivers can ignore them.
    _subject: `TireDrop ${order.fulfillment.type === "mobile" ? "mobile install booking request" : "order request"} ${order.orderRef} (NOT PAID)`,
    email: order.customer.email,
    orderRef: order.orderRef,
    paymentStatus: "NOT PAID - order request only",
    message: summary(order),
    order,
  };

  try {
    const res = await fetchImpl(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      log.error(
        `[checkout] Order webhook rejected ${order.orderRef} with HTTP ${res.status}. Order:`,
        JSON.stringify(order),
      );
      return { delivered: false, reason: "webhook-error" };
    }
    return { delivered: true };
  } catch (err) {
    log.error(
      `[checkout] Order webhook failed for ${order.orderRef} (${err?.name === "TimeoutError" ? "timed out" : err?.message}). Order:`,
      JSON.stringify(order),
    );
    return { delivered: false, reason: "webhook-error" };
  }
}
