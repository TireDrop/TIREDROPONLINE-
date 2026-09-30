> **Why retired:** online payment moved to Shopify's hosted checkout (draft orders) on 2026-09-28, so Tire Guru is no longer the payment path. Kept as the historical record. Tire Guru's current role, install scheduling, is in [../integrations/install-scheduling.md](../integrations/install-scheduling.md).

# Tire Guru integration (payments and orders)

> **RETIRED FOR PAYMENTS (2026-09-28).** Tire Guru is no longer the payment
> path and checkout does not call it. Online payment is Shopify's hosted
> checkout through a draft order: see
> [shopify-checkout.md](../integrations/shopify-checkout.md). `api/_lib/config.js` ignores
> any `TIREGURU_*` variables and lists them under `issues` in `/api/status`
> so they can be removed. `api/_lib/tireguru.js` is kept for reference only.
> Everything below is the historical record of the Tire Guru plan.

**Status (historical): not connected. Checkout runs in REQUEST mode.** No Tire Guru
credentials or API documentation exist yet. The adapter in
`api/_lib/tireguru.js` prepares two paths, API and hosted link, but **every
field name, endpoint and auth detail in it is a placeholder** marked
`TODO(confirm with Tire Guru docs)`.

## What checkout does today

`POST /api/checkout` always validates the order and **prices every line on the
server**. Client-sent prices are ignored. Shipping is free to the 48
contiguous states and DC; any other state is rejected for `ship` with a clear
error. `pickup` is free ship-to-store at Extreme Tires, 7712 West Oakland Park
Blvd, Sunrise, FL 33351. `mobile` is van install at the customer's address: it
needs an FL address in one of the install-area cities in
`src/data/business.js` (anything else is a 400) and is **always** request
mode, whatever `checkout` says, because the van is booked and the install is
quoted on the call. Its response adds `delivery: "mobile"`,
`installNote: "Install quoted on the call"` and `serviceAddress`; `total` is
the tires only.

What happens next depends on `checkout` in `/api/status`:

| `checkout` | When | Response |
| --- | --- | --- |
| `request` | Tire Guru is off, **or** ATD is still in sample mode | `{ mode: "request", orderRef, total, delivered, paid: false, ... }`. No card is charged. If `ORDER_WEBHOOK_URL` is set, the order is POSTed there as JSON (Formspree-friendly: `_subject`, `email`, a plain-text `message` marked NOT PAID, plus the structured `order`) and `delivered: true`. If the variable is not set, the order is written to the function log only and `delivered: false`, so the UI can say plainly that it was not sent. If the webhook is set but fails, the response is a **502** with `delivered: false`. |
| `tireguru` | Tire Guru is configured **and** ATD is live | `{ mode: "redirect", url, orderRef, total }`, where `url` is a Tire Guru payment page. |

**Why payment waits for ATD:** until ATD is live, prices come from the
representative sample catalog and stock is unknown. Taking real payment
against that would charge for tires nobody has confirmed. `/api/status` lists
this under `issues` when Tire Guru is set but ATD is not.

`total` is the tire subtotal. Sales tax and Florida's new-tire fee are **not**
computed. Tire Guru, or the shop, adds them when taking payment.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `TIREGURU_API_BASE` | API base URL (https). API path only. |
| `TIREGURU_API_KEY` | API key. API path only. |
| `TIREGURU_STORE_ID` | Store or location ID for Extreme Tires. API path only. |
| `TIREGURU_CHECKOUT_URL` | Hosted-link fallback: a payment page URL. It may contain `{orderRef}`, `{total}`, `{email}`, `{name}` and `{phone}`, which are filled in and URL-encoded. |
| `ORDER_WEBHOOK_URL` | Where order requests go in request mode (https, JSON POST). |

