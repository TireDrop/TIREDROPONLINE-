/**
 * Page translation: the parts with no React and no DOM of their own, so
 * `npm run test:lib` can run them in plain Node. The control that uses them is
 * src/components/layout/LanguageControl.jsx.
 *
 * Two ways to translate a page, tried in this order:
 *
 *   1. ELEMENT. Google's website translator (translate_a/element.js and
 *      google.translate.TranslateElement), loaded only once a visitor opens
 *      the Language control. It translates in place, so the cart, forms and
 *      checkout keep working on tiredroponline.com.
 *   2. URL. https://translate.google.com/translate?sl=en&tl=<code>&u=<url>,
 *      which serves the page from Google's proxy (<host>.translate.goog).
 *
 * Google retired the website translator widget on 2026-10-01: no longer
 * supported, and it may stop working without notice. So the element is only
 * used if it loads AND visibly translates the page within a few seconds;
 * anything else sends the visitor to the URL instead. Set ELEMENT_ENABLED to
 * false to skip straight to the URL and never load Google's script here.
 */

export const ELEMENT_ENABLED = true;
export const ELEMENT_SRC = "https://translate.google.com/translate_a/element.js";
export const SOURCE_LANG = "en";

/**
 * The language a page is written in: Spanish under /es/ (the native Spanish
 * test pages, src/data/spanishRoutes.js), English everywhere else. The
 * translator must be told, or it would treat Spanish text as English.
 */
export function pageLanguage(pathname) {
  return /^\/es(\/|$)/.test(pathname ?? "") ? "es" : SOURCE_LANG;
}
export const STORAGE_KEY = "td-translate";

/**
 * Where Google's element loads from once it is opened, by CSP directive. The
 * Content-Security-Policy in vercel.json must list each of these
 * (api/_lib/cspReport.test.mjs checks it). element.js comes from
 * translate.google.com and pulls its code and the language list from
 * translate.googleapis.com, its CSS and code from www.gstatic.com, sends text
 * to translate-pa.googleapis.com (or translate.googleapis.com) and pings
 * translate.google.com; its tooltip frames come from either Translate host.
 * Images (icons, cleardot.gif on www.google.com) are covered by img-src https:.
 * The URL fallback is a navigation, which the CSP does not govern.
 */
export const GOOGLE_TRANSLATE_CSP = {
  "script-src": [new URL(ELEMENT_SRC).host, "translate.googleapis.com", "translate-pa.googleapis.com", "www.gstatic.com"],
  "style-src": ["translate.googleapis.com", "www.gstatic.com"],
  "connect-src": ["translate.google.com", "translate.googleapis.com", "translate-pa.googleapis.com"],
  "frame-src": ["translate.google.com", "translate.googleapis.com"],
};

/* ---------------------------------------------------------------------------
 * Languages
 *
 * Every language Google Translate's website tools offered, by the code Google
 * uses for it (note iw for Hebrew, jw for Javanese, tl for Filipino, zh-CN and
 * zh-TW). Names are shown in the language itself first, because someone who
 * cannot read English is looking for "Español", not "Spanish". If the element
 * loads and lists a language that is missing here, the control adds it.
 * ------------------------------------------------------------------------- */

