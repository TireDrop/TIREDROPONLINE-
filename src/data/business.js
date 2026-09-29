// Single source of truth for business facts.
//
// TireDrop is the online store. Tires ship free anywhere in the continental
// US, direct from a distributor warehouse. Customers in South
// Florida can instead choose free ship-to-store and have them installed at
// Extreme Tires in Sunrise — the parent business, which also runs the mobile
// install vans.
//
// Contact details are Extreme Tires' and come from the client-supplied
// artwork, plus the TireDrop email the owner confirmed. Do not invent new ones.

export const BUSINESS = {
  name: "TireDrop",
  parent: "Extreme Tires",

  // The registered entity behind the storefront. Deliberately null: "TireDrop"
  // is a trade name, and nobody has confirmed the registered company name, the
  // state it was formed in, or its Florida document number. Pages render an
  // entity line only once `legalName` is filled in, so leaving these null is
  // safe — guessing is not. A distributor's dealer-approval reviewer will
  // compare whatever is published here against the name on the application.
  legalName: null,
  entityState: null, // e.g. "Florida"
  entityNumber: null, // Sunbiz document number, once confirmed
  poweredBy: "Powered by Extreme Tires",
  domain: "tiredroponline.com",
  tagline: "Tires shipped. Or installed.",

  phone: "(954) 773-1896",
  phoneHref: "tel:+19547731896",
  // Customer accounts and full order history stay on Shopify.
  accountUrl: "https://shop.tiredroponline.com/account",
  // Confirmed by the owner as the single address for every form, business
  // enquiry and contact — including dealer paperwork from a distributor
  // reviewer. The footer, contact, locations and legal pages link to it, the
  // structured data publishes it, and form confirmations quote it when
  // VITE_CONTACT_EMAIL is not set. The phone is still the fastest channel.
  email: "info@tiredroponline.com",

  // The Sunrise shop: ship-to-store pickup, local install, and mobile service.
  shop: {
    name: "Extreme Tires — Sunrise",
    street: "7712 West Oakland Park Blvd",
    city: "Sunrise",
    state: "FL",
    zip: "33351",
    full: "7712 West Oakland Park Blvd, Sunrise, FL 33351",
  },

  mapsHref:
    "https://www.google.com/maps/search/?api=1&query=7712+West+Oakland+Park+Blvd+Sunrise+FL+33351",

  hours: [
    { days: "Mon – Fri", time: "8:00 AM – 6:30 PM" },
    { days: "Saturday", time: "8:00 AM – 4:00 PM" },
    { days: "Sunday", time: "Closed" },
  ],

  // Where tires can be shipped, versus where they can be installed. Shipping
  // is free to every address in the area, with no order minimum.
  shipping: {
    area: "the continental United States",
    storePickup: true,
  },

  // Mobile install and ship-to-store are South Florida only.
  installArea: [
    "Sunrise",
    "Plantation",
    "Fort Lauderdale",
    "Davie",
    "Weston",
    "Coral Springs",
    "Tamarac",
    "Lauderhill",
    "Pembroke Pines",
    "Miramar",
  ],
};

/**
 * The install-area city matching `city` (trimmed, case-insensitive), or null.
 * Shared by the checkout page and POST /api/checkout so both draw the mobile
 * install boundary in exactly the same place.
 */
