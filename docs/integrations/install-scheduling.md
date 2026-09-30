# Install scheduling after payment (hand-off to Tire Guru)

**Goal:** a customer pays, gets asked to schedule their install, and the
booking ends up in Tire Guru, the shop's POS and scheduler.

**Status (2026-09-30):** the site side is built. With no Tire Guru link at
all, the customer books on `/track` itself: they pick the day and time window
they would like, the ORDER is tagged `install-booked` (and loses
`needs-scheduling`), the request is written on the order, and info@ gets a
`[BOOKED]` email through the existing "Website lead alert" Flow. The shop
confirms the exact time with the customer and enters it in Tire Guru by hand.
Once Tire Guru gives the shop an online booking link, one Vercel variable
switches `/track` to that link. If Tire Guru offers an API instead, that is a
follow-up build (see section (d)).

What is still Justin's to do:

1. ~~Run Chrome prompt 22~~ (done 2026-09-30: email button, "High-risk order
   review", "Needs scheduling alert").
2. The `$1` install test in "Testing" below.
3. After the Tire Guru call, set `INSTALL_BOOKING_URL` if they give you a
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
        │                                (idempotent; needs write_orders;
        │                                 skipped if already install-booked)
        │
        ├──► Flow "Needs scheduling alert": Order paid → wait 24 hours →
        │      needs-scheduling AND NOT install-booked? → email info@ [SCHEDULE]
        │
        └──► ATD forwarder, unchanged (risk ACCEPT, nothing PENDING, kill switch)

Customer opens /track (order number + the email on the order)
        │
        ▼
Paid, unfulfilled, involves installation
        │
        ├── already install-booked ──► shows the requested day and window
        │
        ├── INSTALL_BOOKING_URL set ──► only the shop's booking link (Tire
        │                               Guru), filled on the server for this
        │                               order; no inline form
        │
        └── not set ──► inline "Schedule your install" panel:
                        preferred day + time window + notes
                        → POST /api/book-install (order + email checked again)
                          1. order note: a line appended (old note kept),
                             metafield tiredrop.install_booking (JSON)
                          2. customer lead "[BOOKED] #1001: <day> <window>",
                             tags install-booking, order-<ref>
                             → Flow "Website lead alert" → email info@
                          3. order tag install-booked
                          4. order tag needs-scheduling removed
                        → on the page: "Your install request is in: <day>,
                          <window>. Extreme Tires, 7712 West Oakland Park
                          Blvd, Sunrise, FL 33351 · (954) 773-1896. We
                          confirm the exact time with you before then."

/schedule?order=TD-…  (or ?order=1001; a link or a phone call sends people here)
        │
        └──► POST /api/forms: when the order verifies (number or ref AND the
             email typed on the form, paid, install) → the same booking as
             above (steps 1–4). Otherwise the plain lead, as before
             ("Paid order: …", tags install-booking, order-<ref>).
