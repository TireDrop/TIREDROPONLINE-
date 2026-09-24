import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

// Controlled filter panel shared by the tire and wheel catalogs.
// `value` is the full filter state, `onChange` receives the next state,
// `facets` supplies the options available for the current catalog.
//
// Above `lg` the panel is a static sidebar. Below it, the panel is a
// full-height drawer whose open state is owned by the page: the trigger that
// opens it lives in the sticky bar at the top of the results column, not
// beside the panel, so the state has to sit above both.

const RATING_OPTIONS = [
  { label: "Any rating", value: 0 },
  { label: "4.0 & up", value: 4 },
  { label: "4.5 & up", value: 4.5 },
];

/** The cleared state. Exported so a page's "Clear all" agrees with ours. */
export const EMPTY_FILTERS = {
  brands: [],
  categories: [],
  diameters: [],
  finishes: [],
  minPrice: "",
  maxPrice: "",
  minRating: 0,
};

export function countActiveFilters(value = {}) {
  return (
    (value.brands?.length || 0) +
    (value.categories?.length || 0) +
    (value.diameters?.length || 0) +
    (value.finishes?.length || 0) +
    (value.minPrice ? 1 : 0) +
    (value.maxPrice ? 1 : 0) +
    (value.minRating ? 1 : 0)
  );
}

/**
 * One removable chip per active facet, each carrying the filter state it
 * would leave behind. Building the next state here rather than in the pages
 * keeps the shape of a filter in the one file that knows it.
 */
export function activeFilterChips(value = {}) {
  const chips = [];
  const drop = (key, item) => ({
    ...value,
    [key]: (value[key] || []).filter((x) => x !== item),
  });

  (value.brands || []).forEach((b) =>
    chips.push({ id: `brand-${b}`, label: b, next: drop("brands", b) }),
  );
  (value.categories || []).forEach((c) =>
    chips.push({ id: `cat-${c}`, label: c, next: drop("categories", c) }),
  );
  (value.diameters || []).forEach((d) =>
    chips.push({ id: `dia-${d}`, label: `${d}"`, next: drop("diameters", d) }),
  );
  (value.finishes || []).forEach((f) =>
    chips.push({ id: `fin-${f}`, label: f, next: drop("finishes", f) }),
  );
  if (value.minPrice)
    chips.push({
      id: "minp",
      label: `From $${value.minPrice}`,
      next: { ...value, minPrice: "" },
    });
  if (value.maxPrice)
    chips.push({
      id: "maxp",
      label: `Up to $${value.maxPrice}`,
      next: { ...value, maxPrice: "" },
    });
  if (value.minRating)
    chips.push({
      id: "rating",
      label: `${value.minRating} & up`,
      next: { ...value, minRating: 0 },
    });

  return chips;
}

function FilterGroup({ title, children }) {
  return (
    <fieldset className="border-t border-ink/10 py-5 first:border-t-0 first:pt-0">
      <legend className="label mb-2.5 p-0 text-ink/70">{title}</legend>
      {children}
    </fieldset>
  );
}

function CheckRow({ label, checked, onChange, name }) {
  return (
    <label className="flex min-h-[36px] cursor-pointer items-center gap-2.5 py-1.5 text-sm text-ink transition-colors hover:text-drop">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 accent-drop"
      />
      <span>{label}</span>
    </label>
  );
}

/**
 * The facets themselves. Rendered twice — sidebar and drawer — so every id
 * and radio group name is namespaced; two elements sharing an id is a
 * genuine bug for a screen reader following a label.
 */
