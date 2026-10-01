// Input validation for the public endpoints. Every function returns
// { ok: true, value } or { ok: false, error }, where `error` is a sentence a
// shopper can read, because the frontend shows it as-is.

import { parseSize } from "../../src/data/tireMath.js";
import { readFitment } from "./fitmentAttrs.js";
import { BUSINESS } from "../../src/data/business.js";
import { MOBILE_AREA_ERROR, isInServiceArea } from "../../src/data/serviceArea.js";
import {
  INSTALL_BOOKING_TAG,
  bookingRefTag,
  parseBookingRef,
} from "../../src/data/booking.js";

// ---- Tire sizes ------------------------------------------------------------

/**
 * Accepts the loose ways people type a size ("225/45/17", "225 45 17",
 * "225-45-17", "2254517") on top of everything `parseSize` reads, and returns
 * a string `parseSize` understands. Anything else passes through untouched so
 * `parseSize` can reject it.
 */
export function normalizeSizeInput(raw) {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (parseSize(s)) return s;
  const loose = s.match(/^(P|LT)?\s*(\d{3})[\s/-]*(\d{2})[\s/-]*R?[\s-]*(\d{2})$/);
  if (loose) {
    const [, service = "", width, aspect, rim] = loose;
    return `${service}${width}/${aspect}R${rim}`;
  }
  return s;
}

/** A size query, parsed and range-checked. */
export function parseSizeQuery(raw) {
  const input = String(raw ?? "").trim();
  if (!input) return { ok: false, error: "Enter a tire size, like 225/45R17." };
  if (input.length > 32) {
    return { ok: false, error: "That tire size is too long to be real." };
  }
  const size = parseSize(normalizeSizeInput(input));
  if (!size) {
    return {
      ok: false,
      error: `"${input}" isn't a tire size we can read. Try the format 225/45R17.`,
    };
  }
  // Catch markings that parse but describe no tire anyone makes.
  const plausible =
    size.format === "flotation"
      ? size.flotationDiameter >= 23 &&
        size.flotationDiameter <= 44 &&
        size.rimDiameter >= 14 &&
        size.rimDiameter <= 26
      : size.width >= 125 &&
        size.width <= 455 &&
        size.aspect >= 25 &&
        size.aspect <= 95 &&
        size.rimDiameter >= 12 &&
        size.rimDiameter <= 30;
  if (!plausible) {
    return {
      ok: false,
      error: `"${input}" is outside the range of passenger and light-truck tire sizes.`,
    };
  }
  return { ok: true, value: size };
}

// ---- Shipping area ---------------------------------------------------------

/** The 48 contiguous states plus DC: where shipping is free. */
export const FREE_SHIPPING_STATES = new Set([
  "AL", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "ID", "IL",
  "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO",
  "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR",
  "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI",
  "WY",
]);

/** US addresses the site does not ship to, named so the error can say which. */
const OUTSIDE_AREA = {
  AK: "Alaska",
  HI: "Hawaii",
  PR: "Puerto Rico",
  GU: "Guam",
  VI: "the U.S. Virgin Islands",
  AS: "American Samoa",
  MP: "the Northern Mariana Islands",
  AA: "APO/FPO (Americas) addresses",
  AE: "APO/FPO (Europe) addresses",
  AP: "APO/FPO (Pacific) addresses",
};

export function checkShipState(raw) {
  const state = String(raw ?? "").trim().toUpperCase();
  if (FREE_SHIPPING_STATES.has(state)) return { ok: true, value: state };
  if (OUTSIDE_AREA[state]) {
    return {
      ok: false,
      error: `We ship free to the 48 contiguous states and DC only, so we can't ship to ${OUTSIDE_AREA[state]}. Call ${BUSINESS.phone} and we'll see what we can do.`,
    };
  }
  return {
    ok: false,
    error: "Enter the two-letter state code for the shipping address, like FL.",
  };
}

