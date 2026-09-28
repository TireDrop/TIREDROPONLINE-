# ATD forwarder (paid Shopify orders → ATD orders)

**Status: built and unit-tested with a mocked Shopify and a mocked ATD.
Never run against a real store or against ATD.** It is **off** until
`ATD_ORDERING_ENABLED=true`, and even then it places nothing until ATD's
order endpoint is confirmed and filled in (`ENDPOINTS.placeOrder` in
`api/_lib/atd.js` is `null`).

What it does: every 5 minutes a Vercel Cron job looks at Shopify for paid
TireDrop orders, places each one with ATD **once**, and writes the result
back onto the Shopify order (tags, metafields, the order note), so the whole
story is visible in **Shopify → Orders**. When ATD ships, it copies the
tracking number into Shopify and Shopify emails the customer.

Code: `api/_lib/forwarder.js` (the sweep), `api/_lib/atd.js`
(`placeAtdOrder`, `getAtdOrderStatus`, `cancelAtdOrder`),
`api/cron/atd-sweep.js` (the cron endpoint). Tests:
`api/_lib/forwarder.test.mjs`.

## Flow

```
 Shopper pays on Shopify checkout (draft order → real order, tag vercel-live)
        │
        ▼
 Vercel Cron, every 5 min ── GET /api/cron/atd-sweep  (Authorization: Bearer CRON_SECRET)
        │  off unless: Shopify checkout configured + ATD live + ATD_ORDERING_ENABLED=true
        ▼
 1. STUCK   atd-sending for > 30 min?
              PO on file ........................ → atd-submitted
              no PO ............................. → atd-failed "unknown outcome — check ATD before retrying"
        ▼
 2. SUBMIT  search: tag:vercel-live financial_status:paid, no atd-* / fraud-review tag,
            not cancelled, created in the last 14 days (25 per sweep)
              risk pending / not ACCEPT ........ → skip (looked at again next sweep)
              fulfilled / on hold / test order .. → skip
              line without SKU, unclear delivery,
              missing address ................... → atd-failed (ATD not called)
              claim: metafield atd_sending_at (compare-and-set) + tag atd-sending
              placeAtdOrder — ONE attempt, never retried
                ├─ PO returned .................. → atd_po metafield, atd-submitted, note, −atd-sending
                ├─ ATD said no (4xx) ............ → atd_error metafield, atd-failed, note, −atd-sending
                └─ timeout / 5xx / no PO ........ → atd-failed "unknown outcome — check ATD before retrying"
        ▼
 3. TRACK   atd-submitted + unfulfilled: ask ATD for tracking
              ship-to-home ...................... → fulfillmentCreate with tracking, customer notified
              ship-to-store ..................... → atd_tracking metafield + note + tag atd-inbound-to-store
                                                    (the shop fulfils it in Shopify at install)
```

Why a sweep rather than a Shopify `orders/paid` webhook: no public webhook
endpoint or HMAC secret to manage, it catches up on its own after an outage
at ATD, Shopify or Vercel, and every piece of state lives on the order itself.

## Tags

| Tag | Set by | Means |
| --- | --- | --- |
| `vercel-live` | checkout (on the draft order) | A Vercel-site order. The forwarder only ever looks at these. |
| `ship-to-home` / `ship-to-store` | checkout | Where the tires go. Cross-checked against the `Delivery` attribute; if they disagree the order fails rather than guess. |
| `atd-sending` | forwarder | Claimed by a sweep; the ATD call is in flight. Normally gone within seconds. |
| `atd-submitted` | forwarder | ATD accepted it. The PO is in metafield `tiredrop.atd_po` and in the note. |
| `atd-failed` | forwarder | Not placed, or outcome unknown. The reason is in `tiredrop.atd_error` and in the note. **Needs a person.** |
| `atd-inbound-to-store` | forwarder | Ship-to-store order whose ATD tracking has been recorded. |
| `fraud-review` | you (or a Flow) | Keep the forwarder away from this order. |

Metafields (namespace `tiredrop`, all `single_line_text_field`):

| Key | Holds |
| --- | --- |
| `atd_po` | ATD's order / PO number |
| `atd_error` | Why the order is `atd-failed` |
| `atd_sending_at` | When a sweep claimed the order (the lock; also dates a stuck send) |
| `atd_tracking` | Carrier and tracking numbers of a ship-to-store delivery |

To see them on the order page: Shopify admin → Settings → Custom data →
Orders → Add definition, for each key above, type "Single line text", and
pin it. (Optional: the note carries the same information.)

## Safety rules

- **At most one ATD order per claim.** The claim is a compare-and-set write
  of `tiredrop.atd_sending_at` (`metafieldsSet` with `compareDigest`), so two
  overlapping sweeps cannot both win it, and the `atd-sending` tag keeps the
  order out of every later search.
- **Order placement is never retried.** A timeout, network error, 5xx, 408,
  unreadable answer or an answer without a PO is an **unknown outcome**: ATD
  may have the order. The order is tagged `atd-failed` with "unknown outcome
  — check ATD before retrying". A person checks ATDOnline.
