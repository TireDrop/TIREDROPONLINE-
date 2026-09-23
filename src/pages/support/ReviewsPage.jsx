// NOTE FOR THE BUILD TEAM: the reviews in REVIEWS below are illustrative
// placeholder content written to show the page layout and tone. They are not
// real customer submissions. Replace them with verified reviews (or wire this
// page to a live review feed) before the site goes to production.

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ExternalLink,
  Phone,
  Star,
  Truck,
} from "lucide-react";
import { BUSINESS, googleReviewHref } from "../../data/business.js";
import {
  Badge,
  Breadcrumbs,
  PageHero,
  Section,
  SectionHead,
  Seo,
  Stars,
} from "../../components/ui/index.jsx";

// Resolves to the profile's direct review link once GOOGLE_PROFILE is filled
// in (src/data/business.js); falls back to a Maps search until then.
const GOOGLE_REVIEWS_HREF = googleReviewHref();

const REVIEWS = [
  {
    id: 1,
    name: "Marisol R.",
    rating: 5,
    date: "August 28, 2026",
    service: "Mobile Tire Installation",
    body: "Four new tires in my own driveway in Plantation while I was on a work call. Tech laid down a mat, worked clean, torqued everything by hand and showed me the old tread next to the new. I never moved the car.",
  },
  {
    id: 2,
    name: "Devon P.",
    rating: 5,
    date: "August 19, 2026",
    service: "Mobile Tire Repair",
    body: "Picked up a screw in the rear tire at the office park off Oakland Park. Called at 9, van was there before lunch. They pulled the tire, patched it from the inside and rebalanced it. Back to my desk in half an hour.",
  },
  {
    id: 3,
    name: "Alina K.",
    rating: 5,
    date: "August 6, 2026",
    service: "Tire Balancing",
    body: "Had a shimmy at highway speed for months and two other places told me it was normal. These guys rebalanced all four in my building's garage and it is dead smooth now. Wish I had called sooner.",
  },
  {
    id: 4,
    name: "Rob T.",
    rating: 4,
    date: "July 30, 2026",
    service: "Mobile Tire Installation",
    body: "Good work and fair price on a set for my F-150. Arrival window was a little wide and they landed at the back end of it, but they called ahead so I could plan around it. Job itself was clean.",
  },
  {
    id: 5,
    name: "Grace N.",
    rating: 5,
    date: "July 22, 2026",
    service: "Tire Rotation",
    body: "Standing rotation appointment every few months at my house in Davie. Same tech most times, which I like. He checks pressures, looks at the brakes while he is in there and tells me straight when something is getting close.",
  },
  {
    id: 6,
    name: "Hector M.",
    rating: 5,
    date: "July 9, 2026",
    service: "Commercial & Fleet",
    body: "We run six work vans out of a yard in Tamarac. They come to us on a schedule instead of us losing a van for a day. One invoice, no downtime. That alone is worth the call.",
  },
  {
    id: 7,
    name: "Priya S.",
    rating: 5,
    date: "June 27, 2026",
    service: "Mobile Tire Repair",
    body: "Flat in the driveway on a Saturday morning with a car seat still buckled in the back. They came out, fixed it properly instead of selling me a new tire, and were gone in under 40 minutes. Honest people.",
  },
  {
    id: 8,
    name: "Cameron W.",
    rating: 4,
    date: "June 15, 2026",
    service: "Wheel Alignment",
    body: "Alignment at the Sunrise shop after I put new tires on. Steering is centered again and they showed me the before and after printout. Only reason it is not five is the wait — it was busy that morning.",
  },
  {
    id: 9,
    name: "Yvonne A.",
    rating: 5,
    date: "June 3, 2026",
    service: "Mobile Tire Installation",
    body: "Ordered tires through them, they showed up at my mother's place in Lauderhill and did the whole set in her carport. She is 78 and did not have to sit in a waiting room. That is the whole reason I called.",
  },
  {
    id: 10,
    name: "Jared L.",
    rating: 3,
    date: "May 24, 2026",
    service: "Mobile Tire Installation",
    body: "The install was solid and the tech knew his stuff. The scheduling got crossed and I had to call twice to confirm the day, which was frustrating. They did own it and knocked something off the bill.",
  },
  {
    id: 11,
    name: "Tanisha B.",
    rating: 5,
    date: "May 11, 2026",
    service: "TPMS Service",
    body: "Light would not go off after another shop did my tires. They diagnosed a dead sensor, replaced it in my work parking lot in Fort Lauderdale and relearned the system. No light since.",
  },
  {
    id: 12,
    name: "Andres V.",
    rating: 5,
    date: "April 29, 2026",
    service: "Mobile Tire Installation",
    body: "Jobsite call in Weston. Truck was sitting on a shredded tire and we had crews waiting. They rolled in, swapped two tires on the spot and we did not lose the afternoon.",
  },
  {
    id: 13,
    name: "Leah F.",
    rating: 2,
    date: "April 14, 2026",
    service: "Quote Request",
    body: "Quoted one size, then the tire was not in stock and the replacement option was more than I wanted to spend. To be fair they did not push me and offered to order the original, but I needed it that week.",
  },
  {
    id: 14,
    name: "Omar H.",
    rating: 5,
    date: "April 2, 2026",
    service: "Brake Repair",
    body: "Brought it into the Sunrise shop for brakes. They called before doing anything extra, sent me a price for the rotors and let me decide. No surprises on the final bill, which is rarer than it should be.",
  },
];

