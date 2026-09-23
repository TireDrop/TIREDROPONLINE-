import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Copy,
  Gauge,
  Info,
  Repeat,
  Ruler,
  Search,
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
import ProductCard from "../../components/shop/ProductCard.jsx";
import { BUSINESS } from "../../data/business.js";
import { TIRES } from "../../data/products.js";
import { compareSizes, parseSize, sizeGeometry } from "../../data/tireMath.js";

/* ------------------------------------------------------------------ *
 * Lookup tables
 * ------------------------------------------------------------------ */

/**
 * Load index → maximum load in kilograms, the ETRTO table every
 * manufacturer publishes. Pounds are converted from these rather than
 * transcribed, so the two columns can never drift apart.
 *
 * Only 71–126 is listed — the range that covers passenger cars, crossovers
 * and light trucks. Anything outside it is a commercial or specialty
 * fitment, and the tool says so instead of guessing.
 */
const LOAD_INDEX_KG = {
  71: 345,
  72: 355,
  73: 365,
  74: 375,
  75: 387,
  76: 400,
  77: 412,
  78: 425,
  79: 437,
  80: 450,
  81: 462,
  82: 475,
  83: 487,
  84: 500,
  85: 515,
  86: 530,
  87: 545,
  88: 560,
  89: 580,
  90: 600,
  91: 615,
  92: 630,
  93: 650,
  94: 670,
  95: 690,
  96: 710,
  97: 730,
  98: 750,
  99: 775,
  100: 800,
  101: 825,
  102: 850,
  103: 875,
  104: 900,
  105: 925,
  106: 950,
  107: 975,
  108: 1000,
  109: 1030,
  110: 1060,
  111: 1090,
  112: 1120,
  113: 1150,
  114: 1180,
  115: 1215,
  116: 1250,
  117: 1285,
  118: 1320,
  119: 1360,
  120: 1400,
  121: 1450,
  122: 1500,
  123: 1550,
  124: 1600,
  125: 1650,
  126: 1700,
};

const LBS_PER_KG = 2.20462;

/** Max load in pounds for a load index, or null if it is outside the table. */
function loadPounds(index) {
  const kg = LOAD_INDEX_KG[Number(index)];
  return kg ? Math.round(kg * LBS_PER_KG) : null;
}

/**
 * Speed rating → the speed the tire is certified to, in mph. These are the
 * published conversions of the metric ratings (H is 210 km/h, V is 240, and
 * so on), rounded the way the US industry prints them.
 */
const SPEED_RATINGS = {
  L: { mph: 75, note: "Off-road and light-truck fitments." },
  M: { mph: 81, note: "Temporary spares." },
  N: { mph: 87, note: "Temporary spares." },
  P: { mph: 93, note: "Older light-truck fitments." },
  Q: { mph: 99, note: "Studless and studdable winter tires." },
  R: { mph: 106, note: "Heavy-duty light-truck tires." },
  S: { mph: 112, note: "Family sedans and vans." },
  T: { mph: 118, note: "Family sedans, vans and crossovers." },
  U: { mph: 124, note: "Sedans and coupes." },
  H: { mph: 130, note: "Sport sedans and most touring tires." },
  V: { mph: 149, note: "Sports cars and performance sedans." },
  W: { mph: 168, note: "Exotics and high-performance cars." },
  Y: { mph: 186, note: "Exotics." },
  Z: { mph: null, note: "An open-ended older marking — 149 mph and up." },
};

const CONSTRUCTION = {
  R: "Radial. The body plies run straight across the tire from bead to bead under a steel belt. Effectively every road tire sold today is a radial.",
  D: "Bias ply — sometimes marked with a dash instead of a letter. The plies run diagonally. You still see this on trailer tires, classics and some off-road tires, never on a modern passenger car.",
  B: "Belted bias. Bias plies with a belt laid over them. Rare outside trailer and vintage fitments.",
};

const SERVICE_TYPE = {
  P: "P is P-metric: designed and load-rated for passenger cars, including most crossovers.",
  LT: "LT is light truck: a heavier carcass built to run at higher pressures and carry more weight. An LT tire is not interchangeable with a P tire of the same size — it has a different load rating and usually a stiffer ride.",
  ST: "ST is special trailer: for trailer axles only. Never fit an ST tire to a driven or steered axle.",
};

const EXAMPLES = [
  "215/60R16 95H",
  "225/45ZR17",
  "265/70R17 121S",
  "31x10.50R15",
];

/* ------------------------------------------------------------------ *
 * Formatting helpers
 * ------------------------------------------------------------------ */

