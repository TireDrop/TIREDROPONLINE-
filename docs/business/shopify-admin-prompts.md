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
        AND Zip does NOT start with any of these Florida Keys ZIPs:
        33001, 33036, 33037, 33040, 33041, 33042, 33043, 33045, 33050,
        33051, 33052, 33070
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
Florida Keys. It passed 8 local test cases (pickup, Sunrise, ZIP+4, Palm Beach,
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

## 16. Access key so the Vercel live-price site can open Shopify checkouts

The Vercel site shows live ATD prices. At checkout it creates a Shopify
**draft order** made of custom line items: no products are created or changed
in Shopify. It then sends the shopper to that draft's Shopify checkout. For
this, Vercel needs an Admin API token that can **only** create draft orders
and read orders.

⚠️ **Keep the token private.** Never paste it into a chat, email or doc. It
goes straight into Vercel → Project → Settings → Environment Variables as
`SHOPIFY_ADMIN_TOKEN`.

```
TASK: Create a private Shopify app for TireDrop's Vercel checkout. I'm
logged into Shopify admin.

1. Settings → Apps and sales channels → Develop apps.
   - If it asks to allow custom app development, allow it.
   - If Shopify says new custom apps must be made in the Dev Dashboard,
     follow its link and make the app there instead. Tell me which route
     you used.
2. Create an app named "TireDrop Vercel Checkout".
3. Admin API access scopes: turn on ONLY write_draft_orders and
   read_orders. Nothing else. Save.
4. Install the app on the TireDrop store.
5. Reveal the Admin API access token ONCE, and stop. Do NOT copy it into this
   chat or anywhere else: I'll copy it into Vercel myself.
6. Also tell me the store's myshopify.com domain (Settings → Domains).

REPORT BACK: app created Y/N, the route used (Develop apps or Dev
Dashboard), the scopes shown, and the myshopify.com domain. NOT the token.
```

**Then in Vercel** (Justin): add `SHOPIFY_STORE_DOMAIN` (the myshopify.com
domain) and `SHOPIFY_ADMIN_TOKEN`, then redeploy. Until both are set, checkout
stays in "request" mode, where orders are emailed and no payment is taken.
