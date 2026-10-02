import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  Clock,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Youtube,
} from "lucide-react";
import { BUSINESS, FOOTER_COLUMNS, SOCIAL } from "../../data/business.js";
import Logo from "./Logo.jsx";
import NewsletterSignup from "./NewsletterSignup.jsx";
import { useHydrated } from "../../lib/useHydrated.js";

/**
 * Site footer, phone first.
 *
 * - Phones and tablets: the newsletter (when on), then the shop's contact as
 *   three tap targets (call, email, directions) with one address line and one
 *   hours line, then each link group as a native <details> accordion, closed,
 *   which opens and closes with JavaScript off.
 * - From lg (1024px): a brand/contact column and four link columns. The
 *   groups are the same <details>; index.css (`.footer-group`) shows their
 *   content whatever the open state, so the markup never differs between
 *   prerender and hydration and nothing moves. Browsers without
 *   ::details-content get the groups opened after hydration instead.
 *
 * Tools & Guides shows a shortlist (FOOTER_COLUMNS `footerShortlist`) and an
 * "All tools & guides" link; /learn and /sitemap carry the rest.
 */

const SOCIAL_LINKS = [
  { Icon: Facebook, label: "Facebook", href: SOCIAL.facebook },
  { Icon: Instagram, label: "Instagram", href: SOCIAL.instagram },
  { Icon: Youtube, label: "YouTube", href: SOCIAL.youtube },
  // A link to "#" is not a placeholder, it is a broken link. An account with
  // no URL simply does not show.
].filter(({ href }) => href);

const LEGAL_LINKS = [
  { label: "Terms of Use", to: "/terms" },
  { label: "Privacy", to: "/privacy" },
  { label: "Your Privacy Choices", to: "/privacy#choices" },
  { label: "Accessibility", to: "/accessibility" },
  { label: "Sitemap", to: "/sitemap" },
];

/** "Mon – Fri" → "Mon–Fri", "Saturday" → "Sat". */
const shortDays = (days) =>
  days.replace(/([A-Z][a-z]{2})[a-z]*/g, "$1").replace(/\s*–\s*/g, "–");

/** "8:00 AM – 6:30 PM" → "8–6:30", "Closed" → "closed". */
const shortTime = (time) =>
  /closed/i.test(time)
    ? "closed"
    : time
        .split("–")
        .map((t) => t.trim().replace(/:00/, "").replace(/\s*[AP]M$/i, ""))
        .join("–");

/** The shop's hours, one short entry per row of BUSINESS.hours. */
const HOURS = BUSINESS.hours.map(
  (h) => `${shortDays(h.days)} ${shortTime(h.time)}`,
);

/**
 * The link groups, with Tools & Guides cut to its shortlist. Labels come from
 * FOOTER_COLUMNS; the /tires-shipped one reads "Shipping to 48 States + DC",
 * never "nationwide", because free shipping covers only those.
 */
const GROUPS = FOOTER_COLUMNS.map((col) => {
  if (!col.footerShortlist) return col;
  const keep = col.footerShortlist
    .map((to) => col.links.find((l) => l.to === to))
    .filter(Boolean);
  return { ...col, links: keep };
});

// text-balance: a label that wraps in the two-column phone grid splits evenly
// ("Shipping to 48 / States + DC") instead of leaving "+ DC" alone.
const linkClass =
  "flex min-h-[44px] items-center text-balance text-[15px] text-bone/70 transition-colors hover:text-bone lg:min-h-[30px] lg:text-sm lg:text-bone/65";

function FooterLink({ link }) {
  return link.href ? (
    // Off-site (the Shopify account pages), same tab.
    <a href={link.href} className={linkClass}>
      {link.label}
    </a>
  ) : (
    <Link to={link.to} className={linkClass}>
      {link.label}
    </Link>
  );
}

const tileClass =
  "flex min-h-[56px] w-full min-w-0 flex-col items-center justify-center gap-1 rounded-sm border border-graphite px-1.5 py-2 text-[13px] font-semibold text-bone transition-colors hover:border-bone/40 hover:bg-bone/5 lg:min-h-[36px] lg:flex-row lg:justify-start lg:gap-2 lg:border-0 lg:px-0 lg:py-1 lg:text-sm lg:hover:bg-transparent lg:hover:text-amber";

