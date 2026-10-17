import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Phone } from "lucide-react";

import { BUSINESS } from "../data/business.js";
import { BRAND_COUNT, BRAND_GROUPS } from "../data/brands.js";
import {
  Breadcrumbs,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../components/ui/index.jsx";

/**
 * /brands: the tire and wheel brands in the supply network, as logos.
 *
 * The logos only say a brand is in the network; whether a size can be ordered
 * is the catalog's call, so this page names no price, no stock and no "we
 * carry" promise, and links to the finder instead. The logos come from
 * src/data/brands.js (public/brands/*.png).
 */

function LogoWall({ group }) {
  return (
    <ul
      aria-label={group.title}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5"
    >
      {group.brands.map((b, i) => (
        <li
          key={`${group.id}-${b.name}`}
          data-reveal
          style={{ "--rv-i": i % 5 }}
          className="flex h-24 items-center justify-center rounded-card border border-ink/[0.07] bg-bone p-4 shadow-card"
        >
          <img
            src={`/brands/${b.file}`}
            alt={b.name}
            width={b.w}
            height={b.h}
            loading="lazy"
            decoding="async"
            className="h-auto max-h-11 w-auto max-w-full object-contain"
          />
        </li>
      ))}
    </ul>
  );
}

export default function BrandsPage() {
  return (
    <>
      <Seo
        title="Tire and Wheel Brands"
        description={`The ${BRAND_COUNT} tire and wheel brands in the TireDrop supply network, from Continental, Pirelli and Toyo to wheels from TIS, Cragar and Gear Off Road. Find the sizes that fit your vehicle.`}
      />

      <PageHero
        eyebrow="Brands"
        title="The brands behind the tires and wheels"
        lede="TireDrop orders through a national distribution network that carries these tire and wheel brands. Not every brand comes in every size, so the finder shows what can be ordered for your vehicle."
      >
        <div className="flex flex-wrap gap-3">
          <Link to="/tires?search=vehicle" className="btn-primary">
            Find tires for my vehicle
            <ArrowRight size={17} aria-hidden />
          </Link>
          <a href={BUSINESS.phoneHref} className="btn-ghost-light">
            <Phone size={18} aria-hidden />
            {BUSINESS.phone}
          </a>
        </div>
      </PageHero>

      <Breadcrumbs trail={[{ label: "Brands" }]} />

      {BRAND_GROUPS.map((group, i) => (
        <Section
          key={group.id}
          id={group.id}
          className={i % 2 === 0 ? "bg-fog" : "bg-bone"}
        >
          <SectionHead
            eyebrow={`${group.brands.length} brands`}
            title={group.title}
            lede={group.lede}
          />
          <LogoWall group={group} />
        </Section>
      ))}

      <Section className="bg-fog">
        <p className="max-w-[68ch] text-sm leading-relaxed text-smoke">
          Brand names and logos belong to their owners. They appear here only to
          say which brands are in our supply network, and TireDrop is not
          affiliated with or endorsed by any of them. Questions about a brand or
          a size? Call {BUSINESS.phone}, or{" "}
          <Link to="/contact" className="font-semibold text-drop hover:text-dive">
            send us a message
          </Link>
          .
        </p>
      </Section>
    </>
  );
}
