# Technical SEO and indexing audit, 2026-10-04

Branch `seo/indexing-boost`, by Rank (technical SEO, team TireDrop). Read from the code at `origin/main` 3e04fe1 and from a real `npm run build` (196 prerendered routes). Context from Search Console on 2026-10-04: sitemap read OK with 192 pages discovered, home page indexed, Indexing report still processing.

## Headline

The site is already in good technical shape. Nothing in the crawl path is broken, and most of what the brief expected to find is either already in place or was a misreading.

| Claim | Finding |
| --- | --- |
| Live sitemap lists about 300 URLs, Search Console found 192 | The live `https://tiredroponline.com/sitemap.xml` has 192 `<loc>` entries today, the same as the committed `public/sitemap.xml` and Search Console. There is no gap. Whatever counted 300 was not this file. |
| No LocalBusiness / Service / FAQ JSON-LD on city pages | Present. Every `/mobile-service/<city>` page ships Organization, WebSite, WebPage, `AutoPartsStore`+`AutoRepair` (the shop, with the real address and phone), Service (city as `areaServed`), BreadcrumbList and FAQPage. The fetch tool most likely reads rendered text only. |
| Copy says "Extreme Tires van" | True in two meta descriptions (Tamarac, Weston), fixed. Extreme Tires is the disclosed parent business (`src/data/business.js`), so Tamarac's on-page intro still names "the Extreme Tires shop in Sunrise": left for Justin. |
| About 206 uncategorised URLs, maybe thin auto-generated | There are no auto-generated pattern pages beyond the 7 city and 7 state pages, each with its own copy. See the table. |

## How the files are made

- `scripts/generate-seo-files.mjs` derives the route list from `src/App.jsx` (static routes), the product, service, city and live-state catalogs, and the Markdown in `src/content` (Learn and Blog). Run on every `vite build` and again from the prerender.
- It drops anything vercel.json redirects (exact sources), any `<Navigate>` route, and `EXCLUDE` (`/cart`, `/checkout`, `/track`, `/search`). Those four render at 200 with `noindex, follow`.
- `lastmod` is the git date of the page's own source (page component plus its catalog file), or the article's own date for content. Never the build date. Where git cannot answer (shallow clone) it keeps the date already committed.
- `scripts/prerender.mjs` renders each route to `dist/<route>.html` and fails the build on: a throw, no h1 or under 200 characters of text, the 404 page, a missing Seo head, a canonical that is not the page's own URL, noindex on a page meant to be indexed, or a duplicate `<title>`.
- Head tags and JSON-LD come from `Seo`/`headFor`/`graphFor` in `src/components/ui/index.jsx`: canonical drops the query string; `index, follow` unless noindexed; BreadcrumbList on every inner page; LocalBusiness-type shop node on `SHOP_ROUTES` and city pages; Service on service, mobile and state pages; Article and FAQPage from `src/components/content/schema.js`.
- `robots.txt`: allow all, disallow `/checkout`, `/cart`, `/api/`, `/*?search=`, `/*?view=`, and names the sitemap. `/track` and `/search` are noindex, not disallowed, so crawlers can see the noindex. `*.vercel.app` gets `X-Robots-Tag: noindex`.

## Sitemap URL patterns (192 URLs)

| Pattern | URLs | Notes |
| --- | --- | --- |
| `/learn/<hub>/<guide>` | 41 | Article + Breadcrumb (+FAQ). |
| `/learn/<hub>` | 10 | Hub pages, about 2.5k to 3.5k characters of text: the thinnest of the content pages, but each has its own guide list. |
| `/learn` | 1 | |
| `/blog/<post>` | 49 | |
| `/blog` | 1 | |
| `/tires/<slug>` | 20 | Catalog sample products; Product node deliberately off (`EMIT_OFFERS`). |
| `/wheels/<slug>` | 12 | Same. |
| `/services/<slug>` | 12 | Service node. About 2.9k to 3.5k characters each. |
| `/mobile-service/<city>` | 7 | Sunrise, Plantation, Tamarac, Coral Springs, Davie, Fort Lauderdale, Weston. 6.4k+ characters each. |
| `/tires-shipped/<state>` | 7 | Live state pages only; the other states are unrouted. 6.8k+ characters each. |
| Top-level pages and tools | 32 | `/`, `/tires`, `/wheels`, `/tires-shipped`, `/mobile-service`, `/auto-service`, `/shipping`, `/install`, `/about`, `/contact`, `/locations`, `/schedule`, `/reviews`, `/gallery`, `/financing`, `/commercial-tires`, `/compare`, `/local-delivery`, `/find-my-tires`, `/tire-size`, `/tire-size-finder`, `/tire-check`, `/load-speed-check`, `/plus-size-calculator`, `/tire-pressure-temperature`, `/tire-rotation-pattern`, `/can-my-tire-be-repaired`, `/car-shaking-checker`, `/sitemap`, `/terms`, `/privacy`, `/accessibility`. |

