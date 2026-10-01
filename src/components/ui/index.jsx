import React, {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { BUSINESS, SOCIAL, YELP_PROFILE } from "../../data/business.js";
import { SERVICE_AREA_SCHEMA } from "../../data/serviceArea.js";
import { getCityPage } from "../../data/cityPages.js";
import { getLiveState } from "../../data/stateList.js";
import { getProduct } from "../../data/products.js";
import { getService } from "../../data/services.js";
import { noteFormStart } from "../../data/formGuard.js";

const ORIGIN = `https://${BUSINESS.domain}`;
const OG_IMAGE = `${ORIGIN}/brand/og-tiredrop.jpg`;

/* ------------------------------------------------------------------ *
 * Head-tag plumbing
 *
 * Every tag this component owns carries data-seo, so a route change can
 * overwrite its own tags and leave index.html's untouched. Tags are updated in
 * place rather than removed and re-added — replacing them makes a crawler that
 * snapshots mid-update see a head with no title.
 * ------------------------------------------------------------------ */

function upsertMeta(selector, attrs) {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    document.head.appendChild(tag);
  }
  for (const [k, v] of Object.entries(attrs)) tag.setAttribute(k, v);
}

function upsertLink(rel, href) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
}

function setJsonLd(data) {
  let tag = document.head.querySelector('script[data-seo="ld"]');
  if (!tag) {
    tag = document.createElement("script");
    tag.type = "application/ld+json";
    tag.setAttribute("data-seo", "ld");
    document.head.appendChild(tag);
  }
  tag.textContent = JSON.stringify(data);
}

/* --------------------------- structured data --------------------------- */

const DAY = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};
const DAY_ORDER = Object.values(DAY);

/** "8:00 AM" -> "08:00". Returns null for anything it does not recognise. */
function to24h(text) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(text.trim());
  if (!m) return null;
  let hour = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) hour += 12;
  return `${String(hour).padStart(2, "0")}:${m[2]}`;
}

/**
 * Turns BUSINESS.hours into openingHoursSpecification so the published hours
 * and the marked-up hours cannot drift apart. Anything unparseable is dropped
 * rather than guessed — a wrong opening time in structured data sends somebody
 * to a closed shop.
 */
function openingHours() {
  const out = [];
  for (const row of BUSINESS.hours) {
    const [open, close] = row.time
      .split(/\s*[–-]\s*/)
      .map((t) => to24h(t) ?? "");
    if (!open || !close) continue; // "Closed", or a format we do not know
    const parts = row.days
      .split(/\s*[–-]\s*/)
      .map((d) => DAY[d.slice(0, 3).toLowerCase()]);
    if (parts.some((d) => !d)) continue;
    const days =
      parts.length === 2
        ? DAY_ORDER.slice(
            DAY_ORDER.indexOf(parts[0]),
            DAY_ORDER.indexOf(parts[1]) + 1,
          )
        : parts;
    out.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: days,
      opens: open,
      closes: close,
    });
  }
  return out;
}

/** TireDrop the online storefront. */
function organizationNode() {
  const node = {
    "@type": "Organization",
    "@id": `${ORIGIN}/#organization`,
    name: BUSINESS.name,
    url: ORIGIN,
    description: `${BUSINESS.name} is the online tire and wheel store of ${BUSINESS.parent}, shipping across ${BUSINESS.shipping.area}.`,
    telephone: BUSINESS.phone,
    logo: {
      "@type": "ImageObject",
      url: `${ORIGIN}/brand/tiredrop-full.png`,
      width: 440,
      height: 444,
    },
    image: OG_IMAGE,
    parentOrganization: { "@id": `${ORIGIN}/#shop` },
  };
  // Each is emitted only once the client has confirmed it (see
  // src/data/business.js): the email is confirmed, the registered name is not
  // yet. An invented registered name or contact address in structured data is
  // the kind of detail a distributor's reviewer checks against the application.
  if (BUSINESS.legalName) node.legalName = BUSINESS.legalName;
  if (BUSINESS.email) node.email = BUSINESS.email;
  return node;
}

/**
 * BUSINESS.geo ("26.1xxxxx, -80.2xxxxx", as Google Maps copies a pin) as
 * GeoCoordinates, or null. Null while the pin is unset, and also when it does
 * not read as two numbers inside South Florida: swapped order or a dropped
 * minus sign would otherwise publish a point in the ocean or in Asia.
 * scripts/schema-check.mjs fails the build check in that case, so a bad paste
 * is caught rather than silently skipped.
 */
