# Justin's remaining items: one place to work through them

Every open `- [ ]` item in [LAUNCH-CHECKLIST.md](../LAUNCH-CHECKLIST.md) that
only Justin can do (his browser, his accounts, a phone call, an answer, or
waiting on time), sorted into four groups and ordered by impact on sales.
Each checklist item now ends with `→ prompt in docs/prompts/2026-10-02-justin-remaining.md (#ID)`
pointing at its entry here.

- **A. Chrome-extension prompts** (A1–A17): paste into the Chrome extension
  while logged into the account named.
- **B. Real-world tasks** (B1–B5): a call script or email draft.
- **C. Waiting on time or data** (C1–C11): what it waits on and when.
- **D. One answer from Justin** (D1–D10): Claude builds it once you answer.

Existing prompts are reused, not copied: "prompt 24" means prompt 24 in
[shopify-admin-prompts.md](../business/shopify-admin-prompts.md), and
"prompt A/B/C (verify-and-index)" means
[2026-10-02-verify-and-index.md](2026-10-02-verify-and-index.md).
Paste each REPORT BACK into Claude; Claude ticks the checklist.

## Do these first

1. **A2** Get someone signed into Outlook as info@ (it unblocks A3, C8 and every order and lead email check).
2. **A1** The $1 install test: pay #D3 and book it, pay #D4 and don't (proves the paid-install path end to end).
3. **B1** Submit the ATD connectivity form and book the ATD call (the live catalog and real orders wait on it).
4. **A4** Prompt 24: the "Website lead alert" reads the metafield (no lead lost or shown with an old note).
5. **A5** Prompt 15 again, then prompt 23 Part A (customers get the right local or ship email).
6. **B2** Send Josh the 7 Tire Guru questions (decides online install booking, C4 and C5).
7. **A6** Prompt 26: the fitment-check Flow (no wrong-size order goes to ATD).
8. **A7** Prompt 25: GA4 key events (so you can see which pages sell).
9. **A8** Search Console: request indexing (prompt A, then the state and nationwide pages).
10. **D1–D4** Answer the four "before real paid orders" questions (returns, install billing, fitment hold, ship-to-store).

## The HEADER (paste it above every Chrome prompt)

Every prompt in group A either includes these rules or tells you to paste
this HEADER above an existing prompt. The HEADER overrides anything in the
prompt below it, including older prompts that say "Save" or "Turn on".

```
HARD STOPS (these override anything in the task below):
- STOP and ask me before ANY Save, Publish, Turn on, Pay, Refund, Send
  invoice, Delete, Remove, Upgrade or DNS change. Say exactly what is
  ready and wait; I click it myself and reply "done".
- Never publish a Shopify theme. The only theme you may edit is the
  UNPUBLISHED theme "EDIT HERE " (ID 188753510552); check its role says
  unpublished before you touch it. Never edit the live theme.
- Never type, paste, read out or screenshot a password, API key, token or
  secret in this chat. If a step needs one, stop and let me type it.
- If a page does not match what the task expects, stop and describe what
  you see. Do not guess a substitute.
```

---

## A. Chrome-extension prompts (Justin's browser)

### A1. The $1 install test (pays #D3 and #D4, books one, refunds both)

Covers: "$1 install test" and "`/track` tested with the $1 order".
Steps come from [install-scheduling.md](../integrations/install-scheduling.md), "The `$1` install test".
Logged into: Shopify admin + your own email. You pay with your own card;
the extension never does.

```
HARD STOPS (these override anything below):
- STOP before ANY Pay, Refund, Cancel, Send invoice, Save or Delete. Say
  what is ready; I click it and reply "done".
- Never publish a Shopify theme; only the UNPUBLISHED theme "EDIT HERE "
  (188753510552) may ever be edited, and this task edits no theme.
- Never type or read out a password, card number or key in this chat.

TASK: Run TireDrop's $1 install test with draft orders #D3 and #D4.
I'm logged into Shopify admin.

1. Shopify -> Orders -> Drafts. Open #D3 and #D4. Report for each: total,
   line items, tags, customer email, and the invoice link if one exists.
   STOP: I pay #D3 myself from its invoice link. Wait for "paid D3".
2. Orders: find the new order made from #D3 (report its number, say
   #1005). Within a minute it should carry the tag needs-scheduling.
   Report its tags.
3. Open https://tiredroponline.com/track?order=%23<number> (use the real
   number), type the order's email, click Track Order. Report whether the
   "Schedule your install" panel shows.
4. Pick a day tomorrow or later (not Sunday) and a window, note "TEST",
   click "Request this day and window". Report the confirmation text.
5. Back in Shopify, the same order: report the tags (install-booked added,
   needs-scheduling gone?), the last line of the note, and whether
   Metafields shows tiredrop.install_booking.
6. Open /track for that order again: does it show the booking, not the
   form? Report.
7. STOP: I pay #D4 myself. Wait for "paid D4". Report its new order
   number and tags (needs-scheduling). Do NOT book it.
8. Tell me to come back in 24 hours. Then, in info@ (Inbox and Junk):
   a [BOOKED] email for the #D3 order? NO [SCHEDULE] email for it? A
   [SCHEDULE] email for the #D4 order? Report each Y/N.
9. STOP: I refund and cancel both test orders myself.

REPORT BACK: order numbers, tags after steps 2/5/7, the /track results
(steps 3, 4, 6), the three email checks from step 8.
```

