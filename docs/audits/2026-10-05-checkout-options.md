# Checkout options: taking payment online with an install slot

Written 2026-10-05 by Atlas (research). Branch `preview/wave2-checkout-options`.
Docs only: no code, no Shopify, no accounts, no money. Wave 2, competitor gap 1:
other online sellers close the sale on the page; TireDrop checkout is request-only.

---

## One-page summary

**Where we are.** The checkout page collects the order, the server prices every
line itself, and the customer gets "Order Request Received. It is not paid yet."
The shop calls to confirm fitment and price, opens the order's **Shopify draft
order**, clicks **Send invoice**, and the customer pays on Shopify's hosted page.
So Shopify already takes the money, and Shopify Payments is already switched on
(checklist: "payouts daily, test mode OFF"). What is missing is the last step on
the page, not a payment processor.

**A second path is already built and asleep.** If Shopify and ATD are both live,
the same endpoint skips the request and sends the customer straight to Shopify's
pay page ("pay at order"). It has never run against the real store, and it stays
off until ATD is live (ATD is still reviewing the site, so this is outside our
control for now). Mobile install never takes this path: the van is booked and the
install priced on the call.

**Options compared** (details in section 4):

| Rank | Option | Build | Verdict |
|---|---|---|---|
| 1 | Shopify invoice from the draft order, **pay after the shop confirms fitment** | S (copy and a shop routine, no new code needed to start) | **Recommended first step** |
| 2 | Shopify pay-at-order through the draft-order redirect that already exists | S to turn on, but blocked until ATD is live | Recommended second step, only for exact-fit orders |
| 3 | Shopify native cart handoff (Storefront API) | L | Not recommended: needs every tire and wheel as a Shopify product |
| 4 | Stripe or Square outside Shopify | L | Not recommended: orders would bypass Shopify, so the webhook, install tags, ATD forwarder and `/track` would all need rebuilding, and the 12-function limit is full |

**Recommendation.** Stay on Shopify. Step 1 now: make "pay after we confirm fitment"
the promised, visible flow and speed up the shop's Send-invoice routine. Step 2
once ATD is live: pay-at-order for orders whose fitment check is exact, keep
everything else on Step 1. Step 3: measure, then automate the invoice send.

**Not verified in this session.** Every payment provider's fees, dispute fees and
Stripe/Square product details: their sites are blocked from this sandbox. No fee
number appears in this brief. Section 7 lists a read-only Chrome prompt to get
Shopify's own rates from Justin's admin.

---

## 1. How checkout works today, step by step

Sources: `src/pages/shop/CartPage.jsx`, `CheckoutPage.jsx`, `src/context/CartContext.jsx`,
`api/checkout.js`, `api/_lib/orders.js`, `shopify.js`, `config.js`, `docs/integrations/shopify-checkout.md`,
`install-scheduling.md`, `webhooks.md`. All read in full or in the relevant parts.

### What the customer sees

1. **Cart** (`/cart`). Lines with quantity and an optional "install at the shop"
   toggle per line. Totals are parts plus install, **before tax**. The tax row says
   "Calculated at checkout". Shipping shows Free. The cart lives in the browser
   (`localStorage`, key `tiredrop.cart.v1`), not on a server.
2. **Checkout** (`/checkout`), four steps: **Contact, Delivery, Vehicle, Review.**
   Delivery has three choices:
   - **Ship to my address:** free, 48 contiguous states and DC.
   - **Free ship-to-store at Extreme Tires, Sunrise:** the customer also picks a
     *preferred* day (at least 3 days out, not Sunday) and time window. The page says
     plainly it is a preference, not a booking.
   - **Mobile install at my address:** Miami-Dade, Broward and Palm Beach ZIPs only.
     The install price is "quoted on the call".
3. **Review.** The customer ticks "I understand this order is a request" and
   presses **Place Order Request** (or **Send Booking Request** for mobile).
   Small print: "Checkout sends an order request; nothing is charged online yet."
4. **Confirmation** ("Order Request Received"): "It is not paid yet: we call to confirm
   fitment, delivery and payment, and to set an install time once your tires arrive."
   The cart is cleared only when the shop actually received the request. If Shopify
   was unreachable the customer sees "didn't reach the shop ... nothing has been
   charged" and keeps their cart.

