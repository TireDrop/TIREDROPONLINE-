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

// The storefront's primary finder. Tab one narrows by vehicle, tab two by the
// numbers stamped on the sidewall (or, on the wheel catalog, by rim size).
// `?search=vehicle` / `?search=size` from the nav pre-selects a tab.

const SELECT = "field appearance-none bg-bone pr-8";

function Field({ id, label, value, onChange, options, placeholder, disabled }) {
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

export default function SearchPanel({ kind = "tire", onSearch }) {
  const [params] = useSearchParams();
  const requested = params.get("search");
  const [tab, setTab] = useState(requested === "size" ? "size" : "vehicle");
  const [error, setError] = useState("");

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

  const years = useMemo(() => {
    const set = new Set();
    Object.values(VEHICLE_DATA).forEach((models) =>
      Object.values(models).forEach((list) => list.forEach((y) => set.add(y)))
    );
    return [...set].sort((a, b) => b - a);
  }, []);

  const models = useMemo(
    () => (make ? Object.keys(VEHICLE_DATA[make] || {}) : []),
    [make]
  );

  const isWheel = kind === "wheel";
  const boltPatterns = useMemo(
    () => [...new Set(WHEELS.map((w) => w.boltPattern))].sort(),
    []
  );
  const wheelWidths = useMemo(
    () => [...new Set(WHEELS.map((w) => w.wheelWidth))].sort((a, b) => a - b),
    []
  );

  const sizeTabLabel = isWheel ? "Shop by Wheel Size" : "Shop by Tire Size";

  const submitVehicle = (e) => {
    e.preventDefault();
    if (!year || !make || !model) {
      setError("Choose a year, make and model to see what fits.");
      return;
    }
    setError("");
    onSearch({ type: "vehicle", year, make, model });
  };

  const submitSize = (e) => {
    e.preventDefault();
    if (!width && !aspect && !diameter) {
      setError(
        isWheel
          ? "Pick at least a diameter to search wheel sizes."
          : "Pick at least one number from your sidewall to search."
      );
      return;
    }
    setError("");
    onSearch({ type: "size", width, aspect, diameter });
  };

  const tabClass = (id) =>
    `flex flex-1 items-center justify-center gap-2 px-4 py-3.5 font-display text-sm uppercase tracking-[0.12em] transition-colors md:text-base ${
      tab === id
        ? "bg-bone text-ink"
        : "bg-steel text-bone/70 hover:bg-graphite hover:text-bone"
    }`;

  return (
    <div className="overflow-hidden rounded-sm border border-ink/10 bg-bone shadow-lift">
      <div role="tablist" aria-label="Product finder" className="flex">
        <button
          type="button"
          role="tab"
          id="finder-tab-vehicle"
          aria-selected={tab === "vehicle"}
          aria-controls="finder-panel-vehicle"
          onClick={() => {
            setTab("vehicle");
            setError("");
          }}
          className={tabClass("vehicle")}
        >
          <Car size={18} aria-hidden />
          Shop by Vehicle
        </button>
        <button
          type="button"
          role="tab"
          id="finder-tab-size"
          aria-selected={tab === "size"}
          aria-controls="finder-panel-size"
          onClick={() => {
            setTab("size");
            setError("");
          }}
          className={tabClass("size")}
        >
          <Ruler size={18} aria-hidden />
          {sizeTabLabel}
        </button>
      </div>

      <div className="p-5 md:p-6">
        {tab === "vehicle" ? (
          <form
            id="finder-panel-vehicle"
            role="tabpanel"
            aria-labelledby="finder-tab-vehicle"
            onSubmit={submitVehicle}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                value={make}
                onChange={(v) => {
                  setMake(v);
                  setModel("");
                }}
                options={VEHICLE_MAKES}
                placeholder="Select make"
              />
              <Field
                id="finder-model"
                label="Model"
                value={model}
                onChange={setModel}
                options={models}
                placeholder={make ? "Select model" : "Select a make first"}
                disabled={!make}
              />
              <div className="flex items-end">
                <button type="submit" className="btn-primary w-full">
                  <Search size={18} aria-hidden />
                  Find {isWheel ? "Wheels" : "Tires"}
                </button>
              </div>
            </div>
            <p className="mt-3 text-xs text-smoke">
              We match your vehicle to the sizes we stock, then install at your
              home or office. Not sure? Call us and read the sidewall to us.
            </p>
          </form>
        ) : (
          <form
            id="finder-panel-size"
            role="tabpanel"
            aria-labelledby="finder-tab-size"
            onSubmit={submitSize}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <div className="flex items-end">
                <button type="submit" className="btn-primary w-full">
                  <Search size={18} aria-hidden />
                  Search Sizes
                </button>
              </div>
            </div>
            <p className="mt-3 text-xs text-smoke">
              {isWheel
                ? "Wheel sizes read diameter by width, e.g. 18x8.5. Bolt pattern is stamped on the back of your current wheel."
                : "Your size is printed on the sidewall, e.g. 225/50R17 — that is a 225 width, 50 aspect ratio and a 17 inch rim."}
            </p>
          </form>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-drop">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
