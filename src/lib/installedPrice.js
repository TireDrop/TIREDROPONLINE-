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
//
// Optionally it starts ON for a visitor known to be in the install area
// (INSTALLED_DEFAULT_FOR_LOCAL in src/data/installedDefault.js, off in
// production), and a ?installed=local|off flag previews that. Whatever the
// default, the visitor's own choice, on or off, always wins.

import { getService } from "../data/services.js";
import { SET_SIZE } from "../data/pricing.js";
import { INSTALLED_DEFAULT_FOR_LOCAL } from "../data/installedDefault.js";
import { isInServiceArea } from "../data/serviceArea.js";
import { fetchApproxLocation } from "./geoLocate.js";

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
 * Deciding on or off
 * ------------------------------------------------------------------ */

const AREA_KEY = "tiredrop.area.v1"; // sessionStorage: "in" or "out", this tab only

/**
 * The ?installed= preview flag: "local" (as if the switch were on and the
 * visitor in the area), "off" (forced off), or null. Anything else is null.
 * Preview only: never stored, and the canonical URL never carries it.
 */
export function parsePreviewFlag(search) {
  try {
    const v = new URLSearchParams(search || "").get("installed");
    return v === "local" || v === "off" ? v : null;
  } catch {
    return null;
  }
}

/**
 * Whether installed prices are on, and why: `{ on, source }`.
 *   choice   true or false when the visitor decided, else null
 *   preview  "local", "off" or null (parsePreviewFlag)
 *   defaultOn the INSTALLED_DEFAULT_FOR_LOCAL switch
 *   inArea   true, false, or null when the location is not known (yet)
 * source is "visitor", "preview", "default-local" (the switch did it) or
 * "off". The order is the rule: a forced preview off, then the visitor's
 * own choice, then the default, which needs a known in-area visitor.
 */
export function decideInstalled({ choice = null, preview = null, defaultOn = false, inArea = null } = {}) {
  if (preview === "off") return { on: false, source: "preview" };
  if (choice === true || choice === false) return { on: choice, source: "visitor" };
  if (preview === "local") return { on: true, source: "preview" };
  if (defaultOn && inArea === true) return { on: true, source: "default-local" };
  return { on: false, source: "off" };
}

/** True, false, or null (unknown) for an /api/geo-style approx location. */
export function areaFromApprox(approx) {
  if (!approx || typeof approx.zip !== "string") return null; // coordinates alone: unknown
  return isInServiceArea(approx.zip);
}

/* ------------------------------------------------------------------ *
 * The store (a tiny external store for useSyncExternalStore)
 * ------------------------------------------------------------------ */

/**
 * Builds the store. The page uses the one below; tests build their own with
 * a fake window, a switch value and a location lookup.
 *
 * Every storage access is wrapped. The server snapshot is always off (the
 * component passes it), so the prerendered HTML and hydration never differ.
 */
export function createInstalledStore({
  defaultOn = false,
  getWindow = () => (typeof window === "undefined" ? undefined : window),
  lookupApprox = fetchApproxLocation,
} = {}) {
  let ready = false;
  let choice = null; // true, false, or null: no choice made
  let preview = null;
  let touched = false; // the visitor pressed the toggle on this page load
  let inArea = null;
  let looking = false;
  const listeners = new Set();

  const store = (win, kind) => {
    try {
      return win?.[kind] ?? null;
    } catch {
      return null;
    }
  };

  function readChoice(win) {
    try {
      const v = JSON.parse(store(win, "localStorage")?.getItem(KEY) || "null");
      if (v?.on === true) return true;
      if (v?.on === false) return false;
      return null;
    } catch {
      return null;
    }
  }

  function init() {
    if (ready) return;
    const win = getWindow();
    if (!win) return; // server: stays unread
    ready = true;
    preview = parsePreviewFlag(win.location?.search);
    choice = readChoice(win);
    try {
      const cached = store(win, "sessionStorage")?.getItem(AREA_KEY);
      inArea = cached === "in" ? true : cached === "out" ? false : null;
    } catch {
      inArea = null;
    }
  }

  const notify = () => listeners.forEach((fn) => fn());

  const current = () => {
    init();
    // A forced ?installed=off holds until the visitor presses the toggle.
    const flag = touched && preview === "off" ? null : preview;
    return decideInstalled({ choice, preview: flag, defaultOn, inArea });
  };

  // Asks /api/geo once, only when the answer could change the result: the
  // switch is on, the visitor has not chosen, and no preview flag is set.
  async function lookupArea() {
    init();
    if (!defaultOn || preview || choice !== null || inArea !== null || looking) return;
    const win = getWindow();
    if (!win) return;
    looking = true;
    let result = null;
    try {
      result = areaFromApprox(await lookupApprox());
    } catch {
      result = null;
    }
    looking = false;
    if (result === null) return; // unknown stays off, and is asked again next page
    inArea = result;
    try {
      store(win, "sessionStorage")?.setItem(AREA_KEY, result ? "in" : "out");
    } catch {
      /* not remembered: one more lookup next page */
    }
    notify();
  }

  return {
    /** Whether installed prices are on. Browser only (the server is off). */
    getShown: () => current().on,
    /** "visitor", "preview", "default-local" or "off": why getShown is what it is. */
    getSource: () => current().source,
    /**
     * Turns it on or off for this visitor and remembers it. With the switch
     * on, an explicit "off" is remembered too, so the default never comes
     * back over it. A preview flag stores nothing: the choice lasts for the
     * page load.
     */
    set(on) {
      init();
      choice = Boolean(on);
      touched = true;
      const win = getWindow();
      if (!preview) {
        try {
          const ls = store(win, "localStorage");
          if (choice) ls?.setItem(KEY, JSON.stringify({ v: 1, on: true }));
          else if (defaultOn) ls?.setItem(KEY, JSON.stringify({ v: 1, on: false }));
          else ls?.removeItem(KEY);
        } catch {
          /* storage unavailable: the choice lasts for this page load */
        }
      }
      notify();
    },
    /** Subscribes to changes here and in other tabs. Returns the unsubscribe. */
    subscribe(fn) {
      listeners.add(fn);
      const win = getWindow();
      const onStorage = (e) => {
        if (e.key !== KEY && e.key !== null) return;
        choice = readChoice(getWindow());
        fn();
      };
      win?.addEventListener?.("storage", onStorage);
      lookupArea(); // after hydration: subscribe runs in an effect
      return () => {
        listeners.delete(fn);
        win?.removeEventListener?.("storage", onStorage);
      };
    },
    /** The ?installed= value this page load was opened with. */
    getPreview: () => {
      init();
      return preview;
    },
  };
}

const installedStore = createInstalledStore({ defaultOn: INSTALLED_DEFAULT_FOR_LOCAL });
// The preview flag is read when this module loads, before anything can
// rewrite the address bar (TiresPage tidies its query string).
installedStore.getPreview();

/** Whether installed prices are on. Browser only. */
export const getInstalledShown = installedStore.getShown;

/** Why: "visitor", "preview", "default-local" (the switch) or "off". */
export const getInstalledSource = installedStore.getSource;

/** Turns installed prices on or off, remembers it, and tells subscribers. */
export const setInstalledShown = installedStore.set;

/** Subscribes to changes here and in other tabs. Returns the unsubscribe. */
export const subscribeInstalled = installedStore.subscribe;

export const INSTALLED_KEY = KEY;
