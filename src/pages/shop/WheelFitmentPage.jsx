import React from "react";
import { Link } from "react-router-dom";
import { Phone, Ruler } from "lucide-react";

import {
  Seo,
  PageHero,
  Breadcrumbs,
  Section,
  SectionHead,
} from "../../components/ui/index.jsx";
import { BUSINESS } from "../../data/business.js";

/**
 * /wheel-fitment: what decides whether a wheel fits, and what we check before
 * a wheel order ships. It used to be /wheels?view=fitment, a query state the
 * Seo component canonicalised to /wheels, so it could never rank by itself;
 * vercel.json 301s the old address here.
 */
const FITMENT_STEPS = [
  {
    title: "1. Bolt pattern",
    body: "Count the lugs and measure across them — 5x114.3 means five lugs on a 114.3mm circle. It has to match exactly; adapters are a last resort, not a plan.",
  },
  {
    title: "2. Diameter and width",
    body: "A 20x9 wheel is 20 inches tall and 9 inches wide. Going up in diameter means going down in tire sidewall to keep the overall height close to stock.",
  },
  {
    title: "3. Offset",
    body: "Offset is how far the mounting face sits from the wheel's centerline. Too little and the tire rubs the fender; too much and it hits the strut or control arm.",
  },
  {
    title: "4. Center bore",
    body: "The wheel's center hole should sit on the vehicle's hub. When the wheel bore is larger, hub-centric rings fill the gap — they ship with the wheels.",
  },
  {
    title: "5. Brake clearance",
    body: "Big factory calipers need spoke clearance. We check this before your order is released so nothing ships that will not turn.",
  },
  {
    title: "6. Load rating",
    body: "Trucks, vans and three-row SUVs need wheels rated for their weight. Passenger-rated wheels on a work truck is how rims crack.",
  },
];

export default function WheelFitmentPage() {
  return (
  <>
    <Seo
      title="Wheel Fitment Guide: Bolt Pattern, Offset, Center Bore"
      crumbs={[{ name: "Wheels", path: "/wheels" }]}
      crumbName="Fitment"
      description="Bolt pattern, offset, center bore and load rating explained — how TireDrop specs wheels that actually fit your vehicle before they ship."
    />
    <PageHero
      eyebrow="Wheels"
      title="Fitment Guidance"
      lede="Six numbers decide whether a wheel bolts on and clears everything. Here is what each one means, and what we check before anything ships."
    />
    <Breadcrumbs
      trail={[{ label: "Wheels", to: "/wheels" }, { label: "Fitment" }]}
    />
    <Section>
      <SectionHead
        eyebrow="Get it right the first time"
        title="What we check on every wheel order"
        lede="Send us the year, make, model and trim — plus a photo of the back of your current wheel if you are already running aftermarket."
        action={
          <Link to="/wheels" className="btn-outline btn-sm">
            Shop all wheels
          </Link>
        }
      />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {FITMENT_STEPS.map((step) => (
          <div key={step.title} className="card p-6">
            <Ruler size={22} aria-hidden className="mb-3 text-drop" />
            <h3 className="h3">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-smoke">
              {step.body}
            </p>
          </div>
        ))}
      </div>

      <div className="card mt-10 flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="h3">Not sure what fits?</h2>
          <p className="mt-1 text-sm text-smoke">
            Call {BUSINESS.phone} with your vehicle details and we will spec
            the package — wheels and tires together, shipped to you or free
            to our South Florida shop for fitting.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <a href={BUSINESS.phoneHref} className="btn-primary btn-sm">
            <Phone size={16} aria-hidden />
            {BUSINESS.phone}
          </a>
          <Link to="/wheel-offset-calculator" className="btn-outline btn-sm">
            Wheel offset check
          </Link>
          <Link to="/shipping" className="btn-outline btn-sm">
            How shipping works
          </Link>
        </div>
      </div>
    </Section>
  </>
  );
}