- **Stuck sends are never resent.** `atd-sending` for more than 30 minutes
  means a sweep died mid-send. With a PO on file it becomes `atd-submitted`;
  without one it becomes `atd-failed` (unknown outcome).
- **Our reference goes to ATD.** The Shopify order name (`#1001`) is sent as
  the client reference so ATD can refuse a duplicate on its side too (to
  confirm with ATD: question in the sandbox plan below).
- **No prices go to ATD and no dealer cost comes back.** ATD gets SKUs,
  quantities and the delivery address; `placeAtdOrder` returns only the PO.
- **Test orders are skipped** (Shopify Bogus Gateway / test mode) unless
  `ATD_FORWARD_TEST_ORDERS=true`, which is for the ATD sandbox only.
- **No guessed ATD URLs.** With `ENDPOINTS.placeOrder` null the submit pass
  does not run at all (no claims, no tags: nothing is marked failed because
  of a missing endpoint). With `ENDPOINTS.orderStatus` null the tracking pass
  is skipped. Both show up in the sweep summary and `/api/status` `issues`.
- **Risk:** only orders whose `Order.risk.recommendation` is `ACCEPT`, with no
  assessment still `PENDING`, are sent. `NONE`, `INVESTIGATE` and `CANCEL`
  wait for a person (the summary counts them under `skipped`).
- **Time budget:** a sweep stops starting ATD calls after 45 s (the function
  may run 60 s); the rest wait for the next sweep.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `ATD_ORDERING_ENABLED` | Kill switch. Exactly `true` turns the forwarder on; anything else is off (a value other than `true`/`false` is also listed under `issues`). Default: off. Flip it to stop ordering at once without touching checkout or search. |
| `CRON_SECRET` | Random string, at least 16 characters. Vercel Cron sends it as `Authorization: Bearer <CRON_SECRET>`; the endpoint answers 401 to anything else, and to everything when it is unset. |
| `ATD_FORWARD_TEST_ORDERS` | Optional. `true` forwards Shopify **test** orders too. Only for the ATD sandbox test; never in production, where a test order would buy real tires. |

These two `ATD_*` switches do not count as ATD credentials: setting them
alone never switches the catalog to live ATD data.

The forwarder also needs everything checkout needs: the `SHOPIFY_*`
variables, all the `ATD_*` credentials and pricing variables, and ATD live
(`/api/status` shows `checkout: "shopify"`). `/api/status` reports
`forwarder: "on" | "off"`, and lists under `issues` anything that stops a
switched-on forwarder, including unconfirmed ATD order endpoints.

**Shopify app scopes** (in addition to the draft-order scopes):
`read_orders`, `write_orders` (tags, note, metafields),
`read_merchant_managed_fulfillment_orders`,
`write_merchant_managed_fulfillment_orders` (tracking → fulfillment). See
`docs/integrations/shopify-checkout.md`. Orders older than 60 days are not
needed (the forwarder looks back 14 days to submit and 45 days for
tracking), so `read_all_orders` is not required.

## Vercel Cron

`vercel.json` schedules `GET /api/cron/atd-sweep` every 5 minutes
(`*/5 * * * *`) and gives it a 60 s `maxDuration`. The SPA rewrite
`/((?!api/).*)` excludes every `/api/` path, so it does not swallow the cron
(a test checks this).

**Sub-daily cron jobs need Vercel Pro.** On the Hobby plan a cron may run at
most once a day and a deploy with a 5-minute schedule is rejected. Hobby also
does not allow commercial use, so the store needs Pro anyway.

Cron runs only on the **production** deployment. To run a sweep by hand
(for example during the sandbox test):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<deployment>/api/cron/atd-sweep
```

The answer is `{ skipped: "<reason>" }` when the forwarder is off, or
`{ ok: true, summary }`:

```json
{
  "checked": 3, "submitted": 1, "failed": 1,
  "skipped": { "risk-pending": 1 },
  "tracked": 0,
  "stuck": 0, "reconciled": 0, "inbound": 0,
  "placeOrder": "on", "tracking": "not-configured",
  "more": false, "errors": []
}
```

`failed` includes stuck orders turned `atd-failed`. `errors` lists Shopify
or ATD problems that did not fit an order's tags (for example "placed with
ATD as PO X, but Shopify was not fully updated"); the function log has the
same.

## Alerts: a Shopify Flow for `atd-failed`

There is no email service in this project; a failure is visible as the
`atd-failed` tag. To be told about it, add this Flow in the Shopify admin
(Apps → Flow → Create workflow):

- **Trigger:** Order tags added
- **Condition:** `Tags added` includes `atd-failed`
  (in Flow: "At least one of Tags added → Tag is equal to atd-failed")
- **Action:** Send internal email
  - To: `info@tiredroponline.com`
  - Subject: `ATD order failed: {{ order.name }}`
  - Body:
    ```
    Order {{ order.name }} was NOT placed with ATD (or the outcome is unknown).
    Reason: {{ order.metafields.tiredrop.atd_error.value }}
    Customer: {{ order.customer.displayName }} {{ order.email }} {{ order.phone }}
    Open: https://admin.shopify.com/store/<store>/orders/{{ order.legacyResourceId }}

    If the reason says "unknown outcome", check ATDOnline for PO/reference {{ order.name }}
    BEFORE retrying.
    ```

Insert the variables with Flow's variable picker rather than typing them:
it knows the exact names in the store's Flow version. The metafield only
appears there once its definition exists (see the metafields table above);
without it, leave the Reason line out — the order note has the reason too.

Optional second Flow, same trigger, tag `atd-submitted`, to log or notify
successful placements.

## Retrying a failed order

1. Open the order in Shopify. The note and `tiredrop.atd_error` say why.
2. **If it says "unknown outcome — check ATD before retrying":** look the
   order up in ATDOnline by our reference (the Shopify order name, e.g.
   `#1001`).
   - ATD **has** it: do not retry. Put the PO in `tiredrop.atd_po`, and swap
     the tag `atd-failed` for `atd-submitted` (tracking sync then picks it
     up).
   - ATD does **not** have it: continue with step 3.
