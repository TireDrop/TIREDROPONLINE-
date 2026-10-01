# Shopify admin tasks: browser-agent prompts

Everything here needs the Shopify admin and cannot be done through the API
connector, either because Shopify exposes no API for it (store name) or because
the connector lacks the permission scope (privacy settings). One job per prompt;
run them one at a time and send the report back.

Order is priority. Nothing here publishes the working theme — that stays a
deliberate decision.

---

## 1. Rename the store

```
TASK: Rename the Shopify store.
I am logged into Shopify admin in this browser. Do not buy, upgrade or
install anything.

1. Go to Settings → Store details (or Settings → General).
2. Change the store name from "Extreme Mobile Tires" to exactly: TireDrop
3. Save.
4. Go to Settings → Notifications → Customer notifications and check the
   sender name. If it still says "Extreme Mobile Tires", change it to
   TireDrop and save.

Do NOT change the store email, billing details, address, currency or
anything else.

REPORT BACK:
  - The store name field after saving
  - The notification sender name after saving
  - Any warning shown, quoted word for word
```

---

## 2. Add "Pay by phone" as the payment method

```
TASK: Add a manual payment method so customers can place an order and pay by
phone.
I am logged into Shopify admin in this browser. Do not buy, upgrade, start a
trial, or activate any payment provider.

1. Go to Settings → Payments.
2. Before changing anything, list every payment method or provider shown as
   active, exactly as named.
3. Find "Manual payment methods" and choose "Create custom payment method".
4. Set:
   Custom payment method name:
     Pay by phone
   Additional details:
     We call to confirm fitment and take payment before anything ships.
     Nothing is charged online.
   Payment instructions:
     Keep your phone nearby — we call from (954) 773-1896 to confirm your
     tire size and take payment. Your order is not sent for fulfillment
     until payment is taken.
5. Save / Activate it.

Do NOT activate Shopify Payments, PayPal, or any other provider. Do NOT
remove or deactivate anything already there.

REPORT BACK:
  - Payment methods that were active BEFORE you started
  - Confirmation "Pay by phone" is now active
  - Any warning shown, quoted word for word
```

---

## 3. Check the password page (read only)

```
TASK: Report whether the online store is password protected. CHANGE NOTHING.
I am logged into Shopify admin in this browser.

1. Go to Online Store → Preferences.
2. Find "Password protection" / "Restrict store access".

REPORT BACK:
  - ON or OFF
  - If ON, the message shown to visitors, quoted
Do not toggle it and do not change the password.
```

---

## 4. Turn on the cookie consent banner

```
TASK: Turn on the cookie consent banner for tiredroponline.com.
I am logged into Shopify admin in this browser. Do not buy, upgrade, or
install anything.

1. Go to Shopify admin → Settings → Customer privacy.
2. Find "Cookie banner". Turn it ON.
3. Where it asks which visitors see the banner, choose ALL regions (or add
   "United States" if "all regions" is not offered). Report which you picked.
4. Click "Customize" and set:
   - Banner background: #FFFFFF
   - Text color: #070E1A
   - Primary (Accept) button: background #0068E8, text #FFFFFF
   - Secondary (Decline) button: outlined, text #070E1A
   - Position: bottom
   - Message text:
     "We use cookies to run the cart and checkout, and — with your
     permission — to measure how the store is used."
   - Keep the Accept, Decline and Manage preferences buttons.
5. Save.

Do NOT change "Data sharing opt-out" / "Your Privacy Choices" settings.
Do NOT edit the privacy policy.

REPORT BACK:
  - Whether the banner is ON
  - Which regions it shows in
  - Which privacy policy link the banner uses (quote the URL)
  - Any setting you could not find, quoted word for word
```

---

## 5. Remove the email address from Shopify's privacy policy

> **Superseded (September 24, 2026).** The business email is now
> info@tiredroponline.com, so the gmail address is replaced rather than just
> removed. Skip this prompt; prompt 10 covers the policies and every other
> setting that still points at gmail. (The Admin API connection used here has
> no `write_legal_policies` scope, so policy text can only change in the admin.)

The store owner decided the gmail address is not to be published. Shopify's
auto-generated privacy policy publishes it anyway, and checkout links to it.

```
TASK: Remove one email address from the store's privacy policy.
I am logged into Shopify admin in this browser.

1. Go to Settings → Policies → Privacy policy.
2. FIRST check: is there a setting saying the policy is automatically
   created / automatically updated by Shopify? Report its state.
   If editing the text would switch automatic updates OFF, STOP here and
   report — do not edit.
3. Otherwise, find this text in the Contact section:
     "or email us at extremetiresmarketing@gmail.com "
   Delete exactly that phrase so the sentence reads
     "...please call +1 954-773-1896 or contact us at ..."
4. Save.

Change NOTHING else in the policy. Do not add, reword or remove any other
sentence.

REPORT BACK:
  - The auto-update setting's state
  - The Contact paragraph after saving, quoted in full
```

---

## 6. Fill in the missing Shopify policies

Checkout links to Shopify's own Refund, Shipping and Terms policies. They are
empty. The text below already exists — it is the store's published terms page.
Nothing is written fresh.

```
TASK: Copy existing, already-published text into three empty Shopify
policies. Do not write or reword anything yourself.
I am logged into Shopify admin in this browser.

Source page: https://tiredroponline.com/pages/terms
Each section on it has a heading.

1. Settings → Policies → Refund policy:
   paste the full text of the sections headed "Returns" and
   "Damaged or wrong" (whatever the exact headings are for returns and for
   damaged/wrong items), in that order. Save.
2. Settings → Policies → Shipping policy:
   paste the full text of the sections about "Shipping" and
   "Ship to store". Save.
3. Settings → Policies → Terms of service:
   paste the full text of the whole terms page. Save.

Copy text exactly. Do NOT invent a return window, restocking fee, deadline,
email address or company name — if the source text does not state one,
neither does the policy.

REPORT BACK:
  - Which section headings you copied into each policy
  - Any section you could not find, and what headings the page did have
```

---

## 7. Restore app embeds on the working theme

Writing the theme's settings file stripped three app embeds that are ON in the
live theme. Restoring them is parity, not a new decision.

```
TASK: Turn three app embeds back on in an unpublished theme.
I am logged into Shopify admin in this browser. Do not publish any theme.

1. Online Store → Themes. Find the theme named
   "TireDrop — work in progress" (NOT the live theme).
2. Click Customize on it.
3. Open "App embeds" (the puzzle-piece / apps icon in the left sidebar).
4. Report every embed listed and whether it is on or off.
5. Turn ON, if present:
   - Blockify Fraud Filter
   - Blockify Checkout
   - Omnisend
6. Save. Do NOT click Publish.

REPORT BACK:
  - The full embed list before and after
  - Confirmation you saved and did NOT publish
```

---

## 8. Click-test every link on the working theme

```
TASK: Quality-check an unpublished theme preview by clicking every
navigation link. CHANGE NOTHING.
I am logged into Shopify admin in this browser. Do not publish any theme.

1. Online Store → Themes → "TireDrop — work in progress" → "..." → Preview.
2. On the homepage, confirm these sections appear, top to bottom:
   dark hero ("Order tires online."), four promises, two delivery options,
   dark "Not sure what you need?" tools band, four numbered steps.
3. Click every item in the header menu, including every item inside each
   dropdown. Then every link in the footer. For each, record:
   link text | URL it went to | loaded OK / "page not found" / other
4. Check the footer shows exactly one social icon (Facebook).

Expected, not errors:
  - /collections/tires and /collections/wheels show no products (catalog
    comes later)
  - The three tool cards on the homepage (tire-size, find-my-tires,
    tire-check) go to "page not found" — those pages are being built

REPORT BACK:
  - The full link table
  - Any section missing, overlapping, or hard to read
  - A screenshot of the homepage and of the footer if you can take one
```

