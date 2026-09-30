import React from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Youtube,
} from "lucide-react";
import { BUSINESS, FOOTER_COLUMNS, SOCIAL } from "../../data/business.js";
import Logo from "./Logo.jsx";
import NewsletterSignup from "./NewsletterSignup.jsx";
import { useHydrated } from "../../lib/useHydrated.js";

// Whether any social account is confirmed. With none, the heading would sit
// over an empty row.
const hasSocial = Object.values(SOCIAL).some(Boolean);

export default function Footer() {
  // The prerendered HTML carries the build's year; the visitor's clock takes
  // over after hydration, so the two never disagree mid-hydrate.
  const hydrated = useHydrated();
  const year = hydrated
    ? new Date().getFullYear()
    : Number(import.meta.env.VITE_BUILD_YEAR);

  return (
    <footer className="mt-auto bg-ink bg-ink-wash text-bone">
      {/* Newsletter sign-up, above the link columns. Renders nothing (no band,
          no rule) unless /api/status reports newsletter "on". */}
      <div className="has-[section]:border-b has-[section]:border-graphite">
        <div className="wrap">
          <NewsletterSignup className="py-10 md:py-12" />
        </div>
      </div>

      {/* Two link columns on a phone rather than one long stack; the shop
          column spans both. */}
      <div className="wrap grid grid-cols-2 gap-x-5 gap-y-8 py-14 md:gap-10 lg:grid-cols-4">
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="mb-4 font-display text-[15px] text-amber">
              {col.title}
            </h3>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  {link.href ? (
                    // Off-site (the Shopify account pages), same tab.
                    <a
                      href={link.href}
                      className="text-[15px] text-bone/65 transition-colors hover:text-bone md:text-sm"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.to}
                      className="text-[15px] text-bone/65 transition-colors hover:text-bone md:text-sm"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Visit & Contact column — built from live business data. */}
        <div className="col-span-full md:col-span-1">
          <h3 className="mb-4 font-display text-[15px] text-amber">
            The Shop Behind Us
          </h3>

          <ul className="space-y-4 text-sm">
            <li>
              <p className="label mb-1.5 text-bone/55">Phone Number</p>
              <a
                href={BUSINESS.phoneHref}
                className="-my-1 flex min-h-[36px] items-center gap-2 py-1 font-display text-lg font-bold tracking-[-0.012em] text-bone transition-colors hover:text-amber"
              >
                <Phone size={15} aria-hidden />
                {BUSINESS.phone}
              </a>
            </li>

            {BUSINESS.email && (
              <li>
                <p className="label mb-1.5 text-bone/55">Email</p>
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="-my-1 flex min-h-[36px] items-center gap-2 py-1 font-display text-base font-bold tracking-[-0.012em] text-bone transition-colors hover:text-amber"
                >
                  <Mail size={15} aria-hidden className="shrink-0" />
                  <span className="break-all">{BUSINESS.email}</span>
                </a>
              </li>
            )}

            <li>
              <p className="label mb-1.5 text-bone/55">
                Ship to store &amp; install
              </p>
              <a
                href={BUSINESS.mapsHref}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-2 text-bone/65 hover:text-bone"
              >
                <MapPin size={15} aria-hidden className="mt-0.5 shrink-0" />
                <span>
                  {BUSINESS.shop.name}
                  <br />
                  {BUSINESS.shop.street}
                  <br />
                  {BUSINESS.shop.city}, {BUSINESS.shop.state}{" "}
                  {BUSINESS.shop.zip}
                </span>
              </a>
            </li>

            <li>
              <p className="label mb-1.5 text-bone/55">Shop Hours</p>
              <ul className="space-y-0.5 text-bone/65">
                {BUSINESS.hours.map((h) => (
                  <li key={h.days} className="flex items-start gap-2">
                    <Clock
                      size={15}
                      aria-hidden
                      className="mt-0.5 shrink-0 opacity-0 first:opacity-100"
                    />
                    <span>
                      <span className="text-bone">{h.days}:</span> {h.time}
                    </span>
                  </li>
                ))}
              </ul>
            </li>

            <li className={hasSocial ? "" : "hidden"}>
              <p className="label mb-2 text-bone/55">Socials</p>
              <div className="flex gap-2">
                {[
                  { Icon: Facebook, label: "Facebook", href: SOCIAL.facebook },
                  {
                    Icon: Instagram,
                    label: "Instagram",
                    href: SOCIAL.instagram,
                  },
                  { Icon: Youtube, label: "YouTube", href: SOCIAL.youtube },
                ]
                  // A link to "#" is not a placeholder, it is a broken link —
                  // it jumps the page and tells a visitor the site is
                  // unfinished. An account with no URL simply does not show.
                  .filter(({ href }) => href)
                  .map(({ Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={`${BUSINESS.name} on ${label}`}
                      className="flex h-10 w-10 items-center justify-center rounded-sm border border-graphite text-bone/65 transition-colors hover:border-bone hover:bg-bone/5 hover:text-bone"
                    >
                      <Icon size={16} aria-hidden />
                    </a>
                  ))}
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-graphite">
        <div className="wrap flex flex-col items-center justify-between gap-3 py-5 text-xs text-bone/50 md:flex-row">
          <div className="flex items-center gap-3">
            <Logo className="h-16 shrink-0" variant="full" onDark />
            <p>
              © {year} {BUSINESS.name} · {BUSINESS.poweredBy}
            </p>
          </div>
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {[
              { label: "Terms of Use", to: "/terms" },
              { label: "Privacy", to: "/privacy" },
              { label: "Your Privacy Choices", to: "/privacy#choices" },
              { label: "Accessibility", to: "/accessibility" },
              { label: "Sitemap", to: "/sitemap" },
            ].map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="hover:text-bone">
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
