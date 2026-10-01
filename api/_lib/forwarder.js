// The ATD forwarder: places paid Shopify orders with ATD, and brings ATD's
// tracking back to Shopify.
//
// Two ways in, one code path per order:
//   * the Shopify orders/paid webhook (api/webhooks/shopify.js) calls
//     forwardOrder() for that one order as soon as it is paid, and
//     orders/cancelled calls handleOrderCancelled();
//   * a SWEEP run by Vercel Cron (api/cron/atd-sweep.js) is the backup: it
//     catches anything a webhook missed (a pending risk check, an outage, a
//     dropped delivery) and syncs tracking.
// Both place an order through the same placeOne(), so the claim, the single
// ATD call and the order of writes are identical. All state lives on the
// Shopify order where Justin already looks (tags, metafields, the note).
//
// One sweep does three passes:
//
//   1. STUCK   Orders tagged atd-sending for more than 30 minutes. The sweep
//              that tagged them died between "about to call ATD" and "wrote
//              down what ATD said", so nobody knows whether ATD has the
//              order. They become atd-failed with "unknown outcome — check
//              ATD before retrying". They are NEVER sent again automatically.
//              (If the ATD PO was written down before the crash, the order
//              is marked atd-submitted instead: ATD definitely has it.)
//   2. SUBMIT  Paid, risk-ACCEPTed, unfulfilled vercel-live orders from the
//              last 14 days that carry none of the atd-* tags. Each is
//              claimed (atd-sending), sent to ATD once, and marked
//              atd-submitted (PO in a metafield and the note) or atd-failed
//              (reason in a metafield and the note).
//   3. TRACK   atd-submitted orders that are still unfulfilled: ask ATD for
//              tracking, and when there is some, create the Shopify
//              fulfillment (ship-to-home, customer notified) or record the
//              inbound tracking (ship-to-store; see below).
//
// Safety rules this file keeps:
//   * An order reaches ATD at most once per claim. The claim is a
//     compare-and-set on a metafield (tiredrop.atd_sending_at), so two
//     overlapping sweeps cannot both win it, plus the atd-sending tag, which
//     keeps the order out of every later SUBMIT query.
//   * placeAtdOrder is never retried. A lost answer is an unknown outcome.
//   * No ATD endpoint is guessed: with ENDPOINTS.placeOrder null the SUBMIT
//     pass does not run at all (no claims, no tags), and with
//     ENDPOINTS.orderStatus null the TRACK pass is skipped. The summary says so.
//   * Nothing about prices is read from or sent to ATD here. Dealer cost
//     never enters this file.
//
// Shopify queries and mutations were validated against the Admin GraphQL
// schema (2026-07). Nothing here has been run against a real store; the
// tests use a mocked Shopify and a mocked ATD.
//
// See docs/integrations/atd-forwarder.md.

import {
  AtdError,
  AtdNotConfirmedError,
  cancelAtdOrder,
  ENDPOINTS as ATD_ENDPOINTS,
  getAtdOrderStatus,
  placeAtdOrder,
  STORE_SHIP_TO,
} from "./atd.js";
import { DELIVERY_ATTRIBUTE, ORDER_TAG, shopifyGraphQL } from "./shopify.js";

// ---- Constants ----------------------------------------------------------------

export const TAGS = Object.freeze({
  live: ORDER_TAG, // "vercel-live", set by checkout on the draft order
  shipToHome: "ship-to-home",
  shipToStore: "ship-to-store",
  sending: "atd-sending",
  submitted: "atd-submitted",
  failed: "atd-failed",
  // Added by hand or by a Flow on a risky order: the forwarder keeps out.
  fraudReview: "fraud-review",
  // Set by checkout when a tire in the cart is not the shopper's size
  // (api/_lib/fitmentAttrs.js): a person confirms the size first, then
  // removes the tag.
  fitmentCheck: "fitment-check",
  // Ship-to-store order whose tracking has been recorded; the shop fulfils
  // it in Shopify at install time.
  inboundToStore: "atd-inbound-to-store",
  // Set by the orders/cancelled webhook (api/webhooks/shopify.js).
  // ATD has (or may have) the order: cancel it at ATD. Flow workflow 4 or a
  // person acts on it.
  cancelNeeded: "atd-cancel-needed",
  // Cancelled in Shopify before anything went to ATD. Nothing to undo.
  cancelledBeforeAtd: "cancelled-before-atd",
});

export const METAFIELD_NAMESPACE = "tiredrop";
export const METAFIELD_KEYS = Object.freeze({
  po: "atd_po",
  error: "atd_error",
  sendingAt: "atd_sending_at",
  tracking: "atd_tracking",
});
const METAFIELD_TYPE = "single_line_text_field";

