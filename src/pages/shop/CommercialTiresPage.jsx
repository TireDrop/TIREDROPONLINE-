import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  Phone,
  Truck,
  Wrench,
} from "lucide-react";

import {
  Seo,
  PageHero,
  Breadcrumbs,
  Section,
  SectionHead,
  FormTrap,
} from "../../components/ui/index.jsx";
import ProductCard from "../../components/shop/ProductCard.jsx";
import { TIRES } from "../../data/products.js";
import { BUSINESS } from "../../data/business.js";
import { CONTACT_EMAIL, submitForm, useFormsWired } from "../../data/forms.js";

const FLEET_TIRES = TIRES.filter((t) => t.category === "Commercial");

const VALUE_PROPS = [
  {
    icon: Truck,
    title: "Shipped to your yard",
    body: "Orders ship direct from a distributor warehouse to your address, anywhere in the continental US. No counter trips, no driver paid to wait.",
  },
  {
    icon: Clock,
    title: "Local? We fit them too",
    body: "South Florida fleets can send the order free to our Sunrise shop, or book the van for a block before the route starts or after it ends.",
  },
  {
    icon: DollarSign,
    title: "Fleet pricing on volume",
    body: "Sets of eight or more are quoted at fleet rates, with one consolidated invoice instead of a stack of counter receipts.",
  },
  {
    icon: Wrench,
    title: "Load-rated, not passenger-rated",
    body: "Load Range E casings, dual-fitment approved sizes and correct inflation for the axle weights your trucks actually carry.",
  },
  {
    icon: CalendarClock,
    title: "Rotation on a schedule",
    body: "Tell us your sizes and cycle and we keep the order list ready, so replacements are planned around your calendar instead of a blowout on the interstate.",
  },
  {
    icon: CheckCircle2,
    title: "One number to call",
    body: `Tires, repairs and roadside swaps all come back to ${BUSINESS.phone} — no dispatch tree, no ticket queue.`,
  },
];

const FLEET_SIZES = [
  "1–5 vehicles",
  "6–15 vehicles",
  "16–40 vehicles",
  "40+ vehicles",
];

const EMPTY_FORM = {
  company: "",
  contact: "",
  phone: "",
  email: "",
  fleetSize: "",
  sizes: "",
  message: "",
};

function validate(form) {
  const errors = {};
  if (!form.company.trim()) errors.company = "Enter your company name.";
  if (!form.contact.trim()) errors.contact = "Tell us who we should ask for.";

  const digits = form.phone.replace(/\D/g, "");
  if (!form.phone.trim())
    errors.phone = "A phone number gets you a faster quote.";
  else if (digits.length < 10) errors.phone = "Enter a 10-digit phone number.";

  if (!form.email.trim())
    errors.email = "Enter an email for the written quote.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
    errors.email = "That email address does not look right.";

  if (!form.fleetSize) errors.fleetSize = "Choose your fleet size.";
  if (!form.sizes.trim())
    errors.sizes = "List at least one tire size, e.g. 245/75R16.";
  return errors;
}

// Read back verbatim when the quote could not be sent, so the list can go
// down the phone instead of being typed a second time.
function quoteDetails(form) {
  return [
    ["Company", form.company.trim()],
    ["Contact", form.contact.trim()],
    ["Phone", form.phone.trim()],
    ["Email", form.email.trim()],
    ["Fleet size", form.fleetSize],
    ["Tire sizes", form.sizes.trim()],
    ["Notes", form.message.trim()],
  ].filter(([, value]) => value);
}

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs font-medium text-drop">
      {message}
    </p>
  );
}

