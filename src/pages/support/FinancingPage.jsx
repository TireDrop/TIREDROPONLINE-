import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  Info,
  Phone,
  Store,
  Truck,
  Wallet,
} from "lucide-react";
import { BUSINESS } from "../../data/business.js";
import { CONTACT_EMAIL, isWired, submitForm } from "../../data/forms.js";
import {
  Accordion,
  Badge,
  Breadcrumbs,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";

// The live store takes cards at checkout. This page lists the ways to pay
// without promising a program or a method that may not be running today.
const PAY_METHODS = [
  {
    icon: CreditCard,
    title: "Card",
    copy: "Major credit and debit cards. If you would rather not pay online, call and we can take the order and the card over the phone.",
  },
  {
    icon: Wallet,
    title: "Financing through a lender",
    copy: "A third-party financing provider can spread the cost over time. They review the application, they approve or decline it, and they set the rate and the term. Call first — which programs are open changes, and we will not send you to an application that is not running.",
  },
  {
    icon: Store,
    title: "In person at the shop",
    copy: `Paying for an install, an add-on service or a ship-to-store order at the counter in ${BUSINESS.shop.city}? Cards work there too, and so does cash.`,
  },
  {
    icon: Truck,
    title: "Fleet and commercial",
    copy: "Running several vehicles? Call us about how billing can be arranged for a fleet account rather than paying order by order.",
  },
];

const PLANS = [
  {
    name: "Short term",
    tag: "Small orders",
    highlight: false,
    summary:
      "Spread one or two tires, or a single install, over a few months of scheduled payments.",
    points: [
      "Best for a single tire, a pair, or an install appointment",
      "Short payment schedule, decided at approval",
      "The price of the tires does not change because you financed them",
    ],
    note: "Costs and any fees are set by the lender, not by us.",
  },
  {
    name: "Promotional period",
    tag: "Most common",
    highlight: true,
    summary:
      "Some lender programs offer no interest if the balance is paid in full within a promotional window on purchases over a set amount.",
    points: [
      "Typically aimed at a full set of four, or tires plus install",
      "Promotional terms apply only if you meet them exactly",
      "Interest can be charged back if the balance is not cleared in time",
    ],
    note: "Promotional offers change. Ask what is available the day you apply.",
  },
  {
    name: "Longer term",
    tag: "Bigger orders",
    highlight: false,
    summary:
      "Fixed monthly payments over a longer term for larger tickets — a wheel and tire package, or a set plus alignment and brakes.",
    points: [
      "Lower monthly payment, longer commitment",
      "Interest usually applies for the whole term",
      "You can normally pay it off early — confirm with the lender",
    ],
    note: "Rate and term depend entirely on the lender's decision.",
  },
];

const REQUIREMENTS = [
  "A valid, government-issued photo ID",
  "A Social Security number or ITIN, if the lender asks for one",
  "Proof of a steady income source",
  "An active checking account or debit card for payments",
  "A working phone number and email for the lender's verification step",
  "To be at least 18 years old, with a billing address in the United States",
];

const STEPS = [
  {
    title: "Build the order first",
    copy: "Put the tires or wheels in the cart, or call us and we will price it with you — including the install, if you are having it fitted. You need a real number before financing means anything.",
  },
  {
    title: "Apply with the lender",
    copy: "Financing is handled by a third-party provider, and we will point you at whichever program is open when you buy. The application is theirs, the decision is theirs, and the information you enter goes to them — not to us.",
  },
  {
    title: "Read what you were actually offered",
    copy: "If you are approved, check the amount, the term, the rate and any fees before you accept. Ask questions. Walking away at this point costs you nothing.",
  },
  {
    title: "The order goes through",
    copy: `Once payment is settled, the order is placed: shipped to your address, or sent free to the ${BUSINESS.shop.city} shop so we can fit it.`,
  },
];

const FAQ = [
  {
    q: "Do you decide who gets approved?",
    a: "No. We sell tires and wheels; we are not a lender. Applications go to a third-party financing company that makes its own decision using its own criteria. We find out the outcome at roughly the same time you do.",
  },
  {
    q: "Will applying affect my credit?",
    a: "That depends on the provider and the program. Some run a soft inquiry to pre-qualify and a hard inquiry only if you accept an offer. The lender has to disclose this during the application — read that part carefully before you submit.",
  },
  {
    q: "Can I finance an order that ships to my house?",
    a: "Yes. Financing covers the purchase, not the destination. A set shipped to an address three states away and a set fitted in Sunrise are paid for the same way.",
  },
  {
    q: "What if I am declined?",
    a: "Nothing changes on our side and we do not treat you any differently. You can still pay by card, and we can often re-work the order — the safety-critical tires now, the rest later.",
  },
  {
    q: "Can I pay it off early?",
    a: "Most plans allow it, and on a promotional no-interest offer paying early is usually the entire point. Confirm the details in your lender agreement, since early-payoff rules come from them.",
  },
  {
    q: "What if I return part of a financed order?",
    a: "Refunds go back through the way you paid, so a refund on a financed order is credited against your balance with the lender. That can take a billing cycle or two to show up on their side, and any interest already charged is between you and them. Our return terms are on the terms page.",
  },
  {
    q: "What payment methods do you take if I skip financing?",
    a: "Major credit and debit cards, and cards or cash in person at the shop. If you would rather pay over the phone, call and ask. If you are running a fleet, call and ask how billing can be arranged.",
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
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSending(true);
    const outcome = await submitForm("financing", values);
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
            properly, and point you to whichever financing program is running.
            If you would rather not wait for the call, the number below reaches
            the same people.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-smoke">
            This is not an application and it is not an approval — it only
            starts the conversation. Any credit decision is made by a
            third-party lender under their own terms.
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
          order properly and tell you which financing program is running that
          day. What you filled in is below — read it out, or copy it across,
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
          approval. Any credit decision is made by a third-party lender under
          their own terms.
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
      <h3 className="h3 mb-1">Start a financing conversation</h3>
      <p className="mb-6 text-sm text-smoke">
        {isWired()
          ? "This goes to us, not to a lender."
          : "Nothing here goes to a lender, and this form is not connected to an inbox yet — it lays out what to tell us on the phone."}{" "}
        No credit check happens here. All fields are required.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="fin-name">
            Full name
          </label>
          <input
            id="fin-name"
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
          <input
            id="fin-phone"
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
          <input
            id="fin-email"
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
          <input
            id="fin-amount"
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
  return (
    <>
      <Seo
        title="Financing & Payment Options"
        description={`How to pay for tires and wheels at ${BUSINESS.name} — cards at checkout, in person at the ${BUSINESS.shop.city} shop, or financing through a third-party lender who sets the terms.`}
      />

      <PageHero
        eyebrow="Financing"
        title="Tires now. Pay over time."
        lede="Nobody plans for a blown tire in the middle of the month. Here is every way you can pay for an order — including financing, where the terms are set by a third-party lender, not by us."
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
          lede="Most customers use the first one. The rest exist because not every order is a card swipe."
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
          accepted and which financing program is running today, call{" "}
          <a href={BUSINESS.phoneHref} className="underline hover:text-drop">
            {BUSINESS.phone}
          </a>{" "}
          before you order.
        </p>
      </Section>

      {/* ---------- Plans ---------- */}
      <Section className="bg-fog">
        <SectionHead
          eyebrow="Plan Options"
          title="Three shapes a plan usually takes"
          lede="These are the kinds of programs financing providers commonly offer for tire and wheel purchases. What you are actually offered depends on the lender and on your application."
        />

        <ul className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <li
              key={plan.name}
              className={`card flex flex-col p-6 ${
                plan.highlight ? "border-drop ring-1 ring-drop" : ""
              }`}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="h3">{plan.name}</h3>
                <Badge tone={plan.highlight ? "drop" : "soft"}>
                  {plan.tag}
                </Badge>
              </div>

              <p className="text-sm leading-relaxed text-smoke">
                {plan.summary}
              </p>

              <ul className="mt-5 flex-1 space-y-2.5 text-sm text-ink">
                {plan.points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <CheckCircle2
                      size={16}
                      aria-hidden
                      className="mt-0.5 shrink-0 text-drop"
                    />
                    {point}
                  </li>
                ))}
              </ul>

              <p className="mt-5 border-t border-ink/10 pt-4 text-xs leading-relaxed text-smoke">
                {plan.note}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-6 flex items-start gap-2 text-sm leading-relaxed text-smoke">
          <Info size={16} aria-hidden className="mt-0.5 shrink-0 text-drop" />
          We do not quote rates, approval odds or monthly payments on this page,
          because we do not set them. Ask us what programs are running the day
          you buy, and read the lender's offer before you accept it.
        </p>
      </Section>

      {/* ---------- Requirements + steps ---------- */}
      <Section className="bg-bone">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <div>
            <SectionHead
              eyebrow="Before You Apply"
              title="What you will likely need"
            />
            <div className="card p-6">
              <FileText size={26} aria-hidden className="mb-4 text-drop" />
              <ul className="space-y-3 text-sm text-ink">
                {REQUIREMENTS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span
                      aria-hidden
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-drop"
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-ink/10 pt-4 text-xs leading-relaxed text-smoke">
                Requirements come from the financing provider and can differ by
                program. This list is a general guide, not a checklist we
                control.
              </p>
            </div>
          </div>

          <div>
            <SectionHead
              eyebrow="How It Works"
              title="Four steps, start to finish"
            />
            <ol className="space-y-4">
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
          </div>
        </div>
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
                Financing is provided by a third-party company. They review the
                application, they decide, and they set the rate, the term and
                any fees. Nothing on this page is an offer of credit or a
                promise that you will be approved.
              </p>
              <p>
                <span className="text-bone">Rates and APR vary.</span> The
                annual percentage rate you are offered depends on the provider's
                program and on their review of your application. Some
                promotional plans advertise no interest if the full balance is
                paid within the promotional period — if it is not, interest may
                be charged on the original amount from the date of purchase.
                That is the detail people miss most often.
              </p>
              <p>
                <span className="text-bone">Read the agreement.</span> Your
                actual terms — payment amount, due dates, late fees, payoff
                rules — live in the agreement the lender gives you, not here.
                Those terms control if anything on this page reads differently.
              </p>
              <p>
                <span className="text-bone">Prices are separate.</span> What you
                pay us for tires, wheels and labor does not change
                based on how you pay. Financing costs, if any, are between you
                and the lender.
              </p>
              <p>
                <span className="text-bone">
                  Availability is not guaranteed.
                </span>{" "}
                Which financing programs we can point you at depends on the
                providers we are set up with at the time. This page describes
                how financing works when it is available; it is not a statement
                that a particular program is open today. Ask on the phone before
                you count on it.
              </p>
              <p>
                <span className="text-bone">Questions are free.</span> If any of
                this is unclear, call us at{" "}
                <a href={BUSINESS.phoneHref} className="text-volt underline">
                  {BUSINESS.phone}
                </a>{" "}
                before you sign anything. We would rather explain it twice than
                have you stuck in a plan you did not understand.
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
                isWired()
                  ? "Send this over and we will call you with a real price for the order and whatever financing options are running that week."
                  : "Fill this in, then call it through — whoever answers can give you a real price for the order and whatever financing options are running that week."
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
                  {isWired()
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
                  <span className="text-ink">Cards work too.</span> Financing is
                  an option, never a requirement.
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
