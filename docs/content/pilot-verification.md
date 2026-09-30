# Pilot articles: claim verification (Phase 2C)

Prepared 2026-09-29 for the 10 pilot articles (5 Learn, 5 Blog), publish date 2026-10-05.

## Method

- **WebFetch was blocked on every source domain** (EGRESS_BLOCKED): nhtsa.gov, ecfr.gov, law.cornell.edu, and a curl probe of michelinman.com, goodyear.com, weather.gov, tesla.com, ustires.org, floridadisaster.org, tidesandcurrents.noaa.gov, federalregister.gov, tireindustry.org, bridgestoneamericas.com, fdot.gov, broward.org, consumerreports.org and newsroom.aaa.com all returned connect_rejected.
- So every claim was checked with **WebSearch**, matching the exact claim against the search-result text attributed to that source.
- **"Y (snippet)"** means the figure or statement appeared in result text attributed to the listed source. It is search-verified, not page-verified. The Phase 3 fact-check should still open each URL, as the plans require.
- Claims that could not be confirmed were **dropped or rewritten qualitatively** (see the last section).
- Business facts (services, ship-to-store, install area) come from the site itself: `src/data/business.js`, `src/data/services.js`, `src/pages/InstallPage.jsx`, `src/pages/services/MobileServicePage.jsx`.

## Learn: /learn/sidewall/dot-date-code

| Claim | Source | Verified |
|---|---|---|
| Last four digits = week then year (e.g. 3219 = week 32 of 2019; 2910 = week 29 of 2010) | NHTSA TireWise / Tire Buyers' FAQ; Goodyear date code | Y (snippet) |
| Week 01 = first full week of the year | NHTSA (via search result) | Y (snippet) |
| TIN may not be on both sides; look on both | NHTSA TireWise (nhtsa.gov/equipment/tires) | Y (snippet) |
| Pre-2000 codes are 3 digits; last digit = year within decade | Goodyear | Y (snippet) |
| TIN parts: plant code, size code, type code, date (example DOT AF WD9E 0517) | General Tire | Y (snippet) |
| 2015 rule: plant code 2 → 3 symbols; TIN standardized at 13 symbols; optional until 2025 | Federal Register final rule, 2015-04-13 | Y (snippet) |
| USTMA lookup takes full TIN; covers USTMA members' tires from 2000 on | USTMA Tire Recall Lookup | Y (snippet) |
| NHTSA recalls searchable by tire brand and line | NHTSA recalls | Y (snippet) |
| Part 574 registration program exists so makers can notify buyers | NHTSA interpretations / 49 CFR 574 | Y (snippet) |
| Check date when buying and know vehicle maker's replacement timeframe | NHTSA Tire Buyers' FAQ | Y (snippet) |

## Learn: /learn/tread/tread-depth

| Claim | Source | Verified |
|---|---|---|
| Wear bars; replace at 2/32 | NHTSA TireWise | Y (snippet) |
| Penny test: Lincoln upside down, head visible = 2/32 | NHTSA, USTMA | Y (snippet) |
| AAA 2018: 4/32 vs new, wet, 60 mph: +43%, +87 ft car, +86 ft light truck; worn tires still near 40 mph | AAA Newsroom 2018 | Y (snippet, several outlets quoting AAA) |
| AAA recommends replacing at 4/32 | AAA Newsroom | Y (snippet) |
| Quarter test: all of Washington's head = about 4/32 (AAA and CR) | Consumer Reports, AAA | Y (snippet) |
| mm conversions (2/32 = 1.6 mm, 4/32 = 3.2 mm, etc.) | Arithmetic (n/32 × 25.4) | Y (math) |
| Check tread and sidewalls for cuts, bulges, cracks; see a professional | NHTSA Winter Driving Tips | Y (snippet) |
| Extreme Tires does alignment (shop) and measures tread at every corner during rotation | `src/data/services.js` | Y (site) |
| Florida law | Not stated; text says "check current Florida law" and links flsenate.gov/Laws/Statutes | n/a |

