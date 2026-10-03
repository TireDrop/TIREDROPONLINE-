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
import {
  POSITION_OPTIONS,
  deniedThisSession,
  fetchApproxLocation,
  geoPermissionState,
  looksLikeIOS,
  rememberDenied,
} from "../../lib/geoLocate.js";
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
    a: "When the page opens, we check the approximate location of your connection, and your device location if you allow it. You can also enter any ZIP above or tap Use my location. We compare it with the area around each hub on the map. The zones are a working estimate and may change before launch.",
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

/** What the checker does with location, shown under it. Keep it true to ZoneChecker and api/geo.js. */
export const LOCATION_NOTE =
  "We use your approximate location from your connection, or your device location if you allow it, only to check your zone. We don't store it.";

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

/** The words in front of an answer: where the location came from. */
function lead({ source, zip, city }) {
  if (source === "approx")
    return zip ? (
      <>
        Based on your connection, you&rsquo;re near ZIP <strong>{zip}</strong>:{" "}
      </>
    ) : (
      <>Based on your connection{city ? `, you’re near ${city}` : ""}: </>
    );
  if (source === "device") return <>Using your device location: </>;
  return zip ? (
    <>
      <strong>{zip}</strong>:{" "}
    </>
  ) : null;
}

/** "… isn't in a local delivery zone yet", worded for where the location came from. */
function notInZone({ source, zip }) {
  if (source === "approx")
    return <>{lead({ source, zip })}that area isn&rsquo;t</>;
  if (source === "device") return <>{lead({ source })}you aren&rsquo;t</>;
  return (
    <>
      <strong>{zip}</strong> isn&rsquo;t
    </>
  );
}

function Result({ result }) {
  if (!result) return null;
  const { kind } = result;
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
        Location access is off for this site.{" "}
        {result.ios ? (
          <>
            To turn it on, open Settings &gt; Privacy &amp; Security &gt;
            Location Services &gt; Safari Websites, then try again.
          </>
        ) : (
          <>
            To turn it on, select the site settings (lock) icon in the address
            bar, allow Location, then try again.
          </>
        )}{" "}
        Or enter your ZIP.
      </p>
    );
  if (kind === "geo-error")
    return (
      <p className="text-smoke">
        We couldn&rsquo;t get your location. Enter your ZIP instead.
      </p>
    );
  if (kind === "in")
    return (
      <div className="flex items-start gap-2 text-ink">
        <Check size={16} aria-hidden className="mt-0.5 shrink-0 text-drop" />
        <div>
          <p>
            {lead(result)}
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
          {notInZone(result)} in a local delivery zone yet. Tires still ship
          free to any street address in {BUSINESS.shipping.area}.
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
 * "Is my ZIP in a zone?" A typed ZIP is checked in the browser against
 * public/data/local-delivery-zips.json; a device position is compared with
 * the hub coordinates in the browser too.
 *
 * On load, without asking: GET /api/geo gives the approximate location of
 * the visitor's connection (Vercel's IP headers), and a U.S. ZIP from it is
 * prefilled and answered, labelled as approximate. Then the precise device
 * location replaces it: straight away when the visitor already allowed it,
 * or by asking once the approximate answer is up. A "no" is remembered for
 * the session and never shown as an error; "Use my location" stays as the
 * manual way in, and explains how to turn location back on. Nothing
 * automatic happens once the visitor types or checks something, or when the
 * URL already carries ?zip=.
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
  // Set by any typing, submit or click: from then on the visitor leads and
  // the automatic checks stay quiet.
  const touched = useRef(false);
  const zipInput = useRef(null);
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

  const coordsResult = (lat, lng, extra) => ({
    kind: inZoneByCoords(lat, lng, MAP.hubs) ? "in" : "out",
    ...extra,
  });

  // Once, on mount: the URL a pre-hydration submit landed on. Deferred a
  // tick so the answer renders after hydration, not inside it.
  useEffect(() => {
    const zip = new URLSearchParams(window.location.search).get("zip");
    if (!zip) return undefined;
    const t = setTimeout(() => checkZip(zip));
    return () => clearTimeout(t);
  }, []);

  // Once, on mount: the automatic check (see the comment above).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("zip")) return undefined;
    let cancelled = false;
    let precise = false; // a device answer is showing; the approximate one never replaces it
    const quiet = () => cancelled || touched.current;

    const locateQuietly = () => {
      if (quiet() || precise || !("geolocation" in navigator) || deniedThisSession(window)) return;
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          if (quiet()) return;
          precise = true;
          ++latest.current;
          setResult(coordsResult(coords.latitude, coords.longitude, { source: "device" }));
        },
        // A "no" keeps whatever is showing; it isn't an error to the visitor.
        (err) => err?.code === 1 && rememberDenied(window),
        POSITION_OPTIONS,
      );
    };

    const permission = geoPermissionState(navigator);
    permission.then((state) => state === "granted" && locateQuietly());

    const showApprox = async (approx) => {
      if (!approx || quiet() || precise) return;
      if (!approx.zip) {
        setResult(coordsResult(approx.lat, approx.lng, { source: "approx", city: approx.city }));
        return;
      }
      const data = await loadZones();
      if (quiet() || precise) return;
      if (zipInput.current && !zipInput.current.value) zipInput.current.value = approx.zip;
      setResult({ kind: isZipInZone(approx.zip, data) ? "in" : "out", zip: approx.zip, source: "approx" });
    };

    fetchApproxLocation()
      .then(showApprox)
      .catch(() => {}) // zone list failed: say nothing until the visitor asks
      .then(() => permission)
      .then((state) => state === "prompt" && locateQuietly());

    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    touched.current = true;
    checkZip(new FormData(e.currentTarget).get("zip"));
  };

  const locate = () => {
    touched.current = true;
    const ticket = ++latest.current;
    setResult({ kind: "loading" });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (ticket !== latest.current) return;
        setResult(coordsResult(coords.latitude, coords.longitude, { source: "device" }));
      },
      (err) => {
        if (ticket !== latest.current) return;
        if (err?.code === 1) {
          rememberDenied(window);
          setResult({ kind: "denied", ios: looksLikeIOS(navigator) });
        } else {
          setResult({ kind: "geo-error" });
        }
      },
      POSITION_OPTIONS,
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
            ref={zipInput}
            id={`${id}-zip`}
            name="zip"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={10}
            placeholder="e.g. 85004"
            className="field"
            aria-describedby={`${id}-result`}
            onInput={() => {
              touched.current = true;
            }}
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

      {/* Room for the longest automatic answer (approximate, out of zone)
          is reserved up front, so an answer that arrives on its own after
          load moves nothing below it. Heights measured per breakpoint; the
          card is narrowest at lg, beside the map. */}
      <div
        id={`${id}-result`}
        aria-live="polite"
        className="mt-2 min-h-[10rem] text-sm leading-relaxed sm:min-h-[7.25rem] md:min-h-[5.75rem] lg:min-h-[10rem] xl:min-h-[8.75rem]"
      >
        <Result result={result} />
      </div>

      <p className="mt-4 border-t border-ink/10 pt-3 text-xs leading-relaxed text-smoke">
        {LOCATION_NOTE}
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
