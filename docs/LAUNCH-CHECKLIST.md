# TireDrop Launch Checklist

Justin's master to-do list. **Update this file every time a task finishes.**
Done items get ticked AND struck through (`- [x] ~~item~~ (commit or date)`).
Open items stay `- [ ]`. Add new items to the right section; don't delete
done items. Show Justin the updated list, in this style, whenever it changes.

_Last updated: 2026-10-02, evening (blog reworks #32/#42 on preview/blog-rework, #37 dropped; ATD call held: site approval and API credentials pending at ATD. SHIPPED to main today: team build d2ba501 (blog batch 5, Learn gap fill C, tire page + cart, page speed, QA, search, Windows dev); resources only + check:sources; wave 2 (quote form, installed price, blog batch 3, a11y 0 issues, check:links); blog batch 4; check:forms 271s → 83s)_

## Site fixes (Claude)
- [x] ~~Ship the 2026-10-02 team build to main (all 22 gates pass on the merged build; Justin said "ship it")~~ (`d2ba501`, shipped to main 2026-10-02)
- [x] ~~QA sweep: 174 pages at 390 and 1280, nothing blocks buying; fixed "On this page" links hiding under the sticky header (48 links, 17 pages), desktop menu staying open on Tab/Escape, phone menu and filter sheets letting Tab escape, focused fields hidden behind the phone call bar; keyboard checks added to check:a11y~~ (`9a809f3`, `5236ed0`, `ef5315f`, `ff77416`, `d26c21e`, shipped to main 2026-10-02)
- [x] ~~Checkout keeps the cart when the order request doesn't reach the shop (calm alert, nothing charged, retry); check:forms covers it (115 checks)~~ (`c4c65e7`, shipped to main 2026-10-02)
- [x] ~~/tires: a partial size from the search (`?w=245&a=40`) wins over a remembered size (title, fit answers and results all follow it)~~ (`dcf13fa`, shipped to main 2026-10-02)
  - [ ] Justin: a remembered vehicle with a door-jamb size that the partial size contradicts still shows "Not your size": drop the door-jamb size in that case, or keep it?
- [x] ~~Search: "flat tire" shows Tire Repair again (new flat-tire articles had pushed it out of the typeahead); a page's keyword phrase now counts like a title match~~ (`bcaef07`, shipped to main 2026-10-02)
- [x] ~~Windows: the build and every browser check now run on a Windows PC (file-URL imports, vite preview start/stop, CSP test line endings)~~ (`75b8ec3`, `07bb9fe`, `c994784`, shipped to main 2026-10-02)
- [ ] Justin: is `helpcenter.kmcwheels.com` a resource or a competitor? (`src/lib/competitors.js`; check:sources warns until it's listed)
- [x] ~~check:forms 271s → 83s, same assertions (113 checks, 4 at a time; FORMS_SHARD=k/n to split)~~ (`31b614a`, branch preview/forms-split)
- [x] ~~Resources only: every competitor citation/link replaced with maker, AAA or government sources~~ (`7754330`, shipped to main 2026-10-02)
- [x] ~~Form fix: every form keeps typed values, plus the /schedule early-submit bug~~ (`2b2bd66`)
- [x] ~~Privacy policy: newsletter, form storage in Shopify, GA disclosed~~ (`a6a5b0c`)
- [x] ~~Docs: "no cookies / no analytics" claims fixed~~ (`cef543a`)
- [x] ~~GA4: correct page titles on route changes~~ (`08df057`)
- [x] ~~robots.txt: Google allowed to crawl~~ (`9719552`)
- [x] ~~Site audit saved~~ (`f2d786e`, docs/audit/2026-09-29-site-audit.md)
- [x] ~~Rule fixes: APR/"no interest" removed, volume pricing removed, tax "calculated at checkout", preferred pickup day (no firm date), honest Reviews + "Example" Gallery~~ (`aefaed6`…`006010f`)
- [x] ~~Instant order alerts: Shopify → Vercel webhooks~~ (`0fa9a6e`)
- [x] ~~Track My Order page `/track`~~ (`3f07766`, `ccdf679`)
- [x] ~~Track Order / Account links in header, menu and footer~~ (`74d5811`, `b4f456b`)
- [x] ~~Newsletter: pop-up removed; calm "TireDrop emails" sign-up in the footer; privacy policy updated~~ (2026-09-30)
- [x] ~~Year/Make/Model dropdowns in checkout + /schedule forms~~ (e6109d4, 2026-09-30)
- [x] ~~/track: typed order number + email no longer cleared when the app starts over a prerendered page~~ (2026-09-30)
- [x] ~~Post-payment install scheduling handoff~~ (f705e25, 2026-09-30)
- [x] ~~Install booking tags the order install-booked~~ (f774c41)
- [x] ~~Mobile/install area: Miami-Dade, Broward, Palm Beach~~ (f8a053c)
- [x] ~~Exclude non-Palm-Beach 334 ZIPs (33440, 33455, 33471, 33475) + server-side ZIP check for bookings~~ (6e256ba)
- [x] ~~Arrival wording: "We confirm an arrival window when we book"~~ (be6a2a2)
- [x] ~~Repo organized: docs map, audits/archive, README guide~~ (c5846e7, 2026-09-30)
- [x] ~~404 heading: "fine" removed~~ (ded56ec)
- [x] ~~Fitment confidence: badge + no Add on won't-fit + Compare same-size + year-aware search~~ (347c4e1, shipped 2026-10-01)
- [x] ~~Fitment: stop blocking tires on a model-level guess; door-jamb size entry (front/rear)~~ (dee5157)
- [x] ~~6 new tools (load/speed, plus-size, pressure-temp, repair check, shaking checker, rotation) with their own pages + article embeds~~ (shipped 2026-10-01)
- [x] ~~Language button: translate any page (Google element + translate.google.com fallback)~~ (c05e3ac)
- [x] ~~Spanish tab labels overflow the home finder on phones (SearchPanel whitespace-nowrap) → let tabs wrap below md~~ (c05e3ac)
- [x] ~~Compact mobile-first footer: contact row first, collapsible link groups, 62% shorter on phones (1621 → 608px), check:footer guards it~~ (a18b709, shipped to main 2026-10-02)
  - [x] ~~Footer link label "Tires Shipped Nationwide" → say 48 states + DC~~ (a04b749, shipped to main 2026-10-02: "Shipping to 48 States + DC" in the footer, breadcrumbs and CTAs; home and hub SEO titles add "(48 states + DC)"; footer 927px at 390, unchanged)
- [x] ~~check:sources gate: competitor links, mentions and meta tags fail the build; required in every gate run~~ (`0b1172b`, shipped to main 2026-10-02)
  - [x] ~~Source decisions: Wheel Pros / KMC (wheel makers) and legalclarity.org kept as resources; cleanairforce.com (Georgia emissions program) added as a resource~~ (2026-10-02)

## Admin (Justin)
- [x] ~~One prompt pack for every item only Justin can do~~ (`5fae72e`, shipped to main 2026-10-02: docs/prompts/2026-10-02-justin-remaining.md)
- [x] ~~GA: "Page changes based on browser history events" OFF~~ (2026-09-29)
- [x] ~~Search Console: domain verified, sitemap submitted, robots.txt re-fetched~~ (2026-09-29)
- [x] ~~Business Profile: tiredroponline.com added as a booking link (main site kept)~~
- [x] ~~Shopify Payments: payouts daily, test mode OFF, statement "SP TireDrop"~~
- [x] ~~Apps: Inbox and Appointo not installed~~
- [x] ~~Sender email info@tiredroponline.com authenticated~~
- [x] ~~Shopify app + Vercel keys + "Website lead alert" Flow~~
- [x] ~~Newsletter pop-up test passed~~
- [x] ~~Tipping removed from checkout~~ (Justin, 2026-09-30)
- [ ] Footer sign-up test: sign up once with a test address; the Shopify customer is tagged `newsletter`, `footer`, `vercel` (was `popup`; update any Shopify segment that filters on `popup`) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A12)
- [x] ~~Go-live test: contact form (lead + Flow)~~ (2026-09-30)
- [x] ~~Go-live test: order-request draft #D2 + /track shows it~~ (2026-09-30)
- [x] ~~Go-live test: $1 order #D1~~ (replaced by the $1 install tests #D3/#D4 below; delete drafts #D1/#D2)
- [ ] Go-live test: email folders + SPF/DKIM/DMARC (blocked: Outlook needs info@ sign-in) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A3)
- [ ] Google: retry "Request indexing" (robots.txt delay) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A8)
- [ ] 2-step login for all Shopify staff (Melissa keeps full access) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A16)
- [ ] Someone can sign into Outlook as info@tiredroponline.com → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A2)
- [ ] SPF/DMARC: fix only if the Gmail test fails (never add a 2nd DMARC record) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#C8)
- [ ] HSTS preload: decide whether to add `preload` and submit to hstspreload.org (hard to undo; docs/ops/deploy.md) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#D10)
- [ ] Justin: enable Spanish in Shopify Settings → Languages (checkout) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A13)

