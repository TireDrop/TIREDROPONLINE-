import React from "react";
import { Link, useParams } from "react-router-dom";
import { BookOpen, Phone } from "lucide-react";
import { BUSINESS } from "../../data/business.js";
import {
  Breadcrumbs,
  EmptyState,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";
import {
  ArticleCard,
  ContentCta,
  plural,
} from "../../components/content/parts.jsx";
import {
  contentRoutes,
  getHub,
  getLearnArticles,
  getLearnHubs,
} from "../../content/index.js";
import RelatedShopping from "../../components/content/RelatedShopping.jsx";
import NotFoundPage from "../NotFoundPage.jsx";

const LINK_CLASS =
  "font-semibold text-drop underline underline-offset-2 hover:text-dive";

/** A paragraph of hub copy; `[text](/path)` becomes an in-site link. */
function Para({ text }) {
  const parts = [];
  const re = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <Link key={m.index} to={m[2]} className={LINK_CLASS}>
        {m[1]}
      </Link>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <p>{parts}</p>;
}

/** /learn/:hub — one topic's guides. */
export default function LearnHubPage() {
  const { hub: slug } = useParams();
  const hub = getHub(slug);

  if (!hub) return <NotFoundPage />;

  const articles = getLearnArticles({ hub: hub.slug });
  const others = getLearnHubs().filter(
    (h) => h.slug !== hub.slug && h.count > 0,
  );
  // A topic with no published guide is an empty page: keep it out of the
  // index until it has one (it is also left out of the sitemap).
  const published = contentRoutes().includes(hub.path);

  const hasBody = hub.sections.length > 0 && articles.length > 0;

  return (
    <>
      <Seo
        title={`${hub.title} Guides`}
        description={hub.description}
        crumbs={[{ name: "Learn", path: "/learn" }]}
        noindex={!published}
      />

      <PageHero eyebrow="Learn" title={hub.title} lede={hub.description}>
        <p className="text-sm text-bone/65">
          {articles.length > 0
            ? plural(articles.length, "guide")
            : "Guides coming soon"}
        </p>
      </PageHero>

      <Breadcrumbs
        trail={[{ label: "Learn", to: "/learn" }, { label: hub.title }]}
      />

      <Section className="bg-bone">
        {(hub.intro || hub.links.length > 0) && (
          <div className="mb-8 max-w-[72ch] space-y-3 text-[15px] leading-relaxed text-ink/85">
            {hub.intro && <p>{hub.intro}</p>}
            {hub.links.map((l) => (
              <p key={l.href}>
                {l.text && <>{l.text} </>}
                <Link
                  to={l.href}
                  className="font-semibold text-drop underline underline-offset-2 hover:text-dive"
                >
                  {l.label}
                </Link>
              </p>
            ))}
          </div>
        )}
        {articles.length > 0 ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard
                key={article.path}
                article={article}
                showSection={false}
                headingAs="h2"
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            as="h2"
            icon={BookOpen}
            title="These guides are being written"
            lede={`Need the answer today? Call the shop at ${BUSINESS.phone} and we will talk it through.`}
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/learn" className="btn-primary">
                  All guides
                </Link>
                <a href={BUSINESS.phoneHref} className="btn-outline">
                  <Phone size={16} aria-hidden />
                  {BUSINESS.phone}
                </a>
              </div>
            }
          />
        )}
        {hasBody && (
          <div className="mt-12 max-w-[72ch] space-y-10 text-[15px] leading-relaxed text-ink/85">
            {articles.some((a) => hub.guideNotes[a.slug]) && (
              <section aria-labelledby="hub-covers">
                <h2 id="hub-covers" className="h3 mb-3">
                  What each guide covers
                </h2>
                <ul className="space-y-3">
                  {articles
                    .filter((a) => hub.guideNotes[a.slug])
                    .map((a) => (
                      <li key={a.path}>
                        <Link to={a.path} className={LINK_CLASS}>
                          {a.title}
                        </Link>
                        <span className="block">{hub.guideNotes[a.slug]}</span>
                      </li>
                    ))}
                </ul>
              </section>
            )}
            {hub.sections.map((sec, i) => (
              <section key={sec.heading} aria-labelledby={`hub-sec-${i}`}>
                <h2 id={`hub-sec-${i}`} className="h3 mb-3">
                  {sec.heading}
                </h2>
                <div className="space-y-3">
                  {sec.paras.map((t) => (
                    <Para key={t.slice(0, 24)} text={t} />
                  ))}
                </div>
              </section>
            ))}
            {hub.audience && (
              <section aria-labelledby="hub-who">
                <h2 id="hub-who" className="h3 mb-3">
                  Who this is for
                </h2>
                <p>{hub.audience}</p>
              </section>
            )}
            {hub.facts.length > 0 && (
              <section aria-labelledby="hub-facts">
                <h2 id="hub-facts" className="h3 mb-3">
                  Quick facts
                </h2>
                <ul className="list-disc space-y-2 pl-5">
                  {hub.facts.map((f) => (
                    <li key={f.slice(0, 24)}>{f}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
        {hasBody && articles.length > 0 && (
          <RelatedShopping
            article={{ path: hub.path, hub: hub.slug, section: "learn" }}
          />
        )}
        {hub.note && (
          <p className="mt-8 text-sm text-smoke">{hub.note}</p>
        )}
      </Section>

      {others.length > 0 && (
        <Section className="bg-fog">
          <SectionHead eyebrow="Keep reading" title="Other topics" />
          <ul className="flex flex-wrap gap-2.5">
            {others.map((h) => (
              <li key={h.slug}>
                <Link
                  to={h.path}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-sm border border-ink/15 bg-bone px-4 py-2 font-display text-sm font-bold text-ink transition-colors hover:border-drop hover:text-drop"
                >
                  {h.title}
                  <span className="text-[12px] font-semibold text-smoke">
                    {h.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section className={others.length > 0 ? "bg-bone" : "bg-fog"}>
        <ContentCta className="" />
      </Section>
    </>
  );
}
