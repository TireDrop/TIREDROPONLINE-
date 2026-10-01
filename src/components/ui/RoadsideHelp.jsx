import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock, LifeBuoy, Phone, Wrench } from "lucide-react";

import { BUSINESS } from "../../data/business.js";
import { CITY_PAGE_SHARED as SHARED } from "../../data/cityPages.js";

const ICONS = [LifeBuoy, Wrench, LifeBuoy];

/**
 * Flat tire help away from the highway: side streets, parking lots, homes
 * and workplaces, during the shop's published hours (BUSINESS.hours). The
 * one exclusion, highway and expressway shoulders, is Justin's wording and
 * lives in src/data/cityPages.js.
 *
 * Not in the service catalog (src/data/services.js) yet: it has no published
 * price, so it is a phone call rather than an online booking. The repair
 * itself is the Tire Repair service, linked below.
 *
 * `showHighway` is off where the page already shows the highway line (the
 * city pages' scope list).
 */
export default function RoadsideHelp({ title, lede, showHighway = true }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-14">
      <div>
        <p className="eyebrow mb-2.5 flex items-center gap-2.5">
          <span aria-hidden className="h-px w-6 bg-drop/45" />
          Roadside flat help
        </p>
        <h2 className="h2 text-balance">{title}</h2>
        <p className="lede mt-4 max-w-xl">{lede}</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {SHARED.roadsideItems.map((item, i) => {
            const Icon = ICONS[i] ?? LifeBuoy;
            return (
              <li key={item.title} className="card p-5">
                <Icon size={20} aria-hidden className="text-drop" />
                <h3 className="mt-3 font-display text-[1.0625rem] font-bold text-ink">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-smoke">
                  {item.body}
                </p>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-sm text-smoke">
          The repair itself is our{" "}
          <Link to="/services/tire-repair" className="text-drop underline hover:text-dive">
            tire repair service
          </Link>
          .
        </p>
      </div>

      <aside className="card self-start p-6">
        <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
          <Clock size={16} aria-hidden className="text-drop" />
          During shop hours
        </h3>
        <ul className="mt-3 space-y-1 text-sm text-smoke">
          {BUSINESS.hours.map((h) => (
            <li key={h.days}>
              <span className="text-ink">{h.days}:</span> {h.time}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-smoke">
          We confirm an arrival window when we book.
        </p>
        <a href={BUSINESS.phoneHref} className="btn-primary mt-5 w-full">
          <Phone size={18} aria-hidden />
          Call {BUSINESS.phone}
        </a>
        {showHighway && (
          <p className="mt-5 flex items-start gap-2 border-t border-ink/10 pt-4 text-sm leading-relaxed text-ink">
            <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0 text-amber" />
            <span>{SHARED.highwayLine}</span>
          </p>
        )}
      </aside>
    </div>
  );
}
