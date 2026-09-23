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
  accent = "#C8102E",
  size = 200,
  label = "Tire illustration",
  className = "",
}) {
  const uid = useId().replace(/:/g, "");
  const id = (n) => `${n}-${uid}`;

  // Geometry for the three-quarter view. The far sidewall sits up and to the
  // right of the near one; the crescent between them is the tread band, and
  // drawing it that way is the whole reason this reads as a tire rather than
  // a circle.
  const NEAR_X = 104;
  const FAR_X = 137;
  const CY = 98;
  const R = 84; // outer radius of the carcass
  const RIM = 46; // the bead — where the sidewall would seat on a rim

  // Tread blocks march around the visible crescent. They are drawn as
  // quadrilaterals that narrow toward the far sidewall, which is what gives
  // the band its curvature.
  const treadBlocks = Array.from({ length: 22 }, (_, i) => {
    const t = i / 22;
    const a = (-78 + t * 156) * (Math.PI / 180); // the arc facing the viewer
    const sin = Math.sin(a);
    const cos = Math.cos(a);
    const nx = NEAR_X + cos * R;
    const ny = CY + sin * R;
    const fx = FAR_X + cos * R;
    const fy = CY + sin * R;
    // Blocks foreshorten as they wrap away from the centre of the band.
    const w = 5.2 * Math.max(0.25, cos);
    const dx = -sin * w;
    const dy = cos * w;
    return {
      key: i,
      d: `M ${nx - dx} ${ny - dy} L ${fx - dx} ${fy - dy} L ${fx + dx} ${fy + dy} L ${nx + dx} ${ny + dy} Z`,
      shade: 0.18 + cos * 0.22,
    };
  });

  return (
    <svg
      viewBox="0 0 240 200"
      width={size}
      height={size * (200 / 240)}
      role="img"
      aria-label={label}
      className={className}
    >
      <defs>
        {/* Rubber is a very dark warm grey, not black, and it is matte — so
            the falloff is broad and the highlight is weak. */}
        <radialGradient id={id("side")} cx="34%" cy="26%" r="86%">
          <stop offset="0%" stopColor="#32373E" />
          <stop offset="48%" stopColor="#1C2025" />
          <stop offset="100%" stopColor="#0C0E11" />
        </radialGradient>
        <linearGradient id={id("band")} x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0%" stopColor="#23272D" />
          <stop offset="45%" stopColor="#14171B" />
          <stop offset="100%" stopColor="#0A0B0D" />
        </linearGradient>
        {/* The bore: the inside of the far sidewall, catching a little of the
            same light and falling off fast. */}
        <radialGradient id={id("bore")} cx="30%" cy="30%" r="85%">
          <stop offset="0%" stopColor="#252A31" />
          <stop offset="55%" stopColor="#111418" />
          <stop offset="100%" stopColor="#050607" />
        </radialGradient>
        <radialGradient id={id("shadow")} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#070E1A" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#070E1A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("sheen")} x1="0.15" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.16" />
          <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Contact shadow. Without something under it the tire floats, which is
          the difference between a product shot and an icon. */}
      <ellipse
        cx={NEAR_X + 12}
        cy="188"
        rx="86"
        ry="11"
        fill={`url(#${id("shadow")})`}
      />

      {/* Far sidewall, then the tread band that connects it to the near one. */}
      <circle cx={FAR_X} cy={CY} r={R} fill="#0A0B0D" />
      <path
        d={`M ${NEAR_X} ${CY - R} L ${FAR_X} ${CY - R} A ${R} ${R} 0 0 1 ${FAR_X} ${CY + R} L ${NEAR_X} ${CY + R} A ${R} ${R} 0 0 0 ${NEAR_X} ${CY - R} Z`}
        fill={`url(#${id("band")})`}
      />

      {/* Tread. Two circumferential grooves and a row of blocks between. */}
      {treadBlocks.map((b) => (
        <path key={b.key} d={b.d} fill="#575F69" opacity={b.shade} />
      ))}
      <path
        d={`M ${NEAR_X + 11} ${CY - R + 1} L ${FAR_X - 11} ${CY - R + 1} A ${R} ${R} 0 0 1 ${FAR_X - 11} ${CY + R - 1} L ${NEAR_X + 11} ${CY + R - 1}`}
        fill="none"
        stroke="#05060750"
        strokeWidth="3"
      />

      {/* Near sidewall — the face of the tire. */}
      <circle cx={NEAR_X} cy={CY} r={R} fill={`url(#${id("side")})`} />
      <circle
        cx={NEAR_X}
        cy={CY}
        r={R}
        fill="none"
        stroke="#000"
        strokeWidth="1.2"
        opacity="0.5"
      />

      {/* Shoulder step, then the raised lettering band every sidewall carries.
          The marks are deliberately abstract: real moulded text would be a
          brand claim we cannot make for a catalog we do not yet have. */}
      <circle
        cx={NEAR_X}
        cy={CY}
        r={R - 9}
        fill="none"
        stroke="#000"
        strokeWidth="6"
        opacity="0.28"
      />
      <circle
        cx={NEAR_X}
        cy={CY}
        r={R - 22}
        fill="none"
        stroke="#3A4149"
        strokeWidth="1"
        opacity="0.55"
      />
      {ring(30).map((deg) => (
        <rect
          key={`t${deg}`}
          x={NEAR_X - 1}
          y={CY - (R - 15)}
          width="2"
          height="5"
          rx="1"
          fill="#444B54"
          opacity="0.5"
          transform={`rotate(${deg} ${NEAR_X} ${CY})`}
        />
      ))}
      <circle
        cx={NEAR_X}
        cy={CY}
        r={R - 33}
        fill="none"
        stroke="#2B3037"
        strokeWidth="7"
        opacity="0.5"
      />

      {/* The centre is a hollow, not a wheel. We sell tires; a catalog shot of
          a tire on an invented rim is the thing that gives away that nobody
          photographed one. So the bore shows the inner wall of the far
          sidewall, lit from the same side as everything else. */}
      <circle cx={NEAR_X} cy={CY} r={RIM} fill="#07080A" />
      <ellipse
        cx={NEAR_X + 9}
        cy={CY}
        rx={RIM - 4}
        ry={RIM - 2}
        fill={`url(#${id("bore")})`}
      />
      <circle
        cx={NEAR_X}
        cy={CY}
        r={RIM}
        fill="none"
        stroke="#000"
        strokeWidth="2"
        opacity="0.75"
      />
      {/* The bead — the steel-reinforced lip that seats against a rim. */}
      <circle
        cx={NEAR_X}
        cy={CY}
        r={RIM + 3}
        fill="none"
        stroke="#3E454E"
        strokeWidth="1.2"
        opacity="0.45"
      />

      {/* A single coloured marking on the tread. Real tires carry one — a
          balance or uniformity dot — and it is the one place a product's
          accent belongs without pretending the rubber is any colour but
          black. It also keeps the grid from reading as twenty identical
          circles. */}
      <circle
        cx={NEAR_X + (FAR_X - NEAR_X) / 2}
        cy={CY - R + 5}
        r="3.4"
        fill={accent}
        opacity="0.9"
      />

      {/* One light source, last, so it sits over every layer. */}
      <circle cx={NEAR_X} cy={CY} r={R} fill={`url(#${id("sheen")})`} />
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
  const spoke = "M -7 -24 L -14 -66 Q 0 -75 14 -66 L 7 -24 Q 0 -19 -7 -24 Z";

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
