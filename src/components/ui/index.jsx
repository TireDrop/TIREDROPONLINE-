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
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="h2">{title}</h2>
        {lede && <p className="lede mt-3">{lede}</p>}
      </div>
      {action && <div className="mt-5 shrink-0 md:mt-0">{action}</div>}
    </div>
  );
}

/** Dark page masthead used by every interior page. */
export function PageHero({ eyebrow, title, lede, children }) {
  return (
    <header className="bg-ink text-bone">
      <div className="wrap py-12 md:py-16">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="h1">{title}</h1>
        {lede && <p className="lede mt-4 max-w-2xl text-bone/70">{lede}</p>}
        {children && <div className="mt-7">{children}</div>}
      </div>
    </header>
  );
}

export function Breadcrumbs({ trail = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-ink/10 bg-bone">
      <ol className="wrap flex flex-wrap items-center gap-1.5 py-2 text-xs text-smoke">
        <li>
          <Link to="/" className="flex min-h-[32px] items-center hover:text-drop">
            Home
          </Link>
        </li>
        {trail.map((c, i) => (
          <li key={c.label} className="flex items-center gap-1.5">
            <ChevronRight size={13} aria-hidden className="text-smoke/50" />
            {c.to && i < trail.length - 1 ? (
              <Link to={c.to} className="flex min-h-[32px] items-center hover:text-drop">
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

export function Badge({ tone = "drop", children }) {
  const tones = {
    drop: "bg-drop text-bone",
    amber: "bg-amber text-ink",
    ink: "bg-ink text-bone",
    soft: "bg-ink/5 text-ink",
  };
  return (
    <span
      className={`inline-block rounded-sm px-2 py-0.5 font-display text-[11px] uppercase tracking-[0.12em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Stars({ rating, count, size = 14 }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex"
        role="img"
        aria-label={`${rating} out of 5 stars`}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            aria-hidden
            className={
              n <= Math.round(rating)
                ? "fill-amber text-amber"
                : "text-ink/20"
            }
          />
        ))}
      </div>
      {count != null && (
        <span className="text-xs text-smoke">({count})</span>
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
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg uppercase">
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
      {Icon && <Icon size={36} aria-hidden className="mb-4 text-ink/20" />}
      <h3 className="h3">{title}</h3>
      {lede && <p className="lede mt-2 max-w-sm text-sm">{lede}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
