import React, { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Phone, Search } from "lucide-react";
// The page index (src/lib/sitePages.js), built by vite.config.js.
import SITE_PAGES from "virtual:site-pages";

import { BUSINESS } from "../data/business.js";
import { useTireSearch } from "../data/useApi.js";
import { trackEvent } from "../lib/analytics.js";
import { SEARCH_DATA } from "../lib/searchData.js";
import { extractSize, searchPath, searchSite } from "../lib/siteSearch.js";
import {
  Breadcrumbs,
  PageHero,
  Section,
  Seo,
} from "../components/ui/index.jsx";

// Where to start when there is nothing to search yet.
const START_LINKS = [
  { label: "Shop tires by size", to: "/tires?search=size" },
  { label: "Shop tires by vehicle", to: "/tires?search=vehicle" },
  { label: "Tire brands", to: "/tires?view=brands" },
  { label: "Shop wheels", to: "/wheels" },
  { label: "Mobile tire installation", to: "/mobile-service" },
  { label: "Ship to store and install", to: "/install" },
  { label: "Free tire tools", to: "/tire-size" },
  { label: "Learn: tire guides", to: "/learn" },
];

// Example searches: one of each kind the search understands.
const EXAMPLES = ["225/45R17", "Continental", "All-Season", "rotation", "mobile installation", "Tesla"];

/**
 * /search?q=: the full results behind the header search's "See all
 * results" row, and where a search goes when nothing matches it outright.
 * The same matching as the drop-down (src/lib/siteSearch.js), every match
 * in every group: tire sizes, vehicles, brands and tire types, tires and
 * wheels, and pages and guides.
 *
 * noindex (a results page has nothing of its own to rank) and out of the
 * sitemap. Prerendered without a query, which is what /search hydrates;
 * with ?q= it renders fresh (src/main.jsx), so the results never mismatch.
 * Without JavaScript the form still works: it is a plain GET to /search.
 */
export default function SearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = (params.get("q") ?? "").trim().replace(/\s+/g, " ").slice(0, 100);

  // A complete size: the tire search API's tires in it (the sample catalog
  // answers until the distributor is live).
  const size = useMemo(() => extractSize(q).size, [q]);
  const sizeQuery = size?.complete && !size.flotation ? { size: size.display } : null;
  const live = useTireSearch(sizeQuery);
  const sizeProducts = sizeQuery && live.active ? live.items : undefined;

  const results = useMemo(
    () => searchSite(q, { ...SEARCH_DATA, pages: SITE_PAGES, sizeProducts }),
    [q, sizeProducts],
  );

  const submit = (e) => {
    e.preventDefault();
    const value = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    if (!value) return;
    trackEvent("search", { search_term: value, search_type: "site" });
    navigate(searchPath(value));
  };

  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "es"}`;

  return (
    <>
      <Seo
        title={q ? `Search results for ${q}` : "Search the Store"}
        description={`Search ${BUSINESS.name}: tire sizes, brands, tires and wheels, installation and mobile service, free tire tools and guides.`}
        noindex
      />
      <Breadcrumbs trail={[{ label: "Search" }]} />
      <PageHero
        eyebrow="Search"
        title={q ? `Results for “${q}”` : "Search the store"}
        lede={
          q
            ? results.count
              ? `${plural(results.count, "match")} across tire sizes, tires, brands, services and guides.`
              : "Nothing matched that. Try one of the searches below, or call and ask."
            : "Tire sizes, brands, tires and wheels, installation, free tools and guides, from one box."
        }
      >
        <form
          role="search"
          aria-label="Search results page"
          action="/search"
          method="get"
          onSubmit={submit}
          className="relative max-w-xl"
          key={q}
        >
          <label htmlFor="search-page-q" className="sr-only">
            Search the store
          </label>
          <Search
            size={17}
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-smoke"
          />
          <input
            id="search-page-q"
            name="q"
            type="search"
            defaultValue={q}
            autoComplete="off"
            enterKeyHint="search"
            placeholder="A size, brand, service or question"
            className="field h-12 w-full rounded-full pl-10 pr-28 text-[15px]"
          />
          <button
            type="submit"
            className="btn-primary btn-sm absolute right-1.5 top-1.5 h-9 min-h-0 rounded-full px-4"
          >
            Search
          </button>
        </form>
      </PageHero>

      <Section className="bg-fog">
        {q && results.count > 0 && (
          <div className="space-y-10">
            {results.groups.map((group) => (
              <section key={group.id} aria-labelledby={`results-${group.id}`}>
                <h2
                  id={`results-${group.id}`}
                  className="mb-3 flex items-baseline gap-2 font-display text-lg font-bold text-ink"
                >
                  {group.label}
                  <span className="tnum text-sm font-semibold text-smoke">
                    {group.items.length}
                  </span>
                </h2>
                <ul className="divide-y divide-ink/[0.07] overflow-hidden rounded-card border border-ink/10 bg-bone">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={item.path}
                        onClick={() =>
                          trackEvent("search_suggestion", {
                            search_term: q,
                            suggestion_type: group.id,
                            suggestion_path: item.path,
                          })
                        }
                        className="group flex min-h-[44px] items-center gap-3 px-4 py-3 transition-colors hover:bg-sky"
                      >
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block font-semibold text-ink group-hover:text-drop ${
                              group.id === "products" || group.id === "brands" ? "notranslate" : ""
                            }`}
                            translate={group.id === "products" || group.id === "brands" ? "no" : undefined}
                          >
                            {item.label}
                          </span>
                          <span className="mt-0.5 block text-sm text-smoke">
                            {item.detail}
                            {item.text ? ` · ${item.text}` : ""}
                          </span>
                        </span>
                        <ArrowRight
                          size={16}
                          aria-hidden
                          className="shrink-0 text-smoke group-hover:text-drop"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {q && results.count === 0 && (
          <div className="card px-6 py-10 text-center">
            <h2 className="h3 text-[1.25rem]">No matches for &ldquo;{q}&rdquo;</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-smoke">
              Search by a tire size from your sidewall, like 225/45R17, a brand,
              a vehicle such as 2019 Toyota Camry, or a topic such as rotation.
              Or call and we will look it up with you.
            </p>
            <a
              href={BUSINESS.phoneHref}
              translate="no"
              className="notranslate btn-outline mt-6 inline-flex"
            >
              <Phone size={16} aria-hidden />
              Call {BUSINESS.phone}
            </a>
          </div>
        )}

        <div className={q ? "mt-12" : ""}>
          <h2 className="mb-3 font-display text-lg font-bold text-ink">
            {q ? "Try another search" : "Try a search"}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <li key={example}>
                <Link
                  to={searchPath(example)}
                  className="inline-flex min-h-[44px] items-center rounded-full border border-ink/15 bg-bone px-4 text-sm font-semibold text-ink transition-colors hover:border-drop hover:text-drop"
                >
                  {example}
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="mb-3 mt-10 font-display text-lg font-bold text-ink">
            Or start here
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {START_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="flex min-h-[44px] items-center justify-between gap-3 rounded-card border border-ink/10 bg-bone px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-drop hover:text-drop"
                >
                  {link.label}
                  <ArrowRight size={15} aria-hidden className="shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
