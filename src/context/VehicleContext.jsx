import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  checkFit,
  fitSizeOf,
  resolveSelection,
} from "../data/fitmentCheck.js";
import { OTHER, loadSelection, saveSelection } from "../data/vehicles.js";
import { selectionForSearch } from "../lib/tiresUrl.js";

// The one place the site keeps what the shopper is shopping for: a vehicle
// (year, make, model, and the size they picked when the trims differ, or the
// size off their sidewall) or a bare tire size. Every tire card, product
// page, Compare, the cart and checkout's review read it from here, through
// the same fitment answer (src/data/fitmentCheck.js).
//
// Render-safe: nothing reads storage while rendering. The prerendered page
// and the first client render both have no selection and `ready: false`,
// so they match and hydrate; the saved selection is loaded in an effect, as
// a transition (see CartContext.jsx for why), and the fitment answers show
// up straight after. While `ready` is false, `fitFor` answers null and the
// surfaces show no badge and never block anything.

const VehicleContext = createContext(null);

const clean = (v) => (v == null ? "" : String(v).trim());

export function VehicleProvider({ children }) {
  const [state, setState] = useState({ ready: false, selection: null });
  // The "Change" panel of the Shopping-for bar, which a card's "Change
  // vehicle" link opens from anywhere on the page. `tab` is "vehicle" or
  // "size"; `nonce` lets a second request scroll it into view again.
  const [changer, setChanger] = useState({
    open: false,
    tab: "vehicle",
    nonce: 0,
  });
  // How many Shopping-for bars are on the page, so a "Change vehicle" link
  // knows whether there is a panel here to open or it should go to /tires.
  const [bars, setBars] = useState(0);
  const registerBar = useCallback(() => {
    startTransition(() => setBars((n) => n + 1));
    return () => {
      startTransition(() => setBars((n) => n - 1));
      setChanger((c) => (c.open ? { ...c, open: false } : c));
    };
  }, []);

  useEffect(() => {
    const saved = loadSelection();
    // A page may already have chosen (a vehicle handed over in its URL): its
    // effect runs before this one, and its choice stands.
    startTransition(() =>
      setState((s) => (s.ready ? s : { ready: true, selection: saved })),
    );
  }, []);

  const commit = useCallback((next) => {
    const stored = saveSelection(next);
    setState({ ready: true, selection: stored });
    setChanger((c) => ({ ...c, open: false }));
  }, []);

  const selectVehicle = useCallback(
    ({ year, make, model, size, rear } = {}) => {
      const v = {
        type: "vehicle",
        year: clean(year),
        make: clean(make),
        // "Other / not listed" is not a model.
        model: clean(model) === OTHER ? "" : clean(model),
      };
      // A size the shopper confirmed (door-jamb sticker), and the rear one
      // when the setup is staggered.
      if (clean(size)) {
        v.size = clean(size);
        if (clean(rear)) v.rear = clean(rear);
      }
      commit(v);
    },
    [commit],
  );

  const selectSize = useCallback(
    (size, rear) =>
      commit(
        clean(rear)
          ? { type: "size", size: clean(size), rear: clean(rear) }
          : { type: "size", size: clean(size) },
      ),
    [commit],
  );

  /** Picks one of the vehicle's factory options when the trims differ. */
  const current = state.selection;
  const pickOption = useCallback(
    (pick) => {
      if (current?.type !== "vehicle") return;
      const { size: _entered, rear: _rear, ...vehicle } = current;
      setState({ ready: true, selection: saveSelection({ ...vehicle, pick }) });
    },
    [current],
  );

  const clear = useCallback(() => commit(null), [commit]);

  // The partial size on the /tires address bar while that page is open (set
  // by TiresPage, null elsewhere): the search answers against the selection
  // minus a door-jamb size it contradicts. Why here: only `resolved` changes,
  // so the saved selection, the cart and checkout's review stay as saved.
  const [searchPartial, setSearchPartial] = useState(null);

  const openChanger = useCallback(
    (tab = "vehicle") =>
      setChanger((c) => ({ open: true, tab, nonce: c.nonce + 1 })),
    [],
  );
  const closeChanger = useCallback(
    () => setChanger((c) => ({ ...c, open: false })),
    [],
  );

  const resolved = useMemo(
    () => resolveSelection(selectionForSearch(state.selection, searchPartial)),
    [state.selection, searchPartial],
  );

  const value = useMemo(
    () => ({
      ready: state.ready,
      selection: state.selection,
      resolved,
      /** The fitment answer for a tire size, or null before the load. */
      fitFor: (size) => (state.ready ? checkFit(size, resolved) : null),
      selectVehicle,
      selectSize,
      pickOption,
      clear,
      setSearchPartial,
      changer,
      openChanger,
      closeChanger,
      bars,
      registerBar,
    }),
    [
      state,
      resolved,
      selectVehicle,
      selectSize,
      pickOption,
      clear,
      changer,
      openChanger,
      closeChanger,
      bars,
      registerBar,
    ],
  );

  return (
    <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>
  );
}

export function useVehicle() {
  const ctx = useContext(VehicleContext);
  if (!ctx) throw new Error("useVehicle must be used inside a VehicleProvider");
  return ctx;
}

/**
 * The fitment answer for a product, or null when there is nothing to say
 * yet (before the saved selection loads) or nothing to say at all (wheels).
 */
export function useFit(product) {
  const { fitFor } = useVehicle();
  if (!product || product.kind === "wheel") return null;
  return fitFor(fitSizeOf(product));
}
