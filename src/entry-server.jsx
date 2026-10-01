/**
 * Server entry for build-time prerendering (scripts/prerender.mjs).
 *
 * Renders one URL of the real app, the same tree src/main.jsx hydrates, to an
 * HTML string, and reports what the Seo component asked the head to say and
 * which lazy pages the render used. Never shipped to the browser.
 */
import React from "react";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { Writable } from "node:stream";

import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { CompareProvider } from "./context/CompareContext.jsx";
import { VehicleProvider } from "./context/VehicleContext.jsx";
import { HeadCollectorContext } from "./components/ui/index.jsx";
import {
  allPageKeys,
  preloadPages,
  resetUsedPages,
  usedPages,
} from "./lib/lazyPage.js";

export { allPageKeys };

/* ------------------------------------------------------------------ *
 * CONTENT ROUTES HOOK (/learn, /blog)
 *
 * The content system lives in src/content/index.js and exports:
 *   contentRoutes()      every public content path ("/learn",
 *                        "/learn/<hub>/<slug>", "/blog/<slug>", …), drafts
 *                        excluded. Strings or { path } objects.
 *   contentLastmod(path) that page's last real content change
 *                        ("YYYY-MM-DD" or a Date), or null.
 * Every path it lists is prerendered and put in the sitemap with that
 * lastmod, with no change needed here or in scripts/.
 *
 * It is read through import.meta.glob because articles are loaded with
 * import.meta.glob, which only works inside a Vite build; plain Node cannot
 * import that module. A glob with no match is simply empty, so this builds
 * the same whether or not src/content/ exists yet.
 * ------------------------------------------------------------------ */
const content =
  import.meta.glob("./content/index.js", { eager: true })[
    "./content/index.js"
  ] ?? null;

function isoDay(value) {
  if (!value) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  const m = /^\d{4}-\d{2}-\d{2}/.exec(String(value));
  return m ? m[0] : null;
}

/** Content routes as `[{ path, lastmod }]`; empty without src/content/. */
export function contentRoutes() {
  if (!content?.contentRoutes) return [];
  return content.contentRoutes().map((entry) => {
    const path = typeof entry === "string" ? entry : entry.path;
    const lastmod = content.contentLastmod
      ? isoDay(content.contentLastmod(path))
      : isoDay(entry?.lastmod ?? entry?.updated);
    return { path, lastmod };
  });
}

/**
 * Loads every page chunk once, so no render has to wait on one. Repeats until
 * nothing new registers: pages register lazy components of their own (the
 * article demos) only once they are loaded.
 */
export async function preloadAll() {
  let seen = -1;
  while (allPageKeys().length !== seen) {
    seen = allPageKeys().length;
    await preloadPages(allPageKeys());
  }
}

/**
 * Resolves to `{ html, head, pages }`. Waits for every Suspense boundary
 * (onAllReady), so the HTML is the finished page rather than a fallback, and
 * rejects on any render error — a page that throws on the server must fail
 * the build, not ship half-rendered.
 */
export function render(url) {
  let head = null;
  const collector = {
    set(value) {
      head = value;
    },
  };
  resetUsedPages();

  return new Promise((resolve, reject) => {
    let html = "";
    const sink = new Writable({
      write(chunk, _enc, done) {
        html += chunk.toString();
        done();
      },
    });
    sink.on("finish", () => resolve({ html, head, pages: usedPages() }));

    const stream = renderToPipeableStream(
      <React.StrictMode>
        <StaticRouter location={url}>
          <HeadCollectorContext.Provider value={collector}>
            <CartProvider>
              <CompareProvider>
                <VehicleProvider>
                  <App />
                </VehicleProvider>
              </CompareProvider>
            </CartProvider>
          </HeadCollectorContext.Provider>
        </StaticRouter>
      </React.StrictMode>,
      {
        onAllReady() {
          stream.pipe(sink);
        },
        onShellError: reject,
        onError(error) {
          reject(error);
        },
      },
    );
  });
}