export const SUBMIT_LOOKBACK_DAYS = 14;
// Tracking can arrive days after the order; look further back for it.
export const TRACK_LOOKBACK_DAYS = 45;
export const BATCH_SIZE = 25;
export const STUCK_AFTER_MS = 30 * 60 * 1000;
// Stop starting new ATD calls after this long, so one sweep finishes inside
// the function's 60 s limit (vercel.json). Leftovers wait for the next sweep.
export const SWEEP_BUDGET_MS = 45 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

export const UNKNOWN_OUTCOME = "unknown outcome — check ATD before retrying";

// ---- Shopify operations (validated against Admin GraphQL 2026-07) --------------

// lineItems(first: 20): a tire order has a handful of lines, and keeping the
// connection small keeps 25 orders well under Shopify's 1,000-point query
// cost limit. An order with more lines fails loudly instead of being cut.
// The fields every order read by the forwarder carries, shared by the sweep's
// search (ORDERS_QUERY) and the webhook's single-order read (ORDER_QUERY).
const ORDER_FIELDS = `
      id
      name
      createdAt
      test
      cancelledAt
      tags
      note
      email
      phone
      displayFinancialStatus
      displayFulfillmentStatus
      customAttributes { key value }
      risk { recommendation assessments { riskLevel } }
      shippingAddress { firstName lastName name company address1 address2 city provinceCode zip countryCodeV2 phone }
      lineItems(first: 20) {
        pageInfo { hasNextPage }
        nodes { id sku name quantity currentQuantity }
      }
      atdPo: metafield(namespace: "tiredrop", key: "atd_po") { value }
      atdError: metafield(namespace: "tiredrop", key: "atd_error") { value }
      sendingLock: metafield(namespace: "tiredrop", key: "atd_sending_at") { value compareDigest }`;

export const ORDERS_QUERY = `query forwarderOrders($query: String!, $first: Int!) {
  orders(first: $first, query: $query, sortKey: CREATED_AT) {
    pageInfo { hasNextPage }
    nodes {${ORDER_FIELDS}
    }
  }
}`;

/** One order by id: the webhook path (api/webhooks/shopify.js). */
export const ORDER_QUERY = `query forwarderOrder($id: ID!) {
  order(id: $id) {${ORDER_FIELDS}
  }
}`;

export const TRACKING_QUERY = `query forwarderTracking($query: String!, $first: Int!) {
  orders(first: $first, query: $query, sortKey: CREATED_AT) {
    pageInfo { hasNextPage }
    nodes {
      id
      name
      tags
      note
      cancelledAt
      displayFulfillmentStatus
      customAttributes { key value }
      atdPo: metafield(namespace: "tiredrop", key: "atd_po") { value }
      fulfillmentOrders(first: 5) {
        nodes { id status supportedActions { action } }
      }
    }
  }
}`;

export const METAFIELDS_SET = `mutation forwarderMetafieldsSet($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields { key value compareDigest }
    userErrors { field message code }
  }
}`;

export const TAGS_ADD = `mutation forwarderTagsAdd($id: ID!, $tags: [String!]!) {
  tagsAdd(id: $id, tags: $tags) {
    node { id }
    userErrors { field message }
  }
}`;

export const TAGS_REMOVE = `mutation forwarderTagsRemove($id: ID!, $tags: [String!]!) {
  tagsRemove(id: $id, tags: $tags) {
    node { id }
    userErrors { field message }
  }
}`;

export const ORDER_NOTE_UPDATE = `mutation forwarderOrderNote($input: OrderInput!) {
  orderUpdate(input: $input) {
    order { id }
    userErrors { field message }
  }
}`;

export const FULFILLMENT_CREATE = `mutation forwarderFulfillmentCreate($fulfillment: FulfillmentInput!) {
  fulfillmentCreate(fulfillment: $fulfillment) {
    fulfillment { id status }
    userErrors { field message }
  }
}`;

// ---- Search strings (Shopify order search syntax) -----------------------------

const isoDaysAgo = (nowMs, days) => new Date(nowMs - days * DAY_MS).toISOString();

/** Orders the SUBMIT pass may send. */
export function submitSearch(nowMs) {
  return [
    `tag:${TAGS.live}`,
    "financial_status:paid",
    `tag_not:${TAGS.submitted}`,
    `tag_not:${TAGS.failed}`,
    `tag_not:${TAGS.sending}`,
    `tag_not:${TAGS.fraudReview}`,
    "-status:cancelled",
    `created_at:>='${isoDaysAgo(nowMs, SUBMIT_LOOKBACK_DAYS)}'`,
  ].join(" ");
}

