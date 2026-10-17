# ATD supplier facts (from ATD's own documents)

Source: ATD's "eComm Onboarding Deck 2026" and "Consumer Direct Drop Ship
Fulfilment Process and Support 2026", both sent to Justin by ATD on 2026-10-17.
Only what those two documents say is here. Anything they do not say is listed at
the bottom as a question for ATD. Nothing on this page is customer-facing copy;
the house rules (no delivery dates, no deals) still decide what the site says.

## Who to call

| What | Contact |
| --- | --- |
| Customer service (orders, returns, RMAs) | ECommOrders@ATD.com, 844-283-3173, 8 AM to 5 PM Eastern |
| Director of Sales | Brian Moyer, BMoyer@atd.com |
| Customer Integrations Manager | Mike Olean, MOlean@atd.com |
| Business Development Manager | Rebecca Price (deck lists RKratz@atd.com) |
| Account and order history | www.atdonline.com or https://www.atdradius.com/login, with live chat in business hours |

The phone line reaches only the dedicated ship-to-home group.

## Network and coverage

- 110 distribution centers, 10 of them regional; an eComm customer can sell from the whole network.
- Delivers across the US, **Alaska and Hawaii restricted**. This matches our "48 contiguous states + DC" promise.
- On order entry ATD takes the customer's zip code and assigns the closest DC that has the stock (the fulfilment document says the one with the fastest shipping time and lowest freight cost).
- Everything runs through the ATDConnect API: pull data, place orders, check order status.

## What ATD charges us to ship (our cost, not the customer's price)

ATD offers three ways: your own FedEx account number, ATD's FedEx account at the net rate (by weight, size and distance), or ATD's **flat rate matrix** (the one ATD says is used most, because it is easy to predict).

FedEx Ground, flat rate matrix, by package weight:

| 0-25 lb | 25.01-30 | 30.01-50 | 50.01-75 | 75.01-100 | 100.01-150 |
| --- | --- | --- | --- | --- | --- |
| $17.00 | $20.00 | $25.00 | $43.00 | $125.00 | $140.00 |

- Limits: up to 150 lb, 108 in long, 165 in length plus girth. Over 150 lb or 165 in is not eligible for FedEx.
- Standard Ground only. **No signature-required option.**
- Same-day shipping cut-off: 3 PM local time.

## Local delivery (ATD OneRail and FLXFWD)

- For a customer within about 35 miles' driving distance of a DC that has the product. Not for marketplaces.
- OneRail is residential; FLXFWD adds commercial addresses, so an order delivered to an installer or shop within 35 miles also qualifies. Same fees.
- Cut-offs: same day 11 AM local, next day 10:30 PM local.
- Local Plus inventory is eligible.
- A "Preview Order" call shows eligible orders as "ATD Route Truck" with the freight cost.

| Weight | Flat local rate |
| --- | --- |
| 0-20 lb | $7.00 |
| 20.01-40 lb | $12.00 |
| 40.01 lb and up | $18.00 |

## How an order moves

1. We send a PO through ATDConnect.
2. If everything is in stock: ATD picks, registers DOT numbers, makes labels, ships and closes the order. Poll the order until tracking and close arrive; ATD says this takes 1 to 2 hours in business hours.
3. Short pick: ATD's service team finds the missing items and resubmits. If the shipping DC has none, send ATD the order number and an alternate DC number to move it. If it is not available anywhere, ATD sends a cancellation.

## Cancelling

ATD's warehouse system starts on an order 30 minutes to 2 hours after confirmation, so cancel fast. Two ways: tick "Cancel Item" in the order history at ATDOnline/Radius, or two API calls: a cancel-eligibility check (true or false), then cancel-order. Test host `sthuat.atdconnect.com`, production host `sth.atdconnect.com` (path `/rs/1_1/order/...`).

## Returns

| Case | Who handles it |
| --- | --- |
| Customer refuses, address unavailable | The carrier takes it back to the DC. Still contact ATD so they issue the RMA. |
| ATD error (mis-boxed, wrong finish, mis-shipped) | Send ATD the reason, item, quantity and method. ATD issues call tags and credit. |
| Customer's reason (wrong info, changed their mind) | **We** bring the product back, then ask ATD for an RMA and the return DC. |

To get an RMA email ECommOrders@ATD.com with the PO in the subject and the ATD part number, quantity and reason in the body. An RMA is specific to one DC, and its number must be on the return label. Returned tires are inspected for new, resaleable condition; denials are explained by ATD.

## Marketing support listed by ATD

Manufacturer associate dealer programs, ATD's loyalty program (Partner Program, Brand Ignition), digital assets, instant savings and consumer rebates. These are ATD programs; our house rule of no discounts or rebates on the site still applies.

## Onboarding steps

Intro call (done) → NDA → API documentation → integration loading → 3 test orders → review call → go live.

## What this means for TireDrop (Claude's read)

- **Free shipping vs the cost table.** The site promises free shipping to the 48 states + DC. If ATD bills us a per-package rate, a set of four tires boxed together is far above $17, and the 75 to 150 lb tiers are $125 to $140. Whether a set ships as one package or four, and what ATD actually charges per tire, is not in these documents. Confirm before launch (question 1 below).
- **No delivery promises.** OneRail same-day and next-day are real but limited to about 35 miles of a DC and to inventory; our rule is no delivery or arrival dates, so the site does not mention them.
- **Alaska, Hawaii, territories** are not served by ATD. The site and chat already say call first.
- **Shopify shipping setup** is in `docs/business/shopify-admin-prompts.md` prompt 28.

## Questions for ATD (not answered in these documents)

1. Is the flat rate charged per package, per tire, or per order? Do four tires ship as one package?
2. Which tire sizes weigh in which tier? Is a weight per SKU in the API?
3. Do we use the flat rate matrix, our own FedEx account or the net rate? (Our choice; pick before the 3 test orders.)
4. Is there a minimum order, a handling or restocking fee, or a freight surcharge for oversize tires?
5. Does "Preview Order" return the freight cost for the flat rate matrix too, or only for local delivery?
6. Cancellation cut-off in practice for FedEx orders.
