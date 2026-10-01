/**
 * Does this tire fit what the shopper is shopping for?
 *
 * One answer for every surface that sells a tire (the cards, the product
 * page, Compare, the cart and checkout's review), so they can never disagree:
 *
 *   fits    the tire's size is the factory size on file for the vehicle (or
 *           the size the shopper is shopping for). An alternate counts only
 *           when the data lists it; a plus size is never inferred.
 *   no-fit  the size does not match. The Add buttons go away.
 *   check   nothing chosen yet, no size on file for that vehicle or year, a
 *           size that depends on the trim, or the same dimensions on a
 *           different casing (P-metric vs LT). Never blocks a purchase.
 *
 * Pure functions, no React and no storage, so the same code runs in the
 * prerender, the browser and the tests (fitmentCheck.test.mjs). The tables
 * can be passed in, which is how the tests exercise trims and staggered
 * fitments the shipped tables do not carry yet (see FITMENT_TRIMS).
 *
 * Wording rules: a fit is always said with what it is based on ("Matches the
 * typical factory size on file for a 2019 Toyota Tacoma"), and nothing here
 * calls a tire safe, OK, fine or guaranteed. The page adds "We confirm
 * fitment before your order ships" next to every answer.
 */

import { FITMENT, FITMENT_TRIMS, FITMENT_YEARS } from "./fitment.js";

export const SHIPPED_TABLES = Object.freeze({
  base: FITMENT,
  years: FITMENT_YEARS,
  trims: FITMENT_TRIMS,
});

/* ------------------------------------------------------------------ *
 * Sizes
 * ------------------------------------------------------------------ */

const METRIC =
  /^(P|LT|ST|T)?\s*(\d{3})\s*\/\s*(\d{2,3})\s*([A-Z]{0,2})(R|D|B|-)\s*(\d{2}(?:\.\d)?)(?:\s*(LT|C))?(?![\d.])/;
const FLOTATION =
  /^(\d{2}(?:\.\d+)?)\s*X\s*(\d{1,2}(?:\.\d+)?)\s*(?:R|D|B|-)?\s*(\d{2}(?:\.\d)?)(?:\s*(LT|P))?(?![\d.])/;

/**
 * A size marking read for matching, or null when it is not a size.
 *
 *   key      what two sizes must share to be the same size: "225/45R17",
 *            "33x12.5R20". A speed rating marked inline (225/45ZR17), a
 *            load/speed description after it (94W, 121/118S) and the P
 *            prefix do not change the size, so they are not in the key.
 *   display  the size as written, tidied: "225/45R17", "LT265/70R17",
 *            "33x12.50R20LT".
 *   service  "P", "LT" (LT prefix or suffix, a flotation size, or the euro
 *            "C" commercial suffix) or "ST" when the marking says so; null
 *            when it does not (a bare 245/75R16).
 */
export function readSize(input) {
  if (input == null) return null;
  const s = String(input).toUpperCase().trim();
  if (!s) return null;

  const m = METRIC.exec(s);
  if (m) {
    const [, prefix, width, aspect, , , rim, suffix] = m;
    const service =
      prefix === "LT" || suffix === "LT" || suffix === "C"
        ? "LT"
        : prefix === "ST"
          ? "ST"
          : prefix === "P"
            ? "P"
            : null;
    const core = `${width}/${aspect}R${rim}`;
    return {
      format: "metric",
      key: core,
      display: `${prefix === "LT" || prefix === "ST" ? prefix : ""}${core}${suffix ?? ""}`,
      service,
      width: Number(width),
      aspect: Number(aspect),
      rimDiameter: Number(rim),
    };
  }

  const f = FLOTATION.exec(s);
  if (f) {
    const [, diameter, widthIn, rim] = f;
    return {
      format: "flotation",
      key: `${Number(diameter)}x${Number(widthIn)}R${Number(rim)}`,
      display: `${diameter}x${widthIn}R${rim}LT`,
      // Flotation sizes are light-truck sizes whether or not the LT is printed.
      service: "LT",
      width: null,
      aspect: null,
      rimDiameter: Number(rim),
    };
  }
  return null;
}

