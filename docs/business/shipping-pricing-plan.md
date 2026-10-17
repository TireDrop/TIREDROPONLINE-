# Shipping pricing plan (decision pending ATD's answers)

Status: **site unchanged, still free shipping to the 48 states + DC.** Justin asked on
2026-10-17 whether shipping can be marked up while keeping free shipping above an
amount, and what other tire sellers do. This page holds the answer, the numbers to
decide with, and what to change when the decision is made.

## Short answer

Yes, shipping can carry a markup and free shipping can start above a threshold. But
for tires the threshold barely matters (one tire is already above $100), and the
other online sellers lead with free shipping. Recommendation: **keep "free shipping"
as the headline, price the freight into the tire margin, and charge shipping only
where it is clearly large (heavy or oversize orders).** Decide the exact rule once ATD
answers the per-package question.

## What other sellers do (checked 2026-10-17, pages change; recheck before copying)

| Seller | Policy found |
| --- | --- |
| Tire Rack | Free shipping on orders over $50; "exclusions apply", not listed |
| SimpleTire | Free shipping, no order minimum, contiguous US |
| Tires Easy | Free on most tires to a home or partner installer; very large or heavy tires $40 to $120 per order, shown before checkout |
| Discount Tire | No shipping policy found |

Sources: tirerack.com/delivery-installation/home-shipping, tirereview.com (SimpleTire
free shipping), tires-easy.com/free-shipping.

## What ATD charges us (docs/integrations/atd-supplier-facts.md)

Flat matrix by package weight: 0-25 lb $17, 25.01-30 $20, 30.01-50 $25, 50.01-75 $43,
75.01-100 $125, 100.01-150 $140. Local delivery within about 35 miles of a DC: $7 (to
20 lb), $12 (to 40 lb), $18 (over 40 lb).

## Cost per order under each reading of ATD's flat rate

ATD has not said if the rate is per package, per tire or per order. Weights below are
an assumption (a typical passenger tire is roughly 20 to 30 lb; ask ATD for real
per-SKU weights). Costs are what ATD bills us, not a customer price.

| Order | One box (all tires together) | One box per tire |
| --- | --- | --- |
| 1 tire at about 25 lb | $17 to $20 | $17 to $20 |
| 2 tires at about 25 lb | about 50 lb: $25 to $43 | $34 to $40 |
| 4 tires at about 25 lb | about 100 lb: $125 to $140 | $68 to $80 |

Either way a set of four can cost $70 to $140 to ship, which is a big share of the
margin on a $120 to $200 tire. This is why the per-package answer decides the policy.

## Options

1. **Free shipping stays, cost built into the tire price** (recommended). Matches
   SimpleTire and most of Tires Easy. Nothing on the site changes except possibly the
   tire prices.
2. **Free shipping on 4 tires, flat fee on 1 to 3.** Protects margin on small orders;
   needs a fee amount from the cost table and one-line changes everywhere "free
   shipping, no minimum" is written.
3. **Charge ATD's matrix plus a markup.** Most exposed: a $125 to $140 fee on a set
   would send shoppers to sellers who advertise free shipping.
4. **Free shipping, but a surcharge for heavy or oversize tires** (Tires Easy style).
   Needs per-SKU weight from the ATD API.

## If shipping changes: what to edit (one pass, one branch)

Not done. About 28 files under `src/` say free shipping, including the pages
`HomePage`, `ShippingPage`, `NationwideShippingPage`, `StateShippingPage`,
`CartPage`, `CheckoutPage`, `ProductPage`, `TiresPage`, `Footer`, `statePages.js`,
`pricing.js` and `cityPages.js`, the `Shipping` title in `api/_lib/shopify.js`
(the $0 "Free Shipping" draft-order line), the chat prompt in `api/_lib/chat.js`, the
chat widget, the Shopify shipping zones (Chrome prompt 28 in
`docs/business/shopify-admin-prompts.md`), the Shipping policy text in Shopify,
title tags and JSON-LD that say "free shipping", and the blog pages that mention it.
Use `grep -ril "free shipping"` to rebuild the list. House rule 'free shipping covers
the 48 contiguous states + DC' in CLAUDE.md changes with it.

## Next

1. Justin sends the email to ATD (Mike Olean) with the six shipping questions.
2. With the answer, fill in the table above with real numbers and pick an option.
3. Then one build: site copy, checkout line, chat, Shopify zones, tests.
