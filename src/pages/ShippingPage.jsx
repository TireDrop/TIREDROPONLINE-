import React from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Check,
  MapPin,
  PackageCheck,
  PackageSearch,
  PackageX,
  Phone,
  Receipt,
  ShieldCheck,
  Store,
  Truck,
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

const STEPS = [
  {
    icon: Receipt,
    title: "Your order is confirmed",
    body: "You get an order confirmation listing every tire or wheel, the quantity, and the address it is headed to. Nothing else happens until that confirmation is in your inbox.",
  },
  {
    icon: PackageSearch,
    title: "We place it with the distributor",
    body: "Your order is routed to a distributor warehouse that has your size in stock. Because they stock it and we do not, nothing sits waiting on us to reorder.",
  },
  {
    icon: PackageCheck,
    title: "It ships direct to you",
    body: "The warehouse picks, packs and hands off your order. It travels straight from them to your door — or to our Sunrise shop if you chose ship-to-store.",
  },
  {
    icon: Truck,
    title: "You get tracking",
    body: "As soon as the shipment has a tracking number, it comes to you. From that point you can follow it yourself without calling anyone.",
  },
];

const CHOICES = [
  {
    icon: Truck,
    badge: "Anywhere in the lower 48",
    title: "Ship to my address",
    body: "Home, work, or the shop you already trust with your car. Tires arrive where you told us to send them, and you arrange fitting on your own schedule.",
    points: [
      "Available across " + BUSINESS.shipping.area,
      "Ships direct from the distributor warehouse",
      "Tracking sent as soon as it exists",
    ],
    cta: { label: "Shop tires", to: "/tires" },
  },
  {
    icon: Store,
    badge: "South Florida",
    title: "Ship to the store — free",
    body:
      "Send the order to " +
      BUSINESS.parent +
      " in " +
      BUSINESS.shop.city +
      ", then book a fitting. No shipping charge, no four tires in your garage, no second trip.",
    points: [
      "Free ship-to-store on every order",
      "Installed by the people who do it daily",
      "Old tires taken away and recycled",
    ],
    cta: { label: "How ship-to-store works", to: "/install" },
  },
];

const FAQ = [
  {
    q: "How much does shipping cost?",
    a: "It depends on what you ordered and where it is going, so we do not quote a flat number here. Your exact shipping cost is calculated and shown at checkout, before you pay — not added afterwards. Choosing free ship-to-store at our Sunrise shop removes the shipping charge entirely.",
  },
  {
    q: "How long will my tires take to arrive?",
    a: "Checkout shows the delivery estimate for your specific order once your address is entered, because transit depends on which distributor warehouse has your size and how far it has to travel. We would rather show you a real estimate at checkout than print a promise on a page that cannot know your ZIP code.",
  },
  {
    q: "Where do my tires actually ship from?",
    a: "From a distributor warehouse, not from us. TireDrop holds no stock of its own — we order through national distributors and your tires leave from whichever of their warehouses has your size. That is why the catalog is as deep as it is, and why we are not limited to what fits in one building.",
  },
  {
    q: "Do you ship outside the continental US?",
    a:
      "Our standard shipping covers " +
      BUSINESS.shipping.area +
      " — the lower 48 states. If you are outside that, call " +
      BUSINESS.phone +
      " before ordering and we will tell you honestly whether we can get your order there.",
  },
  {
    q: "Will I get a tracking number?",
    a: "Yes. Tracking is sent to you as soon as the shipment has been handed off and a number exists. If your order ships in more than one shipment — which happens when a set comes from more than one warehouse — you will get tracking for each one.",
  },
  {
    q: "What if my order arrives damaged or it is the wrong tire?",
    a:
      "Do not mount it. A mounted tire cannot be returned, so check the sidewall size, load and speed rating against your order before anything goes on a wheel. Photograph the damage or the label, call " +
      BUSINESS.phone +
      ", and we will get a replacement or a return moving. Damage in transit and picking mistakes are on us and the distributor to fix, not on you.",
  },
  {
    q: "What happens if the tire I ordered turns out to be unavailable?",
    a: "Stock moves fast and a size can sell out between your order and the warehouse pick. If that happens, someone calls you — we do not quietly substitute a different tire or leave the order sitting. You will be offered a comparable alternative or a revised date for the original tire, and if neither works you can cancel for a full refund.",
  },
  {
    q: "Can I ship to a different address than my billing address?",
    a: "Yes. Plenty of customers ship to work, to a relative, or to the shop that is doing their fitting. Enter the delivery address at checkout and make sure someone will be there to take it in — a set of four is heavy and takes up real space.",
  },
];

