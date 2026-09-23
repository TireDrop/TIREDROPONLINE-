import React, { useState } from "react";

const BASE = import.meta.env.BASE_URL;

// Drop a real TireDrop logo at public/brand/tiredrop.svg (or .png with
// transparency) and it replaces the wordmark below automatically, everywhere.
const SOURCES = [`${BASE}brand/tiredrop.svg`, `${BASE}brand/tiredrop.png`];

/**
 * TireDrop brand mark.
 *
 * Until artwork exists this renders a typographic wordmark: "TIRE" in the
 * ink colour, "DROP" in the brand blue, with the falling dot that gives the
 * name its idea. `showParent` adds the "Powered by Extreme Tires" line that
 * connects the national store to the shop behind it.
 */
export default function Logo({
  className = "h-10",
  onDark = false,
  showParent = false,
}) {
  const [srcIndex, setSrcIndex] = useState(0);
  const hasArtwork = srcIndex < SOURCES.length;

  if (hasArtwork) {
    return (
      <img
        src={SOURCES[srcIndex]}
        alt="TireDrop"
        className={`${className} w-auto object-contain`}
        onError={() => setSrcIndex((i) => i + 1)}
      />
    );
  }

  return (
    <span className="inline-flex flex-col leading-none">
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

      {showParent && (
        <span
          className={`mt-1 font-display text-[11px] uppercase tracking-[0.16em] ${
            onDark ? "text-bone/50" : "text-smoke"
          }`}
        >
          Powered by{" "}
          <span className={onDark ? "text-bone/70" : "text-extremeRed"}>
            Extreme Tires
          </span>
        </span>
      )}
    </span>
  );
}
