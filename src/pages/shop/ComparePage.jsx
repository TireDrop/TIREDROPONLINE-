import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Check, Scale, ShoppingCart, X } from "lucide-react";

import { getProduct } from "../../data/products.js";
import { SET_SIZE, setPrice } from "../../data/pricing.js";
import { useCompare } from "../../context/CompareContext.jsx";
import { money, useCart } from "../../context/CartContext.jsx";
import { useVehicle } from "../../context/VehicleContext.jsx";
import {
  compareCrown,
  fitSizeOf,
  sizeSearch,
} from "../../data/fitmentCheck.js";
import ProductArt from "../../components/shop/ProductArt.jsx";
import {
  CONFIRM_LINE,
  FitBadge,
  ShoppingForBar,
} from "../../components/shop/Fitment.jsx";
import {
  Breadcrumbs,
  EmptyState,
  PageHero,
  Section,
  Seo,
} from "../../components/ui/index.jsx";

// The compare table is the one screen where a shopper stops reading marketing
// and starts reading numbers, so the whole page is built around making the
// numbers answer the question: what does each one cost, and how do the specs
// differ. That is why the price rows carry a "Best" marker — a table that
// only lines values up leaves the comparing to the customer, which is the work
// they came here to avoid.
//
// A "Best" is only crowned between tires of one size (compareCrown in
// src/data/fitmentCheck.js): the cheapest set in a size that does not go on
// the car is not a best pick. Mixed sizes get a notice and no crown at all.

const LABEL_COL = 124; // px — narrow enough to leave room for two tires at 360px
const TIRE_COL = 168;

/**
 * Index of the single best cell in a row, or -1 when there is no winner.
 *
 * A tie is deliberately not a win: marking two identical numbers as "Best"
 * tells the shopper nothing and cheapens the marker everywhere else.
 */
function bestIndex(values, direction = "high") {
  const scored = values
    .map((value, index) => ({ value, index }))
    .filter(({ value }) => typeof value === "number" && Number.isFinite(value));

  if (scored.length < 2) return -1;

  const best = scored.reduce((a, b) => {
    if (direction === "high") return b.value > a.value ? b : a;
    return b.value < a.value ? b : a;
  });

  const tied = scored.filter(({ value }) => value === best.value).length > 1;
  return tied ? -1 : best.index;
}

function BestMark() {
  return (
    <span className="mt-1 inline-flex items-center gap-1 rounded-sm bg-drop px-1.5 py-0.5 font-display text-[11px] uppercase tracking-[0.09em] text-bone">
      <Check size={11} aria-hidden />
      Best
    </span>
  );
}

/* --------------------------------- Rows ---------------------------------- */

/** A dark band that names the group of rows beneath it. */
function GroupRow({ label, span }) {
  return (
    <tr className="bg-ink text-bone">
      <th
        scope="row"
        className="sticky left-0 z-20 bg-ink px-3 py-2 text-left font-display text-xs uppercase tracking-[0.09em]"
      >
        {label}
      </th>
      {Array.from({ length: span }, (_, i) => (
        <td key={i} className="bg-ink" />
      ))}
    </tr>
  );
}

function Row({ label, cells, bestAt = -1, tint = false }) {
  // The sticky label needs an opaque background of its own, otherwise the
  // columns scroll straight through it.
  const bg = tint ? "bg-fog" : "bg-bone";

  return (
    <tr className={bg}>
      <th
        scope="row"
        className={`sticky left-0 z-10 ${bg} border-b border-r border-ink/10 px-3 py-3 text-left align-top font-display text-xs uppercase tracking-[0.09em] text-smoke`}
      >
        {label}
      </th>
      {cells.map((cell, i) => (
        <td
          key={i}
          className={`border-b border-ink/10 px-3 py-3 align-top text-sm ${
            i === bestAt ? "text-drop" : "text-ink"
          }`}
        >
          <div className="flex flex-col items-start">
            <div className={`w-full ${i === bestAt ? "font-semibold" : ""}`}>
              {cell}
            </div>
            {i === bestAt && <BestMark />}
          </div>
        </td>
      ))}
    </tr>
  );
}

/* ------------------------------ Column header ----------------------------- */