## Learn: /learn/pressure/tpms-light

| Claim | Source | Verified |
|---|---|---|
| TPMS required on vehicles ≤ 10,000 lb GVWR built from Sep 1, 2007 | FMVSS 138 final rule (TREAD Act) | Y (snippet) |
| Warning at 25% below placard cold pressure or Table 1 minimum, whichever higher; within 20 minutes | FMVSS 138 (49 CFR 571.138) | Y (snippet) |
| Malfunction: flash 60–90 s after ignition on, then continuous; repeats each start until fixed | 49 CFR 571.138 (govinfo CFR copies) | Y (snippet) |
| TPMS is not a substitute for maintenance; driver's responsibility | FMVSS 138 text / NHTSA | Y (snippet) |
| Check monthly with gauge, spare included, cold = parked 3+ hours | NHTSA TireWise | Y (snippet) |
| Placard on driver's door edge/door post; sidewall number is not the target | NHTSA | Y (snippet) |
| "As the outside temperature drops, so does tire inflation pressure" | NHTSA Winter Driving Tips | Y (snippet, exact quote) |
| Don't let air out of warm tires; recheck cold | NHTSA Summer Driving Tips | Y (snippet) |
| Extreme Tires TPMS service: scan, battery check, replacement, relearn; mobile | `src/data/services.js` | Y (site) |
| Install includes TPMS reset where equipped | `src/data/services.js`, InstallPage | Y (site) |
| Tire repair = dismount, internal inspection, combination patch-plug | `src/data/services.js` | Y (site) |

## Learn: /learn/sidewall/how-to-read-tire-size

| Claim | Source | Verified |
|---|---|---|
| Width mm / aspect ratio % / R radial / rim inches; rim must match exactly | Michelin Tire Markings | Y (snippet) |
| P = TRA load standards; no letter = ETRTO | Michelin | Y (snippet) |
| P passenger, LT light truck, T temporary, ST special trailer | NHTSA tire safety material | Y (snippet) |
| Load index 94 = 670 kg / 1,477 lb; H 130, V 149, W 168, Y 186 mph | Michelin Load & Speed | Y (snippet) |
| Replacements match placard size, load, speed; load index ≥ placard | USTMA Replacing Tires | Y (snippet) |
| Placard location | NHTSA | Y (snippet) |
| Flotation 31x10.50R15 = 31 in diameter, 10.50 in width, 15 in rim | Discount Tire (retailer; cross-checked on several size references) | Y (snippet) |
| Sidewall and diameter math (225/65R17 ≈ 28.5 in; 225/45R19 ≈ 27.0 in) | Arithmetic | Y (math) |

## Learn: /learn/sidewall/utqg-ratings

| Claim | Source | Verified |
|---|---|---|
| Treadwear relative to control 100; 150 = 1.5× on government course | 49 CFR 575.104; NHTSA UTQG consumer guide | Y (snippet) |
| "May depart significantly from the norm due to…" quote | NHTSA UTQG consumer guides | Y (snippet, exact quote) |
| Traction AA/A/B/C, wet braking on government asphalt and concrete | 49 CFR 575.104 | Y (snippet) |
| Traction excludes acceleration, cornering, hydroplaning, peak traction | 49 CFR 575.104 text | Y (snippet) |
| Temperature A/B/C; C is the level all passenger tires must meet | 49 CFR 575.104 | Y (snippet) |
| A > 115 mph, B 100–115, C 85–100 | Cooper Tire UTQG | Y (snippet) |
| Manufacturers assign grades; NHTSA audits | NHTSA interpretations / TP-UTQG | Y (snippet) |
| Compare treadwear within a brand | Tire Rack UTQG page (retailer) | Y (snippet) |
| Exemptions: deep-tread winter, temp spares, ≤ 12 in rims, limited production | 49 CFR 575.104 | Y (snippet) |
| /compare shows each tire's full spec sheet | `src/pages/shop/ComparePage.jsx` | Y (site) |

