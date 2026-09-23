import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgePercent,
  CalendarClock,
  Check,
  Copy,
  Mail,
  Phone,
  Tag,
  Truck,
  Wrench,
} from "lucide-react";

import { Seo, PageHero, Breadcrumbs, Section, Badge } from "../../components/ui/index.jsx";
import { BUSINESS, TIRE_BRANDS } from "../../data/business.js";

/* ------------------------------------------------------------------ */
/*  Offer catalog                                                      */
/*  Codes here mirror the ones CartPage accepts, so they really work.  */
/* ------------------------------------------------------------------ */

const GROUPS = [
  {
    id: "tire",
    label: "Store Specials",
    icon: Truck,
    lede: "Deals on the rubber itself — plus the shipping that gets it to your door.",
  },
  {
    id: "service",
    label: "Install Specials — South Florida",
    icon: Wrench,
    lede: "For local customers: savings on the work we do once your order lands at the shop, or when the van comes out to you.",
  },
  {
    id: "rebate",
    label: "Manufacturer Rebates",
    icon: Mail,
    lede: "Money back straight from the tire makers, across the whole brand roster — Michelin and Goodyear included. We walk you through the claim form.",
  },
];

const OFFERS = [
  /* ---------------- Tire specials ---------------- */
  {
    id: "first-set",
    group: "tire",
    title: "10% Off Your First Set",
    deal: "New to us? Take 10% off tires and wheels on your first order — any brand, any size we can ship.",
    code: "NEWCUSTOMER",
    fine: "First-time customers only, one use per household. Applies to the parts subtotal; installation, taxes and disposal excluded. Cannot be combined with FLEET15.",
    expires: "December 31, 2026",
    featured: true,
  },
  {
    id: "free-delivery",
    group: "tire",
    title: "Free Shipping On Any Order",
    deal: "Waives the $29 shipping fee on orders under $500. Orders at or above $500 already ship free.",
    code: "FREEDELIVERY",
    fine: "Valid on orders shipping anywhere in the continental US. One use per order. Does not apply to freight-only commercial sizes.",
    expires: "November 30, 2026",
  },
  {
    id: "fleet",
    group: "tire",
    title: "Fleet & Contractor Pricing — 15% Off",
    deal: "Running work trucks, vans or a small fleet? Take 15% off any parts order of $1,000 or more, shipped anywhere in the continental US.",
    code: "FLEET15",
    fine: "Parts subtotal of $1,000 or more before tax. Business orders only — we may ask for a company name at confirmation. Cannot be combined with NEWCUSTOMER.",
    expires: "December 31, 2026",
    featured: true,
  },
  {
    id: "buy-three",
    group: "tire",
    title: "Buy 3 Tires, Get The 4th Half Off",
    deal: "On select passenger and light-truck sizes. Half off applies to the lowest-priced tire in the set, shipped or fitted.",
    fine: "Select sizes only, while the promotion runs. Mention this offer when a tech calls to confirm your order. Not valid on commercial or trailer tires.",
    expires: "October 31, 2026",
  },
  /* ---------------- Service specials ---------------- */
  {
    id: "mobile-install",
    group: "service",
    title: "$25 Off Installation",
    deal: "Switch a line to free ship-to-store install and take $25 off the install line. South Florida customers only.",
    code: "MOBILE25",
    fine: "Requires installation on at least one line in your order, fitted at our South Florida shop or by the mobile van. One use per order.",
    expires: "December 31, 2026",
    featured: true,
  },
  {
    id: "flat-repair",
    group: "service",
    title: "Free Flat Repair With Any 4-Tire Install",
    deal: "Pick up a nail in the first year after we install four tires? We plug and patch it at no charge.",
    fine: "Local installs only. One repair per set, within 12 months of installation. Repairable punctures in the tread area only — sidewall damage and run-flat separations excluded.",
    expires: "December 31, 2026",
  },
  {
    id: "oil-change",
    group: "service",
    title: "$20 Off A Mobile Oil Change",
    deal: "Full-synthetic oil and a new filter, done in your driveway while you keep working. South Florida only.",
    fine: "Mobile service area only. Up to 5 quarts of full-synthetic; additional quarts and specialty filters billed at cost. Mention this offer when you book. Diesel and heavy-duty applications quoted separately.",
    expires: "November 15, 2026",
  },
  {
    id: "brakes",
    group: "service",
    title: "$30 Off Brake Pads & Rotors",
    deal: "Per axle, on any pad-and-rotor replacement booked with a tire or wheel order. South Florida only.",
    fine: "Per axle, parts and labor. Must be booked at the same time as a tire or wheel purchase. Brake work is performed at the Sunrise shop.",
    expires: "December 15, 2026",
  },
  /* ---------------- Manufacturer rebates ---------------- */
  {
    id: "continental",
    group: "rebate",
    brand: "Continental",
    title: "Continental — Up To $80 Back",
    deal: "Buy a set of four qualifying Continental tires and claim up to $80 on a prepaid Visa card.",
    fine: "Purchase must fall inside the promotion window. Submit the rebate form and your itemized invoice online or by mail within 30 days of purchase. Allow 6–8 weeks for the card. Offer terms set by the manufacturer and subject to change.",
    expires: "October 31, 2026",
  },
  {
    id: "pirelli",
    group: "rebate",
    brand: "Pirelli",
    title: "Pirelli — $100 Prepaid Card",
    deal: "Claim $100 back on a set of four qualifying P Zero or Scorpion tires.",
    fine: "Set of four required, purchased in a single transaction. Online submission with your itemized invoice within 30 days. Allow 6–8 weeks for delivery. Manufacturer terms apply.",
    expires: "November 30, 2026",
    featured: true,
  },
  {
    id: "nexen",
    group: "rebate",
    brand: "Nexen",
    title: "Nexen — $70 Back On Four",
    deal: "Qualifying N'Fera and Roadian lines earn a $70 prepaid card on a set of four.",
    fine: "Set of four from qualifying lines only. Rebate submitted within 30 days of the invoice date. One rebate per household per promotion. Manufacturer terms apply.",
    expires: "October 15, 2026",
  },
  {
    id: "nitto",
    group: "rebate",
    brand: "Nitto",
    title: "Nitto — $60 Back On Four",
    deal: "A $60 prepaid card on a set of four qualifying Nitto street or all-terrain tires.",
    fine: "Set of four required. Qualifying lines are set by the manufacturer and can change mid-promotion — a tech confirms eligibility before you buy. Submit within 30 days of purchase.",
    expires: "December 15, 2026",
  },
];

