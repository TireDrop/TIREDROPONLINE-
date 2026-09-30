// D5 Load index & speed rating check (learn-plan §4): the current tire's
// load index and speed rating against the tire being considered, as
// "Meets or exceeds your current tire" or "Below your current tire. Not
// recommended by tire makers". Tables are src/data/loadSpeedTables.js
// (Michelin S35, Goodyear S54); the comparison is compareLoadSpeed() in
// fitmentLogic.js.

import React, { useId, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";

import { DemoShell } from "./DemoShell.jsx";
import Verdict from "./FitmentVerdict.jsx";
import {
  LOAD_RANGE_NOTES,
  LOAD_SPEED_DEFAULTS,
  compareLoadSpeed,
  loadFacts,
  readServiceDescription,
} from "./fitmentLogic.js";
import { LOAD_INDEXES, SPEED_SYMBOLS } from "../../data/loadSpeedTables.js";

const SOURCES_USED = ["S35", "S54"];

const SELECT_CLS =
  "field mt-1 block min-h-[44px] w-full min-w-0 cursor-pointer bg-bone font-display font-semibold";

function initial({ load, speed }) {
  return { text: `${load}${speed}`, load, speed };
}

/** One tire's inputs: a sidewall string, or the two selects. */
function TireFields({ legend, tire, onChange, uid }) {
  const read = readServiceDescription(tire.text);
  const problem =
    read.state === "error" || read.state === "incomplete" ? read : null;
  const invalid = read.state === "error";

  const setText = (text) => {
    const r = readServiceDescription(text);
    onChange((prev) =>
      r.state === "decoded"
        ? { text, load: r.load, speed: r.speed }
        : { ...prev, text },
    );
  };
  const setLoad = (load) =>
    onChange((prev) => ({ text: `${load}${prev.speed}`, load, speed: prev.speed }));
  const setSpeed = (speed) =>
    onChange((prev) => ({ text: `${prev.load}${speed}`, load: prev.load, speed }));

  return (
    <fieldset className="min-w-0 rounded-sm border border-ink/10 bg-fog p-3.5">
      <legend className="px-1 font-display text-[14px] font-bold text-ink">
        {legend}
      </legend>
      <label
        htmlFor={`${uid}-text`}
        className="font-display text-[13px] font-bold text-ink"
      >
        Type it from the sidewall
      </label>
      <input
        id={`${uid}-text`}
        type="text"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={32}
        value={tire.text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. 94V"
        aria-invalid={invalid || undefined}
        aria-describedby={`${uid}-hint${problem ? ` ${uid}-msg` : ""}`}
        className={`mt-1 block min-h-[44px] w-full rounded-sm border bg-bone px-3 py-2 font-mono text-[18px] tracking-[0.04em] text-ink placeholder:text-smoke/70 ${
          invalid ? "border-2 border-amberInk" : "border-ink/20"
        }`}
      />
      <p id={`${uid}-hint`} className="mt-1 text-[13px] leading-snug text-smoke">
        The number and letter after the size, such as 94V or 121/118S.
      </p>
      {problem && (
        <p
          id={`${uid}-msg`}
          className={`mt-1 flex gap-1.5 text-[14px] leading-snug ${
            invalid ? "font-semibold text-amberInk" : "text-smoke"
          }`}
        >
          {invalid && (
            <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          )}
          {problem.message}
        </p>
      )}
      {read.state === "decoded" && (read.xl || read.dualLoad) && (
        <p className="mt-1 text-[13px] leading-snug text-smoke">
          {read.xl && "XL: extra load. "}
          {read.dualLoad &&
            `${read.dualLoad} is the dual-wheel load index; ${read.load} is compared.`}
        </p>
      )}

      <div className="mt-3 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
        <div className="min-w-0">
          <label
            htmlFor={`${uid}-load`}
            className="font-display text-[13px] font-bold text-ink"
          >
            Load index
          </label>
          <select
            id={`${uid}-load`}
            value={tire.load}
            onChange={(e) => setLoad(Number(e.target.value))}
            className={SELECT_CLS}
          >
            {LOAD_INDEXES.map((n) => (
              <option key={n} value={n}>
                {`${n} (${loadFacts(n).lbs.toLocaleString("en-US")} lb)`}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label
            htmlFor={`${uid}-speed`}
            className="font-display text-[13px] font-bold text-ink"
          >
            Speed rating
          </label>
          <select
            id={`${uid}-speed`}
            value={tire.speed}
            onChange={(e) => setSpeed(e.target.value)}
            className={SELECT_CLS}
          >
            {SPEED_SYMBOLS.map((s) => (
              <option key={s.symbol} value={s.symbol}>
                {`${s.symbol} (${s.mph} mph)`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </fieldset>
  );
}

/** Per-tire load, current vs considered, as bars. Decorative: the table says it. */
function LoadBars({ current, candidate }) {
  const max = Math.max(current.lbs, candidate.lbs);
  const rows = [
    { label: "Current", f: current, cls: "bg-smoke" },
    { label: "Considering", f: candidate, cls: "bg-drop" },
  ];
  return (
    <div aria-hidden="true" className="mt-3 space-y-2">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex justify-between gap-2 text-[12px] font-semibold text-smoke">
            <span>{`${r.label} (${r.f.index})`}</span>
            <span className="tnum text-ink">{`${r.f.lbs.toLocaleString("en-US")} lb`}</span>
          </div>
          <div className="mt-0.5 h-3 rounded-sm bg-ink/[0.07]">
            <div
              className={`h-full rounded-sm ${r.cls}`}
              style={{ width: `${Math.max(4, (r.f.lbs / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ReferenceTables({ uid }) {
  return (
    <details className="mt-5 rounded-sm border border-ink/10 bg-bone">
      <summary className="flex min-h-[44px] cursor-pointer items-center px-3.5 font-display text-[14px] font-bold text-ink">
        Full load index and speed rating tables
      </summary>
      <div className="grid gap-4 px-3.5 pb-3.5 sm:grid-cols-[1.4fr_1fr]">
        <table
          className="w-full text-left text-[13px] text-ink"
          aria-describedby={`${uid}-tblnote`}
        >
          <caption className="pb-1 text-left font-display text-[13px] font-bold">
            Load index, maximum load per tire
          </caption>
          <thead>
            <tr className="border-b border-ink/15 text-smoke">
              <th scope="col" className="py-1 pr-2 font-semibold">Index</th>
              <th scope="col" className="py-1 pr-2 font-semibold">lb</th>
              <th scope="col" className="py-1 font-semibold">kg</th>
            </tr>
          </thead>
          <tbody className="tnum">
            {LOAD_INDEXES.map((n) => {
              const f = loadFacts(n);
              return (
                <tr key={n} className="border-b border-ink/[0.06]">
                  <th scope="row" className="py-0.5 pr-2 font-semibold">{n}</th>
                  <td className="py-0.5 pr-2">{f.lbs.toLocaleString("en-US")}</td>
                  <td className="py-0.5">{f.kg.toLocaleString("en-US")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <table className="w-full self-start text-left text-[13px] text-ink">
          <caption className="pb-1 text-left font-display text-[13px] font-bold">
            Speed rating, lab test speed
          </caption>
          <thead>
            <tr className="border-b border-ink/15 text-smoke">
              <th scope="col" className="py-1 pr-2 font-semibold">Rating</th>
              <th scope="col" className="py-1 pr-2 font-semibold">mph</th>
              <th scope="col" className="py-1 font-semibold">km/h</th>
            </tr>
          </thead>
          <tbody className="tnum">
            {SPEED_SYMBOLS.map((s) => (
              <tr key={s.symbol} className="border-b border-ink/[0.06]">
                <th scope="row" className="py-0.5 pr-2 font-semibold">{s.symbol}</th>
                <td className="py-0.5 pr-2">{s.mph}</td>
                <td className="py-0.5">{s.kmh}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p id={`${uid}-tblnote`} className="px-3.5 pb-3.5 text-[13px] leading-snug text-smoke">
        Standard figures published by Michelin and Goodyear. Pounds are
        converted from kilograms and rounded.
      </p>
    </details>
  );
}

export default function LoadSpeedCheck() {
  const id = useId();
  const [current, setCurrent] = useState(() => initial(LOAD_SPEED_DEFAULTS.current));
  const [candidate, setCandidate] = useState(() =>
    initial(LOAD_SPEED_DEFAULTS.candidate),
  );
  const result = compareLoadSpeed(current, candidate);

  const problems = [
    ["Current tire", readServiceDescription(current.text)],
    ["Tire you're considering", readServiceDescription(candidate.text)],
  ]
    .filter(([, r]) => r.state === "error")
    .map(([who, r]) => `${who}: ${r.message}`);
  const live = [...problems, result.live].join(" ");

  const rows = [
    {
      label: "Load index",
      cur: String(result.load.current.index),
      next: String(result.load.candidate.index),
    },
    {
      label: "Max load per tire",
      cur: result.load.current.perTireText.replace(" per tire", ""),
      next: result.load.candidate.perTireText.replace(" per tire", ""),
    },
    {
      label: "Set of four (×4)",
      cur: result.load.current.setText.replace(" for four", ""),
      next: result.load.candidate.setText.replace(" for four", ""),
    },
    {
      label: "Speed rating",
      cur: `${result.speed.current.symbol}, ${result.speed.current.mph} mph (${result.speed.current.kmh} km/h)`,
      next: `${result.speed.candidate.symbol}, ${result.speed.candidate.mph} mph (${result.speed.candidate.kmh} km/h)`,
    },
  ];

  return (
    <DemoShell
      demoId="load-speed-check"
      title="Load index & speed rating check"
      intro="Compare the numbers on your current tire with the one you're looking at."
      sources={SOURCES_USED}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TireFields
          legend="Your current tire"
          tire={current}
          onChange={setCurrent}
          uid={`${id}-cur`}
        />
        <TireFields
          legend="Tire you're considering"
          tire={candidate}
          onChange={setCandidate}
          uid={`${id}-new`}
        />
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {live}
      </p>

      <div className="mt-5 rounded-sm border-l-4 border-ink bg-fog p-4">
        <p className="font-display text-[1.05rem] font-bold leading-snug text-ink">
          {result.headline}
        </p>
        {result.advice && (
          <p className="mt-1 text-[14px] leading-relaxed text-ink">
            {result.advice}
          </p>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {[
            ["Load", result.load],
            ["Speed", result.speed],
          ].map(([name, part]) => (
            <div key={name} className="min-w-0 rounded-sm bg-bone p-3.5">
              <p className="font-display text-[12px] font-bold uppercase tracking-[0.07em] text-smoke">
                {name}
              </p>
              <div className="mt-1.5">
                <Verdict verdict={part.verdict} />
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-ink">
                {part.text}
              </p>
              {name === "Load" && (
                <LoadBars current={part.current} candidate={part.candidate} />
              )}
            </div>
          ))}
        </div>

        <table className="mt-4 w-full table-fixed text-left text-[13px] leading-snug text-ink sm:text-[14px]">
          <caption className="sr-only">Current tire and considered tire, side by side</caption>
          <thead>
            <tr className="border-b border-ink/15 text-smoke">
              <td className="w-[30%] py-1.5 pr-2" />
              <th scope="col" className="py-1.5 pr-2 font-display font-bold">
                Current
              </th>
              <th scope="col" className="py-1.5 font-display font-bold">
                Considering
              </th>
            </tr>
          </thead>
          <tbody className="tnum">
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-ink/[0.07] align-top">
                <th scope="row" className="break-words py-1.5 pr-2 font-semibold text-smoke">
                  {r.label}
                </th>
                <td className="break-words py-1.5 pr-2">{r.cur}</td>
                <td className="break-words py-1.5">{r.next}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[13px] leading-snug text-smoke">
          The ×4 figure is four tires&apos; combined maximum. What your vehicle
          is rated to carry is on its door placard.
        </p>
      </div>

      <p className="mt-4 flex gap-2 rounded-sm border border-amberInk/30 bg-amber/10 p-3.5 text-[14px] leading-relaxed text-ink">
        <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-amberInk" />
        <span>{result.note}</span>
      </p>

      <ul className="mt-4 list-disc space-y-1.5 pl-5 text-[13px] leading-snug text-smoke">
        {LOAD_RANGE_NOTES.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>

      <ReferenceTables uid={id} />
    </DemoShell>
  );
}
