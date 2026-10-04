import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Car,
  CircleDot,
  FileText,
  MapPin,
  Ruler,
  Search,
  Tag,
  Wrench,
} from "lucide-react";

import { searchTires } from "../../data/api.js";
import { trackEvent } from "../../lib/analytics.js";
import { SEARCH_DATA, loadSitePages, sitePagesNow } from "../../lib/searchData.js";
import { MIN_QUERY, searchPath } from "../../lib/searchPath.js";

/**
 * The matching itself (src/lib/siteSearch.js) is loaded the first time the
 * box is focused or typed in, like the page index, rather than shipped in
 * every page's bundle. Until it is in, there are no suggestions to show; a
 * search submitted before then waits for it.
 */
let engine = null;
let enginePending = null;
function loadEngine() {
  if (engine) return Promise.resolve(engine);
  if (!enginePending) {
    enginePending = import("../../lib/siteSearch.js")
      .then((m) => {
        engine = m;
        return m;
      })
      .catch((error) => {
        enginePending = null; // try again on the next focus
        throw error;
      });
  }
  return enginePending;
}
const NO_RESULTS = Object.freeze({ groups: [] });

/** How long typing has to pause before the suggestions update. */
const DEBOUNCE_MS = 150;
/** Suggestions in the drop-down, not counting "See all results". */
const LIMIT = 8;

const PAGE_ICON = {
  tool: Calculator,
  service: Wrench,
  area: MapPin,
  topic: BookOpen,
  guide: BookOpen,
  blog: BookOpen,
};
const GROUP_ICON = {
  sizes: Ruler,
  vehicles: Car,
  brands: Tag,
  products: CircleDot,
  pages: FileText,
  all: ArrowRight,
};
const iconFor = (option) =>
  (option.group === "pages" && PAGE_ICON[option.type]) ||
  GROUP_ICON[option.group] ||
  FileText;

/**
 * Masthead search, with suggestions as you type.
 *
 * It searches the whole store: a tire size in any of the ways people write
 * one (225/45R17, 2254517, 225 45 17, P225/45R17), recognised from its first
 * three digits; brands and tire types; catalog tires and wheels by brand,
 * model or name; a "2019 BMW 3 Series" vehicle; and every page, tool,
 * service, city page and Learn or blog guide (src/lib/sitePages.js, built
 * from the router's own data). The matching is src/lib/siteSearch.js, which
 * /search uses too.
 *
 * A complete size also asks the tire search API (src/data/api.js), so with
 * the distributor live the tires suggested are what it stocks in that size;
 * without it the sample catalog answers, as everywhere else.
 *
 * It is a WAI-ARIA combobox: the input keeps focus, the list is a listbox
 * of options in labelled groups, and the highlighted one is announced
 * through aria-activedescendant. Up and Down move, Enter opens the
 * highlighted suggestion, Escape closes the list, Tab leaves it. Enter with
 * nothing highlighted (or the Search button) goes where it always did: a
 * size to that size, a brand to its tires, a model to its page, and
 * anything else to the full results on /search.
 *
 * GA4: `search` on a submit or "See all results", `search_suggestion` when
 * a suggestion is picked (src/lib/analytics.js).
 */
