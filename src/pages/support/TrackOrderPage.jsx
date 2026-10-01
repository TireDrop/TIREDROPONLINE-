import React, { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  Package,
  Phone,
  Search,
  Store,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react";
import { BUSINESS } from "../../data/business.js";
import { ApiError, bookInstall, trackOrder } from "../../data/api.js";
import {
  INSTALL_WINDOWS,
  PAID_BOOKING_MAX_DAYS,
  PAID_BOOKING_MIN_DAYS,
  addDays,
  installSlotErrors,
  shopToday,
  weekdayOf,
} from "../../data/booking.js";
import { hasChanges, readFormValues } from "../../data/forms.js";
import { guardFields } from "../../data/formGuard.js";
import { trackEvent } from "../../lib/analytics.js";
import {
  Breadcrumbs,
  FormTrap,
  Input,
  PageHero,
  Section,
  SectionHead,
  Seo,
  Textarea,
} from "../../components/ui/index.jsx";

const EMPTY = { order: "", email: "" };

const ORDER_RE = /^\s*#?\s*\d{1,10}\s*$/;
const REF_RE = /^\s*TD-\d{6}-[A-Z0-9]{6}\s*$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(values) {
  const errors = {};
  const order = values.order.trim();
  if (!order) {
    errors.order = "Enter the order number from your confirmation email.";
  } else if (!ORDER_RE.test(order) && !REF_RE.test(order)) {
    errors.order = "That does not look like an order number (#1001) or a request reference (TD-…).";
  }
  if (!values.email.trim()) {
    errors.email = "Enter the email you used when you ordered.";
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = "That email address does not look complete.";
  }
  return errors;
}

function FieldError({ id, children }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-xs text-drop">
      <AlertCircle size={14} aria-hidden className="mt-px shrink-0" />
      {children}
    </p>
  );
}

const placed = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
};

const PAYMENT = {
  paid: "Paid",
  refunded: "Refunded",
  partially_refunded: "Partly refunded",
  pending: "Payment pending",
  authorized: "Payment authorized",
  partially_paid: "Partly paid",
  voided: "Payment voided",
  expired: "Payment expired",
};

const FULFILLMENT = {
  unfulfilled: "Not shipped yet",
  open: "Not shipped yet",
  in_progress: "Being prepared",
  pending_fulfillment: "Being prepared",
  partially_fulfilled: "Partly shipped",
  fulfilled: "Shipped",
  on_hold: "On hold",
  scheduled: "Scheduled",
  restocked: "Returned to stock",
  request_declined: "Being reviewed",
};

const DELIVERY = {
  ship: "Shipped to your address",
  "ship-to-store": `Ship to store & install — ${BUSINESS.parent}, ${BUSINESS.shop.city}`,
  mobile: "Mobile install at your address",
  pickup: "Pickup",
};

const nice = (map, key) =>
  (key && map[key]) ||
  (key ? key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()) : "—");

/**
 * The customer's request, once it is in: the day and window they asked for
 * (not an appointment; the shop confirms the time), where, and the phone.
 */
function InstallRequested({ booking, install, already = false }) {
  const where =
    install === "mobile"
      ? `Mobile install at the address on your order · ${BUSINESS.phone}`
      : `${BUSINESS.parent}, ${BUSINESS.shop.full} · ${BUSINESS.phone}`;
  return (
    <div
      className="mt-6 rounded-sm border border-drop/30 bg-drop/5 p-5"
      data-testid="install-requested"
      role="status"
    >
      <h4 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
        <CheckCircle2 size={20} aria-hidden className="shrink-0 text-drop" />
        {already ? "Install already requested" : "Install requested"}
      </h4>
      <p className="mt-1.5 text-sm leading-relaxed text-ink">
        {booking?.dayLabel ? (
          <>
            Your install request is in:{" "}
            <strong data-testid="install-requested-when">
              {booking.dayLabel}, {booking.windowLabel}
            </strong>
            .
          </>
        ) : (
          "Your install request is in."
        )}{" "}
        {where}. We confirm the exact time with you before then.
      </p>
      {booking?.notes && (
        <p className="mt-2 text-xs text-smoke">Your notes: {booking.notes}</p>
      )}
      <p className="mt-3 text-xs text-smoke">
        Need a different day? Call{" "}
        <a href={BUSINESS.phoneHref} className="text-drop underline">
          {BUSINESS.phone}
        </a>
        .
      </p>
    </div>
  );
}

