# Financing and add-ons: a decision brief for Justin

Written 2026-10-05 by Hook (conversion). Branch `preview/wave3-financing-warranty-brief`.
Docs only: no code, no Shopify, no accounts, no applications, no money.
Wave 3, competitor gaps 7 (pay over time beside the price) and 11 (protection and service bundles).

This is an internal brief. It names providers as OPTIONS for Justin only. Nothing in it
is site copy until Justin says yes, and every draft line follows the house rules (no APR,
no lender or provider names, no "no interest" or approval claims, no discounts, no
invented numbers or policies).

---

## One-page summary

**Where we are.** Two corrections to the ask, both from reading the code:

1. The Financing page (`/financing`) is not an application form any more. It is a "ways to
   pay" page that already names **Shop Pay Installments** as a Shopify checkout option, says
   "subject to eligibility", quotes no terms, and has a short callback form that says plainly it
   is "not an application and not an approval". Nothing on any tire card, product page or cart
   mentions paying over time.
2. The site's checkout is **request-only**: the shopper sends an order request, the shop calls
   to confirm fitment, then sends a Shopify invoice and the shopper pays on Shopify's hosted
   page (see the checkout options brief, branch `preview/wave2-checkout-options`). So any
   "pay over time" promise on the Financing page depends on Shop Pay Installments appearing on
   **that invoice page**. Nobody has checked that it does. This is the biggest open fact.

**Protection today.** Road hazard is listed as NOT a workmanship issue (`/terms` section 11).
No road-hazard product, rotation plan, flat-repair promise or install bundle is sold or
mentioned as available. Maker warranties are the maker's, with our help filing a claim.

**Financing: recommendation.** Option A, Shopify's own installment option on the checkout the
store already has, with provider-neutral wording on the product page, cart and Financing page.
Steps: (1) Justin runs a read-only check that it is active and appears on an invoice (prompt P1,
P2), (2) Forge adds two lines of copy (size S), (3) if it does not appear on the invoice, the
Financing page wording is corrected first. No new account, no application, nothing for Justin
to sign beyond what Shopify Payments already needed.

