import React, { Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";
import MobileCallBar from "./components/layout/MobileCallBar.jsx";
import CompareTray from "./components/shop/CompareTray.jsx";
import { InPageAnchors, ScrollToTop } from "./components/ui/index.jsx";
import { trackPageView } from "./lib/analytics.js";
import { lazyPage } from "./lib/lazyPage.js";
import { isProductPath } from "./data/mobileBar.js";

// Every route except the home page is loaded on demand.
//
// One bundle meant a first-time visitor downloaded all 32 pages to read one:
// the three tool pages alone are ~1,400-1,900 lines each and are not on the
// path to a first paint. Splitting took the cold home-page load from 412 kB to
// 290 kB over the wire, and the JS from 209 kB to 91 kB, with no extra requests
// on the home page. Measurements and method are in docs/audits/2026-09-24-technical-audit.md.
//
// The home page is split out too. It used to stay in the main bundle so its
// first paint would not wait on a second round trip, but every prerendered
// page now lists its chunks as <link rel="modulepreload"> in the head
// (scripts/prerender.mjs), so the home page's chunk downloads alongside the
// main bundle instead of after it. Splitting it keeps the home page's own
// code and data (the vehicle and size search, the featured tires, the tool
// list) out of every other page's download.
const ScrollStoryPage = lazyPage("pages/ScrollStoryPage.jsx", () =>
  import("./pages/ScrollStoryPage.jsx"),
);
const HomePage = lazyPage("pages/HomePage.jsx", () =>
  import("./pages/HomePage.jsx"),
);
const ShippingPage = lazyPage("pages/ShippingPage.jsx", () =>
  import("./pages/ShippingPage.jsx"),
);
const InstallPage = lazyPage("pages/InstallPage.jsx", () =>
  import("./pages/InstallPage.jsx"),
);
// Nationwide shipping hub, and one page per state in STATE_PAGES_LIVE
// (src/data/stateList.js; facts and copy in src/data/statePages.js).
const NationwideShippingPage = lazyPage(
  "pages/shipping/NationwideShippingPage.jsx",
  () => import("./pages/shipping/NationwideShippingPage.jsx"),
);
const StateShippingPage = lazyPage(
  "pages/shipping/StateShippingPage.jsx",
  () => import("./pages/shipping/StateShippingPage.jsx"),
);
// Local delivery zones around the distribution partner's hubs (rolling out).
const LocalDeliveryPage = lazyPage(
  "pages/shipping/LocalDeliveryPage.jsx",
  () => import("./pages/shipping/LocalDeliveryPage.jsx"),
);

// Shop
const TiresPage = lazyPage("pages/shop/TiresPage.jsx", () =>
  import("./pages/shop/TiresPage.jsx"),
);
const WheelsPage = lazyPage("pages/shop/WheelsPage.jsx", () =>
  import("./pages/shop/WheelsPage.jsx"),
);
const ProductPage = lazyPage("pages/shop/ProductPage.jsx", () =>
  import("./pages/shop/ProductPage.jsx"),
);
const TireSkuPage = lazyPage("pages/shop/TireSkuPage.jsx", () =>
  import("./pages/shop/TireSkuPage.jsx"),
);
const CommercialTiresPage = lazyPage("pages/shop/CommercialTiresPage.jsx", () =>
  import("./pages/shop/CommercialTiresPage.jsx"),
);
const CartPage = lazyPage("pages/shop/CartPage.jsx", () =>
  import("./pages/shop/CartPage.jsx"),
);
const CheckoutPage = lazyPage("pages/shop/CheckoutPage.jsx", () =>
  import("./pages/shop/CheckoutPage.jsx"),
);
const ComparePage = lazyPage("pages/shop/ComparePage.jsx", () =>
  import("./pages/shop/ComparePage.jsx"),
);

// Free tools. They answer the questions that stop someone buying tires
// online — what size, which tire, and do I even need them yet.
const TireSizePage = lazyPage("pages/tools/TireSizePage.jsx", () =>
  import("./pages/tools/TireSizePage.jsx"),
);
const FindMyTiresPage = lazyPage("pages/tools/FindMyTiresPage.jsx", () =>
  import("./pages/tools/FindMyTiresPage.jsx"),
);
const TireCheckPage = lazyPage("pages/tools/TireCheckPage.jsx", () =>
  import("./pages/tools/TireCheckPage.jsx"),
);
// Photo of the door sticker, sidewall or VIN -> the exact size (api/scan-tire-size.js).
const TireSizeFinderPage = lazyPage("pages/tools/TireSizeFinderPage.jsx", () =>
  import("./pages/tools/TireSizeFinderPage.jsx"),
);
// The Learn demos that also stand alone as tools: one template, one route
// each (copy in src/components/demos/toolPages.js).
const DemoToolPage = lazyPage("pages/tools/DemoToolPage.jsx", () =>
  import("./pages/tools/DemoToolPage.jsx"),
);
// /tools/<tool> -> the tool's own path (in-app links; vercel.json 301s them).
const ToolRedirect = lazyPage("pages/tools/ToolRedirect.jsx", () =>
  import("./pages/tools/ToolRedirect.jsx"),
);

// Services
const MobileServicePage = lazyPage("pages/services/MobileServicePage.jsx", () =>
  import("./pages/services/MobileServicePage.jsx"),
);
// One page per city the vans cover, under the hub (src/data/cityPages.js).
const MobileCityPage = lazyPage("pages/services/MobileCityPage.jsx", () =>
  import("./pages/services/MobileCityPage.jsx"),
);
// The Spanish test pages (/es/instalacion-movil and Hialeah): noindex until a
// native speaker approves the copy (src/data/spanishRoutes.js).
const SpanishMobilePage = lazyPage("pages/services/SpanishMobilePage.jsx", () =>
  import("./pages/services/SpanishMobilePage.jsx"),
);
const AutoServicePage = lazyPage("pages/services/AutoServicePage.jsx", () =>
  import("./pages/services/AutoServicePage.jsx"),
);
const ServiceDetailPage = lazyPage("pages/services/ServiceDetailPage.jsx", () =>
  import("./pages/services/ServiceDetailPage.jsx"),
);
const SchedulePage = lazyPage("pages/services/SchedulePage.jsx", () =>
  import("./pages/services/SchedulePage.jsx"),
);

// About & Support
const AboutPage = lazyPage("pages/support/AboutPage.jsx", () =>
  import("./pages/support/AboutPage.jsx"),
);
const LocationsPage = lazyPage("pages/support/LocationsPage.jsx", () =>
  import("./pages/support/LocationsPage.jsx"),
);
const ContactPage = lazyPage("pages/support/ContactPage.jsx", () =>
  import("./pages/support/ContactPage.jsx"),
);
const ReviewsPage = lazyPage("pages/support/ReviewsPage.jsx", () =>
  import("./pages/support/ReviewsPage.jsx"),
);
const FinancingPage = lazyPage("pages/support/FinancingPage.jsx", () =>
  import("./pages/support/FinancingPage.jsx"),
);
const TrackOrderPage = lazyPage("pages/support/TrackOrderPage.jsx", () =>
  import("./pages/support/TrackOrderPage.jsx"),
);
const SitemapPage = lazyPage("pages/support/SitemapPage.jsx", () =>
  import("./pages/support/SitemapPage.jsx"),
);
const LegalPage = lazyPage("pages/support/LegalPage.jsx", () =>
  import("./pages/support/LegalPage.jsx"),
);
// Store-wide search results: the header search's "See all results".
const SearchPage = lazyPage("pages/SearchPage.jsx", () =>
  import("./pages/SearchPage.jsx"),
);
const NotFoundPage = lazyPage("pages/NotFoundPage.jsx", () =>
  import("./pages/NotFoundPage.jsx"),
);

// Learn guides and the blog, both built from Markdown in src/content
// (see src/content/index.js). One article template serves both.
const LearnIndexPage = lazyPage(
  "pages/learn/LearnIndexPage.jsx",
  () => import("./pages/learn/LearnIndexPage.jsx"),
);
const LearnHubPage = lazyPage(
  "pages/learn/LearnHubPage.jsx",
  () => import("./pages/learn/LearnHubPage.jsx"),
);
const ArticlePage = lazyPage(
  "pages/learn/ArticlePage.jsx",
  () => import("./pages/learn/ArticlePage.jsx"),
);
const BlogIndexPage = lazyPage(
  "pages/blog/BlogIndexPage.jsx",
  () => import("./pages/blog/BlogIndexPage.jsx"),
);

/**
 * Sends the GA4 page_view for each route change (src/lib/analytics.js).
 * Rendered inside the routes' Suspense boundary, after <Routes>, so its
 * effect runs only once the new page is on screen and its Seo component has
 * set document.title.
 */
function PageViewTracker() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    trackPageView(pathname + search, pathname);
  }, [pathname, search]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  // A product page has no phone action bar (MobileCallBar): its own buy bar
  // drops to the bottom edge, which it finds through --call-bar-h.
  const productPage = isProductPath(pathname);
  // The scroll story concept is a full-screen experience: no site chrome.
  const bare = pathname === "/scroll-story";

  return (
    <div
      className="flex min-h-screen flex-col"
      style={productPage ? { "--call-bar-h": "0px" } : undefined}
    >
      {/* First thing a keyboard reaches; out of sight until it is focused.
          Moves focus itself rather than leaving it to the hash, which the
          HashRouter preview build would read as a route. */}
      <a
        href="#main"
        onClick={(event) => {
          const main = document.getElementById("main");
          if (!main) return;
          event.preventDefault();
          main.focus();
        }}
        className="sr-only z-[60] rounded-sm bg-ink px-4 py-3 font-semibold text-bone focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to main content
      </a>
      <ScrollToTop pathname={pathname} />
      <InPageAnchors />
      {/* `contents` keeps the masthead's sticky row sticky against the page,
          not against this wrapper. */}
      {!bare && (
        <header className="contents">
          <Header />
        </header>
      )}

      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {/* Holds the viewport open while a route chunk loads, so the
            footer does not jump up and back on first navigation. */}
        <Suspense fallback={<div className="min-h-screen" aria-hidden />}>
          <Routes>
            <Route path="/" element={<HomePage />} />

            {/* The two fulfillment paths: ship anywhere, or ship free to the shop. */}
            <Route path="/shipping" element={<ShippingPage />} />
            <Route path="/install" element={<InstallPage />} />
            <Route path="/tires-shipped" element={<NationwideShippingPage />} />
            <Route
              path="/tires-shipped/:state"
              element={<StateShippingPage />}
            />
            <Route path="/local-delivery" element={<LocalDeliveryPage />} />
            <Route path="/scroll-story" element={<ScrollStoryPage />} />

            {/* Tires & wheels e-commerce */}
            <Route path="/tires" element={<TiresPage />} />
            <Route path="/tires/:slug" element={<ProductPage kind="tire" />} />
            {/* Tires looked up by sku — live distributor tires the catalog
                does not list. Three segments, so it never matches :slug. */}
            <Route path="/tires/p/:sku" element={<TireSkuPage />} />
            <Route path="/wheels" element={<WheelsPage />} />
            <Route
              path="/wheels/:slug"
              element={<ProductPage kind="wheel" />}
            />
            <Route path="/compare" element={<ComparePage />} />

            <Route path="/tire-size" element={<TireSizePage />} />
            <Route path="/find-my-tires" element={<FindMyTiresPage />} />
            <Route path="/tire-check" element={<TireCheckPage />} />
            <Route
              path="/tire-size-finder"
              element={<TireSizeFinderPage />}
            />
            <Route
              path="/load-speed-check"
              element={<DemoToolPage tool="load-speed-check" />}
            />
            <Route
              path="/plus-size-calculator"
              element={<DemoToolPage tool="plus-size-speedo" />}
            />
            <Route
              path="/tire-pressure-temperature"
              element={<DemoToolPage tool="pressure-temp" />}
            />
            <Route
              path="/can-my-tire-be-repaired"
              element={<DemoToolPage tool="damage-map" />}
            />
            <Route
              path="/car-shaking-checker"
              element={<DemoToolPage tool="noise-vibration" />}
            />
            <Route
              path="/tire-rotation-pattern"
              element={<DemoToolPage tool="rotation-pattern" />}
            />
            <Route
              path="/wheel-offset-calculator"
              element={<DemoToolPage tool="wheel-offset" />}
            />
            <Route path="/tools/:tool" element={<ToolRedirect />} />
            <Route path="/commercial-tires" element={<CommercialTiresPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />

            {/* There are no deals, coupons or promo codes. The old Deals page
                is gone; anyone arriving on an old link lands on the catalog. */}
            <Route path="/coupons" element={<Navigate to="/tires" replace />} />
            <Route path="/deals" element={<Navigate to="/tires" replace />} />

            {/* Services */}
            <Route path="/mobile-service" element={<MobileServicePage />} />
            <Route
              path="/mobile-service/:city"
              element={<MobileCityPage />}
            />
            <Route
              path="/es/instalacion-movil"
              element={<SpanishMobilePage kind="hub" />}
            />
            <Route
              path="/es/instalacion-movil/:city"
              element={<SpanishMobilePage kind="city" />}
            />
            <Route path="/auto-service" element={<AutoServicePage />} />
            <Route path="/services/:slug" element={<ServiceDetailPage />} />
            <Route path="/schedule" element={<SchedulePage />} />

            {/* About & support */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/financing" element={<FinancingPage />} />
            {/* The old tire care page became the Learn hub (301 in vercel.json). */}
            <Route
              path="/tire-care"
              element={<Navigate to="/learn" replace />}
            />
            <Route path="/sitemap" element={<SitemapPage />} />
            {/* Search results (noindex, not in the sitemap). */}
            <Route path="/search" element={<SearchPage />} />

            {/* Learn guides and blog */}
            <Route path="/learn" element={<LearnIndexPage />} />
            <Route path="/learn/:hub" element={<LearnHubPage />} />
            <Route
              path="/learn/:hub/:slug"
              element={<ArticlePage section="learn" />}
            />
            <Route path="/blog" element={<BlogIndexPage />} />
            <Route
              path="/blog/:slug"
              element={<ArticlePage section="blog" />}
            />

            {/* Order status. Full order history stays on Shopify
                (shop.tiredroponline.com/account). */}
            <Route path="/track" element={<TrackOrderPage />} />
            <Route
              path="/track-order"
              element={<Navigate to="/track" replace />}
            />

            {/* Legal — one component, three documents */}
            <Route path="/terms" element={<LegalPage doc="terms" />} />
            <Route path="/privacy" element={<LegalPage doc="privacy" />} />
            <Route
              path="/accessibility"
              element={<LegalPage doc="accessibility" />}
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <PageViewTracker />
        </Suspense>
      </main>

      {!bare && <Footer />}

      {!bare && (
        <>
          {/* Keeps the end of the page clear of whatever is floating over the
              bottom edge: the phone action bar (or, on a product page, its buy
              bar, about as tall), the compare tray when it has something in it. */}
          <div
            aria-hidden
            className={
              productPage
                ? "h-[calc(4.5rem+env(safe-area-inset-bottom))] lg:h-0"
                : "h-[calc(var(--call-bar-h)+var(--compare-tray-h)+env(safe-area-inset-bottom))] lg:h-[var(--compare-tray-h)]"
            }
          />
          <CompareTray />
          <MobileCallBar />
        </>
      )}
    </div>
  );
}
