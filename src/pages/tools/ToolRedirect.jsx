import React from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";

import { TOOL_PAGE_ALIASES } from "../../components/demos/toolPages.js";
import NotFoundPage from "../NotFoundPage.jsx";

/**
 * /tools/<tool> is how the content plans link the free tools, which live at
 * the root. vercel.json 301s these on the server; this covers in-app links.
 *
 * A page of its own (lazy, src/App.jsx) so the tool pages' copy in
 * toolPages.js is only downloaded by someone following one of these links,
 * not by every visitor as part of the main bundle.
 */
const TOOL_PATHS = {
  "tire-size": "/tire-size",
  "tire-check": "/tire-check",
  "tread-gauge": "/tire-check",
  "find-my-tires": "/find-my-tires",
  "tire-size-finder": "/tire-size-finder",
  // load-speed-check, pressure-temp, damage-map... and the planned aliases.
  ...TOOL_PAGE_ALIASES,
};

export default function ToolRedirect() {
  const { tool } = useParams();
  const { search } = useLocation();
  const to = TOOL_PATHS[tool];
  return to ? <Navigate to={to + search} replace /> : <NotFoundPage />;
}
