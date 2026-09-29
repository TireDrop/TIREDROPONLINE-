// The frame every Learn demo sits in, plus the small pieces the demos share.
//
// Everything here is render-pure: no window or document access, so a
// build-time prerender can render the demos to HTML. Motion is CSS only and
// switched off under prefers-reduced-motion.

import React, { useId } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  CalendarCheck,
  SearchCheck,
} from "lucide-react";

import { SOURCES } from "./sources.js";

/** Card frame: title, one-line intro, the demo, then the Source line. */
export function DemoShell({ title, intro, sources = [], children, demoId }) {
  const id = useId();
  return (
    <section
      aria-labelledby={`${id}-title`}
      data-demo={demoId}
      className="not-prose my-8 overflow-hidden rounded-card border border-ink/[0.08] bg-bone text-ink shadow-card"
    >
      <header className="border-b border-ink/[0.07] px-4 pb-4 pt-5 sm:px-6">
        <p className="font-display text-[12px] font-bold uppercase tracking-[0.09em] text-drop">
          Try it
        </p>
        <h3
          id={`${id}-title`}
          className="mt-1 font-display text-[1.2rem] leading-[1.15] text-ink md:text-[1.35rem]"
        >
          {title}
        </h3>
        {intro && (
          <p className="mt-1.5 text-[15px] leading-relaxed text-smoke">
            {intro}
          </p>
        )}
      </header>
      <div className="px-4 py-5 sm:px-6 sm:py-6">{children}</div>
      <SourceLine ids={sources} />
    </section>
  );
}

/** "Sources: NHTSA TireWise; USTMA Tire Care Essentials", linked. */
export function SourceLine({ ids = [] }) {
  const list = [...new Set(ids)]
    .map((sid) => ({ sid, ...SOURCES[sid] }))
    .filter((s) => s.url);
  if (!list.length) return null;
  return (
    <p className="border-t border-ink/[0.07] bg-fog px-4 py-3 text-[13px] leading-relaxed text-smoke sm:px-6">
      <span className="font-bold text-ink">
        {list.length > 1 ? "Sources" : "Source"}:
      </span>{" "}
      {list.map((s, i) => (
        <React.Fragment key={s.sid}>
          {i > 0 && "; "}
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-dive underline decoration-1 underline-offset-2 hover:text-ink"
          >
            {s.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </React.Fragment>
      ))}
    </p>
  );
}

const TONES = {
  replace: { cls: "bg-ink text-bone", Icon: AlertOctagon },
  mfrReplace: { cls: "bg-ink text-bone", Icon: AlertOctagon },
  consider: { cls: "bg-amber text-ink", Icon: AlertTriangle },
  inspect: { cls: "bg-amber text-ink", Icon: SearchCheck },
  monitor: {
    cls: "bg-sky text-dive ring-1 ring-inset ring-drop/25",
    Icon: CalendarCheck,
  },
};

/** The status word, with an icon, so tone is never carried by color alone. */
export function StatusBadge({ status }) {
  if (!status) return null;
  const tone = TONES[status.key] ?? TONES.monitor;
  const { Icon } = tone;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 font-display text-[14px] font-bold leading-none ${tone.cls}`}
    >
      <Icon size={16} aria-hidden="true" className="shrink-0" />
      {status.label}
    </span>
  );
}

/**
 * A native radio group styled as cards. Arrow keys move between options,
 * the checked card gets a thicker border, bold text and the filled radio.
 */
export function RadioCards({
  legend,
  name,
  options,
  value,
  onChange,
  className = "grid-cols-1 sm:grid-cols-3",
}) {
  return (
    <fieldset>
      <legend className="mb-2 font-display text-[13px] font-bold text-ink">
        {legend}
      </legend>
      <div className={`grid gap-2 ${className}`}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-sm border px-3 py-2.5 transition-colors motion-reduce:transition-none ${
                checked
                  ? "border-2 border-drop bg-sky"
                  : "border-ink/15 bg-bone hover:border-ink/30 hover:bg-fog"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="h-5 w-5 shrink-0 accent-drop"
              />
              <span className="min-w-0">
                <span
                  className={`block font-display text-[15px] leading-tight text-ink ${
                    checked ? "font-extrabold" : "font-semibold"
                  }`}
                >
                  {o.label}
                </span>
                {o.hint && (
                  <span className="mt-0.5 block text-[13px] leading-snug text-smoke">
                    {o.hint}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** A 44px chip button, used for examples and presets. */
export function ChipButton({ onClick, pressed, children, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={label}
      className={`inline-flex min-h-[44px] items-center rounded-sm border px-3 font-display text-[14px] font-bold transition-colors motion-reduce:transition-none ${
        pressed
          ? "border-ink bg-ink text-bone"
          : "border-ink/15 bg-bone text-ink hover:border-ink/30 hover:bg-fog"
      }`}
    >
      {children}
    </button>
  );
}

/** A figure tile: small label, big value, optional note. */
export function Stat({ label, value, sub }) {
  return (
    <div className="rounded-sm bg-fog p-3.5">
      <p className="font-display text-[11px] font-bold uppercase tracking-[0.07em] text-smoke">
        {label}
      </p>
      <p className="tnum mt-1 font-display text-[1.35rem] font-extrabold leading-none text-ink">
        {value}
      </p>
      {sub && <p className="mt-1 text-[13px] leading-snug text-smoke">{sub}</p>}
    </div>
  );
}
