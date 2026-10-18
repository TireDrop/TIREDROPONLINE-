/**
 * Product / Offer / shipping / return-policy JSON-LD for one product page.
 *
 *   productSchema(product, { kind })  ->  a Product node, or null
 *
 * Handed to <Seo schema={[node]}> by the product pages. It returns null (and
 * so nothing reaches the built HTML) unless PRODUCT_SCHEMA_ENABLED is true in
 * src/data/seoFlags.js, which Justin flips the day the real ATD catalog is
 * live. docs/integrations/product-structured-data.md has the full picture.
 *
 * Pure: no DOM, no React, no network. The options exist so the unit tests can
 * exercise every branch without editing the flags.
 *
 * WHAT IS HONEST HERE. src/data/products.js is SAMPLE data: no SKUs, no GTINs,
 * no photos, no stock counts, no handling or transit times. So:
 *   - sku / mpn / gtin appear only when the product record carries them (the
 *     distributor feed will; the sample catalog does not). A gtin must also
 *     pass the GTIN check digit.
 *   - image appears only for a real https (or site-relative) photo. Google
 *     REQUIRES an image for merchant listings, so the live catalog needs
 *     photos before this is worth switching on; the build check warns.
 *   - availability appears only with PRODUCT_AVAILABILITY_ENABLED and a
 *     product record that reports stock. Never guessed.
 *   - deliveryTime is never emitted: the data has no handling or transit
 *     facts, and the house rules ban delivery or arrival dates.
 *   - no priceValidUntil (it is a date; none is promised), no
 *     aggregateRating, no review, no discount or strike-through price.
 */
import { BUSINESS } from "./business.js";
import {
  PRODUCT_AVAILABILITY_ENABLED,
  PRODUCT_SCHEMA_ENABLED,
  RETURN_WINDOW_DAYS,
} from "./seoFlags.js";
import { SET_SIZE } from "./pricing.js";
import { productHref } from "./products.js";
import { STATES } from "./stateList.js";

const ORIGIN = `https://${BUSINESS.domain}`;

const SCHEMA = "https://schema.org";

/**
 * The shipping area: the 48 contiguous states and DC, as USPS codes. Read
 * from the same list the /tires-shipped pages use, so it cannot drift. Google
 * documents no way to EXCLUDE regions in Offer markup; naming the regions that
 * are served is the supported way to say "everywhere in the US except Alaska,
 * Hawaii and the territories" (none of which is in STATES).
 */
export const SHIPPING_REGIONS = STATES.map((s) => s.abbr).sort();

/** Prices as Google reads them: a plain number, "." decimal, no symbol, no
 *  thousands separator, at most 2 decimals, greater than zero. */
export function priceNumber(value) {
  const n = typeof value === "string" ? Number(value.trim()) : value;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

/** A GTIN-8/12/13/14 with a correct check digit, as digits only, else null. */
export function validGtin(value) {
  const digits = String(value ?? "").replace(/[\s-]/g, "");
  if (![8, 12, 13, 14].includes(digits.length) || !/^\d+$/.test(digits))
    return null;
  const body = digits.slice(0, -1);
  const sum = [...body]
    .reverse()
    .reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === Number(digits.at(-1)) ? digits : null;
}

/** https URLs as they stand, site-relative paths made absolute, the rest
 *  dropped. The drawn placeholder art is not a photo and never appears here. */
function imageUrls(product) {
  const raw = [].concat(product.images ?? [], product.image ?? []);
  const urls = raw
    .filter((u) => typeof u === "string")
    .map((u) => u.trim())
    .map((u) => (u.startsWith("/") && !u.startsWith("//") ? `${ORIGIN}${u}` : u))
    .filter((u) => /^https:\/\/[^\s]+$/i.test(u));
  return [...new Set(urls)];
}

const text = (v) => {
  const s = String(v ?? "").trim();
  return s || null;
};

/** What the product record says about stock, or null when it says nothing:
 *  the same reading the product page's own stock label uses. */
function availabilityUrl(product) {
  const qty = Number.isFinite(product.qty) ? product.qty : null;
  if (qty !== null) {
    if (qty <= 0) return `${SCHEMA}/OutOfStock`;
    return qty < SET_SIZE ? `${SCHEMA}/LimitedAvailability` : `${SCHEMA}/InStock`;
  }
  if (product.available === true) return `${SCHEMA}/InStock`;
  if (product.available === false) return `${SCHEMA}/OutOfStock`;
  return null;
}

/** Free shipping to the 48 states + DC. No deliveryTime: see the header. */
function shippingDetails() {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "USD" },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: "US",
      addressRegion: [...SHIPPING_REGIONS],
    },
  };
}

