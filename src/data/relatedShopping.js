/**
 * "Related shopping": which shop, brand, fitment and service pages each
 * Learn guide and blog post points to, chosen by topic.
 *
 * Plain data plus one lookup, so a new article needs no code: it falls back
 * to its hub's (Learn) or category's (blog) default set, and an entry in
 * BY_PATH below overrides that when a more specific page fits better.
 * Rendered by src/components/content/RelatedShopping.jsx; checked by
 * src/data/relatedShopping.test.mjs (every article gets at least two money
 * pages, every target is a real route).
 *
 * Copy rules: no prices, discounts or delivery dates here. Shipping and
 * install notes only repeat published policy (free shipping covers the 48
 * contiguous states and DC; installation is South Florida only).
 */

/**
 * Link catalog. `anchors` are interchangeable, descriptive link texts; the
 * lookup rotates through them by article so a page never repeats one and
 * the site does not use a single anchor everywhere. `note` is one honest
 * sentence shown under the link.
 */
export const SHOPPING_LINKS = {
  tires: {
    to: "/tires",
    anchors: [
      "Browse tires by size, brand and type",
      "Shop our tire catalog",
      "Find tires in your size",
    ],
    note: "Filter by size, season and category, then check fit for your vehicle.",
  },
  wheels: {
    to: "/wheels",
    anchors: [
      "Browse wheels by diameter and finish",
      "See the wheels we list",
      "Shop alloy, forged and off-road wheels",
    ],
    note: "Every wheel lists its bolt pattern, offset and load rating.",
  },
  commercial: {
    to: "/commercial-tires",
    anchors: [
      "Commercial and fleet tire options",
      "Tires for vans, trucks and work fleets",
    ],
    note: "Load-rated commercial tires for vans and light trucks.",
  },
  brands: {
    to: "/brands",
    anchors: [
      "Tire and wheel brands in our catalog",
      "Browse the brands we list",
      "See which tire brands are listed",
    ],
    note: "The tire and wheel makers listed in our catalog, in one place.",
  },
  fitment: {
    to: "/wheel-fitment",
    anchors: [
      "Check wheel fitment for your vehicle",
      "Wheel fitment guide: bolt pattern, offset and bore",
    ],
    note: "Confirm bolt pattern, offset and center bore before you order.",
  },
  install: {
    to: "/install",
    anchors: [
      "How tire installation works",
      "Get your tires installed in South Florida",
      "Tire installation at our South Florida shop",
    ],
    note: "Installation is available in South Florida only.",
  },
  mobile: {
    to: "/mobile-service",
    anchors: [
      "Mobile tire service in South Florida",
      "Have tires installed at your home or office",
    ],
    note: "A technician comes to you anywhere in our South Florida service area.",
  },
  shipping: {
    to: "/shipping",
    anchors: [
      "How tire shipping works",
      "Shipping details for tires and wheels",
    ],
    note: "Free shipping covers the 48 contiguous states and DC.",
  },
  // Specific product pages, for the topics they answer.
  allTerrain: {
    to: "/tires/nitto-ridge-grappler-285-70r17",
    anchors: ["Nitto Ridge Grappler, a hybrid all-terrain tire"],
    note: "A hybrid all-terrain / mud-terrain tire for trucks and SUVs.",
  },
  allTerrainContinental: {
    to: "/tires/continental-terraincontact-at-265-70r17",
    anchors: ["Continental TerrainContact A/T, an all-terrain tire"],
    note: "An all-terrain, all-season tire for trucks and SUVs.",
  },
  touringTire: {
    to: "/tires/continental-truecontact-tour-215-60r16",
    anchors: ["Continental TrueContact Tour, an all-season touring tire"],
    note: "An all-season tire aimed at commuter sedans and hybrids.",
  },
  performanceTire: {
    to: "/tires/continental-extremecontact-dws-06-plus-245-40r18",
    anchors: ["Continental ExtremeContact DWS 06 Plus, an ultra-high performance tire"],
    note: "An all-season ultra-high performance tire.",
  },
  commercialTire: {
    to: "/tires/continental-vancontact-as-245-75r16",
    anchors: ["Continental VanContact A/S, an all-season commercial tire"],
    note: "An all-season commercial tire for vans.",
  },
  truckTire: {
    to: "/tires/continental-crosscontact-lx25-235-65r17",
    anchors: ["Continental CrossContact LX25, an all-season SUV tire"],
    note: "An all-season tire for crossovers and SUVs.",
  },
  staggeredWheel: {
    to: "/wheels/rotiform-las-r-19x8-5-gloss-silver",
    anchors: ["Rotiform LAS-R, a 19x8.5 forged wheel"],
    note: "Check its bolt pattern and offset against your vehicle first.",
  },
};

