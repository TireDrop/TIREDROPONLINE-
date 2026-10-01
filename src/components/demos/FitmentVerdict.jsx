// The comparison result shared by the fitment demos (D5 and D6's load
// check): "Meets or exceeds your current tire" or "Below your current tire.
// Not recommended by tire makers". Always text plus an icon, so the result is
// never carried by color alone. Render-pure.

import React from "react";
import { AlertOctagon, CheckCircle2 } from "lucide-react";

const VERDICT_STYLE = {
  meets: {
    cls: "bg-sky text-dive ring-1 ring-inset ring-drop/25",
    Icon: CheckCircle2,
  },
  below: { cls: "bg-ink text-bone", Icon: AlertOctagon },
};

export default function FitmentVerdict({ verdict }) {
  if (!verdict) return null;
  const { cls, Icon } = VERDICT_STYLE[verdict.key] ?? VERDICT_STYLE.below;
  return (
    <span
      className={`inline-flex items-start gap-1.5 rounded-sm px-2.5 py-1.5 font-display text-[14px] font-bold leading-snug ${cls}`}
    >
      <Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
      {verdict.label}
    </span>
  );
}
