# Local city and neighborhood page plan, 2026-10-05

Branch `preview/wave1-local-plan`, by Atlas (research). Closes the data half of competitor gap 8 (local search depth). **Plan and data only: no pages are built and nothing outside `docs/` changed.** The machine-readable twin is [local-pages-plan.json](local-pages-plan.json), written for the next Forge task to import (`pages` is the top 25; `candidates` is every ranked area).

## The short version

- TireDrop has **7 city pages** (all Broward). This plan ranks **60 more areas** in Miami-Dade, Broward and Palm Beach and picks the **top 25** to build next.
- Of the top 25, **19 are READY** for a v1 build and **6 are NEEDS-FACT** (a named gap to close first, listed per page).
- Every population is **SNIPPET-ONLY**: the Census Bureau, Broward and Palm Beach county and state data-center pages were all blocked by the network proxy, so none could be read as a page. Where snippets disagreed the row says so and the confidence is LOW.
- **No distances or drive times are published here.** None could be sourced. Ranking uses a rough proximity ring (analyst estimate, LOW confidence) that must never appear on a page.
- No search-volume data was reachable, so "search relevance" is approximated by 2020 population only.
- Everything here is inside the three counties. Areas outside them are listed once, in the last section, as never-build.

## 1. What the site already treats as covered

From `src/data/serviceArea.js`: a mobile order is covered when the 5-digit ZIP starts 330, 331, 332, 333 or 334 and is not in `EXCLUDED_ZIPS`. The rule is ZIP-based; city names are for copy only.

`EXCLUDED_ZIPS` (the only 5-digit ZIPs inside those prefixes that are not covered):

| Group | ZIPs |
|---|---|
| Florida Keys (Monroe County): Key Largo, Islamorada, Marathon, Key West | 33001, 33036, 33037, 33040, 33041, 33042, 33043, 33045, 33050, 33051, 33052, 33070 |
| Clewiston (Hendry County) | 33440 |
| Hobe Sound and Jupiter Island (Martin County) | 33455, 33475 |
| Moore Haven (Glades County) | 33471 |

33469 (Tequesta/Jupiter) and 33478 (Jupiter Farms) are deliberately left covered (mostly Palm Beach, a strip of Martin).

`SERVICE_AREA_EXAMPLES` already names these cities for copy: Miami, Miami Beach, Hialeah, Doral, Homestead; Fort Lauderdale, Sunrise, Plantation, Davie, Weston, Coral Springs, Tamarac, Lauderhill, Pembroke Pines, Miramar, Hollywood, Pompano Beach; Boca Raton, Delray Beach, Boynton Beach, West Palm Beach, Jupiter. Only the 7 below have pages.

| Existing page | County | 2020 pop. (site) | ZIPs on the page |
|---|---|---|---|
| [/mobile-service/sunrise-fl](/mobile-service/sunrise-fl) | Broward | 97,335 | 33313, 33319, 33322, 33323, 33325, 33326, 33351 |
| [/mobile-service/plantation-fl](/mobile-service/plantation-fl) | Broward | 91,750 | 33313, 33317, 33322, 33324, 33325 |
| [/mobile-service/tamarac-fl](/mobile-service/tamarac-fl) | Broward | 71,897 | none yet (Tamarac: ZIP checker only) |
| [/mobile-service/coral-springs-fl](/mobile-service/coral-springs-fl) | Broward | 134,394 | 33065, 33067, 33071, 33076 |
| [/mobile-service/davie-fl](/mobile-service/davie-fl) | Broward | 105,691 | 33314, 33317, 33324, 33325, 33328, 33330, 33331 |
| [/mobile-service/fort-lauderdale-fl](/mobile-service/fort-lauderdale-fl) | Broward | 182,760 | 33301, 33304, 33305, 33306, 33308, 33309, 33311, 33312, 33315, 33316 |
| [/mobile-service/weston-fl](/mobile-service/weston-fl) | Broward | 68,107 | 33326, 33327, 33331, 33332 |