const inches = (n, d = 2) => `${n.toFixed(d)} in`;
const mm = (n) => `${Math.round(n)} mm`;
const commas = (n) => Math.round(n).toLocaleString("en-US");
const signed = (n, d = 1) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(d)}`;

/* ------------------------------------------------------------------ *
 * Decoding the marking into labelled parts
 * ------------------------------------------------------------------ */

/**
 * Colours are assigned per role, not per part, so the chip, the diagram
 * callout and the explanation card always agree. Every one of these is used
 * on a dark surface only — `volt` and `amber` are 8.2:1 and 9.5:1 on ink,
 * and neither is ever printed on white.
 */
const ROLE_COLOR = {
  width: "#00B4FC",
  sidewall: "#F5A623",
  overall: "#F5A623",
  construction: "#9FB3CC",
  rim: "#E9F2FF",
  load: "#FFFFFF",
  speed: "#FFFFFF",
};

/**
 * Turns a decoded size into the ordered list of marking parts. The order is
 * reading order, so the numbers on the diagram run the same way your eye
 * runs along the sidewall.
 *
 * `lines` is the plain-English explanation; `short` is the one-line version
 * the diagram has room for.
 */
function decodeParts(geo) {
  const parts = [];

  if (geo.format === "flotation") {
    parts.push({
      role: "overall",
      token: String(geo.flotationDiameter),
      title: "Overall diameter",
      short: `${geo.flotationDiameter} in tall`,
      lines: [
        `${geo.flotationDiameter} means the tire stands ${geo.flotationDiameter} inches tall, stated outright.`,
        "Flotation sizes skip the aspect ratio entirely — the first number is the diameter, not a width. That is why a 33-inch tire is called a 33.",
      ],
    });
    parts.push({
      role: "width",
      token: String(geo.widthIn),
      title: "Section width",
      short: `${geo.widthIn} in · ${mm(geo.width)}`,
      lines: [
        `${geo.widthIn} is the width across the tire in inches — ${mm(geo.width)} if you prefer metric.`,
        "Measured sidewall to sidewall on a mounted, inflated tire, not across the tread blocks.",
      ],
    });
  } else {
    parts.push({
      role: "width",
      token: String(geo.width),
      title: "Section width",
      short: `${geo.width} mm · ${geo.sectionWidthIn.toFixed(1)} in`,
      lines: [
        `${geo.width} is the width in millimetres — ${inches(geo.sectionWidthIn, 1)} across.`,
        "It is measured sidewall to sidewall on a mounted, inflated tire, so the tread itself is usually a little narrower than this number.",
      ],
    });
    parts.push({
      role: "sidewall",
      token: String(geo.aspect),
      title: "Aspect ratio",
      short: `${geo.aspect}% → ${mm(geo.sidewallMm)} of sidewall`,
      lines: [
        `${geo.aspect} means the sidewall is ${geo.aspect}% of the tread width — so ${mm(geo.sidewallMm)} tall, or ${inches(geo.sidewallIn)}.`,
        "It is a ratio, not a measurement. The same 60 on a wider tire gives you a taller sidewall, which is why two 60-series tires can be completely different heights.",
      ],
    });
  }

  parts.push({
    role: "construction",
    token: geo.construction,
    title: "Construction",
    short:
      geo.construction === "R" ? "R — radial" : `${geo.construction} — bias`,
    lines: [
      CONSTRUCTION[geo.construction] ??
        "An unusual construction letter. Check the tire's spec sheet.",
    ],
  });

  parts.push({
    role: "rim",
    token: String(geo.rimDiameter),
    title: "Wheel diameter",
    short: `${geo.rimDiameter} in bead to bead`,
    lines: [
      `This tire fits a ${geo.rimDiameter}-inch wheel, measured bead seat to bead seat — not the outside edge of the rim.`,
      "This is the one number with no tolerance at all. A 16-inch tire does not go on a 17-inch wheel, at any price.",
    ],
  });

  if (geo.loadIndex) {
    const lbs = loadPounds(geo.loadIndex);
    parts.push({
      role: "load",
      token: String(geo.loadIndex),
      title: "Load index",
      short: lbs ? `${commas(lbs)} lbs per tire` : "outside our table",
      lines: lbs
        ? [
            `Load index ${geo.loadIndex} carries ${commas(lbs)} lbs at its rated pressure — ${commas(lbs * 4)} lbs across four tires.`,
            "Match or beat the index on your door placard. A lower one is not a saving, it is a smaller tire carrying your car.",
          ]
        : [
            `Index ${geo.loadIndex} sits outside the 71–126 table we publish here, so we are not going to put a pounds figure on it.`,
            "The exact rating is printed on the tire's spec sheet and stamped on the sidewall itself.",
          ],
    });
  }

  if (geo.speedRating) {
    const sr = SPEED_RATINGS[geo.speedRating];
    parts.push({
      role: "speed",
      token: geo.speedRating,
      title: "Speed rating",
      short: sr?.mph ? `up to ${sr.mph} mph` : "149 mph and up",
      lines: sr
        ? [
            sr.mph
              ? `${geo.speedRating} is certified to ${sr.mph} mph. ${sr.note}`
              : `${geo.speedRating} is an open-ended marking from before the W and Y ratings existed: 149 mph and above. If there is a W or a Y next to it, that letter is the real ceiling.`,
            "The rating describes how the tire sheds heat at sustained speed. It is a limit, not an invitation.",
          ]
        : [
            `${geo.speedRating} is not in our table. The certified speed is on the tire's spec sheet.`,
          ],
    });
  }

  return parts.map((p, i) => ({ ...p, n: i + 1, color: ROLE_COLOR[p.role] }));
}

/* ------------------------------------------------------------------ *
 * The sidewall diagram
 * ------------------------------------------------------------------ */

/**
 * Everything the drawing needs, in viewBox units, derived from the real
 * geometry — so a 33-inch tire really is drawn taller than a 24-inch one,
 * and a 285 really is drawn wider than a 205.
 */
function diagramGeometry(geo, labelled) {
  const tireH = labelled ? 300 : 244;
  const padY = labelled ? 38 : 20;
  const width = labelled ? 660 : 260;
  const cx = labelled ? 292 : 130;
  const cy = padY + tireH / 2;
  const k = tireH / geo.overallDiameter;
  const R = tireH / 2;
  const rr = (geo.rimDiameter * k) / 2;
  const hw = (geo.sectionWidthIn * k) / 2;

  return {
    width,
    height: tireH + padY * 2,
    cx,
    cy,
    R,
    rr,
    hw,
    rimHw: hw * 0.8,
    top: cy - R,
    bot: cy + R,
    bead: cy - rr,
    beadBot: cy + rr,
    midUp: (cy - R + (cy - rr)) / 2,
    midLo: (cy + rr + (cy + R)) / 2,
    sectionH: R - rr,
  };
}

/** The upper half of the cut: tread across the top, sidewalls down to the bead. */
function tireBodyPath(d) {
  const { cx, hw, rimHw, top, bead, midUp } = d;
  const h = bead - top;
  return [
    `M ${cx - rimHw} ${bead}`,
    `C ${cx - hw * 0.99} ${bead - h * 0.05} ${cx - hw} ${midUp + h * 0.24} ${cx - hw} ${midUp}`,
    `C ${cx - hw} ${midUp - h * 0.26} ${cx - hw * 0.99} ${top + h * 0.2} ${cx - hw * 0.86} ${top + h * 0.05}`,
    `Q ${cx - hw * 0.8} ${top} ${cx - hw * 0.7} ${top}`,
    `L ${cx + hw * 0.7} ${top}`,
    `Q ${cx + hw * 0.8} ${top} ${cx + hw * 0.86} ${top + h * 0.05}`,
    `C ${cx + hw * 0.99} ${top + h * 0.2} ${cx + hw} ${midUp - h * 0.26} ${cx + hw} ${midUp}`,
    `C ${cx + hw} ${midUp + h * 0.24} ${cx + hw * 0.99} ${bead - h * 0.05} ${cx + rimHw} ${bead}`,
    "Z",
  ].join(" ");
}

/** A dimension line with a tick and an arrowhead at each end. */
function Dim({ x1, y1, x2, y2, color }) {
  const vertical = Math.abs(x2 - x1) < 0.01;
  const a = 5.5;
  const t = 6;
  const heads = vertical
    ? [
        `M ${x1} ${y1} l ${-a * 0.6} ${a} l ${a * 1.2} 0 Z`,
        `M ${x2} ${y2} l ${-a * 0.6} ${-a} l ${a * 1.2} 0 Z`,
      ]
    : [
        `M ${x1} ${y1} l ${a} ${-a * 0.6} l 0 ${a * 1.2} Z`,
        `M ${x2} ${y2} l ${-a} ${-a * 0.6} l 0 ${a * 1.2} Z`,
      ];
  return (
    <g stroke={color} fill={color}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1.4" />
      {heads.map((dpath) => (
        <path key={dpath} d={dpath} stroke="none" />
      ))}
      {vertical ? (
        <>
          <line x1={x1 - t} y1={y1} x2={x1 + t} y2={y1} strokeWidth="1.4" />
          <line x1={x2 - t} y1={y2} x2={x2 + t} y2={y2} strokeWidth="1.4" />
        </>
      ) : (
        <>
          <line x1={x1} y1={y1 - t} x2={x1} y2={y1 + t} strokeWidth="1.4" />
          <line x1={x2} y1={y2 - t} x2={x2} y2={y2 + t} strokeWidth="1.4" />
        </>
      )}
    </g>
  );
}

function Leader({ points, color, dotted }) {
  return (
    <polyline
      points={points.map((p) => p.join(",")).join(" ")}
      fill="none"
      stroke={color}
      strokeWidth="1.1"
      strokeLinejoin="round"
      strokeDasharray={dotted ? "3 3" : undefined}
      opacity="0.8"
    />
  );
}

