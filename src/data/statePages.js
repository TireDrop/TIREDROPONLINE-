// "Tires shipped free to {State}": the facts and the copy behind
// /tires-shipped/<slug>, rendered by src/pages/shipping/StateShippingPage.jsx
// under the /tires-shipped hub. Which states are routed is decided by
// STATE_PAGES_LIVE in stateList.js, never here.
//
// WHY THESE PAGES ARE NOT DOORWAYS. Forty-nine "Tires shipped to {State}"
// pages with the name swapped are textbook scaled content (Google spam
// policies; docs research §4.1). A state gets a page only when it carries
// facts a shopper there actually needs: its tread rule, its stud season, its
// chain or traction law, whether its inspection looks at tires, its tire fee,
// and what its climate means for the tire you pick. statePages.test.mjs holds
// every live page to 700-1,200 words, at least 60% of it found on no other
// state page, and to the copy rules.
//
// FACTS. Every fact names its source and carries two fields:
//
//   evidence    how the fact was checked
//     "fetched"          the official page itself was read
//     "search-primary"   a web search returned the statute's or the state
//                        agency's own text, from that URL; the page itself
//                        could not be opened
//     "search-secondary" only aggregators, news, law firms or retailers
//   unverified  true unless the fact was "fetched" (Justin's rule: a search
//               snippet is not verification)
//   conflict    sources disagree; never rendered
//
// On 2026-10-01 the session's network policy blocked every state, statute and
// NOAA site, so nothing here is "fetched": every fact is unverified. The pilot
// pages render "search-primary" facts only because PREVIEW_SHOW_SEARCH_PRIMARY
// is on, so Justin can review real pages. Before the pilot goes to main,
// someone opens each source link, confirms the line, and sets
// `evidence: "fetched", unverified: false`; then the switch goes off and only
// confirmed facts render. "search-secondary" and conflicting facts never
// render, switch or not.
//
// COPY RULES (statePages.test.mjs): never "safe", "OK" or "fine"; no
// delivery dates or arrival promises; no discounts or "sale"; no reviews or
// "since" years; no sales-tax rules ("taxes and fees are calculated at
// checkout"); law facts sit next to "check ... for current rules"; and
// outside Florida, nothing that implies we install.

/**
 * Preview-only: render facts whose evidence is "search-primary" even though
 * they are flagged unverified. Turn off once the pilot facts are confirmed
 * against their sources (or to see exactly what a strict build would show).
 */
export const PREVIEW_SHOW_SEARCH_PRIMARY = true;

/** Facts checked through this date (shown on each page). */
export const FACTS_CHECKED = "October 2026";

/** Whether a fact may appear on a page. */
export function isShown(fact) {
  if (!fact || fact.conflict) return false;
  if (!fact.unverified && fact.evidence === "fetched") return true;
  return PREVIEW_SHOW_SEARCH_PRIMARY && fact.evidence === "search-primary";
}

/* ----------------------------- sources ----------------------------- */

const NOAA = (abbr) => ({
  name: "NOAA State Climate Summaries 2022",
  url: `https://statesummaries.ncics.org/chapter/${abbr}/`,
});

// A primary-source fact found through search, and a secondary one.
const primary = (text, sources, extra = {}) => ({
  text,
  sources,
  evidence: "search-primary",
  unverified: true,
  ...extra,
});
const secondary = (text, sources, extra = {}) => ({
  text,
  sources,
  evidence: "search-secondary",
  unverified: true,
  ...extra,
});

const AGG_STUDS = {
  name: "Modern Tire Dealer, studded tires state by state",
  url: "https://www.moderntiredealer.com/retail/article/55340250/studded-tires-a-state-by-state-guide",
};
const AGG_FEES = {
  name: "Amazon, State Tire Fees",
  url: "https://www.amazon.com/gp/help/customer/display.html?nodeId=202036250",
};
const AGG_FEES_2 = {
  name: "Priority Tire, State Tire Fees",
  url: "https://www.prioritytire.com/state-tire-fees",
};
const AGG_INSPECT = {
  name: "Vermont Legislative Research Service (Nov 2025)",
  url: "https://www.uvm.edu/d10-files/documents/2025-11/State-Motor-Vehicle-Safety-Inspections-and-Emissions-Testing.pdf",
};

/** Labels for the facts block, in display order. */
export const FACT_LABELS = {
  tread: "Tread depth",
  traction: "Traction and chain laws",
  studs: "Studded tires",
  inspection: "Inspection",
  emissions: "Emissions counties",
  fee: "State tire fee",
};

/* --------------------------- pilot states --------------------------- */

