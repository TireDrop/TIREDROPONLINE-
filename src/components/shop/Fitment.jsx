import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Car,
  CheckCircle2,
  HelpCircle,
  Ruler,
  Search,
  XCircle,
} from "lucide-react";

import { useVehicle } from "../../context/VehicleContext.jsx";
import {
  STAGGERED_NOTE,
  describeOption,
  optionId,
  readSize,
  selectionSizeText,
  sizeSearch,
} from "../../data/fitmentCheck.js";
import VehicleSelect, { hasVehicleValue } from "./VehicleSelect.jsx";

/**
 * The fitment pieces every shop surface shares:
 *
 *   <ShoppingForBar />   "Shopping for: 2019 Toyota Tacoma (245/75R16) · Change",
 *                        with "Know your exact size?" (the door-jamb sticker,
 *                        front and an optional rear size) right under it
 *   <FitBadge fit />     the answer for one tire, in words and an icon
 *   <FitPanel fit />     the product page's fuller answer, with what to do
 *                        next when the tire does not fit
 *   <NoFitActions fit /> "See tires that fit" / "Change" / "Different car?"
 *
 * The answer itself comes from useFit / fitFor (VehicleContext.jsx), which
 * is null until the saved selection has loaded, so none of these render
 * anything that could differ between the prerender and the first client
 * render.
 */

/** The line that goes beside every fitment answer. */
export const CONFIRM_LINE = "We confirm fitment before your order ships.";

const TONES = {
  fits: {
    Icon: CheckCircle2,
    wrap: "bg-sky ring-drop/30",
    icon: "text-drop",
  },
  "no-fit": {
    Icon: XCircle,
    wrap: "bg-[#FDEEEE] ring-extremeDeep/30",
    icon: "text-extremeDeep",
  },
  check: {
    Icon: HelpCircle,
    wrap: "bg-amber/15 ring-amber/50",
    icon: "text-amberInk",
  },
};

/** Short badge: an icon plus the answer in words (never colour alone). */
export function FitBadge({ fit, as: Tag = "p", className = "" }) {
  if (!fit) return null;
  const tone = TONES[fit.status] ?? TONES.check;
  const { Icon } = tone;
  return (
    <Tag
      data-fit={fit.status}
      className={`inline-flex max-w-full items-start gap-1.5 rounded-sm px-2 py-1 text-[11px] font-semibold leading-snug text-ink ring-1 ring-inset sm:text-xs ${tone.wrap} ${className}`}
    >
      <Icon size={14} aria-hidden className={`mt-px shrink-0 ${tone.icon}`} />
      <span className="min-w-0">{fit.title}</span>
    </Tag>
  );
}

/* ------------------------------------------------------------------ *
 * Opening the Change panel from anywhere
 * ------------------------------------------------------------------ */

/**
 * A button that opens the Shopping-for bar's Change panel. On a page that
 * has no bar (the home page's featured tires, the size tools) it goes to
 * /tires and opens it there instead.
 */
export function ChangeButton({ tab = "vehicle", className = "", children }) {
  const { bars, openChanger } = useVehicle();
  if (bars > 0) {
    return (
      <button
        type="button"
        onClick={() => openChanger(tab)}
        className={className}
      >
        {children}
      </button>
    );
  }
  return (
    <Link
      to={`/tires?fit=${tab === "size" || tab === "sticker" ? tab : "change"}`}
      className={className}
    >
      {children}
    </Link>
  );
}

const LINK =
  "inline-flex min-h-[44px] items-center text-left text-xs font-semibold text-ink underline underline-offset-4 hover:text-drop sm:text-sm";

/** What to do about a tire that does not fit. */
export function NoFitActions({ fit, compact = false }) {
  const { resolved, clear, openChanger, bars } = useVehicle();
  if (!fit || fit.status !== "no-fit") return null;
  const href = fit.sizes.map(sizeSearch).find(Boolean) ?? "/tires";
  const isSize = resolved.kind === "size";

  if (compact) {
    return (
      <div className="flex flex-col gap-1">
        <Link
          to={href}
          className="btn-outline btn-sm min-h-[44px] w-full px-2 sm:px-4"
        >
          See tires that fit
        </Link>
        <ChangeButton
          tab={isSize ? "size" : "vehicle"}
          className={`${LINK} justify-center`}
        >
          {isSize ? "Change size" : "Change vehicle"}
        </ChangeButton>
      </div>
    );
  }
  return (
    <div className="mt-3 flex flex-col gap-2">
      <Link to={href} className="btn-primary w-full">
        <Search size={18} aria-hidden />
        See tires that fit
      </Link>
      <div className="flex flex-wrap gap-x-5">
        <ChangeButton tab={isSize ? "size" : "vehicle"} className={LINK}>
          {isSize ? "Not your size? Change it" : "Not your vehicle? Change it"}
        </ChangeButton>
        <button
          type="button"
          onClick={() => {
            clear();
            if (bars > 0) openChanger("vehicle");
          }}
          className={LINK}
        >
          Shopping for a different car?
        </button>
      </div>
    </div>
  );
}

