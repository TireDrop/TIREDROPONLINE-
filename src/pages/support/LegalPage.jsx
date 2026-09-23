import React from "react";
import { Link } from "react-router-dom";
import { Phone, ShieldCheck } from "lucide-react";
import { BUSINESS } from "../../data/business.js";
import {
  Breadcrumbs,
  PageHero,
  Section,
  Seo,
} from "../../components/ui/index.jsx";

const LAST_UPDATED = "September 22, 2026";

const DOCS = {
  terms: {
    title: "Terms of Use",
    eyebrow: "Legal",
    seoDescription: `The terms that apply to using the ${BUSINESS.name} website, booking service and buying tires and wheels.`,
    lede: "The ground rules for using this website and for the work we do. Written to be read, not to be skimmed past.",
    sections: [
      {
        id: "acceptance",
        heading: "1. Using this site",
        paragraphs: [
          `This website is operated by ${BUSINESS.name}, a tire and auto service business located at ${BUSINESS.address.full}. By browsing the site, requesting a quote, booking an appointment or placing an order, you are agreeing to the terms on this page.`,
          "Please use the site for its intended purpose: learning about our services, shopping for tires and wheels, and arranging work on your vehicle. Do not attempt to interfere with the site, scrape it at scale, or submit information that is not yours to submit.",
        ],
      },
      {
        id: "pricing",
        heading: "2. Product information, pricing and availability",
        paragraphs: [
          "We try hard to keep prices, specifications, fitment details and stock counts accurate. Even so, tire pricing moves, inventory turns over daily, and mistakes happen. Nothing on this site is a guaranteed offer to sell at a listed price.",
          "If a price or availability turns out to be wrong after you place an order, we will contact you, explain the difference and give you the choice to proceed, pick an alternative or cancel for a full refund of anything you have paid. We will not quietly substitute a different tire, size, load rating or speed rating without telling you first.",
          "Images and illustrations on this site may be representative rather than exact. When fitment matters, confirm it with us before you buy — a quick call is faster than a return.",
        ],
      },
      {
        id: "appointments",
        heading: "3. Appointments, mobile service and cancellations",
        paragraphs: [
          "Appointment times are scheduled windows, not guarantees to the minute. Traffic across Broward County, weather and the job in front of yours all move the clock. If we are running behind, we would rather call you than leave you waiting.",
          "Mobile service needs a safe, legal, reasonably level place to work beside the vehicle, and enough room to jack it up and run equipment. If the location is unsafe — soft ground, a steep slope, a spot where we cannot work without risking you, us or the vehicle — our technician may decline to perform the work there and we will help you find an alternative, including bringing the vehicle to the Sunrise shop.",
          `Plans change; we understand that. Please give us as much notice as you can if you need to cancel or move an appointment — call ${BUSINESS.phone} during business hours. Repeated no-shows on mobile calls may mean we ask for confirmation before dispatching a van in future, since a wasted trip is a route slot another customer needed.`,
          "Special-order tires and wheels are ordered specifically for your vehicle. Once the order is placed, cancellation may be limited by our supplier's terms. We will tell you if that applies before we order anything.",
        ],
      },
      {
        id: "payment",
        heading: "4. Orders and payment",
        paragraphs: [
          "Payment is due when the work is completed unless we have agreed otherwise in writing, such as on a commercial or fleet account. Quotes are estimates based on what we know at the time; if we find additional work is needed, we will contact you for approval before doing it.",
          "Financing, where offered, is provided by a third-party lender under their own terms. We do not make credit decisions and we do not set rates. See our financing page for the details before you apply.",
        ],
      },
      {
        id: "warranties",
        heading: "5. Workmanship, tires and warranties",
        paragraphs: [
          "We stand behind the work our technicians perform. If something we installed was not done right, tell us promptly and give us the chance to inspect it and put it right.",
          "Tires, wheels and parts carry whatever manufacturer warranty the maker provides. Those warranties come from the manufacturer, not from us, and their terms, exclusions and claim processes are theirs. We will help you file a claim and will tell you honestly what we think it is worth pursuing.",
          "Normal wear, road hazard damage, curb and pothole impacts, improper inflation, alignment issues we did not cause, and damage from continuing to drive on a failing tire are not workmanship issues. Beyond any express warranty we give you in writing, services are provided as-is to the extent Florida law permits.",
        ],
      },
      {
        id: "third-party",
        heading: "6. Links and third-party services",
        paragraphs: [
          "This site may link to other companies — manufacturers, mapping providers, payment processors, financing partners. We do not control those sites, and their terms and privacy practices are their own. Read them when it matters to you.",
        ],
      },
      {
        id: "liability",
        heading: "7. Limitation of liability",
        paragraphs: [
          "To the fullest extent allowed by Florida law, our liability arising out of the use of this website, or out of any single service transaction, is limited to the amount you paid us for the service or product at issue.",
          "We are not liable for indirect or consequential losses — lost income, missed appointments, rental costs or downtime — arising from a delay, a scheduling change or a site outage. Nothing in these terms limits any liability that cannot lawfully be limited, including for personal injury caused by negligence.",
        ],
      },
      {
        id: "governing-law",
        heading: "8. Governing law",
        paragraphs: [
          "These terms are governed by the laws of the State of Florida, without regard to its conflict-of-law rules. Any dispute that cannot be worked out directly will be brought in the state or federal courts located in Broward County, Florida, and you and we agree to that venue.",
          "We would much rather sort a problem out over the phone than in a courtroom. Call us first.",
        ],
      },
      {
        id: "changes",
        heading: "9. Changes to these terms",
        paragraphs: [
          "We may update these terms as the business changes. The revision date at the top of this page tells you when it was last touched. Continuing to use the site after an update means the current version applies.",
        ],
      },
    ],
  },

  privacy: {
    title: "Privacy Policy",
    eyebrow: "Legal",
    seoDescription: `How ${BUSINESS.name} collects, uses and protects customer information, and how to ask us to delete it.`,
    lede: "What we collect, why we collect it, who else touches it, and how to tell us to stop. Plain language, no dark patterns.",
    sections: [
      {
        id: "what-we-collect",
        heading: "1. What we collect",
        paragraphs: [
          "We collect what we need to quote work, schedule it, perform it and follow up afterward. In practice that means:",
        ],
        list: [
          "Contact details you give us: name, phone number, email address and the service address where you want the van to meet you",
          "Vehicle information: year, make, model, tire and wheel sizes, and notes about the work performed",
          "Appointment and order history, including what we quoted and what we did",
          "Messages you send through the contact form or leave on the phone",
          "Basic technical information your browser sends automatically, such as device type, browser and general location, used to keep the site working",
        ],
        after: [
          "We do not ask for information we have no use for, and we do not require an account to browse the site or call the shop.",
        ],
      },
      {
        id: "how-we-use-it",
        heading: "2. How we use it",
        paragraphs: [
          "To answer your question, build a quote, route a van to the right address, perform the work, take payment and handle any follow-up or warranty claim. We also use aggregate, non-identifying information to understand which pages people actually use so we can improve the site.",
          "If you ask us to, we may send occasional service reminders — a rotation coming due, for example. You can tell us to stop at any time and we will.",
        ],
      },
      {
        id: "cookies",
        heading: "3. Cookies and site analytics",
        paragraphs: [
          "This site uses a small number of cookies and similar browser storage. Some are strictly necessary — they remember what is in your cart and keep the checkout working. Others, if enabled, help us measure traffic in aggregate so we know which pages are worth improving.",
          "You can block or delete cookies in your browser settings. Strictly necessary cookies cannot be turned off without breaking parts of the site, such as the cart. We do not use cookies to build advertising profiles about you across unrelated websites.",
        ],
      },
      {
        id: "third-parties",
        heading: "4. Who else sees your information",
        paragraphs: [
          "A short list, and only where there is a reason:",
        ],
        list: [
          "Payment processors, to take card payments securely — we do not store full card numbers ourselves",
          "Financing providers, if you choose to apply; your application goes to them under their own privacy policy, not ours",
          "Suppliers and manufacturers, when a special order or a warranty claim requires it",
          "Service providers that host this website and keep it running",
          "Law enforcement or regulators, where we are legally required to respond",
        ],
        after: [
          "We do not sell your personal information, and we do not share it for cross-context behavioral advertising.",
        ],
      },
      {
        id: "retention",
        heading: "5. How long we keep it",
        paragraphs: [
          "Service and transaction records are kept as long as we need them for warranty, accounting and tax purposes. Contact-form messages are kept while the conversation is live and for a reasonable period after. When information is no longer needed for a legitimate business or legal reason, we dispose of it.",
        ],
      },
      {
        id: "choices",
        heading: "6. Your Privacy Choices",
        paragraphs: [
          "You have real choices here, and exercising them will not change how we treat you as a customer.",
        ],
        list: [
          "Ask what we hold. Call us and we will tell you what customer records are associated with your name, phone number or vehicle.",
          "Ask us to correct it. If a phone number, address or vehicle detail is wrong, we will fix it.",
          "Ask us to delete it. Call and request deletion. We will remove what we are not required to keep for warranty, accounting or legal reasons, and we will tell you plainly what we had to retain and why.",
          "Opt out of reminders. Say the word on the phone, or reply to any message asking to stop, and we will take you off the reminder list.",
          "Control cookies. Use your browser settings to block or clear them at any time.",
          "We do not sell personal information or share it for cross-context behavioral advertising, so there is nothing for you to opt out of on that front.",
        ],
        after: [
          `To use any of these, call ${BUSINESS.phone} during business hours or send a message through our contact form. We may need to confirm a couple of details to be sure we are talking to the right person before we change or delete a record.`,
        ],
      },
      {
        id: "security",
        heading: "7. Security",
        paragraphs: [
          "We take sensible steps to protect customer information, and we limit access to the people who need it to do the job. No website or business can promise perfect security, and we are not going to pretend otherwise. If something goes wrong in a way that affects you, we will tell you.",
        ],
      },
      {
        id: "children",
        heading: "8. Children",
        paragraphs: [
          "This site is meant for adults arranging vehicle service. We do not knowingly collect information from children. If you believe a child has given us information, call us and we will remove it.",
        ],
      },
      {
        id: "privacy-changes",
        heading: "9. Changes to this policy",
        paragraphs: [
          "If our practices change, we will update this page and change the revision date at the top. Questions about anything here are welcome — call the shop and ask.",
        ],
      },
    ],
  },

  accessibility: {
    title: "Accessibility Statement",
    eyebrow: "Legal",
    seoDescription: `${BUSINESS.name} is working toward WCAG 2.1 Level AA on this website. Here is our commitment and how to report a barrier.`,
    lede: "We want this site to work for every customer, including those using a screen reader, a keyboard, magnification or voice control.",
    sections: [
      {
        id: "commitment",
        heading: "1. Our commitment",
        paragraphs: [
          "We are working to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA. That standard is our target for this site, and we treat it as a continuing obligation rather than a box to tick once.",
          "Accessibility work is never truly finished. As we add pages, photography and features, we check them against the same standard.",
        ],
      },
      {
        id: "what-we-do",
        heading: "2. What we have built in",
        paragraphs: [
          "Practical measures applied across the site include:",
        ],
        list: [
          "Semantic headings and landmarks so screen readers can navigate the structure",
          "Keyboard access to every interactive control, with a visible focus indicator",
          "Labels tied to every form field, and error messages announced with the field they belong to",
          "Color combinations chosen for contrast, with color never used as the only way to convey meaning",
          "Text alternatives for meaningful images, and decorative graphics hidden from assistive technology",
          "Respect for the reduced-motion setting in your operating system",
          "Layouts that reflow on small screens and hold up when text is enlarged",
        ],
      },
      {
        id: "limitations",
        heading: "3. Known limitations",
        paragraphs: [
          "Being honest about the gaps is part of the job. Content supplied by third parties — mapping, payment and financing tools — is not fully under our control, and its accessibility depends on those providers. Media added over time may briefly appear before captions or full descriptions are in place.",
          "If you hit something that does not work, that is information we want. It is usually the fastest route to a fix.",
        ],
      },
      {
        id: "report",
        heading: "4. Report a barrier",
        paragraphs: [
          `If any part of this site blocks you, call us at ${BUSINESS.phone} during business hours and tell us what happened. It helps if you can mention the page, the browser or assistive technology you were using, and what you were trying to do — but call even if you cannot, and we will work it out together.`,
          "We aim to respond to accessibility reports promptly, and to tell you what we are doing about it rather than leave you guessing. If a fix will take time, we will find a way to get you what you needed in the meantime.",
        ],
      },
      {
        id: "in-person",
        heading: "5. Service, not just the website",
        paragraphs: [
          `Accessibility is not only a web issue. Our whole model is bringing service to where you already are — if getting to the ${BUSINESS.address.city} shop is difficult for any reason, the van can come to your home, your office or wherever the vehicle is parked. Call us and say what you need; we will work around it.`,
        ],
      },
    ],
  },
};

