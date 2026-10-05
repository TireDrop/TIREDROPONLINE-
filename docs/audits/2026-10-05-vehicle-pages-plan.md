# Vehicle-by-vehicle tire size pages: plan, 2026-10-05

Branch `preview/wave3-vehicle-pages-plan`, by Atlas (research). Closes the research half of competitor gap 8 (local search depth). **Plan only: no pages are built and nothing outside `docs/` changed.**

## One-page summary

**Can we build "tire size for a 2021 Ford F-150" pages honestly? Yes, but not by printing sizes from the data we have today.**

- **There is no free, allowed source of factory tire sizes by year, make, model and trim.** NHTSA vPIC (makes, years, models, VIN decode) and fueleconomy.gov (engine, drive, mpg) do not publish them. The only complete sources are paid vehicle-fitment databases (licence terms to be read and confirmed in writing) and the vehicle makers' own owner's manuals and spec pages, which are free to read but have to be read vehicle by vehicle.
- **The table already in the repo must not feed pages.** `src/data/fitment.js` holds one "typical" size per model and generation for 45 models, taken from a third-party size-listing site whose licence nobody has read (its own header comment says trims still vary). It also conflicts with a maker page: for the 2021 F-150 it says `265/70R17`, while Ford's published 2021 spec sheet (search snippet) lists `245/70R17` as the standard tire and `265/70R17` only as an LT option on other packages. That is exactly the wrong-size-on-a-page liability this plan exists to avoid.
- **The brief's premise needs one correction:** there are no `/tire-size/<size>` pages. `/tire-size` is one calculator page driven by `?size=`; no route turns a size or a vehicle into its own page today. This would be the first page family of its kind.
- **Recommended path: A now, B where a maker source has been read.** Model pages (not model-year pages) that send the shopper to the door-jamb placard and the fitment check and print **no size**, plus a "what the maker lists" table on a page **only after** someone has read the maker's page and the quote and URL are stored with the row. A page with no read source stays `noindex` and out of the sitemap until it has one.
- **First batch: 15 models** (list in section 5), 14 of them in today's fitment table plus Tesla Model Y, which already has a sourced Learn guide. About 1 Forge task for the template, data file and tests; one Chrome session for Justin to read the maker pages for the sourced tables.
- **No new serverless function.** The site is at exactly 12 (the Hobby limit); static prerendered pages add none.
- **Nothing here could be read live.** vPIC, fueleconomy.gov, eCFR, Ford, Toyota and the vendors' own sites were all blocked by the network proxy. Every external claim below is **SNIPPET-ONLY** (search text from the official domain) or UNVERIFIED, and the claims ledger says which.

Decisions for Justin are at the end (section 9).

## 1. What the site has today

