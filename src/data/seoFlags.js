// Switches for structured data that must not go live yet. Plain constants in a
// plain module so the page code, the build checks and the unit tests all read
// the same values. Justin decides both of them; nothing else flips them.
//
// docs/integrations/product-structured-data.md says what each one emits and
// what to check before changing it.

/**
 * PRODUCT_SCHEMA_ENABLED: the one switch for Product / Offer / shipping /
 * return-policy JSON-LD on product pages (src/data/productSchema.js).
 *
 * FALSE ON PURPOSE. src/data/products.js is a SAMPLE catalog (representative
 * tires and wheels, shelf prices, no stock counts, no SKUs, no photos), not
 * live distributor inventory. An Offer is a machine-readable promise of this
 * price, buyable now. Publishing it for sample data would promise inventory
 * and prices nobody has confirmed, and feed Google's free product listings
 * with them. While this is false, the built HTML carries no Product or Offer
 * node at all (`npm run check:schema` fails the build check if one appears).
 *
 * Turn it on the day the real ATD (or U.S. AutoForce) catalog, with live
 * prices, is what the product pages show. Not before.
 */
export const PRODUCT_SCHEMA_ENABLED = false;

/**
 * RETURN_WINDOW_DAYS: the return window in days, as a whole number, or null.
 *
 * NULL = not decided. The terms (src/pages/support/LegalPage.jsx, section 9)
 * deliberately state no window yet: it is set by the distributor the item
 * ships from. While this is null, no hasMerchantReturnPolicy is emitted, so
 * Google is never told a number the site does not publish.
 *
 * Set it only when the same number is written in the terms, on checkout and
 * on the order confirmation; a returns policy in markup that disagrees with
 * the visible page is a structured-data policy breach. A unit test fails if
 * this is a number and the terms do not mention it.
 *
 * It is a window for ALL products and all U.S. buyers. If the distributors'
 * windows differ, leave it null rather than publish the shortest or longest.
 */
export const RETURN_WINDOW_DAYS = null;

/**
 * PRODUCT_AVAILABILITY_ENABLED: whether an Offer says InStock / OutOfStock /
 * LimitedAvailability.
 *
 * FALSE by default, because the product pages are prerendered static HTML:
 * the stock a build saw is frozen into the page until the next build, while
 * Google reads it as current. A stale "InStock" on a sold-out tire is a
 * mismatch Merchant Center suspends accounts for. Availability is a
 * recommended Offer property, not a required one. Turn it on only once the
 * stock in the HTML is refreshed often enough to be trusted (or the pages
 * render at request time). With this on, availability is still emitted only
 * when the product record itself carries stock (`qty` or `available`); the
 * sample catalog has neither, so nothing is ever invented.
 */
export const PRODUCT_AVAILABILITY_ENABLED = false;
