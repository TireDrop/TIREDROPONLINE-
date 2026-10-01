import React, { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

import { EMPTY_TIRE_FILTERS } from "../../lib/tiresUrl.js";

// The /tires filters: a sidebar of collapsible groups above `lg`, and below
// it a full-height sheet the page's "Filters (n)" button opens, with "Show N
// tires" and "Clear all" pinned to its foot. Controlled: `value` is the
// filter state (src/lib/tiresUrl.js), `onChange` gets the next one, and
// `facets` (facetCounts in src/data/tireFacets.js) lists only the options
// the tires on the page carry data for, each with its live count. A group
// with nothing to offer is not drawn.
//
// The wheel catalog keeps its own panel (Filters.jsx).

export function countTireFilters(v = {}) {
  return (
    (v.seasons?.length || 0) +
    (v.types?.length || 0) +
    (v.brands?.length || 0) +
    (v.categories?.length || 0) +
    (v.diameters?.length || 0) +
    (v.minPrice || v.maxPrice ? 1 : 0) +
    (v.speed ? 1 : 0) +
    (v.load ? 1 : 0) +
    (v.loadRanges?.length || 0) +
    (v.runFlat ? 1 : 0) +
    (v.warranty ? 1 : 0)
  );
}

/**
 * One removable chip per active filter, each carrying the state it leaves
 * behind. `labels` maps season and type values to their words.
 */
export function tireFilterChips(v, labels = {}) {
  const chips = [];
  const drop = (key, item) => ({
    ...v,
    [key]: v[key].filter((x) => x !== item),
  });
  v.seasons.forEach((s) =>
    chips.push({ id: `season-${s}`, label: labels[s] ?? s, next: drop("seasons", s) }),
  );
  v.types.forEach((t) =>
    chips.push({ id: `type-${t}`, label: labels[t] ?? t, next: drop("types", t) }),
  );
  v.brands.forEach((b) =>
    chips.push({ id: `brand-${b}`, label: b, next: drop("brands", b) }),
  );
  v.categories.forEach((c) =>
    chips.push({ id: `cat-${c}`, label: c, next: drop("categories", c) }),
  );
  if (v.minPrice || v.maxPrice) {
    chips.push({
      id: "price",
      label:
        v.minPrice && v.maxPrice
          ? `$${v.minPrice}–$${v.maxPrice} per tire`
          : v.minPrice
            ? `From $${v.minPrice} per tire`
            : `Up to $${v.maxPrice} per tire`,
      next: { ...v, minPrice: "", maxPrice: "" },
    });
  }
  if (v.speed)
    chips.push({ id: "speed", label: `Speed ${v.speed} or higher`, next: { ...v, speed: "" } });
  if (v.load)
    chips.push({ id: "load", label: `Load index ${v.load}+`, next: { ...v, load: "" } });
  v.loadRanges.forEach((r) =>
    chips.push({
      id: `lr-${r}`,
      label: r === "XL" ? "XL (extra load)" : `Load range ${r}`,
      next: drop("loadRanges", r),
    }),
  );
  if (v.runFlat)
    chips.push({ id: "runflat", label: "Run-flat", next: { ...v, runFlat: false } });
  if (v.warranty)
    chips.push({
      id: "warranty",
      label: `${Number(v.warranty).toLocaleString("en-US")}+ mile warranty`,
      next: { ...v, warranty: "" },
    });
  v.diameters.forEach((d) =>
    chips.push({ id: `dia-${d}`, label: `${d}" rim`, next: drop("diameters", d) }),
  );
  return chips;
}

/* ------------------------------------------------------------------ *
 * Pieces
 * ------------------------------------------------------------------ */

function Group({ id, title, active = 0, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen || active > 0);
  return (
    <div className="border-t border-ink/10 first:border-t-0">
      <h3 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-body`}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-[44px] w-full items-center justify-between gap-2 py-2 text-left font-display text-[14px] font-bold text-ink hover:text-drop"
        >
          <span className="flex items-center gap-2">
            {title}
            {active > 0 && (
              <span className="tnum inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-drop px-1.5 text-[11px] leading-none text-bone">
                {active}
                <span className="sr-only"> selected</span>
              </span>
            )}
          </span>
          <ChevronDown
            size={18}
            aria-hidden
            className={`shrink-0 text-smoke transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </h3>
      <fieldset id={`${id}-body`} hidden={!open} className="m-0 border-0 p-0 pb-4">
        <legend className="sr-only">{title}</legend>
        {children}
      </fieldset>
    </div>
  );
}

function Count({ n }) {
  return (
    <span className="tnum ml-auto pl-2 text-xs text-smoke">
      <span aria-hidden>{n}</span>
      <span className="sr-only">, {n} {n === 1 ? "tire" : "tires"}</span>
    </span>
  );
}

const ROW =
  "flex min-h-[44px] cursor-pointer items-center gap-3 text-[14px] text-ink transition-colors hover:text-drop";
const BOX = "h-[18px] w-[18px] shrink-0 accent-drop";

function Checks({ name, options, selected, onToggle }) {
  return (
    <div>
      {options.map((o) => (
        <label key={o.value} className={`${ROW} ${o.count === 0 ? "text-smoke" : ""}`}>
          <input
            type="checkbox"
            name={name}
            value={o.value}
            checked={selected.includes(o.value)}
            onChange={() => onToggle(o.value)}
            className={BOX}
          />
          <span>{o.label}</span>
          <Count n={o.count} />
        </label>
      ))}
    </div>
  );
}

function Minimum({ name, options, value, onPick, anyLabel = "Any" }) {
  return (
    <div>
      <label className={ROW}>
        <input
          type="radio"
          name={name}
          value=""
          checked={!value}
          onChange={() => onPick("")}
          className={BOX}
        />
        <span>{anyLabel}</span>
      </label>
      {options.map((o) => (
        <label key={o.value} className={`${ROW} ${o.count === 0 ? "text-smoke" : ""}`}>
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onPick(o.value)}
            className={BOX}
          />
          <span>{o.label}</span>
          <Count n={o.count} />
        </label>
      ))}
    </div>
  );
}

