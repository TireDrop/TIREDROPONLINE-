import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Check,
  ChevronRight,
  Minus,
  PackageSearch,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
} from "lucide-react";

import {
  Seo,
  PageHero,
  Breadcrumbs,
  Section,
  SectionHead,
  Stars,
  Badge,
  EmptyState,
} from "../../components/ui/index.jsx";
import ProductArt from "../../components/shop/ProductArt.jsx";
import ProductCard from "../../components/shop/ProductCard.jsx";
import { getProduct, TIRES, WHEELS } from "../../data/products.js";
import { BUSINESS } from "../../data/business.js";
import { useCart, money } from "../../context/CartContext.jsx";

const BADGE_TONE = {
  "Best Seller": "drop",
  "Staff Pick": "ink",
  Rebate: "amber",
};

/** Four products from the same category, falling back to the same brand. */
function relatedTo(product) {
  const pool = product.kind === "wheel" ? WHEELS : TIRES;
  const sameCategory = pool.filter(
    (p) => p.id !== product.id && p.category === product.category
  );
  const rest = pool.filter(
    (p) => p.id !== product.id && p.category !== product.category
  );
  return [...sameCategory, ...rest].slice(0, 4);
}

export default function ProductPage({ kind = "tire" }) {
  const { slug } = useParams();
  const product = getProduct(kind, slug);
  const { addItem } = useCart();

  const isTire = kind !== "wheel";
  const unit = isTire ? "tire" : "wheel";
  const [qty, setQty] = useState(4);
  const [install, setInstall] = useState(false);
  const [added, setAdded] = useState(false);

  // A new slug is a new product — reset the buy box.
  useEffect(() => {
    setQty(4);
    setInstall(false);
    setAdded(false);
  }, [slug]);

  const related = useMemo(
    () => (product ? relatedTo(product) : []),
    [product]
  );

  if (!product) {
    return (
      <>
        <Seo
          title="Product Not Found"
          description="That product is no longer listed. Browse the current TireDrop tire and wheel catalog, shipped anywhere in the continental US."
        />
        <PageHero
          eyebrow="404"
          title="We could not find that product"
          lede="It may have sold out or been replaced by a newer model."
        />
        <Breadcrumbs
          trail={[
            { label: isTire ? "Tires" : "Wheels", to: isTire ? "/tires" : "/wheels" },
            { label: "Not found" },
          ]}
        />
        <Section>
          <EmptyState
            icon={PackageSearch}
            title="This listing is gone"
            lede="Head back to the catalog, or call us with the size you need — the distributor catalog runs far deeper than this page."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to={isTire ? "/tires" : "/wheels"}
                  className="btn-primary btn-sm"
                >
                  Back to {isTire ? "tires" : "wheels"}
                </Link>
                <a href={BUSINESS.phoneHref} className="btn-outline btn-sm">
                  <Phone size={16} aria-hidden />
                  Call {BUSINESS.phone}
                </a>
              </div>
            }
          />
        </Section>
      </>
    );
  }

  const name = `${product.brand} ${product.model}`;
  const sizeLabel = isTire
    ? product.size
    : `${product.diameter}x${product.wheelWidth} · ${product.boltPattern}`;
  const savings = product.msrp - product.price;
  const unitsTotal = product.price * qty;
  const installTotal = install ? product.installPrice * qty : 0;

  const handleAdd = () => {
    addItem(
      {
        id: product.id,
        kind: product.kind,
        name,
        brand: product.brand,
        size: sizeLabel,
        price: product.price,
        installPrice: product.installPrice,
        install,
        accent: product.accent,
        slug: product.slug,
      },
      qty
    );
    setAdded(true);
  };

  return (
    <>
      <Seo
        title={`${name} ${sizeLabel}`}
        description={`${name} ${sizeLabel} — ${money(product.price)} each from TireDrop, shipped anywhere in the continental US or free to our South Florida shop for installation.`}
      />
      <Breadcrumbs
        trail={[
          {
            label: isTire ? "Tires" : "Wheels",
            to: isTire ? "/tires" : "/wheels",
          },
          { label: product.brand, to: `${isTire ? "/tires" : "/wheels"}?brands=${encodeURIComponent(product.brand)}` },
          { label: product.model },
        ]}
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Product art */}
          <div className="card flex items-center justify-center bg-fog p-8">
            <ProductArt
              kind={product.kind}
              accent={product.accent}
              size={420}
              label={`${name}, ${sizeLabel}`}
              className="h-auto w-full max-w-[420px]"
            />
          </div>

          {/* Buy box */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="eyebrow">{product.brand}</p>
              {product.badge && (
                <Badge tone={BADGE_TONE[product.badge] || "soft"}>
                  {product.badge}
                </Badge>
              )}
            </div>
            <h1 className="h1 mt-1">{product.model}</h1>
            <p className="mt-2 font-display text-lg uppercase tracking-wide text-smoke">
              {sizeLabel}
              {isTire && ` · ${product.loadIndex}${product.speedRating}`}
            </p>

            <div className="mt-3">
              <Stars rating={product.rating} count={product.reviewCount} />
            </div>

            <div className="mt-6 border-y border-ink/10 py-5">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-display text-4xl leading-none">
                  {money(product.price)}
                </span>
                <span className="text-sm text-smoke">per {unit}</span>
                {savings > 0 && (
                  <>
                    <span className="text-base text-smoke line-through">
                      {money(product.msrp)}
                    </span>
                    <span className="font-display text-sm uppercase tracking-wide text-drop">
                      Save {money(savings)} each
                    </span>
                  </>
                )}
              </div>
              <p className="mt-2 text-sm text-smoke">
                {product.stock > 0
                  ? `${product.stock} available to ship from our distributor network. Shipping and delivery time are shown at checkout.`
                  : "Not available to ship right now — call us and we will source it."}
              </p>
            </div>

            {/* Quantity */}
            <div className="mt-6">
              <span id="qty-label" className="label">
                Quantity
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <div
                  className="inline-flex items-center rounded-sm border border-ink/15"
                  role="group"
                  aria-labelledby="qty-label"
                >
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    aria-label="Decrease quantity"
                    className="px-3 py-2.5 text-ink hover:text-drop disabled:opacity-40"
                  >
                    <Minus size={16} aria-hidden />
                  </button>
                  <label htmlFor="qty-input" className="sr-only">
                    Quantity of {unit}s
                  </label>
                  <input
                    id="qty-input"
                    type="number"
                    min="1"
                    max="12"
                    inputMode="numeric"
                    value={qty}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setQty(Number.isFinite(n) ? Math.min(12, Math.max(1, n)) : 1);
                    }}
                    className="w-14 border-x border-ink/15 bg-bone py-2.5 text-center font-display text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(12, q + 1))}
                    disabled={qty >= 12}
                    aria-label="Increase quantity"
                    className="px-3 py-2.5 text-ink hover:text-drop disabled:opacity-40"
                  >
                    <Plus size={16} aria-hidden />
                  </button>
                </div>
                <p className="text-xs text-smoke">
                  Most customers buy a full set of four.
                </p>
              </div>
            </div>

            {/* Fulfillment choice. Option two is the local upsell and sets the
                same `install` flag the cart has always carried. */}
            <fieldset className="mt-6">
              <legend className="label">Delivery</legend>
              <div className="grid gap-3">
                <label
                  htmlFor="fulfil-ship"
                  className={`flex cursor-pointer items-start gap-3 rounded-sm border p-4 transition-colors ${
                    install ? "border-ink/15 bg-bone" : "border-drop bg-drop/5"
                  }`}
                >
                  <input
                    id="fulfil-ship"
                    type="radio"
                    name="fulfillment"
                    checked={!install}
                    onChange={() => setInstall(false)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-drop"
                  />
                  <span className="min-w-0">
                    <span className="block font-display text-base uppercase tracking-wide">
                      Ship it to me
                    </span>
                    <span className="mt-1 block text-sm text-smoke">
                      Delivered to your address anywhere in{" "}
                      {BUSINESS.shipping.area}. Shipping and delivery time are
                      shown at checkout.
                    </span>
                  </span>
                </label>

                <label
                  htmlFor="fulfil-install"
                  className={`flex cursor-pointer items-start gap-3 rounded-sm border p-4 transition-colors ${
                    install ? "border-drop bg-drop/5" : "border-ink/15 bg-bone"
                  }`}
                >
                  <input
                    id="fulfil-install"
                    type="radio"
                    name="fulfillment"
                    checked={install}
                    onChange={() => setInstall(true)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-drop"
                  />
                  <span className="min-w-0">
                    <span className="block font-display text-base uppercase tracking-wide">
                      Ship free to the shop and we&apos;ll fit them (+
                      {money(product.installPrice)} per {unit})
                    </span>
                    <span className="mt-1 block text-sm text-smoke">
                      {isTire
                        ? `Free delivery to ${BUSINESS.shop.name}, then mounting, balancing, new valve stems and disposal of your old tires.`
                        : `Free delivery to ${BUSINESS.shop.name}, then mounting, balancing, hub-centric rings and TPMS transfer.`}{" "}
                      South Florida only.
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>

            {/* Totals */}
            <dl className="mt-5 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-smoke">
                  {qty} × {unit}s
                </dt>
                <dd className="font-medium">{money(unitsTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-smoke">Installation at the shop</dt>
                <dd className="font-medium">
                  {install ? money(installTotal) : "Not added"}
                </dd>
              </div>
              <div className="flex justify-between border-t border-ink/10 pt-2 font-display text-lg uppercase">
                <dt>Estimated total</dt>
                <dd>{money(unitsTotal + installTotal)}</dd>
              </div>
            </dl>
            <p className="mt-1 text-xs text-smoke">
              Taxes and shipping are calculated at checkout.
            </p>

            <button
              type="button"
              onClick={handleAdd}
              disabled={product.stock <= 0}
              className="btn-primary mt-5 w-full"
            >
              <ShoppingCart size={18} aria-hidden />
              {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
            </button>

            <div aria-live="polite">
              {added && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-ink/15 bg-fog p-3 text-sm">
                  <span className="flex items-center gap-2 text-ink">
                    <Check size={16} aria-hidden className="text-drop" />
                    Added {qty} {unit}
                    {qty === 1 ? "" : "s"} to your cart.
                  </span>
                  <Link to="/cart" className="btn-dark btn-sm">
                    View cart
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-smoke">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} aria-hidden className="text-drop" />
                {product.warranty || "Manufacturer warranty included"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Truck size={14} aria-hidden className="text-drop" />
                Ships anywhere in {BUSINESS.shipping.area}
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* Local install cross-sell — South Florida only, flagged as such. */}
      <div className="bg-ink text-bone">
        <div className="wrap flex flex-col gap-5 py-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <Store size={30} aria-hidden className="mt-1 shrink-0 text-amber" />
            <div>
              <p className="eyebrow mb-1">South Florida</p>
              <h2 className="h2 text-3xl md:text-4xl">
                Ship it free to the shop
              </h2>
              <p className="mt-2 max-w-xl text-sm text-bone/70">
                Local buyers can send the order to {BUSINESS.shop.name} at no
                charge and book an install. We fit the{" "}
                {isTire ? "tires" : "wheels"} and dispose of the old ones — or
                send the van out to you instead.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link to="/install" className="btn-primary">
              How install works
            </Link>
            <a href={BUSINESS.phoneHref} className="btn-ghost-light">
              <Phone size={18} aria-hidden />
              {BUSINESS.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Specs + features */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="h2 text-3xl md:text-4xl">Specifications</h2>
            <dl className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
              {Object.entries(product.specs).map(([key, val]) => (
                <div key={key} className="flex justify-between gap-6 py-3">
                  <dt className="text-sm text-smoke">{key}</dt>
                  <dd className="text-right text-sm font-medium text-ink">
                    {val}
                  </dd>
                </div>
              ))}
              <div className="flex justify-between gap-6 py-3">
                <dt className="text-sm text-smoke">Warranty</dt>
                <dd className="text-right text-sm font-medium text-ink">
                  {product.warranty || "Manufacturer limited warranty"}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="h2 text-3xl md:text-4xl">Why this one</h2>
            <ul className="mt-5 space-y-3">
              {product.features.map((f) => (
                <li key={f} className="flex gap-3 text-sm leading-relaxed">
                  <Check
                    size={18}
                    aria-hidden
                    className="mt-0.5 shrink-0 text-drop"
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="card mt-6 p-5">
              <h3 className="h3">Questions before you buy?</h3>
              <p className="mt-1 text-sm text-smoke">
                Call {BUSINESS.phone} during shop hours, send a note through the
                contact form, or stop by {BUSINESS.shop.full}.
              </p>
              <Link to="/contact" className="btn-outline btn-sm mt-4">
                Contact us
                <ChevronRight size={16} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* Related */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="You might also like"
          title={`More ${product.category} ${isTire ? "tires" : "wheels"}`}
          action={
            <Link
              to={isTire ? "/tires" : "/wheels"}
              className="btn-outline btn-sm"
            >
              Shop all {isTire ? "tires" : "wheels"}
            </Link>
          }
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Section>
    </>
  );
}