## Blog: /blog/hurricane-season-tire-check

| Claim | Source | Verified |
|---|---|---|
| Season June 1 to November 30 | NOAA | Y (snippet) |
| 2/32 (NHTSA), 4/32 and 87 ft (AAA) | NHTSA, AAA Newsroom | Y (snippet) |
| Check pressure monthly incl. spare; cold = 3 h | NHTSA TireWise | Y (snippet) |
| Compact spare limits printed on spare/label/manual | NHTSA/manual guidance (no number given) | Y (qualitative) |
| Know Your Zone address lookup | FDEM | Y (snippet) |
| Half a tank; EV 50–80% depending on vehicle/manual | FDEM Halfway Full, Halfway There | Y (snippet) |
| 12 in of rushing water carries most cars; 2 ft SUVs/trucks | NWS Turn Around Don't Drown | Y (snippet) |
| Don't drive flooded vehicle before technician check; Li-ion vehicle not in garage or within 50 ft of structures | NHTSA Hurricane- and Flood-Damaged Vehicles | Y (snippet) |
| Extreme Tires installs in shop and by van, repairs punctures after inspection; no availability promise | Site pages | Y (site) |

## Blog: /blog/king-tide-salt-water-wheels

| Claim | Source | Verified |
|---|---|---|
| King tide = popular, non-scientific term for exceptionally high tide | NOAA National Ocean Service | Y (snippet) |
| Perigean spring tides 6–8 times a year | NOAA Tides & Currents FAQ (linked inline) | Y (snippet) |
| High tide flooding = sunny-day/nuisance flooding; ocean water over low areas, up through drains; increasing | NOAA NOS | Y (snippet) |
| Fort Lauderdale posts predicted king tide dates; wind/rain can push water higher | City of Fort Lauderdale King Tides page | Y (snippet). Specific 2026 dates not published in the post |
| Fresh-water-damaged car more repairable than salt-water; salt highly corrosive | AAA Flood Damaged Cars | Y (snippet) |
| 2015 NHTSA advisory: wash underside to remove salt; have brake lines inspected | NHTSA safety advisory, April 9, 2015 | Y (snippet via multiple news reports; no nhtsa.gov URL found, so not in the source list) |
| 12 in / 2 ft flood water | NWS | Y (snippet) |
| Extreme Tires brake repair and alignment (shop); rotation, balancing, TPMS (shop or van) | `src/data/services.js` | Y (site) |

## Blog: /blog/hydroplaning-broward-downpours

