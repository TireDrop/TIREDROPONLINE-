# TireDrop /learn — Phase 1 Content Plan

Keyword research, hub structure, a 50-guide plan and a 14-demo component list for the LEARN hub on tiredroponline.com, the online store of Extreme Tires in Sunrise, FL.

Status: in production. 30 of the 50 planned guides are live or on preview, plus 5 off-plan Buying/Fitment guides and the 6-guide Tesla hub; see §3.0.
Prepared: 2026-09-29. Status updated: 2026-10-02.

---

## 0. Read this first

### 0.1 Research method and what was blocked

- **WebSearch worked.** Every finding below comes from WebSearch result pages: titles, URLs and the snippets returned for each query. About 45 queries were run.
- **WebFetch was blocked by the egress proxy on every domain I tried:**
  - nhtsa.gov
  - ustires.org
  - flhsmv.gov
  - flsenate.gov
  - flrules.org
  - ecfr.gov
  - tirerack.com
  - consumerreports.org
  - suggestqueries.google.com, which is Google's autocomplete endpoint
- **Google was also blocked.** The proxy status log shows `www.google.com:443` refused with a 403.
- **What this means for the data:**
  - None of the statistics below were read on the source page itself. Every number marked *verify* has to be checked against its source URL before a guide goes live.
  - No keyword tool or autocomplete feed was available. Search volume and difficulty are **qualitative estimates** (High / Med / Low). They are inferred from:
    - how many competitor and official pages rank for a question
    - how often the question appears in "People also ask"-style phrasings in result titles
    - who owns the results: brand, government, national retailer, or local shop and law firm
  - No numbers were invented.

### 0.2 Findings from the codebase that affect this plan

I checked `tiredrop/` in this repo.

1. **The tool routes differ from the brief.**
   - `src/App.jsx` routes the tools at `/tire-size`, `/tire-check` and `/find-my-tires`, not `/tools/*`.
   - This plan uses `/tools/tire-size` and `/tools/tire-check` as the brief does.
   - Before launch, either add `/tools/*` routes that redirect to the current ones, or change the links in this plan.
2. **The existing `/tire-care` page will compete with /learn.**
   - `src/pages/support/TireCarePage.jsx` already covers pressure, rotation, balancing, tread depth, alignment, TPMS and replacement.
   - It also has an "UPCOMING" list of 10 guides. All 10 are covered by this plan; some are merged into other guides, as noted below.
   - Recommendation: when /learn launches, 301-redirect `/tire-care` to `/learn`, or turn it into the /learn landing page. Otherwise it will compete with the Maintenance and Pressure guides.
3. **Reusable logic already exists.** Several demos can reuse it.
   - `src/data/tireMath.js` exports `parseSize`, `sizeGeometry`, `compareSizes`, `decodeDot`, `TREAD` and `treadStatus`.
   - `src/data/tireRatings.js` has a UTQG parser.
4. **House-rules problems in existing code:**
   - `decodeDot()` and `treadStatus()` return a status value of `"fine"`. It must never be shown to users as "fine" or "safe". Map it to wording like "Keep checking monthly".
   - The comment on `TREAD.wetRisk = 4` says "stopping distances in rain climb sharply below this". That needs a citation wherever it appears in the UI. Consumer Reports is the source (S31/S32).
5. **The Florida tread-depth "law" is unverified. This is the highest-risk item in the plan.**
   - Law-firm and aggregator blogs say "Florida minimum tread depth is 2/32 in (Fla. Stat. 316.610)".
   - The statute text returned in search snippets only mentions "marginally worn tires" (a 48-hour repair notice). It shows no numeric depth.
   - A Florida Administrative Code rule, **14-61.0019 "Tire Requirements"**, turned up in search results, but its content could not be read because the site is blocked.
   - **Do not publish a Florida numeric tread minimum** until someone reads the statute and the rule directly. Where a number is needed, use the federal and industry 2/32 in line from NHTSA and USTMA, and attribute it to them.

### 0.3 House rules, applied to every guide

- **Banned words:** "safe", "safe to drive", "safer", "guaranteed".
- **Replacement wording:**
  - "have it inspected"
  - "consider replacing"
  - "manufacturers recommend…"
  - "per [source]…"
- **Sourcing:** every statistic or rule of thumb gets an inline citation to a source ID below. Retailer pages (C-IDs) are used for demand and gap analysis. They are cited only when no primary source exists, and that is flagged.
- **Banned content:**
  - discounts or deals
  - reviews
  - delivery dates or ship times
  - APR or lender names
  - personal names, including bylines. Use "TireDrop team" if an author line is required.
  - brand rankings
- **Keyword phrasings that clash with the rules:** some searches contain wording the rules forbid, such as "can I drive with a nail in my tire" or "tpms light on but tires are fine". Target them in the H2 and FAQ, but answer with rule-compliant wording. Do not echo the word "safe" in answers.

---

## 1. Keyword research

### 1.1 Topic clusters (demand is qualitative)

| # | Cluster | Representative queries (seen in results / PAA-style titles) | Est. volume | Est. difficulty | Who owns the results today | Gap / TireDrop angle | Local modifier? |
|---|---|---|---|---|---|---|---|
| K1 | Tread depth & replacement | tire tread depth, penny test tires, quarter test, how much tread should tires have, 2/32 vs 4/32, when to replace tires, tread depth chart mm | High | High | NHTSA, Tire Rack, Discount Tire, Bridgestone, insurance sites, many thin blogs | Interactive gauge; honest 2/32 (legal) vs 4/32 (wet braking, CR) gap; rain-state context | "Florida tread depth law" (Low/Low, law-firm blogs only) |
| K2 | Reading the sidewall / size | how to read tire size, what do the numbers on a tire mean, what does R mean, tire size chart | High | High | Goodyear, Discount Tire, Michelin, Tire Rack, many aggregators | Live decoder already built; covers flotation (31x10.50R15) sizes, which few explainers do | No |
| K3 | DOT date code & tire age | how to read tire date code, how old are my tires, do tires expire, how old is too old, tire age limit | High | Med | Goodyear, Tire Rack, Bridgestone, NHTSA, safety-research sites | DOT → age → recall in one flow; NHTSA Sun Belt aging research | "Florida heat tire age" (Low/Low) |
| K4 | Pressure & PSI | what should my tire pressure be, door jamb vs max psi, how to check tire pressure, tire pressure hot vs cold, psi in summer | High | High | NHTSA, Discount Tire, Continental, Tire Rack, auto blogs | Pressure-vs-temperature demo with Florida presets; "don't bleed hot tires" (NHTSA) | "tire pressure Florida summer" (Low/Low) |
| K5 | TPMS | tire pressure light on, tpms light flashing, tpms light solid vs flashing, tpms relearn, tpms sensor battery | High | Med | TPMS vendors, trade press, dealers, forums | FMVSS 138 facts (25% warning, 60–90 s malfunction flash) turned into plain steps | Cold-front mornings (Low) |
| K6 | Load / speed / UTQG | load index chart, speed rating chart, what does H mean on a tire, XL tires, UTQG treadwear rating | High (load/speed), Med (UTQG) | Med | Michelin, Goodyear, Tire Rack, Yokohama | Lookup demo; "compare UTQG only within a brand" (CFR) | No |
| K7 | Wear, rotation, alignment, balance | uneven tire wear, tire cupping, inner edge wear, how often rotate tires, balancing vs alignment, car shakes at 60 mph, tire humming noise | High | High | Discount Tire, Michelin, Bridgestone, chain service shops | Click-the-tread diagnosis and symptom checker that route to /install | No |
| K8 | Damage & repair | bubble in tire sidewall, tire plug vs patch, nail in tire, can you patch near sidewall, sidewall damage | High | Med | USTMA, Michelin, AAA, Discount Tire, chains | Repairable-zone map (USTMA/TIA); mobile-service tie-in | "mobile tire repair Miami/Broward" is a service query, not /learn |
| K9 | Tire types & comparisons | types of tires, all-season vs all-terrain, touring vs performance, summer vs all-season, M+S vs 3PMSF | Med–High | Med–High | Tire Rack, Discount Tire, Michelin, Bridgestone | Warm, wet, no-snow climate framing | "best tires for Florida" (Med/Med) |
| K10 | Special tires | EV tires, LT vs P-metric, load range E, run-flat how far, trailer ST tires, towing | Med | Med | Tire makers, retailers, forums | Load-range lookup; Florida boat-trailer angle | "boat trailer tires Florida" (Low/Low) |
| K11 | Fitment | plus sizing, different tire size, bigger tires speedometer, staggered, wheel offset, bolt pattern | Med | Med | Discount Tire, wheel sellers, calculators | Existing `compareSizes()` powers the demo | No |
| K12 | Spares | spare tire types, donut speed limit, how long can you drive on a spare | High | Med | Chains, parts retailers, towing sites (few primary sources) | Identify-your-spare explorer that defers to the label and manual | No |
| K13 | Florida weather | hydroplaning, driving in rain Florida, hurricane car prep, flood water tires, rainy season | High (hydroplaning), Low–Med (local) | High (hydro), Low (local) | Goodyear, Discount Tire, law firms, local shops | NWS rainy-season dates; FLHSMV and FDEM prep; NHTSA flood guidance | Florida, South Florida, Miami, Broward |
| K14 | Age, storage, records | tire dry rot, sidewall cracking, how to store tires, tire recall lookup, tire registration | Med | Low | Michelin, USTMA, TIA, retailers | Snowbird and seasonal-storage angle; full-TIN recall flow | Snowbird storage (Low) |
| K15 | Florida legal & fees | Florida tire law, does Florida require vehicle inspection, Florida tire fee $1 | Low–Med | Low | Law firms, Pep Boys, DOR FAQ | Statute-accurate page (once verified) | Florida |

### 1.2 Question bank (use as H2s and FAQ items)

These are PAA-style questions surfaced in result titles and snippets:

