// Wheel offset and clearance check: a current wheel and a new one, compared by
// how far the wheel face and inside edge move (mm and inches), backspacing,
// and, when both tire sizes are typed, the tire's width, diameter and sidewall
// moves. The arithmetic is in offsetLogic.js (tire math from tireMath.js).
//
// Rules risk: this demo never says a combination "fits", is "safe" or "OK",
// or "will clear". The three bands are generic geometry guides, and the
// page says clearance also depends on the vehicle and that TireDrop confirms
// fitment by phone before any wheel ships.

import React, { useId, useState } from "react";
import { AlertTriangle, ArrowRight, Info, PhoneCall, Ruler, SearchCheck } from "lucide-react";

import { ChipButton, DemoShell } from "./DemoShell.jsx";
import { readSize } from "./fitmentLogic.js";
import { BUSINESS } from "../../data/business.js";
import {
  OFFSET_DEFAULTS,
  OFFSET_EXAMPLES,
  OFFSET_NOTE,
  compareWheels,
  readWheel,
} from "./offsetLogic.js";

const SOURCES_USED = ["S42", "S36"];

/** The eight boxes, flat, so one example fills them all. */
const toForm = (ex) => ({
  cw: ex.current.width,
  co: ex.current.offset,
  cd: ex.current.diameter,
  ct: ex.tires.current,
  nw: ex.next.width,
  no: ex.next.offset,
  nd: ex.next.diameter,
  nt: ex.tires.next,
});
const sameForm = (a, b) => Object.keys(a).every((k) => a[k] === b[k]);

const BAND_STYLE = {
  close: { cls: "bg-sky text-dive ring-1 ring-inset ring-drop/25", Icon: Ruler },
  different: { cls: "bg-amber text-ink", Icon: SearchCheck },
  large: { cls: "bg-ink text-bone", Icon: PhoneCall },
};

/** The band's words with an icon, so tone is never carried by color alone. */
function BandBadge({ band }) {
  const { cls, Icon } = BAND_STYLE[band.key];
  return (
    <span
      className={`inline-flex items-start gap-1.5 rounded-sm px-2.5 py-1.5 font-display text-[14px] font-bold leading-snug ${cls}`}
    >
      <Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
      {band.label}
    </span>
  );
}