function geoFor(pin) {
  if (typeof pin !== "string") return null;
  const parts = pin.split(",").map((s) => s.trim());
  if (parts.length !== 2 || parts.some((s) => !/^-?\d+(\.\d+)?$/.test(s)))
    return null;
  const [latitude, longitude] = parts.map(Number);
  // South Florida, generously: the Keys to Palm Beach, the Gulf to the coast.
  if (latitude < 24.3 || latitude > 27.3) return null;
  if (longitude < -82.2 || longitude > -79.8) return null;
  return { "@type": "GeoCoordinates", latitude, longitude };
}

/**
 * The Sunrise shop. This is the local business: it holds the address, the
 * hours and the service area, and it is the parent of the TireDrop brand.
 * AutoPartsStore covers the retail side, AutoRepair the bay work — both are
 * LocalBusiness subtypes Google recognises, and the shop genuinely does both.
 */
function shopNode() {
  const geo = geoFor(BUSINESS.geo);
  return {
    "@type": ["AutoPartsStore", "AutoRepair"],
    "@id": `${ORIGIN}/#shop`,
    name: BUSINESS.parent,
    alternateName: BUSINESS.shop.name,
    url: `${ORIGIN}/locations`,
    telephone: BUSINESS.phone,
    image: OG_IMAGE,
    hasMap: BUSINESS.mapsHref,
    // The map pin, once Justin's is pasted into BUSINESS.geo. Until then the
    // key is left out entirely, never published as null or as a guess from
    // the street address.
    ...(geo ? { geo } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.shop.street,
      addressLocality: BUSINESS.shop.city,
      addressRegion: BUSINESS.shop.state,
      postalCode: BUSINESS.shop.zip,
      addressCountry: "US",
    },
    openingHoursSpecification: openingHours(),
    // Miami-Dade, Broward and Palm Beach counties (src/data/serviceArea.js).
    areaServed: SERVICE_AREA_SCHEMA.map((area) => ({ ...area })),
    // The shop's own confirmed profiles (src/data/business.js). The Google
    // Business Profile joins them once its URL is confirmed. They are the
    // shop's profiles, not TireDrop's, so they sit here and not on the
    // TireDrop Organization: sameAs means "the same entity".
    sameAs: [YELP_PROFILE.url, SOCIAL.facebook].filter(Boolean),
    // No priceRange: there is no honest single band for a shop that sells
    // anything from a tire repair to a set of performance wheels.
    // No aggregateRating, no review and no foundingDate. This site publishes
    // no reviews of its own — it links to the shop's Google and Yelp profiles
    // instead — and marking up reviews or ratings it does not hold breaches
    // Google's structured-data policy. The founding year is left out until
    // the owner confirms it.
  };
}

/**
 * The shop as a plain Organization, for pages that are not about the shop.
 * TireDrop's parentOrganization and a service's provider point at #shop on
 * every page, and a reference has to land on a node on the same page. This
 * one carries no address or hours on purpose: a LocalBusiness belongs on the
 * pages about the shop (SHOP_ROUTES), and a LocalBusiness without its
 * address is an invalid item in Google's eyes.
 */
function shopStubNode() {
  return {
    "@type": "Organization",
    "@id": `${ORIGIN}/#shop`,
    name: BUSINESS.parent,
    url: `${ORIGIN}/locations`,
    sameAs: [YELP_PROFILE.url, SOCIAL.facebook].filter(Boolean),
  };
}

/**
 * Routes that render at 200 but must never be indexed. A cart and a checkout
 * are empty for every crawler and have nothing to rank; listing them here
 * rather than passing a prop from each page keeps the decision in one place.
 * Product and service pages noindex themselves when the slug matches nothing
 * (see graphFor), so they are not listed here.
 */
const NOINDEX_ROUTES = ["/cart", "/checkout", "/track"];

/** Routes where the physical shop, not the web store, is the subject. */
const SHOP_ROUTES = [
  "/",
  "/locations",
  "/contact",
  "/install",
  "/auto-service",
  "/mobile-service",
  "/schedule",
];

/** /mobile-service/<city>: the mobile city pages (src/data/cityPages.js). */
const CITY_ROUTE = /^\/mobile-service\/([^/]+)$/;

/** /tires-shipped/<state>: the state shipping pages (src/data/stateList.js). */
const STATE_ROUTE = /^\/tires-shipped\/([^/]+)$/;

/** Exact SHOP_ROUTES, plus every city page that exists. */
function isShopRoute(pathname) {
  if (SHOP_ROUTES.includes(pathname)) return true;
  const city = CITY_ROUTE.exec(pathname);
  return Boolean(city && getCityPage(city[1]));
}

