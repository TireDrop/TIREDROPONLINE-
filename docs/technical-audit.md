# Technical audit — crawlability, metadata, structured data, performance

The surface a distributor's reviewer or a crawler sees: what the site serves
before anyone clicks anything. Covers crawlability, per-page metadata,
structured data, social previews, page weight and hosting configuration.

Everything below was measured against a real build in Chromium, not read off
the source. Where I could not verify something in this environment I say so.

---

## Method, so the numbers can be re-run

```bash
npx vite build --outDir .scratch/dist-audit --emptyOutDir
npx vite preview --outDir .scratch/dist-audit --port 4739 --strictPort
```

Transfer figures are `responseBodySize + responseHeadersSize` summed across
every request on a cold load (fresh browser context, empty cache) at 1280×900
in the bundled Chromium. They include the two Google Fonts requests, which go
out to the real network.

**Byte counts, not timings.** Localhost has no latency and no bandwidth limit,
so any LCP or TTFB measured here would be a number about this container rather
than about the site. Transfer weight is the portable metric, so that is what is
reported. Real field timings need a deployment.

Route coverage: all 69 sitemap URLs plus `/cart`, `/checkout`, a bad product
slug, a bad service slug and an unmatched path — 74 in total.

---

## 1. Crawlability — was entirely absent

There was no `robots.txt` and no `sitemap.xml`. Both now exist and both are
generated, never hand-typed: `scripts/generate-seo-files.mjs` parses the
`<Route>` table out of `src/App.jsx` and expands the two parameterised routes
from `products.js` and `services.js`, then writes `public/robots.txt` and
`public/sitemap.xml`. It is wired into `vite.config.js` as a build plugin, so
every `vite build` and `build:preview` refreshes them, and it also runs
standalone:

```bash
node scripts/generate-seo-files.mjs
# seo: sitemap.xml with 69 URLs, robots.txt disallowing all crawlers
```

69 URLs = 25 static routes + 20 tires + 12 wheels + 12 services. `/cart` and
`/checkout` are excluded (transactional, nothing for a crawler to see). The
script throws rather than emitting a short sitemap if it parses fewer than 20
static routes, so a change to the router's markup fails loudly instead of
silently shipping a truncated file.

The generator writes into `public/`, not `dist/`, so the exact bytes that ship
show up in a diff and can be reviewed before a deploy.

No `<lastmod>`. Stamping the build date onto all 69 URLs would assert that
every page changed on every deploy, which is false; Google discounts a lastmod
it cannot trust, so an absent one is worth more than a fabricated one.

### The judgement call: robots.txt currently disallows everything

_(Superseded 2026-09-29: the domain moved to Vercel on 2026-09-28 and
`ALLOW_INDEXING` is now `true`. robots.txt allows crawling except `/cart`,
`/checkout`, `/api/` and the filter states, and names the sitemap. The
reasoning below is kept as the pre-launch record.)_

`public/robots.txt` says `User-agent: * / Disallow: /`.

The site has not launched. `tiredroponline.com` still resolves to the previous
NetDriven site, so the only thing a crawler can reach is a Vercel deployment of
a storefront that is still being finished — representative catalog rather than
live distributor inventory, legal pages awaiting counsel, checkout that takes an
order rather than a payment.

Allowing crawling now costs three things and buys nothing:

- **It would be indexed on the wrong hostname.** With the brand domain pointed
  elsewhere, whatever got indexed would be indexed as `*.vercel.app` — a
  duplicate of the eventual site, on a URL nobody wants ranking, that then has
  to be removed rather than simply never created.
- **The canonicals point somewhere else.** Every page canonicalises to
  `tiredroponline.com`, which today serves a different company's site. That is
  a contradictory signal delivered at the exact moment first impressions form.
- **"TireDrop" would enter the index as a half-built store.** Thin and
  placeholder content in the index at launch is a hole you climb out of slowly,
  and the pages most likely to be crawled first are the ones with the least
  finished content.

