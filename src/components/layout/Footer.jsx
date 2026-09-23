import React from "react";
import { Link } from "react-router-dom";
import { Clock, Facebook, Instagram, MapPin, Phone, Youtube } from "lucide-react";
import { BUSINESS, FOOTER_COLUMNS, TIRE_BRANDS } from "../../data/business.js";
import BrandLogo from "../ui/BrandLogo.jsx";
import Logo from "./Logo.jsx";

/** Brand strip that sits above the footer body, per the supplied artwork. */
function BrandStrip() {
  return (
    <div className="border-b border-graphite py-7">
      <ul className="wrap flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
        {TIRE_BRANDS.map((b) => (
          <li key={b.slug}>
            <Link to={`/tires?brands=${encodeURIComponent(b.name)}`} className="flex min-h-[44px] items-center">
              <BrandLogo brand={b} className="h-8" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-ink text-bone">
      <BrandStrip />

      <div className="wrap grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="mb-4 font-display text-sm uppercase tracking-[0.2em] text-amber">
              {col.title}
            </h3>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-bone/65 transition-colors hover:text-bone"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Visit & Contact column — built from live business data. */}
        <div>
          <h3 className="mb-4 font-display text-sm uppercase tracking-[0.2em] text-amber">
            The Shop Behind Us
          </h3>

          <ul className="space-y-4 text-sm">
            <li>
              <p className="mb-1 font-display uppercase tracking-wide text-bone/45">
                Phone Number
              </p>
              <a
                href={BUSINESS.phoneHref}
                className="-my-1 flex min-h-[36px] items-center gap-2 py-1 font-display text-lg text-bone hover:text-amber"
              >
                <Phone size={15} aria-hidden />
                {BUSINESS.phone}
              </a>
            </li>

            <li>
              <p className="mb-1 font-display uppercase tracking-wide text-bone/45">
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
                  {BUSINESS.shop.city}, {BUSINESS.shop.state} {BUSINESS.shop.zip}
                </span>
              </a>
            </li>

            <li>
              <p className="mb-1 font-display uppercase tracking-wide text-bone/45">
                Shop Hours
              </p>
              <ul className="space-y-0.5 text-bone/65">
                {BUSINESS.hours.map((h) => (
                  <li key={h.days} className="flex items-start gap-2">
                    <Clock size={15} aria-hidden className="mt-0.5 shrink-0 opacity-0 first:opacity-100" />
                    <span>
                      <span className="text-bone">{h.days}:</span> {h.time}
                    </span>
                  </li>
                ))}
              </ul>
            </li>

            <li>
              <p className="mb-2 font-display uppercase tracking-wide text-bone/45">
                Socials
              </p>
              <div className="flex gap-2">
                {[
                  { Icon: Facebook, label: "Facebook" },
                  { Icon: Instagram, label: "Instagram" },
                  { Icon: Youtube, label: "YouTube" },
                ].map(({ Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="rounded-sm border border-graphite p-2 text-bone/65 transition-colors hover:border-bone hover:text-bone"
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
            <Logo className="h-10 shrink-0" onDark />
            <p>
              © {year} {BUSINESS.name} · {BUSINESS.poweredBy}, serving drivers
              since {BUSINESS.foundedYear}
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