/* ------------------------------------------------------------------ */
/*  Clipboard                                                          */
/* ------------------------------------------------------------------ */

/** Async clipboard first, execCommand fallback, honest failure last. */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function CodeButton({ code, status, onCopy }) {
  const state = status?.code === code ? status : null;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-sm border-2 border-dashed border-ink/25 bg-fog px-3 py-1.5 font-display text-lg uppercase tracking-[0.18em] text-ink">
          {code}
        </span>
        <button
          type="button"
          onClick={() => onCopy(code)}
          className="btn-dark btn-sm"
          aria-label={`Copy promo code ${code}`}
        >
          {state?.ok ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
          {state?.ok ? "Copied" : "Copy code"}
        </button>
      </div>
      {state && !state.ok && (
        <p className="mt-2 text-xs leading-relaxed text-drop">
          Your browser blocked the clipboard. Write down <strong>{code}</strong> and paste it in
          your cart.
        </p>
      )}
    </div>
  );
}

function OfferCard({ offer, status, onCopy }) {
  return (
    <article className="card-hover flex flex-col overflow-hidden">
      {offer.featured && <div className="hazard h-1.5" aria-hidden />}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {offer.brand ? (
            <Badge tone="ink">{offer.brand}</Badge>
          ) : (
            <Badge tone={offer.code ? "drop" : "soft"}>
              {offer.code ? "Promo code" : "Mention at booking"}
            </Badge>
          )}
          {offer.featured && <Badge tone="amber">Best value</Badge>}
        </div>

        <h3 className="h3 leading-tight">{offer.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-smoke">{offer.deal}</p>

        {offer.code ? (
          <CodeButton code={offer.code} status={status} onCopy={onCopy} />
        ) : (
          <p className="mt-4 flex items-center gap-2 text-sm text-ink">
            <Tag size={15} aria-hidden className="shrink-0 text-drop" />
            No code needed — ask for it when you book.
          </p>
        )}

        <p className="mt-4 flex-1 text-xs leading-relaxed text-smoke">{offer.fine}</p>

        <p className="mt-4 flex items-center gap-1.5 border-t border-ink/10 pt-4 font-display text-xs uppercase tracking-[0.15em] text-smoke">
          <CalendarClock size={13} aria-hidden />
          Expires {offer.expires}
        </p>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const TABS = [{ id: "all", label: "All Offers" }, ...GROUPS.map((g) => ({ id: g.id, label: g.label }))];

export default function CouponsPage() {
  const [active, setActive] = useState("all");
  const [status, setStatus] = useState(null); // { code, ok }
  const tabRefs = useRef([]);

  // Clear the copied/failed badge so the page doesn't sit in a stale state.
  useEffect(() => {
    if (!status) return undefined;
    const t = window.setTimeout(() => setStatus(null), 3000);
    return () => window.clearTimeout(t);
  }, [status]);

  async function handleCopy(code) {
    const ok = await copyToClipboard(code);
    setStatus({ code, ok });
  }

  // Left/Right arrows move between tabs, Home/End jump to the ends.
  function onTabKeyDown(e, index) {
    const last = TABS.length - 1;
    let next = null;
    if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    setActive(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  const shownGroups = active === "all" ? GROUPS : GROUPS.filter((g) => g.id === active);

  return (
    <>
      <Seo
        title="Coupons & Current Offers"
        description="Live tire specials, free-shipping codes, set-of-four deals and manufacturer rebates from TireDrop. Copy a promo code and use it at checkout."
      />
      <Breadcrumbs trail={[{ label: "Coupons" }]} />

      <PageHero
        eyebrow="Current Offers"
        title="Deals & Rebates"
        lede="Real money off a real order. Copy a code straight into your cart, or mention the offer when a tech calls to confirm it."
      >
        <div className="flex flex-wrap gap-3">
          <Link to="/tires" className="btn-primary">
            Shop Tires
          </Link>
          <a href={BUSINESS.phoneHref} className="btn-ghost-light">
            <Phone size={16} aria-hidden />
            {BUSINESS.phone}
          </a>
        </div>
      </PageHero>

      <div className="hazard h-2" aria-hidden />

      <Section>
        {/* Filter tabs */}
        <div className="mb-10">
          <div
            role="tablist"
            aria-label="Filter offers by type"
            className="flex flex-wrap gap-2 border-b border-ink/10 pb-4"
          >
            {TABS.map((tab, i) => {
              const selected = active === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => (tabRefs.current[i] = el)}
                  id={`tab-${tab.id}`}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls="offer-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(tab.id)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
                  className={`rounded-sm px-4 py-2 font-display text-sm uppercase tracking-wide transition-colors ${
                    selected
                      ? "bg-ink text-bone"
                      : "border border-ink/15 bg-bone text-ink hover:border-ink/40"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <p aria-live="polite" className="sr-only">
            {status ? (status.ok ? `${status.code} copied to your clipboard` : `Could not copy ${status.code}`) : ""}
          </p>
        </div>

        <div id="offer-panel" role="tabpanel" aria-labelledby={`tab-${active}`} tabIndex={-1}>
          {shownGroups.map((group) => {
            const offers = OFFERS.filter((o) => o.group === group.id);
            const Icon = group.icon;
            return (
              <section key={group.id} className="mb-14 last:mb-0">
                <div className="mb-6 flex items-start gap-3">
                  <Icon size={24} aria-hidden className="mt-1 shrink-0 text-drop" />
                  <div className="min-w-0">
                    <h2 className="h2">{group.label}</h2>
                    <p className="lede mt-2 max-w-2xl">{group.lede}</p>
                  </div>
                </div>

                {group.id === "rebate" && (
                  <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-sm bg-ink px-5 py-4">
                    <span className="font-display text-xs uppercase tracking-[0.2em] text-bone/60">
                      Rebate brands
                    </span>
                    {TIRE_BRANDS.map((b) => (
                      <span
                        key={b.slug}
                        className="font-display text-lg uppercase tracking-wide text-bone"
                      >
                        {b.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {offers.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      status={status}
                      onCopy={handleCopy}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </Section>

      {/* How to use a code */}
      <Section className="bg-bone">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-12">
          <div>
            <p className="eyebrow mb-2">Using an offer</p>
            <h2 className="h2">Three ways to cash one in</h2>
            <ol className="mt-6 space-y-5">
              {[
                {
                  title: "Copy the code into your cart",
                  copy: "Codes like MOBILE25 and FLEET15 drop straight into the promo field on the cart page. The discount shows up in your summary before you check out.",
                },
                {
                  title: "Mention it when we call",
                  copy: "Offers without a code get applied by hand. Say the offer name when a team member calls to confirm fitment and take payment.",
                },
                {
                  title: "Claim your rebate after the sale",
                  copy: "Manufacturer rebates are submitted to the tire maker, not to us. You get an itemized invoice with the order, and we walk you through the claim form.",
                },
              ].map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-drop font-display text-base text-bone">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-lg uppercase tracking-wide">{s.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-smoke">{s.copy}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="card p-6">
            <BadgePercent size={24} aria-hidden className="text-drop" />
            <h2 className="h3 mt-4">The fine print, all of it</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-smoke">
              <li>
                One promo code per order. Codes discount the parts subtotal or the installation
                line, never taxes, disposal fees or shop supplies.
              </li>
              <li>
                Offers apply to orders shipping within the continental US and can't be applied to
                an order that has already been completed and paid.
              </li>
              <li>
                Manufacturer rebates are funded and fulfilled by the tire maker. Qualifying lines,
                amounts and submission windows are set by them and can change without notice. We
                confirm eligibility before you buy.
              </li>
              <li>
                Installation offers are South Florida only. Mobile installs also need an address we
                can safely work at — a level, paved surface with room for the van and one working
                side of the vehicle.
              </li>
              <li>
                Prices, availability and offers are subject to change. Where an offer conflicts with
                a quoted price, the quote a tech gives you on the confirmation call governs.
              </li>
              <li>
                Questions on any of this? Call{" "}
                <a href={BUSINESS.phoneHref} className="text-ink underline hover:text-drop">
                  {BUSINESS.phone}
                </a>{" "}
                — someone at the shop will tell you straight.
              </li>
            </ul>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <section className="bg-ink text-bone">
        <div className="wrap py-14 text-center md:py-20">
          <p className="eyebrow mb-2">{BUSINESS.tagline}</p>
          <h2 className="h2">Ready to put an offer to work?</h2>
          <p className="lede mx-auto mt-3 max-w-xl text-bone/70">
            Find your size, drop a code in the cart and pick your delivery. {BUSINESS.poweredBy}{" "}
            since {BUSINESS.foundedYear}.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/tires" className="btn-primary">
              Shop Tires
            </Link>
            <a href={BUSINESS.phoneHref} className="btn-ghost-light">
              <Phone size={16} aria-hidden />
              Call {BUSINESS.phone}
            </a>
            <Link to="/wheels" className="btn-ghost-light">
              Shop Wheels
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