/** Orders a sweep claimed and never finished. */
export function stuckSearch(nowMs) {
  return [
    `tag:${TAGS.live}`,
    `tag:${TAGS.sending}`,
    `tag_not:${TAGS.submitted}`,
    `tag_not:${TAGS.failed}`,
    `created_at:>='${isoDaysAgo(nowMs, TRACK_LOOKBACK_DAYS)}'`,
  ].join(" ");
}

/** Submitted orders still waiting for tracking. */
export function trackingSearch(nowMs) {
  return [
    `tag:${TAGS.live}`,
    `tag:${TAGS.submitted}`,
    `tag_not:${TAGS.inboundToStore}`,
    "fulfillment_status:unfulfilled",
    "-status:cancelled",
    `created_at:>='${isoDaysAgo(nowMs, TRACK_LOOKBACK_DAYS)}'`,
  ].join(" ");
}

// ---- Reading a Shopify order (pure, tested) -----------------------------------

const hasTag = (order, tag) =>
  Array.isArray(order.tags) && order.tags.some((t) => String(t).toLowerCase() === tag);

const attribute = (order, key) =>
  (order.customAttributes ?? []).find((a) => a?.key === key)?.value ?? null;

/**
 * "ship" or "pickup", from the Delivery attribute checkout set on the draft
 * order, cross-checked against the ship-to-home / ship-to-store tag. Throws
 * when they disagree or neither is there: guessing would send tires to the
 * wrong place.
 */
export function deliveryOf(order) {
  const attr = attribute(order, "Delivery");
  const fromAttr =
    attr === DELIVERY_ATTRIBUTE.ship ? "ship" : attr === DELIVERY_ATTRIBUTE.pickup ? "pickup" : null;
  const home = hasTag(order, TAGS.shipToHome);
  const store = hasTag(order, TAGS.shipToStore);
  const fromTag = home && !store ? "ship" : store && !home ? "pickup" : null;
  if ((home && store) || (fromAttr && fromTag && fromAttr !== fromTag)) {
    throw new ForwarderOrderError(
      `conflicting delivery: the Delivery attribute is "${attr ?? "missing"}" but the tags are ${[home && TAGS.shipToHome, store && TAGS.shipToStore].filter(Boolean).join(" + ")}.`,
    );
  }
  const delivery = fromAttr ?? fromTag;
  if (!delivery) {
    throw new ForwarderOrderError(
      "cannot tell ship-to-home from ship-to-store: no Delivery attribute and no ship-to-home / ship-to-store tag.",
    );
  }
  return delivery;
}

/** A problem with the order itself. It becomes atd-failed; ATD is not called. */
export class ForwarderOrderError extends Error {
  constructor(message) {
    super(message);
    this.name = "ForwarderOrderError";
  }
}

/**
 * Why the SUBMIT pass should leave this order alone for now, or null when it
 * may go ahead. These are skips, not failures: nothing is written to the
 * order, and it is looked at again next sweep.
 */
export function skipReason(order, { forwardTestOrders = false } = {}) {
  if (order.cancelledAt) return "cancelled";
  for (const tag of [TAGS.sending, TAGS.submitted, TAGS.failed, TAGS.fraudReview]) {
    // The search already excludes these; checked again in case the search
    // index lags behind a tag written a moment ago.
    if (hasTag(order, tag)) return tag === TAGS.fraudReview ? "fraud-review" : "already-tagged";
  }
  if (hasTag(order, TAGS.fitmentCheck)) return "fitment-check";
  if (order.displayFinancialStatus !== "PAID") return "not-paid";
  if (order.test && !forwardTestOrders) return "test-order";

  // Order.risk (OrderRiskSummary) is the current risk API. Any assessment
  // still PENDING means Shopify (or a fraud app) has not finished: wait.
  // Only an explicit ACCEPT goes to ATD; NONE ("no recommendation yet"),
  // INVESTIGATE and CANCEL all wait for a person.
  const assessments = order.risk?.assessments ?? [];
  if (assessments.some((a) => a?.riskLevel === "PENDING")) return "risk-pending";
  const rec = order.risk?.recommendation ?? "NONE";
  if (rec === "NONE") return "risk-not-assessed";
  if (rec !== "ACCEPT") return `risk-${String(rec).toLowerCase()}`;

  // UNFULFILLED is the normal state (OPEN is its deprecated name). Anything
  // else — fulfilled, partly fulfilled, on hold, scheduled — means someone
  // is already handling it, or decided it should wait.
  const f = order.displayFulfillmentStatus;
  if (f !== "UNFULFILLED" && f !== "OPEN") return `fulfillment-${String(f).toLowerCase()}`;
  return null;
}

