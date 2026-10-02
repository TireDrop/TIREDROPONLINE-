// The sources rule, in one place. Justin's rule: "no other meta tags or links
// to other competitors, only resources." TireDrop cites tire and wheel MAKERS,
// regulators (NHTSA, eCFR, state agencies), trade bodies (USTMA, TIA), AAA,
// Consumer Reports and trade press. It never links to, cites or names another
// tire/wheel retailer or installer.
//
// Imported by scripts/sources-check.mjs (the built site, `npm run
// check:sources`) and src/sourcesRule.test.mjs (the source tree, `npm run
// test:sources`). Node-free on purpose so both can use it, but nothing in the
// app imports it: this file is the only place the names may appear.
//
// To extend: add the retailer's domain to COMPETITOR_DOMAINS (subdomains are
// covered automatically) and its trading name to COMPETITOR_NAMES.

/** Retailers and installers. A host matches the domain or any subdomain of it. */
export const COMPETITOR_DOMAINS = [
  "tirerack.com",
  "discounttire.com",
  "discounttiredirect.com",
  "americastire.com",
  "firestonecompleteautocare.com",
  "pepboys.com",
  "lesschwab.com",
  "costco.com",
  "costcotireservice.com",
  "walmart.com",
  "samsclub.com",
  "ntb.com",
  "mavistire.com",
  "bigotires.com",
  "simpletire.com",
  "prioritytire.com",
  "prioritytires.com",
  "tirebuyer.com",
  "amazon.com",
  "ebay.com",
  "goodyearautoservice.com",
  "tiresplus.com",
  "monro.com",
  "belletire.com",
  "tirekingdom.com",
  // Tesla the carmaker (tesla.com) is a resource; its shop is a parts retailer.
  "shop.tesla.com",
  "jiffylube.com",
  "midas.com",
  "meineke.com",
  "townfair.com",
  "carid.com",
  "customwheeloffset.com",
  "fitmentindustries.com",
  "4wheelparts.com",
  "realtruck.com",
];

/**
 * Trading names, matched case-insensitively on word boundaries, with ' or ’.
 * Makers are allowed: "Firestone" alone is the tire maker, only "Firestone
 * Complete Auto Care" (the store chain) is denied. "Monroe" (the county) is
 * not "Monro". "Amazon" is denied everywhere: no content needs the river.
 * `caseSensitive` is for names that are also everyday phrases ("4 tires plus
 * installation"), so only the capitalized brand is caught.
 */
export const COMPETITOR_NAMES = [
  "Tire Rack",
  "Discount Tire",
  "America's Tire",
  "Firestone Complete Auto Care",
  "Pep Boys",
  "Les Schwab",
  "Costco",
  "Walmart",
  "Sam's Club",
  "NTB",
  "Mavis",
  "Big O Tires",
  "SimpleTire",
  "Priority Tire",
  "TireBuyer",
  "Amazon",
  { name: "Tires Plus", caseSensitive: true },
  "Belle Tire",
  "Tire Kingdom",
  "CARiD",
  "Custom Offsets",
  "Fitment Industries",
];

/**
 * Known resources: external hosts that are fine to link. A host outside both
 * lists is reported as UNREVIEWED (a warning for a human, not a failure).
 * Strings match the domain and its subdomains; RegExps match the whole host.
 */
