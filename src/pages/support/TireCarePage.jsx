import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  CircleGauge,
  Coins,
  Compass,
  Disc3,
  Phone,
  Radio,
  Repeat,
  Ruler,
  ShoppingCart,
} from "lucide-react";
import { BUSINESS } from "../../data/business.js";
import {
  Badge,
  Breadcrumbs,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";

/** The door-placard PSI explainer that lives inside the pressure section. */
function PsiCallout() {
  return (
    <div className="card mt-6 border-l-4 border-l-amber p-6">
      <Badge tone="amber">PSI: where the real number comes from</Badge>

      <p className="mt-4 text-sm leading-relaxed text-smoke">
        Open the driver's door and look at the placard on the door jamb. That
        sticker is the number your vehicle's engineers chose for your car, at
        its weight, on its suspension — front and rear, plus the spare. It is
        the source of truth.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-smoke">
        The big number molded into the tire sidewall is{" "}
        <span className="text-ink">not</span> your target. That is the maximum
        pressure the tire is rated to hold, not the pressure it should run at.
        Filling to the sidewall number gives you a hard ride, a narrow contact
        patch and tread that wears out down the middle.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-smoke">
        One more South Florida detail: check pressure cold, before you drive.
        Heat from a highway run or an afternoon in a parking lot can add several
        PSI, and topping off a hot tire leaves it low the next morning.
      </p>
    </div>
  );
}

/** The penny test explainer that lives inside the tread depth section. */
function PennyTest() {
  return (
    <div className="card mt-6 border-l-4 border-l-drop p-6">
      <div className="mb-4 flex items-center gap-2">
        <Coins size={20} aria-hidden className="text-drop" />
        <h4 className="font-display text-lg uppercase tracking-wide">
          The penny test
        </h4>
      </div>

      <ol className="space-y-3 text-sm leading-relaxed text-smoke">
        <li className="flex gap-3">
          <span
            aria-hidden
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-ink font-display text-sm text-amber"
          >
            1
          </span>
          Turn a penny so Lincoln's head points down into the tread.
        </li>
        <li className="flex gap-3">
          <span
            aria-hidden
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-ink font-display text-sm text-amber"
          >
            2
          </span>
          Push it into a groove — try several spots across the tire, not just
          one.
        </li>
        <li className="flex gap-3">
          <span
            aria-hidden
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-ink font-display text-sm text-amber"
          >
            3
          </span>
          If you can see the top of Lincoln's head, you are at or below 2/32" —
          legally worn out and done. Replace the tire.
        </li>
        <li className="flex gap-3">
          <span
            aria-hidden
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-ink font-display text-sm text-amber"
          >
            4
          </span>
          If the tread covers part of his head, you have some life left — but
          start planning, especially before rainy season.
        </li>
      </ol>

      <p className="mt-4 border-t border-ink/10 pt-4 text-xs leading-relaxed text-smoke">
        A quarter is the stricter version of the same trick: if the tread
        reaches Washington's head you are around 4/32", which is where wet
        braking really starts falling off. In Florida rain, we would rather you
        use the quarter.
      </p>
    </div>
  );
}

const TOPICS = [
  {
    id: "tire-pressure",
    nav: "Tire Pressure",
    icon: CircleGauge,
    title: "Tire Pressure",
    why: "Pressure is the cheapest thing on this page and the one that changes the most. An underinflated tire flexes more, runs hotter and wears its shoulders off — and in Florida heat, hot plus low is how sidewalls fail on I-595. Overinflated is no better: less rubber on the road, a harsher ride and a strip of wear straight down the center. Correct pressure is also the single easiest way to get the fuel economy the car was designed to have.",
    checklist: [
      "Check all four tires cold — parked at least three hours, or before your first drive",
      "Read the driver's door-jamb placard for your target PSI, front and rear",
      "Use a real gauge, not the one bolted to a gas-station hose",
      "Do not forget the spare — it loses air sitting still",
      "Re-check after a big temperature swing or a cold front",
      "Look at the valve stems while you are down there; cracked rubber leaks",
    ],
    cadence:
      "Once a month, and before any long drive. Any time the low-pressure light comes on, check it that day.",
    extra: <PsiCallout />,
    links: [
      { to: "/services/tire-repair", label: "Tire Repair" },
      { to: "/services/tpms-service", label: "TPMS Service" },
    ],
  },
  {
    id: "tire-rotation",
    nav: "Tire Rotation",
    icon: Repeat,
    title: "Tire Rotation",
    why: "Your tires do not wear evenly, because they are not doing the same job. On a front-wheel-drive car the fronts steer, brake hardest and carry the engine, so they can wear out roughly twice as fast as the rears. Rotation moves that wear around the vehicle so all four go down together. Skip it and you buy tires two at a time, more often, with a mismatched set in between — and on some all-wheel-drive systems, a big tread-depth mismatch is hard on the drivetrain itself.",
    checklist: [
      "Follow the rotation pattern in your owner's manual — it differs by drivetrain",
      "Directional tires stay on their own side; staggered setups may not rotate at all",
      "Re-torque the lug nuts to spec, in a star pattern, every single time",
      "Set pressures afterward, since front and rear targets can differ",
      "Have the tech note tread depth at each corner so you can track wear",
      "Ask about odd wear patterns — they usually point at alignment or a worn part",
    ],
    cadence:
      "Every 5,000 to 7,500 miles for most vehicles — easy to remember if you pair it with an oil change.",
    links: [
      { to: "/services/tire-rotation", label: "Tire Rotation" },
      { to: "/services/oil-change", label: "Oil Change" },
    ],
  },
  {
    id: "tire-balancing",
    nav: "Tire Balancing",
    icon: Disc3,
    title: "Tire Balancing",
    why: "A wheel and tire assembly is never perfectly even, and at highway speed a half-ounce of imbalance turns into a vibration you can feel in the steering wheel or the seat. That shake is not just annoying — it hammers wheel bearings, tie rod ends and shocks, and it scrubs cupped patches into the tread that never go away. Balancing spins the assembly on a calibrated machine and corrects the heavy spot with small weights.",
    checklist: [
      "Balance every tire when it is mounted — new tire, new balance",
      "Rebalance after any repair, since a patch adds weight inside the tire",
      "Feel where the vibration lives: steering wheel usually means front, seat means rear",
      "Ask for the wheels to be cleaned of old weights and corrosion first",
      "If a fresh balance does not fix it, look at a bent wheel or a separated belt",
      "Curb strikes and potholes are worth a re-check even if nothing looks wrong",
    ],
    cadence:
      "With every new tire, after every repair, and any time a vibration shows up above about 45 mph.",
    links: [
      { to: "/services/tire-balancing", label: "Tire Balancing" },
      { to: "/services/tire-repair", label: "Tire Repair" },
    ],
  },
  {
    id: "tread-depth",
    nav: "Tread Depth",
    icon: Ruler,
    title: "Tread Depth",
    why: "Tread exists to move water out from under the tire. On dry pavement worn tires can even feel fine — right up to the first hard afternoon storm, when there is nowhere for the water to go and the tire starts floating instead of gripping. Stopping distance in the wet grows dramatically as tread disappears. This is the measurement that decides when a tire is finished, no matter how good the sidewall looks.",
    checklist: [
      "Check tread in several spots across each tire, inside edge included",
      "Find the wear bars — the flat rubber ribs between the grooves. Flush with the tread means done",
      "Compare left to right; a big difference usually means alignment trouble",
      "Watch the inside shoulder especially, since that edge hides and wears first",
      "Replace at 2/32\" at the absolute latest, and consider it well before that in a rainy climate",
      "Look at age too: rubber over six years old can be hard and cracked with tread left",
    ],
    cadence:
      "Eyeball it monthly when you check pressure; measure it properly at every rotation.",
    extra: <PennyTest />,
    links: [
      { to: "/services/tire-installation", label: "Tire Installation" },
      { to: "/tires", label: "Shop Tires" },
    ],
  },
  {
    id: "alignment",
    nav: "Alignment",
    icon: Compass,
    title: "Wheel Alignment",
    why: "Alignment is the set of angles your wheels sit at relative to the road and to each other. Knock those angles out — a curb, a pothole on Oakland Park, a worn suspension bushing — and the tire gets dragged sideways a little on every rotation. That quietly grinds a shoulder off a brand-new set in a few thousand miles. It also shows up as a car that pulls, or a steering wheel that sits crooked while you drive straight.",
    checklist: [
      "Align whenever you put on a new set — protect the investment on day one",
      "Get it checked after a real curb hit or a pothole that made you wince",
      "Symptoms to act on: pulling, off-center steering wheel, or a new tire squeal in turns",
      "Ask for the before-and-after printout and keep it",
      "Have worn tie rods, ball joints or bushings replaced first — otherwise it will not hold",
      "Uneven inside-edge wear is the classic alignment tell",
    ],
    cadence:
      "At least once a year, with every new set of tires, and immediately after any hard impact.",
    links: [
      { to: "/services/wheel-alignment", label: "Wheel Alignment" },
      { to: "/services/suspension-repair", label: "Suspension Repair" },
    ],
  },
  {
    id: "tpms",
    nav: "TPMS",
    icon: Radio,
    title: "TPMS (Tire Pressure Monitoring)",
    why: "Every light-duty vehicle sold in the US since the 2008 model year has a tire pressure monitoring system. Most use a sensor inside each wheel that radios pressure to the car. Those sensors have batteries sealed inside them, and after roughly five to ten years they die — which is why a lot of TPMS lights have nothing to do with your tires. Knowing which light you are looking at matters: a steady light means low pressure, while a light that flashes at startup and then stays on usually means the system itself has a fault.",
    checklist: [
      "Steady light: check and correct pressure on all four, then the spare",
      "Flashing then solid: the system has a fault — a sensor, a relearn or a receiver issue",
      "Tell your installer the vehicle has TPMS before any tire work",
      "Replace the service kit — valve core, seal and cap — whenever a tire comes off",
      "Expect a relearn procedure after rotation on some vehicles",
      "Do not just ignore the light; you lose the warning that actually protects you",
    ],
    cadence:
      "Service the sensors whenever tires are replaced, and expect battery-related failures somewhere in the five-to-ten-year range.",
    links: [
      { to: "/services/tpms-service", label: "TPMS Service" },
      { to: "/services/tire-installation", label: "Tire Installation" },
    ],
  },
  {
    id: "tire-replacement",
    nav: "Tire Replacement",
    icon: ShoppingCart,
    title: "Tire Replacement",
    why: "Tires get replaced for two reasons: they are worn out, or they are too old. Tread depth covers the first. The second catches people off guard — rubber ages even parked, and South Florida sun and heat speed that up. A six-year-old tire with plenty of tread can still be hard, cracked and unreliable. Damage is the third path: a sidewall puncture, a bulge, or a tear cannot be repaired safely, no matter what anyone tells you. Only punctures in the tread area, within a limited size, belong on the repair table.",
    checklist: [
      "Replace in sets of four when you can; in pairs at minimum, always on the same axle",
      "Match size, load index and speed rating to the door placard, not to guesswork",
      "Check the DOT date code on the sidewall — the last four digits are week and year",
      "Never repair a sidewall, a bulge, or a puncture bigger than a quarter inch",
      "Budget for an alignment with the new set so they wear evenly",
      "Have the old tires disposed of properly — we haul them away with us",
    ],
    cadence:
      "When tread hits the wear bars, when damage cannot be repaired safely, or once the tires are past roughly six years old — whichever comes first.",
    links: [
      { to: "/services/tire-installation", label: "Tire Installation" },
      { to: "/services/tire-repair", label: "Tire Repair" },
    ],
  },
];

function TopicSection({ topic }) {
  const Icon = topic.icon;

  return (
    <article id={topic.id} className="scroll-mt-24 border-t border-ink/10 pt-12">
      <div className="mb-5 flex items-center gap-3">
        <Icon size={28} aria-hidden className="text-drop" />
        <h2 className="h2">{topic.title}</h2>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="text-base leading-relaxed text-smoke">{topic.why}</p>
          {topic.extra}
        </div>

        <div>
          <div className="card p-6">
            <h3 className="h3 mb-4">Checklist</h3>
            <ul className="space-y-2.5">
              {topic.checklist.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink">
                  <CheckCircle2
                    size={16}
                    aria-hidden
                    className="mt-0.5 shrink-0 text-drop"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="card mt-4 bg-fog p-6">
            <h3 className="mb-2 font-display text-sm uppercase tracking-[0.15em] text-smoke">
              How often
            </h3>
            <p className="text-sm leading-relaxed text-ink">{topic.cadence}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {topic.links.map((link) => (
              <Link key={link.to} to={link.to} className="btn-outline btn-sm">
                {link.label}
                <ArrowRight size={15} aria-hidden />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function TireCarePage() {
  return (
    <>
      <Seo
        title="Tire Care Tips"
        description="A plain-English guide to tire pressure, rotation, balancing, tread depth, alignment, TPMS and replacement — including the penny test and why the door placard beats the sidewall number."
      />

      <PageHero
        eyebrow="Tire Care Tips"
        title="Make your tires last. It is not complicated."
        lede="Seven things decide whether a set of tires goes 30,000 miles or 60,000. Here is what each one does, what to check, and how often — no upsell attached."
      >
        <a href={BUSINESS.phoneHref} className="btn-ghost-light">
          <Phone size={18} aria-hidden />
          Ask us: {BUSINESS.phone}
        </a>
      </PageHero>

      <Breadcrumbs trail={[{ label: "Tire Care Tips" }]} />

      {/* ---------- Jump nav ---------- */}
      <nav aria-label="Tire care topics" className="border-b border-ink/10 bg-fog">
        <div className="wrap py-5">
          <h2 className="mb-3 font-display text-xs uppercase tracking-[0.2em] text-smoke">
            Jump to a topic
          </h2>
          <ul className="flex flex-wrap gap-2">
            {TOPICS.map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  className="inline-block rounded-sm border border-ink/15 bg-bone px-3.5 py-2 font-display text-sm uppercase tracking-wide text-ink transition-colors hover:border-drop hover:text-drop"
                >
                  {t.nav}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <Section className="bg-bone">
        <SectionHead
          eyebrow="Start Here"
          title="The five-minute monthly check"
          lede="If you only ever do one thing from this page, do this: once a month, cold tires, walk around the car."
        />

        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Check pressure on all four plus the spare, against the door placard.",
            "Look at tread depth — penny test, and find the wear bars.",
            "Scan the sidewalls for cuts, cracks or bulges.",
            "Note anything new: a pull, a shimmy, a warning light.",
          ].map((step, i) => (
            <li key={step} className="card p-5">
              <span
                aria-hidden
                className="mb-3 block font-display text-3xl leading-none text-drop"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-sm leading-relaxed text-ink">{step}</p>
            </li>
          ))}
        </ol>

        <div className="mt-14 space-y-12">
          {TOPICS.map((topic) => (
            <TopicSection key={topic.id} topic={topic} />
          ))}
        </div>
      </Section>

      <section className="bg-ink py-14 text-bone md:py-20">
        <div className="wrap grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="eyebrow mb-2">Rather not do it yourself?</p>
            <h2 className="h2">We will check all of it in your driveway</h2>
            <p className="lede mt-4 max-w-xl text-bone/70">
              Pressure, tread, wear pattern, TPMS — the van can handle the
              inspection and most of the fixes right where the car is parked.
              Alignments and suspension work happen at the{" "}
              {BUSINESS.address.city} shop.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <Link to="/schedule" className="btn-primary">
              Book a Visit
            </Link>
            <Link to="/mobile-service" className="btn-ghost-light">
              How mobile service works
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
