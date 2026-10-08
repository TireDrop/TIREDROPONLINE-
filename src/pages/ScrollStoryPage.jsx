// Scroll story concept (private preview): a pinned scroll story with a tire
// and rim, choreographed by anime.js (src/lib/scrollStory/init.js). Hidden from
// search: noindex, out of the sitemap, no site chrome. Plain anchors (not
// router links) leave the page so its global styles are dropped on navigation.

import React, { useEffect, useRef } from "react";

import { Seo } from "../components/ui/index.jsx";
import markup from "../lib/scrollStory/markup.js";
import { initStory } from "../lib/scrollStory/init.js";
import "../lib/scrollStory/story.css";

const FONTS =
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap";

export default function ScrollStoryPage() {
  const root = useRef(null);

  useEffect(() => {
    let destroy = () => {};
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONTS;
    document.head.appendChild(link);
    try {
      destroy = initStory() || destroy;
    } catch (error) {
      // The static markup still reads fine without the motion.
      console.error("scroll story failed to start", error);
    }
    return () => {
      destroy();
      link.remove();
    };
  }, []);

  return (
    <>
      <Seo
        title="Scroll Story Concept"
        description="Private concept preview of a scroll-driven TireDrop page."
        noindex
      />
      <div ref={root} dangerouslySetInnerHTML={{ __html: markup }} />
    </>
  );
}
