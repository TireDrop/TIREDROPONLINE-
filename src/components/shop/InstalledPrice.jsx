import React, { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { MapPin, Wrench } from "lucide-react";

import { money } from "../../context/CartContext.jsx";
import { SET_SIZE } from "../../data/pricing.js";
import { trackInstalledPriceToggle } from "../../lib/analytics.js";
import {
  INSTALL_SERVICE,
  getInstalledShown,
  installedLines,
  setInstalledShown,
  subscribeInstalled,
} from "../../lib/installedPrice.js";

// Prices are never put through a page translator (src/lib/translate.js).
const NO_TRANSLATE = { translate: "no", className: "notranslate" };

/**
 * Whether installed prices are on. The prerendered page and the hydration
 * render are always "off" (the server snapshot), and a visitor who turned
 * them on gets them in the render straight after, so nothing mismatches.
 */
export function useInstalledShown() {
  return useSyncExternalStore(subscribeInstalled, getInstalledShown, () => false);
}

/**
 * The control: a real button with aria-pressed, a 44px target, the
 * out-of-area note and the /install link. `placement` names it for GA4
 * ("results" on /tires, "product" on a tire page).
 */
export function InstalledPriceToggle({ placement, className = "" }) {
  const on = useInstalledShown();
  const toggle = () => {
    setInstalledShown(!on);
    trackInstalledPriceToggle(!on, placement);
  };
  return (
    <div
      data-testid="installed-toggle"
      className={`rounded-sm border border-ink/10 bg-fog px-3 py-2 sm:px-4 ${className}`}
    >
      <button
        type="button"
        aria-pressed={on}
        onClick={toggle}
        className="group flex min-h-[44px] w-full items-center gap-3 text-left font-display text-sm font-bold text-ink"
      >
        {/* The switch is a picture of the state; aria-pressed carries it. */}
        <span
          aria-hidden
          className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors ${
            on ? "border-drop bg-drop" : "border-ink/25 bg-bone"
          }`}
        >
          <span
            className={`absolute left-0.5 h-[18px] w-[18px] rounded-full shadow-card transition-transform duration-200 ease-out motion-reduce:transition-none ${
              on ? "translate-x-4 bg-bone" : "translate-x-0 bg-ink/60"
            }`}
          />
        </span>
        <span className="min-w-0">
          Show installed price{" "}
          <span className="font-sans font-medium text-smoke">
            (Miami-Dade, Broward, Palm Beach)
          </span>
        </span>
      </button>
      <p className="mt-1 flex items-start gap-1.5 text-xs leading-snug text-smoke">
        <MapPin size={13} aria-hidden className="mt-px shrink-0" />
        <span>
          Installation is available in Miami-Dade, Broward and Palm Beach.
          Everywhere else ships free to the 48 states + DC.{" "}
          <Link
            to="/install"
            className="inline-flex min-h-[24px] items-center font-semibold text-ink underline underline-offset-2 hover:text-drop"
          >
            How installation works
          </Link>
        </span>
      </p>
    </div>
  );
}

/** One "tire + installation = total" line. */
function Sum({ label, line }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-2">
      <dt className="text-smoke">{label}</dt>
      <dd {...NO_TRANSLATE}>
        <span className="whitespace-nowrap">{money(line.tire)}</span>
        {" + "}
        <span className="whitespace-nowrap">{money(line.install)}</span>
        {" = "}
        <span className="whitespace-nowrap font-semibold text-ink">
          {money(line.total)}
        </span>
      </dd>
    </div>
  );
}

/**
 * A tire's installed price, one tire and a set of four, or nothing while the
 * toggle is off. `compact` is the result card's size.
 */
export function InstalledPriceLines({ price, compact = false, className = "" }) {
  const on = useInstalledShown();
  const lines = on ? installedLines(price) : null;
  if (!lines) return null;
  const where = INSTALL_SERVICE?.mobile
    ? "at our Sunrise shop or by mobile van"
    : "at our Sunrise shop";
  return (
    <div
      data-testid="installed-lines"
      className={`rounded-sm border border-drop/25 bg-drop/5 ${
        compact ? "p-2 text-[11px]" : "p-3 text-sm"
      } ${className}`}
    >
      <p className="flex items-start gap-1.5 font-display font-bold text-ink">
        <Wrench size={compact ? 12 : 14} aria-hidden className="mt-px shrink-0 text-drop" />
        <span>
          {lines.label.charAt(0).toUpperCase() + lines.label.slice(1)}
          <span className="font-sans font-normal text-smoke">
            {compact ? "" : `, ${where}`}
          </span>
        </span>
      </p>
      <dl className="tnum mt-1 space-y-0.5 leading-snug">
        <Sum label="1 tire" line={lines.one} />
        <Sum label={`Set of ${SET_SIZE}`} line={lines.set} />
      </dl>
      {!compact && (
        <p className="mt-1.5 text-xs text-smoke">
          Tire + installation = total. Shown for comparison; your cart and
          checkout are not changed.
        </p>
      )}
    </div>
  );
}
