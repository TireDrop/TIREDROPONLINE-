import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Award,
  BookOpen,
  CalendarCheck,
  CreditCard,
  Info,
  Mail,
  MoreHorizontal,
  Package,
  Phone,
  Ruler,
  ShoppingBag,
  Star,
  X,
} from "lucide-react";
import { BUSINESS } from "../../data/business.js";
import { trackEvent } from "../../lib/analytics.js";
import { useStandalone } from "../../lib/appMode.js";
import { trapTab } from "../../lib/trapFocus.js";

/**
 * The installed app's bottom tab bar: Shop, Size, My Orders, Call, More.
 *
 * Rendered only in standalone mode (src/lib/appMode.js) and hidden from the
 * desktop breakpoint up, so the website in a browser, on any screen, never
 * gets it. It replaces MobileCallBar (App.jsx stops rendering that one), and
 * it keeps the same `--call-bar-h` contract: index.css sets that variable to
 * this bar's height in app mode, so the compare tray, the chat bubble, a
 * product page's buy bar and the page-end spacer all sit above it.
 *
 * Every tab is a 44px-or-taller target. Call is a tel: link; More opens a
 * bottom sheet with the rest of the site.
 */

const SHOP = /^\/(?:$|tires|wheels|cart|checkout|compare|brands|wheel-fitment)/;
const SIZE = /^\/(?:tire-size|tire-size-finder|find-my-tires|tire-check)(?:\/|$)/;
const ORDERS = /^\/(?:track|track-order)(?:\/|$)/;

/** Which tab the path belongs to ("more" for everything else). */
export function activeTab(pathname = "/") {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (ORDERS.test(path)) return "orders";
  if (SIZE.test(path)) return "size";
  if (SHOP.test(path)) return "shop";
  return "more";
}

const MORE_LINKS = [
  { to: "/schedule", label: "Book an install", icon: CalendarCheck },
  { to: "/contact", label: "Contact", icon: Mail },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/financing", label: "Financing", icon: CreditCard },
  { to: "/about", label: "About", icon: Info },
  { to: "/brands", label: "Brands", icon: Award },
  { to: "/reviews", label: "Reviews", icon: Star },
];

const TAB =
  "app-tab relative flex min-h-[44px] flex-1 select-none flex-col items-center justify-center gap-0.5 px-1 font-display text-[11px] font-bold leading-none transition-colors";
const tone = (on) => (on ? "text-bone" : "text-bone/70 active:text-bone");

function MoreSheet({ onClose }) {
  const ref = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    return () => {
      if (previous && previous.isConnected) previous.focus();
    };
  }, []);

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    trapTab(event, ref.current);
  };

  return (
    <div
      className="app-sheet fixed inset-0 z-[55] lg:hidden"
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-ink/60"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="More"
        className="app-sheet-panel absolute inset-x-0 bottom-0 max-h-[85%] overflow-y-auto overscroll-contain rounded-t-2xl bg-bone text-ink shadow-lift"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink/10 bg-bone px-5 py-1">
          <h2 className="font-display text-[16px] font-extrabold">More</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-3 flex h-11 w-11 items-center justify-center rounded-sm text-ink hover:text-drop"
          >
            <X size={22} aria-hidden />
          </button>
        </div>
        <ul className="grid grid-cols-2 gap-x-2 px-3 py-2">
          {MORE_LINKS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                onClick={onClose}
                className="flex min-h-[48px] items-center gap-3 rounded-sm px-2 font-display text-[14px] font-bold text-ink transition-colors hover:text-drop active:bg-fog"
              >
                <Icon size={19} aria-hidden className="shrink-0 text-drop" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function AppTabBar() {
  const standalone = useStandalone();
  const { pathname } = useLocation();
  // The sheet is open only for the route it was opened on, so any navigation
  // closes it without an effect.
  const [sheetPath, setSheetPath] = useState(null);
  const sheetOpen = sheetPath === pathname;
  const closeSheet = useCallback(() => setSheetPath(null), []);

  // Page behind a modal sheet does not scroll.
  useEffect(() => {
    if (!sheetOpen) return undefined;
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = before;
    };
  }, [sheetOpen]);

  if (!standalone) return null;

  const active = sheetOpen ? "more" : activeTab(pathname);
  const click = (method) => trackEvent("app_tab_click", { method });
  const cls = (id) => `${TAB} ${tone(active === id)}`;
  const mark = (id) =>
    active === id ? (
      <span
        aria-hidden
        className="app-tab-mark absolute inset-x-5 top-0 h-[3px] rounded-b-sm bg-volt"
      />
    ) : null;

  return (
    <>
      <nav
        aria-label="App"
        data-app-tabbar
        className="app-tabbar fixed inset-x-0 bottom-0 z-40 border-t border-graphite bg-ink text-bone shadow-[0_-10px_28px_-12px_rgba(7,14,26,.55)] lg:hidden"
        style={{
          height: "calc(var(--call-bar-h) + env(safe-area-inset-bottom))",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <div className="flex h-full items-stretch">
          <Link
            to="/tires"
            onClick={() => click("shop")}
            aria-current={active === "shop" ? "page" : undefined}
            className={cls("shop")}
          >
            {mark("shop")}
            <ShoppingBag size={21} aria-hidden />
            <span>Shop</span>
          </Link>
          <Link
            to="/tire-size-finder"
            onClick={() => click("size")}
            aria-current={active === "size" ? "page" : undefined}
            className={cls("size")}
          >
            {mark("size")}
            <Ruler size={21} aria-hidden />
            <span>Size</span>
          </Link>
          <Link
            to="/track"
            onClick={() => click("orders")}
            aria-current={active === "orders" ? "page" : undefined}
            className={cls("orders")}
          >
            {mark("orders")}
            <Package size={21} aria-hidden />
            <span>My Orders</span>
          </Link>
          <a
            href={BUSINESS.phoneHref}
            onClick={() => click("call")}
            aria-label={`Call TireDrop at ${BUSINESS.phone}`}
            className={`${TAB} ${tone(false)} !min-h-[44px]`}
          >
            <Phone size={21} aria-hidden />
            <span>Call</span>
          </a>
          <button
            type="button"
            onClick={() => {
              click("more");
              setSheetPath(sheetOpen ? null : pathname);
            }}
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            className={cls("more")}
          >
            {mark("more")}
            <MoreHorizontal size={21} aria-hidden />
            <span>More</span>
          </button>
        </div>
      </nav>
      {sheetOpen && <MoreSheet onClose={closeSheet} />}
    </>
  );
}
