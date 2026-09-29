# Shopify order webhooks → Vercel

**Status: built and unit-tested with a mocked Shopify and a mocked ATD
(`api/_lib/webhooks.test.mjs`). Never run against the real store from this
repository.** The endpoint is live as soon as it is deployed, but it does
nothing until `SHOPIFY_WEBHOOK_SECRET` is set, and it places nothing with
ATD until the forwarder's own gates are open (below).

Endpoint: `POST https://tiredroponline.com/api/webhooks/shopify`
(`api/webhooks/shopify.js`).

## What each topic does

| Shopify event (topic) | What the site does |
| --- | --- |
| **Order payment** (`orders/paid`) | Runs the ATD forwarder for **that one order** right away (`forwardOrder` in `api/_lib/forwarder.js`), with exactly the cron's rules: `ATD_ORDERING_ENABLED=true`, Shopify and ATD live, a `vercel-live` order, risk `ACCEPT` with no assessment `PENDING`, no `fraud-review` tag, no `atd-*` tag, unfulfilled, not a test order. If risk is still pending it does nothing and the daily cron picks the order up later. |
| **Order cancellation** (`orders/cancelled`) | If ATD has (or may have) the order (`atd-submitted`, `atd-sending`, a PO on file, or `atd-failed` with an unknown outcome): asks ATD to cancel it (skipped while ATD's cancel endpoint is unconfirmed) and tags **`atd-cancel-needed`** with a note saying what was tried, so Flow workflow 4 or a person confirms it at ATD. If nothing went to ATD: tags **`cancelled-before-atd`**. |
| Order fulfillment (`orders/fulfilled`), Fulfillment creation (`fulfillments/create`) | Logged only, for now. |
| anything else | Answered 200 and ignored. |

The daily cron (`/api/cron/atd-sweep`) stays on as the backup: it catches
an order whose risk check was pending, a delivery Shopify gave up on, and
it syncs tracking.

## Safety

- **Signature.** Every delivery must carry `X-Shopify-Hmac-Sha256`, the
  HMAC-SHA256 of the raw request body. The key is `SHOPIFY_WEBHOOK_SECRET`
  (the signing key Shopify shows for webhooks made in admin), and
  `SHOPIFY_CLIENT_SECRET` is also tried (webhooks the app registers are
  signed with it). Compared in constant time. Anything else is a **401** and
  the body is never read.
- **Raw body.** The function is a Web-standard handler
  (`export async function POST(request)`), so Vercel does not parse the
  body and the signature is checked over the exact bytes Shopify sent.
- **Duplicates.** `X-Shopify-Webhook-Id` and `X-Shopify-Event-Id` are
  remembered per warm instance and a repeat is answered 200 and ignored.
  The real lock is on the order: the forwarder's `atd-sending` /
  `atd-submitted` tags and its compare-and-set claim, so even a retry on a
  different instance cannot place the order twice.
- **Fast answer.** Shopify waits at most 5 seconds. The function answers 200
  as soon as the checks pass and finishes the work in the background
  (Vercel `waitUntil`, up to the 60 s in `vercel.json`).
- **Kill switch.** With `ATD_ORDERING_ENABLED` not `true`, an
  `orders/paid` delivery is answered 200 and nothing is read or sent.

`/api/status` shows `webhooks: "configured"` once a secret is set, `"off"`
without one (the endpoint then answers 503).

## Set it up (Justin, in Chrome)

> **Verification note.** The Shopify developer docs (checked with the
> Shopify docs tool) confirm the signature header, the raw-body HMAC, the
> `X-Shopify-Webhook-Id` / `X-Shopify-Event-Id` headers, the 5-second
> timeout, and that webhooks made in the Shopify admin belong to the shop,
> not to an app. The admin click-path below (Settings → Notifications →
> Webhooks, the "signed with" key, "Send test notification") is from the
> Shopify admin as it has worked for years; the developer docs do not
> describe that screen, so it is **not verified against current Shopify
> documentation**. If a label differs, look for "Webhooks" at the bottom of
> the Notifications settings page.

Paste this into Claude in Chrome (or follow it by hand):

```
In the Shopify admin for the TireDrop store (the xxx.myshopify.com store behind shop.tiredroponline.com):

1. Go to Settings (bottom left) → Notifications.
2. Scroll to the bottom and click "Webhooks".
3. Click "Create webhook" and set:
     Event:  Order payment
     Format: JSON
     URL:    https://tiredroponline.com/api/webhooks/shopify
     Webhook API version: the newest one in the list (2026-07 or later)
   Click Save.
4. Click "Create webhook" again and set:
     Event:  Order cancellation
     Format: JSON
     URL:    https://tiredroponline.com/api/webhooks/shopify
     Webhook API version: the same newest version
   Click Save.
5. On the Webhooks section, find the line "Your webhooks will be signed with"
   followed by a long key. Copy that key exactly. Do not paste it anywhere
   except the Vercel field in step 6.

In Vercel (the TireDrop project):

6. Settings → Environment Variables → Add:
     Key:   SHOPIFY_WEBHOOK_SECRET
     Value: the key copied in step 5
     Environments: Production (and Preview only if previews should accept webhooks)
   Save.
7. Deployments → the latest Production deployment → "..." → Redeploy.
   Wait until it shows Ready.
8. Open https://tiredroponline.com/api/status and check it shows
   "webhooks": "configured".

Back in Shopify:

9. Settings → Notifications → Webhooks. Next to the "Order payment" webhook,
   click "Send test notification". Do the same for "Order cancellation".
10. In Vercel → the project → Logs, filter on "/api/webhooks/shopify".
    Each test should show a 200 and a line starting "[webhook] orders/paid"
    (or orders/cancelled). A 401 means the key in step 6 does not match:
    copy it again, save, redeploy.
```

What the test notification does: Shopify's sample order is not a TireDrop
order (no `vercel-live` tag, and it does not exist in the store), so the
function reads it, finds nothing to do and answers 200. With the kill
switch off (the default today) an `orders/paid` test is answered 200
without even reading Shopify. Nothing is sent to ATD either way.

If the same event is ever subscribed twice (an admin webhook **and** an
app-registered one), the second delivery shares the `X-Shopify-Event-Id`
and is ignored.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `SHOPIFY_WEBHOOK_SECRET` | The signing key from Settings → Notifications → Webhooks. Without it (and without `SHOPIFY_CLIENT_SECRET`) the endpoint answers 503 and `/api/status` shows `webhooks: "off"`. |
| `SHOPIFY_CLIENT_SECRET` | Already set for the app. Also accepted as a signing key, for webhooks the app registers itself. |
| `ATD_ORDERING_ENABLED` | The forwarder's kill switch. `orders/paid` places nothing unless it is exactly `true` (and ATD is live). |

`CRON_SECRET` is not needed by the webhook; it only guards the cron.

## Scopes

The single-order read and the tag / note / metafield writes use the scopes
the forwarder already has: `read_orders`, `write_orders`. A cancellation at
ATD needs nothing from Shopify beyond those.

## Code and tests

- `api/webhooks/shopify.js`: signature, dedupe, topic routing.
- `api/_lib/forwarder.js`: `forwardOrder` (orders/paid) and
  `handleOrderCancelled` (orders/cancelled). The sweep and `forwardOrder`
  share `placeOne`, so the claim, the single ATD call and the order of
  writes are the same code.
- `api/_lib/webhooks.test.mjs`: valid HMAC processed, bad HMAC 401,
  duplicate webhook id ignored, paid + ACCEPT forwards once, pending risk
  does nothing, cancellations, kill switch off means no ATD call.
