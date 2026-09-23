import React from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  MapPin,
  Phone,
  SearchX,
  Tag,
  Truck,
  Warehouse,
} from "lucide-react";

import {
  Badge,
  Breadcrumbs,
  EmptyState,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";
import { BUSINESS } from "../../data/business.js";
import { SERVICES, getService } from "../../data/services.js";

function NotFoundPanel() {
  return (
    <>
      <Seo
        title="Service Not Found"
        description="That service page does not exist. Browse every tire, wheel, maintenance and repair service Extreme Mobile Tires offers in Sunrise, FL."
      />
      <Breadcrumbs trail={[{ label: "Auto Service", to: "/auto-service" }, { label: "Not found" }]} />
      <Section className="bg-fog">
        <EmptyState
          icon={SearchX}
          title="We could not find that service"
          lede="The link may be out of date. Everything we do — mobile and in-shop — is listed on the auto service page."
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/auto-service" className="btn-primary btn-sm">
                View all services
                <ArrowRight size={16} aria-hidden />
              </Link>
              <a href={BUSINESS.phoneHref} className="btn-outline btn-sm">
                <Phone size={16} aria-hidden />
                {BUSINESS.phone}
              </a>
            </div>
          }
        />
      </Section>
    </>
  );
}

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const service = getService(slug);

  if (!service) return <NotFoundPanel />;

  const related = SERVICES.filter(
    (s) => s.category === service.category && s.slug !== service.slug
  );

  return (
    <>
      <Seo
        title={`${service.name} in Sunrise & Broward County`}
        description={`${service.blurb} From $${service.priceFrom} ${service.priceUnit}. ${
          service.mobile
            ? "Performed at your home, office or jobsite by Extreme Mobile Tires."
            : "Performed at the Extreme Mobile Tires shop in Sunrise, FL."
        }`}
      />

      <Breadcrumbs
        trail={[
          { label: "Auto Service", to: "/auto-service" },
          { label: service.name },
        ]}
      />

      <PageHero eyebrow={service.category} title={service.name} lede={service.blurb}>
        <div className="flex flex-wrap items-center gap-2.5">
          {service.mobile ? (
            <Badge tone="drop">Mobile Service</Badge>
          ) : (
            <Badge tone="amber">In-Shop Service</Badge>
          )}
          <span className="flex items-center gap-1.5 rounded-sm border border-bone/20 px-3 py-1 text-xs text-bone/70">
            <Clock size={14} aria-hidden />
            {service.duration}
          </span>
          <span className="flex items-center gap-1.5 rounded-sm border border-bone/20 px-3 py-1 text-xs text-bone/70">
            <Tag size={14} aria-hidden />
            From ${service.priceFrom} {service.priceUnit}
          </span>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to={`/schedule?service=${service.slug}`} className="btn-primary">
            Book {service.name}
            <ArrowRight size={18} aria-hidden />
          </Link>
          <a href={BUSINESS.phoneHref} className="btn-ghost-light">
            <Phone size={18} aria-hidden />
            Call {BUSINESS.phone}
          </a>
        </div>
      </PageHero>

      {/* ---------- Where it happens ---------- */}
      <div className="border-b border-ink/10 bg-bone">
        <div className="wrap flex flex-wrap items-center gap-3 py-4 text-sm">
          {service.mobile ? (
            <>
              <Truck size={18} aria-hidden className="text-drop" />
              <p className="text-smoke">
                <span className="font-display uppercase tracking-wide text-ink">
                  We come to you.
                </span>{" "}
                This service is performed at your home, office or jobsite anywhere
                in our Broward service area — or at the shop, your call.
              </p>
            </>
          ) : (
            <>
              <Warehouse size={18} aria-hidden className="text-drop" />
              <p className="text-smoke">
                <span className="font-display uppercase tracking-wide text-ink">
                  In-shop only.
                </span>{" "}
                This one needs a lift and shop equipment, so it happens at{" "}
                {BUSINESS.address.full}.
              </p>
            </>
          )}
        </div>
      </div>

      {/* ---------- Included + symptoms ---------- */}
      <Section className="bg-fog">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6 md:p-8">
            <p className="eyebrow mb-2">What's included</p>
            <h2 className="h3">Everything in this service</h2>
            <ul className="mt-5 space-y-3">
              {service.includes.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check size={18} aria-hidden className="mt-0.5 shrink-0 text-drop" />
                  <span className="text-sm leading-relaxed text-ink">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6 md:p-8">
            <p className="eyebrow mb-2">Signs you need this</p>
            <h2 className="h3">When to call us</h2>
            <ul className="mt-5 space-y-3">
              {service.symptoms.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <AlertTriangle size={18} aria-hidden className="mt-0.5 shrink-0 text-amber" />
                  <span className="text-sm leading-relaxed text-ink">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-ink/10 pt-4 text-sm leading-relaxed text-smoke">
              Seeing something on this list? Do not wait it out. Catching it early
              is the difference between a {service.duration.toLowerCase()} visit and
              a tow.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------- Pricing honesty ---------- */}
      <Section className="bg-bone">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-2xl">
            <p className="eyebrow mb-2">Straight pricing</p>
            <h2 className="h2">
              From ${service.priceFrom}{" "}
              <span className="text-2xl text-smoke md:text-3xl">
                {service.priceUnit}
              </span>
            </h2>
            <p className="lede mt-4">
              That is a real starting price, not a teaser. What you actually pay
              depends on your vehicle, wheel size and the parts the job needs —
              run-flats, oversized fitments, seized hardware and premium parts all
              move the number. We confirm the total with you before any tool comes
              out, and the price we quote is the price you pay.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-smoke">
              Not sure what your vehicle needs? Call {BUSINESS.phone} with your
              year, make and model and we will price it over the phone.
            </p>
          </div>

          <div className="card p-6 lg:w-72">
            <h3 className="h3">Ready to book?</h3>
            <p className="mt-2 text-sm leading-relaxed text-smoke">
              {service.mobile
                ? "Pick a two-hour window and we will roll to your address."
                : "Pick a window and we will have a bay open when you arrive."}
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Link
                to={`/schedule?service=${service.slug}`}
                className="btn-primary btn-sm"
              >
                Schedule Now
                <ArrowRight size={16} aria-hidden />
              </Link>
              <a href={BUSINESS.phoneHref} className="btn-outline btn-sm">
                <Phone size={16} aria-hidden />
                {BUSINESS.phone}
              </a>
            </div>
            {!service.mobile && (
              <a
                href={BUSINESS.mapsHref}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-smoke hover:text-drop"
              >
                <MapPin size={14} aria-hidden />
                {BUSINESS.address.full}
              </a>
            )}
          </div>
        </div>
      </Section>

      {/* ---------- Related ---------- */}
      {related.length > 0 && (
        <Section className="bg-fog">
          <SectionHead
            eyebrow="Related"
            title={`More ${service.category.toLowerCase()} services`}
            lede="Customers who book this one usually ask about these next."
            action={
              <Link to="/auto-service" className="btn-outline btn-sm">
                All services
                <ArrowRight size={16} aria-hidden />
              </Link>
            }
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.slug}
                to={`/services/${item.slug}`}
                className="card-hover group flex flex-col p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="h3 group-hover:text-drop">{item.name}</h3>
                  {item.mobile ? (
                    <Badge tone="drop">Mobile</Badge>
                  ) : (
                    <Badge tone="soft">In-Shop</Badge>
                  )}
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-smoke">
                  {item.blurb}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
                  <span className="flex items-center gap-1.5 text-xs text-smoke">
                    <Clock size={14} aria-hidden />
                    {item.duration}
                  </span>
                  <span className="font-display text-lg uppercase text-ink">
                    From ${item.priceFrom}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
