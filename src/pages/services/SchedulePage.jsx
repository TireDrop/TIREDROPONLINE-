import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  Phone,
  Truck,
  Warehouse,
} from "lucide-react";

import {
  Badge,
  FormTrap,
  Input,
  PageHero,
  Section,
  Seo,
  Textarea,
} from "../../components/ui/index.jsx";
import { useHydrated } from "../../lib/useHydrated.js";
import { BUSINESS } from "../../data/business.js";
import {
  MOBILE_AREA_ERROR,
  SERVICE_AREA_LABEL,
  isInServiceArea,
} from "../../data/serviceArea.js";
import {
  CONTACT_EMAIL,
  hasChanges,
  readFormValues,
  submitForm,
  useFormsWired,
} from "../../data/forms.js";
import { SERVICES, getService } from "../../data/services.js";
import { recallVehicle } from "../../data/vehicles.js";
import VehicleSelect, {
  vehicleErrors,
} from "../../components/shop/VehicleSelect.jsx";

const STEP_LABELS = ["Service", "Vehicle", "Location", "Time", "Contact"];
const LAST_STEP = STEP_LABELS.length;

// Manufacturers sell next year's models well before the year turns, so the
// ceiling runs ahead of today. Derived rather than written down, because a
// hardcoded year silently starts rejecting real cars — and checkout already
// computes it this way, so the two pages agreed on nothing but the number.
const MAX_MODEL_YEAR = new Date().getFullYear() + 2;

// Arrival windows. The 4–6 PM slot only exists Mon–Fri; the shop closes at 4 on
// Saturday and is closed Sunday, per BUSINESS.hours.
const TIME_WINDOWS = [
  { value: "8-10am", label: "8:00 – 10:00 AM" },
  { value: "10-12pm", label: "10:00 AM – 12:00 PM" },
  { value: "12-2pm", label: "12:00 – 2:00 PM" },
  { value: "2-4pm", label: "2:00 – 4:00 PM" },
  { value: "4-6pm", label: "4:00 – 6:00 PM", weekdayOnly: true },
];

const EMPTY_FORM = {
  service: "",
  year: "",
  make: "",
  model: "",
  tireSize: "",
  locationType: "mobile",
  address: "",
  city: "",
  zip: "",
  parkingNotes: "",
  date: "",
  window: "",
  name: "",
  phone: "",
  email: "",
  notes: "",
};

