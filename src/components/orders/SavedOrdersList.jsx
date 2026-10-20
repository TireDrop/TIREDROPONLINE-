import React, { useState } from "react";
import { ChevronRight, Trash2 } from "lucide-react";

/**
 * The orders remembered on this device. Tap one to see it; "Forget" removes
 * one, "Forget all" (asks first) removes every one.
 */
export default function SavedOrdersList({ saved, selected, onSelect, onForget, onForgetAll }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div>
      <ul className="space-y-2" aria-label="Orders remembered on this device">
        {saved.map((item) => {
          const active = item.order === selected;
          return (
            <li key={item.order} className="flex items-stretch gap-2">
              <button
                type="button"
                onClick={() => onSelect(item.order)}
                aria-pressed={active}
                data-testid="saved-order"
                data-order={item.order}
                className={`flex min-h-[3.25rem] min-w-0 flex-1 items-center justify-between gap-3 rounded-sm border px-4 py-2 text-left ${
                  active ? "border-drop bg-sky" : "border-ink/15 bg-bone hover:border-ink/40"
                }`}
              >
                <span className="min-w-0">
                  <span className="block line-clamp-2 break-words font-display font-bold text-ink">
                    {item.label || item.order}
                  </span>
                  {item.label && <span className="block text-xs text-smoke">{item.order}</span>}
                </span>
                <ChevronRight size={18} aria-hidden className="shrink-0 text-smoke" />
              </button>
              <button
                type="button"
                onClick={() => onForget(item.order)}
                aria-label={`Forget order ${item.order} on this device`}
                data-testid="forget-order"
                className="inline-flex min-h-[3.25rem] min-w-11 items-center justify-center gap-1.5 rounded-sm border border-ink/15 bg-bone px-3 text-sm text-ink hover:border-ink/40"
              >
                <Trash2 size={16} aria-hidden />
                <span>Forget</span>
              </button>
            </li>
          );
        })}
      </ul>

      {saved.length > 1 &&
        (confirming ? (
          <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Forget all orders">
            <p className="text-sm text-ink">Forget all {saved.length} orders on this device?</p>
            <button
              type="button"
              data-testid="forget-all-confirm"
              onClick={() => {
                setConfirming(false);
                onForgetAll();
              }}
              className="inline-flex min-h-11 items-center rounded-sm bg-ink px-4 text-sm font-bold text-bone"
            >
              Yes, forget all
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="inline-flex min-h-11 items-center rounded-sm border border-ink/15 px-4 text-sm text-ink"
            >
              Keep them
            </button>
          </div>
        ) : (
          <button
            type="button"
            data-testid="forget-all"
            onClick={() => setConfirming(true)}
            className="mt-3 inline-flex min-h-11 items-center text-sm text-drop underline"
          >
            Forget all
          </button>
        ))}
    </div>
  );
}
