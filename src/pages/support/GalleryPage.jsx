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

// Placeholder artwork only — no photography has been supplied yet. Each tile
// is a CSS gradient plus an SVG tread motif, captioned with the job or order
// it stands for. Swap these for real photos as they come in.
const GALLERY = [
  {
    id: "g1",
    caption: "Order out the door — 4x Continental, shipped to Georgia",
    detail:
      "Picked from the distributor closest to the customer, boxed and on its way without passing through a warehouse of ours.",
    tone: ["#070E1A", "#22344C"],
  },
  {
    id: "g2",
    caption: "Ship to store — set checked in at the Sunrise counter",
    detail:
      "Size, load index and speed rating read off every sidewall and matched to the order before anyone books the install.",
    tone: ["#22344C", "#070E1A"],
  },
  {
    id: "g3",
    caption: "Install bay — full set fitted after a ship-to-store order",
    detail:
      "Mounted, balanced, new valve service and every lug torqued to spec.",
    tone: ["#0068E8", "#0053C4"],
  },
  {
    id: "g4",
    caption: "Mobile install — driveway call, Plantation",
    detail:
      "Mat down, jack set, tire machine and balancer running off the van. The car never moved.",
    tone: ["#101C2E", "#070E1A"],
  },
  {
    id: "g5",
    caption: "Wheel and tire package — staggered fitment, shipped",
    detail:
      "Offset and clearance confirmed with the customer first, then mounted and balanced as a package before it shipped.",
    tone: ["#22344C", "#101C2E"],
  },
  {
    id: "g6",
    caption: "Alignment rack — Sunrise shop",
    detail:
      "Post-install alignment with a before-and-after printout for the customer.",
    tone: ["#F5A623", "#0053C4"],
  },
  {
    id: "g7",
    caption: "Fleet order — six work vans, Tamarac yard",
    detail:
      "Ordered online, shipped to the shop, fitted on site. Tread depths recorded per vehicle, one invoice.",
    tone: ["#070E1A", "#101C2E"],
  },
  {
    id: "g8",
    caption: "Packaging check — freight damage caught at the counter",
    detail:
      "A scuffed box gets opened and inspected before it is handed over. If the tire is wrong, it goes back, not on your car.",
    tone: ["#101C2E", "#0068E8"],
  },
  {
    id: "g9",
    caption: "Office-park flat repair — sedan, Fort Lauderdale",
    detail:
      "Screw through the tread. Dismounted, patch-plugged from the inside and rebalanced.",
    tone: ["#070E1A", "#22344C"],
  },
  {
    id: "g10",
    caption: "TPMS sensor replacement — SUV, Lauderhill",
    detail:
      "Dead sensor battery after eight years. Replaced in a work parking lot, light out.",
    tone: ["#22344C", "#070E1A"],
  },
  {
    id: "g11",
    caption: "Fitment call — sizes read off a door placard over the phone",
    detail:
      "Half the job is making sure the right tire gets ordered in the first place. That part happens before anything ships.",
    tone: ["#101C2E", "#F5A623"],
  },
  {
    id: "g12",
    caption: "Brake service — front rotors and pads, Sunrise shop",
    detail: "Bay work, priced before the parts came out of the box.",
    tone: ["#070E1A", "#101C2E"],
  },
];

const VIDEOS = [
  {
    id: "v1",
    title: "What happens between checkout and your driveway",
    duration: "3:40",
    description:
      "Where the tires come from, who picks them, and what to check the moment the boxes land at your door.",
  },
  {
    id: "v2",
    title: "Reading your door-jamb placard",
    duration: "1:55",
    description:
      "Where to find your real PSI and tire size, why the sidewall number is not it, and how to order the right set without guessing.",
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
    title: "Ship to your house, or ship to the shop?",
    duration: "2:30",
    description:
      "Who each option suits, what ship-to-store costs, and how the install gets booked once the order lands.",
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
    title: "Why your steering wheel shakes at 60",
    duration: "4:05",
    description:
      "Balance versus alignment versus a bent wheel — how to tell them apart before you pay for the wrong fix.",
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
      "Three ways to answer the only question that matters in a downpour: is there still enough tread to move water?",
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
    title: "What one bad pothole really costs",
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
    kicker: "Buying",
    title: "Old tires with good tread are still old tires",
    excerpt:
      "How to read the DOT date code, and why heat and sun age rubber faster than mileage does.",
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
        <rect
          x="0"
          y="54"
          width="200"
          height="3"
          fill="#FFFFFF"
          opacity="0.5"
        />
      </svg>
      <span className="absolute bottom-3 left-4 font-display text-xs font-bold uppercase tracking-[0.09em] text-bone/70">
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
    else if (event.key === "ArrowLeft")
      next = (index - 1 + TABS.length) % TABS.length;
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
        description={`Orders going out, sets being fitted at the ${BUSINESS.shop.city} shop and mobile installs around Broward — plus how-to videos and tire care tips from ${BUSINESS.name}.`}
      />

      <PageHero
        eyebrow="News & Gallery"
        title="The work, up close"
        lede={`Orders heading out across ${BUSINESS.shipping.area}, sets fitted in the ${BUSINESS.shop.city} bay, and vans working driveways around Broward. Plus the videos and tips we end up repeating every week.`}
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
                className={`-mb-px border-b-2 px-5 py-3 font-display text-lg transition-colors ${
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
              title="Orders out, tires on"
              lede="Captions describe the order or the job each tile stands for. Photography is being collected now — these are placeholders until it lands."
            />

            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {GALLERY.map((item) => (
                <li key={item.id} className="card-hover overflow-hidden">
                  <PlaceholderArt tone={item.tone} label={BUSINESS.name} />
                  <div className="p-5">
                    <h3 className="font-display text-[1.0625rem] leading-snug text-ink">
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
              title="How-tos we are filming"
              lede="Short, no-nonsense walkthroughs of the questions we answer most, for customers ordering online and for customers standing at the counter. These are in production — call us in the meantime and we will just explain it."
            />

            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {VIDEOS.map((video) => (
                <li key={video.id} className="card overflow-hidden">
                  <div
                    aria-hidden
                    className="relative flex h-40 items-center justify-center bg-steel-wash"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-drop">
                      <Play
                        size={22}
                        aria-hidden
                        className="ml-0.5 fill-bone text-bone"
                      />
                    </span>
                    <span className="absolute bottom-3 right-4 flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-[0.09em] text-bone/70">
                      <Clock size={13} aria-hidden />
                      {video.duration}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="font-display text-[1.0625rem] leading-snug text-ink">
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
                Every topic above is written out in full in the tire care
                guides.
              </p>
              <Link to="/tire-care" className="btn-outline btn-sm shrink-0">
                Read the guides
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
              title="Short reads that save tires"
              lede="The advice we give on the phone, written down so you can check it in your own driveway — wherever that driveway is."
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
                    className="mt-5 inline-flex min-h-[32px] items-center gap-1.5 font-display text-sm font-bold text-drop hover:text-dive"
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

      <section className="bg-steel-wash py-14 text-bone md:py-20">
        <div className="wrap grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="eyebrow-dark mb-2">{BUSINESS.tagline}</p>
            <h2 className="h2">Your order could be the next one out</h2>
            <p className="lede mt-4 max-w-xl text-bone/70">
              Tires shipped anywhere in {BUSINESS.shipping.area}, free to the{" "}
              {BUSINESS.shop.city} shop if you want them fitted, and the van for
              driveways around Broward.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <Link to="/tires" className="btn-primary">
              <Truck size={18} aria-hidden />
              Shop Tires
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