| Claim | Source | Verified |
|---|---|---|
| Rainy season May 15 to Oct 15; 60–70% of annual rainfall; near-daily storms | NWS Miami | Y (snippet) |
| June wettest, then September and August | NWS Miami | Y (snippet) |
| 75% of weather-related crashes on wet pavement, 47% during rainfall (10-yr avg 2007–2016) | FHWA Road Weather Management | Y (snippet). The older 73%/46% (2005–2014) figure was not used |
| Hydroplaning mechanism (water lifts tread when grooves can't clear it) | Discount Tire / Goodyear hydroplaning pages | Y (snippet), qualitative only |
| AAA 4/32, 87 ft, 43% | AAA Newsroom 2018 | Y (snippet) |
| Cruise control off; ease off gas, avoid hard braking, steer gently; more following distance; check tires, wipers, lights | AAA Club Alliance wet-weather advice | Y (snippet) |
| Headlights required during rain, smoke or fog | Fla. Stat. 316.217 | Y (snippet) |
| No hydroplaning speed or water-depth threshold | Plan rule | n/a (deliberately omitted) |

## Blog: /blog/bought-tires-online-install-broward

| Claim | Source | Verified |
|---|---|---|
| Ship-to-store free; shop calls when checked in; booking before arrival; old tires recycled | `src/pages/InstallPage.jsx` | Y (site) |
| Install covers dismount/disposal, mount, balance, valve stems, torque, TPMS reset; total confirmed first | InstallPage, `services.js` | Y (site) |
| Van cities; parking space + ~10 ft clearance; condo gate codes | `business.js`, MobileServicePage | Y (site) |
| Shop fits customer-supplied tires | InstallPage FAQ | Y (site) |
| Shipping 48 contiguous states + DC; install South Florida only | CLAUDE.md house rules | Y (site rules) |
| Match placard size, load, speed; load index ≥ placard | USTMA Replacing Tires | Y (snippet) |
| Date code format | Goodyear | Y (snippet) |
| Part 574 registration program | 49 CFR 574 / NHTSA | Y (snippet) |

## Blog: /blog/tesla-model-y-tires-guide

| Claim | Source | Verified |
|---|---|---|
| Rotate every 6,250 mi (10,000 km) or at a 2/32 in (1.5 mm) difference | Tesla Model Y Owner's Manual | Y (snippet) |
| Replace all four; early replacement in pairs unless others within 2/32 in | Tesla Model Y Owner's Manual | Y (snippet) |
| Use tires/wheels matching original spec; don't exceed speed rating | Tesla Model Y Owner's Manual | Y (snippet) |
| Tesla-approved tires carry Tx (T0, T1, T2); designed for noise, handling, ride, range | Tesla Model Y Owner's Manual | Y (snippet) |
| Acoustic foam and tread patterns dampen noise | Tesla-Designed Tires page | Y (snippet) |
| Optional repair kit for punctures under 6 mm, temporary | Tesla Model Y Owner's Manual | Y (snippet) |
| Some Model Y wheel packages are staggered (wider rear) | Tesla owner's manual wheel table (en_au snippet) | Y (snippet); no sizes printed |
| EV weight → XL/HL; instant torque; noise; rolling resistance | Michelin EV tires | Y (snippet) |
| HL carries more load than XL at same pressure | Michelin High Load Capacity page | Y (snippet) |
| No brands named or ranked | Plan rule | n/a |

## Claims dropped or rewritten because they could not be confirmed

- **Florida numeric tread-depth minimum.** Not stated anywhere; readers are told to check current Florida law.
- **"NHTSA says replace at 6 years."** Not used; age guidance is handed to the planned age guide.
- **Consumer Reports wet-braking figures.** The snippets conflicted (about 7% vs "100+ ft"), so only CR's quarter-test method is used.
- **Typical new-tire depth (10/32–11/32).** Only retailer and blog sources; left out of the tread chart.
- **UTQG traction coefficients (AA ≥ 0.54 asphalt / 0.38 concrete).** Only secondary sources; grades are described in words.
- **~1 psi per 10 °F rule of thumb.** Retailer source only; the TPMS guide uses NHTSA's qualitative wording.
- **Specific Model Y tire sizes and minimum load indexes.** Varied by region and model year in the snippets; readers are sent to the door placard and manual.
- **Tesla "up to 10% range gain" and "6 dB at 200 Hz" figures.** Manufacturer marketing, not needed; omitted.
- **Specific 2026 king tide dates.** Source page could not be pinned down with certainty; the post links the Fort Lauderdale page instead.
- **Lug nut re-torque at 50–100 miles, and the TIA "80% of wheel-offs" figure.** Retailer or secondary sources only; omitted.
- **Rinse "within 24–48 hours".** Detailing-blog figure; the post says "soon after".
- **Hydroplaning speed and water-depth thresholds.** Omitted per the plan.
- **"Leave the nail in the tire."** Not verified; removed from the hurricane post.
- **Broward evacuation routes (I-95, Turnpike, I-75) and zone letters.** Not verified; the post points to FDEM Know Your Zone instead.

---

# Batch 1 (Phase 3): claim verification

Prepared 2026-09-30 for the first Phase 3 batch (5 Learn, 5 Blog), publish date 2026-09-30.

## Method

- Same method as the pilot. **WebFetch was blocked again** (EGRESS_BLOCKED) on nhtsa.gov, ustires.org, tireindustry.org, michelinman.com and nicb.org, so every claim was checked with **WebSearch** against result text attributed to the listed source.
- **"Y (snippet)"** = the figure or statement appeared in search-result text attributed to that source (search-verified, not page-verified). **"Y (site)"** = stated on this site's own pages or data. **"Y (math)"** = arithmetic. **"Y (pilot)"** = verified in the pilot table above and reused unchanged.
- Where a snippet's wording could not be tied to a named source, the claim was dropped or written qualitatively (see the last section).

## Learn: /learn/florida/florida-heat-tires

| Claim | Source | Verified |
|---|---|---|
| Excessive speed, underinflation or excessive loading, alone or combined, can cause heat build-up and possible tire failure | NHTSA, Tire Safety: Everything Rides On It | Y (snippet) |
| Underinflation is the leading cause of tire failure | NHTSA Summer Driving Tips | Y (snippet) |
| Pressure changes 1 to 2 psi per 10 °F | USTMA Tire Care Essentials | Y (snippet, two searches) |
| Check cold = parked 3+ h; placard not sidewall; don't let air out of warm tires | NHTSA TireWise / Summer Driving Tips | Y (snippet; pilot) |
| Placard wording "The combined weight of occupants and cargo should never exceed…" | NHTSA placard rule (49 CFR 571.110, Federal Register 2002) | Y (snippet) |
| Aging from heat and oxygen (thermo-oxidative) | NHTSA tire aging research summaries | Y (snippet) |
| Sunlight, warmer climate, infrequent use, poor storage and maintenance contribute to aging | NHTSA TireWise | Y (snippet) |
| Tire aging a greater concern in the more southern parts of the Sun Belt | NHTSA TireWise / "Tire Aging: A Summary of NHTSA's Work" | Y (snippet). The nhtsa.gov copy of the summary was not found; cited to TireWise |
| Some makers recommend replacing at 6 to 10 years regardless of treadwear | NHTSA TireWise | Y (snippet) |
| Inspection yearly from 5 years (Bridgestone, Michelin) | Bridgestone Replacement Guidance; Michelin When to Replace | Y (snippet; pilot demo text) |
| UTQG temperature grade = ability to dissipate heat, A highest | NHTSA UTQG Consumer Guide | Y (snippet) |
| Temperature grade assumes a tire properly inflated and not overloaded | NHTSA brochure | Y (snippet) |
| UTQG exemptions (deep-tread winter, temporary spares, others) | 49 CFR 575.104 | Y (pilot) |
| Rotation measures tread at every corner; pressure set to placard; shop or van | `src/data/services.js` | Y (site) |

## Learn: /learn/age/how-old-is-too-old

| Claim | Source | Verified |
|---|---|---|
| Some vehicle and tire makers recommend replacing tires 6 to 10 years old regardless of treadwear | NHTSA TireWise | Y (snippet). Not written as an NHTSA rule |
| Bridgestone: inspect from 5 years; replace 10 years after manufacture regardless of tread; replace a spare over 10 years even if it appears new | Bridgestone Americas Replacement Guidance / Tire Inspection | Y (snippet) |
| Michelin: after 5 years, inspection at least yearly by a trained professional; replace 10 years after manufacture even if in good condition and above the wear bars | Michelin When to Replace Tires | Y (snippet) |
| Aging = changes from service, storage and environmental conditions | NHTSA TireWise | Y (snippet) |
| Check the date code when buying; know the vehicle maker's timeframe | NHTSA Tire Buyers' FAQ | Y (pilot) |
| 2/32 replacement line; look for bulges, cuts, cracks | NHTSA | Y (pilot; snippet) |
| Sun Belt / sunlight and warm climate | NHTSA TireWise | Y (snippet) |
| DOT date format; TIN may be on one side only | NHTSA, Goodyear | Y (pilot) |

## Learn: /learn/damage/tire-bubble-sidewall

| Claim | Source | Verified |
|---|---|---|
| Bulge generally indicates damaged cords from a severe impact; air pushes through damaged plies | Michelin, Symptom Bulge or Bubble | Y (snippet) |
| Pothole or curb impacts cause bulges | Michelin (UK and US sidewall pages) | Y (snippet) |
| Risk of rapid pressure loss if the bubble bursts | Michelin sidewall damage page | Y (snippet) |
| Can't be repaired; replace | Michelin | Y (snippet) |
| Change to the spare immediately and have the tire inspected | Michelin | Y (snippet) |
| Sidewall/shoulder punctures or cuts can't be repaired; that area flexes most and lacks tread-area reinforcement | USTMA Tire Repair Basics | Y (snippet) |
| Indentations are normal on radial tires where cords overlap | Michelin, Symptom Indentation | Y (snippet) |
| Replacement tires match placard size, load index, speed rating; load index ≥ placard; all four recommended, else same specs | USTMA Replacing Tires | Y (snippet) |
| Check for bulges, cuts, cracks when checking pressure | NHTSA TireWise | Y (snippet) |
| Mobile van installs tires at home or office; alignment at the shop | `services.js`, MobileServicePage | Y (site) |

## Learn: /learn/damage/patch-vs-plug

| Claim | Source | Verified |
|---|---|---|
| Repairs only in the tread area; puncture ≤ 1/4 in (6 mm) | USTMA Tire Repair Basics / Puncture Repair Procedures | Y (snippet) |
| Sidewall or shoulder punctures/cuts can't be repaired | USTMA | Y (snippet) |
| Rubber stem (plug) fills the injury and a patch seals the inner liner; only the combination is permanent; a plug alone is unacceptable | USTMA | Y (snippet) |
| Plug alone doesn't seal the innerliner; patch alone doesn't fill the void and lets water into the body | Tire Industry Association, Tire Repair | Y (snippet) |
| No repair where injury extends into shoulder/belt edge or at an angle into the shoulder | TIA | Y (snippet) |
| Tire must be removed from the rim and inspected, including the inner liner | USTMA | Y (snippet) |
| Never outside-in or on-the-wheel repairs; never repair a tire with an existing improper repair (scrap it); repairs can't overlap | USTMA Puncture Repair Procedures wall chart | Y (snippet) |
| Some makers restrict repairs on run-flat and other tires | USTMA | Y (snippet) |
| Plug = reamed hole, rubber cord pushed in from outside; patch applied inside | AAA Tire Plug vs Patch | Y (snippet) |
| Extreme Tires repair: dismount, inside inspection, combination patch-plug, rebalance, placard pressure; shop or van | `services.js` | Y (site) |

## Learn: /learn/pressure/tire-pressure-temperature

| Claim | Source | Verified |
|---|---|---|
| 1 to 2 lb per 10 °F, up when warm, down when cold | USTMA Tire Care Essentials | Y (snippet) |
| 1 to 2 lb per 10 °F | Goodyear news release, Nov 18, 2010 | Y (snippet) |
| About 1 psi per 10 °F | Bridgestone Americas, Tire Inflation | Y (snippet) |
| Tires lose about 1 psi a month on average | Bridgestone Americas, Tire Inflation | Y (snippet) |
| "As the outside temperature drops, so does tire inflation pressure" | NHTSA Winter Driving Tips | Y (pilot) |
| Cold = 3 h; don't bleed warm tires; placard not sidewall; monthly incl. spare | NHTSA | Y (pilot) |
| Worked examples (35 psi: +1.9 at 75→95 °F and 70→90 °F; −1.8 at 90→70 °F; −2.3 at 80→55 °F) | Gay-Lussac's law with 14.7 psi and 459.67 offsets | Y (math) |
| TPMS warns only at a large loss (25%) | FMVSS 138 | Y (pilot) |
| Extreme Tires puncture repair and TPMS service, shop or van | `services.js` | Y (site) |

## Blog: /blog/flooded-car-tires-wheels

| Claim | Source | Verified |
|---|---|---|
| Don't start a car right after a flood; water in the engine can cause more damage | AAA (Via, AAA Northeast) | Y (snippet) |
| Don't drive a flooded vehicle until a technician checks it; damage may not be visible | NHTSA Hurricane- and Flood-Damaged Vehicles | Y (pilot; snippet) |
| Li-ion vehicle: not in a garage or within 50 ft of a structure, vehicle or combustibles | NHTSA | Y (snippet) |
| Flood-damage signs: musty odors, water stains, rust, silt or mud, moisture | NICB news release | Y (snippet) |
| Floodwater contains oil, grease, salt, other contaminants; clean with mild soap and non-pressurized water, no pressure washer; inspect for cuts, tears, holes, scrapes; discard if damaged | Mickey Thompson tech bulletin | Y (snippet) |
| Salt water more corrosive than fresh | AAA Flood Damaged Cars | Y (pilot) |
| Replacement tires match the placard | USTMA Replacing Tires | Y (snippet) |
| Extreme Tires brake, suspension, alignment (shop); tire and TPMS service (shop or van) | `services.js` | Y (site) |
| Insurance | Not advised; readers are sent to their insurer | n/a (deliberately omitted) |

## Blog: /blog/storm-cleanup-nail-in-tire

| Claim | Source | Verified |
|---|---|---|
| Tread area only, ≤ 1/4 in; no sidewall/shoulder; dismount and inspect inside; plug + patch | USTMA | Y (snippet) |
| No repair into the shoulder/belt edge or angled into the shoulder | TIA | Y (snippet) |
| Plug alone unacceptable; tire with an existing improper repair must be scrapped | USTMA Puncture Repair Procedures | Y (snippet) |
| Tires lose about 1 psi a month on average | Bridgestone Americas | Y (snippet) |
| Monthly check for punctures, cuts, cracks, bulges | NHTSA TireWise | Y (snippet) |
| Extreme Tires repair process; shop or van; no availability promise after storms | `services.js`; pilot wording | Y (site) |
| Post-storm debris (roofing nails, screws) | General; no figure | Qualitative only |

## Blog: /blog/mobile-tire-install-condo-office

| Claim | Source | Verified |
|---|---|---|
| One parking space, ~10 ft clearance; driveway, street, office lot or jobsite; no garage or lift | MobileServicePage FAQ | Y (site) |
| Generator and work lights; rated jack, stands and cart | MobileServicePage features | Y (site) |
| Complex name, gate code, call-up instructions; some complexes want gate check-in or a visitor space | MobileServicePage FAQ | Y (site) |
| Four-tire install about 45–75 min; confirmation lists the estimate | MobileServicePage FAQ | Y (site). Duration only; no arrival windows |
| Mobile services vs shop-only services | `services.js`, MobileServicePage | Y (site) |
| Rain: short showers rarely stop work; lightning/heavy rain → call, pause, reschedule | MobileServicePage FAQ | Y (site). "Never charged for weather" not repeated |
| Old tires recycled; torque to spec; pressures to placard | MobileServicePage | Y (site) |
| Install area: 10 cities | `business.js` | Y (site) |
| TPMS required ≤ 10,000 lb GVWR from Sep 1, 2007 | FMVSS 138 | Y (pilot) |
| Match placard size, load, speed | USTMA Replacing Tires | Y (snippet) |
| HOA/condo rules | Not stated; "check your association's rules" | n/a |

## Blog: /blog/buy-tires-online-vs-local-shop

| Claim | Source | Verified |
|---|---|---|
| TireDrop ships from distributor warehouses; free shipping to 48 contiguous states + DC; checkout shows the delivery estimate | ShippingPage; CLAUDE.md | Y (site) |
| Ship-to-store free; shop calls on check-in; book ahead | InstallPage | Y (site) |
| UTQG grades assigned by the manufacturers | NHTSA UTQG guide | Y (pilot) |
| Florida $1 per new tire sold at retail; stated separately on the invoice | Fla. Stat. 403.718; FL DOR | Y (snippet) |
| Independent tire sellers must give buyers a registration form with the TIN recorded; online registration where the maker offers it | 49 CFR 574.8 / Federal Register | Y (snippet) |
| Match placard size, load, speed; load index ≥ placard | USTMA | Y (snippet) |
| NHTSA recall search | NHTSA recalls | Y (pilot) |
| Price comparisons | None made; readers compare installed totals themselves | n/a (deliberately omitted) |

## Blog: /blog/snowbird-car-sat-all-summer-tires

| Claim | Source | Verified |
|---|---|---|
| Tires lose about 1 psi a month on average | Bridgestone Americas | Y (snippet) |
| 1 to 2 psi per 10 °F | USTMA | Y (snippet) |
| Temporary flat-spotting from sitting; works out as tires warm | Michelin Tire Flat Spotting; Continental Flat-spotting | Y (snippet), qualitative |
| Infrequent use, sunlight, warmer climate contribute to aging; Sun Belt | NHTSA TireWise | Y (snippet) |
| Inspection yearly from 5 years; replace at 10 | Bridgestone, Michelin | Y (snippet) |
| Store tires away from sunlight, heat and ozone sources such as electric motors | Michelin Storing Tires | Y (snippet) |
| Mobile services and install cities | `services.js`, `business.js` | Y (site) |
| Snowbird population numbers | Not used | n/a |

## Batch 1: claims dropped or rewritten

- **"Leave the nail in the tire."** Still only on retailer and forum pages; not used in the nail post.
- **Flat-spotting "15–20 minutes" / "20 minutes at highway speed."** The snippet did not tie the figure to Michelin or Continental; the posts say the set works out "as the tires warm up".
- **"Tires lose 1–2 psi a month" (attributed to USTMA).** Attribution unclear; only Bridgestone's "about 1 psi a month" is used.
- **NHTSA "1 to 2 psi per 10 °F" in its summer tips.** The snippet mixed sources; the guides cite USTMA, Goodyear and Bridgestone instead.
- **The "77% of tire claims from five hot states" insurance figure.** Secondary to NHTSA's summary; omitted as the plan requires.
- **Plug-patch "one-piece unit pulled through from inside".** Attribution unclear; removed. Extreme Tires' own "combination patch-plug" wording is used instead.
- **Speed rating after a repair.** Not sourced (Cooper bulletin not confirmed); omitted.
- **"Hot brake rotors warp in cold floodwater" and "full check of brakes, bearings…" as AAA claims.** Attribution unclear; the post recommends a technician check in its own words, without attributing it.
- **"Don't charge a flooded EV."** Not tied to NHTSA in the snippet; only NHTSA's 50-ft parking guidance is quoted.
- **Mechanism details for bulges (tire pinched against the rim) and indentation shape.** Not confirmed from Michelin; removed.
- **"Most roofing nails are under 1/4 inch", "angled screws near the edge are common".** Unsourced; removed.
- **Hydroplaning guide (G26).** Not written this batch: pressure vs temperature could be sourced to USTMA, Goodyear and Bridgestone plus arithmetic, while hydroplaning's numeric claims (speed, water depth, CR distances) remain unconfirmed.
- **Keyword change:** the storm-nails post targets "roofing nail in tire" rather than the plan's "nail in tire", which the Learn plan assigns to the future /learn/damage/flat-tire-nail guide (G23).
