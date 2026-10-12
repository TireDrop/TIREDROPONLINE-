// Telegram order alerts: a short message to Justin (or a staff group) for
// every PAID order, sent from the orders/paid webhook (api/webhooks/shopify.js).
//
// Env (set in Vercel, never in the repo):
//   TELEGRAM_BOT_TOKEN  from @BotFather
//   TELEGRAM_CHAT_ID    your chat id, or a group's (negative number)
// Either one missing = alerts are off (not an error).
//
// What goes in the message: order number, total, items, how it gets to the
// customer (ship / install at the shop / mobile install) and the destination
// CITY and STATE only. No customer name, email, phone or street address ever
// leaves Shopify through this. The bot token is never logged.
//
// Never throws: a Telegram failure is logged and the webhook carries on.
// Setup: docs/integrations/telegram-order-alerts.md.

import { installKind, restPayloadToNode } from "./booking.js";

const API = "https://api.telegram.org";
const TIMEOUT_MS = 4000;

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** { token, chatId } when both are set, else null. */
export function telegramConfig(env = process.env) {
  const token = String(env?.TELEGRAM_BOT_TOKEN ?? "").trim();
  const chatId = String(env?.TELEGRAM_CHAT_ID ?? "").trim();
  return token && chatId ? { token, chatId } : null;
}

const money = (amount, currency) => {
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;
  return `${currency && currency !== "USD" ? `${currency} ` : "$"}${n.toFixed(2)}`;
};

/** The shopper-facing delivery label for an orders/paid payload. */
export function deliveryLabel(payload) {
  const kind = installKind(restPayloadToNode(payload));
  if (kind === "mobile") return "Mobile install (van)";
  if (kind === "shop") return "Install at the shop / pickup";
  return "Ships to customer";
}

/** HTML text for Telegram from an orders/paid REST payload. Pure. */
export function formatOrderMessage(payload, { shopDomain = "" } = {}) {
  const p = payload && typeof payload === "object" ? payload : {};
  const lines = (Array.isArray(p.line_items) ? p.line_items : [])
    .slice(0, 8)
    .map((l) => `• ${esc(l?.quantity ?? 1)} × ${esc(String(l?.title ?? l?.name ?? "Item").slice(0, 90))}`);
  const more = Array.isArray(p.line_items) && p.line_items.length > 8 ? [`• +${p.line_items.length - 8} more`] : [];
  const a = p.shipping_address ?? {};
  const where = [a.city, a.province_code ?? a.province].filter(Boolean).join(", ");
  const total = money(p.current_total_price ?? p.total_price, p.currency);
  const handle = String(shopDomain).replace(/\.myshopify\.com$/i, "");
  const link =
    handle && p.id && /^\d+$/.test(String(p.id))
      ? `https://admin.shopify.com/store/${handle}/orders/${p.id}`
      : "";
  return [
    `🛞 <b>${p.test ? "TEST " : ""}New TireDrop order ${esc(p.name ?? "")}</b>`,
    total ? `💵 ${esc(total)}` : null,
    ...lines,
    ...more,
    `🚚 ${esc(deliveryLabel(p))}`,
    where ? `📍 ${esc(where)}` : null,
    link ? `<a href="${esc(link)}">Open in Shopify</a>` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** POST to Telegram. Returns { ok, skipped?, status? }; never throws. */
export async function sendTelegram(text, { env = process.env, fetchImpl = fetch, log = console } = {}) {
  const cfg = telegramConfig(env);
  if (!cfg) return { ok: false, skipped: "not-configured" };
  try {
    const res = await fetchImpl(`${API}/bot${cfg.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: cfg.chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      // Status only: the URL contains the token, the body can echo the chat id.
      log.error(`[telegram] sendMessage failed: HTTP ${res.status}`);
      return { ok: false, status: res.status };
    }
    return { ok: true };
  } catch (err) {
    log.error(`[telegram] sendMessage failed: ${err?.name ?? "error"}`);
    return { ok: false };
  }
}

/** Alert for one paid order. Never throws. */
export async function notifyPaidOrder(payload, { env = process.env, shopDomain = "", fetchImpl, log } = {}) {
  try {
    return await sendTelegram(formatOrderMessage(payload, { shopDomain }), { env, fetchImpl, log });
  } catch {
    return { ok: false };
  }
}
