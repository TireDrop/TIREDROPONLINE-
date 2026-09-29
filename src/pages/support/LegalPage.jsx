// NOTE FOR THE BUILD TEAM: this is plain-language boilerplate written for a
// national online tire and wheel retailer that drop-ships from distributors.
// It has not been reviewed by an attorney, and several specifics are written
// as "the window shown at checkout" or "as stated on your order confirmation"
// precisely because they must not be invented. Before launch, have counsel
// review the whole document and pin down at least:
//   - the legal entity name and state of formation behind TireDrop
//     (`BUSINESS.legalName`; the entity line below renders once it is set)
//   - the return window in days, who pays return shipping, and any restocking
//     fee, then state the numbers here and on the checkout page
//   - the deadline for reporting shipping damage, shortages or wrong items
//   - when title and risk of loss pass on a drop-shipped order
//   - warranty administration: which claims the manufacturer handles directly
//   - whether an arbitration or class-action waiver clause is wanted
//   - state-specific privacy rights language (CA, VA, CO and others)
//
// TWO RULES FOR EDITING THIS FILE:
//   1. The privacy policy must describe what the code actually does, not what
//      a tire site usually does. As built, the only cookies are Google
//      Analytics' first-party measurement cookies (tag in index.html, Google
//      signals and ad personalization off). It loads no advertising or social
//      tracking pixels and captures no email addresses.
//      The only server code is the site's own API (`api/`), which asks ATD
//      for tire data and, for paid orders, creates the order in the shop's
//      Shopify store. The only browser storage is localStorage for the cart
//      and the comparison tray. Section 3 says exactly that. Card payments
//      are taken on Shopify's hosted checkout page, so the policy names that
//      without claiming the site takes no payment. If the analytics setup changes,
//      or an email platform or any other third-party script is added, sections
//      3, 4 and 6 have to change in the same commit.
//   2. Nothing here may point at a document that does not exist. Section 9
//      used to say the return window was "stated at checkout" — it was not
//      stated anywhere. Do not reintroduce a forward reference until the
//      number it points at is really published.

import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Phone, ShieldCheck } from "lucide-react";
import { BUSINESS } from "../../data/business.js";
import {
  Breadcrumbs,
  PageHero,
  Section,
  Seo,
} from "../../components/ui/index.jsx";

const LAST_UPDATED = "September 29, 2026";

// The four questions a customer — or anyone reviewing this site — comes to the
// terms looking for. They are sections of this document rather than separate
// pages, so surface them at the top instead of making people read the contents
// list to find out that a returns policy exists at all.
const KEY_POLICIES = [
  {
    id: "shipping",
    title: "Shipping policy",
    copy: "Where we ship, what the estimate means, and what happens when a set arrives in two deliveries.",
  },
  {
    id: "returns",
    title: "Returns & refunds",
    copy: "What can go back, what cannot, who pays the freight, and how a refund reaches you.",
  },
  {
    id: "damaged",
    title: "Damaged or wrong items",
    copy: "What to do the day it lands, and why the first phone call matters more than the second.",
  },
  {
    id: "warranties",
    title: "Warranties",
    copy: "What we stand behind ourselves, and what belongs to the tire manufacturer.",
  },
];

