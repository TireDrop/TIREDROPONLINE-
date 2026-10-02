import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CircleDot,
  Phone,
  Ruler,
  SearchX,
  SlidersHorizontal,
  X,
} from "lucide-react";

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
import {
  WHEELS,
  WHEEL_CATEGORIES,
  WHEEL_BRAND_NAMES,
  WHEEL_DIAMETERS,
} from "../../data/products.js";
import { BUSINESS } from "../../data/business.js";
import { getService } from "../../data/services.js";

// Installation is not free: name the shop's published starting price.
const INSTALL = getService("tire-installation");

const SORTS = [
  { value: "best", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

const PRICE_MIN = Math.min(...WHEELS.map((w) => w.price));
const PRICE_MAX = Math.max(...WHEELS.map((w) => w.price));
const FINISHES = [...new Set(WHEELS.map((w) => w.finish))].sort();

const FITMENT_STEPS = [
  {
    title: "1. Bolt pattern",
    body: "Count the lugs and measure across them — 5x114.3 means five lugs on a 114.3mm circle. It has to match exactly; adapters are a last resort, not a plan.",
  },
  {
    title: "2. Diameter and width",
    body: "A 20x9 wheel is 20 inches tall and 9 inches wide. Going up in diameter means going down in tire sidewall to keep the overall height close to stock.",
  },
  {
    title: "3. Offset",
    body: "Offset is how far the mounting face sits from the wheel's centerline. Too little and the tire rubs the fender; too much and it hits the strut or control arm.",
  },
  {
    title: "4. Center bore",
    body: "The wheel's center hole should sit on the vehicle's hub. When the wheel bore is larger, hub-centric rings fill the gap — they ship with the wheels.",
  },
  {
    title: "5. Brake clearance",
    body: "Big factory calipers need spoke clearance. We check this before your order is released so nothing ships that will not turn.",
  },
  {
    title: "6. Load rating",
    body: "Trucks, vans and three-row SUVs need wheels rated for their weight. Passenger-rated wheels on a work truck is how rims crack.",
  },
];

const listParam = (params, key) =>
  (params.get(key) || "").split(",").filter(Boolean);

function sortProducts(list, sort) {
  const out = [...list];
  switch (sort) {
    case "price-asc":
      return out.sort((a, b) => a.price - b.price);
    case "price-desc":
      return out.sort((a, b) => b.price - a.price);
    default:
      // "Featured" is catalog order: there is no sales or review data behind
      // any other ranking yet.
      return out;
  }
}

export default function WheelsPage() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const view = params.get("view");
  const sort = params.get("sort") || "best";

  const filters = useMemo(
    () => ({
      brands: listParam(params, "brands"),
      categories: listParam(params, "cats"),
      diameters: listParam(params, "dia").map(Number),
      finishes: listParam(params, "fin"),
      minPrice: params.get("minp") || "",
      maxPrice: params.get("maxp") || "",
    }),
    [params],
  );

  // On the wheel catalog the size tab reads width / bolt pattern / diameter.
  const sizeQuery = {
    width: params.get("w") || "",
    bolt: params.get("a") || "",
    diameter: params.get("d") || "",
  };
  const vehicle = {
    year: params.get("vy") || "",
    make: params.get("vmk") || "",
    model: params.get("vmd") || "",
  };
  const hasVehicle = Boolean(vehicle.year && vehicle.make && vehicle.model);
  const hasSize = Boolean(
    sizeQuery.width || sizeQuery.bolt || sizeQuery.diameter,
  );

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
      fin: value.finishes,
      minp: value.minPrice,
      maxp: value.maxPrice,
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
    const filtered = WHEELS.filter((w) => {
      if (filters.brands.length && !filters.brands.includes(w.brand))
        return false;
      if (filters.categories.length && !filters.categories.includes(w.category))
        return false;
      if (filters.diameters.length && !filters.diameters.includes(w.diameter))
        return false;
      if (filters.finishes.length && !filters.finishes.includes(w.finish))
        return false;
      if (w.price < min || w.price > max) return false;
      if (sizeQuery.width && String(w.wheelWidth) !== sizeQuery.width)
        return false;
      if (sizeQuery.bolt && w.boltPattern !== sizeQuery.bolt) return false;
      if (sizeQuery.diameter && String(w.diameter) !== sizeQuery.diameter)
        return false;
      return true;
    });
    return sortProducts(filtered, sort);
  }, [filters, sizeQuery.width, sizeQuery.bolt, sizeQuery.diameter, sort]);

  const activeFilterCount = countActiveFilters(filters);
  const sizeLabel = `${sizeQuery.diameter || "any"}x${
    sizeQuery.width || "any"
  }${sizeQuery.bolt ? ` · ${sizeQuery.bolt}` : ""}`;

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

  // One URL write: two patches in a row would each build from the same
  // `params` snapshot and the second would undo the first.
  const clearAllFilters = () =>
    patchParams({
      brands: [],
      cats: [],
      dia: [],
      fin: [],
      minp: "",
      maxp: "",
      w: "",
      a: "",
      d: "",
    });

  if (view === "fitment") {
    return (
      <>
        <Seo
          title="Wheel Fitment Guidance"
          description="Bolt pattern, offset, center bore and load rating explained — how TireDrop specs wheels that actually fit your vehicle before they ship."
        />
        <PageHero
          eyebrow="Wheels"
          title="Fitment Guidance"
          lede="Six numbers decide whether a wheel bolts on and clears everything. Here is what each one means, and what we check before anything ships."
        />
        <Breadcrumbs
          trail={[{ label: "Wheels", to: "/wheels" }, { label: "Fitment" }]}
        />
        <Section>
          <SectionHead
            eyebrow="Get it right the first time"
            title="What we check on every wheel order"
            lede="Send us the year, make, model and trim — plus a photo of the back of your current wheel if you are already running aftermarket."
            action={
              <Link to="/wheels" className="btn-outline btn-sm">
                Shop all wheels
              </Link>
            }
          />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FITMENT_STEPS.map((step) => (
              <div key={step.title} className="card p-6">
                <Ruler size={22} aria-hidden className="mb-3 text-drop" />
                <h3 className="h3">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-smoke">
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          <div className="card mt-10 flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="h3">Not sure what fits?</h2>
              <p className="mt-1 text-sm text-smoke">
                Call {BUSINESS.phone} with your vehicle details and we will spec
                the package — wheels and tires together, shipped to you or free
                to our South Florida shop for fitting.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <a href={BUSINESS.phoneHref} className="btn-primary btn-sm">
                <Phone size={16} aria-hidden />
                {BUSINESS.phone}
              </a>
              <Link to="/shipping" className="btn-outline btn-sm">
                How shipping works
              </Link>
            </div>
          </div>
        </Section>
      </>
    );
  }

  return (
    <>
      <Seo
        title="Shop Wheels"
        description="Alloy, forged, off-road and truck wheels from Enkei, Method, Fuel, Vossen and more, shipped to the 48 contiguous states and DC or free to our South Florida shop."
      />
      <PageHero
        eyebrow="Wheels"
        title="Shop Wheels"
        lede={`Cast, flow-formed and forged wheels, fitment-checked before they ship. Send them free to your address in the 48 contiguous states or DC, or to our South Florida shop, where we fit them (tire installation from $${INSTALL.priceFrom} ${INSTALL.priceUnit}).`}
      />
      <Breadcrumbs trail={[{ label: "Wheels" }]} />

      <div className="wrap mt-6 md:-mt-8">
        <SearchPanel kind="wheel" onSearch={onSearch} />
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
                Wheel fitment comes down to bolt pattern, offset and brake
                clearance. Call us and we will confirm the package before
                anything ships — see our{" "}
                <Link to="/wheels?view=fitment" className="text-drop underline">
                  fitment guidance
                </Link>
                .
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
          <aside aria-label="Filter wheels">
            <Filters
              value={filters}
              onChange={onFilterChange}
              open={filtersOpen}
              onOpenChange={setFiltersOpen}
              resultCount={results.length}
              resultNoun={results.length === 1 ? "wheel" : "wheels"}
              facets={{
                kind: "wheel",
                brands: WHEEL_BRAND_NAMES,
                categories: WHEEL_CATEGORIES,
                diameters: WHEEL_DIAMETERS,
                finishes: FINISHES,
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
              <label htmlFor="wheel-sort-mobile" className="sr-only">
                Sort by
              </label>
              <select
                id="wheel-sort-mobile"
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
                  {results.length} {results.length === 1 ? "wheel" : "wheels"}
                </span>{" "}
                of {WHEELS.length}
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
                  htmlFor="wheel-sort"
                  className="label mb-0 whitespace-nowrap"
                >
                  Sort by
                </label>
                <select
                  id="wheel-sort"
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
                as="h2"
                icon={SearchX}
                title="No wheels match those filters"
                lede="There are far more wheels than this page lists. Tell us the look you want and your vehicle, and we will source the right bolt pattern and offset."
                action={
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link to="/wheels" className="btn-primary btn-sm">
                      Reset search
                    </Link>
                    <Link
                      to="/wheels?view=fitment"
                      className="btn-outline btn-sm"
                    >
                      Fitment guidance
                    </Link>
                  </div>
                }
              />
            ) : (
              <>
                {/* The cards are h3s; on a phone the Filter h2 is in a
                    closed drawer, so the results need a heading of their own. */}
                <h2 className="sr-only">Wheels</h2>
                <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                  {results.map((wheel) => (
                    <ProductCard key={wheel.id} product={wheel} />
                  ))}
                </div>
              </>
            )}

            <div className="card mt-10 flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <CircleDot
                  size={26}
                  aria-hidden
                  className="mt-0.5 shrink-0 text-drop"
                />
                <div>
                  <h2 className="h3">Wheel and tire packages</h2>
                  <p className="mt-1 text-sm text-smoke">
                    Buy the wheels and tires together and they ship as one
                    order. In South Florida, send it free to the shop and we
                    mount, balance and fit the whole package.
                  </p>
                </div>
              </div>
              <Link to="/install" className="btn-dark shrink-0">
                Ship to store &amp; install
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
