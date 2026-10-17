/**
 * The brand logos on /brands, in the order they read on the page.
 *
 * Source: the brand-logo slide the distributor supplied for onboarding. It was
 * one small combined image, so each logo here is a crop of it, enlarged 4x with
 * the white background removed (public/brands/*.png). They are real logos but
 * soft at large sizes: swap any file for the brand's own SVG or large PNG and
 * keep the same name (or edit `file` here); nothing else changes.
 *
 * A logo here only says the brand is in the supply network. Whether a size is
 * orderable comes from the catalog, never from this list.
 *
 * `w` and `h` are the file's pixel size, so the page can reserve the space.
 */

export const BRAND_GROUPS = [
  {
    id: "tires",
    title: "Passenger and light truck tires",
    lede: "Cars, crossovers, SUVs and pickups.",
    brands: [
      { name: "Continental", file: "tire-continental.png", w: 264, h: 84 },
      { name: "Dunlop", file: "tire-dunlop.png", w: 332, h: 84 },
      { name: "Toyo Tires", file: "tire-toyo-tires.png", w: 288, h: 84 },
      { name: "Pirelli", file: "tire-pirelli.png", w: 260, h: 84 },
      { name: "Hercules Tires", file: "tire-hercules-tires.png", w: 296, h: 84 },
      { name: "General Tire", file: "tire-general-tire.png", w: 212, h: 128 },
      { name: "Falken", file: "tire-falken.png", w: 276, h: 128 },
      { name: "Nitto", file: "tire-nitto.png", w: 300, h: 128 },
      { name: "Hankook", file: "tire-hankook.png", w: 288, h: 128 },
      { name: "Ironman", file: "tire-ironman.png", w: 300, h: 128 },
      { name: "Nexen Tire", file: "tire-nexen-tire.png", w: 120, h: 108 },
      { name: "Nokian Tyres", file: "tire-nokian-tyres.png", w: 200, h: 108 },
      { name: "Kumho Tire", file: "tire-kumho-tire.png", w: 216, h: 108 },
      { name: "Laufenn", file: "tire-laufenn.png", w: 244, h: 108 },
      { name: "GT Radial", file: "tire-gt-radial.png", w: 228, h: 108 },
      { name: "Vogue Tyres", file: "tire-vogue-tyres.png", w: 276, h: 108 },
    ],
  },
  {
    id: "commercial",
    title: "Commercial, farm, trailer and specialty tires",
    lede: "Medium truck, farm, trailer, off-the-road, ATV, and lawn and garden.",
    brands: [
      { name: "Hercules Tires", file: "commercial-hercules-tires.png", w: 268, h: 104 },
      { name: "Ironman", file: "commercial-ironman.png", w: 288, h: 104 },
      { name: "Dynatrac Tires", file: "commercial-dynatrac-tires.png", w: 300, h: 104 },
      { name: "Toyo Tires", file: "commercial-toyo-tires.png", w: 308, h: 104 },
      { name: "Falken", file: "commercial-falken.png", w: 236, h: 104 },
      { name: "Continental", file: "commercial-continental.png", w: 240, h: 104 },
      { name: "Double Coin", file: "commercial-double-coin.png", w: 344, h: 116 },
      { name: "Kumho Tire", file: "commercial-kumho-tire.png", w: 224, h: 116 },
      { name: "Hankook", file: "commercial-hankook.png", w: 260, h: 116 },
      { name: "Firestone", file: "commercial-firestone.png", w: 280, h: 116 },
      { name: "Carlstar", file: "commercial-carlstar.png", w: 268, h: 116 },
      { name: "General Tire", file: "commercial-general-tire.png", w: 192, h: 116 },
      { name: "Hi-Run", file: "commercial-hi-run.png", w: 256, h: 112 },
      { name: "Regency", file: "commercial-regency.png", w: 344, h: 112 },
      { name: "Nitto", file: "commercial-nitto.png", w: 272, h: 112 },
      { name: "ITP", file: "commercial-itp.png", w: 232, h: 112 },
    ],
  },
  {
    id: "wheels",
    title: "Wheels",
    lede: "Street, off-road and replacement wheels.",
    brands: [
      { name: "TIS", file: "wheel-tis.png", w: 224, h: 100 },
      { name: "TIS Motorsports", file: "wheel-tis-motorsports.png", w: 220, h: 100 },
      { name: "Gear Off Road", file: "wheel-gear-off-road.png", w: 264, h: 100 },
      { name: "Edge Street", file: "wheel-edge-street.png", w: 360, h: 100 },
      { name: "Edge Offroad", file: "wheel-edge-offroad.png", w: 380, h: 100 },
      { name: "Motiv Wheels", file: "wheel-motiv-wheels.png", w: 228, h: 92 },
      { name: "Ultra Motorsports", file: "wheel-ultra-motorsports.png", w: 216, h: 92 },
      { name: "DTS", file: "wheel-dts.png", w: 232, h: 92 },
      { name: "Pacer", file: "wheel-pacer.png", w: 268, h: 92 },
      { name: "König", file: "wheel-konig.png", w: 204, h: 92 },
      { name: "Maxx1M", file: "wheel-maxx1m.png", w: 212, h: 92 },
      { name: "Mamba Off-Road", file: "wheel-mamba-off-road.png", w: 228, h: 100 },
      { name: "OE Performance", file: "wheel-oe-performance.png", w: 196, h: 100 },
      { name: "Focal", file: "wheel-focal.png", w: 232, h: 100 },
      { name: "Platinum Wheels", file: "wheel-platinum-wheels.png", w: 220, h: 100 },
      { name: "Cragar", file: "wheel-cragar.png", w: 204, h: 100 },
      { name: "Boyd Coddington", file: "wheel-boyd-coddington.png", w: 240, h: 100 },
    ],
  },
];

export const BRAND_COUNT = BRAND_GROUPS.reduce((n, g) => n + g.brands.length, 0);
