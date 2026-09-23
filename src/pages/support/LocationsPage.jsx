import React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  Truck,
  Wrench,
} from "lucide-react";
import { BUSINESS } from "../../data/business.js";
import { MOBILE_SERVICES, SHOP_SERVICES } from "../../data/services.js";
import {
  Badge,
  Breadcrumbs,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";

/** Stylized map panel — deliberately not a third-party embed. */
function MapPanel() {
  return (
    <div className="card overflow-hidden">
      <div
        aria-hidden
        className="relative h-56 bg-ink sm:h-64"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #1A1D21 0%, #0E0F11 100%), repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 1px, transparent 1px 44px), repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 1px, transparent 1px 44px)",
          backgroundBlendMode: "normal, overlay, overlay",
        }}
      >
        {/* Suggested road lines + a pin marking the shop. */}
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-amber/40" />
        <div className="absolute inset-y-0 left-1/3 w-[3px] bg-bone/15" />
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <MapPin size={34} className="fill-drop text-drop" />
          <span className="mt-1 font-display text-xs uppercase tracking-[0.18em] text-bone/70">
            {BUSINESS.address.city}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg uppercase">
            {BUSINESS.name} — {BUSINESS.address.city}
          </p>
          <p className="mt-1 text-sm text-smoke">{BUSINESS.address.full}</p>
        </div>
        <a
          href={BUSINESS.mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-dark btn-sm shrink-0"
        >
          <Navigation size={16} aria-hidden />
          Get Directions
          <ExternalLink size={14} aria-hidden />
        </a>
      </div>
    </div>
  );
}

