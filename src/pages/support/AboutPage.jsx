import React from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Store,
  Tag,
  Truck,
} from "lucide-react";
import { BUSINESS, TIRE_BRANDS } from "../../data/business.js";
import {
  Badge,
  Breadcrumbs,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";

const YEARS_IN_BUSINESS = new Date().getFullYear() - BUSINESS.foundedYear;

const TEAM = [
  {
    name: "Luis",
    role: "Founder & Owner",
    bio: `Opened the shop in ${BUSINESS.foundedYear} and still answers the phone on busy Saturdays. TireDrop was his idea: sell the same tires nationally that he would put on his own family's car.`,
  },
  {
    name: "Yani",
    role: "Orders & Customer Care",
    bio: "Handles the questions that come in from across the country — fitment, order status, returns, and the ones that start with \"I have no idea what size I need.\"",
  },
  {
    name: "Keisha",
    role: "Sourcing & Fitment",
    bio: "Works the distributor catalogs. Finds the size, the load index and the speed rating that actually match the vehicle, and flags it when a listing looks wrong.",
  },
  {
    name: "Marco",
    role: "Lead Install Technician",
    bio: "Runs the first van out of the yard most mornings. Mounts, balances and torques on driveways from Weston to Fort Lauderdale.",
  },
  {
    name: "Andre",
    role: "Shop Foreman, Sunrise",
    bio: "Owns the bay work the van cannot do — alignments, brakes, suspension, and every ship-to-store set that gets fitted at the shop.",
  },
];

const DIFFERENTIATORS = [
  {
    icon: Package,
    title: "Shipped straight to you",
    copy: `Order online and your tires ship to your address anywhere in ${BUSINESS.shipping.area}. They come direct from the distributor's warehouse, so you are not paying for a middle shelf they sat on.`,
  },
  {
    icon: Store,
    title: "Or ship free to the shop",
    copy: `If you are near ${BUSINESS.shop.city}, send the order to the shop instead at no shipping cost and book the install when it lands. Same tires, fitted by the people who sold them to you.`,
  },
  {
    icon: Truck,
    title: "Mobile install, South Florida",
    copy: "In Broward County the van can come to the driveway, the office lot or the jobsite instead. It is a local bonus, not the whole business — but it is a good one.",
  },
  {
    icon: ShieldCheck,
    title: "A real shop picked the catalog",
    copy: "Every brand we list is one we have fitted, balanced and seen come back after 30,000 Florida miles. If a tire has a reputation we do not like, it is not on the site.",
  },
  {
    icon: Tag,
    title: "The price is the price",
    copy: "What you see at checkout covers the tires and the shipping method you chose. If anything about your order changes, we call you before we do anything about it.",
  },
  {
    icon: Clock,
    title: `Family-run since ${BUSINESS.foundedYear}`,
    copy: `${BUSINESS.parent} has been the same family, the same phone number and the same building on ${BUSINESS.shop.street} for years. TireDrop is that shop with a wider counter.`,
  },
];

const STATS = [
  { value: `${YEARS_IN_BUSINESS}+`, label: "Years fitting tires in South Florida" },
  { value: "48", label: "Continental US states we ship to" },
  { value: `${TIRE_BRANDS.length}`, label: "Tire brands in the catalog" },
  { value: `${BUSINESS.installArea.length}`, label: "Broward towns the vans cover" },
];

function TimelineItem({ year, title, copy }) {
  return (
    <li className="relative border-l-2 border-ink/10 pl-6 pb-8 last:pb-0">
      <span
        aria-hidden
        className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-drop"
      />
      <p className="eyebrow mb-1">{year}</p>
      <h3 className="h3 mb-2">{title}</h3>
      <p className="text-sm leading-relaxed text-smoke">{copy}</p>
    </li>
  );
}

export default function AboutPage() {
  return (
    <>
      <Seo
        title="About TireDrop"
        description={`${BUSINESS.name} is the national online store of ${BUSINESS.parent}, a family tire shop in ${BUSINESS.shop.city}, FL since ${BUSINESS.foundedYear}. Tires and wheels shipped across the continental US, or fitted at the shop.`}
      />

      <PageHero
        eyebrow="About Us"
        title="A real tire shop, with a national counter"
        lede={`${BUSINESS.name} is the online store of ${BUSINESS.parent} — a family shop that has been fitting tires in South Florida since ${BUSINESS.foundedYear}. We ship anywhere in ${BUSINESS.shipping.area}. Near ${BUSINESS.shop.city}, we will also put them on for you.`}
      >
        <div className="flex flex-wrap gap-3">
          <Link to="/tires" className="btn-primary">
            Shop Tires
          </Link>
          <a href={BUSINESS.phoneHref} className="btn-ghost-light">
            <Phone size={18} aria-hidden />
            {BUSINESS.phone}
          </a>
        </div>
      </PageHero>

      <Breadcrumbs trail={[{ label: "About Us" }]} />

      {/* ---------- Our story ---------- */}
      <Section className="bg-bone">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <SectionHead
              eyebrow="Our Story"
              title="It started in a tire bay, not a warehouse"
              lede="Most online tire stores are a catalog with a checkout button attached. This one is attached to a shop that has been mounting tires for nearly two decades."
            />

            <div className="space-y-5 text-base leading-relaxed text-smoke">
              <p>
                {BUSINESS.parent} opened in {BUSINESS.foundedYear} as one truck,
                a compressor and a phone that rang at all hours. The idea was
                simple enough: most tire work does not need a waiting room, it
                needs the right machine and the right hands. So the work went to
                wherever the car already was.
              </p>
              <p>
                Word moved the way it does in South Florida. A neighbor told a
                neighbor, an office manager told the rest of the park, a
                contractor called us to a jobsite and then kept calling. One
                truck became a fleet of vans, and the shop on{" "}
                {BUSINESS.shop.street} in {BUSINESS.shop.city} came next for the
                jobs that genuinely belong on a lift.
              </p>
              <p>
                What did not change in {YEARS_IN_BUSINESS} years is the part
                people actually call us for: knowing which tire is worth the
                money. We hear how a set wore out. We see which sidewalls crack
                in the heat, which ones go quiet at highway speed, and which
                bargain brand comes back angry at 20,000 miles.
              </p>
              <p>
                {BUSINESS.name} is what happens when you point that at the whole
                country. You order online, the tires ship from the distributor
                straight to your door, and we never touch a warehouse — but the
                catalog was picked by a shop, not by a spreadsheet. If you live
                near {BUSINESS.shop.city}, ship them free to us instead and we
                will fit them.
              </p>
            </div>

            <p className="mt-7 flex flex-wrap items-center gap-2 text-sm text-smoke">
              <Badge tone="soft">The lockup</Badge>
              <span>
                You will see{" "}
                <span className="font-display uppercase tracking-[0.12em] text-extremeRed">
                  {BUSINESS.poweredBy}
                </span>{" "}
                on this site. That is the parent business — the shop, the vans
                and the people.
              </span>
            </p>
          </div>

          <div>
            <ol className="mt-2">
              <TimelineItem
                year={BUSINESS.foundedYear}
                title="One truck, one promise"
                copy={`${BUSINESS.parent} starts in ${BUSINESS.shop.city} with a single truck, mostly driveway calls and after-hours flats.`}
              />
              <TimelineItem
                year="The early years"
                title="Word of mouth does the marketing"
                copy="Office parks and small fleets start booking standing appointments because nobody has to leave their desk."
              />
              <TimelineItem
                year="Growth"
                title="A fleet of vans, and a real shop"
                copy={`More vans, each carrying a tire machine, a spin balancer and calibrated torque wrenches — plus a bay on ${BUSINESS.shop.street} for alignments, brakes and suspension.`}
              />
              <TimelineItem
                year="Today"
                title="The shop goes national"
                copy={`${BUSINESS.name} opens the same catalog to ${BUSINESS.shipping.area}, drop-shipped from the distributor. Local customers still get free ship-to-store and install.`}
              />
            </ol>
          </div>
        </div>
      </Section>

      {/* ---------- By the numbers ---------- */}
      <section className="bg-ink py-12 text-bone md:py-16">
        <div className="wrap">
          <h2 className="sr-only">{BUSINESS.name} by the numbers</h2>
          <dl className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="block font-display text-4xl leading-none text-amber md:text-5xl">
                    {s.value}
                  </span>
                  <span className="mt-2 block text-sm text-bone/65">
                    {s.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 text-xs text-bone/40">
            Figures are directional and illustrative — a plain sense of scale,
            not an audited count.
          </p>
        </div>
      </section>

      {/* ---------- Team ---------- */}
      <Section className="bg-fog">
        <SectionHead
          eyebrow="Our Team"
          title="The people behind the order"
          lede="Small crew, clear roles. Whether your tires land on a porch in Ohio or on a lift in Sunrise, one of these five had a hand in it."
        />

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((person) => (
            <li key={person.name} className="card-hover p-6">
              <div
                aria-hidden
                className="mb-5 flex h-14 w-14 items-center justify-center rounded-sm bg-ink font-display text-2xl text-amber"
              >
                {person.name.charAt(0)}
              </div>
              <h3 className="h3">{person.name}</h3>
              <p className="eyebrow mt-1 text-[11px]">{person.role}</p>
              <p className="mt-3 text-sm leading-relaxed text-smoke">
                {person.bio}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------- Commitment ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="How We Work"
          title="What you get that a warehouse cannot give you"
          lede="Nothing here is a trade secret. It is the short list of things we refuse to cut corners on, online or in the bay."
        />

        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {DIFFERENTIATORS.map(({ icon: Icon, title, copy }) => (
            <li key={title} className="card p-6">
              <Icon size={26} aria-hidden className="mb-4 text-drop" />
              <h3 className="h3">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-smoke">{copy}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Badge tone="soft">Brands in the catalog</Badge>
          {TIRE_BRANDS.map((b) => (
            <span
              key={b.slug}
              className="font-display text-lg uppercase tracking-[0.14em] text-ink/55"
            >
              {b.name}
            </span>
          ))}
        </div>
      </Section>

      {/* ---------- CTA ---------- */}
      <section className="bg-steel py-14 text-bone md:py-20">
        <div className="wrap grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="eyebrow mb-2">{BUSINESS.tagline}</p>
            <h2 className="h2">Tell us the vehicle. We will find the tire.</h2>
            <p className="lede mt-4 max-w-xl text-bone/70">
              Shipping anywhere in {BUSINESS.shipping.area}, free to the{" "}
              {BUSINESS.shop.city} shop if you would rather we fit them, and the
              van for driveways around Broward.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <Link to="/tires" className="btn-primary">
              Shop Tires
            </Link>
            <a href={BUSINESS.phoneHref} className="btn-ghost-light">
              <Phone size={18} aria-hidden />
              Call {BUSINESS.phone}
            </a>
            <Link
              to="/locations"
              className="btn-ghost-light border-transparent text-bone/70 hover:border-bone"
            >
              <MapPin size={18} aria-hidden />
              Visit the {BUSINESS.shop.city} shop
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
