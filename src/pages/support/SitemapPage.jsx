import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Truck, Wrench } from "lucide-react";
import { BUSINESS, FOOTER_COLUMNS, NAV } from "../../data/business.js";
import { SERVICES } from "../../data/services.js";
import {
  Breadcrumbs,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";

// Pages that exist as routes but do not belong in the marketing navigation.
const UTILITY_LINKS = [
  { label: "Schedule Service", to: "/schedule" },
  { label: "Cart", to: "/cart" },
  { label: "Checkout", to: "/checkout" },
  { label: "Sitemap", to: "/sitemap" },
];

const LEGAL_LINKS = [
  { label: "Terms of Use", to: "/terms" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Your Privacy Choices", to: "/privacy#choices" },
  { label: "Accessibility Statement", to: "/accessibility" },
];

function LinkColumn({ title, links, icon: Icon }) {
  return (
    <div>
      <h3 className="mb-4 flex items-center gap-2 border-b border-ink/10 pb-3 font-display text-base uppercase tracking-[0.12em] text-ink">
        {Icon && <Icon size={16} aria-hidden className="text-drop" />}
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={`${link.to}-${link.label}`}>
            <Link
              to={link.to}
              className="text-sm text-smoke transition-colors hover:text-drop"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SitemapPage() {
  // Every top-level nav entry, plus its dropdown children where it has them.
  const navGroups = NAV.map((item) => ({
    title: item.label,
    links: item.children?.length
      ? item.children
      : [{ label: item.label, to: item.to }],
  }));

  const toLink = (service) => ({
    label: service.name,
    to: `/services/${service.slug}`,
  });

  const serviceGroups = [
    {
      title: "Mobile Services",
      icon: Truck,
      links: SERVICES.filter((s) => s.mobile).map(toLink),
    },
    {
      title: "Shop Services",
      icon: Wrench,
      links: SERVICES.filter((s) => !s.mobile).map(toLink),
    },
  ];

  return (
    <>
      <Seo
        title="Sitemap"
        description={`Every page on the ${BUSINESS.name} website in one place — tires, wheels, mobile service, auto repair, support pages and legal documents.`}
      />

      <PageHero
        eyebrow="Sitemap"
        title="Every page, one list"
        lede="If you cannot find something in the menu, it is here. Built straight from the site's own navigation and service catalog, so it never drifts out of date."
      />

      <Breadcrumbs trail={[{ label: "Sitemap" }]} />

      {/* ---------- Main navigation ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="Main Navigation"
          title="Browse the site"
          lede="The same structure as the menu at the top of every page."
        />

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {navGroups.map((group) => (
            <LinkColumn key={group.title} title={group.title} links={group.links} />
          ))}
        </div>
      </Section>

      {/* ---------- Services ---------- */}
      <Section className="bg-fog">
        <SectionHead
          eyebrow="Service Pages"
          title="Every service we list"
          lede="Mobile services travel to you. Shop services happen at the Sunrise bay."
        />

        <div className="grid gap-10 sm:grid-cols-2">
          {serviceGroups.map((group) => (
            <LinkColumn
              key={group.title}
              title={group.title}
              links={group.links}
              icon={group.icon}
            />
          ))}
        </div>
      </Section>

      {/* ---------- Footer groups + utility + legal ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="Everything Else"
          title="Footer, account and legal pages"
        />

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {FOOTER_COLUMNS.map((col) => (
            <LinkColumn key={col.title} title={col.title} links={col.links} />
          ))}

          <LinkColumn title="Shopping & Booking" links={UTILITY_LINKS} />
          <LinkColumn title="Legal" links={LEGAL_LINKS} />

          <div>
            <h3 className="mb-4 flex items-center gap-2 border-b border-ink/10 pb-3 font-display text-base uppercase tracking-[0.12em] text-ink">
              <MapPin size={16} aria-hidden className="text-drop" />
              Visit or Call
            </h3>
            <address className="not-italic text-sm text-smoke">
              {BUSINESS.address.street}
              <br />
              {BUSINESS.address.city}, {BUSINESS.address.state}{" "}
              {BUSINESS.address.zip}
            </address>
            <a
              href={BUSINESS.phoneHref}
              className="mt-3 inline-flex items-center gap-2 font-display text-lg uppercase tracking-wide text-ink hover:text-drop"
            >
              <Phone size={16} aria-hidden />
              {BUSINESS.phone}
            </a>
            <div className="mt-5">
              <Link to="/schedule" className="btn-primary btn-sm">
                Schedule Service
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