/** Mobile install is South Florida only, so the one state it accepts is FL. */
export function checkMobileState(raw) {
  const state = String(raw ?? "").trim().toUpperCase();
  if (state === "FL") return { ok: true, value: state };
  return {
    ok: false,
    error: `Mobile install is South Florida only, so the state must be FL. Choose shipping instead, or call ${BUSINESS.phone}.`,
  };
}

// ---- GET /api/tires --------------------------------------------------------

const text = (v) => (typeof v === "string" ? v.trim() : "");
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 100;

/** Same character set checkout accepts for a sku. */
const SKU = /^[\w.\-/]+$/;

export function validateTiresQuery(query = {}) {
  const sku = text(query.sku);
  const size = text(query.size);
  const year = text(query.year);
  const make = text(query.make);
  const model = text(query.model);
  const brand = text(query.brand);
  const rawLimit = text(query.limit);
  const hasVehicle = Boolean(year || make || model);

  let limit = DEFAULT_LIMIT;
  if (rawLimit) {
    if (!/^\d{1,3}$/.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > MAX_LIMIT) {
      return { ok: false, error: `limit must be a whole number from 1 to ${MAX_LIMIT}.` };
    }
    limit = Number(rawLimit);
  }
  if (brand.length > 40) return { ok: false, error: "brand is too long." };

  // A single tire by sku, for its product page. It stands alone: mixing it
  // with a search would leave two answers to one question.
  if (sku) {
    if (size || hasVehicle || brand) {
      return {
        ok: false,
        error: "Look a tire up by sku on its own, without a size, vehicle or brand.",
      };
    }
    if (sku.length > 64 || !SKU.test(sku)) {
      return { ok: false, error: "That isn't a valid sku." };
    }
    return { ok: true, value: { type: "sku", sku } };
  }

  if (size && hasVehicle) {
    return {
      ok: false,
      error: "Search by size or by vehicle (year, make and model), not both.",
    };
  }

  if (size) {
    const parsed = parseSizeQuery(size);
    if (!parsed.ok) return parsed;
    return {
      ok: true,
      value: { type: "size", size: parsed.value, brand: brand || null, limit },
    };
  }

  if (hasVehicle) {
    const missing = [
      !year && "year",
      !make && "make",
      !model && "model",
    ].filter(Boolean);
    if (missing.length) {
      return {
        ok: false,
        error: `A vehicle search needs year, make and model. Missing: ${missing.join(", ")}.`,
      };
    }
    const maxYear = new Date().getFullYear() + 2;
    if (!/^\d{4}$/.test(year) || Number(year) < 1950 || Number(year) > maxYear) {
      return { ok: false, error: `year must be a four-digit year from 1950 to ${maxYear}.` };
    }
    if (make.length > 40 || model.length > 60) {
      return { ok: false, error: "make or model is too long." };
    }
    return {
      ok: true,
      value: {
        type: "vehicle",
        year: Number(year),
        make,
        model,
        brand: brand || null,
        limit,
      },
    };
  }

  return {
    ok: false,
    error: "Search needs a tire size (size=225/45R17) or a vehicle (year, make and model).",
  };
}

// ---- POST /api/checkout ----------------------------------------------------

export const DELIVERY_MODES = ["ship", "pickup", "mobile"];
export const MAX_LINES = 10;
export const MAX_QTY_PER_LINE = 12;
export const MAX_TIRES_PER_ORDER = 24;

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;
const ZIP = /^\d{5}(-\d{4})?$/;

function field(obj, key, { required = true, max = 120, label = key } = {}) {
  const value = text(obj?.[key]);
  if (!value) {
    return required ? { error: `${label} is required.` } : { value: "" };
  }
  if (value.length > max) return { error: `${label} is too long.` };
  return { value };
}

/**
 * Validates a checkout body. Prices are deliberately not read: anything the
 * client sends besides sku and qty is ignored, and the server prices every
 * line itself.
 */