export const RESOURCE_DOMAINS = [
  // Government: federal and state (.gov), plus state sites off .gov
  /(^|\.)gov$/,
  "floridadisaster.org",
  "cleanairforce.com", // Georgia's state vehicle-emissions program
  "floridasturnpike.com", // Florida's Turnpike Enterprise, part of FDOT (service plazas, Road Rangers)
  "browardschools.com", // Broward County Public Schools, the county school district (calendar)
  // Safety, standards and trade bodies, consumer and motoring groups
  "ustires.org",
  "tireindustry.org",
  "aaa.com",
  "consumerreports.org",
  "nicb.org",
  "law.justia.com",
  // Climate and weather research (state climate offices, NOAA partners)
  "statesummaries.ncics.org",
  "climate.ncsu.edu",
  "climate.colostate.edu",
  // Trade press
  "tirereview.com",
  "moderntiredealer.com",
  // Tire, wheel and vehicle makers
  "michelinman.com",
  /(^|\.)bridgestone[a-z-]*\.com$/,
  "goodyear.com",
  /(^|\.)continental[a-z-]*\.com$/,
  "pirelli.com",
  "toyotires.com",
  "yokohamatire.com",
  "coopertire.com",
  "hankooktire.com",
  "bfgoodrichtires.com",
  "firestonetire.com",
  "mickeythompsontires.com",
  "konigwheels.com",
  "methodracewheels.com",
  "wheelpros.com",
  "tesla.com",
  "subaru.com",
  "toyota.com",
  "honda.com",
  "ford.com",
  "chevrolet.com",
  "mopar.com", // Jeep/Stellantis owner's manuals and Mopar's own tire guides (store.mopar.com is never cited)
  // Own properties, listings and site infrastructure
  "tiredroponline.com",
  "yelp.com",
  "google.com",
  "googletagmanager.com",
  "facebook.com",
  /^fonts\.[a-z.]+$/,
  "sitemaps.org",
];

const matchesDomain = (host, entry) =>
  entry instanceof RegExp ? entry.test(host) : host === entry || host.endsWith(`.${entry}`);

/** "WWW.TireRack.com." -> "www.tirerack.com" ("" for nothing usable). */
export function normalizeHost(host) {
  return String(host ?? "").trim().toLowerCase().replace(/\.+$/, "");
}

