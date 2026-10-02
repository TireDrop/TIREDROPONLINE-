import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronRight,
  ClipboardCheck,
  MapPin,
  PackageCheck,
  Search,
  ShoppingCart,
  Truck,
  Wrench,
  X,
} from "lucide-react";

import {
  PageHero,
  Section,
  SectionHead,
  Seo,
  Breadcrumbs,
} from "../../components/ui/index.jsx";
import { BUSINESS } from "../../data/business.js";
import {
  STATES,
  STATE_PAGES_LIVE,
  statePath,
} from "../../data/stateList.js";

/*
 * /tires-shipped — the nationwide hub: buying tires online, shipped free to
 * the 48 contiguous states and DC, and mounted by a local shop. It links every
 * state guide that is live (STATE_PAGES_LIVE in src/data/stateList.js).
 *
 * Not a second shipping page. /shipping ("How Shipping Works") stays the
 * logistics and policy page: the order flow, tracking, damaged, wrong and
 * out-of-stock items. This page answers "can I buy tires online and get them
 * fitted where I live?", links to /shipping for the details, and keeps its own
 * answers short so the two never compete for the same search.
 */

export const HUB_STEPS = [
  {
    icon: Search,
    title: "Find your size",
    body: "Shop by vehicle or by the size on your sidewall. Find My Tires matches the size your vehicle came with.",
  },
  {
    icon: ClipboardCheck,
    title: "We confirm the fit",
    body: "We confirm fitment before your order ships, because a mounted tire can't be returned.",
  },
  {
    icon: Truck,
    title: "Free shipping to your door",
    body: "Your tires ship free from a distributor warehouse that stocks them, and we email tracking once the carrier has it.",
  },
  {
    icon: Wrench,
    title: "A local shop mounts them",
    body: "Take them, or ship them, to any shop that mounts customer tires. In South Florida we can install them ourselves.",
  },
];

export const HUB_INCLUDED = [
  "Shipping to any street address in the 48 contiguous states and DC, with no order minimum",
  "Tracking emailed once the carrier has a number",
  "A fitment check before your order ships",
  "A real phone number for questions: " + BUSINESS.phone,
  "Free ship-to-store at our Sunrise, Florida shop",
];

export const HUB_NOT_INCLUDED = [
  "Installation outside Miami-Dade, Broward and Palm Beach counties",
  "Shipping to Alaska, Hawaii, US territories or outside the US",
  "Your local shop's charges for mounting, balancing and old-tire disposal",
];

export const HUB_FAQ = [
  {
    q: "How much does shipping cost?",
    a: "Nothing. Shipping is free to any street address in the 48 contiguous states and DC, with no order minimum and no handling fee added after you pay.",
  },
  {
    q: "How are the tires packed?",
    a: "The distributor warehouse that ships your order packs it, so the wrapping and labels can differ from one warehouse to the next, and a set of four can come in more than one parcel. Check every tire against your order before it's mounted; if one is damaged, photograph it and call us first.",
  },
  {
    q: "What about taxes and state tire fees?",
    a: "Taxes and fees are calculated at checkout, for your address. Many states charge a fee on each new tire, and each state guide explains that state's fee with its source.",
  },
  {
    q: "Can I return tires?",
    a: "Unused, unmounted tires in their original condition can go back once we've authorized the return, so call before you send anything. A mounted tire can't be returned. The full policy is in Returns & Refunds.",
    link: { to: "/terms#returns", label: "Returns & Refunds" },
  },
  {
    q: "Who mounts my tires outside South Florida?",
    a: "Any tire shop that mounts customer-supplied tires. Call ahead, ask what it charges per tire, and bring your order confirmation. You can also ship the order straight to that shop if it agrees to take it in.",
  },
  {
    q: "Do you install tires outside South Florida?",
    a: "No. Our installation, at the Sunrise shop or by mobile van, covers Miami-Dade, Broward and Palm Beach counties only. Everywhere else we ship, and a local shop of your choosing does the fitting.",
    link: { to: "/mobile-service", label: "Mobile installation in South Florida" },
  },
];

const TOOLS = [
  { label: "Find My Tires", to: "/find-my-tires" },
  { label: "Tire Size Decoder", to: "/tire-size" },
  { label: "Load & Speed Rating Check", to: "/load-speed-check" },
  { label: "Plus Size Calculator", to: "/plus-size-calculator" },
];

