// The standalone pages for the Learn demos that also work as tools on their
// own: one route each (src/App.jsx), rendered by
// src/pages/tools/DemoToolPage.jsx and prerendered like /tire-size and
// /tire-check. The demo itself is the registry's (./index.js); this file holds
// only the page copy around it.
//
// Plain data with no imports, so toolPages.test.mjs can check it under Node:
// house rules (never "safe", "OK" or "fine"; no discounts, dates or reviews),
// that every related path is a published article or a real page, and that
// every booking slug is a service in src/data/services.js.
//
//   id        the demo id in DEMOS / DEMO_META, and /tools/<id> redirects here
//   path      the page's URL, at the root like the other free tools
//   aliases   extra /tools/<alias> paths the content plans link
//             (docs/content/blog-plan.md)
//   label     short name for breadcrumbs, the nav and link lists
//   blurb     one line for tool lists (Learn page)
//   seoTitle  <title> before " | TireDrop"; unique across the site
//   h1, intro the page heading and its 2–3 sentence lede
//   howTo     the steps under "How to use it"
//   faq       3–4 { q, a }
//   related   1–3 Learn or Blog articles, then any site pages
//   services  service slugs to book, most relevant first

export const TOOL_PAGES = [
  {
    id: "load-speed-check",
    path: "/load-speed-check",
    aliases: [],
    label: "Load and speed rating check",
    blurb: "Does a new tire's load index and speed rating match the old one?",
    seoTitle: "Load Index and Speed Rating Check",
    description:
      "Compare the load index and speed rating on your current tire with a replacement: load per tire and for four, in lb and kg, and whether it measures up.",
    h1: "Does the new tire's load index and speed rating measure up?",
    intro:
      "The number and letter after a tire size, like the 94V in 225/45R17 94V, are its load index and speed rating. Enter the ones on your current tire and on the tire you're looking at to see the load each carries, per tire and for all four, and whether the new one meets or exceeds the old. Start from what your vehicle maker specifies on the door placard.",
    howTo: [
      "Find the load index and speed rating on your current tire's sidewall: the number and letter right after the size, such as 94V. The door placard or owner's manual lists what your vehicle maker specifies.",
      "Type it into “Your current tire”, or pick the load index and speed rating from the lists.",
      "Do the same for the tire you're considering.",
      "Read load and speed separately. A tire below your current one on either isn't a like-for-like replacement.",
    ],
    faq: [
      {
        q: "Can I use a tire with a lower load index?",
        a: "Replacement tires should match or exceed the load index your vehicle maker specifies. USTMA says never to go lower. A lower index means each tire is rated to carry less weight at its proper pressure.",
      },
      {
        q: "Is the speed rating a speed I can drive at?",
        a: "No. A speed rating is the speed a tire was tested to carry its load under lab conditions, not a recommended driving speed. Match or exceed the rating your vehicle maker calls for, and drive to the posted limit and the conditions.",
      },
      {
        q: "What does XL after the load index mean?",
        a: "XL marks an extra-load version of the size. It carries more than a standard-load tire of the same size, at the higher pressures in the tire maker's load and inflation tables. A tire with no load marking is standard load (SL).",
      },
      {
        q: "Why does an LT tire show two load indexes?",
        a: "An LT marking such as 121/118 gives two figures. The first is for a single tire, and the second is for pairs on dual rear wheels. Compare the first one.",
      },
    ],
    related: [
      "/learn/sidewall/how-to-read-tire-size",
      "/blog/tesla-model-y-tires-guide",
      "/tire-size",
    ],
    services: ["tire-installation"],
  },
  {
    id: "plus-size-speedo",
    path: "/plus-size-calculator",
    aliases: ["plus-size"],
    label: "Plus size calculator",
    blurb: "Bigger wheels? Overall diameter and speedometer change.",
    seoTitle: "Plus Size Calculator and Speedometer Check",
    description:
      "Compare two tire sizes by overall diameter, sidewall height and revolutions per mile, and see what your speedometer reads at 30, 45, 60 and 70 mph.",
    h1: "Going to bigger wheels? Check the size change first",
    intro:
      "Plus sizing means a larger wheel with a lower-profile tire, keeping the overall diameter close to the original. Enter your current size and the new one to compare overall diameter, sidewall height and revolutions per mile, and see what your speedometer would read at 30, 45, 60 and 70 mph. The common 3% figure is a guideline, not a fitment approval.",
    howTo: [
      "Enter the size on your door placard as the current size. The tires on the car now may not match it.",
      "Enter the size you're considering. Metric, LT and flotation sizes all work, or tap an example.",
      "Check the overall diameter change, the drawing and the speedometer table.",
      "Add the load index to both sizes, such as 225/40R18 92W, to compare it too.",
      "Have fitment confirmed before you order. Clearance, wheel width and load index all matter.",
    ],
    faq: [
      {
        q: "What is plus sizing?",
        a: "Fitting a larger-diameter wheel with a lower-profile tire, such as going from 205/55R16 to 225/40R18, so the overall diameter stays close to the original. One inch more on the wheel is plus one; two inches is plus two.",
      },
      {
        q: "How much can the overall diameter change?",
        a: "Fitment guides commonly work to 3% or less. That's a guideline, not an approval: load index, clearance to the body and suspension, and wheel width all matter, so have fitment confirmed before you order.",
      },
      {
        q: "Why does my speedometer read differently with bigger tires?",
        a: "The speedometer counts how often the wheels turn. A taller tire covers more ground each turn, so the car is going faster than the speedometer says, and a shorter tire does the opposite. The odometer is off by the same amount.",
      },
      {
        q: "Do I need new wheels?",
        a: "If the wheel diameter in the size changes, such as R17 to R18, yes, and the tool says so. A much wider tire can also need a wider wheel, so check the rim widths the tire maker lists for that size.",
      },
    ],
    related: ["/learn/sidewall/how-to-read-tire-size", "/tire-size"],
    services: ["wheel-installation", "tire-installation"],
  },
  {
    id: "pressure-temp",
    path: "/tire-pressure-temperature",
    aliases: ["pressure-temperature"],
    label: "Pressure and temperature",
    blurb: "How much tire pressure moves with the weather.",
    seoTitle: "Tire Pressure Temperature Calculator",
    description:
      "Estimate how much your tire pressure rises or falls with the air temperature, by the rule of thumb and the gas law, then set it cold to your door placard.",
    h1: "How much does tire pressure change with the temperature?",
    intro:
      "Air in a tire reads higher when it's warm and lower when it's cool. Enter your door-sticker pressure, the temperature when you filled the tires and the temperature now to see the estimated reading by the common rule of thumb and by the gas law. Whatever the estimate says, set pressure cold, to the door placard.",
    howTo: [
      "Enter the cold pressure from the sticker in the driver's door jamb, not the maximum on the sidewall.",
      "Enter the air temperature when the tires were last set, cold.",
      "Move the temperature-now slider, or try one of the Florida days.",
      "Check each tire with a gauge when it's cold. If one reads below the placard, add air.",
    ],
    faq: [
      {
        q: "How much does tire pressure change per 10 degrees?",
        a: "USTMA and Goodyear put it at one to two psi for every 10°F, and Bridgestone says about 1 psi. The gas-law estimate for a typical passenger tire lands a little under 1 psi per 10°F.",
      },
      {
        q: "Should I let air out when the tires read high on a hot day?",
        a: "No. NHTSA's guidance is that pressure rises as tires warm, and letting air out of a warm tire can leave it low once it cools. Recheck after the car has been parked for three hours or more.",
      },
      {
        q: "Why did the tire pressure light come on on a cool morning?",
        a: "As the air cools, so does the pressure. A tire that was already a little low can drop far enough overnight to trigger the light. Set all four to the placard pressure, cold, even if the light goes out as the day warms up.",
      },
      {
        q: "What counts as a cold tire?",
        a: "NHTSA defines cold as parked for at least three hours, so first thing in the morning is the easiest time to check.",
      },
    ],
    related: [
      "/learn/pressure/tire-pressure-temperature",
      "/learn/pressure/tpms-light",
      "/learn/florida/florida-heat-tires",
    ],
    services: ["tpms-service"],
  },
  {
    id: "damage-map",
    path: "/can-my-tire-be-repaired",
    aliases: [],
    label: "Can my tire be repaired?",
    blurb: "Where the damage is decides it. See what repair practice says.",
    seoTitle: "Can My Tire Be Repaired? Puncture Repair Check",
    description:
      "Pick where the damage is and what it looks like to see what USTMA and TIA repair practice says: may be repairable after an inspection, or replace.",
    h1: "Can your tire be repaired?",
    intro:
      "Where the damage is decides it as much as what caused it. Pick the spot on the tire and the kind of damage to see what USTMA and Tire Industry Association repair practice says. Only a small puncture in the tread area may be repairable, and only after a technician inspects the inside of the tire.",
    howTo: [
      "Find the damage and tap its zone on the diagram (center tread, shoulder, sidewall or bead), or choose it from the list.",
      "Choose what it looks like: a nail or screw, a larger puncture, a cut, a bulge, cracking or a curb scrape.",
      "Read the result. Replace means it isn't repairable under industry practice. Have it inspected means a technician needs to look first.",
      "Check the pressure with a gauge. If the tire is flat or dropping fast, don't drive on it: put the spare on or call for help.",
    ],
    faq: [
      {
        q: "Can a tire with a nail in it be repaired?",
        a: "Sometimes. Under USTMA and TIA practice, a puncture 1/4 inch (6 mm) or smaller in the tread area may be repaired with a plug and patch together, fitted from the inside, once the tire is off the wheel and the inside has been inspected.",
      },
      {
        q: "Can a puncture in the sidewall be patched?",
        a: "No. USTMA says punctures or cuts in the sidewall or shoulder can't be repaired, because that part of the tire flexes the most and lacks the tread area's reinforcement. Replace the tire.",
      },
      {
        q: "Is a plug from a roadside kit a proper repair?",
        a: "No. USTMA calls a plug alone an unacceptable repair, and a tire with an earlier improper repair isn't repaired again. A plug pushed in from the outside can turn a repairable tire into one that has to be replaced.",
      },
      {
        q: "Can a bulge or bubble be repaired?",
        a: "No. A bulge means the tire's inner structure is damaged. Michelin says a tire with a bulge or bubble can't be repaired and must be replaced.",
      },
    ],
    related: [
      "/learn/damage/patch-vs-plug",
      "/learn/damage/tire-bubble-sidewall",
      "/blog/storm-cleanup-nail-in-tire",
    ],
    services: ["tire-repair"],
  },
  {
    id: "noise-vibration",
    path: "/car-shaking-checker",
    aliases: [],
    label: "Car shaking checker",
    blurb: "Shake, hum or thump? Possible causes and who checks each.",
    seoTitle: "Car Shaking or Tire Noise? Symptom Checker",
    description:
      "Answer when a vibration or noise happens, where you feel it and what you hear, and see possible causes and the service that checks each. Not a diagnosis.",
    h1: "Car shaking, humming or thumping?",
    intro:
      "A vibration or noise can come from the tires, the wheels, the alignment, the brakes or a wheel bearing. Answer three questions about when it happens, where you feel it and what you hear, and see up to four possible causes, strongest match first, with the service that checks each. It's a simple rules table, not a diagnosis, so have it inspected.",
    howTo: [
      "Pick when it happens: at highway speed, when braking, when turning, all the time or at low speed.",
      "Pick where you feel it: the steering wheel, the seat or floor, the brake pedal, or nowhere because you only hear it.",
      "Pick what you hear, if anything.",
      "Read the list, then book an inspection and tell us what you answered.",
    ],
    faq: [
      {
        q: "Why does my steering wheel shake at highway speed?",
        a: "A wheel out of balance is a common cause of a shake you feel in the steering wheel at highway speed. A tire that's out of round, a separated belt or a bent wheel can feel similar. A technician can check the balance and look over the tires and wheels.",
      },
      {
        q: "Why does the car shake when I brake?",
        a: "A vibration you feel through the brake pedal or steering wheel when braking can point to warped or worn brake rotors. Have the brakes inspected.",
      },
      {
        q: "What does a hum that gets louder with speed mean?",
        a: "Uneven or cupped tread and a worn wheel bearing can both make a hum or roar that rises with speed. They're hard to tell apart by ear, so have it inspected.",
      },
      {
        q: "Is this a diagnosis?",
        a: "No. The list comes from a fixed rules table: each answer adds points to the causes it's linked to, and the points only order the list. Only an inspection can tell what's causing it.",
      },
    ],
    related: [
      "/learn/damage/tire-bubble-sidewall",
      "/learn/tread/tread-depth",
    ],
    services: ["tire-balancing", "wheel-alignment", "brake-repair"],
  },
  {
    id: "rotation-pattern",
    path: "/tire-rotation-pattern",
    aliases: [],
    label: "Tire rotation pattern",
    blurb: "The rotation pattern for your drivetrain and tires.",
    seoTitle: "Tire Rotation Pattern for Your Drivetrain",
    description:
      "Pick your drivetrain, tread type and setup to see the tire rotation pattern: forward cross, rearward cross, X-pattern, front-to-back or side-to-side.",
    h1: "Which tire rotation pattern does your car need?",
    intro:
      "The right rotation pattern depends on which wheels drive the car, whether the tread is directional and whether all four tires are the same size. Pick yours to see the pattern as a diagram and a step list. Your owner's manual's schedule and pattern come first.",
    howTo: [
      "Pick the drivetrain: front-wheel, rear-wheel, all-wheel or 4-wheel drive. The owner's manual says which you have.",
      "Pick the tread type. A directional tire has an arrow on the sidewall showing which way it rolls.",
      "Pick the setup: the same size all around, or staggered, with wider tires on the rear.",
      "Press “Show the move” to see where each tire ends up.",
    ],
    faq: [
      {
        q: "How often should tires be rotated?",
        a: "The Tire Industry Association suggests every 5,000 to 7,000 miles. Your owner's manual's schedule comes first, and some vehicle makers set their own.",
      },
      {
        q: "Can directional tires be rotated side to side?",
        a: "Not on their own wheels. A directional tire is built to roll one way, so it moves front to back on the same side. Moving it to the other side means remounting it on the wheel.",
      },
      {
        q: "How do you rotate staggered tires?",
        a: "When the rear tires are wider than the fronts, they can't swap axles. Non-directional staggered tires can swap sides on the same axle. Staggered directional tires can't swap sides or axles without being remounted, so ask us about your setup.",
      },
      {
        q: "Why rotate tires at all?",
        a: "Tires in different positions wear at different rates. Rotating on a regular schedule spreads that wear across the set, so the four wear more evenly.",
      },
    ],
    related: ["/learn/tread/tread-depth", "/blog/tesla-model-y-tires-guide"],
    services: ["tire-rotation"],
  },
];

export const TOOL_PAGE_BY_ID = Object.fromEntries(
  TOOL_PAGES.map((t) => [t.id, t]),
);

/** /tools/<alias> → page path, for the demo ids and the planned aliases. */
export const TOOL_PAGE_ALIASES = Object.fromEntries(
  TOOL_PAGES.flatMap((t) => [t.id, ...t.aliases].map((a) => [a, t.path])),
);
