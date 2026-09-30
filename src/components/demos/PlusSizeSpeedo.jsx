// D6 Plus-size & speedometer (learn-plan §4): a current and a new size,
// compared by overall diameter, sidewall height and revolutions per mile,
// with what the speedometer reads at 30, 45, 60 and 70 mph. The arithmetic
// is parseSize(), sizeGeometry() and compareSizes() from tireMath.js, via
// comparePlusSize() in fitmentLogic.js.
//
// Rules risk (plan §4): this demo never says a size "fits" or is
// "approved". The 3% figure is flagged as a guideline, and the reader is
// told to have fitment confirmed.

import React, { useId, useState } from "react";
import { AlertTriangle, ArrowRight, Info, Ruler } from "lucide-react";

import { ChipButton, DemoShell } from "./DemoShell.jsx";
import Verdict from "./FitmentVerdict.jsx";
import {
  GUIDELINE_NOTE,
  PLUS_SIZE_DEFAULTS,
  PLUS_SIZE_EXAMPLES,
  comparePlusSize,
} from "./fitmentLogic.js";

const SOURCES_USED = ["S42", "C14", "S35"];

// "3% is a guideline, not a fitment approval." in bold, then the rest.
const [NOTE_LEAD, ...NOTE_REST] = GUIDELINE_NOTE.split(/(?<=\.) /);

/** Both tires side by side on one ground line, drawn to the same scale. */
function Overlay({ result, uid }) {
  const fd = result.diameters.from;
  const td = result.diameters.to;
  const scale = 196 / Math.max(fd, td); // viewBox units per inch
  const ground = 214;
  const tire = (d, rim, cx) => ({
    cx,
    cy: ground - (d / 2) * scale,
    ro: (d / 2) * scale,
    rr: (rim / 2) * scale,
  });
  const a = tire(fd, result.rims.from, 120);
  const b = tire(td, result.rims.to, 120);
  return (
    <svg
      viewBox="0 0 240 224"
      className="mx-auto h-auto w-full max-w-[260px]"
      role="img"
      aria-labelledby={`${uid}t ${uid}d`}
    >
      <title id={`${uid}t`}>Current and new size, drawn to the same scale</title>
      <desc id={`${uid}d`}>
        {`The new tire, shown solid, is ${fd === td ? "the same height as" : `${td > fd ? "taller" : "shorter"} than`} the current tire, shown as a dashed outline: ${td.toFixed(1)} inches on a ${result.rims.to}-inch wheel against ${fd.toFixed(1)} inches on a ${result.rims.from}-inch wheel. Both sit on the same ground line.`}
      </desc>
      <line x1="8" y1={ground} x2="232" y2={ground} stroke="#586274" strokeWidth="2" />
      {/* New size, solid */}
      <circle cx={b.cx} cy={b.cy} r={b.ro} fill="#101C2E" />
      <circle cx={b.cx} cy={b.cy} r={b.rr} fill="#C9D3E0" stroke="#586274" strokeWidth="1.5" />
      <circle cx={b.cx} cy={b.cy} r={b.rr * 0.3} fill="#9FB3CC" />
      {/* Current size, dashed outline on top */}
      <circle
        cx={a.cx}
        cy={a.cy}
        r={a.ro}
        fill="none"
        stroke="#F5A623"
        strokeWidth="3"
        strokeDasharray="7 5"
      />
      <circle
        cx={a.cx}
        cy={a.cy}
        r={a.rr}
        fill="none"
        stroke="#F5A623"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
    </svg>
  );
}