/**
 * The neutral order placeAtdOrder takes, built from a Shopify order. Throws
 * ForwarderOrderError for anything that makes the order impossible to place
 * correctly: a line without a SKU, too many lines, an unclear delivery
 * choice, or a ship-to-home order without a usable US address.
 */
export function toAtdOrder(order) {
  if (order.lineItems?.pageInfo?.hasNextPage) {
    throw new ForwarderOrderError("the order has more than 20 lines; place it with ATD by hand.");
  }
  const nodes = order.lineItems?.nodes ?? [];
  // currentQuantity drops lines removed or refunded after checkout.
  const live = nodes.filter((l) => (l.currentQuantity ?? l.quantity) > 0);
  if (!live.length) throw new ForwarderOrderError("the order has no lines to place.");
  const noSku = live.filter((l) => !l.sku || !String(l.sku).trim());
  if (noSku.length) {
    throw new ForwarderOrderError(
      `line${noSku.length === 1 ? "" : "s"} without a SKU: ${noSku.map((l) => `"${l.name}"`).join(", ")}. The SKU is the ATD part number; place it by hand or fix the line.`,
    );
  }
  // Same SKU on two lines is one ATD line.
  const bySku = new Map();
  for (const l of live) {
    const sku = String(l.sku).trim();
    bySku.set(sku, (bySku.get(sku) ?? 0) + (l.currentQuantity ?? l.quantity));
  }
  const lines = [...bySku].map(([sku, qty]) => ({ sku, qty }));

  const delivery = deliveryOf(order);
  let shipTo;
  if (delivery === "pickup") {
    shipTo = { ...STORE_SHIP_TO };
  } else {
    // The paid order's shipping address is the one the shopper confirmed on
    // Shopify's checkout, so it wins over anything the site collected.
    const a = order.shippingAddress;
    const missing = ["address1", "city", "provinceCode", "zip"].filter((k) => !a?.[k]);
    if (!a || missing.length) {
      throw new ForwarderOrderError(
        `ship-to-home order without a complete shipping address (missing ${a ? missing.join(", ") : "the whole address"}).`,
      );
    }
    if (a.countryCodeV2 && a.countryCodeV2 !== "US") {
      throw new ForwarderOrderError(`ship-to-home address is outside the US (${a.countryCodeV2}).`);
    }
    shipTo = {
      name: a.name || [a.firstName, a.lastName].filter(Boolean).join(" "),
      company: a.company || null,
      address1: a.address1,
      address2: a.address2 || null,
      city: a.city,
      state: a.provinceCode,
      zip: a.zip,
      country: "US",
      phone: a.phone || order.phone || null,
    };
  }
  return { reference: order.name, delivery, shipTo, lines };
}

/**
 * What an error from placeAtdOrder means for the order.
 *   "rejected" — ATD said no (a 4xx other than 408), or no request went out.
 *                Fix the problem, then retry.
 *   "unknown"  — timeout, network error, 5xx, 408, an answer we could not
 *                read, or an answer without a PO. ATD may have the order.
 *                Check ATDOnline before retrying.
 */
export function classifyAtdOrderError(err) {
  if (err instanceof AtdNotConfirmedError) return "rejected";
  const s = err instanceof AtdError ? err.upstreamStatus : null;
  if (s && s >= 400 && s < 500 && s !== 408) return "rejected";
  return "unknown";
}

/** A metafield can hold one line; keep it short and flat. */
const oneLine = (text, max = 250) => {
  const flat = String(text ?? "").replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
};

// ---- Shopify writes ----------------------------------------------------------

function shopifyWriter(cfg, deps) {
  const gql = (query, variables) => shopifyGraphQL(cfg.shopify, query, variables, deps.shopify ?? {});
  return {
    query: (query, variables) => gql(query, variables),
    setMetafields: (orderId, fields) =>
      gql(METAFIELDS_SET, {
        metafields: fields.map(({ key, value, compareDigest }) => ({
          ownerId: orderId,
          namespace: METAFIELD_NAMESPACE,
          key,
          type: METAFIELD_TYPE,
          value,
          // Present only for the claim. An explicit null means "this
          // metafield must not exist yet" (Shopify's compare-and-set).
          ...(compareDigest !== undefined ? { compareDigest } : {}),
        })),
      }),
    addTags: (orderId, tags) => gql(TAGS_ADD, { id: orderId, tags }),
    removeTags: (orderId, tags) => gql(TAGS_REMOVE, { id: orderId, tags }),
    /** Appends one line to the note, once (a repeat is not appended). */
    appendNote: (order, line) => {
      const note = order.note ?? "";
      if (note.includes(line)) return Promise.resolve(null);
      return gql(ORDER_NOTE_UPDATE, {
        input: { id: order.id, note: note ? `${note}\n${line}` : line },
      });
    },
    fulfill: (fulfillment) => gql(FULFILLMENT_CREATE, { fulfillment }),
  };
}

