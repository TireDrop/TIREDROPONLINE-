import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  MapPin,
  Phone,
  Stethoscope,
  Truck,
  Warehouse,
} from "lucide-react";

import { Badge, PageHero, Section, SectionHead, Seo } from "../../components/ui/index.jsx";
import { BUSINESS } from "../../data/business.js";
import { SERVICES } from "../../data/services.js";

// Order the category blocks deliberately: tire work first, heavy bay work last.
const CATEGORY_ORDER = ["Tires", "Wheels", "Maintenance", "Repair", "Custom"];

const CATEGORY_COPY = {
  Tires: "Everything that happens between your wheel and the road. All of it mobile.",
  Wheels: "Fitment, mounting and balancing for new wheel packages.",
  Maintenance: "Routine work that keeps the miles cheap — done in your own parking spot.",
  Repair: "Bay work at the Sunrise shop, where the lifts and alignment rack live.",
  Custom: "Lift and leveling packages built around the tire and wheel setup you want.",
};

function groupByCategory(services) {
  const groups = new Map();
  services.forEach((service) => {
    if (!groups.has(service.category)) groups.set(service.category, []);
    groups.get(service.category).push(service);
  });
  return [...groups.entries()].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a[0]) - CATEGORY_ORDER.indexOf(b[0])
  );
}

function ServiceCard({ service }) {
  return (
    <Link
      to={`/services/${service.slug}`}
      className="card-hover group flex flex-col p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="h3 group-hover:text-drop">{service.name}</h3>
        {service.mobile ? (
          <Badge tone="drop">Mobile</Badge>
        ) : (
          <Badge tone="soft">In-Shop</Badge>
        )}
      </div>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-smoke">
        {service.blurb}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
        <span className="flex items-center gap-1.5 text-xs text-smoke">
          <Clock size={14} aria-hidden />
          {service.duration}
        </span>
        <span className="font-display text-lg uppercase text-ink">
          From ${service.priceFrom}
          <span className="ml-1 text-xs tracking-wide text-smoke">
            {service.priceUnit}
          </span>
        </span>
      </div>
    </Link>
  );
}