**Fail-loud rules:** setting only some of the three `TIREGURU_API_*` /
`TIREGURU_STORE_ID` variables makes checkout return **503** naming the missing
ones. A non-https URL does the same. With all three set, the API path is used,
and it returns **501** until `ENDPOINTS.createCheckout` is filled in from
Tire Guru's docs. The code never sends the API key to a guessed URL. Creating
a checkout is **not retried**, because it is not known to be idempotent.

## What the adapter expects (to confirm)

In `api/_lib/tireguru.js`:

| Function | What it must become | Placeholder today |
| --- | --- | --- |
| `ENDPOINTS.createCheckout` | Path that creates a hosted checkout or payment session | `null` → 501 |
| `tireGuruAuthHeaders` | The real auth scheme | `Authorization: Bearer <key>` |
| `buildCheckoutRequest` | Real body: customer, lines, fulfillment, store, return/cancel URLs | `storeId`, `reference`, `customer`, `fulfillment`, `lines[{sku, description, quantity, unitPrice}]`, `total`, `notes` |
| `extractCheckoutUrl` | Where the payment URL sits in the response | `checkoutUrl`; anything else throws. Must be https. |
| `buildHostedLinkUrl` | Which query parameters a hosted link accepts | template placeholders, see above |

**Warning about the hosted-link path:** if the link carries the amount in the
URL (`{total}`), a shopper could edit it. Use the link path for payment only if
Tire Guru either ignores a URL amount or lets the shop verify each payment
against the `orderRef` before fulfilling.

## Still unconfirmed

- Whether Tire Guru has a public or partner API at all.
- Whether payment is a hosted checkout page, a payment link, or an embeddable
  form. An embeddable form would change the frontend; it would not be a
  redirect.
- How a web order lands in Tire Guru: as a work order, an invoice or an
  appointment. How ship-to-home differs from install at the shop.
- How we learn that an order was paid or cancelled. **Nothing on the site
  marks an order paid today.** A paid/cancelled webhook would need a new
  `api/tireguru-webhook.js` with signature verification.
- PCI scope. A redirect to a hosted page keeps card data off TireDrop entirely
  (typically SAQ A). An embedded form may not.
- Tax and fee calculation (sales tax by destination, Florida tire fee).

## Questions for the Tire Guru rep

1. **API:** Is there a public or partner API for web orders and payments? Where
   are the docs, and is there a sandbox? What is the auth scheme, and how are
   keys scoped to a store (`TIREGURU_STORE_ID`)?
2. **Hosted checkout vs. embedded form:** Can we create a hosted checkout or
   payment link per order from our server and redirect to it? Or is payment an
   embeddable form or iframe? Can we set the amount, line items and our order
   reference, and can they be tampered with in the URL?
3. **Return URLs:** Can we set success and cancel return URLs? Does the return
   carry a signed payment status or only a reference?
4. **Orders and installs:** When a web order is paid, what gets created in Tire
   Guru: an invoice, a work order, an appointment? Can one order be
   ship-to-home (no install) or ship-to-store and install at Extreme Tires
   Sunrise? Can we attach an install appointment time?
5. **Webhooks:** Can Tire Guru notify us when a payment succeeds, fails, is
   refunded or is cancelled? What do the payloads look like, and how are they
   signed?
6. **PCI scope:** With your hosted page or form, does card data ever touch our
   servers or pages? What SAQ level does that leave us at?
7. **Tax and fees:** Does Tire Guru calculate sales tax by destination and add
   Florida's new-tire fee? Should the amount we send be pre-tax?
8. **ATD inventory:** Does Tire Guru already connect to ATD (catalog, pricing,
   stock or ordering)? Could Tire Guru serve ATD inventory to our site, so we
   integrate once instead of twice? Can a paid order automatically place the
   ATD Ship to Home order?
9. **Customers:** Do we need to create a customer record before checkout, or
   does checkout create one? How are duplicates matched?
10. **Fees and payouts:** What are the processing fees, payout timing and
    chargeback handling for online (card-not-present) payments?
