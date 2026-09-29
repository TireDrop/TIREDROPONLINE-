/**
 * Where the site's forms send what people type.
 *
 * Every form posts to the site's own backend, POST /api/forms, which stores
 * the message on the customer in Shopify and has Shopify Flow email it to
 * info@ (api/_lib/leads.js, docs/integrations/website-leads.md). There is no
 * third-party form service.
 *
 * A form may only claim its message arrived when it did, so every form asks
 * the server first: /api/status reports `forms: "on"` once Shopify is
 * configured. Until then (or when the API cannot be reached) `isWired()` is
 * false and each form says plainly that nothing was sent and points at the
 * phone. The status is fetched once per page load and shared with the rest
 * of the site (getStatus in api.js).
 *
 * VITE_CONTACT_EMAIL sets the address the confirmations quote back (it falls
 * back to BUSINESS.email, info@tiredroponline.com, when left empty).
 */

import { useEffect, useState } from "react";

import { BUSINESS } from "./business.js";
import { ApiError, getStatus, sendForm } from "./api.js";

/**
 * The address the confirmations name: VITE_CONTACT_EMAIL if set, otherwise the
 * published business address. Quoting it is not a delivery claim — only
 * `isWired()` decides whether a form may say its message arrived.
 */
export const CONTACT_EMAIL =
  (import.meta.env?.VITE_CONTACT_EMAIL || "").trim() || BUSINESS.email || null;

// What /api/status last said, so a page rendered after the first answer
// starts from it instead of flashing the "not connected" copy.
let lastKnown = false;

/** Asks /api/status (cached per page load) whether the forms deliver. */
export async function formsOn() {
  const status = await getStatus();
  lastKnown = status?.forms === "on";
  return lastKnown;
}

/**
 * True once /api/status has reported `forms: "on"`, so copy may claim
 * delivery. Synchronous: false until the status has been read. Components
 * use `useFormsWired()`, which re-renders when the answer lands.
 */
export const isWired = () => lastKnown;

/** `isWired()` as a hook: false until /api/status says `forms: "on"`. */
export function useFormsWired() {
  const [wired, setWired] = useState(lastKnown);
  useEffect(() => {
    let alive = true;
    formsOn().then((on) => {
      if (alive) setWired(on);
    });
    return () => {
      alive = false;
    };
  }, []);
  return wired;
}

/**
 * The honeypot every form carries (`<FormTrap />`): a field people never
 * see, so a value in it means a bot filled the form. The server answers a
 * bot like a success and stores nothing.
 */
function trapValue(formElement) {
  const field = formElement?.elements?.namedItem?.("website");
  return typeof field?.value === "string" ? field.value : "";
}

/**
 * Reads a form's fields back from the DOM and merges them over the state it
 * was rendered from, so a submit sends what the visitor can see.
 *
 * The fields (Input, Textarea, Select in components/ui) keep a value that
 * arrived without an input event — browser automation, some password
 * managers, some mobile autofill — but that value never reached state. Call
 * this before validating: where a named field's DOM value differs from
 * `stateValues[name]`, the DOM wins.
 *
 * Only keys already in `stateValues` are read, so the honeypot (`website`,
 * read separately by submitForm) never joins the values. A key with no
 * enabled field in the form — a step not on screen, a disabled input — keeps
 * its state value. Booleans are read from a checkbox's `checked`.
 *
 * Returns `{ values, changed }`: the merged values, and just the keys the DOM
 * supplied (empty when state was already up to date), for the caller to put
 * back into state.
 */
export function readFormValues(formElement, stateValues) {
  const values = { ...stateValues };
  const changed = {};
  if (!formElement || typeof FormData === "undefined") {
    return { values, changed };
  }

  const data = new FormData(formElement);
  for (const [key, current] of Object.entries(stateValues)) {
    if (key === "website") continue;
    let fromDom;
    if (typeof current === "boolean") {
      const field = formElement.elements.namedItem(key);
      if (!field || field.type !== "checkbox" || field.disabled) continue;
      fromDom = field.checked;
    } else if (typeof current === "string") {
      if (!data.has(key)) continue;
      fromDom = data.get(key);
      if (typeof fromDom !== "string") continue; // a file, not text
    } else {
      continue;
    }
    if (fromDom !== current) {
      values[key] = fromDom;
      changed[key] = fromDom;
    }
  }
  return { values, changed };
}

/** True when readFormValues found anything state did not have. */
export const hasChanges = (changed) => Object.keys(changed).length > 0;

/**
 * Posts one form's values to /api/forms. `formElement` is the submitted
 * <form>, read only for its honeypot.
 *
 * Resolves `{ delivered: boolean, error: string | null }` and never throws:
 * a form that has already validated its input should show its confirmation
 * either way, because the visitor's next step — calling the shop — is the
 * same whether or not the POST landed. `delivered` decides which confirmation
 * they see, so it is never optimistic. `error` is null when the forms are
 * simply not connected, and a sentence when a send was tried and failed.
 */
export async function submitForm(formName, values, formElement = null) {
  // Read the trap before any await: the form may re-render meanwhile.
  const website = trapValue(formElement);
  if (!(await formsOn())) return { delivered: false, error: null };

  try {
    await sendForm({ ...values, form: formName, website });
    return { delivered: true, error: null };
  } catch (err) {
    if (err instanceof ApiError) return { delivered: false, error: err.message };
    // Offline, blocked, or the server could not store it. The visitor still
    // gets a confirmation — one that does not pretend the message arrived.
    return { delivered: false, error: "We could not reach the form service." };
  }
}
