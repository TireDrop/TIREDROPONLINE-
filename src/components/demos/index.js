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

import { lazyPage } from "../../lib/lazyPage.js";

/**
 * How each demo is code-split: through lazyPage (src/lib/lazyPage.js), so a
 * demo inside a prerendered article is listed in that page's data-pages and
 * loaded before hydration, keeping the server-rendered HTML instead of
 * throwing it away as plain React.lazy could.
 *
 * lazyPage's key is the module's path under src/: the prerenderer looks it up
 * in Vite's build manifest (for modulepreload links) and fails the build on a
 * key that names no chunk. So the key is the demo's file, not its id.
 */
export const loadDemo = (file, importer) =>
  lazyPage(`components/demos/${file}`, importer);

export const DEMOS = {
  "tread-gauge": loadDemo("TreadGauge.jsx", () => import("./TreadGauge.jsx")),
  "dot-date-reader": loadDemo("DotDateReader.jsx", () =>
    import("./DotDateReader.jsx"),
  ),
  "size-decoder": loadDemo("SizeDecoder.jsx", () =>
    import("./SizeDecoder.jsx"),
  ),
  "tpms-light": loadDemo("TpmsLight.jsx", () => import("./TpmsLight.jsx")),
  "utqg-explainer": loadDemo("UtqgExplainer.jsx", () =>
    import("./UtqgExplainer.jsx"),
  ),
  "load-speed-check": loadDemo("LoadSpeedCheck.jsx", () =>
    import("./LoadSpeedCheck.jsx"),
  ),
  "plus-size-speedo": loadDemo("PlusSizeSpeedo.jsx", () =>
    import("./PlusSizeSpeedo.jsx"),
  ),
  "pressure-temp": loadDemo("PressureTemp.jsx", () =>
    import("./PressureTemp.jsx"),
  ),
  "damage-map": loadDemo("RepairabilityMap.jsx", () =>
    import("./RepairabilityMap.jsx"),
  ),
  "noise-vibration": loadDemo("NoiseVibration.jsx", () =>
    import("./NoiseVibration.jsx"),
  ),
  "rotation-pattern": loadDemo("RotationPattern.jsx", () =>
    import("./RotationPattern.jsx"),
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

  // Built (Phase 3)
  "load-speed-check": {
    title: "Load index and speed rating check",
    alt: "Compares a current tire's load index and speed rating with a replacement's, showing the load per tire and for four in pounds and kilograms, and whether the replacement meets or exceeds the current tire. A speed rating is the speed a tire was tested to carry its load, not a recommended driving speed.",
  },
  "plus-size-speedo": {
    title: "Plus sizing and speedometer",
    alt: "Compares a current and a new tire size by overall diameter, sidewall height and revolutions per mile, and shows what the speedometer reads at 30, 45, 60 and 70 mph. The common 3% diameter figure is a guideline, not a fitment approval, so have fitment confirmed before you order.",
  },
  "pressure-temp": {
    title: "Tire pressure and temperature",
    alt: "Shows how a tire's pressure rises and falls with air temperature, using both the common rule of thumb and the gas-law calculation. Set pressures cold, to the value on the vehicle's door placard.",
  },
  "damage-map": {
    title: "Can this tire be repaired?",
    alt: "Maps where on a tire a puncture may be repairable after an internal inspection and where damage means the tire should be replaced under industry repair practice. A technician must inspect the inside of the tire before any repair.",
  },
  "noise-vibration": {
    title: "Shake, hum or thump?",
    alt: "Answer when a noise or vibration happens, where you feel it and what you hear to see up to four possible causes, such as balance, a tire or wheel problem, alignment wear, brake rotors or a wheel bearing, with the service that checks each. The list comes from a simple rules table, not a diagnosis, so have it inspected.",
  },
  "rotation-pattern": {
    title: "Tire rotation pattern",
    alt: "Shows the rotation pattern that fits a vehicle's drivetrain, tread type and tire setup (forward cross, rearward cross, X-pattern, front-to-back or side-to-side) as a diagram and a step list. TIA suggests rotating at a regular interval, and the owner's manual's schedule and pattern come first.",
  },

  // Reserved (later phases): listed so articles can reference them now and
  // fall back to this text until the component ships.
  "wear-pattern": {
    title: "Tire wear pattern guide",
    alt: "Matches common uneven wear patterns, such as center, shoulder, one-edge and cupping wear, with their possible causes and the service that checks each. These are possible causes only; have a technician inspect the tire.",
  },
  hydroplaning: {
    title: "How hydroplaning happens",
    alt: "Illustrates how tread grooves clear water from under the tire and how shallower tread, deeper water and higher speed reduce the rubber in contact with the road. Many factors are involved, so slow down in rain and keep tires maintained.",
  },
  "spare-types": {
    title: "Spare tire types",
    alt: "Explains the common kinds of spare, from full-size to compact temporary spares, run-flats and sealant kits, and where each one's limits are printed. Follow the label on the spare and the owner's manual.",
  },
};
