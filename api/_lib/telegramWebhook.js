// Telegram bot updates (customer order tracking). Served at
// POST /api/webhooks/telegram, which vercel.json rewrites to
// /api/webhooks/shopify?src=telegram (Hobby plan: 12 functions max, so this
// is a module that endpoint hands off to, not a function of its own).
//
// A customer messages @TIREDROPONLINE_Bot "#1001 you@example.com" and gets the
// same small public view as /track (api/_lib/telegramTrack.js). Same security
// rule as /track: the order is returned only when the email matches.
//
// Security: Telegram sends the secret you gave setWebhook in the header
// X-Telegram-Bot-Api-Secret-Token. It must equal TELEGRAM_WEBHOOK_SECRET
// (constant-time compare); anything else is a 401 and the body is not read.
// Only private chats are answered; groups and channels are ignored.
//
// The reply goes back in the HTTP response (webhook reply method), so this
// needs only the secret, not the bot token. Telegram gets a 200 for every
// authentic update so it never retries a lookup.
//
// Responses: 200 { method: "sendMessage", ... } | 200 {} (nothing to say) |
// 401 bad secret | 503 not configured.
// Setup: docs/integrations/telegram-order-alerts.md.

import { timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import { getConfig } from "./config.js";
import { answerUpdate } from "./telegramTrack.js";

const NO_STORE = { "Cache-Control": "no-store" };
const MAX_BYTES = 64 * 1024;
const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...NO_STORE },
  });

function secretMatches(given, expected) {
  if (!expected || typeof given !== "string") return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** The handler, with `env` and lookup deps injectable for tests. */
export function createTelegramWebhookHandler({ env, deps = {} } = {}) {
  return async function POST(request) {
    const log = deps.log ?? console;
    const e = env ?? process.env;
    const expected = String(e.TELEGRAM_WEBHOOK_SECRET ?? "").trim();
    if (!expected) {
      log.error("[telegram-webhook] TELEGRAM_WEBHOOK_SECRET is not set; update refused.");
      return json(503, { configured: false });
    }
    if (!secretMatches(request.headers.get("x-telegram-bot-api-secret-token"), expected)) {
      log.warn("[telegram-webhook] secret mismatch; update refused.");
      return json(401, { error: "Unauthorized." });
    }
    const declared = Number(request.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > MAX_BYTES) return json(200, {});
    let update;
    try {
      const raw = await request.text();
      if (raw.length > MAX_BYTES) return json(200, {});
      update = JSON.parse(raw);
    } catch {
      return json(200, {});
    }

    const config = getConfig(e);
    const shopifyLive = config.shopify.mode === "live" && config.shopify.ok;
    const chatId = update?.message?.chat?.id;
    if (chatId == null) return json(200, {});
    if (!shopifyLive) {
      log.error("[telegram-webhook] Shopify is not configured; cannot look up orders.");
      return json(200, {
        method: "sendMessage",
        chat_id: chatId,
        text: "Order lookup isn't available yet. Please call the shop at (954) 773-1896.",
      });
    }
    const reply = await answerUpdate(update, {
      shopifyCfg: config.shopify,
      shopify: deps.shopify ?? {},
      limiter: deps.limiter,
      now: deps.now,
      log,
    });
    if (!reply) return json(200, {});
    return json(200, {
      method: "sendMessage",
      chat_id: chatId,
      text: reply.text,
      ...(reply.html ? { parse_mode: "HTML", disable_web_page_preview: true } : {}),
    });
  };
}

