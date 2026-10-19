/**
 * Plain-English buying guide copy for /brands (src/pages/BrandsPage.jsx).
 *
 * General category education only. House rules for this file: no ranking of
 * brands, no quality claims about any named brand, no prices or deals, and no
 * statement that a brand or size is in stock.
 */
export const TIRE_TYPES = [
  {
    title: "Touring and all-season",
    body: "Built for daily commuting, with a quiet ride, even wear and light-snow ability. They suit most sedans, crossovers and minivans that see mixed weather.",
  },
  {
    title: "Performance",
    body: "Wider, with a stiffer sidewall and a tread made for grip and steering response. The trade-off is usually faster wear and weaker traction in cold or snow.",
  },
  {
    title: "All-terrain",
    body: "A more open tread and tougher sidewall for trucks and SUVs that split time between pavement, gravel and trails. Expect more road noise than a touring tire.",
  },
  {
    title: "Commercial and fleet",
    body: "Medium-truck, trailer and work-van tires built around load capacity, durability and retreading. Match the load range and ply rating to the job, not the look.",
  },
];

export const SIDEWALL_PARTS = [
  { code: "P", meaning: "tire type: P is passenger, LT is light truck, ST is special trailer" },
  { code: "245", meaning: "section width in millimeters" },
  { code: "45", meaning: "aspect ratio: sidewall height as a percent of width" },
  { code: "R", meaning: "radial construction" },
  { code: "18", meaning: "wheel diameter in inches" },
  { code: "100W", meaning: "load index (carrying capacity) and speed rating letter" },
];

export const WHEEL_BUILDS = [
  {
    title: "Cast",
    body: "Molten aluminum poured into a mold. The most common method for street wheels and offers the widest choice of styles.",
  },
  {
    title: "Forged",
    body: "Aluminum pressed from a solid billet under heat and force, giving a dense grain structure. Forged wheels are often lighter for a given strength.",
  },
  {
    title: "Off-road",
    body: "Built heavier for rock and trail use, often with deeper offsets or beadlock-style rings. Check the load rating before you buy.",
  },
];
