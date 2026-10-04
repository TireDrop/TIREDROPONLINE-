import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarCheck,
  ChevronDown,
  CircleDollarSign,
  CloudSun,
  ExternalLink,
  Gauge,
  ListChecks,
  MapPin,
  MousePointerClick,
  PackageCheck,
  Phone,
  Ruler,
  ScanLine,
  Snowflake,
  Store,
  Truck,
  Wrench,
} from "lucide-react";

import HOME_READING from "virtual:home-reading";
// Path, label and blurb of each tool page (toolLinks() in vite.config.js).
import TOOL_LINKS from "virtual:tool-links";
import { BUSINESS, YELP_PROFILE, googleReviewHref } from "../data/business.js";
import { SERVICE_AREA_LABEL } from "../data/serviceArea.js";
import ServiceAreaCounties from "../components/ui/ServiceAreaCounties.jsx";
import { MOBILE_SERVICES, SHOP_SERVICES, getService } from "../data/services.js";
import {
  TIRES,
  TIRE_BRAND_NAMES,
  TIRE_CATEGORIES,
} from "../data/products.js";
import { STATE_PAGES_LIVE, getState, statePath } from "../data/stateList.js";
// The hub map, coarse and position-only (npm run build:hubs): about 5 KB of
// inline SVG, no request and no location lookup on the home page.
import HUB_MINI from "../data/deliveryHubsMini.generated.json";
import ProductCard from "../components/shop/ProductCard.jsx";
import ScanTireButton from "../components/shop/ScanTireButton.jsx";
import SearchPanel from "../components/shop/SearchPanel.jsx";
import { searchTires } from "../data/api.js";
import { serializeTiresQuery, slug } from "../lib/tiresUrl.js";
import { useScrollReveal } from "../lib/useScrollReveal.js";
import { Seo, Section, SectionHead } from "../components/ui/index.jsx";

/*
 * The home page reads top to bottom as one story:
 *
 *   find your fit (hero) → why buy here (trust strip) → what to buy (shop)
 *   → how it gets to you (how it works, with the local delivery teaser)
 *   → who fits it locally (install band)
 *   → help choosing (free tools) → learn more (guides and posts)
 *   → the rest of the country (nationwide) → last questions (FAQ) → act.
 *
 * Motion is a fade-and-rise on scroll (src/lib/useScrollReveal.js): anything
 * marked `data-reveal` below the fold. The hero is never animated, and the
 * page is fully visible without JavaScript or with reduced motion.
 */