// [code, English name, name in the language itself, right-to-left?]
const RAW = [
  ["af", "Afrikaans", "Afrikaans"],
  ["ak", "Twi", "Twi"],
  ["am", "Amharic", "አማርኛ"],
  ["ar", "Arabic", "العربية", true],
  ["as", "Assamese", "অসমীয়া"],
  ["ay", "Aymara", "Aymar aru"],
  ["az", "Azerbaijani", "Azərbaycanca"],
  ["be", "Belarusian", "Беларуская"],
  ["bg", "Bulgarian", "Български"],
  ["bho", "Bhojpuri", "भोजपुरी"],
  ["bm", "Bambara", "Bamanankan"],
  ["bn", "Bengali", "বাংলা"],
  ["bs", "Bosnian", "Bosanski"],
  ["ca", "Catalan", "Català"],
  ["ceb", "Cebuano", "Cebuano"],
  ["ckb", "Kurdish (Sorani)", "کوردی", true],
  ["co", "Corsican", "Corsu"],
  ["cs", "Czech", "Čeština"],
  ["cy", "Welsh", "Cymraeg"],
  ["da", "Danish", "Dansk"],
  ["de", "German", "Deutsch"],
  ["doi", "Dogri", "डोगरी"],
  ["dv", "Dhivehi", "ދިވެހި", true],
  ["ee", "Ewe", "Eʋegbe"],
  ["el", "Greek", "Ελληνικά"],
  ["eo", "Esperanto", "Esperanto"],
  ["es", "Spanish", "Español"],
  ["et", "Estonian", "Eesti"],
  ["eu", "Basque", "Euskara"],
  ["fa", "Persian", "فارسی", true],
  ["fi", "Finnish", "Suomi"],
  ["fr", "French", "Français"],
  ["fy", "Frisian", "Frysk"],
  ["ga", "Irish", "Gaeilge"],
  ["gd", "Scots Gaelic", "Gàidhlig"],
  ["gl", "Galician", "Galego"],
  ["gn", "Guarani", "Avañe'ẽ"],
  ["gom", "Konkani", "कोंकणी"],
  ["gu", "Gujarati", "ગુજરાતી"],
  ["ha", "Hausa", "Hausa"],
  ["haw", "Hawaiian", "ʻŌlelo Hawaiʻi"],
  ["hi", "Hindi", "हिन्दी"],
  ["hmn", "Hmong", "Hmoob"],
  ["hr", "Croatian", "Hrvatski"],
  ["ht", "Haitian Creole", "Kreyòl ayisyen"],
  ["hu", "Hungarian", "Magyar"],
  ["hy", "Armenian", "Հայերեն"],
  ["id", "Indonesian", "Bahasa Indonesia"],
  ["ig", "Igbo", "Igbo"],
  ["ilo", "Ilocano", "Ilokano"],
  ["is", "Icelandic", "Íslenska"],
  ["it", "Italian", "Italiano"],
  ["iw", "Hebrew", "עברית", true],
  ["ja", "Japanese", "日本語"],
  ["jw", "Javanese", "Basa Jawa"],
  ["ka", "Georgian", "ქართული"],
  ["kk", "Kazakh", "Қазақ тілі"],
  ["km", "Khmer", "ខ្មែរ"],
  ["kn", "Kannada", "ಕನ್ನಡ"],
  ["ko", "Korean", "한국어"],
  ["kri", "Krio", "Krio"],
  ["ku", "Kurdish (Kurmanji)", "Kurdî"],
  ["ky", "Kyrgyz", "Кыргызча"],
  ["la", "Latin", "Latina"],
  ["lb", "Luxembourgish", "Lëtzebuergesch"],
  ["lg", "Luganda", "Luganda"],
  ["ln", "Lingala", "Lingála"],
  ["lo", "Lao", "ລາວ"],
  ["lt", "Lithuanian", "Lietuvių"],
  ["lus", "Mizo", "Mizo ṭawng"],
  ["lv", "Latvian", "Latviešu"],
  ["mai", "Maithili", "मैथिली"],
  ["mg", "Malagasy", "Malagasy"],
  ["mi", "Maori", "Māori"],
  ["mk", "Macedonian", "Македонски"],
  ["ml", "Malayalam", "മലയാളം"],
  ["mn", "Mongolian", "Монгол"],
  ["mni-Mtei", "Meiteilon (Manipuri)", "ꯃꯤꯇꯩꯂꯣꯟ"],
  ["mr", "Marathi", "मराठी"],
  ["ms", "Malay", "Bahasa Melayu"],
  ["mt", "Maltese", "Malti"],
  ["my", "Myanmar (Burmese)", "မြန်မာ"],
  ["ne", "Nepali", "नेपाली"],
  ["nl", "Dutch", "Nederlands"],
  ["no", "Norwegian", "Norsk"],
  ["nso", "Sepedi", "Sesotho sa Leboa"],
  ["ny", "Chichewa", "Chichewa"],
  ["om", "Oromo", "Afaan Oromoo"],
  ["or", "Odia (Oriya)", "ଓଡ଼ିଆ"],
  ["pa", "Punjabi", "ਪੰਜਾਬੀ"],
  ["pl", "Polish", "Polski"],
  ["ps", "Pashto", "پښتو", true],
  ["pt", "Portuguese", "Português"],
  ["qu", "Quechua", "Runasimi"],
  ["ro", "Romanian", "Română"],
  ["ru", "Russian", "Русский"],
  ["rw", "Kinyarwanda", "Ikinyarwanda"],
  ["sa", "Sanskrit", "संस्कृतम्"],
  ["sd", "Sindhi", "سنڌي", true],
  ["si", "Sinhala", "සිංහල"],
  ["sk", "Slovak", "Slovenčina"],
  ["sl", "Slovenian", "Slovenščina"],
  ["sm", "Samoan", "Gagana Sāmoa"],
  ["sn", "Shona", "chiShona"],
  ["so", "Somali", "Soomaali"],
  ["sq", "Albanian", "Shqip"],
  ["sr", "Serbian", "Српски"],
  ["st", "Sesotho", "Sesotho"],
  ["su", "Sundanese", "Basa Sunda"],
  ["sv", "Swedish", "Svenska"],
  ["sw", "Swahili", "Kiswahili"],
  ["ta", "Tamil", "தமிழ்"],
  ["te", "Telugu", "తెలుగు"],
  ["tg", "Tajik", "Тоҷикӣ"],
  ["th", "Thai", "ไทย"],
  ["ti", "Tigrinya", "ትግርኛ"],
  ["tk", "Turkmen", "Türkmençe"],
  ["tl", "Filipino", "Filipino"],
  ["tr", "Turkish", "Türkçe"],
  ["ts", "Tsonga", "Xitsonga"],
  ["tt", "Tatar", "Татарча"],
  ["ug", "Uyghur", "ئۇيغۇرچە", true],
  ["uk", "Ukrainian", "Українська"],
  ["ur", "Urdu", "اردو", true],
  ["uz", "Uzbek", "Oʻzbekcha"],
  ["vi", "Vietnamese", "Tiếng Việt"],
  ["xh", "Xhosa", "isiXhosa"],
  ["yi", "Yiddish", "ייִדיש", true],
  ["yo", "Yoruba", "Yorùbá"],
  ["zh-CN", "Chinese (Simplified)", "简体中文"],
  ["zh-TW", "Chinese (Traditional)", "繁體中文"],
  ["zu", "Zulu", "isiZulu"],
];