export default function NationwideShippingPage() {
  const live = new Set(STATE_PAGES_LIVE);
  return (
    <>
      <Seo
        title="Tires Shipped Free Nationwide (48 states + DC)"
        description={`Buy tires online from ${BUSINESS.name} and they ship free to ${BUSINESS.shipping.area}. Fitment checked, tracking emailed, mounted by any local shop. State tire guides inside.`}
      />
      <Breadcrumbs trail={[{ label: "Shipping to 48 States + DC" }]} />

      <PageHero
        eyebrow="Free shipping · 48 states + DC"
        title="Tires Shipped Free Nationwide"
        lede={`Buy tires online from ${BUSINESS.name} and they ship free to any street address in ${BUSINESS.shipping.area}, with no order minimum. Pick by vehicle or size, let us confirm the fit, and have any local shop mount them. In South Florida, we can install them too.`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to="/tires" className="btn-primary">
            <ShoppingCart size={18} aria-hidden />
            Shop Tires
          </Link>
          <Link to="/find-my-tires" className="btn-ghost-light">
            <Search size={18} aria-hidden />
            Find My Tires
          </Link>
        </div>
      </PageHero>

      {/* ---------- How it works ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="How it works"
          title="Ordered online, mounted near you"
        />
        <ol className="-mt-2 grid gap-5 sm:grid-cols-2 md:-mt-6 lg:grid-cols-4">
          {HUB_STEPS.map((step, i) => (
            <li key={step.title} className="card p-6">
              <div className="flex items-center justify-between">
                <step.icon size={22} aria-hidden className="text-drop" />
                <span aria-hidden className="font-display text-3xl leading-none text-ink/50">
                  0{i + 1}
                </span>
              </div>
              <h3 className="h3 mt-4">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-smoke">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------- Why free + included / not ---------- */}
      <Section className="bg-fog">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14">
          <div>
            <SectionHead eyebrow="Why it's free" title="Shipping is part of the price" />
            <div className="-mt-2 space-y-4 text-[15px] leading-relaxed text-ink md:-mt-6">
              <p>
                {BUSINESS.name} holds no stock of its own. Your tires leave from a
                distributor warehouse that has your size, so there's no second
                trip through a store and no shipping line added at checkout.
                Free shipping is how the store works every day, not an offer
                that comes and goes.
              </p>
              <p>
                The details of the order flow, tracking, and what we do about a
                damaged, wrong or out-of-stock tire are on{" "}
                <Link to="/shipping" className="text-drop underline hover:text-dive">
                  How Shipping Works
                </Link>
                .
              </p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="card p-6">
              <h3 className="h3">Included</h3>
              <ul className="mt-3 space-y-2.5">
                {HUB_INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
                    <Check size={17} aria-hidden className="mt-0.5 shrink-0 text-drop" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-6">
              <h3 className="h3">Not included</h3>
              <ul className="mt-3 space-y-2.5">
                {HUB_NOT_INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
                    <X size={17} aria-hidden className="mt-0.5 shrink-0 text-smoke" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------- Fitment ---------- */}
      <Section className="bg-bone">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <SectionHead eyebrow="Fitment" title="Check the fit before it ships" />
            <div className="-mt-2 space-y-4 text-[15px] leading-relaxed text-ink md:-mt-6">
              <p>
                Ordering tires you'll have mounted hundreds of miles from us
                means the size has to be right the first time. Once you pick
                your vehicle, every tire page tells you whether it matches the
                size on file for it, and we confirm fitment before your order
                ships.
              </p>
              <p className="text-sm text-smoke">
                Changing wheel size, carrying heavy loads or towing? Check load
                index and speed rating, and what a plus size does to your
                speedometer, before you buy.
              </p>
            </div>
          </div>
          <ul className="flex flex-wrap content-start gap-2.5">
            {TOOLS.map((t) => (
              <li key={t.to}>
                <Link to={t.to} className="btn-outline btn-sm">
                  {t.label}
                  <ArrowRight size={14} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ---------- All states ---------- */}
      <Section className="bg-fog">
        <SectionHead
          eyebrow="State guides"
          title="Pick your state"
          lede="Tires ship free to every state on this list. Linked states have a guide to their tread laws, stud and chain rules, tire fees and the tire type their climate calls for. We're adding the rest in batches."
        />
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {STATES.map((s) => (
            <li key={s.slug}>
              {live.has(s.slug) ? (
                <Link
                  to={statePath(s.slug)}
                  className="card-hover flex min-h-[44px] items-center gap-2 px-3 py-2 font-display text-[15px] font-bold text-ink hover:text-drop"
                >
                  <MapPin size={14} aria-hidden className="shrink-0 text-drop" />
                  {s.name}
                </Link>
              ) : (
                <span className="flex min-h-[44px] items-center px-3 py-2 text-[15px] text-smoke">
                  {s.name}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section className="bg-bone">
        <SectionHead eyebrow="Questions" title="Buying tires online, answered" />
        <div className="divide-y divide-ink/10 border-y border-ink/10">
          {HUB_FAQ.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[1.0625rem] font-bold leading-snug tracking-[-0.012em] text-ink transition-colors hover:text-drop md:text-[1.15rem]">
                {item.q}
                <ChevronRight
                  size={18}
                  aria-hidden
                  className="shrink-0 text-drop transition-transform group-open:rotate-90"
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-smoke">
                {item.a}
                {item.link && (
                  <>
                    {" "}
                    <Link to={item.link.to} className="text-drop underline hover:text-dive">
                      {item.link.label}
                    </Link>
                  </>
                )}
              </p>
            </details>
          ))}
        </div>
      </Section>

      {/* ---------- CTA ---------- */}
      <Section className="bg-steel-wash text-bone">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow-dark mb-2">{BUSINESS.tagline}</p>
            <h2 className="h2">Find your size, and it ships free</h2>
            <p className="lede mt-3 text-bone/70">
              Shop by vehicle or by size. In Miami-Dade, Broward or Palm Beach?
              Ship to our Sunrise shop free, or book the mobile van.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:w-auto">
            <Link to="/tires" className="btn-primary">
              <ShoppingCart size={18} aria-hidden />
              Shop Tires
            </Link>
            <Link to="/find-my-tires" className="btn-ghost-light">
              <PackageCheck size={18} aria-hidden />
              Find My Tires
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
