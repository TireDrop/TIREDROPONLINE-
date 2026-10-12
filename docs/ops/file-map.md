# File map: "Where is X?"

A lookup for finding the right file fast. Paths are from the repo root. How
the code fits together is in the root [README](../../README.md); what each
script does is in [scripts/README.md](../../scripts/README.md).

Do not move or rename source files to tidy this up: imports, the generated
SEO file headers and `vite.config.js` all name current paths.

## 1. I need to change...

| Task | Look here |
| --- | --- |
| A page's copy (wording, headings) | `src/pages/<area>/*Page.jsx` (areas: `shop`, `services`, `support`, `tools`, `shipping`, `learn`, `blog`; the home, install, shipping, search and 404 pages sit at `src/pages/`) |
| Header, footer, mobile call bar, search box | `src/components/layout/` |
| Shared business facts (name, phone, email, address, hours) | `src/data/business.js` |
| Service area, towns, counties, ZIPs | `src/data/serviceArea.js`; city landing pages `src/data/cityPages.js`; state shipping pages `src/data/statePages.js`, `src/data/stateList.js` |
| Service list and service pages | `src/data/services.js`, `src/pages/services/` |
| Price, installed price | `src/data/pricing.js`, `src/lib/installedPrice.js`, `src/components/shop/InstalledPrice.jsx` |
| Tire/product data | `src/data/products.js`, `src/data/tireRatings.js`, `src/components/shop/ProductCard.jsx`, `src/pages/shop/` |
| Tire filters and facets | `src/data/tireFacets.js`, `src/components/shop/TireFilters.jsx`, `Filters.jsx`, `src/lib/tiresUrl.js` (filters in the URL) |
| Tire-size maths | `src/data/tireMath.js` (the Shopify copy `shopify/assets/td-tiremath.js` is generated from it; see section 4) |
| Fitment and vehicles (year/make/model) | `src/data/fitment.js`, `fitmentCheck.js`, `vehicles.js`, `vehicleList.js`, `vin.js`; UI `src/components/shop/Fitment.jsx`, `VehicleSelect.jsx`, `ModelCombobox.jsx`; state `src/context/VehicleContext.jsx`; server `api/vehicles.js`, `api/_lib/vehicles.js`, `api/_lib/vpic.js`, `api/_lib/fitmentAttrs.js` |
| The photo scanner | `src/data/scanner.js`, `src/data/scanHandoff.js`, `src/components/shop/ScanTireButton.jsx`, `src/pages/tools/TireSizeFinderPage.jsx`; server `api/scan-tire-size.js`, `api/_lib/scanTireSize.js`; doc `docs/integrations/tire-size-finder.md` |
| Forms and leads (contact, quote, schedule) | `src/data/forms.js`, `formGuard.js`, `src/components/shop/SizeQuoteForm.jsx`; server `api/forms.js`, `api/_lib/leads.js`, `spam.js`, `validate.js`, `ratelimit.js`; doc `docs/integrations/website-leads.md` |
| Newsletter | `src/components/layout/NewsletterSignup.jsx`, `api/newsletter.js`, `api/_lib/newsletter.js` |
| Install booking, scheduling | `src/data/booking.js`, `src/pages/services/SchedulePage.jsx`, `api/book-install.js`, `api/_lib/booking.js`, `installBooking.js`, `tireguru.js` |
| Cart, checkout, orders | `src/context/CartContext.jsx`, `src/pages/shop/CartPage.jsx`, `CheckoutPage.jsx`; server `api/checkout.js`, `api/_lib/orders.js`, `api/_lib/shopify.js`; doc `docs/integrations/shopify-checkout.md` |
| Webhooks (`orders/paid`, `orders/cancelled`) | `api/webhooks/shopify.js`, test `api/_lib/webhooks.test.mjs`; doc `docs/integrations/webhooks.md` |
| ATD catalog, price, stock adapter | `api/_lib/atd.js`, `api/_lib/catalog.js`, `api/tires.js`; doc `docs/integrations/atd.md` |
| ATD order forwarding and the daily sweep | `api/_lib/forwarder.js`, `api/cron/atd-sweep.js` (schedule in `vercel.json`); doc `docs/integrations/atd-forwarder.md` |
| Server config, env reading | `api/_lib/config.js`, `api/_lib/http.js`; status endpoint `api/status.js` |
| Analytics and GA4 events | `src/lib/analytics.js` (all events), `api/track.js` + `api/_lib/track.js` (server hits), `api/csp-report.js` |
| SEO files (sitemap, robots) | `scripts/generate-seo-files.mjs` writes `public/robots.txt`, `public/sitemap.xml`; prerender `scripts/prerender.mjs`; page schema `src/components/content/schema.js` |
| Site search | `src/lib/siteSearch.js`, `searchData.js`, `sitePages.js`, `src/components/layout/HeaderSearch.jsx`, `src/pages/SearchPage.jsx` |
| Blog posts | `src/content/blog/*.md` (loaded by `src/content/index.js`) |
| Learn guides and hubs | `src/content/learn/<hub>/*.md`, hub list `src/content/learn/hubs.json`, loader `src/content/index.js`, `core.js`, `store.js`, `node.js` |
| Learn interactive demos | `src/components/demos/` (logic in `*Logic.js`, registry `index.js`, sources `sources.js`) |
| Tool pages (size finder, tire check, find my tires) | `src/pages/tools/`, `src/components/demos/toolPages.js` |
| Routes (add or rename a URL) | `src/App.jsx`; also `src/lib/sitePages.js` for search/sitemap, `vercel.json` for rewrites and redirects |
| Shopify theme sections (TireDrop's own) | `shopify/sections/td-*.liquid` |
| Shopify templates, snippets, settings, translations | `shopify/templates/`, `shopify/snippets/`, `shopify/config/`, `shopify/locales/`; assets `shopify/assets/td-*`; conventions `shopify/README.md` |
| Environment variables | `.env.example` (template), `docs/ops/deploy.md` (every server variable) |
| Deploy, headers, crons, redirects | `vercel.json`; build and plugins `vite.config.js`; Node version `.nvmrc` |
| Lint rules | `eslint.config.js` |
| Competitor/retailer name rules | `src/lib/competitors.js` |

## 2. Which check proves it?

Cheap checks need no build. Checks marked **build** read `dist/`, so run
`npm run build` first. Checks marked **browser** start Chromium.

| I changed... | Run |
| --- | --- |
| Anything (the one-shot gate: lint, unit tests, build, static checks) | `npm run verify` (add `-- --full` for the browser checks; slow) |
| Any JS/JSX | `npm run lint` |
| `api/` | `npm run test:api` |
| `src/data/` | `npm run test:data` (fitment only: `npm run test:fitment`) |
| `src/lib/` | `npm run test:lib` |
| `src/content/` (blog, learn) | `npm run test:content` |
| Anything that could name a retailer | `npm run test:sources` (source tree); `npm run check:sources` (**build**) |
| Docs or any doc link | `npm run check:docs` |
| JSON-LD / page head | `npm run check:schema` (**build**), `npm run check:prerender` (**build**, **browser**) |
| Internal links, new pages | `npm run check:links` (**build**) |
| Forms | `npm run check:forms` (**browser**) |
| Newsletter | `npm run check:newsletter` (**browser**) |
| Scanner | `npm run check:scanner` (**browser**) |
| GA4 events | `npm run check:ga` (**browser**) |
| Search box | `npm run check:search` (**browser**) |
| Vehicle/size memory, installed-price toggle | `npm run check:remember` (**browser**) |
| Home page | `npm run check:home` (**browser**) |
| Footer | `npm run check:footer` (**browser**) |
| Header language control | `npm run check:translate` (**browser**) |
| Layout, colour, focus | `npm run check:a11y` (**browser**) |
| Phone layout | `npm run audit:mobile` (**browser**, with `vite preview` running) |
| A Shopify theme redirect block | `node scripts/theme-redirect-check.mjs` (see `scripts/README.md`) |

## 3. Where tests live

Tests sit next to the source they cover, as `*.test.mjs`, and run with
`node --test`. There is no `tests/` folder.

| Pattern | Script |
| --- | --- |
| `api/_lib/*.test.mjs` | `npm run test:api` |
| `src/data/*.test.mjs` | `npm run test:data` |
| `src/data/fitment*.test.mjs` | `npm run test:fitment` |
| `src/lib/*.test.mjs` | `npm run test:lib` |
| `src/content/*.test.mjs` | `npm run test:content` |
| `src/sourcesRule.test.mjs` | `npm run test:sources` |
| `src/components/demos/*.test.mjs` | no npm script; run `node --test "src/components/demos/*.test.mjs"` |

Browser checks are scripts, not unit tests: `scripts/*-check.mjs`.

## 4. Conventions

- **New files:** page components in `src/pages/<area>/` named `XxxPage.jsx`;
  shared UI in `src/components/<layout|shop|ui|content|demos>/`; static data in
  `src/data/`; pure helpers in `src/lib/`; serverless endpoints in `api/`
  (one file per endpoint) with shared code in `api/_lib/`; scripts flat in
  `scripts/`; docs in the matching `docs/` folder and listed in
  [docs/README.md](../README.md).
- **Tests** go beside the file as `<name>.test.mjs`.
- **Generated, never hand-edit:** `dist/` (build output), `public/robots.txt`
  and `public/sitemap.xml` (written by `scripts/generate-seo-files.mjs` on every
  build), and `shopify/assets/td-tiremath.js` (from
  `scripts/build-shopify-assets.mjs`). Change the source and rebuild.
- **Gitignored:** `node_modules`, `dist`, `.scratch`, `.env`, `*.local`,
  `.DS_Store`.
- **`.claude/worktrees/`** is agent scratch. ESLint ignores it. Never edit it,
  and do not search it for the "real" copy of a file.
- **ESLint** also ignores `shopify/` (Liquid and theme JS are not linted).

## 5. Do not touch / needs Justin

- **Publishing a Shopify theme.** Never publish; that is Justin's click. Edit
  only the draft theme "EDIT HERE " (**188753510552**), and check its role is
  UNPUBLISHED before writing. Never write to the live theme.
- **Money:** prices, checkout charges, payment settings, anything that moves
  or sets what a customer pays.
- **DNS, domains, the Vercel dashboard, Shopify admin, Google tools:** Claude
  cannot do these. Write a copy-paste Chrome prompt for Justin; saved prompts
  live in [docs/business/shopify-admin-prompts.md](../business/shopify-admin-prompts.md).
- **Site-copy house rules** (see [CLAUDE.md](../../CLAUDE.md)) apply to every
  file in sections 1 and 4 that holds customer-facing text.
