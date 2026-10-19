/**
 * Intrinsic pixel size of every logo in public/brand/logos/, used for the
 * width/height attributes on the Brands page <img> tags so the browser can
 * reserve each tile's space before the file loads (stable layout, no CLS).
 * Rasters are their real pixel size; SVGs with their own width/height use it; ratio-only SVGs use their viewBox ratio at 1000 wide.
 * Display size is still set by the tile's CSS (max-w/max-h, object-contain).
 * Add a row here when a logo is added to src/data/brandsAll.js.
 */
export const LOGO_SIZES = {
  "boyd-coddington.png": [900, 600],
  "bridgestone.png": [240, 180],
  "carlstar.jpg": [2458, 244],
  "continental.png": [1682, 517],
  "cragar.png": [230, 61],
  "double-coin.png": [320, 80],
  "dts.png": [714, 238],
  "dunlop.svg": [1200, 200],
  "dynatrac-tires.png": [260, 60],
  "edge-offroad.png": [1500, 208],
  "edge-street.png": [1500, 208],
  "falken.png": [3840, 2160],
  "firestone.svg": [171, 26],
  "focal.png": [250, 58],
  "gear-off-road.png": [278, 61],
  "general-tire.svg": [1000, 642.9],
  "gt-radial.svg": [188.3, 27.8],
  "hankook.png": [2131, 445],
  "hercules-tires.svg": [1000, 323.5],
  "hi-run.svg": [1000, 123.8],
  "ironman.svg": [1000, 313.7],
  "itp.png": [1000, 500],
  "konig.png": [522, 162],
  "kumho-tire.svg": [179.1, 46.9],
  "laufenn.svg": [198, 34],
  "mamba-off-road.png": [320, 150],
  "maxx1m.png": [320, 150],
  "michelin.png": [240, 180],
  "motiv-wheels.png": [3180, 792],
  "nexen-tire.png": [2486, 642],
  "nitto.svg": [186, 16],
  "nokian-tyres.png": [2113, 859],
  "oe-performance.png": [360, 108],
  "pacer.png": [453, 240],
  "pirelli.png": [240, 180],
  "platinum-wheels.svg": [1000, 1000],
  "regency.svg": [1000, 150.9],
  "tis-motorsports.webp": [707, 130],
  "tis.webp": [880, 195],
  "toyo-tires.png": [240, 180],
  "ultra-motorsports.png": [320, 320],
  "vogue-tyres.svg": [1000, 399.1],
};
