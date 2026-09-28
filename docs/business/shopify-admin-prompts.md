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
4. Apps → install "Shopify Flow" (free) if missing → Create workflow:
   Trigger "Customer created" → Condition: customer tags include
   "newsletter" → Action "Send internal email" to info@tiredroponline.com,
   Subject "New TireDrop newsletter signup",
   Body "{{customer.email}} just joined the list." →
   name it "Newsletter signup alert" → Turn on.
5. TEST: https://tiredroponline.com/pages/contact → name "Website test",
   message "TEST — please ignore" → submit. Report the on-page message.

REPORT BACK: each step done Y/N, the sender-email status and the DNS
records added, and the contact-form test result.
```