- how much tread should a tire have
- is 4/32 tread depth ok
- what is the legal tread depth in Florida
- how do you read the date on a tire
- do tires expire if not used
- how old is too old for tires
- what should my tire pressure be
- why is my tire pressure light on when the tires look full
- what does a flashing tire pressure light mean
- does heat increase tire pressure
- should I let air out of hot tires
- is nitrogen better than air
- what does 225/65R17 mean
- what is load index 94
- what does H mean on a tire
- what does 500 AA A mean
- can a tire bubble be repaired
- how close to the sidewall can a tire be patched
- plug vs patch
- what to do with a nail in a tire
- how often should I rotate my tires
- what is the difference between balancing and alignment
- why does my car shake at 60 mph
- why are my tires humming
- do I need to replace all 4 tires on an AWD
- should new tires go on the front or back
- are EV tires different
- how far can you drive on a run-flat
- how fast can you drive on a donut
- can I put bigger tires on my car
- does tire size affect the speedometer
- can you rotate staggered tires
- what is hydroplaning and how do you avoid it
- does Florida require vehicle inspection
- how should tires be stored
- what is dry rot on tires
- how do I check if my tires are recalled

### 1.3 Competitor coverage and the gaps TireDrop can own

| Site | What it covers (from indexed pages) | What it lacks |
|---|---|---|
| Tire Rack Upgrade Garage | Q&A pages on tire age, temperature and PSI, AWD matching, UTQG, tread depth, rotation, lug torque, 3PMSF, tire categories | No local context; mostly static text; long Q&A format |
| Discount Tire /learn | Repair, glossary, wear patterns, rolling resistance, construction, buying, types, size, pressure and temperature, hydroplaning, speedometer, 3PMSF | Few interactives; national tone; sells services inline |
| Michelin (Tires 101, tire damage, buying guide) | Load and speed, markings, damage "inspector", mixing tires, size changes, storage, seasonal types | Brand-bound; no climate localization |
| Bridgestone (learn + safety) | Replacement guidance (inspect at 5 yrs, replace at 10 yrs), inspection, rotation, tread patterns, tire life, summer vs all-season | Brand-bound |
| Goodyear (learn / tire basics) | Date code, hydroplaning, load index, UTQG | Thin on maintenance and repair |
| NHTSA TireWise | Buying, maintenance, labeling, aging, fuel efficiency, recalls | Not written for search; few how-tos |
| USTMA / TIA | Care essentials, repair basics, recall lookup, storage practices, rotation | Not consumer-SEO oriented |

**Gaps to own:**
- **Florida localization.** This covers heat and aging, the rainy season (NWS May 15–Oct 15), hurricanes and flooding, Florida law and the tire fee, and boat trailers. National players don't localize, and local shops publish thin posts.
- **Interactive demos inside guides.** Most competitors are static text. Michelin's damage inspector and the size calculators are the exceptions.
- **A statute-accurate Florida law page.** The current results are law-firm pages repeating an unverified 2/32 figure.
- **One DOT → age → recall flow** instead of three separate pages.
- **A consistent "have it inspected" tone.** It stands apart from pages that promise tires are "safe".

---

## 2. Hub structure (10 hubs, 50 guides)

| Hub | Path | Guides | Scope |
|---|---|---|---|
| H1 Tire Basics | /learn/basics | 4 | What tires are and the main categories |
| H2 Reading Your Tire | /learn/sidewall | 6 | Every marking on the sidewall |
| H3 Tread & Wear | /learn/tread | 4 | Depth, measuring, wear patterns, tread life in miles |
| H4 Pressure & TPMS | /learn/pressure | 6 | PSI, checking, temperature, TPMS, nitrogen |
| H5 Damage, Flats & Repair | /learn/damage | 5 | Bulges, punctures, impacts, spares |
| H6 Florida Driving & Weather | /learn/florida | 5 | Rain, heat, hurricanes, law, choosing for Florida |
| H7 Buying Guides | /learn/buying | 7 | Replace decisions and special tire types |
| H8 Wheels & Fitment | /learn/fitment | 4 | Sizes, plus-sizing, staggered, offset |
| H9 Maintenance & Service | /learn/maintenance | 5 | Rotation, balance and alignment, schedules, noise |
| H10 Tire Age, Storage & Records | /learn/age | 4 | Age limits, dry rot, storage, recalls |
| **Total** | | **50** | |

**Changes from the brief's suggested hubs:**
- "Inspection & Damage" became **Damage, Flats & Repair**, because flat-tire and spare queries belong there.
- Monthly inspection moved to **Maintenance**.
- "Florida Weather & Seasons" became **Florida Driving & Weather** and now holds the law page and the choosing-tires-for-Florida page.
- "Tire Age & Storage" gained **Records** (recalls and registration). Both rely on the TIN.

---

## 3. Guide list

### 3.0 Writing status (updated 2026-10-02)

**Written (30 of 50):** G1, G2, G4, G5, G6, G7, G8, G9, G10, G11, G12, G14, G16, G17, G18, G19, G21, G22, G23, G24, G25, G26, G27, G33, G34, G35, G39, G40, G47, G50.

**Written 2026-10-02 by ATLAS (preview/atlas-2026-10-02), 8 guides:**

| # | Path | Notes |
|---|---|---|
| G23 | /learn/damage/flat-tire-nail | Was linked from patch-vs-plug and the storm-cleanup blog post |
| G24 | /learn/damage/pothole-curb-damage | Was linked from tire-bubble-sidewall. Re-angled to "bent rim symptoms" and hidden damage, because the blog post /blog/curb-pothole-tire-alignment-signs already targets "hit a pothole tire damage" |
| G19 | /learn/pressure/tpms-sensors | Was linked from tpms-light. Battery life (5–10 years) is Pirelli's figure, a tire maker, not a sensor maker |
| G4 | /learn/basics/touring-vs-performance-tires | Was linked from utqg-ratings. First guide in the Basics hub |
| G1 | /learn/basics/tire-types | |
| G2 | /learn/basics/parts-of-a-tire | |
| G8 | /learn/sidewall/speed-rating | |
| G10 | /learn/sidewall/sidewall-markings | Doesn't target "what does XL mean", which /learn/buying/xl-vs-sl-tires owns |

**Off-plan guides also live:** /learn/buying/all-season-vs-all-weather-tires, all-terrain-vs-highway-tires, xl-vs-sl-tires; /learn/fitment/bolt-pattern, wheel-offset-backspacing; the /learn/tesla hub (6).

**Skipped on purpose:**
- **G3 all-season-vs-all-terrain:** near-duplicate of the live /learn/buying/all-terrain-vs-highway-tires (same Florida truck/SUV reader, same "all terrain tires on highway" query). Rework with a new angle or drop.
- **G29 Florida tire laws:** ranked #9 in §5 but still needs the statute and FAC 14-61.0019 read directly and a legal review (§0.2 item 5).

**Not yet written (20):** G3, G13, G15, G20, G28, G29, G30, G31, G32, G36, G37, G38, G41, G42, G43, G44, G45, G46, G48, G49.

**Column key:**
- **Vol/Diff** is estimated search volume and ranking difficulty.
- **Words** is the target length.
- **Links** are the 3 internal links.
- **Sources** use the IDs in §6.
- **Demo IDs** are in §4.
- **Titles** are 60 characters or fewer.

### H1 — Tire Basics (/learn/basics)

| # | Slug · Working title | Primary kw · Secondaries | Intent · Vol/Diff · Words | Demo | Internal links | Sources | Unique angle | Rules risk |
|---|---|---|---|---|---|---|---|---|
| G1 | /learn/basics/tire-types · **Types of Tires Explained: Which Kind Fits Your Car** | types of tires · tire categories; all-season tires; summer tires; directional tires | Info · High/High · 1,600 | Diagram (category decision map) | /learn/basics/all-season-vs-all-terrain; /learn/florida/tires-for-florida; /find-my-tires | S44, S49, S36 | Decision map by how you drive, not a catalog. Covers tread pattern types (directional, asymmetric, symmetric), which were merged in here. | Don't call any category "safer". Describe trade-offs in the makers' own terms. |
| G2 | /learn/basics/parts-of-a-tire · **Parts of a Tire: Tread, Belts, Bead and Sidewall** | parts of a tire · tire construction; radial tire; steel belts; tire plies | Info · Med/Low · 1,000 | Diagram (exploded cross-section; reused in D13) | /learn/sidewall/how-to-read-tire-size; /learn/damage/tire-bubble-sidewall; /learn/damage/patch-vs-plug | S3, S36 | Each part links to the failure it explains: bulge (cords), repair zone (belts), age (compounds). | Low. |
| G3 | /learn/basics/all-season-vs-all-terrain · **All-Season vs All-Terrain Tires: Road vs Off-Road** | all season vs all terrain tires · all terrain tires on highway; AT tire noise; M+S meaning | Comparison · Med-High/Med · 1,300 | Diagram + link to /compare | /learn/basics/tire-types; /learn/buying/lt-vs-p-metric; /compare | S44, S49, S36, C7 | Written for Florida truck and SUV owners who drive on pavement in heavy rain and see no snow. M+S reflects tread geometry and is not a performance test (C7/C19). | Don't imply AT tires are "fine in rain". Cite the M+S fact to its source. |
| G4 | /learn/basics/touring-vs-performance-tires · **Touring vs Performance Tires: Comfort, Grip, Tread Life** | touring vs performance tires · grand touring; high performance all-season; UHP tires | Comparison · Med/Med · 1,200 | D10 UTQG Explainer | /learn/sidewall/speed-rating; /learn/sidewall/utqg-ratings; /compare | S44, S9, S35 | Tell the categories apart by reading UTQG and speed rating, not marketing copy. | UTQG is not comparable across brands (S9). |

### H2 — Reading Your Tire (/learn/sidewall)