### What happens on the server (`POST /api/checkout`)

1. Spam guard (`api/_lib/spam.js`): per-IP limit, 16 KB body cap, honeypot, fill-time
   token. A bot gets a "delivered" answer and nothing is created.
2. Validation, then **the server prices every line** from the ATD catalog adapter
   (dealer cost plus markup plus freight). Any price the browser sent is ignored.
   Today ATD is in sample mode (credentials arrive after ATD approves the site), so
   prices are representative, which is why the shop confirms price on every request.
3. `buildOrder`: an order reference like `TD-261005-AB7K2M`, subtotal, free shipping,
   `total = subtotal`. **No tax and no Florida per-tire fee are computed.**
4. Mode decision (`paymentModeFor`): **mobile is always "request"**. Everything else is
   "redirect" only when `config.checkout` is `shopify`, which needs Shopify configured
   **and** ATD live. Otherwise "request".

### What we store, and where

| Thing | Where | Notes |
|---|---|---|
| Customer record | Shopify customer (found by email or phone, else created, no marketing consent) | An existing customer's note is never changed |
| The request text (lead) | Customer metafields `tiredrop.last_lead`, `tiredrop.leads`; note only for a brand-new customer | Shopify Flow "Website lead alert" emails info@ |
| The order itself | **Shopify draft order**, no invoice sent | Custom line items (title, ATD SKU, server price, qty), `taxable: true`, free shipping line, attributes (Delivery, Source, Order ref, Vehicle, sizes, Fitment), tags (`order-request`, `vercel-live`, `ship-to-home` / `ship-to-store` / `mobile-install`, fitment tags), a note with the preferred day and window and the customer's notes |
| Analytics | GA4 event `order_request` (never `purchase`) | |
| Our own database | **None.** Vercel only logs. If Shopify fails, the full order JSON (name, address) is written to the function log | Worth knowing for privacy |

### What the shop does next

1. Gets the info@ email, opens Shopify, Orders, Drafts.
2. Calls the customer. Confirms the email (the draft says it is UNVERIFIED), confirms
   **fitment by phone**, confirms price and stock, adds tax or fees and (mobile) the
   install line.
3. Clicks **Send invoice** in Shopify. The customer pays on Shopify's hosted page
   (shop.tiredroponline.com). Shopify turns the draft into a real order.
4. Paid order: the `orders/paid` webhook tags install orders `needs-scheduling`, the
   customer gets a "Schedule your install" link to `/track`, books a day and window
   (`/api/book-install`), the shop confirms the exact time and enters it in Tire Guru
   by hand. The ATD forwarder (off until ATD is live) places the order with ATD.

### What a draft order is for

A draft order is Shopify's "order that has not been paid yet": a priced cart that the
shop can edit, invoice, and convert into a real order. We use it as the **request
record** (so nothing lives only in an email), as the **thing the shop invoices**,
and as what `/track` finds for a `TD-` reference ("open", "invoice sent",
"completed"). The API never sends the invoice itself.

---

## 2. Constraints from the repo and docs

