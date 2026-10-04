# Deploying TireDrop

## Domain status

**Moved on 2026-09-28:** tiredroponline.com → Vercel, and Shopify →
shop.tiredroponline.com (checkout only). The record, rollback and open
follow-ups are in `docs/ops/domain-migration-2026-09-28.md`.

## Repository

TireDrop has its own repository: **`TireDrop/TIREDROPONLINE-`**, with the app
at the repo root and production on the `main` branch. (It used to live in a
`tiredrop/` folder of another repository; that history came across with it.)

## Steps

1. Vercel (the TireDrop account) → Add New → Project → import
   `TireDrop/TIREDROPONLINE-`.
2. Root Directory: leave it as the repo root (`./`). Production branch: `main`.
3. Framework preset: Vite. Build `npm run build`, output `dist` — both are
   detected automatically. `engines.node` in `package.json` pins Node 22
   (Vercel ignores `.nvmrc`).
4. Deploy. `vercel.json` already handles SPA rewrites, security
   headers, immutable asset caching, and `noindex` on `*.vercel.app` previews
   so a preview URL can never outrank the real domain. Its cron runs once a
   day so the deploy works on Hobby; see `docs/integrations/atd-forwarder.md`
   before switching to Pro.

## Environment variables

Set these in Vercel → Settings → Environment Variables. They are read at
**build** time, so changing one needs a redeploy.

| Variable             | Effect when set                                            |
| -------------------- | ---------------------------------------------------------- |
| `VITE_CONTACT_EMAIL` | The address confirmations quote back (default: info@).     |

The forms need no build variable: they post to `/api/forms` (below) and turn
on when Shopify is configured. `VITE_FORM_ENDPOINT` is retired; delete it.

Do **not** set `VITE_HASH_ROUTER` on Vercel. That is only for static hosts
with no SPA rewrite; `vercel.json` provides the rewrite, so the production
build uses real paths.

## Before moving the domain

