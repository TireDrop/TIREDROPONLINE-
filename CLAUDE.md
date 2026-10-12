# TireDrop: notes for Claude sessions

- Address the owner as **Justin**.
- **Finding files:** `docs/ops/file-map.md` ("Where is X?" lookup, which check proves each change).
- **Launch checklist:** `docs/LAUNCH-CHECKLIST.md` is Justin's master to-do list.
  - Whenever a task is finished, tick it AND strike it through (`- [x] ~~item~~ (commit or date)`), add new tasks to the right section, and bump "Last updated".
  - Show Justin the updated checklist in that same style whenever it changes.
- **Docs map:** `docs/README.md` lists every doc. New docs go in the matching
  folder (business, integrations, ops, content, prompts, audits with a date
  prefix, archive with a "Why retired" line); add them to the map and run
  `npm run check:docs`.
- **Chrome prompts:** anything Claude can't do directly (Shopify admin, GoDaddy, Vercel dashboard, Google tools) becomes a copy-paste Chrome prompt for Justin. Saved prompts live in `docs/business/shopify-admin-prompts.md`.
- **House rules for site copy:**
  - no discounts, coupons, rebates or deals
  - no invented reviews, ratings or "since" years
  - never say tires are "safe to drive"
  - no delivery or arrival dates
  - no APR or lender names
  - free shipping covers the 48 contiguous states + DC; installation is South Florida only
- **Shopify themes:**
  - never publish a Shopify theme; publishing is Justin's click
  - edit only the draft theme "EDIT HERE " (**188753510552**), never the live theme
  - Theme history: on 2026-09-30 Justin published the old draft (166982615192,
    now named "LIVE", role MAIN, with the shop. → main-site redirect). The
    previous live theme (166982254744) is unpublished and kept as a backup.
    Always check a theme's role is UNPUBLISHED before writing to it.
- **Commits** end with the Co-Authored-By trailer used in this repo's history.
