/**
 * The page index the store search looks through (src/lib/siteSearch.js):
 * every page, free tool, service, mobile city page, Learn topic, guide and
 * blog post, as `{ path, title, type, keywords, text, boost }`.
 *
 * Built from the same data the router renders, never typed out a second
 * time: services from src/data/services.js (/services/:slug), city pages
 * from src/data/cityPages.js (/mobile-service/:city), the tool pages from
 * src/components/demos/toolPages.js, and Learn and the blog from the content
 * store (src/content). Only the fixed pages below are listed by hand, each
 * one a <Route> in src/App.jsx; siteSearch.test.mjs fails if any path here
 * stops being a real route.
 *
 * Plain JavaScript with no Vite-only imports. vite.config.js builds the
 * index in Node (with src/content/node.js) and hands the browser the result
 * as the "virtual:site-pages" module, so the typeahead loads a few kB of
 * titles instead of every article's Markdown.
 */
import { SERVICES } from "../data/services.js";
import { CITY_PAGES, cityPath } from "../data/cityPages.js";
import { MAKES } from "../data/vehicleList.js";
import { TOOL_PAGES } from "../components/demos/toolPages.js";

// Installation is not free: name the shop's published starting price.
const INSTALL = SERVICES.find((s) => s.slug === "tire-installation");

/**
 * The fixed pages, in the order they should win a tie. `keywords` are the
 * other words people use for the page ("rims", "appointment"); `boost`
 * lifts a hub page over the pages under it.
 */
