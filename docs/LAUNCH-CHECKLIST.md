# TireDrop Launch Checklist

Justin's master to-do list. **Update this file every time a task finishes.**
Done items get ticked AND struck through (`- [x] ~~item~~ (commit or date)`).
Open items stay `- [ ]`. Add new items to the right section; don't delete
done items. Show Justin the updated list, in this style, whenever it changes.

_Last updated: 2026-09-30 (Tire Guru called, awaiting answer; Cannavibe repo being deleted, backup sent; repo organized; Blog + Learn live)_

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
- [x] ~~Mobile/install area: Miami-Dade, Broward, Palm Beach~~ (f8a053c)
- [ ] Exclude non-Palm-Beach 334 ZIPs (33440, 33455, 33471, 33475) + server-side ZIP check for bookings
- [x] ~~Arrival wording: "We confirm an arrival window when we book"~~ (be6a2a2)
- [x] ~~Repo organized: docs map, audits/archive, README guide~~ (c5846e7, 2026-09-30)

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
- [ ] Go-live test: $1 order #D1: pay → confirm order, then refund
- [ ] Go-live test: email folders + SPF/DKIM/DMARC (blocked: Outlook needs info@ sign-in)
- [ ] Google: retry "Request indexing" (robots.txt delay)
- [ ] 2-step login for all Shopify staff (Melissa keeps full access)
- [ ] Someone can sign into Outlook as info@tiredroponline.com
- [ ] SPF/DMARC: fix only if the Gmail test fails (never add a 2nd DMARC record)

## Next phase (Chrome prompt after the builds land)
- [x] ~~Webhooks: 2 in Shopify, signing key into Vercel, redeploy, test (prompt 21)~~ (2026-09-30: 2 webhooks configured, test notifications 200)
- [ ] Justin: run prompt 22 ("Schedule your install" email button + "High-risk order review" and "Needs scheduling alert" Flows; you click every Save)
- [ ] Justin: INSTALL_BOOKING_URL after the Tire Guru call (booking link → set it in Vercel and redeploy; API → tell Claude, it's a follow-up build; see docs/integrations/install-scheduling.md)
- [ ] `/track` tested with the $1 order
- [ ] Header links checked on desktop and phone
- [ ] Checkout branding (prompt 20)
- [x] ~~Publish EDIT HERE (shop. storefront → main-site redirect is live)~~ (2026-09-30, theme 166982615192)
- [x] ~~Redirect test: shop. pages → tiredroponline.com; checkout, /account and invoices stay on Shopify~~ (2026-09-30)

## Before real paid orders (Claude)
- [ ] Bill installation on the invoice
- [ ] Ship-to-store flow: address, emails, alerts
- [ ] Fitment hold before orders go to ATD
- [ ] "Tires arrived at the shop" notice
- [ ] Checkout spam guard, and no writing into other customers' notes
- [ ] No Add button on won't-fit tires; Compare crowns same-size tires only
- [ ] Year-aware fitment on /tires

## Quick wins (Claude)
- [ ] Phone bottom bar changes by page
- [x] ~~Pop-up off shop pages~~ (2026-09-30: superseded, the pop-up is gone)
- [ ] Google search-result data: breadcrumbs, FAQ, map coordinates
- [ ] Accessibility fixes + skip link
- [ ] Security headers: CSP, HSTS, Permissions-Policy
- [ ] NHTSA lookup timeout
- [ ] Returns window + warranty/road-hazard links
- [ ] "Continental US" wording (~40 places) → "48 contiguous states + DC"
- [ ] Homepage reviews card: use a real Google review link (it currently points at a Maps search)

## Big upgrades (Claude)
- [x] ~~Prerender pages for Google (covered by Blog + Learn Phase 0)~~ (be6a2a2)
- [ ] Hero finder goes straight to results
- [ ] Installed-price toggle
- [ ] Book an install time at checkout
- [ ] Fitment by trim + staggered, and a "Fits your vehicle" badge
- [ ] Local city pages: Sunrise, Fort Lauderdale, Plantation, Davie…
- [ ] Real review collection (no stars until real reviews exist)

## Content & SEO: Blog + Learn (Claude; plan in docs/prompts/blog-learn-build.md)
- [x] ~~Phase 0: prerender all pages + article schema + sitemap lastmod~~ (be6a2a2)
- [x] ~~Phase 1: keyword map, 90–100 titles, demo list → Justin approves~~ (b813381, plans approved)
- [x] ~~Phase 2: templates + interactive demos + pilot of 10 articles → Justin approves~~ (800247b, pilot approved + 5 demos)
- [x] ~~Blog + Learn live: 20 articles, 5 demos, 98 prerendered routes~~ (be6a2a2)
- [ ] Phase 3: publish in batches of 10 — Batch 1 live (20 articles total, be6a2a2); Batches 2–9 + 9 demos to go
- [ ] Phase 4: internal links, Search Console submit, monthly refresh

## ATD and business (Justin)
- [ ] Submit the ATD connectivity form
- [ ] ATD call: API access, brands, sandbox, fees
- [ ] Second distributor: TireHub / US AutoForce / Wheel Pros
- [ ] Accountant: FL $1/tire fee + out-of-state sales tax
- [ ] Brand pricing rules: minimum advertised prices, online-sale limits
- [ ] Decide: direct API vs Spark / Slingshot / our own sync
- [x] ~~Tire Guru call made~~ (Justin, 2026-09-30)
- [ ] Tire Guru answer: booking link → INSTALL_BOOKING_URL in Vercel; API → Claude builds it; neither → /schedule stays

## Later
- [ ] Vercel Pro ($20/mo)
- [x] ~~etwheelz.com: keep as-is (it forwards to TireDrop)~~ (Justin, 2026-09-30)
- [x] ~~Old Cannavibe repo: not needed. Justin is deleting the whole repo; code backup zip sent; TireDrop repo kept as-is~~ (2026-09-30)
- [ ] After ATD: live API → sandbox test → auto-ordering on → full sizes, richer specs, Google Shopping
