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