## Next phase (Chrome prompt after the builds land)
- [x] ~~Webhooks: 2 in Shopify, signing key into Vercel, redeploy, test (prompt 21)~~ (2026-09-30: 2 webhooks configured, test notifications 200)
- [x] ~~Prompt 22: email button + High-risk order review (tag, hold, email) + Needs scheduling alert (order paid → 24h → not install-booked)~~ (Justin, 2026-09-30)
- [ ] Re-run prompt 15 (local vs ship block was never saved; paste it right above the new install button) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A5)
- [ ] Prompt 23: add 33440, 33455, 33471, 33475 to the "Order routing: local vs ship" Flow ZIP condition (and to the email block if prompt 15 is already saved) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A5)
- [ ] Prompt 24: "Website lead alert" reads the lead from the `tiredrop.last_lead` metafield (not `customer.note`), new last line; then the two-message test → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A4)
- [ ] $1 install test: pay #D3 and book it on /track → tags flip + [BOOKED] to info@ + no [SCHEDULE] after 24h; pay #D4 and don't book → [SCHEDULE] after 24h; then refund both (drafts created 2026-09-30) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A1)
- [ ] Confirm info@tiredroponline.com receives Shopify mail (test emails go to the logged-in staff account) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A3)
- [ ] Justin: INSTALL_BOOKING_URL after the Tire Guru call (booking link → set it in Vercel and redeploy; API → tell Claude, it's a follow-up build; see docs/integrations/install-scheduling.md) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#C4)
- [ ] `/track` tested with the $1 order → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A1)
- [ ] Header links checked on desktop and phone → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A14)
- [ ] Checkout branding (prompt 20) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A11)
- [ ] GA4: mark generate_lead, order_request and install_booking as Key events (prompt 25) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A7)
- [x] ~~Publish EDIT HERE (shop. storefront → main-site redirect is live)~~ (2026-09-30, theme 166982615192)
- [x] ~~Redirect test: shop. pages → tiredroponline.com; checkout, /account and invoices stay on Shopify~~ (2026-09-30)

