import React from "react";
import { Check } from "lucide-react";

/**
 * Where an order stands, as a big vertical timeline: Ordered, Paid, With our
 * supplier, Shipped (or On its way to the shop), then Delivered / Ready at the
 * shop / Installed. `timeline` is the server's summary (api/_lib/track.js
 * orderTimeline): steps with `done`, the furthest step reached as `current`.
 * Words carry the state as well as colour ("Done", "Now", "Next"), and there
 * are no dates: only where the order stands.
 */
export default function OrderTimeline({ timeline }) {
  if (!timeline || timeline.cancelled || !Array.isArray(timeline.steps)) return null;
  const { steps, complete } = timeline;
  const furthest = steps.map((s) => s.done).lastIndexOf(true);
  return (
    <ol className="mt-6" aria-label="Order progress" data-testid="order-timeline">
      {steps.map((step, i) => {
        const now = i === furthest && !complete;
        const state = step.done && !now ? "done" : now ? "now" : "next";
        const last = i === steps.length - 1;
        return (
          <li
            key={step.key}
            data-step={step.key}
            data-state={state}
            aria-current={now ? "step" : undefined}
            className="relative flex min-h-[3.5rem] gap-4 pb-1"
          >
            {!last && (
              <span
                aria-hidden
                className={`absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5 ${
                  steps[i + 1].done ? "bg-drop" : "bg-ink/15"
                }`}
              />
            )}
            <span
              aria-hidden
              className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                state === "done"
                  ? "border-drop bg-drop text-bone"
                  : state === "now"
                    ? "border-drop bg-sky text-drop ring-4 ring-drop/15"
                    : "border-ink/20 bg-bone text-smoke"
              }`}
            >
              {state === "done" ? <Check size={20} strokeWidth={3} /> : i + 1}
            </span>
            <div className="pt-1.5">
              <p
                className={`font-display text-lg leading-tight ${
                  state === "next" ? "text-smoke" : "font-bold text-ink"
                }`}
              >
                {step.label}
              </p>
              <p className="text-xs text-smoke">
                {state === "done" ? "Done" : state === "now" ? "Where it is now" : "Next"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
