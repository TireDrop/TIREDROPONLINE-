import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Accordion,
  Breadcrumbs,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";
import { useVehicle } from "../../context/VehicleContext.jsx";
import { BUSINESS } from "../../data/business.js";
import {
  describeOption,
  readSize,
  resolveSelection,
} from "../../data/fitmentCheck.js";
import {
  PhotoError,
  lookUpVin,
  scanPhoto,
  scannerOn,
  shrinkPhoto,
  vehicleFromDecode,
} from "../../data/scanner.js";
import { normalizeVin, vinProblem, vinProblemText } from "../../data/vin.js";
import { trackToolUse } from "../../lib/analytics.js";

/**
 * /tire-size-finder: "What size tires does my car have?"
 *
 * Four ways in, the flow Justin approved in the clickable prototype:
 *   Scan door sticker  (primary; the factory size, front and rear)
 *   Scan tire sidewall (the size on that tire)
 *   Enter or scan VIN  (decodes the car through NHTSA; no tire size, so it
 *                       asks for the sticker, or offers the sizes on file
 *                       when the data has more than one for that car)
 *   Type my size
 * then Snap → Confirm ("Use these sizes" / "Edit", or "Couldn't read it
 * clearly") → Shop: the confirmed size(s) go into the same vehicle store as
 * the door-jamb entry under the Shopping-for bar (selectVehicle with size
 * and rear, or selectSize), and /tires shows them.
 *
 * The photo is shrunk on the phone (src/data/scanner.js) and read once by
 * POST /api/scan-tire-size; nothing is stored. When photo scans are off
 * (/api/status scanner "off", or a 503 scanner_not_configured), the photo
 * buttons say "Photo scan coming soon" and typing a VIN or a size still works.
 *
 * Copy rules: never "safe", "OK" or "fine"; pressures are "the pressure
 * printed on your sticker"; no promises.
 */

const TOOL_ID = "tire-size-finder";

// Step headings: the prototype's compact size, so a step fits a phone screen.
const H2 =
  "font-display text-[1.35rem] font-extrabold leading-tight tracking-[-0.01em] text-ink focus:outline-none md:text-2xl";

const MODE_COPY = {
  door: {
    title: "Point your camera at the door sticker",
    frame: "Fit the sticker inside the box",
    tip: 'The sticker is usually on the edge of the driver\'s door or the door frame. It says "Tire and Loading Information."',
    read: "Here's what your sticker says",
    thing: "sticker",
  },
  sidewall: {
    title: "Point your camera at the size on your tire's sidewall",
    frame: "Fit the size inside the box",
    tip: "The size is molded into the rubber on the side of the tire, like 225/45R17. Turn the steering wheel to see a front tire better.",
    read: "Here's what your tire says",
    thing: "tire",
  },
  vin: {
    title: "Point your camera at your VIN",
    frame: "Fit the VIN inside the box",
    tip: "The VIN is on a plate at the bottom of the windshield on the driver's side, and on a label in the driver's door frame.",
    read: "Here's the VIN we read",
    thing: "VIN",
  },
};

const UNCLEAR = {
  blurry: "That photo is too blurry to be sure",
  glare: "There's glare over the print",
  too_dark: "That photo is too dark to read",
  cut_off: "Part of it is cut off",
  invalid_vin: "We couldn't read all 17 characters of the VIN",
};

const WRONG = {
  door: "That doesn't look like the door sticker",
  sidewall: "That doesn't look like a tire sidewall",
  vin: "That doesn't look like a VIN",
};

const SCAN_ERRORS = {
  rate_limited:
    "You've scanned several photos in the last few minutes. Wait about ten minutes, or type the size instead.",
  image_too_large:
    "That photo is too large to send. Take a new one, or type the size instead.",
  unsupported_image:
    "We couldn't open that photo. Take a new one with your camera, or type the size instead.",
  photo: "We couldn't open that photo on this device. Take a new one with your camera, or type the size instead.",
  scanner_busy:
    "The photo scanner is busy right now. Try again in a minute, or type the size instead.",
  scanner_unavailable:
    `The photo scanner isn't working right now. Type the size from your door sticker or tire instead, or call us at ${BUSINESS.phone}.`,
  unreachable:
    "We couldn't reach the scanner just now. Try again in a minute, or type the size instead.",
};