function SizeInput({ uid, label, value, onChange, read }) {
  const invalid = read.state === "error";
  return (
    <div className="min-w-0">
      <label htmlFor={uid} className="font-display text-[13px] font-bold text-ink">
        {label}
      </label>
      <input
        id={uid}
        type="text"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={32}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. 225/45R17"
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${uid}-err` : undefined}
        className={`mt-1.5 block min-h-[44px] w-full rounded-sm border bg-bone px-3.5 py-2.5 font-mono text-[18px] tracking-[0.04em] text-ink placeholder:text-smoke/70 ${
          invalid ? "border-2 border-amberInk" : "border-ink/20"
        }`}
      />
      {invalid && (
        <p
          id={`${uid}-err`}
          className="mt-1.5 flex gap-1.5 text-[14px] font-semibold leading-snug text-amberInk"
        >
          <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          {read.message}
        </p>
      )}
    </div>
  );
}

const LINK_CLS =
  "inline-flex min-h-[44px] items-center gap-1.5 font-display text-[15px] font-bold text-dive underline decoration-1 underline-offset-2 hover:text-ink";

export default function PlusSizeSpeedo() {
  const id = useId();
  const uid = id.replace(/:/g, "");
  const [from, setFrom] = useState(PLUS_SIZE_DEFAULTS.from);
  const [to, setTo] = useState(PLUS_SIZE_DEFAULTS.to);
  const result = comparePlusSize(from, to);
  const compared = result.state === "compared";

  const waitingText = (() => {
    if (compared) return "";
    const f = result.from;
    const t = result.to;
    if (f.state === "error") return `Current size: ${f.message}`;
    if (t.state === "error") return `New size: ${t.message}`;
    return "Type both sizes, such as 225/45R17, to compare them.";
  })();

  return (
    <DemoShell
      demoId="plus-size-speedo"
      title="Plus-size & speedometer"
      intro="Going bigger on the wheels? See how the overall size changes and what your speedometer will read."
      sources={SOURCES_USED}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <SizeInput
          uid={`${id}-from`}
          label="Current size"
          value={from}
          onChange={setFrom}
          read={result.from}
        />
        <SizeInput
          uid={`${id}-to`}
          label="New size"
          value={to}
          onChange={setTo}
          read={result.to}
        />
      </div>
      <p className="mt-1.5 text-[13px] leading-snug text-smoke">
        Metric (225/45R17), light truck (LT265/70R17 121/118S) and flotation
        (31x10.50R15) sizes all work. Start from the size on your door placard.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="sr-only">Examples:</span>
        {PLUS_SIZE_EXAMPLES.map((ex) => (
          <ChipButton
            key={ex.label}
            pressed={from === ex.from && to === ex.to}
            onClick={() => {
              setFrom(ex.from);
              setTo(ex.to);
            }}
            label={`${ex.label}: try ${ex.from} to ${ex.to}`}
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
          <div className="grid gap-5 md:grid-cols-[1fr_240px] md:gap-6">
            <div className="min-w-0">
              <div className="rounded-sm border-l-4 border-ink bg-fog p-4">
                <p className="tnum font-display text-[1.6rem] font-extrabold leading-none text-ink">
                  {result.pctText}{" "}
                  <span className="text-[1rem] font-bold text-smoke">
                    overall diameter
                  </span>
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink">
                  {result.diameterSentence}
                </p>
                <p
                  className={`mt-3 inline-flex items-start gap-1.5 rounded-sm px-2.5 py-1.5 font-display text-[14px] font-bold leading-snug ${
                    result.guideline.within
                      ? "bg-sky text-dive ring-1 ring-inset ring-drop/25"
                      : "bg-amber text-ink"
                  }`}
                >
                  {result.guideline.within ? (
                    <Ruler size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                  )}
                  {result.guideline.label}
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-smoke">
                  {result.guideline.text}
                </p>
              </div>

              <table className="mt-4 w-full table-fixed text-left text-[13px] leading-snug text-ink sm:text-[14px]">
                <caption className="pb-1.5 text-left font-display text-[13px] font-bold">
                  {`${result.from.label} → ${result.to.label}`}
                </caption>
                <thead>
                  <tr className="border-b border-ink/15 text-smoke">
                    <td className="w-[32%] py-1.5 pr-2" />
                    <th scope="col" className="py-1.5 pr-2 font-display font-bold">
                      Current
                    </th>
                    <th scope="col" className="py-1.5 pr-2 font-display font-bold">
                      New
                    </th>
                    <th scope="col" className="w-[22%] py-1.5 font-display font-bold">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="tnum">
                  {result.rows.map((r) => (
                    <tr key={r.key} className="border-b border-ink/[0.07] align-top">
                      <th scope="row" className="break-words py-1.5 pr-2 font-semibold text-smoke">
                        {r.label}
                        {r.sub && (
                          <span className="block text-[12px] font-normal">
                            {r.sub}
                          </span>
                        )}
                      </th>
                      <td className="break-words py-1.5 pr-2">{r.from}</td>
                      <td className="break-words py-1.5 pr-2">{r.to}</td>
                      <td className="break-words py-1.5 font-semibold">{r.change}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[13px] leading-snug text-smoke">
                Nominal figures worked out from the sizes. Real dimensions vary
                a little by tire model and wheel width, and a loaded tire turns
                slightly more times per mile.
              </p>
            </div>

            <div className="min-w-0">
              <Overlay result={result} uid={uid} />
              <p className="mt-2 text-[13px] leading-snug text-smoke">
                <span className="font-bold text-ink">Dashed outline:</span>{" "}
                current size. <span className="font-bold text-ink">Solid:</span>{" "}
                new size.
              </p>

              <table className="mt-4 w-full text-left text-[14px] text-ink">
                <caption className="pb-1.5 text-left font-display text-[13px] font-bold">
                  Speedometer
                </caption>
                <thead>
                  <tr className="border-b border-ink/15 text-smoke">
                    <th scope="col" className="py-1.5 pr-2 font-display font-bold">
                      Speedometer says
                    </th>
                    <th scope="col" className="py-1.5 font-display font-bold">
                      You&apos;re actually going
                    </th>
                  </tr>
                </thead>
                <tbody className="tnum">
                  {result.speedo.map((s) => (
                    <tr key={s.indicated} className="border-b border-ink/[0.07]">
                      <th scope="row" className="py-1.5 pr-2 font-semibold">
                        {`${s.indicated} mph`}
                      </th>
                      <td className="py-1.5">{s.actualText}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[14px] leading-relaxed text-ink">
                {result.speedoSentence}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-sm bg-fog p-3.5">
            <p className="font-display text-[12px] font-bold uppercase tracking-[0.07em] text-smoke">
              Load index
            </p>
            {result.load.verdict && (
              <div className="mt-1.5">
                <Verdict verdict={result.load.verdict} />
              </div>
            )}
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink">
              {result.load.text}
            </p>
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
        <p className="mt-5 rounded-sm bg-fog p-4 text-[15px] text-smoke">
          {result.from.state === "incomplete"
            ? result.from.message
            : result.to.state === "incomplete"
              ? result.to.message
              : waitingText}
        </p>
      )}

      <p className="mt-4 flex gap-2 rounded-sm border border-amberInk/30 bg-amber/10 p-3.5 text-[14px] leading-relaxed text-ink">
        <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-amberInk" />
        <span>
          <strong>{NOTE_LEAD}</strong> {NOTE_REST.join(" ")}
        </span>
      </p>

      <div className="mt-3 flex flex-col gap-x-6 sm:flex-row sm:flex-wrap">
        {compared && (
          <a href={result.toolHref} className={LINK_CLS}>
            Compare these sizes in the tire size tool
            <ArrowRight size={16} aria-hidden="true" className="shrink-0" />
          </a>
        )}
        <a href="/find-my-tires" className={LINK_CLS}>
          Find tires for your vehicle
          <ArrowRight size={16} aria-hidden="true" className="shrink-0" />
        </a>
      </div>
    </DemoShell>
  );
}
