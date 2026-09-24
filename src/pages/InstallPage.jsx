import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Clock,
  Home,
  MapPin,
  PackageCheck,
  Phone,
  ShoppingCart,
  Store,
  Truck,
  Wrench,
  X,
} from "lucide-react";

import {
  Accordion,
  Badge,
  Breadcrumbs,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../components/ui/index.jsx";
import { BUSINESS } from "../data/business.js";
import { getService } from "../data/services.js";

const install = getService("tire-installation");

const STEPS = [
  {
    icon: ShoppingCart,
    title: "Pick ship to store at checkout",
    body: "Same order, same tires — you just choose the shop as the delivery address instead of your own. It is free, so nothing is added to your total for shipping.",
  },
  {
    icon: PackageCheck,
    title: "Your tires land at the shop",
    body: `The order ships direct from a distributor warehouse to ${BUSINESS.parent} at ${BUSINESS.shop.street}. They come off the truck and go on the rack with your name on them.`,
  },
  {
    icon: CalendarCheck,
    title: "You book a fitting",
    body: "Pick a day and an arrival window online, or call and a dispatcher writes it up. Book ahead of the delivery if you like — the shop will hold the set until you come in.",
  },
  {
    icon: Wrench,
    title: "They go on properly",
    body: "Mounted, balanced, torqued to your manufacturer's spec, TPMS handled and your old set taken away for recycling. You drive out on them.",
  },
];

const WHY = [
  {
    icon: Home,
    title: "Nowhere to put four tires",
    body: "A set of four takes up most of a garage bay and they are heavy, awkward and filthy to move. Sending them to the shop means they never come off the truck at your house at all.",
  },
  {
    icon: Truck,
    title: "No second trip",
    body: "Shipping home means loading the set back into your car and driving them somewhere anyway. Ship to store and delivery and installation are the same stop.",
  },
  {
    icon: Wrench,
    title: "Fitted by people who do it daily",
    body: `${BUSINESS.parent} mounts tires in ${BUSINESS.shop.city} every working day. Balancing, TPMS relearns and torque specs are routine here, not an occasional job.`,
  },
  {
    icon: Check,
    title: "The old set is our problem",
    body: "Your worn tires stay at the shop and get recycled. You are not stacking them by the bins or driving them to a disposal site.",
  },
];

const COMPARISON = [
  {
    store: "Tires go straight to the shop from the truck",
    home: "Four heavy tires land on your driveway",
  },
  {
    store: "Delivery and fitting happen at one address",
    home: "You load them up and drive them somewhere",
  },
  {
    store: "Nothing to store while you find an appointment",
    home: "They live in your garage until you book",
  },
  {
    store: "Free — ship-to-store costs nothing",
    home: "Also free to any continental-US address",
  },
  {
    store: "Old set taken away and recycled",
    home: "Disposal is yours to sort out",
  },
];

const FAQ = [
  {
    q: "Does ship to store really cost nothing?",
    a:
      "Yes. Shipping to the " +
      BUSINESS.shop.city +
      " shop is free, the same as shipping to any address in the continental US. You still pay for the tires and, separately, for the installation when you come in.",
  },
  {
    q: "What does the installation itself cost?",
    a: install
      ? `Tire installation starts at $${install.priceFrom} ${install.priceUnit} and takes about ${install.duration} for a set. What you actually pay depends on wheel size, run-flats, TPMS work and anything seized, and the shop confirms the total with you before a tool comes out.`
      : "The shop confirms the exact installation total with you before any work starts.",
  },
  {
    q: "How will I know my tires have arrived?",
    a: "The shop calls you when your order is checked in and on the rack. If you have already booked a fitting, they confirm that the set is there ahead of your appointment.",
  },
  {
    q: "Can I book the fitting before the tires get there?",
    a: "Yes, and most people do. Book the appointment when you order and the shop will match it up with the delivery. If the shipment runs late, someone calls you to move the booking rather than leaving you to turn up for nothing.",
  },
  {
    q: "How long will the shop hold my tires?",
    a:
      "Long enough for you to get in without rushing. If your schedule has gone sideways, call " +
      BUSINESS.phone +
      " and say so — the rack space is not the problem, being left guessing is.",
  },
  {
    q: "Is ship to store available outside South Florida?",
    a:
      "No. Ship-to-store means one shop: " +
      BUSINESS.shop.full +
      ". If you are anywhere else in the continental US your order ships to your address, and you take it to a fitter you trust.",
  },
  {
    q: "Can the van install them at my house instead?",
    a:
      "If you are in the local install area, yes. The mobile van covers " +
      BUSINESS.installArea.slice(0, 4).join(", ") +
      " and the rest of the Broward cities listed on this page. Mobile fitting is a local bonus, not a national service.",
  },
  {
    q: "Can you install tires I did not buy from TireDrop?",
    a: "Yes — the shop fits customer-supplied tires and wheels the same way. Book a tire installation appointment and bring them in, or have them shipped to the shop and mention it when you book so they know what to expect.",
  },
];

export default function InstallPage() {
  return (
    <>
      <Seo
        title="Ship to Store & Install"
        description={`Choose free ship-to-store at checkout and have your ${BUSINESS.name} order delivered to ${BUSINESS.parent} in ${BUSINESS.shop.city}, FL, then installed. South Florida only — see the local install area, shop hours and directions.`}
      />

      <Breadcrumbs
        trail={[
          { label: "How shipping works", to: "/shipping" },
          { label: "Ship to store & install" },
        ]}
      />

      <PageHero
        eyebrow="South Florida only"
        title="Ship them to the shop. We'll fit them."
        lede={`Buy your tires here, send them to ${BUSINESS.parent} in ${BUSINESS.shop.city} for free, and book a fitting. Delivery and installation become one stop — and four tires never touch your garage floor.`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to="/schedule" className="btn-primary">
            Book an install
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
            Free ship-to-store
          </span>
          <span className="flex items-center gap-1.5">
            <Check size={14} aria-hidden className="text-amber" />
            Old tires recycled
          </span>
          <span className="flex items-center gap-1.5">
            <Check size={14} aria-hidden className="text-amber" />
            {BUSINESS.poweredBy}
          </span>
        </p>
      </PageHero>

      {/* ---------- Local-only notice ---------- */}
      <div className="border-b border-ink/10 bg-sky">
        <div className="wrap flex flex-wrap items-center gap-3 py-4 text-sm">
          <MapPin size={18} aria-hidden className="text-drop" />
          <p className="text-smoke">
            <span className="font-display font-bold text-ink">
              This one is local.
            </span>{" "}
            Ship-to-store and installation happen at the {BUSINESS.shop.city}{" "}
            shop in South Florida. Everywhere else in the continental US,{" "}
            <Link
              to="/shipping"
              className="text-drop underline hover:text-dive"
            >
              your order ships to your address
            </Link>
            .
          </p>
        </div>
      </div>

      {/* ---------- How it works ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="How it works"
          title="Four steps, one address"
          lede="From the checkout page to driving out on new tires. Nothing here needs you to be home for a delivery."
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
                  className="font-display text-4xl leading-none text-ink/10"
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

        {install && (
          <div className="card mt-8 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-smoke">
              <span className="font-display text-base font-bold text-ink">
                Installation from ${install.priceFrom} {install.priceUnit}.
              </span>{" "}
              That covers dismounting and disposing of the old set, mounting and
              balancing the new one, valve stems, torque to spec and a TPMS
              reset where your vehicle has it. The shop confirms your exact
              total before any work starts.
            </p>
            <Link
              to="/services/tire-installation"
              className="btn-outline btn-sm shrink-0"
            >
              What's included
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        )}
      </Section>

      {/* ---------- Why ship to store ---------- */}
      <Section className="bg-fog">
        <SectionHead
          eyebrow="Why bother"
          title="Better than a stack of tires in your garage"
          lede="Shipping to your door works fine. Shipping to the shop just removes every part of the job you were going to have to deal with yourself."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((item) => (
            <div key={item.title} className="card p-6">
              <item.icon size={22} aria-hidden className="text-drop" />
              <h3 className="h3 mt-4">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-smoke">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 bg-drop px-6 py-4 text-bone">
              <Store size={18} aria-hidden />
              <h3 className="text-lg">Ship to the store</h3>
            </div>
            <ul className="divide-y divide-ink/10">
              {COMPARISON.map((row) => (
                <li
                  key={row.store}
                  className="flex items-start gap-3 px-6 py-4"
                >
                  <Check
                    size={18}
                    aria-hidden
                    className="mt-0.5 shrink-0 text-drop"
                  />
                  <span className="text-sm text-ink">{row.store}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 bg-ink/5 px-6 py-4 text-smoke">
              <Home size={18} aria-hidden />
              <h3 className="text-lg">Ship to your house</h3>
            </div>
            <ul className="divide-y divide-ink/10">
              {COMPARISON.map((row) => (
                <li key={row.home} className="flex items-start gap-3 px-6 py-4">
                  <X
                    size={18}
                    aria-hidden
                    className="mt-0.5 shrink-0 text-smoke/60"
                  />
                  <span className="text-sm text-smoke">{row.home}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ---------- Install area ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="Install area"
          title="Where installing is on the table"
          lede={`Ship-to-store means the ${BUSINESS.shop.city} shop, and the mobile vans work the Broward cities below. Shipping reaches the whole continental US — installing does not, and we would rather say so plainly.`}
        />

        <ul className="flex flex-wrap gap-2.5">
          {BUSINESS.installArea.map((city) => (
            <li
              key={city}
              className="flex items-center gap-1.5 rounded-sm border border-ink/10 bg-fog px-3.5 py-2 font-display text-sm font-semibold text-ink"
            >
              <MapPin size={14} aria-hidden className="text-drop" />
              {city}
            </li>
          ))}
        </ul>

        <div className="card mt-8 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-smoke">
            <span className="font-display text-base font-bold text-ink">
              Rather not come in at all?
            </span>{" "}
            Local customers can have the van do it instead — your tires get
            collected at the shop and fitted where your car is already parked,
            at home, at work or on a jobsite. Same techs, same torque spec.
          </p>
          <Link to="/mobile-service" className="btn-dark btn-sm shrink-0">
            <Truck size={16} aria-hidden />
            Mobile install
          </Link>
        </div>
      </Section>

      {/* ---------- Shop details ---------- */}
      <Section className="bg-ink-wash text-bone">
        <div className="mb-8 max-w-2xl md:mb-12">
          <p className="eyebrow-dark mb-2">The shop</p>
          <h2 className="h2">{BUSINESS.shop.name}</h2>
          <p className="lede mt-3 text-bone/70">
            {BUSINESS.parent} runs this shop. It is where your ship-to-store
            order lands, where the fitting happens and where the vans roll out
            from.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-card border border-graphite bg-steel-wash p-6">
            <MapPin size={22} aria-hidden className="text-volt" />
            <h3 className="h3 mt-4">Address</h3>
            <address className="mt-2 not-italic text-sm leading-relaxed text-bone/70">
              {BUSINESS.shop.street}
              <br />
              {BUSINESS.shop.city}, {BUSINESS.shop.state} {BUSINESS.shop.zip}
            </address>
            <a
              href={BUSINESS.mapsHref}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 font-display text-sm font-bold text-volt hover:text-bone"
            >
              <MapPin size={15} aria-hidden />
              Get directions
            </a>
          </div>

          <div className="rounded-card border border-graphite bg-steel-wash p-6">
            <Clock size={22} aria-hidden className="text-volt" />
            <h3 className="h3 mt-4">Hours</h3>
            <dl className="mt-3 space-y-2 text-sm">
              {BUSINESS.hours.map((row) => (
                <div
                  key={row.days}
                  className="flex items-baseline justify-between gap-4 border-b border-graphite pb-2 last:border-0"
                >
                  <dt className="font-display font-semibold text-bone">
                    {row.days}
                  </dt>
                  <dd className="text-bone/60">{row.time}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-col rounded-card border border-graphite bg-steel-wash p-6">
            <CalendarCheck size={22} aria-hidden className="text-volt" />
            <h3 className="h3 mt-4">Book your fitting</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-bone/70">
              Pick a service, a day and an arrival window online in about two
              minutes — or call and talk it through with a dispatcher.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                to="/schedule?service=tire-installation"
                className="btn-primary btn-sm"
              >
                Book an install
                <ArrowRight size={16} aria-hidden />
              </Link>
              <a href={BUSINESS.phoneHref} className="btn-ghost-light btn-sm">
                <Phone size={16} aria-hidden />
                {BUSINESS.phone}
              </a>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section className="bg-fog">
        <SectionHead
          align="center"
          eyebrow="Questions, answered"
          title="Before you choose ship to store"
          lede="What local customers ask most. Anything else, call and ask — someone at the shop will know."
        />
        <Accordion items={FAQ} />
      </Section>

      {/* ---------- Closing CTA ---------- */}
      <Section className="bg-steel-wash text-bone">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow-dark mb-2">
              <Badge tone="drop">Free</Badge>{" "}
              <span className="ml-1">Ship to store</span>
            </p>
            <h2 className="h2">Buy them here. Fit them here.</h2>
            <p className="lede mt-3 text-bone/70">
              Find your size, send the order to {BUSINESS.shop.city}, and book
              the day that suits you. The only thing you carry is the key.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <Link to="/tires" className="btn-primary">
              Shop tires
              <ArrowRight size={18} aria-hidden />
            </Link>
            <Link to="/schedule" className="btn-ghost-light">
              <CalendarCheck size={18} aria-hidden />
              Book an install
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
