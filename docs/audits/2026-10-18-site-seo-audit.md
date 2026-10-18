# Site-wide SEO audit, 2026-10-18

Three parallel audits of the live build (`1.0.0+8014dd9`, the commit that put `/brands` and the home brand strip live). Read-only: nothing was changed. No Lighthouse run and no Search Console data were available, so rankings and traffic are not measured here.

## Score: 6 out of 10

| Area | Score | One line |
| --- | --- | --- |
| Technical SEO | 8 | Every indexable page is prerendered with its own canonical, one h1, JSON-LD and real text; sitemap matches. |
| On-page and content | 6.5 | Good titles and 90 sourced articles, but no brand, category, size or vehicle landing pages, and generic money-page titles. |
| Structured data, local and off-site | 5 | Markup is clean and honest, but Product/Offer, Merchant Center, Google Business Profile data and backlinks are not built. |

Overall is a weighted average: technical 40%, on-page 35%, structured data/local/off-site 25% (6.1, rounded to 6). The ceiling is mostly the sample catalog: only 20 tire and 12 wheel pages can rank until the ATD feed is live.

## What to fix first (ranked)

1. **Landing pages that can rank for head terms** (brand, category, size, vehicle). Only `/tires` and `/wheels` exist, so "all season tires" or "Michelin tires" cannot rank. `/brands` is a dead end: tiles link nowhere, about 190 prose words. Needs the ATD feed for real inventory.
2. **Money-page titles and H1s**: `/tires` is "Shop Tires", `/install` is "Ship to Store & Install", and the 32 product H1s drop the brand. Rewrites are in the on-page report below.
3. **Internal links**: 0 of 90 Learn/Blog articles link to a product, category or brand page; 0 of 12 wheel pages link to a guide.
4. **robots.txt works against the site**: `Disallow: /*?view=` stops Google following the new `/tires?view=brands` to `/brands` 301; `Disallow: /*?search=` blocks the footer's `/tires?search=vehicle` and `/tires?search=size` links (420 links across 207 pages). `/wheels?view=fitment` is a real content page that is blocked and canonicals to `/wheels`.
5. **Local**: Google Business Profile not wired in (`geo`, Place ID, review link null); extrememobiletires.com and TireDrop do not link to each other; 7 of 14 city pages have no ZIPs, roads or neighbourhoods; Palm Beach has 0 pages and Miami-Dade 1. Needs Justin on the websites (Chrome prompts).
6. **Product markup**: no Product, Offer, shipping or return markup on any product page. Build it behind a flag now, switch on when ATD is live. The return policy has no window yet (Justin's decision).
7. **Off-site**: no backlink, citation or Bing Webmaster plan in the docs.
8. **Merchant Center**: the planned Shopify route likely conflicts with the site's own `/products` redirects; use a custom feed.
9. **Service pages**: 12 templated pages (10 under 300 prose words); all 12 share one sentence ("a visit and a tow") that does not fit oil change or lift kits.
10. **Small technical**: 4 pages ship stray NUL bytes from prerender; entry JS is about 125 KB gzip (113 KB on 2026-10-02); performance not re-measured.

Already strong: 0 duplicate titles, 0 orphan pages, 0 broken internal links, 90 sourced articles at a median of about 2,000 words, no invented ratings or reviews, no house-rule violations found.

---

# Report 1: Technical SEO

# TireDrop Technical SEO audit (Crawl)

Date: 2026-10-18. Repo `/home/claude/tiredroponline-` at `8014dd9` (main). Read-only: nothing in the repo was edited, built, committed or pushed.

How I checked: parsed all 208 built `dist/*.html` files, read `vercel.json`, `scripts/generate-seo-files.mjs`, `scripts/prerender.mjs`, `src/entry-server.jsx` and `src/App.jsx`, ran `npm run check:links`, and fetched the live site with curl. The live site is on the same build as the repo: `/api/status` reports `1.0.0+8014dd9`, and all 18 pages I pulled live that have a `dist/` counterpart are byte-identical to it. The 19th, `/tires/p/abc`, is an unrendered shell with no `dist/` file to compare. One caveat: my first fetch of the live sitemap showed 197 URLs (an old cached copy, `age: 337`); the current live sitemap has 198 and includes `/brands`.

Not done: no Lighthouse or Core Web Vitals run, no Search Console or CrUX data, no browser rendering (Playwright has no browser installed here). Performance scores below rest on what ships in the code, headers and file sizes, not on measured LCP or INP.

---

## 1. Score

**Technical SEO: 8 / 10.** The crawl path is sound: every indexable page is prerendered with its own canonical, one h1, JSON-LD and real body text, the sitemap matches the indexable pages exactly, and unknown URLs return a real 404. It stops short of 9 or 10 because the real distributor inventory (`/tires/p/:sku`) is a client-rendered noindex shell, a few robots.txt rules work against the site's own redirects and links, and performance has not been measured since the main bundle grew.

| Sub-score | /10 | Basis |
| --- | --- | --- |
| Crawlability and indexing | 8 | 198 sitemap URLs = 198 indexable built pages, 0 noindex or redirected URLs listed, `check:links` PASS (206 pages, 0 broken, 0 indexable orphans). Lost points: `?view=` Disallow side effects, and only 32 product pages can ever be indexed. |
| Redirects and canonicals | 9 | 206 of 208 pages have a self-referencing canonical (the 2 without are `/spa` and `/404`, both noindex), 0 mismatches, 0 query strings, 0 trailing-slash splits, og:url equals canonical everywhere. 45 redirects, 43 are 301, 0 chains, 0 loops. One redirect is blunted by robots.txt (finding 3). |
| Prerender and rendering | 8 | 0 of 198 indexable pages are empty shells (thinnest: `/find-my-tires`, 1,458 chars of main-content text). Exactly 1 h1 on every page except the `/spa` shell. 4 pages ship stray NUL bytes (finding 5). Some content lives only behind client-side query views (findings 1 and 2). |
| Performance signals | 7 | Self-hosted fonts, immutable asset caching, brotli, route splitting, `modulepreload` on every page. Entry JS has grown to about 106 KB brotli (125 KB gzip), and there is no fresh measurement. |

---

## 2. Ranked findings

Items already fixed or accepted in earlier audits (`docs/audits/2026-09-24-technical-audit.md`, `2026-10-04-seo-indexing.md`) are not repeated as new. See section 4.

### High

**1. The real tire inventory cannot be indexed, and only 32 product pages can.**
- What: `/tires/p/:sku` (live distributor tires) is rewritten to `/spa` in `vercel.json`. Live, `https://tiredroponline.com/tires/p/abc` returns 200 with a 4.5 KB empty shell, 0 h1, `noindex, follow`, no canonical. `TireSkuPage.jsx` also sets `noindex` after hydration (lines 33-36, 55-58). The 20 `/tires/<slug>` and 12 `/wheels/<slug>` pages are the only product URLs in the sitemap. They carry no `Product` JSON-LD (`EMIT_OFFERS` is off on purpose), and there are no static links to any `/tires/p/` URL in the built HTML.
- Why it matters: For a tire retailer, size, brand and model pages are where the ranking opportunity is. Today none of the live catalog can rank, however good the rest of the technical setup is.
- This is by design while ATD is in sample mode (`/api/status` shows `"atd":"sample"`, `"checkout":"request"`). It is a ceiling, not a bug.
- Fix, once ATD pricing and stock are real: prerender or edge-render SKU pages to static HTML, each with its own canonical, `index, follow`, and `Product` + `Offer` JSON-LD (flip `EMIT_OFFERS`). Add them to the sitemap, splitting into a sitemap index if it passes about 5,000 URLs. Keep the house rules: no delivery or arrival dates, no invented ratings, no discount language.

### Medium

**2. `/wheels?view=fitment` is a real content page that search engines cannot see.**
- Where: `src/pages/shop/WheelsPage.jsx:226-262` renders its own title, description, h1 and a grid of fitment steps when `?view=fitment`. It is not prerendered (prerender only builds static routes), the canonical drops the query so it points to `/wheels`, and `robots.txt` has `Disallow: /*?view=`. It is linked from the footer nav (`business.js:140`) and 5 built pages.
- Why: the "Wheel Fitment Guidance" content (bolt pattern, offset, centre bore, load rating) is invisible to crawlers, and the link passes equity into a blocked URL.
- Fix: give it its own route, for example `/wheels/fitment`, in `App.jsx` so it prerenders, lands in the sitemap and has a self-canonical. The same pattern was already applied to Brands (`/brands`). Add a vercel.json 301 from `/wheels?view=fitment`, and link the new path.

**3. `Disallow: /*?view=` stops Google from ever following the new `/tires?view=brands` to `/brands` 301.**
- Where: `public/robots.txt` and `scripts/generate-seo-files.mjs`; `vercel.json` first redirect.
- Evidence: live `curl -D- 'https://tiredroponline.com/tires?view=brands'` returns `301`, `location: /brands?view=brands`. Two problems:
  - robots.txt blocks the source URL, so Googlebot cannot fetch it and never sees the 301. Any external or old link to `/tires?view=brands` cannot consolidate into `/brands`.
  - Vercel forwards the query string, so people land on `/brands?view=brands`, which is itself disallowed. It does carry the correct canonical `/brands`, and users are unaffected.
- Fix: delete `Disallow: /*?view=` (and `Disallow: /*?search=`, see finding 4). The canonical already consolidates those states, and Google advises against blocking URLs that you canonicalise. If a block is still wanted, add `Allow: /tires?view=brands$`. The query-forwarding part is cosmetic and can stay.

**4. Two footer links on every page point at robots.txt-blocked URLs.**
- Where: `src/data/business.js:128-129` and `205-206`. `/tires?search=vehicle` and `/tires?search=size` appear on 207 of 208 pages, which is 420 internal links in total. Both match `Disallow: /*?search=`.
- Why: Google cannot crawl the target, so it cannot read the canonical to `/tires`. The URLs can get listed without content ("indexed, though blocked by robots.txt"), and the link equity goes into a dead end. These are also the most-linked query URLs on the site.
- Fix: remove `Disallow: /*?search=` and let the canonical do its job (same as finding 3). The alternative is pointing the footer at `/tires` and using `#` anchors for the vehicle and size tabs.

**5. Brand tiles on `/brands` link nowhere, and there are no brand landing pages.**
- Where: `dist/brands.html` main content has 9 links, none to a brand. `/tires?brands=Nitto` and the other 19 brand-filter links canonicalise to `/tires` (correct, but it means no brand URL can rank).
- Why: "Nitto tires", "Continental tires" and similar are among the highest-intent searches in this category. The new page has 1,526 characters of main text and 42 logos, so it is also the thinnest page in the sitemap apart from `/find-my-tires` (1,458).
- Fix: when brand copy and catalog data are ready, give the brands that have catalog products a prerendered `/brands/<slug>` page (today that is 6 tire brands across the 20 sample tires, plus the wheel brands). Link the tiles to them, and list them in the sitemap. Until then, expect "Crawled, currently not indexed" risk on `/brands`.

### Low

**6. Stray NUL bytes in 4 prerendered pages (valid-HTML defect, no visible effect expected).**
- Where: `dist/accessibility.html` (2), `dist/shipping.html` (2), `dist/mobile-service/hialeah-fl.html` (1), `dist/blog/unused-tires-still-age-myth.html` (1). Live `/shipping` has them too: `Do not mount it \x00\x00— a mounted tire`. The source text, the JS chunk and `index.html` are clean, so they are introduced during prerender.
- Cause: not isolated. A candidate worth testing is `src/entry-server.jsx:99-103`, where the stream sink does `html += chunk.toString()` on each Buffer separately. React 18.3.1's streaming renderer writes in fixed-size chunks, so it may be mishandling multi-byte characters (en dash, em dash, middle dot) at chunk edges. I have not confirmed this, and U+FFFD, the usual symptom of a split character, appears nowhere in `dist/`.
- Why it matters: by the HTML parsing rules, a NUL in body text is ignored, so users and Google most likely see normal text. I did not test this in a browser. It still fails HTML validation and could bite a stricter parser.
- Fix: collect the chunks as Buffers and decode once (`Buffer.concat(chunks).toString("utf8")`), strip `\0` in `scripts/prerender.mjs`, and add a build check that fails if any output contains a NUL.

**7. Main bundle has grown and no one has re-measured.**
- Evidence: `dist/assets/index-BSZfx-O8.js` is 382 KB raw, 124.8 KB gzip -9, 106 KB brotli. `index-d4tsdf1l.css` is 97 KB raw, 17.3 KB gzip. The launch checklist quotes "main JS 113 KB gzipped" for 2026-10-02 and the 09-24 audit measured 93 KB, so the entry has gained roughly 12 KB gzip in 16 days. `ChatWidget` (22 KB source) is imported statically in `src/App.jsx:8`, so it ships on every page.
- Fix: load `ChatWidget` with `lazyPage` or on first interaction/idle, then re-run Lighthouse mobile on `/`, `/tires` and one article. The last recorded numbers are from 09-29, before self-hosted fonts and the recent additions.
- Related, minor: `/tires` is 384 KB of HTML (about 20 KB brotli over the wire) with 3,590 elements and 134 `<option>` tags (year and make selects). That is fine for crawling, but it is above Lighthouse's DOM-size warning level.

**8. `/brands` logos carry no `width`/`height`, and two logo files are large.**
- Where: 42 `<img>` tags in `dist/brands.html` (all the other 444 images in the build have dimensions). `public/brand/logos/falken.png` is 240 KB (rendered at about 150×56 with `scale(1.7)`), `carlstar.jpg` is 90 KB. The whole folder is 884 KB across 42 files.
- Why: layout shift risk (the tiles appear to be fixed-height boxes, so probably 0, but I did not measure it) and wasted transfer. All are `loading="lazy"`, so no effect on first paint.
- Fix: add `width`/`height`, and re-export Falken at about 300 px wide.

**9. No `/favicon.ico` (live 404) and only an SVG icon declared.**
- Where: `index.html` declares `rel="icon" type="image/svg+xml"`, `apple-touch-icon` and a manifest. `curl https://tiredroponline.com/favicon.ico` returns 404.
- Why: many crawlers and browsers request `/favicon.ico` by default, and Google's favicon fetch is happiest with a PNG or ICO that is a multiple of 48 px.
- Fix: add `<link rel="icon" href="/brand/icon-192.png" sizes="192x192" type="image/png">` and drop a 48×48 `favicon.ico` into `public/`.

**10. `shop.tiredroponline.com` is a live storefront that redirects by JavaScript.**
- Evidence: `https://shop.tiredroponline.com/` returns 200 with `noindex`, a canonical to `https://tiredroponline.com/`, and a `location.replace()` script. Pages like `/pages/contact` carry `canonical https://tiredroponline.com/pages/contact`, which then 301s to `/contact`. Its `sitemap.xml` is published and lists 22 URLs (19 pages and 3 collections), all noindex. `shop.` `robots.txt` says "crawlable".
- Why: noindex makes this safe, but the signals are untidy: a JS redirect rather than a 301, canonicals that land on redirecting URLs, and a sitemap of noindex URLs that Search Console will flag.
- Fix: if the Search Console domain property includes `shop.`, do not submit its sitemap. In Shopify admin, add real URL redirects for the 19 pages and 3 collections, and point the theme's canonical at the final main-site URL. Leave the 301s for `/account`, `/checkouts` and `/cart/c/` in place.

**11. `/404` returns 200 and some redirect catch-alls land on the home page.**
- Evidence: `curl -I https://tiredroponline.com/404` returns 200 (noindex, follow, no canonical). It is not linked anywhere, so this is cosmetic. Separately, `vercel.json` sends `/pages/:path*` to `/` (301). Google may treat redirects of unrelated old pages to the home page as soft 404s. `/products/:path*` and `/collections/:path*` go to `/tires`, which is more reasonable.
- Fix: serve `/404` as 404 (a one-line `routes` or rewrite status), and map known old `/pages/*` slugs one by one. Let unknown ones 404.

**12. `<lastmod>` depends on the build machine's git depth.**
- Evidence: the 32 `/tires/*` and `/wheels/*` URLs show `2026-10-02` on the live sitemap. Computed from git history locally they come out as `2026-10-08`. The script falls back to the committed date when git is shallow. The committed `public/sitemap.xml` is stale (home page 10-04; live shows 10-18).
- Why: dates are understated, not invented, so Google's trust in lastmod is not at risk. It is just not reproducible, because the same commit gives different sitemaps on different machines.
- Fix: commit the regenerated `public/sitemap.xml` with each content change, or give Vercel a deeper clone.

**13. Known and accepted, still open.**
- 61 titles over 60 characters (16 over 65, max 69) and 54 meta descriptions over 160 (35 over 175, max 243 on `/locations`). Reported on 10-04 as non-penalising. All 208 pages share one `og:image` (the home card), which is fine for previews.
- Ranked last because Google rewrites rather than penalises. Not new.

---

## 3. What is already strong (with evidence)

- **Sitemap and robots**
  - `dist/sitemap.xml` has 198 `<loc>`, 198 unique. All 198 indexable built pages are listed, and none of the 10 noindex pages is.
  - 0 redirected URLs listed, 0 query variants, 0 duplicates.
  - Every `lastmod` is a real date in the `YYYY-MM-DD` form and no page is stamped with the build date (live home is 2026-10-18, the date its source last changed).
  - `robots.txt` allows all, blocks `/cart`, `/checkout`, `/api/`, and names the sitemap. It is generated from one `ALLOW_INDEXING` flag.
- **Noindex is intentional.** The 10 noindex pages are `/404`, `/cart`, `/checkout`, `/compare`, `/reviews`, `/search`, `/track`, `/spa`, and the two Spanish test pages (`/es/instalacion-movil` and its Hialeah child). All are `noindex, follow` (crawlable, so the tag is seen), none is in the sitemap, and the Spanish pages have no hreflang until they go indexable (`hreflangFor` is wired and gated on `SPANISH_PAGES_INDEXABLE`).
- **Canonicals.** Self-referencing on all 206 indexable and noindex-but-routed pages; matches `og:url` and the JSON-LD `WebPage.url` on every page (0 mismatches); no query strings, no trailing slashes, https only. `tiredrop.vercel.app` returns `X-Robots-Tag: noindex, nofollow` and canonicals to the apex.
- **Status codes.** Live, unknown paths return a hard 404 (`/nonexistent-xyz`, `/tires/not-a-tire`, `/learn/unknown`, `/blog/unknown`, `/mobile-service/unknown-fl`, `/wheels/xyz`, `/services/xyz`, `/es/instalacion-movil/xyz`). `/tires/` and `/about/` 308 to the clean URL, `www` and `http` 308 to the apex, `.html` URLs 308 to the clean path, and `/TIRES` returns 404 (no case-variant duplicates).
- **Redirects.** 45 rules, 43 permanent. The only two 302s (`/gallery`, `/pages/gallery`) are deliberate (gallery parked). No chains, no loops, and `check:links` finds 0 internal links through a redirect.
- **Prerender.** All 198 indexable pages have real server-rendered content: median body text about 13,380 chars for Learn guides, 13,756 for blog posts, 7,397 for city pages, 4,882 for tire pages. Live pages match `dist/` byte for byte. `scripts/prerender.mjs` fails the build on an empty page, a missing h1, a duplicate title, a wrong canonical or the 404 template.
- **HTML basics.** 207 of 208 pages have exactly one h1 (the exception is the `/spa` shell). `lang` is `en`, or `es` on the two Spanish pages. The viewport meta tag is present everywhere. There are 0 heading-level skips, 0 duplicate titles, 0 missing descriptions, and 207 JSON-LD blocks that all parse (0 invalid). No review, rating or offer markup is emitted anywhere (matches the house rules).
- **Images.** 486 `<img>` tags: 0 without an `alt`, 444 of 486 with `width` and `height`. The 15 empty alts on the home page are the aria-hidden duplicate of the brand marquee, and the visible copy carries names. The logo uses `srcset` (240 px and 440 px) at `sizes="80px"`.
- **Performance basics.** Fonts are self-hosted with `font-display: swap` and size-adjusted fallbacks (no third-party font request). `/assets/*` is `immutable` for one year, and `br` is served. HTML for `/tires` is 384 KB raw and about 20 KB over the wire. Every route is lazy-split. Each prerendered head lists its own `modulepreload` chunks (17 on `/tires`).
- **Security headers relevant to SEO.** HTTPS everywhere, HSTS `max-age=63072000; includeSubDomains`, 0 `http://` resource references (the only `http://` strings are the SVG namespace), `nosniff`, a strict referrer policy, and a CSP in report-only mode.
- **Crawl traps.** Query states (`?search`, `?brands`, `?brand`, `?category`, `?service`, `?view`) all return the same prerendered page with the canonical stripped of the query. No page is paginated, there are no calendar or session-ID URLs, and the sitemap lists no parameter URL.

---

## 4. Fixed since the 2026-09-24 audit (not re-reported)

robots.txt and sitemap (generated, indexing on); canonical on every route; per-route prerender with its own head and JSON-LD; hard 404s instead of a catch-all rewrite; `noindex` on the 404 page; apple-touch-icon and web manifest; Google Fonts replaced by self-hosted fonts; logo `srcset`; route-level code splitting with `modulepreload`; `/compare` and `/reviews` noindexed; 14 city pages; `/brands` live with sitemap entry, canonical and `ItemList` schema.

---

## 5. Self-review: three things a skeptical reviewer would challenge, checked

1. **"Is the live site really this build?"** Checked. `/api/status` reports `1.0.0+8014dd9`, equal to `git rev-parse` HEAD. all 18 live pages with a `dist/` counterpart are byte-identical to it. My first sitemap fetch showed 197 URLs and no `/brands` because I got a cached copy; I re-fetched with curl and got 198 including `/brands`, so the earlier number is withdrawn.
2. **"Are the NUL bytes real, or an artefact of how you read the files?"** Checked on the wire. The live `/shipping` response contains two `\x00` bytes inside the sentence, and the source JSX and built JS chunk for that sentence have none. The claim that browsers ignore them rests on the HTML parsing rules, not a browser test, and I say so above. I also tried to explain the cause and could not confirm it, so finding 6 says "not isolated" and proposes a test, not a certain diagnosis. I rated it Low for that reason.
3. **"Does `Disallow: /*?view=` really neutralise the 301?"** Checked both halves. The live 301 exists and forwards the query (`location: /brands?view=brands`). The rule `/*?view=` matches `/tires?view=brands`, and Google evaluates robots.txt on the requested URL before fetching it, so it cannot read the redirect. The weaker half: the redirect still works for human visitors, and the real-world loss only matters if outside links to the old address exist, which I cannot see without Search Console. I therefore ranked it Medium, not High.

Also worth a reviewer's eye: the 8/10 is a judgement from code, headers and file sizes. A Lighthouse run and Search Console's Page indexing report could move it a point either way, mainly through Core Web Vitals and the "Crawled, currently not indexed" count.

---

# Report 2: On-page and content SEO

# TireDrop: On-page and content SEO audit

By Quill (on-page and content SEO). Read-only. Date 2026-10-18.

**Scope and method.** Parsed all 208 built pages in `dist/` with Python and BeautifulSoup. 198 are indexable. The 10 noindex pages are `/reviews`, `/compare`, `/cart`, `/checkout`, `/track`, `/search`, `/spa`, `/404` and the 2 Spanish test pages. The local `dist/` and `public/sitemap.xml` (198 URLs) match the live sitemap (198 URLs, 14 of them `/mobile-service/*`). Scripts and raw data are in the `seo/` scratchpad (`scan.py`, `an1.py` to `an5.py`).

Then I read 12 pages by hand: home, `/tires`, 2 product pages (a tire and a wheel), `/brands`, 2 city pages (Weston, Miramar), 2 Learn articles, 1 Blog article and `/install`. I also read `/services/*`, `/commercial-tires`, `/locations`, `/about` and a state page.

I read the earlier audits first (technical/indexing 2026-10-04, city depth, local-pages plan, vehicle-pages plan) and do not repeat what they fixed. Word counts are "visible text in `<main>`, excluding nav, header and footer". Where interactive widgets inflate that number I give a prose-only count as well.

---

## 1. Score: On-page and content SEO = **6.5 / 10**

The content engine is strong. There are 90 sourced, dated Learn and Blog articles with a median of about 2,000 prose words, the hygiene is clean (unique titles and descriptions on all 198 pages, one H1 per page, 0 orphans, 0 broken internal links), and the copy keeps to the house rules. What holds the score down is commercial coverage: the site has only two catalog landing pages (`/tires`, `/wheels`) and none for categories, brands, sizes or vehicles. The money pages carry generic titles and H1s, the product pages are thin sample-data pages, and the page types that rank for "buy tires online" and "tire shop near me" are mostly missing.

### Sub-scores

| Area | Score | One-line reason |
|---|---|---|
| Titles and descriptions | **7** | 0 duplicate or missing, none over 70 characters. But `/tires`, `/wheels`, `/install` and the 32 product pages are under-targeted. |
| Headings and body copy | **7** | Every page has a clean H1 and H2 outline with no skipped levels. Weak spots: product H1s with no brand, and one boilerplate sentence on all 12 service pages. |
| Content depth and uniqueness | **6** | Learn, Blog and state pages are deep and unique. Product, wheel, service and Learn-hub pages are thin or templated, and categories, brands, sizes and vehicles are absent. |
| Internal linking | **6** | 0 orphans and 0 broken links, with a good city mesh. But 0 of 90 articles link to a product or category page, `/brands` is a dead end, and money-page anchors are generic. |
| Local SEO content | **6** | The address and phone are in the footer of all 198 pages, and the shop's LocalBusiness schema carries the real address. But 7 of 14 city pages have no local facts, Palm Beach County has 0 pages and Miami-Dade has 1. |

---

## 2. Measured results (all routes)

| Check | Result |
|---|---|
| Titles | 198 of 198 unique. Length is 21 to 69 characters. 61 are 61 to 69 characters, but the part before " \| TireDrop" is at most 58 on every one, so only the suffix could be cut. 12 are under 30 characters (`/tires` 21, `/wheels` 22, `/contact` 21, `/about` 25). `About TireDrop \| TireDrop` repeats the brand. |
| Meta descriptions | 198 of 198 present and unique. 54 are over 160 characters and 46 are over 170 (the 32 product pages run 166 to 192, plus `/locations` 243, `/tire-size` 228, `/mobile-service` 220). Learn hubs are short at 90 to 147. |
| H1 | Exactly one H1 on all 198 indexable pages (`/spa`, noindex, has none). No duplicate H1 text. No skipped heading levels on any indexable page. |
| Canonical | Self-referencing on all 198. |
| Thin pages, under 300 words of main text | 12: `/learn/age` 171, `/learn/florida` 174, `/brands` 207, `/find-my-tires` 214, `/learn/tread` 219, `/services/lift-kits` 225, `/schedule` 228, `/services/wheel-installation` 237, `/learn/pressure` 261, `/learn/basics` 270, `/services/oil-change` 274, `/services/tpms-service` 282. |
| Thin by prose only (widgets and option lists stripped), under 300 words | 27: 10 of 12 services, 9 of 12 wheel product pages (283 to 301), 6 of 10 Learn hubs (161 to 291), `/brands` (190), `/schedule` (34), `/find-my-tires` (0, because it is a JS quiz). |
| Prose words by type (median) | Blog 1,996. Learn guides 1,964. State pages 882. City pages 962. Tire product pages 372. Wheel product pages 290. Service pages 284. Learn hubs 275. |
| Near-duplicate text (share of 6-word shingles also found on a sibling page) | Tire pages about 80%. Wheel pages about 77%. Service pages about 82%. City pages about 38%, and 30 to 40% with city names masked. State pages about 30%. Blog and Learn about 35%, mostly the shared CTA and source blocks. |
| Image alt | 468 images across 198 pages. 0 missing the `alt` attribute and 15 with an empty alt (home brand strip, decorative). The only images on product, city, Learn and Blog pages are the TireDrop logo. There are no product photos and no article art. |
| Internal links | Most page types carry 29 to 48 unique internal links. Home has 79, `/blog` 77. Footer and nav contribute about 26 to 29 to every page. Orphans (no inbound link from another page): 0. Pages whose only inbound links come from nav or footer: 0. Broken internal targets: 0. Empty anchors: 0. Generic anchors ("click here", "read more"): 0. |
| Compliance scan of all body text | 0 hits for discount, coupon, rebate, deal, "safe to drive", ratings or stars, APR or lender names, or invented "since" years. 0 dated delivery promises. The only near-misses are "cheapest" comparatives about tire pressure and alignment, "deal with" and fuel-savings wording. |

### Money-page keyword coverage

| Page | Title | H1 | Verdict |
|---|---|---|---|
| `/` | Tires & Wheels Shipped Nationwide (48 states + DC) | Order tires online. We ship them to you. | Partial. No "buy", and "wheels" is not in the H1. |
| `/tires` | **Shop Tires** | Shop Tires | Weak. No modifier at all. |
| `/wheels` | **Shop Wheels** | Shop Wheels | Weak. |
| `/tires/<slug>` | Continental PureContact LS 225/50R17 | **PureContact LS** | Weak. The title has no "tire" and the H1 has no brand or size. |
| `/wheels/<slug>` | Vossen HF-3 20x9 · 5x114.3 | **HF-3** | Weak. No "wheel" and no brand in the H1. |
| `/commercial-tires` | Commercial & Fleet Tires | Fleet & Commercial Tires | OK. "Light truck" and "truck tires" are missing. |
| `/mobile-service` | Mobile Tire Installation in South Florida | same | Good. |
| `/install` | **Ship to Store & Install** | Ship them to the shop. We'll fit them. | Weak. No "tire", "installation" or "Sunrise". |
| `/brands` | Tire and Wheel Brands | Tire and wheel brands | OK, but the page is a logo wall. |
| City pages | Mobile Tire Installation in {City}, FL | same | Good. |

---

## 3. Ranked findings

### HIGH

**H1. There are no commercial landing pages below `/tires` and `/wheels`: no category, brand, size or vehicle pages.**
- Evidence: the only catalog URLs are `/tires`, `/wheels`, `/commercial-tires`, `/brands` and 32 product pages. Filtering is query-string only, and `robots.txt` disallows `/*?view=` and `/*?search=`.
- Each product page is one SKU on a 20-tire sample catalog. `/brands` has 42 unlinked logos.
- Why it matters: "all season tires", "Michelin tires", "225/65R17 tires" and "all terrain tires" are the highest-intent, highest-volume queries for a tire store. None can rank here because no page targets them.
- The 90 Learn and Blog articles are a good top of funnel, but they hand off to a single `/tires` page.
- Fix, in this order:
  1. Category pages that work on sample data today, built with static copy plus the filtered list: `/tires/all-season` (13 tires), `/tires/performance` (6), `/tires/truck-suv` (highway, all-terrain, mud-terrain: 6), `/tires/commercial` (4). Each gets 300 to 500 words of its own copy and a 4-question FAQ.
  2. Brand pages for the 6 stocked brands (Bridgestone, Continental, Michelin, Nexen, Nitto, Pirelli).
  3. Size pages (`/tires/size/225-65r17`) once the ATD feed is live and each size has real stock. They are not worth building on 20 sample SKUs.
- Example category copy (house-rule compliant):
  - Title: `All-Season Tires: Free Shipping to 48 States + DC | TireDrop`
  - H1: `All-season tires`
  - Intro: "All-season tires cover dry, wet and light-rain driving in one tire, which is why most South Florida drivers buy them. Check the load index and speed rating against your door placard before you order. Ships free to the 48 contiguous states and DC, or free to our Sunrise shop, where installation is from $25 per tire."

**H2. The money-page titles and H1s leave keywords unused.**
- `/tires` is "Shop Tires" (21 characters), `/wheels` is "Shop Wheels" (22), `/install` is "Ship to Store & Install" (34, no "tire" or "Sunrise"), home has no "buy", and the 32 product pages put the model but not the brand in the H1 ("PureContact LS", "HF-3").
- Why it matters: the title tag and H1 are the strongest on-page relevance signals. These pages are the ones meant to rank for the head terms.
- Fix (all core lengths are 58 characters or under):

| Page | New title | New H1 |
|---|---|---|
| `/` | Buy Tires & Wheels Online, Free Shipping \| TireDrop (51) | keep |
| `/tires` | Buy Tires Online: Shop by Vehicle or Size \| TireDrop (52) | Buy tires online |
| `/wheels` | Buy Wheels Online: Alloy, Forged & Off-Road \| TireDrop (54) | Buy wheels online |
| `/install` | Tire Installation in Sunrise, FL: Ship to Store \| TireDrop (58) | Ship tires to our Sunrise shop. We'll fit them. |
| `/commercial-tires` | Commercial & Light Truck Tires for Fleets \| TireDrop (52) | keep |
| `/tires/<slug>` | Continental PureContact LS 225/50R17 Tire \| TireDrop (52) | Continental PureContact LS 225/50R17 |
| `/wheels/<slug>` | Vossen HF-3 20x9 5x114.3 Wheel, Satin Black \| TireDrop (54) | Vossen HF-3 20x9 Wheel |

- The "48 states + DC" qualifier stays in the meta description and body.

**H3. Learn and Blog are not wired into the commercial pages.**
- Evidence: 0 of 90 articles link to any `/tires/<slug>` product or any category, size or brand page. All 90 link to the `/tires` hub and `/install`, with the same "Shop tires" anchor.
- Only 5 articles link to `/wheels`. 0 of 12 wheel product pages link to a guide, even though Learn has bolt-pattern, offset and staggered guides. 7 of 20 tire pages link to no guide.
- The 8 vehicle-specific Blog posts (Civic, Camry, RAV4, CR-V, F-150, Silverado, Wrangler, Model Y) have no link to a matching size or category page.
- Why it matters: the strongest pages on the site pass authority to one generic hub. Keyword-specific anchors going to category pages are the standard way to rank those pages.
- Fix: add a "Shop what this guide covers" block to each article, linking the matching category or brand page with a descriptive anchor (for example `all-terrain tires`, not `Shop tires`). Link each wheel page to bolt-pattern and offset guides and to `/wheel-offset-calculator`. Add the vehicle-post to category links as soon as category pages exist.
- Product-SKU links are fine to hold until the feed is live, because slugs will change. Category links do not depend on a SKU.

**H4. Local coverage is lopsided, and 7 of 14 city pages have no local facts.**
- Evidence: 14 city pages exist, all Broward except Hialeah. They split into two groups:
  - Seven pages have named roads and neighbourhoods, local notes, and a ZIP list (all but Tamarac, which uses the ZIP checker only): Weston, Davie, Coral Springs, Tamarac, Sunrise, Plantation and Fort Lauderdale.
  - Seven have no ZIPs and no roads or neighbourhoods: Hialeah, Hollywood, Lauderhill, Miramar, Oakland Park, Pembroke Pines and Pompano Beach. Each shows its generic template plus a non-local "tread depth" or "what to know" block. Miramar's page says outright that it prints no ZIP list because none has been verified.
- Palm Beach County has 0 pages and Miami-Dade has 1 (Hialeah). The install page lists Miami, Miami Beach, Doral, Homestead, Boca Raton, Delray Beach, Boynton Beach, West Palm Beach and Jupiter, none of which has a page.
- Duplication is not the problem. Masked for city names, those 7 pages share only 34 to 40% of their wording with other cities, so they read as different pages.
- The gap is that "unique" is not "local". Without local entities they will compete on the generic template.
- Fix: follow `docs/audits/2026-10-05-local-pages-plan.md`.
  1. Back-fill the 7 thin pages with the facts the plan marks READY (ZIPs, main roads, one sourced local note each).
  2. Build Miami, Doral and Kendall (Miami-Dade), then Boca Raton, West Palm Beach and Delray Beach (Palm Beach), only from READY facts.
  3. Do not ship a page without at least ZIPs plus 2 sourced local facts.

### MEDIUM

**M1. The 32 product pages are indexable on sample catalog data.**
- Evidence: the tire pages carry about 372 prose words and the wheel pages about 290, with about 80% of wording shared with sibling pages. There are no product photos (the only images are the logo) and no Product schema (`EMIT_OFFERS = false`).
- The title, meta description and body show prices such as "$672.00 for a set of 4" and "Available to order", although the catalog is sample data (`atd.md`: `qty` null, `image` null).
- The page copy also contains unsupported claims: "Our most requested 20-inch show wheel" (Vossen HF-3) and "Excellent match for Accord, Camry and Altima trims". Neither is backed by data on the page. They sit close to the "no invented ratings or popularity" rule.
- Why it matters: this is a limit of sample data, not an editing problem. These pages cannot out-rank manufacturer and retailer pages with real photos and stock. Prices in snippets will be wrong when the feed changes them.
- Fix:
  1. Remove the popularity and "excellent match" claims now.
  2. Drop the price from the meta description until the feed is live.
  3. Decision for Justin: keep the 32 pages in the sitemap as they are, or noindex them until the feed is connected.
  4. When the feed lands, add a real photo, a one-sentence fitment note and Product schema per page.

**M2. The 12 service pages are templated, short and partly nonsensical.**
- Evidence: 10 of 12 have under 300 prose words (lift-kits 213, wheel-installation 233, oil-change 262) and 82% shared wording with siblings. About 50 to 80 words per page are unique.
- All 12 contain the identical sentence "Catching it early is the difference between a [X min] visit and a tow". That reads as nonsense on Oil Change, Lift Kits, Wheel Installation and Diagnostics.
- `/services/lift-kits` also says "there will be a bay open in Sunrise when you arrive", which is a promise the shop may not keep.
- Why it matters: these are the pages for "wheel alignment Sunrise FL", "brake repair Sunrise" and "mobile tire repair". They are the best-converting local queries and they carry the weakest copy.
- Fix: write 450 to 600 words per page, starting with alignment, brakes, tire repair and tire installation.
  - Each page gets a "What we check", a "How long it takes", a "What changes the price", and 3 unique FAQs.
  - Remove the shared tow sentence and the "bay open when you arrive" line.
- Example (tire repair): "A nail in the tread can often be repaired. A technician takes the tire off the wheel, inspects the inside, and patch-plugs it from the inside only if the damage is in the repairable area. A bulge or a cut in the sidewall cannot be repaired and the tire needs replacing. Repair is from $35 per tire."

**M3. Six of ten Learn hubs are thin.**
- Evidence: `/learn/age` has 161 prose words and `/learn/florida` 165. `/learn/tread` has 209, `/learn/pressure` 249, `/learn/basics` 260 and `/learn/damage` 291. Each is a title, 2 or 3 article cards and boilerplate.
- Why it matters: they are indexable and carry the hub-and-spoke structure, but they give search engines little to rank.
- Fix: add a 120 to 200 word intro that names the topic's main questions, plus a 3-question FAQ and "start here" ordering. If a hub will only ever hold 2 guides (`age`, `florida`), fold it into `/learn` and redirect.

**M4. `/brands` is a dead end.**
- Evidence: 190 prose words. The 42 logos are not links. Only 3 pages link to `/brands` (home, `/search`, `/sitemap`), and it is not in the header or footer.
- It lists 25 tire brands and 17 wheel brands, but the catalog has product from only 6 tire brands.
- Why it matters: it cannot pass authority and cannot rank. The count also overstates what is stocked.
- Fix:
  1. Make each logo link to a brand page (or to `/tires?brand=...` until brand pages exist).
  2. Add a one-line description per stocked brand.
  3. Add "Brands" to the footer's Shop column.
  4. Reword the intro to "brands available through our distributor" and state which are in the online catalog today.

**M5. E-E-A-T gaps: no named author, no reviewer, no people.**
- Evidence: all 90 articles are bylined "TireDrop Team, Extreme Tires, Sunrise FL" (an Organization in schema). `/about` names no person or technician. `/reviews` is noindex and has no reviews of its own. Checklist items #A9 (Google review link) and #D7 (real reviews) are open.
- Strengths to keep: visible publish and updated dates, named external sources (NHTSA, USTMA, Michelin, AAA, Consumer Reports) and real address and phone on every page.
- Why it matters: for safety-adjacent topics (tread depth, repairs, recalls) a visible, real expert is the main trust signal.
- Fix (Justin to approve any name; nothing invented):
  1. Put one real named shop technician as author or "reviewed by" on the 10 highest-value guides.
  2. Add a short "Who writes this" paragraph to `/learn` and `/about`.
  3. Add real review links only once real reviews exist.

**M6. Money-page anchor text is generic and thin in the body.**
- Evidence: links to `/tires` use "Shop Tires" or "Shop all tires" 556 times. Body-content links to `/wheels` come from 25 pages, to `/commercial-tires` from 6 and to `/brands` from 3.
- Why it matters: no anchor says "all-season tires" or "commercial tires", which is what the target page should rank for.
- Fix: this is solved by H1 and H3. Use descriptive anchors in article and city-page body copy (for example "free ship-to-store tire installation in Sunrise" to `/install`).

**M7. `/tires` and `/wheels` have no copy of their own.**
- `/tires` has 602 prose words, almost all filters and product cards. The product headings are model names only ("PureContact LS"), without the brand. `/wheels` has 347 prose words.
- Fix: add a 150 to 250 word intro above the list (how to find your size, what ships free, what installation covers) and a short FAQ below it. Put the brand in each card heading.

### LOW

- **L1. Description length.** 54 of 198 descriptions run over 160 characters (46 over 170). Google rewrites rather than penalises. Trim the 32 product descriptions (166 to 192) so the key phrase falls before about 155 characters.
- **L2. Titles.** Length is not a problem (all cores 58 characters or under). The one fix is `About TireDrop | TireDrop`, which repeats the brand, and short generic titles (`Contact Us`, `Schedule Service`).
- **L3. Footer headings.** The footer renders "The Shop Behind Us", "Shop", "Shipping & Install", "Tools & Guides" and "Company" as H2 on every page (5 identical H2s across 208 pages). Demote them to a non-heading element.
- **L4. One social image.** Every page and all 90 Article schemas use the same `og-tiredrop.jpg`. Per-article cards are nice to have, not urgent.
- **L5. Wording on arrival.** The phrase "We confirm an arrival window when we book" appears 72 times on 23 pages. It means technician appointment timing, not a delivery date, so it does not break the rule. "Appointment window" would avoid any doubt.
- **L6. Financing page.** `/financing` names "Shop Pay Installments", a Shopify product. It is not a lender name, but the "no lender names" rule is worth a second look from Justin.
- **L7. Spanish pages.** `/es/instalacion-movil` and the Hialeah page are correctly noindex until a native speaker approves. They are a real Miami-Dade opportunity once cleared.

---

## 4. Top 10 pages or content pieces to write

Demand is a judgment from query patterns for online tire stores, not measured volumes. No keyword-volume tool was available. Items marked **feed** wait on ATD's live data.

| # | Piece | Query it targets | Why now |
|---|---|---|---|
| 1 | `/tires/all-season`, `/tires/truck-suv`, `/tires/performance`, `/tires/commercial` category pages (300 to 500 words each plus a FAQ) | all season tires, truck tires, all terrain tires, commercial truck tires | Highest-volume head terms. Works on today's sample catalog. Fixes H1. |
| 2 | Brand pages for the 6 stocked brands (Michelin, Continental, Pirelli, Bridgestone, Nitto, Nexen): lineup guide, who each tire suits, sourced test notes | michelin tires, continental tires, pirelli tires | Brand queries are large and buyer-ready. The `/brands` page cannot rank. |
| 3 | `/tires/size/<size>` pages for the 10 most common sizes (205/55R16, 215/60R16, 225/65R17, 235/65R18, 245/45R18, 265/70R17, 275/55R20 and similar) | 225/65r17 tires, 245/45r18 tires | **Feed.** The most direct "I have my size" buyer query. Needs real stock per size. |
| 4 | "What does tire installation cost in South Florida?" (shop and mobile, what $25 per tire includes, what moves the price) | tire installation cost near me, how much to mount and balance tires | Real from-$25 price, low competition locally, closes the loop for ship-to-store buyers. |
| 5 | "Tire shop in Sunrise, FL" page (or rebuild `/locations`): bay services, hours, directions, what to bring, ship-to-store | tire shop sunrise fl, tire installation sunrise | The local-pack target. `/locations` is titled "The Shop & Install Area". |
| 6 | Miami-Dade and Palm Beach city pages: Miami, Doral, Kendall, Boca Raton, West Palm Beach, Delray Beach (only from READY facts in the local-pages plan) | mobile tire service miami, mobile tire installation boca raton | Two of three counties are uncovered. |
| 7 | Rewrite of the 12 service pages, led by wheel alignment, brake repair and tire repair, plus a Learn guide "Alignment vs balancing vs rotation: what each fixes" | wheel alignment sunrise fl, brake repair sunrise, tire repair near me | Highest-converting local queries on the thinnest pages (M2). |
| 8 | Buyer's guide "How to choose all-season tires for Florida rain", using wet-braking and UTQG evidence from named tests (Consumer Reports, AAA, NHTSA) | best all season tires for rain, best tires for florida | Links the category page to the Learn authority. Sourced criteria only, no invented rankings. |
| 9 | Wheel buying guide "How to choose wheels: size, bolt pattern, offset, finish" plus a size-by-vehicle table built from sourced maker pages | wheel size for [car], how to pick wheels | 0 of 12 wheel pages link to a guide. Ties the offset calculator and 4 existing fitment guides to the shop. |
| 10 | Fleet guide "Commercial tire guide: Load Range E vs F, ply rating, sizing a van or box truck" plus a fleet-program page | commercial truck tires, load range e vs f, fleet tire service | `/commercial-tires` has only 473 prose words. Extends the small-fleet Blog post. |

Next in line, outside the top 10: vehicle-model pages (per the vehicle-pages plan, blocked on a licensed fitment source), a Learn guide on how often to rotate tires, and Spanish pages once reviewed.

---

## 5. What is already strong

- **Hygiene.** 198 of 198 titles and descriptions unique, no missing descriptions, one H1 each, no heading-level skips, self-canonicals, 0 orphans, 0 broken internal links, 0 empty or generic anchors, alt present on all 468 images.
- **Learn and Blog.** 90 articles with a median of about 2,000 prose words. Named sources (NHTSA, USTMA, Michelin, AAA, Consumer Reports), visible publish and updated dates, interactive tools (size decoder, tread gauge) and Key takeaways plus FAQ blocks. They are concentrated in the South Florida niche (heat, hydroplaning, hurricanes, king tides) that national competitors do not cover.
- **City pages.** The 7 deepened pages have roads, neighbourhoods, sourced local facts and honest scope ("alignment is shop work in Sunrise"). All 14 interlink fully, share only about 35% of wording with each other, and carry Service and FAQ schema.
- **State pages.** Each of the 7 has about 880 words of sourced state rules and a state-specific tire note. They are well above the typical thin "shipping to X" page.
- **Local trust.** The real address and phone are in the footer of all 198 pages, in the shop's LocalBusiness schema, and in the body of 52 pages.
- **Compliance.** The scan found no discount or deal language, no ratings, no lender names, no "safe to drive", no invented years and no delivery dates. The copy is candid about limits ("installing does not reach all 48 states, and we would rather say so plainly").
- **Structure.** Hub-and-spoke inside Learn (about 4 sibling links per guide, 13 per hub), a full city-page mesh, and `/sitemap` as an HTML sitemap.

---

## 6. Self-review: three things a skeptical reviewer would challenge

1. **"Titles over 60 characters are a problem."** Checked. All 61 long titles lose only the " | TireDrop" suffix (the part before it is 58 characters or less), so I dropped this from the findings to a Low note. The real title issue is keyword content on the money pages (H2).
2. **"The 7 new city pages are doorway or duplicate content."** Checked with city names masked. Only 34 to 40% of their wording is shared with other city pages, so they are not duplicates. The finding is reworded to "not local" (no ZIPs, roads or neighbourhoods) rather than "duplicate", and the fix is facts, not noindex.
3. **"Learn pages look huge only because widgets inflate the word count, and 'thin' judgments use raw text."** Checked with a prose-only count (paragraphs, list items, table cells and headings only). Learn and Blog medians barely move (about 1,960 to 2,000 prose words versus about 2,000 raw), but the thin list grows from 12 pages to 27 on prose. Both counts are reported.

Also acknowledged: the zero article-to-product links and the thin product pages largely reflect sample catalog data, not editorial neglect. H3 therefore recommends category links, which do not depend on a SKU slug. The 32 product pages stay Medium rather than High for the same reason.

---

## 7. Limits of this audit

- No keyword-volume or rank data was available, so "demand" in section 4 is judgment, not measurement.
- I did not review Core Web Vitals, structured-data validity, redirects or indexing status (technical slice). I did not check Search Console. "Indexable" means the page has no noindex and is in the sitemap.
- I read 12 pages by hand and scripted the rest, and spot-checked about another 10 (services, `/commercial-tires`, `/locations`, `/about`, a state page). I did not read every Learn or Blog article. The sample (`how-to-read-tire-size`, `hurricane-season-tire-check`) was strong. The source claims were not independently re-verified here (see `docs/content/pilot-verification.md`).

---

# Report 3: Structured data, local and off-site SEO

# TireDrop SEO audit: Structured data, Local, Off-site and E-commerce readiness

Auditor: Atlas. Read-only. Date: 2026-10-18. Repo `main` at 8014dd9 (Brands page). Evidence: all 208 built pages in `dist/` (JSON-LD extracted and parsed), `npm run check:schema` (passes: 208 pages, 1,257 nodes), live spot checks of tiredroponline.com (home, /brands, a tire page, a city page, robots.txt, /llms.txt: live matches dist), the docs listed in the brief, the parent shop's site, and five competitors.

---

## 1. Score: 5 / 10 for Structured data, Local and Off-site SEO

The on-site markup is unusually clean and honest (every page type validates, no invented ratings, NAP identical everywhere, 14 city pages with a real LocalBusiness node). But the parts that make money and rank locally are not built yet: no Product/Offer markup or Merchant Center path (sample catalog, no return window), no linked Google Business Profile data (no geo, Place ID or review link), no backlinks, no Bing, and not one link between the parent shop's domain and TireDrop.

## 2. Sub-scores

| Area | Score | One-line reason |
|---|---|---|
| Structured data | 6 | Hygiene 9/10, coverage 4/10: nothing invalid, but no Product/Offer/return/shipping markup, no geo, thin Organization node. |
| Local SEO | 6 | Strong on-site (consistent NAP, 14 city pages, Service + FAQ + shop node); weak off-site (GBP data not wired, name variants, no citation or review programme running). |
| Merchant / e-commerce readiness | 2 | Sample data (20 tires, 12 wheels, no GTIN/MPN/images/stock), no return window published, no feed, and the planned Shopify channel route conflicts with the site's own redirects. |
| Off-site authority and tracking | 3 | Search Console is set up and GA4 is good for the funnel; no backlink plan, no Bing, no GA4-Search Console link, key events not marked, parent domain does not link to TireDrop. |
| AI-search readiness | 6 | Crawlable by every AI user agent tested, citable tables and sources, visible dates; no llms.txt, no named authors, no explicit bot policy. |

Sample-catalog limits that cap this score until ATD's feed is live: product price/availability markup is off on purpose (`EMIT_OFFERS = false` in `src/components/ui/index.jsx`), no GTIN/MPN/image in `src/data/products.js`, no stock counts, `image: null` in sample mode (`docs/integrations/atd.md`), so there is no product-photo markup either.

---

## 3. Ranked findings

Legend for "Needs Justin": **Chrome prompt needed** = Justin's browser/account (Google Business Profile, Search Console, Bing, Yelp, the parent site's CMS). **Decision** = needs an answer from Justin. **Claude** = Claude can do it in the repo without Justin.

