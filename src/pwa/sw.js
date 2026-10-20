/* TireDrop service worker. Hand written, no libraries.
 *
 * This file is a template: the build (scripts/pwa-sw-plugin.mjs, wired into
 * vite.config.js) replaces the two placeholders below and emits it as
 * /sw.js. Nothing here runs in the app bundle.
 *
 * What it does
 *   - install     precaches the app shell: the offline page, the entry
 *                 script and stylesheet (hashed file names), the fonts and
 *                 the app icon. Does NOT skip waiting, so an updated worker
 *                 sits "waiting" until the visitor taps Update in the toast
 *                 (src/pwa/UpdateToast.jsx), which sends SKIP_WAITING.
 *   - activate    deletes every older "td-" cache, then takes control.
 *   - navigations network first. If the network fails, the visitor gets
 *                 /offline (public/offline.html). Pages are NOT stored, so
 *                 nothing a visitor saw is ever replayed from the cache.
 *   - /assets/*   hashed build output (scripts, styles, fonts, images):
 *                 cache first, because a hashed file never changes. Capped.
 *   - images and fonts from our own origin elsewhere (/brand/...):
 *                 stale while revalidate. Capped in count and in file size.
 *
 * What it never does
 *   - Touch /api/*, /checkout, /cart, /track, /track-order or /schedule. A
 *     request to /api (or any non-GET) is not intercepted at all. A page
 *     navigation to the others is passed to the network and only falls back
 *     to the offline page if that fails; the response is never cached.
 *   - Cache or intercept anything cross-origin (the distributor's images,
 *     Google, Shopify). Those go straight to the network.
 *   - Cache a response that is not a plain 200 (no errors, no redirects, no
 *     opaque responses), or one over the size cap.
 */

const VERSION = "__SW_VERSION__";
const PRECACHE = ["__SW_PRECACHE__"];

const SHELL_CACHE = `td-shell-${VERSION}`;
const ASSET_CACHE = "td-assets-v1";
const IMAGE_CACHE = "td-images-v1";
const KEEP = new Set([SHELL_CACHE, ASSET_CACHE, IMAGE_CACHE]);

const OFFLINE_URL = "/offline";
const MAX_ASSETS = 120;
const MAX_IMAGES = 80;
const MAX_BYTES = 1.5 * 1024 * 1024;

// Paths the worker must never serve from, or write to, a cache.
const NEVER = /^\/(api|checkout|cart|track|track-order|schedule)(\/|$)/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // `reload` skips the HTTP cache so the shell is exactly this deploy.
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: "reload" })))),
  );
  // No skipWaiting() here, on purpose: see the SKIP_WAITING message below.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((n) => n.startsWith("td-") && !KEEP.has(n)).map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// The only way a waiting worker takes over: the page asks, after the visitor
// said yes to the "update ready" toast.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

/** Keeps the newest `max` entries of a cache (insertion order). */
async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => cache.delete(k)));
}

/** A response worth keeping: 200, same origin, not a redirect, under the cap. */
function storable(response) {
  if (!response || response.status !== 200 || response.type !== "basic" || response.redirected) {
    return false;
  }
  const length = Number(response.headers.get("content-length"));
  return !(length > MAX_BYTES);
}

async function offlinePage() {
  const cached = await caches.match(OFFLINE_URL);
  return (
    cached ||
    new Response("You are offline. Call (954) 773-1896.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  );
}

async function cacheFirst(request, cacheName, max) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (storable(response)) {
    const copy = response.clone();
    const cache = await caches.open(cacheName);
    await cache.put(request, copy);
    await trim(cacheName, max);
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const refresh = fetch(request)
    .then(async (response) => {
      if (storable(response)) {
        await cache.put(request, response.clone());
        await trim(cacheName, max);
      }
      return response;
    })
    .catch(() => null);
  if (hit) return hit;
  return (await refresh) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.headers.has("range")) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/sw.js") return;

  if (request.mode === "navigate") {
    // Same behaviour for the sensitive pages and the rest: the network
    // decides, the offline page is the only fallback, nothing is stored.
    event.respondWith(fetch(request).catch(offlinePage));
    return;
  }

  if (NEVER.test(url.pathname)) return;

  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request, ASSET_CACHE, MAX_ASSETS));
    return;
  }

  if (request.destination === "image" || request.destination === "font") {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE, MAX_IMAGES));
  }
});
