import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { ApiError, subscribeNewsletter } from "../../data/api.js";
import { hasChanges, readFormValues } from "../../data/forms.js";
import { Input } from "../ui/index.jsx";
import "./NewsletterPopup.css";

/**
 * Newsletter sign-up pop-up: the React twin of the Shopify theme's
 * shopify/sections/td-newsletter-popup.liquid, with the same copy, look and
 * behaviour, so sign-ups keep coming in after the domain moves to Vercel.
 * The email goes to POST /api/newsletter, which makes it a Shopify customer
 * with email marketing consent, tagged newsletter, popup and vercel.
 *
 * NewsletterGate (below) renders this only once /api/status says the
 * newsletter is "on", so an email is never collected into nowhere.
 *
 * Behaviour, as in the theme:
 *   - opens once, after DELAY_S seconds or at SCROLL_PCT% of the page,
 *     whichever comes first, and on desktop also when the pointer leaves
 *     through the top of the window;
 *   - waits while another dialog (the phone menu) is open, the tab is hidden,
 *     or the visitor is typing in a field;
 *   - never on EXCLUDED paths (checkout, cart, the lead forms);
 *   - a close, Esc, backdrop click or "No thanks" hides it for DISMISS_DAYS;
 *     a sign-up hides it for good. Stored under the theme's own localStorage
 *     key and format, so a choice made on the Shopify storefront carries
 *     over on the same domain. Every storage access is in try/catch;
 *   - 768px and up: modal, focus trapped and returned, page scroll locked;
 *     phones: a non-modal card above the call bar, under 60% of the screen.
 *
 * No discount, coupon or offer: the business has none, so the copy promises
 * tips and news only.
 */

export const STORAGE_KEY = "td-nl-popup";
const DELAY_S = 20;
const SCROLL_PCT = 50;
const DISMISS_DAYS = 14;
const DAY_MS = 864e5;

/** Paths (and everything under them) where it never shows. */
export const EXCLUDED = [
  "/cart",
  "/checkout",
  "/contact",
  "/financing",
  "/commercial-tires",
  "/schedule",
];

const COPY = {
  eyebrow: "The TireDrop list",
  heading: "Tire tips that save you money",
  body: "Seasonal tire checks, fitment help for your vehicle, and first word when new sizes and brands land. No spam — unsubscribe anytime.",
  emailLabel: "Email address",
  placeholder: "you@example.com",
  button: "Sign me up",
  decline: "No thanks",
  success: "You're on the list. Watch your inbox.",
  successButton: "Keep browsing",
};

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;
const BASE = import.meta.env.BASE_URL;

let memo = null;
function readState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : memo;
  } catch {
    return memo;
  }
}
function writeState(state) {
  memo = state;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode or blocked storage: the in-memory copy covers this visit */
  }
}
function suppressed() {
  const s = readState();
  if (!s) return false;
  if (s.s === "subscribed") return true;
  if (s.s === "dismissed" && typeof s.t === "number") {
    return Date.now() - s.t < DISMISS_DAYS * DAY_MS;
  }
  return false;
}

export function isExcluded(pathname) {
  const p = (String(pathname || "/").replace(/\/+$/, "") || "/").toLowerCase();
  return EXCLUDED.some((x) => p === x || p.startsWith(`${x}/`));
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]):not([tabindex="-1"]), select, textarea, [tabindex]:not([tabindex="-1"])';

