import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * A one-line pointer to /brands for the tire and wheel hub pages. `kind` only
 * changes the wording; it never claims we carry every brand.
 */
export default function BrandsHubLink({ kind = "tires" }) {
  return (
    <div className="wrap py-6" data-brands-hub-link>
      <p className="text-sm text-smoke">
        Not sure which maker to pick?{" "}
        <Link
          to="/brands"
          className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-drop underline-offset-2 hover:text-dive hover:underline"
        >
          {kind === "wheels"
            ? "See the tire and wheel brands we list"
            : "See all the tire brands we list"}
          <ArrowRight size={14} aria-hidden />
        </Link>
      </p>
    </div>
  );
}
