// The shipping area, one row per jurisdiction: the 48 contiguous states and
// DC. Alaska and Hawaii are outside it (we don't ship there), so they have no
// row and can never get a page.
//
// Kept small on purpose: the Seo component (in every page's bundle), the
// router check and the /tires-shipped hub read this file. The facts and the
// copy for each state page live in statePages.js, which only the state page
// chunk loads.
//
//   slug        URL segment under /tires-shipped/
//   name        as written on the page
//   abbr        USPS abbreviation
//   neighbors   bordering jurisdictions in the shipping area (slugs)

/**
 * THE SWITCH: which state pages are routed, prerendered and in the sitemap.
 * Every other state stays in the data, unrouted, until Justin approves the
 * pilot and its facts clear the bar (statePages.test.mjs checks each one).
 * Roll out in batches by adding slugs here.
 */
export const STATE_PAGES_LIVE = [
  "florida",
  "georgia",
  "texas",
  "california",
  "new-york",
  "north-carolina",
  "colorado",
];

export const STATES = [
  { slug: "alabama", name: "Alabama", abbr: "AL", neighbors: ["florida", "georgia", "tennessee", "mississippi"] },
  { slug: "arizona", name: "Arizona", abbr: "AZ", neighbors: ["california", "nevada", "utah", "new-mexico"] },
  { slug: "arkansas", name: "Arkansas", abbr: "AR", neighbors: ["missouri", "tennessee", "mississippi", "louisiana", "texas", "oklahoma"] },
  { slug: "california", name: "California", abbr: "CA", neighbors: ["oregon", "nevada", "arizona"] },
  { slug: "colorado", name: "Colorado", abbr: "CO", neighbors: ["wyoming", "nebraska", "kansas", "oklahoma", "new-mexico", "utah"] },
  { slug: "connecticut", name: "Connecticut", abbr: "CT", neighbors: ["new-york", "massachusetts", "rhode-island"] },
  { slug: "delaware", name: "Delaware", abbr: "DE", neighbors: ["maryland", "pennsylvania", "new-jersey"] },
  { slug: "washington-dc", name: "Washington, DC", abbr: "DC", neighbors: ["maryland", "virginia"] },
  { slug: "florida", name: "Florida", abbr: "FL", neighbors: ["georgia", "alabama"] },
  { slug: "georgia", name: "Georgia", abbr: "GA", neighbors: ["florida", "alabama", "tennessee", "north-carolina", "south-carolina"] },
  { slug: "idaho", name: "Idaho", abbr: "ID", neighbors: ["washington", "oregon", "nevada", "utah", "wyoming", "montana"] },
  { slug: "illinois", name: "Illinois", abbr: "IL", neighbors: ["wisconsin", "iowa", "missouri", "kentucky", "indiana"] },
  { slug: "indiana", name: "Indiana", abbr: "IN", neighbors: ["illinois", "michigan", "ohio", "kentucky"] },
  { slug: "iowa", name: "Iowa", abbr: "IA", neighbors: ["minnesota", "wisconsin", "illinois", "missouri", "nebraska", "south-dakota"] },
  { slug: "kansas", name: "Kansas", abbr: "KS", neighbors: ["nebraska", "missouri", "oklahoma", "colorado"] },
  { slug: "kentucky", name: "Kentucky", abbr: "KY", neighbors: ["indiana", "ohio", "west-virginia", "virginia", "tennessee", "missouri", "illinois"] },
  { slug: "louisiana", name: "Louisiana", abbr: "LA", neighbors: ["texas", "arkansas", "mississippi"] },
  { slug: "maine", name: "Maine", abbr: "ME", neighbors: ["new-hampshire"] },
  { slug: "maryland", name: "Maryland", abbr: "MD", neighbors: ["pennsylvania", "delaware", "virginia", "west-virginia", "washington-dc"] },
  { slug: "massachusetts", name: "Massachusetts", abbr: "MA", neighbors: ["new-hampshire", "vermont", "new-york", "connecticut", "rhode-island"] },
  { slug: "michigan", name: "Michigan", abbr: "MI", neighbors: ["ohio", "indiana", "wisconsin"] },
  { slug: "minnesota", name: "Minnesota", abbr: "MN", neighbors: ["north-dakota", "south-dakota", "iowa", "wisconsin"] },
  { slug: "mississippi", name: "Mississippi", abbr: "MS", neighbors: ["louisiana", "arkansas", "tennessee", "alabama"] },
  { slug: "missouri", name: "Missouri", abbr: "MO", neighbors: ["iowa", "illinois", "kentucky", "tennessee", "arkansas", "oklahoma", "kansas", "nebraska"] },
  { slug: "montana", name: "Montana", abbr: "MT", neighbors: ["idaho", "wyoming", "south-dakota", "north-dakota"] },
  { slug: "nebraska", name: "Nebraska", abbr: "NE", neighbors: ["south-dakota", "iowa", "missouri", "kansas", "colorado", "wyoming"] },
  { slug: "nevada", name: "Nevada", abbr: "NV", neighbors: ["oregon", "idaho", "utah", "arizona", "california"] },
  { slug: "new-hampshire", name: "New Hampshire", abbr: "NH", neighbors: ["maine", "massachusetts", "vermont"] },
  { slug: "new-jersey", name: "New Jersey", abbr: "NJ", neighbors: ["new-york", "pennsylvania", "delaware"] },
  { slug: "new-mexico", name: "New Mexico", abbr: "NM", neighbors: ["arizona", "colorado", "oklahoma", "texas"] },
  { slug: "new-york", name: "New York", abbr: "NY", neighbors: ["vermont", "massachusetts", "connecticut", "new-jersey", "pennsylvania"] },
  { slug: "north-carolina", name: "North Carolina", abbr: "NC", neighbors: ["virginia", "tennessee", "georgia", "south-carolina"] },
  { slug: "north-dakota", name: "North Dakota", abbr: "ND", neighbors: ["minnesota", "south-dakota", "montana"] },
  { slug: "ohio", name: "Ohio", abbr: "OH", neighbors: ["michigan", "indiana", "kentucky", "west-virginia", "pennsylvania"] },
  { slug: "oklahoma", name: "Oklahoma", abbr: "OK", neighbors: ["kansas", "missouri", "arkansas", "texas", "new-mexico", "colorado"] },
  { slug: "oregon", name: "Oregon", abbr: "OR", neighbors: ["washington", "idaho", "nevada", "california"] },
  { slug: "pennsylvania", name: "Pennsylvania", abbr: "PA", neighbors: ["new-york", "new-jersey", "delaware", "maryland", "west-virginia", "ohio"] },
  { slug: "rhode-island", name: "Rhode Island", abbr: "RI", neighbors: ["massachusetts", "connecticut"] },
  { slug: "south-carolina", name: "South Carolina", abbr: "SC", neighbors: ["north-carolina", "georgia"] },
  { slug: "south-dakota", name: "South Dakota", abbr: "SD", neighbors: ["north-dakota", "minnesota", "iowa", "nebraska", "wyoming", "montana"] },
  { slug: "tennessee", name: "Tennessee", abbr: "TN", neighbors: ["kentucky", "virginia", "north-carolina", "georgia", "alabama", "mississippi", "arkansas", "missouri"] },
  { slug: "texas", name: "Texas", abbr: "TX", neighbors: ["new-mexico", "oklahoma", "arkansas", "louisiana"] },
  { slug: "utah", name: "Utah", abbr: "UT", neighbors: ["idaho", "wyoming", "colorado", "arizona", "nevada"] },
  { slug: "vermont", name: "Vermont", abbr: "VT", neighbors: ["new-hampshire", "massachusetts", "new-york"] },
  { slug: "virginia", name: "Virginia", abbr: "VA", neighbors: ["maryland", "washington-dc", "west-virginia", "kentucky", "tennessee", "north-carolina"] },
  { slug: "washington", name: "Washington", abbr: "WA", neighbors: ["idaho", "oregon"] },
  { slug: "west-virginia", name: "West Virginia", abbr: "WV", neighbors: ["ohio", "pennsylvania", "maryland", "virginia", "kentucky"] },
  { slug: "wisconsin", name: "Wisconsin", abbr: "WI", neighbors: ["michigan", "minnesota", "iowa", "illinois"] },
  { slug: "wyoming", name: "Wyoming", abbr: "WY", neighbors: ["montana", "south-dakota", "nebraska", "colorado", "utah", "idaho"] },
];

export const statePath = (slug) => `/tires-shipped/${slug}`;

const BY_SLUG = Object.fromEntries(STATES.map((s) => [s.slug, s]));

/** Any jurisdiction in the shipping area, live page or not. */
export const getState = (slug) => BY_SLUG[slug] ?? null;

/** A state whose page is routed (in STATE_PAGES_LIVE), or null. */
export const getLiveState = (slug) =>
  STATE_PAGES_LIVE.includes(slug) ? getState(slug) : null;
