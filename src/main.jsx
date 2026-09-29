import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { CompareProvider } from "./context/CompareContext.jsx";
import { preloadPages } from "./lib/lazyPage.js";
import "./index.css";

// Production uses clean URLs (vercel.json supplies the SPA rewrite).
// Static preview hosts have no rewrite, so fall back to hash routing there.
const HASH = import.meta.env.VITE_HASH_ROUTER === "true";
const Router = HASH ? HashRouter : BrowserRouter;

const app = (
  <React.StrictMode>
    <Router>
      <CartProvider>
        <CompareProvider>
          <App />
        </CompareProvider>
      </CartProvider>
    </Router>
  </React.StrictMode>
);

/**
 * Every route is prerendered at build time (scripts/prerender.mjs). #root then
 * arrives filled, and carries the path it was rendered for (data-route) and
 * the lazy page chunks that render used (data-pages).
 *
 * Hydrate only when the served HTML is exactly what this URL renders: the same
 * path and no query string. A query string changes what several pages show
 * (/tires?size=…, /tire-size?size=…), and so does a file served for a path it
 * was not rendered for (the SPA shell, or a host's fallback). Those render
 * fresh instead, which replaces the prerendered markup when React commits —
 * no hydration mismatch, and no blank frame, because the page chunks are
 * loaded before either path starts.
 */
const root = document.getElementById("root");
const prerendered = root.dataset.route;
const path = window.location.pathname.replace(/(.)\/+$/, "$1");
const canHydrate =
  !HASH && prerendered === path && window.location.search === "";

const pages = (root.dataset.pages || "").split(",").filter(Boolean);
preloadPages(pages)
  .catch(() => {
    /* a failed chunk surfaces again, visibly, when the route renders */
  })
  .then(() => {
    if (canHydrate) ReactDOM.hydrateRoot(root, app);
    else ReactDOM.createRoot(root).render(app);
  });