const EMPTY_SLOT = { day: "", window: "", notes: "" };

/**
 * The inline booking: pick a day and window, add a note, send. POST
 * /api/book-install books it ON the order (tag install-booked, note line,
 * lead to info@), checked again on the server against the order number and
 * the email /track just matched. The same day and window rules as /schedule
 * (src/data/booking.js): tomorrow to 60 days out, Florida time, no Sunday,
 * 4 – 6 PM weekdays only.
 */
function InstallBookingForm({ orderName, email, install, onBooked }) {
  const [values, setValues] = useState(EMPTY_SLOT);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState(null);
  const today = shopToday();
  const first = addDays(today, PAID_BOOKING_MIN_DAYS);
  const last = addDays(today, PAID_BOOKING_MAX_DAYS);
  const saturday = weekdayOf(values.day) === 6;

  const set = (key, value) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      // Saturday closes at 4:00 PM: drop a late window already picked.
      if (key === "day" && weekdayOf(value) === 6) {
        const w = INSTALL_WINDOWS.find((x) => x.value === prev.window);
        if (w?.weekdayOnly) next.window = "";
      }
      return next;
    });
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (sending) return;
    const formElement = event.currentTarget;
    const { values: current, changed } = readFormValues(formElement, values);
    if (hasChanges(changed)) setValues((prev) => ({ ...prev, ...changed }));
    const found = installSlotErrors(
      { date: current.day, window: current.window },
      { today, minDays: PAID_BOOKING_MIN_DAYS, maxDays: PAID_BOOKING_MAX_DAYS },
    );
    const next = { day: found.date, window: found.window };
    setErrors(next);
    if (next.day || next.window) {
      document.getElementById(next.day ? "install-day" : "install-window")?.focus();
      return;
    }
    const guard = guardFields(formElement);
    setSending(true);
    setFailure(null);
    try {
      const data = await bookInstall({
        order: orderName,
        email,
        day: current.day,
        window: current.window,
        notes: current.notes.trim(),
        ...guard,
      });
      if (data.alreadyBooked !== true) {
        trackEvent("install_booking", { install_type: install, method: "inline" });
      }
      onBooked({ booking: data.booking, already: data.alreadyBooked === true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && (err.field === "day" || err.field === "window")) {
        setErrors({ [err.field]: err.message });
      } else if (err instanceof ApiError) {
        setFailure(err.message);
      } else {
        setFailure(
          `We couldn't save your install request just now, so it is not in yet. Try again in a minute, or call ${BUSINESS.phone}.`,
        );
      }
    }
    setSending(false);
  };

  const hint =
    install === "mobile"
      ? "Pick the day and arrival window you would like for the mobile install."
      : `Pick the day and time you would like for the install at our ${BUSINESS.shop.city} shop.`;

  return (
    <div
      className="mt-6 rounded-sm border border-drop/30 bg-drop/5 p-5"
      data-testid="schedule-install"
    >
      <h4 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
        <CalendarDays size={20} aria-hidden className="shrink-0 text-drop" />
        Schedule your install
      </h4>
      <p className="mt-1.5 text-sm leading-relaxed text-smoke">
        Your order is paid. {hint} This is a request: we confirm the exact time
        with you before then.
      </p>
      <form noValidate onSubmit={handleSubmit} className="relative mt-4 grid gap-5">
        <FormTrap id="install-website" />
        <div className="max-w-xs">
          <label className="label" htmlFor="install-day">
            Preferred day
          </label>
          <Input
            id="install-day"
            name="day"
            type="date"
            min={first}
            max={last}
            className="field"
            value={values.day}
            onChange={(e) => set("day", e.target.value)}
            aria-invalid={errors.day ? "true" : undefined}
            aria-describedby={errors.day ? "install-day-error" : "install-day-hint"}
          />
          {errors.day ? (
            <FieldError id="install-day-error">{errors.day}</FieldError>
          ) : (
            <p id="install-day-hint" className="mt-1.5 text-xs text-smoke">
              Monday – Saturday, from tomorrow. Closed Sunday.
            </p>
          )}
        </div>

        <fieldset>
          <legend className="label">Time window</legend>
          <div
            id="install-window"
            tabIndex={-1}
            className="grid gap-2 sm:grid-cols-2"
            aria-describedby={errors.window ? "install-window-error" : undefined}
          >
            {INSTALL_WINDOWS.map((slot) => {
              const unavailable = slot.weekdayOnly && saturday;
              const selected = values.window === slot.value;
              return (
                <label
                  key={slot.value}
                  htmlFor={`install-window-${slot.value}`}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-sm border bg-bone px-3 py-2.5 text-sm ${
                    selected ? "border-drop" : "border-ink/15 hover:border-ink/40"
                  } ${unavailable ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <Input
                    type="radio"
                    id={`install-window-${slot.value}`}
                    name="window"
                    value={slot.value}
                    checked={selected}
                    disabled={unavailable}
                    onChange={() => set("window", slot.value)}
                    className="shrink-0 accent-drop"
                  />
                  <Clock size={14} aria-hidden className="shrink-0 text-drop" />
                  <span className="text-ink">{slot.label}</span>
                  {unavailable && (
                    <span className="sr-only">Not available Saturday</span>
                  )}
                </label>
              );
            })}
          </div>
          {errors.window && (
            <FieldError id="install-window-error">{errors.window}</FieldError>
          )}
        </fieldset>

        <div>
          <label className="label" htmlFor="install-notes">
            Notes{" "}
            <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <Textarea
            id="install-notes"
            name="notes"
            rows={2}
            maxLength={500}
            className="field"
            placeholder="Locking lug nuts, a second day that also works, anything we should know"
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>

        {failure && (
          <p role="alert" className="flex items-start gap-1.5 text-sm text-drop">
            <AlertCircle size={16} aria-hidden className="mt-0.5 shrink-0" />
            {failure}
          </p>
        )}

        <div>
          <button
            type="submit"
            className="btn-primary btn-sm"
            disabled={sending}
            aria-busy={sending || undefined}
          >
            <CalendarDays size={16} aria-hidden />
            {sending ? "Sending…" : "Request this day and window"}
          </button>
        </div>
      </form>
      <p className="mt-4 text-xs text-smoke">
        Rather book by phone? Call{" "}
        <a href={BUSINESS.phoneHref} className="text-drop underline">
          {BUSINESS.phone}
        </a>{" "}
        and mention order {orderName}.
      </p>
    </div>
  );
}

