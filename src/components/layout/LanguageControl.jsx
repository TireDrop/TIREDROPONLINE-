/**
 * The header's "Language" control and the notice shown while a page is
 * translated. The decisions (which approach, why, what is protected) are in
 * the comments of src/lib/translate.js.
 *
 * Nothing here touches window or document while rendering: the prerender and
 * the hydrating render both see the "off" state (useSyncExternalStore's server
 * snapshot), and everything else happens in effects and click handlers. A
 * visitor who never opens the control loads nothing from Google.
 */
import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ChevronDown } from "lucide-react";

import { BUSINESS } from "../../data/business.js";
import { TIRE_BRAND_NAMES } from "../../data/products.js";
import {
  ELEMENT_ENABLED,
  ELEMENT_SRC,
  HIDE_GOOGLE_CHROME_CSS,
  OTHER_LANGUAGES,
  PINNED,
  STORAGE_KEY,
  buildFallbackUrl,
  cookieDomains,
  googtransValue,
  installDomGuard,
  isProtectedText,
  isProxyHost,
  isValidCode,
  languageFor,
  languageLabel,
  mergeGoogleLanguages,
  originalUrl,
  proxyLanguage,
} from "../../lib/translate.js";

/* ------------------------------------------------------------------------ *
 * State, shared by the desktop control, the menu control and the notice.
 * ------------------------------------------------------------------------ */

const OFF = Object.freeze({
  status: "off", // off | loading | on
  mode: null, // element | proxy
  code: null,
  others: OTHER_LANGUAGES,
});

let state = OFF;
const listeners = new Set();
const setState = (patch) => {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
};
const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

function useTranslateState() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => OFF,
  );
}

/* ------------------------------------------------------------------------ *
 * Browser helpers. Only ever called from effects and event handlers.
 * ------------------------------------------------------------------------ */

const wait = (ms) => new Promise((r) => window.setTimeout(r, ms));

async function waitFor(test, timeout, step = 100) {
  const end = Date.now() + timeout;
  for (;;) {
    const value = test();
    if (value) return value;
    if (Date.now() > end) return null;
    await wait(step);
  }
}

function readStored() {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY));
    return saved && isValidCode(saved.code) ? saved : null;
  } catch {
    return null;
  }
}

function writeStored(value) {
  try {
    if (value)
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode or blocked storage: the choice lasts this page only */
  }
}

function setGoogtrans(code) {
  const domains = cookieDomains(window.location.hostname);
  for (const domain of domains) {
    const scope = domain ? `; domain=${domain}` : "";
    document.cookie = code
      ? `googtrans=${googtransValue(code)}; path=/${scope}; SameSite=Lax`
      : `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${scope}`;
    if (code) return; // writing once, host-only, is enough
  }
}

const isTranslatedClass = () =>
  /\btranslated-(?:ltr|rtl)\b/.test(document.documentElement.className);

/* -------------------------- safety, on activation ------------------------- */

let protector = null;

const PROTECTED_STRINGS = [
  BUSINESS.name,
  BUSINESS.parent,
  BUSINESS.poweredBy,
  BUSINESS.shop.name,
  BUSINESS.shop.street,
  BUSINESS.shop.full,
  `${BUSINESS.shop.city}, ${BUSINESS.shop.state} ${BUSINESS.shop.zip}`,
  BUSINESS.phone,
  BUSINESS.email,
  ...TIRE_BRAND_NAMES,
];

function markNoTranslate(el) {
  if (el.getAttribute("translate") !== "no") el.setAttribute("translate", "no");
  if (!el.classList.contains("notranslate")) el.classList.add("notranslate");
}

const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "SVG"]);

/** Marks every element under `root` whose whole text is a protected value. */
function protectTree(root) {
  if (!(root instanceof Element)) return;
  if (root.closest(".notranslate, [translate='no']")) return;
  const all = [root, ...root.querySelectorAll("*")];
  for (const el of all) {
    if (SKIP.has(el.tagName.toUpperCase())) continue;
    // Whole text only: a tel: link that reads "Call" still gets translated.
    const text = el.textContent;
    if (text && text.length <= 80 && isProtectedText(text, PROTECTED_STRINGS))
      markNoTranslate(el);
  }
}

/**
 * Installs the React guard, hides Google's banner and tooltip, and keeps
 * prices, sizes and the like out of the translation, including on pages
 * rendered after this point. Idempotent.
 */
