import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Phone, SearchX, SlidersHorizontal, Truck, X } from "lucide-react";

import {
  Seo,
  PageHero,
  Breadcrumbs,
  Section,
  SectionHead,
  EmptyState,
} from "../../components/ui/index.jsx";
import Filters, {
  activeFilterChips,
  countActiveFilters,
} from "../../components/shop/Filters.jsx";
import SearchPanel from "../../components/shop/SearchPanel.jsx";
import ProductCard from "../../components/shop/ProductCard.jsx";
import { TireArt } from "../../components/shop/ProductArt.jsx";
import {
  TIRES,
  TIRE_CATEGORIES,
  TIRE_BRAND_NAMES,
  TIRE_DIAMETERS,
} from "../../data/products.js";
import { ratingsFor } from "../../data/tireRatings.js";
import { setPrice } from "../../data/pricing.js";
import { BUSINESS } from "../../data/business.js";
import { money } from "../../context/CartContext.jsx";

// Tires sell as sets of four, so the price sorts are sorted on the set — the
// number the shopper is actually comparing between two sites. The last two
// sorts are what a tire buyer is really shopping for once price is settled.
const SORTS = [
  { value: "best", label: "Featured" },
  { value: "price-asc", label: "Price: set of 4, low to high" },
  { value: "price-desc", label: "Price: set of 4, high to low" },
  { value: "rating", label: "Top rated" },
  { value: "wear", label: "Longest tread life" },
  { value: "wet", label: "Best wet grip" },
];

const PRICE_MIN = Math.min(...TIRES.map((t) => t.price));
const PRICE_MAX = Math.max(...TIRES.map((t) => t.price));

const listParam = (params, key) =>
  (params.get(key) || "").split(",").filter(Boolean);

/**
 * Sorts on one rating axis, best first. An axis can be genuinely unrated —
 * a winter tire carries no UTQG treadwear grade — and an unrated tire belongs
 * at the bottom of the list rather than pretending to have scored a zero.
 */
const byAxis = (axis) => (a, b) => {
  const av = ratingsFor(a)?.[axis] ?? null;
  const bv = ratingsFor(b)?.[axis] ?? null;
  if (av === null && bv === null) return 0;
  if (av === null) return 1;
  if (bv === null) return -1;
  return bv - av;
};

function sortProducts(list, sort) {
  const out = [...list];
  switch (sort) {
    case "price-asc":
      return out.sort((a, b) => setPrice(a) - setPrice(b));
    case "price-desc":
      return out.sort((a, b) => setPrice(b) - setPrice(a));
    case "rating":
      return out.sort((a, b) => b.rating - a.rating);
    case "wear":
      return out.sort(byAxis("wear"));
    case "wet":
      return out.sort(byAxis("wet"));
    default:
      // "Featured" stands in for sales volume: reviews weighted by score.
      return out.sort(
        (a, b) => b.reviewCount * b.rating - a.reviewCount * a.rating,
      );
  }
}

