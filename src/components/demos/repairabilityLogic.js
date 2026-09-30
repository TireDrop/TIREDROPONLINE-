// Pure logic behind D13, Can this tire be repaired? (learn-plan §4): no React,
// no DOM, so it runs in the node test runner and in a build-time prerender.
//
// The rule set is the USTMA / TIA puncture-repair practice (S14, S19), with
// Michelin on bulges and damage (S37, S39):
//   - A repair is considered only in the tread area, for a puncture no larger
//     than 1/4 in (6 mm), and only after the tire is taken off the wheel and
//     inspected inside. The repair is a plug-patch combination.
//   - A bulge anywhere means internal damage: replace.
//   - Cracking and curb scrapes need a technician's look: have it inspected.
//   - Anything else (shoulder, sidewall, bead, a larger hole, a cut) is not
//     repairable under industry practice: replace.
//
// House rules: never "safe to repair" or "safe to drive". Every result ends
// with "A technician must inspect the inside of the tire."

import { STATUS } from "./demoLogic.js";

export const ZONES = [
  {
    id: "center",
    label: "Center tread",
    hint: "The flat middle of the tread that touches the road",
  },
  {
    id: "shoulder",
    label: "Shoulder",
    hint: "Where the tread curves down into the sidewall",
  },
  {
    id: "sidewall",
    label: "Sidewall",
    hint: "The side of the tire, with the size and brand printed on it",
  },
  {
    id: "bead",
    label: "Bead",
    hint: "The edge that seals against the wheel",
  },
];

export const DAMAGES = [
  { id: "puncture-small", label: "Nail or screw, 1/4 in (6 mm) or smaller" },
  { id: "puncture-large", label: "Puncture bigger than 1/4 in (6 mm)" },
  { id: "cut", label: "Cut or gash" },
  { id: "bulge", label: "Bulge or bubble" },
  { id: "cracking", label: "Cracking" },
  { id: "scrape", label: "Curb scrape" },
];

export const TECH_NOTE = "A technician must inspect the inside of the tire.";

/** Where the booking link goes: the service booking page, tire repair. */
export const BOOKING_HREF = "/schedule?service=tire-repair";

/** The USTMA / TIA repair standard, in the order a technician works. */
export const REPAIR_STANDARD = [
  "Tread area only. No repairs in the shoulder, sidewall or bead, or where the damage runs into the shoulder.",
  "The puncture is 1/4 in (6 mm) across or smaller.",
  "The tire comes off the wheel so the inside can be inspected. USTMA says never repair from the outside or with the tire on the wheel.",
  "A plug-patch combination: a rubber stem fills the hole and a patch seals the inner liner. A plug alone or a patch alone doesn't meet the standard.",
  "No overlapping repairs, and a tire with an earlier improper repair isn't repaired again.",
];

const zoneById = (id) => ZONES.find((z) => z.id === id) ?? null;
const damageById = (id) => DAMAGES.find((d) => d.id === id) ?? null;

const NOT_REPAIRABLE_ZONE = {
  shoulder:
    "Damage in the shoulder isn't repairable under USTMA and TIA practice. That part of the tire flexes the most and lacks the tread area's reinforcement, and TIA rules out repairs that reach into the shoulder or belt edge.",
  sidewall:
    "Damage in the sidewall isn't repairable under USTMA and TIA practice. The sidewall flexes with every turn of the wheel and lacks the tread area's reinforcement, so a patch there isn't an accepted repair.",
  bead:
    "Damage at the bead isn't repairable under industry practice. The bead is what holds and seals the tire on the wheel.",
};

/**
 * The result for one zone and one kind of damage.
 *
 * Returns { status, headline, body, standard, closing, sources } or null for
 * an unknown zone or damage id.
 */
export function assessDamage(zoneId, damageId) {
  const zone = zoneById(zoneId);
  const damage = damageById(damageId);
  if (!zone || !damage) return null;

  const base = {
    zone: zone.id,
    damage: damage.id,
    zoneLabel: zone.label,
    damageLabel: damage.label,
    standard: null,
    closing: TECH_NOTE,
    bookingHref: BOOKING_HREF,
  };

  if (damage.id === "bulge") {
    return {
      ...base,
      outcome: "replace",
      status: STATUS.replace,
      headline: "Replace this tire",
      body: "A bulge or bubble means the tire's inner structure is damaged and air has reached the body of the tire. Michelin advises replacing a tire with a bulge, and it isn't repairable under USTMA and TIA practice.",
      sources: ["S37", "S39", "S14"],
    };
  }

  if (zone.id === "center" && damage.id === "puncture-small") {
    return {
      ...base,
      outcome: "maybe",
      status: STATUS.inspect,
      headline: "May be repairable, only after an inside inspection",
      body: "A small puncture in the center tread is the one case the USTMA and TIA repair standard allows. Whether this tire qualifies depends on what the inside looks like, which can't be seen from the tread. An outside plug on its own doesn't meet the standard.",
      standard: REPAIR_STANDARD,
      sources: ["S14", "S19"],
    };
  }

  if (damage.id === "cracking" || damage.id === "scrape") {
    const body =
      damage.id === "cracking"
        ? "Cracking can come from age, sun and heat. A technician checks how deep the cracks go and reads the tire's DOT date code to see how old it is."
        : zone.id === "center"
          ? "A scrape across the tread can be only in the surface rubber, or it can cut into the belts underneath. A technician needs to look at it closely."
          : `A scrape on the ${zone.label.toLowerCase()} can be only in the surface rubber, or it can cut into the cords underneath. If it has, the tire isn't repairable under industry practice.`;
    return {
      ...base,
      outcome: "inspect",
      status: STATUS.inspect,
      headline: "Have it inspected",
      body,
      sources: ["S39", "S1"],
    };
  }

  let body;
  if (zone.id === "center") {
    body =
      damage.id === "puncture-large"
        ? "A puncture bigger than 1/4 in (6 mm) is larger than USTMA and TIA allow for a repair, even in the center tread."
        : "A cut or gash is outside what USTMA and TIA allow for a repair. The standard covers punctures up to 1/4 in (6 mm) in the tread area.";
  } else {
    body = NOT_REPAIRABLE_ZONE[zone.id];
  }

  return {
    ...base,
    outcome: "replace",
    status: STATUS.replace,
    headline: "Not repairable under industry practice",
    body,
    sources: ["S14", "S19", "S39"],
  };
}

/** One line for screen readers and the SVG description. */
export function describeSelection(zoneId, damageId) {
  const zone = zoneById(zoneId);
  const damage = damageById(damageId);
  if (!zone || !damage) return "";
  return `${damage.label}, ${zone.label.toLowerCase()}.`;
}