**After this:** Claude ticks "$1 install test" and "`/track` tested". If a
tag or email is missing, paste the report; that is a Flow or webhook bug.

### A2. Someone can sign into Outlook as info@tiredroponline.com

Covers: "Someone can sign into Outlook as info@". Mail runs on Microsoft 365
([domain-migration-2026-09-28.md](../ops/domain-migration-2026-09-28.md), "Open follow-ups").
Logged into: GoDaddy (or admin.microsoft.com if you are a Microsoft 365 admin).

```
HARD STOPS (these override anything below):
- STOP before ANY password reset, Save, Add license, Buy, Upgrade,
  Delete or DNS change. I click those myself.
- Never type, paste or read out a password or recovery code in this chat.
  When a password is needed, stop: I type it myself.
- Never publish a Shopify theme (only the UNPUBLISHED "EDIT HERE "
  188753510552 may ever be edited; this task touches no theme).

TASK: Find out how info@tiredroponline.com is set up so I can sign into it.
READ ONLY until I say otherwise.

1. GoDaddy -> My Products -> Email & Office (Microsoft 365). If it is not
   there, try admin.microsoft.com -> Users -> Active users. Tell me which
   one has it.
2. Report: is info@tiredroponline.com a mailbox (a user with a license),
   an alias of another mailbox, a shared mailbox, or a forward? Which
   plan or license? Who is listed as admin?
3. If it is a mailbox: report the "Reset password" and "Shared mailbox"
   options you see. STOP. I choose and do it myself.
4. After I say "done", open outlook.office.com in a new window. STOP: I
   sign in myself. Then report that the Inbox and the Junk folder open.

REPORT BACK: where info@ lives, its type, the license, the admin, and
whether the sign-in worked.
```

**After this:** tell Claude who can now read info@; then run A3.

### A3. info@ gets Shopify mail; email folders; SPF/DKIM/DMARC

Covers: "Go-live test: email folders + SPF/DKIM/DMARC" and "Confirm
info@tiredroponline.com receives Shopify mail". Needs A2 first. Steps 4–5
are Part F of prompt 19.

```
HARD STOPS (these override anything below):
- STOP before ANY Save, Delete, Remove or DNS change. Do not touch DNS or
  any GoDaddy record. Sending the TEST emails named below is allowed.
- Never publish a Shopify theme (only the UNPUBLISHED "EDIT HERE "
  188753510552 may ever be edited; this task touches no theme).
- Never type or read out a password in this chat.

TASK: Check that TireDrop email reaches info@tiredroponline.com and
passes SPF, DKIM and DMARC. I'm signed into Shopify admin, Outlook as
info@ (outlook.office.com) and my own Gmail.

1. Shopify -> Settings -> Notifications -> Staff notifications. Report
   every recipient listed. Is info@tiredroponline.com one? If it is, use
   "Send test notification" for it.
2. Shopify -> Settings -> Notifications -> Sender email: report the
   address and whether it shows verified / domain authenticated.
3. In Outlook (info@): within 5 minutes, did the test from step 1 arrive?
   In which folder (Inbox or Junk)? Also search Inbox AND Junk for
   "Website lead alert", "[BOOKED]", "[SCHEDULE]" and "Order" from the last
   7 days; report the newest of each and its folder.
4. From Outlook as info@, send an email "SPF test" to my Gmail.
5. In Gmail, open it -> three-dot menu -> Show original. Report the SPF,
   DKIM and DMARC lines exactly (PASS / FAIL / other) and which folder it
   landed in.

REPORT BACK: staff recipients, sender-email status, each email found and
its folder, and the exact SPF/DKIM/DMARC results.
```

**After this:** if everything passes, Claude ticks both items and C8 closes
with no change. If anything fails, see C8 (never add a second DMARC record).

### A4. Prompt 24: "Website lead alert" reads the lead from the metafield

Covers: "Prompt 24". Logged into: Shopify admin. Paste the **HEADER**, then
prompt 24 from [shopify-admin-prompts.md](../business/shopify-admin-prompts.md),
including its two-message test. You click every Save.
Background: [website-leads.md](../integrations/website-leads.md).

**Check:** the REPORT BACK says which message version was live and that both
test messages arrived with the NEW text. **After this:** Claude ticks it.

### A5. Prompt 15 again, then prompt 23 Part A (order-confirmation email + Flow ZIPs)

Covers: "Re-run prompt 15" and "Prompt 23". Logged into: Shopify admin.

1. Paste the **HEADER**, then prompt 15, then the full contents of
   `shopify/notifications/order-confirmation-local-block.liquid` (open the
   file on GitHub and copy it). Add this line under the prompt:
   `Paste the block right ABOVE the "Schedule your install" button block (added by prompt 22), not after {{ email_body }}.`
   The repo copy already has the four extra ZIPs.
2. Then paste the **HEADER** and prompt 23, and add the line:
   `Do PART A only. Skip PART B: prompt 15 just pasted the updated block.`

**Check:** prompt 15's report says saved Y and the test email shows the
blue box; prompt 23's report lists the four ZIPs added and the Flow still ON.
**After this:** Claude ticks both.

### A6. Prompt 26: "Fitment check + scanner tags" Flow, then the $1 staggered test

