# Site audit, 2026-09-29

Four parallel audits of the live code (commit a899a23): UX/conversion, technical (performance/SEO/accessibility), trust/checkout/operations, and a competitor benchmark. Screenshots and Lighthouse output were kept in the session scratchpad, not in this repo.

---

# TireDrop UX / conversion audit

Tested on :4301 (API mocked from the sample catalog) at 390px and 1440px. Screenshots: `audit/ux/` (`-pN` = crops; fallback fonts).

## Top 10 (by revenue impact)

**1. Send the hero vehicle finder straight to results (M).** On the home page, Find Tires opens a 5-question quiz (`02-finder-d-results-full-p0.png`) that can end in "Nothing in the catalog clears" (`03-quiz-d-result-p0.png`). On phones only "Year" is above the fold (`01-home-m-fold.png`). **Fix:** go to `/tires?vy&vmk&vmd` and make the quiz an optional "Help me choose".

**2. Make fitment one year-aware answer (M).** For a 2020 Camry, Find My Tires says 215/55R17; /tires says "Fits your 2020 Toyota Camry: 215/60R16", the 2007-11 size (`04-tires-vehicle-d-p0.png`). **Fix:** use `fitmentForYear` in `TiresPage` and `api/_lib/catalog.js`. Add a trim step and staggered front/rear sizes. Carry the vehicle through checkout and flag a size mismatch there.

**3. Stop wrong-size orders (S).** "Other sizes we stock — will not fit" cards still have live Add buttons (`04-tires-vehicle-d-p1.png`). Compare mixes three sizes and marks one "BEST" (`11-compare-d-p0.png`). **Fix:** ask for size or vehicle before adding, label off-size cards, and hide BEST when sizes differ.

**4. Make the money honest (S-M).** A flat 7% sales tax applies even to a Texas order (`08-cart-d.png`, `10-co-d-ship-step4.png`). Ship-to-store at checkout adds no install fee, yet the confirmation says "We fit them at the shop" (`10-co-m-pickup-done-p0.png`). **Fix:**
- tax by address
- auto-add $25/tire for pickup or mobile install
- an installed-price toggle on cards
- show Florida's per-tire new-tire fee

**5. Disclose the sample catalog on shop pages (S).** Listing, product page, cart and checkout show sample prices with buy buttons; only the tool pages mention it. **Fix:** show a banner when `status.atd === "sample"`.

**6. Phone ergonomics (M).** On /tires the first result sits about 1.5 screens down (`05-size-m-results-p0.png`). The bottom bar says "Shop Tires" even on product pages and checkout (`10-co-m-pickup-step2.png`), and up to three bars stack (`11-compare-tray-m.png`). The product page has no price above the fold (`07-pdp-m-fold.png`). **Fix:** collapse the search panel into a "225/45R18 · change" chip. Make the bottom bar Cart/Checkout on shop pages and hide it on /checkout.

**7. Product page and filter depth to Tire Rack / SimpleTire level (M-L).** Missing:
- the same model in other sizes
- a "fits your vehicle" check
- 3PMSF/season as a spec
- real tread images
- same-size related tires
- warranty miles and UTQG on cards (`06-tires-m-cards.png`)
- filters for speed, load, run-flat, warranty and season

**8. Trust at the point of purchase (M).** No returns window is stated and there is no road-hazard option. Add to Cart has no policy summary (`07-pdp-d-full-p0.png`). "Track an Order" goes to /contact, and the confirmation says "Tracking follows by phone." **Fix:** add a policy summary under Add to Cart, an email confirmation, an order-status page, and road hazard as an add-on.

**9. One delivery line (S).** Cards promise an "estimate shown at checkout", but checkout never shows one. Pick one honest wording.

**10. Keep the pop-up out of the buying path (S).** The modal opens over product pages and /tires (`14-popup-d.png`, `14-popup-m.png`). Exclude `/tires*`, `/compare` and `/wheels*`, and use exit intent on desktop.