Against that, the only cost of waiting is a few weeks of crawl history on a
domain that is not live. That is not a close call.

**This is reversible in one place.** `ALLOW_INDEXING` at the top of
`scripts/generate-seo-files.mjs` flips the file from `Disallow: /` to an
allowing version that also excludes `/cart`, `/checkout` and the `?search=` /
`?view=` filter states. The reason lives in a comment next to the switch, the
generated `robots.txt` repeats it, and it is item 11 on the README's go-live
list. **If nobody flips it, nothing ranks** — that is the failure mode to watch
for, and it is why it is written down in three places.

`vercel.json` also sends `X-Robots-Tag: noindex, nofollow`, scoped by a host
condition to `*.vercel.app` only. That half needs nobody to remember anything:
it stops applying the moment the site is served from a custom domain. It also
closes a gap that `robots.txt` cannot — a disallowed URL can still be indexed
by reference from a link elsewhere, whereas `X-Robots-Tag` actually prevents
indexing. _(Standard: Google Search Central documents this distinction. I am
citing it from knowledge, not from a page fetched in this session.)_

> **Not verified:** I could not deploy to Vercel from here, and
> `openapi.vercel.sh` is blocked by the egress proxy, so I could not validate
> `vercel.json` against the live schema. `has` with `type: "host"` on a
> `headers` entry is documented and I am confident in it, but if a deploy ever
> fails with "Invalid vercel.json", delete that one block — `robots.txt` alone
> still covers the pre-launch case.

---

## 2. Per-page metadata — better than expected, with real gaps

**Titles and descriptions were already good.** Every page passes a hand-written
`title` and `description` to `Seo`. Verified across all 74 routes: **0 duplicate
titles, 0 duplicate descriptions, 0 missing.** That is unusual and worth saying
plainly — it is a category that is clean.

What was missing:

|                                          | Before                 | Now                                   |
| ---------------------------------------- | ---------------------- | ------------------------------------- |
| `<title>`                                | unique on every route  | unchanged                             |
| meta description                         | unique on every route  | unchanged                             |
| canonical                                | **none anywhere**      | every route                           |
| `og:title` / `og:url` / `og:description` | home page only, static | per route                             |
| `twitter:title` / `twitter:description`  | none                   | per route                             |
| `robots`                                 | none                   | per route, `noindex` where it belongs |
| JSON-LD                                  | **none anywhere**      | per route (section 3)                 |

All of it is in the `Seo` component; no page was edited.

**Canonicals drop the query string on purpose.** `/tires`, `/tires?search=size`
and `/tires?view=brands` are one page in three UI states, so they all
canonicalise to `/tires`. That consolidates the signals rather than splitting
them across near-duplicates. _(Standard: general e-commerce practice for
faceted navigation, not a distributor requirement.)_

**`noindex` is applied where pages render at 200 but should never be indexed.**
`/cart` and `/checkout` are listed in the component. Product and service pages
work it out for themselves: `Seo` looks the slug up in the catalog, and a slug
that matches nothing gets `noindex, follow` without the page passing anything.
Verified: `/tires/not-a-real-tire` and `/services/not-real` both come back
`noindex, follow`.

**One thing I removed rather than added.** I briefly put a canonical into
`index.html` and then took it out. Every route is served that same file, so a
static canonical reads `https://tiredroponline.com/` on all 69 URLs and tells
any crawler that does not run JavaScript that the whole site duplicates the home
page — worse than having none at all. There is a comment in `index.html`
explaining this so nobody helpfully adds it back. Making it correct in the
_served_ HTML requires prerendering (section 4).

---

## 3. Structured data — added, with two things deliberately left out

There was none. There is now a JSON-LD `@graph` on every route, written by
`Seo` and rebuilt on navigation:

