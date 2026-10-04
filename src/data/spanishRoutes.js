// The Spanish test pages: the one switch, and which English page each one is
// the twin of. Plain data with no imports, so the Seo component (which sits in
// every page's bundle), the sitemap script (plain Node) and the tests can all
// read it. The Spanish copy itself is in src/data/spanishPages.js, which only
// the two Spanish pages load.
//
// Runbook, and the review a native speaker has to do before the switch is
// flipped: docs/ops/spanish-pages.md.

/**
 * THE INDEXING GUARD. Justin cannot read this copy, so until a native Spanish
 * speaker has approved it:
 *
 *   false  both Spanish pages build and render (for the preview), but say
 *          "noindex, follow", are left out of sitemap.xml, are not named in
 *          the English pages' hreflang tags, and the English pages show no
 *          "Español" link.
 *   true   they are indexable, in the sitemap, paired with their English twin
 *          by hreflang in both directions, and linked from it.
 *
 * Flip it only after the reviewer's sign-off (docs/ops/spanish-pages.md).
 */
export const SPANISH_PAGES_INDEXABLE = false;

export const ES_HUB_PATH = "/es/instalacion-movil";

/** [English path, Spanish path] for every Spanish page. */
export const SPANISH_TWINS = [
  ["/mobile-service", ES_HUB_PATH],
  ["/mobile-service/hialeah-fl", `${ES_HUB_PATH}/hialeah-fl`],
];

/** City slugs that have a Spanish page, under the Spanish hub. */
export const ES_CITY_SLUGS = ["hialeah-fl"];

export const esCityPath = (slug) => `${ES_HUB_PATH}/${slug}`;

const clean = (pathname) => (pathname || "/").replace(/\/+$/, "") || "/";

/** True for a path under /es/ (the Spanish pages). */
export const isSpanishPath = (pathname) => /^\/es(\/|$)/.test(clean(pathname));

/** "es" on a Spanish page, "en" everywhere else: the page's <html lang>. */
export const langFor = (pathname) => (isSpanishPath(pathname) ? "es" : "en");

/** Every Spanish page path. */
export const spanishPaths = () => SPANISH_TWINS.map(([, es]) => es);

/**
 * The same page in the other language, or null. The English side only has a
 * twin while the switch is on; the Spanish side always has one (it is a
 * preview, and its English page always exists).
 */
export function twinPath(pathname, indexable = SPANISH_PAGES_INDEXABLE) {
  const path = clean(pathname);
  const spanish = SPANISH_TWINS.find(([, es]) => es === path);
  if (spanish) return spanish[0];
  const english = SPANISH_TWINS.find(([en]) => en === path);
  return english && indexable ? english[1] : null;
}

/**
 * hreflang alternates for a page, as `[{ hreflang, path }]`, or `[]`. Both
 * pages of a pair list the same three entries (en-US, es-US, x-default to the
 * English page), so the pair is reciprocal. With the switch off nothing is
 * listed on either side: a noindex page is not offered to a search engine as
 * an alternate.
 */
export function hreflangFor(pathname, indexable = SPANISH_PAGES_INDEXABLE) {
  if (!indexable) return [];
  const path = clean(pathname);
  const pair = SPANISH_TWINS.find(([en, es]) => en === path || es === path);
  if (!pair) return [];
  const [en, es] = pair;
  return [
    { hreflang: "en-US", path: en },
    { hreflang: "es-US", path: es },
    { hreflang: "x-default", path: en },
  ];
}