function ColumnHead({ product, onRemove }) {
  return (
    <th
      scope="col"
      className="border-b border-ink/10 bg-bone px-3 pb-4 pt-3 align-top"
    >
      {/* Full height so the View button lines up across columns even when one
          model name wraps to a second line. */}
      <div className="relative flex h-full flex-col items-center gap-2 text-center">
        <button
          type="button"
          onClick={() => onRemove(product.slug)}
          aria-label={`Remove ${product.brand} ${product.model} from the comparison`}
          className="absolute -right-2 -top-1 flex h-11 w-11 items-center justify-center rounded-sm text-smoke hover:bg-ink/5 hover:text-drop"
        >
          <X size={18} aria-hidden />
        </button>

        <ProductArt
          kind="tire"
          accent={product.accent}
          size={64}
          label={`${product.brand} ${product.model}`}
        />
        <span className="font-display text-xs uppercase tracking-[0.09em] text-smoke">
          {product.brand}
        </span>
        <span className="font-display text-base font-bold leading-tight text-ink">
          {product.model}
        </span>
        <Link
          to={`/tires/${product.slug}`}
          className="btn-outline btn-sm mt-auto w-full font-normal"
        >
          View
        </Link>
      </div>
    </th>
  );
}

/* ---------------------------------- Page ---------------------------------- */