```

### Tags lifecycle on the order

| When | Tags on the ORDER | Who |
| --- | --- | --- |
| orders/paid, install order | `needs-scheduling` added | the webhook |
| 24 hours after payment | Flow checks: `needs-scheduling` AND NOT `install-booked` → `[SCHEDULE]` email to info@ | Shopify Flow |
| Customer books on `/track` or `/schedule?order=` | `install-booked` added, then `needs-scheduling` removed | `/api/book-install`, `/api/forms` |
| Customer books by phone | add `install-booked` by hand (removing `needs-scheduling` too is tidy, not required) | the shop |

The Flow condition only needs `install-booked` to stay quiet, so a booking
whose last step (removing `needs-scheduling`) failed still stops the
reminder.

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
| `INSTALL_BOOKING_URL` | `api/_lib/config.js` | Optional. https only; placeholders `{orderRef}` `{name}` `{email}` `{phone}` `{vehicle}`. Anything else is refused and listed in `/api/status` `issues`. When set, `/track` shows only that link. |
| `/api/status` `booking` | `api/status.js` | `"external"` (a usable link is set) or `"internal"` (the inline panel). The link itself is never shown. |
| `needs-scheduling` tag | `api/webhooks/shopify.js`, `markNeedsScheduling` | orders/paid for an install order: `tagsAdd` (never duplicates). Skipped if the delivery already carries it, or carries `install-booked`. Checks the app has `write_orders` first. A missing scope or a failed write is logged and never fails the webhook or the ATD forwarder. |
| `/track` call to action | `api/_lib/booking.js` `bookingForOrder`, `TrackOrderPage.jsx` | Only on a PAID, not cancelled, not fulfilled install order, and only after the order number AND email matched. `mode`: `booked` (shows the request), `external` (the link), `internal` (the inline panel). Unpaid requests keep today's view. |
| `POST /api/book-install` | `api/book-install.js`, `api/_lib/installBooking.js` | The booking. See "The booking endpoint" below. |
| `/schedule?order=` | `SchedulePage.jsx`, `api/forms.js` | Shows the order read-only, preselects Tire Installation. A verified paid order is booked on the order like the panel (the page then says so, or shows the booking already there); otherwise the lead starts with "Paid order: TD-… (install booking for a paid order: schedule it in Tire Guru)" as before. |
| Day and window rules | `src/data/booking.js` `INSTALL_WINDOWS`, `installSlotErrors` | One copy for `/schedule`, `/track` and the API. |
| Email button | `shopify/notifications/order-confirmation-schedule-install.liquid` | Section (b). |

### The booking endpoint

`POST /api/book-install` with
`{ order, email, day, window, notes?, website? }`:

- `order`: `#1001`, `1001` or the site's ref `TD-260929-ABC234`.
- `day`: `YYYY-MM-DD`, tomorrow to 60 days out, Florida time
  (America/New_York), never a Sunday.
- `window`: one of `/schedule`'s windows, `8-10am`, `10-12pm`, `12-2pm`,
  `2-4pm`, `4-6pm` (4 – 6 PM Monday to Friday only; Saturday closes at 4).
- `notes`: optional, one line, 500 characters at most.

Checks, in order: the rate limit (the SAME budget as `/api/track`: 10
lookups per 10 minutes per connection, counted across both), the input, then
the order: number (or ref) AND email (case-insensitive), paid, not
cancelled, not fulfilled, involves installation. Every miss is the same
`404` with the same sentence, so nothing says whether the order exists or
why it cannot be booked.

| Answer | When |
| --- | --- |
| `200 { ok: true, alreadyBooked: false, booking }` | booked now |
| `200 { ok: true, alreadyBooked: true, booking }` | the order was already `install-booked`: its booking comes back (from the metafield, else the note line) and nothing is written |
| `400 { error, field }` | `field` is `order`, `email`, `day`, `window` or `notes` |
| `404 { error }` | no bookable order for that number and email (or the honeypot) |
| `429 { error }` | too many tries |
| `503 { configured: false, error }` | Shopify not configured, or the app lacks `write_orders` (logged; nothing written) |
| `502 { error }` | Shopify refused or a write failed partway: nothing claims the booking |

`booking` is `{ day, window, dayLabel, windowLabel, notes }`, e.g.
`{ "day": "2026-10-01", "window": "8-10am", "dayLabel": "Thursday, October 1, 2026", "windowLabel": "8:00 – 10:00 AM", "notes": "" }`.

What it writes, in this order (each step only if the one before worked):

1. `orderUpdate`: the order note with one line appended (the note already
   there is kept; the same line is never added twice):
   `Install booked (customer request): Thursday, October 1, 2026, 8:00 – 10:00 AM. Notes: <notes or none>`,
   and the metafield `tiredrop.install_booking` (type json:
   `{ day, window, notes, bookedAt }`) in the same call.
2. The lead, through the existing lead code (`api/_lib/leads.js`): the
   customer found by the order's email (or created), the lead text on top of
   the customer note and in `tiredrop.last_lead`, starting
   `[BOOKED] #1001: Thursday, October 1, 2026 8:00 – 10:00 AM`, then name,
   email, phone, the order, the requested day and window, where, the vehicle
   and the notes; tags `install-booking` and `order-<ref>` (plus the usual
   `new-lead`, `lead`, `lead-booking`). The "Website lead alert" Flow emails
   it to info@. No other email service.
