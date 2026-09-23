import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Phone,
  Truck,
} from "lucide-react";
import { BUSINESS } from "../../data/business.js";
import {
  Breadcrumbs,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";

const SUBJECTS = [
  "General Question",
  "Quote Request",
  "Existing Appointment",
  "Commercial & Fleet",
  "Feedback",
];

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

function validate(values) {
  const errors = {};

  if (!values.name.trim()) {
    errors.name = "Tell us who we are talking to.";
  }

  if (!values.email.trim()) {
    errors.email = "We need an email to write back to.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) {
    errors.email = "That email address does not look complete.";
  }

  const digits = values.phone.replace(/\D/g, "");
  if (!values.phone.trim()) {
    errors.phone = "A phone number gets you a faster answer.";
  } else if (digits.length < 10) {
    errors.phone = "Enter a 10-digit phone number, area code included.";
  }

  if (!values.subject) {
    errors.subject = "Pick the option that fits best.";
  }

  if (!values.message.trim()) {
    errors.message = "Add a few details so we can actually help.";
  } else if (values.message.trim().length < 15) {
    errors.message = "A little more detail, please — vehicle, tire size, or what is going on.";
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

function ContactForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const update = (field) => (event) => {
    const { value } = event.target;
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear an error as soon as the customer starts fixing it.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length === 0) setSent(true);
  };

  if (sent) {
    return (
      <div className="card border-l-4 border-l-drop p-8" role="status">
        <CheckCircle2 size={34} aria-hidden className="mb-4 text-drop" />
        <h3 className="h3">Message received, {values.name.split(" ")[0]}.</h3>
        <p className="mt-3 text-sm leading-relaxed text-smoke">
          Thanks for reaching out about{" "}
          <span className="text-ink">{values.subject.toLowerCase()}</span>. A
          real person reads these during business hours and will get back to you
          at {values.email} or {values.phone}.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-smoke">
          If your vehicle is down right now, do not wait on the reply — call{" "}
          <a href={BUSINESS.phoneHref} className="text-drop underline">
            {BUSINESS.phone}
          </a>{" "}
          and we will get a van routed to you.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href={BUSINESS.phoneHref} className="btn-primary btn-sm">
            <Phone size={16} aria-hidden />
            Call the shop
          </a>
          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={() => {
              setValues(EMPTY);
              setSent(false);
            }}
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="card p-6 md:p-8">
      <h3 className="h3 mb-1">Send us a message</h3>
      <p className="mb-6 text-sm text-smoke">
        Fields marked with an asterisk are required.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="contact-name">
            Full name *
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            className="field"
            placeholder="Alex Moreno"
            value={values.name}
            onChange={update("name")}
            aria-invalid={errors.name ? "true" : undefined}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
          />
          {errors.name && (
            <FieldError id="contact-name-error">{errors.name}</FieldError>
          )}
        </div>

        <div>
          <label className="label" htmlFor="contact-phone">
            Phone *
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="field"
            placeholder="(954) 555-0188"
            value={values.phone}
            onChange={update("phone")}
            aria-invalid={errors.phone ? "true" : undefined}
            aria-describedby={errors.phone ? "contact-phone-error" : undefined}
          />
          {errors.phone && (
            <FieldError id="contact-phone-error">{errors.phone}</FieldError>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="contact-email">
            Email *
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            className="field"
            placeholder="you@example.com"
            value={values.email}
            onChange={update("email")}
            aria-invalid={errors.email ? "true" : undefined}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
          />
          {errors.email && (
            <FieldError id="contact-email-error">{errors.email}</FieldError>
          )}
        </div>

        <fieldset
          className="sm:col-span-2"
          aria-describedby={errors.subject ? "contact-subject-error" : undefined}
        >
          <legend className="label">What is this about? *</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {SUBJECTS.map((subject) => {
              const id = `subject-${subject.replace(/[^a-z]/gi, "").toLowerCase()}`;
              return (
                <div key={subject} className="flex items-center gap-2.5">
                  <input
                    id={id}
                    type="radio"
                    name="subject"
                    value={subject}
                    checked={values.subject === subject}
                    onChange={update("subject")}
                    className="h-4 w-4 accent-drop"
                    aria-invalid={errors.subject ? "true" : undefined}
                  />
                  <label htmlFor={id} className="text-sm text-ink">
                    {subject}
                  </label>
                </div>
              );
            })}
          </div>
          {errors.subject && (
            <FieldError id="contact-subject-error">{errors.subject}</FieldError>
          )}
        </fieldset>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="contact-message">
            Message *
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={6}
            className="field resize-y"
            placeholder="Year, make and model, tire size if you have it, and where the vehicle will be parked."
            value={values.message}
            onChange={update("message")}
            aria-invalid={errors.message ? "true" : undefined}
            aria-describedby={errors.message ? "contact-message-error" : undefined}
          />
          {errors.message && (
            <FieldError id="contact-message-error">{errors.message}</FieldError>
          )}
        </div>
      </div>

      <button type="submit" className="btn-primary mt-7 w-full sm:w-auto">
        Send Message
      </button>

      <p className="mt-4 text-xs leading-relaxed text-smoke">
        We use what you send here to answer your question and nothing else. See
        our{" "}
        <Link to="/privacy" className="underline hover:text-drop">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}

export default function ContactPage() {
  return (
    <>
      <Seo
        title="Contact Us"
        description={`Call ${BUSINESS.name} at ${BUSINESS.phone}, visit the shop at ${BUSINESS.address.full}, or send a message and we will get back to you during business hours.`}
      />

      <PageHero
        eyebrow="Contact"
        title="Talk to a person who actually works here"
        lede="Questions about fitment, pricing, an appointment you already booked, or a fleet you need covered — start here."
      >
        <a href={BUSINESS.phoneHref} className="btn-primary">
          <Phone size={18} aria-hidden />
          Call {BUSINESS.phone}
        </a>
      </PageHero>

      <Breadcrumbs trail={[{ label: "Contact Us" }]} />

      <Section className="bg-bone">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.25fr] lg:gap-14">
          {/* ---------- Contact methods ---------- */}
          <div>
            <SectionHead
              eyebrow="Reach Us"
              title="Three ways to get an answer"
            />

            <div className="card border-l-4 border-l-drop p-6">
              <h3 className="h3 mb-2 flex items-center gap-2">
                <Truck size={20} aria-hidden className="text-drop" />
                Fastest way to reach us
              </h3>
              <p className="text-sm leading-relaxed text-smoke">
                Call. If you are sitting on a flat, stuck in an office lot, or
                you need a van today, the phone beats the form every time — the
                person who answers can see the route board and tell you what is
                actually possible.
              </p>
              <a href={BUSINESS.phoneHref} className="btn-primary btn-sm mt-5">
                <Phone size={16} aria-hidden />
                {BUSINESS.phone}
              </a>
            </div>

            <ul className="mt-5 space-y-5">
              <li className="card p-6">
                <h3 className="h3 mb-3 flex items-center gap-2">
                  <Phone size={20} aria-hidden className="text-drop" />
                  By phone
                </h3>
                <a
                  href={BUSINESS.phoneHref}
                  className="font-display text-2xl uppercase tracking-wide text-ink hover:text-drop"
                >
                  {BUSINESS.phone}
                </a>
                <p className="mt-2 text-sm text-smoke">
                  Quotes, scheduling, fitment questions and fleet accounts.
                </p>
              </li>

              <li className="card p-6">
                <h3 className="h3 mb-3 flex items-center gap-2">
                  <MapPin size={20} aria-hidden className="text-drop" />
                  At the shop
                </h3>
                <address className="not-italic text-sm text-ink">
                  {BUSINESS.address.street}
                  <br />
                  {BUSINESS.address.city}, {BUSINESS.address.state}{" "}
                  {BUSINESS.address.zip}
                </address>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={BUSINESS.mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline btn-sm"
                  >
                    <Navigation size={16} aria-hidden />
                    Directions
                  </a>
                  <Link to="/locations" className="btn-outline btn-sm">
                    Service area
                  </Link>
                </div>
              </li>

              <li className="card p-6">
                <h3 className="h3 mb-3 flex items-center gap-2">
                  <Clock size={20} aria-hidden className="text-drop" />
                  Hours
                </h3>
                <table className="w-full text-sm">
                  <caption className="sr-only">Business hours</caption>
                  <tbody className="divide-y divide-ink/10">
                    {BUSINESS.hours.map((h) => (
                      <tr key={h.days}>
                        <th
                          scope="row"
                          className="py-2 text-left font-display text-base font-normal uppercase tracking-wide text-ink"
                        >
                          {h.days}
                        </th>
                        <td
                          className={`py-2 text-right ${
                            h.time === "Closed" ? "text-smoke" : "text-ink"
                          }`}
                        >
                          {h.time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </li>
            </ul>
          </div>

          {/* ---------- Form ---------- */}
          <div>
            <SectionHead
              eyebrow="Message Us"
              title="Not urgent? Write it down."
              lede="Messages sent outside business hours get picked up the next morning we are open."
            />
            <ContactForm />
          </div>
        </div>
      </Section>

      <section className="bg-ink py-12 text-bone md:py-16">
        <div className="wrap flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow mb-2">Ready when you are</p>
            <h2 className="h2">Book it instead of asking about it</h2>
            <p className="lede mt-3 max-w-xl text-bone/70">
              If you already know what you need, the scheduler is quicker than
              a message thread.
            </p>
          </div>
          <Link to="/schedule" className="btn-primary shrink-0">
            Schedule Service
          </Link>
        </div>
      </section>
    </>
  );
}
