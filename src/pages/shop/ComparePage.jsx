import React from "react";
import { Link } from "react-router-dom";
import { Check, Scale, ShoppingCart, X } from "lucide-react";

import { getProduct } from "../../data/products.js";
import { RATING_AXES, ratingsFor } from "../../data/tireRatings.js";
import { SET_SIZE, setPrice } from "../../data/pricing.js";
import { useCompare } from "../../context/CompareContext.jsx";
import { money, useCart } from "../../context/CartContext.jsx";
import ProductArt from "../../components/shop/ProductArt.jsx";
import {
  Breadcrumbs,
  EmptyState,
  PageHero,
  Section,
  Seo,
  Stars,
} from "../../components/ui/index.jsx";

// The compare table is the one screen where a shopper stops reading marketing
// and starts reading numbers, so the whole page is built around making the
// numbers answer the question: which of these is actually better, and at what
// cost. That is why every numeric row carries a "Best" marker — a table that
// only lines values up leaves the comparing to the customer, which is the work
// they came here to avoid.

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
    <span className="mt-1 inline-flex items-center gap-1 rounded-sm bg-drop px-1.5 py-0.5 font-display text-[11px] uppercase tracking-[0.12em] text-bone">
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
        className="sticky left-0 z-20 bg-ink px-3 py-2 text-left font-display text-xs uppercase tracking-[0.18em]"
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
        className={`sticky left-0 z-10 ${bg} border-b border-r border-ink/10 px-3 py-3 text-left align-top font-display text-xs uppercase tracking-[0.12em] text-smoke`}
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

/** A 0–10 axis score drawn as a bar, or an honest "Not rated" where none exists. */
function AxisCell({ value, best }) {
  if (value == null) {
    return <span className="text-sm text-smoke">Not rated</span>;
  }
  return (
    <div className="w-full">
      <span className="block font-display text-base">
        {value.toFixed(1)}
        <span className="text-xs text-smoke"> / 10</span>
      </span>
      <span
        aria-hidden
        className="mt-1.5 block h-1.5 w-full rounded-sm bg-ink/10"
      >
        <span
          className={`block h-full rounded-sm ${best ? "bg-drop" : "bg-steel/60"}`}
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </span>
    </div>
  );
}

/* ------------------------------ Column header ----------------------------- */

function ColumnHead({ product, onRemove }) {
  return (
    <th
      scope="col"
      className="border-b border-ink/10 bg-bone px-3 pb-4 pt-3 align-top"
    >
      <div className="relative flex flex-col items-center gap-2 text-center">
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
        <span className="font-display text-xs uppercase tracking-[0.15em] text-smoke">
          {product.brand}
        </span>
        <span className="font-display text-base uppercase leading-tight text-ink">
          {product.model}
        </span>
        <Link
          to={`/tires/${product.slug}`}
          className="btn-outline btn-sm w-full font-normal"
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

  // The catalog is the source of truth, so a slug that no longer resolves is
  // dropped rather than rendered as an empty column.
  const tires = slugs.map((slug) => getProduct("tire", slug)).filter(Boolean);

  const addSet = (product) =>
    addItem(
      {
        id: product.id,
        kind: product.kind,
        name: `${product.brand} ${product.model}`,
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
        description="Put up to four tires side by side — price for a set of four, rebates, ratings across six axes, warranty and the full spec sheet — and see which one wins each row."
      />
      <Breadcrumbs trail={[{ label: "Tires", to: "/tires" }, { label: "Compare" }]} />
      <PageHero
        eyebrow="Side by side"
        title="Compare tires"
        lede="Price for a set of four, manufacturer rebates, performance ratings and the full spec sheet — in the same columns, with the best figure in every row called out."
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

  const ratings = tires.map((t) => ratingsFor(t));

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
  const rebates = tires.map((t) => t.rebate?.amount ?? null);
  const stars = tires.map((t) => t.rating);

  const span = tires.length;
  const minWidth = LABEL_COL + span * TIRE_COL;

  return (
    <>
      {hero}

      <Section className="bg-fog">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-smoke">
            Comparing {span} {span === 1 ? "tire" : "tires"}. Prices are for a
            set of {SET_SIZE}.
          </p>
          <button type="button" onClick={clear} className="btn-outline btn-sm">
            Clear all
          </button>
        </div>

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
              Price, ratings and specifications for the tires you selected.
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
                bestAt={bestIndex(setPrices, "low")}
                cells={setPrices.map((p, i) => (
                  <span key={i} className="font-display text-xl">
                    {money(p)}
                  </span>
                ))}
              />
              <Row
                label="Price each"
                tint
                bestAt={bestIndex(eachPrices, "low")}
                cells={eachPrices.map((p) => money(p))}
              />
              <Row
                label="Rebate"
                bestAt={bestIndex(rebates, "high")}
                cells={tires.map((t) => t.rebate?.label ?? "—")}
              />

              <GroupRow label="Ratings" span={span} />
              <Row
                label="Customer rating"
                bestAt={bestIndex(stars, "high")}
                cells={tires.map((t) => (
                  <Stars key={t.slug} rating={t.rating} count={t.reviewCount} />
                ))}
              />
              {RATING_AXES.map((axis, axisIndex) => {
                const values = ratings.map((r) => r?.[axis.key] ?? null);
                const best = bestIndex(values, "high");
                return (
                  <Row
                    key={axis.key}
                    label={axis.label}
                    tint={axisIndex % 2 === 0}
                    bestAt={best}
                    cells={values.map((v, i) => (
                      <AxisCell key={i} value={v} best={i === best} />
                    ))}
                  />
                );
              })}

              <GroupRow label="Fitment" span={span} />
              <Row label="Size" cells={tires.map((t) => t.size)} />
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
                  className="sticky left-0 z-10 bg-bone border-r border-ink/10 px-3 py-4 text-left font-display text-xs uppercase tracking-[0.12em] text-smoke"
                >
                  Buy
                </th>
                {tires.map((t) => (
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
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-4 text-xs text-smoke">
          Ratings are computed from each tire's published grades — UTQG, speed
          rating, tread depth, load range and mileage warranty. Where a grade
          does not exist the axis reads "Not rated" rather than zero.
        </p>
      </Section>
    </>
  );
}
