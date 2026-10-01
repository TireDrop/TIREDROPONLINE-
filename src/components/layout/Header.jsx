import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ChevronDown,
  MapPin,
  Menu,
  Package,
  Phone,
  ShoppingCart,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { BUSINESS, NAV } from "../../data/business.js";
import { useCart } from "../../context/CartContext.jsx";
import HeaderSearch from "./HeaderSearch.jsx";
import Logo from "./Logo.jsx";
import { LanguageControl, TranslationNotice } from "./LanguageControl.jsx";

/** Thin utility strip above the masthead: phone, address, mobile-service pitch. */
function UtilityBar() {
  return (
    <div className="bg-ink bg-steel-wash text-bone">
      <div className="wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2 text-xs">
        {/* Calling is the primary action on a phone — keep it comfortably tappable. */}
        <a
          href={BUSINESS.phoneHref}
          translate="no"
          className="notranslate -my-1 flex min-h-[32px] items-center gap-1.5 py-1 font-display text-sm font-bold tracking-[-0.005em] transition-colors hover:text-amber"
        >
          <Phone size={13} aria-hidden />
          {BUSINESS.phone}
        </a>

        <span className="hidden items-center gap-1.5 text-bone/70 sm:flex">
          <MapPin size={13} aria-hidden />
          Shipping across {BUSINESS.shipping.area}
        </span>

        <span className="flex items-center gap-1.5 text-amber">
          <Truck size={13} aria-hidden />
          <span className="font-display font-bold tracking-[-0.005em]">
            Free ship-to-store &amp; install in South Florida
          </span>
        </span>
      </div>
    </div>
  );
}

