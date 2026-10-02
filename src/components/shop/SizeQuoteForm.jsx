import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Phone } from "lucide-react";

import { BUSINESS } from "../../data/business.js";
import { hasChanges, readFormValues, submitForm } from "../../data/forms.js";
import { FormTrap, Input } from "../ui/index.jsx";

/**
 * The /tires card for a size nothing on the page comes in: call, or leave a
 * number for a call-back with a quote. It posts the "size-quote" form
 * through submitForm (POST /api/forms → a lead on the Shopify customer,
 * emailed to info@ by Flow, tagged lead-size-quote), with the size and the
 * vehicle as hidden fields. submitForm sends generate_lead
 * { form_name: "size-quote" } once it is delivered.
 *
 * What was typed stays in the fields whatever happens: a validation error,
 * a failed send, or forms that are not connected yet.
 */

const EMPTY = { name: "", phone: "", email: "" };

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Tell us who to ask for.";
  const digits = values.phone.replace(/\D/g, "");
  if (!values.phone.trim()) {
    errors.phone = "We need a number to call with the quote.";
  } else if (digits.length < 10 || digits.length > 11) {
    errors.phone = "Enter a 10-digit mobile number, area code included.";
  }
  if (
    values.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())
  ) {
    errors.email = "That email address does not look complete.";
  }
  return errors;
}

function FieldError({ id, children }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-xs text-drop">
      <AlertCircle size={14} aria-hidden className="mt-px shrink-0" />
      {children}
    </p>
  );
}

export default function SizeQuoteForm({ size, vehicle = "" }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const update = (field) => (event) => {
    const { value } = event.target;
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (sending) return; // a second click must not send twice
    const formElement = event.currentTarget;
    const { values: current, changed } = readFormValues(formElement, values);
    if (hasChanges(changed)) setValues((prev) => ({ ...prev, ...changed }));
    const found = validate(current);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSending(true);
    setResult(null);
    const outcome = await submitForm(
      "size-quote",
      { ...current, size, vehicle },
      formElement,
    );
    setSending(false);
    setResult(outcome);
  };

  const field = (key, label, props) => (
    <div>
      <label className="label" htmlFor={`sq-${key}`}>
        {label}
      </label>
      <Input
        id={`sq-${key}`}
        name={key}
        className="field"
        value={values[key]}
        onChange={update(key)}
        aria-invalid={errors[key] ? "true" : undefined}
        aria-describedby={errors[key] ? `sq-${key}-error` : undefined}
        {...props}
      />
      {errors[key] && <FieldError id={`sq-${key}-error`}>{errors[key]}</FieldError>}
    </div>
  );

  return (
    <div className="card p-5 md:p-6" data-testid="size-quote">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-ink">
          Nothing here in <span className="font-semibold">{size}</span> yet. We
          can order it. Leave your number and we&rsquo;ll call with a quote for
          that size.
        </p>
        <a
          href={BUSINESS.phoneHref}
          className="btn-outline btn-sm min-h-[44px] shrink-0"
        >
          <Phone size={16} aria-hidden />
          {BUSINESS.phone}
        </a>
      </div>

      {result?.delivered ? (
        <p
          role="status"
          className="mt-5 flex items-start gap-2 border-t border-ink/10 pt-5 font-display text-base font-bold text-ink"
        >
          <CheckCircle2 size={20} aria-hidden className="mt-0.5 shrink-0 text-drop" />
          Got it. We&rsquo;ll call you about {size}.
        </p>
      ) : (
        <form
          noValidate
          onSubmit={handleSubmit}
          aria-label={`Get a quote for ${size}`}
          className="relative mt-5 border-t border-ink/10 pt-5"
        >
          <FormTrap id="size-quote-website" />
          <input type="hidden" name="size" value={size} />
          <input type="hidden" name="vehicle" value={vehicle} />
          <div className="grid gap-4 sm:grid-cols-3">
            {field("name", "Name", {
              type: "text",
              autoComplete: "name",
              placeholder: "Alex Moreno",
            })}
            {field("phone", "Mobile phone", {
              type: "tel",
              inputMode: "tel",
              autoComplete: "tel",
              placeholder: "(954) 555-0188",
            })}
            {field("email", "Email (optional)", {
              type: "email",
              autoComplete: "email",
              placeholder: "you@example.com",
            })}
          </div>
          <button
            type="submit"
            disabled={sending}
            className="btn-primary mt-4 min-h-[44px] w-full sm:w-auto"
          >
            {sending ? "Sending…" : "Get a quote"}
          </button>
          {result && !result.delivered && (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-sm border-l-4 border-l-amber bg-fog p-3 text-sm leading-relaxed text-ink"
            >
              <AlertCircle size={16} aria-hidden className="mt-0.5 shrink-0 text-drop" />
              <span>
                {result.error
                  ? `${result.error} Your details are still here, so try again, or call `
                  : "This form isn’t connected yet, so nothing was sent. Call "}
                <a href={BUSINESS.phoneHref} className="font-semibold text-drop underline">
                  {BUSINESS.phone}
                </a>{" "}
                and ask for a quote on {size}.
              </span>
            </p>
          )}
        </form>
      )}
    </div>
  );
}