| # | Slug · Working title | Primary kw · Secondaries | Intent · Vol/Diff · Words | Demo | Internal links | Sources | Unique angle | Rules risk |
|---|---|---|---|---|---|---|---|---|
| G5 | /learn/sidewall/how-to-read-tire-size · **How to Read Tire Size: What 225/65R17 Means** | how to read tire size · tire size meaning; what do the numbers on a tire mean; aspect ratio; LT and flotation sizes | How-to · High/High · 1,500 | D3 Size Decoder (reuse) | /tools/tire-size; /learn/sidewall/load-index; /learn/fitment/different-tire-size | S3, S36, S35 | Each number is mapped to what it changes on the road: ride, clearance, speedometer. Also decodes flotation sizes like 31x10.50R15, which `parseSize` already supports. | Low. Say "start from your door placard size". |
| G6 | /learn/sidewall/dot-date-code · **Tire DOT Code: How to Read a Tire's Date** | tire date code · how old are my tires; DOT TIN; tire manufacture date; 3-digit date code | How-to · High/Med · 1,100 | D2 DOT Reader + Age Timeline | /learn/age/how-old-is-too-old; /learn/age/tire-recalls-registration; /tools/tire-check | S1, S52, S58, S16 | How to find the code (it may be on the inboard side only, per S1), read it, and then use the full TIN for a recall check. | Decoder status labels must not say "fine" or "safe". Age thresholds belong in G47. |
| G7 | /learn/sidewall/load-index · **Tire Load Index Chart: What the Number Means** | tire load index chart · load rating; XL extra load; SL vs XL; load index 91 vs 94 | Info · High/Med · 1,200 | D5 Load & Speed Lookup | /learn/sidewall/speed-rating; /learn/buying/lt-vs-p-metric; /tools/tire-size | S35, S54, S3 | Shows 4 × per-tire capacity against the vehicle's placard needs, plus the XL pressure caveat. | Must say replacements should match or exceed the OE load index (S35). Never suggest a lower one. |
| G8 | /learn/sidewall/speed-rating · **Tire Speed Rating Chart: H, V, W, Y and Z** | tire speed rating chart · what does H mean on a tire; V vs H; ZR tires; mixing speed ratings | Info · High/Med · 1,000 | D5 Load & Speed Lookup | /learn/sidewall/load-index; /learn/basics/touring-vs-performance-tires; /compare | S35, S36, S3 | A rating is a lab endurance limit, which is relevant in Florida heat. Explains what happens when ratings are mixed (S35: the lowest rating governs). | State that a speed rating is a test rating, not a recommended driving speed. |
| G9 | /learn/sidewall/utqg-ratings · **UTQG Ratings Explained: Treadwear, Traction, Temperature** | UTQG rating · treadwear rating; traction AA; temperature A; what does 500 AA A mean | Info · Med/Low · 1,100 | D10 UTQG Explainer | /learn/tread/how-long-do-tires-last; /learn/basics/touring-vs-performance-tires; /compare | S9, S55, C8 | Manufacturers assign the grades themselves (S9). Shows how TireDrop's /compare uses them. | Don't convert treadwear grades into mileage promises. |
| G10 | /learn/sidewall/sidewall-markings · **Tire Sidewall Markings: XL, M+S, Snowflake, Max PSI** | tire sidewall markings · what does XL mean on a tire; M+S; max press; three peak mountain snowflake; RF marking | Info · Med/Low · 1,200 | Diagram (clickable sidewall hotspots; extends D3) | /learn/pressure/correct-tire-pressure; /learn/sidewall/dot-date-code; /learn/buying/run-flat-tires | S36, S3, C7 | Covers everything on the sidewall except the size. Max press is a structural ceiling, not the target pressure. | Must state that sidewall max PSI is not the target (S3). |

### H3 — Tread & Wear (/learn/tread)

| # | Slug · Working title | Primary kw · Secondaries | Intent · Vol/Diff · Words | Demo | Internal links | Sources | Unique angle | Rules risk |
|---|---|---|---|---|---|---|---|---|
| G11 | /learn/tread/tread-depth · **Tire Tread Depth Chart: When to Replace Tires** | tire tread depth · minimum tread depth; 2/32; 4/32; tread depth in mm; new tire tread depth | Info · High/High · 1,600 | D1 Tread Depth Gauge | /learn/tread/how-to-check-tread-depth; /learn/florida/hydroplaning; /tools/tire-check | S1, S13, S31, C3 | Charts the gap between the 2/32 in replacement line (NHTSA/USTMA) and the 4/32 in wet-braking line (CR), in 32nds and mm. | **Tread law:** quote NHTSA and USTMA for 2/32. Do not state a Florida numeric minimum until verified (§0.2). Never call any depth "safe". Say "consider replacing" at 4/32 and cite CR. |
| G12 | /learn/tread/how-to-check-tread-depth · **Penny Test and Quarter Test: Check Tread Depth** | penny test tires · quarter test; tread wear indicator bars; tread depth gauge; how to check tire tread | How-to · High/Med · 900 | D1 (coin mode) | /learn/tread/tread-depth; /learn/tread/uneven-tire-wear; /tools/tire-check | S1, S13, C27 | Hands-on: three methods, and measure three grooves because wear is rarely even. | Coin tests are approximations. End with "have it inspected". |
| G13 | /learn/tread/uneven-tire-wear · **Uneven Tire Wear Patterns: What Causes Them** | uneven tire wear · tire cupping; inner edge wear; feathering; center wear | Info · High/Med · 1,500 | D7 Wear-Pattern Diagnosis | /learn/maintenance/balancing-vs-alignment; /learn/pressure/correct-tire-pressure; /install | S38, S45, S13 | Click the tread to see likely causes and which service addresses them. The "cupping" and "inner edge" pages were merged into this guide. | Present causes as possible causes, and say "have a technician inspect". |
| G14 | /learn/tread/how-long-do-tires-last · **How Long Do Tires Last? Miles, Wear and Warranties** | how long do tires last · how many miles do tires last; treadwear warranty; mileage warranty | Info · High/High · 1,300 | D1 (life-left %) + D10 | /learn/age/how-old-is-too-old; /learn/sidewall/utqg-ratings; /tires | S51, S34, S13 | Covers miles only; years are handed off to G47. Explains how mileage warranties work in general terms. | No mileage promises. Cite any typical range to Bridgestone or CR. |

### H4 — Pressure & TPMS (/learn/pressure)

| # | Slug · Working title | Primary kw · Secondaries | Intent · Vol/Diff · Words | Demo | Internal links | Sources | Unique angle | Rules risk |
|---|---|---|---|---|---|---|---|---|
| G15 | /learn/pressure/correct-tire-pressure · **What Should My Tire Pressure Be? Find Your PSI** | what should my tire pressure be · recommended tire pressure; door jamb sticker; max psi; underinflated; overinflated | Info · High/High · 1,300 | Diagram (placard locator) + D4 | /learn/pressure/how-to-check-tire-pressure; /learn/tread/uneven-tire-wear; /tools/tire-check | S1, S3, S30, S6 | Placard vs sidewall pressure, plus what wrong pressure costs. Fuel: 0.2% mpg lost per 1 psi (S30). Crashes: tires underinflated by more than 25% are 3× more likely to be a pre-crash factor (S6, *verify*). Merged in: "underinflated vs overinflated". | Never give a generic PSI. Always point to the placard. |
| G16 | /learn/pressure/how-to-check-tire-pressure · **How to Check Tire Pressure and Add Air Correctly** | how to check tire pressure · cold tire pressure; tire gauge; how to put air in tires; when to check | How-to · High/Med · 900 | D4 (cold-check helper) | /learn/pressure/correct-tire-pressure; /learn/pressure/tire-pressure-temperature; /mobile-service | S2, S1, S59 | Step by step, with NHTSA's "cold means parked 3+ hours" rule and how to handle a warm tire at a gas station. | "Don't bleed air from hot tires" must cite NHTSA (S4/S1). |
| G17 | /learn/pressure/tire-pressure-temperature · **Tire Pressure and Temperature: The 10°F Rule** | tire pressure temperature · hot vs cold pressure; does heat increase tire pressure; pressure drop cold morning | Info · Med-High/Med · 1,100 | D4 Pressure vs Temperature | /learn/florida/florida-heat-tires; /learn/pressure/tpms-light; /learn/pressure/how-to-check-tire-pressure | C2, C12, S2 | Florida framing: a car moving from an A/C garage to a 95°F driveway, and the cold-front mornings that set off TPMS lights. The demo shows both the rule of thumb and the gas-law math. | The roughly 1 psi per 10°F figure comes from retailers (C2/C12). Label it a rule of thumb and show the physics beside it. |
| G18 | /learn/pressure/tpms-light · **TPMS Light On? Solid vs Flashing Meaning** | tpms light · tire pressure light on; flashing tire pressure light; light on but pressures read correct | Info · High/Med · 1,000 | D11 TPMS Light Explainer | /learn/pressure/tpms-sensors; /learn/pressure/how-to-check-tire-pressure; /mobile-service | S8, S7, S1 | Uses FMVSS 138 facts: a warning at 25% below placard pressure, and a malfunction light that flashes for 60–90 s and then stays on. | TPMS does not replace monthly checks (S1). Avoid echoing the "tires are fine" query wording. |
| G19 | /learn/pressure/tpms-sensors · **TPMS Sensors: Battery Life, Relearn and New Tires** | tpms sensor · tpms relearn; direct vs indirect TPMS; sensor battery; service kit | Info · Med/Low · 1,000 | D11 (malfunction branch) | /learn/pressure/tpms-light; /learn/maintenance/new-tires-checklist; /install | S8, S20, S7 | What happens to TPMS during a tire change or a ship-to-store install. | No battery-life figure without a sensor-maker source. None was found. |
| G20 | /learn/pressure/nitrogen-vs-air · **Nitrogen vs Air in Tires: What Testing Found** | nitrogen in tires · nitrogen vs air; is nitrogen worth it; mixing nitrogen and air | Comparison · Med/Low · 800 | D4 (same gas law) | /learn/pressure/how-to-check-tire-pressure; /learn/pressure/tire-pressure-temperature; /install | S33, S2 | CR's 12-month test: air-filled tires lost 3.5 psi and nitrogen-filled tires lost 2.2 psi, starting from 30 psi (S33, *verify*). | Keep it neutral. No upsell or pricing. |

