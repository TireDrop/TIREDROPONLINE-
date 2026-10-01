import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Car, Ruler, Search } from "lucide-react";

import {
  VEHICLE_DATA,
  VEHICLE_MAKES,
  TIRE_WIDTHS,
  TIRE_ASPECTS,
  TIRE_DIAMETERS,
  WHEELS,
  WHEEL_DIAMETERS,
} from "../../data/products.js";
import {
  OTHER,
  OTHER_LABEL,
  YEARS as ALL_YEARS,
  makesFor,
  useVehicleModels,
} from "../../data/vehicles.js";
import { useVehicle } from "../../context/VehicleContext.jsx";
import { trackEvent } from "../../lib/analytics.js";

// The storefront's primary finder. Tab one narrows by vehicle, tab two by the
// numbers stamped on the sidewall (or, on the wheel catalog, by rim size).
// `?search=vehicle` / `?search=size` from the nav pre-selects a tab.
//
// `vehicles="all"` (the home page hero) offers every make and model year
// 1981-2027, with models loaded live from NHTSA and an "Other / not listed"
// choice, like the theme's hero finder. The default keeps the catalog's own
// make/model table, which every listing page can size.
//
// Only the visible panel is mounted, so `aria-controls` is set on the selected
// tab alone: pointing it at an id that is not in the document is a dangling
// ARIA reference rather than a useful one.

const SELECT = "field appearance-none bg-bone pr-8";
const TAB_ICON = "h-4 w-4 shrink-0 md:h-[18px] md:w-[18px]";

function Field({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  extra,
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
        {extra}
      </select>
    </div>
  );
}

export default function SearchPanel({
  kind = "tire",
  vehicles = "catalog",
  onSearch,
}) {
  const [params] = useSearchParams();
  const requested = params.get("search");
  const [tab, setTab] = useState(requested === "size" ? "size" : "vehicle");
  const [error, setError] = useState("");

  const { selectVehicle } = useVehicle();
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");

  const [width, setWidth] = useState("");
  const [aspect, setAspect] = useState("");
  const [diameter, setDiameter] = useState("");

  // Keep the visible tab in step with the nav links that deep-link into it.
  useEffect(() => {
    if (requested === "size" || requested === "vehicle") {
      setTab(requested);
      setError("");
    }
  }, [requested]);

  const allVehicles = vehicles === "all";

  const catalogYears = useMemo(() => {
    const set = new Set();
    Object.values(VEHICLE_DATA).forEach((models) =>
      Object.values(models).forEach((list) => list.forEach((y) => set.add(y))),
    );
    return [...set].sort((a, b) => b - a);
  }, []);
  const catalogModels = useMemo(
    () => (make ? Object.keys(VEHICLE_DATA[make] || {}) : []),
    [make],
  );

  // Every make sold in the chosen year, and that year's models from NHTSA.
  const liveMakes = useMemo(() => makesFor(year), [year]);
  const years = allVehicles ? ALL_YEARS : catalogYears;
  const makes = allVehicles ? liveMakes : VEHICLE_MAKES;
  // A pick survives a year change only while the new year still lists it.
  const makeValue = !allVehicles || makes.includes(make) ? make : "";
  const live = useVehicleModels(
    allVehicles ? makeValue : "",
    allVehicles ? year : "",
  );
  const models = allVehicles ? live.models : catalogModels;
  const modelValue =
    !allVehicles || (makeValue && (model === OTHER || models.includes(model)))
      ? model
      : "";
  const modelReady = allVehicles
    ? Boolean(year && makeValue && !live.loading)
    : Boolean(make);
  const modelPlaceholder = allVehicles
    ? live.loading
      ? "Loading models…"
      : "Select model"
    : make
      ? "Select model"
      : "Select a make first";

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
    if (!year || !makeValue || !modelValue) {
      setError("Choose a year, make and model to see what fits.");
      return;
    }
    setError("");
    // The vehicle being shopped for from here on (every tire shows whether
    // it fits), remembered so checkout and the booking form start from it.
    selectVehicle({ year, make: makeValue, model: modelValue });
    trackEvent("search", {
      search_type: "vehicle",
      search_term: [year, makeValue, modelValue].join(" "),
    });
    onSearch({ type: "vehicle", year, make: makeValue, model: modelValue });
  };

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

  return (
    <div className="overflow-hidden rounded-card border border-ink/10 bg-bone shadow-lift">
      <div role="tablist" aria-label="Product finder" className="flex">
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

      <div className="bg-bone p-5 md:p-6">
        {tab === "vehicle" ? (
          <form
            id="finder-panel-vehicle"
            role="tabpanel"
            aria-labelledby="finder-tab-vehicle"
            onSubmit={submitVehicle}
          >
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
              <Field
                id="finder-model"
                label="Model"
                value={modelReady ? modelValue : ""}
                onChange={setModel}
                options={modelReady ? models : []}
                placeholder={modelPlaceholder}
                disabled={!modelReady}
                extra={
                  allVehicles && modelReady ? (
                    <option value={OTHER}>{OTHER_LABEL}</option>
                  ) : null
                }
              />
            </div>
            <button
              type="submit"
              className="btn-primary mt-4 min-h-[48px] w-full whitespace-nowrap sm:w-auto"
            >
              <Search size={18} aria-hidden />
              Find {isWheel ? "Wheels" : "Tires"}
            </button>
            <p className="mt-3 text-xs leading-relaxed text-smoke">
              We match your vehicle to the sizes that fit. Not sure? Call us and
              read the sidewall to us.
            </p>
          </form>
        ) : (
          <form
            id="finder-panel-size"
            role="tabpanel"
            aria-labelledby="finder-tab-size"
            onSubmit={submitSize}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                id="finder-width"
                label={isWheel ? "Wheel Width" : "Width"}
                value={width}
                onChange={setWidth}
                options={isWheel ? wheelWidths : TIRE_WIDTHS}
                placeholder={isWheel ? "Any width" : "Any width"}
              />
              <Field
                id="finder-aspect"
                label={isWheel ? "Bolt Pattern" : "Aspect Ratio"}
                value={aspect}
                onChange={setAspect}
                options={isWheel ? boltPatterns : TIRE_ASPECTS}
                placeholder={isWheel ? "Any pattern" : "Any ratio"}
              />
              <Field
                id="finder-diameter"
                label={isWheel ? "Diameter" : "Rim Diameter"}
                value={diameter}
                onChange={setDiameter}
                options={isWheel ? WHEEL_DIAMETERS : TIRE_DIAMETERS}
                placeholder="Any diameter"
              />
            </div>
            <button
              type="submit"
              className="btn-primary mt-4 min-h-[48px] w-full whitespace-nowrap sm:w-auto"
            >
              <Search size={18} aria-hidden />
              Search Sizes
            </button>
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
