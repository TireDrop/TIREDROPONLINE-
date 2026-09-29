// D10 UTQG Explainer (learn-plan §4): treadwear, traction and temperature
// grades in plain words, per 49 CFR 575.104. Treadwear is shown as a ratio to
// the control tire and never converted into miles.

import React, { useId, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";

import { ChipButton, DemoShell, RadioCards } from "./DemoShell.jsx";
import {
  TEMPERATURE_GRADES,
  TRACTION_GRADES,
  UTQG_EXAMPLES,
  explainUtqg,
  parseUtqgString,
  readTreadwear,
} from "./demoLogic.js";

const SOURCES_USED = ["S9", "S55", "S63"];
const BAR_MAX = 1000;

function TreadwearBars({ value }) {
  const pct = (n) => `${Math.max(2, Math.min(100, (n / BAR_MAX) * 100))}%`;
  return (
    <div aria-hidden="true" className="space-y-2">
      {[
        { label: "Control tire", n: 100, cls: "bg-smoke" },
        { label: "This grade", n: value, cls: "bg-drop" },
      ].map((b) => (
        <div key={b.label}>
          <div className="flex justify-between text-[12px] font-semibold text-smoke">
            <span>{b.label}</span>
            <span className="tnum text-ink">{b.n}</span>
          </div>
          <div className="mt-0.5 h-3 rounded-sm bg-ink/[0.07]">
            <div className={`h-full rounded-sm ${b.cls}`} style={{ width: pct(b.n) }} />
          </div>
        </div>
      ))}
      <p className="text-[12px] text-smoke">Relative wear on a test course, not miles.</p>
    </div>
  );
}

export default function UtqgExplainer() {
  const id = useId();
  const uid = id.replace(/:/g, "");
  const [treadwear, setTreadwear] = useState("500");
  const [traction, setTraction] = useState("AA");
  const [temperature, setTemperature] = useState("A");

  const tw = readTreadwear(treadwear);
  const info = explainUtqg({ treadwear, traction, temperature });
  const sliderValue = tw.ok ? Math.min(1000, Math.max(100, tw.value)) : 500;
  const current = `${treadwear} ${traction} ${temperature}`;

  const applyExample = (ex) => {
    const p = parseUtqgString(ex);
    setTreadwear(String(p.treadwear));
    setTraction(p.traction);
    setTemperature(p.temperature);
  };

  const live = `${info.marking}. ${
    info.treadwear.error ? info.treadwear.error : `Treadwear ${info.treadwear.ratio} times the control tire.`
  } Traction ${traction}. Temperature ${temperature}, ${info.temperature?.band ?? ""}.`;

  return (
    <DemoShell
      demoId="utqg-explainer"
      title="UTQG grade explainer"
      intro="The three grades printed near the rim, such as 500 AA A, are treadwear, traction and temperature."
      sources={SOURCES_USED}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-[13px] font-bold text-ink">
          Examples:
        </span>
        {UTQG_EXAMPLES.map((ex) => (
          <ChipButton
            key={ex}
            pressed={current === ex}
            onClick={() => applyExample(ex)}
            label={`Try ${ex}`}
          >
            {ex}
          </ChipButton>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2 lg:gap-6">
        <div className="space-y-5">
          <div>
            <label
              htmlFor={`${id}-tw`}
              className="font-display text-[13px] font-bold text-ink"
            >
              Treadwear grade
            </label>
            <div className="mt-1.5 flex items-center gap-3">
              <input
                id={`${id}-tw`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                value={treadwear}
                onChange={(e) => setTreadwear(e.target.value.trim())}
                aria-invalid={!tw.ok || undefined}
                aria-describedby={`${id}-tw-hint${tw.ok ? "" : ` ${id}-tw-err`}`}
                className={`block min-h-[44px] w-24 rounded-sm border bg-bone px-3 py-2 font-mono text-[18px] text-ink ${
                  tw.ok ? "border-ink/20" : "border-2 border-amberInk"
                }`}
              />
              <input
                type="range"
                min="100"
                max="1000"
                step="20"
                value={sliderValue}
                onChange={(e) => setTreadwear(e.target.value)}
                aria-label="Treadwear grade slider"
                aria-valuetext={`Treadwear ${sliderValue}`}
                className="h-11 min-w-0 flex-1 cursor-pointer accent-drop"
              />
            </div>
            <p id={`${id}-tw-hint`} className="mt-1.5 text-[13px] text-smoke">
              Type the number from the sidewall, or slide from 100 to 1000.
            </p>
            {!tw.ok && (
              <p
                id={`${id}-tw-err`}
                className="mt-1.5 flex gap-1.5 text-[14px] font-semibold text-amberInk"
              >
                <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                {tw.message}
              </p>
            )}
          </div>

          <RadioCards
            legend="Traction grade"
            name={`${uid}-traction`}
            value={traction}
            onChange={setTraction}
            className="grid-cols-4"
            options={TRACTION_GRADES.map((g) => ({ value: g.grade, label: g.grade }))}
          />
          <RadioCards
            legend="Temperature grade"
            name={`${uid}-temp`}
            value={temperature}
            onChange={setTemperature}
            className="grid-cols-3"
            options={TEMPERATURE_GRADES.map((g) => ({ value: g.grade, label: g.grade }))}
          />
        </div>

        <div>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {live}
          </p>
          <div className="flex items-end gap-3 rounded-sm bg-ink px-4 py-3 text-bone" aria-hidden="true">
            {[
              [tw.ok ? tw.value : "—", "Treadwear"],
              [traction, "Traction"],
              [temperature, "Temperature"],
            ].map(([v, l]) => (
              <span key={l} className="flex flex-col items-center">
                <span className="font-mono text-[1.6rem] font-bold leading-none">
                  {v}
                </span>
                <span className="mt-1 text-[11px] font-semibold text-volt">{l}</span>
              </span>
            ))}
          </div>

          <dl className="mt-4 space-y-3">
            <div className="rounded-sm bg-fog p-3.5">
              <dt className="font-display text-[14px] font-bold text-ink">
                Treadwear {tw.ok ? tw.value : ""}
              </dt>
              <dd className="mt-1 text-[14px] leading-relaxed text-ink">
                {info.treadwear.error ?? info.treadwear.text}
                {tw.ok && (
                  <div className="mt-2.5">
                    <TreadwearBars value={tw.value} />
                  </div>
                )}
              </dd>
            </div>
            <div className="rounded-sm bg-fog p-3.5">
              <dt className="font-display text-[14px] font-bold text-ink">
                Traction {traction}
              </dt>
              <dd className="mt-1 text-[14px] leading-relaxed text-ink">
                {info.traction?.text}
              </dd>
            </div>
            <div className="rounded-sm bg-fog p-3.5">
              <dt className="font-display text-[14px] font-bold text-ink">
                Temperature {temperature}
              </dt>
              <dd className="mt-1 text-[14px] leading-relaxed text-ink">
                {info.temperature?.text}
              </dd>
            </div>
          </dl>

          <p className="mt-4 flex gap-2 rounded-sm border border-amberInk/30 bg-amber/10 p-3.5 text-[14px] leading-relaxed text-ink">
            <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-amberInk" />
            <span>
              <strong>Not a mileage figure.</strong> {info.caveat}
            </span>
          </p>
        </div>
      </div>
    </DemoShell>
  );
}
