import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { CompareProvider } from "./context/CompareContext.jsx";
import "./index.css";

// Production uses clean URLs (vercel.json supplies the SPA rewrite).
// Static preview hosts have no rewrite, so fall back to hash routing there.
const Router = import.meta.env.VITE_HASH_ROUTER === "true" ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <CartProvider>
        <CompareProvider>
          <App />
        </CompareProvider>
      </CartProvider>
    </Router>
  </React.StrictMode>
);
