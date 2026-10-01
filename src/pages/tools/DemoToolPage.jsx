import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck, MapPin, Phone } from "lucide-react";

import {
  Accordion,
  Breadcrumbs,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";
import DemoEmbed from "../../components/content/DemoEmbed.jsx";
import { RelatedLinks } from "../../components/content/parts.jsx";
import { TOOL_PAGES, TOOL_PAGE_BY_ID } from "../../components/demos/toolPages.js";
import { getArticleByPath } from "../../content/index.js";
import { BUSINESS } from "../../data/business.js";
import { SERVICE_AREA_LABEL } from "../../data/serviceArea.js";
import { getService } from "../../data/services.js";

/** "TPMS Service" → "TPMS service": sentence case, acronyms kept. */
const sentenceCase = (name) =>
  name
    .split(" ")
    .map((w) => (/^[A-Z]{2,}$/.test(w) ? w : w.toLowerCase()))
    .join(" ");

/**
 * A Learn demo on a page of its own: /load-speed-check, /plus-size-calculator,
 * /tire-pressure-temperature, /can-my-tire-be-repaired, /car-shaking-checker
 * and /tire-rotation-pattern. One template, one route per tool in App.jsx;
 * the copy is in src/components/demos/toolPages.js and the demo is the same
 * component the articles embed, so the two never drift.
 *
 * Same shape as the other free tools: Seo, a Learn breadcrumb, the dark hero
 * with the H1, the tool, then how to use it, booking, FAQ and related reading.
 */
export default function DemoToolPage({ tool }) {
  const page = TOOL_PAGE_BY_ID[tool];
  const services = page.services.map(getService).filter(Boolean);
  const [primary, ...more] = services;
  const others = TOOL_PAGES.filter((t) => t.id !== page.id);

  return (
    <>
      <Seo
        title={page.seoTitle}
        description={page.description}
        crumbs={[{ name: "Learn", path: "/learn" }]}
      />
      <Breadcrumbs
        trail={[{ label: "Learn", to: "/learn" }, { label: page.label }]}
      />

      <PageHero eyebrow="Free tool" title={page.h1} lede={page.intro} />

      <Section className="bg-bone">
        {/* The embed's own my-8 is for an article column; the section pads. */}
        <div className="mx-auto max-w-[880px] [&>figure]:my-0">
          <h2 className="sr-only">The tool</h2>
          <DemoEmbed id={page.id} />
        </div>
      </Section>

      <Section className="bg-fog">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-14">
          <div>
            <SectionHead eyebrow="Step by step" title="How to use it" />
            <ol className="-mt-2 space-y-3 md:-mt-6">
              {page.howTo.map((step, i) => (
                <li key={step} className="flex gap-3.5">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[13px] font-bold text-bone"
                  >
                    {i + 1}
                  </span>
                  <span className="text-[15px] leading-relaxed text-ink">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {primary && (
            <aside
              aria-labelledby="tool-book"
              className="card self-start p-6 md:p-7"
            >
              <h2 id="tool-book" className="h3">
                Have it checked
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-smoke">
                A tool can point you in a direction. A technician looking at
                the car can tell you what&apos;s going on.
              </p>
              <Link
                to={`/schedule?service=${primary.slug}`}
                className="btn-primary mt-5 w-full"
              >
                <CalendarCheck size={16} aria-hidden />
                Book {sentenceCase(primary.name)}
              </Link>
              {more.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {more.map((s) => (
                    <li key={s.slug}>
                      <Link
                        to={`/schedule?service=${s.slug}`}
                        className="btn-outline btn-sm min-h-[44px] w-full"
                      >
                        Book {sentenceCase(s.name)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-5 flex items-start gap-2 text-[13px] leading-relaxed text-smoke">
                <MapPin size={15} aria-hidden className="mt-0.5 shrink-0" />
                <span>
                  At {BUSINESS.parent} in {BUSINESS.shop.city}
                  {services.some((s) => s.mobile)
                    ? `, or by mobile van across ${SERVICE_AREA_LABEL} for mobile services.`
                    : "."}
                </span>
              </p>
              <a
                href={BUSINESS.phoneHref}
                className="mt-2 inline-flex min-h-[44px] items-center gap-2 font-display text-sm font-bold text-drop hover:text-dive"
              >
                <Phone size={15} aria-hidden />
                Call {BUSINESS.phone}
              </a>
            </aside>
          )}
        </div>
      </Section>

      <Section className="bg-bone">
        <SectionHead eyebrow="Questions" title="The things people ask next" />
        <Accordion items={page.faq} />

        <div className="max-w-[880px]">
          <RelatedLinks paths={page.related} resolve={getArticleByPath} />
        </div>

        <section aria-labelledby="more-tools" className="mt-14">
          <h2 id="more-tools" className="h3 mb-5">
            More free tools
          </h2>
          <ul className="flex flex-wrap gap-2.5">
            {others.map((t) => (
              <li key={t.id}>
                <Link to={t.path} className="btn-outline btn-sm">
                  {t.label}
                  <ArrowRight size={14} aria-hidden />
                </Link>
              </li>
            ))}
            <li>
              <Link to="/tire-check" className="btn-outline btn-sm">
                Do I need tires yet?
                <ArrowRight size={14} aria-hidden />
              </Link>
            </li>
          </ul>
        </section>
      </Section>
    </>
  );
}