const PILOT = {
  florida: {
    dmv: { name: "FLHSMV", url: "https://www.flhsmv.gov/" },
    intro:
      "TireDrop is the online store of Extreme Tires, a shop in Sunrise, so Florida is the one state where we do more than ship. Anywhere in Florida, your tires ship free to your address. In Miami-Dade, Broward and Palm Beach counties you can also have them fitted by our mobile van or in the bay at the Sunrise shop.",
    facts: {
      tread: primary(
        "FLHSMV tells drivers to replace tires with less than 2/32 inch of tread, and shows the penny test for checking it: Lincoln's head goes into a groove upside down, and if you can see above the top of his head, the tread is under 2/32 inch.",
        [{ name: "FLHSMV, Tire Safety", url: "https://www.flhsmv.gov/safety-center/vehicle-safety/tire-safety/" }],
      ),
      studs: secondary(
        "F.S. 316.299 bans rough-surfaced wheels but exempts pneumatic tires with traction studs; secondary sources disagree on whether studded tires are legal on Florida roads.",
        [{ name: "F.S. 316.299", url: "https://www.flsenate.gov/Laws/Statutes/2011/316.299" }],
        { conflict: true },
      ),
      inspection: secondary(
        "Florida ended periodic safety inspections (which checked tires) in 1981 and its emissions test in 2000.",
        [{ name: "LegalClarity", url: "https://legalclarity.org/why-did-florida-stop-vehicle-inspections/" }],
      ),
      fee: primary(
        "Florida law puts a $1 fee on each new motor vehicle tire sold at retail in the state, listed on its own line of the invoice. The money goes to the state's Solid Waste Management Trust Fund.",
        [{ name: "Florida Statutes § 403.718", url: "https://www.flsenate.gov/Laws/Statutes/2023/403.718" }],
      ),
    },
    climate: [
      primary(
        "Florida has hot, humid summers and mild winters, and it is the most humid state in the nation.",
        [NOAA("fl")],
      ),
      primary(
        "Florida gets more thunderstorms each year than any other state, and hurricanes and strong coastal storms, its most serious weather threat, strike the coast on average three times every five years.",
        [NOAA("fl")],
      ),
    ],
    tireTypeTitle: "Rain decides it here, not snow",
    tireType: [
      "Snow never comes into a Florida tire choice; water and heat do. With more thunderstorms than any other state, the grooves that clear water off the contact patch matter more than anything printed about winter. An all-season or touring tire with open, deep grooves fits nearly all Florida driving.",
      "Look at the traction grade on the sidewall (AA, A, B or C): it is measured on wet pavement, which is the test that counts here. Winter tires make little sense in Florida, because their soft compound wears quickly on hot asphalt. If you drive north to Georgia or the Carolinas in winter, an all-weather tire with the three-peak mountain snowflake symbol covers the odd cold snap without a second set.",
    ],
    // Florida only: where we install, and where we only ship.
    localInstall: {
      title: "Installed in South Florida, shipped everywhere else",
      body: [
        "In Miami-Dade, Broward and Palm Beach counties you choose at checkout: ship to your address, ship free to the Sunrise shop for a bay fitting, or pick mobile installation and our van fits the tires where the car is parked. The van goes by ZIP code, so check yours on the mobile service page.",
        "Everywhere else in Florida, from Jacksonville to Pensacola to Fort Myers, it works as it does in every other state: the tires ship free to your address and a shop you choose mounts them. We don't install outside those three counties.",
      ],
    },
    shipNote:
      "Florida orders ship free to any street address in the state, or free to our Sunrise shop if you want them fitted there. Taxes and fees, including Florida's $1 tire fee where it applies, are calculated at checkout.",
    mountNote:
      "Outside South Florida, ask the shop what it charges to take your old tires. That is the shop's own charge, separate from the state's $1 fee on new tires. After a flood or a storm cleanup, have the shop look for cuts and embedded debris on the tires coming off and on the spare.",
    faq: [
      {
        q: "I'm in Orlando. Can your van come to me?",
        a: "No. Mobile installation covers Miami-Dade, Broward and Palm Beach counties only, decided by ZIP code. In Orlando, Tampa, Jacksonville or anywhere else in Florida, the tires ship free to your address and a shop near you mounts them.",
      },
      {
        q: "What is the $1 charge on Florida tire orders?",
        a: "Florida's waste tire fee: $1 for each new tire sold at retail in the state under F.S. 403.718, shown on its own invoice line. It pays for the state's waste tire programs. Taxes and fees are calculated at checkout.",
      },
      {
        q: "Can I send the order to the Sunrise shop and pick it up?",
        a: "Yes. Choose ship-to-store at checkout and the order goes free to Extreme Tires at 7712 West Oakland Park Blvd in Sunrise. We call you once it's checked in, and you can book a bay fitting or collect the tires.",
      },
      {
        q: "Does hurricane season change anything about ordering?",
        a: "Only the timing you plan around. Hurricanes and strong coastal storms hit Florida on average three times every five years, and a parcel in transit waits out a storm like any other; the tracking email shows where it is. If your street flooded, check the tires coming off for cuts and debris before you buy the same size again.",
      },
      {
        q: "How do I check my tread before I order?",
        a: "Try FLHSMV's penny test: Lincoln's head down in a groove, and if you can see over the top of his head you're under 2/32 inch. Our Do I Need Tires Yet? tool walks you through it groove by groove.",
      },
    ],
    seoTitle: "Tires Shipped Free to Florida",
    description:
      "Free tire shipping anywhere in Florida, plus mobile install in Miami-Dade, Broward and Palm Beach. Florida's $1 tire fee, tread check and rain-first tire picks.",
  },

  georgia: {
    dmv: {
      name: "the Georgia Department of Revenue's Motor Vehicle Division",
      url: "https://dor.georgia.gov/motor-vehicles",
    },
    intro:
      "Tires ship free to any street address in Georgia, from Savannah to the north Georgia mountains. We don't install in Georgia: your tires ship to your door, or to the shop you pick, with tracking emailed, and that shop mounts them. Below are Georgia's tread and stud rules, its $1 tire fee and what its short, mild winters mean for the tire you buy.",
    facts: {
      tread: primary(
        "Georgia law requires at least 2/32 inch of tread, measurable in all major grooves. School buses and commercial vehicles need 4/32 inch on the front tires.",
        [{ name: "O.C.G.A. § 40-8-74", url: "https://law.justia.com/codes/georgia/title-40/chapter-8/article-1/part-4/section-40-8-74/" }],
      ),
      studs: primary(
        "Georgia bans studs, spikes and other non-rubber protrusions on tires, with one exception: chains and studded tires may be used when snow, ice or similar conditions could make a vehicle skid.",
        [{ name: "O.C.G.A. § 40-8-74", url: "https://law.justia.com/codes/georgia/title-40/chapter-8/article-1/part-4/section-40-8-74/" }],
      ),
      inspection: primary(
        "Georgia's vehicle inspection is an emissions test, not a tire check. For 2026 registrations, most 2002 to 2023 gas cars and light trucks registered in 13 metro Atlanta counties are tested every year, before the owner's birthday.",
        [{ name: "Georgia's Clean Air Force, FAQ", url: "https://cleanairforce.com/frequently-asked-questions" }],
      ),
      fee: primary(
        "Georgia charges $1 on each new replacement tire sold in the state. Since a 2023 change to the law, the distributor that first sells the tire in Georgia collects it. The money funds scrap tire cleanup and recycling grants.",
        [
          { name: "Georgia EPD, Tire Fee Collection 2023", url: "https://epd.georgia.gov/georgia-tire-fee-collection-2023" },
          { name: "Georgia DOR (O.C.G.A. § 12-8-40.1)", url: "https://dor.georgia.gov/taxes/sales-use-tax/what-subject-sales-and-use-tax" },
        ],
      ),
    },
    climate: [
      primary(
        "Georgia has long, hot, humid summers and short, usually mild winters. Snowfall is light: even the northern mountains average only about 5 inches a year.",
        [NOAA("ga")],
      ),
      primary(
        "Rain is plentiful year-round, from more than 70 inches a year in the mountainous northeast corner to about 45 inches in the southeast and central parts of the state.",
        [NOAA("ga")],
      ),
    ],
    tireTypeTitle: "All-season for most of Georgia",
    tireType: [
      "With about 5 inches of snow a year even in the mountains, a dedicated winter tire is hard to justify for most Georgia drivers. Rain is the bigger factor: the northeast corner gets more than 70 inches a year, so tread depth and wet grip deserve more of your attention than a snow rating.",
      "If you live up around Blue Ridge or Dahlonega, or head north into Tennessee and the Carolinas in winter, an all-weather tire with the three-peak mountain snowflake symbol gives more bite on the occasional icy morning and stays on all year. Georgia law already lets you add chains or studs when snow or ice makes a road slick, so the rare storm doesn't have to decide your everyday tire.",
    ],
    shipNote:
      "Georgia orders ship free from a distributor warehouse to your home, your workplace or the shop that will mount them. Taxes and fees are calculated at checkout.",
    mountNote:
      "Shipping straight to a Georgia shop? Call first: ask whether it accepts tires customers have shipped in and how it wants the parcel addressed, and put your own name on the address line so the shop can match the tires to you.",
    faq: [
      {
        q: "What's the legal minimum tread in Georgia?",
        a: "2/32 inch, measurable in all major grooves, under O.C.G.A. § 40-8-74; school buses and commercial vehicles need 4/32 inch on the front tires. If you're not sure where yours stand, our Do I Need Tires Yet? tool helps you measure.",
      },
      {
        q: "Can I run studded tires in Georgia?",
        a: "Only when snow, ice or similar conditions could make the vehicle skid. The rest of the time Georgia law bans studs and other non-rubber protrusions, and with snowfall this light, few Georgia drivers buy them.",
      },
      {
        q: "Why is there a $1 fee on tires in Georgia?",
        a: "O.C.G.A. § 12-8-40.1 puts $1 on each new replacement tire sold in the state to pay for scrap tire cleanup and recycling. From July 1, 2023, the distributor collects it. Taxes and fees are calculated at checkout.",
      },
      {
        q: "I'm in metro Atlanta. Does my emissions test check my tires?",
        a: "No. Georgia's Clean Air Force test covers emissions. The tread rule still applies on the road, so ask the shop that mounts your new set to measure the old ones and the spare.",
      },
    ],
    seoTitle: "Tires Shipped Free to Georgia",
    description:
      "Free tire shipping to any Georgia address. Georgia's 2/32-inch tread law, its stud rule, the $1 tire fee and tire picks for mild, rainy winters, all sourced.",
  },

  texas: {
    dmv: { name: "the Texas DMV", url: "https://www.txdmv.gov/" },
    intro:
      "Tires ship free to any street address in Texas, from El Paso to Beaumont and from the Panhandle to the Rio Grande Valley. Texas changed the rules recently: most passenger cars no longer get a state safety inspection, so keeping an eye on your own tread matters more than it used to. Here is what still applies, with sources, and how to get a new set mounted near you.",
    facts: {
      tread: secondary(
        "DPS inspection criteria use 2/32 inch, but the safety inspection that applied them no longer covers non-commercial vehicles; which rule now binds passenger cars was not confirmed.",
        [{ name: "Texas DPS, Inspection Criteria", url: "https://www.dps.texas.gov/section/vehicle-inspection/inspection-criteria-items-inspection" }],
        { conflict: true },
      ),
      studs: secondary(
        "Transportation Code § 547.612 bars non-rubber protrusions unless they don't injure the highway; secondary sources say metal studs are illegal in Texas.",
        [{ name: "Tex. Transp. Code § 547.612 (FindLaw)", url: "https://codes.findlaw.com/tx/transportation-code/transp-sect-547-612/" }],
        { conflict: true },
      ),
      inspection: primary(
        "Since January 1, 2025, non-commercial vehicles in Texas no longer need a safety inspection before registration (House Bill 3297). Owners pay a $7.50 inspection program replacement fee when they register instead. Commercial vehicles still need a passing safety inspection.",
        [{ name: "Texas DPS, Inspection Program Changes", url: "https://www.dps.texas.gov/news/vehicle-safety-inspection-program-changes-now-effect" }],
      ),
      emissions: primary(
        "Emissions testing still applies in Collin, Dallas, Denton, Ellis, Johnson, Kaufman, Parker, Rockwall and Tarrant counties around Dallas-Fort Worth; Brazoria, Fort Bend, Galveston, Harris and Montgomery around Houston; Travis and Williamson around Austin; and El Paso County, with Bexar County starting November 1, 2026. It is an emissions test, not a tire check.",
        [{ name: "TCEQ, Vehicle Emissions Inspections", url: "https://www.tceq.texas.gov/airquality/mobilesource/vim/overview.html" }],
      ),
      fee: primary(
        "Texas has no state fee on new tires. Its per-tire recycling fee program ended on December 31, 1997; tire shops now set their own charges for taking old tires.",
        [{ name: "TCEQ, Scrap Tire Management in Texas", url: "https://www.tceq.texas.gov/downloads/permitting/waste-permits/publications/as212-20_scraptire_5yrplan.pdf" }],
      ),
    },
    climate: [
      primary(
        "Texas has hot summers and mild to cool winters. The Rocky Mountains tend to steer arctic air south into the state in winter, and the flat middle of the continent lets that cold air move in quickly.",
        [NOAA("tx")],
      ),
      primary(
        "January low temperatures typically run from about 20°F in the northern Panhandle to about 50°F near the mouth of the Rio Grande.",
        [NOAA("tx")],
      ),
    ],
    tireTypeTitle: "All-season down south, all-weather up north",
    tireType: [
      "Texas is too big for one answer. Along the Gulf and in the Valley, where January lows sit around 50°F, an all-season or touring tire fits the whole year. Heat is the bigger enemy there: check pressures in the morning before you drive, because a hot afternoon reading runs high and hides a slow leak.",
      "In the Panhandle and North Texas, January lows near 20°F and arctic air that drops in fast make an all-weather tire with the three-peak mountain snowflake symbol worth a look. It passes a severe-snow traction test yet stays on all year, which suits a place where winter comes in short, sharp spells rather than a long season.",
    ],
    shipNote:
      "Texas orders ship free to your home, your office or the shop that will mount them. Texas adds no state tire fee; taxes and fees are calculated at checkout.",
    mountNote:
      "With no annual inspection to catch worn tires, ask the mounting shop to measure the tread on the tires coming off and to check your spare. Any charge for taking the old set is the shop's own, since Texas has no state tire fee, so ask what it is when you call.",
    faq: [
      {
        q: "Does Texas still inspect my tires?",
        a: "Not for most passenger vehicles. Since January 1, 2025, non-commercial vehicles skip the safety inspection and pay a $7.50 inspection program replacement fee at registration instead. Commercial vehicles are still inspected.",
      },
      {
        q: "Why is there no state tire fee on my Texas order?",
        a: "Texas doesn't have one. Its per-tire recycling fee ended at the close of 1997, according to TCEQ. Shops may charge for taking old tires, and that charge is theirs. Taxes and fees are calculated at checkout.",
      },
      {
        q: "I'm in Harris County. Is the emissions test a tire check?",
        a: "No. Harris is one of the TCEQ emissions counties, and that test is about what comes out of the tailpipe. Tread and tire condition are between you and your shop now.",
      },
      {
        q: "Do I need winter tires in Amarillo?",
        a: "Texas doesn't require them. But with January lows near 20°F in the northern Panhandle and cold air that moves in fast, an all-weather tire with the mountain snowflake symbol is a sensible year-round pick there.",
      },
    ],
    seoTitle: "Tires Shipped Free to Texas",
    description:
      "Free tire shipping to any Texas address. What changed when safety inspections ended, the emissions counties, no state tire fee, tire picks Gulf to Panhandle.",
  },

  california: {
    dmv: { name: "the California DMV", url: "https://www.dmv.ca.gov/" },
    intro:
      "Tires ship free to any street address in California, from San Diego to the Oregon line. California's tire rules are unusually specific: a 1/32 inch tread minimum, chain controls in the mountains with a 6/32 inch rule for snow tires used instead of chains, a stud season and a $1.75 tire fee. Here they are with sources, and what they mean for the set you choose.",
    facts: {
      tread: primary(
        "Passenger tires need at least 1/32 inch of tread in any two adjacent grooves at any point on the tire. Snow tires used instead of chains in a posted chain-control area need 6/32 inch.",
        [{ name: "California Vehicle Code § 27465", url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=27465.&lawCode=VEH" }],
      ),
      traction: primary(
        "Caltrans posts chain controls in three levels. R-1: chains required, except on passenger cars and light trucks under 6,000 pounds with snow tires on at least two drive wheels. R-2: chains required, except on four-wheel or all-wheel drive vehicles with snow-tread tires on all four wheels, which must still carry chains. R-3: chains on every vehicle. Snow tires are marked M+S or MUD AND SNOW on the sidewall.",
        [{ name: "Caltrans, Chain Controls", url: "https://dot.ca.gov/travel/winter-driving-tips/chain-controls" }],
      ),
      studs: primary(
        "Studded tires are allowed anywhere in the state from November 1 through April 30. They are not traction devices, so they can't be used in place of chains.",
        [{ name: "California Vehicle Code § 27454", url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=VEH&sectionNum=27454" }],
      ),
      inspection: primary(
        "California's periodic vehicle test is the Smog Check, an emissions inspection run by the Bureau of Automotive Repair. It is required every other year at registration once a car is more than eight model years old.",
        [{ name: "Bureau of Automotive Repair, Smog Check", url: "https://bar.ca.gov/pdf/smog-check-brochure.pdf" }],
      ),
      fee: primary(
        "California charges $1.75 on each new tire bought separately from a vehicle, under the California Tire Fee law. CDTFA collects it with CalRecycle, and it is scheduled to drop to 75 cents a tire on January 1, 2034.",
        [{ name: "CDTFA, California Tire Fee", url: "https://cdtfa.ca.gov/taxes-and-fees/california-tire-fee/" }],
      ),
    },
    climate: [
      primary(
        "California's climate runs from some of the nation's hottest, driest deserts in the south to heavy snowfall at higher elevations.",
        [NOAA("ca")],
      ),
      primary(
        "The Pacific keeps coastal temperatures mild all year; inland areas see a much wider range.",
        [NOAA("ca")],
      ),
    ],
    tireTypeTitle: "All-season at home, chain rules in the mountains",
    tireType: [
      "Most Californians never see snow at home. On the coast and in the valleys, an all-season or summer tire fits the year; in the desert, heat and tire age matter more than tread pattern, so check the four-digit date code on the sidewall of anything you buy.",
      "If you drive into the Sierra Nevada or other mountain areas in winter, chain controls shape the choice. Under R-1, a car with M+S snow tires on two drive wheels can skip chains; under R-2, only 4WD or AWD vehicles with snow-tread tires on all four wheels can, and they still carry chains. Either way, a snow tire used instead of chains needs 6/32 inch of tread, so a set bought for ski trips should start the winter well above it.",
    ],
    shipNote:
      "California orders ship free to any street address in the state. Taxes and fees, including the California tire fee where it applies, are calculated at checkout.",
    mountNote:
      "If you'll drive in chain-control areas, ask the shop to confirm the new tires show M+S or the mountain snowflake symbol, and to write the starting tread depth on the invoice so you know where you stand against the 6/32 inch rule later in the season.",
    faq: [
      {
        q: "Is 1/32 inch really the legal minimum in California?",
        a: "For passenger tires, yes, under Vehicle Code § 27465. It is a floor, not a target: wet grip falls off long before that, and a snow tire used instead of chains in a chain-control area needs 6/32 inch.",
      },
      {
        q: "Can my all-wheel-drive car skip chains in the Sierra?",
        a: "Under R-2, yes, if it has snow-tread tires on all four wheels, but it must still carry chains. Under R-3 every vehicle chains up. Caltrans posts the level in force at each control point.",
      },
      {
        q: "When can I run studded tires in California?",
        a: "From November 1 through April 30, anywhere in the state. Studs don't count as traction devices, so when chains are required, studs alone won't do.",
      },
      {
        q: "What is the $1.75 on California tire orders?",
        a: "The California Tire Fee: $1.75 per new tire, collected by CDTFA and spent on tire recycling grants and air quality programs. It is set to drop to 75 cents in 2034. Taxes and fees are calculated at checkout.",
      },
    ],
    seoTitle: "Tires Shipped Free to California",
    description:
      "Free tire shipping to any California address. The 1/32-inch tread law, R-1 to R-3 chain controls, the stud season, the $1.75 tire fee and tire picks, sourced.",
  },

  "new-york": {
    dmv: { name: "the New York DMV", url: "https://dmv.ny.gov/" },
    intro:
      "Tires ship free to any street address in New York, from Long Island to Buffalo. New York looks at your tires every year at inspection, sets a stud season and adds a $2.50 tire fee, and its lake-effect snow belts are among the snowiest places in the East. Here is each rule with its source, and what it means for the tires you pick.",
    facts: {
      tread: primary(
        "At inspection, cars and light trucks need at least 2/32 inch of tread, measured in two adjacent major grooves where the tire is most worn.",
        [{ name: "NY DMV, Safety/Emissions Inspection Program", url: "https://dmv.ny.gov/new-york-state-vehicle-safetyemissions-inspection-program" }],
      ),
      inspection: primary(
        "Every vehicle registered in New York must be inspected at least once every 12 months. Besides tread depth, the inspection fails a tire with a cut longer than an inch that shows fabric, a visible bump, bulge or knot, or a restricted-use marking.",
        [{ name: "NY DMV, Safety/Emissions Inspection Program", url: "https://dmv.ny.gov/new-york-state-vehicle-safetyemissions-inspection-program" }],
      ),
      studs: primary(
        "Tires with metal studs may be used only from October 16 through April 30.",
        [{ name: "NY DMV Driver's Manual, Chapter 10", url: "https://dmv.ny.gov/new-york-state-drivers-manual-and-practice-tests/chapter-10-special-driving-conditions" }],
      ),
      fee: primary(
        "New York's waste tire management and recycling fee is $2.50 on most new tires bought at retail in the state, and the Tax Department's guidance names online tire retailers among the sellers that collect it. Used and recapped tires are exempt. The fee is currently set to run through December 31, 2027.",
        [{ name: "NYS Tax Department, Waste Tire Fee", url: "https://www.tax.ny.gov/bus/tire/wtm.htm" }],
      ),
    },
    climate: [
      primary(
        "Northern New York often gets heavy lake-effect snow: arctic air warms and picks up moisture over Lakes Erie and Ontario, then drops intense bands of snow downwind.",
        [NOAA("ny")],
      ),
      primary(
        "In November 2014 one lake-effect storm left more than 5 feet of snow just east of Buffalo, and a second storm right behind it added as much as 4 more feet.",
        [NOAA("ny")],
      ),
      primary(
        "The Atlantic moderates the coast, while the Great Lakes and Lake Champlain moderate the northwest and northeast of the state.",
        [NOAA("ny")],
      ),
    ],
    tireTypeTitle: "Winter tires upstate, all-weather downstate",
    tireType: [
      "In the lake-effect belts downwind of Lake Erie and Lake Ontario, Buffalo included, a dedicated winter tire with the three-peak mountain snowflake symbol is the straight answer. Snow there comes in intense bands, and a winter compound keeps its grip in the cold where an all-season stiffens.",
      "In New York City, on Long Island and along the coast, where the Atlantic takes the edge off winter, an all-weather tire carrying the same snowflake symbol handles the occasional storm with no seasonal swap. If you choose studded winter tires anywhere in the state, they come off by April 30 and can't go back on before October 16.",
    ],
    shipNote:
      "New York orders ship free to any street address in the state, apartment buildings included; make sure someone can take in a set of four. Taxes and fees, including New York's tire fee where it applies, are calculated at checkout.",
    mountNote:
      "If your inspection is due soon, have the new set mounted first and keep the shop's invoice with your order confirmation. Running a second set of wheels for winter? Ask the shop to mount the winter tires on those wheels, so each spring and fall the change is a wheel swap rather than a remount.",
    faq: [
      {
        q: "What tread depth fails a New York inspection?",
        a: "Less than 2/32 inch, measured in two adjacent major grooves where the tire is most worn. A cut over an inch that shows fabric, or a bump, bulge or knot, also fails it.",
      },
      {
        q: "When do studded tires have to come off in New York?",
        a: "By April 30. Metal-studded tires are allowed only from October 16 through April 30, so plan the spring changeover around that date.",
      },
      {
        q: "What is the $2.50 per tire on New York orders?",
        a: "New York's waste tire management and recycling fee, administered by the Tax Department, on most new tires bought at retail in the state. Taxes and fees are calculated at checkout.",
      },
      {
        q: "Do I need winter tires in Buffalo?",
        a: "The law doesn't require them, but NOAA describes Buffalo's lake-effect storms dropping several feet of snow at a time. For a daily driver there, a winter tire with the mountain snowflake symbol is what we'd pick.",
      },
    ],
    seoTitle: "Tires Shipped Free to New York",
    description:
      "Free tire shipping to any New York address. The 2/32-inch inspection rule, the Oct 16 to April 30 stud season, the $2.50 tire fee and lake-effect tire picks.",
  },

  "north-carolina": {
    dmv: { name: "NCDMV", url: "https://www.ncdot.gov/dmv/" },
    intro:
      "Tires ship free to any street address in North Carolina, from the Outer Banks to the Blue Ridge. North Carolina still checks tires at its annual inspection, allows studded tires within a size limit, and figures its tire tax as a share of the price rather than a flat fee. Its winters range from almost no snow on the coast to about 89 inches a year on Mount Mitchell.",
    facts: {
      tread: primary(
        "North Carolina's tire law fails a tire with less than 2/32 inch of tread at two or more places around it, in two adjacent major grooves. Steering-axle tires on heavy-duty vehicles need 4/32 inch.",
        [{ name: "N.C.G.S. § 20-122.1", url: "https://ncleg.gov/EnactedLegislation/Statutes/HTML/BySection/Chapter_20/GS_20-122.1.html" }],
      ),
      inspection: primary(
        "The annual safety inspection covers the tires, checked against that tread law, along with brakes and lights. NCDMV's October 2026 guidance on digital registration says you still need a safety inspection before you register or renew.",
        [
          { name: "N.C.G.S. § 20-183.3", url: "https://ncleg.gov/EnactedLegislation/Statutes/HTML/BySection/Chapter_20/GS_20-183.3.html" },
          { name: "NCDMV, Digital Vehicle Registration", url: "https://www.ncdot.gov/dmv/title-registration/registration/Pages/digital-vehicle-registration.aspx" },
        ],
      ),
      studs: primary(
        "Regular and snow tires with studs are allowed, as long as the studs stick out no more than 1/16 inch beyond the tread when compressed.",
        [{ name: "N.C.G.S. § 20-122", url: "https://ncleg.gov/EnactedLegislation/Statutes/HTML/BySection/Chapter_20/GS_20-122.html" }],
      ),
      fee: primary(
        "Instead of a flat fee, North Carolina charges a scrap tire disposal tax on new tires: 2% of the price for tires under 20 inches in bead diameter, and 1% for 20 inches and up. The price it is figured on includes the retailer's charges for installation and shipping.",
        [{ name: "NCDOR, Scrap Tire Disposal Tax", url: "https://www.ncdor.gov/taxes-forms/other-taxes-and-fees/scrap-tire-disposal-tax" }],
      ),
    },
    climate: [
      primary(
        "North Carolina averages about 5 inches of snow a year, but the higher Appalachians can get up to 100 inches, while the coast sees little to none.",
        [NOAA("nc")],
      ),
      primary(
        "Mount Mitchell, the state's snowiest site, averages 89.1 inches a year. In many winter storms the Piedmont sits between cold air to the west and warm air to the east, and freezing rain is common enough there that it has been called the Ice Storm Capital of the South.",
        [{ name: "NC State Climate Office", url: "https://products.climate.ncsu.edu/weather/winter/types/" }],
      ),
    ],
    tireTypeTitle: "All-season on the coast, all-weather inland",
    tireType: [
      "On the coastal plain, where snow is rare, an all-season tire fits the year. The Piedmont, from Charlotte through Greensboro to Raleigh and Durham, is the tricky part of the state: freezing rain is more likely than deep snow there, and no tire grips glaze ice well. An all-weather tire with the three-peak mountain snowflake symbol is the sensible upgrade over an all-season, with better bite in slush and cold rain and no seasonal swap.",
      "In the mountains around Boone and Asheville, where totals climb far past the state average, a winter tire earns its place on a daily driver, and studs are an option within the 1/16 inch limit.",
    ],
    shipNote:
      "North Carolina orders ship free to any street address in the state. Taxes and fees, including the scrap tire disposal tax where it applies, are calculated at checkout.",
    mountNote:
      "Your new tires will be looked at again at your next annual inspection, so ask the shop for an invoice showing the tire size and the date mounted, and keep it with your order confirmation. Running studs? Ask the shop to confirm they sit within the 1/16 inch limit.",
    faq: [
      {
        q: "Does North Carolina still require a safety inspection?",
        a: "Yes. NCDMV's October 2026 guidance says you still need one before you register or renew, and the tires are part of it, checked against the 2/32 inch tread law.",
      },
      {
        q: "How is North Carolina's tire tax figured?",
        a: "As a percentage of the price: 2% for tires under 20 inches in bead diameter, 1% for 20 inches and up, and the price includes the retailer's installation and shipping charges. Taxes and fees are calculated at checkout.",
      },
      {
        q: "Are studded tires legal in North Carolina?",
        a: "Yes, on regular and snow tires, provided the studs stick out no more than 1/16 inch beyond the tread when compressed. North Carolina sets no calendar window for them.",
      },
      {
        q: "Which tire handles a Piedmont ice storm?",
        a: "None grips glaze ice well, which is why staying home is often the real answer. For the slush and cold rain around those storms, an all-weather tire with the mountain snowflake symbol beats an all-season.",
      },
    ],
    seoTitle: "Tires Shipped Free to North Carolina",
    description:
      "Free tire shipping to any North Carolina address. The 2/32-inch inspection rule, studs up to 1/16 inch, the 2% scrap tire tax and Piedmont ice-storm tire picks.",
  },

  colorado: {
    dmv: {
      name: "CDOT",
      url: "https://www.codot.gov/travel/winter-driving/tractionlaw",
    },
    intro:
      "Tires ship free to any street address in Colorado, from the Eastern Plains to the Western Slope. If you drive the mountains, your tires are a legal matter as much as a choice: from September 1 through May 31 the Traction Law applies on the I-70 mountain corridor, and it asks for more tread than most states' minimums.",
    facts: {
      traction: primary(
        "From September 1 through May 31 the Traction Law is in effect on the I-70 Mountain Corridor between Dotsero and Morrison, and CDOT can put it in force on other state highways when conditions call for it. While it's on, a 4WD or AWD vehicle needs tires with at least 3/16 inch of tread that are winter tires (mountain snowflake symbol), all-weather tires or mud-and-snow (M+S) tires. Any vehicle that doesn't meet that, two-wheel drive included, needs chains or an approved alternative traction device on two or more drive tires.",
        [{ name: "CDOT, New Traction Law requirements (Nov 2025)", url: "https://www.codot.gov/news/2025/november/new-traction-law-requirements" }],
      ),
      penalty: secondary(
        "Penalty for not complying: CDOT's November 2025 release gives $50 plus a $17 surcharge; other summaries of SB25-069 give $100 plus $33.",
        [{ name: "CDOT news", url: "https://www.codot.gov/news/2025/november/new-traction-law-requirements" }],
        { conflict: true },
      ),
      studs: secondary(
        "Sources disagree: some say studs are legal year-round, others give October 1 to April 30.",
        [AGG_STUDS],
        { conflict: true },
      ),
      inspection: primary(
        "Colorado's periodic vehicle test is an emissions inspection, required for many vehicles registered in the Denver metro area and the North Front Range. It is not a tire check.",
        [{ name: "CDPHE, Emissions Inspection Requirements", url: "https://cdphe.colorado.gov/air-emissions/general-emissions-inspection-requirements-and-information" }],
      ),
      fee: primary(
        "Beginning January 1, 2026, Colorado's Waste Tire Management Enterprise collects $1.50 on each new tire sold in the state.",
        [{ name: "CDPHE, Waste Tire Management Enterprise", url: "https://cdphe.colorado.gov/hm/waste-tire-management-enterprise" }],
      ),
    },
    climate: [
      primary(
        "Snowfall swings enormously across Colorado: the high mountains get 150 to more than 400 inches a year. Wolf Creek Pass averages nearly 400 inches, while Manassa in the San Luis Valley, just to the east, gets barely 40.",
        [{ name: "Colorado Climate Center", url: "https://climate.colostate.edu/climate_long.html" }],
      ),
      primary(
        "On the eastern plains and in the valleys most precipitation falls in spring and summer; the high peaks get most of theirs in winter.",
        [NOAA("co")],
      ),
    ],
    tireTypeTitle: "Where you drive decides it",
    tireType: [
      "In Colorado the question is less where you live than where you drive. If your winter includes I-70 west of Morrison or any mountain pass, a 4WD or AWD vehicle needs winter, all-weather or M+S tires with at least 3/16 inch of tread, and a two-wheel-drive car needs chains or a traction device when the law is on. A winter tire with the mountain snowflake symbol is the strongest choice for mountain commuters; an all-weather tire suits Front Range drivers who head up on weekends.",
      "On the eastern plains, where most precipitation comes in spring and summer, an all-season tire covers most driving. Whatever you buy for the mountains, watch the tread: a tire that starts the season just above 3/16 inch may not finish it there.",
    ],
    shipNote:
      "Colorado orders ship free to any street address in the state, mountain towns included. Taxes and fees, including Colorado's $1.50 tire fee where it applies, are calculated at checkout.",
    mountNote:
      "Ask the shop to measure the tread on the new tires and note it on the invoice, since 3/16 inch is the number that counts under the Traction Law. If you switch between winter and summer sets, a second set of wheels makes the twice-a-year change quicker.",
    faq: [
      {
        q: "What tread depth does the Colorado Traction Law require?",
        a: "At least 3/16 inch, on winter, all-weather or M+S tires, for a 4WD or AWD vehicle to comply on tires alone. Without that, you need chains or an approved alternative traction device on two or more drive tires.",
      },
      {
        q: "Does my front-wheel-drive car need chains on I-70?",
        a: "When the Traction Law is on, a vehicle that isn't 4WD or AWD with qualifying tires needs chains or an approved alternative traction device on two or more drive tires. It runs September 1 through May 31 between Dotsero and Morrison.",
      },
      {
        q: "Do M+S all-season tires count under the Traction Law?",
        a: "On a 4WD or AWD vehicle, yes, if they have at least 3/16 inch of tread. Check the sidewall for M+S or the mountain snowflake symbol before you count on them.",
      },
      {
        q: "What is the $1.50 on Colorado tire orders?",
        a: "Colorado's waste tire fee, collected from January 1, 2026 by the state's Waste Tire Management Enterprise on each new tire sold. Taxes and fees are calculated at checkout.",
      },
    ],
    seoTitle: "Tires Shipped Free to Colorado",
    description:
      "Free tire shipping to any Colorado address. The I-70 Traction Law and its 3/16-inch tread rule, the $1.50 tire fee and tire picks from the plains to the passes.",
  },
};

/* ------------------- every other state: data only ------------------- */
//
// Drafted from aggregators (search-secondary), so nothing here renders. Each
// needs its own primary sources, a climate summary, a tire-type section and
// an FAQ before it can be routed. Aggregators disagree with official figures
// where both were seen (e.g. Colorado's fee: $1.75 on an aggregator, $1.50 at
// CDPHE), which is why none of these are trusted yet.

const studs = (window) =>
  secondary(`Aggregator lists studded tires as allowed ${window}.`, [AGG_STUDS]);
const fee = (amount) =>
  secondary(`Aggregators list a state tire fee of ${amount}.`, [AGG_FEES, AGG_FEES_2]);
const noFee = () =>
  secondary("Aggregators list no state tire fee.", [AGG_FEES, AGG_FEES_2]);
const inspect = (text) => secondary(text, [AGG_INSPECT]);

const DRAFTS = {
  alabama: { fee: fee("$1 per tire") },
  arizona: { studs: studs("October 1 to May 1"), fee: fee("2% of the price, up to $2 per tire") },
  arkansas: { studs: studs("November 15 to April 15"), fee: fee("$3 per tire") },
  connecticut: {
    studs: studs("November 15 to April 30"),
    fee: fee("$2 per tire"),
    inspection: inspect("Listed among states with biennial inspections; may be emissions only (unconfirmed)."),
  },
  delaware: { studs: studs("October 15 to April 15"), fee: fee("$2 per tire") },
  "washington-dc": {},
  idaho: { studs: studs("October 1 to April 30") },
  illinois: { studs: studs("only for some vehicles, such as rural mail carriers, November 15 to April 1"), fee: fee("$2.50 per tire") },
  indiana: { studs: studs("October 1 to May 1"), fee: fee("$0.25 per tire") },
  iowa: { studs: studs("November 1 to April 1") },
  kansas: { studs: studs("November 1 to April 1"), fee: fee("$0.25 per tire") },
  kentucky: { studs: studs("with no date window"), fee: fee("$2 per tire") },
  louisiana: { fee: fee("$2 per passenger tire (larger tires more)") },
  maine: {
    studs: studs("October 2 to April 30"),
    fee: fee("$1 per tire"),
    inspection: inspect("Listed as requiring an annual safety inspection."),
  },
  maryland: { studs: studs("November 1 to March 31"), fee: fee("$6 per tire (figure doubtful)") },
  massachusetts: {
    studs: studs("November 2 to April 30"),
    inspection: inspect("Listed as requiring an annual safety inspection."),
  },
  michigan: {},
  minnesota: { studs: studs("only for rural mail carriers and non-residents, November 15 to April 15") },
  mississippi: { fee: fee("$1 per tire under 24 inches, $2 over") },
  missouri: { studs: studs("November 1 to March 31"), fee: fee("$0.50 per tire") },
  montana: { studs: studs("October 1 to May 31") },
  nebraska: { studs: studs("November 1 to April 1"), fee: fee("$1 per tire") },
  nevada: { studs: studs("October 1 to April 30"), fee: fee("$1 per tire 12 inches and up") },
  "new-hampshire": {
    studs: studs("with no date window"),
    inspection: inspect("Annual safety inspection listed as ending January 31, 2026."),
  },
  "new-jersey": { studs: studs("November 15 to April 1"), fee: fee("$1.50 per tire") },
  "new-mexico": { studs: studs("when conditions call for them, with no calendar window"), fee: fee("$1.50 per tire") },
  "north-dakota": { studs: studs("October 15 to April 15"), fee: noFee() },
  ohio: { studs: studs("November 1 to April 15"), fee: fee("$1 per tire") },
  oklahoma: { studs: studs("November 1 to April 1") },
  oregon: { studs: studs("November 1 to March 31"), fee: noFee() },
  pennsylvania: {
    studs: studs("November 1 to April 15"),
    fee: fee("$1 per tire"),
    inspection: inspect("Listed as requiring an annual safety inspection."),
  },
  "rhode-island": {
    studs: studs("November 15 to April 1"),
    fee: fee("$1 per tire"),
    inspection: inspect("Listed as requiring a biennial inspection."),
  },
  "south-carolina": { studs: studs("if studs project less than 1/16 inch when compressed"), fee: fee("$2 per tire") },
  "south-dakota": { studs: studs("October 1 to April 30") },
  tennessee: { studs: studs("October 1 to April 15"), fee: fee("$1.35 per tire") },
  utah: { studs: studs("October 15 to March 31"), fee: fee("$1 per tire") },
  vermont: {
    studs: studs("with no date window"),
    fee: noFee(),
    inspection: inspect("Listed as requiring an annual safety inspection."),
  },
  virginia: {
    studs: studs("October 15 to April 15"),
    fee: fee("$2 per tire (figure doubtful)"),
    inspection: inspect("Listed as requiring an annual safety inspection."),
  },
  washington: { studs: studs("November 1 to March 31"), fee: fee("$1 per tire, plus $5 on studded tires") },
  "west-virginia": { studs: studs("November 1 to April 15"), fee: noFee() },
  wisconsin: { studs: studs("only for some vehicles, such as rural mail carriers, November 15 to April 1"), fee: noFee() },
  wyoming: { studs: studs("with no date window"), fee: noFee() },
};

/**
 * Every jurisdiction's data, keyed by slug. Pilot states carry copy; the
 * rest carry draft facts only (and `climateSource`, the summary to research).
 */
export const STATE_DATA = Object.fromEntries([
  ...Object.entries(PILOT).map(([slug, d]) => [slug, { ...d, hasCopy: true }]),
  ...Object.entries(DRAFTS).map(([slug, facts]) => [
    slug,
    { facts, climate: [], faq: [], tireType: [], hasCopy: false },
  ]),
]);

/** The copy every state page shares: short on purpose (the overlap test). */
export const STATE_PAGE_SHARED = {
  shipSteps: [
    {
      title: "Order online",
      body: "Pick tires by vehicle or by size. Shipping is free to any street address in the 48 contiguous states and DC, with no order minimum.",
    },
    {
      title: "Ships from a distributor",
      body: "Your order ships from a distributor warehouse that stocks your size, so a set can come in more than one parcel.",
    },
    {
      title: "Tracking by email",
      body: "Once the carrier has a tracking number, we email it to you. You can also look the order up on Track Order.",
    },
  ],
  askShop: [
    "Do you mount and balance tires a customer brings in?",
    "What do you charge per tire to mount, balance, replace valve stems or service TPMS sensors, and to take the old tires?",
    "Can you reset the tire-pressure warning light after the swap?",
  ],
  bring:
    "Bring the tires and your TireDrop order confirmation, so the shop can match the size, load index and speed rating on each sidewall to your order before anything is mounted. A mounted tire can't be returned.",
  shopNote:
    "Any tire shop that mounts customer tires can do this; we don't recommend particular shops.",
  legal:
    "A plain-English summary with a source for each line, not legal advice.",
  toolsLede: "Free checks before you order",
  tools: [
    { label: "Load & Speed Rating Check", to: "/load-speed-check" },
    { label: "Plus Size Calculator", to: "/plus-size-calculator" },
    { label: "Do I Need Tires Yet?", to: "/tire-check" },
  ],
};

/** A live state's page data (name and neighbours merged in), or null. */
export function buildStatePage(meta) {
  if (!meta) return null;
  const data = STATE_DATA[meta.slug];
  if (!data?.hasCopy) return null;
  return { ...meta, ...data };
}

/** The facts a page shows, in display order: [[key, fact], ...]. */
export function shownFacts(page) {
  return Object.keys(FACT_LABELS)
    .map((k) => [k, page.facts[k]])
    .filter(([, f]) => isShown(f));
}

/** The climate lines a page shows. */
export const shownClimate = (page) => page.climate.filter(isShown);