export function validateCheckout(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Send the order as a JSON object." };
  }

  // Items: merge repeats of the same sku, cap quantities.
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { ok: false, error: "The cart is empty." };
  }
  if (body.items.length > MAX_LINES) {
    return { ok: false, error: `An order can hold at most ${MAX_LINES} different tires.` };
  }
  const merged = new Map();
  for (const item of body.items) {
    const sku = text(item?.sku);
    if (!sku || sku.length > 64 || !SKU.test(sku)) {
      return { ok: false, error: "Every item needs a valid sku." };
    }
    const qty = item?.qty;
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      return {
        ok: false,
        error: `Quantity for ${sku} must be a whole number from 1 to ${MAX_QTY_PER_LINE}.`,
      };
    }
    merged.set(sku, (merged.get(sku) ?? 0) + qty);
  }
  const items = [...merged].map(([sku, qty]) => ({ sku, qty }));
  if (items.some((i) => i.qty > MAX_QTY_PER_LINE)) {
    return { ok: false, error: `At most ${MAX_QTY_PER_LINE} of any one tire per order.` };
  }
  const totalQty = items.reduce((n, i) => n + i.qty, 0);
  if (totalQty > MAX_TIRES_PER_ORDER) {
    return {
      ok: false,
      error: `Online orders are limited to ${MAX_TIRES_PER_ORDER} tires. Call ${BUSINESS.phone} for fleet orders.`,
    };
  }

  // Delivery. "mobile" is van installation at the customer's address, inside
  // Miami-Dade, Broward or Palm Beach only (by ZIP: src/data/serviceArea.js).
  const delivery = body.delivery;
  if (!DELIVERY_MODES.includes(delivery)) {
    return { ok: false, error: 'delivery must be "ship", "pickup" or "mobile".' };
  }

  // Customer.
  const c = body.customer;
  if (!c || typeof c !== "object") {
    return { ok: false, error: "Your name, email and phone are required." };
  }
  const name = field(c, "name", { max: 100, label: "Name" });
  if (name.error) return { ok: false, error: name.error };
  const email = field(c, "email", { max: 254, label: "Email" });
  if (email.error) return { ok: false, error: email.error };
  if (!EMAIL.test(email.value)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const phone = field(c, "phone", { max: 30, label: "Phone" });
  if (phone.error) return { ok: false, error: phone.error };
  const digits = phone.value.replace(/\D/g, "");
  const phoneDigits = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (phoneDigits.length !== 10) {
    return { ok: false, error: "Enter a 10-digit US phone number." };
  }

  // Address: required to ship and for mobile install, ignored for pickup.
  let address = null;
  if (delivery === "ship" || delivery === "mobile") {
    const mobile = delivery === "mobile";
    const a = body.address;
    if (!a || typeof a !== "object") {
      return {
        ok: false,
        error: mobile
          ? "Mobile install needs the address where the van should meet you."
          : "A shipping address is required.",
      };
    }
    const line1 = field(a, "line1", { label: "Street address" });
    if (line1.error) return { ok: false, error: line1.error };
    const line2 = field(a, "line2", { required: false, label: "Address line 2" });
    if (line2.error) return { ok: false, error: line2.error };
    const city = field(a, "city", { max: 60, label: "City" });
    if (city.error) return { ok: false, error: city.error };
    const state = mobile ? checkMobileState(a.state) : checkShipState(a.state);
    if (!state.ok) return state;
    const zip = field(a, "zip", { max: 10, label: "ZIP code" });
    if (zip.error) return { ok: false, error: zip.error };
    if (!ZIP.test(zip.value)) {
      return { ok: false, error: "Enter a 5-digit ZIP code." };
    }
    // The van only runs inside Miami-Dade, Broward and Palm Beach, decided by
    // ZIP with the same rule as the checkout page and Shopify Flow.
    if (mobile && !isInServiceArea(zip.value)) {
      return { ok: false, error: MOBILE_AREA_ERROR };
    }
    address = {
      line1: line1.value,
      line2: line2.value || null,
      city: city.value,
      state: state.value,
      zip: zip.value,
    };
  }

  const notes = text(body.notes);
  if (notes.length > 1000) {
    return { ok: false, error: "Notes are limited to 1,000 characters." };
  }

  return {
    ok: true,
    value: {
      items,
      delivery,
      customer: {
        name: name.value,
        email: email.value,
        phone: `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`,
      },
      address,
      notes: notes || null,
      // Optional and never an error: what does not check out is dropped
      // (api/_lib/fitmentAttrs.js).
      fitment: readFitment(body.fitment),
    },
  };
}