/**
 * The size to check for a product or a cart line. A dual load index
 * (120/116) is only ever stamped on a light-truck or commercial casing, so
 * it marks the tire LT even where the catalog's size string leaves the LT
 * off ("245/75R16", load "120/116").
 */
export function fitSizeOf(item) {
  const size = String(item?.size ?? "").trim();
  const read = readSize(size);
  const dual = /^\d{2,3}\/\d{2,3}$/.test(String(item?.loadIndex ?? "").trim());
  return read && !read.service && dual ? `LT${size}` : size;
}

/** True when both markings are the same size. */
export const sameSize = (a, b) => {
  const x = readSize(a);
  const y = readSize(b);
  return Boolean(x && y && x.key === y.key);
};

/** The /tires query that filters to one size, or null for a flotation size. */
export function sizeSearch(size) {
  const s = readSize(size);
  if (!s || s.format !== "metric") return null;
  return `/tires?w=${s.width}&a=${s.aspect}&d=${s.rimDiameter}`;
}

/* ------------------------------------------------------------------ *
 * The selection
 * ------------------------------------------------------------------ */

const text = (v) =>
  typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();

/** "2019 Toyota Tacoma" */
export const vehicleLabel = (v) =>
  [text(v?.year), text(v?.make), text(v?.model)].filter(Boolean).join(" ");

function findKey(table, make, model) {
  const exact = `${make}|${model}`;
  if (table[exact]) return exact;
  const lower = exact.toLowerCase();
  return Object.keys(table).find((k) => k.toLowerCase() === lower) ?? null;
}

/**
 * The factory sizes on file for a vehicle in a model year.
 *
 *   { status: "sized", basis: "trim" | "typical", options: [...] }
 *   { status: "no-year" }    the model is on file, but not that year (or no
 *                            year was given): no size is guessed
 *   { status: "no-record" }  the make and model are not on file at all
 *
 * Trim rows (FITMENT_TRIMS) win for the years they cover. Otherwise the
 * year table's one mainstream-trim size, said to be the typical size.
 * A model with no year rows at all falls back to the year-agnostic table.
 */
export function factorySizes(vehicle, tables = SHIPPED_TABLES) {
  const make = text(vehicle?.make);
  const model = text(vehicle?.model);
  const year = Number(text(vehicle?.year));
  if (!make || !model) return { status: "no-record" };

  const trimKey = findKey(tables.trims ?? {}, make, model);
  if (trimKey && year) {
    const gen = tables.trims[trimKey].find(([a, b]) => year >= a && year <= b);
    if (gen && gen[2]?.length) {
      return {
        status: "sized",
        basis: "trim",
        options: gen[2].map((o) => ({
          trim: o.trim ?? null,
          front: o.front,
          rear: o.rear && !sameSize(o.rear, o.front) ? o.rear : null,
          alternates: Array.isArray(o.alternates) ? o.alternates : [],
        })),
      };
    }
  }

  const baseKey = findKey(tables.base ?? {}, make, model);
  const yearKey = findKey(tables.years ?? {}, make, model);
  if (!baseKey && !yearKey && !trimKey) return { status: "no-record" };
  if (!yearKey) {
    if (!baseKey) return { status: "no-year" };
    const size = tables.base[baseKey][0];
    return {
      status: "sized",
      basis: "typical",
      options: [{ trim: null, front: size, rear: null, alternates: [] }],
    };
  }
  if (!year) return { status: "no-year" };
  const gen = tables.years[yearKey].find(([a, b]) => year >= a && year <= b);
  if (!gen) return { status: "no-year" };
  return {
    status: "sized",
    basis: "typical",
    options: [{ trim: null, front: gen[2], rear: null, alternates: [] }],
  };
}

const optionId = (o) =>
  `${readSize(o.front)?.key ?? o.front}|${o.rear ? (readSize(o.rear)?.key ?? o.rear) : ""}`;

/**
 * What the shopper is shopping for, worked out against the tables.
 *
 * `selection` is what the store keeps (src/context/VehicleContext.jsx):
 *   null
 *   { type: "size", size }
 *   { type: "vehicle", year, make, model, pick?, size? }
 *     pick  the option the shopper chose when the trims differ (optionId)
 *     size  a size the shopper gave for this vehicle (off the sidewall)
 *
 * Returns { kind: "none" } | { kind: "size", size } |
 *   { kind: "vehicle", label, vehicle, status, basis, options, chosen }
 * where `chosen` is the one option every answer is measured against, or
 * null while the trims differ and nothing is picked.
 */
