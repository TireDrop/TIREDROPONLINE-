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
  LOCAL_DELIVERY_AREAS_URL,
  LOCAL_DELIVERY_RADIUS_MILES,
  LOCAL_DELIVERY_ZIPS_URL,
  areaForZip,
  isContiguous,
  isZipInZone,
  nearestHubIndex,
  nearestHubMiles,
  projectLower48,
  zoneGapMiles,
} from "../../data/localDelivery.js";
import {
  POSITION_OPTIONS,
  deniedThisSession,
  fetchApproxLocation,
  geoPermissionState,
  looksLikeIOS,
  rememberDenied,
} from "../../lib/geoLocate.js";
import { approxPlace, lookupPlace } from "../../lib/placeName.js";
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
 *
 * The map is a plain SVG in the prerendered HTML. Once the page is idle in
 * a browser, src/components/delivery/deliveryTrucks.js is imported to add the
 * simulated trucks, the area zoom and tap-to-explore on top of it; nothing
 * about it is needed to read the map or check a ZIP.
 */

export const IN_ZONE_MESSAGE =
  "You're in a local delivery zone. Local delivery is rolling out; order now and we ship free while it launches.";

/** Added after the in-zone answer; the map sends a simulated truck to a house in that zone. */
export const TRUCK_LINE = "A truck is heading to a house near you.";

export const LOCAL_FAQ = [
  {
    q: "Is local delivery available now?",
    a: `Not yet. Local delivery is rolling out from our distribution partner's hubs, and we haven't set a start date. Until it launches, every order ships free to ${BUSINESS.shipping.area}, the same as today.`,
  },
  {
    q: "How do I know if I'm in a zone?",
    a: "When the page opens, we check the approximate location of your connection, and your device location if you allow it, and show the city or neighborhood we think you're near. You can also enter any ZIP above or tap Use my location. We compare the location with the area around each hub on the map, in your browser. If you allow your device location, its approximate position (rounded to about 100 meters) is sent once to BigDataCloud, a mapping service, to look up the name of your neighborhood or city, and that name is shown only to you. We don't store it. The zones are a working estimate and may change before launch.",
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

/** What the checker does with location, shown under it. Keep it true to ZoneChecker and api/_lib/geo.js. */
export const LOCATION_NOTE =
  "We use your approximate location from your connection, or your device location if you allow it, only to check your zone and name your city or neighborhood. A device location is sent once, rounded to about 100 meters, to BigDataCloud to look up that name. We don't store any of it.";

const MAP_LABEL = `Map of the U.S. showing ${MAP.hubs.length} local delivery hubs`;

// A map pin whose tip sits on (0, 0).
const PIN =
  "M0 0C-1.6-4.6-7-8.3-7-13.2a7 7 0 1 1 14 0C7-8.3 1.6-4.6 0 0Z";

/** Runs `fn` once the page has loaded and the browser is idle; returns a cancel. Browser only. */
function afterIdle(fn) {
  let handle = 0;
  let cancelled = false;
  const run = () => {
    if (cancelled) return;
    if (typeof window.requestIdleCallback === "function") {
      handle = window.requestIdleCallback(fn, { timeout: 2500 });
    } else {
      handle = window.setTimeout(fn, 300);
    }
  };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", run);
    if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(handle);
    window.clearTimeout(handle);
  };
}

/**
 * The hub map and its legend. One text alternative on the <svg>; every pin
 * and halo is decorative. Pins are drawn at a fixed screen size rather than
 * map scale (the --pin factor grows them as the map shrinks, and --zoom,
 * which the live layer sets, shrinks them back as it zooms in), so they stay
 * readable at 360px without crowding the map at 1440. Strokes follow --zoom
 * the same way.
 *
 * `focus` is the zoom request from the ZIP checker (see ZoneChecker):
 * undefined before any answer, null to show the whole map, else
 * { x, y, hub, inZone, reveal }. It is handed to the live layer once that has
 * loaded, or the moment it does.
 */
function HubMap({ focus }) {
  const host = useRef(null);
  const svg = useRef(null);
  const note = useRef(null);
  const live = useRef(null);
  const wanted = useRef(focus);

  useEffect(() => {
    wanted.current = focus;
    if (focus !== undefined) live.current?.focus(focus);
  }, [focus]);

  // After idle, in the browser only: load the trucks. A failure leaves the
  // static map exactly as it was prerendered.
  useEffect(() => {
    const abort = new AbortController();
    const cancel = afterIdle(() => {
      import("../../components/delivery/deliveryTrucks.js")
        .then(({ mountTrucks }) =>
          abort.signal.aborted
            ? null
            : mountTrucks({ svg: svg.current, host: host.current, note: note.current, map: MAP, signal: abort.signal }),
        )
        .then((controller) => {
          if (!controller) return;
          if (abort.signal.aborted) return controller.destroy();
          live.current = controller;
          if (wanted.current !== undefined) controller.focus(wanted.current);
        })
        .catch(() => {});
    });
    return () => {
      abort.abort();
      cancel();
      live.current?.destroy();
      live.current = null;
    };
  }, []);

  return (
    <>
      <div ref={host} className="relative">
        <svg
          ref={svg}
          viewBox={MAP.viewBox}
          role="img"
          aria-label={MAP_LABEL}
          className="block h-auto w-full [--pin:1.5] sm:[--pin:1.3] lg:[--pin:1.2]"
        >
          <path d={MAP.land} className="fill-ink/[0.07]" />
          <path
            d={MAP.borders}
            fill="none"
            strokeLinejoin="round"
            style={{ strokeWidth: "calc(1.25px * var(--zoom, 1))" }}
            className="stroke-bone"
          />
          <g aria-hidden="true">
            {MAP.hubs.map((h) => (
              <circle
                key={`h${h.x},${h.y}`}
                data-halo=""
                cx={h.x}
                cy={h.y}
                r={MAP.haloRadius}
                style={{ strokeWidth: "calc(0.75px * var(--zoom, 1))" }}
                className="fill-drop/[0.12] stroke-drop/30"
              />
            ))}
          </g>
          <g aria-hidden="true">
            {MAP.hubs.map((h) => (
              <g
                key={`p${h.x},${h.y}`}
                style={{
                  transform: `translate(${h.x}px, ${h.y}px) scale(calc(var(--pin) * var(--zoom, 1)))`,
                }}
              >
                <path d={PIN} strokeWidth={1.25} className="fill-drop stroke-bone" />
                <circle cy={-13.2} r={2.6} className="fill-bone" />
              </g>
            ))}
          </g>
        </svg>
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-ink/10 px-1 pt-3 text-sm text-smoke">
        <span className="flex items-center gap-2">
          <LegendPin />
          Local delivery hub
        </span>
        <span className="flex items-center gap-2">
          <LegendHalo />
          Approximate zone, not final
        </span>
        {/* Room for the live layer's legend line, held from the first paint so
            it arriving after load moves nothing: two lines on a phone, one
            from sm up, more when reduced motion swaps in the longer line.
            Empty (and invisible) until then, and for good without JavaScript. */}
        <p
          ref={note}
          className="invisible flex min-h-[2.5rem] basis-full flex-wrap items-center gap-x-2 sm:min-h-[1.25rem] motion-reduce:min-h-[3.75rem] sm:motion-reduce:min-h-[2.5rem]"
        />
      </figcaption>
    </>
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
function onceLoader(url, valid) {
  let promise = null;
  return () => {
    promise ??= fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${url} ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!valid(data)) throw new Error(`${url} shape`);
        return data;
      })
      .catch((e) => {
        promise = null;
        throw e;
      });
    return promise;
  };
}
const loadZones = onceLoader(LOCAL_DELIVERY_ZIPS_URL, (d) => d && typeof d.zips === "object");
// The ZIP-prefix centroids for the map's area zoom. Optional: without them the
// answer is the same, just without the zoom and the "miles away" line.
const loadAreas = onceLoader(LOCAL_DELIVERY_AREAS_URL, (d) => d && typeof d.areas === "string");

