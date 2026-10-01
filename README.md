# TireDrop: how this site works

**tiredroponline.com** is the online tire and wheel store of **Extreme Tires**,
a tire shop in Sunrise, FL. Shipping is free to the 48 contiguous states + DC;
installation (at the shop or by van) is South Florida only.

This page is the one-page map of the code. Every other document is listed in
**[docs/README.md](docs/README.md)**; Justin's to-do list is
[docs/LAUNCH-CHECKLIST.md](docs/LAUNCH-CHECKLIST.md).

---

## The stack

```
 Browser ──► tiredroponline.com (Vercel)
               ├── dist/*.html   every route prerendered at build time, then
               │                 hydrated by React (Vite 5 + React 18)
               └── /api/*        Vercel serverless functions (Node 22)
                                    │
             ┌──────────────────────┼─────────────────────────┐
             ▼                      ▼                         ▼
   Shopify (shop.tiredroponline.com)   ATD (distributor)     Tire Guru (shop POS)
   checkout via draft orders,          GATED OFF: sample     payments retired;
   customers, leads, newsletter,       catalog until ATD_*   install bookings only
   order webhooks; Shopify Flow        is set, and no        (INSTALL_BOOKING_URL,
   emails every alert to info@         ordering until        otherwise by hand)
                                       ATD_ORDERING_ENABLED
```

- **Front end.** Vite 5, React 18, react-router-dom 6 (real URLs), Tailwind
  CSS 3. `npm run build` runs `vite build`, then `scripts/prerender.mjs`
  renders every route with React's server renderer into its own HTML file
  (title, canonical, Open Graph, JSON-LD and the page itself). `src/main.jsx`
  hydrates it. `/tires/p/:sku` is the one route that is not prerendered:
  `vercel.json` rewrites it to `dist/spa.html`.
- **Learn and Blog.** Markdown files in `src/content/` (front matter parsed
  with js-yaml, bodies with marked), prerendered like any other page and
  listed in the sitemap automatically.
- **API.** Vercel functions in `api/`, with shared code in `api/_lib/`. They
  read server-only environment variables that never reach the browser.
- **Shopify is the back office, not the storefront.** It takes the payment on
  its hosted checkout (the site creates a draft order and sends the shopper to
  its `invoiceUrl`) and keeps the orders, customers, leads and newsletter
  sign-ups. **Shopify Flow** workflows send every alert to
  **info@tiredroponline.com** (website leads, newsletter sign-ups, and the
  high-risk order and needs-scheduling alerts from prompt 22). The Shopify theme only redirects shop. storefront pages to the
  main site.
- **ATD is gated off.** With no `ATD_*` variables the site runs on the sample
  catalog in `src/data/products.js` and checkout sends an order request
  (nothing charged). Payment is only taken once Shopify **and** ATD are live.
  The ATD forwarder, which places paid orders with ATD, also needs
  `ATD_ORDERING_ENABLED=true` and an ATD order endpoint that has not been
  confirmed yet.
- **`GET /api/status`** says which of these are on: `atd`, `shopify`,
  `checkout`, `forwarder`, `newsletter`, `forms`, `webhooks`, `booking`, plus
  an `issues` list.

## Where things live

```
api/                  Vercel functions: checkout, forms, newsletter, status,
│                     tires, track, cron/atd-sweep, webhooks/shopify
└── _lib/             Shared server code + unit tests (*.test.mjs)
src/
├── App.jsx           Every route, in one place
├── main.jsx          Browser entry (hydrates the prerendered HTML)
├── entry-server.jsx  Server entry used by the prerender
├── data/             Single source of truth: business facts, catalog,
│                     pricing (sets of four), fitment, forms, booking
├── content/          Learn + Blog Markdown and its loader (+ tests)
├── components/       layout/, ui/ (Seo lives here), shop/, content/, demos/
├── pages/            One file per page, grouped by area
├── context/          Cart and Compare state
└── lib/              Analytics (GA4), form helpers, hydration helpers
public/               Static files; robots.txt and sitemap.xml are GENERATED
scripts/              Build, check and dev scripts: see scripts/README.md
shopify/              Mirror of the Shopify theme source (see shopify/README.md;
                      never edit or publish the live theme from here)
docs/                 Every document: see docs/README.md
vercel.json           Redirects, headers, the /tires/p/:sku rewrite, the cron
.env.example          Every environment variable, with what it does
```