// ---- POST /api/newsletter --------------------------------------------------

/** Where a sign-up may come from; each becomes a customer tag in Shopify. */
export const NEWSLETTER_SOURCES = ["popup", "footer"];

/**
 * Validates a newsletter sign-up: `{ email, source?, website? }`.
 *
 * `website` is the honeypot: a field people never see, so anything in it
 * means a bot filled the form. That is reported as `{ ok: true, bot: true }`
 * rather than an error, so the bot gets no signal to try again differently;
 * the handler answers it like a success and sends nothing to Shopify.
 */
export function validateNewsletter(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Send the sign-up as a JSON object." };
  }
  if (text(body.website)) return { ok: true, bot: true };

  const email = text(body.email).toLowerCase();
  if (!email) return { ok: false, error: "Enter your email address." };
  if (email.length > 254 || !EMAIL.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const source = text(body.source) || "popup";
  if (!NEWSLETTER_SOURCES.includes(source)) {
    return { ok: false, error: "Unknown sign-up source." };
  }
  return { ok: true, bot: false, value: { email, source } };
}

// ---- POST /api/forms -------------------------------------------------------

/**
 * The website forms `/api/forms` accepts, and each one's own fields as
 * [key, label, max length, multi-line?], in the order the lead lists them.
 * The free-text message is always last. Anything not listed is dropped.
 * Name, email and phone are common to every form (see validateLead).
 */
export const LEAD_FORM_FIELDS = Object.freeze({
  contact: [
    ["subject", "About", 80, false],
    ["message", "Message", 2000, true],
  ],
  financing: [["amount", "Amount to finance", 40, false]],
  "fleet-quote": [
    ["company", "Company", 120, false],
    ["fleetSize", "Fleet size", 40, false],
    ["sizes", "Tire sizes", 500, true],
    ["message", "Notes", 2000, true],
  ],
  booking: [
    ["reference", "Reference", 40, false],
    ["service", "Service", 80, false],
    ["year", "Year", 10, false],
    ["make", "Make", 40, false],
    ["model", "Model", 60, false],
    ["tireSize", "Tire size", 40, false],
    ["locationType", "Where", 20, false],
    ["address", "Street address", 120, false],
    ["city", "City", 60, false],
    ["zip", "ZIP code", 10, false],
    ["parkingNotes", "Parking", 300, true],
    ["date", "Preferred date", 20, false],
    ["window", "Time window", 20, false],
    ["notes", "Notes", 2000, true],
  ],
});

export const LEAD_FORMS = Object.keys(LEAD_FORM_FIELDS);

/**
 * A form value as clean text: control characters removed (a multi-line field
 * keeps its line breaks, a single-line field collapses them to spaces) and
 * surrounding whitespace trimmed. Non-strings other than numbers read as "".
 */
/** C0/C1 control characters and the bidi override/isolate marks. */
function isControl(code) {
  return (
    code <= 0x1f ||
    (code >= 0x7f && code <= 0x9f) ||
    (code >= 0x202a && code <= 0x202e) ||
    (code >= 0x2066 && code <= 0x2069)
  );
}