const DOCS = {
  terms: {
    title: "Terms of Use",
    eyebrow: "Legal",
    seoDescription: `The terms that apply to buying tires and wheels from ${BUSINESS.name} — ordering, pricing, shipping, returns, installation and Florida governing law.`,
    lede: "The ground rules for buying from this site and for the work we do on your vehicle. Written to be read, not to be skimmed past.",
    sections: [
      {
        id: "who-we-are",
        heading: "1. Who you are buying from",
        paragraphs: [
          `${BUSINESS.name} is the online tire and wheel store of ${BUSINESS.parent}, the tire shop at ${BUSINESS.shop.full}. Orders placed on this site ship direct from a distributor warehouse — we do not hold stock of our own.`,
          `We sell to customers throughout ${BUSINESS.shipping.area}. Installation, whether at the shop or from one of our mobile vans, is available only in South Florida. Those are two different things, and this document treats them as such.`,
          `Questions about anything here: call ${BUSINESS.phone} during business hours, email ${BUSINESS.email}, or use the contact form. The phone is the channel that reaches a person fastest.`,
        ],
      },
      {
        id: "using-the-site",
        heading: "2. Using this site",
        paragraphs: [
          "By browsing the site, adding to a cart, placing an order or booking an appointment, you are agreeing to the terms on this page.",
          "Please use the site for its intended purpose: researching tires and wheels, buying them, and arranging work on your vehicle. Do not attempt to interfere with the site, scrape it at scale, resell access to it, or submit information that is not yours to submit.",
          "You must be at least 18 years old and able to enter a contract to place an order.",
        ],
      },
      {
        id: "orders",
        heading: "3. Placing an order, and when it is accepted",
        paragraphs: [
          "Adding something to the cart does not reserve it. When you complete checkout you are making an offer to buy, and we accept that offer when the order is confirmed as placed with the distributor. Until then, no contract exists between us.",
          "We may decline or cancel an order — before or after payment — if the item turns out to be unavailable, if a price or specification was listed in error, if we cannot verify the payment or the shipping address, or if the order looks fraudulent. If we do, you get a full refund of anything you have paid, and we will tell you why.",
          "Payment: where online payment is offered, checkout hands you to Shopify's secure checkout page for your order. Your card details go to Shopify, not to this site. Where online payment is not offered, checkout sends an order request, and nothing is charged until we have confirmed the order with you.",
          "Every order gets an order number. Quote it when you call; it is the fastest way for us to find you.",
        ],
      },
      {
        id: "pricing",
        heading: "4. Prices, product information and availability",
        paragraphs: [
          "We try hard to keep prices, specifications, fitment details and availability accurate. Even so, tire pricing moves, distributor stock turns over daily, and mistakes happen. Nothing on this site is a guaranteed offer to sell at a listed price.",
          "If a price or availability turns out to be wrong after you order, we will contact you, explain the difference, and give you the choice to proceed, pick an alternative or cancel for a full refund. We will not quietly substitute a different brand, size, load index or speed rating without telling you first.",
          "Prices are in US dollars and do not include taxes, which are calculated at checkout where they apply. Images are representative: tread patterns, sidewall markings and wheel finishes can vary between production runs.",
        ],
      },
      {
        id: "fitment",
        heading: "5. Fitment is a shared job",
        paragraphs: [
          "You are responsible for ordering the correct size, load index and speed rating for your vehicle. The numbers on the placard inside your driver's door are the reference, not what happens to be on the car now — a previous owner or shop may have fitted something else.",
          "We will help. Call us before you order and we will read a fitment through with you, and we would rather talk you out of the wrong tire than process the return afterward. That help is advice given in good faith; it does not shift responsibility for the final choice, or replace your owner's manual or the vehicle manufacturer's specifications.",
          "Wheel fitment — diameter, width, offset, bolt pattern, center bore and brake clearance — is unforgiving. Tell us about lift kits, big brake kits, spacers or anything non-standard before you buy.",
        ],
      },
      {
        id: "shipping",
        heading: "6. Shipping and delivery",
        paragraphs: [
          `We ship free to street addresses in ${BUSINESS.shipping.area}, with no order minimum. We do not currently ship to Alaska, Hawaii, US territories or international destinations.`,
          "The shipping method and the estimated delivery window are shown at checkout and on your order confirmation. Estimates are estimates: they come from the distributor and the carrier, and weather, freight backlogs and delivery exceptions can move them. We do not promise a delivery date on this page, and neither should anyone else.",
          "Orders can ship from more than one distributor location, so it is normal for a set of four to arrive in more than one delivery. If part of your order lands and the rest has not, call us before you worry.",
          "Someone should be available to receive the shipment. If a delivery is refused or goes unclaimed and comes back to the distributor, we will refund the order less any shipping and return costs actually charged to us.",
        ],
      },
      {
        id: "ship-to-store",
        heading: "7. Free ship-to-store and pickup",
        paragraphs: [
          `You can send an order to the shop at ${BUSINESS.shop.full} instead of to your own address, at no shipping cost to you. We sign for it, check what arrived against what you bought, and call you to arrange the install or the pickup.`,
          "Please wait for that call before driving over — an order is not ready until we have physically checked it in. Bring your order number and photo ID when you collect.",
          "We will hold a ship-to-store order for a reasonable period after we tell you it has arrived. If it goes uncollected and unarranged well beyond that, call us; we will work something out rather than let it sit indefinitely, but we cannot store orders forever.",
        ],
      },
      {
        id: "appointments",
        heading: "8. Installation appointments",
        paragraphs: [
          "Installation is available at the Sunrise shop, and by mobile van within our South Florida install area. Appointment times are scheduled windows, not guarantees to the minute — traffic, weather and the job in front of yours all move the clock. If we are running behind, we would rather call you than leave you waiting.",
          "Mobile service needs a safe, legal, reasonably level place to work beside the vehicle, with room to jack it up and run equipment. If the location is not safe — soft ground, a steep slope, a spot where working would risk you, us or the vehicle — the technician may decline to work there, and we will help you find an alternative, including bringing the vehicle to the shop.",
          `Plans change; we understand that. Give us as much notice as you can if you need to cancel or move an appointment — call ${BUSINESS.phone} during business hours. Repeated no-shows on mobile calls may mean we ask for confirmation before dispatching a van in future, since a wasted trip is a slot another customer needed.`,
          "We will tell you before the work starts if a vehicle needs something beyond what you booked — a seized lug, a TPMS sensor that has died, a wheel that will not come clean. Nothing extra happens without your approval.",
        ],
      },
      {
        id: "returns",
        heading: "9. Returns, cancellations and refunds",
        paragraphs: [
          "If you want to cancel, call as early as you can. Once an order has been placed with the distributor or has shipped, it can no longer simply be stopped, and it has to be handled as a return.",
          "To be returnable, tires and wheels must be unused and uninstalled, in original condition, with any labels, chalk marks and packaging intact. Once a tire has been mounted on a wheel it is not returnable, even if it was never driven on — that is the distributor's rule, not one we invented, and it is why the fitment conversation matters.",
        ],
        list: [
          "Call us before you buy if the return window or any restocking fee matters to your decision, and we will tell you what applies to that specific item. Both are set by the distributor the item ships from, and we will confirm them on your order.",
          "Return shipping on a change-of-mind return is generally the customer's cost; if we sent the wrong thing, it is ours.",
          "Special orders and custom wheel or tire packages may not be returnable once placed. We will say so before we order.",
          "Refunds go back to the original payment method. If you financed the order, the refund is credited against your balance with the lender and may take a billing cycle to appear.",
          "Do not send anything back before you speak to us. Returns need to be authorized and routed to the right place, or they can be refused on arrival.",
        ],
      },
      {
        id: "damaged",
        heading: "10. Damaged, incorrect or missing items",
        paragraphs: [
          "Inspect what arrives. If the packaging is badly damaged, note it with the driver if you can, and either way photograph it before you unwrap anything.",
          "Call us the day it arrives, or as close to it as you can manage, if something is damaged, if the wrong item was sent, or if part of the order is missing. Carriers and distributors both impose short deadlines on these claims — we will tell you the exact deadline that applies to your shipment when you call — and a late report can cost you the claim entirely.",
          "When it is our error or a shipping problem, we sort it out: a replacement sent, or a refund, at no extra cost to you. Keep the packaging until it is resolved — the claim may require it.",
        ],
      },
      {
        id: "warranties",
        heading: "11. Workmanship, tires and warranties",
        paragraphs: [
          "We stand behind the work our technicians perform. If something we installed was not done right, tell us promptly and give us the chance to inspect it and put it right.",
          "Tires, wheels and parts carry whatever warranty the manufacturer provides. Those warranties come from the manufacturer, not from us, and their terms, exclusions and claim processes are theirs. Mileage warranties in particular usually require documented rotations and correct inflation. We will help you file a claim and will tell you honestly what we think it is worth pursuing.",
          "Normal wear, road hazard damage, curb and pothole impacts, improper inflation, alignment problems we did not cause, racing or off-road use, and damage from continuing to drive on a failing tire are not workmanship issues. Beyond any express warranty given to you in writing, products and services are provided as-is to the extent Florida law permits.",
        ],
      },
      {
        id: "liability",
        heading: "12. Limitation of liability",
        paragraphs: [
          "To the fullest extent allowed by Florida law, our liability arising out of the use of this website, or out of any single order or service transaction, is limited to the amount you paid us for the product or service at issue.",
          "We are not liable for indirect or consequential losses — lost income, missed appointments, rental costs, towing or downtime — arising from a delivery delay, a scheduling change or a site outage. Nothing in these terms limits any liability that cannot lawfully be limited, including for personal injury caused by negligence.",
        ],
      },
      {
        id: "third-party",
        heading: "13. Links and third-party services",
        paragraphs: [
          "This site relies on other companies — distributors, carriers, manufacturers, mapping, payment processing and financing. We do not control their sites or their systems, and their terms and privacy practices are their own. Read them when it matters to you.",
        ],
      },
      {
        id: "governing-law",
        heading: "14. Governing law",
        paragraphs: [
          "These terms are governed by the laws of the State of Florida, without regard to its conflict-of-law rules, and without regard to where in the country you happen to be when you order.",
          "Any dispute that cannot be worked out directly will be brought in the state or federal courts located in Broward County, Florida, and you and we agree to that venue.",
          "We would much rather sort a problem out over the phone than in a courtroom. Call us first.",
        ],
      },
      {
        id: "changes",
        heading: "15. Changes to these terms",
        paragraphs: [
          "We may update these terms as the business changes. The revision date at the top of this page tells you when it was last touched, and the terms that apply to your order are the ones published when you placed it.",
        ],
      },
    ],
  },

  privacy: {
    title: "Privacy Policy",
    eyebrow: "Legal",
    seoDescription: `How ${BUSINESS.name} collects, uses and protects customer information when you order tires online or have them installed, and how to ask us to delete it.`,
    lede: "What we collect, why we collect it, who else touches it, and how to tell us to stop. Plain language, no dark patterns.",
    sections: [
      {
        id: "what-we-collect",
        heading: "1. What we collect",
        paragraphs: [
          "We collect what we need to sell you tires, get them to you, fit them if you want that, and follow up afterward. In practice that means:",
        ],
        list: [
          "Contact details you give us: name, phone number and email address",
          "Addresses: the shipping address the order goes to — or the shop, if you chose ship-to-store",
          "Vehicle information: year, make, model, tire and wheel sizes, and notes about any work performed",
          "Order history: what you bought, what it cost, what we quoted and what we did",
          `Messages you send through the contact form or to ${BUSINESS.email}, or leave on the phone`,
        ],
        after: [
          "We do not store card numbers. Card payments are taken on Shopify's checkout page: Shopify receives the card details directly and handles them under its own security obligations, and we see only that a payment went through.",
          "We do not ask for information we have no use for. You do not need an account to browse the site, and there is no newsletter sign-up anywhere on it.",
        ],
      },
      {
        id: "how-we-use-it",
        heading: "2. How we use it",
        paragraphs: [
          "To answer your question, price an order, place it with the distributor, get it shipped to the right address, take payment, book an install, and handle any return, claim or warranty question afterward. We also look at aggregate website statistics — which pages get visited, roughly where visitors come from, what device they use — to understand what is working and fix what is not. That is the whole list. We do not profile you, score you, or build an audience out of you.",
          "If you ask us to, we may send occasional service reminders — a rotation coming due, for example. You can tell us to stop at any time and we will.",
        ],
      },
      {
        id: "cookies",
        heading: "3. Cookies, tracking and browser storage",
        paragraphs: [
          "This website uses Google Analytics to measure how the site is used — pages viewed, how visitors arrived, general location at the city or region level, device and browser type. Google Analytics sets its own first-party cookies (named _ga and _ga_ followed by an ID) to tell one visit from the next. We have switched off Google signals and ad personalization, so this measurement is not used to build advertising profiles or to show you ads. We see the results only as aggregate reports, not as a record of what any named person did.",
          "The site loads no advertising or social tracking pixels. You are welcome to check both statements in your browser's developer tools.",
          "Separately, the site uses local storage in your own browser for two things:",
        ],
        list: [
          "Your cart — so the tires you picked are still there if you close the tab and come back",
          "The comparison tray — which products you lined up side by side",
        ],
        after: [
          "Both stay on your device. They are not sent to us, they contain no name, address or payment detail, and nobody else can read them. Clearing your browsing data deletes them; the only thing you lose is your cart.",
          "You can block or delete the Google Analytics cookies in your browser settings, or install Google's opt-out add-on at tools.google.com/dlpage/gaoptout; the site works the same either way. If we add any other third-party script, this section gets rewritten before that ships, not after.",
        ],
      },
      {
        id: "third-parties",
        heading: "4. Who else sees your information",
        paragraphs: ["A short list, and only where there is a reason:"],
        list: [
          "Shopify, the platform the shop's orders and online payments run through, which receives your order, contact details and address so the shop can process it, and processes card payments on its checkout page — it receives the card details, not us",
          "ATD (American Tire Distributors), our distributor, which receives the shipping address and order details because it packs and dispatches your tires",
          "Shipping carriers, for delivery and tracking",
          "Financing providers, if you choose to apply; your application goes to them under their own privacy policy, not ours",
          "Manufacturers, when a warranty claim requires it",
          "The company that hosts this website, which keeps ordinary server logs of requests made to it",
          "Google, which provides Google Analytics and receives information about how the site is used (see section 3), processed under Google's own privacy policy",
          "Law enforcement or regulators, where we are legally required to respond",
        ],
        after: [
          "That is the complete list. No advertising network and no data broker. We do not sell your personal information, and we do not share it for cross-context behavioral advertising — Google Analytics is set up with Google signals and ad personalization switched off, so the site's measurement data is not used for advertising.",
        ],
      },
      {
        id: "retention",
        heading: "5. How long we keep it",
        paragraphs: [
          "Order, service and transaction records are kept as long as we need them for warranty, accounting and tax purposes. Contact-form messages are kept while the conversation is live and for a reasonable period after. When information is no longer needed for a legitimate business or legal reason, we dispose of it.",
        ],
      },
      {
        id: "choices",
        heading: "6. Your Privacy Choices",
        paragraphs: [
          "You have real choices here, and exercising them will not change how we treat you as a customer. Depending on the state you live in, some of these may also be rights you can enforce — we apply them to everyone rather than sorting customers by ZIP code.",
        ],
        list: [
          "Ask what we hold. Call us and we will tell you what customer records are associated with your name, phone number, order number or vehicle.",
          "Ask us to correct it. If a phone number, address or vehicle detail is wrong, we will fix it.",
          "Ask us to delete it. Call and request deletion. We will remove what we are not required to keep for warranty, accounting or legal reasons, and we will tell you plainly what we had to retain and why.",
          "Opt out of reminders. Say the word on the phone, or reply to any message asking to stop, and we will take you off the reminder list.",
          "Clear what the site stored on your device. Your cart and comparison tray live in your own browser. Clearing your browsing data removes them; nothing of yours is left behind on our side.",
          "Opt out of analytics. Block or clear the Google Analytics cookies in your browser, or use Google's opt-out add-on (tools.google.com/dlpage/gaoptout). We do not sell personal information or share it for cross-context behavioral advertising.",
        ],
        after: [
          `To use any of these, call ${BUSINESS.phone} during business hours, email ${BUSINESS.email}, or send a message through our contact form. We may need to confirm a couple of details — an order number, say — to be sure we are talking to the right person before we change or delete a record.`,
        ],
      },
      {
        id: "security",
        heading: "7. Security",
        paragraphs: [
          "We take sensible steps to protect customer information, and we limit access to the people who need it to do the job. Card details are never stored by us — they are handled by our payment processor. No website or business can promise perfect security, and we are not going to pretend otherwise. If something goes wrong in a way that affects you, we will tell you.",
        ],
      },
      {
        id: "children",
        heading: "8. Children",
        paragraphs: [
          "This site is meant for adults buying tires and arranging vehicle service. We do not knowingly collect information from children. If you believe a child has given us information, call us and we will remove it.",
        ],
      },
      {
        id: "privacy-changes",
        heading: "9. Changes to this policy",
        paragraphs: [
          "If our practices change, we will update this page and change the revision date at the top. Questions about anything here are welcome — call and ask.",
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
          "This matters more, not less, for an online store: if the only way to buy a set of tires from us is through this website, the website has to work for everybody. As we add pages, product photography and features, we check them against the same standard.",
        ],
      },
      {
        id: "what-we-do",
        heading: "2. What we have built in",
        paragraphs: ["Practical measures applied across the site include:"],
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
          "Being honest about the gaps is part of the job. Content supplied by third parties — mapping, payment, carrier tracking and financing tools — is not fully under our control, and its accessibility depends on those providers. Product data comes from distributor catalogs, so a specification table may occasionally read awkwardly with a screen reader. Media added over time may briefly appear before captions or full descriptions are in place.",
          "If you hit something that does not work, that is information we want. It is usually the fastest route to a fix.",
        ],
      },
      {
        id: "report",
        heading: "4. Report a barrier",
        paragraphs: [
          `If any part of this site blocks you, call ${BUSINESS.phone} during business hours and tell us what happened. It helps if you can mention the page, the browser or assistive technology you were using, and what you were trying to do — but call even if you cannot, and we will work it out together.`,
          "We aim to respond to accessibility reports promptly, and to tell you what we are doing about it rather than leave you guessing. If a fix will take time, we will find a way to get you what you needed in the meantime.",
        ],
      },
      {
        id: "another-way",
        heading: "5. You can always just call",
        paragraphs: [
          `If the website is difficult for you to use for any reason, the phone is a full alternative, not a consolation prize. Call ${BUSINESS.phone} and we will look up fitment, read you the options, take the order and arrange the shipping — the same order you would have placed online, placed by a person instead.`,
          `Locally, accessibility is not only a web issue either. If getting to the ${BUSINESS.shop.city} shop is difficult, the mobile van covers our South Florida install area and can come to your home or workplace. Call and say what you need; we will work around it.`,
        ],
      },
    ],
  },
};