// ---- One order: shared by the sweep and the webhook ---------------------------

function newSummary() {
  return {
    checked: 0,
    submitted: 0,
    failed: 0,
    skipped: {},
    tracked: 0,
    // Extra detail beyond the four headline numbers.
    stuck: 0, // atd-sending too long -> atd-failed (unknown outcome)
    reconciled: 0, // atd-sending with a PO on file -> atd-submitted
    inbound: 0, // ship-to-store tracking recorded
    placeOrder: "on", // "not-configured" while ENDPOINTS.placeOrder is null
    tracking: "on", // "not-configured" while ENDPOINTS.orderStatus is null
    more: false, // more orders were waiting than one sweep takes
    errors: [], // Shopify or ATD problems that did not fit anywhere else
  };
}

const bump = (summary, reason) => {
  summary.skipped[reason] = (summary.skipped[reason] ?? 0) + 1;
};

/**
 * The Shopify writer plus the helpers that record an ATD outcome on an
 * order, bound to one run (a sweep, or one webhook delivery) and its
 * summary. Both paths place orders through `placeOne`, so the claim, the
 * single ATD call and the order of writes are the same code.
 */
function forwarderRun(cfg, deps, summary) {
  const now = deps.now ?? Date.now;
  const log = deps.log ?? console;
  const atdDeps = deps.atd ?? {};
  const shop = shopifyWriter(cfg, deps);

  const stamp = (text) => `ATD forwarder ${new Date(now()).toISOString()}: ${text}`;

  // Marks an order atd-failed. The error goes in the metafield first, so an
  // order never carries the tag without the reason. Order of writes:
  // metafield atd_error -> tag atd-failed -> note -> remove atd-sending
  // (the last only when the order was claimed).
  async function markFailed(order, message, { claimed = true } = {}) {
    const text = oneLine(message);
    await shop.setMetafields(order.id, [{ key: METAFIELD_KEYS.error, value: text }]);
    await shop.addTags(order.id, [TAGS.failed]);
    try {
      await shop.appendNote(order, stamp(`NOT placed with ATD — ${text}`));
    } catch (err) {
      summary.errors.push(`${order.name}: could not add the failure to the note (${err.message})`);
    }
    if (claimed) await shop.removeTags(order.id, [TAGS.sending]);
    summary.failed += 1;
    log.error(`[atd-forwarder] ${order.name} -> atd-failed: ${text}`);
  }

  // Marks an order atd-submitted. The PO goes in the metafield FIRST: if the
  // run dies after that, the STUCK pass finds the PO and knows ATD has the
  // order. atd-submitted is added BEFORE atd-sending is removed, so the
  // order is never without a tag that keeps it out of the SUBMIT query.
  async function markSubmitted(order, po) {
    await shop.setMetafields(order.id, [{ key: METAFIELD_KEYS.po, value: oneLine(po) }]);
    await shop.addTags(order.id, [TAGS.submitted]);
    try {
      await shop.appendNote(order, stamp(`placed with ATD, PO ${po}`));
    } catch (err) {
      summary.errors.push(`${order.name}: ATD PO ${po} saved, but the note was not updated (${err.message})`);
    }
    await shop.removeTags(order.id, [TAGS.sending]);
  }

  /**
   * Places one order that skipReason() has already cleared: build the ATD
   * order, claim, send exactly once, record. Returns "submitted", "failed"
   * or "claimed-elsewhere" (another run holds the claim: left alone), and
   * throws only when a Shopify write fails before ATD was called.
   */
  async function placeOne(order) {
    // Problems with the order itself fail it without touching ATD.
    let atdOrder;
    try {
      atdOrder = toAtdOrder(order);
    } catch (err) {
      if (!(err instanceof ForwarderOrderError)) throw err;
      await markFailed(order, err.message, { claimed: false });
      return "failed";
    }

    // CLAIM. Compare-and-set on atd_sending_at against the digest read a
    // moment ago (null = must not exist yet). If another run got there
    // first, Shopify refuses and this run leaves the order.
    try {
      await shop.setMetafields(order.id, [{
        key: METAFIELD_KEYS.sendingAt,
        value: new Date(now()).toISOString(),
        compareDigest: order.sendingLock?.compareDigest ?? null,
      }]);
    } catch (err) {
      bump(summary, "claimed-elsewhere");
      log.warn(`[atd-forwarder] ${order.name}: claim refused, leaving it (${err.message})`);
      return "claimed-elsewhere";
    }
    await shop.addTags(order.id, [TAGS.sending]);

    // SEND. Exactly once.
    let po;
    try {
      ({ po } = await placeAtdOrder(atdOrder, cfg.atd, atdDeps));
    } catch (err) {
      const outcome = classifyAtdOrderError(err);
      await markFailed(
        order,
        outcome === "unknown"
          ? `${UNKNOWN_OUTCOME}. ${err.message}`
          : `ATD rejected the order. ${err.message}`,
      );
      return "failed";
    }

    try {
      await markSubmitted(order, po);
    } catch (err) {
      // ATD HAS the order. Say so loudly with the PO; the STUCK pass
      // finishes the tags (or, if even the PO did not save, turns it into an
      // unknown-outcome failure — never a resend).
      summary.errors.push(`${order.name}: placed with ATD as PO ${po}, but Shopify was not fully updated (${err.message})`);
      log.error(`[atd-forwarder] ${order.name} placed with ATD as PO ${po}; Shopify update failed:`, err.message);
    }
    summary.submitted += 1;
    return "submitted";
  }

  return { shop, stamp, log, now, atdDeps, markFailed, markSubmitted, placeOne };
}

