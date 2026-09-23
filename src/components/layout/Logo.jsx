import React, { useState } from "react";

const BASE = import.meta.env.BASE_URL;

// WebP first — the mark is a photographic chrome gradient, so it compresses
// far better than PNG. The PNG is the fallback, then the typographic wordmark.
const SOURCES = [`${BASE}brand/tiredrop.webp`, `${BASE}brand/tiredrop.png`];

function ParentLine({ onDark }) {
  return (
    <span
      className={`mt-1 whitespace-nowrap font-display text-[11px] uppercase leading-none tracking-[0.12em] ${
        onDark ? "text-bone/50" : "text-smoke"
      }`}
    >
      Powered by{" "}
      <span className={onDark ? "text-bone/70" : "text-extremeRed"}>
        Extreme Tires
      </span>
    </span>
  );
}

/**
 * TireDrop brand mark.
 *
 * The artwork is a stacked lockup ("TIRE" over "DROP"), so it needs more
 * height than a single-line wordmark to stay legible — see the sizes the
 * header and footer pass in.
 *
 * If the artwork ever fails to load this falls back to a typographic
 * wordmark. `showParent` adds the "Powered by Extreme Tires" line that
 * connects the national store to the shop behind it.
 */
export default function Logo({
  className = "h-10",
  onDark = false,
  showParent = false,
}) {
  const [srcIndex, setSrcIndex] = useState(0);
  const hasArtwork = srcIndex < SOURCES.length;

  const mark = hasArtwork ? (
    <img
      src={SOURCES[srcIndex]}
      alt="TireDrop"
      width="400"
      height="207"
      className={`${className} w-auto object-contain`}
      onError={() => setSrcIndex((i) => i + 1)}
    />
  ) : (
    <span
      className={`font-display text-2xl uppercase leading-none tracking-tight md:text-[28px] ${
        onDark ? "text-bone" : "text-ink"
      }`}
    >
      Tire
      <span className="text-drop">
        Drop
        {/* The dot that falls — the name's whole idea, in one mark. */}
        <span
          aria-hidden
          className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-drop align-super"
        />
      </span>
    </span>
  );

  if (!showParent) return mark;

  return (
    <span className="inline-flex flex-col items-start leading-none">
      {mark}
      <ParentLine onDark={onDark} />
    </span>
  );
}