### H5 — Damage, Flats & Repair (/learn/damage)

| # | Slug · Working title | Primary kw · Secondaries | Intent · Vol/Diff · Words | Demo | Internal links | Sources | Unique angle | Rules risk |
|---|---|---|---|---|---|---|---|---|
| G21 | /learn/damage/tire-bubble-sidewall · **Bubble in Tire Sidewall: Causes and Next Steps** | bubble in tire sidewall · tire bulge; sidewall damage; curb rash tire; can a bubble be repaired | Info · High/Low-Med · 1,000 | D13 Damage & Repairability Map | /learn/damage/pothole-curb-damage; /learn/damage/spare-tire-types; /mobile-service | S37, S14, S19 | A bulge means cord damage and can't be repaired (S37). Includes a visual comparing a bulge with a normal sidewall indentation. | **High.** Never say it is "OK to drive to a shop". Say the tire should be replaced, cite Michelin's "change to the spare", and offer mobile service. |
| G22 | /learn/damage/patch-vs-plug · **Tire Plug vs Patch: What a Proper Repair Looks Like** | tire plug vs patch · how close to sidewall can a tire be patched; 1/4 inch rule; plug-patch combo | Comparison · High/Med · 1,200 | D13 | /learn/damage/flat-tire-nail; /learn/basics/parts-of-a-tire; /install | S14, S19, S60, C23 | The industry standard: dismount, inspect inside, use a combination plug-patch, only in the tread area, only for holes 1/4 in (6 mm) or smaller. | Never say a repaired tire is "safe". Speed-rating rules after repair vary by maker. Cite S60 or omit. |
| G23 | /learn/damage/flat-tire-nail · **Flat Tire or Nail in Tire? What to Do Next** | nail in tire · flat tire what to do; slow leak; screw in tire; can I drive with a nail in my tire | How-to · High/Med · 1,000 | D13 + D12 | /learn/damage/patch-vs-plug; /learn/damage/spare-tire-types; /mobile-service | S14, S1, S3 | Steps for the first hour: leave the nail in, check pressure, then choose between the spare and mobile service, framed for South Florida. Merged in: "flat tire". | **High.** Answer the "can I drive" query with "have it inspected before driving further". Never say yes. |
| G24 | /learn/damage/pothole-curb-damage · **Hit a Pothole or Curb? Tire and Wheel Checks** | pothole tire damage · bent rim symptoms; curb damage; car pulls after pothole | How-to · Med/Low · 900 | D13 + D14 | /learn/damage/tire-bubble-sidewall; /learn/maintenance/balancing-vs-alignment; /install | S37, S45, S47 | A post-impact checklist: bulges can appear days later, and vibration or pulling suggests alignment or wheel damage. | Medium. Say "have it inspected". |
| G25 | /learn/damage/spare-tire-types · **Spare Tire Types: Donut, Full-Size and Repair Kits** | spare tire types · donut speed limit; how long can you drive on a spare; full-size spare; sealant kit | Info · High/Med · 1,100 | D12 Spare Types Explorer | /learn/damage/flat-tire-nail; /learn/buying/run-flat-tires; /mobile-service | S3, S1, S13 | Helps you identify your spare and find where its limits are printed. | **High.** No universal mph or mileage limit. Only secondary sources state "50 mph", so point readers to the label on the spare and the owner's manual. |

### H6 — Florida Driving & Weather (/learn/florida)

| # | Slug · Working title | Primary kw · Secondaries | Intent · Vol/Diff · Words | Demo | Internal links | Sources | Unique angle | Rules risk |
|---|---|---|---|---|---|---|---|---|
| G26 | /learn/florida/hydroplaning · **Hydroplaning: How Tread and Speed Affect Wet Grip** | hydroplaning · what causes hydroplaning; how to avoid hydroplaning; what to do if you hydroplane; worn tires in rain | Info · High/High · 1,600 | D9 Hydroplaning Explainer | /learn/tread/tread-depth; /learn/florida/rainy-hurricane-season-tires; /tires | S53, S31, S32, S62 | The physics of the water wedge, plus CR's worn-tire wet-braking data: about 30 ft longer stops at 4/32 than new (S31/S32, *verify*). Florida detail: water pools in outer lanes. Merged in: "worn tires in rain / wet braking". | **High.** Educational only. No "hydroplaning starts at X mph" and no speed below which it is safe. The NASA work (S62) is on aircraft; don't use it to compute car thresholds. |
| G27 | /learn/florida/florida-heat-tires · **Florida Heat and Tires: Pressure, Aging and Blowouts** | heat and tires · tire blowout heat; hot weather tire pressure Florida; tires age faster in heat | Info · Med/Low · 1,300 | D4 + D2 (Florida mode) | /learn/pressure/tire-pressure-temperature; /learn/age/how-old-is-too-old; /tools/tire-check | S10, S4, S2, S13 | NHTSA found tire aging is a concern in the southern Sun Belt, Florida included (S10), and this guide applies that to South Florida. | Cite NHTSA exactly. Leave out the law-firm "77% of claims" figure unless it is verified in the NHTSA report. |
| G28 | /learn/florida/rainy-hurricane-season-tires · **South Florida Rainy & Hurricane Season Tire Prep** | hurricane prep car tires · rainy season Florida driving; flood water tires; evacuation car checklist | How-to · Low-Med/Low · 1,100 | Diagram (seasonal checklist) + D1 | /learn/florida/hydroplaning; /learn/damage/spare-tire-types; /mobile-service | S29, S25, S28, S11, S61 | Built around the calendar: rainy season runs May 15–Oct 15 (S29). Adds FLHSMV and FDEM prep steps and after-flood tire checks (S11, S61). Merged in: separate rainy-season and hurricane pages. | No service-availability or timing promises around storms. After a flood, "have it inspected". |
| G29 | /learn/florida/florida-tire-laws · **Florida Tire Laws: Tread, Inspections and Tire Fees** | Florida tire tread law · Florida minimum tread depth; does Florida require vehicle inspection; Florida tire fee | Info · Low-Med/Low · 1,000 | Diagram (statute cards) + D1 | /learn/tread/tread-depth; /learn/buying/buying-tires-online; /install | S22, S23, S27, S26 | What the statutes say: § 316.610's "marginally worn tires" language; no annual safety inspection (ended 1981, *verify*); the $1-per-new-tire fee, which must be listed separately on the invoice (§ 403.718). | **Highest.** Quote the statutes verbatim with section numbers and dates. Don't state a Florida numeric tread minimum unless it is verified in statute or FAC 14-61.0019. Add a "not legal advice" note and get a legal review. |
| G30 | /learn/florida/tires-for-florida · **Choosing Tires for Florida: Rain, Heat, No Snow** | best tires for Florida · summer vs all-season Florida; do I need all-season tires in Florida; tires for rain | Comparison · Med/Med · 1,400 | D10 + link to D9 | /learn/basics/tire-types; /learn/florida/hydroplaning; /find-my-tires | S44, S9, C3 | Put wet grip and the temperature grade ahead of snow ratings. Summer tires are an option where it rarely drops below about 45°F (S44). Merged in: "summer vs all-season". | No brand rankings, no "safest", no reviews. "Best" appears only as a keyword. |

### H7 — Buying Guides (/learn/buying)

| # | Slug · Working title | Primary kw · Secondaries | Intent · Vol/Diff · Words | Demo | Internal links | Sources | Unique angle | Rules risk |
|---|---|---|---|---|---|---|---|---|
| G31 | /learn/buying/when-to-replace-tires · **When to Replace Tires: 6 Signs to Check** | when to replace tires · do I need new tires; signs you need new tires | Info · High/High · 1,300 | Link to /tools/tire-check + D1 + D2 | /tools/tire-check; /learn/tread/tread-depth; /learn/age/how-old-is-too-old | S41, S46, S1 | A decision page: one short section per signal, each routing to its deep guide. It must not target "tread depth" terms, which belong to G11. | **High.** Use "consider replacing" and "have it inspected" throughout. |
| G32 | /learn/buying/replace-two-or-four-tires · **Replace 2 Tires or 4? Rear Axle and AWD Rules** | replace 2 or 4 tires · new tires front or back; AWD replace all 4; tread difference AWD; tire shaving | Comparison · Med-High/Med · 1,200 | D1 (four-tire compare mode) | /learn/buying/when-to-replace-tires; /learn/maintenance/tire-rotation; /tires | S40, C28, C4 | Michelin's rule that new pairs go on the rear axle, plus AWD tread-difference tolerances from the owner's manual. Merged in: the AWD page. | AWD tolerance is set by each vehicle maker. Don't quote one number as universal. |
| G33 | /learn/buying/lt-vs-p-metric · **LT vs P-Metric Tires: Load Range and Towing** | LT vs P tires · load range E; C vs D vs E; 10 ply; tires for towing | Comparison · Med/Med · 1,400 | D5 (LT mode) | /learn/sidewall/load-index; /learn/buying/trailer-tires; /tires | S3, S35, S54 | Merges the "towing and payload" guide from the /tire-care UPCOMING list. | Don't compute LT pressures. Refer readers to the tire maker's load and inflation tables and the placard. |
| G34 | /learn/buying/ev-tires · **EV Tires: Do Electric Cars Need Special Tires?** | EV tires · EV vs regular tires; why EV tires wear faster; HL load index; foam-lined tires | Info · Med-High/Med · 1,200 | D5 + D10 | /learn/sidewall/load-index; /learn/maintenance/tire-rotation; /find-my-tires | S56, S57, S35 | Covers the load index (including HL), how acoustic-foam liners affect repair, and rotation frequency. | Drop unsourced figures such as "30% heavier" and "wear 15–20% faster", or source them. |
| G35 | /learn/buying/run-flat-tires · **Run-Flat Tires: How Far You Can Drive and Trade-offs** | run flat tires · how far can you drive on a run flat; can run flats be repaired; replace run flats with regular | Info · Med/Med · 1,100 | D12 | /learn/damage/spare-tire-types; /learn/pressure/tpms-light; /tires | S50, S36, S8 | Run-flats depend on TPMS, and distance and speed limits are product-specific. For example, Bridgestone DriveGuard is rated for 50 mi at 50 mph (S50). | Attribute every distance figure to a named product line. Repair policy varies by maker. |
| G36 | /learn/buying/buying-tires-online · **Buying Tires Online: Size, Fit and Installation** | buying tires online · how to buy tires online; ship tires to installer; mobile tire installation | How-to · Med/High · 1,200 | D3 + D2 (check the date on arrival) | /find-my-tires; /install; /mobile-service | S1, S16, S52 | Explains TireDrop's model neutrally: confirm the size from the placard, match load and speed ratings, choose ship-to-store or mobile, and register the TIN. | **High.** No delivery dates, deals, reviews or financing. Keep the shipping area to "48 contiguous states + DC". |
| G37 | /learn/buying/trailer-tires · **Boat Trailer Tires (ST): Load, Heat and Age** | trailer tires · ST vs LT trailer; boat trailer tire pressure; trailer tire age; trailer blowout | Info · Med/Low · 1,200 | D5 + D2 | /learn/buying/lt-vs-p-metric; /learn/age/how-old-is-too-old; /tires | S13, S3, S10 (+ **needs an ST-specific maker source**) | The Florida boat-trailer angle: saltwater, heat, and trailers that sit parked for long stretches. | **Hold until sourced.** The only ST age and speed guidance found was on forums. Also confirm TireDrop sells ST sizes (a `/commercial-tires` route exists). |

