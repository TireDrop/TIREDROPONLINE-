# Trust strip and returns policy: drafts, waiting on D1

Status: DRAFT. Nothing in this file is live. It ships no site change; only docs.
Written 2026-10-04 by Hook (conversion). Branch `preview/wave1-trust-draft`.

Why it exists: a buyer deciding on a $600+ set of tires online looks for the
return terms, who stands behind the fit, and a real shop to call. The site
answers part of that today, in prose, far from the buy button. Justin has not
yet answered D1 in [2026-10-02-justin-remaining.md](../prompts/2026-10-02-justin-remaining.md),
so every number below is a placeholder in square brackets. Nothing here
invents a policy. When D1 arrives, section 5 is the 30-minute job.

How to use it:

1. Read section 1 (what is already promised) so nothing new contradicts it.
2. Answer the questions in the table in section 2a (they are D1 plus two small ones).
3. Pick Safe, Balanced or Direct per sentence in section 3 (or mix).
4. Hand this file back; section 5 says exactly where each answer goes.

---

## 1. What the site already says (do not contradict)

Published today, checked in the code on main (a105550):

| Topic | Already published | Where |
|---|---|---|
| Returnable condition | Tires and wheels must be unused and uninstalled, original condition, labels, chalk marks and packaging intact. | `src/pages/support/LegalPage.jsx`, section 9 (`id: "returns"`) |
| Mounted tires | Not returnable, "even if it was never driven on", described as the distributor's rule. Repeated across the FAQs, the state pages and two blog posts. | LegalPage 9; `ShippingPage.jsx` (damaged FAQ and the "Do not mount it" card); `NationwideShippingPage.jsx` (`HUB_STEPS` and `HUB_FAQ`); `HomePage.jsx` FAQ; `src/data/statePages.js` (`bring`); two blog posts (`get-tires-installed-after-buying-online.md`, `how-old-are-tires-bought-online.md`) |
| Return window and restocking fee | Not stated as numbers. "Call us before you buy ... both are set by the distributor the item ships from, and we will confirm them on your order." | LegalPage 9, first list item |
| Return shipping | "Generally the customer's cost" on change of mind; ours if we sent the wrong thing. | LegalPage 9 |
| Special orders | "May not be returnable once placed. We will say so before we order." | LegalPage 9 |
| Refund method | Back to the original payment method. There is also one sentence about financed orders; keep it as written. | LegalPage 9 |
| Authorization | "Do not send anything back before you speak to us." | LegalPage 9; FAQs say "once we've authorized the return" |
| Cancel before shipping | Call early; once placed with the distributor or shipped, it is handled as a return. | LegalPage 9 |
| Unavailable or wrong price | Offered a comparable alternative, a revised date, or a full refund. Never a silent substitution. | LegalPage 3 and 4; `ShippingPage.jsx` FAQ and card |
| Damaged, wrong, missing | Call the day it arrives; photograph first; our error or a shipping problem is fixed at no cost (replacement or refund). Exact claim deadline "told when you call". | LegalPage 10; ShippingPage FAQ |
| Fitment | "Shared job": the customer owns the final choice; our help is "advice given in good faith". Separately: "We confirm fitment before your order ships." and "We'll confirm fitment by phone before your order ships." | LegalPage 5; `src/components/shop/Fitment.jsx` (`CONFIRM_LINE`); `CartPage.jsx` (`PHONE_CONFIRM_NOTE`) |
| Manufacturer warranty | Comes from the maker, not from us; we help file a claim. Mileage warranties usually need documented rotations and correct inflation. Product pages show the maker's treadwear figure (`product.warranty`). | LegalPage 11; `ProductPage.jsx` |
| Road hazard | Listed as NOT a workmanship issue. No road-hazard product is offered or mentioned as available. | LegalPage 11 |
| Workmanship | "We stand behind the work our technicians perform." | LegalPage 11 |
| Shipping and install facts | Free shipping to the 48 contiguous states and DC, no minimum; free ship-to-store at the Sunrise shop; install only in Miami-Dade, Broward and Palm Beach. | `src/data/business.js`; `ShippingPage.jsx` |
| Trust tiles | Cart already shows three: Ships nationwide, Fitment checked first, Powered by Extreme Tires (phone). | `CartPage.jsx` (`TRUST`) |
| Footer link | "Returns & Refunds" goes to `/terms#returns`; `/policies/refund-policy` redirects there. | `business.js`, docs/ops/deploy.md |
| Shopify's own refund policy | Prompt 6 copies the terms text into Shopify. If D1 changes the terms, that copy must be redone. | docs/business/shopify-admin-prompts.md, prompt 6 |