function toIsoDate(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

/** Parses a yyyy-mm-dd value as a local date so timezones cannot shift the day. */
function parseLocalDate(value) {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatLongDate(value) {
  const date = parseLocalDate(value);
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function makeReference(date = new Date()) {
  const stamp = toIsoDate(date).replace(/-/g, "").slice(2);
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let tail = "";
  for (let i = 0; i < 4; i += 1) {
    tail += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `TD-${stamp}-${tail}`;
}

function digitsOnly(value) {
  return value.replace(/\D/g, "");
}

function validateStep(step, form) {
  const errors = {};
  const service = getService(form.service);

  if (step === 1 && !form.service) {
    errors.service =
      "Choose the service you need so we send the right tech and parts.";
  }

  if (step === 2) {
    Object.assign(
      errors,
      vehicleErrors(form, {
        year: "Choose your vehicle's model year.",
        yearRange: `Enter a four-digit year between 1960 and ${MAX_MODEL_YEAR}.`,
        make: "Choose the make, for example Toyota.",
        model: "Choose the model, for example Camry.",
      }),
    );
  }

  if (step === 3 && form.locationType === "mobile") {
    if (!form.address.trim())
      errors.address = "We need a street address to route the van.";
    if (!form.city.trim()) errors.city = "Enter the city.";
    // The van covers Miami-Dade, Broward and Palm Beach, decided by ZIP with
    // the same rule as checkout and the api (src/data/serviceArea.js).
    if (!/^\d{5}(-\d{4})?$/.test(form.zip.trim()))
      errors.zip = "Enter a five-digit ZIP code.";
    else if (!isInServiceArea(form.zip)) errors.zip = MOBILE_AREA_ERROR;
  }

  if (step === 4) {
    if (!form.date) {
      errors.date = "Pick the day you want us.";
    } else {
      const picked = parseLocalDate(form.date);
      const today = parseLocalDate(toIsoDate(new Date()));
      if (!picked) {
        errors.date = "Enter a valid date.";
      } else if (picked < today) {
        errors.date = "That date has already passed. Pick today or later.";
      } else if (picked.getDay() === 0) {
        errors.date = "We are closed Sunday. Pick Monday through Saturday.";
      }
    }
    if (!form.window) {
      errors.window = "Choose an arrival window.";
    } else {
      const picked = form.date ? parseLocalDate(form.date) : null;
      const chosen = TIME_WINDOWS.find((w) => w.value === form.window);
      if (picked && chosen?.weekdayOnly && picked.getDay() === 6) {
        errors.window = "Saturday closes at 4:00 PM. Choose an earlier window.";
      }
    }
  }

  if (step === 5) {
    if (!form.name.trim()) errors.name = "Tell us who to ask for on arrival.";
    if (digitsOnly(form.phone).length < 10) {
      errors.phone = "Enter a 10-digit phone number we can reach you at.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      errors.email = "Enter a valid email so we can send your confirmation.";
    }
  }

  // Defensive: a non-mobile service can never be booked as a mobile visit.
  if (
    step === 3 &&
    service &&
    !service.mobile &&
    form.locationType !== "shop"
  ) {
    errors.locationType = "This service is in-shop only.";
  }

  return errors;
}

/** Inline field error, wired to the input through aria-describedby. */
function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 flex items-start gap-1.5 text-xs text-drop"
    >
      <AlertCircle size={14} aria-hidden className="mt-px shrink-0" />
      {message}
    </p>
  );
}

function TextField({ id, label, value, onChange, error, optional, ...rest }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {optional && (
          <span className="ml-1 normal-case tracking-normal">(optional)</span>
        )}
      </label>
      <Input
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function ProgressBar({ step }) {
  return (
    <ol className="flex flex-wrap gap-x-2 gap-y-3 sm:flex-nowrap sm:gap-3">
      {STEP_LABELS.map((label, i) => {
        const number = i + 1;
        const done = number < step;
        const current = number === step;
        return (
          <li
            key={label}
            className="flex min-w-0 flex-1 basis-[30%] flex-col gap-2 sm:basis-0"
            aria-current={current ? "step" : undefined}
          >
            <span
              className={`h-1 w-full rounded-sm ${
                done || current ? "bg-drop" : "bg-ink/15"
              }`}
            />
            <span className="flex items-center gap-1.5 truncate font-display text-[13px] font-bold tracking-[-0.005em]">
              {done ? (
                <Check size={13} aria-hidden className="shrink-0 text-drop" />
              ) : (
                <span className={current ? "text-drop" : "text-smoke"}>
                  {number}.
                </span>
              )}
              <span className={current ? "text-ink" : "text-smoke"}>
                {label}
              </span>
              {done && <span className="sr-only">completed</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function SummaryRow({ term, children }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink/10 py-3 last:border-0">
      <dt className="label mb-0">{term}</dt>
      <dd className="min-w-0 text-sm text-ink">{children}</dd>
    </div>
  );
}

/**
 * Read-only recap of every answer, shown before submit and again after.
 *
 * `callOrder` leads with the appointment rather than the service: when nothing
 * was sent, this recap is a script the visitor reads down the phone, and the
 * day and window are what the person on the other end needs first.
 */
function BookingSummary({ form, callOrder = false }) {
  const service = getService(form.service);
  const windowLabel = TIME_WINDOWS.find((w) => w.value === form.window)?.label;

  const rows = {
    when: (
      <SummaryRow key="when" term="When">
        {formatLongDate(form.date)}
        {windowLabel && ` · ${windowLabel}`}
      </SummaryRow>
    ),
    service: (
      <SummaryRow key="service" term="Service">
        {service
          ? `${service.name} — from $${service.priceFrom} ${service.priceUnit}`
          : "—"}
      </SummaryRow>
    ),
    vehicle: (
      <SummaryRow key="vehicle" term="Vehicle">
        {[form.year, form.make, form.model].filter(Boolean).join(" ")}
        {form.tireSize && ` · ${form.tireSize}`}
      </SummaryRow>
    ),
    where: (
      <SummaryRow key="where" term="Where">
        {form.locationType === "mobile" ? (
          <>
            We come to you — {form.address}, {form.city}, {BUSINESS.shop.state}{" "}
            {form.zip}
            {form.parkingNotes && (
              <span className="block text-smoke">
                Parking: {form.parkingNotes}
              </span>
            )}
          </>
        ) : (
          <>At the shop — {BUSINESS.shop.full}</>
        )}
      </SummaryRow>
    ),
    contact: (
      <SummaryRow key="contact" term="Contact">
        {form.name}
        <span className="block text-smoke">
          {form.phone} · {form.email}
        </span>
      </SummaryRow>
    ),
    notes: form.notes ? (
      <SummaryRow key="notes" term="Notes">
        {form.notes}
      </SummaryRow>
    ) : null,
  };

  const order = callOrder
    ? ["when", "service", "vehicle", "where", "contact", "notes"]
    : ["service", "vehicle", "where", "when", "contact", "notes"];

  return <dl>{order.map((key) => rows[key])}</dl>;
}

export default function SchedulePage() {
  const wired = useFormsWired();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState(() => {
    const requested = searchParams.get("service");
    const preset = getService(requested);
    return {
      ...EMPTY_FORM,
      service: preset ? preset.slug : "",
      locationType: preset && !preset.mobile ? "shop" : "mobile",
    };
  });
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  // Null until the form is sent, then { delivered, error, reference }. The
  // reference is only minted once the booking actually left the browser — a
  // number for a request nobody received is worse than no number at all.
  const [submission, setSubmission] = useState(null);

  const headingRef = useRef(null);
  const formRef = useRef(null);
  const mounted = useRef(false);

  // Move focus to the step heading so keyboard and screen reader users land in
  // the new step rather than at the top of the document.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step, submission]);

  const service = getService(form.service);
  const lockedToShop = Boolean(service && !service.mobile);
  // Today on the visitor's clock, not the build's (see useHydrated).
  const hydrated = useHydrated();
  const today = hydrated ? toIsoDate(new Date()) : undefined;
  const pickedDate = form.date ? parseLocalDate(form.date) : null;
  const isSaturday = pickedDate?.getDay() === 6;

  const update = (key) => (value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Saturday closes at 4:00 PM, so drop a late window the customer already picked.
  function pickDate(value) {
    const picked = parseLocalDate(value);
    setForm((prev) => {
      const chosen = TIME_WINDOWS.find((w) => w.value === prev.window);
      const drop = picked?.getDay() === 6 && chosen?.weekdayOnly;
      return { ...prev, date: value, window: drop ? "" : prev.window };
    });
  }

  function pickService(slug) {
    const next = getService(slug);
    setForm((prev) => ({
      ...prev,
      service: slug,
      // In-shop services cannot be performed in a driveway.
      locationType: next && !next.mobile ? "shop" : prev.locationType,
    }));
    setErrors((prev) => ({ ...prev, service: undefined }));
  }

  /**
   * The form as the visitor sees it: state, plus anything on this step that
   * was filled in without an input event (automation, some autofill), which
   * state never saw. Put back into state before the step unmounts with it.
   */
  function readForm() {
    const { values, changed } = readFormValues(formRef.current, form);
    if (!hasChanges(changed)) return form;
    const picked = getService(values.service);
    // Same rule as pickService: an in-shop service cannot be done in a driveway.
    if (changed.service && picked && !picked.mobile) {
      values.locationType = "shop";
      changed.locationType = "shop";
    }
    setForm((prev) => ({ ...prev, ...changed }));
    return values;
  }

  function goNext() {
    const current = readForm();
    const found = validateStep(step, current);
    setErrors(found);
    const firstKey = Object.keys(found)[0];
    if (firstKey) {
      // A vehicle typed under "Other / not listed" has its own text box.
      (
        document.getElementById(`${firstKey}-other`) ??
        document.getElementById(firstKey)
      )?.focus();
      return;
    }
    // The vehicle step starts from the vehicle last picked in the finder
    // (the hero or Find My Tires), unless one is already filled in.
    if (step === 1) {
      const last = recallVehicle();
      if (last && !current.year && !current.make && !current.model) {
        setForm((prev) => ({
          ...prev,
          year: last.year,
          make: last.make,
          model: last.model,
        }));
      }
    }
    setStep((s) => Math.min(s + 1, LAST_STEP));
  }

  function goBack() {
    readForm();
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    // Enter on any field of the last step submits, so without this guard a
    // second press while the first is in flight books the job twice.
    if (submitting) return;
    const current = readForm();
    // Re-check every step so nothing slips through via keyboard navigation.
    const all = [1, 2, 3, 4, 5].reduce(
      (acc, n) => ({ ...acc, ...validateStep(n, current) }),
      {},
    );
    const keys = Object.keys(all).filter((k) => all[k]);
    if (keys.length) {
      setErrors(all);
      const firstStep = [1, 2, 3, 4, 5].find(
        (n) => Object.keys(validateStep(n, current)).length > 0,
      );
      setStep(firstStep || 1);
      return;
    }
    setErrors({});
    setSubmitting(true);
    // The reference goes out with the booking, so the shop sees the same
    // number the customer is shown; it is only shown once delivered.
    const reference = makeReference();
    const outcome = await submitForm(
      "booking",
      { ...current, reference },
      event.currentTarget,
    );
    setSubmitting(false);
    setSubmission({
      ...outcome,
      reference: outcome.delivered ? reference : null,
    });
  }

  /* ---------------- Confirmation: the booking was sent ---------------- */
  if (submission?.delivered) {
    return (
      <>
        <Seo
          title="Appointment Requested"
          description={`Your ${BUSINESS.parent} appointment request is in. Here is your reference number and what happens next.`}
        />
        <PageHero
          eyebrow="You're on the schedule"
          title="Appointment requested"
          lede="We have your request. We confirm an arrival window when we book, by phone."
        />
        <Section className="bg-fog">
          <div className="mx-auto max-w-2xl">
            <div className="card p-6 md:p-8" role="status">
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="flex items-center gap-2.5 font-display text-2xl focus:outline-none"
              >
                <CheckCircle2 size={24} aria-hidden className="text-drop" />
                Confirmation
              </h2>

              <div className="mt-5 rounded-card bg-ink-wash px-5 py-5 text-bone">
                <p className="label mb-1.5 text-volt">Reference number</p>
                <p className="font-display text-3xl tracking-tight">
                  {submission.reference}
                </p>
                <p className="mt-2 text-xs text-bone/60">
                  Keep this handy — it is the fastest way for us to pull up your
                  appointment.
                </p>
              </div>

              <div className="mt-7">
                <h3 className="h3 mb-2">What you booked</h3>
                <BookingSummary form={form} />
              </div>

              <div className="mt-7 border-t border-ink/10 pt-6">
                <h3 className="h3">What happens next</h3>
                <ol className="mt-4 space-y-3 text-sm leading-relaxed text-smoke">
                  <li className="flex gap-3">
                    <span className="font-display text-drop">01</span>A
                    dispatcher calls to confirm your window and the exact price
                    for your vehicle.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-display text-drop">02</span>
                    {form.locationType === "mobile"
                      ? "You get a heads-up call when the van is on the way, so you are not watching the street."
                      : "Pull into the shop at your window and we will have a bay ready."}
                  </li>
                  <li className="flex gap-3">
                    <span className="font-display text-drop">03</span>
                    We do the work, confirm the total before we start, and take
                    payment on completion. Card, tap or cash.
                  </li>
                </ol>
              </div>

              <div className="mt-7 border-t border-ink/10 pt-6">
                <p className="text-sm leading-relaxed text-smoke">
                  Need to move or cancel this appointment? Call{" "}
                  <a
                    href={BUSINESS.phoneHref}
                    className="font-display font-bold text-drop hover:text-dive"
                  >
                    {BUSINESS.phone}
                  </a>{" "}
                  and give us your reference number. No cancellation fee — just
                  give us a heads-up so the van is not sitting in your driveway.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a href={BUSINESS.phoneHref} className="btn-primary btn-sm">
                    <Phone size={16} aria-hidden />
                    {BUSINESS.phone}
                  </a>
                  <Link to="/auto-service" className="btn-outline btn-sm">
                    Browse more services
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Section>
      </>
    );
  }

  /* ---------------- Confirmation: nothing was sent ---------------- */
  // No dispatcher knows this booking exists, so the page says so and turns
  // itself into something the visitor can read down the phone instead.
  if (submission) {
    return (
      <>
        <Seo
          title="Finish Your Booking by Phone"
          description={`Your appointment details and the number to call at ${BUSINESS.parent} to get them on the schedule.`}
        />
        <PageHero
          eyebrow="Not booked yet"
          title="Finish this by phone"
          lede={`Nobody at the shop has seen this yet. Call ${BUSINESS.phone}, read out the details below, and you are on the schedule. It takes about a minute.`}
        />
        <Section className="bg-fog">
          <div className="mx-auto max-w-2xl">
            <div className="card p-6 md:p-8" role="status">
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="flex items-center gap-2.5 font-display text-2xl focus:outline-none"
              >
                <Phone size={24} aria-hidden className="text-drop" />
                Call to book it
              </h2>

              <div className="mt-5 rounded-card bg-ink-wash px-5 py-5 text-bone">
                <p className="label mb-1.5 text-volt">Call the shop</p>
                <a
                  href={BUSINESS.phoneHref}
                  className="font-display text-3xl tracking-tight hover:text-volt"
                >
                  {BUSINESS.phone}
                </a>
                <p className="mt-2 text-xs text-bone/60">
                  {BUSINESS.hours
                    .map((row) => `${row.days} ${row.time}`)
                    .join(" · ")}
                </p>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-smoke">
                {submission.error
                  ? `We tried to send this booking and it did not go through. ${submission.error}`
                  : "This form cannot send yet, so your booking has not reached the shop."}{" "}
                Nothing is being held — the day and window you picked are still
                open to anyone until you call.
              </p>

              <div className="mt-7">
                <h3 className="h3 mb-2">Read them this</h3>
                <p className="mb-4 text-sm leading-relaxed text-smoke">
                  Everything you chose, in the order it is easiest to say out
                  loud. None of it is saved anywhere, so keep this screen open
                  until the call is done.
                </p>
                <BookingSummary form={form} callOrder />
              </div>

              <div className="mt-7 border-t border-ink/10 pt-6">
                <p className="text-sm leading-relaxed text-smoke">
                  Ask for the day and window you picked. Whoever answers can
                  tell you whether it is still open, give you the exact price
                  for your vehicle, and book it while you are on the line.
                </p>
                {CONTACT_EMAIL && (
                  <p className="mt-3 text-sm leading-relaxed text-smoke">
                    Cannot call right now? Send the same details to{" "}
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="font-display font-bold text-drop hover:text-dive"
                    >
                      {CONTACT_EMAIL}
                    </a>
                    . The phone is faster, and it is the only way to get a
                    window confirmed today.
                  </p>
                )}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a href={BUSINESS.phoneHref} className="btn-primary btn-sm">
                    <Phone size={16} aria-hidden />
                    {BUSINESS.phone}
                  </a>
                  <Link to="/auto-service" className="btn-outline btn-sm">
                    Browse more services
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Section>
      </>
    );
  }

  /* ---------------- Booking form ---------------- */
  return (
    <>
      <Seo
        title="Schedule Service"
        description={`Book an install for the tires you bought on ${BUSINESS.name}, or any service at the ${BUSINESS.shop.city}, FL shop. Choose mobile or in-shop, pick your vehicle and arrival window in about two minutes.`}
      />

      <PageHero
        eyebrow="Schedule"
        title="Book your appointment"
        lede={`Five quick steps. Pick the service, tell us about the vehicle, and choose where and when. Booking the fitting for tires you ordered on ${BUSINESS.name}? Choose Tire Installation. ${
          wired
            ? "We confirm an arrival window when we book, by phone."
            : "At the end this lays out what to read down the phone — the window is confirmed on that call."
        }`}
      >
        <a href={BUSINESS.phoneHref} className="btn-ghost-light btn-sm">
          <Phone size={16} aria-hidden />
          Rather talk to someone? {BUSINESS.phone}
        </a>
      </PageHero>

      <Section className="bg-fog">
        <div className="mx-auto max-w-3xl">
          <ProgressBar step={step} />

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            noValidate
            className="card mt-8 p-6 md:p-8"
          >
            <FormTrap id="booking-website" />
            <p className="eyebrow mb-1">
              Step {step} of {LAST_STEP}
            </p>

            {/* ---------- Step 1: service ---------- */}
            {step === 1 && (
              <>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  className="h3 focus:outline-none"
                >
                  What do you need done?
                </h2>
                <p className="mt-2 text-sm text-smoke">
                  Already bought tires on {BUSINESS.name}? Tire Installation is
                  the one you want — whether they are on their way to the shop
                  or already sitting in your garage. Prices below are starting
                  points; we confirm the exact total for your vehicle before
                  work begins.
                </p>

                <fieldset className="mt-6">
                  <legend className="sr-only">Choose a service</legend>
                  <div
                    id="service"
                    tabIndex={-1}
                    className="grid gap-3 sm:grid-cols-2"
                    aria-invalid={errors.service ? "true" : undefined}
                    aria-describedby={
                      errors.service ? "service-error" : undefined
                    }
                  >
                    {SERVICES.map((item) => {
                      const selected = form.service === item.slug;
                      return (
                        <label
                          key={item.slug}
                          htmlFor={`service-${item.slug}`}
                          className={`flex cursor-pointer gap-3 rounded-sm border p-4 transition-colors ${
                            selected
                              ? "border-drop bg-drop/5"
                              : "border-ink/15 hover:border-ink/40"
                          }`}
                        >
                          <Input
                            type="radio"
                            id={`service-${item.slug}`}
                            name="service"
                            value={item.slug}
                            checked={selected}
                            onChange={() => pickService(item.slug)}
                            className="mt-1 shrink-0 accent-drop"
                          />
                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-display text-[15px] font-bold text-ink">
                                {item.name}
                              </span>
                              {item.mobile ? (
                                <Badge tone="drop">Mobile</Badge>
                              ) : (
                                <Badge tone="soft">In-Shop</Badge>
                              )}
                            </span>
                            <span className="mt-1 block text-xs text-smoke">
                              {item.duration} · from ${item.priceFrom}{" "}
                              {item.priceUnit}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <FieldError id="service-error" message={errors.service} />
                </fieldset>
              </>
            )}

            {/* ---------- Step 2: vehicle ---------- */}
            {step === 2 && (
              <>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  className="h3 focus:outline-none"
                >
                  Tell us about the vehicle
                </h2>
                <p className="mt-2 text-sm text-smoke">
                  This is how we load the right parts, lug sockets and torque
                  specs before the van rolls out.
                </p>

                <VehicleSelect
                  className="mt-6 grid gap-5 sm:grid-cols-2"
                  value={form}
                  onChange={(patch) =>
                    setForm((prev) => ({ ...prev, ...patch }))
                  }
                  errors={errors}
                >
                  <TextField
                    id="tireSize"
                    label="Tire size"
                    optional
                    placeholder="265/70R17"
                    value={form.tireSize}
                    onChange={update("tireSize")}
                    error={errors.tireSize}
                  />
                </VehicleSelect>

                <p className="mt-5 text-xs leading-relaxed text-smoke">
                  Tire size is printed on the sidewall and on the sticker inside
                  your driver's door. Do not have it? Leave it blank — we will
                  pull the factory fitment from your year, make and model.
                </p>
              </>
            )}

            {/* ---------- Step 3: location ---------- */}
            {step === 3 && (
              <>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  className="h3 focus:outline-none"
                >
                  Where should we do the work?
                </h2>

                {lockedToShop && (
                  <div className="mt-4 flex items-start gap-3 rounded-card border border-amber/40 bg-amber/10 p-4">
                    <Lock
                      size={18}
                      aria-hidden
                      className="mt-0.5 shrink-0 text-ink"
                    />
                    <p className="text-sm leading-relaxed text-ink">
                      <span className="font-display font-bold">
                        {service.name} is in-shop only.
                      </span>{" "}
                      It needs a lift and equipment the van cannot carry, so
                      this appointment is set for our Sunrise shop. Need tire
                      work at your place instead? Go back and pick a mobile
                      service.
                    </p>
                  </div>
                )}

                <fieldset className="mt-6">
                  <legend className="label">Service location</legend>
                  <div
                    id="locationType"
                    tabIndex={-1}
                    className="grid gap-3 sm:grid-cols-2"
                    aria-describedby={
                      errors.locationType ? "locationType-error" : undefined
                    }
                  >
                    <label
                      htmlFor="location-mobile"
                      className={`flex cursor-pointer gap-3 rounded-sm border p-4 ${
                        form.locationType === "mobile"
                          ? "border-drop bg-drop/5"
                          : "border-ink/15 hover:border-ink/40"
                      } ${lockedToShop ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <Input
                        type="radio"
                        id="location-mobile"
                        name="locationType"
                        value="mobile"
                        checked={form.locationType === "mobile"}
                        disabled={lockedToShop}
                        onChange={() => update("locationType")("mobile")}
                        className="mt-1 shrink-0 accent-drop"
                      />
                      <span>
                        <span className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
                          <Truck size={16} aria-hidden className="text-drop" />
                          We come to you
                        </span>
                        <span className="mt-1 block text-xs text-smoke">
                          Home, office or jobsite anywhere in Miami-Dade,
                          Broward or Palm Beach.
                        </span>
                      </span>
                    </label>

                    <label
                      htmlFor="location-shop"
                      className={`flex cursor-pointer gap-3 rounded-sm border p-4 ${
                        form.locationType === "shop"
                          ? "border-drop bg-drop/5"
                          : "border-ink/15 hover:border-ink/40"
                      }`}
                    >
                      <Input
                        type="radio"
                        id="location-shop"
                        name="locationType"
                        value="shop"
                        checked={form.locationType === "shop"}
                        onChange={() => update("locationType")("shop")}
                        className="mt-1 shrink-0 accent-drop"
                      />
                      <span>
                        <span className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
                          <Warehouse
                            size={16}
                            aria-hidden
                            className="text-drop"
                          />
                          I'll come to the shop
                        </span>
                        <span className="mt-1 block text-xs text-smoke">
                          {BUSINESS.shop.city}, {BUSINESS.shop.state} — your
                          ship-to-store order and full bay equipment.
                        </span>
                      </span>
                    </label>
                  </div>
                  <FieldError
                    id="locationType-error"
                    message={errors.locationType}
                  />
                </fieldset>

                {form.locationType === "mobile" ? (
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <TextField
                        id="address"
                        label="Street address"
                        autoComplete="street-address"
                        placeholder="Street number and name"
                        value={form.address}
                        onChange={update("address")}
                        error={errors.address}
                      />
                    </div>
                    <TextField
                      id="city"
                      label="City"
                      autoComplete="address-level2"
                      placeholder="Your city"
                      value={form.city}
                      onChange={update("city")}
                      error={errors.city}
                    />
                    <TextField
                      id="zip"
                      label="ZIP code"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="5-digit ZIP, e.g. 33021"
                      value={form.zip}
                      onChange={update("zip")}
                      error={errors.zip}
                    />
                    <div className="sm:col-span-2">
                      <label htmlFor="parkingNotes" className="label">
                        Parking &amp; access notes{" "}
                        <span className="normal-case tracking-normal">
                          (optional)
                        </span>
                      </label>
                      <Textarea
                        id="parkingNotes"
                        name="parkingNotes"
                        rows={3}
                        value={form.parkingNotes}
                        onChange={(e) => update("parkingNotes")(e.target.value)}
                        className="field"
                        placeholder="Gate code, building number, which space the car is in, low-clearance garage, etc."
                      />
                      <p className="mt-1.5 text-xs text-smoke">
                        We need one parking space beside your vehicle and about
                        ten feet of working room. Gated community? Put the gate
                        code or call-up name here.
                      </p>
                    </div>
                    <div className="sm:col-span-2 rounded-card bg-fog p-4 text-xs leading-relaxed text-smoke">
                      <span className="font-display font-bold text-ink">
                        Mobile install area:
                      </span>{" "}
                      {SERVICE_AREA_LABEL}, checked by ZIP code. Outside those
                      three counties? Choose the shop instead, or call{" "}
                      {BUSINESS.phone} and we will tell you straight what we
                      can do.
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-card border border-ink/10 bg-fog p-5">
                    <p className="label">Shop address</p>
                    <address className="not-italic font-display text-lg text-ink">
                      {BUSINESS.shop.street}
                      <br />
                      {BUSINESS.shop.city}, {BUSINESS.shop.state}{" "}
                      {BUSINESS.shop.zip}
                    </address>
                    <a
                      href={BUSINESS.mapsHref}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm text-drop hover:text-dive"
                    >
                      <MapPin size={15} aria-hidden />
                      Get directions
                    </a>
                    <dl className="mt-4 space-y-1.5 border-t border-ink/10 pt-4 text-sm">
                      {BUSINESS.hours.map((row) => (
                        <div
                          key={row.days}
                          className="flex justify-between gap-4"
                        >
                          <dt className="text-ink">{row.days}</dt>
                          <dd className="text-smoke">{row.time}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </>
            )}

            {/* ---------- Step 4: time ---------- */}
            {step === 4 && (
              <>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  className="h3 focus:outline-none"
                >
                  Pick your day and window
                </h2>
                <p className="mt-2 text-sm text-smoke">
                  We run Monday through Saturday and are closed Sunday. Pick the
                  window that suits you; we confirm an arrival window when we
                  book, by phone, before the day of service.
                </p>

                <div className="mt-6 max-w-xs">
                  <label htmlFor="date" className="label">
                    Preferred date
                  </label>
                  <Input
                    type="date"
                    id="date"
                    name="date"
                    min={today}
                    value={form.date}
                    onChange={(e) => pickDate(e.target.value)}
                    className="field"
                    aria-invalid={errors.date ? "true" : undefined}
                    aria-describedby={errors.date ? "date-error" : "date-hint"}
                  />
                  <FieldError id="date-error" message={errors.date} />
                  {!errors.date && (
                    <p
                      id="date-hint"
                      className="mt-1.5 flex items-center gap-1.5 text-xs text-smoke"
                    >
                      <CalendarDays size={13} aria-hidden />
                      Monday – Saturday. Closed Sunday.
                    </p>
                  )}
                </div>

                <fieldset className="mt-7">
                  <legend className="label">Arrival window</legend>
                  <div
                    id="window"
                    tabIndex={-1}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    {TIME_WINDOWS.map((slot) => {
                      const unavailable = slot.weekdayOnly && isSaturday;
                      const selected = form.window === slot.value;
                      return (
                        <label
                          key={slot.value}
                          htmlFor={`window-${slot.value}`}
                          className={`flex cursor-pointer items-center gap-3 rounded-sm border p-4 ${
                            selected
                              ? "border-drop bg-drop/5"
                              : "border-ink/15 hover:border-ink/40"
                          } ${unavailable ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          <Input
                            type="radio"
                            id={`window-${slot.value}`}
                            name="window"
                            value={slot.value}
                            checked={selected}
                            disabled={unavailable}
                            onChange={() => update("window")(slot.value)}
                            className="shrink-0 accent-drop"
                          />
                          <span className="min-w-0">
                            <span className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
                              <Clock
                                size={15}
                                aria-hidden
                                className="text-drop"
                              />
                              {slot.label}
                            </span>
                            {unavailable && (
                              <span className="mt-0.5 block text-xs text-smoke">
                                Not available Saturday — we close at 4:00 PM.
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <FieldError id="window-error" message={errors.window} />
                </fieldset>
              </>
            )}

            {/* ---------- Step 5: contact + review ---------- */}
            {step === 5 && (
              <>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  className="h3 focus:outline-none"
                >
                  How do we reach you?
                </h2>
                <p className="mt-2 text-sm text-smoke">
                  {wired
                    ? "A dispatcher calls to confirm your window and the exact price before anyone rolls out."
                    : "Your window and the exact price for your vehicle are settled on the phone call at the end, before anyone rolls out."}
                </p>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <TextField
                    id="name"
                    label="Full name"
                    autoComplete="name"
                    placeholder="Alex Rivera"
                    value={form.name}
                    onChange={update("name")}
                    error={errors.name}
                  />
                  <TextField
                    id="phone"
                    label="Phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(954) 555-0134"
                    value={form.phone}
                    onChange={update("phone")}
                    error={errors.phone}
                  />
                  <div className="sm:col-span-2">
                    <TextField
                      id="email"
                      label="Email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={update("email")}
                      error={errors.email}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="notes" className="label">
                      Anything else we should know{" "}
                      <span className="normal-case tracking-normal">
                        (optional)
                      </span>
                    </label>
                    <Textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={form.notes}
                      onChange={(e) => update("notes")(e.target.value)}
                      className="field"
                      placeholder="TireDrop order number, locking lug nuts, aftermarket wheels, spare is already on, noise you want us to listen for..."
                    />
                  </div>
                </div>

                <div className="mt-8 border-t border-ink/10 pt-6">
                  <h3 className="h3">Review before you send</h3>
                  <p className="mt-2 text-sm text-smoke">
                    Check it over. Anything wrong, step back and fix it —
                    {wired
                      ? " nothing is locked in until a dispatcher confirms by phone."
                      : " nothing is booked until you call it through."}
                  </p>
                  <div className="mt-4">
                    <BookingSummary form={form} />
                  </div>
                </div>
              </>
            )}

            {/* ---------- Navigation ---------- */}
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="btn-outline btn-sm"
                >
                  <ArrowLeft size={16} aria-hidden />
                  Back
                </button>
              ) : (
                <span className="hidden sm:block" />
              )}

              {/* Distinct keys, so step 4's Next is not reused as step 5's
                  submit button mid-click — that submitted the booking. */}
              {step < LAST_STEP ? (
                <button
                  key="next"
                  type="button"
                  onClick={goNext}
                  className="btn-primary btn-sm"
                >
                  Next: {STEP_LABELS[step]}
                  <ArrowRight size={16} aria-hidden />
                </button>
              ) : (
                <button
                  key="submit"
                  type="submit"
                  disabled={submitting}
                  aria-busy={submitting || undefined}
                  className="btn-primary btn-sm"
                >
                  {submitting ? "Booking…" : "Request appointment"}
                  {!submitting && <ArrowRight size={16} aria-hidden />}
                </button>
              )}
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-smoke">
            Need it today, or stuck on the side of the road? Call{" "}
            <a
              href={BUSINESS.phoneHref}
              className="font-display font-bold text-drop hover:text-dive"
            >
              {BUSINESS.phone}
            </a>{" "}
            and talk to a person.
          </p>
        </div>
      </Section>
    </>
  );
}
