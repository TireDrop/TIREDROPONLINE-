import { getService } from "./services.js";

/**
 * What the phone action bar (components/layout/MobileCallBar.jsx) offers on a
 * given path. A pure function of the pathname, so the prerendered HTML and the
 * hydrating client always agree on it.
 *
 * Returns `null` when the bar stays away, otherwise
 * `{ action: { to, label, icon } | null }`: the lit button, or none when the
 * page only gets a full-width Call button. Call is always there.
 */

/** Product pages own the bottom of a phone screen with their own buy bar. */
export const isProductPath = (pathname) =>
  /^\/(tires|wheels)\/.+/.test(pathname);

const BOOK_INSTALL = "/schedule?service=tire-installation";

export const DEFAULT_ACTION = { to: "/tires", label: "Shop Tires", icon: "cart" };

export function mobileBarFor(pathname = "/") {
  const path = pathname.replace(/\/+$/, "") || "/";

  // One bar on a product page, not two stacked: the page's own price and
  // "Add to cart" bar is the one that takes money.
  if (isProductPath(path)) return null;

  // Paying, or checking on an order already paid for: nothing to sell, and
  // a question is a phone call.
  if (path === "/checkout" || path === "/track") return { action: null };

  // The cart's own Checkout button sits below the line items and the
  // vehicle box, well under the fold on a phone. An empty cart's /checkout
  // says so and offers Shop Tires, so this needs no cart state and the
  // prerendered bar still matches the hydrated one.
  if (path === "/cart") {
    return { action: { to: "/checkout", label: "Checkout", icon: "cart" } };
  }

  // Shoppers already find their size on /tires itself (the finder, the
  // Shopping-for bar), so the bar takes them on to what they picked.
  if (path === "/tires") {
    return { action: { to: "/cart", label: "Cart", icon: "cart" } };
  }

  // The mobile hub and every city page under it book the van.
  if (path === "/mobile-service" || path.startsWith("/mobile-service/")) {
    return { action: { to: BOOK_INSTALL, label: "Book install", icon: "calendar" } };
  }

  const service = path.match(/^\/services\/([^/]+)$/);
  if (service) {
    const found = getService(service[1]);
    if (found) {
      const install = /installation$/.test(found.slug);
      return {
        action: {
          to: `/schedule?service=${found.slug}`,
          label: install ? "Book install" : "Book service",
          icon: "calendar",
        },
      };
    }
  }

  // Learn articles (/learn/<hub>/<slug>) and blog posts.
  if (/^\/learn\/[^/]+\/[^/]+$/.test(path) || /^\/blog\/[^/]+$/.test(path)) {
    return { action: { to: "/tires", label: "Shop tires", icon: "cart" } };
  }

  return { action: DEFAULT_ACTION };
}
