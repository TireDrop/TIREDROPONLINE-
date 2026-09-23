import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Ban,
  CalendarCheck,
  Check,
  Clock,
  Gauge,
  MapPin,
  Phone,
  Radio,
  Ruler,
  ShieldCheck,
  Truck,
  Wrench,
  X,
  Zap,
} from "lucide-react";

import { Accordion, Badge, PageHero, Section, SectionHead, Seo } from "../../components/ui/index.jsx";
import { BUSINESS } from "../../data/business.js";
import { MOBILE_SERVICES } from "../../data/services.js";

const STEPS = [
  {
    icon: CalendarCheck,
    title: "Book online or call",
    body:
      "Pick your service, your vehicle and the day that works. Takes about two minutes. Prefer a human? Call us and we will write it up for you.",
  },
  {
    icon: Phone,
    title: "We confirm a 2-hour window",
    body:
      "A dispatcher confirms your appointment and locks in a two-hour arrival window, so you are not burning a whole day waiting on a van.",
  },
  {
    icon: Truck,
    title: "Van arrives fully equipped",
    body:
      "Tires, balancer, torque tools and power all roll up together. Your car never moves, and the work happens in your own parking spot.",
  },
  {
    icon: Zap,
    title: "You drive on new tires",
    body:
      "We torque to spec, set pressures, haul off the old rubber and take payment on the spot. You never left home.",
  },
];

const VAN_KIT = [
  {
    icon: Gauge,
    name: "Calibrated spin balancer",
    detail: "Dynamic balancing on board — the same machine standard the shop runs, not a bubble balancer.",
  },
  {
    icon: Wrench,
    name: "Tire changer & bead breaker",
    detail: "Mounts everything from a compact 15\" to a 22\" truck wheel without scratching the finish.",
  },
  {
    icon: ShieldCheck,
    name: "Calibrated torque wrenches",
    detail: "Every lug goes back to your manufacturer's spec in a star pattern. No rattle guns left to guess.",
  },
  {
    icon: Radio,
    name: "TPMS programmer",
    detail: "Scans, relearns and programs sensors so the dashboard light goes out before we leave.",
  },
  {
    icon: Ruler,
    name: "Tread depth gauges & inflation",
    detail: "Depth measured at every corner and pressures set to the door-placard number.",
  },
  {
    icon: Truck,
    name: "Tire cart, floor jack & stands",
    detail: "Rated jack, stands and a cart so heavy assemblies get handled safely on your driveway.",
  },
  {
    icon: Zap,
    name: "Onboard power & lighting",
    detail: "Generator and work lights mean we do not need your outlet, your garage or daylight.",
  },
  {
    icon: Ban,
    name: "Old tire haul-off",
    detail: "Your old set leaves with us and gets recycled. Nothing gets left at the curb.",
  },
];

const COMPARISON = [
  { us: "Work happens where your car is parked", them: "Drive over and hope the bay is open" },
  { us: "A two-hour window you actually pick", them: "\"Should be a couple hours\" with no promise" },
  { us: "You keep working, cooking or sleeping", them: "You sit in a lobby with bad coffee" },
  { us: "No second vehicle or ride needed", them: "Someone has to drop you off and pick you up" },
  { us: "Flat tire? We come to the flat", them: "You put the donut on first, then drive on it" },
  { us: "Old tires hauled away and recycled", them: "Disposal fee tacked on at the register" },
];

