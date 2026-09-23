import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  Check,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Trash2,
  Truck,
  Wrench,
  X,
} from "lucide-react";

import { Seo, Breadcrumbs, EmptyState, Badge } from "../../components/ui/index.jsx";
import { useCart, money } from "../../context/CartContext.jsx";
import ProductArt from "../../components/shop/ProductArt.jsx";
import { BUSINESS } from "../../data/business.js";

/* ------------------------------------------------------------------ */
/*  Promo codes                                                        */
/*  Shared with CheckoutPage (order review) and CouponsPage (offers).  */
/* ------------------------------------------------------------------ */

export const PROMOS = {
  MOBILE25: {
    label: "$25 off installation",
    hint: "Applies to the installation line on any order fitted at our South Florida shop.",
  },
  NEWCUSTOMER: {
    label: "10% off tires and wheels",
    hint: "First-time customers. Discount applies to the parts subtotal.",
  },
  FREEDELIVERY: {
    label: "Free shipping",
    hint: "Waives the $29 shipping fee on orders under $500.",
  },
  FLEET15: {
    label: "15% off fleet orders",
    hint: "Parts subtotal of $1,000 or more.",
  },
};

const FREE_SHIP_AT = 500;
const TAX_RATE = 0.07;
const round2 = (n) => Math.round(n * 100) / 100;

const PROMO_STORAGE_KEY = "emt.promo.v1";

/** Persists the applied code so checkout can show it on the review step. */
export function savePromo(code) {
  try {
    if (code) window.localStorage.setItem(PROMO_STORAGE_KEY, code);
    else window.localStorage.removeItem(PROMO_STORAGE_KEY);
  } catch {
    /* blocked storage — the code simply won't survive the page change */
  }
}

