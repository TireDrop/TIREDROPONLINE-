// D2 DOT Date Reader + Age Timeline (learn-plan §4).
//
// Week and year come from readDotCode(), which wraps decodeDot() from
// tireMath.js. The age needs today's date, and a prerender has no business
// guessing it, so `now` starts as null and is set from the browser's clock
// in an effect. Until then the demo shows the week and year only.

import React, { useEffect, useId, useState } from "react";

import { AlertTriangle } from "lucide-react";

import { ChipButton, DemoShell, StatusBadge } from "./DemoShell.jsx";
import {
  AGE_MARKERS,
  TIMELINE_YEARS,
  readDotCode,
} from "./demoLogic.js";
import { SOURCES } from "./sources.js";

const SOURCES_USED = ["S52", "S46", "S47", "S1", "S16", "S5"];
const EXAMPLES = [
  { value: "2319", label: "2319" },
  { value: "0716", label: "0716" },
  { value: "4521", label: "4521" },
  { value: "238", label: "238 (pre-2000)" },
];

function Stamp({ result }) {
  const decoded = result.state === "decoded";
  const legacy = result.state === "legacy";
  const week = decoded ? result.weekText : legacy ? result.digits.slice(0, 2) : "WW";
  const year = decoded ? result.yearText : legacy ? result.digits.slice(2) : "YY";
  const empty = !decoded && !legacy;
  return (
    <div
      className="rounded-sm bg-ink px-4 py-4 text-bone"
      aria-hidden="true"
    >
      <p className="font-display text-[11px] font-bold uppercase tracking-[0.07em] text-volt">
        On the sidewall
      </p>
      <div className="mt-2 flex flex-wrap items-end gap-x-2 gap-y-3 font-mono text-[1.35rem] font-bold leading-none sm:text-[1.6rem]">
        <span className="text-[#9FB3CC]">DOT</span>
        <span className="text-[#9FB3CC]">XXXX</span>
        <span className="text-[#9FB3CC]">XXXX</span>
        <span className="inline-flex gap-1">
          <span className="flex flex-col items-center">
            <span
              className={`rounded-sm px-1.5 py-1 ${empty ? "border border-dashed border-[#9FB3CC] text-[#9FB3CC]" : "bg-volt text-ink"}`}
            >
              {week}
            </span>
            <span className="mt-1.5 font-sans text-[12px] font-semibold text-bone">
              week
            </span>
          </span>
          <span className="flex flex-col items-center">
            <span
              className={`rounded-sm px-1.5 py-1 ${empty ? "border border-dashed border-[#9FB3CC] text-[#9FB3CC]" : "bg-amber text-ink"}`}
            >
              {year}
            </span>
            <span className="mt-1.5 font-sans text-[12px] font-semibold text-bone">
              {legacy ? "year (199x)" : "year"}
            </span>
          </span>
        </span>
      </div>
    </div>
  );
}

function Timeline({ ageYears }) {
  const pct = (y) => `${(Math.min(y, TIMELINE_YEARS) / TIMELINE_YEARS) * 100}%`;
  const has = typeof ageYears === "number";
  return (
    <div aria-hidden="true" className="pt-7">
      <div className="relative h-9">
        <div className="absolute inset-y-0 left-0 flex w-full overflow-hidden rounded-sm">
          <div className="h-full bg-sky" style={{ width: pct(5) }} />
          <div
            className="h-full bg-amber/60"
            style={{
              width: pct(5),
              backgroundImage:
                "repeating-linear-gradient(-45deg, transparent 0 6px, rgba(7,14,26,.12) 6px 8px)",
            }}
          />
          <div className="h-full flex-1 bg-ink" />
        </div>
        {[5, 10].map((y) => (
          <div
            key={y}
            className="absolute inset-y-0 w-0.5 bg-bone"
            style={{ left: pct(y) }}
          />
        ))}
        {has && (
          <div
            className="absolute -top-7 flex -translate-x-1/2 flex-col items-center"
            style={{ left: pct(ageYears) }}
          >
            <span className="whitespace-nowrap rounded-sm bg-drop px-1.5 py-0.5 font-display text-[12px] font-bold text-bone">
              {ageYears > TIMELINE_YEARS ? "12+ yrs" : "This tire"}
            </span>
            <span className="h-0 w-0 border-x-[6px] border-t-[7px] border-x-transparent border-t-drop" />
            <span className="h-9 w-1 rounded-full bg-drop ring-2 ring-bone" />
          </div>
        )}
      </div>
      <div className="relative mt-1 h-5 text-[12px] font-semibold text-smoke">
        {[0, 5, 10].map((y) => (
          <span
            key={y}
            className="absolute -translate-x-1/2"
            style={{ left: pct(y) }}
          >
            {y === 0 ? "" : `${y} yrs`}
          </span>
        ))}
        <span className="absolute left-0">Made</span>
      </div>
    </div>
  );
}