export default function LegalPage({ doc = "terms" }) {
  const content = DOCS[doc] ?? DOCS.terms;
  const { hash } = useLocation();

  // The footer links straight at /terms#returns and /terms#shipping. The app's
  // ScrollToTop fires on every navigation and would otherwise dump the reader
  // at the top of a 15-section document, so move to the requested section once
  // the page has painted.
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.replace("#", ""));
    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "instant", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hash, doc]);

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
            <h2 className="mb-3 font-display text-sm font-bold text-smoke">
              On this page
            </h2>
            <ul className="space-y-2">
              {content.sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex min-h-[32px] items-center text-sm text-smoke transition-colors hover:text-drop"
                  >
                    {s.heading}
                  </a>
                </li>
              ))}
            </ul>

            <div className="card mt-6 p-5">
              <ShieldCheck size={20} aria-hidden className="mb-3 text-drop" />
              <p className="text-xs leading-relaxed text-smoke">
                Questions about any of this? Call — a person will answer and
                explain it.
              </p>
              <a href={BUSINESS.phoneHref} className="btn-outline btn-sm mt-4">
                <Phone size={15} aria-hidden />
                {BUSINESS.phone}
              </a>
            </div>
          </nav>

          {/* ---------- Document body ---------- */}
          <article className="max-w-[68ch]">
            <p className="label mb-6">Last updated: {LAST_UPDATED}</p>

            <div className="card mb-10 border-l-4 border-l-drop p-6">
              <p className="text-[15px] leading-[1.75] text-smoke">
                This document is written to be understood, not to hide anything
                in the fine print. It is general information about how{" "}
                {BUSINESS.name} operates — it is not legal advice, and it does
                not replace the terms shown at checkout, your order
                confirmation, or any written agreement or invoice we give you.
                Where those are more specific, they govern. If something here is
                unclear or does not seem to match your situation, call{" "}
                <a href={BUSINESS.phoneHref} className="text-drop underline">
                  {BUSINESS.phone}
                </a>{" "}
                or use our{" "}
                <Link to="/contact" className="text-drop underline">
                  contact form
                </Link>{" "}
                and ask. We would rather talk it through.
              </p>
            </div>

            {doc === "terms" && (
              <nav
                aria-label="Key policies"
                className="mb-10 rounded-sm border border-ink/10 bg-white p-6"
              >
                <h2 className="h3 mb-1">The four people ask for most</h2>
                <p className="mb-5 text-sm text-smoke">
                  Shipping, returns, damaged deliveries and warranties are
                  sections of these terms. Jump straight to one.
                </p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {KEY_POLICIES.map((policy) => (
                    <li key={policy.id}>
                      <a
                        href={`#${policy.id}`}
                        className="flex h-full flex-col gap-1 rounded-sm border border-ink/10 p-4 transition-colors hover:border-drop"
                      >
                        <span className="font-display text-base text-ink">
                          {policy.title}
                        </span>
                        <span className="text-[13px] leading-relaxed text-smoke">
                          {policy.copy}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            <div className="space-y-12">
              {content.sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24"
                >
                  <h2 className="h3 mb-4">{section.heading}</h2>

                  {section.paragraphs?.map((p) => (
                    <p
                      key={p}
                      className="mb-4 text-[15px] leading-[1.75] text-smoke"
                    >
                      {p}
                    </p>
                  ))}

                  {section.list && (
                    <ul className="mb-4 space-y-3">
                      {section.list.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2.5 text-[15px] leading-[1.75] text-smoke"
                        >
                          <span
                            aria-hidden
                            className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-drop"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.after?.map((p) => (
                    <p
                      key={p}
                      className="mb-4 text-[15px] leading-[1.75] text-smoke"
                    >
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
                {BUSINESS.poweredBy}
                <br />
                {/* Renders only once the registered entity is confirmed in
                    data/business.js. Nothing is guessed here. */}
                {BUSINESS.legalName && (
                  <>
                    A trade name of {BUSINESS.legalName}
                    {BUSINESS.entityState
                      ? `, a ${BUSINESS.entityState} company`
                      : ""}
                    <br />
                  </>
                )}
                {BUSINESS.shop.street}
                <br />
                {BUSINESS.shop.city}, {BUSINESS.shop.state} {BUSINESS.shop.zip}
                <br />
                <a
                  href={BUSINESS.phoneHref}
                  className="mt-2 inline-block font-display text-lg text-ink hover:text-drop"
                >
                  {BUSINESS.phone}
                </a>
                <br />
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="inline-block break-all font-display text-lg text-ink hover:text-drop"
                >
                  {BUSINESS.email}
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
