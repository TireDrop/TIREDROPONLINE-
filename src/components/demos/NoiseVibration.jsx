// D14 Noise & Vibration Symptom Checker (learn-plan §4): answer when it
// happens, where you feel it and what you hear, and see possible causes with
// the service that checks each.
//
// The list comes from rankCauses() in maintenanceLogic.js: a fixed rules
// table that adds points per answer, not a probability and not a diagnosis.
// The status is always "Have it inspected".

import React, { useId, useState } from "react";
import { ArrowRight, Wrench } from "lucide-react";

import { DemoShell, RadioCards, StatusBadge } from "./DemoShell.jsx";
import {
  NOISE_DEFAULTS,
  NOISE_MAX_CAUSES,
  NOISE_QUESTIONS,
  answerLabels,
  rankCauses,
} from "./maintenanceLogic.js";

const SOURCES_USED = ["S45", "S38"];

export default function NoiseVibration() {
  const id = useId();
  const uid = id.replace(/:/g, "");
  const [answers, setAnswers] = useState(NOISE_DEFAULTS);
  const result = rankCauses(answers);
  const review = answerLabels(answers);

  return (
    <DemoShell
      demoId="noise-vibration"
      title="Shake, hum or thump?"
      intro="Answer three questions. See possible causes, strongest match first, and which service checks each one."
      sources={SOURCES_USED}
    >
      <div className="space-y-5">
        {NOISE_QUESTIONS.map((q, i) => (
          <RadioCards
            key={q.id}
            legend={`${i + 1}. ${q.legend}`}
            name={`${uid}-${q.id}`}
            value={answers[q.id]}
            onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
            options={q.options.map((o) => ({ value: o.value, label: o.label }))}
            className="grid-cols-1 sm:grid-cols-2"
          />
        ))}
      </div>

      <div
        aria-live="polite"
        aria-atomic="true"
        className="mt-6 rounded-sm border-l-4 border-ink bg-fog p-4"
      >
        <StatusBadge status={result.status} />
        <p className="mt-3 text-[13px] leading-snug text-smoke">
          <span className="font-bold text-ink">Your answers:</span>{" "}
          {review.map((r) => r.label ?? "not answered").join(" · ")}
        </p>

        {result.causes.length ? (
          <>
            <h4 className="mt-3 font-display text-[1.1rem] font-extrabold leading-tight text-ink">
              Possible causes, strongest match first
            </h4>
            <ol className="mt-2 list-decimal space-y-2.5 pl-5 text-[15px] leading-relaxed text-ink marker:font-bold">
              {result.causes.map((c) => (
                <li key={c.id}>
                  <span className="font-bold">{c.name}.</span>
                  <span className="mt-0.5 flex items-start gap-1.5">
                    <Wrench
                      size={14}
                      aria-hidden="true"
                      className="mt-1.5 shrink-0 text-smoke"
                    />
                    <span>Checked by: {c.service}</span>
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-smoke">
                    {c.matchedText}
                  </span>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="mt-3 text-[15px] leading-relaxed text-ink">
            {result.message}
          </p>
        )}

        <p className="mt-3 text-[14px] font-semibold leading-relaxed text-ink">
          {result.note}
        </p>
      </div>

      <details className="mt-4 rounded-sm border border-ink/10 bg-bone">
        <summary className="flex min-h-[44px] cursor-pointer items-center px-3 font-display text-[14px] font-bold text-ink">
          How the list is ranked
        </summary>
        <p className="px-3 pb-3 text-[14px] leading-relaxed text-smoke">
          Each answer adds points to the causes it is linked to in a fixed
          rules table. Causes with more points are listed first, a tie keeps
          the table&apos;s order, and at most {NOISE_MAX_CAUSES} are shown. The
          points only order the list; they are not odds, and only an
          inspection can tell what is causing it.
        </p>
      </details>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a href="/schedule" className="btn-primary btn-sm min-h-[44px]">
          Book an inspection
          <ArrowRight size={16} aria-hidden="true" />
        </a>
        <p className="text-[13px] leading-snug text-smoke">
          Tell us what you answered here when you book.
        </p>
      </div>
    </DemoShell>
  );
}