export default function DotDateReader() {
  const id = useId();
  const [value, setValue] = useState("2319");
  const [now, setNow] = useState(null);

  // The client's date, only after mount: a prerender must not bake in the
  // build day as "today".
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the client clock after mount is the point
    setNow(new Date());
  }, []);

  const result = readDotCode(value, now);
  const invalid = result.state === "error";
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;

  let live = "";
  if (result.state === "decoded") {
    live = `Built in week ${result.week} of ${result.year}${
      result.month ? `, around ${result.month} ${result.year}` : ""
    }.${result.ageText ? ` Age: ${result.ageText.toLowerCase()}. ${result.band.status.label}.` : ""}`;
  } else if (result.state === "legacy") {
    live = `Pre-2000 date code, week ${result.week}. ${result.status.label}.`;
  } else if (result.message) {
    live = result.message;
  }

  return (
    <DemoShell
      demoId="dot-date-reader"
      title="DOT date code reader"
      intro="The last four digits of the DOT code are the week and year the tire was made. Type them to see its age."
      sources={SOURCES_USED}
    >
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <div>
          <label
            htmlFor={`${id}-code`}
            className="font-display text-[13px] font-bold text-ink"
          >
            Last 4 digits of the DOT code
          </label>
          <input
            id={`${id}-code`}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={24}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-describedby={`${hintId}${invalid ? ` ${errId}` : ""}`}
            aria-invalid={invalid || undefined}
            placeholder="e.g. 2319"
            className={`mt-1.5 block min-h-[44px] w-full rounded-sm border bg-bone px-3.5 py-2.5 font-mono text-[18px] tracking-[0.08em] text-ink placeholder:text-smoke/70 ${
              invalid ? "border-2 border-amberInk" : "border-ink/20"
            }`}
          />
          <p id={hintId} className="mt-1.5 text-[13px] leading-snug text-smoke">
            Four digits, week then year: 2319 is week 23 of 2019. You can also
            paste the whole DOT code.
          </p>
          {invalid && (
            <p
              id={errId}
              className="mt-1.5 flex gap-1.5 text-[14px] font-semibold leading-snug text-amberInk"
            >
              <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              {result.message}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="sr-only">Examples:</span>
            {EXAMPLES.map((ex) => (
              <ChipButton
                key={ex.value}
                pressed={value === ex.value}
                onClick={() => setValue(ex.value)}
                label={`Try ${ex.label}`}
              >
                {ex.label}
              </ChipButton>
            ))}
          </div>

          <div className="mt-4">
            <Stamp result={result} />
          </div>
        </div>

        <div>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {live}
          </p>
          <div className="rounded-sm border-l-4 border-ink bg-fog p-4">
            {result.state === "decoded" && (
              <>
                <p className="font-display text-[1.25rem] font-extrabold leading-tight text-ink">
                  Week {result.week} of {result.year}
                </p>
                <p className="mt-1 text-[14px] text-smoke">
                  {result.month
                    ? `Around ${result.month} ${result.year}. `
                    : ""}
                  {result.ageText ? (
                    <>
                      Age:{" "}
                      <strong className="text-ink">{result.ageText}</strong>
                    </>
                  ) : (
                    "The age is worked out from today's date in your browser."
                  )}
                </p>
                {result.band && (
                  <>
                    <div className="mt-3">
                      <StatusBadge status={result.band.status} />
                    </div>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink">
                      {result.band.text}
                    </p>
                  </>
                )}
                {result.note && (
                  <p className="mt-2 text-[13px] text-smoke">{result.note}</p>
                )}
              </>
            )}
            {result.state === "legacy" && (
              <>
                <p className="font-display text-[1.25rem] font-extrabold leading-tight text-ink">
                  Built before 2000
                </p>
                <div className="mt-3">
                  <StatusBadge status={result.status} />
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-ink">
                  {result.message}
                </p>
              </>
            )}
            {(result.state === "empty" ||
              result.state === "incomplete" ||
              result.state === "error") && (
              <p className="text-[15px] leading-relaxed text-smoke">
                {result.state === "error"
                  ? "Check the digits and try again."
                  : result.message ?? "Type the last four digits of the DOT code."}
              </p>
            )}
          </div>

          <Timeline
            ageYears={
              result.state === "decoded"
                ? result.ageYears
                : result.state === "legacy"
                  ? TIMELINE_YEARS + 1
                  : null
            }
          />

          <h4 className="mt-4 font-display text-[14px] font-bold text-ink">
            What manufacturers and NHTSA say about age
          </h4>
          <ol className="mt-2 space-y-2 text-[14px] leading-snug text-ink">
            {AGE_MARKERS.map((m) => (
              <li key={m.label} className="flex gap-2">
                <span className="tnum w-[5.5rem] shrink-0 font-display font-bold">
                  {m.label}
                </span>
                <span className="text-smoke">{m.text}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[13px] leading-snug text-smoke">
            To check for recalls, enter the full DOT code (the TIN) at{" "}
            <a
              href={SOURCES.S16.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-dive underline underline-offset-2"
            >
              USTMA&apos;s recall lookup
              <span className="sr-only"> (opens in a new tab)</span>
            </a>{" "}
            or{" "}
            <a
              href={SOURCES.S5.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-dive underline underline-offset-2"
            >
              NHTSA Recalls
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </p>
        </div>
      </div>
    </DemoShell>
  );
}
