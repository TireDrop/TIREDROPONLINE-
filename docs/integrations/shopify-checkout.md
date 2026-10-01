# Shopify checkout (draft orders)

**Status: built and unit-tested with a mocked Shopify. Never run against a
real store from this repository.** Checkout stays in REQUEST mode until the
`SHOPIFY_*` variables are set **and** ATD is live.

The Vercel site is the storefront: it searches ATD, shows live prices and
matches the Shopify theme. Shopify takes the payment and keeps the order.
The site never creates, reads or changes a Shopify product.

## How it works

1. The shopper checks out on the Vercel site (`POST /api/checkout`).
2. The server validates the order and **prices every line itself**
   (`api/_lib/catalog.js` → `api/_lib/atd.js`: ATD dealer cost × (1 +
   `PRICE_MARKUP_PCT`/100) + `FREIGHT_PER_TIRE`). Any price the browser sent
   is ignored.
3. For `ship` and `pickup` orders, `api/_lib/shopify.js` calls the Admin
   GraphQL API `draftOrderCreate` with **custom line items**: title, SKU,
   the server's unit price, quantity, `requiresShipping: true`,
   `taxable: true`, and `Size` / `Brand` line attributes. No `variantId`, so
   nothing in the Shopify catalog is touched.
4. The API answers `{ mode: "redirect", url: <draftOrder.invoiceUrl>,
   orderRef, total }`. The checkout page shows "Taking you to our secure
   Shopify checkout…" and sends the browser there
   (`window.location.assign`).
5. The shopper pays on Shopify's checkout (Shopify Payments / Shop Pay).
   Shopify turns the draft into a real order, so Flow, the order emails and
   Order Printer run as for any other order.

**Mobile install** is never paid through Shopify's checkout. It stays an
order request, because the van is booked and the install quoted on the call.

**Order requests** (every checkout while ATD is not live, and every mobile
install) do not redirect anywhere. They are recorded in Shopify as a lead on
the customer, which Shopify Flow emails to info@, and as a **request draft**
with no invoice sent; see "Order-request drafts" below and
`docs/integrations/website-leads.md`.

## What the draft order carries

The mutation (validated against the Admin schema, `DraftOrderInput`, 2026-07):

```graphql
mutation draftOrderCreate($input: DraftOrderInput!) {
  draftOrderCreate(input: $input) {
    draftOrder { id name invoiceUrl }
    userErrors { field message }
  }
}
```

`variables.input`:

| Field | Value |
| --- | --- |
| `email` | the shopper's email |
| `phone` | `+1XXXXXXXXXX`, only when it is a valid North American number (left out otherwise, so a bad phone cannot sink the order) |
| `lineItems[]` | `{ title, sku, quantity, originalUnitPriceWithCurrency: { amount: "114.82", currencyCode: USD }, requiresShipping: true, taxable: true, customAttributes: [Size, Brand] }` |
| `shippingAddress` | ship orders only: first/last name, `address1`, `address2`, `city`, `provinceCode`, `zip`, `countryCode: US`, `phone` |
| `shippingLine` | `{ title, priceWithCurrency: { amount: "0.00", currencyCode: USD } }`: title `Free Shipping` for ship, `Pickup at Extreme Tires (Sunrise, FL)` for pickup |
| `customAttributes` | `Delivery` = `Ship to my address` or `Ship to store for install (Extreme Tires, Sunrise)`; `Source` = `TireDrop live (Vercel)`; `Order ref` = the TireDrop order reference; then, when the shopper gave a vehicle or size (`api/_lib/fitmentAttrs.js`): `Vehicle`, `Size source`, `Front size`, `Rear size`, `Fitment` (OK / STAGGERED / CHECK / UNCONFIRMED / NO TIRES, checked against the priced lines). Tags add `fitment-check`, `staggered`, `size-scanned` or `fitment-unconfirmed` (Flow: shopify-admin-prompts.md #26) |
| `tags` | `vercel-live`, plus `ship-to-home` or `ship-to-store` |
| `note` | order reference, customer name and phone, delivery choice, customer notes |
| `acceptAutomaticDiscounts`, `allowDiscountCodesInCheckout` | both `false`: no discounts or coupons on these orders |

The two `Delivery` strings are the exact values the Shopify theme's cart and
product sections write (`shopify/sections/td-cart.liquid`,
`td-product.liquid`) and that the Flow workflows and the order-confirmation
block key on. Change them in all places or none.

## Order-request drafts

`buildRequestDraftInput` in `api/_lib/shopify.js` builds them from the same
function as the checkout draft, with these differences:

| Field | Request draft |
| --- | --- |
| `tags` | `order-request`, `vercel-live`, plus `ship-to-home`, `ship-to-store` or `mobile-install` |
| `note` | starts "Request only — confirm price and availability, then Send invoice."; mobile adds "add the install charge quoted on the call before you send the invoice"; every one says "Email UNVERIFIED (typed on the website): confirm it with the customer by phone before you send the invoice." |
| `purchasingEntity` | `{ customerId }` only when this request created the customer; never set for an existing customer, since nobody verified the email |
| `customAttributes` | same three; `Delivery` = `Mobile install at my address` for mobile |
| `shippingAddress` | ship: the shipping address; mobile: the service address; pickup: none |
| `shippingLine` | same free line for ship and pickup; **none** for mobile |

Discounts stay off. **No invoice is sent**: `draftOrderCreate` sends none and
the API never calls `draftOrderInvoiceSend`. The shop opens the draft in
Shopify → Orders → Drafts, confirms the price and availability, then clicks
**Send invoice**; the customer pays on Shopify's checkout. Because the draft
carries `vercel-live`, a paid request is picked up by the ATD forwarder once
that is on, like any checkout order; a mobile one has no `Delivery` value
the forwarder knows, so it is tagged `atd-failed` for the shop instead of
being sent to ATD.

**Never sent:** dealer cost. The priced lines carry only sku, title, brand,
size, quantity, retail price and line total; a test checks that the cost
figure appears nowhere in the request.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `SHOPIFY_STORE_DOMAIN` | The store's `xxx.myshopify.com` domain. A pasted `https://…/` is accepted and trimmed; any other domain is refused. |
| `SHOPIFY_ADMIN_TOKEN` | Admin API access token (`shpat_…`) from an **existing** custom app created in the Shopify admin. |
| `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET` | Instead of the token, for an app created in Shopify's **Dev Dashboard**. The API exchanges them for an access token with the client credentials grant (`POST https://{domain}/admin/oauth/access_token`) and reuses it until shortly before its 24-hour expiry. |
| `SHOPIFY_API_VERSION` | Optional. Default `2026-07`, the version the input was checked against. Must look like `YYYY-01/04/07/10` and be `2026-07` or newer. |

**Why two ways to authenticate:** Shopify's docs now say new admin-created
custom apps can no longer be made; existing ones keep working. A new app
comes from the Dev Dashboard, which issues a client ID and secret rather
than a permanent token, and the client credentials grant only works when the
app and the store are in the same Shopify organization.

**Scopes for the app:**

| Scope | Used by |
| --- | --- |
| `write_draft_orders` | checkout: creates the draft order; order requests: creates the request draft |
| `read_draft_orders` | checkout: the schema check listed it; add it if Shopify refuses the call without it. Track My Order (`POST /api/track`): finds a `TD-` order request's draft |
| `read_orders` | the ATD forwarder: finds paid orders. Track My Order (`POST /api/track`): reads the order by number and email |
| `read_all_orders` | optional: Track My Order for orders older than 60 days (without it they read as not found) |
| `write_orders` | the ATD forwarder: order tags, note and metafields. The orders/paid webhook: the `needs-scheduling` tag on install orders (`docs/integrations/install-scheduling.md`) |
| `read_merchant_managed_fulfillment_orders` | the ATD forwarder: reads the order's fulfillment orders |
| `write_merchant_managed_fulfillment_orders` | the ATD forwarder: creates the fulfillment with ATD's tracking |
| `read_customers` | the newsletter (`POST /api/newsletter`), the website forms (`POST /api/forms`) and order requests: find an existing customer by email or phone |
| `write_customers` | the newsletter: creates the customer, sets email marketing consent, adds tags. Forms and order requests: create the customer (never with consent), write the note and the `tiredrop.last_lead` metafield, remove and add tags |

No product scopes are needed. Checkout alone needs only the draft-order
scopes; the four order and fulfillment scopes are for the ATD forwarder
(`docs/integrations/atd-forwarder.md`), and the two customer scopes are for
the newsletter sign-up form in the site footer (see
"Newsletter sign-up" below) and for website leads
(`docs/integrations/website-leads.md`). Changing an app's scopes needs the
app to be re-approved (a new token for an admin-created custom app, or a
new version release for a Dev Dashboard app).

**Fail-loud rules** (same as ATD): with no `SHOPIFY_*` variables Shopify is
off and checkout is an order request. Setting any of them turns Shopify on.
Then a missing domain, a missing or half-set credential, both credentials at
once, a non-`myshopify.com` domain or a bad API version makes checkout answer
**503** naming the problem, and `/api/status` lists it under `issues`. With
Shopify configured but ATD still in sample mode, checkout stays in request
mode (no card is charged against sample prices) and `/api/status` says so.

`/api/status` reports `shopify: "live" | "off"`,
`checkout: "shopify" | "request"`, and `forms: "on" | "off"` (website forms
and order requests recorded in Shopify; on whenever Shopify is configured).

## Newsletter sign-up

`POST /api/newsletter` (`api/newsletter.js`, `api/_lib/newsletter.js`) does
what the Shopify theme's pop-up form did, through the same app. On the React
site it is fed by the inline "TireDrop emails" form in the footer
(`src/components/layout/NewsletterSignup.jsx`, `source: "footer"`); there is
no pop-up. Validated against the Admin schema; never run against a real
store from this repository.

1. `customerCreate(input: { email, emailMarketingConsent: { marketingState:
   SUBSCRIBED, marketingOptInLevel: SINGLE_OPT_IN }, tags: ["newsletter",
   <source>, "vercel"] })`, where `<source>` is `footer` for the footer form
   (the API also still accepts `popup`).
2. If Shopify answers the userError "Email has already been taken":
   `customerByIdentifier(identifier: { emailAddress })` finds the customer,
   `customerEmailMarketingConsentUpdate` sets SUBSCRIBED / SINGLE_OPT_IN
   (skipped when `defaultEmailAddress.marketingState` is already
   SUBSCRIBED, so the original opt-in date stands), and `tagsAdd` adds the
   three tags without replacing existing ones.

The shopper gets the same `{ ok: true }` either way, so the endpoint cannot
be used to learn whether an email has an account. `/api/status` reports
`newsletter: "on"` whenever Shopify is configured, and the footer sign-up
form renders only then. No discount or coupon is attached to a sign-up.

## Failure behaviour

- Timeout 8 s per attempt. **One** retry, only on a network error, a
  timeout, HTTP 429 or 5xx. Other 4xx are not retried. A retry after a lost
  response can leave one extra unpaid draft order in Shopify; drafts charge
  nothing and can be deleted.
- `userErrors`, top-level GraphQL `errors`, or a missing or non-https
  `invoiceUrl` throw `ShopifyCheckoutError`. The API answers 502 and logs
  Shopify's messages; it never builds or guesses a checkout URL. The shopper
  sees that the order did not go through and is pointed at the phone.
- `shopifyGraphQL(cfg, query, variables)` in `api/_lib/shopify.js` is the
  shared transport (auth, timeout, retry, error handling) for any later
  Shopify call.

## Tax, fees and prices

`taxable: true` on every line lets Shopify's checkout calculate sales tax.
Florida's new-tire fee is **not** added by this code; decide in Shopify
whether and how to charge it. Shipping is always a $0.00 line. The 7% sales-tax
line in the site's order summary is the site's own figure; Shopify's
checkout shows the tax it actually charges.

## What Spark Shipping does and does not see

The paid order is an ordinary Shopify order, but its lines are **custom line
items**, with no product or variant behind them. Spark Shipping (or any
drop-ship connector) routes orders to a supplier by matching line items to
products or variants it has synced. **It may not route custom line items at
all.** Until that is confirmed with Spark, treat ATD order placement for
these orders as needing their own path to ATD: the SKU on each line is the
ATD SKU the site priced, and the order carries the shipping address and
`Delivery` attribute needed to place it. That path is the **ATD forwarder**
(`docs/integrations/atd-forwarder.md`): a Vercel Cron sweep that places
paid `vercel-live` orders with ATD and brings tracking back, once ATD's
order endpoint is confirmed and `ATD_ORDERING_ENABLED=true`. Until then,
place them by hand.

## Before going live

1. Use a Shopify development store first, then the live store.
2. Check on a real test order: the `Delivery`, `Source` and `Order ref`
   attributes and the `vercel-live` tag appear on the finished order (they
   are set on the draft; confirm they carry over), the Flow workflow routes
   ship-to-store correctly, and the confirmation email shows the right block.
3. **Pickup orders:** the draft has no shipping address (the tires ship to
   the shop). Check what Shopify's checkout asks a pickup shopper for, since
   every line has `requiresShipping: true`.
4. Before DNS moves to Vercel, change Shopify's primary domain away from
   tiredroponline.com: Shopify builds `invoiceUrl` on the store's primary
   domain, so check where a test link points (see the cutover checklist in
   `docs/ops/deploy.md`).
5. When Shopify retires `2026-07`, bump `SHOPIFY_DEFAULT_API_VERSION` and
   `SHOPIFY_MIN_API_VERSION` in `api/_lib/config.js` after re-checking
   `DraftOrderInput`.