export const STATIC_PAGES = [
  {
    path: "/tires",
    title: "Shop all tires",
    keywords: "catalog tyres buy shop browse all season performance",
    text: "Every tire in the catalog, with filters for size, brand, season and price.",
    boost: 2,
  },
  {
    path: "/tires?search=vehicle",
    title: "Shop tires by vehicle",
    keywords: `year make model car truck suv fitment what fits ${MAKES.map((m) => m[0]).join(" ")}`,
    text: "Pick the year, make and model to see the tires in its size.",
    boost: 1,
  },
  {
    path: "/tires?search=size",
    title: "Shop tires by size",
    keywords: "tire size sidewall door jamb sticker width aspect rim",
    text: "Enter the size printed on your tire's sidewall.",
    boost: 1,
  },
  {
    path: "/tires?view=brands",
    title: "Tire brands",
    keywords: "brand brands manufacturer makers",
    text: "Every tire brand in the catalog.",
  },
  {
    path: "/wheels",
    title: "Shop wheels",
    keywords: "rims alloy forged off road truck wheel",
    text: "Alloy, forged, off-road and truck wheels with fitment guidance.",
    boost: 1,
  },
  {
    path: "/wheels?view=fitment",
    title: "Wheel fitment guidance",
    keywords: "bolt pattern offset center bore wheel size rims",
    text: "Bolt pattern, offset and center bore, explained before you buy.",
  },
  {
    path: "/commercial-tires",
    title: "Commercial and fleet tires",
    keywords: "fleet business van work truck lt light truck commercial",
    text: "Tires for work vans, trucks and fleets.",
  },
  {
    path: "/compare",
    title: "Compare tires",
    keywords: "compare side by side versus vs",
    text: "Put tires side by side: price, warranty, ratings and specs.",
  },
  {
    path: "/shipping",
    title: "How shipping works",
    keywords: "free shipping ship delivery deliver home address 48 states faq questions",
    text: "Free shipping to the 48 contiguous states and DC, with no order minimum.",
    boost: 1,
  },
  {
    path: "/install",
    title: "Ship to store and install",
    keywords: "installation install pickup pick up shop store sunrise mount balance",
    text: `Ship your tires free to the Sunrise shop and have them installed there, from $${INSTALL.priceFrom} ${INSTALL.priceUnit}.`,
    boost: 1,
  },
  {
    path: "/mobile-service",
    title: "Mobile tire installation",
    keywords: "mobile van come to you home office driveway jobsite onsite on site installer",
    text: "A technician brings your tires and fits them at your home or work in South Florida.",
    boost: 3,
  },
  {
    path: "/schedule",
    title: "Book an install or service",
    keywords: "book booking appointment schedule reserve time install service",
    text: "Pick a time at the shop, or have the van come to you.",
    boost: 1,
  },
  {
    path: "/auto-service",
    title: "Auto services",
    keywords: "service repair mechanic shop maintenance brakes alignment oil",
    text: "Tire, brake, alignment, suspension and maintenance work at the Sunrise shop.",
    boost: 1,
  },
  {
    path: "/find-my-tires",
    title: "Find my tires",
    keywords: "what size fits my car vehicle tire finder lookup",
    text: "Find the tire size for your vehicle, then the tires in it.",
    type: "tool",
  },
  {
    path: "/tire-size",
    title: "Tire size decoder",
    keywords: "tire size finder calculator read sidewall what does mean decode",
    text: "What every part of a tire size means, and its real dimensions.",
    type: "tool",
  },
  {
    path: "/tire-size?compare=1",
    title: "Compare two tire sizes",
    keywords: "size comparison calculator difference diameter speedometer",
    text: "Two sizes side by side: diameter, width and speedometer difference.",
    type: "tool",
  },
  {
    path: "/tire-check",
    title: "Do I need tires yet?",
    keywords: "tread depth worn penny test quarter replace age check tread gauge",
    text: "Check tread depth and age to see whether it is time for new tires.",
    type: "tool",
  },
  {
    path: "/track",
    title: "Track your order",
    keywords: "order status tracking where is my order shipment",
    text: "Look up an order with its number and email.",
  },
  {
    path: "/financing",
    title: "Financing",
    keywords: "finance pay over time payment plan monthly payments",
    text: "Ways to pay for tires over time.",
  },
  {
    path: "/terms#returns",
    title: "Returns and refunds",
    keywords: "return refund exchange policy send back",
    text: "How returns and refunds work.",
  },
  {
    path: "/terms#shipping",
    title: "Shipping policy",
    keywords: "shipping policy carrier delivery terms",
    text: "The shipping terms for tire and wheel orders.",
  },
  {
    path: "/contact",
    title: "Contact us",
    keywords: "contact phone call email message help question faq support",
    text: "Call, email or send a message to the TireDrop team.",
    boost: 1,
  },
  {
    path: "/locations",
    title: "Location and hours",
    keywords: "location address directions hours map open shop store sunrise oakland park",
    text: "The Sunrise shop on West Oakland Park Blvd: address, hours and directions.",
  },
  {
    path: "/about",
    title: "About TireDrop",
    keywords: "about company extreme tires who we are",
    text: "TireDrop is the online tire store of Extreme Tires in Sunrise, FL.",
  },
  {
    path: "/reviews",
    title: "Reviews",
    keywords: "review google yelp customers",
    text: "Where to read and leave reviews of the shop.",
  },
  {
    path: "/gallery",
    title: "Gallery",
    keywords: "photos pictures shop work",
    text: "Photos from the shop and the vans.",
  },
  {
    path: "/learn",
    title: "Learn: tire guides",
    keywords: "learn guide guides how to help articles faq questions",
    text: "Plain-English guides to tire sizes, tread, pressure, damage and Florida driving.",
    boost: 1,
  },
  {
    path: "/blog",
    title: "Blog",
    keywords: "blog news articles posts",
    text: "Posts on buying, fitting and looking after tires in South Florida.",
  },
  {
    path: "/cart",
    title: "Your cart",
    keywords: "cart basket bag checkout",
    text: "The tires and wheels in your cart.",
  },
  {
    path: "/sitemap",
    title: "Sitemap",
    keywords: "sitemap all pages site map",
    text: "Every page on the site.",
  },
  {
    path: "/terms",
    title: "Terms of use",
    keywords: "terms conditions legal warranty",
    text: "The terms for using the site and buying from it.",
  },
  {
    path: "/privacy",
    title: "Privacy policy",
    keywords: "privacy data cookies personal information",
    text: "What the site collects and how it is used.",
  },
  {
    path: "/accessibility",
    title: "Accessibility statement",
    keywords: "accessibility ada screen reader wcag",
    text: "How the site works with assistive technology, and how to reach us about it.",
  },
];