/**
 * "Schedule your install" for a paid order that involves installation. The
 * server decides whether there is one (`order.booking`, api/_lib/booking.js)
 * and which:
 *   booked    the day and window the customer already requested;
 *   external  INSTALL_BOOKING_URL (Tire Guru), already filled in for this
 *             order: the only thing shown;
 *   internal  the inline booking form (POST /api/book-install).
 */
function ScheduleInstall({ booking, orderName, email }) {
  const [done, setDone] = useState(null);
  if (booking.mode === "booked") {
    return <InstallRequested booking={booking.booking} install={booking.install} />;
  }
  if (done) {
    return (
      <InstallRequested booking={done.booking} install={booking.install} already={done.already} />
    );
  }
  if (booking.mode === "external") {
    const mobile = booking.install === "mobile";
    return (
      <div
        className="mt-6 rounded-sm border border-drop/30 bg-drop/5 p-5"
        data-testid="schedule-install"
      >
        <h4 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <CalendarDays size={20} aria-hidden className="shrink-0 text-drop" />
          Schedule your install
        </h4>
        <p className="mt-1.5 text-sm leading-relaxed text-smoke">
          {mobile
            ? "Your order is paid. Pick a day and arrival window for the mobile install; we confirm the time with you by phone."
            : `Your order is paid. Pick the day and time you would like for the install at our ${BUSINESS.shop.city} shop; we confirm it with you before then.`}
        </p>
        <a
          href={booking.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent("install_booking", { install_type: booking.install, method: "external" })
          }
          className="btn-primary btn-sm mt-4"
        >
          <CalendarDays size={16} aria-hidden />
          Schedule your install
          <ExternalLink size={14} aria-hidden />
        </a>
        <p className="mt-3 text-xs text-smoke">
          Rather book by phone? Call{" "}
          <a href={BUSINESS.phoneHref} className="text-drop underline">
            {BUSINESS.phone}
          </a>{" "}
          and mention order {orderName}.
        </p>
      </div>
    );
  }
  return (
    <InstallBookingForm
      orderName={orderName}
      email={email}
      install={booking.install}
      onBooked={setDone}
    />
  );
}

