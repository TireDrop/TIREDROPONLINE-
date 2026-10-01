// The South Florida service area for mobile install, decided by ZIP code.
//
// One rule, used by the browser (checkout, schedule page, display copy) and by
// the api (POST /api/checkout, the authority). It matches Shopify Flow
// workflow 2 ("Order routing: local vs ship") and the local block in the order
// confirmation email (shopify/notifications/order-confirmation-local-block.liquid):
//
//   5-digit ZIPs starting 330, 331, 332, 333 or 334 (Miami-Dade, Broward and
//   Palm Beach counties), minus the Florida Keys (Monroe County) ZIPs below.
//
// Change it here and in those two Shopify places together.
//
// This file must stay plain JavaScript with no imports from the browser side,
// because api/_lib/validate.js imports it directly under Node.

export const SERVICE_COUNTIES = ["Miami-Dade", "Broward", "Palm Beach"];

/** "Miami-Dade, Broward and Palm Beach counties" */
export const SERVICE_AREA_LABEL = "Miami-Dade, Broward and Palm Beach counties";

/** ZIP prefixes the vans cover. */
export const SERVICE_ZIP_PREFIXES = ["330", "331", "332", "333", "334"];

/** Florida Keys (Monroe County) ZIPs inside those prefixes: not covered. */
export const EXCLUDED_ZIPS = [
  "33001", "33036", "33037", "33040", "33041", "33042",
  "33043", "33045", "33050", "33051", "33052", "33070",
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

/** The one sentence the server and the pages use to turn a ZIP away. */
export const MOBILE_AREA_ERROR = `Mobile install covers ${SERVICE_AREA_LABEL}. Choose ship-to-home or ship-to-store instead.`;

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
