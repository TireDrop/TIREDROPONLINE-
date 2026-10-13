import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Loader2, MessageCircle, Phone, Send, X } from "lucide-react";

import { BUSINESS } from "../../data/business.js";
import { isProductPath } from "../../data/mobileBar.js";
import { trackEvent } from "../../lib/analytics.js";
import { useApiStatus } from "../../data/useApi.js";
import { pageLanguage } from "../../lib/translate.js";
import { trapTab } from "../../lib/trapFocus.js";
import {
  MAX_CHARS,
  isChatHidden,
  loadHistory,
  parseReply,
  saveHistory,
  sendChat,
} from "./chatClient.js";

/**
 * The site chatbot: a floating "Ask TireDrop" button on every page and the
 * dialog it opens. Mounted once, in App.jsx beside MobileCallBar.
 *
 * - The answers come from POST /api/chat (api/_lib/chat.js), which replies
 *   only from what the site says and from live catalog lookups. This file
 *   adds no facts of its own except the shop's phone from business.js.
 * - On a phone the button sits above the call bar and the compare tray (and
 *   above a product page's buy bar) and the panel is a full-screen sheet; on
 *   a desktop it is a 380px panel above the button.
 * - Keyboard: opening moves focus to the message box, Tab stays inside
 *   (trapFocus.js), Esc closes and focus returns to the button.
 * - The conversation lives in sessionStorage for the tab (chatClient.js) and
 *   is sent to the server only when the visitor presses Send.
 * - Strings: English, and Spanish under /es/ (the same split the call bar
 *   uses). Every other language is the Language control's job: Google's
 *   translator rewrites text in place, so plain English strings are enough.
 * - Safe to prerender: nothing here touches window or storage during render.
 */

const COPY = {
  en: {
    launcher: "Ask TireDrop",
    launcherLabel: "Ask TireDrop: chat with our AI assistant",
    title: "Ask TireDrop",
    sub: "AI assistant. Answers from this site.",
    close: "Close chat",
    welcome:
      "Hi, I'm TireDrop's AI assistant. Ask me about tire sizes, free shipping, installation or our hours, and I'll answer from what's on this site. For anything I can't confirm, I'll point you to the shop.",
    welcomeFine: "Please don't share card numbers or other private details here.",
    chipsLabel: "Suggested questions",
    chips: [
      "How do I find my tire size?",
      "Is shipping free?",
      "How much is installation?",
      "What are your hours?",
    ],
    inputLabel: "Your message",
    placeholder: "Type your question",
    send: "Send",
    sending: "Sending",
    typing: "TireDrop assistant is typing",
    you: "You said",
    bot: "TireDrop assistant said",
    sources: "From these pages",
    count: (n) => `${n} of ${MAX_CHARS}`,
    callBtn: `Call ${BUSINESS.phone}`,
    contact: "Contact us",
    handoffNote: "A person at the shop can confirm this.",
    error: `I couldn't get an answer just now. Please call the shop at ${BUSINESS.phone}, or send us a message.`,
    rate: "You're sending messages quickly. Please wait a moment and try again, or call the shop.",
    reset: "Start over",
    foot: "AI answers can be wrong. Confirm size, price and fit with the shop before you order.",
  },
  es: {
    launcher: "Pregunta a TireDrop",
    launcherLabel: "Pregunta a TireDrop: chatea con nuestro asistente de IA",
    title: "Pregunta a TireDrop",
    sub: "Asistente de IA. Responde con lo que dice este sitio.",
    close: "Cerrar chat",
    welcome:
      "Hola, soy el asistente de IA de TireDrop. Pregúntame por medidas de llantas, envío gratis, instalación u horarios, y respondo con lo que dice este sitio. Si no puedo confirmar algo, te envío a la tienda.",
    welcomeFine: "Por favor no compartas números de tarjeta ni otros datos privados aquí.",
    chipsLabel: "Preguntas sugeridas",
    chips: [
      "¿Cómo encuentro la medida de mi llanta?",
      "¿El envío es gratis?",
      "¿Cuánto cuesta la instalación?",
      "¿Cuál es su horario?",
    ],
    inputLabel: "Tu mensaje",
    placeholder: "Escribe tu pregunta",
    send: "Enviar",
    sending: "Enviando",
    typing: "El asistente de TireDrop está escribiendo",
    you: "Tú dijiste",
    bot: "El asistente de TireDrop dijo",
    sources: "De estas páginas",
    count: (n) => `${n} de ${MAX_CHARS}`,
    callBtn: `Llamar ${BUSINESS.phone}`,
    contact: "Contáctanos",
    handoffNote: "Una persona en la tienda puede confirmarlo.",
    error: `No pude obtener una respuesta ahora. Llama a la tienda al ${BUSINESS.phone} o envíanos un mensaje.`,
    rate: "Estás enviando mensajes muy rápido. Espera un momento e inténtalo de nuevo, o llama a la tienda.",
    reset: "Empezar de nuevo",
    foot: "Las respuestas de IA pueden fallar. Confirma medida, precio y compatibilidad con la tienda antes de pedir.",
  },
};

