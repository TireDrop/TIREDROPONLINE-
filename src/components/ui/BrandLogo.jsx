import React, { useState } from "react";

const BASE = import.meta.env.BASE_URL;

/**
 * Renders a tire manufacturer's logo, falling back to a styled wordmark when
 * no logo file has been supplied yet.
 *
 * The site expects **white artwork on a transparent background**, which is why
 * every brand strip sits on a dark surface. One white file then works in the
 * footer and on the homepage without per-context variants.
 *
 * To add one: drop the file into `public/brand/tires/` and set the matching
 * `logo` field in TIRE_BRANDS (src/data/business.js). Nothing else changes —
 * every brand strip reads from that one list.
 */
export default function BrandLogo({ brand, className = "h-8" }) {
  const [failed, setFailed] = useState(false);

  if (!brand.logo || failed) {
    return (
      <span className="font-display text-xl uppercase tracking-[0.18em] text-bone/45 transition-colors hover:text-bone">
        {brand.name}
      </span>
    );
  }

  return (
    <img
      src={`${BASE}${brand.logo}`}
      alt={`${brand.name} tires`}
      onError={() => setFailed(true)}
      loading="lazy"
      className={`${className} w-auto object-contain opacity-70 transition-opacity hover:opacity-100`}
    />
  );
}
