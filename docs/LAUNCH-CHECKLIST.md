# TireDrop Launch Checklist

Justin's master to-do list. **Update this file every time a task finishes.**
Done items get ticked AND struck through (`- [x] ~~item~~ (commit or date)`).
Open items stay `- [ ]`. Add new items to the right section; don't delete
done items. Show Justin the updated list, in this style, whenever it changes.

_Last updated: 2026-10-01 (on preview for Justin: /tires Shop by Vehicle uses the full NHTSA year/make/model lists with a searchable Model box, cached /api/vehicles (preview/remember e8f1d6f); remember vehicle + shareable /tires filters (preview/remember 9be62b0); SHIPPED: fitment no longer blocks on a model-level guess, door-jamb size entry front/rear (dee5157); Tesla tires Learn hub with 6 guides; language button (c05e3ac); phone bar, accessibility, 48 states + DC wording, NHTSA timeout (c541339))_

## Site fixes (Claude)
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

## Admin (Justin)
- [x] ~~GA: "Page changes based on browser history events" OFF~~ (2026-09-29)
- [x] ~~Search Console: domain verified, sitemap submitted, robots.txt re-fetched~~ (2026-09-29)
- [x] ~~Business Profile: tiredroponline.com added as a booking link (main site kept)~~
- [x] ~~Shopify Payments: payouts daily, test mode OFF, statement "SP TireDrop"~~
- [x] ~~Apps: Inbox and Appointo not installed~~
- [x] ~~Sender email info@tiredroponline.com authenticated~~
- [x] ~~Shopify app + Vercel keys + "Website lead alert" Flow~~
- [x] ~~Newsletter pop-up test passed~~
- [x] ~~Tipping removed from checkout~~ (Justin, 2026-09-30)
- [ ] Footer sign-up test: sign up once with a test address; the Shopify customer is tagged `newsletter`, `footer`, `vercel` (was `popup`; update any Shopify segment that filters on `popup`)
- [x] ~~Go-live test: contact form (lead + Flow)~~ (2026-09-30)
- [x] ~~Go-live test: order-request draft #D2 + /track shows it~~ (2026-09-30)
- [x] ~~Go-live test: $1 order #D1~~ (replaced by the $1 install tests #D3/#D4 below; delete drafts #D1/#D2)
- [ ] Go-live test: email folders + SPF/DKIM/DMARC (blocked: Outlook needs info@ sign-in)
- [ ] Google: retry "Request indexing" (robots.txt delay)
- [ ] 2-step login for all Shopify staff (Melissa keeps full access)
- [ ] Someone can sign into Outlook as info@tiredroponline.com
- [ ] SPF/DMARC: fix only if the Gmail test fails (never add a 2nd DMARC record)
- [ ] HSTS preload: decide whether to add `preload` and submit to hstspreload.org (hard to undo; docs/ops/deploy.md)
- [ ] Justin: enable Spanish in Shopify Settings → Languages (checkout)