| Node                            | Where                                                                                      | Notes                             |
| ------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------- |
| `Organization`                  | every route                                                                                | TireDrop, the national storefront |
| `WebSite`                       | every route                                                                                |                                   |
| `WebPage`                       | every route                                                                                | title, description, canonical URL |
| `AutoPartsStore` + `AutoRepair` | `/`, `/locations`, `/contact`, `/install`, `/auto-service`, `/mobile-service`, `/schedule` | the Sunrise shop                  |
| `Product`                       | 32 product routes                                                                          |                                   |
| `Service`                       | 12 service routes                                                                          |                                   |

The shop is modelled as the **parent** of the brand, which is what the business
actually is: Extreme Tires is a local business in Sunrise, TireDrop is its
national online store. Two types because the shop genuinely does both retail and
bay work, and both are `LocalBusiness` subtypes Google recognises.

**Address, phone and hours come from `BUSINESS`,** so published hours and
marked-up hours cannot drift. `BUSINESS.hours` is parsed into
`openingHoursSpecification` (Mon–Fri 08:00–18:30, Sat 08:00–16:00, Sunday
dropped because it is "Closed"). Anything the parser does not recognise is
dropped rather than guessed — wrong hours in structured data send somebody to a
closed shop.

**`legalName` and `email` are omitted, not invented.** Both are `null` in
`business.js`. A registered company name in structured data is exactly the sort
of detail a dealer-approval reviewer compares against the application, so the
component emits them only once they exist.

### No review or rating markup, anywhere

No `AggregateRating`, no `Review`, on the shop node or on products — even though
`products.js` carries a `rating` and a `reviewCount` for every item. Those are
illustrative, and `GOOGLE_PROFILE.reviewsAreReal` is `false`. Publishing rating
markup for ratings nobody left breaches Google's structured-data policy and is
a well-known route to a manual action against the domain. _(Standard: Google's
published structured data policies. Cited from knowledge — I did not fetch the
policy page in this session.)_

Verified by grep against the rendered JSON-LD on a product page, the reviews
page and the home page: **0 occurrences** of `aggregateRating`, `review`,
`ratingValue` or `offers`.

### No `Offer` either, and this one is a trade

An `Offer` is a machine-readable commitment: this price, this availability,
buyable now. None of the three holds. `products.js` is a representative catalog,
`stock` is illustrative, and checkout takes an order for a human to call back on
rather than a payment. Emitting price and availability as fact would put a
shopper one click from a purchase the site cannot complete.