### HIGH

**H1. The parent shop's website and TireDrop do not link to each other.**
- Evidence: the parent site (extrememobiletires.com, the shop's own site, same NAP) has no mention of TireDrop and no link to tiredroponline.com (its outbound links: Facebook, Instagram, YouTube, Yelp, a Google search link, manufacturer rebate pages). `grep` of `src/` finds no link to extrememobiletires.com either; it appears only in docs. The parent has no JSON-LD at all.
- Why it matters: it is the cheapest, most relevant backlink the business can get, and the only way to tie the two domains into one entity for Google. Right now TireDrop looks like a brand-new, unlinked domain.
- Fix: (a) on the parent site, add a visible "Order tires online: TireDrop" link in the nav/footer and on the tire catalog page pointing to https://tiredroponline.com; (b) in code, once Justin confirms, add the parent domain to the shop node's `sameAs` and add a "Powered by Extreme Tires" link out to it. Neither is "reviews" or "since" language, so it is rule-safe.
- Needs Justin: **Chrome prompt needed** (parent site is on Net Driven's CMS) plus a yes on the `sameAs` change.

**H2. Google Business Profile is not wired into the site, and its name may not match the site's.**
- Evidence: `src/data/business.js` has `geo: null`, `GOOGLE_PROFILE.placeId: null`, `reviewUrl: null`; the shop `sameAs` holds only Yelp and Facebook (no Google link). Checklist items #A9 (pin, Place ID, review link) are open. The parent site's "Google" link is a tinyurl that redirects to a Google search for **"Extreme Tires & Extreme Mobile Tires Sunrise, FL 33351"** (link dated Feb 2023, so verify before trusting it), while the site, schema and Yelp say **"Extreme Tires"**. `docs/business/parent-business-facts.md` already notes aggregators use both names.
- Why it matters: the Local Pack is the main local ranking surface; a missing pin/Place ID means no direct review link, no `geo` on the LocalBusiness node, and a possible name mismatch weakens entity matching between the GBP, the site and every citation.
- Fix: run prompt #A9 and add a read-only check of: primary name, categories (Tire shop primary; Auto repair shop, Mobile tire shop-type secondary if offered), website field (parent site) and appointment/booking link (TireDrop, already added), hours, service area, services list, photos. Then Claude pastes `geo`, `placeId`, `reviewUrl` and the GBP URL into `sameAs`, and runs `check:schema` (it already validates geo).
- Needs Justin: **Chrome prompt needed**.

**H3. No Product, Offer, shipping or return markup on any of the 32 product pages, so no product rich results and no route into free listings.**
- Evidence: product pages carry WebPage + BreadcrumbList only (checked all 20 tires, 12 wheels). The code comments explain why (price and stock are sample data; Google requires offers/review/aggregateRating on Product). The visible page shows a price and "Available to order", and the meta description repeats it (e.g. "$672.00 for a set of 4"), so the page already makes the price claim in human-readable form.
- Judgement: leaving it off while the catalog is sample data is defensible and safer than markup that disagrees with inventory. It is also the single biggest ceiling on e-commerce SEO. Competitor reality check: Priority Tire ships a `ProductGroup` with 103 size variants, `AggregateOffer`, reviews and ratings; SimpleTire's fetched PDP had only BreadcrumbList + FAQPage; Tires Easy and SimpleTire mark up a return policy at Organization level. So TireDrop is level with most competitors and behind the best one.
- Fix (when ATD is live, `EMIT_OFFERS` true): emit `ProductGroup` per model with a `Product` per size variant: `sku`, `gtin`/`mpn` from ATD, `Offer` with `price`, `priceCurrency: USD`, `availability` from the feed, `shippingDetails` (shippingRate 0 USD, destination US, 48 contiguous states + DC), and `hasMerchantReturnPolicy` (needs H5). Never `aggregateRating` or `review` until real ones exist (the check already enforces this). Prepare the shipping and return builders now behind the flag so the switch is one line. Until then, consider dropping the sample price from PDP meta descriptions so snippets cannot go stale.
- Needs Justin: **Claude** for the code; blocked on ATD (checklist #C1) and on H5.

**H4. No backlink, citation or brand-signal programme exists, and the brand name is generic.**
- Evidence: no doc mentions backlinks, citations, link building, Bing, or PR (grep of `docs/`, `README`, `scripts/`). Existing third-party listings of the shop (Goodyear, Cooper, Pirelli, SimpleTire, Chamber of Commerce, Yelp, Facebook; per `parent-business-facts.md`) point to the parent, not to TireDrop. Web searches for "tiredroponline.com" returned nothing relevant (the search tool cannot run `site:`, so this does not prove the site is unindexed; Search Console showed the home page indexed on 2026-10-04). "TireDrop" collides with generic phrases and other brands.
- Why it matters: a new domain with zero external links will not rank for "buy tires online" against Tire Rack, Discount Tire, SimpleTire, Priority Tire or Tires Easy; it can still win South Florida local and long-tail Learn/Blog queries.
- Fix, in order of effort: (1) H1 link; (2) website/booking fields on the Facebook page, Instagram bio and YouTube channel (the parent site links Instagram `extremetires` and YouTube `@extremetires2010`, so they exist; TireDrop's footer hides them as "not confirmed"); (3) ask Goodyear/Cooper/Pirelli/SimpleTire dealer listings to add the online-store URL if their forms allow; (4) Broward/Sunrise Chamber of Commerce and BBB profiles; (5) Bing Places and Apple Business Connect (H6); (6) link-worthy assets already built: the tire-size decoder, tread-depth, load/speed and pressure tools and 90 Learn/Blog guides with maker-source citations, pitched to Florida auto and driver-safety sites. No paid links, no incentivised reviews.
- Needs Justin: **Chrome prompt needed** for items 2 to 5; Claude can draft the outreach copy.

**H5. Returns window is unpublished, blocking return-policy markup and Merchant Center.**
- Evidence: `/terms` section 9 has no window, restocking fee or who-pays rule beyond "set by the distributor ... we will confirm them on your order"; checklist item "Returns window + warranty/road-hazard links" (#D1) is open; `docs/drafts/trust-and-returns.md` is waiting on the answer. Google's Merchant Center free listings require return policy details; `MerchantReturnPolicy` markup cannot be written without numbers; competitors state theirs (Tires Easy 45 days free return, SimpleTire links a 30-day policy).
- Fix: Justin answers D1 (window, who pays return freight, restocking fee, damage-claim deadline) after the ATD call; Claude then publishes the policy and adds `hasMerchantReturnPolicy` at Organization level (valid without products).
- Needs Justin: **Decision** (not a website prompt).

### MEDIUM

**M1. Merchant Center plan has an architecture conflict and nothing built.**
- Evidence: `docs/business/shopify-admin-prompts.md` plans "Google & YouTube channel once products have UPCs and images". But the storefront catalog lives in React/ATD, and Shopify only holds draft orders. The Shopify channel would emit `shop.tiredroponline.com/products/...` URLs, and this repo's `vercel.json` redirects `/products/*` to `/tires` while the Shopify theme redirects shop. to the main site (CLAUDE.md). That is likely to trigger landing-page mismatch disapprovals (inference; needs a test).
- Fix: plan a custom feed generated from the ATD adapter (e.g. `/feeds/google-merchant.xml` or Content API) whose `link` is the tiredroponline.com product page, with `gtin`, `mpn`, `brand`, `price` = tire only (Google rejects tires bundled with installation, as `docs/audits/2026-09-29-site-audit.md` already notes), free-shipping setting for the 48 states + DC, return policy matching the site, and `availability` from the live feed. Claim tiredroponline.com in Merchant Center now (free, no feed needed) so it is ready.
- Needs Justin: **Chrome prompt needed** (Merchant Center account and domain claim); **Claude** for the feed code after ATD.

**M2. No Bing Webmaster Tools, no GA4-Search Console link, GA4 key events not marked.**
- Evidence: no mention of Bing Webmaster or IndexNow anywhere in docs; checklist #A7 (mark `generate_lead`, `order_request`, `install_booking` as Key events) is open; no doc records a GA4-Search Console link. Search Console itself is verified and the sitemap submitted (2026-09-29).
- Why it matters: Bing's index feeds Copilot and DuckDuckGo and is reportedly one of the sources ChatGPT search draws on; without GA4-Search Console linking you cannot see which queries lead to leads.
- Fix: import the site into Bing Webmaster Tools from Search Console, submit the sitemap, and enable IndexNow if offered; link GA4 to Search Console; run #A7.
- Needs Justin: **Chrome prompt needed**.

**M3. Local conversions are invisible in GA4: no call, directions, review-link or schedule-click events.**
- Evidence: events in code (`src/lib/analytics.js` and `trackEvent` calls): `search`, `view_item`, `add_to_cart`, `begin_checkout`, `generate_lead`, `order_request`, `install_booking`, `tool_use`, chat events, installed-price events. There are `tel:` links in ~20 components (header, footer, MobileCallBar, city pages) and Directions links, but none sends an event; GA4's enhanced measurement does not capture `tel:` clicks. `purchase` is intentionally not sent (request-only checkout).
- Fix: add `phone_click`, `directions_click` and `review_link_click` events with a `page_type` parameter (allow-list in `EVENT_KEYS`, no phone numbers or emails in params, which `cleanParams` already scrubs); then mark them Key events. No cross-domain linker is configured for shop.tiredroponline.com; add it when real payments start so the checkout session is not split.
- Needs Justin: **Claude** for code; **Chrome prompt needed** to mark Key events in GA4 Admin.

**M4. NAP is consistent in the repo but the business's name and listings are not.**
- Evidence: address `7712 West Oakland Park Blvd, Sunrise, FL 33351` appears in one form across `dist` (258 full-string hits, no variants); phone `(954) 773-1896` is the only real number (the 555-0188 hits are form placeholders). But the name varies: site "Extreme Tires" / "Extreme Tires - Sunrise"; probable GBP "Extreme Tires & Extreme Mobile Tires" (H2); aggregators use both; the parent site links a Yelp listing `extreme-tires-davie-4` while TireDrop links `extreme-tires-sunrise` (I could not open Yelp, which blocks fetches, so whether the Davie one is a duplicate, an old location or another business is unverified); registered legal name still unknown (`legalName: null`).
- Why it matters: duplicate or mismatched listings split reviews and signals.
- Fix: pick one canonical display name; check the two Yelp listings and merge or claim; align Facebook, Yelp, GBP, Bing Places and the parent site; fill `legalName` only after the Sunbiz name is confirmed.
- Needs Justin: **Chrome prompt needed** (read-only Yelp/GBP check first).

**M5. Review collection is drafted but not running; correctly, no review markup anywhere.**
- Evidence: `docs/ops/review-request-drafts.md` is compliant (ask everyone, no incentives, no gating, no ratings quoted); `GOOGLE_PROFILE.reviewUrl` is null, so the site's "Google reviews" buttons open a Maps search, not the review form; `/reviews` says plainly that reviews are not collected yet and is noindex. Verified: no `aggregateRating`/`Review` in any of 208 built pages (check:schema enforces it), and no star ratings or counts on the page text. No invented ratings found. Home page says "its own reviews are still being collected; the shop's are not" and does not print the shop's numbers.
- Fix: get the review link (H2), send the drafts to every install customer, add the link to the fulfilled-order email and `/track` (#D7). When 50+ real product reviews or ~100 store reviews exist, consider Google Customer Reviews/Judge.me (rewards off) and only then add markup from a real feed.
- Needs Justin: **Chrome prompt needed** (copy the link); **Decision** on #D7.

**M6. /brands asserts more than the catalog supports, links nowhere, and its ItemList is not carousel-eligible.**
- Evidence: page copy: "25 tire brands and 17 wheel brands TireDrop shows", with the caption that logos appear "to identify the products we sell". The sample catalog holds six tire brands (Bridgestone, Continental, Michelin, Nexen, Nitto, Pirelli); `docs/content/brand-logos.md` says none of the 42 logos has a written licence and Nitto's minimum-advertised-price policy needs checking, yet the page is live. No brand tile links anywhere (0 `brands=` links in `dist/brands.html`); the ItemList's `ListItem.item` is a `Brand` with `name` and `logo` but no `url`, so Google cannot use it as a list result. The page is 2.8k characters. Competitors (SimpleTire `/brands/<brand>/<model>`, Priority Tire `/by-brand/...`) have crawlable brand and model pages.
- Fix: soften copy to brands being added with the distributor catalog until ATD confirms; link catalog brands to `/tires?brands=X` today and later to real `/brands/<slug>` pages with maker-sourced facts; add `url` to each ListItem; clear logo licences before more logo-bearing markup is published.
- Needs Justin: **Claude** (copy, links, markup); **Decision** on logo clearance (ATD logo-pack email already drafted).

**M7. Article authorship and freshness signals are weak for safety-adjacent content.**
- Evidence: all 90 Learn/Blog `Article` nodes use author `Organization` named "TireDrop Team, Extreme Tires, Sunrise FL" (extra words inside `name`); all 90 use the same sitewide `og-tiredrop.jpg` as `image`; 80 of 90 have `dateModified == datePublished`. Content quality is otherwise strong (sources section, comparison tables, dated).
- Fix: a named author with a Person node (job title, shop, sameAs to a real profile) and a reviewer line, only if real people agree; `author.name` should be just the name; a unique 1200 px-wide image per article; update `dateModified` only on real edits.
- Needs Justin: **Decision** (who is named). Claude does the markup.

**M8. Competitor on-page gaps for "buy tires online" queries that can be closed within the house rules.**

| Site | Title (fetched) | What it does that TireDrop does not |
|---|---|---|
| SimpleTire | "Buy Automotive Tires Online for Less" | per-brand and per-vehicle pages (`/vehicles/honda-tires/accord`), 10,000+ installers messaging, Organization with `sameAs` incl. BBB/Trustpilot, `hasMerchantReturnPolicy`, `shippingDetails` |
| Priority Tire | "New Tires for Sale - Find & Buy Online" | `ProductGroup` with variants, ratings and reviews, WebSite + SearchAction, brand/model pages |
| Tires Easy | "Find the Best Tires Online Today" | CollectionPage + ItemList on categories, Organization return policy (45 days) |
| Tirebuyer | "Buy Tires and Wheels Online" | brand/products pages, installer-first messaging |
| Discount Tire | "Buy Tires & Wheels Online / Tire Repair & Service" | book-install-at-checkout and free-services messaging, local store pages (I could not read its markup; Tire Rack blocked my fetch, its fetched page showed no JSON-LD) |
| **TireDrop** | "Tires & Wheels Shipped Nationwide (48 states + DC)" | home H1 "Order tires online." is fine, but the title has none of "buy", "online" or "install" |

Closable gaps (rule-safe): (1) retitle home to something like "Buy Tires Online: Free Shipping to 48 States + DC | TireDrop" (about 58 characters; free shipping is allowed, avoid "deal/low price/for less"); (2) brand pages for the six catalog brands from maker sources (M6); (3) tire-size landing pages (`/tires?size=` is filter-only today) once ATD data supplies real sizes and stock; the vehicle-page plan (`docs/audits/2026-10-05-vehicle-pages-plan.md`) is blocked on a data source; (4) Organization-level shipping and return markup (H5); (5) trust profiles in `sameAs` (GBP, Instagram, YouTube, parent domain, BBB if claimed). Do not copy competitors' claims such as "1.5 million tires in stock", "500,000 customers", installer counts, "low price promise" or free lifetime services: none is true for TireDrop or allowed.
- Needs Justin: **Claude** for 1 and 2 (no Justin step, though title copy is his call).

**M9. Indexing status of the newest URLs is unknown to me and the checklist is stale.**
- Evidence: 198 URLs in the live sitemap (matches dist); `/brands` went live 2026-10-18 and is in no request-indexing list; open items #A8 (state pages, city pages) remain; checklist lines still say "merge seo/city-depth" although the deepened city pages (7.7k to 8.1k chars) are in the build. I cannot read Search Console; the only evidence is Justin's word per the checklist.
- Fix: run #A8 part 1 and add `/brands` and the wave-2 city pages (Hialeah, Hollywood, Lauderhill, Miramar, Oakland Park, Pembroke Pines, Pompano Beach) to the list; tick the stale merge items.
- Needs Justin: **Chrome prompt needed**.

### LOW

**L1. Organization/shop nodes are thin.** TireDrop `Organization` has no `sameAs`, `contactPoint` with `contactType`, or `address`; the shop node has no `geo` (H2), `priceRange` (deliberately omitted, fine), and its `image` is the 1200x630 OG card, not a photo of the shop. Schema.org also defines a `TireShop` type, which would describe the business more exactly than `AutoPartsStore` (I could not re-fetch schema.org to confirm in this session, so check before changing). Phone numbers are `(954) 773-1896`, not E.164 in JSON-LD (valid either way). Needs Justin: Claude.

**L2. No `SearchAction` on WebSite.** The store has search, but Google stopped showing the sitelinks search box in late 2024, so the value is small; add only if cheap. The check already validates one if present. Claude.

**L3. FAQPage on 92+ pages brings no search-result feature.** Google limits FAQ rich results to government and health sites, so this is neutral, not harmful (and LLMs read the Q and A text). Keep the check that blocks more.

**L4. Breadcrumb brand level points at a filter URL.** Product breadcrumbs link `/tires?brands=Continental`, whose canonical collapses to `/tires`; wheel breadcrumb leaf says "5x114.3" while the page name uses "·". Fix after brand pages exist (M6). Claude.

**L5. Meta descriptions put sample prices into snippets** (see H3). Claude.

**L6. AI-search extras.** `/llms.txt` returns the site's 404 page (a real 404 status, good); `robots.txt` has only `User-agent: *` (so all AI crawlers are allowed). Live test with GPTBot, ClaudeBot, OAI-SearchBot, PerplexityBot, Google-Extended, bingbot and Googlebot user agents all returned HTTP 200 with the same page (one GPTBot request hit a connection reset that did not repeat in three retries; I treat it as transient). `llms.txt` has no proven effect with Google and unclear effect elsewhere, so this is optional: add a short `/llms.txt` summarising the shop facts and key guides, and add explicit robots groups only if Justin wants a policy (for example allow search bots and decide on training bots such as Google-Extended and GPTBot). Citable facts are already on the page: free shipping to 48 states + DC, install from $25 per tire, South Florida mobile coverage, hours. Claude; a robots policy is a **Decision**.

**L7. City pages are decent but templated and thin on proof.** 14 pages, 5.8k to 8.2k characters each, about 29% shared 8-word phrases between pairs (7 state pages about 24%). Correctly no LocalBusiness per city (only the Sunrise shop is a real location, so this avoids GBP-spam risk). Next local gains come from real proof (install photos once the parked gallery returns, per `docs/ops/gallery-return-plan.md`) and the local-pages plan, not more template copy. Claude plus Justin's photos.

---

## 4. What is already strong

- **Validation discipline:** `npm run check:schema` parses every block, resolves every `@id`, rejects null/empty values, forbids ratings/reviews outright, checks 197 breadcrumb trails against the visible trail, and validates `geo` the moment it is pasted. It passes on the current build.
- **Honest markup:** no `aggregateRating`, `Review`, `foundingDate`, `priceRange`, or invented geo anywhere; Product is withheld rather than faked. No discount, "safe to drive", "since" year, lender or arrival-date wording found in any JSON-LD (checked by pattern across all 208 pages; the only payment-method words are Shop Pay on /financing, which the project docs accept).
- **LocalBusiness node:** `AutoPartsStore` + `AutoRepair` with full PostalAddress, opening hours, three-county `areaServed`, Yelp and Facebook `sameAs`, emitted on the home, locations, contact, install, auto-service, schedule, mobile-service and all 14 city pages; city and state pages use `Service` nodes pointing at the one shop, not fake per-city businesses.
- **NAP consistency:** one address string and one phone across `dist` and `src`; a single source of truth in `src/data/business.js`.
- **Crawl and index hygiene:** self-canonical on every indexable page, noindex on cart, checkout, track, search, compare, reviews and the two Spanish test pages; sitemap of 198 URLs with none noindexed or redirected; `*.vercel.app` noindexed; www and http redirect to the apex over 308; proper 404 status; GA4 present with a privacy-minimal config.
- **Content built to be cited:** 90 Learn/Blog guides with a Sources section, comparison tables, visible published/updated dates, FAQ blocks, and 12 interactive tools.
- **Review plan done the right way:** the request drafts forbid gating, incentives and quoting ratings; `/reviews` is honest and noindexed.
- **Competitive context:** TireDrop's markup is already at or above Tire Rack, Discount Tire, SimpleTire and Tirebuyer pages I could read; only Priority Tire's product markup is clearly ahead.

---

## 5. Self-review: three things a skeptical reviewer would challenge

1. **"A 6 for structured data is too low (or too high) when check:schema passes."** The gate only proves there is nothing invalid. I scored hygiene 9 and coverage 4 and averaged to 6, because 32 product pages, the brand list and the shop node still lack the properties that earn features (Offer, shipping, returns, geo). I re-checked by parsing all 208 built pages: zero Product nodes, zero `geo`, zero `hasMerchantReturnPolicy`, no `sameAs` on TireDrop's Organization. The score stands, and I stated plainly that withholding Product is defensible while the catalog is sample data.
2. **"The GBP name mismatch rests on one old redirect."** True. The tinyurl on the parent site decodes to a Google search for "Extreme Tires & Extreme Mobile Tires Sunrise, FL 33351" dated 15 Feb 2023 (timestamp in the URL). I did not open the live GBP and Yelp blocked my fetch, so H2 and M4 are written as "verify" with a read-only Chrome check, not as a confirmed error. I also tried to use a coordinate pair a fetch summary returned for the parent site, found it was not in the raw HTML, and dropped it; nothing in this report suggests a `geo` value.
3. **"The Shopify channel conflict is speculation."** Partly. Verified facts: `vercel.json` redirects `/products/*`, `/collections/*` to `/tires`, CLAUDE.md records the shop. to main-site theme redirect, and the plan in `shopify-admin-prompts.md` names the Google & YouTube channel. The claim that the channel's feed URLs would hit those redirects and be disapproved is an inference, so M1 says "likely" and recommends a test and a custom feed. Also checked and corrected during review: the "5/5" string on the home page was a tire size (225/50R17), not a rating; the 555-0188 phone is a form placeholder; the one GPTBot reset was transient (3 of 3 retries returned 200).

Not verified: Search Console and Bing data, live Google Business Profile, Yelp listings, whether `schema.org/TireShop` renders in Google's validator, and any competitor's rendered (JavaScript-injected) markup. Competitor markup was read from raw HTML only.
