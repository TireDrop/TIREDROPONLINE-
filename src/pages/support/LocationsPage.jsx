import React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  Package,
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
            "linear-gradient(135deg, #122135 0%, #0A1628 100%), repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 1px, transparent 1px 44px), repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 1px, transparent 1px 44px)",
          backgroundBlendMode: "normal, overlay, overlay",
        }}
      >
        {/* Suggested road lines + a pin marking the shop. */}
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-amber/40" />
        <div className="absolute inset-y-0 left-1/3 w-[3px] bg-bone/15" />
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <MapPin size={34} className="fill-drop text-drop" />
          <span className="mt-1 font-display text-xs uppercase tracking-[0.18em] text-bone/70">
            {BUSINESS.shop.city}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg uppercase">{BUSINESS.shop.name}</p>
          <p className="mt-1 text-sm text-smoke">{BUSINESS.shop.full}</p>
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

const FITTING_OPTIONS = [
  {
    icon: Package,
    title: "Have them shipped to you",
    copy: `Order online and the tires go to your address anywhere in ${BUSINESS.shipping.area}. Take them to any installer you like — plenty of customers already have a shop they trust.`,
    to: "/shipping",
    cta: "How shipping works",
  },
  {
    icon: Building2,
    title: "Ship free to the shop",
    copy: `Send the order to ${BUSINESS.shop.city} instead at no shipping cost. We sign for it, check it against your order, and book you in to have it fitted.`,
    to: "/install",
    cta: "Ship to store & install",
  },
  {
    icon: Truck,
    title: "Let the van come to you",
    copy: "In Broward County the van can fit them in your driveway, your office lot or a jobsite. Same equipment, no waiting room.",
    to: "/mobile-service",
    cta: "Mobile installation",
  },
];

