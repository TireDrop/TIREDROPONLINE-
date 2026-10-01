import React, { useEffect, useRef, useState } from "react";

import { Input, Select } from "../ui/index.jsx";
import {
  OTHER,
  OTHER_LABEL,
  YEARS,
  makesFor,
  useVehicleModels,
} from "../../data/vehicles.js";

/**
 * Year / Make / Model dropdowns for the site's forms, on the same data as the
 * home page vehicle finder (data/vehicles.js): years 2027-1981, the makes sold
 * in the chosen year, and that make's models for the year from NHTSA vPIC
 * (through our cached /api/vehicles), merged with the size table. When none
 * of that can be reached the list falls back to the build's vPIC snapshot,
 * then to the size-table models, and a hint says so.
 *
 * Every list ends in "Other / not listed", which opens a small text box, so a
 * vehicle the lists do not carry never blocks anyone. A picked "Other" make
 * turns the model into a text box too.
 *
 * The form keeps the same values it always had: `year`, `make`, `model` (and
 * `trim` when `showTrim`) as plain strings, so what reaches the server does
 * not change. The field carrying each value is named after it — the select
 * while a listed value is chosen, the text box once "Other" is — so
 * readFormValues (data/forms.js) reads back what the visitor sees.
 *
 *   <VehicleSelect
 *     value={{ year, make, model, trim }}
 *     onChange={(patch) => ...}   // e.g. { make: "Toyota", model: "" }
 *     errors={{ year, make, model }}
 *     showTrim                    // adds "Trim or drivetrain (optional)"
 *   >
 *     {more fields for the same grid}
 *   </VehicleSelect>
 *
 * A value that is not in a list (a prefill, or a model the new year does not
 * carry) shows as "Other" with the value in the text box.
 *
 * Nothing touches the network or `window` while rendering: models load in an
 * effect (useVehicleModels), so the page renders the same on the server.
 */

export const MIN_VEHICLE_YEAR = 1960;
// Manufacturers sell next year's models well before the year turns.
export const MAX_VEHICLE_YEAR = new Date().getFullYear() + 2;

const str = (v) => (v == null ? "" : String(v));

/** A real answer: not blank, and not the bare "Other" choice. */
export const hasVehicleValue = (v) => {
  const s = str(v).trim();
  return Boolean(s) && s !== OTHER;
};

/**
 * The errors for a vehicle, in the page's own words. `messages` supplies
 * `year`, `yearRange`, `make` and `model`.
 */
export function vehicleErrors(values, messages) {
  const e = {};
  const year = str(values.year).trim();
  if (!hasVehicleValue(year)) e.year = messages.year;
  else if (
    !/^\d{4}$/.test(year) ||
    Number(year) < MIN_VEHICLE_YEAR ||
    Number(year) > MAX_VEHICLE_YEAR
  )
    e.year = messages.yearRange;
  if (!hasVehicleValue(values.make)) e.make = messages.make;
  if (!hasVehicleValue(values.model)) e.model = messages.model;
  return e;
}

const FIELD = "field min-h-[44px] bg-bone";
const NOUN = { year: "year", make: "make", model: "model" };

function Message({ id, tone = "error", children }) {
  if (!children) return null;
  return tone === "error" ? (
    <p id={id} role="alert" className="mt-1 text-xs text-drop">
      {children}
    </p>
  ) : (
    <p id={id} className="mt-1 text-xs leading-relaxed text-smoke">
      {children}
    </p>
  );
}