/* ------------------------------------------------------------------ *
 * Offers: deliberately off.
 *
 * An Offer node is a machine-readable commitment — this price, this
 * availability, buyable now — and it is what feeds Google's free product
 * listings. None of those hold yet: data/products.js is a representative
 * catalog rather than live distributor inventory, with no stock counts at all.
 * Publishing price and availability as fact would promise inventory nobody
 * has confirmed.
 *
 * So while this is false, no Product node is emitted at all. Google requires
 * one of offers, review or aggregateRating on a Product; without them it is
 * reported as an invalid item in Search Console and earns no rich result, and
 * the only one of the three this site could honestly add is the offer. The
 * product pages keep their WebPage and BreadcrumbList.
 *
 * WHEN ATD OR U.S. AUTOFORCE PRICING AND INVENTORY ARE LIVE: set this true and
 * the Product, with its offer, starts shipping. Do not flip it before then.
 * `npm run check:schema` checks every Product it finds carries an offer with
 * a price and currency.
 * ------------------------------------------------------------------ */
const EMIT_OFFERS = false;

function productNode(product, url) {
  const name = `${product.brand} ${product.model}`;
  const isTire = product.kind === "tire";
  const size = isTire
    ? product.size
    : `${product.diameter}x${product.wheelWidth} ${product.boltPattern}`;

  const node = {
    "@type": "Product",
    "@id": `${url}#product`,
    name: `${name} ${size}`,
    url,
    sku: product.id,
    category: product.category,
    brand: { "@type": "Brand", name: product.brand },
    model: product.model,
    description: (product.features ?? [])
      .slice(0, 3)
      .map((f) => f.replace(/\.?$/, "."))
      .join(" "),
    additionalProperty: Object.entries(product.specs ?? {}).map(([k, v]) => ({
      "@type": "PropertyValue",
      name: k,
      value: String(v),
    })),
    // No aggregateRating. The catalog carries no ratings, and rating markup
    // for ratings nobody left is a policy breach, not a shortcut.
  };

  // Only a real product photo, the same rule the page uses to show one. The
  // drawn placeholder art is not a picture of the product.
  if (typeof product.image === "string" && /^https:\/\//i.test(product.image))
    node.image = product.image;

  if (isTire && product.warranty) {
    node.additionalProperty.push({
      "@type": "PropertyValue",
      name: "Warranty",
      value: product.warranty,
    });
  }

  if (EMIT_OFFERS) {
    node.offers = {
      "@type": "Offer",
      url,
      priceCurrency: "USD",
      price: String(product.price),
      // `availability` belongs here once the distributor feed supplies real
      // inventory; the sample catalog has none to report.
      seller: { "@id": `${ORIGIN}/#organization` },
    };
  }

  return node;
}

function serviceNode(service, url) {
  return {
    "@type": "Service",
    "@id": `${url}#service`,
    name: service.name,
    url,
    description: service.blurb,
    serviceType: service.name,
    provider: { "@id": `${ORIGIN}/#shop` },
    // Miami-Dade, Broward and Palm Beach counties (src/data/serviceArea.js).
    areaServed: SERVICE_AREA_SCHEMA.map((area) => ({ ...area })),
  };
}

/**
 * Mobile tire installation as a Service of the shop: on the /mobile-service
 * hub for all three counties, and on each city page for that city, placed in
 * its county. The provider is always the one shop entity; no city gets a
 * LocalBusiness of its own.
 */
function mobileServiceNode(url, { name, description, areaServed }) {
  return {
    "@type": "Service",
    "@id": `${url}#service`,
    name,
    url,
    ...(description ? { description } : {}),
    serviceType: "Mobile tire installation",
    provider: { "@id": `${ORIGIN}/#shop` },
    areaServed,
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `${ORIGIN}/schedule?service=tire-installation`,
      servicePhone: {
        "@type": "ContactPoint",
        telephone: BUSINESS.phone,
        contactType: "customer service",
      },
    },
  };
}

function cityAreaServed(city) {
  return {
    "@type": "City",
    name: `${city.name}, FL`,
    containedInPlace: {
      "@type": "AdministrativeArea",
      name: `${city.county} County, FL`,
    },
  };
}

/**
 * Free tire shipping to one state, as a Service of TireDrop (the online
 * store, not the shop) with the state as areaServed. No LocalBusiness and no
 * address per state: the only physical business is the Sunrise shop.
 */
function stateShippingNode(url, state, description) {
  return {
    "@type": "Service",
    "@id": `${url}#service`,
    name: `Free tire shipping to ${state.name}`,
    url,
    ...(description ? { description } : {}),
    serviceType: "Tire shipping",
    provider: { "@id": `${ORIGIN}/#organization` },
    areaServed: {
      "@type": state.abbr === "DC" ? "AdministrativeArea" : "State",
      name: state.name,
      containedInPlace: { "@type": "Country", name: "United States" },
    },
  };
}