3. Fix the cause (add the missing SKU to the line with an order edit, correct
   the address, wait for ATD stock, fix credentials...).
4. **Remove the `atd-failed` tag.** The next sweep (within 5 minutes) sends
   the order again, as long as it is still paid, unfulfilled, risk-ACCEPTed
   and less than 14 days old. Older orders: place them in ATDOnline by hand
   and tag them `atd-submitted` with the PO in `tiredrop.atd_po`.

To keep the forwarder off one order for good, tag it `fraud-review` (or
fulfil it by hand).

## ATD sandbox test-order plan (for ATD sign-off)

ATD requires a confirmed sandbox test order before it accepts live orders.

1. **Get ATD's order docs.** Fill in `ENDPOINTS.placeOrder` and
   `ENDPOINTS.orderStatus` (and `cancelOrder`), then replace every
   `TODO(confirm with ATD docs)` in `buildPlaceOrderRequest`,
   `extractAtdPo`, `buildOrderStatusRequest`, `extractAtdOrderStatus`,
   `buildCancelOrderRequest` and `atdAuthHeaders`. Update the tests' mocked
   ATD answers to ATD's real shapes. Ask ATD:
   - Does it reject or de-duplicate a second order with the same client
     reference?
   - Which field carries the PO / order number in the answer?
   - What does an order-status answer look like before and after shipping,
     and does it list several tracking numbers when tires ship separately?
   - Is there a residential flag, a shipping-method field, or a signature
     option?
2. **Use a Vercel Preview (or a separate project) pointed at the sandbox:**
   `ATD_API_BASE` = ATD's sandbox URL with sandbox credentials, `SHOPIFY_*`
   of a **development store**, `ATD_ORDERING_ENABLED=true`,
   `ATD_FORWARD_TEST_ORDERS=true`, `CRON_SECRET` set. Cron does not run on
   previews; call the endpoint with `curl` as above.
3. **Order 1, ship-to-home:** buy one tire on the dev store with Shopify's
   Bogus Gateway to a real residential address. Run the sweep. Expect
   `atd-submitted`, a PO in the note, and the order visible in ATD's sandbox
   with our `#name` as reference and the customer's address.
4. **Order 2, ship-to-store:** same, with ship-to-store. Expect ATD's
   delivery address to be Extreme Tires, 7712 West Oakland Park Blvd,
   Sunrise, FL 33351, (954) 773-1896.
5. **Failure paths:** an order edited to a line without a SKU (expect
   `atd-failed`, no ATD call); a SKU ATD rejects (expect `atd-failed`,
   "ATD rejected"); remove `atd-failed` after fixing and check it goes
   through once.
6. **Duplicate check:** run the sweep twice more; ATD must still show one
   order per Shopify order.
7. **Tracking:** once ATD's sandbox marks order 1 shipped, run the sweep;
   expect a Shopify fulfillment with the tracking number and a shipping
   email. Order 2 gets `atd-inbound-to-store` and the tracking in its note,
   and stays unfulfilled.
8. Send ATD the reference numbers for sign-off. For production: set
   `ATD_FORWARD_TEST_ORDERS` back to empty, swap in the production ATD
   variables, set up the `atd-failed` Flow above, then set
   `ATD_ORDERING_ENABLED=true` and watch the first real order.

## Known limits

- One sweep takes up to 25 orders; `more: true` in the summary means the
  rest wait for the next sweep.
- An order with more than 20 lines is failed for manual placement.
- Tracking is taken from the first shipment's carrier for all numbers.
- A cancelled or refunded Shopify order is **not** cancelled at ATD
  automatically. `cancelAtdOrder` exists (endpoint unconfirmed) for a later
  admin tool; for now cancel it in ATDOnline.
