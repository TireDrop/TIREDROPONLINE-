// D11 TPMS Light Explainer (learn-plan §4): pick what the dash light is
// doing, see what FMVSS No. 138 says it means and what to do next.
//
// The "flashing" state blinks once a second (well under the 3-per-second
// flash threshold) and only when the reader hasn't asked for reduced motion.
// The behaviour is always also stated in words.

import React, { useId, useState } from "react";

import { DemoShell, RadioCards, StatusBadge } from "./DemoShell.jsx";
import { TPMS_STATES } from "./demoLogic.js";

const SOURCES_USED = ["S8", "S1", "S7"];

const BLINK_CSS = `
@keyframes tdxTpmsBlink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: .12 } }
.tdx-tpms-blink { animation: tdxTpmsBlink 1s steps(1, end) infinite; }
@media (prefers-reduced-motion: reduce) { .tdx-tpms-blink { animation: none; } }
`;

/** The standard TPMS telltale: a tire cross-section with an exclamation mark. */
function TpmsIcon({ lit, blink, uid }) {
  const color = lit ? "#F5A623" : "#3A4B63";
  return (
    <svg
      viewBox="0 0 80 72"
      className={`h-20 w-24 ${blink ? "tdx-tpms-blink" : ""}`}
      role="img"
      aria-labelledby={`${uid}t`}
    >
      <title id={`${uid}t`}>
        {lit
          ? `Tire pressure warning light, ${blink ? "flashing" : "lit"}`
          : "Tire pressure warning light, off"}
      </title>
      <g
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 10 C8 20 6 42 16 56 L64 56 C74 42 72 20 62 10" />
        <path d="M14 64 L18 56 M26 64 L28 56 M40 64 L40 56 M54 64 L52 56 M66 64 L62 56" />
        <line x1="40" y1="18" x2="40" y2="38" />
      </g>
      <circle cx="40" cy="47" r="3.2" fill={color} />
    </svg>
  );
}

export default function TpmsLight() {
  const id = useId();
  const uid = id.replace(/:/g, "");
  const [choice, setChoice] = useState("solid");
  const state = TPMS_STATES.find((s) => s.id === choice) ?? TPMS_STATES[0];

  return (
    <DemoShell
      demoId="tpms-light"
      title="Tire pressure (TPMS) light"
      intro="Pick what the tire pressure light on your dashboard is doing."
      sources={SOURCES_USED}
    >
      <style>{BLINK_CSS}</style>
      <RadioCards
        legend="The light is…"
        name={`${uid}-tpms`}
        value={choice}
        onChange={setChoice}
        options={TPMS_STATES.map((s) => ({
          value: s.id,
          label: s.label,
          hint: s.short,
        }))}
      />

      <div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr] md:gap-6">
        <div className="self-start rounded-sm bg-ink p-4 text-bone">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.07em] text-volt">
            Dashboard
          </p>
          <div className="mt-2 flex justify-center">
            <TpmsIcon
              key={choice}
              uid={uid}
              lit={state.id !== "off"}
              blink={state.id === "flashing"}
            />
          </div>
          {state.id === "flashing" ? (
            <div className="mt-3" aria-hidden="true">
              <div className="flex h-3 overflow-hidden rounded-sm">
                <div
                  className="h-full w-3/5"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(90deg, #F5A623 0 8px, transparent 8px 14px)",
                  }}
                />
                <div className="h-full flex-1 bg-amber" />
              </div>
              <div className="mt-1 flex justify-between text-[12px] font-semibold text-bone/90">
                <span>Start: flashing</span>
                <span>60–90 s: solid</span>
              </div>
            </div>
          ) : null}
          <p className="mt-3 text-center text-[13px] font-semibold text-bone">
            {state.id === "off"
              ? "Light off"
              : state.id === "flashing"
                ? "Flashes for about 60–90 seconds, then stays on"
                : "Light on and steady"}
          </p>
        </div>

        <div aria-live="polite" aria-atomic="true">
          <p className="font-display text-[1.25rem] font-extrabold leading-tight text-ink">
            {state.headline}
          </p>
          <div className="mt-2">
            <StatusBadge status={state.status} />
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-ink">
            {state.meaning}
          </p>
          <h4 className="mt-4 font-display text-[14px] font-bold text-ink">
            What to do
          </h4>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink marker:font-bold">
            {state.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="mt-3 text-[13px] leading-snug text-smoke">
            The light is a warning, not a gauge. NHTSA recommends checking
            pressures yourself even with TPMS.
          </p>
        </div>
      </div>
    </DemoShell>
  );
}