tiredroponline.com is on Shopify today, and the Shopify theme is what
collects leads: its forms and its newsletter pop-up. Do every item here
**before** DNS changes, or leads land nowhere. Then follow the step-by-step
[cutover checklist](#cutover-checklist-shopify--vercel) below.

- [ ] **Website leads reach info@ through Shopify.** The forms (contact,
      financing, fleet quote, booking) and order requests are stored on the
      Shopify customer by `/api/forms` and checkout, with the Shopify app
      below; no form service. Build the Shopify Flow workflow **"Website
      lead alert"** exactly as in `docs/integrations/website-leads.md`
      (trigger "Customer tags added", tag `new-lead`, internal email to
      info@, then remove the tag) and turn it on. Check: `/api/status`
      shows `forms: "on"`; submit the contact form with your own details;
      an email "New website lead: …" reaches info@ and the customer in
      Shopify has tags `lead`, `lead-contact`. Details:
      `docs/ops/turn-on-the-forms.md`. Delete `VITE_FORM_ENDPOINT` and
      `ORDER_WEBHOOK_URL` from Vercel if they are still set.
- [ ] **The Shopify app has the customer scopes.** Besides the checkout and
      forwarder scopes, the newsletter and the website forms need
      **`read_customers`** and **`write_customers`** (table in
      `docs/integrations/shopify-checkout.md`). Re-approve the app after
      adding them. Then `/api/status` shows `newsletter: "on"` and
      `forms: "on"`, and the "TireDrop emails" sign-up form appears in the
      footer of the Vercel site (there is no pop-up); sign up once with a
      test address and confirm a customer appears in Shopify, subscribed to
      email marketing and tagged `newsletter`, `footer`, `vercel`. With
      Shopify not configured the footer form simply does not render and the
      forms say plainly that nothing was sent, so no email is collected
      into nowhere.
- [ ] **Vercel Pro.** Hobby is for non-commercial use only, and the ATD
      forwarder's 5-minute cron needs Pro (`docs/integrations/atd-forwarder.md`).
      Upgrade the TireDrop team before the store takes real traffic.
- [ ] **Shopify's primary domain is `shop.tiredroponline.com`, BEFORE DNS
      moves.** In Shopify → Settings → Domains, connect
      `shop.tiredroponline.com` (a CNAME to `shops.myshopify.com`), make it
      primary, and confirm a test draft-order `invoiceUrl` opens on it.
      Checkout links, order-status pages, customer accounts and the
      redirects below all point there. If tiredroponline.com is still
      Shopify's primary domain when DNS moves, checkout links land on the
      Vercel site instead of Shopify.
- [ ] **Old Shopify URLs redirect.** `vercel.json` carries 301s for every
      common Shopify path (listed in step 6 of the cutover checklist):
      `/pages/*`, `/collections/*`, `/products/*`, `/cart/*`, `/policies/*`,
      `/blogs/*`, and `/account`, `/checkouts/*` and the
      `/<shop id>/invoices|orders|checkouts/...` links, which go on to
      `shop.tiredroponline.com` so account logins, abandoned-checkout emails
      and invoices sent before the move keep working. `/cart` itself is the
      same path on both sites.

## Before pointing tiredroponline.com at it

The domain currently serves the previous site. Nothing here is urgent until
you cut over, but do these in order:

1. **Flip indexing.** _Done 2026-09-29:_ `ALLOW_INDEXING = true` in
   `scripts/generate-seo-files.mjs`, so `public/robots.txt` allows crawling
   (except `/cart`, `/checkout`, `/api/`). Confirm
   `https://tiredroponline.com/robots.txt` before submitting the sitemap.
2. Add the domain in Vercel and follow its DNS instructions. Point the apex
   and `www` at Vercel; it issues the certificate automatically.
3. Submit `https://tiredroponline.com/sitemap.xml` in Google Search Console.

## Vercel + Shopify checkout + ATD

The storefront runs on Vercel; payment and the finished order run on
Shopify. The React site is static; the `api/` folder holds Vercel functions
that do the server-side work:

| Endpoint             | Does                                                     |
| -------------------- | -------------------------------------------------------- |
| `GET /api/status`    | Which integrations are on: `atd` live/sample, `shopify`   |
|                      | live/off, `checkout` shopify/request, `forwarder` on/off, |
|                      | `newsletter` on/off, `forms` on/off, `webhooks`           |
|                      | configured/off.                                           |
| `GET /api/geo`       | The visitor's approximate location from Vercel's IP       |
|                      | headers: `{ available, country, zip, lat, lng, city }`,   |
|                      | each validated, or `{ available: false }` (locally).      |
|                      | `Cache-Control: private, no-store`; nothing logged or     |
|                      | stored. `/local-delivery` calls it once on load. Not its  |
|                      | own function (Hobby allows 12, all taken): `vercel.json`  |
|                      | rewrites it to `/api/status?geo=1`; `api/_lib/geo.js`.    |
| `POST /api/forms`    | The site's forms (contact, financing, fleet quote,        |
|                      | booking). Finds or creates the Shopify customer (no       |
|                      | marketing consent), stores the lead in the metafields     |
|                      | `tiredrop.last_lead` and `tiredrop.leads` (the note only  |
|                      | for a customer it just created; never an existing one's), |
|                      | and adds the tag `new-lead` so Shopify Flow emails info@. |
|                      | Spam guard (rate limit, size cap, honeypot, fill time,    |
|                      | content); 503 `{ configured: false }` without Shopify.    |
|                      | `docs/integrations/website-leads.md`.                     |
| `POST /api/newsletter` | `{ email }`: newsletter sign-up from the footer form.   |
|                      | Makes the email a Shopify customer subscribed to email    |
|                      | marketing, tagged `newsletter`, `footer`, `vercel` (an    |
|                      | existing customer is subscribed and tagged). Spam guard   |
|                      | (rate limit, 2 KB cap, honeypot, fill time); 503          |
|                      | `{ configured: false }` without Shopify. On whenever      |
|                      | Shopify is configured.                                    |
| `GET /api/tires`     | Tire search by `size=225/45R17` or `year`/`make`/`model`. |
|                      | Live ATD data when configured, the sample catalog if not. |
|                      | `?sku=<sku>` alone returns one tire, `{ source, item }`,  |
|                      | or 404 `{ error }`; it feeds the `/tires/p/:sku` pages.   |
| `GET /api/vehicles`  | The vehicle finders' lists. `kind=makes[&year=]`: the     |
|                      | makes sold that year. `kind=models&make=&year=`: NHTSA    |
|                      | vPIC's cars, trucks and SUVs/vans for that make and year, |
|                      | merged with the size table. 4 s timeout per vPIC request, |
|                      | one retry; edge-cached a day (`s-maxage=86400`) then      |
|                      | served stale for a week; 502 `{ upstream: true }` (never  |
|                      | cached) when vPIC is down. The build also writes          |
|                      | `dist/data/vpic-models.json` (every make's models, all    |
|                      | years) as the browser's fallback when it can reach vPIC.  |
| `POST /api/checkout` | Creates the order. With Shopify checkout on, it prices    |
|                      | every line, creates a Shopify draft order of custom line  |
|                      | items and returns its `invoiceUrl`; the shopper pays on   |
|                      | Shopify's checkout. Otherwise it records an order request |
|                      | in Shopify (nothing charged): a lead emailed to info@ by  |
|                      | Flow, and a draft order tagged `order-request` with no    |
|                      | invoice sent, to confirm and "Send invoice" from Drafts.  |
|                      | `delivery` is `ship` (free, lower 48 + DC), `pickup`      |
|                      | (free ship-to-store, Sunrise) or `mobile` (van install    |
|                      | at an FL address in the install area listed in            |
|                      | `src/data/business.js`).                                  |
|                      | Mobile is always an order request, even when online       |
|                      | payment is on: the van is booked and the install quoted   |
|                      | on the call. Spam guard (10 per 10 min per IP, 16 KB cap, |
|                      | honeypot, fill time, content); see                        |
|                      | `docs/integrations/website-leads.md`.                     |
| `GET /api/cron/atd-sweep` | Vercel Cron, every 5 min: the ATD forwarder. Places  |
|                      | paid Shopify orders with ATD and syncs tracking back.     |
|                      | Needs `Authorization: Bearer $CRON_SECRET`; off unless    |
|                      | `ATD_ORDERING_ENABLED=true`. See                          |
|                      | `docs/integrations/atd-forwarder.md`.                     |
| `POST /api/webhooks/shopify` | Shopify order webhooks, HMAC-verified over the raw |
|                      | body. `orders/paid` places that order with ATD at once    |
|                      | (same gates as the cron; the cron stays as the backup);   |
|                      | `orders/cancelled` tags `atd-cancel-needed` or            |
|                      | `cancelled-before-atd`. Needs `SHOPIFY_WEBHOOK_SECRET`.   |
|                      | Setup: `docs/integrations/webhooks.md`.                   |
| `POST /api/track`    | Track My Order (`/track`). `{ order, email }`: an order   |
|                      | number (`#1001`) or a `TD-` request ref plus the email on |
|                      | it. Answers only when the email matches (else the same    |
|                      | 404 for any miss): status, items, tracking, ATD state.    |
|                      | Honeypot and per-IP rate limit; 503 without Shopify.      |
|                      | Scopes: `read_orders`, `read_draft_orders` (orders older  |
|                      | than 60 days also need `read_all_orders`).                |
| `POST /api/csp-report` | Browsers' Content-Security-Policy violation reports.    |
|                      | Logs one `[csp]` line per report (directive, blocked      |
|                      | host, page path; no query string, IP or user agent),      |
|                      | stores nothing, rate-limited. See "Security headers".     |

Payment runs on **Shopify's hosted checkout** (Shopify Payments / Shop Pay),
and the paid order lives in Shopify, so Flow, the order emails and Order
Printer handle it like any other order. The site never creates or changes a
Shopify product: each order is a draft order of custom line items at the
server's price. Tire data comes from **ATD**. Card details are entered on
Shopify's checkout and never reach this site or its functions. Tire Guru is
retired for payments. Details: `docs/integrations/shopify-checkout.md`.

### Project settings

- **Root Directory: the repo root.** `api/` sits there, so Vercel picks the
  functions up automatically.
- Framework preset Vite, build `npm run build`, output `dist`.

### Environment variables (server side)

Set in Vercel → Settings → Environment Variables, for Production (and
Preview if you want previews to talk to the real systems). These have **no**
`VITE_` prefix: only the functions read them, and they never reach the
browser. Redeploy after changing any of them. The code in `api/` is the final
word on each one.

| Variable                | What it does                                        |
| ----------------------- | --------------------------------------------------- |
| `ATD_API_BASE`          | Base URL of ATD's API (sandbox or production),      |
|                         | `https://` only.                                    |
| `ATD_API_KEY`           | API key ATD issues for the dealer account.          |
| `ATD_API_SECRET`        | The secret paired with that key.                    |
| `ATD_ACCOUNT_NUMBER`    | Extreme Tires' ATD account number.                  |
| `ATD_SHIP_TO`           | The ATD ship-to / location number whose stock and   |
|                         | pricing the search quotes.                          |
| `PRICE_MARKUP_PCT`      | Percent added to ATD's dealer cost.                 |
| `FREIGHT_PER_TIRE`      | Dollars added per tire to cover freight, since      |
|                         | shipping is shown to the shopper as free.           |
|                         | Shelf price = cost × (1 + markup/100) + freight.    |
| `SHOPIFY_STORE_DOMAIN`  | The store's `xxx.myshopify.com` domain (not         |
|                         | tiredroponline.com).                                |
| `SHOPIFY_ADMIN_TOKEN`   | Admin API access token (`shpat_...`) of an existing |
|                         | admin-created custom app. Scopes: see               |
|                         | `docs/integrations/shopify-checkout.md` (draft      |
|                         | orders for checkout; orders and merchant-managed    |
|                         | fulfillment orders for the ATD forwarder;           |
|                         | `read_customers` + `write_customers` for the        |
|                         | newsletter sign-up and the website forms).          |
| `SHOPIFY_CLIENT_ID`     | Instead of the token, for an app made in Shopify's  |
| `SHOPIFY_CLIENT_SECRET` | Dev Dashboard: its client ID and secret. The API    |
|                         | swaps them for a 24-hour token itself.              |
| `SHOPIFY_API_VERSION`   | Optional. Admin API version, default `2026-07`;     |
|                         | must be `2026-07` or newer.                         |
| `ATD_ORDERING_ENABLED`  | Kill switch for the ATD forwarder. Exactly `true`   |
|                         | lets paid orders be placed with ATD; anything else  |
|                         | (the default) is off.                               |
| `CRON_SECRET`           | Random string (16+ characters). Vercel Cron sends   |
|                         | it as a bearer token; `/api/cron/atd-sweep` answers |
|                         | 401 without it.                                     |
| `ATD_FORWARD_TEST_ORDERS` | Optional, ATD sandbox only: `true` also forwards  |
|                         | Shopify test orders. Never set in production.       |
| `SHOPIFY_WEBHOOK_SECRET` | The signing key Shopify shows under Settings →     |
|                         | Notifications → Webhooks. `/api/webhooks/shopify`   |
|                         | verifies every delivery with it (and with           |
|                         | `SHOPIFY_CLIENT_SECRET`, for app-registered ones);  |
|                         | without either it answers 503 and `/api/status`     |
|                         | shows `webhooks: "off"`. Steps:                     |
|                         | `docs/integrations/webhooks.md`.                    |

