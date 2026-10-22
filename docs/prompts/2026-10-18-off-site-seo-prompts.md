# Off-site SEO: Chrome prompts for Justin (2026-10-18)

Everything the SEO roadmap needs from a browser or an account only Justin has.
Paste each prompt into the Chrome extension while signed in to the account
named. Every prompt has hard stops: the extension never types a password,
never pays, never accepts terms for you, and never invents a business fact.
Paste each REPORT BACK into Claude; Claude ticks the checklist.

**Name, address, phone (NAP) must match everywhere.** Use the Google Business
Profile (GBP) listing as the master: copy the business name, hours and
categories exactly as GBP shows them. Address: 7712 West Oakland Park Blvd,
Sunrise, FL 33351. Phone: (954) 773-1896. Website: https://tiredroponline.com.
Email: info@tiredroponline.com.

## S1. Search Console: sitemap and re-crawl (do first)

> You are in Google Search Console for tiredroponline.com (signed in as Justin).
> 1. Sitemaps: submit `sitemap.xml` again. Report the status and "Discovered URLs" count (expect about 205).
> 2. URL Inspection: for each URL below, inspect it, and if it is not indexed or shows an old version, click "Request indexing". Stop when Google says the daily quota is reached and list what is left.
>    - https://tiredroponline.com/brands
>    - https://tiredroponline.com/wheel-fitment
>    - https://tiredroponline.com/mobile-service/west-palm-beach-fl
>    - https://tiredroponline.com/mobile-service/boca-raton-fl
>    - https://tiredroponline.com/mobile-service/boynton-beach-fl
>    - https://tiredroponline.com/mobile-service/miami-fl
>    - https://tiredroponline.com/mobile-service/doral-fl
>    - https://tiredroponline.com/mobile-service/homestead-fl
>    - https://tiredroponline.com/mobile-service/hialeah-fl
>    - https://tiredroponline.com/mobile-service/tamarac-fl
>    - https://tiredroponline.com/mobile-service
>    - https://tiredroponline.com/
> 3. Do not change any settings, remove any URL or verify any new property.
> REPORT BACK: sitemap status and count, and for each URL: indexed yes/no, "indexing requested" yes/no.

## S2. Bing Webmaster Tools

> Open https://www.bing.com/webmasters. Justin signs in himself (do not type any password). If tiredroponline.com is not listed, choose "Import from Google Search Console" and import the tiredroponline.com property (Justin approves the Google permission screen himself). Then open Sitemaps and submit https://tiredroponline.com/sitemap.xml. Do not change any other setting.
> REPORT BACK: whether the site is now verified, sitemap status, number of URLs discovered.

## S3. Google Business Profile: read the three missing values

The site's structured data still has `geo`, `placeId` and `reviewUrl` empty.
Use "prompt C" in [2026-10-02-verify-and-index.md](2026-10-02-verify-and-index.md)
(reads the map pin, Place ID and review link). Paste the three values into
Claude; Claude fills `src/data/business.js` (the checks fail if the pin is
outside South Florida).

## S4. Bing Places for Business

> Open https://www.bingplaces.com. Justin signs in himself. Choose "Import from Google Business Profile" and import the Extreme Tires Sunrise listing. Review every imported field against the NAP above (name exactly as on Google, address, phone, hours, website, categories). Fix only a field that differs from Google. Stop at any verification code step and tell Justin what Bing sent and where (phone or postcard); do not guess a code.
> REPORT BACK: listing status (live / pending verification), what Bing is waiting for.

## S5. Apple Business Connect

> Open https://businessconnect.apple.com. Justin signs in with his Apple ID himself. Add or claim the business "Extreme Tires — Sunrise" (use the exact GBP name if different) at 7712 West Oakland Park Blvd, Sunrise, FL 33351, phone (954) 773-1896, website https://tiredroponline.com, hours copied from Google. Choose categories Tire Shop and Auto Repair if offered. Stop at any phone or postcard verification and tell Justin. Do not accept any paid or advertising offer.
> REPORT BACK: status and what verification Apple wants.

## S6. Facebook page and Yelp (citations)

> Check whether a Facebook business page and a Yelp listing already exist for Extreme Tires in Sunrise, FL (search by the phone number (954) 773-1896). For each one that exists, report the URL and whether name, address, phone, website and hours match the NAP above (list differences, do not edit anything). For each that does not exist, do NOT create it: report "not found". Do not claim or request ownership of any listing and do not respond to any review.
> REPORT BACK: for Facebook and Yelp: URL or "not found", and the list of NAP differences.

Claude uses the URLs from S6 and S4/S5 to add them to `sameAs` in the site's
structured data (only real, owned profiles).

## S7. Cross-link extrememobiletires.com and TireDrop

> Open the admin or editor for extrememobiletires.com (Justin signs in himself; tell Justin first which platform it is built on). On the home page and the page that describes the mobile tire service, add one plain text link "Order tires online at TireDrop" pointing to https://tiredroponline.com/mobile-service, and in the footer add "Tire shop in Sunrise, FL: TireDrop" pointing to https://tiredroponline.com/locations. Change nothing else, do not edit prices or phone numbers, and publish only if Justin confirms in chat. Take a screenshot of each change.
> REPORT BACK: the pages changed, the exact anchor text, and the live URLs.

Claude already links the other direction: TireDrop pages name Extreme Tires. After
S7 is live, Claude adds extrememobiletires.com to `sameAs` and checks it.

## Decision needed from Justin (no prompt)

- **Return window:** how many days (`RETURN_WINDOW_DAYS` in `src/data/seoFlags.js`)? It is blank, which keeps the return-policy markup off. Say the number and Claude sets it and writes the matching policy text for you to approve.