export default function ShippingPage() {
  return (
    <>
      <Seo
        title="How Shipping Works"
        description={`${BUSINESS.name} ships tires and wheels direct from the distributor to anywhere in ${BUSINESS.shipping.area}. See how ordering, tracking, damaged shipments and out-of-stock sizes are handled.`}
      />

      <Breadcrumbs trail={[{ label: "How shipping works" }]} />

      <PageHero
        eyebrow="Shipping"
        title="Ordered online. Shipped to your door."
        lede={`${BUSINESS.name} is an online tire and wheel store, so your order ships direct from the distributor warehouse to anywhere in ${BUSINESS.shipping.area}. No storefront markup, no waiting on one shop's back room to restock.`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to="/tires" className="btn-primary">
            Shop tires
            <ArrowRight size={18} aria-hidden />
          </Link>
          <Link to="/install" className="btn-ghost-light">
            <Store size={18} aria-hidden />
            Ship to store instead
          </Link>
        </div>
        <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-bone/60">
          <span className="flex items-center gap-1.5">
            <Check size={14} aria-hidden className="text-amber" />
            Ships across {BUSINESS.shipping.area}
          </span>
          <span className="flex items-center gap-1.5">
            <Check size={14} aria-hidden className="text-amber" />
            Free ship-to-store in South Florida
          </span>
          <span className="flex items-center gap-1.5">
            <Check size={14} aria-hidden className="text-amber" />
            {BUSINESS.poweredBy}
          </span>
        </p>
      </PageHero>

      {/* ---------- Drop-ship model ---------- */}
      <Section className="bg-bone">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
          <div className="max-w-2xl">
            <p className="eyebrow mb-2">The short version</p>
            <h2 className="h2">Your tires never sit in our building</h2>
            <p className="lede mt-4">
              {BUSINESS.name} does not hold stock. When you order, the order
              goes to a national distributor — the same warehouses that supply
              tire shops — and your tires leave from there. That is what lets a
              small South Florida operation put a national catalog in front of
              you and still get your size moving the same way a chain store
              would.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-smoke">
              It also means we are honest about what we control. We control the
              order, the follow-up and the fix when something goes wrong. We do
              not control how fast a freight network moves on a given week,
              which is why you will not find a transit-time promise anywhere on
              this page — you will find a real estimate at checkout instead.
            </p>
          </div>

          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <li className="card p-6">
              <Boxes size={22} aria-hidden className="text-drop" />
              <h3 className="h3 mt-4">A deeper catalog</h3>
              <p className="mt-2 text-sm leading-relaxed text-smoke">
                Distributor inventory runs far wider than any single shop's
                rack, so odd sizes and staggered fitments are usually gettable.
              </p>
            </li>
            <li className="card p-6">
              <ShieldCheck size={22} aria-hidden className="text-drop" />
              <h3 className="h3 mt-4">Factory-fresh stock</h3>
              <p className="mt-2 text-sm leading-relaxed text-smoke">
                Tires move through distribution rather than sitting on a
                showroom floor waiting for someone to want that size.
              </p>
            </li>
            <li className="card p-6 sm:col-span-2 lg:col-span-1">
              <Phone size={22} aria-hidden className="text-drop" />
              <h3 className="h3 mt-4">A real phone number</h3>
              <p className="mt-2 text-sm leading-relaxed text-smoke">
                Online store, local people. Call{" "}
                <a
                  href={BUSINESS.phoneHref}
                  className="font-display font-bold text-drop hover:text-dive"
                >
                  {BUSINESS.phone}
                </a>{" "}
                and someone who knows tires picks up.
              </p>
            </li>
          </ul>
        </div>
      </Section>

      {/* ---------- Two delivery choices ---------- */}
      <Section className="bg-fog">
        <SectionHead
          align="center"
          eyebrow="At checkout"
          title="Two ways to take delivery"
          lede="You pick one at checkout. Everything else about the order stays the same."
        />

        <div className="grid gap-5 md:grid-cols-2">
          {CHOICES.map((choice) => (
            <div key={choice.title} className="card flex flex-col p-6 md:p-8">
              <div className="flex items-start justify-between gap-3">
                <choice.icon size={26} aria-hidden className="text-drop" />
                <Badge tone="soft">{choice.badge}</Badge>
              </div>
              <h3 className="h3 mt-5">{choice.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-smoke">
                {choice.body}
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {choice.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <Check
                      size={17}
                      aria-hidden
                      className="mt-0.5 shrink-0 text-drop"
                    />
                    <span className="text-sm leading-relaxed text-ink">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to={choice.cta.to}
                className="btn-outline btn-sm mt-7 self-start"
              >
                {choice.cta.label}
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------- Order flow ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="After you order"
          title="What happens next"
          lede="Four stages, and you hear from us at each one. No silent stretches where you are left wondering whether the order went through."
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
              <p className="mt-2 text-sm leading-relaxed text-smoke">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------- Coverage ---------- */}
      <Section className="bg-ink-wash text-bone">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="eyebrow-dark mb-2">Coverage</p>
            <h2 className="h2">Shipping is national. Installing is not.</h2>
            <p className="lede mt-4 text-bone/70">
              We ship tires and wheels to {BUSINESS.shipping.area} — the lower
              48 states. Wherever you are in that, ordering works the same way
              and your order leaves from whichever warehouse can serve you.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-bone/60">
              Fitting them is the part that is local. {BUSINESS.parent} installs
              at the {BUSINESS.shop.city} shop and runs mobile vans across South
              Florida. Everywhere else, your tires arrive and you take them to
              whoever you trust with your car.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/install" className="btn-primary">
                Local? Ship to the store
                <ArrowRight size={18} aria-hidden />
              </Link>
              <a href={BUSINESS.phoneHref} className="btn-ghost-light">
                <Phone size={18} aria-hidden />
                {BUSINESS.phone}
              </a>
            </div>
          </div>

          <div className="rounded-card border border-graphite bg-steel-wash p-6 md:p-8">
            <h3 className="h3">Shipping cost and dates, straight</h3>
            <p className="mt-3 text-sm leading-relaxed text-bone/70">
              We do not publish a shipping price or a delivery window on this
              page, and that is deliberate. Both depend on your address, your
              tire size and which warehouse fills the order — anything we
              printed here would be a guess.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Your shipping cost is calculated at checkout, before payment",
                "Your delivery estimate appears alongside it, for your address",
                "Free ship-to-store removes the shipping charge entirely",
                "No handling fee gets added after you have paid",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 border-t border-graphite pt-3"
                >
                  <Check
                    size={17}
                    aria-hidden
                    className="mt-0.5 shrink-0 text-volt"
                  />
                  <span className="text-sm leading-relaxed text-bone/80">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ---------- When something goes wrong ---------- */}
      <Section className="bg-fog">
        <SectionHead
          eyebrow="If something goes wrong"
          title="Damaged, wrong, or out of stock"
          lede="Shipping freight across the country is not flawless. Here is exactly what we do on the three problems that actually come up, so you know before it happens rather than after."
        />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="card p-6 md:p-8">
            <AlertTriangle size={24} aria-hidden className="text-amberInk" />
            <h3 className="h3 mt-4">It arrived damaged</h3>
            <p className="mt-3 text-sm leading-relaxed text-smoke">
              Look the shipment over before it goes anywhere near a wheel. A
              scuffed label is nothing; a gouged sidewall, an exposed cord or a
              bent wheel lip is not.
            </p>
            <ol className="mt-5 space-y-2.5 text-sm leading-relaxed text-ink">
              <li className="flex gap-3">
                <span className="font-display text-drop">01</span>
                Photograph the damage and the shipping label together.
              </li>
              <li className="flex gap-3">
                <span className="font-display text-drop">02</span>
                Do not mount it — a mounted tire cannot go back.
              </li>
              <li className="flex gap-3">
                <span className="font-display text-drop">03</span>
                Call {BUSINESS.phone} and we open the claim for you.
              </li>
            </ol>
          </div>

          <div className="card p-6 md:p-8">
            <PackageSearch size={24} aria-hidden className="text-drop" />
            <h3 className="h3 mt-4">It is the wrong item</h3>
            <p className="mt-3 text-sm leading-relaxed text-smoke">
              Check the sidewall against your order the day it lands: size, load
              index and speed rating. Warehouses pick thousands of tires a day
              and occasionally a neighboring size goes in the stack.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ink">
              If what arrived does not match what you bought, that is our
              problem to solve. Call us with the order number and the sidewall
              markings and we will arrange the return and get the right tire
              moving — you are not paying return freight for our mistake.
            </p>
          </div>

          <div className="card p-6 md:p-8">
            <PackageX size={24} aria-hidden className="text-drop" />
            <h3 className="h3 mt-4">It turns out to be unavailable</h3>
            <p className="mt-3 text-sm leading-relaxed text-smoke">
              Distributor stock moves in real time and a popular size can go out
              between your order and the warehouse pick.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ink">
              When that happens, a person calls you. You will be offered a
              comparable alternative or a revised date for the tire you picked,
              and if neither suits you the order is cancelled and refunded in
              full. What we will never do is swap in a different tire and let
              you find out when the box opens.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="Questions, answered"
          title="Shipping FAQ"
          lede="The eight things customers ask before they order. If yours is not here, call and ask — we would rather answer it now than after it ships."
        />
        <Accordion items={FAQ} />
      </Section>

      {/* ---------- Closing CTA ---------- */}
      <Section className="bg-steel-wash text-bone">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow-dark mb-2">{BUSINESS.tagline}</p>
            <h2 className="h2">Find your size, pick your delivery</h2>
            <p className="lede mt-3 text-bone/70">
              Shop by vehicle or by tire size, and choose at checkout whether it
              comes to you or to the shop. Local to Broward? Ship-to-store is
              free and we will fit them.
            </p>
            <p className="mt-4 flex items-center gap-2 text-xs text-bone/60">
              <MapPin size={14} aria-hidden />
              {BUSINESS.shop.full} · {BUSINESS.poweredBy}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <Link to="/tires" className="btn-primary">
              Shop tires
              <ArrowRight size={18} aria-hidden />
            </Link>
            <Link to="/install" className="btn-ghost-light">
              <Store size={18} aria-hidden />
              Ship to store
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
