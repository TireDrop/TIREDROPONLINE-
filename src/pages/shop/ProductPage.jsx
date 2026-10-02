import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";
import {
  Check,
  ChevronRight,
  Minus,
  PackageSearch,
  Phone,
  Plus,
  Scale,
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
  EmptyState,
} from "../../components/ui/index.jsx";
import ProductArt from "../../components/shop/ProductArt.jsx";
import ProductCard from "../../components/shop/ProductCard.jsx";
import {
  InstalledPriceLines,
  InstalledPriceToggle,
} from "../../components/shop/InstalledPrice.jsx";
import {
  FitPanel,
  ShoppingForBar,
} from "../../components/shop/Fitment.jsx";
import { getProduct, TIRES, WHEELS } from "../../data/products.js";
import { BUSINESS } from "../../data/business.js";
import { getService } from "../../data/services.js";
import { SERVICE_AREA_LABEL } from "../../data/serviceArea.js";
import { useCart, money } from "../../context/CartContext.jsx";
import { useCompare } from "../../context/CompareContext.jsx";
import { useFit } from "../../context/VehicleContext.jsx";
import { trackViewItem } from "../../lib/analytics.js";
import {
  DELIVERY_NOTE,
  SET_SIZE,
  priceBreakdown,
} from "../../data/pricing.js";

// Installation is not free: name the shop's published starting price.
const INSTALL = getService("tire-installation");
const INSTALL_FROM = `from $${INSTALL.priceFrom} ${INSTALL.priceUnit}`;

// One, a pair, a set, or a set plus a full-size spare. Four leads because that
// is what the overwhelming majority of tire orders actually are.
const QTY_PRESETS = [1, 2, SET_SIZE, SET_SIZE + 1];

const MAX_QTY = 12;

/** Four products from the same category, falling back to the same brand. */
function relatedTo(product) {
  const pool = product.kind === "wheel" ? WHEELS : TIRES;
  const sameCategory = pool.filter(
    (p) => p.id !== product.id && p.category === product.category,
  );
  const rest = pool.filter(
    (p) => p.id !== product.id && p.category !== product.category,
  );
  return [...sameCategory, ...rest].slice(0, 4);
}

/**
 * What the distributor reported about stock, in words, or null when it said
 * nothing. A count is never shown: it is the difference between "In stock"
 * and "Low stock" (fewer than a set), and nothing finer.
 */
export function stockLabel(product) {
  const qty = Number.isFinite(product?.qty) ? product.qty : null;
  if (qty !== null) {
    if (qty <= 0) return { level: "out", text: "Out of stock" };
    return qty < SET_SIZE
      ? { level: "low", text: "Low stock" }
      : { level: "in", text: "In stock" };
  }
  if (product?.available === true) return { level: "in", text: "In stock" };
  if (product?.available === false) return { level: "out", text: "Out of stock" };
  return null;
}

/** The spec table rows: the catalog's own, else what the listing carries. */
function specRows(product, isTire) {
  const rows = Object.entries(product.specs ?? {}).filter(
    ([, v]) => v !== null && v !== undefined && String(v).trim() !== "",
  );
  if (rows.length || !isTire) return rows;
  return [
    ["Tire Size", product.size],
    ["Load Index", product.loadIndex],
    ["Speed Rating", product.speedRating],
    ["SKU", product.sku],
  ].filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "");
}

