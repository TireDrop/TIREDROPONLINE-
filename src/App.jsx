import React, { Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";
import MobileCallBar from "./components/layout/MobileCallBar.jsx";
import NewsletterGate from "./components/layout/NewsletterGate.jsx";
import CompareTray from "./components/shop/CompareTray.jsx";
import { InPageAnchors, ScrollToTop } from "./components/ui/index.jsx";
import { trackPageView } from "./lib/analytics.js";
import { lazyPage } from "./lib/lazyPage.js";

// Every route except the home page is loaded on demand.
//
// One bundle meant a first-time visitor downloaded all 32 pages to read one:
// the three tool pages alone are ~1,400-1,900 lines each and are not on the
// path to a first paint. Splitting took the cold home-page load from 412 kB to
// 290 kB over the wire, and the JS from 209 kB to 91 kB, with no extra requests
// on the home page. Measurements and method are in docs/technical-audit.md.
//
// HomePage stays a static import on purpose: it is the first paint for most
// visitors, and making it wait on a second round trip would trade the win away
// at exactly the moment it matters.
import HomePage from "./pages/HomePage.jsx";
const ShippingPage = lazyPage("pages/ShippingPage.jsx", () =>
  import("./pages/ShippingPage.jsx"),
);
const InstallPage = lazyPage("pages/InstallPage.jsx", () =>
  import("./pages/InstallPage.jsx"),
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

// Services
const MobileServicePage = lazyPage("pages/services/MobileServicePage.jsx", () =>
  import("./pages/services/MobileServicePage.jsx"),
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
const TireCarePage = lazyPage("pages/support/TireCarePage.jsx", () =>
  import("./pages/support/TireCarePage.jsx"),
);
const GalleryPage = lazyPage("pages/support/GalleryPage.jsx", () =>
  import("./pages/support/GalleryPage.jsx"),
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
const NotFoundPage = lazyPage("pages/NotFoundPage.jsx", () =>
  import("./pages/NotFoundPage.jsx"),
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

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop pathname={pathname} />
      <InPageAnchors />
      <Header />

      <main className="flex-1">
        {/* Holds the viewport open while a route chunk loads, so the
            footer does not jump up and back on first navigation. */}
        <Suspense fallback={<div className="min-h-screen" aria-hidden />}>
          <Routes>
            <Route path="/" element={<HomePage />} />

            {/* The two fulfillment paths: ship anywhere, or ship free to the shop. */}
            <Route path="/shipping" element={<ShippingPage />} />
            <Route path="/install" element={<InstallPage />} />

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
            <Route path="/commercial-tires" element={<CommercialTiresPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />

            {/* There are no deals, coupons or promo codes. The old Deals page
                is gone; anyone arriving on an old link lands on the catalog. */}
            <Route path="/coupons" element={<Navigate to="/tires" replace />} />
            <Route path="/deals" element={<Navigate to="/tires" replace />} />

            {/* Services */}
            <Route path="/mobile-service" element={<MobileServicePage />} />
            <Route path="/auto-service" element={<AutoServicePage />} />
            <Route path="/services/:slug" element={<ServiceDetailPage />} />
            <Route path="/schedule" element={<SchedulePage />} />

            {/* About & support */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/financing" element={<FinancingPage />} />
            <Route path="/tire-care" element={<TireCarePage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/sitemap" element={<SitemapPage />} />

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

      <Footer />

      {/* Sits above the fixed call bar on phones. */}
      {/* Keeps the end of the page clear of whatever is floating over the
          bottom edge: the phone action bar always, the compare tray when it
          has something in it. */}
      <div
        aria-hidden
        className="h-[calc(var(--call-bar-h)+var(--compare-tray-h)+env(safe-area-inset-bottom))] lg:h-[var(--compare-tray-h)]"
      />
      <CompareTray />
      <MobileCallBar />
      {/* Newsletter sign-up, only when /api/status says it can be delivered. */}
      <NewsletterGate />
    </div>
  );
}
