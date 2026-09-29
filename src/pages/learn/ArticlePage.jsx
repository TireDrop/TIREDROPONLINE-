import React from "react";
import { Link, useParams } from "react-router-dom";
import { Accordion, Breadcrumbs, Seo } from "../../components/ui/index.jsx";
import ArticleBody from "../../components/content/ArticleBody.jsx";
import {
  ArticleMeta,
  ContentCta,
  DraftBadge,
  KeyTakeaways,
  RelatedLinks,
  SourcesList,
  TableOfContents,
  sectionLabel,
} from "../../components/content/parts.jsx";
import { articleSchema, faqSchema } from "../../components/content/schema.js";
import {
  getArticle,
  getArticleByPath,
  getBlogPosts,
  getHub,
  getLearnArticles,
  renderArticle,
} from "../../content/index.js";
import NotFoundPage from "../NotFoundPage.jsx";

/** Up to four others from the same hub (or category), for "Related reading". */
function siblings(article) {
  const pool =
    article.section === "learn"
      ? getLearnArticles({ hub: article.hub })
      : getBlogPosts({ category: article.category?.slug });
  return pool.filter((a) => a.path !== article.path).slice(0, 4);
}

/**
 * One Learn guide (/learn/:hub/:slug) or blog post (/blog/:slug).
 *
 * Order, top to bottom: breadcrumbs, H1, lede, meta line, table of contents,
 * body (with demo embeds), key takeaways, FAQ, sources, related reading, CTA.
 */
export default function ArticlePage({ section }) {
  const { hub: hubSlug, slug } = useParams();
  const article = getArticle(
    section,
    section === "learn" ? hubSlug : null,
    slug,
  );

  if (!article) return <NotFoundPage />;

  const rendered = renderArticle(article);

  // Visible breadcrumbs, and the BreadcrumbList pages between Home and this
  // one (Seo adds both ends).
  const parents =
    article.section === "learn"
      ? [
          { label: "Learn", to: "/learn" },
          {
            label: getHub(article.hub)?.title ?? "Guides",
            to: `/learn/${article.hub}`,
          },
        ]
      : [{ label: "Blog", to: "/blog" }];
  const trail = [...parents, { label: article.title }];
  const crumbs = parents.map((c) => ({ name: c.label, path: c.to }));
  const schema = [
    articleSchema(article),
    faqSchema(article.faq, article.path),
  ].filter(Boolean);

  const extraToc = [
    article.faq.length ? { id: "faq", text: "Questions people ask" } : null,
    article.sources.length ? { id: "sources", text: "Sources" } : null,
  ].filter(Boolean);

  const labelTo =
    article.section === "learn"
      ? `/learn/${article.hub}`
      : article.category
        ? `/blog?category=${article.category.slug}`
        : "/blog";

  return (
    <>
      <Seo
        title={article.title}
        description={article.description}
        type="article"
        crumbs={crumbs}
        schema={schema}
        noindex={!article.public}
      />

      <Breadcrumbs trail={trail} />

      <article>
        <header className="relative overflow-hidden bg-ink bg-ink-wash text-bone">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-volt/35 to-transparent"
          />
          <div className="wrap relative py-12 md:py-16">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Link
                to={labelTo}
                className="eyebrow flex min-h-[32px] items-center gap-2.5 text-volt hover:text-bone"
              >
                <span aria-hidden className="h-px w-6 bg-volt/55" />
                {sectionLabel(article)}
              </Link>
              <DraftBadge article={article} />
            </div>
            <h1 className="max-w-4xl text-balance font-display text-[2.1rem] leading-[1.02] md:text-[3.25rem]">
              {article.title}
            </h1>
            <p className="lede mt-5 max-w-2xl text-bone/75 md:text-[1.2rem]">
              {article.description}
            </p>
            <ArticleMeta article={article} className="mt-6 text-bone/65" />
          </div>
        </header>

        <div className="bg-bone">
          <div className="wrap grid gap-10 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-14">
            <div className="min-w-0 max-w-[72ch]">
              <TableOfContents toc={rendered.toc} extra={extraToc} />

              <ArticleBody segments={rendered.segments} demo={article.demo} />

              <KeyTakeaways items={article.takeaways} />

              {article.faq.length > 0 && (
                <section aria-labelledby="faq" className="mt-12">
                  <h2 id="faq" className="h3 mb-4 scroll-mt-28">
                    Questions people ask
                  </h2>
                  <Accordion items={article.faq} />
                </section>
              )}

              <SourcesList sources={article.sources} />

              <RelatedLinks
                paths={article.related}
                resolve={getArticleByPath}
                fallback={siblings(article)}
              />

              <ContentCta cta={article.cta} />
            </div>

            <aside className="hidden lg:block">
              <TableOfContents
                toc={rendered.toc}
                extra={extraToc}
                variant="aside"
              />
            </aside>
          </div>
        </div>
      </article>
    </>
  );
}
