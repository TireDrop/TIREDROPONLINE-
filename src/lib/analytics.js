// GA4 page views for in-app navigation, and the conversion events (bottom
// of this file).
//
// The gtag snippet in index.html sends the page_view for the page the visitor
// lands on (gtag "config" does that by default). Every later route change is
// sent from here, with the title the new page actually set. GA4's own
// history-change page views would record the previous page's title, because
// routes are React.lazy and the Seo component sets document.title in an
// effect after the URL has already changed. So the GA web stream must have
// Enhanced measurement → Page views → "Page changes based on browser history
// events" switched OFF, or every navigation is counted twice.
//
// trackPageView(key) is called by <PageViewTracker> in App.jsx, which sits
// inside the routes' <Suspense> boundary after <Routes>. Its effect therefore
// runs only once the new route has rendered, and after that route's Seo
// effect has set document.title (effects run in tree order, Routes first).
//
// Rules:
//   - One page_view per distinct pathname + search. Re-renders, React
//     StrictMode's double effects and hash-only changes send nothing.
//   - The first key seen is the landing page, already sent by gtag config:
//     it is recorded, not sent again.
//   - A page whose title starts with "Loading" (TireSkuPage while it fetches
//     the tire) is held until the real title arrives, up to MAX_WAIT_MS, and
//     sent early if the visitor navigates on before then.
//   - No-op when window.gtag is absent (tests, blocked by an extension).
//
// Privacy §§3, 4 and 6 describe what Google Analytics receives; this adds no
// new data (page title, URL and path are what gtag's own page views carry).

const PLACEHOLDER_TITLE = /^Loading\b/;
const MAX_WAIT_MS = 5000;

let lastKey = null;
let flushPending = null;