| Surface | Files | What it does with a vehicle or a size |
|---|---|---|
| Tire size calculator | `src/pages/tools/TireSizePage.jsx`, route `/tire-size` in `src/App.jsx` | One page. `?size=` and `?vs=` decode a sidewall size (width, aspect, rim, load, speed, diameter, speedo error). Seven-question FAQ, no vehicle data. Not a page-per-size family. Redirect from `/pages/tire-size` in `vercel.json`. |
| Vehicle picker | `src/data/vehicles.js`, `src/data/vehicleList.js`, `api/vehicles.js`, `api/_lib/vehicles.js`, `scripts/vpic-snapshot.mjs` | Year 1981-2027 and about 100 makes (curated list), models from NHTSA vPIC `GetModelsForMakeYear` (car, truck, mpv), asked in this order: our `/api/vehicles` (edge cached a day), vPIC direct, build snapshot `/data/vpic-models.json`, size-table models only. The file header says it plainly: "NHTSA does not publish tire sizes." |
| Typical-size table | `src/data/fitment.js` (`FITMENT`, `FITMENT_YEARS`, `FITMENT_TRIMS`) | 45 models, 10 makes (Toyota, Honda, Ford, Chevrolet, Nissan, Jeep, BMW, Mercedes-Benz, Hyundai, Ram). `FITMENT_YEARS` is one mainstream-trim size per generation, 2005-2026. `FITMENT_TRIMS` is **empty on purpose** ("a wrong 'fits' is worse than an honest 'check fitment'"). Source line in the file: a third-party trim listing, "checked September 2026". Licence unread. |
| Fitment check | `src/data/fitmentCheck.js`, `src/data/fitmentCheck.test.mjs`, `fitmentSelection.test.mjs`, `src/components/demos/fitmentLogic.js` | Pure functions. `factorySizes()`, `resolveSelection()`, `checkFit()` return `fits`, `no-fit` or `check`. A typical size says "Matches the typical factory size on file", never "Fits"; a model-level guess never blocks a sale; only a size the shopper confirmed (door-jamb entry or picked trim) can say "Doesn't fit". `fitmentLogic.js` also holds `FITMENT_BANNED = /\b(fits?\|approved?)\b/i` for demo copy. |
| Door-jamb flow | `src/components/shop/Fitment.jsx` ("Know your exact size?"), `src/context/VehicleContext.jsx` (`selectVehicle({..., size, rear})`), `src/pages/tools/TireSizeFinderPage.jsx` (`/tire-size-finder`: photo of door sticker, sidewall or VIN, or typed), `api/scan-tire-size.js`, `api/_lib/vpic.js` (VIN decode), `src/data/vin.js`, `src/data/sizeSource.js` | The shopper's confirmed placard size overrides the table. VIN decode returns year, make, model, trim, drive, body, never a size. Order attributes record the size source (`scan-door`, `door-jamb`, `vehicle`, ...). Setup and spend limit: `docs/integrations/tire-size-finder.md`. |
| Vehicle to shop link | `src/lib/tiresUrl.js` | `/tires?year=2019&make=ford&model=f-150` and `?size=265-70r17&rear=...` already exist, so a vehicle page can link into the shop with no new code. |
| Other vehicle pages | `src/content/learn/tesla/tesla-tire-sizes.md` | The one existing vehicle-specific size page: sizes by wheel option from the maker's owner's manuals, with a source per model. It is the house precedent for approach B. Also Learn: `how-to-read-tire-size`, `fitment/different-tire-size`, `fitment/staggered-tires`. |
| Page-family machinery | `scripts/generate-seo-files.mjs` (`allRoutes()` expands `CITY_PAGES`, `STATE_PAGES_LIVE`, products, content), `scripts/prerender.mjs`, `src/data/cityPages.js` + `cityPages.test.mjs` | Add a data file and one line in `allRoutes()` and a page family is prerendered, in the sitemap, and checked for h1, text length, canonical and unique titles. `EXCLUDE` plus a `noindex` flag already handle "built but hidden" (Spanish pages, `/compare`). |
| Function budget | `api/` | 12 serverless functions (10 top level, `cron/atd-sweep`, `webhooks/shopify`) = the Hobby limit. Pages must not need a function. |

No data in the repo links a vehicle to a size except `src/data/fitment.js` above. No vehicle-to-size data has a licence on file.

## 2. Data sources for factory tire sizes

Status key: **VERIFIED** = page read in full; **SNIPPET-ONLY** = search text from the official domain; **UNVERIFIED** = could not be seen, do not rely on it. Every fetch of these hosts returned "blocked by the network egress proxy", so nothing in this table is VERIFIED.