/**
 * The answer for a typed (or approximate) ZIP: in or out of a zone from the
 * zone list, plus, when the prefix is in the contiguous states, where to zoom
 * the map and how far the nearest zone is. Rejects only when the zone list
 * cannot be loaded.
 */
async function answerZip(zip, extra) {
  const [zones, areas] = await Promise.all([loadZones(), loadAreas().catch(() => null)]);
  const inZone = isZipInZone(zip, zones);
  const area = areaForZip(zip, areas);
  return {
    kind: inZone ? "in" : "out",
    zip,
    ...extra,
    gap: !inZone && area ? area.gap : null,
    focus: area ? { x: area.x, y: area.y, hub: area.hub, inZone } : null,
  };
}

/** The answer for exact coordinates (a device position, or the connection's approximate one). */
function answerCoords(lat, lng, extra) {
  const miles = nearestHubMiles(lat, lng, MAP.hubs);
  const inZone = miles <= LOCAL_DELIVERY_RADIUS_MILES;
  const at = isContiguous(lat, lng) ? projectLower48(lat, lng) : null;
  const hub = nearestHubIndex(lat, lng, MAP.hubs);
  return {
    kind: inZone ? "in" : "out",
    ...extra,
    gap: !inZone && at ? zoneGapMiles(miles) : null,
    focus: at && hub >= 0 ? { x: at[0], y: at[1], hub, inZone } : null,
  };
}

const linkClass =
  "inline-flex min-h-[44px] items-center gap-1 font-display font-bold text-drop hover:text-dive";

/**
 * The words in front of an answer: where the location came from, and, for a
 * connection or device answer, the place name (plain text, never a ZIP). A
 * typed ZIP is the only answer that shows a ZIP, because the visitor typed it.
 */
function lead({ source, zip, place }) {
  if (source === "approx")
    return place ? (
      <>Based on your connection, you&rsquo;re near {place}: </>
    ) : (
      <>Based on your connection, here&rsquo;s what we see near you: </>
    );
  if (source === "device")
    return place ? <>Using your device location, you&rsquo;re near {place}: </> : <>Using your device location: </>;
  return zip ? (
    <>
      <strong>{zip}</strong>:{" "}
    </>
  ) : null;
}

