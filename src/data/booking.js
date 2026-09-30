/**
 * The order reference an install booking is linked to, shared by the API
 * (api/_lib/booking.js, api/_lib/validate.js) and the /track and /schedule
 * pages. Pure: no React, no browser, no network.
 *
 * A reference is either the site's own order ref, "TD-<yymmdd>-<6 chars>"
 * (api/_lib/orders.js makeOrderRef; paid orders placed through the site
 * carry it as the "Order ref" attribute), or a Shopify order number, "#1001"
 * (orders paid through the Shopify storefront have no TD- ref).
 *
 * It is an identifier only. /schedule shows it read-only and sends it with
 * the booking; nobody's name, email, phone or vehicle is ever read from a
 * query string (see docs/integrations/install-scheduling.md).
 */

// Same alphabet as makeOrderRef: no 0/O/1/I.
const TD_REF = /^TD-(\d{2})(\d{2})(\d{2})-([A-HJ-NP-Z2-9]{6})$/;
const ORDER_NUMBER = /^#?(\d{1,10})$/;

/** "TD-260929-ABC234", "#1001", or null for anything else. */
export function parseBookingRef(raw) {
  if (typeof raw !== "string") return null;
  const text = raw.trim().toUpperCase();
  if (!text || text.length > 20) return null;
  const td = TD_REF.exec(text);
  if (td) {
    const [, yy, mm, dd] = td;
    const date = new Date(Date.UTC(2000 + Number(yy), Number(mm) - 1, Number(dd)));
    if (date.getUTCMonth() !== Number(mm) - 1 || date.getUTCDate() !== Number(dd)) return null;
    return text;
  }
  const num = ORDER_NUMBER.exec(text);
  return num ? `#${num[1]}` : null;
}

/** The value for ?order=: the TD- ref as is, an order number without "#". */
export const bookingRefParam = (ref) => String(ref).replace(/^#/, "");

/** "/schedule?order=TD-260929-ABC234" or "/schedule?order=1001". */
export const schedulePath = (ref) =>
  `/schedule?order=${encodeURIComponent(bookingRefParam(ref))}`;

/** The Shopify tag put on the booking lead: "order-TD-260929-ABC234", "order-1001". */
export const bookingRefTag = (ref) => `order-${bookingRefParam(ref)}`;

/** The tag every booking linked to a paid order carries. */
export const INSTALL_BOOKING_TAG = "install-booking";
