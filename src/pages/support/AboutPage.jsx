import React from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Store,
  Tag,
  Truck,
} from "lucide-react";
import { BUSINESS } from "../../data/business.js";
// The catalog is the source of truth for which brands this page may name, so
// it can never list a brand nobody can buy.
import { TIRE_BRAND_NAMES } from "../../data/products.js";
import {
  Badge,
  Breadcrumbs,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";

const DIFFERENTIATORS = [
  {
    icon: Package,
    title: "Shipped straight to you",
    copy: `Order online and your tires ship free to your address anywhere in ${BUSINESS.shipping.area}. They ship direct from a distributor warehouse, so you are not paying for a middle shelf they sat on.`,
  },
  {
    icon: Store,
    title: "Or ship free to the shop",
    copy: `If you are near ${BUSINESS.shop.city}, send the order to the shop instead at no shipping cost and book the install when it lands. Same tires, fitted by the people who sold them to you.`,
  },
  {
    icon: Truck,
    title: "Mobile install, South Florida",
    copy: "In Broward County the van can come to the driveway, the office lot or the jobsite instead. It is a local bonus, not the whole business — but it is a good one.",
  },
  {
    icon: ShieldCheck,
    title: "A real shop picked the catalog",
    copy: "The catalog was chosen by people who mount tires for a living, not assembled from whatever a feed happened to contain.",
  },
  {
    icon: Tag,
    title: "The price is the price",
    copy: "What you see at checkout covers the tires, and shipping is free to any continental-US address. If anything about your order changes, we call you before we do anything about it.",
  },
  {
    icon: Clock,
    title: "Same phone, same people",
    copy: `${BUSINESS.parent} still answers on ${BUSINESS.phone} from the shop on ${BUSINESS.shop.street}. ${BUSINESS.name} is that shop with a wider counter — same phone, same people.`,
  },
];

// Figures that do not go stale: no year counts, and nothing that implies
// stock levels or dealer status.
const STATS = [
  { value: "48", label: "States in the shipping area" },
  { value: "$0", label: "Shipping, with no order minimum" },
  {
    value: `${BUSINESS.installArea.length}`,
    label: "Broward towns the vans cover",
  },
];

// What the business does today. Deliberately not a history: no founding
// story, dates or headcounts that nobody can check.
const FACTS = [
  {
    label: "Online",
    title: `${BUSINESS.name} ships nationwide`,
    copy: `Free shipping to any address in ${BUSINESS.shipping.area}, direct from a distributor warehouse. The delivery estimate is shown at checkout.`,
  },
  {
    label: `In ${BUSINESS.shop.city}`,
    title: "Free ship-to-store and install",
    copy: `Send the order to ${BUSINESS.shop.name} at no shipping cost and the shop fits the tires there — mounted, balanced and the old set disposed of.`,
  },
  {
    label: "Mobile install",
    title: "The van comes to you",
    copy: `In ${BUSINESS.installArea.join(", ")}, the install vans can fit your tires at the driveway, the office lot or the jobsite.`,
  },
  {
    label: "At the shop",
    title: "Bay work on the lift",
    copy: `Alignments, brakes and suspension happen in the bay at ${BUSINESS.shop.street}.`,
  },
];

function FactItem({ label, title, copy }) {
  return (
    <li className="relative border-l-2 border-ink/10 pl-6 pb-8 last:pb-0">
      <span
        aria-hidden
        className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-drop"
      />
      <p className="eyebrow mb-1">{label}</p>
      <h3 className="h3 mb-2">{title}</h3>
      <p className="text-sm leading-relaxed text-smoke">{copy}</p>
    </li>
  );
}

export default function AboutPage() {
  return (
    <>
      <Seo
        title="About TireDrop"
        description={`${BUSINESS.name} is the online store of ${BUSINESS.parent}, a tire shop in ${BUSINESS.shop.city}, FL. Tires and wheels shipped across the continental US, or fitted at the shop.`}
      />

      <PageHero
        eyebrow="About Us"
        title="A real tire shop, with a national counter"
        lede={`${BUSINESS.name} is the online store of ${BUSINESS.parent}, a tire shop in ${BUSINESS.shop.city}, FL. We ship anywhere in ${BUSINESS.shipping.area}. Near ${BUSINESS.shop.city}, we will also put them on for you.`}
      >
        <div className="flex flex-wrap gap-3">
          <Link to="/tires" className="btn-primary">
            Shop Tires
          </Link>
          <a href={BUSINESS.phoneHref} className="btn-ghost-light">
            <Phone size={18} aria-hidden />
            {BUSINESS.phone}
          </a>
        </div>
      </PageHero>

      <Breadcrumbs trail={[{ label: "About Us" }]} />

      {/* ---------- Our story ---------- */}
      <Section className="bg-bone">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <SectionHead
              eyebrow="Our Story"
              title="Attached to a tire bay, not a warehouse"
              lede="Most online tire stores are a catalog with a checkout button attached. This one is attached to a shop that mounts tires for a living."
            />

            <div className="max-w-[68ch] space-y-5 text-[1.0625rem] leading-[1.7] text-smoke">
              <p>
                {BUSINESS.parent} is a tire shop at {BUSINESS.shop.full}. It
                mounts, balances and installs tires in the bay, and runs mobile
                install vans that do the same work on driveways, office lots and
                jobsites around South Florida.
              </p>
              <p>
                What people call a tire shop for is knowing which tire is worth
                the money. We hear how a set wore out. We see which sidewalls
                crack in the heat, which ones go quiet at highway speed, and
                which bargain brand comes back angry at 20,000 miles.
              </p>
              <p>
                {BUSINESS.name} is the shop&apos;s online store. You order online
                and the tires ship free, direct from a distributor warehouse, to
                any address in {BUSINESS.shipping.area} — but the catalog was
                picked by a shop, not by a spreadsheet. If you live near{" "}
                {BUSINESS.shop.city}, ship them free to us instead and we will
                fit them.
              </p>
            </div>

            <p className="mt-7 flex flex-wrap items-center gap-2 text-sm text-smoke">
              <Badge tone="soft">The lockup</Badge>
              <span>
                You will see{" "}
                <span className="font-display text-[12px] font-bold uppercase tracking-[0.09em] text-extremeRed">
                  {BUSINESS.poweredBy}
                </span>{" "}
                on this site. That is the parent business — the shop, the vans
                and the people.
              </span>
            </p>
          </div>

          <div>
            <ul className="mt-2">
              {FACTS.map((fact) => (
                <FactItem key={fact.label} {...fact} />
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ---------- By the numbers ---------- */}
      <section className="bg-ink-wash py-12 text-bone md:py-16">
        <div className="wrap">
          <h2 className="sr-only">{BUSINESS.name} by the numbers</h2>
          <dl className="grid grid-cols-2 gap-8 md:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="block font-display text-4xl leading-none text-amber md:text-5xl">
                    {s.value}
                  </span>
                  <span className="mt-2 block text-sm text-bone/65">
                    {s.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 text-xs text-bone/60">
            The state count is the continental-US shipping area and the town
            list is the mobile install area. None of these are marketing
            round-ups.
          </p>
        </div>
      </section>

      {/* ---------- Commitment ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="How We Work"
          title="What you get that a warehouse cannot give you"
          lede="Nothing here is a trade secret. It is the short list of things we refuse to cut corners on, online or in the bay."
        />

        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {DIFFERENTIATORS.map(({ icon: Icon, title, copy }) => (
            <li key={title} className="card p-6">
              <Icon size={26} aria-hidden className="mb-4 text-drop" />
              <h3 className="h3">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-smoke">{copy}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Badge tone="soft">Brands in the catalog</Badge>
          {TIRE_BRAND_NAMES.map((name) => (
            <span key={name} className="font-display text-lg text-ink/70">
              {name}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-smoke">
          Every brand named here has tires you can filter to and buy on this
          site right now. The catalog widens as distributor access does — if you
          want something that is not listed, call and ask before you assume we
          cannot get it.
        </p>
      </Section>

      {/* ---------- CTA ---------- */}
      <section className="bg-steel-wash py-14 text-bone md:py-20">
        <div className="wrap grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="eyebrow-dark mb-2">{BUSINESS.tagline}</p>
            <h2 className="h2">Tell us the vehicle. We will find the tire.</h2>
            <p className="lede mt-4 max-w-xl text-bone/70">
              Shipping anywhere in {BUSINESS.shipping.area}, free to the{" "}
              {BUSINESS.shop.city} shop if you would rather we fit them, and the
              van for driveways around Broward.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <Link to="/tires" className="btn-primary">
              Shop Tires
            </Link>
            <a href={BUSINESS.phoneHref} className="btn-ghost-light">
              <Phone size={18} aria-hidden />
              Call {BUSINESS.phone}
            </a>
            <Link
              to="/locations"
              className="btn-ghost-light border-transparent text-bone/70 hover:border-bone"
            >
              <MapPin size={18} aria-hidden />
              Visit the {BUSINESS.shop.city} shop
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
