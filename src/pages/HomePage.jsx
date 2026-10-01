import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck,
  CircleDollarSign,
  CloudSun,
  ExternalLink,
  Gauge,
  ListChecks,
  MapPin,
  Package,
  PackageCheck,
  Phone,
  Ruler,
  Snowflake,
  Store,
  Truck,
  Wrench,
} from "lucide-react";

import { BUSINESS, YELP_PROFILE, googleReviewHref } from "../data/business.js";
import { SERVICE_AREA_LABEL, SERVICE_COUNTIES } from "../data/serviceArea.js";
import ServiceAreaCounties from "../components/ui/ServiceAreaCounties.jsx";
import { MOBILE_SERVICES, SHOP_SERVICES } from "../data/services.js";
import { TIRES, TIRE_CATEGORIES } from "../data/products.js";
import ProductCard from "../components/shop/ProductCard.jsx";
import SearchPanel from "../components/shop/SearchPanel.jsx";
import { searchTires } from "../data/api.js";
import { Seo, Section, SectionHead } from "../components/ui/index.jsx";

/* ---------------------------------- Hero --------------------------------- */

// The three free tools, in the order a stuck shopper needs them: what size,
// which tire, and whether they need tires at all.
const TOOLS_LIST = [
  {
    to: "/tire-size",
    label: "Decode my tire size",
    copy: "Type what is on your sidewall and see every number explained, drawn to the proportions of your own tire. Compare two sizes and see what actually changes.",
    Icon: Ruler,
  },
  {
    to: "/find-my-tires",
    label: "Find my tires",
    copy: "Five questions about your car, your roads and your weather, and a shortlist that says plainly why each tire made it.",
    Icon: ListChecks,
  },
  {
    to: "/tire-check",
    label: "Do I need tires yet?",
    copy: "Check the tread with a coin you already have, and the age with the code on the sidewall. If nothing says replace yet, it says so.",
    Icon: Gauge,
  },
];

