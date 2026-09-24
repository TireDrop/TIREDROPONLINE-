# TireDrop — tiredroponline.com

National tire and wheel store. Tires are drop-shipped from distributors to
anywhere in the continental US, or delivered free to the Extreme Tires shop in
Sunrise, FL and installed there.

**Powered by Extreme Tires** — the parent business, fitting tires in South
Florida since 2007. TireDrop is its national storefront.

> This project is self-contained. It shares a repository with, but is
> completely independent of, the unrelated `cannavibe` app at the repo root.

---

## Quick start

```bash
cd tiredrop
npm install
npm run dev            # local dev server
npm run build          # production build to dist/
npm run build:preview  # build for a static host with no SPA rewrite
npm run preview        # serve the built app
npm run lint           # catches imports that a build cannot
npm run audit:mobile   # phone-width audit across every route
```

## Stack

| Concern    | Choice                                         |
| ---------- | ---------------------------------------------- |
| Build      | Vite 5                                         |
| UI         | React 18                                       |
| Routing    | react-router-dom 6 (real URLs, not state)      |
| Styling    | Tailwind CSS 3 + a small component layer       |
| Icons      | lucide-react                                   |
| Cart state | React context + `localStorage`                 |
| Hosting    | Vercel (`vercel.json` carries the SPA rewrite) |
| Lint       | ESLint 9, scoped to `no-undef` and hook rules  |

---

## The model

```
Customer buys on TireDrop
        ↓
   payment taken
        ↓
 ┌──────┴───────┐
 ↓              ↓
order to     order to
distributor  Tire Guru (the shop's register)
 ↓
ships to the customer  ── or ──  ships free to the Sunrise shop → installed
```

Two fulfillment choices at checkout:

1. **Ship to my address** — anywhere in the continental US.
2. **Ship free to the store** — delivered to Sunrise, then fitted. South
   Florida only, and the reason a local customer picks TireDrop over a
   national-only competitor.

Mobile van installation is a further option for customers inside
`BUSINESS.installArea`.

Tires are priced and sold **in sets of four**, which is how every large tire
retailer prices them and how a shopper compares one site against another.
Up to four models can be queued for side-by-side comparison; the picks live in
`CompareContext` and persist through `localStorage`, so a refresh does not
empty the table.

---

## Project structure

```
tiredrop/
├── public/brand/            Logo artwork (WebP + PNG fallback) and favicon
├── public/robots.txt        Generated — do not hand-edit
├── public/sitemap.xml       Generated — do not hand-edit
├── docs/                    Meeting brief and project documents
├── scripts/mobile-audit.mjs Phone-width audit across every route
├── scripts/generate-seo-files.mjs
│                            Writes robots.txt + sitemap.xml from the router
├── src/
│   ├── main.jsx             Entry — router + cart provider
│   ├── App.jsx              All routes in one place
│   ├── index.css            Design system (tokens → component classes)
│   │
│   ├── data/                Single source of truth. No page invents facts.
│   │   ├── business.js      Brand, phone, shop, hours, nav, footer, areas
│   │   ├── services.js      Service catalog (mobile vs in-shop)
│   │   ├── products.js      Tire + wheel catalog, vehicle fitment data
│   │   ├── pricing.js       Set-of-four maths, rebates, delivery estimates
│   │   └── tireRatings.js   Performance scores derived from published specs
│   │
│   ├── context/
│   │   ├── CartContext.jsx
│   │   └── CompareContext.jsx
│   │
│   ├── components/
│   │   ├── layout/          Header, Footer, Logo, MobileCallBar
│   │   ├── ui/              Seo, Section, PageHero, Breadcrumbs, Badge,
│   │   │                    Stars, Accordion, EmptyState, BrandLogo
│   │   └── shop/            ProductArt, ProductCard, Filters, SearchPanel
│   │
│   └── pages/
│       ├── HomePage.jsx · ShippingPage.jsx · InstallPage.jsx
│       ├── NotFoundPage.jsx
│       ├── shop/            Tires, Wheels, Product, Commercial, Cart,
│       │                    Checkout, Coupons
│       ├── services/        MobileService, AutoService, ServiceDetail, Schedule
│       └── support/         About, Locations, Contact, Reviews, Financing,
│                            TireCare, Gallery, Sitemap, Legal
```

