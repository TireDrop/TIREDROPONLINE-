/**
 * The fill-time token every public form sends, shared by the browser and the
 * API (api/_lib/spam.js).
 *
 * People take seconds to fill a form; a bot posting straight at the API takes
 * none and runs no JavaScript. So each form notes when it appeared, and on
 * submit sends `ft`: when it appeared and how long it was on screen, both
 * from the visitor's own clock, with a checksum. The server reads only the
 * elapsed time, so a visitor whose clock is hours off is not penalised.
 *
 * This is obfuscation, not a signature: anyone reading this file can mint a
 * token. It stops the scripts that post forms blind, which is most form spam;
 * the honeypot, content checks and per-IP rate limits do the rest. A signed
 * token would need a server round trip before every form, for no real gain
 * against a bot that runs the page's JavaScript anyway.
 */

/** The body field the token travels in. */
export const FILL_TOKEN_FIELD = "ft";

/**
 * Anything sent sooner than this after the form appeared is treated as a bot
 * (answered like a success, nothing stored). Two seconds: browser autofill
 * plus a click is still slower than that on every real form here (the
 * shortest, the footer sign-up, needs a scroll to the footer first), while a
 * blind POST is instant.
 */
export const MIN_FILL_MS = 2000;

const VERSION = "1";
const SALT = "tiredrop-fill";
const MAX_TOKEN_LENGTH = 64;

/** FNV-1a, 32 bit: a checksum so a hand-typed token reads as forged. */
function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

const check = (start, elapsed) => fnv1a(`${SALT}:${start}:${elapsed}`).toString(36);

/** The token for a form that appeared at `startedAt` and is sent at `submittedAt`. */
export function fillToken(startedAt, submittedAt = Date.now()) {
  const start = Math.max(0, Math.floor(Number(startedAt) || 0));
  const elapsed = Math.max(0, Math.floor(Number(submittedAt) - start) || 0);
  return [VERSION, start.toString(36), elapsed.toString(36), check(start, elapsed)].join(".");
}

const B36 = /^[0-9a-z]{1,12}$/;

/**
 * `{ startedAt, elapsedMs }` from a token, or null when it is missing,
 * malformed or its checksum does not match.
 */
export function readFillToken(token) {
  if (typeof token !== "string" || !token || token.length > MAX_TOKEN_LENGTH) return null;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) return null;
  const [, a, b, sum] = parts;
  if (!B36.test(a) || !B36.test(b) || !B36.test(sum)) return null;
  const start = parseInt(a, 36);
  const elapsed = parseInt(b, 36);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(elapsed)) return null;
  if (check(start, elapsed) !== sum) return null;
  return { startedAt: start, elapsedMs: elapsed };
}

// ---- Browser side ---------------------------------------------------------------

/**
 * When a form that mounts `now` appeared. A form on the page the visitor
 * landed on was on screen (prerendered) from the first paint, before the app
 * started, and may have been typed into meanwhile, so for anything mounted in
 * the page's first 10 seconds the page's own start counts. That can only
 * make the time longer, never shorter, so it never turns a person into a
 * "bot".
 */
function appearedAt(now) {
  try {
    const perf = globalThis.performance;
    if (perf && perf.now() < 10000 && perf.timeOrigin > 0) {
      return Math.min(now, Math.floor(perf.timeOrigin));
    }
  } catch {
    /* no performance API: use now */
  }
  return now;
}

// Module load: the fallback for a form with no honeypot to key on.
const PAGE_START = appearedAt(Date.now());
const starts = new Map();

/**
 * Notes that the form keyed `key` (its honeypot's id) is on screen. Only the
 * first call counts, so re-renders, a fresh render after the app starts and
 * StrictMode's double effects never move the start later.
 */
export function noteFormStart(key, now = Date.now()) {
  if (key && !starts.has(key)) starts.set(key, appearedAt(now));
}

/**
 * The spam-guard fields a form sends with its values: the honeypot's value
 * (`website`, normally "") and the fill-time token (`ft`). `formElement` is
 * the submitted <form>; its honeypot (<FormTrap />, name "website") is read
 * straight from the DOM, however it was filled.
 */
export function guardFields(formElement, now = Date.now()) {
  const trap = formElement?.elements?.namedItem?.("website");
  const website = typeof trap?.value === "string" ? trap.value : "";
  const start = (trap?.id && starts.get(trap.id)) || PAGE_START;
  return { website, [FILL_TOKEN_FIELD]: fillToken(start, now) };
}
