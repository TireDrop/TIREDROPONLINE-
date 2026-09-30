/**
 * Keeps what a visitor typed into a prerendered page before the app took it
 * over.
 *
 * A prerendered page arrives with its forms already in the HTML, so a visitor
 * can type before the JavaScript has run. When main.jsx hydrates, React
 * adopts those same DOM nodes and the values stay. But two starts replace the
 * markup instead of adopting it:
 *
 *   - a URL the HTML was not rendered for, such as /track?utm_source=… or a
 *     host's fallback page: main.jsx renders fresh (createRoot), which swaps
 *     in new, empty fields when React commits;
 *   - a hydration mismatch: React throws the server markup away and renders
 *     the root on the client, with the same result.
 *
 * Either way the fields a visitor filled in go blank a moment after load,
 * and a submit then sends nothing. That is the /track bug of 2026-09-30:
 * order number and email typed, then cleared once, fine on the second try.
 *
 * watchTyped(root) records every field inside `root` that has a value it was
 * not rendered with (typed, pasted, autofilled, set by a script) from before
 * React starts until its first commit. restore(), called from a layout effect
 * of that first commit (see KeepTyped in main.jsx), puts each value back into
 * the matching new field — found by id, or by form and name when the id came
 * from useId and differs between server and client — the way autofill does
 * (native setter plus input/change events), so the form's own state takes
 * it too. It never overwrites a field that already holds something else, and
 * after a successful hydration it finds nothing to do: the nodes are the same
 * and already hold the values. Focus returns to the field the visitor was in.
 */

const FIELDS = "input, textarea, select";
const SKIP_TYPES = new Set(["file", "password", "hidden", "submit", "reset", "button", "image"]);

function isField(el) {
  return (
    el instanceof Element &&
    el.matches(FIELDS) &&
    !SKIP_TYPES.has((el.type || "").toLowerCase())
  );
}

const isCheck = (el) => el.type === "checkbox" || el.type === "radio";

/** A key that names the same field in the server and the client markup. */
function keyOf(el, root) {
  const forms = [...root.querySelectorAll("form")];
  const formIndex = el.form ? forms.indexOf(el.form) : -1;
  const radio = el.type === "radio" ? `=${el.value}` : "";
  // useId ids (":R1:" on the server, ":r1:" on a client render) differ.
  if (el.id && !el.id.includes(":")) return `#${el.id}${radio}`;
  return `${formIndex}|${el.name || ""}${radio}`;
}

function find(key, root) {
  const all = root.querySelectorAll(FIELDS);
  for (const el of all) if (isField(el) && keyOf(el, root) === key) return el;
  return null;
}

/** What the field holds, and whether that differs from what it was rendered with. */
function read(el) {
  if (isCheck(el)) return { value: el.checked, dirty: el.checked !== el.defaultChecked };
  if (el.tagName === "SELECT") {
    const dirty = [...el.options].some((o) => o.selected !== o.defaultSelected);
    return { value: el.value, dirty };
  }
  return { value: el.value, dirty: el.value !== el.defaultValue };
}

function write(el, value) {
  if (isCheck(el)) {
    // A click toggles it and fires the events a real click would.
    if (el.checked !== value) el.click();
    return;
  }
  const proto = Object.getPrototypeOf(el);
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

export function watchTyped(root) {
  const typed = new Map();
  let focused = null;
  if (!root || typeof document === "undefined") {
    return { restore() {}, stop() {} };
  }

  const record = (el) => {
    if (!isField(el) || !root.contains(el) || el.disabled || el.readOnly) return;
    const { value, dirty } = read(el);
    const key = keyOf(el, root);
    if (dirty) typed.set(key, value);
    else typed.delete(key);
  };

  // Anything typed before this script ran fired no event we could hear.
  root.querySelectorAll(FIELDS).forEach(record);
  if (isField(document.activeElement) && root.contains(document.activeElement)) {
    focused = keyOf(document.activeElement, root);
  }

  const onEvent = (e) => record(e.target);
  const onFocus = (e) => {
    if (isField(e.target) && root.contains(e.target)) focused = keyOf(e.target, root);
  };
  document.addEventListener("input", onEvent, true);
  document.addEventListener("change", onEvent, true);
  document.addEventListener("focusin", onFocus, true);

  const stop = () => {
    document.removeEventListener("input", onEvent, true);
    document.removeEventListener("change", onEvent, true);
    document.removeEventListener("focusin", onFocus, true);
  };

  const restore = () => {
    stop();
    for (const [key, value] of typed) {
      const el = find(key, root);
      if (!el || el.disabled || el.readOnly) continue;
      const now = read(el);
      if (now.value === value) continue; // hydrated in place: nothing lost
      if (now.dirty) continue; // something else already filled it
      write(el, value);
    }
    // The field the visitor was in was replaced, so focus fell to <body>.
    if (focused && (!document.activeElement || document.activeElement === document.body)) {
      const el = find(focused, root);
      if (el) {
        el.focus({ preventScroll: true });
        try {
          const end = el.value.length;
          el.setSelectionRange(end, end);
        } catch {
          /* email and number inputs have no selection API */
        }
      }
    }
    typed.clear();
  };

  return { restore, stop };
}
