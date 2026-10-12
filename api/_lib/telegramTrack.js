// Order tracking over Telegram: a customer messages the bot with an order
// number AND the email they used at checkout, and the bot answers with the
// same small public view /track gives (api/_lib/track.js). Same rule as
// /track: the order is returned ONLY when the email matches, and a miss
// (wrong number, wrong email, nothing at all) gets one identical answer.
//
// What goes back: order name, payment and fulfilment state, how it is
// delivered, items and quantities, tracking links, and where the tires are
// with our supplier. No prices, address, phone or delivery dates.
//
// Pure helpers here; the webhook is api/webhooks/telegram.js.
// Setup: docs/integrations/telegram-order-alerts.md (Customer tracking).

import { lookupOrder, normalizeEmail, orderLookupLimiter, parseLookup } from "./track.js";

export const NOT_FOUND_TEXT =
  "I couldn't find an order with that number and email. Check both against your confirmation email, or call the shop at (954) 773-1896.";
export const HELP_TEXT = [
  "Hi, I'm the TireDrop order bot. 🛞",
  "",
  "To check an order, send the order number and the email you used at checkout in one message, like:",
  "#1001 you@example.com",
  "",
  "Not an order number? Type /help any time.",
].join("\n");
export const FAILED_TEXT = "I couldn't look that up just now. Please try again in a minute, or call the shop at (954) 773-1896.";
export const LIMIT_TEXT = "That's a lot of lookups. Please wait a few minutes and try again, or call the shop.";
export const ASK_BOTH_TEXT = "I need both the order number and the email you used at checkout, in one message. Example: #1001 you@example.com";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Pulls an order number (or TD- reference) and an email out of free text.
 * `{ lookup, email }` | `{ missing: "email" | "order" | "both" }`.
 */
export function extractLookup(text) {
  const raw = String(text ?? "").slice(0, 500);
  const emailMatch = raw.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/);
  const email = emailMatch ? normalizeEmail(emailMatch[0]) : null;
  const rest = emailMatch ? raw.replace(emailMatch[0], " ") : raw;
  const tokens = rest.split(/[\s,;]+/).filter(Boolean);
  let lookup = null;
  for (const t of tokens) {
    lookup = parseLookup(t);
    if (lookup) break;
  }
  if (!lookup) {
    // "order 1001" / "no. 1001": two tokens that parse together.
    for (let i = 0; i < tokens.length - 1 && !lookup; i++) lookup = parseLookup(`${tokens[i]}${tokens[i + 1]}`);
  }
  if (lookup && email) return { lookup, email };
  return { missing: !lookup && !email ? "both" : !email ? "email" : "order" };
}

const PAYMENT = {
  paid: "Paid",
  pending: "Payment pending",
  authorized: "Payment authorized",
  partially_paid: "Partially paid",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
  voided: "Voided",
};
const FULFILLMENT = {
  fulfilled: "Shipped",
  partially_fulfilled: "Partly shipped",
  unfulfilled: "Being prepared",
  in_progress: "Being prepared",
  on_hold: "On hold",
  scheduled: "Scheduled",
};
const DELIVERY = {
  ship: "Ships to your address",
  "ship-to-store": "Ships to our shop for installation",
  pickup: "Pickup at the shop",
  mobile: "Mobile install",
};
const SUPPLIER = {
  ordered: "Tires ordered from our supplier",
  "inbound-to-store": "Tires on their way to our shop",
};

/** Telegram HTML for one /track result ({ kind, order | request }). Pure. */
export function formatTrackReply(found) {
  if (found.kind === "request") {
    const r = found.request;
    const status =
      r.orderName ? `Now order ${r.orderName}`
      : r.status === "invoice_sent" ? "Invoice sent: check your email to pay"
      : r.status === "completed" ? "Completed"
      : "Request received: we'll email you an invoice";
    return [
      `🛞 <b>Request ${esc(r.ref)}</b>`,
      status,
      ...r.lines.map((l) => `• ${esc(l.quantity)} × ${esc(l.title)}`),
    ].join("\n");
  }
  const o = found.order;
  const lines = [`🛞 <b>Order ${esc(o.name)}</b>`];
  if (o.cancelled) {
    lines.push("This order was cancelled.");
  } else {
    const pay = PAYMENT[o.financialStatus];
    const ful = FULFILLMENT[o.fulfillmentStatus];
    if (pay) lines.push(`💳 ${pay}`);
    if (ful) lines.push(`📦 ${ful}`);
    if (o.supplier && o.fulfillmentStatus !== "fulfilled") lines.push(`🏭 ${SUPPLIER[o.supplier]}`);
  }
  if (DELIVERY[o.delivery]) lines.push(`🚚 ${DELIVERY[o.delivery]}`);
  lines.push(...o.lines.map((l) => `• ${esc(l.quantity)} × ${esc(l.title)}`));
  for (const t of o.tracking) {
    const label = `${t.company ? `${esc(t.company)} ` : ""}${esc(t.number)}`;
    lines.push(t.url ? `🔎 <a href="${esc(t.url)}">${label}</a>` : `🔎 ${label}`);
  }
  if (o.booking || o.delivery === "ship-to-store" || o.delivery === "mobile") {
    lines.push('📅 Installs are booked on <a href="https://tiredroponline.com/track">tiredroponline.com/track</a>');
  }
  return lines.join("\n");
}

/**
 * One Telegram update in, one reply out ({ text } or null for "say nothing").
 * Only private chats are served. `limiter` is shared with /api/track.
 */
export async function answerUpdate(update, { shopifyCfg, shopify = {}, limiter = orderLookupLimiter, now = Date.now, log = console } = {}) {
  const msg = update?.message;
  if (!msg || msg.chat?.type !== "private" || typeof msg.text !== "string") return null;
  const text = msg.text.trim();
  if (/^\/(start|help)(@\w+)?(\s|$)/i.test(text)) return { text: HELP_TEXT };
  const parsed = extractLookup(text);
  if (parsed.missing) return { text: parsed.missing === "both" ? HELP_TEXT : ASK_BOTH_TEXT };
  if (limiter.hit(`tg:${msg.chat.id}`, now())) return { text: LIMIT_TEXT };
  try {
    const found = await lookupOrder({ lookup: parsed.lookup, email: parsed.email }, shopifyCfg, shopify);
    return { text: found ? formatTrackReply(found) : NOT_FOUND_TEXT, html: Boolean(found) };
  } catch (err) {
    log.error(`[telegram-track] lookup failed: ${err?.message ?? err}`);
    return { text: FAILED_TEXT };
  }
}
