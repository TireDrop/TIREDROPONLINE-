import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { handOffPhoto } from "../../data/scanHandoff.js";
import { isTouchDevice, scannerOn } from "../../data/scanner.js";

/**
 * "📸 Scan door sticker, tire or VIN": the one-camera way into the Tire Size
 * Finder from anywhere else (the home hero, /tires).
 *
 * On a phone or tablet, with photo scans on, the tap opens the rear camera
 * right away (a browser only opens a file input from the user's own tap, so
 * the input lives here, not on the finder). The photo is handed to the finder
 * in memory (src/data/scanHandoff.js), which reads it in its one "auto" mode:
 * the server works out whether it is the door sticker, a sidewall or a VIN.
 *
 * On a computer, or while /api/status has not said scans are on, the tap
 * goes to /tire-size-finder?scan=1, which opens the camera step there (with
 * Upload a photo, and typing when scans are off).
 */
export default function ScanTireButton({
  className = "",
  label = "Scan door sticker, tire or VIN",
  testId = "scan-tire-button",
}) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  // null until /api/status answers.
  const [photoOn, setPhotoOn] = useState(null);

  useEffect(() => {
    let alive = true;
    scannerOn().then((on) => {
      if (alive) setPhotoOn(on);
    });
    return () => {
      alive = false;
    };
  }, []);

  const finder = "/tire-size-finder?scan=1";

  const onClick = () => {
    if (photoOn === true && isTouchDevice()) inputRef.current?.click();
    else navigate(finder);
  };

  const onPhoto = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    handOffPhoto(file);
    navigate(finder);
  };

  return (
    <>
      <button type="button" data-testid={testId} className={className} onClick={onClick}>
        <span aria-hidden>📸</span> {label}
      </button>
      <input
        ref={inputRef}
        data-testid={`${testId}-input`}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={onPhoto}
      />
    </>
  );
}
