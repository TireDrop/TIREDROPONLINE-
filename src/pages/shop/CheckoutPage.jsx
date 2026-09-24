import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Car,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Package,
  Phone,
  ShoppingCart,
  Truck,
  User,
} from "lucide-react";

import {
  Seo,
  Breadcrumbs,
  EmptyState,
  Badge,
} from "../../components/ui/index.jsx";
import { useCart, money } from "../../context/CartContext.jsx";
import { BUSINESS } from "../../data/business.js";
import { submitForm } from "../../data/forms.js";
import {
  evaluatePromo,
  readSavedPromo,
  savePromo,
  summarize,
} from "./CartPage.jsx";

/* ------------------------------------------------------------------ */
/*  Scheduling helpers — the shop is closed Sundays per BUSINESS.hours */
/* ------------------------------------------------------------------ */

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const todayISO = () => toISODate(new Date());

/** Parses at midday so a date-only string never slides a day on DST edges. */
function parseISO(iso) {
  return new Date(`${iso}T12:00:00`);
}

function formatLongDate(iso) {
  if (!iso) return "";
  return parseISO(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const TIME_WINDOWS = [
  { value: "8-10", label: "8:00 – 10:00 AM" },
  { value: "10-12", label: "10:00 AM – 12:00 PM" },
  { value: "12-2", label: "12:00 – 2:00 PM" },
  { value: "2-4", label: "2:00 – 4:00 PM" },
  { value: "4-630", label: "4:00 – 6:30 PM", weekdayOnly: true },
];

function windowsForDate(iso) {
  if (!iso) return TIME_WINDOWS;
  const day = parseISO(iso).getDay();
  // Saturday closes at 4:00 PM, so the late window is weekdays only.
  return day === 6 ? TIME_WINDOWS.filter((w) => !w.weekdayOnly) : TIME_WINDOWS;
}

const windowLabel = (value) =>
  TIME_WINDOWS.find((w) => w.value === value)?.label || "";

const PROPERTY_TYPES = [
  "Single-family home",
  "Townhouse or villa",
  "Condo or apartment complex",
  "Office or business park",
  "Jobsite, lot or warehouse",
];

// Order matters: shipping is the default path, the two local options follow.
const FULFILLMENT = [
  {
    value: "ship",
    icon: Package,
    title: "Ship to my address",
    copy: `Delivered free anywhere in ${BUSINESS.shipping.area}. The delivery estimate is confirmed before payment.`,
  },
  {
    value: "shop",
    icon: Building2,
    title: "Ship free to the shop — we'll fit them",
    copy: `Free delivery to ${BUSINESS.shop.name}, then book an install in the bay. South Florida.`,
  },
  {
    value: "mobile",
    icon: Truck,
    title: "Mobile install at my address",
    copy: "South Florida only. The van comes to your home, office or jobsite and fits them there.",
  },
];

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

const digitsOnly = (s) => String(s).replace(/\D/g, "");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;

function validateContact(f) {
  const e = {};
  if (!f.firstName.trim()) e.firstName = "Enter your first name.";
  if (!f.lastName.trim()) e.lastName = "Enter your last name.";
  if (!f.email.trim())
    e.email = "Enter an email so we can send your confirmation.";
  else if (!EMAIL_RE.test(f.email.trim()))
    e.email = "That email doesn't look right — check for a typo.";
  const phone = digitsOnly(f.phone);
  if (!phone)
    e.phone =
      "Enter a phone number — we call to confirm before your order ships.";
  else if (
    phone.length !== 10 &&
    !(phone.length === 11 && phone.startsWith("1"))
  )
    e.phone = "Enter a 10-digit US phone number, area code first.";
  return e;
}

function validateInstall(f, { hasShopInstall = false } = {}) {
  const e = {};
  if (!f.fulfillment)
    e.fulfillment = "Choose how you want your order delivered.";
  // A line set to "ship free to the shop and we'll fit them" is already
  // carrying an installation charge. Letting the order ship to a house
  // instead bills for a fitting nobody is booked for, and the confirmation
  // then promises both at once.
  else if (f.fulfillment === "ship" && hasShopInstall)
    e.fulfillment =
      "Your cart has a set booked for installation at the shop, which is included in the total below. Choose \u201cShip free to the shop\u201d above, or turn installation off in your cart to have it shipped to you.";

  const needsAddress = f.fulfillment === "mobile" || f.fulfillment === "ship";
  if (needsAddress) {
    if (!f.street.trim()) e.street = "Enter the street address.";
    if (!f.city.trim()) e.city = "Enter the city.";
    if (!f.zip.trim()) e.zip = "Enter a ZIP code.";
    else if (!ZIP_RE.test(f.zip.trim()))
      e.zip = "Enter a 5-digit ZIP code, like 33351.";
  }
  if (f.fulfillment === "mobile" && !f.propertyType) {
    e.propertyType =
      "Tell us what kind of property so the tech brings the right gear.";
  }

  const needsDate = f.fulfillment === "mobile" || f.fulfillment === "shop";
  if (needsDate) {
    if (!f.date) {
      e.date = "Pick a preferred date.";
    } else if (f.date < todayISO()) {
      e.date = "Pick today or a later date.";
    } else if (parseISO(f.date).getDay() === 0) {
      e.date = "We're closed Sundays. Choose Monday through Saturday.";
    }
    if (!f.timeWindow) e.timeWindow = "Pick a time window.";
    else if (!windowsForDate(f.date).some((w) => w.value === f.timeWindow))
      e.timeWindow = "That window isn't available on the date you picked.";
  }
  return e;
}

function validateVehicle(f) {
  const e = {};
  const maxYear = new Date().getFullYear() + 2;
  if (!f.year.trim()) e.year = "Enter the vehicle year.";
  else if (
    !/^\d{4}$/.test(f.year.trim()) ||
    Number(f.year) < 1960 ||
    Number(f.year) > maxYear
  )
    e.year = `Enter a 4-digit year between 1960 and ${maxYear}.`;
  if (!f.make.trim()) e.make = "Enter the make, like Toyota or Ford.";
  if (!f.model.trim()) e.model = "Enter the model, like Camry or F-150.";
  return e;
}

function validateReview(f) {
  const e = {};
  if (!f.agree)
    e.agree = "Please confirm you understand payment is taken by phone.";
  return e;
}

const STEPS = [
  { id: "contact", label: "Contact", icon: User, validate: validateContact },
  {
    id: "install",
    label: "Delivery",
    icon: Package,
    validate: validateInstall,
  },
  { id: "vehicle", label: "Vehicle", icon: Car, validate: validateVehicle },
  {
    id: "review",
    label: "Review",
    icon: ClipboardList,
    validate: validateReview,
  },
];

/* ------------------------------------------------------------------ */
/*  Field primitives                                                   */
/* ------------------------------------------------------------------ */

function TextField({ id, label, error, hint, className = "", ...rest }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-error` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={
          [errId, hintId].filter(Boolean).join(" ") || undefined
        }
        className={`field ${error ? "border-drop" : ""}`}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-smoke">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="mt-1 text-xs text-drop">
          {error}
        </p>
      )}
    </div>
  );
}

function SelectField({ id, label, error, children, className = "", ...rest }) {
  const errId = error ? `${id}-error` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <select
        id={id}
        name={id}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={errId}
        className={`field ${error ? "border-drop" : ""}`}
        {...rest}
      >
        {children}
      </select>
      {error && (
        <p id={errId} role="alert" className="mt-1 text-xs text-drop">
          {error}
        </p>
      )}
    </div>
  );
}

function StepHeading({ step, title, lede, headingRef }) {
  return (
    <div className="mb-6">
      <p className="eyebrow mb-2">
        Step {step} of {STEPS.length}
      </p>
      <h2 className="h2" tabIndex={-1} ref={headingRef}>
        {title}
      </h2>
      {lede && <p className="lede mt-2">{lede}</p>}
    </div>
  );
}

function SummaryRow({ term, value, accent = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={accent ? "text-drop" : "text-smoke"}>{term}</dt>
      <dd className={`font-display text-base ${accent ? "text-drop" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

/** Money rail rendered on the review step and again on the confirmation. */
function OrderSummary({ lines, totals, promoCode }) {
  return (
    <div className="card p-6">
      <h3 className="h3">Order Summary</h3>
      <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
        {lines.map((l) => (
          <li
            key={l.key}
            className="flex items-start justify-between gap-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm text-ink">
                {l.brand} {l.name}
              </p>
              <p className="mt-0.5 text-xs text-smoke">
                {l.size ? `${l.size} · ` : ""}Qty {l.qty}
                {l.install ? " · Install at the shop" : ""}
              </p>
            </div>
            <span className="tnum shrink-0 font-display text-base">
              {money(
                l.price * l.qty + (l.install ? l.installPrice * l.qty : 0),
              )}
            </span>
          </li>
        ))}
      </ul>
      <dl className="tnum mt-4 space-y-2.5 text-sm">
        <SummaryRow term={<>Tires & wheels</>} value={money(totals.subtotal)} />
        <SummaryRow
          term="Installation at the shop"
          value={totals.installTotal > 0 ? money(totals.installTotal) : "—"}
        />
        {totals.discount > 0 && (
          <SummaryRow
            term={`Discount (${promoCode})`}
            value={`−${money(totals.discount)}`}
            accent
          />
        )}
        <SummaryRow
          term="Shipping"
          value="Free"
        />
        <SummaryRow term="Sales tax (7%)" value={money(totals.tax)} />
      </dl>
      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-ink/10 pt-4">
        <span className="font-display text-lg font-bold">Total</span>
        <span className="tnum font-display text-3xl leading-none tracking-tight">
          {money(totals.total)}
        </span>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  fulfillment: "ship",
  street: "",
  city: "",
  zip: "",
  propertyType: "",
  accessNotes: "",
  date: "",
  timeWindow: "",
  year: "",
  make: "",
  model: "",
  trim: "",
  agree: false,
};

/** TD-YYMMDD-XXXX — short enough to read over the phone. */
function makeOrderRef() {
  const d = new Date();
  const stamp = toISODate(d).slice(2).replace(/-/g, "");
  const tail = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TD-${stamp}-${tail}`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CheckoutPage() {
  const { lines, subtotal, installTotal, clear } = useCart();
  const safeLines = Array.isArray(lines) ? lines : [];

  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [placed, setPlaced] = useState(null);
  const [sending, setSending] = useState(false);
  const headingRef = useRef(null);
  // Once the shopper picks a delivery option it is theirs; until then the
  // cart decides the default.
  const fulfillmentTouched = useRef(false);

  const promo = useMemo(() => {
    const code = readSavedPromo();
    if (!code) return null;
    const result = evaluatePromo(code, { subtotal, installTotal });
    return result.ok ? result : null;
  }, [subtotal, installTotal]);

  const totals = useMemo(
    () => summarize({ subtotal, installTotal }, promo),
    [subtotal, installTotal, promo],
  );

  // What the cart already committed to, so step two can refuse a delivery
  // choice that contradicts it.
  const stepContext = useMemo(
    () => ({
      hasShopInstall: Array.isArray(lines) && lines.some((l) => l.install),
    }),
    [lines],
  );

  // Move focus to the new step heading so screen readers and keyboards follow along.
  useEffect(() => {
    headingRef.current?.focus();
  }, [stepIndex, placed]);

  const set = (name, value) => {
    if (name === "fulfillment") fulfillmentTouched.current = true;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e));
  };
  const onInput = (e) => set(e.target.name, e.target.value);

  function goNext() {
    const found = STEPS[stepIndex].validate(form, stepContext);
    const clean = Object.fromEntries(
      Object.entries(found).filter(([, v]) => v),
    );
    setErrors(clean);
    if (Object.keys(clean).length > 0) return;

    if (stepIndex < STEPS.length - 1) {
      // A cart with a set booked for fitting at the shop opens the delivery
      // step on ship-to-store rather than on an option that contradicts it.
      // Done here rather than as an initial value because the cart only comes
      // back from storage after the first render.
      if (
        STEPS[stepIndex + 1].id === "install" &&
        !fulfillmentTouched.current &&
        stepContext.hasShopInstall &&
        form.fulfillment === "ship"
      ) {
        setForm((f) => ({ ...f, fulfillment: "shop" }));
      }
      setStepIndex((i) => i + 1);
      return;
    }

    // Placing the order re-checks every step, in case an edit round-trip broke one.
    const broken = STEPS.findIndex((s) =>
      Object.values(s.validate(form, stepContext)).some(Boolean),
    );
    if (broken !== -1) {
      setErrors(STEPS[broken].validate(form, stepContext));
      setStepIndex(broken);
      return;
    }
    placeOrder();
  }

  async function placeOrder() {
    if (sending) return; // a second click must not place a second order
    const ref = makeOrderRef();

    // The order has to reach the shop, or the reference on the next screen is
    // a number nobody can look up. It rides the same transport as the forms,
    // so one VITE_FORM_ENDPOINT turns orders on with everything else.
    setSending(true);
    const outcome = await submitForm("order", {
      reference: ref,
      placedFor: `${form.firstName} ${form.lastName}`.trim(),
      phone: form.phone,
      email: form.email,
      fulfillment: form.fulfillment,
      address:
        form.fulfillment === "shop"
          ? `${BUSINESS.parent} — ${BUSINESS.shop.full}`
          : [form.street, form.city, form.zip].filter(Boolean).join(", "),
      vehicle: [form.year, form.make, form.model, form.trim]
        .filter(Boolean)
        .join(" "),
      installDate: form.date || "",
      installWindow: form.timeWindow || "",
      promoCode: promo?.code || "",
      items: safeLines
        .map(
          (l) =>
            `${l.qty}x ${l.brand} ${l.name} ${l.size}${l.install ? " (fit at shop)" : ""} — ${money(l.price * l.qty)}`,
        )
        .join("\n"),
      subtotal: money(totals.subtotal),
      installation: money(totals.installTotal),
      shipping: "Free",
      tax: money(totals.tax),
      total: money(totals.total),
    });
    setSending(false);

    setPlaced({
      ref,
      lines: safeLines,
      totals,
      promoCode: promo?.code || "",
      form,
      delivered: outcome.delivered,
      sendError: outcome.error,
    });
    savePromo("");
    clear();
  }

  /* ---------- empty cart ---------- */
  if (!placed && safeLines.length === 0) {
    return (
      <>
        <Seo
          title="Checkout"
          description="Complete your TireDrop order — shipped anywhere in the continental US, or free to our South Florida shop for installation."
        />
        <Breadcrumbs
          trail={[{ label: "Cart", to: "/cart" }, { label: "Checkout" }]}
        />
        <div className="wrap py-14">
          {/* Every other branch of this page opens with an h1. Without one
              here the empty cart is a document whose first heading is an h3,
              so nothing tells a screen reader what page this is. */}
          <h1 className="h1 mb-8">Checkout</h1>
          <EmptyState
            icon={ShoppingCart}
            title="There's nothing to check out"
            lede="Your cart is empty. Add a set of tires or wheels and we'll get them moving."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/tires" className="btn-primary">
                  Shop Tires
                </Link>
                <Link to="/cart" className="btn-outline">
                  Back to Cart
                </Link>
              </div>
            }
          />
        </div>
      </>
    );
  }

  /* ---------- confirmation ---------- */
  if (placed) {
    const f = placed.form;
    const mobile = f.fulfillment === "mobile";
    const ship = f.fulfillment === "ship";

    return (
      <>
        <Seo
          title="Order Received"
          description="Your TireDrop order is in. We call to confirm fitment, lock in delivery or your install window, and take payment."
        />
        <Breadcrumbs
          trail={[{ label: "Cart", to: "/cart" }, { label: "Order Received" }]}
        />

        <div className="wrap py-12 md:py-16">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-start gap-4">
              <CheckCircle2
                size={36}
                aria-hidden
                className="mt-1 shrink-0 text-drop"
              />
              <div className="min-w-0">
                <p className="eyebrow mb-1">
                  {placed.delivered ? "Order received" : "Call to confirm it"}
                </p>
                <h1 className="h1" tabIndex={-1} ref={headingRef}>
                  {placed.delivered
                    ? "Your order is in"
                    : "Finish this by phone"}
                </h1>
                <p className="lede mt-3">
                  {placed.delivered ? (
                    <>
                      Thanks, {f.firstName}. Nothing has been charged yet — we
                      call to confirm fitment and take payment before anything
                      ships.
                    </>
                  ) : (
                    <>
                      Thanks, {f.firstName}. Nothing has been charged — but this
                      order has not reached the shop yet, so call{" "}
                      {BUSINESS.phone} and read out the reference below. Your
                      order is written out underneath it.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="card mt-8 flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="label mb-1">Order reference</p>
                <p className="font-display text-3xl leading-none">
                  {placed.ref}
                </p>
              </div>
              <Badge tone="amber">
                {placed.delivered
                  ? "Awaiting confirmation call"
                  : "Not placed until you call"}
              </Badge>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="card p-6">
                <h2 className="h3">What happens next</h2>
                <ol className="mt-4 space-y-4">
                  {[
                    {
                      title: "We confirm your fitment",
                      copy: `We check the sizes against your ${f.year} ${f.make} ${f.model} before the order is released to the distributor.`,
                    },
                    placed.delivered
                      ? {
                          title: "We call you back",
                          copy: `Expect a call at ${f.phone} to confirm delivery and take payment.`,
                        }
                      : {
                          title: "You call us",
                          copy: `This order did not reach the shop, so nobody is working on it yet. Call ${BUSINESS.phone} with reference ${placed.ref} and we will place it while you are on the line.`,
                        },
                    {
                      title: ship
                        ? "Your order ships out"
                        : mobile
                          ? "The van comes to you"
                          : "We fit them at the shop",
                      copy: ship
                        ? `Your order ships to ${f.street}, ${f.city} ${f.zip} once payment clears. Tracking follows by phone.`
                        : mobile
                          ? `We arrive at ${f.street}, ${f.city} ${f.zip} on ${formatLongDate(
                              f.date,
                            )}, ${windowLabel(f.timeWindow)}.`
                          : `Your order ships free to ${BUSINESS.shop.full}. Meet us there on ${formatLongDate(
                              f.date,
                            )}, ${windowLabel(f.timeWindow)}.`,
                    },
                  ].map((s, i) => (
                    <li key={s.title} className="flex gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-ink font-display text-sm text-bone">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-base font-bold">
                          {s.title}
                        </p>
                        <p className="mt-0.5 text-sm leading-relaxed text-smoke">
                          {s.copy}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mt-6 border-t border-ink/10 pt-5">
                  <p className="text-sm leading-relaxed text-smoke">
                    Need to change the address, the date or the sizes? Call{" "}
                    <a
                      href={BUSINESS.phoneHref}
                      className="font-display text-ink hover:text-drop"
                    >
                      {BUSINESS.phone}
                    </a>{" "}
                    and give them reference {placed.ref}.
                  </p>
                  <a href={BUSINESS.phoneHref} className="btn-dark btn-sm mt-4">
                    <Phone size={15} aria-hidden />
                    Call the shop
                  </a>
                </div>
              </div>

              <OrderSummary
                lines={placed.lines}
                totals={placed.totals}
                promoCode={placed.promoCode}
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/tires" className="btn-outline">
                Back to Shopping
              </Link>
              <Link to="/coupons" className="btn-outline">
                See Current Offers
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ---------- wizard ---------- */
  const step = STEPS[stepIndex];
  const availableWindows = windowsForDate(form.date);

  return (
    <>
      <Seo
        title="Checkout"
        description="Complete your TireDrop order — shipped to your address anywhere in the continental US, or free to our South Florida shop for installation."
      />
      <Breadcrumbs
        trail={[{ label: "Cart", to: "/cart" }, { label: "Checkout" }]}
      />

      <div className="wrap py-10 md:py-14">
        <header className="mb-8">
          <p className="eyebrow mb-2">{BUSINESS.tagline}</p>
          <h1 className="h1">Checkout</h1>
          <p className="lede mt-3 max-w-2xl">
            Four quick steps. No card fields — we confirm fitment and take
            payment over the phone before your order is released.
          </p>
        </header>

        {/* Progress */}
        <nav
          aria-label="Checkout progress"
          className="mb-8 border-y border-ink/10 py-4"
        >
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-3 sm:gap-x-4">
            {STEPS.map((s, i) => {
              const state =
                i < stepIndex ? "done" : i === stepIndex ? "current" : "todo";
              return (
                <li key={s.id} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-sm font-display text-sm ${
                      state === "done"
                        ? "bg-ink text-bone"
                        : state === "current"
                          ? "bg-drop text-bone"
                          : "bg-ink/10 text-smoke"
                    }`}
                  >
                    {state === "done" ? (
                      <CheckCircle2 size={15} aria-hidden />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    aria-current={state === "current" ? "step" : undefined}
                    className={`font-display text-sm font-bold ${
                      state === "todo" ? "text-smoke" : "text-ink"
                    }`}
                  >
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className="hidden h-px w-6 bg-ink/15 sm:block"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              goNext();
            }}
            className="min-w-0"
          >
            {/* ---------- 1. Contact ---------- */}
            {step.id === "contact" && (
              <section>
                <StepHeading
                  step={1}
                  title="Who are we meeting?"
                  lede="We call before your order goes out, so a number you actually answer matters more than anything else on this page."
                  headingRef={headingRef}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    id="firstName"
                    label="First name"
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={onInput}
                    error={errors.firstName}
                  />
                  <TextField
                    id="lastName"
                    label="Last name"
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={onInput}
                    error={errors.lastName}
                  />
                  <TextField
                    id="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={onInput}
                    error={errors.email}
                    hint="Your order confirmation and receipt go here."
                  />
                  <TextField
                    id="phone"
                    label="Mobile phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="(954) 555-0123"
                    value={form.phone}
                    onChange={onInput}
                    error={errors.phone}
                    hint="We text delivery updates and, for local installs, when the van is close."
                  />
                </div>
              </section>
            )}

            {/* ---------- 2. Installation ---------- */}
            {step.id === "install" && (
              <section>
                <StepHeading
                  step={2}
                  title="Where should this go?"
                  lede="Ship it anywhere in the continental US, or — if you are in South Florida — send it free to our shop and let us fit it."
                  headingRef={headingRef}
                />

                <fieldset className="mb-7">
                  <legend className="label mb-2">Delivery option</legend>
                  <div className="grid gap-3">
                    {FULFILLMENT.map(({ value, icon: Icon, title, copy }) => (
                      <label
                        key={value}
                        htmlFor={`fulfillment-${value}`}
                        className={`flex cursor-pointer items-start gap-3 rounded-sm border p-4 transition-colors ${
                          form.fulfillment === value
                            ? "border-drop bg-drop/5"
                            : "border-ink/15 bg-bone hover:border-ink/35"
                        }`}
                      >
                        <input
                          id={`fulfillment-${value}`}
                          type="radio"
                          name="fulfillment"
                          value={value}
                          checked={form.fulfillment === value}
                          onChange={onInput}
                          aria-invalid={errors.fulfillment ? "true" : undefined}
                          aria-describedby={
                            errors.fulfillment ? "fulfillment-error" : undefined
                          }
                          className="mt-1 h-4 w-4 shrink-0 accent-drop"
                        />
                        <Icon
                          size={20}
                          aria-hidden
                          className="mt-0.5 shrink-0 text-drop"
                        />
                        <span className="min-w-0">
                          <span className="block font-display text-base font-bold">
                            {title}
                          </span>
                          <span className="mt-0.5 block text-sm leading-relaxed text-smoke">
                            {copy}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.fulfillment && (
                    <p
                      id="fulfillment-error"
                      role="alert"
                      className="mt-2 text-xs text-drop"
                    >
                      {errors.fulfillment}
                    </p>
                  )}
                </fieldset>

                {form.fulfillment === "shop" && (
                  <div className="card mb-7 flex items-start gap-3 p-5">
                    <MapPin
                      size={20}
                      aria-hidden
                      className="mt-0.5 shrink-0 text-drop"
                    />
                    <div className="min-w-0">
                      <p className="font-display text-base font-bold">
                        {BUSINESS.shop.name}
                      </p>
                      <p className="mt-1 text-sm text-smoke">
                        {BUSINESS.shop.full}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-smoke">
                        Shipping to the shop is free. We call when your order
                        lands and confirm the install window below.
                      </p>
                      <ul className="mt-3 space-y-0.5 text-xs text-smoke">
                        {BUSINESS.hours.map((h) => (
                          <li key={h.days}>
                            <span className="text-ink">{h.days}</span> ·{" "}
                            {h.time}
                          </li>
                        ))}
                      </ul>
                      <a
                        href={BUSINESS.mapsHref}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-sm text-ink underline underline-offset-4 hover:text-drop"
                      >
                        Get directions
                      </a>
                    </div>
                  </div>
                )}

                {(form.fulfillment === "mobile" ||
                  form.fulfillment === "ship") && (
                  <div className="mb-7 grid gap-5 sm:grid-cols-2">
                    <TextField
                      id="street"
                      label={
                        form.fulfillment === "ship"
                          ? "Shipping address"
                          : "Street address"
                      }
                      autoComplete="street-address"
                      className="sm:col-span-2"
                      value={form.street}
                      onChange={onInput}
                      error={errors.street}
                    />
                    <TextField
                      id="city"
                      label="City"
                      autoComplete="address-level2"
                      value={form.city}
                      onChange={onInput}
                      error={errors.city}
                    />
                    <TextField
                      id="zip"
                      label="ZIP code"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="33351"
                      value={form.zip}
                      onChange={onInput}
                      error={errors.zip}
                    />

                    {form.fulfillment === "mobile" && (
                      <>
                        <SelectField
                          id="propertyType"
                          label="Property type"
                          className="sm:col-span-2"
                          value={form.propertyType}
                          onChange={onInput}
                          error={errors.propertyType}
                        >
                          <option value="">Select one…</option>
                          {PROPERTY_TYPES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </SelectField>

                        <div className="sm:col-span-2">
                          <label htmlFor="accessNotes" className="label">
                            Parking &amp; gate notes (optional)
                          </label>
                          <textarea
                            id="accessNotes"
                            name="accessNotes"
                            rows={3}
                            value={form.accessNotes}
                            onChange={onInput}
                            placeholder="Gate code, guard gate name, covered parking, which side of the building — anything that saves the tech a lap."
                            aria-describedby="accessNotes-hint"
                            className="field resize-y"
                          />
                          <p
                            id="accessNotes-hint"
                            className="mt-1 text-xs text-smoke"
                          >
                            The van needs about one parking space plus room to
                            work on one side.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {(form.fulfillment === "mobile" ||
                  form.fulfillment === "shop") && (
                  <fieldset>
                    <legend className="label mb-2">
                      Preferred install appointment
                    </legend>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <TextField
                        id="date"
                        label="Date"
                        type="date"
                        min={todayISO()}
                        value={form.date}
                        onChange={(e) => {
                          set("date", e.target.value);
                          // The late window disappears on Saturdays — drop a stale pick.
                          const stillValid = windowsForDate(
                            e.target.value,
                          ).some((w) => w.value === form.timeWindow);
                          if (!stillValid) set("timeWindow", "");
                        }}
                        error={errors.date}
                        hint="Closed Sundays. Mon–Sat only."
                      />
                      <SelectField
                        id="timeWindow"
                        label="Time window"
                        value={form.timeWindow}
                        onChange={onInput}
                        error={errors.timeWindow}
                      >
                        <option value="">Select a window…</option>
                        {availableWindows.map((w) => (
                          <option key={w.value} value={w.value}>
                            {w.label}
                          </option>
                        ))}
                      </SelectField>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-smoke">
                      Windows are requests, not guarantees. We confirm the exact
                      time on the call, once your order has landed.
                    </p>
                  </fieldset>
                )}
              </section>
            )}

            {/* ---------- 3. Vehicle ---------- */}
            {step.id === "vehicle" && (
              <section>
                <StepHeading
                  step={3}
                  title="What are we working on?"
                  lede="Fitment gets confirmed against your vehicle before anything ships — no surprises when the box arrives."
                  headingRef={headingRef}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    id="year"
                    label="Year"
                    inputMode="numeric"
                    placeholder="2019"
                    value={form.year}
                    onChange={onInput}
                    error={errors.year}
                  />
                  <TextField
                    id="make"
                    label="Make"
                    placeholder="Toyota"
                    value={form.make}
                    onChange={onInput}
                    error={errors.make}
                  />
                  <TextField
                    id="model"
                    label="Model"
                    placeholder="Tacoma"
                    value={form.model}
                    onChange={onInput}
                    error={errors.model}
                  />
                  <TextField
                    id="trim"
                    label="Trim or drivetrain (optional)"
                    placeholder="TRD Off-Road 4WD"
                    value={form.trim}
                    onChange={onInput}
                  />
                </div>

                <div className="card mt-7 flex items-start gap-3 p-5">
                  <Car
                    size={20}
                    aria-hidden
                    className="mt-0.5 shrink-0 text-drop"
                  />
                  <p className="text-sm leading-relaxed text-smoke">
                    <span className="font-display font-bold text-ink">
                      Fitment is confirmed before we ship.
                    </span>{" "}
                    A tech matches your sizes, load rating and TPMS setup to
                    this vehicle. If anything on your order doesn't fit, we call
                    you with options before the order is released — you are
                    never charged for the wrong tire.
                  </p>
                </div>
              </section>
            )}

            {/* ---------- 4. Review ---------- */}
            {step.id === "review" && (
              <section>
                <StepHeading
                  step={4}
                  title="Review your order"
                  lede="Check the details, then send it over. Payment happens on the confirmation call, not here."
                  headingRef={headingRef}
                />

                <div className="divide-y divide-ink/10 border-y border-ink/10">
                  <ReviewBlock
                    title="Contact"
                    onEdit={() => setStepIndex(0)}
                    rows={[
                      ["Name", `${form.firstName} ${form.lastName}`],
                      ["Email", form.email],
                      ["Phone", form.phone],
                    ]}
                  />
                  <ReviewBlock
                    title="Delivery"
                    onEdit={() => setStepIndex(1)}
                    rows={[
                      [
                        "Option",
                        FULFILLMENT.find((o) => o.value === form.fulfillment)
                          ?.title || "—",
                      ],
                      form.fulfillment === "shop"
                        ? ["Ships to", BUSINESS.shop.full]
                        : [
                            "Address",
                            `${form.street}, ${form.city} ${form.zip}`,
                          ],
                      form.fulfillment === "mobile" && [
                        "Property",
                        form.propertyType,
                      ],
                      form.fulfillment === "mobile" &&
                        form.accessNotes.trim() && [
                          "Access notes",
                          form.accessNotes.trim(),
                        ],
                      form.fulfillment !== "ship" && [
                        "Date",
                        formatLongDate(form.date),
                      ],
                      form.fulfillment !== "ship" && [
                        "Window",
                        windowLabel(form.timeWindow),
                      ],
                    ].filter(Boolean)}
                  />
                  <ReviewBlock
                    title="Vehicle"
                    onEdit={() => setStepIndex(2)}
                    rows={[
                      ["Vehicle", `${form.year} ${form.make} ${form.model}`],
                      form.trim.trim() && ["Trim", form.trim.trim()],
                      [
                        "Fitment",
                        "Confirmed by a tech before your order ships",
                      ],
                    ].filter(Boolean)}
                  />
                </div>

                <div className="mt-7 rounded-sm border-2 border-ink/15 bg-bone p-5">
                  <div className="flex items-start gap-3">
                    <Phone
                      size={20}
                      aria-hidden
                      className="mt-0.5 shrink-0 text-drop"
                    />
                    <div className="min-w-0">
                      <p className="font-display text-base font-bold">
                        No card is charged on this site
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-smoke">
                        When you place this order, a team member calls you at{" "}
                        <span className="text-ink">
                          {form.phone || "the number you gave us"}
                        </span>{" "}
                        within one business day to confirm fitment and delivery,
                        then takes payment over the phone or in person at the
                        appointment. We never ask for card details by email or
                        text.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-start gap-2.5 border-t border-ink/10 pt-4">
                    <input
                      id="agree"
                      name="agree"
                      type="checkbox"
                      checked={form.agree}
                      onChange={(e) => set("agree", e.target.checked)}
                      aria-invalid={errors.agree ? "true" : undefined}
                      aria-describedby={
                        errors.agree ? "agree-error" : undefined
                      }
                      className="mt-0.5 h-4 w-4 shrink-0 accent-drop"
                    />
                    <div className="min-w-0">
                      <label
                        htmlFor="agree"
                        className="text-sm leading-relaxed text-ink"
                      >
                        I understand this order is a request, and that{" "}
                        {BUSINESS.name} will call me to confirm fitment and
                        collect payment before anything ships or is scheduled.
                      </label>
                      {errors.agree && (
                        <p
                          id="agree-error"
                          role="alert"
                          className="mt-1 text-xs text-drop"
                        >
                          {errors.agree}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Controls */}
            <div className="mt-9 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-6">
              {stepIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setErrors({});
                    setStepIndex((i) => i - 1);
                  }}
                  className="btn-outline"
                >
                  <ArrowLeft size={16} aria-hidden />
                  Back
                </button>
              ) : (
                <Link to="/cart" className="btn-outline">
                  <ArrowLeft size={16} aria-hidden />
                  Back to Cart
                </Link>
              )}

              <button type="submit" className="btn-primary" disabled={sending}>
                {stepIndex === STEPS.length - 1
                  ? sending
                    ? "Placing…"
                    : "Place Order"
                  : "Continue"}
                <ArrowRight size={16} aria-hidden />
              </button>

              {Object.keys(errors).length > 0 && (
                <p role="alert" className="w-full text-sm text-drop">
                  Fix the highlighted fields above to continue.
                </p>
              )}
            </div>
          </form>

          {/* Summary rail */}
          <aside aria-label="Order summary" className="min-w-0">
            <div className="lg:sticky lg:top-24">
              <OrderSummary
                lines={safeLines}
                totals={totals}
                promoCode={promo?.code || ""}
              />
              <p className="mt-4 text-xs leading-relaxed text-smoke">
                Mounting, balancing, new valve stems and disposal of your old
                tires are included on any line set to install at the shop.{" "}
                <Link to="/cart" className="text-ink underline hover:text-drop">
                  Edit your cart
                </Link>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

/** One titled block of read-back detail on the review step. */
function ReviewBlock({ title, rows, onEdit }) {
  return (
    <div className="py-5">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="font-display text-lg font-bold">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm text-smoke underline underline-offset-4 transition-colors hover:text-drop"
        >
          Edit {title.toLowerCase()}
        </button>
      </div>
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[160px_minmax(0,1fr)]">
        {rows.map(([term, value]) => (
          <React.Fragment key={term}>
            <dt className="text-xs uppercase tracking-[0.09em] text-smoke">
              {term}
            </dt>
            <dd className="text-sm text-ink">{value || "—"}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );
}
