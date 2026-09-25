// React hooks over the API client in api.js.
//
// Both render something honest immediately: the tire search starts from the
// sample catalog's answer (so the fallback is the first paint, not a spinner)
// and swaps in the live answer when it lands; the status starts as `null` so
// nothing claims a payment mode before the server has said which one is on.

import { useEffect, useMemo, useState } from "react";

import {
  cachedSearch,
  getStatus,
  getTire,
  searchSample,
  searchTires,
  tireQuery,
} from "./api.js";

const IDLE = Object.freeze({
  active: false,
  loading: false,
  source: "sample",
  items: [],
  fallback: true,
  error: null,
});

/**
 * Searches by `{ size }` or `{ year, make, model }` (plus optional `brand`,
 * `limit`). Pass null for no search. Returns
 * `{ active, loading, source, items, fallback, error }`.
 */
export function useTireSearch(query) {
  const q = query ? tireQuery(query) : null;
  const key = q ? new URLSearchParams(q).toString() : "";
  const [answer, setAnswer] = useState({ key: "", result: null, error: null });

  useEffect(() => {
    if (!key) return undefined;
    let alive = true;
    searchTires(Object.fromEntries(new URLSearchParams(key)))
      .then((result) => {
        if (alive) setAnswer({ key, result, error: null });
      })
      .catch((error) => {
        if (alive) setAnswer({ key, result: null, error });
      });
    return () => {
      alive = false;
    };
  }, [key]);

  return useMemo(() => {
    if (!key) return IDLE;
    const params = Object.fromEntries(new URLSearchParams(key));
    const fresh = answer.key === key ? answer : null;
    const known = fresh?.result ?? cachedSearch(params);
    const result = known ?? searchSample(params);
    return {
      active: true,
      loading: !fresh && !known,
      source: result.source,
      items: result.items,
      fallback: result.fallback,
      error: fresh?.error ?? null,
    };
  }, [key, answer]);
}

/** `null` until the server answers (or is given up on), then the status. */
export function useApiStatus() {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    let alive = true;
    getStatus().then((s) => {
      if (alive) setStatus(s);
    });
    return () => {
      alive = false;
    };
  }, []);
  return status;
}

/**
 * One tire by sku, for its product page. Returns
 * `{ loading, product, source, fallback, error }`: `product` is null while
 * loading and when there is no such tire (`loading: false`, no `error`).
 */
export function useTire(sku) {
  const key = String(sku ?? "").trim();
  const [answer, setAnswer] = useState({ key: "", result: null, error: null });

  useEffect(() => {
    if (!key) return undefined;
    let alive = true;
    getTire(key)
      .then((result) => {
        if (alive) setAnswer({ key, result, error: null });
      })
      .catch((error) => {
        if (alive) setAnswer({ key, result: null, error });
      });
    return () => {
      alive = false;
    };
  }, [key]);

  return useMemo(() => {
    if (!key) {
      return { loading: false, product: null, source: null, fallback: false, error: null };
    }
    const fresh = answer.key === key ? answer : null;
    return {
      loading: !fresh,
      product: fresh?.result?.product ?? null,
      source: fresh?.result?.source ?? null,
      fallback: fresh?.result?.fallback ?? false,
      error: fresh?.error ?? null,
    };
  }, [key, answer]);
}
