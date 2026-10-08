import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * PREVIEW ONLY: a showcase of the tire-and-rim transitions anime.js can do,
 * placed above the real home hero. Remove this component and its one line in
 * HomePage.jsx to take it out; nothing else depends on it.
 *
 * Design rules it follows:
 *  - anime.js is imported on demand inside an effect, so it is not in the main
 *    bundle and the prerendered HTML is just the still wheel.
 *  - Everything is transform / opacity / filter, so nothing reflows.
 *  - prefers-reduced-motion: the wheel stays still and the controls are hidden.
 *  - The wheel is decorative (aria-hidden); the buttons are real buttons.
 */

const SPOKES = 10;
const TREAD = 56;
const LUGS = 5;

// One twin-spoke, drawn pointing up from the hub (200,200). Rotated N times.
const SPOKE_PATH =
  "M -13 -30 L -26 -108 L -10 -110 L -4 -30 Z M 13 -30 L 26 -108 L 10 -110 L 4 -30 Z";

const SCENES = [
  { id: "assemble", label: "Assemble", hint: "Tire drops in, spokes fan out, nuts pop on." },
  { id: "spin", label: "Spin up", hint: "Spring to speed with a motion streak." },
  { id: "zoom", label: "Zoom through", hint: "Dive into the rim and land on the TireDrop hero." },
];

function Wheel() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="h-full w-full overflow-visible"
      aria-hidden="true"
      focusable="false"
    >
      {/* anime.js writes CSS transforms; pin every animated part's origin to the hub. */}
      <style>{`[data-td]{transform-box:view-box;transform-origin:200px 200px}`}</style>
      <defs>
        <radialGradient id="tdw-tire" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="#05080d" />
          <stop offset="100%" stopColor="#141b27" />
        </radialGradient>
        <linearGradient id="tdw-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e9eef5" />
          <stop offset="45%" stopColor="#7d8794" />
          <stop offset="100%" stopColor="#2a313b" />
        </linearGradient>
        <radialGradient id="tdw-barrel" cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="#020407" />
          <stop offset="100%" stopColor="#0c1420" />
        </radialGradient>
        <filter id="tdw-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ground shadow, not part of the spinning group. */}
      <ellipse data-td="shadow" cx="200" cy="392" rx="150" ry="10" fill="#000" opacity="0.45" />

      <g data-td="tire-drop">
        <g data-td="spin" style={{ transformBox: "view-box", transformOrigin: "50% 50%" }}>
          {/* Tire body and tread blocks */}
          <circle cx="200" cy="200" r="190" fill="url(#tdw-tire)" />
          <g data-td="tread">
            {Array.from({ length: TREAD }, (_, i) => (
              <rect
                key={i}
                x="195"
                y="8"
                width="10"
                height="14"
                rx="2"
                fill="#0e141d"
                stroke="#1f2a3a"
                strokeWidth="1"
                transform={`rotate(${(360 / TREAD) * i} 200 200)`}
              />
            ))}
          </g>
          <circle cx="200" cy="200" r="168" fill="none" stroke="#1b2432" strokeWidth="2" />
          <circle cx="200" cy="200" r="146" fill="none" stroke="#182030" strokeWidth="1.5" />

          {/* Rim: lip, barrel, spokes, hub */}
          <g data-td="rim" style={{ transformBox: "view-box", transformOrigin: "50% 50%" }}>
            <circle
              cx="200"
              cy="200"
              r="124"
              fill="none"
              stroke="url(#tdw-metal)"
              strokeWidth="9"
              filter="url(#tdw-glow)"
              data-td="lip"
            />
            <circle cx="200" cy="200" r="119" fill="url(#tdw-barrel)" />
            <g data-td="spokes">
              {Array.from({ length: SPOKES }, (_, i) => (
                <g key={i} transform={`translate(200 200) rotate(${(360 / SPOKES) * i})`}>
                  <path
                    d={SPOKE_PATH}
                    data-td="spoke"
                    fill="url(#tdw-metal)"
                    stroke="#0b1018"
                    strokeWidth="1"
                  />
                </g>
              ))}
            </g>
            <circle cx="200" cy="200" r="34" fill="url(#tdw-metal)" stroke="#0b1018" strokeWidth="2" />
            {Array.from({ length: LUGS }, (_, i) => {
              const a = ((360 / LUGS) * i - 90) * (Math.PI / 180);
              return (
                <circle
                  key={i}
                  data-td="lug"
                  cx={200 + Math.cos(a) * 21}
                  cy={200 + Math.sin(a) * 21}
                  r="4.5"
                  fill="#0b1018"
                  stroke="#aab4c2"
                  strokeWidth="1.2"
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />
              );
            })}
            <circle data-td="cap" cx="200" cy="200" r="10" fill="#00B4FC" filter="url(#tdw-glow)" />
          </g>
        </g>
      </g>
    </svg>
  );
}

