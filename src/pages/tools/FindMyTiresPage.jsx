import React, { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Car,
  Check,
  CloudRain,
  CloudSun,
  Info,
  RotateCcw,
  Route,
  Ruler,
  SearchX,
  Snowflake,
  Trophy,
  Wallet,
} from "lucide-react";

import {
  Seo,
  PageHero,
  Breadcrumbs,
  Input,
  Section,
} from "../../components/ui/index.jsx";
import ProductCard from "../../components/shop/ProductCard.jsx";
import { TIRES } from "../../data/products.js";
import { fitmentForYear } from "../../data/fitment.js";
import {
  OTHER,
  OTHER_LABEL,
  YEARS,
  makesFor,
  useVehicleModels,
} from "../../data/vehicles.js";
import { useTireSearch } from "../../data/useApi.js";
import { RATING_AXES, ratingsFor } from "../../data/tireRatings.js";
import { compareSizes, parseSize } from "../../data/tireMath.js";
import { SET_SIZE, setPrice } from "../../data/pricing.js";
import { money } from "../../context/CartContext.jsx";

/* ------------------------------------------------------------------ *
 * The tire match quiz.
 *
 * Five questions, one screen each, ending in a ranked shortlist where every
 * pick states why it won in the shopper's own terms. The ranking is not a
 * sorted price list with a bow on it: the six rating axes are weighted by the
 * answers, anything genuinely disqualifying is filtered out first, and the
 * sentence under each pick is generated from the scores that actually moved
 * it up the list.
 *
 * Two honesty rules run through the whole file:
 *   1. A rating axis can be `null` — genuinely not rated. It is never scored
 *      as zero and never quietly dropped; it is excluded from the score and
 *      the exclusion is printed, with the share of the weighting it took.
 *   2. Nothing here is a road test. Every score is derived from published
 *      specs, and the page says so where a shopper is reading the numbers.
 * ------------------------------------------------------------------ */

/* ---------------------------- fitment ---------------------------- */

// What each vehicle class can sensibly wear. This is what makes a commercial
// E-load van tire impossible to recommend for a Camry.
const CLASS_RULES = {
  sedan: {
    label: "car",
    passenger: true,
    categories: ["All-Season", "Performance", "Winter"],
    why: "Commercial and light-truck tires are built on stiff D/E-load casings for payload, not for a car.",
  },
  sports: {
    label: "sports car",
    passenger: true,
    categories: ["Performance", "All-Season", "Winter"],
    why: "Commercial and light-truck casings are not made in performance-car fitments.",
  },
  crossover: {
    label: "crossover or SUV",
    passenger: true,
    categories: ["All-Season", "Performance", "Truck & SUV", "Winter"],
    why: "A crossover rides on a passenger casing — a D/E-load commercial tire would be punishing and is not a listed fitment.",
  },
  truck: {
    label: "truck or body-on-frame SUV",
    passenger: false,
    categories: ["Truck & SUV", "Commercial", "Winter"],
    why: "A truck needs a truck casing. Passenger touring tires are not load-rated for one.",
  },
  offroad: {
    label: "off-road truck",
    passenger: false,
    categories: ["Truck & SUV"],
    why: "Off-pavement means an all-terrain or hybrid tread on a light-truck casing.",
  },
  van: {
    label: "cargo van",
    passenger: false,
    categories: ["Commercial", "Truck & SUV"],
    why: "A loaded cargo van needs a commercial casing rated for the axle weight.",
  },
};

// The most common original fitment for each model in the vehicle selector.
// It is a starting point, not a VIN lookup: trims and model years move these
// around, so the size stays editable and the UI says where it came from.

/** When all we have is a size, the size itself is the only clue to the car. */
function classFromSize(p) {
  if (!p) return "sedan";
  if (p.format === "flotation" || p.service === "LT") return "truck";
  if (p.width >= 245 && p.aspect >= 60) return "truck";
  if (p.width >= 225 && p.aspect >= 58) return "crossover";
  if (p.aspect <= 45) return "sports";
  return "sedan";
}

/* ---------------------------- questions ---------------------------- */

const ROAD_OPTIONS = [
  {
    value: "highway",
    label: "Mostly highway",
    detail: "Long runs at 65–80. Noise and even wear are what you live with.",
  },
  {
    value: "city",
    label: "Mostly city",
    detail: "Stop-and-go, short trips, potholes, kerbs and wet crosswalks.",
  },
  {
    value: "mixed",
    label: "A bit of both",
    detail: "A commute with some of each — nothing dominates.",
  },
  {
    value: "dirt",
    label: "Off pavement",
    detail: "Gravel, dirt, sand or a job site, at least some of the week.",
  },
];

const WEATHER_OPTIONS = [
  {
    value: "warm",
    label: "It never freezes",
    detail: "Florida, Texas, southern California. Heat and hard rain, no snow.",
    icon: CloudRain,
  },
  {
    value: "cold",
    label: "Cold and wet",
    detail: "Frost and cold rain, the odd slushy morning, no real winter.",
    icon: CloudSun,
  },
  {
    value: "snow",
    label: "Real snow and ice",
    detail: "Plowed roads, packed snow, black ice. Winters that mean it.",
    icon: Snowflake,
  },
];

const PRIORITY_OPTIONS = [
  {
    value: "wear",
    axis: "wear",
    label: "Tread life",
    detail: "Miles before they are done.",
  },
  {
    value: "wet",
    axis: "wet",
    label: "Wet grip",
    detail: "Braking and cornering in the rain.",
  },
  {
    value: "quiet",
    axis: "quiet",
    label: "Quiet ride",
    detail: "No drone on the highway.",
  },
  {
    value: "comfort",
    axis: "comfort",
    label: "Comfort",
    detail: "Soaks up broken pavement.",
  },
  {
    value: "dry",
    axis: "dry",
    label: "Dry performance",
    detail: "Steering response and grip.",
  },
  {
    value: "price",
    axis: null,
    label: "Price",
    detail: "The cheapest set that still does the job.",
  },
];

const BUDGET_BANDS = [
  { value: "120", max: 120, label: "Up to $120 a tire" },
  { value: "180", max: 180, label: "Up to $180 a tire" },
  { value: "250", max: 250, label: "Up to $250 a tire" },
  { value: "any", max: Infinity, label: "No limit — show me the right tire" },
];

const bandFor = (value) => BUDGET_BANDS.find((b) => b.value === value) ?? null;

const AXIS_PHRASE = {
  dry: "dry grip",
  wet: "wet grip",
  winter: "snow and ice traction",
  comfort: "ride comfort",
  quiet: "quietness",
  wear: "tread life",
};

const AXIS_LABEL = Object.fromEntries(RATING_AXES.map((a) => [a.key, a.label]));

const ROAD_PHRASE = {
  highway: "the highway miles you described",
  city: "the city driving you described",
  mixed: "the mix of city and highway you described",
  dirt: "the off-pavement driving you described",
};

const WEATHER_PHRASE = {
  warm: "somewhere it never freezes",
  cold: "cold, wet winters",
  snow: "real snow and ice",
};

const STEPS = [
  {
    id: 1,
    eyebrow: "Question 1 of 5",
    icon: Car,
    title: "What are you driving?",
  },
  {
    id: 2,
    eyebrow: "Question 2 of 5",
    icon: Route,
    title: "Where do you drive it?",
  },
  {
    id: 3,
    eyebrow: "Question 3 of 5",
    icon: CloudRain,
    title: "What is the weather where you drive?",
  },
  {
    id: 4,
    eyebrow: "Question 4 of 5",
    icon: Trophy,
    title: "What matters most to you?",
  },
  {
    id: 5,
    eyebrow: "Question 5 of 5",
    icon: Wallet,
    title: "What are you looking to spend?",
  },
];

/* ---------------------------- scoring ---------------------------- */

const AXIS_KEYS = RATING_AXES.map((a) => a.key);

