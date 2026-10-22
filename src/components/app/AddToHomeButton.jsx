import React, { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { ArrowDown, Check, Copy, MoreVertical, PlusSquare, Share, X } from "lucide-react";

import { trackEvent } from "../../lib/analytics.js";
import { deviceKind, installSteps } from "../../lib/installHelp.js";
import { isStandalone } from "../../lib/appMode.js";
import { trapTab } from "../../lib/trapFocus.js";
import { getServerSnapshot, getSnapshot, setState, subscribe } from "../../pwa/state.js";

/**
 * One big "Add to Home Screen" button.
 *
 * - Android, and Chrome or Edge on a computer: the browser hands the page an
 *   install event (src/pwa/register.js keeps it in src/pwa/state.js), so the
 *   tap opens the phone's own install dialog.
 * - iPhone and iPad: no website can open Apple's "Add to Home Screen" sheet,
 *   so the tap opens a short guide that points at Safari's Share button and
 *   offers to open the share menu itself (navigator.share, which is the one
 *   thing a page may open), where "Add to Home Screen" is listed.
 * - Android or desktop without an install event yet, and other browsers: the
 *   same guide, with that browser's own steps.
 * - Inside another app's browser (Instagram, Facebook...): a page cannot be
 *   added from there, so the guide says to open it in the real browser and
 *   can copy the link.
 *
 * Hidden once the app is installed or already running as the app.
 */

const UNKNOWN = Object.freeze({ kind: null, standalone: false, canShare: false });
let clientInfo = null;
const noSubscribe = () => () => {};
const getClient = () => {
  if (!clientInfo) {
    clientInfo = {
      kind: deviceKind(),
      standalone: isStandalone(),
      canShare: typeof navigator.share === "function",
    };
  }
  return clientInfo;
};

const ICONS = { share: Share, menu: MoreVertical, add: PlusSquare };

export default function AddToHomeButton({ className = "btn-primary min-h-[48px]", label = "Add to Home Screen", placement = "app_page" }) {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { kind, standalone, canShare } = useSyncExternalStore(noSubscribe, getClient, () => UNKNOWN);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector("button")?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (store.installed || standalone) return null;

  const close = () => {
    setOpen(false);
    setCopied(false);
    buttonRef.current?.focus();
  };

  const onTap = async () => {
    const event = store.installEvent;
    if (event) {
      setState({ installEvent: null }); // a prompt event works once
      trackEvent("app_install_prompt_shown", { placement });
      try {
        await event.prompt();
        await event.userChoice;
      } catch {
        /* the browser refused to show it */
      }
      return;
    }
    trackEvent("app_install_prompt_shown", { placement: `${placement}_guide` });
    setOpen(true);
  };

  const openShare = async () => {
    try {
      await navigator.share({ title: "TireDrop", url: window.location.origin });
    } catch {
      /* closed without choosing, which is fine */
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
    } catch {
      /* the visitor can still copy it from the address bar */
    }
  };

  const guide = installSteps(kind ?? { platform: "desktop", browser: "other" });
  const inApp = kind?.browser === "inapp";
  const isIosSafariGuide = kind?.platform === "ios" && !inApp;

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      return;
    }
    trapTab(event, panelRef.current);
  };

  return (
    <>
      <button ref={buttonRef} type="button" onClick={onTap} className={className} data-testid="add-to-home">
        <PlusSquare size={19} aria-hidden />
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/70 p-0 sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={onKeyDown}
            data-testid="add-to-home-guide"
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-card bg-bone p-6 pb-8 shadow-lift sm:max-w-md sm:rounded-card"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id={titleId} className="h3 text-balance text-ink">
                {guide.title}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="-mr-2 -mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-fog"
              >
                <X size={22} aria-hidden />
              </button>
            </div>

            <ol className="mt-4 space-y-4">
              {guide.steps.map((step, i) => {
                const Icon = ICONS[step.icon];
                return (
                  <li key={step.text} className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky text-drop"
                    >
                      {Icon ? <Icon size={18} /> : <Check size={18} />}
                    </span>
                    <span className="text-[15px] leading-relaxed text-ink">
                      <span className="mr-1 font-display font-bold text-drop">{i + 1}.</span>
                      {step.text}
                    </span>
                  </li>
                );
              })}
            </ol>

            <div className="mt-6 flex flex-col gap-3">
              {isIosSafariGuide && canShare && (
                <button type="button" onClick={openShare} className="btn-primary min-h-[48px]">
                  <Share size={18} aria-hidden />
                  Open the Share menu
                </button>
              )}
              {inApp && (
                <button type="button" onClick={copyLink} className="btn-primary min-h-[48px]">
                  {copied ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
                  {copied ? "Link copied. Paste it in your browser" : "Copy the link"}
                </button>
              )}
              <button type="button" onClick={close} className="btn-outline min-h-[48px]">
                Got it
              </button>
            </div>

            {isIosSafariGuide && (
              <p
                aria-hidden
                className="mt-4 flex items-center justify-center gap-2 font-display text-sm font-bold text-drop"
              >
                <ArrowDown size={18} className="motion-safe:animate-bounce" />
                The Share button is at the bottom of Safari
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
