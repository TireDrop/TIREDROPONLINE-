# Review request drafts

A short text and a short email to send after an install, asking for a Google
review. Three tones: Safe, Balanced, Direct. Pick one and use it for everyone.

## Rules (read first)

- Ask for honest feedback only. Good or bad, we want it.
- Ask every customer. Never ask only the ones who seemed happy (that is review gating, and Google forbids it).
- Offer nothing in exchange for a review: no incentive, no price break, no gift, no contest entry, no "leave a review and get...". Google forbids it and our house rules forbid it.
- Never write, edit or suggest the wording of someone's review.
- Never quote star ratings or review counts anywhere until they are real and visible on the Google profile.
- No delivery or arrival times in these messages.

## Where the link goes

Every draft uses the placeholder `[GOOGLE_REVIEW_LINK]`. Today there is no
real link: `GOOGLE_PROFILE.reviewUrl` in `src/data/business.js` is still `null`.

To get it: in the Google Business Profile for the Sunrise shop, open "Get more reviews" and copy the share link.

Where to paste it, exactly: the one `reviewUrl` field inside `GOOGLE_PROFILE` in `src/data/business.js`, between the quotes.
That single field turns the review button on across the site (the Reviews page
and every link built from `googleReviewHref()`). Paste the same link in place of
`[GOOGLE_REVIEW_LINK]` in the messages below. Leave `reviewsAreReal` as `false`
until the gallery return plan says otherwise.

## Text message

**Safe**
> Hi [FIRST_NAME], thanks for choosing Extreme Tires for your [SERVICE]. If you have a minute, we would value your honest feedback on Google: [GOOGLE_REVIEW_LINK]. Questions? Call us at (954) 773-1896.

**Balanced**
> Hi [FIRST_NAME], it was a pleasure working on your [VEHICLE] today. Would you share your honest experience on Google? It helps other drivers and helps us improve: [GOOGLE_REVIEW_LINK]. Thank you from the Extreme Tires crew.

**Direct**
> Hi [FIRST_NAME], this is Extreme Tires in Sunrise. Please tell other drivers how your install went, the good and the not so good: [GOOGLE_REVIEW_LINK]. It takes about a minute. Thank you.

## Email

Subject lines: "How did we do, [FIRST_NAME]?" (Safe), "Your honest feedback on your install" (Balanced), "Please review your Extreme Tires install" (Direct).

**Safe**
> Hi [FIRST_NAME],
>
> Thank you for choosing Extreme Tires for your [SERVICE] on your [VEHICLE].
>
> If you have a few minutes, we would value your honest feedback. You can share it on Google here: [GOOGLE_REVIEW_LINK]
>
> If anything about your visit fell short, reply to this email or call (954) 773-1896 and we will listen.
>
> Extreme Tires, 7712 West Oakland Park Blvd, Sunrise, FL 33351

**Balanced**
> Hi [FIRST_NAME],
>
> Thanks for letting us work on your [VEHICLE]. Other drivers read reviews before they choose a shop, and we read them to get better.
>
> Would you share your honest experience on Google? It takes about a minute: [GOOGLE_REVIEW_LINK]
>
> Whatever you write, thank you for taking the time.
>
> The Extreme Tires crew
> (954) 773-1896

**Direct**
> Hi [FIRST_NAME],
>
> Your [SERVICE] is done. Please tell other drivers how it went, the good and the not so good: [GOOGLE_REVIEW_LINK]
>
> One minute, honest words, no pressure. If something was wrong, call (954) 773-1896 and we will make it right.
>
> Extreme Tires, Sunrise, FL

## Sending notes

- Send once, the same day or the next day. One polite reminder at most, a week later.
- Log "review asked: yes" in the tracking table in `docs/ops/gallery-return-plan.md` for every customer you ask, not just some.
- Reply to every review, good or bad, from the Google profile. Never argue.
- Texts follow the customer's consent to be texted. Email follows the usual unsubscribe rules.

## Questions for Justin

1. What is the Google review link for the Sunrise profile?
2. Which tone: Safe, Balanced or Direct?
3. Who sends the request (the counter, the van tech, or automatically from your email tool)?
