import React from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, PackageSearch, Phone, Search } from "lucide-react";

import {
  Seo,
  PageHero,
  Breadcrumbs,
  Section,
  EmptyState,
} from "../../components/ui/index.jsx";
import { BUSINESS } from "../../data/business.js";
import { useTire } from "../../data/useApi.js";
import { ProductDetail } from "./ProductPage.jsx";

/**
 * /tires/p/:sku — the product page for a tire looked up by sku through
 * GET /api/tires?sku=. It exists for the tires a live distributor search
 * returns that the sample catalog does not list, so they get a page of their
 * own instead of no details link at all. Catalog tires keep their
 * /tires/:slug pages; this route renders them too if linked to directly.
 *
 * Everything shown comes from the lookup: the price is the server's, and
 * stock is said only when the distributor reported it.
 */
export default function TireSkuPage() {
  const { sku = "" } = useParams();
  const { loading, product, error } = useTire(sku);

  if (loading) {
    return (
      <>
        <Seo
          title="Loading Tire"
          description="Looking up this tire's price and details."
          noindex
        />
        <Breadcrumbs trail={[{ label: "Tires", to: "/tires" }, { label: sku }]} />
        <Section>
          <div
            role="status"
            className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-smoke"
          >
            <Loader2 size={28} aria-hidden className="animate-spin text-drop" />
            <p className="text-sm">Looking up this tire&hellip;</p>
          </div>
        </Section>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Seo
          title="Tire Not Found"
          description="We couldn't find that tire. Search by size or vehicle, or call the shop."
          noindex
        />
        <PageHero
          eyebrow="Not found"
          title="We couldn't find that tire"
          lede={
            error
              ? error.message
              : "It may no longer be carried, or the link may be out of date."
          }
        />
        <Breadcrumbs
          trail={[{ label: "Tires", to: "/tires" }, { label: "Not found" }]}
        />
        <Section>
          <EmptyState
            icon={PackageSearch}
            as="h2"
            title="Search for your size instead"
            lede="Search by tire size or by vehicle to see what we can ship today, or call us with the size you need."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/tires" className="btn-primary btn-sm">
                  <Search size={16} aria-hidden />
                  Search tires
                </Link>
                <a href={BUSINESS.phoneHref} className="btn-outline btn-sm">
                  <Phone size={16} aria-hidden />
                  Call {BUSINESS.phone}
                </a>
              </div>
            }
          />
        </Section>
      </>
    );
  }

  return (
    <ProductDetail key={product.id} product={product} kind="tire" reportStock />
  );
}