## Bugs

1. The vehicle search ignores the year (`catalog.js` `resolveVehicle`, `TiresPage.jsx:132`).
2. Tax is hard-coded at 7% (`CartContext.jsx:95`, `CartPage.jsx:30`).
3. Pickup and mobile at checkout add no install fee.
4. The pickup date allows today (`CheckoutPage.jsx:1225`), so the confirmation says "Meet us there on Tuesday, September 29, 2026" before the tires have shipped.
5. The size dropdowns only list sample-catalog values (widths 205-285, rims 16-20), so 195/65R15 or LT sizes can't be chosen. This will still cap search after ATD goes live.
6. The /tires search panel offers 10 makes (2005-2026) vs 72 in the hero, and it doesn't show the active search.
7. Hero models come from NHTSA in the browser. If that fails, Toyota shows only 6 models; proxy and cache it on the server.
8. Compare repeats the Size, Load and Speed rows.
9. The cart thumbnail is cropped and the cart says "4 items" for one set (`08-cart-d.png`).

## Business-rule flags

- **Sample data:** not disclosed on the shop pages (#5).
- **APR:** Financing says "Rates and APR vary… annual percentage rate" and has a "Promotional period / no interest" section (`12-financing-d.png`). Remove both.
- **Discounts:** Commercial says "Fleet pricing on volume… Volume pricing applies to sets of eight or more." That is a discount; reword to "fleet quotes".
- **Delivery dates:** the pickup confirmation states a firm date (bug 4).
- **Clean:** no invented reviews or ratings, no "since" years, no "safe to drive", no coupons. The tire check says "Your tires are fine" with caveats.

## Quick wins (<30 min)

- Sample-data banner on the shop pages.
- Hide the bottom bar on /checkout; show "Cart (n)" instead of "Shop Tires" on shop pages.
- Exclude /tires, /compare and /wheels from the pop-up.
- Delete the APR and promotional paragraphs; reword "fleet rates".
- Disable Add on off-size cards; hide BEST and the duplicate rows in compare.
- Set the checkout date minimum a few business days out, or replace it with "we'll call when it lands".
- Tax line: "Calculated by address" until a state is entered.
- Rename "Track an Order"; say tracking comes by email.
- Unify the delivery-estimate line.
- Prefill checkout step 3 from the vehicle in the URL.

---

# TireDrop technical audit

## How I measured it
- **Lighthouse 12:** mobile preset (slow 4G, 4x CPU), run against `vite preview` of `dist/`. Google Fonts could not load there (proxy certificate); real scores are slightly lower.
- **Playwright:** Slow-4G, 4x CPU, PerformanceObserver LCP/CLS.
- **axe-core:** WCAG 2.2 AA and best-practice rules on 13 routes at 390 and 1440 px (26 runs), plus focus and form-error probes.
- Live domain blocked by proxy; figures are from the local build.

| Route | Perf | A11y | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|
| / | 87 | 97 | 61 | 2.5 s | 360 ms | 0 |
| /tires | 93 | 99 | 61 | 2.6 s | 30 ms | 0 |
| product | 93 | 100 | 61 | 2.6 s | 50 ms | 0 |
| /checkout | 92 | 98 | 61 | 2.8 s | 40 ms | 0.018 |

**Performance**
- **Page weight:** the home page transfers 181 kB.
- **JS and CSS:** the main JS is 97 kB gzip and the CSS 10 kB gzip. Routes are split into 30 lazy chunks and no source maps ship.
- **Fonts:** Google Fonts are render-blocking, and the three woff2 files weigh 152 kB.
- **LCP:** the largest element is always text. About 2.2 s of it is render delay while the page waits for JS.

**SEO:** the score of 61 is entirely `robots.txt` Disallow.

**Accessibility (axe totals)**
- **Critical:** 0.
- **Serious:** 44 nodes (`target-size` 28, `color-contrast` 16).
- **Moderate:** 149 nodes (`region` 143, `heading-order` 6).
- **Minor:** 6 nodes.
- **Focus:** visible on every tabbed element.

## Critical issues
1. **Crawlers are blocked.** `robots.txt` is `Disallow: /` because `ALLOW_INDEXING = false` (`scripts/generate-seo-files.mjs:54`).
2. **No content without JS.** With JS off, a product page has 0 text, 0 links and 0 H1. Every URL serves the home page's title, description and OG card, and has no canonical.
3. **Soft 404s.** The catch-all rewrite returns 200 for any path, and noindex is added only after JS runs.

## Top 10 recommendations
1. **Enable indexing at launch (S).**
   - Evidence: `is-crawlable` fails on every route.
   - Fix: set `ALLOW_INDEXING=true`, rebuild, verify `/robots.txt`, submit the sitemap (68 URLs, correct domain).
2. **Prerender every sitemap route (M).**
   - Fix: build static HTML with `vite-react-ssg` or `vite-plugin-prerender`, including per-page head tags and JSON-LD, and hydrate it. Should cut about 1–2 s from mobile LCP.
3. **Serve real 404s (S–M).**
   - Fix: after prerendering, rewrite only `/tires/p/:sku` and serve a static 404 otherwise.
4. **Self-host the fonts (S).**
   - Evidence: 450–600 ms render-blocking savings; Archivo alone is 90 kB.
   - Fix: subset to latin and cut Archivo down to the weights and widths actually used. Preload the hero face.
5. **Right-size the logo (S).**
   - Evidence: `tiredrop-full.webp` is 68 kB at 440×444 but displays at 71×72 on every page (Lighthouse says 66 kB can be saved).
   - Fix: export 72 px and 144 px versions (about 5 kB) with `srcset`.
6. **Add the missing structured data (S).**
   - Add **BreadcrumbList**. Visible breadcrumbs exist only on service pages.
   - Add **FAQPage** for the FAQs on `/install` and the tool pages.
   - Add **`geo` and `priceRange`** to the shop node.
   - Already correct: shop node has the real address, phone and hours; no AggregateRating or Review anywhere.
   - Turn on `EMIT_OFFERS` only once inventory is live.
7. **Build local landing pages (M).**
   - Evidence: 10 `installArea` cities, no city URLs; Miami isn't served.
   - Fix: prerender city pages (Sunrise, Fort Lauderdale, Plantation, …) with unique copy, a map and `areaServed`, linked from the footer.
8. **Fix the accessibility failures (S).**
   - **Skip link and header:** there is no skip link, and the header is not a `<header>`. The utility bar sits outside every landmark (`region` ×143).
   - **Target size:** the footer "Privacy" link is 43×14 px on mobile.
   - **Contrast:** the decorative step numerals are 1.69:1 and 1.23:1.
   - **Headings:** heading levels skip on product cards and the cart.
   - **Label in name:** the "Add 4" buttons have an aria-label that doesn't contain the visible text (WCAG 2.5.3).
   - **Link text:** a link reads just "More".
9. **Announce form errors (S).**
   - Evidence: submitting `/contact` empty sets `aria-invalid` on 10 fields, but focus stays on the button and nothing announces the error.
   - Fix: move focus to the first error, or to a `role="alert"` summary.
10. **Add security headers (S).**
    - `vercel.json` has no **CSP**. Suggested: `default-src 'self'`, fonts from Google, `connect-src 'self' vpic.nhtsa.dot.gov`, `frame-ancestors 'self'`, `form-action 'self' shop.tiredroponline.com`.
    - Make **HSTS** explicit (`max-age=63072000; includeSubDomains; preload`).
    - Add **Permissions-Policy**: `camera=(), microphone=(), geolocation=(), payment=()`.
    - No secrets in `dist/` (searched `shpat_`, `shpss_`, `sk_live`, AKIA, secret, token).

## Other findings
- **Main chunk (M):** the home page has 360 ms TBT and a 255 ms long task. The main chunk bundles the whole products, vehicles, fitment and services data because `Seo` imports `getProduct`.
- **NHTSA:** each lookup fires 3 parallel vPIC calls, cached in memory only, with no timeout. Add an AbortController (about 4 s) and a `sessionStorage` cache.
- **Already correct:**
  - **Caching:** `/assets` is immutable for 1 year, `/brand` is 1 day with SWR, and checkout and cron are `no-store`.
  - **Redirects:** Shopify-era 301s are complete; `*.vercel.app` gets `X-Robots-Tag: noindex`.
  - **Head tags:** after JS, the custom `Seo` component (not react-helmet) sets unique title, description, canonical, one H1, and noindex on cart and checkout.

---

# TireDrop: trust, checkout and post-purchase audit (2026-09-29)

Request mode is honest: nothing is charged, and every step says so. Live mode has blockers.

## Top 10 (ranked by risk and revenue)

1. **Ship-to-store buyers get the wrong confirmation email.** Pickup drafts carry a shipping line and `requiresShipping: true` (`api/_lib/shopify.js:48,125`), so checkout very likely asks for a home address (untested). The email then says "right now these ship to that address" (`order-confirmation-local-block.liquid:21-25,42`), but the forwarder ships to the shop (`forwarder.js:328-329`). Flow #2 also sends a false alert for each one. **Fix:** prefill the shop address on pickup drafts, and key the Liquid and Flow on the Vercel `Source` attribute. **S**
2. **Paid orders reach ATD before the promised fitment call.** Checkout says "never charged for the wrong tire" and that the team calls before anything ships (`CheckoutPage.jsx:1314-1319,1418-1423`). SUBMIT sends any paid order that Shopify's risk check accepted (`forwarder.js:186-197`), and mounted tires are non-returnable. **Fix:** require a `fitment-confirmed` tag in `submitSearch`. **S**
3. **Install is shown in the total but never billed.** Totals include install (`CartPage.jsx:37-45`, `CheckoutPage.jsx:402-406`), but the API gets only SKU and quantity (`CheckoutPage.jsx:578`), so the Shopify invoice leaves it out. The email says install is "paid separately" (`liquid:38`). **Fix:** send install as a server-priced line, or show "from $25/tire, paid at the shop". **S**
4. **Florida's $1/tire new-tire fee is not collected** (`orders.js:68-71`, `shopify-checkout.md:186`). **Fix:** add a "$1 × tires" fee line to pickup and FL ship-to-home drafts. The accountant confirms how it is taxed. **S**
5. **The forwarder runs once a day and customers never hear about failures.** The cron is `0 12 * * *` (`vercel.json`), not every 5 minutes (`forwarder.js:4`). On failure, `atd-failed` only adds a tag and sends an internal email (`atd-forwarder.md:179`). The customer sees nothing, and the order just sits "unfulfilled". Orders left skipped drop out of the sweep after 14 days with no alert (`forwarder.js:81,195`). Cancelling in Shopify doesn't cancel at ATD. **Fix:** move to Vercel Pro with `*/5`. Build the failure and cancel Flows. Write a "couldn't source it" email with a 1-business-day refund rule. **M**
6. **There is no ship-to-store arrival notice, though the email promises one** (`liquid:37`). `atd-inbound-to-store` is set when ATD *ships*, not when the tires arrive, and it emails nobody (`forwarder.js:648-659`). **Fix:** staff tag `arrived-at-store`, and a Flow emails the customer to book a bay time and states the hold period. **M**
7. **`/api/checkout` has no rate limit or honeypot** (`checkout.js:59-118`; `forms.js` has both, `:32-34,59`). Each request-mode POST creates a customer, a draft and an info@ email. Typing a stranger's email prepends text to that real customer's note (`leads.js:388-396,433-437`). **Fix:** add the limiter, the honeypot and a WAF rate rule. Write only the metafield for existing customers. **S**
8. **Policies promise things the site doesn't do.**
   - The privacy policy says there is "no newsletter sign-up anywhere" (`LegalPage.jsx:243`), but the pop-up subscribes people (`App.jsx:155`, `newsletter.js:48`).
   - The full order JSON is logged to Vercel on failure (`orders.js:143,172,182`). The policy doesn't mention that, or the notes stored in Shopify.
   - The delivery estimate is said to be "shown at checkout" (`ShippingPage.jsx:92,344`; `LegalPage.jsx:131`), but checkout shows none.
   - `legalName` is null, and the return window is "call us" (`LegalPage.jsx:163`).

   **Fix:** correct the copy, and log only the order ref. **S**
9. **Tax shows as a flat 7% for all 48 states** (`CartPage.jsx:30,339`; `CheckoutPage.jsx:411`), while Shopify charges the real rate. **Fix:** label it "Estimated tax, final at checkout". **S**
10. **Some copy implies history TireDrop doesn't have.** `ReviewsPage.jsx:111-113` says reviews cover orders shipped across the US, but the brand has none (`:70`). Gallery captions read like real jobs ("six work vans, Tamarac yard", `GalleryPage.jsx:21,63,86`). **Fix:** delete that sentence, write the captions as "Example: …". **S**

## Other checks

- **Payments:** the site names cards only (`FinancingPage.jsx:34`) and gives no APR or lender names. That passes. Prompt 2 (`shopify-admin-prompts.md:38-62`) leaves only "Pay by phone" active, which creates unpaid orders that the forwarder skips. If Shopify Payments is enabled, turn Shop Pay Installments off, because it shows Affirm and APR text.
- **PCI:** confirmed. Card data never touches Vercel; the server returns only `invoiceUrl` (`checkout.js:87-93`). Phone payments put the shop in PCI scope: use Shopify POS, and never put card numbers in notes.
- **Chargebacks:** the agree box doesn't link the Terms or returns policy (`CheckoutPage.jsx:1464`). Add the link, and hold high-value orders whose shipping and billing addresses differ.
- **Outages:** when Shopify is down in live mode, the customer sees Shopify's raw error and the order is not logged (`checkout.js:120-124`). Nothing alerts on a sweep 500 or `summary.errors`: add an uptime check on `/api/status`.
- **Legal:** mounted-tire returns, transit damage, wrong items and warranty pass-through are covered (`LegalPage.jsx:156-181`). Missing: road hazard ("none included"), the return window in days, and a tire-registration (recall) notice.
- **Tax nexus:** the accountant should track each state's economic-nexus threshold for ship-to-home orders, and county surtax on FL deliveries. Not legal advice.

## Must fix before real orders

1. Pickup address, email and Flow logic (#1)
2. Fitment gate before ATD (#2)
3. Install billing (#3)
4. FL tire fee line (#4)
5. Pro plan with `*/5` cron, failure and cancel Flows, customer refund runbook (#5)
6. Payment setup: Shopify Payments active, installments off, decide on Pay by phone
7. Checkout rate limit and honeypot (#7)
8. Privacy and shipping copy, legal entity, return window (#8)
9. A test order per delivery mode on a dev store

---

# TireDrop competitor benchmark (Sept 2026)

**Method and limits:** WebFetch was blocked by the egress proxy for tirerack.com, simpletire.com, prioritytire.com, discounttire.com, tirediscounters.com, cartalk.com and support.google.com. Everything below comes from search-result snippets of those pages and was not checked on the live pages. I found no reliable data on competitors' email/SMS flows, trust badges or noise-rating display, so I've left those unrated.

## What the leaders do

| Site | Standout conversion/trust features |
|---|---|
| **Tire Rack** (now also [Discount Tire Direct](https://www.moderntiredealer.com/retail/article/55019168/discount-tire-direct-now-part-of-tire-rack)) | [10,000+ installers, booking at checkout, mobile install vans](https://www.tirerack.com/installers); ["98% ship same day"](https://www.tirerack.com/shipping) from 11 DCs; [free 2-yr road hazard](https://www.tirerack.com/trust-messaging/road-hazard-protection); [own track tests + surveys](https://www.tirerack.com/tires/tests); [Decision Guide quiz](https://www.tirerack.com/tire-decision-guide); [CAD-measured fitment](https://www.tirerack.com/upgrade-garage/how-does-tire-rack-know-what-fits); [30-day returns, pays if its error](https://www.tirerack.com/about/returns); [pay-over-time + store card](https://www.tirerack.com/financing/affirm) |
| **SimpleTire** | [20,000+ installers, all-in install price, book at checkout](https://www.prnewswire.com/news-releases/simpletires-new-feature-allows-customers-to-schedule-tire-installation-at-time-of-purchase-300621867.html); [mobile install](https://simpletire.com/mobile-tire-installation); [UTQG/warranty specs on PDP](https://simpletire.com/learn/tire-buying-guides/tire-ratings); [5 financing partners](https://simpletire.com/financing); [30-day returns, $20/tire fee](https://simpletire.com/returns-and-refunds); [per-shop SEO pages](https://simpletire.com/tire-shops) |
| **Discount Tire** | [Buy-and-book, "next-in-bay"](https://www.discounttire.com/buy-and-book); [paid repair/refund/replace certificates](https://www.discounttire.com/certificates); [app: appointment tracking, SMS reminders, Treadwell guide](https://www.discounttire.com/app) |
| **Priority Tire** | [Free ship, same-day before 1pm ET, 5,000+ installers with price ranges](https://www.prioritytire.com/ship-to-installer); [links to manufacturers' road-hazard programs](https://www.prioritytire.com/manufacturer-free-road-hazard) instead of selling its own; [90-day returns (10% restock)](https://www.prioritytire.com/return-policy); chat 8a–9p ET; [complaints about old DOT dates](https://www.trustpilot.com/review/prioritytire.com) |
| **Tirebuyer/Treadsy** | [18,000+ installers; installer rates shown before choosing; one payment](https://www.tirebuyer.com/installer-advantage) |
| **Costco** | [Price includes installation, lifetime maintenance, 5-yr road hazard](https://tires.costco.com/RoadHazardWarranty); [online booking](https://costcoguides.com/book-costco-tire-appointment/) |
| **Walmart** | [Install booked at checkout at ~2,300 Auto Care Centers](https://www.pymnts.com/walmart/2024/walmart-adds-third-party-sellers-tires-to-installation-eligible-program/); [optional road-hazard package](https://www.walmart.com/help/article/tire-warranty-terms-and-conditions/367ebb18c6a346c5abf407b456a1c9a8) |
| **Belle Tire** (regional, 185 stores) | [Book at checkout; all-in price; lifetime rotations/flat repair](https://www.belletire.com/tires-and-wheels/tire-installation) |
| **Tire Discounters** (regional, Shopify-style URLs) | ["Out The Door With More" bundle messaging](https://tirediscounters.com/pages/why-tire-discounters) |
| **Performance Plus Tire** (independent, Long Beach) | [Fitment team checks each package; mounted and balanced, free shipping](https://www.performanceplustire.com/Blog/performance-plus-tire-wheel-and-tire-packages-online) |

The common pattern: **fitment → installed price → appointment → fast delivery**, all shown before payment. Industry sources say [installed cost runs 25–60% above the tire's sticker price](https://resources.rework.com/libraries/automotive-sales-growth/online-pricing-transparency). That makes showing the installed price a way to win sales, not just a nice extra.

## Google Merchant Center / Shopping

- **Identifiers:** tires carry manufacturer UPCs, so [GTIN is required](https://support.google.com/merchants/answer/6324461?hl=en) along with [brand](https://support.google.com/merchants/answer/6324351). Add [MPN](https://support.google.com/merchants/answer/6324482?hl=en) as a fallback. Source the UPCs from ATD.
- **No bundled installation:** Google's [unsupported content list](https://support.google.com/merchants/answer/6150006?hl=en) names "car repair services bundled with purchase of tires." The feed price must be the **tire only**, and installed or mobile pricing can appear only on the site.
- **Policies:** [returns](https://support.google.com/merchants/answer/14011730?hl=en) and shipping settings must match the site exactly, which enables the [free-shipping annotation](https://shoppingsolutions.withgoogle.com/expertise/shipping-and-fulfilment-annotations/).
- **Ratings:** [product ratings need at least 50 reviews](https://support.google.com/merchants/answer/6098512?hl=en) and [store ratings about 100](https://support.google.com/merchants/answer/190657?hl=en). Only reviews actually collected count.
- **Are free listings worth it? Yes.** They cost nothing, show across Search, Shopping, Images and YouTube, and [organic Shopping traffic converts well per session](https://feedops.com/feedops/google-shopping-free-listings/). The Shopify Google channel does most of the setup. The only real cost is keeping the feed accurate, which depends on ATD.

## Top 15 features, ranked by likely impact

Effort: S = days, M = weeks, L = a month or more. **[ATD]** = needs ATD data.

1. **Fitment finder by year/make/model/trim, with staggered front/rear pairing and a "fits your vehicle" confirmation.** Done by Tire Rack and SimpleTire. It removes the biggest fear of buying tires online. TireDrop: add a fitment data source and pair front and rear sizes. **M [ATD or fitment vendor]**
2. **Installed-price toggle.** Done by SimpleTire, Costco and Belle Tire. It answers "what will I actually pay?" TireDrop: show tire + Sunrise install and tire + mobile service as line items. **S**
3. **Appointment booking at checkout** for ship-to-store and mobile service. Done by all the leaders. TireDrop: add a Shopify booking app with a date/slot step. **M**
4. **Delivery estimate by ZIP.** Tire Rack and Priority Tire lead on this. TireDrop: show "Ships from X, arrives by Y" only when stock data confirms it. **M [ATD]**
5. **Live price and stock sync**, so no orders get cancelled. Priority Tire's reviews show the damage cancellations do. **L [ATD]**
6. **Google free listings** with a tire-only price and GTINs. **M [ATD for UPCs]**
7. **Plain-language returns and fitment-error policy**, including that TireDrop pays return shipping if the mistake is ours. Tire Rack and SimpleTire have this. **S**
8. **Spec table** covering UTQG, warranty miles, 3PMSF, load/speed rating, run-flat, and tread depth when known. Leave out any field the data doesn't provide. **M [ATD]**
9. **Filters plus side-by-side compare of 2–4 tires** on price, warranty miles and UTQG. **M**
10. **Human help by chat, text and phone** with posted hours, like Priority Tire. Fitment questions close sales, and South Florida customers can reach a real store. **S**
11. **Verified review collection** through post-purchase email and Google Customer Reviews. Show ratings only once real reviews exist, and never seed them. **S**
12. **Warranty and road-hazard page** that links each brand's own program, the way Priority Tire does. Don't claim coverage TireDrop doesn't provide. **S**
13. **Checkout trust strip:** real store address in Sunrise, free shipping to the 48 states + DC, Shop Pay, and "pay over time with Shop Pay Installments" with no APR and no lender names. **S**
14. **Email/SMS flows:** cart reminder with no coupon, shipped/tracking message, appointment reminder like Discount Tire's SMS, and a rotation reminder. **S–M**
15. **Local SEO:** a Sunrise store page plus pages for each mobile-service city (Fort Lauderdale, Weston, Plantation…), backed by the Google Business Profile. SimpleTire and Discount Tire do this at scale. **S–M**

**Skip for now:** a mobile app. Discount Tire's app supports hundreds of stores, which doesn't pay off for a single location. Also skip Tire Rack-style test data. TireDrop can't produce it, so it should link to manufacturer and third-party tests rather than make up its own.
