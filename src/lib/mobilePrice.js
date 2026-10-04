// The price line on the mobile-install pages (components/services/MobilePriceStrip.jsx).
//
// It reads the one install price the site has: services.js
// getService("tire-installation").priceFrom and priceUnit, through
// installQuote (src/lib/installedPrice.js). The van bills the same labor as
// the bay and the data holds no separate van price, fee or minimum, so the
// line says only what the data supports: "Tire installation from $25 per
// tire". Nothing is added about travel, minimums or speed. A separate van
// price would need its own field in services.js first.

import { INSTALL_SERVICE, installQuote } from "./installedPrice.js";

const dollars = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

/**
 * The install price as display parts, or null when the service has no usable
 * number (the strip then shows no price line rather than a guess):
 * `{ lead, from, unit, text }`, where `text` is the whole line.
 */
export function mobilePriceLine(service = INSTALL_SERVICE) {
  const quote = installQuote(service);
  if (!quote) return null;
  const lead = "Tire installation";
  const from = `from $${dollars(quote.price)}`;
  const unit = quote.unit.trim();
  return { lead, from, unit, text: [lead, from, unit].filter(Boolean).join(" ") };
}

/** The coverage line: "Mobile van in Sunrise, Broward County" or the three counties. */
export function mobileCoverageLine({ place, county, area }) {
  return place
    ? `Mobile van in ${place}${county ? `, ${county} County` : ""}`
    : `Mobile van in ${area}`;
}