export default function VehicleSelect({
  value,
  onChange,
  errors = {},
  showTrim = false,
  idPrefix = "",
  className = "grid gap-5 sm:grid-cols-2",
  children,
}) {
  const id = (f) => `${idPrefix}${f}`;
  const year = str(value?.year);
  const make = str(value?.make);
  const model = str(value?.model);

  // Which lists the visitor has switched to "Other" (the text box stays open
  // while they clear it and type again).
  const [open, setOpen] = useState({ year: false, make: false, model: false });

  /* ---- year ---- */
  const yearOther =
    open.year || year === OTHER || (year !== "" && !YEARS.includes(year));
  const yearChoice = yearOther ? OTHER : year;
  const yearText = year === OTHER ? "" : year;
  const yearReady = /^\d{4}$/.test(year);

  /* ---- make: the makes sold that year (every make for a typed year) ---- */
  const makes = makesFor(yearOther ? "" : year);
  const makeOther =
    open.make || make === OTHER || (make !== "" && !makes.includes(make));
  const makeChoice = makeOther ? OTHER : make;
  const makeText = make === OTHER ? "" : make;
  const makeListed = !makeOther && make !== "";

  /* ---- model: that make's models for that year ---- */
  const lookup = makeListed && yearReady;
  const live = useVehicleModels(lookup ? make : "", lookup ? year : "");
  const modelMode = makeOther
    ? "text" // a make the list does not carry: type the model too
    : !lookup
      ? "wait"
      : live.loading
        ? "loading"
        : "list";
  const models = live.models;
  const modelOther =
    modelMode === "list" &&
    (open.model || model === OTHER || (model !== "" && !models.includes(model)));
  const modelChoice =
    modelMode !== "list" ? "" : modelOther ? OTHER : model;
  const modelText = model === OTHER ? "" : model;

  /* ---- picks ---- */
  function pick(field, next) {
    const other = next === OTHER;
    const patch = {};
    const opened = { [field]: other };
    if (field === "year") {
      patch.year = other ? "" : next;
      // A make that was not sold in the new year no longer fits it.
      if (!other && next && makeListed && !makesFor(next).includes(make)) {
        patch.make = "";
        patch.model = "";
        opened.make = false;
        opened.model = false;
      }
    } else if (field === "make") {
      patch.make = other ? "" : next;
      patch.model = "";
      opened.model = false;
    } else {
      patch.model = other ? "" : next;
    }
    setOpen((o) => ({ ...o, ...opened }));
    onChange?.(patch);
  }

  function type(field, next) {
    if (!open[field]) setOpen((o) => ({ ...o, [field]: true }));
    onChange?.({ [field]: next });
  }

  /*
   * A choice made without a change event (browser automation, some autofill)
   * sits in the DOM where state never saw it. The Select keeps it there; on
   * the next render, take it into state as if it had been picked, so the
   * lists that depend on it follow. One field per render, and never the same
   * adoption twice in a row, so a parent that ignores a change cannot loop.
   */
  const yearRef = useRef(null);
  const makeRef = useRef(null);
  const modelRef = useRef(null);
  const pickRef = useRef(pick);
  useEffect(() => {
    pickRef.current = pick;
  });
  const lastAdopted = useRef("");
  const wanted = { year: yearChoice, make: makeChoice, model: modelChoice };
  useEffect(() => {
    const nodes = { year: yearRef, make: makeRef, model: modelRef };
    for (const field of ["year", "make", "model"]) {
      const el = nodes[field].current;
      if (!el || el.tagName !== "SELECT" || el.disabled) continue;
      if (el.value === wanted[field]) continue;
      const key = `${field}=${el.value}`;
      if (lastAdopted.current === key) return;
      lastAdopted.current = key;
      pickRef.current(field, el.value);
      return;
    }
    lastAdopted.current = "";
  });

  /* ---- rendering ---- */
  function describe(...ids) {
    return ids.filter(Boolean).join(" ") || undefined;
  }

  function errorFor(field, textOpen, textValue) {
    const err = errors?.[field];
    if (!err) return "";
    // The text box is open and empty: say what to do with it.
    if (textOpen && !textValue.trim()) return `Type the vehicle ${NOUN[field]}.`;
    return err;
  }

  // A plain render helper, not a component: a component declared in here
  // would be a new type every render and drop focus mid-word.
  function otherBox({ field, textValue, error, inputMode, maxLength, hint }) {
    const boxId = id(`${field}-other`);
    const errId = error ? `${boxId}-error` : undefined;
    return (
      <div className="mt-2">
        <label htmlFor={boxId} className="sr-only">
          {`Vehicle ${NOUN[field]} (not listed)`}
        </label>
        <Input
          id={boxId}
          name={field}
          value={textValue}
          onChange={(e) => type(field, e.target.value)}
          placeholder={hint}
          inputMode={inputMode}
          maxLength={maxLength}
          autoComplete="off"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={errId}
          className={`${FIELD} ${error ? "border-drop" : ""}`}
        />
        <Message id={errId}>{error}</Message>
      </div>
    );
  }

  const yearErr = errorFor("year", yearOther, yearText);
  const makeErr = errorFor("make", makeOther, makeText);
  const modelErr = errorFor("model", modelOther || modelMode === "text", modelText);

  const modelHintId =
    modelMode === "list" &&
    (live.source === "fallback" || live.source === "snapshot")
      ? id("model-hint")
      : undefined;
  const modelPlaceholder =
    modelMode === "wait"
      ? !yearReady
        ? "Pick a year first"
        : "Pick a make first"
      : modelMode === "loading"
        ? "Loading models…"
        : "Select model";

  return (
    <div className={className}>
      {/* Year */}
      <div>
        <label htmlFor={id("year")} className="label">
          Year
        </label>
        <Select
          ref={yearRef}
          id={id("year")}
          name={yearOther ? undefined : "year"}
          value={yearChoice}
          onChange={(e) => pick("year", e.target.value)}
          aria-invalid={yearErr && !yearOther ? "true" : undefined}
          aria-describedby={
            yearErr && !yearOther ? `${id("year")}-error` : undefined
          }
          className={`${FIELD} ${yearErr && !yearOther ? "border-drop" : ""}`}
        >
          <option value="">Select year</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
          <option value={OTHER}>{OTHER_LABEL}</option>
        </Select>
        {yearOther ? (
          otherBox({
            field: "year",
            textValue: yearText,
            error: yearErr,
            inputMode: "numeric",
            maxLength: 4,
            hint: "Type the year, like 1978",
          })
        ) : (
          <Message id={`${id("year")}-error`}>{yearErr}</Message>
        )}
      </div>

      {/* Make */}
      <div>
        <label htmlFor={id("make")} className="label">
          Make
        </label>
        <Select
          ref={makeRef}
          id={id("make")}
          name={makeOther ? undefined : "make"}
          value={makeChoice}
          onChange={(e) => pick("make", e.target.value)}
          aria-invalid={makeErr && !makeOther ? "true" : undefined}
          aria-describedby={
            makeErr && !makeOther ? `${id("make")}-error` : undefined
          }
          className={`${FIELD} ${makeErr && !makeOther ? "border-drop" : ""}`}
        >
          <option value="">Select make</option>
          {makes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
          <option value={OTHER}>{OTHER_LABEL}</option>
        </Select>
        {makeOther ? (
          otherBox({
            field: "make",
            textValue: makeText,
            error: makeErr,
            maxLength: 60,
            hint: "Type the make",
          })
        ) : (
          <Message id={`${id("make")}-error`}>{makeErr}</Message>
        )}
      </div>

      {/* Model */}
      <div>
        <label htmlFor={id("model")} className="label">
          Model
        </label>
        {modelMode === "text" ? (
          <>
            <Input
              ref={modelRef}
              id={id("model")}
              name="model"
              value={modelText}
              onChange={(e) => type("model", e.target.value)}
              placeholder="Type the model"
              maxLength={60}
              autoComplete="off"
              aria-invalid={modelErr ? "true" : undefined}
              aria-describedby={modelErr ? `${id("model")}-error` : undefined}
              className={`${FIELD} ${modelErr ? "border-drop" : ""}`}
            />
            <Message id={`${id("model")}-error`}>{modelErr}</Message>
          </>
        ) : (
          <>
            <Select
              ref={modelRef}
              id={id("model")}
              name={modelOther ? undefined : "model"}
              value={modelChoice}
              disabled={modelMode !== "list"}
              aria-busy={modelMode === "loading" ? "true" : undefined}
              onChange={(e) => pick("model", e.target.value)}
              aria-invalid={modelErr && !modelOther ? "true" : undefined}
              aria-describedby={describe(
                modelErr && !modelOther ? `${id("model")}-error` : "",
                modelHintId,
              )}
              className={`${FIELD} disabled:opacity-60 ${
                modelErr && !modelOther ? "border-drop" : ""
              }`}
            >
              <option value="">{modelPlaceholder}</option>
              {modelMode === "list" &&
                models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              {modelMode === "list" && (
                <option value={OTHER}>{OTHER_LABEL}</option>
              )}
            </Select>
            {modelHintId && (
              <Message id={modelHintId} tone="hint">
                {live.source === "snapshot" ? (
                  <>
                    We couldn&rsquo;t load this year&rsquo;s model list, so
                    this is every {make} model on file. Pick yours, or choose{" "}
                    {OTHER_LABEL} and type it.
                  </>
                ) : (
                  <>
                    We couldn&rsquo;t load the full model list. Pick from the
                    common models, or choose {OTHER_LABEL} and type it.
                  </>
                )}
              </Message>
            )}
            {modelOther ? (
              otherBox({
                field: "model",
                textValue: modelText,
                error: modelErr,
                maxLength: 60,
                hint: "Type the model",
              })
            ) : (
              <Message id={`${id("model")}-error`}>{modelErr}</Message>
            )}
          </>
        )}
      </div>

      {showTrim && (
        <div>
          <label htmlFor={id("trim")} className="label">
            Trim or drivetrain (optional)
          </label>
          <Input
            id={id("trim")}
            name="trim"
            placeholder="TRD Off-Road 4WD"
            value={str(value?.trim)}
            onChange={(e) => onChange?.({ trim: e.target.value })}
            className={FIELD}
          />
        </div>
      )}

      {children}
    </div>
  );
}
