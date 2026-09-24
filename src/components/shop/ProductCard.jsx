import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ShoppingCart, Truck } from "lucide-react";

import { money, useCart } from "../../context/CartContext.jsx";
import { useCompare } from "../../context/CompareContext.jsx";
import {
  DELIVERY_NOTE_SHORT,
  SET_SIZE,
  priceBreakdown,
} from "../../data/pricing.js";
import ProductArt from "./ProductArt.jsx";

/** Short spec line under the product name — size for tires, fitment for wheels. */
function specLine(product) {
  if (product.kind === "wheel") {
    return `${product.diameter}x${product.wheelWidth} · ${product.boltPattern} · ${product.finish}`;
  }
  return `${product.size} · ${product.loadIndex}${product.speedRating} · ${product.category}`;
}

export default function ProductCard({ product }) {
  const href = `${product.kind === "wheel" ? "/wheels" : "/tires"}/${product.slug}`;
  const isTire = product.kind === "tire";

  // Wheels are sold in fours too, so both get the set-of-four headline that a
  // shopper is really comparing between sites.
  const bd = priceBreakdown(product, SET_SIZE);

  const compare = useCompare();
  const selected = compare.has(product.slug);
  const lockedOut = compare.isFull && !selected;

  // Adding from the grid removes a page load from the funnel. A shopper who
  // already knows the tire had to open the product page, add, and come back
  // just to buy the thing they were looking at. The set of four is what goes
  // in, because that is the quantity the headline price is quoting.
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const addSet = () => {
    addItem(
      {
        id: product.id,
        kind: product.kind,
        // The cart and the order summary both print the brand next to this,
        // so the brand must not be in here as well.
        name: product.model,
        brand: product.brand,
        size: isTire
          ? product.size
          : `${product.diameter}x${product.wheelWidth}`,
        price: product.price,
        installPrice: product.installPrice,
        install: false,
        accent: product.accent,
        slug: product.slug,
      },
      SET_SIZE,
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  return (
    <article className="card-hover group flex h-full flex-col overflow-hidden">
      <div className="relative flex items-center justify-center border-b border-ink/[0.05] bg-gradient-to-b from-bone to-fog p-3 sm:p-5">
        {isTire && (
          <label
            // `z-10` is load-bearing, not decoration. The art below scales on
            // hover, and a transform promotes it into the positioned paint
            // layer — where, coming later in the DOM, it lands on top of this
            // control and swallows the click. Hovering the card made the
            // compare box unclickable.
            className={`absolute right-2 top-2 z-10 hidden min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-sm border border-ink/10 bg-bone/95 px-1.5 shadow-card backdrop-blur-sm transition-colors sm:flex sm:px-2 ${
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
            <span className="hidden font-display text-[11px] font-bold uppercase tracking-[0.09em] text-ink sm:inline">
              Compare
            </span>
            <span className="sr-only">
              Compare {product.brand} {product.model}
            </span>
          </label>
        )}

        <ProductArt
          kind={product.kind}
          accent={product.accent}
          size={168}
          label={`${product.brand} ${product.model}`}
          className="pointer-events-none h-auto w-[112px] max-w-full transition-transform duration-300 group-hover:scale-105 sm:w-[168px]"
        />
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="eyebrow text-[11px] tracking-[0.09em] text-smoke">
          {product.brand}
        </p>
        {/* A card title is the second line of a card, not a page headline —
            it carries the display face and the weight, not the size. */}
        <h3 className="h3 mt-1 text-[0.9375rem] leading-[1.2] sm:text-[1.0625rem] sm:leading-[1.15] md:text-[1.15rem]">
          <Link to={href} className="transition-colors hover:text-drop">
            {product.model}
          </Link>
        </h3>
        <p className="tnum mt-1 text-[11px] leading-snug text-smoke sm:mt-1.5 sm:text-xs">
          {specLine(product)}
        </p>

        {/* The price block is ruled off from the description above it, and
            every figure is tabular so the column of cards lines up. */}
        <div className="mt-auto border-t border-ink/[0.07] pt-3 sm:pt-3.5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="tnum font-display text-[1.375rem] font-bold leading-none tracking-[-0.02em] text-ink sm:text-[1.75rem]">
              {money(bd.price)}
            </span>
            <span className="text-[11px] uppercase tracking-[0.09em] text-smoke">
              set of {SET_SIZE}
            </span>
          </div>
          <p className="tnum mt-1.5 text-[11px] leading-snug text-smoke">
            {money(product.price)} each
            <span className="hidden sm:inline">
              {" "}
              · install +{money(product.installPrice)}/tire
            </span>
          </p>

          <p className="mt-2.5 hidden items-start gap-1.5 text-[11px] leading-snug text-smoke sm:flex">
            <Truck size={13} aria-hidden className="mt-px shrink-0" />
            <span>{DELIVERY_NOTE_SHORT}</span>
          </p>

          {/* On a phone the card is about 160px wide, and a floating control
              over the artwork costs a quarter of that while covering the
              product. Down here it gets a full row, its own label, and a tap
              target that does not fight the image. */}
          {isTire && (
            <label
              className={`mt-2.5 flex min-h-[44px] items-center gap-2 rounded-sm border border-ink/10 px-2.5 sm:hidden ${
                lockedOut ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              } ${selected ? "border-drop/40 bg-sky" : "bg-fog"}`}
            >
              <input
                type="checkbox"
                checked={selected}
                disabled={lockedOut}
                onChange={() => compare.toggle(product.slug)}
                className="accent-drop disabled:cursor-not-allowed"
              />
              <span className="font-display text-[11px] font-bold uppercase tracking-[0.09em] text-ink">
                Compare
              </span>
              <span className="sr-only">
                {product.brand} {product.model}
              </span>
            </label>
          )}

          <div className="mt-2.5 flex flex-col gap-2 sm:mt-3.5">
            <button
              type="button"
              onClick={addSet}
              className="btn-primary btn-sm min-h-[44px] w-full px-2 sm:px-4"
              aria-label={`Add a set of ${SET_SIZE} ${product.brand} ${product.model} to the cart`}
            >
              {added ? (
                <>
                  <Check size={15} aria-hidden />
                  Added
                </>
              ) : (
                <>
                  <ShoppingCart size={15} aria-hidden />
                  <span className="sm:hidden">Add 4</span>
                  <span className="hidden sm:inline">
                    Add set of {SET_SIZE}
                  </span>
                </>
              )}
            </button>

            <Link
              to={href}
              className="btn-outline btn-sm min-h-[44px] w-full px-2 sm:px-4"
              aria-label={`View details for ${product.brand} ${product.model}`}
            >
              <span className="sm:hidden">Details</span>
              <span className="hidden sm:inline">View Details</span>
            </Link>
          </div>

          {/* Announced rather than only shown, so the confirmation reaches a
              shopper who is not watching the button. */}
          <span aria-live="polite" className="sr-only">
            {added
              ? `Set of ${SET_SIZE} ${product.brand} ${product.model} added to your cart`
              : ""}
          </span>
        </div>
      </div>
    </article>
  );
}