| Source | What it actually provides | Tire sizes? | Terms / licence | Coverage and updates | Key / contract | Status |
|---|---|---|---|---|---|---|
| NHTSA vPIC Vehicle API (`vpic.nhtsa.dot.gov/api`) | Makes, models for a make and year, VIN decode (year, make, model, series, trim, drive, body). The variable list has "Wheel Size Front/Rear (inches)" (wheel diameter only). | **No** | Free for public use as federal open data (snippet of the vPIC FAQ). Rate-limited by an automatic traffic control; batch jobs should run at night or on weekends. | `GetModelsForMakeYear` takes a model year "greater than 1995" (snippet), so the picker's 1981-1995 years may return no models from vPIC. Releases roughly monthly. | No key, no registration | SNIPPET-ONLY |
| NHTSA vPIC standalone database | The VIN-decoding database for local use (SQL Server and PostgreSQL), "limited to VIN decoding functionality only". Lite file dated 2026-08-14, 190 MB. | **No** | Same federal open-data posture; terms unread | Updated regularly (v4.05 on 2026-05-16, snippet) | None | SNIPPET-ONLY |
| fueleconomy.gov web services and CSV/XML download (EPA/DOE) | Year, make, model, engine displacement, cylinders, drive, fuel type, mpg and emissions fields. Useful to list the powertrain variants of a model. | **No** (no tire field seen in the field list) | Download page exists; a disclaimer page says documents may be freely used for non-commercial purposes. The terms for commercial reuse of the dataset are **unread**. | Annual; model years 1984 onward (not read this session) | No key for the download | SNIPPET-ONLY; licence UNVERIFIED |
| 49 CFR 571.110 (FMVSS 110), eCFR / Cornell LII / govinfo | The rule that requires the placard: on the driver's side B-pillar (alternates listed), showing capacity weight, seating, recommended cold inflation pressures and the manufacturer's recommended tire size designation for the original tires. | It defines **where the authority lives**; it is not a size dataset | US federal regulation, public | Current; eCFR updates continuously | None | SNIPPET-ONLY (three results from the official hosts, none opened) |
| NHTSA FMVSS 110 compliance test reports (`static.nhtsa.gov/odi/ctr/...`) | PDF test reports for a handful of vehicles per year. A 2014 report exists (title seen). | Probably, for tested vehicles only | Public | A few vehicles a year; not a dataset | None | UNVERIFIED (contents unread) |
| Maker owner's manuals and spec sheets: Ford support "What is the tire size for my Ford?" and 2021 F-150 technical specs, Toyota owner's manuals (`toyota.com/owners`, `assets.sia.toyota.com` PDFs), Tesla owner's manuals | The maker's own "Wheels and tires" or specifications section: original size by wheel or trim option. Ford's 2021 F-150 sheet snippet lists a standard `245/70R17` and about ten optional sizes. | **Yes**, the best source: it is the maker's statement for that year | Maker copyright. Reading and linking is free; sizes are facts, and the Tesla guide already cites them with the source named. Reuse terms **unread**. | Per model year, per vehicle, per maker (about 25 makers, hundreds of manuals). Updated each model year. | None | SNIPPET-ONLY. The Tesla manual URLs in `src/content/learn/tesla/tesla-tire-sizes.md` were used by an earlier Atlas task; not re-read here. |
| Vehicle-fitment databases: Wheel-Size API, Fitment Group, DriveRightData (Infopro), Tirelibrary API, RideStyler | Year, make, model, trim or modification, one or more wheel packages with OE tire sizes, staggered front and rear, load and speed index, bolt pattern. Plus sizes on some. | **Yes** | **By contract.** Wheel-Size's terms (snippet): catalog calls (makes, models, years, generations, modifications) may be stored for SEO within the plan; search calls "must be called only in response to a real user action" and "not by search robots, crawlers, spiders or parsing scripts". Tire sizes come from the search call, so **bulk-generating size pages from it is not allowed as written**. An "API for SEO" page exists on its site and was not opened. Others: terms by contract. | Vendor claims, not tested: Wheel-Size near-complete from 2000 (snippet), Fitment Group 1982 onward with nightly updates (snippet). No coverage numbers are given here. | Wheel-Size self-serve (published plans, a free sandbox that is not for production); the others sales-led | Vendor claims: SNIPPET-ONLY. Prices from an earlier Atlas read (2026-10-01, snippet): Wheel-Size Business $750 a year; re-check before any decision. |
| ATD Connect fitment service (distributor) | A SOAP `fitments` service: year, make, model, trim, trim option, plus sizes, VIN. | Probably | Public display rights **unknown**. Ask ATD. | Unknown | Dealer account | UNVERIFIED. Existing notes: `docs/integrations/atd.md`. |
| Florida DHSMV motor vehicle registration reports | County totals of autos and pickups by month | No | State public records | Monthly | None | SNIPPET-ONLY. No make-and-model breakdown found. |

**Bottom line on data:** a tire size is only publishable today from (1) the maker, read page by page, or (2) a paid database under a licence that explicitly allows stored, public, crawlable display. Neither exists in the repo.