function CalloutBadge({ x, y, n, color, r }) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={r}
        fill="#070E1A"
        stroke={color}
        strokeWidth="1.6"
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={r * 1.18}
        fontWeight="800"
        className="font-display"
      >
        {n}
      </text>
    </g>
  );
}

/** Where each role's callout sits in the wide, labelled version. */
const LABEL_SLOT = {
  width: { side: "left", y: 76 },
  rim: { side: "left", y: 200 },
  load: { side: "left", y: 318 },
  sidewall: { side: "right", y: 76 },
  overall: { side: "right", y: 76 },
  construction: { side: "right", y: 196 },
  speed: { side: "right", y: 318 },
};

/**
 * The centrepiece: a cut through the tire and wheel, drawn from the size you
 * typed. Two versions exist rather than one that shrinks — on a phone the
 * drawing keeps its size and the labels move out into the numbered list
 * underneath it.
 */
function SidewallDiagram({ geo, parts, labelled }) {
  const d = diagramGeometry(geo, labelled);
  const id = labelled ? "wide" : "compact";
  const badgeR = labelled ? 11 : 12;
  const grooveH = Math.max(2, (d.bead - d.top) * 0.16);
  const flangeH = Math.max(3.5, d.rr * 0.09);

  // Anchors: the point on the drawing each callout is talking about.
  const anchorFor = (role) => {
    switch (role) {
      case "width":
        return [d.cx - d.hw, d.midUp];
      case "sidewall":
      case "overall":
        return [
          d.cx + d.hw + 14,
          role === "overall" ? d.cy - d.R * 0.5 : d.midUp,
        ];
      case "rim":
        return [d.cx - d.rimHw * 0.8, d.cy];
      case "construction":
        return [d.cx + d.hw * 0.9, d.bead - d.sectionH * 0.35];
      case "load":
        return [d.cx - d.hw * 0.88, d.midLo];
      case "speed":
        return [d.cx + d.hw * 0.88, d.midLo];
      default:
        return [d.cx, d.cy];
    }
  };

  const leftBadgeX = labelled ? 198 : d.cx - d.hw - 34;
  const rightBadgeX = labelled ? 394 : d.cx + d.hw + 34;

  // Without room for text, the compact version parks each callout at a fixed
  // height on its side so two badges can never land on top of each other.
  const compactY = (role) => {
    switch (role) {
      case "width":
      case "sidewall":
      case "overall":
        return d.midUp;
      case "rim":
        return d.cy;
      case "construction":
        return d.cy - d.rr * 0.55;
      default:
        return d.midLo;
    }
  };

  return (
    <svg
      viewBox={`0 0 ${d.width} ${d.height}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Cross-section of a ${geo.normalized} tire with its section width, sidewall height and wheel diameter marked. Each numbered callout is explained in the list below.`}
    >
      <defs>
        <linearGradient id={`rubber-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22344C" />
          <stop offset="100%" stopColor="#0B1524" />
        </linearGradient>
        <linearGradient id={`rim-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2C3F58" />
          <stop offset="45%" stopColor="#4C6081" />
          <stop offset="100%" stopColor="#24354C" />
        </linearGradient>
      </defs>

      {/* ---- the wheel, cut the same way: two rim bands joined by the disc ---- */}
      <g>
        {[false, true].map((flip) => (
          <g
            key={flip ? "rim-lower" : "rim-upper"}
            transform={
              flip ? `translate(0 ${2 * d.cy}) scale(1 -1)` : undefined
            }
          >
            <rect
              x={d.cx - d.rimHw}
              y={d.bead}
              width={d.rimHw * 2}
              height={flangeH}
              fill={`url(#rim-${id})`}
            />
            {[d.cx - d.rimHw, d.cx + d.rimHw - flangeH * 0.85].map((fx) => (
              <rect
                key={fx}
                x={fx}
                y={d.bead - flangeH * 0.5}
                width={flangeH * 0.85}
                height={flangeH * 1.55}
                rx={flangeH * 0.3}
                fill="#6B819F"
              />
            ))}
          </g>
        ))}
        {/* the wheel itself, seen edge on: a narrow barrel opening out into
            the centre boss, with the hub bore at the axle */}
        <rect
          x={d.cx - Math.max(3, d.rimHw * 0.2)}
          y={d.bead}
          width={Math.max(6, d.rimHw * 0.4)}
          height={d.rr * 2}
          fill="#2B3E58"
        />
        <rect
          x={d.cx - d.rimHw * 0.46}
          y={d.cy - d.rr * 0.34}
          width={d.rimHw * 0.92}
          height={d.rr * 0.68}
          rx={Math.max(2, d.rimHw * 0.12)}
          fill="#374D69"
        />
        {[-1, 1].map((sgn) => (
          <circle
            key={sgn}
            cx={d.cx}
            cy={d.cy + sgn * d.rr * 0.2}
            r={Math.max(1.6, d.rimHw * 0.075)}
            fill="#0A1322"
          />
        ))}
        <circle
          cx={d.cx}
          cy={d.cy}
          r={d.rimHw * 0.3}
          fill="#22344C"
          stroke="#8296B0"
          strokeWidth="1.2"
        />
      </g>

      {/* ---- the rubber: upper section, then the same shape mirrored ---- */}
      {[false, true].map((flip) => (
        <g
          key={flip ? "lower" : "upper"}
          transform={flip ? `translate(0 ${2 * d.cy}) scale(1 -1)` : undefined}
        >
          <path
            d={tireBodyPath(d)}
            fill={`url(#rubber-${id})`}
            stroke="#5C6E88"
            strokeWidth="1"
          />
          <line
            x1={d.cx - d.hw * 0.84}
            y1={d.top + (d.bead - d.top) * 0.26}
            x2={d.cx + d.hw * 0.84}
            y2={d.top + (d.bead - d.top) * 0.26}
            stroke="#7E93B0"
            strokeWidth="1"
            strokeOpacity="0.5"
          />
          {[-0.44, -0.15, 0.15, 0.44].map((f) => (
            <rect
              key={f}
              x={d.cx + f * d.hw - 1.8}
              y={d.top + 0.6}
              width="3.6"
              height={grooveH}
              rx="1.6"
              fill="#060D18"
              opacity="0.85"
            />
          ))}
        </g>
      ))}

      {/* ---- dimension arrows ---- */}
      {parts.map((p) => {
        const c = p.color;
        if (p.role === "width") {
          return (
            <Dim
              key={p.role}
              x1={d.cx - d.hw}
              y1={d.midUp}
              x2={d.cx + d.hw}
              y2={d.midUp}
              color={c}
            />
          );
        }
        if (p.role === "sidewall") {
          return (
            <Dim
              key={p.role}
              x1={d.cx + d.hw + 14}
              y1={d.top}
              x2={d.cx + d.hw + 14}
              y2={d.bead}
              color={c}
            />
          );
        }
        if (p.role === "overall") {
          return (
            <Dim
              key={p.role}
              x1={d.cx + d.hw + 14}
              y1={d.top}
              x2={d.cx + d.hw + 14}
              y2={d.bot}
              color={c}
            />
          );
        }
        if (p.role === "rim") {
          return (
            <Dim
              key={p.role}
              x1={d.cx - d.rimHw * 0.8}
              y1={d.bead}
              x2={d.cx - d.rimHw * 0.8}
              y2={d.beadBot}
              color={c}
            />
          );
        }
        return null;
      })}

      {/* ---- callouts ---- */}
      {parts.map((p) => {
        const slot = LABEL_SLOT[p.role];
        if (!slot) return null;
        const [ax, ay] = anchorFor(p.role);
        const left = slot.side === "left";
        const badgeX = left ? leftBadgeX : rightBadgeX;
        const badgeY = labelled ? slot.y - 5 : compactY(p.role);
        const elbowX = ax + (left ? -10 : 10);
        const dotted = ["construction", "load", "speed"].includes(p.role);

        return (
          <g key={p.role}>
            <Leader
              points={[
                [ax, ay],
                [elbowX, ay],
                [badgeX + (left ? badgeR + 3 : -(badgeR + 3)), badgeY],
              ]}
              color={p.color}
              dotted={dotted}
            />
            <CalloutBadge
              x={badgeX}
              y={badgeY}
              n={p.n}
              color={p.color}
              r={badgeR}
            />
            {labelled && (
              <>
                <text
                  x={left ? badgeX - badgeR - 8 : badgeX + badgeR + 8}
                  y={slot.y}
                  textAnchor={left ? "end" : "start"}
                  fill={p.color}
                  fontSize="15"
                  fontWeight="800"
                  className="font-display"
                >
                  {p.title}
                </text>
                <text
                  x={left ? badgeX - badgeR - 8 : badgeX + badgeR + 8}
                  y={slot.y + 18}
                  textAnchor={left ? "end" : "start"}
                  fill="#FFFFFF"
                  fillOpacity="0.72"
                  fontSize="12.5"
                >
                  {p.short}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * The overlap drawing for the comparison
 * ------------------------------------------------------------------ */

/**
 * Both tires drawn at the same scale, sitting on the same ground line —
 * which is how they sit under the car. The gap at the top is the diameter
 * change; the gap between the two axle marks is what happens to your ground
 * clearance. The bars underneath are the tread widths, same scale again.
 */
function OverlapDrawing({ from, to }) {
  const W = 320;
  const tallest = Math.max(from.overallDiameter, to.overallDiameter);
  const k = 232 / tallest;
  const ground = 18 + 232;
  const H = ground + 66;
  const cx = 158;

  const circle = (g) => ({
    r: (g.overallDiameter * k) / 2,
    rimR: (g.rimDiameter * k) / 2,
    cy: ground - (g.overallDiameter * k) / 2,
    halfW: (g.sectionWidthIn * k) / 2,
  });
  const a = circle(from);
  const b = circle(to);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mx-auto h-auto w-full max-w-[420px]"
      role="img"
      aria-label={`${from.normalized} and ${to.normalized} drawn at the same scale, both sitting on the ground, with their tread widths shown as bars underneath.`}
    >
      {/* the road */}
      <line
        x1="8"
        y1={ground}
        x2={W - 8}
        y2={ground}
        stroke="#FFFFFF"
        strokeOpacity="0.4"
        strokeWidth="1.5"
      />
      <g stroke="#FFFFFF" strokeOpacity="0.16" strokeWidth="1">
        {Array.from({ length: 22 }, (_, i) => 12 + i * 14).map((hx) => (
          <line key={hx} x1={hx} y1={ground} x2={hx - 6} y2={ground + 6} />
        ))}
      </g>

      {/* the size on the car now — dashed, so the two never rely on colour alone */}
      <g fill="none" stroke="#E9F2FF">
        <circle
          cx={cx}
          cy={a.cy}
          r={a.r}
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        <circle
          cx={cx}
          cy={a.cy}
          r={a.rimR}
          strokeWidth="1.2"
          strokeOpacity="0.55"
          strokeDasharray="4 3"
        />
      </g>
      <circle cx={cx} cy={a.cy} r={a.r} fill="#E9F2FF" fillOpacity="0.05" />

      {/* the size being considered — solid volt */}
      <circle cx={cx} cy={b.cy} r={b.r} fill="#00B4FC" fillOpacity="0.1" />
      <g fill="none" stroke="#00B4FC">
        <circle cx={cx} cy={b.cy} r={b.r} strokeWidth="2.2" />
        <circle
          cx={cx}
          cy={b.cy}
          r={b.rimR}
          strokeWidth="1.4"
          strokeOpacity="0.6"
        />
      </g>

      {/* where each axle ends up — the gap between these two lines is the
          change in ground clearance */}
      <line
        x1="14"
        y1={a.cy}
        x2={W - 40}
        y2={a.cy}
        stroke="#E9F2FF"
        strokeWidth="1"
        strokeOpacity="0.45"
        strokeDasharray="5 4"
      />
      <line
        x1="14"
        y1={b.cy}
        x2={W - 40}
        y2={b.cy}
        stroke="#00B4FC"
        strokeWidth="1.2"
        strokeOpacity="0.8"
        strokeDasharray="5 4"
      />
      {Math.abs(a.cy - b.cy) > 3 && (
        <Dim x1={W - 26} y1={a.cy} x2={W - 26} y2={b.cy} color="#F5A623" />
      )}

      {/* tread width, same scale */}
      <rect
        x={cx - a.halfW}
        y={ground + 20}
        width={a.halfW * 2}
        height="9"
        rx="3"
        fill="#E9F2FF"
        fillOpacity="0.55"
      />
      <rect
        x={cx - b.halfW}
        y={ground + 36}
        width={b.halfW * 2}
        height="9"
        rx="3"
        fill="#00B4FC"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Small presentational pieces
 * ------------------------------------------------------------------ */

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-card border border-ink/[0.07] bg-bone p-4 shadow-card">
      <p className="label mb-1">{label}</p>
      <p className="tnum font-display text-[1.5rem] font-bold leading-none tracking-[-0.02em] text-ink">
        {value}
      </p>
      {sub && (
        <p className="mt-1.5 text-[11px] leading-snug text-smoke">{sub}</p>
      )}
    </div>
  );
}

function DeltaRow({ label, value, sub }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink/[0.07] py-2.5 last:border-b-0">
      <span className="text-sm text-smoke">{label}</span>
      <span className="text-right">
        <span className="tnum font-display text-[1.0625rem] font-bold text-ink">
          {value}
        </span>
        {sub && (
          <span className="tnum block text-[11px] text-smoke">{sub}</span>
        )}
      </span>
    </div>
  );
}

/** Catalog matches for one size, or a plain sentence saying there are none. */
function CatalogMatches({ geo, heading }) {
  const matches = useMemo(() => {
    if (!geo) return [];
    return TIRES.filter((t) => {
      const p = parseSize(t.size);
      return p && p.normalized === geo.normalized;
    });
  }, [geo]);

  if (!geo) return null;

  return (
    <div>
      <h3 className="h3 mb-1">{heading}</h3>
      <p className="mb-6 text-sm text-smoke">
        {matches.length > 0
          ? `${matches.length} tire${matches.length === 1 ? "" : "s"} in our catalog are marked ${geo.normalized}. The catalog is representative rather than live distributor inventory — call if you want a size checked.`
          : `Nothing in our catalog is marked ${geo.normalized}.`}
      </p>

      {matches.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {matches.slice(0, 8).map((tire) => (
            <ProductCard key={tire.slug} product={tire} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title={`We do not stock ${geo.normalized} on the site`}
          lede={`Our catalog is a representative range, not the whole distributor network. Browse everything we do list, or call ${BUSINESS.phone} and we will look the size up.`}
          action={
            <Link to="/tires" className="btn-primary min-h-[44px]">
              Browse all tires
              <ArrowRight size={17} aria-hidden />
            </Link>
          }
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * FAQ
 * ------------------------------------------------------------------ */

const FAQ = [
  {
    q: "What do the numbers on the side of a tire actually mean?",
    a: "Take 215/60R16 95H. 215 is the width across the tire in millimetres. 60 is the aspect ratio — the sidewall is 60% of that width, so 129 mm tall. R means radial construction. 16 is the wheel diameter in inches, measured at the bead seat. 95 is the load index, which is 1,521 lbs per tire. H is the speed rating, certified to 130 mph. The first four have to be right for the tire to physically fit; the last two have to meet or beat what your car was built for.",
  },
  {
    q: "Where do I find the right size for my car?",
    a: "Open the driver's door and look at the placard on the door jamb. That is the size, load index and speed rating the car was engineered around, along with the correct inflation pressures. The owner's manual repeats it. The sidewall of the tires currently on the car tells you what is fitted, which is not always the same thing — a previous owner may have changed it. When the placard and the sidewall disagree, the placard is the one to trust.",
  },
  {
    q: "Can I fit a different size than the placard says?",
    a: "Physically, often yes. Whether you should is a different question. Most fitment guides work to within 3% of the original overall diameter, because your speedometer, odometer, ABS and traction control all read wheel speed and assume the original rolling circumference. Past that they are all reading wrong by the same margin. A replacement also has to meet or beat the original load index, and it has to clear the suspension and bodywork at full steering lock and full suspension travel — which is something no calculator can see. Check the owner's manual before you buy.",
  },
  {
    q: "Can I mix tire sizes front and rear?",
    a: "Some cars leave the factory staggered, with a wider tire on the rear — that is fine, because it is the design. Mixing sizes that were not designed to be mixed is not. Never mix sizes across one axle. On an all-wheel-drive car, even small differences in rolling circumference between axles make the centre differential or coupling work continuously, and that gets expensive. Replace in pairs across an axle at minimum, and all four on an all-wheel-drive car.",
  },
  {
    q: "What does plus-sizing do?",
    a: "Plus-sizing means going up in wheel diameter and down in sidewall to keep the overall diameter roughly the same — 205/55R16 to 225/45R17, for example. Less sidewall flex sharpens steering response and usually looks better. You also get a harsher ride, more road noise, more exposure to pothole and rim damage, and a more expensive tire to replace. It needs the matching wheel: the tire cannot go on the wheel you have.",
  },
  {
    q: "Is a 60-series sidewall always the same height?",
    a: "No, and this is the single most common misreading of a tire size. The aspect ratio is a percentage of that tire's own width, not a fixed measurement. A 205/60R16 has a 123 mm sidewall; a 275/60R16 has a 165 mm one. Same 60, 42 mm difference.",
  },
  {
    q: "What about XL, reinforced, and the letters before the size?",
    a: "A letter in front — P, LT or ST — is the service type: passenger, light truck, or special trailer. XL or Reinforced after the size means the tire is built to carry more than a standard tire of the same size, and it will carry a higher load index to match. Both matter for load, neither changes the tire's dimensions.",
  },
];

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

export default function TireSizePage() {
  const [params, setParams] = useSearchParams();
  const [copied, setCopied] = useState(false);

  // The URL is the state. That makes every result a link someone can paste
  // into a text message, and it is what the product pages will link into.
  const sizeInput = params.get("size") ?? "";
  const vsInput = params.get("vs") ?? "";

  const write = (next) => {
    const sp = new URLSearchParams(params);
    Object.entries(next).forEach(([key, value]) => {
      if (value) sp.set(key, value);
      else sp.delete(key);
    });
    setParams(sp, { replace: true });
    setCopied(false);
  };

  const geo = useMemo(() => sizeGeometry(sizeInput.trim()), [sizeInput]);
  const vsGeo = useMemo(() => sizeGeometry(vsInput.trim()), [vsInput]);
  const parts = useMemo(() => (geo ? decodeParts(geo) : []), [geo]);
  const cmp = useMemo(
    () => (geo && vsGeo ? compareSizes(geo, vsGeo) : null),
    [geo, vsGeo],
  );

  const typedSomething = sizeInput.trim().length > 0;
  const badSize = typedSomething && !geo;
  const badVs = vsInput.trim().length > 0 && !vsGeo;

  const serviceTyped = /^\s*(P|LT|ST)/i.test(sizeInput)
    ? sizeInput
        .trim()
        .slice(0, 2)
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
    : null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const loadFrom = geo?.loadIndex ? loadPounds(geo.loadIndex) : null;
  const loadTo = vsGeo?.loadIndex ? loadPounds(vsGeo.loadIndex) : null;

  return (
    <>
      <Seo
        title="Tire Size Calculator & Sidewall Decoder"
        description="Type the size off your sidewall and see what every number means, drawn to scale — width, aspect ratio, wheel diameter, load index and speed rating, plus overall diameter, speedometer error and whether a different size will work."
      />

      <PageHero
        eyebrow="Free tool"
        title="What the numbers on your tire actually mean"
        lede="Type what is written on your sidewall. We will draw it, explain every part of the marking in plain English, and show you exactly what changes if you fit something different."
      >
        <div className="flex flex-wrap gap-2.5">
          <a href="#decoder" className="btn-primary min-h-[44px]">
            Decode my size
            <ArrowRight size={17} aria-hidden />
          </a>
          <Link to="/tires" className="btn-ghost-light min-h-[44px]">
            Shop tires
          </Link>
        </div>
      </PageHero>

      <Breadcrumbs trail={[{ label: "Tire size calculator" }]} />

      {/* ---------------- Inputs ---------------- */}
      <Section className="bg-bone" id="decoder">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <div>
            <SectionHead
              eyebrow="Step one"
              title="Read it off the sidewall"
              lede="It is the string that looks like 215/60R16 95H, moulded into the outer face of the tire. The door jamb placard on the driver's side has it too — that one is the size your car was built for."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="size" className="label">
                  Your tire size
                </label>
                <input
                  id="size"
                  name="size"
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck="false"
                  placeholder="215/60R16 95H"
                  value={sizeInput}
                  onChange={(e) => write({ size: e.target.value })}
                  className="field min-h-[44px] font-display text-[1.0625rem] font-bold tracking-[-0.01em]"
                  aria-describedby="size-help"
                />
                <p id="size-help" className="mt-1.5 text-[11px] text-smoke">
                  Metric or flotation. Spaces and capitals do not matter.
                </p>
              </div>

              <div>
                <label htmlFor="vs" className="label">
                  Compare against (optional)
                </label>
                <input
                  id="vs"
                  name="vs"
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck="false"
                  placeholder="225/50R17"
                  value={vsInput}
                  onChange={(e) => write({ vs: e.target.value })}
                  className="field min-h-[44px] font-display text-[1.0625rem] font-bold tracking-[-0.01em]"
                  aria-describedby="vs-help"
                />
                <p id="vs-help" className="mt-1.5 text-[11px] text-smoke">
                  The size you are thinking of fitting instead.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.09em] text-smoke">
                Try one
              </span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => write({ size: ex })}
                  className="tnum min-h-[36px] rounded-sm border border-ink/[0.12] bg-fog px-3 text-[13px] font-medium text-ink transition-colors hover:border-drop/40 hover:text-drop"
                >
                  {ex}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => write({ size: vsInput, vs: sizeInput })}
                disabled={!sizeInput && !vsInput}
                className="btn-outline btn-sm min-h-[44px]"
              >
                <Repeat size={15} aria-hidden />
                Swap the two
              </button>
              <button
                type="button"
                onClick={copyLink}
                disabled={!typedSomething}
                className="btn-outline btn-sm min-h-[44px]"
              >
                {copied ? (
                  <Check size={15} aria-hidden />
                ) : (
                  <Copy size={15} aria-hidden />
                )}
                {copied ? "Link copied" : "Copy link to this result"}
              </button>
            </div>

            {/* The one live region on the page. Everything below updates too,
                but announcing a whole page of cards on every keystroke would
                be unusable — this says the result in one line instead. */}
            <p
              role="status"
              aria-live="polite"
              className="mt-4 rounded-sm border border-ink/[0.07] bg-fog px-3.5 py-3 text-sm leading-snug text-smoke"
            >
              {geo ? (
                <>
                  <span className="tnum font-display font-bold text-ink">
                    {geo.normalized}
                  </span>{" "}
                  — <span className="tnum">{inches(geo.overallDiameter)}</span>{" "}
                  overall diameter,{" "}
                  <span className="tnum">{inches(geo.sidewallIn)}</span> of
                  sidewall,{" "}
                  <span className="tnum">{commas(geo.revsPerMile)}</span>{" "}
                  revolutions per mile unloaded.
                  {cmp && (
                    <>
                      {" "}
                      Against {cmp.to.normalized}:{" "}
                      <span className="tnum">
                        {signed(cmp.diameterChange, 1)}%
                      </span>{" "}
                      diameter, and{" "}
                      <span className="tnum">
                        {cmp.actualAt(60).toFixed(1)}
                      </span>{" "}
                      mph at an indicated 60.
                    </>
                  )}
                </>
              ) : typedSomething ? (
                "That is not a size we can read yet."
              ) : (
                "Type a size above and the decoded result appears here and in the sections below."
              )}
            </p>

            {(badSize || badVs) && (
              <p className="mt-4 flex items-start gap-2 rounded-sm bg-amber/15 p-3 text-sm leading-snug text-ink ring-1 ring-inset ring-amberInk/25">
                <AlertTriangle
                  size={16}
                  aria-hidden
                  className="mt-0.5 shrink-0 text-amberInk"
                />
                <span>
                  That is not a size we can read yet. A tire size looks like{" "}
                  <span className="tnum font-bold">215/60R16</span>,{" "}
                  <span className="tnum font-bold">LT265/70R17 121S</span> or{" "}
                  <span className="tnum font-bold">31x10.50R15</span>. Keep
                  typing — this updates as you go.
                </span>
              </p>
            )}
          </div>

          <aside className="card self-start p-6">
            <h3 className="h3 mb-3 text-[1.15rem]">
              Three places the size is written
            </h3>
            <ol className="space-y-3.5 text-sm leading-relaxed text-smoke">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-bone">
                  1
                </span>
                <span>
                  <span className="font-semibold text-ink">
                    The driver&apos;s door jamb.
                  </span>{" "}
                  Open the door and look at the frame. This placard is what the
                  car was engineered around — size, load index, speed rating and
                  the right pressures.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-bone">
                  2
                </span>
                <span>
                  <span className="font-semibold text-ink">
                    The tire sidewall.
                  </span>{" "}
                  Tells you what is fitted right now, which is not always what
                  the car asked for. If the two disagree, trust the placard.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-bone">
                  3
                </span>
                <span>
                  <span className="font-semibold text-ink">
                    The owner&apos;s manual.
                  </span>{" "}
                  Usually lists every size the car was offered with from the
                  factory, including the optional wheel packages.
                </span>
              </li>
            </ol>
            <p className="mt-5 flex items-start gap-2 border-t border-ink/10 pt-4 text-[13px] leading-relaxed text-smoke">
              <Info
                size={15}
                aria-hidden
                className="mt-0.5 shrink-0 text-drop"
              />
              <span>
                Every figure on this page comes from the marking itself. It
                cannot see your wheels, your fenders or your suspension, so it
                is a starting point, not a fitment approval.
              </span>
            </p>
          </aside>
        </div>
      </Section>

      {/* ---------------- Results ---------------- */}
      <div>
        {geo && (
          <>
            {/* ---- The diagram ---- */}
            <Section className="bg-fog">
              <SectionHead
                eyebrow="Decoded"
                title={`${geo.normalized}, drawn to its own proportions`}
                lede="The drawing below is built from the size you typed — the sidewall really is that tall next to that wheel, and a wider tire really is drawn wider."
              />

              <div className="overflow-hidden rounded-card bg-ink bg-ink-wash shadow-lift">
                <div className="border-b border-bone/10 px-5 py-5 md:px-8">
                  <p className="eyebrow-dark mb-3">The marking, part by part</p>
                  <div className="flex flex-wrap gap-2">
                    {parts.map((p) => (
                      <span
                        key={p.role}
                        className="flex items-center gap-2.5 rounded-sm border border-bone/15 bg-bone/[0.04] px-3 py-2"
                      >
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-display text-[11px] font-bold"
                          style={{ borderColor: p.color, color: p.color }}
                        >
                          {p.n}
                        </span>
                        <span className="leading-tight">
                          <span
                            className="tnum block font-display text-[1.25rem] font-bold leading-none"
                            style={{ color: p.color }}
                          >
                            {p.token}
                          </span>
                          <span className="mt-1 hidden text-[11px] uppercase tracking-[0.09em] text-bone/60 sm:block">
                            {p.title}
                          </span>
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="px-4 py-6 md:px-8 md:py-8">
                  {/* Two drawings rather than one that shrinks: the phone gets
                      the diagram at full size and reads its labels from the
                      numbered cards below. */}
                  <div className="md:hidden">
                    <SidewallDiagram geo={geo} parts={parts} labelled={false} />
                  </div>
                  <div className="hidden md:block">
                    <SidewallDiagram geo={geo} parts={parts} labelled />
                  </div>
                  <p className="mt-4 text-center text-[11px] leading-snug text-bone/50">
                    A cut through the tire and wheel. Drawn from your size at a
                    single scale — proportions are real, the tread pattern is
                    not.
                  </p>
                </div>
              </div>

              {/* ---- Plain English ---- */}
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {parts.map((p) => (
                  <div key={p.role} className="card p-5">
                    <div className="mb-2.5 flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[12px] font-bold text-bone">
                        {p.n}
                      </span>
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-ink/25"
                        style={{ backgroundColor: p.color }}
                      />
                      <h3 className="h3 text-[1.0625rem] md:text-[1.15rem]">
                        <span className="tnum">{p.token}</span>{" "}
                        <span className="text-smoke">— {p.title}</span>
                      </h3>
                    </div>
                    {p.lines.map((line) => (
                      <p
                        key={line}
                        className="mt-2 text-sm leading-relaxed text-smoke first:mt-0"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                ))}
              </div>

              {serviceTyped && SERVICE_TYPE[serviceTyped] && (
                <p className="mt-4 rounded-card border border-ink/[0.07] bg-bone p-5 text-sm leading-relaxed text-smoke shadow-card">
                  <span className="font-display font-bold text-ink">
                    You also typed {serviceTyped}.
                  </span>{" "}
                  {SERVICE_TYPE[serviceTyped]}
                </p>
              )}

              {geo.format === "metric" &&
                (!geo.loadIndex || !geo.speedRating) && (
                  <p className="mt-4 flex items-start gap-2 rounded-card border border-ink/[0.07] bg-bone p-5 text-sm leading-relaxed text-smoke shadow-card">
                    <Info
                      size={16}
                      aria-hidden
                      className="mt-0.5 shrink-0 text-drop"
                    />
                    <span>
                      You did not type a{" "}
                      {!geo.loadIndex && !geo.speedRating
                        ? "load index or speed rating"
                        : !geo.loadIndex
                          ? "load index"
                          : "speed rating"}
                      , so we have not guessed one. They are the two characters
                      printed just after the wheel size — the{" "}
                      <span className="tnum font-bold text-ink">95H</span> in{" "}
                      <span className="tnum font-bold text-ink">
                        {geo.normalized} 95H
                      </span>
                      . Add them and this page will decode those too.
                    </span>
                  </p>
                )}
            </Section>

            {/* ---- Derived figures ---- */}
            <Section className="bg-bone">
              <SectionHead
                eyebrow="The figures behind it"
                title="What that size works out to"
                lede="Everything here is derived from the marking. These are nominal, free-standing dimensions — the numbers the size describes."
                action={
                  <span className="hidden items-center gap-2 text-sm text-smoke md:flex">
                    <Ruler size={16} aria-hidden className="text-drop" />
                    {geo.normalized}
                  </span>
                }
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat
                  label="Overall diameter"
                  value={inches(geo.overallDiameter)}
                  sub={`${mm(geo.overallDiameter * 25.4)} — how tall the tire stands`}
                />
                <Stat
                  label="Sidewall height"
                  value={inches(geo.sidewallIn)}
                  sub={`${mm(geo.sidewallMm)} from the rim flange to the tread`}
                />
                <Stat
                  label="Section width"
                  value={inches(geo.sectionWidthIn)}
                  sub={`${mm(geo.sectionWidthMm)} across at the widest point`}
                />
                <Stat
                  label="Circumference"
                  value={inches(geo.circumference, 1)}
                  sub="The distance covered in one full turn of the wheel"
                />
                <Stat
                  label="Revolutions per mile"
                  value={commas(geo.revsPerMile)}
                  sub="Unloaded. A tire squats under the weight of the car, so the real figure runs a little higher."
                />
                <Stat
                  label="Wheel it fits"
                  value={`${geo.rimDiameter} in`}
                  sub="Bead seat to bead seat. No tolerance on this one."
                />
                <Stat
                  label="Load index"
                  value={
                    geo.loadIndex
                      ? loadFrom
                        ? `${commas(loadFrom)} lbs`
                        : geo.loadIndex
                      : "—"
                  }
                  sub={
                    geo.loadIndex
                      ? loadFrom
                        ? `Index ${geo.loadIndex}, per tire — ${commas(loadFrom * 4)} lbs on four`
                        : "Outside the table we publish — see the tire's spec sheet"
                      : "Not in what you typed"
                  }
                />
                <Stat
                  label="Speed rating"
                  value={
                    geo.speedRating
                      ? SPEED_RATINGS[geo.speedRating]?.mph
                        ? `${SPEED_RATINGS[geo.speedRating].mph} mph`
                        : geo.speedRating
                      : "—"
                  }
                  sub={
                    geo.speedRating
                      ? `Rating ${geo.speedRating} — a heat limit, not a target`
                      : "Not in what you typed"
                  }
                />
              </div>
            </Section>
          </>
        )}

        {/* ---- Comparison ---- */}
        {cmp && (
          <Section className="bg-fog">
            <SectionHead
              eyebrow="Side by side"
              title={`${cmp.from.normalized} against ${cmp.to.normalized}`}
              lede="Both tires below are drawn at the same scale, sitting on the same ground. The difference you can see is the difference you would get."
            />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-10">
              <div className="self-start rounded-card bg-ink bg-ink-wash p-5 shadow-lift md:p-6">
                <OverlapDrawing from={cmp.from} to={cmp.to} />
                <ul className="mt-5 space-y-2.5 border-t border-bone/10 pt-4">
                  <li className="flex items-center gap-3 text-sm text-bone/80">
                    <span
                      aria-hidden
                      className="h-0 w-7 shrink-0 border-t-2 border-dashed border-sky"
                    />
                    <span className="tnum font-display font-bold text-bone">
                      {cmp.from.normalized}
                    </span>
                    <span className="tnum ml-auto text-bone/60">
                      {inches(cmp.from.overallDiameter)} tall
                    </span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-bone/80">
                    <span
                      aria-hidden
                      className="h-0 w-7 shrink-0 border-t-[3px] border-volt"
                    />
                    <span className="tnum font-display font-bold text-bone">
                      {cmp.to.normalized}
                    </span>
                    <span className="tnum ml-auto text-bone/60">
                      {inches(cmp.to.overallDiameter)} tall
                    </span>
                  </li>
                </ul>
                <p className="mt-3 text-[11px] leading-snug text-bone/50">
                  Circles are the tires and their wheels. The bars underneath
                  are the tread widths at the same scale.
                </p>
              </div>

              <div>
                <div className="card p-5 md:p-6">
                  <p className="eyebrow mb-3">What changes</p>
                  <DeltaRow
                    label="Overall diameter"
                    value={`${signed(cmp.diameterChange, 2)}%`}
                    sub={`${signed(cmp.diameterChangeIn, 2)} in`}
                  />
                  <DeltaRow
                    label="Ground clearance"
                    value={`${signed(cmp.clearanceChangeIn, 2)} in`}
                    sub="Half the diameter change — the axle moves by the change in radius"
                  />
                  <DeltaRow
                    label="Section width"
                    value={`${signed(cmp.widthChangeMm, 0)} mm`}
                    sub={`${signed(cmp.widthChangeMm / 25.4, 2)} in across`}
                  />
                  <DeltaRow
                    label="Sidewall height"
                    value={`${signed(cmp.sidewallChangeIn, 2)} in`}
                    sub={`${signed(cmp.sidewallChangeIn * 25.4, 0)} mm of sidewall`}
                  />
                  <DeltaRow
                    label="Revolutions per mile"
                    value={`${signed(cmp.revsChange, 2)}%`}
                    sub={`${commas(cmp.from.revsPerMile)} → ${commas(cmp.to.revsPerMile)}, unloaded`}
                  />
                </div>

                {/* Speedometer */}
                <div className="card mt-4 p-5 md:p-6">
                  <p className="eyebrow mb-3 flex items-center gap-2">
                    <Gauge size={15} aria-hidden />
                    Your speedometer
                  </p>
                  <p className="text-[1.0625rem] leading-relaxed text-ink md:text-[1.15rem]">
                    At an indicated{" "}
                    <span className="tnum font-display font-bold">60</span> you
                    would really be doing{" "}
                    <span className="tnum font-display font-bold text-drop">
                      {cmp.actualAt(60).toFixed(1)}
                    </span>{" "}
                    mph.
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[30, 60, 75].map((mph) => (
                      <div key={mph} className="rounded-sm bg-fog p-3">
                        <p className="tnum text-[11px] uppercase tracking-[0.09em] text-smoke">
                          Reads {mph}
                        </p>
                        <p className="tnum mt-1 font-display text-[1.25rem] font-bold leading-none text-ink">
                          {cmp.actualAt(mph).toFixed(1)}
                        </p>
                        <p className="text-[11px] text-smoke">actual mph</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] leading-snug text-smoke">
                    Calculated from nominal diameters. A loaded tire sits
                    slightly shorter than its free diameter, so the real error
                    is usually a shade smaller than this.
                  </p>
                </div>
              </div>
            </div>

            {/* Verdict */}
            <div
              className={`mt-6 rounded-card p-6 shadow-card md:p-8 ${
                cmp.withinTolerance
                  ? "border border-ink/[0.07] bg-bone"
                  : "bg-ink bg-steel-wash text-bone"
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                {cmp.withinTolerance ? (
                  <Badge tone="drop">Inside ±{cmp.tolerance}%</Badge>
                ) : (
                  <Badge tone="amber">Outside ±{cmp.tolerance}%</Badge>
                )}
                {!cmp.sameRim && (
                  <Badge tone={cmp.withinTolerance ? "soft" : "ink"}>
                    Different wheel size
                  </Badge>
                )}
              </div>

              <h3
                className={`h3 mt-3 text-[1.25rem] md:text-[1.45rem] ${
                  cmp.withinTolerance ? "" : "text-bone"
                }`}
              >
                {cmp.withinTolerance
                  ? `Diameter moves ${signed(cmp.diameterChange, 1)}% — inside the window the industry works to.`
                  : `Diameter moves ${signed(cmp.diameterChange, 1)}% — past the ${cmp.tolerance}% most fitment guides stop at.`}
              </h3>

              <div
                className={`mt-3 max-w-3xl space-y-3 text-sm leading-relaxed md:text-[15px] ${
                  cmp.withinTolerance ? "text-smoke" : "text-bone/75"
                }`}
              >
                {cmp.withinTolerance ? (
                  <p>
                    Your speedometer would read about{" "}
                    <span className="tnum font-bold">
                      {Math.abs(cmp.speedoErrorAt60).toFixed(1)} mph
                    </span>{" "}
                    {cmp.speedoErrorAt60 >= 0 ? "low" : "high"} at an indicated
                    60, and your odometer by the same proportion. Ground
                    clearance changes by {signed(cmp.clearanceChangeIn, 2)} in.
                  </p>
                ) : (
                  <p>
                    Your speedometer, odometer, ABS and traction control all
                    work off wheel rotation, so all of them would now be reading{" "}
                    {Math.abs(cmp.diameterChange).toFixed(1)}% out. At an
                    indicated 60 you would be doing{" "}
                    <span className="tnum font-bold">
                      {cmp.actualAt(60).toFixed(1)}
                    </span>
                    , and every mile logged would be off by the same margin.
                  </p>
                )}

                {!cmp.sameRim && (
                  <p>
                    These are different wheel diameters —{" "}
                    <span className="tnum font-bold">
                      {cmp.from.rimDiameter} in
                    </span>{" "}
                    against{" "}
                    <span className="tnum font-bold">
                      {cmp.to.rimDiameter} in
                    </span>
                    . This is a wheel change, not just a tire change: the new
                    size will not mount on the wheels you have now.
                  </p>
                )}

                {loadFrom && loadTo && loadTo < loadFrom && (
                  <p>
                    The replacement also carries less:{" "}
                    <span className="tnum font-bold">{commas(loadTo)} lbs</span>{" "}
                    per tire against{" "}
                    <span className="tnum font-bold">
                      {commas(loadFrom)} lbs
                    </span>
                    . Do not go below the load index on your door placard.
                  </p>
                )}

                <p>
                  We are not going to tell you this swap is safe, because a size
                  calculator cannot see your car. It does not know your wheel
                  width, your offset, how much room is in the arches, or how far
                  the suspension travels. Check clearance at full steering lock
                  and over full suspension travel, and check the placard in your
                  driver&apos;s door jamb and your owner&apos;s manual for the
                  sizes and load ratings your car was built for.
                </p>
              </div>
            </div>
          </Section>
        )}

        {/* ---- Buy it ---- */}
        {geo && (
          <Section className="bg-bone">
            <div className="space-y-14">
              <CatalogMatches
                geo={geo}
                heading={`Tires we list in ${geo.normalized}`}
              />
              {vsGeo && vsGeo.normalized !== geo.normalized && (
                <CatalogMatches
                  geo={vsGeo}
                  heading={`Tires we list in ${vsGeo.normalized}`}
                />
              )}
            </div>
          </Section>
        )}
      </div>

      {/* ---------------- Nothing typed yet ---------------- */}
      {!typedSomething && (
        <Section className="bg-fog">
          <SectionHead
            eyebrow="How this works"
            title="Three things this tool will tell you"
            align="center"
          />
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Ruler,
                title: "What the marking means",
                body: "Every number and letter on the sidewall, explained with the real figures for your size — not a generic example. Width, sidewall height, wheel diameter, load in pounds, speed in mph.",
              },
              {
                icon: Search,
                title: "Whether a different size works",
                body: "Put a second size in and we draw both to scale, one on top of the other, and show you the diameter, width, sidewall and clearance change between them.",
              },
              {
                icon: Gauge,
                title: "What it does to your speedo",
                body: "A taller tire covers more ground per turn, so the needle reads low. We tell you what you are actually doing at an indicated 60, and when the change is big enough to matter.",
              },
            ].map((item) => (
              <div key={item.title} className="card p-6">
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-sm bg-sky text-drop">
                  <item.icon size={20} aria-hidden />
                </span>
                <h3 className="h3 text-[1.0625rem] md:text-[1.15rem]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-smoke">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ---------------- FAQ ---------------- */}
      <Section className={typedSomething ? "bg-fog" : "bg-bone"}>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
          <SectionHead
            eyebrow="Questions"
            title="Tire sizes, answered properly"
            lede="The questions we get asked on the phone, written out the way we would answer them."
          />
          <div>
            {/* The shared accordion sizes its summary to the text; on a phone
                a one-line question lands under the 44px we aim for. */}
            <div className="[&_summary]:min-h-[44px]">
              <Accordion items={FAQ} />
            </div>
            <p className="mt-6 text-sm leading-relaxed text-smoke">
              Still not sure what you need?{" "}
              <Link to="/find-my-tires" className="font-semibold text-drop">
                Look it up by vehicle
              </Link>{" "}
              or{" "}
              <Link to="/contact" className="font-semibold text-drop">
                ask us
              </Link>{" "}
              — a size question takes about a minute to settle.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
