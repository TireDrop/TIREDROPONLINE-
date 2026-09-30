# TireDrop Launch Checklist

Justin's master to-do list. **Update this file every time a task finishes.**
Done items get ticked AND struck through (`- [x] ~~item~~ (commit or date)`).
Open items stay `- [ ]`. Add new items to the right section; don't delete
done items. Show Justin the updated list, in this style, whenever it changes.

_Last updated: 2026-09-30 (newsletter pop-up replaced by a footer sign-up; EDIT HERE published; Blog + Learn pilot on preview; Batch 1 writing)_

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

## Admin (Justin)
- [x] ~~GA: "Page changes based on browser history events" OFF~~ (2026-09-29)
- [x] ~~Search Console: domain verified, sitemap submitted, robots.txt re-fetched~~ (2026-09-29)
- [x] ~~Business Profile: tiredroponline.com added as a booking link (main site kept)~~
- [x] ~~Shopify Payments: payouts daily, test mode OFF, statement "SP TireDrop"~~
- [x] ~~Apps: Inbox and Appointo not installed~~
- [x] ~~Sender email info@tiredroponline.com authenticated~~
- [x] ~~Shopify app + Vercel keys + "Website lead alert" Flow~~
- [x] ~~Newsletter pop-up test passed~~
- [ ] Footer sign-up test: sign up once with a test address; the Shopify customer is tagged `newsletter`, `footer`, `vercel` (was `popup`; update any Shopify segment that filters on `popup`)
- [ ] Go-live tests, Parts E–H: contact form, order-request draft, email/SPF check, $1 order #D1
- [ ] Google: retry "Request indexing" (robots.txt delay)
- [ ] 2-step login for all Shopify staff (Melissa keeps full access)
- [ ] Someone can sign into Outlook as info@tiredroponline.com
- [ ] SPF/DMARC: fix only if the Gmail test fails (never add a 2nd DMARC record)

## Next phase (Chrome prompt after the builds land)
- [ ] Webhooks: 2 in Shopify, signing key into Vercel, redeploy, test (prompt 21)
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
- [ ] Prerender pages for Google (covered by Blog + Learn Phase 0)
- [ ] Hero finder goes straight to results
- [ ] Installed-price toggle
- [ ] Book an install time at checkout
- [ ] Fitment by trim + staggered, and a "Fits your vehicle" badge
- [ ] Local city pages: Sunrise, Fort Lauderdale, Plantation, Davie…
- [ ] Real review collection (no stars until real reviews exist)

## Content & SEO: Blog + Learn (Claude; plan in docs/prompts/blog-learn-build.md)
- [ ] Phase 0: prerender all pages + article schema + sitemap lastmod (in progress)
- [ ] Phase 1: keyword map, 90–100 titles, demo list → Justin approves (research in progress)
- [ ] Phase 2: templates + interactive demos + pilot of 10 articles → Justin approves
- [ ] Phase 3: publish in batches of 10 (~10/week)
- [ ] Phase 4: internal links, Search Console submit, monthly refresh

## ATD and business (Justin)
- [ ] Submit the ATD connectivity form
- [ ] ATD call: API access, brands, sandbox, fees
- [ ] Second distributor: TireHub / US AutoForce / Wheel Pros
- [ ] Accountant: FL $1/tire fee + out-of-state sales tax
- [ ] Brand pricing rules: minimum advertised prices, online-sale limits
- [ ] Decide: direct API vs Spark / Slingshot / our own sync

## Later
- [ ] Vercel Pro ($20/mo)
- [x] ~~etwheelz.com: keep as-is (it forwards to TireDrop)~~ (Justin, 2026-09-30)
- [ ] Old Cannavibe repo: delete the `tiredrop/` folder? (needs Justin's yes)
- [ ] After ATD: live API → sandbox test → auto-ordering on → full sizes, richer specs, Google Shopping
