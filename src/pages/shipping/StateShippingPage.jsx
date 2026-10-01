import React from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  ClipboardCheck,
  ExternalLink,
  MapPin,
  Search,
  SearchX,
  ShoppingCart,
  Store,
  Thermometer,
  Truck,
} from "lucide-react";

import {
  Accordion,
  Breadcrumbs,
  EmptyState,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";
import {
  FACTS_CHECKED,
  FACT_LABELS,
  STATE_PAGE_SHARED as SHARED,
  buildStatePage,
  shownClimate,
  shownFacts,
} from "../../data/statePages.js";
import {
  STATE_PAGES_LIVE,
  getLiveState,
  statePath,
} from "../../data/stateList.js";
import { CITY_PAGES, cityPath } from "../../data/cityPages.js";

const HUB = { name: "Tires Shipped Nationwide", path: "/tires-shipped" };

function NotFoundPanel() {
  return (
    <>
      <Seo
        title="State Page Not Found"
        description="That state page does not exist yet. Tires ship free to the 48 contiguous states and DC; the shipping page lists every state guide."
        noindex
      />
      <Breadcrumbs
        trail={[{ label: HUB.name, to: HUB.path }, { label: "Not found" }]}
      />
      <Section className="bg-fog">
        <EmptyState
          icon={SearchX}
          as="h1"
          title="We don't have a guide for that state yet"
          lede="Tires still ship free to every address in the 48 contiguous states and DC. The nationwide shipping page lists the state guides we have."
          action={
            <Link to={HUB.path} className="btn-primary btn-sm">
              Tires shipped nationwide
              <ArrowRight size={16} aria-hidden />
            </Link>
          }
        />
      </Section>
    </>
  );
}

function Sources({ sources }) {
  return (
    <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-smoke">
      <span>Source:</span>
      {sources.map((s) => (
        <a
          key={s.url}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-drop underline underline-offset-2 hover:text-dive"
        >
          {s.name}
          <ExternalLink size={11} aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ))}
    </p>
  );
}

/**
 * /tires-shipped/:state — free tire shipping to one state, with that state's
 * tire rules and climate (src/data/statePages.js). Only the states in
 * STATE_PAGES_LIVE (src/data/stateList.js) render; any other slug is the
 * not-found panel, noindexed, and is never prerendered. Seo adds a Service
 * with the state as areaServed and Home > Tires Shipped Nationwide > State.
 */
export default function StateShippingPage() {
  const { state: slug } = useParams();
  const page = buildStatePage(getLiveState(slug));
  if (!page) return <NotFoundPanel />;

  const facts = shownFacts(page);
  const climate = shownClimate(page);
  const neighbors = page.neighbors.map(getLiveState).filter(Boolean);
  const others = STATE_PAGES_LIVE.filter(
    (s) => s !== page.slug && !page.neighbors.includes(s),
  ).map(getLiveState);
  const florida = Boolean(page.localInstall);

  return (
    <>
      <Seo
        title={page.seoTitle}
        description={page.description}
        crumbs={[HUB]}
      />
      <Breadcrumbs
        trail={[{ label: HUB.name, to: HUB.path }, { label: page.name }]}
      />

      <PageHero
        eyebrow={`Free shipping · ${page.abbr}`}
        title={`Tires Shipped Free to ${page.name}`}
        lede={page.intro}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to="/tires" className="btn-primary">
            <ShoppingCart size={18} aria-hidden />
            Shop Tires
          </Link>
          <Link to="/find-my-tires" className="btn-ghost-light">
            <Search size={18} aria-hidden />
            Find My Tires
          </Link>
        </div>
      </PageHero>

      {/* ---------- State rules, each with its source ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="State rules"
          title={`${page.name} tire rules, with sources`}
        />
        <p className="-mt-2 mb-6 max-w-3xl text-sm leading-relaxed text-smoke md:-mt-6">
          {SHARED.legal} Laws change: check{" "}
          <a
            href={page.dmv.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-drop underline underline-offset-2 hover:text-dive"
          >
            {page.dmv.name}
          </a>{" "}
          for current rules.
        </p>
        <ul className="grid gap-5 md:grid-cols-2">
          {facts.map(([key, fact]) => (
            <li key={key} className="card p-6">
              <h3 className="h3">{FACT_LABELS[key]}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink">
                {fact.text}
              </p>
              <Sources sources={fact.sources} />
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs text-smoke">
          Sources checked {FACTS_CHECKED}.
        </p>
      </Section>

      {/* ---------- Climate and tire type ---------- */}
      <Section className="bg-fog">
        <SectionHead
          eyebrow="Climate and tire choice"
          title={`Which tire type for ${page.name}`}
        />
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-14">
          <div className="-mt-2 md:-mt-6">
            <h3 className="h3">{page.tireTypeTitle}</h3>
            <div className="mt-3 space-y-4 text-[15px] leading-relaxed text-ink">
              {page.tireType.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
          </div>
          <ul className="space-y-4 self-start">
            {climate.map((c) => (
              <li key={c.text.slice(0, 40)} className="card p-5">
                <p className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
                  <Thermometer size={16} aria-hidden className="mt-0.5 shrink-0 text-drop" />
                  <span>{c.text}</span>
                </p>
                <Sources sources={c.sources} />
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ---------- Florida: install vs ship ---------- */}
      {florida && (
        <Section className="bg-bone">
          <SectionHead eyebrow="Install or ship" title={page.localInstall.title} />
          <div className="-mt-2 max-w-3xl space-y-4 text-[15px] leading-relaxed text-ink md:-mt-6">
            {page.localInstall.body.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link to="/mobile-service" className="btn-primary btn-sm">
              Mobile installation
              <ArrowRight size={14} aria-hidden />
            </Link>
            <Link to="/install" className="btn-outline btn-sm">
              <Store size={14} aria-hidden />
              Ship to store
            </Link>
          </div>
          <h3 className="label mb-2 mt-8">Mobile service city pages</h3>
          <ul className="flex flex-wrap gap-2">
            {CITY_PAGES.map((c) => (
              <li key={c.slug}>
                <Link to={cityPath(c.slug)} className="btn-outline btn-sm">
                  <MapPin size={14} aria-hidden />
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ---------- Shipping (shared, short) ---------- */}
      <Section className={florida ? "bg-fog" : "bg-bone"}>
        <SectionHead
          eyebrow="Shipping"
          title={`How shipping to ${page.name} works`}
        />
        <ol className="-mt-2 grid gap-5 md:-mt-6 md:grid-cols-3">
          {SHARED.shipSteps.map((step, i) => (
            <li key={step.title} className="card p-6">
              <span aria-hidden className="font-display text-3xl leading-none text-ink/50">
                0{i + 1}
              </span>
              <h3 className="h3 mt-3">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-smoke">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 flex max-w-3xl items-start gap-2 text-[15px] leading-relaxed text-ink">
          <Truck size={18} aria-hidden className="mt-0.5 shrink-0 text-drop" />
          <span>
            {page.shipNote}{" "}
            <Link to="/shipping" className="text-drop underline hover:text-dive">
              How shipping works
            </Link>
          </span>
        </p>
      </Section>

      {/* ---------- Local mounting ---------- */}
      <Section className={florida ? "bg-bone" : "bg-fog"}>
        <SectionHead
          eyebrow="Mounting"
          title={
            florida
              ? "Getting them mounted elsewhere in Florida"
              : `Getting them mounted in ${page.name}`
          }
        />
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="-mt-2 space-y-4 text-[15px] leading-relaxed text-ink md:-mt-6">
            <p>{page.mountNote}</p>
            <p className="text-sm text-smoke">{SHARED.shopNote}</p>
          </div>
          <div className="card self-start p-6">
            <h3 className="h3 flex items-center gap-2">
              <ClipboardCheck size={20} aria-hidden className="text-drop" />
              What to ask a shop
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink">
              {SHARED.askShop.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-smoke">{SHARED.bring}</p>
          </div>
        </div>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section className={florida ? "bg-fog" : "bg-bone"}>
        <SectionHead eyebrow="Questions" title={`Asked about ${page.name}`} />
        <Accordion items={page.faq} />
      </Section>

      {/* ---------- Tools + other states ---------- */}
      <Section className="bg-steel-wash text-bone">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <h2 className="h3">{SHARED.toolsLede}</h2>
            <ul className="mt-4 flex flex-wrap gap-2.5">
              {SHARED.tools.map((t) => (
                <li key={t.to}>
                  <Link to={t.to} className="btn-ghost-light btn-sm">
                    {t.label}
                    <ArrowRight size={14} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <nav aria-label="State guides">
            {neighbors.length > 0 && (
              <>
                <h2 className="h3">Neighboring states</h2>
                <ul className="mt-4 flex flex-wrap gap-2.5">
                  {neighbors.map((s) => (
                    <li key={s.slug}>
                      <Link to={statePath(s.slug)} className="btn-ghost-light btn-sm">
                        <MapPin size={14} aria-hidden />
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <h2 className={`h3 ${neighbors.length ? "mt-6" : ""}`}>More state guides</h2>
            <ul className="mt-4 flex flex-wrap gap-2.5">
              {others.map((s) => (
                <li key={s.slug}>
                  <Link to={statePath(s.slug)} className="btn-ghost-light btn-sm">
                    {s.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to={HUB.path} className="btn-ghost-light btn-sm">
                  All states
                  <ArrowRight size={14} aria-hidden />
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </Section>
    </>
  );
}
