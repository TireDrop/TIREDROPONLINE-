// Pricing and delivery helpers shared by the cards, the product page, the
// compare table and the cart.
//
// Tires are bought in fours. Every serious competitor prices them that way —
// a per-tire figure next to a set-of-four total — because a shopper comparing
// two sites is comparing what four tires actually cost, installed. Keeping
// that arithmetic in one place is what stops the card and the product page
// from disagreeing.

import { BUSINESS } from "./business.js";

export const SET_SIZE = 4;

/** What a set of four costs, before install. Shipping is free. */
export const setPrice = (product, qty = SET_SIZE) => product.price * qty;

/** What the same set lists at, so the saving can be shown honestly. */
export const setMsrp = (product, qty = SET_SIZE) => product.msrp * qty;

/** The full picture for a quantity: list, price, instant saving and install. */
export function priceBreakdown(product, qty = SET_SIZE) {
  const list = setMsrp(product, qty);
  const price = setPrice(product, qty);
  return {
    qty,
    list,
    price,
    instantSaving: Math.max(0, list - price),
    install: (product.installPrice ?? 0) * qty,
  };
}

/**
 * Delivery estimate. Distributors cut off same-day shipping in the early
 * afternoon and do not ship on weekends, so a Friday-evening order lands the
 * following week — which is exactly what a shopper needs told up front.
 *
 * This is a display estimate, not a carrier quote. Once the distributor APIs
 * are wired, replace it with their committed date.
 */
export function deliveryEstimate(now = new Date()) {
  const CUTOFF_HOUR = 14; // 2pm local, the usual distributor cutoff
  const d = new Date(now);

  // Orders after cutoff ship the next day.
  if (d.getHours() >= CUTOFF_HOUR) d.setDate(d.getDate() + 1);
  // Nothing leaves the warehouse at the weekend.
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);

  const addBusinessDays = (from, days) => {
    const out = new Date(from);
    let left = days;
    while (left > 0) {
      out.setDate(out.getDate() + 1);
      if (out.getDay() !== 0 && out.getDay() !== 6) left -= 1;
    }
    return out;
  };

  const fmt = (date) =>
    date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  return {
    shipsOn: fmt(d),
    // 2–4 business days in transit for the continental US.
    earliest: fmt(addBusinessDays(d, 2)),
    latest: fmt(addBusinessDays(d, 4)),
    // Ship-to-store is a local distributor drop, so it beats the carrier.
    toStore: fmt(addBusinessDays(d, 1)),
    storeName: BUSINESS.shop.name,
  };
}