## Before real paid orders (Claude)
- [ ] Bill installation on the invoice → prompt in docs/prompts/2026-10-02-justin-remaining.md (#D2)
- [ ] Ship-to-store flow: address, emails, alerts → prompt in docs/prompts/2026-10-02-justin-remaining.md (#D4)
- [ ] Fitment hold before orders go to ATD → prompt in docs/prompts/2026-10-02-justin-remaining.md (#D3)
- [ ] "Tires arrived at the shop" notice → prompt in docs/prompts/2026-10-02-justin-remaining.md (#D4)
- [x] ~~Checkout spam guard, and no writing into other customers' notes~~ (7cc12f2)
- [x] ~~No Add button on won't-fit tires; Compare crowns same-size tires only~~ (347c4e1)
- [x] ~~Year-aware fitment on /tires~~ (347c4e1)

## Quick wins (Claude)
- [x] ~~Phone bottom bar changes by page~~ (c541339)
- [x] ~~Pop-up off shop pages~~ (2026-09-30: superseded, the pop-up is gone)
- [x] ~~Google search-result data: breadcrumbs (one per page, matching the visible trail), FAQ (kept where it was), article author, `npm run check:schema` gate~~ (27d477c)
- [ ] Google search-result data: map coordinates. Waiting on Justin's Google Maps pin; paste it into `geo` in `src/data/business.js` → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A9)
- [x] ~~Accessibility fixes + skip link~~ (c541339)
- [x] ~~Security headers: CSP, HSTS, Permissions-Policy~~ (abcf645; CSP is report-only for now)
- [x] ~~GA4 conversion events~~ (abcf645)
- [ ] Switch the CSP from report-only to enforced after a week of clean `[csp]` logs (docs/ops/deploy.md, "Security headers") → prompt in docs/prompts/2026-10-02-justin-remaining.md (#C9)
- [x] ~~NHTSA lookup timeout~~ (c541339)
- [ ] Returns window + warranty/road-hazard links → prompt in docs/prompts/2026-10-02-justin-remaining.md (#D1)
- [x] ~~"Continental US" wording (~40 places) → "48 contiguous states + DC"~~ (c541339)
- [ ] Shopify theme copy still says "continental United States" (shop. redirects to the main site, so it does not render; update the draft theme only if the redirect ever comes off) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#C10)
- [ ] Homepage reviews card: use a real Google review link (it currently points at a Maps search) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A9)
- [x] ~~Accessibility, second pass: heading order on the Learn hubs, /blog, /wheels and /compare, and a blank first column heading in the UTQG table~~ (a04b749, shipped to main 2026-10-02: 0 axe issues on 24 routes at 390 and 1280, down from 25; also named the compare tray landmark and four more blank table headings; `npm run check:a11y` now covers 22 routes at both widths plus 18 at 390)
- [x] ~~CRO quick wins: hero to results, phone cart Checkout, install price shown, 48 states + DC on cards~~ (shipped to main 2026-10-02, release preview/release-2026-10-02)
- [x] ~~CRO fixes 1 + 4: size quote form on zero results, compact /tires header, Cart in the /tires bottom bar; "free install" wording priced or dropped~~ (baaf32c, shipped to main 2026-10-02)
  - [ ] Send one real size-quote lead and confirm it lands in Shopify (tag `lead-size-quote`) and reaches info@ through Flow
  - First tire card with a vehicle in the URL (2019 F-150): 1,199 → 742 px at 390x844, 1,066 → 701 px at 1440x900 (size URL 225/50R17: 1,080 → 684 and 1,046 → 681)
  - New lead type `size-quote` (tag `lead-size-quote`) goes through the same Shopify → Flow → info@ path; GA4 `view_search_results { results }` counts the zero-result searches
  - Free-install leftovers (fix 5): About, Wheels, Install, Commercial, product, checkout and home meta, the /tires shipping band, state/city/search copy and 7 articles now show the install price from the service catalog or drop the free claim

## Big upgrades (Claude)
- [x] ~~Tire page + cart: fit answer on the first phone screen, spec tiles (load in lbs, speed in mph, UTQG, warranty), phone buy bar whenever Add to Cart is off screen (real total, "Added · View cart", won't-fit reason), cart total + Checkout right after the items on phones, 44px steppers, ship-or-install choice says South Florida up front with the install total~~ (`cd468e1`, `e47e38c`, `3c21331`, `b353beb`, `80be0ab`, preview/team-2026-10-02; before/after screenshots kept outside the repo)
  - [ ] Justin: the empty-cart phone bar still offers Checkout (dead end): let the bar read the cart? Show the phone buy bar on desktop too (Add to Cart sits ~1,800px down)? Move the cart's vehicle fit summary below the items? Remove the now-unreachable "Finish this by phone" checkout screen?
- [x] ~~Page speed: home page split out of the main bundle, 240px logo (66.7 → 32.9 KB), city copy and search matching kept out of every page; main JS 158 → 113 KB gzipped; home TBT 390 → 146 ms, blog/Learn TBT about 60% lower, LCP 100-320 ms faster (4x CPU, slow 4G)~~ (`1e46c03`, `c31f6d1`, `cc40c42`, `40f2b3a`, shipped to main 2026-10-02)
  - [ ] Justin: OK to self-host the Google fonts (118 KB plus a render-blocking stylesheet)? The CSP already allows it
- [x] ~~Home page redesign: flow + scroll transitions, with check:home guarding section order, no-JS and reduced-motion visibility~~ (037b6d6, shipped to main 2026-10-02)
- [x] ~~Prerender pages for Google (covered by Blog + Learn Phase 0)~~ (be6a2a2)
- [x] ~~Hero finder goes straight to results~~ (preview/cro-quick-wins ada78a9)
- [x] ~~Remember vehicle (no pop-up after first entry) + shareable /tires URL filters~~ (preview/remember 9be62b0, shipped to main 2026-10-01)
  - Filters: season, tire type, brand, price per tire, speed rating, load index, load range, treadwear warranty, sort by warranty / brand. Skipped for lack of data: EV-ready, XL on passenger tires, run-flat (appears automatically once a run-flat tire is listed)
  - [x] ~~/tires Shop by Vehicle (and its Change) use the full lists, not the catalog's 10 makes / 45 models: years 1981-2027, every make sold that year, every model NHTSA lists (BMW: 3 Series, 4 Series, M3, X5, X7…); Model box filters as you type and takes a typed model~~ (preview/remember e8f1d6f)
  - [x] ~~Model lists hold up: `/api/vehicles` asks NHTSA with a timeout and is cached at Vercel's edge for a day; the build saves a snapshot as the fallback; when nothing loads the finder says "Couldn't load models. Type your model or enter your door-jamb size."~~ (preview/remember e8f1d6f)
  - [x] ~~Production build log shows `[vpic-snapshot] wrote dist/data/vpic-models.json: 59 makes, 1506 models` (12 makes missed)~~ (checked 2026-10-02, deploy 22af9f9)
  - [ ] Shopify theme's `td-vehicles.js` still asks NHTSA straight from the browser and falls back to the 45-model table; point it at `/api/vehicles` (draft theme only) if the theme finder is ever shown again → prompt in docs/prompts/2026-10-02-justin-remaining.md (#C11)
  - [x] ~~A shared /tires link spells a model the size table doesn't know from the URL ("cx-5" shows as "Cx-5"); the saved pick keeps the right spelling~~ (b823577, shipped to main 2026-10-02: reads as CX-5, RAV4, 4Runner; NHTSA's spelling once the model list answers)
- [ ] Book an install time at checkout → prompt in docs/prompts/2026-10-02-justin-remaining.md (#C5)
- [ ] Fitment by trim + staggered (logic + badge shipped in 347c4e1; trim and staggered sizes need real data: ATD fitment or a fitment API) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#C3)
- [x] ~~Installed-price toggle: "Show installed price (Miami-Dade, Broward, Palm Beach)" on /tires cards and tire pages, tire + installation = total for one tire and a set of 4, price from services.js, remembered, display only (cart unchanged), GA4 `installed_price_toggle`~~ (42d49d2, shipped to main 2026-10-02)
- [x] ~~Tire Size Finder scanner (door sticker / sidewall / VIN), one camera, Scan button in the home hero and /tires~~ (preview/scanner, shipped to main 2026-10-01; steps: docs/integrations/tire-size-finder.md)
  - [x] ~~Justin: Anthropic key `tiredrop-vercel-scanner` in Vercel (Sensitive, Production + Preview), $25 monthly spend limit, auto-reload on~~ (2026-10-01)
  - [x] ~~Guardrails: key read only server-side; per-IP limit 5 scans / 10 min; photo ≤3 MB (under Vercel's 4.5 MB body limit) and JPEG/PNG/WebP checked by bytes; 401/403/429/529 logged with a hint, never the key; "busy" and "isn't working" messages for shoppers~~ (preview/scanner)
  - [x] ~~Phones: the camera opens on the first tap (Scan, Retake)~~ (preview/scanner eeca955)
  - [x] ~~One camera for all three: a single "Scan a photo" (door sticker, sidewall or VIN), the server works out which (`mode: "auto"`, no nullable schema fields); Scan button in the home hero and on /tires, photo handed to the finder~~ (preview/scanner)
  - [x] ~~Justin tested real photos on the preview: works; logs show `mode=auto:door outcome=read confidence=high` (3.9-8.2 s)~~ (2026-10-01)
  - [x] ~~"ship scanner": all 18 gates pass on the merge with search~~ (2026-10-01)
  - [x] ~~Orders carry the fitment: Vehicle / Size source / Front / Rear / Fitment attributes + fitment-check, staggered, size-scanned tags; ATD forwarder skips fitment-check~~ (preview/fitment-attrs 8e9459b, shipped to main 2026-10-01)
  - [ ] Justin: run Shopify admin prompt 26 (Flow "Fitment check + scanner tags": hold + email) → turn it on → $1 staggered test → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A6)
  - [ ] Rotate the key before it expires 2026-10-31 (calendar reminder Oct 24; steps in docs/integrations/tire-size-finder.md) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#C6)
- [ ] Local city pages: wave 1 (7 cities) live 2026-10-01; wave 2 next → prompt in docs/prompts/2026-10-02-justin-remaining.md (#C7)
- [x] ~~Nationwide hub + 7 pilot state pages (FL, GA, TX, CA, NY, NC, CO) live~~ (preview/states 62fbb42, shipped to main 2026-10-01)
- [ ] Roll out the remaining states in batches (each fact read on its source before it renders) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#D9)
- [ ] Search Console: submit /tires-shipped and the 7 state pages → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A8)
  - [x] ~~Fact-check: 40 facts read against their official sources (27 confirmed, 13 corrected incl. the same claims in FAQs and paragraphs); every pilot fact now `fetched`, preview-only switch off~~ (2026-10-01)
  - [x] ~~"ship states": all 18 gates pass~~ (2026-10-01)
- [ ] Real review collection (no stars until real reviews exist) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#D7)
- [x] ~~Store-wide search with typeahead: sizes in any spelling, vehicles, brands/types, tires, 91 pages; /search results page; GA4 `search` + `search_suggestion`~~ (preview/search 1214d45, shipped to main 2026-10-01)

## Content & SEO: Blog + Learn (Claude; plan in docs/prompts/blog-learn-build.md)
- [x] ~~Blog batch 5: 10 posts (Florida sun and dry rot, flat on I-95, TPMS vs a gauge, cold-front TPMS light, moving to Florida, glovebox tire kit, back-to-school check, bigger wheels myth, Turnpike to Orlando, Alligator Alley)~~ (`aca62b5`…`e56433c`, shipped to main 2026-10-02)
  - #32 (registration) and #42 (heat and pressure routine) held back: each would compete with a live Learn guide (reworked below)
  - [ ] 5 facts were snippet-only or helper-read: Miccosukee plaza fuel at Exit 49, Road Ranger on the Collier side, Turkey Lake WheelRight, Goodyear dry-rot causes, AAA sealant shelf life + CR-V Hybrid kit limits (listed in blog-plan.md)
- [x] ~~Learn gap fill C: 8 guides (nail in a tire, pothole and rim damage, TPMS sensors, touring vs performance, tire types, parts of a tire, speed rating, sidewall markings); new Basics hub; the build's "not published" warnings are gone; 30 of 50 planned guides~~ (`aafca79`, `d076749`, `b5be83d`, `e0b8cc7`, shipped to main 2026-10-02)
  - G3 (all-season vs all-terrain) skipped as a near duplicate; G29 (Florida tire laws) waits on reading the statute + a legal review
  - [ ] Spot-check quoted wording (sources read through a summarizing fetch); Pirelli's 5-10 year TPMS battery life; USTMA/TIA service-kit rule as reported by Tire Review; FMVSS 138/139 read on the Cornell mirror
- [x] ~~Phase 0: prerender all pages + article schema + sitemap lastmod~~ (be6a2a2)
- [x] ~~Phase 1: keyword map, 90–100 titles, demo list → Justin approves~~ (b813381, plans approved)
- [x] ~~Phase 2: templates + interactive demos + pilot of 10 articles → Justin approves~~ (800247b, pilot approved + 5 demos)
- [x] ~~Blog + Learn live: 20 articles, 5 demos, 98 prerendered routes~~ (be6a2a2)
- [ ] Phase 3: publish in batches of 10 — Batch 1 live (20 articles total, be6a2a2); blog batch 2 live (f776fc1); blog batch 3 live (9e4cc11); blog batch 4 live (ecfd2af); blog batch 5 live (d2ba501). Blog: 2 planned posts left, both waiting on answers: #15 (accountant: Florida tire fee and sales tax) and #49 (Justin: used tires?). #32 and #42 reworked (below); #37 dropped as a Learn near-duplicate. Learn: 33 guides live. Status table in `docs/content/blog-plan.md`. Demos: 6 more built and live; D7, D9, D12 cut by Justin ("only useful tools")
- [x] ~~Blog reworks: #32 recall notice and #42 packed-car weight limit (#37 dropped: six Tesla Learn guides already cover it)~~ (shipped to main 2026-10-02)
  - [ ] 5 facts were snippet-only (federal recall and load-limit rules: 49 USC 30120, Parts 577, 573.13, 575.6, 571.110): confirm them → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A20)
- [x] ~~Blog batch 3: 10 posts~~ (9e4cc11, shipped to main 2026-10-02)
  - [ ] 16 facts were snippet-only: confirm them → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A18)
  - 4/32 in Florida rain, best time to buy (by season), RAV4, used car after storm season, choosing between brands, Camry, F-150 P vs LT, EV tire wear, rideshare mileage math, CR-V
  - [ ] Justin: does Extreme Tires sell used tires? Plan post #49 waits on the answer
- [x] ~~Blog batch 4: 10 posts~~ (ecfd2af, shipped to main 2026-10-02)
  - Civic, Wrangler, Silverado boat towing, low rolling resistance for hybrids, small fleet checklist, new-car tires wearing early, curb/pothole signs, rotation upsell myth, unused tires still age, Thanksgiving road trip check
  - #37 (Tesla Model 3 flat) skipped: the Learn guide /learn/tesla/tesla-flat-tire-no-spare already targets the same search. Rework with a new angle or drop
  - #11 (Thanksgiving) quotes AAA's 2025 forecast: update with the 2026 numbers when AAA publishes them in mid-November
  - [ ] 12 facts were snippet-only: confirm them → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A19)
- [x] ~~6 new tools with their own tool pages, embedded in 8 articles~~ (preview/tools 210b348, shipped 2026-10-01)
- [x] ~~Wave 1 city pages + mobile hub: Sunrise, Plantation, Tamarac, Coral Springs, Davie, Fort Lauderdale, Weston~~ (preview/cities bb42574, shipped 2026-10-01)
- [ ] Justin: Google Business Profile link + map pin (for geo schema) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A9)
- [x] ~~Mobile claims confirmed by Justin: no trip fee, cross-county, roadside flat help (not highway shoulders)~~ (2026-10-01)
- [ ] Justin: confirm the city facts the research left unverified, so they can go on the pages: Tamarac ZIPs, roads and neighbourhoods; Coral Springs, Davie and Weston roads; Coral Springs and Weston neighbourhoods; whether Plantation 33388 is a PO Box ZIP → prompt in docs/prompts/2026-10-02-justin-remaining.md (#D8)
- [ ] Roadside flat tire help: give it a starting price → it joins the service catalog and online booking (phone only until then) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#D5)
- [ ] City pages wave 2: Pompano Beach, Miramar, Oakland Park, Pembroke Pines, Hollywood, Lauderhill (after wave 1 is indexed) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#C7)
- [ ] Phase 4: Search Console submit, monthly refresh (internal links done, below)
- [x] ~~Phase 4 internal links: check:links + fixes~~ (b823577, shipped to main 2026-10-02)
  - `npm run check:links` reads the build: 154 pages, 50 articles; 0 broken links, 0 indexable orphans (only /search, noindex), 0 articles without a shop or tool link, so nothing needed fixing
  - Linked only from the nav, footer or /sitemap (not failing): /about, /financing, /gallery, /reviews
- [x] ~~Article bundle split: each article loads only itself (article pages 312 → 176 KB gzipped JS)~~ (shipped to main 2026-10-02, release preview/release-2026-10-02)
  - Article pages drop from 312 KB to 176 KB of gzipped JS, /blog from 306 KB to 164 KB; prerendered article HTML unchanged
- [x] ~~Tesla tires Learn hub (6 guides) at /learn/tesla~~ (c42e16d, shipped 2026-10-01)
- [x] ~~Blog batch 2: 7 buying-decision + myth posts~~ (f776fc1, shipped to main 2026-10-02)
  - [ ] Two Bridgestone quote attributions (rear-axle placement, sipes/silica) were search-verified only: confirm on the source pages (prompt B in `docs/prompts/2026-10-02-verify-and-index.md`) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A15)
- [x] ~~Learn: Buying + Fitment hubs, 8 guides~~ (2674d06, shipped to main 2026-10-02)
  - [ ] Facts were search-verified only (source sites blocked): ply ratings, XL pressures, run-flat limits; wheel guides lean on retailer sources. Prompt B in `docs/prompts/2026-10-02-verify-and-index.md` checks the ply ratings and XL pressures; run-flat limits and the wheel guides still need a pass → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A15)
- [x] ~~Learn sources: competitor retailer citations replaced with maker sources (7 guides)~~ (shipped to main 2026-10-02, release preview/release-2026-10-02)
  - [ ] All new sources are search-snippet only (maker sites blocked here): confirm the quoted lines with the Chrome prompt in the ATLAS report. Demo source lines now cite Bridgestone, AAA, Goodyear and BFGoodrich (`7754330`) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A15)