export function resolveSelection(selection, tables = SHIPPED_TABLES) {
  if (!selection || typeof selection !== "object") return { kind: "none" };

  if (selection.type === "size") {
    const size = readSize(selection.size);
    return size ? { kind: "size", size } : { kind: "none" };
  }

  if (selection.type !== "vehicle") return { kind: "none" };
  const vehicle = {
    year: text(selection.year),
    make: text(selection.make),
    model: text(selection.model),
  };
  if (!vehicle.year || !vehicle.make) return { kind: "none" };
  const label = vehicleLabel(vehicle);

  const own = readSize(selection.size);
  if (own) {
    const option = {
      trim: null,
      front: own.display,
      rear: null,
      alternates: [],
    };
    return {
      kind: "vehicle",
      label,
      vehicle,
      status: "sized",
      basis: "entered",
      options: [option],
      chosen: option,
    };
  }

  const found = vehicle.model
    ? factorySizes(vehicle, tables)
    : { status: "no-record" };
  if (found.status !== "sized") {
    return {
      kind: "vehicle",
      label,
      vehicle,
      status: found.status,
      basis: null,
      options: [],
      chosen: null,
    };
  }

  // Trims that share a size are one choice as far as fitment goes.
  const distinct = [];
  found.options.forEach((o) => {
    if (!distinct.some((d) => optionId(d) === optionId(o))) distinct.push(o);
  });
  const picked = selection.pick
    ? (found.options.find((o) => optionId(o) === selection.pick) ?? null)
    : null;
  const chosen = picked ?? (distinct.length === 1 ? found.options[0] : null);
  return {
    kind: "vehicle",
    label,
    vehicle,
    status: "sized",
    basis: found.basis,
    options: found.options,
    choices: distinct,
    chosen,
  };
}

export { optionId };

/** The sizes a resolved vehicle takes, front then rear, without repeats. */
export function sizesOf(resolved) {
  if (resolved?.kind === "size") return [resolved.size.display];
  if (resolved?.kind !== "vehicle") return [];
  const list = resolved.chosen ? [resolved.chosen] : resolved.options;
  const out = [];
  list.forEach((o) =>
    [o.front, o.rear].filter(Boolean).forEach((s) => {
      if (!out.some((x) => sameSize(x, s))) out.push(s);
    }),
  );
  return out;
}

/** "245/75R16", "front 225/40R19, rear 255/35R19", "205/55R16 or 225/45R17" */
export function describeOption(o) {
  return o.rear ? `front ${o.front}, rear ${o.rear}` : o.front;
}

/** What the "Shopping for" bar prints after the vehicle, without brackets. */
export function selectionSizeText(resolved) {
  if (resolved?.kind === "size") return resolved.size.display;
  if (resolved?.kind !== "vehicle") return "";
  if (resolved.status !== "sized") return "factory size not on file";
  if (resolved.chosen) return describeOption(resolved.chosen);
  return `${(resolved.choices ?? resolved.options).map(describeOption).join(" or ")}, by trim`;
}

/* ------------------------------------------------------------------ *
 * The answer for one tire
 * ------------------------------------------------------------------ */

/**
 * Same size, but is it the same kind of casing? A bare size and a P-metric
 * one are the same tire as far as the data can tell; a light-truck (LT)
 * marking on only one side is not, because the load range and pressures
 * differ. Returns null when nothing stands in the way, "trailer" for an ST
 * tire on a vehicle, or "casing" for LT on one side only.
 */
const heavy = (service) => service === "LT" || service === "ST";
function casingClash(tire, oe) {
  if (tire.service === "ST" && oe.service !== "ST") return "trailer";
  if (heavy(tire.service) !== heavy(oe.service)) return "casing";
  return null;
}

/**
 * Which part of an option a tire matches: "both", "front", "rear",
 * "alternate", or null.
 */