/** "… isn't in a local delivery zone yet", worded for where the location came from. */
function notInZone({ source, zip, place }) {
  if (source === "approx")
    return <>{lead({ source, place })}that area isn&rsquo;t</>;
  if (source === "device") return <>{lead({ source, place })}you aren&rsquo;t</>;
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
            {IN_ZONE_MESSAGE} {TRUCK_LINE}
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
          {notInZone(result)} in a local delivery zone yet.{" "}
          {result.gap ? `Nearest delivery zone is about ${result.gap} miles away. ` : ""}
          Tires still ship free to any street address in {BUSINESS.shipping.area}.
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
 * prefilled and answered, labelled as approximate and worded with the city
 * and state it came from, not the ZIP. Then the precise device
 * location replaces it: straight away when the visitor already allowed it,
 * or by asking once the approximate answer is up. The device answer appears at
 * once; its place name (neighborhood and city, from a reverse geocode of the
 * rounded position, see lib/placeName.js) fills in when it arrives, and the
 * answer simply stays without one if that fails. A "no" is remembered for
 * the session and never shown as an error; "Use my location" stays as the
 * manual way in, and explains how to turn location back on. Nothing
 * automatic happens once the visitor types or checks something, or when the
 * URL already carries ?zip=.
 *
 * Without JavaScript the form submits as a GET back to this page; once the
 * page hydrates, a ?zip= in the URL is checked, so a submit made before
 * hydration still gets its answer.
 */
function ZoneChecker({ onFocus }) {
  const id = useId();
  const hydrated = useHydrated();
  const [result, setResult] = useState(null);
  const latest = useRef(0);
  // Set by any typing, submit or click: from then on the visitor leads and
  // the automatic checks stay quiet.
  const touched = useRef(false);
  const zipInput = useRef(null);
  // The latest map callback, read by the one-time effects below.
  const focusMap = useRef(onFocus);
  useEffect(() => {
    focusMap.current = onFocus;
  }, [onFocus]);
  const canLocate =
    hydrated && typeof navigator !== "undefined" && "geolocation" in navigator;

  // Shows an answer and tells the map where to look. Only a real answer moves
  // the map: "in" and "out" zoom to the area (or back out when there is no
  // area to show, as for Alaska); a bad ZIP clears the pin. Loading, errors
  // and a refused location leave the map as it is. A visitor-led check also
  // brings the map into view if it is off-screen.
  // (A ref, so the one-time effects below can call it without re-running.)
  const show = useRef((r) => {
    setResult(r);
    if (r.kind === "in" || r.kind === "out")
      focusMap.current(r.focus ? { ...r.focus, reveal: touched.current } : null);
    else if (r.kind === "invalid") focusMap.current(null);
  });

  // The device answer (zone, zoom and pin) shows at once, from the position
  // and the hub list in the browser. Then, for this answer only, the place
  // name is looked up and added to its first words; nothing is kept.
  const showDevice = ({ latitude, longitude }) => {
    show.current(answerCoords(latitude, longitude, { source: "device" }));
    const ticket = latest.current;
    lookupPlace(latitude, longitude).then((place) => {
      if (!place || ticket !== latest.current) return;
      setResult((r) => (r?.source === "device" && (r.kind === "in" || r.kind === "out") ? { ...r, place } : r));
    });
  };

  const checkZip = (raw) => {
    const ticket = ++latest.current;
    const zip = zip5(raw);
    if (!zip) return show.current({ kind: "invalid" });
    setResult({ kind: "loading" });
    answerZip(zip).then(
      (r) => ticket === latest.current && show.current(r),
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
          showDevice(coords);
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
      const place = approxPlace(approx.city, approx.region);
      if (!approx.zip) {
        show.current(answerCoords(approx.lat, approx.lng, { source: "approx", place }));
        return;
      }
      const answer = await answerZip(approx.zip, { source: "approx", place });
      if (quiet() || precise) return;
      if (zipInput.current && !zipInput.current.value) zipInput.current.value = approx.zip;
      show.current(answer);
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
        showDevice(coords);
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

      {/* Room for the longest automatic answer (approximate, out of zone, with
          the distance to the nearest zone) is reserved up front, so an answer
          that arrives on its own after load moves nothing below it. Heights
          measured per width, a line (23px) per step as the text wraps; the
          card is narrowest at lg, beside the map. Includes a device answer
          whose place name ("Neighborhood, City, ST", up to about 60
          characters) arrives a moment after it. */}
      <div
        id={`${id}-result`}
        aria-live="polite"
        className="mt-2 min-h-[14.25rem] text-sm leading-relaxed min-[400px]:min-h-[13rem] min-[430px]:min-h-[11.5rem] min-[500px]:min-h-[10rem] sm:min-h-[7.25rem] lg:min-h-[12.75rem] xl:min-h-[11.5rem]"
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
  // Where the map should look, set by the ZIP checker (see HubMap).
  const [focus, setFocus] = useState(undefined);
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
            <HubMap focus={focus} />
          </figure>
          <ZoneChecker onFocus={setFocus} />
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
