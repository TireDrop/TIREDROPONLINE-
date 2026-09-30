// D4 Pressure vs temperature (learn-plan §4).
//
// Enter the door-sticker cold pressure and the temperature at fill, then
// slide the temperature now. The estimate is shown both ways: the ~1 PSI per
// 10°F rule of thumb and the gas law. The math is pressureReading() in
// pressureTempLogic.js.
//
// This demo never suggests a pressure to set. Every number is an estimate of
// what a gauge would read; the only pressure to set is "your door-sticker
// value", cold. Nothing animates, so there is no motion to reduce.

import React, { useId, useState } from "react";
import { AlertTriangle, Info, Minus, Plus, Thermometer } from "lucide-react";

import { ChipButton, DemoShell, Stat } from "./DemoShell.jsx";
import {
  ESTIMATE_NOTE,
  HOT_TIRE_CALLOUT,
  NOW_TEMP_RANGE,
  PRESSURE_DEFAULTS,
  PRESSURE_PRESETS,
  TPMS_NOTE,
  fmtPsi,
  gasLawPsi,
  matchPreset,
  pressureReading,
  ruleOfThumbPsi,
} from "./pressureTempLogic.js";

const SOURCES_USED = ["S13", "C2", "S1", "S2", "S4", "S8"];

/* ---------------- Chart ---------------- */

const W = 400;
const H = 220;
const PAD = { l: 44, r: 24, t: 26, b: 34 };
const X_TICKS = [30, 50, 70, 90, 110];

function PressureChart({ reading, titleId, descId }) {
  const { placard, fillTemp, nowTemp, gas } = reading;
  const { min: tMin, max: tMax } = NOW_TEMP_RANGE;
  const temps = [];
  for (let t = tMin; t <= tMax; t += 10) temps.push(t);

  const gasAt = (t) => gasLawPsi(placard, fillTemp, t);
  const thumbAt = (t) => ruleOfThumbPsi(placard, fillTemp, t);
  const values = temps.flatMap((t) => [gasAt(t), thumbAt(t)]).concat(placard);
  const yLo = Math.floor(Math.min(...values) - 1);
  const yHi = Math.ceil(Math.max(...values) + 1);

  const x = (t) => PAD.l + ((t - tMin) / (tMax - tMin)) * (W - PAD.l - PAD.r);
  const y = (p) => PAD.t + ((yHi - p) / (yHi - yLo)) * (H - PAD.t - PAD.b);
  const line = (fn) =>
    temps
      .map((t, i) => `${i ? "L" : "M"}${x(t).toFixed(1)} ${y(fn(t)).toFixed(1)}`)
      .join(" ");

  const span = yHi - yLo;
  const stepPsi = span > 16 ? 5 : span > 8 ? 2 : 1;
  const yTicks = [];
  for (let p = Math.ceil(yLo / stepPsi) * stepPsi; p <= yHi; p += stepPsi) {
    yTicks.push(p);
  }
  const fillShown = fillTemp >= tMin && fillTemp <= tMax;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
    >
      <title id={titleId}>Estimated pressure by air temperature</title>
      <desc id={descId}>
        {`Solid line: gas-law estimate, from ${fmtPsi(gasAt(tMin))} PSI at ${tMin}°F to ${fmtPsi(gasAt(tMax))} PSI at ${tMax}°F. Dashed line: rule of thumb, from ${fmtPsi(thumbAt(tMin))} to ${fmtPsi(thumbAt(tMax))} PSI. A dotted line marks your door-sticker value, ${placard} PSI. The marker is at ${nowTemp}°F, about ${fmtPsi(gas)} PSI.`}
      </desc>
      <rect x="0" y="0" width={W} height={H} fill="#F4F6FA" />

      {/* Grid and axes */}
      <g fontSize="14" fill="#586274">
        {yTicks.map((p) => (
          <g key={`y${p}`}>
            <line
              x1={PAD.l}
              y1={y(p)}
              x2={W - PAD.r}
              y2={y(p)}
              stroke="#586274"
              strokeOpacity="0.18"
            />
            <text x={PAD.l - 6} y={y(p) + 4} textAnchor="end">
              {p}
            </text>
          </g>
        ))}
        {X_TICKS.map((t) => (
          <text key={`x${t}`} x={x(t)} y={H - PAD.b + 18} textAnchor="middle">
            {t}°F
          </text>
        ))}
        <text x={PAD.l - 6} y="14" textAnchor="end" fontWeight="700">
          PSI
        </text>
      </g>
      <line
        x1={PAD.l}
        y1={H - PAD.b}
        x2={W - PAD.r}
        y2={H - PAD.b}
        stroke="#586274"
        strokeWidth="1.5"
      />

      {/* Door-sticker value */}
      <line
        x1={PAD.l}
        y1={y(placard)}
        x2={W - PAD.r}
        y2={y(placard)}
        stroke="#070E1A"
        strokeWidth="1.5"
        strokeDasharray="2 4"
      />
      <text
        x={PAD.l + 6}
        y={y(placard) - 6}
        fontSize="12"
        fontWeight="700"
        fill="#070E1A"
        stroke="#F4F6FA"
        strokeWidth="4"
        paintOrder="stroke"
      >
        door sticker {placard}
      </text>

      {/* Estimates */}
      <path
        d={line(thumbAt)}
        fill="none"
        stroke="#586274"
        strokeWidth="2"
        strokeDasharray="7 5"
      />
      <path d={line(gasAt)} fill="none" stroke="#0068E8" strokeWidth="3" />

      {/* Fill point and the reading now */}
      {fillShown && (
        <circle
          cx={x(fillTemp)}
          cy={y(placard)}
          r="5"
          fill="#FFFFFF"
          stroke="#070E1A"
          strokeWidth="2"
        />
      )}
      <line
        x1={x(nowTemp)}
        y1={PAD.t}
        x2={x(nowTemp)}
        y2={H - PAD.b}
        stroke="#0053C4"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <circle
        cx={x(nowTemp)}
        cy={y(gas)}
        r="7"
        fill="#0068E8"
        stroke="#FFFFFF"
        strokeWidth="2"
      />
    </svg>
  );
}