/** The host of an absolute or protocol-relative URL, or "" for a relative one. */
export function hostOf(url) {
  const m = /^\s*(?:[a-z][a-z0-9+.-]*:)?\/\/(?:[^/?#\s@]*@)?([^/?#\s:\\]+)/i.exec(String(url ?? ""));
  return m ? normalizeHost(m[1]) : "";
}

export function isCompetitorHost(host) {
  const h = normalizeHost(host);
  return h !== "" && COMPETITOR_DOMAINS.some((d) => matchesDomain(h, d));
}

export function isResourceHost(host) {
  const h = normalizeHost(host);
  return h !== "" && !isCompetitorHost(h) && RESOURCE_DOMAINS.some((d) => matchesDomain(h, d));
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const NAME_PATTERNS = COMPETITOR_NAMES.map((entry) => {
  const { name, caseSensitive = false } = typeof entry === "string" ? { name: entry } : entry;
  const body = escapeRe(name).replace(/'/g, "['’]").replace(/ /g, "[\\s\\u00a0]+");
  // Letters/digits on either side mean a longer word: "Mavis" is not "Mavisa".
  return { name, re: new RegExp(`(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, `gu${caseSensitive ? "" : "i"}`) };
});

/** Every competitor name in `text`: [{ name, match, index }] in text order. */
export function findCompetitorNames(text) {
  const s = String(text ?? "");
  const hits = [];
  for (const { name, re } of NAME_PATTERNS) {
    for (const m of s.matchAll(re)) hits.push({ name, match: m[0], index: m.index });
  }
  return hits.sort((a, b) => a.index - b.index);
}

// A bare hostname in prose or code: "tirerack.com", "www.ebay.com/…".
const HOST_TOKEN = /(?<![\p{L}\p{N}._-])(?:[a-z0-9-]+\.)+[a-z]{2,}(?![\p{L}\p{N}_-])/giu;

/** Every competitor host written anywhere in `text`, with or without a scheme. */
export function findCompetitorHosts(text) {
  const hits = [];
  for (const m of String(text ?? "").matchAll(HOST_TOKEN)) {
    const host = normalizeHost(m[0]);
    if (isCompetitorHost(host)) hits.push({ host, index: m.index });
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Page scanning, for the built HTML. Regex-based on purpose: no parser
// dependency, and the prerendered markup is React's, so it is well formed.

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", ndash: "–", mdash: "—", hellip: "…" };
export function decodeEntities(s) {
  return String(s ?? "").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, e) => {
    if (e[0] === "#") {
      const cp = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) && cp <= 0x10ffff ? String.fromCodePoint(cp) : all;
    }
    return ENTITIES[e.toLowerCase()] ?? all;
  });
}

const TAG_RE = /<([a-zA-Z][\w:-]*)((?:\s+[^\s"'<>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/g;
const ATTR_RE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
const URL_ATTRS = new Set(["href", "src", "action", "poster", "srcset", "data", "formaction", "cite"]);
const LINK_ATTRS = new Set(["href", "src", "srcset", "action"]);
const TEXT_ATTRS = new Set(["alt", "title", "aria-label", "placeholder", "aria-description"]);

const snippet = (text, index, length) => {
  const from = Math.max(0, index - 40);
  const to = Math.min(text.length, index + length + 40);
  return `${from > 0 ? "…" : ""}${text.slice(from, to).replace(/\s+/g, " ").trim()}${to < text.length ? "…" : ""}`;
};

function jsonStrings(node, out = []) {
  if (typeof node === "string") out.push(node);
  else if (Array.isArray(node)) node.forEach((n) => jsonStrings(n, out));
  else if (node && typeof node === "object") Object.values(node).forEach((n) => jsonStrings(n, out));
  return out;
}

/**
 * Scans one built page (or sitemap/robots text with `{ markup: false }`).
 * Returns { failures: [{ kind, value }], links: [host] } where links are the
 * external hosts of every href/src/srcset/action, for the resources report.
 */
export function scanPage(source, { markup = true } = {}) {
  const raw = String(source ?? "");
  const failures = [];
  const seen = new Set();
  const fail = (kind, value) => {
    const key = `${kind}\u0000${value}`;
    if (!seen.has(key)) seen.add(key), failures.push({ kind, value });
  };
  const checkText = (kind, text) => {
    for (const h of findCompetitorNames(text)) fail(kind, `"${h.match}": ${snippet(text, h.index, h.match.length)}`);
    for (const h of findCompetitorHosts(text)) fail(kind, `${h.host}: ${snippet(text, h.index, h.host.length)}`);
  };
  const links = [];
  const reported = new Set();

  if (!markup) {
    checkText("text", raw);
  } else {
    const html = raw.replace(/<!--[\s\S]*?-->/g, "");
    for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      let strings;
      try {
        strings = jsonStrings(JSON.parse(m[1]));
      } catch {
        strings = [m[1]];
      }
      for (const s of strings) checkText("json-ld", s);
    }
    for (const m of html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)) checkText("title", decodeEntities(m[1]));

    const body = html.replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, " ");
    for (const t of body.matchAll(TAG_RE)) {
      const tag = t[1].toLowerCase();
      const attrs = {};
      for (const a of t[2].matchAll(ATTR_RE)) attrs[a[1].toLowerCase()] = decodeEntities(a[2] ?? a[3] ?? a[4] ?? "");
      for (const [name, value] of Object.entries(attrs)) {
        if (URL_ATTRS.has(name)) {
          const urls = name === "srcset" ? value.split(",").map((c) => c.trim().split(/\s+/)[0]) : [value];
          for (const url of urls) {
            const host = hostOf(url);
            if (!host) continue;
            if (isCompetitorHost(host)) fail(`<${tag} ${name}>`, url), reported.add(host);
            else if (LINK_ATTRS.has(name)) links.push(host);
          }
        } else if (tag === "meta" && name === "content") {
          checkText(`<meta ${attrs.name ?? attrs.property ?? attrs["http-equiv"] ?? attrs.itemprop ?? ""}>`.replace(" >", ">"), value);
        } else if (TEXT_ATTRS.has(name)) {
          checkText(`[${name}]`, value);
        }
      }
    }
    const text = decodeEntities(body.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ");
    checkText("text", text);
  }

  // Anything else that names a competitor URL: inline JSON (with \/ escapes),
  // scripts, comments. Reported once per host not already caught as a link.
  const unescaped = raw.replace(/\\u002f/gi, "/").replace(/\\\//g, "/");
  for (const m of unescaped.matchAll(/(?:https?:)?\/\/[^\s"'<>`)\]]+/gi)) {
    const host = hostOf(m[0]);
    if (isCompetitorHost(host) && !reported.has(host)) reported.add(host), fail("url in page source", m[0]);
  }
  if (!markup) for (const m of unescaped.matchAll(/https?:\/\/[^\s"'<>]+/gi)) links.push(hostOf(m[0]));

  return { failures, links: links.filter((h) => h && !isCompetitorHost(h)) };
}