The rows add to 192 (Learn is 52 URLs: 41 guides, 10 hubs, the index).

Checked on the build, all passing:
- Redirected URLs in the sitemap: 0. Noindex URLs: 0. Query-string variants: 0. Duplicate URLs: 0.
- Sitemap URLs without a built page: 0. Built pages not in the sitemap: `/cart`, `/checkout`, `/track`, `/search` (all noindex), `/404`, `/spa`.
- Canonical equals the page's own URL on all 192. Duplicate titles: 0. Duplicate descriptions: 0. Missing descriptions: 0.
- Internal links: `check:links` finds 0 broken links and 0 indexable orphans. The hub and the home page already link all 7 city pages.

## What was changed

1. Sitemap lastmod. The working checkout was a shallow clone, so four dates had been kept from an older committed file. Re-computed from full history: four URLs moved to their real change date. After the city-page edit below, the 7 city URLs carry 2026-10-04, the date their source changed in git. No date is invented; if a build container is shallow, the existing script keeps the committed date.
2. Every city page now lists every other city page under "More mobile service cities" (before: 2 to 4 hand-picked "nearby" cities). No distance is implied for the new list.
3. Tamarac and Weston meta descriptions: "the Extreme Tires van" became "the van from our Sunrise shop" (the wording Sunrise already uses).

## Tried and reverted

I added FAQPage JSON-LD to 19 pages that show a visible FAQ (install, shipping, financing, six tool pages, seven state pages). `npm run check:schema` rejects it by design ("FAQ rich results are retired, do not add more"; allowed only where FAQPage already was). I removed the change rather than touch the check.

## Recommended, not changed

- Noindex `/compare` (empty comparison tool, about 1.6k characters) and `/reviews` (no reviews of its own, about 2.3k). Low risk either way; Justin to decide.
- Leave the 7 city pages indexable. The critic's "thin and templated" read for Tamarac, Weston, Coral Springs and Davie is about the research gaps (no neighbourhoods or roads yet), not about size: each is 6k+ characters with its own ZIPs, FAQ and local notes. The fix is the facts below, not noindex.
- 18 titles are 66 to 69 characters with the "| TireDrop" suffix (about 60 shows in results) and about 50 descriptions run 166 to 243 characters (tires and wheels 166 to 192, plus /locations 243, /tire-size 228, /mobile-service 220). Google truncates and may rewrite them; it does not penalise. Content titles come from the Markdown and already warn in the build.
- Wave 2 city pages only after wave 1 shows as indexed.
- Search Console: re-submit the sitemap after the merge and request indexing for the 7 city pages and the 7 state pages.
- `/learn/<hub>` pages and `/services/*` are the shortest indexable pages. Leave them unless Search Console reports "Crawled, currently not indexed" for them.

## Questions for Justin

1. Does the van carry TireDrop or Extreme Tires branding? That decides whether on-page city copy ("a technician from the Extreme Tires shop in Sunrise") should change.
2. Noindex `/compare` and `/reviews`, or keep both indexable?
3. The unverified city facts still open (checklist #D8): Tamarac ZIPs, roads and neighbourhoods; Coral Springs, Davie and Weston roads; Coral Springs and Weston neighbourhoods; Plantation 33388. They are what would lift the thinner city pages.
4. The Google Business Profile link and map pin (checklist #A9), so the shop's LocalBusiness node can carry `geo` and a Maps profile.
5. Which source produced "about 300 URLs"? The live sitemap is 192.