export default function ComparePage() {
  const { slugs, remove, clear } = useCompare();
  const { addItem } = useCart();
  const { fitFor, resolved, ready } = useVehicle();

  // The catalog is the source of truth, so a slug that no longer resolves is
  // dropped rather than rendered as an empty column.
  const tires = slugs.map((slug) => getProduct("tire", slug)).filter(Boolean);

  const addSet = (product) =>
    addItem(
      {
        id: product.id,
        sku: product.sku ?? product.id,
        kind: product.kind,
        // The cart prints the brand itself (see ProductCard).
        name: product.model,
        loadIndex: product.loadIndex ?? null,
        brand: product.brand,
        size: product.size,
        price: product.price,
        installPrice: product.installPrice,
        install: false,
        accent: product.accent,
        slug: product.slug,
      },
      SET_SIZE,
    );

  const hero = (
    <>
      <Seo
        title="Compare Tires Side by Side"
        description="Put up to four tires side by side — price for a set of four, fitment, warranty and the full spec sheet — in the same columns."
      />
      <Breadcrumbs
        trail={[{ label: "Tires", to: "/tires" }, { label: "Compare" }]}
      />
      <PageHero
        eyebrow="Side by side"
        title="Compare tires"
        lede="Price for a set of four, fitment and the full spec sheet — in the same columns, with the lowest price called out."
      />
    </>
  );

  if (tires.length < 2) {
    return (
      <>
        {hero}
        <Section className="bg-fog">
          <EmptyState
            icon={Scale}
            title="Pick at least two tires"
            lede="Tick the compare box on any tire card or product page — up to four — and they land here side by side."
            action={
              <Link to="/tires" className="btn-primary">
                Browse tires
              </Link>
            }
          />
        </Section>
      </>
    );
  }

  // Every spec key any compared tire carries, in the order they first appear,
  // so a tire that is missing one shows a dash instead of shifting the rows.
  const specKeys = [];
  tires.forEach((t) =>
    Object.keys(t.specs ?? {}).forEach((key) => {
      if (!specKeys.includes(key)) specKeys.push(key);
    }),
  );

  const setPrices = tires.map((t) => setPrice(t));
  const eachPrices = tires.map((t) => t.price);

  // One answer per tire, null until the saved vehicle has loaded.
  const fits = tires.map((t) => fitFor(fitSizeOf(t)));
  const crown = compareCrown(
    tires.map((t) => t.size),
    fits,
  );
  const best = (values, direction) =>
    crown.crown ? bestIndex(values, direction) : -1;

  const span = tires.length;
  const minWidth = LABEL_COL + span * TIRE_COL;

  return (
    <>
      {hero}

      <Section className="bg-fog">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-smoke">
            Comparing {span} {span === 1 ? "tire" : "tires"}. Prices are for a
            set of {SET_SIZE}. {CONFIRM_LINE}
          </p>
          <button type="button" onClick={clear} className="btn-outline btn-sm">
            Clear all
          </button>
        </div>

        <ShoppingForBar className="mb-5" />

        {!crown.crown && (
          <div
            role="note"
            data-testid="compare-notice"
            className="mb-5 flex items-start gap-3 rounded-sm border border-amber/60 bg-amber/10 p-4 text-sm text-ink"
          >
            <AlertTriangle
              size={18}
              aria-hidden
              className="mt-0.5 shrink-0 text-amberInk"
            />
            <p className="min-w-0 leading-relaxed">
              {crown.reason === "mixed-sizes" ? (
                <>
                  <span className="font-semibold">
                    These tires are different sizes ({crown.sizes.join(", ")}).
                  </span>{" "}
                  A tire only fits in its own size, so no best pick is marked.
                  Compare tires in the size on your car.
                </>
              ) : (
                <>
                  <span className="font-semibold">
                    These tires don&rsquo;t fit what you&rsquo;re shopping for.
                  </span>{" "}
                  No best pick is marked.
                </>
              )}{" "}
              {resolved.kind !== "none" &&
                ready &&
                fits[0]?.sizes?.[0] &&
                sizeSearch(fits[0].sizes[0]) && (
                  <Link
                    to={sizeSearch(fits[0].sizes[0])}
                    className="whitespace-nowrap font-semibold underline underline-offset-4 hover:text-drop"
                  >
                    See tires in {fits[0].sizes[0]}
                  </Link>
                )}
            </p>
          </div>
        )}

        {/* The scroll lives here, not on the page: at phone width four columns
            cannot fit, and a document that scrolls sideways is the fastest way
            to lose a mobile shopper. */}
        <div
          role="region"
          aria-label="Tire comparison table"
          tabIndex={0}
          className="overflow-x-auto rounded-sm border border-ink/10 bg-bone shadow-card"
        >
          <table
            className="w-full border-collapse text-left"
            style={{ minWidth: `${minWidth}px` }}
          >
            <caption className="sr-only">
              Price and specifications for the tires you selected.
            </caption>

            <colgroup>
              <col style={{ width: `${LABEL_COL}px` }} />
              {tires.map((t) => (
                <col key={t.slug} style={{ width: `${TIRE_COL}px` }} />
              ))}
            </colgroup>

            <thead>
              <tr>
                <td className="sticky left-0 z-10 border-b border-r border-ink/10 bg-bone" />
                {tires.map((t) => (
                  <ColumnHead key={t.slug} product={t} onRemove={remove} />
                ))}
              </tr>
            </thead>

            <tbody>
              <GroupRow label="Price" span={span} />
              <Row
                label={`Set of ${SET_SIZE}`}
                bestAt={best(setPrices, "low")}
                cells={setPrices.map((p, i) => (
                  <span
                    key={i}
                    className="font-display text-xl font-bold tracking-tight"
                  >
                    {money(p)}
                  </span>
                ))}
              />
              <Row
                label="Price each"
                tint
                bestAt={best(eachPrices, "low")}
                cells={eachPrices.map((p) => money(p))}
              />

              <GroupRow label="Fitment" span={span} />
              <Row label="Size" cells={tires.map((t) => t.size)} />
              {ready && (
                <Row
                  label="Fits?"
                  tint
                  cells={fits.map((f, i) => (
                    <FitBadge key={i} fit={f} />
                  ))}
                />
              )}
              <Row
                label="Load index"
                tint
                cells={tires.map((t) => t.loadIndex ?? "—")}
              />
              <Row
                label="Speed rating"
                cells={tires.map((t) => t.speedRating ?? "—")}
              />
              <Row
                label="Warranty"
                tint
                cells={tires.map((t) => t.warranty ?? "—")}
              />
              <Row label="Season" cells={tires.map((t) => t.seasons ?? "—")} />
              <Row
                label="Category"
                tint
                cells={tires.map((t) => t.category ?? "—")}
              />

              <GroupRow label="Spec sheet" span={span} />
              {specKeys.map((key, i) => (
                <Row
                  key={key}
                  label={key}
                  tint={i % 2 === 0}
                  cells={tires.map((t) => t.specs?.[key] ?? "—")}
                />
              ))}
            </tbody>

            <tfoot>
              <tr className="bg-bone">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-bone border-r border-ink/10 px-3 py-4 text-left font-display text-xs uppercase tracking-[0.09em] text-smoke"
                >
                  Buy
                </th>
                {tires.map((t, i) =>
                  fits[i]?.status === "no-fit" ? (
                    <td key={t.slug} className="px-3 py-4 align-top">
                      <p className="text-xs font-semibold text-ink">
                        {fits[i].title}
                      </p>
                      {sizeSearch(fits[i].sizes[0]) && (
                        <Link
                          to={sizeSearch(fits[i].sizes[0])}
                          className="btn-outline btn-sm mt-2 w-full"
                        >
                          See tires that fit
                        </Link>
                      )}
                    </td>
                  ) : (
                    <td key={t.slug} className="px-3 py-4 align-top">
                      <button
                        type="button"
                        onClick={() => addSet(t)}
                        className="btn-primary btn-sm w-full"
                      >
                        <ShoppingCart size={15} aria-hidden />
                        Add {SET_SIZE}
                      </button>
                    </td>
                  ),
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </Section>
    </>
  );
}