### H8 — Wheels & Fitment (/learn/fitment)

| # | Slug · Working title | Primary kw · Secondaries | Intent · Vol/Diff · Words | Demo | Internal links | Sources | Unique angle | Rules risk |
|---|---|---|---|---|---|---|---|---|
| G38 | /learn/fitment/plus-sizing · **Plus Sizing Tires and Wheels: The 3% Rule** | plus sizing tires · plus one tire size; bigger rims ride quality; upsizing wheels | How-to · Med/Med · 1,300 | D6 Plus-Size & Speedometer | /learn/fitment/different-tire-size; /learn/sidewall/load-index; /tools/tire-size | S42, C14, S35 | Plus-sizing keeps the overall diameter the same. What changes is the sidewall, the load index and TPMS, and the demo shows all three. | The 3% figure is an industry guideline from retail sources, not an approval. Load index must meet OE. |
| G39 | /learn/fitment/different-tire-size · **Can I Use a Different Tire Size? Speedometer Effects** | can I use a different tire size · does tire size affect speedometer; bigger tires speedometer; alternate sizes | Info · High/Med · 1,200 | D6 | /learn/fitment/plus-sizing; /learn/sidewall/how-to-read-tire-size; /compare | S42, C14, S3 | The speedometer and odometer math, and the implications for ABS and AWD. Merged in: "speedometer error". | Don't approve specific substitutions. Say "have fitment confirmed". |
| G40 | /learn/fitment/staggered-tires · **Staggered Tires Explained: Fitment, Rotation, Wear** | staggered tires · staggered wheels; can you rotate staggered tires; staggered vs square | Info · Low-Med/Low · 900 | D8 (staggered mode) | /learn/maintenance/tire-rotation; /learn/fitment/wheel-offset-bolt-pattern; /tires | S48, C5, S40 | Why the rear tires wear faster, why rotation is side-to-side only, and buying in pairs. | Low. |
| G41 | /learn/fitment/wheel-offset-bolt-pattern · **Wheel Offset, Bolt Pattern and Center Bore Explained** | wheel offset · bolt pattern; center bore; hub-centric rings; backspacing | Info · Med-High/Med · 1,300 | Diagram (offset slider SVG) | /learn/fitment/plus-sizing; /learn/maintenance/new-tires-checklist; /wheels | C6, S42 (+ **needs a primary wheel-standard source**) | Tied to the existing /wheels catalog. | Low. Say "have fitment verified". Sourcing is weak and relies on retail pages, so flag it. |

### H9 — Maintenance & Service (/learn/maintenance)

| # | Slug · Working title | Primary kw · Secondaries | Intent · Vol/Diff · Words | Demo | Internal links | Sources | Unique angle | Rules risk |
|---|---|---|---|---|---|---|---|---|
| G42 | /learn/maintenance/tire-rotation · **Tire Rotation: How Often and Which Pattern** | tire rotation · how often to rotate tires; rotation pattern; directional tire rotation; AWD rotation | How-to · High/High · 1,200 | D8 Rotation Animator | /learn/maintenance/balancing-vs-alignment; /learn/fitment/staggered-tires; /install | S18, S48, C5, S49 | Pick the pattern by drivetrain and tread type. Directional tires are covered here. | TIA says every 5,000–7,000 mi (S18), but the owner's manual comes first. |
| G43 | /learn/maintenance/balancing-vs-alignment · **Tire Balancing vs Wheel Alignment: Key Differences** | balancing vs alignment · signs of bad alignment; car pulls to one side; steering wheel shakes; alignment after new tires | Comparison · High/Med · 1,200 | D14 + D7 | /learn/tread/uneven-tire-wear; /learn/maintenance/tire-noise-vibration; /install | S45, S13, S38 | Maps each symptom to the service that addresses it. Merged in: "alignment signs". | Medium. Present causes as possible causes. |
| G44 | /learn/maintenance/tire-maintenance-checklist · **Tire Maintenance Checklist: Monthly to Yearly** | tire maintenance checklist · monthly tire check; P.A.R.T.; tire inspection | How-to · Med/Med · 1,000 | Interactive checklist (reuses /tools/tire-check) | /tools/tire-check; /learn/pressure/how-to-check-tire-pressure; /learn/tread/how-to-check-tread-depth | S13, S15, S2 | USTMA's P.A.R.T. (Pressure, Alignment, Rotation, Tread) turned into a printable schedule adapted to Florida. Merged in: "monthly inspection". Replaces /tire-care. | Low. |
| G45 | /learn/maintenance/new-tires-checklist · **New Tires Checklist: Re-Torque, Break-In, Recheck** | new tires break in · re-torque lug nuts; lug nut torque; what to check after new tires | How-to · Med/Low · 1,000 | D11 + diagram (star torque pattern) | /learn/maintenance/tire-rotation; /learn/pressure/tpms-sensors; /install | C6, S20 | Covers two guides from the UPCOMING list: "torque specs" and "the week after". | Give no torque values; refer to the owner's manual. The "80% of wheel-offs" TIA figure came from a secondary source, so verify it or drop it. |
| G46 | /learn/maintenance/tire-noise-vibration · **Tire Noise and Vibration: Hum, Thump or Shake?** | tire noise · tires humming; car shakes at 60 mph; vibration at highway speed; wheel bearing vs tire noise | Info · High/Med · 1,200 | D14 Symptom Checker | /learn/maintenance/balancing-vs-alignment; /learn/tread/uneven-tire-wear; /install | S45, S38, S37 | A symptom tree that separates tire causes from non-tire causes. | Possible causes only. Don't diagnose brakes or bearings. |

### H10 — Tire Age, Storage & Records (/learn/age)

| # | Slug · Working title | Primary kw · Secondaries | Intent · Vol/Diff · Words | Demo | Internal links | Sources | Unique angle | Rules risk |
|---|---|---|---|---|---|---|---|---|
| G47 | /learn/age/how-old-is-too-old · **How Old Is Too Old for Tires? 6- and 10-Year Guidance** | how old is too old for tires · do tires expire; tire age limit; spare tire age; 10-year-old tires | Info · High/Med · 1,200 | D2 DOT Reader + Age Timeline | /learn/sidewall/dot-date-code; /learn/florida/florida-heat-tires; /tools/tire-check | S46, S47, S1, S10 | Manufacturer guidance side by side. Bridgestone: inspect from 5 years, replace at 10 (S46). NHTSA: some makers say 6–10 years (S1). Adds the heat effect. G6 covers how to read the code; this guide covers what the age means. | **High.** Never say tires under X years are "safe". |
| G48 | /learn/age/tire-dry-rot · **Tire Dry Rot and Sidewall Cracks: What They Mean** | tire dry rot · sidewall cracking; weather checking; ozone cracking; cracks between tread | Info · Med-High/Low · 900 | D13 (cracks layer) | /learn/age/how-old-is-too-old; /learn/age/tire-storage; /mobile-service | S39, S47, S13 | Florida UV plus cars parked for long stretches, such as snowbird vehicles. | **High.** No crack-depth threshold (the "1/16 in" figure is from a blog). Say "have it inspected". |
| G49 | /learn/age/tire-storage · **How to Store Tires: Heat, Sunlight and Ozone** | how to store tires · tire storage garage; storing tires in heat; stacked or standing; long-term car storage tires | How-to · Low-Med/Low · 900 | Diagram + D2 timeline | /learn/age/tire-dry-rot; /learn/age/how-old-is-too-old; /tires | S17, S21, S43 | Storage for snowbirds and during hurricane season, in hot garages. Keep tires away from electric motors and other ozone sources (S17). Covers the "seasonal set" guide from the UPCOMING list. | Low. |
| G50 | /learn/age/tire-recalls-registration · **Tire Recalls: Check Your TIN and Register Tires** | tire recall check · tire registration; recall lookup by DOT number; NHTSA tire recall | How-to · Med/Low · 800 | D2 (full-TIN parse) | /learn/sidewall/dot-date-code; /learn/buying/buying-tires-online; /install | S5, S16, S1 | The only guide about the full TIN. The TIN may be on only one side of the tire (S16). | Low. Don't claim TireDrop registers tires unless the business confirms it does. |

### 3.1 Cannibalization: merges and ownership of shared keywords

**Merged into one guide:**

