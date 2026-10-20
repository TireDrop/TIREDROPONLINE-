import { useSyncExternalStore } from "react";

/**
 * App mode: the site launched from the home screen (an installed web app)
 * rather than opened in a browser tab.
 *
 *   isStandalone()       true when display-mode is standalone, or iOS's
 *                        navigator.standalone is set. Always false while
 *                        prerendering (no window), so the built HTML is the
 *                        plain website.
 *   useStandalone()      the same as a hook: false on the server and on the
 *                        first (hydrating) render, then the real value, so
 *                        hydration never mismatches.
 *   syncAppModeAttribute() sets data-app="standalone" on <html>. main.jsx calls it before React
 *                        renders, so the app-mode CSS in index.css applies
 *                        from the first paint. Every standalone-only style
 *                        hangs off that attribute; the normal website has no
 *                        such attribute and is untouched.
 */

const QUERY = "(display-mode: standalone)";

function mediaList() {
  try {
    return typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(QUERY)
      : null;
  } catch {
    return null;
  }
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  try {
    if (window.navigator && window.navigator.standalone === true) return true;
  } catch {
    /* ignore */
  }
  const mql = mediaList();
  if (mql && mql.matches) return true;
  // The attribute main.jsx set (or a test set) counts too, so the hook and
  // the CSS can never disagree.
  return (
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-app") === "standalone"
  );
}

/**
 * Lets the app draw under the notch and home indicator (viewport-fit=cover) so
 * env(safe-area-inset-*) carries real values. Standalone only: the browser
 * site keeps the viewport tag index.html ships.
 */
function coverViewport() {
  try {
    const meta = document.querySelector('meta[name="viewport"]');
    const content = meta && meta.getAttribute("content");
    if (content && !/viewport-fit\s*=/.test(content)) {
      meta.setAttribute("content", `${content}, viewport-fit=cover`);
    }
  } catch {
    /* a missing viewport tag only costs the inset values */
  }
}

/** Sets <html data-app="standalone"> when running as an app. Returns the
 *  value. It only ever adds the attribute: a page that already carries it
 *  (a test, or an earlier call) keeps it for the life of the page. */
export function syncAppModeAttribute() {
  if (typeof document === "undefined") return false;
  const on = isStandalone();
  if (on) {
    document.documentElement.setAttribute("data-app", "standalone");
    coverViewport();
  }
  return on;
}

/** Follows the display-mode query (installing from the browser flips it). */
function subscribe(onChange) {
  const mql = mediaList();
  if (!mql) return () => {};
  const handler = () => {
    syncAppModeAttribute();
    onChange();
  };
  if (mql.addEventListener) mql.addEventListener("change", handler);
  else if (mql.addListener) mql.addListener(handler);
  return () => {
    if (mql.removeEventListener) mql.removeEventListener("change", handler);
    else if (mql.removeListener) mql.removeListener(handler);
  };
}

export function useStandalone() {
  return useSyncExternalStore(subscribe, isStandalone, () => false);
}
