// The browser side of the site chatbot: the wire format, and nothing with a
// DOM, so `node --test src/components/chat/chatClient.test.mjs` runs it in
// plain Node. The widget that uses it is ChatWidget.jsx; the server is
// api/_lib/chat.js (POST /api/chat).
//
// Wire format (fixed by the shared contract):
//   request   { messages: [{ role: "user" | "assistant", content }], page }
//             at most 12 messages, each content at most 800 characters, the
//             last one from the user
//   200       { reply, sources: [{ title, path }] (max 3), handoff, mode }
//   400/429   { error }            503  { error, handoff: true }

export const MAX_MESSAGES = 12;
export const MAX_CHARS = 800;
export const ENDPOINT = "/api/chat";
export const REQUEST_TIMEOUT_MS = 25000; // the server gives up at 20s
export const STORAGE_KEY = "td-chat";
const STORED_MESSAGES = 30;

/**
 * Pages that never show the widget: paying (the cart and checkout have
 * nothing to ask but a phone call, which their own bar offers) and any
 * full-screen concept route (none exist today; the pattern keeps a future
 * scroll-story page clear of a floating button).
 */
const HIDDEN = /^\/(?:checkout|cart|scroll-story|scrollstory|concepts?)(?:\/|$)/;
export const isChatHidden = (pathname = "/") => HIDDEN.test(pathname);

/** Cuts text to `max` characters on a word boundary, adding an ellipsis. */
export function clip(text, max = MAX_CHARS) {
  const t = String(text ?? "").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/**
 * The conversation as the API wants it. Local-only bubbles (errors) are left
 * out, assistant replies longer than the API's limit are clipped, the list is
 * cut to the newest MAX_MESSAGES, and it must start and end with the visitor.
 */
export function buildRequestMessages(history = []) {
  const clean = history
    .filter(
      (m) =>
        m &&
        !m.error &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim(),
    )
    .map((m) => ({ role: m.role, content: clip(m.content) }));
  let out = clean.slice(-MAX_MESSAGES);
  while (out.length && out[0].role !== "user") out = out.slice(1);
  while (out.length && out[out.length - 1].role !== "user") out = out.slice(0, -1);
  return out;
}

/** Real site paths only: one leading slash, no scheme, no protocol-relative. */
export function normalizeSources(sources) {
  if (!Array.isArray(sources)) return [];
  const seen = new Set();
  const out = [];
  for (const s of sources) {
    const path = typeof s?.path === "string" ? s.path.trim() : "";
    if (!/^\/(?!\/)[^\s\\]*$/.test(path) || seen.has(path)) continue;
    seen.add(path);
    const title = typeof s.title === "string" && s.title.trim() ? s.title.trim().slice(0, 120) : path;
    out.push({ title, path });
    if (out.length === 3) break;
  }
  return out;
}

export class ChatError extends Error {
  constructor(message, { status = 0, handoff = true } = {}) {
    super(message);
    this.name = "ChatError";
    this.status = status;
    this.handoff = handoff;
  }
}

/**
 * Sends the conversation and returns `{ reply, sources, handoff, mode }`.
 * Any failure throws a ChatError (status 0 for network trouble or timeout);
 * the widget turns that into the error bubble with the phone number.
 * `fetchImpl` is injectable so tests need no network.
 */
export async function sendChat(history, page, fetchImpl = globalThis.fetch, { timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  const messages = buildRequestMessages(history);
  if (!messages.length) throw new ChatError("Nothing to send.", { status: 400, handoff: false });
  const body = { messages };
  if (typeof page === "string" && page.startsWith("/")) body.page = page.slice(0, 200);

  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    let res;
    try {
      res = await fetchImpl(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller?.signal,
      });
    } catch {
      throw new ChatError("network", { status: 0 });
    }
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* not JSON: handled below */
    }
    if (!res.ok) {
      throw new ChatError(typeof data?.error === "string" ? data.error : "error", {
        status: res.status,
        handoff: res.status === 400 || res.status === 429 ? Boolean(data?.handoff) : true,
      });
    }
    if (!data || typeof data.reply !== "string" || !data.reply.trim()) {
      throw new ChatError("bad response", { status: res.status });
    }
    return {
      reply: data.reply.trim(),
      sources: normalizeSources(data.sources),
      handoff: data.handoff === true,
      mode: data.mode === "standin" ? "standin" : "live",
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * A reply as blocks to render without innerHTML: paragraphs separated by a
 * blank line, and runs of "- " lines as bullet lists. Markdown emphasis
 * markers and heading hashes are dropped (the bot is told not to send them).
 */
export function parseReply(text) {
  const blocks = [];
  let list = null;
  let para = [];
  const flushPara = () => {
    if (para.length) blocks.push({ type: "p", text: para.join(" ") });
    para = [];
  };
  for (const raw of String(text ?? "").replace(/\r/g, "").split("\n")) {
    const line = raw.replace(/\*\*|__/g, "").replace(/^#{1,6}\s+/, "").trim();
    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    if (bullet) {
      flushPara();
      if (!list) {
        list = { type: "ul", items: [] };
        blocks.push(list);
      }
      list.items.push(bullet[1]);
    } else if (!line) {
      flushPara();
      list = null;
    } else {
      list = null;
      para.push(line);
    }
  }
  flushPara();
  return blocks;
}

/** What was saved for this tab, or []. Never throws (storage can be blocked). */
export function loadHistory(storage = safeStorage()) {
  try {
    const saved = JSON.parse(storage?.getItem(STORAGE_KEY) ?? "null");
    if (!Array.isArray(saved)) return [];
    return saved
      .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string")
      .slice(-STORED_MESSAGES)
      .map((m) => ({
        role: m.role,
        content: m.content.slice(0, 4000),
        sources: m.role === "assistant" ? normalizeSources(m.sources) : undefined,
        handoff: m.role === "assistant" && m.handoff === true,
        error: m.error === true,
      }));
  } catch {
    return [];
  }
}

export function saveHistory(history, storage = safeStorage()) {
  try {
    if (!storage) return;
    if (!history.length) storage.removeItem(STORAGE_KEY);
    else storage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-STORED_MESSAGES)));
  } catch {
    /* private window or blocked storage: the chat just will not survive a reload */
  }
}

function safeStorage() {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}