/** One line saying where the order stands, most advanced state first. */
function headline(order) {
  if (order.cancelled) {
    return {
      Icon: XCircle,
      tone: "amber",
      title: "This order was cancelled",
      text:
        order.financialStatus === "refunded"
          ? "It has been refunded to the card you paid with."
          : "If you did not expect that, call the shop and we will look into it.",
    };
  }
  // A ship-to-store order is marked fulfilled at the shop, at install time;
  // until then its inbound tracking is the shop's, not the customer's.
  if (order.delivery === "ship-to-store" && order.fulfillmentStatus === "fulfilled") {
    return {
      Icon: CheckCircle2,
      tone: "drop",
      title: "Complete",
      text: "The shop has marked this order done. Questions about the install? Call us.",
    };
  }
  if (
    order.delivery !== "ship-to-store" &&
    (order.tracking.length || order.fulfillmentStatus === "fulfilled")
  ) {
    return {
      Icon: Truck,
      tone: "drop",
      title: "Shipped",
      text: order.tracking.length
        ? "Follow it with the carrier using the tracking below."
        : "Tracking is on the shipping email we sent you.",
    };
  }
  if (order.supplier === "inbound-to-store") {
    return {
      Icon: Store,
      tone: "drop",
      title: `On its way to our ${BUSINESS.shop.city} shop`,
      text: "We will call you to set up the install as soon as it arrives.",
    };
  }
  if (order.supplier === "ordered") {
    return {
      Icon: Package,
      tone: "drop",
      title: "Ordered from our supplier",
      text:
        order.delivery === "ship-to-store"
          ? `Your tires are being sent to our ${BUSINESS.shop.city} shop. Tracking shows here once they ship.`
          : "Tracking shows here as soon as the warehouse ships it.",
    };
  }
  if (order.financialStatus === "paid") {
    return {
      Icon: CheckCircle2,
      tone: "drop",
      title: "Payment received",
      text: "We are placing your order with our supplier now.",
    };
  }
  return {
    Icon: ClipboardList,
    tone: "amber",
    title: "Order received",
    text: "It moves on as soon as payment clears.",
  };
}