How the groups switch on:

- **ATD** is all or nothing. With no `ATD_*` variables the site runs on the
  sample catalog (`atd: "sample"`). Setting any of them turns ATD on, and
  then all five **plus** `PRICE_MARKUP_PCT` and `FREIGHT_PER_TIRE` must be
  set (`0` is allowed but must be explicit), or tire search answers 503
  naming what is missing. `/api/status` lists the problem under `issues`.
- **Shopify checkout** is on once any `SHOPIFY_*` variable is set. Then
  `SHOPIFY_STORE_DOMAIN` and exactly one way to authenticate
  (`SHOPIFY_ADMIN_TOKEN`, or `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET`)
  must be set, or checkout answers 503 naming what is missing. Payment is
  only taken once ATD is **also** live, so no card is ever charged against
  sample prices.
- Until both are on, checkout sends an order request and charges nothing,
  and the line under the checkout button says so: "Checkout sends an order
  request; nothing is charged online yet." With both on it reads "Payment is
  handled securely by Shopify checkout. Card details never touch this site."
- Mobile install is always an order request, whatever the checkout mode.
- **Newsletter** is on whenever Shopify is configured (it does not wait for
  ATD). The app needs `read_customers` and `write_customers` for it; without
  them sign-ups fail with a 502 and the footer form shows "try again", so add the
  scopes before setting the `SHOPIFY_*` variables.