export default function LegalPage({ doc = "terms" }) {
  const content = DOCS[doc] ?? DOCS.terms;

  return (
    <>
      <Seo title={content.title} description={content.seoDescription} />

      <PageHero
        eyebrow={content.eyebrow}
        title={content.title}
        lede={content.lede}
      />

      <Breadcrumbs trail={[{ label: content.title }]} />

      <Section className="bg-bone">
        <div className="grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-14">
          {/* ---------- In-page contents ---------- */}
          <nav
            aria-label={`${content.title} contents`}
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <h2 className="mb-3 font-display text-xs uppercase tracking-[0.2em] text-smoke">
              On this page
            </h2>
            <ul className="space-y-2">
              {content.sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-sm text-smoke transition-colors hover:text-drop"
                  >
                    {s.heading}
                  </a>
                </li>
              ))}
            </ul>

            <div className="card mt-6 p-5">
              <ShieldCheck size={20} aria-hidden className="mb-3 text-drop" />
              <p className="text-xs leading-relaxed text-smoke">
                Questions about any of this? Call the shop — a person will
                answer and explain it.
              </p>
              <a href={BUSINESS.phoneHref} className="btn-outline btn-sm mt-4">
                <Phone size={15} aria-hidden />
                {BUSINESS.phone}
              </a>
            </div>
          </nav>

          {/* ---------- Document body ---------- */}
          <article className="max-w-3xl">
            <p className="mb-6 font-display text-xs uppercase tracking-[0.2em] text-smoke">
              Last updated: {LAST_UPDATED}
            </p>

            <div className="card mb-10 border-l-4 border-l-drop p-6">
              <p className="text-sm leading-relaxed text-smoke">
                This document is written to be understood, not to hide anything
                in the fine print. It is general information about how we
                operate — it is not legal advice, and it does not replace any
                written agreement or invoice we give you. If something here is
                unclear or does not seem to match your situation, please contact
                the shop at{" "}
                <a href={BUSINESS.phoneHref} className="text-drop underline">
                  {BUSINESS.phone}
                </a>{" "}
                or through our{" "}
                <Link to="/contact" className="text-drop underline">
                  contact form
                </Link>{" "}
                and ask. We would rather talk it through.
              </p>
            </div>

            <div className="space-y-10">
              {content.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="h3 mb-3">{section.heading}</h2>

                  {section.paragraphs?.map((p) => (
                    <p key={p} className="mb-3 text-sm leading-relaxed text-smoke">
                      {p}
                    </p>
                  ))}

                  {section.list && (
                    <ul className="mb-3 space-y-2.5">
                      {section.list.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2.5 text-sm leading-relaxed text-smoke"
                        >
                          <span
                            aria-hidden
                            className="mt-2 h-1.5 w-1.5 shrink-0 bg-drop"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.after?.map((p) => (
                    <p key={p} className="mb-3 text-sm leading-relaxed text-smoke">
                      {p}
                    </p>
                  ))}
                </section>
              ))}
            </div>

            <div className="mt-12 border-t border-ink/10 pt-8">
              <h2 className="h3 mb-3">Contact us about this document</h2>
              <address className="not-italic text-sm leading-relaxed text-smoke">
                {BUSINESS.name}
                <br />
                {BUSINESS.address.street}
                <br />
                {BUSINESS.address.city}, {BUSINESS.address.state}{" "}
                {BUSINESS.address.zip}
                <br />
                <a
                  href={BUSINESS.phoneHref}
                  className="mt-2 inline-block font-display text-lg uppercase tracking-wide text-ink hover:text-drop"
                >
                  {BUSINESS.phone}
                </a>
              </address>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/terms" className="btn-outline btn-sm">
                  Terms of Use
                </Link>
                <Link to="/privacy" className="btn-outline btn-sm">
                  Privacy Policy
                </Link>
                <Link to="/accessibility" className="btn-outline btn-sm">
                  Accessibility
                </Link>
              </div>
            </div>
          </article>
        </div>
      </Section>
    </>
  );
}