3. `tagsAdd install-booked` on the order.
4. `tagsRemove needs-scheduling` on the order.

If a step fails, the answer is `502`, and Vercel's log has
`[book-install] #1001: FAILED at "<step>" (…). Done: … Not done: …
Requested: Install booked (customer request): …`, so whoever reads it can
finish by hand. A retry is safe: the note line is not repeated, and once
step 3 has happened the order answers as already booked.

### Privacy rules this keeps

- **Nothing personal is ever read from a URL.** `/schedule?order=…` fills in
  the order reference and nothing else: `&name=…`, `&email=…` and the like
  are ignored (`npm run check:forms` tests this). `/schedule` can still take
  a vehicle and contact handed over in browser history state (never the
  address bar) for the same order reference; `/track` itself now books
  inline and hands nothing over.
- **Booking re-checks the order.** `/api/book-install` does not trust the
  page: it matches the order number AND email again, under the same rate
  limit as `/track`, before writing anything.
- **The link to /track carries only the order number.** The customer types
  the email; an email address in a URL would end up in logs and analytics.
- **`/track` only reveals the booking details to someone who gave the order
  number AND the order's email** (the same check as the rest of /track, rate
  limited to 10 lookups per 10 minutes per connection, shared with
  `/api/book-install`). What it hands back is the customer's own name, phone
  and vehicle, and their own requested day and window.
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
| `write_orders` | the `needs-scheduling` and `install-booked` tags, the note line and the booking metafield (the ATD forwarder already needs it) |
| `read_customers`, `write_customers` | the `[BOOKED]` lead (already needed for every website form) |
| `read_orders` | `/track` (already needed) |
| `read_customers` | the contact read on `/track` for the prefill (already needed for leads) |

If the app lacks `write_orders`, `/api/book-install` writes nothing,
answers `503` (the panel tells the customer to call), and logs
`NOT booked: the Shopify app lacks the write_orders scope`; a
`/schedule?order=` booking falls back to the plain lead. The webhook logs
`NOT tagged needs-scheduling: the Shopify app lacks the write_orders scope`
in Vercel's logs and carries on. The fix: Shopify Dev Dashboard → the
TireDrop app → Versions → add `write_orders` → release → approve the update
in the store.

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

### 2. "Needs scheduling alert" (as built, 2026-09-30)

- **Trigger:** Order paid
- **Wait:** 24 hours
- **Condition:** the order's tags include `needs-scheduling` AND do NOT
  include `install-booked`. Flow reads the order again after the wait, so a
  customer who booked in the meantime (the site tagged the order
  `install-booked`) gets no reminder. The `$1` test in "Testing" proves this.
- **Action:** Send internal email → `info@tiredroponline.com`
  - Subject: `[SCHEDULE] {{order.name}}: book the install`
  - Message:

    ```
    {{order.name}} is paid and needs an install booked.
    Customer: {{order.customer.displayName}}
    Phone: {{order.phone}} {{order.shippingAddress.phone}} {{order.billingAddress.phone}} {{order.customer.phone}}
    Email: {{order.email}}
    They were sent a "Schedule your install" link and have not booked in
    24 hours. Call them and book it in Tire Guru, then add the tag
    install-booked to the order.
    ```

  Several phone fields are listed because the phone can sit on the order,
  the shipping address, the billing address or the customer. Flow prints
  blanks for the empty ones.

A booking made on `/track` or `/schedule?order=` reaches info@ through the
existing "Website lead alert" Flow, like every other website lead, with
`[BOOKED] #1001: <day> <window>` as its first line.

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

## (e) A confirmation email to the customer? (researched, not built)

The site has no email sender, and the owner does not want another app. The
confirmation today is the page itself ("Your install request is in: …") and
`/track`, which shows the booking whenever the customer looks the order up.