- [ ] Search Console: request indexing for the 17 URLs shipped 2026-10-02 + the home page (prompt A in `docs/prompts/2026-10-02-verify-and-index.md`; preview/checklist-tidy 788d1f4) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A8)
- [x] Blog batch 2: 7 buying-decision + myth posts (f776fc1), shipped to main 2026-10-02. Two Bridgestone quote attributions (rear-axle placement, sipes/silica) were search-verified only: confirm on the source pages
- [x] Learn: Buying + Fitment hubs, 8 guides (2674d06), shipped to main 2026-10-02. Facts were search-verified only (source sites blocked): ply ratings, XL pressures, run-flat limits; wheel guides lean on retailer sources
- [x] ~~Learn gap fill A: 5 guides already linked from live articles~~ (shipped to main 2026-10-02, release preview/release-2026-10-02)
  - Facts were search-verified only (source sites blocked): registration rule wording (49 CFR 574.8), gauge types, Bridgestone 3–5 years, warranty terms
- [x] ~~Learn gap fill B: 4 research guides already linked from live articles~~ (shipped to main 2026-10-02, release preview/release-2026-10-02)
  - Hydroplaning, spare tire types, EV tires, changing tire size. Facts are search-snippet only (maker sites blocked): confirm the spare 50 mph / 50 miles / 60 psi figures, Michelin's 20% EV wear figure and Pirelli's HL 6–9% figure on the source pages