/** `{ code, english, native, rtl }` for every language, sorted by English name. */
export const LANGUAGES = RAW.map(([code, english, native, rtl = false]) => ({
  code,
  english,
  native,
  rtl,
})).sort((a, b) => a.english.localeCompare(b.english, "en"));

/** The languages most asked for in South Florida, pinned to the top in this order. */
export const PINNED_CODES = ["es", "pt", "ht", "ru", "fr"];

const BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]));

export const PINNED = PINNED_CODES.map((code) => BY_CODE.get(code));

/** Every language that is not pinned, sorted by English name. */
export const OTHER_LANGUAGES = LANGUAGES.filter(
  (l) => !PINNED_CODES.includes(l.code),
);

export function languageFor(code) {
  return BY_CODE.get(code) ?? null;
}

/** "Español (Spanish)"; just the one name when the two are the same. */
export function languageLabel(lang) {
  if (!lang) return "";
  return lang.native === lang.english
    ? lang.native
    : `${lang.native} (${lang.english})`;
}

// Shape of a Google language code: es, haw, zh-CN, mni-Mtei. Anything else
// never reaches a URL or a cookie.
const CODE_SHAPE = /^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/;

/** True for a code this site can ask Google for (never for English itself). */
export function isValidCode(code) {
  return (
    typeof code === "string" && CODE_SHAPE.test(code) && code !== SOURCE_LANG
  );
}

/**
 * Merges languages Google's element reports (its `<select>` options, as
 * `{ value, text }`) into the list, so a language Google adds later is still
 * offered. Known codes keep their entry; unknown ones get Google's name.
 */
export function mergeGoogleLanguages(options, base = LANGUAGES) {
  const known = new Set(base.map((l) => l.code));
  const extra = [];
  for (const { value, text } of options ?? []) {
    if (!isValidCode(value) || known.has(value) || !text) continue;
    known.add(value);
    extra.push({ code: value, english: text, native: text, rtl: false });
  }
  if (!extra.length) return base;
  return [...base, ...extra].sort((a, b) =>
    a.english.localeCompare(b.english, "en"),
  );
}

/* ---------------------------------------------------------------------------
 * Google's translation proxy
 *
 * translate.google.com/translate?…&u=<url> redirects to the same page on
 * <host with . as - and - as -->.translate.goog, with _x_tr_* parameters
 * saying which language. The site's own code runs there too, so it has to
 * know it is on the proxy, which language is showing, and the way back.
 * ------------------------------------------------------------------------- */

