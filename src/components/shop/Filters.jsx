import React, { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

// Controlled filter panel shared by the tire and wheel catalogs.
// `value` is the full filter state, `onChange` receives the next state,
// `facets` supplies the options available for the current catalog.

const RATING_OPTIONS = [
  { label: "Any rating", value: 0 },
  { label: "4.0 & up", value: 4 },
  { label: "4.5 & up", value: 4.5 },
];

function FilterGroup({ title, children }) {
  return (
    <fieldset className="border-t border-ink/10 py-5 first:border-t-0 first:pt-0">
      <legend className="label mb-3 p-0">{title}</legend>
      {children}
    </fieldset>
  );
}

function CheckRow({ label, checked, onChange, name }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-ink">
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

export default function Filters({ value, onChange, facets }) {
  const [open, setOpen] = useState(false);
  const isWheel = facets.kind === "wheel";

  const toggleIn = (key, item) => {
    const list = value[key] || [];
    const next = list.includes(item)
      ? list.filter((x) => x !== item)
      : [...list, item];
    onChange({ ...value, [key]: next });
  };

  const activeCount =
    (value.brands?.length || 0) +
    (value.categories?.length || 0) +
    (value.diameters?.length || 0) +
    (value.finishes?.length || 0) +
    (value.minPrice ? 1 : 0) +
    (value.maxPrice ? 1 : 0) +
    (value.minRating ? 1 : 0);

  const clearAll = () =>
    onChange({
      brands: [],
      categories: [],
      diameters: [],
      finishes: [],
      minPrice: "",
      maxPrice: "",
      minRating: 0,
    });

  return (
    <div>
      {/* Mobile disclosure — the panel is always rendered on large screens. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="shop-filters"
        className="btn-outline btn-sm w-full lg:hidden"
      >
        {open ? <X size={16} aria-hidden /> : <SlidersHorizontal size={16} aria-hidden />}
        {open ? "Hide Filters" : "Filter Results"}
        {activeCount > 0 && !open && (
          <span className="rounded-sm bg-drop px-1.5 text-xs text-bone">
            {activeCount}
          </span>
        )}
      </button>

      <div
        id="shop-filters"
        className={`${open ? "mt-4 block" : "hidden"} card p-5 lg:mt-0 lg:block`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="h3">Filter</h2>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="font-display text-xs uppercase tracking-[0.15em] text-drop hover:text-dive"
            >
              Clear all
            </button>
          )}
        </div>

        <FilterGroup title="Brand">
          <div className="max-h-56 overflow-y-auto pr-1">
            {facets.brands.map((b) => (
              <CheckRow
                key={b}
                name="brand"
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
              name="category"
              label={c}
              checked={value.categories?.includes(c) || false}
              onChange={() => toggleIn("categories", c)}
            />
          ))}
        </FilterGroup>

        <FilterGroup title="Price per unit">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label htmlFor="filter-min-price" className="sr-only">
                Minimum price
              </label>
              <input
                id="filter-min-price"
                type="number"
                inputMode="numeric"
                min="0"
                placeholder={`$${facets.priceMin}`}
                value={value.minPrice ?? ""}
                onChange={(e) =>
                  onChange({ ...value, minPrice: e.target.value })
                }
                className="field"
              />
            </div>
            <span aria-hidden className="text-smoke">
              –
            </span>
            <div className="flex-1">
              <label htmlFor="filter-max-price" className="sr-only">
                Maximum price
              </label>
              <input
                id="filter-max-price"
                type="number"
                inputMode="numeric"
                min="0"
                placeholder={`$${facets.priceMax}`}
                value={value.maxPrice ?? ""}
                onChange={(e) =>
                  onChange({ ...value, maxPrice: e.target.value })
                }
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
                  className={`rounded-sm border px-3 py-1.5 font-display text-sm uppercase transition-colors ${
                    active
                      ? "border-drop bg-drop text-bone"
                      : "border-ink/15 text-ink hover:border-ink"
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
                name="finish"
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
              className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-ink"
            >
              <input
                type="radio"
                name="min-rating"
                value={opt.value}
                checked={Number(value.minRating || 0) === opt.value}
                onChange={() => onChange({ ...value, minRating: opt.value })}
                className="h-4 w-4 shrink-0 accent-drop"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </FilterGroup>
      </div>
    </div>
  );
}