- **Website forms and order requests** are recorded in Shopify whenever
  Shopify is configured (`forms: "on"`; it does not wait for ATD). Without
  Shopify, forms say plainly that nothing was sent, and an order request is
  only logged and the shopper is told to call. The info@ email comes from
  the Flow workflow in `docs/integrations/website-leads.md`.
  `ORDER_WEBHOOK_URL` is retired: if it is still set, `/api/status` lists
  it under `issues`; delete it.
- **ATD forwarder** runs only with Shopify checkout on, ATD live,
  `CRON_SECRET` set and `ATD_ORDERING_ENABLED=true`. The two `ATD_*`
  switches never turn ATD's catalog on by themselves. Until ATD's order
  endpoint is confirmed it places nothing, and `/api/status` says so under
  `issues`. **The 5-minute cron needs Vercel Pro**: Hobby allows one run a
  day and rejects a deploy with a sub-daily schedule. Details and the
  sandbox test plan: `docs/integrations/atd-forwarder.md`.
- **Order webhooks** (`/api/webhooks/shopify`) verify deliveries once
  `SHOPIFY_WEBHOOK_SECRET` is set (`webhooks: "configured"`). An
  `orders/paid` delivery places the order with ATD only under the
  forwarder's own gates (`ATD_ORDERING_ENABLED=true`, Shopify and ATD live;
  `CRON_SECRET` is not needed for it). The daily cron remains the backup.
  Justin's setup steps: `docs/integrations/webhooks.md`.
