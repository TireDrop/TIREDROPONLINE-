// D13 Can this tire be repaired? (learn-plan §4, "Damage & Repairability Map").
//
// Tap a zone on a tire cross-section (or pick it from the list) and pick the
// kind of damage. The result is what USTMA and TIA repair practice says, from
// assessDamage() in repairabilityLogic.js, and it always ends with "A
// technician must inspect the inside of the tire" and a booking link.
//
// The diagram is a pointer shortcut; the two select lists are the full,
// keyboard-operable control. Zone colour changes are CSS transitions, off
// under prefers-reduced-motion, and the selected zone is also named in text.

import React, { useId, useState } from "react";
import { ArrowRight } from "lucide-react";

import { DemoShell, StatusBadge } from "./DemoShell.jsx";
import {
  DAMAGES,
  ZONES,
  assessDamage,
  describeSelection,
} from "./repairabilityLogic.js";

const SOURCES_USED = ["S14", "S19", "S37", "S39", "S1"];

/* ---------------- Cross-section ---------------- */

// Left and right halves of the same zone share an id.
const ZONE_SHAPES = {
  center: ["M112 34 H208 V76 H112 Z"],
  shoulder: [
    "M52 52 Q58 34 112 34 V76 H56 Q46 66 52 52 Z",
    "M268 52 Q262 34 208 34 V76 H264 Q274 66 268 52 Z",
  ],
  sidewall: [
    "M56 76 H94 V178 H64 Q44 128 56 76 Z",
    "M264 76 H226 V178 H256 Q276 128 264 76 Z",
  ],
  bead: ["M64 178 H112 V210 H74 Z", "M256 178 H208 V210 H246 Z"],
};

const ZONE_LABELS = [
  { zone: "center", x: 160, y: 60, text: "Center tread" },
  { zone: "shoulder", x: 84, y: 60, text: "Shoulder", size: 10.5 },
  { zone: "sidewall", x: 75, y: 128, text: "Sidewall", vertical: true },
  { zone: "bead", x: 90, y: 199, text: "Bead" },
];

function TireSection({ zone, onPick, titleId, descId, selectionText }) {
  return (
    <svg
      viewBox="0 0 320 236"
      className="mx-auto h-auto w-full max-w-[380px]"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
    >
      <title id={titleId}>Tire cross-section with four zones</title>
      <desc id={descId}>
        {`A tire cut across, sitting on its wheel. The center tread runs across the top middle, the shoulders are the top corners, the sidewalls run down each side and the beads sit at the bottom where the tire meets the wheel. Selected: ${selectionText}`}
      </desc>

      <rect x="0" y="0" width="320" height="236" fill="#F4F6FA" />

      {/* Inside of the tire */}
      <path
        d="M94 76 H226 V178 H94 Z"
        fill="#FFFFFF"
        stroke="#586274"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
      <text
        x="160"
        y="118"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill="#586274"
      >
        Inside
      </text>
      <text x="160" y="134" textAnchor="middle" fontSize="11" fill="#586274">
        (inner liner)
      </text>

      {/* Wheel */}
      <rect x="104" y="172" width="112" height="56" rx="6" fill="#586274" />
      <text
        x="160"
        y="208"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill="#FFFFFF"
      >
        Wheel
      </text>

      {/* Zones */}
      {ZONES.map((z) => {
        const selected = z.id === zone;
        return (
          <g
            key={z.id}
            onClick={() => onPick(z.id)}
            className="cursor-pointer"
          >
            {ZONE_SHAPES[z.id].map((d) => (
              <path
                key={d}
                d={d}
                fill={selected ? "#0068E8" : "#22344C"}
                stroke={selected ? "#070E1A" : "#FFFFFF"}
                strokeWidth={selected ? 3 : 2}
                className="transition-colors motion-reduce:transition-none"
              />
            ))}
          </g>
        );
      })}

      {/* Text labels, so zones never rely on colour */}
      {ZONE_LABELS.map((l) => (
        <text
          key={l.zone}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          fontSize={l.size ?? 11.5}
          fontWeight={l.zone === zone ? "800" : "700"}
          fill="#FFFFFF"
          pointerEvents="none"
          transform={l.vertical ? `rotate(-90 ${l.x} ${l.y})` : undefined}
        >
          {l.text}
        </text>
      ))}

      {/* A pointer to the selected zone, drawn above the tire */}
      {zone === "center" && (
        <path d="M160 6 L154 18 H166 Z" fill="#070E1A" />
      )}
      {zone === "shoulder" && (
        <path d="M60 22 L56 34 L70 30 Z" fill="#070E1A" />
      )}
      {zone === "sidewall" && (
        <path d="M30 128 L44 122 V134 Z" fill="#070E1A" />
      )}
      {zone === "bead" && (
        <path d="M50 206 L64 200 V212 Z" fill="#070E1A" />
      )}
    </svg>
  );
}

