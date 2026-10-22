import React from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  ExternalLink,
  MapPin,
  Phone,
  SearchX,
  Tag,
  Truck,
  Warehouse,
} from "lucide-react";

import {
  Accordion,
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
        description={`That service page does not exist. Browse every tire, wheel, maintenance and repair service ${BUSINESS.parent} offers in ${BUSINESS.shop.city}, FL.`}
        noindex
      />
      <Breadcrumbs
        trail={[
          { label: "Auto Service", to: "/auto-service" },
          { label: "Not found" },
        ]}
      />
      <Section className="bg-fog">
        <EmptyState
          icon={SearchX}
          as="h1"
          title="We could not find that service"
          lede="The link may be out of date. Every local service — van and bay alike — is listed on the auto service page."
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
    (s) => s.category === service.category && s.slug !== service.slug,
  );

  return (
    <>
      <Seo
        title={
          service.seoTitle ??
          (service.mobile
            ? `${service.name} in South Florida`
            : `${service.name} in ${BUSINESS.shop.city}, FL`)
        }
        description={
          service.seoDescription
            ? service.seoDescription.replace(
                "{from}",
                `$${service.priceFrom} ${service.priceUnit}`,
              )
            : `${service.blurb} From $${service.priceFrom} ${service.priceUnit}. ${
          service.mobile
            ? `Performed at your home, office or jobsite across South Florida by ${BUSINESS.parent}.`
            : `Performed at the ${BUSINESS.parent} shop in ${BUSINESS.shop.city}, FL.`
        }`
        }
      />

      <Breadcrumbs
        trail={[
          { label: "Auto Service", to: "/auto-service" },
          { label: service.name },
        ]}
      />

      <PageHero
        eyebrow={service.category}
        title={service.heading ?? service.name}
        lede={service.blurb}
      >
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
          <Link
            to={`/schedule?service=${service.slug}`}
            className="btn-primary"
          >
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
                <span className="font-display font-bold text-ink">
                  Local service — we come to you.
                </span>{" "}
                The van performs this at your home, office or jobsite anywhere
                in the South Florida install area, or you bring the vehicle to{" "}
                {BUSINESS.shop.city}. Your call.
              </p>
            </>
          ) : (
            <>
              <Warehouse size={18} aria-hidden className="text-drop" />
              <p className="text-smoke">
                <span className="font-display font-bold text-ink">
                  In-shop only.
                </span>{" "}
                This one needs a lift and bay equipment, so it happens at{" "}
                {BUSINESS.shop.full} — South Florida customers only.
              </p>
            </>
          )}
        </div>
      </div>

      {/* ---------- What it is ---------- */}
      {service.intro?.length > 0 && (
        <Section className="bg-bone">
          <div className="max-w-3xl">
            <p className="eyebrow mb-2">What it is</p>
            <h2 className="h2">About {service.name}</h2>
            <div className="mt-5 space-y-4">
              {service.intro.map((para) => (
                <p key={para} className="text-base leading-relaxed text-smoke">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* ---------- Included + symptoms ---------- */}
      <Section className="bg-fog">
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="card p-6 md:p-8">
            <p className="eyebrow mb-2">What's included</p>
            <h2 className="h3">Everything in this service</h2>
            <ul className="mt-5 space-y-3">
              {service.includes.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check
                    size={18}
                    aria-hidden
                    className="mt-0.5 shrink-0 text-drop"
                  />
                  <span className="text-sm leading-relaxed text-ink">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-card bg-ink-wash p-6 text-bone shadow-lift md:p-8">
            <p className="eyebrow-dark mb-2">Signs you need this</p>
            <h2 className="h3">When to call us</h2>
            <ul className="mt-5 space-y-3">
              {service.symptoms.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <AlertTriangle
                    size={18}
                    aria-hidden
                    className="mt-0.5 shrink-0 text-amber"
                  />
                  <span className="text-sm leading-relaxed text-bone/90">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            {service.closing && (
              <p className="mt-6 border-t border-bone/15 pt-4 text-sm leading-relaxed text-bone/70">
                {service.closing}
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* ---------- When you need it + what we do ---------- */}
      {(service.when?.length > 0 || service.steps?.length > 0) && (
        <Section className="bg-bone">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            {service.when?.length > 0 && (
              <div>
                <p className="eyebrow mb-2">When you need it</p>
                <h2 className="h3">Signs, mileage and age</h2>
                <div className="mt-5 space-y-4">
                  {service.when.map((para) => (
                    <p
                      key={para}
                      className="text-sm leading-relaxed text-smoke"
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {service.steps?.length > 0 && (
              <div>
                <p className="eyebrow mb-2">Step by step</p>
                <h2 className="h3">
                  {service.mobile
                    ? "What happens at your appointment"
                    : `What happens in the ${BUSINESS.shop.city} bay`}
                </h2>
                <ol className="mt-5 space-y-3">
                  {service.steps.map((step, i) => (
                    <li key={step} className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="tnum mt-0.5 w-6 shrink-0 text-right font-display font-bold text-drop"
                      >
                        {i + 1}.
                      </span>
                      <span className="text-sm leading-relaxed text-ink">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ---------- Pricing honesty ---------- */}
      <Section className="bg-fog">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-2xl">
            <p className="eyebrow mb-2">Straight pricing</p>
            {service.costHeading && <h2 className="h2">{service.costHeading}</h2>}
            {service.costHeading ? (
              <p className="mt-3 font-display text-3xl font-bold text-ink">
                From ${service.priceFrom}{" "}
                <span className="text-xl text-smoke md:text-2xl">
                  {service.priceUnit}
                </span>
              </p>
            ) : (
              <h2 className="h2">
                From ${service.priceFrom}{" "}
                <span className="text-2xl text-smoke md:text-3xl">
                  {service.priceUnit}
                </span>
              </h2>
            )}
            {service.costHeading && service.includes?.length > 0 && (
              <p className="mt-3 text-sm leading-relaxed text-smoke">
                The starting price covers:{" "}
                {service.includes
                  .map((item) =>
                    /^[A-Z][a-z]/.test(item)
                      ? item.charAt(0).toLowerCase() + item.slice(1)
                      : item,
                  )
                  .join("; ")}
                .
              </p>
            )}
            <p className="lede mt-4">
              That is a real starting price, not a teaser. What you actually pay
              depends on your vehicle and what the job needs. We confirm the
              total with you before any tool comes out, and the price we quote
              is the price you pay.
            </p>
            {service.priceFactors?.length > 0 && (
              <>
                <h3 className="h3 mt-6">What changes the price</h3>
                <ul className="mt-3 space-y-2.5">
                  {service.priceFactors.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check
                        size={18}
                        aria-hidden
                        className="mt-0.5 shrink-0 text-drop"
                      />
                      <span className="text-sm leading-relaxed text-ink">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-4 text-sm leading-relaxed text-smoke">
              Not sure what your vehicle needs? Call {BUSINESS.phone} with your
              year, make and model and we will price it over the phone.
              {service.fitsOnlineOrders &&
                ` Already bought tires or wheels on ${BUSINESS.name}? Say so when you book. This is the appointment that puts them on.`}
            </p>
          </div>

          <div className="card p-6 lg:w-72">
            <h3 className="h3">Ready to book?</h3>
            <p className="mt-2 text-sm leading-relaxed text-smoke">
              {service.mobile
                ? "Book online and the van comes to your address. We confirm an arrival window when we book."
                : `Pick a time that suits you and we confirm the appointment at the ${BUSINESS.shop.city} shop when we book.`}
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
                {BUSINESS.shop.full}
              </a>
            )}
          </div>
        </div>
      </Section>

      {/* ---------- FAQ ---------- */}
      {service.faq?.length > 0 && (
        <Section className="bg-bone">
          <SectionHead
            eyebrow="Questions, answered"
            title={`${service.name}: common questions`}
          />
          <Accordion items={service.faq} />
        </Section>
      )}

      {/* ---------- Guides + sources ---------- */}
      {(service.guides?.length > 0 || service.sources?.length > 0) && (
        <Section className="bg-fog">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            {service.guides?.length > 0 && (
              <div>
                <h2 className="h3">Related reading and tools</h2>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {service.guides.map((g) => (
                    <li key={g.to}>
                      <Link
                        to={g.to}
                        className="inline-flex items-center gap-1.5 font-semibold text-drop underline decoration-drop/30 underline-offset-2 hover:decoration-drop"
                      >
                        {g.label}
                        <ArrowRight size={14} aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {service.sources?.length > 0 && (
              <div>
                <h2 id="sources" className="h3">
                  Sources
                </h2>
                <ol className="mt-4 space-y-2.5 text-sm">
                  {service.sources.map((source, i) => (
                    <li key={source.url} className="flex gap-3">
                      <span className="tnum w-6 shrink-0 text-right font-display font-bold text-smoke">
                        {i + 1}.
                      </span>
                      <span className="min-w-0">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener nofollow"
                          className="inline-flex items-baseline gap-1 break-words font-semibold text-drop underline decoration-drop/30 underline-offset-2 hover:decoration-drop"
                        >
                          {source.title}
                          <ExternalLink
                            size={12}
                            aria-hidden
                            className="shrink-0 self-center"
                          />
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                        {source.publisher && (
                          <span className="text-smoke">
                            {" "}
                            ({source.publisher})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ---------- Related ---------- */}
      {related.length > 0 && (
        <Section className="bg-bone">
          <SectionHead
            eyebrow="Related"
            title="More services like this"
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
                  <span className="font-display text-lg text-ink">
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