---

## 9. Report shipping and tax settings (read only)

The site says shipping is free to every address in the continental US, with
no order minimum. This checks that Shopify's checkout charges the same.

```
TASK: Report the store's shipping and tax configuration. CHANGE NOTHING.
I am logged into Shopify admin in this browser.

1. Settings → Shipping and delivery. For each shipping profile and zone,
   list: zone name, countries/regions, every rate (name, price, and any
   condition such as order minimum or weight).
2. Note whether local pickup or local delivery is enabled, and for which
   location.
3. Settings → Taxes and duties. Report: is tax collected in the United
   States? For which states is the store registered to collect?

REPORT BACK: everything above as a list. Do not edit any rate, zone or tax
setting.
```

---

## 10. Point the store's email at info@tiredroponline.com

info@tiredroponline.com is the single address for forms, business information
and contact. The pages and footer already publish it. Shopify's own settings
and the four legal policies still use the gmail address or the phone alone,
and those can only be changed in the admin. The Horizon contact form delivers to the store contact email, so until
step 2 is done, contact-form messages keep going to gmail.

```
TASK: Make info@tiredroponline.com the store's email, and prove it receives mail.
I am logged into Shopify admin and GoDaddy in this browser.
Domain: tiredroponline.com (DNS at GoDaddy). Store: TireDrop.

1. CHECK THE MAILBOX EXISTS (read only). In GoDaddy, open DNS for
   tiredroponline.com and list every MX record (priority + value). Also note
   whether GoDaddy shows an email product (Microsoft 365 / Professional
   Email) or forwarding for this domain.
   If there are NO MX records, STOP HERE and report "info@ has no mailbox" —
   do not change anything in Shopify.

2. Shopify admin → Settings → General → Store details → edit the contact
   info. Set Store email / contact email to info@tiredroponline.com. Save.
   If Shopify asks to verify the address, say so in your report.

3. Settings → Notifications → Sender email: set info@tiredroponline.com.
   If Shopify offers "Authenticate domain", open it and copy every DNS record
   it shows (type, host/name, value) exactly.
   In GoDaddy DNS for tiredroponline.com, ADD those records exactly as shown.
   Do NOT edit or delete any existing record (especially the A, CNAME and
   MX records Shopify and email already use).
   Back in Shopify, click Verify. Report the status (it may say pending; DNS
   can take up to 48 hours).

4. POLICIES. Settings → Policies. Make ONLY these text edits, then Save each.
   Do not change any other wording, even text that looks wrong.
   a. Privacy policy, "Contact" section at the bottom: change
      extremetiresmarketing@gmail.com  →  info@tiredroponline.com
   b. Refund policy: in the three places it says "contact us at (954) 773-1896"
      or "return question at (954) 773-1896", add " or info@tiredroponline.com"
      right after the phone number.
   c. Shipping policy, "Contact us about this document" block at the bottom:
      add a new line info@tiredroponline.com under (954) 773-1896.
      Also in the Shipping policy, change the sentence
      "Shipping method, cost and the estimated delivery window are shown at
      checkout and on your order confirmation."
      → "Shipping is free to any street address in the continental United
      States. The estimated delivery window is shown at checkout and on your
      order confirmation."
   d. Terms of service, SECTION 25: change "should be sent to us at
      (954) 773-1896." to "should be sent to us at info@tiredroponline.com or
      by phone at (954) 773-1896.", and add a line info@tiredroponline.com
      under the final (954) 773-1896.
   After saving, search each policy for "gmail" and confirm it is gone.

5. TEST. Open https://tiredroponline.com/pages/contact in a new tab and
   submit the contact form with name "Website test", your own email, and
   message "TEST from the website contact form — please ignore."
   Report exactly what the page says after submitting.

6. REPORT BACK:
   - MX records found (or "none")
   - Store contact email: saved yes/no, verification needed yes/no
   - Sender email: status, and the DNS records you added (copy them)
   - Policies: which of a–d were saved, and whether "gmail" still appears
   - Contact form test: the on-page message
   Justin will confirm the test message arrived in the info@ inbox.
```


---

## 11. Visual audit of the live site (read only)

Run after any publish. It checks the live storefront at desktop and phone
width for layout, symmetry and broken pieces. It changes nothing.

```
TASK: Visual audit of https://tiredroponline.com. CHANGE NOTHING. Screenshot
every problem you find.

Check every page below twice: once with the browser window at full desktop width
(about 1440px), then with it narrowed to phone width (about 390px, or use
DevTools device mode, iPhone 12/13/14).

PAGES:
/ · /collections/tires · /collections/wheels · /cart · /search?q=225/45R17
/pages/find-my-tires · /pages/tire-size · /pages/tire-check
/pages/shipping · /pages/install · /pages/mobile-service · /pages/auto-service
/pages/commercial-tires · /pages/about · /pages/locations · /pages/contact
/pages/reviews · /pages/gallery · /pages/financing · /pages/tire-care
/pages/terms · /pages/privacy · /pages/accessibility · /pages/data-sharing-opt-out
/this-page-does-not-exist (404)

ON EVERY PAGE CHECK:
1. Nothing runs off the side. Scroll right; there must be no sideways scroll.
2. Left and right edges line up. Headings, text and cards share the same left
   margin, and the margins are equal on both sides.
3. Headings that should be centred are centred. There are no one-word orphan
   lines in big headings.
4. Cards in the same row are the same height, with their buttons lined up.
5. There is no blank section, no raw code or "Liquid error" text, and no
   broken images or icons.
6. Text is readable: no light grey on white, and no dark text on the dark
   bands.
7. PHONE: tapping buttons and links is easy, and none overlap. The bottom
   "Shop Tires / Call" bar never covers content or the footer.

SITE-WIDE CHECKS:
- Header: desktop dropdowns (Tires, Wheels, Shipping & Install, Service,
  Tools, More) open on hover or click and close on Esc. The search box
  submits. The cart icon goes to /cart.
- Phone header: the menu button opens the drawer, sub-menus expand, and it
  closes on X and Esc.
- Footer: 4 link columns, then "The Shop Behind Us" (phone, email, address,
  hours, Facebook), then the bottom bar (logo, ©, Terms of Use · Privacy ·
  Your Privacy Choices · Accessibility). Click each footer link once and
  report any 404.
- Homepage hero "Find your fit" card: pick Year, Make and Model, then press
  Find Tires. Switch to the size tab, enter 225/45R17 and press Find Tires.
  Report where each one lands.
- Tools: Tire Size Decoder with 225/45R17 shows numbers. Tire Check with
  4/32 and DOT 1015 shows a verdict. Find My Tires can be completed.
- Tables on Auto Service and Mobile Service: at phone width they turn into
  stacked cards, with no sideways scroll.
- Contact, Financing and Commercial forms: DO NOT SUBMIT. Only confirm the
  fields line up and an empty submit shows error messages.
- Cart (empty is fine): it shows "Shipping: Free" and has no promo code
  field.
- Nothing anywhere mentions rebates, coupons, "since 2006", star ratings or
  staff names.

REPORT BACK: a list grouped by page. For each problem give desktop or phone,
what's wrong, where on the page it is, and a screenshot. Finish with the pages
that had no problems.
```