### Why this shape

- **`src/data/` is authoritative.** The phone number, the shop address and the
  hours live in exactly one file, so they cannot drift between the header, the
  footer and the contact page.
- **Navigation is generated.** `NAV` and `FOOTER_COLUMNS` drive the header, the
  mobile drawer, the footer and the HTML sitemap page.
- **The design system lives in `index.css`**, composed from tokens defined in
  `tailwind.config.js`.
- **Tires are priced in fours.** `data/pricing.js` owns that arithmetic, so the
  card, the product page, the compare table and the cart cannot disagree about
  what a set costs.
- **Performance scores are derived, never invented.** `data/tireRatings.js`
  computes them from specs the tire already publishes — the UTQG grades, the
  speed rating, the tread depth, the load range, the 3PMSF certification and
  the mileage warranty. Where a spec genuinely does not exist — winter tires
  carry no UTQG treadwear grade, commercial LT tires are graded on another
  scale — the axis returns `null` and the UI prints "Not rated" instead of a
  number. Nothing here claims we road-tested anything.

---

## Design system

| Token         | Hex       | Use                               |
| ------------- | --------- | --------------------------------- |
| `ink`         | `#0A1628` | Deep navy, primary dark surface   |
| `steel`       | `#122135` | Raised dark surface               |
| `graphite`    | `#24354C` | Borders on dark                   |
| `smoke`       | `#667085` | Muted body copy                   |
| `fog`         | `#F3F6FB` | Light page background             |
| `bone`        | `#FFFFFF` | Cards, light surfaces             |
| `drop`        | `#0B5FFF` | **Primary action / brand accent** |
| `dive`        | `#0A4FD8` | Accent hover                      |
| `sky`         | `#E6EFFF` | Tinted surface, highlights        |
| `extremeRed`  | `#D40C10` | Parent-brand references only      |
| `extremeDeep` | `#A40104` | Parent-brand references only      |
| `amber`       | `#F5A623` | Ratings, savings badges           |

Blue reads calmer and more trustworthy than red for a national online store,
which is why the brand moved to it. `drop` clears WCAG AA against white text at
5.13:1. Extreme Tires' red is kept **only** for the "Powered by Extreme Tires"
lockup — it is not a UI accent here.

Type: **Barlow Condensed** (`font-display`) for headings, uppercase.
**Inter** (`font-sans`) for body copy.

---

## Routes

| Path                                            | Page                                |
| ----------------------------------------------- | ----------------------------------- |
| `/`                                             | Home                                |
| `/tires`, `/tires/:slug`                        | Tire catalog + product detail       |
| `/wheels`, `/wheels/:slug`                      | Wheel catalog + product detail      |
| `/commercial-tires`                             | Fleet tires + quote request         |
| `/compare`                                      | Side-by-side tire comparison        |
| `/cart`, `/checkout`                            | Cart and checkout                   |
| `/coupons`                                      | Deals and rebates                   |
| `/shipping`                                     | How shipping works                  |
| `/install`                                      | Ship to store & install             |
| `/mobile-service`                               | Mobile installation (South Florida) |
| `/auto-service`                                 | Shop services                       |
| `/services/:slug`                               | Individual service                  |
| `/schedule`                                     | Booking form                        |
| `/about` `/locations` `/contact`                | About & support                     |
| `/reviews` `/financing` `/tire-care` `/gallery` | Support                             |
| `/sitemap`                                      | HTML sitemap (generated from nav)   |
| `/terms` `/privacy` `/accessibility`            | Legal documents                     |
| `*`                                             | 404                                 |

---

## Mobile

`npm run audit:mobile` drives Chromium over every route at phone width and
reports horizontal overflow, tap targets under the WCAG 2.5.8 minimum of 24px,
text below 11px, and console errors. Screenshots land in `/tmp/mobile-audit`.

```bash
npm run build:preview
npx vite preview --port 4173 &
AUDIT_WIDTH=390 npm run audit:mobile
```

`AUDIT_WIDTH` accepts any width (360, 390 and 414 are the useful ones);
`AUDIT_BASE` points it at a different server. Run one audit at a time — two
against the same preview server contend for it and the loser reports a route
as broken when the site is fine, so the script takes a lock and refuses to
start alongside another.

