import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Phone, SearchX, SlidersHorizontal, Truck, X } from "lucide-react";

import {
  Seo,
  PageHero,
  Breadcrumbs,
  Section,
  SectionHead,
  EmptyState,
} from "../../components/ui/index.jsx";
import TireFilters, {
  countTireFilters,
  tireFilterChips,
} from "../../components/shop/TireFilters.jsx";
import SearchPanel from "../../components/shop/SearchPanel.jsx";
import { ShoppingForBar } from "../../components/shop/Fitment.jsx";
import ProductCard from "../../components/shop/ProductCard.jsx";
import { TireArt } from "../../components/shop/ProductArt.jsx";
import {
  TIRES,
  TIRE_CATEGORIES,
  TIRE_BRAND_NAMES,
  VEHICLE_DATA,
  VEHICLE_MAKES,
} from "../../data/products.js";
import { FITMENT } from "../../data/fitment.js";
import { makesFor } from "../../data/vehicles.js";
import { ratingsFor } from "../../data/tireRatings.js";
import { setPrice } from "../../data/pricing.js";
import { BUSINESS } from "../../data/business.js";
import { fitSizeOf, readSize, sizesOf } from "../../data/fitmentCheck.js";
import {
  SEASONS,
  TYPES,
  facetCounts,
  matchesFilters,
  warrantyMilesOf,
} from "../../data/tireFacets.js";
import {
  EMPTY_TIRE_FILTERS,
  parseTiresQuery,
  selectionKey,
  slug,
  serializeTiresQuery,
} from "../../lib/tiresUrl.js";
import { useVehicle } from "../../context/VehicleContext.jsx";
import { useTireSearch } from "../../data/useApi.js";
import { money } from "../../context/CartContext.jsx";

// Tires sell as sets of four, so the price sorts are sorted on the set — the
// number the shopper is actually comparing between two sites. Warranty sorts
// on the treadwear miles the tire's own warranty states; the last two sort on
// its published grades (UTQG treadwear and traction).
const SORTS = [
  { value: "best", label: "Recommended" },
  { value: "price-asc", label: "Price: set of 4, low to high" },
  { value: "price-desc", label: "Price: set of 4, high to low" },
  { value: "warranty", label: "Warranty miles: high to low" },
  { value: "brand", label: "Brand: A–Z" },
  { value: "wear", label: "Longest tread life" },
  { value: "wet", label: "Best wet grip" },
];

// Written from the catalog rather than typed, so a brand cannot be advertised
// after its last product is gone.
const brandSentence = TIRE_BRAND_NAMES.length
  ? TIRE_BRAND_NAMES.slice(0, -1).join(", ") +
    " and " +
    TIRE_BRAND_NAMES[TIRE_BRAND_NAMES.length - 1]
  : "Major-brand";

// What turns the address bar's lowercase slugs back into the catalog's own
// spelling (src/lib/tiresUrl.js).
const tableModels = (make) =>
  Object.keys(FITMENT)
    .filter((k) => k.startsWith(`${make}|`))
    .map((k) => k.split("|")[1]);
const VOCAB = {
  brands: TIRE_BRAND_NAMES,
  categories: TIRE_CATEGORIES,
  makes: [
    ...new Set([
      ...VEHICLE_MAKES,
      ...Object.keys(FITMENT).map((k) => k.split("|")[0]),
      ...makesFor(""),
    ]),
  ],
  models: (make) => [
    ...new Set([...tableModels(make), ...Object.keys(VEHICLE_DATA[make] || {})]),
  ],
};

const FACET_LABELS = Object.fromEntries(
  [...SEASONS, ...TYPES].map((o) => [o.value, o.label]),
);
const NO_PARTIAL = { width: "", aspect: "", diameter: "" };