// ---- The sweep ----------------------------------------------------------------

/**
 * One sweep. `cfg` is getConfig()'s result; `deps`:
 *   shopify  deps for shopifyGraphQL (fetchImpl, retryDelayMs, ...)
 *   atd      deps for the ATD calls (fetchImpl, endpoints, ...)
 *   now      () => epoch ms
 *   log      console-like
 *   budgetMs time after which no new ATD call is started
 * Returns the summary; never throws for a single order's problem.
 */
export async function sweep(cfg, deps = {}) {
  const now = deps.now ?? Date.now;
  const log = deps.log ?? console;
  const budgetMs = deps.budgetMs ?? SWEEP_BUDGET_MS;
  const atdDeps = deps.atd ?? {};
  const endpoints = atdDeps.endpoints ?? ATD_ENDPOINTS;
  const summary = newSummary();
  const { shop, stamp, markFailed, placeOne } = forwarderRun(cfg, deps, summary);
  const started = now();
  const overBudget = () => now() - started > budgetMs;

  // ---- 1. STUCK -------------------------------------------------------------
  try {
    const data = await shop.query(ORDERS_QUERY, { query: stuckSearch(now()), first: BATCH_SIZE });
    for (const order of data?.orders?.nodes ?? []) {
      if (!hasTag(order, TAGS.sending) || hasTag(order, TAGS.submitted) || hasTag(order, TAGS.failed)) continue;
      const po = order.atdPo?.value;
      const since = Date.parse(order.sendingLock?.value ?? "");
      try {
        if (po) {
          // ATD answered and the PO was saved; only the tags were not
          // finished. ATD has this order.
          await shop.addTags(order.id, [TAGS.submitted]);
          await shop.removeTags(order.id, [TAGS.sending]);
          summary.reconciled += 1;
        } else if (!Number.isFinite(since) || now() - since > STUCK_AFTER_MS) {
          // No timestamp (tag added by hand, or the claim half-written) or
          // older than 30 minutes: nobody knows what ATD did.
          await markFailed(
            order,
            `${UNKNOWN_OUTCOME}. A sweep started sending this order${Number.isFinite(since) ? ` at ${new Date(since).toISOString()}` : ""} and never recorded ATD's answer.`,
          );
          summary.stuck += 1;
        }
        // Younger than 30 minutes: a sweep may still be working on it.
      } catch (err) {
        summary.errors.push(`${order.name}: stuck-order cleanup failed (${err.message})`);
      }
    }
  } catch (err) {
    summary.errors.push(`stuck-order query failed (${err.message})`);
  }

  // ---- 2. SUBMIT ------------------------------------------------------------
  if (!endpoints.placeOrder) {
    // Not one claim or tag: an unconfigured endpoint must not mark every
    // paid order atd-failed.
    summary.placeOrder = "not-configured";
  } else {
    let orders = [];
    try {
      const data = await shop.query(ORDERS_QUERY, { query: submitSearch(now()), first: BATCH_SIZE });
      orders = data?.orders?.nodes ?? [];
      summary.more = Boolean(data?.orders?.pageInfo?.hasNextPage);
    } catch (err) {
      summary.errors.push(`order query failed (${err.message})`);
    }

    for (const order of orders) {
      summary.checked += 1;
      const reason = skipReason(order, { forwardTestOrders: cfg.forwarder?.forwardTestOrders });
      if (reason) {
        bump(summary, reason);
        continue;
      }
      if (overBudget()) {
        bump(summary, "deferred");
        summary.more = true;
        continue;
      }
      try {
        await placeOne(order);
      } catch (err) {
        // A Shopify write failed before ATD was called (the claim tag, or
        // recording a pre-ATD failure). Nothing was sent; if the claim is
        // left half-done, the STUCK pass reports it.
        summary.errors.push(`${order.name}: ${err.message}`);
        log.error(`[atd-forwarder] ${order.name}:`, err.message);
      }
    }
  }

  // ---- 3. TRACK -------------------------------------------------------------
  if (!endpoints.orderStatus) {
    summary.tracking = "not-configured";
    return summary;
  }
  let tracked = [];
  try {
    const data = await shop.query(TRACKING_QUERY, { query: trackingSearch(now()), first: BATCH_SIZE });
    tracked = data?.orders?.nodes ?? [];
  } catch (err) {
    summary.errors.push(`tracking query failed (${err.message})`);
  }
  for (const order of tracked) {
    if (overBudget()) break;
    if (order.cancelledAt || !hasTag(order, TAGS.submitted) || hasTag(order, TAGS.inboundToStore)) continue;
    const po = order.atdPo?.value;
    if (!po) {
      summary.errors.push(`${order.name}: tagged ${TAGS.submitted} but has no ${METAFIELD_NAMESPACE}.${METAFIELD_KEYS.po}; tracking skipped`);
      continue;
    }
    try {
      const { tracking } = await getAtdOrderStatus(po, cfg.atd, atdDeps);
      if (!tracking.length) continue; // not shipped yet

      const company = tracking[0].company;
      const numbers = tracking.map((t) => t.number);
      const urls = tracking.map((t) => t.url).filter(Boolean);
      const delivery = (() => {
        try {
          return deliveryOf(order);
        } catch {
          return "ship";
        }
      })();

      if (delivery === "pickup") {
        // Ship-to-store: the tires are travelling to the shop, not to the
        // customer. Creating the fulfillment now would email the customer a
        // "shipped" notice with a tracking number for a delivery to the shop
        // and mark the order done before the install. Record it instead;
        // the shop fulfils the order in Shopify when the tires are fitted.
        const text = `${company ?? "carrier"} ${numbers.join(", ")}`;
        await shop.setMetafields(order.id, [{ key: METAFIELD_KEYS.tracking, value: oneLine(text) }]);
        await shop.appendNote(order, stamp(`ATD shipped to the shop: ${text}`));
        await shop.addTags(order.id, [TAGS.inboundToStore]);
        summary.inbound += 1;
        continue;
      }

      // Ship-to-home: fulfil every fulfillment order this app can fulfil.
      // With the merchant-managed scopes, only merchant-managed fulfillment
      // orders are returned at all.
      const fos = (order.fulfillmentOrders?.nodes ?? []).filter(
        (fo) =>
          (fo.status === "OPEN" || fo.status === "IN_PROGRESS") &&
          (fo.supportedActions ?? []).some((a) => a?.action === "CREATE_FULFILLMENT"),
      );
      if (!fos.length) {
        summary.errors.push(`${order.name}: ATD has tracking (${numbers.join(", ")}) but no open merchant-managed fulfillment order to fulfil`);
        continue;
      }
      const trackingInfo =
        numbers.length === 1
          ? { number: numbers[0], ...(urls[0] ? { url: urls[0] } : {}) }
          : { numbers, ...(urls.length === numbers.length ? { urls } : {}) };
      if (company) trackingInfo.company = company;
      await shop.fulfill({
        lineItemsByFulfillmentOrder: fos.map((fo) => ({ fulfillmentOrderId: fo.id })),
        trackingInfo,
        notifyCustomer: true,
      });
      summary.tracked += 1;
    } catch (err) {
      summary.errors.push(`${order.name}: tracking sync failed (${err.message})`);
    }
  }
  return summary;
}

