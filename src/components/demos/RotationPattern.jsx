// D8 Rotation Animator (learn-plan §4): pick the drivetrain, tread type and
// setup, see the rotation pattern as a top view with arrows and as a text
// list.
//
// "Show the move" slides each tire to its new corner with a CSS transform
// transition. Under prefers-reduced-motion the transition is switched off, so
// the tires jump straight to the result; the arrows and the step list carry
// the same information either way. No window or document access, so the demo
// prerenders.

import React, { useId, useState } from "react";
import { ArrowRight, RotateCcw, Shuffle } from "lucide-react";

import { DemoShell, RadioCards } from "./DemoShell.jsx";
import {
  DRIVETRAINS,
  POSITIONS,
  ROTATION_DEFAULTS,
  SETUPS,
  TREAD_TYPES,
  rotationPattern,
} from "./maintenanceLogic.js";

const SOURCES_USED = ["S18", "C5"];

const MOVE_CSS = `
.tdx-rot-tire { transition: transform 900ms cubic-bezier(.4, 0, .2, 1); }
@media (prefers-reduced-motion: reduce) { .tdx-rot-tire { transition: none; } }
`;

/* ---------------- Top view ---------------- */

// Tire centres in the 240 × 280 viewBox; the front of the car is at the top.
const POS = { LF: [70, 70], RF: [170, 70], LR: [70, 210], RR: [170, 210] };
const TIRE_W = 28;
const TIRE_H = 52;
const LANE = 6; // arrows sit this far right of their line, so swaps don't overlap

function arrowLine(from, to) {
  const [x1, y1] = POS[from];
  const [x2, y2] = POS[to];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy * LANE;
  const ny = ux * LANE;
  return {
    x1: x1 + ux * 26 + nx,
    y1: y1 + uy * 30 + ny,
    x2: x2 - ux * 30 + nx,
    y2: y2 - uy * 34 + ny,
  };
}