/**
 * Where an inner page sits, for BreadcrumbList. Top-level pages are
 * Home > Page; these have a real parent page in between, and each one
 * matches the page's visible <Breadcrumbs> trail, names included. A page's
 * own `crumbs` prop wins over this list. Product pages add their brand level
 * in graphFor. `npm run check:schema` compares every built page's
 * BreadcrumbList with its visible trail.
 */
const CRUMB_PARENTS = [
  [/^\/tires\/.+/, { name: "Tires", path: "/tires" }],
  [/^\/wheels\/.+/, { name: "Wheels", path: "/wheels" }],
  [/^\/compare$/, { name: "Tires", path: "/tires" }],
  [/^\/tire-check$/, { name: "Learn", path: "/learn" }],
  [/^\/services\/.+/, { name: "Auto Service", path: "/auto-service" }],
  [/^\/install$/, { name: "How shipping works", path: "/shipping" }],
  [CITY_ROUTE, { name: "Mobile Tire Service", path: "/mobile-service" }],
  [STATE_ROUTE, { name: "Tires Shipped Nationwide", path: "/tires-shipped" }],
];

function breadcrumbNode(pathname, url, name, parents) {
  const fixed = CRUMB_PARENTS.find(([re]) => re.test(pathname))?.[1];
  const between = parents ?? (fixed ? [fixed] : []);
  const trail = [
    { name: "Home", url: `${ORIGIN}/` },
    ...between.map((p) => ({ name: p.name, url: `${ORIGIN}${p.path}` })),
    { name, url },
  ];
  return {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/**
 * Builds the JSON-LD graph for a route, plus whether the route should be
 * noindexed. A product or service URL whose slug matches nothing is a 404
 * rendered at 200 — it must not be indexed, and the component can tell on its
 * own by looking the slug up, without the page passing anything.
 */
function graphFor(pathname, url, title, fullTitle, description, noindex, crumbs) {
  const webPage = {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: fullTitle,
    ...(description ? { description } : {}),
    inLanguage: "en-US",
    isPartOf: { "@id": `${ORIGIN}/#website` },
    about: { "@id": `${ORIGIN}/#organization` },
  };
  const graph = [
    organizationNode(),
    {
      "@type": "WebSite",
      "@id": `${ORIGIN}/#website`,
      url: ORIGIN,
      name: BUSINESS.name,
      inLanguage: "en-US",
      publisher: { "@id": `${ORIGIN}/#organization` },
    },
    webPage,
  ];

  let missing = false;
  let crumbName = title;
  let crumbParents = crumbs;

  graph.push(isShopRoute(pathname) ? shopNode() : shopStubNode());

  if (pathname === "/mobile-service") {
    graph.push(
      mobileServiceNode(url, {
        name: "Mobile tire installation in South Florida",
        description,
        areaServed: SERVICE_AREA_SCHEMA.map((area) => ({ ...area })),
      }),
    );
  }

  const cityMatch = CITY_ROUTE.exec(pathname);
  if (cityMatch) {
    const city = getCityPage(cityMatch[1]);
    if (city) {
      graph.push(
        mobileServiceNode(url, {
          name: `Mobile tire installation in ${city.name}, FL`,
          description,
          areaServed: cityAreaServed(city),
        }),
      );
      crumbName = city.name;
    } else missing = true;
  }

  const stateMatch = STATE_ROUTE.exec(pathname);
  if (stateMatch) {
    const state = getLiveState(stateMatch[1]);
    if (state) {
      graph.push(stateShippingNode(url, state, description));
      crumbName = state.name;
    } else missing = true;
  }

  const product = /^\/(tires|wheels)\/(.+)$/.exec(pathname);
  if (product) {
    const found = getProduct(
      product[1] === "tires" ? "tire" : "wheel",
      product[2],
    );
    if (found) {
      const node = productNode(found, url);
      if (EMIT_OFFERS) graph.push(node);
      crumbName = node.name;
      // The visible trail: Tires > <brand> (the listing filtered to that
      // brand) > the product.
      crumbParents ??= [
        CRUMB_PARENTS.find(([re]) => re.test(pathname))[1],
        {
          name: found.brand,
          path: `/${product[1]}?brands=${encodeURIComponent(found.brand)}`,
        },
      ];
    } else missing = true;
  }

  const service = /^\/services\/(.+)$/.exec(pathname);
  if (service) {
    const found = getService(service[1]);
    if (found) {
      graph.push(serviceNode(found, url));
      crumbName = found.name;
    } else missing = true;
  }

  const hide = noindex || missing || NOINDEX_ROUTES.includes(pathname);

  // Inner pages that are meant to be indexed get a breadcrumb trail.
  if (pathname !== "/" && !hide) {
    graph.push(breadcrumbNode(pathname, url, crumbName, crumbParents));
    webPage.breadcrumb = { "@id": `${url}#breadcrumb` };
  }

  return { graph, hide };
}

/* --------------------------------- Seo --------------------------------- */

/**
 * Everything the head should say for one route, as plain data. The browser
 * applies it with applyHead(); the prerenderer (src/entry-server.jsx) turns
 * the same object into static tags, so the served HTML and the hydrated page
 * cannot disagree.
 */
export function headFor({
  title,
  description,
  noindex = false,
  crumbs,
  type,
  schema,
  pathname,
}) {
  const fullTitle = `${title} | ${BUSINESS.name}`;
  const url = `${ORIGIN}${pathname === "/" ? "/" : pathname.replace(/\/+$/, "")}`;
  const { graph, hide } = graphFor(
    pathname,
    url,
    title,
    fullTitle,
    description,
    noindex,
    crumbs,
  );
  return {
    title: fullTitle,
    description: description || null,
    url,
    ogType:
      type ?? (/^\/(tires|wheels)\/.+/.test(pathname) ? "product" : "website"),
    robots: hide ? "noindex, follow" : "index, follow",
    jsonLd: {
      "@context": "https://schema.org",
      // Page-specific nodes (Article, FAQPage) after the site-wide graph.
      // Any BreadcrumbList among them is dropped: graphFor already emits the
      // one trail, from `crumbs`.
      "@graph": [
        ...graph,
        ...(schema ?? []).filter(
          (node) => node && node["@type"] !== "BreadcrumbList",
        ),
      ],
    },
  };
}

function applyHead(head) {
  document.title = head.title;
  if (head.description)
    upsertMeta('meta[name="description"]', {
      name: "description",
      content: head.description,
    });

  upsertLink("canonical", head.url);

  upsertMeta('meta[property="og:title"]', {
    property: "og:title",
    content: head.title,
  });
  upsertMeta('meta[property="og:url"]', {
    property: "og:url",
    content: head.url,
  });
  upsertMeta('meta[property="og:type"]', {
    property: "og:type",
    content: head.ogType,
  });
  upsertMeta('meta[name="twitter:title"]', {
    name: "twitter:title",
    content: head.title,
  });
  if (head.description) {
    upsertMeta('meta[property="og:description"]', {
      property: "og:description",
      content: head.description,
    });
    upsertMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: head.description,
    });
  }

  setJsonLd(head.jsonLd);

  upsertMeta('meta[name="robots"]', { name: "robots", content: head.robots });
}

