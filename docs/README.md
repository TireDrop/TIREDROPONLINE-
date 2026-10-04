# TireDrop docs map

Every document in `docs/`, one line each: what it is and when to use it. How
the code fits together is in the root [README](../README.md).

## Start here

- [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md): Justin's master to-do list. Read it first; tick and strike items when they finish.

## business/: running the store

- [shopify-admin-prompts.md](business/shopify-admin-prompts.md): numbered copy-paste Chrome prompts for everything Claude cannot do itself (Shopify admin, Vercel, Flow). Use it when a task needs Justin's browser.
- [parent-business-facts.md](business/parent-business-facts.md): where each fact about Extreme Tires (name, review profiles, distributor presence, services) came from and how far to trust it. Check it before the site states a fact about the shop.
- [2026-09-23-meeting-brief.html](business/2026-09-23-meeting-brief.html): the ATD / Tire Guru / Net Driven meeting brief from 2026-09-23. Open it in a browser for the supplier background and the questions that were asked.

## integrations/: the systems the site talks to

- [shopify-checkout.md](integrations/shopify-checkout.md): how checkout creates Shopify draft orders, the app scopes it needs, and when it takes payment. Read it before touching `/api/checkout`.
- [website-leads.md](integrations/website-leads.md): forms and order requests → Shopify customer → Flow "Website lead alert" → info@. Use it to build or fix the lead Flow.
- [webhooks.md](integrations/webhooks.md): Shopify `orders/paid` and `orders/cancelled` webhooks into `/api/webhooks/shopify`, and how to set them up.
- [install-scheduling.md](integrations/install-scheduling.md): the "Schedule your install" hand-off after payment, and Tire Guru's role (`INSTALL_BOOKING_URL`, or bookings entered by hand).
- [atd.md](integrations/atd.md): the ATD catalog, price and stock adapter (still sample mode) and what must be confirmed with ATD. Read it before the ATD call or any ATD work.
- [atd-forwarder.md](integrations/atd-forwarder.md): the gated job that places paid orders with ATD and syncs tracking, plus its sandbox test plan.
- [tire-size-finder.md](integrations/tire-size-finder.md): the photo scanner at `/tire-size-finder` (door sticker, sidewall, VIN → exact size): `ANTHROPIC_API_KEY` setup, spend limit, cost per scan, endpoint contract and the real-phone test plan.

## ops/: deploying and runbooks

- [deploy.md](ops/deploy.md): Vercel project settings, every `/api` endpoint, every server environment variable, local `vercel dev`, and the Shopify → Vercel cutover checklist. Use it for any deploy or env change.
- [domain-migration-2026-09-28.md](ops/domain-migration-2026-09-28.md): record of moving tiredroponline.com to Vercel and Shopify to shop.tiredroponline.com, with the rollback and follow-ups.
- [turn-on-the-forms.md](ops/turn-on-the-forms.md): runbook for switching the site's forms on and checking a lead reaches info@.

## content/: Learn and Blog

- [learn-plan.md](content/learn-plan.md): keyword research, hubs, the 50-guide plan and the interactive demo list for `/learn`.
- [blog-plan.md](content/blog-plan.md): keyword research, the 50-post plan and the publishing calendar for `/blog`.
- [pilot-verification.md](content/pilot-verification.md): source check of every claim in the 10 pilot articles. Follow its method when verifying new articles.

## prompts/: queued build plans and Chrome prompt packs

- [blog-learn-build.md](prompts/blog-learn-build.md): the approved phased plan (prerender, research, pilot, batches) for the Blog + Learn build.
- [2026-10-02-verify-and-index.md](prompts/2026-10-02-verify-and-index.md): Chrome prompts for the 2026-10-02 content: request indexing for the 17 new URLs + home page, check five snippet-only claims on their source pages, and read the Business Profile pin, Place ID and review link. Use it after a content release.
- [2026-10-02-justin-remaining.md](prompts/2026-10-02-justin-remaining.md): every open checklist item only Justin can do, by impact on sales: Chrome prompts (with hard stops), call scripts and email drafts, what is waiting on time or data, and the questions Claude needs answered. Start here when working through the checklist.

## audits/: findings, newest last

- [2026-09-24-technical-audit.md](audits/2026-09-24-technical-audit.md): crawlability, metadata, structured data, page weight and hosting, measured on a real build. Some sections are marked superseded.
- [2026-09-24-functional-audit.md](audits/2026-09-24-functional-audit.md): bugs found by driving the site in Chromium and not yet fixed at the time.
- [2026-09-24-distributor-readiness.md](audits/2026-09-24-distributor-readiness.md): the site reviewed as an ATD dealer-approval reviewer would see it.
- [2026-09-29-site-audit.md](audits/2026-09-29-site-audit.md): four parallel audits (UX/conversion, technical, trust/checkout/ops, competitors). The source of most open checklist items.
- [2026-10-04-seo-indexing.md](audits/2026-10-04-seo-indexing.md): sitemap, robots, titles, canonicals, JSON-LD and internal links checked against a real build; URL pattern counts, what changed, and what was left for Justin.
- [2026-10-04-city-depth.md](audits/2026-10-04-city-depth.md): Tamarac, Weston, Coral Springs and Davie city pages deepened from verified facts (source per fact), where the van brand is named, and /compare and /reviews set to noindex.

## archive/: retired, kept for the record

Each file starts with a "Why retired" line. Do not act on these.

- [tireguru-payments.md](archive/tireguru-payments.md): the Tire Guru payment plan, retired 2026-09-28 for Shopify checkout.
- [formspree-form-delivery.md](archive/formspree-form-delivery.md): the old prompt 17 (Formspree form delivery), replaced by the site's own `/api/forms`.
- [2026-09-24-live-audit-blocked.md](archive/2026-09-24-live-audit-blocked.md): a live-site audit that never ran because the network was blocked.

## Elsewhere in the repo

- [scripts/README.md](../scripts/README.md): what each build, check and dev script does.
- [shopify/README.md](../shopify/README.md): the Shopify theme source mirror (Liquid sections and templates) and its conventions.
- [CLAUDE.md](../CLAUDE.md): house rules for site copy and for Claude sessions.