/**
 * Turn the answers into a weight per axis, plus a weight for price.
 *
 * Every weight is visible to the shopper in the "how this was scored" panel,
 * which is the only reason it is safe to have any at all: a hidden weighting
 * is just an opinion with a number taped to it.
 */
function weightsFor(a) {
  const axes = {
    dry: 0.8,
    wet: 1.2,
    winter: 0.6,
    comfort: 1,
    quiet: 1,
    wear: 1.2,
  };
  let price = 0.9;
  const notes = [];

  if (a.roads === "highway") {
    axes.quiet += 1.4;
    axes.comfort += 1;
    axes.wear += 1.2;
    notes.push("Highway miles push quietness, comfort and tread life up.");
  } else if (a.roads === "city") {
    axes.wet += 0.8;
    axes.comfort += 0.9;
    axes.wear += 0.9;
    notes.push("City driving pushes wet grip, comfort and tread life up.");
  } else if (a.roads === "mixed") {
    axes.wet += 0.5;
    axes.wear += 0.6;
    axes.quiet += 0.5;
    axes.comfort += 0.5;
    notes.push("A mixed commute spreads the weighting evenly.");
  } else if (a.roads === "dirt") {
    axes.wear += 0.8;
    axes.dry += 0.4;
    notes.push(
      "Off pavement is handled mostly as a filter — only all-terrain treads are scored at all.",
    );
  }

  if (a.weather === "warm") {
    axes.winter = 0;
    axes.wet += 1.8;
    axes.dry += 0.5;
    notes.push(
      "Snow and ice carry no weight at all, because you said it never freezes. Wet grip takes that weight instead.",
    );
  } else if (a.weather === "cold") {
    axes.winter += 1.4;
    axes.wet += 1.2;
    notes.push("Cold and wet lifts wet grip and cold-weather traction.");
  } else if (a.weather === "snow") {
    axes.winter += 3.2;
    axes.wet += 1;
    notes.push(
      "Real snow makes snow and ice traction the heaviest axis by far.",
    );
  }

  a.priorities.forEach((key, i) => {
    const bump = i === 0 ? 2.6 : 1.4;
    const option = PRIORITY_OPTIONS.find((o) => o.value === key);
    if (!option) return;
    if (option.axis) axes[option.axis] += bump;
    else price += bump;
    notes.push(
      `${option.label} was your ${i === 0 ? "first" : "second"} priority, so it gains ${bump.toFixed(1)} weight.`,
    );
  });

  AXIS_KEYS.forEach((k) => {
    axes[k] = Math.max(0, Math.round(axes[k] * 10) / 10);
  });

  return { axes, price: Math.round(price * 10) / 10, notes };
}

/** Everything a shopper answered, turned into hard yes/no rules. */
function buildConstraints({
  size,
  vclass,
  knownVehicle,
  vehicleLabel,
  answers,
}) {
  const list = [];
  const rules = CLASS_RULES[vclass] ?? CLASS_RULES.sedan;

  if (size) {
    list.push({
      id: "size",
      chip: size.normalized,
      short: `${size.rimDiameter}-inch fitment`,
      why: `A tire has to match your rim. Only ${size.rimDiameter}-inch tires can go on your wheels.`,
      relaxLabel:
        "Score other rim sizes too (they only fit if you change wheels)",
      keep: (t) => t.rimDiameter === size.rimDiameter,
    });
  }

  list.push({
    id: "vehicle",
    chip: vehicleLabel,
    short: `built for a ${rules.label}`,
    why: rules.why,
    relaxLabel: "Score every tire in the catalog, whatever it was built for",
    keep: (t, r) => {
      if (rules.passenger && (r.isLightTruck || t.category === "Commercial")) {
        return false;
      }
      if (knownVehicle && !rules.categories.includes(t.category)) return false;
      return true;
    },
  });

  if (answers.weather === "snow") {
    list.push({
      id: "weather",
      chip: "Real snow and ice",
      short: "no summer compounds",
      why: "A summer compound goes hard below about 45°F. On snow and ice it is not a slower tire, it is a different one.",
      relaxLabel: "Include summer tires anyway",
      keep: (t, r) => !r.isSummer,
    });
  } else if (answers.weather === "cold") {
    list.push({
      id: "weather",
      chip: "Cold and wet",
      short: "no summer compounds",
      why: "A summer compound stiffens below about 45°F, which is most of a cold, wet winter.",
      relaxLabel: "Include summer tires anyway",
      keep: (t, r) => !r.isSummer,
    });
  } else if (answers.weather === "warm") {
    list.push({
      id: "weather",
      chip: "Never freezes",
      short: "no dedicated winter tires",
      why: "A winter compound is soft by design. In heat it squirms and wears out fast, so it is the wrong tire where it never freezes.",
      relaxLabel: "Include dedicated winter tires anyway",
      keep: (t, r) => !r.isWinter,
    });
  }

  if (answers.roads === "dirt") {
    list.push({
      id: "roads",
      chip: "Off pavement",
      short: "all-terrain tread",
      why: "A highway tread has nothing to bite with on gravel or dirt, and its shoulders cut up.",
      relaxLabel: "Include highway treads",
      // Category is not enough here: a crossover touring tire is filed under
      // "Truck & SUV" and has nothing to bite gravel with. The tread pattern
      // is the claim that matters.
      keep: (t) => /terrain|mud/i.test(String(t.seasons ?? "")),
    });
  }

  const band = bandFor(answers.budget);
  if (band && Number.isFinite(band.max)) {
    list.push({
      id: "budget",
      chip: band.label,
      short: `under $${band.max} a tire`,
      why: `You set the ceiling at $${band.max} a tire — ${money(band.max * SET_SIZE)} for a set of ${SET_SIZE}.`,
      relaxLabel: "Raise the budget",
      keep: (t) => t.price <= band.max,
    });
  }

  return list;
}

/** Runs every constraint over the catalog and keeps the paper trail. */
function evaluate(constraints, relaxed, catalog = TIRES) {
  const active = constraints.filter((c) => !relaxed.includes(c.id));
  const rows = catalog.map((tire) => {
    const r = ratingsFor(tire);
    const failed = active.filter((c) => !c.keep(tire, r)).map((c) => c.id);
    return { tire, r, failed };
  });

  const pool = rows.filter((x) => x.failed.length === 0);

  // What a single answer is costing: the tires that clear everything else and
  // fall only on this one. That is what makes "which answer killed it"
  // answerable instead of a shrug.
  const blame = active
    .map((c) => {
      const rescued = rows.filter(
        (x) => x.failed.length === 1 && x.failed[0] === c.id,
      );
      return {
        constraint: c,
        rescued: rescued.length,
        cheapest: rescued.length
          ? Math.min(...rescued.map((x) => x.tire.price))
          : null,
      };
    })
    .filter((b) => b.rescued > 0)
    .sort((a, b) => b.rescued - a.rescued);

  return { all: constraints, active, rows, pool, blame };
}

/** Scores and ranks a pool. Null axes are excluded, never counted as zero. */
function rankPool(pool, weights) {
  if (!pool.length) return [];
  const prices = pool.map((x) => x.tire.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);

  const entries = pool.map(({ tire, r }) => {
    let scored = 0;
    let scoredWeight = 0;
    let declaredWeight = 0;
    const missing = [];

    AXIS_KEYS.forEach((k) => {
      const w = weights.axes[k];
      if (w <= 0) return;
      declaredWeight += w;
      if (r[k] === null) {
        missing.push(k);
        return;
      }
      scored += w * r[k];
      scoredWeight += w;
    });

    const axisScore = scoredWeight ? scored / scoredWeight : 0;
    // Price is scored relative to the tires that actually fit, so "good value"
    // means good value among real options rather than against the whole shop.
    const priceScore =
      maxP > minP ? (10 * (maxP - tire.price)) / (maxP - minP) : 7;
    const total =
      (axisScore * scoredWeight + priceScore * weights.price) /
      (scoredWeight + weights.price);

    return {
      tire,
      r,
      missing,
      axisScore,
      priceScore,
      score: Math.round(total * 10) / 10,
      // Share of the weighting each axis held, unrated ones included — that is
      // what lets the caveat say how much of the score went unanswered.
      share: Object.fromEntries(
        AXIS_KEYS.map((k) => [
          k,
          (weights.axes[k] || 0) / (declaredWeight + weights.price),
        ]),
      ),
      priceShare: weights.price / (declaredWeight + weights.price),
    };
  });

  return entries.sort(
    (a, b) => b.score - a.score || a.tire.price - b.tire.price,
  );
}

