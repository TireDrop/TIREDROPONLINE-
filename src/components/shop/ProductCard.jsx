import React from "react";
import { Link } from "react-router-dom";

import { Badge, Stars } from "../ui/index.jsx";
import { money } from "../../context/CartContext.jsx";
import ProductArt from "./ProductArt.jsx";

const BADGE_TONE = {
  "Best Seller": "drop",
  "Staff Pick": "ink",
  Rebate: "amber",
};

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

export default function ProductCard({ product }) {
  const href = `${product.kind === "wheel" ? "/wheels" : "/tires"}/${product.slug}`;
  const savings = product.msrp - product.price;
  const hint = stockHint(product.stock);

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
        <ProductArt
          kind={product.kind}
          accent={product.accent}
          size={168}
          label={`${product.brand} ${product.model}`}
          className="h-auto w-[168px] max-w-full transition-transform duration-300 group-hover:scale-105"
        />
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
          <Stars rating={product.rating} count={product.reviewCount} size={13} />
        </div>

        <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-display text-2xl leading-none text-ink">
              {money(product.price)}
            </span>
            {savings > 0 && (
              <>
                <span className="text-sm text-smoke line-through">
                  {money(product.msrp)}
                </span>
                <span className="font-display text-xs uppercase tracking-wide text-drop">
                  Save {money(savings)}
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-[11px] text-smoke">
            each · install +{money(product.installPrice)}
          </p>
          <p className={`mt-2 text-xs ${hint.tone}`}>{hint.text}</p>

          <Link
            to={href}
            className="btn-dark btn-sm mt-3 w-full"
            aria-label={`View details for ${product.brand} ${product.model}`}
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
