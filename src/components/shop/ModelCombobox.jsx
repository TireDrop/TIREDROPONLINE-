import React, { forwardRef, useEffect, useState } from "react";

/**
 * The finder's Model field: a text box that filters a list as you type (the
 * ARIA 1.2 combobox pattern), so a make with a hundred models (BMW's 330i,
 * M340i, X5 and the rest) is a few keystrokes away, and a model the list does
 * not carry can simply be typed.
 *
 *   <ModelCombobox id="finder-model" labelId="finder-model-label"
 *     value={text} onChange={setText} options={models}
 *     placeholder="Type or pick a model" disabled={loading} />
 *
 * Keyboard: Down opens the list and moves through it, Up moves back, Enter
 * takes the highlighted model (with nothing highlighted it submits the form
 * with what was typed), Escape closes the list. Typing highlights the best
 * match, so "4 ser" then Enter takes "4 Series". A tap or click on a model
 * takes it. Matching ignores case, spaces and punctuation: "m340" finds
 * "M340i", "cx5" finds "CX-5".
 *
 * Styled as the card's other fields (`.field`); the list hangs under the box.
 */

const fold = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** The options that match `query`, the ones starting with it first. */
export function filterModels(options, query) {
  const q = fold(query);
  if (!q) return options;
  const starts = [];
  const contains = [];
  options.forEach((o) => {
    const f = fold(o);
    if (f.startsWith(q)) starts.push(o);
    else if (f.includes(q)) contains.push(o);
  });
  return [...starts, ...contains];
}

/** The listed spelling of `text` ("4 series" -> "4 Series"), or null. */
export function listedModel(options, text) {
  const q = fold(text);
  if (!q) return null;
  return options.find((o) => fold(o) === q) ?? null;
}

const ModelCombobox = forwardRef(function ModelCombobox(
  {
    id,
    labelId,
    value,
    onChange,
    options,
    placeholder,
    disabled = false,
    busy = false,
    describedBy,
    className = "",
  },
  ref,
) {
  const listId = `${id}-list`;
  const optionId = (i) => `${id}-option-${i}`;
  const [open, setOpen] = useState(false);
  // Filtering follows typing; opening with the mouse or Down shows the lot.
  const [filtering, setFiltering] = useState(false);
  const [active, setActive] = useState(-1);

  const shown = filtering ? filterModels(options, value) : options;
  const expanded = open && !disabled && shown.length > 0;

  useEffect(() => {
    if (!expanded || active < 0) return;
    document
      .getElementById(`${id}-option-${active}`)
      ?.scrollIntoView?.({ block: "nearest" });
  }, [expanded, active, id]);

  const close = () => {
    setOpen(false);
    setActive(-1);
  };

  const choose = (model) => {
    onChange(model);
    setFiltering(false);
    close();
  };

  const showAll = () => {
    setFiltering(false);
    setOpen(true);
    setActive(options.findIndex((o) => fold(o) === fold(value)));
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!expanded) showAll();
      else setActive((i) => Math.min(i + 1, shown.length - 1));
    } else if (e.key === "ArrowUp") {
      if (!expanded) return;
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (expanded && active >= 0 && shown[active] !== undefined) {
        e.preventDefault();
        choose(shown[active]);
      }
    } else if (e.key === "Escape") {
      if (expanded) {
        e.preventDefault();
        close();
      }
    }
  };

  return (
    <div className="relative">
      <input
        ref={ref}
        id={id}
        name="model"
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={
          expanded && active >= 0 ? optionId(active) : undefined
        }
        aria-busy={busy ? "true" : undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={60}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next);
          setFiltering(true);
          setOpen(true);
          setActive(fold(next) && filterModels(options, next).length ? 0 : -1);
        }}
        onClick={() => (expanded ? close() : showAll())}
        onKeyDown={onKeyDown}
        onBlur={close}
        className={`field disabled:opacity-60 ${className}`}
      />
      <ul
        id={listId}
        role="listbox"
        aria-labelledby={labelId}
        hidden={!expanded}
        className="absolute left-0 right-0 z-30 mt-1 max-h-60 overflow-y-auto rounded-sm border border-ink/15 bg-bone py-1 shadow-lift"
      >
        {expanded &&
          shown.map((o, i) => (
            <li
              key={o}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              // Keeps focus in the box, so the pick lands before blur closes the list.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(o)}
              className={`cursor-pointer px-3.5 py-2.5 text-[15px] leading-snug text-ink ${
                i === active ? "bg-sky" : "hover:bg-fog"
              }`}
            >
              {o}
            </li>
          ))}
      </ul>
    </div>
  );
});

export default ModelCombobox;
