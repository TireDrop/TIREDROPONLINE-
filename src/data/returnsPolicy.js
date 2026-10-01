// Copy for the Returns, Warranty & Road Hazard page (/returns).
//
// RULE: every sentence here restates something the site already says. The
// source is noted beside each one ("Terms §9" is the returns section of
// src/pages/support/LegalPage.jsx). Nothing is invented: no return window, no
// restocking fee, no road-hazard plan, no price, no refund or arrival date.
//
// Where no policy has been confirmed, the copy carries a visible marker in
// the form {TODO_JUSTIN: what is missing}. The page renders each one as a
// highlighted chip. Answering one means replacing the marker (and usually the
// sentence around it) with the confirmed wording, and changing Terms §9–11 in
// the same commit so the two never disagree. When none are left, flip
// RETURNS_PAGE_LIVE in src/data/returnsFlag.js. The build refuses to put a
// page that still has a marker into the sitemap (scripts/prerender.mjs).
//
// House rules apply: no "safe", "fine" or "OK", no discounts, no invented
// numbers, no arrival or refund dates (src/data/returnsPolicy.test.mjs).

import { BUSINESS } from "./business.js";

export { RETURNS_PATH, RETURNS_PAGE_LIVE } from "./returnsFlag.js";

/** Matches one {TODO_JUSTIN: ...} marker. */
export const TODO_PATTERN = /\{TODO_JUSTIN:[^}]*\}/g;

const todo = (what) => `{TODO_JUSTIN: ${what}}`;

const PHONE = BUSINESS.phone;
const EMAIL = BUSINESS.email;

/**
 * The questions only Justin can answer. Each one is a marker on the page.
 * Kept here so the page, the report and docs/business/parent-business-facts.md
 * ask the same thing.
 */
export const QUESTIONS_FOR_JUSTIN = [
  "Return window: how many days does a customer have to start a change-of-mind return, and does the clock start at delivery or at the order date? Is it the same for tires and wheels, and for every distributor?",
  "Return shipping: on a change-of-mind return, who pays the return freight? (Terms §9 says it is \"generally the customer's cost\". Is that the rule, and is there a fixed charge or the actual freight?)",
  "Restocking fee: yes or no? If yes, how much (a percentage or a flat amount), and on which items?",
  "Mounted tires: confirm that a tire mounted on a wheel cannot be returned even if never driven on (Terms §9 says so and calls it the distributor's rule). Does the same apply when our own shop or van mounted it, and what about wheels that were test-fitted?",
  "Road hazard: is there a road-hazard plan, from us or through a partner? If yes, what does it cost, how long does it last, and what does it cover (repair, replacement, prorated)? If no, should the page keep saying \"Ask us about road hazard protection\"?",
  "Workmanship warranty on installs: Terms §11 says \"we stand behind the work our technicians perform\". For how long (days, miles), and does it cover mobile installs the same as shop installs?",
  "Refunds: confirm the method (original payment method, per Terms §9) and at what point a refund is issued (when the return is picked up, when the distributor receives it, after inspection). The page will still not promise a date.",
];

/** The four answers at the top of the page. */
export const SUMMARY = [
  {
    id: "returns",
    title: "Starting a return",
    copy: `Call ${PHONE} or email ${EMAIL} with your order number before you send anything back.`,
  },
  {
    id: "mounted",
    title: "Mounted tires",
    copy: "Once a tire has been mounted on a wheel, it usually can't go back. Check the sidewall against your order first.",
  },
  {
    id: "warranty",
    title: "Manufacturer warranty",
    copy: "Each tire maker sets its own mileage warranty. When we know it, it's on the product page.",
  },
  {
    id: "road-hazard",
    title: "Road hazard",
    copy: `Ask us about road hazard protection: ${PHONE}.`,
  },
];

/**
 * The page body. Each section: id, heading, then any of paragraphs, list
 * (bullets) and after (paragraphs below the list).
 */
