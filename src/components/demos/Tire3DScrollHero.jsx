import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

/**
 * PREVIEW ONLY: a real-time 3D tire and rim that is driven by scroll.
 * Sits above the real home hero. To remove: delete this file and its two
 * lines in HomePage.jsx. Nothing else depends on it.
 *
 * Scroll story (progress 0..1 through a tall sticky section):
 *   0.00-0.30  wheel rolls in from the right, spinning in 3/4 view
 *   0.30-0.50  it turns face-on and settles
 *   0.50-0.78  tire and rim pull apart (exploded view)
 *   0.78-1.00  camera dives through the hub into the next section
 *
 * Safety rules:
 *  - three.js is imported on demand inside an effect: not in the main bundle,
 *    and the prerendered HTML is a still fallback (no canvas).
 *  - Renders only while on screen, pixel ratio capped (phones), antialias off
 *    on touch devices, no WebGL -> the fallback stays.
 *  - prefers-reduced-motion: one still frame, no scroll animation.
 *  - The canvas never takes pointer events, so touch scrolling is untouched.
 */

const CAPTIONS = [
  { at: 0.0, eyebrow: "Scroll preview", title: "Built for Miami nights.", body: "A real 3D wheel that reacts to your scroll." },
  { at: 0.34, eyebrow: "Step 2", title: "Rubber meets rim.", body: "Tire and wheel, made to work as one." },
  { at: 0.56, eyebrow: "Step 3", title: "Pull it apart.", body: "Tread, sidewall, bead, barrel, spokes." },
  { at: 0.8, eyebrow: "Step 4", title: "Now find yours.", body: "Search by size or by vehicle.", cta: true },
];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const ease = (t) => t * t * (3 - 2 * t); // smoothstep