---

## 12. Route every form, order and sign-up alert to info@tiredroponline.com

Checked from the code side: the Contact, Financing and Commercial quote forms
all use Shopify's native contact form, so they deliver to the store contact
email. A test message sent to info@tiredroponline.com on 2026-09-28 did not
bounce. The newsletter pop-up creates customers tagged `newsletter`, so an
email alert for new sign-ups needs a Shopify Flow workflow.

```
TASK: Point TireDrop's store email, order alerts and newsletter alerts at
info@tiredroponline.com. I'm logged into Shopify admin (TireDrop) and GoDaddy.

1. Settings → General → Store details → Contact information:
   Store email / contact email = info@tiredroponline.com → Save.
   Report if Shopify asks to verify the address.
2. Settings → Notifications → Sender email = info@tiredroponline.com.
   If "Authenticate domain" appears, copy each DNS record exactly, ADD it in
   GoDaddy DNS (don't edit or delete existing records), then click Verify.
   Report the status.
3. Settings → Notifications → Staff notifications → Add recipient →
   Email → info@tiredroponline.com, with "New order" ON → Save →
   Send test notification.
4. Skip: the newsletter alert is workflow 1 in prompt 13.
5. TEST: https://tiredroponline.com/pages/contact → name "Website test",
   message "TEST — please ignore" → submit. Report the on-page message.

REPORT BACK: each step done Y/N, the sender-email status and the DNS
records added, and the contact-form test result.
```

## 13. Shopify Flow workflows (all alerts to info@tiredroponline.com)

Flow is already installed (checked via the API on 2026-09-28). Workflows can
only be built inside the Flow app: Shopify has no API for creating them and
says not to hand-edit `.flow` files. So this prompt builds them in the browser.
Workflow 1 replaces step 4 of prompt 12. If that step already made
"Newsletter signup alert", skip workflow 1.

```
TASK: Build 5 Shopify Flow workflows for TireDrop. I'm logged into Shopify
admin. Go to Apps → Flow → Create workflow for each one. Every email goes to
info@tiredroponline.com. Name each workflow exactly as written, turn it ON
after saving (except #5, leave it OFF), and don't change any other settings.

1) "Newsletter signup alert"
   Trigger: Customer created
   Condition: Customer / Tags → includes "newsletter"
   Then: Send internal email
     To: info@tiredroponline.com
     Subject: New TireDrop newsletter signup
     Message: {{customer.email}} just joined the TireDrop list (sign-up pop-up).

2) "Order routing: local vs ship"
   Trigger: Order created
   FIRST, Condition S (ship-to-store): Order / Custom attributes has at
     least one item with Key equal to "Delivery" AND Value contains
     "Ship to store"
   Then (S true): Add order tags "ship-to-store-install"
     + nested Condition: at least one of Order / Fulfillment orders has
       Delivery method / Method type equal to PICK_UP
       If NOT true: Send internal email
         Subject: [CHECK] {{order.name}}: chose ship-to-store but checkout shipped
         Message: {{order.name}} ({{order.email}}) picked "Ship to store for
         install" on the site but checked out with a home address
         ({{order.shippingAddress.city}} {{order.shippingAddress.zip}}).
         Call them before it ships: send to the shop or to the address?
   (Then continue to the LOCAL check below, as a separate step after S.)
   LOCAL means ANY of these is true:
     s) Condition S above was true
     a) at least one of Order / Fulfillment orders has Delivery method /
        Method type equal to PICK_UP (if that field isn't offered, use:
        Order / Shipping line / Title contains "Pickup")
     b) Order / Shipping address / Zip starts with 330, 331, 332, 333 or 334
        AND Zip does NOT start with any of these ZIPs (Florida Keys, then
        the 334 ZIPs outside Palm Beach County):
        33001, 33036, 33037, 33040, 33041, 33042, 33043, 33045, 33050,
        33051, 33052, 33070, 33440, 33455, 33471, 33475
   Then (LOCAL): Add order tags "local"
     (+ also "pickup-sunrise" if (a) was true: use a nested condition)
     + Add customer tags "local-customer"
     + Send internal email
       Subject: [LOCAL] {{order.name}}: pickup / install / mobile
       Message: LOCAL order {{order.name}} ({{order.email}})
       Ship-to: {{order.shippingAddress.city}} {{order.shippingAddress.zip}}
       {% for li in order.lineItems %}{{li.quantity}} x {{li.title}}
       {% endfor %}
       Next step: call the customer to offer bay install or mobile service,
       or prep the tires for pickup.
   Otherwise (NOT LOCAL): Add order tags "ship"
     + Add customer tags "ship-customer"
     + Send internal email
       Subject: [SHIP] {{order.name}}: ship to {{order.shippingAddress.provinceCode}}
       Message: SHIP order {{order.name}} ({{order.email}}) to
       {{order.shippingAddress.city}}, {{order.shippingAddress.provinceCode}}
       {{order.shippingAddress.zip}}
       {% for li in order.lineItems %}{{li.quantity}} x {{li.title}}
       {% endfor %}
       Next step: confirm the supplier order and tracking.

3) "High-risk order review"
   Trigger: Order risk analyzed
   Condition: Order / Risk level equal to HIGH
   Then: Add order tags "fraud-review"
     + Hold fulfillment orders (if that action exists; skip if not)
     + Send internal email
       Subject: HIGH RISK order {{order.name}}: review before shipping
       Message: Shopify flagged {{order.name}} ({{order.email}},
       {{order.totalPriceSet.shopMoney.amount}}) as high risk. Review in
       Orders before anything ships or goes to the supplier.

4) "Cancelled order: stop supplier PO"
   Trigger: Order cancelled
   Then: Add order tags "cancelled-check-po"
     + Send internal email
       Subject: CANCELLED {{order.name}}: cancel supplier PO
       Message: {{order.name}} was cancelled. If it was already sent to
       ATD / the supplier, cancel that PO now.

5) "Low stock: under a set of 4"  (build it, leave it OFF)
   Trigger: Product variant inventory quantity changed
   Condition: Product variant / Inventory quantity less than 4
   Then: Send internal email
     Subject: Low stock: {{productVariant.product.title}}
     Message: {{productVariant.displayName}} is down to
     {{productVariant.inventoryQuantity}}. Under a full set of 4.

REPORT BACK: each workflow name, saved Y/N, ON/OFF, and any step where a
field or action didn't exist and what you used instead. Don't create test
orders.
```

**Why these:**
- **#2 and #3:** once an ATD sync app is live, it forwards orders to the
  supplier automatically. Tagging and holding orders here is the checkpoint
  before that happens.
- **#4:** a cancelled Shopify order doesn't cancel the supplier PO.
- **#5 stays off** until products exist, and it also depends on how the sync
  app handles stock. Turn it on only if tire stock is held at the shop.

## 14. Install the free apps TireDrop needs now

Picks come from a research pass on 2026-09-28. The app pages were blocked
from this environment, so prices were taken from search results and need
rechecking on the App Store listing before installing.
- **Newsletter pop-up:** already built into the theme, so Shopify Forms is
  not needed for it.
- **Work-order template:** saved at `shopify/order-printer/install-work-order.liquid`.

