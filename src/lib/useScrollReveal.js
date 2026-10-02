import { useEffect } from "react";

/**
 * Scroll reveal for anything marked `data-reveal` inside `ref`: a short fade
 * and rise as it enters the viewport. CSS is in src/index.css ([data-rv]).
 *
 * Content is never hidden by markup. The prerendered HTML, a visitor without
 * JavaScript and a failed bundle all get a fully visible page, because the
 * hidden state is an attribute (`data-rv="hide"`) this effect adds after
 * hydration, and only to elements still below the fold — so nothing on
 * screen ever blinks out, the hero included. Elements already in view or
 * scrolled past are left alone.
 *
 * Skipped entirely with prefers-reduced-motion or without
 * IntersectionObserver, and the stylesheet forces the visible state under
 * reduced motion and in print as a second guard. Opacity and transform only:
 * no layout shift.
 *
 * Stagger: give siblings `style={{ "--rv-i": index }}`; the CSS turns it into
 * a transition delay. `data-rv` is not a React prop, so a re-render never
 * fights it, and it is removed once the element has arrived so hover
 * transitions on cards go back to their own timing.
 */
export function useScrollReveal(ref) {
  useEffect(() => {
    const root = ref.current;
    if (!root || typeof window === "undefined") return undefined;
    if (!("IntersectionObserver" in window)) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
      return undefined;

    const fold = window.innerHeight;
    const pending = [...root.querySelectorAll("[data-reveal]")].filter(
      (el) => el.getBoundingClientRect().top > fold,
    );
    if (pending.length === 0) return undefined;

    const timers = new Set();
    const settle = (el) => {
      // Done: hand the element back to its own transitions.
      const done = () => {
        el.removeAttribute("data-rv");
        el.removeEventListener("transitionend", onEnd);
      };
      const onEnd = (e) => {
        if (e.target === el && e.propertyName === "opacity") done();
      };
      el.addEventListener("transitionend", onEnd);
      // Fallback for a transition that never fires (tab hidden, etc.).
      const t = setTimeout(() => {
        timers.delete(t);
        done();
      }, 1600);
      timers.add(t);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          io.unobserve(el);
          el.setAttribute("data-rv", "show");
          settle(el);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );

    for (const el of pending) {
      el.setAttribute("data-rv", "hide");
      io.observe(el);
    }

    return () => {
      io.disconnect();
      for (const t of timers) clearTimeout(t);
      for (const el of pending) el.removeAttribute("data-rv");
    };
  }, [ref]);
}
