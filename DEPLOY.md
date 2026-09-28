# Deploying TireDrop

## The one thing that goes wrong

This repository holds **two** sites:

| Path        | Site      | Vercel project |
| ----------- | --------- | -------------- |
| `/`         | Cannavibe | `cannavibe`    |
| `/tiredrop` | TireDrop  | (new)          |

TireDrop needs its **own Vercel project** with **Root Directory set to
`tiredrop`**. Deploy the repository without that and Vercel builds the root
app and publishes Cannavibe under the TireDrop domain.

## Steps

1. Vercel → Add New → Project → import `jja8991/cannavibe`.
2. **Root Directory: `tiredrop`.** This is the step that matters.
3. Framework preset: Vite. Build `npm run build`, output `dist` — both are
   detected automatically. `engines.node` in `package.json` pins Node 22
   (Vercel ignores `.nvmrc`).
4. Deploy. `vercel.json` in this folder already handles SPA rewrites, security
   headers, immutable asset caching, and `noindex` on `*.vercel.app` previews
   so a preview URL can never outrank the real domain.

## Environment variables

Set these in Vercel → Settings → Environment Variables. Both are read at
**build** time, so changing either needs a redeploy.

| Variable             | Effect when set                                            |
| -------------------- | ---------------------------------------------------------- |
| `VITE_FORM_ENDPOINT` | The five forms start sending. Until then the site says      |
|                      | plainly that nothing was sent and leads with the phone. See |
|                      | `docs/business/turn-on-the-forms.md`. Orders no longer use  |
|                      | this; they go through `/api/checkout` (below).              |
| `VITE_CONTACT_EMAIL` | The address confirmations quote back.                       |

Do **not** set `VITE_HASH_ROUTER` on Vercel. That is only for static hosts
with no SPA rewrite; `vercel.json` provides the rewrite, so the production
build uses real paths.

## Before pointing tiredroponline.com at it

The domain currently serves the previous site. Nothing here is urgent until
you cut over, but do these in order:

1. **Flip indexing.** `public/robots.txt` is generated with `Disallow: /` on
   purpose — an unlaunched store must not be indexed under this brand. Set
   `ALLOW_INDEXING = true` in `scripts/generate-seo-files.mjs`, rebuild,
   commit, and confirm `https://tiredroponline.com/robots.txt` before
   submitting the sitemap.
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
|                      | live/off, `checkout` shopify/request, `forwarder` on/off. |
| `GET /api/tires`     | Tire search by `size=225/45R17` or `year`/`make`/`model`. |
|                      | Live ATD data when configured, the sample catalog if not. |
|                      | `?sku=<sku>` alone returns one tire, `{ source, item }`,  |
|                      | or 404 `{ error }`; it feeds the `/tires/p/:sku` pages.   |
| `POST /api/checkout` | Creates the order. With Shopify checkout on, it prices    |
|                      | every line, creates a Shopify draft order of custom line  |
|                      | items and returns its `invoiceUrl`; the shopper pays on   |
|                      | Shopify's checkout. Otherwise it records an order request |
|                      | (nothing charged).                                        |
|                      | `delivery` is `ship` (free, lower 48 + DC), `pickup`      |
|                      | (free ship-to-store, Sunrise) or `mobile` (van install    |
|                      | at an FL address in the install area listed in            |
|                      | `src/data/business.js`).                                  |
|                      | Mobile is always an order request, even when online       |
|                      | payment is on: the van is booked and the install quoted   |
|                      | on the call.                                              |
| `GET /api/cron/atd-sweep` | Vercel Cron, every 5 min: the ATD forwarder. Places  |
|                      | paid Shopify orders with ATD and syncs tracking back.     |
|                      | Needs `Authorization: Bearer $CRON_SECRET`; off unless    |
|                      | `ATD_ORDERING_ENABLED=true`. See                          |
|                      | `docs/integrations/atd-forwarder.md`.                     |

Payment runs on **Shopify's hosted checkout** (Shopify Payments / Shop Pay),
and the paid order lives in Shopify, so Flow, the order emails and Order
Printer handle it like any other order. The site never creates or changes a
Shopify product: each order is a draft order of custom line items at the
server's price. Tire data comes from **ATD**. Card details are entered on
Shopify's checkout and never reach this site or its functions. Tire Guru is
retired for payments. Details: `docs/integrations/shopify-checkout.md`.

### Project settings

