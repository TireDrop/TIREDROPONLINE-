import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BRANDS_ALL, BRAND_FILTERS } from "../../data/brandsAll.js";

/**
 * The Brands page wall (/brands): every brand logo as a tile, with
 * type filters and a name search.
 *
 * Tags: every tile carries data-brand and data-seg so the same markup can be
 * driven by real catalog data (size, vehicle fit) once the ATD feed is live.
 *
 * Motion is small and optional, no library:
 *  - tiles below the first screen rise in as they scroll into view (only tiles
 *    that start off screen are hidden, so nothing flashes and no-JS shows all);
 *  - when a filter or search changes, tiles that stay slide to their new spot
 *    (FLIP with the Web Animations API) and new ones fade in;
 *  - tiles lift on hover (not low-res stand-ins, which would blur);
 *  - prefers-reduced-motion turns all of it off.
 * Logos are not links yet: the catalog has no per-brand pages until the ATD
 * feed is live (launch checklist).
 */
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Tile({ brand, tileRef }) {
  const classes = [
    "brand-tile flex min-w-0 flex-col border border-ink/10 bg-bone",
    brand.lowRes ? "brand-tile-static" : "",
  ].join(" ");
  return (
    <li
      ref={tileRef}
      className={classes}
      data-brand={brand.name}
      data-seg={brand.seg.join(" ")}
      data-kind={brand.kind}
    >
      <div
        className={`flex h-[92px] items-center justify-center overflow-hidden p-3 sm:h-[120px] sm:px-[22px] sm:py-[18px] ${
          brand.dark ? "bg-ink" : "bg-white"
        }`}
      >
        <img
          src={`/brand/logos/${brand.file}`}
          alt={`${brand.name} logo`}
          loading="lazy"
          decoding="async"
          className="block max-h-full max-w-full object-contain"
          style={brand.scale ? { transform: `scale(${brand.scale})` } : undefined}
        />
      </div>
      <p className="m-0 flex flex-col gap-0.5 border-t border-ink/10 px-3.5 py-[11px] text-sm font-bold text-ink sm:flex-row sm:items-baseline sm:justify-between sm:gap-2.5">
        <span>{brand.name}</span>
        <em className="text-xs font-semibold uppercase not-italic tracking-[0.06em] text-smoke">
          {brand.kind === "wheels" ? "Wheels" : "Tires"}
        </em>
      </p>
    </li>
  );
}

export default function BrandWall() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const tileEls = useRef(new Map());
  const before = useRef(null);
  const gridRef = useRef(null);

  const shown = useMemo(() => {
    const term = query.trim().toLowerCase();
    return BRANDS_ALL.filter(
      (b) =>
        (filter === "all" || b.seg.includes(filter)) &&
        (!term || b.name.toLowerCase().includes(term)),
    );
  }, [filter, query]);

  // Remember where each tile is before the list changes.
  const remember = useCallback(() => {
    const map = new Map();
    tileEls.current.forEach((el, name) => {
      if (el && el.isConnected) map.set(name, el.getBoundingClientRect());
    });
    before.current = map;
  }, []);

  // After the change: slide the tiles that stayed, fade in the new ones.
  useLayoutEffect(() => {
    const first = before.current;
    before.current = null;
    if (!first || prefersReducedMotion()) return;
    tileEls.current.forEach((el, name) => {
      if (!el || !el.isConnected || !el.animate) return;
      const from = first.get(name);
      if (!from) {
        el.animate(
          [
            { opacity: 0, transform: "translateY(14px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 380, easing: "cubic-bezier(.25,1,.5,1)" },
        );
        return;
      }
      const to = el.getBoundingClientRect();
      const dx = from.left - to.left;
      const dy = from.top - to.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
        { duration: 460, easing: "cubic-bezier(.25,1,.5,1)" },
      );
    });
  }, [shown]);

  // Entrance: tiles that start below the first screen rise in as they arrive.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || prefersReducedMotion() || !("IntersectionObserver" in window)) {
      return undefined;
    }
    const tiles = [...grid.querySelectorAll(".brand-tile")].filter(
      (t) => t.getBoundingClientRect().top > window.innerHeight,
    );
    tiles.forEach((t) => t.classList.add("brand-pre"));
    let queue = [];
    let timer = null;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          queue.push(e.target);
        });
        if (queue.length && !timer) {
          timer = setTimeout(() => {
            const batch = queue;
            queue = [];
            timer = null;
            batch.forEach((t, i) => {
              t.style.transitionDelay = `${i * 40}ms`;
              t.classList.remove("brand-pre");
            });
          }, 30);
        }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    tiles.forEach((t) => io.observe(t));
    // Safety net: never leave a tile hidden if the observer never fires.
    const safety = setTimeout(() => {
      grid.querySelectorAll(".brand-pre").forEach((t) => t.classList.remove("brand-pre"));
    }, 6000);
    return () => {
      io.disconnect();
      clearTimeout(timer);
      clearTimeout(safety);
    };
  }, []);

  const n = shown.length;

  return (
    <div data-testid="brand-wall">
      <div className="sticky top-[var(--header-h,0px)] z-[5] -mx-1 flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b border-ink/10 bg-bone px-1 py-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter brands">
          {BRAND_FILTERS.map((f) => (
            <button
              key={f.id}
              id={`brand-filter-${f.id}`}
              type="button"
              aria-pressed={filter === f.id}
              data-filter={f.id}
              onClick={() => {
                remember();
                setFilter(f.id);
              }}
              className={`min-h-[44px] border px-4 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-drop ${
                filter === f.id
                  ? "border-drop bg-drop text-bone"
                  : "border-ink/15 bg-white text-ink hover:border-ink/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="flex min-w-[200px] max-w-[340px] flex-1 basis-[220px]" htmlFor="brand-search">
          <span className="sr-only">Find a brand</span>
          <input
            id="brand-search"
            type="search"
            value={query}
            onChange={(e) => {
              remember();
              setQuery(e.target.value);
            }}
            placeholder="Find a brand"
            autoComplete="off"
            className="min-h-[44px] w-full border border-ink/15 bg-white px-3.5 text-[15px] text-ink focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-drop"
          />
        </label>
        <span className="tnum text-sm text-smoke" aria-live="polite">
          {n} {n === 1 ? "brand" : "brands"} shown
        </span>
      </div>

      <ul
        ref={gridRef}
        className="brand-grid mt-6 list-none p-0"
      >
        {shown.map((b) => (
          <Tile
            key={b.name}
            brand={b}
            tileRef={(el) => {
              if (el) tileEls.current.set(b.name, el);
              else tileEls.current.delete(b.name);
            }}
          />
        ))}
      </ul>
      {n === 0 && (
        <p className="my-6 text-[15px] text-smoke" role="status">
          No brand matches that search. Try a shorter name.
        </p>
      )}
    </div>
  );
}