function matchOption(tire, o) {
  const front = readSize(o.front);
  const rear = o.rear ? readSize(o.rear) : null;
  if (front && front.key === tire.key) {
    return { axle: rear ? "front" : "both", oe: front };
  }
  if (rear && rear.key === tire.key) return { axle: "rear", oe: rear };
  const alt = (o.alternates ?? [])
    .map(readSize)
    .find((a) => a && a.key === tire.key);
  return alt ? { axle: "alternate", oe: alt } : null;
}

const CHECK = "check";

/**
 * The fitment answer for one tire size against a resolved selection:
 *
 *   { status: "fits" | "no-fit" | "check", code, title, detail,
 *     axle, sizes, choices }
 *
 * `title` is the short badge text; `detail` says what it is based on.
 * `sizes` are the sizes the selection takes, for "See tires that fit";
 * `choices` (some-trims only) are the options to pick between.
 */
export function checkFit(tireSize, resolved) {
  const kind = resolved?.kind ?? "none";
  const sizes = sizesOf(resolved);

  if (kind === "none") {
    return {
      status: CHECK,
      code: "no-selection",
      title: "Check fitment",
      detail:
        "Pick your vehicle or your tire size to see whether this tire fits.",
      axle: null,
      sizes,
    };
  }

  const tire = readSize(tireSize);
  if (!tire) {
    return {
      status: CHECK,
      code: "bad-size",
      title: "Check fitment",
      detail:
        "We couldn't read this tire's size. Call us and we will check it against your vehicle.",
      axle: null,
      sizes,
    };
  }

  if (kind === "size") {
    const want = resolved.size;
    if (want.key !== tire.key) {
      return {
        status: "no-fit",
        code: "mismatch",
        title: `Not your size (${want.display})`,
        detail: `This tire is ${tire.display}. You're shopping for ${want.display}.`,
        axle: null,
        sizes,
      };
    }
    const clash = casingClash(tire, want);
    if (clash) return casingAnswer(clash, tire, want, `your size`, sizes);
    return {
      status: "fits",
      code: "match",
      title: `Matches your size (${want.display})`,
      detail: `Same size as the ${want.display} you're shopping for.`,
      axle: "both",
      sizes,
    };
  }

  // A vehicle.
  const label = resolved.label;
  if (resolved.status === "no-record") {
    return {
      status: CHECK,
      code: "no-record",
      title: "Check fitment",
      detail: `We don't have the factory size for a ${label} on file. Read the size off your door-jamb sticker or sidewall, then shop by that size.`,
      axle: null,
      sizes,
    };
  }
  if (resolved.status === "no-year") {
    return {
      status: CHECK,
      code: "no-year",
      title: "Check fitment",
      detail: `We don't have a factory size on file for the ${label}. Read the size off your door-jamb sticker or sidewall, then shop by that size.`,
      axle: null,
      sizes,
    };
  }

  const options = resolved.chosen ? [resolved.chosen] : resolved.options;
  const hits = options
    .map((o) => ({ option: o, hit: matchOption(tire, o) }))
    .filter((x) => x.hit);

  if (hits.length === 0) {
    const onFile = options.map(describeOption).join(" or ");
    const whose =
      resolved.basis === "entered"
        ? `The size you gave us for your ${label} is ${onFile}.`
        : resolved.basis === "trim" && resolved.chosen?.trim
          ? `The factory size for your ${label} ${resolved.chosen.trim} is ${onFile}.`
          : options.length > 1
            ? `The factory sizes on file for a ${label} are ${onFile}.`
            : `The ${resolved.basis === "typical" ? "typical " : ""}factory size on file for a ${label} is ${onFile}.`;
    return {
      status: "no-fit",
      code: "mismatch",
      title: `Doesn't fit your ${label}`,
      detail: `This tire is ${tire.display}. ${whose}`,
      axle: null,
      sizes,
    };
  }

  // Trims differ and the shopper has not said which one: a tire that only
  // some of them take cannot be called a fit yet.
  if (!resolved.chosen && hits.length < options.length) {
    return {
      status: CHECK,
      code: "some-trims",
      title: "Fits some trims — confirm your size",
      detail: `The ${label} came with ${(resolved.choices ?? options).map(describeOption).join(" or ")} depending on trim. This tire is ${tire.display}. Check the size on your door-jamb sticker and pick it.`,
      axle: null,
      sizes,
      choices: resolved.choices ?? options,
    };
  }

  const { option, hit } = hits[0];
  const clash = casingClash(tire, hit.oe);
  if (clash)
    return casingAnswer(
      clash,
      tire,
      hit.oe,
      `the factory size for your ${label}`,
      sizes,
    );

  const trim = resolved.chosen?.trim ?? null;
  const who = trim ? `${label} ${trim}` : label;
  const basis =
    resolved.basis === "entered"
      ? `Matches the size you gave us for your ${label} (${hit.oe.display}).`
      : resolved.basis === "trim"
        ? resolved.chosen
          ? `Matches the factory size for your ${who} (${hit.oe.display}).`
          : `Matches the factory size for every ${label} trim on file (${hit.oe.display}).`
        : `Matches the typical factory size on file for a ${label} (${hit.oe.display}). Trims and options vary, so check the size on your door-jamb sticker.`;

  if (hit.axle === "front" || hit.axle === "rear") {
    const other = hit.axle === "front" ? option.rear : option.front;
    const otherAxle = hit.axle === "front" ? "rear" : "front";
    return {
      status: "fits",
      code: `match-${hit.axle}`,
      title: `Fits the ${hit.axle} of your ${who}`,
      detail: `Your ${who} is staggered: ${describeOption(option)}. This tire matches the factory ${hit.axle} size (${hit.oe.display}); the ${otherAxle} axle takes ${other}.`,
      axle: hit.axle,
      sizes,
    };
  }
  if (hit.axle === "alternate") {
    return {
      status: "fits",
      code: "match-alternate",
      title: `Fits your ${who}`,
      detail: `Matches an alternate size listed for your ${who} (${hit.oe.display}). The factory size is ${describeOption(option)}.`,
      axle: "both",
      sizes,
    };
  }
  return {
    status: "fits",
    code: "match",
    title:
      resolved.basis === "entered"
        ? `Matches your size (${hit.oe.display})`
        : `Fits your ${who}`,
    detail: basis,
    axle: "both",
    sizes,
  };
}

