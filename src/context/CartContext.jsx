import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

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

  // Hydrate once on mount so the server-free build still renders instantly.
  useEffect(() => {
    const saved = readStorage();
    if (saved) dispatch({ type: "hydrate", state: saved });
  }, []);

  useEffect(() => {
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
    // Shipping is waived over $500. This is a placeholder rate: once the
    // distributor APIs are wired, the carrier quote replaces it.
    const shipping = subtotal === 0 || subtotal >= 500 ? 0 : 29;
    const tax = Math.round((subtotal + installTotal) * 0.07 * 100) / 100;
    const total = subtotal + installTotal + shipping + tax;

    return {
      lines,
      count,
      subtotal,
      installTotal,
      shipping,
      tax,
      total,
      addItem: (item, qty = 1) =>
        dispatch({
          type: "add",
          item: { ...item, key: `${item.id}:${item.install ? "i" : "n"}` },
          qty,
        }),
      setQty: (key, qty) => dispatch({ type: "setQty", key, qty }),
      remove: (key) => dispatch({ type: "remove", key }),
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

export const money = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });
