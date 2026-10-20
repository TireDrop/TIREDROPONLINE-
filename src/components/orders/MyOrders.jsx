import React, { useCallback, useEffect, useRef, useState } from "react";
import { CloudOff, Phone, RefreshCw } from "lucide-react";
import { BUSINESS } from "../../data/business.js";
import { ApiError, trackOrder } from "../../data/api.js";
import { trackEvent } from "../../lib/analytics.js";
import { dueOnReturn, nextDelay, watchExpired } from "../../lib/orderRefresh.js";
import SavedOrdersList from "./SavedOrdersList.jsx";

const time = (ms) =>
  new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/**
 * My Orders: the orders remembered on this device (src/lib/savedOrders.js)
 * at the top of /track. The selected one is looked up and then kept fresh:
 * every 5 minutes while the page is visible (two of the ten lookups), paused while it is hidden,
 * backing off after errors, giving way to the rate limit, and stopping after
 * 30 minutes (Refresh starts it again). Only the order on screen is checked,
 * because the lookup is limited to ten per ten minutes (src/lib/orderRefresh.js).
 *
 * `seed` ({ order, data }) is a lookup the shopper just made, shown without
 * asking again. `renderResult(data, entry)` draws the order or request.
 */
export default function MyOrders({
  saved,
  selected,
  onSelect,
  onForget,
  onForgetAll,
  seed,
  renderResult,
  notice,
  headingRef,
}) {
  const entry = saved.find((item) => item.order === selected) ?? null;
  const entryKey = entry ? `${entry.order}|${entry.email}` : "";
  const [view, setView] = useState({ status: "loading", data: null, checkedAt: null, busy: false });
  const engine = useRef(null);
  const seedRef = useRef(seed);
  useEffect(() => {
    seedRef.current = seed;
  }, [seed]);

  useEffect(() => {
    if (!entry) return undefined;
    const { order, email } = entry;
    const seeded = seedRef.current?.order === order ? seedRef.current.data : null;
    let dead = false;
    let timer = null;
    let failures = 0;
    let rateLimited = false;
    let stopped = false;
    let inflight = false;
    let watchStart = Date.now();
    let last = seeded ? Date.now() : 0;
    const patch = (next) => !dead && setView((prev) => ({ ...prev, ...next }));
    setView(
      seeded
        ? { status: "ok", data: seeded, checkedAt: last, busy: false }
        : { status: "loading", data: null, checkedAt: null, busy: false },
    );

    const clear = () => {
      clearTimeout(timer);
      timer = null;
    };
    const schedule = () => {
      clear();
      if (dead || stopped || document.hidden) return;
      timer = setTimeout(() => run("auto"), nextDelay({ failures, rateLimited }));
    };

    async function run(method) {
      if (dead || inflight) return;
      if (method === "manual") {
        watchStart = Date.now();
        stopped = false;
        failures = 0;
        rateLimited = false;
      }
      if (method === "auto" && watchExpired(watchStart, Date.now())) {
        stopped = true;
        clear();
        patch({ status: "expired", busy: false });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        clear();
        patch({ status: "offline", busy: false });
        return;
      }
      if (method === "auto" || method === "manual") trackEvent("track_refresh", { method });
      inflight = true;
      patch({ busy: true });
      try {
        const data = await trackOrder({ order, email });
        failures = 0;
        rateLimited = false;
        last = Date.now();
        patch({ status: "ok", data, checkedAt: last });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          stopped = true;
          patch({ status: "gone", data: null });
        } else if (err instanceof ApiError && err.status === 429) {
          rateLimited = true;
          patch({ status: "limited" });
        } else {
          failures += 1;
          patch({ status: navigator.onLine === false ? "offline" : "error" });
        }
      } finally {
        inflight = false;
        patch({ busy: false });
        schedule();
      }
    }

    const onVisibility = () => {
      if (document.hidden) {
        clear();
      } else if (!stopped && dueOnReturn(last, Date.now())) {
        run("auto");
      } else {
        schedule();
      }
    };
    const onOnline = () => !stopped && run("auto");
    const onOffline = () => {
      clear();
      patch({ status: "offline" });
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    engine.current = { refresh: () => run("manual") };

    if (seeded) {
      schedule();
    } else {
      trackEvent("track_lookup", { method: "saved" });
      run("initial");
    }
    return () => {
      dead = true;
      clear();
      engine.current = null;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [entryKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => engine.current?.refresh(), []);

  if (saved.length === 0) return null;

  const { status, data, checkedAt, busy } = view;
  const message = {
    offline: "You are offline, so this may be out of date. It updates by itself when your connection is back.",
    error: "We couldn't reach the order system just now. We will try again shortly; your order is not affected.",
    limited: "Lots of checks from this connection, so updates are paused for a few minutes. Your order is not affected.",
    expired: "Automatic updates paused after 30 minutes. Tap Refresh to keep watching.",
    gone: "We couldn't find this order any more. Check the details with your confirmation email, or call the shop.",
  }[status];

  return (
    <section
      aria-labelledby="my-orders-title"
      className="card border-l-4 border-l-drop p-6 md:p-8"
      data-testid="my-orders"
    >
      <h2 id="my-orders-title" ref={headingRef} tabIndex={-1} className="h3 outline-none">
        My Orders
      </h2>
      <p className="mb-4 mt-1 text-sm text-smoke">
        Saved on this device only. Tap an order to see where it stands.
      </p>

      <SavedOrdersList
        saved={saved}
        selected={selected}
        onSelect={onSelect}
        onForget={onForget}
        onForgetAll={onForgetAll}
      />

      <p role="status" className="sr-only" data-testid="orders-notice-sr">
        {notice}
      </p>
      {notice && (
        <p className="mt-3 text-sm text-smoke" data-testid="orders-notice">
          {notice}
        </p>
      )}

      {entry && (
        <div className="mt-6 border-t border-ink/10 pt-5" data-testid="selected-order">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-smoke" data-testid="refresh-line" aria-live="polite">
              {status === "loading" && "Checking your order…"}
              {status === "ok" && checkedAt && (
                <>
                  Updated {time(checkedAt)}
                  <span className="text-smoke"> · refreshes every few minutes while this page is open</span>
                </>
              )}
              {status !== "loading" && status !== "ok" && checkedAt && <>Last updated {time(checkedAt)}</>}
            </p>
            <button
              type="button"
              onClick={refresh}
              disabled={busy}
              aria-busy={busy || undefined}
              data-testid="refresh"
              className="btn-outline btn-sm min-h-11"
            >
              <RefreshCw size={16} aria-hidden className={busy ? "animate-spin" : undefined} />
              {busy ? "Checking…" : "Refresh"}
            </button>
          </div>

          {message && (
            <div
              className="mt-4 rounded-sm border border-amber/50 bg-amber/10 p-4 text-sm text-ink"
              data-testid="refresh-message"
              data-status={status}
            >
              <p className="flex items-start gap-2">
                {status === "offline" && <CloudOff size={18} aria-hidden className="mt-0.5 shrink-0" />}
                <span>{message}</span>
              </p>
              <a href={BUSINESS.phoneHref} className="btn-primary btn-sm mt-3 !min-h-11">
                <Phone size={16} aria-hidden />
                Call {BUSINESS.phone}
              </a>
            </div>
          )}

          {data && <div className="mt-4">{renderResult(data, entry)}</div>}

          {!message && (
            <a href={BUSINESS.phoneHref} className="btn-outline btn-sm mt-5 !min-h-11" data-testid="call-shop">
              <Phone size={16} aria-hidden />
              Call the shop {BUSINESS.phone}
            </a>
          )}
        </div>
      )}
    </section>
  );
}