/**
 * Price per tire: a two-handled slider and the same two numbers typed. What
 * is being dragged or typed stays local and reaches the URL once it settles,
 * so the address bar is not rewritten on every pixel.
 */
function PriceRange({ idPrefix, bounds, value, onCommit }) {
  const base = `${value.minPrice}|${value.maxPrice}`;
  const [draft, setDraft] = useState({ base, lo: value.minPrice, hi: value.maxPrice });
  // A change from outside (a chip, Clear all, the back button) wins.
  const cur = draft.base === base ? draft : { base, lo: value.minPrice, hi: value.maxPrice };
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const set = (lo, hi, wait = 400) => {
    setDraft({ base, lo, hi });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onCommit(lo, hi), wait);
  };

  const { min, max } = bounds;
  const loNum = cur.lo === "" ? min : Math.max(min, Math.min(max, Number(cur.lo)));
  const hiNum = cur.hi === "" ? max : Math.max(min, Math.min(max, Number(cur.hi)));
  const pct = (n) => ((n - min) / Math.max(1, max - min)) * 100;

  return (
    <div>
      <div className="dual-range relative h-11">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-ink/10" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-drop"
          style={{ left: `${pct(loNum)}%`, right: `${100 - pct(hiNum)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={loNum}
          aria-label="Lowest price per tire"
          aria-valuetext={`$${loNum}`}
          onChange={(e) => {
            const n = Math.min(Number(e.target.value), hiNum);
            set(n <= min ? "" : String(n), cur.hi);
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={hiNum}
          aria-label="Highest price per tire"
          aria-valuetext={`$${hiNum}`}
          onChange={(e) => {
            const n = Math.max(Number(e.target.value), loNum);
            set(cur.lo, n >= max ? "" : String(n));
          }}
        />
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div className="flex-1">
          <label htmlFor={`${idPrefix}-min-price`} className="label mb-1">
            Min $
          </label>
          <input
            id={`${idPrefix}-min-price`}
            type="number"
            inputMode="numeric"
            min="0"
            placeholder={String(min)}
            value={cur.lo}
            onChange={(e) => set(e.target.value.replace(/\D/g, "").slice(0, 5), cur.hi, 700)}
            className="field min-h-[44px]"
          />
        </div>
        <span aria-hidden className="mt-5 text-smoke">
          –
        </span>
        <div className="flex-1">
          <label htmlFor={`${idPrefix}-max-price`} className="label mb-1">
            Max $
          </label>
          <input
            id={`${idPrefix}-max-price`}
            type="number"
            inputMode="numeric"
            min="0"
            placeholder={String(max)}
            value={cur.hi}
            onChange={(e) => set(cur.lo, e.target.value.replace(/\D/g, "").slice(0, 5), 700)}
            className="field min-h-[44px]"
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The facets
 * ------------------------------------------------------------------ */

function Facets({ idPrefix, value, onChange, facets }) {
  const toggle = (key) => (item) => {
    const list = value[key];
    onChange({
      ...value,
      [key]: list.includes(item) ? list.filter((x) => x !== item) : [...list, item],
    });
  };
  const id = (g) => `${idPrefix}-${g}`;

  return (
    <>
      {facets.seasons && (
        <Group id={id("season")} title="Season" active={value.seasons.length} defaultOpen>
          <Checks name={id("season")} options={facets.seasons} selected={value.seasons} onToggle={toggle("seasons")} />
        </Group>
      )}
      {facets.types && (
        <Group id={id("type")} title="Tire type" active={value.types.length} defaultOpen>
          <Checks name={id("type")} options={facets.types} selected={value.types} onToggle={toggle("types")} />
        </Group>
      )}
      {facets.brands && (
        <Group id={id("brand")} title="Brand" active={value.brands.length} defaultOpen>
          <Checks name={id("brand")} options={facets.brands} selected={value.brands} onToggle={toggle("brands")} />
        </Group>
      )}
      {facets.price && facets.price.max > facets.price.min && (
        <Group
          id={id("price")}
          title="Price per tire"
          active={value.minPrice || value.maxPrice ? 1 : 0}
          defaultOpen
        >
          <PriceRange
            idPrefix={id("price")}
            bounds={facets.price}
            value={value}
            onCommit={(lo, hi) => onChange({ ...value, minPrice: lo, maxPrice: hi })}
          />
        </Group>
      )}
      {facets.speed && (
        <Group id={id("speed")} title="Speed rating" active={value.speed ? 1 : 0}>
          <Minimum
            name={id("speed")}
            options={facets.speed}
            value={value.speed}
            onPick={(speed) => onChange({ ...value, speed })}
          />
        </Group>
      )}
      {facets.load && (
        <Group id={id("load")} title="Load index" active={value.load ? 1 : 0}>
          <Minimum
            name={id("load")}
            options={facets.load}
            value={value.load}
            onPick={(load) => onChange({ ...value, load })}
          />
        </Group>
      )}
      {(facets.loadRanges || facets.runFlat) && (
        <Group
          id={id("build")}
          title={
            [
              facets.loadRanges?.some((o) => o.value !== "XL") && "Load range",
              facets.loadRanges?.some((o) => o.value === "XL") && "XL",
              facets.runFlat && "Run-flat",
            ]
              .filter(Boolean)
              .join(" / ")
          }
          active={value.loadRanges.length + (value.runFlat ? 1 : 0)}
        >
          {facets.loadRanges && (
            <Checks
              name={id("load-range")}
              options={facets.loadRanges}
              selected={value.loadRanges}
              onToggle={toggle("loadRanges")}
            />
          )}
          {facets.runFlat && (
            <label className={ROW}>
              <input
                type="checkbox"
                checked={value.runFlat}
                onChange={() => onChange({ ...value, runFlat: !value.runFlat })}
                className={BOX}
              />
              <span>Run-flat only</span>
              <Count n={facets.runFlat.count} />
            </label>
          )}
        </Group>
      )}
      {facets.warranty && (
        <Group id={id("warranty")} title="Treadwear warranty" active={value.warranty ? 1 : 0}>
          <Minimum
            name={id("warranty")}
            options={facets.warranty}
            value={value.warranty}
            onPick={(warranty) => onChange({ ...value, warranty })}
          />
        </Group>
      )}
      {facets.categories && (
        <Group id={id("category")} title="Category" active={value.categories.length}>
          <Checks
            name={id("category")}
            options={facets.categories}
            selected={value.categories}
            onToggle={toggle("categories")}
          />
        </Group>
      )}
      {facets.diameters && (
        <Group id={id("rim")} title="Rim diameter" active={value.diameters.length}>
          <Checks
            name={id("rim")}
            options={facets.diameters}
            selected={value.diameters}
            onToggle={toggle("diameters")}
          />
        </Group>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Sidebar + sheet
 * ------------------------------------------------------------------ */

export default function TireFilters({
  value,
  onChange,
  onClearAll,
  facets,
  open = false,
  onOpenChange,
  resultCount = 0,
}) {
  const activeCount = countTireFilters(value);
  const close = () => onOpenChange?.(false);
  const clearAll = () => (onClearAll ? onClearAll() : onChange({ ...EMPTY_TIRE_FILTERS }));
  const noun = resultCount === 1 ? "tire" : "tires";
  const titleId = useId();
  const closeButtonRef = useRef(null);

  // While the sheet is up it owns the screen: the page behind it does not
  // scroll, Escape closes it, and focus moves in (it is aria-modal) and
  // goes back to the Filters button after.
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
      <div className="card hidden p-5 lg:block" data-testid="tire-filters">
        <div className="mb-2 flex items-center justify-between gap-3">
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
              className="min-h-[44px] font-display text-[13px] font-bold text-drop underline-offset-4 hover:text-dive hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <p className="tnum mb-3 text-sm text-smoke">
          <span className="font-semibold text-ink">{resultCount}</span> {noun}
        </p>
        <Facets idPrefix="tf" value={value} onChange={onChange} facets={facets} />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            tabIndex={-1}
            onClick={close}
            className="absolute inset-0 h-full w-full bg-ink/50"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            data-testid="tire-filter-sheet"
            className="absolute inset-0 flex flex-col bg-bone shadow-lift sm:left-auto sm:w-full sm:max-w-sm"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink/10 px-5 py-2">
              <h2 id={titleId} className="h3 text-[1.125rem]">
                Filter tires
              </h2>
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

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">
              <Facets idPrefix="tf-sheet" value={value} onChange={onChange} facets={facets} />
            </div>

            <div className="flex shrink-0 items-center gap-3 border-t border-ink/10 bg-bone px-5 py-3 shadow-[0_-8px_20px_-14px_rgba(7,14,26,.4)]" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
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
                <span aria-live="polite">
                  Show {resultCount} {noun}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
