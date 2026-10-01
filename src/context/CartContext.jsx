import React, {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";

import { cartParams, oncePerPage, trackEvent } from "../lib/analytics.js";

const CartContext = createContext(null);

const STORAGE_KEY = "tiredrop.cart.v1";

// Tires and wheels are priced per unit but almost always bought in sets,
// so quantity lives on the line item and installation is opt-in per line.
const initialState = { lines: [] };

function reducer(state, action) {
  switch (action.type) {
    case "hydrate":
      return action.state ?? initialState;

    case "add": {
      const { item, qty } = action;
      const existing = state.lines.find(
        (l) => l.id === item.id && l.install === item.install,
      );
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((l) =>
            l === existing ? { ...l, qty: Math.min(l.qty + qty, 99) } : l,
          ),
        };
      }
      return { ...state, lines: [...state.lines, { ...item, qty }] };
    }

    case "setQty":
      return {
        ...state,
        lines: state.lines
          .map((l) => (l.key === action.key ? { ...l, qty: action.qty } : l))
          .filter((l) => l.qty > 0),
      };

    case "remove":
      return {
        ...state,
        lines: state.lines.filter((l) => l.key !== action.key),
      };

    case "clear":
      return initialState;

    default:
      return state;
  }
}

/** Reads persisted cart state, tolerating disabled or cleared storage. */
function readStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // The saved cart, read on mount and not yet applied. Until it is, nothing
  // is written back, so the empty first render cannot overwrite it.
  const pending = useRef(null);

  // Load the saved cart once on mount, so the prerendered page (which has no
  // cart) hydrates first. The load is a transition: an urgent context update
  // that lands while the route's Suspense boundary is still hydrating makes
  // React throw that boundary's server HTML away and render it again on the
  // client (React error 421), which wipes anything typed into the page's
  // form meanwhile. As a transition, React finishes hydrating first. An
  // empty saved cart, which every earlier visit leaves behind, changes
  // nothing and is not applied at all.
  useEffect(() => {
    const saved = readStorage();
    if (!saved || !Array.isArray(saved.lines) || saved.lines.length === 0) return;
    pending.current = saved;
    startTransition(() => dispatch({ type: "hydrate", state: saved }));
  }, []);

  useEffect(() => {
    if (pending.current) {
      if (state !== pending.current) return;
      pending.current = null;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* private mode or blocked storage — cart stays in memory only */
    }
  }, [state]);

  const value = useMemo(() => {
    const lines = state.lines;
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
    const installTotal = lines.reduce(
      (n, l) => n + (l.install ? l.installPrice * l.qty : 0),
      0,
    );
    // Shipping is free to every address in the 48 contiguous states and DC, and to the shop, so
    // there is no shipping charge to add. Sales tax is not estimated here:
    // Shopify calculates the real figure for the address at checkout, so the
    // total is before tax.
    const total = subtotal + installTotal;

    return {
      lines,
      count,
      subtotal,
      installTotal,
      total,
      // GA4 add_to_cart / remove_from_cart (src/lib/analytics.js). Pass
      // { track: false } when a line is swapped rather than added or removed.
      addItem: (item, qty = 1, { track = true } = {}) => {
        if (track) trackEvent("add_to_cart", cartParams([{ ...item, qty }]));
        dispatch({
          type: "add",
          item: { ...item, key: `${item.id}:${item.install ? "i" : "n"}` },
          qty,
        });
      },
      setQty: (key, qty) => {
        const line = lines.find((l) => l.key === key);
        const delta = line ? qty - line.qty : 0;
        if (delta !== 0) {
          trackEvent(
            delta > 0 ? "add_to_cart" : "remove_from_cart",
            cartParams([{ ...line, qty: Math.abs(delta) }]),
          );
        }
        dispatch({ type: "setQty", key, qty });
      },
      remove: (key, { track = true } = {}) => {
        const line = lines.find((l) => l.key === key);
        if (track && line) trackEvent("remove_from_cart", cartParams([line]));
        dispatch({ type: "remove", key });
      },
      clear: () => dispatch({ type: "clear" }),
    };
  }, [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

/**
 * Sends a GA4 cart event (view_cart, begin_checkout) once per page view, as
 * soon as the cart has lines: a page the visitor lands on directly only gets
 * the saved cart after its first render.
 */
export function useCartEvent(name) {
  const { lines } = useCart();
  useEffect(() => {
    if (lines.length > 0) oncePerPage(name, () => trackEvent(name, cartParams(lines)));
  }, [name, lines]);
}

export const money = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });
