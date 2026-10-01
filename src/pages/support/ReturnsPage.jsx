// Returns, Warranty & Road Hazard (/returns).
//
// The copy lives in src/data/returnsPolicy.js, written only from what the
// terms and the shipping page already say. Unconfirmed details show as
// {TODO_JUSTIN: ...} chips. Until RETURNS_PAGE_LIVE is flipped
// (src/data/returnsFlag.js) the page is a draft: noindex, out of the sitemap,
// and in production builds not rendered at all (the 404 page instead).

import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ChevronRight,
  Mail,
  Phone,
  RotateCcw,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { BUSINESS } from "../../data/business.js";
import { RETURNS_PAGE_SHOWN } from "../../data/returnsFlag.js";
import {
  FAQ,
  RETURNS_PAGE_LIVE,
  RETURNS_PATH,
  SECTIONS,
  SUMMARY,
  TODO_PATTERN,
} from "../../data/returnsPolicy.js";
import { faqSchema } from "../../components/content/schema.js";
import {
  Breadcrumbs,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";
import NotFoundPage from "../NotFoundPage.jsx";

const SUMMARY_ICONS = {
  returns: RotateCcw,
  mounted: Wrench,
  warranty: ShieldCheck,
  "road-hazard": AlertTriangle,
};

/**
 * A string with any {TODO_JUSTIN: ...} markers wrapped in a highlighted chip,
 * so an unanswered policy question cannot be read past. The marker text is
 * kept verbatim: the build looks for it (scripts/prerender.mjs).
 */
function WithTodos({ text }) {
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(TODO_PATTERN)) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <mark
        key={m.index}
        className="rounded-sm bg-amber/30 px-1 py-0.5 font-mono text-[13px] text-ink ring-1 ring-inset ring-amberInk/40"
      >
        {m[0]}
      </mark>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.map((p, i) => <Fragment key={i}>{p}</Fragment>);
}

export default function ReturnsPage() {
  if (!RETURNS_PAGE_SHOWN) return <NotFoundPage />;

  return (
    <>
      <Seo
        title="Returns, Warranty & Road Hazard"
        description={`How to start a return with ${BUSINESS.name}, why mounted tires usually can't go back, how manufacturer mileage warranties work, and who to call about road hazard protection.`}
        noindex={!RETURNS_PAGE_LIVE}
        schema={[faqSchema(FAQ, RETURNS_PATH)]}
      />

      <PageHero
        eyebrow="Orders & support"
        title="Returns, warranty & road hazard"
        lede="What can go back, what the tire maker's warranty covers, and who to call. If anything here doesn't match your order, call us and a person will explain it."
      />

      <Breadcrumbs trail={[{ label: "Returns & Warranty" }]} />

      <Section className="bg-bone">
        {!RETURNS_PAGE_LIVE && (
          <div
            role="note"
            className="mb-10 rounded-sm border-2 border-dashed border-amberInk/60 bg-amber/10 p-5 text-sm leading-relaxed text-ink"
          >
            <p className="font-display text-base font-bold">
              Draft for review, not published
            </p>
            <p className="mt-1">
              Highlighted <span className="font-mono">TODO_JUSTIN</span> items
              are policy details nobody has confirmed yet. This page is left
              out of the sitemap and the live site until each one is answered.
            </p>
          </div>
        )}

        {/* ---------- The four answers people come for ---------- */}
        <nav aria-label="Returns and warranty summary" className="mb-12">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SUMMARY.map(({ id, title, copy }) => {
              const Icon = SUMMARY_ICONS[id];
              return (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="card flex h-full flex-col gap-2 p-5 transition-colors hover:border-drop"
                  >
                    {Icon && <Icon size={20} aria-hidden className="text-drop" />}
                    <span className="font-display text-base font-bold text-ink">
                      {title}
                    </span>
                    <span className="text-[13px] leading-relaxed text-smoke">
                      {copy}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-14">
          {/* ---------- Contents + contact ---------- */}
          <nav
            aria-label="On this page"
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <h2 className="mb-3 font-display text-sm font-bold text-smoke">
              On this page
            </h2>
            <ul className="space-y-2">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex min-h-[32px] items-center text-sm text-smoke transition-colors hover:text-drop"
                  >
                    {s.heading}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="#faq"
                  className="flex min-h-[32px] items-center text-sm text-smoke transition-colors hover:text-drop"
                >
                  Questions
                </a>
              </li>
            </ul>

            <div className="card mt-6 p-5">
              <p className="text-xs leading-relaxed text-smoke">
                Have your order number ready. A person answers during business
                hours.
              </p>
              <a href={BUSINESS.phoneHref} className="btn-outline btn-sm mt-4">
                <Phone size={15} aria-hidden />
                {BUSINESS.phone}
              </a>
              <a
                href={`mailto:${BUSINESS.email}`}
                className="mt-3 flex items-center gap-2 break-all text-sm text-ink underline underline-offset-4 hover:text-drop"
              >
                <Mail size={15} aria-hidden className="shrink-0" />
                {BUSINESS.email}
              </a>
            </div>
          </nav>

          {/* ---------- Body ---------- */}
          <article className="max-w-[68ch] space-y-12">
            {SECTIONS.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24"
              >
                <h2 className="h3 mb-4">{section.heading}</h2>

                {section.paragraphs?.map((p) => (
                  <p
                    key={p}
                    className="mb-4 text-[15px] leading-[1.75] text-smoke"
                  >
                    <WithTodos text={p} />
                  </p>
                ))}

                {section.list && (
                  <ul className="mb-4 space-y-3">
                    {section.list.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-[15px] leading-[1.75] text-smoke"
                      >
                        <span
                          aria-hidden
                          className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-drop"
                        />
                        <span>
                          <WithTodos text={item} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.after?.map((p) => (
                  <p
                    key={p}
                    className="mb-4 text-[15px] leading-[1.75] text-smoke"
                  >
                    <WithTodos text={p} />
                  </p>
                ))}

                {section.id === "road-hazard" && (
                  <p className="text-[15px] leading-[1.75] text-smoke">
                    Not sure a damaged tire can be fixed? Our{" "}
                    <Link
                      to="/can-my-tire-be-repaired"
                      className="text-drop underline"
                    >
                      repair checker
                    </Link>{" "}
                    shows which spots a shop can usually patch.
                  </p>
                )}
              </section>
            ))}

            <p className="border-t border-ink/10 pt-6 text-sm leading-relaxed text-smoke">
              The full wording is in our{" "}
              <Link to="/terms#returns" className="text-drop underline">
                terms
              </Link>{" "}
              (sections 9 to 11). Shipping and delivery are covered on{" "}
              <Link to="/shipping" className="text-drop underline">
                how shipping works
              </Link>
              .
            </p>
          </article>
        </div>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section id="faq" className="scroll-mt-16 bg-fog">
        <SectionHead
          eyebrow="Questions, answered"
          title="Returns & warranty FAQ"
          lede="If yours isn't here, call and ask. We would rather answer it before you order than after."
        />
        {/* The site's Accordion, inlined so answers can carry TODO chips. */}
        <div className="max-w-3xl">
          <div className="divide-y divide-ink/10 border-y border-ink/10">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[1.0625rem] font-bold leading-snug tracking-[-0.012em] text-ink transition-colors hover:text-drop md:text-[1.15rem]">
                  {item.q}
                  <ChevronRight
                    size={18}
                    aria-hidden
                    className="shrink-0 text-drop transition-transform group-open:rotate-90"
                  />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-smoke">
                  <WithTodos text={item.a} />
                </p>
              </details>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
