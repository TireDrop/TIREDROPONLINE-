import React from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

import { SERVICE_AREA_EXAMPLES } from "../../data/serviceArea.js";
import { CITY_PAGE_PATH_BY_NAME } from "../../data/cityPages.js";

const CHIP =
  "rounded-sm border px-2.5 py-1 font-display text-[13px] font-semibold";

/**
 * The mobile/install area as three county columns, each with a few example
 * cities as chips. The cities are examples for reading and search only:
 * whether the van comes is decided by ZIP (src/data/serviceArea.js), which is
 * what the footnote says. A city with its own mobile page
 * (src/data/cityPages.js) links to it; the rest stay plain text.
 */
export default function ServiceAreaCounties({ className = "", note = true }) {
  return (
    <div className={className}>
      <ul className="grid gap-4 sm:grid-cols-3">
        {SERVICE_AREA_EXAMPLES.map(({ county, cities }) => (
          <li key={county} className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-ink">
              <MapPin size={16} aria-hidden className="shrink-0 text-drop" />
              {county} County
            </h3>
            <ul
              className="flex flex-wrap gap-2"
              aria-label={`Example cities in ${county} County`}
            >
              {cities.map((city) => {
                const to = CITY_PAGE_PATH_BY_NAME[city];
                return to ? (
                  <li key={city}>
                    <Link
                      to={to}
                      className={`${CHIP} inline-flex min-h-[32px] items-center border-drop/30 bg-bone text-drop underline decoration-drop/30 underline-offset-2 transition-colors hover:border-drop hover:text-dive`}
                    >
                      {city}
                    </Link>
                  </li>
                ) : (
                  <li
                    key={city}
                    className={`${CHIP} border-ink/10 bg-fog text-ink`}
                  >
                    {city}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
      {note && (
        <p className="mt-3 text-xs leading-relaxed text-smoke">
          A few of the places we cover; the underlined ones have their own
          page. Any address in the three counties counts; the Florida Keys
          don&rsquo;t. Checkout checks your ZIP code.
        </p>
      )}
    </div>
  );
}