- `TIREGURU_*` variables are ignored; `/api/status` lists any that are still
  set under `issues`, so they can be removed.

`.env.example` and `docs/integrations/` have the details; the code in `api/`
is the final word.

Free shipping is to the **lower 48 states and DC only**; checkout offers only
those states and the API rejects anything else.

### Testing `/api` locally

`npm run dev` (plain Vite) serves the site but **not** the functions, so the
site falls back to the sample catalog and request-mode checkout. That is
useful for UI work, and it is exactly what a visitor would see if the API
went down. To run the functions too:

```bash
npm i -g vercel
cd TIREDROPONLINE-   # the repo root is the app
vercel link          # once, pick the TireDrop project
vercel env pull      # copies the project's env vars into .env.local
vercel dev           # site + /api on http://localhost:3000
```

Then check `http://localhost:3000/api/status`, search a size on `/tires`,
and run a checkout. Use ATD's sandbox credentials until the live ones are
confirmed, and a Shopify development store (not the live store) for the
Shopify variables until a test order has gone through end to end. Do not
commit `.env.local`.

### Cutover checklist (Shopify → Vercel)

tiredroponline.com currently points at Shopify through GoDaddy DNS. Keep
Shopify serving the domain until the Vercel site is verified.

1. **Verify on the Vercel URL first.** `/api/status` shows `atd: "live"` and
   the expected checkout mode; a size search returns ATD tires; one real
   test order goes through Shopify end to end (draft order, Shopify
   checkout, order in Shopify with the `Delivery` attribute, Flow alert,
   confirmation email) and one ship-to-store order does too.
2. **Move Shopify's primary domain off tiredroponline.com first.** Shopify
   builds draft-order `invoiceUrl`s on the store's primary domain. If
   that is still tiredroponline.com when DNS points at Vercel, the checkout
   link lands on the Vercel site instead of Shopify. In Shopify → Settings →
   Domains, make `shop.tiredroponline.com` (CNAME to Shopify) primary, then
   confirm a test `invoiceUrl` opens Shopify's checkout. Use that exact
   subdomain: the account, checkout and invoice redirects in `vercel.json`
   send visitors to it.
3. **Add the domain in Vercel** (Settings → Domains): `tiredroponline.com`
   and `www.tiredroponline.com`. Vercel shows the DNS records it wants.
4. **Change DNS in GoDaddy** to exactly what Vercel shows: the apex `A`
   record to Vercel's IP, and `www` as a `CNAME` to Vercel's target. Remove
   the old Shopify `A`/`CNAME` records for those names; leave MX and other
   email records alone. Wait for Vercel to show the domain as valid and the
   certificate as issued.
5. **Flip indexing.** _Done 2026-09-29:_ `ALLOW_INDEXING = true` in
   `scripts/generate-seo-files.mjs`; after the deploy, confirm
   `https://tiredroponline.com/robots.txt` no longer says `Disallow: /`.
   Then submit `https://tiredroponline.com/sitemap.xml` in Search Console.