const FAQ = [
  {
    q: "Where is the tire sticker on my car?",
    a: 'On most cars it is on the driver\'s door frame or on the edge of the driver\'s door, headed "Tire and Loading Information." Some cars put it inside the fuel door or the glove box. It lists the factory size for the front and rear tires, the spare, and the cold tire pressures.',
  },
  {
    q: "What if my front and rear sizes are different?",
    a: "That is a staggered setup, common on sports sedans and performance cars. The sticker lists both, and the finder keeps both: you shop 2 front tires in one size and 2 rear tires in the other. We confirm fitment before your order ships.",
  },
  {
    q: "Why doesn't my VIN give me a tire size?",
    a: "The VIN tells us the year, make, model and often the trim, through NHTSA's public database. NHTSA doesn't publish tire sizes, and many cars came with more than one wheel size, so the door sticker (or the size on your tires) is where the exact size comes from.",
  },
  {
    q: "What happens to my photo?",
    a: "It is shrunk on your phone, sent to our server and read once by Anthropic's AI to find the size, then dropped. We don't save the photo or your VIN. You can always type the size instead.",
  },
  {
    q: "Which tire pressure should I use?",
    a: "The pressure printed on your sticker is the carmaker's cold pressure for the factory size. The number molded on the tire's sidewall is the most that tire can hold, not a pressure to run it at. Check pressures cold, before driving.",
  },
];

/* ------------------------------------------------------------------ */

function Steps({ at }) {
  return (
    <ol className="flex flex-wrap gap-1.5 text-xs" aria-label="Steps">
      {["Snap", "Confirm", "Shop"].map((label, i) => (
        <li
          key={label}
          aria-current={i === at ? "step" : undefined}
          className={`rounded-full border px-2.5 py-0.5 ${
            i === at
              ? "border-drop bg-drop font-semibold text-bone"
              : "border-ink/15 bg-bone text-smoke"
          }`}
        >
          {i + 1} {label}
        </li>
      ))}
    </ol>
  );
}

function BackButton({ onClick, children = "← Back" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[44px] items-center justify-self-start font-semibold text-drop hover:text-dive"
    >
      {children}
    </button>
  );
}

