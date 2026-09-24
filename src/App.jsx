import React, { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";
import MobileCallBar from "./components/layout/MobileCallBar.jsx";
import CompareTray from "./components/shop/CompareTray.jsx";
import { ScrollToTop } from "./components/ui/index.jsx";

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
const ShippingPage = lazy(() => import("./pages/ShippingPage.jsx"));
const InstallPage = lazy(() => import("./pages/InstallPage.jsx"));

// Shop
const TiresPage = lazy(() => import("./pages/shop/TiresPage.jsx"));
const WheelsPage = lazy(() => import("./pages/shop/WheelsPage.jsx"));
const ProductPage = lazy(() => import("./pages/shop/ProductPage.jsx"));
const CommercialTiresPage = lazy(
  () => import("./pages/shop/CommercialTiresPage.jsx"),
);
const CartPage = lazy(() => import("./pages/shop/CartPage.jsx"));
const CheckoutPage = lazy(() => import("./pages/shop/CheckoutPage.jsx"));
const CouponsPage = lazy(() => import("./pages/shop/CouponsPage.jsx"));
const ComparePage = lazy(() => import("./pages/shop/ComparePage.jsx"));

// Free tools. They answer the questions that stop someone buying tires
// online — what size, which tire, and do I even need them yet.
const TireSizePage = lazy(() => import("./pages/tools/TireSizePage.jsx"));
const FindMyTiresPage = lazy(() => import("./pages/tools/FindMyTiresPage.jsx"));
const TireCheckPage = lazy(() => import("./pages/tools/TireCheckPage.jsx"));

// Services
const MobileServicePage = lazy(
  () => import("./pages/services/MobileServicePage.jsx"),
);
const AutoServicePage = lazy(
  () => import("./pages/services/AutoServicePage.jsx"),
);
const ServiceDetailPage = lazy(
  () => import("./pages/services/ServiceDetailPage.jsx"),
);
const SchedulePage = lazy(() => import("./pages/services/SchedulePage.jsx"));

// About & Support
const AboutPage = lazy(() => import("./pages/support/AboutPage.jsx"));
const LocationsPage = lazy(() => import("./pages/support/LocationsPage.jsx"));
const ContactPage = lazy(() => import("./pages/support/ContactPage.jsx"));
const ReviewsPage = lazy(() => import("./pages/support/ReviewsPage.jsx"));
const FinancingPage = lazy(() => import("./pages/support/FinancingPage.jsx"));
const TireCarePage = lazy(() => import("./pages/support/TireCarePage.jsx"));
const GalleryPage = lazy(() => import("./pages/support/GalleryPage.jsx"));
const SitemapPage = lazy(() => import("./pages/support/SitemapPage.jsx"));
const LegalPage = lazy(() => import("./pages/support/LegalPage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));

export default function App() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop pathname={pathname} />
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
            <Route path="/coupons" element={<CouponsPage />} />

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

            {/* Legal — one component, three documents */}
            <Route path="/terms" element={<LegalPage doc="terms" />} />
            <Route path="/privacy" element={<LegalPage doc="privacy" />} />
            <Route
              path="/accessibility"
              element={<LegalPage doc="accessibility" />}
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
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
    </div>
  );
}
