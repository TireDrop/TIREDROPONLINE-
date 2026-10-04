# Gallery and Reviews return plan

When the Gallery page and the review stars come back, and exactly how.
The crew habit that feeds this is in `docs/ops/install-photo-habit.md`; the
messages that ask for reviews are in `docs/ops/review-request-drafts.md`.

## Threshold: Gallery

Bring the Gallery back only when all of these are true:

- At least 12 real photos in total, from at least 6 different jobs.
- At least 3 photos in each of these categories: tire install, wheel install, mobile van job (or fewer categories if the shop does not offer one, and the page only shows categories that have photos).
- Every photo has consent logged as "yes" in the tracking table below.
- Plates, house numbers, faces and street signs are blurred or out of frame.
- Captions describe only what the photo shows (service and vehicle type). No customer names, no invented job counts, no "Example" tiles.
- Justin has looked at the set and approved it.

## Threshold: Reviews

- Show reviews and stars only when they are real, public on the Google profile, and linked to it.
- Never type a review in by hand and never paraphrase one. Show it as written, with a link to the source.
- Never emit `Review` or `AggregateRating` markup until `reviewsAreReal` is `true` in `GOOGLE_PROFILE` and the data comes from the real profile.
- No star rating or review count anywhere in copy until then.
- Do not filter which customers get asked. Ask all of them.
- Before then, the Reviews page keeps its honest message and the Google button (turned on by `GOOGLE_PROFILE.reviewUrl`).

## Restore steps

Gallery: follow `src/_parked/gallery/README.md` step by step (about 10 minutes):

1. Move `GalleryPage.jsx` back to `src/pages/support/`.
2. Re-add the lazy import and the `/gallery` route in `src/App.jsx`.
3. Add Gallery back to `NAV` and `FOOTER_COLUMNS` in `src/data/business.js`.
4. Add the search entry in `src/lib/sitePages.js`.
5. Update `vercel.json` (remove the two 302 redirects, put `gallery` back in the 301 list).
6. Empty `PARKED_ROUTES` in `src/lib/internalLinks.js` and add `/gallery` back to `scripts/mobile-audit.mjs`.
7. Run `npm run build`, `npm run lint`, `npm run test:lib`, `npm run check:links`, then re-submit the sitemap in Search Console.

Before step 1, replace the "Example" tiles in the page with the real photos and captions.

Reviews: when the threshold above is met, set `reviewsAreReal` to `true` in `src/data/business.js`, wire the real review data, then confirm the markup validates in Google's Rich Results Test. Nothing goes live without Justin's call.

## Tracking table

One row per job. Copy this into a spreadsheet or `tracking.csv` in the photo folder.

| Date | Vehicle | Service | Photo count | Consent (yes/no) | Review asked (yes/no) |
|------|---------|---------|-------------|------------------|-----------------------|
| YYYY-MM-DD | e.g. F-150 | tire install | 6 | yes | yes |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

Running totals to check against the thresholds:

| Category | Photos with consent | Needed |
|----------|---------------------|--------|
| Tire install | 0 | 3 |
| Wheel install | 0 | 3 |
| Mobile van job | 0 | 3 |
| Total | 0 | 12 |

Review asked should read "yes" for every job. A column of "no" is a sign the habit is slipping.

## Questions for Justin

1. Where should the photos live (see `docs/ops/install-photo-habit.md`)?
2. Are the thresholds right (12 photos, 6 jobs, 3 per category), or do you want a higher bar?