const FAQ = [
  {
    q: "Does mobile service cost more than coming to the shop?",
    a:
      "No. Our mobile labor rates are the same rates we charge in the bay — tire installation starts at $25 per tire whether the van comes to you or you come to Sunrise. Within our Broward service area there is no trip fee on standard appointments.",
  },
  {
    q: "How much room does the van need?",
    a:
      "One standard parking space next to your vehicle and about ten feet of clearance on the work side. A driveway, a flat stretch of street, an office lot or a jobsite staging area all work. We do not need your garage and we do not need a lift.",
  },
  {
    q: "What happens if it rains?",
    a:
      "South Florida rain is part of the job. Short afternoon showers rarely stop us — the van carries lighting and cover for the work area. If there is lightning or sustained heavy rain, we call you, pause the job and reschedule at the front of the next available window. You are never charged for weather.",
  },
  {
    q: "Can you come to an apartment or condo complex?",
    a:
      "Yes, and we do it every week. Some complexes want the van checked in at the gate or ask that work happen in a visitor space rather than a covered garage. Tell us the complex name and any gate code or call-up instructions when you book and we will handle it with management on arrival.",
  },
  {
    q: "How long does a mobile appointment take?",
    a:
      "A four-tire installation runs about 45 to 75 minutes. A single flat repair is roughly 30 minutes, a rotation about 30, and a full-synthetic oil change 30 to 45. Your confirmation lists the estimate for the exact service you booked.",
  },
  {
    q: "Do I have to be there while you work?",
    a:
      "You need to be there at the start to hand over the keys or unlock the vehicle, and at the end to approve the work and pay. In between, go back inside — most customers do. If you have to step out, leave a number and we will call before anything changes on the invoice.",
  },
  {
    q: "How do I pay?",
    a:
      "We take card, tap-to-pay and cash at your vehicle, and we email the receipt before the van pulls off. Financing is available on larger tire and wheel packages — ask when you book.",
  },
  {
    q: "What if my vehicle needs work the van cannot do?",
    a:
      "Brakes, alignment, suspension, lift kits and diagnostics are bay work — they need a lift and alignment rack, so they happen at our Sunrise shop. If the tech spots something like that in your driveway, you will hear it straight, with an estimate, and we will get you on the schedule at the shop.",
  },
];

