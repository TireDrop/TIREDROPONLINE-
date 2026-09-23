import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";
import MobileCallBar from "./components/layout/MobileCallBar.jsx";
import CompareTray from "./components/shop/CompareTray.jsx";
import { ScrollToTop } from "./components/ui/index.jsx";

import HomePage from "./pages/HomePage.jsx";
import ShippingPage from "./pages/ShippingPage.jsx";
import InstallPage from "./pages/InstallPage.jsx";

// Shop
import TiresPage from "./pages/shop/TiresPage.jsx";
import WheelsPage from "./pages/shop/WheelsPage.jsx";
import ProductPage from "./pages/shop/ProductPage.jsx";
import CommercialTiresPage from "./pages/shop/CommercialTiresPage.jsx";
import CartPage from "./pages/shop/CartPage.jsx";
import CheckoutPage from "./pages/shop/CheckoutPage.jsx";
import CouponsPage from "./pages/shop/CouponsPage.jsx";
import ComparePage from "./pages/shop/ComparePage.jsx";

// Services
import MobileServicePage from "./pages/services/MobileServicePage.jsx";
import AutoServicePage from "./pages/services/AutoServicePage.jsx";
import ServiceDetailPage from "./pages/services/ServiceDetailPage.jsx";
import SchedulePage from "./pages/services/SchedulePage.jsx";

// About & Support
import AboutPage from "./pages/support/AboutPage.jsx";
import LocationsPage from "./pages/support/LocationsPage.jsx";
import ContactPage from "./pages/support/ContactPage.jsx";
import ReviewsPage from "./pages/support/ReviewsPage.jsx";
import FinancingPage from "./pages/support/FinancingPage.jsx";
import TireCarePage from "./pages/support/TireCarePage.jsx";
import GalleryPage from "./pages/support/GalleryPage.jsx";
import SitemapPage from "./pages/support/SitemapPage.jsx";
import LegalPage from "./pages/support/LegalPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

export default function App() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop pathname={pathname} />
      <Header />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* The two fulfillment paths: ship anywhere, or ship free to the shop. */}
          <Route path="/shipping" element={<ShippingPage />} />
          <Route path="/install" element={<InstallPage />} />

          {/* Tires & wheels e-commerce */}
          <Route path="/tires" element={<TiresPage />} />
          <Route path="/tires/:slug" element={<ProductPage kind="tire" />} />
          <Route path="/wheels" element={<WheelsPage />} />
          <Route path="/wheels/:slug" element={<ProductPage kind="wheel" />} />
          <Route path="/compare" element={<ComparePage />} />
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
