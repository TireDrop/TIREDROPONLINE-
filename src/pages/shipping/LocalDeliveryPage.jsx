import React, { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronRight,
  LocateFixed,
  MapPin,
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
import { SERVICE_AREA_LABEL, zip5 } from "../../data/serviceArea.js";
import {
  LOCAL_DELIVERY_ZIPS_URL,
  inZoneByCoords,
  isZipInZone,
} from "../../data/localDelivery.js";
import { useHydrated } from "../../lib/useHydrated.js";
// Positions only (x, y, lat, lng): the hub list with its city names stays in
// deliveryHubs.source.json and never reaches the browser.
import MAP from "../../data/deliveryHubs.generated.json";

/*
 * /local-delivery: where local delivery from our distribution partner's hubs
 * is coming. Icons only: no hub addresses, cities, phone numbers or partner
 * name, and no dates, speeds or fees, because none of it is confirmed yet
 * (docs/integrations/atd.md, "Still unconfirmed"). Free shipping and the
 * South Florida install area are unchanged, and the page says so.
 */

export const IN_ZONE_MESSAGE =
  "You're in a local delivery zone. Local delivery is rolling out; order now and we ship free while it launches.";

export const LOCAL_FAQ = [
  {
    q: "Is local delivery available now?",
    a: `Not yet. Local delivery is rolling out from our distribution partner's hubs, and we haven't set a start date. Until it launches, every order ships free to ${BUSINESS.shipping.area}, the same as today.`,
  },
  {
    q: "How do I know if I'm in a zone?",
    a: "Enter your ZIP above, or use your location. We check it against the area around each hub on the map. The zones are a working estimate and may change before launch.",
  },
  {
    q: "What happens if I order before it launches?",
    a: "Your order ships free, like every order today, and we email tracking once the carrier has it. Nothing about ordering or checkout changes.",
  },
  {
    q: "Can you install my tires in a delivery zone?",
    a: `Our installation stays in ${SERVICE_AREA_LABEL}, at our shop or with the mobile van. Anywhere else, any shop that mounts customer-supplied tires can fit them.`,
    link: { to: "/mobile-service", label: "Mobile installation in South Florida" },
  },
];

const MAP_LABEL = `Map of the U.S. showing ${MAP.hubs.length} local delivery hubs`;

// A map pin whose tip sits on (0, 0).
const PIN =
  "M0 0C-1.6-4.6-7-8.3-7-13.2a7 7 0 1 1 14 0C7-8.3 1.6-4.6 0 0Z";

/**
 * The hub map. One text alternative on the <svg>; every pin and halo is
 * decorative. Pins are drawn at a fixed screen size rather than map scale
 * (the --pin factor grows them as the map shrinks), so they stay readable at
 * 360px without crowding the map at 1440.
 */
function HubMap() {
  return (
    <svg
      viewBox={MAP.viewBox}
      role="img"
      aria-label={MAP_LABEL}
      className="block h-auto w-full [--pin:1.5] sm:[--pin:1.3] lg:[--pin:1.2]"
    >
      <path d={MAP.land} className="fill-ink/[0.07]" />
      <path
        d={MAP.borders}
        fill="none"
        strokeWidth={1.25}
        strokeLinejoin="round"
        className="stroke-bone"
      />
      <g aria-hidden="true">
        {MAP.hubs.map((h) => (
          <circle
            key={`h${h.x},${h.y}`}
            cx={h.x}
            cy={h.y}
            r={MAP.haloRadius}
            className="fill-drop/[0.12] stroke-drop/30"
            strokeWidth={0.75}
          />
        ))}
      </g>
      <g aria-hidden="true">
        {MAP.hubs.map((h) => (
          <g
            key={`p${h.x},${h.y}`}
            style={{ transform: `translate(${h.x}px, ${h.y}px) scale(var(--pin))` }}
          >
            <path d={PIN} strokeWidth={1.25} className="fill-drop stroke-bone" />
            <circle cy={-13.2} r={2.6} className="fill-bone" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** The two legend swatches, drawn like the map's own marks. */
function LegendPin() {
  return (
    <svg viewBox="-10 -22 20 23" width="18" height="18" aria-hidden="true" className="shrink-0">
      <path d={PIN} strokeWidth={1.25} className="fill-drop stroke-bone" />
      <circle cy={-13.2} r={2.6} className="fill-bone" />
    </svg>
  );
}
function LegendHalo() {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true" className="shrink-0">
      <circle cx="9" cy="9" r="8" strokeWidth={1} className="fill-drop/[0.12] stroke-drop/30" />
    </svg>
  );
}

/* ------------------------------ ZIP checker ------------------------------ */

// One fetch per visit, and only once someone checks; a failed fetch is
// forgotten so the next try goes back to the network.
let zonePromise = null;
function loadZones() {
  zonePromise ??= fetch(LOCAL_DELIVERY_ZIPS_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`zones ${r.status}`);
      return r.json();
    })
    .then((data) => {
      if (!data || typeof data.zips !== "object") throw new Error("zones shape");
      return data;
    })
    .catch((e) => {
      zonePromise = null;
      throw e;
    });
  return zonePromise;
}

const linkClass =
  "inline-flex min-h-[44px] items-center gap-1 font-display font-bold text-drop hover:text-dive";

function Result({ result }) {
  if (!result) return null;
  const { kind, zip } = result;
  if (kind === "loading") return <p className="text-smoke">Checking…</p>;
  if (kind === "invalid")
    return <p className="text-smoke">Enter a five-digit ZIP code, like 85004.</p>;
  if (kind === "error")
    return (
      <p className="text-smoke">
        We couldn&rsquo;t load the zone list. Check your connection and try again.
      </p>
    );
  if (kind === "denied")
    return (
      <p className="text-smoke">
        Location access is off for this site, so we can&rsquo;t check it. Enter
        your ZIP instead.
      </p>
    );
  if (kind === "geo-error")
    return (
      <p className="text-smoke">
        We couldn&rsquo;t get your location. Enter your ZIP instead.
      </p>
    );
  const who = zip ? <strong>{zip}</strong> : "Your location";
  if (kind === "in")
    return (
      <div className="flex items-start gap-2 text-ink">
        <Check size={16} aria-hidden className="mt-0.5 shrink-0 text-drop" />
        <div>
          <p>
            {zip && (
              <>
                {who}:{" "}
              </>
            )}
            {IN_ZONE_MESSAGE}
          </p>
          <Link to="/tires" className={linkClass}>
            Shop tires
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </div>
    );
  return (
    <div className="flex items-start gap-2 text-ink">
      <X size={16} aria-hidden className="mt-0.5 shrink-0 text-smoke" />
      <div>
        <p>
          {who} isn&rsquo;t in a local delivery zone yet. Tires still ship free
          to any street address in {BUSINESS.shipping.area}.
        </p>
        <Link to="/tires" className={linkClass}>
          Shop tires
          <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
    </div>
  );
}

/**
 * "Is my ZIP in a zone?" The ZIP is checked in the browser against
 * public/data/local-delivery-zips.json; "Use my location" compares the
 * browser's position with the hub coordinates. Nothing is sent anywhere.
 *
 * Without JavaScript the form submits as a GET back to this page; once the
 * page hydrates, a ?zip= in the URL is checked, so a submit made before
 * hydration still gets its answer.
 */
function ZoneChecker() {
  const id = useId();
  const hydrated = useHydrated();
  const [result, setResult] = useState(null);
  const latest = useRef(0);
  const canLocate =
    hydrated && typeof navigator !== "undefined" && "geolocation" in navigator;

  const checkZip = (raw) => {
    const ticket = ++latest.current;
    const zip = zip5(raw);
    if (!zip) return setResult({ kind: "invalid" });
    setResult({ kind: "loading" });
    loadZones().then(
      (data) => {
        if (ticket !== latest.current) return;
        setResult({ kind: isZipInZone(zip, data) ? "in" : "out", zip });
      },
      () => ticket === latest.current && setResult({ kind: "error" }),
    );
  };

  // Once, on mount: the URL a pre-hydration submit landed on. Deferred a
  // tick so the answer renders after hydration, not inside it.
  useEffect(() => {
    const zip = new URLSearchParams(window.location.search).get("zip");
    if (!zip) return undefined;
    const t = setTimeout(() => checkZip(zip));
    return () => clearTimeout(t);
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    checkZip(new FormData(e.currentTarget).get("zip"));
  };

  const locate = () => {
    const ticket = ++latest.current;
    setResult({ kind: "loading" });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (ticket !== latest.current) return;
        const inZone = inZoneByCoords(coords.latitude, coords.longitude, MAP.hubs);
        setResult({ kind: inZone ? "in" : "out" });
      },
      (err) => {
        if (ticket !== latest.current) return;
        setResult({ kind: err?.code === 1 ? "denied" : "geo-error" });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  };

  return (
    <div id="zip-check" className="card scroll-mt-28 p-5 md:p-6">
      <h3 className="h3">Is my ZIP in a zone?</h3>
      <form
        method="get"
        action="/local-delivery"
        onSubmit={onSubmit}
        noValidate
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor={`${id}-zip`} className="label">
            ZIP code
          </label>
          <input
            id={`${id}-zip`}
            name="zip"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={10}
            placeholder="e.g. 85004"
            className="field"
            aria-describedby={`${id}-result`}
          />
        </div>
        <button type="submit" className="btn-dark min-h-[44px] shrink-0">
          <MapPin size={16} aria-hidden />
          Check my ZIP
        </button>
      </form>

      {/* Same height before and after hydration: the button replaces the
          no-JS note in place, so nothing below it moves. */}
      <div className="mt-3 flex min-h-[44px] items-center">
        {canLocate ? (
          <button type="button" onClick={locate} className="btn-outline btn-sm min-h-[44px]">
            <LocateFixed size={16} aria-hidden />
            Use my location
          </button>
        ) : (
          <noscript>
            <p className="text-sm text-smoke">
              The ZIP check runs in your browser and needs JavaScript. Tires
              ship free to {BUSINESS.shipping.area} either way.
            </p>
          </noscript>
        )}
      </div>

      <div id={`${id}-result`} aria-live="polite" className="mt-2 text-sm leading-relaxed">
        <Result result={result} />
      </div>

      <p className="mt-4 border-t border-ink/10 pt-3 text-xs leading-relaxed text-smoke">
        Your ZIP and location are checked in your browser and never sent to us.
      </p>
    </div>
  );
}

/* --------------------------------- page --------------------------------- */

export default function LocalDeliveryPage() {
  return (
    <>
      <Seo
        title="Local Tire Delivery Zones (Rolling Out)"
        description={`Local tire delivery is rolling out near our distribution partner's hubs. Check your ZIP. Until it launches, tires ship free to 48 states + DC.`}
        crumbs={[{ name: "How shipping works", path: "/shipping" }]}
      />
      <Breadcrumbs
        trail={[
          { label: "How Shipping Works", to: "/shipping" },
          { label: "Local Delivery" },
        ]}
      />

      <PageHero
        eyebrow="Local delivery · rolling out"
        title="Local Delivery Is Coming to These Zones"
        lede={`We're adding local delivery around our distribution partner's hubs. Check whether your ZIP is in a zone. Until it launches, every order ships free to ${BUSINESS.shipping.area}, the same as today.`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a href="#zip-check" className="btn-primary">
            <MapPin size={18} aria-hidden />
            Check your ZIP
          </a>
          <Link to="/tires" className="btn-ghost-light">
            <ShoppingCart size={18} aria-hidden />
            Shop Tires
          </Link>
        </div>
      </PageHero>

      {/* ---------- Map + checker ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="The zones"
          title="Local delivery hubs"
          lede="Each pin marks a local delivery hub, and the ring around it shows roughly the area it should reach. Zones may change before launch."
        />
        <div className="-mt-2 grid gap-6 md:-mt-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
          <figure className="card p-3 sm:p-5">
            <HubMap />
            <figcaption className="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-ink/10 px-1 pt-3 text-sm text-smoke">
              <span className="flex items-center gap-2">
                <LegendPin />
                Local delivery hub
              </span>
              <span className="flex items-center gap-2">
                <LegendHalo />
                Approximate zone, not final
              </span>
            </figcaption>
          </figure>
          <ZoneChecker />
        </div>
      </Section>

      {/* ---------- What stays the same ---------- */}
      <Section className="bg-fog">
        <SectionHead eyebrow="Nothing else changes" title="What stays the same" />
        <div className="-mt-2 grid gap-5 md:-mt-6 md:grid-cols-2">
          <div className="card p-6">
            <Truck size={22} aria-hidden className="text-drop" />
            <h3 className="h3 mt-4">Free shipping, in a zone or not</h3>
            <p className="mt-2 text-sm leading-relaxed text-smoke">
              Tires ship free to any street address in {BUSINESS.shipping.area},
              with no order minimum. The details are on{" "}
              <Link to="/shipping" className="text-drop underline hover:text-dive">
                How Shipping Works
              </Link>
              .
            </p>
          </div>
          <div className="card p-6">
            <Wrench size={22} aria-hidden className="text-drop" />
            <h3 className="h3 mt-4">Installation stays in South Florida</h3>
            <p className="mt-2 text-sm leading-relaxed text-smoke">
              We install in {SERVICE_AREA_LABEL}, at our shop or with the
              mobile van. Everywhere else, any shop that mounts customer tires
              can fit them.{" "}
              <Link to="/install" className="text-drop underline hover:text-dive">
                Ship to the store
              </Link>
            </p>
          </div>
        </div>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section className="bg-bone">
        <SectionHead eyebrow="Questions" title="Local delivery, answered" />
        <div className="divide-y divide-ink/10 border-y border-ink/10">
          {LOCAL_FAQ.map((item) => (
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
            <h2 className="h2">Order now, and it ships free</h2>
            <p className="lede mt-3 text-bone/70">
              Local delivery is still rolling out. Your order ships free
              today, and we email tracking once the carrier has it.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:w-auto">
            <Link to="/tires" className="btn-primary">
              <ShoppingCart size={18} aria-hidden />
              Shop Tires
            </Link>
            <Link to="/shipping" className="btn-ghost-light">
              <Truck size={18} aria-hidden />
              How Shipping Works
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
