# Install scheduling after payment (hand-off to Tire Guru)

**Goal:** a customer pays, gets asked to schedule their install, and the
booking ends up in Tire Guru, the shop's POS and scheduler.

**Status (2026-09-30):** the site side is built. It works today with no Tire
Guru link at all: bookings arrive at info@ as a website lead, and the shop
enters them in Tire Guru by hand. Once Tire Guru gives the shop an online
booking link, one Vercel variable switches the button to that link. If Tire
Guru offers an API instead, that is a follow-up build (see section (d)).

What is still Justin's to do:

1. Run Chrome prompt 22 (`docs/business/shopify-admin-prompts.md`). It adds
   the email button and builds the two Flows. You click every Save.
2. After the Tire Guru call, set `INSTALL_BOOKING_URL` if they give you a
   booking link.

Payment itself is unchanged. Checkout only takes payment when both Shopify
and ATD are live (`config.checkout === "shopify"`, `api/_lib/config.js`), and
until then every checkout is a request. Paid orders placed through the
Shopify storefront (the "EDIT HERE" theme's cart) do reach this flow today.

---

## (a) The flow

```
Customer pays on Shopify checkout
        │
        ▼
Shopify fraud analysis ──── HIGH risk ──► Flow "High-risk order review":
        │                                  tag fraud-review, email info@
        ▼                                  (the ATD forwarder skips any
Shopify order (#1001)                      fraud-review / non-ACCEPT order)
        │
        ├──► Order confirmation email ── install order + paid ──►
        │      "Schedule your install" button
        │      → tiredroponline.com/track?order=%231001
        │
        ▼
orders/paid webhook  (POST /api/webhooks/shopify, HMAC-verified, deduplicated)
        │
        ├──► involves installation? ──► tagsAdd "needs-scheduling"
        │         │                      (idempotent; needs write_orders)
        │         ▼
        │    Flow "Needs scheduling alert" ──► email info@: order name + phone
        │
        └──► ATD forwarder, unchanged (risk ACCEPT, nothing PENDING, kill switch)

Customer opens /track (order number + the email on the order)
        │
        ▼
Paid, unfulfilled, involves installation ──► "Schedule your install"
        │
        ├── INSTALL_BOOKING_URL set ──► the shop's booking link (Tire Guru),
        │                               filled on the server for this order
        │
        └── not set ──► /schedule?order=TD-…  (or ?order=1001)
                        vehicle + contact prefilled from the verified order
                        → POST /api/forms → Shopify customer lead
                          tags install-booking, order-<ref>
                        → Flow "Website lead alert" → email info@
                        → the shop books it in Tire Guru
```

**"Involves installation"** (`installKind` in `api/_lib/booking.js`, the same
rule in the webhook, `/track` and the email snippet):

| Signal on the order | Kind |
| --- | --- |
| `Delivery` attribute "Ship to store for install (Extreme Tires, Sunrise)", or tag `ship-to-store` | install at the shop |
| Shipping line title contains "Pickup" (e.g. "Pickup at Extreme Tires (Sunrise, FL)") | install at the shop |
| `Delivery` attribute "Mobile install at my address", or tag `mobile-install` | mobile install (Miami-Dade, Broward, Palm Beach) |
| A line item whose title contains "install", or a checkout note line "Install at the shop: …" | install at the shop |
| Anything else (shipped to the customer) | none: no tag, no button |

Mobile install is never paid online today (checkout keeps it a request, and
the van is booked on the call), so in practice paid install orders are
ship-to-store and pickup orders. The rule covers mobile anyway.

### The pieces

| Piece | Where | What it does |
| --- | --- | --- |
| `INSTALL_BOOKING_URL` | `api/_lib/config.js` | Optional. https only; placeholders `{orderRef}` `{name}` `{email}` `{phone}` `{vehicle}`. Anything else is refused and listed in `/api/status` `issues`. |
| `/api/status` `booking` | `api/status.js` | `"external"` (a usable link is set) or `"internal"` (/schedule). The link itself is never shown. |
| `needs-scheduling` tag | `api/webhooks/shopify.js`, `markNeedsScheduling` | orders/paid for an install order: `tagsAdd` (never duplicates). Skipped if the delivery already carries the tag. Checks the app has `write_orders` first. A missing scope or a failed write is logged and never fails the webhook or the ATD forwarder. |
| `/track` call to action | `api/_lib/booking.js` `bookingForOrder`, `TrackOrderPage.jsx` | Only on a PAID, not cancelled, not fulfilled install order, and only after the order number AND email matched. Unpaid requests keep today's view. |
| `/schedule?order=` | `SchedulePage.jsx`, `api/_lib/validate.js` | Shows the order read-only, preselects Tire Installation, sends `order` with the booking. The lead starts with "Paid order: TD-… (install booking for a paid order: schedule it in Tire Guru)" and the customer gets the tags `install-booking` and `order-<ref>`. |
| Email button | `shopify/notifications/order-confirmation-schedule-install.liquid` | Section (b). |

### Privacy rules this keeps

- **Nothing personal is ever read from a URL.** `/schedule?order=…` fills in
  the order reference and nothing else: `&name=…`, `&email=…` and the like
  are ignored (`npm run check:forms` tests this). The vehicle and contact come
  from `/track`'s own answer, handed to `/schedule` in browser history state,
  never in the address bar, and only for the same order reference.
- **The link to /track carries only the order number.** The customer types
  the email; an email address in a URL would end up in logs and analytics.
- **`/track` only reveals the booking details to someone who gave the order
  number AND the order's email** (the same check as the rest of /track, rate
  limited to 10 lookups per 10 minutes per connection). What it hands back is
  the customer's own name, phone and vehicle, for their own booking.