**What that costs, stated plainly:** a `Product` node with no `offers` and no
`aggregateRating` produces **no rich result at all** — Google needs one of
offers, review or aggregateRating for a product snippet. _(Standard: Google
Search Central's Product structured data requirements, from knowledge.)_ There
is no image either, since product art is generated SVG rather than photography,
which is a second blocker on the same rich result.

So the `Product` markup buys entity understanding for crawlers that read
entities rather than snippets, and nothing in the SERP. I judged that a better
trade than fabricating commerce facts to unlock a snippet. The code for the
offer is written and sitting behind `EMIT_OFFERS = false` in the `Seo`
component, with a comment saying to flip it when ATD or U.S. AutoForce pricing
and inventory are live. That is the moment the rich results come back, and it is
the same moment the facts become true.

---

## 4. Social preview — the honest answer is "home card for everything"

Checked by fetching the raw HTML a non-JavaScript scraper receives:

```bash
curl -s http://localhost:4739/tires/continental-truecontact-tour-215-60r16 \
  | grep -E 'og:title|og:url|<title>'
#   <title>TireDrop — Tires Shipped Free. Or Installed For You.</title>
#     property="og:title"          (the home-page card)
#   <meta property="og:url" content="https://tiredroponline.com/" />
```

**What works.** Any link to the site — home page or deep link — previews as a
valid TireDrop card: correct 1200×630 image (verified: `og-tiredrop.jpg` is
exactly 1200×630), `summary_large_image`, title, description, site name. Paste
any URL into Slack, Teams, iMessage or LinkedIn and something correct and
on-brand appears. For a reviewer passing a link around internally, that is the
behaviour that matters and it is fine.

**What does not work, and cannot without a server.** The card is the _same_ card
for every route. A link to a specific tire does not preview that tire's name or
price. Facebook, X, LinkedIn, Slack and iMessage do not execute JavaScript, so
the per-route `og:` tags the `Seo` component writes are invisible to them. This
is inherent to a client-rendered SPA — no amount of work inside `Seo` changes
it.

Googlebot is the exception: it renders JavaScript, so it sees the per-route
title, description, canonical, `robots` and JSON-LD. Everything in sections 2
and 3 works for search. It is only the social scrapers and non-rendering
crawlers that are limited.

**The fix, when it is worth doing:** prerender each route to its own static HTML
file at build time. Playwright is already a dev dependency, and Vercel serves a
static file at `/tires/foo/index.html` before it applies the SPA rewrite, so it
drops in without changing the routing. That gives per-route social cards, a
correct canonical in the served HTML, JSON-LD visible to non-rendering crawlers,
and faster first paint. It is roughly a day of work plus a build-time cost, and
it is worth doing before launch, not before the distributor review.

> **Done 2026-09-29 (Blog + Learn phase 0).** Every route is now prerendered
> at build time: `npm run build` runs `scripts/prerender.mjs`, which renders
> the real app with React's server renderer (not a headless browser, so it
> runs the same on Vercel's build image) into `dist/<route>.html`, each with
> its own title, description, canonical, robots, Open Graph/Twitter tags,
> JSON-LD (now with `BreadcrumbList` on inner pages) and body. `src/main.jsx`
> hydrates it. The build fails, naming the route, if a page renders empty,
> without an `<h1>`, as the 404 page, or with a duplicate title. Unknown paths
> now get `dist/404.html` with a real 404 status; see section 6.
> `npm run check:prerender` verifies it in Chromium.

---

## 5. Performance — the bundle warning is gone

### Before

```
dist/assets/index-DomX_Xo4.js   748.14 kB │ gzip: 213.28 kB   ← over the 500 kB warning
dist/assets/index-DcGGrhu7.css   55.75 kB │ gzip:   9.73 kB
```

Cold home-page load, 8 requests, **407.7 kB**:

|                    |          |
| ------------------ | -------- |
| script             | 208.8 kB |
| font               | 118.9 kB |
| image              | 66.8 kB  |
| stylesheet         | 11.2 kB  |
| document + favicon | 2.0 kB   |

Every route cost the same 407.7 kB, because every route was the same bundle.

### What I did

Route-level code splitting in `src/App.jsx`: every page except `HomePage` is a
`React.lazy` import, wrapped in one `Suspense` whose fallback holds the viewport
open so the footer does not jump. `HomePage` stays static on purpose — it is the
first paint for most visitors, and making it wait on a second round trip would
trade the win away at the moment it matters.

Yes, it was worth doing. The three tool pages are 1,400–1,900 lines each and
none of them is on the path to a first paint; together they are 116 kB raw /
38.7 kB gzip that used to ship to everyone.

> **Scope note for whoever is coordinating:** `src/App.jsx` was not on my owned
> list, though it was not on the do-not-edit list either. I checked it was
> unmodified in the working tree before and after, and the change is confined to
> the import style plus one `Suspense` wrapper. Flag it if that was not wanted.

### After

```
.scratch/dist-audit/assets/index-B9vfRhvn.js   297.50 kB │ gzip: 92.97 kB
  + 44 route chunks, 1.5 kB – 42.6 kB each
.scratch/dist-audit/assets/index-C53U7lkz.css   55.80 kB │ gzip:  9.75 kB
```

| Route           | Before   | After        | Requests |
| --------------- | -------- | ------------ | -------- |
| `/`             | 407.7 kB | **290.2 kB** | 8 → 8    |
| `/tire-size`    | 407.7 kB | **306.4 kB** | 8 → 13   |
| `/tires/{slug}` | 407.7 kB | **299.5 kB** | 8 → 13   |

JavaScript on the home page: **208.8 kB → 91.1 kB**, a 56% cut. The home page
gains no extra requests at all. Other routes pick up ~5 extra requests, all of
them sub-kilobyte shared icon chunks that HTTP/2 multiplexes — a rounding error
against the 105 kB saved.

The 500 kB Rollup warning no longer fires.

(For completeness: the metadata and structured-data work in section 2–3 added
11.9 kB raw / 3.7 kB gzip to the entry chunk. It is in the "after" figures.)

### What is left, measured

The remaining 290 kB on the home page:

|                      |          | share |
| -------------------- | -------- | ----- |
| fonts (Google Fonts) | 118.9 kB | 41%   |
| JavaScript           | 91.1 kB  | 31%   |
| brand image          | 66.8 kB  | 23%   |
| CSS                  | 11.2 kB  | 4%    |

Fonts are now the single largest item, and most of it is one design decision.

**Archivo's width axis costs 53.9 kB.** A/B measured in Chromium against the
real Google Fonts endpoint:

| Request                                         | Archivo woff2                         |
| ----------------------------------------------- | ------------------------------------- |
| `Archivo:wdth,wght@100..125,500..900` (current) | **88.8 kB**                           |
| `Archivo:wdth,wght@108,500..900` (axis pinned)  | 88.8 kB — _identical file, no saving_ |
| `Archivo:wght@500..900` (axis dropped)          | **34.9 kB**                           |

The site only ever uses one width: `src/index.css` sets
`font-variation-settings: "wdth" 108` and nothing varies it. But pinning the
axis in the Google Fonts URL saves nothing — verified, same file hash — so the
53.9 kB is only recoverable by dropping the axis, which would render Archivo at
wdth 100 and change the typography the design was built on.

The way to get both: **self-host a static Archivo instance at wdth 108, weights
500–900, latin subset.** That should land near 20–30 kB, and it also removes a
cross-origin round trip to `fonts.googleapis.com` from the critical path.

I did not change this. The font choice and the width axis are a live design
decision, `index.css` is being worked on by someone else, and unilaterally
narrowing a typeface mid-rebuild is not my call. The number is here so whoever
owns it can decide with it. _(Instrument Sans's italic axis, by contrast, costs
nothing — 30.1 kB either way. Leave it.)_

**The logo is ~2.8× oversized.** `public/brand/tiredrop-full.webp` is 440×444
and 66.8 kB. Measured across seven routes at 1440px and at 390px, the largest it
is ever rendered is **79×80 CSS pixels** — 158×160 at DPR 2. A 160×162 WebP
should come in near 15 kB, saving roughly 50 kB, which is the biggest single
remaining item after the font.

I did not swap it. The masthead is being rebuilt right now by the person who
owns `Logo.jsx`, and replacing brand artwork underneath an in-flight redesign is
how you end up with a blurry logo nobody can explain. It is a one-line change
when they are ready — Pillow is available in this environment:

```python
from PIL import Image
im = Image.open("public/brand/tiredrop-full.webp")
im.resize((160, 162), Image.LANCZOS).save("public/brand/tiredrop-full.webp",
                                          "WEBP", quality=90, method=6)
```

Both together would put the cold home-page load near **190 kB**, from 408 kB.
The font figure is measured; the image figure is an estimate until the file is
actually re-encoded.

---

## 6. Hosting config

> **Changed 2026-09-29 with prerendering.** The catch-all rewrite is gone.
> `cleanUrls: true` serves `dist/tires.html` at `/tires`, `trailingSlash:
> false` 308s `/tires/` to `/tires`, and a path with no file gets
> `dist/404.html` **with status 404** (Vercel's error route; confirmed in the
> routing table `vercel build` generates). The only rewrite left is
> `/tires/p/:sku` → `/spa`, the unrendered app shell, because those tires come
> from the live distributor API and cannot be listed at build time. The old
> `<Navigate>` routes (/coupons, /deals, /track-order) are real 301s in
> vercel.json now, and the prerender fails the build if a new one is added
> without a redirect. What follows describes the setup before that.

**The SPA rewrite is correct.** `"/(.*)"` → `/index.html`. Vercel serves static
files from the output directory before applying rewrites, so hashed assets,
`/brand/*`, `robots.txt` and `sitemap.xml` all resolve normally and only unknown
paths fall through to the app. Confirmed locally: all four return 200 and serve
the right content.

**Caching headers added.** There were none.

| Path                          | Header                                                 | Why                                                                                                                   |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `/assets/(.*)`                | `public, max-age=31536000, immutable`                  | Vite content-hashes these; a changed file is a changed URL, so they can never go stale                                |
| `/brand/(.*)`                 | `public, max-age=86400, stale-while-revalidate=604800` | stable filenames, so not immutable — a logo swap has to reach people within a week                                    |
| `/robots.txt`, `/sitemap.xml` | `public, max-age=300`                                  | these are the launch-day levers; a long cache would hold the pre-launch `Disallow` in front of crawlers after go-live |

> **Not verified:** I did not confirm what Vercel's default `Cache-Control` is
> for static files on this project, and the docs search did not state it.
> Setting these explicitly makes the answer irrelevant, which is the point.

Also added `"$schema"` so the file validates in an editor. The three existing
security headers are untouched.

---

## 7. Left for someone else

Ordered by how much it matters.

1. **Flip `ALLOW_INDEXING` on launch day.** `scripts/generate-seo-files.mjs`.
   Nothing ranks until this happens. (README go-live item 11.) _Done
   2026-09-29._
2. **Self-host Archivo at wdth 108, or drop the width axis.** 53.9 kB, measured.
   Owner: whoever owns `index.css` and the type system.
3. **Re-encode `tiredrop-full.webp` to ~160×162.** ~50 kB, estimated. Owner:
   whoever finishes the header rebuild.
4. **Prerender routes at build time** before launch — per-route social cards,
   correct canonicals in the served HTML, JSON-LD for non-rendering crawlers.
   Section 4 has the approach.
5. **`src/pages/NotFoundPage.jsx` should pass `noindex` to `Seo`.** It is the
   `*` route, so the component cannot detect it the way it detects a bad product
   slug. One prop. The other two 404 paths already handle themselves.
6. **`src/pages/services/ServiceDetailPage.jsx` renders no `<h1>` on its
   "Service Not Found" branch.** Found while sweeping all 74 routes — it was the
   only route of the 74 missing one. The `EmptyState` title is not a heading.
   Minor, and the route is `noindex` now, but it is a real gap.
7. **`src/pages/shop/TiresPage.jsx` advertises Goodyear in two meta descriptions
   and one lede** (lines 257, 262, 317), and `CouponsPage.jsx` names it at line 46
   (that page has since been removed along with every deal and promo code). Goodyear was deliberately removed from `TIRE_BRANDS` because the catalog
   has no Goodyear products, so those descriptions promise a brand that returns
   zero results. I fixed the same problem in `index.html`; these four are in
   pages I do not own.
8. **No `apple-touch-icon` and no web manifest.** `index.html` has only an SVG
   favicon. Adding a touch icon needs a 180×180 PNG on an opaque background —
   iOS composites transparency onto black — which is artwork work, not markup
   work, so I did not guess at it.
9. **Consider prefetching route chunks on link hover** now that routes are
   split. React Router does not do this on its own. Low priority: the chunks are
   small and the `Suspense` fallback is brief, but on a slow connection a first
   navigation now has a visible gap it did not have before.

---

## Verification run

```
74/74 routes: unique title, unique description, correct canonical, JSON-LD present
 0 duplicate titles
 0 duplicate descriptions
 0 page errors
 0 occurrences of aggregateRating / review / ratingValue / offers in emitted JSON-LD
npm run lint: 0 errors, 4 warnings (all pre-existing, none in files touched here)
npx vite build: clean, no chunk-size warning
npx vite build --mode preview: clean; hash routes verified working with lazy chunks
```
