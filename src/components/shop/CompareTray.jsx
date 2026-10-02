import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";

import { useCompare } from "../../context/CompareContext.jsx";
import { TIRES } from "../../data/products.js";

// The tray belongs to browsing. It has nothing to say on the table it opens
// or once the shopper is paying, and a product page already owns the bottom
// of a phone screen with its own sticky buy bar — two stacked bars is one bar
// too many, and the buy bar is the one that takes money.
const isHidden = (pathname) =>
  ["/compare", "/cart", "/checkout"].includes(pathname) ||
  /^\/(tires|wheels)\/.+/.test(pathname);

/**
 * The tray every large tire retailer parks at the bottom of the catalog: tick
 * a few models, see what is queued, open the table.
 *
 * App.jsx mounts it once, globally, rather than per page — a shopper who picks
 * two tires on the catalog and then opens one of them should not watch their
 * comparison vanish.
 *
 * It stays mounted and slides out of frame when nothing is selected, so the
 * first pick animates in rather than appearing mid-scroll. On a phone it sits
 * above MobileCallBar, whose height `--call-bar-h` carries.
 */
export default function CompareTray() {
  const { slugs, count, max, remove, clear } = useCompare();
  const { pathname } = useLocation();

  // Slugs are the stored form, so the catalog resolves the labels. A slug with
  // no match is dropped rather than rendered as an empty chip.
  const picked = slugs
    .map((slug) => TIRES.find((t) => t.slug === slug))
    .filter(Boolean);

  const open = count > 0 && !isHidden(pathname);
  const ready = count >= 2;
  const emptySlots = Math.max(0, max - picked.length);

  // The tray floats over the page, so the page has to know how much of its
  // bottom edge is covered or the last row of cards hides underneath. Publish
  // the measured height rather than a guessed constant: the bar is one row on
  // a phone, chips plus a helper line on a desktop, and it changes as tires
  // come and go.
  const barRef = useRef(null);
  useEffect(() => {
    const el = barRef.current;
    const root = document.documentElement;
    if (!el) return undefined;

    const sync = () =>
      root.style.setProperty(
        "--compare-tray-h",
        open ? `${el.offsetHeight}px` : "0px",
      );

    sync();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--compare-tray-h");
    };
  }, [open]);

  // `invisible` rather than unmounting: it keeps the chips and buttons out of
  // the tab order while the bar is away, and CSS holds visibility for the
  // length of the transition, so the slide-down still plays. An <aside> so
  // its chips sit in a named landmark, like the call bar's <nav>.
  return (
    <aside
      aria-label="Tire comparison"
      ref={barRef}
      className={`fixed inset-x-0 bottom-[calc(var(--call-bar-h)+env(safe-area-inset-bottom))] z-40 border-t border-graphite bg-steel bg-steel-wash text-bone shadow-[0_-12px_32px_-16px_rgba(7,14,26,.7)] transition-[transform,opacity,visibility] duration-300 lg:bottom-0 ${
        open
          ? "visible translate-y-0 opacity-100"
          : "invisible translate-y-full opacity-0"
      }`}
    >
      {/* Narrower gutter than `wrap` so the compact phone row clears 360px. */}
      <div className="mx-auto flex w-full max-w-site items-center gap-2 px-3 py-2 md:gap-4 md:px-8 md:py-3">
        <p className="tnum min-w-0 truncate font-display text-[11px] font-bold uppercase tracking-[0.09em] text-bone/70 md:hidden">
          {ready ? `${count} of ${max}` : "Pick at least 2"}
        </p>

        <ul className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
          {picked.map((tire) => (
            <li
              key={tire.slug}
              className="flex min-w-0 flex-1 items-center gap-1 rounded-sm border border-graphite bg-ink/40 py-1 pl-2.5 pr-1"
            >
              <span className="min-w-0 flex-1 truncate text-[11px] leading-tight text-bone">
                <span className="text-bone/60">{tire.brand}</span> {tire.model}
              </span>
              <button
                type="button"
                onClick={() => remove(tire.slug)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-bone/60 hover:bg-graphite hover:text-bone"
                aria-label={`Remove ${tire.brand} ${tire.model} from comparison`}
              >
                <X size={14} aria-hidden />
              </button>
            </li>
          ))}
          {Array.from({ length: emptySlots }, (_, i) => (
            <li
              key={`slot-${i}`}
              className="flex h-[34px] flex-1 items-center justify-center rounded-sm border border-dashed border-graphite text-[11px] text-bone/50"
            >
              Add a tire
            </li>
          ))}
        </ul>

        <div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
          <button
            type="button"
            onClick={clear}
            className="flex min-h-[44px] shrink-0 items-center whitespace-nowrap px-2 font-display text-[12px] font-bold text-bone/70 transition-colors hover:text-bone md:text-[13px]"
          >
            Clear all
          </button>

          {ready ? (
            <Link
              to="/compare"
              className="btn-primary btn-sm min-h-[44px] whitespace-nowrap"
            >
              Compare ({count})
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="btn-primary btn-sm min-h-[44px] whitespace-nowrap"
              title="Pick at least 2 tires to compare"
            >
              Compare ({count})
            </button>
          )}
        </div>
      </div>

      {!ready && (
        <p className="hidden pb-2 text-center text-[11px] text-bone/55 md:block">
          Pick at least 2 tires to compare them side by side
        </p>
      )}
    </aside>
  );
}
