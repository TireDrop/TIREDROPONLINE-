/**
 * Every brand logo on the Brands page (/tires?view=brands, src/components/brands/BrandWall.jsx).
 *
 * One row per brand, tires first then wheels, A to Z inside each group (this is
 * the page's own order, not the home strip's ranked order in brandStrip.js).
 * Files live in public/brand/logos/ and are the brands' own files, saved as
 * downloaded; docs/content/brand-logos.md has where each came from.
 *
 * Fields
 *   kind    "tires" or "wheels": which group the brand belongs to.
 *   seg     every filter the brand shows under: tires, wheels, commercial.
 *           These are also the data-seg tags on each tile, so when the ATD feed
 *           is live the same tags can drive real filters (size, vehicle fit).
 *   dark    the artwork is white or yellow, so it sits on a dark tile.
 *   scale   the file has wide empty margins; scale it up inside the tile.
 *   lowRes  a small raster stand-in (SVG stand-ins stay sharp, so they skip
 *           this); it shows at its own size, never
 *           blown up, until the official file arrives (launch checklist).
 *
 * Logos are not links yet: the catalog has no per-brand pages until the ATD
 * feed is live.
 */
export const BRANDS_ALL = [
  { name: "Bridgestone", file: "bridgestone.png", kind: "tires", seg: ["tires"], lowRes: true },
  { name: "Carlstar", file: "carlstar.jpg", kind: "tires", seg: ["tires", "commercial"] },
  { name: "Continental", file: "continental.png", kind: "tires", seg: ["tires", "commercial"], dark: true },
  { name: "Double Coin", file: "double-coin.png", kind: "tires", seg: ["tires", "commercial"], lowRes: true },
  { name: "Dunlop", file: "dunlop.svg", kind: "tires", seg: ["tires"] },
  { name: "Dynatrac Tires", file: "dynatrac-tires.png", kind: "tires", seg: ["tires", "commercial"], lowRes: true },
  { name: "Falken", file: "falken.png", kind: "tires", seg: ["tires", "commercial"], scale: 1.7 },
  { name: "Firestone", file: "firestone.svg", kind: "tires", seg: ["tires", "commercial"] },
  { name: "General Tire", file: "general-tire.svg", kind: "tires", seg: ["tires", "commercial"] },
  { name: "GT Radial", file: "gt-radial.svg", kind: "tires", seg: ["tires"] },
  { name: "Hankook", file: "hankook.png", kind: "tires", seg: ["tires", "commercial"] },
  { name: "Hercules Tires", file: "hercules-tires.svg", kind: "tires", seg: ["tires", "commercial"], dark: true },
  { name: "Hi-Run", file: "hi-run.svg", kind: "tires", seg: ["tires", "commercial"] },
  { name: "Ironman", file: "ironman.svg", kind: "tires", seg: ["tires", "commercial"] },
  { name: "ITP", file: "itp.png", kind: "tires", seg: ["tires", "commercial"] },
  { name: "Kumho Tire", file: "kumho-tire.svg", kind: "tires", seg: ["tires", "commercial"] },
  { name: "Laufenn", file: "laufenn.svg", kind: "tires", seg: ["tires"] },
  { name: "Michelin", file: "michelin.png", kind: "tires", seg: ["tires"], lowRes: true },
  { name: "Nexen Tire", file: "nexen-tire.png", kind: "tires", seg: ["tires"] },
  { name: "Nitto", file: "nitto.svg", kind: "tires", seg: ["tires", "commercial"] },
  { name: "Nokian Tyres", file: "nokian-tyres.png", kind: "tires", seg: ["tires"] },
  { name: "Pirelli", file: "pirelli.png", kind: "tires", seg: ["tires"], lowRes: true },
  { name: "Regency", file: "regency.svg", kind: "tires", seg: ["tires", "commercial"] },
  { name: "Toyo Tires", file: "toyo-tires.png", kind: "tires", seg: ["tires", "commercial"], lowRes: true },
  { name: "Vogue Tyres", file: "vogue-tyres.svg", kind: "tires", seg: ["tires"] },
  { name: "Boyd Coddington", file: "boyd-coddington.png", kind: "wheels", seg: ["wheels"], lowRes: true },
  { name: "Cragar", file: "cragar.png", kind: "wheels", seg: ["wheels"], lowRes: true },
  { name: "DTS", file: "dts.png", kind: "wheels", seg: ["wheels"] },
  { name: "Edge Offroad", file: "edge-offroad.png", kind: "wheels", seg: ["wheels"], dark: true },
  { name: "Edge Street", file: "edge-street.png", kind: "wheels", seg: ["wheels"], dark: true },
  { name: "Focal", file: "focal.png", kind: "wheels", seg: ["wheels"], lowRes: true },
  { name: "Gear Off Road", file: "gear-off-road.png", kind: "wheels", seg: ["wheels"], dark: true, lowRes: true },
  { name: "König", file: "konig.png", kind: "wheels", seg: ["wheels"] },
  { name: "Mamba Off-Road", file: "mamba-off-road.png", kind: "wheels", seg: ["wheels"], lowRes: true },
  { name: "Maxx1M", file: "maxx1m.png", kind: "wheels", seg: ["wheels"], lowRes: true },
  { name: "Motiv Wheels", file: "motiv-wheels.png", kind: "wheels", seg: ["wheels"] },
  { name: "OE Performance", file: "oe-performance.png", kind: "wheels", seg: ["wheels"], lowRes: true },
  { name: "Pacer", file: "pacer.png", kind: "wheels", seg: ["wheels"], lowRes: true },
  { name: "Platinum Wheels", file: "platinum-wheels.svg", kind: "wheels", seg: ["wheels"] },
  { name: "TIS", file: "tis.webp", kind: "wheels", seg: ["wheels"], dark: true },
  { name: "TIS Motorsports", file: "tis-motorsports.webp", kind: "wheels", seg: ["wheels"], dark: true, lowRes: true },
  { name: "Ultra Motorsports", file: "ultra-motorsports.png", kind: "wheels", seg: ["wheels"], lowRes: true },
];

export const BRAND_FILTERS = [
  { id: "all", label: "All brands" },
  { id: "tires", label: "Tires" },
  { id: "wheels", label: "Wheels" },
  { id: "commercial", label: "Commercial" },
];