function Pill({ tone, children }) {
  const cls =
    tone === "good"
      ? "bg-[#E8F5EE] text-[#1B6B41]"
      : "bg-amber/15 text-amberInk ring-1 ring-inset ring-amber/50";
  return (
    <p
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${cls}`}
    >
      {children}
    </p>
  );
}

const tireLine = (t) =>
  [t.size, `${t.load_index ?? ""}${t.speed_rating ?? ""}`].filter(Boolean).join(" ");

/** "Week 23 of 2019" from "2319". */
const dotText = (d) => `Week ${Number(d.slice(0, 2))} of 20${d.slice(2)}`;

/* ------------------------------------------------------------------ */

export default function TireSizeFinderPage() {
  const navigate = useNavigate();
  const { resolved, selectVehicle, selectSize } = useVehicle();

  const [step, setStep] = useState("home");
  const [mode, setMode] = useState("door");
  // null until /api/status answers; false shows "Photo scan coming soon".
  const [photoOn, setPhotoOn] = useState(null);
  const [reading, setReading] = useState(false);
  const [preview, setPreview] = useState("");
  const [scanError, setScanError] = useState("");
  const [result, setResult] = useState(null);
  // The car a VIN decoded to, kept so the sizes saved later go with it.
  const [car, setCar] = useState(null);
  const [vin, setVin] = useState("");
  const [vinState, setVinState] = useState({ busy: false, error: "", decode: "" });
  const [wheel, setWheel] = useState("");
  const [front, setFront] = useState("");
  const [rear, setRear] = useState("");
  const [typeError, setTypeError] = useState("");

  const headingRef = useRef(null);
  const cameraRef = useRef(null);
  const uploadRef = useRef(null);
  const moved = useRef(false);

  useEffect(() => {
    let alive = true;
    scannerOn().then((on) => {
      if (alive) setPhotoOn(on);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Each step's heading takes focus, so a screen reader hears where it is.
  useEffect(() => {
    if (!moved.current) return;
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current
      ?.closest("section")
      ?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [step]);

  // The preview is an object URL; let it go when it is replaced.
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const go = (next) => {
    moved.current = true;
    trackToolUse(TOOL_ID);
    setScanError("");
    setStep(next);
  };

  const openCamera = (m) => {
    setMode(m);
    setPreview("");
    go("camera");
    // On a phone or tablet the camera opens on this same tap: a browser only
    // lets a file input open from the user's own tap, so it can't wait for
    // the camera step to render (the inputs are always mounted below).
    // Cancelling the camera leaves the camera step's Take photo / Upload.
    if (photoOn === true && isTouchDevice()) cameraRef.current?.click();
  };

  const onPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || reading) return;
    setScanError("");
    setPreview(URL.createObjectURL(file));
    setReading(true);
    let image;
    try {
      image = await shrinkPhoto(file);
    } catch (err) {
      setReading(false);
      setScanError(err instanceof PhotoError ? SCAN_ERRORS.photo : SCAN_ERRORS.unreachable);
      return;
    }
    const answer = await scanPhoto(mode, image);
    setReading(false);
    if (!answer.ok) {
      if (answer.error === "scanner_not_configured") {
        setPhotoOn(false);
        return;
      }
      setScanError(SCAN_ERRORS[answer.error] ?? SCAN_ERRORS.unreachable);
      return;
    }
    const data = answer.data;
    if (data.status !== "read") {
      setResult(data);
      go("unclear");
      return;
    }
    if (mode === "vin") {
      setVin(data.vin ?? "");
      showVehicle(data);
      go("vin");
      return;
    }
    setResult(data);
    go("result");
  };

  function showVehicle(data) {
    const found = vehicleFromDecode(data.vehicle);
    setCar(found);
    setWheel("");
    setVinState({ busy: false, error: "", decode: data.decode ?? "" });
  }

  const submitVin = async (event) => {
    event.preventDefault();
    trackToolUse(TOOL_ID);
    const problem = vinProblem(vin);
    if (problem) {
      setCar(null);
      setVinState({ busy: false, error: vinProblemText(problem), decode: "" });
      return;
    }
    setVinState({ busy: true, error: "", decode: "" });
    const answer = await lookUpVin(normalizeVin(vin));
    if (!answer.ok) {
      setCar(null);
      setVinState({
        busy: false,
        error:
          answer.error === "invalid_vin"
            ? vinProblemText(answer.problem)
            : answer.error === "rate_limited"
              ? "You've looked up several VINs in the last few minutes. Wait about ten minutes and try again."
              : "We couldn't look up that VIN just now. Try again in a minute, or scan your door sticker instead.",
        decode: "",
      });
      return;
    }
    showVehicle(answer.data);
  };

  /** Saves the confirmed size(s) in the vehicle store and goes to /tires. */
  const saveSizes = (frontSize, rearSize) => {
    const f = readSize(frontSize);
    if (!f) return false;
    const r = rearSize ? readSize(rearSize) : null;
    const rearOut = r && r.key !== f.key ? r.display : "";
    const vehicle =
      car ?? (resolved.kind === "vehicle" ? resolved.vehicle : null);
    if (vehicle) {
      selectVehicle({
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        size: f.display,
        rear: rearOut,
      });
    } else {
      selectSize(f.display, rearOut);
    }
    trackToolUse(TOOL_ID);
    navigate("/tires");
    return true;
  };

  const startEdit = (fromResult) => {
    if (fromResult?.mode === "door") {
      setFront(fromResult.front?.size ?? "");
      setRear(fromResult.rear?.size ?? "");
    } else if (fromResult?.mode === "sidewall") {
      setFront(fromResult.tire?.size ?? "");
      setRear("");
    }
    setTypeError("");
    go("type");
  };

  const submitTyped = (event) => {
    event.preventDefault();
    const f = readSize(front);
    if (!f) {
      setTypeError(
        `"${front.trim() || " "}" is not a size we can read. It looks like 225/40R19, LT265/70R17 or 31x10.50R15.`,
      );
      return;
    }
    if (rear.trim() && !readSize(rear)) {
      setTypeError(
        `"${rear.trim()}" is not a size we can read. Leave the rear size empty if all four are the same.`,
      );
      return;
    }
    saveSizes(f.display, rear.trim());
  };

  // The sizes on file for a decoded car: a wheel-package choice only when
  // the data really has more than one. One typical size is not offered: it
  // would be a guess at this car's wheels.
  const carChoices = (() => {
    if (!car) return [];
    const r = resolveSelection({
      type: "vehicle",
      year: car.year,
      make: car.make,
      model: car.model,
    });
    return r.status === "sized" && r.basis === "trim" && (r.choices?.length ?? 0) > 1
      ? r.choices
      : [];
  })();

  const keepVehicle =
    car ?? (resolved.kind === "vehicle" ? resolved.vehicle : null);
  const keepLabel = keepVehicle
    ? car?.label ?? resolved.label
    : "";

  const comingSoon = photoOn === false;
  const copy = MODE_COPY[mode];

  /* ---------------------------- steps ---------------------------- */

  let body;
  if (step === "home") {
    body = (
      <>
        <h2 ref={headingRef} tabIndex={-1} className={H2}>
          Pick how you want to find it
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          <OptionButton
            primary
            icon="📷"
            title="Scan door sticker"
            note={comingSoon ? "Photo scan coming soon" : "Most accurate · one photo"}
            disabled={comingSoon}
            onClick={() => openCamera("door")}
          />
          <OptionButton
            icon="🛞"
            title="Scan tire sidewall"
            note={comingSoon ? "Photo scan coming soon" : "No sticker? Snap the tire"}
            disabled={comingSoon}
            onClick={() => openCamera("sidewall")}
          />
          <OptionButton
            icon="🔢"
            title="Enter or scan VIN"
            note="We look up your car"
            onClick={() => go("vin")}
          />
          <OptionButton
            icon="✏️"
            title="Type my size"
            note="e.g. 225/45R17"
            onClick={() => startEdit(null)}
          />
        </div>
        <p className="text-sm text-smoke">
          <span aria-hidden>📍 </span>
          {MODE_COPY.door.tip}
        </p>
      </>
    );
  } else if (step === "camera") {
    body = (
      <>
        <BackButton onClick={() => go(mode === "vin" ? "vin" : "home")} />
        <Steps at={0} />
        <h2 ref={headingRef} tabIndex={-1} className={H2}>
          {copy.title}
        </h2>
        <div
          className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink"
          data-testid="scan-viewport"
        >
          {preview ? (
            <img
              src={preview}
              alt="The photo you took"
              className="h-full w-full object-cover opacity-80"
            />
          ) : (
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#22344C,#070E1A_70%)]"
            />
          )}
          <div
            aria-hidden
            className="absolute inset-x-[7%] inset-y-[9%] rounded-xl border-[3px] border-volt shadow-[0_0_0_999px_rgba(0,0,0,0.35)]"
          />
          {reading && (
            <div
              aria-hidden
              className="scan-line absolute inset-x-[7%] h-[3px] bg-volt shadow-[0_0_14px_#00B4FC]"
            />
          )}
          <p className="absolute inset-x-0 bottom-3 text-center text-sm font-semibold text-bone">
            {reading ? "Reading…" : copy.frame}
          </p>
        </div>

        {comingSoon ? (
          <div className="rounded-md bg-sky px-4 py-3 text-sm text-ink" role="status">
            <p className="font-semibold">Photo scan coming soon.</p>
            <p className="mt-1">
              For now, type the size printed on your{" "}
              {mode === "vin" ? "door sticker or tire" : copy.thing}.
              {mode === "vin" ? " You can still type your VIN." : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" className="btn-primary btn-sm min-h-[44px]" onClick={() => startEdit(null)}>
                ✏️ Type my size
              </button>
              {mode === "vin" && (
                <button type="button" className="btn-outline btn-sm min-h-[44px]" onClick={() => go("vin")}>
                  Type my VIN
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-primary min-h-[46px]"
              disabled={reading}
              onClick={() => cameraRef.current?.click()}
            >
              {reading ? "Reading…" : preview ? "📸 Retake photo" : "📸 Take photo"}
            </button>
            <button
              type="button"
              className="btn-outline min-h-[46px]"
              disabled={reading}
              onClick={() => uploadRef.current?.click()}
            >
              Upload a photo
            </button>
          </div>
        )}

        <p className="sr-only" aria-live="polite">
          {reading ? "Reading your photo." : ""}
        </p>
        {scanError && (
          <p role="alert" className="rounded-md bg-sky px-3 py-2 text-sm font-medium text-ink">
            {scanError}
          </p>
        )}
        <p className="text-sm text-smoke">
          {copy.tip} On a phone this opens your camera; on a computer you
          upload a photo. Photos are read once and never saved.
        </p>
      </>
    );
  } else if (step === "result" && result) {
    const isDoor = result.mode === "door";
    const staggered = isDoor && Boolean(result.rear);
    const pf = result.pressure_front_psi;
    const pr = result.pressure_rear_psi;
    body = (
      <>
        <BackButton onClick={() => openCamera(result.mode)}>← Retake</BackButton>
        <Steps at={1} />
        {result.confidence === "high" ? (
          <Pill tone="good">✓ Read clearly</Pill>
        ) : (
          <Pill tone="warn">Read: check it against your {MODE_COPY[result.mode].thing}</Pill>
        )}
        <h2 ref={headingRef} tabIndex={-1} className={H2}>
          {MODE_COPY[result.mode].read}
        </h2>
        <dl
          className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2"
          data-testid="scan-result"
        >
          {isDoor ? (
            <>
              <dt className="text-sm font-semibold text-smoke">{staggered ? "Front" : "Size"}</dt>
              <dd className="tnum font-mono text-lg font-bold text-ink">{tireLine(result.front)}</dd>
              {staggered && (
                <>
                  <dt className="text-sm font-semibold text-smoke">Rear</dt>
                  <dd className="tnum font-mono text-lg font-bold text-ink">{tireLine(result.rear)}</dd>
                </>
              )}
              {result.spare && (
                <>
                  <dt className="text-sm font-semibold text-smoke">Spare</dt>
                  <dd className="tnum font-mono text-base font-bold text-ink">{tireLine(result.spare)}</dd>
                </>
              )}
              {(pf || pr) && (
                <>
                  <dt className="text-sm font-semibold text-smoke">Pressure</dt>
                  <dd className="text-sm text-ink">
                    <span className="tnum font-mono text-[15px] font-bold">
                      {pf && pr && pf !== pr
                        ? `${pf} psi front · ${pr} psi rear`
                        : `${pf ?? pr} psi`}
                    </span>
                    <span className="block text-smoke">the pressure printed on your sticker</span>
                  </dd>
                </>
              )}
            </>
          ) : (
            <>
              <dt className="text-sm font-semibold text-smoke">Size</dt>
              <dd className="tnum font-mono text-lg font-bold text-ink">{tireLine(result.tire)}</dd>
              {result.tire.dot_week_year && (
                <>
                  <dt className="text-sm font-semibold text-smoke">Made</dt>
                  <dd className="text-sm text-ink">{dotText(result.tire.dot_week_year)} (DOT date code)</dd>
                </>
              )}
            </>
          )}
        </dl>
        {staggered && (
          <p className="text-sm text-ink">
            Different front and rear sizes (staggered). You&rsquo;ll need{" "}
            <b>2 front + 2 rear</b>.
          </p>
        )}
        {!isDoor && (
          <p className="text-sm text-smoke">
            This is the size on this tire. Your door sticker has the factory
            size; if your car has different sizes front and rear, scan the
            sticker instead.
          </p>
        )}
        {keepLabel && (
          <p className="text-sm text-smoke">
            We&rsquo;ll keep your {keepLabel} on the Shopping-for bar.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-primary min-h-[46px]"
            onClick={() =>
              isDoor
                ? saveSizes(result.front.size, result.rear?.size ?? "")
                : saveSizes(result.tire.size, "")
            }
          >
            ✅ {staggered ? "Use these sizes" : "Use this size"}
          </button>
          <button type="button" className="btn-outline min-h-[46px]" onClick={() => startEdit(result)}>
            ✏️ Edit
          </button>
        </div>
      </>
    );
  } else if (step === "unclear" && result) {
    const headline =
      result.reason === "wrong_image"
        ? WRONG[result.mode]
        : (UNCLEAR[result.reason] ?? "We couldn't read it clearly");
    body = (
      <>
        <BackButton onClick={() => openCamera(result.mode)}>← Retake</BackButton>
        <Pill tone="warn">⚠ Couldn&rsquo;t read it clearly</Pill>
        <h2 ref={headingRef} tabIndex={-1} className={H2}>
          {headline}
        </h2>
        <p className="text-sm text-ink">
          {result.mode === "vin"
            ? "We won't guess a VIN. Try again with the VIN filling the box and no glare, or type it."
            : `We won't guess your tire size. Try again with the ${MODE_COPY[result.mode].thing === "tire" ? "size" : "sticker"} filling the box and no glare, or type the size printed on it.`}
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-primary min-h-[46px]" onClick={() => openCamera(result.mode)}>
            📸 Retake photo
          </button>
          <button
            type="button"
            className="btn-outline min-h-[46px]"
            onClick={() => (result.mode === "vin" ? go("vin") : startEdit(null))}
          >
            ✏️ Type it instead
          </button>
        </div>
      </>
    );
  } else if (step === "vin") {
    body = (
      <>
        <BackButton onClick={() => go("home")} />
        <h2 ref={headingRef} tabIndex={-1} className={H2}>
          Enter your VIN
        </h2>
        <form onSubmit={submitVin} className="grid gap-3" noValidate>
          <div>
            <label htmlFor="finder-vin" className="label">
              VIN (17 characters)
            </label>
            <p id="finder-vin-hint" className="mb-1.5 text-xs text-smoke">
              On your dashboard by the windshield, the driver&rsquo;s door
              frame, your registration or your insurance card.
            </p>
            <input
              id="finder-vin"
              name="finder-vin"
              value={vin}
              onChange={(e) => {
                setVin(e.target.value.toUpperCase());
                setVinState((s) => ({ ...s, error: "" }));
              }}
              maxLength={20}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-describedby="finder-vin-hint"
              aria-invalid={vinState.error ? true : undefined}
              className="field font-mono uppercase"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary min-h-[46px]" disabled={vinState.busy}>
              {vinState.busy ? "Looking up…" : "Look up my car"}
            </button>
            <button
              type="button"
              className="btn-outline min-h-[46px]"
              disabled={comingSoon}
              onClick={() => openCamera("vin")}
            >
              {comingSoon ? "📷 Photo scan coming soon" : "📷 Scan my VIN"}
            </button>
          </div>
        </form>
        {vinState.error && (
          <p role="alert" className="rounded-md bg-sky px-3 py-2 text-sm font-medium text-ink">
            {vinState.error}
          </p>
        )}
        {!vinState.error && vinState.decode === "not_found" && (
          <p role="alert" className="rounded-md bg-sky px-3 py-2 text-sm font-medium text-ink">
            NHTSA&rsquo;s database has no vehicle for that VIN. Check it
            against your registration, or scan your door sticker instead.
          </p>
        )}
        {!vinState.error && vinState.decode === "unavailable" && (
          <p role="alert" className="rounded-md bg-sky px-3 py-2 text-sm font-medium text-ink">
            We couldn&rsquo;t reach NHTSA&rsquo;s VIN database just now. Try
            again in a minute, or scan your door sticker instead.
          </p>
        )}
        {car && (
          <div className="grid gap-3" data-testid="vin-vehicle">
            <p className="rounded-md bg-sky px-3 py-2.5 text-sm text-ink" role="status">
              Found: <b className="font-display">{car.label}</b>
              {car.details && <span className="text-smoke"> · {car.details}</span>}
            </p>
            {carChoices.length > 1 ? (
              <form
                className="grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const pick = carChoices.find((o) => describeOption(o) === wheel);
                  if (pick) saveSizes(pick.front, pick.rear ?? "");
                  else openCamera("door");
                }}
              >
                <fieldset className="grid gap-2">
                  <legend className="h3 mb-1">Which wheels do you have?</legend>
                  <p className="text-sm text-smoke">
                    This car came with more than one factory size. Pick
                    yours, or check your door sticker.
                  </p>
                  {carChoices.map((o) => (
                    <label key={describeOption(o)} className="flex cursor-pointer items-start gap-2.5 rounded-md border border-ink/15 p-3">
                      <input
                        type="radio"
                        name="finder-wheel"
                        value={describeOption(o)}
                        checked={wheel === describeOption(o)}
                        onChange={() => setWheel(describeOption(o))}
                        className="mt-1 h-[18px] w-[18px] accent-drop"
                      />
                      <span>
                        {o.trim && <b>{o.trim}</b>}
                        <span className="tnum block font-mono text-sm">{describeOption(o)}</span>
                      </span>
                    </label>
                  ))}
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-ink/15 p-3">
                    <input
                      type="radio"
                      name="finder-wheel"
                      value=""
                      checked={wheel === ""}
                      onChange={() => setWheel("")}
                      className="mt-1 h-[18px] w-[18px] accent-drop"
                    />
                    <span>
                      <b>Not sure?</b>
                      <span className="block text-sm text-smoke">Scan your door sticker instead</span>
                    </span>
                  </label>
                </fieldset>
                <button type="submit" className="btn-primary min-h-[46px]">
                  Show tires that fit
                </button>
              </form>
            ) : (
              <>
                <p className="text-sm text-ink">
                  The VIN gives us your car, not its tire size: the same model
                  often came with different wheels. Scan your door sticker for
                  the exact size.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className={`${comingSoon ? "btn-outline" : "btn-primary"} min-h-[46px]`}
                    disabled={comingSoon}
                    onClick={() => openCamera("door")}
                  >
                    {comingSoon ? "📷 Photo scan coming soon" : "📷 Scan your door sticker"}
                  </button>
                  <button
                    type="button"
                    className={`${comingSoon ? "btn-primary" : "btn-outline"} min-h-[46px]`}
                    onClick={() => startEdit(null)}
                  >
                    ✏️ Type my size
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </>
    );
  } else {
    // "type", and a fallback for any step whose data is gone.
    body = (
      <>
        <BackButton onClick={() => go("home")} />
        <h2 ref={headingRef} tabIndex={-1} className={H2}>
          Type the size from your sticker
        </h2>
        <form onSubmit={submitTyped} className="grid gap-4" noValidate>
          <div>
            <label htmlFor="finder-front" className="label">
              Front (or all four)
            </label>
            <input
              id="finder-front"
              name="finder-front"
              value={front}
              onChange={(e) => {
                setFront(e.target.value);
                setTypeError("");
              }}
              placeholder="225/40R19"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="field font-mono uppercase"
            />
          </div>
          <div>
            <label htmlFor="finder-rear" className="label">
              Rear, if different (optional)
            </label>
            <input
              id="finder-rear"
              name="finder-rear"
              value={rear}
              onChange={(e) => {
                setRear(e.target.value);
                setTypeError("");
              }}
              placeholder="255/35R19"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="field font-mono uppercase"
            />
          </div>
          {keepLabel && (
            <p className="text-sm text-smoke">
              We&rsquo;ll keep your {keepLabel} on the Shopping-for bar.
            </p>
          )}
          <button type="submit" className="btn-primary min-h-[46px] justify-self-start">
            Show tires that fit
          </button>
        </form>
        {typeError && (
          <p role="alert" className="rounded-md bg-sky px-3 py-2 text-sm font-medium text-ink">
            {typeError}
          </p>
        )}
        <p className="text-sm text-smoke">
          The size is on the sticker in your driver&rsquo;s door frame and on
          the tire&rsquo;s sidewall. A staggered car lists two sizes:
          you&rsquo;ll need 2 front + 2 rear.
        </p>
      </>
    );
  }

  return (
    <>
      <Seo
        title="Tire Size Finder: what size tires does my car have?"
        description="Find your exact tire size: scan the tire sticker in your driver's door frame or the size on your tire's sidewall, look up your car by VIN, or type the size. Front and rear sizes for staggered cars."
      />
      <Breadcrumbs trail={[{ label: "Tire Size Finder" }]} />

      {/* Phone first: the intro stays short so the four ways in sit on the
          first screen, as in the approved prototype. */}
      <div className="bg-fog px-5 pb-14 pt-6 md:px-8 md:pb-20 md:pt-12">
        <header className="mx-auto mb-5 max-w-xl">
          <p className="eyebrow mb-2 text-drop">Free tool</p>
          <h1 className="font-display text-[1.75rem] font-black leading-[1.1] tracking-[-0.02em] text-ink text-balance md:text-[2.5rem]">
            What size tires does my car have?
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-smoke md:text-base">
            Scan the sticker on your driver&rsquo;s door frame and we&rsquo;ll
            read the factory tire size printed on it.
          </p>
        </header>
        <section
          aria-label="Tire Size Finder"
          data-testid="finder"
          data-step={step}
          data-photo={photoOn === null ? "unknown" : photoOn ? "on" : "off"}
          className="card mx-auto grid max-w-xl scroll-mt-[calc(var(--header-h)+1rem)] gap-4 p-5 md:p-7"
        >
          {body}
          {/* Always mounted, so a scan tile can open the camera on the same
              tap (see openCamera). capture="environment" asks a phone for
              its rear camera; the upload input opens the photo library. */}
          <input
            ref={cameraRef}
            id="scan-camera"
            data-testid="scan-camera"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            tabIndex={-1}
            aria-hidden
            onChange={onPhoto}
          />
          <input
            ref={uploadRef}
            id="scan-upload"
            data-testid="scan-upload"
            type="file"
            accept="image/*"
            className="hidden"
            tabIndex={-1}
            aria-hidden
            onChange={onPhoto}
          />
        </section>
        <p className="mx-auto mt-4 max-w-xl text-center text-xs text-smoke">
          Photos and VINs are used once to answer you and never saved. See our{" "}
          <Link to="/privacy#what-we-collect" className="underline underline-offset-4 hover:text-drop">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <Section>
        <SectionHead
          eyebrow="Questions"
          title="Tire size questions people ask"
          lede="Short answers about the sticker, staggered sizes, VINs and your photo."
        />
        <Accordion items={FAQ} />
      </Section>
    </>
  );
}

/** A phone or tablet: its main pointer is a finger, so it has a camera to open. */
function isTouchDevice() {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.("(pointer: coarse)").matches);
}

function OptionButton({ primary = false, icon, title, note, disabled = false, onClick }) {
  // An unavailable option is a plain tile that says so, never a faded
  // primary button (grey on pale blue is hard to read).
  const look = disabled
    ? "cursor-not-allowed border-dashed border-ink/25 bg-fog text-ink"
    : primary
      ? "border-drop bg-drop text-bone transition-colors hover:bg-dive"
      : "border-ink/15 bg-bone text-ink transition-colors hover:border-drop";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`grid content-start gap-1 rounded-xl border p-3.5 text-left ${
        primary ? "col-span-2 min-h-[84px]" : "min-h-[96px]"
      } ${look}`}
    >
      <span aria-hidden className="text-[22px] leading-none">
        {icon}
      </span>
      <span className="font-display text-[15px] font-bold">{title}</span>
      <span
        className={`text-[13px] ${
          disabled ? "font-semibold text-amberInk" : primary ? "text-bone/90" : "text-smoke"
        }`}
      >
        {note}
      </span>
    </button>
  );
}