export function installAreaCity(city) {
  const wanted = String(city ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
  if (!wanted) return null;
  return BUSINESS.installArea.find((c) => c.toLowerCase() === wanted) ?? null;
}

/** "Sunrise, Plantation, … Pembroke Pines and Miramar". */
export const INSTALL_AREA_LIST = `${BUSINESS.installArea.slice(0, -1).join(", ")} and ${BUSINESS.installArea.at(-1)}`;

/** The one sentence both the server and the page use to turn a city away. */
export const MOBILE_AREA_ERROR = `Mobile install covers ${INSTALL_AREA_LIST}. Choose ship-to-store or call ${BUSINESS.phone}.`;

// Social profiles. Null means "no account confirmed yet" — the footer skips
// those rather than rendering a link that goes nowhere, which is what three
// href="#" icons were doing. Fill a URL in and the icon appears.
export const SOCIAL = {
  facebook: "https://www.facebook.com/Extremetires/",
  instagram: null,
  youtube: null,
};

// Google Business Profile belongs to the Sunrise shop, not to TireDrop.
// Fill these in once the listing is confirmed; every Google link then updates
// at once. The site publishes no reviews of its own, so `reviewsAreReal`
// stays false and no review markup is emitted.
export const GOOGLE_PROFILE = {
  placeId: null,
  reviewUrl: null,
  searchUrl:
    "https://www.google.com/maps/search/?api=1&query=Extreme+Tires+Sunrise+FL",
  reviewsAreReal: false,
};

export const googleReviewHref = () =>
  GOOGLE_PROFILE.reviewUrl ?? GOOGLE_PROFILE.searchUrl;

// Yelp. Unlike the Google entry this URL is confirmed — it is the listing the
// parent shop already has, under both its names.
//
// Deliberately no rating or review count here. Those move, and a number
// hardcoded into a page is wrong the week after it is written; worse, an
// aggregate this site cannot verify at the source is exactly the kind of
// claim that should never be published as markup. The link goes to the
// profile and lets the reader read the real thing.
export const YELP_PROFILE = {
  url: "https://www.yelp.com/biz/extreme-tires-sunrise",
  name: "Extreme Tires",
};

// Primary navigation. Shopping leads; installation is the differentiator
// rather than the main event.
export const NAV = [
  { label: "Home", to: "/" },
  {
    label: "Tires",
    to: "/tires",
    children: [
      { label: "Shop All Tires", to: "/tires" },
      { label: "Shop by Vehicle", to: "/tires?search=vehicle" },
      { label: "Shop by Tire Size", to: "/tires?search=size" },
      { label: "Tire Brands", to: "/tires?view=brands" },
      { label: "Commercial & Fleet", to: "/commercial-tires" },
    ],
  },
  {
    label: "Wheels",
    to: "/wheels",
    children: [
      { label: "Shop All Wheels", to: "/wheels" },
      { label: "Shop by Vehicle", to: "/wheels?search=vehicle" },
      { label: "Fitment Guidance", to: "/wheels?view=fitment" },
    ],
  },
  {
    label: "Shipping & Install",
    to: "/shipping",
    children: [
      { label: "How Shipping Works", to: "/shipping" },
      { label: "Ship to Store & Install", to: "/install" },
      { label: "Mobile Installation", to: "/mobile-service" },
      { label: "Book an Install", to: "/schedule" },
    ],
  },
  {
    label: "Service",
    to: "/auto-service",
    children: [
      { label: "All Services", to: "/auto-service" },
      { label: "Tire Installation", to: "/services/tire-installation" },
      { label: "Brake Repair", to: "/services/brake-repair" },
      { label: "Wheel Alignment", to: "/services/wheel-alignment" },
      { label: "Book Service", to: "/schedule" },
    ],
  },
  {
    label: "Tools",
    to: "/tire-size",
    children: [
      { label: "Find My Tires", to: "/find-my-tires" },
      { label: "Tire Size Decoder", to: "/tire-size" },
      { label: "Compare Two Sizes", to: "/tire-size?compare=1" },
      { label: "Do I Need Tires Yet?", to: "/tire-check" },
    ],
  },
  // Tire guides by topic, and the blog. Plain links, no dropdowns: the
  // topics live on /learn, and ten of them would bury the phone menu.
  { label: "Learn", to: "/learn" },
  { label: "Blog", to: "/blog" },
  {
    label: "More",
    to: "/about",
    children: [
      { label: "About TireDrop", to: "/about" },
      { label: "Reviews", to: "/reviews" },
      { label: "Financing", to: "/financing" },
      { label: "Locations", to: "/locations" },
      { label: "Gallery", to: "/gallery" },
      { label: "Contact", to: "/contact" },
    ],
  },
];

export const FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "Tires", to: "/tires" },
      { label: "Wheels", to: "/wheels" },
      { label: "Shop by Vehicle", to: "/tires?search=vehicle" },
      { label: "Shop by Size", to: "/tires?search=size" },
      { label: "Commercial & Fleet", to: "/commercial-tires" },
    ],
  },
  {
    title: "Shipping & Install",
    links: [
      { label: "How Shipping Works", to: "/shipping" },
      { label: "Ship to Store", to: "/install" },
      { label: "Mobile Installation", to: "/mobile-service" },
      { label: "Book an Install", to: "/schedule" },
      { label: "Track Order", to: "/track" },
      // External (same tab): customer accounts live on Shopify.
      { label: "Account", href: BUSINESS.accountUrl },
      { label: "Returns & Refunds", to: "/terms#returns" },
      { label: "Shipping Policy", to: "/terms#shipping" },
    ],
  },
  {
    title: "Tools & Guides",
    links: [
      { label: "Find My Tires", to: "/find-my-tires" },
      { label: "Tire Size Decoder", to: "/tire-size" },
      { label: "Compare Two Sizes", to: "/tire-size?compare=1" },
      { label: "Do I Need Tires Yet?", to: "/tire-check" },
      { label: "Learn: Tire Guides", to: "/learn" },
      { label: "Blog", to: "/blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About TireDrop", to: "/about" },
      { label: "Reviews", to: "/reviews" },
      { label: "Financing", to: "/financing" },
      { label: "Gallery", to: "/gallery" },
      { label: "Contact", to: "/contact" },
    ],
  },
];
