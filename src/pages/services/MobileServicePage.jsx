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
  PackageCheck,
  Phone,
  Radio,
  Ruler,
  ShieldCheck,
  Store,
  Truck,
  Wrench,
  X,
  Zap,
} from "lucide-react";

import {
  Accordion,
  Badge,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";
import MobilePriceStrip from "../../components/services/MobilePriceStrip.jsx";
import ServiceAreaCounties from "../../components/ui/ServiceAreaCounties.jsx";
import ZipCheck from "../../components/ui/ZipCheck.jsx";
import { faqSchema } from "../../components/content/schema.js";
import { BUSINESS } from "../../data/business.js";
import {
  CITY_PAGES,
  CITY_PAGE_SHARED,
  cityPath,
} from "../../data/cityPages.js";
import RoadsideHelp from "../../components/ui/RoadsideHelp.jsx";
import { SERVICE_AREA_LABEL } from "../../data/serviceArea.js";
import { MOBILE_SERVICES, getService } from "../../data/services.js";

const install = getService("tire-installation");

const STEPS = [
  {
    icon: PackageCheck,
    title: "Your order arrives",
    body: `Order your tires on ${BUSINESS.name} and send them to your address or free to the ${BUSINESS.shop.city} shop. Already have tires sitting in the garage? That works too.`,
  },
  {
    icon: CalendarCheck,
    title: "Book the van",
    body: "Pick the service, the vehicle and the day that suits you. Takes about two minutes online. Prefer a human? Call and we will write it up for you.",
  },
  {
    icon: Phone,
    title: "We confirm an arrival window",
    body: "We confirm an arrival window when we book. A dispatcher calls to set the appointment, so you are not burning a whole day waiting on a van.",
  },
  {
    icon: Zap,
    title: "Fitted where you parked",
    body: "Mounted, balanced, torqued to spec and pressures set — in your own driveway. Your old set leaves with us. You never went anywhere.",
  },
];

const VAN_KIT = [
  {
    icon: Gauge,
    name: "Calibrated spin balancer",
    detail:
      "Dynamic balancing on board — the same machine standard the Sunrise bays run, not a bubble balancer.",
  },
  {
    icon: Wrench,
    name: "Tire changer & bead breaker",
    detail:
      'Mounts everything from a compact 15" to a 22" truck wheel without scratching the finish.',
  },
  {
    icon: ShieldCheck,
    name: "Calibrated torque wrenches",
    detail:
      "Every lug goes back to your manufacturer's spec in a star pattern. No rattle guns left to guess.",
  },
  {
    icon: Radio,
    name: "TPMS programmer",
    detail:
      "Scans, relearns and programs sensors so the dashboard light goes out before we leave.",
  },
  {
    icon: Ruler,
    name: "Tread depth gauges & inflation",
    detail:
      "Depth measured at every corner and pressures set to the door-placard number.",
  },
  {
    icon: Truck,
    name: "Tire cart, floor jack & stands",
    detail:
      "A rated jack, stands and a cart for lifting and moving heavy wheel and tire assemblies on your driveway.",
  },
  {
    icon: Zap,
    name: "Onboard power & lighting",
    detail:
      "Generator and work lights mean we do not need your outlet, your garage or daylight.",
  },
  {
    icon: Ban,
    name: "Old tire haul-off",
    detail:
      "Your old set leaves with us and gets recycled. Nothing gets left at the curb.",
  },
];

const COMPARISON = [
  {
    us: "Work happens where your car is parked",
    them: "Drive over and hope the bay is open",
  },
  {
    us: "We confirm an arrival window when we book",
    them: '"Should be a couple hours" with no promise',
  },
  {
    us: "You keep working, cooking or sleeping",
    them: "You sit in a lobby with bad coffee",
  },
  {
    us: "No second vehicle or ride needed",
    them: "Someone has to drop you off and pick you up",
  },
  {
    us: "Flat tire? We come to the flat",
    them: "You put the donut on first, then drive on it",
  },
  {
    us: "Old tires hauled away and recycled",
    them: "Disposal fee tacked on at the register",
  },
];

/** Justin's wording (2026-10-01). Shared with the city pages. */
const ROADSIDE_HIGHWAY = CITY_PAGE_SHARED.highwayLine;

const FAQ = [
  {
    q: "Is mobile install available everywhere you ship?",
    a:
      "No, and we will not pretend otherwise. " +
      BUSINESS.name +
      " ships tires to " +
      BUSINESS.shipping.area +
      ", but the vans are a South Florida service run out of the " +
      BUSINESS.shop.city +
      " shop, covering " +
      SERVICE_AREA_LABEL +
      ". If you are outside those three counties, your order ships to you and you take it to a fitter you trust.",
  },
  {
    q: "I bought my tires here. Can the van bring them to me?",
    a:
      "That is exactly what it is for. Send the order free to the " +
      BUSINESS.shop.city +
      " shop at checkout, then book a mobile install — the van loads your set and brings it to your address. If you had them shipped to your house instead, leave them where they are and we will fit them there.",
  },
  {
    q: "Does the van cost more than coming into the shop?",
    a: install
      ? `No. Mobile labor is billed at the same rate as the bay — tire installation starts at $${install.priceFrom} ${install.priceUnit} either way. Within the local install area there is no trip fee on standard appointments.`
      : "No. Mobile labor is billed at the same rate as the bay, and within the local install area there is no trip fee on standard appointments.",
  },
  {
    q: "How much room does the van need?",
    a: "One standard parking space next to your vehicle and about ten feet of clearance on the work side. A driveway, a flat stretch of street, an office lot or a jobsite staging area all work. We do not need your garage and we do not need a lift.",
  },
  {
    q: "What happens if it rains?",
    a: "South Florida rain is part of the job. Short afternoon showers rarely stop us — the van carries lighting and cover for the work area. If there is lightning or sustained heavy rain, we call you, pause the job and reschedule at the front of the next available window. You are never charged for weather.",
  },
  {
    q: "Can you come to an apartment or condo complex?",
    a: "Yes, and we do it every week. Some complexes want the van checked in at the gate or ask that work happen in a visitor space rather than a covered garage. Tell us the complex name and any gate code or call-up instructions when you book and we will handle it with management on arrival.",
  },
  {
    q: "Can you help if I get a flat away from home?",
    a:
      "Yes: on a side street, in a parking lot, at your home or at work, anywhere in the three counties, during shop hours. The technician changes or swaps the tire, puts your spare on, or repairs the flat if it can be repaired; a technician inspects the inside first. We confirm an arrival window when we book. " +
      ROADSIDE_HIGHWAY,
  },
  {
    q: "How long does a mobile appointment take?",
    a: "A four-tire installation runs about 45 to 75 minutes. A single flat repair is roughly 30 minutes, a rotation about 30, and a full-synthetic oil change 30 to 45. Your confirmation lists the estimate for the exact service you booked.",
  },
  {
    q: "What if my vehicle needs work the van cannot do?",
    a:
      "Brakes, alignment, suspension, lift kits and diagnostics are bay work — they need a lift and an alignment rack, so they happen at the " +
      BUSINESS.shop.city +
      " shop. If the tech spots something like that in your driveway, you will hear it straight, with an estimate, and we will get you on the schedule there.",
  },
];

export default function MobileServicePage() {
  return (
    <>
      <Seo
        title="Mobile Tire Installation in South Florida"
        description={`Bought tires on ${BUSINESS.name}? ${BUSINESS.parent} brings a fully equipped van to your home, office or jobsite across ${SERVICE_AREA_LABEL} to fit them — plus balancing, repair, rotation, oil changes and TPMS.`}
        schema={[faqSchema(FAQ, "/mobile-service")]}
      />

      <PageHero
        lead={<MobilePriceStrip />}
        eyebrow="Mobile install — Miami-Dade, Broward, Palm Beach"
        title="Mobile Tire Installation in South Florida"
        lede={`You bought the tires. We'll come fit them. A fully equipped ${BUSINESS.parent} van brings your new set to your home, office or jobsite anywhere in ${SERVICE_AREA_LABEL}, and fits it where the car is already parked.`}
      >
        <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-bone/60">
          <span className="flex items-center gap-1.5">
            <Check size={14} aria-hidden className="text-amber" />
            {BUSINESS.poweredBy}
          </span>
          <span className="flex items-center gap-1.5">
            <Check size={14} aria-hidden className="text-amber" />
            We confirm an arrival window when we book
          </span>
          <span className="flex items-center gap-1.5">
            <Check size={14} aria-hidden className="text-amber" />
            Old tires hauled away
          </span>
        </p>
      </PageHero>

      {/* ---------- Local-only notice ---------- */}
      <div className="border-b border-ink/10 bg-sky">
        <div className="wrap flex flex-wrap items-center gap-3 py-4 text-sm">
          <MapPin size={18} aria-hidden className="text-drop" />
          <p className="text-smoke">
            <span className="font-display font-bold text-ink">
              Miami-Dade, Broward and Palm Beach only.
            </span>{" "}
            We ship tires to {BUSINESS.shipping.area}, but the vans work South
            Florida. Outside the area?{" "}
            <Link
              to="/shipping"
              className="text-drop underline hover:text-dive"
            >
              See how shipping works
            </Link>
            .
          </p>
        </div>
      </div>

      {/* ---------- How it works ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="How it works"
          title="Order online. Fitted in your driveway."
          lede="No drop-off, no shuttle, no waiting room. Here is exactly how it runs from the checkout page to the last lug nut."
        />

        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="card-hover flex flex-col p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-sm bg-ink text-bone">
                  <step.icon size={20} aria-hidden />
                </span>
                <span
                  aria-hidden
                  className="font-display text-4xl leading-none text-ink/50"
                >
                  0{i + 1}
                </span>
              </div>
              <h3 className="h3 mt-5">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-smoke">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="card mt-8 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-smoke">
            <span className="font-display text-[15px] font-bold text-ink">
              Rather come to us?
            </span>{" "}
            Free ship-to-store puts your order on the rack at the{" "}
            {BUSINESS.shop.city} shop and you book a fitting whenever suits.
            Same techs, same torque spec, full bay equipment.
          </p>
          <Link to="/install" className="btn-dark btn-sm shrink-0">
            <Store size={16} aria-hidden />
            Ship to store
          </Link>
        </div>
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
                <span className="font-display text-lg text-ink">
                  From ${service.priceFrom}
                  <span className="ml-1 text-xs text-smoke">
                    {service.priceUnit}
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* ---------- Roadside flat help ---------- */}
      <Section className="bg-bone">
        <RoadsideHelp
          title="Roadside flat tire help, off the highway"
          lede={`A flat on a side street, in a parking lot, in your driveway or at work? Call during shop hours and the van comes to the car anywhere in ${SERVICE_AREA_LABEL}. The tire gets changed, repaired if it can be, or swapped for your spare.`}
        />
      </Section>

      {/* ---------- Install area ---------- */}
      <Section className="bg-fog">
        <SectionHead
          eyebrow="Install area"
          title="Where the van rolls"
          lede={`The fleet works out of ${BUSINESS.shop.city} and covers ${SERVICE_AREA_LABEL}. If your ZIP code is in one of them, we come to you.`}
        />

        <ServiceAreaCounties />

        {/* ---------- City pages ---------- */}
        <div className="mt-12">
          <h3 className="h3">Cities we serve</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-smoke">
            Each city page has its ZIP codes, the roads we use, local notes and
            the questions people there ask us.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CITY_PAGES.map((city) => (
              <li key={city.slug}>
                <Link
                  to={cityPath(city.slug)}
                  className="card-hover group flex min-h-[64px] items-center justify-between gap-3 px-5 py-4"
                >
                  <span>
                    <span className="block font-display text-[1.0625rem] font-bold text-ink group-hover:text-drop">
                      {city.name}
                    </span>
                    <span className="block text-xs text-smoke">
                      Mobile tire installation · {city.county}
                    </span>
                  </span>
                  <ArrowRight size={16} aria-hidden className="shrink-0 text-drop" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start">
          <div>
            <h3 className="h3">Not listed? Check your ZIP</h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-smoke">
              No city page doesn&rsquo;t mean no van. Coverage is decided by
              ZIP code: if the place your car is parked has a ZIP in{" "}
              {SERVICE_AREA_LABEL}, we come to you. The Florida Keys are not
              covered.
            </p>
          </div>
          <ZipCheck />
        </div>

        <div className="card mt-8 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-smoke">
            <span className="font-display text-[15px] font-bold text-ink">
              Near a county line?
            </span>{" "}
            Call before you assume the answer is no. Inside Miami-Dade, Broward
            and Palm Beach, we regularly stretch past the county line for fleet
            accounts, jobsites and full four-tire jobs — a dispatcher will set it
            up with you. Outside those three
            counties, your tires still ship free to your door.
          </p>
          <a href={BUSINESS.phoneHref} className="btn-dark btn-sm shrink-0">
            <Phone size={16} aria-hidden />
            {BUSINESS.phone}
          </a>
        </div>
      </Section>

      {/* ---------- What's in the van ---------- */}
      <Section className="bg-ink-wash text-bone">
        <div className="mb-8 max-w-2xl md:mb-12">
          <p className="eyebrow-dark mb-2">What's in the van</p>
          <h2 className="h2">A shop on four wheels</h2>
          <p className="lede mt-3 text-bone/70">
            Mobile does not mean stripped down. Every van carries the same
            equipment the {BUSINESS.shop.city} bays use — which is why the work
            holds up the same way.
          </p>
        </div>

        <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {VAN_KIT.map((item) => (
            <li key={item.name} className="border-t border-graphite pt-5">
              <item.icon size={22} aria-hidden className="text-volt" />
              <h3 className="mt-3 font-display text-[1.0625rem]">
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
              <h3 className="font-display text-lg">Mobile install</h3>
            </div>
            <ul className="divide-y divide-ink/10">
              {COMPARISON.map((row) => (
                <li key={row.us} className="flex items-start gap-3 px-6 py-4">
                  <Check
                    size={18}
                    aria-hidden
                    className="mt-0.5 shrink-0 text-drop"
                  />
                  <span className="text-sm text-ink">{row.us}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 bg-ink/5 px-6 py-4 text-smoke">
              <Clock size={18} aria-hidden />
              <h3 className="font-display text-lg">
                The traditional tire stop
              </h3>
            </div>
            <ul className="divide-y divide-ink/10">
              {COMPARISON.map((row) => (
                <li key={row.them} className="flex items-start gap-3 px-6 py-4">
                  <X
                    size={18}
                    aria-hidden
                    className="mt-0.5 shrink-0 text-smoke/60"
                  />
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
          lede="The things local customers ask us most about mobile install and flat tire help. If yours is not here, call and ask."
        />
        <Accordion items={FAQ} />
      </Section>

      {/* ---------- Closing CTA ---------- */}
      <Section className="bg-steel-wash text-bone">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow-dark mb-2">{BUSINESS.tagline}</p>
            <h2 className="h2">Stop planning your day around a tire shop</h2>
            <p className="lede mt-3 text-bone/70">
              Tell us the vehicle and the address. We will bring the tires and the
              tools, and leave with your old set. We confirm an arrival window
              when we book.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <Link to="/schedule?service=tire-installation" className="btn-primary">
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
