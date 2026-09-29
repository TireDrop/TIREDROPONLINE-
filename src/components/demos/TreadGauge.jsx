// D1 Tread Depth Gauge (learn-plan §4).
//
// A slider from 10/32" down to 0/32" drives a tread cross-section, the
// tread-wear bars and the penny and quarter tests. The depth → status
// mapping is treadStatus() from tireMath.js, via treadReading().

import React, { useId, useState } from "react";
import { Eye, EyeOff, Minus, Plus } from "lucide-react";

import { DemoShell, StatusBadge } from "./DemoShell.jsx";
import {
  COIN_TESTS,
  TREAD_MAX,
  fmt32,
  treadReading,
} from "./demoLogic.js";

const SOURCES_USED = ["S1", "S13", "S31", "C3", "C27", "C11"];

/* ---------------- Tread cross-section ---------------- */

const PX = 11; // viewBox units per 1/32"
const FLOOR = 150; // groove floor
const BLOCKS = [
  [10, 108],
  [140, 222],
  [254, 336],
];
const GROOVES = [
  [108, 140],
  [222, 254],
];

function TreadSection({ reading, titleId, descId }) {
  const uid = useId().replace(/:/g, "");
  const top = FLOOR - reading.depth * PX;
  const newTop = FLOOR - TREAD_MAX * PX;
  const barH = Math.min(2, reading.depth) * PX;
  const y4 = FLOOR - 4 * PX;
  const y2 = FLOOR - 2 * PX;
  const [gx1, gx2] = GROOVES[0];
  const [dx1, dx2] = GROOVES[1];
  const dimX = (dx1 + dx2) / 2;

  return (
    <svg
      viewBox="0 0 400 196"
      className="h-auto w-full"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
    >
      <title id={titleId}>Tread cross-section</title>
      <desc id={descId}>
        {`Tread blocks ${fmt32(reading.depth)}/32 inch tall above the groove floor. ${
          reading.wearBars.flush
            ? "The tread-wear bar in the groove is flush with the tread surface."
            : `The tread-wear bar sits ${fmt32(reading.wearBars.gap32)}/32 inch below the tread surface.`
        } Dashed lines mark 4/32 and 2/32 inch and the outline of a new 10/32 inch tread.`}
      </desc>
      <defs>
        <linearGradient id={`${uid}r`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2C4260" />
          <stop offset="100%" stopColor="#141F33" />
        </linearGradient>
        <pattern
          id={`${uid}h`}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="6" height="6" fill="#F5A623" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="#8A4F00" strokeWidth="2" />
        </pattern>
      </defs>

      {/* Air */}
      <rect x="0" y="0" width="400" height="196" fill="#F4F6FA" />

      {/* Ghost outline of a new tread */}
      {BLOCKS.map(([x1, x2]) => (
        <rect
          key={`g${x1}`}
          x={x1}
          y={newTop}
          width={x2 - x1}
          height={FLOOR - newTop}
          fill="none"
          stroke="#586274"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
      ))}

      {/* Casing under the tread */}
      <rect x="0" y={FLOOR} width="346" height={196 - FLOOR} fill="#101C2E" />
      <g stroke="#586274" strokeWidth="2" opacity="0.7">
        <line x1="0" y1={FLOOR + 16} x2="346" y2={FLOOR + 16} />
        <line x1="0" y1={FLOOR + 28} x2="346" y2={FLOOR + 28} />
      </g>

      {/* Tread blocks at the current depth */}
      {reading.depth > 0 &&
        BLOCKS.map(([x1, x2]) => (
          <rect
            key={`b${x1}`}
            x={x1}
            y={top}
            width={x2 - x1}
            height={FLOOR - top + 1}
            rx="3"
            fill={`url(#${uid}r)`}
          />
        ))}

      {/* Tread-wear bar in the first groove */}
      {barH > 0 && (
        <rect
          x={gx1}
          y={FLOOR - barH}
          width={gx2 - gx1}
          height={barH + 1}
          fill={`url(#${uid}h)`}
          stroke="#070E1A"
          strokeWidth="1"
        />
      )}

      {/* Depth dimension in the second groove */}
      {reading.depth >= 1 && (
        <g stroke="#0068E8" strokeWidth="2">
          <line x1={dimX} y1={top + 2} x2={dimX} y2={FLOOR - 2} />
          <line x1={dimX - 7} y1={top + 1} x2={dimX + 7} y2={top + 1} />
          <line x1={dimX - 7} y1={FLOOR - 1} x2={dimX + 7} y2={FLOOR - 1} />
        </g>
      )}

      {/* Reference lines */}
      {[
        [y4, "4/32"],
        [y2, "2/32"],
      ].map(([y, t]) => (
        <g key={t}>
          <line
            x1="0"
            y1={y}
            x2="350"
            y2={y}
            stroke="#0053C4"
            strokeWidth="1.5"
            strokeDasharray="7 5"
          />
          <text
            x="396"
            y={y + 5}
            textAnchor="end"
            fontSize="14"
            fontWeight="700"
            fill="#0053C4"
          >
            {t}″
          </text>
        </g>
      ))}
      <text
        x="396"
        y={newTop + 5}
        textAnchor="end"
        fontSize="13"
        fontWeight="700"
        fill="#586274"
      >
        new
      </text>

      {/* Wear-bar label */}
      <g>
        <line
          x1={(gx1 + gx2) / 2}
          y1={FLOOR - Math.max(barH, 2)}
          x2={(gx1 + gx2) / 2}
          y2="18"
          stroke="#070E1A"
          strokeWidth="1.5"
        />
        <rect x="70" y="4" width="108" height="22" rx="4" fill="#070E1A" />
        <text
          x="124"
          y="20"
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill="#FFFFFF"
        >
          Wear bar
        </text>
      </g>
    </svg>
  );
}

/* ---------------- Coin test ---------------- */

const CPX = 4; // viewBox units per 1/32" in the coin view
const SURFACE = 128;
const COIN_DIAMETER_32 = { penny: 24, quarter: 30.56 }; // 0.750" and 0.955"
const COIN_FILL = {
  penny: ["#E2A276", "#C1743C", "#8A4A22"],
  quarter: ["#E4E8ED", "#B9BEC7", "#5E6875"],
};

// A profile bust, head-up and facing right, crown at y = -62 (the same
// shape /tire-check draws). It is scaled so the crown lands `headAt` 32nds
// from the coin's edge, then turned upside down, the way the coin goes in.
const BUST =
  "M -55 78 C -50 30, -48 6, -42 -10 C -36 -34, -22 -56, 0 -62 " +
  "C 16 -58, 28 -44, 33 -28 C 35 -22, 30 -20, 28 -16 " +
  "C 33 -10, 40 -6, 39 -1 C 38 3, 31 3, 29 6 " +
  "C 28 12, 27 18, 22 22 C 14 28, 2 27, -4 30 " +
  "C -6 40, -2 50, 4 60 C 12 70, 30 74, 44 78 Z";

function CoinView({ coinKey, depth, reading }) {
  const uid = useId().replace(/:/g, "");
  const c = COIN_TESTS[coinKey];
  const r = (COIN_DIAMETER_32[coinKey] * CPX) / 2;
  const floor = SURFACE + depth * CPX;
  const cy = floor - r;
  const headLine = floor - c.headAt * CPX;
  const bustScale = (r - c.headAt * CPX) / 62;
  const [light, mid, dark] = COIN_FILL[coinKey];

  return (
    <figure className="rounded-sm border border-ink/10 bg-bone p-3">
      <svg
        viewBox="0 0 160 172"
        className="mx-auto h-auto w-full max-w-[200px]"
        role="img"
        aria-labelledby={`${uid}t ${uid}d`}
      >
        <title id={`${uid}t`}>{`${c.coin} test`}</title>
        <desc id={`${uid}d`}>{reading.text}</desc>
        <defs>
          <linearGradient id={`${uid}m`} x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor={light} />
            <stop offset="55%" stopColor={mid} />
            <stop offset="100%" stopColor={dark} />
          </linearGradient>
          <clipPath id={`${uid}c`}>
            <circle cx="0" cy="0" r={r} />
          </clipPath>
        </defs>
        <rect x="0" y="0" width="160" height="172" fill="#F4F6FA" />
        <g transform={`translate(80 ${cy})`}>
          <circle cx="0" cy="0" r={r} fill={`url(#${uid}m)`} />
          <g clipPath={`url(#${uid}c)`}>
            <g transform="rotate(180)">
              <path
                d={BUST}
                transform={`scale(${bustScale})`}
                fill={dark}
                opacity="0.6"
              />
            </g>
          </g>
          <circle cx="0" cy="0" r={r - 5} fill="none" stroke={dark} strokeWidth="1.5" opacity="0.5" />
          <circle cx="0" cy="0" r={r} fill="none" stroke={dark} strokeWidth="2.5" />
        </g>
        {/* The tread face in front of the coin: only what sticks out above
            the surface can be seen, which is the whole test. */}
        <rect x="4" y={SURFACE} width="152" height={172 - SURFACE} rx="4" fill="#22344C" />
        <g stroke="#101C2E" strokeWidth="3" opacity="0.7">
          <line x1="34" y1={SURFACE + 6} x2="34" y2="172" />
          <line x1="126" y1={SURFACE + 6} x2="126" y2="172" />
        </g>
        <line x1="4" y1={SURFACE} x2="156" y2={SURFACE} stroke="#9FB3CC" strokeWidth="1.5" />
        {/* Where the top of the head is, dashed; fainter when it is behind
            the tread. */}
        <line
          x1="14"
          y1={headLine}
          x2="146"
          y2={headLine}
          stroke={reading.visible ? "#0053C4" : "#9FB3CC"}
          strokeWidth="1.5"
          strokeDasharray="5 4"
        />
      </svg>
      <figcaption className="mt-2 text-[13px] leading-snug text-ink">
        <span className="flex items-center gap-1.5 font-display text-[14px] font-bold">
          {reading.visible ? (
            <Eye size={16} aria-hidden="true" />
          ) : (
            <EyeOff size={16} aria-hidden="true" />
          )}
          {c.coin} test ({c.headAt}/32″)
        </span>
        <span className="mt-1 block text-smoke">{reading.text}</span>
      </figcaption>
    </figure>
  );
}

/* ---------------- The demo ---------------- */

export default function TreadGauge() {
  const [depth, setDepth] = useState(6);
  const id = useId();
  const reading = treadReading(depth);

  const step = (delta) =>
    setDepth((d) => Math.min(TREAD_MAX, Math.max(0, d + delta)));

  return (
    <DemoShell
      demoId="tread-gauge"
      title="Tread depth gauge"
      intro="Slide the depth from new (10/32″) down to bald (0/32″) and watch the wear bars and the coin tests change."
      sources={SOURCES_USED}
    >
      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr] lg:gap-6">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <label
              htmlFor={`${id}-depth`}
              className="font-display text-[13px] font-bold text-ink"
            >
              Tread depth
            </label>
            <p className="tnum font-display text-[1.6rem] font-extrabold leading-none text-ink">
              {fmt32(depth)}/32″{" "}
              <span className="text-[1rem] font-bold text-smoke">
                · {reading.mmText} mm
              </span>
            </p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={depth <= 0}
              aria-label="Less tread (1/32 inch)"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-ink/15 bg-bone text-ink hover:bg-fog disabled:opacity-40"
            >
              <Minus size={18} aria-hidden="true" />
            </button>
            <input
              id={`${id}-depth`}
              type="range"
              min="0"
              max={TREAD_MAX}
              step="1"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              aria-valuetext={`${fmt32(depth)}/32 inch, ${reading.mmText} millimeters`}
              aria-describedby={`${id}-scale`}
              className="h-11 min-w-0 flex-1 cursor-pointer accent-drop"
            />
            <button
              type="button"
              onClick={() => step(1)}
              disabled={depth >= TREAD_MAX}
              aria-label="More tread (1/32 inch)"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-ink/15 bg-bone text-ink hover:bg-fog disabled:opacity-40"
            >
              <Plus size={18} aria-hidden="true" />
            </button>
          </div>
          <p
            id={`${id}-scale`}
            className="mt-1 text-[13px] leading-snug text-smoke"
          >
            0/32″ to 10/32″. Use the arrow keys for 1/32″ steps. Many new
            passenger tires start at about 10/32″ to 11/32″.
          </p>

          <div className="mt-4 overflow-hidden rounded-sm border border-ink/10">
            <TreadSection
              reading={reading}
              titleId={`${id}-svgt`}
              descId={`${id}-svgd`}
            />
          </div>
          <p className="mt-2 text-[13px] leading-snug text-smoke">
            <span className="font-bold text-ink">Wear bars:</span>{" "}
            {reading.wearBars.flush
              ? "flush with the tread. Bars running across the tread mean it has worn to 2/32″."
              : `sitting ${fmt32(reading.wearBars.gap32)}/32″ below the tread surface, down in the grooves.`}
          </p>
        </div>

        <div>
          <div
            aria-live="polite"
            aria-atomic="true"
            className="rounded-sm border-l-4 border-ink bg-fog p-4"
          >
            <p className="sr-only">
              {`${fmt32(depth)}/32 inch, ${reading.mmText} millimeters.`}
            </p>
            <StatusBadge status={reading.status} />
            <p className="mt-3 text-[15px] leading-relaxed text-ink">
              {reading.summary}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-smoke">
              {reading.detail}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <CoinView coinKey="penny" depth={depth} reading={reading.penny} />
            <CoinView
              coinKey="quarter"
              depth={depth}
              reading={reading.quarter}
            />
          </div>

          <ul className="mt-4 space-y-1.5 text-[13px] leading-snug text-smoke">
            <li>
              Coin tests are approximations. A tread-depth gauge is more
              precise, and a tire technician can measure for you.
            </li>
            <li>
              Legal minimums are set by each state. For Florida, check current
              Florida law; this demo doesn&apos;t state a legal minimum.
            </li>
          </ul>
        </div>
      </div>
    </DemoShell>
  );
}