/**
 * Set only while prerendering. The Seo component hands its head to the
 * collector during render, because effects never run on the server.
 */
export const HeadCollectorContext = createContext(null);

/**
 * Per-page head: title, description, canonical, Open Graph, Twitter card and
 * JSON-LD.
 *
 * Canonical drops the query string on purpose. /tires, /tires?search=size and
 * /tires?view=brands are the same page in three UI states, so pointing them all
 * at /tires consolidates the signals instead of splitting them across
 * near-duplicates.
 *
 * `noindex` is for pages that render at 200 but should never be indexed —
 * carts, checkouts and hand-rolled 404s. Product and service pages set it
 * themselves when the slug matches nothing.
 *
 * `crumbs` sets the BreadcrumbList pages between Home and this one, as
 * `[{ name, path }]` — e.g. a Learn article passes Learn and its hub. Without
 * it, the trail comes from CRUMB_PARENTS, or is just Home > this page.
 *
 * `type` overrides og:type (the Learn and Blog articles pass "article").
 *
 * `schema` is extra JSON-LD nodes for this page (Article, FAQPage), appended
 * to the site-wide graph. Never a BreadcrumbList: that comes from `crumbs`.
 *
 * Arrays are compared by value, so they can be written inline.
 *
 * In the browser this runs as an effect, on every client-side navigation. At
 * build time scripts/prerender.mjs renders each route on the server, where the
 * same head is collected during render and written into that route's static
 * HTML — which is what link-preview scrapers and non-JS crawlers read.
 */
export function Seo({
  title,
  description,
  noindex = false,
  crumbs,
  type,
  schema,
}) {
  const { pathname } = useLocation();
  const collector = useContext(HeadCollectorContext);
  if (collector)
    collector.set(
      headFor({ title, description, noindex, crumbs, type, schema, pathname }),
    );

  // Compared by value, so arrays written inline do not re-run this on every
  // render.
  const extraKey = JSON.stringify({
    crumbs: crumbs ?? null,
    schema: schema ?? null,
  });
  useEffect(() => {
    const extra = JSON.parse(extraKey);
    applyHead(
      headFor({
        title,
        description,
        noindex,
        crumbs: extra.crumbs ?? undefined,
        type,
        schema: extra.schema ?? undefined,
        pathname,
      }),
    );
  }, [title, description, noindex, type, extraKey, pathname]);

  return null;
}