| Would-be guide / query | Merged into | Why |
|---|---|---|
| Underinflated vs overinflated | G15 | Same searcher and answer as "what should my PSI be" |
| Tire cupping; inner-edge wear | G13 | Sub-patterns of uneven wear; one diagnosis demo |
| AWD "replace all four" | G32 | Same decision as "2 or 4" |
| Summer vs all-season | G30 | In Florida, the question is really "what should I run here" |
| Worn tires in rain; wet braking | G26 (G11 cites CR data but targets depth keywords) | Avoids two wet-grip pages |
| Tire size and speedometer error | G39 | Speedometer error is a consequence of changing size |
| Signs of bad alignment | G43 | Symptom-to-service page |
| Directional tread | G1 + G42 | Definition in G1, rotation in G42 |
| Towing and payload | G33 | Load range drives the answer |
| Rainy season + hurricane prep | G28 | One seasonal Florida page |
| Monthly inspection | G44 | Same checklist intent |
| Flat tire + nail in tire | G23 | Same moment, same next steps |
| Lug torque + post-install checks | G45 | Same post-install moment |
| "Are my new tires old?" | G47 + G36 | Covered as sections |

**Pairs that stay separate, with the keyword each one owns:**
- **G11 / G12:** G11 owns depth thresholds and "chart". G12 owns "penny test" and "how to check".
- **G15 / G16:** G15 owns "what PSI". G16 owns "how to check".
- **G6 / G47:** G6 owns "date code" and "how to read". G47 owns "how old is too old" and "expire".
- **G38 / G39:** G38 owns "plus sizing". G39 owns "different size" and "speedometer".
- **G21 / G24:** G21 owns "bubble" and "bulge". G24 owns "pothole" and "curb".
- **G22 / G23:** G22 owns "plug vs patch". G23 owns "nail in tire" and "flat tire".
- **G17 / G27:** G17 owns the generic pressure-and-temperature terms. G27 owns Florida and heat terms.
- **G31** is a router page. It must not target any other guide's primary keyword.
- **Existing `/tire-care` page:** redirect it, or make it the landing page (§0.2).

---

## 4. Demo list (14 reusable React components)

Every demo must meet these baseline standards:
- **Text first.** The result is always stated in words, never only as color, an icon or a gauge.
- **Keyboard.** Fully operable from the keyboard.
- **Screen readers.** Results announce in an `aria-live="polite"` region.
- **Reduced motion.** Honors `prefers-reduced-motion`.
- **Touch and zoom.** Touch targets are at least 44 px, and the demo works at 320 px width and 200% zoom.
- **SVG.** Every SVG has a `<title>` and `<desc>`.
- **Sources.** A "Source:" footnote with links sits under each demo.
- **Wording.** Status wording comes from one shared vocabulary:
  - "Replace"
  - "Consider replacing"
  - "Have it inspected"
  - "Keep checking monthly"
  - Never "safe", "OK" or "fine".

