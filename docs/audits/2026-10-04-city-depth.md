# City depth, van naming and noindex, 2026-10-04

Branch `seo/city-depth`, by Rank (technical SEO, team TireDrop). Built on `origin/main` bf46441 after a 1,000-commit fetch (not shallow), so sitemap `lastmod` comes from real git history; the only sitemap change is the removal of two URLs, no date moved.

## What changed

1. `/compare` and `/reviews` are `noindex, follow` and out of `public/sitemap.xml` (192 URLs to 190).
2. Four city pages (Tamarac, Weston, Coral Springs, Davie) gained "Roads and areas around {city}", "What to know before we come", filled road and neighbourhood chips, and extra FAQ items. ZIP lists are untouched.
3. The Tamarac, Weston, Sunrise and Davie meta descriptions say "Extreme Tires van" (Broward is inside the tri-county rule).

## Noindex mechanism used

The repo already had one: `NOINDEX_ROUTES` in `src/components/ui/index.jsx` (the `Seo` head emits `<meta name="robots" content="noindex, follow">`, and the prerender writes that head into `dist/`), paired with `EXCLUDE` in `scripts/generate-seo-files.mjs` (the sitemap list, which `prerender.mjs` and `prerender-check.mjs` also read). I added the two routes to both lists; no new mechanism. No check had to change: none listed the two pages as sitemap pages, and `check:prerender` hydrates the `EXCLUDE` routes automatically. Links to both pages still work (nav, footer, `/sitemap`, compare tray).

## Van naming (Justin, 2026-10-04): Extreme Tires van in Broward, Miami-Dade and Palm Beach only

Changed: the four meta descriptions above (`src/data/cityPages.js`). Plantation, Coral Springs and Fort Lauderdale descriptions say only "the van" and were left.

Checked, nothing else to change (no van brand named outside the tri-county):
- `src/data/cityPages.js` (all 7 cities), `src/pages/services/MobileCityPage.jsx` (not-found panel says "Extreme Tires vans cover" the cities: tri-county), `MobileServicePage.jsx`, `ZipCheck.jsx`, `ServiceAreaCounties.jsx`.
- `src/data/statePages.js` and `StateShippingPage.jsx`: "our mobile van" / "our van" with no brand; the Florida intro names Extreme Tires as the shop's business, not a van, and scopes the van to the three counties. The "I'm in Orlando. Can your van come to me?" answer says no.
- `NationwideShippingPage.jsx`, `LocalDeliveryPage.jsx`, `InstallPage.jsx`: "mobile van" unbranded, scoped to the three counties.
- Truck map and local delivery: `src/components/delivery/deliveryTrucks.js` (truck symbol has no text; legend says "Delivery truck"; counter says "Simulated deliveries"), `src/lib/deliverySim.js`, `src/data/localDelivery.js`, `scripts/local-delivery-check.mjs`: no brand.
- `src/content/blog` and `src/content/learn`: every "Extreme Tires van/vans" is tied to South Florida or Miami-Dade, Broward and Palm Beach in the same sentence or paragraph. Authors lines ("TireDrop Team, Extreme Tires, Sunrise FL") are not van copy.
- `src/data/business.js`, `src/lib/sitePages.js`, `index.html`, `public/*`, `api/`, `scripts/`, `vercel.json`: no van naming outside the tri-county.
- Docs (`docs/business`, `docs/prompts`, `docs/content`, `docs/integrations`, `docs/audits`): Extreme Tires appears as the shop and parent business; no delivery van or truck is branded. `docs/archive` skipped (retired).

Left as is, for Justin: Tamarac's on-page intro still says "a technician from the Extreme Tires shop in Sunrise" (Broward, so allowed). It is the only city intro that names Extreme Tires.

## Facts used, one line per added sentence

Wikipedia pages are commercial-adjacent sources for Tamarac (the City of Tamarac site was unreadable); the Tamarac copy is deliberately modest.

### Tamarac
- Commercial Blvd (SR 870) has junctions with the Turnpike and US 441/SR 7 in Tamarac; meets University Dr (SR 817) at the Sunrise-Tamarac line: https://en.wikipedia.org/wiki/Commercial_Boulevard
- SR 7 is a major boundary reference with development on both sides; named sections Tamarac Lakes Sections One and Two, Tamarac Lakes North and South, Mainlands of Tamarac Lakes; The Woodlands: https://en.wikipedia.org/wiki/Tamarac,_Florida
- Many communities are 55+ condo or single-family communities: https://www.55places.com/florida/city/tamarac
- Condo and 55+ communities have their own access and parking rules; confirm with the association: general advice, labelled as such on the page.
- "A cross street or a landmark on one of those roads helps when you book": our own booking advice, no outside fact.
- FAQ "55+ community": the 55places line above, plus the repo's ZIP rule (`serviceArea.js`).