/* ---------------- Inputs ---------------- */

function NumberField({ id, label, hint, value, onChange, error, suffix }) {
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  return (
    <div>
      <label htmlFor={id} className="font-display text-[13px] font-bold text-ink">
        {label}
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          maxLength={5}
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${hintId}${error ? ` ${errId}` : ""}`}
          className={`block min-h-[44px] w-24 rounded-sm border bg-bone px-3 py-2 font-mono text-[18px] text-ink ${
            error ? "border-2 border-amberInk" : "border-ink/20"
          }`}
        />
        <span className="font-display text-[15px] font-bold text-smoke">
          {suffix}
        </span>
      </div>
      <p id={hintId} className="mt-1.5 text-[13px] leading-snug text-smoke">
        {hint}
      </p>
      {error && (
        <p
          id={errId}
          className="mt-1.5 flex gap-1.5 text-[14px] font-semibold text-amberInk"
        >
          <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------------- The demo ---------------- */

export default function PressureTemp() {
  const id = useId();
  const [psi, setPsi] = useState(PRESSURE_DEFAULTS.psi);
  const [fillTemp, setFillTemp] = useState(PRESSURE_DEFAULTS.fillTemp);
  const [nowTemp, setNowTemp] = useState(PRESSURE_DEFAULTS.nowTemp);

  const reading = pressureReading({ psi, fillTemp, nowTemp });
  const ok = reading.state === "estimated";
  const errors = ok ? {} : reading.errors;
  const preset = matchPreset(fillTemp, nowTemp);

  const applyPreset = (p) => {
    setFillTemp(String(p.fillTemp));
    setNowTemp(p.nowTemp);
  };
  const step = (delta) =>
    setNowTemp((t) =>
      Math.min(NOW_TEMP_RANGE.max, Math.max(NOW_TEMP_RANGE.min, t + delta)),
    );

  return (
    <DemoShell
      demoId="pressure-temp"
      title="Pressure vs temperature"
      intro="Why the tire light can come on during a cold-front morning, and why the reading is higher at 3 pm in July."
      sources={SOURCES_USED}
    >
      <div role="group" aria-labelledby={`${id}-presets`}>
        <p
          id={`${id}-presets`}
          className="mb-2 font-display text-[13px] font-bold text-ink"
        >
          Try a Florida day
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESSURE_PRESETS.map((p) => (
            <ChipButton
              key={p.id}
              pressed={preset?.id === p.id}
              onClick={() => applyPreset(p)}
            >
              {p.label}
            </ChipButton>
          ))}
        </div>
        {preset && (
          <p className="mt-2 text-[13px] leading-snug text-smoke">
            {preset.text}
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <NumberField
          id={`${id}-psi`}
          label="Door-sticker pressure (cold PSI)"
          hint="From the sticker in the driver's door jamb, not the maximum on the sidewall."
          value={psi}
          onChange={setPsi}
          error={errors.psi}
          suffix="PSI"
        />
        <NumberField
          id={`${id}-fill`}
          label="Temperature when you filled (°F)"
          hint="The air temperature when the tires were set, cold."
          value={fillTemp}
          onChange={setFillTemp}
          error={errors.fillTemp}
          suffix="°F"
        />
      </div>

      <div className="mt-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <label
            htmlFor={`${id}-now`}
            className="font-display text-[13px] font-bold text-ink"
          >
            Temperature now
          </label>
          <p className="tnum font-display text-[1.6rem] font-extrabold leading-none text-ink">
            {nowTemp}°F
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => step(-5)}
            disabled={nowTemp <= NOW_TEMP_RANGE.min}
            aria-label="5 degrees cooler"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-ink/15 bg-bone text-ink hover:bg-fog disabled:opacity-40"
          >
            <Minus size={18} aria-hidden="true" />
          </button>
          <input
            id={`${id}-now`}
            type="range"
            min={NOW_TEMP_RANGE.min}
            max={NOW_TEMP_RANGE.max}
            step="1"
            value={nowTemp}
            onChange={(e) => setNowTemp(Number(e.target.value))}
            aria-valuetext={
              ok ? reading.valueText : `${nowTemp} degrees Fahrenheit`
            }
            aria-describedby={`${id}-now-hint`}
            className="h-11 min-w-0 flex-1 cursor-pointer accent-drop"
          />
          <button
            type="button"
            onClick={() => step(5)}
            disabled={nowTemp >= NOW_TEMP_RANGE.max}
            aria-label="5 degrees warmer"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-ink/15 bg-bone text-ink hover:bg-fog disabled:opacity-40"
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
        <p
          id={`${id}-now-hint`}
          className="mt-1 text-[13px] leading-snug text-smoke"
        >
          {NOW_TEMP_RANGE.min}°F to {NOW_TEMP_RANGE.max}°F. Use the arrow keys
          for 1°F steps.
        </p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:gap-6">
        <div className="self-start rounded-sm border-l-4 border-ink bg-fog p-4 lg:order-2">
          {ok && (
            <div aria-hidden="true">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.07em] text-smoke">
                Estimated gauge reading at {reading.nowTemp}°F
              </p>
              <p className="tnum mt-1 font-display text-[1.9rem] font-extrabold leading-none text-ink">
                {reading.gasText}{" "}
                <span className="text-[1rem] font-bold text-smoke">
                  (estimate)
                </span>
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Stat label="Gas law" value={reading.gasText} />
                <Stat
                  label="Rule of thumb"
                  value={reading.thumbText}
                  sub="±1 PSI per 10°F"
                />
              </div>
            </div>
          )}
          <div aria-live="polite" aria-atomic="true">
            {ok ? (
              <>
                <p className="mt-3 text-[15px] leading-relaxed text-ink">
                  {reading.summary}
                </p>
                {reading.tpms.low && (
                  <p className="mt-3 flex gap-2 rounded-sm border border-amberInk/30 bg-amber/10 p-3 text-[14px] leading-relaxed text-ink">
                    <AlertTriangle
                      size={18}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-amberInk"
                    />
                    <span>
                      <strong>Tire pressure light range.</strong>{" "}
                      {reading.tpms.text}
                    </span>
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-[15px] font-semibold leading-relaxed text-ink">
                  Fix the entry above to see the estimate.
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] leading-relaxed text-ink">
                  {Object.values(errors).map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          {ok && (
            <p className="mt-3 text-[13px] leading-snug text-smoke">
              {ESTIMATE_NOTE}
            </p>
          )}
        </div>

        <div className="min-w-0 lg:order-1">
          {ok && (
            <>
              <div className="overflow-hidden rounded-sm border border-ink/10">
                <PressureChart
                  reading={reading}
                  titleId={`${id}-chart-t`}
                  descId={`${id}-chart-d`}
                />
              </div>
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] leading-snug text-smoke">
                <span>
                  <span aria-hidden="true" className="font-bold text-drop">━━</span> Gas law
                </span>
                <span>
                  <span aria-hidden="true" className="font-bold text-smoke">╌╌</span> Rule of
                  thumb
                </span>
                <span>
                  <span aria-hidden="true" className="font-bold text-ink">┈┈</span> Door sticker
                </span>
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[260px] border-collapse text-left text-[14px] text-ink">
                  <caption className="mb-2 text-left text-[13px] leading-snug text-smoke">
                    Estimated gauge reading by air temperature, for tires set to{" "}
                    {reading.placard} PSI at {reading.fillTemp}°F.
                  </caption>
                  <thead>
                    <tr className="border-b border-ink/15 font-display text-[13px]">
                      <th scope="col" className="py-2 pr-3 font-bold">
                        Air temp
                      </th>
                      <th scope="col" className="py-2 pr-3 font-bold">
                        Rule of thumb
                      </th>
                      <th scope="col" className="py-2 font-bold">
                        Gas law
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tnum">
                    {reading.rows.map((r) => (
                      <tr
                        key={r.temp}
                        className={`border-b border-ink/[0.07] ${
                          r.current ? "bg-sky font-bold" : ""
                        }`}
                      >
                        <th scope="row" className="py-2 pr-3 font-semibold">
                          {r.temp}°F
                          {r.current && (
                            <span className="sr-only"> (closest to now)</span>
                          )}
                        </th>
                        <td className="py-2 pr-3">{r.thumbText}</td>
                        <td className="py-2">{r.gasText}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="mt-5 flex gap-2 rounded-sm border border-amberInk/30 bg-amber/10 p-3.5 text-[14px] leading-relaxed text-ink">
        <Thermometer
          size={18}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-amberInk"
        />
        <span>
          <strong>{HOT_TIRE_CALLOUT.lead}</strong> {HOT_TIRE_CALLOUT.text}
        </span>
      </p>
      <p className="mt-3 flex gap-2 text-[13px] leading-snug text-smoke">
        <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
        <span>{TPMS_NOTE}</span>
      </p>
    </DemoShell>
  );
}
