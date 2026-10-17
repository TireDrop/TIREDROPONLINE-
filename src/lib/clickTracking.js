// Link clicks that need a GA4 event without every link carrying a handler:
// one listener on the document, installed once by analytics.js.
//
//   tel: link                          phone_click       placement
//   /install, /schedule, /mobile-service
//   link inside a home page section    install_cta_click placement, install_type
//
// `placement` is where the link sits, read from the markup around it, so the
// Header, MobileCallBar, Footer and HomePage need no tracking code:
//
//   header        inside <header> (utility bar, masthead, phone menu)
//   footer        inside <footer>
//   mobile_bar    the fixed phone action bar (nav "Quick actions" / "Acciones rápidas")
//   home_<id>     inside a home page section, from its data-home-section
//                 (home_hero, home_trust, home_shop, home_install, home_cta, ...)
//   dialog        inside a modal dialog (the chat panel)
//   page          anywhere else
//
// Nothing the visitor typed and no part of the href is sent: not the phone
// number, not the URL. Only the placement and, for install links, which of
// the three destinations it was.
//
// A plain click listener (capture phase, so a handler that stops
// propagation cannot hide the click) that never calls preventDefault, so
// navigation and the tel: dial are untouched. Middle clicks are not clicks
// to the browser's `click` event and are not counted.

const MOBILE_BAR = 'nav[aria-label="Quick actions"], nav[aria-label="Acciones rápidas"]';
const INSTALL_TYPES = { "/install": "shop", "/mobile-service": "mobile", "/schedule": "schedule" };

/** Where on the page `el` sits (see the list above). */
export function placementFor(el) {
  if (!el?.closest) return "page";
  if (el.closest("footer")) return "footer";
  if (el.closest("header")) return "header";
  if (el.closest(MOBILE_BAR)) return "mobile_bar";
  const section = el.closest("[data-home-section]")?.getAttribute("data-home-section");
  if (section) return `home_${section}`;
  if (el.closest('[role="dialog"]')) return "dialog";
  return "page";
}

/**
 * The GA event for a click on the link `a` (an element with an href), as
 * `{ name, params }`, or null when the link is not one we count. `origin` is
 * the site's origin, so only links on this site are install links.
 */
export function eventForLink(a, origin = "http://localhost") {
  const href = a?.getAttribute?.("href");
  if (!href) return null;
  if (/^tel:/i.test(href.trim())) {
    return { name: "phone_click", params: { placement: placementFor(a) } };
  }
  let url;
  try {
    url = new URL(href, origin);
  } catch {
    return null;
  }
  if (url.origin !== origin) return null;
  const type = INSTALL_TYPES[url.pathname.replace(/\/+$/, "") || "/"];
  const placement = placementFor(a);
  // Only the home page sections: elsewhere the page's own path says it.
  if (type && placement.startsWith("home_")) {
    return { name: "install_cta_click", params: { placement, install_type: type } };
  }
  return null;
}

let installed = false;

/** Adds the document listener once. `send(name, params)` is trackEvent. */
export function installClickTracking(send) {
  if (installed || typeof document === "undefined") return;
  installed = true;
  document.addEventListener(
    "click",
    (event) => {
      try {
        const a = event.target?.closest?.("a[href]");
        if (!a) return;
        const hit = eventForLink(a, window.location.origin);
        if (hit) send(hit.name, hit.params);
      } catch {
        /* analytics must never break the page */
      }
    },
    true,
  );
}