| ID | Name | What the user does → what they see | Data / formula + source | Accessibility notes | Used by | Effort | Rules risk |
|---|---|---|---|---|---|---|---|
| D1 | **Tread Depth Gauge** | Drag a depth slider (0–12/32 in, with mm shown), or pick "penny" or "quarter". The groove cross-section updates: the coin sinks in, wear bars come up flush, and a status and life-left % are shown. Four-tire mode compares several readings. | `treadStatus()` in tireMath.js. mm = n/32 × 25.4. 2/32 is the replacement line and penny test (S1, S13). 4/32 is the wet-braking line and quarter test (S31, C3, C27). Typical new depth is 10–11/32 (C11). | Slider has `aria-valuetext` such as "4/32 inch, 3.2 mm, consider replacing". Coin views have text equivalents. | G11, G12, G14, G28, G29, G31, G32 | M | Don't show `status: "fine"` as-is. No "safe" above any depth. Attribute the 4/32 line to CR. |
| D2 | **DOT Date Reader + Age Timeline** | Type or paste a TIN or its last 4 digits. The date digits are highlighted, then the week, year and age are shown and placed on a 0–12 year timeline. There's an optional "hot climate (Florida)" note and a "full TIN → recall lookup" link. | `decodeDot()` in tireMath.js; 3-digit codes are pre-2000. Timeline markers: inspect from 5 yrs (S46, S47); "some makers: 6–10 yrs" (S1); replace at 10 yrs per Bridgestone and Michelin (S46). Heat note from S10. Recall search via S16 and S5. | Input takes a pattern hint ("e.g., 2319"). Errors are announced. The timeline has a list fallback. | G6, G27, G31, G36, G37, G47, G49, G50 | S (logic exists) | Map status to "Keep checking / Have it inspected / Manufacturers recommend replacing". Never show "fine". |
| D3 | **Size Decoder (embed of /tools/tire-size)** | Type a size. Each segment (P/LT, width, aspect, R, rim, load, speed) is highlighted with a one-line meaning and a link to its guide. There's also a compact embed mode. | `parseSize()` and `sizeGeometry()` (existing), handling P-metric, LT and flotation sizes. Definitions per S3 and S36. | Segments are buttons with an `aria-describedby` explanation. Also shown as a definition list. | G5, G10, G36 (+ G7, G38 links) | S (reuse) | Low. |
| D4 | **Pressure vs Temperature** | Enter the placard cold PSI and the temperature at fill, then drag the current temperature. You see the estimated PSI both ways: the rule of thumb and the gas law. Presets: "July Miami: 7 am vs 3 pm", "Cold front morning", "A/C garage → driveway". Shows a "hot tire after driving: don't bleed air" callout. | Rule of thumb: ±1 psi per 10°F (C2, C12). Physics: P₂ = (P₁ + 14.7) × (T₂ + 459.67)/(T₁ + 459.67) − 14.7, which is Gay-Lussac's law using absolute pressure. Cold is defined as parked 3+ hours (S2, S1). "Don't bleed hot tires" per S4. | Numeric inputs with units in the labels. The chart has a table fallback. | G15, G16, G17, G20, G27 | S–M | Never output a recommended PSI. Always say "your placard value". Label the estimate as an approximation. |
| D5 | **Load & Speed Lookup** | Enter a load index or speed symbol, or the OE and candidate values. You see kg/lb per tire, the ×4 total, the mph rating, and whether the candidate is "Meets or exceeds OE" or "Below OE — not recommended by tire makers". There are SL/XL/LT load-range notes. | The standard load-index table (published by Goodyear, S54, and Michelin, S35) and the speed-symbol table (for example H = 130, V = 149, W = 168, Y = 186 mph per S35). Must meet or exceed OE (S35). | Searchable table. Results are announced. | G7, G8, G33, G34, G37 (+ G38) | S | Speed rating is not a recommended driving speed. No "OK to use lower". |
| D6 | **Plus-Size & Speedometer** | Enter the current size and a new size. You see the overall diameter, the % difference, revs per mile, and "speedometer reads 60 → actual X" at 30/45/60/70 mph, plus the sidewall-height change. The 3% guideline is flagged along with a load-index check. | `compareSizes()` (existing). Speedometer error = actual/indicated = new diameter / old diameter. The 3% guideline per C14, with Michelin's size-change guidance (S42). | Results in a table with the key sentence announced. | G38, G39, G5 | M (logic exists) | Never say "fits" or "approved". Say "have fitment confirmed". Call 3% a guideline. |
| D7 | **Wear-Pattern Diagnosis** | Click a tread illustration or choose from a radio list: center, both shoulders, one edge, cupping, feathering, flat spot, diagonal. You see likely causes and which service checks each (pressure, alignment, balance, suspension). | Pattern-to-cause mapping from Michelin tread problems (S38), car handling (S45), and USTMA P.A.R.T. (S13). Discount Tire (C15) is used only as a cross-check. | A radio-group alternative to image clicks. Patterns are distinguished by shape and label, not color. | G13, G43 (+ G15) | M | Possible causes only. End with "have a technician inspect" and link to /install. |
| D8 | **Rotation Animator** | Pick the drivetrain (FWD/RWD/AWD/4WD), tread type (non-directional/directional), setup (square/staggered) and whether a full-size spare is in the rotation. Animated arrows show the pattern, and the interval is shown. | Forward cross, rearward cross, X, front-to-back and side-to-side patterns (C5, S48). Directional limits (S49). Interval every 5,000–7,000 mi per TIA (S18), with "owner's manual first". | With reduced motion, a static diagram plus a text list ("Left front → left rear…"). | G42, G40, G32, G34 | M | Low. The owner's manual overrides. |
| D9 | **Hydroplaning Explainer** | Adjust tread depth (2–10/32), water (damp / standing / deep puddle) and a *qualitative* speed band (slower / moderate / faster). A side view shows the water wedge lifting into the contact patch, the grooves shedding water, and a percentage of the contact patch still touching the road. A CR data card compares wet-braking distance at new vs 4/32 tread. | Mechanism from Goodyear (S53) and the NASA hydroplaning study (S62), shown conceptually only. Data from Consumer Reports (S31, S32). Florida rain facts (S29). **No speed thresholds are computed.** | Every state change produces a text description. Reduced motion shows static frames. No flashing effects. | G26, G30, G28, G11 | L | **Highest.** Educational only. No mph, no "safe below X", no "you won't hydroplane". Include a disclaimer: "Many factors are involved; slow down and keep tires maintained." |
| D10 | **UTQG Explainer** | Enter a string like "500 AA A" or pick from the catalog. You see treadwear relative to the government control tire (100), what the traction grade measures (wet straight-line braking), and the temperature-grade speed band. | 49 CFR 575.104 (S9). Traction AA means at least 0.54 on asphalt and 0.38 on concrete. Temperature A = over 115 mph, B = 100–115, C = 85–100 (Yokohama and CFR, *verify on eCFR*). The existing UTQG parser is in tireRatings.js. | Definition list output. Grades are explained in words. | G9, G4, G14, G30, G34 | S | Grades are manufacturer-assigned; compare only within a brand (S9). No mileage conversion. |
| D11 | **TPMS Light Explainer** | Pick what the dash shows: off, solid, flashing then solid, came on after a tire change or rotation, or on during a cold morning. You see what it means and the next steps. | FMVSS 138: warns at 25% below the placard cold pressure, or a minimum level, whichever is higher; malfunction light flashes 60–90 s then stays on (S8). "Not a substitute for monthly checks" (S1, S7). | Buttons with text labels. Any animated icon also has a text description. | G18, G19, G35, G45, G17 | S | Don't say "light off means tires are fine". |
| D12 | **Spare Types Explorer** | Choose your spare: full-size matching, full-size non-matching, compact "T-type" temporary, folding, run-flat, or sealant and inflator kit. You see what it is, where its limits are printed (spare sidewall, label, owner's manual), pressure notes, age reminder and TPMS notes. | Check the spare's pressure monthly (S1, S2). Spare age is included in Bridgestone's 10-year guidance (S46). Run-flat limits are product-specific (S50). | Card grid with radio semantics. Images have alt text. | G25, G23, G35, G28 | S | **High.** No universal speed or distance limits. Tell readers to follow the printed label and the manual. |
| D13 | **Damage & Repairability Map** | Tap a zone on a tire cross-section (center tread, shoulder, sidewall, bead) and pick the damage (puncture ≤ 1/4 in, puncture > 1/4 in, cut, bulge, cracks, curb scrape). You see "may be repairable only after an internal inspection" or "not repairable under USTMA/TIA practice — replace". Includes a bulge vs normal-indent visual. | USTMA repair basics (S14), TIA (S19), Cooper bulletin #108 (S60): tread area only, ≤ 1/4 in (6 mm), plug-patch combination, internal inspection required. Michelin on bulges (S37) and damage (S39). | Zone picker is also a select list. Diagram labels are text, not color. | G21, G22, G23, G24, G48 (+ G2 diagram) | M | Never "safe to repair" or "safe to drive". Always "a technician must inspect the inside". |
| D14 | **Noise & Vibration Symptom Checker** | Answer 3–4 questions: when it happens (speed band, braking, turning, always), where you feel it (steering wheel, seat, pedal) and what you hear (hum, thump, growl). You see a ranked list of possible causes (balance, tire out-of-round or separation, bent wheel, alignment wear, rotors, bearing) and which service inspects each. | Michelin car handling (S45), tread problems (S38), sidewall and bulge (S37). Ranking is a transparent rules table in the code, not a probability. | Stepper form. Every step can be reviewed. Results are a plain list. | G46, G43, G24 | M | "Possible causes. Have it inspected." No diagnosis claims. |

**Candidates considered and folded in:**
- Tire age timeline → merged into D2.
- Sidewall damage visual guide → merged into D13.
- Placard locator, offset slider, torque star pattern, seasonal checklist and category map → left as static or lightly interactive **diagrams**, not demos. Each serves only 1–2 guides.

**Suggested build order** (most guide coverage per unit of effort):
1. D2, D1, D3, D11 and D10. These are S effort and cover 26 guide slots.
2. D4, D5 and D13.
3. D6, D7, D8 and D14.
4. D9 last. It is L effort, carries the highest risk, and needs legal and copy review.

---

## 5. Opportunity ranking (top 10)

Scoring weighs four things: estimated demand, how beatable the current results are, differentiation (Florida angle or demo), and closeness to purchase or service.

| Rank | Guide | Why |
|---|---|---|
| 1 | G27 Florida Heat and Tires | Low competition. Real NHTSA Sun Belt research. Uses two demos. Leads to /tools/tire-check. |
| 2 | G6 Tire DOT Code | High demand. Medium difficulty. D2 is nearly free to build. Links naturally to recalls and age. |
| 3 | G17 Tire Pressure and Temperature | Florida presets set it apart. Uses D4. High seasonal intent. |
| 4 | G18 TPMS Light On | High demand, and it's the moment people act. Uses FMVSS facts. Leads to /mobile-service. |
| 5 | G47 How Old Is Too Old | High demand. Manufacturer guidance side by side, plus Florida heat. |
| 6 | G11 Tire Tread Depth Chart | Highest demand, though competitive. The gauge demo and the 2/32 vs 4/32 framing are the edge. |
| 7 | G21 Bubble in Tire Sidewall | High demand with clear sources, and results are winnable. Leads to mobile service. |
| 8 | G26 Hydroplaning | High demand, and Florida has the most rain relevance. Hard results, but D9 sets it apart. Build last because of risk. |
| 9 | G29 Florida Tire Laws | Low difficulty. Current results are law-firm pages. Needs verification and legal review first. |
| 10 | G22 Tire Plug vs Patch | High demand. Authoritative USTMA/TIA sources. D13. Leads to /install. |

---

## 6. Sources

**Status of every URL:**
- All were found via WebSearch on 2026-09-29.
- **None could be opened with WebFetch** because the proxy blocked them (§0.1).
- Verify each figure on the page itself before publishing.

**Source types:**
- **S-IDs** are authoritative: government, industry associations, tire makers, and consumer-testing organizations.
- **C-IDs** are competitor or retailer pages. They were used for gap analysis and are cited only where flagged.

### Government / regulatory
- S1 NHTSA TireWise — https://www.nhtsa.gov/vehicle-safety/tires
- S2 NHTSA "Tires in the Garage" infographic — https://www.nhtsa.gov/sites/nhtsa.gov/files/2021-11/Tires_InTheGarage_Infographic_102621_v1_-eng-tag.pdf
- S3 NHTSA "Tire Safety: Everything Rides On It" — https://www.nhtsa.gov/document/tire-safety
- S4 NHTSA Summer Driving Tips — https://www.nhtsa.gov/summer-driving-tips
- S5 NHTSA Recalls (vehicle, tire, equipment) — https://www.nhtsa.gov/recalls
- S6 NHTSA DOT HS 811 617, Tire-Related Factors in the Pre-Crash Phase — https://crashstats.nhtsa.dot.gov/Api/Public/ViewPublication/811617
- S7 NHTSA DOT HS 811 681, Evaluation of the Effectiveness of TPMS — https://crashstats.nhtsa.dot.gov/Api/Public/ViewPublication/811681
- S8 FMVSS No. 138, Tire Pressure Monitoring Systems — https://www.nhtsa.gov/sites/nhtsa.dot.gov/files/fmvss/tirepressure-fmvss-138.pdf (final rule: https://www.federalregister.gov/documents/2005/09/07/05-17661/federal-motor-vehicle-safety-standards-tire-pressure-monitoring-systems)
- S9 49 CFR § 575.104, Uniform Tire Quality Grading Standards — https://www.ecfr.gov/current/title-49/subtitle-B/chapter-V/part-575/subpart-B/section-575.104 (mirror: https://www.law.cornell.edu/cfr/text/49/575.104)
- S10 NHTSA, "Tire Aging: A Summary of NHTSA's Work" — hosted copy: https://www.tirereview.com/wp-content/uploads/2014/07/U_S_DOT_NHTSA_-_Tire_Aging_A_Summary_of_NHTSAs_Work1.pdf (*find the nhtsa.gov original before citing*)
- S11 NHTSA Hurricane- and Flood-Damaged Vehicles — https://www.nhtsa.gov/hurricane-and-flood-damaged-vehicles
- S12 NTSB Special Investigation Report SIR-15/02, Passenger Vehicle Tire Safety — https://www.ntsb.gov/safety/safety-studies/Documents/SIR1502.pdf (background)
- S30 fueleconomy.gov, Keeping Your Vehicle in Shape — https://www.fueleconomy.gov/feg/maintain.jsp
- S62 NASA, "Hydrodynamics of Tire Hydroplaning" (NTRS 19660026826) — https://ntrs.nasa.gov/api/citations/19660026826/downloads/19660026826.pdf

### Florida
- S22 Fla. Stat. § 316.610, Safety of vehicle; inspection — https://flsenate.gov/Laws/Statutes/2025/0316.610
- S23 Fla. Stat. § 403.718, Waste tire fees — https://www.flsenate.gov/Laws/Statutes/2025/403.718
- S24 FLHSMV Tire Safety — https://www.flhsmv.gov/safety-center/vehicle-safety/tire-safety/
- S25 FLHSMV Emergency Preparedness — https://www.flhsmv.gov/safety-center/driving-safety/inclement-weather-conditions/emergency-preparedness/
- S26 Fla. Admin. Code R. 14-61.0019, Tire Requirements — https://flrules.org/gateway/RuleNo.asp?ID=14-61.0019 (*content unread; check which vehicles it applies to*)
- S27 Florida Dept. of Revenue FAQ, solid waste fee for tires — https://floridarevenue.com/faq/Pages/FAQDetails.aspx?FAQID=1402&IsDlg=1
- S28 Florida Division of Emergency Management, "Halfway Full, Halfway There" — https://www.floridadisaster.org/planprepare/halfwayfull/
- S29 NWS Miami, Rainy Season Outlook — https://www.weather.gov/media/mfl/news/RainySeasonOutlook2024.pdf

### Industry associations
- S13 USTMA Tire Care Essentials — https://www.ustires.org/tire-care-safety/tire-care-essentials
- S14 USTMA Tire Repair Basics — https://www.ustires.org/tire-care-safety/tire-repair-basics
- S15 USTMA Tire Care & Safety hub — https://www.ustires.org/tire-care-safety
- S16 USTMA Tire Recall Lookup (TIN) — https://recallinfo.ustires.org/TireRecallSearch/Tin
- S17 USTMA Tire Information Service Bulletin Vol. 23 No. 6 (storage) — https://www.ustires.org/system/files/2024-12/TISB_23%20No%206%20November%202024.pdf
- S18 Tire Industry Association, Tire Rotation — https://www.tireindustry.org/resources/consumer-education/consumer-safety-overview/tire-rotation/
- S19 Tire Industry Association, Tire Repair — https://www.tireindustry.org/resources/consumer-education/consumer-safety-overview/tire-repair/
- S20 Tire Industry Association, Consumer Education (incl. TPMS) — https://www.tireindustry.org/resources/consumer-education/
- S21 TIA Best Management Practices for Proper Tire Storage — https://www.tireindustry.org/pub/?id=2EF13928-1866-DAAC-99FB-DD3BE7DC0227

### Consumer testing
- S31 Consumer Reports, What Happens to Performance When Tires Are Worn — https://www.consumerreports.org/cars/tires/what-happens-to-performance-when-tires-are-worn-a8910439854/
- S32 Consumer Reports, Tire Traction in Wet Weather (worn tires) — https://www.consumerreports.org/tires/tire-traction-in-wet-weather-worn-tires
- S33 Consumer Reports, Should You Use Nitrogen in Your Car Tires? — https://www.consumerreports.org/cars/tire-buying-maintenance/should-you-use-nitrogen-in-car-tires-a6260003694/
- S34 Consumer Reports, How Long Do Tires Last — https://www.consumerreports.org/cars/tires/how-long-do-tires-last-consumer-reports-treadwear-testing-a5353952733

### Tire manufacturers
- S35 Michelin, Load Rating & Speed Rating — https://www.michelinman.com/auto/auto-tips-and-advice/tires-101/tire-load-rating-speed-rating
- S36 Michelin, Tire Markings Explained — https://www.michelinman.com/auto/auto-tips-and-advice/tires-101/tire-markings-explained
- S37 Michelin, Sidewall Bulge or Bubble — https://www.michelinman.com/auto/auto-tips-and-advice/tire-damage/sidewall-problems/symptom-bulge-or-bubble
- S38 Michelin, Tread Problems — https://www.michelinman.com/auto/auto-tips-and-advice/tire-damage/tread-problems
- S39 Michelin, Tire Damage Guide — https://www.michelinman.com/auto/auto-tips-and-advice/tire-damage
- S40 Michelin, Mixing Tires / AWD — https://www.michelinman.com/auto/auto-tips-and-advice/tire-buying-guide/mixing-tire-brands
- S41 Michelin, When to Replace Tires — https://www.michelinman.com/auto/auto-tips-and-advice/tire-buying-guide/when-do-i-need-new-tires
- S42 Michelin, Changing Tire Sizes — https://www.michelinman.com/auto/auto-tips-and-advice/tire-buying-guide/change-size-spec
- S43 Michelin, Storing Tires — https://www.michelinman.com/auto/auto-tips-and-advice/tire-maintenance/storing-my-tires
- S44 Michelin, Summer vs Winter vs All-Season — https://www.michelinman.com/auto/auto-tips-and-advice/tire-buying-guide/summer-winter-all-season-tires
- S45 Michelin, Car Handling Problems — https://www.michelinman.com/auto/auto-tips-and-advice/tire-damage/car-handling-problems
- S46 Bridgestone Americas, Replacement Guidance — https://www.bridgestoneamericas.com/en/company/safety/choosing-tires/replacement-guidance
- S47 Bridgestone Americas, Tire Inspection — https://www.bridgestoneamericas.com/en/company/safety/maintaining-tires/tire-inspection
- S48 Bridgestone, Tire Rotation — https://tires.bridgestone.com/en-us/learn/automotive/tire-maintenance/tire-rotation
- S49 Bridgestone, Tire Tread Patterns — https://tires.bridgestone.com/en-us/learn/automotive/shopping-for-tires/tire-tread-patterns
- S50 Bridgestone, DriveGuard Run-Flat — https://tires.bridgestone.com/en-us/automotive/tire-brand/driveguard
- S51 Bridgestone, How Long Do Tires Last — https://tires.bridgestone.com/en-us/learn/tire-maintenance/how-long-a-tire-lasts
- S52 Goodyear, Tire Date Code — https://www.goodyear.com/en-us/learn/tire-date-code
- S53 Goodyear, Hydroplaning — https://www.goodyear.com/en_US/learn/tire-basics/hydroplaning.html
- S54 Goodyear, Tire Load Index & Chart — https://www.goodyear.com/en_US/learn/tire-basics/tire-load-index.html
- S55 Goodyear, UTQG — https://www.goodyear.com/en_US/learn/tire-basics/utqg-rating.html
- S56 Continental, Electric Vehicle Tires — https://www.continental-tires.com/tire-knowledge/electric-vehicle-tires/
- S57 Hankook, EV vs Regular Tires — https://www.hankooktire.com/us/en/help-support/driving-tips/ev-driving/tire-comparison.html
- S58 General Tire, What Is a DOT Serial Number — https://generaltire.com/talk-shop/what-dot-serial-number-and-where-it
- S59 Continental, How to Check Tire Pressure — https://continentaltire.com/learn/how-do-i-check-my-tire-pressure
- S60 Cooper Tire Service Bulletin #108, Puncture Repair Procedures — https://www.coopertire.com/on/demandware.static/-/Sites-CooperTire-Library/default/dw3452855a/pdfs/Service_Bulletin_108_0914.pdf
- S61 Mickey Thompson Tech Bulletin, Tires Affected by Flood Waters — https://www.mickeythompsontires.com/tech-bulletins/tires-and-tubes-affected-by-flood-waters
- S63 Yokohama, UTQG — https://www.yokohamatire.com/tires-101/how-to-read-a-sidewall-1/utqg (UTQG grade thresholds for D10, to cross-check against S9)

### Competitor / retailer pages (gap analysis only; never cited on the site)
> Justin's rule, 2026-10-02: resources only. These pages are reading for gap analysis, not citations. The demo source IDs C2, C3, C5, C11 and C14 in `src/components/demos/sources.js` now point at Bridgestone (tire inflation), AAA (worn tires), Goodyear (tire rotation), Bridgestone (penny test) and BFGoodrich (changing tire size) instead of the URLs below.
- C2 Tire Rack, Temperature and Tire Pressure — https://www.tirerack.com/upgrade-garage/how-does-temperature-change-affect-tire-air-pressure
- C3 Tire Rack, How Much Tread Depth Is Enough — https://www.tirerack.com/upgrade-garage/how-much-tread-depth-is-enough
- C4 Tire Rack, Do All 4 Tires Need to Match on AWD/4WD — https://www.tirerack.com/upgrade-garage/do-all-4-tires-need-to-match-on-an-allwheel-drive-or-fourwheel-drive-vehicle
- C5 Tire Rack, Best Way to Rotate Tires — https://www.tirerack.com/upgrade-garage/what-is-the-best-way-to-rotate-tires
- C6 Tire Rack, Properly Torque Lug Nuts — https://www.tirerack.com/upgrade-garage/how-do-i-properly-torque-my-wheel-lug-nuts-or-bolts
- C7 Tire Rack, Three-Peak Mountain Snowflake — https://www.tirerack.com/upgrade-garage/what-is-the-threepeak-mountain-snowflake-symbol
- C8 Tire Rack, UTQG Standards — https://www.tirerack.com/upgrade-garage/what-are-the-uniform-tire-quality-grade-utqg-standards
- C9 Tire Rack, Tire Categories — https://www.tirerack.com/tires/types
- C10 Tire Rack, How Long Do Tires Last — https://www.tirerack.com/upgrade-garage/how-long-do-tires-last
- C11 Tire Rack, Tread Depth of a Tire — https://www.tirerack.com/upgrade-garage/what-is-the-tread-depth-of-a-tire
- C1 Tire Rack, Determine the Age of My Tires — https://www.tirerack.com/upgrade-garage/how-do-i-determine-the-age-of-my-tires
- C12 Discount Tire, Air Pressure & Temperature — https://www.discounttire.com/learn/air-pressure-temperature-flux
- C13 Discount Tire, Hydroplaning — https://www.discounttire.com/learn/hydroplaning
- C14 Discount Tire, Speedometer Accuracy — https://www.discounttire.com/learn/speedometer-accuracy
- C15 Discount Tire, Tire Wear Patterns — https://www.discounttire.com/learn/tire-wear-patterns
- C16 Discount Tire, Tire Repair — https://www.discounttire.com/learn/tire-repair
- C17 Discount Tire, Tire Types — https://www.discounttire.com/learn/tire-types
- C18 Discount Tire, Check Tire Size — https://www.discounttire.com/learn/check-tire-size
- C19 Discount Tire, Mountain Snowflake Symbol — https://www.discounttire.com/learn/mountain-snowflake-symbol
- C20 Discount Tire, Check Tire Pressure — https://www.discounttire.com/learn/check-tire-pressure
- C22 Discount Tire, Tire Construction — https://www.discounttire.com/learn/tire-construction
- C23 AAA, Tire Plug vs Patch — https://www.aaa.com/autorepair/articles/tire-plug-vs-patch-get-the-right-tire-repair
- C26 Tire Review, Solid vs Flashing TPMS (ATEQ) — https://www.tirereview.com/solid-flashing-tpms-light-ateq-tpms-tools/
- C27 Tire Review, Quarter Test — https://www.tirereview.com/quarter-tire-test-tread-depth/
- C28 Tire Review, Install Two New Tires on the Rear Axle — https://www.tirereview.com/always-install-two-new-tires-on-the-rear-axle/

### Open verification items before Phase 2 drafting
1. Florida numeric tread minimum: read § 316.610 and FAC 14-61.0019 in full (G29, G11).
2. The year Florida ended its safety inspection (1981, per secondary sources) (G29).
3. The NHTSA Sun Belt aging findings: use the nhtsa.gov original and exact wording (G27, G47).
4. The CR wet-braking figure (about 30 ft) and its test conditions (G11, G26, D9).
5. The NHTSA pre-crash "3× when underinflated by more than 25%" figure (G15).
6. UTQG traction and temperature thresholds on eCFR (D10).
7. An ST trailer-tire source from a maker or USTMA, and whether TireDrop sells ST sizes (G37).
8. A primary wheel-fitment standard source (G41).
9. The TIA "wheel-off / torque" statistic (G45).
10. Business facts: TIN registration at install (G50), and the `/tools/*` vs `/tire-*` routes plus the `/tire-care` redirect (§0.2).