export const PROXY_SUFFIX = ".translate.goog";

export function isProxyHost(hostname) {
  return typeof hostname === "string" && hostname.endsWith(PROXY_SUFFIX);
}

/** tiredroponline-com.translate.goog → tiredroponline.com */
export function originalHost(proxyHost) {
  if (!isProxyHost(proxyHost)) return proxyHost;
  const label = proxyHost.slice(0, -PROXY_SUFFIX.length);
  return label
    .split("--")
    .map((part) => part.replace(/-/g, "."))
    .join("-");
}

/** The page's own URL: off the proxy, without Google's _x_tr_* parameters. */
export function originalUrl(href) {
  const url = new URL(href);
  if (isProxyHost(url.hostname)) {
    url.hostname = originalHost(url.hostname);
    url.protocol = "https:";
    url.port = "";
  }
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith("_x_tr_")) url.searchParams.delete(key);
  }
  return url.toString();
}

/** The language the proxy is showing (from _x_tr_tl), or null. */
export function proxyLanguage(href) {
  try {
    const url = new URL(href);
    if (!isProxyHost(url.hostname)) return null;
    const code = url.searchParams.get("_x_tr_tl");
    return isValidCode(code) ? code : null;
  } catch {
    return null;
  }
}

/**
 * The fallback: this page through Google Translate's URL,
 *   https://translate.google.com/translate?sl=en&tl=<code>&hl=<code>&u=<url>
 * `hl` puts Google's own toolbar in the same language. Works from the proxy
 * too (it unwraps to the original page first). Throws on a code that is not
 * a language code, so nothing odd is ever put in the URL.
 */
export function buildFallbackUrl(code, pageHref) {
  if (!isValidCode(code)) throw new Error(`Not a language code: ${code}`);
  const original = originalUrl(pageHref);
  const params = new URLSearchParams({
    sl: pageLanguage(new URL(original).pathname),
    tl: code,
    hl: code,
    u: original,
  });
  return `https://translate.google.com/translate?${params}`;
}

/* ---------------------------------------------------------------------------
 * Google's element remembers the language in a cookie, googtrans=/en/<code>,
 * set on the host and on the parent domain. Clearing it means clearing every
 * variant it may have been written under.
 * ------------------------------------------------------------------------- */

export const googtransValue = (code, source = SOURCE_LANG) => `/${source}/${code}`;

/** Domain attributes to clear googtrans under: none, the host, and each parent. */
export function cookieDomains(hostname) {
  const out = [null];
  if (!hostname || /^[\d.]+$/.test(hostname) || !hostname.includes(".")) {
    if (hostname) out.push(hostname);
    return out;
  }
  const labels = hostname.split(".");
  for (let i = 0; i < labels.length - 1; i += 1) {
    const domain = labels.slice(i).join(".");
    out.push(domain, `.${domain}`);
  }
  return out;
}

/* ---------------------------------------------------------------------------
 * Text that must never be translated
 *
 * Prices, the phone number, the address, the email, brand names, tire sizes,
 * load/speed codes and SKU or order numbers. The shared components mark
 * theirs with translate="no" and class="notranslate"; while a translation is
 * on, the control also marks any element whose whole text is one of these,
 * which covers the cart, checkout and product pages without editing them.
 * ------------------------------------------------------------------------- */

