import React, { Component, Suspense } from "react";
import { MousePointerClick } from "lucide-react";
import { DEMOS, DEMO_META } from "../demos/index.js";
import { trackToolUse } from "../../lib/analytics.js";

/**
 * A demo that throws must not take the article down with it. It falls back
 * to the same neutral box as a demo that does not exist yet.
 */
class DemoBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) console.error("[demo]", this.props.id, error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function DemoBox({ title, alt, busy = false }) {
  return (
    <div
      className="rounded-card border border-dashed border-ink/20 bg-fog p-5 md:p-6"
      aria-busy={busy || undefined}
    >
      <p className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
        <MousePointerClick size={18} aria-hidden className="text-drop" />
        {busy
          ? "Loading the interactive demo…"
          : "Interactive demo coming soon"}
      </p>
      {title && <p className="mt-1 text-sm text-smoke">{title}</p>}
      {alt && (
        <p className="mt-3 border-t border-ink/10 pt-3 text-sm leading-relaxed text-smoke">
          {alt}
        </p>
      )}
    </div>
  );
}

/**
 * One `[[demo:<id>]]` embed. Looks the id up in the demo registry
 * (src/components/demos/index.js): a known demo loads lazily behind a text
 * fallback; an unknown or missing id renders a neutral placeholder, never an
 * error. The registry's `alt` text is kept under the demo as a text version.
 */
export default function DemoEmbed({ id }) {
  const Demo = DEMOS[id];
  const meta = DEMO_META[id] ?? {};

  if (!Demo) {
    return (
      <div className="my-8" data-demo={id}>
        <DemoBox title={meta.title} alt={meta.alt} />
      </div>
    );
  }

  return (
    // GA4 tool_use on the first touch, key or input inside the demo
    // (once per page view; src/lib/analytics.js).
    <figure
      className="my-8"
      data-demo={id}
      onPointerDownCapture={() => trackToolUse(id)}
      onKeyDownCapture={() => trackToolUse(id)}
      onInputCapture={() => trackToolUse(id)}
    >
      <DemoBoundary
        id={id}
        fallback={<DemoBox title={meta.title} alt={meta.alt} />}
      >
        <Suspense fallback={<DemoBox title={meta.title} alt={meta.alt} busy />}>
          <Demo />
        </Suspense>
      </DemoBoundary>
      {meta.alt && (
        <figcaption className="mt-3">
          <details className="text-sm text-smoke">
            <summary className="cursor-pointer font-display font-bold text-ink hover:text-drop">
              Text version of this demo
            </summary>
            <p className="mt-2 leading-relaxed">{meta.alt}</p>
          </details>
        </figcaption>
      )}
    </figure>
  );
}
