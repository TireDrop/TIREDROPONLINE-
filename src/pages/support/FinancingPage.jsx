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
  Wallet,
} from "lucide-react";
import { BUSINESS } from "../../data/business.js";
import {
  Accordion,
  Badge,
  Breadcrumbs,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";

const PLANS = [
  {
    name: "90-Day Option",
    tag: "Short term",
    highlight: false,
    summary:
      "Spread a smaller repair or a single tire over about three months of scheduled payments.",
    points: [
      "Best for repairs and one-or-two tire purchases",
      "Short payment schedule, decided at approval",
      "No effect on the price you pay us for the work",
    ],
    note: "Costs and any fees are set by the lender, not by us.",
  },
  {
    name: "6-Month Plan",
    tag: "Most common",
    highlight: true,
    summary:
      "Some lender programs offer no interest if the balance is paid in full within the promotional window on purchases over a set amount.",
    points: [
      "Typically aimed at full sets of tires or wheels",
      "Promotional terms apply only if you meet them exactly",
      "Interest can be charged back if the balance is not cleared in time",
    ],
    note: "Promotional offers change. Ask us what is available the day you apply.",
  },
  {
    name: "12-Month Plan",
    tag: "Bigger jobs",
    highlight: false,
    summary:
      "Fixed monthly payments over a longer term for larger tickets — a full set plus alignment, or tires and brakes together.",
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
  "To be at least 18 years old and a Florida resident (or able to show a US address)",
];

const STEPS = [
  {
    title: "Get your number first",
    copy: "Call us or send the form below with the vehicle and what it needs. We put a real price on the job — parts, labor, disposal and tax — before anybody applies for anything.",
  },
  {
    title: "Apply with the lender",
    copy: "We hand you off to a third-party financing provider. The application is theirs, the decision is theirs, and the information goes to them — not to us.",
  },
  {
    title: "Review what you were actually offered",
    copy: "If you are approved, read the amount, the term, the rate and any fees before you accept. Ask questions. Walking away at this point costs you nothing.",
  },
  {
    title: "We do the work",
    copy: "Once financing is settled, we schedule it — the van at your driveway or the bay in Sunrise — and the balance is handled through your plan.",
  },
];

const FAQ = [
  {
    q: "Do you decide who gets approved?",
    a: "No. We are a tire and auto shop, not a lender. Applications go to a third-party financing company that makes its own decision using its own criteria. We find out the outcome at roughly the same time you do.",
  },
  {
    q: "Will applying affect my credit?",
    a: "That depends on the provider and the program. Some run a soft inquiry to pre-qualify and a hard inquiry only if you accept an offer. The lender has to disclose this to you during the application — read that part carefully before you submit.",
  },
  {
    q: "What if I am declined?",
    a: "Nothing changes on our side and we do not treat you any differently. You can still pay by card, and we can often re-quote the job in stages — safety-critical work now, the rest later.",
  },
  {
    q: "Can I use financing for mobile service?",
    a: "Yes. Financing covers the work, not the location. A driveway install in Weston and a bay job in Sunrise can both be paid the same way.",
  },
  {
    q: "Can I pay it off early?",
    a: "Most plans allow it, and on a promotional no-interest offer paying early is usually the entire point. Confirm the details in your lender agreement, since early-payoff rules come from them.",
  },
  {
    q: "What payment methods do you take if I skip financing?",
    a: "Major credit and debit cards, plus cash at the shop. If you are booking a fleet or commercial account, call and ask about invoicing.",
  },
];

const EMPTY = { name: "", email: "", phone: "", amount: "" };

function validate(values) {
  const errors = {};

  if (!values.name.trim()) errors.name = "Enter the name that will be on the application.";

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
    errors.amount = "For anything this size, call us directly and we will walk through it.";
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
  const [sent, setSent] = useState(false);

  const update = (field) => (event) => {
    const { value } = event.target;
    setValues((prev) => ({ ...prev, [field]: value }));
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
      <div className="card border-l-4 border-l-drop p-6 md:p-8" role="status">
        <CheckCircle2 size={34} aria-hidden className="mb-4 text-drop" />
        <h3 className="h3">Request received.</h3>
        <p className="mt-3 text-sm leading-relaxed text-smoke">
          Thanks, {values.name.split(" ")[0]}. Someone from the shop will call
          you at {values.phone} during business hours to confirm the job, quote
          it properly, and point you to the financing provider's application.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-smoke">
          This is not an application and it is not an approval — it only starts
          the conversation. Any credit decision is made by a third-party lender
          under their own terms.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={BUSINESS.phoneHref} className="btn-primary btn-sm">
            <Phone size={16} aria-hidden />
            Call instead
          </a>
          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={() => {
              setValues(EMPTY);
              setSent(false);
            }}
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="card p-6 md:p-8">
      <h3 className="h3 mb-1">Start a financing conversation</h3>
      <p className="mb-6 text-sm text-smoke">
        This goes to the shop, not to a lender. No credit check happens here.
        All fields are required.
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
          {errors.name && <FieldError id="fin-name-error">{errors.name}</FieldError>}
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
          {errors.phone && <FieldError id="fin-phone-error">{errors.phone}</FieldError>}
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
          {errors.email && <FieldError id="fin-email-error">{errors.email}</FieldError>}
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

      <button type="submit" className="btn-primary mt-7 w-full sm:w-auto">
        Send Request
      </button>
    </form>
  );
}

export default function FinancingPage() {
  return (
    <>
      <Seo
        title="Financing & Payment Options"
        description={`Payment plans and financing options for tires, wheels and repairs at ${BUSINESS.name}. Approval and terms come from a third-party lender.`}
      />

      <PageHero
        eyebrow="Financing"
        title="Tires now. Pay over time."
        lede="Nobody plans for a blown tire in the middle of the month. If paying all at once does not work, there are financing options — with terms set by a third-party lender, explained plainly here."
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

      {/* ---------- Plans ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="Plan Options"
          title="Three shapes a plan usually takes"
          lede="These are the kinds of programs financing providers commonly offer for auto work. What you are actually offered depends on the lender and on your application."
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
                <Badge tone={plan.highlight ? "drop" : "soft"}>{plan.tag}</Badge>
              </div>

              <p className="text-sm leading-relaxed text-smoke">{plan.summary}</p>

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
      <Section className="bg-fog">
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
                      className="mt-2 h-1.5 w-1.5 shrink-0 bg-drop"
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
      <section className="bg-ink py-14 text-bone md:py-20">
        <div className="wrap">
          <div className="max-w-3xl">
            <p className="eyebrow mb-2">Terms, In Plain Language</p>
            <h2 className="h2">The part you should actually read</h2>

            <div className="mt-6 space-y-4 text-sm leading-relaxed text-bone/70">
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
                program and on their review of your application. Some promotional
                plans advertise no interest if the full balance is paid within
                the promotional period — if it is not, interest may be charged
                on the original amount from the date of purchase. That is the
                detail people miss most often.
              </p>
              <p>
                <span className="text-bone">Read the agreement.</span> Your
                actual terms — payment amount, due dates, late fees, payoff
                rules — live in the agreement the lender gives you, not here.
                Those terms control if anything on this page reads differently.
              </p>
              <p>
                <span className="text-bone">Prices are separate.</span> What you
                pay us for tires, parts and labor does not change based on how
                you pay. Financing costs, if any, are between you and the
                lender.
              </p>
              <p>
                <span className="text-bone">Questions are free.</span> If any of
                this is unclear, call the shop at{" "}
                <a href={BUSINESS.phoneHref} className="text-amber underline">
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
      <Section className="bg-bone" id="apply">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <div>
            <SectionHead
              eyebrow="Get Started"
              title="Tell us what you need covered"
              lede="Send this over and we will call you with a real quote and the financing options available that week."
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
                <CalendarClock size={22} aria-hidden className="shrink-0 text-drop" />
                <p className="text-sm leading-relaxed text-smoke">
                  <span className="text-ink">We call during business hours.</span>{" "}
                  Sent at night or on Sunday? You will hear from us the next day
                  we are open.
                </p>
              </li>
              <li className="card flex gap-4 p-5">
                <CreditCard size={22} aria-hidden className="shrink-0 text-drop" />
                <p className="text-sm leading-relaxed text-smoke">
                  <span className="text-ink">Cards work too.</span> Financing is
                  an option, never a requirement. See current{" "}
                  <Link to="/coupons" className="underline hover:text-drop">
                    coupons
                  </Link>{" "}
                  before you decide.
                </p>
              </li>
            </ul>
          </div>

          <ApplicationForm />
        </div>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section className="bg-fog">
        <SectionHead
          eyebrow="FAQ"
          title="Questions we get at the counter"
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
