// "Remember this order on this device" (My Orders on /track).
//
// What is stored, and nothing else: per order the order number (or TD-
// request reference), the email the shopper typed for it, and an optional
// name the shopper gave it. It lives in this browser's localStorage under
// `tiredrop.orders.v1`, is never sent anywhere except in the lookup request
// to our own /api/track, and never goes into analytics. Remembering is the
// shopper's choice (a checkbox, off by default); "Forget" removes it.
//
// Every storage call is in try/catch: private mode or blocked storage reads
// as "nothing saved" and a save as `{ ok: false, reason: "storage" }`.

export const SAVED_ORDERS_KEY = "tiredrop.orders.v1";
export const MAX_SAVED_ORDERS = 10;
export const MAX_LABEL = 40;

const ORDER_NUMBER = /^(?:#|NO\.?|ORDER#?)?(\d{1,10})$/;
const REQUEST_REF = /^TD-\d{6}-[A-HJ-NP-Z2-9]{6}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** "#1001" for "1001" / "# 1001", the upper-cased TD- reference, or null. */
export function normalizeOrder(raw) {
  const text = String(raw ?? "").trim().replace(/\s+/g, "").toUpperCase();
  const num = text.match(ORDER_NUMBER);
  if (num) return `#${num[1]}`;
  return REQUEST_REF.test(text) ? text : null;
}

function normalizeEmail(raw) {
  const email = String(raw ?? "").trim().toLowerCase();
  return email.length <= 254 && EMAIL.test(email) ? email : null;
}

function normalizeLabel(raw) {
  return typeof raw !== "string" ? "" : raw.replace(/\s+/g, " ").trim().slice(0, MAX_LABEL);
}

function storage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** The entries worth keeping from whatever was stored (never trusts it). */
function clean(raw) {
  const list = Array.isArray(raw?.orders) ? raw.orders : [];
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const order = normalizeOrder(item?.order);
    const email = normalizeEmail(item?.email);
    if (!order || !email || seen.has(order)) continue;
    seen.add(order);
    const label = normalizeLabel(item?.label);
    out.push(label ? { order, email, label } : { order, email });
    if (out.length >= MAX_SAVED_ORDERS) break;
  }
  return out;
}

function write(list) {
  try {
    const store = storage();
    if (!store) return false;
    if (list.length === 0) store.removeItem(SAVED_ORDERS_KEY);
    else store.setItem(SAVED_ORDERS_KEY, JSON.stringify({ orders: list }));
    return true;
  } catch {
    return false;
  }
}

/** Whether this browser lets the site keep anything (false: hide the checkbox). */
export function canSaveOrders() {
  try {
    const store = storage();
    if (!store) return false;
    const probe = `${SAVED_ORDERS_KEY}.probe`;
    store.setItem(probe, "1");
    store.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** Saved orders, newest first: `[{ order, email, label? }]`. */
export function listSaved() {
  try {
    const raw = storage()?.getItem(SAVED_ORDERS_KEY);
    return raw ? clean(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

/**
 * Remembers an order (the newest goes first; the same order again replaces
 * its entry). `{ ok: true, list }`, or `{ ok: false, reason }` with reason
 * "invalid", "full" (10 already; nothing is dropped silently) or "storage".
 */
export function saveOrder({ order, email, label } = {}) {
  const o = normalizeOrder(order);
  const e = normalizeEmail(email);
  if (!o || !e) return { ok: false, reason: "invalid" };
  const current = listSaved();
  const rest = current.filter((item) => item.order !== o);
  if (rest.length >= MAX_SAVED_ORDERS) return { ok: false, reason: "full" };
  const name = normalizeLabel(label);
  const list = [name ? { order: o, email: e, label: name } : { order: o, email: e }, ...rest];
  return write(list) ? { ok: true, list } : { ok: false, reason: "storage" };
}

/** Forgets one order. Returns the list left. */
export function forgetOrder(order) {
  const o = normalizeOrder(order);
  const left = listSaved().filter((item) => item.order !== o);
  write(left);
  return left;
}

/** Forgets every saved order and removes the storage entry. */
export function forgetAll() {
  write([]);
  return [];
}
