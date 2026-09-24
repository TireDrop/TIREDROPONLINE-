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

/** Tire Guru's API mode needs all three; the hosted link needs only its URL. */
export const TIREGURU_API_VARS = [
  "TIREGURU_API_BASE",
  "TIREGURU_API_KEY",
  "TIREGURU_STORE_ID",
];

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

  // ---- Tire Guru (payments and orders) -----------------------------------
  const tgIssues = [];
  const apiSet = TIREGURU_API_VARS.filter((k) => clean(env[k]) !== "");
  const checkoutUrl = clean(env.TIREGURU_CHECKOUT_URL);
  if (apiSet.length > 0 && apiSet.length < TIREGURU_API_VARS.length) {
    const missing = TIREGURU_API_VARS.filter((k) => !apiSet.includes(k));
    tgIssues.push(
      `Tire Guru API is partially configured. Missing: ${missing.join(", ")}.`,
    );
  }
  const tgBase = clean(env.TIREGURU_API_BASE);
  if (tgBase && !isHttpsUrl(tgBase)) {
    tgIssues.push("TIREGURU_API_BASE must be an https:// URL.");
  }
  if (checkoutUrl && !isHttpsUrl(checkoutUrl.replace(/\{[a-zA-Z]+\}/g, "x"))) {
    tgIssues.push("TIREGURU_CHECKOUT_URL must be an https:// URL.");
  }
  const tgOn = apiSet.length > 0 || checkoutUrl !== "";
  const tireguru = {
    mode: tgOn ? "live" : "off",
    ok: tgIssues.length === 0,
    issues: tgIssues,
    // API wins when fully configured; the hosted link is the fallback.
    via:
      apiSet.length === TIREGURU_API_VARS.length
        ? "api"
        : checkoutUrl
          ? "link"
          : null,
    base: tgBase,
    key: clean(env.TIREGURU_API_KEY),
    storeId: clean(env.TIREGURU_STORE_ID),
    checkoutUrl,
  };
  issues.push(...tgIssues);

  // ---- Order request delivery (used when Tire Guru is not taking payment) -
  const orderWebhookUrl = clean(env.ORDER_WEBHOOK_URL);
  const webhookIssues = [];
  if (orderWebhookUrl && !isHttpsUrl(orderWebhookUrl)) {
    webhookIssues.push("ORDER_WEBHOOK_URL must be an https:// URL.");
  }
  issues.push(...webhookIssues);

  // Payment is only taken once BOTH sides are live. Charging a card against
  // the representative sample catalog would sell tires nobody has confirmed
  // are in stock at prices nobody has confirmed, so until ATD is live the
  // checkout stays an order request even if Tire Guru is configured.
  const paymentsReady =
    tireguru.mode === "live" && tireguru.ok && atd.mode === "live" && atd.ok;
  if (tireguru.mode === "live" && atd.mode !== "live") {
    issues.push(
      "Tire Guru is configured but ATD is in sample mode, so checkout stays in request mode until ATD is live.",
    );
  }

  const sha = clean(env.VERCEL_GIT_COMMIT_SHA);
  return {
    atd,
    tireguru,
    orderWebhook: {
      url: webhookIssues.length ? "" : orderWebhookUrl,
      ok: webhookIssues.length === 0,
      issues: webhookIssues,
    },
    checkout: paymentsReady ? "tireguru" : "request",
    issues,
    version: sha ? `${API_VERSION}+${sha.slice(0, 7)}` : API_VERSION,
  };
}