function activateSafety() {
  installDomGuard();

  if (!document.getElementById("td-translate-css")) {
    const style = document.createElement("style");
    style.id = "td-translate-css";
    style.textContent = HIDE_GOOGLE_CHROME_CSS;
    document.head.appendChild(style);
  }

  if (protector) return;
  protectTree(document.body);
  protector = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "attributes") {
        // React rewrites className wholesale; translate="no" survives that,
        // so put the class back next to it.
        const el = r.target;
        if (
          el.getAttribute?.("translate") === "no" &&
          !el.classList.contains("notranslate")
        )
          el.classList.add("notranslate");
        continue;
      }
      if (r.type === "characterData") {
        if (r.target.parentElement) protectTree(r.target.parentElement);
        continue;
      }
      for (const node of r.addedNodes) {
        if (node.nodeType === 1) protectTree(node);
        else if (node.nodeType === 3 && node.parentElement)
          protectTree(node.parentElement);
      }
    }
  });
  protector.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class"],
  });
}

/* -------------------------- Google's element ------------------------------ */

let elementLoad = null;

/**
 * Loads Google's website translator once. Resolves when its callback has run,
 * rejects if the script fails or has not answered in 8 seconds.
 */
function loadElement() {
  if (elementLoad) return elementLoad;
  elementLoad = new Promise((resolve, reject) => {
    // Outside #root, so React never meets what Google puts in it. Reused if
    // an earlier attempt failed.
    let container = document.getElementById("td-gt-element");
    if (!container) {
      container = document.createElement("div");
      container.id = "td-gt-element";
      container.hidden = true;
      container.setAttribute("aria-hidden", "true");
      document.body.appendChild(container);
    }
    container.replaceChildren();

    const timer = window.setTimeout(
      () => reject(new Error("Google Translate did not load in time")),
      8000,
    );
    window.tdGoogleTranslateInit = () => {
      try {
        new window.google.translate.TranslateElement(
          { pageLanguage: "en", autoDisplay: false },
          "td-gt-element",
        );
        window.clearTimeout(timer);
        resolve();
      } catch (error) {
        window.clearTimeout(timer);
        reject(error);
      }
    };

    const script = document.createElement("script");
    script.src = `${ELEMENT_SRC}?cb=tdGoogleTranslateInit`;
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("Google Translate could not be loaded"));
    };
    document.head.appendChild(script);
  });
  // A failed load can be retried on the next pick.
  elementLoad.catch(() => {
    elementLoad = null;
  });
  return elementLoad;
}

const findCombo = () => document.querySelector("select.goog-te-combo");

/** Adds any language Google lists that the built-in list lacks. */
function mergeFromCombo(combo) {
  const options = [...combo.options].map((o) => ({
    value: o.value,
    text: o.textContent,
  }));
  const merged = mergeGoogleLanguages(options).filter(
    (l) => !PINNED.some((p) => p.code === l.code),
  );
  if (merged.length !== state.others.length) setState({ others: merged });
}

/**
 * Translates in place with Google's element. Resolves true once the page is
 * visibly translated (Google marks <html> translated-ltr / translated-rtl),
 * false otherwise.
 */
async function translateWithElement(code) {
  activateSafety();
  setGoogtrans(code);
  await loadElement();
  const combo = await waitFor(
    () => {
      const c = findCombo();
      return c && [...c.options].some((o) => o.value === code) ? c : null;
    },
    6000,
  );
  if (!combo) return false;
  mergeFromCombo(combo);
  if (combo.value !== code) {
    combo.value = code;
    combo.dispatchEvent(new Event("change"));
  }
  return Boolean(await waitFor(isTranslatedClass, 6000));
}

/* ------------------------------ actions ----------------------------------- */

const onProxy = () => isProxyHost(window.location.hostname);

function goToFallback(code) {
  window.location.assign(buildFallbackUrl(code, window.location.href));
}

/** What the control does when a language is picked. */
async function chooseLanguage(code) {
  if (!isValidCode(code)) return;
  if (onProxy() || !ELEMENT_ENABLED) {
    goToFallback(code);
    return;
  }
  setState({ status: "loading", mode: "element", code });
  let translated = false;
  try {
    translated = await translateWithElement(code);
  } catch {
    translated = false;
  }
  if (translated) {
    writeStored({ code, mode: "element" });
    setState({ status: "on", mode: "element", code });
    return;
  }
  // Google's element is retired (2026-10-01) and may be gone: use the URL.
  setGoogtrans(null);
  writeStored(null);
  goToFallback(code);
}

