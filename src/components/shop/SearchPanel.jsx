import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Car, Ruler, Search } from "lucide-react";

import {
  TIRE_WIDTHS,
  TIRE_ASPECTS,
  TIRE_DIAMETERS,
  WHEELS,
  WHEEL_DIAMETERS,
} from "../../data/products.js";
import {
  YEARS as ALL_YEARS,
  makesFor,
  useVehicleModels,
} from "../../data/vehicles.js";
import { useVehicle } from "../../context/VehicleContext.jsx";
import { trackEvent } from "../../lib/analytics.js";
import ModelCombobox, { listedModel } from "./ModelCombobox.jsx";

// The storefront's primary finder. Tab one narrows by vehicle, tab two by the
// numbers stamped on the sidewall (or, on the wheel catalog, by rim size).
// `?search=vehicle` / `?search=size` from the nav pre-selects a tab.
//
// The vehicle tab offers every model year 1981-2027, every make sold that
// year, and that year's models from NHTSA (src/data/vehicles.js: our cached
// /api/vehicles first), the same lists as every other vehicle picker on the
// site. The Model box filters as you type (ModelCombobox.jsx), and a model
// the list does not carry can be typed: it is searched as typed, its tires
// say "Check fitment", and the door-jamb size settles it. When the list
// cannot be loaded the panel says so and offers exactly that.
//
// `onEnterSize` is what "enter your door-jamb size" does; by default it
// switches to the size tab (/tires opens the Shopping-for bar's door-jamb
// form instead).
//
// Only the visible panel is mounted, so `aria-controls` is set on the selected
// tab alone: pointing it at an id that is not in the document is a dangling
// ARIA reference rather than a useful one.
//
// `initial` prefills it ({ tab, year, make, model, width, aspect, diameter }),
// for /tires reopening it on "Change"; a prefilled value the lists do not
// carry is added to its list so it still shows. `onCancel` adds a Cancel
// button beside the search one.

/** `options`, plus `value` when it is set and not already one of them. */
const withValue = (options, value, order) => {
  if (!value || options.some((o) => String(o) === String(value))) return options;
  const out = [value, ...options];
  return order ? out.sort(order) : out;
};
const up = (a, b) => Number(a) - Number(b);
const down = (a, b) => Number(b) - Number(a);

const SELECT = "field appearance-none bg-bone pr-8";
const TAB_ICON = "h-4 w-4 shrink-0 md:h-[18px] md:w-[18px]";

