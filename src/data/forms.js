/**
 * Where the site's forms send what people type.
 *
 * There is no backend. Until one exists, every form on this site collected a
 * message, validated it carefully, and threw it away while telling the visitor
 * a person would reply. That is the one thing on the site that makes a promise
 * to a real visitor which nothing keeps, so the transport lives here and every
 * form asks `isWired()` before it claims anything.
 *
 * To turn it on, set VITE_FORM_ENDPOINT (and VITE_CONTACT_EMAIL, which is what
 * the confirmations quote back) in the deploy environment. Any endpoint that
 * accepts a JSON POST works — Formspree, Basin, Netlify Forms, a Worker. No
 * code change is needed; the forms read it at build time.
 */

const ENDPOINT = (import.meta.env.VITE_FORM_ENDPOINT || "").trim();

/** The address the confirmations name, or null while none is configured. */
export const CONTACT_EMAIL =
  (import.meta.env.VITE_CONTACT_EMAIL || "").trim() || null;

/** True once a real destination is configured, so copy may claim delivery. */
export const isWired = () => ENDPOINT !== "";

/**
 * Posts one form's values.
 *
 * Resolves `{ delivered: boolean, error: string | null }` and never throws:
 * a form that has already validated its input should show its confirmation
 * either way, because the visitor's next step — calling the shop — is the
 * same whether or not the POST landed. `delivered` decides which confirmation
 * they see, so it is never optimistic.
 */
export async function submitForm(formName, values) {
  if (!isWired()) return { delivered: false, error: null };

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        _form: formName,
        _submittedAt: new Date().toISOString(),
        ...values,
      }),
    });
    if (!response.ok) {
      return {
        delivered: false,
        error: `The form service answered ${response.status}.`,
      };
    }
    return { delivered: true, error: null };
  } catch {
    // Offline, blocked, or the endpoint is down. The visitor still gets a
    // confirmation — one that does not pretend the message arrived.
    return { delivered: false, error: "We could not reach the form service." };
  }
}
