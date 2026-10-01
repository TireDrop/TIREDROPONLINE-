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
import NotFoundPage from "../NotFoundPage.jsx";

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