export default function TiresPage() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const view = params.get("view");
  const sort = params.get("sort") || "best";

  const filters = useMemo(
    () => ({
      brands: listParam(params, "brands"),
      // `cats` is the internal multi-select the filter panel writes. `category`
      // is the readable single-category entry point the home page tiles and any
      // future campaign link use; both land in the same filter.
      categories: [
        ...new Set([
          ...listParam(params, "cats"),
          ...listParam(params, "category"),
        ]),
      ],
      diameters: listParam(params, "dia").map(Number),
      finishes: [],
      minPrice: params.get("minp") || "",
      maxPrice: params.get("maxp") || "",
      minRating: Number(params.get("rating") || 0),
      rebateOnly: params.get("rebate") === "1",
    }),
    [params],
  );

  const sizeQuery = {
    width: params.get("w") || "",
    aspect: params.get("a") || "",
    diameter: params.get("d") || "",
  };
  const vehicle = {
    year: params.get("vy") || "",
    make: params.get("vmk") || "",
    model: params.get("vmd") || "",
  };
  const hasVehicle = Boolean(vehicle.year && vehicle.make && vehicle.model);
  const hasSize = Boolean(
    sizeQuery.width || sizeQuery.aspect || sizeQuery.diameter,
  );

  /** Writes only the keys we own, so ?view and ?search survive. */
  const patchParams = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === "" || v == null || (Array.isArray(v) && v.length === 0)) {
        next.delete(k);
      } else {
        next.set(k, Array.isArray(v) ? v.join(",") : String(v));
      }
    });
    setParams(next, { replace: true });
  };

  const onFilterChange = (value) =>
    patchParams({
      brands: value.brands,
      cats: value.categories,
      dia: value.diameters,
      minp: value.minPrice,
      maxp: value.maxPrice,
      rating: value.minRating || "",
      rebate: value.rebateOnly ? "1" : "",
    });

  const onSearch = (payload) => {
    if (payload.type === "vehicle") {
      patchParams({
        vy: payload.year,
        vmk: payload.make,
        vmd: payload.model,
        w: "",
        a: "",
        d: "",
      });
    } else {
      patchParams({
        w: payload.width,
        a: payload.aspect,
        d: payload.diameter,
        vy: "",
        vmk: "",
        vmd: "",
      });
    }
  };

  const results = useMemo(() => {
    const min = Number(filters.minPrice) || 0;
    const max = Number(filters.maxPrice) || Infinity;
    const filtered = TIRES.filter((t) => {
      if (filters.brands.length && !filters.brands.includes(t.brand))
        return false;
      if (filters.categories.length && !filters.categories.includes(t.category))
        return false;
      if (
        filters.diameters.length &&
        !filters.diameters.includes(t.rimDiameter)
      )
        return false;
      if (t.price < min || t.price > max) return false;
      if (filters.minRating && t.rating < filters.minRating) return false;
      if (filters.rebateOnly && t.rebate == null) return false;
      if (sizeQuery.width && String(t.width) !== sizeQuery.width) return false;
      if (sizeQuery.aspect && String(t.aspect) !== sizeQuery.aspect)
        return false;
      if (sizeQuery.diameter && String(t.rimDiameter) !== sizeQuery.diameter)
        return false;
      return true;
    });
    return sortProducts(filtered, sort);
  }, [filters, sizeQuery.width, sizeQuery.aspect, sizeQuery.diameter, sort]);

  const activeFilterCount = countActiveFilters(filters);
  const sizeLabel = `${sizeQuery.width || "any"}/${sizeQuery.aspect || "any"}R${
    sizeQuery.diameter || "any"
  }`;

  // One chip per thing narrowing the list, size included — a shopper who
  // landed here from the size search needs to see that it is a filter, and
  // needs the same one tap to drop it.
  const chips = activeFilterChips(filters).map((chip) => ({
    id: chip.id,
    label: chip.label,
    onRemove: () => onFilterChange(chip.next),
  }));
  if (hasSize) {
    chips.push({
      id: "size",
      label: sizeLabel,
      onRemove: () => patchParams({ w: "", a: "", d: "" }),
    });
  }

  // Everything drops in one URL write. Two patches in a row would each build
  // from the same `params` snapshot and the second would undo the first.
  const clearAllFilters = () =>
    patchParams({
      brands: [],
      cats: [],
      dia: [],
      minp: "",
      maxp: "",
      rating: "",
      rebate: "",
      w: "",
      a: "",
      d: "",
    });

  const brandGroups = useMemo(() => {
    const map = new Map();
    TIRES.forEach((t) => {
      const entry = map.get(t.brand) || { brand: t.brand, items: [] };
      entry.items.push(t);
      map.set(t.brand, entry);
    });
    return [...map.values()].sort((a, b) => a.brand.localeCompare(b.brand));
  }, []);

  if (view === "brands") {
    return (
      <>
        <Seo
          title="Tire Brands"
          description="Michelin, Goodyear, Continental, Bridgestone, Pirelli, Nexen and Nitto tires from TireDrop, shipped anywhere in the continental US."
        />
        <PageHero
          eyebrow="Tires"
          title="Tire Brands We Ship"
          lede="Two distributor networks put Michelin, Goodyear, Continental, Bridgestone, Pirelli, Nexen and Nitto into one catalog. Every set ships anywhere in the continental US."
        />
        <Breadcrumbs
          trail={[{ label: "Tires", to: "/tires" }, { label: "Brands" }]}
        />
        <Section>
          <SectionHead
            eyebrow="Our lineup"
            title="Pick a brand"
            lede="Tap any brand to see every size and model we can ship."
            action={
              <Link to="/tires" className="btn-outline btn-sm">
                Shop all tires
              </Link>
            }
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {brandGroups.map(({ brand, items }) => {
              const from = Math.min(...items.map((i) => i.price));
              const categories = [...new Set(items.map((i) => i.category))];
              return (
                <Link
                  key={brand}
                  to={`/tires?brands=${encodeURIComponent(brand)}`}
                  className="card-hover flex items-center gap-4 p-5"
                >
                  <TireArt
                    accent={items[0].accent}
                    size={84}
                    label={`${brand} tires`}
                    className="shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="h3">{brand}</h3>
                    <p className="mt-1 text-xs text-smoke">
                      {items.length} model{items.length === 1 ? "" : "s"} ·{" "}
                      {categories.join(", ")}
                    </p>
                    <p className="tnum mt-2 font-display text-sm font-bold text-drop">
                      From {money(from)} each
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Section>
      </>
    );
  }

  return (
    <>
      <Seo
        title="Shop Tires"
        description="Shop Michelin, Goodyear, Continental, Bridgestone, Pirelli, Nexen and Nitto tires by vehicle or by size. Shipped anywhere in the continental US, or free to our South Florida shop."
      />
      <PageHero
        eyebrow="Tires"
        title="Shop Tires"
        lede="Find your size, pick your set, then choose where it lands at checkout — your address anywhere in the continental US, or free to our South Florida shop where we fit them for you."
      />
      <Breadcrumbs trail={[{ label: "Tires" }]} />

      <div className="wrap mt-6 md:-mt-8">
        <SearchPanel kind="tire" onSearch={onSearch} />
      </div>

      <Section>
        {hasVehicle && (
          <div className="card mb-8 flex flex-col gap-3 border-l-4 border-l-drop p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow mb-1">Your vehicle</p>
              <p className="font-display text-xl font-bold">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
              <p className="mt-1 text-sm text-smoke">
                Read us the size off your sidewall, or call and we will confirm
                the exact fitment before anything ships.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <a href={BUSINESS.phoneHref} className="btn-primary btn-sm">
                <Phone size={16} aria-hidden />
                {BUSINESS.phone}
              </a>
              <button
                type="button"
                onClick={() => patchParams({ vy: "", vmk: "", vmd: "" })}
                className="btn-outline btn-sm"
              >
                <X size={16} aria-hidden />
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Block flow below `lg`: the sidebar is a drawer there, so the
            aside renders nothing and a grid row would leave its gap behind
            as dead space above the results. */}
        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
          <aside aria-label="Filter tires">
            <Filters
              value={filters}
              onChange={onFilterChange}
              open={filtersOpen}
              onOpenChange={setFiltersOpen}
              resultCount={results.length}
              resultNoun={results.length === 1 ? "tire" : "tires"}
              facets={{
                kind: "tire",
                brands: TIRE_BRAND_NAMES,
                categories: TIRE_CATEGORIES,
                diameters: TIRE_DIAMETERS,
                finishes: [],
                priceMin: PRICE_MIN,
                priceMax: PRICE_MAX,
              }}
            />
          </aside>

          <div>
            {/* Filters and sort stay one tap away on a phone. The offset
                clears the sticky site header — a 40px logo lockup, its
                "Powered by" line and 12px of padding — so this bar parks
                under the header instead of sitting on the breadcrumbs. */}
            <div className="sticky top-[var(--header-h)] z-30 -mx-5 mb-4 flex items-center gap-2 border-b border-ink/10 bg-bone/95 px-5 py-2 backdrop-blur md:-mx-8 md:px-8 lg:hidden">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                aria-expanded={filtersOpen}
                className="btn-outline btn-sm h-11 min-w-0 flex-1"
              >
                <SlidersHorizontal size={16} aria-hidden />
                <span className="truncate">
                  Filters
                  {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </span>
              </button>
              <label htmlFor="tire-sort-mobile" className="sr-only">
                Sort by
              </label>
              <select
                id="tire-sort-mobile"
                value={sort}
                onChange={(e) => patchParams({ sort: e.target.value })}
                className="field h-11 min-w-0 flex-1"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-smoke" aria-live="polite">
                <span className="font-semibold text-ink">
                  {results.length} {results.length === 1 ? "tire" : "tires"}
                </span>{" "}
                of {TIRES.length}
                {hasSize && (
                  <>
                    {" "}
                    matching{" "}
                    <span className="font-semibold text-ink">{sizeLabel}</span>
                  </>
                )}
              </p>
              <div className="hidden items-center gap-2 lg:flex">
                <label
                  htmlFor="tire-sort"
                  className="label mb-0 whitespace-nowrap"
                >
                  Sort by
                </label>
                <select
                  id="tire-sort"
                  value={sort}
                  onChange={(e) => patchParams({ sort: e.target.value })}
                  className="field w-auto"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {chips.length > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {chips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={chip.onRemove}
                    aria-label={`Remove filter ${chip.label}`}
                    className="inline-flex min-h-[32px] items-center gap-1.5 rounded-sm border border-ink/15 bg-fog px-2.5 py-1 text-xs text-ink hover:border-ink"
                  >
                    {chip.label}
                    <X size={13} aria-hidden className="text-smoke" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="min-h-[32px] px-1 font-display text-xs font-bold text-drop hover:text-dive"
                >
                  Clear all
                </button>
              </div>
            )}

            {results.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No tires match those filters"
                lede="Try widening the price range or clearing a size. If you know your size and cannot find it listed, call us — the distributor catalog runs deeper than this page."
                action={
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link to="/tires" className="btn-primary btn-sm">
                      Reset search
                    </Link>
                    <a href={BUSINESS.phoneHref} className="btn-outline btn-sm">
                      <Phone size={16} aria-hidden />
                      Call {BUSINESS.phone}
                    </a>
                  </div>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((tire) => (
                  <ProductCard key={tire.id} product={tire} />
                ))}
              </div>
            )}

            <div className="hazard mt-10 rounded-sm p-1">
              <div className="flex flex-col items-start gap-4 rounded-sm bg-steel-wash p-6 text-bone md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <Truck
                    size={28}
                    aria-hidden
                    className="mt-0.5 shrink-0 text-amber"
                  />
                  <div>
                    <h2 className="h3">Shipped to you, or fitted by us</h2>
                    <p className="mt-1 text-sm text-bone/70">
                      Every order ships anywhere in the continental US. In South
                      Florida, send it free to the shop instead and we mount,
                      balance and dispose of the old set.
                    </p>
                  </div>
                </div>
                <Link to="/shipping" className="btn-primary shrink-0">
                  How shipping works
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
