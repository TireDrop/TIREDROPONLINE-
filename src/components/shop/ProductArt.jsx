import React, { useId } from "react";

// We ship without product photography, so every tire and wheel is drawn as a
// deterministic inline SVG. The product's `accent` colour drives the sidewall
// ring on tires and the spoke face on wheels, which keeps the grid varied
// without a single image request.

const VIEW = 200;
const C = VIEW / 2;

/** Evenly spaced angles used for tread blocks, spokes and lug holes. */
function ring(count, offset = 0) {
  return Array.from({ length: count }, (_, i) => (360 / count) * i + offset);
}

export function TireArt({
  accent = "#E03A1E",
  size = 200,
  label = "Tire illustration",
  className = "",
}) {
  const uid = useId().replace(/:/g, "");
  const rubber = `rubber-${uid}`;
  const sheen = `sheen-${uid}`;
  const treadClip = `tread-${uid}`;

  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={className}
    >
      <defs>
        <radialGradient id={rubber} cx="38%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#3A4048" />
          <stop offset="55%" stopColor="#1A1D21" />
          <stop offset="100%" stopColor="#0B0C0E" />
        </radialGradient>
        <linearGradient id={sheen} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.26" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        {/* Confines the tread blocks to the outer band of the carcass. */}
        <clipPath id={treadClip}>
          <path
            d={`M ${C} 4 a 96 96 0 1 0 0.01 0 Z M ${C} 68 a 32 32 0 1 1 -0.01 0 Z`}
            clipRule="evenodd"
          />
        </clipPath>
      </defs>

      {/* Carcass */}
      <circle cx={C} cy={C} r="96" fill={`url(#${rubber})`} />

      {/* Tread blocks — two staggered rows plus circumferential grooves */}
      <g clipPath={`url(#${treadClip})`} opacity="0.85">
        {ring(26).map((deg) => (
          <rect
            key={`o${deg}`}
            x={C - 4.5}
            y="4"
            width="9"
            height="24"
            rx="2"
            fill="#4A515A"
            opacity="0.55"
            transform={`rotate(${deg} ${C} ${C})`}
          />
        ))}
        {ring(26, 6.9).map((deg) => (
          <rect
            key={`i${deg}`}
            x={C - 5.5}
            y="30"
            width="11"
            height="22"
            rx="2"
            fill="#3C434B"
            opacity="0.5"
            transform={`rotate(${deg} ${C} ${C})`}
          />
        ))}
      </g>
      <circle
        cx={C}
        cy={C}
        r="82"
        fill="none"
        stroke="#0B0C0E"
        strokeWidth="3"
        opacity="0.8"
      />
      <circle
        cx={C}
        cy={C}
        r="70"
        fill="none"
        stroke="#0B0C0E"
        strokeWidth="2.5"
        opacity="0.7"
      />

      {/* Sidewall */}
      <circle cx={C} cy={C} r="62" fill="#131519" />
      <circle
        cx={C}
        cy={C}
        r="62"
        fill="none"
        stroke="#000000"
        strokeWidth="1.5"
        opacity="0.6"
      />

      {/* Accent sidewall ring — the product's colour signature */}
      <circle
        cx={C}
        cy={C}
        r="54"
        fill="none"
        stroke={accent}
        strokeWidth="3.5"
      />
      <circle
        cx={C}
        cy={C}
        r="47"
        fill="none"
        stroke={accent}
        strokeWidth="1.25"
        opacity="0.45"
      />

      {/* Hub suggestion so the centre does not read as a hole */}
      <circle cx={C} cy={C} r="38" fill="#20242A" />
      <circle
        cx={C}
        cy={C}
        r="38"
        fill="none"
        stroke="#0B0C0E"
        strokeWidth="2"
      />
      {ring(5, 36).map((deg) => (
        <rect
          key={`s${deg}`}
          x={C - 3}
          y={C - 34}
          width="6"
          height="26"
          rx="3"
          fill="#2E343C"
          transform={`rotate(${deg} ${C} ${C})`}
        />
      ))}
      <circle cx={C} cy={C} r="9" fill="#2E343C" />
      <circle cx={C} cy={C} r="3.5" fill="#12151A" />

      {/* Single light source, applied last so it sits over every layer */}
      <circle cx={C} cy={C} r="96" fill={`url(#${sheen})`} />
    </svg>
  );
}

export function WheelArt({
  accent = "#6B7280",
  size = 200,
  label = "Wheel illustration",
  className = "",
}) {
  const uid = useId().replace(/:/g, "");
  const lip = `lip-${uid}`;
  const face = `face-${uid}`;
  const sheen = `wsheen-${uid}`;

  // One tapered spoke drawn pointing up from the centre, then rotated.
  const spoke =
    "M -7 -24 L -14 -66 Q 0 -75 14 -66 L 7 -24 Q 0 -19 -7 -24 Z";

  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={className}
    >
      <defs>
        <linearGradient id={lip} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#C6CBD2" />
          <stop offset="40%" stopColor="#8A929C" />
          <stop offset="100%" stopColor="#3A4048" />
        </linearGradient>
        <radialGradient id={face} cx="36%" cy="28%" r="80%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="70%" stopColor={accent} stopOpacity="0.72" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.45" />
        </radialGradient>
        <linearGradient id={sheen} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Outer lip and barrel */}
      <circle cx={C} cy={C} r="96" fill={`url(#${lip})`} />
      <circle cx={C} cy={C} r="88" fill="#15181C" />
      <circle
        cx={C}
        cy={C}
        r="88"
        fill="none"
        stroke="#0B0C0E"
        strokeWidth="1.5"
      />
      <circle
        cx={C}
        cy={C}
        r="80"
        fill="none"
        stroke={`url(#${lip})`}
        strokeWidth="7"
      />

      {/* Bolt-circle detail on the barrel */}
      {ring(20, 9).map((deg) => (
        <rect
          key={`b${deg}`}
          x={C - 1.4}
          y="14"
          width="2.8"
          height="8"
          rx="1.4"
          fill="#0B0C0E"
          opacity="0.45"
          transform={`rotate(${deg} ${C} ${C})`}
        />
      ))}

      {/* Spoke face in the product accent */}
      <g transform={`translate(${C} ${C})`}>
        {ring(5).map((deg) => (
          <g key={`sp${deg}`} transform={`rotate(${deg})`}>
            <path d={spoke} fill={`url(#${face})`} />
            <path
              d={spoke}
              fill="none"
              stroke="#0B0C0E"
              strokeWidth="1.75"
              strokeLinejoin="round"
              opacity="0.7"
            />
          </g>
        ))}
      </g>

      {/* Centre cap and lug holes */}
      <circle cx={C} cy={C} r="26" fill={accent} />
      <circle
        cx={C}
        cy={C}
        r="26"
        fill="none"
        stroke="#0B0C0E"
        strokeWidth="2"
        opacity="0.75"
      />
      {ring(5, 36).map((deg) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        return (
          <circle
            key={`l${deg}`}
            cx={C + Math.cos(rad) * 15}
            cy={C + Math.sin(rad) * 15}
            r="3.6"
            fill="#0B0C0E"
            opacity="0.85"
          />
        );
      })}
      <circle cx={C} cy={C} r="7" fill="#15181C" />

      <circle cx={C} cy={C} r="96" fill={`url(#${sheen})`} />
    </svg>
  );
}

export default function ProductArt({ kind, accent, size, label, className }) {
  const Art = kind === "wheel" ? WheelArt : TireArt;
  return (
    <Art accent={accent} size={size} label={label} className={className} />
  );
}
