import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { shoppingLinksFor } from "../../data/relatedShopping.js";

/**
 * "Related shopping" at the end of a Learn guide or blog post: three or four
 * shop, brand, fitment or service pages picked for the article's topic
 * (src/data/relatedShopping.js). Plain text links with descriptive anchors.
 */
export default function RelatedShopping({ article }) {
  const links = shoppingLinksFor(article);
  if (!links.length) return null;
  return (
    <section
      aria-labelledby="related-shopping"
      data-related-shopping
      className="mt-12 rounded-2xl border border-ink/10 bg-fog p-5 md:p-6"
    >
      <h2
        id="related-shopping"
        className="h3 mb-4 scroll-mt-[calc(var(--header-h)+1rem)]"
      >
        Related shopping
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="inline-flex min-h-[44px] items-center gap-1.5 font-display text-[0.95rem] font-bold text-drop underline-offset-2 hover:text-dive hover:underline"
            >
              {l.text}
              <ArrowRight size={14} aria-hidden className="shrink-0" />
            </Link>
            <p className="mt-0.5 text-sm text-smoke">{l.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