Covers: "Justin: run Shopify admin prompt 26". Logged into: Shopify admin
(Flow). Paste the **HEADER**, then prompt 26. It builds the Flow and stops;
you review it and turn it on. Then run the test under prompt 26 ("Test
after turning it on"): you place and pay the $1 orders yourself, then
refund them yourself.

**Check:** a staggered order gets one email; a 4 × front-size order gets
the `fitment-check` tag, a fulfillment hold and one email. **After this:**
Claude ticks it. This also answers part of D3.

### A7. Prompt 25: GA4 key events

Covers: "GA4: mark generate_lead, order_request and install_booking as Key
events". Logged into: analytics.google.com. Paste the **HEADER**, then
prompt 25. Background: [deploy.md](../ops/deploy.md), "GA4 conversion events".

**Check:** all three events listed as key events; "Page changes based on
browser history events" still OFF. **After this:** Claude ticks it.

### A8. Search Console: request indexing (today's URLs, then the state pages)

Covers: "Google: retry Request indexing", "Search Console: request indexing
for the 17 URLs shipped 2026-10-02 + the home page" and "Search Console:
submit /tires-shipped and the 7 state pages". Google limits requests per
day, so this takes two days.

- **Day 1:** run prompt A (verify-and-index) as written. It includes the home
  page, which is the "retry" item.
- **Day 2:** paste this:

```
HARD STOPS (these override anything below):
- Do not remove, add or change any property, user, sitemap, setting or
  removal request. Do not click "Remove", "Removals" or "Validate fix".
- STOP before the FIRST "Request indexing": say which URL is ready and
  wait for me to reply "go all". Then do the rest of THIS list only.
- If Google shows "Quota exceeded" or any error, stop and report.
- Never publish a Shopify theme (only the UNPUBLISHED "EDIT HERE "
  188753510552 may ever be edited; this task touches no theme). Never
  type a password or key in this chat.

TASK: In Google Search Console (property tiredroponline.com, the Domain
property), inspect each URL and request indexing.

PART 1: request indexing, in this order:
https://tiredroponline.com/tires-shipped
https://tiredroponline.com/tires-shipped/florida
https://tiredroponline.com/tires-shipped/georgia
https://tiredroponline.com/tires-shipped/texas
https://tiredroponline.com/tires-shipped/california
https://tiredroponline.com/tires-shipped/new-york
https://tiredroponline.com/tires-shipped/north-carolina
https://tiredroponline.com/tires-shipped/colorado

PART 2: READ ONLY (inspect, do NOT request indexing):
https://tiredroponline.com/mobile-service
https://tiredroponline.com/mobile-service/sunrise-fl
https://tiredroponline.com/mobile-service/plantation-fl
https://tiredroponline.com/mobile-service/tamarac-fl
https://tiredroponline.com/mobile-service/coral-springs-fl
https://tiredroponline.com/mobile-service/davie-fl
https://tiredroponline.com/mobile-service/fort-lauderdale-fl
https://tiredroponline.com/mobile-service/weston-fl

For each URL: paste it into "Inspect any URL", wait, note "URL is on
Google" or "URL is not on Google" and the Page indexing line.

REPORT BACK: a table: URL | on Google? | Page indexing line | requested
Y/N (Part 1 only) or the error text. If you stopped early, list what is
left.
```

**After this:** Claude ticks the three items. Part 2 is the trigger for C7:
when all 7 city pages say "URL is on Google", wave 2 can start.

### A9. Google Business Profile: map pin, Place ID, review link

Covers: "map coordinates", "Homepage reviews card: use a real Google review
link" and "Justin: Google Business Profile link + map pin". Logged into:
the Google account that manages the Extreme Tires listing. Run prompt C
(verify-and-index) as written; it is read only and has its own hard rules.

**After this:** Claude sets `geo`, the Place ID and the review link in
`src/data/business.js`, runs `check:schema`, and ticks all three. The review
link also unlocks D7.

### A10. Vercel Pro: read the plan and the price (you decide)

Covers: "Vercel Pro ($20/mo)". Why: the Hobby plan is not for commercial
use, and the ATD forwarder's every-5-minutes cron needs Pro
([atd-forwarder.md](../integrations/atd-forwarder.md), "Vercel Cron").
Spending money is your call; this prompt only reads.

```
HARD STOPS (these override anything below):
- STOP before ANY Upgrade, Pay, Add card, Save or Delete. Reading and
  reporting only. I click Upgrade myself if I decide to.
- Never type or read out a password, card number, token or key.
- Never publish a Shopify theme (only the UNPUBLISHED "EDIT HERE "
  188753510552 may ever be edited; this task touches no theme).

TASK: In the Vercel dashboard (vercel.com), report TireDrop's plan.

1. Open the team/account that owns the tiredrop project. Settings ->
   Billing. Report the current plan name and any usage warnings.
2. Open the Pro upgrade screen but do not confirm. Report the price
   shown per month, per seat, and what is included (seats, cron
   frequency, function duration). STOP.
3. Project tiredrop -> Settings -> Cron Jobs (or the Crons tab): report
   the cron jobs listed and their schedule, and any "not available on
   Hobby" note.

REPORT BACK: plan, price as shown, cron jobs and any warnings.
```

**After this:** you decide; if you upgrade, tell Claude and it ticks the item.

### A11. Prompt 20: checkout branding

Covers: "Checkout branding (prompt 20)". Logged into: Shopify admin. Paste
the **HEADER**, then prompt 20. Its PART B step 4, PART C and PART D each
end in Save: the HEADER makes it stop so you click each one. The checkout
editor is not a theme; still, it must not publish or duplicate any theme.

**Check:** report says the logo is readable on the banner and the buttons
are blue, on desktop and phone. **After this:** Claude ticks it.

### A12. Footer sign-up test + any segment that filters on `popup`

Covers: "Footer sign-up test". The pop-up is gone; the footer sign-up tags
customers `newsletter`, `footer`, `vercel` (it was `popup`).

```
HARD STOPS (these override anything below):
- STOP before ANY Save, Delete or Turn on/off, in Segments or Flow. I
  click them. Reading and the one sign-up below are allowed.
- Never publish a Shopify theme (only the UNPUBLISHED "EDIT HERE "
  188753510552 may ever be edited; this task touches no theme).
- Never type a password or key in this chat.

TASK: Test the TireDrop footer email sign-up and find anything that
still filters on the old "popup" tag. I'm logged into Shopify admin.

1. Private window -> https://tiredroponline.com. Scroll to the footer
   "TireDrop emails" sign-up. Sign up with my Gmail address with
   "+footertest" added before the @. Report the exact success message.
2. Shopify -> Customers: find that address. Report its tags (expect
   newsletter, footer, vercel) and its email marketing status.
3. Shopify -> Customers -> Segments: open each segment. Report every
   segment whose query mentions "popup" and paste its query exactly.
   Suggest the same query with "footer" in place of "popup" (or both).
   STOP: I edit and save it myself.
4. Apps -> Flow: report every workflow whose condition mentions the tag
   "popup" (name and the condition). STOP: change nothing.

REPORT BACK: the success message, the customer's tags and status, and
each segment or Flow that mentions "popup" with its exact query.
```

**After this:** Claude ticks it once the tags are right and no segment or
Flow still depends on `popup` alone.

### A13. Spanish in the Shopify checkout

Covers: "Justin: enable Spanish in Shopify Settings → Languages (checkout)".
Prompt 14 step 2 added Spanish UNPUBLISHED; publishing a language is not a
theme publish, but it is a Publish, so you click it.

```
HARD STOPS (these override anything below):
- STOP before ANY Publish, Save, Add, Remove or Delete. I click them.
- Never publish a Shopify theme. Only the UNPUBLISHED theme "EDIT HERE "
  (188753510552) may be edited, and this task edits no theme.
- Never type a password or key in this chat.

TASK: Turn on Spanish for TireDrop's Shopify checkout. I'm logged into
Shopify admin.

1. Settings -> Languages. Report every language and its status
   (published / unpublished). Is Spanish (Espanol) listed?
2. If Spanish is listed and unpublished: STOP. Tell me the Publish button
   is ready; I click it. If it is not listed, STOP and tell me.
3. Settings -> Markets -> the United States market (or the primary
   market) -> Languages: report whether Spanish is on for that market.
   If it is off, STOP; I turn it on.
4. After I say "done": open any recent draft order invoice link in a
   private window and change the checkout language to Spanish (language
   picker, usually at the bottom). Do NOT pay. Report whether the
   checkout text turns Spanish.

REPORT BACK: the language list, Spanish status before and after, the
market setting, and whether the checkout shows Spanish.
```

**After this:** Claude ticks it.

### A14. Header links on desktop and phone

Covers: "Header links checked on desktop and phone". Read only.

```
HARD STOPS (these override anything below):
- READ ONLY. Do not sign up, submit a form, add to cart, pay, or sign in.
- Never publish a Shopify theme (only the UNPUBLISHED "EDIT HERE "
  188753510552 may ever be edited; this task touches no theme).
- Never type a password or key in this chat.

TASK: Click-test the header of https://tiredroponline.com on desktop and
on a phone-sized window.

1. Desktop (window at least 1440 px wide): click every link and button in
   the header, one at a time, coming back to the home page each time.
2. Phone: open DevTools (F12) -> device toolbar -> iPhone 12 Pro (390 px).
   Reload. Open the menu button and click every link in it, and every
   link or button in the header bar.
3. For each one note: label, where it went (final URL), whether the page
   loaded, and anything wrong (dead link, wrong page, overlaps, a menu
   that will not close, sideways scroll).
   "Track Order" should go to /track; "Account" to the Shopify account
   page on shop.tiredroponline.com.

REPORT BACK: two tables (desktop, phone): label | final URL | OK or the
problem.
```

**After this:** Claude fixes anything broken and ticks the item.

### A15. Source checks: the snippet-only claims

Covers: "Two Bridgestone quote attributions", "Facts were search-verified
only: ply ratings, XL pressures, run-flat limits; wheel guides…" and "All
new sources are search-snippet only… confirm the quoted lines". Read only.

- **First:** run prompt B (verify-and-index) for checks B1, B2, B3 and B5. In
  B4, open only the first link (the Toyo PDF) and skip the second link:
  that "same load at the same pressure" claim was cut on 2026-10-02
  (`b4e002d`) and the site now cites makers only.
- **Then:** paste this round-2 prompt for run-flat limits, the wheel guides
  and the maker sources that replaced retailer citations:

```
HARD STOPS (these override anything below):
- READ ONLY. Do not sign in, fill a form, subscribe, buy or download
  anything except opening PDF links in the browser.
- Never publish a Shopify theme (only the UNPUBLISHED "EDIT HERE "
  188753510552 may ever be edited; this task touches no theme). Never
  type a password or key in this chat.
- Cookie banner: pick Reject or close it; if only Accept is offered,
  accept and say so.

TASK: Open each source page, use Ctrl+F with the words given, and quote
EXACTLY the sentences around each hit. Verdict per check: VERIFIED (the
page says it; quote), DIFFERENT (close but not the same; quote what it
says), NOT FOUND, or BLOCKED (did not load or redirected; give the URL).

R1 Run-flat distance and speed. Our page: Bridgestone and Michelin quote
   up to 50 miles at up to 50 mph for their run-flat tires, and both tie
   run-flats to a working TPMS.
   https://tires.bridgestone.com/en-us/learn/automotive/tire-technology/run-flat-tires
   https://tires.bridgestone.com/en-us/tires/automotive/driveguard/plus
   https://www.michelinman.com/auto/assistance/michelin-faqs
   https://www.michelinman.com/auto/auto-tips-and-advice/tires-101/run-flat-tires
   Find: 50, miles, mph, TPMS, pressure monitoring, repair
R2 Run-flat repair. Our page: USTMA says the tire maker must be consulted
   on repairing a run-flat.
   https://www.ustires.org/sites/default/files/puncture_repair_handout.pdf
   Find: run-flat, manufacturer, consult
R3 Spare tires. Our page: Goodyear says compact spares generally need
   about 60 psi; Michelin says not to exceed 50 mph on a compact spare;
   AAA's general advice is no more than 50 miles on a donut spare.
   https://www.goodyear.com/en-us/learn/spare-tire-guide          Find: 60, psi
   https://www.michelinman.com/auto/auto-tips-and-advice/tires-101/driving-on-a-spare-tire   Find: 50, mph
   https://www.aaa.com/autorepair/articles/how-long-can-you-drive-on-a-spare-tire   Find: 50, miles
R4 EV tires. Our page: Michelin says EVs wear tires about 20% faster on
   average than comparable gas cars; Pirelli says the HL marking goes in
   front of the size (HL 265/35R21) and an HL tire carries about 6% to 9%
   more than an XL tire of the same size.
   https://www.michelinman.com/auto/auto-tips-and-advice/electric-mobility-guide/how-to-reduce-tire-wear
   https://www.michelinman.com/auto/auto-tips-and-advice/electric-mobility-guide/understanding-ev-tires
   https://www.pirelli.com/global/en-ww/road/cars/tyres/hl-a-new-pirelli-tyre-marking-for-electric-vehicles-53423/
   Find: 20, faster, wear, HL, 6%, 9%, XL
R5 Bolt pattern. Our page: on a 5-lug wheel, Konig measures center of
   one stud to center of the next and divides by 0.5878.
   https://news.konigwheels.com/blog/pcd-explained/   Find: 0.5878, 5, adjacent
R6 Offset. Our page: KMC says the offset is usually on the back of the
   wheel after "ET" (ET45 = 45 mm); quote how Konig and Method define
   positive and negative offset.
   https://helpcenter.kmcwheels.com/hc/en-us/articles/41323245621133-What-offset-are-my-wheels
   https://news.konigwheels.com/wheel-info-tech/wheel-offsets-explained/
   https://www.methodracewheels.com/pages/what-is-offset
   Find: ET, offset, positive, negative, backspacing
R7 Staggered. Our page: Wheel Pros says staggered tires can't be rotated
   front to back, which can lead to premature wear.
   https://helpcenter.wheelpros.com/hc/en-us/articles/43489279775629-What-is-a-staggered-fitment
   Find: rotate, rotation, wear
R8 3PMSF. Our page: the three-peak mountain snowflake means the tire met
   a measured snow traction standard on packed snow.
   https://www.michelinman.com/auto/auto-tips-and-advice/tire-buying-guide/guide-to-buying-winter-tires
   Find: snowflake, packed, traction
R9 Tesla. Our page: Teslas generally have no spare; Tesla offers an
   optional tire repair kit; the Cybertruck manual covers installing a
   spare if the truck carries one.
   https://www.tesla.com/ownersmanual/model3/en_us/GUID-3A420F3F-D897-4A26-BFEE-B13742D06865.html
   https://www.tesla.com/ownersmanual/cybertruck/en_us/GUID-C482029E-58E5-47A8-A748-8265A502A57C.html
   Find: spare, repair kit, sealant, compressor
R10 Demo source lines (just: does the page load and cover this topic?):
   https://www.bridgestoneamericas.com/en/company/safety/maintaining-tires/tire-inflation  (tire pressure)
   https://newsroom.aaa.com/2018/06/tread-lightly-worn-tires-drivers-risk/  (worn tread, stopping)
   https://www.goodyear.com/en-us/learn/what-is-a-tire-rotation  (rotation)
   https://tires.bridgestone.com/en-us/learn/automotive/tire-maintenance/how-to-check-your-tire-tread-penny-test  (penny test)
   https://www.bfgoodrichtires.com/auto/learn/buying-guide/changing-tire-size  (changing size)

REPORT BACK: one block per check (R1 to R10, one verdict per URL):
  R1 | URL | VERIFIED / DIFFERENT / NOT FOUND / BLOCKED
  Exact quote: "..."
```

**After this:** VERIFIED stays; Claude rewrites DIFFERENT lines to match the
quote, cuts NOT FOUND claims, and leaves BLOCKED ones flagged. Then Claude
ticks the three items.

### A16. 2-step login for every Shopify staff account

Covers: "2-step login for all Shopify staff (Melissa keeps full access)".

```
HARD STOPS (these override anything below):
- STOP before ANY Save, Remove staff, change of permissions, or
  security setting change. I click them. Melissa keeps full access:
  do not change her permissions at all.
- Never type, read out or screenshot a password, recovery code or
  authenticator code in this chat.
- Never publish a Shopify theme (only the UNPUBLISHED "EDIT HERE "
  188753510552 may ever be edited; this task touches no theme).

TASK: Report 2-step authentication for every TireDrop Shopify staff
account. I'm logged into Shopify admin as the store owner. READ ONLY.

1. Settings -> Users (Users and permissions). For every user (owner,
   staff, collaborators): name, role, last login, and whether 2-step
   authentication shows as on.
2. Report whether this page offers a setting to REQUIRE 2-step for all
   staff. If it does, STOP: tell me it is ready; I decide.
3. For anyone with 2-step off, write the one-line instruction I can send
   them: "Shopify -> your profile (top right) -> Manage account ->
   Security -> Two-step authentication -> turn it on."

REPORT BACK: the user table, the "require" option (yes/no), and the
list of people who still need to turn it on.
```

**After this:** once every row shows 2-step on, Claude ticks it.

### A17. Vercel build log: the NHTSA model snapshot

Covers: "After the preview deploys, check its Vercel build log for
`[vpic-snapshot] wrote dist/data/vpic-models.json`". Read only.

```
HARD STOPS (these override anything below):
- READ ONLY. STOP before ANY Redeploy, Promote, Save, Delete or setting
  change. Never open or reveal environment variable values.
- Never type a password, token or key in this chat.
- Never publish a Shopify theme (only the UNPUBLISHED "EDIT HERE "
  188753510552 may ever be edited; this task touches no theme).

TASK: In the Vercel dashboard, project tiredrop -> Deployments, open the
latest Production deployment (status Ready) -> Build Logs.

1. Use the log search for "vpic-snapshot". Report every matching line
   exactly (expected: "[vpic-snapshot] wrote dist/data/vpic-models.json"
   with a count; a failure line also counts, report it).
2. Report the deployment's commit SHA and its time.
3. Open https://tiredroponline.com/data/vpic-models.json in a new tab.
   Report whether it loads and roughly how big it is (or the error).

REPORT BACK: the vpic-snapshot lines, the SHA, and the step 3 result.
```

**After this:** Claude ticks it, or fixes the build script if the line says
it failed.

---

## B. Real-world tasks (calls and emails)

### B1. ATD: submit the connectivity form, then the call

Covers: "Submit the ATD connectivity form" and "ATD call: API access,
brands, sandbox, fees". The full question list is in
[atd.md](../integrations/atd.md) ("Questions for the ATD rep" and "Extra
questions"); this is the short version. Fill the form yourself (it may ask
for account numbers or credentials; never paste those into Claude).

**Email to the ATD rep:**

> Subject: TireDrop (Extreme Tires, Sunrise FL): Ship to Home API access
>
> Hi [name],
>
> We're launching tiredroponline.com, the online store for Extreme Tires in
> Sunrise, and want to place Ship to Home orders through the API. Could you
> send me the connectivity form (or confirm it went through if I already
> sent it) and set up a 30-minute call with whoever handles API access?
> I'll have these questions ready:
>
> 1. Does our account include Ship to Home API access? What do we sign or enable, and is there a sandbox?
> 2. Auth: how do we authenticate, how long do tokens last, and do calls need our account and ship-to numbers?
> 3. Search by size: what format, and do price and stock come back in the same call?
> 4. Fitment: is there a year/make/model (and trim) endpoint, with staggered sizes? Can we show it to shoppers?
> 5. Pricing: which price is our Ship to Home cost, and are there MAP or UMAP rules we must follow?
> 6. Freight: what does Ship to Home cost per tire or per order to the 48 contiguous states, and are there surcharges?
> 7. Stock: is quantity real time, per warehouse, and which warehouses serve us?
> 8. Images and specs: does the API include them, and may we show them?
> 9. Orders: how do we submit, cancel or change a Ship to Home order, and what are the cutoffs?
> 10. Tracking: do you push status and tracking by webhook, or do we poll?
> 11. Limits: rate limits, maintenance windows, and is a 5-minute cache OK?
> 12. Returns: how do returns and damaged deliveries work on Ship to Home?
> 13. Which brands can you drop-ship to consumers for us today?
> 14. Which sync tools are approved (direct API, Spark Shipping, Flxpoint, Slingshot)?
> 15. What is the sandbox test-order process, and how long does approval take?
> 16. Does joining Treadsy or Radius limit selling on our own site?
>
> Thanks,
> Justin
> TireDrop / Extreme Tires, (954) 773-1896

**After the call:** paste your notes into Claude. Answers 1–2 and 15 start
C1, 4 starts C3, 14 settles C2, 5 feeds B5.

### B2. Josh at Tire Guru: the 7 questions

Covers: "Justin/Melissa: send Josh the 7 questions … then decide on the
$150/mo widget". Background: [install-scheduling.md](../integrations/install-scheduling.md), "(d) When Tire Guru answers".

> Subject: TireDrop: 7 questions before we decide on the widget
>
> Hi Josh,
>
> Thanks for the call on the 30th. Before we decide on the $150/mo tire and
> service widget, a few questions:
>
> 1. Can it run in appointments-only mode (no tire search, just booking an install for tires the customer already bought from us)?
> 2. Is there a direct booking link we can send customers to, and can it be prefilled (name, email, phone, vehicle, our order number) through the URL?
> 3. Does the tire search use live ATD inventory and our pricing, or a separate feed?
> 4. If a customer pays in the widget, which payment processor takes the money? We already take payment in Shopify.
> 5. How is it embedded: iframe, script tag, or a link out to your page?
> 6. Contract: month to month, or a minimum term? Any setup fee?
> 7. Notifications: who gets an email or text when a booking comes in, and can the customer get a confirmation?
>
> Thanks,
> Justin
> TireDrop / Extreme Tires

**After this:** paste Josh's reply into Claude. A booking link → C4 is
a Vercel setting; an API → C5 becomes a build.

### B3. Second distributor (TireHub, US AutoForce, Wheel Pros)

Covers: "Second distributor". Why: ATD no longer carries some major brands
([atd.md](../integrations/atd.md), "Market check"; from search results, so
confirm with each). Send one email per distributor:

> Subject: Dealer account for drop-ship to consumers: TireDrop / Extreme Tires (Sunrise, FL)
>
> Hi,
>
> I run Extreme Tires in Sunrise, FL and its online store, tiredroponline.com.
> We're looking for a second distributor and would like to know:
>
> 1. Can we open a dealer account, and what do you need from us?
> 2. Do you drop-ship to consumers' homes in the 48 contiguous states, and to our shop?
> 3. Which brands can you ship for us?
> 4. Do you have an API, or work with Spark Shipping, Flxpoint or another sync tool, for stock, price and orders?
> 5. What does freight cost per tire or per order, and are there minimums?
> 6. Which brands have MAP or internet-sales rules we'd need to follow?
> 7. How do returns and damaged deliveries work?
>
> Thanks,
> Justin
> Extreme Tires / TireDrop, 7712 West Oakland Park Blvd, Sunrise, FL 33351, (954) 773-1896

**After this:** paste the replies into Claude; they feed C2.

### B4. Accountant: Florida tire fee and out-of-state sales tax

Covers: "Accountant: FL $1/tire fee + out-of-state sales tax". The site audit
found the fee is not collected yet
([2026-09-29-site-audit.md](../audits/2026-09-29-site-audit.md)).

> Subject: TireDrop online sales: Florida tire fee and sales tax questions
>
> Hi [name],
>
> We now sell tires online at tiredroponline.com, shipped to the 48
> contiguous states + DC, plus pickup and install at the Sunrise shop.
> Shopify works out the tax at checkout. Could you answer these?
>
> 1. Florida's new-tire fee: do we charge it on every new tire sold to a Florida customer (pickup, install and shipped to a Florida address), and not on tires shipped out of state?
> 2. Should the fee show as its own line on the invoice, and is it subject to sales tax?
> 3. Florida discretionary surtax: on a tire shipped to a Florida home, which county's rate applies?
> 4. Out of state: at what sales or order counts would we owe sales tax in another state, and how should we track it?
> 5. Is installation labor taxable in Florida when it is billed on the same invoice as the tires?
> 6. Anything we need to file or register for before the first out-of-state sale?
>
> Thanks,
> Justin

**After this:** paste the answers into Claude; the fee line is a small build
once the rules are clear.

### B5. Brand pricing rules: minimum advertised prices and online-sale limits

Covers: "Brand pricing rules: minimum advertised prices, online-sale
limits". Ask ATD (and B3's distributors) for each brand's policy in writing:

> Subject: MAP and internet-sales policies for the brands we'll sell online
>
> Hi [name],
>
> Before we list tires on tiredroponline.com, could you send the current
> MAP / UMAP and internet-sales policy for each brand we can buy from you?
> In particular:
>
> 1. Which brands have a minimum advertised price, and does it apply to the price in the cart as well as the listing?
> 2. Which brands limit or ban online sales without written consent, and how do we apply for it?
> 3. Do any brands limit shipping out of state or require installation by an authorized dealer?
> 4. How do we hear about policy changes?
>
> Thanks,
> Justin, TireDrop / Extreme Tires

**After this:** paste the policies into Claude; it adds the price floors and
brand limits to the catalog rules.

---

## C. Waiting on time or data

| ID | Item | Waits on | Date or trigger | Then |
|---|---|---|---|---|
| C1 | After ATD: live API → sandbox test → auto-ordering on → full sizes, richer specs, Google Shopping | ATD API access and credentials (B1) | When ATD sends sandbox credentials | You add them in Vercel yourself; Claude wires the adapter and runs the sandbox test-order plan in [atd-forwarder.md](../integrations/atd-forwarder.md) |
| C2 | Decide: direct API vs Spark / Slingshot / our own sync | ATD's answers to B1 questions 1 and 14, and B3 replies | After the ATD call | Claude writes a one-page comparison; you pick |
| C3 | Fitment by trim + staggered | Real fitment data (B1 question 4) | After the ATD call | Claude builds trim and staggered sizes on the shipped badge logic |
| C4 | `INSTALL_BOOKING_URL` after the Tire Guru call | Josh's answer (B2) | When Josh replies | Booking link: you add it in Vercel and redeploy (steps in [install-scheduling.md](../integrations/install-scheduling.md), "(d)"); an API: tell Claude |
| C5 | Book an install time at checkout | Same as C4 | When Josh replies | Link: a button at checkout; API: Claude builds live slots |
| C6 | Rotate the scanner key before it expires 2026-10-31 | The date | **2026-10-24** (calendar reminder) | You follow "Rotating the key" in [tire-size-finder.md](../integrations/tire-size-finder.md); paste the key only into Vercel, never into chat |
| C7 | City pages wave 2: Pompano Beach, Miramar, Oakland Park, Pembroke Pines, Hollywood, Lauderhill | Wave 1 (live 2026-10-01) indexed by Google | When A8 Part 2 shows all 7 wave 1 URLs "on Google" | Claude builds wave 2 (D8 answers make it richer) |
| C8 | SPF/DMARC: fix only if the Gmail test fails | A3 step 5 | After A3 | Pass: nothing to do. Fail: Claude drafts the one SPF change from [domain-migration-2026-09-28.md](../ops/domain-migration-2026-09-28.md); you make it in GoDaddy. Never a 2nd DMARC record |
| C9 | Switch the CSP from report-only to enforced | 7 days of clean `[csp]` logs (CSP shipped 2026-10-01, Translate hosts added the same day) | **Earliest 2026-10-08** | Run the read-only prompt below; if clean, Claude makes the change in [deploy.md](../ops/deploy.md) "Switching from report-only to enforced" |
| C10 | Shopify theme copy still says "continental United States" | The shop. → main-site redirect coming off | Only if the redirect is ever removed | Claude edits the UNPUBLISHED "EDIT HERE " theme only |
| C11 | Theme `td-vehicles.js` → `/api/vehicles` | The theme finder being shown again | Only if that happens | Same: draft theme only |

**C9 log check (paste on or after 2026-10-08):**

```
HARD STOPS (these override anything below):
- READ ONLY. STOP before ANY Redeploy, Save, Delete or setting change.
  Never open environment variable values.
- Never type a password, token or key in this chat.
- Never publish a Shopify theme (only the UNPUBLISHED "EDIT HERE "
  188753510552 may ever be edited; this task touches no theme).

TASK: In Vercel, project tiredrop -> Logs, set the time range to the
last 7 days (Production) and filter for "[csp]".

1. Report how many lines match.
2. Group them by directive and source (each line looks like
   "[csp] report <directive> blocked=<...> page=<path> source=<origin>")
   and give a count per group, with one example line each.
3. Mark any group whose source starts with chrome-extension or names a
   host that is clearly a browser extension.

REPORT BACK: the total, the grouped table, and the example lines.
```

---

## D. Claude can build it once Justin answers

Answer by number in one message (for example "D6: b"). A short answer is enough; Claude asks again only if something is unclear.

1. **D1 Returns window + warranty/road-hazard links.** How many days does a customer have to return unmounted tires, and is there a restocking fee? Mounted tires: no returns, right? Do you sell road-hazard protection, and from which provider? Claude links each maker's own warranty page.
2. **D2 Bill installation on the invoice.** Should installation be its own line on the Shopify invoice at the price the site shows, paid at checkout, or collected at the shop? Per tire or per set?
3. **D3 Fitment hold before orders go to ATD.** Hold only the orders tagged `fitment-check` (A6 does that), or hold every order until someone at the shop confirms the size and adds a `fitment-confirmed` tag?
4. **D4 Ship-to-store flow + "Tires arrived at the shop" notice.** How many days do you hold tires that arrived for a customer? Who tags the order `arrived-at-store` when they arrive, so the customer gets the "book your bay time" email?
5. **D5 Roadside flat tire help.** What is the starting price? (Until then it stays phone only.)
6. **D6 Footer link "Tires Shipped Nationwide".** Pick one: (a) "Free Shipping: 48 States + DC", (b) "Tires Shipped to 48 States + DC", or your own wording.
7. **D7 Real review collection.** Once A9 gives the review link: may Claude add a "Leave us a Google review" link to the fulfilled-order email and the `/track` page after a booked install? Any other place you want it?
8. **D8 City facts (wave 1 pages).** Please confirm or correct: Tamarac ZIPs, main roads and neighbourhoods; Coral Springs, Davie and Weston main roads; Coral Springs and Weston neighbourhoods; is Plantation 33388 a PO Box ZIP? A short list per city is enough.
9. **D9 Remaining state pages.** Which states next, in what order? (Default if you don't mind: the states with the most visitors in GA4, 7 per batch.)
10. **D10 HSTS preload.** Add `preload` and submit tiredroponline.com to hstspreload.org? It is hard to undo: every subdomain must stay on HTTPS for good. Yes or not now?

---

## Appendix: Claude's own queue (no Justin action)

Open items Claude builds with no answer needed, listed so nothing is
missed. They have no "→ prompt" pointer in the checklist.

- Accessibility, second pass (heading order on the Learn hubs, /blog, /wheels, /compare; UTQG table heading).
- A shared /tires link spells an unknown model from the URL ("Cx-5").
- Installed-price toggle.
- Blog + Learn Phase 3, batches 2–9.
- Phase 4: internal links, Search Console submit, monthly refresh.