| Constraint | Detail | Source |
|---|---|---|
| **12-function limit** | Hobby allows 12 serverless functions. **12 exist, 0 free:** `book-install`, `checkout`, `csp-report`, `forms`, `newsletter`, `scan-tire-size`, `status`, `tires`, `track`, `vehicles` (10 in `api/`), plus `cron/atd-sweep` and `webhooks/shopify`. `/api/geo` is already folded into `status` by a rewrite for this reason. | `ls api`, `vercel.json`, `docs/ops/deploy.md` |
| Vercel Pro | Not yet bought; Hobby is non-commercial and the sub-daily forwarder cron needs Pro. Pro's own function limit is not verified here (docs blocked). | checklist (#A10), `deploy.md` |
| Secrets | Only in Vercel env vars. Nothing in this brief needs one printed. | `deploy.md` |
| House rules | No APR or lender names, no delivery or arrival dates, no discounts or coupons (the draft turns discounts off), no competitors. Tax wording stays "calculated at checkout". | `CLAUDE.md`, `CartPage.jsx` |
| Fitment by phone | "We'll confirm fitment by phone before your order ships." This is a published promise on the cart and checkout. | `CartPage.jsx` (`PHONE_CONFIRM_NOTE`), `Fitment.jsx` |
| Install area | Installation only in Miami-Dade, Broward, Palm Beach. Ship-to-store (Sunrise) and the mobile van are the two install paths. Mobile ZIPs are checked server-side. | `api/checkout.js`, `business.js` |
| Install slot | There is **no slot inventory**. The customer states a preferred day and window; the shop confirms by phone and enters it in Tire Guru by hand. Tire Guru offers no API (widget is $150/mo per the checklist, an unrelated product decision). | `install-scheduling.md`, checklist |
| Content Security Policy and Permissions-Policy | `form-action 'self'`, `frame-src` limited, and `payment=()` in Permissions-Policy. A redirect to a hosted page is unaffected. Any **embedded** payment form or wallet button would need these loosened. | `vercel.json` |
| Distributor returns | The site says the return window and fee are "set by the distributor". ATD's real terms are still unanswered (#B1 item 12, #D1). Mounted tires are published as not returnable. | `docs/drafts/trust-and-returns.md`, `atd.md` |
| Tax | Lines are `taxable: true`; Shopify works out sales tax. Florida's tire fee is **not** added by code, and whether install labour is taxable and out-of-state tax are open accountant questions (#B4). | `shopify-checkout.md`, prompts #B4 |
| Pay-at-order gate | Redirect mode needs ATD live, so a customer is never charged against sample prices. | `config.js` |

**What "distributor terms" means for refunds.** If we charge at order and the
distributor then refuses or limits a return, the shop refunds the customer from its
own pocket. The more generous the refund promise, the more the shop absorbs. That is
the case for charging only after fitment and price are confirmed. A fixed return
window more generous than the distributor's is Justin's spending decision.

---

## 3. Design choice: when does the customer pay?

| | Pay after the shop confirms fitment | Pay at order |
|---|---|---|
| Customer experience | Request, call, invoice by email, pay | Pay on the spot, then the shop calls |
| Wrong-fit risk | Caught **before** money moves | Shop refunds if the phone check finds a wrong fit |
| Prices | Shop confirms stock and price first (needed today: ATD is in sample mode) | Needs live ATD prices |
| Mobile install | Fits: quote on the call, add the install line, send invoice | Does not fit: no install price exists online |
| Conversion | Slower: the sale waits for a call and an email | Faster: closes on the page |
| Refund and dispute exposure | Low | Higher (refund timing, fees; amounts not verified) |