The design tokens are in `tailwind.config.js` and the component classes in
`src/index.css`.

## npm scripts and gates

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server (site only; `/api` falls back to sample mode) |
| `npm run build` | Production build + prerender into `dist/`. **Gate.** |
| `npm run build:preview` | Build for a static host with no rewrites (hash routing) |
| `npm run preview` | Serve the built `dist/` |
| `npm run lint` | ESLint; **0 errors** required. **Gate.** |
| `npm run test:api` | Unit tests for `api/_lib/` (mocked Shopify and ATD). **Gate.** |
| `npm run test:content` | Tests for the Learn/Blog content loader. **Gate.** |
| `npm run check:prerender` | Chromium: prerendered pages, hydration, navigation. **Gate** (after build). |
| `npm run check:forms` | Chromium: every form keeps and sends what was typed. **Gate** (after build). |
| `npm run check:newsletter` | Chromium: footer sign-up only, no pop-up. **Gate** (after build). |
| `npm run check:docs` | Every relative link and `docs/` path in the docs resolves. **Gate.** |
| `npm run audit:mobile` | Phone-width audit of every route (needs a preview server) |

Run the gates before every push to `main`:

```bash
npm ci
npm run test:api && npm run test:content && npm run lint && npm run check:docs
npm run build && npm run check:prerender && npm run check:forms && npm run check:newsletter
```

The Chromium checks mock every `/api` call, so nothing reaches Shopify.
Scripts that are run by hand (the Learn demos check, the theme redirect
check, the Shopify asset build) are described in
[scripts/README.md](scripts/README.md).

## Environment variables

Names only. Values live in Vercel (Settings → Environment Variables) and in
a local, gitignored `.env`. Never commit a value. `.env.example` explains each
one.

- **Build time (browser):** `VITE_CONTACT_EMAIL`, `VITE_API_BASE`,
  `VITE_HASH_ROUTER` (only for `build:preview`, from `.env.preview`; never on
  Vercel). `VITE_BUILD_YEAR` is set by `vite.config.js`.
- **ATD:** `ATD_API_BASE`, `ATD_API_KEY`, `ATD_API_SECRET`,
  `ATD_ACCOUNT_NUMBER`, `ATD_SHIP_TO`, `PRICE_MARKUP_PCT`, `FREIGHT_PER_TIRE`.
- **ATD forwarder:** `ATD_ORDERING_ENABLED`, `CRON_SECRET`,
  `ATD_FORWARD_TEST_ORDERS` (sandbox only).
- **Shopify:** `SHOPIFY_STORE_DOMAIN`, then either `SHOPIFY_ADMIN_TOKEN` or
  `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET`; `SHOPIFY_API_VERSION`
  (optional); `SHOPIFY_WEBHOOK_SECRET`.
- **Install booking:** `INSTALL_BOOKING_URL` (optional).
- **Tire Size Finder photo scan:** `ANTHROPIC_API_KEY` (optional; unset,
  `/tire-size-finder` says "Photo scan coming soon". See
  `docs/integrations/tire-size-finder.md`).
- **Set by Vercel:** `VERCEL_GIT_COMMIT_SHA`.
- **Retired, delete if still set:** `ORDER_WEBHOOK_URL` and `TIREGURU_*`
  (both listed under `issues` in `/api/status`), `VITE_FORM_ENDPOINT`.

## Deploying

1. Work on a branch; run the gates above.
2. Push to **`main`** of `TireDrop/TIREDROPONLINE-`. Vercel builds it with
   `npm run build` (Node 22, output `dist/`, `api/` picked up as functions)
   and serves it on tiredroponline.com. Other branches get preview URLs, which
   send `noindex`.
3. Server environment variables apply to new deployments only: redeploy
   after changing one.
4. Shopify theme changes are separate: edit only the draft theme, and
   publishing is Justin's click (see `CLAUDE.md`).

Full project settings, every endpoint, the cutover history and local `/api`
testing with `vercel dev`: [docs/ops/deploy.md](docs/ops/deploy.md).

## House rules

Site copy follows the rules in [CLAUDE.md](CLAUDE.md): no discounts or deals,
no invented reviews, never "safe to drive", no delivery dates, no APR or
lender names.