/** "an 800 UTQG grade", "a 700 UTQG grade" — generated copy still has to read. */
const article = (word) => {
  const w = String(word).trim();
  if (/^[aeiou]/i.test(w)) return "an";
  if (/^8/.test(w) || /^1[18]/.test(w)) return "an";
  return "a";
};

/** Spec evidence behind a score — the same specs the score was derived from. */
function evidenceFor(key, tire) {
  const grades = String(tire.specs?.UTQG ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const is3pmsf = /3pmsf/i.test(
    `${tire.specs?.Certification ?? ""} ${tire.seasons ?? ""}`,
  );

  if (key === "wear") {
    const miles = tire.warranty
      ? tire.warranty.replace(/\s*treadwear\s*$/i, "")
      : "";
    if (grades[0] && miles) {
      return `, on ${article(grades[0])} ${grades[0]} UTQG treadwear grade with ${article(miles)} ${miles} warranty behind it`;
    }
    if (miles) return `, on its ${miles} warranty`;
    return "";
  }
  if (key === "wet" && grades[1]) {
    return `, on ${article(grades[1])} ${grades[1]} UTQG traction grade${grades[1] === "AA" ? ", the highest grade issued" : ""}`;
  }
  if (key === "winter") {
    if (/winter/i.test(String(tire.seasons ?? ""))) {
      return ", on a dedicated winter compound and a full-depth siped tread";
    }
    if (is3pmsf) return ", and it carries the 3PMSF severe-snow certification";
    return "";
  }
  if (key === "dry" && tire.speedRating) {
    return `, on its ${tire.speedRating} speed rating`;
  }
  return "";
}

/**
 * The sentence that justifies the pick — built from the axes that were
 * weighted heaviest and the places this tire actually beat the others.
 *
 * `group` is the set it is being compared against, because a claim like "the
 * best wet grip here" is only true relative to a stated set. A score every
 * tire in the group shares did not separate anything, so it is demoted rather
 * than dressed up as a win.
 */
function buildReasons(entry, entries, answers, weights, group) {
  const n = entries.length;
  const sole = n === 1;
  const noun = group?.noun ?? "tires that fit your answers";
  const among = sole ? "" : ` of the ${n} ${noun}`;

  const bests = {};
  const bestCounts = {};
  AXIS_KEYS.forEach((k) => {
    const values = entries
      .map((e) => e.r[k])
      .filter((v) => v !== null && v !== undefined);
    bests[k] = values.length ? Math.max(...values) : null;
    bestCounts[k] = values.filter((v) => v >= (bests[k] ?? 0) - 0.05).length;
  });
  const cheapest = Math.min(...entries.map((e) => e.tire.price));
  const priciest = Math.max(...entries.map((e) => e.tire.price));

  const clauses = [];

  AXIS_KEYS.filter((k) => weights.axes[k] > 0)
    .sort((a, b) => weights.axes[b] - weights.axes[a])
    .forEach((k) => {
      const v = entry.r[k];
      const best = bests[k];
      if (v === null || v === undefined || best === null) return;
      const phrase = AXIS_PHRASE[k];
      const leads = v >= best - 0.05;
      // "the same as everything else here" is meaningless when there is only
      // one tire in the group.
      const shared = !sole && bestCounts[k] >= n;

      if (leads && !shared && !sole) {
        const tied =
          bestCounts[k] > 1
            ? `, tied with ${bestCounts[k] - 1} other${bestCounts[k] > 2 ? "s" : ""} here`
            : "";
        clauses.push({
          rank: 3 + weights.axes[k],
          text: `the best ${phrase}${among} — ${v.toFixed(1)} out of 10${evidenceFor(k, entry.tire)}${tied}`,
        });
      } else if (leads && shared) {
        // True, but it separated nothing — so it must not read as a win.
        clauses.push({
          rank: 0.5,
          text: `${phrase} of ${v.toFixed(1)}, which every one of these matches`,
        });
      } else if (v >= best - 0.5 && !sole) {
        clauses.push({
          rank: 2 + weights.axes[k],
          text: `${phrase} of ${v.toFixed(1)}, within half a point of the best here`,
        });
      } else if (v >= 8 || (sole && v >= 6.5)) {
        clauses.push({
          rank: 1 + weights.axes[k],
          text: `${phrase} of ${v.toFixed(1)} out of 10${evidenceFor(k, entry.tire)}`,
        });
      }
    });

  if (entry.tire.price === cheapest && n > 1 && priciest > cheapest) {
    clauses.push({
      rank: 3 + weights.price,
      text: `the lowest set price${among} at ${money(setPrice(entry.tire))}, ${money((priciest - cheapest) * SET_SIZE)} under the priciest`,
    });
  } else if (entry.tire.price <= cheapest * 1.12 && n > 2) {
    clauses.push({
      rank: 1.5 + weights.price,
      text: `a set price of ${money(setPrice(entry.tire))}, near the bottom of what fits`,
    });
  }

  clauses.sort((a, b) => b.rank - a.rank);

  let lead;
  let support = null;
  if (sole) {
    lead =
      group?.soleText ??
      "It is the only tire in the catalog that clears every one of your answers.";
    support = clauses[0] ? `It has ${clauses[0].text}.` : null;
  } else if (clauses.length && clauses[0].rank >= 1.2) {
    lead = `It has ${clauses[0].text}.`;
    support = clauses[1] ? `It also brings ${clauses[1].text}.` : null;
  } else {
    lead = `Nothing here beats it once ${ROAD_PHRASE[answers.roads] ?? "your driving"} and your priorities are weighted together.`;
    support = clauses[0] ? `It has ${clauses[0].text}.` : null;
  }

  // The honest half: where this tire is worst among the ones it was ranked with.
  let tradeoff = null;
  let worst = null;
  AXIS_KEYS.filter((k) => weights.axes[k] > 0).forEach((k) => {
    const v = entry.r[k];
    if (v === null || v === undefined || bests[k] === null) return;
    const gap = bests[k] - v;
    if (
      gap > 1 &&
      (!worst || gap * weights.axes[k] > worst.gap * weights.axes[worst.key])
    ) {
      worst = { key: k, gap, value: v, best: bests[k] };
    }
  });
  if (worst) {
    tradeoff = `${AXIS_LABEL[worst.key]} is the giveaway: ${worst.value.toFixed(1)} against the ${worst.best.toFixed(1)} of the best here.`;
  } else if (entry.tire.price === priciest && n > 1 && priciest > cheapest) {
    tradeoff = `It is the most expensive set here, at ${money(setPrice(entry.tire))}.`;
  }

  const caveats = entry.missing.map((k) => {
    const pct = Math.round(entry.share[k] * 100);
    return `${AXIS_LABEL[k]} is not rated for this tire — no ${k === "wear" ? "UTQG treadwear grade is" : "grade is"} published for it — so it was left out of the score rather than counted as zero. It would have been about ${pct}% of your weighting.`;
  });

  return { lead, support, tradeoff, caveats };
}

/**
 * Does this catalog size keep the overall diameter inside the ±3% most
 * fitment guides allow? Same rim is not the same thing as the same size, and
 * a shortlist that mixes the two is lying by omission.
 */
function withinFitTolerance(size, tire) {
  if (!size) return true;
  if (size.normalized === tire.size) return true;
  const c = compareSizes(size.normalized, tire.size);
  return Boolean(c && c.sameRim && c.withinTolerance);
}

/** How a catalog size relates to the size the shopper gave us. Real math. */
function fitNote(size, tire) {
  if (!size) return null;
  if (size.normalized === tire.size) {
    return { tone: "ok", text: `Exactly your size — ${tire.size}.` };
  }
  const c = compareSizes(size.normalized, tire.size);
  if (!c) return null;

  const pct = Math.abs(c.diameterChange).toFixed(1);
  const dir = c.diameterChange >= 0 ? "taller" : "shorter";
  const width =
    c.widthChangeMm === 0
      ? "the same width"
      : `${Math.abs(c.widthChangeMm)}mm ${c.widthChangeMm > 0 ? "wider" : "narrower"}`;

  if (!c.sameRim) {
    return {
      tone: "warn",
      text: `${tire.size} is a ${tire.rimDiameter}-inch tire, not the ${size.rimDiameter}-inch you gave. It only fits if you change wheels too.`,
    };
  }
  if (c.withinTolerance) {
    return {
      tone: "ok",
      text: `${tire.size} stands ${pct}% ${dir} than your ${size.normalized} and runs ${width} — inside the ±${c.tolerance}% most fitment guides allow.`,
    };
  }
  return {
    tone: "warn",
    text: `${tire.size} stands ${pct}% ${dir} than your ${size.normalized}, outside the ±${c.tolerance}% guideline. Speedometer and clearance both shift — worth confirming before you order.`,
  };
}

/* ---------------------------- small parts ---------------------------- */

function ProgressRail({ step }) {
  return (
    <div className="mb-7">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="eyebrow text-[11px] tracking-[0.09em]">
          Question {step} of 5
        </p>
        <p className="tnum text-[11px] text-smoke">
          {Math.round((step / 5) * 100)}% through
        </p>
      </div>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={step}
        aria-label={`Question ${step} of 5`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.09]"
      >
        <div
          className="h-full rounded-full bg-drop transition-all duration-300"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}

const OPTION_SHELL =
  "flex w-full min-h-[64px] items-start gap-3 rounded-card border border-ink/[0.12] bg-bone p-4 text-left shadow-card transition-all duration-150 hover:border-ink/30 peer-checked:border-drop peer-checked:ring-2 peer-checked:ring-drop/25 peer-focus-visible:ring-2 peer-focus-visible:ring-drop/60";

function OptionCard({ type, name, option, checked, onChange, badge }) {
  const Icon = option.icon;
  return (
    <label className="relative block cursor-pointer">
      <input
        type={type}
        name={name}
        value={option.value}
        checked={checked}
        onChange={() => onChange(option.value)}
        className="peer sr-only"
      />
      <span className={OPTION_SHELL}>
        <span
          aria-hidden
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
            checked
              ? "border-drop bg-drop text-bone"
              : "border-ink/20 bg-fog text-smoke"
          }`}
        >
          {checked ? (
            (badge ?? <Check size={14} aria-hidden />)
          ) : Icon ? (
            <Icon size={14} aria-hidden />
          ) : (
            ""
          )}
        </span>
        <span className="min-w-0">
          <span className="block font-display text-[15px] font-bold leading-tight tracking-[-0.008em] text-ink">
            {option.label}
          </span>
          {option.detail && (
            <span className="mt-1 block text-[13px] leading-snug text-smoke">
              {option.detail}
            </span>
          )}
        </span>
      </span>
    </label>
  );
}

function QuizShell({
  step,
  title,
  lede,
  icon: Icon,
  onBack,
  nextDisabled,
  nextLabel,
  error,
  notice,
  children,
}) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <ProgressRail step={step} />
      {notice && (
        <p className="mb-4 flex items-start gap-2 rounded-card border border-drop/25 bg-sky px-4 py-3 text-[13px] leading-snug text-ink">
          <Info size={15} aria-hidden className="mt-0.5 shrink-0 text-drop" />
          <span>{notice}</span>
        </p>
      )}
      <div className="card p-5 md:p-7">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-sky text-drop">
              <Icon size={20} aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="h3 text-balance md:text-[1.6rem]">{title}</h2>
            {lede && (
              <p className="mt-1.5 text-sm leading-relaxed text-smoke">
                {lede}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">{children}</div>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-sm border border-amberInk/25 bg-amber/[0.12] px-3 py-2 text-[13px] leading-snug text-amberInk"
          >
            {error}
          </p>
        )}

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="btn-primary min-h-[48px] flex-1 sm:flex-none sm:px-8"
            disabled={nextDisabled}
          >
            {nextLabel ?? "Continue"}
          </button>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="btn-outline min-h-[48px] btn-sm"
            >
              <ArrowLeft size={15} aria-hidden />
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AxisBar({ label, value, weight, share }) {
  const heavy = share >= 0.2;
  return (
    <li className="flex items-center gap-2.5">
      <span className="w-[74px] shrink-0 text-[11px] leading-tight text-smoke">
        {label}
      </span>
      {value === null || value === undefined ? (
        <span className="flex-1 text-[11px] leading-tight text-smoke">
          Not rated — left out of the score
        </span>
      ) : (
        <>
          <span className="h-[5px] flex-1 overflow-hidden rounded-full bg-ink/[0.08]">
            <span
              className={`block h-full rounded-full ${heavy ? "bg-drop" : "bg-ink/35"}`}
              style={{ width: `${value * 10}%` }}
            />
          </span>
          <span className="tnum w-[24px] shrink-0 text-right font-display text-[11px] font-bold leading-none text-ink">
            {value.toFixed(1)}
          </span>
        </>
      )}
      <span className="tnum w-[52px] shrink-0 text-right text-[11px] leading-tight text-smoke">
        {weight <= 0 ? "ignored" : `× ${weight.toFixed(1)}`}
      </span>
    </li>
  );
}

function ResultCard({ entry, entries, answers, weights, rank, size, group }) {
  const reasons = buildReasons(entry, entries, answers, weights, group);
  const fit = fitNote(size, entry.tire);

  return (
    <article className="grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 font-display text-[11px] font-bold uppercase leading-none tracking-[0.09em] ${
              group?.tone === "alt"
                ? "bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/10"
                : "bg-ink text-bone"
            }`}
          >
            {rank === 1 && group?.tone !== "alt" ? (
              <Trophy size={13} aria-hidden />
            ) : null}
            {group?.tone === "alt"
              ? `Close call #${rank}`
              : rank === 1
                ? "Best match"
                : `Match #${rank}`}
          </span>
          <span className="tnum text-[11px] text-smoke">
            Score {entry.score.toFixed(1)} / 10 against your answers
          </span>
        </div>
        <ProductCard product={entry.tire} />
      </div>

      <div className="card flex flex-col p-5">
        <h3 className="font-display text-[1.0625rem] font-bold leading-tight tracking-[-0.012em] text-ink md:text-[1.15rem]">
          Why the {entry.tire.brand} {entry.tire.model} won
        </h3>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/85">
          {reasons.lead} {reasons.support}
        </p>

        {reasons.tradeoff && (
          <p className="mt-3 rounded-sm bg-fog px-3 py-2 text-[13px] leading-snug text-ink/80">
            <span className="font-display font-bold">What you give up: </span>
            {reasons.tradeoff}
          </p>
        )}

        {reasons.caveats.map((c) => (
          <p
            key={c}
            className="mt-3 rounded-sm border border-amberInk/25 bg-amber/[0.1] px-3 py-2 text-[13px] leading-snug text-amberInk"
          >
            {c}
          </p>
        ))}

        {fit && (
          <p
            className={`mt-3 flex items-start gap-1.5 text-[13px] leading-snug ${
              fit.tone === "warn" ? "text-amberInk" : "text-smoke"
            }`}
          >
            <Ruler size={14} aria-hidden className="mt-0.5 shrink-0" />
            <span>{fit.text}</span>
          </p>
        )}

        <details className="group mt-4 border-t border-ink/[0.07] pt-3">
          <summary className="flex min-h-[32px] cursor-pointer list-none items-center gap-2 font-display text-[13px] font-bold text-drop">
            <Info size={14} aria-hidden />
            How this one scored, axis by axis
          </summary>
          <ul className="mt-3 space-y-2">
            {RATING_AXES.map((axis) => (
              <AxisBar
                key={axis.key}
                label={axis.label}
                value={entry.r[axis.key]}
                weight={weights.axes[axis.key]}
                share={entry.share[axis.key]}
              />
            ))}
            <li className="flex items-center gap-2.5 border-t border-ink/[0.07] pt-2">
              <span className="w-[74px] shrink-0 text-[11px] leading-tight text-smoke">
                Price
              </span>
              <span className="tnum flex-1 text-[11px] leading-tight text-smoke">
                {money(entry.tire.price)} a tire · {money(setPrice(entry.tire))}{" "}
                a set of {SET_SIZE}
              </span>
              <span className="tnum w-[52px] shrink-0 text-right text-[11px] text-smoke">
                × {weights.price.toFixed(1)}
              </span>
            </li>
          </ul>
        </details>
      </div>
    </article>
  );
}