export default function ProductPage({ kind = "tire" }) {
  const { slug } = useParams();
  const product = getProduct(kind, slug);
  const isTire = kind !== "wheel";

  if (!product) {
    return (
      <>
        <Seo
          title="Product Not Found"
          description="That product is no longer listed. Browse the current TireDrop tire and wheel catalog, shipped free to the 48 contiguous states and DC."
          noindex
        />
        <PageHero
          eyebrow="404"
          title="We could not find that product"
          lede="It may have sold out or been replaced by a newer model."
        />
        <Breadcrumbs
          trail={[
            {
              label: isTire ? "Tires" : "Wheels",
              to: isTire ? "/tires" : "/wheels",
            },
            { label: "Not found" },
          ]}
        />
        <Section>
          <EmptyState
            icon={PackageSearch}
            as="h2"
            title="This listing is gone"
            lede="Head back to the catalog, or call us with the size you need — we can order sizes this page does not list."
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

  // Keyed by product so moving to another product starts a fresh buy box.
  return <ProductDetail key={product.id} product={product} kind={kind} />;
}

/**
 * The product page body. Used by the catalog's /tires/:slug and
 * /wheels/:slug pages and by /tires/p/:sku for tires that come from the API.
 *
 * `reportStock` switches the availability line from the catalog's "Available
 * to order." to whatever the distributor reported (and nothing at all when it
 * reported nothing).
 */
export function ProductDetail({ product, kind = "tire", reportStock = false }) {
  const { addItem } = useCart();
  const compare = useCompare();
  // Whether it fits what the shopper is shopping for (null for a wheel, and
  // until the saved vehicle has loaded). A tire that does not fit has no Add
  // to Cart anywhere on the page; the fitment panel says why and what fits.
  const fit = useFit(product);
  const noFit = fit?.status === "no-fit";

  const isTire = kind !== "wheel";
  const unit = isTire ? "tire" : "wheel";
  const [qty, setQty] = useState(SET_SIZE);
  const [install, setInstall] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => trackViewItem(product), [product]);

  // The sticky bar only earns its place once the real buy box has scrolled
  // away; before that it would cover the page for no reason.
  const buyBoxRef = useRef(null);
  const [buyBoxGone, setBuyBoxGone] = useState(false);

  useEffect(() => {
    const el = buyBoxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setBuyBoxGone(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product]);

  // Related picks are the catalog's; a tire from outside it gets none rather
  // than a row of unrelated sample tires.
  const related = useMemo(
    () => (product.slug ? relatedTo(product) : []),
    [product],
  );

  const clampQty = useCallback(
    (n) => (Number.isFinite(n) ? Math.min(MAX_QTY, Math.max(1, n)) : 1),
    [],
  );

  const name = `${product.brand} ${product.model}`;
  const sizeLabel = isTire
    ? product.size
    : `${product.diameter}x${product.wheelWidth} · ${product.boltPattern}`;
  const bill = priceBreakdown(product, qty);
  const installTotal = install ? bill.install : 0;
  const orderTotal = bill.price + installTotal;
  const canCompare = isTire && Boolean(product.slug);
  const inCompare = canCompare && compare.has(product.slug);
  const compareLocked = !inCompare && compare.isFull;
  const plural = (n) => (n === 1 ? unit : `${unit}s`);
  const stock = reportStock ? stockLabel(product) : null;
  const soldOut = stock?.level === "out";
  const specs = specRows(product, isTire);
  const features = Array.isArray(product.features) ? product.features : [];
  const photo =
    typeof product.image === "string" && /^https:\/\//i.test(product.image)
      ? product.image
      : null;

  const handleAdd = () => {
    if (soldOut || noFit) return;
    addItem(
      {
        id: product.id,
        sku: product.sku ?? product.id,
        kind: product.kind,
        // `name` here is "<brand> <model>" for the page headline and the SEO
        // title. The cart prints the brand itself, so the line carries the
        // model alone or it reads "Nexen Nexen N'Priz AH5".
        name: product.model,
        brand: product.brand,
        size: sizeLabel,
        // Read by the cart's fitment check (a dual index marks an LT tire).
        loadIndex: isTire ? (product.loadIndex ?? null) : null,
        price: product.price,
        installPrice: product.installPrice,
        install,
        accent: product.accent,
        slug: product.slug ?? null,
      },
      qty,
    );
    setAdded(true);
  };

  return (
    <>
      <Seo
        title={`${name} ${sizeLabel}`}
        description={`${name} ${sizeLabel} — ${money(product.price * SET_SIZE)} for a set of ${SET_SIZE} from TireDrop, shipped free to the 48 contiguous states and DC, or to our South Florida shop to fit ${INSTALL_FROM}.`}
      />
      <Breadcrumbs
        trail={[
          {
            label: isTire ? "Tires" : "Wheels",
            to: isTire ? "/tires" : "/wheels",
          },
          {
            label: product.brand,
            to: `${isTire ? "/tires" : "/wheels"}?brands=${encodeURIComponent(product.brand)}`,
          },
          { label: product.model },
        ]}
      />

      {isTire && (
        <div className="wrap mt-6">
          <ShoppingForBar />
        </div>
      )}

      <Section>
        <div className="grid items-start gap-10 lg:grid-cols-2">
          {/* Product art. It sticks on a desktop so the tire stays in view
              while the buy box and spec table scroll past it — the
              column is far taller than the art, and stretching the panel to
              match just floats the product in an empty box. */}
          {/* On a phone the art is kept small, so the name, the price for a
              set and the fitment answer reach the first screen instead of a
              full-width picture of a tire. */}
          <div className="card flex items-center justify-center bg-fog p-4 sm:p-8 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
            {photo ? (
              <img
                src={photo}
                alt={`${name}, ${sizeLabel}`}
                width={420}
                height={420}
                className="h-auto w-full max-w-[180px] object-contain sm:max-w-[420px]"
              />
            ) : (
              <ProductArt
                kind={product.kind}
                accent={product.accent}
                size={420}
                label={`${name}, ${sizeLabel}`}
                className="h-auto w-full max-w-[180px] sm:max-w-[420px]"
              />
            )}
          </div>

          {/* Buy box */}
          <div ref={buyBoxRef}>
            <p className="eyebrow">{product.brand}</p>
            <h1 className="h1 mt-1">{product.model}</h1>
            <p className="tnum mt-2 font-display text-lg text-smoke">
              {sizeLabel}
              {isTire && ` · ${product.loadIndex}${product.speedRating}`}
            </p>

            {/* The headline is the set total, because that is the number a
                shopper is comparing against the other tab they have open. */}
            <div className="mt-6 border-y border-ink/10 py-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="tnum font-display text-4xl leading-none tracking-tight">
                  {money(bill.price)}
                </span>
                <span className="text-sm text-smoke">
                  for {qty} {plural(qty)}
                </span>
              </div>
              <p className="mt-2 text-sm text-smoke">
                {money(product.price)} per {unit}
              </p>
              {reportStock ? (
                stock && (
                  <p
                    className={`mt-2 text-sm font-medium ${
                      stock.level === "out" ? "text-drop" : "text-ink"
                    }`}
                  >
                    {stock.text}
                    {stock.level === "low" &&
                      " — we confirm the full set before anything ships."}
                  </p>
                )
              ) : (
                <p className="mt-2 text-sm text-smoke">Available to order.</p>
              )}
            </div>

            {/* Does it fit, straight under the price: the question a shopper
                answers before quantity or delivery matter. */}
            {isTire && <FitPanel fit={fit} />}

            {/* Quantity. Presets first, because tapping "4" is faster than
                four taps on a plus button, with free entry for oddities. */}
            <div className="mt-6">
              <span id="qty-label" className="label">
                Quantity
              </span>
              <div
                className="flex flex-wrap items-center gap-2"
                role="group"
                aria-labelledby="qty-label"
              >
                {QTY_PRESETS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setQty(n)}
                    aria-pressed={qty === n}
                    className={`tnum min-h-[44px] min-w-[44px] rounded-sm border px-3 font-display text-base font-bold transition-colors ${
                      qty === n
                        ? "border-drop bg-drop text-bone"
                        : "border-ink/15 bg-bone text-ink hover:border-ink"
                    }`}
                  >
                    {n}
                    {n === SET_SIZE && (
                      <span className="ml-1.5 text-[11px] tracking-normal">
                        set
                      </span>
                    )}
                  </button>
                ))}

                <div className="inline-flex items-center rounded-sm border border-ink/15">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    aria-label="Decrease quantity"
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center text-ink hover:text-drop disabled:opacity-40"
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
                    max={MAX_QTY}
                    inputMode="numeric"
                    value={qty}
                    onChange={(e) => setQty(clampQty(Number(e.target.value)))}
                    className="min-h-[44px] w-14 border-x border-ink/15 bg-bone text-center font-display text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
                    disabled={qty >= MAX_QTY}
                    aria-label="Increase quantity"
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center text-ink hover:text-drop disabled:opacity-40"
                  >
                    <Plus size={16} aria-hidden />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-smoke">
                {qty === SET_SIZE + 1
                  ? "A set of four plus a full-size spare."
                  : "Most customers buy a full set of four."}
              </p>
            </div>

            {/* Fulfillment choice. Option two is the local upsell and sets the
                same `install` flag the cart has always carried. Neither names
                a date: the delivery estimate depends on the address, so it is
                shown at checkout. */}
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
                    <span className="block font-display text-base font-bold">
                      Ship it to me
                    </span>
                    <span className="mt-1 flex items-start gap-2 text-sm font-medium text-ink">
                      <Truck
                        size={16}
                        aria-hidden
                        className="mt-0.5 shrink-0 text-drop"
                      />
                      <span className="min-w-0">{DELIVERY_NOTE}</span>
                    </span>
                    <span className="mt-1 block text-sm text-smoke">
                      Delivered to your address anywhere in{" "}
                      {BUSINESS.shipping.area}.
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
                    <span className="block font-display text-base font-bold">
                      Ship to the shop and we&apos;ll fit them (+
                      {money(product.installPrice)} per {unit})
                    </span>
                    <span className="mt-1 flex items-start gap-2 text-sm font-medium text-ink">
                      <Store
                        size={16}
                        aria-hidden
                        className="mt-0.5 shrink-0 text-drop"
                      />
                      <span className="min-w-0">
                        Free ship-to-store at {BUSINESS.shop.name}, fitted
                        there
                      </span>
                    </span>
                    <span className="mt-1 block text-sm text-smoke">
                      {isTire
                        ? "Mounting, balancing, new valve stems and disposal of your old tires."
                        : "Mounting, balancing, hub-centric rings and TPMS transfer."}{" "}
                      South Florida only: the {BUSINESS.shop.city} shop serves{" "}
                      {SERVICE_AREA_LABEL}.
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>

            {/* Price breakdown: what we charge, and install. */}
            <dl className="tnum mt-6 space-y-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-smoke">
                  Price, {qty} {plural(qty)}
                </dt>
                <dd className="font-medium">{money(bill.price)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-smoke">Installation at the shop</dt>
                <dd className="font-medium">
                  {install ? money(installTotal) : "Not added"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-ink/10 pt-2 font-display text-lg font-bold">
                <dt>Estimated total</dt>
                <dd>{money(orderTotal)}</dd>
              </div>
            </dl>

            <p className="mt-2 text-xs text-smoke">
              Shipping is free. Taxes are calculated at checkout.
            </p>

            {noFit ? (
              <p
                data-testid="no-add"
                className="mt-5 rounded-sm border border-ink/15 bg-fog p-3 text-sm text-ink"
              >
                <span className="font-semibold">{fit.title}.</span> To keep
                the wrong size out of your cart, it can&rsquo;t be added. The
                tires that fit are one tap away, above.
              </p>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                disabled={soldOut}
                className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart size={18} aria-hidden />
                Add to Cart
              </button>
            )}
            {soldOut && (
              <p className="mt-2 text-sm text-smoke">
                Call{" "}
                <a
                  href={BUSINESS.phoneHref}
                  className="whitespace-nowrap text-ink underline underline-offset-4 hover:text-drop"
                >
                  {BUSINESS.phone}
                </a>{" "}
                and we&rsquo;ll find this size from another source.
              </p>
            )}

            <div aria-live="polite">
              {added && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-ink/15 bg-fog p-3 text-sm">
                  <span className="flex items-center gap-2 text-ink">
                    <Check size={16} aria-hidden className="text-drop" />
                    Added {qty} {plural(qty)} to your cart.
                  </span>
                  <Link to="/cart" className="btn-dark btn-sm">
                    View cart
                  </Link>
                </div>
              )}
            </div>

            {/* Installed price, one tire and a set of four, for a local
                shopper. Display only: the Delivery choice above is what adds
                installation to the cart, so this sits after the button
                rather than between the price and it. */}
            {isTire && (
              <div className="mt-5">
                <InstalledPriceToggle placement="product" />
                <InstalledPriceLines price={product.price} className="mt-3" />
              </div>
            )}

            {canCompare && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => compare.toggle(product.slug)}
                  aria-pressed={inCompare}
                  disabled={compareLocked}
                  className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-sm border px-4 font-display text-base font-bold transition-colors ${
                    inCompare
                      ? "border-drop bg-drop/5 text-drop"
                      : "border-ink/15 text-ink hover:border-ink disabled:opacity-50"
                  }`}
                >
                  <Scale size={16} aria-hidden />
                  {inCompare ? "In your comparison" : "Compare this tire"}
                </button>
                <p className="mt-1.5 text-xs text-smoke">
                  {compareLocked
                    ? `Your comparison is full at ${compare.max} tires — remove one to swap this in.`
                    : `${compare.count} of ${compare.max} picked for side-by-side comparison.`}
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-smoke">
              {product.warranty && (
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={14} aria-hidden className="text-drop" />
                  {product.warranty}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Truck size={14} aria-hidden className="text-drop" />
                Ships anywhere in {BUSINESS.shipping.area}
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* Local install cross-sell — South Florida only, flagged as such. */}
      <div className="bg-ink-wash text-bone">
        <div className="wrap flex flex-col gap-5 py-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <Store size={30} aria-hidden className="mt-1 shrink-0 text-amber" />
            <div>
              <p className="eyebrow-dark mb-1">South Florida</p>
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
            {/* The table scrolls inside this box rather than widening the
                page, which is what a long spec value would otherwise do on a
                360px phone. */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">
                  {name} {sizeLabel} specifications
                </caption>
                <tbody className="divide-y divide-ink/10 border-y border-ink/10">
                  {specs.map(([key, val]) => (
                    <tr key={key}>
                      <th
                        scope="row"
                        className="py-3 pr-4 text-left align-top font-normal text-smoke"
                      >
                        {key}
                      </th>
                      <td className="py-3 text-right align-top font-medium text-ink">
                        {val}
                      </td>
                    </tr>
                  ))}
                  {product.warranty && (
                    <tr>
                      <th
                        scope="row"
                        className="py-3 pr-4 text-left align-top font-normal text-smoke"
                      >
                        Warranty
                      </th>
                      <td className="py-3 text-right align-top font-medium text-ink">
                        {product.warranty}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            {features.length > 0 && (
              <>
                <h2 className="h2 text-3xl md:text-4xl">Why this one</h2>
                <ul className="mt-5 space-y-3">
                  {features.map((f) => (
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
              </>
            )}

            <div className={`card p-5 ${features.length > 0 ? "mt-6" : ""}`}>
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
      {related.length > 0 && (
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
          <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Section>
      )}

      {/* Sticky phone buy bar. It sits on top of the global MobileCallBar
          (fixed, `--call-bar-h` tall) rather than over it, so both stay tappable. */}
      {buyBoxGone && (
        <div className="fixed inset-x-0 bottom-[calc(var(--call-bar-h)+env(safe-area-inset-bottom))] z-30 border-t border-ink/10 bg-bone/95 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3 px-4 py-2.5">
            <div className="min-w-0">
              <p className="tnum font-display text-xl leading-none">
                {money(bill.price)}
              </p>
              <p className="mt-1 truncate text-[11px] text-smoke">
                {qty} {plural(qty)} · {money(product.price)} each
              </p>
            </div>
            {noFit ? (
              <p className="ml-auto shrink-0 text-right text-xs font-semibold text-ink">
                {fit.title}
              </p>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                disabled={soldOut}
                className="btn-primary btn-sm ml-auto shrink-0 min-h-[44px] disabled:opacity-50"
              >
                <ShoppingCart size={16} aria-hidden />
                Add to cart
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