export const SECTIONS = [
  {
    id: "returns",
    heading: "Returning tires or wheels we shipped to you",
    paragraphs: [
      // Terms §9 (authorization); Terms §3 (quote the order number).
      `Start every return with us, before anything ships back. Call ${PHONE} during business hours or email ${EMAIL}, and give us your order number. Returns need to be authorized and routed to the right place, or they can be refused on arrival.`,
      // Terms §9.
      "To be returnable, tires and wheels must be unused and uninstalled, in original condition, with any labels, chalk marks and packaging intact.",
    ],
    list: [
      // No confirmed window. Terms §9 says to call before buying if it matters.
      `Return window: ${todo("return window in days, and whether it counts from delivery or from the order date")}. If the return window matters to your decision, call before you buy and we will tell you what applies to that item.`,
      // No confirmed fee.
      `Restocking fee: ${todo("restocking fee, yes or no, and the amount if yes")}.`,
      // Terms §9, hedged there with "generally"; confirm before it is a rule.
      `Return shipping: on a change-of-mind return, return shipping is generally the customer's cost; if we sent the wrong thing, it is ours. ${todo("confirm who pays return shipping on a change-of-mind return")}`,
      // Terms §9.
      "Special orders and custom wheel or tire packages may not be returnable once placed. We will say so before we order.",
    ],
    after: [
      // Terms §9.
      "Want to cancel instead? Call as early as you can. Once an order has been placed with the distributor or has shipped, it can no longer simply be stopped, and it has to be handled as a return.",
    ],
  },
  {
    id: "mounted",
    heading: "Mounted or driven-on tires",
    paragraphs: [
      // Common industry practice, and Terms §9 / the shipping FAQ.
      `Across the tire trade, a tire that has been mounted on a wheel, or driven on, usually can't be returned. Our terms say the same: once a tire has been mounted on a wheel it is not returnable, even if it was never driven on. ${todo("confirm the mounted-tire policy, including tires mounted by our own shop or van")}`,
      // Shipping FAQ; checkout (fitment call before anything ships).
      "That is why we confirm fitment with you on the phone before anything ships, and why it pays to check the size, load index and speed rating on the sidewall against your order before anything goes on a wheel.",
    ],
  },
  {
    id: "damaged",
    heading: "Damaged, wrong or missing items",
    paragraphs: [
      // Terms §10; shipping page "It arrived damaged".
      `Photograph the damage and the shipping label together, and don't mount the tire. Call ${PHONE} the day it arrives, or as close to it as you can manage. Carriers and distributors both set short deadlines on these claims; we tell you the exact deadline for your shipment when you call.`,
      // Terms §10; shipping page "It is the wrong item".
      "When it is our error or a shipping problem, we sort it out: a replacement sent, or a refund, at no extra cost to you. You are not paying return freight for our mistake. Keep the packaging until it is resolved, because the claim may need it.",
    ],
  },
  {
    id: "refunds",
    heading: "Refunds",
    paragraphs: [
      // Terms §9; financing FAQ.
      "Refunds go back to the original payment method. A refund on an order paid in installments is applied through Shop Pay.",
      `${todo("confirm the refund method, and at what point a refund is issued")} We don't promise a date for a refund to reach your account. Call with your order number and we will tell you where it stands.`,
    ],
  },
  {
    id: "warranty",
    heading: "Manufacturer treadwear warranties",
    paragraphs: [
      // Terms §11.
      "Tires, wheels and parts carry whatever warranty the manufacturer provides. Those warranties come from the manufacturer, not from us, and their terms, exclusions and claim processes are theirs.",
      // Product data: `warranty` on each catalog tire, shown by ProductPage.
      "Each tire maker sets its own mileage warranty, and it varies from one tire model to the next; some tires carry none. When we know a tire's mileage warranty, it is shown on the product page, next to Add to Cart and in the spec table. If a product page doesn't show one, ask us before you buy.",
      // Terms §11.
      "Mileage warranties usually require documented rotations and correct inflation, so keep your receipts and rotation records. We will help you file a claim and will tell you honestly what we think it is worth pursuing.",
    ],
  },
  {
    id: "workmanship",
    heading: "Our installation work",
    paragraphs: [
      // Terms §11.
      `We stand behind the work our technicians perform. If something we installed was not done right, tell us promptly and give us the chance to inspect it and put it right. ${todo("workmanship warranty on installs: how long, and whether mobile installs are covered the same way")}`,
      // Terms §11.
      "Normal wear, road hazard damage, curb and pothole impacts, improper inflation, alignment problems we did not cause, racing or off-road use, and damage from continuing to drive on a failing tire are not workmanship issues.",
    ],
  },
  {
    id: "road-hazard",
    heading: "Road hazard protection",
    paragraphs: [
      // No plan is offered anywhere on the site (2026-09-29 audit).
      `Ask us about road hazard protection: call ${PHONE}. ${todo("does a road-hazard plan exist? If yes: price, length and what it covers")}`,
      // Terms §11.
      "Nails, curbs and potholes are road hazards, and damage from them is not a workmanship issue under our terms.",
    ],
  },
];

/** The page's FAQ, also published as FAQPage structured data. */
export const FAQ = [
  {
    q: "How do I start a return?",
    a: `Call ${PHONE} or email ${EMAIL} with your order number before you send anything back. Returns need to be authorized and routed to the right place, or they can be refused on arrival.`,
  },
  {
    q: "How long do I have to return tires?",
    a: `${todo("return window in days")} If the return window matters to your decision, call before you buy and we will tell you what applies to that item.`,
  },
  {
    q: "Can I return a tire that has been mounted?",
    a: `Usually not. Once a tire has been mounted on a wheel it is not returnable, even if it was never driven on. Check the sidewall against your order before anything goes on a wheel. ${todo("confirm the mounted-tire policy")}`,
  },
  {
    q: "Is there a restocking fee?",
    a: `${todo("restocking fee, yes or no")} Call before you buy if it matters to your decision.`,
  },
  {
    q: "Who pays return shipping?",
    a: `If we sent the wrong thing, we do. On a change-of-mind return, return shipping is generally the customer's cost. ${todo("confirm who pays return shipping")}`,
  },
  {
    q: "When will I get my refund?",
    a: `Refunds go back to the original payment method. We don't promise a date for a refund to reach your account; call with your order number and we will tell you where it stands. ${todo("refund timing: at what point a refund is issued")}`,
  },
  {
    q: "What does the tire's mileage warranty cover?",
    a: "The tire maker sets it, and its terms and claim process are the manufacturer's. When we know a tire's mileage warranty, it is on the product page. Mileage warranties usually require documented rotations and correct inflation, and we will help you file a claim.",
  },
  {
    q: "Do you offer road hazard protection?",
    a: `Ask us about road hazard protection: call ${PHONE}.`,
  },
  {
    q: "What if my order arrives damaged or it is the wrong tire?",
    a: `Don't mount it. Photograph the damage or the label and call ${PHONE}. Damage in transit and picking mistakes are on us and the distributor to fix, not on you.`,
  },
];