function gtagReady() {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

/** Sends one GA4 page_view. No-op without gtag. */
export function sendPageView({ title, location, path }) {
  if (!gtagReady()) return;
  window.gtag("event", "page_view", {
    page_title: title,
    page_location: location,
    page_path: path,
  });
}

/** Holds `view` until document.title stops being a placeholder. */
function sendWhenTitled(view) {
  const titleEl = document.querySelector("title");
  let done = false;
  let observer = null;
  let timer = 0;
  const finish = () => {
    if (done) return;
    done = true;
    observer?.disconnect();
    clearTimeout(timer);
    if (flushPending === finish) flushPending = null;
    sendPageView(view);
  };
  if (titleEl && typeof MutationObserver === "function") {
    observer = new MutationObserver(() => {
      view.title = document.title;
      if (!PLACEHOLDER_TITLE.test(view.title)) finish();
    });
    observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
  }
  timer = setTimeout(finish, MAX_WAIT_MS);
  flushPending = finish;
}

/**
 * Records a navigation to `key` (the router's pathname + search) and sends
 * its page_view, deduplicated as described above. `path` is the router's
 * pathname, so a HashRouter preview still reports the real route.
 */
export function trackPageView(key, path = key) {
  if (key === lastKey) return;
  const landing = lastKey === null;
  lastKey = key;
  // A held page is sent with the title and URL it had, before this one.
  flushPending?.();
  if (landing || !gtagReady()) return;

  const view = { title: document.title, location: window.location.href, path };
  if (PLACEHOLDER_TITLE.test(view.title)) sendWhenTitled(view);
  else sendPageView(view);
}

/* ------------------------------------------------------------------ */
/*  Conversion events                                                  */
/* ------------------------------------------------------------------ */
//
// GA4's recommended ecommerce and lead events, plus four custom ones
// (order_request, install_booking, tool_use, search_suggestion). Every event
// goes through trackEvent(), which keeps only the parameter names listed below and drops
// any value that looks like an email address or a phone number, so nothing
// a visitor typed about themselves (name, email, phone, address, notes,
// order email) can reach Google. Callers pass only product, delivery-choice,
// form-name and tool facts anyway; the filter is the backstop.
//
//   view_item          product page              items (one)
//   add_to_cart        any Add button            items, value, currency
//   remove_from_cart   cart remove / qty down    items, value, currency
//   view_cart          /cart                     items, value, currency
//   begin_checkout     /checkout with a cart     items, value, currency
//   add_shipping_info  checkout delivery step    shipping_tier, items, value
//   order_request      request-only order sent   value (incl. install), shipping_tier, items
//   generate_lead      a form delivered          form_name
//   install_booking    /track booking panel      install_type, method
//   search             tire/wheel finder         search_term (size or Y/M/M), search_type
//                      header search submit,     search_term (as typed), search_type "site"
//                      "See all results"
//   search_suggestion  a header search           search_term, suggestion_type (sizes,
//                      suggestion picked         vehicles, brands, products, pages),
//                                                suggestion_path
//   tool_use           first touch of a demo     tool_id (once per page view)
//
// `purchase` is NOT sent. Checkout is request-only today: no money changes
// hands on this site. When online payment is switched on, the purchase is
// recorded on Shopify's checkout (it knows the transaction id and whether
// payment went through); sending it from here at the redirect would count
// abandoned payments as sales.
//
// No-op without window.gtag (prerender, SSR, tests, blockers). There is no
// consent banner on the site (privacy §3 describes the measurement), so
// there is no consent state to check. GA4 DebugView: use Google Tag
// Assistant (tagassistant.google.com) on the live site; no code flag needed.

const CURRENCY = "USD";

const EVENT_KEYS = new Set([
  "currency",
  "value",
  "items",
  "shipping_tier",
  "form_name",
  "search_term",
  "search_type",
  "suggestion_type",
  "suggestion_path",
  "tool_id",
  "install_type",
  "method",
]);
const ITEM_KEYS = new Set([
  "item_id",
  "item_name",
  "item_brand",
  "item_category",
  "item_variant",
  "price",
  "quantity",
]);
// Keys whose values are catalogue codes (a SKU can be ten digits) and so are
// exempt from the phone-number test; they are never typed by a visitor.
const CODE_KEYS = new Set(["item_id"]);

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_RE = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/;

function cleanValue(key, value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;
  const text = value.trim().slice(0, 100); // GA4's limit for parameter values
  if (!text || EMAIL_RE.test(text)) return undefined;
  if (!CODE_KEYS.has(key) && PHONE_RE.test(text)) return undefined;
  return text;
}

function cleanObject(source, allowed) {
  const out = {};
  for (const [key, value] of Object.entries(source ?? {})) {
    if (!allowed.has(key)) continue;
    const clean = cleanValue(key, value);
    if (clean !== undefined) out[key] = clean;
  }
  return out;
}

/**
 * The parameters GA may receive: allow-listed keys only, no email- or
 * phone-shaped values, `items` reduced to GA's item fields. Exported for the
 * unit test.
 */
export function cleanParams(params = {}) {
  const out = cleanObject(params, EVENT_KEYS);
  if (Array.isArray(params.items)) {
    out.items = params.items
      .map((item) => cleanObject(item, ITEM_KEYS))
      .filter((item) => item.item_id || item.item_name);
  }
  return out;
}

/** Sends one GA4 event with cleaned parameters. No-op without gtag. */
export function trackEvent(name, params = {}) {
  if (!gtagReady() || !/^[a-z][a-z0-9_]{0,39}$/.test(name)) return;
  try {
    window.gtag("event", name, cleanParams(params));
  } catch {
    /* analytics must never break the page */
  }
}

/** A cart line or product as a GA4 item (sku as item_id). */
export function toGaItem(line, quantity = line?.qty ?? 1) {
  return {
    item_id: String(line?.sku ?? line?.id ?? ""),
    item_name: line?.model ?? line?.name,
    item_brand: line?.brand,
    item_category: line?.kind,
    item_variant: line?.size,
    price: Number(line?.price) || 0,
    quantity,
  };
}

/** items + value + currency for a list of cart lines. */
export function cartParams(lines = []) {
  const items = lines.map((l) => toGaItem(l));
  const value = items.reduce((n, i) => n + i.price * i.quantity, 0);
  return { currency: CURRENCY, value: Math.round(value * 100) / 100, items };
}

/** Checkout's delivery values as GA shipping tiers. */
export const SHIPPING_TIER = { ship: "ship", pickup: "ship-to-store", mobile: "mobile" };

// Once-per-page-view bookkeeping (view_item, tool_use), keyed by the URL the
// way trackPageView counts page views: a new pathname + search starts afresh.
let seenFor = null;
let seenThisPage = new Set();

/** Calls `send` only the first time `key` is seen during this page view. */
export function oncePerPage(key, send) {
  if (typeof window === "undefined") return;
  const page = window.location.pathname + window.location.search;
  if (page !== seenFor) {
    seenFor = page;
    seenThisPage = new Set();
  }
  if (seenThisPage.has(key)) return;
  seenThisPage.add(key);
  send();
}

export function trackToolUse(toolId) {
  oncePerPage(`tool:${toolId}`, () => trackEvent("tool_use", { tool_id: toolId }));
}

export function trackViewItem(product) {
  if (!product) return;
  oncePerPage(`item:${product.sku ?? product.id}`, () => {
    const item = toGaItem(product, 1);
    trackEvent("view_item", { currency: CURRENCY, value: item.price, items: [item] });
  });
}
