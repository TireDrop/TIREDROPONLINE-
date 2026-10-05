import React from "react";
import { Link } from "react-router-dom";
import { Languages } from "lucide-react";

import { twinPath } from "../../data/spanishRoutes.js";

/**
 * "Español" on an English page that has a Spanish twin (the mobile hub and
 * Hialeah). Renders nothing for every other page, and nothing at all while
 * SPANISH_PAGES_INDEXABLE is false (twinPath is then null on English pages),
 * so the English pages are unchanged until a native speaker approves the
 * Spanish copy. For use on the dark page hero.
 */
export default function TwinLink({ path }) {
  const to = twinPath(path);
  if (!to) return null;
  return (
    <Link
      to={to}
      lang="es"
      hrefLang="es-US"
      className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-bone underline underline-offset-4 hover:text-volt"
    >
      <Languages size={16} aria-hidden />
      Español
    </Link>
  );
}
