import React, { lazy, Suspense } from "react";

import { useApiStatus } from "../../data/useApi.js";

// The pop-up's code and styles load only when it can actually be used.
const NewsletterPopup = lazy(() => import("./NewsletterPopup.jsx"));

/**
 * Renders the newsletter sign-up pop-up only when /api/status reports
 * `newsletter: "on"`, i.e. POST /api/newsletter can reach Shopify. Anything
 * else (off, no API on this host, status unreachable) renders nothing, so the
 * site never asks for an email it has nowhere to put.
 */
export default function NewsletterGate() {
  const status = useApiStatus();
  if (status?.newsletter !== "on") return null;
  return (
    <Suspense fallback={null}>
      <NewsletterPopup />
    </Suspense>
  );
}