function OrderResult({ order, email }) {
  const h = headline(order);
  const date = placed(order.createdAt);
  return (
    <div
      className={`card border-l-4 p-6 md:p-8 ${h.tone === "amber" ? "border-l-amber" : "border-l-drop"}`}
      role="status"
    >
      <p className="eyebrow mb-2 text-smoke">
        Order {order.name}
        {date && <> · Placed {date}</>}
      </p>
      <h3 className="h3 flex items-center gap-2.5">
        <h.Icon size={24} aria-hidden className="shrink-0 text-drop" />
        {h.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-smoke">{h.text}</p>

      {order.booking && (
        <ScheduleInstall
          key={`${order.name}|${email}`}
          booking={order.booking}
          orderName={order.name}
          email={email}
        />
      )}

      <dl className="mt-6 grid gap-4 border-t border-ink/10 pt-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="label">Payment</dt>
          <dd className="text-ink">{nice(PAYMENT, order.financialStatus)}</dd>
        </div>
        <div>
          <dt className="label">Shipping</dt>
          <dd className="text-ink">
            {nice(FULFILLMENT, order.fulfillmentStatus)}
          </dd>
        </div>
        {order.delivery && (
          <div className="sm:col-span-2">
            <dt className="label">Delivery</dt>
            <dd className="text-ink">{DELIVERY[order.delivery]}</dd>
          </div>
        )}
        {order.lines.length > 0 && (
          <div className="sm:col-span-2">
            <dt className="label">Items</dt>
            <dd>
              <ul className="space-y-1 text-ink">
                {order.lines.map((l, i) => (
                  <li key={`${l.title}-${i}`} className="flex gap-2">
                    <span className="tnum shrink-0 text-smoke">
                      {l.quantity}&times;
                    </span>
                    <span>{l.title}</span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        {order.tracking.length > 0 && (
          <div className="sm:col-span-2">
            <dt className="label">Tracking</dt>
            <dd>
              <ul className="space-y-2">
                {order.tracking.map((t) => (
                  <li
                    key={t.number}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1"
                  >
                    <span className="text-ink">
                      {t.company ? `${t.company} ` : ""}
                      <span className="tnum break-all">{t.number}</span>
                    </span>
                    {t.url && (
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-drop underline"
                      >
                        Track with {t.company || "the carrier"}
                        <ExternalLink size={13} aria-hidden />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function RequestResult({ request }) {
  const date = placed(request.createdAt);
  let title = "We have your request";
  let text =
    "Request received: we'll confirm price and availability, then email you a secure payment link.";
  if (request.status === "invoice_sent") {
    title = "Payment link sent";
    text =
      "We confirmed price and availability and emailed you a secure payment link. Your order goes ahead as soon as it is paid.";
  } else if (request.status === "completed") {
    title = request.orderName
      ? `Paid — now order ${request.orderName}`
      : "Paid";
    text = request.orderName
      ? `Thanks. Look up order ${request.orderName} with the same email to follow it from here.`
      : "Thanks. Your confirmation email has the order number to follow it from here.";
  }
  return (
    <div className="card border-l-4 border-l-drop p-6 md:p-8" role="status">
      <p className="eyebrow mb-2 text-smoke">
        Request {request.ref}
        {date && <> · Sent {date}</>}
      </p>
      <h3 className="h3 flex items-center gap-2.5">
        <ClipboardList size={24} aria-hidden className="shrink-0 text-drop" />
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-smoke">{text}</p>
      {(request.delivery || request.lines.length > 0) && (
        <dl className="mt-6 grid gap-4 border-t border-ink/10 pt-5 text-sm">
          {request.delivery && (
            <div>
              <dt className="label">Delivery</dt>
              <dd className="text-ink">{DELIVERY[request.delivery]}</dd>
            </div>
          )}
          {request.lines.length > 0 && (
            <div>
              <dt className="label">Items</dt>
              <dd>
                <ul className="space-y-1 text-ink">
                  {request.lines.map((l, i) => (
                    <li key={`${l.title}-${i}`} className="flex gap-2">
                      <span className="tnum shrink-0 text-smoke">
                        {l.quantity}&times;
                      </span>
                      <span>{l.title}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}

function Miss({ result }) {
  const notFound = result.kind === "not-found";
  return (
    <div className="card border-l-4 border-l-amber p-6 md:p-8" role="alert">
      <h3 className="h3 flex items-center gap-2.5">
        <Search size={22} aria-hidden className="shrink-0 text-drop" />
        {notFound ? "We couldn't find that order" : "We couldn't look that up"}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-smoke">
        {notFound
          ? "Check the order number and the email against your confirmation email — both have to match what is on the order. Orders placed on the phone may be under a different email."
          : result.message}
      </p>
      <a href={BUSINESS.phoneHref} className="btn-primary btn-sm mt-5">
        <Phone size={16} aria-hidden />
        Call {BUSINESS.phone}
      </a>
    </div>
  );
}

function TrackForm() {
  // /track?order=%231001 (the order confirmation email links here): the
  // order number is filled in. Only the number: the email is typed, never
  // taken from a link.
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState(() => {
    const linked = (searchParams.get("order") ?? "").trim().slice(0, 30);
    return ORDER_RE.test(linked) || REF_RE.test(linked)
      ? { ...EMPTY, order: linked }
      : EMPTY;
  });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);

  const update = (field) => (event) => {
    const { value } = event.target;
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (sending) return;
    const formElement = event.currentTarget;
    // What is in the fields, including anything filled in without an input
    // event, which state never saw.
    const { values: current, changed } = readFormValues(formElement, values);
    if (hasChanges(changed)) setValues((prev) => ({ ...prev, ...changed }));
    const found = validate(current);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const website = formElement.elements.namedItem("website")?.value ?? "";
    setSending(true);
    setResult(null);
    let next;
    try {
      const data = await trackOrder({
        order: current.order.trim(),
        email: current.email.trim(),
        website,
      });
      next = data.kind === "request"
        ? { kind: "request", request: data.request }
        : { kind: "order", order: data.order, email: current.email.trim() };
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        next = { kind: "not-found" };
      } else if (err instanceof ApiError) {
        next = { kind: "error", message: err.message };
      } else {
        next = {
          kind: "error",
          message:
            "Order lookup is not answering right now. Call the shop and we will pull the order up while you are on the phone.",
        };
      }
    }
    setSending(false);
    setResult(next);
    // Move focus to the answer, so a screen reader hears it and a phone
    // scrolls to it.
    requestAnimationFrame(() => resultRef.current?.focus());
  };

  return (
    <div className="space-y-6">
      <form noValidate onSubmit={handleSubmit} className="card relative p-6 md:p-8">
        <FormTrap id="track-website" />
        <h2 className="h3 mb-1">Look up an order</h2>
        <p className="mb-6 text-sm text-smoke">
          Both are on your order confirmation email.
        </p>

        <div className="grid gap-5">
          <div>
            <label className="label" htmlFor="track-order">
              Order number
            </label>
            <Input
              id="track-order"
              name="order"
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="field"
              placeholder="#1001 or TD-260929-ABC234"
              value={values.order}
              onChange={update("order")}
              aria-invalid={errors.order ? "true" : undefined}
              aria-describedby={errors.order ? "track-order-error" : "track-order-hint"}
            />
            {errors.order ? (
              <FieldError id="track-order-error">{errors.order}</FieldError>
            ) : (
              <p id="track-order-hint" className="mt-1.5 text-xs text-smoke">
                Paid orders have a number like #1001. An order request has a
                reference that starts with TD-.
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="track-email">
              Email
            </label>
            <Input
              id="track-email"
              name="email"
              type="email"
              autoComplete="email"
              className="field"
              placeholder="you@example.com"
              value={values.email}
              onChange={update("email")}
              aria-invalid={errors.email ? "true" : undefined}
              aria-describedby={errors.email ? "track-email-error" : undefined}
            />
            {errors.email && (
              <FieldError id="track-email-error">{errors.email}</FieldError>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary mt-7 w-full sm:w-auto"
          disabled={sending}
        >
          <Search size={17} aria-hidden />
          {sending ? "Looking it up…" : "Track Order"}
        </button>
      </form>

      <div ref={resultRef} tabIndex={-1} className="outline-none" aria-live="polite">
        {result?.kind === "order" && (
          <OrderResult order={result.order} email={result.email} />
        )}
        {result?.kind === "request" && <RequestResult request={result.request} />}
        {(result?.kind === "not-found" || result?.kind === "error") && (
          <Miss result={result} />
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <>
      <Seo
        title="Track Your Order"
        description={`Check where your ${BUSINESS.name} order stands: payment, shipping and tracking. Enter your order number and email, or call ${BUSINESS.phone}.`}
        noindex
      />

      <PageHero
        eyebrow="Order Status"
        title="Where are my tires?"
        lede="Enter your order number and the email you ordered with. You'll see where it stands — paid, ordered from our supplier, shipped — with tracking as soon as there is some."
      >
        <a href={BUSINESS.phoneHref} className="btn-primary">
          <Phone size={18} aria-hidden />
          Call {BUSINESS.phone}
        </a>
      </PageHero>

      <Breadcrumbs trail={[{ label: "Track Your Order" }]} />

      <Section className="bg-bone">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
          <TrackForm />

          <div>
            <SectionHead
              eyebrow="Other ways"
              title="Rather talk to someone?"
              lede="The phone reaches the same people who place and ship your order. They can pull it up while you are on the line."
            />
            <ul className="space-y-5">
              <li className="card border-l-4 border-l-drop p-6">
                <h3 className="h3 mb-2 flex items-center gap-2">
                  <Phone size={20} aria-hidden className="text-drop" />
                  Call the shop
                </h3>
                <a
                  href={BUSINESS.phoneHref}
                  className="font-display text-2xl text-ink hover:text-drop"
                >
                  {BUSINESS.phone}
                </a>
                <p className="mt-2 text-sm text-smoke">
                  Changes, cancellations, or an order that needs to move
                  before it ships: call rather than wait.
                </p>
              </li>
              <li className="card p-6">
                <h3 className="h3 mb-2 flex items-center gap-2">
                  <UserRound size={20} aria-hidden className="text-drop" />
                  Your account
                </h3>
                <p className="text-sm text-smoke">
                  Sign in to see every order you have placed, with receipts,
                  in one place.
                </p>
                <a href={BUSINESS.accountUrl} className="btn-outline btn-sm mt-4">
                  See full order history
                </a>
              </li>
              <li className="card p-6">
                <h3 className="h3 mb-2 flex items-center gap-2">
                  <Truck size={20} aria-hidden className="text-drop" />
                  How shipping works
                </h3>
                <p className="text-sm text-smoke">
                  Where tires ship from, ship-to-store installs, and what
                  happens if something shows up wrong.
                </p>
                <Link to="/shipping" className="btn-outline btn-sm mt-4">
                  Shipping &amp; returns
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </Section>
    </>
  );
}