function Hero() {
  const navigate = useNavigate();

  // Shopping by vehicle or by sidewall size is the entry path on every
  // competitor. The finder offers every make and model year 1981-2027, most
  // of which the size table cannot size, so — like the theme's hero — a
  // vehicle goes to Find My Tires: it fills the typical size when the table
  // has one and otherwise asks for the size off the sidewall ("Other / not
  // listed" lands on that size field). A size goes straight to the catalog
  // with the query keys the tire listing reads back.
  const onSearch = (payload) => {
    if (payload.type === "vehicle") {
      const query = new URLSearchParams({
        vy: payload.year,
        vmk: payload.make,
        vmd: payload.model,
      });
      navigate(`/find-my-tires?${query.toString()}`);
      return;
    }
    const fields = { w: payload.width, a: payload.aspect, d: payload.diameter };
    const query = new URLSearchParams(
      Object.entries(fields).filter(([, value]) => value),
    );
    // Start the search now rather than after the route change, so the tire
    // listing usually finds it already answered. A partial size has nothing
    // to send and is narrowed on the listing itself. Failure is handled
    // there too: the listing falls back to the sample catalog.
    if (payload.width && payload.aspect && payload.diameter) {
      searchTires({
        size: `${payload.width}/${payload.aspect}R${payload.diameter}`,
      }).catch(() => {});
    }
    navigate(`/tires?${query.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-ink-wash text-bone">
      {/* Tread-pattern wash behind the headline. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, #fff 0 2px, transparent 2px 22px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/2 hidden h-[560px] w-[560px] -translate-y-1/2 rounded-full border-[72px] border-graphite lg:block"
      />

      {/* Three children, ordered headline → finder → supporting copy, so on a
          phone the finder clears the fold instead of sitting under four lines
          of prose. On a wide screen the explicit row/column placement puts the
          copy back together in the left half with the finder beside it. */}
      <div className="wrap relative grid gap-7 py-10 md:py-14 lg:grid-cols-[.9fr_1.1fr] lg:gap-x-12 lg:gap-y-6 lg:py-16">
        <div className="order-1 lg:col-start-1 lg:row-start-1 lg:self-end">
          <p className="eyebrow-dark mb-3 flex items-center gap-2">
            <Truck size={16} aria-hidden />
            {BUSINESS.tagline}
          </p>

          <h1 className="h1">
            Order tires online.
            <span className="block text-volt">We ship them to you.</span>
          </h1>
        </div>

        {/* The finder is the hero, not an accessory to it: it gets the wider
            column, a ring that lifts it off the dark band, and first position
            on a phone, because shopping by vehicle or by sidewall size is how
            nearly every tire purchase starts. */}
        <div className="order-2 rounded-card bg-bone p-5 text-ink shadow-lift ring-4 ring-volt/25 md:p-7 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
          <p className="eyebrow mb-1.5">Start here</p>
          <h2 className="h2 mb-1 text-3xl md:text-4xl">Find your fit</h2>
          <p className="mb-5 text-sm text-smoke">
            Shop by vehicle, or by the size stamped on your sidewall.
          </p>
          <SearchPanel onSearch={onSearch} />
        </div>

        <div className="order-3 lg:col-start-1 lg:row-start-2 lg:self-start">
          <p className="lede max-w-lg text-bone/70">
            An online tire and wheel store shipping to any address in{" "}
            {BUSINESS.shipping.area} — or free to our South Florida shop, where
            we fit them for you.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/tires" className="btn-primary">
              Shop Tires
              <ArrowRight size={17} aria-hidden />
            </Link>
            <Link to="/shipping" className="btn-ghost-light">
              How Shipping Works
            </Link>
          </div>
          {/* No "Powered by" footnote here: it already sits in the header,
              the final CTA and the footer. */}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Trust bar ------------------------------- */

// The band every large tire retailer puts directly under the fold, because the
// four questions a first-time online tire buyer has — what does shipping cost,
// will you ship to me, who fits them, and how old is the rubber — all get
// answered before they have to ask.

const TRUST = [
  {
    Icon: Truck,
    title: "Free shipping on every tire",
    copy: "No minimum and no freight surcharge. The price on the tire is the price that ships.",
  },
  {
    Icon: MapPin,
    title: "Ships to the 48 contiguous states + DC",
    copy: `Any street address in ${BUSINESS.shipping.area} — home, work, or your own installer.`,
  },
  {
    Icon: Store,
    title: "Free ship-to-store & install",
    copy: `Send the set to our ${BUSINESS.shop.city} shop at no charge and book the fitting.`,
  },
  {
    Icon: CalendarCheck,
    title: "Fresh, DOT-dated rubber",
    copy: "Shipped direct rather than pulled off a back-room shelf, and the date code on the sidewall shows when it was made.",
  },
];

function TrustBar() {
  return (
    <section className="border-b border-ink/[0.07] bg-bone">
      <ul className="wrap grid grid-cols-2 gap-x-4 gap-y-6 py-8 md:gap-x-5 md:gap-y-7 lg:grid-cols-4 lg:gap-x-8">
        {TRUST.map(({ Icon, title, copy }) => (
          <li key={title} className="flex flex-col gap-2">
            <Icon size={22} aria-hidden className="text-drop" />
            <h3 className="text-balance text-[15px] leading-snug md:text-base">
              {title}
            </h3>
            <p className="line-clamp-3 text-xs leading-relaxed text-smoke md:line-clamp-none">
              {copy}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ----------------------------- Shop by category --------------------------- */

// Icons are keyed off the catalog's own category names, so a new category in
// `products.js` still renders — it just falls back to the generic tire icon.
const CATEGORY_ICONS = {
  "All-Season": CloudSun,
  Performance: Gauge,
  "Truck & SUV": Truck,
  Winter: Snowflake,
  Commercial: Building2,
};

const CATEGORY_COPY = {
  "All-Season": "The everyday set — grip, tread life and quiet in one tire.",
  Performance: "Summer and ultra-high-performance rubber for a quick car.",
  "Truck & SUV": "Highway and all-terrain sets rated for the weight you carry.",
  Winter: "3PMSF compounds that stay soft when the road stops cooperating.",
  Commercial: "Load-rated LT and van sizes for work trucks and fleets.",
};

function ShopByCategory() {
  return (
    <Section className="bg-bone">
      <SectionHead
        eyebrow="Shop by category"
        title="Start with the kind of tire you need"
        action={
          <Link to="/tires" className="btn-outline btn-sm">
            All tires
            <ArrowRight size={15} aria-hidden />
          </Link>
        }
      />

      {/* On a phone the five cards are a swipe row rather than a 900px
          stack; the row bleeds to the screen edge and snaps card by card. */}
      <div className="-mx-5 grid auto-cols-[68%] grid-flow-col gap-3 overflow-x-auto overscroll-x-contain scroll-px-5 px-5 pb-5 pt-1 [scrollbar-width:none] snap-x snap-mandatory sm:mx-0 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible sm:p-0 sm:snap-none lg:grid-cols-5 [&::-webkit-scrollbar]:hidden">
        {TIRE_CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category] ?? BadgeCheck;
          return (
            <Link
              key={category}
              to={`/tires?category=${encodeURIComponent(category)}`}
              className="card-hover group flex snap-start flex-col p-5 transition-colors hover:border-drop/40"
            >
              <Icon size={24} aria-hidden className="mb-3 text-drop" />
              <h3 className="text-lg leading-tight">{category}</h3>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-smoke">
                {CATEGORY_COPY[category]}
              </p>
              <span className="mt-4 flex items-center gap-1.5 font-display text-[13px] font-bold text-ink group-hover:text-drop">
                Shop
                <ArrowRight
                  size={14}
                  aria-hidden
                  className="transition-transform group-hover:translate-x-1"
                />
              </span>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}

/* ----------------------------- Delivery choice ---------------------------- */

const DELIVERY = [
  {
    Icon: Package,
    eyebrow: "48 contiguous states + DC",
    title: "Ship it to me",
    copy: "Your order ships direct from a distributor warehouse to the address you give us — home, work, or your own installer. Shipping is free, and the delivery estimate is shown at checkout before you commit.",
    to: "/shipping",
    cta: "How shipping works",
  },
  {
    Icon: Store,
    eyebrow: "South Florida",
    title: "Ship free to the shop — we'll fit them",
    copy: `Send the order to ${BUSINESS.shop.name} at no charge, then book an install. Mounting, balancing, valve stems and disposal of the old set, all handled in the bay.`,
    to: "/install",
    cta: "Ship to store & install",
  },
];

function DeliveryChoice() {
  return (
    <Section className="bg-bone">
      <SectionHead
        align="center"
        eyebrow="Two ways to get them"
        title="You choose where the tires land"
        lede="Same catalog, same prices. The only decision is whether they come to your door or to our door."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {DELIVERY.map(({ Icon, eyebrow, title, copy, to, cta }) => (
          <div key={title} className="card flex flex-col p-7">
            <div className="mb-4 flex items-center gap-2">
              <Icon size={22} aria-hidden className="text-drop" />
              <span className="font-display text-xs font-bold uppercase tracking-[0.09em] text-smoke">
                {eyebrow}
              </span>
            </div>
            <h3 className="h3">{title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-smoke">
              {copy}
            </p>
            <Link to={to} className="btn-outline btn-sm mt-6 self-start">
              {cta}
              <ArrowRight size={15} aria-hidden />
            </Link>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------ Category tiles ---------------------------- */

// Switched off on the storefront theme ("td_tiles" is disabled in the home
// template); kept so it can come back with one flag.
const SHOW_CATEGORY_TILES = false;

const CATEGORIES = [
  {
    to: "/tires",
    label: "Tires",
    copy: "All-season, performance, truck and SUV — shipped free to the 48 contiguous states and DC.",
    Icon: BadgeCheck,
  },
  {
    to: "/wheels",
    label: "Wheels",
    copy: "Alloy, forged and off-road wheels, fitment-checked before anything ships.",
    Icon: BadgeCheck,
  },
  {
    to: "/commercial-tires",
    label: "Commercial & Fleet",
    copy: "Load-rated sizes for vans and work trucks, shipped to the yard or to the shop.",
    Icon: Truck,
  },
  {
    to: "/auto-service",
    label: "Service — South Florida",
    copy: "Brakes, alignment, suspension and diagnostics at the Sunrise shop.",
    Icon: Wrench,
  },
];

function CategoryTiles() {
  return (
    <Section className="bg-fog">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {CATEGORIES.map(({ to, label, copy, Icon }) => (
          <Link
            key={to}
            to={to}
            className="card-hover group flex flex-col p-6 transition-colors hover:border-drop/40"
          >
            <Icon size={26} aria-hidden className="mb-4 text-drop" />
            <h3 className="h3">{label}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-smoke">
              {copy}
            </p>
            <span className="mt-4 flex items-center gap-1.5 font-display text-sm font-bold text-ink group-hover:text-drop">
              Explore
              <ArrowRight
                size={15}
                aria-hidden
                className="transition-transform group-hover:translate-x-1"
              />
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}

/* -------------------------------- How it works ---------------------------- */

const STEPS = [
  {
    n: "01",
    title: "Find your size",
    copy: "Search by vehicle or by the numbers on your sidewall and compare the whole catalog.",
  },
  {
    n: "02",
    title: "Pick your delivery",
    copy: "Ship to your address, or free to the shop if you're in South Florida.",
  },
  {
    n: "03",
    title: "We confirm and release it",
    copy: "We check the fitment against your vehicle, then release the order to ship.",
  },
  {
    n: "04",
    title: "Fit them your way",
    copy: "Use your own installer, or let us mount and balance them here in the bay.",
  },
];

function HowItWorks() {
  // Fog, so it reads as its own band between the white category and
  // delivery sections.
  return (
    <Section className="bg-fog">
      <SectionHead
        eyebrow="How it works"
        title="Four steps from search to installed"
        lede="No stock sitting in a warehouse waiting to age — orders ship direct, so what turns up on your drive is fresh rubber."
        action={
          <Link to="/shipping" className="btn-outline btn-sm">
            Shipping details
          </Link>
        }
      />

      <ol className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {STEPS.map((s) => (
          <li key={s.n} className="card relative p-6">
            <span
              aria-hidden
              className="font-display text-5xl font-bold leading-none text-drop/80"
            >
              {s.n}
            </span>
            <h3 className="h3 mt-3">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-smoke">{s.copy}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ------------------------------ Featured tires ---------------------------- */

function FeaturedTires() {
  // The catalog is the source of truth; fall back gracefully if it is empty.
  // Catalog order, not a ranking: there are no sales or review figures to
  // rank by, so the section does not claim any.
  const featured = (TIRES ?? []).slice(0, 4);

  if (featured.length === 0) return null;

  return (
    <Section className="bg-fog">
      <SectionHead
        eyebrow="In the catalog"
        title="A few sets to start with"
        action={
          <Link to="/tires" className="btn-outline btn-sm">
            Shop all tires
            <ArrowRight size={15} aria-hidden />
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {featured.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </Section>
  );
}

/* ----------------------------- Local advantage ---------------------------- */

function LocalAdvantage() {
  return (
    <Section className="bg-bone">
      <SectionHead
        eyebrow="South Florida only"
        title="Local? We'll put them on for you"
        lede={`Ship-to-store is free, and installation happens at ${BUSINESS.parent} in ${BUSINESS.shop.city} — or in your own driveway if the van is the easier answer.`}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-7">
          <div className="mb-5 flex items-center gap-2">
            <Wrench size={20} aria-hidden className="text-drop" />
            <h3 className="h3">In the bay — {BUSINESS.shop.city}</h3>
          </div>
          <ul className="space-y-2.5">
            {SHOP_SERVICES.map((s) => (
              <li key={s.slug}>
                <Link
                  to={`/services/${s.slug}`}
                  className="flex items-baseline justify-between gap-4 border-b border-ink/5 py-2 text-sm hover:text-drop"
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="shrink-0 text-xs text-smoke">
                    from ${s.priceFrom} · {s.duration}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/install" className="btn-primary btn-sm mt-6">
            Ship to store &amp; install
          </Link>
        </div>

        <div className="card p-7">
          <div className="mb-5 flex items-center gap-2">
            <Truck size={20} aria-hidden className="text-drop" />
            <h3 className="h3">Mobile — Miami-Dade to Palm Beach</h3>
          </div>
          <ul className="space-y-2.5">
            {MOBILE_SERVICES.map((s) => (
              <li key={s.slug}>
                <Link
                  to={`/services/${s.slug}`}
                  className="flex items-baseline justify-between gap-4 border-b border-ink/5 py-2 text-sm hover:text-drop"
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="shrink-0 text-xs text-smoke">
                    from ${s.priceFrom} · {s.duration}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/mobile-service" className="btn-outline btn-sm mt-6">
            How the van works
          </Link>
        </div>
      </div>

      <p className="mt-10 text-center font-display text-xs font-bold uppercase tracking-[0.09em] text-smoke">
        Mobile install covers {SERVICE_AREA_LABEL}
      </p>
      <ServiceAreaCounties className="mx-auto mt-4 max-w-4xl" />

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a href={BUSINESS.phoneHref} className="btn-primary">
          <Phone size={17} aria-hidden />
          {BUSINESS.phone}
        </a>
        <Link to="/locations" className="btn-outline">
          <MapPin size={17} aria-hidden />
          Visit the {BUSINESS.shop.city} shop
        </Link>
      </div>
    </Section>
  );
}

/* ---------------------------------- Proof --------------------------------- */

function ToolsBand() {
  return (
    <Section className="bg-ink-wash">
      <SectionHead
        eyebrow="Free, no email required"
        title="Not sure what you need? Start here"
        lede="Three tools that answer the questions that stop people buying tires online. They work whether or not you buy anything from us."
        tone="dark"
      />

      <div className="mt-8 grid gap-3 sm:gap-4 lg:grid-cols-3">
        {TOOLS_LIST.map(({ to, label, copy, Icon }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col rounded-card border border-graphite bg-steel-wash p-5 transition-colors hover:border-volt/40 sm:p-6"
          >
            <Icon size={24} aria-hidden className="mb-4 text-volt" />
            <h3 className="h3 text-bone">{label}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-bone/70">
              {copy}
            </p>
            <span className="mt-4 flex items-center gap-1.5 font-display text-sm font-bold text-volt">
              Open it
              <ArrowRight
                size={15}
                aria-hidden
                className="transition-transform group-hover:translate-x-1"
              />
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function Proof() {
  // Figures that stay true and imply nothing about stock or tenure. No star
  // rating and no quote: TireDrop's own reviews are still being collected, so
  // the card sends the reader to the shop's real Google and Yelp profiles.
  const stats = [
    { v: "48", l: "States we ship to, plus DC" },
    { v: "$0", l: "Shipping, with no minimum" },
    {
      v: `${MOBILE_SERVICES.length + SHOP_SERVICES.length}`,
      l: "Services at the shop",
    },
    { v: `${SERVICE_COUNTIES.length}`, l: "Counties we install in" },
  ];

  return (
    <Section className="bg-fog">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <p className="eyebrow mb-2">Why {BUSINESS.name}</p>
          <h2 className="h2">
            An online tire store with a real shop behind it
          </h2>
          <p className="lede mt-4">
            {BUSINESS.parent} mounts tires in {BUSINESS.shop.city}, and{" "}
            {BUSINESS.name} is the same crew selling online. Orders ship direct
            to wherever you want them: your own door anywhere in the 48 contiguous states or DC,
            or our bay in {BUSINESS.shop.city}.
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-2">
            {stats.map((s) => (
              <div key={s.l}>
                <dt className="sr-only">{s.l}</dt>
                <dd>
                  <span className="block font-display text-4xl text-drop">
                    {s.v}
                  </span>
                  <span className="mt-1 block text-[13px] leading-snug text-smoke">
                    {s.l}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          <Link to="/about" className="btn-outline btn-sm mt-8">
            Our story
          </Link>
        </div>

        <div className="card p-7">
          <div className="border-b border-ink/10 pb-5">
            <p className="font-display text-sm font-semibold text-smoke">
              Customer reviews
            </p>
            <h3 className="h3 mt-1">Read the real ones</h3>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-smoke">
            {BUSINESS.name} is new, so its own reviews are still being
            collected. The shop behind it is not: both profiles below are{" "}
            {BUSINESS.parent}&apos;. We do not reprint star counts here — open
            either one and read what is actually there.
          </p>

          <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
            <a
              href={googleReviewHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary btn-sm w-full"
            >
              {BUSINESS.parent} on Google
              <ExternalLink size={14} aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <a
              href={YELP_PROFILE.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline btn-sm w-full"
            >
              {BUSINESS.parent} on Yelp
              <ExternalLink size={14} aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>

          <Link
            to="/reviews"
            className="mt-5 inline-block text-sm font-semibold text-drop underline underline-offset-2"
          >
            More on reviews
          </Link>
        </div>
      </div>
    </Section>
  );
}

/* --------------------------------- Final CTA ------------------------------ */

function FinalCta() {
  return (
    <Section className="bg-ink-wash text-bone">
      <div className="flex flex-col items-center gap-6 text-center">
        <PackageCheck size={34} aria-hidden className="text-volt" />
        <h2 className="h2 max-w-2xl">Find your size and pick your delivery</h2>
        <p className="lede max-w-xl text-bone/65">
          Search the catalog, add a set to your cart, and choose shipping or
          free ship-to-store at checkout. Questions on fitment? Call us.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/tires" className="btn-primary">
            Shop Tires
            <ArrowRight size={17} aria-hidden />
          </Link>
          <a href={BUSINESS.phoneHref} className="btn-ghost-light">
            <Phone size={17} aria-hidden />
            Call {BUSINESS.phone}
          </a>
        </div>
        <p className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-[0.09em] text-bone/60">
          <CircleDollarSign size={14} aria-hidden />
          {BUSINESS.poweredBy}
        </p>
      </div>
    </Section>
  );
}

/* ---------------------------------- Page ---------------------------------- */

export default function HomePage() {
  return (
    <>
      <Seo
        title="Tires & Wheels Shipped Nationwide"
        description="TireDrop is an online tire and wheel store shipping free to the 48 contiguous states and DC. Ship to your address, or free to our South Florida shop where we install them. Powered by Extreme Tires."
      />
      {/* Same order as the storefront theme's home template. Real products
          and real prices come third, the first proof that there is a shop
          here at all; the four steps follow the catalog so the process is
          explained right after the offer, then the two ways to get the tires
          and the tools for anyone who does not know their size. */}
      <Hero />
      <TrustBar />
      <FeaturedTires />

      {/* For the shopper the four featured tires did not suit. */}
      <ShopByCategory />
      <HowItWorks />
      <DeliveryChoice />

      {/* The way in for someone who cannot answer the finder because they do
          not know their size — which is the single most common reason a tire
          shopper leaves a site. */}
      <ToolsBand />

      {/* The local pitch, then the proof behind it. */}
      <LocalAdvantage />
      <Proof />
      {SHOW_CATEGORY_TILES && <CategoryTiles />}
      <FinalCta />
    </>
  );
}