/** A finite return window, or null when none is decided. returnMethod and
 *  returnFees are left out: the terms do not state them as fixed (return
 *  shipping is "generally" the customer's cost, and the method is "call us
 *  first"), and markup must not say more than the page does. */
function returnPolicy(days) {
  if (!Number.isInteger(days) || days <= 0) return null;
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "US",
    returnPolicyCategory: `${SCHEMA}/MerchantReturnFiniteReturnWindow`,
    merchantReturnDays: days,
  };
}

function sizeLabel(product, isTire) {
  if (isTire) return text(product.size);
  const parts = [
    product.diameter && product.wheelWidth
      ? `${product.diameter}x${product.wheelWidth}`
      : null,
    text(product.boltPattern),
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

function describe(product, name, size) {
  const features = (product.features ?? [])
    .map(text)
    .filter(Boolean)
    .slice(0, 3)
    .map((f) => f.replace(/[.!?]*$/, "."));
  if (features.length) return features.join(" ");
  // A distributor record has no copy: say only what the record states.
  return [name, size ? `size ${size}` : null].filter(Boolean).join(", ") + ".";
}

/**
 * The Product node for one product page, or null when the switch is off, the
 * product has no usable price (Google rejects a Product with no offer), or it
 * has no page URL.
 *
 * @param product  a record from src/data/products.js or the distributor feed
 * @param opts.kind  "tire" | "wheel" (default: product.kind)
 * @param opts.url   absolute page URL (default: the product's own page)
 * @param opts.enabled / returnWindowDays / showAvailability
 *        overrides, for tests; default to src/data/seoFlags.js
 */
export function productSchema(product, opts = {}) {
  const {
    kind = product?.kind,
    enabled = PRODUCT_SCHEMA_ENABLED,
    returnWindowDays = RETURN_WINDOW_DAYS,
    showAvailability = PRODUCT_AVAILABILITY_ENABLED,
  } = opts;
  if (!enabled || !product) return null;

  const isTire = kind !== "wheel";
  const price = priceNumber(product.price);
  const path = productHref({ ...product, kind: isTire ? "tire" : "wheel" });
  const url = opts.url ?? (path ? `${ORIGIN}${path}` : null);
  const brand = text(product.brand);
  const model = text(product.model);
  if (price === null || !url || !(brand || model)) return null;

  const name = [brand, model].filter(Boolean).join(" ");
  const size = sizeLabel(product, isTire);

  const node = {
    "@type": "Product",
    "@id": `${url}#product`,
    name,
    url,
    description: describe(product, name, size),
  };
  if (brand) node.brand = { "@type": "Brand", name: brand };
  if (model) node.model = model;
  if (size) node.size = size;
  if (text(product.category))
    node.category = `${isTire ? "Tires" : "Wheels"} > ${text(product.category)}`;

  // Identifiers: only what the record carries (the sample catalog's `id` is
  // an internal key, not a merchant SKU, so it is not used).
  if (text(product.sku)) node.sku = text(product.sku);
  if (text(product.mpn)) node.mpn = text(product.mpn);
  const gtin = validGtin(product.gtin ?? product.upc);
  if (gtin) node.gtin = gtin;

  const images = imageUrls(product);
  if (images.length) node.image = images;

  const props = Object.entries(product.specs ?? {})
    .map(([k, v]) => [text(k), text(v)])
    .filter(([k, v]) => k && v)
    .map(([k, v]) => ({ "@type": "PropertyValue", name: k, value: v }));
  if (props.length) node.additionalProperty = props;

  const offer = {
    "@type": "Offer",
    url,
    price,
    priceCurrency: "USD",
    itemCondition: `${SCHEMA}/NewCondition`,
    seller: { "@id": `${ORIGIN}/#organization` },
    shippingDetails: shippingDetails(),
  };
  const availability = showAvailability ? availabilityUrl(product) : null;
  if (availability) offer.availability = availability;
  const returns = returnPolicy(returnWindowDays);
  if (returns) offer.hasMerchantReturnPolicy = returns;
  node.offers = offer;

  return node;
}