- **The filled Tire Guru link is built on the server** for a verified order.
  `/api/status` only says external/internal.

### Order reference

`?order=` and `{orderRef}` are the site's order ref (`TD-260929-ABC234`) when
the order has one: paid orders placed through the site's checkout carry it
as the "Order ref" attribute. Orders paid through the Shopify storefront have
no TD- ref, so they use the Shopify order number (`#1001`; `?order=1001`,
tag `order-1001`). `/schedule` accepts both and ignores anything else.

### Scopes

| Scope | For |
| --- | --- |
| `write_orders` | the `needs-scheduling` tag (the ATD forwarder already needs it) |
| `read_orders` | `/track` (already needed) |
| `read_customers` | the contact read on `/track` for the prefill (already needed for leads) |

If the app lacks `write_orders`, the webhook logs
`NOT tagged needs-scheduling: the Shopify app lacks the write_orders scope`
in Vercel's logs and carries on. The fix: Shopify Dev Dashboard → the
TireDrop app → Versions → add `write_orders` → release → approve the update
in the store. `/track` and the email button do not need the tag, so
customers still see "Schedule your install" meanwhile; only the Flow alert
is missing.

The contact read (phone, shipping and billing names, customer name) can be
refused if the app has not been given access to protected customer data
(name and phone). Then `/track` still shows the button, and `/schedule` starts
with the name and phone from the checkout's own note line when there is one,
or blank. Nothing breaks.

---

## (b) Order confirmation email: "Schedule your install" button

Shopify admin → Settings → Notifications → Customer notifications → Order
confirmation → Edit code. Paste this on a new line directly after the
local-vs-ship block (prompt 15), or after the element that contains
`{{ email_body }}`. Prompt 22 does it for you. The same snippet is saved at
`shopify/notifications/order-confirmation-schedule-install.liquid`. It is a
notification template, not a theme file.

```liquid
{%- assign td_install = false -%}
{%- assign td_ship_title = shipping_method.title | default: "" -%}
{%- if td_ship_title contains "Pickup" or td_ship_title contains "pickup" -%}
  {%- assign td_install = true -%}
{%- endif -%}
{%- assign td_delivery = attributes.Delivery | default: "" -%}
{%- if td_delivery contains "Ship to store" or td_delivery contains "Mobile install" -%}
  {%- assign td_install = true -%}
{%- endif -%}
{%- for td_line in line_items -%}
  {%- if td_line.title contains "Install" or td_line.title contains "install" -%}
    {%- assign td_install = true -%}
  {%- endif -%}
{%- endfor -%}
{%- if note contains "Install at the shop:" -%}
  {%- assign td_install = true -%}
{%- endif -%}
{%- if td_install and financial_status == "paid" -%}
<div style="margin: 20px 0; padding: 16px 18px; border: 1px solid #0068E8; border-radius: 8px; background: #FFFFFF; font-family: Arial, sans-serif; font-size: 15px; line-height: 1.5; color: #111;">
  <strong style="font-size: 16px;">Schedule your install</strong><br>
  Your order is paid. Pick the day and time you would like for the install; we confirm it with you before then.<br>
  <a href="https://tiredroponline.com/track?order={{ order_name | url_encode }}" style="display: inline-block; margin-top: 12px; padding: 11px 20px; background: #0068E8; color: #FFFFFF; text-decoration: none; border-radius: 6px; font-weight: bold;">Schedule your install</a><br>
  <span style="color: #444; font-size: 13px;">Enter this email address on the page to open your order. Rather call? <a href="tel:+19547731896" style="color: #0068E8;">(954) 773-1896</a>, and mention {{ order_name }}.</span>
</div>
{%- endif -%}
```

Notes:

- **What /track accepts:** `?order=` with an order number (`%231001`,
  `1001`) or a TD- ref. It fills the order box only; the customer types the
  email. `order_name | url_encode` turns `#1001` into `%231001`.
- **Paid only.** The button needs `financial_status == "paid"`, because
  `/track` only offers the booking once the order is paid. An order paid
  later (for example by phone) gets its button on `/track`, and the Flow
  alert still fires from the webhook.
