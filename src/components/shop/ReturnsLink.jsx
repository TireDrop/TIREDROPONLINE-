import React from "react";
import { Link } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { RETURNS_PAGE_SHOWN, RETURNS_PATH } from "../../data/returnsFlag.js";

/**
 * One small link to the Returns, Warranty & Road Hazard page, for the product
 * page, cart, checkout review and shipping FAQ. Renders nothing while that
 * page is held back (production builds before RETURNS_PAGE_LIVE; see
 * src/data/returnsFlag.js), so dropping it into a page changes nothing live.
 */
export default function ReturnsLink({
  className = "",
  children = "Returns, warranty & road hazard",
}) {
  if (!RETURNS_PAGE_SHOWN) return null;
  return (
    <Link
      to={RETURNS_PATH}
      className={`inline-flex items-center gap-1.5 text-xs text-smoke underline underline-offset-4 transition-colors hover:text-drop ${className}`}
    >
      <RotateCcw size={14} aria-hidden className="shrink-0 text-drop" />
      {children}
    </Link>
  );
}
