import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Phone, Play, Truck } from "lucide-react";
import { BUSINESS } from "../../data/business.js";
import {
  Badge,
  Breadcrumbs,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";

// Placeholder artwork only — no customer photography has been supplied yet.
// Each tile is a CSS gradient plus an SVG tread motif, captioned with the job.
const GALLERY = [
  {
    id: "g1",
    caption: "Mobile install — 4x Continental on an F-150, Plantation",
    detail: "Driveway call. Old set off, new set mounted, balanced and torqued in about an hour.",
    tone: ["#1A1D21", "#2A2F35"],
  },
  {
    id: "g2",
    caption: "Office-park flat repair — sedan, Fort Lauderdale",
    detail: "Screw through the tread. Dismounted, patch-plugged from the inside and rebalanced.",
    tone: ["#2A2F35", "#0E0F11"],
  },
  {
    id: "g3",
    caption: "Van at work — driveway setup, Sunrise",
    detail: "Mat down, jack set, tire machine and balancer running off the van.",
    tone: ["#E03A1E", "#B82A12"],
  },
  {
    id: "g4",
    caption: "Fleet rotation — six work vans, Tamarac yard",
    detail: "Scheduled service run. Rotated, pressures set, tread depths recorded per vehicle.",
    tone: ["#1A1D21", "#0E0F11"],
  },
  {
    id: "g5",
    caption: "Wheel and tire package — staggered fitment, Weston",
    detail: "New wheels mounted and balanced, TPMS sensors transferred and relearned.",
    tone: ["#2A2F35", "#1A1D21"],
  },
  {
    id: "g6",
    caption: "Alignment rack — Sunrise shop",
    detail: "Post-install alignment with a before-and-after printout for the customer.",
    tone: ["#F5A623", "#B82A12"],
  },
  {
    id: "g7",
    caption: "Jobsite call — dual-rear-wheel truck, Davie",
    detail: "Shredded tire replaced on site so the crew did not lose the afternoon.",
    tone: ["#0E0F11", "#2A2F35"],
  },
  {
    id: "g8",
    caption: "Road-force style balance — four wheels, Coral Springs",
    detail: "Chasing a highway-speed shimmy. Old weights cleaned off, wheels rebalanced.",
    tone: ["#1A1D21", "#E03A1E"],
  },
  {
    id: "g9",
    caption: "Brake service — front rotors and pads, Sunrise shop",
    detail: "Bay work. Priced before the parts came out of the box.",
    tone: ["#2A2F35", "#0E0F11"],
  },
  {
    id: "g10",
    caption: "TPMS sensor replacement — SUV, Lauderhill",
    detail: "Dead sensor battery after eight years. Replaced in a work parking lot, light out.",
    tone: ["#0E0F11", "#1A1D21"],
  },
  {
    id: "g11",
    caption: "Tire haul-out — end of a fleet day",
    detail: "Old casings loaded up and disposed of properly. Nothing left in your lot.",
    tone: ["#2A2F35", "#F5A623"],
  },
  {
    id: "g12",
    caption: "Commercial set — light truck tires, Miramar",
    detail: "Load-rated replacements sourced and fitted on site, one invoice for the fleet.",
    tone: ["#1A1D21", "#2A2F35"],
  },
];

const VIDEOS = [
  {
    id: "v1",
    title: "What actually happens on a mobile tire install",
    duration: "3:40",
    description:
      "Start to finish in a driveway: how we set up, what the van carries, and what you are supposed to see us do before we torque a wheel.",
  },
  {
    id: "v2",
    title: "Reading your door-jamb placard",
    duration: "1:55",
    description:
      "Where to find your real PSI, why the sidewall number is not it, and how to check pressure cold without guessing.",
  },
  {
    id: "v3",
    title: "The penny test, done right",
    duration: "2:10",
    description:
      "Measuring tread in more than one spot, finding the wear bars, and the quarter-test version for rainy season.",
  },
  {
    id: "v4",
    title: "Why your steering wheel shakes at 60",
    duration: "4:05",
    description:
      "Balance versus alignment versus a bent wheel — how to tell them apart before you pay for the wrong fix.",
  },
  {
    id: "v5",
    title: "Which punctures we can repair, and which we refuse",
    duration: "2:45",
    description:
      "Tread area versus sidewall, size limits, and why a proper patch-plug beats a plug-only roadside fix.",
  },
  {
    id: "v6",
    title: "TPMS lights: steady versus flashing",
    duration: "2:20",
    description:
      "Two very different problems on the same dashboard symbol, and what each one usually costs to sort out.",
  },
];

const TIPS = [
  {
    id: "t1",
    kicker: "Pressure",
    title: "The monthly five-minute tire check",
    excerpt:
      "Cold tires, a real gauge, the door placard and a walk around the car. It catches most problems before they cost you a tire.",
    to: "/tire-care#tire-pressure",
  },
  {
    id: "t2",
    kicker: "Tread",
    title: "Penny test, quarter test and wear bars",
    excerpt:
      "Three ways to answer the only question that matters in a Florida downpour: is there still enough tread to move water?",
    to: "/tire-care#tread-depth",
  },
  {
    id: "t3",
    kicker: "Rotation",
    title: "Why front tires die first",
    excerpt:
      "Steering, braking and engine weight all land on the same two tires. Rotation is how you stop buying them in pairs.",
    to: "/tire-care#tire-rotation",
  },
  {
    id: "t4",
    kicker: "Alignment",
    title: "What a pothole on Oakland Park really costs",
    excerpt:
      "A knocked-out alignment can shave a shoulder off a new set in a few thousand miles. Here is how to spot it early.",
    to: "/tire-care#alignment",
  },
  {
    id: "t5",
    kicker: "TPMS",
    title: "Your TPMS light is not always about pressure",
    excerpt:
      "Sensors have batteries, and batteries die. Steady light and flashing light mean two different things.",
    to: "/tire-care#tpms",
  },
  {
    id: "t6",
    kicker: "Replacement",
    title: "Old tires with good tread are still old tires",
    excerpt:
      "How to read the DOT date code, and why South Florida sun ages rubber faster than mileage does.",
    to: "/tire-care#tire-replacement",
  },
];

/** Abstract tread-pattern tile standing in for photography. */
function PlaceholderArt({ tone, label }) {
  const [from, to] = tone;
  return (
    <div
      aria-hidden
      className="relative h-44 w-full overflow-hidden sm:h-48"
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
    >
      <svg
        viewBox="0 0 200 120"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full opacity-25"
        role="presentation"
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <rect
            key={i}
            x={i * 21 - 6}
            y={-10}
            width="9"
            height="140"
            transform="skewX(-14)"
            fill="#FFFFFF"
          />
        ))}
        <rect x="0" y="54" width="200" height="3" fill="#FFFFFF" opacity="0.5" />
      </svg>
      <span className="absolute bottom-3 left-4 font-display text-xs uppercase tracking-[0.22em] text-bone/70">
        {label}
      </span>
    </div>
  );
}

const TABS = [
  { id: "gallery", label: "Gallery" },
  { id: "videos", label: "Videos" },
  { id: "tips", label: "Tire Tips" },
];

export default function GalleryPage() {
  const [active, setActive] = useState("gallery");
  const tabRefs = useRef({});

  // Arrow-key roving between tabs, per the WAI-ARIA tabs pattern.
  const onKeyDown = (event) => {
    const index = TABS.findIndex((t) => t.id === active);
    let next = null;

    if (event.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;

    if (next !== null) {
      event.preventDefault();
      const id = TABS[next].id;
      setActive(id);
      tabRefs.current[id]?.focus();
    }
  };

  return (
    <>
      <Seo
        title="News & Gallery"
        description={`Work from the vans and the ${BUSINESS.address.city} shop — mobile installs, driveway repairs and fleet calls — plus how-to videos and tire care tips from ${BUSINESS.name}.`}
      />

      <PageHero
        eyebrow="News & Gallery"
        title="The work, up close"
        lede="Driveways, office lots, jobsites and the bay in Sunrise. Plus the videos and tips we end up repeating at the counter every week."
      >
        <a href={BUSINESS.phoneHref} className="btn-ghost-light">
          <Phone size={18} aria-hidden />
          {BUSINESS.phone}
        </a>
      </PageHero>

      <Breadcrumbs trail={[{ label: "News & Gallery" }]} />

      <Section className="bg-bone">
        {/* ---------- Tabs ---------- */}
        <div
          role="tablist"
          aria-label="News and gallery sections"
          onKeyDown={onKeyDown}
          className="mb-10 flex flex-wrap gap-2 border-b border-ink/10 pb-px"
        >
          {TABS.map((tab) => {
            const selected = active === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                onClick={() => setActive(tab.id)}
                className={`-mb-px border-b-2 px-5 py-3 font-display text-lg uppercase tracking-wide transition-colors ${
                  selected
                    ? "border-drop text-drop"
                    : "border-transparent text-smoke hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ---------- Gallery panel ---------- */}
        {active === "gallery" && (
          <div
            id="panel-gallery"
            role="tabpanel"
            aria-labelledby="tab-gallery"
            tabIndex={0}
          >
            <SectionHead
              eyebrow="Gallery"
              title="Jobs from around Broward"
              lede="Captions describe the job each tile stands for. Photography from these calls is being collected now."
            />

            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {GALLERY.map((item) => (
                <li key={item.id} className="card-hover overflow-hidden">
                  <PlaceholderArt
                    tone={item.tone}
                    label={BUSINESS.shortName}
                  />
                  <div className="p-5">
                    <h3 className="font-display text-lg uppercase leading-tight tracking-wide text-ink">
                      {item.caption}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-smoke">
                      {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ---------- Videos panel ---------- */}
        {active === "videos" && (
          <div
            id="panel-videos"
            role="tabpanel"
            aria-labelledby="tab-videos"
            tabIndex={0}
          >
            <SectionHead
              eyebrow="Videos"
              title="How-tos we are filming"
              lede="Short, no-nonsense walkthroughs of the questions we answer most. These are in production — call us in the meantime and we will just explain it."
            />

            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {VIDEOS.map((video) => (
                <li key={video.id} className="card overflow-hidden">
                  <div
                    aria-hidden
                    className="relative flex h-40 items-center justify-center bg-ink"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-drop">
                      <Play size={22} className="ml-0.5 fill-bone text-bone" />
                    </span>
                    <span className="absolute bottom-3 right-4 flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.15em] text-bone/70">
                      <Clock size={13} />
                      {video.duration}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="font-display text-lg uppercase leading-tight tracking-wide text-ink">
                      {video.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-smoke">
                      {video.description}
                    </p>
                    <p className="mt-4">
                      <Badge tone="soft">Coming soon · {video.duration}</Badge>
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="card mt-8 flex flex-col gap-4 border-l-4 border-l-drop p-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-sm leading-relaxed text-smoke">
                <span className="text-ink">Want the short version now?</span>{" "}
                Every topic above is written out in full on the tire care page.
              </p>
              <Link to="/tire-care" className="btn-outline btn-sm shrink-0">
                Read the guide
                <ArrowRight size={15} aria-hidden />
              </Link>
            </div>
          </div>
        )}

        {/* ---------- Tips panel ---------- */}
        {active === "tips" && (
          <div
            id="panel-tips"
            role="tabpanel"
            aria-labelledby="tab-tips"
            tabIndex={0}
          >
            <SectionHead
              eyebrow="Tire Tips"
              title="Short reads that save tires"
              lede="The advice we give at the counter, written down so you can check it in your own driveway."
            />

            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {TIPS.map((tip) => (
                <li key={tip.id} className="card-hover flex flex-col p-6">
                  <Badge tone="soft">{tip.kicker}</Badge>
                  <h3 className="h3 mt-4">{tip.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-smoke">
                    {tip.excerpt}
                  </p>
                  <Link
                    to={tip.to}
                    className="mt-5 inline-flex items-center gap-1.5 font-display text-sm uppercase tracking-wide text-drop hover:text-dive"
                  >
                    Read the tip
                    <ArrowRight size={15} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <section className="bg-steel py-14 text-bone md:py-20">
        <div className="wrap grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="eyebrow mb-2">{BUSINESS.tagline}</p>
            <h2 className="h2">Your driveway could be the next one</h2>
            <p className="lede mt-4 max-w-xl text-bone/70">
              Tell us where the vehicle sits and what it needs. The van handles
              tires on site; the {BUSINESS.address.city} shop takes the rest.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <Link to="/schedule" className="btn-primary">
              <Truck size={18} aria-hidden />
              Book Mobile Service
            </Link>
            <a href={BUSINESS.phoneHref} className="btn-ghost-light">
              <Phone size={18} aria-hidden />
              {BUSINESS.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
