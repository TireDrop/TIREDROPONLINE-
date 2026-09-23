import React from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  Circle,
  Disc3,
  Phone,
  Truck,
} from "lucide-react";
import { BUSINESS } from "../data/business.js";
import { Seo } from "../components/ui/index.jsx";

const HELPFUL_LINKS = [
  {
    to: "/tires",
    icon: Circle,
    title: "Shop Tires",
    copy: "Search by vehicle or by size and see what we can get on it this week.",
  },
  {
    to: "/wheels",
    icon: Disc3,
    title: "Shop Wheels",
    copy: "Fitment-checked wheels, mounted and balanced by the same crew.",
  },
  {
    to: "/mobile-service",
    icon: Truck,
    title: "Mobile Service",
    copy: "How the van works, what it carries and where it goes across Broward.",
  },
  {
    to: "/schedule",
    icon: CalendarClock,
    title: "Schedule Service",
    copy: "Pick a day and tell us where the vehicle will be parked.",
  },
];

export default function NotFoundPage() {
  return (
    <>
      <Seo
        title="Page Not Found"
        description={`That page is not here. Find tires, wheels, mobile service and scheduling for ${BUSINESS.name}, or call ${BUSINESS.phone}.`}
      />

      <section className="bg-ink text-bone">
        <div className="wrap py-16 md:py-24">
          <p className="eyebrow mb-3">Error 404</p>

          <p
            aria-hidden
            className="font-display text-[5rem] leading-[0.85] text-drop sm:text-[8rem] md:text-[11rem]"
          >
            404
          </p>

          <h1 className="h1 mt-4 max-w-3xl">
            This one is flat. The rest of the site is fine.
          </h1>

          <p className="lede mt-5 max-w-xl text-bone/70">
            The page you were looking for moved, got renamed, or never existed.
            Nothing you did wrong. Here is where most people were headed
            anyway — or call us and we will point you straight at it.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/" className="btn-primary">
              Back to Home
            </Link>
            <a href={BUSINESS.phoneHref} className="btn-ghost-light">
              <Phone size={18} aria-hidden />
              Call {BUSINESS.phone}
            </a>
          </div>
        </div>
      </section>

      <section className="section bg-bone">
        <div className="wrap">
          <h2 className="h2 mb-8">Try one of these</h2>

          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HELPFUL_LINKS.map(({ to, icon: Icon, title, copy }) => (
              <li key={to}>
                <Link to={to} className="card-hover block h-full p-6">
                  <Icon size={26} aria-hidden className="mb-4 text-drop" />
                  <h3 className="h3">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-smoke">
                    {copy}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <div className="card mt-8 flex flex-col gap-4 border-l-4 border-l-amber p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="h3">Still stuck?</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-smoke">
                The{" "}
                <Link to="/sitemap" className="underline hover:text-drop">
                  sitemap
                </Link>{" "}
                lists every page on this site, or send us a message through the{" "}
                <Link to="/contact" className="underline hover:text-drop">
                  contact form
                </Link>
                .
              </p>
            </div>
            <a href={BUSINESS.phoneHref} className="btn-dark btn-sm shrink-0">
              <Phone size={16} aria-hidden />
              {BUSINESS.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