### Claims ledger

| Claim | Source | Status |
|---|---|---|
| vPIC and fueleconomy.gov carry no tire sizes | vPIC API and downloads pages; fueleconomy.gov web-services page (field list) | SNIPPET-ONLY. Also stated in the repo's own `src/data/vehicles.js` and `api/_lib/vpic.js` headers, which an earlier task wrote from the docs. |
| vPIC is free, keyless and rate-limited | vPIC API FAQ page | SNIPPET-ONLY |
| `GetModelsForMakeYear` needs a model year above 1995 | vPIC API page | SNIPPET-ONLY. Run `vpic-coverage`-style checks from a machine that can reach it before relying on pre-1996 models. |
| The placard sits on the driver's side B-pillar and shows the recommended tire size and cold pressures | 49 CFR 571.110 S4.3 (eCFR, Cornell LII, govinfo results) | SNIPPET-ONLY |
| Ford's 2021 F-150 sheet lists 245/70R17 as the standard tire, with options up to 275/50R22 | Ford media-site 2021 F-150 technical specs (PDF) | SNIPPET-ONLY. Needs a page read before it is quoted anywhere. |
| The repo's 2021 F-150 "typical" size is 265/70R17 | `src/data/fitment.js`, `fitmentForYear("Ford","F-150",2021)` run in this worktree | VERIFIED (own code) |
| Wheel-Size search calls must be human-initiated; catalog calls may be stored for SEO | Wheel-Size API terms of usage page | SNIPPET-ONLY |
| Best-selling 2025 US models: F-Series 801,525; Silverado 577,434; RAV4 479,288; CR-V 403,768; Ram pickup 374,059 | Trade-press year-end roundups (an auto-buying site and a car-news site; the makers' own year-end sales releases are the primary source and were not found) | SNIPPET-ONLY. Fine for ordering a batch, not for printing on a page. |
| No source for South Florida sales by model was readable | DHSMV reports show county totals only | UNVERIFIED |

Conflict to flag: the repo table and the maker's sheet disagree on the 2021 F-150. Conservative wording is the door-jamb placard, and no size printed.

## 3. Approaches compared

| | Value | Risk | Build effort | Thin-content risk | Schema and internal links | How Forge builds it |
|---|---|---|---|---|---|---|
| **(a) Vehicle page, no size printed**: placard instructions, fitment-check link, shop link | Catches "tire size for a [vehicle]" searches and gives a route into the fitment check and the scanner. Zero fitment liability. | Lowest. The one risk is a page that promises an answer and gives none. | **S** | **High.** Fifteen pages that differ only by name read as templated doorway pages. Needs model-specific sourced content (a maker link, class notes, local lines) before it is indexed. | `WebPage` + `BreadcrumbList` (via `crumbs`) + `FAQPage` for the visible FAQ. Links to `/tires?year=&make=&model=` (`src/lib/tiresUrl.js`), `/tire-size-finder`, `/tire-size`, `/find-my-tires`, `/install`, `/mobile-service`, Learn `how-to-read-tire-size`. | A data file `src/data/vehiclePages.js` (plain data, no imports, like `cityPages.js`), one lazy page, one route `/tire-size/:vehicle`, one line in `allRoutes()`. Prerendered, so no function and no runtime fetch for the copy. |
| **(b) Pages listing the sizes the maker lists, by model-year range, where a source was read** | The real answer to the search. This is what the Tesla guide already does. Gives each page unique, sourced content, which is also the cure for thin pages. | Medium. A mis-copied size is a fitment problem. Controlled by storing `{ size, trim or wheel, years, url, quote, readOn }` per row and refusing to render a row without them. | **M** for the template; reading the sources is the real work (about 15 models times 3 to 5 model years, by hand) | Low once a page has a sourced table | Same as (a), plus a plain HTML table; do not add Vehicle or Product schema with sizes. | Same files plus a `sizes` array per page and a test that fails on a row with no source. Row source hosts must pass `isResourceHost()` in `src/lib/competitors.js`. |
| **(c) Trim-level pages** ("2021 F-150 XLT tire size") | The highest-intent search | **High.** Trim, wheel package, drivetrain and mid-year changes multiply the sizes; one wrong row is a liability. No licensed trim data exists. | **L**, and blocked on a paid, licensed dataset | Medium (fewer, but still near-duplicates) | Same as (b) | Do not build now. Revisit only with a contract that allows stored, public display (section 2). |
| **(d) Size-first pages** (265/70R17: vehicles known to use it) | A reverse index; the "vehicles that use this size" list is the thing shoppers ask | **High.** A list of vehicles next to a size reads as "these fit", and a long list is built from the same vehicle-to-size data we do not have. Also collides with `/tire-size/:vehicle` (same path segment) unless namespaced. | **M** | **High** (one page per size is a doorway pattern) | `ItemList` would claim fit; skip schema | Not now. Once (b) has sourced rows, a size page can list only the rows that name that size, with each row's source, under a different path (for example `/tire-sizes/265-70r17`). |

**Why not one URL per model year:** 15 models times about 10 years is 150 near-identical pages. Year goes inside the page (a year picker and sourced year sections), not in the URL.

## 4. Recommendation

**Build (a) as the template and (b) as its content, in that order, behind a per-page source gate.**

1. **One page per model**, path `/tire-size/<make>-<model>` (for example `/tire-size/ford-f-150`). `/tire-size` stays the calculator and becomes the hub: a short "Size guides by vehicle" list on that page links to the family.
2. **Source gate.** Each page row in `src/data/vehiclePages.js` has an optional `sizes` array. No row means no size is printed. A page with no sourced block gets `noindex` and stays out of the sitemap (`EXCLUDE`, as the Spanish pages do); a page with at least one sourced block and a maker link becomes indexable. This keeps thin pages out of Google by construction.
3. **Every size line carries its source on the page**: "Ford lists 245/70R17 as the standard tire on the 2021 F-150 (Ford, 2021 technical specifications)". Where the maker lists several sizes by wheel or package, the page lists them as the maker does, with a line that the car's own placard decides.
4. **Placard first, always.** The first block on every page is "Find your size in 30 seconds": the tire and loading label on the driver's door jamb or B-pillar (49 CFR 571.110 describes it), then three ways forward: type the size, scan the placard (`/tire-size-finder`), or run the fitment check on year, make and model.
5. **Never use `src/data/fitment.js` as a page source.** It stays what it is: a "check this" hint inside the shop, worded as "typical". Whether to keep or trim it is Justin's call (decision 5).

### First batch: 15 models

Chosen from national 2025 sales (SNIPPET-ONLY, section 2) plus what South Florida roads look like, which no readable data confirms, so the last eight are **Justin's judgement to confirm**. 14 are in the fitment table under the spelling shown; Model Y has a sourced Learn guide.

| # | Page | Table key | Why |
|---|---|---|---|
| 1 | Ford F-150 | `Ford\|F-150` | Top seller; conflict above makes it the first page to get right |
| 2 | Chevrolet Silverado 1500 | `Chevrolet\|Silverado` | #2 seller |
| 3 | Toyota RAV4 | `Toyota\|RAV4` | #3 seller |
| 4 | Honda CR-V | `Honda\|CR-V` | #4 seller |
| 5 | Ram 1500 | `Ram\|1500` | #5 seller (Ram pickup) |
| 6 | Toyota Camry | `Toyota\|Camry` | Best-selling car (snippet) |
| 7 | Honda Civic | `Honda\|Civic` | Judgement |
| 8 | Toyota Tacoma | `Toyota\|Tacoma` | Judgement |
| 9 | Chevrolet Equinox | `Chevrolet\|Equinox` | Judgement |
| 10 | Nissan Rogue | `Nissan\|Rogue` | Judgement |
| 11 | Honda Accord | `Honda\|Accord` | Judgement |
| 12 | Toyota Corolla | `Toyota\|Corolla` | Judgement |
| 13 | Hyundai Tucson | `Hyundai\|Tucson` | Judgement |
| 14 | Jeep Wrangler | `Jeep\|Wrangler` | Judgement |
| 15 | Tesla Model Y | none (guide: `src/content/learn/tesla/tesla-tire-sizes.md`) | Judgement; already sourced from the maker |

Sourced size blocks for batch 1: start with 1, 3, 4, 6 and 15 (five models, model years 2021-2025), read by Justin's browser (Chrome prompt below). The other ten ship as (a) pages and stay `noindex` until read.

### Page template outline

1. **H1:** "{Make Model} tire size". Eyebrow "Tire size by vehicle".
2. **Lede (2 sentences):** the size depends on year, trim and wheels; the placard on your door jamb is the authority.
3. **Find your size in 30 seconds:** where the placard is (driver's door jamb or B-pillar), what to read, link to `/tire-size-finder` (photo or type), and "Know your size? Shop by size" to `/tires?size=` (only after the shopper types it; never prefilled).
4. **Check fitment for your {Model}:** year picker, then the existing fitment answer, linking to `/tires?year=&make=&model=`. States that a model-level answer is "typical" and the placard decides.
5. **What the maker lists** (only when sourced): the table with year, trim or wheel, size, source line, and "last read" date. Absent otherwise (the block is not rendered at all, no empty heading).
6. **{Model}-specific notes** (sourced only): body class and tire type (P-metric vs LT, `learn/buying/lt-vs-p-metric`), staggered or not for models where the maker says so, and a link to the maker's owner's manual page as a resource.
7. **Three ways to get them:** ship free to the shop in Sunrise and have them fitted (`/install`); mobile van fitting in Miami-Dade, Broward and Palm Beach (`/mobile-service`); or free shipping to your address, 48 contiguous states and DC (`/shipping`). Wording confirms the fitting is only in the three counties. Facts from `src/data/business.js` only.
8. **FAQ (visible, 4 questions, `FAQPage` schema):** What size tires does a {Model} take? Where do I find the right size? Can I use a different size? Do the front and rear tires have to match? Answers reuse the published `TireSizePage` FAQ wording where it fits.
9. **Related:** Learn guides (`how-to-read-tire-size`, `different-tire-size`), `/tire-size`, `/find-my-tires`, three nearest-class pages in the family.

### Title and meta pattern

- Title: `{Make Model} Tire Size by Year | TireDrop`. Longest in the batch ("Chevrolet Silverado 1500 Tire Size by Year | TireDrop") is 53 characters.
- Meta: `What tire size does a {Make Model} take? It varies by year, trim and wheels. Read your door-jamb placard, check fitment and shop by size.` Longest is 149 characters.
- Both are unique per page by construction; the test below enforces 60 and 155.

### Guardrails (all enforced by tests, not by memory)

- Never print a size without a source row (`url` on a maker or government host, an exact `quote`, `readOn` date, `readBy`).
- Fixed wording: "check your door-jamb placard". Never "safe", "OK", "fine", "approved", "guaranteed", or "fits" (the fitment code says "Matches the typical factory size on file"; the pages use the same line).
- No deals, no "since", no dates or arrival times, no owner names, no competitor names or links, no "safe to drive".
- No Vehicle, Product or Offer schema carrying sizes. Only `WebPage`, `BreadcrumbList`, `FAQPage`.
- A page with no sourced block is `noindex` and out of the sitemap.
- Local lines (hours, address, coverage) come only from `src/data/business.js` and `src/data/serviceArea.js`.

### Tests Forge would add

- `src/data/vehiclePages.test.mjs` (in `npm run test:data`): unique slugs and titles; title at most 60 and meta at most 155; every `sizes` row has `url`, `quote`, `readOn`, `readBy`; the row's host passes `isResourceHost()`; every size parses with `readSize()`; copy contains none of the banned words (`/\b(safe|ok|fine|fits?|approved?|guaranteed)\b/i`, plus the `FITMENT_BANNED` regex); no two pages overlap by more than a set share of their text (as `cityPages.test.mjs` does); every `tableKey` that is set exists in `FITMENT`.
- A check that no page prints a size that appears nowhere in its own `sizes` rows (guards against a hand-typed size in the copy).
- `scripts/prerender-check.mjs` extended: each vehicle route has an h1, its own canonical, `noindex` exactly when it has no sourced block, and is in the sitemap exactly when indexable.
- Fast gates for the build task: `check:prerender`, `check:a11y`, `check:search`, `check:home` (the hub list), `check:forms` only if the pages add a form, plus lint, all unit tests, build, schema and sources.

## 5. How Forge builds it inside the current limits

- **Functions:** none new (12 of 12 used). The year-to-model list reuses `/api/vehicles`.
- **Prerender:** 15 more routes through `allRoutes()` is trivial; at 150 or more, measure the build first (not measured here).
- **Bundle:** one lazy page chunk, data file loaded only by that chunk.
- **Routing:** `/tire-size/:vehicle` is added next to `/tire-size`; add the dynamic route after the static one. The `:vehicle` param must be validated against the data file so unknown slugs 404 (the prerender already fails a route that renders the 404 page).
- **Sitemap:** `EXCLUDE` gets the `noindex` slugs; the others are listed with a `lastmod` from the data file's git date.

## 6. Sources to read (ready-to-paste Chrome prompt for Justin)

Only Justin's browser can read these pages today. Prompt (paste into Claude in Chrome):

```
Open each page below in turn. For each vehicle and model year 2021 to 2025, find the maker's own list of original tire sizes (the "Wheels and tires" or "Specifications" section of the owner's manual, or the maker's official specification sheet). Use only the maker's website. Do not use a retailer or a size-listing site.
For every size you find, record: vehicle, model year, trim or wheel package if named, the size exactly as written (for example 245/70R17), the exact sentence or table row it came from (copy it word for word), the page address, and today's date.
Vehicles: Ford F-150, Toyota RAV4, Honda CR-V, Toyota Camry, Tesla Model Y.
If a page needs a login, shows a size only for a trim you cannot tell apart, or the manual for a year is missing, write "not found" for that year and move on. Do not fill gaps from memory. Stop and tell me if a site asks for payment or personal details.
Return one table with those columns and nothing else.
```

If two maker pages disagree for one year, record both and flag it; the page will carry neither size until the placard question is resolved.

## 7. What I could not verify

- Every external source above was blocked by the network proxy; nothing is VERIFIED. All vendor coverage and price statements are vendor claims seen in search text. No coverage percentages are given because none could be measured.
- Whether pre-1996 model years return models from vPIC (one snippet says the endpoint needs a year above 1995).
- The reuse terms of any maker's manual, the fueleconomy.gov data terms, and the Wheel-Size "API for SEO" page.
- South Florida sales by model. The five top sellers are national and from trade press.
- Whether `FITMENT_YEARS` is wrong elsewhere. One conflict was found (2021 F-150); the table was not audited row by row.

## 8. Incidental findings (no change made here)

- The FAQ in `src/pages/tools/TireSizePage.jsx` says a staggered rear tire "is fine, because it is the design". The house rule avoids "fine" and "OK" claims about tires. Worth a copy pass.
- `src/data/fitment.js` cites a third-party size-listing site by name in a comment. Even if that stays, the licence question (decision 5) applies to it.

## 9. Decisions I need from Justin

1. **Go or no-go** on building the template and the 15 pages (about one Forge task), with unsourced pages kept `noindex`.
2. **Confirm or swap the first batch.** Models 7 to 15 are my judgement. Do you have a Florida sales or registration source, or your shop's own best-sellers by model? That beats anything here.
3. **Run the Chrome prompt in section 6** for the five sourced models, or pick a different five. Without sources, no size is printed.
4. **Paid data:** do you want me to ask the vendors, in writing, whether they allow stored, public, crawlable size pages (Wheel-Size's own "API for SEO" page first), and ask ATD the same on the next call? Nothing is bought without your yes.
5. **The existing typical-size table:** keep it as a "typical size" hint inside the shop, trim it to models you are comfortable with, or retire it? It conflicts with the maker on the 2021 F-150.
6. **Indexing rule:** is "at least one maker-sourced block plus a maker link" the right bar before a page may be indexed?
7. **"Three install options" wording:** I read this as ship to the shop and fitted in Sunrise, the mobile van, and free shipping to your own address with no fitting from us. Right?
8. **Hub:** list the vehicle pages as a section on `/tire-size`, or give them their own hub page?
