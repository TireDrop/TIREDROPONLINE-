import React, { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, MapPin, X } from "lucide-react";

import { BUSINESS } from "../../data/business.js";
import {
  SERVICE_AREA_LABEL,
  isInServiceArea,
  zip5,
} from "../../data/serviceArea.js";

// The Spanish pages' wording (lang="es"). Same rule, same links.
const ES = {
  label: "Código postal (ZIP) donde estará el vehículo",
  placeholder: "ej. 33351",
  button: "Verificar mi código postal",
  invalid: "Escriba un código postal de cinco dígitos, como 33351.",
  inside: "está dentro del área móvil. La camioneta puede ir a donde usted está.",
  book: "Reserve una instalación móvil",
  outside: (area) => `está fuera de ${area}, así que la camioneta no puede ir allí. Las llantas igual se envían gratis a los 48 estados contiguos y DC.`,
  shipping: "Cómo funciona el envío (en inglés)",
  area: "los condados de Miami-Dade, Broward y Palm Beach",
};

/**
 * "Does the van come to my ZIP?" The same rule checkout and /schedule use
 * (isInServiceArea in src/data/serviceArea.js), answered on the page. Only a
 * ZIP decides it, never a city name.
 *
 * The field is read from the form on submit rather than from state, so a
 * value typed, pasted, autofilled or set by automation is the one checked.
 * Nothing is sent anywhere.
 */
export default function ZipCheck({
  label = "ZIP code where the car will be parked",
  lang = "en",
  className = "",
}) {
  const es = lang === "es";
  const id = useId();
  const [result, setResult] = useState(null);

  const onSubmit = (e) => {
    e.preventDefault();
    const raw = new FormData(e.currentTarget).get("zip");
    const zip = zip5(raw);
    if (!zip) setResult({ kind: "invalid" });
    else setResult({ kind: isInServiceArea(zip) ? "in" : "out", zip });
  };

  return (
    <div className={`card p-5 md:p-6 ${className}`}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor={`${id}-zip`}
            className="label"
          >
            {es ? ES.label : label}
          </label>
          <input
            id={`${id}-zip`}
            name="zip"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={10}
            placeholder={es ? ES.placeholder : "e.g. 33351"}
            className="field"
            aria-describedby={`${id}-result`}
          />
        </div>
        <button type="submit" className="btn-dark min-h-[44px] shrink-0">
          <MapPin size={16} aria-hidden />
          {es ? ES.button : "Check my ZIP"}
        </button>
      </form>

      <div id={`${id}-result`} aria-live="polite" className="mt-3 text-sm leading-relaxed">
        {result?.kind === "invalid" && (
          <p className="text-smoke">
            {es ? ES.invalid : "Enter a five-digit ZIP code, like 33351."}
          </p>
        )}
        {result?.kind === "in" && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-ink">
            <Check size={16} aria-hidden className="shrink-0 text-drop" />
            <span>
              <strong>{result.zip}</strong>{" "}
              {es
                ? ES.inside
                : "is in the mobile area. The van can come to you."}
            </span>
            <Link
              to="/schedule?service=tire-installation"
              className="inline-flex min-h-[44px] items-center gap-1 font-display font-bold text-drop hover:text-dive"
            >
              {es ? ES.book : "Book a mobile install"}
              <ArrowRight size={14} aria-hidden />
            </Link>
          </p>
        )}
        {result?.kind === "out" && (
          <p className="flex items-start gap-2 text-ink">
            <X size={16} aria-hidden className="mt-0.5 shrink-0 text-smoke" />
            <span>
              <strong>{result.zip}</strong>{" "}
              {es ? (
                ES.outside(ES.area)
              ) : (
                <>
                  is outside {SERVICE_AREA_LABEL}, so the van can&rsquo;t come
                  there. Tires still ship free to {BUSINESS.shipping.area}.
                </>
              )}{" "}
              <Link to="/shipping" className="text-drop underline hover:text-dive">
                {es ? ES.shipping : "How shipping works"}
              </Link>
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
