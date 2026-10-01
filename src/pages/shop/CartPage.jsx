import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Truck,
  Wrench,
} from "lucide-react";

import {
  Seo,
  Breadcrumbs,
  EmptyState,
  Badge,
} from "../../components/ui/index.jsx";
import { useCart, useCartEvent, money } from "../../context/CartContext.jsx";
import { useVehicle } from "../../context/VehicleContext.jsx";
import ProductArt from "../../components/shop/ProductArt.jsx";
import {
  ChangeButton,
  FitBadge,
  ShoppingForBar,
} from "../../components/shop/Fitment.jsx";
import { fitSizeOf, sizeSearch } from "../../data/fitmentCheck.js";
import { BUSINESS } from "../../data/business.js";
import { productHref } from "../../data/products.js";

/* ------------------------------------------------------------------ */
/*  Totals                                                             */
/*  Shared with CheckoutPage (order review).                           */
/* ------------------------------------------------------------------ */

const round2 = (n) => Math.round(n * 100) / 100;

/** What the tax row says: the site never estimates it. */
export const TAX_NOTE = "Calculated at checkout";

/**
 * The money rail: parts + installation, before tax. Shipping is free to any
 * address in the 48 contiguous states and DC, so it adds nothing. Sales tax depends on the
 * address and Shopify works it out at checkout, so no figure is shown here.
 */
export function summarize({ subtotal, installTotal }) {
  return {
    subtotal,
    installTotal,
    total: Math.max(0, round2(subtotal + installTotal)),
  };
}

/* ------------------------------------------------------------------ */
/*  Pieces                                                             */
/* ------------------------------------------------------------------ */

function QtyStepper({ line, setQty }) {
  const id = `qty-${line.key}`;
  const clamp = (n) => Math.max(1, Math.min(99, n));

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="label mb-0">
        Qty
      </label>
      <div className="flex items-center rounded-sm border border-ink/15">
        <button
          type="button"
          onClick={() => setQty(line.key, clamp(line.qty - 1))}
          disabled={line.qty <= 1}
          aria-label={`Decrease quantity of ${line.brand} ${line.name}`}
          className="grid h-9 w-9 place-items-center text-ink transition-colors hover:bg-fog disabled:opacity-35"
        >
          <Minus size={15} aria-hidden />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={1}
          max={99}
          value={line.qty}
          onChange={(e) => {
            const next = parseInt(e.target.value, 10);
            if (!Number.isNaN(next)) setQty(line.key, clamp(next));
          }}
          className="h-9 w-12 border-x border-ink/15 bg-bone text-center font-display text-base text-ink focus:border-drop"
        />
        <button
          type="button"
          onClick={() => setQty(line.key, clamp(line.qty + 1))}
          disabled={line.qty >= 99}
          aria-label={`Increase quantity of ${line.brand} ${line.name}`}
          className="grid h-9 w-9 place-items-center text-ink transition-colors hover:bg-fog disabled:opacity-35"
        >
          <Plus size={15} aria-hidden />
        </button>
      </div>
    </div>
  );
}

/**
 * A line that does not fit what the shopper is shopping for: said plainly,
 * with the way to swap it. Checkout is not blocked over it, because a tech
 * confirms fitment by phone before any order is released.
 */
export function FitFlag({ fit, onRemove = null, change = null }) {
  const { resolved } = useVehicle();
  if (!fit || fit.status !== "no-fit") return null;
  const bySize = resolved.kind === "size";
  const swap = fit.sizes.map(sizeSearch).find(Boolean) ?? "/tires";
  return (
    <div
      data-testid="cart-fit-flag"
      className="mt-3 rounded-sm border border-extremeDeep/30 bg-[#FDEEEE] p-3 text-sm text-ink"
    >
      <p className="flex items-start gap-2">
        <AlertTriangle
          size={16}
          aria-hidden
          className="mt-0.5 shrink-0 text-extremeDeep"
        />
        <span className="min-w-0">
          <span className="font-semibold">{fit.title}.</span> {fit.detail}
        </span>
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 pl-6">
        <Link
          to={swap}
          className="font-semibold underline underline-offset-4 hover:text-drop"
        >
          Swap it for a tire that fits
        </Link>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-smoke underline underline-offset-4 hover:text-drop"
          >
            Remove it
          </button>
        )}
        {change ?? (
          <ChangeButton
            tab={bySize ? "size" : "vehicle"}
            className="text-smoke underline underline-offset-4 hover:text-drop"
          >
            {bySize ? "Not your size? Change it" : "Not your vehicle? Change it"}
          </ChangeButton>
        )}
      </div>
    </div>
  );
}