export default function Footer() {
  // The prerendered HTML carries the build's year; the visitor's clock takes
  // over after hydration, so the two never disagree mid-hydrate.
  const hydrated = useHydrated();
  const year = hydrated
    ? new Date().getFullYear()
    : Number(import.meta.env.VITE_BUILD_YEAR);

  // Fallback for browsers that cannot style ::details-content (see the
  // comment above): open the groups at desktop width, close them below it.
  const groupsRef = useRef(null);
  useEffect(() => {
    if (CSS.supports?.("selector(::details-content)")) return undefined;
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      for (const d of groupsRef.current?.querySelectorAll("details") ?? []) {
        d.open = mq.matches;
      }
    };
    if (mq.matches) sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <footer className="mt-auto bg-ink bg-ink-wash text-bone">
      {/* Newsletter sign-up, above everything else. Renders nothing (no band,
          no rule) unless /api/status reports newsletter "on". */}
      <div className="has-[section]:border-b has-[section]:border-graphite">
        <div className="wrap">
          <NewsletterSignup className="py-8 md:py-10" />
        </div>
      </div>

      <div className="wrap py-8 lg:grid lg:grid-cols-[minmax(0,1.35fr)_repeat(4,minmax(0,1fr))] lg:gap-8 lg:py-10">
        {/* Contact, from live business data. */}
        <div>
          <h2 className="mb-3 font-display text-[15px] text-amber">
            The Shop Behind Us
          </h2>

          <ul className="grid grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 lg:grid-cols-1 lg:gap-0.5">
            <li>
              <a
                href={BUSINESS.phoneHref}
                aria-label={`Call ${BUSINESS.phone}`}
                className={tileClass}
              >
                <Phone size={16} aria-hidden className="shrink-0" />
                <span
                  translate="no"
                  className="notranslate whitespace-nowrap font-display tracking-[-0.01em] lg:text-base lg:font-bold"
                >
                  {BUSINESS.phone}
                </span>
              </a>
            </li>
            {BUSINESS.email && (
              <li>
                <a href={`mailto:${BUSINESS.email}`} className={tileClass}>
                  <Mail size={16} aria-hidden className="shrink-0" />
                  <span className="lg:hidden">Email</span>
                  <span
                    translate="no"
                    className="notranslate hidden break-all lg:inline"
                  >
                    {BUSINESS.email}
                  </span>
                </a>
              </li>
            )}
            <li>
              <a
                href={BUSINESS.mapsHref}
                target="_blank"
                rel="noreferrer"
                className={tileClass}
              >
                <Navigation size={16} aria-hidden className="shrink-0" />
                Directions
              </a>
            </li>
          </ul>

          <div className="mt-4 space-y-1.5 text-sm text-bone/65 lg:mt-3">
            <p className="flex items-start gap-2">
              <MapPin size={15} aria-hidden className="mt-0.5 shrink-0" />
              <span className="notranslate" translate="no">
                {BUSINESS.shop.full}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Clock size={15} aria-hidden className="mt-0.5 shrink-0" />
              <span>
                <span className="sr-only">Shop hours: </span>
                {HOURS.map((h, i) => (
                  <React.Fragment key={h}>
                    {i > 0 && " · "}
                    <span className="whitespace-nowrap">{h}</span>
                  </React.Fragment>
                ))}
              </span>
            </p>
          </div>
        </div>

        {/* Link groups: accordions below lg, columns from lg. */}
        <div
          ref={groupsRef}
          className="mt-6 border-t border-graphite md:grid md:grid-cols-2 md:gap-x-8 lg:col-span-4 lg:mt-0 lg:grid-cols-4 lg:border-0"
        >
          {GROUPS.map((col) => (
            <details
              key={col.title}
              className="footer-group group border-b border-graphite lg:border-0"
            >
              <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden lg:mb-2 lg:min-h-0">
                <h2 className="font-display text-[15px] text-amber">
                  {col.title}
                </h2>
                <ChevronDown
                  size={18}
                  aria-hidden
                  className="footer-chevron shrink-0 text-bone/60 transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <ul className="grid grid-cols-2 gap-x-4 pb-3 lg:grid-cols-1 lg:pb-0">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink link={link} />
                  </li>
                ))}
                {col.more && (
                  <li className="col-span-full">
                    <Link
                      to={col.more.to}
                      className="flex min-h-[44px] items-center gap-1.5 text-[15px] font-semibold text-amber transition-colors hover:text-bone lg:min-h-[30px] lg:text-sm"
                    >
                      {col.more.label}
                      <ArrowRight size={14} aria-hidden />
                    </Link>
                  </li>
                )}
              </ul>
            </details>
          ))}
        </div>
      </div>

      <div className="border-t border-graphite">
        <div className="wrap flex flex-col gap-2 py-4 text-xs text-bone/50 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-10 shrink-0" variant="full" onDark />
            <p className="min-w-0 flex-1 lg:flex-none">
              © {year}{" "}
              <span className="notranslate" translate="no">
                {BUSINESS.name}
              </span>{" "}
              · Powered by{" "}
              <span className="notranslate" translate="no">
                {BUSINESS.parent}
              </span>
            </p>
            {SOCIAL_LINKS.length > 0 && (
              <ul className="flex shrink-0 gap-1">
                {SOCIAL_LINKS.map(({ Icon, label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={`${BUSINESS.name} on ${label}`}
                      className="flex h-11 w-11 items-center justify-center rounded-sm border border-graphite text-bone/65 transition-colors hover:border-bone hover:bg-bone/5 hover:text-bone"
                    >
                      <Icon size={16} aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <ul className="flex flex-wrap items-center gap-x-4">
            {LEGAL_LINKS.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  className="inline-flex min-h-[32px] items-center hover:text-bone"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