/** A typed model as it can go in a URL (src/lib/tiresUrl.js). */
const cleanModel = (s) =>
  String(s ?? "")
    .replace(/[^a-z0-9 .&'+/-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);

function Field({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={SELECT}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function SearchPanel({
  kind = "tire",
  onSearch,
  initial,
  onCancel,
  onEnterSize,
}) {
  const [params] = useSearchParams();
  const requested = params.get("search");
  const [tab, setTab] = useState(
    initial?.tab ?? (requested === "size" ? "size" : "vehicle"),
  );
  const [error, setError] = useState("");

  const { selectVehicle } = useVehicle();
  const [year, setYear] = useState(initial?.year ?? "");
  const [make, setMake] = useState(initial?.make ?? "");
  const [model, setModel] = useState(initial?.model ?? "");

  const [width, setWidth] = useState(String(initial?.width ?? ""));
  const [aspect, setAspect] = useState(String(initial?.aspect ?? ""));
  const [diameter, setDiameter] = useState(String(initial?.diameter ?? ""));

  // Keep the visible tab in step with the nav links that deep-link into it.
  useEffect(() => {
    if (requested === "size" || requested === "vehicle") {
      setTab(requested);
      setError("");
    }
  }, [requested]);

  // Every make sold in the chosen year, and that year's models.
  const yearMakes = useMemo(() => makesFor(year), [year]);
  const years = withValue(ALL_YEARS, year, down);
  // A prefilled make stays listed while its year is unchanged.
  const makes = withValue(
    yearMakes,
    initial?.make && year === initial.year ? initial.make : "",
  );
  // A pick survives a year change only while the new year still lists it.
  const makeValue = makes.includes(make) ? make : "";
  const live = useVehicleModels(makeValue, year);
  const models = live.models;
  const modelText = makeValue ? model : "";
  const modelReady = Boolean(year && makeValue && !live.loading);
  const modelPlaceholder = !year || !makeValue
    ? "Pick a year and make first"
    : live.loading
      ? "Loading models…"
      : models.length
        ? "Type or pick a model"
        : "Type your model";
  const modelRef = useRef(null);

  const isWheel = kind === "wheel";
  const boltPatterns = useMemo(
    () => [...new Set(WHEELS.map((w) => w.boltPattern))].sort(),
    [],
  );
  const wheelWidths = useMemo(
    () => [...new Set(WHEELS.map((w) => w.wheelWidth))].sort((a, b) => a - b),
    [],
  );

  const sizeTabLabel = isWheel ? "Shop by Wheel Size" : "Shop by Tire Size";

  const submitVehicle = (e) => {
    e.preventDefault();
    // What the box shows, even if it got there without an input event
    // (browser automation, some autofill).
    const typed = cleanModel(modelRef.current?.value ?? modelText);
    if (!year || !makeValue || !typed || !modelReady) {
      setError("Choose a year, make and model to see what fits.");
      return;
    }
    setError("");
    // The list's spelling when it carries the model ("4 series" -> "4 Series").
    const modelValue = listedModel(models, typed) ?? typed;
    setModel(modelValue);
    // The vehicle being shopped for from here on (every tire shows whether
    // it fits), remembered so checkout and the booking form start from it.
    selectVehicle({ year, make: makeValue, model: modelValue });
    trackEvent("search", {
      search_type: "vehicle",
      search_term: [year, makeValue, modelValue].join(" "),
    });
    onSearch({ type: "vehicle", year, make: makeValue, model: modelValue });
  };

  const enterSize = () => {
    setError("");
    if (onEnterSize) onEnterSize();
    else setTab("size");
  };

  // Said under the fields when the full list could not be loaded.
  let modelNote = null;
  if (modelReady && live.source === "fallback") {
    modelNote = isWheel ? (
      <>Couldn&rsquo;t load models. Type your model.</>
    ) : (
      <>
        Couldn&rsquo;t load models. Type your model or{" "}
        <button
          type="button"
          onClick={enterSize}
          className="font-semibold text-ink underline underline-offset-4 hover:text-drop"
        >
          enter your door-jamb size
        </button>
        .
      </>
    );
  } else if (modelReady && live.source === "snapshot") {
    modelNote = (
      <>
        Couldn&rsquo;t load this year&rsquo;s models, so this is every{" "}
        {makeValue} model on file. Pick yours or type it.
      </>
    );
  }

  const submitSize = (e) => {
    e.preventDefault();
    if (!width && !aspect && !diameter) {
      setError(
        isWheel
          ? "Pick at least a diameter to search wheel sizes."
          : "Pick at least one number from your sidewall to search.",
      );
      return;
    }
    setError("");
    trackEvent("search", {
      search_type: isWheel ? "wheel_size" : "tire_size",
      search_term: isWheel
        ? `${diameter || "any"}x${width || "any"}`
        : `${width || "any"}/${aspect || "any"}R${diameter || "any"}`,
    });
    onSearch({ type: "size", width, aspect, diameter });
  };

  // Below md: tighter padding and a 16px icon. A label too long for its half
  // (English at 320px, a translated page at 390px: "Comprar por tamaño de
  // neumático") wraps inside it instead of being cut off by the card.
  // min-w-0 keeps the two halves equal; break-words splits a single word too
  // long for its half. md and up are unchanged.
  const tabClass = (id) =>
    `flex min-h-[48px] min-w-0 flex-1 items-center justify-center gap-[.4rem] break-words border-t-[3px] px-2 py-[.8rem] text-center font-display text-[14px] font-bold leading-tight tracking-[-0.008em] transition-colors md:gap-2 md:px-4 md:py-3.5 md:text-[15px] ${
      tab === id
        ? "border-drop bg-bone text-ink"
        : "border-transparent bg-steel text-bone/70 hover:bg-graphite hover:text-bone"
    }`;

  const cancel = onCancel ? (
    <button
      type="button"
      onClick={onCancel}
      className="btn-outline min-h-[48px] w-full whitespace-nowrap sm:w-auto"
    >
      Cancel
    </button>
  ) : null;

  return (
    // The tabs clip to the card's top corners themselves, so the Model list
    // can hang below the card's edge instead of being cut off by it.
    <div className="rounded-card border border-ink/10 bg-bone shadow-lift">
      <div
        role="tablist"
        aria-label="Product finder"
        className="flex overflow-hidden rounded-t-[11px]"
      >
        <button
          type="button"
          role="tab"
          id="finder-tab-vehicle"
          aria-selected={tab === "vehicle"}
          {...(tab === "vehicle"
            ? { "aria-controls": "finder-panel-vehicle" }
            : null)}
          onClick={() => {
            setTab("vehicle");
            setError("");
          }}
          className={tabClass("vehicle")}
        >
          <Car size={18} aria-hidden className={TAB_ICON} />
          Shop by Vehicle
        </button>
        <button
          type="button"
          role="tab"
          id="finder-tab-size"
          aria-selected={tab === "size"}
          {...(tab === "size"
            ? { "aria-controls": "finder-panel-size" }
            : null)}
          onClick={() => {
            setTab("size");
            setError("");
          }}
          className={tabClass("size")}
        >
          <Ruler size={18} aria-hidden className={TAB_ICON} />
          {sizeTabLabel}
        </button>
      </div>

      {/* The panel is the wrapper: a <form> may not take the tabpanel role. */}
      <div
        id={`finder-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`finder-tab-${tab}`}
        className="rounded-b-[11px] bg-bone p-5 md:p-6"
      >
        {tab === "vehicle" ? (
          <form onSubmit={submitVehicle}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                id="finder-year"
                label="Year"
                value={year}
                onChange={setYear}
                options={years}
                placeholder="Select year"
              />
              <Field
                id="finder-make"
                label="Make"
                value={makeValue}
                onChange={(v) => {
                  setMake(v);
                  setModel("");
                }}
                options={makes}
                placeholder="Select make"
              />
              <div>
                <label
                  id="finder-model-label"
                  htmlFor="finder-model"
                  className="label"
                >
                  Model
                </label>
                <ModelCombobox
                  ref={modelRef}
                  id="finder-model"
                  labelId="finder-model-label"
                  value={modelText}
                  onChange={(v) => {
                    setModel(v);
                    setError("");
                  }}
                  options={modelReady ? models : []}
                  placeholder={modelPlaceholder}
                  disabled={!modelReady}
                  busy={Boolean(year && makeValue && live.loading)}
                  describedBy={modelNote ? "finder-model-note" : undefined}
                  className="bg-bone"
                />
              </div>
            </div>
            <p
              id="finder-model-note"
              aria-live="polite"
              data-testid="finder-model-note"
              className={
                modelNote
                  ? "mt-3 text-sm leading-relaxed text-ink"
                  : "sr-only"
              }
            >
              {modelNote}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="btn-primary min-h-[48px] w-full whitespace-nowrap sm:w-auto"
              >
                <Search size={18} aria-hidden />
                Find {isWheel ? "Wheels" : "Tires"}
              </button>
              {cancel}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-smoke">
              We match your vehicle to the sizes that fit. Not sure? Call us and
              read the sidewall to us.
            </p>
          </form>
        ) : (
          <form onSubmit={submitSize}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                id="finder-width"
                label={isWheel ? "Wheel Width" : "Width"}
                value={width}
                onChange={setWidth}
                options={withValue(isWheel ? wheelWidths : TIRE_WIDTHS, width, up)}
                placeholder={isWheel ? "Any width" : "Any width"}
              />
              <Field
                id="finder-aspect"
                label={isWheel ? "Bolt Pattern" : "Aspect Ratio"}
                value={aspect}
                onChange={setAspect}
                options={withValue(isWheel ? boltPatterns : TIRE_ASPECTS, aspect, up)}
                placeholder={isWheel ? "Any pattern" : "Any ratio"}
              />
              <Field
                id="finder-diameter"
                label={isWheel ? "Diameter" : "Rim Diameter"}
                value={diameter}
                onChange={setDiameter}
                options={withValue(
                  isWheel ? WHEEL_DIAMETERS : TIRE_DIAMETERS,
                  diameter,
                  up,
                )}
                placeholder="Any diameter"
              />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="btn-primary min-h-[48px] w-full whitespace-nowrap sm:w-auto"
              >
                <Search size={18} aria-hidden />
                Search Sizes
              </button>
              {cancel}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-smoke">
              {isWheel
                ? "Wheel sizes read diameter by width, e.g. 18x8.5. Bolt pattern is stamped on the back of your current wheel."
                : "Your size is printed on the sidewall, e.g. 225/50R17 — that is a 225 width, 50 aspect ratio and a 17 inch rim."}
            </p>
          </form>
        )}

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-sm bg-sky px-3 py-2 text-sm font-medium text-ink"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