Missing (what a buyer cannot learn today):

- How many days they have, and whether a fee applies. Today the answer is "call us".
- Any fitment promise: what happens if we confirmed the size and it is still wrong.
- Whether road-hazard coverage exists, and from whom.
- Links to each maker's own warranty page from the tire page.
- Any of the above near the Add to Cart button, the cart total or checkout. Terms sit only in `/terms` and the shipping FAQ; the product page has a phone line and nothing about returns.

Constraint to keep in mind: the current text says the window and fee are
"set by the distributor". ATD's real return terms are still an open question
(#B1 item 12, "Returns: how do returns and damaged deliveries work on Ship to
Home?"). If Justin sets a fixed window or fee that is more generous than the
distributor's, the shop absorbs the difference. That is a spending decision and
stays Justin's.

---

## 2a. One-page table: question, where answered today, needed from Justin

| # | Question | Where it is answered today | Needed from Justin |
|---|---|---|---|
| 1 | How many days to return unmounted tires? `[RETURN_DAYS]` | Nowhere. LegalPage 9 says "call; set by the distributor". | A number of days, counted from the day the order is delivered (or the day it is checked in, for ship-to-store). Or "keep it distributor-set" (then the page stays as is, see model B). |
| 2 | Restocking fee? `[RESTOCKING_FEE]` | Nowhere (same line). | None / a percent / a flat amount. Does it apply when the shop made the mistake? (Draft assumes no.) |
| 3 | Are mounted tires returnable? `[MOUNTED_TIRE_RULE]` | Published as "not returnable" in many places (section 1). | Confirm "no returns once mounted". If any exception exists (for example a defect found after mounting is a warranty claim, not a return), say which. |
| 4 | Who pays return shipping? | "Generally the customer's cost; ours if we sent the wrong thing." | Confirm, or give a rule. |
| 5 | Road hazard: do you sell it, from whom? `[ROAD_HAZARD_PROVIDER]` | Not offered. LegalPage 11 only says road hazard is not workmanship. | Yes with provider name and what the shop tells customers, or No. (If Yes: also where it is sold and how a claim starts.) |
| 6 | Fitment promise `[FITMENT_REMEDY]` | LegalPage 5: help is "advice in good faith"; responsibility stays with the buyer. Fitment is confirmed by phone before shipping. | Pick A (no promise, keep as is), B (if we confirmed the size and it is wrong, we make it right: exchange for the right size, or refund), or C (B, plus we cover return shipping). Also: does the promise apply to wheels? |
| 7 | Refund timing | "Back to the original payment method." | Optional. State a number of business days after we receive the tires, or leave it unsaid. |
| 8 | Damage claim deadline | "We will tell you the exact deadline when you call." | Optional. A number of days if the shop wants it printed. |
| 9 | Who answers phone returns requests, and when? | Hours are published (Mon to Fri 8:00 AM to 6:30 PM, Saturday 8:00 AM to 4:00 PM). | Confirm the same hours apply to returns calls. |

Not asked, because it needs no answer: maker warranty links. Claude adds each
maker's own warranty page from the maker's site once D1 is in (the sandbox
blocks most outside sites, so those links must be read and checked live, not
guessed).

---

## 3. Draft Returns and refunds policy

This replaces section 9 of `/terms` ("9. Returns, cancellations and
refunds"). Lines marked **KEEP** are already published and stay word for word.
Lines marked **NEW** carry a placeholder and need a pick. Placeholders:
`[RETURN_DAYS]`, `[RESTOCKING_FEE]`, `[MOUNTED_TIRE_RULE]`,
`[ROAD_HAZARD_PROVIDER]`, `[FITMENT_REMEDY]`. A line with an unanswered
placeholder must not be published; use the fallback (model B) until it is
answered.

Tone names: Safe = cautious and hedged, Balanced = plain, Direct = shortest
and firmest. They are labels for tone only; none of the copy below calls any
tire safe.

### 3.0 Two models for the window and fee

- **Model A, a fixed shop policy.** The site states `[RETURN_DAYS]` and
  `[RESTOCKING_FEE]`. Best for conversion: it answers the buyer's first
  question. Needs Justin to confirm it holds on every distributor order.
- **Model B, distributor-set (today's text).** Keeps the current "we will
  confirm on your order" wording. Zero risk, zero lift. This is the fallback
  while D1 is open.

### 3.1 Opening and cancellation (KEEP)

> If you want to cancel, call as early as you can. Once an order has been placed with the distributor or has shipped, it can no longer simply be stopped, and it has to be handled as a return.

### 3.2 Return window (NEW, model A)

- **Safe:** "You can ask to return unused, unmounted tires and wheels within [RETURN_DAYS] days of the day your order is delivered. Call us first; we authorize every return, and we tell you where to send it."
- **Balanced:** "Unused, unmounted tires and wheels can be returned within [RETURN_DAYS] days of delivery. Call us first and we will authorize the return and tell you where to send it."
- **Direct:** "[RETURN_DAYS] days to return unused, unmounted tires and wheels. Call us first."

(Ship-to-store orders: the day we check the order in at the shop counts as
delivery. Justin to confirm.)

### 3.3 Restocking fee (NEW, model A)

- **Safe:** "A restocking fee of [RESTOCKING_FEE] may apply to a change-of-mind return. We tell you the exact amount before you send anything. There is no fee when we sent the wrong item or it arrived damaged."
- **Balanced:** "Change-of-mind returns carry a restocking fee of [RESTOCKING_FEE]. There is no fee when we sent the wrong item or it arrived damaged."
- **Direct:** "Change of mind: [RESTOCKING_FEE] restocking fee. Our mistake or damage in transit: no fee."

If the answer is no fee: replace each with "There is no restocking fee." (one
line, any tone).

### 3.4 Mounted tires (KEEP wording, confirm `[MOUNTED_TIRE_RULE]`)

Today's published rule, which stays unless Justin says otherwise:

> To be returnable, tires and wheels must be unused and uninstalled, in original condition, with any labels, chalk marks and packaging intact. Once a tire has been mounted on a wheel it is not returnable, even if it was never driven on. That is the distributor's rule, not one we invented, and it is why the fitment conversation matters.

Variants of the closing line (only if the "distributor's rule" attribution
changes, which depends on ATD's answer in #B1):

- **Safe:** "Once a tire is mounted on a wheel it cannot be returned, so check the size, load index and speed rating against your order before anything goes on a wheel."
- **Balanced:** "Mounted tires cannot be returned. Check the size, load index and speed rating on the sidewall against your order first, or bring it to us and we will check it with you."
- **Direct:** "Mounted means final. Check the sidewall against your order before anything is mounted."

If Justin allows an exception, add one line: "[MOUNTED_EXCEPTION]". Leave it
out otherwise.

### 3.5 Return shipping, special orders, refunds (KEEP)

> Return shipping on a change-of-mind return is generally the customer's cost; if we sent the wrong thing, it is ours.
>
> Special orders and custom wheel or tire packages may not be returnable once placed. We will say so before we order.
>
> Refunds go back to the original payment method. (Keep the existing financed-order sentence that follows it.)
>
> Do not send anything back before you speak to us. Returns need to be authorized and routed to the right place, or they can be refused on arrival.

If row 7 of the table is answered, add: "We send the refund within `[REFUND_BUSINESS_DAYS]` business days of receiving the tires." If not, add nothing.

### 3.6 Fitment promise (NEW, pick A, B or C; replaces nothing, adds to section 5 or 9)

- **A. No promise (today).** Keep LegalPage 5 as is. Nothing to add.
- **B. We make it right.**
  - **Safe:** "If we confirmed your size with you by phone or in writing and it turns out not to fit, call us before anything is mounted and we will [FITMENT_REMEDY]."
  - **Balanced:** "If we confirmed the size and it turns out to be wrong, we will [FITMENT_REMEDY]. Call us before anything goes on a wheel."
  - **Direct:** "We confirmed it, it was wrong: we fix it. [FITMENT_REMEDY]."
- **C. B, plus return shipping paid by us** (add "and we cover the return shipping" to `[FITMENT_REMEDY]`).

`[FITMENT_REMEDY]` examples: "exchange it for the right size" / "refund the
order". Do not use the word "guarantee" in the public wording: the fitment
check itself never calls a tire guaranteed (`src/data/fitmentCheck.js`), and
this promise is about getting the size right, not about the tire.

Boundaries to keep in the copy, because they are already published: the buyer
still owns the final choice; the promise only covers sizes we confirmed;
non-standard setups (lift kits, big brake kits, spacers) must be disclosed
before the order (LegalPage 5).

### 3.7 Road hazard (NEW, pick the branch that matches the answer)

- **If Justin sells coverage:** "Road-hazard coverage is available from [ROAD_HAZARD_PROVIDER]. It is that provider's product with its own terms; ask us for them before you buy."
- **If not:** "We do not sell road-hazard coverage. Check the tire maker's own warranty for exactly what it covers."

Either way the existing LegalPage 11 sentence stays: road hazard damage is not
a workmanship issue.

### 3.8 Manufacturer warranty (KEEP, add links later)

LegalPage 11 already says maker warranties belong to the maker and we help file
a claim. Add after D1: "Each maker's own warranty page: `[MAKER_WARRANTY_LINKS]`."
These are links to tire and wheel makers only, read and checked when added.

---

## 4. Trust strip for tire pages

A row of four short tiles, for the product page under the price and Add to
Cart (replacing the plain "Ships anywhere" text line), and reused in the cart.
Every tile is already true and published today.

| # | Title | One line | Source of the fact |
|---|---|---|---|
| 1 | Free shipping | Free to the 48 contiguous states and DC, no order minimum. | `business.js` (`shipping.area`); ShippingPage FAQ; LegalPage 6 |
| 2 | Fit checked first | We confirm fitment before your order ships. | `Fitment.jsx` (`CONFIRM_LINE`); cart notes |
| 3 | Installed in South Florida | Ship free to our Sunrise shop, or book the mobile van in Miami-Dade, Broward and Palm Beach. | `serviceArea.js`; `business.js`; LegalPage 7 and 8 |
| 4 | A real shop, a real phone | Extreme Tires, 7712 West Oakland Park Blvd, Sunrise. Call (954) 773-1896. | `business.js` (`shop`, `phone`) |

Policy slots (render only once answered; never show a placeholder or an empty
tile). Built as a second, optional line of chips under the four tiles:

| Slot | Chip text (Balanced) | Shows when |
|---|---|---|
| Returns | "[RETURN_DAYS]-day returns on unmounted tires. Call first." | `[RETURN_DAYS]` is a number and the page 9 text is live. |
| Fitment | "If we confirmed the size and it is wrong, we [FITMENT_REMEDY]." | Fitment promise B or C is chosen. |
| Road hazard | "Road-hazard coverage from [ROAD_HAZARD_PROVIDER]. Ask us." | Justin sells it. |

Rules for the build:

- The slots read from one object, for example `TRUST_POLICY = { returnDays: null, fitmentRemedy: null, roadHazardProvider: null }` next to `BUSINESS` in `src/data/business.js`. A null renders nothing, in the prerendered HTML as well. The strip then ships dark and lights up when Justin's answer is typed in.
- Layout: 2 by 2 tiles at 390px, one row of four at 1440px; chips stack full width. Icons from lucide, as the cart does. Tokens only (ink, bone, drop, smoke); no new colors. No motion. No layout shift: fixed tile heights, text always present in the HTML.
- Each chip links to `/terms#returns` (or `#fitment`, `#warranties`) so the policy is one tap away. Tap targets 44px.
- No ratings, review counts, "since" years, price promises or delivery times. Do not add Google or Yelp tiles until the real review link exists (#A9).
- Measure: a `trust_strip_view` event once per page (`oncePerPage` in `src/lib/analytics.js`) and a `policy_link_click` event with a `slot` param. Compare product-page to add-to-cart rate and cart to begin-checkout rate for two weeks before and after. The clean test is the day the Returns chip first appears, since the four base tiles say nothing new.

Expected effect: the four base tiles mostly move trust from the cart (where it
already is) up to the product page. The real lift is the Returns chip. Today a
buyer who needs the window has to leave the page and read `/terms`.

---

## 5. When D1 arrives: files and sections to change (about 30 minutes)

| Where | File and section | Change |
|---|---|---|
| Returns policy | `src/pages/support/LegalPage.jsx`, `DOCS.terms` section `id: "returns"` ("9. Returns, cancellations and refunds"), first list item | Replace the "call us, set by the distributor" item with 3.2 and 3.3 (model A); keep model B text if not answered. Bump `LAST_UPDATED`. Update the NOTE FOR THE BUILD TEAM comment at the top (the return-window bullet) and the "Section 9 used to say" comment. |
| Fitment promise | same file, `id: "fitment"` ("5. Fitment is a shared job"), second paragraph | Add the chosen 3.6 variant right after "advice given in good faith"; keep the sentence that the buyer owns the final choice. |
| Road hazard and warranty | same file, `id: "warranties"` ("11. ...") | Add 3.7 after the road-hazard sentence; add `[MAKER_WARRANTY_LINKS]` per 3.8. |
| Key policies cards | same file, `KEY_POLICIES` (returns card copy) | Change "What can go back, what cannot..." only if it now states the window, for example "[RETURN_DAYS] days, what cannot go back, who pays the freight". |
| Product page | `src/pages/shop/ProductPage.jsx` (the `mt-5 flex flex-wrap` line with the warranty and "Ships anywhere" spans, about line 775) | Replace with the trust strip (section 4). Add the maker warranty link next to `product.warranty` once links exist. |
| Cart | `src/pages/shop/CartPage.jsx`, `TRUST` array and its render (about line 539) | Replace the 3 tiles with the 4 from section 4; render the chips from `TRUST_POLICY`. |
| Checkout | `src/pages/shop/CheckoutPage.jsx` (summary column, near the free-shipping note at about line 1358) | Add one line under the total linking to `/terms#returns` with the chip text. No new fields. |
| FAQ copy | `src/pages/HomePage.jsx` (`FAQ`, "Can I return tires?"), `src/pages/shipping/NationwideShippingPage.jsx` (`HUB_FAQ`, same question; `HUB_STEPS` step 2), `src/pages/ShippingPage.jsx` (`FAQ`, damaged-delivery answer; "Do not mount it" card) | Add the window and fee to the "Can I return tires?" answer. Leave the mounted-tire sentences if the rule is unchanged. Do not add a new FAQPage; `check:schema` rejects it. |
| State pages and blog | `src/data/statePages.js` (`bring`), blog posts `get-tires-installed-after-buying-online.md` and `how-old-are-tires-bought-online.md` | Only if the mounted-tire rule changes. |
| Shopify's own policies | Shopify admin, Settings, Policies, Refund policy (prompt 6 in docs/business/shopify-admin-prompts.md) | Re-paste the new section 9 text and the damaged-items section. Chrome prompt, Justin's click. |
| Launch checklist and docs | `docs/LAUNCH-CHECKLIST.md`; docs/prompts/2026-10-02-justin-remaining.md (#D1) | Tick and strike the "Returns window + warranty/road-hazard links" item and the draft item; bump "Last updated". |

Gates for the follow-up (code, so the full fast set): lint, unit tests, build,
`check:schema`, `check:sources`, and the browser checks `check:a11y`,
`check:prerender`, `check:home`. Screenshots at 390 and 1440 of the product
page, cart and checkout before and after.

---

## 6. House-rule check on this draft

- No discount, coupon, rebate, deal or price promise. No invented numbers: every figure is a placeholder, or a fact already published (48 states and DC, the shop address, the phone, the counties, the hours).
- No claim that any tire is safe, fine or OK. No delivery or arrival dates. The day-counts are policy windows, not delivery times.
- No finance terms and no owner names. No other retailers or installers are named or linked.
- Facts about distributors are limited to what the site already says; ATD's real return terms are unknown until #B1.
- Not verified: nothing here was checked on the live site or against a distributor; the sandbox blocks most outside sites. Everything in section 1 was read from the code on main.
