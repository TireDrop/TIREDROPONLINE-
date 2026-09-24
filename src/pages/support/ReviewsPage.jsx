// NOTE FOR THE BUILD TEAM: the reviews in REVIEWS below are illustrative
// placeholder content written to show the page layout and tone. They are not
// real customer submissions. Replace them with verified reviews (or wire this
// page to a live review feed) before the site goes to production.

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ExternalLink, Phone, Star, Truck } from "lucide-react";
import {
  BUSINESS,
  YELP_PROFILE,
  googleReviewHref,
} from "../../data/business.js";
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
    service: "Ship to Store & Install",
    body: "Ordered four Continentals and had them sent to the shop instead of my house. They called when the order landed, checked the sizes against what I bought, and fitted them the same week. Never had to wrestle tires into my trunk.",
  },
  {
    id: 2,
    name: "Devon P.",
    rating: 5,
    date: "August 19, 2026",
    service: "Shipped Order",
    body: "Bought a set for a Civic and shipped them to my place in Ohio. Boxed properly, right sizes, no scuffs on the sidewalls. My own shop mounted them and said they looked exactly like what I paid for.",
  },
  {
    id: 3,
    name: "Alina K.",
    rating: 5,
    date: "August 6, 2026",
    service: "Fitment Help",
    body: "I had no idea what the load index on my SUV was supposed to be. Called, read the door placard to them over the phone, and they told me which of the two options they would actually put on their own truck. Ordered that one.",
  },
  {
    id: 4,
    name: "Rob T.",
    rating: 4,
    date: "July 30, 2026",
    service: "Shipped Order",
    body: "Good price on a set for my F-150 and the order was right. The tracking updates were thinner than I would like, so I called for a status and got a straight answer. Would buy again, just wish the emails said more.",
  },
  {
    id: 5,
    name: "Grace N.",
    rating: 5,
    date: "July 22, 2026",
    service: "Mobile Installation",
    body: "Standing rotation appointment at my house in Davie. Same tech most times, which I like. He checks pressures, looks at the brakes while he is in there and tells me straight when something is getting close.",
  },
  {
    id: 6,
    name: "Hector M.",
    rating: 5,
    date: "July 9, 2026",
    service: "Commercial & Fleet",
    body: "We run six work vans out of a yard in Tamarac. Tires get ordered online, shipped to the shop, and they come to us to fit them. One invoice, no downtime. That alone is worth the call.",
  },
  {
    id: 7,
    name: "Priya S.",
    rating: 5,
    date: "June 27, 2026",
    service: "Returns & Support",
    body: "I ordered the wrong size — my fault entirely, I read the spare instead of the front. They walked me through the return, got the right set on the way, and nobody made me feel like an idiot about it.",
  },
  {
    id: 8,
    name: "Cameron W.",
    rating: 4,
    date: "June 15, 2026",
    service: "Ship to Store & Install",
    body: "Tires shipped to the Sunrise shop and I added an alignment while it was on the rack. Steering is centered again and they showed me the before and after printout. Only reason it is not five is the wait — it was busy that morning.",
  },
  {
    id: 9,
    name: "Yvonne A.",
    rating: 5,
    date: "June 3, 2026",
    service: "Mobile Installation",
    body: "Ordered tires through the site for my mother in Lauderhill and had the van do the install in her carport. She is 78 and did not have to sit in a waiting room. That is the whole reason I bought from them.",
  },
  {
    id: 10,
    name: "Jared L.",
    rating: 3,
    date: "May 24, 2026",
    service: "Shipped Order",
    body: "The tires themselves were spot on. One of the four was on a separate delivery and nobody warned me, so I sat there thinking my order was short. They sorted it out on the phone in five minutes, but a heads up would have saved the worry.",
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
    service: "Wheel & Tire Package",
    body: "Bought a staggered wheel and tire package for a build in Texas. They double-checked offset and clearance with me before the order went through and caught that my first pick would have rubbed. Saved me a very expensive mistake.",
  },
  {
    id: 13,
    name: "Leah F.",
    rating: 2,
    date: "April 14, 2026",
    service: "Shipped Order",
    body: "The size I wanted turned out to be unavailable after I ordered, and the alternative cost more than I planned to spend. To be fair they called instead of swapping it quietly, and refunded me without any argument — but I still ended up buying elsewhere that week.",
  },
  {
    id: 14,
    name: "Omar H.",
    rating: 5,
    date: "April 2, 2026",
    service: "Shop Service",
    body: "Brought it into the Sunrise shop for brakes after buying tires from them online. They called before doing anything extra, sent me a price for the rotors and let me decide. No surprises on the final bill, which is rarer than it should be.",
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
          <p className="font-display text-[1.0625rem] text-ink">
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
          We read every one of these. If something about your order or your
          install still needs fixing, call us at{" "}
          <a href={BUSINESS.phoneHref} className="text-drop underline">
            {BUSINESS.phone}
          </a>{" "}
          and ask for customer care — we would rather solve it than read about
          it later.
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
        Bought tires from us, or had them fitted? Tell us how it went.
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
        placeholder="What did you order, was it shipped or fitted, and how did it go?"
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

  const { total, distribution } = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    REVIEWS.forEach((r) => {
      counts[r.rating] += 1;
    });
    return {
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
        description={`What customers say about ${BUSINESS.name} — tires shipped across the country, ship-to-store orders fitted in ${BUSINESS.shop.city}, FL, and mobile installs around Broward County.`}
      />

      <PageHero
        eyebrow="Reviews"
        title="Shipped, fitted, and everything after"
        lede="Orders that went out to driveways in other states, sets fitted at the shop, van calls around Broward. The good ones, and the ones where we had to put something right."
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
          <div className="card flex flex-col p-6 md:p-8">
            <h2 className="h3">Read the real ones</h2>
            <p className="mt-3 text-sm leading-relaxed text-smoke">
              {BUSINESS.name} is new, so its own reviews are still being
              collected. The shop behind it is not: {BUSINESS.parent} has been
              fitting tires in {BUSINESS.shop.city} since {BUSINESS.foundedYear}
              , and its customers have been writing about it for years. Both
              profiles below are the shop's.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <a
                href={GOOGLE_REVIEWS_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-dark btn-sm min-h-[44px] w-full"
              >
                {BUSINESS.parent} on Google
                <ExternalLink size={14} aria-hidden />
              </a>
              <a
                href={YELP_PROFILE.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline btn-sm min-h-[44px] w-full"
              >
                {BUSINESS.parent} on Yelp
                <ExternalLink size={14} aria-hidden />
              </a>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-smoke">
              We do not reprint star counts here. They move, and a number typed
              into a page is out of date the week after. Open either profile and
              read what is actually there.
            </p>
          </div>

          <div className="card p-6 md:p-8">
            <h2 className="h3 mb-1">What people mention</h2>
            <p className="mb-5 text-sm leading-relaxed text-smoke">
              How the sample notes below break down. These are written to show
              the page, not collected from customers — the real reviews are on
              the profiles to the left.
            </p>

            <ul className="space-y-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star];
                const pct = total ? Math.round((count / total) * 100) : 0;
                return (
                  <li key={star} className="flex items-center gap-3">
                    <span className="w-14 shrink-0 font-display text-sm font-bold text-ink">
                      {star} star
                    </span>
                    <span
                      className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/10"
                      role="img"
                      aria-label={`${star} star: ${count} of ${total} reviews, ${pct} percent`}
                    >
                      <span
                        className="block h-full rounded-full bg-amber"
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
              <Truck
                size={15}
                aria-hidden
                className="mt-px shrink-0 text-drop"
              />
              These span both halves of the business: orders shipped out to
              customers across {BUSINESS.shipping.area}, and tires fitted here
              in {BUSINESS.shop.city} or at an address around Broward.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------- Filter + list ---------- */}
      <Section className="bg-fog">
        <SectionHead
          eyebrow="Samples"
          title="What this page will look like"
          lede="We are not hiding the three-star ones. If we dropped the ball, you should be able to read about it."
        />

        <p className="mb-8 flex items-start gap-2 rounded-sm bg-sky px-4 py-3 text-sm leading-relaxed text-ink">
          <CheckCircle2
            size={16}
            aria-hidden
            className="mt-0.5 shrink-0 text-drop"
          />
          <span>
            The notes below are written examples, not customer submissions —
            they are here to show the layout while {BUSINESS.name}'s own reviews
            are collected. The real ones are on{" "}
            <a
              href={GOOGLE_REVIEWS_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-drop underline underline-offset-2"
            >
              Google
            </a>{" "}
            and{" "}
            <a
              href={YELP_PROFILE.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-drop underline underline-offset-2"
            >
              Yelp
            </a>
            .
          </span>
        </p>

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
                className={`min-h-[40px] rounded-sm border px-4 py-2 font-display text-sm font-bold transition-colors ${
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
              lede="Feedback is how a family shop gets better, online or in the bay. Tell us what went right — and what did not, so we can fix it."
            />
            <div className="card p-6">
              <h3 className="h3 mb-3">Something go wrong?</h3>
              <p className="text-sm leading-relaxed text-smoke">
                Call us before you post. Most complaints we hear are things we
                can still put right — a wrong size, a damaged box, a re-torque,
                a billing question. We would rather earn the stars back.
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