/**
 * Sorts on one spec-derived axis, best first. An axis can be genuinely unrated —
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
    case "warranty":
      // A tire whose warranty states no miles sorts last, not as zero.
      return out.sort(
        (a, b) => (warrantyMilesOf(b) ?? -1) - (warrantyMilesOf(a) ?? -1),
      );
    case "brand":
      return out.sort(
        (a, b) =>
          String(a.brand).localeCompare(String(b.brand)) ||
          String(a.model).localeCompare(String(b.model)),
      );
    case "wear":
      return out.sort(byAxis("wear"));
    case "wet":
      return out.sort(byAxis("wet"));
    default:
      // "Recommended" is catalog order, with the tires that fit what you are
      // shopping for first: there is no sales or review data behind any
      // other ranking yet.
      return out;
  }
}

export default function TiresPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // The address bar holds the page (src/lib/tiresUrl.js). Only a bare
  // /tires hydrates the prerendered page, which is the nothing-chosen state
  // too; one with a query renders fresh (src/main.jsx), so reading it here
  // never makes a hydration mismatch.
  const state = useMemo(
    () => parseTiresQuery(location.search, VOCAB),
    [location.search],
  );
  const { filters, partial, sort, view } = state;

  const fitment = useVehicle();
  const {
    ready,
    selection,
    resolved,
    selectVehicle,
    selectSize,
    openChanger,
    closeChanger,
    changer,
  } = fitment;

  /** The page as it stands: the address bar's filters, the saved selection. */
  const current = { ...state, selection: ready ? selection : state.selection };

  /** Writes a state to the address bar: replace for a tweak, push for a new vehicle or size. */
  const write = (next, { push = false } = {}) => {
    const qs = serializeTiresQuery(next);
    const search = qs ? `?${qs}` : "";
    if (search === location.search) return;
    navigate(
      { pathname: location.pathname, search, hash: location.hash },
      { replace: !push },
    );
  };

  // ?fit=change|size (a "Change vehicle" link on a page with no bar) opens
  // the finder here, prefilled; the canonical write below drops it.
  useEffect(() => {
    if (state.fit) openChanger(state.fit === "size" ? "size" : "vehicle");
    // Once per hand-off; openChanger is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.fit]);

  // The address bar and the saved selection agree, every render:
  //  - a vehicle or size in the address that this page has not seen yet (a
  //    shared link, back/forward, a link from another page) wins, and
  //    becomes the saved selection;
  //  - one chosen here (the finder, Change, Clear) goes into the address as
  //    a new history entry, so Back returns to the one before;
  //  - an address with none (Shop Tires, from anywhere) gets the saved one
  //    written in, replacing the entry;
  //  - otherwise the address is rewritten in its canonical spelling (older
  //    keys, slugs), replacing the entry.
  const urlKey = selectionKey(state.selection);
  const ctxKey = ready ? selectionKey(selection) : null;
  const synced = useRef(undefined);
  useEffect(() => {
    if (state.selection && urlKey !== synced.current) {
      synced.current = urlKey;
      if (urlKey !== ctxKey) {
        if (state.selection.type === "size") selectSize(state.selection.size);
        else selectVehicle(state.selection);
        return;
      }
    }
    if (!ready) return;
    if (ctxKey !== urlKey) {
      const push = synced.current !== undefined && ctxKey !== synced.current;
      synced.current = ctxKey;
      write({ ...state, selection }, { push });
      return;
    }
    synced.current = urlKey;
    write({ ...state, selection });
  });

  const sizeQuery = partial;
  const hasSize = Boolean(
    sizeQuery.width || sizeQuery.aspect || sizeQuery.diameter,
  );
  const fullSize =
    sizeQuery.width && sizeQuery.aspect && sizeQuery.diameter
      ? `${sizeQuery.width}/${sizeQuery.aspect}R${sizeQuery.diameter}`
      : "";

  // Searches go through the API (ATD when it is live): a size typed in the
  // filters first, else the size being shopped for, else the vehicle (the
  // API resolves it to the factory size for that model year). Until it
  // answers, or with no API at all, the sample catalog answers, which is
  // exactly what this page always showed.
  const chosen = resolved.kind === "vehicle" ? resolved.chosen : null;
  // A size the shopper gave, or the trim they picked, is searched as a size;
  // otherwise the vehicle itself, so the distributor's own fitment answers
  // once it is wired.
  const ownSize =
    chosen &&
    !chosen.rear &&
    (resolved.basis === "entered" || resolved.basis === "trim");
  let query = null;
  if (fullSize) query = { size: fullSize };
  else if (!ready) query = null;
  else if (resolved.kind === "size") query = { size: resolved.size.display };
  else if (resolved.kind === "vehicle") {
    if (ownSize) query = { size: chosen.front };
    else if (resolved.vehicle.model) query = resolved.vehicle;
  }
  const search = useTireSearch(query);
  const live = search.active && search.source === "atd";
  // Live results replace the sample catalog outright: a page that mixed
  // distributor stock with sample listings would be quoting two sources as
  // one. Partial sizes ("any"/45/R17) still narrow the catalog locally.
  const pool = live ? search.items : TIRES;

  const onFilterChange = (next) => write({ ...current, filters: next });

  // The finder (the "pop-up" Shop Tires shows first) sets what is being
  // shopped for: a vehicle (SearchPanel selects it itself), or a full
  // sidewall size. A partial size ("any"/45/R17) only filters. Opened from
  // "Enter the size on your tires" for a vehicle, the size is that
  // vehicle's.
  const onSearch = (payload) => {
    if (payload.type === "vehicle") {
      write({ ...current, partial: NO_PARTIAL });
      return;
    }
    const { width, aspect, diameter } = payload;
    if (width && aspect && diameter) {
      const size = `${width}/${aspect}R${diameter}`;
      if (changer.open && changer.tab === "size" && selection?.type === "vehicle") {
        const { pick: _pick, size: _old, ...vehicle } = selection;
        selectVehicle({ ...vehicle, size });
      } else {
        selectSize(size);
      }
      write({ ...current, partial: NO_PARTIAL });
      return;
    }
    write({ ...current, partial: { width, aspect, diameter } });
    closeChanger();
  };

  // A partial size narrows the list outright; the filters then apply on top.
  const sized = useMemo(
    () =>
      pool.filter((t) => {
        if (sizeQuery.width && String(t.width) !== sizeQuery.width) return false;
        if (sizeQuery.aspect && String(t.aspect) !== sizeQuery.aspect)
          return false;
        if (sizeQuery.diameter && String(t.rimDiameter) !== sizeQuery.diameter)
          return false;
        return true;
      }),
    [pool, sizeQuery.width, sizeQuery.aspect, sizeQuery.diameter],
  );
  const results = useMemo(
    () =>
      sortProducts(
        sized.filter((t) => matchesFilters(t, filters)),
        sort,
      ),
    [sized, filters, sort],
  );

  // What is being shopped for narrows the page rather than replacing it.
  // Filtering the catalog down to one size outright can leave a single card
  // on screen, and the shopper still wants to see what else is stocked — so
  // the tires in their size come first and the rest keep their own heading
  // below, each card saying in words that it does not fit.
  //
  // "In your size" is the same fitment answer every card shows (year-aware,
  // from src/data/fitmentCheck.js); with ATD live, a vehicle search returns
  // the distributor's own fitment, and those tires count as in your size.
  const fitSizes = ready ? sizesOf(resolved) : [];
  const fitSize = fitSizes.join(" or ");
  const showFit = fitSizes.length > 0;
  const liveVehicle = live && query && !query.size;
  const inSize = (t) => {
    if (liveVehicle) return true;
    // Every tire in the size, including one a trim or an LT casing leaves
    // to confirm: its own card says which.
    const f = fitment.fitFor(fitSizeOf(t));
    return (
      f?.status === "fits" || f?.code === "some-trims" || f?.code === "casing"
    );
  };
  const fitting = showFit ? results.filter(inSize) : [];
  const others = showFit ? results.filter((t) => !inSize(t)) : results;
  const fitHeading =
    resolved.kind === "size"
      ? `In your size, ${resolved.size.display}`
      : chosen
        ? `In the size for your ${resolved.label}`
        : `In the factory sizes for a ${resolved.label}`;
  const fitLede =
    resolved.kind === "size"
      ? `Tires on this page in ${fitSize}.`
      : resolved.basis === "typical"
        ? `Tires on this page in ${fitSize}, the typical factory size on file for a ${resolved.label}. Trims and options vary, so check the sticker in your driver's door jamb.`
        : resolved.basis === "entered"
          ? `Tires on this page in ${fitSize}, the size you gave us.`
          : `Tires on this page in ${fitSize}.`;

  // The filters count what is in your size when you are shopping for one,
  // and the whole list otherwise.
  const facetBase = showFit ? sized.filter(inSize) : sized;
  const facets = facetCounts(facetBase, filters);
  const shown = showFit ? fitting.length : results.length;

  const activeFilterCount = countTireFilters(filters);
  const sizeLabel = `${sizeQuery.width || "any"}/${sizeQuery.aspect || "any"}R${
    sizeQuery.diameter || "any"
  }`;

  // One chip per thing narrowing the list, size included — a shopper who
  // landed here from the size search needs to see that it is a filter, and
  // needs the same one tap to drop it.
  const chips = tireFilterChips(filters, FACET_LABELS).map((chip) => ({
    id: chip.id,
    label: chip.label,
    onRemove: () => onFilterChange(chip.next),
  }));
  if (hasSize) {
    chips.push({
      id: "size",
      label: sizeLabel,
      onRemove: () => write({ ...current, partial: NO_PARTIAL }),
    });
  }

  // Everything drops in one URL write.
  const clearAllFilters = () =>
    write({
      ...current,
      filters: { ...EMPTY_TIRE_FILTERS },
      partial: NO_PARTIAL,
    });

  // The finder shows first, while nothing is saved (and in the prerendered
  // page, which never knows); once a vehicle or size is saved, Shop Tires
  // lands straight on the results and "Change" brings it back, prefilled.
  const showFinder = !ready || !selection || changer.open;
  const finderInitial = useMemo(() => {
    if (!changer.open || !selection) return undefined;
    if (selection.type === "size" || changer.tab === "size") {
      const r = readSize(selection.size ?? "");
      return {
        tab: "size",
        width: r?.width ?? "",
        aspect: r?.aspect ?? "",
        diameter: r?.rimDiameter ?? "",
      };
    }
    return {
      tab: "vehicle",
      year: selection.year,
      make: selection.make,
      model: selection.model,
    };
  }, [changer.open, changer.tab, selection]);
  const finderRef = useRef(null);
  useEffect(() => {
    if (!changer.open || changer.nonce === 0) return;
    const el = finderRef.current;
    if (!el) return;
    el.scrollIntoView({ block: "start", behavior: "smooth" });
    el.querySelector("select, input")?.focus({ preventScroll: true });
  }, [changer.open, changer.nonce]);

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
          description={`${brandSentence} tires from TireDrop, shipped anywhere in the continental US.`}
        />
        <PageHero
          eyebrow="Tires"
          title="Shop Tires by Brand"
          lede={`${brandSentence} tires in one catalog, shipped direct from a distributor warehouse anywhere in the continental US.`}
        />
        <Breadcrumbs
          trail={[{ label: "Tires", to: "/tires" }, { label: "Brands" }]}
        />
        <Section>
          <SectionHead
            eyebrow="Brands"
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
                  to={`/tires?brand=${slug(brand)}`}
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
        description={`Shop ${brandSentence} tires by vehicle or by size. Shipped anywhere in the continental US, or free to our South Florida shop.`}
      />
      <PageHero
        eyebrow="Tires"
        title="Shop Tires"
        lede="Find your size, pick your set, then choose where it lands at checkout — your address anywhere in the continental US, or free to our South Florida shop where we fit them for you."
      />
      <Breadcrumbs trail={[{ label: "Tires" }]} />

      {showFinder && (
        <div
          ref={finderRef}
          className="wrap mt-6 scroll-mt-[calc(var(--header-h)+1rem)] md:-mt-8"
          data-testid="tire-finder"
        >
          <SearchPanel
            key={changer.open ? `change-${changer.nonce}` : "first"}
            kind="tire"
            onSearch={onSearch}
            initial={finderInitial}
            onCancel={ready && selection ? closeChanger : undefined}
          />
        </div>
      )}

      <Section>
        <ShoppingForBar className="mb-8" inline={false} />

        {/* Block flow below `lg`: the sidebar is a drawer there, so the
            aside renders nothing and a grid row would leave its gap behind
            as dead space above the results. */}
        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
          <aside aria-label="Filter tires">
            <TireFilters
              value={filters}
              onChange={onFilterChange}
              onClearAll={clearAllFilters}
              open={filtersOpen}
              onOpenChange={setFiltersOpen}
              resultCount={shown}
              facets={facets}
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
                aria-haspopup="dialog"
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
                onChange={(e) => write({ ...current, sort: e.target.value })}
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
                  {showFit ? fitting.length : results.length}{" "}
                  {(showFit ? fitting.length : results.length) === 1
                    ? "tire"
                    : "tires"}
                </span>{" "}
                {showFit ? (
                  <>
                    in {fitSize}
                    {others.length > 0 && <> · {others.length} other sizes</>}
                  </>
                ) : (
                  <>of {pool.length}</>
                )}
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
                  onChange={(e) => write({ ...current, sort: e.target.value })}
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
                lede="Try widening the price range or clearing a size. If you know your size and cannot find it listed, call us — we can order sizes this page does not carry."
                action={
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="btn-primary btn-sm min-h-[44px]"
                    >
                      Clear filters
                    </button>
                    <a href={BUSINESS.phoneHref} className="btn-outline btn-sm">
                      <Phone size={16} aria-hidden />
                      Call {BUSINESS.phone}
                    </a>
                  </div>
                }
              />
            ) : showFit ? (
              <div className="space-y-10">
                <section aria-labelledby="fits-heading">
                  <h2
                    id="fits-heading"
                    className="h3 mb-1 text-[1.25rem] md:text-[1.375rem]"
                  >
                    {fitHeading}
                  </h2>
                  <p className="mb-4 text-sm text-smoke">{fitLede}</p>
                  {fitting.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                      {fitting.map((tire) => (
                        <ProductCard key={tire.id} product={tire} />
                      ))}
                    </div>
                  ) : activeFilterCount > 0 || hasSize ? (
                    <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm leading-relaxed text-ink">
                        No tires in {fitSize} match these filters. Clear them
                        to see every tire in your size, or call and we will
                        quote one.
                      </p>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={clearAllFilters}
                          className="btn-primary btn-sm min-h-[44px]"
                        >
                          Clear filters
                        </button>
                        <a
                          href={BUSINESS.phoneHref}
                          className="btn-outline btn-sm min-h-[44px]"
                        >
                          <Phone size={16} aria-hidden />
                          Call {BUSINESS.phone}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm leading-relaxed text-ink">
                        Nothing on this page comes in {fitSize} right now. We
                        can order it — call with the size and we will quote it.
                      </p>
                      <a
                        href={BUSINESS.phoneHref}
                        className="btn-primary btn-sm shrink-0"
                      >
                        <Phone size={16} aria-hidden />
                        {BUSINESS.phone}
                      </a>
                    </div>
                  )}
                </section>

                {others.length > 0 && (
                  <section aria-labelledby="others-heading">
                    <h2
                      id="others-heading"
                      className="h3 mb-1 text-[1.25rem] md:text-[1.375rem]"
                    >
                      Other sizes we stock
                    </h2>
                    <p className="mb-4 text-sm text-smoke">
                      These are not {fitSize}, so they don&rsquo;t match what
                      you&rsquo;re shopping for. Each one says so on its card.
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                      {others.map((tire) => (
                        <ProductCard key={tire.id} product={tire} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
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
