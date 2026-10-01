// The spam guard for the public write endpoints: /api/forms, /api/checkout,
// /api/newsletter and /api/book-install. No captcha, no third-party service.
//
// In order, for each submission (after the per-IP rate limit and the body
// size cap, which the handlers apply first):
//
//   1. Honeypot. `website` is a field people never see (<FormTrap />:
//      off-screen, aria-hidden, tabindex -1, autocomplete off). Filled → bot.
//   2. Fill time. `ft` (src/data/formGuard.js) says how long the form was on
//      screen. Missing → "stale": a page loaded before this guard shipped, or
//      a script; answered 400 "reload the page", nothing stored. Forged or
//      malformed → bot. Under MIN_FILL_MS (2 s) → bot.
//   3. Content, kept conservative because a false positive silently loses a
//      real customer: a link in a person's name, more than MAX_LINKS links in
//      the text, HTML/BBCode link markup, or a link together with a classic
//      spam phrase. Nothing else (no language, keyword-only or length rules).
//
// A bot gets the endpoint's normal success answer and nothing is written
// anywhere. Every block is logged as `[spam] blocked <endpoint> <reason>`
// with no name, email, phone, message or IP in the line.
//
// Test mode: SPAM_GUARD_TEST_MODE=1 drops the minimum fill time to 0 so the
// browser checks (scripts/forms-keep-values-check.mjs), which fill forms
// faster than any person, can run the real guard over what the pages send.
// It is ignored when VERCEL_ENV is "production", so it can never switch the
// timing check off on the live site; nothing sets it on Vercel. Everything
// else (honeypot, a present and valid token, content) is checked as usual.

import { FILL_TOKEN_FIELD, MIN_FILL_MS, readFillToken } from "../../src/data/formGuard.js";

export const HONEYPOT_FIELD = "website";
export const MAX_LINKS = 3;

/** Per-endpoint body caps, in bytes (the largest real form is well under half). */
export const BODY_LIMITS = Object.freeze({
  forms: 16 * 1024,
  checkout: 16 * 1024,
  newsletter: 2 * 1024,
  "book-install": 4 * 1024,
});

/** The minimum fill time for this environment (see "Test mode" above). */
export function minFillMs(env = process.env) {
  const testMode = env?.SPAM_GUARD_TEST_MODE === "1" && env?.VERCEL_ENV !== "production";
  return testMode ? 0 : MIN_FILL_MS;
}

const LINK = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;
const LINK_IN_NAME = /(?:https?:\/\/|www\.|<\s*a\b|\[url)/i;
const LINK_MARKUP = /<\s*a\s[^>]*href|\[url[=\]]|\[link[=\]]/i;
// Only ever counted together with a link in the same submission.
const SPAM_PHRASE =
  /\b(?:viagra|cialis|casino|porn|escort service|backlinks?|seo (?:services?|agency|expert)|guest post|link building|crypto(?:currency)? invest\w*|forex|payday loan|increase (?:your )?(?:web(?:site)? )?traffic)\b/i;

const asText = (v) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");

/**
 * The content verdict for one submission: null when it looks like a person,
 * else the reason. `names` are the person-name values, `texts` everything
 * else free-typed (message, notes, address…). Emails are never checked.
 */
export function contentSpamReason({ names = [], texts = [] }) {
  if (names.some((n) => LINK_IN_NAME.test(asText(n)))) return "link-in-name";
  const all = [...names, ...texts].map(asText).join("\n");
  if (LINK_MARKUP.test(all)) return "link-markup";
  const links = all.match(LINK) ?? [];
  if (links.length > MAX_LINKS) return "too-many-links";
  if (links.length > 0 && SPAM_PHRASE.test(all)) return "spam-phrase";
  return null;
}

/**
 * Inspects one parsed body. Resolves `{ verdict: "ok" }`,
 * `{ verdict: "bot", reason }` or `{ verdict: "stale" }`.
 * `content` is `{ names, texts }` for contentSpamReason (taken from the raw
 * body, before validation, so a bot's input is judged as sent).
 */
export function inspectSubmission(body, { env = process.env, content = null } = {}) {
  // Not a JSON object: nothing to judge; the endpoint's validator rejects it.
  if (!body || typeof body !== "object" || Array.isArray(body)) return { verdict: "ok" };
  const b = body;
  if (asText(b[HONEYPOT_FIELD]).trim()) return { verdict: "bot", reason: "honeypot" };

  const raw = b[FILL_TOKEN_FIELD];
  if (raw === undefined || raw === null || raw === "") return { verdict: "stale" };
  const token = readFillToken(raw);
  if (!token) return { verdict: "bot", reason: "bad-token" };
  if (token.elapsedMs < minFillMs(env)) {
    return { verdict: "bot", reason: "too-fast", elapsedMs: token.elapsedMs };
  }

  const reason = content ? contentSpamReason(content) : null;
  if (reason) return { verdict: "bot", reason };
  return { verdict: "ok" };
}

/** Logs a block with no personal data: endpoint, reason, and the form's name. */
export function logBlocked(endpoint, result, { form = null, log = console } = {}) {
  const extra = [
    form ? `form=${String(form).replace(/[^\w-]/g, "").slice(0, 20)}` : null,
    result.elapsedMs !== undefined ? `elapsedMs=${result.elapsedMs}` : null,
  ].filter(Boolean);
  log.warn(`[spam] blocked ${endpoint} ${result.reason ?? result.verdict}${extra.length ? ` ${extra.join(" ")}` : ""}`);
}

/** Logs a rate-limited request, again with no IP or personal data. */
export function logRateLimited(endpoint, log = console) {
  log.warn(`[spam] rate-limited ${endpoint}`);
}

/** The answer to a page loaded before the guard shipped (no `ft`). */
export const STALE_PAGE =
  "This page is out of date, so nothing was sent. Reload the page and try again.";