function casingAnswer(clash, tire, oe, against, sizes) {
  if (clash === "trailer") {
    return {
      status: "no-fit",
      code: "trailer",
      title: "Trailer tire — not for your vehicle",
      detail: `This is a trailer (ST) tire. Trailer tires are not made for a car, truck or SUV, even in ${against} (${oe.display}).`,
      axle: null,
      sizes,
    };
  }
  return {
    status: CHECK,
    code: "casing",
    title: "Check fitment",
    detail: heavy(tire.service)
      ? `Same dimensions as ${against} (${oe.display}), but this is a light-truck (LT) tire, built for heavier loads at higher pressures. Call us to confirm it suits your vehicle before you order.`
      : `Same dimensions as ${against} (${oe.display}), but that is a light-truck (LT) size and this tire is not marked LT. Call us to confirm the load range before you order.`,
    axle: null,
    sizes,
  };
}

/* ------------------------------------------------------------------ *
 * Compare
 * ------------------------------------------------------------------ */

/**
 * Whether the Compare table may crown a "Best" in its rows. Only tires of
 * one size are a like-for-like comparison: the cheapest set in a size that
 * does not go on the car is not a best pick. So:
 *
 *   mixed sizes            no crown, and the page says why
 *   one size, doesn't fit  no crown either
 *   one size otherwise     crown as usual
 *
 * Returns { crown, reason: null | "mixed-sizes" | "no-fit", sizes }.
 */
export function compareCrown(tireSizes, results = []) {
  const sizes = [];
  const keys = new Set();
  tireSizes.forEach((s) => {
    const r = readSize(s);
    const key = r?.key ?? `?${s}`;
    if (!keys.has(key)) {
      keys.add(key);
      sizes.push(r?.display ?? String(s ?? ""));
    }
  });
  if (keys.size > 1) return { crown: false, reason: "mixed-sizes", sizes };
  if (results.some((r) => r?.status === "no-fit")) {
    return { crown: false, reason: "no-fit", sizes };
  }
  return { crown: true, reason: null, sizes };
}