export default function LocationsPage() {
  const shopWork = SHOP_SERVICES.map((s) => s.name);
  const vanWork = MOBILE_SERVICES.map((s) => s.name);

  return (
    <>
      <Seo
        title="The Shop & Install Area"
        description={`${BUSINESS.name} ships nationwide, and ${BUSINESS.parent} at ${BUSINESS.shop.full} fits what we sell. Hours, directions, ship-to-store pickup and the Broward towns the mobile vans cover.`}
      />

      <PageHero
        eyebrow="The Shop"
        title="Where your tires can be fitted"
        lede={`${BUSINESS.name} ships to ${BUSINESS.shipping.area}, so most customers never need an address from us. If you are near ${BUSINESS.shop.city}, this is the shop behind the website — ${BUSINESS.parent}, on ${BUSINESS.shop.street}.`}
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

      <Breadcrumbs trail={[{ label: "The Shop" }]} />

      {/* ---------- Three ways to get fitted ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="Getting Them On"
          title="Three ways this ends with tires on the car"
          lede="Only two of them involve driving to Sunrise, and one of those is us driving to you."
        />

        <ul className="grid gap-5 md:grid-cols-3">
          {FITTING_OPTIONS.map(({ icon: Icon, title, copy, to, cta }) => (
            <li key={title} className="card flex flex-col p-6">
              <Icon size={26} aria-hidden className="mb-4 text-drop" />
              <h3 className="h3">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-smoke">
                {copy}
              </p>
              <Link to={to} className="btn-outline btn-sm mt-5 self-start">
                {cta}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------- The shop ---------- */}
      <Section className="bg-fog">
        <SectionHead
          eyebrow="Our Shop"
          title={`${BUSINESS.shop.city}, Florida`}
          lede={`${BUSINESS.parent} has run out of this building for years — it owns the vans, employs the technicians and fits every ship-to-store order. Pull in for an install, a pickup, or the bay work a van cannot do.`}
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
                    <p className="text-base text-ink">{BUSINESS.shop.street}</p>
                    <p className="text-base text-ink">
                      {BUSINESS.shop.city}, {BUSINESS.shop.state}{" "}
                      {BUSINESS.shop.zip}
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

              <p className="mt-4 text-xs leading-relaxed text-smoke">
                One phone number covers both sides of the business — an order
                placed from out of state and an appointment in Sunrise reach the
                same people.
              </p>

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
                  Book an Install
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
                  Shop, pickup and mobile dispatch hours
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
                These are the hours for installs, pickups and dispatching the
                vans. Orders can be placed on the website at any hour — they are
                reviewed the next time the shop is open.
              </p>
            </div>
          </div>

          <MapPanel />
        </div>
      </Section>

      {/* ---------- What happens at the shop ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="At The Shop"
          title="What actually happens in Sunrise"
          lede="Three different visits end up at the same counter. Here is what each one looks like."
        />

        <div className="grid gap-5 md:grid-cols-3">
          <div className="card p-6">
            <Package size={24} aria-hidden className="mb-4 text-drop" />
            <h3 className="h3">Ship-to-store pickup</h3>
            <p className="mt-2 text-sm leading-relaxed text-smoke">
              Your order ships here free. We check the size, load index and
              speed rating against what you bought before it goes anywhere near
              your car, then call you to book the fitting — or to hand the tires
              over if you would rather take them with you.
            </p>
            <Link to="/install" className="btn-outline btn-sm mt-5">
              How ship-to-store works
            </Link>
          </div>

          <div className="card p-6">
            <Wrench size={24} aria-hidden className="mb-4 text-drop" />
            <h3 className="h3">Installation</h3>
            <p className="mt-2 text-sm leading-relaxed text-smoke">
              Mounting, balancing, new valve service, TPMS relearn where the
              vehicle needs it, and a torque wrench on every lug. Ask for an
              alignment at the same time if the set is new — it is the cheapest
              way to protect it.
            </p>
            <Link to="/schedule" className="btn-outline btn-sm mt-5">
              Book an install
            </Link>
          </div>

          <div className="card p-6">
            <Building2 size={24} aria-hidden className="mb-4 text-drop" />
            <h3 className="h3">Full shop service</h3>
            <p className="mt-2 text-sm leading-relaxed text-smoke">
              Some work needs the building — a lift, an alignment rack and tools
              that do not travel. That is what the bay is for, whether or not
              the tires came from us.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink">
              {shopWork.map((name) => (
                <li key={name} className="flex items-start gap-2">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 bg-drop" />
                  {name}
                </li>
              ))}
            </ul>
            <Link to="/auto-service" className="btn-outline btn-sm mt-5">
              <Wrench size={16} aria-hidden />
              All shop services
            </Link>
          </div>
        </div>
      </Section>

      {/* ---------- Mobile install area ---------- */}
      <Section className="bg-fog">
        <SectionHead
          eyebrow="Mobile Install Area"
          title="Where the vans run"
          lede="Mobile installation is Broward County only — a South Florida bonus on top of the national store. We keep the map tight on purpose, because that is how the van actually arrives when we said it would."
          action={
            <Link to="/schedule" className="btn-primary">
              Check My Address
            </Link>
          }
        />

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {BUSINESS.installArea.map((city) => (
            <li
              key={city}
              className="card flex items-center gap-2 px-4 py-3 text-sm text-ink"
            >
              <MapPin size={15} aria-hidden className="shrink-0 text-drop" />
              {city}
            </li>
          ))}
        </ul>

        <div className="card mt-8 p-6">
          <div className="mb-4 flex items-center gap-3">
            <Truck size={24} aria-hidden className="text-drop" />
            <h3 className="h3">What the van can do at your address</h3>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-smoke">
            Tire machine, spin balancer, calibrated torque wrenches and stock on
            board. We need a flat, safe spot beside the vehicle — a driveway, a
            parking space or a level patch of jobsite.
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

        <div className="card mt-6 flex flex-col gap-4 border-l-4 border-l-amber p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge tone="amber">Outside Broward?</Badge>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-smoke">
              Then the van is not coming — but the tires still are. Order them
              shipped to your address and have your own installer fit them, or
              call us and we will talk through what to ask for when you get
              there.
            </p>
          </div>
          <a href={BUSINESS.phoneHref} className="btn-dark btn-sm shrink-0">
            <Phone size={16} aria-hidden />
            {BUSINESS.phone}
          </a>
        </div>
      </Section>

      {/* ---------- CTA ---------- */}
      <section className="bg-ink py-12 text-bone md:py-16">
        <div className="wrap flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow mb-2">{BUSINESS.poweredBy}</p>
            <h2 className="h2">Buy the tires first. Decide the rest after.</h2>
            <p className="lede mt-3 max-w-xl text-bone/70">
              You can change your mind about shipping to your door or to the
              shop while your order is still being placed — just call us.
            </p>
          </div>
          <Link to="/tires" className="btn-primary shrink-0">
            Shop Tires
          </Link>
        </div>
      </section>
    </>
  );
}