function TopView({ pattern, moved, titleId, descId }) {
  const uid = useId().replace(/:/g, "");
  const list = pattern.steps.map((s) => s.text).join("; ");
  return (
    <svg
      viewBox="0 0 240 280"
      className="mx-auto h-auto w-full max-w-[260px]"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
    >
      <title id={titleId}>Top view of a car with four tires</title>
      <desc id={descId}>
        {`${pattern.name}. ${
          pattern.rotates
            ? `Arrows show where each tire moves: ${list}.`
            : "No arrows, because each tire stays where it is."
        } The front of the car is at the top. ${
          moved
            ? "The tires are shown in their new positions."
            : "The tires are shown where they start."
        }`}
      </desc>
      <defs>
        <marker
          id={`${uid}a`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10 z" fill="#0068E8" />
        </marker>
      </defs>

      <rect x="0" y="0" width="240" height="280" fill="#F4F6FA" />
      <text
        x="120"
        y="20"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        letterSpacing="1"
        fill="#586274"
      >
        FRONT
      </text>
      {/* Car body */}
      <rect
        x="80"
        y="30"
        width="80"
        height="220"
        rx="30"
        fill="#FFFFFF"
        stroke="#586274"
        strokeWidth="2"
      />
      <line x1="80" y1="140" x2="160" y2="140" stroke="#586274" strokeWidth="1" strokeDasharray="4 4" />

      {/* Arrows, one per tire that moves */}
      {pattern.steps
        .filter((s) => s.moves)
        .map((s) => (
          <line
            key={s.from}
            {...arrowLine(s.from, s.to)}
            stroke="#0068E8"
            strokeWidth="3"
            strokeLinecap="round"
            markerEnd={`url(#${uid}a)`}
          />
        ))}

      {/* Tires, labelled by the corner they start on */}
      {POSITIONS.map((k) => {
        const [x, y] = POS[moved ? pattern.moves[k] : k];
        return (
          <g
            key={k}
            className="tdx-rot-tire"
            style={{ transform: `translate(${x}px, ${y}px)` }}
          >
            <rect
              x={-TIRE_W / 2}
              y={-TIRE_H / 2}
              width={TIRE_W}
              height={TIRE_H}
              rx="7"
              fill="#22344C"
              stroke="#070E1A"
              strokeWidth="2"
            />
            <text
              x="0"
              y="5"
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill="#FFFFFF"
            >
              {k}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------------- The demo ---------------- */

export default function RotationPattern() {
  const id = useId();
  const uid = id.replace(/:/g, "");
  const [choice, setChoice] = useState(ROTATION_DEFAULTS);
  const [moved, setMoved] = useState(false);
  const pattern = rotationPattern(choice) ?? rotationPattern(ROTATION_DEFAULTS);

  // A new choice puts the tires back where they start.
  const pick = (key) => (value) => {
    setChoice((c) => ({ ...c, [key]: value }));
    setMoved(false);
  };

  return (
    <DemoShell
      demoId="rotation-pattern"
      title="Tire rotation pattern"
      intro="Pick your drivetrain and tire type, then watch where each tire goes."
      sources={SOURCES_USED}
    >
      <style>{MOVE_CSS}</style>
      <div className="space-y-5">
        <RadioCards
          legend="Drivetrain"
          name={`${uid}-drive`}
          value={choice.drivetrain}
          onChange={pick("drivetrain")}
          options={DRIVETRAINS}
          className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        />
        <RadioCards
          legend="Tread type"
          name={`${uid}-tread`}
          value={choice.tread}
          onChange={pick("tread")}
          options={TREAD_TYPES}
          className="grid-cols-1 sm:grid-cols-2"
        />
        <RadioCards
          legend="Setup"
          name={`${uid}-setup`}
          value={choice.setup}
          onChange={pick("setup")}
          options={SETUPS}
          className="grid-cols-1 sm:grid-cols-2"
        />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,260px)_1fr] md:gap-6">
        <div>
          <div className="overflow-hidden rounded-sm border border-ink/10">
            <TopView
              pattern={pattern}
              moved={moved}
              titleId={`${id}-svgt`}
              descId={`${id}-svgd`}
            />
          </div>
          <p
            aria-live="polite"
            className="mt-2 text-center text-[13px] font-semibold leading-snug text-smoke"
          >
            {moved
              ? "Showing: where each tire ends up (labels show where it started)"
              : "Showing: where each tire starts"}
          </p>
          <button
            type="button"
            onClick={() => setMoved((m) => !m)}
            disabled={!pattern.rotates}
            className="btn-dark btn-sm mt-3 min-h-[44px] w-full"
          >
            {moved ? (
              <RotateCcw size={16} aria-hidden="true" />
            ) : (
              <Shuffle size={16} aria-hidden="true" />
            )}
            {moved ? "Put them back" : "Show the move"}
          </button>
        </div>

        <div
          aria-live="polite"
          aria-atomic="true"
          className="self-start rounded-sm border-l-4 border-ink bg-fog p-4"
        >
          <p className="font-display text-[1.25rem] font-extrabold leading-tight text-ink">
            {pattern.name}
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">
            {pattern.why}
          </p>
          <h4 className="mt-4 font-display text-[14px] font-bold text-ink">
            Where each tire goes
          </h4>
          <ul className="mt-2 space-y-1.5 text-[15px] leading-relaxed text-ink">
            {pattern.steps.map((s) => (
              <li key={s.from} className="flex gap-2">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex h-6 min-w-[2.25rem] items-center justify-center rounded-sm bg-graphite px-1 font-display text-[12px] font-bold text-bone"
                >
                  {s.from}
                </span>
                <span>{s.text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[14px] leading-relaxed text-smoke">
            {pattern.interval}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <a
          href="/schedule?service=tire-rotation"
          className="btn-primary btn-sm min-h-[44px]"
        >
          Book a tire rotation
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
    </DemoShell>
  );
}
