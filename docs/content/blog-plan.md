# TireDrop Blog: Phase 1 plan (keyword research + 50-post plan + calendar)

Prepared 29 September 2026 for Justin's Phase 1 approval (see `docs/prompts/blog-learn-build.md`).
Planning only: no code, no copy. Byline for every post: "TireDrop Team, Extreme Tires, Sunrise FL".

**How to read this plan**
- Part 1 covers research notes and demand, by cluster.
- Part 2 is the index of all 50 posts.
- Part 3 gives the details for each post.
- Part 4 is the publishing calendar.
- Part 5 lists the risks.
- Part 6 lists the sources.

**Publishing status (updated 2 October 2026)**

| Status | Posts | Count |
|---|---|---|
| Live: Batch 1 | #1–#10 | 10 |
| Live: Batch 2 | #16, #17, #22, #24, #25, plus two off-plan posts (`how-old-are-tires-bought-online`, `get-tires-installed-after-buying-online`) | 5 planned + 2 |
| Live: Batch 3 | #13, #14, #18, #21, #23, #26, #27, #28, #29, #36 | 10 |
| Batch 4, on `preview/blog-batch-4` (ships with the next release) | #11, #33, #34, #35, #38, #44, #45, #47, #48, #50 | 10 |
| On hold | #15 (waiting on the accountant's answer about the Florida tire fee and sales tax); #49 (waiting on Justin: does Extreme Tires sell used tires?) | 2 |
| Not yet written | #12, #19, #20, #30, #31, #32, #37, #39, #40, #41, #42, #43, #46 | 13 |

- **How Batch 3 was chosen.** Highest search intent first: every unpublished "Commercial investigation" post with High demand, then the "Informational / commercial" posts. Two High-demand vehicle guides, #35 Civic and #45 Wrangler, moved to Batch 4. That keeps it to four vehicle guides per batch, because of the near-duplicate risk in Part 5. #49 (used tires) waits until Justin confirms whether Extreme Tires sells used tires, as its Risk note requires.
- **How Batch 4 was chosen.** The same rule. First the "Commercial investigation" posts: #35 Civic and #45 Wrangler (High), then #44 Silverado towing and #48 low rolling resistance (Med), and #38 small fleet (Commercial). Then the "Informational / commercial" posts, #50 and #47. Then the informational posts by demand: #34 (High) and #33 (Med–High). Three vehicle guides, under the cap of four.
  - **#37 (Tesla Model 3 flat) was skipped on purpose.** The Learn guide `/learn/tesla/tesla-flat-tire-no-spare` already targets "tesla flat tire", so a blog post on the same query would compete with it (Part 5's near-duplicate risk). Rework #37 with a distinct angle, or drop it.
  - **#11 (Thanksgiving) took the last slot** because it is the only remaining post with a hard date (publish by Mon 9 Nov). Update it with AAA's 2026 forecast when that comes out in November; it quotes AAA's 2025 figures, labeled as 2025.
  - **New allowlisted makers.** `chevrolet.com` (Silverado manual and trailering guide) and `mopar.com` (Jeep owner's manuals and Mopar's tire guide) join the resource list in `src/lib/competitors.js`.
- **Remaining.** 15 posts are left: 13 unwritten plus #15 and #49 on hold. That is 2 more batches of up to 10, the second one small. Watch for Learn overlap before writing #20 (TPMS vs gauge), #31 (cold-front TPMS), #32 (registration and recalls, close to `/learn/age/tire-recalls-registration`) and #41/#42 (close to `/learn/florida/florida-heat-tires`).
- **Dates.** Batch 3 and Batch 4 posts are dated 2 October 2026, as Batch 2 was, instead of the calendar's 19 and 26 October.

---

## 0. Research method and what was blocked

- **WebSearch worked.** Every fact below was read from search-result text that quotes the source.
- **WebFetch was blocked by the egress proxy (EGRESS_BLOCKED) for every primary source tried:**
  - nhtsa.gov
  - ustires.org
  - newsroom.aaa.com
  - noaa.gov
  - flhsmv.gov
  - ops.fhwa.dot.gov
  - flsenate.gov
  - floridadisaster.org
  - tesla.com
- **What this means for Phase 3.** Each number in this plan is "search-verified," not "page-verified." The Phase 3 fact-check must open each primary URL, either through Justin's Chrome or once the proxy allows it, and quote it before publishing.
- **Demand ratings are qualitative (High / Med / Low).** No keyword tool was available, and no volumes were invented. Each rating is based on:
  - how broad the query family is: national evergreen, seasonal-regional or hyper-local
  - how crowded the search results are
  - how often the phrasing appears in "People also ask"-style results
- **Recommended check before Phase 3.** Add a Chrome prompt for Justin to pull Google Keyword Planner and Search Console figures for the 50 primary keywords.
- **Learn hub names are placeholders.** The /learn plan is still in progress, so the posts link to these assumed hubs. Remap them when the Learn plan lands.

| Code | Assumed Learn hub | Main keywords the Learn hub owns (blog must NOT target these head terms) |
|---|---|---|
| L-Size | Tire Sizes & Specs | how to read tire size, load index chart, speed rating chart, UTQG explained |
| L-Tread | Tread & Wear | how to check tread depth, penny test, tread wear patterns |
| L-Press | Pressure & TPMS | recommended tire pressure, TPMS light meaning, how to check tire pressure |
| L-Age | Tire Age & DOT Codes | how to read DOT code, how old are my tires, tire expiration |
| L-Rot | Rotation, Balance & Alignment | tire rotation pattern, balancing vs alignment |
| L-Flat | Flats, Repairs & Spares | plug vs patch, spare tire types, run-flat tires |
| L-Fit | Buying & Fitment | matching tires on AWD, plus sizing, staggered fitment |
| L-EV | EV Tires | EV tires explained, EV vs regular tires |
| L-Truck | Truck, SUV & LT Tires | LT vs P-metric, load range explained, all-terrain vs highway |
| L-Wx | Weather & Traction | what is hydroplaning, all-season vs summer |
| L-Svc | Installation & Service | what happens at a tire install, TPMS service |

**Shop pages used in the plan:**
- Main pages:
  - `/tires`
  - `/install`
  - `/mobile-service`
- Existing routes (also used):
  - `/locations`
  - `/commercial-tires`
  - `/compare`
  - `/find-my-tires`
  - `/tire-size` (the live size decoder)
  - `/tire-check`
- **Demo tools**, listed as `/tools/*`. Where a live route already exists, point the `/tools/` path at it or redirect it:
  - `/tools/tread-gauge`
  - `/tools/dot-date-reader`
  - `/tools/pressure-temperature`
  - `/tools/rotation`
  - `/tools/hydroplaning`
  - `/tools/size-decoder`, which equals `/tire-size`
  - `/tools/plus-size`
  - `/tools/wear-patterns`

---

## 1. Keyword research: clusters and demand

| Cluster | Representative queries (primary / long-tail) | Demand | Seasonality (Florida) | Notes and opportunity |
|---|---|---|---|---|
| Hurricane prep & flood | hurricane car prep checklist; flooded car what to do; can a car be saved after flood; evacuation car checklist | Med (spikes to High when a storm threatens) | Jun 1–Nov 30; spikes with named storms | Official pages (NHTSA, FDEM) rank alongside insurer and law-firm posts. Few pages talk about tires specifically, which gives the blog a gap to fill. NOAA's 2026 outlook is below-normal, so don't lean on "active season" framing. |
| King tides / salt water | king tides Fort Lauderdale; driving through salt water car; saltwater flooding car damage | Med (local, event-driven) | Late Sep–Nov king tides | Very timely: A1A in Fort Lauderdale was closed during the 28–30 Sep 2026 king tides. The top results are news stories, so a practical how-to page has room to rank. |
| Rain & hydroplaning | hydroplaning; how to avoid hydroplaning; worn tires in rain; 4/32 tread | High (national) | Rainy season May 15–Oct 15 (NWS Miami) | Learn owns "what is hydroplaning," so the blog takes the local-storm and replacement-threshold angles instead. |
| Heat & pressure | tire pressure in hot weather; let air out of tires in heat; tire blowout summer | Med–High | Apr–Oct | Pair with the pressure-vs-temperature demo. Refresh before USTMA National Tire Safety Week (late May). |
| Cold fronts & TPMS | tire pressure light on cold morning; TPMS light cold weather | High nationally, Med in Florida | Dec–Feb fronts | Florida drivers are surprised when the light comes on after a front, which makes it a good local hook. |
| Holiday travel | road trip tire check; Thanksgiving travel car prep; Florida Turnpike service plazas; Alligator Alley gas | Med (Thanksgiving/Dec peaks); Low for route-specific terms | Nov–Jan | AAA's record travel forecasts come out each November. The route-specific terms are low-volume but convert, and few pages compete for them. |
| Local buying & service | tire installation near me Sunrise; mobile tire installation Broward; where to install tires bought online; mobile tire service Fort Lauderdale | Med (local, high intent) | Year-round | Risk of cannibalizing `/install` and `/mobile-service`, so the blog targets question-style long-tail terms only. |
| Buying & price | buy tires online vs local; tire installation cost; what's included in tire installation; why are some tires more expensive; which tire brand is best; best time to buy tires | High | Year-round; "best time" peaks Sep–Nov and Mar–May | ⚠ The "best time to buy" results are packed with rebate and sale content. Our angle must be about timing tire condition against the Florida seasons, never about sales. |
| Myths | nitrogen in tires worth it; do I need to replace all 4 tires; new tires front or back; inflate to max psi; do tires expire if not used; is tire rotation necessary | High (national evergreen) | Year-round | Evergreen links from the myth posts feed the Learn hubs and pull traffic from outside Florida, which suits free shipping to the 48 states + DC. |
| Vehicle-specific | best tires for Tesla Model Y; RAV4 tires; Camry tires; CR-V tires; Civic tires; F-150 tires; Silverado tires towing; Jeep Wrangler tires | High ("best tires for X" is among the biggest query families) | Year-round | Edmunds' 2025 ranking of Florida sales (search result) puts F-Series, RAV4, Model Y, CR-V and Camry in Florida's top five. Write neutral "how to choose" guides with no rankings, and give each one a different angle to avoid near-duplicate template pages. |
| EV / LT / rideshare / fleet | do EV tires wear faster; LT vs P tires F-150; tires for Uber drivers; fleet tire management; low rolling resistance tires | Med | Year-round | Rideshare and fleet readers have high commercial value and link to `/commercial-tires`. |
| Life events (local) | moving to Florida car; snowbird car storage; back-to-school car checklist; used tires near me | Med ("used tires near me" is High and local) | Snowbirds Oct–Apr; school early Aug | These have strong local fit and little competition from tire retailers. |

---

## 2. Post index (50 posts)

