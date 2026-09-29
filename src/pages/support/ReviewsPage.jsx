// Reviews page. TireDrop has no reviews to show yet, so this page says so and
// shows none: no stars, no quotes, no counts. Reviews are collected from real
// customers after their order, and only those will ever appear. For the same
// reason no Review or AggregateRating markup is emitted anywhere on the site.
//
// The Google review button only renders once GOOGLE_PROFILE.reviewUrl holds
// the shop's real review link (src/data/business.js). Until then there is no
// Google link at all, rather than a search that may land somewhere else.

import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink, MessageSquare, Phone, ShieldCheck } from "lucide-react";
import {
  BUSINESS,
  GOOGLE_PROFILE,
  YELP_PROFILE,
} from "../../data/business.js";
import {
  Breadcrumbs,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";

const GOOGLE_REVIEW_URL = GOOGLE_PROFILE.reviewUrl || null;

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
        title="Reviews"
        description={`${BUSINESS.name} collects reviews from real customers after their order. None are published yet. Here is how to leave one.`}
      />

      <PageHero
        eyebrow="Reviews"
        title="Reviews are coming"
        lede={`We collect them from real customers after their order. ${BUSINESS.name} is new, so there are none to show yet, and we will not fill this page with ones we wrote ourselves.`}
      >
        <a href={BUSINESS.phoneHref} className="btn-ghost-light">
          <Phone size={18} aria-hidden />
          {BUSINESS.phone}
        </a>
      </PageHero>

      <Breadcrumbs trail={[{ label: "Reviews" }]} />

      <Section className="bg-bone">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-10">
          <div className="card p-6 md:p-8">
            <ShieldCheck size={28} aria-hidden className="mb-4 text-drop" />
            <h2 className="h3">How reviews will get here</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-smoke">
              <li>
                <span className="text-ink">After your order.</span> Reviews
                come from people who actually bought from us, once their order
                is done.
              </li>
              <li>
                <span className="text-ink">Nothing made up.</span> No sample
                quotes, no star ratings or review counts we typed in ourselves.
              </li>
              <li>
                <span className="text-ink">Good and bad.</span> When there are
                reviews to show, they will not be picked to look good.
              </li>
            </ul>
          </div>

          <div className="card flex flex-col p-6 md:p-8">
            <MessageSquare size={28} aria-hidden className="mb-4 text-drop" />
            <h2 className="h3">Ordered from us? Leave a review</h2>
            <p className="mt-3 text-sm leading-relaxed text-smoke">
              Tell us how it went, what went right and what did not. The
              quickest way is to reply to us directly: call{" "}
              <a href={BUSINESS.phoneHref} className="text-drop underline">
                {BUSINESS.phone}
              </a>{" "}
              or use the contact form.
              {GOOGLE_REVIEW_URL || YELP_PROFILE.url
                ? ` You can also post a public review of ${BUSINESS.parent}, the ${BUSINESS.shop.city} shop behind ${BUSINESS.name}.`
                : ""}
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <Link to="/contact" className="btn-primary btn-sm min-h-[44px]">
                Contact form
              </Link>
              {GOOGLE_REVIEW_URL && (
                <ProfileLink
                  href={GOOGLE_REVIEW_URL}
                  className="btn-dark btn-sm min-h-[44px]"
                >
                  Review {BUSINESS.parent} on Google
                </ProfileLink>
              )}
              {YELP_PROFILE.url && (
                <ProfileLink
                  href={YELP_PROFILE.url}
                  className="btn-outline btn-sm min-h-[44px]"
                >
                  {BUSINESS.parent} on Yelp
                </ProfileLink>
              )}
            </div>
          </div>
        </div>
      </Section>

      <Section className="bg-fog">
        <div className="mx-auto max-w-2xl">
          <SectionHead
            eyebrow="Something go wrong?"
            title="Call us before you post"
            lede="A wrong size, a damaged box, a billing question: most of what goes wrong with an order can still be put right."
          />
          <div className="flex flex-wrap gap-3">
            <a href={BUSINESS.phoneHref} className="btn-primary btn-sm">
              <Phone size={16} aria-hidden />
              {BUSINESS.phone}
            </a>
            <Link to="/contact" className="btn-outline btn-sm">
              Contact form
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