/** Symptom picker: choose what the car is doing, get the service that fixes it. */
function SymptomMatcher() {
  const symptoms = useMemo(
    () =>
      SERVICES.flatMap((service) =>
        service.symptoms.map((symptom) => ({ symptom, service }))
      ),
    []
  );
  const [activeIndex, setActiveIndex] = useState(null);
  const match = activeIndex === null ? null : symptoms[activeIndex];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
      <fieldset className="min-w-0">
        <legend className="label mb-3">Pick what your vehicle is doing</legend>
        <ul className="flex flex-wrap gap-2.5">
          {symptoms.map((entry, i) => {
            const selected = activeIndex === i;
            return (
              <li key={`${entry.service.slug}-${entry.symptom}`}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActiveIndex(selected ? null : i)}
                  className={`rounded-sm border px-3.5 py-2 text-left text-sm transition-colors ${
                    selected
                      ? "border-drop bg-drop text-bone"
                      : "border-ink/15 bg-bone text-ink hover:border-ink/40"
                  }`}
                >
                  {entry.symptom}
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div aria-live="polite" className="min-w-0">
        {match ? (
          <div className="card p-6">
            <p className="eyebrow mb-2">What you need</p>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="h3">{match.service.name}</h3>
              {match.service.mobile ? (
                <Badge tone="drop">Mobile</Badge>
              ) : (
                <Badge tone="soft">In-Shop</Badge>
              )}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-smoke">
              {match.service.blurb}
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-ink/10 pt-4 text-sm">
              <div>
                <dt className="label">Typical time</dt>
                <dd className="font-display text-base uppercase text-ink">
                  {match.service.duration}
                </dd>
              </div>
              <div>
                <dt className="label">Starting at</dt>
                <dd className="font-display text-base uppercase text-ink">
                  From ${match.service.priceFrom}{" "}
                  <span className="text-xs tracking-wide text-smoke">
                    {match.service.priceUnit}
                  </span>
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to={`/services/${match.service.slug}`}
                className="btn-outline btn-sm"
              >
                Service details
              </Link>
              <Link
                to={`/schedule?service=${match.service.slug}`}
                className="btn-primary btn-sm"
              >
                Book it
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          </div>
        ) : (
          <div className="card flex h-full flex-col justify-center p-6">
            <Stethoscope size={28} aria-hidden className="text-ink/20" />
            <h3 className="h3 mt-4">Describe the problem</h3>
            <p className="mt-2 text-sm leading-relaxed text-smoke">
              Choose the symptom that sounds closest to what you are dealing with
              and we will point you at the right service. Nothing matching? Call
              us at {BUSINESS.phone} and describe it — we have heard it before.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AutoServicePage() {
  const groups = useMemo(() => groupByCategory(SERVICES), []);
  const mobileCount = SERVICES.filter((s) => s.mobile).length;

  return (
    <>
      <Seo
        title="Auto Services in Sunrise, FL"
        description="Tires, wheels, brakes, alignment, suspension, oil changes, TPMS and diagnostics from Extreme Mobile Tires. See which services our van brings to you and which happen at the Sunrise shop."
      />

      <PageHero
        eyebrow="Auto Service"
        title="Every service we offer, in one place"
        lede={`Tire and maintenance work travels to you — ${mobileCount} of our services run straight out of the van. Brakes, alignment, suspension and lift kits need a lift and a rack, so those happen at the Sunrise shop.`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to="/schedule" className="btn-primary">
            Schedule Service
            <ArrowRight size={18} aria-hidden />
          </Link>
          <Link to="/mobile-service" className="btn-ghost-light">
            <Truck size={18} aria-hidden />
            How mobile service works
          </Link>
        </div>
      </PageHero>

      {/* ---------- Legend ---------- */}
      <div className="border-b border-ink/10 bg-bone">
        <div className="wrap flex flex-wrap items-center gap-x-6 gap-y-2 py-4 text-xs text-smoke">
          <span className="flex items-center gap-2">
            <Badge tone="drop">Mobile</Badge>
            We come to your home, office or jobsite
          </span>
          <span className="flex items-center gap-2">
            <Badge tone="soft">In-Shop</Badge>
            Performed at {BUSINESS.address.street}, {BUSINESS.address.city}
          </span>
        </div>
      </div>

      {/* ---------- Service groups ---------- */}
      {groups.map(([category, items], index) => (
        <Section
          key={category}
          className={index % 2 === 0 ? "bg-fog" : "bg-bone"}
        >
          <SectionHead
            eyebrow={`${items.length} ${items.length === 1 ? "service" : "services"}`}
            title={category}
            lede={CATEGORY_COPY[category]}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        </Section>
      ))}

      {/* ---------- Symptom matcher ---------- */}
      <Section className="bg-ink text-bone">
        <div className="mb-8 max-w-2xl md:mb-12">
          <p className="eyebrow mb-2">Not sure what you need?</p>
          <h2 className="h2">Tell us the symptom</h2>
          <p className="lede mt-3 text-bone/70">
            You do not have to know the name of the repair. Pick the thing your
            vehicle is actually doing and we will match it to the fix.
          </p>
        </div>

        <div className="rounded-sm bg-bone p-6 text-ink md:p-8">
          <SymptomMatcher />
        </div>
      </Section>

      {/* ---------- Shop info + CTA ---------- */}
      <Section className="bg-bone">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card p-6">
            <Warehouse size={22} aria-hidden className="text-drop" />
            <h3 className="h3 mt-4">The Sunrise shop</h3>
            <address className="mt-2 not-italic text-sm leading-relaxed text-smoke">
              {BUSINESS.address.street}
              <br />
              {BUSINESS.address.city}, {BUSINESS.address.state}{" "}
              {BUSINESS.address.zip}
            </address>
            <a
              href={BUSINESS.mapsHref}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex min-h-[36px] items-center gap-1.5 font-display text-sm uppercase tracking-wide text-drop hover:text-dive"
            >
              <MapPin size={15} aria-hidden />
              Get directions
            </a>
          </div>

          <div className="card p-6">
            <Clock size={22} aria-hidden className="text-drop" />
            <h3 className="h3 mt-4">Hours</h3>
            <dl className="mt-3 space-y-2 text-sm">
              {BUSINESS.hours.map((row) => (
                <div
                  key={row.days}
                  className="flex items-baseline justify-between gap-4 border-b border-ink/10 pb-2 last:border-0"
                >
                  <dt className="font-display uppercase tracking-wide text-ink">
                    {row.days}
                  </dt>
                  <dd className="text-smoke">{row.time}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="card flex flex-col p-6">
            <Phone size={22} aria-hidden className="text-drop" />
            <h3 className="h3 mt-4">Book it now</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-smoke">
              Pick your service, your vehicle and your window online in about two
              minutes — or call and talk it through with a dispatcher.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link to="/schedule" className="btn-primary btn-sm">
                Schedule Service
                <ArrowRight size={16} aria-hidden />
              </Link>
              <a href={BUSINESS.phoneHref} className="btn-outline btn-sm">
                <Phone size={16} aria-hidden />
                {BUSINESS.phone}
              </a>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