/** A soft light line where a dark band meets the page. */
function Hairline({ position = "top" }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 ${position === "top" ? "top-0" : "bottom-0"} h-px bg-gradient-to-r from-transparent via-volt/35 to-transparent`}
    />
  );
}

/** SectionHead, as one reveal unit. */
function Head(props) {
  return (
    <div data-reveal>
      <SectionHead {...props} />
    </div>
  );
}

/* ---------------------------------- Hero --------------------------------- */

// Installation is not free: name the shop's published starting price,
// from the service catalog, wherever free ship-to-store is offered.
const INSTALL = getService("tire-installation");

function Hero() {
  const navigate = useNavigate();

  // Shopping by vehicle or by sidewall size is the entry path on every
  // competitor, and both go straight to the tire list. A vehicle lands on
  // the same /tires address the finder there writes (SearchPanel has already
  // remembered it). A model the size table cannot size still gets the whole
  // list, each tire marked "Check fitment", with the door-jamb size prompt.
  // The 5-question quiz stays one tap away under the Scan button. A size
  // goes to the catalog with the query keys the tire listing reads back.
  const onSearch = (payload) => {
    if (payload.type === "vehicle") {
      const { year, make, model } = payload;
      const qs = serializeTiresQuery({
        selection: { type: "vehicle", year, make, model },
      });
      navigate(`/tires?${qs}`);
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

  // Not a reveal target: the headline is the largest paint on the page and
  // is shown as it arrives.
  return (
    <section
      data-home-section="hero"
      className="relative overflow-hidden bg-ink-wash text-bone"
    >
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
      {/* A low cyan glow under the finder, so the card reads as lit. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-0 hidden h-[420px] w-[620px] rounded-full bg-volt/10 blur-3xl lg:block"
      />
      <Hairline position="bottom" />

      {/* Three children, ordered headline → finder → supporting copy, so on a
          phone the finder clears the fold instead of sitting under four lines
          of prose. On a wide screen the explicit row/column placement puts the
          copy back together in the left half with the finder beside it. */}
      <div className="wrap relative grid gap-7 py-10 md:py-14 lg:grid-cols-[.9fr_1.1fr] lg:gap-x-12 lg:gap-y-6 lg:py-20">
        <div className="order-1 lg:col-start-1 lg:row-start-1 lg:self-end">
          <p className="eyebrow-dark mb-3 flex items-center gap-2">
            <Truck size={16} aria-hidden />
            {BUSINESS.tagline}
          </p>

          <h1 className="h1 text-balance">
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
            Shop by vehicle, by the size stamped on your sidewall, or snap a
            photo.
          </p>
          <SearchPanel onSearch={onSearch} />
          {/* The third way in: one camera for the door sticker, a sidewall
              or the VIN. On a phone it opens the camera on this tap and the
              Tire Size Finder reads the photo (ScanTireButton). */}
          <div aria-hidden className="mt-5 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-smoke">
            <span className="h-px flex-1 bg-ink/15" />
            or
            <span className="h-px flex-1 bg-ink/15" />
          </div>
          <ScanTireButton
            testId="hero-scan"
            className="btn-outline mt-4 min-h-[48px] w-full justify-center"
          />
          <p className="mt-2 text-center text-xs text-smoke">
            Door sticker, tire sidewall or VIN. We read the size for you.
          </p>
          {/* For the shopper who knows the car but not the tire: the quiz
              asks about roads, weather and priorities, and shortlists. */}
          <p className="mt-3 border-t border-ink/10 pt-2 text-center">
            <Link
              to="/find-my-tires"
              className="inline-flex min-h-[44px] items-center text-sm font-semibold text-drop hover:text-dive"
            >
              {/* On a phone it breaks after the question, not mid-phrase. */}
              <span>
                Not sure which tire?{" "}
                <span className="whitespace-nowrap">Answer 5 quick questions →</span>
              </span>
            </Link>
          </p>
        </div>

        <div className="order-3 lg:col-start-1 lg:row-start-2 lg:self-start">
          <p className="lede max-w-lg text-bone/70">
            An online tire and wheel store shipping to any address in{" "}
            {BUSINESS.shipping.area} — or free to our South Florida shop, where
            we fit them from ${INSTALL.priceFrom} {INSTALL.priceUnit}.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/tires" className="btn-primary min-h-[48px]">
              Shop Tires
              <ArrowRight size={17} aria-hidden />
            </Link>
            <Link to="/shipping" className="btn-ghost-light min-h-[48px]">
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

/* ------------------------------- Trust strip ------------------------------ */

// The band every large tire retailer puts directly under the fold: what does
// shipping cost and where does it go, how old is the rubber, who fits it, and
// who picks up the phone.

const TRUST = [
  {
    Icon: Truck,
    title: "Free shipping, 48 states + DC",
    copy: `No minimum and no freight surcharge, to any street address in ${BUSINESS.shipping.area}.`,
  },
  {
    Icon: CalendarCheck,
    title: "Fresh, DOT-dated rubber",
    copy: "Shipped direct rather than pulled off a back-room shelf, and the date code on the sidewall shows when it was made.",
  },
  {
    Icon: Wrench,
    title: "Installed in South Florida",
    copy: `Free ship-to-store at our ${BUSINESS.shop.city} shop, or the mobile van in Miami-Dade, Broward and Palm Beach.`,
  },
];

function TrustBar() {
  return (
    <section
      data-home-section="trust"
      aria-label="Why order from TireDrop"
      className="border-b border-ink/[0.07] bg-bone"
    >
      <ul className="wrap grid grid-cols-1 gap-x-6 gap-y-5 py-8 sm:grid-cols-2 md:py-10 lg:grid-cols-4 lg:gap-x-0 lg:divide-x lg:divide-ink/[0.07]">
        {TRUST.map(({ Icon, title, copy }, i) => (
          <li
            key={title}
            data-reveal
            style={{ "--rv-i": i }}
            className="flex gap-3.5 lg:px-6 lg:first:pl-0"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-sky text-drop">
              <Icon size={21} aria-hidden />
            </span>
            <div>
              <h3 className="text-balance text-[15px] leading-snug md:text-base">
                {title}
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-smoke">
                {copy}
              </p>
            </div>
          </li>
        ))}
        <li
          data-reveal
          style={{ "--rv-i": TRUST.length }}
          className="flex gap-3.5 lg:px-6 lg:last:pr-0"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-drop text-bone shadow-glow">
            <Phone size={20} aria-hidden />
          </span>
          <div>
            <h3 className="text-[15px] leading-snug md:text-base">
              Questions? Talk to the shop
            </h3>
            <a
              href={BUSINESS.phoneHref}
              className="mt-0.5 inline-flex min-h-[44px] items-center font-display text-lg font-bold text-drop hover:text-dive"
            >
              {BUSINESS.phone}
            </a>
          </div>
        </li>
      </ul>
    </section>
  );
}

/* ---------------------------------- Shop ---------------------------------- */

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

function Shop() {
  // Catalog order, not a ranking: there are no sales or review figures to
  // rank by, so the row does not claim any.
  const featured = (TIRES ?? []).slice(0, 4);

  return (
    <Section id="shop" data-home-section="shop" className="bg-fog">
      <Head
        eyebrow="Shop tires"
        title="Start with the kind of tire you need"
        action={
          <Link to="/tires" className="btn-outline btn-sm min-h-[44px]">
            All tires
            <ArrowRight size={15} aria-hidden />
          </Link>
        }
      />

      {/* On a phone the five cards are a swipe row rather than a 900px
          stack; the row bleeds to the screen edge and snaps card by card.
          The row reveals as one piece, so a card swiped in later is never
          caught mid-fade. */}
      <div
        data-reveal
        className="-mx-5 grid auto-cols-[68%] grid-flow-col gap-3 overflow-x-auto overscroll-x-contain scroll-px-5 px-5 pb-5 pt-1 [scrollbar-width:none] snap-x snap-mandatory sm:mx-0 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible sm:p-0 sm:snap-none lg:grid-cols-5 [&::-webkit-scrollbar]:hidden"
      >
        {TIRE_CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category] ?? BadgeCheck;
          return (
            <Link
              key={category}
              to={`/tires?category=${encodeURIComponent(category)}`}
              className="card-hover group flex snap-start flex-col p-5 transition-colors hover:border-drop/40"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-card bg-sky text-drop transition-colors group-hover:bg-drop group-hover:text-bone">
                <Icon size={22} aria-hidden />
              </span>
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

      {/* Brands in the catalog, then the other two ways into the store. */}
      <div
        data-reveal
        className="mt-6 flex flex-col gap-4 rounded-card border border-ink/[0.07] bg-bone p-5 shadow-card md:flex-row md:items-center md:gap-6 md:p-6"
      >
        <h3 className="shrink-0 font-display text-xs font-bold uppercase tracking-[0.09em] text-smoke">
          Shop by brand
        </h3>
        <ul className="flex flex-1 flex-wrap gap-2">
          {TIRE_BRAND_NAMES.map((brand) => (
            <li key={brand}>
              <Link
                to={`/tires?brand=${slug(brand)}`}
                className="inline-flex min-h-[44px] items-center rounded-sm border border-ink/10 bg-fog px-4 font-display text-sm font-bold text-ink transition-colors hover:border-drop/40 hover:bg-sky hover:text-drop"
              >
                {brand}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex shrink-0 flex-wrap gap-x-5 gap-y-1 border-t border-ink/[0.07] pt-3 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <Link
            to="/wheels"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-drop hover:text-dive"
          >
            Wheels
            <ArrowRight size={14} aria-hidden />
          </Link>
          <Link
            to="/commercial-tires"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-drop hover:text-dive"
          >
            Commercial &amp; fleet
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </div>

      {featured.length > 0 && (
        <>
          <div
            data-reveal
            className="mb-5 mt-14 flex items-end justify-between gap-4 md:mt-16"
          >
            <div>
              <p className="eyebrow mb-1.5">In the catalog</p>
              <h3 className="h3">A few sets to start with</h3>
            </div>
            <Link
              to="/tires"
              className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 text-sm font-semibold text-drop hover:text-dive"
            >
              Shop all tires
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
          <div
            data-reveal
            className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
          >
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}
    </Section>
  );
}

/* -------------------------------- How it works ---------------------------- */

const STEPS = [
  {
    Icon: MousePointerClick,
    title: "Order online",
    copy: "Search by vehicle, by the numbers on your sidewall, or scan them. We check the fitment against your vehicle before the order is released to ship.",
  },
  {
    Icon: PackageCheck,
    title: "Ship to you or the shop",
    copy: `Free to any address in ${BUSINESS.shipping.area}, or free to our ${BUSINESS.shop.city} shop. Checkout shows the delivery estimate before you commit.`,
  },
  {
    Icon: Wrench,
    title: "Installed",
    copy: "Your own installer fits them anywhere we ship. In South Florida we mount and balance them in the bay, or in your driveway from the van.",
  },
];

/**
 * The thread between two steps: a track, a fill that draws along it and a
 * small parcel that rides it. Decorative, so aria-hidden. Horizontal between
 * the round icons from md up (`h`), vertical down the stacked cards below it
 * (`v`). The CSS (.how-*, src/index.css) plays it only while the list carries
 * `how-play`; without that class it rests on its finished state.
 */
function HowSeg({ n, dir, className = "", style }) {
  return (
    <span
      aria-hidden
      className={`how-seg how-seg-${dir} how-seg-${n} pointer-events-none absolute ${className}`}
      style={style}
    >
      <span className="how-fill" />
      <span className="how-trk">
        <span className="how-dot" />
      </span>
    </span>
  );
}

/**
 * Plays the "How it works" story while the list is on screen: adds `how-play`
 * once it scrolls into view and takes it off when it leaves or the tab is
 * hidden, so the CSS loop never runs unseen. No class, no animation: the
 * prerendered page, no-JS visitors and reduced motion all see the finished
 * state. Same trigger margin as the scroll reveal so both start together.
 */
function useHowPlay(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
      return undefined;
    let seen = false;
    const sync = () => el.classList.toggle("how-play", seen && !document.hidden);
    const io = new IntersectionObserver(
      ([e]) => {
        seen = e.isIntersecting;
        sync();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.2 },
    );
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      el.classList.remove("how-play");
    };
  }, [ref]);
}

function HowItWorks() {
  const flow = useRef(null);
  useHowPlay(flow);
  return (
    <Section id="how-it-works" data-home-section="how" className="bg-bone">
      <Head
        align="center"
        eyebrow="How it works"
        title="Order online. Ship it. Get it installed."
        lede="Orders ship direct from a distributor warehouse rather than sitting on a shelf to age, so what turns up is fresh rubber."
      />

      <ol
        ref={flow}
        data-how-flow
        className="relative grid gap-4 md:grid-cols-3 md:gap-6"
      >
        {/* The thread between the three steps on a wide screen. */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-[16.6%] right-[16.6%] top-9 hidden h-px bg-gradient-to-r from-drop/10 via-drop/40 to-drop/10 md:block"
        />
        <HowSeg n={1} dir="h" className="left-[16.67%] top-[35px] hidden h-0.5 w-[33.33%] md:block" />
        <HowSeg n={2} dir="h" className="left-1/2 top-[35px] hidden h-0.5 w-[33.33%] md:block" />
        {STEPS.map(({ Icon, title, copy }, i) => (
          <li
            key={title}
            data-reveal
            style={{ "--rv-i": i }}
            className="relative flex gap-4 rounded-card border border-ink/[0.07] bg-fog/60 p-5 md:flex-col md:items-center md:border-0 md:bg-transparent md:p-0 md:text-center"
          >
            {/* Stacked cards: the thread runs down from this icon to the next. */}
            {i < 2 && (
              <HowSeg n={i + 1} dir="v" className="left-[55px] top-[92px] z-10 w-0.5 md:hidden" style={{ bottom: -38 }} />
            )}
            <span
              className={`how-ico how-ico-${i + 1} relative flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-bone text-drop shadow-card ring-1 ring-ink/[0.06]`}
            >
              <span aria-hidden className="how-halo" />
              {i === 0 && <span aria-hidden className="how-halo how-click" />}
              <Icon size={28} aria-hidden className="how-glyph" />
              <span
                aria-hidden
                className="how-badge absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink font-display text-xs font-bold text-bone"
              >
                {i + 1}
              </span>
              {i === 1 && (
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="how-check absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-drop p-1 text-bone ring-2 ring-bone"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 12 5 5L19 7" />
                </svg>
              )}
            </span>
            <div className="md:mt-5 md:max-w-xs">
              <h3 className="h3">
                <span className="sr-only">Step {i + 1}: </span>
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-smoke">{copy}</p>
            </div>
          </li>
        ))}
      </ol>

      <div
        data-reveal
        className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
      >
        <Link to="/shipping" className="btn-outline min-h-[48px] w-full sm:w-auto">
          <Truck size={17} aria-hidden />
          How shipping works
        </Link>
        <Link to="/install" className="btn-outline min-h-[48px] w-full sm:w-auto">
          <Store size={17} aria-hidden />
          Ship to store &amp; install
        </Link>
      </div>

      <HomeLocalDelivery />
    </Section>
  );
}

/**
 * The way into /local-delivery, under "How it works": the delivery story's
 * next chapter. Static on purpose: the page itself does the ZIP and location
 * check, so the home page makes no extra request and asks for nothing. Same
 * rules as that page: no partner name, no dates, speeds or fees, and it says
 * it is rolling out. Free shipping and the 3-county install copy above stay
 * as they are.
 */
function HomeLocalDelivery() {
  return (
    <div
      data-reveal
      data-home-local-delivery
      className="card mx-auto mt-12 grid max-w-4xl items-center gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,17rem)] md:gap-8 md:p-8"
    >
      <div>
        <p className="eyebrow mb-2">Local delivery · rolling out</p>
        <h3 className="h3 text-balance">Near one of our delivery hubs?</h3>
        <p className="mt-2 text-sm leading-relaxed text-smoke">
          We&apos;re adding local delivery around our hubs across the U.S.
          See if your ZIP is in a zone. Until it launches, every order ships
          free, the same as today.
        </p>
        <Link
          to="/local-delivery#zip-check"
          className="btn-dark mt-5 min-h-[48px] w-full sm:w-auto"
        >
          <MapPin size={17} aria-hidden />
          Check your ZIP
        </Link>
      </div>
      <div>
        <svg
          viewBox={HUB_MINI.viewBox}
          role="img"
          aria-label={`Map of the U.S. with ${HUB_MINI.hubs.length} local delivery hubs`}
          className="mx-auto block h-auto w-full max-w-[15rem] md:max-w-[18rem]"
        >
          <path d={HUB_MINI.land} className="fill-ink/[0.08]" />
          <g aria-hidden="true" className="fill-drop">
            {HUB_MINI.hubs.map(([x, y]) => (
              <circle key={`${x},${y}`} cx={x} cy={y} r={7.5} />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

/* --------------------------- Install & mobile band ------------------------ */

function ServiceList({ services }) {
  return (
    <ul className="space-y-1">
      {services.map((s) => (
        <li key={s.slug}>
          <Link
            to={`/services/${s.slug}`}
            className="flex min-h-[44px] items-center justify-between gap-4 border-b border-ink/5 text-sm transition-colors hover:text-drop"
          >
            <span className="font-medium">{s.name}</span>
            <span className="shrink-0 text-xs text-smoke">
              from ${s.priceFrom} · {s.duration}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function InstallBand() {
  return (
    <Section id="install" data-home-section="install" className="bg-fog">
      <Head
        eyebrow="South Florida only"
        title="Local? We'll put them on for you"
        lede={`Ship-to-store is free, and installation, from $${INSTALL.priceFrom} ${INSTALL.priceUnit}, happens at ${BUSINESS.parent} in ${BUSINESS.shop.city} — or in your own driveway if the van is the easier answer.`}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div data-reveal className="card flex flex-col p-6 md:p-7">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-card bg-sky text-drop">
              <Store size={21} aria-hidden />
            </span>
            <h3 className="h3">In the bay — {BUSINESS.shop.city}</h3>
          </div>
          <div className="flex-1">
            <ServiceList services={SHOP_SERVICES} />
          </div>
          <Link to="/install" className="btn-primary btn-sm mt-6 min-h-[44px] self-start">
            Ship to store &amp; install
          </Link>
        </div>

        <div
          data-reveal
          style={{ "--rv-i": 1 }}
          className="card flex flex-col p-6 md:p-7"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-card bg-sky text-drop">
              <Truck size={21} aria-hidden />
            </span>
            <h3 className="h3">Mobile — Miami-Dade to Palm Beach</h3>
          </div>
          <div className="flex-1">
            <ServiceList services={MOBILE_SERVICES} />
          </div>
          <Link to="/mobile-service" className="btn-outline btn-sm mt-6 min-h-[44px] self-start">
            How the van works
          </Link>
        </div>
      </div>

      <div data-reveal>
        <p className="mt-12 text-center font-display text-xs font-bold uppercase tracking-[0.09em] text-smoke">
          Mobile install covers {SERVICE_AREA_LABEL}
        </p>
        <ServiceAreaCounties className="mx-auto mt-4 max-w-4xl" />
      </div>

      {/* The shop behind the store, and where its real reviews live. No star
          rating and no quote: TireDrop's own reviews are still being
          collected, so this sends the reader to the shop's real profiles. */}
      <div
        data-reveal
        className="mt-10 grid gap-6 rounded-card bg-ink-wash p-6 text-bone shadow-lift md:p-8 lg:grid-cols-[1.2fr_1fr] lg:items-center"
      >
        <div>
          <p className="eyebrow-dark mb-2">A real shop behind it</p>
          <h3 className="h3 text-bone">
            {BUSINESS.parent} mounts tires in {BUSINESS.shop.city}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-bone/70">
            {BUSINESS.name} is the same crew selling online. It is new, so its
            own reviews are still being collected; the shop&apos;s are not. We do
            not reprint star counts here — read what is actually there.
          </p>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <a href={BUSINESS.phoneHref} className="btn-primary min-h-[48px]">
            <Phone size={17} aria-hidden />
            {BUSINESS.phone}
          </a>
          <Link to="/locations" className="btn-ghost-light min-h-[48px]">
            <MapPin size={16} aria-hidden />
            Visit the shop
          </Link>
          <a
            href={googleReviewHref()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost-light min-h-[48px]"
          >
            Google reviews
            <ExternalLink size={14} aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <a
            href={YELP_PROFILE.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost-light min-h-[48px]"
          >
            Yelp
            <ExternalLink size={14} aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </div>
    </Section>
  );
}

/* --------------------------------- Free tools ----------------------------- */

// The three that answer the questions that stop people buying tires online:
// what size, which tire, and whether they need tires at all.
const CORE_TOOLS = [
  {
    to: "/tire-size",
    label: "Decode my tire size",
    copy: "Every number on your sidewall explained, drawn to your own tire's proportions.",
    Icon: Ruler,
  },
  {
    to: "/find-my-tires",
    label: "Find my tires",
    copy: "Five questions about your car, roads and weather, and a shortlist that says why.",
    Icon: ListChecks,
  },
  {
    to: "/tire-check",
    label: "Do I need tires yet?",
    copy: "Check the tread with a coin and the age with the sidewall code.",
    Icon: Gauge,
  },
];

function ToolsBand() {
  return (
    <section
      id="tools"
      data-home-section="tools"
      className="section relative overflow-hidden bg-ink-wash text-bone"
    >
      <Hairline />
      <div className="wrap relative">
        <Head
          eyebrow="Free tools, no email required"
          title="Not sure what you need? Start here"
          lede="They work whether or not you buy anything from us."
          tone="dark"
        />

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {/* The scanner leads: no typing, just the photo. */}
          <Link
            to="/tire-size-finder"
            data-reveal
            className="group relative flex flex-col overflow-hidden rounded-card border border-volt/40 bg-volt/[0.08] p-5 transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-volt/70 hover:bg-volt/[0.12] sm:col-span-2 sm:p-6 lg:col-span-1"
          >
            <ScanLine size={26} aria-hidden className="mb-4 text-volt" />
            <h3 className="h3 text-bone">Tire Size Finder</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-bone/75">
              Snap the door sticker, a sidewall or the VIN, and it reads the
              size for you.
            </p>
            <span className="mt-4 flex items-center gap-1.5 font-display text-sm font-bold text-volt">
              Scan my size
              <ArrowRight
                size={15}
                aria-hidden
                className="transition-transform group-hover:translate-x-1"
              />
            </span>
          </Link>

          {CORE_TOOLS.map(({ to, label, copy, Icon }, i) => (
            <Link
              key={to}
              to={to}
              data-reveal
              style={{ "--rv-i": i + 1 }}
              className="group flex gap-4 rounded-card border border-graphite bg-steel-wash p-5 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-volt/40 sm:flex-col sm:gap-0 sm:p-6"
            >
              <Icon size={24} aria-hidden className="mt-0.5 shrink-0 text-volt sm:mb-4 sm:mt-0" />
              <div className="flex flex-1 flex-col">
                <h3 className="h3 text-bone">{label}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-bone/70">
                  {copy}
                </p>
              </div>
              <span className="mt-4 hidden items-center gap-1.5 font-display text-sm font-bold text-volt sm:flex">
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

        {/* The calculators from the Learn guides, as standalone pages. */}
        <div data-reveal className="mt-10">
          <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.09em] text-bone/60">
            More calculators and checks
          </h3>
          <ul className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            {TOOL_LINKS.map((tool) => (
              <li key={tool.path}>
                <Link
                  to={tool.path}
                  className="group flex min-h-[56px] items-center justify-between gap-4 border-b border-graphite py-3 transition-colors hover:border-volt/40"
                >
                  <span>
                    <span className="block font-display text-[15px] font-bold text-bone group-hover:text-volt">
                      {tool.label}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-bone/60">
                      {tool.blurb}
                    </span>
                  </span>
                  <ArrowRight
                    size={15}
                    aria-hidden
                    className="shrink-0 text-volt transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- Learn --------------------------------- */

function Learn() {
  // Real guides and posts, picked at build time (src/lib/homeReading.js).
  const cards = HOME_READING ?? [];
  if (cards.length === 0) return null;

  return (
    <Section id="learn" data-home-section="learn" className="bg-bone">
      <Head
        eyebrow="Learn"
        title="Know your tires before you buy them"
        lede="Plain-English guides to the sidewall, tread, pressure and Florida driving, plus blog posts on local questions."
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/learn" className="btn-outline btn-sm min-h-[44px]">
              All guides
              <ArrowRight size={15} aria-hidden />
            </Link>
            <Link to="/blog" className="btn-outline btn-sm min-h-[44px]">
              Blog
            </Link>
          </div>
        }
      />

      {/* A swipe row on a phone, like the categories, so six cards are not
          a 2,000px stack; a grid from `sm` up. Reveals as one piece. */}
      <ul
        data-reveal
        className="-mx-5 grid auto-cols-[84%] grid-flow-col gap-3 overflow-x-auto overscroll-x-contain scroll-px-5 px-5 pb-5 pt-1 [scrollbar-width:none] snap-x snap-mandatory sm:mx-0 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:p-0 sm:snap-none lg:grid-cols-3 [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card) => (
          <li key={card.path} className="flex snap-start">
            <Link
              to={card.path}
              className="card-hover group flex w-full flex-col p-6 hover:border-drop/40"
            >
              <span className="flex items-center gap-2 text-xs">
                <span
                  className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 font-display text-[11px] font-bold uppercase leading-none tracking-[0.09em] ${
                    card.kind === "guide"
                      ? "bg-sky text-drop"
                      : "bg-ink/[0.06] text-ink"
                  }`}
                >
                  {card.kind === "guide" ? "Guide" : "Blog"}
                </span>
                <span className="truncate font-semibold text-smoke">
                  {card.topic}
                </span>
              </span>
              <h3 className="mt-4 text-balance font-display text-[1.15rem] leading-snug text-ink transition-colors group-hover:text-drop">
                {card.title}
              </h3>
              <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-smoke">
                {card.description}
              </p>
              <span className="mt-5 flex items-center justify-between border-t border-ink/[0.07] pt-4 text-xs text-smoke">
                <span className="flex items-center gap-1.5">
                  <BookOpen size={14} aria-hidden />
                  {card.minutes ? `${card.minutes} min read` : "Read"}
                </span>
                <ArrowRight
                  size={15}
                  aria-hidden
                  className="text-drop transition-transform group-hover:translate-x-1"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* -------------------------------- Nationwide ------------------------------ */

