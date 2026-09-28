// Newsletter sign-up: the Vercel twin of the Shopify theme's pop-up
// (shopify/sections/td-newsletter-popup.liquid), which posts Shopify's native
// customer form. Both end the same way: a Shopify customer with email
// marketing consent SUBSCRIBED and the tags "newsletter" and "popup"; this
// path adds "vercel" so sign-ups from the React site can be told apart.
//
// What is real and checked: every operation below was validated against the
// Shopify Admin GraphQL schema (CustomerInput, CustomerIdentifierInput,
// CustomerEmailMarketingConsentUpdateInput, tagsAdd). Required scopes:
// read_customers and write_customers. Nothing here has been run against a real
// store from this repository; the tests use a mocked fetch.
//
// No discount, coupon or offer is attached to a sign-up. There is none.

import { shopifyGraphQL, ShopifyCheckoutError } from "./shopify.js";

export const CUSTOMER_CREATE = `mutation customerCreate($input: CustomerInput!) {
  customerCreate(input: $input) {
    customer { id }
    userErrors { field message }
  }
}`;

export const CUSTOMER_BY_EMAIL = `query customerByEmail($identifier: CustomerIdentifierInput!) {
  customer: customerByIdentifier(identifier: $identifier) {
    id
    defaultEmailAddress { marketingState }
  }
}`;

export const EMAIL_CONSENT_UPDATE = `mutation customerEmailMarketingConsentUpdate($input: CustomerEmailMarketingConsentUpdateInput!) {
  customerEmailMarketingConsentUpdate(input: $input) {
    customer { id }
    userErrors { field message }
  }
}`;

export const TAGS_ADD = `mutation tagsAdd($id: ID!, $tags: [String!]!) {
  tagsAdd(id: $id, tags: $tags) {
    node { id }
    userErrors { field message }
  }
}`;

/** The consent a sign-up records: subscribed, single opt-in (as the theme's form). */
export const SUBSCRIBED_CONSENT = Object.freeze({
  marketingState: "SUBSCRIBED",
  marketingOptInLevel: "SINGLE_OPT_IN",
});

/** Tags for a sign-up from `source` ("popup" → newsletter, popup, vercel). */
export const newsletterTags = (source = "popup") => [
  ...new Set(["newsletter", source, "vercel"]),
];

/** True when customerCreate refused because the email already has a customer. */
export function emailTaken(userErrors) {
  return (
    Array.isArray(userErrors) &&
    userErrors.some((e) => /has already been taken/i.test(String(e?.message ?? "")))
  );
}

/**
 * Subscribes `email` in Shopify. Resolves `{ created: boolean }`; throws
 * ShopifyCheckoutError when Shopify refuses or cannot be reached.
 *
 *   1. customerCreate with the email, SUBSCRIBED consent and the tags.
 *   2. If the email is already taken: look the customer up by email, set
 *      consent to SUBSCRIBED (skipped when it already is, so the original
 *      opt-in date is kept), then tagsAdd, which adds without replacing.
 */
export async function subscribeEmail(email, source, cfg, deps = {}) {
  const tags = newsletterTags(source);
  try {
    await shopifyGraphQL(
      cfg,
      CUSTOMER_CREATE,
      { input: { email, emailMarketingConsent: { ...SUBSCRIBED_CONSENT }, tags } },
      deps,
    );
    return { created: true };
  } catch (err) {
    if (!(err instanceof ShopifyCheckoutError) || !emailTaken(err.userErrors)) throw err;
  }

  const found = await shopifyGraphQL(
    cfg,
    CUSTOMER_BY_EMAIL,
    { identifier: { emailAddress: email } },
    deps,
  );
  const customer = found?.customer;
  if (!customer?.id) {
    throw new ShopifyCheckoutError(
      "Shopify reported the email as taken but returned no customer for it.",
    );
  }
  if (customer.defaultEmailAddress?.marketingState !== "SUBSCRIBED") {
    await shopifyGraphQL(
      cfg,
      EMAIL_CONSENT_UPDATE,
      { input: { customerId: customer.id, emailMarketingConsent: { ...SUBSCRIBED_CONSENT } } },
      deps,
    );
  }
  await shopifyGraphQL(cfg, TAGS_ADD, { id: customer.id, tags }, deps);
  return { created: false };
}

// ---- Rate limit ---------------------------------------------------------------
//
// Per client IP, per warm function instance: at most RATE_LIMIT attempts in
// RATE_WINDOW_MS. Instances are not shared, so this is a brake on one noisy
// client rather than a hard global quota; with the honeypot it keeps casual
// bots from turning the endpoint into a customer-creation loop.

export const RATE_LIMIT = 5;
export const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map();

/** Test hook. */
export function resetNewsletterRateLimit() {
  hits.clear();
}

/** The caller's IP as Vercel reports it, or "unknown". */
export function clientIp(req) {
  const h = req?.headers ?? {};
  const forwarded = String(h["x-forwarded-for"] ?? "").split(",")[0].trim();
  return forwarded || String(h["x-real-ip"] ?? "").trim() || req?.socket?.remoteAddress || "unknown";
}

/** Records one attempt; true when the caller is over the limit. */
export function rateLimited(ip, now = Date.now()) {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    // Drop idle entries so a flood of distinct IPs cannot grow this forever.
    for (const [key, times] of hits) {
      if (!times.some((t) => now - t < RATE_WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > RATE_LIMIT;
}