/** Size choices when the trims differ: "Which size is on your tires?" */
function TrimChoices({ choices }) {
  const { pickOption, openChanger } = useVehicle();
  return (
    <div className="mt-3">
      <p className="text-sm font-semibold text-ink">
        Which size is on your tires?
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {choices.map((o) => (
          <button
            key={optionId(o)}
            type="button"
            onClick={() => pickOption(optionId(o))}
            className="tnum min-h-[44px] rounded-sm border border-ink/15 bg-bone px-3 text-sm font-semibold text-ink hover:border-drop"
          >
            {describeOption(o)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => openChanger("sticker")}
          className={LINK}
        >
          Not listed? Enter your size
        </button>
      </div>
      <p className="mt-1.5 text-xs text-smoke">
        It is printed on the sidewall and on the sticker in the driver&rsquo;s
        door jamb.
      </p>
    </div>
  );
}

/** The product page's answer: badge, what it is based on, what to do. */
export function FitPanel({ fit }) {
  const { openChanger } = useVehicle();
  if (!fit) return null;
  return (
    <div
      data-testid="fit-panel"
      className="mt-6 rounded-sm border border-ink/10 bg-fog p-4"
    >
      <FitBadge fit={fit} className="text-xs sm:text-sm" />
      <p className="mt-2 text-sm leading-relaxed text-ink">{fit.detail}</p>
      {fit.code === "no-selection" && (
        <button
          type="button"
          onClick={() => openChanger("vehicle")}
          className="btn-outline btn-sm mt-3"
        >
          <Car size={16} aria-hidden />
          Pick your vehicle
        </button>
      )}
      {(fit.code === "no-record" ||
        fit.code === "no-year" ||
        fit.code === "unconfirmed") && (
        <button
          type="button"
          onClick={() => openChanger("sticker")}
          className="btn-outline btn-sm mt-3"
        >
          <Ruler size={16} aria-hidden />
          Enter the size from your door-jamb sticker
        </button>
      )}
      {fit.code === "some-trims" && <TrimChoices choices={fit.choices} />}
      {/* "Check fitment": the Tire Size Finder reads the exact size off a
          photo of the door sticker, sidewall or VIN (/tire-size-finder). */}
      {fit.status === "check" &&
        fit.code !== "casing" &&
        fit.code !== "bad-size" && (
          <p className="mt-1">
            <Link
              to="/tire-size-finder"
              data-testid="fit-scan-link"
              className={LINK}
            >
              <span aria-hidden className="mr-1.5">
                📷
              </span>
              Scan your tire size
            </Link>
          </p>
        )}
      <NoFitActions fit={fit} />
      <p className="mt-3 text-xs text-smoke">{CONFIRM_LINE}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The Shopping-for bar
 * ------------------------------------------------------------------ */

const TAB =
  "min-h-[44px] flex-1 rounded-sm border px-3 font-display text-sm font-bold transition-colors sm:flex-none";

function Changer({ initialTab }) {
  const { resolved, selection, selectVehicle, selectSize, closeChanger } =
    useVehicle();
  const [tab, setTab] = useState(initialTab);
  const [veh, setVeh] = useState(() =>
    selection?.type === "vehicle"
      ? { year: selection.year, make: selection.make, model: selection.model }
      : { year: "", make: "", model: "" },
  );
  const [size, setSize] = useState(() =>
    selection?.type === "size" ? selection.size : (selection?.size ?? ""),
  );
  const [error, setError] = useState("");
  const onVehicle = resolved.kind === "vehicle" ? resolved : null;

  const submitVehicle = (e) => {
    e.preventDefault();
    if (
      !hasVehicleValue(veh.year) ||
      !hasVehicleValue(veh.make) ||
      !hasVehicleValue(veh.model)
    ) {
      setError("Choose a year, make and model to see what fits.");
      return;
    }
    selectVehicle(veh);
  };

  const submitSize = (asVehicle) => (e) => {
    e?.preventDefault();
    const read = readSize(size);
    if (!read) {
      setError(
        `"${size.trim() || " "}" is not a size we can read. It looks like 225/45R17, LT265/70R17 or 31x10.50R15.`,
      );
      return;
    }
    if (asVehicle && onVehicle) {
      selectVehicle({ ...onVehicle.vehicle, size: read.display });
    } else {
      selectSize(read.display);
    }
  };

  return (
    <div className="mt-4 border-t border-ink/10 pt-4" data-testid="fit-changer">
      <div className="flex gap-2" role="group" aria-label="Shop by">
        <button
          type="button"
          aria-pressed={tab === "vehicle"}
          onClick={() => {
            setTab("vehicle");
            setError("");
          }}
          className={`${TAB} ${tab === "vehicle" ? "border-drop bg-drop text-bone" : "border-ink/15 bg-bone text-ink"}`}
        >
          Vehicle
        </button>
        <button
          type="button"
          aria-pressed={tab === "size"}
          onClick={() => {
            setTab("size");
            setError("");
          }}
          className={`${TAB} ${tab === "size" ? "border-drop bg-drop text-bone" : "border-ink/15 bg-bone text-ink"}`}
        >
          Tire size
        </button>
      </div>

      {tab === "vehicle" ? (
        <form onSubmit={submitVehicle} className="mt-4">
          <VehicleSelect
            idPrefix="fit-"
            value={veh}
            onChange={(patch) => {
              setVeh((v) => ({ ...v, ...patch }));
              setError("");
            }}
            className="grid gap-4 sm:grid-cols-3"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" className="btn-primary btn-sm min-h-[44px]">
              <Search size={16} aria-hidden />
              Show what fits
            </button>
            <button
              type="button"
              onClick={closeChanger}
              className="btn-outline btn-sm min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={submitSize(true)} className="mt-4">
          <label htmlFor="fit-size" className="label">
            Size on your tires
          </label>
          <input
            id="fit-size"
            name="fit-size"
            value={size}
            onChange={(e) => {
              setSize(e.target.value);
              setError("");
            }}
            placeholder="225/45R17"
            autoComplete="off"
            autoCapitalize="characters"
            className="field max-w-xs"
          />
          <p className="mt-1.5 text-xs text-smoke">
            Printed on the sidewall, e.g. 225/45R17, and on the sticker in the
            driver&rsquo;s door jamb.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {onVehicle ? (
              <>
                <button
                  type="submit"
                  className="btn-primary btn-sm min-h-[44px]"
                >
                  Use for my {onVehicle.label}
                </button>
                <button
                  type="button"
                  onClick={submitSize(false)}
                  className="btn-outline btn-sm min-h-[44px]"
                >
                  Shop this size only
                </button>
              </>
            ) : (
              <button type="submit" className="btn-primary btn-sm min-h-[44px]">
                <Search size={16} aria-hidden />
                Shop this size
              </button>
            )}
            <button
              type="button"
              onClick={closeChanger}
              className="btn-outline btn-sm min-h-[44px]"
            >
              Cancel
            </button>
          </div>
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
  );
}

/**
 * "Know your exact size?": the size off the sticker in the driver's door
 * jamb, front plus an optional rear size for a staggered setup. Saving it
 * makes that the confirmed size: for the vehicle being shopped for (its
 * name stays on the bar), or on its own when there is no vehicle. Read with
 * the same parser as every other size on the site (readSize).
 */
function StickerForm() {
  const { resolved, selectVehicle, selectSize, closeChanger } = useVehicle();
  const onVehicle = resolved.kind === "vehicle" ? resolved : null;
  const [front, setFront] = useState(() =>
    resolved.kind === "size"
      ? resolved.size.display
      : onVehicle?.basis === "entered"
        ? onVehicle.chosen.front
        : "",
  );
  const [rear, setRear] = useState(() =>
    resolved.kind === "size"
      ? (resolved.rear?.display ?? "")
      : onVehicle?.basis === "entered"
        ? (onVehicle.chosen.rear ?? "")
        : "",
  );
  const [error, setError] = useState("");

  const unreadable = (v) =>
    `"${v.trim() || " "}" is not a size we can read. It looks like 225/40R19, LT265/70R17 or 31x10.50R15.`;

  const submit = (e) => {
    e.preventDefault();
    const f = readSize(front);
    if (!f) {
      setError(unreadable(front));
      return;
    }
    const r = rear.trim() ? readSize(rear) : null;
    if (rear.trim() && !r) {
      setError(unreadable(rear));
      return;
    }
    const rearSize = r && r.key !== f.key ? r.display : "";
    if (onVehicle) {
      selectVehicle({ ...onVehicle.vehicle, size: f.display, rear: rearSize });
    } else {
      selectSize(f.display, rearSize);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mt-4 border-t border-ink/10 pt-4"
      data-testid="sticker-form"
    >
      <p className="text-sm text-ink">
        The size is printed on the sticker in your driver&rsquo;s door jamb
        (and on the sidewall).
        {onVehicle && <> We&rsquo;ll keep your {onVehicle.label} on the bar.</>}
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sticker-front" className="label">
            Front size
          </label>
          <input
            id="sticker-front"
            name="sticker-front"
            value={front}
            onChange={(e) => {
              setFront(e.target.value);
              setError("");
            }}
            placeholder="225/40R19"
            autoComplete="off"
            autoCapitalize="characters"
            className="field"
          />
        </div>
        <div>
          <label htmlFor="sticker-rear" className="label">
            Rear size (if different)
          </label>
          <input
            id="sticker-rear"
            name="sticker-rear"
            value={rear}
            onChange={(e) => {
              setRear(e.target.value);
              setError("");
            }}
            placeholder="255/35R19"
            autoComplete="off"
            autoCapitalize="characters"
            className="field"
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="submit" className="btn-primary btn-sm min-h-[44px]">
          <Ruler size={16} aria-hidden />
          Save my size
        </button>
        <button
          type="button"
          onClick={closeChanger}
          className="btn-outline btn-sm min-h-[44px]"
        >
          Cancel
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-sm bg-sky px-3 py-2 text-sm font-medium text-ink"
        >
          {error}
        </p>
      )}
    </form>
  );
}

/** What the vehicle's size is based on, under the bar's headline. */
function basisLine(resolved) {
  if (resolved.kind === "size") return null;
  if (resolved.basis === "entered")
    return "The size you gave us for this vehicle.";
  if (resolved.basis === "trim") {
    return resolved.chosen?.trim
      ? `Factory size for the ${resolved.chosen.trim}.`
      : null;
  }
  if (resolved.basis === "typical") {
    return "Typical factory size on file for this model year. Trims and options vary, so check the sticker in your driver's door jamb.";
  }
  return null;
}

/**
 * "Shopping for: 2019 Toyota Tacoma (245/75R16) · Change", or "Shopping
 * for size 225/45R17 · Change", or a prompt to pick one. Sits at the top of
 * /tires, the product pages, Compare and the cart.
 *
 * `inline={false}` leaves the Change panel to the page: /tires reopens its
 * own finder (the one Shop Tires shows first) instead, prefilled.
 */
export function ShoppingForBar({ className = "", inline = true }) {
  const {
    ready,
    resolved,
    changer,
    openChanger,
    closeChanger,
    clear,
    registerBar,
  } = useVehicle();
  const ref = useRef(null);

  useEffect(() => registerBar(), [registerBar]);

  // A "Change vehicle" link elsewhere on the page brings the panel into view.
  useEffect(() => {
    // The door-jamb size form is always this bar's own, even where the page
    // brings back its own finder for Change (/tires).
    if (
      (inline || changer.tab === "sticker") &&
      changer.open &&
      changer.nonce > 0
    ) {
      ref.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, [inline, changer.open, changer.tab, changer.nonce]);

  const kind = resolved.kind;
  const basis = ready ? basisLine(resolved) : null;
  const unsized =
    kind === "vehicle" &&
    (resolved.status === "no-record" || resolved.status === "no-year");
  const choosing =
    kind === "vehicle" && resolved.status === "sized" && !resolved.chosen;
  // A size the shopper confirmed prints after the vehicle with a dot; the
  // typical size on file stays in brackets (the line below says it is
  // typical).
  const confirmedSize = kind === "vehicle" && resolved.basis === "entered";
  const staggered =
    (kind === "size" && Boolean(resolved.rear)) ||
    (confirmedSize && Boolean(resolved.chosen?.rear));
  const sticker = changer.open && changer.tab === "sticker";

  return (
    <section
      ref={ref}
      aria-label="What you're shopping for"
      data-testid="shopping-for"
      className={`card min-h-[4.25rem] scroll-mt-[calc(var(--header-h)+1rem)] border-l-4 border-l-drop p-4 md:p-5 ${className}`}
    >
      {ready && (
        <>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {kind === "size" ? (
              <Ruler size={20} aria-hidden className="shrink-0 text-drop" />
            ) : (
              <Car size={20} aria-hidden className="shrink-0 text-drop" />
            )}
            <p
              className="min-w-0 text-sm text-ink md:text-base"
              data-testid="shopping-for-text"
            >
              {kind === "none" && (
                <>
                  <span className="text-smoke">Shopping for:</span>{" "}
                  <span className="font-semibold">no vehicle picked yet</span>
                </>
              )}
              {kind === "vehicle" && (
                <>
                  <span className="text-smoke">Shopping for:</span>{" "}
                  <span className="font-display font-bold">
                    {resolved.label}
                  </span>{" "}
                  {confirmedSize ? (
                    <span className="tnum">
                      · {selectionSizeText(resolved)}
                    </span>
                  ) : (
                    <span className="tnum whitespace-nowrap">
                      ({selectionSizeText(resolved)})
                    </span>
                  )}
                </>
              )}
              {kind === "size" && (
                <>
                  <span className="text-smoke">Shopping for size</span>{" "}
                  <span className="tnum font-display font-bold">
                    {selectionSizeText(resolved)}
                  </span>
                </>
              )}
            </p>
            <span aria-hidden className="hidden text-smoke sm:inline">
              ·
            </span>
            <button
              type="button"
              aria-expanded={changer.open}
              onClick={() =>
                changer.open
                  ? closeChanger()
                  : openChanger(kind === "size" ? "size" : "vehicle")
              }
              className="inline-flex min-h-[44px] items-center font-display text-sm font-bold text-drop underline-offset-4 hover:underline"
            >
              {kind === "none" ? "Pick your vehicle" : "Change"}
            </button>
            {kind !== "none" && (
              <button
                type="button"
                onClick={() => {
                  clear();
                  openChanger("vehicle");
                }}
                className="inline-flex min-h-[44px] items-center text-sm text-smoke underline underline-offset-4 hover:text-drop"
              >
                Shopping for a different car?
              </button>
            )}
          </div>

          {kind === "none" ? (
            <p className="mt-1 text-xs leading-relaxed text-smoke sm:text-sm">
              Pick your vehicle or tire size and every tire shows whether it
              fits.
            </p>
          ) : (
            <p className="mt-1 text-xs leading-relaxed text-smoke sm:text-sm">
              {basis && <>{basis} </>}
              {unsized && (
                <>
                  We don&rsquo;t have the factory size for this one on file.{" "}
                  <button
                    type="button"
                    onClick={() => openChanger("sticker")}
                    className="font-semibold text-ink underline underline-offset-4 hover:text-drop"
                  >
                    Enter the size on your tires
                  </button>
                  .{" "}
                </>
              )}
              {CONFIRM_LINE}
            </p>
          )}

          {staggered && (
            <p
              data-testid="staggered-note"
              className="mt-2 text-xs font-semibold text-ink sm:text-sm"
            >
              {STAGGERED_NOTE}
            </p>
          )}

          <button
            type="button"
            aria-expanded={sticker}
            onClick={() => (sticker ? closeChanger() : openChanger("sticker"))}
            className="mt-1 inline-flex min-h-[44px] items-center text-left text-sm font-semibold text-ink underline underline-offset-4 hover:text-drop"
          >
            <Ruler size={16} aria-hidden className="mr-1.5 shrink-0 text-drop" />
            Know your exact size? Enter it from your door-jamb sticker
          </button>

          {choosing && (
            <TrimChoices choices={resolved.choices ?? resolved.options} />
          )}

          {sticker && <StickerForm key={changer.nonce} />}

          {inline && changer.open && !sticker && (
            <Changer key={changer.nonce} initialTab={changer.tab} />
          )}
        </>
      )}
    </section>
  );
}