export default function CommercialTiresPage() {
  const wired = useFormsWired();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  // The submitForm outcome, kept whole rather than as a boolean: the
  // confirmation may only promise a callback when `delivered` says the quote
  // actually left the browser.
  const [result, setResult] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSending(true);
    setResult(await submitForm("fleet-quote", form, e.currentTarget));
    setSending(false);
  };

  const describedBy = (key) => (errors[key] ? `${key}-error` : undefined);

  return (
    <>
      <Seo
        title="Commercial & Fleet Tires"
        description="Load-rated commercial tires for vans, box trucks and work fleets from TireDrop — shipped anywhere in the continental US, or delivered free to our South Florida shop for fitting."
      />
      <PageHero
        eyebrow="Commercial"
        title="Fleet & Commercial Tires"
        lede="Vans, box trucks, shuttles and contractor pickups. We source the load-rated sizes your fleet runs and ship them wherever the trucks are — or fit them ourselves if you are in South Florida."
      >
        <div className="flex flex-wrap gap-3">
          <a href="#fleet-quote" className="btn-primary">
            Request a quote
          </a>
          <a href={BUSINESS.phoneHref} className="btn-ghost-light">
            <Phone size={18} aria-hidden />
            {BUSINESS.phone}
          </a>
        </div>
      </PageHero>
      <Breadcrumbs trail={[{ label: "Commercial Tires" }]} />

      <Section>
        <SectionHead
          align="center"
          eyebrow="Why fleets call us"
          title="Downtime is the expensive part"
          lede="A tire is a small line item. A truck sitting in a waiting room for three hours is not. Everything below is built around keeping units on the road, wherever they run."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-6">
              <Icon size={24} aria-hidden className="mb-3 text-drop" />
              <h3 className="h3">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-smoke">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-bone">
        <SectionHead
          eyebrow="In the catalog"
          title="Commercial tires we ship"
          lede="Load Range E casings approved for dual fitment, priced per tire. Volume pricing applies to sets of eight or more."
          action={
            <Link to="/tires?cats=Commercial" className="btn-outline btn-sm">
              View in the tire catalog
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
          {FLEET_TIRES.map((tire) => (
            <ProductCard key={tire.id} product={tire} />
          ))}
        </div>
      </Section>

      <Section id="fleet-quote">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <SectionHead
              eyebrow="Fleet quote"
              title="Request a quote"
              lede={
                wired
                  ? "Tell us what you run and we will come back with per-tire pricing, delivery to your yard, and — if you are local — what it costs to have us fit them."
                  : "Tell us what you run, then call the list in — we will price it per tire, quote delivery to your yard, and, if you are local, what it costs to have us fit them."
              }
            />

            {result ? (
              result.delivered ? (
                <div
                  className="card border-l-4 border-l-drop p-8"
                  role="status"
                >
                  <CheckCircle2
                    size={36}
                    aria-hidden
                    className="mb-4 text-drop"
                  />
                  <h3 className="h3">Quote request received</h3>
                  <p className="mt-2 text-sm leading-relaxed text-smoke">
                    Thanks, {form.contact.trim() || "there"} — we have your
                    details for {form.company.trim()}. A fleet specialist will
                    follow up at {form.phone.trim()} or {form.email.trim()}{" "}
                    during shop hours.
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-smoke">
                    Need it sooner? Call {BUSINESS.phone} and ask for fleet
                    service.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a href={BUSINESS.phoneHref} className="btn-primary btn-sm">
                      <Phone size={16} aria-hidden />
                      {BUSINESS.phone}
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(EMPTY_FORM);
                        setErrors({});
                        setResult(null);
                      }}
                      className="btn-outline btn-sm"
                    >
                      Submit another vehicle list
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="card border-l-4 border-l-amber p-8"
                  role="status"
                >
                  <Phone size={36} aria-hidden className="mb-4 text-drop" />
                  <h3 className="h3">
                    {result.error
                      ? "That quote did not go through"
                      : "Nothing was sent — call the list in"}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-smoke">
                    {result.error
                      ? `${result.error} Your list did not arrive, so nobody here is working on it.`
                      : "This form does not reach an inbox yet, so nothing was sent and nobody at the shop has seen your list."}{" "}
                    Call{" "}
                    <a
                      href={BUSINESS.phoneHref}
                      className="font-display text-ink hover:text-drop"
                    >
                      {BUSINESS.phone}
                    </a>{" "}
                    during shop hours and ask for fleet service — that number
                    reaches the counter, and we can price the list while you are
                    on the line.
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-smoke">
                    Everything you typed is here. Read it out or copy it across
                    — you do not have to fill the form in again.
                  </p>
                  <dl className="mt-5 space-y-2 border-t border-ink/10 pt-5 text-sm">
                    {quoteDetails(form).map(([label, value]) => (
                      <div
                        key={label}
                        className="grid gap-0.5 sm:grid-cols-[112px_1fr] sm:gap-4"
                      >
                        <dt className="text-smoke">{label}</dt>
                        <dd className="font-medium text-ink">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {CONTACT_EMAIL && (
                    <p className="mt-5 text-sm leading-relaxed text-smoke">
                      Rather write it out? Send the same details to{" "}
                      <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="font-display text-ink hover:text-drop"
                      >
                        {CONTACT_EMAIL}
                      </a>
                      .
                    </p>
                  )}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a href={BUSINESS.phoneHref} className="btn-primary btn-sm">
                      <Phone size={16} aria-hidden />
                      {BUSINESS.phone}
                    </a>
                    <button
                      type="button"
                      onClick={() => setResult(null)}
                      className="btn-outline btn-sm"
                    >
                      Edit these details
                    </button>
                  </div>
                </div>
              )
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="card p-6 md:p-8"
              >
                <FormTrap id="fleet-website" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="company" className="label">
                      Company name
                    </label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      autoComplete="organization"
                      className="field"
                      value={form.company}
                      onChange={set("company")}
                      aria-invalid={Boolean(errors.company)}
                      aria-describedby={describedBy("company")}
                    />
                    <FieldError id="company-error" message={errors.company} />
                  </div>

                  <div>
                    <label htmlFor="contact" className="label">
                      Contact name
                    </label>
                    <input
                      id="contact"
                      name="contact"
                      type="text"
                      autoComplete="name"
                      className="field"
                      value={form.contact}
                      onChange={set("contact")}
                      aria-invalid={Boolean(errors.contact)}
                      aria-describedby={describedBy("contact")}
                    />
                    <FieldError id="contact-error" message={errors.contact} />
                  </div>

                  <div>
                    <label htmlFor="phone" className="label">
                      Phone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="(555) 555-5555"
                      className="field"
                      value={form.phone}
                      onChange={set("phone")}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={describedBy("phone")}
                    />
                    <FieldError id="phone-error" message={errors.phone} />
                  </div>

                  <div>
                    <label htmlFor="email" className="label">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="field"
                      value={form.email}
                      onChange={set("email")}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={describedBy("email")}
                    />
                    <FieldError id="email-error" message={errors.email} />
                  </div>

                  <div>
                    <label htmlFor="fleetSize" className="label">
                      Fleet size
                    </label>
                    <select
                      id="fleetSize"
                      name="fleetSize"
                      className="field"
                      value={form.fleetSize}
                      onChange={set("fleetSize")}
                      aria-invalid={Boolean(errors.fleetSize)}
                      aria-describedby={describedBy("fleetSize")}
                    >
                      <option value="">Select a range</option>
                      {FLEET_SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <FieldError
                      id="fleetSize-error"
                      message={errors.fleetSize}
                    />
                  </div>

                  <div>
                    <label htmlFor="sizes" className="label">
                      Tire sizes needed
                    </label>
                    <input
                      id="sizes"
                      name="sizes"
                      type="text"
                      placeholder="245/75R16, 225/75R16"
                      className="field"
                      value={form.sizes}
                      onChange={set("sizes")}
                      aria-invalid={Boolean(errors.sizes)}
                      aria-describedby={describedBy("sizes")}
                    />
                    <FieldError id="sizes-error" message={errors.sizes} />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="message" className="label">
                      Anything else (optional)
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows="4"
                      className="field resize-y"
                      placeholder="Yard address, preferred service window, current tire brand, PO requirements."
                      value={form.message}
                      onChange={set("message")}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary mt-6 w-full sm:w-auto"
                >
                  {sending ? "Sending…" : "Request fleet quote"}
                </button>
                <p className="mt-3 text-xs text-smoke">
                  We use these details to price your quote and schedule service
                  — nothing else.
                </p>
              </form>
            )}
          </div>

          <aside className="card h-fit p-6">
            <h2 className="h3">Talk to a fleet specialist</h2>
            <p className="mt-2 text-sm leading-relaxed text-smoke">
              Prefer to handle it on the phone? Call during shop hours and we
              will price your list while you are on the line.
            </p>
            <a
              href={BUSINESS.phoneHref}
              className="btn-primary btn-sm mt-4 w-full"
            >
              <Phone size={16} aria-hidden />
              {BUSINESS.phone}
            </a>

            <h3 className="label mt-6">Shop hours</h3>
            <dl className="space-y-1 text-sm">
              {BUSINESS.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-4">
                  <dt className="text-smoke">{h.days}</dt>
                  <dd className="font-medium text-ink">{h.time}</dd>
                </div>
              ))}
            </dl>

            <h3 className="label mt-6">Shop address</h3>
            <p className="text-sm text-smoke">{BUSINESS.shop.full}</p>
            <a
              href={BUSINESS.mapsHref}
              target="_blank"
              rel="noreferrer"
              className="btn-outline btn-sm mt-4 w-full"
            >
              Get directions
            </a>

            <h3 className="label mt-6">Shipping</h3>
            <p className="text-sm leading-relaxed text-smoke">
              Fleet orders ship anywhere in {BUSINESS.shipping.area}.
            </p>

            <h3 className="label mt-6">On-site install</h3>
            <p className="text-sm leading-relaxed text-smoke">
              {BUSINESS.installArea.join(", ")} and the rest of Broward County.
            </p>
          </aside>
        </div>
      </Section>
    </>
  );
}
