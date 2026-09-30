import React, { useLayoutEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { CompareProvider } from "./context/CompareContext.jsx";
import { watchTyped } from "./lib/keepTyped.js";
import { preloadPages } from "./lib/lazyPage.js";
import "./index.css";

// Production uses clean URLs (vercel.json supplies the SPA rewrite).
// Static preview hosts have no rewrite, so fall back to hash routing there.
const HASH = import.meta.env.VITE_HASH_ROUTER === "true";
const Router = HASH ? HashRouter : BrowserRouter;

const root = document.getElementById("root");

// Whatever the visitor types into the prerendered forms before React takes
// over is recorded from here on, and put back if React replaces the markup
// instead of hydrating it (src/lib/keepTyped.js).
const typed = watchTyped(root);

/** Runs once, in the layout phase of the first commit: after the whole tree
 *  is in the DOM, before the browser paints it. */
function KeepTyped({ children }) {
  useLayoutEffect(() => typed.restore(), []);
  return children;
}

const app = (
  <React.StrictMode>
    <KeepTyped>
      <Router>
        <CartProvider>
          <CompareProvider>
            <App />
          </CompareProvider>
        </CartProvider>
      </Router>
    </KeepTyped>
  </React.StrictMode>
);

/**
 * Every route is prerendered at build time (scripts/prerender.mjs). #root then
 * arrives filled, and carries the path it was rendered for (data-route) and
 * the lazy page chunks that render used (data-pages).
 *
 * Hydrate only when the served HTML is exactly what this URL renders: the same
 * path and no query string that a page reads. A query string changes what
 * several pages show (/tires?size=…, /tire-size?size=…), and so does a file
 * served for a path it was not rendered for (the SPA shell, or a host's
 * fallback). Those render fresh instead, which replaces the prerendered
 * markup when React commits — no hydration mismatch, and no blank frame,
 * because the page chunks are loaded before either path starts. Anything
 * typed into the old markup meanwhile is carried over (KeepTyped above).
 *
 * Campaign and click-id parameters (utm_*, gclid, fbclid and the like) are
 * read by analytics, never by a page, so they do not stop a hydration: a
 * link from an email or an ad hydrates like the bare URL.
 */
const TRACKING = /^(utm_[a-z_]+|gclid|gbraid|wbraid|dclid|fbclid|msclkid|ttclid|twclid|li_fat_id|mc_cid|mc_eid|_gl|_ga|_kx|srsltid)$/i;
const prerendered = root.dataset.route;
const path = window.location.pathname.replace(/(.)\/+$/, "$1");
const pageQuery = [...new URLSearchParams(window.location.search).keys()].filter(
  (k) => !TRACKING.test(k),
);
const canHydrate = !HASH && prerendered === path && pageQuery.length === 0;

const pages = (root.dataset.pages || "").split(",").filter(Boolean);
preloadPages(pages)
  .catch(() => {
    /* a failed chunk surfaces again, visibly, when the route renders */
  })
  .then(() => {
    if (canHydrate) ReactDOM.hydrateRoot(root, app);
    else ReactDOM.createRoot(root).render(app);
  });