### Weston
- Principal local roads, I-75 (east edge; north edge as Alligator Alley), US 27, SR 84, Griffin Rd (SR 818), I-595's western end at the Weston-Sunrise-Davie tripoint, two development districts, Country Isles, Windmill Ranch, Emerald Estates, Everglades on the western edge: https://en.wikipedia.org/wiki/Weston,_Florida
- Stormwater: interconnected lakes and canals, more than 2,000 catch basins, 5 pump stations, 2,214 acres of lake and canal, "unobstructed water flow in storms is essential to prevent flooding": https://www.westonfl.org/government/public-works-and-utilities/flood-and-stormwater-information/stormwater-management-system
- Water on the road can cover debris; bulge cannot be repaired, nail in the tread area sometimes can: repo copy (Fort Lauderdale page, NHTSA/USTMA repair notes), reworded.
- Controlled-access communities commonly use a manned gate, a transponder or both: general advice, labelled "not a TireDrop promise".
- "Does it matter which part of Weston": the Wikipedia districts and neighbourhoods plus the repo ZIP rule.

### Coral Springs
- Neighbours (Parkland N, Coconut Creek E, Margate and North Lauderdale SE, Tamarac S, Everglades W); Sample Rd and University Dr redevelopment hub: https://en.wikipedia.org/wiki/Coral_Springs,_Florida
- Sawgrass Expressway (SR 869) on the north and west edges; exits 8 Atlantic Blvd, 11 Sample Rd, 14 Coral Ridge Dr, 15 University Dr (Parkland/Coral Springs line): https://www.aaroads.com/guides/fl-869-north
- "Frequent flooding during strong rain" as a current challenge; most canals not city-managed: https://coralsprings.gov/Government/Departments/Public-Works/Stormwater-Master-Plan
- Commerce Park: 442 acres off the Sawgrass Expressway, with employers: https://www.coralsprings.gov/Business/Economic-Development-Office/Commerce-Park
- Property management and service vehicles at workplaces: general advice, plus the page's existing office FAQ.

### Davie
- Thirteen roads named in the Local Roads Master Plan (Griffin, Nova, Hiatus, Flamingo, University, Nob Hill, Orange, Pine Island, Davie Rd, Stirling, Weston Rd, Sheridan St, Oakes Rd); Equestrian Trails layer: https://www.davie-fl.gov/DocumentCenter/View/6148/Local-Roads-Master-Plan-Figures
- Griffin Rd (SR 818) runs through Davie, crosses University Dr (SR 817), Turnpike interchange, Davie/Cooper City border: https://wikipedia.com/wiki/SR_818_(FL)
- Equestrian character, horseback riding common; Nova Southeastern University: https://en.wikipedia.org/wiki/Nova_Southeastern_University
- Flamingo Gardens, Tree Tops Park, Long Key Natural Area, South Florida Education Center area: https://ediblesouthflorida.ediblecommunities.com/things-do/howdy-davie
- Rural or gravel driveways, gate codes, campus or workplace lots: general advice, labelled as such.

## Left out on purpose

- Tamarac: anything on flooding, canals or rainfall; University Dr, Pine Island Rd or Sawgrass "running through" Tamarac; which named communities are gated (realtor sources only). Turnpike not listed as a Tamarac "main road" (the source gives a junction, not a road through the city).
- Weston: the parking-code summary (third-party, unverified); named gated communities; "36 miles of pipe" (true per the city, but `cityPages.test.mjs` bans mile figures in city copy, so left out rather than loosen the test).
- Coral Springs: gated communities; Turnpike, Wiles Rd, Wyndham Lakes, The Isles (unverified); the Commerce Park employer names (the fact sheet allows them, but naming them risks implying they are customers).
- Davie: I-595, I-75, SR 84 touching Davie; Rolling Hills, Orange Blossom; flooding, truck traffic, lot sizes, gated communities; the "150 miles" equestrian figure; campus acreage and founding years.
- No drive times, distances, hours, prices, availability or coverage beyond the repo's ZIP rule.

## Tests and checks touched

`src/data/cityPages.test.mjs`: FAQ ceiling 5 to 7 (two pages now have 7), word ceiling 1,200 to 1,500 (the ceiling stays as an anti-padding limit), `pageText` and the heading list now include the two new template sections so the overlap measure still reads what the page renders. The 60% unique-text floor is unchanged and every city still meets it (lowest: Fort Lauderdale 60.7%).

Words per page (the test's measure): Tamarac 1,002 to 1,341; Weston 905 to 1,366; Coral Springs 981 to 1,419; Davie 984 to 1,342.

JSON-LD: no new node. The pages already emitted FAQPage from `city.faq`, so the extra visible FAQ items appear in that existing node; `check:schema` passes.

## Questions that still need Justin

1. Tamarac's intro says "a technician from the Extreme Tires shop in Sunrise" while the other cities say "our Sunrise shop". Keep, or make them match?
2. Plantation, Coral Springs and Fort Lauderdale descriptions say only "the van". Name the Extreme Tires van there too?
3. Tamarac still has no ZIP list (the City of Tamarac site was unreadable). Open on the checklist (#D8), as is Plantation 33388.
4. After merge: re-submit the sitemap and request indexing for the four deepened city pages. Search Console will drop `/compare` and `/reviews` over the next crawls.
