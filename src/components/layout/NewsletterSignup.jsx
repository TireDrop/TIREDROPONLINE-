import React, { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { ApiError, subscribeNewsletter } from "../../data/api.js";
import { hasChanges, readFormValues } from "../../data/forms.js";
import { useApiStatus } from "../../data/useApi.js";
import { FormTrap, Input } from "../ui/index.jsx";

/**
 * Newsletter sign-up, inline. It sits in the footer on every page (Footer.jsx)
 * and can be dropped into a page, such as an article, as it is. It replaced
 * the old pop-up on 2026-09-30: nothing opens, floats or comes back. It is a
 * form that stays where it is put.
 *
 * - Renders only when /api/status reports `newsletter: "on"`, meaning POST
 *   /api/newsletter can reach Shopify. Anything else (off, no API on this
 *   host, status unreachable) renders nothing, so the site never asks for an
 *   email it has nowhere to put.
 * - The email goes to POST /api/newsletter (api/_lib/newsletter.js). It
 *   becomes a Shopify customer with email marketing consent (single opt-in),
 *   tagged newsletter, <source> and vercel. The default source is "footer".
 *   The API accepts only "popup" and "footer" (api/_lib/validate.js).
 * - It uses the shared Input and readFormValues, so an email filled in
 *   without an input event (autofill, automation) survives re-renders and is
 *   what gets sent. `website` is the honeypot.
 * - It stores nothing in the browser. The pop-up used to save its closed or
 *   signed-up state under localStorage "td-nl-popup"; that entry is deleted
 *   if found (see the privacy policy, section 3).
 * - Safe to prerender: no window or storage access during render.
 *
 * No discount, coupon or offer: the business has none, so the copy promises
 * tips and news only.
 */

const COPY = {
  heading: "TireDrop emails",
  body: "Seasonal tire checks, fitment help for your vehicle, and first word when new sizes and brands land. No spam. Unsubscribe anytime.",
  emailLabel: "Email address",
  placeholder: "you@example.com",
  button: "Sign up",
  busy: "Signing up…",
  invalid: "Enter a valid email address.",
  success: "You're on the list. Watch your inbox.",
  failed: "We couldn't sign you up just now. Please try again in a few minutes.",
};

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;

/** The pop-up's old localStorage entry, removed wherever it is still found. */
const LEGACY_KEY = "td-nl-popup";

const TONES = {
  dark: {
    heading: "text-bone",
    body: "text-bone/70",
    label: "text-bone/85",
    fine: "text-bone/55",
    link: "text-bone underline underline-offset-2 hover:text-amber",
    error: "text-[#FF8A8C]",
    success: "text-bone",
    check: "bg-drop/20 text-volt",
    focus: "focus-visible:ring-offset-ink",
    input: "focus:ring-volt/40",
  },
  light: {
    heading: "text-ink",
    body: "text-smoke",
    label: "text-ink",
    fine: "text-smoke",
    link: "text-dive underline underline-offset-2 hover:text-ink",
    error: "text-[#C20A0E]",
    success: "text-ink",
    check: "bg-sky text-drop",
    focus: "focus-visible:ring-offset-bone",
    input: "",
  },
};

/**
 * `tone`: "dark" (footer, ink surfaces) or "light" (a page body).
 * `source`: what the sign-up is tagged with in Shopify.
 */
export function NewsletterSignup({ tone = "dark", source = "footer", className = "" }) {
  const status = useApiStatus();
  const t = TONES[tone] ?? TONES.dark;

  const uid = useId();
  const ids = {
    heading: `nl-${uid}-heading`,
    email: `nl-${uid}-email`,
    trap: `nl-${uid}-website`,
    message: `nl-${uid}-message`,
  };

  const emailRef = useRef(null);
  const doneRef = useRef(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // Housekeeping from the pop-up days; runs whatever the status says.
  useEffect(() => {
    try {
      window.localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* storage blocked: nothing to clean */
    }
  }, []);

  // After a sign-up the form is gone, so focus moves to the message.
  useEffect(() => {
    if (done) doneRef.current?.focus({ preventScroll: true });
  }, [done]);

  if (status?.newsletter !== "on") return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    // What the field shows, including a value filled in without an input
    // event, which state never saw.
    const { values, changed } = readFormValues(form, { email });
    if (hasChanges(changed)) setEmail(values.email);
    // The honeypot is read straight from the DOM, however it was filled.
    const website = form.elements.namedItem("website")?.value || "";
    const value = values.email.trim();
    if (!EMAIL.test(value)) {
      setError(COPY.invalid);
      emailRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await subscribeNewsletter({ email: value, source, website });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : COPY.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-labelledby={ids.heading}
      className={`grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-start lg:gap-10 ${className}`}
      data-testid="newsletter-signup"
    >
      <div>
        <h2
          id={ids.heading}
          className={`font-display text-xl font-extrabold tracking-[-0.015em] md:text-2xl ${t.heading}`}
        >
          {COPY.heading}
        </h2>
        <p className={`mt-2 max-w-prose text-[15px] leading-relaxed ${t.body}`}>
          {COPY.body}
        </p>
      </div>

      <div>
        {!done && (
          <form noValidate onSubmit={onSubmit} className="relative">
            <label htmlFor={ids.email} className={`mb-1.5 block text-sm font-semibold ${t.label}`}>
              {COPY.emailLabel}
            </label>
            <div className="flex gap-2">
              <Input
                ref={emailRef}
                id={ids.email}
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
                inputMode="email"
                required
                aria-invalid={error ? "true" : undefined}
                aria-describedby={error ? ids.message : undefined}
                className={`field h-12 min-w-0 flex-1 text-base ${t.input} ${error ? "border-[#C20A0E]" : ""}`}
              />
              <button
                type="submit"
                aria-disabled={busy ? "true" : undefined}
                className={`btn-primary min-h-[48px] shrink-0 px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt focus-visible:ring-offset-2 ${t.focus} ${busy ? "cursor-progress opacity-75" : ""}`}
              >
                {busy ? COPY.busy : COPY.button}
              </button>
            </div>
            <FormTrap id={ids.trap} />
          </form>
        )}

        {/* One live region for the result, present from the first render so
            screen readers announce what lands in it. */}
        <div aria-live="polite">
          {done ? (
            <p
              ref={doneRef}
              tabIndex={-1}
              className={`flex items-center gap-3 font-display text-lg font-bold focus:outline-none ${t.success}`}
            >
              <span
                aria-hidden="true"
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${t.check}`}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              {COPY.success}
            </p>
          ) : error ? (
            <p id={ids.message} className={`mt-2 text-sm font-semibold ${t.error}`}>
              {error}
            </p>
          ) : null}
        </div>

        {!done && (
          <p className={`mt-3 text-xs leading-relaxed ${t.fine}`}>
            By signing up you agree to receive marketing emails from TireDrop.
            Unsubscribe anytime. See our{" "}
            <Link to="/privacy" className={t.link}>
              Privacy Policy
            </Link>
            .
          </p>
        )}
      </div>
    </section>
  );
}

export default NewsletterSignup;
