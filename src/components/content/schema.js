/**
 * JSON-LD nodes for the Learn and Blog pages, handed to <Seo schema={...}>.
 *
 * Article and FAQPage (the BreadcrumbList comes from Seo's `crumbs`). Never
 * AggregateRating or Review:
 * this site publishes no ratings of its own, and marking up ratings nobody
 * left breaches Google's structured-data policy (see the note in Seo).
 */
import { BUSINESS } from "../../data/business.js";

export const ORIGIN = `https://${BUSINESS.domain}`;
const OG_IMAGE = `${ORIGIN}/brand/og-tiredrop.jpg`;

const urlFor = (path) => `${ORIGIN}${path === "/" ? "/" : path}`;

export function articleSchema(article) {
  const url = urlFor(article.path);
  const node = {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: article.title,
    description: article.description,
    url,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    datePublished: article.date,
    dateModified: article.updated || article.date,
    inLanguage: "en-US",
    image: OG_IMAGE,
    author: {
      "@type": "Organization",
      name: BUSINESS.name,
      url: ORIGIN,
    },
    publisher: { "@id": `${ORIGIN}/#organization` },
    isPartOf: { "@id": `${ORIGIN}/#website` },
  };
  const keywords = [
    article.keyword,
    ...(article.secondaryKeywords ?? []),
  ].filter(Boolean);
  if (keywords.length) node.keywords = keywords.join(", ");
  if (article.category) node.articleSection = article.category.label;
  return node;
}

export function faqSchema(faq, path) {
  if (!faq?.length) return null;
  return {
    "@type": "FAQPage",
    "@id": `${urlFor(path)}#faq`,
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