All ZIPs on those pages pass `isInServiceArea()` (checked by running the real function). Open items already on the checklist: Tamarac ZIPs and Plantation 33388.

## 2. Method, sources and how far to trust them

| Source | What it gave | Status |
|---|---|---|
| `src/data/serviceArea.js`, `cityPages.js`, `business.js` | coverage rule, existing pages, shop address, phone, hours | **READ** (repo files) |
| census.gov QuickFacts pages (via search restricted to census.gov) | 2020 populations for most cities and CDPs | **SNIPPET-ONLY**: fetch blocked, the result text came from the official domain |
| broward.org 2020 city counts PDF, pbcgov.org municipal PDF, edr.state.fl.us 2020 profile | would be the best county-level sources | **BLOCKED**, not read |
| Wikipedia, citypopulation, USPS ZIP lookup | not reachable | **BLOCKED** |
| Earlier local-SEO research (scratch notes, 2026-10-01) | second opinion on populations; source of the ring estimates | **Prior snippet-only notes**, used only to cross-check |

**Population confidence.** MED = at least two separate searches agree and one was a census.gov result. LOW = one snippet, or snippets disagree. Where a number conflicted, the census.gov-domain result is shown and the conflict is written in the notes.

**Ranking.** `score = population points x proximity points`.

| Population (2020) | Points | | Proximity ring | Points |
|---|---|---|---|---|
| 150,000 or more | 5 | | 1 (central Broward, closest) | 5 |
| 100,000 to 149,999 | 4 | | 2 (rest of Broward's mid band) | 4 |
| 70,000 to 99,999 | 3 | | 3 (Broward edges, north Miami-Dade, Boca Raton) | 3 |
| 40,000 to 69,999 | 2 | | 4 (central Miami-Dade, south Palm Beach) | 2 |
| under 40,000 | 1 | | 5 (far south Miami-Dade, mid and north Palm Beach) | 1 |

Rings are an **analyst judgement, LOW confidence, not a sourced distance**. They exist only to order the list. Use the Google Maps check in section 6 before any drive-time wording is written. "Not already covered" is satisfied by construction: the 7 existing cities are excluded.

## 3. Top 25 to build next

Slug follows `cityPath`: `/mobile-service/{city}-fl`. Pop. = 2020 Census (snippet). Ring = proximity ring (LOW). Status is explained in section 5.

| # | Page | County | Pop. 2020 | Pop. conf. | Ring | Score | Status |
|---|---|---|---|---|---|---|---|
| 1 | `/mobile-service/pembroke-pines-fl` | Broward | 171,178 | MED | 2 | 20 | **READY** |
| 2 | `/mobile-service/hollywood-fl` | Broward | 153,067 | MED | 2 | 20 | **READY** |
| 3 | `/mobile-service/miramar-fl` | Broward | 134,721 | MED | 2 | 16 | **READY** |
| 4 | `/mobile-service/pompano-beach-fl` | Broward | 112,046 | MED | 2 | 16 | **READY** |
| 5 | `/mobile-service/hialeah-fl` | Miami-Dade | 223,109 | MED | 3 | 15 | **READY** |
| 6 | `/mobile-service/lauderhill-fl` | Broward | 74,482 | MED | 1 | 15 | **READY** |
| 7 | `/mobile-service/miami-gardens-fl` | Miami-Dade | 111,640 | MED | 3 | 12 | **READY** |
| 8 | `/mobile-service/deerfield-beach-fl` | Broward | 86,859 | MED | 2 | 12 | **READY** |
| 9 | `/mobile-service/margate-fl` | Broward | 58,712 | MED | 1 | 10 | **READY** |
| 10 | `/mobile-service/north-lauderdale-fl` | Broward | 44,794 | MED | 1 | 10 | **READY** |
| 11 | `/mobile-service/oakland-park-fl` | Broward | 44,229 | MED | 1 | 10 | **READY** |
| 12 | `/mobile-service/boca-raton-fl` | Palm Beach | 97,422 | MED | 3 | 9 | **READY** |
| 13 | `/mobile-service/doral-fl` | Miami-Dade | 75,874 | MED | 3 | 9 | **READY** |
| 14 | `/mobile-service/coconut-creek-fl` | Broward | 57,833 | MED | 2 | 8 | **READY** |
| 15 | `/mobile-service/miami-beach-fl` | Miami-Dade | 82,890 | MED | 4 | 6 | **NEEDS-FACT** |
| 16 | `/mobile-service/boynton-beach-fl` | Palm Beach | 80,380 | MED | 4 | 6 | **NEEDS-FACT** |
| 17 | `/mobile-service/kendall-fl` | Miami-Dade | 80,241 | MED | 4 | 6 | **NEEDS-FACT** |
| 18 | `/mobile-service/north-miami-fl` | Miami-Dade | 60,191 | MED | 3 | 6 | **READY** |
| 19 | `/mobile-service/country-club-fl` | Miami-Dade | 49,967 | LOW | 3 | 6 | **NEEDS-FACT** |
| 20 | `/mobile-service/north-miami-beach-fl` | Miami-Dade | 43,676 | MED | 3 | 6 | **READY** |
| 21 | `/mobile-service/hallandale-beach-fl` | Broward | 41,217 | MED | 3 | 6 | **READY** |
| 22 | `/mobile-service/aventura-fl` | Miami-Dade | 40,242 | MED | 3 | 6 | **READY** |
| 23 | `/mobile-service/lauderdale-lakes-fl` | Broward | 35,954 | MED | 1 | 5 | **READY** |
| 24 | `/mobile-service/west-palm-beach-fl` | Palm Beach | 117,415 | MED | 5 | 4 | **NEEDS-FACT** |
| 25 | `/mobile-service/delray-beach-fl` | Palm Beach | 66,846 | MED | 4 | 4 | **NEEDS-FACT** |

## 4. Title, H1, meta description and facts, page by page

H1 is always `Mobile Tire Installation in {City}, FL` (the existing template builds it). Title length includes the ` | TireDrop` suffix and is at most 60. Meta descriptions are at most 155. Descriptions are deliberately plain: Forge adds one sourced local fact per page before publishing so no two read alike.

| # | H1 | Title (length) | Meta description (length) |
|---|---|---|---|
| 1 | Mobile Tire Installation in Pembroke Pines, FL | Mobile Tire Installation in Pembroke Pines, FL \| TireDrop (57) | Tires from TireDrop fitted at your Pembroke Pines, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (146) |
| 2 | Mobile Tire Installation in Hollywood, FL | Mobile Tire Installation in Hollywood, FL \| TireDrop (52) | Tires from TireDrop fitted at your Hollywood, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (141) |
| 3 | Mobile Tire Installation in Miramar, FL | Mobile Tire Installation in Miramar, FL \| TireDrop (50) | Tires from TireDrop fitted at your Miramar, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (139) |
| 4 | Mobile Tire Installation in Pompano Beach, FL | Mobile Tire Installation in Pompano Beach, FL \| TireDrop (56) | Tires from TireDrop fitted at your Pompano Beach, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (145) |
| 5 | Mobile Tire Installation in Hialeah, FL | Mobile Tire Installation in Hialeah, FL \| TireDrop (50) | Tires from TireDrop fitted at your Hialeah, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (139) |
| 6 | Mobile Tire Installation in Lauderhill, FL | Mobile Tire Installation in Lauderhill, FL \| TireDrop (53) | Tires from TireDrop fitted at your Lauderhill, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (142) |
| 7 | Mobile Tire Installation in Miami Gardens, FL | Mobile Tire Installation in Miami Gardens, FL \| TireDrop (56) | Tires from TireDrop fitted at your Miami Gardens, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (145) |
| 8 | Mobile Tire Installation in Deerfield Beach, FL | Mobile Tire Installation in Deerfield Beach, FL \| TireDrop (58) | Tires from TireDrop fitted at your Deerfield Beach, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (147) |
| 9 | Mobile Tire Installation in Margate, FL | Mobile Tire Installation in Margate, FL \| TireDrop (50) | Tires from TireDrop fitted at your Margate, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (139) |
| 10 | Mobile Tire Installation in North Lauderdale, FL | Mobile Tire Installation in North Lauderdale, FL \| TireDrop (59) | Tires from TireDrop fitted at your North Lauderdale, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (148) |
| 11 | Mobile Tire Installation in Oakland Park, FL | Mobile Tire Installation in Oakland Park, FL \| TireDrop (55) | Tires from TireDrop fitted at your Oakland Park, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (144) |
| 12 | Mobile Tire Installation in Boca Raton, FL | Mobile Tire Installation in Boca Raton, FL \| TireDrop (53) | Tires from TireDrop fitted at your Boca Raton, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (142) |
| 13 | Mobile Tire Installation in Doral, FL | Mobile Tire Installation in Doral, FL \| TireDrop (48) | Tires from TireDrop fitted at your Doral, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (137) |
| 14 | Mobile Tire Installation in Coconut Creek, FL | Mobile Tire Installation in Coconut Creek, FL \| TireDrop (56) | Tires from TireDrop fitted at your Coconut Creek, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (145) |
| 15 | Mobile Tire Installation in Miami Beach, FL | Mobile Tire Installation in Miami Beach, FL \| TireDrop (54) | Tires from TireDrop fitted at your Miami Beach, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (143) |
| 16 | Mobile Tire Installation in Boynton Beach, FL | Mobile Tire Installation in Boynton Beach, FL \| TireDrop (56) | Tires from TireDrop fitted at your Boynton Beach, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (145) |
| 17 | Mobile Tire Installation in Kendall, FL | Mobile Tire Installation in Kendall, FL \| TireDrop (50) | Tires from TireDrop fitted at your home or work in the Kendall area by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (147) |
| 18 | Mobile Tire Installation in North Miami, FL | Mobile Tire Installation in North Miami, FL \| TireDrop (54) | Tires from TireDrop fitted at your North Miami, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (143) |
| 19 | Mobile Tire Installation in Country Club, FL | Mobile Tire Installation in Country Club, FL \| TireDrop (55) | Tires from TireDrop fitted at your home or work in the Country Club area by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (152) |
| 20 | Mobile Tire Installation in North Miami Beach, FL | Mobile Tire Installation in North Miami Beach, FL \| TireDrop (60) | Tires from TireDrop fitted at your North Miami Beach, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (149) |
| 21 | Mobile Tire Installation in Hallandale Beach, FL | Mobile Tire Installation in Hallandale Beach, FL \| TireDrop (59) | Tires from TireDrop fitted at your Hallandale Beach, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (148) |
| 22 | Mobile Tire Installation in Aventura, FL | Mobile Tire Installation in Aventura, FL \| TireDrop (51) | Tires from TireDrop fitted at your Aventura, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (140) |
| 23 | Mobile Tire Installation in Lauderdale Lakes, FL | Mobile Tire Installation in Lauderdale Lakes, FL \| TireDrop (59) | Tires from TireDrop fitted at your Lauderdale Lakes, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (148) |
| 24 | Mobile Tire Installation in West Palm Beach, FL | Mobile Tire Installation in West Palm Beach, FL \| TireDrop (58) | Tires from TireDrop fitted at your West Palm Beach, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (147) |
| 25 | Mobile Tire Installation in Delray Beach, FL | Mobile Tire Installation in Delray Beach, FL \| TireDrop (55) | Tires from TireDrop fitted at your Delray Beach, FL home or work by the Extreme Tires van. ZIP check, what the van does, and free ship-to-store. (144) |

**Safe facts, the same for every page** (each is already published on the site or comes from the repo): the county is one of the three served; coverage is decided by the five-digit ZIP; the Sunrise shop is at 7712 West Oakland Park Blvd, Sunrise, FL 33351, (954) 773-1896, open Monday to Friday 8:00 AM to 6:30 PM and Saturday 8:00 AM to 4:00 PM; tires ship free to the shop; highway shoulders are not worked (call 911 or *347 first). Plus the city's 2020 Census population where confidence is MED. **No claims about traffic, roads, weather or landmarks are made for any city.**

Per-page detail (candidate ZIPs, FAQ seeds, gaps) is in the JSON. Candidate ZIPs and the one-line flag for each page:

| # | Page | Candidate ZIPs (UNVERIFIED) | Not covered by the site | Flag |
|---|---|---|---|---|
| 1 | Pembroke Pines | 33023, 33024, 33025, 33026, 33027, 33028, 33029, 33082, 33084 | none | ZIPs shared with Hollywood and Miramar |
| 2 | Hollywood | 33019, 33020, 33021, 33023, 33024 | none | Mailing address 'Hollywood' also appears on Pembroke Pines and Miramar streets |
| 3 | Miramar | 33023, 33025, 33027, 33029 | none | Some ZIPs mail as Hollywood |
| 4 | Pompano Beach | 33060, 33062, 33064, 33066, 33069 | none | - |
| 5 | Hialeah | 33010, 33012, 33013, 33014, 33015, 33016, 33018 | none | - |
| 6 | Lauderhill | 33311, 33313, 33319, 33351 | none | ZIPs shared with Sunrise and Lauderdale Lakes |
| 7 | Miami Gardens | 33054, 33055, 33056, 33169 | none | One unrestricted snippet said 128,076; the census.gov QuickFacts snippet and the earlier research say 111,640 |
| 8 | Deerfield Beach | 33441, 33442, 33443 | none | - |
| 9 | Margate | 33063, 33068, 33073 | none | - |
| 10 | North Lauderdale | 33068 | none | - |
| 11 | Oakland Park | 33306, 33309, 33334 | none | - |
| 12 | Boca Raton | 33428, 33431, 33432, 33433, 33434, 33486, 33487, 33496, 33498 | none | Another snippet said 99,893; census.gov QuickFacts snippet (twice) says 97,422. West Boca addresses are partly unincorporated |
| 13 | Doral | 33122, 33166, 33172, 33178 | none | Earlier research said 76,193; three newer snippets say 75,874 |
| 14 | Coconut Creek | 33063, 33066, 33073 | none | - |
| 15 | Miami Beach | 33139, 33140, 33141 | none | One unrestricted snippet said 94,071; the census.gov QuickFacts snippet says 82,890 |
| 16 | Boynton Beach | 33426, 33435, 33436, 33437 | none | - |
| 17 | Kendall | 33156, 33173, 33176, 33183, 33186 | none | Unincorporated; mail often reads 'Miami'; neighborhood-level page |
| 18 | North Miami | 33161, 33168, 33181 | none | Another snippet said 73,662; the census.gov QuickFacts snippet says 60,191 |
| 19 | Country Club | 33015, 33179 | none | Single snippet; unincorporated; neighborhood-level page |
| 20 | North Miami Beach | 33160, 33162, 33179 | none | - |
| 21 | Hallandale Beach | 33009 | none | - |
| 22 | Aventura | 33160, 33180 | none | - |
| 23 | Lauderdale Lakes | 33309, 33311, 33313, 33319 | none | - |
| 24 | West Palm Beach | 33401, 33405, 33407, 33409, 33411, 33417 | none | Another snippet said 112,782 |
| 25 | Delray Beach | 33444, 33445, 33446, 33483, 33484 | none | - |

Every candidate ZIP was run through `isInServiceArea()` and all are covered. No ZIP in these cities falls in `EXCLUDED_ZIPS`. The one watch item is Jupiter (33469, 33478), where the site's own comment says a strip is in Martin County.

## 5. READY or NEEDS-FACT

- **READY** means a v1 can ship on facts that are in the repo or agreed by two snippets: county, ZIP rule, shop details, population. The page carries no ZIP chips and no road list (as Tamarac did) until those are sourced.
- **NEEDS-FACT** means one of: the population is a single or conflicting snippet (use no number until checked), the area is unincorporated (name and ZIPs need a Census check), or the area is far enough out that Justin should confirm the van will run there.
- **Every page, READY or not,** still needs government-sourced roads and areas for depth, and a USPS-checked ZIP list. Neither could be read in this research.

| # | Page | Status | What is missing |
|---|---|---|---|
| 1 | Pembroke Pines | **READY** | Only the two all-page items (roads and areas, ZIP list) |
| 2 | Hollywood | **READY** | Only the two all-page items (roads and areas, ZIP list) |
| 3 | Miramar | **READY** | Only the two all-page items (roads and areas, ZIP list) |
| 4 | Pompano Beach | **READY** | Only the two all-page items (roads and areas, ZIP list) |
| 5 | Hialeah | **READY** | Only the two all-page items (roads and areas, ZIP list) |
| 6 | Lauderhill | **READY** | Only the two all-page items (roads and areas, ZIP list) |
| 7 | Miami Gardens | **READY** | Only the two all-page items (roads and areas, ZIP list) |
| 8 | Deerfield Beach | **READY** | Only the two all-page items (roads and areas, ZIP list) |
| 9 | Margate | **READY** | Only the two all-page items (roads and areas, ZIP list) |
| 10 | North Lauderdale | **READY** | Only the two all-page items (roads and areas, ZIP list) |
| 11 | Oakland Park | **READY** | Only the two all-page items (roads and areas, ZIP list) |
| 12 | Boca Raton | **READY** | Only the two all-page items (roads and areas, ZIP list) |
| 13 | Doral | **READY** | Only the two all-page items (roads and areas, ZIP list) |
| 14 | Coconut Creek | **READY** | Only the two all-page items (roads and areas, ZIP list) |
| 15 | Miami Beach | **NEEDS-FACT** | Justin's call |
| 16 | Boynton Beach | **NEEDS-FACT** | Justin's call |
| 17 | Kendall | **NEEDS-FACT** | Unincorporated area; Justin's call |
| 18 | North Miami | **READY** | Only the two all-page items (roads and areas, ZIP list) |
| 19 | Country Club | **NEEDS-FACT** | Population; Unincorporated area |
| 20 | North Miami Beach | **READY** | Only the two all-page items (roads and areas, ZIP list) |
| 21 | Hallandale Beach | **READY** | Only the two all-page items (roads and areas, ZIP list) |
| 22 | Aventura | **READY** | Only the two all-page items (roads and areas, ZIP list) |
| 23 | Lauderdale Lakes | **READY** | Only the two all-page items (roads and areas, ZIP list) |
| 24 | West Palm Beach | **NEEDS-FACT** | Justin's call |
| 25 | Delray Beach | **NEEDS-FACT** | Justin's call |

## 6. Ranked beyond the top 25

Same scoring. These are inside the service area and can be named in the hub's "areas we serve" list and Google Business Profile service areas without a page.

| # | Area | County | Pop. 2020 | Conf. | Ring | Score |
|---|---|---|---|---|---|---|
| 26 | Fountainebleau (neighborhood) | Miami-Dade | 59,870 | LOW | 4 | 4 |
| 27 | The Hammocks (neighborhood) | Miami-Dade | 59,480 | MED | 4 | 4 |
| 28 | Westchester (neighborhood) | Miami-Dade | 56,384 | MED | 4 | 4 |
| 29 | Kendale Lakes (neighborhood) | Miami-Dade | 55,646 | MED | 4 | 4 |
| 30 | Tamiami (neighborhood) | Miami-Dade | 54,212 | LOW | 4 | 4 |
| 31 | Coral Gables | Miami-Dade | 49,248 | LOW | 4 | 4 |
| 32 | Greenacres | Palm Beach | 43,990 | LOW | 4 | 4 |
| 33 | Lake Worth Beach | Palm Beach | 42,219 | MED | 4 | 4 |
| 34 | Cooper City | Broward | 34,401 | MED | 2 | 4 |
| 35 | Wilton Manors | Broward | 11,426 | MED | 2 | 4 |
| 36 | Southwest Ranches | Broward | 7,607 | LOW | 2 | 4 |
| 37 | Homestead | Miami-Dade | 80,737 | LOW | 5 | 3 |
| 38 | Parkland | Broward | 34,670 | MED | 3 | 3 |
| 39 | Dania Beach | Broward | 31,723 | MED | 3 | 3 |
| 40 | Miami Lakes | Miami-Dade | 30,467 | MED | 3 | 3 |
| 41 | Opa-locka | Miami-Dade | 16,463 | LOW | 3 | 3 |
| 42 | West Park | Broward | 15,130 | LOW | 3 | 3 |
| 43 | Lighthouse Point | Broward | 10,486 | LOW | 3 | 3 |
| 44 | Pembroke Park | Broward | 6,260 | MED | 3 | 3 |
| 45 | Lauderdale-by-the-Sea | Broward | 6,198 | MED | 3 | 3 |
| 46 | Wellington | Palm Beach | 61,051 | LOW | 5 | 2 |
| 47 | Jupiter | Palm Beach | 61,047 | MED | 5 | 2 |
| 48 | Palm Beach Gardens | Palm Beach | 59,182 | MED | 5 | 2 |
| 49 | Cutler Bay | Miami-Dade | 45,425 | LOW | 5 | 2 |
| 50 | Sweetwater | Miami-Dade | 19,363 | LOW | 4 | 2 |
| 51 | Key Biscayne | Miami-Dade | 14,809 | LOW | 4 | 2 |
| 52 | Miami Springs | Miami-Dade | 13,859 | LOW | 4 | 2 |
| 53 | Palm Springs | Palm Beach | 13,562 | LOW | 4 | 2 |
| 54 | Royal Palm Beach | Palm Beach | 38,932 | MED | 5 | 1 |
| 55 | Riviera Beach | Palm Beach | 37,604 | LOW | 5 | 1 |
| 56 | Palmetto Bay | Miami-Dade | 24,439 | LOW | 5 | 1 |
| 57 | Pinecrest | Miami-Dade | 18,388 | MED | 5 | 1 |
| 58 | North Palm Beach | Palm Beach | 13,162 | LOW | 5 | 1 |
| 59 | Florida City | Miami-Dade | 13,085 | LOW | 5 | 1 |
| 60 | Lake Park | Palm Beach | 9,125 | LOW | 5 | 1 |

Not listed because they are not separate places for this purpose: the City of Miami (442,241 in one snippet, saturated and well beyond the other rings) and Medley (no QuickFacts figure found). Add them when Justin wants a Miami-Dade push.

## 7. How Forge builds these without thin content

Doorway-style city pages are the risk with a list this long. The build rules:

1. **One shared template.** Use `MobileCityPage.jsx` and the existing `CITY_PAGE_SHARED` strings. Do not copy the template per city; the page is data in `src/data/cityPages.js`.
2. **Unique local facts per page, from a source that was read.** Each page needs its own sourced roads, areas or municipal facts (the city's own site or another government source), cited in a facts doc like `docs/audits/2026-10-04-city-depth.md`. No fact, no page: a city stays on the list as NEEDS-FACT.
3. **Pass the existing overlap test.** `src/data/cityPages.test.mjs` requires every page to keep at least 60% unique text. Build in batches of 5 and run it each time; if a city cannot reach 60% with real facts, fold it into its bigger neighbor's page instead of publishing it thin.
4. **Visible FAQ, and only then FAQ schema.** 4 to 7 questions per page, written for the city (shared ZIPs, gate and HOA access, condo lots, shop alternative). The existing `faqSchema(city.faq, path)` emits JSON-LD only from the visible FAQ.
5. **Internal links both ways.** Each new page links to 2 to 4 `nearby` cities, the hub `/mobile-service`, `/install`, the ZIP checker and the shop page; the hub and nearby pages link back. The template already links every sibling.
6. **No doorway pages.** One page per real place, one search intent (mobile tire installation in that city), the same booking path, no pages for ZIPs alone and no pages for places outside the three counties. Neighborhood and CDP pages come last and only with sourced names.
7. **Canonical and sitemap come from the existing generator.** `scripts/generate-seo-files.mjs` and `src/lib/sitePages.js` read `CITY_PAGES`, so adding an entry gives the route, canonical, sitemap line and prerender. Do not hand-edit the sitemap.
8. **House rules.** No offers or deals, no invented reviews or years, no "safe" claims about tires, no arrival times, no distances or drive times, no competitor mentions, installation only in the three counties. The van brand ("Extreme Tires van") is used only inside them.
9. **Wave the launches.** Build 5 to 8 pages, wait for indexing and impressions in Search Console, then continue.

First wave suggestion (by rank): Pembroke Pines, Hollywood, Miramar, Pompano Beach, Hialeah, Lauderhill, Miami Gardens, Deerfield Beach.

## 8. What could not be verified, and a Chrome prompt for Justin

- Populations are snippet-only. Distances and drive times: not sourced, left blank.
- ZIP-to-city lists: not read from USPS. Search volume per city: no tool access.
- Which neighborhoods are well known: not published here, because no government source was readable.

Copy-paste prompt for Claude in Chrome (verifies the gaps from Justin's browser):

```
Open each page and copy the exact figures into a table. 1) census.gov/quickfacts: for each city in the attached
list, the "Population, Census, April 1, 2020" value. 2) Google Maps: the driving distance and time from
7712 West Oakland Park Blvd, Sunrise, FL 33351 to the city hall of each city, at 10 AM on a weekday. 3) USPS ZIP
Code Lookup (tools.usps.com/zip-code-lookup.htm, "Cities by ZIP" tab): the ZIPs whose preferred city is that city.
Return one row per city: name, 2020 population, miles, minutes, ZIP list. Do not guess; write NOT FOUND where a
page does not show a value.
```

## 9. Claims ledger

| Claim | Source | Status |
|---|---|---|
| Coverage is by 5-digit ZIP, prefixes 330 to 334, minus 16 listed ZIPs | `src/data/serviceArea.js` | VERIFIED (file read, function run) |
| 7 city pages exist, all Broward | `src/data/cityPages.js` | VERIFIED (file read) |
| Shop address, phone, hours | `src/data/business.js` | VERIFIED (file read) |
| 2020 populations in the tables | census.gov QuickFacts search results | SNIPPET-ONLY |
| Populations marked LOW | single or conflicting snippets | UNVERIFIED: do not print the number |
| Candidate ZIPs per city | general knowledge | UNVERIFIED (all pass `isInServiceArea`) |
| Proximity ring | analyst estimate | UNVERIFIED: ordering only, never publish |
| Drive times, distances | none found | NOT STATED |

## 10. Never build (outside the three counties)

Not page candidates, and never in a ZIP list or `areaServed`: Florida Keys (Monroe County): Key Largo, Islamorada, Marathon, Key West; Clewiston (Hendry County); Hobe Sound and Jupiter Island (Martin County); Moore Haven (Glades County). They are the ZIPs in `EXCLUDED_ZIPS` above.