export default function HeaderSearch({
  id = "masthead-search",
  className = "",
  onDone,
}) {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listboxId = `${id}-listbox`;
  const optionId = (i) => `${id}-option-${i}`;

  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  // The highlighted row, for the query it was highlighted in: a new set of
  // suggestions starts with nothing highlighted.
  const [active, setActive] = useState({ query: "", index: -1 });
  const [pages, setPages] = useState(sitePagesNow);
  const [search, setSearch] = useState(() => engine);
  const [live, setLive] = useState({ key: "", items: null });

  useEffect(() => {
    const timer = setTimeout(() => setQuery(term), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  const loadPages = () => {
    if (!pages) loadSitePages().then((loaded) => setPages(loaded));
    if (!search)
      loadEngine().then(setSearch, () => {
        /* no suggestions; a submit still reaches /search */
      });
  };

  // A complete size: what the tire search API has in it.
  const typedSize = useMemo(
    () => (search ? search.extractSize(query).size : null),
    [search, query],
  );
  const sizeKey =
    typedSize?.complete && !typedSize.flotation ? typedSize.display : "";
  useEffect(() => {
    if (!sizeKey) return undefined;
    let alive = true;
    searchTires({ size: sizeKey, limit: 6 })
      .then((result) => {
        if (alive) setLive({ key: sizeKey, items: result.items });
      })
      .catch(() => {
        /* the catalog's own answer stays */
      });
    return () => {
      alive = false;
    };
  }, [sizeKey]);

  const results = useMemo(() => {
    if (!search) return NO_RESULTS;
    return search.searchSite(
      query,
      {
        ...SEARCH_DATA,
        pages: pages ?? [],
        sizeProducts: sizeKey && live.key === sizeKey ? live.items : undefined,
      },
      { limit: LIMIT },
    );
  }, [search, query, pages, sizeKey, live]);

  const text = query.trim();
  const options = useMemo(() => {
    const list = results.groups.flatMap((g) => g.items);
    if (text.length >= MIN_QUERY)
      list.push({
        id: "all",
        group: "all",
        label: `See all results for “${text}”`,
        path: searchPath(text),
      });
    return list;
  }, [results, text]);

  const showing =
    open && term.trim().length >= MIN_QUERY && text.length >= MIN_QUERY;
  const activeIndex =
    showing && active.query === query && active.index < options.length
      ? active.index
      : -1;
  const highlight = (index) => setActive({ query, index });

  // Keep the highlighted row in view inside a scrolled list.
  useEffect(() => {
    if (activeIndex < 0) return;
    document
      .getElementById(`${id}-option-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, id]);

  // A tap or click anywhere else closes the list.
  useEffect(() => {
    if (!showing) return undefined;
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [showing]);

  const finish = (path) => {
    setTerm("");
    setQuery("");
    setOpen(false);
    setActive({ query: "", index: -1 });
    onDone?.();
    navigate(path);
  };

  const choose = (option) => {
    const searched = term.trim() || text;
    if (option.group === "all") {
      trackEvent("search", { search_term: searched, search_type: "site" });
    } else {
      trackEvent("search_suggestion", {
        search_term: searched,
        suggestion_type: option.group,
        suggestion_path: option.path,
      });
    }
    finish(option.path);
  };

  const submit = (e) => {
    e.preventDefault();
    if (activeIndex >= 0) {
      choose(options[activeIndex]);
      return;
    }
    const typed = term.trim();
    if (!typed) {
      inputRef.current?.focus();
      return;
    }
    trackEvent("search", { search_term: typed, search_type: "site" });
    loadEngine().then(
      (m) => finish(m.submitPath(typed, SEARCH_DATA)),
      () => finish(searchPath(typed)),
    );
  };

  const onKeyDown = (e) => {
    const n = options.length;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (term.trim().length < MIN_QUERY || !n) return;
      e.preventDefault();
      if (!showing) {
        setOpen(true);
        highlight(e.key === "ArrowDown" ? 0 : n - 1);
        return;
      }
      const step = e.key === "ArrowDown" ? 1 : -1;
      const from = activeIndex < 0 ? (step > 0 ? -1 : n) : activeIndex;
      highlight((from + step + n) % n);
    } else if (e.key === "Escape") {
      if (showing) {
        // Close the list; a second Escape clears the box, as a search box does.
        e.preventDefault();
        setOpen(false);
      }
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const indexOf = new Map(options.map((option, i) => [option.id, i]));
  const renderOption = (option) => {
    const i = indexOf.get(option.id);
    const selected = i === activeIndex;
    const Icon = iconFor(option);
    const seeAll = option.group === "all";
    const product = option.group === "products" || option.group === "brands";
    return (
      <div
        key={option.id}
        id={optionId(i)}
        role="option"
        aria-selected={selected}
        data-path={option.path}
        // Keep focus in the box, so a tap does not close the list first.
        onMouseDown={(e) => e.preventDefault()}
        onMouseMove={() => {
          if (!selected) highlight(i);
        }}
        onClick={() => choose(option)}
        className={`flex min-h-[44px] cursor-pointer items-center gap-3 px-4 py-2 transition-colors ${
          selected ? "bg-sky text-drop" : "text-ink"
        } ${seeAll ? "border-t border-ink/10 font-semibold" : ""}`}
      >
        <Icon
          size={16}
          aria-hidden
          className={`shrink-0 ${selected ? "text-drop" : "text-smoke"}`}
        />
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-[14px] leading-snug ${product ? "notranslate" : ""}`}
            translate={product ? "no" : undefined}
          >
            {option.label}
          </span>
          {option.detail && (
            <span className="block truncate text-[12px] leading-snug text-smoke">
              {option.detail}
            </span>
          )}
        </span>
      </div>
    );
  };

  return (
    <form
      ref={rootRef}
      role="search"
      onSubmit={submit}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget)) setOpen(false);
      }}
      className={`relative ${className}`}
    >
      <label htmlFor={id} className="sr-only">
        Search the store: tire sizes, brands, tires, services and guides
      </label>
      <Search
        size={17}
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-smoke"
      />
      <input
        ref={inputRef}
        id={id}
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showing}
        aria-controls={showing ? listboxId : undefined}
        aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="search"
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
          loadPages();
        }}
        onFocus={() => {
          setOpen(true);
          loadPages();
        }}
        onKeyDown={onKeyDown}
        placeholder="Search sizes, brands, services, guides — 225/45R17"
        className="field h-11 w-full rounded-full pl-10 pr-24 text-[15px]"
      />
      {/* The button is the input's full 44px height so it is a proper tap
          target; the pill inside keeps the 36px look (4px inset all round). */}
      <button
        type="submit"
        className="group absolute right-0 top-0 flex h-11 items-center justify-end rounded-full pr-1"
      >
        <span className="btn-primary btn-sm h-9 min-h-0 rounded-full px-4 group-hover:bg-dive group-hover:shadow-none">
          Search
        </span>
      </button>

      {showing && (
        <div className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-card border border-ink/10 bg-bone text-left shadow-lift">
          <div
            id={listboxId}
            role="listbox"
            aria-label="Search suggestions"
            className="max-h-[min(70vh,34rem)] overflow-y-auto overscroll-contain py-1"
          >
            {results.groups.map((group) => (
              <div key={group.id} role="group" aria-label={group.label}>
                <div
                  aria-hidden
                  className="px-4 pb-1 pt-2.5 font-display text-[11px] font-bold uppercase tracking-[0.09em] text-smoke"
                >
                  {group.label}
                </div>
                {group.items.map(renderOption)}
              </div>
            ))}
            {!results.count && (
              <div
                aria-hidden
                className="px-4 pb-1 pt-2.5 text-[13px] leading-snug text-smoke"
              >
                No quick matches. Try a size like 225/45R17, a brand, or a word
                like rotation.
              </div>
            )}
            {options.slice(results.count).map(renderOption)}
          </div>
        </div>
      )}

      {/* Read out when the list changes; empty (and identical) on the server.
          A bare live region rather than role="status", so the header never
          becomes the page's first status message. */}
      <p aria-live="polite" className="sr-only">
        {showing
          ? `${results.count} suggestion${results.count === 1 ? "" : "s"}. Use the up and down arrows to choose.`
          : ""}
      </p>
    </form>
  );
}
