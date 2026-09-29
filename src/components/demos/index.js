// Registry of the interactive demos embedded in Learn and Blog articles.
//
// Contract (shared with the content system):
//   DEMOS      id → lazy component (see loadDemo). Only built demos are
//              listed.
//   DEMO_META  id → { title, alt }. Every id, built or reserved. `alt` is a
//              1–2 sentence text alternative describing what the demo
//              teaches, used as the no-JS / prerender fallback.
//
// Each demo is a default-export component with no required props and no
// window/document access during render, so a build-time prerender can
// render it. IDs match docs/content/learn-plan.md §4.

import { lazy } from "react";

/**
 * How each demo is code-split. The prerender branch (blog-p0) adds
 * src/lib/lazyPage.js, which keeps the server-rendered HTML through
 * hydration where plain React.lazy would throw it away.
 *
 * TODO(merge): once src/lib/lazyPage.js is on this branch, replace the body
 * below with the lazyPage call (the only change needed):
 *   import { lazyPage } from "../../lib/lazyPage.js";
 *   export const loadDemo = (id, importer) => lazyPage(`content/demos/${id}`, importer);
 */
export const loadDemo = (id, importer) => lazy(importer);

export const DEMOS = {
  "tread-gauge": loadDemo("tread-gauge", () => import("./TreadGauge.jsx")),
  "dot-date-reader": loadDemo("dot-date-reader", () =>
    import("./DotDateReader.jsx"),
  ),
  "size-decoder": loadDemo("size-decoder", () => import("./SizeDecoder.jsx")),
  "tpms-light": loadDemo("tpms-light", () => import("./TpmsLight.jsx")),
  "utqg-explainer": loadDemo("utqg-explainer", () =>
    import("./UtqgExplainer.jsx"),
  ),
};

export const DEMO_META = {
  // Built (Phase 2)
  "tread-gauge": {
    title: "Tread depth gauge",
    alt: "A tread cross-section from 10/32 inch down to 0/32 inch shows the tread-wear bars becoming flush at 2/32 inch, and when Lincoln's head (penny test, 2/32 inch) and Washington's head (quarter test, 4/32 inch) become fully visible. NHTSA and USTMA use 2/32 inch as the point to replace a tire, and Consumer Reports' testing supports considering replacement at 4/32 inch for wet roads.",
  },
  "dot-date-reader": {
    title: "DOT date code reader",
    alt: "The last four digits of a tire's DOT code are the week and year it was made, so 2319 means week 23 of 2019. Bridgestone recommends a professional inspection at least yearly from 5 years and replacing tires 10 years after manufacture, regardless of tread.",
  },
  "size-decoder": {
    title: "Tire size decoder",
    alt: "A size such as 225/45R17 94W breaks down into section width in millimeters (225), aspect ratio (45), radial construction (R), wheel diameter in inches (17), load index (94) and speed rating (W). The demo also works out sidewall height and overall diameter, including LT and flotation sizes like 33x12.50R20.",
  },
  "tpms-light": {
    title: "Tire pressure (TPMS) light",
    alt: "A steady tire pressure light means at least one tire may be well under-inflated, and a light that flashes for about 60 to 90 seconds and then stays on signals a system malfunction, per FMVSS No. 138. Either way, check pressures with a gauge when tires are cold, inflate to the door placard, and have the system inspected if the light stays on.",
  },
  "utqg-explainer": {
    title: "UTQG grade explainer",
    alt: "A UTQG marking such as 500 AA A gives treadwear relative to a control tire graded 100, a traction grade from wet straight-line braking (AA, A, B, C) and a temperature grade for heat resistance (A, B, C). Treadwear grades are assigned by each manufacturer and are most useful within one brand; they are not a mileage figure.",
  },

  // Reserved (later phases): listed so articles can reference them now and
  // fall back to this text until the component ships.
  "pressure-temp": {
    title: "Tire pressure and temperature",
    alt: "Shows how a tire's pressure rises and falls with air temperature, using both the common rule of thumb and the gas-law calculation. Set pressures cold, to the value on the vehicle's door placard.",
  },
  "load-speed": {
    title: "Load index and speed rating lookup",
    alt: "Looks up the per-tire load a load index stands for and the lab test speed a speed rating stands for. Replacement tires should match or exceed the vehicle maker's specified load index, and a speed rating is a test rating, not a recommended driving speed.",
  },
  "plus-size": {
    title: "Plus sizing and speedometer",
    alt: "Compares a current and a new tire size by overall diameter, sidewall height and revolutions per mile, and shows how the speedometer reading changes. Have fitment confirmed before changing sizes.",
  },
  "wear-pattern": {
    title: "Tire wear pattern guide",
    alt: "Matches common uneven wear patterns, such as center, shoulder, one-edge and cupping wear, with their possible causes and the service that checks each. These are possible causes only; have a technician inspect the tire.",
  },
  rotation: {
    title: "Tire rotation patterns",
    alt: "Shows the rotation pattern that fits a vehicle's drivetrain, tread type and tire setup, as a diagram and a step list. The owner's manual's schedule and pattern come first.",
  },
  hydroplaning: {
    title: "How hydroplaning happens",
    alt: "Illustrates how tread grooves clear water from under the tire and how shallower tread, deeper water and higher speed reduce the rubber in contact with the road. Many factors are involved, so slow down in rain and keep tires maintained.",
  },
  "spare-types": {
    title: "Spare tire types",
    alt: "Explains the common kinds of spare, from full-size to compact temporary spares, run-flats and sealant kits, and where each one's limits are printed. Follow the label on the spare and the owner's manual.",
  },
  "damage-map": {
    title: "Tire damage and repair zones",
    alt: "Maps where on a tire a puncture may be repairable after an internal inspection and where damage means the tire should be replaced under industry repair practice. A technician must inspect the inside of the tire before any repair.",
  },
  "noise-vibration": {
    title: "Tire noise and vibration checker",
    alt: "Walks through when and where a noise or vibration happens and lists possible causes, such as balance, tire, wheel or alignment issues, with the service that inspects each. These are possible causes, not a diagnosis; have it inspected.",
  },
};
