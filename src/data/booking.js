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

// ---- Install day and window (shared by /schedule, /track and the API) ------------
//
// The shop's hours (BUSINESS.hours): Mon – Fri 8:00 AM – 6:30 PM, Saturday
// 8:00 AM – 4:00 PM, closed Sunday. So the 4 – 6 PM window is weekdays only,
// and no day is a Sunday. A booked day and window are what the customer
// REQUESTED; the shop confirms the time with them.

/** The arrival windows /schedule offers, in order. */
export const INSTALL_WINDOWS = Object.freeze([
  Object.freeze({ value: "8-10am", label: "8:00 – 10:00 AM" }),
  Object.freeze({ value: "10-12pm", label: "10:00 AM – 12:00 PM" }),
  Object.freeze({ value: "12-2pm", label: "12:00 – 2:00 PM" }),
  Object.freeze({ value: "2-4pm", label: "2:00 – 4:00 PM" }),
  Object.freeze({ value: "4-6pm", label: "4:00 – 6:00 PM", weekdayOnly: true }),
]);

/** A booking for a paid order: tomorrow at the earliest, 60 days out at the latest (shop time). */
export const PAID_BOOKING_MIN_DAYS = 1;
export const PAID_BOOKING_MAX_DAYS = 60;

/** The shop's time zone: "today" is Florida's today, whatever the device says. */
export const SHOP_TIME_ZONE = "America/New_York";

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/** "2026-10-01" as a UTC Date, or null when it is not a real calendar day. */
function isoToUtc(iso) {
  const m = ISO_DAY.exec(String(iso ?? ""));
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d
    ? date
    : null;
}

/** Today in Florida as "YYYY-MM-DD". */
export function shopToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** `iso` plus `days` calendar days, "YYYY-MM-DD". */
export function addDays(iso, days) {
  const d = isoToUtc(iso);
  return d ? new Date(d.getTime() + days * DAY_MS).toISOString().slice(0, 10) : null;
}

/** 0 (Sunday) to 6 (Saturday) for "YYYY-MM-DD", or null. */
export function weekdayOf(iso) {
  const d = isoToUtc(iso);
  return d ? d.getUTCDay() : null;
}

/** "Thursday, October 1, 2026" for "2026-10-01" ("" when not a day). */
export function formatInstallDay(iso) {
  const d = isoToUtc(iso);
  return d
    ? d.toLocaleDateString("en-US", {
        timeZone: "UTC",
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";
}

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

/** "Thursday, October 1, 2026" back to "2026-10-01", or null. */
export function parseInstallDay(label) {
  const m = /^\s*[A-Za-z]+,\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})\s*$/.exec(String(label ?? ""));
  if (!m) return null;
  const month = MONTHS.indexOf(m[1].toLowerCase());
  if (month < 0) return null;
  const iso = `${m[3]}-${String(month + 1).padStart(2, "0")}-${String(m[2]).padStart(2, "0")}`;
  return isoToUtc(iso) ? iso : null;
}

/** The window for a value ("8-10am") or a label ("8:00 – 10:00 AM"), or null. */
export function installWindow(valueOrLabel) {
  const key = String(valueOrLabel ?? "").trim();
  return INSTALL_WINDOWS.find((w) => w.value === key || w.label === key) ?? null;
}

/**
 * Checks a requested day and window against the shop's rules. `today` is
 * "YYYY-MM-DD" (shopToday() on the server; the visitor's date on /schedule),
 * `minDays` / `maxDays` how far out the day may be (maxDays null: no limit).
 * Returns `{ date?, window? }`, an error sentence per bad field; empty when
 * both are fine. The same rules and sentences on the page and the server.
 */
export function installSlotErrors({ date, window }, { today, minDays = 0, maxDays = null } = {}) {
  const errors = {};
  const day = String(date ?? "").trim();
  const weekday = weekdayOf(day);
  if (!day) {
    errors.date = "Pick the day you want us.";
  } else if (weekday === null) {
    errors.date = "Enter a valid date.";
  } else {
    const earliest = addDays(today, minDays);
    const latest = maxDays == null ? null : addDays(today, maxDays);
    if (earliest && day < earliest) {
      errors.date =
        minDays > 0
          ? `Pick ${formatInstallDay(earliest)} or later.`
          : "That date has already passed. Pick today or later.";
    } else if (latest && day > latest) {
      errors.date = `Pick a day up to ${formatInstallDay(latest)}. Further out? Call the shop.`;
    } else if (weekday === 0) {
      errors.date = "We are closed Sunday. Pick Monday through Saturday.";
    }
  }
  const chosen = installWindow(window);
  if (!String(window ?? "").trim()) {
    errors.window = "Choose an arrival window.";
  } else if (!chosen || chosen.value !== String(window).trim()) {
    errors.window = "Choose one of the arrival windows.";
  } else if (chosen.weekdayOnly && weekday === 6) {
    errors.window = "Saturday closes at 4:00 PM. Choose an earlier window.";
  }
  return errors;
}