export default function LocationsPage() {
  const shopWork = SHOP_SERVICES.map((s) => s.name);
  const vanWork = MOBILE_SERVICES.map((s) => s.name);

  return (
    <>
      <Seo
        title="Locations & Service Area"
        description={`Visit ${BUSINESS.name} at ${BUSINESS.address.full}, or have the mobile van come to you anywhere in Broward County. Hours, directions and service area.`}
      />

      <PageHero
        eyebrow="Locations"
        title="One shop. A whole county of driveways."
        lede={`Our bay sits at ${BUSINESS.address.street} in ${BUSINESS.address.city}. Everything the van can carry, we bring to you instead.`}
      >
        <div className="flex flex-wrap gap-3">
          <a
            href={BUSINESS.mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            <Navigation size={18} aria-hidden />
            Get Directions
          </a>
          <a href={BUSINESS.phoneHref} className="btn-ghost-light">
            <Phone size={18} aria-hidden />
            {BUSINESS.phone}
          </a>
        </div>
      </PageHero>

      <Breadcrumbs trail={[{ label: "Locations" }]} />

      {/* ---------- The shop ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="Our Shop"
          title={`${BUSINESS.address.city}, Florida`}
          lede="Pull in for alignments, brakes, suspension and anything that needs a lift. Tires and wheels can be handled here too if you would rather drop the car off."
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          {/* Address + hours */}
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="h3 mb-4">Address & Contact</h3>

              <address className="not-italic">
                <div className="flex gap-3">
                  <MapPin size={20} aria-hidden className="mt-0.5 shrink-0 text-drop" />
                  <div>
                    <p className="text-base text-ink">{BUSINESS.address.street}</p>
                    <p className="text-base text-ink">
                      {BUSINESS.address.city}, {BUSINESS.address.state}{" "}
                      {BUSINESS.address.zip}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <Phone size={20} aria-hidden className="mt-0.5 shrink-0 text-drop" />
                  <a
                    href={BUSINESS.phoneHref}
                    className="font-display text-xl uppercase tracking-wide text-ink hover:text-drop"
                  >
                    {BUSINESS.phone}
                  </a>
                </div>
              </address>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={BUSINESS.mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary btn-sm"
                >
                  <Navigation size={16} aria-hidden />
                  Get Directions
                </a>
                <Link to="/schedule" className="btn-outline btn-sm">
                  Book an Appointment
                </Link>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="h3 mb-4 flex items-center gap-2">
                <Clock size={20} aria-hidden className="text-drop" />
                Hours
              </h3>

              <table className="w-full text-sm">
                <caption className="sr-only">
                  Shop and mobile dispatch hours
                </caption>
                <tbody className="divide-y divide-ink/10">
                  {BUSINESS.hours.map((h) => (
                    <tr key={h.days}>
                      <th
                        scope="row"
                        className="py-2.5 text-left font-display text-base font-normal uppercase tracking-wide text-ink"
                      >
                        {h.days}
                      </th>
                      <td
                        className={`py-2.5 text-right ${
                          h.time === "Closed" ? "text-smoke" : "text-ink"
                        }`}
                      >
                        {h.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="mt-4 text-xs leading-relaxed text-smoke">
                Mobile vans dispatch during the same hours. The last mobile
                appointment of the day is booked with enough daylight to finish
                the job properly — call if you need the latest window available.
              </p>
            </div>
          </div>

          <MapPanel />
        </div>
      </Section>

      {/* ---------- Shop vs van ---------- */}
      <Section className="bg-fog">
        <SectionHead
          eyebrow="Shop vs. Van"
          title="What we do here, what the van does there"
          lede="Short version: if it needs a lift, an alignment rack or a long diagnostic, bring it to Sunrise. If it is tires and wheels, stay where you are."
        />

        <div className="grid gap-5 md:grid-cols-2">
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Truck size={24} aria-hidden className="text-drop" />
              <h3 className="h3">The van comes to you</h3>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-smoke">
              Fully equipped: tire machine, spin balancer, calibrated torque
              wrenches and stock on board. We need a flat, safe spot beside the
              vehicle — a driveway, a parking space or a level patch of jobsite.
            </p>
            <ul className="space-y-2 text-sm text-ink">
              {vanWork.map((name) => (
                <li key={name} className="flex items-start gap-2">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 bg-drop" />
                  {name}
                </li>
              ))}
            </ul>
            <Link to="/mobile-service" className="btn-outline btn-sm mt-6">
              How mobile service works
            </Link>
          </div>

          <div className="card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Building2 size={24} aria-hidden className="text-drop" />
              <h3 className="h3">You come to the shop</h3>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-smoke">
              Some work simply needs the building — a lift, an alignment rack and
              tools that do not travel. That is what the {BUSINESS.address.city}{" "}
              bay is for.
            </p>
            <ul className="space-y-2 text-sm text-ink">
              {shopWork.map((name) => (
                <li key={name} className="flex items-start gap-2">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 bg-drop" />
                  {name}
                </li>
              ))}
            </ul>
            <Link to="/auto-service" className="btn-outline btn-sm mt-6">
              <Wrench size={16} aria-hidden />
              See all shop services
            </Link>
          </div>
        </div>
      </Section>

      {/* ---------- Service area ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="Service Area"
          title="Where the vans run"
          lede="We keep the map tight on purpose. Staying inside Broward County is how we hold short windows and actually arrive when we said we would."
          action={
            <Link to="/schedule" className="btn-primary">
              Check My Address
            </Link>
          }
        />

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {BUSINESS.serviceArea.map((city) => (
            <li
              key={city}
              className="card flex items-center gap-2 px-4 py-3 text-sm text-ink"
            >
              <MapPin size={15} aria-hidden className="shrink-0 text-drop" />
              {city}
            </li>
          ))}
        </ul>

        <div className="card mt-8 flex flex-col gap-4 border-l-4 border-l-amber p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge tone="amber">Just outside the map?</Badge>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-smoke">
              If you are close to the Broward line — or you have a fleet parked
              somewhere we do not list — call us before you assume the answer is
              no. Depending on the day, the route and the job, we can often make
              it work.
            </p>
          </div>
          <a href={BUSINESS.phoneHref} className="btn-dark btn-sm shrink-0">
            <Phone size={16} aria-hidden />
            {BUSINESS.phone}
          </a>
        </div>
      </Section>
    </>
  );
}
