import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Star } from "lucide-react";

/** Sets document.title + meta description per page. */
export function Seo({ title, description }) {
  useEffect(() => {
    document.title = `${title} | TireDrop`;
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", "description");
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", description);
    }
  }, [title, description]);
  return null;
}

/** Scrolls to top on route change. Rendered once inside the router. */
export function ScrollToTop({ pathname }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

export function Section({ className = "", children, ...rest }) {
  return (
    <section className={`section ${className}`} {...rest}>
      <div className="wrap">{children}</div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, lede, align = "left", action }) {
  const centered = align === "center";
  return (
    <div
      className={`mb-8 md:mb-12 ${centered ? "text-center" : ""} ${
        action ? "md:flex md:items-end md:justify-between md:gap-8" : ""
      }`}
    >
      <div className={centered ? "mx-auto max-w-2xl" : "max-w-2xl"}>
        {/* The eyebrow carries a short rule so the stack reads eyebrow →
            headline → lede rather than three paragraphs of decreasing size. */}
        {eyebrow && (
          <p
            className={`eyebrow mb-2.5 flex items-center gap-2.5 ${
              centered ? "justify-center" : ""
            }`}
          >
            <span aria-hidden className="h-px w-6 bg-drop/45" />
            {eyebrow}
          </p>
        )}
        <h2 className="h2 text-balance">{title}</h2>
        {lede && (
          <p className={`lede mt-4 max-w-xl ${centered ? "mx-auto" : ""}`}>
            {lede}
          </p>
        )}
      </div>
      {action && <div className="mt-6 shrink-0 md:mt-0">{action}</div>}
    </div>
  );
}

/**
 * Dark page masthead used by every interior page.
 *
 * This band opens nearly every route, so it does more than any other component
 * to set the feel: a lit gradient rather than a flat rectangle, the mark's cyan
 * for the eyebrow (8.2:1 here, where `drop` would be muddy), and a deliberate
 * step down in weight and colour from title to lede so the stack has a shape.
 */
export function PageHero({ eyebrow, title, lede, children }) {
  return (
    <header className="relative overflow-hidden bg-ink bg-ink-wash text-bone">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-volt/35 to-transparent"
      />
      <div className="wrap relative py-14 md:py-20">
        {eyebrow && (
          <p className="eyebrow mb-3 flex items-center gap-2.5 text-volt">
            <span aria-hidden className="h-px w-6 bg-volt/55" />
            {eyebrow}
          </p>
        )}
        <h1 className="h1 max-w-4xl text-balance">{title}</h1>
        {lede && (
          <p className="lede mt-5 max-w-2xl text-bone/70 md:text-[1.25rem]">
            {lede}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </header>
  );
}

export function Breadcrumbs({ trail = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-ink/10 bg-bone">
      <ol className="wrap flex flex-wrap items-center gap-1.5 py-2 text-xs text-smoke">
        <li>
          <Link
            to="/"
            className="flex min-h-[32px] items-center hover:text-drop"
          >
            Home
          </Link>
        </li>
        {trail.map((c, i) => (
          <li key={c.label} className="flex items-center gap-1.5">
            <ChevronRight size={13} aria-hidden className="text-smoke/50" />
            {c.to && i < trail.length - 1 ? (
              <Link
                to={c.to}
                className="flex min-h-[32px] items-center hover:text-drop"
              >
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Small status pill. Uppercase is right here — it is a label, not a sentence —
 * but the tracking comes down to the same 0.09em the eyebrow uses.
 *
 * Every pairing below clears 4.5:1 for its text on its own fill: bone on `drop`
 * 5.07:1, ink on `amber` 9.5:1, bone on `ink` 19.3:1, and `soft` is ink on a
 * near-white tint. The hairline ring keeps `soft` from dissolving on `fog`.
 */
export function Badge({ tone = "drop", children }) {
  const tones = {
    drop: "bg-drop text-bone",
    amber: "bg-amber text-ink",
    ink: "bg-ink text-bone",
    soft: "bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/10",
  };
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-1 font-display text-[11px] font-bold uppercase leading-none tracking-[0.09em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Stars({ rating, count, size = 14 }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex" role="img" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            aria-hidden
            className={
              n <= Math.round(rating)
                ? "fill-amber text-amber"
                : "fill-ink/[0.06] text-ink/25"
            }
          />
        ))}
      </div>
      {count != null && (
        <span className="tnum text-xs text-smoke">({count})</span>
      )}
    </div>
  );
}

/** Accessible accordion item used on FAQ and tip pages. */
export function Accordion({ items = [] }) {
  return (
    <div className="divide-y divide-ink/10 border-y border-ink/10">
      {items.map((item) => (
        <details key={item.q} className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[1.0625rem] font-bold leading-snug tracking-[-0.012em] text-ink transition-colors hover:text-drop md:text-[1.15rem]">
            {item.q}
            <ChevronRight
              size={18}
              aria-hidden
              className="shrink-0 text-drop transition-transform group-open:rotate-90"
            />
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-smoke">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, lede, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      {Icon && (
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-fog text-ink/30">
          <Icon size={26} aria-hidden />
        </span>
      )}
      <h3 className="h3 text-[1.25rem] md:text-[1.375rem]">{title}</h3>
      {lede && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-smoke">
          {lede}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