```
TASK: Install and set up free apps for TireDrop. I'm logged into Shopify
admin. Install ONLY the apps listed. Don't turn on any discount, coupon,
"spin to win", review-reward or countdown feature in any of them. Don't
publish any theme or language. If an app asks for a paid plan, pick the
free plan or stop and tell me the price.

1. Shopify Email (by Shopify): install. Then Settings → Notifications →
   Customer notifications → Abandoned checkout: turn automatic emails ON,
   send after 10 hours, no discount code in the email → Save.
2. Translate & Adapt (by Shopify): install → Settings → Languages →
   Add language → Spanish (Español) → leave it UNPUBLISHED → in Translate &
   Adapt, auto-translate Spanish for the theme "EDIT HERE ". Report
   how many words were translated. Do not publish Spanish.
3. Shopify Inbox (by Shopify): install → chat button ON, greeting:
   "Tire questions? Ask us: size, fitment, shipping or install."
   Business hours = the store hours in Settings → Store details.
   Instant answers: add "Is shipping free?" → "Yes, free shipping to the
   48 contiguous US states and DC." and "Do you install?" → "Yes, in South
   Florida at our Sunrise shop or with mobile service."
4. Order Printer (by Shopify): install → Templates → Create template,
   name "Install Work Order", paste the template text I give you below
   → Save. Preview it on any order or the sample, and report whether it
   renders.
5. Appointo (appointment booking): install on the FREE plan → create
   service "Tire Installation (Sunrise shop)", 60 min, and service
   "Mobile Tire Service (South Florida)", 90 min. Location: 7712 West
   Oakland Park Blvd, Sunrise, FL 33351. No deposits, no prices. Don't add
   the booking widget to any theme. Report the booking page URL it creates.

Wait (do NOT install yet): Search & Discovery filters, a fitment app
(Convermax / EasySearch), Google & YouTube, Facebook & Instagram, Judge.me.
They need real products first.

REPORT BACK: each app installed Y/N, plan chosen, anything that asked for
money, and the Appointo booking URL.
```

**Install later, in this order:**
1. Once the ATD sync app is live: Search & Discovery (tire-size filters on
   numeric variant metafields), then a fitment app. Demo Convermax first and
   ask whether it takes ATD fitment data.
2. Once products have UPCs and images: the Google & YouTube channel. Keep
   installation as a separate product, because Google Merchant Center rejects
   tires bundled with a service.
3. Once the first orders ship: Judge.me on the free plan, with review rewards
   turned off. Offering rewards would break the no-discount rule and the FTC
   fake-review rule.

**Never install:**
- accessibility overlay widgets (they're linked to ADA lawsuits and led to the
  2025 FTC action against accessiBe)
- fake sales pop-ups or countdown timers
- review importers

## 15. Local vs ship: different order-confirmation email for customers

Customers get one of five blocks in their order confirmation. The first two
come from the product-page and cart choice "Ship to store for install":
- **Ship to store (with Pickup at checkout):** says the tires are shipping to
  the shop, and to book a bay time.
- **Ship to store, but a home address at checkout:** "want it switched?"
  note. Flow also sends you a `[CHECK]` email.

The other three:
- **Pickup:** ready-at-Sunrise details, with an offer to install while they're there.
- **Local (South Florida):** free shipping, plus an offer of shop or mobile
  install.
- **Ship (everyone else):** a shipping and tracking note, and a suggestion to
  have a local shop mount the tires.

The block is saved at `shopify/notifications/order-confirmation-local-block.liquid`.
It uses the same ZIP rules as Flow workflow 2: prefixes 330–334, minus the
Florida Keys and the 334 ZIPs outside Palm Beach County (prompt 23 updates a
store set up before that list grew). It passed 8 local test cases (pickup, Sunrise, ZIP+4, Palm Beach,
Key West, Treasure Coast, out-of-state, no address). Shopify has no API for
notification templates, so this has to be done in the browser.

```
TASK: Add TireDrop's local-vs-ship block to the Order confirmation email.
I'm logged into Shopify admin.

1. Settings → Notifications → Customer notifications → Order confirmation
   → Edit code.
2. Copy the ENTIRE current template code into a note first, as a backup, and
   keep it in your report.
3. Find the first place the code shows {{ email_body }}. Put the cursor
   right after the closing tag of the element that contains it (usually
   </p>), press Enter, and paste the block I give you below exactly.
4. Click Preview. Report whether it shows a blue box that starts with
   "Free shipping to your door" (the preview has a non-local address).
5. Save. Then "Send test email" to info@tiredroponline.com.
6. Do NOT edit any other notification.

REPORT BACK: saved Y/N, the preview result, and whether the test email
arrived with the blue box.
```

**Undo:** paste the backup from step 2 back in, or click "Revert to default".

## 16. App credentials so the Vercel live-price site can open Shopify checkouts

The Vercel site shows live ATD prices. At checkout it creates a Shopify
**draft order** made of custom line items: no products are created or changed
in Shopify. It then sends the shopper to that draft's Shopify checkout. The
ATD forwarder later reads paid orders, tags them with the ATD PO number and
adds tracking. For all of this, Vercel needs its own Shopify app.

**Shopify change:** new custom apps can no longer be made from the admin
("Develop apps"); they come from the **Dev Dashboard**. A Dev Dashboard app
gives a **Client ID + Client secret**, not a permanent token, and the Vercel
code exchanges them for a short-lived token by itself. The app has to be made
in the **same Shopify organization** as the TireDrop store.

⚠️ **Keep the secret private.** Never paste the Client secret into a chat,
email or doc. It goes straight into Vercel → Project → Settings →
Environment Variables as `SHOPIFY_CLIENT_SECRET`.

```
TASK: Create a Shopify app for TireDrop's Vercel checkout. I'm logged into
Shopify (the account that owns the TireDrop store).

1. Open the Shopify Dev Dashboard (Shopify admin → Settings → Apps →
   "Develop apps" / "Build apps in Dev Dashboard", or dev.shopify.com).
   Use the SAME organization that owns the TireDrop store.
2. Create an app named "TireDrop Vercel Checkout".
3. Access scopes (Admin API): turn on ONLY these, nothing else:
   write_draft_orders, read_draft_orders, read_orders, write_orders,
   read_merchant_managed_fulfillment_orders,
   write_merchant_managed_fulfillment_orders,
   read_customers, write_customers (for the newsletter pop-up).
   Release/save the version.
4. Install the app on the TireDrop store and approve the scopes.
5. Open the app's credentials/settings page. Tell me you can see the
   Client ID and Client secret. Do NOT copy the secret into this chat or
   anywhere else.
6. Tell me the store's myshopify.com domain (Settings → Domains).
7. If the Dev Dashboard offers ONLY a permanent "Admin API access token"
   instead of client credentials, say so. That works too
   (SHOPIFY_ADMIN_TOKEN). Still do not copy it here.

REPORT BACK: app created Y/N, installed Y/N, the scopes shown, the Client
ID (the ID is fine to share, the secret is NOT), and the myshopify.com domain.
```

**Then in Vercel** (Justin, by hand):
- `SHOPIFY_STORE_DOMAIN` = the myshopify.com domain
- `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET`, or `SHOPIFY_ADMIN_TOKEN`.
  Use one kind of credential, never both.

Checkout stays in "request" mode (orders are emailed, no card is charged)
until these are set **and** ATD is live, so no one pays against sample prices.

## 17. (OBSOLETE: replaced by the custom forms in prompt 19) Form delivery via Formspree