function FilterFacets({ idPrefix, value, onChange, facets }) {
  const isWheel = facets.kind === "wheel";

  const toggleIn = (key, item) => {
    const list = value[key] || [];
    const next = list.includes(item)
      ? list.filter((x) => x !== item)
      : [...list, item];
    onChange({ ...value, [key]: next });
  };

  return (
    <>
      <FilterGroup title="Brand">
        <div className="max-h-56 overflow-y-auto pr-1">
          {facets.brands.map((b) => (
            <CheckRow
              key={b}
              name={`${idPrefix}-brand`}
              label={b}
              checked={value.brands?.includes(b) || false}
              onChange={() => toggleIn("brands", b)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title={isWheel ? "Wheel Type" : "Tire Category"}>
        {facets.categories.map((c) => (
          <CheckRow
            key={c}
            name={`${idPrefix}-category`}
            label={c}
            checked={value.categories?.includes(c) || false}
            onChange={() => toggleIn("categories", c)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Price per unit">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label htmlFor={`${idPrefix}-min-price`} className="sr-only">
              Minimum price
            </label>
            <input
              id={`${idPrefix}-min-price`}
              type="number"
              inputMode="numeric"
              min="0"
              placeholder={`$${facets.priceMin}`}
              value={value.minPrice ?? ""}
              onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
              className="field"
            />
          </div>
          <span aria-hidden className="text-smoke">
            –
          </span>
          <div className="flex-1">
            <label htmlFor={`${idPrefix}-max-price`} className="sr-only">
              Maximum price
            </label>
            <input
              id={`${idPrefix}-max-price`}
              type="number"
              inputMode="numeric"
              min="0"
              placeholder={`$${facets.priceMax}`}
              value={value.maxPrice ?? ""}
              onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
              className="field"
            />
          </div>
        </div>
      </FilterGroup>

      <FilterGroup title={isWheel ? "Wheel Diameter" : "Rim Diameter"}>
        <div className="flex flex-wrap gap-2">
          {facets.diameters.map((d) => {
            const active = value.diameters?.includes(d) || false;
            return (
              <button
                key={d}
                type="button"
                aria-pressed={active}
                onClick={() => toggleIn("diameters", d)}
                className={`tnum min-h-[36px] min-w-[44px] rounded-sm border px-3 py-1.5 font-display text-sm font-bold transition-colors ${
                  active
                    ? "border-drop bg-drop text-bone shadow-glow"
                    : "border-ink/15 text-ink hover:border-ink hover:bg-fog"
                }`}
              >
                {d}"
              </button>
            );
          })}
        </div>
      </FilterGroup>

      {isWheel && (
        <FilterGroup title="Finish">
          {facets.finishes.map((f) => (
            <CheckRow
              key={f}
              name={`${idPrefix}-finish`}
              label={f}
              checked={value.finishes?.includes(f) || false}
              onChange={() => toggleIn("finishes", f)}
            />
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="Customer Rating">
        {RATING_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex min-h-[36px] cursor-pointer items-center gap-2.5 py-1.5 text-sm text-ink"
          >
            <input
              type="radio"
              name={`${idPrefix}-min-rating`}
              value={opt.value}
              checked={Number(value.minRating || 0) === opt.value}
              onChange={() => onChange({ ...value, minRating: opt.value })}
              className="h-4 w-4 shrink-0 accent-drop"
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </FilterGroup>
    </>
  );
}

export default function Filters({
  value,
  onChange,
  facets,
  open = false,
  onOpenChange,
  resultCount = 0,
  resultNoun = "results",
}) {
  const activeCount = countActiveFilters(value);
  const close = () => onOpenChange?.(false);
  const clearAll = () => onChange({ ...EMPTY_FILTERS });

  const closeButtonRef = useRef(null);

  // While the drawer is up it owns the screen: the page behind it must not
  // scroll away underneath, and Escape has to dismiss it. It also declares
  // `aria-modal`, which makes everything outside it inert to a screen reader
  // — so focus has to move inside, or the user is left on a trigger their
  // reader can no longer see.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onOpenChange?.(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, onOpenChange]);

  return (
    <>
      <div className="card hidden p-5 lg:block">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="h3 flex items-center gap-2 text-[1.125rem]">
            Filter
            {activeCount > 0 && (
              <span className="tnum inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-drop px-1.5 text-[11px] font-bold leading-none text-bone">
                {activeCount}
              </span>
            )}
          </h2>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="min-h-[24px] font-display text-[13px] font-bold text-drop underline-offset-4 hover:text-dive hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <FilterFacets
          idPrefix="filters"
          value={value}
          onChange={onChange}
          facets={facets}
        />
      </div>

      {/* The drawer is mounted only while open, so its inputs never sit in
          the tab order behind the page. */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={close}
            className="absolute inset-0 h-full w-full bg-ink/50"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filter results"
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-bone shadow-lift"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink/10 px-5 py-3">
              <h2 className="h3 text-[1.125rem]">Filter</h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                aria-label="Close filters"
                className="flex h-11 w-11 items-center justify-center rounded-sm text-ink hover:bg-fog"
              >
                <X size={20} aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <FilterFacets
                idPrefix="filters-drawer"
                value={value}
                onChange={onChange}
                facets={facets}
              />
            </div>

            {/* The footer is pinned so the two things a shopper wants next —
                see the results, or start over — are never a scroll away. */}
            <div className="flex shrink-0 items-center gap-3 border-t border-ink/10 bg-bone px-5 py-3 shadow-[0_-8px_20px_-14px_rgba(7,14,26,.4)]">
              <button
                type="button"
                onClick={clearAll}
                disabled={activeCount === 0}
                className="btn-outline btn-sm h-11 flex-1 whitespace-nowrap"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={close}
                className="btn-primary btn-sm h-11 flex-1 whitespace-nowrap"
              >
                Show {resultCount} {resultNoun}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
