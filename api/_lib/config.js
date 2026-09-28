// Runtime configuration for the API layer, read from environment variables on
// every request (Vercel injects them at run time, unlike the VITE_* build-time
// variables the frontend uses).
//
// The rule this file enforces: an integration is either OFF (no variables at
// all, so the API runs in honest sample/request mode) or fully configured.
// A half-configured integration is a loud error, never a silent fallback to
// sample data — a storefront quietly showing sample prices as if they were
// live distributor prices is the failure this is here to prevent.
//
// Nothing in the returned object is ever sent to a browser except the modes
// and the `issues` list, which names variables but never their values.

export const API_VERSION = "1.0.0";

/** Every variable that must be set once ATD is switched on. */
export const ATD_REQUIRED = [
  "ATD_API_BASE",
  "ATD_API_KEY",
  // TODO(confirm with ATD docs): if ATD's auth scheme turns out not to use a
  // secret, or ship-to is part of the account, drop it from this list.
  "ATD_API_SECRET",
  "ATD_ACCOUNT_NUMBER",
  "ATD_SHIP_TO",
  // Pricing must be stated explicitly once prices are dealer costs: an unset
  // markup would sell at cost, and an unset freight would eat the shipping
  // that the site advertises as free. "0" is a valid, deliberate value.
  "PRICE_MARKUP_PCT",
  "FREIGHT_PER_TIRE",
];

/**
 * Shopify Admin API version the draft-order input was validated against.
 * Shopify releases a version each quarter and supports each for about a
 * year; bump this (and re-check DraftOrderInput) when it ages out.
 */
export const SHOPIFY_DEFAULT_API_VERSION = "2026-07";
/** Older versions may lack fields buildDraftOrderInput sends. */
export const SHOPIFY_MIN_API_VERSION = "2026-07";

const clean = (v) => (typeof v === "string" ? v.trim() : "");

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function readNumber(env, name, { min, max }, issues) {
  const raw = clean(env[name]);
  if (raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) {
    issues.push(`${name} must be a number between ${min} and ${max}.`);
    return null;
  }
  return n;
}

/**
 * Reads and checks the environment. Pure: pass an object in tests.
 */
