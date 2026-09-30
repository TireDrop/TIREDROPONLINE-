import React from "react";
import { MapPin } from "lucide-react";

import { SERVICE_AREA_EXAMPLES } from "../../data/serviceArea.js";

/**
 * The mobile/install area as three county columns, each with a few example
 * cities as chips. The cities are examples for reading and search only:
 * whether the van comes is decided by ZIP (src/data/serviceArea.js), which is
 * what the footnote says.
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
              {cities.map((city) => (
                <li
                  key={city}
                  className="rounded-sm border border-ink/10 bg-fog px-2.5 py-1 font-display text-[13px] font-semibold text-ink"
                >
                  {city}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      {note && (
        <p className="mt-3 text-xs leading-relaxed text-smoke">
          A few of the places we cover. Any address in the three counties
          counts; the Florida Keys don&rsquo;t. Checkout checks your ZIP code.
        </p>
      )}
    </div>
  );
}