function Nationwide() {
  const states = STATE_PAGES_LIVE.map(getState).filter(Boolean);

  return (
    <Section id="nationwide" data-home-section="nationwide" className="bg-fog">
      <div
        data-reveal
        className="relative overflow-hidden rounded-card bg-ink-wash text-bone shadow-lift"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, #fff 0 2px, transparent 2px 22px)",
          }}
        />
        <div className="relative grid gap-8 p-6 md:p-10 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:gap-12 lg:p-14">
          <div>
            <p className="eyebrow-dark mb-3 flex items-center gap-2.5">
              <span aria-hidden className="h-px w-6 bg-volt/50" />
              Shipping nationwide
            </p>
            <h2 className="h2 text-balance text-bone">
              Outside South Florida? We ship to you.
            </h2>
            <p className="lede mt-4 max-w-xl text-bone/75">
              Free shipping to any street address in {BUSINESS.shipping.area}.
              A local shop of your choosing mounts them, and each state guide
              covers that state&apos;s tire fees and rules.
            </p>
            <Link to="/tires-shipped" className="btn-primary mt-7 min-h-[48px]">
              Shipping to 48 states + DC
              <ArrowRight size={17} aria-hidden />
            </Link>
          </div>

          <div>
            <p
              aria-hidden
              className="font-display text-[5.5rem] font-extrabold leading-none tracking-tight text-volt md:text-[7rem]"
            >
              48<span className="text-bone/40">+DC</span>
            </p>
            {states.length > 0 && (
              <>
                <h3 className="mt-5 font-display text-xs font-bold uppercase tracking-[0.09em] text-bone/60">
                  State guides
                </h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {states.map((s) => (
                    <li key={s.slug}>
                      <Link
                        to={statePath(s.slug)}
                        className="inline-flex min-h-[44px] items-center rounded-sm border border-bone/20 bg-bone/5 px-3.5 text-sm font-semibold text-bone transition-colors hover:border-volt/60 hover:text-volt"
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ----------------------------------- FAQ ---------------------------------- */

// Answers as published on /shipping, /install and /tires-shipped, kept short.
const FAQ = [
  {
    q: "How much does shipping cost?",
    a: `Nothing. Shipping is free to any address in ${BUSINESS.shipping.area}, with no order minimum. Ship-to-store at our ${BUSINESS.shop.city} shop is free too.`,
  },
  {
    q: "How long will my tires take to arrive?",
    a: "Checkout shows the delivery estimate for your order once your address is entered, because transit depends on which distributor warehouse has your size and how far it has to travel. We would rather show you a real estimate than print a promise on a page that cannot know your ZIP code.",
  },
  {
    q: "Do you ship to Alaska, Hawaii or outside the US?",
    a: `Our standard shipping covers ${BUSINESS.shipping.area}. That leaves out Alaska, Hawaii and US territories. If you are outside that, call ${BUSINESS.phone} before ordering and we will tell you honestly whether we can get your order there.`,
  },
  {
    q: "Do you install tires outside South Florida?",
    a: "No. Our installation, at the Sunrise shop or by mobile van, covers Miami-Dade, Broward and Palm Beach counties only. Everywhere else we ship, and a local shop of your choosing does the fitting.",
  },
  {
    q: "Does ship to store really cost nothing?",
    a: `Yes. Shipping to the ${BUSINESS.shop.city} shop is free, the same as shipping to any address in ${BUSINESS.shipping.area}. You still pay for the tires and, separately, for the installation when you come in.`,
  },
  {
    q: "Can the van install them at my house instead?",
    a: `If you are in the local install area, yes. The mobile van covers ${SERVICE_AREA_LABEL}, decided by the ZIP code of the address.`,
  },
  {
    q: "Can I return tires?",
    a: "Unused, unmounted tires in their original condition can go back once we've authorized the return, so call before you send anything. A mounted tire can't be returned. The full policy is in Returns & Refunds.",
  },
];

function Faq() {
  return (
    <Section id="faq" data-home-section="faq" className="bg-bone">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div data-reveal className="lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start">
          <SectionHead
            eyebrow="FAQ"
            title="Questions before you order"
            lede="The short answers. Shipping, install and returns each have a page with the full detail."
          />
          <div className="-mt-2 flex flex-wrap gap-2 md:-mt-6">
            <Link to="/shipping" className="btn-outline btn-sm min-h-[44px]">
              Shipping
            </Link>
            <Link to="/install" className="btn-outline btn-sm min-h-[44px]">
              Ship to store
            </Link>
            <Link to="/terms#returns" className="btn-outline btn-sm min-h-[44px]">
              Returns &amp; Refunds
            </Link>
            <Link to="/contact" className="btn-outline btn-sm min-h-[44px]">
              Contact
            </Link>
          </div>
        </div>

        {/* <details>: opens and closes without JavaScript. */}
        <div data-reveal className="divide-y divide-ink/10 border-y border-ink/10">
          {FAQ.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-[1.0625rem] font-bold leading-snug tracking-[-0.012em] text-ink transition-colors hover:text-drop md:text-[1.15rem] [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fog text-drop transition-[transform,background-color] duration-200 group-open:rotate-180 group-open:bg-sky">
                  <ChevronDown size={18} aria-hidden />
                </span>
              </summary>
              <p className="-mt-1 pb-5 pr-12 text-sm leading-relaxed text-smoke">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* --------------------------------- Final CTA ------------------------------ */

function FinalCta() {
  return (
    <section
      data-home-section="cta"
      className="section relative overflow-hidden bg-ink-wash text-bone"
    >
      <Hairline />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[360px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-volt/10 blur-3xl"
      />
      <div
        data-reveal
        className="wrap relative flex flex-col items-center gap-6 text-center"
      >
        <PackageCheck size={34} aria-hidden className="text-volt" />
        <h2 className="h2 max-w-2xl text-balance">
          Find your size and pick your delivery
        </h2>
        <p className="lede max-w-xl text-bone/65">
          Search the catalog, add a set to your cart, and choose shipping or
          free ship-to-store at checkout. Questions on fitment? Call us.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/tires" className="btn-primary min-h-[48px]">
            Shop Tires
            <ArrowRight size={17} aria-hidden />
          </Link>
          <a href={BUSINESS.phoneHref} className="btn-ghost-light min-h-[48px]">
            <Phone size={17} aria-hidden />
            Call {BUSINESS.phone}
          </a>
        </div>
        <p className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-[0.09em] text-bone/60">
          <CircleDollarSign size={14} aria-hidden />
          {BUSINESS.poweredBy}
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------- Page ---------------------------------- */

export default function HomePage() {
  const ref = useRef(null);
  useScrollReveal(ref);

  return (
    <>
      <Seo
        title="Tires & Wheels Shipped Nationwide (48 states + DC)"
        description={`Online tire and wheel store shipping free to the 48 contiguous states and DC, or to our South Florida shop, where we install from $${INSTALL.priceFrom} ${INSTALL.priceUnit}.`}
      />
      {/* A plain wrapper for the reveal hook to search; no layout of its own. */}
      <div ref={ref} className="contents">
        <Hero />
        <TrustBar />
        <Shop />
        <HowItWorks />
        <InstallBand />
        <ToolsBand />
        <Learn />
        <Nationwide />
        <Faq />
        <FinalCta />
      </div>
    </>
  );
}
