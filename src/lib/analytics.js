// GA4 page views for in-app navigation.
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
