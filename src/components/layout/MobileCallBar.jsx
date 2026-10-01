import React from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarCheck, Phone, Search, ShoppingCart } from "lucide-react";
import { BUSINESS } from "../../data/business.js";
import { mobileBarFor } from "../../data/mobileBar.js";

const ICONS = { cart: ShoppingCart, search: Search, calendar: CalendarCheck };

/**
 * Thumb-reachable action bar, phones only.
 *
 * The lit button follows the page (src/data/mobileBar.js): shopping on most
 * pages, the size finder on the catalog, booking on the service pages, and
 * nothing but Call at checkout and order tracking. Product pages get no bar,
 * because their own price and "Add to cart" bar owns the bottom edge. The
 * choice is a pure function of the path, so the prerendered HTML and the
 * hydrated page match.
 *
 * Calling stays one tap away because tire buyers ask sizing questions. The
 * header scrolls away on a phone, so this keeps both reachable from any point
 * on any page. App.jsx adds matching bottom padding so it never covers the end
 * of the footer.
 */
export default function MobileCallBar() {
  const { pathname } = useLocation();
  const bar = mobileBarFor(pathname);
  if (!bar) return null;

  const { action } = bar;
  const Icon = action ? ICONS[action.icon] ?? ShoppingCart : null;

  return (
    <nav
      aria-label="Quick actions"
      className="fixed inset-x-0 bottom-0 z-40 min-h-[calc(var(--call-bar-h)+env(safe-area-inset-bottom))] border-t border-graphite bg-ink/95 shadow-[0_-10px_28px_-12px_rgba(7,14,26,.55)] backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* The page's action takes the wider share of the row and the lit
          button; calling keeps a full-height target beside it. */}
      <div className="flex gap-2 px-3 py-2.5">
        {action && (
          <Link
            to={action.to}
            className="btn-primary min-h-[46px] min-w-0 flex-[3] whitespace-nowrap px-3 py-3 text-[15px]"
          >
            <Icon size={17} aria-hidden />
            {action.label}
          </Link>
        )}
        <a
          href={BUSINESS.phoneHref}
          // `!`: index.css gives every tel: link a 36px floor with a selector
          // that outranks a plain utility, and alone in the row it would
          // shrink to that.
          className={`${action ? "btn-ghost-light flex-[2]" : "btn-primary flex-1"} !min-h-[46px] min-w-0 whitespace-nowrap px-3 py-3 text-[15px]`}
          aria-label={`Call TireDrop at ${BUSINESS.phone}`}
        >
          <Phone size={17} aria-hidden />
          {action ? "Call" : `Call ${BUSINESS.phone}`}
        </a>
      </div>
    </nav>
  );
}
