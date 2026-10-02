// Pricing helpers shared by the cards, the product page, the compare table and
// the cart.
//
// Tires are bought in fours. Every serious competitor prices them that way —
// a per-tire figure next to a set-of-four total — because a shopper comparing
// two sites is comparing what four tires actually cost, installed. Keeping
// that arithmetic in one place is what stops the card and the product page
// from disagreeing.

export const SET_SIZE = 4;

/** What a set of four costs, before install. Shipping is free. */
export const setPrice = (product, qty = SET_SIZE) => product.price * qty;

/** The full picture for a quantity: price and install. */
export function priceBreakdown(product, qty = SET_SIZE) {
  return {
    qty,
    price: setPrice(product, qty),
    install: (product.installPrice ?? 0) * qty,
  };
}

/**
 * Delivery wording. Transit depends on which distributor warehouse has the
 * size and the shopper's ZIP code, so the site names no date: checkout shows
 * the estimate once the address is known.
 */
export const DELIVERY_NOTE =
  "Free shipping to the 48 contiguous states and DC — the delivery estimate is shown at checkout.";

/** The same promise where a card has one short line to spare. */
export const DELIVERY_NOTE_SHORT = "Free shipping (48 states + DC) · estimate at checkout";
