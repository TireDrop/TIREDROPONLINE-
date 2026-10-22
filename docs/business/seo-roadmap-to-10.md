# SEO roadmap: from 6/10 to 10/10

Starts from `docs/audits/2026-10-18-site-seo-audit.md` (6/10: technical 8, on-page 6.5, structured data/local/off-site 5). The score measures readiness, not rankings. Rankings take weeks to months after the work lands, and a true 10 needs things that cannot be faked: real inventory pages, real reviews, real links.

## Phases

| Phase | Who | When | Gets us to |
| --- | --- | --- | --- |
| 0. Verify Google can see the site | Justin (Chrome prompt) | Today, 10 minutes | Baseline data: Search Console and Bing Webmaster set up, sitemap submitted |
| 1. Technical clean-up | Claude (preview branch, Justin merges) | 1 day | Technical 8 to 9 |
| 2. Words and links | Claude, parallel agents (preview branch) | 3 to 5 days | On-page 6.5 to 8.5 |
| 3. Local and off-site | Justin on the websites; Claude writes the Chrome prompts | This week | Local/off-site 5 to 7.5 |
| 4. Real inventory pages and product markup | Claude, after the ATD feed is live | Blocked on ATD | Technical 9.5, on-page 9.5, schema/Merchant 9 |
| 5. Authority and upkeep | Both, ongoing | Weeks to months | Local/off-site 9 to 10; a monthly re-audit keeps it there |

## Phase 0: Justin
- [ ] Verify tiredroponline.com in Google Search Console, submit /sitemap.xml
- [ ] Set up Bing Webmaster Tools (import from Search Console)
- [ ] Decision: the return window (days) for the returns policy and product markup

## Phase 1: technical (Claude)
- [ ] robots.txt: remove `Disallow: /*?view=` and `/*?search=` so Google follows the /brands redirect and the footer's vehicle and size links
- [ ] `/wheels?view=fitment` gets its own indexable, prerendered route
- [ ] `/tires?view=brands` redirect drops the query string (lands on plain /brands)
- [ ] Remove the stray NUL bytes the prerender writes into 4 pages
- [ ] Bring the entry JavaScript back under 113 KB gzip; run Lighthouse and fix what it finds (Core Web Vitals)
- [ ] /brands: more useful text (what each group is, how to shop it) so it is not thin

## Phase 2: words and links (Claude, agents in parallel)
- [ ] Titles and H1s for /tires, /wheels, /install, /commercial-tires, /mobile-service; brand in every product H1
- [ ] Learn and Blog articles link to product, category and brand pages (a "related" block per article); wheel pages link to a guide
- [ ] Fill the 7 thin city pages (ZIPs, roads, neighbourhoods); add Palm Beach and more Miami-Dade pages
- [ ] Rewrite the 12 service pages; remove the repeated "a visit and a tow" sentence
- [ ] Write the top 10 new content pieces listed in the on-page report (house rules apply)
- [ ] llms.txt and an explicit AI-crawler policy in robots.txt

## Phase 3: local and off-site (Justin on websites)
- [ ] Google Business Profile: confirm the name and categories, add the Place ID and review link to the site
- [ ] extrememobiletires.com links to TireDrop and TireDrop links back (then add the domain to `sameAs`)
- [ ] Citations: Yelp, Bing Places, Apple Business Connect, Facebook, the usual tire-shop directories, same name/address/phone everywhere
- [ ] Review habit: ask real customers after installs; never write or buy reviews

## Phase 4: needs the ATD feed
- [ ] Brand, category, size and vehicle landing pages built from real inventory; /brands tiles link to them
- [ ] Prerender or server-render the top SKUs at `/tires/p/:sku` so real inventory can rank
- [ ] Product, Offer, shipping and return markup on, only for real prices and stock
- [ ] Merchant Center free listings through a custom feed (not Shopify: it clashes with the site's /products redirects)

## Phase 5: ongoing
- [ ] Backlinks: supplier and brand dealer locators, local business groups, chambers, genuine press; never paid links
- [ ] Two new articles a month plus a refresh of the oldest
- [ ] Monthly scored re-audit as a scheduled task; the score only goes up when the work lands

## Rules for everything above
No discounts or deals language, no invented reviews, ratings or "since" years, never say tires are "safe to drive", no delivery or arrival dates, no APR or lender names. Free shipping covers the 48 contiguous states and DC; installation is South Florida only. Nothing goes live without Justin's yes.