const PROTECTED_PATTERNS = [
  // Prices: $95, $1,234.56, +$25.00, ($10.00)
  /^\(?[+\-−]?\s?\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\)?$/,
  // Tire sizes, optionally with load/speed: 225/45R17, P235/65R16, 225/45ZR17 94W,
  // LT275/70R18 125/122S
  /^(?:P|LT|ST|T)?\d{3}\/\d{2}(?:Z?R|-|D|B)\d{2}(?:\.5)?(?:\s*[·•]?\s*\d{2,3}(?:\/\d{2,3})?\s?[A-Z]{1,2})?(?:\s?(?:XL|SL|RF|LT))?$/,
  // Flotation sizes and wheel sizes: 31x10.50R15, 33x12.50R20LT, 18x8.5, 20x9
  /^\d{2}(?:\.\d)?x\d{1,2}(?:\.\d{1,2})?(?:R\d{2}(?:\.5)?(?:LT)?)?$/i,
  // Load index + speed rating on their own: 94W, 121/118S, 98H XL
  /^\d{2,3}(?:\/\d{2,3})?\s?[A-Z]{1,2}(?:\s?XL)?$/,
  // Order and request numbers: #1001, TD-260929-ABC234
  /^#\d{3,}$/,
  /^TD-[A-Z0-9-]{4,}$/,
  // SKUs: all-caps letters/digits with dashes, or a long run of digits
  /^(?=[A-Z0-9-]*\d)[A-Z0-9]{2,}(?:-[A-Z0-9]+)+$/,
  /^\d{5,}$/,
  // US phone numbers: (954) 773-1896, 954-773-1896, +1 954 773 1896
  /^(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
  // Email addresses
  /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i,
];

const collapse = (text) => String(text ?? "").replace(/\s+/g, " ").trim();

/**
 * True when `text`, as a whole, is something not to translate. `exact` adds
 * literal strings, e.g. the business name, the street address and the tire
 * brand names. A sentence that merely contains a price is not matched: its
 * words still need translating.
 */
export function isProtectedText(text, exact = []) {
  const t = collapse(text);
  if (!t || t.length > 80) return false;
  for (const value of exact) {
    if (value && collapse(value).toLowerCase() === t.toLowerCase()) return true;
  }
  return PROTECTED_PATTERNS.some((re) => re.test(t));
}

/* ---------------------------------------------------------------------------
 * React safety
 *
 * A translator replaces the page's text nodes with its own (Google wraps each
 * in <font> elements). React still holds the originals, so the next time it
 * removes or inserts next to one of them the browser throws
 * "Failed to execute 'removeChild' on 'Node'" (or 'insertBefore') and the app
 * unmounts. The guard below, the one suggested in facebook/react#11538, turns
 * those two calls into a warning when the node React means is no longer where
 * React thinks it is. It changes nothing for a call that would have
 * succeeded, so it is only installed once a translation is on: when the
 * visitor picks a language, when the page is being served by Google's proxy,
 * or when the browser's own translator marks <html> as translated.
 * ------------------------------------------------------------------------- */

const GUARDED = Symbol.for("tiredrop.translateGuard");

/** Patches NodeCtor.prototype once. Returns true if it did so on this call. */
export function installDomGuard(NodeCtor = globalThis.Node, log = console) {
  const proto = NodeCtor?.prototype;
  if (!proto || proto[GUARDED]) return false;

  const removeChild = proto.removeChild;
  proto.removeChild = function guardedRemoveChild(child) {
    if (child && child.parentNode !== this) {
      log?.warn?.(
        "[translate] removeChild skipped: the node has a different parent (page translated).",
        child,
        this,
      );
      return child;
    }
    return removeChild.apply(this, arguments);
  };

  const insertBefore = proto.insertBefore;
  proto.insertBefore = function guardedInsertBefore(newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      log?.warn?.(
        "[translate] insertBefore skipped: the reference node has a different parent (page translated).",
        referenceNode,
        this,
      );
      return newNode;
    }
    return insertBefore.apply(this, arguments);
  };

  Object.defineProperty(proto, GUARDED, { value: true });
  return true;
}

export function isDomGuardInstalled(NodeCtor = globalThis.Node) {
  return Boolean(NodeCtor?.prototype?.[GUARDED]);
}

/* ---------------------------------------------------------------------------
 * CSS that keeps Google's injected banner and hover tooltips from moving or
 * covering the page. Added to <head> only once a translation is on.
 * ------------------------------------------------------------------------- */

export const HIDE_GOOGLE_CHROME_CSS = `
.goog-te-banner-frame, .goog-te-banner-frame.skiptranslate,
.skiptranslate iframe, iframe.skiptranslate,
#goog-gt-tt, .goog-te-balloon-frame, .goog-tooltip, .goog-tooltip:hover,
.VIpgJd-ZVi9od-ORHb-OEVmcd, .VIpgJd-ZVi9od-aZ2wEe-wOHMyf, .VIpgJd-yAWNEb-L7lbkb {
  display: none !important;
  visibility: hidden !important;
}
body { top: 0 !important; }
.goog-text-highlight { background: none !important; box-shadow: none !important; }
#td-gt-element { display: none !important; }
`;
