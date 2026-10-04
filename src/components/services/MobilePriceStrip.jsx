import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Phone } from "lucide-react";

import { BUSINESS } from "../../data/business.js";
import { SERVICE_AREA_LABEL } from "../../data/serviceArea.js";
import { mobileCoverageLine, mobilePriceLine } from "../../lib/mobilePrice.js";

/** The booking route the mobile pages and the phone action bar share. */
export const MOBILE_BOOK = "/schedule?service=tire-installation";

/**
 * Starting price, service area and a one-tap Book button for the mobile van,
 * for the top of the mobile service page and every city page. Plain markup
 * with no state, so it is in the prerendered HTML and nothing moves on
 * hydration. The price comes from the catalog (src/lib/mobilePrice.js); the
 * data holds one install price, so the line says "Tire installation from $X"
 * next to "Mobile van in <place>" and claims no van fee or minimum.
 *
 *   variant "hero" (default): on the dark hero, Book (primary) and Call.
 *   variant "card": on a light card (home), Book plus whatever `children` adds.
 *
 * `place` and `county` name a city page; leave them out for the three counties.
 */
export default function MobilePriceStrip({
  place,
  county,
  variant = "hero",
  children,
  className = "",
}) {
  const price = mobilePriceLine();
  const coverage = mobileCoverageLine({ place, county, area: SERVICE_AREA_LABEL });
  const hero = variant === "hero";

  return (
    <div
      data-mobile-price-strip=""
      className={
        hero
          ? `rounded-card border border-bone/15 bg-bone/5 p-4 md:p-5 ${className}`
          : `border-t border-ink/10 pt-4 ${className}`
      }
    >
      {price && (
        <p
          className={
            hero
              ? "font-display text-[1.25rem] font-bold leading-snug text-bone md:text-2xl"
              : "font-display text-[15px] font-bold leading-snug text-ink"
          }
        >
          {price.lead}{" "}
          <span className={hero ? "text-amber" : "text-drop"}>{price.from}</span>
          {price.unit && ` ${price.unit}`}
        </p>
      )}
      <p
        className={`mt-1 flex items-start gap-2 text-sm leading-snug ${
          hero ? "text-bone/70" : "text-smoke"
        }`}
      >
        <MapPin
          size={16}
          aria-hidden
          className={`mt-0.5 shrink-0 ${hero ? "text-volt" : "text-drop"}`}
        />
        <span>{coverage}</span>
      </p>
      <div className={`mt-4 flex flex-wrap gap-3 ${hero ? "" : "items-center"}`}>
        <Link
          to={MOBILE_BOOK}
          className={`btn-primary min-h-[48px] ${hero ? "flex-1 basis-40" : "btn-sm !min-h-[44px]"}`}
        >
          Book your install
          <ArrowRight size={18} aria-hidden />
        </Link>
        {hero ? (
          <a href={BUSINESS.phoneHref} className="btn-ghost-light min-h-[48px]">
            <Phone size={18} aria-hidden />
            Call<span className="hidden sm:inline"> {BUSINESS.phone}</span>
          </a>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
