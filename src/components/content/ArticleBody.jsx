import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DemoEmbed from "./DemoEmbed.jsx";

/**
 * When frontmatter names a `demo` the body never embeds, it goes in front of
 * the first `##` section: after the introduction, where the reader has just
 * been told what the demo is for.
 */
function withFrontmatterDemo(segments, demo) {
  if (!demo || segments.some((s) => s.type === "demo" && s.id === demo))
    return segments;
  const first = segments.findIndex((s) => s.type === "html");
  if (first === -1) return [...segments, { type: "demo", id: demo }];
  const { html } = segments[first];
  const at = html.indexOf("<h2");
  const parts =
    at > 0
      ? [
          { type: "html", html: html.slice(0, at) },
          { type: "demo", id: demo },
          { type: "html", html: html.slice(at) },
        ]
      : at === 0
        ? [{ type: "demo", id: demo }, segments[first]]
        : [segments[first], { type: "demo", id: demo }];
  return [...segments.slice(0, first), ...parts, ...segments.slice(first + 1)];
}

/**
 * The rendered Markdown, with demo embeds between the HTML runs.
 *
 * Links to other pages on the site are plain <a> tags in the HTML; a click on
 * one is routed through the router instead of reloading the page (and keeps
 * working under the preview build's hash routing).
 */
export default function ArticleBody({ segments, demo }) {
  const navigate = useNavigate();
  const parts = useMemo(
    () => withFrontmatterDemo(segments, demo),
    [segments, demo],
  );

  const onClick = (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    const anchor =
      event.target instanceof Element
        ? event.target.closest("a[data-internal]")
        : null;
    if (!anchor) return;
    event.preventDefault();
    navigate(anchor.getAttribute("href"));
  };

  return (
    // Not an interactive element: the handler only upgrades clicks on links
    // that already work (and take keyboard focus) without it.
    <div onClick={onClick}>
      {parts.map((part, i) =>
        part.type === "demo" ? (
          <DemoEmbed key={`demo-${i}`} id={part.id} />
        ) : (
          <div
            key={`html-${i}`}
            className="prose-article"
            dangerouslySetInnerHTML={{ __html: part.html }}
          />
        ),
      )}
    </div>
  );
}