// ---- The webhook path (api/webhooks/shopify.js) ----------------------------------

async function readOrder(shop, orderId) {
  const data = await shop.query(ORDER_QUERY, { id: orderId });
  return data?.order ?? null;
}

/**
 * orders/paid: the SUBMIT pass for ONE order, right away instead of at the
 * next sweep. Same rules: only vercel-live orders, the same skipReason()
 * (paid, risk ACCEPT with nothing PENDING, not fraud-review, no atd-* tag,
 * unfulfilled, not a test order), the same claim and the single ATD call.
 * A skipped order is left untouched, so the sweep looks at it again (a
 * risk assessment still pending is the usual case).
 *
 * The caller checks the kill switch and that ATD is live. Resolves
 * `{ result: "submitted" | "failed" | "skipped", reason?, order?, summary }`;
 * throws only when Shopify cannot be read or written before ATD is called.
 */
export async function forwardOrder(cfg, orderId, deps = {}) {
  const summary = newSummary();
  const endpoints = (deps.atd ?? {}).endpoints ?? ATD_ENDPOINTS;
  if (!endpoints.placeOrder) {
    return { result: "skipped", reason: "place-order-not-configured", summary };
  }
  const run = forwarderRun(cfg, deps, summary);
  const order = await readOrder(run.shop, orderId);
  if (!order) return { result: "skipped", reason: "not-found", summary };
  summary.checked = 1;
  if (!hasTag(order, TAGS.live)) {
    return { result: "skipped", reason: "not-vercel-live", order: order.name, summary };
  }
  const reason = skipReason(order, { forwardTestOrders: cfg.forwarder?.forwardTestOrders });
  if (reason) return { result: "skipped", reason, order: order.name, summary };
  const result = await run.placeOne(order);
  return result === "claimed-elsewhere"
    ? { result: "skipped", reason: result, order: order.name, summary }
    : { result, order: order.name, summary };
}