const PHONE_QUERY = "(max-width: 1023px)";
const isPhone = () => typeof window !== "undefined" && window.matchMedia?.(PHONE_QUERY).matches;

function Reply({ text }) {
  return parseReply(text).map((block, i) =>
    block.type === "ul" ? (
      <ul key={i} className="mt-2 list-disc space-y-1 pl-5 first:mt-0">
        {block.items.map((item, j) => (
          <li key={j}>{item}</li>
        ))}
      </ul>
    ) : (
      <p key={i} className="mt-2 first:mt-0">
        {block.text}
      </p>
    ),
  );
}

function HandoffButtons({ t, onClick }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <a
        href={BUSINESS.phoneHref}
        onClick={() => onClick("call")}
        className="btn-primary btn-sm !min-h-[44px] whitespace-nowrap"
      >
        <Phone size={15} aria-hidden />
        {t.callBtn}
      </a>
      <Link
        to="/contact"
        onClick={() => onClick("contact")}
        className="btn-outline btn-sm !min-h-[44px] whitespace-nowrap"
      >
        {t.contact}
      </Link>
    </div>
  );
}

export default function ChatWidget() {
  const { pathname } = useLocation();
  const status = useApiStatus();
  const t = COPY[pageLanguage(pathname) === "es" ? "es" : "en"];
  const titleId = useId();
  const counterId = useId();

  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const loaded = useRef(false);
  const panelRef = useRef(null);
  const launcherRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const wasOpen = useRef(false);

  // The saved conversation is read after hydration, never during render, so
  // the server HTML and the first client render are the same.
  useEffect(() => {
    setHistory(loadHistory());
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (loaded.current) saveHistory(history);
  }, [history]);

  const hidden = isChatHidden(pathname);

  const close = useCallback(() => setOpen(false), []);

  // Focus: into the message box on open, back to the button on close.
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      inputRef.current?.focus({ preventScroll: true });
    } else if (wasOpen.current) {
      wasOpen.current = false;
      launcherRef.current?.focus({ preventScroll: true });
    }
  }, [open]);

  // A full-screen sheet on a phone: the page behind it does not scroll.
  useEffect(() => {
    if (!open || !isPhone()) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Newest message in view: a reply from its first line (a long one should
  // not open scrolled to its tail), anything else at the bottom.
  useEffect(() => {
    const el = listRef.current;
    if (!open || !el) return;
    const last = history[history.length - 1];
    const reply = last?.role === "assistant" && !sending ? el.querySelector("[data-last-reply]") : null;
    el.scrollTop = reply ? Math.max(0, reply.offsetTop - 12) : el.scrollHeight;
  }, [open, history, sending]);

  // After a reply the message box takes focus back, unless the visitor moved
  // on to a link or button in the panel.
  useEffect(() => {
    if (open && !sending && (document.activeElement === document.body || !panelRef.current?.contains(document.activeElement))) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [sending, open]);

  // The widget goes away on cart and checkout; its panel with it.
  useEffect(() => {
    if (hidden) setOpen(false);
  }, [hidden]);

  // Only once the server says the AI is connected (ANTHROPIC_API_KEY set).
  if (hidden || status?.chat !== "on") return null;

  const openPanel = () => {
    setOpen(true);
    trackEvent("chat_open");
  };

  const submit = async (text) => {
    const content = text.trim().slice(0, MAX_CHARS);
    if (!content || sending) return;
    const next = [...history, { role: "user", content }];
    setHistory(next);
    setDraft("");
    setSending(true);
    trackEvent("chat_message");
    try {
      const out = await sendChat(next, pathname);
      setHistory((h) => [
        ...h,
        { role: "assistant", content: out.reply, sources: out.sources, handoff: out.handoff },
      ]);
    } catch (err) {
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content: err?.status === 429 ? t.rate : t.error,
          handoff: err?.handoff !== false,
          error: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      return;
    }
    trapTab(event, panelRef.current);
  };

  const onInputKey = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit(draft);
    }
  };

  const onSource = () => {
    if (isPhone()) close();
  };
  const onHandoff = (method) => trackEvent("chat_handoff_click", { method });

  const empty = history.length === 0;
  const left = MAX_CHARS - draft.length;

  // Clear of the phone call bar, the compare tray and a product page's buy
  // bar (--call-bar-h is already 0 there, App.jsx). Class names are written
  // out whole so Tailwind finds them.
  const lift = isProductPath(pathname)
    ? "bottom-[calc(var(--call-bar-h)+var(--compare-tray-h)+env(safe-area-inset-bottom)+4.5rem+0.75rem)]"
    : "bottom-[calc(var(--call-bar-h)+var(--compare-tray-h)+env(safe-area-inset-bottom)+0.75rem)]";

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={open ? close : openPanel}
        aria-label={t.launcherLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`${lift} fixed right-3 z-40 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-drop px-5 font-display text-[15px] font-bold text-bone shadow-glow transition-colors hover:bg-dive lg:bottom-[calc(var(--compare-tray-h)+1.25rem)] lg:right-5 ${
          open ? "max-lg:invisible" : ""
        }`}
      >
        <MessageCircle size={20} aria-hidden />
        {t.launcher}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-bone text-ink lg:inset-auto lg:bottom-[calc(var(--compare-tray-h)+5.25rem)] lg:right-5 lg:h-[min(36rem,calc(100vh-7.5rem))] lg:w-[24rem] lg:rounded-card lg:shadow-lift lg:ring-1 lg:ring-ink/10"
        >
          <div className="flex items-center gap-3 bg-ink px-4 py-3 text-bone" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-drop" aria-hidden>
              <MessageCircle size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="font-display text-[16px] font-bold leading-tight">
                {t.title}
              </h2>
              <p className="text-[12px] leading-snug text-bone/75">{t.sub}</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label={t.close}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-bone/80 hover:bg-graphite hover:text-bone focus-visible:ring-offset-ink"
            >
              <X size={20} aria-hidden />
            </button>
          </div>

          <div
            ref={listRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            tabIndex={0}
            aria-label={t.title}
            className="relative min-h-0 flex-1 space-y-3 overflow-y-auto bg-fog px-4 py-4 text-[15px] leading-relaxed"
          >
            <div className="max-w-[92%] rounded-card rounded-tl-sm bg-bone p-3 shadow-card">
              <p>{t.welcome}</p>
              <p className="mt-2 text-[13px] text-smoke">{t.welcomeFine}</p>
            </div>

            {history.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[88%] whitespace-pre-wrap break-words rounded-card rounded-tr-sm bg-drop px-3 py-2 text-bone">
                    <span className="sr-only">{t.you}: </span>
                    {m.content}
                  </p>
                </div>
              ) : (
                <div key={i} data-last-reply={i === history.length - 1 ? "" : undefined} className="max-w-[92%] break-words rounded-card rounded-tl-sm bg-bone p-3 shadow-card">
                  <span className="sr-only">{t.bot}: </span>
                  <Reply text={m.content} />
                  {m.sources?.length > 0 && (
                    <div className="mt-3 border-t border-ink/10 pt-2">
                      <p className="text-[12px] font-semibold text-smoke">{t.sources}</p>
                      <ul className="mt-1 flex flex-col gap-1">
                        {m.sources.map((s) => (
                          <li key={s.path}>
                            <Link
                              to={s.path}
                              onClick={onSource}
                              className="inline-flex min-h-[32px] items-center text-[14px] font-semibold text-drop underline underline-offset-2 hover:text-dive"
                            >
                              {s.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {m.handoff && (
                    <>
                      {!m.error && <p className="mt-3 text-[13px] text-smoke">{t.handoffNote}</p>}
                      <HandoffButtons t={t} onClick={onHandoff} />
                    </>
                  )}
                </div>
              ),
            )}

            {sending && (
              <div className="inline-flex items-center gap-2 rounded-card rounded-tl-sm bg-bone px-3 py-3 shadow-card">
                <span className="sr-only">{t.typing}</span>
                <span aria-hidden className="flex gap-1">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-2 w-2 rounded-full bg-smoke motion-safe:animate-pulse"
                      style={{ animationDelay: `${d * 180}ms` }}
                    />
                  ))}
                </span>
              </div>
            )}

            {empty && !sending && (
              <div role="group" aria-label={t.chipsLabel} className="flex flex-wrap gap-2 pt-1">
                {t.chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => submit(chip)}
                    className="min-h-[44px] rounded-full border border-drop/40 bg-bone px-4 text-left text-[14px] font-semibold text-drop hover:border-drop hover:bg-sky"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit(draft);
            }}
            className="border-t border-ink/10 bg-bone px-3 pt-3"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <label htmlFor={`${titleId}-msg`} className="sr-only">
                  {t.inputLabel}
                </label>
                <textarea
                  id={`${titleId}-msg`}
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
                  onKeyDown={onInputKey}
                  disabled={sending}
                  rows={2}
                  maxLength={MAX_CHARS}
                  placeholder={t.placeholder}
                  aria-describedby={counterId}
                  className="block max-h-32 min-h-[48px] w-full resize-none rounded-sm border border-ink/25 bg-bone px-3 py-2 text-[16px] leading-snug text-ink placeholder:text-smoke disabled:bg-fog md:text-[15px]"
                />
              </div>
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="btn-primary !min-h-[48px] shrink-0 px-4"
              >
                {sending ? <Loader2 size={17} aria-hidden className="motion-safe:animate-spin" /> : <Send size={17} aria-hidden />}
                {sending ? t.sending : t.send}
              </button>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3">
              {history.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setHistory([]);
                    inputRef.current?.focus();
                  }}
                  disabled={sending}
                  className="min-h-[32px] rounded-sm text-[13px] font-semibold text-drop underline underline-offset-2 hover:text-dive disabled:opacity-50"
                >
                  {t.reset}
                </button>
              ) : (
                <span />
              )}
              <p id={counterId} className={`tnum text-right text-[12px] ${left <= 100 ? "font-semibold text-amberInk" : "text-smoke"}`}>
                {t.count(draft.length)}
              </p>
            </div>
            <p className="mt-1 text-[12px] leading-snug text-smoke">{t.foot}</p>
          </form>
        </div>
      )}
    </>
  );
}
