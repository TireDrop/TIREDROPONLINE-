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
import {
  TIRE_TYPES,
  SIDEWALL_PARTS,
  WHEEL_BUILDS,
} from "../data/brandsGuideCopy.js";

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

const SHOP_BY_TYPE = [
  { to: "/tires", label: "Tires", note: "Passenger, SUV and truck tires" },
  { to: "/wheels", label: "Wheels", note: "Street, off-road and classic wheels" },
  { to: "/commercial-tires", label: "Commercial tires", note: "Medium-truck, trailer and fleet" },
  { to: "/wheel-fitment", label: "Wheel fitment guide", note: "Bolt pattern, offset and more" },
  { to: "/install", label: "Installation", note: "South Florida shop only" },
];

const NEXT_LINKS = [
  { to: "/find-my-tires", label: "Find tires for your vehicle" },
  { to: "/tire-size-finder", label: "Find your tire size" },
  { to: "/shipping", label: "How shipping works" },
  { to: "/contact", label: "Contact us" },
];

export default function BrandsPage() {
  const tires = BRANDS_ALL.filter((b) => b.kind === "tires").length;
  const wheels = BRANDS_ALL.filter((b) => b.kind === "wheels").length;
  return (
    <>
      <Seo
        title="Tire and Wheel Brands"
        description="The tire and wheel brands TireDrop sources and ships, from Continental and Michelin to Cragar and Edge. Catalog availability changes, so call or chat for a size. Free shipping to 48 states and DC."
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
            These are the {tires} tire brands and {wheels} wheel brands that
            TireDrop sources and ships, including brands with commercial and
            fleet lines. The catalog changes, and a brand listed here is not a
            promise that a particular size is available today. If you do not
            see your size, call or chat with us and we will check it for you.
          </p>
          <p>
            <strong className="text-ink">Tires</strong> covers passenger,
            truck, SUV and light-truck brands.{" "}
            <strong className="text-ink">Wheels</strong> covers street,
            off-road and classic wheel makers.{" "}
            <strong className="text-ink">Commercial</strong> narrows the tire
            list to brands with medium-truck, trailer or fleet lines. Use the
            buttons to filter, or type part of a name.
          </p>
          <p>
            To shop, start from your size or vehicle rather than the brand:
            the catalog shows what fits, and you compare from there. Every
            order ships free to the 48 contiguous states and DC, or to our
            South Florida shop for installation.
          </p>
        </div>
        <BrandWall />
        <nav aria-label="Shop by type" className="mt-12">
          <h2 className="h3">Shop by type</h2>
          <ul className="mt-3 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {SHOP_BY_TYPE.map((l) => (
              <li key={l.to} className="card p-4">
                <Link to={l.to} className="link text-[15px] font-bold">
                  {l.label}
                </Link>
                <p className="m-0 mt-1 text-sm text-smoke">{l.note}</p>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-12 max-w-[72ch] space-y-10">
          <section aria-labelledby="choose-type-h">
            <h2 id="choose-type-h" className="h3">
              How to choose between tire types
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-smoke">
              The brand matters less than picking the right kind of tire for
              how you drive. Start with the type, then compare brands that
              make it in your size.
            </p>
            <dl className="mt-3 space-y-4">
              {TIRE_TYPES.map((t) => (
                <div key={t.title}>
                  <dt className="text-[15px] font-bold text-ink">{t.title}</dt>
                  <dd className="m-0 mt-1 text-[15px] leading-relaxed text-smoke">
                    {t.body}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[15px] leading-relaxed text-smoke">
              Not sure which size you need? Try the{" "}
              <Link to="/tire-size-finder" className="link">
                tire size finder
              </Link>{" "}
              or{" "}
              <Link to="/find-my-tires" className="link">
                search by vehicle
              </Link>
              .
            </p>
          </section>

          <section aria-labelledby="sidewall-h">
            <h2 id="sidewall-h" className="h3">
              How to read a tire sidewall
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-smoke">
              The code molded into the sidewall tells you the size and what
              the tire can carry. Take P245/45R18 100W as an example:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-smoke">
              {SIDEWALL_PARTS.map((p) => (
                <li key={p.code}>
                  <strong className="text-ink">{p.code}</strong>: {p.meaning}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[15px] leading-relaxed text-smoke">
              Nearby on the sidewall you will also find the DOT code, which
              ends in the week and year the tire was made, and treadwear,
              traction and temperature grades on many passenger tires. Your
              vehicle's door-jamb placard lists the size the maker specified.
            </p>
          </section>

          <section aria-labelledby="wheel-build-h">
            <h2 id="wheel-build-h" className="h3">
              How wheel construction differs
            </h2>
            <dl className="mt-3 space-y-4">
              {WHEEL_BUILDS.map((w) => (
                <div key={w.title}>
                  <dt className="text-[15px] font-bold text-ink">{w.title}</dt>
                  <dd className="m-0 mt-1 text-[15px] leading-relaxed text-smoke">
                    {w.body}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[15px] leading-relaxed text-smoke">
              Whatever the build, the wheel still has to match your bolt
              pattern, offset and center bore. Our{" "}
              <Link to="/wheel-fitment" className="link">
                wheel fitment guide
              </Link>{" "}
              explains each one.
            </p>
          </section>
        </div>

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
