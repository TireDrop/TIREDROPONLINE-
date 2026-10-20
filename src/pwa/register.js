// Registers the service worker (/sw.js, built from src/pwa/sw.js) and wires
// the install and update events into src/pwa/state.js.
//
// When it registers
//   Production builds (import.meta.env.PROD) on a secure origin (https, or
//   localhost). It registers on EVERY host a production build is served
//   from, *.vercel.app previews included, on purpose: a preview has to be
//   testable as the app before it ships. Previews are not a risk to the real
//   site: a worker's scope is its own origin, so a preview's worker and
//   caches never reach tiredroponline.com. Not registered in `vite dev`, nor
//   in the static `--mode preview` build (hash router, relative paths, no
//   root to scope a worker to).
//
// Updates
//   A new worker installs in the background and waits. The page shows the
//   "update ready" toast; only the visitor's tap calls applyUpdate(), which
//   asks the waiting worker to skipWaiting and reloads once it has taken
//   over. Nothing reloads the page on its own.
import { trackEvent } from "../lib/analytics.js";
import { isStandalone } from "../lib/appMode.js";
import { getRegistration, setRegistration, setState } from "./state.js";

const SW_URL = "/sw.js";
const RECHECK_MS = 60 * 60 * 1000;

let updateRequested = false;

/** True when this build and origin can host the worker. */
export function canRegister() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (!import.meta.env.PROD) return false;
  if (import.meta.env.VITE_HASH_ROUTER === "true") return false;
  if (!("serviceWorker" in navigator)) return false;
  return window.isSecureContext === true;
}

function watch(registration) {
  setRegistration(registration);
  const flagIfWaiting = () => {
    // `controller` is null on the very first install: nothing to update.
    if (registration.waiting && navigator.serviceWorker.controller) {
      setState({ updateReady: true });
    }
  };
  flagIfWaiting();
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    if (!worker) return;
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed") flagIfWaiting();
    });
  });
}

/** The visitor said yes: activate the waiting worker, then reload once. */
export function applyUpdate() {
  const waiting = getRegistration()?.waiting;
  if (!waiting) {
    window.location.reload();
    return;
  }
  updateRequested = true;
  waiting.postMessage({ type: "SKIP_WAITING" });
}

export function startPwa() {
  if (typeof window === "undefined") return;

  // beforeinstallprompt can fire before React mounts, so it is caught here
  // and handed over through the store. Capturing it (preventDefault) also
  // hides the browser's own mini bar; InstallPrompt.jsx offers the install.
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    setState({ installEvent: event });
  });
  window.addEventListener("appinstalled", () => {
    setState({ installEvent: null, installed: true });
    trackEvent("app_installed");
  });

  // Once per launch from the home screen.
  try {
    if (isStandalone() && !window.sessionStorage.getItem("tiredrop.launch")) {
      window.sessionStorage.setItem("tiredrop.launch", "1");
      trackEvent("app_launch_standalone");
    }
  } catch {
    /* storage blocked: skip the once-only guard, send nothing */
  }

  if (!canRegister()) return;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (updateRequested) window.location.reload();
  });

  const register = () =>
    navigator.serviceWorker
      .register(SW_URL, { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        watch(registration);
        // An installed app can stay open for days: look for a new version
        // when it comes back to the foreground, at most once an hour.
        let checked = Date.now();
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState !== "visible") return;
          if (Date.now() - checked < RECHECK_MS) return;
          checked = Date.now();
          registration.update().catch(() => {});
        });
      })
      .catch(() => {
        /* a failed registration leaves the site working as it always has */
      });

  // After load, so the worker's precache downloads never compete with the
  // page's own first paint.
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}
