// Dev-only entry for dev/fitment.html: the two fitment demos (D5 load &
// speed check, D6 plus-size & speedometer), rendered directly so they can be
// reviewed before an integrator adds them to the registry in ../index.js.
// Once they are registered, the main gallery (gallery.html) shows them too
// and this page can go.
//
//   npm run dev, then
//   http://localhost:5173/src/components/demos/dev/fitment.html
//   ?demo=load-speed-check or ?demo=plus-size-speedo shows one on its own.
import React from "react";
import ReactDOM from "react-dom/client";

import "../../../index.css";
import LoadSpeedCheck from "../LoadSpeedCheck.jsx";
import PlusSizeSpeedo from "../PlusSizeSpeedo.jsx";

const DEMOS = {
  "load-speed-check": LoadSpeedCheck,
  "plus-size-speedo": PlusSizeSpeedo,
};

const only = new URLSearchParams(window.location.search).get("demo");
const ids = Object.keys(DEMOS).filter((id) => !only || id === only);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <main className="mx-auto w-full max-w-[880px] px-4 py-8 sm:px-6">
      {!only && (
        <>
          <p className="font-display text-[12px] font-bold uppercase tracking-[0.09em] text-drop">
            Dev only
          </p>
          <h1 className="mt-1 font-display text-[2rem] leading-tight text-ink">
            Fitment demos
          </h1>
        </>
      )}
      {ids.map((id) => {
        const Demo = DEMOS[id];
        return (
          <div key={id} id={`demo-${id}`} data-gallery-item={id}>
            {!only && <p className="mt-10 font-mono text-[13px] text-smoke">{id}</p>}
            <Demo />
          </div>
        );
      })}
    </main>
  </React.StrictMode>,
);
