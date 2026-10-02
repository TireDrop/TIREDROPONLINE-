/**
 * One chunk per article: the frontmatter src/content/index.js leaves out
 * (faq, sources, takeaways, related, cta, keywords) and the body, rendered
 * to HTML at build time (`rendered: { segments, toc, demos }`). Each comes
 * from "<file>.md?article", which the tiredrop-content plugin in
 * vite.config.js builds in Node, so an article page downloads its own text
 * and nobody else's, and no Markdown parser reaches the browser.
 *
 * A new .md file is picked up by the globs below with no list to maintain.
 */
import { createElement } from "react";
import { lazyPage } from "../lib/lazyPage.js";
import { SHOW_DRAFTS } from "./index.js";

// Vite needs the glob options written out as literals, so they repeat.
const PUBLISHED = import.meta.glob(
  ["./learn/*/*.md", "./blog/*.md", "!./learn/*/_*.md", "!./blog/_*.md"],
  { query: "?article", import: "default" },
);

// Only referenced when drafts show, so a production build has no chunk for
// these at all.
const SAMPLES = SHOW_DRAFTS
  ? import.meta.glob(["./learn/*/_*.md", "./blog/_*.md"], {
      query: "?article",
      import: "default",
    })
  : {};

// Through lazyPage rather than a bare import(): the prerenderer then
// modulepreloads the article's chunk and lists it in data-pages, and
// src/main.jsx loads it before hydrating, so the server HTML is kept.
const DETAILS = new Map(
  Object.entries({ ...PUBLISHED, ...SAMPLES }).map(([file, load]) => [
    file,
    lazyPage(`content/${file.slice(2)}?article`, () =>
      load().then((detail) => ({
        default: ({ children }) => children(detail),
      })),
    ),
  ]),
);

/**
 * `<ArticleDetail article={summary}>{(detail) => ...}</ArticleDetail>`:
 * renders the children with that article's detail, or with null when the
 * build has none for it (the page then shows its not-found state).
 */
export function ArticleDetail({ article, children }) {
  const Detail = DETAILS.get(article.file);
  return Detail ? createElement(Detail, null, children) : children(null);
}