export default function MobileServicePage() {
  return (
    <>
      <Seo
        title="Mobile Tire Service in Broward County"
        description="Extreme Mobile Tires brings a fully equipped van to your home, office or jobsite in Sunrise and across Broward County for tire installation, balancing, repair, rotation, oil changes and TPMS."
      />

      <PageHero
        eyebrow="Mobile Tire & Auto Service"
        title="We bring the shop to your driveway"
        lede="A fully equipped van, a certified tech and your tires — parked where your car already is. Installation, balancing, repair, rotation, oil changes and TPMS, done at your home, office or jobsite across Broward County."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to="/schedule" className="btn-primary">
            Book Mobile Service
            <ArrowRight size={18} aria-hidden />
          </Link>
          <a href={BUSINESS.phoneHref} className="btn-ghost-light">
            <Phone size={18} aria-hidden />
            Call {BUSINESS.phone}
          </a>
        </div>
        <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-bone/60">
          <span className="flex items-center gap-1.5">
            <Check size={14} aria-hidden className="text-amber" />
            Serving Broward since {BUSINESS.foundedYear}
          </span>
          <span className="flex items-center gap-1.5">
            <Check size={14} aria-hidden className="text-amber" />
            Two-hour arrival windows
          </span>
          <span className="flex items-center gap-1.5">
            <Check size={14} aria-hidden className="text-amber" />
            Old tires hauled away
          </span>
        </p>
      </PageHero>

      {/* ---------- How it works ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="How it works"
          title="Four steps. You never leave home."
          lede="No drop-off, no shuttle, no waiting room. Here is exactly how a mobile appointment runs from the moment you book."
        />

        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="card-hover flex flex-col p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-sm bg-ink text-bone">
                  <step.icon size={20} aria-hidden />
                </span>
                <span className="font-display text-4xl leading-none text-ink/10">
                  0{i + 1}
                </span>
              </div>
              <h3 className="h3 mt-5">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-smoke">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------- What the van does ---------- */}
      <Section className="bg-fog">
        <SectionHead
          eyebrow="Mobile services"
          title="What the van can do at your curb"
          lede="Every service below is performed at your location with shop-grade equipment. Prices start where shown and depend on your vehicle and the parts you choose."
          action={
            <Link to="/auto-service" className="btn-outline btn-sm">
              See all services
              <ArrowRight size={16} aria-hidden />
            </Link>
          }
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MOBILE_SERVICES.map((service) => (
            <Link
              key={service.slug}
              to={`/services/${service.slug}`}
              className="card-hover group flex flex-col p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="h3 group-hover:text-drop">{service.name}</h3>
                <Badge tone="drop">Mobile</Badge>
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-smoke">
                {service.blurb}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
                <span className="flex items-center gap-1.5 text-xs text-smoke">
                  <Clock size={14} aria-hidden />
                  {service.duration}
                </span>
                <span className="font-display text-lg uppercase text-ink">
                  From ${service.priceFrom}
                  <span className="ml-1 text-xs tracking-wide text-smoke">
                    {service.priceUnit}
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* ---------- Service area ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="Service area"
          title="Where we roll"
          lede="Our fleet works out of Sunrise and covers Broward County daily. If your city is on this list, the van comes to you."
        />

        <ul className="flex flex-wrap gap-2.5">
          {BUSINESS.serviceArea.map((city) => (
            <li
              key={city}
              className="flex items-center gap-1.5 rounded-sm border border-ink/10 bg-fog px-3.5 py-2 font-display text-sm uppercase tracking-wide text-ink"
            >
              <MapPin size={14} aria-hidden className="text-drop" />
              {city}
            </li>
          ))}
        </ul>

        <div className="card mt-8 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-smoke">
            <span className="font-display text-base uppercase tracking-wide text-ink">
              Just outside Broward?
            </span>{" "}
            Call us before you assume the answer is no. We regularly stretch past
            the county line for fleet accounts, jobsites and full four-tire jobs —
            a dispatcher will tell you straight whether we can get a van to you and
            what it costs.
          </p>
          <a href={BUSINESS.phoneHref} className="btn-dark btn-sm shrink-0">
            <Phone size={16} aria-hidden />
            {BUSINESS.phone}
          </a>
        </div>
      </Section>

      {/* ---------- What's in the van ---------- */}
      <Section className="bg-ink text-bone">
        <div className="mb-8 max-w-2xl md:mb-12">
          <p className="eyebrow mb-2">What's in the van</p>
          <h2 className="h2">A shop on four wheels</h2>
          <p className="lede mt-3 text-bone/70">
            Mobile does not mean stripped down. Every van carries the same
            equipment our technicians use in the Sunrise bays — which is why the
            work holds up the same way.
          </p>
        </div>

        <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {VAN_KIT.map((item) => (
            <li key={item.name} className="border-t border-graphite pt-5">
              <item.icon size={22} aria-hidden className="text-drop" />
              <h3 className="mt-3 font-display text-lg uppercase tracking-wide">
                {item.name}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-bone/60">
                {item.detail}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------- Comparison ---------- */}
      <Section className="bg-fog">
        <SectionHead
          eyebrow="The difference"
          title="Your driveway vs. their waiting room"
          lede="Same tires. Same torque spec. Completely different afternoon."
          align="center"
        />

        <div className="grid gap-5 md:grid-cols-2">
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 bg-drop px-6 py-4 text-bone">
              <Truck size={18} aria-hidden />
              <h3 className="font-display text-lg uppercase tracking-wide">
                Extreme Mobile Tires
              </h3>
            </div>
            <ul className="divide-y divide-ink/10">
              {COMPARISON.map((row) => (
                <li key={row.us} className="flex items-start gap-3 px-6 py-4">
                  <Check size={18} aria-hidden className="mt-0.5 shrink-0 text-drop" />
                  <span className="text-sm text-ink">{row.us}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 bg-ink/5 px-6 py-4 text-smoke">
              <Clock size={18} aria-hidden />
              <h3 className="font-display text-lg uppercase tracking-wide">
                The traditional tire stop
              </h3>
            </div>
            <ul className="divide-y divide-ink/10">
              {COMPARISON.map((row) => (
                <li key={row.them} className="flex items-start gap-3 px-6 py-4">
                  <X size={18} aria-hidden className="mt-0.5 shrink-0 text-smoke/60" />
                  <span className="text-sm text-smoke">{row.them}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="Questions, answered"
          title="Before you book"
          lede="The eight things customers ask us most about mobile service. If yours is not here, call and ask."
        />
        <Accordion items={FAQ} />
      </Section>

      {/* ---------- Closing CTA ---------- */}
      <Section className="bg-steel text-bone">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow mb-2">{BUSINESS.tagline}</p>
            <h2 className="h2">Stop planning your day around a tire shop</h2>
            <p className="lede mt-3 text-bone/70">
              Tell us the vehicle and the address. We will bring the tires, the
              tools and the two-hour window — and leave with your old set.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <Link to="/schedule" className="btn-primary">
              Schedule Now
              <ArrowRight size={18} aria-hidden />
            </Link>
            <a href={BUSINESS.phoneHref} className="btn-ghost-light">
              <Phone size={18} aria-hidden />
              {BUSINESS.phone}
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}
