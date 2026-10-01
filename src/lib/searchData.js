/**
 * What the store search looks through in the browser (src/lib/siteSearch.js
 * does the matching): the catalog, the brand and category lists, the vehicle
 * makes, and the page index.
 *
 * The catalog and the lists are already in the main bundle (the header and
 * the vehicle finder use them). The page index is not: it is the
 * "virtual:site-pages" module vite.config.js builds from src/lib/sitePages.js,
 * loaded the first time someone uses the search box (loadSitePages).
 */
import {
  TIRES,
  TIRE_BRAND_NAMES,
  TIRE_CATEGORIES,
  WHEELS,
  WHEEL_BRAND_NAMES,
} from "../data/products.js";
import { MAKES } from "../data/vehicleList.js";

export const SEARCH_DATA = Object.freeze({
  tires: TIRES,
  wheels: WHEELS,
  tireBrands: TIRE_BRAND_NAMES,
  wheelBrands: WHEEL_BRAND_NAMES,
  categories: TIRE_CATEGORIES,
  makes: MAKES.map((m) => m[0]),
});

let pending = null;
let loaded = null;

/** The page index once it has loaded, or null. */
export const sitePagesNow = () => loaded;

/** Loads the page index (once); resolves to it, or to [] if the chunk fails. */
export function loadSitePages() {
  if (loaded) return Promise.resolve(loaded);
  if (!pending) {
    pending = import("virtual:site-pages")
      .then((m) => {
        loaded = m.default;
        return loaded;
      })
      .catch(() => {
        // Try again next time; sizes, brands and products still answer.
        pending = null;
        return [];
      });
  }
  return pending;
}