const FILTERS = [
  { value: "all", label: "All" },
  { value: "5", label: "5 star" },
  { value: "4", label: "4 star" },
  { value: "3", label: "3 star" },
  { value: "2", label: "2 star" },
  { value: "1", label: "1 star" },
];

function ReviewCard({ review }) {
  return (
    <li className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg uppercase tracking-wide text-ink">
            {review.name}
          </p>
          <p className="text-xs text-smoke">{review.date}</p>
        </div>
        <Stars rating={review.rating} />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-smoke">{review.body}</p>

      <p className="mt-5 border-t border-ink/10 pt-4">
        <Badge tone="soft">{review.service}</Badge>
      </p>
    </li>
  );
}

/** Client-side review composer — nothing is submitted anywhere. */
function LeaveReview() {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (rating === 0) {
      setError("Pick a star rating first.");
      return;
    }
    if (text.trim().length < 15) {
      setError("Tell us a little more — a sentence or two about the job.");
      return;
    }
    setError("");
    setDone(true);
  };

  if (done) {
    return (
      <div className="card border-l-4 border-l-drop p-6 md:p-8" role="status">
        <CheckCircle2 size={32} aria-hidden className="mb-4 text-drop" />
        <h3 className="h3">Thank you — that means a lot.</h3>
        <p className="mt-3 text-sm leading-relaxed text-smoke">
          We read every one of these. If something in your visit needs fixing,
          call the shop at{" "}
          <a href={BUSINESS.phoneHref} className="text-drop underline">
            {BUSINESS.phone}
          </a>{" "}
          and ask for the service coordinator — we would rather solve it than
          read about it later.
        </p>
        <a
          href={GOOGLE_REVIEWS_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline btn-sm mt-6"
        >
          Post it on Google too
          <ExternalLink size={14} aria-hidden />
        </a>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="card p-6 md:p-8">
      <h3 className="h3 mb-2">Leave a Review</h3>
      <p className="mb-6 text-sm text-smoke">
        Had work done by us? Tell us how it went.
      </p>

      <fieldset
        className="mb-6"
        aria-describedby={error && rating === 0 ? "review-error" : undefined}
      >
        <legend className="label">Your rating *</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n}>
              <input
                type="radio"
                id={`review-rating-${n}`}
                name="review-rating"
                value={n}
                checked={rating === n}
                onChange={() => {
                  setRating(n);
                  setError("");
                }}
                className="peer sr-only"
              />
              <label
                htmlFor={`review-rating-${n}`}
                className="block cursor-pointer rounded-sm p-1 peer-focus-visible:ring-2 peer-focus-visible:ring-drop peer-focus-visible:ring-offset-2"
              >
                <span className="sr-only">
                  {n} star{n > 1 ? "s" : ""}
                </span>
                <Star
                  size={30}
                  aria-hidden
                  className={
                    n <= rating ? "fill-amber text-amber" : "text-ink/20"
                  }
                />
              </label>
            </span>
          ))}
        </div>
      </fieldset>

      <label className="label" htmlFor="review-body">
        Your review *
      </label>
      <textarea
        id="review-body"
        rows={5}
        className="field resize-y"
        placeholder="What did we do, where were you, and how did it go?"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError("");
        }}
        aria-invalid={error && rating !== 0 ? "true" : undefined}
        aria-describedby={error ? "review-error" : undefined}
      />

      {error && (
        <p id="review-error" className="mt-2 text-xs text-drop">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary mt-6 w-full sm:w-auto">
        Submit Review
      </button>
    </form>
  );
}