export default function TireTransitionDemo() {
  const root = useRef(null);
  const apiRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState("assemble");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) return undefined;

    let cancelled = false;
    let scope = null;

    // anime.js is loaded on demand so it never sits in the main bundle.
    import("animejs")
      .then(({ animate, createTimeline, createScope, stagger, spring, utils }) => {
        if (cancelled || !root.current) return;
        const q = (sel) => root.current.querySelector(sel);
        const loopRef = { current: null };

        scope = createScope({ root }).add(() => {
          const wheelBox = q("[data-td-box]");
          const streak = q("[data-td-streak]");
          const glow = q("[data-td-glow]");

          const resetPose = () => {
            loopRef.current?.cancel?.();
            loopRef.current = null;
            utils.set("[data-td='spin']", { rotate: 0 });
            utils.set(wheelBox, { scale: 1, opacity: 1 });
            utils.set(streak, { scaleX: 0, opacity: 0 });
            utils.set(glow, { opacity: 0.35 });
          };

          const idle = () => {
            loopRef.current = animate("[data-td='spin']", {
              rotate: "+=360",
              duration: 14000,
              ease: "linear",
              loop: true,
            });
          };

          const assemble = () => {
            resetPose();
            utils.set("[data-td='tire-drop']", { translateY: -160, opacity: 0, scale: 1.08 });
            utils.set("[data-td='spoke']", { opacity: 0, translateY: 40 });
            utils.set("[data-td='lug']", { scale: 0 });
            utils.set("[data-td='cap']", { scale: 0, opacity: 0 });
            utils.set("[data-td='tread']", { opacity: 0, rotate: -30 });
            utils.set("[data-td='shadow']", { opacity: 0, scaleX: 0.4 });
            const tl = createTimeline({ defaults: { ease: "out(3)" } });
            tl.add("[data-td='shadow']", { opacity: 0.45, scaleX: 1, duration: 700 }, 0)
              .add(
                "[data-td='tire-drop']",
                { translateY: 0, opacity: 1, scale: 1, duration: 900, ease: spring({ bounce: 0.38 }) },
                0,
              )
              .add("[data-td='tread']", { opacity: 1, rotate: 0, duration: 900 }, 250)
              .add(
                "[data-td='spoke']",
                { opacity: 1, translateY: 0, duration: 600, delay: stagger(60, { from: "first" }) },
                450,
              )
              .add(
                "[data-td='lug']",
                { scale: 1, duration: 400, ease: spring({ bounce: 0.6 }), delay: stagger(70) },
                1000,
              )
              .add("[data-td='cap']", { scale: 1, opacity: 1, duration: 500, ease: spring({ bounce: 0.5 }) }, 1200)
              .add(glow, { opacity: 0.8, duration: 700, ease: "inOut(2)" }, 1100)
              .call(idle, 1800);
            return tl;
          };

          const spin = () => {
            resetPose();
            const tl = createTimeline();
            tl.add(streak, { scaleX: 1, opacity: 0.9, duration: 900, ease: "out(3)" }, 0)
              .add(
                "[data-td='spin']",
                { rotate: 1440, duration: 1900, ease: "in(3)" },
                0,
              )
              .add(glow, { opacity: 1, duration: 900 }, 0)
              .add("[data-td='spin']", { rotate: "+=720", duration: 900, ease: "linear" }, 1900)
              .add(streak, { opacity: 0, scaleX: 1.4, duration: 800, ease: "out(2)" }, 2300)
              .add(
                "[data-td='spin']",
                { rotate: "+=540", duration: 1700, ease: "out(4)" },
                2800,
              )
              .add(glow, { opacity: 0.45, duration: 1200 }, 2800)
              .call(idle, 4500);
            return tl;
          };

          const zoom = () => {
            resetPose();
            idle();
            const next = document.querySelector('[data-home-section="hero"]');
            const tl = createTimeline({ defaults: { ease: "in(3)" } });
            tl.add(wheelBox, { scale: 26, duration: 1400, ease: "in(4)" }, 0)
              .add("[data-td-wash]", { opacity: [0, 1], duration: 500, ease: "linear" }, 1000)
              .call(() => {
                next?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 1350)
              .add("[data-td-wash]", { opacity: 0, duration: 700, ease: "out(2)" }, 1500)
              .call(() => {
                utils.set(wheelBox, { scale: 1, opacity: 0 });
                animate(wheelBox, { opacity: 1, duration: 800, ease: "out(2)" });
              }, 2400);
            return tl;
          };

          const scenes = { assemble, spin, zoom };
          apiRef.current = (id) => scenes[id]?.();

          // Headline words rise in once, text visible-ish from the start.
          animate("[data-td-word]", {
            translateY: [24, 0],
            opacity: [0, 1],
            duration: 800,
            ease: "out(3)",
            delay: stagger(90),
          });
          assemble();
        });
        setReady(true);
      })
      .catch(() => {
        /* The still wheel stays on screen if the library fails to load. */
      });

    return () => {
      cancelled = true;
      apiRef.current = null;
      scope?.revert();
    };
  }, []);

  const play = useCallback((id) => {
    setActive(id);
    apiRef.current?.(id);
  }, []);

  return (
    <section
      data-preview-demo="tire-transitions"
      className="relative isolate overflow-hidden bg-ink text-bone"
      ref={root}
    >
      <img
        src="/brand/hero-tires-2000.webp"
        srcSet="/brand/hero-tires-1000.webp 1000w, /brand/hero-tires-2000.webp 2000w"
        sizes="100vw"
        alt=""
        width={2000}
        height={667}
        decoding="async"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full select-none object-cover object-[70%_center] opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/70 to-transparent"
      />

      <div className="wrap grid items-center gap-8 py-12 md:py-16 lg:grid-cols-[1fr_1fr] lg:gap-12">
        <div>
          <p className="eyebrow-dark mb-3">Animation preview</p>
          <p className="h1 text-balance" aria-label="Tires that roll into view.">
            {["Tires", "that", "roll"].map((w) => (
              <span key={w} data-td-word className="mr-[0.25em] inline-block">
                {w}
              </span>
            ))}
            <span className="block text-volt">
              {["into", "view."].map((w) => (
                <span key={w} data-td-word className="mr-[0.25em] inline-block">
                  {w}
                </span>
              ))}
            </span>
          </p>
          <p className="lede mt-4 max-w-lg text-bone/70">
            Three transitions built from one tire and rim. Tap each to replay it. This
            block is a preview and sits above the real hero.
          </p>

          {!reduced && (
            <div className="mt-6 flex flex-wrap gap-3" role="group" aria-label="Replay a transition">
              {SCENES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => play(s.id)}
                  disabled={!ready}
                  aria-pressed={active === s.id}
                  className={`btn min-h-[48px] ${active === s.id ? "btn-primary" : "btn-ghost-light"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <p className="mt-3 min-h-[1.5rem] text-sm text-bone/60" aria-live="polite">
            {SCENES.find((s) => s.id === active)?.hint}
          </p>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[460px]">
          <div
            data-td-glow
            aria-hidden
            className="absolute inset-[-8%] rounded-full bg-volt/30 opacity-40 blur-3xl"
          />
          <div
            data-td-streak
            aria-hidden
            className="absolute -left-[55%] bottom-[6%] h-[3px] w-[70%] origin-right scale-x-0 bg-gradient-to-r from-transparent to-volt opacity-0 blur-[1px]"
          />
          <div data-td-box className="absolute inset-0" style={{ transformOrigin: "50% 50%" }}>
            <Wheel />
          </div>
        </div>
      </div>

      {/* White-blue flash that covers the cut during the zoom transition. */}
      <div
        data-td-wash
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-volt opacity-0"
      />
    </section>
  );
}