export function readSavedPromo() {
  try {
    return window.localStorage.getItem(PROMO_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

/**
 * Validates a code against the current cart and returns the discount split.
 * Returns `{ ok: false, error }` with customer-facing copy when it doesn't apply.
 */
export function evaluatePromo(raw, { subtotal = 0, installTotal = 0, shipping = 0 } = {}) {
  const code = String(raw || "").trim().toUpperCase();
  const miss = { ok: false, code, subtotalOff: 0, installOff: 0, freeShipping: false };

  if (!code) return { ...miss, error: "Enter a promo code first." };
  if (!PROMOS[code]) {
    return {
      ...miss,
      error: `We don't recognize "${code}". Double-check the spelling, or see every live offer on our coupons page.`,
    };
  }

  const hit = (extra) => ({
    ok: true,
    code,
    label: PROMOS[code].label,
    subtotalOff: 0,
    installOff: 0,
    freeShipping: false,
    ...extra,
  });

  switch (code) {
    case "MOBILE25":
      if (installTotal <= 0) {
        return {
          ...miss,
          error:
            "MOBILE25 discounts installation. Switch a set above to ship-to-store install, then apply it again.",
        };
      }
      return hit({ installOff: Math.min(25, installTotal) });

    case "NEWCUSTOMER":
      if (subtotal <= 0) {
        return { ...miss, error: "Add tires or wheels to your cart before applying NEWCUSTOMER." };
      }
      return hit({ subtotalOff: round2(subtotal * 0.1) });

    case "FREEDELIVERY":
      if (shipping <= 0) {
        return {
          ...miss,
          error: `Good news — this order already clears ${money(FREE_SHIP_AT)}, so shipping is free without a code.`,
        };
      }
      return hit({ freeShipping: true });

    case "FLEET15":
      if (subtotal < 1000) {
        return {
          ...miss,
          error: `FLEET15 starts at ${money(1000)} in tires and wheels. You're ${money(
            round2(1000 - subtotal)
          )} short of it.`,
        };
      }
      return hit({ subtotalOff: round2(subtotal * 0.15) });

    default:
      return { ...miss, error: "That code isn't valid on this order." };
  }
}

/** Recomputes the money rail with a promo folded in. Tax follows the discounted base. */
export function summarize({ subtotal, installTotal, shipping }, promo) {
  const subtotalOff = promo?.ok ? promo.subtotalOff : 0;
  const installOff = promo?.ok ? promo.installOff : 0;
  const discount = round2(subtotalOff + installOff);
  const shippingDue = promo?.ok && promo.freeShipping ? 0 : shipping;
  const taxable = Math.max(0, round2(subtotal + installTotal - discount));
  const tax = round2(taxable * TAX_RATE);
  return {
    subtotal,
    installTotal,
    discount,
    shipping: shippingDue,
    tax,
    total: round2(taxable + shippingDue + tax),
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

function CartLine({ line, setQty, remove, addItem }) {
  const href = line.kind === "wheel" ? `/wheels/${line.slug}` : `/tires/${line.slug}`;
  const toggleId = `install-${line.key}`;

  // Installation is part of the line's identity, so flipping it means
  // retiring the old line and re-adding the opposite variant at the same qty.
  function toggleInstall() {
    const { key, qty, ...rest } = line;
    remove(key);
    addItem({ ...rest, install: !line.install }, qty);
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
            <p className="font-display text-xs uppercase tracking-[0.18em] text-smoke">
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
          </div>

          <div className="text-right">
            <p className="font-display text-2xl leading-none">
              {money(line.price * line.qty)}
            </p>
            <p className="mt-1 text-xs text-smoke">{money(line.price)} each</p>
          </div>
        </div>

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
              <label htmlFor={toggleId} className="text-sm leading-snug text-ink">
                <span className="font-display uppercase tracking-wide">
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

function PromoBox({ promo, onApply, onClear }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    const result = onApply(value);
    if (result.ok) {
      setError("");
      setValue("");
    } else {
      setError(result.error);
    }
  }

  if (promo?.ok) {
    return (
      <div className="border-t border-ink/10 pt-5">
        <div className="flex items-start justify-between gap-3 rounded-sm border border-drop/30 bg-drop/5 p-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <Check size={16} aria-hidden className="mt-0.5 shrink-0 text-drop" />
            <div className="min-w-0">
              <p className="font-display text-sm uppercase tracking-wide text-ink">
                {promo.code} applied
              </p>
              <p className="text-xs text-smoke">{promo.label}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            aria-label={`Remove promo code ${promo.code}`}
            className="shrink-0 text-smoke transition-colors hover:text-drop"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border-t border-ink/10 pt-5" noValidate>
      <label htmlFor="promo" className="label">
        Promo code
      </label>
      <div className="flex gap-2">
        <input
          id="promo"
          name="promo"
          type="text"
          autoComplete="off"
          spellCheck="false"
          placeholder="MOBILE25"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError("");
          }}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? "promo-error" : "promo-hint"}
          className="field uppercase"
        />
        <button type="submit" className="btn-dark btn-sm shrink-0">
          Apply
        </button>
      </div>
      {error ? (
        <p id="promo-error" role="alert" className="mt-2 text-xs leading-relaxed text-drop">
          {error}
        </p>
      ) : (
        <p id="promo-hint" className="mt-2 text-xs text-smoke">
          Have one from a mailer or our{" "}
          <Link to="/coupons" className="text-ink underline hover:text-drop">
            current offers
          </Link>
          ? Drop it in here.
        </p>
      )}
    </form>
  );
}

const TRUST = [
  {
    icon: Truck,
    title: "Ships nationwide",
    copy: `Drop-shipped to any address in ${BUSINESS.shipping.area}.`,
  },
  {
    icon: ShieldCheck,
    title: "Fitment checked first",
    copy: "We match sizes to your vehicle before the order is released.",
  },
  {
    icon: CalendarClock,
    title: BUSINESS.poweredBy,
    copy: `A real shop since ${BUSINESS.foundedYear} — call ${BUSINESS.phone}.`,
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CartPage() {
  const { lines, count, subtotal, installTotal, shipping, addItem, setQty, remove } = useCart();
  const safeLines = Array.isArray(lines) ? lines : [];

  const [promo, setPromo] = useState(() => {
    const saved = readSavedPromo();
    return saved ? { ok: true, code: saved, label: PROMOS[saved]?.label || "", subtotalOff: 0, installOff: 0, freeShipping: false } : null;
  });

  // Re-run the saved code against the live cart so a changed cart can invalidate it.
  const applied = useMemo(() => {
    if (!promo?.code) return null;
    const result = evaluatePromo(promo.code, { subtotal, installTotal, shipping });
    return result.ok ? result : null;
  }, [promo, subtotal, installTotal, shipping]);

  const totals = useMemo(
    () => summarize({ subtotal, installTotal, shipping }, applied),
    [subtotal, installTotal, shipping, applied]
  );

  function handleApply(raw) {
    const result = evaluatePromo(raw, { subtotal, installTotal, shipping });
    if (result.ok) {
      setPromo(result);
      savePromo(result.code);
    }
    return result;
  }

  function handleClear() {
    setPromo(null);
    savePromo("");
  }

  const toFreeShip = round2(FREE_SHIP_AT - subtotal);
  const freeShipEarned = totals.shipping === 0;

  return (
    <>
      <Seo
        title="Your Cart"
        description="Review your TireDrop order, choose shipping to your address or free ship-to-store install in South Florida, apply a promo code and check out."
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
            icon={ShoppingCart}
            title="Your cart is empty"
            lede="Pick a set of tires or a new set of wheels and we'll ship them anywhere in the continental US."
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
                    <p className="mt-3 font-display text-base uppercase leading-tight tracking-wide">
                      {title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-smoke">{copy}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Summary rail */}
            <aside aria-label="Order summary" className="min-w-0">
              <div className="card p-6 lg:sticky lg:top-24">
                <h2 className="h3">Order Summary</h2>

                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-smoke">Tires &amp; wheels</dt>
                    <dd className="font-display text-base">{money(totals.subtotal)}</dd>
                  </div>

                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-smoke">Installation at the shop</dt>
                    <dd className="font-display text-base">
                      {totals.installTotal > 0 ? money(totals.installTotal) : "—"}
                    </dd>
                  </div>

                  {applied?.ok && totals.discount > 0 && (
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="flex items-center gap-1.5 text-drop">
                        <Tag size={13} aria-hidden />
                        Discount ({applied.code})
                      </dt>
                      <dd className="font-display text-base text-drop">
                        −{money(totals.discount)}
                      </dd>
                    </div>
                  )}

                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-smoke">Shipping</dt>
                    <dd className="font-display text-base">
                      {freeShipEarned ? (
                        <Badge tone="amber">Free</Badge>
                      ) : (
                        money(totals.shipping)
                      )}
                    </dd>
                  </div>

                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-smoke">Sales tax (7%)</dt>
                    <dd className="font-display text-base">{money(totals.tax)}</dd>
                  </div>
                </dl>

                {!freeShipEarned && toFreeShip > 0 && (
                  <div className="mt-4 rounded-sm bg-fog p-3">
                    <p className="text-xs text-ink">
                      Add <span className="font-display text-drop">{money(toFreeShip)}</span> for
                      free shipping.
                    </p>
                    <div
                      className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10"
                      role="progressbar"
                      aria-label="Progress toward free shipping"
                      aria-valuemin={0}
                      aria-valuemax={FREE_SHIP_AT}
                      aria-valuenow={Math.min(subtotal, FREE_SHIP_AT)}
                    >
                      <div
                        className="h-full bg-drop"
                        style={{ width: `${Math.min(100, (subtotal / FREE_SHIP_AT) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-ink/10 pt-5">
                  <span className="font-display text-lg uppercase tracking-wide">Total</span>
                  <span className="font-display text-3xl leading-none">{money(totals.total)}</span>
                </div>

                <Link to="/checkout" className="btn-primary mt-5 w-full">
                  Checkout
                </Link>
                <p className="mt-3 text-center text-xs leading-relaxed text-smoke">
                  No card is charged online. We confirm fitment and take payment by phone before
                  anything ships.
                </p>

                <div className="mt-5">
                  <PromoBox promo={applied} onApply={handleApply} onClear={handleClear} />
                </div>

                <div className="mt-6 flex items-start gap-2.5 border-t border-ink/10 pt-5">
                  <Wrench size={16} aria-hidden className="mt-0.5 shrink-0 text-smoke" />
                  <p className="text-xs leading-relaxed text-smoke">
                    Questions on fitment or load rating? Call{" "}
                    <a href={BUSINESS.phoneHref} className="text-ink underline hover:text-drop">
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
