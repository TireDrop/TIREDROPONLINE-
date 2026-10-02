/**
 * Shared pieces of the Learn and Blog pages: cards, the meta line, the table
 * of contents, sources, related links, the monthly check and the CTA band.
 */
import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ExternalLink,
  ListChecks,
  MousePointerClick,
  Phone,
  ShoppingCart,
} from "lucide-react";
import { BUSINESS } from "../../data/business.js";
import { getService } from "../../data/services.js";
import { Badge } from "../ui/index.jsx";
import { getHub, isExternalUrl, isLive } from "../../content/index.js";
import { TOOL_PAGES } from "../demos/toolPages.js";

/* ------------------------------------------------------------------ *
 * Formatting
 * ------------------------------------------------------------------ */

/**
 * "2026-09-29" -> "Sep 29, 2026". Read as noon UTC and formatted in UTC, so
 * the date is the same on the build server, in prerendered HTML and in every
 * visitor's time zone.
 */
export function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const plural = (n, one, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

/* ------------------------------------------------------------------ *
 * Cards and labels
 * ------------------------------------------------------------------ */

/** Hub title for a Learn guide, category label for a post. */
export function sectionLabel(article) {
  if (article.section === "learn") return getHub(article.hub)?.title ?? "Learn";
  return article.category?.label ?? "Blog";
}

export function DraftBadge({ article }) {
  if (article.public) return null;
  return <Badge tone="amber">{article.sample ? "Sample" : "Draft"}</Badge>;
}

/**
 * `headingAs`: the card title's level. h3 under a section heading (the Learn
 * index); h2 where the cards sit straight under the page's H1 (a hub, /blog),
 * so the outline never skips a level.
 */
export function ArticleCard({
  article,
  showSection = true,
  showDate = false,
  headingAs: Heading = "h3",
}) {
  return (
    <li className="h-full">
      <Link
        to={article.path}
        className="card-hover group flex h-full flex-col p-5 md:p-6"
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {showSection && (
            <span className="eyebrow">{sectionLabel(article)}</span>
          )}
          <DraftBadge article={article} />
          {article.demo && (
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-smoke">
              <MousePointerClick size={13} aria-hidden className="text-drop" />
              Interactive
            </span>
          )}
        </div>
        <Heading className="h3 text-[1.15rem] transition-colors group-hover:text-drop md:text-[1.3rem]">
          {article.title}
        </Heading>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-smoke">
          {article.description}
        </p>
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-smoke">
          {showDate && (
            <time dateTime={article.date}>{formatDate(article.date)}</time>
          )}
          <span>{article.readingMinutes} min read</span>
          <span className="ml-auto inline-flex items-center gap-1 font-display font-bold text-drop">
            Read
            <ArrowRight size={14} aria-hidden />
          </span>
        </p>
      </Link>
    </li>
  );
}

/**
 * Author, dates and reading time. No ratings, no view counts: the site
 * publishes neither, and inventing them is against the house rules.
 */
export function ArticleMeta({ article, className = "" }) {
  return (
    <p
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm ${className}`}
    >
      <span>By {article.author}</span>
      <span aria-hidden>·</span>
      <span>
        Published{" "}
        <time dateTime={article.date}>{formatDate(article.date)}</time>
      </span>
      <span aria-hidden>·</span>
      <span>
        Updated{" "}
        <time dateTime={article.updated}>{formatDate(article.updated)}</time>
      </span>
      <span aria-hidden>·</span>
      <span>{article.readingMinutes} min read</span>
    </p>
  );
}

/* ------------------------------------------------------------------ *
 * Table of contents
 * ------------------------------------------------------------------ */

function TocList({ toc, extra }) {
  return (
    <ol className="space-y-1 text-sm">
      {[...toc, ...extra].map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            className="block rounded-sm py-1.5 leading-snug text-smoke transition-colors hover:text-drop"
          >
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

/**
 * `variant="inline"` is the collapsible box above the body on phones and
 * tablets; `variant="aside"` is the sticky column on desktop.
 */
export function TableOfContents({ toc, extra = [], variant = "inline" }) {
  if (toc.length + extra.length < 2) return null;
  if (variant === "aside") {
    return (
      <nav
        aria-label="On this page"
        className="sticky top-[calc(var(--header-h)+1.5rem)]"
      >
        <p className="label mb-2 flex items-center gap-1.5">
          <ListChecks size={14} aria-hidden />
          On this page
        </p>
        <div className="border-l border-ink/10 pl-4">
          <TocList toc={toc} extra={extra} />
        </div>
      </nav>
    );
  }
  return (
    <nav aria-label="On this page" className="mb-8 lg:hidden">
      <details className="card group px-5 py-3">
        <summary className="flex min-h-[40px] cursor-pointer list-none items-center justify-between gap-3 font-display text-[15px] font-bold text-ink">
          <span className="flex items-center gap-2">
            <ListChecks size={17} aria-hidden className="text-drop" />
            On this page
          </span>
          <ArrowRight
            size={16}
            aria-hidden
            className="text-drop transition-transform group-open:rotate-90"
          />
        </summary>
        <div className="mt-2 border-t border-ink/10 pt-2">
          <TocList toc={toc} extra={extra} />
        </div>
      </details>
    </nav>
  );
}

/* ------------------------------------------------------------------ *
 * Takeaways, sources, related
 * ------------------------------------------------------------------ */

export function KeyTakeaways({ items }) {
  if (!items?.length) return null;
  return (
    <aside
      aria-labelledby="key-takeaways"
      className="card mt-10 border-l-4 border-l-drop p-6"
    >
      <h2 id="key-takeaways" className="h3 mb-4">
        Key takeaways
      </h2>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 text-[15px] leading-relaxed text-ink"
          >
            <CheckCircle2
              size={17}
              aria-hidden
              className="mt-1 shrink-0 text-drop"
            />
            {item}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function SourcesList({ sources }) {
  if (!sources?.length) return null;
  return (
    <section aria-labelledby="sources" className="mt-12">
      <h2 id="sources" className="h3 mb-4 scroll-mt-[calc(var(--header-h)+1rem)]">
        Sources
      </h2>
      <ol className="space-y-2.5 text-sm">
        {sources.map((source, i) => (
          <li key={source.url} className="flex gap-3">
            <span className="tnum w-6 shrink-0 text-right font-display font-bold text-smoke">
              {i + 1}.
            </span>
            <span className="min-w-0">
              <a
                href={source.url}
                target="_blank"
                rel="noopener nofollow"
                className="inline-flex items-baseline gap-1 break-words font-semibold text-drop underline decoration-drop/30 underline-offset-2 hover:decoration-drop"
              >
                {source.title}
                <ExternalLink
                  size={12}
                  aria-hidden
                  className="shrink-0 self-center"
                />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              {source.publisher && (
                <span className="text-smoke"> — {source.publisher}</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Labels for the site pages an article's `related` list may point at. */
const SITE_PAGES = {
  "/tires": "Shop tires",
  "/wheels": "Shop wheels",
  "/compare": "Compare tires side by side",
  "/commercial-tires": "Commercial and fleet tires",
  "/shipping": "How shipping works",
  "/install": "Ship to the shop and have them installed",
  "/mobile-service": "Mobile tire installation",
  "/schedule": "Book an install",
  "/auto-service": "Auto services at the shop",
  "/tire-check": "Do I need tires yet? (free check)",
  "/tire-size": "Tire size decoder",
  "/find-my-tires": "Find tires for your vehicle",
  "/tire-size-finder": "Find your exact tire size (scan your door sticker)",
  ...Object.fromEntries(TOOL_PAGES.map((t) => [t.path, t.label])),
  "/learn": "All Learn guides",
  "/blog": "The TireDrop blog",
  "/locations": "Visit the shop",
  "/contact": "Contact the shop",
};

function pageLabel(path) {
  const bare = path.replace(/[?#].*$/, "");
  if (SITE_PAGES[bare]) return SITE_PAGES[bare];
  const hub = /^\/learn\/([^/]+)$/.exec(bare);
  if (hub) return getHub(hub[1]) ? `${getHub(hub[1]).title} guides` : null;
  const service = /^\/services\/([^/]+)$/.exec(bare);
  if (service) return getService(service[1])?.name ?? null;
  return null;
}

/**
 * Related reading. Paths that are articles show as cards; other site pages
 * as links. A Learn or Blog path that is not published in this build (an
 * unwritten guide, a topic with no guides yet) is hidden, never a 404.
 */
export function RelatedLinks({ paths, resolve, fallback = [] }) {
  const articles = [];
  const pages = [];
  for (const path of paths) {
    const article = resolve(path);
    if (article) articles.push(article);
    else if (isLive(path)) {
      const label = pageLabel(path);
      if (label) pages.push({ path, label });
    }
  }
  const cards = articles.length ? articles : fallback;
  if (!cards.length && !pages.length) return null;

  return (
    <section aria-labelledby="related" className="mt-14">
      <h2 id="related" className="h3 mb-5 scroll-mt-[calc(var(--header-h)+1rem)]">
        Related reading
      </h2>
      {cards.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {cards.slice(0, 4).map((a) => (
            <ArticleCard
              key={a.path}
              article={a}
              showDate={a.section === "blog"}
            />
          ))}
        </ul>
      )}
      {pages.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2.5">
          {pages.map((p) => (
            <li key={p.path}>
              <Link to={p.path} className="btn-outline btn-sm">
                {p.label}
                <ArrowRight size={14} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The five-minute monthly check (moved here from the old /tire-care page)
 * ------------------------------------------------------------------ */

export const MONTHLY_CHECK = [
  "Check pressure on all four tires and the spare, cold, against the placard on the driver's door jamb.",
  "Look at tread depth: find the wear bars, and measure three grooves across each tire.",
  "Scan the sidewalls for cuts, cracks or bulges. Have anything you find inspected.",
  "Note anything new: a pull, a shimmy, a noise or a warning light.",
];

export function MonthlyCheck() {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {MONTHLY_CHECK.map((step, i) => (
        <li key={step} className="card p-5">
          <span
            aria-hidden
            className="mb-3 block font-display text-3xl leading-none text-drop"
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <p className="text-sm leading-relaxed text-ink">{step}</p>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ *
 * Call to action
 * ------------------------------------------------------------------ */

function CtaLink({ href, className, children }) {
  if (isExternalUrl(href))
    return (
      <a href={href} className={className} target="_blank" rel="noopener">
        {children}
      </a>
    );
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}

/**
 * The closing box: the article's own `cta` first, then shop, book an install
 * and call, without repeating whichever of those the `cta` already is.
 */
export function ContentCta({
  cta,
  title = "Need tires, or a second look at yours?",
  className = "mt-14",
}) {
  const primary = cta ?? { label: "Shop tires", href: "/tires" };
  const secondary = [
    { label: "Shop tires", href: "/tires", Icon: ShoppingCart },
    { label: "Book an install", href: "/install", Icon: CalendarCheck },
  ].filter((l) => l.href !== primary.href);

  return (
    <section
      aria-labelledby="content-cta"
      className={`relative overflow-hidden rounded-card bg-ink bg-ink-wash p-6 text-bone md:p-8 ${className}`}
    >
      <h2 id="content-cta" className="h3 text-bone md:text-[1.6rem]">
        {title}
      </h2>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-bone/70">
        Free shipping to the 48 contiguous states and DC, or free to our{" "}
        {BUSINESS.shop.city} shop for installation in South Florida. Not sure
        what you need? Call and read us the size on your sidewall.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <CtaLink href={primary.href} className="btn-primary">
          {primary.label}
          <ArrowRight size={16} aria-hidden />
        </CtaLink>
        {secondary.map(({ label, href, Icon }) => (
          <Link key={href} to={href} className="btn-ghost-light">
            <Icon size={16} aria-hidden />
            {label}
          </Link>
        ))}
        <a href={BUSINESS.phoneHref} className="btn-ghost-light">
          <Phone size={16} aria-hidden />
          Call {BUSINESS.phone}
        </a>
      </div>
    </section>
  );
}

/** Small "browse the guides" link row used on the index pages. */
export function GuideLink({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-[32px] items-center gap-1.5 font-display text-sm font-bold text-drop hover:text-dive"
    >
      <BookOpen size={15} aria-hidden />
      {children}
      <ArrowRight size={15} aria-hidden />
    </Link>
  );
}