- The shipping-line check is "contains Pickup", as asked; the Delivery
  attribute and install-line checks catch the same orders when the title
  differs.

---

## (c) Shopify Flow recipes

Build these in Apps → Flow (prompt 22 walks through it; you click every
Save and turn each one on).

### 1. "High-risk order review" (prompt 13 workflow 3; check it, do not duplicate)

- **Trigger:** Order risk analyzed
- **Condition:** Order / Risk level is equal to **HIGH**. On newer Flow
  versions it may be under Order / Risk / Assessments / Risk level (at least
  one assessment equal to HIGH).
- **Actions:**
  1. Add order tags: `fraud-review`. The ATD forwarder never sends a
     `fraud-review` order, or any order whose risk recommendation is not
     ACCEPT.
  2. **Only if Flow offers it:** Hold fulfillment orders (the action is
     named "Hold fulfillment orders" or similar). If the list has no hold
     action, leave it out. The tag already keeps the order away from ATD.
  3. Send internal email → `info@tiredroponline.com`
     - Subject: `HIGH RISK order {{order.name}}: review before anything ships`
     - Message: `Shopify flagged {{order.name}} ({{order.email}}) as high risk. It is tagged fraud-review, so nothing goes to the supplier. Review it in Orders before anything ships or is installed.`

### 2. "Needs scheduling alert"

- **Trigger:** Order tags added
- **Condition:** the tags added include `needs-scheduling`. If the trigger
  offers no "tags added" field, use Order / Tags includes
  `needs-scheduling`.
- **Action:** Send internal email → `info@tiredroponline.com`
  - Subject: `[SCHEDULE] {{order.name}}: book the install`
  - Message:

    ```
    {{order.name}} is paid and needs an install booked.
    Customer: {{order.customer.displayName}}
    Phone: {{order.phone}} {{order.shippingAddress.phone}} {{order.billingAddress.phone}} {{order.customer.phone}}
    Email: {{order.email}}
    They were sent a "Schedule your install" link. If no booking arrives
    from them (a website lead tagged install-booking), call them and book
    it in Tire Guru. Remove the needs-scheduling tag once it is booked.
    ```

  Several phone fields are listed because the phone can sit on the order,
  the shipping address, the billing address or the customer. Flow prints
  blanks for the empty ones.

The booking itself (when it comes in through `/schedule`) is emailed by the
existing "Website lead alert" Flow, like every other website lead, with
"Paid order: …" near the top.

---

## (d) When Tire Guru answers

**They give an online booking link.** Set it in Vercel, nothing else:

1. Vercel → the TireDrop project → Settings → Environment Variables → Add
   `INSTALL_BOOKING_URL` (Production). Example:
   `https://<tire guru booking page>?ref={orderRef}&name={name}&email={email}&phone={phone}&vehicle={vehicle}`.
   Use only the placeholders Tire Guru's link understands; leave out the
   rest. With no placeholders at all, the button just opens their page.
2. Redeploy. Check `https://tiredroponline.com/api/status` shows
   `"booking": "external"` and no `INSTALL_BOOKING_URL` line under `issues`.
3. The `/track` button now opens the Tire Guru page in a new tab, filled for
   that order. The email button still goes to `/track`, so the customer
   passes the order + email check first. `/schedule?order=` keeps working
   for anyone who calls or is sent there.

To switch back, delete the variable and redeploy.

Do not reuse the old `TIREGURU_*` names. They are the retired payment
variables; `config.js` ignores them and flags them.

**They offer an API.** That is a follow-up task, not a setting. Roughly: on
a `/schedule?order=` booking (or straight from orders/paid), create the
appointment through their API and add a `tireguru-booked` tag. We need their
docs first: auth, the appointment endpoint, vehicle and customer fields,
whether it answers with open slots, and sandbox access. Until then this flow
keeps working as it is.

**They offer neither.** Nothing changes: bookings reach info@ and the shop
enters them in Tire Guru.

---

## Testing

- `npm run test:api`: `booking.test.mjs` covers the link builder, placeholder
  encoding, the config checks and the install rule. `webhooks.test.mjs` covers
  the tag being idempotent, a missing scope, a failed write and the forwarder
  being unchanged. `track.test.mjs` covers who gets a button and what it
  carries. `leads.test.mjs` covers the lead text and tags.
- `npm run check:forms` (after `npm run build`): a bare `/schedule?order=`
  link ignores personal details in the URL; `/track` → button → `/schedule`
  with the vehicle and contact prefilled; the external link opens in a new
  tab; no button for unpaid requests or shipped orders.
- Live, once prompt 22 is done: pay a `$1` ship-to-store test order
  (the go-live test order), then check:
  1. The confirmation email has the button.
  2. The order gets the `needs-scheduling` tag and the `[SCHEDULE]` email
     arrives.
  3. `/track` shows the button.
  4. A booking from `/schedule` reaches info@ with "Paid order".
