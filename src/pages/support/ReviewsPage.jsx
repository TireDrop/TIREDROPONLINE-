// Reviews page. TireDrop publishes no reviews, ratings or star counts of its
// own: none have been collected yet, and a number typed into a page cannot be
// verified by the reader. The page points at the shop's real Google and Yelp
// profiles instead, both to read reviews and to leave one. For the same
// reason no Review or AggregateRating markup is emitted anywhere on the site.

import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Phone, Star, Truck } from "lucide-react";
import {
  BUSINESS,
  YELP_PROFILE,
  googleReviewHref,
} from "../../data/business.js";
import {
  Breadcrumbs,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";

// Resolves to the profile's direct review link once GOOGLE_PROFILE is filled
// in (src/data/business.js); falls back to a Maps search until then.
const GOOGLE_REVIEWS_HREF = googleReviewHref();

/** An external profile link, announced as opening in a new tab. */
function ProfileLink({ href, className, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
      <ExternalLink size={14} aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

export default function ReviewsPage() {
  return (
    <>
      <Seo
        title="Customer Reviews"
        description={`Read and leave reviews of ${BUSINESS.parent}, the ${BUSINESS.shop.city}, FL shop behind ${BUSINESS.name}, on Google and Yelp.`}
      />

      <PageHero
        eyebrow="Reviews"
        title="Shipped, fitted, and everything after"
        lede="Reviews of the shop live on Google and Yelp, where we cannot edit them — the good ones, and the ones where we had to put something right. Read them there, or leave your own."
      >
        <a href={BUSINESS.phoneHref} className="btn-ghost-light">
          <Phone size={18} aria-hidden />
          {BUSINESS.phone}
        </a>
      </PageHero>

      <Breadcrumbs trail={[{ label: "Reviews" }]} />

      {/* ---------- Read the real ones ---------- */}
      <Section className="bg-bone">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-10">
          <div className="card flex flex-col p-6 md:p-8">
            <h2 className="h3">Read our reviews on Google and Yelp</h2>
            <p className="mt-3 text-sm leading-relaxed text-smoke">
              {BUSINESS.name} is new, so its own reviews are still being
              collected. The shop behind it is not: {BUSINESS.parent} fits
              tires in {BUSINESS.shop.city}, and its customers have been
              writing about it. Both profiles below are the shop&apos;s.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <ProfileLink
                href={GOOGLE_REVIEWS_HREF}
                className="btn-dark btn-sm min-h-[44px] w-full"
              >
                {BUSINESS.parent} on Google
              </ProfileLink>
              <ProfileLink
                href={YELP_PROFILE.url}
                className="btn-outline btn-sm min-h-[44px] w-full"
              >
                {BUSINESS.parent} on Yelp
              </ProfileLink>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-smoke">
              We do not reprint star counts here. They move, and a number typed
              into a page is out of date the week after. Open either profile and
              read what is actually there.
            </p>
          </div>

          <div className="card p-6 md:p-8">
            <h2 className="h3">We are not hiding the three-star ones</h2>
            <p className="mt-3 text-sm leading-relaxed text-smoke">
              If we dropped the ball, you should be able to read about it.
              That is why this page sends you to the profiles themselves rather
              than to a handful of quotes we picked.
            </p>
            <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-smoke">
              <Truck
                size={15}
                aria-hidden
                className="mt-px shrink-0 text-drop"
              />
              Reviews span both halves of the business: orders shipped out to
              customers across {BUSINESS.shipping.area}, and tires fitted here
              in {BUSINESS.shop.city} or at an address around Broward.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------- Leave a review ---------- */}
      <Section className="bg-fog">
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

          <div className="card p-6 md:p-8">
            <Star size={32} aria-hidden className="mb-4 text-amber" />
            <h3 className="h3">Leave a review on Google or Yelp</h3>
            <p className="mt-3 text-sm leading-relaxed text-smoke">
              Bought tires from us, or had them fitted? Tell us how it went.
              Google and Yelp are where a review counts for the shop, and where
              the next person shopping for tires will actually read it — it is
              a minute&apos;s work.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <ProfileLink
                href={GOOGLE_REVIEWS_HREF}
                className="btn-dark btn-sm min-h-[44px]"
              >
                Post it on Google
              </ProfileLink>
              <ProfileLink
                href={YELP_PROFILE.url}
                className="btn-outline btn-sm min-h-[44px]"
              >
                Post it on Yelp
              </ProfileLink>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-smoke">
              If something about your order or your install still needs fixing,
              call{" "}
              <a href={BUSINESS.phoneHref} className="text-drop underline">
                {BUSINESS.phone}
              </a>{" "}
              and ask for customer care — we would rather put it right than have
              you write about it.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
