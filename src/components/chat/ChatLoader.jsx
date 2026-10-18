import React, { Suspense, lazy, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { useApiStatus } from "../../data/useApi.js";
import { isChatHidden } from "./chatClient.js";

/**
 * Loads the chat widget (ChatWidget.jsx and its panel code) out of the entry
 * bundle. Mounted once in App.jsx where ChatWidget used to be.
 *
 * - Nothing is downloaded until /api/status says chat is on, the page is one
 *   where the button shows (isChatHidden), and the browser is idle or the
 *   visitor first touches the page (pointer, key, scroll, touch), whichever
 *   comes first. ChatWidget keeps its own status and path checks, so the
 *   button still shows only when chat is on.
 * - Renders nothing on the server and on the first client pass, the same as
 *   the widget did (it returned null until the status arrived), so hydration
 *   of the prerendered HTML is unchanged.
 * - The button appears once the chunk has loaded; the Suspense fallback is
 *   empty, so there is nothing to move or announce while it loads.
 */
const ChatWidget = lazy(() => import("./ChatWidget.jsx"));

const WAKE_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart"];

export default function ChatLoader() {
  const { pathname } = useLocation();
  const status = useApiStatus();
  const [awake, setAwake] = useState(false);

  useEffect(() => {
    if (awake) return undefined;
    const wake = () => setAwake(true);
    const idle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(wake, { timeout: 4000 })
        : window.setTimeout(wake, 2500);
    WAKE_EVENTS.forEach((name) =>
      window.addEventListener(name, wake, { once: true, passive: true }),
    );
    return () => {
      if (typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idle);
      } else {
        window.clearTimeout(idle);
      }
      WAKE_EVENTS.forEach((name) => window.removeEventListener(name, wake));
    };
  }, [awake]);

  if (!awake || status?.chat !== "on" || isChatHidden(pathname)) return null;
  return (
    <Suspense fallback={null}>
      <ChatWidget />
    </Suspense>
  );
}
