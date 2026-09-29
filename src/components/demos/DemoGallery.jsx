// Dev-only review page for the Learn demos. Not routed in production.
//
// Two ways to open it:
//   1. Standalone (no App changes): `npm run dev`, then
//      http://localhost:5173/src/components/demos/dev/gallery.html
//      Add ?demo=<id> to show one demo on its own.
//   2. Inside the app, once the content system wires it (App.jsx is not
//      touched here):
//        const DemoGallery = lazy(() => import("./components/demos/DemoGallery.jsx"));
//        {import.meta.env.DEV && (
//          <Route path="/dev/demos" element={<DemoGallery />} />
//        )}
//      Vite drops the route and the chunk from production builds.

import React, { Suspense } from "react";

import { DEMOS, DEMO_META } from "./index.js";

function Fallback({ id }) {
  return (
    <div className="my-8 rounded-card border border-dashed border-ink/20 bg-bone p-5">
      <p className="font-display text-[15px] font-bold text-ink">
        {DEMO_META[id]?.title ?? id}
      </p>
      <p className="mt-1 text-[14px] text-smoke">{DEMO_META[id]?.alt}</p>
    </div>
  );
}

export default function DemoGallery({ only = null }) {
  const ids = Object.keys(DEMO_META).filter((id) => !only || id === only);
  const built = ids.filter((id) => DEMOS[id]);
  const reserved = ids.filter((id) => !DEMOS[id]);

  return (
    <main className="mx-auto w-full max-w-[880px] px-4 py-8 sm:px-6">
      {!only && (
        <>
          <p className="font-display text-[12px] font-bold uppercase tracking-[0.09em] text-drop">
            Dev only
          </p>
          <h1 className="mt-1 font-display text-[2rem] leading-tight text-ink">
            Learn demo gallery
          </h1>
          <p className="mt-2 text-[15px] text-smoke">
            {built.length} built, {reserved.length} reserved. Each demo is
            shown as it would sit inside an article column.
          </p>
        </>
      )}

      {built.map((id) => {
        const Demo = DEMOS[id];
        return (
          <div key={id} id={`demo-${id}`} data-gallery-item={id}>
            {!only && (
              <p className="mt-10 font-mono text-[13px] text-smoke">{id}</p>
            )}
            <Suspense fallback={<Fallback id={id} />}>
              <Demo />
            </Suspense>
          </div>
        );
      })}

      {reserved.length > 0 && (
        <>
          <h2 className="mt-12 font-display text-[1.4rem] text-ink">
            Reserved ids (text fallback only)
          </h2>
          {reserved.map((id) => (
            <div key={id} data-gallery-reserved={id}>
              <p className="mt-6 font-mono text-[13px] text-smoke">{id}</p>
              <Fallback id={id} />
            </div>
          ))}
        </>
      )}
    </main>
  );
}