## ATD and business (Justin)
- [ ] Submit the ATD connectivity form → prompt in docs/prompts/2026-10-02-justin-remaining.md (#B1)
- [x] ~~ATD call: API access, brands, sandbox, fees~~ (call held 2026-10-02; not recorded on Fathom)
  - [ ] ATD is reviewing the site for approval; API credentials come after approval (waiting on ATD, 2026-10-02)
  - [ ] Still to confirm with ATD once credentials arrive: sandbox + test order, freight per tire/order, cutoff time, MAP/UMAP brands, drop-ship brand list, fitment endpoint, returns on Ship to Home → questions in docs/prompts/2026-10-02-justin-remaining.md (#B1)
- [ ] Second distributor: TireHub / US AutoForce / Wheel Pros → prompt in docs/prompts/2026-10-02-justin-remaining.md (#B3)
- [ ] Accountant: FL $1/tire fee + out-of-state sales tax → prompt in docs/prompts/2026-10-02-justin-remaining.md (#B4)
- [ ] Brand pricing rules: minimum advertised prices, online-sale limits → prompt in docs/prompts/2026-10-02-justin-remaining.md (#B5)
- [ ] Decide: direct API vs Spark / Slingshot / our own sync → prompt in docs/prompts/2026-10-02-justin-remaining.md (#C2)
- [x] ~~Tire Guru call made~~ (Justin, 2026-09-30)
- [x] ~~Tire Guru answer received~~ (Josh Nail, 2026-09-30): no direct integration; their tire + service search widget is $150/mo and feeds orders/appointments into the POS
- [ ] Justin/Melissa: send Josh the 7 questions (appointments-only mode? booking link + prefill? live ATD inventory/pricing? payment processor? embed type? contract? notifications?) → then decide on the $150/mo widget → prompt in docs/prompts/2026-10-02-justin-remaining.md (#B2)

## Later
- [ ] Vercel Pro ($20/mo) → prompt in docs/prompts/2026-10-02-justin-remaining.md (#A10)
- [x] ~~etwheelz.com: keep as-is (it forwards to TireDrop)~~ (Justin, 2026-09-30)
- [x] ~~Old Cannavibe repo: not needed. Justin is deleting the whole repo; code backup zip sent; TireDrop repo kept as-is~~ (2026-09-30)
- [ ] After ATD: live API → sandbox test → auto-ordering on → full sizes, richer specs, Google Shopping → prompt in docs/prompts/2026-10-02-justin-remaining.md (#C1)