## Next phase (Chrome prompt after the builds land)
- [x] ~~Webhooks: 2 in Shopify, signing key into Vercel, redeploy, test (prompt 21)~~ (2026-09-30: 2 webhooks configured, test notifications 200)
- [x] ~~Prompt 22: email button + High-risk order review (tag, hold, email) + Needs scheduling alert (order paid → 24h → not install-booked)~~ (Justin, 2026-09-30)
- [ ] Re-run prompt 15 (local vs ship block was never saved; paste it right above the new install button)
- [ ] Prompt 23: add 33440, 33455, 33471, 33475 to the "Order routing: local vs ship" Flow ZIP condition (and to the email block if prompt 15 is already saved)
- [ ] Prompt 24: "Website lead alert" reads the lead from the `tiredrop.last_lead` metafield (not `customer.note`), new last line; then the two-message test
- [ ] $1 install test: pay #D3 and book it on /track → tags flip + [BOOKED] to info@ + no [SCHEDULE] after 24h; pay #D4 and don't book → [SCHEDULE] after 24h; then refund both (drafts created 2026-09-30)
- [ ] Confirm info@tiredroponline.com receives Shopify mail (test emails go to the logged-in staff account)
- [ ] Justin: INSTALL_BOOKING_URL after the Tire Guru call (booking link → set it in Vercel and redeploy; API → tell Claude, it's a follow-up build; see docs/integrations/install-scheduling.md)
- [ ] `/track` tested with the $1 order
- [ ] Header links checked on desktop and phone
- [ ] Checkout branding (prompt 20)
- [ ] GA4: mark generate_lead, order_request and install_booking as Key events (prompt 25)
- [x] ~~Publish EDIT HERE (shop. storefront → main-site redirect is live)~~ (2026-09-30, theme 166982615192)
- [x] ~~Redirect test: shop. pages → tiredroponline.com; checkout, /account and invoices stay on Shopify~~ (2026-09-30)

## Before real paid orders (Claude)
- [ ] Bill installation on the invoice
- [ ] Ship-to-store flow: address, emails, alerts
- [ ] Fitment hold before orders go to ATD
- [ ] "Tires arrived at the shop" notice
- [x] ~~Checkout spam guard, and no writing into other customers' notes~~ (7cc12f2)
- [x] ~~No Add button on won't-fit tires; Compare crowns same-size tires only~~ (347c4e1)
- [x] ~~Year-aware fitment on /tires~~ (347c4e1)

## Quick wins (Claude)
- [x] ~~Phone bottom bar changes by page~~ (c541339)
- [x] ~~Pop-up off shop pages~~ (2026-09-30: superseded, the pop-up is gone)
- [x] ~~Google search-result data: breadcrumbs (one per page, matching the visible trail), FAQ (kept where it was), article author, `npm run check:schema` gate~~ (27d477c)
- [ ] Google search-result data: map coordinates. Waiting on Justin's Google Maps pin; paste it into `geo` in `src/data/business.js`
- [x] ~~Accessibility fixes + skip link~~ (c541339)
- [x] ~~Security headers: CSP, HSTS, Permissions-Policy~~ (abcf645; CSP is report-only for now)
- [x] ~~GA4 conversion events~~ (abcf645)
- [ ] Switch the CSP from report-only to enforced after a week of clean `[csp]` logs (docs/ops/deploy.md, "Security headers")
- [x] ~~NHTSA lookup timeout~~ (c541339)
- [ ] Returns window + warranty/road-hazard links
- [x] ~~"Continental US" wording (~40 places) → "48 contiguous states + DC"~~ (c541339)
- [ ] Accessibility, second pass: heading order on the Learn hubs, /blog, /wheels and /compare, and a blank first column heading in the UTQG table (axe "moderate"/"minor"; `npm run check:a11y` covers 12 key routes)
- [ ] Shopify theme copy still says "continental United States" (shop. redirects to the main site, so it does not render; update the draft theme only if the redirect ever comes off)
- [ ] Homepage reviews card: use a real Google review link (it currently points at a Maps search)

## Big upgrades (Claude)
- [x] ~~Prerender pages for Google (covered by Blog + Learn Phase 0)~~ (be6a2a2)
- [ ] Hero finder goes straight to results
- [ ] Remember vehicle (no pop-up after first entry) + shareable /tires URL filters (preview/remember 9be62b0) → Justin reviews → ship
  - Filters: season, tire type, brand, price per tire, speed rating, load index, load range, treadwear warranty, sort by warranty / brand. Skipped for lack of data: EV-ready, XL on passenger tires, run-flat (appears automatically once a run-flat tire is listed)
  - [x] ~~/tires Shop by Vehicle (and its Change) use the full lists, not the catalog's 10 makes / 45 models: years 1981-2027, every make sold that year, every model NHTSA lists (BMW: 3 Series, 4 Series, M3, X5, X7…); Model box filters as you type and takes a typed model~~ (preview/remember e8f1d6f)
  - [x] ~~Model lists hold up: `/api/vehicles` asks NHTSA with a timeout and is cached at Vercel's edge for a day; the build saves a snapshot as the fallback; when nothing loads the finder says "Couldn't load models. Type your model or enter your door-jamb size."~~ (preview/remember e8f1d6f)
  - [ ] After the preview deploys, check its Vercel build log for `[vpic-snapshot] wrote dist/data/vpic-models.json` (this sandbox can't reach NHTSA, so the snapshot was never generated here)
  - [ ] Shopify theme's `td-vehicles.js` still asks NHTSA straight from the browser and falls back to the 45-model table; point it at `/api/vehicles` (draft theme only) if the theme finder is ever shown again
  - [ ] A shared /tires link spells a model the size table doesn't know from the URL ("cx-5" shows as "Cx-5"); the saved pick keeps the right spelling
- [ ] Installed-price toggle
- [ ] Book an install time at checkout
- [ ] Fitment by trim + staggered (logic + badge shipped in 347c4e1; trim and staggered sizes need real data: ATD fitment or a fitment API)
- [ ] Local city pages: wave 1 (7 cities) live 2026-10-01; wave 2 next
- [ ] Real review collection (no stars until real reviews exist)

## Content & SEO: Blog + Learn (Claude; plan in docs/prompts/blog-learn-build.md)
- [x] ~~Phase 0: prerender all pages + article schema + sitemap lastmod~~ (be6a2a2)
- [x] ~~Phase 1: keyword map, 90–100 titles, demo list → Justin approves~~ (b813381, plans approved)
- [x] ~~Phase 2: templates + interactive demos + pilot of 10 articles → Justin approves~~ (800247b, pilot approved + 5 demos)
- [x] ~~Blog + Learn live: 20 articles, 5 demos, 98 prerendered routes~~ (be6a2a2)
- [ ] Phase 3: publish in batches of 10 — Batch 1 live (20 articles total, be6a2a2); Batches 2–9 to go. Demos: 6 more built and live; D7, D9, D12 cut by Justin ("only useful tools")
- [x] ~~6 new tools with their own tool pages, embedded in 8 articles~~ (preview/tools 210b348, shipped 2026-10-01)
- [x] ~~Wave 1 city pages + mobile hub: Sunrise, Plantation, Tamarac, Coral Springs, Davie, Fort Lauderdale, Weston~~ (preview/cities bb42574, shipped 2026-10-01)
- [ ] Justin: Google Business Profile link + map pin (for geo schema)
- [x] ~~Mobile claims confirmed by Justin: no trip fee, cross-county, roadside flat help (not highway shoulders)~~ (2026-10-01)
- [ ] Justin: confirm the city facts the research left unverified, so they can go on the pages: Tamarac ZIPs, roads and neighbourhoods; Coral Springs, Davie and Weston roads; Coral Springs and Weston neighbourhoods; whether Plantation 33388 is a PO Box ZIP
- [ ] Roadside flat tire help: give it a starting price → it joins the service catalog and online booking (phone only until then)
- [ ] City pages wave 2: Pompano Beach, Miramar, Oakland Park, Pembroke Pines, Hollywood, Lauderhill (after wave 1 is indexed)
- [ ] Phase 4: internal links, Search Console submit, monthly refresh
- [x] ~~Tesla tires Learn hub (6 guides) at /learn/tesla~~ (c42e16d, shipped 2026-10-01)

## ATD and business (Justin)
- [ ] Submit the ATD connectivity form
- [ ] ATD call: API access, brands, sandbox, fees
- [ ] Second distributor: TireHub / US AutoForce / Wheel Pros
- [ ] Accountant: FL $1/tire fee + out-of-state sales tax
- [ ] Brand pricing rules: minimum advertised prices, online-sale limits
- [ ] Decide: direct API vs Spark / Slingshot / our own sync
- [x] ~~Tire Guru call made~~ (Justin, 2026-09-30)
- [x] ~~Tire Guru answer received~~ (Josh Nail, 2026-09-30): no direct integration; their tire + service search widget is $150/mo and feeds orders/appointments into the POS
- [ ] Justin/Melissa: send Josh the 7 questions (appointments-only mode? booking link + prefill? live ATD inventory/pricing? payment processor? embed type? contract? notifications?) → then decide on the $150/mo widget

## Later
- [ ] Vercel Pro ($20/mo)
- [x] ~~etwheelz.com: keep as-is (it forwards to TireDrop)~~ (Justin, 2026-09-30)
- [x] ~~Old Cannavibe repo: not needed. Justin is deleting the whole repo; code backup zip sent; TireDrop repo kept as-is~~ (2026-09-30)
- [ ] After ATD: live API → sandbox test → auto-ordering on → full sizes, richer specs, Google Shopping