export default function ReviewsPage() {
  const [filter, setFilter] = useState("all");

  const { average, total, distribution } = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    REVIEWS.forEach((r) => {
      counts[r.rating] += 1;
    });
    const sum = REVIEWS.reduce((acc, r) => acc + r.rating, 0);
    return {
      average: sum / REVIEWS.length,
      total: REVIEWS.length,
      distribution: counts,
    };
  }, []);

  const visible =
    filter === "all"
      ? REVIEWS
      : REVIEWS.filter((r) => String(r.rating) === filter);

  return (
    <>
      <Seo
        title="Customer Reviews"
        description={`See what Broward County drivers say about ${BUSINESS.name} — mobile tire installs, driveway flat repairs and shop work in ${BUSINESS.address.city}, FL.`}
      />

      <PageHero
        eyebrow="Reviews"
        title="What Broward drivers say"
        lede="Driveway installs, office-park flat repairs, fleet calls and shop work. The good, and the ones where we had to make something right."
      >
        <a href={BUSINESS.phoneHref} className="btn-ghost-light">
          <Phone size={18} aria-hidden />
          {BUSINESS.phone}
        </a>
      </PageHero>

      <Breadcrumbs trail={[{ label: "Reviews" }]} />

      {/* ---------- Summary + distribution ---------- */}
      <Section className="bg-bone">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:gap-10">
          <div className="card flex flex-col items-center justify-center p-8 text-center">
            <p className="font-display text-6xl leading-none text-ink">
              {average.toFixed(1)}
            </p>
            <div className="mt-3">
              <Stars rating={average} size={20} />
            </div>
            <p className="mt-3 text-sm text-smoke">
              Based on {total} customer reviews
            </p>
            <a
              href={GOOGLE_REVIEWS_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-dark btn-sm mt-6"
            >
              Review us on Google
              <ExternalLink size={14} aria-hidden />
            </a>
          </div>

          <div className="card p-6 md:p-8">
            <h2 className="h3 mb-5">Rating breakdown</h2>

            <ul className="space-y-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star];
                const pct = total ? Math.round((count / total) * 100) : 0;
                return (
                  <li key={star} className="flex items-center gap-3">
                    <span className="w-14 shrink-0 font-display text-sm uppercase tracking-wide text-ink">
                      {star} star
                    </span>
                    <span
                      className="h-2.5 flex-1 overflow-hidden rounded-sm bg-ink/10"
                      role="img"
                      aria-label={`${star} star: ${count} of ${total} reviews, ${pct} percent`}
                    >
                      <span
                        className="block h-full bg-amber"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-right text-sm text-smoke">
                      {count}
                    </span>
                  </li>
                );
              })}
            </ul>

            <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-smoke">
              <Truck size={15} aria-hidden className="mt-px shrink-0 text-drop" />
              Most of these came from mobile calls — driveways, office lots and
              jobsites across {BUSINESS.serviceArea.length} Broward cities.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------- Filter + list ---------- */}
      <Section className="bg-fog">
        <SectionHead
          eyebrow="Read Them"
          title="Filter by rating"
          lede="We are not hiding the three-star ones. If we dropped the ball, you should be able to read about it."
        />

        <div
          role="group"
          aria-label="Filter reviews by star rating"
          className="mb-8 flex flex-wrap gap-2"
        >
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.value)}
                className={`rounded-sm border px-4 py-2 font-display text-sm uppercase tracking-wide transition-colors ${
                  active
                    ? "border-drop bg-drop text-bone"
                    : "border-ink/15 bg-bone text-ink hover:border-ink"
                }`}
              >
                {f.label}
                {f.value !== "all" && (
                  <span className="ml-1.5 text-xs opacity-70">
                    ({distribution[Number(f.value)]})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p aria-live="polite" className="mb-5 text-sm text-smoke">
          Showing {visible.length} of {total} reviews
        </p>

        {visible.length > 0 ? (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </ul>
        ) : (
          <div className="card px-6 py-14 text-center">
            <h3 className="h3">No reviews at that rating</h3>
            <p className="lede mt-2 text-sm">
              Try another filter, or read all of them.
            </p>
            <button
              type="button"
              className="btn-outline btn-sm mt-6"
              onClick={() => setFilter("all")}
            >
              Show all reviews
            </button>
          </div>
        )}
      </Section>

      {/* ---------- Leave a review ---------- */}
      <Section className="bg-bone">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
          <div>
            <SectionHead
              eyebrow="Your Turn"
              title="Leave a review"
              lede="Feedback is how a family shop gets better. Tell us what went right — and tell us what did not, so we can fix it."
            />
            <div className="card p-6">
              <h3 className="h3 mb-3">Something go wrong?</h3>
              <p className="text-sm leading-relaxed text-smoke">
                Call the shop before you post. Most complaints we hear are
                things we can still put right — a re-torque, a rebalance, a
                billing question. We would rather earn the stars back.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href={BUSINESS.phoneHref} className="btn-primary btn-sm">
                  <Phone size={16} aria-hidden />
                  {BUSINESS.phone}
                </a>
                <Link to="/contact" className="btn-outline btn-sm">
                  Contact form
                </Link>
              </div>
            </div>
          </div>

          <LeaveReview />
        </div>
      </Section>
    </>
  );
}