function CartLine({ line, setQty, remove, addItem }) {
  const { fitFor } = useVehicle();
  const fit = line.kind === "wheel" ? null : fitFor(fitSizeOf(line));
  // Catalog lines link to their slug page, live distributor tires to their
  // sku page, and anything with neither back to the listing.
  const base = line.kind === "wheel" ? "/wheels" : "/tires";
  const href = productHref(line) ?? base;
  const toggleId = `install-${line.key}`;

  // Installation is part of the line's identity, so flipping it means
  // retiring the old line and re-adding the opposite variant at the same qty.
  function toggleInstall() {
    const { key, qty, ...rest } = line;
    remove(key, { track: false });
    addItem({ ...rest, install: !line.install }, qty, { track: false });
  }

  return (
    <li className="grid grid-cols-[72px_minmax(0,1fr)] gap-4 py-6 sm:grid-cols-[104px_minmax(0,1fr)] sm:gap-6">
      <Link
        to={href}
        className="block overflow-hidden rounded-sm bg-fog p-2"
        aria-label={`View ${line.brand} ${line.name}`}
      >
        <ProductArt kind={line.kind} accent={line.accent} />
      </Link>

      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <p className="font-display text-xs uppercase tracking-[0.09em] text-smoke">
              {line.brand}
            </p>
            <h2 className="h3 mt-0.5">
              <Link to={href} className="hover:text-drop">
                {line.name}
              </Link>
            </h2>
            {line.size && (
              <p className="mt-1 text-sm text-smoke">
                Size <span className="text-ink">{line.size}</span>
              </p>
            )}
            {fit && fit.status !== "no-fit" && fit.code !== "no-selection" && (
              <FitBadge fit={fit} className="mt-2" />
            )}
          </div>

          <div className="tnum text-right">
            <p className="font-display text-2xl leading-none tracking-tight">
              {money(line.price * line.qty)}
            </p>
            <p className="mt-1 text-xs text-smoke">{money(line.price)} each</p>
          </div>
        </div>

        <FitFlag fit={fit} />

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <QtyStepper line={line} setQty={setQty} />
          <button
            type="button"
            onClick={() => remove(line.key)}
            className="inline-flex items-center gap-1.5 text-sm text-smoke transition-colors hover:text-drop"
          >
            <Trash2 size={15} aria-hidden />
            Remove
          </button>
        </div>

        <div className="mt-4 rounded-sm bg-fog p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <input
                id={toggleId}
                type="checkbox"
                checked={line.install}
                onChange={toggleInstall}
                className="mt-0.5 h-4 w-4 shrink-0 accent-drop"
              />
              <label
                htmlFor={toggleId}
                className="text-sm leading-snug text-ink"
              >
                <span className="font-display font-bold">
                  Ship free to the shop and we&apos;ll fit them
                </span>{" "}
                <span className="whitespace-nowrap text-drop">
                  (+{money(line.installPrice)} each)
                </span>
                <span className="mt-0.5 block text-xs text-smoke">
                  South Florida only. Leave it off and this line ships to your
                  address instead.
                </span>
              </label>
            </div>
            {line.install && (
              <span className="font-display text-base text-ink">
                {money(line.installPrice * line.qty)}
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

const TRUST = [
  {
    icon: Truck,
    title: "Ships nationwide",
    copy: `Drop-shipped free to any address in ${BUSINESS.shipping.area}.`,
  },
  {
    icon: ShieldCheck,
    title: "Fitment checked first",
    copy: "We match sizes to your vehicle before the order is released.",
  },
  {
    icon: CalendarClock,
    title: BUSINESS.poweredBy,
    copy: `A real shop in ${BUSINESS.shop.city}, ${BUSINESS.shop.state} — call ${BUSINESS.phone}.`,
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CartPage() {
  const { lines, count, subtotal, installTotal, addItem, setQty, remove } =
    useCart();
  const safeLines = Array.isArray(lines) ? lines : [];
  const { fitFor, resolved } = useVehicle();
  const noFitCount = safeLines.filter(
    (l) => l.kind !== "wheel" && fitFor(fitSizeOf(l))?.status === "no-fit",
  ).length;
  useCartEvent("view_cart");

  const totals = useMemo(
    () => summarize({ subtotal, installTotal }),
    [subtotal, installTotal],
  );

  return (
    <>
      <Seo
        title="Your Cart"
        description="Review your TireDrop order, choose shipping to your address or free ship-to-store install in South Florida, and check out."
      />
      <Breadcrumbs trail={[{ label: "Cart" }]} />

      <div className="wrap py-10 md:py-14">
        <header className="mb-8 md:mb-10">
          <p className="eyebrow mb-2">{BUSINESS.tagline}</p>
          <h1 className="h1">Your Cart</h1>
          <p className="lede mt-3 max-w-2xl">
            {count > 0
              ? `${count} ${count === 1 ? "item" : "items"} ready to ship. Local to South Florida? Switch any line to free ship-to-store and we'll fit it for you.`
              : "Nothing in here yet."}
          </p>
        </header>

        {safeLines.length === 0 ? (
          <EmptyState
            as="h2"
            icon={ShoppingCart}
            title="Your cart is empty"
            lede="Pick a set of tires or a new set of wheels and we'll ship them anywhere in the 48 contiguous states and DC."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/tires" className="btn-primary">
                  Shop Tires
                </Link>
                <Link to="/wheels" className="btn-outline">
                  Shop Wheels
                </Link>
              </div>
            }
          />
        ) : (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
            {/* Line items */}
            <section aria-label="Cart items" className="min-w-0">
              <ShoppingForBar className="mb-6" />
              <ul className="divide-y divide-ink/10 border-y border-ink/10">
                {safeLines.map((line) => (
                  <CartLine
                    key={line.key}
                    line={line}
                    setQty={setQty}
                    remove={remove}
                    addItem={addItem}
                  />
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to="/tires" className="btn-outline btn-sm">
                  Keep Shopping
                </Link>
                <Link
                  to="/install"
                  className="text-sm text-smoke underline underline-offset-4 transition-colors hover:text-drop"
                >
                  How ship-to-store install works
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {TRUST.map(({ icon: Icon, title, copy }) => (
                  <div key={title} className="card p-4">
                    <Icon size={20} aria-hidden className="text-drop" />
                    <p className="mt-3 font-display text-base font-bold leading-tight">
                      {title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-smoke">
                      {copy}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Summary rail */}
            <aside aria-label="Order summary" className="min-w-0">
              <div className="card p-6 lg:sticky lg:top-24">
                <h2 className="h3">Order Summary</h2>

                <dl className="tnum mt-5 space-y-3 text-sm">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-smoke">Tires &amp; wheels</dt>
                    <dd className="font-display text-base">
                      {money(totals.subtotal)}
                    </dd>
                  </div>

                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-smoke">Installation at the shop</dt>
                    <dd className="font-display text-base">
                      {totals.installTotal > 0
                        ? money(totals.installTotal)
                        : "—"}
                    </dd>
                  </div>

                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-smoke">Shipping</dt>
                    <dd className="font-display text-base">
                      <Badge tone="amber">Free</Badge>
                    </dd>
                  </div>

                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-smoke">Sales tax</dt>
                    <dd className="text-right text-sm text-ink">{TAX_NOTE}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-ink/10 pt-5">
                  <span className="font-display text-lg font-bold leading-tight">
                    Estimated total{" "}
                    <span className="block text-xs font-normal text-smoke">
                      (before tax)
                    </span>
                  </span>
                  <span className="tnum font-display text-3xl leading-none tracking-tight">
                    {money(totals.total)}
                  </span>
                </div>

                {noFitCount > 0 && (
                  <p
                    role="note"
                    className="mt-5 rounded-sm border border-extremeDeep/30 bg-[#FDEEEE] p-3 text-xs leading-relaxed text-ink"
                  >
                    <span className="font-semibold">
                      {noFitCount === 1
                        ? "1 item doesn't match"
                        : `${noFitCount} items don't match`}{" "}
                      {resolved.kind === "size" ? "your size" : "your vehicle"}.
                    </span>{" "}
                    Swap {noFitCount === 1 ? "it" : "them"} above, or check out
                    anyway: we call to confirm fitment before the order is
                    released.
                  </p>
                )}

                <Link to="/checkout" className="btn-primary mt-5 w-full">
                  Checkout
                </Link>
                <p className="mt-3 text-center text-xs leading-relaxed text-smoke">
                  We check the fitment against your vehicle before anything
                  ships.
                </p>

                <div className="mt-6 flex items-start gap-2.5 border-t border-ink/10 pt-5">
                  <Wrench
                    size={16}
                    aria-hidden
                    className="mt-0.5 shrink-0 text-smoke"
                  />
                  <p className="text-xs leading-relaxed text-smoke">
                    Questions on fitment or load rating? Call{" "}
                    <a
                      href={BUSINESS.phoneHref}
                      className="text-ink underline hover:text-drop"
                    >
                      {BUSINESS.phone}
                    </a>{" "}
                    and talk to a tech before you check out.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