/** Back to the English page, exactly as the site serves it. */
function restoreEnglish() {
  writeStored(null);
  if (onProxy()) {
    window.location.assign(originalUrl(window.location.href));
    return;
  }
  setGoogtrans(null);
  // Reloading is the only clean undo: the translator has rewritten the DOM.
  window.location.reload();
}

/** Opening the control fetches Google's script early, so a pick is quick. */
function warmUp() {
  if (ELEMENT_ENABLED && !onProxy()) loadElement().catch(() => {});
}

/**
 * Called from main.jsx before anything loads. On translate.goog Google is
 * already rewriting the page, and its observer would otherwise get to every
 * node React adds (a product page's price, tire size) before ours exists,
 * because the protector used to start only after hydration. Starting it here
 * puts it first in line, whatever the network and font loading do to timing.
 */
export function protectEarlyOnProxy() {
  if (onProxy()) activateSafety();
}

let booted = false;

/** Runs once, after hydration: picks up a translation already in progress. */
function boot() {
  if (booted) return;
  booted = true;

  // Browser translators (Chrome's, Edge's) rewrite the DOM the same way, so
  // the guard goes in as soon as one marks the page as translated.
  const watchHtml = new MutationObserver(() => {
    if (isTranslatedClass()) {
      installDomGuard();
      watchHtml.disconnect();
    }
  });
  watchHtml.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  if (isTranslatedClass()) installDomGuard();

  if (onProxy()) {
    // Served by translate.goog: Google is already translating this page.
    activateSafety();
    const code = proxyLanguage(window.location.href) ?? readStored()?.code;
    if (code) writeStored({ code, mode: "proxy" });
    setState({ status: "on", mode: "proxy", code: code ?? null });
    return;
  }

  const saved = readStored();
  if (saved?.mode === "element" && ELEMENT_ENABLED) {
    // Same tab, same session, a page loaded fresh: translate again. If the
    // element no longer works, quietly stay in English rather than bounce the
    // visitor to Google on every page load.
    setState({ status: "loading", mode: "element", code: saved.code });
    translateWithElement(saved.code)
      .catch(() => false)
      .then((ok) => {
        if (ok) setState({ status: "on" });
        else {
          setGoogtrans(null);
          writeStored(null);
          setState(OFF);
        }
      });
  } else if (saved) {
    writeStored(null);
  }
}

/* ------------------------------------------------------------------------ *
 * UI
 * ------------------------------------------------------------------------ */

// Google's codes are not all BCP 47; screen readers want the real tag.
const BCP47 = { iw: "he", jw: "jv", "mni-Mtei": "mni" };
const langTag = (code) => BCP47[code] ?? code;

