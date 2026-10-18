import React from "react";
import { Link } from "react-router-dom";

import {
  Seo,
  PageHero,
  Breadcrumbs,
  Section,
  SectionHead,
} from "../components/ui/index.jsx";
import BrandWall from "../components/brands/BrandWall.jsx";
import { BRANDS_ALL } from "../data/brandsAll.js";
import { ORIGIN } from "../components/content/schema.js";

/**
 * /brands: every tire and wheel brand logo, with type filters and a name
 * search (the wall itself is src/components/brands/BrandWall.jsx).
 *
 * This is its own address on purpose. It used to be /tires?view=brands, which
 * the Seo component canonicalises to /tires, so it could never rank by itself;
 * vercel.json now sends that old address here with a 301.
 *
 * For search engines: one H1, a plain-text intro, every brand name as visible
 * text (the tiles render in the prerendered HTML, logos have alt text), an
 * ItemList of Brand nodes, a breadcrumb trail, and internal links on to the
 * shop pages. No claims about stock or prices: the logos identify the brands
 * and nothing here says a given brand or size is in stock.
 */
const ITEM_LIST = {
  "@type": "ItemList",
  "@id": `${ORIGIN}/brands#brands`,
  name: "Tire and wheel brands",
  numberOfItems: BRANDS_ALL.length,
  itemListElement: BRANDS_ALL.map((b, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Brand",
      name: b.name,
      logo: `${ORIGIN}/brand/logos/${b.file}`,
    },
  })),
};

const NEXT_LINKS = [
  { to: "/tires", label: "Shop all tires" },
  { to: "/wheels", label: "Shop all wheels" },
  { to: "/commercial-tires", label: "Commercial and fleet tires" },
  { to: "/find-my-tires", label: "Find tires for your vehicle" },
  { to: "/tire-size-finder", label: "Find your tire size" },
  { to: "/shipping", label: "How shipping works" },
];

export default function BrandsPage() {
  const tires = BRANDS_ALL.filter((b) => b.kind === "tires").length;
  const wheels = BRANDS_ALL.filter((b) => b.kind === "wheels").length;
  return (
    <>
      <Seo
        title="Tire and Wheel Brands"
        description="The tire and wheel brands you will see at TireDrop, from Continental and Michelin to Cragar and Edge. Filter by type or search by name. Ships free to 48 states and DC."
        schema={[ITEM_LIST]}
      />
      <PageHero
        eyebrow="Shop by brand"
        title="Tire and wheel brands"
        lede="Filter by tires, wheels or commercial, or search for a brand by name."
      />
      <Breadcrumbs trail={[{ label: "Brands" }]} />
      <Section>
        <SectionHead
          eyebrow="Brands"
          title="Brand logos"
          lede="Tires first, then wheels, each group A to Z."
          action={
            <div className="flex flex-wrap gap-2">
              <Link to="/tires" className="btn-outline btn-sm">
                Shop all tires
              </Link>
              <Link to="/wheels" className="btn-outline btn-sm">
                Shop all wheels
              </Link>
            </div>
          }
        />
        <div className="mb-6 max-w-[65ch] space-y-3 text-[15px] text-smoke">
          <p>
            These are the {tires} tire brands and {wheels} wheel brands you
            will see on TireDrop, including brands with commercial and fleet
            lines. Which sizes are available depends on the catalog on the day.
            Use the buttons to narrow it to tires, wheels or commercial, or type
            part of a name to find one.
          </p>
          <p>
            <strong className="text-ink">Tires</strong> covers passenger,
            truck, SUV and light-truck brands, from the large names to
            value lines made by the same groups.{" "}
            <strong className="text-ink">Wheels</strong> covers street,
            off-road and classic wheel makers.{" "}
            <strong className="text-ink">Commercial</strong> narrows the tire
            list to brands with medium-truck, trailer or fleet lines.
          </p>
          <p>
            To shop, start from your size or your vehicle rather than the
            brand: the catalog shows what fits, and you compare brands from
            there. Every order ships free to the 48 contiguous states and DC,
            or to our South Florida shop for installation.
          </p>
        </div>
        <BrandWall />
        <nav aria-label="More from TireDrop" className="mt-12">
          <h2 className="h3">Keep shopping</h2>
          <ul className="mt-3 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-[15px]">
            {NEXT_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="link">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-10 max-w-[78ch] space-y-2 text-[13px] text-smoke">
          <p>
            Brand names and logos are trademarks of their owners and appear here
            to identify the products we sell.
          </p>
          <p>
            Free shipping to the 48 contiguous states and DC. Installation is
            South Florida only.
          </p>
        </div>
      </Section>
    </>
  );
}