Recommendation: **default to pay-after-confirmation; allow pay-at-order only when the
fitment check is exact** (the site already computes `Fitment: OK` against the
customer's vehicle or door-jamb size) **and** ATD is live. Anything staggered, unconfirmed
or flagged stays on the phone.

---

## 4. Options compared

Provider facts below come from the repo's own docs, from Shopify's developer docs
via the Shopify docs search tool (search text only, not full pages), or are labelled
**unverified**. Fees are **not verified** for every option.

### Option 1: Shopify invoice from the draft order, pay after fitment (recommended first)

- **How it works.** Exactly today's flow. The shop confirms by phone, then clicks Send
  invoice on the draft. Shopify's docs list a `draftOrderInvoiceSend` mutation and
  show it returning `invoiceSentAt` (search text from shopify.dev, snippet only), so
  the click could later be automated.
- **What we build.** Almost nothing to start: a one-page shop routine, sharper
  confirmation-page and email copy ("we email you a secure pay link once we confirm
  fitment"), and `/track` already shows "invoice sent". Later: an "Invoice ready"
  status line on `/track` using the draft's `invoiceUrl`.
- **Install slot.** Fits best. Preferred day and window travel on the draft note, the
  shop confirms them on the same call, and after payment the existing
  `needs-scheduling` and `/track` booking flow runs. Mobile install fits: the shop adds the
  quoted install line before sending.
- **Fees.** Shopify Payments rates: **not verified** (shopify.com blocked here). Read
  from the admin with prompt P1.
- **PCI.** The card is typed on Shopify's hosted page; our site never sees it. (General
  industry practice; not verified against a PCI document in this session.)
- **Refunds and disputes.** Done in Shopify admin against the order. The site's terms
  already say refunds go back to the original payment method. Dispute fee: **not verified**.
- **Taxes.** Shopify calculates on the invoice page from the draft's taxable lines. Florida
  tire fee and install-labour tax need the accountant (#B4).
- **Functions.** Zero new.
- **Time to build.** S (days, mostly copy and routine).
- **Risks.** Slow: every sale needs a human step. Invoice emails can land in spam (the
  info@ SPF/DKIM test is still open, #A3). The customer's typed email is unverified, so the
  shop confirms it on the call before sending. Existing go-live test prompts (#A1) cover the invoice path with a $1 order.

### Option 2: Shopify pay-at-order through the existing draft-order redirect

- **How it works.** Already coded in `api/checkout.js` and `api/_lib/shopify.js`: the API
  creates the draft, returns its `invoiceUrl`, the browser goes to Shopify's pay page, Shopify
  makes the order, the webhook and Flow run as for any order. Documented as "built and
  unit-tested with a mocked Shopify, never run against a real store".
- **What we build.** Gate it: redirect only when fitment is exact and delivery is ship or
  ship-to-store (never mobile). Add the "paid, fitment still confirmed by phone" wording and
  a refund-if-wrong-fit sentence once Justin decides it. Test on a Shopify development store first.
- **Install slot.** After payment, same as Option 1. Pickup orders carry `requiresShipping: true`
  with no shipping address, and what Shopify's page asks a pickup shopper is still an open check
  in `shopify-checkout.md`.
- **Fees, PCI, disputes, taxes.** As Option 1. Tax is calculated on Shopify's page, so the
  site never shows a figure. Same accountant questions.
- **Functions.** Zero new.
- **Time to build.** S to M, but **blocked until ATD is live** (outside our control).
- **Risks.** Charges before the phone check; a wrong fit becomes a refund. The distributor's
  return terms are unknown. The primary-domain check (`invoiceUrl` must open on
  shop.tiredroponline.com) must pass first.

### Option 3: Shopify native checkout through a cart handoff (Storefront API)

- **How it works.** Build a Shopify cart on the Storefront API and send the customer to its
  `checkoutUrl`. Shopify's cart docs show lines identified by `merchandiseId` = a
  **ProductVariant** id, and the guide's requirements say "You've created products and product
  variants in your store" (search text from shopify.dev, snippet only).
- **What we would build.** Mirror every tire and wheel we can sell into Shopify as a product and
  variant and keep price and stock in sync with ATD, plus a handoff endpoint and a Storefront token.
- **Install slot.** Same as Option 2 after payment, with install as a service product.
- **Fees, PCI, disputes, taxes.** As Option 1.
- **Functions.** One handoff endpoint, which would have to be folded into an existing function.
- **Time to build.** **L.** It reverses a deliberate design ("the site never creates, reads or
  changes a Shopify product") and needs a sync tool the checklist has not chosen (#C2).
- **Risks.** Prices on Shopify drift from live ATD prices; the live catalog is far larger
  than a store should mirror. Not recommended.

### Option 4: Stripe Checkout / Payment Links, or Square, outside Shopify

- **How it works.** Create a hosted payment session or link at an outside processor and return
  the customer to us. **Not verified:** Stripe's and Square's pages were blocked, so how their
  products, fees, disputes, tax tools and hosted-page limits work is unconfirmed here.
- **What we would build.** A session-creation endpoint, a payment-result webhook with its
  own signature check, order records somewhere (we have no database, so Shopify orders would
  need to be created after payment), refund handling, tax set-up at the new processor, and the
  CSP changes if anything is embedded.
- **Install slot.** Everything that keys on a **Shopify paid order** would be bypassed: the
  `orders/paid` webhook, `needs-scheduling`, `/track` booking, the Flow alerts and the ATD
  forwarder. Each would need a second path.
- **Functions.** The result webhook needs its own function: **12 of 12 are used.** It would force
  merging functions or Pro (limit not verified).
- **PCI.** Hosted pages keep card entry off our site (general practice, not verified); an embedded form
  adds scope.
- **Time to build.** **L.**
- **Risks.** A second ledger for the accountant, two sets of payouts and disputes, a second
  tax set-up (the Florida fee and nexus questions double). Only worth it if Shopify Payments is
  refused or too costly. Nothing found says it is.

### Scorecard

| | Opt 1 | Opt 2 | Opt 3 | Opt 4 |
|---|---|---|---|---|
| Time | S | S to M (blocked by ATD) | L | L |
| New functions | 0 | 0 | 0 to 1 | 1 |
| Keeps webhook, tags, `/track`, ATD forwarder | yes | yes | yes | no |
| Mobile install | yes | no | partly | no |
| Wrong-fit protection | best | weak | weak | weak |
| Closes the sale on the page | no | yes | yes | yes |
| Fees verified | no | no | no | no |

---

## 5. Recommendation and 3-step rollout

**Stay on Shopify. Pay after the shop confirms fitment first; add pay-at-order only for exact fits.**
Reason: Shopify Payments is already live and tested, every downstream tool already listens to Shopify
orders, no new function is needed, and the shop keeps control of fitment and price while ATD terms are open.

### Step 1: make pay-after-confirmation fast and visible (smallest, safe, start now)

| Who | What |
|---|---|
| **Forge** (build) | Confirmation page and email copy: "We'll confirm fitment and price, then email you a secure pay link." (No times, no dates.) Same line on the review step. Optional: `/track` shows "Invoice ready: pay now" from the draft's `invoiceUrl` for the matching email. Copy only, no change to payment code. |
| **Sweep** (test) | Phone and desktop: wording, a11y, no layout shift, house-rules scan of the copy. On a development or $1 test order: draft created, Send invoice works, link opens on shop.tiredroponline.com, paid order gets `needs-scheduling`. |
| **Justin only** | Prompts P1, P2, P3 below; accountant answers (#B4); decide who clicks Send invoice. |

### Step 2: pay at order for exact-fit orders (after ATD is live)

| Who | What |
|---|---|
| **Forge** | Gate the existing redirect to `Fitment: OK` plus ship or ship-to-store. Add wording that fitment is still checked by phone. Add a `check:` script for the new decision (`paymentModeFor` tests). |
| **Sweep** | Development store run: redirect, pay with Shopify's test mode, order tags and attributes carry over, pickup shopper not blocked by the missing address, refund once. Fitment cases: OK, staggered, unconfirmed. |
| **Justin only** | Choose charge-now versus authorize-only (answer from P1), the wrong-fit refund promise, the return window (#D1). |

### Step 3: measure, then automate

Forge: send the invoice automatically after a "fitment confirmed" tag (via `draftOrderInvoiceSend`,
inside an existing function, no new one), and send a `purchase` GA4 event only from the paid order.
Sweep: re-run the full suite on the integrated release. Justin: review invoice-to-paid time and refund
count after two weeks, and decide whether Vercel Pro is bought (spending is his call).

---

## 6. Claims ledger

| Claim | Source | Status |
|---|---|---|
| Checkout is request-only today; mobile is always request | `api/checkout.js`, `CheckoutPage.jsx` (read) | VERIFIED (code read) |
| Redirect path exists and needs Shopify and ATD live | `api/_lib/config.js` `paymentsReady` (read) | VERIFIED |
| ATD is still in sample mode, waiting on approval | Checklist ATD section (read) | VERIFIED as of the checklist; live `/api/status` could not be read (site blocked, curl returned no response) |
| 12 of 12 functions used | `find api` (12 files outside `_lib`), `deploy.md` "Hobby allows 12, all taken" | VERIFIED |
| Shopify Payments is on, test mode off | Checklist line "Shopify Payments: payouts daily, test mode OFF" | VERIFIED on the checklist (Justin's word), not seen in the admin |
| Draft orders carry tags, attributes, notes; API never sends invoice | `shopify-checkout.md`, `orders.js` (read) | VERIFIED |
| `draftOrderInvoiceSend` exists and returns `invoiceSentAt` | shopify.dev result via Shopify docs search | SNIPPET-ONLY |
| Storefront cart lines need a product variant id | shopify.dev result via Shopify docs search | SNIPPET-ONLY |
| Shopify Payments rates, dispute fee, manual capture | shopify.com | UNVERIFIED (blocked); prompt P1 |
| Stripe or Square rates, dispute fees, product limits | stripe.com, squareup.com | UNVERIFIED (blocked); not used in the decision |
| Hosted payment pages keep card entry off our site (PCI) | General practice | UNVERIFIED |
| Pro plan function limit | Vercel docs | UNVERIFIED |
| Distributor return window and fee | `atd.md` open question, `trust-and-returns.md` | OPEN (Justin or ATD must answer) |

---

## 7. Chrome prompts for Justin (each stops before any payment, publish or save step)

Run one at a time. Paste into Claude in Chrome.

**P1. Shopify Payments: read only.**

```
In the Shopify admin for the TireDrop store (the store behind shop.tiredroponline.com):

TASK: Report how payments are set up. CHANGE NOTHING. Do not save, activate,
deactivate, edit or enter any bank or card detail. Do not press Pay, Refund,
Capture, Publish or Save anywhere.

1. Open Settings > Payments. Report the provider shown (Shopify Payments or other)
   and whether it says active.
2. Open the Shopify Payments page. Report, exactly as written on screen:
   - the payout schedule and the statement descriptor
   - the card rates shown for online payments, if any are shown (copy the text)
   - whether a "payment capture" setting exists, and if so its options
     (automatically at checkout / when the order is fulfilled / manually). Copy
     the option names only. Do not change the setting.
   - the dispute (chargeback) fee if the page shows one
   - which wallets or express buttons are enabled
3. Open Settings > Policies. Report whether a refund policy is filled in and its
   first two sentences.

REPORT BACK as a list. If a screen asks for bank or identity details, stop and say so.
```

**P2. Shopify tax settings: read only.** Use prompt 9 in `docs/business/shopify-admin-prompts.md`
(it already reports shipping and tax configuration with no edits), and add: "Also report whether the
store charges tax on Florida orders and what the checkout tax line is named." Send the accountant
questions in `docs/prompts/2026-10-02-justin-remaining.md` #B4 in parallel.

**P3. Invoice dry run on a draft (does not send).**

```
In the Shopify admin for the TireDrop store:

TASK: Look at what a customer would receive when the shop clicks Send invoice. DO NOT
send anything. Do not save, delete, mark as paid or create an order.

1. Open Orders > Drafts. Open the oldest draft that has the tag "order-request" (a test
   draft is fine). If none exists, say so and stop.
2. Report: the line items, the tags, the note (first 3 lines), and whether a shipping line shows.
3. Find the "Send invoice" button and click it ONLY to open the dialog. Report the fields
   and default text in the dialog (from, to, subject, message). Then close the dialog
   with Cancel. Never press the final Send.
4. Click "Preview" or "Copy invoice link" ONLY if it does not send anything. Report which domain
   the link starts with (it should be shop.tiredroponline.com).
5. Settings > Notifications > Customer notifications > Draft order invoice: open it and report
   the subject and the first paragraph. Do not save any change.

REPORT BACK as a list. Stop immediately if any step would send, pay or save.
```

**P4 (only if Justin wants an outside processor).** Not recommended, so no prompt is provided. If
chosen, a new brief will cover account sign-up steps; creating the account and entering bank details
are Justin-only and nothing here asks for them.

---

## 8. Decisions I need from Justin

1. **Stay on Shopify for payment?** (Recommended: yes. Options 3 and 4 are not worth their cost.)
2. **Launch rule:** everyone pays after the shop confirms fitment (Step 1), with exact-fit pay-at-order
   added later once ATD is live (Step 2)?
3. **Who sends the invoice,** and how fast after the call? (The site already promises a call within one
   business day; keep any new promise in the same words, no times.)
4. **Charge now or authorize only** for Step 2, once P1 shows whether Shopify offers manual capture.
5. **Wrong-fit promise** if we confirmed the size and it is still wrong (docs/drafts/trust-and-returns.md
   question 6). Charging at order turns that promise into a refund.
6. **Return window and fee** (#D1) and ATD's actual terms (#B1 item 12). Needed before any refund wording.
7. **Accountant answers** on the Florida $1/tire fee, install-labour tax and out-of-state tax (#B4).
8. **Mobile install:** keep "quoted on the call, then invoiced" as the permanent flow?
9. **Vercel Pro** (spending, your call; already on the checklist as #A10).
10. Run prompts P1, P2 and P3 and send the answers back.
