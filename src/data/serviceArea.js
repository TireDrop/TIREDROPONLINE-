// The South Florida service area for mobile install, decided by ZIP code.
//
// One rule, used by the browser (checkout, schedule page, ZIP checker, display
// copy) and by the api, which is the authority: POST /api/checkout (mobile
// delivery), POST /api/forms (a "booking" with locationType "mobile") and
// POST /api/book-install (a paid mobile-install order's service address).
// It matches Shopify Flow workflow 2 ("Order routing: local vs ship",
// docs/business/shopify-admin-prompts.md prompt 13) and the local block in the
// order confirmation email
// (shopify/notifications/order-confirmation-local-block.liquid):
//
//   5-digit ZIPs starting 330, 331, 332, 333 or 334 (Miami-Dade, Broward and
//   Palm Beach counties), minus EXCLUDED_ZIPS below: the Florida Keys (Monroe
//   County) and the 334 ZIPs that belong to Martin, Hendry and Glades.
//
// Change it here AND in those two Shopify places together (the Flow condition
// and the email block each carry their own copy of EXCLUDED_ZIPS).
//
// This file must stay plain JavaScript with no imports from the browser side,
// because api/_lib/validate.js imports it directly under Node.

export const SERVICE_COUNTIES = ["Miami-Dade", "Broward", "Palm Beach"];

/** "Miami-Dade, Broward and Palm Beach counties" */
export const SERVICE_AREA_LABEL = "Miami-Dade, Broward and Palm Beach counties";

/** ZIP prefixes the vans cover. */
export const SERVICE_ZIP_PREFIXES = ["330", "331", "332", "333", "334"];

/**
 * ZIPs inside those prefixes that are NOT in the three counties: not covered.
 * Left in on purpose: 33469 (Tequesta/Jupiter) and 33478 (Jupiter Farms),
 * mostly Palm Beach with a strip of Martin County.
 */
export const EXCLUDED_ZIPS = [
  // Florida Keys (Monroe County).
  "33001", "33036", "33037", "33040", "33041", "33042",
  "33043", "33045", "33050", "33051", "33052", "33070",
  // 334 ZIPs outside Palm Beach County.
  "33440", // Clewiston (Hendry County)
  "33455", // Hobe Sound and Jupiter Island (Martin County)
  "33471", // Moore Haven (Glades County)
  "33475", // Hobe Sound PO boxes (Martin County)
];

/**
 * The 5-digit ZIP in `zip`, or null. Accepts "33351", "33351-1234" and
 * "333511234", with surrounding spaces.
 */
export function zip5(zip) {
  const m = String(zip ?? "")
    .trim()
    .match(/^(\d{5})(?:-?\d{4})?$/);
  return m ? m[1] : null;
}

/** True when `zip` is inside Miami-Dade, Broward or Palm Beach. */
export function isInServiceArea(zip) {
  const z = zip5(zip);
  if (!z) return false;
  return (
    SERVICE_ZIP_PREFIXES.includes(z.slice(0, 3)) && !EXCLUDED_ZIPS.includes(z)
  );
}

/**
 * The one sentence the server and the pages use to turn a ZIP away. The phone
 * is BUSINESS.phone (src/data/business.js); a test keeps the two equal.
 */
export const MOBILE_AREA_ERROR =
  "That ZIP is outside our mobile service area (Miami-Dade, Broward and Palm Beach). Ship to our Sunrise shop instead, or call (954) 773-1896.";

/**
 * Example cities for copy and SEO only, grouped by county. Never use these
 * to decide eligibility: that is the ZIP rule above. A city with a page in
 * src/data/cityPages.js is linked to it wherever these are shown.
 */
export const SERVICE_AREA_EXAMPLES = [
  {
    county: "Miami-Dade",
    cities: ["Miami", "Miami Beach", "Hialeah", "Doral", "Homestead"],
  },
  {
    county: "Broward",
    cities: [
      "Fort Lauderdale",
      "Sunrise",
      "Plantation",
      "Davie",
      "Weston",
      "Coral Springs",
      "Tamarac",
      "Lauderhill",
      "Pembroke Pines",
      "Miramar",
      "Hollywood",
      "Pompano Beach",
    ],
  },
  {
    county: "Palm Beach",
    cities: [
      "Boca Raton",
      "Delray Beach",
      "Boynton Beach",
      "West Palm Beach",
      "Jupiter",
    ],
  },
];

/** schema.org areaServed for the three counties. */
export const SERVICE_AREA_SCHEMA = SERVICE_COUNTIES.map((county) => ({
  "@type": "AdministrativeArea",
  name: `${county} County, FL`,
}));
