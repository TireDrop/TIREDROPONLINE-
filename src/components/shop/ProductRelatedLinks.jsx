import React from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { Section } from "../ui/index.jsx";
import { productRelatedLinks } from "../../data/relatedShopping.js";

/**
 * A short "learn more" block for a product page: Learn guides that explain
 * this kind of tire or wheel, plus /brands for tires and /wheel-fitment for
 * wheels. Links come from src/data/relatedShopping.js.
 */
export default function ProductRelatedLinks({ product }) {
  const { heading, links } = productRelatedLinks(product);
  return (
    <Section className="bg-fog">
      <div data-product-related-links>
        <h2 className="h3 flex items-center gap-2">
          <BookOpen size={20} aria-hidden className="text-drop" />
          {heading}
        </h2>
        <ul className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
          {links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className="inline-flex min-h-[44px] items-center font-semibold text-drop underline-offset-2 hover:text-dive hover:underline"
              >
                {l.text}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
