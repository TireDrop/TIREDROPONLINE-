import React, { useState } from "react";

const BASE = import.meta.env.BASE_URL;

// Two marks, because one shape cannot do both jobs.
//
// `full` is the primary: the complete badge, wordmark over the tire with the
// lightning behind it. It is what the brand actually is, and it goes wherever
// there is room to read it — the hero, the footer, the social card.
//
// `wordmark` is the same artwork's lettering without the tire. The masthead
// gives a logo about 44px of height; the badge is square, so at that height it
// would be 44px wide and the word "TireDrop" inside it would be illegible. The
// wordmark is twice as wide as it is tall, so the name survives the shrink.
//
// Both are WebP first — the artwork is chrome gradients and glow, which
// compresses like a photograph — with a PNG behind it.
const SOURCES = {
  full: [`${BASE}brand/tiredrop-full.webp`, `${BASE}brand/tiredrop-full.png`],
  wordmark: [`${BASE}brand/tiredrop.webp`, `${BASE}brand/tiredrop.png`],
};

const DIMENSIONS = {
  full: { width: 440, height: 444 },
  wordmark: { width: 400, height: 207 },
};

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
 * `variant` picks between the full badge and the wordmark; see SOURCES above
 * for why both exist. If the artwork fails to load it falls back through the
 * PNG and then to a typographic wordmark, so the header is never empty.
 *
 * `showParent` adds the "Powered by Extreme Tires" line that connects the
 * national store to the shop behind it.
 */
export default function Logo({
  className = "h-10",
  variant = "wordmark",
  onDark = false,
  showParent = false,
}) {
  const [srcIndex, setSrcIndex] = useState(0);
  const sources = SOURCES[variant] ?? SOURCES.wordmark;
  const size = DIMENSIONS[variant] ?? DIMENSIONS.wordmark;
  const hasArtwork = srcIndex < sources.length;

  const mark = hasArtwork ? (
    <img
      src={sources[srcIndex]}
      alt="TireDrop"
      width={size.width}
      height={size.height}
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
