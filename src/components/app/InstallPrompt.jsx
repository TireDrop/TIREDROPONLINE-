import React, { useEffect, useState, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { Share, X } from "lucide-react";
import { onTrackedEvent, trackEvent } from "../../lib/analytics.js";
import { useStandalone } from "../../lib/appMode.js";
import { useHydrated } from "../../lib/useHydrated.js";
import UpdateToast, { useUpdateReady } from "../../pwa/UpdateToast.jsx";
import { getServerSnapshot, getSnapshot, setState, subscribe } from "../../pwa/state.js";

/**
 * Offers the app, once the visitor has shown interest, and never twice in a
 * row. Mounted once in App.jsx; takes no props. Also hosts the "update ready"
 * toast (src/pwa/UpdateToast.jsx), so only one of the two is ever at the top
 * of the screen.
 *
 * When
 *   - Not while installed or running as the app (useStandalone), and never
 *     during prerender or hydration (useHydrated), so the built HTML is
 *     unchanged.
 *   - After a second visit (a later browser session), or straight after a
 *     meaningful action: add to cart, a sent order request or form, a tool
 *     used, a size search, an order saved. Those are the analytics events
 *     below; analytics.js's onTrackedEvent tells us about them.
 *   - Not on /checkout, /cart or /schedule: never interrupt paying.
 *   - A few seconds after that moment, not instantly.
 *   - Dismissing it (X, or Not now) is remembered: 14 days the first time,
 *     90 days after that. Installing is remembered for good.
 *
 * What
 *   - Android and desktop Chromium: the browser's own install dialog, behind
 *     our "Install" button (the beforeinstallprompt event, caught early by
 *     src/pwa/register.js). No event, no banner: we never promise an install
 *     the browser will not do.
 *   - iPhone and iPad Safari have no install event, so a short Add to Home
 *     Screen hint names the steps.
 *
 * Where
 *   Top of the screen (a card on desktop), z-45: above the sticky header
 *   (z-40), below the menu sheet and the chat panel (z-50), so it can never
 *   sit on the chat button, the call bar, the compare tray or a product
 *   page's buy bar, which all live at the bottom edge.
 *
 * localStorage "tiredrop.pwa.v1" holds {visits, dismissedAt, dismissCount,
 * installed}: counts and dates only, always read and written in try/catch.
 */

const KEY = "tiredrop.pwa.v1";
const SESSION_KEY = "tiredrop.pwa.session";
const DAY = 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 4000;
const QUIET_PATHS = /^\/(checkout|cart|schedule)(\/|$)/;
// analytics.js events that mean "this visitor is doing something real".
const MEANINGFUL = new Set([
  "add_to_cart",
  "order_request",
  "generate_lead",
  "install_booking",
  "tool_use",
  "search",
  "view_search_results",
  "track_saved",
]);

const EMPTY = { visits: 0, dismissedAt: 0, dismissCount: 0, installed: false };

function readStore() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? { ...EMPTY, ...parsed } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

function writeStore(patch) {
  const next = { ...readStore(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* blocked or full: the banner just may come back sooner */
  }
  return next;
}

/** Counts this browser session once; returns the stored state. */
function countVisit() {
  const stored = readStore();
  try {
    if (window.sessionStorage.getItem(SESSION_KEY)) return stored;
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    return stored; // cannot tell sessions apart: do not count
  }
  return writeStore({ visits: (stored.visits || 0) + 1 });
}

/** iPhone or iPad, in Safari (other iOS browsers and in-app browsers differ). */
export function isIosSafari(nav = typeof navigator === "undefined" ? null : navigator) {
  if (!nav) return false;
  const ua = nav.userAgent || "";
  const ios = /iPad|iPhone|iPod/.test(ua) || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
  if (!ios) return false;
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram|Line\/|Snapchat/.test(ua);
}

function cooledDown(stored, now = Date.now()) {
  if (!stored.dismissedAt) return true;
  const wait = (stored.dismissCount > 1 ? 90 : 14) * DAY;
  return now - stored.dismissedAt > wait;
}

// Read once per page load, on the client: the visit count (which also counts
// this session) and the platform. null while prerendering and hydrating.
let client = null;
const noSubscribe = () => () => {};
const getClient = () => (client ??= { stored: countVisit(), ios: isIosSafari() });

export default function InstallPrompt() {
  const hydrated = useHydrated();
  const standalone = useStandalone();
  const { pathname } = useLocation();
  const { installEvent, installed } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const update = useUpdateReady();

  const seen = useSyncExternalStore(noSubscribe, getClient, () => null);
  const [changes, setChanges] = useState({});
  const [action, setAction] = useState(false);
  const [open, setOpen] = useState(false);
  const stored = { ...(seen ? seen.stored : EMPTY), ...changes };
  const ios = seen ? seen.ios : false;

  useEffect(
    () =>
      onTrackedEvent((name) => {
        if (MEANINGFUL.has(name)) setAction(true);
      }),
    [],
  );

  const placement = installEvent ? "banner" : ios ? "ios_hint" : null;
  const interested = stored.visits >= 2 || action;
  const eligible =
    hydrated &&
    seen !== null &&
    !standalone &&
    !installed &&
    !stored.installed &&
    placement !== null &&
    interested &&
    cooledDown(stored) &&
    !QUIET_PATHS.test(pathname);

  useEffect(() => {
    if (!eligible) return undefined;
    const timer = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => {
      clearTimeout(timer);
      setOpen(false);
    };
  }, [eligible]);

  const shown = eligible && open;
  useEffect(() => {
    if (shown) trackEvent("app_install_prompt_shown", { placement });
  }, [shown, placement]);

  if (!hydrated || standalone) return null;
  if (update.ready) return <UpdateToast onLater={update.later} />;
  if (!shown) return null;

  const dismiss = () => {
    setChanges(writeStore({ dismissedAt: Date.now(), dismissCount: (stored.dismissCount || 0) + 1 }));
    setOpen(false);
  };

  const install = async () => {
    const event = installEvent;
    if (!event) return;
    setState({ installEvent: null }); // a prompt event works once
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice && choice.outcome === "accepted") {
        setChanges(writeStore({ installed: true }));
        setOpen(false);
        return;
      }
    } catch {
      /* the browser refused to show it */
    }
    dismiss();
  };

  const isIos = placement === "ios_hint";

  return (
    <section
      aria-label="Install the TireDrop app"
      data-pwa="install-prompt"
      data-placement={placement}
      className="fixed inset-x-2 top-[calc(0.5rem+env(safe-area-inset-top))] z-[45] flex items-center gap-3 rounded-card border border-graphite bg-steel p-3 text-bone shadow-lift sm:left-auto sm:right-4 sm:top-4 sm:w-[24rem]"
    >
      <img
        src="/brand/icon-192.png"
        alt=""
        width="44"
        height="44"
        className="h-11 w-11 shrink-0 rounded-[10px]"
      />
      <div className="min-w-0 flex-1">
        <p className="font-display text-[15px] font-bold leading-tight">
          {isIos ? "Add TireDrop to your Home Screen" : "Get the TireDrop app"}
        </p>
        <p className="mt-0.5 text-[13px] leading-snug text-bone/75">
          {isIos ? (
            <>
              Tap <Share size={14} aria-hidden className="mx-0.5 inline -translate-y-px" />
              <span className="sr-only">Share</span> in Safari, then Add to Home Screen.
            </>
          ) : (
            "Shop, find your size and check orders from your home screen."
          )}
        </p>
      </div>
      {isIos ? (
        <button
          type="button"
          onClick={dismiss}
          className="btn-ghost-light !min-h-[44px] !px-4 !py-2 text-[14px]"
        >
          Got it
        </button>
      ) : (
        <button
          type="button"
          onClick={install}
          className="btn-primary !min-h-[44px] !px-4 !py-2 text-[14px]"
        >
          Install
        </button>
      )}
      {!isIos && (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Not now"
          className="-mr-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-bone/70 hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-volt"
        >
          <X size={20} aria-hidden />
        </button>
      )}
    </section>
  );
}
