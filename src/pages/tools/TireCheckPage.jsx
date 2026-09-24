import React, { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleGauge,
  Coins,
  Info,
  Phone,
  Ruler,
  Search,
  ShieldCheck,
} from "lucide-react";

import {
  Accordion,
  Badge,
  Breadcrumbs,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";
import { BUSINESS } from "../../data/business.js";
import {
  TREAD,
  decodeDot,
  parseSize,
  treadStatus,
} from "../../data/tireMath.js";

/* ------------------------------------------------------------------ *
 * The coin diagram
 *
 * A penny and a quarter are the two rulers everyone already owns, and the
 * only reason the tests are hard to run is that nobody can picture what
 * "Lincoln's head disappears" is supposed to look like. So the drawing is
 * the instruction: drag until the picture matches the tire.
 *
 * The geometry is real. A coin dropped head-first into a groove rests on
 * the groove floor, so the top of the portrait sits a fixed distance above
 * that floor — 2/32" on a penny, 4/32" on a quarter. Everything below is
 * that one fact, drawn to scale at 7px per 32nd.
 * ------------------------------------------------------------------ */

const PX = 7; // pixels per 1/32"
const SURFACE = 220; // the tread surface, in diagram coordinates
const CENTER_X = 200;
const GROOVE_HALF = 40;
const MAX_DEPTH = 12;

const COINS = {
  penny: {
    key: "penny",
    label: "Penny",
    person: "Lincoln",
    possessive: "Lincoln's",
    diameter32: 24, // 0.750"
    headFrom32: 2, // top of the head, above the coin's edge
    light: "#E2A276",
    mid: "#C1743C",
    dark: "#8A4A22",
  },
  quarter: {
    key: "quarter",
    label: "Quarter",
    person: "Washington",
    possessive: "Washington's",
    diameter32: 30.56, // 0.955"
    headFrom32: 4,
    light: "#E4E8ED",
    mid: "#B9BEC7",
    dark: "#7E8794",
  },
};

// A profile bust, drawn head-up and facing right, in its own 100-unit space.
// It gets scaled so the crown of the head lands exactly the right distance
// from the coin's edge, then turned upside down — which is how the coin goes
// into the groove.
const BUST =
  "M -55 78 C -50 30, -48 6, -42 -10 C -36 -34, -22 -56, 0 -62 " +
  "C 16 -58, 28 -44, 33 -28 C 35 -22, 30 -20, 28 -16 " +
  "C 33 -10, 40 -6, 39 -1 C 38 3, 31 3, 29 6 " +
  "C 28 12, 27 18, 22 22 C 14 28, 2 27, -4 30 " +
  "C -6 40, -2 50, 4 60 C 12 70, 30 74, 44 78 Z";

const fmt32 = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function CoinDiagram({ depth, coin }) {
  const c = COINS[coin];
  const radius = (c.diameter32 * PX) / 2;
  const bustScale = (radius - c.headFrom32 * PX) / 62;
  const grooveBottom = SURFACE + depth * PX;
  const coinCy = grooveBottom - radius;
  const headLine = grooveBottom - c.headFrom32 * PX;
  const headShowing = depth < c.headFrom32;

  return (
    <svg
      viewBox="0 0 400 330"
      className="h-auto w-full"
      role="img"
      aria-label={`Cross-section of a ${c.label.toLowerCase()} standing head-down in a tread groove ${fmt32(
        depth,
      )} thirty-seconds of an inch deep. The top of ${c.possessive} head is ${
        headShowing ? "showing above the tread" : "buried below the tread"
      }.`}
    >
      <defs>
        <linearGradient id="tdRubber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2C4260" />
          <stop offset="100%" stopColor="#141F33" />
        </linearGradient>
        <linearGradient id="tdMetal" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="55%" stopColor={c.mid} />
          <stop offset="100%" stopColor={c.dark} />
        </linearGradient>
        <clipPath id="tdCoinClip">
          <circle cx="0" cy="0" r={radius} />
        </clipPath>
      </defs>

      {/* Air above the tire. */}
      <rect x="0" y="0" width="400" height={SURFACE} rx="10" fill="#F4F6FA" />

      {/* The groove void, drawn before the coin so the coin sits inside it. */}
      <rect
        x={CENTER_X - GROOVE_HALF}
        y={SURFACE}
        width={GROOVE_HALF * 2}
        height={330 - SURFACE}
        fill="#070E1A"
      />

      {/* The coin. */}
      <g transform={`translate(${CENTER_X} ${coinCy})`}>
        <circle cx="0" cy="0" r={radius} fill="url(#tdMetal)" />
        <g clipPath="url(#tdCoinClip)">
          <g transform="rotate(180)">
            <path
              d={BUST}
              transform={`scale(${bustScale})`}
              fill={c.dark}
              opacity="0.55"
            />
          </g>
        </g>
        <circle
          cx="0"
          cy="0"
          r={radius - 9}
          fill="none"
          stroke={c.dark}
          strokeWidth="2"
          opacity="0.45"
        />
        <circle
          cx="0"
          cy="0"
          r={radius}
          fill="none"
          stroke={c.dark}
          strokeWidth="3"
        />
      </g>

      {/* Rubber, drawn over the coin — everything below the tread surface and
          outside the groove is hidden behind the tire. */}
      <rect
        x={CENTER_X - GROOVE_HALF}
        y={grooveBottom}
        width={GROOVE_HALF * 2}
        height={Math.max(0, 330 - grooveBottom)}
        fill="url(#tdRubber)"
      />
      <rect
        x="8"
        y={SURFACE}
        width={CENTER_X - GROOVE_HALF - 8}
        height={330 - SURFACE}
        rx="7"
        fill="url(#tdRubber)"
      />
      <rect
        x={CENTER_X + GROOVE_HALF}
        y={SURFACE}
        width={392 - (CENTER_X + GROOVE_HALF)}
        height={330 - SURFACE}
        rx="7"
        fill="url(#tdRubber)"
      />

      {/* Sipes, so the blocks read as tread rather than as two boxes. */}
      <g stroke="#0B1524" strokeWidth="5" strokeLinecap="round" opacity="0.5">
        <line x1="45" y1={SURFACE + 8} x2="45" y2="330" />
        <line x1="95" y1={SURFACE + 8} x2="95" y2="330" />
        <line x1="305" y1={SURFACE + 8} x2="305" y2="330" />
        <line x1="355" y1={SURFACE + 8} x2="355" y2="330" />
      </g>
      <g stroke="#7C93B5" strokeWidth="2" opacity="0.55">
        <line
          x1="8"
          y1={SURFACE + 1}
          x2={CENTER_X - GROOVE_HALF}
          y2={SURFACE + 1}
        />
        <line
          x1={CENTER_X + GROOVE_HALF}
          y1={SURFACE + 1}
          x2="392"
          y2={SURFACE + 1}
        />
      </g>

      {/* The depth being modelled, dimensioned on the block face. Below about
          3/32" there is no room for the label inside the rubber, and the
          number is on the page anyway. */}
      {depth >= 3 && (
        <g>
          <g stroke="#9FB4D0" strokeWidth="2" fill="none">
            <line x1="130" y1={SURFACE} x2="130" y2={grooveBottom} />
            <line x1="120" y1={SURFACE + 1} x2="140" y2={SURFACE + 1} />
            <line
              x1="120"
              y1={grooveBottom - 1}
              x2="140"
              y2={grooveBottom - 1}
            />
          </g>
          <text
            x="112"
            y={Math.max((SURFACE + grooveBottom) / 2 + 6, SURFACE + 24)}
            textAnchor="end"
            fontSize="18"
            fontWeight="700"
            fill="#E9F2FF"
          >
            {fmt32(depth)}/32&quot;
          </text>
        </g>
      )}

      {/* Where the portrait actually starts. */}
      <line
        x1={CENTER_X}
        y1={headLine}
        x2="392"
        y2={headLine}
        stroke="#0068E8"
        strokeWidth="2"
        strokeDasharray="6 5"
      />
      <rect
        x="214"
        y={headLine - 30}
        width="178"
        height="26"
        rx="5"
        fill="#070E1A"
      />
      <text
        x="386"
        y={headLine - 11}
        textAnchor="end"
        fontSize="17"
        fontWeight="700"
        fill="#FFFFFF"
      >
        Top of the head
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * The wear-bar diagram
 * ------------------------------------------------------------------ */

const BAR_LEVELS = {
  above: {
    key: "above",
    label: "Tread sits clearly above the bars",
    shown: 6,
    depth: null,
    precision: "indicative",
    note: 'The bars only tell you one thing precisely: when you have hit 2/32". Above that they cannot give you a number — use a coin or a gauge for that.',
  },
  close: {
    key: "close",
    label: "Tread is nearly down to the bars",
    shown: 3,
    depth: 3,
    precision: "estimated",
    note: 'Called at roughly 3/32" — an estimate from the gap you can see, not a measurement.',
  },
  flush: {
    key: "flush",
    label: "Bars are flush with the tread",
    shown: 2,
    depth: 2,
    precision: "measured",
    note: 'The bars are molded at exactly 2/32", so flush is not an estimate. That tire is finished.',
  },
};

function BarDiagram({ level }) {
  const step = 12; // px per 1/32" in this smaller drawing
  const floor = 156; // the bottom of the groove
  const surface = floor - BAR_LEVELS[level].shown * step;
  const barTop = floor - TREAD.legal * step;

  return (
    <svg
      viewBox="0 0 320 200"
      className="h-auto w-full"
      role="img"
      aria-label={`A tread groove with a wear bar molded across the bottom of it, ${TREAD.legal} thirty-seconds of an inch tall. ${BAR_LEVELS[level].label}.`}
    >
      <rect x="0" y="0" width="320" height="200" rx="10" fill="#F4F6FA" />

      {/* The groove, then the bar standing in it. */}
      <rect
        x="118"
        y={surface}
        width="84"
        height={floor - surface}
        fill="#070E1A"
      />
      <rect x="118" y={floor} width="84" height={200 - floor} fill="#22344C" />
      <rect
        x="126"
        y={barTop}
        width="68"
        height={floor - barTop}
        rx="3"
        fill="#6B87AD"
      />

      {/* The tread blocks either side. */}
      <rect
        x="8"
        y={surface}
        width="110"
        height={200 - surface}
        rx="6"
        fill="#22344C"
      />
      <rect
        x="202"
        y={surface}
        width="110"
        height={200 - surface}
        rx="6"
        fill="#22344C"
      />

      {/* Tread surface. */}
      <line
        x1="8"
        y1={surface}
        x2="312"
        y2={surface}
        stroke="#0068E8"
        strokeWidth="2"
        strokeDasharray="6 5"
      />
      <line
        x1="70"
        y1="32"
        x2="70"
        y2={surface}
        stroke="#0068E8"
        strokeWidth="2"
      />
      <text x="8" y="24" fontSize="16" fontWeight="700" fill="#070E1A">
        Tread surface
      </text>

      {/* The bar itself. */}
      <polyline
        points="196,138 232,172 250,172"
        fill="none"
        stroke="#9FB4D0"
        strokeWidth="2"
      />
      <text
        x="312"
        y="178"
        textAnchor="end"
        fontSize="16"
        fontWeight="700"
        fill="#E9F2FF"
      >
        Wear bar &middot; {TREAD.legal}/32&quot;
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Where the DOT code lives
 * ------------------------------------------------------------------ */

function SidewallDiagram() {
  return (
    <svg
      viewBox="0 0 400 200"
      className="h-auto w-full"
      role="img"
      aria-label="A tire sidewall stamped DOT U2LL LMLR 3421, with the last four digits — 3421, week 34 of 2021 — highlighted as the date code."
    >
      <rect x="0" y="0" width="400" height="200" rx="10" fill="#101C2E" />
      {/* A slice of sidewall, curving the way the tire does. */}
      <path
        d="M 12 186 Q 200 86 388 186"
        fill="none"
        stroke="#22344C"
        strokeWidth="52"
        strokeLinecap="round"
      />
      <path
        d="M 12 186 Q 200 86 388 186"
        fill="none"
        stroke="#334A69"
        strokeWidth="2"
      />
      <text
        x="256"
        y="143"
        textAnchor="end"
        fontSize="20"
        fontWeight="700"
        letterSpacing="2"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fill="#E9F2FF"
      >
        DOT U2LL LMLR
      </text>
      <rect x="264" y="118" width="80" height="38" rx="7" fill="#00B4FC" />
      <text
        x="304"
        y="144"
        textAnchor="middle"
        fontSize="22"
        fontWeight="800"
        letterSpacing="2"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fill="#070E1A"
      >
        3421
      </text>
      <line
        x1="304"
        y1="116"
        x2="304"
        y2="96"
        stroke="#00B4FC"
        strokeWidth="2"
      />
      <text
        x="304"
        y="82"
        textAnchor="middle"
        fontSize="17"
        fontWeight="700"
        fill="#00B4FC"
      >
        The last four digits
      </text>
      <text
        x="304"
        y="58"
        textAnchor="middle"
        fontSize="16"
        fontWeight="600"
        fill="#9FB4D0"
      >
        week 34 of 2021
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Small shared pieces
 * ------------------------------------------------------------------ */

const TONES = {
  fine: {
    badge: "drop",
    bar: "bg-drop",
    border: "border-l-drop",
    text: "text-drop",
    Icon: CheckCircle2,
  },
  soon: {
    badge: "amber",
    bar: "bg-amber",
    border: "border-l-amber",
    text: "text-amberInk",
    Icon: AlertTriangle,
  },
  replace: {
    badge: "ink",
    bar: "bg-ink",
    border: "border-l-ink",
    text: "text-ink",
    Icon: AlertTriangle,
  },
};

function ChoiceButton({ active, onClick, children, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-sm px-3 py-2.5 text-left font-display text-[13px] font-bold leading-tight transition-colors sm:text-[14px] ${
        active ? "bg-ink text-bone" : "bg-ink/[0.05] text-ink hover:bg-ink/10"
      }`}
    >
      {Icon && <Icon size={16} aria-hidden className="shrink-0" />}
      <span>{children}</span>
    </button>
  );
}

function Figure({ label, value, sub }) {
  return (
    <div className="rounded-sm bg-fog p-4">
      <p className="label mb-1">{label}</p>
      <p className="tnum font-display text-[1.6rem] font-extrabold leading-none text-ink">
        {value}
      </p>
      {sub && (
        <p className="mt-1.5 text-[13px] leading-snug text-smoke">{sub}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

const NEW_DEPTHS = [
  { value: 10, label: '10/32" — typical passenger or touring tire' },
  { value: 12, label: '12/32" — many all-terrain and light-truck tires' },
  { value: 14, label: '14/32" — deep winter and heavy LT tires' },
];

const FAQ = [
  {
    q: "How often should I actually check?",
    a: "Once a month, at the same time you check pressures, and again before any long drive. It takes under a minute per tire. Check three spots across each tire — outer shoulder, middle, inner shoulder — because a tire rarely wears evenly, and the shallowest reading is the one that counts.",
  },
  {
    q: "Does the spare count?",
    a: "Yes, and it is the one nobody checks. A full-size spare ages in the trunk at the same rate as the four doing the work, so a spare with beautiful tread can still be a ten-year-old tire. Check its date code and its pressure twice a year. A temporary compact spare is a different animal: it carries its own speed and distance limits printed on the sidewall, usually 50 mph and a short trip to a shop.",
  },
  {
    q: "What does uneven wear tell me?",
    a: "Worn down the centre with the shoulders still full means over-inflation — the tire is crowned and riding on its middle. Worn on both shoulders with the centre full means the opposite: chronic under-inflation. Worn on one shoulder only is alignment, usually camber or toe, and no new tire will survive it until the alignment is fixed. Patchy or scalloped wear that you can feel with your palm points at worn shocks, struts or a wheel that is out of balance.",
  },
  {
    q: "The tread is fine. Does age really matter?",
    a: "It does, and this is the part the tread check cannot see. Rubber cures and hardens over time whether the tire is driven or parked, which is why a barely-used spare or a low-mileage car on original tires can be past it with most of the tread still there. Six years is the usual point at which manufacturers ask for a yearly inspection, and ten years is the usual hard stop — but both are manufacturer guidance, not law. Heat and sunlight, which South Florida has in quantity, move it along faster.",
  },
  {
    q: 'Is 2/32" really the legal line?',
    a: 'In most US states, yes — it is the point at which a tire is legally worn out, and it is what the penny test finds. A handful of states word it differently or set the bar elsewhere, so treat 2/32" as the floor rather than the whole answer. Either way, well before that, wet braking has already fallen off sharply: below 4/32" the grooves can no longer move enough water out of the way.',
  },
  {
    q: "Do I have to replace all four?",
    a: "Not always. On a front- or rear-wheel-drive car, two is fine if the other two still have real tread — and the new pair goes on the rear axle regardless of which end drives, because a car that loses grip at the back first is much harder to catch. All-wheel drive is stricter: many manufacturers require all four within a small difference in circumference, so a single replacement on a worn set can cook a differential. Check the owner's manual before buying one tire.",
  },
];

export default function TireCheckPage() {
  const [params, setParams] = useSearchParams();

  const patch = (next) => {
    const merged = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      if (v === "" || v == null) merged.delete(k);
      else merged.set(k, String(v));
    });
    setParams(merged, { replace: true });
  };

  const method = ["coin", "gauge", "bars"].includes(params.get("method"))
    ? params.get("method")
    : "coin";
  const coin = params.get("coin") === "quarter" ? "quarter" : "penny";
  const barLevel = BAR_LEVELS[params.get("bars")]
    ? params.get("bars")
    : "above";
  const newDepth = NEW_DEPTHS.some((d) => d.value === Number(params.get("nd")))
    ? Number(params.get("nd"))
    : TREAD.new;

  const sliderTouched = params.has("tread");
  const sliderDepth = sliderTouched
    ? Math.min(MAX_DEPTH, Math.max(0, Number(params.get("tread"))))
    : 6;
  const gaugeRaw = params.get("gauge") ?? "";
  const gaugeNumber = Number(gaugeRaw);
  const gaugeUnreadable =
    gaugeRaw.trim() !== "" &&
    (!Number.isFinite(gaugeNumber) || gaugeNumber < 0 || gaugeNumber > 32);
  const dotRaw = params.get("dot") ?? "";
  const sizeRaw = params.get("size") ?? "";

  // What the chosen method actually supports saying.
  const reading = useMemo(() => {
    if (method === "coin") {
      if (!sliderTouched || !Number.isFinite(sliderDepth)) return null;
      return {
        depth: sliderDepth,
        precision: "estimated",
        note: `Read off the ${COINS[coin].label.toLowerCase()} by eye. A gauge is worth a couple of dollars if you want the number exactly.`,
      };
    }
    if (method === "gauge") {
      const n = Number(gaugeRaw);
      if (gaugeRaw.trim() === "" || !Number.isFinite(n) || n < 0 || n > 32)
        return null;
      return {
        depth: n,
        precision: "measured",
        note: "Measured with a gauge — take the shallowest of three spots across the tire, not the deepest.",
      };
    }
    const level = BAR_LEVELS[barLevel];
    return { depth: level.depth, precision: level.precision, note: level.note };
  }, [method, sliderTouched, sliderDepth, coin, gaugeRaw, barLevel]);

  const tread =
    reading && reading.depth != null
      ? treadStatus(reading.depth, newDepth)
      : null;

  const dot = dotRaw.trim() ? decodeDot(dotRaw) : null;
  const dotUnreadable = dotRaw.trim().length > 0 && dot === null;
  const dotLegacy = Boolean(dot?.legacy);
  const ageStatus = dotLegacy ? "replace" : (dot?.status ?? null);

  const size = sizeRaw.trim() ? parseSize(sizeRaw) : null;
  const sizeUnreadable = sizeRaw.trim().length > 0 && size === null;
  const shopHref = size
    ? size.format === "flotation"
      ? `/tires?search=size&d=${size.rimDiameter}`
      : `/tires?search=size&w=${size.width}&a=${size.aspect}&d=${size.rimDiameter}`
    : "/tires";

  // The verdict. Both halves have to be clean before this page says "fine".
  const verdict = useMemo(() => {
    const problems = [];
    if (tread?.status === "replace")
      problems.push(
        `The tread is down to ${fmt32(tread.depth)}/32". That is the legal minimum in most US states, and the tire is finished.`,
      );
    else if (tread?.status === "soon")
      problems.push(
        `The tread is at ${fmt32(tread.depth)}/32". It is still legal, but below 4/32" wet stopping distances climb sharply. Plan the replacement rather than waiting for the penny to tell you.`,
      );

    if (dotLegacy)
      problems.push(
        "That is a pre-2000 date code, which makes the tire at least twenty-five years old. Replace it whatever the tread looks like.",
      );
    else if (ageStatus === "replace")
      problems.push(
        `The tire was built in ${dot.year} and is about ${Math.floor(dot.ageYears)} years old. Most manufacturers say ten years is the end of the road regardless of tread.`,
      );
    else if (ageStatus === "inspect")
      problems.push(
        `The tire was built in ${dot.year}, so it is about ${Math.floor(dot.ageYears)} years old. Past six, the guidance is to have it looked at once a year — not to bin it.`,
      );

    const checked = Boolean(tread) || Boolean(dot);
    if (!checked) return { state: "empty", problems };
    if (problems.length === 0)
      return {
        state: "fine",
        problems,
        partial: !tread || !dot,
      };
    const urgent =
      tread?.status === "replace" || ageStatus === "replace" || dotLegacy;
    return { state: urgent ? "replace" : "soon", problems };
  }, [tread, dot, dotLegacy, ageStatus]);

  const tone = TONES[tread?.status ?? "fine"];

  return (
    <>
      <Seo
        title="Do I need new tires? Tread depth and tire age checker"
        description="Check your tread with a penny, a quarter or a gauge, decode the DOT date code on the sidewall, and get a straight answer on whether your tires need replacing — including when they do not."
      />
      <Breadcrumbs
        trail={[
          { label: "Tire Care", to: "/tire-care" },
          { label: "Do I need new tires?" },
        ]}
      />

      <PageHero
        eyebrow="Free tool"
        title="Do you actually need new tires yet?"
        lede="Every tire shop on earth will tell you the answer is yes. This one checks the two things that decide it — how much tread is left and how old the rubber is — and tells you plainly if the answer is no."
      >
        <p className="flex max-w-xl items-start gap-2.5 text-sm leading-relaxed text-bone/65">
          <ShieldCheck
            size={18}
            aria-hidden
            className="mt-0.5 shrink-0 text-volt"
          />
          Nothing here is stored, and if your tires are fine the page says so
          and stops. No countdown, no pitch.
        </p>
      </PageHero>

      {/* ---------------- Tread ---------------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="Step one"
          title="How much tread is left?"
          lede="Three ways in, depending on what you have to hand. Check three spots across each tire and use the shallowest reading — tires rarely wear evenly, and the worn edge is the one that decides."
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-8">
          <div className="card p-5 md:p-7">
            <fieldset>
              <legend className="label mb-2.5">What are you using?</legend>
              <div className="flex flex-col gap-2 sm:flex-row">
                <ChoiceButton
                  icon={Coins}
                  active={method === "coin"}
                  onClick={() => patch({ method: "coin" })}
                >
                  A coin
                </ChoiceButton>
                <ChoiceButton
                  icon={CircleGauge}
                  active={method === "gauge"}
                  onClick={() => patch({ method: "gauge" })}
                >
                  A depth gauge
                </ChoiceButton>
                <ChoiceButton
                  icon={Ruler}
                  active={method === "bars"}
                  onClick={() => patch({ method: "bars" })}
                >
                  The wear bars
                </ChoiceButton>
              </div>
            </fieldset>

            {method === "coin" && (
              <div className="mt-6">
                <fieldset className="mb-4">
                  <legend className="label mb-2.5">Which coin?</legend>
                  <div className="flex gap-2">
                    {Object.values(COINS).map((c) => (
                      <ChoiceButton
                        key={c.key}
                        active={coin === c.key}
                        onClick={() => patch({ coin: c.key })}
                      >
                        {c.label}
                      </ChoiceButton>
                    ))}
                  </div>
                </fieldset>

                <div className="overflow-hidden rounded-card border border-ink/[0.07]">
                  <CoinDiagram depth={sliderDepth} coin={coin} />
                </div>

                <label htmlFor="tread-slider" className="label mt-5">
                  Drag until the picture matches your tire
                </label>
                <input
                  id="tread-slider"
                  type="range"
                  min="0"
                  max={MAX_DEPTH}
                  step="0.5"
                  value={sliderDepth}
                  onChange={(e) => patch({ tread: e.target.value })}
                  aria-describedby="tread-slider-help"
                  className="h-6 w-full cursor-pointer accent-drop"
                />
                <div className="mt-1 flex justify-between text-[11px] font-semibold uppercase tracking-[0.07em] text-smoke">
                  <span>Coin sits on top</span>
                  <span>Coin sinks in deep</span>
                </div>
                <p
                  id="tread-slider-help"
                  className="mt-3 text-sm leading-relaxed text-smoke"
                >
                  Push the coin into a groove head-first, with{" "}
                  {COINS[coin].possessive} head pointing down. The tread hides
                  part of the portrait — drag the slider until the drawing shows
                  the same amount of head you can see on the tire.{" "}
                  {sliderDepth <= COINS[coin].headFrom32 ? (
                    <span className="text-ink">
                      Right now the top of the head is showing, or level with
                      the tread — which means you are at or below{" "}
                      {COINS[coin].headFrom32}/32&quot;.
                    </span>
                  ) : (
                    <span className="text-ink">
                      Right now the tread covers the top of the head, so you are
                      above {COINS[coin].headFrom32}/32&quot;.
                    </span>
                  )}
                </p>
              </div>
            )}

            {method === "gauge" && (
              <div className="mt-6">
                <label htmlFor="gauge-input" className="label">
                  Depth reading, in 32nds of an inch
                </label>
                <div className="flex max-w-xs items-center gap-3">
                  <input
                    id="gauge-input"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="32"
                    step="0.5"
                    value={gaugeRaw}
                    onChange={(e) => patch({ gauge: e.target.value })}
                    placeholder="6"
                    aria-invalid={gaugeUnreadable ? "true" : undefined}
                    aria-describedby={
                      gaugeUnreadable ? "gauge-error" : undefined
                    }
                    className={`field tnum max-w-[7rem] ${
                      gaugeUnreadable ? "border-drop" : ""
                    }`}
                  />
                  <span className="font-display text-lg font-bold text-smoke">
                    /32&quot;
                  </span>
                </div>
                {gaugeUnreadable && (
                  <p
                    id="gauge-error"
                    role="alert"
                    className="mt-2 text-sm leading-relaxed text-drop"
                  >
                    That is not a depth this page can use. A tread gauge reads
                    between 0 and 32 thirty-seconds of an inch — a new passenger
                    tire is around 10/32&quot;.
                  </p>
                )}
                <p className="mt-3 text-sm leading-relaxed text-smoke">
                  A pin-style gauge reads in 32nds straight off the barrel. Sit
                  the shoulders of the gauge flat on the tread blocks and push
                  the pin to the bottom of a main groove — not into a sipe, and
                  not on top of a wear bar, both of which will read shallow.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-smoke">
                  Some gauges read in millimetres. Divide the millimetre reading
                  by 0.79 to get 32nds — 4 mm is almost exactly 5/32&quot;.
                </p>
              </div>
            )}

            {method === "bars" && (
              <div className="mt-6">
                <div className="overflow-hidden rounded-card border border-ink/[0.07]">
                  <BarDiagram level={barLevel} />
                </div>
                <fieldset className="mt-5">
                  <legend className="label mb-2.5">
                    What do the bars look like?
                  </legend>
                  <div className="space-y-2">
                    {Object.values(BAR_LEVELS).map((l) => (
                      <label
                        key={l.key}
                        className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-sm border px-3.5 py-2.5 text-sm leading-snug transition-colors ${
                          barLevel === l.key
                            ? "border-drop bg-sky text-ink"
                            : "border-ink/[0.12] bg-bone text-smoke hover:border-ink/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="bars"
                          value={l.key}
                          checked={barLevel === l.key}
                          onChange={() => patch({ bars: l.key })}
                          className="accent-drop"
                        />
                        {l.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <p className="mt-4 text-sm leading-relaxed text-smoke">
                  Tread wear indicators are short raised bars molded across the
                  bottom of the main grooves, every few inches around the tire.
                  Look for the small triangle, TWI mark or brand logo on the
                  shoulder — it points at the nearest one.
                </p>
              </div>
            )}
          </div>

          {/* Tread result */}
          <div
            className={`card h-fit border-l-4 p-5 md:p-6 ${
              tread ? tone.border : "border-l-ink/15"
            }`}
            aria-live="polite"
          >
            {!tread && (
              <>
                <p className="label mb-2">Your reading</p>
                <p className="text-sm leading-relaxed text-smoke">
                  {method === "bars"
                    ? BAR_LEVELS[barLevel].note
                    : method === "gauge"
                      ? gaugeUnreadable
                        ? "Correct the reading above and the verdict appears here."
                        : "Type what the gauge says and the verdict appears here."
                      : "Drag the slider to match your tire and the verdict appears here."}
                </p>
                {method === "bars" && (
                  <Link
                    to="?method=coin"
                    onClick={(e) => {
                      e.preventDefault();
                      patch({ method: "coin" });
                    }}
                    className="btn btn-outline btn-sm mt-4"
                  >
                    Use a coin instead
                    <ArrowRight size={15} aria-hidden />
                  </Link>
                )}
              </>
            )}

            {tread && (
              <>
                <div className="mb-4 flex items-center gap-2.5">
                  <tone.Icon size={20} aria-hidden className={tone.text} />
                  <Badge tone={tone.badge}>
                    {tread.status === "fine"
                      ? "Plenty left"
                      : tread.status === "soon"
                        ? "Getting low"
                        : "Replace now"}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <Figure
                    label="Tread depth"
                    value={`${fmt32(tread.depth)}/32"`}
                    sub={
                      reading.precision === "measured"
                        ? "Measured"
                        : reading.precision === "estimated"
                          ? "Estimated"
                          : "Indicative only"
                    }
                  />
                  <Figure
                    label="Usable life left"
                    value={`${Math.round(tread.lifeLeftPct)}%`}
                    sub={`Measured against the ${TREAD.legal}/32" legal limit, not against zero. The last ${TREAD.legal}/32" is not yours to use.`}
                  />
                </div>

                <div
                  aria-hidden
                  className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-ink/10"
                >
                  <div
                    className={`h-full rounded-full ${tone.bar}`}
                    style={{
                      width: `${Math.max(2, Math.round(tread.lifeLeftPct))}%`,
                    }}
                  />
                </div>

                <p className="mt-4 text-sm leading-relaxed text-smoke">
                  {tread.status === "fine" &&
                    `That is healthy tread. Nothing here says replace, and nothing here says buy. Check again in a few months, or sooner if you are about to drive a long way in the wet.`}
                  {tread.status === "soon" &&
                    `Still legal, but this is the band where rain starts to matter: below ${TREAD.wetRisk}/32" the grooves cannot clear enough water and wet stopping distances climb sharply. Hydroplaning starts here too. Worth planning the replacement rather than waiting.`}
                  {tread.status === "replace" &&
                    `At or below ${TREAD.legal}/32" the tire is legally worn out in most US states, and the wet performance went long before the legality did. This one is done.`}
                </p>

                <p className="mt-3 border-t border-ink/10 pt-3 text-[13px] leading-relaxed text-smoke">
                  {reading.note}
                </p>

                <label htmlFor="new-depth" className="label mt-5">
                  Compare the percentage against
                </label>
                <select
                  id="new-depth"
                  value={newDepth}
                  onChange={(e) => patch({ nd: e.target.value })}
                  className="field min-h-[44px]"
                >
                  {NEW_DEPTHS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[13px] leading-relaxed text-smoke">
                  This only changes the percentage, never the verdict. Most
                  passenger tires leave the factory at 10–11/32&quot;; truck and
                  winter tires start deeper, so pick the closest match or a new
                  winter tire will read under 100%.
                </p>
              </>
            )}
          </div>
        </div>
      </Section>

      {/* ---------------- Age ---------------- */}
      <Section>
        <SectionHead
          eyebrow="Step two"
          title="How old is the rubber?"
          lede="Tread wears; rubber ages on its own schedule. The DOT code stamped on the sidewall is the only honest answer to how old a tire is — the day you bought it is not the day it was built."
        />

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="card p-5 md:p-7">
            <label htmlFor="dot-input" className="label">
              The last four digits of the DOT code
            </label>
            <input
              id="dot-input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={dotRaw}
              onChange={(e) => patch({ dot: e.target.value })}
              placeholder="3421"
              aria-describedby="dot-help"
              className="field tnum max-w-[12rem] text-lg tracking-[0.12em]"
            />
            <p
              id="dot-help"
              className="mt-3 text-sm leading-relaxed text-smoke"
            >
              Paste the whole serial if it is easier — only the last four digits
              carry the date. The first two are the week, the last two are the
              year: <span className="text-ink tnum">3421</span> is the 34th week
              of 2021.
            </p>

            <div className="mt-6 overflow-hidden rounded-card">
              <SidewallDiagram />
            </div>

            <h3 className="h3 mt-6 text-[1.05rem] md:text-[1.15rem]">
              Where to find it
            </h3>
            <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-smoke">
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-ink font-display text-[13px] text-amber"
                >
                  1
                </span>
                Look on the sidewall for the letters DOT, followed by a run of
                letters and numbers. It is molded in, the same colour as the
                tire, so it is easier to feel than to see.
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-ink font-display text-[13px] text-amber"
                >
                  2
                </span>
                <span>
                  <span className="text-ink">
                    This is where everyone gets stuck:
                  </span>{" "}
                  the full code with the date on the end is normally only
                  stamped on one side of the tire. If the side facing you ends
                  after the plant and size codes, the date is on the inboard
                  face — look from under the car, or turn the wheel to full lock
                  to see the inside of a front tire.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-ink font-display text-[13px] text-amber"
                >
                  3
                </span>
                Four digits inside a small oval, right at the end. Three digits
                instead of four means the tire was built before 2000.
              </li>
            </ol>
          </div>

          <div
            className="card h-fit border-l-4 border-l-ink/15 p-5 md:p-6"
            aria-live="polite"
          >
            {!dotRaw.trim() && (
              <>
                <p className="label mb-2">Age check</p>
                <p className="text-sm leading-relaxed text-smoke">
                  Type the four digits and this will tell you the week the tire
                  was built, how old it is now, and what that means.
                </p>
              </>
            )}

            {dotUnreadable && (
              <>
                <div className="mb-3 flex items-center gap-2.5">
                  <Info size={20} aria-hidden className="text-ink" />
                  <Badge tone="soft">Can&apos;t read that</Badge>
                </div>
                <p className="text-sm leading-relaxed text-smoke">
                  That is not a date code this page can decode. It needs four
                  digits where the first two are a week from 01 to 53 — so{" "}
                  <span className="tnum text-ink">0624</span> works and{" "}
                  <span className="tnum text-ink">6024</span> cannot, because
                  there is no 60th week. Check you have the last four digits of
                  the DOT serial rather than the load index or the size.
                </p>
              </>
            )}

            {dotLegacy && (
              <>
                <div className="mb-3 flex items-center gap-2.5">
                  <AlertTriangle size={20} aria-hidden className="text-ink" />
                  <Badge tone="ink">Pre-2000 tire</Badge>
                </div>
                <p className="text-sm leading-relaxed text-smoke">
                  Three digits means the tire was built before 2000, when the
                  code did not carry a decade. Which year stopped mattering a
                  long time ago: that tire is at least twenty-five years old and
                  belongs off the car whatever the tread looks like — including
                  if it is the spare that has never touched the road.
                </p>
              </>
            )}

            {dot && !dot.legacy && (
              <>
                <div className="mb-4 flex items-center gap-2.5">
                  <CalendarClock
                    size={20}
                    aria-hidden
                    className={
                      dot.status === "fine"
                        ? "text-drop"
                        : dot.status === "inspect"
                          ? "text-amberInk"
                          : "text-ink"
                    }
                  />
                  <Badge
                    tone={
                      dot.status === "fine"
                        ? "drop"
                        : dot.status === "inspect"
                          ? "amber"
                          : "ink"
                    }
                  >
                    {dot.status === "fine"
                      ? "Age is fine"
                      : dot.status === "inspect"
                        ? "Worth inspecting"
                        : "Past the guidance"}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <Figure
                    label="Built"
                    value={`Week ${dot.week}, ${dot.year}`}
                    sub={`Around ${dot.built.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}. Week 1 is taken as the first week of January, so this is accurate to a few days.`}
                  />
                  <Figure
                    label="Age today"
                    value={`${dot.ageYears.toFixed(1)} years`}
                  />
                </div>

                <p className="mt-4 text-sm leading-relaxed text-smoke">
                  {dot.status === "fine" &&
                    "Comfortably inside the window every manufacturer works to. Age is not your problem on this tire."}
                  {dot.status === "inspect" &&
                    "Past six years, most manufacturers ask for a professional inspection once a year — for cracking between the tread blocks, in the grooves and around the sidewall. That is an inspection, not a sentence."}
                  {dot.status === "replace" &&
                    "Past ten years, most manufacturers say replace regardless of tread, and several vehicle makers say the same. The rubber has been curing the whole time."}
                </p>

                <p className="mt-3 border-t border-ink/10 pt-3 text-[13px] leading-relaxed text-smoke">
                  Six and ten years are manufacturer guidance, not law — no US
                  state puts an age limit on a passenger tire. Rubber ages
                  whether the tire is driven or parked, which is why a spare
                  with full tread can still be past it, and heat and sun move it
                  along faster than a garage does.
                </p>
              </>
            )}
          </div>
        </div>
      </Section>

      {/* ---------------- Verdict ---------------- */}
      <Section className="bg-bone">
        <SectionHead eyebrow="The answer" title="So — do you need tires?" />

        <div aria-live="polite">
          {verdict.state === "empty" && (
            <div className="card p-6 md:p-8">
              <p className="text-[1.0625rem] leading-relaxed text-smoke">
                Fill in either check above — the tread, the date code, or both —
                and the answer lands here. Both together is the complete
                picture: a tire can fail on tread with plenty of age left, or on
                age with plenty of tread left.
              </p>
            </div>
          )}

          {verdict.state === "fine" && (
            <div className="card border-l-4 border-l-drop bg-sky/60 p-6 md:p-8">
              <div className="mb-4 flex items-center gap-2.5">
                <CheckCircle2 size={22} aria-hidden className="text-drop" />
                <Badge tone="drop">No action needed</Badge>
              </div>
              <h3 className="h2 text-[1.6rem] md:text-[2.1rem]">
                Your tires are fine. Come back in six months.
              </h3>
              <p className="mt-4 max-w-2xl text-[1.0625rem] leading-relaxed text-smoke">
                {verdict.partial
                  ? "Everything you gave us checks out. The other half of the check takes a minute and is worth doing — a tire can be fine on tread and finished on age, or the other way round."
                  : "Tread is healthy and the rubber is well inside its window. Nothing to buy today. Keep an eye on pressures, rotate every 5,000 to 7,500 miles, and check again in six months or before a long trip."}
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-smoke">
                That is the whole answer. There is no offer under this
                paragraph.
              </p>

              {/* The page answers two questions and must not be read as
                  answering a third. It never sees a sidewall bulge, a cut, a
                  previous repair, a separated belt or uneven wear from an
                  alignment — every one of which can finish a tire that has
                  plenty of tread and no age on it. Saying so is the
                  difference between a useful tool and a safety claim we are
                  not in a position to make. */}
              <p className="mt-6 max-w-2xl border-t border-ink/10 pt-4 text-[13px] leading-relaxed text-smoke">
                One thing this cannot do: it reads tread depth and date code,
                and nothing else. It has not seen a bulge or a cut in your
                sidewall, an old repair, a belt starting to separate, or wear
                running unevenly across the tread — any of which can finish a
                tire that still measures fine here. If something looks wrong, or
                the car pulls, shakes or sits oddly, have someone look at it
                properly.
              </p>
            </div>
          )}

          {(verdict.state === "soon" || verdict.state === "replace") && (
            <div
              className={
                verdict.state === "replace"
                  ? "card overflow-hidden border-none bg-ink bg-ink-wash p-6 text-bone md:p-8"
                  : "card border-l-4 border-l-amber p-6 md:p-8"
              }
            >
              <div className="mb-4 flex items-center gap-2.5">
                <AlertTriangle
                  size={22}
                  aria-hidden
                  className={
                    verdict.state === "replace" ? "text-amber" : "text-amberInk"
                  }
                />
                <Badge tone="amber">
                  {verdict.state === "replace"
                    ? "Replace these"
                    : "Start planning"}
                </Badge>
              </div>
              <h3
                className={`h2 text-[1.6rem] md:text-[2.1rem] ${
                  verdict.state === "replace" ? "text-bone" : ""
                }`}
              >
                {verdict.state === "replace"
                  ? "Yes — these need replacing."
                  : "Not yet, but it is on the horizon."}
              </h3>
              <ul
                className={`mt-5 max-w-2xl space-y-3 text-[1.0625rem] leading-relaxed ${
                  verdict.state === "replace" ? "text-bone/75" : "text-smoke"
                }`}
              >
                {verdict.problems.map((p) => (
                  <li key={p} className="flex gap-3">
                    <span
                      aria-hidden
                      className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                        verdict.state === "replace" ? "bg-amber" : "bg-amberInk"
                      }`}
                    />
                    {p}
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  to={shopHref}
                  className={
                    verdict.state === "replace"
                      ? "btn btn-primary"
                      : "btn btn-dark"
                  }
                >
                  {size ? `Shop ${size.normalized}` : "Shop tires"}
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <a
                  href={BUSINESS.phoneHref}
                  className={
                    verdict.state === "replace"
                      ? "btn btn-ghost-light"
                      : "btn btn-outline"
                  }
                >
                  <Phone size={16} aria-hidden />
                  Free inspection · {BUSINESS.phone}
                </a>
              </div>
              <p
                className={`mt-4 max-w-2xl text-sm leading-relaxed ${
                  verdict.state === "replace" ? "text-bone/60" : "text-smoke"
                }`}
              >
                Not near us? The numbers above are yours to take anywhere — we
                would rather you bought the right tire somewhere else than the
                wrong one here. If you are in South Florida,{" "}
                {BUSINESS.shop.name} will put it on a lift and look properly, at
                no charge.
              </p>
            </div>
          )}
        </div>

        {/* Size carry-through */}
        <div className="card mt-6 p-5 md:p-6">
          <div className="flex items-start gap-3">
            <Search
              size={20}
              aria-hidden
              className="mt-0.5 shrink-0 text-drop"
            />
            <div className="w-full">
              <h3 className="h3 text-[1.05rem] md:text-[1.15rem]">
                Know your size? Carry it through.
              </h3>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-smoke">
                It is on the sidewall in the form 215/60R16, and on the placard
                inside the driver&apos;s door. Enter it and every link on this
                page points at your size — including if you bookmark or share
                this result.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="w-full sm:max-w-[16rem]">
                  <label htmlFor="size-input" className="label">
                    Your tire size
                  </label>
                  <input
                    id="size-input"
                    type="text"
                    autoComplete="off"
                    value={sizeRaw}
                    onChange={(e) => patch({ size: e.target.value })}
                    placeholder="215/60R16"
                    className="field"
                  />
                </div>
                {size && (
                  <Link
                    to={shopHref}
                    className="btn btn-outline btn-sm min-h-[44px]"
                  >
                    See {size.normalized} in stock
                    <ArrowRight size={15} aria-hidden />
                  </Link>
                )}
              </div>

              <p
                className="mt-3 text-[13px] leading-relaxed text-smoke"
                aria-live="polite"
              >
                {sizeUnreadable
                  ? "That does not read as a tire size yet. It looks like 215/60R16, P205/55R16 91V or 31x10.50R15."
                  : size
                    ? size.format === "flotation"
                      ? `Read as ${size.normalized} — a flotation size, so the shop link filters on the ${size.rimDiameter}" rim.`
                      : `Read as ${size.normalized}${size.speedRating ? `, speed rating ${size.speedRating}` : ""}. Our catalog is a representative range rather than live distributor inventory, so if your size is not listed, call — the distributor list runs deeper than this page.`
                    : "Optional. Everything above works without it."}
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------------- FAQ ---------------- */}
      <Section>
        <SectionHead
          eyebrow="Questions"
          title="The things people ask next"
          lede="Short answers, including the ones that mean you do not need to buy anything."
        />
        <Accordion items={FAQ} />
      </Section>
    </>
  );
}
