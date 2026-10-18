import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { BRAND_STRIP } from "../../data/brandStrip.js";

/**
 * Home page "Shop by brand" strip: the brand logos in a slow loop, best
 * brands first (src/data/brandStrip.js).
 *
 * Pure CSS motion (`.brand-track` in src/index.css), so there is no script
 * and no layout shift: every chip has a fixed size. The strip pauses on hover
 * and keyboard focus. With prefers-reduced-motion it stops moving and wraps
 * into a static grid; the looped copy is hidden from assistive tech and,
 * under reduced motion, from view. Logos are not links yet: the catalog has
 * no per-brand pages until the ATD feed is live (see the launch checklist).
 */
function Chip({ brand, eager }) {
  return (
    <li
      className={`brand-chip ${brand.dark ? "bg-ink" : "bg-bone"}`}
      title={brand.name}
    >
      <img
        src={`/brand/logos/${brand.file}`}
        alt={brand.name}
        width="150"
        height="56"
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        style={brand.scale ? { transform: `scale(${brand.scale})` } : undefined}
      />
    </li>
  );
}

export default function BrandStrip() {
  return (
    <section
      data-home-section="brands"
      aria-label="Tire brands"
      className="border-b border-ink/[0.07] bg-fog py-8 md:py-10"
    >
      <div className="wrap" data-reveal>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <p className="eyebrow">Shop by brand</p>
            <h2 className="mt-1 text-xl md:text-2xl">Tire brands</h2>
          </div>
          <Link
            to="/brands"
            className="inline-flex min-h-[44px] items-center gap-1.5 font-display text-sm font-bold text-drop hover:text-dive"
          >
            See all brands
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>
      <div className="brand-rail" data-reveal>
        <div className="brand-track">
          <ul className="brand-list">
            {BRAND_STRIP.map((b, i) => (
              <Chip key={b.name} brand={b} eager={i < 5} />
            ))}
          </ul>
          <ul className="brand-list brand-dup" aria-hidden="true">
            {BRAND_STRIP.map((b) => (
              <li
                key={b.name}
                className={`brand-chip ${b.dark ? "bg-ink" : "bg-bone"}`}
              >
                <img
                  src={`/brand/logos/${b.file}`}
                  alt=""
                  width="150"
                  height="56"
                  loading="lazy"
                  decoding="async"
                  style={b.scale ? { transform: `scale(${b.scale})` } : undefined}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
