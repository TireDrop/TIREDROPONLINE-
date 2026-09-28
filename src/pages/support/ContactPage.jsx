import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Navigation,
  Package,
  Phone,
} from "lucide-react";
import { BUSINESS } from "../../data/business.js";
import { CONTACT_EMAIL, submitForm, useFormsWired } from "../../data/forms.js";
import {
  Breadcrumbs,
  FormTrap,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";

const SUBJECTS = [
  "Order Question",
  "Shipping & Delivery",
  "Returns & Warranty",
  "Book an Install",
  "Commercial & Fleet",
  "Something Else",
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
    errors.message =
      "A little more detail, please — vehicle, tire size, or your order number.";
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
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const update = (field) => (event) => {
    const { value } = event.target;
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear an error as soon as the customer starts fixing it.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const startOver = () => {
    setValues(EMPTY);
    setResult(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (sending) return; // a second click must not fire a second send
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSending(true);
    const outcome = await submitForm("contact", values, event.currentTarget);
    setSending(false);
    setResult(outcome);
  };

  if (result) {
    const firstName = values.name.split(" ")[0];

    // Only a delivered message earns the confirmation that promises a reply.
    if (result.delivered) {
      return (
        <div className="card border-l-4 border-l-drop p-8" role="status">
          <CheckCircle2 size={34} aria-hidden className="mb-4 text-drop" />
          <h3 className="h3">Message received, {firstName}.</h3>
          <p className="mt-3 text-sm leading-relaxed text-smoke">
            Thanks for reaching out about{" "}
            <span className="text-ink">{values.subject.toLowerCase()}</span>. A
            real person reads these during the hours listed on this page, and
            will reply at {values.email} or {values.phone}. We do not put a
            clock on that, because we would rather answer properly than answer
            fast.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-smoke">
            If the car is down right now, or your order needs changing before it
            ships, do not wait on the reply — the phone is the only channel we
            treat as urgent. Call{" "}
            <a href={BUSINESS.phoneHref} className="text-drop underline">
              {BUSINESS.phone}
            </a>{" "}
            and we will pull it up on the spot.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a href={BUSINESS.phoneHref} className="btn-primary btn-sm">
              <Phone size={16} aria-hidden />
              Call the shop
            </a>
            <button
              type="button"
              className="btn-outline btn-sm"
              onClick={startOver}
            >
              Send another message
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="card border-l-4 border-l-amber p-8" role="status">
        <Phone size={34} aria-hidden className="mb-4 text-drop" />
        <h3 className="h3">
          {result.error
            ? `We could not get that through just now, ${firstName}.`
            : `Nothing was sent, ${firstName} — call us instead.`}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-smoke">
          {result.error
            ? "Your message did not leave this page, so nobody here has read it. Rather than let you wait on an answer that is not coming, here is the channel that works."
            : "Being straight with you: this form is not connected to an inbox yet, so your message was not sent anywhere. The phone reaches the same people it would have gone to."}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-smoke">
          Call{" "}
          <a href={BUSINESS.phoneHref} className="text-drop underline">
            {BUSINESS.phone}
          </a>{" "}
          during the hours listed on this page and ask about{" "}
          <span className="text-ink">{values.subject.toLowerCase()}</span>. What
          you wrote is below — read it out, or copy it across, rather than
          typing it again.
          {CONTACT_EMAIL && (
            <>
              {" "}
              You can also send it to{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-drop underline"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </>
          )}
        </p>

        <dl className="mt-6 space-y-3 border-t border-ink/10 pt-5 text-sm">
          <div>
            <dt className="label">Name</dt>
            <dd className="text-ink">{values.name}</dd>
          </div>
          <div>
            <dt className="label">Phone</dt>
            <dd className="text-ink">{values.phone}</dd>
          </div>
          <div>
            <dt className="label">Email</dt>
            <dd className="text-ink">{values.email}</dd>
          </div>
          <div>
            <dt className="label">About</dt>
            <dd className="text-ink">{values.subject}</dd>
          </div>
          <div>
            <dt className="label">Message</dt>
            <dd className="whitespace-pre-wrap text-ink">{values.message}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href={BUSINESS.phoneHref} className="btn-primary btn-sm">
            <Phone size={16} aria-hidden />
            Call {BUSINESS.phone}
          </a>
          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={startOver}
          >
            Clear and start over
          </button>
        </div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="card p-6 md:p-8">
      <FormTrap id="contact-website" />
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
          aria-describedby={
            errors.subject ? "contact-subject-error" : undefined
          }
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
                    className="accent-drop"
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
            placeholder="Order number if you have one. Otherwise: year, make and model, tire size, and whether you want it shipped to you or to the shop."
            value={values.message}
            onChange={update("message")}
            aria-invalid={errors.message ? "true" : undefined}
            aria-describedby={
              errors.message ? "contact-message-error" : undefined
            }
          />
          {errors.message && (
            <FieldError id="contact-message-error">{errors.message}</FieldError>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary mt-7 w-full sm:w-auto"
        disabled={sending}
      >
        {sending ? "Sending…" : "Send Message"}
      </button>

      <p className="mt-4 text-xs leading-relaxed text-smoke">
        We use what you send here to answer your question and nothing else. It
        is not added to a mailing list — there isn&apos;t one — and it is not
        passed to anyone outside the shop. See our{" "}
        <Link to="/privacy" className="underline hover:text-drop">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}

export default function ContactPage() {
  const wired = useFormsWired();
  return (
    <>
      <Seo
        title="Contact Us"
        description={`Questions about an order, shipping, a return or booking an install? Call ${BUSINESS.name} at ${BUSINESS.phone} or send a message and a person at the ${BUSINESS.shop.city} shop will get back to you.`}
      />

      <PageHero
        eyebrow="Contact"
        title="Talk to a person who actually works here"
        lede={`Orders, shipping, returns, fitment, an install appointment or a fleet — wherever you are in ${BUSINESS.shipping.area}, it is the same phone and the same people.`}
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
              title="Two ways to get an answer"
              lede={`${BUSINESS.name} is the online store of ${BUSINESS.parent}, ${BUSINESS.shop.full}. One phone number, one shop, one set of people — whether you are ordering from Florida or from three states away.`}
            />

            <div className="card border-l-4 border-l-drop p-6">
              <h3 className="h3 mb-2 flex items-center gap-2">
                <Package size={20} aria-hidden className="text-drop" />
                Fastest way to reach us
              </h3>
              <p className="text-sm leading-relaxed text-smoke">
                Call. If an order has already been placed, if you are sitting on
                a flat, or you need something changed before it ships, the phone
                beats the form every time — the person who answers can pull the
                order up while you are talking.
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
                  className="font-display text-2xl text-ink hover:text-drop"
                >
                  {BUSINESS.phone}
                </a>
                <p className="mt-2 text-sm text-smoke">
                  Order status, shipping questions, returns, fitment advice,
                  install appointments and fleet accounts.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-smoke">
                  The phone is the channel that reaches a person fastest
                  {wired
                    ? ", and the form below reaches the same people."
                    : " — the form below is not connected to an inbox yet."}
                </p>
              </li>

              <li className="card p-6">
                <h3 className="h3 mb-3 flex items-center gap-2">
                  <Mail size={20} aria-hidden className="text-drop" />
                  By email
                </h3>
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="break-all font-display text-2xl text-ink hover:text-drop"
                >
                  {BUSINESS.email}
                </a>
                <p className="mt-2 text-sm text-smoke">
                  One address for everything — orders, returns, fleet quotes and
                  dealer paperwork. Include an order number if you have one. If
                  it cannot wait, call instead.
                </p>
              </li>

              <li className="card p-6">
                <h3 className="h3 mb-3 flex items-center gap-2">
                  <MapPin size={20} aria-hidden className="text-drop" />
                  At the shop
                </h3>
                <p className="mb-3 text-sm leading-relaxed text-smoke">
                  {BUSINESS.parent}, the shop behind {BUSINESS.name} — for
                  pickups, installs and anything easier to explain in person.
                </p>
                <address className="not-italic text-sm text-ink">
                  {BUSINESS.shop.street}
                  <br />
                  {BUSINESS.shop.city}, {BUSINESS.shop.state}{" "}
                  {BUSINESS.shop.zip}
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
                    The shop & install area
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
                          className="py-2 text-left font-display text-base font-normal text-ink"
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
                <p className="mt-4 text-xs leading-relaxed text-smoke">
                  Eastern time. The store takes orders around the clock; people
                  answer during the hours above.
                </p>
              </li>
            </ul>
          </div>

          {/* ---------- Form ---------- */}
          <div>
            <SectionHead
              eyebrow="Message Us"
              title="Not urgent? Write it down."
              lede={
                wired
                  ? "Include an order number if you have one. Messages sent outside business hours get picked up the next morning we are open. If it is urgent, call instead — the form is not monitored around the clock."
                  : "Include an order number if you have one. This form is not connected to an inbox yet, so it will lay out what to tell us rather than send it — the phone is the channel that reaches a person."
              }
            />
            <ContactForm />
          </div>
        </div>
      </Section>

      <section className="bg-ink-wash py-12 text-bone md:py-16">
        <div className="wrap flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow-dark mb-2">Before you write</p>
            <h2 className="h2">A lot of it is already answered</h2>
            <p className="lede mt-3 max-w-xl text-bone/70">
              How shipping works, what ship-to-store costs, and what happens if
              a tire shows up wrong — all written out, no hold music.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:shrink-0">
            <Link to="/shipping" className="btn-primary">
              Shipping & Returns
            </Link>
            <Link to="/schedule" className="btn-ghost-light">
              Book an Install
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
