// The vehicle, the sizes and where the size came from, on the Shopify order.
//
// Checkout sends an optional `fitment` ({ vehicle?, front?, rear?, source? },
// src/data/sizeSource.js). readFitment keeps only what checks out (a bad
// field is dropped, never an error: an order is never refused over it), and
// orderFitment then checks the CART against those sizes itself, on the
// server's own priced lines, so the shop does not depend on the browser's
// answer. The draft order (api/_lib/shopify.js) gets:
//
//   attributes  Vehicle, Size source, Front size, Rear size, Fitment
//   tags        fitment-check   a tire in the cart is not the shopper's size,
//                               or a staggered car has only one of its sizes
//               staggered       front and rear sizes differ
//               size-scanned    the size came from the photo scanner
//               fitment-unconfirmed  a vehicle with no size on file
//
// and the order-request lead lists the same lines. The Shopify Flow
// "Fitment check + scanner tags" (docs/business/shopify-admin-prompts.md,
// prompt 26) holds fitment-check orders and emails info@. Nothing personal
// is added: no photo and no VIN, only the vehicle label and sizes.

import { readSize } from "../../src/data/fitmentCheck.js";

/** Accepted sources and the words the order shows ("Scanned…" = scanner). */
export const SIZE_SOURCE_LABELS = Object.freeze({
  "scan-door": "Scanned door sticker",
  "scan-sidewall": "Scanned tire sidewall",
  vin: "VIN lookup",
  typed: "Typed size",
  "door-jamb": "Door-jamb size entered",
  vehicle: "Vehicle lookup (typical size)",
});

export const FITMENT_TAGS = Object.freeze({
  check: "fitment-check",
  staggered: "staggered",
  scanned: "size-scanned",
  unconfirmed: "fitment-unconfirmed",
});

const VEHICLE = /^[\p{L}\p{N} .,'&()/+-]{2,80}$/u;
const MAX_VALUE = 250;

const clip = (s) => (s.length > MAX_VALUE ? `${s.slice(0, MAX_VALUE - 1)}…` : s);

/**
 * The checked `fitment` from a checkout body, or null when nothing usable was
 * sent: `{ vehicle, front, rear, source }` with sizes in display form
 * ("225/40R19"), each field null when missing or not valid.
 */
export function readFitment(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const str = (v) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");
  const vehicle = VEHICLE.test(str(raw.vehicle)) ? str(raw.vehicle) : null;
  const front = readSize(str(raw.front).slice(0, 40));
  const rearRead = front ? readSize(str(raw.rear).slice(0, 40)) : null;
  const rear = rearRead && rearRead.key !== front.key ? rearRead : null;
  const source = Object.hasOwn(SIZE_SOURCE_LABELS, raw.source) ? raw.source : null;
  if (!vehicle && !front) return null;
  return {
    vehicle,
    front: front?.display ?? null,
    rear: rear?.display ?? null,
    source,
  };
}

/**
 * The order's fitment, checked against its priced lines, or null when the
 * shopper gave none:
 *   { vehicle, front, rear, source, sourceLabel, status, summary, tags }
 * status: "match" | "staggered" | "check" | "unconfirmed" | "no-tires"
 */
export function orderFitment(fitment, lines) {
  if (!fitment) return null;
  const { vehicle, front, rear, source } = fitment;
  const tags = new Set();
  if (source?.startsWith("scan-")) tags.add(FITMENT_TAGS.scanned);

  const tires = (lines ?? [])
    .map((l) => ({ read: readSize(String(l?.size ?? "")), qty: Number(l?.qty) || 0 }))
    .filter((l) => l.read);
  const count = (key) => tires.filter((l) => l.read.key === key).reduce((n, l) => n + l.qty, 0);

  let status;
  let summary;
  if (!tires.length) {
    status = "no-tires";
    summary = "NO TIRES in the cart: check wheel fitment by phone.";
  } else if (!front) {
    status = "unconfirmed";
    summary = "UNCONFIRMED: no tire size on file for this vehicle. Confirm the size by phone before ordering.";
    tags.add(FITMENT_TAGS.unconfirmed);
  } else {
    const f = readSize(front);
    const r = rear ? readSize(rear) : null;
    const allowed = new Set([f.key, r?.key].filter(Boolean));
    const strays = [...new Set(tires.filter((l) => !allowed.has(l.read.key)).map((l) => l.read.display))];
    if (r) tags.add(FITMENT_TAGS.staggered);
    if (strays.length) {
      status = "check";
      summary = `CHECK: the cart has ${strays.join(", ")}, but the size on file is ${
        r ? `${f.display} front + ${r.display} rear` : f.display
      }. Confirm with the customer before ordering.`;
    } else if (r && (!count(f.key) || !count(r.key))) {
      status = "check";
      summary = `CHECK: staggered car (${f.display} front + ${r.display} rear), but the cart has only ${
        count(f.key) ? "the front" : "the rear"
      } size. Confirm with the customer before ordering.`;
    } else if (r) {
      status = "staggered";
      summary = `STAGGERED: ${count(f.key)} front ${f.display} + ${count(r.key)} rear ${r.display}.`;
    } else {
      status = "match";
      summary = `OK: the cart matches ${f.display}.`;
    }
  }
  if (status === "check") tags.add(FITMENT_TAGS.check);

  return {
    vehicle,
    front,
    rear,
    source,
    sourceLabel: source ? SIZE_SOURCE_LABELS[source] : null,
    status,
    summary: clip(summary),
    tags: [...tags],
  };
}

/** The draft order's custom attributes for an order's fitment. */
export function fitmentAttributes(fit) {
  if (!fit) return [];
  return [
    fit.vehicle ? { key: "Vehicle", value: clip(fit.vehicle) } : null,
    fit.sourceLabel ? { key: "Size source", value: fit.sourceLabel } : null,
    fit.front ? { key: "Front size", value: fit.front } : null,
    fit.rear ? { key: "Rear size", value: fit.rear } : null,
    { key: "Fitment", value: fit.summary },
  ].filter(Boolean);
}

/** [label, value] lines for the order-request lead and the draft note. */
export function fitmentFields(fit) {
  if (!fit) return [["Fitment", "NOT GIVEN: the shopper picked tires without a vehicle or size. Confirm the size by phone."]];
  return [
    fit.vehicle ? ["Vehicle", fit.vehicle] : null,
    fit.front ? ["Size on file", fit.rear ? `${fit.front} front + ${fit.rear} rear` : fit.front] : null,
    fit.sourceLabel ? ["Size source", fit.sourceLabel] : null,
    ["Fitment", fit.summary],
  ].filter(Boolean);
}