// The words people use for a service that its name and blurb may not.
const SERVICE_WORDS = {
  "tire-installation": "install mount new tires fit",
  "tire-balancing": "balance wheel balancing vibration shaking shimmy",
  "tire-repair": "flat puncture nail screw plug patch leak slow leak",
  "tire-rotation": "rotate rotation",
  "wheel-installation": "rims mount wheels",
  "oil-change": "oil filter",
  "tpms-service": "tire pressure light sensor tpms",
  "brake-repair": "brakes pads rotors squeal grinding",
  "wheel-alignment": "align alignment pulling pulls steering",
  "suspension-repair": "shocks struts suspension bumpy",
  "lift-kits": "lift leveling kit raise",
  "diagnostics": "check engine light inspection diagnostic",
};

const clip = (text, max = 150) => {
  const s = String(text ?? "").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1).replace(/\s+\S*$/, "")}…` : s;
};

/**
 * The page index. `content` is what the content store holds:
 * `{ hubs, learn, blog }`, as pageIndexContent() reads it.
 */
export function buildPageIndex({ hubs = [], learn = [], blog = [] } = {}) {
  const pages = STATIC_PAGES.map((p) => ({ type: "page", boost: 0, ...p }));

  for (const tool of TOOL_PAGES) {
    pages.push({
      path: tool.path,
      title: tool.label.charAt(0).toUpperCase() + tool.label.slice(1),
      type: "tool",
      keywords: `${tool.seoTitle} ${tool.id.replace(/-/g, " ")} tool calculator`,
      text: clip(tool.blurb),
      boost: 1,
    });
  }

  for (const s of SERVICES) {
    pages.push({
      path: `/services/${s.slug}`,
      title: s.name,
      type: "service",
      keywords: `${s.category} service ${SERVICE_WORDS[s.slug] ?? ""} ${s.mobile ? "mobile van at home" : "shop"}`,
      text: clip(s.blurb),
      boost: 1,
    });
  }

  for (const c of CITY_PAGES) {
    pages.push({
      path: cityPath(c.slug),
      title: `Mobile tire installation in ${c.name}`,
      type: "area",
      keywords: `${c.name} ${c.county} county fl florida mobile van tire service ${(c.zips ?? []).join(" ")} ${(c.areas ?? []).join(" ")}`,
      text: clip(`A technician fits your tires at your home or work in ${c.name}, ${c.county} County.`),
      boost: 0,
    });
  }

  for (const h of hubs.filter((hub) => hub.count > 0)) {
    pages.push({
      path: `/learn/${h.slug}`,
      title: `${h.title} guides`,
      type: "topic",
      keywords: `${h.slug} learn guides topic`,
      text: clip(h.description),
      boost: 1,
    });
  }
  const hubTitle = new Map(hubs.map((h) => [h.slug, h.title]));

  for (const a of learn) {
    pages.push({
      path: a.path,
      title: a.title,
      type: "guide",
      keywords: [a.keyword, ...(a.secondaryKeywords ?? []), hubTitle.get(a.hub) ?? a.hub]
        .filter(Boolean)
        .join(" "),
      text: clip(a.description),
      boost: 0,
    });
  }

  for (const a of blog) {
    pages.push({
      path: a.path,
      title: a.title,
      type: "blog",
      keywords: [a.keyword, ...(a.secondaryKeywords ?? []), a.category?.label]
        .filter(Boolean)
        .join(" "),
      text: clip(a.description),
      boost: 0,
    });
  }

  // One entry per path: the first (a hand-listed page) wins.
  const seen = new Set();
  return pages.filter((p) => !seen.has(p.path) && seen.add(p.path));
}

/**
 * The parts of a content store (src/content/index.js in the app,
 * src/content/node.js's loadContent() in Node) the index needs. Only
 * published articles: drafts never reach the routes.
 */
export function pageIndexContent(store) {
  const publishedOnly = (list) => list.filter((a) => a.public !== false);
  return {
    hubs: store.getLearnHubs(),
    learn: publishedOnly(store.getLearnArticles()),
    blog: publishedOnly(store.getBlogPosts()),
  };
}