Currently **29/29 routes clean at 360, 390 and 414px.**

`npm run lint` is the other gate, and it exists for one reason: a Vite build
cannot see an identifier that is used but never imported, so it compiles
happily and the page throws on mount and renders blank. `no-undef` catches
that.

---

## Crawling, metadata and the bundle

**Crawling is switched off, deliberately.** `public/robots.txt` currently says
`Disallow: /` because the site has not launched and tiredroponline.com still
resolves to the previous NetDriven site. The only reachable deployment is a
Vercel preview, and getting a half-finished storefront with draft legal pages
indexed under this brand — on a `*.vercel.app` hostname nobody wants ranking —
is a hole you climb out of slowly. `vercel.json` also sends
`X-Robots-Tag: noindex` on `*.vercel.app` hosts only, so that half lifts by
itself when a custom domain is attached.

> **Launch step.** Set `ALLOW_INDEXING = true` at the top of
> `scripts/generate-seo-files.mjs`, rebuild, commit the regenerated
> `public/robots.txt`, and check `https://tiredroponline.com/robots.txt` before
> submitting the sitemap in Search Console.

**robots.txt and sitemap.xml are generated, never hand-written.** The route list
comes out of `src/App.jsx` and is expanded from `products.js` and `services.js`,
so adding a `<Route>` grows the sitemap and deleting one removes the URL. It
runs on every `vite build` via a plugin in `vite.config.js`, or on its own:

```bash
node scripts/generate-seo-files.mjs   # 69 URLs at the last run
```

**Per-page head tags come from one component.** `Seo` in `components/ui/` owns
the title, the meta description, the canonical, Open Graph, the Twitter card,
`robots`, and the JSON-LD graph (`Organization`, `WebSite`, `WebPage`, plus
`AutoPartsStore`/`AutoRepair` on shop pages, `Product` on product pages and
`Service` on service pages). Two things it will never emit: review or rating
markup while `GOOGLE_PROFILE.reviewsAreReal` is false, and `Offer` price and
availability while the catalog is representative rather than live distributor
inventory. Both gates are commented in the file.

**Route-level code splitting.** Every page except the home page is a
`React.lazy` import in `App.jsx`. Cold home-page load measured at 290 kB over
the wire, 91 kB of it JavaScript — down from 412 kB and 209 kB when everything
shipped in one bundle.

Full findings, measurements and what is still open:
[`docs/technical-audit.md`](docs/technical-audit.md).

---

## Before go-live

All of these need the client or a supplier:

1. **Distributor integration.** ATD requires a functional, approved site before
   issuing API credentials. U.S. AutoForce is the second source and carries the
   brands ATD lost in 2025. Until both are wired, `data/products.js` is a
   representative catalog, not real inventory.
2. **Rebates are illustrative.** The five in `data/products.js` show the UI
   working. Real promotions come from the distributor feeds and expire — do not
   publish these.
3. **Delivery dates are estimated,** not quoted. `data/pricing.js` models a 2pm
   distributor cutoff and 2–4 business days in transit. Replace it with the
   distributor's committed date once the API is live.
4. **No product photography.** Tires and wheels render as generated SVG art in
   `components/shop/ProductArt.jsx`.
5. **No payment processing.** Checkout collects the order and says a team member
   will call to confirm. Wire a real processor before taking money.
6. **Forms have no backend.** Contact, quote, booking, financing and review
   forms validate and confirm, but nothing is sent.
7. **Reviews are illustrative** and structured-data markup is deliberately off
   until real ones exist.
8. **Legal pages are drafts** and need the client's counsel — the business is
   now a national retailer, which changes the terms materially.
9. **Social links are placeholders** in the footer.
10. **No TireDrop email address yet.** `BUSINESS.email` is `null` and every page
    steers to the phone or the contact form until one exists.
11. **Crawling is disabled.** `ALLOW_INDEXING` in
    `scripts/generate-seo-files.mjs` is `false` and `robots.txt` says
    `Disallow: /`. Flip it on launch day — see _Crawling, metadata and the
    bundle_ above. Nothing will rank until you do.