function DesktopNav() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <nav aria-label="Main" className="hidden lg:block">
      <ul className="flex items-stretch">
        {NAV.map((item, i) => {
          const hasMenu = Boolean(item.children);
          return (
            <li
              key={item.label}
              className="relative"
              onMouseEnter={() => hasMenu && setOpenIdx(i)}
              onMouseLeave={() => hasMenu && setOpenIdx(null)}
            >
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `relative flex h-full items-center gap-1 whitespace-nowrap px-3 py-5 font-display text-[14px] font-bold uppercase tracking-[0.015em] transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t-sm after:transition-colors ${
                    isActive
                      ? "text-drop after:bg-drop"
                      : "text-ink after:bg-transparent hover:text-drop hover:after:bg-drop/30"
                  }`
                }
                onFocus={() => hasMenu && setOpenIdx(i)}
                aria-expanded={hasMenu ? openIdx === i : undefined}
              >
                {item.label}
                {hasMenu && <ChevronDown size={14} aria-hidden />}
              </NavLink>

              {hasMenu && openIdx === i && (
                <div className="absolute left-0 top-full z-40 w-64 overflow-hidden rounded-b-card border border-t-0 border-ink/10 bg-bone py-2 shadow-lift">
                  <ul>
                    {item.children.map((child) => (
                      <li key={child.label}>
                        <Link
                          to={child.to}
                          className="block px-4 py-2.5 text-sm text-ink transition-colors hover:bg-fog hover:text-drop"
                          onClick={() => setOpenIdx(null)}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function MobileDrawer({ open, onClose }) {
  const closeButtonRef = useRef(null);

  // Lock body scroll while the drawer is open, and let Escape dismiss it —
  // the filter drawer already does both, and a panel that covers the screen
  // with no keyboard way out is a trap.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = "hidden";

    // Focus has to move inside: the trigger that opened this sits behind the
    // overlay, so leaving focus there strands a keyboard or screen-reader user
    // outside the panel they just opened.
    closeButtonRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        aria-label="Close menu"
        className="absolute inset-0 bg-ink/60"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-bone shadow-lift"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <Logo className="h-16" variant="full" />
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-sm p-1.5 text-ink hover:bg-fog"
          >
            <X size={22} aria-hidden />
          </button>
        </div>

        {/* First thing in the menu, so a visitor who cannot read the rest
            of it can still find it by the globe. */}
        <div className="border-b border-ink/10 px-5 py-2">
          <LanguageControl variant="inline" onBeforeAction={onClose} />
        </div>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-4">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  onClick={onClose}
                  className="block py-2.5 font-display text-[15px] font-bold uppercase tracking-[0.015em] text-ink"
                >
                  {item.label}
                </Link>
                {item.children && (
                  <ul className="mb-2 ml-3 space-y-0.5 border-l border-ink/10 pl-4">
                    {item.children.map((child) => (
                      <li key={child.label}>
                        <Link
                          to={child.to}
                          onClick={onClose}
                          className="block py-1.5 text-sm text-smoke transition-colors hover:text-drop"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Order status and the Shopify account, apart from the catalog
            links so they read as "my order" rather than more pages. */}
        <div className="grid grid-cols-2 gap-2 border-t border-ink/10 px-5 py-3">
          <Link
            to="/track"
            onClick={onClose}
            className="flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-sm px-1.5 font-display text-[13px] font-bold uppercase tracking-[0.015em] text-ink transition-colors hover:bg-fog hover:text-drop"
          >
            <Package size={18} aria-hidden className="shrink-0 text-drop" />
            Track Order
          </Link>
          <a
            href={BUSINESS.accountUrl}
            className="flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-sm px-1.5 font-display text-[13px] font-bold uppercase tracking-[0.015em] text-ink transition-colors hover:bg-fog hover:text-drop"
          >
            <UserRound size={18} aria-hidden className="shrink-0 text-drop" />
            Account
          </a>
        </div>

        <div className="border-t border-ink/10 p-5">
          <Link to="/tires" onClick={onClose} className="btn-primary w-full">
            Shop Tires
          </Link>
          <a
            href={BUSINESS.phoneHref}
            translate="no"
            className="notranslate btn-outline mt-2 w-full"
          >
            <Phone size={16} aria-hidden />
            {BUSINESS.phone}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useCart();
  const { pathname } = useLocation();

  // Stable identity: the drawer's effect depends on it, and a fresh closure
  // every render would re-run that effect and yank focus back to the close
  // button while the user is still tabbing through the menu.
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Close the drawer whenever navigation happens.
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      <UtilityBar />
      <TranslationNotice />

      {/* Two rows, not one.
          The logo and the navigation were competing for a single row: a
          square badge beside eight nav items, which is what overflowed the
          viewport at 1024px and made the masthead's height jump around by
          breakpoint. Given a row each, the mark can be as large as it likes
          and the nav gets the full width — which is the arrangement every
          large retailer converged on for the same reason.

          Only these rows stick. The utility strip scrolls away, because a
          phone number does not need to follow you down a product page. */}
      <div className="sticky top-0 z-40 border-b border-ink/10 bg-bone/95 backdrop-blur">
        <div className="wrap flex items-center gap-4 py-2 lg:gap-8">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <Logo className="h-[72px] lg:h-20" variant="full" />
          </Link>

          {/* The middle of the masthead is where a shopper looks for search,
              and it was the one thing this header did not have. It searches
              the whole store, with suggestions as you type (HeaderSearch.jsx). */}
          <HeaderSearch className="hidden min-w-0 flex-1 lg:block" />

          <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
            {/* Desktop only: on a phone these live in the menu, so the
                masthead keeps just the cart and the menu button. */}
            <LanguageControl variant="popover" className="hidden lg:block" />
            <NavLink
              to="/track"
              className={({ isActive }) =>
                `hidden items-center gap-1.5 whitespace-nowrap rounded-sm px-2.5 py-2 text-[13px] font-semibold transition-colors hover:bg-fog hover:text-drop lg:flex ${
                  isActive ? "text-drop" : "text-ink"
                }`
              }
            >
              <Package size={18} aria-hidden />
              Track Order
            </NavLink>
            <a
              href={BUSINESS.accountUrl}
              className="hidden items-center gap-1.5 whitespace-nowrap rounded-sm px-2.5 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-fog hover:text-drop lg:flex"
            >
              <UserRound size={18} aria-hidden />
              Account
            </a>
            <Link
              to="/cart"
              className="relative rounded-sm p-2.5 text-ink transition-colors hover:bg-fog hover:text-drop"
              aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
            >
              <ShoppingCart size={21} aria-hidden />
              {count > 0 && (
                <span className="tnum absolute right-0.5 top-0.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-drop px-1 text-[11px] font-bold leading-none text-bone ring-2 ring-bone">
                  {count}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="rounded-sm p-2.5 text-ink transition-colors hover:bg-fog hover:text-drop lg:hidden"
            >
              <Menu size={22} aria-hidden />
            </button>
          </div>
        </div>

        {/* Navigation gets its own full-width row, so nothing has to shrink
            to make the eight items fit. */}
        <div className="hidden border-t border-ink/[0.07] lg:block">
          <div className="wrap flex items-center justify-between gap-4">
            <DesktopNav />
            <Link
              to="/tires"
              className="btn-primary btn-sm my-1.5 shrink-0 whitespace-nowrap"
            >
              Shop Tires
            </Link>
          </div>
        </div>
      </div>

      {/* Search on a phone sits below the sticky block rather than inside it.
          It is worth a row of the page; it is not worth 50px of every screen
          for the whole session. */}
      <div className="border-b border-ink/10 bg-bone px-5 py-2.5 md:px-8 lg:hidden">
        <HeaderSearch id="mobile-search" />
      </div>

      <MobileDrawer open={menuOpen} onClose={closeMenu} />
    </>
  );
}