- **Root Directory: `tiredrop`** (same as above). `api/` sits inside it, so
  Vercel picks the functions up automatically.
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
|                         | fulfillment orders for the ATD forwarder).          |
| `SHOPIFY_CLIENT_ID`     | Instead of the token, for an app made in Shopify's  |
| `SHOPIFY_CLIENT_SECRET` | Dev Dashboard: its client ID and secret. The API    |
|                         | swaps them for a 24-hour token itself.              |
| `SHOPIFY_API_VERSION`   | Optional. Admin API version, default `2026-07`;     |
|                         | must be `2026-07` or newer.                         |
| `ORDER_WEBHOOK_URL`     | Where order requests are POSTed (Formspree, Zapier, |
|                         | an email relay) while online payment is off. Unset, |
|                         | the request is only logged and the shopper is told  |
|                         | it was not sent and to call (954) 773-1896.         |
| `ATD_ORDERING_ENABLED`  | Kill switch for the ATD forwarder. Exactly `true`   |
|                         | lets paid orders be placed with ATD; anything else  |
|                         | (the default) is off.                               |
| `CRON_SECRET`           | Random string (16+ characters). Vercel Cron sends   |
|                         | it as a bearer token; `/api/cron/atd-sweep` answers |
|                         | 401 without it.                                     |
| `ATD_FORWARD_TEST_ORDERS` | Optional, ATD sandbox only: `true` also forwards  |
|                         | Shopify test orders. Never set in production.       |

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
- **ATD forwarder** runs only with Shopify checkout on, ATD live,
  `CRON_SECRET` set and `ATD_ORDERING_ENABLED=true`. The two `ATD_*`
  switches never turn ATD's catalog on by themselves. Until ATD's order
  endpoint is confirmed it places nothing, and `/api/status` says so under
  `issues`. **The 5-minute cron needs Vercel Pro**: Hobby allows one run a
  day and rejects a deploy with a sub-daily schedule. Details and the
  sandbox test plan: `docs/integrations/atd-forwarder.md`.
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
cd tiredrop
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
   Domains, make a subdomain (for example `shop.tiredroponline.com`, CNAME to
   Shopify) or the `myshopify.com` domain primary, then confirm a test
   `invoiceUrl` opens Shopify's checkout.
3. **Add the domain in Vercel** (Settings → Domains): `tiredroponline.com`
   and `www.tiredroponline.com`. Vercel shows the DNS records it wants.
4. **Change DNS in GoDaddy** to exactly what Vercel shows: the apex `A`
   record to Vercel's IP, and `www` as a `CNAME` to Vercel's target. Remove
   the old Shopify `A`/`CNAME` records for those names; leave MX and other
   email records alone. Wait for Vercel to show the domain as valid and the
   certificate as issued.
5. **Flip indexing.** Set `ALLOW_INDEXING = true` in
   `scripts/generate-seo-files.mjs`, rebuild, commit, deploy, and confirm
   `https://tiredroponline.com/robots.txt` no longer says `Disallow: /`.
   Then submit `https://tiredroponline.com/sitemap.xml` in Search Console.
6. **Check the 301s** from the old Shopify URLs (they live in `vercel.json`
   under `redirects`):
   - `/collections/tires` → `/tires`, `/collections/wheels` → `/wheels`
   - `/pages/<x>` → `/<x>` for about, shipping, install, mobile-service,
     auto-service, commercial-tires, locations, contact, reviews, gallery,
     financing, tire-care, terms, privacy, accessibility, find-my-tires,
     tire-size and tire-check
   - `/cart` is the same path on both sites, so it needs no redirect;
     Shopify's `/cart/...` sub-paths go to `/cart`
   - `/policies/privacy-policy` → `/privacy`; every other `/policies/*`
     (terms, refund, shipping) → `/terms`

   Spot-check a few with `curl -sI https://tiredroponline.com/pages/about`
   and look for `301` and the right `location`.
7. **Keep the Shopify plan.** Checkout, the orders, Flow, the order emails
   and Order Printer all run on it. Only the storefront moves to Vercel.

## Free alternative

Cloudflare Pages runs this at $0 with commercial use permitted, where Vercel's
free Hobby tier does not allow it. It needs the same Root Directory setting
and a `public/_redirects` file containing `/*  /index.html  200` in place of
`vercel.json`'s rewrite. It would not run the `api/` functions, so search
would stay on the sample catalog and checkout in request mode. Worth it only
if the $20/month matters.
