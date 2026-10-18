/**
 * The brand logos in the home page strip (src/components/home/BrandStrip.jsx),
 * in the order they run, best first.
 *
 * ORDER is an editorial order, not an official ranking. It follows the public
 * customer-satisfaction and test results listed in
 * docs/content/brand-strip-ranking.md, and the strip never shows numbers,
 * stars or "#1" labels. Brands our distributor does not list, and brands with
 * no usable logo file yet, are left out (see the same doc). Toyo and Pirelli
 * rank 6th and 7th there but only have 240x180 stand-ins, so they join the
 * strip, in those places, once real logo files arrive.
 *
 * Files live in public/brand/logos/. They are the brands' own files, saved
 * exactly as downloaded (docs/content/brand-logos.md has where each came from).
 *   dark:  the artwork is white or yellow, so it sits on a dark chip.
 *   scale: the file has wide empty margins; scale it up inside the chip.
 */
export const BRAND_STRIP = [
  { name: "Continental", file: "continental.png", dark: true },
  { name: "General Tire", file: "general-tire.svg" },
  { name: "Kumho Tire", file: "kumho-tire.svg" },
  { name: "Hankook", file: "hankook.png" },
  { name: "Nokian Tyres", file: "nokian-tyres.png" },
  { name: "Falken", file: "falken.png", scale: 1.7 },
  { name: "Firestone", file: "firestone.svg" },
  { name: "Nexen Tire", file: "nexen-tire.png" },
  { name: "Nitto", file: "nitto.svg" },
  { name: "Dunlop", file: "dunlop.svg" },
  { name: "Hercules Tires", file: "hercules-tires.svg", dark: true },
  { name: "Ironman", file: "ironman.svg" },
  { name: "GT Radial", file: "gt-radial.svg" },
  { name: "Laufenn", file: "laufenn.svg" },
  { name: "Vogue Tyres", file: "vogue-tyres.svg" },
];
