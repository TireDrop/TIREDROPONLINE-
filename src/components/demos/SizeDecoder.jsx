// D3 Size Decoder (learn-plan §4): a compact, embeddable version of the
// /tire-size tool. Parsing and geometry are parseSize() and sizeGeometry()
// from tireMath.js, via decodeSize(), which adds LT dual load indexes, XL and
// load/speed after flotation sizes.

import React, { useId, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { ChipButton, DemoShell, Stat } from "./DemoShell.jsx";
import { SIZE_EXAMPLES, decodeSize } from "./demoLogic.js";

const SOURCES_USED = ["S3", "S36", "S35", "S54"];

// Tints for the segment chips. The number badge and the label carry the
// meaning; the tint only helps the eye match chip to explanation.
const ROLE_TINT = {
  service: "bg-ink/[0.07]",
  diameter: "bg-amber/25",
  width: "bg-sky",
  aspect: "bg-amber/25",
  construction: "bg-ink/[0.07]",
  rim: "bg-sky",
  load: "bg-amber/25",
  speed: "bg-ink/[0.07]",
  xl: "bg-sky",
};

function SideView({ geometry, uid }) {
  const scale = 212 / 36; // viewBox units per inch; a 36-inch tire fills it
  const ro = (geometry.overallDiameterIn / 2) * scale;
  const rr = (geometry.rimDiameterIn / 2) * scale;
  const c = 120;
  return (
    <svg
      viewBox="0 0 240 240"
      className="mx-auto h-auto w-full max-w-[240px]"
      role="img"
      aria-labelledby={`${uid}t ${uid}d`}
    >
      <title id={`${uid}t`}>Tire side view, drawn to scale</title>
      <desc id={`${uid}d`}>
        {`A ${geometry.rimDiameterIn}-inch wheel inside a tire ${geometry.diameterText} tall overall, with a sidewall ${geometry.sidewallText} tall. The outer dashed circle is 36 inches for scale.`}
      </desc>
      <circle
        cx={c}
        cy={c}
        r={106}
        fill="none"
        stroke="#586274"
        strokeWidth="1"
        strokeDasharray="3 4"
      />
      <circle cx={c} cy={c} r={ro} fill="#101C2E" />
      <circle
        cx={c}
        cy={c}
        r={ro - 4}
        fill="none"
        stroke="#22344C"
        strokeWidth="5"
        strokeDasharray="6 5"
      />
      <circle cx={c} cy={c} r={rr} fill="#C9D3E0" stroke="#586274" strokeWidth="1.5" />
      <circle cx={c} cy={c} r={rr * 0.3} fill="#9FB3CC" />
      {[0, 72, 144, 216, 288].map((a) => (
        <line
          key={a}
          x1={c}
          y1={c}
          x2={c + rr * 0.9 * Math.cos((a * Math.PI) / 180)}
          y2={c + rr * 0.9 * Math.sin((a * Math.PI) / 180)}
          stroke="#586274"
          strokeWidth="5"
          strokeLinecap="round"
        />
      ))}
      {/* Sidewall bracket, top */}
      <g stroke="#F5A623" strokeWidth="3">
        <line x1={c} y1={c - rr} x2={c} y2={c - ro} />
        <line x1={c - 8} y1={c - rr} x2={c + 8} y2={c - rr} />
        <line x1={c - 8} y1={c - ro} x2={c + 8} y2={c - ro} />
      </g>
      {/* Diameter, left edge */}
      <g stroke="#0068E8" strokeWidth="2">
        <line x1={c - ro - 6} y1={c - ro} x2={c - ro - 6} y2={c + ro} />
        <line x1={c - ro - 11} y1={c - ro} x2={c - ro - 1} y2={c - ro} />
        <line x1={c - ro - 11} y1={c + ro} x2={c - ro - 1} y2={c + ro} />
      </g>
    </svg>
  );
}

export default function SizeDecoder() {
  const id = useId();
  const uid = id.replace(/:/g, "");
  const [value, setValue] = useState(SIZE_EXAMPLES[0]);
  const [selected, setSelected] = useState(null);
  const result = decodeSize(value);
  const decoded = result.state === "decoded";
  const invalid = result.state === "error";
  const active = decoded
    ? (result.parts.find((p) => p.role === selected) ?? null)
    : null;

  const live = decoded
    ? `${result.parts.length} parts decoded. Sidewall ${result.geometry.sidewallText}, overall diameter ${result.geometry.diameterText}.`
    : (result.message ?? "");

  return (
    <DemoShell
      demoId="size-decoder"
      title="Tire size decoder"
      intro="Type the size from your sidewall or door placard to see what each part means."
      sources={SOURCES_USED}
    >
      <label
        htmlFor={`${id}-size`}
        className="font-display text-[13px] font-bold text-ink"
      >
        Tire size
      </label>
      <input
        id={`${id}-size`}
        type="text"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={32}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSelected(null);
        }}
        placeholder="e.g. 225/45R17 94W"
        aria-describedby={`${id}-hint${invalid ? ` ${id}-err` : ""}`}
        aria-invalid={invalid || undefined}
        className={`mt-1.5 block min-h-[44px] w-full rounded-sm border bg-bone px-3.5 py-2.5 font-mono text-[18px] tracking-[0.04em] text-ink placeholder:text-smoke/70 ${
          invalid ? "border-2 border-amberInk" : "border-ink/20"
        }`}
      />
      <p id={`${id}-hint`} className="mt-1.5 text-[13px] leading-snug text-smoke">
        Metric (225/45R17 94W), light truck (LT265/70R17 121/118S) and
        flotation (33x12.50R20) sizes all work.
      </p>
      {invalid && (
        <p
          id={`${id}-err`}
          className="mt-1.5 flex gap-1.5 text-[14px] font-semibold leading-snug text-amberInk"
        >
          <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          {result.message}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="sr-only">Examples:</span>
        {SIZE_EXAMPLES.map((ex) => (
          <ChipButton
            key={ex}
            pressed={value === ex}
            onClick={() => {
              setValue(ex);
              setSelected(null);
            }}
            label={`Try ${ex}`}
          >
            {ex}
          </ChipButton>
        ))}
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {live}
      </p>

      {decoded ? (
        <div className="mt-5">
          <p className="mb-2 font-display text-[13px] font-bold text-ink">
            Tap a part to highlight its meaning
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Size parts">
            {result.parts.map((p) => (
              <button
                key={p.role}
                type="button"
                aria-pressed={selected === p.role}
                aria-describedby={`${id}-dd-${p.role}`}
                onClick={() =>
                  setSelected((s) => (s === p.role ? null : p.role))
                }
                className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-sm px-2.5 py-1.5 ${ROLE_TINT[p.role]} ${
                  selected === p.role
                    ? "ring-2 ring-inset ring-ink"
                    : "ring-1 ring-inset ring-ink/15 hover:ring-ink/40"
                }`}
              >
                <span className="font-mono text-[1.3rem] font-bold leading-none text-ink">
                  {p.token}
                </span>
                <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold leading-none text-smoke">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[10px] text-bone">
                    {p.n}
                  </span>
                  {p.title}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-[1fr_240px] md:gap-6">
            <dl className="space-y-2.5">
              {result.parts.map((p) => (
                <div
                  key={p.role}
                  className={`rounded-sm p-3 ${
                    active?.role === p.role
                      ? "bg-sky ring-2 ring-drop"
                      : "bg-fog"
                  }`}
                >
                  <dt className="flex items-center gap-2 font-display text-[14px] font-bold text-ink">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[11px] text-bone"
                    >
                      {p.n}
                    </span>
                    {p.title}
                    <span className="font-mono text-smoke">{p.token}</span>
                  </dt>
                  <dd
                    id={`${id}-dd-${p.role}`}
                    className="mt-1 text-[14px] leading-relaxed text-ink"
                  >
                    {p.text}
                  </dd>
                </div>
              ))}
            </dl>
            <div>
              <SideView geometry={result.geometry} uid={uid} />
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1">
                <Stat label="Sidewall height" value={result.geometry.sidewallText} />
                <Stat
                  label="Overall diameter"
                  value={result.geometry.diameterText}
                />
              </div>
              <p className="mt-2 text-[13px] leading-snug text-smoke">
                Nominal figures worked out from the size. Real dimensions vary
                a little by tire model and wheel width. When buying, start
                from the size on your door placard.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-sm bg-fog p-4 text-[15px] text-smoke">
          {result.state === "error"
            ? "Check the size and try again."
            : (result.message ?? "Type a size to decode it.")}
        </p>
      )}
    </DemoShell>
  );
}