function LanguagePanel({ id, current, others, onPick, onEnglish, busy }) {
  const selectId = useId();
  const headingId = useId();
  const [other, setOther] = useState("");

  return (
    <div
      id={id}
      role="group"
      aria-labelledby={headingId}
      className="text-left text-ink"
    >
      <p
        id={headingId}
        className="font-display text-[12px] font-bold uppercase tracking-[0.09em] text-smoke"
      >
        Translate this page
      </p>

      {/* The five most asked-for languages are one tap each. Language names
          are never translated: a reader looks for their own. */}
      <ul className="notranslate mt-2 grid grid-cols-2 gap-1.5" translate="no">
        {PINNED.map((lang) => (
          <li key={lang.code}>
            <button
              type="button"
              lang={langTag(lang.code)}
              aria-pressed={current === lang.code}
              disabled={busy}
              onClick={() => onPick(lang.code)}
              className={`flex min-h-[44px] w-full items-center rounded-sm border px-3 text-left text-[15px] font-semibold transition-colors disabled:opacity-60 ${
                current === lang.code
                  ? "border-drop bg-sky text-drop"
                  : "border-ink/10 bg-bone hover:border-drop/40 hover:bg-fog"
              }`}
            >
              {lang.native}
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            lang="en"
            aria-pressed={!current}
            disabled={busy || !current}
            onClick={onEnglish}
            className={`flex min-h-[44px] w-full items-center rounded-sm border px-3 text-left text-[15px] font-semibold transition-colors ${
              !current
                ? "border-drop bg-sky text-drop"
                : "border-ink/10 bg-bone hover:border-drop/40 hover:bg-fog"
            }`}
          >
            English (original)
          </button>
        </li>
      </ul>

      <form
        className="mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (other) onPick(other);
        }}
      >
        <label
          htmlFor={selectId}
          className="block text-[13px] font-semibold text-ink"
        >
          All languages
        </label>
        <div className="mt-1 flex gap-1.5">
          <select
            id={selectId}
            value={other}
            onChange={(e) => setOther(e.target.value)}
            className="field notranslate h-11 min-w-0 flex-1 text-[15px]"
            translate="no"
          >
            <option value="">Choose…</option>
            {others.map((lang) => (
              <option key={lang.code} value={lang.code} lang={langTag(lang.code)}>
                {languageLabel(lang)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!other || busy}
            className="btn-primary btn-sm h-11 min-h-[44px] shrink-0 px-4 disabled:opacity-60"
          >
            Translate
          </button>
        </div>
      </form>

      <p className="mt-3 text-[12px] leading-snug text-smoke">
        Translated automatically by Google Translate. Prices, policies and
        orders are in English.
      </p>
    </div>
  );
}

/**
 * The "Language" button and its panel.
 *   variant="popover"  desktop masthead: a dropdown under the button
 *   variant="inline"   mobile menu: the panel opens in place, full width
 * `onBeforeAction` runs before the page is translated or reset (the menu
 * closes itself with it).
 */
export function LanguageControl({
  variant = "popover",
  className = "",
  onBeforeAction,
}) {
  const s = useTranslateState();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const popover = variant === "popover";
  const current = s.status === "off" ? null : s.code;
  const currentLang = languageFor(current);

  const close = useCallback((refocus) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  }, []);

  // A dropdown closes on Escape and on a click anywhere else.
  useEffect(() => {
    if (!open || !popover) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") close(true);
    };
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, popover, close]);

  const toggle = () => {
    if (!open) warmUp();
    setOpen((o) => !o);
  };

  const pick = (code) => {
    setOpen(false);
    onBeforeAction?.();
    chooseLanguage(code);
  };

  const english = () => {
    setOpen(false);
    onBeforeAction?.();
    restoreEnglish();
  };

  return (
    <div
      ref={wrapRef}
      className={`${popover ? "relative" : ""} ${className}`}
      onKeyDown={(e) => {
        // Escape inside the menu's panel closes the panel, not the menu.
        if (!popover && open && e.key === "Escape") {
          e.stopPropagation();
          close(true);
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className={
          popover
            ? "flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-sm px-2.5 text-[13px] font-semibold text-ink transition-colors hover:bg-fog hover:text-drop"
            : "flex min-h-[44px] w-full items-center gap-2 rounded-sm px-1.5 font-display text-[13px] font-bold uppercase tracking-[0.015em] text-ink transition-colors hover:bg-fog hover:text-drop"
        }
      >
        <span
          aria-hidden
          translate="no"
          className="notranslate text-[17px] leading-none"
        >
          🌐
        </span>
        Language
        {currentLang && (
          <span
            className="notranslate rounded-sm bg-sky px-1.5 py-0.5 text-[11px] font-bold uppercase text-drop"
            translate="no"
            lang={langTag(currentLang.code)}
          >
            {currentLang.native}
          </span>
        )}
        <ChevronDown
          size={14}
          aria-hidden
          className={`${popover ? "" : "ml-auto"} transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className={
            popover
              ? "absolute right-0 top-full z-50 mt-1.5 w-[min(24rem,calc(100vw-2rem))] rounded-card border border-ink/10 bg-bone p-4 shadow-lift"
              : "mt-1 rounded-sm border border-ink/10 bg-fog p-3"
          }
        >
          <LanguagePanel
            id={panelId}
            current={current}
            others={s.others}
            busy={s.status === "loading"}
            onPick={pick}
            onEnglish={english}
          />
        </div>
      )}
    </div>
  );
}

/**
 * The line shown while a page is translated. It is translated along with the
 * page, so the reader can read it. Also starts the translation module once,
 * after hydration (see boot()).
 */
export function TranslationNotice() {
  const s = useTranslateState();
  useEffect(() => boot(), []);

  if (s.status === "off") return null;

  const backClass =
    "inline-flex min-h-[44px] items-center font-semibold text-drop underline underline-offset-2 hover:text-dive";

  return (
    <div
      role="status"
      className="border-b border-amber/40 bg-amber/15 text-ink"
      // "loading" until the translation is confirmed and the choice saved for
      // this tab; "on" after. check:translate waits for "on" before reloading.
      data-translate-notice={s.status}
    >
      <div className="wrap flex flex-wrap items-center gap-x-3 text-[13px] leading-snug">
        <p className="py-2">
          {s.status === "loading"
            ? "Translating this page…"
            : "Automatic translation — the English version applies to prices, policies and orders."}
        </p>
        <button type="button" onClick={restoreEnglish} className={backClass}>
          Switch back to English
        </button>
      </div>
    </div>
  );
}