export function getConfig(env = process.env) {
  const issues = [];

  // ---- ATD (tire data and stock) -----------------------------------------
  const atdTouched = Object.keys(env).some(
    (k) => k.startsWith("ATD_") && clean(env[k]) !== "",
  );
  const atdMissing = atdTouched
    ? ATD_REQUIRED.filter((k) => clean(env[k]) === "")
    : [];
  if (atdMissing.length) {
    issues.push(
      `ATD is partially configured. Missing: ${atdMissing.join(", ")}.`,
    );
  }
  const atdBase = clean(env.ATD_API_BASE);
  if (atdTouched && atdBase && !isHttpsUrl(atdBase)) {
    issues.push("ATD_API_BASE must be an https:// URL.");
  }
  const markupPct = readNumber(
    env,
    "PRICE_MARKUP_PCT",
    { min: 0, max: 300 },
    issues,
  );
  const freightPerTire = readNumber(
    env,
    "FREIGHT_PER_TIRE",
    { min: 0, max: 250 },
    issues,
  );
  const atdIssues = issues.slice();

  const atd = {
    mode: atdTouched ? "live" : "sample",
    ok: !atdTouched || atdIssues.length === 0,
    issues: atdIssues,
    base: atdBase,
    key: clean(env.ATD_API_KEY),
    secret: clean(env.ATD_API_SECRET),
    accountNumber: clean(env.ATD_ACCOUNT_NUMBER),
    shipTo: clean(env.ATD_SHIP_TO),
    // Sample prices in src/data/products.js are already retail shelf prices,
    // so markup and freight only ever apply to ATD dealer cost.
    markupPct: markupPct ?? 0,
    freightPerTire: freightPerTire ?? 0,
  };

  // ---- Shopify (hosted checkout through draft orders) ---------------------
  // On as soon as any SHOPIFY_* variable is set; then the store domain and
  // exactly one way to authenticate must be present, or checkout answers 503.
  const shopifyTouched = Object.keys(env).some(
    (k) => k.startsWith("SHOPIFY_") && clean(env[k]) !== "",
  );
  const shIssues = [];
  // Accept a pasted "https://x.myshopify.com/" but store the bare host.
  const shDomain = clean(env.SHOPIFY_STORE_DOMAIN)
    .replace(/^https:\/\//i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
  const shToken = clean(env.SHOPIFY_ADMIN_TOKEN);
  const shClientId = clean(env.SHOPIFY_CLIENT_ID);
  const shClientSecret = clean(env.SHOPIFY_CLIENT_SECRET);
  const shVersion = clean(env.SHOPIFY_API_VERSION) || SHOPIFY_DEFAULT_API_VERSION;
  let shAuth = null;
  if (shopifyTouched) {
    const missing = [];
    if (!shDomain) missing.push("SHOPIFY_STORE_DOMAIN");
    if (shToken && (shClientId || shClientSecret)) {
      shIssues.push(
        "Set SHOPIFY_ADMIN_TOKEN or SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET, not both.",
      );
    } else if (shToken) {
      shAuth = "token";
    } else if (shClientId && shClientSecret) {
      shAuth = "client-credentials";
    } else if (shClientId || shClientSecret) {
      missing.push(shClientId ? "SHOPIFY_CLIENT_SECRET" : "SHOPIFY_CLIENT_ID");
    } else {
      missing.push("SHOPIFY_ADMIN_TOKEN (or SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET)");
    }
    if (missing.length) {
      shIssues.unshift(
        `Shopify is partially configured. Missing: ${missing.join(", ")}.`,
      );
    }
    if (shDomain && !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shDomain)) {
      shIssues.push(
        "SHOPIFY_STORE_DOMAIN must be the store's xxx.myshopify.com domain.",
      );
    }
    if (!/^\d{4}-(01|04|07|10)$/.test(shVersion)) {
      shIssues.push(
        `SHOPIFY_API_VERSION must look like ${SHOPIFY_DEFAULT_API_VERSION} (year-01, -04, -07 or -10).`,
      );
    } else if (shVersion < SHOPIFY_MIN_API_VERSION) {
      shIssues.push(
        `SHOPIFY_API_VERSION must be ${SHOPIFY_MIN_API_VERSION} or newer; the draft order fields were checked against ${SHOPIFY_MIN_API_VERSION}.`,
      );
    }
  }
  const shopify = {
    mode: shopifyTouched ? "live" : "off",
    ok: shIssues.length === 0,
    issues: shIssues,
    domain: shDomain,
    apiVersion: shVersion,
    auth: shIssues.length ? null : shAuth,
    token: shToken,
    clientId: shClientId,
    clientSecret: shClientSecret,
  };
  issues.push(...shIssues);

  // Tire Guru payments are retired (see docs/integrations/tireguru.md). Left-
  // over variables are ignored, and said so, rather than silently obeyed.
  const tgLeftover = Object.keys(env).filter(
    (k) => k.startsWith("TIREGURU_") && clean(env[k]) !== "",
  );
  if (tgLeftover.length) {
    issues.push(
      `Tire Guru payments are retired; ${tgLeftover.sort().join(", ")} ${tgLeftover.length === 1 ? "is" : "are"} ignored. Remove ${tgLeftover.length === 1 ? "it" : "them"}.`,
    );
  }

  // ---- Order request delivery (used when online payment is off, and for
  // mobile install always) ----------------------------------------------------
  const orderWebhookUrl = clean(env.ORDER_WEBHOOK_URL);
  const webhookIssues = [];
  if (orderWebhookUrl && !isHttpsUrl(orderWebhookUrl)) {
    webhookIssues.push("ORDER_WEBHOOK_URL must be an https:// URL.");
  }
  issues.push(...webhookIssues);

  // Payment is only taken once BOTH sides are live. Charging a card against
  // the representative sample catalog would sell tires nobody has confirmed
  // are in stock at prices nobody has confirmed, so until ATD is live the
  // checkout stays an order request even if Shopify is configured.
  const paymentsReady =
    shopify.mode === "live" && shopify.ok && atd.mode === "live" && atd.ok;
  if (shopify.mode === "live" && atd.mode !== "live") {
    issues.push(
      "Shopify checkout is configured but ATD is in sample mode, so checkout stays in request mode until ATD is live.",
    );
  }

  const sha = clean(env.VERCEL_GIT_COMMIT_SHA);
  return {
    atd,
    shopify,
    orderWebhook: {
      url: webhookIssues.length ? "" : orderWebhookUrl,
      ok: webhookIssues.length === 0,
      issues: webhookIssues,
    },
    checkout: paymentsReady ? "shopify" : "request",
    issues,
    version: sha ? `${API_VERSION}+${sha.slice(0, 7)}` : API_VERSION,
  };
}