**Add-ons: smallest-first.** A paid **rotation and balance plan**, sold only with an install,
offered on the confirmation call the shop already makes and added as a custom line on the draft
order before invoicing. No code. It tests demand and Justin's real cost before any site build.
Road hazard stays a "no" on the site until the distributor's terms and a provider's terms are
read (Justin's D1 question is still open).

**Needed from Justin:** 9 yes/no decisions at the end, plus the worksheet in section 6 (his cost
and price per add-on; every cell is blank on purpose).

**Not verified in this session.** Every provider fact (fees, limits, who funds the credit,
whether it shows on an invoice) came from search snippets at best, because the provider and
government sites are blocked from this sandbox. Section 8 lists each claim with its status.
Nothing here is legal advice; section 3.4 lists what to ask an accountant or lawyer.

---

## 1. What exists today (read in the code on this branch, main 0071975)

| Topic | What it says or does | Where |
|---|---|---|
| Financing page purpose | "Tires now. Pay over time." Hero lede: every way to pay, "including Shop Pay Installments at checkout, subject to eligibility." CTA "Start a Request" (anchor to the form) and the phone number. | `src/pages/support/FinancingPage.jsx` (hero) |
| Ways to pay | Four cards: Card; Shop Pay; Shop Pay Installments ("subject to eligibility ... Shop Pay shows you the terms at checkout ... We do not set them"); In person at the shop (cards and cash). | `PAY_METHODS` |
| What the page promises | No rates, no approval odds, no monthly figure ("We do not quote payment plans ... because we do not set them"). "We are not a bank and we are not a lender." Prices do not change with how you pay. Refund on an installment order goes back through Shop Pay. | `STEPS`, `FAQ`, disclosure section |
| Request form | Fields: full name, phone, email, "Amount needed (USD)" (greater than 0, at most 25000). Honeypot and fill-time guard. Says: no credit check, "not an application and not an approval". | `ApplicationForm`, `validate` |
| Where the form goes | `submitForm("financing", ...)` to `POST /api/forms` (form type `financing`). Becomes a lead on the Shopify customer (found by email, else phone, else created without marketing consent); Shopify Flow emails it to info@. No third-party form service. If forms are not "on" the page says honestly that nothing was sent and to call. | `api/forms.js`, `api/_lib/leads.js`, docs/integrations/website-leads.md |
| Any lender in the code | None. No lender link, no application hand-off, no APR. | grep over `src` and `api` |
| Pay-over-time anywhere else | Not on the tire card, product page, cart or checkout. Footer and header link to `/financing` only. | `ProductCard.jsx`, `ProductPage.jsx`, `CartPage.jsx`, `business.js` nav |
| Checkout | Request-only; "nothing is charged online yet"; the shop sends the Shopify invoice after confirming fitment. A "pay at order" redirect to Shopify exists but stays off until ATD is live. | checkout options brief; `api/checkout.js` |
| Terms: returns | Unmounted tires and wheels only; mounted tires not returnable; window and fee "set by the distributor, confirmed on your order"; refunds to the original payment method, with one sentence about a financed order refunded "against your balance with the lender". | `LegalPage.jsx` section 9 |
| Terms: warranty and road hazard | Maker warranty comes from the maker; we help file a claim; mileage warranties usually need documented rotations. Road hazard damage is "not a workmanship issue". "We stand behind the work our technicians perform." No road-hazard product mentioned. | `LegalPage.jsx` section 11 |
| Drafts waiting on Justin's D1 | Return window, restocking fee, road hazard "yes with provider, or no", fitment promise, all with placeholders. | [trust-and-returns.md](../drafts/trust-and-returns.md) section 2a (rows 5 and 6) and 3.7 |
| Checklist | "Returns window + warranty/road-hazard links" (D1) is open. "Trust strip and returns policy drafts ready" is open. No financing item exists. | `docs/LAUNCH-CHECKLIST.md` |

**Service prices that exist today** (`src/data/services.js` and `src/data/products.js`; all are "from" prices, so they are the starting point, not a promise of a final price):

| Service | Starting price in the catalog | Unit | What the catalog says it includes |
|---|---|---|---|
| Tire installation | $25 | per tire | Dismount and disposal, mount and seat, balance on every wheel, valve stem, torque, TPMS reset where equipped. Mobile (van) or shop. |
| Tire balancing (alone) | $15 | per tire | Dynamic balance, re-torque. Mobile. |
| Tire rotation | $40 | per service | Pattern for the drivetrain, tread depth at every corner, pressure, torque. Mobile. The page recommends every 5,000 to 7,000 miles. |
| Tire repair (flat) | $35 | per tire | Dismount, internal inspection, patch-plug, rebalance, pressure. Mobile. City pages say a qualifying puncture is repaired and that otherwise a replacement is needed. |
| Wheel alignment | $99 | four wheels | Shop only (needs a rack). |
| Tire installation on a product | $25 | per tire (`installPrice` on every sample product) | Added in the cart when "install at the shop" is on; shown as installed price on cards and tire pages. |

Install area: Miami-Dade, Broward and Palm Beach only. Free shipping: 48 contiguous states and DC.

**Two things to decide about what is already live (not new work, just awareness):**

- The Financing page names "Shop Pay Installments". The house rule says no lender or provider
  names on the site. Shop Pay is a payment method inside Shopify rather than a lender, but a lender
  stands behind it. Justin should say whether the existing name stays (it lets a shopper recognise
  the button they will see) or becomes provider-neutral. Section 3 drafts new copy neutral either way.
- `/terms` mentions "the lender" once and "financing providers, if you choose to apply" in the
  privacy list. Both are accurate only if some financing exists. If Justin picks no financing, those
  two lines and the Financing page should be trimmed in a follow-up.

---

## 2. Gap 7: "pay over time" beside the price

### 2.1 Options for a small Shopify-based shop

Every provider fact below is labelled. `[search]` = a search-result snippet, not a page I read.
`[memory]` = general knowledge, not checked in this session. Nothing is marked verified.

| | A. Shopify's installment option (Shop Pay Installments, through Shopify Payments) | B. Another buy-now-pay-later method added to Shopify checkout (examples to ask about: Affirm, Klarna, Afterpay) | C. A lender's application link or in-shop program (a tire or auto-care credit card, or lease-to-own) | D. The shopper's own card issuer's plan |
|---|---|---|---|---|
| How it works for the customer | Chooses "pay in installments" on Shopify's pay page; a short eligibility check; schedule shown before confirming. `[search]` says four biweekly payments for smaller orders and monthly payments for larger ones, both within order-size limits that the snippets disagree on ($50 to $20,000, or $35 to $30,000). | Same idea, different brand: button on Shopify's pay page, provider's own eligibility check and schedule. | Customer applies on the lender's page or on a tablet at the counter; if approved, pays the shop with the lender's card or credit line. Usually the heaviest process for the customer. | Customer pays by card as normal and uses their card issuer's own installment feature. The shop is not involved. |
| What the shop sets up | Nothing new if Shopify Payments is on (the checklist says Shopify Payments is on, test mode off, payouts daily; not seen in the admin). Check Shop Pay Installments status in Settings > Payments. | Activate the method in Shopify's payment settings, or install a provider's Shopify app. May need the provider's approval of the store. `[memory]` | Merchant agreement with the lender, a merchant ID and a branded link or terminal. Staff training. `[memory]` | Nothing. |
| What Justin signs or applies for | Probably nothing beyond the Shopify Payments terms already accepted. Confirm in the admin (prompt P1). | Provider merchant terms, possibly an underwriting review of the shop. Each provider's fee is its own. | A merchant agreement. Fees and who is liable if a customer disputes are in that contract. Read with an accountant or lawyer. | Nothing. |
| Fees to the shop | Not verified. Shopify's admin shows the rate to the account holder (prompt P1 asks for it). | Not verified. Ask each provider. | Not verified. Often a per-sale fee. Ask. | None. |
| Does the shop get paid up front? | `[memory]` Shopify settles the order to the shop in the usual payout; the provider carries the credit. Not verified. Ask in P1. | `[memory]` same model. Not verified. | Depends on the program. Not verified. | Yes, a normal card sale. |
| Works with our request-then-invoice checkout? | Unknown. The shopper pays on a Shopify invoice page, not on a live cart. Whether the option appears on a draft-order invoice is **not verified**. P2 checks the one thing Justin can look at without paying. | Same unknown. | Works outside checkout (phone and counter), so it fits our call-first flow. | Always works. |
| Compliant on-site wording without naming a lender | Yes. "Pay over time at checkout, where offered." | Yes, same wording. | Hard. A shopper clicking "Apply" must see who the lender is, so the page almost always has to name them or link to them. That conflicts with the house rule. | Yes, but it promises nothing and lifts nothing. |
| Build effort for Forge | **S**: copy lines on product page, cart and Financing page (section 2.3). No API or data change. | **S** to **M**: same copy; if it needs an app or a script, M. | **M** to **L**: a link or form hand-off, a disclosure block, and a rewrite of the form's meaning ("this is an application"). | **S**, but no benefit. |
| Main risk | The Financing page already promises it. If it does not appear on the invoice page, the page overpromises. Fix wording first. | Each provider adds its own terms, fees and customer-service burden. Two plan menus confuse the shopper. | Highest compliance load (credit advertising, lender disclosures), a customer credit pull the shop is associated with, and a lender name on the site. | None. Also none of the lift. |

### 2.2 Recommendation: A, with a verify-first step

Rank: **A, then C only if Justin sees real "declined or not eligible" demand, then B, then D.**

Why A: it is already switched on in the store as far as the checklist says, it costs Justin no
signature, the provider carries the credit (not us), and the copy can stay provider-neutral. It
also fits the existing Financing page, which already tells shoppers to expect it at checkout. The
price of being wrong is small: the first step is two read-only looks in his admin.

What would change the recommendation: if Shop Pay Installments does not appear on an invoice
(P2), the cleanest fix is turning on the "pay at order" redirect that already exists, once ATD is
live, so the shopper reaches Shopify's checkout directly. Until then the Financing page should
say "when you pay" rather than "at checkout".

### 2.3 On-page lines and exact placements

All lines are provider-neutral and avoid rate, approval, "no interest" or price-promise language.
"Where offered" is deliberate: it is true whether or not the shopper is eligible. None of them
mentions a number. Pick one tone per line, or mix.

| Placement | Safe | Balanced | Direct |
|---|---|---|---|
| **Financing page**, hero lede (`FinancingPage.jsx`, `PageHero lede`) | "Nobody plans for a blown tire in the middle of the month. Here is every way you can pay for an order, including payment plans where they are offered when you pay, subject to eligibility." | "Nobody plans for a blown tire in the middle of the month. Here is every way to pay, including paying over time where it is offered when you pay." | "Every way to pay, including over time where offered." |
| **Cart**, one line under "Estimated total" (`CartPage.jsx`, after the totals block) | "Payment plans may be offered when you pay, subject to eligibility. Ask us if you have questions." | "Want to pay over time? Options are shown when you pay, where offered." | "Pay over time, where offered, when you pay." |
| **Product page**, one line under the Add to Cart button and the installed-price block, before the warranty and shipping row (`ProductPage.jsx`, about line 776) | "Payment plans may be offered when you pay, depending on your order and eligibility. The terms are shown before you confirm." | "Pay over time when you pay, where offered. You see the terms before you confirm." | "Pay over time where offered." |
| **Tire card** (`ProductCard.jsx`, under the price block, about line 206), small text link to `/financing` | "Payment plans may be offered" | "Pay over time options" | "Pay over time" |

Placement notes:

- **No monthly figure anywhere.** A figure like "$X a month" turns the line into advertising of
  specific credit terms, which can trigger extra required disclosures (see 2.4). The lines above
  quote no number.
- **Tire card: optional.** A card shows the price of one tire. A payment plan has order-size
  limits (search snippets only, unverified), so a line on every card may show a plan the order
  does not qualify for. Recommend product page, cart and Financing page first; add the card link
  only if the product page shows lift. It must stay a plain link (44 px tap target, no motion).
- **Each line links to `/financing`**, and the Financing page keeps its disclosure block.
- **Prerender:** the text must be in the static HTML, not injected after load.
- **CTA fix on the Financing page.** The hero primary button is "Start a Request", which opens a
  callback form that asks for an amount. A buyer who just wants to pay over time on a specific
  tire is better served by "Find your tires" to `/tires`, with the request form second. This is
  the same file and the same edit.

### 2.4 Risks to flag (not legal advice; ask an accountant or lawyer)

- **Credit advertising rules.** The federal truth-in-lending rules (Regulation Z) set extra
  disclosure triggers when an ad states specific credit terms such as a payment amount or number
  of payments. The drafted lines avoid every such term. Ask a lawyer before adding any number.
  `[memory]`, not verified.
- **"Interest-free" and "no interest" claims.** Search snippets describe some plans as
  interest-free. We say none of that on the site, because eligibility and terms are the provider's.
- **Federal BNPL oversight.** The federal consumer-finance regulator's position on buy-now-pay-later
  products has moved in recent years. `[memory]`: I do not know its status today. Ask.
- **State rules.** If the shop ever extended credit itself (layaway with interest or fees, its own
  installments), Florida retail-installment and consumer-finance rules could apply. Option C
  (lease-to-own) can carry its own state rules. Ask a Florida lawyer before offering either.
  The shop's own layaway or "pay us over time" plan is deliberately not on the list.
- **Refunds.** A refund on an installment order goes back through the provider, which can take a
  billing cycle. The Financing page already says this. The `/terms` "lender" sentence should be
  re-read once the provider is chosen.
- **Disputes and chargebacks.** The checkout options brief asked for the Shopify dispute fee
  (prompt P1 there). Same question applies here.
- **Sales tax and the Florida tire fee** are separate from financing, but the invoice total
  is what the plan is sized on. The checkout brief notes tax is added when the shop invoices.
- **Accessibility and the disclosure block** on the Financing page must stay visible in the
  static HTML.

### 2.5 Measure it

Proposed GA4 events (none exist yet; Forge to add with the copy): `payplan_view` (once per page,
placement param: product, cart, financing), `payplan_click` (link to `/financing`, placement
param). Funnel: product view, add to cart, begin checkout, `order_request`. Compare add-to-cart
rate on tire pages and cart-to-`order_request` rate for two weeks before and two weeks after. The
clean read is orders over $600, where an installment plan matters most.

---

## 3. Gap 11: warranty and service add-ons

### 3.1 Options

Prices and costs are blank on purpose (worksheet in section 6). Any "bundle" must be priced at
the sum of its parts or be a new line with its own price: a package priced below its parts is a
discount, and discounts are off the table by house rule. Justin may override that rule; I have
not assumed he will.

| | 1. Rotation and balance plan (paid, install orders only) | 2. Flat repair included | 3. Road-hazard plan from a third-party provider | 4. Install bundle |
|---|---|---|---|---|
| What the customer gets | `[PLAN_VISITS]` of rotation and balancing for the tires we installed, for `[PLAN_TERM]`. Also helps meet the maker warranty's documented-rotation condition (already stated in `/terms` section 11). | Repair of a qualifying puncture on tires we installed, for `[REPAIR_TERM]`, with no repair labor charge. A technician inspects the inside first; some damage cannot be repaired (city pages already say so). | Repair or replacement after road damage, under the provider's terms. | Install plus the plan in one line item. |
| How it usually works (labels apply) | Shop-funded promise: shop collects once, delivers visits over time. `[memory]` Not verified from any page I read. | Shop-funded. Cost per claim is a repair visit (labor and a patch). | `[search]` A snippet from a tire maker's regional (not US) page says the selling dealer repairs or replaces tires damaged by potholes, debris, nails or glass; coverage starts at installation; after a period (12 months or 12,000 km there) the credit is pro-rated by remaining tread; typical exclusions include fleet, rental and some light-truck or SUV tires; it was not a plan sold by a third party. Treat as how one maker describes its own plan, not as how a US third-party plan works. A US plan's coverage, exclusions, claims path and price are **not verified**. | Shop-funded: a package of install, balance and a rotation plan under one heading. |
| Pricing workflow | Worksheet 6.2: per-visit labor cost x expected visits + overhead = floor price; Justin picks the price. | Worksheet 6.3: repair cost per claim x expected claims per set = cost per set sold. | Worksheet 6.4: provider's wholesale price per set (from the provider) and Justin's retail price. | Worksheet 6.5: sum of parts. |
| On the tire page | One line and a link to the plan terms, shown only for sets with install selected. | One line and a link to the terms. | One line and a link to the provider's terms. | A line in the install block. |
| In the cart | A checkbox under the install toggle ("Add rotation and balance plan"), adds a line. | None needed: it is a promise stated on the page and in the terms. | A checkbox adding a line, with the provider's terms linked. | A single checkbox adding the plan line. |
| Effort for Forge | **None** to start (phone-sold, custom draft-order line). Page copy **S**. A real cart line is **M**: the checkout server prices every line itself, so a new line type needs the catalog adapter, `api/checkout.js` and the draft-order builder to know it. | **S** (copy and a terms paragraph). | **M** to **L**: cart line, provider terms link, claims instructions, and a provider hand-off. | **M**, the same cart-line work as option 1. |
| Cost and claims risk | Shop carries the tail: a plan sold at one price, redeemed over years. Needs a definition of "lifetime" (of the tire set, the car, the customer?). Ties up bay or van time. | Low per claim; unbounded in time unless capped by tire, term or number of repairs. | Provider carries the claims and the shop earns a margin, if the provider is a real third party. Ask whether the provider is licensed for this product in Florida and whether the shop needs anything to sell it. | Same as option 1. |
| What the distributor's terms already cover | Nothing. The distributor's terms are about the product, not our labor. | Nothing for labor. The maker's warranty does not cover a puncture (`/terms` section 11). | Unknown. The distributor and each tire maker may already offer a road-hazard program; ask ATD (the open #B1 question about returns, damaged deliveries and programs). | Nothing. |
| Fit with existing facts | Fits: rotation and balance are catalog services, mobile or shop. | Fits: flat repair is a catalog service. | New to the site. Current terms say road hazard is not covered by us. | Fits; the install price already includes balance. |

### 3.2 Recommended order, smallest first

1. **Sell option 1 on the confirmation call, no code.** The shop already phones every order to
   confirm fitment. The person on the call offers the plan for installs and, if the customer says
   yes, adds a custom line to the draft order before the invoice goes out. Track attach rate in a
   spreadsheet for two weeks. This costs no build, tests demand, and surfaces Justin's real cost
   per visit before any commitment is printed on the site.
2. **Then, if attach rate is worth it**, add option 2 as a published promise, with a terms
   paragraph (a paragraph is S and sits next to `/terms` section 11).
3. **Then, if Justin wants it**, build the cart checkbox (M) for option 1, so the plan is bought
   online.
4. **Road hazard (option 3) last**, and only after ATD's answer on what already covers the tire
   and a provider's terms are read. Until then the site keeps saying road hazard is not
   covered by us, per Justin's open D1 question.

### 3.3 Draft copy, three tones

All lines use placeholders where a number or provider would go. A line with an unanswered
placeholder is not published. No line says a tire is safe, no line says "guarantee", none claims
a discount, and none names a provider.

**Rotation and balance plan** (tire page and cart, install orders only)

- **Safe:** "Add a rotation and balance plan to your installed set: [PLAN_VISITS] for [PLAN_TERM], at the Extreme Tires shop[PLAN_VAN]. Plan terms are on this page before you add it."
- **Balanced:** "Rotation and balance plan: [PLAN_VISITS] for [PLAN_TERM] for [PLAN_PRICE]. Even wear is what a maker's mileage warranty asks for, and this keeps it on the calendar."
- **Direct:** "Rotation and balance plan: [PLAN_VISITS], [PLAN_TERM], [PLAN_PRICE]."

**Flat repair included**

- **Safe:** "On tires we install, a qualifying puncture is repaired at no repair-labor charge for [REPAIR_TERM]. A technician inspects the inside first, and some damage cannot be repaired."
- **Balanced:** "Flat repair is included on tires we install, for [REPAIR_TERM]. If it can be repaired, we repair it. If it cannot, we tell you why."
- **Direct:** "Repairable flat? Included for [REPAIR_TERM] on tires we installed."

**Road-hazard plan** (shown only if Justin says yes and a provider's terms are read)

- **Safe:** "Road-hazard coverage is available from [ROAD_HAZARD_PROVIDER]. It is that provider's plan, with its own terms. Ask us for them before you buy."
- **Balanced:** "Road-hazard coverage from [ROAD_HAZARD_PROVIDER]. Their terms, their claims process. Ask us for the terms before you decide."
- **Direct:** "Road-hazard plan from [ROAD_HAZARD_PROVIDER]. Ask for the terms."

If Justin says no, the line from the existing trust draft stays: "We do not sell road-hazard
coverage. Check the tire maker's own warranty for exactly what it covers."

**Install bundle** (cart, one checkbox)

- **Safe:** "Install bundle: installation, plus the rotation and balance plan, on one line at [BUNDLE_PRICE]. Terms are linked."
- **Balanced:** "Add the install bundle: installation and the rotation and balance plan on one line, [BUNDLE_PRICE]."
- **Direct:** "Install bundle: [BUNDLE_PRICE]."

### 3.4 Risks to flag (not legal advice)

- **Cost to the shop.** Options 1, 2 and 4 are the shop's own promise. Without a cap (term,
  visits, one repair per tire) the cost has no ceiling. Fill in the worksheet before choosing a
  term.
- **"Lifetime."** Use it only with a written definition. Do not publish the word in a headline
  until the terms exist. Placeholders above use `[PLAN_TERM]` for that reason.
- **Claims handling.** Options 1 and 2 are redeemed by booking, so the existing install booking
  flow handles them. A third-party road-hazard plan adds a claims path the shop must explain.
- **Regulation.** A third-party road-hazard or service plan may be regulated under Florida's
  rules for service agreements. `[memory]` I do not know whether it applies to a plan the shop only
  resells, and I did not verify it. Ask the provider for its license and ask a Florida lawyer or the
  shop's accountant what the shop must do.
- **Tax.** Whether a plan or a service agreement is taxed in Florida is unverified. Ask the accountant
  (open question #B4 in `docs/prompts/2026-10-02-justin-remaining.md`).
- **Warranty conflict.** The maker's mileage warranty needs documented rotations and correct
  inflation (`/terms` section 11). A plan that says it "keeps your warranty valid" would invent a
  maker policy. The Balanced line says only what the site already says.
- **Return rules.** If a plan is bought and the tires are returned, the plan's refund rule must be
  written in the plan terms. Not written today.
- **Install area.** Plans that include the van apply only in Miami-Dade, Broward and Palm Beach.
  A shipped-only order cannot use them. The copy says "install orders only" for that reason.

### 3.5 Measure it

Attach rate = plan lines on invoiced orders divided by invoiced install orders (spreadsheet at
first). Once built: GA4 `addon_view` and `addon_select` (param `addon`: rotation_plan,
flat_repair, road_hazard, bundle) and the average order value on the draft orders that carry a
plan line. Compare against the same weeks before.

---

## 4. Top 5 fixes by impact divided by effort

| # | Fix | Page | Problem | Change | Expected effect | Measure | Effort |
|---|---|---|---|---|---|---|---|
| 1 | Confirm Shop Pay Installments actually shows on the invoice, and correct the Financing page if not | `/financing` | The page promises it "at checkout". Our checkout is request-then-invoice. Unverified. | Run prompts P1 and P2; change "at checkout" to "when you pay" if needed | Removes a possible broken promise; protects trust | Phone calls asking "where is the plan?"; `payplan_click` | none (Justin, 10 minutes) |
| 2 | Pay-over-time line on the product page and cart | Product page, cart | The buyer of a $600+ set sees no way to spread the cost until `/financing` | Section 2.3 lines, linked to `/financing` | More add-to-cart and `order_request` on large orders | `payplan_view`, `payplan_click`, add-to-cart rate | S |
| 3 | Offer the rotation and balance plan on the confirmation call | Phone call and draft order | No add-on exists; every call is a missed upsell | Script the offer; add a custom line before invoicing | Higher order value on installs; real cost data | Attach rate (spreadsheet) | none |
| 4 | Answer D1 on road hazard: yes, no or "ask ATD first" | `/terms` section 11, product page | The page says it is not covered and the buyer cannot see what to do about it | One answer unlocks the draft in the trust file (3.7) | A clear line instead of silence; fewer pre-sale calls | Calls mentioning road hazard | none |
| 5 | Financing page hero button: "Find your tires" first, request form second | `/financing` | The primary button opens a callback form that asks for an amount, not the order | Change hero CTA and order | More shoppers reach `/tires` from the page | Clicks from `/financing` to `/tires` | S |

---

## 5. Forge's build sheet (once Justin says yes)

| Step | Files | Size |
|---|---|---|
| Pay-over-time lines (2.3) on Financing, cart, product page, tire card (optional) | `src/pages/support/FinancingPage.jsx`, `src/pages/shop/CartPage.jsx`, `src/pages/shop/ProductPage.jsx`, `src/components/shop/ProductCard.jsx` | S |
| Wording edits on the Financing page if the provider name goes or "when you pay" replaces "at checkout" | `FinancingPage.jsx` (`PAY_METHODS`, `STEPS`, `FAQ`, disclosure) and `/terms` "lender" sentence in `LegalPage.jsx` | S |
| GA4 events | `src/lib/analytics.js` and the files above | S |
| Flat repair promise + terms paragraph | `LegalPage.jsx` section 11, product page line | S |
| Cart add-on line (plan, bundle, road hazard) | `CartPage.jsx`, `src/data/pricing.js`, `api/checkout.js`, `api/_lib/orders.js` (server prices every line) | M |
| Gates | lint, unit tests, build, `check:schema`, `check:sources`, `check:a11y`, `check:prerender`, `check:home`, `check:forms` | |

---

## 6. Worksheet for Justin's numbers

Every cell is blank on purpose. Nothing here is a suggested price. "Source" means where the
number comes from (a quote, the bay's own records, a provider).

### 6.1 Payment plan

| Question | Answer | Source |
|---|---|---|
| Shopify's fee on an installment sale (percent and flat) | | Admin (prompt P1) |
| Is Shop Pay Installments active on the store? | | Admin (prompt P1) |
| Smallest and largest order it allows | | Admin (prompt P1) |
| Does the option show on a draft-order invoice? | | Admin, preview only (prompt P2) |
| Payout timing on an installment sale | | Admin (prompt P1) |

### 6.2 Rotation and balance plan

| Line | Justin's cost | Justin's price | Notes |
|---|---|---|---|
| Labor per rotation visit (minutes x labor rate) | | n/a | Catalog starting price for a rotation is $40, for balancing $15 per tire; those are the public prices, not cost |
| Labor per balance (4 tires) | | n/a | |
| Van or shop overhead per visit | | n/a | |
| Visits per plan `[PLAN_VISITS]` | | n/a | Needs a cap |
| Plan term `[PLAN_TERM]` | | n/a | Needs a definition |
| Plan price | n/a | | Not below total cost for the visits Justin expects to redeem |
| Expected share of buyers who redeem | | n/a | Unknown until step 1 of 3.2 runs |

### 6.3 Flat repair included

| Line | Cost | Price | Notes |
|---|---|---|---|
| Technician time per repair | | n/a | Catalog starting price is $35 per tire |
| Patch and materials | | n/a | |
| Rebalance after repair | | n/a | Included in the catalog description |
| Cap: repairs per tire, term `[REPAIR_TERM]` | | n/a | |
| Expected repairs per set over the term | | n/a | |
| Added to the install price? (yes, no) | | | If no, the shop absorbs the cost |

### 6.4 Road-hazard plan (third-party)

| Line | Answer | Source |
|---|---|---|
| Provider name `[ROAD_HAZARD_PROVIDER]` | | Provider |
| Wholesale cost per tire or per set | | Provider |
| Retail price Justin would charge | | |
| Term and what it covers, in the provider's words | | Provider's terms page |
| Exclusions in the provider's words | | Provider's terms page |
| How a claim starts and who handles it | | Provider |
| Is the provider licensed in Florida for this product? | | Provider; Florida lawyer |
| Does ATD or a tire maker already offer a program? | | ATD (#B1) |

### 6.5 Install bundle

| Line | Cost | Price |
|---|---|---|
| Installation (starting catalog price $25 per tire) | | |
| Rotation and balance plan (6.2) | | |
| Flat repair included (6.3) | | |
| Bundle price (must equal the sum, or be its own line) | n/a | |

---

## 7. Read-only Chrome prompts (each stops before any apply, save, publish or payment)

Run one at a time, in Claude in Chrome. Each one changes nothing. If any screen asks for bank,
identity or card details, or shows a button such as Activate, Apply, Sign up, Save, Send,
Publish, Create or Pay, the prompt tells Chrome to stop and report.

**P1. Shopify payments and installment settings: read only.**

```
In the Shopify admin for the TireDrop store (the store behind shop.tiredroponline.com):

TASK: Report how payments and installments are set up. CHANGE NOTHING. Do not save,
activate, deactivate, edit, apply or enter any bank, card or identity detail. Do not press
Activate, Apply, Save, Publish, Pay, Refund, Capture or Send anywhere. If a screen asks for
any of that, stop and say so.

1. Open Settings > Payments. Report the provider shown and whether it says Active.
2. Open the Shopify Payments page. Report, exactly as written on screen:
   - whether Shop Pay and Shop Pay Installments are listed, and whether each says
     active, available or not available (copy the status text)
   - for Shop Pay Installments: the minimum and maximum order size shown, if any; any
     fee text shown to the merchant; and when the merchant is paid (copy the text)
   - the card rates shown for online payments, if any
   - any other pay-later or installment methods listed
   - the dispute (chargeback) fee, if shown
3. Report any banner or notice on those pages that mentions installments.

REPORT BACK as a list of exact quotes. Do not summarise numbers.
```

**P2. Does the installment option show on an invoice? Look only, send nothing.**

```
In the Shopify admin for the TireDrop store:

TASK: Check what a customer would see for payment options on a draft-order invoice.
CHANGE NOTHING. Do NOT press Send invoice, Collect payment, Create order, Mark as paid,
Save or Delete. Do not email anyone. Do not create a draft order or edit one.

1. Open Orders > Drafts. Open one existing draft (any). If there is none, stop and say so.
2. Look at the payment area of the draft and any "preview invoice" or "payment link" view
   Shopify offers WITHOUT sending anything. Report whether any pay-over-time or
   installment option is listed or mentioned there, copying the exact text.
3. If the only way to see it is to send or pay, stop and report "cannot verify without
   sending".
4. Close the draft without saving.

REPORT BACK what you saw, as exact quotes, or "cannot verify without sending".
```

**P3. A pay-later or lender provider's own pages: read only, stop before sign-up.**

```
Open the public website of [PROVIDER NAME] (Justin: the provider you are curious about).

TASK: Read the merchant pages only. CHANGE NOTHING. Do not click Apply, Sign up, Get
started, Contact sales, Create account or Submit. Do not type any detail into any form.

Report, with the page's address, as exact quotes:
1. What the provider says merchants pay (rates and fees), if shown.
2. Order-size limits for customers, if shown.
3. Whether the provider says the merchant is paid up front, and when.
4. Any requirement for the merchant (store type, volume, approval) the page states.
5. The provider's disclosure wording merchants must show customers, if the page gives it.
6. Whether a Shopify checkout integration is described, and how.

If a number is not on the page, say "not shown". Do not guess.
```

**P4. A road-hazard provider's own pages: read only, stop before sign-up.**

```
Open the public website of [PROVIDER NAME] for tire road-hazard or tire protection plans.

TASK: Read only. CHANGE NOTHING. Do not click Apply, Become a dealer, Get a quote,
Sign up, Contact or Submit. Do not type any detail into any form.

Report, with the page's address, as exact quotes:
1. What the plan covers and what it does not (the exclusions list).
2. The term and whether the credit is pro-rated, and how.
3. How a customer files a claim and who handles it.
4. Whether the plan is sold through shops like ours, and how, as the page says.
5. Any licence, insurer or administrator named on the page.
6. Anything about Florida.

If a point is not on the page, say "not shown". Do not guess.
```

**P5. Questions to send ATD (not a Chrome step).** Add to the existing ATD list (#B1):
does the distributor or any tire maker already offer a road-hazard or protection program that a
dealer can pass on to a buyer; what is the claims path; and does the distributor's return or
warranty handling change when the order is paid through an installment plan.

---

## 8. What was and was not verified

| Claim | Source | Status |
|---|---|---|
| The Financing page content, form fields, form route and handler | `FinancingPage.jsx`, `api/forms.js` read in full | VERIFIED in code |
| Returns, warranty and road-hazard text on `/terms` | `LegalPage.jsx` sections 9 and 11, trust draft table | VERIFIED in code |
| Service starting prices | `src/data/services.js`, `src/data/products.js` | VERIFIED in code (they are "from" prices) |
| Checkout is request-only, invoice after the call | checkout options brief (branch `preview/wave2-checkout-options`) | VERIFIED in that brief; not re-run against the live store |
| Shopify Payments is on, test mode off | The checklist and the checkout brief | Justin's word, not seen in the admin |
| Shop Pay Installments requirements, order limits, plan shape | Search snippets only (Shopify's help pages are blocked from this sandbox) | UNVERIFIED; the snippets disagree ($50 to $20,000 vs $35 to $30,000) |
| It shows on a Shopify draft-order invoice page | Nobody has looked | UNVERIFIED (prompt P2) |
| Merchant fees, payout timing, who funds the credit, for any provider | None read | UNVERIFIED (prompts P1, P3) |
| How a road-hazard plan works | One search snippet quoting a tire maker's non-US page | UNVERIFIED for a US third-party plan (prompt P4) |
| Credit advertising, state installment and service-agreement rules, tax on plans | General knowledge, no source read (government sites blocked) | UNVERIFIED; flagged for an accountant or lawyer, not given as advice |
| What ATD's terms already cover | Open question #B1 | UNKNOWN |

---

## 9. Decisions I need from Justin

1. **Pay over time: yes or no?** If yes, is Option A (Shopify's own installment option, provider-neutral copy) the one? If he prefers another, say which (B, C or D).
2. **Run prompts P1 and P2**, and send the answers back. They decide whether the Financing page wording stays as it is or changes to "when you pay".
3. **Provider name on the site: keep "Shop Pay Installments" on `/financing`, or make it provider-neutral?** (The house rule says no provider names; the page already has one.)
4. **Tone for the pay-over-time lines:** Safe, Balanced or Direct, per placement (2.3). Include the optional tire card link, or product page and cart only?
5. **Financing page hero button:** switch to "Find your tires" with the request form second, yes or no?
6. **Rotation and balance plan:** start selling it on the confirmation call (no code), yes or no? If yes, fill in worksheet 6.2 and decide term and visits.
7. **Flat repair included:** publish as a promise, yes, no or not yet? If yes, fill in 6.3 and the term.
8. **Road hazard:** no on the site for now, ask ATD first (P5), or look at one provider (P4)? This is the open D1 question; the answer also unlocks the trust file.
9. **Install bundle:** build it, or keep the plan as a separate line? A bundle is the same price as the parts (no discount) unless Justin says otherwise.

When these are answered, Forge's sheet in section 5 is a build with the gates and screenshots at
390 and 1440, and the open checklist item ticks.