Categories (counts match the table below; total 50):
- **HUR**: Hurricane, flood and salt water (5 posts: #1, #2, #3, #4, #21)
- **WX**: Rain, heat, cold and climate (7: #5, #10, #13, #31, #41, #42, #43)
- **TRV**: Travel and roadside (6: #11, #12, #19, #30, #39, #40)
- **LOC**: Local buying and service (4: #6, #7, #47, #49)
- **BUY**: Buying and price (6: #8, #14, #15, #22, #23, #32)
- **MYTH**: Myth-busting (8: #16, #17, #20, #24, #25, #33, #34, #46)
- **VEH**: Vehicle-specific (9: #9, #18, #26, #27, #35, #36, #37, #44, #45)
- **SEG**: EV, truck, rideshare and fleet (5: #28, #29, #38, #48, #50)

| # | Slug (/blog/…) | Working title (≤60) | Cat | Demand | Batch | Words |
|---|---|---|---|---|---|---|
| 1 | hurricane-season-tire-check | Hurricane Season Tire Check for South Florida Drivers | HUR | Med | 1 | 1,200 |
| 2 | king-tide-salt-water-wheels | King Tides and Salt Water: What It Does to Wheels | HUR | Med | 1 | 1,000 |
| 3 | flooded-car-tires-wheels | Car Sat in Floodwater? What to Check on Tires and Wheels | HUR | Med | 1 | 1,100 |
| 4 | storm-cleanup-nail-in-tire | Storm Cleanup Nails: Puncture Season After a Storm | HUR | Med | 1 | 900 |
| 5 | hydroplaning-broward-downpours | Afternoon Downpours: Hydroplaning on Broward Roads | WX | High | 1 | 1,200 |
| 6 | bought-tires-online-install-broward | Bought Tires Online? Getting Them Installed in Broward | LOC | Med | 1 | 1,000 |
| 7 | mobile-tire-install-condo-office | Mobile Tire Install at a Condo or Office: What to Know | LOC | Low–Med | 1 | 900 |
| 8 | buy-tires-online-vs-local-shop | Buying Tires Online vs a Local Shop: Honest Trade-offs | BUY | High | 1 | 1,400 |
| 9 | tesla-model-y-tires-guide | Choosing Tires for a Tesla Model Y: A Neutral Guide | VEH | High | 1 | 1,500 |
| 10 | snowbird-car-sat-all-summer-tires | Car Sat All Summer? Tire Checks for Returning Snowbirds | WX | Med | 1 | 1,000 |
| 11 | thanksgiving-road-trip-tire-check | Thanksgiving Drive? A Tire Check Before You Leave | TRV | Med | 2 | 1,000 |
| 12 | flat-tire-on-i-95 | Flat Tire on I-95? What to Do and Who to Call | TRV | Med | 2 | 1,000 |
| 13 | worn-tires-florida-rain-4-32 | Why 4/32 Matters More Than 2/32 in Florida Rain | WX | Med–High | 2 | 1,100 |
| 14 | best-time-to-buy-tires-south-florida | Best Time to Buy Tires in South Florida, by Season | BUY | High | 2 | 1,100 |
| 15 | installed-tire-price-explained | What an Installed Tire Price Includes (and Doesn't) | BUY | High | 2 | 1,200 |
| 16 | nitrogen-in-tires-myth | Nitrogen in Tires: What the Tests Actually Showed | MYTH | High | 2 | 1,100 |
| 17 | sidewall-max-psi-myth | Inflate to the Sidewall Number? Here's Why Not | MYTH | High | 2 | 900 |
| 18 | toyota-rav4-tires-guide | Choosing Tires for a Toyota RAV4: Sizes, AWD, Rain | VEH | High | 2 | 1,400 |
| 19 | turnpike-orlando-drive-tires | Driving the Turnpike to Orlando: Tire Prep and Stops | TRV | Low–Med | 2 | 900 |
| 20 | tpms-still-need-tire-gauge | My Car Has TPMS. Do I Still Need a Tire Gauge? | MYTH | Med | 2 | 900 |
| 21 | used-car-after-storm-season-tires | Buying a Used Car After Storm Season: Tire Clues | HUR | Med | 3 | 1,100 |
| 22 | same-size-tires-different-prices | Why Same-Size Tires Cost Different Amounts | BUY | Med–High | 3 | 1,200 |
| 23 | choosing-between-tire-brands | Choosing Between Tire Brands Without the Hype | BUY | High | 3 | 1,400 |
| 24 | replace-all-four-tires-myth | Do You Really Need to Replace All Four Tires? | MYTH | High | 3 | 1,100 |
| 25 | new-tires-front-or-back | New Tires on the Front or the Back? The Real Answer | MYTH | High | 3 | 900 |
| 26 | toyota-camry-tires-guide | Choosing Tires for a Toyota Camry: What Matters | VEH | High | 3 | 1,300 |
| 27 | ford-f-150-tires-p-vs-lt | Ford F-150 Tires: P-Metric, LT and Load Range Basics | VEH | High | 3 | 1,500 |
| 28 | ev-tire-wear-budget | EV Tires Wear Faster: How to Budget and Stretch Them | SEG | Med–High | 3 | 1,200 |
| 29 | rideshare-driver-tires | Tires for Uber and Lyft Drivers: The Mileage Math | SEG | Med | 3 | 1,200 |
| 30 | alligator-alley-drive-tires | Crossing Alligator Alley: Tires, Spare and Fuel Plan | TRV | Low | 3 | 900 |
| 31 | cold-front-tpms-light-florida | Why Your TPMS Light Comes On After a Florida Cold Front | WX | Med | 4 | 900 |
| 32 | tire-registration-recalls | Registered Your New Tires? How Recalls Reach You | BUY | Med | 4 | 1,000 |
| 33 | unused-tires-still-age-myth | Unused Tires Still Age: The Garage and Spare Myth | MYTH | Med–High | 4 | 1,000 |
| 34 | tire-rotation-upsell-myth | Is Tire Rotation Just an Upsell? What Manuals Say | MYTH | High | 4 | 1,000 |
| 35 | honda-civic-tires-guide | Choosing Tires for a Honda Civic in South Florida | VEH | High | 4 | 1,300 |
| 36 | honda-cr-v-tires-guide | Honda CR-V Tires: AWD Matching and Rain Grip | VEH | High | 4 | 1,300 |
| 37 | tesla-model-3-flat-foam-tires | Tesla Model 3 Flat: Foam Tires, No Spare, What Now | VEH | Med–High | 4 | 1,100 |
| 38 | small-fleet-tire-checklist | Small Fleet Tire Checklist for South Florida Businesses | SEG | Med | 4 | 1,300 |
| 39 | moving-to-florida-tire-tips | Moving to Florida? Tire Tips for New Residents | TRV | Med | 4 | 900 |
| 40 | glovebox-tire-kit-florida | A Glovebox Tire Kit for Florida Storms and Road Trips | TRV | Med | 4 | 900 |
| 41 | florida-sun-dry-rot-tires | Sun, Heat and Dry Rot: How Florida Ages Your Tires | WX | Med–High | 5 | 1,100 |
| 42 | florida-heat-tire-pressure | Florida Heat and Tire Pressure: A Monthly Routine | WX | Med–High | 5 | 1,000 |
| 43 | back-to-school-car-check-broward | Back-to-School Car Check for Broward Families | WX | Med | 5 | 900 |
| 44 | silverado-boat-towing-tires | Silverado 1500 Tires for Towing a Boat in Florida | VEH | Med | 5 | 1,400 |
| 45 | jeep-wrangler-tires-guide | Jeep Wrangler Tires for Street, Sand and Rain | VEH | High | 5 | 1,400 |
| 46 | bigger-wheels-myth | Do Bigger Wheels Always Handle Better? Not Quite | MYTH | Med | 5 | 1,000 |
| 47 | curb-pothole-tire-alignment-signs | Hit a Curb or Pothole? Tire and Alignment Signs | LOC | Med | 5 | 900 |
| 48 | low-rolling-resistance-hybrids | Low Rolling Resistance Tires: Worth It for Hybrids? | SEG | Med | 5 | 1,100 |
| 49 | used-tires-what-to-check | Used Tires: What to Check Before You Buy One | LOC | High (local) | 5 | 1,000 |
| 50 | new-car-tires-wear-out-early | Why New-Car Tires Sometimes Wear Out Early | SEG | Med–High | 5 | 1,000 |

---

## 3. Post details

Legend for each post:
- **KW**: the primary keyword, then secondary keywords
- **Intent**: the search intent
- **Timing**: when to publish
- **Local**: the local angle
- **Links**: the Learn hub(s) and shop pages the post links to
- **Demo**: the interactive demo, if one fits
- **Sources**: 2–3 authoritative sources
- **Risk**: the house-rules risk note
- **Guard**: how the post avoids the Learn hub's head term

### Batch 1

**1. Hurricane Season Tire Check for South Florida Drivers**
`/blog/hurricane-season-tire-check`
- **KW:**
  - Primary: hurricane car prep checklist
  - Secondary: evacuation car checklist; check tires before hurricane; spare tire hurricane
- **Intent:** Informational, preparation.
- **Timing:** Batch 1 (early Oct 2026). Hurricane season runs through Nov 30. Re-promote in mid-May 2027 before the June 1 start.
- **Local:**
  - Broward evacuation routes: I-95, the Turnpike and I-75.
  - FDEM "Know Your Zone."
  - FDEM's advice to keep at least half a tank or half a charge.
- **Links:**
  - Learn: L-Press, L-Flat, L-Tread
  - Shop: `/tires`, `/mobile-service`, `/tools/tread-gauge`
- **Demo:** Tread gauge.
- **Sources:**
  - [FDEM Plan & Prepare](https://www.floridadisaster.org/PlanPrepare)
  - [FDEM Know Your Zone](https://www.floridadisaster.org/knowyourzone/)
  - [NHTSA TireWise](https://www.nhtsa.gov/vehicle-safety/tires)
- **Risk:**
  - Don't imply any tire condition is "safe to evacuate on."
  - Don't promise mobile-service availability before or after storms, and don't give any timing.
  - Don't frame 2026 as a quiet season, even though NOAA forecast below-normal.
- **Guard:** No "how to check tire pressure" how-to. Link to L-Press for that.

**2. King Tides and Salt Water: What It Does to Wheels**
`/blog/king-tide-salt-water-wheels`
- **KW:**
  - Primary: driving through salt water car
  - Secondary: king tides Fort Lauderdale car; saltwater flooding car damage; rinse car after salt water
- **Intent:** Informational, timely.
- **Timing:** Batch 1. Tie it to the late-Sep 2026 king tides and the further king tides NOAA predicts for Oct–Nov. Refresh it each September.
- **Local:**
  - Sunny-day flooding on A1A and Las Olas-area streets.
  - The Port Everglades tide gauge.
- **Links:**
  - Learn: L-Svc (TPMS service), L-Rot
  - Shop: `/mobile-service`, `/install`
- **Demo:** None.
- **Sources:**
  - [NOAA High Tide Flooding outlook](https://tidesandcurrents.noaa.gov/high-tide-flooding/annual-outlook.html)
  - [NOAA monthly HTF outlook](https://tidesandcurrents.noaa.gov/high-tide-flooding/monthly-outlook.html)
  - [NHTSA flood-damaged vehicles](https://www.nhtsa.gov/hurricane-and-flood-damaged-vehicles)
- **Risk:**
  - Don't quote named officials from news coverage (no personal names).
  - Keep any corrosion claims general, or source them to NHTSA or the vehicle manufacturer.
  - Don't claim what salt water does to specific parts unless it is sourced.
- **Guard:** This post covers salt-water driving. Post #3 covers a car that sat in floodwater, so keep the two distinct.

**3. Car Sat in Floodwater? What to Check on Tires and Wheels**
`/blog/flooded-car-tires-wheels`
- **KW:**
  - Primary: flooded car what to do
  - Secondary: flood damaged car tires; brakes after flood; EV flooded battery
- **Intent:** Informational, after a storm.
- **Timing:** Batch 1. Re-promote after any storm or flood event.
- **Local:** South Florida street flooding. Include NHTSA's warning about parking flooded EVs near homes.
- **Links:**
  - Learn: L-Tread, L-Flat, L-EV
  - Shop: `/mobile-service`, `/install`, `/tires`
- **Demo:** None.
- **Sources:**
  - [NHTSA flood-damaged vehicles](https://www.nhtsa.gov/hurricane-and-flood-damaged-vehicles)
  - [NHTSA TireWise](https://www.nhtsa.gov/vehicle-safety/tires)
  - [USTMA Tire Care Essentials](https://www.ustires.org/tire-care-essentials)
- **Risk:**
  - The post must defer to NHTSA ("tow, don't drive") and to professional inspection.
  - Never say the tires "are fine" or "safe."
  - Quote the EV fire guidance exactly as NHTSA gives it.
  - No insurance advice.
- **Guard:** None needed. Learn has no flood topic.

**4. Storm Cleanup Nails: Puncture Season After a Storm**
`/blog/storm-cleanup-nail-in-tire`
- **KW:**
  - Primary: nail in tire
  - Secondary: can a nail in tire be repaired; roofing nail in tire; tire puncture near sidewall
- **Intent:** Informational, leading to a transactional next step.
- **Timing:** Batch 1. Re-promote after storms and during roofing season.
- **Local:** Post-storm debris and roof repairs across Broward neighborhoods.
- **Links:**
  - Learn: L-Flat (plug vs patch)
  - Shop: `/mobile-service`, `/install`, `/tires`
- **Demo:** None. Optionally reuse the L-Flat repair-zone diagram.
- **Sources:**
  - [TIA tire repair](https://www.tireindustry.org/resources/consumer-education/consumer-safety-overview/tire-repair/)
  - [USTMA tire repair basics](https://www.ustires.org/tire-care-safety/tire-repair-basics)
  - [AAA plug vs patch](https://www.aaa.com/autorepair/articles/tire-plug-vs-patch-get-the-right-tire-repair)
- **Risk:**
  - Describe TIA/USTMA repair limits (¼-inch puncture limit, tread area only). Never say a repaired tire is "safe" or "as good as new."
  - "What we see in the shop" content must stay general, with no anecdotes.
- **Guard:** Don't target "plug vs patch." Link to L-Flat instead.

**5. Afternoon Downpours: Hydroplaning on Broward Roads**
`/blog/hydroplaning-broward-downpours`
- **KW:**
  - Primary: how to avoid hydroplaning
  - Secondary: hydroplaning Florida rain; what to do if you hydroplane; standing water I-595
- **Intent:** Informational.
- **Timing:** Batch 1 (the rainy season ends Oct 15). Refresh and re-promote around May 1, 2027, before the May 15 start.
- **Local:**
  - NWS Miami rainy season dates.
  - Afternoon thunderstorms.
  - Ponding on I-95, I-595 and Sawgrass Expressway ramps. Keep this general, with no crash anecdotes.
- **Links:**
  - Learn: L-Wx, L-Tread
  - Shop: `/tires`, `/tools/hydroplaning`
- **Demo:** Hydroplaning explainer.
- **Sources:**
  - [NWS Miami rainy season](https://www.weather.gov/media/mfl/news/RainySeasonOutlook2025.pdf)
  - [FHWA weather impacts](https://ops.fhwa.dot.gov/weather/q1_roadimpact.htm)
  - [AAA worn tires study](https://newsroom.aaa.com/2018/06/tread-lightly-worn-tires-drivers-risk/)
- **Risk:**
  - FHWA crash shares must carry their data years. Search snippets vary between 73% and 75% of weather crashes, so quote the page exactly.
  - Don't cite the "35 mph / 1/10 inch" hydroplaning figures, which came from non-authoritative sites.
- **Guard:** Don't target "what is hydroplaning." Link to L-Wx for the physics.

**6. Bought Tires Online? Getting Them Installed in Broward**
`/blog/bought-tires-online-install-broward`
- **KW:**
  - Primary: where to get tires installed after buying online
  - Secondary: ship tires to installer; tire installation Sunrise FL; install tires bought online near me
- **Intent:** Commercial / navigational.
- **Timing:** Batch 1. Evergreen.
- **Local:**
  - The ship-to-store option at 7712 W Oakland Park Blvd, Sunrise.
  - The service area: Sunrise, Plantation, Fort Lauderdale, Davie and nearby.
- **Links:**
  - Learn: L-Svc, L-Age (check the DOT date at install)
  - Shop: `/install`, `/locations`, `/tires`, `/mobile-service`
- **Demo:** DOT date reader.
- **Sources:**
  - [USTMA replacing tires](https://www.ustires.org/tire-care-safety/replacing-tires)
  - [NHTSA recalls](https://www.nhtsa.gov/recalls) (tire registration)
  - [TIA tire replacement](https://www.tireindustry.org/resources/consumer-education/consumer-safety-overview/tire-replacement/)
- **Risk:**
  - No delivery or arrival dates, and no "same day."
  - Free shipping covers the 48 contiguous states + DC. Installation is South Florida only.
  - Cannibalization risk with `/install`: the post targets the question form only and links to `/install` as the canonical service page.
- **Guard:** Not the L-Svc "what happens at install" topic. This post is about the logistics of buying online and installing locally.

**7. Mobile Tire Install at a Condo or Office: What to Know**
`/blog/mobile-tire-install-condo-office`
- **KW:**
  - Primary: mobile tire installation at home
  - Secondary: mobile tire service Fort Lauderdale; tire installation at work; condo parking tire change rules
- **Intent:** Commercial.
- **Timing:** Batch 1. Evergreen.
- **Local:**
  - Broward condo and HOA garages.
  - Office parks along Sawgrass and Oakland Park.
  - What the reader needs: space, a level surface and access.
- **Links:**
  - Learn: L-Svc
  - Shop: `/mobile-service`, `/tires`
- **Demo:** None.
- **Sources:**
  - [NHTSA TPMS rule (FMVSS 138)](https://www.nhtsa.gov/sites/nhtsa.gov/files/fmvss/TPMSfinalrule_6.pdf)
  - [USTMA Tire Care Essentials](https://www.ustires.org/tire-care-essentials)
  - [TIA tire replacement](https://www.tireindustry.org/resources/consumer-education/consumer-safety-overview/tire-replacement/)
- **Risk:**
  - No arrival windows or times.
  - Don't state HOA rules as fact. Say "check your association's rules."
  - Cannibalization with `/mobile-service`: target the long-tail "condo/office" terms only.
  - No invented customer stories.
- **Guard:** None needed.

**8. Buying Tires Online vs a Local Shop: Honest Trade-offs**
`/blog/buy-tires-online-vs-local-shop`
- **KW:**
  - Primary: buy tires online vs local shop
  - Secondary: is it cheaper to buy tires online; buy tires online and have them installed; online tire store free shipping
- **Intent:** Commercial investigation.
- **Timing:** Batch 1. Evergreen.
- **Local:** A hybrid model: order online and install in Sunrise or by mobile service in South Florida.
- **Links:**
  - Learn: L-Fit, L-Svc
  - Shop: `/tires`, `/install`, `/compare`
- **Demo:** Size decoder.
- **Sources:**
  - [NHTSA UTQG consumer guide](https://www.nhtsa.gov/sites/nhtsa.gov/files/documents/2015uniformtirequalitygrading.pdf)
  - [FL DOR new-tire fee](https://floridarevenue.com/taxes/taxesfees/Pages/solid_waste.aspx)
  - [NHTSA recalls](https://www.nhtsa.gov/recalls)
- **Risk:**
  - No "cheaper" claims without a sourced comparison.
  - No competitor disparagement.
  - No deals.
  - Don't state shipping speed.
- **Guard:** None needed.

**9. Choosing Tires for a Tesla Model Y: A Neutral Guide**
`/blog/tesla-model-y-tires-guide`
- **KW:**
  - Primary: best tires for Tesla Model Y (answered neutrally, not as a ranking)
  - Secondary: Model Y tire size; Model Y replacement tires; Model Y tire rotation
- **Intent:** Commercial investigation.
- **Timing:** Batch 1. Evergreen. The Model Y is in Florida's 2025 top five (Edmunds, via search).
- **Local:** Florida rain, heat, and highway miles on the Turnpike and I-95.
- **Links:**
  - Learn: L-EV, L-Size, L-Rot
  - Shop: `/tires` (Model Y fitment), `/find-my-tires`, `/tools/rotation`
- **Demo:** Rotation animator.
- **Sources:**
  - [Tesla Model Y manual: tire care](https://www.tesla.com/ownersmanual/modely/en_us/GUID-E95DAAD9-646E-4249-9930-B109ED7B1D91.html) (rotate every 6,250 mi, or at a 2/32 difference)
  - [Tesla tires support](https://www.tesla.com/support/tires)
  - [Michelin EV tires](https://www.michelinman.com/auto/auto-tips-and-advice/electric-mobility-guide/understanding-ev-tires)
- **Risk:**
  - No ratings or rankings, and no "best" claims. Give selection criteria only (load index/XL, OE size, foam, noise, rain).
  - Only name brands TireDrop actually carries. The catalog has six brands and no Goodyear.
  - Sizes must come from Tesla's own spec pages.
- **Guard:** Don't target "EV tires explained." Link to L-EV.

**10. Car Sat All Summer? Tire Checks for Returning Snowbirds**
`/blog/snowbird-car-sat-all-summer-tires`
- **KW:**
  - Primary: car sitting for months tires
  - Secondary: flat spots after storage; snowbird car checklist; tires after long storage
- **Intent:** Informational.
- **Timing:** Batch 1 (seasonal residents return Oct–Nov). Re-promote each October.
- **Local:** Seasonal residents across Broward and Palm Beach; cars left in hot garages or outdoors.
- **Links:**
  - Learn: L-Age, L-Press
  - Shop: `/mobile-service`, `/tires`, `/tools/dot-date-reader`
- **Demo:** DOT date reader.
- **Sources:**
  - [Michelin tire storage](https://www.michelinman.com/auto/auto-tips-and-advice/tire-maintenance/storing-my-tires)
  - [NHTSA TireWise (aging)](https://www.nhtsa.gov/vehicle-safety/tires)
  - [USTMA Tire Care Essentials](https://www.ustires.org/tire-care-essentials)
- **Risk:**
  - Don't state a snowbird population number unless it is sourced.
  - No "since" years.
  - Tire age: NHTSA defers to manufacturers. Some manufacturers say 6 years and others 10. Don't write "NHTSA says 6 years," which a search snippet claimed wrongly.
- **Guard:** This post is about a car that sat. Post #33 is about spare or stored tires, and post #41 is about climate aging.

### Batch 2

**11. Thanksgiving Drive? A Tire Check Before You Leave**
`/blog/thanksgiving-road-trip-tire-check`
- **KW:**
  - Primary: road trip tire check
  - Secondary: check tires before road trip; Thanksgiving travel car prep; holiday drive checklist
- **Intent:** Informational.
- **Timing:** Batch 2 (Thanksgiving is Nov 26, 2026). Update the numbers when AAA publishes its 2026 forecast, in mid-November.
- **Local:** Drives from South Florida north on I-95 and the Turnpike.
- **Links:**
  - Learn: L-Press, L-Tread, L-Flat
  - Shop: `/tires`, `/mobile-service`, `/tools/pressure-temperature`
- **Demo:** Pressure vs temperature.
- **Sources:**
  - [AAA Thanksgiving 2025 forecast](https://newsroom.aaa.com/2025/11/aaa-thanksgiving-travel-forecast-2025/) (81.8M travelers, ~73M by car)
  - [NHTSA TireWise](https://www.nhtsa.gov/vehicle-safety/tires)
  - [USTMA Tire Care Essentials](https://www.ustires.org/tire-care-essentials)
- **Risk:**
  - Label the 2025 figures as 2025.
  - No "your tires are safe for the trip."
  - No delivery promises of the "get tires before Thanksgiving" kind.
- **Guard:** This is the generic trip checklist. Posts #19 and #30 are route-specific.

**12. Flat Tire on I-95? What to Do and Who to Call**
`/blog/flat-tire-on-i-95`
- **KW:**
  - Primary: flat tire on highway what to do
  - Secondary: Road Rangers Florida; *347 FHP; Florida Move Over law flat tire
- **Intent:** Informational, urgent.
- **Timing:** Batch 2, before holiday travel.
- **Local:**
  - FDOT Road Rangers, reached by dialing *347.
  - Florida's expanded Move Over law, which now covers disabled vehicles with hazards on.
- **Links:**
  - Learn: L-Flat
  - Shop: `/mobile-service`, `/tires`
- **Demo:** None.
- **Sources:**
  - [FDOT Road Rangers FAQ](https://www.fdot.gov/traffic/roadrangers/faq.htm)
  - [FLHSMV Move Over](https://www.flhsmv.gov/safety-center/driving-safety/move-over/)
  - [AAA disappearing spare](https://www.aaa.com/autorepair/articles/the-amazing-disappearing-spare-tire)
- **Risk:**
  - Never describe changing a tire on a highway shoulder as "safe." Defer to Road Rangers and FHP.
  - Quote the Move Over details exactly: the effective date and the slow-down amount. Search results disagree on 2024 vs 2025 wording, so verify against FLHSMV.
  - Don't imply TireDrop does roadside rescue unless that is confirmed.
- **Guard:** None needed.

**13. Why 4/32 Matters More Than 2/32 in Florida Rain**
`/blog/worn-tires-florida-rain-4-32`
- **KW:**
  - Primary: when to replace tires tread depth
  - Secondary: 4/32 tread depth; worn tires in rain; Florida tire tread law
- **Intent:** Informational / commercial.
- **Timing:** Batch 2. Refresh in early May 2027.
- **Local:**
  - Florida's 2/32 legal minimum (FLHSMV).
  - The rainy-season climate.
- **Links:**
  - Learn: L-Tread
  - Shop: `/tires`, `/tire-check`, `/tools/tread-gauge`
- **Demo:** Tread gauge.
- **Sources:**
  - [AAA worn tires study](https://newsroom.aaa.com/2018/06/tread-lightly-worn-tires-drivers-risk/) (tires at 4/32 gave 43% longer wet stopping distance, 87 ft more on average at highway speed)
  - [FLHSMV tire safety](https://www.flhsmv.gov/safety-center/vehicle-safety/tire-safety/)
  - [NHTSA TireWise](https://www.nhtsa.gov/vehicle-safety/tires)
- **Risk:**
  - Present 4/32 as AAA's test threshold, not as a legal rule.
  - Never say that 4/32 or more is "safe."
  - Cite the Florida statute number only after verifying it (possibly §316.610, unconfirmed).
- **Guard:** Don't target "how to check tread depth." Link to L-Tread.

**14. Best Time to Buy Tires in South Florida, by Season**
`/blog/best-time-to-buy-tires-south-florida`
- **KW:**
  - Primary: best time to buy tires
  - Secondary: when to replace tires Florida; buy tires before rainy season; buy tires before hurricane season
- **Intent:** Commercial investigation.
- **Timing:** Batch 2. Re-promote in March–April 2027.
- **Local:**
  - A Florida calendar with no winter-tire cycle: before the rainy season (by mid-May), before hurricane season, and before road trips.
  - Buy before you are forced into an emergency purchase.
- **Links:**
  - Learn: L-Tread, L-Age
  - Shop: `/tires`, `/install`, `/tools/tread-gauge`
- **Demo:** Tread gauge.
- **Sources:**
  - [NWS Miami rainy season](https://www.weather.gov/media/mfl/news/RainySeasonOutlook2025.pdf)
  - [NOAA hurricane outlook](https://www.cpc.ncep.noaa.gov/products/outlooks/hurricane.shtml)
  - [AAA worn tires study](https://newsroom.aaa.com/2018/06/tread-lightly-worn-tires-drivers-risk/)
- **Risk: HIGH.**
  - The results for this keyword are dominated by rebate and sale timing. The post must contain no sales, rebates, discounts or "save X%" language.
  - Frame timing only by tire condition and by the season.
- **Guard:** None needed.

**15. What an Installed Tire Price Includes (and Doesn't)**
`/blog/installed-tire-price-explained`
- **KW:**
  - Primary: tire installation cost
  - Secondary: what does tire installation include; mounting and balancing; Florida tire fee; TPMS service kit
- **Intent:** Commercial investigation.
- **Timing:** Batch 2. Ideally publish when the "installed-price toggle" ships (checklist item).
- **Local:** Florida's $1 new-tire fee (FL DOR), which must be separately stated on the invoice.
- **Links:**
  - Learn: L-Svc, L-Press (TPMS)
  - Shop: `/install`, `/tires`, `/mobile-service`
- **Demo:** None.
- **Sources:**
  - [FL DOR new-tire fee](https://floridarevenue.com/taxes/taxesfees/Pages/solid_waste.aspx)
  - [Fla. Stat. 403.718](https://www.flsenate.gov/Laws/Statutes/2026/0403.718)
  - [NHTSA TPMS rule](https://www.nhtsa.gov/sites/nhtsa.gov/files/fmvss/TPMSfinalrule_6.pdf)
- **Risk: HIGH.**
  - The Florida fee and out-of-state tax treatment are still pending with the accountant (Launch Checklist). Hold this post until that is confirmed.
  - No dollar figures unless they come from TireDrop's live configuration.
  - No APR or lender names if financing comes up.
- **Guard:** None needed.

**16. Nitrogen in Tires: What the Tests Actually Showed**
`/blog/nitrogen-in-tires-myth`
- **KW:**
  - Primary: nitrogen in tires worth it
  - Secondary: nitrogen vs air tires; can you mix air and nitrogen; nitrogen tire pressure loss
- **Intent:** Informational.
- **Timing:** Batch 2. Evergreen.
- **Local:** Summer heat and pressure checks in Florida.
- **Links:**
  - Learn: L-Press
  - Shop: `/tools/pressure-temperature`, `/tires`
- **Demo:** Pressure vs temperature.
- **Sources:**
  - [Consumer Reports nitrogen test](https://www.consumerreports.org/cars/tire-buying-maintenance/should-you-use-nitrogen-in-car-tires-a6260003694/) (over a year, air-filled tires lost 3.5 psi and nitrogen-filled tires 2.2 psi)
  - NHTSA DOT HS 811 094 (2009): the nitrogen loss rate was about two-thirds of air's. Find the ROSA P or NHTSA copy, because the copies found were hosted on vendor sites.
  - [GAO-07-246R underinflated tires](https://www.gao.gov/assets/a94628.html)
- **Risk:**
  - Don't cite the vendor-hosted PDFs.
  - Don't disparage shops that offer nitrogen.
- **Guard:** None needed.

**17. Inflate to the Sidewall Number? Here's Why Not**
`/blog/sidewall-max-psi-myth`
- **KW:**
  - Primary: inflate tires to max psi
  - Secondary: sidewall pressure vs door sticker; what psi should my tires be; max press cold meaning
- **Intent:** Informational.
- **Timing:** Batch 2. Evergreen.
- **Local:** Heat adds pressure, so be careful about overfilling in summer.
- **Links:**
  - Learn: L-Press, L-Size
  - Shop: `/tools/pressure-temperature`, `/tire-size`
- **Demo:** Pressure vs temperature.
- **Sources:**
  - [NHTSA TireWise](https://www.nhtsa.gov/vehicle-safety/tires)
  - [FMVSS 110 (eCFR 571.110)](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-V/part-571/subpart-B/section-571.110)
  - [fueleconomy.gov maintenance](https://www.fueleconomy.gov/feg/maintain.jsp)
- **Risk:** Don't give a universal psi number. Always point to the door placard.
- **Guard:** Don't target "recommended tire pressure." Link to L-Press.

**18. Choosing Tires for a Toyota RAV4: Sizes, AWD, Rain**
`/blog/toyota-rav4-tires-guide`
- **KW:**
  - Primary: best tires for Toyota RAV4 (answered neutrally)
  - Secondary: RAV4 tire size; RAV4 AWD replace 2 tires; RAV4 hybrid tires
- **Intent:** Commercial investigation.
- **Timing:** Batch 2. Evergreen. The RAV4 is in Florida's top five (2025).
- **Local:** Rain grip, and AWD tread matching on Florida highway miles.
- **Links:**
  - Learn: L-Fit (AWD matching), L-Size
  - Shop: `/tires` (RAV4 fitment), `/find-my-tires`, `/tools/size-decoder`
- **Demo:** Size decoder.
- **Sources:**
  - [Toyota owner manuals](https://www.toyota.com/owners/warranty-owners-manuals/) (confirm the URL)
  - [NHTSA recalls](https://www.nhtsa.gov/recalls)
  - [USTMA replacing tires](https://www.ustires.org/tire-care-safety/replacing-tires)
- **Risk:**
  - No rankings.
  - The AWD tread-difference limit must come from Toyota's manual, not from retailer blogs.
  - Take the rotation interval from Toyota. Dealer sites said 5,000 mi, which is not good enough as a source.
- **Guard:** This is a vehicle guide. The AWD matching topic lives in L-Fit.

**19. Driving the Turnpike to Orlando: Tire Prep and Stops**
`/blog/turnpike-orlando-drive-tires`
- **KW:**
  - Primary: Florida Turnpike road trip
  - Secondary: Turnpike service plazas; Fort Lauderdale to Orlando drive; Turnpike EV charging
- **Intent:** Informational.
- **Timing:** Batch 2 (Thanksgiving and year-end theme-park travel).
- **Local:** Service plazas at Pompano Beach (MM 65), West Palm Beach (MM 94), Fort Pierce (MM 144) and Fort Drum (MM 184). Tesla chargers are at Fort Drum and Turkey Lake.
- **Links:**
  - Learn: L-Press, L-Flat
  - Shop: `/tires`, `/mobile-service`
- **Demo:** None.
- **Sources:**
  - [Florida's Turnpike service plazas](https://floridasturnpike.com/traveler-resources/service-plazas/)
  - [FDOT Road Rangers](https://www.fdot.gov/traffic/roadrangers/faq.htm)
  - [FLHSMV Move Over](https://www.flhsmv.gov/safety-center/driving-safety/move-over/)
- **Risk:**
  - Plaza amenities change, so date-stamp them and re-verify before each refresh.
  - No trip-time estimates.
- **Guard:** Different from #11, which is the generic checklist.

**20. My Car Has TPMS. Do I Still Need a Tire Gauge?**
`/blog/tpms-still-need-tire-gauge`
- **KW:**
  - Primary: do I need a tire pressure gauge if I have TPMS
  - Secondary: TPMS accuracy; TPMS light threshold; TPMS 25 percent
- **Intent:** Informational.
- **Timing:** Batch 2. Evergreen.
- **Local:** Daily heat swings.
- **Links:**
  - Learn: L-Press
  - Shop: `/tools/pressure-temperature`, `/install` (TPMS service)
- **Demo:** Pressure vs temperature.
- **Sources:**
  - [FMVSS 138 final rule](https://www.nhtsa.gov/sites/nhtsa.gov/files/fmvss/TPMSfinalrule_6.pdf) (warns at 25% or more below placard)
  - [NHTSA TPMS effectiveness study](https://crashstats.nhtsa.dot.gov/Api/Public/ViewPublication/811681)
  - [NHTSA TireWise](https://www.nhtsa.gov/vehicle-safety/tires)
- **Risk:** Don't imply that TPMS makes a car "safe."
- **Guard:** Don't target "TPMS light meaning," which belongs to L-Press. This post is the myth angle.

### Batch 3

**21. Buying a Used Car After Storm Season: Tire Clues**
`/blog/used-car-after-storm-season-tires`
- **KW:**
  - Primary: how to spot a flood car
  - Secondary: used car tire age check; mismatched tires used car; flood car VIN check
- **Intent:** Informational / commercial.
- **Timing:** Batch 3 (late Oct, as flood cars reach used-car lots after the season).
- **Local:** The South Florida used-car market after storms.
- **Links:**
  - Learn: L-Age, L-Tread
  - Shop: `/tools/dot-date-reader`, `/tires`
- **Demo:** DOT date reader.
- **Sources:**
  - [NHTSA flood-damaged vehicles](https://www.nhtsa.gov/hurricane-and-flood-damaged-vehicles)
  - [NHTSA recalls](https://www.nhtsa.gov/recalls)
  - [USTMA TIN recall lookup](https://recallinfo.ustires.org/TireRecallSearch/Tin)
- **Risk:**
  - Tire clues suggest, but don't prove, flood history. Say so.
  - No claims about specific dealers.
- **Guard:** This is the buyer's view. Post #3 is the owner's view.

**22. Why Same-Size Tires Cost Different Amounts**
`/blog/same-size-tires-different-prices`
- **KW:**
  - Primary: why are some tires more expensive
  - Secondary: cheap vs expensive tires; how to read tire prices; tire price per mile
- **Intent:** Commercial investigation.
- **Timing:** Batch 3. Evergreen.
- **Local:** Rain traction grade and heat (the temperature grade) for Florida.
- **Links:**
  - Learn: L-Size (UTQG, load, speed)
  - Shop: `/tires`, `/compare`, `/tire-size`
- **Demo:** Size decoder.
- **Sources:**
  - [NHTSA UTQG guide](https://www.nhtsa.gov/sites/nhtsa.gov/files/documents/2015uniformtirequalitygrading.pdf)
  - [Bridgestone Replacement Tire Selection Manual](https://www.bridgestoneamericas.com/content/dam/bscorpcomm-sites/bridgestone-americas/images/tiresafety/TireReplacementManual.pdf)
  - [NHTSA TireWise](https://www.nhtsa.gov/vehicle-safety/tires)
- **Risk:**
  - UTQG grades are comparative tests, not real-world guarantees. Say so.
  - Any "price per mile" figures must use manufacturer mileage warranties quoted exactly.
  - No discount framing.
- **Guard:** Don't target "UTQG explained." Link to L-Size.

**23. Choosing Between Tire Brands Without the Hype**
`/blog/choosing-between-tire-brands`
- **KW:**
  - Primary: which tire brand is best
  - Secondary: tire brands comparison; premium vs budget tires; are budget tires worth it
- **Intent:** Commercial investigation.
- **Timing:** Batch 3. Evergreen.
- **Local:** Florida rain and heat priorities.
- **Links:**
  - Learn: L-Size, L-Fit
  - Shop: `/tires`, `/compare`
- **Demo:** None.
- **Sources:**
  - [NHTSA UTQG guide](https://www.nhtsa.gov/sites/nhtsa.gov/files/documents/2015uniformtirequalitygrading.pdf)
  - [NHTSA recalls](https://www.nhtsa.gov/recalls)
  - [USTMA replacing tires](https://www.ustires.org/tire-care-safety/replacing-tires)
- **Risk: HIGH.**
  - No invented ratings, scores or "best brand."
  - No reviews or testimonials.
  - The catalog has six brands and no Goodyear, while the shop is a listed Goodyear location. Keep the post criteria-based.
- **Guard:** None needed.

**24. Do You Really Need to Replace All Four Tires?**
`/blog/replace-all-four-tires-myth`
- **KW:**
  - Primary: do I need to replace all 4 tires
  - Secondary: replace 2 tires AWD; replace one tire AWD; tire shaving
- **Intent:** Informational / commercial.
- **Timing:** Batch 3. Evergreen.
- **Local:** Many AWD crossovers on the road locally (CR-V, RAV4, Model Y).
- **Links:**
  - Learn: L-Fit
  - Shop: `/tires`, `/tools/tread-gauge`
- **Demo:** Tread gauge.
- **Sources:**
  - [USTMA replacing tires](https://www.ustires.org/tire-care-safety/replacing-tires)
  - [TIA tire replacement](https://www.tireindustry.org/resources/consumer-education/consumer-safety-overview/tire-replacement/)
  - [Tesla Model Y manual](https://www.tesla.com/ownersmanual/modely/en_us/GUID-E95DAAD9-646E-4249-9930-B109ED7B1D91.html)
- **Risk:**
  - AWD tolerances vary by automaker. Cite manuals only, not retailer blogs.
  - Don't upsell ("always buy four").
- **Guard:** This is the myth angle. L-Fit owns "AWD tire matching."

**25. New Tires on the Front or the Back? The Real Answer**
`/blog/new-tires-front-or-back`
- **KW:**
  - Primary: new tires front or back
  - Secondary: where to put 2 new tires; new tires on rear FWD; oversteer worn rear tires
- **Intent:** Informational.
- **Timing:** Batch 3. Evergreen.
- **Local:** Wet roads during the rainy season.
- **Links:**
  - Learn: L-Rot, L-Wx
  - Shop: `/tires`, `/install`, `/tools/hydroplaning`
- **Demo:** Hydroplaning explainer (the rear-grip scenario).
- **Sources:**
  - [USTMA Tire Tip: rear axle](https://www.ustires.org/tire-tip-tuesday-ustma-recommends-replacing-all-four-tires-same-time-optimal-performance-if-you-can)
  - [TIA tire replacement](https://www.tireindustry.org/resources/consumer-education/consumer-safety-overview/tire-replacement/)
  - [USTMA replacing tires](https://www.ustires.org/tire-care-safety/replacing-tires)
- **Risk:** Say "better stability," as USTMA words it, never "safer."
- **Guard:** None needed.

**26. Choosing Tires for a Toyota Camry: What Matters**
`/blog/toyota-camry-tires-guide`
- **KW:**
  - Primary: best tires for Toyota Camry (answered neutrally)
  - Secondary: Camry tire size; quiet tires Camry; Camry hybrid tires
- **Intent:** Commercial investigation.
- **Timing:** Batch 3. Evergreen.
- **Local:** Commuter miles on I-595 and I-95. Rain comes first.
- **Links:**
  - Learn: L-Size, L-Rot
  - Shop: `/tires` (Camry fitment), `/find-my-tires`
- **Demo:** Size decoder.
- **Sources:**
  - [Toyota owner manuals](https://www.toyota.com/owners/warranty-owners-manuals/) (confirm the URL)
  - [NHTSA UTQG guide](https://www.nhtsa.gov/sites/nhtsa.gov/files/documents/2015uniformtirequalitygrading.pdf)
  - [NHTSA recalls](https://www.nhtsa.gov/recalls)
- **Risk:**
  - No rankings.
  - Sizes by trim must come from Toyota.
  - Differentiate from the RAV4 post: the Camry angle is noise, comfort and hybrid low rolling resistance, not AWD.
- **Guard:** None needed.

**27. Ford F-150 Tires: P-Metric, LT and Load Range Basics**
`/blog/ford-f-150-tires-p-vs-lt`
- **KW:**
  - Primary: best tires for F-150 (answered neutrally)
  - Secondary: P vs LT tires F-150; F-150 load range E; F-150 tire pressure towing
- **Intent:** Commercial investigation.
- **Timing:** Batch 3. Evergreen. The F-Series is Florida's #1 seller (2025).
- **Local:** Work trucks, contractors, and summer heat under load.
- **Links:**
  - Learn: L-Truck, L-Size
  - Shop: `/tires` (F-150), `/commercial-tires`, `/tools/size-decoder`
- **Demo:** Size decoder.
- **Sources:**
  - [Ford owner manuals](https://www.ford.com/support/owner-manuals/) (confirm the URL)
  - [Bridgestone Replacement Tire Selection Manual](https://www.bridgestoneamericas.com/content/dam/bscorpcomm-sites/bridgestone-americas/images/tiresafety/TireReplacementManual.pdf)
  - [NHTSA TireWise](https://www.nhtsa.gov/vehicle-safety/tires)
- **Risk:**
  - LT pressures must come from the tire maker's load/inflation table, not from forum figures.
  - Never go below the OE load capacity.
- **Guard:** Don't target "LT vs P-metric." L-Truck owns that. Keep this post F-150 specific.

**28. EV Tires Wear Faster: How to Budget and Stretch Them**
`/blog/ev-tire-wear-budget`
- **KW:**
  - Primary: do EV tires wear faster
  - Secondary: EV tire replacement cost; how long do Tesla tires last; reduce EV tire wear
- **Intent:** Informational / commercial.
- **Timing:** Batch 3. Evergreen.
- **Local:** Florida's large EV fleet (the Model Y is a top seller) and hot pavement.
- **Links:**
  - Learn: L-EV, L-Rot
  - Shop: `/tires`, `/tools/rotation`
- **Demo:** Rotation animator.
- **Sources:**
  - [Michelin EV FAQ](https://www.michelinman.com/auto/electric-vehicles-faq)
  - [Michelin reduce EV tire wear](https://www.michelinman.com/auto/auto-tips-and-advice/electric-mobility-guide/how-to-reduce-tire-wear)
  - [Tesla Model Y manual](https://www.tesla.com/ownersmanual/modely/en_us/GUID-E95DAAD9-646E-4249-9930-B109ED7B1D91.html)
- **Risk:**
  - The "~20% faster" figure has not yet been traced to Michelin's own page. Don't use it until it is quoted from the primary source.
  - No cost numbers unless they are sourced.
- **Guard:** This post is about budget and wear. L-EV owns "EV tires explained."

**29. Tires for Uber and Lyft Drivers: The Mileage Math**
`/blog/rideshare-driver-tires`
- **KW:**
  - Primary: best tires for Uber drivers (answered neutrally)
  - Secondary: rideshare tires; rideshare inspection tires; tire pressure fuel economy
- **Intent:** Commercial investigation.
- **Timing:** Batch 3, ahead of the busy holiday and airport season. Refresh before spring.
- **Local:** Airport runs to FLL and MIA, and Port Everglades cruise traffic.
- **Links:**
  - Learn: L-Press, L-Rot
  - Shop: `/tires`, `/mobile-service`, `/commercial-tires`
- **Demo:** Pressure vs temperature.
- **Sources:**
  - [fueleconomy.gov](https://www.fueleconomy.gov/feg/maintain.jsp) (0.6% average and up to 3% better mpg; 0.2% lost per 1 psi drop)
  - [Fla. Stat. 627.748 (TNC)](https://www.flsenate.gov/Laws/Statutes/2025/627.748)
  - [AAA worn tires study](https://newsroom.aaa.com/2018/06/tread-lightly-worn-tires-drivers-risk/)
- **Risk:**
  - Don't state Uber or Lyft inspection rules unless they come from the platforms' own pages. The third-party claims found were unreliable.
  - No financing or APR language.
- **Guard:** None needed.

**30. Crossing Alligator Alley: Tires, Spare and Fuel Plan**
`/blog/alligator-alley-drive-tires`
- **KW:**
  - Primary: Alligator Alley drive
  - Secondary: Alligator Alley gas station; I-75 Everglades drive; Fort Lauderdale to Naples drive
- **Intent:** Informational.
- **Timing:** Batch 3. Holiday season, and Gulf Coast trips.
- **Local:** One service plaza, the Miccosukee plaza at Exit 49, on the roughly 75-mile stretch (verify the exact length).
- **Links:**
  - Learn: L-Flat, L-Press
  - Shop: `/tires`, `/mobile-service`
- **Demo:** None.
- **Sources:**
  - [Miccosukee Service Plaza](https://miccosukee.com/service-plaza/)
  - [FDOT Road Rangers](https://www.fdot.gov/traffic/roadrangers/faq.htm)
  - [AAA disappearing spare](https://www.aaa.com/autorepair/articles/the-amazing-disappearing-spare-tire)
- **Risk:**
  - Don't claim Road Rangers patrol I-75 there until FDOT District 1/4 coverage is confirmed.
  - No cell-coverage claims.
  - Don't state whether TireDrop provides mobile service out there.
- **Guard:** None needed.

### Batch 4

**31. Why Your TPMS Light Comes On After a Florida Cold Front**
`/blog/cold-front-tpms-light-florida`
- **KW:**
  - Primary: TPMS light cold weather
  - Secondary: tire pressure light on cold morning; tire pressure drop cold; TPMS light goes off after driving
- **Intent:** Informational.
- **Timing:** Batch 4 (late Oct), before the Dec–Feb fronts. Re-promote in December.
- **Local:** Broward mornings after winter cold fronts.
- **Links:**
  - Learn: L-Press
  - Shop: `/tools/pressure-temperature`, `/install`
- **Demo:** Pressure vs temperature.
- **Sources:**
  - [USTMA Tire Care Essentials](https://www.ustires.org/tire-care-essentials) (1–2 psi per 10°F)
  - [FMVSS 138](https://www.nhtsa.gov/sites/nhtsa.gov/files/fmvss/TPMSfinalrule_6.pdf)
  - [NWS Miami climate](https://www.weather.gov/mfl/climate)
- **Risk:**
  - Any typical temperature drop quoted must come from NWS data.
  - Don't say it is "fine" to ignore the light.
- **Guard:** This is the seasonal hook. L-Press owns "TPMS light meaning."

**32. Registered Your New Tires? How Recalls Reach You**
`/blog/tire-registration-recalls`
- **KW:**
  - Primary: tire registration
  - Secondary: tire recall check; tire recall lookup by DOT number; are my tires recalled
- **Intent:** Informational.
- **Timing:** Batch 4. Evergreen.
- **Local:** None; national reach.
- **Links:**
  - Learn: L-Age (DOT/TIN)
  - Shop: `/tools/dot-date-reader`, `/install`
- **Demo:** DOT date reader.
- **Sources:**
  - [NHTSA recalls](https://www.nhtsa.gov/recalls)
  - [49 CFR 574 (eCFR)](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-V/part-574)
  - [USTMA TIN recall lookup](https://recallinfo.ustires.org/TireRecallSearch/Tin)
- **Risk:**
  - Describe TireDrop's registration practice only if it is confirmed with the shop.
  - No safety guarantees.
- **Guard:** Don't target "how to read DOT code." L-Age owns that.

**33. Unused Tires Still Age: The Garage and Spare Myth**
`/blog/unused-tires-still-age-myth`
- **KW:**
  - Primary: do tires expire if not used
  - Secondary: how long do tires last in storage; old spare tire; new old stock tires
- **Intent:** Informational.
- **Timing:** Batch 4. Evergreen.
- **Local:** Hot Florida garages.
- **Links:**
  - Learn: L-Age
  - Shop: `/tools/dot-date-reader`, `/tires`
- **Demo:** DOT date reader.
- **Sources:**
  - [NHTSA TireWise](https://www.nhtsa.gov/vehicle-safety/tires)
  - [Michelin tire storage](https://www.michelinman.com/auto/auto-tips-and-advice/tire-maintenance/storing-my-tires)
  - [NTSB tire aging symposium](https://www.ntsb.gov/news/events/Documents/2014_Tire_Safety_SYM_Panel_4a_Soodoo.pdf)
- **Risk:**
  - The same NHTSA 6-vs-10-year caution as post #10 applies.
  - Don't put a number of years on garage storage unless it is sourced.
- **Guard:** This post is about stored or spare tires. Post #10 is about a car that sat; post #41 is about on-car sun aging.

**34. Is Tire Rotation Just an Upsell? What Manuals Say**
`/blog/tire-rotation-upsell-myth`
- **KW:**
  - Primary: is tire rotation necessary
  - Secondary: how often rotate tires; tire rotation worth it; rotation interval Tesla, Toyota, Honda
- **Intent:** Informational.
- **Timing:** Batch 4. Evergreen.
- **Local:** High annual mileage from Florida commutes.
- **Links:**
  - Learn: L-Rot
  - Shop: `/tools/rotation`, `/install`, `/mobile-service`
- **Demo:** Rotation animator.
- **Sources:**
  - [Tesla Model Y manual](https://www.tesla.com/ownersmanual/modely/en_us/GUID-E95DAAD9-646E-4249-9930-B109ED7B1D91.html)
  - [USTMA Tire Care Essentials](https://www.ustires.org/tire-care-essentials)
  - [Honda owners](https://owners.honda.com/) (Maintenance Minder; confirm the URL)
- **Risk:** Quote intervals only from automaker manuals, not from dealer blogs.
- **Guard:** Don't target "tire rotation pattern." L-Rot owns that.

**35. Choosing Tires for a Honda Civic in South Florida**
`/blog/honda-civic-tires-guide`
- **KW:**
  - Primary: best tires for Honda Civic (answered neutrally)
  - Secondary: Civic tire size; Civic Si tires; Civic tire noise
- **Intent:** Commercial investigation.
- **Timing:** Batch 4. Evergreen.
- **Local:** A popular commuter and student car. Wet grip and budget-conscious choices.
- **Links:**
  - Learn: L-Size, L-Fit (performance trims)
  - Shop: `/tires` (Civic fitment), `/find-my-tires`
- **Demo:** Plus-size calculator (a common upsize question).
- **Sources:**
  - [Honda owners](https://owners.honda.com/) (confirm the URL)
  - [NHTSA UTQG guide](https://www.nhtsa.gov/sites/nhtsa.gov/files/documents/2015uniformtirequalitygrading.pdf)
  - [NHTSA recalls](https://www.nhtsa.gov/recalls)
- **Risk:**
  - No rankings.
  - Differentiate from the Camry post: the Civic angle is sport trims, upsizing and budget.
- **Guard:** None needed.

**36. Honda CR-V Tires: AWD Matching and Rain Grip**
`/blog/honda-cr-v-tires-guide`
- **KW:**
  - Primary: best tires for Honda CR-V (answered neutrally)
  - Secondary: CR-V tire size; CR-V AWD tires; CR-V hybrid tires
- **Intent:** Commercial investigation.
- **Timing:** Batch 4. Evergreen. The CR-V is in Florida's top five (2025).
- **Local:** Family crossover use and rainy-season grip.
- **Links:**
  - Learn: L-Fit, L-Wx
  - Shop: `/tires` (CR-V fitment), `/tools/tread-gauge`
- **Demo:** Tread gauge.
- **Sources:**
  - [Honda owners](https://owners.honda.com/) (confirm the URL)
  - [USTMA replacing tires](https://www.ustires.org/tire-care-safety/replacing-tires)
  - [NHTSA recalls](https://www.nhtsa.gov/recalls)
- **Risk:**
  - No rankings.
  - Differentiate from the RAV4 post: the CR-V angle is family-hauling load (XL) and the hybrid.
- **Guard:** None needed.

**37. Tesla Model 3 Flat: Foam Tires, No Spare, What Now**
`/blog/tesla-model-3-flat-foam-tires`
- **KW:**
  - Primary: Tesla Model 3 flat tire
  - Secondary: Tesla acoustic foam tire repair; Model 3 no spare; Tesla tire repair kit
- **Intent:** Informational, urgent.
- **Timing:** Batch 4. Evergreen.
- **Local:** Mobile service in South Florida; the stranded-in-a-garage scenario.
- **Links:**
  - Learn: L-Flat, L-EV
  - Shop: `/mobile-service`, `/tires`
- **Demo:** None.
- **Sources:**
  - [Tesla tires support](https://www.tesla.com/support/tires)
  - [AAA disappearing spare](https://www.aaa.com/autorepair/articles/the-amazing-disappearing-spare-tire)
  - [TIA tire repair](https://www.tireindustry.org/resources/consumer-education/consumer-safety-overview/tire-repair/)
- **Risk:**
  - The sealant warning ("don't use sealant other than Tesla's kit") must be quoted from the Tesla manual, not from a forum.
  - Don't say whether foam tires can be repaired unless TIA or Tesla says so.
- **Guard:** Different from #9, which is about choosing tires, not flats.

**38. Small Fleet Tire Checklist for South Florida Businesses**
`/blog/small-fleet-tire-checklist`
- **KW:**
  - Primary: fleet tire management
  - Secondary: commercial fleet tires Broward; fleet tire service; FMCSA tread depth
- **Intent:** Commercial.
- **Timing:** Batch 4, ahead of Q1 budgeting.
- **Local:** Contractors, landscapers and delivery vans in Broward.
- **Links:**
  - Learn: L-Truck, L-Press
  - Shop: `/commercial-tires`, `/mobile-service`
- **Demo:** Tread gauge.
- **Sources:**
  - [49 CFR 393.75 (eCFR)](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-393/subpart-G/section-393.75) (4/32 steer, 2/32 others for CMVs)
  - [fueleconomy.gov](https://www.fueleconomy.gov/feg/maintain.jsp)
  - [USTMA Tire Care Essentials](https://www.ustires.org/tire-care-essentials)
- **Risk:**
  - The FMCSA rules apply to commercial motor vehicles only. Say so.
  - No fleet pricing or "fleet discount."
  - No lender names.
- **Guard:** None needed.

**39. Moving to Florida? Tire Tips for New Residents**
`/blog/moving-to-florida-tire-tips`
- **KW:**
  - Primary: moving to Florida car checklist
  - Secondary: Florida vehicle inspection; register car in Florida; Florida driving tips new residents
- **Intent:** Informational.
- **Timing:** Batch 4. Peak moves in fall and winter.
- **Local:**
  - FLHSMV's new-resident rules, including the VIN verification.
  - The heat and rain that surprise newcomers.
- **Links:**
  - Learn: L-Wx, L-Press
  - Shop: `/tires`, `/install`
- **Demo:** Hydroplaning explainer.
- **Sources:**
  - [FLHSMV New Resident](https://www.flhsmv.gov/new-resident/)
  - [NWS Miami rainy season](https://www.weather.gov/media/mfl/news/RainySeasonOutlook2025.pdf)
  - [USTMA Tire Care Essentials](https://www.ustires.org/tire-care-essentials)
- **Risk:**
  - Don't claim "Florida has no safety inspection" unless it is confirmed on the FLHSMV page.
  - The 10-day registration rule must be quoted from FLHSMV.
- **Guard:** None needed.

**40. A Glovebox Tire Kit for Florida Storms and Road Trips**
`/blog/glovebox-tire-kit-florida`
- **KW:**
  - Primary: car emergency kit Florida
  - Secondary: tire pressure gauge glovebox; tire inflator car kit; hurricane car kit
- **Intent:** Informational.
- **Timing:** Batch 4, before holiday travel. Re-promote in May 2027.
- **Local:** FDEM kit guidance, plus the car-specific items to add to it.
- **Links:**
  - Learn: L-Flat, L-Press
  - Shop: `/tools/tread-gauge`, `/tires`
- **Demo:** Tread gauge.
- **Sources:**
  - [FDEM Plan & Prepare](https://www.floridadisaster.org/PlanPrepare)
  - [AAA disappearing spare](https://www.aaa.com/autorepair/articles/the-amazing-disappearing-spare-tire)
  - [AAA plug vs patch](https://www.aaa.com/autorepair/articles/tire-plug-vs-patch-get-the-right-tire-repair)
- **Risk:**
  - No product endorsements or affiliate links.
  - Sealant caveats must come from automaker manuals.
- **Guard:** Different from #1, which is about the tire condition check.

### Batch 5 (out-of-season and evergreen; each gets a refresh date)

**41. Sun, Heat and Dry Rot: How Florida Ages Your Tires**
`/blog/florida-sun-dry-rot-tires`
- **KW:**
  - Primary: tire dry rot
  - Secondary: sidewall cracking; how long do tires last in Florida; tire aging heat
- **Intent:** Informational.
- **Timing:** Batch 5. Refresh in April 2027.
- **Local:** UV exposure, outdoor parking, and "what we see in the shop" (general only).
- **Links:**
  - Learn: L-Age
  - Shop: `/tools/dot-date-reader`, `/tires`
- **Demo:** DOT date reader.
- **Sources:**
  - [NHTSA TireWise (aging)](https://www.nhtsa.gov/vehicle-safety/tires)
  - [Michelin tire storage (UV/ozone)](https://www.michelinman.com/auto/auto-tips-and-advice/tire-maintenance/storing-my-tires)
  - [NTSB tire aging](https://www.ntsb.gov/news/events/Documents/2014_Tire_Safety_SYM_Panel_4a_Soodoo.pdf)
- **Risk:**
  - Don't state "tires in Florida last X years" unless it is sourced.
  - No invented shop anecdotes.
- **Guard:** None needed.

**42. Florida Heat and Tire Pressure: A Monthly Routine**
`/blog/florida-heat-tire-pressure`
- **KW:**
  - Primary: tire pressure in hot weather
  - Secondary: should I let air out of tires in heat; tire blowout summer; check tire pressure cold
- **Intent:** Informational.
- **Timing:** Batch 5. Refresh in April 2027, before USTMA National Tire Safety Week in late May.
- **Local:** Summer heat and parking-lot heat.
- **Links:**
  - Learn: L-Press
  - Shop: `/tools/pressure-temperature`, `/tires`
- **Demo:** Pressure vs temperature.
- **Sources:**
  - [USTMA Tire Care Essentials](https://www.ustires.org/tire-care-essentials)
  - [NHTSA TireWise](https://www.nhtsa.gov/vehicle-safety/tires)
  - [FLHSMV tire safety](https://www.flhsmv.gov/safety-center/vehicle-safety/tire-safety/)
- **Risk:**
  - Don't claim "summer causes more blowouts" unless it is sourced from NHTSA.
  - Don't advise letting air out of hot tires. Point to the cold placard pressure instead.
- **Guard:** Don't target "recommended tire pressure." L-Press owns that.

**43. Back-to-School Car Check for Broward Families**
`/blog/back-to-school-car-check-broward`
- **KW:**
  - Primary: back to school car checklist
  - Secondary: teen driver first car tires; car maintenance before school; school drop-off car prep
- **Intent:** Informational.
- **Timing:** Batch 5 (Nov 2026). Refresh and re-promote in mid-July 2027. BCPS started Aug 10 in 2026; confirm the 2027 date.
- **Local:** The BCPS calendar and teen drivers.
- **Links:**
  - Learn: L-Tread, L-Press
  - Shop: `/tires`, `/mobile-service`, `/tools/tread-gauge`
- **Demo:** Tread gauge.
- **Sources:**
  - [BCPS 2026/27 calendar](https://www.browardschools.com/bcps-departments/office-of-communications/accessible-school-year-calendar/202627-school-calendar)
  - [NHTSA TireWise](https://www.nhtsa.gov/vehicle-safety/tires)
  - [NHTSA recalls](https://www.nhtsa.gov/recalls)
- **Risk:**
  - The date must be updated for 2027.
  - No personal names or school names.
- **Guard:** None needed.

**44. Silverado 1500 Tires for Towing a Boat in Florida**
`/blog/silverado-boat-towing-tires`
- **KW:**
  - Primary: best tires for Silverado towing (answered neutrally)
  - Secondary: Silverado 1500 tire pressure towing; boat trailer tires; LT tires for towing
- **Intent:** Commercial investigation.
- **Timing:** Batch 5. Refresh in March 2027, before boating season.
- **Local:** Boat ramps, salt water and hot asphalt.
- **Links:**
  - Learn: L-Truck, L-Size
  - Shop: `/tires` (Silverado), `/commercial-tires`
- **Demo:** Size decoder.
- **Sources:**
  - [Chevrolet owner manuals](https://www.chevrolet.com/support/vehicle/manuals-guides) (confirm the URL)
  - [Bridgestone Replacement Tire Selection Manual](https://www.bridgestoneamericas.com/content/dam/bscorpcomm-sites/bridgestone-americas/images/tiresafety/TireReplacementManual.pdf)
  - [NHTSA TireWise](https://www.nhtsa.gov/vehicle-safety/tires)
- **Risk:**
  - Guidance on trailer (ST) tires needs a manufacturer source. The "replace every 3–5 years" and "65 mph" figures came from forums and retailers, not usable. Leave them out unless a manufacturer page is found.
  - No towing-capacity claims.
- **Guard:** Different from #27: this post is about towing, not P vs LT.

**45. Jeep Wrangler Tires for Street, Sand and Rain**
`/blog/jeep-wrangler-tires-guide`
- **KW:**
  - Primary: best tires for Jeep Wrangler (answered neutrally)
  - Secondary: Wrangler all-terrain vs highway; 33 inch tires Wrangler; five-tire rotation
- **Intent:** Commercial investigation.
- **Timing:** Batch 5. Evergreen.
- **Local:** Mostly pavement use, plus Florida rain.
- **Links:**
  - Learn: L-Truck, L-Fit (plus sizing), L-Rot
  - Shop: `/tires` (Wrangler), `/tools/plus-size`
- **Demo:** Plus-size calculator.
- **Sources:**
  - [Bridgestone Replacement Tire Selection Manual](https://www.bridgestoneamericas.com/content/dam/bscorpcomm-sites/bridgestone-americas/images/tiresafety/TireReplacementManual.pdf) (±3% diameter guidance)
  - [NHTSA recalls](https://www.nhtsa.gov/recalls)
  - Jeep/Mopar owner's manual for the five-tire rotation (URL to confirm)
- **Risk:**
  - Don't imply beach driving is allowed in Broward.
  - Present plus sizing with speedometer and load caveats.
  - No rankings.
- **Guard:** None needed.

**46. Do Bigger Wheels Always Handle Better? Not Quite**
`/blog/bigger-wheels-myth`
- **KW:**
  - Primary: plus size tires pros and cons
  - Secondary: bigger rims ride quality; low profile tires pothole; speedometer after bigger tires
- **Intent:** Informational.
- **Timing:** Batch 5. Evergreen.
- **Local:** Pothole and curb damage on low-profile tires; wheels with a coastal look.
- **Links:**
  - Learn: L-Fit
  - Shop: `/tools/plus-size`, `/wheels`, `/tires`
- **Demo:** Plus-size calculator.
- **Sources:**
  - [Bridgestone tire size guide](https://tires.bridgestone.com/en-us/learn/automotive/tire-maintenance/what-is-the-tire-size-for-my-car)
  - [Bridgestone Replacement Tire Selection Manual](https://www.bridgestoneamericas.com/content/dam/bscorpcomm-sites/bridgestone-americas/images/tiresafety/TireReplacementManual.pdf)
  - [NHTSA TireWise](https://www.nhtsa.gov/vehicle-safety/tires)
- **Risk:**
  - Never below OE load index.
  - No safety framing.
- **Guard:** This is the myth angle. L-Fit owns "plus sizing."

**47. Hit a Curb or Pothole? Tire and Alignment Signs**
`/blog/curb-pothole-tire-alignment-signs`
- **KW:**
  - Primary: hit a pothole tire damage
  - Secondary: sidewall bubble; car pulls after hitting curb; alignment after pothole
- **Intent:** Informational / commercial.
- **Timing:** Batch 5. Evergreen.
- **Local:** Construction zones and curbs in parking garages.
- **Links:**
  - Learn: L-Rot (alignment), L-Tread (wear)
  - Shop: `/tools/wear-patterns`, `/install`, `/auto-service`
- **Demo:** Wear-pattern guide.
- **Sources:**
  - [USTMA Tire Care Essentials](https://www.ustires.org/tire-care-essentials)
  - [TIA tire repair (sidewall not repairable)](https://www.tireindustry.org/resources/consumer-education/consumer-safety-overview/tire-repair/)
  - [NHTSA TireWise](https://www.nhtsa.gov/vehicle-safety/tires)
- **Risk:**
  - Don't advise that a bulged tire can be driven.
  - Any alignment service mention must match what `/auto-service` actually offers.
- **Guard:** Don't target "tire wear patterns." L-Tread owns that.

**48. Low Rolling Resistance Tires: Worth It for Hybrids?**
`/blog/low-rolling-resistance-hybrids`
- **KW:**
  - Primary: low rolling resistance tires
  - Secondary: best tires for hybrid (answered neutrally); LRR tires mpg; Prius, Camry Hybrid or RAV4 Hybrid tires
- **Intent:** Commercial investigation.
- **Timing:** Batch 5. Evergreen.
- **Local:** Many hybrids in use locally; rain grip trade-offs.
- **Links:**
  - Learn: L-EV, L-Size
  - Shop: `/tires`, `/compare`
- **Demo:** None.
- **Sources:**
  - [fueleconomy.gov](https://www.fueleconomy.gov/feg/maintain.jsp)
  - [Michelin understanding EV tires](https://www.michelinman.com/auto/auto-tips-and-advice/electric-mobility-guide/understanding-ev-tires)
  - NHTSA DOT HS 811 154, tire fuel efficiency (use the NHTSA-hosted copy)
- **Risk:** No mpg-gain claims beyond the sourced ones.
- **Guard:** None needed.

**49. Used Tires: What to Check Before You Buy One**
`/blog/used-tires-what-to-check`
- **KW:**
  - Primary: used tires near me
  - Secondary: are used tires worth it; used tire inspection; buying used tires Florida
- **Intent:** Commercial / local.
- **Timing:** Batch 5. Evergreen.
- **Local:** Plenty of used-tire lots in Broward. Keep it neutral, with no disparagement.
- **Links:**
  - Learn: L-Age, L-Tread, L-Flat
  - Shop: `/tires`, `/tools/dot-date-reader`
- **Demo:** DOT date reader.
- **Sources:**
  - [USTMA used tires](https://www.ustires.org/used-tires)
  - [NHTSA TireWise](https://www.nhtsa.gov/vehicle-safety/tires)
  - [USTMA TIN recall lookup](https://recallinfo.ustires.org/TireRecallSearch/Tin)
- **Risk:**
  - Confirm whether Extreme Tires sells used tires before publishing; that changes the angle.
  - Never say "safe."
- **Guard:** None needed.

**50. Why New-Car Tires Sometimes Wear Out Early**
`/blog/new-car-tires-wear-out-early`
- **KW:**
  - Primary: why did my original tires wear out so fast
  - Secondary: OEM tires wear out fast; factory tires mileage; first set of tires replacement
- **Intent:** Informational / commercial.
- **Timing:** Batch 5. Evergreen.
- **Local:** Heat and high commuting mileage.
- **Links:**
  - Learn: L-Rot, L-EV, L-Size
  - Shop: `/tires`, `/tools/rotation`, `/tools/wear-patterns`
- **Demo:** Wear-pattern guide.
- **Sources:**
  - [NHTSA UTQG guide](https://www.nhtsa.gov/sites/nhtsa.gov/files/documents/2015uniformtirequalitygrading.pdf)
  - [Michelin reduce EV tire wear](https://www.michelinman.com/auto/auto-tips-and-advice/electric-mobility-guide/how-to-reduce-tire-wear)
  - [Tesla Model Y manual](https://www.tesla.com/ownersmanual/modely/en_us/GUID-E95DAAD9-646E-4249-9930-B109ED7B1D91.html)
- **Risk:**
  - This is an opinion post with no invented mileage figures.
  - Don't disparage automakers or OE brands.
- **Guard:** None needed.

---

## 4. Publishing calendar

The rule is that seasonal posts land before their season, with urgent seasonal posts first. The Phase 2 pilot uses 5 posts from Batch 1: #1 (seasonal), #2 (timely local), #5 (weather + demo), #6 (local commerce) and #9 (vehicle guide). They then publish as part of Batch 1.

| Batch | Target week | Posts | Why this order |
|---|---|---|---|
| 1 | Mon 5 Oct 2026 (or the week Phase 2 is approved) | #1, #2, #3, #4, #5, #6, #7, #8, #9, #10 | Two months of hurricane season are left. King tides are running now and more are forecast for Oct–Nov. The rainy season ends Oct 15. This batch also holds the core commercial and local posts and the top vehicle query (Model Y). |
| 2 | Mon 12 Oct | #11, #12, #13, #14, #15 (hold for the accountant's answer), #16, #17, #18, #19, #20 | Six or more weeks before Thanksgiving (Nov 26), the "best time to buy" post and the main myths. |
| 3 | Mon 19 Oct | #21–#30 | Post-season used-car market, buying and brand posts, the F-150, Camry and EV posts, rideshare ahead of the holiday airport season, and Alligator Alley before the holidays. |
| 4 | Mon 26 Oct | #31–#40 | Cold-front TPMS before December. Moving and snowbird arrivals. The glovebox kit before the holidays. Fleet posts ahead of Q1. |
| 5 | Mon 2 Nov | #41–#50 | Summer, school and boating topics. Publishing early lets them index before their 2027 seasons, and each has a refresh date. |

**Hard deadlines if approvals slip:**
- #1–#4 (hurricane, king tides, flood, debris): publish by Fri 30 Oct, or move to mid-May 2027.
- #11, #19 and #30 (holiday travel): publish by Mon 9 Nov.
- #31 (cold front): publish by Tue 1 Dec.

**Florida content calendar, including 2027 refresh and re-promote dates:**
- Late Sep–Nov: king tides. Refresh #2.
- Oct 15: the NWS Miami rainy season ends.
- Oct–Nov: snowbirds arrive. Re-promote #10.
- Nov 26: Thanksgiving. Update #11 with AAA's 2026 forecast.
- Nov 30: hurricane season ends.
- About Dec 19–Jan 1: year-end travel. Re-promote #11, #19, #30 and #40.
- Dec–Feb: cold fronts. Re-promote #31.
- Mar 2027: refresh #14 and #44.
- Apr 2027: refresh #41 and #42.
- About May 1, 2027: refresh #5 and #13.
- May 15: the rainy season starts.
- Late May: USTMA National Tire Safety Week. Re-promote #42.
- Mid-May: refresh #1, #3, #4 and #40.
- Jun 1: hurricane season starts.
- Mid-Jul: refresh #43.
- Aug: BCPS back to school.

---

## 5. Risks and open items

1. **Primary sources could not be opened.** WebFetch was blocked for NHTSA, USTMA, AAA newsroom, NOAA, FLHSMV, FHWA, the Florida Senate, FDEM and Tesla. Every number must be page-verified in Phase 3.
2. **Wrong or unreliable claims found in search results. Do not use them:**
   - "NHTSA recommends replacing tires at 6 years." NHTSA defers to manufacturers.
   - "Florida requires an annual TNC inspection." This came from a third party.
   - Hydroplaning speed and water-depth figures from non-authoritative sites.
   - Trailer tire "3–5 years" and "65 mph" figures from forums.
   - EV "20% faster wear" until it is quoted from Michelin's own page.
3. **Deals risk.** Posts #14, #15, #22 and #23 sit in search results full of rebate content. Copy review must strip any sale language.
4. **The Florida $1 tire fee and sales tax (#15)** are pending with the accountant, according to the Launch Checklist. Hold #15 until that is answered.
5. **Cannibalization:**
   - #6 and #7 compete with `/install` and `/mobile-service`.
   - Several myth posts sit next to Learn head terms.
   - Each post has a "Guard" note, and every post must link to the canonical page.
6. **Near-duplicate or scaled-content risk.** There are 9 vehicle posts and 3 tire-aging posts (#10, #33, #41). Each has a distinct angle defined above. The writer must not reuse a template body.
7. **Brand neutrality.** No rankings, no invented ratings and no reviews. Only feature brands the catalog carries: six brands, and no Goodyear even though the shop is a Goodyear locator listing.
8. **People and news.** King-tide and hurricane news coverage quotes named officials. Don't reproduce names (house rule).
9. **Timing promises.** None of the mobile, install or shipping posts may carry arrival, delivery or "same-day" language.
10. **Stale statistics.** AAA 2025 travel figures and NOAA's 2026 outlook must be labeled with their year and updated at each refresh.

---

## 6. Sources list

All the sources below were found via WebSearch on 29 Sep 2026. None could be opened with WebFetch.

**Federal (US DOT / NHTSA / FHWA / FMCSA / DOE / GAO / NTSB)**
- NHTSA TireWise: https://www.nhtsa.gov/vehicle-safety/tires
- NHTSA Hurricane- and Flood-Damaged Vehicles: https://www.nhtsa.gov/hurricane-and-flood-damaged-vehicles
- NHTSA Recalls: https://www.nhtsa.gov/recalls
- NHTSA UTQG consumer guide (DOT HS 812 210): https://www.nhtsa.gov/sites/nhtsa.gov/files/documents/2015uniformtirequalitygrading.pdf
- NHTSA TPMS final rule (FMVSS 138): https://www.nhtsa.gov/sites/nhtsa.gov/files/fmvss/TPMSfinalrule_6.pdf
- NHTSA TPMS effectiveness evaluation (DOT HS 811 681): https://crashstats.nhtsa.dot.gov/Api/Public/ViewPublication/811681
- NHTSA Tire-Related Factors in the Pre-Crash Phase (DOT HS 811 617): https://crashstats.nhtsa.dot.gov/Api/Public/ViewPublication/811617
- NHTSA DOT HS 811 094 (2009), nitrogen inflation. The NHTSA or ROSA P copy is still to be located, because only vendor-hosted copies were found.
- eCFR 49 CFR 571.110 (FMVSS 110): https://www.ecfr.gov/current/title-49/subtitle-B/chapter-V/part-571/subpart-B/section-571.110
- eCFR 49 CFR 574 (tire identification and recordkeeping): https://www.ecfr.gov/current/title-49/subtitle-B/chapter-V/part-574
- eCFR 49 CFR 393.75 (FMCSA tires): https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-393/subpart-G/section-393.75
- FHWA, How Do Weather Events Impact Roads: https://ops.fhwa.dot.gov/weather/q1_roadimpact.htm
- FHWA Rain & Flooding: https://ops.fhwa.dot.gov/weather/weather_events/rain_flooding.htm
- fueleconomy.gov (DOE/EPA), Keeping Your Vehicle in Shape: https://www.fueleconomy.gov/feg/maintain.jsp
- GAO-07-246R, Underinflated Tires in the United States: https://www.gao.gov/assets/a94628.html
- NTSB 2014 Tire Safety Symposium, tire aging panel: https://www.ntsb.gov/news/events/Documents/2014_Tire_Safety_SYM_Panel_4a_Soodoo.pdf

**Weather (NOAA / NWS)**
- NOAA, maintains below-normal 2026 outlook (Aug update): https://www.noaa.gov/news-release/noaa-maintains-prediction-for-below-normal-atlantic-hurricane-season
- NOAA CPC 2026 Atlantic Hurricane Outlook: https://www.cpc.ncep.noaa.gov/products/outlooks/hurricane.shtml
- NWS Miami Rainy Season Outlook (May 15–Oct 15): https://www.weather.gov/media/mfl/news/RainySeasonOutlook2025.pdf
- NWS Miami climate: https://www.weather.gov/mfl/climate
- NOAA Annual High Tide Flooding Outlook: https://tidesandcurrents.noaa.gov/high-tide-flooding/annual-outlook.html
- NOAA Monthly High Tide Flooding Outlook: https://tidesandcurrents.noaa.gov/high-tide-flooding/monthly-outlook.html

**Florida (state and local)**
- FDEM Plan & Prepare: https://www.floridadisaster.org/PlanPrepare
- FDEM Know Your Zone: https://www.floridadisaster.org/knowyourzone/
- FDEM Preparedness Month 2026 release (half tank / half charge): https://www.floridadisaster.org/news-media/news/202600901-florida-division-of-emergency-management-urges-residents-to-stay-prepared-and-alert-during-florida-preparedness-month/
- FLHSMV Tire Safety: https://www.flhsmv.gov/safety-center/vehicle-safety/tire-safety/
- FLHSMV Move Over: https://www.flhsmv.gov/safety-center/driving-safety/move-over/
- FLHSMV New Resident: https://www.flhsmv.gov/new-resident/
- FL Dept. of Revenue, New Tire Fee: https://floridarevenue.com/taxes/taxesfees/Pages/solid_waste.aspx
- Fla. Stat. 403.718 (2026): https://www.flsenate.gov/Laws/Statutes/2026/0403.718
- Fla. Stat. 627.748 (TNC): https://www.flsenate.gov/Laws/Statutes/2025/627.748
- FDOT Road Rangers FAQ: https://www.fdot.gov/traffic/roadrangers/faq.htm
- Florida's Turnpike service plazas: https://floridasturnpike.com/traveler-resources/service-plazas/
- Miccosukee Service Plaza (Alligator Alley): https://miccosukee.com/service-plaza/
- Broward County Public Schools 2026/27 calendar: https://www.browardschools.com/bcps-departments/office-of-communications/accessible-school-year-calendar/202627-school-calendar

**Industry and associations**
- USTMA Tire Care Essentials: https://www.ustires.org/tire-care-essentials
- USTMA Replacing Tires: https://www.ustires.org/tire-care-safety/replacing-tires
- USTMA Tire Tip (rear axle): https://www.ustires.org/tire-tip-tuesday-ustma-recommends-replacing-all-four-tires-same-time-optimal-performance-if-you-can
- USTMA Tire Repair Basics: https://www.ustires.org/tire-care-safety/tire-repair-basics
- USTMA Used Tires: https://www.ustires.org/used-tires
- USTMA Tire Recall Lookup (TIN): https://recallinfo.ustires.org/TireRecallSearch/Tin
- TIA Tire Replacement: https://www.tireindustry.org/resources/consumer-education/consumer-safety-overview/tire-replacement/
- TIA Tire Repair: https://www.tireindustry.org/resources/consumer-education/consumer-safety-overview/tire-repair/
- AAA, Tread Lightly: Worn Tires (2018): https://newsroom.aaa.com/2018/06/tread-lightly-worn-tires-drivers-risk/
- AAA Thanksgiving 2025 forecast: https://newsroom.aaa.com/2025/11/aaa-thanksgiving-travel-forecast-2025/
- AAA Year-End 2025 forecast: https://newsroom.aaa.com/2025/12/aaa-year-end-holiday-travel-forecast/
- AAA, The Amazing Disappearing Spare Tire: https://www.aaa.com/autorepair/articles/the-amazing-disappearing-spare-tire
- AAA, Tire Plug vs. Patch: https://www.aaa.com/autorepair/articles/tire-plug-vs-patch-get-the-right-tire-repair
- Consumer Reports, Should You Use Nitrogen: https://www.consumerreports.org/cars/tire-buying-maintenance/should-you-use-nitrogen-in-car-tires-a6260003694/

**Manufacturers**
- Tesla Model Y Owner's Manual, tire care: https://www.tesla.com/ownersmanual/modely/en_us/GUID-E95DAAD9-646E-4249-9930-B109ED7B1D91.html
- Tesla tires support: https://www.tesla.com/support/tires
- Michelin EV FAQ: https://www.michelinman.com/auto/electric-vehicles-faq
- Michelin, Understanding EV tires: https://www.michelinman.com/auto/auto-tips-and-advice/electric-mobility-guide/understanding-ev-tires
- Michelin, Reduce EV tire wear: https://www.michelinman.com/auto/auto-tips-and-advice/electric-mobility-guide/how-to-reduce-tire-wear
- Michelin, Storing tires: https://www.michelinman.com/auto/auto-tips-and-advice/tire-maintenance/storing-my-tires
- Bridgestone Replacement Tire Selection Manual: https://www.bridgestoneamericas.com/content/dam/bscorpcomm-sites/bridgestone-americas/images/tiresafety/TireReplacementManual.pdf
- Bridgestone, How to read tire size: https://tires.bridgestone.com/en-us/learn/automotive/tire-maintenance/what-is-the-tire-size-for-my-car
- Owner-manual portals. Confirm each URL before citing: Toyota https://www.toyota.com/owners/warranty-owners-manuals/ · Honda https://owners.honda.com/ · Ford https://www.ford.com/support/owner-manuals/ · Chevrolet https://www.chevrolet.com/support/vehicle/manuals-guides · Jeep/Mopar (URL still to be found)

**Context only (not for citing on the site)**
- Edmunds via CarEdge and other reports, Florida 2025 top sellers (used only to pick vehicles): https://caredge.com/guides/best-selling-cars/florida
- CBS Miami / WLRN coverage of the Sep 2026 king tides (used only for timing): https://www.wlrn.org/2026-09-29/a-royal-mess-king-tides-are-back-and-more-annoying-than-ever