6. **Check the 301s** from the old Shopify URLs (they live in `vercel.json`
   under `redirects`):
   - `/collections/tires` → `/tires`, `/collections/wheels` → `/wheels`
   - `/pages/<x>` → `/<x>` for about, shipping, install, mobile-service,
     auto-service, commercial-tires, locations, contact, reviews, gallery,
     financing, terms, privacy, accessibility, find-my-tires, tire-size and
     tire-check; `/pages/tire-care` and `/tire-care` → `/learn`
   - `/cart` is the same path on both sites, so it needs no redirect;
     Shopify's `/cart/...` sub-paths go to `/cart`
   - `/collections/tires/*` → `/tires`, `/collections/wheels/*` → `/wheels`,
     any other `/collections` or `/collections/*` (e.g. `/collections/all`)
     and `/products/*` → `/tires` (Shopify product handles have no
     one-to-one page here)
   - any other `/pages/*` → `/`
   - `/cart/c/*` (Shopify cart-recovery links) →
     `shop.tiredroponline.com/cart/c/*`
   - `/policies/privacy-policy` → `/privacy`, `refund-policy` →
     `/terms#returns`, `shipping-policy` → `/terms#shipping`,
     `terms-of-service` → `/terms`, `contact-information` → `/contact`;
     any other `/policies/*` → `/terms`
   - `/blogs` and `/blogs/*` → `/blog`. `/search` is no longer redirected:
     it is the store's own results page now, so an old Shopify
     `/search?q=…` link lands on results for the same words
   - `/account` and `/account/*` → `shop.tiredroponline.com/account/*`
     (customer accounts stay on Shopify)
   - `/checkouts/*` and `/<shop id>/invoices|orders|checkouts/*` →
     the same path on `shop.tiredroponline.com`, so abandoned-checkout
     emails, draft-order invoices and order-status links sent before the
     move still open on Shopify

   Spot-check a few with `curl -sI https://tiredroponline.com/pages/about`
   and look for `301` and the right `location`.
7. **Keep the Shopify plan.** Checkout, the orders, Flow, the order emails
   and Order Printer all run on it. Only the storefront moves to Vercel.

## Security headers

Set for every response (pages, `/api/*`, the 404 page and the `/spa`
fallback) by the first `headers` block in `vercel.json`:

| Header | Value |
| --- | --- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` (2 years). **No `preload` yet:** adding it and submitting to hstspreload.org is Justin's decision, and hard to undo. `includeSubDomains` means every subdomain must keep working on HTTPS (shop. does). |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Frame-Options` | `SAMEORIGIN` (the CSP's `frame-ancestors 'self'` takes over once the CSP is enforced: browsers ignore `frame-ancestors` in a report-only policy) |
| `Permissions-Policy` | `geolocation=(self)`: our own pages may ask for the device location (the `/local-delivery` zone check and its "Use my location" button); embedded third-party frames may not. With `geolocation=()` the browser blocks the Geolocation API outright, so "Use my location" failed on every phone and PC (headless checks never saw it: `vite preview` doesn't send this header; `test:api` and `check:local-delivery` now assert it). Camera, microphone, payment, USB, serial, HID, MIDI, motion sensors, display capture, autoplay, encrypted media, passkeys, screen wake lock, XR and Topics stay off (`=()`). Payment happens on Shopify's own domain, which this header does not reach. |
| `Content-Security-Policy-Report-Only` | Below. **Report-only:** nothing is blocked; the browser only reports. |

### Fonts (self-hosted)

Archivo (headings, variable `wdth` 100-125 and `wght` 500-900) and Instrument Sans (body, `wght` 400-700, plus italic) are served from our own origin, so there is no render-blocking Google stylesheet and no cross-origin connection before text can paint. The three latin-only `.woff2` files live in `src/fonts/` (81.9 KB for the two roman files, 110.5 KB with italic, against about 120 KB from Google), are declared with `@font-face` (`font-display: swap`) at the top of `src/index.css`, and Vite fingerprints them into `/assets/`, so the existing `/assets/(.*)` immutable one-year cache in `vercel.json` covers them. The fonts are deliberately not preloaded: in the lab (4x CPU, slow 4G) preloading both roman files delayed LCP by about 100 ms, because they compete with the render-blocking CSS and JS. Size-adjusted `Archivo Fallback` and `Instrument Sans Fallback` faces (system fonts scaled to match) keep the swap from shifting the layout (phone home CLS 0.20 to 0; LCP level with Google Fonts in the lab, not a measured speed-up).

To update or re-cut the fonts later: `npm install` (the `@fontsource-variable/archivo` and `@fontsource-variable/instrument-sans` dev dependencies are only a source of files), `pip install fonttools brotli`, then `python3 scripts/subset-fonts.py`. Keep the glyph list in that script and the `unicode-range` in `src/index.css` in sync. Both fonts are SIL OFL 1.1 (`src/fonts/OFL.txt`).

### The CSP and why each source is there

| Directive | Allows | For |
| --- | --- | --- |
| `default-src` | `'self'` | everything not listed |
| `script-src` | `'self'`, the gtag snippet's `sha256-` hash, `*.googletagmanager.com` | the Vite bundle, GA4 (`gtag.js`) |
| | `translate.google.com`, `translate.googleapis.com`, `translate-pa.googleapis.com`, `www.gstatic.com` | Google Translate (`preview/translate`, loaded on demand) |
| `style-src` | `'self'`, `'unsafe-inline'`, `fonts.googleapis.com`, `translate.googleapis.com`, `www.gstatic.com` | the CSS bundle, Translate's CSS (`fonts.googleapis.com` is no longer used: the fonts are self-hosted, see "Fonts" below; it can be dropped from this list). `'unsafe-inline'` because React writes `style="…"` attributes into the prerendered HTML (and Translate injects styles); hashes cannot cover attributes. Style injection is low risk next to script injection, which stays locked down. |
| `font-src` | `'self'`, `data:`, `fonts.gstatic.com` | Archivo and Instrument Sans now come from `'self'` (`/assets/*.woff2`); `fonts.gstatic.com` is unused and can be dropped from this list |
| `img-src` | `'self'`, `data:`, `blob:`, any `https:` | product photos come from the distributor's image host (not confirmed yet), plus GA and Translate images |
| `connect-src` | `'self'`, `vpic.nhtsa.dot.gov`, `*.google-analytics.com`, `*.analytics.google.com`, `*.googletagmanager.com`, `translate.google.com`, `translate.googleapis.com`, `translate-pa.googleapis.com` | `/api`, the NHTSA make/model lookup, GA4 hits (incl. `region1.google-analytics.com`), Translate (translations from `translate-pa`/`translate.googleapis.com`, the element's pings to `translate.google.com`). `api/_lib/cspReport.test.mjs` checks every Translate host in `src/lib/translate.js` is listed. |
| `frame-src` | `translate.google.com`, `translate.googleapis.com` | Translate's frames; nothing else on the site embeds a frame |
| `object-src` `'none'`, `base-uri` `'self'`, `form-action` `'self'`, `manifest-src` `'self'`, `worker-src` `'self'` | | |
| `report-uri` | `/api/csp-report` | |

Not in the CSP because they are only **links** (navigation is not covered):
shop.tiredroponline.com (checkout, account, invoices; the `/account`,
`/checkouts/*` and `/cart/c/*` redirects), `*.myshopify.com`, Google Maps,
Facebook, Yelp, carrier tracking sites and the sources the Learn pages cite.
The JSON-LD `<script type="application/ld+json">` blocks are data, not code,
and need no hash.

**The gtag hash.** The only executable inline script is the GA4 snippet in
`index.html`; the prerender copies it byte for byte into every page. Change
one character of it and its hash changes: `npm run test:api`
(`api/_lib/cspReport.test.mjs`) then fails and prints the new
`'sha256-…'` to put in `vercel.json`.

### Reading the reports

Vercel → the project → Logs, filter `[csp]`. Each line is
`[csp] report <directive> blocked=<origin|inline|eval> page=<path> source=<origin>`.
Or open any page with DevTools → Console: report-only violations show as
"[Report Only] Refused to …" warnings. Browser extensions (password
managers, translators, ad blockers) cause some reports; those name
`chrome-extension` or a host the site never uses, and can be ignored.

### Switching from report-only to enforced

After **seven days with no unexplained `[csp]` lines** (and after
`preview/translate` has been merged and clicked through with the Console
open, if it is going live):

1. In `vercel.json`, rename the key `Content-Security-Policy-Report-Only`
   to `Content-Security-Policy`, and add `frame-ancestors 'self'` before
   `report-uri` in its value. Keep `report-uri`, so a later break still
   reports.
2. `npm run test:api` (update the "report-only" assertion in
   `api/_lib/cspReport.test.mjs` to expect the enforced header), push, and
   on the deploy click through: home, a tire search by size and by vehicle
   (NHTSA models load), a product page, cart, checkout to the review step,
   `/track`, a Learn demo, the contact form, and Translate if it is live.
   Console must show no "Refused to" errors, and GA4 Realtime must still
   show the visit.
3. Rollback: rename the key back to `…-Report-Only` and push.

If a report names a host the site really needs (a new supplier image host
is already covered by `img-src https:`), add that host to the one directive
it was blocked under, not to `default-src`.

## GA4 conversion events

Sent from the browser through `src/lib/analytics.js` (`trackEvent`), which
keeps only allow-listed parameter names and drops any email- or phone-shaped
value, so no name, email, phone, address, notes or order email reaches
Google. No-ops in the prerender and wherever `gtag` is missing.

| Event | When | Parameters |
| --- | --- | --- |
| `view_item` | a product page opens (once per page view) | `currency`, `value`, `items[1]` |
| `add_to_cart` | any Add button, or cart quantity up | `currency`, `value`, `items` |
| `remove_from_cart` | cart Remove, or quantity down | `currency`, `value`, `items` |
| `view_cart` | `/cart` with something in it | `currency`, `value`, `items` |
| `begin_checkout` | `/checkout` with something in the cart | `currency`, `value`, `items` |
| `add_shipping_info` | leaving the checkout's Delivery step | `shipping_tier` (`ship`, `ship-to-store`, `mobile`), `currency`, `value`, `items` |
| `order_request` | a request-only order is sent | `currency` USD, `value` (incl. install), `shipping_tier`, `items` |
| `generate_lead` | a form is delivered | `form_name`: `contact`, `booking` (/schedule), `fleet-quote`, `financing`, `size-quote` (/tires, nothing in the size), `newsletter` |
| `install_booking` | `/track` booking panel: booked inline, or the external booking link clicked | `install_type`, `method` (`inline` / `external`) |
| `search` | the tire/wheel finder is submitted | `search_type`, `search_term` (a size like `225/45R17` or "year make model" from the dropdowns) |
| `view_search_results` | `/tires` with a vehicle or size, once per search after it answers | `search_type` (`vehicle`, `tire_size`), `search_term`, `results` (tires in the size; `0` is the dead end the size-quote form answers) |
| `tool_use` | first touch of a Learn demo / free tool (once per page view) | `tool_id` |
| `installed_price_toggle` | "Show installed price" pressed on `/tires` or a tire page | `toggle_state` (`on` / `off`), `placement` (`results` / `product`) |

Items carry `item_id` (the SKU), `item_name`, `item_brand`,
`item_category` (tire/wheel), `item_variant` (size), `price` (per unit,
before install) and `quantity`.

**`purchase` is not sent.** Checkout is request-only, so nothing is paid on
this site. When online payment is switched on, record the purchase on
Shopify's checkout (it knows the transaction id and that payment went
through) rather than at the redirect from here, which would count abandoned
payments as sales.

Key events (conversions) are set in GA4 Admin, not in code: prompt 25 in
`docs/business/shopify-admin-prompts.md` marks `generate_lead`,
`order_request` and `install_booking`. To watch events live, open the site
through Google Tag Assistant (tagassistant.google.com) and use GA4 Admin →
DebugView. Tests: `npm run test:lib` (the parameter filter) and
`npm run check:ga` (Chromium, after a build: the funnel's events and their
shape).

## Free alternative

Cloudflare Pages runs this at $0 with commercial use permitted, where Vercel's
free Hobby tier does not allow it. It needs a `public/_redirects` file containing `/*  /index.html  200` in place of
`vercel.json`'s rewrite. It would not run the `api/` functions, so search
would stay on the sample catalog and checkout in request mode. Worth it only
if the $20/month matters.
