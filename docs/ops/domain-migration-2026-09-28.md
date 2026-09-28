# Domain migration: tiredroponline.com → Vercel (done 2026-09-28)

**Result:** tiredroponline.com serves the Vercel site (React app from this
repo). Shopify is used only for checkout, on **shop.tiredroponline.com**.
Confirmed from the Shopify Admin API on 2026-09-28: primary domain =
`shop.tiredroponline.com`, SSL on.

## Vercel
Team **TIRE DROP ONLINE**, project **tiredrop**, repo `TireDrop/TIREDROPONLINE-`,
branch `main`. **Plan: Hobby.**

| Domain | Setup | Status |
|---|---|---|
| tiredroponline.com | Production (canonical) | Valid Configuration, SSL issued |
| www.tiredroponline.com | 308 → tiredroponline.com | Valid Configuration |
| tiredrop.vercel.app | Production | unchanged, noindex (vercel.json) |

Vercel's default "redirect apex to www" was deliberately unchecked, so the apex
is canonical.

## Shopify
Admin handle **extrememobiletires**. Addresses: `3rxp1x-ym.myshopify.com`
(use this for `SHOPIFY_STORE_DOMAIN`) and `extrememobiletires.myshopify.com`.

- **Primary:** shop.tiredroponline.com (connected, TLS OK)
- **Removed:** tiredroponline.com, www.tiredroponline.com
- **Kept:**
  - 3rxp1x-ym.myshopify.com
  - extrememobiletires.myshopify.com
  - etwheelz.com
  - www.etwheelz.com
  - account.etwheelz.com

## GoDaddy DNS
Nameservers are unchanged: ns25 / ns26.domaincontrol.com.

| Record | Before | After |
|---|---|---|
| A `@` | 23.227.38.32 (Shopify) | **216.198.79.1** (Vercel) |
| CNAME `www` | shops.myshopify.com. | **b0db44e78b98b68f.vercel-dns-017.com.** (Vercel) |
| CNAME `shop` | shops.myshopify.com. | unchanged |

**Email records are all unchanged:**
- MX → tiredroponline-com.mail.protection.outlook.com (priority 0)
- SPF `v=spf1 include:secureserver.net -all`
- DMARC p=quarantine
- Microsoft DKIM: selector1, selector2
- Shopify DKIM: kpa, kpa2, mailerkpa, mailerni4, pdk1, pdk2
- Microsoft 365 records: autodiscover, msoid, lyncdiscover, sip, SRV
- Verification TXT: Google site verification, Microsoft

There are still 29 records in total. The full pre-change backup is
`tiredroponline-dns-backup-2026-09-28.csv`, which Justin keeps and which is not
in this repo.

**Rollback:**
1. Set A `@` → 23.227.38.32 and CNAME `www` → shops.myshopify.com.
2. Re-add tiredroponline.com and www in Shopify → Domains and make
   tiredroponline.com primary.

## Verified 2026-09-28
- https://tiredroponline.com → Vercel, valid HTTPS
- https://www.tiredroponline.com → 308 → https://tiredroponline.com/
- /collections/tires → 301 → /tires
- https://shop.tiredroponline.com → Shopify
- **Pending:** test email to info@tiredroponline.com (Justin, manual)

## Open follow-ups
1. **SPF.** The record only includes `secureserver.net`, but mail runs on
   Microsoft 365, and Shopify also sends as the domain.
   - Shopify mail is covered by its DKIM CNAMEs (domain authentication), so
     Shopify doesn't need an SPF include.
   - For Microsoft 365: if it was set up through GoDaddy,
     `include:secureserver.net` may already cover it. Check with an SPF lookup
     and a test email's headers before changing anything.
   - If spf.protection.outlook.com isn't covered, use
     `v=spf1 include:secureserver.net include:spf.protection.outlook.com -all`.
   - Don't guess here: DMARC is p=quarantine, so a wrong SPF sends real mail
     to spam.
2. **Cart → checkout test.** Vercel checkout stays in **request mode** (order
   emailed, nothing charged) until the `SHOPIFY_*` variables are set **and**
   ATD is live. Only then does it redirect to Shopify checkout on
   shop.tiredroponline.com. Test the full flow at that point, or earlier on a
   preview deployment with the Shopify variables and ATD sandbox credentials.
3. **Shopify sender email.** Check that Settings → Notifications still shows
   it as verified and domain-authenticated.
4. **Vercel Pro.** Hobby doesn't allow commercial use, and the ATD forwarder
   cron needs Pro to run every 5 minutes (see atd-forwarder.md).
5. **The Shopify storefront is still reachable** on shop.tiredroponline.com.
   Plan: redirect storefront pages to tiredroponline.com and keep checkout,
   order status and account pages on Shopify.
   - ⚠️ **etwheelz.com also points at this Shopify store.** A blanket redirect
     in the theme would send etwheelz.com visitors to TireDrop too.
   - Decide what etwheelz.com is for first. If it needs to stay, the redirect
     should match on host `shop.tiredroponline.com` only.
6. **Links in the Chrome prompts** that used https://tiredroponline.com/pages/contact
   now reach the Vercel site's /contact, which uses Formspree (prompt 17).