Retired 2026-09-28; do not run it. The original prompt is archived in
`docs/archive/formspree-form-delivery.md`.

## 18. Move tiredroponline.com from Shopify to Vercel (Shopify keeps checkout)

**Do this only after ALL of these are true:**
- The Vercel site is deployed from `TireDrop/TIREDROPONLINE-` and checked.
- Prompt 17 is done and a test form reached info@. (Prompt 17 is
  archived; prompt 19's custom forms replaced it.)
- Vercel is on Pro (Hobby doesn't allow commercial use).
- The newsletter pop-up on the React site is deployed (it needs the prompt
  16 app with the customers scopes).

What changes:
- `tiredroponline.com` + `www` → Vercel (the React site).
- `shop.tiredroponline.com` → Shopify (checkout, order status, customer
  accounts).

**Email is not touched.** The MX / TXT records that deliver info@ stay exactly
as they are.

```
TASK: Move TireDrop's website domain to Vercel and keep Shopify on
shop.tiredroponline.com. I'm logged into GoDaddy (DNS for
tiredroponline.com), Shopify admin, and Vercel (TireDrop account).
Go slowly. Report after each PART. If anything looks different from what's
described, STOP and ask me.

PART A: Back up the DNS (no changes)
1. GoDaddy → My Products → tiredroponline.com → DNS → DNS Records.
2. Copy EVERY record (Type, Name, Value, TTL) into your report, exactly.
   This is the rollback copy.
3. Point out which records are for email (MX, and TXT containing spf,
   dkim, dmarc, or google/microsoft/zoho). These must NEVER be edited or
   deleted in the steps below.

PART B: Give Shopify its new address
4. GoDaddy DNS → Add New Record: Type CNAME, Name "shop", Value
   "shops.myshopify.com", TTL 1 hour → Save.
5. Shopify admin → Settings → Domains → Connect existing domain →
   "shop.tiredroponline.com" → Next → Verify connection. If it says
   pending, wait 5 minutes and click Verify again (up to 30 minutes).
6. When it's connected: Settings → Domains → "Change primary domain" →
   choose shop.tiredroponline.com → Save.
7. In Settings → Domains, for tiredroponline.com and www.tiredroponline.com:
   choose "Remove" for each (the "…" menu). Confirm. (Only these two. Do not
   remove the myshopify.com address or shop.tiredroponline.com.)
8. Open https://shop.tiredroponline.com in a new tab. Report what loads.

PART C: Add the domain to Vercel
9. Vercel → the "tiredrop" project → Settings → Domains → Add
   "tiredroponline.com". If it offers "redirect www to apex" or add
   both, choose: add tiredroponline.com AND www.tiredroponline.com, with www
   redirecting to tiredroponline.com.
10. Vercel will show "Invalid Configuration" plus the DNS records it wants
    (an A record for @ and a CNAME for www). Copy the EXACT values it shows
    into your report. Don't assume them.

PART D: Point the domain at Vercel (GoDaddy)
11. GoDaddy DNS: EDIT the existing A record with Name "@" → Value = the
    A value Vercel showed → Save. (If there are two A records for "@",
    edit one and DELETE the other; if it's parked/forwarding, report and stop.)
12. EDIT the existing CNAME with Name "www" → Value = the CNAME value
    Vercel showed → Save.
13. Do NOT touch MX, TXT, the "shop" CNAME, or any other record.

PART E: Check
14. Vercel → Domains: wait until both show "Valid Configuration" (refresh
    every few minutes, up to 1 hour). Report the status.
15. Open https://tiredroponline.com and https://www.tiredroponline.com in a
    private window. Report: does the TireDrop Vercel site load, with the
    padlock (https)?
16. Open https://tiredroponline.com/collections/tires. Does it redirect to
    /tires?
17. Open https://shop.tiredroponline.com: does Shopify load?
18. Send a test email to info@tiredroponline.com from another account
    and confirm it arrives.

REPORT BACK: Part A backup (all records), each step done Y/N, the Vercel
DNS values used, the final Vercel domain status, and the four checks.
```

**Rollback, if the site is down more than an hour or email breaks:**
1. In GoDaddy, set the "@" A record back to its old value from the Part A
   backup (Shopify's is normally 23.227.38.65) and "www" back to
   `shops.myshopify.com`.
2. In Shopify → Domains, reconnect tiredroponline.com and make it primary.

**After the move:**
- The Shopify theme is still reachable on shop.tiredroponline.com. Later, a
  small redirect on EDIT HERE (published by Justin) can send those pages to
  tiredroponline.com, keeping checkout, order-status and account pages on
  Shopify.
- Update the Shopify store address used in emails if Shopify asks.

## 19. Go-live setup in one run (Shopify app, Vercel settings, lead-alert Flow, tests, email check)

**Rewritten 2026-09-28:** there's no Formspree. Forms and order requests go to
TireDrop's own backend: `/api/forms` → the Shopify customer record (plus a
draft order for order requests) → the Shopify Flow "Website lead alert" →
info@. See `docs/integrations/website-leads.md`. **Prompt 17 (Formspree) is
obsolete; skip it.**

```
TASK: Finish TireDrop's go-live setup. I'm logged into Shopify (store
3rxp1x-ym.myshopify.com / admin "extrememobiletires"), the Shopify Dev
Dashboard, Vercel (team TIRE DROP ONLINE, project "tiredrop"),
Outlook/Microsoft 365 for info@tiredroponline.com, and a Gmail account for
testing. Go step by step, report after each PART, and STOP and ask me if
anything differs from this.

SECRETS RULE: never write any secret (client secret, token, password) into
your report or anywhere except the Vercel environment-variable value box.
IDs and URLs are fine to report.

PART A: Shopify app (checkout, forms, newsletter)
1. Shopify Dev Dashboard (Shopify admin → Settings → Apps → Develop apps
   / "Build apps in Dev Dashboard", or dev.shopify.com), in the SAME
   organization as the TireDrop store.
2. Create app "TireDrop Vercel Checkout". Admin API scopes, ONLY these:
   write_draft_orders, read_draft_orders, read_orders, write_orders,
   read_merchant_managed_fulfillment_orders,
   write_merchant_managed_fulfillment_orders, read_customers,
   write_customers. Save / release.
3. Install it on the TireDrop store and approve.
4. Open its credentials: note the Client ID (fine to report). Keep the
   Client secret on screen for Part B, but do NOT report it.
   (If it only offers an "Admin API access token", use that in Part B as
   SHOPIFY_ADMIN_TOKEN instead, and don't report it either.)

PART B: Vercel settings
5. Vercel → tiredrop → Settings → Environment Variables. Add each for
   Production AND Preview:
   - SHOPIFY_STORE_DOMAIN = 3rxp1x-ym.myshopify.com
   - SHOPIFY_CLIENT_ID = the Client ID
   - SHOPIFY_CLIENT_SECRET = paste the Client secret (mark Sensitive)
   (Or SHOPIFY_ADMIN_TOKEN instead of the two CLIENT ones. Never both.)
   If VITE_FORM_ENDPOINT or ORDER_WEBHOOK_URL exist, DELETE them.
   Do NOT add any ATD_ variables or CRON_SECRET.
6. Deployments → latest Production → "…" → Redeploy (no build cache).
   Wait for "Ready".

PART C: Shopify Flow "Website lead alert"
7. Shopify admin → Apps → Flow → Create workflow.
8. Trigger: "Customer tags added".
9. Condition: Customer / Tags → includes → new-lead
10. Then action 1: "Send internal email":
    To: info@tiredroponline.com
    Subject: New website lead: {{ customer.displayName }}
    Message:
{% for mf in customer.metafields %}{% if mf.namespace == "tiredrop" and mf.key == "last_lead" %}{{ mf.value | newline_to_br }}{% endif %}{% endfor %}

Customer: {{ customer.displayName }}
Email: {{ customer.defaultEmailAddress.emailAddress }}
Phone: {{ customer.defaultPhoneNumber.phoneNumber }}
Open in Shopify: https://{{ shop.myshopifyDomain }}/admin/customers/{{ customer.legacyResourceId }}
    (If Flow rejects the message when saving: first remove
    " | newline_to_br". If it still errors, replace the whole first line
    with {{ customer.note }}. Report which version saved.)
11. Then action 2: "Remove customer tags" → new-lead
12. Name it "Website lead alert" → Turn on. Report saved Y/N.

PART D: Test the live site
13. Open https://tiredroponline.com/api/status and copy the text.
    Expected: forms "on", newsletter "on", checkout "request",
    atd "sample".
14. https://tiredroponline.com/contact → submit: name "Website test",
    email = my Gmail, message "TEST, please ignore". Report the on-page
    confirmation.
15. Within 5 minutes, in the info@ inbox (and Junk): an email "New website
    lead: Website test" with the message in it? Report Y/N and folder.
16. Shopify → Customers → that Gmail customer: tags lead, lead-contact
    (and NOT new-lead)? Note shows the message? Report.
17. Private window → https://tiredroponline.com, scroll halfway to trigger
    the sign-up pop-up, and sign up with my Gmail address. Report the
    success message, and whether that customer now has tags newsletter,
    popup, vercel.
18. Order-request test: https://tiredroponline.com/tires → add any tire →
    cart → checkout → choose "Pickup" (ship to store) → fill in my
    name/Gmail/phone → submit. Report the confirmation text (it should say
    nothing was charged). Then Shopify → Orders → Drafts: is there a new
    draft tagged order-request? Did a "New website lead" email arrive?
    (Do NOT send its invoice. Leave it for me.)

PART E: Shopify email sender
19. Shopify → Settings → Notifications → Sender email: report the address
    and whether it shows verified / domain authenticated. Don't change it.

PART F: Email authentication check (no DNS changes)
20. From Outlook as info@tiredroponline.com, send "SPF test" to my Gmail.
21. In Gmail open it → ⋮ → Show original. Report the SPF, DKIM and DMARC
    results (PASS/FAIL/other) exactly.

REPORT BACK: each step Y/N, Client ID (NOT the secret), /api/status text,
which Flow message version saved, results of tests 14–18, sender-email
status, and the SPF/DKIM/DMARC results.
```

**Undo:** delete the Vercel variables and redeploy. Forms go back to "not sent,
please call" and the site to sample/request mode. Turn the Flow workflow off
if needed.

## 20. Brand the Shopify checkout to match tiredroponline.com

**What the Basic plan allows:** full checkout styling (the Checkout Branding
API and custom layouts) is Shopify Plus only. Basic uses the **checkout
editor**, which covers logo, banner image, colors, fonts and backgrounds.
That's enough to make checkout read as TireDrop.

**Brand values** (from `tailwind.config.js` and `index.html`):

| Token | Hex |
|---|---|
| ink | #070E1A |
| drop blue | #0068E8 |
| dive (hover) | #0053C4 |
| fog | #F4F6FA |
| smoke | #586274 |
| red | #D40C10 |

Fonts: Archivo (headings) and Instrument Sans (body).

**Assets** (served by the live site):
- https://tiredroponline.com/brand/tiredrop.png (wordmark)
- https://tiredroponline.com/brand/checkout-banner.png (dark band, 2000×500)
- https://tiredroponline.com/brand/icon-512.png (square)
- https://tiredroponline.com/brand/og-tiredrop.jpg (cover)

```
TASK: Brand TireDrop's Shopify checkout, Shop Pay and order emails to match
tiredroponline.com. I'm logged into Shopify admin (TireDrop store).
Report after each PART with before/after screenshots or descriptions.
STOP and ask if an option below doesn't exist. Don't guess a substitute
for anything except fonts (fallbacks listed).

PART A: Download the assets (to my Downloads folder)
1. Download:
   https://tiredroponline.com/brand/tiredrop.png
   https://tiredroponline.com/brand/checkout-banner.png
   https://tiredroponline.com/brand/icon-512.png
   https://tiredroponline.com/brand/og-tiredrop.jpg

PART B: Checkout editor
2. Settings → Checkout → Customize (opens the checkout editor). Make sure
   you're editing the checkout that's live (not a copy).
3. Branding / Settings (paintbrush icon):
   - Logo: upload tiredrop.png. Size: Medium (or ~200px wide). Position:
     Left.
   - Banner: upload checkout-banner.png. (The logo sits on the dark band,
     like the website header.)
   - Main area: background color #FFFFFF.
   - Order summary: background color #F4F6FA.
   - Colors: Accent #0068E8, Buttons #0068E8, Errors #D40C10.
   - Typography: Headings = Archivo (fallback: Archivo Narrow, then
     Montserrat). Body = Instrument Sans (fallback: Inter, then Work Sans).
   - Corner radius / field style, if offered: small/rounded (not pill).
4. Save. Preview on desktop and mobile. Report: the logo is readable on the
   banner Y/N, and the buttons are blue Y/N.

PART C: Shop Pay / brand settings
5. Settings → Brand (or Sales channels → Shop → Brand):
   - Logo: tiredrop.png. Square logo: icon-512.png.
   - Colors: Primary #0068E8, Contrast/Secondary #070E1A.
   - Cover image: og-tiredrop.jpg.
   - Short description: "Tires shipped. Or installed. Free shipping to the
     48 contiguous states + DC; installation in South Florida."
   Save.

PART D: Email look
6. Settings → Notifications → Customize email templates: Logo tiredrop.png
   (width ~200px), Accent color #0068E8. Save. Send a test "Order
   confirmation" to info@tiredroponline.com and report how it looks.

DO NOT change checkout fields, payment settings, shipping, policies, or
publish/duplicate themes.

REPORT BACK: each PART Y/N, the fonts actually chosen, and a description or
screenshots of checkout (desktop + mobile) and the test email.
```

---

## 21. Order webhooks: send paid and cancelled orders to the site at once

**Why:** with these two webhooks a paid order is placed with ATD within
seconds instead of waiting for the cron, and a cancellation is flagged
(`atd-cancel-needed` / `cancelled-before-atd`). Nothing is sent to ATD
while `ATD_ORDERING_ENABLED` is off. Background and troubleshooting:
`docs/integrations/webhooks.md` (this prompt is the same as the one there).

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

## 22. "Schedule your install": order-confirmation button + two Flows

> **Done 2026-09-30.** "Needs scheduling alert" was built as **Order paid →
> wait 24 hours → tags include `needs-scheduling` and NOT `install-booked` →
> email info@**, not the "Order tags added" version below. That built version
> is the one to keep: the site tags the order `install-booked` when the
> customer books (`docs/integrations/install-scheduling.md`, section (c)).

**Why:** after a customer pays for an install order (ship-to-store, pickup or
mobile), they get asked to book the install. The order confirmation email
gets a "Schedule your install" button that goes to Track My Order. The paid
order gets tagged `needs-scheduling` by the site, and Flow emails info@ with
the order and the customer's phone. High-risk orders get tagged
`fraud-review`. Background: `docs/integrations/install-scheduling.md`. The
email snippet is saved at
`shopify/notifications/order-confirmation-schedule-install.liquid`.

This prompt fills everything in and then **stops for you to click each
Save** (and each "Turn on").

```
TASK: Add TireDrop's "Schedule your install" button to the Order confirmation
email and build two Shopify Flow workflows. I'm logged into Shopify admin.

HARD RULES, for the whole task:
- NEVER click Save, "Turn on" or "Activate" yourself. When a step says
  "STOP FOR SAVE", stop, tell me exactly what is ready, and wait for me to
  click it and say "saved". Then continue.
- Never enter card or payment details. Never press Pay, Refund, Capture,
  Publish, Delete, Remove or Revert to default. Never create, edit or
  cancel an order. Do not touch any theme, domain or DNS setting.
- Don't change any other notification, workflow or setting.

PART A: the email button

1. Settings → Notifications → Customer notifications → Order confirmation
   → Edit code.
2. Copy the ENTIRE current template code into a note first, as a backup, and
   keep it in your report.
3. Find the TireDrop block that starts with the comment
   "TireDrop: local vs non-local block" (added by prompt 15) and the </div>
   that closes it. Put the cursor right after that </div> and press Enter.
   If that block is not there, put the cursor right after the closing tag
   of the element that contains {{ email_body }} instead.
4. Paste the block below EXACTLY, from the first {%- to the last -%}:

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

5. Click Preview. The preview order is usually shipped (not pickup), so the
   new button is normally NOT shown. That is correct. Report what you see,
   and any Liquid error message word for word.
6. STOP FOR SAVE: tell me the code is pasted and ready. Wait for "saved".
7. After I've saved: click "Send test email" to info@tiredroponline.com.

PART B: Flow. Apps → Flow.

8. Look at the workflow list first. If "High-risk order review" already
   exists (prompt 13 made it), OPEN it and check it against workflow 1
   below. Only fix what differs. Do not create a second copy. Otherwise
   create it.

   1) "High-risk order review"
      Trigger: Order risk analyzed
      Condition: Order / Risk level is equal to HIGH
        (if that field isn't offered: Order / Risk / Assessments, at least
        one with Risk level equal to HIGH)
      Then:
        a) Add order tags: fraud-review
        b) ONLY IF the action list has a hold action (e.g. "Hold
           fulfillment orders"): add it. If there is none, skip it and say
           so in the report.
        c) Send internal email
           To: info@tiredroponline.com
           Subject: HIGH RISK order {{order.name}}: review before anything ships
           Message: Shopify flagged {{order.name}} ({{order.email}}) as high
           risk. It is tagged fraud-review, so nothing goes to the supplier.
           Review it in Orders before anything ships or is installed.
      STOP FOR SAVE (and for "Turn on" if it is off). Wait for "saved".

9. Create workflow → name it exactly "Needs scheduling alert".
   2) "Needs scheduling alert"
      Trigger: Order tags added
      Condition: the added tags include "needs-scheduling"
        (if the trigger has no "added tags" field: Order / Tags includes
        "needs-scheduling")
      Then: Send internal email
        To: info@tiredroponline.com
        Subject: [SCHEDULE] {{order.name}}: book the install
        Message:
          {{order.name}} is paid and needs an install booked.
          Customer: {{order.customer.displayName}}
          Phone: {{order.phone}} {{order.shippingAddress.phone}} {{order.billingAddress.phone}} {{order.customer.phone}}
          Email: {{order.email}}
          They were sent a "Schedule your install" link. If no booking arrives
          from them (a website lead tagged install-booking), call them and book
          it in Tire Guru. Remove the needs-scheduling tag once it is booked.
      If Flow rejects one of the Liquid variables, remove only that one
      variable and note it in the report.
      STOP FOR SAVE, then for "Turn on". Wait for "saved" and "on".

REPORT BACK:
- Part A: the backup of the original template (step 2), where you pasted
  the block, the preview result, saved Y/N, whether the test email arrived.
- Part B: for each workflow: existed already or new, what you changed,
  whether a hold-fulfillment action existed and was added, saved Y/N, ON/OFF,
  and any field or variable that didn't exist and what you used instead.
Don't create test orders.
```

**Undo:** Part A: paste the step-2 backup back in (you click Save). Part B:
turn a workflow off in Flow (you click it).

**After this:** the next paid install order (the $1 go-live test order works
if it is ship-to-store) should show the button in its confirmation email, get
the `needs-scheduling` tag and send the `[SCHEDULE]` email. The tag needs the
Shopify app's `write_orders` scope. If the tag never appears, Vercel's logs
will say `lacks the write_orders scope`
(`docs/integrations/install-scheduling.md`, "Scopes").

## 23. Keep Hendry, Martin and Glades ZIPs out of "local" (Flow + order email)

**Why:** the local area is ZIPs 330–334 minus the Florida Keys, but four 334
ZIPs are not in Palm Beach County: 33440 (Clewiston, Hendry), 33455 (Hobe
Sound, Martin), 33471 (Moore Haven, Glades) and 33475 (Hobe Sound PO boxes,
Martin). The site and its api already turn them away
(`src/data/serviceArea.js`). The Flow workflow "Order routing: local vs
ship" (prompt 13) and the order-confirmation block (prompt 15,
`shopify/notifications/order-confirmation-local-block.liquid`) each carry
their own copy of the list, so both need the four ZIPs added. Nothing else
changes. If prompt 15 has not been saved yet, skip Part B: re-running prompt
15 pastes the block from the repo, which already has the four ZIPs.

```
TASK: Add four ZIP codes to TireDrop's "not local" list in one Shopify Flow
workflow and in the Order confirmation email. I'm logged into Shopify admin.

HARD RULES, for the whole task:
- NEVER click Save or "Turn on" yourself. When a step says "STOP FOR SAVE",
  stop, tell me exactly what is ready, and wait for me to click it and say
  "saved". Then continue.
- Change ONLY the ZIP lists named below. Don't touch any other workflow,
  notification, theme, order or setting. Don't create test orders.

PART A: the Flow workflow
1. Apps → Flow → open the workflow "Order routing: local vs ship".
2. Find the condition that checks Order / Shipping address / Zip against the
   Florida Keys ZIPs (33001, 33036, 33037, 33040, 33041, 33042, 33043,
   33045, 33050, 33051, 33052, 33070). Write down exactly how it is built
   (each rule, AND/OR) for the report.
3. Add four more rules to that same "does NOT start with" group, built the
   same way as the Keys rules: 33440, 33455, 33471, 33475.
   If the condition is built differently from that (for example a single
   "is not one of" list), add the four ZIPs to that list instead.
4. STOP FOR SAVE. Wait for "saved". Check the workflow is still ON.

PART B: the Order confirmation email
5. Settings → Notifications → Customer notifications → Order confirmation
   → Edit code.
6. Copy the ENTIRE current template code into a note first, as a backup, and
   keep it in your report.
7. Find this exact line (it is in the block that starts with the comment
   "TireDrop: local vs non-local block"):
   {%- assign td_excluded_zips = "33001,33036,33037,33040,33041,33042,33043,33045,33050,33051,33052,33070" | split: "," -%}
   Replace ONLY that line with:
   {%- assign td_excluded_zips = "33001,33036,33037,33040,33041,33042,33043,33045,33050,33051,33052,33070,33440,33455,33471,33475" | split: "," -%}
   If the TireDrop block is not in the template at all, stop Part B here and
   say so (prompt 15 adds it, already updated). If the block is there but
   the line is not exactly that, change nothing and say what you found.
8. Click Preview and report whether the blue box still shows.
9. STOP FOR SAVE. Wait for "saved". Then "Send test email" to
   info@tiredroponline.com.

REPORT BACK: Part A: how the condition was built before, what you added,
saved Y/N, still ON Y/N. Part B: the step-6 backup, whether the line was
found, the preview result, saved Y/N, whether the test email arrived.
```

**Undo:** Part A: delete the four added rules (you click Save). Part B:
paste the step-6 backup back in (you click Save).

## 24. "Website lead alert": read the lead from the metafield, not the note

**Why:** since 2026-10-01 the website no longer writes into an EXISTING
customer's note (anyone could type a stranger's email and add text to that
real customer's record). Every lead still goes to the customer metafield
`tiredrop.last_lead`, which the Flow emails, plus a list of the last 10 in
`tiredrop.leads`. The note gets the lead only for a customer the form just
created. Tags are only added, never removed, by the website; the Flow keeps
removing `new-lead` itself.

The Flow keeps working **if its message reads the metafield** (the loop over
`customer.metafields` for `tiredrop` / `last_lead`). Prompt 19 allowed a
fallback to `{{ customer.note }}`; if that fallback is what got saved, a
returning customer's alert would show their old note instead of the new
message. This prompt checks which one is live, fixes it if needed, and
updates the last line of the email. Background:
`docs/integrations/website-leads.md`.

```
TASK: Check and update the Shopify Flow workflow "Website lead alert" for
TireDrop. I'm logged into Shopify admin (store 3rxp1x-ym.myshopify.com).

HARD RULES:
- NEVER click Save, "Turn on" or "Turn off" yourself. When a step says
  "STOP FOR SAVE", stop, tell me exactly what is ready, and wait for me to
  click it and say "saved".
- Change only the "Website lead alert" workflow and (Part C) the two
  customer metafield definitions. Don't touch any other workflow, theme,
  order, customer or setting. Don't delete anything.

PART A: Read it (no changes)
1. Shopify admin → Apps → Flow → open "Website lead alert".
2. Report: the trigger, the condition, and the actions in order.
   Expected: trigger "Customer tags added"; condition tags include
   new-lead; action 1 "Send internal email" to info@tiredroponline.com;
   action 2 "Remove customer tags" new-lead. Report ON/OFF.
3. Open action 1 and copy the whole Message text into your report.
   Say which of these it uses for the lead:
   (a) {% for mf in customer.metafields %}…"last_lead"…{% endfor %}
   (b) {{ customer.note }}
   (c) something else (copy it)

PART B: Fix the message
4. If it is (b) or (c): replace that part with this line exactly:
{% for mf in customer.metafields %}{% if mf.namespace == "tiredrop" and mf.key == "last_lead" %}{{ mf.value | newline_to_br }}{% endif %}{% endfor %}
   If Flow rejects it on save: first remove " | newline_to_br". If it
   still errors, delete the line and use Flow's "Add variable" picker to
   insert the customer metafield tiredrop.last_lead (its value). Do NOT
   use customer.note. Report which version you used.
5. In every case, change the last line of the message from
   "Earlier messages from this customer are in the customer's notes."
   to
   "Earlier website messages from this customer are in the customer metafield tiredrop.leads."
   (If that line is not there, add it at the end.)
6. If action 2 "Remove customer tags → new-lead" is missing, add it AFTER
   the email action. It must stay: the website no longer removes that tag.
   STOP FOR SAVE. Wait for "saved". Then confirm it is still ON.

PART C (optional): show the leads on the customer page
7. Settings → Custom data → Customers. If there is no definition for
   tiredrop.last_lead, add one: name "Last website lead", namespace and
   key tiredrop.last_lead, type Multi-line text. If there is none for
   tiredrop.leads, add: name "Website leads", namespace and key
   tiredrop.leads, type JSON. Don't change an existing definition (report
   its type instead). STOP FOR SAVE after each.

PART D: Test (uses my Gmail; no orders)
8. https://tiredroponline.com/contact → name "Website test", email = my
   Gmail, message "TEST 23-A, please ignore". Wait up to 5 minutes for the
   info@ email "New website lead: Website test" (check Junk). Report Y/N,
   and copy the line starting "Email check:".
9. Send a second message with the same Gmail: "TEST 23-B, please ignore".
   The second email must show "TEST 23-B" (not 23-A) and a line starting
   "Customer: Existing customer". Report Y/N for both.
10. Shopify → Customers → that Gmail customer: report the tags (expect
    lead, lead-contact, and NOT new-lead) and whether the note still shows
    only the first test (it should: the second message must NOT be in the
    note).

REPORT BACK: Part A findings (trigger, condition, actions, ON/OFF, which
message version a/b/c, the copied message), what you changed in Part B and
which lead line saved, Part C definitions added or already there, and the
results of tests 8–10.
```

**Undo:** paste the Part A message back into action 1 (you click Save).
Metafield definitions can stay; they only show the values.

## 25. GA4: mark the lead, order-request and install-booking events as Key events

**Why:** the site now sends GA4 conversion events (`src/lib/analytics.js`;
list in `docs/ops/deploy.md`, "GA4 conversion events"). GA4 only counts an
event as a conversion once it is marked as a **Key event** in GA4 Admin.
Three of them are TireDrop's real conversions: `generate_lead` (a contact,
booking, fleet quote, financing or newsletter form sent), `order_request`
(a checkout order request) and `install_booking` (an install booked from
Track My Order). Read and click only; you click each Save.

