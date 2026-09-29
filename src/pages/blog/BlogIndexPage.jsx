import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Newspaper } from "lucide-react";
import {
  Breadcrumbs,
  EmptyState,
  PageHero,
  Section,
  Seo,
} from "../../components/ui/index.jsx";
import { ArticleCard, ContentCta } from "../../components/content/parts.jsx";
import { getBlogCategories, getBlogPosts } from "../../content/index.js";

function FilterButton({ active, onClick, children, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-[44px] items-center gap-2 rounded-sm border px-4 py-2 font-display text-sm font-bold transition-colors ${
        active
          ? "border-ink bg-ink text-bone"
          : "border-ink/15 bg-bone text-ink hover:border-drop hover:text-drop"
      }`}
    >
      {children}
      <span
        className={`text-[12px] font-semibold ${active ? "text-bone/70" : "text-smoke"}`}
      >
        {count}
      </span>
    </button>
  );
}

/**
 * /blog: every post, newest first, with a category filter.
 *
 * The filter is buttons, not links: `?category=` is a view of this page
 * (the canonical stays /blog), so there is nothing for a crawler to follow.
 */
export default function BlogIndexPage() {
  const [params, setParams] = useSearchParams();
  const categories = getBlogCategories();
  const all = getBlogPosts();
  const wanted = params.get("category");
  const active = categories.some((c) => c.slug === wanted) ? wanted : null;
  const posts = active ? getBlogPosts({ category: active }) : all;

  const choose = (slug) => {
    const next = new URLSearchParams(params);
    if (slug) next.set("category", slug);
    else next.delete("category");
    setParams(next, { replace: true });
  };

  return (
    <>
      <Seo
        title="Blog: Tire Tips for South Florida"
        description="Tire tips from a shop in Sunrise, FL: hurricane and rainy-season prep, heat and pressure, road trips, buying tires online and vehicle-specific guides."
        crumbs={[]}
      />

      <PageHero
        eyebrow="Blog"
        title="Tire notes from South Florida"
        lede="Seasonal checks, road-trip prep, buying questions and myths, written by the team at the shop in Sunrise."
      />

      <Breadcrumbs trail={[{ label: "Blog" }]} />

      <Section className="bg-bone">
        {categories.length > 0 && (
          <div
            role="group"
            aria-label="Filter posts by category"
            className="mb-8 flex flex-wrap gap-2.5"
          >
            <FilterButton
              active={!active}
              onClick={() => choose(null)}
              count={all.length}
            >
              All posts
            </FilterButton>
            {categories.map((c) => (
              <FilterButton
                key={c.slug}
                active={active === c.slug}
                onClick={() => choose(c.slug)}
                count={c.count}
              >
                {c.label}
              </FilterButton>
            ))}
          </div>
        )}

        <p aria-live="polite" className="sr-only">
          {active
            ? `Showing ${posts.length} posts in ${categories.find((c) => c.slug === active)?.label}`
            : `Showing all ${posts.length} posts`}
        </p>

        {posts.length > 0 ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <ArticleCard key={post.path} article={post} showDate />
            ))}
          </ul>
        ) : (
          <EmptyState
            as="h2"
            icon={Newspaper}
            title="The first posts are on the way"
            lede="In the meantime, the Learn guides cover tread, pressure, sidewall markings and more."
            action={
              <Link to="/learn" className="btn-primary">
                Browse the guides
              </Link>
            }
          />
        )}
      </Section>

      <Section className="bg-fog">
        <ContentCta className="" />
      </Section>
    </>
  );
}
