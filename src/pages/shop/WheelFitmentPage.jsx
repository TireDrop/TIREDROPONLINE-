import React from "react";
import { Link } from "react-router-dom";
import { Phone } from "lucide-react";

import {
  Seo,
  PageHero,
  Breadcrumbs,
  Section,
  SectionHead,
} from "../../components/ui/index.jsx";
import { BUSINESS } from "../../data/business.js";
import {
  FITMENT_TOPICS,
  FITMENT_CHECKLIST,
  FITMENT_FAQ,
} from "../../data/wheelFitmentCopy.js";

/**
 * /wheel-fitment: what decides whether a wheel fits, and what we check before
 * a wheel order ships. It used to be /wheels?view=fitment, a query state the
 * Seo component canonicalised to /wheels, so it could never rank by itself;
 * vercel.json 301s the old address here.
 */
export default function WheelFitmentPage() {
  return (
  <>
    <Seo
      title="Wheel Fitment Guide: Bolt Pattern and Offset"
      crumbs={[{ name: "Wheels", path: "/wheels" }]}
      crumbName="Fitment"
      description="Bolt pattern, offset, center bore and load rating explained — how TireDrop specs wheels that actually fit your vehicle before they ship."
    />
    <PageHero
      eyebrow="Wheels"
      title="Wheel fitment guide"
      lede="Six numbers decide whether a wheel bolts on and clears everything. Here is what each one means, and what we check before anything ships."
    />
    <Breadcrumbs
      trail={[{ label: "Wheels", to: "/wheels" }, { label: "Fitment" }]}
    />
    <Section>
      <SectionHead
        eyebrow="Get it right the first time"
        title="How wheel fitment works"
        lede="Plain-English notes on each measurement. These are general facts, so always confirm against your own vehicle before ordering."
        action={
          <Link to="/wheels" className="btn-outline btn-sm">
            Shop all wheels
          </Link>
        }
      />
      <div className="max-w-[72ch] space-y-10">
        {FITMENT_TOPICS.map((t) => (
          <section key={t.id} id={t.id} aria-labelledby={`${t.id}-h`}>
            <h2 id={`${t.id}-h`} className="h3">
              {t.title}
            </h2>
            {t.paras.map((p) => (
              <p key={p.slice(0, 24)} className="mt-3 text-[15px] leading-relaxed text-smoke">
                {p}
              </p>
            ))}
            {t.links && (
              <p className="mt-3 text-[15px]">
                {t.links.map((l) => (
                  <Link key={l.to} to={l.to} className="link">
                    {l.label}
                  </Link>
                ))}
              </p>
            )}
          </section>
        ))}

        <section id="what-to-send" aria-labelledby="what-to-send-h">
          <h2 id="what-to-send-h" className="h3">
            What to send us
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-smoke">
            Send this through our{" "}
            <Link to="/contact" className="link">
              contact page
            </Link>{" "}
            or by phone.
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-smoke">
            {FITMENT_CHECKLIST.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-3 text-[15px] leading-relaxed text-smoke">
            Free shipping covers the 48 contiguous states and DC; see{" "}
            <Link to="/shipping" className="link">
              how shipping works
            </Link>
            . Fitting is available at our South Florida shop only; see{" "}
            <Link to="/install" className="link">
              installation
            </Link>
            .
          </p>
        </section>

        <section id="faq" aria-labelledby="faq-h">
          <h2 id="faq-h" className="h3">
            Wheel fitment questions
          </h2>
          <dl className="mt-3 space-y-4">
            {FITMENT_FAQ.map((f) => (
              <div key={f.q}>
                <dt className="text-[15px] font-bold text-ink">{f.q}</dt>
                <dd className="m-0 mt-1 text-[15px] leading-relaxed text-smoke">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>
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
          <Link to="/contact" className="btn-outline btn-sm">
            Contact us
          </Link>
        </div>
      </div>
    </Section>
  </>
  );
}
