import React from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  MapPin,
  Phone,
  SearchX,
  ShoppingCart,
  Store,
  Truck,
} from "lucide-react";

import {
  Accordion,
  Breadcrumbs,
  EmptyState,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";
import ZipCheck from "../../components/ui/ZipCheck.jsx";
import RoadsideHelp from "../../components/ui/RoadsideHelp.jsx";
import { faqSchema } from "../../components/content/schema.js";
import { BUSINESS } from "../../data/business.js";
import {
  CITY_PAGE_SHARED as SHARED,
  cityPath,
  getCityPage,
} from "../../data/cityPages.js";
import { MOBILE_SERVICES } from "../../data/services.js";

const BOOK = "/schedule?service=tire-installation";

function NotFoundPanel() {
  return (
    <>
      <Seo
        title="City Page Not Found"
        description={`That page does not exist. See every city the ${BUSINESS.parent} vans cover for mobile tire installation.`}
        noindex
      />
      <Breadcrumbs
        trail={[
          { label: "Mobile Tire Service", to: "/mobile-service" },
          { label: "Not found" },
        ]}
      />
      <Section className="bg-fog">
        <EmptyState
          icon={SearchX}
          as="h1"
          title="We could not find that city page"
          lede="The link may be out of date. The mobile service page lists every city page and checks any ZIP code."
          action={
            <Link to="/mobile-service" className="btn-primary btn-sm">
              Mobile tire service
              <ArrowRight size={16} aria-hidden />
            </Link>
          }
        />
      </Section>
    </>
  );
}

function FactList({ title, items }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="label mb-2">{title}</h3>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-sm border border-ink/10 bg-fog px-2.5 py-1 font-display text-[13px] font-semibold text-ink"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * /mobile-service/:city — mobile tire installation in one city. One template
 * for every city in src/data/cityPages.js; the copy that makes each page its
 * own (intro, ZIPs, roads, local notes, FAQ) is in the data, and the parts
 * every page shares (how it works, the services, the scope) are short on
 * purpose. Seo adds the shop, a Service node with the city as areaServed,
 * and Home > Mobile Tire Service > City (src/components/ui/index.jsx).
 */
export default function MobileCityPage() {
  const { city: slug } = useParams();
  const city = getCityPage(slug);
  if (!city) return <NotFoundPanel />;

  const nearby = city.nearby.map(getCityPage).filter(Boolean);
  const path = cityPath(city.slug);

  return (
    <>
      <Seo
        title={city.seoTitle}
        description={city.description}
        schema={[faqSchema(city.faq, path)]}
      />
      <Breadcrumbs
        trail={[
          { label: "Mobile Tire Service", to: "/mobile-service" },
          { label: city.name },
        ]}
      />

      <PageHero
        eyebrow={`Mobile tire service · ${city.county} County`}
        title={`Mobile Tire Installation in ${city.name}, FL`}
        lede={city.intro}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to={BOOK} className="btn-primary">
            Book Mobile Install
            <ArrowRight size={18} aria-hidden />
          </Link>
          <a href={BUSINESS.phoneHref} className="btn-ghost-light">
            <Phone size={18} aria-hidden />
            Call {BUSINESS.phone}
          </a>
        </div>
      </PageHero>

      {/* ---------- How it works (shared, short) ---------- */}
      <Section className="bg-bone">
        <SectionHead eyebrow="How it works" title="Bought on TireDrop, fitted where you park" />
        <ol className="grid gap-5 md:grid-cols-3">
          {SHARED.howItWorks.map((step, i) => (
            <li key={step.title} className="card p-6">
              <span
                aria-hidden
                className="font-display text-3xl leading-none text-ink/50"
              >
                0{i + 1}
              </span>
              <h3 className="h3 mt-3">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-smoke">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------- Where we work ---------- */}
      <Section className="bg-fog">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-14">
          <div>
            <SectionHead
              eyebrow="Service area"
              title={`Where we work in ${city.name}`}
            />
            <div className="-mt-2 space-y-4 text-[15px] leading-relaxed text-ink md:-mt-6">
              {city.whereWeWork.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
            <div className="mt-6 space-y-5">
              <FactList title="Neighbourhoods and areas" items={city.areas} />
              <FactList title="Main roads" items={city.roads} />
              <FactList title="Main ZIP codes" items={city.zips} />
            </div>
          </div>

          <div className="space-y-5 self-start">
            <ZipCheck label={SHARED.zipLabel} />
            <p className="flex items-start gap-2 text-sm leading-relaxed text-smoke">
              <Truck size={16} aria-hidden className="mt-0.5 shrink-0 text-drop" />
              <span>{city.route}</span>
            </p>
            <p className="flex items-start gap-2 text-sm leading-relaxed text-smoke">
              <Store size={16} aria-hidden className="mt-0.5 shrink-0 text-drop" />
              <span>
                {SHARED.shopLine}{" "}
                <Link to="/install" className="text-drop underline hover:text-dive">
                  Ship to store
                </Link>
              </span>
            </p>
          </div>
        </div>
      </Section>

      {/* ---------- Local notes ---------- */}
      <Section className="bg-bone">
        <SectionHead eyebrow="Local notes" title={city.conditionsTitle} />
        <div className="-mt-2 max-w-3xl space-y-4 text-[15px] leading-relaxed text-ink md:-mt-6">
          {city.conditions.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>
      </Section>

      {/* ---------- Roadside flat help (shared items, city lede) ---------- */}
      <Section className="bg-fog">
        <RoadsideHelp
          title={`Flat tire help in ${city.name}`}
          lede={city.roadside}
          showHighway={false}
        />
      </Section>

      {/* ---------- Services by van + scope ---------- */}
      <Section className="bg-bone">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <SectionHead
              eyebrow="By van"
              title={`What the van does in ${city.name}`}
              lede={SHARED.servicesLede}
            />
            <ul className="-mt-2 grid gap-2.5 sm:grid-cols-2 md:-mt-6">
              {MOBILE_SERVICES.map((s) => (
                <li key={s.slug}>
                  <Link
                    to={`/services/${s.slug}`}
                    className="card-hover flex min-h-[48px] items-center justify-between gap-3 px-4 py-3 font-display text-[15px] font-bold text-ink hover:text-drop"
                  >
                    {s.name}
                    <ArrowRight size={15} aria-hidden className="shrink-0 text-drop" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHead eyebrow="Honest scope" title="What to expect" />
            <ul className="-mt-2 space-y-3 md:-mt-6">
              {SHARED.scope.map((line) => (
                <li key={line} className="flex items-start gap-3 text-[15px] leading-relaxed text-ink">
                  <Check size={18} aria-hidden className="mt-0.5 shrink-0 text-drop" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section className="bg-fog">
        <SectionHead eyebrow="Questions" title={`Asked in ${city.name}`} />
        <Accordion items={city.faq} />
      </Section>

      {/* ---------- CTA ---------- */}
      <Section className="bg-steel-wash text-bone">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow-dark mb-2">{BUSINESS.tagline}</p>
            <h2 className="h2">Book a mobile install in {city.name}</h2>
            <p className="lede mt-3 text-bone/70">{SHARED.ctaBody}</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:w-auto">
            <Link to={BOOK} className="btn-primary">
              <CalendarCheck size={18} aria-hidden />
              Book Mobile Install
            </Link>
            <Link to="/tires" className="btn-ghost-light">
              <ShoppingCart size={18} aria-hidden />
              Shop Tires
            </Link>
            <a href={BUSINESS.phoneHref} className="btn-ghost-light">
              <Phone size={18} aria-hidden />
              {BUSINESS.phone}
            </a>
          </div>
        </div>
      </Section>

      {/* ---------- Nearby + hub ---------- */}
      <Section className="bg-bone">
        <h2 className="h3 mb-5">Nearby city pages</h2>
        <ul className="flex flex-wrap gap-2.5">
          {nearby.map((c) => (
            <li key={c.slug}>
              <Link to={cityPath(c.slug)} className="btn-outline btn-sm">
                <MapPin size={14} aria-hidden />
                Mobile tire installation in {c.name}
              </Link>
            </li>
          ))}
          <li>
            <Link to="/mobile-service" className="btn-outline btn-sm">
              All mobile service areas
              <ArrowRight size={14} aria-hidden />
            </Link>
          </li>
        </ul>
      </Section>
    </>
  );
}