export default function Tire3DScrollHero() {
  const outer = useRef(null);
  const mount = useRef(null);
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const [still, setStill] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) setStill(true);

    (async () => {
      let THREE, RoomEnvironment;
      try {
        THREE = await import("three");
        ({ RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js"));
      } catch {
        return;
      }
      if (disposed || !mount.current) return;

      const touch = window.matchMedia?.("(pointer: coarse)").matches;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: !touch,
          alpha: true,
          powerPreference: "high-performance",
        });
      } catch {
        return; // no WebGL: keep the still fallback
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, touch ? 1.75 : 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      const canvas = renderer.domElement;
      canvas.setAttribute("aria-hidden", "true");
      canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";
      mount.current.appendChild(canvas);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;

      const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 60);

      // Lights: a volt rim light and a warm key so the metal has something to chew on.
      const key = new THREE.DirectionalLight(0xffffff, 2.2);
      key.position.set(3, 4, 5);
      scene.add(key);
      const rimLight = new THREE.PointLight(0x00b4fc, 40, 14);
      rimLight.position.set(-3.2, 0.6, 2.2);
      scene.add(rimLight);
      const under = new THREE.PointLight(0x2b6bff, 12, 10);
      under.position.set(1.5, -2.4, 2);
      scene.add(under);

      // ---------- wheel geometry (built around Y, then stood up to face +Z) ----------
      const mats = {
        rubber: new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.82, metalness: 0.05 }),
        tread: new THREE.MeshStandardMaterial({ color: 0x07080a, roughness: 0.95, metalness: 0 }),
        metal: new THREE.MeshStandardMaterial({ color: 0xc9d2de, roughness: 0.22, metalness: 1 }),
        dark: new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.5, metalness: 0.85 }),
        volt: new THREE.MeshStandardMaterial({
          color: 0x00b4fc, emissive: 0x00b4fc, emissiveIntensity: 1.6, roughness: 0.35, metalness: 0.2,
        }),
      };
      const segs = touch ? 72 : 120;

      const lathe = (pts, m) => {
        const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segs);
        return new THREE.Mesh(g, m);
      };

      // Tire carcass
      const tire = new THREE.Group();
      const carcass = lathe(
        [
          [0.6, -0.27], [0.7, -0.3], [0.88, -0.29], [0.97, -0.23], [1.0, -0.14],
          [1.01, 0], [1.0, 0.14], [0.97, 0.23], [0.88, 0.29], [0.7, 0.3], [0.6, 0.27],
          [0.58, 0.2], [0.58, -0.2], [0.6, -0.27],
        ],
        mats.rubber,
      );
      tire.add(carcass);
      // Tread blocks
      const blockCount = touch ? 64 : 96;
      const block = new THREE.BoxGeometry(0.085, 0.17, 0.045);
      const treadMesh = new THREE.InstancedMesh(block, mats.tread, blockCount * 2);
      const dummy = new THREE.Object3D();
      let k = 0;
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < blockCount; i++) {
          const a = (i / blockCount) * Math.PI * 2 + (row ? Math.PI / blockCount : 0);
          dummy.position.set(Math.cos(a) * 1.015, row ? 0.09 : -0.09, Math.sin(a) * 1.015);
          dummy.rotation.set(0, -a, 0);
          dummy.rotateY(Math.PI / 2);
          dummy.rotateZ(row ? 0.35 : -0.35);
          dummy.updateMatrix();
          treadMesh.setMatrixAt(k++, dummy.matrix);
        }
      }
      tire.add(treadMesh);
      // Sidewall lettering ring (a subtle raised line, no real text on the tire)
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.008, 8, segs), mats.dark);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.3;
      const ring2 = ring.clone();
      ring2.position.y = -0.3;
      tire.add(ring, ring2);

      // Rim
      const rim = new THREE.Group();
      rim.add(
        lathe(
          [[0.64, -0.3], [0.6, -0.27], [0.56, -0.2], [0.55, 0], [0.56, 0.2], [0.6, 0.27], [0.64, 0.3], [0.62, 0.3], [0.58, 0.24], [0.52, 0.18], [0.52, -0.18], [0.58, -0.24], [0.62, -0.3]],
          mats.metal,
        ),
      );
      // Spokes: 10 twin spokes, tapered
      const spokeShape = new THREE.Shape();
      spokeShape.moveTo(-0.045, 0.05);
      spokeShape.lineTo(-0.075, 0.55);
      spokeShape.lineTo(-0.028, 0.56);
      spokeShape.lineTo(-0.012, 0.05);
      spokeShape.closePath();
      const spokeGeo = new THREE.ExtrudeGeometry(spokeShape, {
        depth: 0.07, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2,
      });
      const spokeShape2 = new THREE.Shape();
      spokeShape2.moveTo(0.045, 0.05);
      spokeShape2.lineTo(0.075, 0.55);
      spokeShape2.lineTo(0.028, 0.56);
      spokeShape2.lineTo(0.012, 0.05);
      spokeShape2.closePath();
      const spokeGeo2 = new THREE.ExtrudeGeometry(spokeShape2, {
        depth: 0.07, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2,
      });
      const face = new THREE.Group(); // everything on the rim face (rotates together)
      const SP = 10;
      for (let i = 0; i < SP; i++) {
        const g = new THREE.Group();
        g.rotation.z = (i / SP) * Math.PI * 2;
        const a = new THREE.Mesh(spokeGeo, mats.metal);
        const b = new THREE.Mesh(spokeGeo2, mats.metal);
        a.position.z = b.position.z = -0.035;
        g.add(a, b);
        face.add(g);
      }
      // Hub, lugs, cap
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.14, 48), mats.dark);
      hub.rotation.x = Math.PI / 2;
      const hubRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.018, 12, 48), mats.metal);
      hubRing.position.z = 0.07;
      face.add(hub, hubRing);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
        const lug = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.05, 6), mats.metal);
        lug.rotation.x = Math.PI / 2;
        lug.position.set(Math.cos(a) * 0.13, Math.sin(a) * 0.13, 0.095);
        face.add(lug);
      }
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.04, 32), mats.volt);
      cap.rotation.x = Math.PI / 2;
      cap.position.z = 0.1;
      face.add(cap);
      rim.add(face);
      // Outer lip glow ring
      const lip = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.01, 8, segs), mats.volt);
      lip.position.z = 0.3;
      rim.add(lip);

      // The lathe axis is Y; stand both on their side so the axis points at the camera (+Z).
      tire.rotation.x = Math.PI / 2;
      const rimBarrel = rim.children[0];
      rimBarrel.rotation.x = Math.PI / 2;

      const spin = new THREE.Group(); // rolls about its own axis (Z)
      spin.add(tire, rim);
      const wheel = new THREE.Group(); // positioned / tilted by scroll
      wheel.add(spin);
      scene.add(wheel);

      // Ground reflection plate (soft, cheap)
      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(2.6, 48),
        new THREE.MeshBasicMaterial({ color: 0x00b4fc, transparent: true, opacity: 0.0 }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -1.02;
      scene.add(floor);

      // ---------- sizing ----------
      const resize = () => {
        const el = mount.current;
        if (!el) return;
        const w = el.clientWidth;
        const h = el.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(mount.current);

      // ---------- scroll state ----------
      let target = 0;
      let smooth = 0;
      let visible = true;
      let lastCaption = -1;
      const readScroll = () => {
        const o = outer.current;
        if (!o) return;
        const r = o.getBoundingClientRect();
        const span = Math.max(1, r.height - window.innerHeight);
        target = clamp(-r.top / span);
      };
      readScroll();
      window.addEventListener("scroll", readScroll, { passive: true });
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
      io.observe(outer.current);

      const pose = (p) => {
        const portrait = camera.aspect < 0.9;
        const baseZ = portrait ? 8.6 : 6.2;
        const roll = ease(seg(p, 0, 0.3));
        const turn = ease(seg(p, 0.28, 0.5));
        const split = ease(seg(p, 0.5, 0.78));
        const dive = ease(seg(p, 0.78, 1));

        const xStart = portrait ? 4.5 : 6.5;
        wheel.position.x = (1 - roll) * xStart;
        // portrait: lift the wheel into the upper part so captions sit below it
        wheel.position.y = portrait ? 0.9 : 0;
        wheel.rotation.y = (1 - turn) * -0.95 + (1 - roll) * 0.2;
        wheel.rotation.x = (1 - turn) * 0.18;
        // rolling: rim travels (xStart * (1 - roll)) so spin = distance / radius
        spin.rotation.z = -(1 - roll) * xStart * 1.0 - p * 2.4 - smooth * 0.0;

        // exploded view
        tire.position.z = -split * 1.25;
        rim.position.z = split * 0.55;
        tire.scale.setScalar(1 - split * 0.04);
        floor.material.opacity = 0.0;

        // glow follows the story
        mats.volt.emissiveIntensity = 1.2 + split * 1.8 + dive * 3;
        rimLight.intensity = 40 + split * 40;

        // camera: gentle pull-in, then the dive
        camera.position.set(0, portrait ? 0.7 : 0, baseZ - split * 0.6 - dive * (baseZ - 0.35));
        camera.lookAt(0, portrait ? 0.9 : 0, 0);
        camera.fov = 32 + dive * 30;
        camera.updateProjectionMatrix();

        return { dive, split };
      };

      const wash = mount.current.parentElement.querySelector("[data-t3d-wash]");
      const idxFor = (p) => {
        let idx = 0;
        CAPTIONS.forEach((c, i) => { if (p >= c.at) idx = i; });
        return idx;
      };

      let raf = 0;
      let t0 = performance.now();
      const frame = (now) => {
        raf = requestAnimationFrame(frame);
        if (!visible && !reduce) return;
        const dt = Math.min(0.05, (now - t0) / 1000);
        t0 = now;
        smooth += (target - smooth) * (1 - Math.pow(0.0006, dt)); // frame-rate independent ease
        const { dive } = pose(reduce ? 0.5 : smooth);
        // idle sway so it is alive even when you stop scrolling
        wheel.rotation.y += Math.sin(now / 1800) * 0.04 * (1 - dive);
        if (wash) wash.style.opacity = String(clamp((dive - 0.55) / 0.45));
        const idx = idxFor(smooth);
        if (idx !== lastCaption) { lastCaption = idx; setActive(idx); }
        renderer.render(scene, camera);
      };
      setReady(true);
      raf = requestAnimationFrame(frame);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", readScroll);
        ro.disconnect();
        io.disconnect();
        scene.traverse((o) => {
          o.geometry?.dispose?.();
        });
        Object.values(mats).forEach((m) => m.dispose());
        envTex.dispose();
        pmrem.dispose();
        renderer.dispose();
        canvas.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  const cap = CAPTIONS[active];

  return (
    <section
      ref={outer}
      data-preview-demo="tire-3d-scroll"
      aria-label="3D tire and rim preview"
      className={`relative bg-ink text-bone ${still ? "" : "h-[300svh] md:h-[340svh]"}`}
    >
      <div className={`${still ? "relative h-[88svh]" : "sticky top-0 h-[100svh]"} overflow-hidden`}>
        {/* Night-Miami backdrop, same photo as the real hero */}
        <img
          src="/brand/hero-tires-1000.webp"
          alt=""
          width={1000}
          height={333}
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover opacity-60"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/30 to-ink/90 md:bg-gradient-to-r md:from-ink/90 md:via-ink/40 md:to-ink/10" />

        {/* WebGL mount. Until it is ready the page shows only the backdrop. */}
        <div ref={mount} className="absolute inset-0" />

        {/* Captions: bottom-left on phones (above the sticky call bar), left-center on desktop */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-24 md:inset-y-0 md:flex md:items-center md:pb-0">
          <div className="wrap md:w-full">
            <div key={active} className="max-w-md animate-[t3dIn_.55s_ease-out_both]" aria-live="polite">
              <p className="eyebrow-dark">{cap.eyebrow}</p>
              <h2 className="h1 mt-2 !text-bone">{cap.title}</h2>
              <p className="lede mt-3 !text-bone/80">{cap.body}</p>
              {cap.cta ? (
                <div className="pointer-events-auto mt-5 flex flex-wrap gap-3">
                  <Link to="/tires" className="btn btn-primary">Shop tires</Link>
                  <Link to="/find-my-tires" className="btn btn-ghost-light">Find by vehicle</Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Progress rail */}
        {!still ? (
          <div aria-hidden className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-2 md:flex">
            {CAPTIONS.map((c, i) => (
              <span key={c.at} className={`h-6 w-1 rounded-full transition-colors ${i <= active ? "bg-volt" : "bg-white/20"}`} />
            ))}
          </div>
        ) : null}

        {!ready && !still ? (
          <p className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 text-sm text-bone/60">Loading 3D…</p>
        ) : null}

        <div data-t3d-wash aria-hidden className="pointer-events-none absolute inset-0 z-20 bg-volt opacity-0" />
      </div>
      <style>{`@keyframes t3dIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){[data-preview-demo=tire-3d-scroll] *{animation:none!important}}`}</style>
    </section>
  );
}
