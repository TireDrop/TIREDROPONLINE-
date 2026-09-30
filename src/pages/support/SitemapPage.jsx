import React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Mail,
  MapPin,
  Newspaper,
  Phone,
  Truck,
  Wrench,
} from "lucide-react";
import { BUSINESS, FOOTER_COLUMNS, NAV } from "../../data/business.js";
import { SERVICES } from "../../data/services.js";
import {
  getBlogPosts,
  getLearnArticles,
  getLearnHubs,
} from "../../content/index.js";
import {
  Breadcrumbs,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";

// Pages that exist as routes but do not belong in the marketing navigation.
const UTILITY_LINKS = [
  { label: "Book an Install", to: "/schedule" },
  { label: "Compare Tires", to: "/compare" },
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

// Routes that must always appear somewhere on this page. They normally arrive
// through NAV or FOOTER_COLUMNS; anything missing is listed on its own so a
// nav change can never quietly drop a page out of the sitemap.
const CORE_ROUTES = [
  { label: "How Shipping Works", to: "/shipping" },
  { label: "Ship to Store & Install", to: "/install" },
  { label: "Mobile Installation", to: "/mobile-service" },
  { label: "Tires", to: "/tires" },
  { label: "Wheels", to: "/wheels" },
  { label: "Learn: Tire Guides", to: "/learn" },
  { label: "Blog", to: "/blog" },
  { label: `About ${BUSINESS.name}`, to: "/about" },
  { label: "Contact", to: "/contact" },
];

function LinkColumn({ title, links, icon: Icon }) {
  return (
    <div>
      <h3 className="mb-4 flex items-center gap-2 border-b border-ink/10 pb-3 font-display text-lg text-ink">
        {Icon && <Icon size={16} aria-hidden className="text-drop" />}
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={`${link.to}-${link.label}`}>
            <Link
              to={link.to}
              className="flex min-h-[32px] items-center text-sm text-smoke transition-colors hover:text-drop"
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

  const listed = new Set(
    [
      ...navGroups.flatMap((g) => g.links),
      ...FOOTER_COLUMNS.flatMap((c) => c.links),
      ...UTILITY_LINKS,
      ...LEGAL_LINKS,
    ].map((link) => link.to),
  );

  const missing = CORE_ROUTES.filter((route) => !listed.has(route.to));

  // Every Learn guide under its topic, and every blog post. Topics with no
  // guide yet are left out rather than listed as empty headings.
  const guideGroups = getLearnHubs()
    .filter((hub) => hub.count > 0)
    .map((hub) => ({
      title: hub.title,
      links: [
        { label: `All ${hub.title} guides`, to: hub.path },
        ...getLearnArticles({ hub: hub.slug }).map((a) => ({
          label: a.title,
          to: a.path,
        })),
      ],
    }));
  const posts = getBlogPosts().map((p) => ({ label: p.title, to: p.path }));

  return (
    <>
      <Seo
        title="Sitemap"
        description={`Every page on the ${BUSINESS.name} website in one place — tires, wheels, shipping, installation, guides, support pages and legal documents.`}
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
            <LinkColumn
              key={group.title}
              title={group.title}
              links={group.links}
            />
          ))}

          {missing.length > 0 && (
            <LinkColumn title="Also on the site" links={missing} />
          )}
        </div>
      </Section>

      {/* ---------- Services ---------- */}
      <Section className="bg-fog">
        <SectionHead
          eyebrow="Service Pages"
          title="Every service we list"
          lede={`Installation and repair happen in South Florida: the van travels to you across Miami-Dade, Broward and Palm Beach, and the rest happens at the ${BUSINESS.shop.city} shop. Tires and wheels themselves ship anywhere in ${BUSINESS.shipping.area}.`}
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

      {/* ---------- Learn guides + blog ---------- */}
      <Section className="bg-bone">
        <SectionHead
          eyebrow="Learn & Blog"
          title="Guides and articles"
          lede="Every tire guide by topic, and every blog post."
        />

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {guideGroups.map((group) => (
            <LinkColumn
              key={group.title}
              title={group.title}
              links={group.links}
              icon={BookOpen}
            />
          ))}
          <LinkColumn
            title="Blog"
            icon={Newspaper}
            links={[{ label: "All blog posts", to: "/blog" }, ...posts]}
          />
          {guideGroups.length === 0 && (
            <LinkColumn
              title="Learn"
              icon={BookOpen}
              links={[{ label: "All tire guides", to: "/learn" }]}
            />
          )}
        </div>
      </Section>

      {/* ---------- Footer groups + utility + legal ---------- */}
      <Section className="bg-fog">
        <SectionHead
          eyebrow="Everything Else"
          title="Footer, ordering and legal pages"
        />

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {FOOTER_COLUMNS.map((col) => (
            <LinkColumn key={col.title} title={col.title} links={col.links} />
          ))}

          <LinkColumn title="Ordering & Booking" links={UTILITY_LINKS} />
          <LinkColumn title="Legal" links={LEGAL_LINKS} />

          <div>
            <h3 className="mb-4 flex items-center gap-2 border-b border-ink/10 pb-3 font-display text-lg text-ink">
              <MapPin size={16} aria-hidden className="text-drop" />
              Call or Visit
            </h3>
            <p className="mb-3 text-sm leading-relaxed text-smoke">
              {BUSINESS.parent}, the shop behind {BUSINESS.name}:
            </p>
            <address className="not-italic text-sm text-smoke">
              {BUSINESS.shop.street}
              <br />
              {BUSINESS.shop.city}, {BUSINESS.shop.state} {BUSINESS.shop.zip}
            </address>
            <a
              href={BUSINESS.phoneHref}
              className="mt-3 inline-flex min-h-[32px] items-center gap-2 font-display text-lg text-ink hover:text-drop"
            >
              <Phone size={16} aria-hidden />
              {BUSINESS.phone}
            </a>
            {BUSINESS.email && (
              <a
                href={`mailto:${BUSINESS.email}`}
                className="mt-1 flex min-h-[32px] items-center gap-2 break-all font-display text-lg text-ink hover:text-drop"
              >
                <Mail size={16} aria-hidden className="shrink-0" />
                {BUSINESS.email}
              </a>
            )}
            <div className="mt-5">
              <Link to="/tires" className="btn-primary btn-sm">
                Shop Tires
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