Could Shopify send one? The Admin GraphQL API (the repo uses 2026-07;
validated against it) has `orderInvoiceSend(id: ID!, email: EmailInput)`,
needs `write_orders`, and "sends an email invoice for an Order".
`EmailInput` takes `to`, `from`, `bcc`, `subject`, `body` and
`customMessage` (`from` and `bcc` must be store or staff addresses).

- **Feasible:** yes, technically. One call after the booking, with
  `customMessage: "Your install request is in: Thursday, October 1, 2026,
  8:00 – 10:00 AM …"`.
- **What the customer sees:** Shopify's **Order invoice** notification
  template (Settings → Notifications → Customer notifications → Order
  invoice), with the custom message in it, above the order's line items and
  totals.
- **Risks:**
  - It is an INVOICE. Its default heading and subject talk about an
    invoice/payment for an order that is already paid, which reads like a
    second bill. Customers may think they are being charged twice.
  - The same template serves real invoices (orders with a balance), so
    editing its wording to suit bookings changes those too, unless the
    Liquid branches (for example on the order tag `install-booked`) — more
    theme-like code in a notification template, maintained by hand.
  - `subject` can be overridden per call, but the body is still the invoice
    layout.
  - It is not what the endpoint is for; Shopify may change how it renders.
- **Recommendation:** do not use it for booking confirmations. If a
  customer email becomes a must, the cleaner Shopify-only route is a Flow
  that emails the CUSTOMER when `install-booked` is added (only if Flow's
  "Send marketing email"/customer email actions are available on this plan),
  or a proper transactional sender, which is a new service.

---

## Testing

- `npm run test:api`: `installBooking.test.mjs` covers the booking endpoint:
  the happy path (tags added and removed, the note appended not replaced,
  the metafield, the `[BOOKED]` lead with name, phone and email and its
  tags), a TD- ref, a wrong email and unpaid / cancelled / fulfilled /
  non-install orders (the same 404, nothing written), already booked
  (idempotent), bad days and windows, a Shopify failure midway (502, the
  log, a safe retry), a missing `write_orders`, the rate limit shared with
  `/track`, `/track` showing the booking, and `/schedule?order=` booking
  through `/api/forms`. `booking.test.mjs` covers the link builder, the
  config checks and the install rule. `webhooks.test.mjs` covers the
  `needs-scheduling` tag (idempotent, missing scope, failed write, skipped
  on an `install-booked` order). `track.test.mjs` covers who gets a panel.
  `leads.test.mjs` covers the lead text and tags.
- `npm run check:forms` (after `npm run build`): the `/track` panel keeps the
  day, window and notes (typing, automation, autofill; a late status; a slow
  and a failed answer) and sends them; the page checks Sunday and Saturday
  4 – 6 PM first; a booked order shows its booking, not the form; with
  `INSTALL_BOOKING_URL` only the link shows; `/schedule?order=` ignores
  personal details in the URL and says so when the order already has a
  booking.

### The `$1` install test (Justin)

1. Place a `$1` **ship-to-store** order on the live site with your own email
   and pay it. Note the order number, say `#1005`.
2. In Shopify → Orders → `#1005`: the tag `needs-scheduling` appears within
   a minute.
3. Open `https://tiredroponline.com/track?order=%231005`, type the order's
   email, **Track Order**. The "Schedule your install" panel shows.
4. Pick a day (tomorrow or later, not Sunday) and a window, add a note,
   **Request this day and window**. The page says "Your install request is
   in: …".
5. Check the order: tag `install-booked` added, `needs-scheduling` gone, the
   note ends with `Install booked (customer request): …`, and under
   Metafields `tiredrop.install_booking` holds the JSON.
6. info@ gets the "Website lead alert" email starting `[BOOKED] #1005: …`.
7. Look the order up on `/track` again: it shows the booking, not the form.
8. Wait 24 hours: NO `[SCHEDULE]` email for `#1005`.
9. Place a second `$1` ship-to-store order and do NOT book it. After 24
   hours a `[SCHEDULE]` email arrives for it. Together, 8 and 9 prove the
   Flow re-reads the tags after its wait.
10. Refund and cancel both test orders.
