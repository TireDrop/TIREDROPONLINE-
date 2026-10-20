import React, { useState, useSyncExternalStore } from "react";
import { RefreshCw } from "lucide-react";
import { applyUpdate } from "./register.js";
import { getServerSnapshot, getSnapshot, subscribe } from "./state.js";

/**
 * "A new version is ready." Shown when a new service worker has installed and
 * is waiting (src/pwa/register.js). The visitor decides: Update activates it
 * and reloads once; Later hides the toast until the next page load. Nothing
 * reloads the page by itself, so a half-filled form is never lost to a deploy.
 *
 * Exported as a hook plus a view so InstallPrompt.jsx (mounted once in
 * App.jsx) can show one or the other and never both at the top of the screen.
 */
export function useUpdateReady() {
  const { updateReady } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [later, setLater] = useState(false);
  return { ready: updateReady && !later, later: () => setLater(true) };
}

export default function UpdateToast({ onLater }) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-pwa="update-toast"
      className="fixed inset-x-2 top-[calc(0.5rem+env(safe-area-inset-top))] z-[45] flex items-center gap-3 rounded-card border border-graphite bg-steel p-3 text-bone shadow-lift sm:left-auto sm:right-4 sm:top-4 sm:w-[24rem]"
    >
      <RefreshCw size={20} aria-hidden className="shrink-0 text-volt" />
      <p className="min-w-0 flex-1 text-[14px] font-semibold leading-snug">
        A new version of TireDrop is ready.
      </p>
      <button
        type="button"
        onClick={onLater}
        className="inline-flex min-h-[44px] items-center rounded-sm px-3 text-[14px] font-semibold text-bone/80 hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-volt"
      >
        Later
      </button>
      <button
        type="button"
        onClick={applyUpdate}
        className="btn-primary !min-h-[44px] !px-4 !py-2 text-[14px]"
      >
        Update
      </button>
    </div>
  );
}