/**
 * Whether ATD has, or may have, this order: submitted, mid-send, a PO on
 * file, or failed with an unknown outcome.
 */
export function atdMayHaveOrder(order) {
  return (
    hasTag(order, TAGS.submitted) ||
    hasTag(order, TAGS.sending) ||
    Boolean(order.atdPo?.value) ||
    (hasTag(order, TAGS.failed) && String(order.atdError?.value ?? "").startsWith(UNKNOWN_OUTCOME))
  );
}

/**
 * orders/cancelled. When ATD has (or may have) the order, ask ATD to cancel
 * it — only when ATD is live and ENDPOINTS.cancelOrder is confirmed; one
 * attempt — and tag it atd-cancel-needed either way, with a note saying
 * what was tried, so Flow workflow 4 or a person confirms it at ATD. When
 * nothing went to ATD, tag it cancelled-before-atd. A repeat delivery finds
 * the tag and does nothing.
 *
 * Resolves `{ result, order?, atdCancel? }`; `result` is "cancel-needed",
 * "cancelled-before-atd" or "skipped" (with `reason`).
 */
export async function handleOrderCancelled(cfg, orderId, deps = {}) {
  const summary = newSummary();
  const endpoints = (deps.atd ?? {}).endpoints ?? ATD_ENDPOINTS;
  const run = forwarderRun(cfg, deps, summary);
  const order = await readOrder(run.shop, orderId);
  if (!order) return { result: "skipped", reason: "not-found" };
  if (!hasTag(order, TAGS.live)) return { result: "skipped", reason: "not-vercel-live", order: order.name };
  if (hasTag(order, TAGS.cancelNeeded) || hasTag(order, TAGS.cancelledBeforeAtd)) {
    return { result: "skipped", reason: "already-handled", order: order.name };
  }

  if (!atdMayHaveOrder(order)) {
    await run.shop.addTags(order.id, [TAGS.cancelledBeforeAtd]);
    return { result: "cancelled-before-atd", order: order.name };
  }

  const po = order.atdPo?.value ?? null;
  let atdCancel;
  let line;
  if (!(cfg.atd?.mode === "live" && cfg.atd.ok)) {
    atdCancel = "atd-not-live";
    line = "order cancelled in Shopify; ATD is not live here, so nothing was sent. Cancel it at ATD by hand.";
  } else if (!endpoints.cancelOrder) {
    atdCancel = "not-configured";
    line = `order cancelled in Shopify; cancel ${po ? `ATD PO ${po}` : "it"} at ATD by hand (the ATD cancel endpoint is not configured).`;
  } else if (!po) {
    atdCancel = "no-po";
    line = "order cancelled in Shopify, but no ATD PO is on file (outcome unknown). Check ATD and cancel it there by hand.";
  } else {
    try {
      await cancelAtdOrder(po, cfg.atd, run.atdDeps);
      atdCancel = "requested";
      line = `order cancelled in Shopify; asked ATD to cancel PO ${po}. Confirm at ATD.`;
    } catch (err) {
      atdCancel = "failed";
      line = `order cancelled in Shopify; ATD did not take the cancellation of PO ${po} (${oneLine(err.message, 120)}). Cancel it at ATD by hand.`;
    }
  }
  // The tag first: it is what Flow and a person act on.
  await run.shop.addTags(order.id, [TAGS.cancelNeeded]);
  try {
    await run.shop.appendNote(order, run.stamp(line));
  } catch (err) {
    run.log.error(`[atd-forwarder] ${order.name}: could not add the cancellation to the note (${err.message})`);
  }
  run.log.warn(`[atd-forwarder] ${order.name} -> ${TAGS.cancelNeeded} (${atdCancel})`);
  return { result: "cancel-needed", order: order.name, atdCancel };
}
