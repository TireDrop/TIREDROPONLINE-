import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * false while prerendering and during hydration, true from then on (and on
 * any render that is not a hydration).
 *
 * For values that depend on the visitor's clock or browser, such as today's
 * date as an input's `min`. Rendering them straight into a prerendered page
 * would bake in the build date: React does not patch attribute differences
 * when it hydrates, so the stale value would stay in the DOM. Gate them on
 * this and React renders them once more, correctly, straight after hydration.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
