import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Info,
  Phone,
  Store,
  Wallet,
} from "lucide-react";
import { BUSINESS } from "../../data/business.js";
import {
  CONTACT_EMAIL,
  hasChanges,
  readFormValues,
  submitForm,
  useFormsWired,
} from "../../data/forms.js";
import {
  Accordion,
  Breadcrumbs,
  FormTrap,
  Input,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";

// How an order actually gets paid for. Online, that is our Shopify checkout;
// Shop Pay Installments is Shop Pay's own option there, so this page names it
// but never quotes its terms, rates or who stands behind it.
const PAY_METHODS = [
  {
    icon: CreditCard,
    title: "Card",
    copy: "Major credit and debit cards at our Shopify checkout. If you would rather not pay online, call and we can take the order and the card over the phone.",
  },
  {
    icon: Wallet,
    title: "Shop Pay",
    copy: "If you already use Shop Pay, it is at the same checkout, with your saved details.",
  },
  {
    icon: CalendarClock,
    title: "Shop Pay Installments",
    copy: "Split the payment with Shop Pay Installments at checkout, subject to eligibility. Shop Pay shows you the terms at checkout before you confirm. We do not set them.",
  },
  {
    icon: Store,
    title: "In person at the shop",
    copy: `Paying for an install, an add-on service or a ship-to-store order at the counter in ${BUSINESS.shop.city}? Cards work there too, and so does cash. Ask in the shop about ways to pay.`,
  },
];

const STEPS = [
  {
    title: "Build the order first",
    copy: "Put the tires or wheels in the cart, or call us and we will price it with you, including the install if you are having it fitted.",
  },
  {
    title: "Choose how to pay at checkout",
    copy: "Our checkout runs on Shopify. Pick card, Shop Pay, or Shop Pay Installments if it is offered for your order.",
  },
  {
    title: "Read the terms Shop Pay shows you",
    copy: "If you choose Shop Pay Installments, Shop Pay shows the payment schedule and terms before you confirm, and decides eligibility. Walking away at that point costs you nothing.",
  },
  {
    title: "The order goes through",
    copy: `Once payment is settled, the order is placed: shipped to your address, or sent free to the ${BUSINESS.shop.city} shop so we can fit it.`,
  },
];

const FAQ = [
  {
    q: "Do you decide who can pay in installments?",
    a: "No. We sell tires and wheels; we are not a lender. Whether Shop Pay Installments is offered for your order is decided at checkout, not by us.",
  },
  {
    q: "Will choosing Shop Pay Installments affect my credit?",
    a: "Shop Pay explains what its eligibility check involves at checkout, before you confirm. Read that part before you continue. The request form on this page does not touch your credit.",
  },
  {
    q: "Can I pay over time on an order that ships to my house?",
    a: "Yes. How you pay does not depend on where the order goes. A set shipped to another state and a set fitted in Sunrise go through the same checkout.",
  },
  {
    q: "What if Shop Pay Installments is not offered for my order?",
    a: "Nothing changes on our side. You can still pay by card or Shop Pay, call us to pay by phone, or ask in the shop.",
  },
  {
    q: "What if I return part of an order I paid for in installments?",
    a: "Refunds go back the way you paid, so a refund on an installment order is applied through Shop Pay. It can take a billing cycle to show up there. Our return terms are on the terms page.",
  },
  {
    q: "What payment methods do you take?",
    a: "Online: major credit and debit cards, Shop Pay, and Shop Pay Installments where it is offered. In person at the shop: cards or cash. If you would rather pay over the phone, call and ask.",
  },
];

const EMPTY = { name: "", email: "", phone: "", amount: "" };

function validate(values) {
  const errors = {};

  if (!values.name.trim())
    errors.name = "Enter the name that will be on the application.";

  if (!values.email.trim()) {
    errors.email = "We need an email to follow up.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) {
    errors.email = "That email address does not look complete.";
  }

  const digits = values.phone.replace(/\D/g, "");
  if (!values.phone.trim()) {
    errors.phone = "A phone number is required.";
  } else if (digits.length < 10) {
    errors.phone = "Enter a 10-digit phone number, area code included.";
  }

  const amount = Number(values.amount);
  if (!values.amount.trim()) {
    errors.amount = "Roughly how much do you need to cover?";
  } else if (Number.isNaN(amount) || amount <= 0) {
    errors.amount = "Enter the amount in dollars, numbers only.";
  } else if (amount > 25000) {
    errors.amount =
      "For anything this size, call us directly and we will walk through it.";
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

function ApplicationForm() {
  const wired = useFormsWired();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const update = (field) => (event) => {
    const { value } = event.target;
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const startOver = () => {
    setValues(EMPTY);
    setResult(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (sending) return; // a second click must not fire a second send
    const formElement = event.currentTarget;
    // What is in the fields, including anything filled in without an input
    // event, which state never saw.
    const { values: current, changed } = readFormValues(formElement, values);
    if (hasChanges(changed)) setValues((prev) => ({ ...prev, ...changed }));
    const found = validate(current);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSending(true);
    const outcome = await submitForm("financing", current, formElement);
    setSending(false);
    setResult(outcome);
  };

  if (result) {
    const firstName = values.name.split(" ")[0];

    // Only a delivered request earns the confirmation that promises a call.
    if (result.delivered) {
      return (
        <div className="card border-l-4 border-l-drop p-6 md:p-8" role="status">
          <CheckCircle2 size={34} aria-hidden className="mb-4 text-drop" />
          <h3 className="h3">Request received.</h3>
          <p className="mt-3 text-sm leading-relaxed text-smoke">
            Thanks, {firstName}. Someone will call you at {values.phone} during
            the hours the shop is open, to confirm what you are buying, price it
            properly, and go through the ways to pay. If you would rather not
            wait for the call, the number below reaches the same people.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-smoke">
            This is not an application and it is not an approval. It only
            starts the conversation. If you pay with Shop Pay Installments,
            eligibility and terms are shown by Shop Pay at checkout.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={BUSINESS.phoneHref} className="btn-primary btn-sm">
              <Phone size={16} aria-hidden />
              Call instead
            </a>
            <button
              type="button"
              className="btn-outline btn-sm"
              onClick={startOver}
            >
              Start over
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="card border-l-4 border-l-amber p-6 md:p-8" role="status">
        <Phone size={34} aria-hidden className="mb-4 text-drop" />
        <h3 className="h3">
          {result.error
            ? `We could not get that through just now, ${firstName}.`
            : `Nothing was sent, ${firstName} — start it on the phone.`}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-smoke">
          {result.error
            ? "Your request did not leave this page, so no call is queued. Do not sit waiting on one — one phone call gets you the same conversation."
            : "Being straight with you: this form is not connected to an inbox yet, so your request was not sent anywhere and no call is queued. The phone reaches the same people it would have gone to."}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-smoke">
          Call{" "}
          <a href={BUSINESS.phoneHref} className="text-drop underline">
            {BUSINESS.phone}
          </a>{" "}
          during the hours the shop is open and whoever answers can price the
          order properly and go through the ways to pay. What you filled in is
          below — read it out, or copy it across,
          rather than typing it again.
          {CONTACT_EMAIL ? ` You can also send it to ${CONTACT_EMAIL}.` : ""}
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
            <dt className="label">Amount needed</dt>
            <dd className="text-ink">${values.amount}</dd>
          </div>
        </dl>

        <p className="mt-5 text-sm leading-relaxed text-smoke">
          Either way, none of this was an application and none of it was an
          approval. If you pay with Shop Pay Installments, eligibility and terms
          are shown by Shop Pay at checkout.
        </p>

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
      <FormTrap id="financing-website" />
      <h3 className="h3 mb-1">Ask us about paying for an order</h3>
      <p className="mb-6 text-sm text-smoke">
        {wired
          ? "This goes to us, not to a lender."
          : "This form is not connected to an inbox yet, so it lays out what to tell us on the phone."}{" "}
        No credit check happens here. All fields are required.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="fin-name">
            Full name
          </label>
          <Input
            id="fin-name"
            name="name"
            type="text"
            autoComplete="name"
            className="field"
            placeholder="Alex Moreno"
            value={values.name}
            onChange={update("name")}
            aria-invalid={errors.name ? "true" : undefined}
            aria-describedby={errors.name ? "fin-name-error" : undefined}
          />
          {errors.name && (
            <FieldError id="fin-name-error">{errors.name}</FieldError>
          )}
        </div>

        <div>
          <label className="label" htmlFor="fin-phone">
            Phone
          </label>
          <Input
            id="fin-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="field"
            placeholder="(954) 555-0188"
            value={values.phone}
            onChange={update("phone")}
            aria-invalid={errors.phone ? "true" : undefined}
            aria-describedby={errors.phone ? "fin-phone-error" : undefined}
          />
          {errors.phone && (
            <FieldError id="fin-phone-error">{errors.phone}</FieldError>
          )}
        </div>

        <div>
          <label className="label" htmlFor="fin-email">
            Email
          </label>
          <Input
            id="fin-email"
            name="email"
            type="email"
            autoComplete="email"
            className="field"
            placeholder="you@example.com"
            value={values.email}
            onChange={update("email")}
            aria-invalid={errors.email ? "true" : undefined}
            aria-describedby={errors.email ? "fin-email-error" : undefined}
          />
          {errors.email && (
            <FieldError id="fin-email-error">{errors.email}</FieldError>
          )}
        </div>

        <div>
          <label className="label" htmlFor="fin-amount">
            Amount needed (USD)
          </label>
          <Input
            id="fin-amount"
            name="amount"
            type="text"
            inputMode="decimal"
            className="field"
            placeholder="850"
            value={values.amount}
            onChange={update("amount")}
            aria-invalid={errors.amount ? "true" : undefined}
            aria-describedby={
              errors.amount ? "fin-amount-error" : "fin-amount-hint"
            }
          />
          {errors.amount ? (
            <FieldError id="fin-amount-error">{errors.amount}</FieldError>
          ) : (
            <p id="fin-amount-hint" className="mt-1.5 text-xs text-smoke">
              A rough estimate is fine — we will quote the real number.
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary mt-7 w-full sm:w-auto"
        disabled={sending}
      >
        {sending ? "Sending…" : "Send Request"}
      </button>
    </form>
  );
}

export default function FinancingPage() {
  const wired = useFormsWired();
  return (
    <>
      <Seo
        title="Financing & Payment Options"
        description={`How to pay for tires and wheels at ${BUSINESS.name}: card, Shop Pay or Shop Pay Installments at our Shopify checkout, or in person at the ${BUSINESS.shop.city} shop.`}
      />

      <PageHero
        eyebrow="Financing"
        title="Tires now. Pay over time."
        lede="Nobody plans for a blown tire in the middle of the month. Here is every way you can pay for an order, including Shop Pay Installments at checkout, subject to eligibility."
      >
        <div className="flex flex-wrap gap-3">
          <a href="#apply" className="btn-primary">
            Start a Request
          </a>
          <a href={BUSINESS.phoneHref} className="btn-ghost-light">
            <Phone size={18} aria-hidden />
            {BUSINESS.phone}
          </a>
        </div>
      </PageHero>

      <Breadcrumbs trail={[{ label: "Financing" }]} />

      {/* ---------- Ways to pay ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="Ways To Pay"
          title="Four ways an order gets paid for"
          lede="The first three happen at our Shopify checkout. If your order comes to us as a request instead, we take payment on the phone or at the shop."
        />

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PAY_METHODS.map(({ icon: Icon, title, copy }) => (
            <li key={title} className="card p-6">
              <Icon size={26} aria-hidden className="mb-4 text-drop" />
              <h3 className="h3">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-smoke">{copy}</p>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm leading-relaxed text-smoke">
          We would rather under-promise here than list a payment method that
          turns out not to work at checkout. If you want to know exactly what is
          accepted before you order, call{" "}
          <a href={BUSINESS.phoneHref} className="underline hover:text-drop">
            {BUSINESS.phone}
          </a>{" "}
          before you order.
        </p>
      </Section>

      {/* ---------- How it works ---------- */}
      <Section className="bg-fog">
        <SectionHead eyebrow="How It Works" title="Four steps, start to finish" />
        <ol className="grid gap-4 md:grid-cols-2">
          {STEPS.map((step, i) => (
            <li key={step.title} className="card flex gap-4 p-6">
              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-ink font-display text-xl text-amber"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="h3">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-smoke">
                  {step.copy}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 flex items-start gap-2 text-sm leading-relaxed text-smoke">
          <Info size={16} aria-hidden className="mt-0.5 shrink-0 text-drop" />
          We do not quote payment plans, approval odds or monthly payments on
          this page, because we do not set them. Shop Pay shows you the terms at
          checkout before you confirm.
        </p>
      </Section>

      {/* ---------- Disclosure ---------- */}
      <section className="bg-ink-wash py-14 text-bone md:py-20">
        <div className="wrap">
          <div className="max-w-3xl">
            <p className="eyebrow-dark mb-2">Terms, In Plain Language</p>
            <h2 className="h2">The part you should actually read</h2>

            <div className="mt-7 max-w-[68ch] space-y-5 text-[15px] leading-[1.75] text-bone/70">
              <p>
                <span className="text-bone">
                  We are not a bank and we are not a lender.
                </span>{" "}
                Shop Pay Installments is offered by Shop Pay at our Shopify
                checkout, subject to eligibility. Shop Pay decides whether it is
                offered and shows the terms before you confirm. Nothing on this
                page is an offer of credit.
              </p>
              <p>
                <span className="text-bone">Read what you are shown.</span> The
                payment schedule and everything else about an installment plan
                are on the screen Shop Pay shows you at checkout, not here.
                Those terms control if anything on this page reads differently.
              </p>
              <p>
                <span className="text-bone">Prices are separate.</span> What you
                pay us for tires, wheels and labor does not change based on how
                you pay.
              </p>
              <p>
                <span className="text-bone">
                  Availability is not guaranteed.
                </span>{" "}
                Whether Shop Pay Installments appears depends on your order and
                on eligibility. If it does not, pay by card or Shop Pay, or ask
                in the shop.
              </p>
              <p>
                <span className="text-bone">Questions are free.</span> If any of
                this is unclear, call us at{" "}
                <a href={BUSINESS.phoneHref} className="text-volt underline">
                  {BUSINESS.phone}
                </a>{" "}
                before you pay. We would rather explain it twice than have you
                pay in a way you did not mean to.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Application form ---------- */}
      <Section className="bg-fog" id="apply">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <div>
            <SectionHead
              eyebrow="Get Started"
              title="Tell us what you need covered"
              lede={
                wired
                  ? "Send this over and we will call you with a real price for the order and go through the ways to pay."
                  : "Fill this in, then call it through. Whoever answers can give you a real price for the order and go through the ways to pay."
              }
            />

            <ul className="space-y-4">
              <li className="card flex gap-4 p-5">
                <Wallet size={22} aria-hidden className="shrink-0 text-drop" />
                <p className="text-sm leading-relaxed text-smoke">
                  <span className="text-ink">No credit check here.</span> This
                  form does not touch your credit and is not an application.
                </p>
              </li>
              <li className="card flex gap-4 p-5">
                <CalendarClock
                  size={22}
                  aria-hidden
                  className="shrink-0 text-drop"
                />
                <p className="text-sm leading-relaxed text-smoke">
                  <span className="text-ink">
                    We talk during business hours.
                  </span>{" "}
                  {wired
                    ? "Sent at night or on Sunday? You will hear from us the next day we are open."
                    : "Reading this at night or on a Sunday? The line opens again the next day we are open."}{" "}
                  Eastern time.
                </p>
              </li>
              <li className="card flex gap-4 p-5">
                <CreditCard
                  size={22}
                  aria-hidden
                  className="shrink-0 text-drop"
                />
                <p className="text-sm leading-relaxed text-smoke">
                  <span className="text-ink">Cards work too.</span> Paying over
                  time is an option, never a requirement.
                </p>
              </li>
            </ul>
          </div>

          <ApplicationForm />
        </div>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="FAQ"
          title="Questions we get on the phone"
          align="center"
        />
        <div className="mx-auto max-w-3xl">
          <Accordion items={FAQ} />
          <p className="mt-8 text-center text-sm text-smoke">
            Still unsure?{" "}
            <Link to="/contact" className="underline hover:text-drop">
              Send us a message
            </Link>{" "}
            or call{" "}
            <a href={BUSINESS.phoneHref} className="underline hover:text-drop">
              {BUSINESS.phone}
            </a>
            .
          </p>
        </div>
      </Section>
    </>
  );
}