/** Scrolls to top on route change. Rendered once inside the router. */
export function ScrollToTop({ pathname }) {
  // `/terms#returns` and friends are linked from the footer and the sitemap.
  // Scrolling to the top unconditionally lands the reader at the top of a
  // long legal page instead of the clause they asked for, so an in-page
  // target wins when the route change carries one.
  const { hash } = useLocation();
  const landed = useRef(false);

  useEffect(() => {
    // The page a visitor lands on is prerendered HTML they may already have
    // scrolled by the time the app hydrates. Leave the first load's scroll
    // position to the browser; only in-app navigations reset it.
    const first = !landed.current;
    landed.current = true;
    if (first && !hash) return undefined;

    let id = "";
    if (hash) {
      try {
        id = decodeURIComponent(hash.slice(1));
      } catch {
        id = hash.slice(1); // a malformed %-escape is not worth failing over
      }
    }

    const target = id ? document.getElementById(id) : null;
    if (target) {
      target.scrollIntoView();
      return undefined;
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    if (!id) return undefined;

    // Routes are code-split, so the section a link points at is often still
    // behind a Suspense fallback on the frame this runs. Watch a few frames
    // for it rather than silently leaving the reader at the top of the page.
    let frames = 45;
    let raf = 0;
    const stop = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
    const look = () => {
      const late = document.getElementById(id);
      if (late) {
        late.scrollIntoView();
        stop();
        return;
      }
      if (frames-- > 0) raf = requestAnimationFrame(look);
      else stop();
    };
    // Any deliberate scroll of their own wins over ours.
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);
    raf = requestAnimationFrame(look);
    return stop;
  }, [pathname, hash]);
  return null;
}

/**
 * Makes plain `<a href="#section">` jump links work under hash routing.
 *
 * The preview build runs on HashRouter (see src/main.jsx), where the whole
 * route lives in `location.hash`. A bare `#section` link overwrites it, so the
 * router sees the path "/section", finds no match and renders the 404 page —
 * which is what the table of contents on /terms, /privacy, /accessibility and
 * /tire-care did. Intercepting the click scrolls to the section and rewrites
 * the hash as `#/route#section`, the form HashRouter parses back correctly.
 *
 * Under BrowserRouter the browser already does the right thing, so this stays
 * out of the way entirely.
 */
export function InPageAnchors() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (import.meta.env.VITE_HASH_ROUTER !== "true") return undefined;

    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest('a[href^="#"]')
          : null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      // "#/tires" is a route link the router owns; "#" alone goes nowhere.
      if (!href || href === "#" || href.startsWith("#/")) return;

      let id = href.slice(1);
      try {
        id = decodeURIComponent(id);
      } catch {
        /* leave it as written */
      }
      const target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${pathname}${search}#${id}`);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname, search]);

  return null;
}

export function Section({ className = "", children, ...rest }) {
  return (
    <section className={`section ${className}`} {...rest}>
      <div className="wrap">{children}</div>
    </section>
  );
}

/**
 * `tone="dark"` is required on a section with a dark background. The heading
 * and lede otherwise inherit body ink, which on bg-ink-wash lands at 1.08:1 —
 * black on navy, invisible rather than merely low contrast.
 */
export function SectionHead({
  eyebrow,
  title,
  lede,
  align = "left",
  action,
  tone = "light",
}) {
  const centered = align === "center";
  const dark = tone === "dark";
  return (
    <div
      className={`mb-8 md:mb-12 ${centered ? "text-center" : ""} ${
        action ? "md:flex md:items-end md:justify-between md:gap-8" : ""
      }`}
    >
      <div className={centered ? "mx-auto max-w-2xl" : "max-w-2xl"}>
        {/* The eyebrow carries a short rule so the stack reads eyebrow →
            headline → lede rather than three paragraphs of decreasing size. */}
        {eyebrow && (
          <p
            className={`${dark ? "eyebrow-dark" : "eyebrow"} mb-2.5 flex items-center gap-2.5 ${
              centered ? "justify-center" : ""
            }`}
          >
            <span
              aria-hidden
              className={`h-px w-6 ${dark ? "bg-volt/50" : "bg-drop/45"}`}
            />
            {eyebrow}
          </p>
        )}
        <h2 className={`h2 text-balance ${dark ? "text-bone" : ""}`}>
          {title}
        </h2>
        {lede && (
          <p
            className={`lede mt-4 max-w-xl ${dark ? "text-bone/75" : ""} ${
              centered ? "mx-auto" : ""
            }`}
          >
            {lede}
          </p>
        )}
      </div>
      {action && <div className="mt-6 shrink-0 md:mt-0">{action}</div>}
    </div>
  );
}

