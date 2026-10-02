// The installed-price toggle on /tires and the tire pages: "what will I
// actually pay?" for a local shopper, before checkout. A display aid only:
// it never touches the cart, the checkout or what an order costs.
//
// The install price is the catalog's, read from src/data/services.js
// (getService("tire-installation").priceFrom and priceUnit). It is a "from"
// price, so every installed figure is labelled "installed from". The van
// bills the same labor as the bay (/mobile-service), and services.js keeps
// one price, so there is one line; a separate mobile price would need its
// own field there first.
//
// The choice is remembered per visitor under its own key, the way the
// fitment pick is (src/data/vehicles.js): every read and write is wrapped,
// and with storage blocked the choice lasts for the page load. Default off.

import { getService } from "../data/services.js";
import { SET_SIZE } from "../data/pricing.js";

export const INSTALL_SERVICE = getService("tire-installation");

const KEY = "tiredrop.installed.v1";

const cents = (n) => Math.round(n * 100) / 100;

/** True when the unit text prices each tire ("per tire", "per wheel"). */
const perTire = (unit) => /\bper (tire|wheel)\b/i.test(unit ?? "");

/**
 * The install price as the site can quote it, or null when the service
 * gives no usable number: `{ price, unit, from, perTire }`.
 */
export function installQuote(service = INSTALL_SERVICE) {
  const price = Number(service?.priceFrom);
  if (!Number.isFinite(price) || price < 0) return null;
  return {
    price,
    unit: service.priceUnit ?? "",
    from: true, // priceFrom: the starting price, never a fixed one
    perTire: perTire(service.priceUnit),
  };
}

/**
 * Tire + installation = total for `qty` tires at `tirePrice` each:
 * `{ qty, tire, install, total }`, in dollars rounded to the cent. A price
 * per tire is counted once per tire; any other unit once for the job.
 */
export function installedTotal(tirePrice, quote, qty = 1) {
  const each = Number(tirePrice);
  if (!Number.isFinite(each) || !quote) return null;
  const tire = cents(each * qty);
  const install = cents(quote.perTire ? quote.price * qty : quote.price);
  return { qty, tire, install, total: cents(tire + install) };
}

/**
 * Both lines a tire shows with the toggle on: one tire and a set of four.
 * null when there is no price or no install quote to show.
 */
export function installedLines(tirePrice, service = INSTALL_SERVICE) {
  const quote = installQuote(service);
  const one = installedTotal(tirePrice, quote, 1);
  if (!one) return null;
  return {
    from: quote.from,
    label: quote.from ? "installed from" : "installed",
    one,
    set: installedTotal(tirePrice, quote, SET_SIZE),
  };
}

/* ------------------------------------------------------------------ *
 * The remembered choice (a tiny external store for useSyncExternalStore)
 * ------------------------------------------------------------------ */

let shown = null; // null until first read
const listeners = new Set();

function read() {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) || "null");
    return v?.on === true;
  } catch {
    return false;
  }
}

/** Whether the visitor turned installed prices on. Browser only. */
export function getInstalledShown() {
  if (shown === null) shown = typeof window === "undefined" ? false : read();
  return shown;
}

/** Turns installed prices on or off, remembers it, and tells subscribers. */
export function setInstalledShown(on) {
  shown = Boolean(on);
  try {
    if (shown) window.localStorage.setItem(KEY, JSON.stringify({ v: 1, on: true }));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: the choice lasts for this page load */
  }
  listeners.forEach((fn) => fn());
}

/** Subscribes to changes here and in other tabs. Returns the unsubscribe. */
export function subscribeInstalled(fn) {
  listeners.add(fn);
  const onStorage = (e) => {
    if (e.key !== KEY && e.key !== null) return;
    shown = read();
    fn();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

export const INSTALLED_KEY = KEY;
