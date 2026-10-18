# Product structured data (Product, Offer, shipping, returns)

**Status: built, switched OFF.** With the switch off the built HTML carries no
`Product` or `Offer` node at all. `src/data/products.js` is a sample catalog
(representative tires and wheels, shelf prices, no stock, no SKUs, no photos),
and an Offer is a machine-readable promise of "this price, buyable now". Turn it
on the day the real ATD (or U.S. AutoForce) catalog is what the product pages
show, not before.

## The switches (all in `src/data/seoFlags.js`)

| Constant | Today | What it controls |
| --- | --- | --- |
| `PRODUCT_SCHEMA_ENABLED` | `false` | The one switch. False: no Product/Offer anywhere. True: every `/tires/<slug>` and `/wheels/<slug>` page carries one Product with one Offer. |
| `RETURN_WINDOW_DAYS` | `null` | A whole number of days adds a `MerchantReturnPolicy`; `null` omits it. |
| `PRODUCT_AVAILABILITY_ENABLED` | `false` | Whether the Offer says InStock / LimitedAvailability / OutOfStock, and only when the product record itself reports stock. |

Justin decides all three. The code is `src/data/productSchema.js`
(`productSchema(product, { kind })`, pure, returns `null` when off), wired into
`src/pages/shop/ProductPage.jsx` through the `Seo` component's `schema` prop.

## What it emits when ON

One trimmed example (a sample tire, with `RETURN_WINDOW_DAYS = null`):

```json
{
  "@type": "Product",
  "@id": "https://tiredroponline.com/tires/continental-truecontact-tour-215-60r16#product",
  "name": "Continental TrueContact Tour",
  "url": "https://tiredroponline.com/tires/continental-truecontact-tour-215-60r16",
  "brand": { "@type": "Brand", "name": "Continental" },
  "model": "TrueContact Tour",
  "size": "215/60R16",
  "category": "Tires > All-Season",
  "description": "EcoPlus technology trims rolling resistance ... ",
  "additionalProperty": [{ "@type": "PropertyValue", "name": "Tire Size", "value": "215/60R16" }],
  "offers": {
    "@type": "Offer",
    "url": "https://tiredroponline.com/tires/continental-truecontact-tour-215-60r16",
    "price": 142,
    "priceCurrency": "USD",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": { "@id": "https://tiredroponline.com/#organization" },
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": { "@type": "MonetaryAmount", "value": 0, "currency": "USD" },
      "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "US", "addressRegion": ["AL", "AR", "AZ", "...49 codes"] }
    }
  }
}
```

- **Price** is the shelf price for one tire or wheel, a plain number
  (`142`, `149.9`), USD, over zero. A product with no usable price emits no
  Product at all, because Google rejects a Product with no offer.
- **Shipping** is free (0 USD) to the US, naming the 48 contiguous states and DC
  (read from `src/data/stateList.js`, the same list the `/tires-shipped` pages
  use). Google documents no way to exclude regions in Offer markup; naming the
  served regions is the supported way to leave out Alaska, Hawaii and the
  territories.
- **Left out on purpose:** `deliveryTime` (no handling or transit facts, and the
  house rules ban delivery or arrival dates), `priceValidUntil` (a date nobody
  promises), `aggregateRating` and `review` (the site has no real ones),
  strike-through or sale prices, `returnMethod` and `returnFees` (the terms do
  not state them as fixed).
- **Only when the product record has them:** `sku`, `mpn`, `gtin` (must pass the
  check digit), `image` (https or site-relative photos, made absolute).
  The sample catalog has none of these; the internal `id` is not a SKU.
- **Not on `/tires/p/:sku`.** That route is client-rendered and `noindex`, so
  there is no served HTML for markup to live in. When those pages are
  prerendered (the 2026-10-18 SEO audit, finding 1, on branch
  `preview/seo-audit-2026-10-18`), remove the `reportStock` guard in `ProductDetail`.

## How to turn it on

1. The real catalog is live: ATD prices, real SKUs, product photos.
2. Decide the two questions below.
3. In `src/data/seoFlags.js` set `PRODUCT_SCHEMA_ENABLED = true` (and the other
   two if decided).
4. `npm run build && npm run check:schema`. With the switch on the check
   requires, on every indexable product page: exactly one Product and one
   Offer, a numeric price, USD, NewCondition, the canonical URL, free shipping
   to exactly the 48 states + DC, no `deliveryTime`, a return policy only when
   `RETURN_WINDOW_DAYS` is set (and the same number). It warns, without
   failing, about products with no `image` or `sku`.
5. Treat the **image warning as a blocker.** Google requires an image for
   merchant listings; the sample catalog has none.
6. Check one page in Google's Rich Results Test, then watch Search Console >
   Shopping / Merchant listings for a week.

With the switch off, `npm run check:schema` fails if any Product, Offer or
AggregateOffer node (or schema.org Product/Offer microdata) appears.

## What Justin must decide

1. **The return window.** `src/pages/support/LegalPage.jsx` (section 9) states no
   window yet: it is "set by the distributor the item ships from". Set
   `RETURN_WINDOW_DAYS` only when one number is true for every product and is
   written in the terms, at checkout and on the order confirmation. A test fails
   if the number is set and `LegalPage.jsx` never mentions it. If ATD's windows
   differ by brand, leave it `null`.
2. **Whether to show availability.** The product pages are prerendered, so a
   stock level is frozen into the HTML until the next build while Google reads
   it as current. A stale "InStock" on a sold-out tire is what gets Merchant
   Center accounts suspended. Availability is only recommended. Leave it off
   unless stock in the HTML is refreshed often enough to trust.

## Google Merchant Center: use a custom feed, not the Shopify route

The planned Google & YouTube channel on Shopify (`docs/business/shopify-admin-prompts.md`,
the "once products have UPCs and images" step) pulls products from Shopify
product URLs. This site's `/products` and `/products/:path*` URLs 301 to
`/tires` (`vercel.json`), and the real catalog lives on the site, not in
Shopify. Merchant Center checks that the landing page matches the feed, and a
redirected landing page is a mismatch. Prefer a **custom feed** (a scheduled
file built from the same ATD data, each item linking to its real
`/tires/<slug>` page, price and availability refreshed daily) over the Shopify
route. The structured data here is the page-level half; the feed is the
product-level half, and the two must agree on price and availability.

Installation stays a separate product, never bundled into a tire item
(Merchant Center rejects tires bundled with a service).

## Known gaps to close before it is worth switching on

- **Photos.** Required by Google; the sample catalog has none.
- **Name uniqueness.** `name` is brand + model, as specified. The real catalog
  will list one model in many sizes; each page then shares a name and differs
  only in `size`, `url` and `sku`. If Search Console flags duplicates, append
  the size in `productSchema.js` (the page title already does).
- **Category** is a readable path (`Tires > All-Season`), not a Google product
  taxonomy ID. The Merchant Center feed should carry the real taxonomy value.

## Tests and checks

- `npm run test:data` runs `src/data/productSchema.test.mjs`: switch off emits
  nothing; switch on emits the valid shape; no return policy while the window
  is null; never a rating or review; prices are numbers Google accepts; no
  delivery time; house-rule wording.
- `npm run check:schema` (after a build) validates the built pages as above.
