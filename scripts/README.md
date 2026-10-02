# scripts/

Build, check and dev scripts. They stay in one flat folder on purpose:
`vite.config.js` imports `generate-seo-files.mjs`, the generated
`public/robots.txt` and `public/sitemap.xml` name that script in their
header comment, and `shopify/assets/td-tiremath.js` names
`build-shopify-assets.mjs`. Moving them would change served files.

## Build (run by `npm run build`)

| Script | What it does |
| --- | --- |
| `generate-seo-files.mjs` | Writes `public/robots.txt` and `public/sitemap.xml` from the router and content. Runs at the start of every `vite build` (plugin in `vite.config.js`) and again from the prerender. `ALLOW_INDEXING` lives here. |
| `prerender.mjs` | After `vite build`: renders every route to `dist/<route>.html`, plus `dist/404.html` and `dist/spa.html`. |
| `vpic-snapshot.mjs` | Last: writes `dist/data/vpic-models.json`, every listed make's models across all years from NHTSA vPIC, the vehicle finders' fallback when neither `/api/vehicles` nor vPIC answers. One probe request first: with no network (this sandbox) it writes nothing and never fails the build. `VPIC_SNAPSHOT=off` skips it; `VPIC_BASE` points it at another vPIC. |

## Gates (run before every push to `main`)

| Script | npm script | What it checks |
| --- | --- | --- |
| `prerender-check.mjs` | `check:prerender` | The built site in Chromium: per-page head tags with JavaScript off, hydration without mismatch, client-side navigation. |
| `schema-check.mjs` | `check:schema` | The JSON-LD in every built page: parses, every `@id` resolves, Google's required properties per type, one BreadcrumbList matching the visible trail, no ratings or reviews, the shop's `geo` pin once set. No browser. |
| `forms-keep-values-check.mjs` | `check:forms` | Every form keeps and sends a value however it was entered (typing, automation, autofill), at 390px and 1440px. |
| `newsletter-signup-check.mjs` | `check:newsletter` | The newsletter is only the footer form: no pop-up, validation, success and failure messages. |
| `translate-check.mjs` | `check:translate` | The header's Language control: nothing loads from Google until it is opened, keyboard and 320px use, translating in place with a stand-in for Google's element (routes, cart and a form throw nothing; prices and sizes stay as written), the translate.google.com fallback, and the site served from Google's translate.goog proxy. `TRANSLATE_SHOTS=<dir>` saves screenshots. |
| `docs-links-check.mjs` | `check:docs` | Every relative Markdown link and every `docs/...` path in the docs resolves to a real file. |
| `ga-events-check.mjs` | `check:ga` | GA4 conversion events through a real funnel (view_item, add_to_cart, view_cart, begin_checkout, add_shipping_info, generate_lead) with the expected shape, and nothing typed into a form in any GA call. |
| `a11y-check.mjs` | `check:a11y` | axe-core (WCAG 2.1 A/AA plus best practice) on 12 key routes at 390px and 1280px: fails on serious or critical issues. Also checks the skip link is the first Tab stop and moves focus to `<main>`. |
| `search-check.mjs` | `check:search` | The header's store-wide search: size, brand and page suggestions as you type, the ARIA combobox (arrow keys, Enter, Escape, Tab, click outside), Enter and "See all results" to `/search?q=`, the `search` and `search_suggestion` GA4 events, 44px rows and no sideways scroll at 390px, axe with the list open, `/search` noindex and hydrating. `SEARCH_SHOTS=<dir>` sets where screenshots go. |
| `home-check.mjs` | `check:home` | The home page: sections in story order in the prerendered HTML, 3-6 real Learn cards, no hidden reveal state in the markup; every scroll-reveal target visible with JavaScript off and with reduced motion; at 390px and 1440px the hero never hidden, everything revealed by scrolling, no sideways scroll, CLS under 0.1, no console errors. |
| `footer-check.mjs` | `check:footer` | The site footer at 390px and 1440px: every footer link is in the footer or, for the trimmed Tools & Guides links, on `/learn` or `/sitemap`; the newsletter form inside `<footer>`; no sideways scroll; on a phone the link groups are closed `<details>` that open and close on tap (JavaScript on and off) with 44px summaries and call/email/directions buttons; on desktop every group visible without a click and no height change on hydration; no console errors. |
| `sources-check.mjs` | `check:sources` | The sources rule on the built site, "only resources, no competitors": fails, naming file and value, on any link, `src`/`srcset` or URL in the page source (inline JSON too) to a retailer/installer domain or subdomain, and on a retailer's name in visible text, `<title>`, `<meta>` content, alt/title/aria-label text or JSON-LD; scans `dist/**/*.html`, `dist/sitemap.xml` and `dist/robots.txt`. Then reports every other external domain with counts, as known resources or UNREVIEWED (a warning, not a failure). The lists are one module, `src/lib/competitors.js`; `npm run test:sources` runs the same rule over `src/`, `public/` and `index.html` without a build. No browser, no network, about 1s. Not in the required gate list until the last offenders leave `src/`. |

`check:schema` and `check:sources` read `dist/` directly, so they need `npm run build` first.
So do the Chromium checks. They start
`vite preview` themselves and mock every `/api` call, so nothing reaches
Shopify. `test:api`, `test:content`, `test:data` and `test:lib` are `node --test`
suites in `api/_lib/`, `src/content/`, `src/data/` (the mobile city pages:
ZIPs, copy rules and the text-overlap check) and `src/lib/` (the GA4 event
parameter filter, the translate helpers, the store search's matching and the sources rule's matchers), not scripts here.
`test:sources` is `src/sourcesRule.test.mjs`: the sources rule over the source tree.

## Run by hand

| Script | How | What it does |
| --- | --- | --- |
| `mobile-audit.mjs` | `npm run audit:mobile` with `vite preview` running | Phone-width audit of every route: sideways scroll, small tap targets, tiny text. |
| `demos-check.mjs` | `node scripts/demos-check.mjs` with `npx vite --port 5173` running | Learn demos: prerender safety, browser behaviour at 390/1440px, optional axe-core. |
| `theme-redirect-check.mjs` | `LIQUIDJS_DIR=... node scripts/theme-redirect-check.mjs` | The Shopify theme's shop. → main-site redirect block, rendered with liquidjs (not a repo dependency). |
| `build-shopify-assets.mjs` | `node scripts/build-shopify-assets.mjs` | Regenerates `shopify/assets/td-tiremath.js` from the site's tire maths. Upload to the draft theme only. |

## Helpers

| Script | Used by |
| --- | --- |
| `vpic-mock.mjs` | `forms-keep-values-check.mjs`, `remember-check.mjs`, `search-check.mjs`, `api/_lib/vehicles.test.mjs`, `src/data/vehicles.test.mjs`: a stand-in for NHTSA vPIC's model lookup (Toyota, Honda, Ford, BMW, Audi), which the sandbox cannot reach. In a browser it also answers `/api/vehicles` through the real handler logic, and the snapshot (404 unless given one). |