function NewsletterPopup() {
  const { pathname } = useLocation();
  const excluded = isExcluded(pathname);

  const dialogRef = useRef(null);
  const emailRef = useRef(null);
  const titleRef = useRef(null);
  const doneRef = useRef(null);
  const shown = useRef(false); // one pop-up per page load
  const modal = useRef(false);
  const lastFocus = useRef(null);
  const closing = useRef(null); // why we are closing, read by onClose

  const [done, setDone] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const open = useCallback(() => {
    const dlg = dialogRef.current;
    if (!dlg || dlg.open) return;
    shown.current = true;
    lastFocus.current = document.activeElement;
    modal.current = !window.matchMedia("(max-width: 767.98px)").matches;
    dlg.hidden = false;
    if (modal.current && typeof dlg.showModal === "function") {
      dlg.showModal();
      document.documentElement.classList.add("td-nl-locked");
    } else if (typeof dlg.show === "function") {
      dlg.show();
    } else {
      dlg.setAttribute("open", "");
    }
    const target = modal.current ? emailRef.current : titleRef.current;
    target?.focus({ preventScroll: true });
  }, []);

  /** `remember`: a dismissal, hidden for DISMISS_DAYS. */
  const close = useCallback((remember) => {
    const dlg = dialogRef.current;
    if (!dlg?.open) return;
    closing.current = remember ? "dismiss" : "quiet";
    if (typeof dlg.close === "function") dlg.close();
    else {
      dlg.removeAttribute("open");
      dlg.dispatchEvent(new Event("close"));
    }
  }, []);

  const onClose = useCallback(() => {
    const dlg = dialogRef.current;
    // A close we did not start (the browser closing a modal on repeated Esc)
    // counts as a dismissal.
    const reason = closing.current ?? "dismiss";
    closing.current = null;
    if (reason === "dismiss" && readState()?.s !== "subscribed") {
      writeState({ s: "dismissed", t: Date.now() });
    }
    if (dlg) dlg.hidden = true;
    document.documentElement.classList.remove("td-nl-locked");
    const back = lastFocus.current;
    lastFocus.current = null;
    if (back && back !== document.body && back.isConnected && typeof back.focus === "function") {
      back.focus({ preventScroll: true });
    }
  }, []);

  const dismiss = useCallback(() => close(true), [close]);

  // Leaving for an excluded page while it is open: close without remembering.
  useEffect(() => {
    if (excluded) close(false);
  }, [excluded, close]);

  // Triggers: timer, scroll depth, exit intent. Armed only where allowed.
  useEffect(() => {
    if (excluded || shown.current || suppressed()) return undefined;
    let wait = null;
    let ticking = false;
    const pointer = window.matchMedia(
      "(min-width: 768px) and (hover: hover) and (pointer: fine)",
    );

    const blocked = () => {
      if (document.hidden) return true;
      const dlg = dialogRef.current;
      const others = document.querySelectorAll('dialog[open], [role="dialog"][aria-modal="true"]');
      for (const el of others) if (el !== dlg) return true;
      const a = document.activeElement;
      return Boolean(
        a &&
          a !== document.body &&
          !dlg?.contains(a) &&
          (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)),
      );
    };
    const request = () => {
      if (shown.current) return;
      if (blocked()) {
        if (!wait) {
          wait = setTimeout(() => {
            wait = null;
            request();
          }, 1000);
        }
        return;
      }
      open();
      disarm();
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        const el = document.scrollingElement || document.documentElement;
        const max = el.scrollHeight - el.clientHeight;
        if (max > 0 && (el.scrollTop / max) * 100 >= SCROLL_PCT) request();
      });
    };
    const onLeave = (e) => {
      if (!pointer.matches || e.relatedTarget || e.clientY > 0) return;
      request();
    };
    const timer = setTimeout(request, DELAY_S * 1000);
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    document.addEventListener("mouseout", onLeave);
    function disarm() {
      clearTimeout(timer);
      clearTimeout(wait);
      document.removeEventListener("scroll", onScroll, { capture: true });
      document.removeEventListener("mouseout", onLeave);
    }
    return disarm;
  }, [excluded, open]);

  // Esc from outside the non-modal phone card (a modal gets `cancel`).
  useEffect(() => {
    const onKey = (e) => {
      const dlg = dialogRef.current;
      if (!dlg?.open || modal.current) return;
      if (e.key === "Escape" && !dlg.contains(e.target)) dismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [dismiss]);

  // Crossing the 768px line while open: reopen in the other mode.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767.98px)");
    const onChange = () => {
      const dlg = dialogRef.current;
      if (!dlg?.open) return;
      const keep = lastFocus.current;
      closing.current = "quiet";
      dlg.close();
      lastFocus.current = null;
      open();
      lastFocus.current = keep;
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [open]);

  // Unmount (status flips off, route tree changes): release the scroll lock.
  useEffect(
    () => () => document.documentElement.classList.remove("td-nl-locked"),
    [],
  );

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      dismiss();
      return;
    }
    if (e.key !== "Tab" || !modal.current) return;
    const dlg = dialogRef.current;
    const list = [...dlg.querySelectorAll(FOCUSABLE)].filter(
      (el) => el.getClientRects().length > 0,
    );
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    const active = document.activeElement;
    const onHeading = active === titleRef.current || active === doneRef.current;
    if (e.shiftKey && (active === first || onHeading || !dlg.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // A click on the <dialog> box itself is a click on the backdrop (the card
  // fills the box). Both ends must land there, so a text selection dragged
  // out of the card does not close it.
  const downOnBackdrop = useRef(false);
  const onPointerDown = (e) => {
    downOnBackdrop.current = e.target === dialogRef.current;
  };
  const onClick = (e) => {
    if (e.target === dialogRef.current && downOnBackdrop.current) dismiss();
    downOnBackdrop.current = false;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    // The field as the visitor sees it, including an email filled in without
    // an input event (autofill, automation), which state never saw.
    const { values, changed } = readFormValues(form, { email });
    if (hasChanges(changed)) setEmail(values.email);
    // The honeypot is read straight from the DOM, however it was filled.
    const trap = form.elements.namedItem("website")?.value || "";
    const value = values.email.trim();
    if (!EMAIL.test(value)) {
      setError("Enter a valid email address.");
      emailRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await subscribeNewsletter({ email: value, source: "popup", website: trap });
      writeState({ s: "subscribed", t: Date.now() });
      setDone(true);
      // After the success view renders, move focus to its message.
      window.requestAnimationFrame(() => doneRef.current?.focus({ preventScroll: true }));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "We couldn't sign you up just now. Please try again in a few minutes.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="td-nl"
      hidden
      aria-labelledby={done ? "td-nl-done-title" : "td-nl-title"}
      aria-describedby={done ? undefined : "td-nl-desc"}
      onCancel={(e) => {
        e.preventDefault();
        dismiss();
      }}
      onClose={onClose}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onClick={onClick}
      data-testid="newsletter-popup"
    >
      <div className="td-nl__card">
        <div className="td-nl__band">
          <picture>
            <source srcSet={`${BASE}brand/tiredrop.webp`} type="image/webp" />
            <img
              className="td-nl__logo"
              src={`${BASE}brand/tiredrop.png`}
              alt="TireDrop"
              width="400"
              height="207"
              loading="lazy"
            />
          </picture>
          <button className="td-nl__close" type="button" aria-label="Close" onClick={dismiss}>
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="td-nl__body">
          {done ? (
            <div className="td-nl__done">
              <span className="td-nl__check" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <p className="td-nl__done-text" id="td-nl-done-title" role="status" tabIndex={-1} ref={doneRef}>
                {COPY.success}
              </p>
              <button className="td-nl__submit td-nl__submit--block" type="button" onClick={() => close(false)}>
                {COPY.successButton}
              </button>
            </div>
          ) : (
            <div>
              <p className="td-nl__eyebrow">{COPY.eyebrow}</p>
              <h2 className="td-nl__title" id="td-nl-title" tabIndex={-1} ref={titleRef}>
                {COPY.heading}
              </h2>
              <p className="td-nl__text" id="td-nl-desc">
                {COPY.body}
              </p>

              <form className="td-nl__form" noValidate onSubmit={onSubmit}>
                <label className="td-nl__label" htmlFor="td-nl-email">
                  {COPY.emailLabel}
                </label>
                <div className="td-nl__row">
                  <Input
                    ref={emailRef}
                    className="td-nl__input"
                    id="td-nl-email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={COPY.placeholder}
                    autoComplete="email"
                    autoCapitalize="off"
                    spellCheck="false"
                    required
                    aria-invalid={error ? "true" : undefined}
                    aria-describedby={error ? "td-nl-error" : undefined}
                  />
                  <button
                    className="td-nl__submit"
                    type="submit"
                    aria-disabled={busy ? "true" : undefined}
                  >
                    {COPY.button}
                  </button>
                </div>
                {/* Honeypot. People never see it; bots fill it in. */}
                <div className="td-nl__trap" aria-hidden="true">
                  <label htmlFor="td-nl-website">Leave this empty</label>
                  <input
                    id="td-nl-website"
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    defaultValue=""
                  />
                </div>
                {error && (
                  <p className="td-nl__error" id="td-nl-error" role="alert">
                    {error}
                  </p>
                )}
                <p className="td-nl__consent">
                  By signing up you agree to receive marketing emails from
                  TireDrop. Unsubscribe anytime. See our{" "}
                  <Link to="/privacy" onClick={() => close(false)}>
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>

              <button className="td-nl__skip" type="button" onClick={dismiss}>
                {COPY.decline}
              </button>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}

export default NewsletterPopup;
