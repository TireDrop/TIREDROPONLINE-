/**
 * Where the shopper's tire size came from, for the order: the Tire Size
 * Finder notes it when sizes are saved ("Scanned door sticker", "Typed
 * size"…), and checkout sends it with the vehicle and the sizes as the
 * order's `fitment` (api/_lib/validate.js readFitment). Shopify gets them as
 * order attributes (Vehicle, Size source, Front size, Rear size, Fitment),
 * which the "Fitment check + scanner tags" Flow reads.
 *
 * Kept under its own key, next to the vehicle store rather than inside it
 * (tiredrop.fitment.v1 keeps its shape). A note only counts while the store
 * still holds the same sizes, so changing the size later never mislabels it.
 * No photo, VIN or anything personal is kept: a source word and two sizes.
 */

import { readSize } from "./fitmentCheck.js";

const KEY = "tiredrop.sizesource.v1";

/** The sources the server accepts (api/_lib/validate.js SIZE_SOURCES). */
export const SIZE_SOURCES = Object.freeze([
  "scan-door",
  "scan-sidewall",
  "vin",
  "typed",
  "door-jamb",
  "vehicle",
]);

const keyOf = (size) => readSize(size)?.key ?? "";

/** Notes where these sizes came from. Storage failures are ignored. */
export function noteSizeSource(source, front, rear = "") {
  if (!SIZE_SOURCES.includes(source) || !keyOf(front)) return;
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ source, front: keyOf(front), rear: keyOf(rear) }),
    );
  } catch {
    // Private mode or storage off: the order just says less.
  }
}

function noted() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    return v && typeof v === "object" ? v : null;
  } catch {
    return null;
  }
}

/**
 * The `fitment` checkout sends for what the shopper is shopping for
 * (`resolved` from useVehicle), or null when there is nothing to send:
 *   { vehicle?, front?, rear?, source? }
 * `source` is the noted one when its sizes still match, else what the
 * selection itself says: a vehicle's typical size is "vehicle", a size the
 * shopper entered for a vehicle is "door-jamb", a size alone is "typed".
 */
export function fitmentPayload(resolved) {
  if (!resolved || resolved.kind === "none") return null;
  let vehicle = "";
  let front = "";
  let rear = "";
  let fallback = "";
  if (resolved.kind === "size") {
    front = resolved.size?.display ?? "";
    rear = resolved.rear?.display ?? "";
    fallback = "typed";
  } else if (resolved.kind === "vehicle") {
    vehicle = resolved.label ?? "";
    front = resolved.chosen?.front ?? "";
    rear = resolved.chosen?.rear ?? "";
    fallback = resolved.confirmed ? "door-jamb" : "vehicle";
  }
  const note = noted();
  const matches =
    note && keyOf(front) && note.front === keyOf(front) && (note.rear || "") === keyOf(rear);
  const out = {};
  if (vehicle) out.vehicle = vehicle;
  if (front) out.front = front;
  if (front && rear) out.rear = rear;
  if (front) out.source = matches ? note.source : fallback;
  else if (vehicle) out.source = "vehicle";
  return Object.keys(out).length ? out : null;
}
