/**
 * Keeps Tab inside an open modal (an `aria-modal` drawer or sheet).
 *
 * `aria-modal` tells a screen reader that nothing outside the panel exists,
 * but the browser still tabs out of it: past the last control, focus lands
 * on the page behind the overlay, where nobody can see it. Call this from
 * the panel's keydown listener; on Tab from the last control it wraps to the
 * first, on Shift+Tab from the first (or from outside) to the last.
 */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function trapTab(event, container) {
  if (event.key !== "Tab" || !container) return;
  const items = [...container.querySelectorAll(FOCUSABLE)].filter(
    (el) => el.getClientRects().length > 0 && !el.closest("[inert]"),
  );
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  const inside = container.contains(active);
  if (event.shiftKey ? !inside || active === first : !inside || active === last) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
}