/* ---------------- Controls ---------------- */

function SelectField({ id, label, value, onChange, options, hint }) {
  return (
    <div>
      <label htmlFor={id} className="font-display text-[13px] font-bold text-ink">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="mt-1.5 block min-h-[44px] w-full rounded-sm border border-ink/20 bg-bone px-3 py-2 text-[16px] text-ink"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] leading-snug text-smoke">
          {hint}
        </p>
      )}
    </div>
  );
}

/* ---------------- The demo ---------------- */

export default function RepairabilityMap() {
  const id = useId();
  const [zone, setZone] = useState("center");
  const [damage, setDamage] = useState("puncture-small");
  const result = assessDamage(zone, damage);
  const zoneInfo = ZONES.find((z) => z.id === zone);
  const selectionText = describeSelection(zone, damage);

  return (
    <DemoShell
      demoId="damage-map"
      title="Can this tire be repaired?"
      intro="Pick where the damage is and what it looks like. See what industry repair practice says, then book an inspection."
      sources={SOURCES_USED}
    >
      <div className="grid gap-5 md:grid-cols-[1.1fr_1fr] md:gap-6">
        <div className="min-w-0">
          <div className="overflow-hidden rounded-sm border border-ink/10">
            <TireSection
              zone={zone}
              onPick={setZone}
              titleId={`${id}-svgt`}
              descId={`${id}-svgd`}
              selectionText={selectionText}
            />
          </div>
          <p className="mt-2 text-[13px] leading-snug text-smoke">
            Tap a zone on the diagram, or use the list.{" "}
            <span className="font-bold text-ink">Selected:</span>{" "}
            {zoneInfo.label}. {zoneInfo.hint}.
          </p>
        </div>

        <div className="grid content-start gap-4">
          <SelectField
            id={`${id}-zone`}
            label="Where is it?"
            value={zone}
            onChange={setZone}
            options={ZONES.map((z) => ({ id: z.id, label: z.label }))}
          />
          <SelectField
            id={`${id}-damage`}
            label="What is it?"
            value={damage}
            onChange={setDamage}
            options={DAMAGES}
            hint="1/4 in is about 6 mm. If you can't tell, a technician can measure it."
          />
        </div>
      </div>

      <div
        aria-live="polite"
        aria-atomic="true"
        className="mt-5 rounded-sm border-l-4 border-ink bg-fog p-4"
      >
        <p className="sr-only">{selectionText}</p>
        <StatusBadge status={result.status} />
        <p className="mt-3 font-display text-[1.2rem] font-extrabold leading-tight text-ink">
          {result.headline}
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-ink">
          {result.body}
        </p>
        {result.standard && (
          <>
            <h4 className="mt-4 font-display text-[14px] font-bold text-ink">
              The USTMA and TIA repair standard
            </h4>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[14px] leading-relaxed text-ink marker:font-bold">
              {result.standard.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </>
        )}
        <p className="mt-4 font-display text-[15px] font-bold text-ink">
          {result.closing}
        </p>
      </div>

      <p className="mt-3">
        <a
          href={result.bookingHref}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-sm bg-drop px-4 font-display text-[15px] font-bold text-bone hover:bg-dive"
        >
          Book a tire repair inspection
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </p>
      <p className="mt-2 text-[13px] leading-snug text-smoke">
        Installation and repair service is South Florida only. This demo is a
        guide to industry practice, not a diagnosis of your tire.
      </p>
    </DemoShell>
  );
}
