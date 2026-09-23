// Service catalog. `mobile: true` means the van can perform it at the customer's
// location; everything else is bay work at the Sunrise shop.
// Slugs drive the /services/:slug route.

export const SERVICES = [
  {
    slug: "tire-installation",
    name: "Tire Installation",
    mobile: true,
    category: "Tires",
    blurb:
      "Mount and install new tires at your home, office or jobsite — no waiting room, no tow.",
    duration: "45–75 min",
    priceFrom: 25,
    priceUnit: "per tire",
    includes: [
      "Dismount and disposal of old tires",
      "Mount and seat new tires on your wheels",
      "Road-force-style balance on every wheel",
      "Valve stem replacement",
      "Torque to manufacturer spec",
      "TPMS reset where equipped",
    ],
    symptoms: [
      "Tread worn to the wear bars",
      "Tires older than six years",
      "Sidewall cracking or bulging",
    ],
  },
  {
    slug: "tire-balancing",
    name: "Tire Balancing",
    mobile: true,
    category: "Tires",
    blurb:
      "Kill the steering-wheel shimmy. Precision balancing performed in your driveway.",
    duration: "30–45 min",
    priceFrom: 15,
    priceUnit: "per tire",
    includes: [
      "Wheel weight removal and cleanup",
      "Dynamic balance on a calibrated spin balancer",
      "Re-torque to spec",
      "Road test on request",
    ],
    symptoms: [
      "Steering wheel vibration above 45 mph",
      "Seat or floor buzz at highway speed",
      "Uneven cupped tread wear",
    ],
  },
  {
    slug: "tire-repair",
    name: "Tire Repair",
    mobile: true,
    category: "Tires",
    blurb:
      "Nail in your tread? We patch-plug it properly from the inside — the safe way.",
    duration: "30 min",
    priceFrom: 35,
    priceUnit: "per tire",
    includes: [
      "Dismount and internal inspection",
      "Combination patch-plug repair",
      "Rebalance after repair",
      "Pressure set to door-placard spec",
    ],
    symptoms: [
      "Slow leak or repeat low-pressure warnings",
      "Visible nail, screw or puncture",
      "Tire that will not hold air overnight",
    ],
  },
  {
    slug: "tire-rotation",
    name: "Tire Rotation",
    mobile: true,
    category: "Tires",
    blurb:
      "Even out wear and add thousands of miles to your set. Recommended every 5,000–7,500 miles.",
    duration: "30 min",
    priceFrom: 40,
    priceUnit: "per service",
    includes: [
      "Pattern rotation matched to your drivetrain",
      "Tread depth measured at every corner",
      "Pressure correction",
      "Torque to spec",
    ],
    symptoms: [
      "Front tires wearing faster than rear",
      "It has been over 7,500 miles",
      "Noise that changes with vehicle speed",
    ],
  },
  {
    slug: "wheel-installation",
    name: "Wheel Installation",
    mobile: true,
    category: "Wheels",
    blurb:
      "New wheels mounted, balanced and fitted with hub-centric rings for a true, vibration-free ride.",
    duration: "60–90 min",
    priceFrom: 35,
    priceUnit: "per wheel",
    includes: [
      "Fitment and clearance verification",
      "Mount and balance",
      "Hub-centric ring fitment",
      "Correct lug hardware check",
      "TPMS transfer or programming",
    ],
    symptoms: [
      "Upgrading to aftermarket wheels",
      "Bent or curbed wheel replacement",
      "Seasonal wheel and tire swap",
    ],
  },
  {
    slug: "oil-change",
    name: "Oil Change",
    mobile: true,
    category: "Maintenance",
    blurb:
      "Full-synthetic oil and a new filter while your car sits in its own parking spot.",
    duration: "30–45 min",
    priceFrom: 79,
    priceUnit: "per service",
    includes: [
      "Up to 5 quarts full-synthetic oil",
      "New oil filter",
      "Fluid top-off",
      "Multi-point visual inspection",
      "Used oil removed and recycled",
    ],
    symptoms: [
      "Maintenance-required light on",
      "Over 5,000 miles since last change",
      "Oil dark on the dipstick",
    ],
  },
  {
    slug: "tpms-service",
    name: "TPMS Service",
    mobile: true,
    category: "Maintenance",
    blurb:
      "Diagnose, reset or replace the pressure sensors behind that stubborn dashboard light.",
    duration: "30–60 min",
    priceFrom: 45,
    priceUnit: "per sensor",
    includes: [
      "Sensor scan and battery health check",
      "Sensor replacement where needed",
      "Relearn and programming to your vehicle",
      "Pressure set to placard spec",
    ],
    symptoms: [
      "TPMS light stays on after inflating",
      "TPMS light flashing at startup",
      "Sensor damaged during a prior install",
    ],
  },
  {
    slug: "brake-repair",
    name: "Brake Repair",
    mobile: false,
    category: "Repair",
    blurb:
      "Pads, rotors and full hydraulic diagnosis by technicians who do it every day.",
    duration: "2–3 hrs",
    priceFrom: 189,
    priceUnit: "per axle",
    includes: [
      "Pad and rotor measurement",
      "Caliper and slide pin service",
      "Hardware and shim replacement",
      "Brake fluid inspection",
      "Road test and bed-in",
    ],
    symptoms: [
      "Squealing or grinding when stopping",
      "Pedal pulsation under braking",
      "Longer stopping distances",
    ],
  },
  {
    slug: "wheel-alignment",
    name: "Wheel Alignment",
    mobile: false,
    category: "Repair",
    blurb:
      "Four-wheel computerized alignment that stops your new tires wearing out early.",
    duration: "60–90 min",
    priceFrom: 99,
    priceUnit: "four wheels",
    includes: [
      "Camber, caster and toe measurement",
      "Adjustment to factory spec",
      "Steering wheel centering",
      "Before-and-after printout",
    ],
    symptoms: [
      "Car pulls to one side",
      "Steering wheel off-center on a straight road",
      "Feathered or one-sided tire wear",
    ],
  },
  {
    slug: "suspension-repair",
    name: "Suspension Repair",
    mobile: false,
    category: "Repair",
    blurb:
      "Struts, shocks, bushings and control arms — the parts that keep your tires on the road.",
    duration: "2–4 hrs",
    priceFrom: 249,
    priceUnit: "per axle",
    includes: [
      "Full suspension inspection",
      "Strut and shock replacement",
      "Bushing and control arm service",
      "Alignment check after repair",
    ],
    symptoms: [
      "Bouncy or floaty ride",
      "Clunking over bumps",
      "Nose dive when braking",
    ],
  },
  {
    slug: "lift-kits",
    name: "Lift Kits",
    mobile: false,
    category: "Custom",
    blurb:
      "Leveling kits through full suspension lifts, spec'd around the tire and wheel package you want.",
    duration: "4–8 hrs",
    priceFrom: 599,
    priceUnit: "installed",
    includes: [
      "Fitment consultation",
      "Kit installation",
      "Driveline angle check",
      "Post-install alignment",
      "Torque re-check appointment",
    ],
    symptoms: [
      "Want more ground clearance",
      "Fitting oversized tires",
      "Correcting factory rake",
    ],
  },
  {
    slug: "diagnostics",
    name: "Diagnostics & Inspections",
    mobile: false,
    category: "Repair",
    blurb:
      "Check engine light scan and a straight answer about what it will actually cost to fix.",
    duration: "60 min",
    priceFrom: 89,
    priceUnit: "per scan",
    includes: [
      "Full OBD-II code scan",
      "Live data review",
      "Visual under-hood inspection",
      "Written findings and estimate",
    ],
    symptoms: [
      "Check engine light on",
      "Rough idle or hesitation",
      "Unexplained drop in fuel economy",
    ],
  },
];

export const getService = (slug) => SERVICES.find((s) => s.slug === slug);

export const MOBILE_SERVICES = SERVICES.filter((s) => s.mobile);
export const SHOP_SERVICES = SERVICES.filter((s) => !s.mobile);