export function cleanText(raw, { multiline = false } = {}) {
  if (typeof raw !== "string" && typeof raw !== "number") return "";
  const input = String(raw).normalize("NFC").replace(/\r\n?/g, "\n");
  let out = "";
  for (const ch of input) {
    const code = ch.codePointAt(0);
    if (ch === "\n") out += multiline ? "\n" : " ";
    else if (ch === "\t") out += " ";
    else if (!isControl(code)) out += ch;
  }
  if (multiline) {
    return out
      .split("\n")
      .map((line) => line.replace(/\s+$/, ""))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Ten NANP digits from a typed phone, or null. */
function usPhoneDigits(raw) {
  let digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(digits) ? digits : null;
}

/**
 * Validates a website form: `{ form, name, email, phone, ...form fields,
 * website? }`.
 *
 * Returns `{ ok: true, bot: true }` when the `website` honeypot is filled
 * (answered like a success, nothing stored), `{ ok: false, error }`, or
 * `{ ok: true, bot: false, value: { form, name, email, phone, phoneE164,
 * fields, tags } }`, where `fields` is the form's own [label, value] pairs in
 * order, empty ones left out, and `tags` the extra customer tags (a booking
 * with `order`: "install-booking" and "order-<ref>"; otherwise none). A
 * booking with `order` also carries `order`, the parsed reference, which
 * /api/forms tries to book on the paid order (api/_lib/installBooking.js).
 *
 * A lead needs a way to reply: a valid email or a valid 10-digit US phone.
 * A phone that is not a US number is kept as text on the lead but not used
 * to find or create the customer.
 */
export function validateLead(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Send the form as a JSON object." };
  }
  if (cleanText(body.website)) return { ok: true, bot: true };

  const form = cleanText(body.form);
  const spec = LEAD_FORM_FIELDS[form];
  if (!spec) return { ok: false, error: "Unknown form." };

  // The fleet form calls its person field "contact".
  const name = cleanText(body.name) || (form === "fleet-quote" ? cleanText(body.contact) : "");
  if (name.length > 100) return { ok: false, error: "Name is too long." };

  const email = cleanText(body.email).toLowerCase();
  if (email && (email.length > 254 || !EMAIL.test(email))) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const phone = cleanText(body.phone);
  if (phone.length > 30) return { ok: false, error: "Phone is too long." };
  const digits = usPhoneDigits(phone);
  if (!email && !digits) {
    return {
      ok: false,
      error: "Enter an email address or a 10-digit US phone number so we can reply.",
    };
  }

  // A booking made from a paid order (the /track "Schedule your install"
  // button opens /schedule?order=<ref>) names that order: first in the lead,
  // so Flow's email to info@ shows it at the top, and as two extra customer
  // tags. Only a well-formed reference is accepted; it is an identifier,
  // nothing is looked up or trusted from it.
  const fields = [];
  const tags = [];
  let order = null;
  if (form === "booking" && cleanText(body.order)) {
    const ref = parseBookingRef(cleanText(body.order));
    if (!ref) {
      return { ok: false, error: "That order number does not look right. Open the booking again from Track My Order, or call the shop." };
    }
    fields.push(["Paid order", `${ref} (install booking for a paid order: schedule it in Tire Guru)`]);
    tags.push(INSTALL_BOOKING_TAG, bookingRefTag(ref));
    order = ref;
  }
  for (const [key, label, max, multiline] of spec) {
    const value = cleanText(body[key], { multiline });
    if (!value) continue;
    if (value.length > max) {
      return {
        ok: false,
        error: `${label} is too long (${max.toLocaleString("en-US")} characters at most).`,
      };
    }
    fields.push([label, value]);
  }

  // A mobile booking sends the van to the address typed, so its ZIP must be
  // in the service area, the same rule and sentence as /schedule and
  // checkout. An in-shop booking ("shop") needs no ZIP at all.
  if (form === "booking" && cleanText(body.locationType) === "mobile") {
    const zip = cleanText(body.zip);
    if (!ZIP.test(zip)) return { ok: false, error: "Enter a five-digit ZIP code." };
    if (!isInServiceArea(zip)) return { ok: false, error: MOBILE_AREA_ERROR };
  }

  return {
    ok: true,
    bot: false,
    value: {
      form,
      name,
      email: email || null,
      phone: phone || null,
      phoneE164: digits ? `+1${digits}` : null,
      fields,
      tags,
      ...(order ? { order } : {}),
    },
  };
}
