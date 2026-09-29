import { createElement, lazy } from "react";

/**
 * React.lazy for route pages, plus the two things prerendering needs from it.
 *
 * 1. `preload()`: resolves the chunk ahead of rendering. Once a page's module
 *    is loaded, the lazy component hands React a thenable that resolves
 *    synchronously, so React renders it on the first pass instead of
 *    suspending. That is what lets src/main.jsx hydrate a prerendered page in
 *    one pass: if the page suspended mid-hydration, any context update that
 *    landed first (the cart reading localStorage, say) would throw away the
 *    server HTML and log a hydration error.
 *
 * 2. `usedPages()`: which pages the last server render touched. The
 *    prerenderer writes them onto #root (data-pages), and main.jsx preloads
 *    exactly those before hydrating.
 *
 * Not only for routes: use it for any lazily loaded component that renders
 * into prerendered HTML, such as the interactive demos inside /learn and
 * /blog articles. A plain React.lazy there still prerenders, but on the
 * client it may still be loading when hydration reaches it; if the cart or
 * compare list then loads from localStorage first, React throws that part of
 * the server HTML away and logs a hydration error. Through lazyPage it is
 * listed in data-pages and loaded before hydration starts.
 *
 * `key` is the page's path under src/, e.g. "pages/shop/TiresPage.jsx". The
 * prerenderer looks it up in Vite's build manifest to emit modulepreload
 * links, and fails the build if a key names no chunk — so a typo here breaks
 * loudly rather than silently costing a round trip.
 */

const registry = new Map();
let used = new Set();

export function lazyPage(key, load) {
  let mod = null;
  let pending = null;

  const preload = () => {
    if (mod) return Promise.resolve(mod);
    if (!pending) {
      pending = load().then((m) => {
        mod = m;
        return m;
      });
    }
    return pending;
  };

  const Lazy = lazy(() =>
    // A synchronous thenable: React.lazy marks itself resolved before it
    // would otherwise throw, so a preloaded page never suspends.
    mod ? { then: (resolve) => resolve(mod) } : preload(),
  );

  // React.lazy calls its factory once per lifetime, so usage is recorded on
  // every render here instead.
  function Page(props) {
    used.add(key);
    return createElement(Lazy, props);
  }
  Page.displayName = `Page(${key})`;

  registry.set(key, preload);
  return Page;
}

/**
 * Loads the named pages (unknown keys are ignored). Runs in rounds: loading a
 * page can register lazy components of its own (an article's demos), so keys
 * unknown in one round are tried again once that round's modules are in.
 */
export async function preloadPages(keys) {
  const done = new Set();
  for (;;) {
    const next = keys.filter((k) => !done.has(k) && registry.has(k));
    if (!next.length) return;
    next.forEach((k) => done.add(k));
    await Promise.all(next.map((k) => registry.get(k)()));
  }
}

/** Every registered page key. The prerenderer preloads all of them once. */
export function allPageKeys() {
  return [...registry.keys()];
}

/** Starts a fresh record of which pages a render reaches. Server only. */
export function resetUsedPages() {
  used = new Set();
}

export function usedPages() {
  return [...used];
}