```
TASK: In Google Analytics 4, mark three events as Key events for the
TireDrop property. I am logged into analytics.google.com in this browser.

HARD RULES:
- NEVER click Save, Create or a toggle that saves on its own without telling
  me first. When a step says "STOP FOR SAVE", stop, say what is ready, and
  wait for me to click it and say "saved".
- Do not change data retention, Google signals, data streams, filters,
  links (Ads, Search Console, BigQuery), users or any other setting.
- Do not delete or rename anything.

1. Open the property "Tire Drop" (web stream measurement ID G-2MCPDH5WF9).
   If you see a different property, stop and tell me.
2. Admin (gear, bottom left) → Data display → Key events.
3. Report the key events already listed (name, and whether they are on).
4. For each of these three names, if it is not already listed:
     generate_lead
     order_request
     install_booking
   click "New key event", type the name EXACTLY (lowercase, underscores),
   and STOP FOR SAVE. After I say "saved", do the next one.
   If one is already listed but switched off, tell me; do not switch it.
5. Read only: Admin → Data streams → the web stream → Enhanced measurement
   (gear icon) → Page views → Show advanced settings. Report whether
   "Page changes based on browser history events" is ON or OFF. Do not
   change it (it must be OFF; the site sends its own page views).

REPORT BACK:
- The key events listed before you started (step 3).
- For each of the three: added / already there / switched off, and saved Y/N.
- The history-events setting from step 5.
```

**Undo:** Admin → Data display → Key events → the event's ⋮ menu →
"Unmark as key event" (you click it).

**After this:** key events count from the time they are marked (not
backdated). New events can take up to 24 hours to show in reports; GA4
DebugView (Admin → Data display → DebugView) shows them within seconds when
the site is opened through Google Tag Assistant (tagassistant.google.com).