/** Default link keys for each Learn hub. */
const HUB_DEFAULT = {
  basics: ["tires", "brands"],
  sidewall: ["tires", "install"],
  tread: ["tires", "install", "mobile"],
  pressure: ["tires", "install", "mobile"],
  damage: ["tires", "install", "mobile"],
  florida: ["tires", "brands", "install"],
  buying: ["tires", "brands", "shipping"],
  fitment: ["wheels", "fitment", "tires"],
  maintenance: ["tires", "install"],
  age: ["tires", "install", "shipping"],
  tesla: ["tires", "install", "mobile"],
};

/** Default link keys for each blog category slug. */
const CATEGORY_DEFAULT = {
  hurricane: ["tires", "mobile", "install"],
  weather: ["tires", "brands", "install"],
  travel: ["tires", "mobile", "shipping"],
  local: ["install", "mobile", "tires"],
  buying: ["tires", "brands", "shipping"],
  myths: ["tires", "brands", "install"],
  vehicles: ["tires", "brands", "install"],
  "ev-fleet": ["tires", "commercial", "mobile"],
};

const FALLBACK = ["tires", "brands", "install"];

/** Topic-specific sets, by site path. */
const BY_PATH = {
  // Learn
  "/learn/basics/tire-types": ["tires", "brands", "commercial"],
  "/learn/basics/touring-vs-performance-tires": ["touringTire", "performanceTire", "tires", "brands"],
  "/learn/buying/all-terrain-vs-highway-tires": ["allTerrain", "allTerrainContinental", "tires"],
  "/learn/buying/lt-vs-p-metric": ["tires", "truckTire", "commercial"],
  "/learn/buying/ev-tires": ["tires", "brands", "install"],
  "/learn/buying/run-flat-tires": ["tires", "install", "brands"],
  "/learn/buying/all-season-vs-all-weather-tires": ["tires", "brands", "touringTire"],
  "/learn/fitment/staggered-tires": ["wheels", "fitment", "staggeredWheel", "tires"],
  "/learn/fitment/bolt-pattern": ["wheels", "fitment", "install"],
  "/learn/fitment/wheel-offset-backspacing": ["wheels", "fitment", "install"],
  "/learn/fitment/different-tire-size": ["tires", "wheels", "fitment"],
  "/learn/age/tire-recalls-registration": ["tires", "brands", "install"],
  "/learn/tesla/tesla-tire-sizes": ["tires", "brands", "install"],
  // Blog
  "/blog/choosing-between-tire-brands": ["brands", "tires", "shipping"],
  "/blog/buy-tires-online-vs-local-shop": ["tires", "shipping", "install"],
  "/blog/get-tires-installed-after-buying-online": ["install", "shipping", "tires"],
  "/blog/bought-tires-online-install-broward": ["install", "mobile", "shipping"],
  "/blog/how-old-are-tires-bought-online": ["tires", "shipping", "brands"],
  "/blog/same-size-tires-different-prices": ["brands", "tires", "shipping"],
  "/blog/mobile-tire-install-condo-office": ["mobile", "install", "tires"],
  "/blog/bigger-wheels-myth": ["wheels", "fitment", "tires"],
  "/blog/king-tide-salt-water-wheels": ["wheels", "mobile", "tires"],
  "/blog/flooded-car-tires-wheels": ["wheels", "tires", "mobile"],
  "/blog/small-fleet-tire-checklist": ["commercial", "commercialTire", "mobile"],
  "/blog/rideshare-driver-tires": ["tires", "mobile", "brands"],
  "/blog/ford-f-150-tires-p-vs-lt": ["tires", "truckTire", "commercial", "brands"],
  "/blog/silverado-boat-towing-tires": ["tires", "truckTire", "commercial", "brands"],
  "/blog/jeep-wrangler-tires-guide": ["allTerrain", "tires", "wheels", "fitment"],
  "/blog/low-rolling-resistance-hybrids": ["touringTire", "tires", "brands"],
};

const pick = (list, seed) => list[seed % list.length];