/* ---------------------------- the page ---------------------------- */

export default function FindMyTiresPage() {
  const [params, setParams] = useSearchParams();

  const answers = (() => {
    const priorities = (params.get("pri") || "")
      .split(",")
      .filter((v) => PRIORITY_OPTIONS.some((o) => o.value === v))
      .slice(0, 2);
    return {
      mode: params.get("mode") === "size" ? "size" : "vehicle",
      year: params.get("vy") || "",
      make: params.get("vmk") || "",
      model: params.get("vmd") || "",
      sizeText: params.get("size") || "",
      roads: params.get("roads") || "",
      weather: params.get("weather") || "",
      priorities,
      budget: params.get("budget") || "",
      relaxed: (params.get("relax") || "").split(",").filter(Boolean),
    };
  })();

  const rawStep = Number(params.get("q"));
  const wantsResults = params.get("q") === "r";

  const patch = (next, { push = false } = {}) => {
    const url = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      if (v === "" || v == null) url.delete(k);
      else url.set(k, String(v));
    });
    setParams(url, { replace: !push });
  };

  /* ---- step 1 lives in local state until it is committed to the URL ---- */
  // Every make and model year 1981-2027 (data/vehicles.js): makes are those
  // sold in the chosen year, and models load live from NHTSA with the size
  // table merged in. A vehicle with no size on file is still fine — the size
  // field asks for the sidewall size instead. A vehicle handed over by the
  // home page finder arrives without a size and gets its generation's size
  // straight away; "Other / not listed" arrives as the size route.
  const [first] = useState(() => {
    const y = YEARS.includes(answers.year) ? answers.year : "";
    const mk = makesFor(y).includes(answers.make) ? answers.make : "";
    let m = answers.mode;
    let md = "";
    if (mk && y && answers.model) {
      if (answers.model === OTHER) m = "size";
      else md = answers.model;
    }
    let size = answers.sizeText;
    let auto = "";
    const f = md ? fitmentForYear(mk, md, y) : null;
    if (f && f[0]) {
      if (!size) size = f[0];
      if (size === f[0]) auto = f[0];
    }
    return { mode: m, year: y, make: mk, model: md, sizeText: size, auto };
  });
  const [mode, setMode] = useState(first.mode);
  const [year, setYear] = useState(first.year);
  const [make, setMake] = useState(first.make);
  const [model, setModel] = useState(first.model);
  const [sizeText, setSizeText] = useState(first.sizeText);
  // The size filled in from the table, so a later year change can swap it
  // without overwriting a size the shopper typed themselves.
  const [autoSize, setAutoSize] = useState(first.auto);
  const [stepError, setStepError] = useState("");
  const sizeRef = useRef(null);

  const makes = makesFor(year);
  const live = useVehicleModels(make, year);
  // A model handed over by the finder stays selectable even if this year's
  // list spells it differently.
  const models =
    model && !live.loading && !live.models.includes(model)
      ? [...live.models, model]
      : live.models;
  const modelReady = Boolean(year && make && !live.loading);
  const fit = make && model ? fitmentForYear(make, model, year) : null;
  const guess = fit && fit[0] ? fit : null;

  const typeSizeInstead = () => {
    setModel("");
    setMode("size");
    setStepError("");
    sizeRef.current?.focus();
  };

  const pickYear = (value) => {
    setYear(value);
    setStepError("");
    const keepMake = makesFor(value).includes(make) ? make : "";
    const keepModel = keepMake ? model : "";
    if (!keepMake) {
      setMake("");
      setModel("");
    }
    // A different year can mean a different generation and size. Swap the
    // filled-in size, but never one the shopper typed themselves.
    if (keepModel && (!sizeText.trim() || sizeText === autoSize)) {
      const f = fitmentForYear(keepMake, keepModel, value);
      const next = f && f[0] ? f[0] : "";
      setSizeText(next);
      setAutoSize(next);
    }
  };
  const pickMake = (value) => {
    setMake(value);
    setModel("");
    setSizeText("");
    setStepError("");
  };
  const pickModel = (value) => {
    // Not in the list: same as "My vehicle isn't listed".
    if (value === OTHER) {
      typeSizeInstead();
      return;
    }
    setModel(value);
    const f = fitmentForYear(make, value, year);
    const next = f && f[0] ? f[0] : "";
    setSizeText(next);
    setAutoSize(next);
    setStepError("");
  };

  const typedSize = sizeText.trim() ? parseSize(sizeText.trim()) : null;

  /* ---- what the answers add up to ---- */
  const size = answers.sizeText ? parseSize(answers.sizeText) : null;
  const knownVehicle = Boolean(answers.year && answers.make && answers.model);
  const fitClass = knownVehicle
    ? fitmentForYear(answers.make, answers.model, answers.year)
    : null;
  // No table entry for the vehicle: read the class off the size.
  const vclass = fitClass ? fitClass[1] : classFromSize(size);
  const vehicleLabel = knownVehicle
    ? `${answers.year} ${answers.make} ${answers.model}`
    : size
      ? `${size.normalized} (read as a ${CLASS_RULES[vclass].label} size)`
      : "Your vehicle";

  // A shared or refreshed link has to carry every answer, because a ranking
  // built on blanks is not a ranking. Anything missing drops the shopper back
  // on the question that is missing rather than onto a made-up shortlist.
  const missingStep = !size
    ? 1
    : !answers.roads
      ? 2
      : !answers.weather
        ? 3
        : answers.priorities.length === 0
          ? 4
          : !answers.budget
            ? 5
            : null;
  const showResults = wantsResults && missingStep === null;
  const step = showResults
    ? 5
    : wantsResults
      ? missingStep
      : Math.min(5, Math.max(1, rawStep || 1));
  const resumeNotice =
    wantsResults && missingStep
      ? answers.sizeText && !size
        ? `We could not read "${answers.sizeText}" as a tire size, so there is nothing to rank yet. Give us the size off your sidewall and we will pick up where the link left off.`
        : "That link is missing an answer, so there is nothing to rank yet. Fill this one in and we will pick up where it left off."
      : null;

  const weights = weightsFor(answers);

  // The shopper's size goes to the API. When ATD answers live, its tires are
  // what gets ranked; otherwise (sample data, or no API) the sample catalog
  // is, exactly as before.
  const search = useTireSearch(
    showResults && size ? { size: size.normalized } : null,
  );
  const catalog =
    search.active && search.source === "atd" ? search.items : TIRES;

  // Twenty tires and six axes: the whole evaluation is cheap enough to run on
  // every render, which keeps the answers and the ranking impossible to
  // disagree with each other.
  const {
    pool,
    blame,
    all: constraints,
  } = evaluate(
    buildConstraints({ size, vclass, knownVehicle, vehicleLabel, answers }),
    answers.relaxed,
    catalog,
  );

  const ranked = rankPool(pool, weights);

  // Same rim is not the same size. Tires that hold the overall diameter
  // inside the ±3% guideline are the shortlist; the rest are shown as
  // near misses, labelled, and only when the shortlist is thin.
  const onSize = ranked.filter((e) => withinFitTolerance(size, e.tire));
  const offSize = ranked.filter((e) => !withinFitTolerance(size, e.tire));
  const primary = onSize.length ? onSize : offSize;
  const alternates = onSize.length ? offSize : [];
  const shortlist = primary.length > 5 ? primary.slice(0, 4) : primary;
  const showAlternates = shortlist.length < 3 && alternates.length > 0;
  const altList = alternates.slice(0, 3);

  const primaryGroup = {
    noun: onSize.length
      ? "tires that fit your answers"
      : "tires in your rim size",
    soleText: onSize.length
      ? "It is the only tire here that clears every one of your answers and keeps your overall diameter inside the ±3% guideline."
      : "It is the only tire in the catalog that clears every one of your answers in your rim size.",
  };
  const altGroup = {
    tone: "alt",
    noun: "near misses",
    soleText:
      "It is the only other tire in your rim size that clears every one of your answers.",
  };

  /* ---- navigation ---- */
  const goTo = (q) => {
    setStepError("");
    patch({ q }, { push: true });
  };

  const submitStep = (event) => {
    event.preventDefault();
    if (step === 1) {
      // The size as the visitor sees it: one filled in without an input
      // event (automation, some autofill) never reached state.
      const shownSize = sizeRef.current?.value ?? sizeText;
      if (shownSize !== sizeText) setSizeText(shownSize);
      const readSize = shownSize.trim() ? parseSize(shownSize.trim()) : null;
      if (mode === "vehicle") {
        if (!year || !make || !model) {
          setStepError(
            "Pick a year, make and model — or switch to entering your tire size.",
          );
          return;
        }
      }
      if (!shownSize.trim()) {
        setStepError(
          mode === "vehicle"
            ? `We do not have the factory size for a ${year} ${make} ${model} on file. Type the size off your sidewall (or the sticker in your driver's door jamb) instead.`
            : "Type the size off your sidewall — it looks like 225/50R17.",
        );
        return;
      }
      if (!readSize) {
        setStepError(
          `"${shownSize.trim()}" is not a tire size we can read. It looks like 225/50R17, LT265/70R17 or 31x10.50R15.`,
        );
        return;
      }
      patch(
        {
          mode,
          vy: mode === "vehicle" ? year : "",
          vmk: mode === "vehicle" ? make : "",
          vmd: mode === "vehicle" ? model : "",
          size: readSize.normalized,
          q: 2,
          relax: "",
        },
        { push: true },
      );
      setStepError("");
      return;
    }
    if (step === 2 && !answers.roads) {
      setStepError("Pick the one that is closest to your week.");
      return;
    }
    if (step === 3 && !answers.weather) {
      setStepError("Pick the winter you actually get.");
      return;
    }
    if (step === 4 && answers.priorities.length === 0) {
      setStepError(
        "Pick at least one. Two is better — the first one counts for more.",
      );
      return;
    }
    if (step === 5 && !answers.budget) {
      setStepError("Pick a ceiling, or tell us there isn't one.");
      return;
    }
    goTo(step === 5 ? "r" : step + 1);
  };

  const togglePriority = (value) => {
    const current = answers.priorities;
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value].slice(-2);
    patch({ pri: next.join(",") });
    setStepError("");
  };

  const startOver = () => {
    setMode("vehicle");
    setYear("");
    setMake("");
    setModel("");
    setSizeText("");
    setAutoSize("");
    setStepError("");
    setParams(new URLSearchParams(), { replace: false });
  };

  const relax = (id, extra = {}) =>
    patch(
      {
        relax: [...new Set([...answers.relaxed, id])].join(","),
        ...extra,
      },
      { push: true },
    );

  const allTiresHref = size
    ? `/tires?w=${size.width}&a=${size.aspect}&d=${size.rimDiameter}`
    : "/tires";

  /* ---- chips: every answer, one tap from being changed ---- */
  const chips = [
    { step: 1, label: vehicleLabel },
    {
      step: 2,
      label: ROAD_OPTIONS.find((o) => o.value === answers.roads)?.label,
    },
    {
      step: 3,
      label: WEATHER_OPTIONS.find((o) => o.value === answers.weather)?.label,
    },
    ...answers.priorities.map((p, i) => ({
      step: 4,
      label: `${i + 1}. ${PRIORITY_OPTIONS.find((o) => o.value === p)?.label}`,
    })),
    { step: 5, label: bandFor(answers.budget)?.label },
  ].filter((c) => c.label);

  const seo = (
    <Seo
      title="Find My Tires — Five Questions, a Real Shortlist"
      description="Answer five questions about your car, your roads, your weather and your budget. We rank the tires that actually fit and tell you exactly why each one made the list."
    />
  );

  /* ---------------------------- results ---------------------------- */

  if (showResults) {
    return (
      <>
        {seo}
        <PageHero
          eyebrow="Free tool"
          title="Your tire shortlist"
          lede={`Ranked against your five answers, scored on the specs each tire publishes — not on our opinion of them.`}
        />
        <Breadcrumbs
          trail={[
            { label: "Find My Tires", to: "/find-my-tires" },
            { label: "Results" },
          ]}
        />

        <Section className="bg-fog">
          <div className="mb-7 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <button
                key={`${chip.step}-${chip.label}`}
                type="button"
                onClick={() => goTo(chip.step)}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-sm border border-ink/[0.12] bg-bone px-3 py-1.5 text-[13px] text-ink shadow-card transition-colors hover:border-drop hover:text-drop"
              >
                {chip.label}
                <span className="text-[11px] text-smoke">change</span>
              </button>
            ))}
            <button
              type="button"
              onClick={startOver}
              className="inline-flex min-h-[36px] items-center gap-1.5 px-2 text-[13px] font-medium text-drop hover:underline"
            >
              <RotateCcw size={14} aria-hidden />
              Start over
            </button>
          </div>

          {answers.relaxed.length > 0 && (
            <p className="mb-6 flex items-start gap-2 rounded-card border border-drop/25 bg-sky px-4 py-3 text-[13px] leading-snug text-ink">
              <Info
                size={15}
                aria-hidden
                className="mt-0.5 shrink-0 text-drop"
              />
              <span>
                Showing results with{" "}
                {answers.relaxed
                  .map(
                    (id) => constraints.find((c) => c.id === id)?.short ?? id,
                  )
                  .join(" and ")}{" "}
                relaxed.{" "}
                <button
                  type="button"
                  onClick={() => patch({ relax: "" }, { push: true })}
                  className="inline-flex min-h-[24px] items-center align-middle font-display font-bold text-drop underline"
                >
                  Put it back
                </button>
              </span>
            </p>
          )}

          <div aria-live="polite">
            {shortlist.length === 0 ? (
              <div className="card p-6 md:p-8">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-fog text-ink/30">
                  <SearchX size={24} aria-hidden />
                </span>
                <h2 className="h3">
                  Nothing in the catalog clears all of that
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-smoke">
                  Your answers rule out every tire in the catalog. It is
                  representative, not live distributor inventory, so a real
                  match may still exist — but we will not invent one.
                  {blame.length > 0
                    ? " Here is exactly which answer is doing it, and what happens if you relax it."
                    : " Each of these tires falls short on more than one answer at once, so there is no single thing to loosen."}
                </p>

                {blame.length > 0 && (
                  <ul className="mt-6 space-y-3">
                    {blame.slice(0, 3).map((b) => (
                      <li
                        key={b.constraint.id}
                        className="rounded-card border border-ink/[0.12] bg-fog p-4"
                      >
                        <p className="font-display text-[15px] font-bold leading-snug text-ink">
                          {b.constraint.chip}
                        </p>
                        <p className="mt-1 text-[13px] leading-snug text-smoke">
                          {b.constraint.why} Relaxing it brings back{" "}
                          <span className="tnum font-display font-bold text-ink">
                            {b.rescued}
                          </span>{" "}
                          {b.rescued === 1
                            ? "tire that clears"
                            : "tires that clear"}{" "}
                          every other answer
                          {b.constraint.id === "budget" && b.cheapest
                            ? `, the cheapest at ${money(b.cheapest)} a tire (${money(b.cheapest * SET_SIZE)} a set)`
                            : ""}
                          .
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            b.constraint.id === "budget"
                              ? patch({ budget: "any" }, { push: true })
                              : relax(b.constraint.id)
                          }
                          className="btn-outline btn-sm mt-3 min-h-[40px]"
                        >
                          {b.constraint.relaxLabel}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={startOver}
                    className="btn-dark btn-sm min-h-[44px]"
                  >
                    <RotateCcw size={15} aria-hidden />
                    Start over
                  </button>
                  <Link
                    to={allTiresHref}
                    className="btn-outline btn-sm min-h-[44px]"
                  >
                    {size
                      ? `See every tire in ${size.normalized}`
                      : "Browse every tire"}
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-6 max-w-2xl text-sm leading-relaxed text-smoke">
                  <span className="font-display font-bold text-ink">
                    {ranked.length}{" "}
                    {ranked.length === 1
                      ? "tire in the catalog clears"
                      : "tires in the catalog clear"}{" "}
                    every one of your answers.
                  </span>{" "}
                  {onSize.length === 0
                    ? `None of them holds your ${size ? size.normalized : "size"} within the ±3% diameter guideline, so every one below is a compromise and says how much of one.`
                    : alternates.length > 0
                      ? `${
                          onSize.length === 1
                            ? "One of them keeps"
                            : `${onSize.length} of them keep`
                        } your overall diameter inside the ±3% guideline, and that is what you see first. The rest follow as near misses.`
                      : shortlist.length < primary.length
                        ? `Here are the ${shortlist.length} that score highest once your priorities are weighted.`
                        : primary.length === 1
                          ? "This is the one."
                          : "Here they are, best match first."}{" "}
                  Scores are computed from each tire&rsquo;s published specs —
                  UTQG grades, speed rating, tread depth, load range, snow
                  certification and mileage warranty — not from our own road
                  tests.
                </p>

                <div className="space-y-10">
                  {shortlist.map((entry, i) => (
                    <ResultCard
                      key={entry.tire.id}
                      entry={entry}
                      entries={primary}
                      answers={answers}
                      weights={weights}
                      rank={i + 1}
                      size={size}
                      group={primaryGroup}
                    />
                  ))}
                </div>

                {showAlternates && (
                  <div className="mt-12 border-t border-ink/[0.12] pt-10">
                    <h2 className="h3 text-[1.15rem] md:text-[1.4rem]">
                      Close, but not the same size
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-smoke">
                      {altList.length === 1 ? "This tire fits" : "These fit"}{" "}
                      your {size?.rimDiameter}-inch wheel and{" "}
                      {altList.length === 1 ? "clears" : "clear"} every other
                      answer, but the overall diameter lands outside the ±3%
                      most fitment guides allow. That changes your speedometer
                      reading and your clearance, so{" "}
                      {altList.length === 1 ? "it is" : "they are"} shown
                      separately rather than ranked with the matches above —
                      even where the score is higher, because a score cannot buy
                      back the fitment.
                    </p>
                    <div className="mt-6 space-y-10">
                      {altList.map((entry, i) => (
                        <ResultCard
                          key={entry.tire.id}
                          entry={entry}
                          entries={alternates}
                          answers={answers}
                          weights={weights}
                          rank={i + 1}
                          size={size}
                          group={altGroup}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-10 card p-5 md:p-6">
                  <h2 className="h3 text-[1.15rem] md:text-[1.3rem]">
                    How the ranking was weighted
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-smoke">
                    Ranked for your {vehicleLabel} and{" "}
                    {ROAD_PHRASE[answers.roads] ?? "the driving you described"},{" "}
                    {WEATHER_PHRASE[answers.weather] ?? "in your weather"}.
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {weights.notes.map((note) => (
                      <li
                        key={note}
                        className="flex items-start gap-2 text-[13px] leading-snug text-smoke"
                      >
                        <Check
                          size={14}
                          aria-hidden
                          className="mt-0.5 shrink-0 text-drop"
                        />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="mt-4 grid gap-2 border-t border-ink/[0.07] pt-4 sm:grid-cols-2">
                    {RATING_AXES.map((axis) => (
                      <li
                        key={axis.key}
                        className="tnum flex items-baseline justify-between gap-3 text-[13px] text-smoke"
                      >
                        <span>{axis.label}</span>
                        <span className="font-display font-bold text-ink">
                          {weights.axes[axis.key] <= 0
                            ? "ignored"
                            : `× ${weights.axes[axis.key].toFixed(1)}`}
                        </span>
                      </li>
                    ))}
                    <li className="tnum flex items-baseline justify-between gap-3 text-[13px] text-smoke">
                      <span>Price against the others that fit</span>
                      <span className="font-display font-bold text-ink">
                        × {weights.price.toFixed(1)}
                      </span>
                    </li>
                  </ul>
                  <p className="mt-4 text-[13px] leading-relaxed text-smoke">
                    An axis with no published grade is excluded from the score
                    rather than counted as zero, and every pick above says so
                    where it happened. The catalog is representative, not live
                    distributor inventory.
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to={allTiresHref} className="btn-primary min-h-[48px]">
                    {size
                      ? `See all tires in ${size.normalized}`
                      : "See all tires"}
                  </Link>
                  <button
                    type="button"
                    onClick={startOver}
                    className="btn-outline min-h-[48px]"
                  >
                    <RotateCcw size={15} aria-hidden />
                    Start over
                  </button>
                </div>
              </>
            )}
          </div>
        </Section>
      </>
    );
  }

  /* ---------------------------- the quiz ---------------------------- */

  const current = STEPS[step - 1];

  return (
    <>
      {seo}
      <PageHero
        eyebrow="Free tool"
        title="Find my tires"
        lede="Five questions. A ranked shortlist at the end, and a straight answer for why each tire is on it — the scores that put it there, and the one thing it gives up."
      />
      <Breadcrumbs trail={[{ label: "Find My Tires" }]} />

      <Section className="bg-fog">
        <form onSubmit={submitStep} noValidate>
          <QuizShell
            step={step}
            title={current.title}
            icon={current.icon}
            error={stepError}
            notice={resumeNotice}
            nextLabel={step === 5 ? "Show my shortlist" : "Continue"}
            onBack={step > 1 ? () => goTo(step - 1) : null}
            lede={
              step === 1
                ? "We need the size to rule out anything that physically will not fit, and the vehicle to rule out anything built for a different kind of one."
                : step === 2
                  ? "This sets how much quietness, comfort and tread life count against outright grip."
                  : step === 3
                    ? "This is the answer that disqualifies tires rather than just ranking them."
                    : step === 4
                      ? "Pick one or two. The first one you pick carries almost twice the weight of the second."
                      : "A ceiling, not a target. Nothing here is padded to hit it."
            }
          >
            {step === 1 && (
              <div>
                <div
                  className="mb-5 flex flex-wrap gap-2"
                  role="group"
                  aria-label="How to identify your tires"
                >
                  {[
                    { id: "vehicle", label: "By vehicle", icon: Car },
                    { id: "size", label: "I know my tire size", icon: Ruler },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setMode(t.id);
                        setStepError("");
                      }}
                      aria-pressed={mode === t.id}
                      className={`inline-flex min-h-[44px] items-center gap-2 rounded-sm border px-4 py-2 font-display text-[14px] font-bold transition-colors ${
                        mode === t.id
                          ? "border-drop bg-drop text-bone"
                          : "border-ink/[0.12] bg-bone text-ink hover:border-ink/30"
                      }`}
                    >
                      <t.icon size={15} aria-hidden />
                      {t.label}
                    </button>
                  ))}
                </div>

                {mode === "vehicle" && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="quiz-year" className="label">
                        Year
                      </label>
                      <select
                        id="quiz-year"
                        value={year}
                        onChange={(e) => pickYear(e.target.value)}
                        className="field min-h-[44px] appearance-none bg-bone pr-8"
                      >
                        <option value="">Select year</option>
                        {YEARS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="quiz-make" className="label">
                        Make
                      </label>
                      <select
                        id="quiz-make"
                        value={make}
                        onChange={(e) => pickMake(e.target.value)}
                        className="field min-h-[44px] appearance-none bg-bone pr-8"
                      >
                        <option value="">Select make</option>
                        {makes.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="quiz-model" className="label">
                        Model
                      </label>
                      <select
                        id="quiz-model"
                        value={modelReady ? model : ""}
                        disabled={!modelReady}
                        onChange={(e) => pickModel(e.target.value)}
                        className="field min-h-[44px] appearance-none bg-bone pr-8 disabled:opacity-60"
                      >
                        <option value="">
                          {!year
                            ? "Pick a year first"
                            : !make
                              ? "Pick a make first"
                              : live.loading
                                ? "Loading models…"
                                : "Select model"}
                        </option>
                        {modelReady &&
                          models.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        {modelReady && (
                          <option value={OTHER}>{OTHER_LABEL}</option>
                        )}
                      </select>
                    </div>
                  </div>
                )}
                {mode === "vehicle" && (
                  <button
                    type="button"
                    onClick={typeSizeInstead}
                    className="mt-2 inline-flex min-h-[44px] items-center text-left text-[15px] font-semibold text-drop underline underline-offset-[3px] hover:text-dive"
                  >
                    My vehicle isn&rsquo;t listed — I&rsquo;ll type my size
                  </button>
                )}

                <div className={mode === "vehicle" ? "mt-5" : ""}>
                  <label htmlFor="quiz-size" className="label">
                    Tire size
                  </label>
                  <Input
                    id="quiz-size"
                    ref={sizeRef}
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    value={sizeText}
                    onChange={(e) => {
                      setSizeText(e.target.value);
                      setStepError("");
                    }}
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder="225/50R17"
                    aria-describedby="quiz-size-help"
                    className="field min-h-[44px] font-display text-[17px] tracking-[-0.01em]"
                  />
                  <p
                    id="quiz-size-help"
                    className="mt-2 text-[13px] leading-snug text-smoke"
                  >
                    {mode === "vehicle" && guess
                      ? `${guess[0]} is the most common original fitment for a ${year ? `${year} ` : ""}${model}. Trims and model years move it around, so the size printed on your sidewall — or the sticker in your driver's door jamb — is the one that counts. Change it here if it differs.`
                      : mode === "vehicle" && model
                        ? "Type the size printed on your sidewall — or on the sticker in your driver's door jamb. It looks like 225/50R17; LT265/70R17 and 31x10.50R15 work too."
                        : "It is printed on the sidewall: three numbers and a letter, like 225/50R17. LT and flotation sizes such as LT265/70R17 or 31x10.50R15 work too."}
                  </p>

                  {/* Staggered fitments are the one way this quiz can send
                      somebody four tires when only two of them fit. Cars in
                      this class routinely run a wider tire at the back, and
                      nothing about the front size reveals that — so say it
                      before they answer, not after they order. */}
                  {mode === "vehicle" && guess?.[1] === "sports" && (
                    <p className="mt-2 flex items-start gap-1.5 rounded-sm bg-sky px-3 py-2 text-[13px] leading-snug text-ink">
                      <Info
                        size={14}
                        aria-hidden
                        className="mt-0.5 shrink-0 text-drop"
                      />
                      <span>
                        A {model} may be <strong>staggered</strong> — a wider
                        tire on the rear than the front. Check both ends before
                        you buy four of anything. If the sizes differ, we will
                        sort it out on the phone.
                      </span>
                    </p>
                  )}
                  {typedSize && (
                    <p className="mt-2 flex items-start gap-1.5 text-[13px] leading-snug text-smoke">
                      <Check
                        size={14}
                        aria-hidden
                        className="mt-0.5 shrink-0 text-drop"
                      />
                      <span>
                        Read as {typedSize.normalized} — {typedSize.width}mm
                        wide, {typedSize.aspect} series, on a{" "}
                        {typedSize.rimDiameter}-inch wheel.
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <fieldset className="border-0 p-0">
                <legend className="sr-only">Where do you drive?</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ROAD_OPTIONS.map((o) => (
                    <OptionCard
                      key={o.value}
                      type="radio"
                      name="roads"
                      option={o}
                      checked={answers.roads === o.value}
                      onChange={(v) => {
                        patch({ roads: v });
                        setStepError("");
                      }}
                    />
                  ))}
                </div>
              </fieldset>
            )}

            {step === 3 && (
              <fieldset className="border-0 p-0">
                <legend className="sr-only">
                  What is the weather where you drive?
                </legend>
                <div className="grid gap-3">
                  {WEATHER_OPTIONS.map((o) => (
                    <OptionCard
                      key={o.value}
                      type="radio"
                      name="weather"
                      option={o}
                      checked={answers.weather === o.value}
                      onChange={(v) => {
                        patch({ weather: v });
                        setStepError("");
                      }}
                    />
                  ))}
                </div>
                <p className="mt-4 text-[13px] leading-snug text-smoke">
                  This one does real work: a summer compound is ruled out
                  entirely if you see snow, and a dedicated winter tire is ruled
                  out if you never freeze — it wears out fast in heat.
                </p>
              </fieldset>
            )}

            {step === 4 && (
              <fieldset className="border-0 p-0">
                <legend className="sr-only">What matters most?</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PRIORITY_OPTIONS.map((o) => {
                    const index = answers.priorities.indexOf(o.value);
                    return (
                      <OptionCard
                        key={o.value}
                        type="checkbox"
                        name="pri"
                        option={o}
                        checked={index >= 0}
                        badge={index >= 0 ? index + 1 : null}
                        onChange={() => togglePriority(o.value)}
                      />
                    );
                  })}
                </div>
                <p
                  className="mt-4 text-[13px] leading-snug text-smoke"
                  aria-live="polite"
                >
                  {answers.priorities.length === 0
                    ? "Nothing picked yet. The first pick counts for 2.6 of the weighting, the second for 1.4."
                    : answers.priorities.length === 1
                      ? `${PRIORITY_OPTIONS.find((o) => o.value === answers.priorities[0])?.label} first. Pick a second, or carry on with one.`
                      : `${PRIORITY_OPTIONS.find((o) => o.value === answers.priorities[0])?.label} first, ${PRIORITY_OPTIONS.find((o) => o.value === answers.priorities[1])?.label} second. Picking a third replaces the first.`}
                </p>
              </fieldset>
            )}

            {step === 5 && (
              <fieldset className="border-0 p-0">
                <legend className="sr-only">Budget per tire</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {BUDGET_BANDS.map((b) => (
                    <OptionCard
                      key={b.value}
                      type="radio"
                      name="budget"
                      option={{
                        value: b.value,
                        label: b.label,
                        detail: Number.isFinite(b.max)
                          ? `About ${money(b.max * SET_SIZE)} for a set of ${SET_SIZE}, before install.`
                          : "Ranked on fit and performance first, price second.",
                      }}
                      checked={answers.budget === b.value}
                      onChange={(v) => {
                        patch({ budget: v });
                        setStepError("");
                      }}
                    />
                  ))}
                </div>
                <p className="mt-4 text-[13px] leading-snug text-smoke">
                  Tires are priced per tire and sold in sets of {SET_SIZE}. The
                  set prices on the next screen are what you would actually pay.
                </p>
              </fieldset>
            )}
          </QuizShell>
        </form>
      </Section>
    </>
  );
}
