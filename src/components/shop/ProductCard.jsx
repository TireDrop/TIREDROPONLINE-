import React from "react";
import { Link } from "react-router-dom";
import { Truck } from "lucide-react";

import { Badge, Stars } from "../ui/index.jsx";
import { money } from "../../context/CartContext.jsx";
import { useCompare } from "../../context/CompareContext.jsx";
import {
  SET_SIZE,
  deliveryEstimate,
  priceBreakdown,
  setMsrp,
  setPrice,
  shipsFree,
} from "../../data/pricing.js";
import { ratingsFor } from "../../data/tireRatings.js";
import ProductArt from "./ProductArt.jsx";

const BADGE_TONE = {
  "Best Seller": "drop",
  "Staff Pick": "ink",
  Rebate: "amber",
};

// A grid can hold forty cards and the estimate is the same for all of them, so
// it is resolved once per page load rather than once per card.
const DELIVERY = deliveryEstimate();

// The three axes a shopper actually scans on a grid. The rest live on the
// product page and in the compare table, where there is room for them.
const CARD_AXES = [
  { key: "dry", label: "Dry" },
  { key: "wet", label: "Wet" },
  { key: "wear", label: "Tread life" },
];

/** Short spec line under the product name — size for tires, fitment for wheels. */
function specLine(product) {
  if (product.kind === "wheel") {
    return `${product.diameter}x${product.wheelWidth} · ${product.boltPattern} · ${product.finish}`;
  }
  return `${product.size} · ${product.loadIndex}${product.speedRating} · ${product.category}`;
}

function stockHint(stock) {
  if (stock <= 0) return { text: "Out of stock", tone: "text-smoke" };
  if (stock <= 8) return { text: `Only ${stock} left`, tone: "text-drop" };
  return { text: "In stock — ships today", tone: "text-smoke" };
}

/**
 * A single 0–10 axis. A null score is a real answer — winter tires carry no
 * UTQG treadwear grade — so it prints a dash instead of an empty bar, which
 * would read as a score of zero.
 */
function RatingBar({ label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[62px] shrink-0 text-[11px] text-smoke">{label}</span>
      {value === null ? (
        <span className="flex-1 text-[11px] text-smoke/60" title="Not rated">
          — not rated
        </span>
      ) : (
        <>
          <span className="h-[3px] flex-1 rounded-full bg-ink/10">
            <span
              className="block h-full rounded-full bg-drop"
              style={{ width: `${value * 10}%` }}
            />
          </span>
          <span className="w-[22px] shrink-0 text-right font-display text-[11px] text-ink">
            {value.toFixed(1)}
          </span>
        </>
      )}
    </div>
  );
}

export default function ProductCard({ product }) {
  const href = `${product.kind === "wheel" ? "/wheels" : "/tires"}/${product.slug}`;
  const hint = stockHint(product.stock);
  const isTire = product.kind === "tire";

  // Wheels are sold in fours too, so both get the set-of-four headline that a
  // shopper is really comparing between sites.
  const bd = priceBreakdown(product, SET_SIZE);
  const setSaving = setMsrp(product) - setPrice(product);

  const ratings = isTire ? ratingsFor(product) : null;

  const compare = useCompare();
  const selected = compare.has(product.slug);
  const lockedOut = compare.isFull && !selected;

  return (
    <article className="card-hover group flex h-full flex-col overflow-hidden">
      <div className="relative flex items-center justify-center bg-fog p-5">
        {product.badge && (
          <div className="absolute left-3 top-3">
            <Badge tone={BADGE_TONE[product.badge] || "soft"}>
              {product.badge}
            </Badge>
          </div>
        )}

        {isTire && (
          <label
            className={`absolute right-2 top-2 flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-sm border border-ink/10 bg-bone/95 px-2 ${
              lockedOut ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            }`}
            title={
              lockedOut
                ? `Comparing ${compare.max} already — remove one first`
                : "Add to comparison"
            }
          >
            <input
              type="checkbox"
              checked={selected}
              disabled={lockedOut}
              onChange={() => compare.toggle(product.slug)}
              className="accent-drop disabled:cursor-not-allowed"
            />
            <span className="font-display text-[11px] uppercase tracking-[0.1em] text-ink">
              Compare
            </span>
            <span className="sr-only">
              {product.brand} {product.model}
            </span>
          </label>
        )}

        <ProductArt
          kind={product.kind}
          accent={product.accent}
          size={168}
          label={`${product.brand} ${product.model}`}
          className="h-auto w-[168px] max-w-full transition-transform duration-300 group-hover:scale-105"
        />

        {product.rebate && (
          <div className="absolute bottom-3 left-3">
            <Badge tone="amber">${product.rebate.amount} rebate</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="eyebrow text-[11px] tracking-[0.18em] text-smoke">
          {product.brand}
        </p>
        <h3 className="h3 mt-0.5 leading-tight">
          <Link to={href} className="hover:text-drop">
            {product.model}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-smoke">{specLine(product)}</p>

        <div className="mt-2">
          <Stars
            rating={product.rating}
            count={product.reviewCount}
            size={13}
          />
        </div>

        {ratings && (
          <div className="mt-3 space-y-1.5">
            {CARD_AXES.map((axis) => (
              <RatingBar
                key={axis.key}
                label={axis.label}
                value={ratings[axis.key]}
              />
            ))}
          </div>
        )}

        <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-display text-2xl leading-none text-ink">
              {money(bd.price)}
            </span>
            <span className="text-[11px] uppercase tracking-[0.12em] text-smoke">
              set of {SET_SIZE}
            </span>
            {setSaving > 0 && (
              <>
                <span className="text-sm text-smoke line-through">
                  {money(bd.list)}
                </span>
                <span className="font-display text-xs uppercase tracking-wide text-drop">
                  Save {money(setSaving)}
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-[11px] text-smoke">
            {money(product.price)} each · install +{money(product.installPrice)}
            /tire
          </p>

          {bd.rebate > 0 && (
            <p className="mt-1.5 rounded-sm bg-sky px-2 py-1 text-[11px] text-ink">
              − {money(bd.rebate)} mfr. rebate →{" "}
              <span className="font-display">{money(bd.net)}</span> after rebate
            </p>
          )}

          <p className="mt-2 flex items-start gap-1.5 text-[11px] text-smoke">
            <Truck size={13} aria-hidden className="mt-0.5 shrink-0" />
            <span>
              {shipsFree() ? "Ships free" : "Shipping calculated at checkout"} ·
              arrives {DELIVERY.earliest}–{DELIVERY.latest}
            </span>
          </p>
          <p className={`mt-1.5 text-xs ${hint.tone}`}>{hint.text}</p>

          <Link
            to={href}
            className="btn-dark btn-sm mt-3 min-h-[44px] w-full"
            aria-label={`View details for ${product.brand} ${product.model}`}
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
