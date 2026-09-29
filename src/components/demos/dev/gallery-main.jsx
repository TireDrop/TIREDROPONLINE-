// Dev-only entry for dev/gallery.html. ?demo=<id> renders a single demo.
import React from "react";
import ReactDOM from "react-dom/client";

import "../../../index.css";
import DemoGallery from "../DemoGallery.jsx";

const only = new URLSearchParams(window.location.search).get("demo");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DemoGallery only={only} />
  </React.StrictMode>,
);