function seedOf(path) {
  let h = 0;
  for (const ch of path) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** The link keys chosen for an article (`{ path, hub, category }`). */
export function shoppingKeys(article) {
  const hit = BY_PATH[article.path];
  if (hit) return hit;
  if (article.section === "learn" || article.hub) {
    return HUB_DEFAULT[article.hub] ?? FALLBACK;
  }
  return CATEGORY_DEFAULT[article.category?.slug] ?? FALLBACK;
}

/**
 * The related-shopping links for an article: `[{ to, text, note }]`, three
 * or four of them, anchor text varied by article.
 */
export function shoppingLinksFor(article) {
  const seed = seedOf(article.path ?? "");
  return shoppingKeys(article)
    .map((key, i) => {
      const link = SHOPPING_LINKS[key];
      if (!link) return null;
      return {
        to: link.to,
        text: pick(link.anchors, seed + i),
        note: link.note,
      };
    })
    .filter(Boolean);
}

/** Routes that count as money pages for the internal-link audit. */
export const MONEY_PREFIXES = [
  "/tires",
  "/wheels",
  "/commercial-tires",
  "/brands",
  "/wheel-fitment",
  "/install",
  "/mobile-service",
  "/shipping",
];

/* ------------------------------------------------------------------ *
 * Product pages: guides and brand links
 * ------------------------------------------------------------------ */

/** Learn guides for each tire category, in the order they are shown. */
const TIRE_GUIDES = {
  "All-Season": [
    { to: "/learn/buying/all-season-vs-all-weather-tires", text: "All-season vs all-weather tires, explained" },
    { to: "/learn/sidewall/utqg-ratings", text: "What UTQG treadwear, traction and temperature grades mean" },
  ],
  Performance: [
    { to: "/learn/basics/touring-vs-performance-tires", text: "Touring vs performance tires: how they differ" },
    { to: "/learn/sidewall/speed-rating", text: "How speed ratings work" },
  ],
  "Truck & SUV": [
    { to: "/learn/buying/all-terrain-vs-highway-tires", text: "All-terrain vs highway tires for trucks and SUVs" },
    { to: "/learn/buying/lt-vs-p-metric", text: "LT vs P-metric tires" },
  ],
  Winter: [
    { to: "/learn/buying/all-season-vs-all-weather-tires", text: "All-season vs all-weather tires, explained" },
    { to: "/learn/sidewall/sidewall-markings", text: "Reading every marking on your tire's sidewall" },
  ],
  Commercial: [
    { to: "/learn/buying/lt-vs-p-metric", text: "LT vs P-metric tires" },
    { to: "/learn/sidewall/load-index", text: "How to read a tire's load index" },
  ],
};

/** Learn guides for each wheel category. */
const WHEEL_GUIDES = {
  Alloy: [
    { to: "/learn/fitment/bolt-pattern", text: "How to find and match your bolt pattern" },
    { to: "/learn/fitment/wheel-offset-backspacing", text: "Wheel offset and backspacing, explained" },
  ],
  Forged: [
    { to: "/learn/fitment/wheel-offset-backspacing", text: "Wheel offset and backspacing, explained" },
    { to: "/learn/fitment/staggered-tires", text: "Staggered wheel and tire setups" },
  ],
  "Off-Road": [
    { to: "/learn/fitment/bolt-pattern", text: "How to find and match your bolt pattern" },
    { to: "/learn/fitment/wheel-offset-backspacing", text: "Wheel offset and backspacing, explained" },
  ],
  Truck: [
    { to: "/learn/fitment/bolt-pattern", text: "How to find and match your bolt pattern" },
    { to: "/learn/fitment/different-tire-size", text: "Running a different tire size: what to check" },
  ],
};

/**
 * Links for the block at the end of a product page: `{ heading, links }`,
 * each link `{ to, text }`. Tires get two guides and the brands page; wheels
 * get the fitment page and two guides.
 */
export function productRelatedLinks(product) {
  if (product.kind === "wheel") {
    const guides = WHEEL_GUIDES[product.category] ?? WHEEL_GUIDES.Alloy;
    return {
      heading: "Before you order: fitment guides",
      links: [
        { to: "/wheel-fitment", text: "Check wheel fitment for your vehicle" },
        ...guides,
      ],
    };
  }
  const guides = TIRE_GUIDES[product.category] ?? TIRE_GUIDES["All-Season"];
  return {
    heading: "Learn more about this kind of tire",
    links: [
      ...guides,
      { to: "/brands", text: `${product.brand} and the other tire brands we list` },
    ],
  };
}