/**
 * Dark page masthead used by every interior page.
 *
 * This band opens nearly every route, so it does more than any other component
 * to set the feel: a lit gradient rather than a flat rectangle, the mark's cyan
 * for the eyebrow (8.2:1 here, where `drop` would be muddy), and a deliberate
 * step down in weight and colour from title to lede so the stack has a shape.
 */
export function PageHero({ eyebrow, title, lede, children }) {
  return (
    <header className="relative overflow-hidden bg-ink bg-ink-wash text-bone">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-volt/35 to-transparent"
      />
      <div className="wrap relative py-14 md:py-20">
        {eyebrow && (
          <p className="eyebrow mb-3 flex items-center gap-2.5 text-volt">
            <span aria-hidden className="h-px w-6 bg-volt/55" />
            {eyebrow}
          </p>
        )}
        <h1 className="h1 max-w-4xl text-balance">{title}</h1>
        {lede && (
          <p className="lede mt-5 max-w-2xl text-bone/70 md:text-[1.25rem]">
            {lede}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </header>
  );
}

export function Breadcrumbs({ trail = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-ink/10 bg-bone">
      <ol className="wrap flex flex-wrap items-center gap-1.5 py-2 text-xs text-smoke">
        <li>
          <Link
            to="/"
            className="flex min-h-[32px] items-center hover:text-drop"
          >
            Home
          </Link>
        </li>
        {trail.map((c, i) => (
          <li key={c.label} className="flex items-center gap-1.5">
            <ChevronRight size={13} aria-hidden className="text-smoke/50" />
            {c.to && i < trail.length - 1 ? (
              <Link
                to={c.to}
                className="flex min-h-[32px] items-center hover:text-drop"
              >
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Small status pill. Uppercase is right here — it is a label, not a sentence —
 * but the tracking comes down to the same 0.09em the eyebrow uses.
 *
 * Every pairing below clears 4.5:1 for its text on its own fill: bone on `drop`
 * 5.07:1, ink on `amber` 9.5:1, bone on `ink` 19.3:1, and `soft` is ink on a
 * near-white tint. The hairline ring keeps `soft` from dissolving on `fog`.
 */
export function Badge({ tone = "drop", children }) {
  const tones = {
    drop: "bg-drop text-bone",
    amber: "bg-amber text-ink",
    ink: "bg-ink text-bone",
    soft: "bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/10",
  };
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-1 font-display text-[11px] font-bold uppercase leading-none tracking-[0.09em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Accessible accordion item used on FAQ and tip pages. */
export function Accordion({ items = [] }) {
  return (
    <div className="divide-y divide-ink/10 border-y border-ink/10">
      {items.map((item) => (
        <details key={item.q} className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[1.0625rem] font-bold leading-snug tracking-[-0.012em] text-ink transition-colors hover:text-drop md:text-[1.15rem]">
            {item.q}
            <ChevronRight
              size={18}
              aria-hidden
              className="shrink-0 text-drop transition-transform group-open:rotate-90"
            />
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-smoke">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  lede,
  action,
  as: Heading = "h3",
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      {Icon && (
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-fog text-ink/30">
          <Icon size={26} aria-hidden />
        </span>
      )}
      <Heading className="h3 text-[1.25rem] md:text-[1.375rem]">
        {title}
      </Heading>
      {lede && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-smoke">
          {lede}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Form honeypot
 * ------------------------------------------------------------------ */

/**
 * A field people never see or reach: off-screen, out of the tab order and
 * hidden from screen readers. Bots that fill every input fill this one, and
 * the API answers them like a success while storing nothing. Put it
 * inside the <form> and pass the form element to submitForm() (or read it
 * with guardFields() from data/formGuard.js).
 *
 * It also notes when the form appeared, for the fill-time token the form
 * sends with it (data/formGuard.js): a submission sooner than people can
 * manage is treated like a filled trap.
 */
export function FormTrap({ id }) {
  useEffect(() => {
    noteFormStart(id);
  }, [id]);
  return (
    <div
      aria-hidden="true"
      className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
    >
      <label htmlFor={id}>Leave this empty</label>
      <input
        id={id}
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Form fields that keep what is in them
 * ------------------------------------------------------------------ */

/*
 * <Input>, <Textarea> and <Select> take the usual controlled props — `value`
 * (`checked` for a checkbox or radio) and `onChange` — so a page keeps its
 * form state exactly as before. What changes is when the DOM gets written.
 *
 * A plain controlled field has React write its `value` back into the DOM on
 * every render. A value that arrived without an `input` event — browser
 * automation setting `.value`, some password managers, some mobile autofill —
 * never reached state, so the next render of the form (the forms-on status
 * landing, a keystroke in another field) wrote "" over it and the visitor's
 * text vanished.
 *
 * These render uncontrolled (`defaultValue` / `defaultChecked`) and write the
 * DOM themselves, only when:
 *   - the `value` prop differs from the previous render's — a genuine
 *     programmatic change: a reset, a prefill, formatting, a cleared option;
 *   - or this field's own change event just ran, so the field shows what the
 *     handler put in state, as a controlled field would (a handler that
 *     rejects a keystroke still rejects it).
 * A render where the prop did not change leaves the DOM alone.
 *
 * Because state can now trail the DOM, a form reads its values back from the
 * DOM before validating (readFormValues in src/data/forms.js), and a reset
 * that sets state to what it already holds calls `form.reset()` as well.
 */

const asText = (value) => (value == null ? "" : String(value));

function writeField(node, value, isCheck) {
  if (isCheck) {
    const on = Boolean(value);
    if (node.checked !== on) node.checked = on;
    return;
  }
  const text = asText(value);
  if (node.value === text) return;
  node.value = text;
  // A <select> given a value none of its options carry shows its first
  // option, as React does for a controlled select.
  if (node.tagName === "SELECT" && node.selectedIndex === -1) {
    const first = [...node.options].findIndex((o) => !o.disabled);
    if (first !== -1) node.selectedIndex = first;
  }
}

/**
 * The shared behaviour. `prop` is the managed value (`value`, or `checked`
 * for a checkbox or radio); `undefined` means the caller did not manage it,
 * and the field is left entirely to the browser.
 */
function useKeptField(prop, isCheck, onChange, forwardedRef) {
  const node = useRef(null);
  const previous = useRef(prop);
  const latest = useRef(prop);
  const fromEvent = useRef(false);

  useLayoutEffect(() => {
    const el = node.current;
    const changed = !Object.is(previous.current, prop);
    if (el && prop !== undefined && (changed || fromEvent.current)) {
      writeField(el, prop, isCheck);
    }
    previous.current = prop;
    latest.current = prop;
    fromEvent.current = false;
  });

  // A ref passed to the field still gets the DOM node.
  useImperativeHandle(forwardedRef, () => node.current, []);

  const handleChange = (event) => {
    fromEvent.current = true;
    onChange?.(event);
    // React renders a change synchronously, and that render's layout effect
    // clears the flag. Still set means nothing re-rendered — the handler kept
    // the old value — so put it back, as a controlled field would.
    queueMicrotask(() => {
      if (!fromEvent.current) return;
      fromEvent.current = false;
      if (node.current && latest.current !== undefined) {
        writeField(node.current, latest.current, isCheck);
      }
    });
  };

  return { node, handleChange };
}

/** `<input>` that keeps a value typed or filled in without an input event. */
export const Input = forwardRef(function Input(
  { value, checked, defaultValue, defaultChecked, onChange, type, ...rest },
  ref,
) {
  const isCheck = type === "checkbox" || type === "radio";
  const prop = isCheck ? checked : value;
  const { node, handleChange } = useKeptField(prop, isCheck, onChange, ref);

  if (isCheck) {
    return (
      <input
        ref={node}
        type={type}
        value={value}
        defaultChecked={checked === undefined ? defaultChecked : Boolean(checked)}
        onChange={handleChange}
        {...rest}
      />
    );
  }
  return (
    <input
      ref={node}
      type={type}
      defaultValue={value === undefined ? defaultValue : asText(value)}
      onChange={handleChange}
      {...rest}
    />
  );
});

/** `<textarea>` that keeps a value typed or filled in without an input event. */
export const Textarea = forwardRef(function Textarea(
  { value, defaultValue, onChange, ...rest },
  ref,
) {
  const { node, handleChange } = useKeptField(value, false, onChange, ref);
  return (
    <textarea
      ref={node}
      defaultValue={value === undefined ? defaultValue : asText(value)}
      onChange={handleChange}
      {...rest}
    />
  );
});

/** `<select>` that keeps a choice made without a change event. */
export const Select = forwardRef(function Select(
  { value, defaultValue, onChange, children, ...rest },
  ref,
) {
  const { node, handleChange } = useKeptField(value, false, onChange, ref);
  return (
    <select
      ref={node}
      defaultValue={value === undefined ? defaultValue : asText(value)}
      onChange={handleChange}
      {...rest}
    >
      {children}
    </select>
  );
});
