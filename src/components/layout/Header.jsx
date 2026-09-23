import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ChevronDown,
  MapPin,
  Menu,
  Phone,
  ShoppingCart,
  Truck,
  X,
} from "lucide-react";
import { BUSINESS, NAV } from "../../data/business.js";
import { useCart } from "../../context/CartContext.jsx";
import Logo from "./Logo.jsx";

/** Thin utility strip above the masthead: phone, address, mobile-service pitch. */
function UtilityBar() {
  return (
    <div className="bg-ink bg-steel-wash text-bone">
      <div className="wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2 text-xs">
        {/* Calling is the primary action on a phone — keep it comfortably tappable. */}
        <a
          href={BUSINESS.phoneHref}
          className="-my-1 flex min-h-[32px] items-center gap-1.5 py-1 font-display text-sm font-bold tracking-[-0.005em] transition-colors hover:text-amber"
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
                  `relative flex h-full items-center gap-1 px-3.5 py-5 font-display text-[14px] font-bold uppercase tracking-[0.015em] transition-colors after:absolute after:inset-x-3.5 after:bottom-0 after:h-[3px] after:rounded-t-sm after:transition-colors ${
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
  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        aria-label="Close menu"
        className="absolute inset-0 bg-ink/60"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-bone shadow-lift">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <Logo className="h-11" />
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-sm p-1.5 text-ink hover:bg-fog"
          >
            <X size={22} aria-hidden />
          </button>
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

        <div className="border-t border-ink/10 p-5">
          <Link to="/tires" onClick={onClose} className="btn-primary w-full">
            Shop Tires
          </Link>
          <a href={BUSINESS.phoneHref} className="btn-outline mt-2 w-full">
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

  // Close the drawer whenever navigation happens.
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      <UtilityBar />

      <div className="sticky top-0 z-40 border-b border-ink/10 bg-bone/95 backdrop-blur">
        <div className="wrap flex items-center justify-between gap-4">
          <Link to="/" className="flex shrink-0 items-center py-3">
            <Logo className="h-11 md:h-12" showParent />
          </Link>

          <DesktopNav />

          <div className="flex items-center gap-1.5">
            <Link
              to="/tires"
              className="btn-primary btn-sm ml-1.5 hidden whitespace-nowrap xl:inline-flex"
            >
              Shop Tires
            </Link>

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
      </div>

      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
