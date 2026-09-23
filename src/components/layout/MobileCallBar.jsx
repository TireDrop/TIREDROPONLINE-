import React from "react";
import { Link } from "react-router-dom";
import { Phone, ShoppingCart } from "lucide-react";
import { BUSINESS } from "../../data/business.js";

/**
 * Thumb-reachable action bar, phones only.
 *
 * Shopping is the primary conversion for an online store, so that leads;
 * calling stays one tap away because tire buyers ask sizing questions. The
 * header scrolls away on a phone, so this keeps both reachable from any point
 * on any page. App.jsx adds matching bottom padding so it never covers the end
 * of the footer.
 */
export default function MobileCallBar() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 min-h-[calc(var(--call-bar-h)+env(safe-area-inset-bottom))] border-t border-graphite bg-ink/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex gap-2 px-3 py-2.5">
        <Link to="/tires" className="btn-primary flex-1 py-3 text-[15px]">
          <ShoppingCart size={17} aria-hidden />
          Shop Tires
        </Link>
        <a
          href={BUSINESS.phoneHref}
          className="btn-ghost-light flex-1 py-3 text-[15px]"
          aria-label={`Call TireDrop at ${BUSINESS.phone}`}
        >
          <Phone size={17} aria-hidden />
          Call
        </a>
      </div>
    </div>
  );
}
