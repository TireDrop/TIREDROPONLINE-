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

export function buildOrder(input, lines, now = new Date()) {
  const subtotal = cents(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  const shipping = 0; // free: contiguous US + DC, or ship-to-store
  return {
    orderRef: makeOrderRef(now),
    createdAt: now.toISOString(),
    currency: "USD",
    customer: input.customer,
    fulfillment:
      input.delivery === "pickup"
        ? { type: "pickup", shipping, location: PICKUP_LOCATION }
        : { type: "ship", shipping, address: input.address },
    lines,
    subtotal,
    shipping,
    // Sales tax and Florida's per-tire fee are not computed here; the shop
    // (or Tire Guru, once live) adds them when taking payment.
    total: subtotal,
    notes: input.notes,
  };
}

function summary(order) {
  const f = order.fulfillment;
  const where =
    f.type === "pickup"
      ? `Ship-to-store pickup at ${f.location.name}, ${f.location.address}`
      : `Ship to ${[f.address.line1, f.address.line2, `${f.address.city}, ${f.address.state} ${f.address.zip}`].filter(Boolean).join(", ")}`;
  return [
    `ORDER REQUEST ${order.orderRef} — NOT PAID. No card has been charged; contact the customer to confirm stock and take payment.`,
    "",
    ...order.lines.map(
      (l) => `${l.qty} x ${l.title} (${l.sku}) @ $${l.price.toFixed(2)} = $${l.lineTotal.toFixed(2)}`,
    ),
    `Total before tax and fees: $${order.total.toFixed(2)} (shipping free)`,
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
    _subject: `TireDrop order request ${order.orderRef} (NOT PAID)`,
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