function Field({ id, label, hint, unit, value, onChange, error, mono, ...rest }) {
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="font-display text-[13px] font-bold text-ink">
        {label}
        {unit && <span className="font-normal text-smoke"> ({unit})</span>}
      </label>
      <input
        id={id}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={[error ? errId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined}
        className={`mt-1.5 block min-h-[44px] w-full rounded-sm border bg-bone px-3 py-2.5 text-[18px] text-ink placeholder:text-smoke/70 ${
          mono ? "font-mono tracking-[0.02em]" : "tnum"
        } ${error ? "border-2 border-amberInk" : "border-ink/20"}`}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1 text-[12px] leading-snug text-smoke">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errId}
          className="mt-1.5 flex gap-1.5 text-[14px] font-semibold leading-snug text-amberInk"
        >
          <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/** One wheel's four boxes: width, offset, diameter (optional), tire size (optional). */
function WheelFields({ id, title, form, keys, set, wheel, tireError }) {
  const [w, o, d, t] = keys;
  return (
    <fieldset className="min-w-0 rounded-sm border border-ink/15 p-3.5 sm:p-4">
      <legend className="px-1.5 font-display text-[15px] font-extrabold text-ink">{title}</legend>
      <div className="grid grid-cols-2 gap-3">
        <Field
          id={`${id}-w`}
          label="Width"
          unit="in"
          type="number"
          step="any"
          inputMode="decimal"
          placeholder="9"
          value={form[w]}
          onChange={(v) => set(w, v)}
          error={wheel.errors.width}
        />
        <Field
          id={`${id}-o`}
          label="Offset"
          unit="mm"
          type="number"
          step="any"
          inputMode="decimal"
          placeholder="18"
          value={form[o]}
          onChange={(v) => set(o, v)}
          error={wheel.errors.offset}
        />
        <Field
          id={`${id}-d`}
          label="Diameter"
          unit="in, optional"
          type="number"
          step="any"
          inputMode="decimal"
          placeholder="20"
          value={form[d]}
          onChange={(v) => set(d, v)}
          error={wheel.errors.diameter}
        />
        <Field
          id={`${id}-t`}
          label="Tire size"
          unit="optional"
          type="text"
          mono
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={32}
          placeholder="275/55R20"
          value={form[t]}
          onChange={(v) => set(t, v)}
          error={tireError}
        />
      </div>
    </fieldset>
  );
}

/**
 * Both wheels and their tires on one scale, seen from above: the suspension
 * on the left, the fender on the right, the hub's mounting surface as the
 * vertical line the two rows are measured from.
 */
function Drawing({ result, uid }) {
  const { current, next } = result.positions;
  const edges = [current, next].flatMap((p) => [p.wheel.inner, p.wheel.outer, p.tire?.inner, p.tire?.outer]);
  const nums = edges.filter((x) => typeof x === "number");
  const lo = Math.min(...nums, -40);
  const hi = Math.max(...nums, 40);
  const pad = 14;
  const W = 320;
  const span = hi - lo;
  const x = (mm) => pad + ((mm - lo) / span) * (W - pad * 2);
  const zero = x(0);
  const rows = [
    { p: current, y: 34, name: "Current" },
    { p: next, y: 112, name: "New" },
  ];
  const desc = `Seen from above, with the suspension on the left and the fender on the right. The new wheel's outer edge is ${
    Math.abs(result.outerMm) < 0.05 ? "in the same place as" : result.outerMm > 0 ? "further out than" : "further in than"
  } the current wheel's, and its inner edge is ${
    Math.abs(result.innerMm) < 0.05 ? "in the same place" : result.innerMm > 0 ? "closer to the suspension" : "further from the suspension"
  }.`;
  return (
    <svg
      viewBox={`0 0 ${W} 176`}
      className="mx-auto h-auto w-full max-w-[420px]"
      role="img"
      aria-labelledby={`${uid}t ${uid}d`}
    >
      <title id={`${uid}t`}>Current and new wheel, seen from above</title>
      <desc id={`${uid}d`}>{desc}</desc>
      <text x="6" y="12" fontSize="11" fontWeight="700" fill="#586274">← Suspension</text>
      <text x={W - 6} y="12" fontSize="11" fontWeight="700" fill="#586274" textAnchor="end">Fender →</text>
      {rows.map(({ p, y, name }, i) => (
        <g key={name}>
          <text x="6" y={y - 6} fontSize="11" fontWeight="700" fill="#101C2E">{name}</text>
          {p.tire && (
            <rect
              x={x(p.tire.inner)}
              y={y}
              width={x(p.tire.outer) - x(p.tire.inner)}
              height="44"
              rx="6"
              fill={i === 0 ? "none" : "#DCE6F2"}
              stroke={i === 0 ? "#F5A623" : "#586274"}
              strokeWidth={i === 0 ? 2.5 : 1}
              strokeDasharray={i === 0 ? "6 4" : undefined}
            />
          )}
          <rect
            x={x(p.wheel.inner)}
            y={y + 8}
            width={x(p.wheel.outer) - x(p.wheel.inner)}
            height="28"
            rx="3"
            fill={i === 0 ? "none" : "#101C2E"}
            stroke={i === 0 ? "#F5A623" : "#101C2E"}
            strokeWidth={i === 0 ? 3 : 1}
            strokeDasharray={i === 0 ? "7 4" : undefined}
          />
        </g>
      ))}
      <line x1={zero} y1="20" x2={zero} y2="164" stroke="#586274" strokeWidth="1.5" strokeDasharray="2 3" />
      <text x={zero} y="174" fontSize="10" fontWeight="700" fill="#586274" textAnchor="middle">
        Mounting surface
      </text>
    </svg>
  );
}

const LINK_CLS =
  "inline-flex min-h-[44px] items-center gap-1.5 font-display text-[15px] font-bold text-dive underline decoration-1 underline-offset-2 hover:text-ink";

export default function WheelOffsetCalculator() {
  const id = useId();
  const uid = id.replace(/:/g, "");
  const [form, setForm] = useState(() => toForm(OFFSET_DEFAULTS));
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const current = { width: form.cw, offset: form.co, diameter: form.cd };
  const next = { width: form.nw, offset: form.no, diameter: form.nd };
  const tires = { current: form.ct, next: form.nt };
  const result = compareWheels({ current, next, tires });
  const compared = result.state === "compared";

  // Field-level errors, shown as they are typed even before both wheels read.
  const curWheel = compared ? result.current : readWheel(current);
  const nextWheel = compared ? result.next : readWheel(next);
  const tireError = (text) => {
    const t = readSize(text);
    return t.state === "error" ? t.message : undefined;
  };

  const waitingText = (() => {
    if (compared) return "";
    for (const [which, w] of [["Current", curWheel], ["New", nextWheel]]) {
      const first = Object.values(w.errors)[0];
      if (first) return `${which} wheel: ${first}`;
    }
    return "Type the width and offset of both wheels to compare them.";
  })();

  const tireHint = (() => {
    if (!compared || result.tire) return "";
    const problem = result.tireProblems.current ?? result.tireProblems.next;
    if (problem) return `Tire sizes: ${problem}`;
    if (result.oneTire) return "Type both tire sizes to also see the tire's width, diameter and sidewall moves.";
    return "Add both tire sizes to also see the tire's width, diameter and sidewall moves.";
  })();

  return (
    <DemoShell
      demoId="wheel-offset"
      title="Wheel offset and clearance check"
      intro="Enter the wheel you have and the wheel you're looking at. See how far the face and the inside edge move, in millimeters and inches."
      sources={SOURCES_USED}
    >
      <p className="rounded-sm bg-fog px-3.5 py-2.5 text-[14px] leading-snug text-smoke">
        <strong className="font-bold text-ink">Example loaded.</strong> The numbers below are a
        sample, not your vehicle. Replace them with yours, or try another example.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <WheelFields
          id={`${id}-cur`}
          title="Current wheel"
          form={form}
          keys={["cw", "co", "cd", "ct"]}
          set={set}
          wheel={curWheel}
          tireError={tireError(form.ct)}
        />
        <WheelFields
          id={`${id}-new`}
          title="New wheel"
          form={form}
          keys={["nw", "no", "nd", "nt"]}
          set={set}
          wheel={nextWheel}
          tireError={tireError(form.nt)}
        />
      </div>
      <p className="mt-2 text-[13px] leading-snug text-smoke">
        Width is the number after the x in a size like 20x9. Offset is stamped on the back of the
        wheel after ET, and can be negative.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="sr-only">Examples:</span>
        {OFFSET_EXAMPLES.map((ex) => (
          <ChipButton
            key={ex.label}
            pressed={sameForm(form, toForm(ex))}
            onClick={() => setForm(toForm(ex))}
            label={`Example: ${ex.label}`}
          >
            {ex.label}
          </ChipButton>
        ))}
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {compared ? result.live : waitingText}
      </p>

      {compared ? (
        <div className="mt-5">
          <div className="rounded-sm border-l-4 border-ink bg-fog p-4">
            <p className="font-display text-[12px] font-bold uppercase tracking-[0.07em] text-smoke">
              Overall
            </p>
            <div className="mt-1.5">
              <BandBadge band={result.overall} />
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-ink">
              {result.same ? "The two setups are the same." : result.headline} The biggest move decides
              this headline. See each result below.
            </p>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-[1fr_minmax(0,300px)] md:gap-6">
            <div className="min-w-0">
              <h4 className="font-display text-[13px] font-bold text-ink">What moves</h4>
              <ul className="mt-1.5 divide-y divide-ink/[0.08] border-y border-ink/[0.08]">
                {result.rows.map((r) => (
                  <li key={r.key} className="py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <p className="text-[14px] font-semibold text-smoke">{r.label}</p>
                      <p className="tnum font-display text-[1.1rem] font-extrabold leading-tight text-ink">
                        {r.change}
                        {r.detail && (
                          <span className="ml-1.5 text-[0.9rem] font-bold text-smoke">{r.detail}</span>
                        )}
                      </p>
                    </div>
                    <div className="mt-1.5">
                      <BandBadge band={r.band} />
                    </div>
                  </li>
                ))}
              </ul>
              {tireHint && <p className="mt-2 text-[13px] leading-snug text-smoke">{tireHint}</p>}
            </div>

            <div className="min-w-0">
              <Drawing result={result} uid={uid} />
              <p className="mt-2 text-[13px] leading-snug text-smoke">
                <span className="font-bold text-ink">Dashed outline:</span> current.{" "}
                <span className="font-bold text-ink">Solid:</span> new. The wheel is the darker bar
                {result.tire ? " and the tire the lighter one around it" : ""}. Both are measured from
                the mounting surface.
              </p>

              <table className="mt-4 w-full table-fixed text-left text-[13px] leading-snug text-ink sm:text-[14px]">
                <caption className="pb-1.5 text-left font-display text-[13px] font-bold">Backspacing</caption>
                <thead>
                  <tr className="border-b border-ink/15 text-smoke">
                    <th scope="col" className="py-1.5 pr-2 font-display font-bold">Current</th>
                    <th scope="col" className="py-1.5 font-display font-bold">New</th>
                  </tr>
                </thead>
                <tbody className="tnum">
                  <tr className="border-b border-ink/[0.07] align-top">
                    <td className="break-words py-1.5 pr-2">{result.backspace.current.text}</td>
                    <td className="break-words py-1.5">{result.backspace.next.text}</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-2 text-[13px] leading-snug text-smoke">
                Backspacing is half the width plus the offset, from the mounting surface to the back lip.
                Nominal figures: the wheel&apos;s real lip-to-lip width runs a little over the size.
              </p>
            </div>
          </div>

          {result.notes.length > 0 && (
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-[14px] leading-snug text-ink">
              {result.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="mt-5 rounded-sm bg-fog p-4 text-[15px] text-smoke">{waitingText}</p>
      )}

      <p className="mt-4 flex gap-2 rounded-sm border border-amberInk/30 bg-amber/10 p-3.5 text-[14px] leading-relaxed text-ink">
        <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-amberInk" />
        <span>
          <strong>{OFFSET_NOTE.split(/(?<=\.) /)[0]}</strong> {OFFSET_NOTE.split(/(?<=\.) /).slice(1).join(" ")}
        </span>
      </p>

      <div className="mt-3 flex flex-col gap-x-6 sm:flex-row sm:flex-wrap">
        <a href={BUSINESS.phoneHref} className={LINK_CLS}>
          <PhoneCall size={16} aria-hidden="true" className="shrink-0" />
          Call {BUSINESS.phone}
        </a>
        <a href="/wheels?view=fitment" className={LINK_CLS}>
          Wheel fitment guidance
          <ArrowRight size={16} aria-hidden="true" className="shrink-0" />
        </a>
        <a href="/learn/fitment/wheel-offset-backspacing" className={LINK_CLS}>
          Offset and backspacing explained
          <ArrowRight size={16} aria-hidden="true" className="shrink-0" />
        </a>
      </div>
    </DemoShell>
  );
}
