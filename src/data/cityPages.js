// The mobile tire installation city pages: /mobile-service/<slug>, one per
// city, rendered by src/pages/services/MobileCityPage.jsx under the
// /mobile-service hub. Wave 1 of docs research (local SEO, 2026-10-01).
//
// Plain data with no imports, so cityPages.test.mjs can check it under Node:
// every ZIP passes isInServiceArea(), the copy follows the house rules, and
// no two city pages read alike (the overlap test).
//
// FACTS: only what is verified and cited. Every ZIP, road and neighbourhood
// on the 7 batch 2 pages and the 6 pages added 2026-10-18 has a source line
// in docs/audits/2026-10-18-city-facts.md; anything unconfirmed is left out
// (every city page now lists ZIPs). No drive times, no
// distances, no arrival times: roads and routes only, and "we confirm an
// arrival window when we book". Justin (2026-10-01) approved saying a city
// is close to the shop ("next door", "a short drive") with no minutes or
// miles, and naming routes we're sure of.
//
// ROADSIDE: the vans help with flats on side streets, in parking lots, at
// homes and workplaces during shop hours; never on a highway or expressway
// shoulder (Justin, 2026-10-01).
//
// ELIGIBILITY is never decided here. The van goes wherever the ZIP is in
// Miami-Dade, Broward or Palm Beach (src/data/serviceArea.js); the ZIPs below
// are for reading only.
//
//   slug          URL segment, "{city}-fl"
//   name          city name as written on the page
//   county        "Broward", "Miami-Dade" or "Palm Beach"; one of SERVICE_COUNTIES
//   population    2020 Census figure from the research, for the intro
//   zips          main ZIP codes (verified lists only; PO Box ZIPs left out)
//   areas         neighbourhoods and landmarks (verified only)
//   roads         main roads (verified or cited only)
//   route         one line on how the van gets there, by road; never a time
//   roadside      the city's "Flat tire help" lede
//   intro         the hero lede
//   whereWeWork   paragraphs for "Where we work in {name}"
//   conditionsTitle, conditions   the local driving or tire notes
//   around        optional: paragraphs for "Roads and areas around {name}"
//   beforeWeCome  optional: { lede, points[] } for "What to know before we come"
//                 (both are on the four deepened pages, 2026-10-04; each line
//                 is sourced in docs/audits/2026-10-04-city-depth.md)
//   faq           4–7 city questions
//   nearby        2–6 neighbouring city slugs
//   seoTitle      <title> before " | TireDrop" (unique, ≤ 60 with suffix)
//   description   meta description, ≤ 160 characters
//   nearbyTitle   optional: heading for the nearby list when "Nearby" would overstate it (Miami, Homestead, the I-95 pages)

/** Justin's wording for the one place the van won't work (2026-10-01). */
const HIGHWAY_LINE =
  "Stuck on a highway or expressway shoulder? For your safety, call 911 or *347 (FDOT Road Rangers) first. Once you're off the highway, call us.";

export const CITY_PAGES = [
  {
    slug: "sunrise-fl",
    name: "Sunrise",
    county: "Broward",
    population: 97335,
    zips: ["33313", "33319", "33322", "33323", "33325", "33326", "33351"],
    areas: [
      "Sawgrass Mills area",
      "Welleby",
      "Springtree",
      "Sunrise Lakes",
      "Sunrise Golf Village",
    ],
    roads: [
      "Oakland Park Blvd (SR 816)",
      "Sunrise Blvd (SR 838)",
      "Commercial Blvd",
      "University Dr",
      "Pine Island Rd",
      "Nob Hill Rd",
      "Hiatus Rd",
      "Flamingo Rd (SR 823)",
      "Sawgrass Expressway (SR 869)",
      "Florida's Turnpike",
    ],
    route:
      "The shop is on Oakland Park Blvd, which runs west to the Sawgrass Expressway at exit 3 and east all the way to A1A. The closest Turnpike interchanges are Sunrise Blvd (exit 58) and Commercial Blvd (exit 62); Oakland Park Blvd crosses the Turnpike without one.",
    intro:
      "Our Extreme Tires shop is right here in Sunrise on West Oakland Park Blvd, near University Dr, and the Extreme Tires vans work out of it, so Sunrise is home ground. Pick your tires on TireDrop, choose mobile installation at checkout, and a technician brings them to your driveway, your condo lot or your workplace in Sunrise and fits them there. Rather drive over? The shop is in town, and ship-to-store is free.",
    whereWeWork: [
      "The main Sunrise ZIP codes are the seven below, and several of them cross city lines. 33313 and 33322 also take in parts of Plantation, 33325 reaches into Plantation and Davie, and 33326 is shared with Weston. That is exactly why the van goes by ZIP code and not by the city name on the envelope. All seven are Broward County ZIPs, so every one of them is in.",
      "One to skip: 33345 is a Sunrise PO Box ZIP, with no street address behind it. Book with the ZIP of the place the car will actually be parked.",
    ],
    roadside:
      "Flat in your driveway in Welleby, in a parking lot near Sawgrass Mills or outside your office? Call during shop hours and the van comes from just down the road. That's mobile flat tire repair in Sunrise: the tire fixed where it sits if it can be, or your spare on if it can't.",
    conditionsTitle: "Driving in Sunrise",
    conditions: [
      "Sunrise's main roads are the Oakland Park, Sunrise and Commercial boulevards, crossed by University Dr, Pine Island Rd, Nob Hill Rd, Hiatus Rd and Flamingo Rd. Boulevard miles mean a lot of turning, braking and pulling away from lights, and on a front-wheel-drive car the front tires take most of it. Rotating the set on schedule spreads that wear across all four.",
      "On the west side the Sawgrass Expressway adds steady highway speed, which is where a wheel out of balance shows itself: a shake through the steering wheel that comes in around highway speed. Balancing is one of the jobs the van does in your driveway.",
    ],
    faq: [
      {
        q: "I live in Sunrise. Is it easier to bring the car to the shop?",
        a: "Sometimes. The shop is at 7712 West Oakland Park Blvd, open Monday to Friday 8:00 AM to 6:30 PM and Saturday 8:00 AM to 4:00 PM. Ship your tires free to the store at checkout and book a bay fitting, charged per tire. The van is the better pick when you can't spare the car, or the time it takes to sit and wait.",
      },
      {
        q: "My ZIP is 33326. Am I in Sunrise or Weston?",
        a: "Either, depending on the street, and it makes no difference to us. 33326 covers addresses in both cities, both are in Broward County, and the van comes to the whole ZIP. The booking form and checkout check it for you.",
      },
      {
        q: "Can I book with 33345?",
        a: "No. 33345 is a Sunrise PO Box ZIP, so there is no street address behind it for the van to come to. Use the ZIP of the place the car will be parked: your home, your building or your workplace.",
      },
      {
        q: "I have a flat on the Turnpike near Sunrise. Can the van come?",
        a: "Not to the Turnpike itself: we don't work on highway or expressway shoulders. For your safety, call 911 or *347 (FDOT Road Rangers) first. Once you're off the highway, on a side street or in a parking lot, call us and the van comes to you there during shop hours.",
      },
    ],
    nearby: ["plantation-fl", "tamarac-fl", "weston-fl", "davie-fl", "lauderhill-fl", "oakland-park-fl"],
    seoTitle: "Mobile Tire Service in Sunrise, FL",
    description:
      "Tires from TireDrop fitted at your home or work in Sunrise, FL by the Extreme Tires van from our Oakland Park Blvd shop. Sunrise ZIPs, roads and local answers.",
  },
  {
    slug: "plantation-fl",
    name: "Plantation",
    county: "Broward",
    population: 91750,
    // 33388 is in the research's list but looks like a PO Box ZIP; left out
    // until it is checked (PO Box ZIPs have no street to work on).
    zips: ["33313", "33317", "33322", "33324", "33325"],
    areas: ["Plantation Acres", "Jacaranda", "Central Park area"],
    roads: [
      "I-595",
      "Broward Blvd",
      "Sunrise Blvd",
      "Peters Rd",
      "University Dr",
      "Pine Island Rd",
      "SR 7 / US 441",
    ],
    route:
      "From the shop on Oakland Park Blvd, University Dr and Pine Island Rd both run into Plantation, and they are the same local roads that lead to I-595.",
    intro:
      "Plantation, a Broward city of 91,750 people at the 2020 Census, is next door to our Extreme Tires shop in Sunrise, where the Extreme Tires vans are based. Buy tires on TireDrop, choose mobile installation, and the Extreme Tires van fits them at your house in Plantation Acres or Jacaranda, at your office, or wherever the car spends the day. No drop-off, no waiting room, no ride to arrange.",
    whereWeWork: [
      "The main Plantation ZIP codes are 33313, 33317, 33322, 33324 and 33325, and they overlap with the cities around them. 33313 and 33322 also take in parts of Sunrise; 33317, 33324 and 33325 are shared with Davie, and 33325 reaches into Sunrise as well. Because the van goes by ZIP, an address on any of them is covered whether it reads Plantation, Sunrise or Davie.",
      "Neighbourhoods listed here are examples, not a limit on where we go: Plantation Acres, Jacaranda and the Central Park area. Your street doesn't need to be on the list; the ZIP is what counts.",
    ],
    roadside:
      "A nail on Peters Rd, a flat in an office lot off Broward Blvd, a soft tire in your Jacaranda driveway: call during shop hours and we come out. Mobile flat tire repair in Plantation means the tire is inspected from the inside and fixed if it can be, and your spare goes on if it can't.",
    conditionsTitle: "Driving in Plantation",
    conditions: [
      "Plantation's main roads include Broward Blvd, Sunrise Blvd, Peters Rd, University Dr, Pine Island Rd and SR 7/US 441, with I-595 for longer runs. A week of boulevard errands and a week of interstate commuting wear a set differently: the first scuffs the front shoulders on every turn, the second builds heat at speed.",
      "Two habits cover both. Rotate every 5,000 to 7,000 miles, the Tire Industry Association's suggestion (your owner's manual comes first), so the four wear together. And if you commute on I-595, check pressure once a month with the tires cold; a tire running a few psi low flexes more and builds more heat at highway speed.",
    ],
    faq: [
      {
        q: "Can the van get to a house in Plantation Acres?",
        a: "If the ZIP is in our area, yes. Tell us about the property when you book: a long driveway, a gate and its code, or where on the lot the car will be. The technician needs a firm, level spot beside the car with room on the work side; a paved driveway or a flat stretch of street does it.",
      },
      {
        q: "My HOA has rules about work in driveways. What should I do?",
        a: "Check them before you book. Some associations restrict commercial vehicles, or work in driveways, or set hours for it. If yours won't allow it, have the tires fitted at your workplace instead, or ship them free to the Sunrise shop and book a bay.",
      },
      {
        q: "Is 33324 Plantation or Davie?",
        a: "Both: 33324 takes in parts of Plantation and Davie. Both are in Broward County, so it doesn't matter which name is on your address. The van goes by the five-digit ZIP.",
      },
      {
        q: "Can the van rotate and balance my tires while it's here?",
        a: "Rotation, balancing, puncture repair, TPMS service, wheel installation and oil changes are all van work. Tell us everything you want when you book and we'll tell you what fits in the visit. Alignment is the exception: it needs a rack, so it's a shop job in Sunrise.",
      },
    ],
    nearby: ["sunrise-fl", "davie-fl", "fort-lauderdale-fl"],
    seoTitle: "Mobile Tire Service in Plantation, FL",
    description:
      "Tires from TireDrop fitted in your Plantation, FL driveway or office lot by the Extreme Tires van. Plantation ZIPs, roads, HOA tips and on-site service.",
  },
  {
    slug: "tamarac-fl",
    name: "Tamarac",
    county: "Broward",
    population: 71897,
    // ZIPs: the four Standard ZIPs on both the Wikipedia infobox and the
    // zip-codes.com list for Tamarac (2026-10-18, docs/audits/2026-10-18-city-facts.md).
    // 33320 and 33359 are PO Box ZIPs and stay off the list. Roads and
    // neighbourhoods are the Wikipedia ones the city-depth fact sheet allows
    // (2026-10-04); see docs/audits/2026-10-04-city-depth.md.
    zips: ["33309", "33319", "33321", "33351"],
    areas: [
      "Tamarac Lakes Sections One and Two",
      "Tamarac Lakes North and South",
      "Mainlands of Tamarac Lakes",
      "The Woodlands",
    ],
    roads: ["Commercial Blvd (SR 870)", "US 441 / SR 7"],
    route:
      "Tamarac is next door to the shop: the van heads north from Oakland Park Blvd on University Dr.",
    intro:
      "Tamarac, a Broward County city of 71,897 people at the 2020 Census, is next door to our Extreme Tires shop in Sunrise. Buy tires on TireDrop, choose mobile installation, and a technician in the Extreme Tires van fits them where you live or work in Tamarac: mounted, balanced, lug nuts torqued to spec and pressures set, with your old set hauled away.",
    whereWeWork: [
      "The neighbourhood isn't what decides coverage. The ZIP code where the car is parked is. The main Tamarac ZIP codes are 33309, 33319, 33321 and 33351, and they cross city lines: directories list 33309 with Lauderdale Lakes and Oakland Park, 33319 with Lauderhill and Sunrise, and 33321 and 33351 with Lauderhill (33351 with Sunrise too). All four are Broward County ZIPs, so every one of them is in. If the ZIP is in Miami-Dade, Broward or Palm Beach County, the van comes. Type it into the checker below; checkout and the booking form run the same check.",
      "One to skip: 33320 and 33359 are Tamarac PO Box ZIPs, with no street address behind them. Book with the ZIP of the place the car will actually be parked. Live behind a gate? Give us the gate code, or the name the guardhouse should have on its list, when you book, and check whether your association wants service vehicles registered ahead of time.",
    ],
    roadside:
      "A flat at home, in a community lot or in a shopping center parking lot in Tamarac doesn't have to wait for a tow. Call during shop hours for flat tire help in Tamarac: the van changes the tire or puts your spare on, and repairs the flat where a repair is possible.",
    around: [
      "Commercial Blvd (SR 870) has junctions with Florida's Turnpike and with US 441 (SR 7) in Tamarac, and it meets University Dr (SR 817) at the line between Sunrise and Tamarac. SR 7 is a major boundary reference in the city, with development on both sides of it. A cross street or a landmark on one of those roads helps when you book.",
      "Tamarac Lakes has named sections (Sections One and Two, Tamarac Lakes North and South, and the Mainlands of Tamarac Lakes), and The Woodlands is another named area. If yours isn't one of them, nothing changes: the van goes by the ZIP where the car is parked.",
    ],
    beforeWeCome: {
      lede: "Many Tamarac communities are 55+ condo or single-family communities, and condo and 55+ communities have their own rules for access and parking. This is general advice, not a rule we set.",
      points: [
        "Confirm with your association before you book whether service vehicles may come in, and where one may park.",
        "Tell us where the car is: a numbered space, a covered spot or a visitor lot. The technician needs room beside the car, on the work side.",
        "If the association wants the visit on its list ahead of time, sort that out before the day, so the technician isn't held at the entrance.",
      ],
    },
    conditionsTitle: "Tire notes for Tamarac drivers",
    conditions: [
      "Whatever roads you take, heat is the constant in South Florida. Tire pressure moves about 1 psi for every 10°F, according to NHTSA, so a tire set on a cool morning reads higher by mid-afternoon and drops back overnight. Set it cold, to the number on the driver's door placard, not the maximum printed on the sidewall.",
      "If the car mostly makes short trips around town, a slow leak can go unnoticed for weeks, because the tire never gets far enough to feel wrong. A monthly check with a gauge catches it before the TPMS light does, and a nail in the tread area may be repairable rather than meaning a new tire.",
    ],
    faq: [
      {
        q: "Do I need to be home while you work?",
        a: "Not for the whole visit. We need the car unlocked or the keys handed over, the wheel lock key if your wheels have locking lug nuts, and room for the van beside the car. Hand over the keys and go back inside; the technician knocks when the car is done.",
      },
      {
        q: "I live in a gated community in Tamarac. How does the van get in?",
        a: "Give us the gate code, or the name the guardhouse should have on its list, when you book. Some associations ask that service vehicles be registered ahead or work in visitor parking. Check yours, tell us, and we'll follow it.",
      },
      {
        q: "My address says Tamarac but a map shows another city. Which do I use?",
        a: "Use the ZIP. The van's area is decided by ZIP code, not by the city name, and the booking form and checkout both check it. If the ZIP is in Broward, Miami-Dade or Palm Beach County, you're covered.",
      },
      {
        q: "My tires were shipped to my house. Can the van fit them there?",
        a: "Yes. Leave the boxed tires where the technician can reach them, in the garage or by the door, and tell us where when you book. If you haven't ordered yet, you can also ship them free to the Sunrise shop at checkout and the van brings them out to you.",
      },
      {
        q: "What if my tire can't be repaired?",
        a: "Under USTMA practice, a puncture up to 1/4 inch in the tread area may be repairable with a plug and patch fitted from the inside, once the tire is off the wheel and inspected. Damage in the sidewall or shoulder can't be repaired, so that tire has to be replaced. Order the new one on TireDrop and we fit it.",
      },
      {
        q: "I live in a 55+ community in Tamarac. Can the van come?",
        a: "Coverage follows the ZIP, not the type of community, so if your ZIP is in Broward, Miami-Dade or Palm Beach County the van can come. Many Tamarac communities are 55+ condo or single-family communities with their own access and parking rules, so check with your association first, then tell us where the car is parked and what the gate needs.",
      },
    ],
    nearby: ["sunrise-fl", "coral-springs-fl", "lauderhill-fl"],
    seoTitle: "Mobile Tire Service in Tamarac, FL",
    description:
      "TireDrop tires fitted at your Tamarac, FL home or gated community by the Extreme Tires van from Sunrise. How the ZIP check works and what to have ready.",
  },
  {
    slug: "coral-springs-fl",
    name: "Coral Springs",
    county: "Broward",
    population: 134394,
    zips: ["33065", "33067", "33071", "33076"],
    // The research marked roads and neighbourhoods unverified; these are the
    // city-depth fact sheet's (2026-10-04): Wikipedia, AARoads and coralsprings.gov.
    areas: [
      "Sample Rd and University Dr redevelopment hub",
      "Coral Springs Commerce Park",
    ],
    roads: ["Sawgrass Expressway (SR 869)", "Sample Rd", "University Dr"],
    route:
      "The van takes the Sawgrass Expressway or University Dr north from the shop.",
    intro:
      "Coral Springs, a Broward County city of 134,394 people at the 2020 Census, is a short drive from our Extreme Tires shop in Sunrise up the Sawgrass Expressway or University Dr. Your new set gets ordered on TireDrop; the fitting happens in Coral Springs, on your driveway or in your office lot, because the balancer, tire changer and torque wrenches ride along in the Extreme Tires van.",
    whereWeWork: [
      "The main Coral Springs ZIP codes are 33065, 33067, 33071 and 33076. Two of them, 33067 and 33076, also cover parts of Parkland, so if your address says Parkland on one of those ZIPs, you're covered too. All four are Broward County ZIPs.",
      "What we look at is the five-digit code for the spot the car will sit in, never the town printed above it. Unsure about yours? Put it in the checker below and it answers on the spot, using the same rule as checkout.",
    ],
    roadside:
      "Picked up a screw on the way to work, or found a flat in a Coral Springs parking lot after errands? That's what the van's flat tire help in Coral Springs is for, during shop hours: the tire repaired on the spot when it qualifies, swapped for your spare when it doesn't.",
    around: [
      "Coral Springs borders Parkland to the north, Coconut Creek to the east, Margate and North Lauderdale to the southeast and Tamarac to the south, with the Everglades to the west.",
      "The Sawgrass Expressway (SR 869) borders the city on its north and west edges. Its exits include Atlantic Blvd (exit 8), Sample Rd (exit 11), Coral Ridge Dr (exit 14) and University Dr (exit 15, on the Parkland and Coral Springs line). Sample Rd and University Dr is the city's redevelopment hub.",
      "Coral Springs Commerce Park covers 442 acres off the Sawgrass Expressway. Fitting tires in a workplace lot while you work is the same job as anywhere else in the city, once the lot has room and the property allows service vehicles.",
    ],
    beforeWeCome: {
      lede: "Two things are worth planning for in Coral Springs: heavy rain, and the lot you park in.",
      points: [
        "The City of Coral Springs' Stormwater Master Plan lists \"frequent flooding during strong rain\" as a current challenge, and most canals are not city-managed. After a heavy downpour, look each tire over for nails, cuts and bulges, because water on the road can cover debris.",
        "At an office park or another workplace, a quick word with property management about service vehicles is worth it. That's general advice, not a rule we set.",
        "Tell us the building, the lot and where you parked, and leave room beside the car on the work side.",
      ],
    },
    conditionsTitle: "Tire notes for Coral Springs drivers",
    conditions: [
      "Florida sun and heat age rubber whether the car is driven or not. Every tire carries a DOT date code on the sidewall, four digits for the week and year it was made, and an older tire can show plenty of tread and still be cracking at the sidewall. Ask the technician to point out the code on the old set and on the new one.",
      "Tread is the other half. NHTSA and USTMA use 2/32 inch as the point to replace a tire, where the tread-wear bars sit flush, and Consumer Reports' testing supports considering new tires at 4/32 inch, because wet-road braking gets worse as tread wears. In a summer downpour that matters. If you're not sure where yours stand, our tire check walks you through measuring them before you order.",
    ],
    faq: [
      {
        q: "I live in Parkland on a 33076 address. Do you come?",
        a: "Yes. 33067 and 33076 straddle Coral Springs and Parkland, and Parkland is Broward too. Book as normal; checkout reads the ZIP and confirms it.",
      },
      {
        q: "Can you fit the tires at my office while I work?",
        a: "Yes, if the lot has space alongside your car for the van and the property allows service vehicles. Give us the building, the lot and where you parked, leave the keys at the front desk and note the details at checkout or in the install notes, then go back to work.",
      },
      {
        q: "Should I ship the tires to my house or to the shop?",
        a: "Either works. Shipped to your house, they wait for the van in your garage. Shipped free to the Sunrise shop, the van loads them and brings them out, so there's nothing to store or carry. Choose at checkout, then book the install.",
      },
      {
        q: "I bought new wheels as well. Can the van fit those too?",
        a: "Yes. Wheel installation is van work: the tires are mounted and balanced on the new wheels, the lug hardware and hub-centric rings checked, and your TPMS sensors moved over or programmed. Order the wheels and tires together on TireDrop and book one visit.",
      },
      {
        q: "How do I know it's time for new tires?",
        a: "Check the tread depth and the age. NHTSA and USTMA use 2/32 inch as the replace point, and the DOT code on the sidewall tells you when the tire was made. Our tire check walks you through both, and the technician can measure each tire when the van is there.",
      },
      {
        q: "Can the van fit tires at an office park off the Sawgrass Expressway?",
        a: "If the ZIP of the lot is in our area (the checker tells you), yes, as long as there is room beside your car and the property allows service vehicles. Coral Springs Commerce Park covers 442 acres off the Sawgrass Expressway, and any workplace lot works the same way: give us the building, the lot and where you parked.",
      },
      {
        q: "Is it worth checking my tires after heavy rain in Coral Springs?",
        a: "Yes, it is worth a look after a strong storm. Check each tire for nails, cuts and bulges and measure the tread. The technician can say which tire can be fixed and which needs replacing.",
      },
    ],
    nearby: ["tamarac-fl", "sunrise-fl"],
    seoTitle: "Mobile Tire Service in Coral Springs, FL",
    description:
      "TireDrop tires fitted at your Coral Springs, FL home or office by the Extreme Tires van. Parkland ZIPs 33067 and 33076 included, plus flat tire help.",
  },
  {
    slug: "davie-fl",
    name: "Davie",
    county: "Broward",
    population: 105691,
    zips: ["33314", "33317", "33324", "33325", "33328", "33330", "33331"],
    areas: [
      "Pine Island Ridge",
      "Forest Ridge",
      "Flamingo Gardens",
      "Tree Tops Park",
      "Long Key Natural Area",
      "Nova Southeastern University area",
      "South Florida Education Center area",
    ],
    // The research's Davie road list was unverified; these are the roads
    // Davie's own Local Roads Master Plan names (city-depth fact sheet, 2026-10-04).
    roads: [
      "Griffin Rd (SR 818)",
      "Nova Dr",
      "Hiatus Rd",
      "Flamingo Rd",
      "University Dr (SR 817)",
      "Nob Hill Rd",
      "Orange Dr",
      "Pine Island Rd",
      "Davie Rd",
      "Stirling Rd",
      "Weston Rd",
      "Sheridan St",
      "Oakes Rd",
    ],
    route:
      "The van heads south from the shop on University Dr, or takes I-595.",
    intro:
      "Davie, in Broward County, had 105,691 people at the 2020 Census, and it's a short drive from our Extreme Tires shop in Sunrise down University Dr or along I-595. Choose the tires on TireDrop and the Extreme Tires van brings them to a Pine Island Ridge or Forest Ridge driveway, an employer's lot or any other Davie address, then takes the worn set away for recycling.",
    whereWeWork: [
      "Davie spreads across seven main ZIP codes: 33314, 33317, 33324, 33325, 33328, 33330 and 33331. Plenty of them are shared. 33317, 33324 and 33325 also cover parts of Plantation, 33325 reaches into Sunrise, and 33331 is shared with Weston. Since the van works by ZIP, an envelope reading Plantation, Sunrise or Weston changes nothing for a Davie street on one of those codes.",
      "Pine Island Ridge and Forest Ridge are two Davie neighbourhoods we serve, and they are examples, not a limit on where we go. If yours isn't named, the ZIP checker below gives the answer.",
    ],
    roadside:
      "A flat in your Pine Island Ridge driveway, an office parking lot or a side street in Forest Ridge: call during shop hours. Mobile flat tire repair in Davie starts with the technician taking the tire off and checking the inside, then repairing it or fitting your spare.",
    around: [
      "Davie's Local Roads Master Plan names the roads listed above. One of them, Griffin Rd (SR 818), runs through Davie, crosses University Dr (SR 817), has a Florida's Turnpike interchange and forms the Davie and Cooper City border.",
      "Davie has a strong equestrian character: horseback riding is common, and the Local Roads Master Plan includes an Equestrian Trails layer. Named places include Flamingo Gardens, Tree Tops Park and Long Key Natural Area, along with the Nova Southeastern University and South Florida Education Center campus areas. Whichever one is near you, the van goes by the ZIP where the car is parked.",
    ],
    beforeWeCome: {
      lede: "A few details are worth mentioning when you book a Davie visit. This is general advice, not a rule we set.",
      points: [
        "A rural or gravel driveway: say so, and say where on the property the car sits. The technician needs firm, level ground beside the car.",
        "A gate: give us the gate code when you book.",
        "A campus or workplace lot: tell us the building and the lot, and check that the property allows service vehicles.",
      ],
    },
    conditionsTitle: "Tire notes for Davie drivers",
    conditions: [
      "Building sites, roadwork and storm cleanup all leave screws and nails on the road, and one lodged in the tread can let air out slowly for weeks. Don't pull it out: the fastener is often plugging the hole until the tire comes off the wheel.",
      "Location decides the outcome more than the size of the screw. Industry practice only allows fixing small holes in the middle band of the tread, sealed from inside with a combined plug and patch; a hole near the edge of the tread or in the sidewall rules a repair out. Our repair check lets you tap the spot on a diagram and see which side of that line you're on, and the van handles either outcome at home.",
    ],
    faq: [
      {
        q: "Is 33331 Davie or Weston?",
        a: "It covers parts of both, and both are in Broward County, so the van comes either way. Book with the ZIP of the place the car is parked and checkout confirms it.",
      },
      {
        q: "I have a screw in my tire. Can the van patch it at home?",
        a: "It depends where it is. Leave the screw in and book a tire repair. The technician dismounts the tire and looks at the inner liner before deciding; a small hole in the tread gets a plug-patch, while edge or sidewall damage means replacing that tire.",
      },
      {
        q: "Can you work at a house with a long driveway or a gate?",
        a: "Usually. Mention it at booking: the gate code, which part of the property the car sits on, and anything about the drive the technician should expect. Packed gravel or pavement next to the car is ideal; soft grass after rain is not.",
      },
      {
        q: "I can't find my wheel lock key. Is that a problem?",
        a: "It can be, so look before the visit. Locking lug nut keys usually live in the glovebox, the center console, or under the trunk floor with the jack. If it's gone, say so when you book; a locking nut without its key needs a removal tool, and it's better that the technician knows ahead.",
      },
      {
        q: "Do you do alignments in Davie?",
        a: "Not by van. An alignment needs a rack, so it happens at the Sunrise shop. If you're getting new tires and the old ones wore unevenly, book the alignment at the shop and the mobile install separately, or have both done in the bay.",
      },
      {
        q: "Can you fit tires at a campus or workplace lot in Davie?",
        a: "If the lot's ZIP is in our area and the property allows service vehicles, yes. Tell us the building and the lot, check with the property that service vehicles are allowed, and have the keys and any gate code ready when you book.",
      },
      {
        q: "My address is near Griffin Rd. Is that Davie or Cooper City?",
        a: "Griffin Rd forms the Davie and Cooper City border, so an address near it can read either name. Use the ZIP: if the ZIP where the car is parked is in Miami-Dade, Broward or Palm Beach County, the van comes, and the checker on this page confirms it.",
      },
    ],
    nearby: ["plantation-fl", "weston-fl", "fort-lauderdale-fl", "sunrise-fl", "pembroke-pines-fl", "hollywood-fl"],
    seoTitle: "Mobile Tire Service in Davie, FL",
    description:
      "Tires bought on TireDrop, fitted at your Davie, FL home or workplace by our Extreme Tires van. Davie ZIPs 33314 to 33331, puncture repair, what the van does.",
  },
  {
    slug: "fort-lauderdale-fl",
    name: "Fort Lauderdale",
    county: "Broward",
    population: 182760,
    zips: [
      "33301", "33304", "33305", "33306", "33308",
      "33309", "33311", "33312", "33315", "33316",
    ],
    areas: [
      "Las Olas",
      "Victoria Park",
      "Coral Ridge",
      "Rio Vista",
      "Galt Ocean Mile",
    ],
    roads: [
      "I-95",
      "I-595",
      "US-1 (Federal Hwy)",
      "A1A",
      "Broward Blvd",
      "Sunrise Blvd",
      "Oakland Park Blvd",
      "Las Olas Blvd",
      "SR 84",
    ],
    route:
      "The shop is on Oakland Park Blvd, and Oakland Park Blvd runs east from it to A1A, meeting I-95 at exits 31A and 31B on the way.",
    intro:
      "Fort Lauderdale is Broward's largest city, with 182,760 people at the 2020 Census, and a short drive east along Oakland Park Blvd from our Extreme Tires shop in Sunrise. Buy tires on TireDrop, choose mobile installation, and the Extreme Tires van fits them at your home, in your building's lot or at your office in Fort Lauderdale, from Victoria Park to Galt Ocean Mile.",
    whereWeWork: [
      "Fort Lauderdale has more main ZIP codes than any other city on our list: ten, from 33301 to 33316. All of them are Broward ZIPs, and the van goes by ZIP, not by neighbourhood, so Las Olas, Rio Vista, Coral Ridge and everywhere in between is covered.",
      "In a condo or high-rise, the garage is usually the question. Garages often have height limits and their own rules about outside work, so tell us the building name, the garage clearance if you know it, and whether the car can be moved to an open or visitor space. If the garage won't take the van, a surface lot or the street usually will.",
    ],
    roadside:
      "Flat in a condo lot on Galt Ocean Mile, in a parking garage near Las Olas or on a side street in Victoria Park? Call during shop hours for flat tire help in Fort Lauderdale. The technician repairs the tire where it's repairable or puts your spare on, wherever the van can reach the car.",
    conditionsTitle: "Driving in Fort Lauderdale",
    conditions: [
      "Fort Lauderdale's main roads include I-95, I-595, US-1 (Federal Hwy), A1A, Broward Blvd, Sunrise Blvd, Oakland Park Blvd, Las Olas Blvd and SR 84. In the 2023 floods the city took 25.9 inches of rain in about 12 hours. Standing water hides potholes and debris, and a tire with little tread left can't clear it fast enough to stay in contact with the road.",
      "After heavy rain, look the tires over for nails, cuts and bulges, and check the tread depth. A bulge means the tire's structure is damaged and it can't be repaired; a nail in the tread area may be repairable.",
    ],
    faq: [
      {
        q: "Can you install tires in a Las Olas condo garage?",
        a: "Often, and we work in condo lots every week. It depends on the garage clearance and the building's rules about outside work. Tell us the building and the garage height when you book. If the van can't get in, move the car to a surface lot, a visitor space or the street and we fit the tires there.",
      },
      {
        q: "I'm on I-95 with a flat. Can the van come?",
        a: "Not to I-95. Highway and expressway shoulders are the one place the van won't work. For your safety, call 911 or *347 (FDOT Road Rangers) first. Once you're off the interstate, in a lot or on a side street, call us and we come to the car during shop hours.",
      },
      {
        q: "Do you cover the beach side, out to A1A?",
        a: "Yes. Every Fort Lauderdale ZIP is in Broward County, and the van goes by ZIP, so Galt Ocean Mile and the rest of the beach side are covered the same as the rest of the city.",
      },
      {
        q: "My car sat in flood water. Should I replace the tires?",
        a: "Have them inspected before you drive far, because standing water hides nails, debris and potholes. The technician checks each tire for punctures, cuts and bulges and tells you which can be repaired and which need replacing.",
      },
    ],
    nearby: ["plantation-fl", "davie-fl"],
    seoTitle: "Mobile Tire Service in Fort Lauderdale, FL",
    description:
      "TireDrop tires fitted at your Fort Lauderdale home, condo lot or office by the Extreme Tires van, Las Olas to Galt Ocean Mile. Condo garage tips and ZIPs.",
  },
  {
    slug: "weston-fl",
    name: "Weston",
    county: "Broward",
    population: 68107,
    zips: ["33326", "33327", "33331", "33332"],
    // The research marked these unverified; the city-depth fact sheet
    // (2026-10-04, Wikipedia and westonfl.org) supplies the ones below.
    areas: [
      "Country Isles",
      "Windmill Ranch",
      "Emerald Estates",
      "Indian Trace development district",
      "Bonaventure development district",
    ],
    roads: [
      "Bonaventure Blvd",
      "Royal Palm Blvd",
      "Indian Trace",
      "Weston Rd",
      "Griffin Rd (SR 818)",
      "US 27",
      "I-75",
      "SR 84",
    ],
    route:
      "The van takes Oakland Park Blvd west to the Sawgrass Expressway, then heads south.",
    intro:
      "Weston, a Broward County city of 68,107 people at the 2020 Census, is a short drive from our Extreme Tires shop in Sunrise down the Sawgrass Expressway. The set you pick on TireDrop gets fitted by the Extreme Tires van in your Weston driveway or at work, so nobody has to drop the car anywhere, line up a ride back, or sit in a lobby while it's done.",
    whereWeWork: [
      "The main Weston ZIP codes are 33326, 33327, 33331 and 33332, and two of them are shared with neighbours: 33326 with Sunrise and 33331 with Davie. Every one sits in Broward, and since coverage follows the ZIP, the town name on your mail never decides it.",
      "Inside a community association? Many have their own service-vehicle rules, so read yours first and pass on any gate code or guard instructions at booking; that keeps the technician from being held at the entrance.",
    ],
    roadside:
      "Flat in the driveway before the school run, or in a Weston shopping plaza lot? Call during shop hours for mobile flat tire repair in Weston. We fix the tire where it sits if the damage is repairable, or swap on your spare, and fit a new tire once you've chosen one.",
    around: [
      "Weston's principal local roads are Bonaventure Blvd, Royal Palm Blvd, Indian Trace and Weston Rd. I-75 runs along the city's east edge and, along the north edge, as Alligator Alley. US 27 is on the west, SR 84 runs along the north border and the I-75 service road, and Griffin Rd (SR 818) is near the south border. I-595's western end is at the point where Weston, Sunrise and Davie meet.",
      "Weston has two development districts, Indian Trace and Bonaventure, and Country Isles, Windmill Ranch and Emerald Estates are named neighbourhoods. The western edge borders the Everglades. None of those names changes coverage: the van goes by the ZIP where the car is parked.",
    ],
    beforeWeCome: {
      lede: "Two things are worth planning for in Weston: standing water after heavy rain, and the gate.",
      points: [
        "The City of Weston's stormwater system is a set of interconnected lakes and canals, with more than 2,000 catch basins, 5 pump stations and 2,214 acres of lake and canal, and the city says unobstructed water flow in storms is essential to prevent flooding. Water that stands on the road can cover debris, so look each tire over after a downpour and tell us if the car sat in water.",
        "Controlled-access communities commonly use a manned gate, a transponder or both. That's general advice, not a TireDrop promise: give us your gate details when you book, so the technician isn't held at the entrance.",
        "Tell us where the car will be, a driveway, a plaza lot or a street, with room beside it on the work side.",
      ],
    },
    conditionsTitle: "Tire notes for Weston drivers",
    conditions: [
      "Uneven wear tells you something. A set that's worn on the inside or outside edge only, or in patches, usually points to alignment or worn suspension parts, and new tires fitted on top of that wear the same way. If your old set looks like that, book an alignment at the Sunrise shop after the install; the van can't do it, because it needs a rack.",
      "Even wear across the tread, with all four about the same depth, is what regular rotation buys you. The pattern depends on your drivetrain and whether the tread is directional, and our rotation tool shows the right one for your car.",
    ],
    faq: [
      {
        q: "My ZIP is 33326. Is that Weston or Sunrise?",
        a: "33326 spans streets in both cities. Weston and Sunrise are each in Broward, and coverage follows the ZIP, so you're in whichever name you use.",
      },
      {
        q: "My community has a guard gate. What do you need?",
        a: "Three things: your association's rules for contractors, a code or a name for the guard's list, and the parking spot. Pass them on at booking so the technician comes prepared.",
      },
      {
        q: "My old tires wore on one edge. Will new ones fix it?",
        a: "No. One-edge wear usually means the alignment is out, and new tires on an out-of-line car wear the same way. Have the van fit the new set, then book an alignment at the Sunrise shop, or have both done in the bay.",
      },
      {
        q: "I'm only replacing two tires. Where do they go?",
        a: "On the rear axle, whichever wheels drive the car. That's the tire makers' guidance: the deeper tread at the back helps the car hold its line in the wet. The technician moves the better two of your old set to the front.",
      },
      {
        q: "Can the van fit tires on an SUV or a pickup?",
        a: "Yes, for passenger and light truck tires. Tell us the vehicle and the tire size when you book so we can confirm the van's changer and balancer suit the job, or point you to the shop if they don't.",
      },
      {
        q: "Should I check my tires after heavy rain in Weston?",
        a: "Yes, it's worth a look. Weston's stormwater system is a network of lakes and canals, and the city says unobstructed water flow in storms is essential to prevent flooding. After a downpour, walk around the car, check each tire for nails, cuts and bulges, and measure the tread. A bulge can't be repaired; a nail in the tread area sometimes can be, and the technician finds out with the tire off the wheel.",
      },
      {
        q: "Does it matter which part of Weston I live in?",
        a: "No. Weston has two development districts, Indian Trace and Bonaventure, and named neighbourhoods such as Country Isles, Windmill Ranch and Emerald Estates, but coverage follows the ZIP code where the car is parked. If it's one of our Broward ZIPs, the van comes, and the ZIP checker on this page confirms it.",
      },
    ],
    nearby: ["sunrise-fl", "davie-fl", "pembroke-pines-fl"],
    seoTitle: "Mobile Tire Service in Weston, FL",
    description:
      "Bought tires on TireDrop? The Extreme Tires van fits them at your Weston, FL home or workplace. Weston ZIPs, gate and HOA tips, and what the van does.",
  },
  {
    slug: "pembroke-pines-fl",
    name: "Pembroke Pines",
    county: "Broward",
    population: 171178,
    // Batch 2 (2026-10-05); ZIPs, areas and roads added 2026-10-18, each
    // sourced in docs/audits/2026-10-18-city-facts.md. Each page's wording is
    // its own on purpose: the overlap test counts any five-word run found on
    // another page.
    zips: ["33023", "33024", "33025", "33026", "33027", "33028", "33029"],
    areas: ["West Pines, west of I-75", "Chapel Trail", "Silver Lakes", "Pembroke Shores Park", "C.B. Smith Park"],
    roads: ["Pines Blvd (SR 820)", "Pembroke Rd (SR 824)", "Florida's Turnpike", "Flamingo Rd (SR 823)", "University Dr (SR 817)", "US 27 (Okeechobee Rd)", "I-75"],
    route:
      "University Dr (SR 817) runs south from Sunrise through Plantation and Davie into Pembroke Pines, and Pines Blvd (SR 820) crosses it there.",
    intro:
      "Pembroke Pines counted 171,178 residents in the 2020 Census. Whichever driveway or parking space your car sits in, the Extreme Tires van, based at our Sunrise shop, can bring the tire work to it instead of the car going to a waiting room. Buy the set on TireDrop, ask for mobile installation, and the technician mounts, balances and torques the wheels on the spot.",
    whereWeWork: [
      "Three Broward neighbours blur together on the map and in the mailbox: Pembroke Pines, Hollywood and Miramar. A letter for a Pembroke Pines street can be addressed to Hollywood, and a Hollywood house can carry the Pembroke Pines name. Booking sidesteps the puzzle, since coverage is read from the ZIP code of the parking spot, not the town on the envelope.",
      "Seven ZIP codes cover most Pembroke Pines street addresses: 33023, 33024, 33025, 33026, 33027, 33028 and 33029, all in Broward County. Several are shared. 33023, 33025, 33027 and 33029 are also Miramar ZIPs, and 33024 and 33026 also carry the Cooper City name, so a Pembroke Pines street can read as any of those. Unsure about yours? The ZIP box on this page gives the answer before you book.",
    ],
    roadside:
      "Picture a flat on a weekday morning in Pembroke Pines: a driveway, an office lot, a shopping plaza. For flat tire help in Pembroke Pines, ring in shop hours and a technician brings the van to the car. The tire is repaired on the spot when the damage allows it, and the spare goes on when it does not.",
    around: [
      "Pines Blvd (SR 820) is the city's main east-west road. It begins at US 27 (Okeechobee Rd) on the western side, crosses I-75, Flamingo Rd (SR 823) and University Dr (SR 817), and turns into Hollywood Blvd at SW 60th Ave as it passes into Hollywood. Pembroke Rd (SR 824) starts at University Dr on the Miramar and Pembroke Pines boundary, and Florida's Turnpike runs through the city as well.",
      "The part of the city west of I-75 is called West Pines. Chapel Trail and Silver Lakes are named areas, and C.B. Smith Park and Pembroke Shores Park are two of the parks people use as landmarks. A cross street and the ZIP are all the technician needs."
    ],
    beforeWeCome: {
      lede: "If your home or building has an association, one phone call before booking can save a delay. Treat these as suggestions, not conditions of booking.",
      points: [
        "Ask the association or the building office whether a service van may enter, and where it can stand during the visit.",
        "Pass on the gate code, or the name the guard should have on the list, when you book.",
        "Describe the spot: driveway, numbered space or visitor lot. The technician works alongside the car, so a free strip down one side makes it easy.",
      ],
    },
    conditionsTitle: "Replacing two tires or four in Pembroke Pines",
    conditions: [
      "Not every replacement is a full set. When only two tires are bought, tire makers want the new pair behind, on the rear axle, regardless of which wheels drive the car. The reasoning is grip: the axle with deeper tread keeps the car steadier when the road is wet. The two old tires with more tread left then move to the front.",
      "A full set removes the question. For either job, read the size molded into the sidewall of a tire on the car, a string like 225/65R17, and quote it when you book. If you order on TireDrop, the size travels with the order.",
    ],
    faq: [
      {
        q: "Which city name should I give, Pembroke Pines or Hollywood?",
        a: "Give the street address as it appears on your mail, and the ZIP code separately. The ZIP is what we check, and coverage doesn't change with the city name. Try it in the box on this page and you will see the result before you book.",
      },
      {
        q: "I only need two new tires. Where do they go?",
        a: "On the rear axle. Tire makers recommend putting the new pair at the back, because the tires with more tread there keep the car steadier on wet roads. Mention in your booking that you are doing two, and the visit is planned around that.",
      },
      {
        q: "Does the van come to an office or shopping plaza in Pembroke Pines?",
        a: "Yes. The lot needs space next to your car, and the property has to let service vehicles in. Name the building, the lot and the row or spot.",
      },
      {
        q: "Is it better to ship the tires home or to your store?",
        a: "Both work. At home, the boxes wait for the van wherever you stack them. At our Sunrise shop, shipping is free, and the van collects the set there and brings it along.",
      },
      {
        q: "Could I drive to your shop rather than book the van?",
        a: "You could. The shop is in Sunrise and is open weekdays until 6:30 PM and Saturdays until 4:00 PM, with a per-tire fee for a bay fitting. People pick the van when they can't spare the car for the visit.",
      },
      {
        q: "Where does Pines Boulevard become Hollywood Boulevard?",
        a: "At SW 60th Avenue. SR 820 is called Pines Boulevard through Pembroke Pines and Hollywood Boulevard from that point, as it enters Hollywood. If your street is close to there, give the street address and the ZIP together: the ZIP is what we check.",
      },
      {
        q: "I live in West Pines, west of I-75. Is that covered?",
        a: "Yes, if the ZIP is, and every Pembroke Pines ZIP from 33023 to 33029 is a Broward County ZIP. I-75 is not a dividing line for coverage. Type the ZIP where the car is kept into the box on this page and it confirms.",
      },
    ],
    nearby: ["hollywood-fl", "miramar-fl", "davie-fl", "weston-fl"],
    seoTitle: "Mobile Tire Service in Pembroke Pines, FL",
    description:
      "Tires from TireDrop fitted at your Pembroke Pines, FL home or work by the Extreme Tires van. ZIPs 33023 to 33029, Pines Blvd, West Pines and a shop option.",
  },
  {
    slug: "hollywood-fl",
    name: "Hollywood",
    county: "Broward",
    population: 153067,
    zips: ["33019", "33020", "33021", "33023", "33024"],
    areas: ["Hollywood Beach", "Downtown Hollywood", "Young Circle", "Washington Park industrial area", "Anne Kolb Nature Center", "Harry Berry Park"],
    roads: ["Hollywood Blvd (SR 820)", "Pembroke Rd (SR 824)", "Sheridan St", "Johnson St", "Dixie Hwy", "Federal Hwy (US 1)", "A1A", "I-95"],
    route:
      "University Dr (SR 817) runs south from Sunrise to Pines Blvd (SR 820), which changes to Hollywood Blvd at SW 60th Ave and carries on east past I-95 and Dixie Hwy to A1A at the beach.",
    intro:
      "The 2020 Census put Hollywood at 153,067 people, and the Extreme Tires van can reach any Hollywood parking spot with a covered ZIP code. Our Sunrise shop is where the vans start out; the van carries the machines, so a set bought on TireDrop is fitted where you leave the car: the driveway, the lot at work or the space behind your building.",
    whereWeWork: [
      "Hollywood, Pembroke Pines and Miramar are close neighbours, and mail doesn't always respect the borders between them: an address can say Hollywood on a street that belongs to a neighbour. Nothing about that slows a booking. The van reads the ZIP code where the car is parked, and the city line on an envelope never enters into it.",
      "Five ZIP codes hold most Hollywood street addresses: 33019, 33020, 33021, 33023 and 33024, all in Broward County. 33021 also carries the Pembroke Park name, 33023 is shared with Miramar, Pembroke Pines and West Park, and 33024 with Cooper City and Pembroke Pines. Addresses on those five ZIPs are covered, and the ZIP box on this page checks any other.",
    ],
    roadside:
      "Spotted a flat in a Hollywood lot, by your front door or along a side street? Phone us in shop hours for mobile flat tire repair in Hollywood. Our technician reads the damage from the inside of the tire, repairs it if it qualifies and mounts your spare if it does not.",
    around: [
      "Hollywood Blvd (SR 820) is the city's long east-west road. Heading east it crosses Florida's Turnpike, US 441 (SR 7), I-95 and Dixie Hwy, meets US 1 (Federal Hwy) at Young Circle and ends at A1A. Pembroke Rd (SR 824) runs east to US 1 on the Hallandale Beach boundary, and Johnson St reaches the Broadwalk on the beach side.",
      "Downtown Hollywood, Hollywood Beach and the Washington Park industrial area are the named districts on the city's own website, with Harry Berry Park and the Anne Kolb Nature Center among its green spaces. Wherever you are among them, a cross street and the ZIP are all we need."
    ],
    beforeWeCome: {
      lede: "A few facts at booking keep a Hollywood visit smooth. They are our suggestions, nothing you must do.",
      points: [
        "Send the street address and ZIP together. A Hollywood address may share its ZIP with a neighbouring city, and the booking follows the ZIP.",
        "Name the spot: a driveway, a numbered bay, a visitor space or a curb.",
        "If the wheels have locking nuts, find the key beforehand. Drivers often keep it in the glovebox or the center console.",
      ],
    },
    conditionsTitle: "Heat, pressure and your Hollywood tires",
    conditions: [
      "Florida heat moves tire pressure: roughly 1 psi for each 10°F, according to NHTSA. A tire inflated on a cool morning therefore shows a higher number once the day warms up, and sinks back overnight. Take readings with the tires cold, before the car has been driven, and aim for the number on the door-jamb placard, never the maximum stamped into the sidewall.",
      "A monthly gauge check is cheap protection. Underinflated tires bend more with every turn of the wheel and run hotter, and a slow leak appears as a creeping number weeks before it becomes a flat.",
    ],
    faq: [
      {
        q: "My mail says Hollywood, but the street is near Pembroke Pines or Miramar. What do I do?",
        a: "Nothing special. Pick any of the three pages; the answer is identical because coverage is set by ZIP. Enter the ZIP where the car is kept and book.",
      },
      {
        q: "Do I have to stay with the car?",
        a: "No. Leave the car unlocked or hand over the keys, add the wheel lock key if there is one, and make sure a strip beside the car is free. You can go indoors, and the technician lets you know when the work is finished.",
      },
      {
        q: "The tire keeps losing air. Can that be handled at home?",
        a: "A puncture, yes in most cases. Book a flat repair: the wheel comes off, the inside of the tire is inspected, and a qualifying puncture is repaired. Where it can't be, a replacement is needed. Leave any nail where it sits until then.",
      },
      {
        q: "My building has a parking garage or lot. Will the van be allowed in?",
        a: "Buildings set their own rules for outside work. Ask the office, then give us the building name and the spot at booking. If the answer is no, free shipping to our Sunrise shop and a bay fitting is the other route.",
      },
      {
        q: "What does the air pressure number on the tire mean?",
        a: "The figure on the sidewall is the most the tire can hold. The right setting for your car is on the placard in the driver's door jamb, and NHTSA says to set it with the tires cold.",
      },
      {
        q: "Do you work in Downtown Hollywood or on the beach side?",
        a: "Yes. Both follow the same ZIP rule, and every Hollywood ZIP listed above is in Broward County. For a beachside building or a downtown garage, tell us the name, the level and any posted height limit, so the technician knows whether the van fits. If it does not, an open space elsewhere in the lot or on the street does the same job.",
      },
      {
        q: "Hollywood's website mentions king tide flooding. Should I check my tires after one?",
        a: "The city says low-lying coastal areas can flood during king tides. If the car has been through standing water, look at each tire for nails, cuts and bulges before long trips, and book a flat repair visit if you find one. The technician can tell you which damage can be repaired.",
      },
    ],
    nearby: ["davie-fl", "pembroke-pines-fl", "miramar-fl"],
    seoTitle: "Mobile Tire Service in Hollywood, FL",
    description:
      "Tires from TireDrop fitted at your Hollywood, FL home or work by the Extreme Tires van. ZIPs 33019 to 33024, Hollywood Blvd, the beach and downtown.",
  },
  {
    slug: "miramar-fl",
    name: "Miramar",
    county: "Broward",
    population: 134721,
    zips: ["33023", "33025", "33027", "33029"],
    areas: ["Historic Miramar", "Sunset Lakes", "Silver Shores", "Country Club Ranches", "Miramar Regional Park", "Miramar Town Center"],
    roads: ["Miramar Pkwy (CR 858)", "Florida's Turnpike", "Pembroke Rd (SR 824)", "University Dr (SR 817)", "Flamingo Rd (SR 823)", "Miramar Blvd"],
    route:
      "University Dr (SR 817) and Flamingo Rd (SR 823) both run south from Sunrise, through Davie and Pembroke Pines, to Miramar.",
    intro:
      "Miramar's 2020 Census count was 134,721. The Extreme Tires van, based at our Sunrise shop, serves Miramar addresses on the strength of their ZIP codes, and it fits new tires in the open: on your driveway, at your workplace or in front of your building. Pick tires on TireDrop, tick the mobile box at checkout and the old set leaves with the technician.",
    whereWeWork: [
      "Miramar touches Pembroke Pines and Hollywood, and some Miramar mail carries a neighbour's name. That is harmless here. What a booking turns on is the five-digit ZIP of the spot where the car will stand; across Miami-Dade, Broward and Palm Beach, a covered ZIP means the van is available.",
      "Miramar has four ZIP codes: 33023, 33025, 33027 and 33029, all in Broward County, and the city's own park listings carry addresses in the first three. All four are shared with Pembroke Pines, and 33023 also takes the West Park and Pembroke Park names, which is why mail for a Miramar street can read like a neighbour's. Check the ZIP of the spot where the car sits, not the name above it.",
    ],
    roadside:
      "After the school run, a plaza lot or a night in the driveway, a tire can be down. When you need flat tire help in Miramar, ring us during shop hours. The van can patch a qualifying puncture where the car stands, or swap in your spare when a patch isn't possible.",
    around: [
      "Miramar Pkwy (CR 858) is crossed by both University Dr and Flamingo Rd, and Pembroke Rd (SR 824) begins at University Dr on the Miramar and Pembroke Pines boundary, beside North Perry Airport. The city's own site places a water tower beside Florida's Turnpike, and its facility addresses use Miramar Blvd as well.",
      "Historic Miramar, Sunset Lakes, Silver Shores and Country Club Ranches all appear in the city's own lists of parks, facilities and projects. Miramar Regional Park holds the amphitheatre, and Miramar Town Center is home to a college campus. If your street is in none of them, nothing changes: the ZIP counts."
    ],
    beforeWeCome: {
      lede: "A little preparation helps the visit run smoothly. These are suggestions only.",
      points: [
        "Find the size on the sidewall of a tire on the car, a code in the pattern 245/45R18, and have it to hand. A TireDrop order already carries it.",
        "State how many tires you are doing, and whether the car has a full-size spare, a compact one or none.",
        "Say where the car will be, and leave a free strip alongside it.",
      ],
    },
    conditionsTitle: "Reading tread depth before you order",
    conditions: [
      "Water has to escape from under a tire, and tread is the channel it escapes through. NHTSA and USTMA name 2/32 inch as the replace-by point, the depth at which the wear bars sit level with the surface. Consumer Reports' testing backs thinking about new tires from 4/32 inch, since stopping distances on wet roads lengthen as the tread wears. A heavy summer storm is where drivers notice it first.",
      "Measure all four, in more than one spot. Front and rear tires wear at different speeds, and a tire that has worn unevenly says something about pressure, rotation or alignment. Our tire check explains how to take each reading before you order.",
    ],
    faq: [
      {
        q: "Does Miramar follow different rules from Pembroke Pines or Hollywood?",
        a: "No. All three sit in Broward, and one ZIP rule applies to each. Use the checker on this page; checkout gives the same answer.",
      },
      {
        q: "How low can the tread go?",
        a: "NHTSA and USTMA treat 2/32 inch as the limit, where the wear bars become level with the tread. Consumer Reports suggests considering new tires at 4/32 inch because wet braking gets worse as tread wears. Our tire check shows how to measure, and the technician can measure each tire when the van is there.",
      },
      {
        q: "Can the van do an alignment?",
        a: "No. Alignment needs a rack, which stays at the Sunrise shop. Have the van fit the tires, then book the alignment at the shop separately.",
      },
      {
        q: "I bought wheels and tires together. Is that one visit?",
        a: "Yes: new wheels are van work. The tires get mounted and balanced on them, and the TPMS sensors are moved across or programmed. Order the pair on TireDrop and book once.",
      },
      {
        q: "What size do I tell you?",
        a: "Each tire has its size molded into the sidewall: width, a slash, aspect ratio, the letter R, then wheel diameter, for example 245/45R18. A TireDrop order passes it along automatically.",
      },
      {
        q: "I'm in Country Club Ranches. Is that covered?",
        a: "Yes. The city lists its Country Club Ranches park at a 33025 address, and 33025 is a Broward County ZIP. The same goes for Sunset Lakes, Silver Shores and every other Miramar neighbourhood: enter the ZIP for the spot where the car will be parked and the box on this page confirms it.",
      },
      {
        q: "Why does my Miramar mail sometimes say Pembroke Pines or West Park?",
        a: "ZIP directories list 33023, 33025, 33027 and 33029 under more than one city name, and Miramar shares all four with Pembroke Pines. The name on an envelope is a mailing choice. The ZIP is the part that decides whether the van comes.",
      },
    ],
    nearby: ["pembroke-pines-fl", "hollywood-fl"],
    seoTitle: "Mobile Tire Service in Miramar, FL",
    description:
      "TireDrop tires fitted at your Miramar, FL home or workplace by the Extreme Tires van. ZIPs 33023 to 33029, Miramar Pkwy, tread tips and wheels in one visit.",
  },
  {
    slug: "pompano-beach-fl",
    name: "Pompano Beach",
    county: "Broward",
    population: 112046,
    zips: ["33060", "33062", "33064", "33066", "33069"],
    areas: ["Old Pompano", "Downtown Pompano Beach", "Cresthaven", "Collier City", "Palm Aire", "Garden Isles", "Pompano Beach Pier"],
    roads: ["Atlantic Blvd (SR 814)", "Copans Rd", "Sample Rd (SR 834)", "Powerline Rd (SR 845)", "I-95", "Dixie Hwy", "Federal Hwy (US 1)", "A1A"],
    route:
      "The Sawgrass Expressway links the shop's Oakland Park Blvd (exit 3) to Atlantic Blvd (exit 8), and Atlantic Blvd (SR 814) runs east from there to A1A in Pompano Beach.",
    intro:
      "The 2020 Census counted 112,046 people in Pompano Beach. The Extreme Tires van, based at our Sunrise shop, can fit your tires in Pompano Beach: on your driveway, at your workplace or outside your building. Order on TireDrop and pick mobile installation at checkout.",
    whereWeWork: [
      "Pompano Beach and our Sunrise shop are in one county, Broward, so there is no county line to wonder about. What matters is the ZIP of the spot where the car will wait for us, and the form on this page gives the answer as soon as you type it.",
      "Five ZIP codes carry most Pompano Beach street addresses: 33060, 33062, 33064, 33066 and 33069. They overlap with neighbours: 33062 also takes the Lauderdale-by-the-Sea and Hillsboro Beach names, 33064 Deerfield Beach and Lighthouse Point, and 33066 Coconut Creek. Skip the PO Box ZIPs such as 33061 and 33097, which have no street address for the van to go to.",
    ],
    roadside:
      "Found a nail at work, a flat in the driveway, or a tire that sinks overnight? Ask for mobile flat tire repair in Pompano Beach by phoning in shop hours. The wheel comes off, the inside of the tire gets checked, and a qualifying puncture is repaired; otherwise your spare goes on.",
    around: [
      "Atlantic Blvd (SR 814) runs through the middle of the city and ends at A1A, with an I-95 exit at Atlantic Blvd and another at Copans Rd. Sample Rd (SR 834) meets I-95 on the line with Deerfield Beach, Powerline Rd (SR 845) crosses Atlantic Blvd, and Dixie Hwy and US 1 (Federal Hwy) cross it near its eastern end.",
      "Wikipedia's list of Pompano Beach neighbourhoods runs to dozens of names, among them Old Pompano, Cresthaven, Collier City, Palm Aire and Garden Isles. The city's own website names Downtown Pompano Beach and the Pompano Beach Pier on the oceanfront. No list limits where we go: the ZIP counts."
    ],
    beforeWeCome: {
      lede: "When the problem is a flat, a few details help most, and they are quick to give. Take these as suggestions.",
      points: [
        "Say where the hole is: in the tread, near the edge, or in the sidewall. That decides whether it can be repaired.",
        "Say whether the tire still holds air, and whether the car carries a spare.",
        "Leave any nail or screw where it is, and tell us the car's location, which must be off any highway or expressway shoulder.",
      ],
    },
    conditionsTitle: "When a Pompano Beach tire goes flat",
    conditions: [
      "A nail or screw in the tread is a familiar cause of a flat, and the rule is to leave it where it is. Often the fastener is plugging the hole, and pulling it can turn a slow leak into a flat. Keep the next trip short and call us.",
      "Repair depends on position. Tire-industry practice, as USTMA describes it, allows a small hole in the tread area, 1/4 inch at most, to be sealed with a plug and patch from the inside, but only once the tire is off the wheel and inspected. A hole in the sidewall or shoulder rules repair out. The repair check on this site lets you tap the damaged spot on a diagram.",
    ],
    faq: [
      {
        q: "My tire went flat at work in Pompano Beach. Will the van come there?",
        a: "Yes, in shop hours, if there is room next to the car and the property lets a service vehicle in. Give us the building and where the car sits.",
      },
      {
        q: "I found a screw in the tread. Should I pull it out?",
        a: "Leave it in. It may be sealing the hole. Keep the trip short, then book a repair so the technician can take the tire off and examine the inside.",
      },
      {
        q: "How can I tell whether a puncture is repairable?",
        a: "Location is the test. A small hole in the tread area can be plugged and patched from the inside, while sidewall or shoulder damage rules a repair out. The repair check shows which side of that line yours is on.",
      },
      {
        q: "And if the tire turns out to be beyond repair?",
        a: "A replacement is ordered on TireDrop and the van fits it. If your spare is in the car, it can go on first so the car is mobile again.",
      },
      {
        q: "Is the shop in the same county as Pompano Beach?",
        a: "Our shop is in Sunrise, in Broward like Pompano Beach. Shipping tires to it is free, and the bay can fit them if you would rather not use the van.",
      },
      {
        q: "Does the van come to the beach side, out along A1A?",
        a: "Yes, when the ZIP is covered, and every Pompano Beach ZIP is a Broward County ZIP. Atlantic Blvd runs out to A1A at the ocean. For a beachfront building or a lot by the pier, give us the building or lot and where the car stands, and mention any garage height limit.",
      },
      {
        q: "Can I book with a PO Box ZIP like 33061?",
        a: "No. PO Box ZIPs such as 33061, 33075 and 33097 have no street behind them, so there is nowhere for the van to go. Book with the ZIP of wherever the car sits, whether that is a house, an office or a rented space.",
      },
    ],
    nearby: ["fort-lauderdale-fl", "oakland-park-fl"],
    seoTitle: "Mobile Tire Service in Pompano Beach, FL",
    description:
      "Tires from TireDrop fitted at your Pompano Beach, FL home or work by the Extreme Tires van. ZIPs, Atlantic Blvd and A1A, flat repair rules and shop option.",
  },
  {
    slug: "lauderhill-fl",
    name: "Lauderhill",
    county: "Broward",
    population: 74482,
    zips: ["33311", "33313", "33319", "33351"],
    areas: ["Inverrary", "Central Lauderhill", "Central Broward Regional Park", "West Ken Lark Park", "Westwind Park"],
    roads: ["Sunrise Blvd (SR 838)", "Oakland Park Blvd (SR 816)", "University Dr (SR 817)", "US 441 (SR 7)"],
    route:
      "Oakland Park Blvd (SR 816) runs from Sunrise, where the shop is, on through Lauderhill; the city puts its city hall at the northeast corner of Inverrary and Oakland Park Blvd.",
    intro:
      "In the 2020 Census Lauderhill had 74,482 residents. For a car parked in a Lauderhill driveway, apartment lot or workplace, the Extreme Tires van from our Sunrise shop is a booking away: pick the tires on TireDrop, ask for the van when you check out and the fitting happens beside the car.",
    whereWeWork: [
      "Broward ZIP codes regularly straddle city limits, which means an address that says Lauderhill can share its ZIP with a neighbouring city. Our Sunrise page shows the pattern from the other direction. The van doesn't care which name is on the mail; it cares about the ZIP of the place the car sits.",
      "Four ZIP codes hold most Lauderhill street addresses: 33311, 33313, 33319 and 33351, all in Broward County. 33313, 33319 and 33351 are on the Sunrise page too, and ZIP directories list Fort Lauderdale as an accepted name on all four, so a Lauderhill address can read as either. Type the ZIP where the car is kept into the lookup on this page and checkout will agree with it.",
    ],
    roadside:
      "A flat in an apartment lot, a soft tire in the driveway or a nail picked up on the road: flat tire help in Lauderhill takes one phone call in shop hours. The van repairs the tire in place when it qualifies, and mounts the spare when it doesn't.",
    around: [
      "Oakland Park Blvd (SR 816) crosses Sunrise, Lauderhill and Lauderdale Lakes on its way east. University Dr (SR 817) runs through Lauderhill between Sunrise and Tamarac, US 441 (SR 7) passes through the city too, and Sunrise Blvd (SR 838) meets US 441 at the Plantation and Lauderhill border.",
      "Inverrary is a Lauderhill neighbourhood, north of Oakland Park Blvd and east of University Dr. Central Lauderhill is another named area, and Central Broward Regional Park, West Ken Lark Park and Westwind Park are among the green spaces. None of those names changes coverage; the ZIP does."
    ],
    beforeWeCome: {
      lede: "Parking arrangements vary between complexes and communities, so a little checking helps. These are suggestions, not requirements.",
      points: [
        "If the community is gated or guarded, send the code, or the name for the guard's list, with your booking.",
        "Tell us whether the car is in a numbered space, a visitor lot or on the street. The technician needs firm, level ground and a free strip along the car.",
        "If management limits outside work in the lot, ask before booking. If the answer is no, a workplace fitting or a bay at the shop, with tires shipped free, are the alternatives.",
      ],
    },
    conditionsTitle: "Keeping a Lauderhill set wearing evenly",
    conditions: [
      "Rotation moves each tire to a different corner so all four tires wear down at one pace. The Tire Industry Association's suggested interval is somewhere between 5,000 and 7,000 miles, and the manual that came with your car has the last word. Cars driven through the front wheels wear the front pair out first, since that pair steers and does most of the braking.",
      "You don't need to buy new tires to book it. The van rotates the set beside your car, and can balance them in the same visit. Our rotation tool shows the right pattern for your drivetrain and tread.",
    ],
    faq: [
      {
        q: "Which is easier, the van or the shop?",
        a: "That depends on your day. The shop in Sunrise takes tires shipped free and fits them in a bay for a per-tire fee; the van saves you the wait and the trip.",
      },
      {
        q: "I live in an apartment with no driveway. Is that a problem?",
        a: "No. Any parking space, lot or street works if the ground is firm and level and there is a free strip beside the car. Say where it is when you book.",
      },
      {
        q: "How often do tires need rotating?",
        a: "The suggested interval ranges between 5,000 and 7,000 miles, with the car's manual deciding. Our rotation tool shows the pattern that suits your car.",
      },
      {
        q: "My mail says Lauderhill, but the ZIP is shared with another city. Does it matter?",
        a: "No. The area is set by ZIP code, and every ZIP in Miami-Dade, Broward and Palm Beach County counts. The lookup on this page confirms yours.",
      },
      {
        q: "Can I book just a rotation, without buying tires?",
        a: "Yes. The van does rotations, balancing, flat repairs, TPMS service and wheel fitting, and the tires don't have to come from us. Alignment is the one job that stays at the shop, because it needs a rack.",
      },
      {
        q: "Our shop is on Oakland Park Blvd. Is Lauderhill's city hall on the same road?",
        a: "Yes. Oakland Park Boulevard (SR 816) runs through Sunrise, where the shop is, and then through Lauderhill, where city hall stands at the corner of Inverrary. Which stretch of it you live near makes no difference to coverage: the ZIP does.",
      },
      {
        q: "Is Inverrary covered?",
        a: "Inverrary is a Lauderhill neighbourhood, north of Oakland Park Blvd and east of University Dr, and every Lauderhill ZIP is a Broward County ZIP, so yes. Enter the ZIP where the car is kept and the box on this page confirms it.",
      },
    ],
    nearby: ["fort-lauderdale-fl", "sunrise-fl", "tamarac-fl", "plantation-fl"],
    seoTitle: "Mobile Tire Service in Lauderhill, FL",
    description:
      "TireDrop tires fitted at your Lauderhill, FL home or complex lot by the Extreme Tires van. ZIPs 33311 to 33351, Inverrary, Oakland Park Blvd, rotation by van.",
  },
  {
    slug: "oakland-park-fl",
    name: "Oakland Park",
    county: "Broward",
    population: 44229,
    zips: ["33306", "33308", "33309", "33311", "33334"],
    areas: ["Downtown Oakland Park", "Harlem McBride", "North Andrews Gardens", "Lloyd Estates", "Prospect Gardens", "Twin Lakes South", "West Side (West Oakland Park Blvd corridor)"],
    roads: ["Oakland Park Blvd (SR 816)", "Commercial Blvd (SR 870)", "Powerline Rd (SR 845)", "Dixie Hwy", "Federal Hwy (US 1)", "Prospect Rd", "Cypress Creek Rd", "I-95"],
    route:
      "Oakland Park Blvd (SR 816) runs east from the shop's stretch of it in Sunrise, through Lauderhill and Lauderdale Lakes, before it reaches the city of Oakland Park.",
    intro:
      "Oakland Park's population was 44,229 in the 2020 Census, and its name matches the road our shop stands on. That shop is in Sunrise, though, not in the city of Oakland Park. The Extreme Tires van does the visiting: order tires on TireDrop, ask for mobile installation, and fitting happens wherever the car is parked in Oakland Park.",
    whereWeWork: [
      "Search for a tire shop in Oakland Park and you may land on our address, and the road name is why: 7712 West Oakland Park Blvd, Sunrise, FL 33351 names the road, not the city. The city of Oakland Park itself is covered by the van, on the same ZIP-code rule as every other address we serve.",
      "The city's own address is in 33334, and 33306, 33308, 33309 and 33311 also carry Oakland Park street addresses. ZIP directories accept the Oakland Park name on all five, and Fort Lauderdale uses each of them too, so an envelope can read either. All five are Broward County ZIPs, and the ZIP box on this page checks any other.",
    ],
    roadside:
      "Flat outside the office, a soft tire in the driveway or a nail from a side street? Phone in shop hours to get flat tire help in Oakland Park, meaning a repair on the spot when the tire qualifies, or your spare mounted when it doesn't.",
    around: [
      "Oakland Park Blvd (SR 816) and Commercial Blvd (SR 870) both cross the city, and I-95 has an exit on each: the Oakland Park Blvd exit sits on the line between Wilton Manors, Oakland Park and Fort Lauderdale, and the Commercial Blvd exit is in Oakland Park. Powerline Rd (SR 845) crosses the city as well. Federal Hwy (US 1) is roughly its eastern edge, and Dixie Hwy runs through downtown beside the Florida East Coast Railway.",
      "The city's own website names Downtown Oakland Park, Harlem McBride, North Andrews Gardens, Lloyd Estates, Prospect Gardens and the West Side along West Oakland Park Blvd. Twin Lakes South is another neighbourhood, Floranada was the town's earlier name, and Wilton Manors borders it."
    ],
    beforeWeCome: {
      lede: "Whether you book the van or a bay, a short list helps. Consider these suggestions.",
      points: [
        "Choose one route: the van comes to your address, or you drive over to the shop on West Oakland Park Blvd in Sunrise.",
        "For the van, name the spot and keep room along one side of the car.",
        "If the edges of your old tires are worn unevenly, mention it. That usually means an alignment is due, and alignment is shop work.",
      ],
    },
    conditionsTitle: "Edge wear, alignment and the van",
    conditions: [
      "Look at how your old set wore. Wear that sits on one edge, or comes in patches, is a clue that the car needs aligning or has tired suspension parts, and new tires fitted without that being fixed will wear the same way. The van cannot align a car, because the car has to be on a rack.",
      "So work in two steps. Let the van do the tires wherever the car sits, then take the car to the Sunrise shop for the alignment, or have both jobs done in the bay. Even wear across all four tires is what regular rotation keeps.",
    ],
    faq: [
      {
        q: "Is your shop in Oakland Park?",
        a: "No. It is in Sunrise, on Oakland Park Blvd, the road that shares the city's name. Oakland Park addresses are served by the van through the ZIP rule.",
      },
      {
        q: "One edge of my tires is worn. Will new ones cure it?",
        a: "No. Uneven edge wear points to alignment, and fresh tires on a car that is out of line wear the same way. Have the van fit the set, then book an alignment at the Sunrise shop.",
      },
      {
        q: "Can the van fit tires at my workplace in Oakland Park?",
        a: "Yes, so long as the lot has space beside your car and the property admits service vehicles. Give the building name, plus the lot and spot.",
      },
      {
        q: "What decides whether the van comes to my address?",
        a: "The ZIP code where the car will be parked. If it is in Miami-Dade, Broward or Palm Beach County, the van comes, and the ZIP check on this page shows the answer before you book.",
      },
      {
        q: "Can the alignment and the tires be one booking?",
        a: "They are two jobs in two places: the van fits tires at your address, and the shop's rack in Sunrise does the alignment. For a single visit, have the tires shipped to the store, free, and book both in the bay.",
      },
      {
        q: "I'm in Wilton Manors, right beside Oakland Park. Can the van come?",
        a: "Probably, and the ZIP tells you for certain. Wilton Manors borders Oakland Park, and coverage doesn't stop at a city line: if the ZIP where the car is parked is in Miami-Dade, Broward or Palm Beach County, the van comes. The box on this page checks it.",
      },
      {
        q: "Which Oakland Park neighbourhoods do you cover?",
        a: "Any of them: Downtown Oakland Park, Harlem McBride, North Andrews Gardens, Lloyd Estates, Prospect Gardens, Twin Lakes South and the West Side. The neighbourhood name doesn't matter for coverage. The ZIP does, and the five listed on this page are all Broward County ZIPs.",
      },
    ],
    nearby: ["fort-lauderdale-fl", "pompano-beach-fl", "sunrise-fl"],
    seoTitle: "Mobile Tire Service in Oakland Park, FL",
    description:
      "Tires from TireDrop fitted at your Oakland Park, FL home or work by the Extreme Tires van. ZIPs, neighbourhoods, alignment tips. Our shop is in Sunrise.",
  },
  {
    slug: "hialeah-fl",
    name: "Hialeah",
    county: "Miami-Dade",
    population: 223109,
    // ZIPs, areas and roads added 2026-10-18, each sourced in
    // docs/audits/2026-10-18-city-facts.md. Nothing on language or
    // demographics.
    zips: ["33010", "33012", "33013", "33014", "33015", "33016", "33018"],
    areas: ["Leah Arts district", "Amelia Earhart Park", "Milander Park", "Plaza Park", "Bright Park"],
    roads: ["Palmetto Expressway (SR 826)", "Okeechobee Rd (US 27)", "Gratigny Pkwy (SR 924)", "Red Rd (SR 823)", "I-75", "Florida's Turnpike (Homestead Extension)"],
    route:
      "Our shop is in Sunrise, in Broward County, so a Hialeah visit begins across the county line. Flamingo Rd, which ends at Oakland Park Blvd in Sunrise, becomes Red Rd in Miami-Dade and runs to US 27 in Hialeah. We confirm an arrival window when we book.",
    intro:
      "By the 2020 Census Hialeah had 223,109 residents, in Miami-Dade County. Our shop is across the county line in Sunrise, but the Extreme Tires van works in Miami-Dade too, so a set bought on TireDrop can be fitted in Hialeah: on a driveway, in a building lot or at a workplace. Pick the van option when you check out, and the technician works beside the car.",
    whereWeWork: [
      "Miami-Dade is one of three counties the van covers, with Broward and Palm Beach, and a single rule applies in all of them: the five-digit ZIP of the spot where the car sits. If that ZIP is in Miami-Dade, Broward or Palm Beach County, the van comes.",
      "Hialeah's street-address ZIP codes are 33010, 33012, 33013, 33014, 33015, 33016 and 33018, all in Miami-Dade County. Several are shared: Hialeah Gardens uses 33010, 33016 and 33018, Miami Lakes uses 33014, 33015, 33016 and 33018, and 33015 also covers Palm Springs North. The PO Box ZIPs 33002, 33011 and 33017 have no street address behind them, so book with the ZIP of the spot where the car actually sits.",
    ],
    roadside:
      "Mobile flat tire repair in Hialeah starts with a call during shop hours, whether the flat is in a parking lot, on a driveway or by the curb of a side street. If the damage can be repaired, the technician does it where the car sits; if not, your spare goes on.",
    around: [
      "The Palmetto Expressway (SR 826) runs into Hialeah proper, and the city's other main roads include Okeechobee Rd (US 27), Gratigny Pkwy (SR 924), I-75 and the Homestead Extension of Florida's Turnpike. Red Rd (SR 823) begins at US 27 in Hialeah, where the city's street grid knows it as West 4th Avenue.",
      "The Leah Arts district is one named area, Amelia Earhart Park and Milander Park are two large green spaces, and the city's own website shows Plaza Park and Bright Park. Hialeah Gardens and Miami Lakes share some of the city's ZIP codes, so if your mail names one of them, the ZIP box on this page is the quickest way to check."
    ],
    beforeWeCome: {
      lede: "Because the van starts in Broward, a few details help us plan a Hialeah visit. None of this is required.",
      points: [
        "Give the ZIP of the spot where the car will be parked, with the street address. The booking form checks it.",
        "Tell us if there is a gate, a guard or a building office the technician should check in with.",
        "If you would rather skip the van, tires ship free to the Sunrise shop, in Broward County, for a bay fitting.",
      ],
    },
    conditionsTitle: "Tire notes for Hialeah drivers",
    conditions: [
      "A tire ages whether or not the car moves. Each one carries a DOT code on the sidewall, and the last four digits give the week and the year it was made: 2524 means the 25th week of 2024. Heat and sun are hard on rubber, so an older tire can show good tread and still be cracking at the sidewall.",
      "Ask the technician to point out the code on your old tires and on the new ones when the van is there. It takes a few seconds and tells you how old each tire is.",
    ],
    faq: [
      {
        q: "Does the van really come to Miami-Dade?",
        a: "Yes. Mobile installation covers Miami-Dade, Broward and Palm Beach counties, and it is decided by ZIP code. Check the ZIP where the car will be parked on this page, and checkout runs the same check.",
      },
      {
        q: "Where is the shop? Is it in Hialeah?",
        a: "The shop is in Sunrise, in Broward County, not in Hialeah. The van is how Hialeah drivers get tires fitted without making that trip.",
      },
      {
        q: "What if my ZIP isn't covered?",
        a: "The ZIP lookup and checkout tell you before you pay. If it is outside Miami-Dade, Broward and Palm Beach, ship the tires free to our Sunrise shop instead, or call (954) 773-1896.",
      },
      {
        q: "Do I need to buy my tires on TireDrop to book the van?",
        a: "No. If the tires are already in your garage, book the van for them.",
      },
      {
        q: "Can the van fit tires at my workplace in Hialeah?",
        a: "Yes. The lot needs space beside the car, and the property must allow service vehicles. Name the building, the lot and the row.",
      },
      {
        q: "How can I tell how old my tires are?",
        a: "Read the DOT code on the sidewall. The last four digits are the week and year of manufacture, so 2524 is week 25 of 2024. The technician can show you the code on each tire when the van is there.",
      },
      {
        q: "My mail says Hialeah Gardens or Miami Lakes. Which page do I use?",
        a: "Either. 33010, 33016 and 33018 carry the Hialeah Gardens name, and 33014, 33015, 33016 and 33018 carry Miami Lakes, and all are Miami-Dade County ZIPs. The van goes by the ZIP of the place the car is parked, so book as normal and checkout confirms it.",
      },
    ],
    nearby: ["miami-fl", "doral-fl"],
    seoTitle: "Mobile Tire Service in Hialeah, FL",
    description:
      "Tires from TireDrop fitted at your Hialeah, FL home or work by the Extreme Tires van. Hialeah ZIPs, Palmetto and Okeechobee Rd, and free ship-to-store.",
  },  {
    slug: "miami-fl",
    name: "Miami",
    county: "Miami-Dade",
    population: 442241,
    // Added 2026-10-18; every ZIP, road and neighbourhood is sourced in
    // docs/audits/2026-10-18-city-facts.md. Miami has far more ZIPs than the
    // list below, which keeps to street-address ZIPs of the central city.
    zips: ["33125", "33127", "33128", "33129", "33130", "33131", "33132", "33133", "33135", "33136", "33137"],
    areas: ["Brickell", "Wynwood", "Edgewater", "Little Havana", "Little Haiti", "Coconut Grove", "Allapattah", "Flagami"],
    roads: ["I-95", "Dolphin Expressway (SR 836 / I-395)", "Palmetto Expressway (SR 826)", "Biscayne Blvd (US 1)", "Brickell Ave", "SW 8th St (US 41)", "Coral Way", "MacArthur Causeway"],
    route:
      "Miami lies in the county south of Broward, where our Sunrise shop is. I-95 links the two, passing through Hollywood, Fort Lauderdale and Oakland Park in Broward and North Miami before it enters Miami. We confirm an arrival window when we book.",
    intro:
      "Miami's population was 442,241 at the 2020 Census, the largest of any city with a page on this site. Extreme Tires van service reaches Miami-Dade County, which means tires ordered on TireDrop can go on at a Miami house, an apartment building, an office or a work yard, and the old set rides away in the van.",
    whereWeWork: [
      "Of the three counties we serve, Miami-Dade is the southernmost. Inside it, one test applies to every address: the five-digit ZIP where the car is parked has to belong to Miami-Dade, Broward or Palm Beach County. Neither a city name nor a neighbourhood name changes that.",
      "Miami uses dozens of ZIP codes. Street-address ones across the central city include 33125, 33127, 33128, 33129, 33130, 33131, 33132, 33133, 33135, 33136 and 33137, all in Miami-Dade County. Some carry a second name: directories list 33133 under Coconut Grove and Coral Gables as well. 33101 and 33102 are PO Box ZIPs with no street behind them, so use the ZIP where the car actually is.",
    ],
    roadside:
      "Found a flat in a Miami garage, an apartment lot or a side street? Ring us in shop hours for flat tire help in Miami. A repairable puncture is fixed on the spot; when the damage rules that out, your spare is the fallback.",
    around: [
      "I-95 meets I-395 at the Midtown Interchange. I-395 is the name SR 836, the Dolphin Expressway, takes between I-95 and the MacArthur Causeway, and west of Downtown the same expressway passes the southern end of Miami International Airport on its way to the Palmetto Expressway (SR 826). Brickell Avenue and SW 8th Street (US 41) meet at one I-95 exit, US 1 follows Biscayne Boulevard, and Coral Way was built in 1922 between Downtown and Coral Gables.",
      "The city's homeowners association list reads like a map: Allapattah, Coconut Grove, Coral Way, Flagami, Little Haiti, Little Havana, Model City, Overtown, the Upper Eastside, Wynwood with Edgewater, and Downtown with Brickell. The City Hall address, on Pan American Drive, is in 33133. None of the names matters to the van; the ZIP does.",
    ],
    beforeWeCome: {
      lede: "Garages, towers and locked lots each come with rules. A word with the building before you book can spare everyone a wasted trip, and none of this is a condition of booking.",
      points: [
        "Ask the building office whether an outside technician may work in the garage, and whether a sign at the entrance posts a height limit for a van. If not, an open space on a street or surface lot nearby does the same job.",
        "Give the level or bay number with the street address, and leave a way in: a fob, a code or the name on the guard's list.",
        "If the van is awkward for your building, tires ship free to our Sunrise shop in Broward County and a bay fits them there.",
      ],
    },
    conditionsTitle: "A spare is a tire too",
    conditions: [
      "NHTSA's guidance on tires says to check the pressure of all tires, spare included, at least once a month, and to look at the spare's tread as well. A spare that sits untouched in the trunk can easily be the one that is low on the day it's needed.",
      "NHTSA also advises against using a full-size spare in place of worn tires except in an emergency. If the van mounts your spare after a flat, treat that as a stopgap and order the replacement. Our repair check can tell you whether the flat tire itself can be mended.",
    ],
    faq: [
      {
        q: "Does the van work in Downtown Miami and Brickell?",
        a: "Yes, when the car's ZIP is covered; every Miami ZIP on this page is in Miami-Dade County. For a tower garage, give us the building, the level and any height limit posted at the entrance, so the technician can tell whether the van fits.",
      },
      {
        q: "My building's garage has a low ceiling. What happens then?",
        a: "Park on a street space or in an open lot near the building, and tell us which. The technician works beside the car, so any firm, level space the van can reach will do.",
      },
      {
        q: "Is Little Havana, Wynwood or Coconut Grove covered?",
        a: "Yes. The City of Miami lists all three among its neighbourhoods, and coverage follows the ZIP, not the neighbourhood name. Put the ZIP where the car is kept into the lookup on this page and checkout gives the same answer.",
      },
      {
        q: "My ZIP also lists Coral Gables or Coconut Grove. Is it still covered?",
        a: "Yes. Directories list both 33133 and 33134 under Coconut Grove and Coral Gables as well as Miami, and a booking turns on the ZIP, a Miami-Dade County one in both cases.",
      },
      {
        q: "How often should I check my spare?",
        a: "NHTSA says to check the pressure of all tires, spare included, at least once a month, and to look at the spare's tread too. If it's low or worn, tell the technician when the van is there.",
      },
      {
        q: "Where is your shop, and is it in Miami?",
        a: "We're in Sunrise, a Broward County city, not in Miami. I-95 joins the two counties and the van spares Miami drivers the trip; tires also ship free to the shop for a bay fitting.",
      },
    ],
    nearby: ["hialeah-fl", "doral-fl", "homestead-fl"],
    nearbyTitle: "Other Miami-Dade city pages",
    seoTitle: "Mobile Tire Service in Miami, FL",
    description:
      "Tires from TireDrop fitted at your Miami, FL home, building or work by the Extreme Tires van. Miami ZIPs, I-95 and SR 836, garage tips and a shop option.",
  },
  {
    slug: "doral-fl",
    name: "Doral",
    county: "Miami-Dade",
    population: 75874,
    // Added 2026-10-18; sources in docs/audits/2026-10-18-city-facts.md.
    zips: ["33122", "33126", "33166", "33172", "33178"],
    areas: ["Downtown Doral", "Downtown Doral Arts District", "Doral Décor District", "Doral Estates", "Doral Park", "Doral Central Park", "Doral Legacy Park"],
    roads: ["Palmetto Expressway (SR 826)", "Dolphin Expressway (SR 836)", "Florida's Turnpike", "NW 36th Street (SR 948)", "NW 107th Avenue (SR 985)"],
    route:
      "The Palmetto Expressway (SR 826) runs south from the Golden Glades Interchange, where it meets I-95, Florida's Turnpike and US 441, to Doral's eastern edge. The shop sits in Broward County, so the van crosses a county line to reach Doral. We confirm an arrival window when we book.",
    intro:
      "Doral was home to 75,874 people at the 2020 Census. The Extreme Tires van can mount tires from a TireDrop order at an office, in a work lot or on a home driveway in Doral. Pick the van at checkout, or book it for tires already in your garage.",
    whereWeWork: [
      "Doral is one of Miami-Dade County's municipalities, and the city's own site gives its incorporation date as January 28, 2003. For a booking that history matters less than a single fact: the booking turns on the five-digit ZIP of the parking spot, whatever the county line or the city name says.",
      "Five ZIP codes cover most Doral street addresses: 33122, 33126, 33166, 33172 and 33178, all in Miami-Dade County. Directories also list Medley on 33166 and 33178, Miami Springs and Virginia Gardens on 33166, and Sweetwater and West Miami on 33172, while 33126 is listed under Miami as well. A letter for a Doral address can therefore carry any of those names.",
    ],
    roadside:
      "Need flat tire help in Doral? Call in shop hours. A repairable puncture is fixed where the car stands, at the office, in a driveway or at the curb, and the spare is mounted if the tire can't be repaired.",
    around: [
      "Expressways frame the city: the Palmetto Expressway on its east, Florida's Turnpike on its west and the Dolphin Expressway (SR 836) on its south, with the town of Medley to the north. NW 36th Street (SR 948) meets the Palmetto Expressway in the Doral area, and NW 107th Avenue (SR 985) has an interchange with the Dolphin Expressway on the Doral and Fontainebleau line.",
      "The city's own site describes its original land, bought in the late 1950s, as lying between NW 36th Street and NW 74th Street, and from NW 79th Avenue to NW 117th Avenue. It names Downtown Doral, the Downtown Doral Arts District to its north and the Doral Décor District, a business area, and the parks include Doral Central Park and Doral Legacy Park. Doral Estates and Doral Park are named neighbourhoods too.",
    ],
    beforeWeCome: {
      lede: "Doral properties can be large, with more than one entrance. A few details at booking help the technician plan; take them as suggestions.",
      points: [
        "Name the building or lot and the row or space. A precise spot saves a phone call.",
        "If the car is at work, ask whether the property lets an outside service vehicle in, and leave a free strip beside the car.",
        "If the tire-pressure light is on, say so. It tells the technician to bring what the sensors need.",
      ],
    },
    conditionsTitle: "When the tire-pressure light comes on",
    conditions: [
      "NHTSA says tire-pressure monitoring systems only give a warning when a tire is significantly underinflated, and that the system is no substitute for regular tire maintenance. A dashboard that stays dark doesn't mean all four tires hold the right pressure.",
      "When the light does come on, check all four tires with a gauge while they're cold, against the number on the label at the driver's door edge. A tire that keeps losing air may have a nail or a slow leak, and a repair visit finds out which. The van services TPMS sensors too, so mention the light when you book.",
    ],
    faq: [
      {
        q: "My mail says Medley or Sweetwater. Do I book as Doral?",
        a: "Book by ZIP. 33166 and 33178 also carry the Medley name, and 33172 is shared with Sweetwater and West Miami, but all are Miami-Dade County ZIPs. Put yours into the lookup on this page and checkout confirms it.",
      },
      {
        q: "Does the van come to a business park unit in Doral?",
        a: "Yes, when the property admits service vehicles and there is room beside the car. Give the unit or building and say where the car stands.",
      },
      {
        q: "The tire-pressure light is on. Does that mean a flat?",
        a: "Not always. NHTSA says the warning appears when a tire is significantly underinflated, which can mean a leak, a nail or a long gap since the last pressure check. Check all four with a gauge, and book a flat repair if one keeps losing air.",
      },
      {
        q: "Can the van service TPMS sensors?",
        a: "Yes. It moves or programs sensors during a tire fitting and does TPMS service on its own. Tell us at booking if the light has been on.",
      },
      {
        q: "Which roads mark the edges of Doral?",
        a: "The Palmetto Expressway on the east, Florida's Turnpike on the west and the Dolphin Expressway on the south, with the town of Medley to the north. If your street is close to an edge, the ZIP box on this page is the quickest check.",
      },
      {
        q: "Is the shop in Doral?",
        a: "No, it is in Sunrise, in Broward County. Doral drivers use the van, and tires ship free to the shop if you prefer a bay fitting.",
      },
    ],
    nearby: ["hialeah-fl", "miami-fl"],
    seoTitle: "Mobile Tire Service in Doral, FL",
    description:
      "Tires from TireDrop fitted at your Doral, FL home or workplace by the Extreme Tires van. Doral ZIPs, the Palmetto and Dolphin expressways, and TPMS help.",
  },
  {
    slug: "homestead-fl",
    name: "Homestead",
    county: "Miami-Dade",
    population: 80737,
    // Added 2026-10-18; sources in docs/audits/2026-10-18-city-facts.md.
    zips: ["33030", "33031", "33032", "33033", "33034", "33035"],
    areas: ["Homestead Historic Downtown District", "Homestead Bayfront Park and Marina", "Harris Field Park", "Losner Park", "Leisure City", "Naranja", "Redland", "Princeton"],
    roads: ["US 1 (Homestead Blvd)", "Florida's Turnpike (Homestead Extension)", "Krome Ave (SR 997)", "SW 137th Ave (Speedway Blvd)", "SW 312th St (Campbell Dr)", "SW 328th St (North Canal Dr)", "SW 344th St (Palm Dr)"],
    route:
      "The Sunrise shop is in Broward County, so a Homestead visit means crossing Miami-Dade County. Florida's Turnpike has a branch, the Homestead Extension (SR 821), which leaves the mainline near the Miramar and Miami Gardens line and ends at US 1 in Florida City. We confirm an arrival window when we book.",
    intro:
      "Homestead's 2020 Census count was 80,737. Miami-Dade County, where Homestead sits, is part of the Extreme Tires van's range, so tires ordered on TireDrop can be mounted in a Homestead driveway, in a workplace lot or beside your building.",
    whereWeWork: [
      "Homestead is the southernmost city with a page here, and that changes nothing about the rule. A five-digit ZIP in Miami-Dade, Broward or Palm Beach County is all the van needs, whatever name the mail carries.",
      "Six ZIP codes cover Homestead's street addresses: 33030, 33031, 33032, 33033, 33034 and 33035, all in Miami-Dade County. Several carry neighbouring names in directories: 33030 lists Leisure City, 33031 Redland, 33032 Naranja, Princeton and Redland, 33033 Leisure City and Naranja, and 33034 Florida City. 33090 and 33092 are PO Box ZIPs, with no street behind them.",
    ],
    roadside:
      "Call in shop hours for mobile flat tire repair in Homestead if a tire has gone soft in the driveway or picked up a nail in a plaza lot. Damage that can be repaired is repaired beside the car; damage that can't be means the spare is mounted.",
    around: [
      "Inside the city, US 1 is called Homestead Boulevard. The street grid pairs numbers with names: SW 312th Street is Campbell Drive, SW 320th Street is Mowry Drive, SW 328th Street is North Canal Drive, SW 344th Street is Palm Drive and SW 304th Street is Kings Highway. Krome Avenue (SR 997) and SW 137th Avenue, also known as Speedway Boulevard, are north-south roads, and the South Miami-Dade Busway serves the area.",
      "The Homestead Historic Downtown District is the old centre. Harris Field Park, Losner Park and Homestead Bayfront Park and Marina are among its parks, Homestead Air Reserve Base borders the city along SW 137th Avenue, and Florida City borders it at the southern end. Leisure City, Naranja, Princeton and Redland are unincorporated communities close by that share Homestead's ZIPs.",
    ],
    beforeWeCome: {
      lede: "The van starts out in Broward County, so a few details at booking help plan a Homestead visit. None of it is compulsory.",
      points: [
        "Give the street address with its ZIP, and say which neighbouring name your mail uses, such as Leisure City or Naranja. The ZIP is what we check.",
        "Say where the car stands: a driveway, a lot or a yard. Firm, level ground and room beside the car are what the technician needs.",
        "If there is a gate or a long drive in, include the code or the directions.",
      ],
    },
    conditionsTitle: "After a curb or a pothole",
    conditions: [
      "NHTSA notes that a tire can suddenly lose pressure if you drive over a pothole or bump into a curb when you park, and suggests keeping a pressure gauge in the car to check afterwards. A hard knock is worth a look even when the tire seems to be holding.",
      "If a tire keeps losing air after an impact, or a bulge shows on the sidewall, book a flat repair visit. The technician takes the wheel off and examines the tire from the inside before saying whether it can be repaired. A bulge cannot.",
    ],
    faq: [
      {
        q: "Is Homestead really in the van's area?",
        a: "Yes. Homestead is in Miami-Dade County, and every ZIP listed on this page is a Miami-Dade ZIP. Try yours in the lookup on this page; checkout repeats the check.",
      },
      {
        q: "My mail says Leisure City, Naranja or Redland. Is that Homestead?",
        a: "Those are separate communities that share Homestead's ZIPs in directories: 33033 lists Leisure City and Naranja, and 33031 and 33032 list Redland. The ZIP is what decides.",
      },
      {
        q: "I live next to Florida City. Which page do I use?",
        a: "This one. Florida City borders Homestead at its southern edge, and 33034 is listed under both names. The ZIP lookup on this page gives the answer.",
      },
      {
        q: "Does the van come to the Historic Downtown area?",
        a: "Yes, by ZIP like everywhere else. The Homestead Historic Downtown District lies within the city, and every Homestead ZIP above is in Miami-Dade County.",
      },
      {
        q: "I hit a pothole and the tire looks normal. Should I still check it?",
        a: "Yes. NHTSA says a tire can suddenly lose pressure after a pothole or a curb. Check it with a gauge, look for a bulge, and book a repair visit if it keeps losing air.",
      },
      {
        q: "The property has a gate and a long drive. Is that a problem?",
        a: "No. Send the gate code or the directions with the booking, and say where the car stands. The technician needs firm, level ground and a free strip beside the car.",
      },
    ],
    nearby: ["miami-fl", "doral-fl"],
    nearbyTitle: "Other Miami-Dade city pages",
    seoTitle: "Mobile Tire Service in Homestead, FL",
    description:
      "Tires from TireDrop fitted at your Homestead, FL home or workplace by the Extreme Tires van. Homestead ZIPs, US 1 and the Turnpike, and a shop option.",
  },
  {
    slug: "boca-raton-fl",
    name: "Boca Raton",
    county: "Palm Beach",
    population: 97422,
    // Added 2026-10-18; sources in docs/audits/2026-10-18-city-facts.md.
    zips: ["33428", "33431", "33432", "33433", "33434", "33486", "33487", "33496", "33498"],
    areas: ["Mizner Park", "Pearl City", "Old Floresta", "West Boca Raton", "Sandalfoot Cove", "Camino Gardens", "Spanish Village", "Sugar Sand Park"],
    roads: ["Glades Rd (SR 808)", "Palmetto Park Rd (CR 798)", "Yamato Rd (SR 794)", "Military Trail", "Congress Ave (CR 807)", "I-95", "Florida's Turnpike", "Federal Hwy (US 1)", "A1A"],
    route:
      "I-95 runs north through Pompano Beach and Deerfield Beach before it reaches Boca Raton, in Palm Beach County, where Palmetto Park Rd (CR 798) and Glades Rd (SR 808) each have an exit. We confirm an arrival window when we book.",
    intro:
      "The 2020 Census found 97,422 people in Boca Raton, which is in Palm Beach County. Our Sunrise shop is in Broward, but the Extreme Tires van also works in Palm Beach County, so tires ordered on TireDrop can be mounted at a Boca Raton house, a condo lot or an office.",
    whereWeWork: [
      "Boca Raton is the first Palm Beach County city that I-95 reaches heading north from Broward. County lines and city names decide nothing here. What counts is the five-digit ZIP where the car is parked, and a ZIP in Palm Beach, Broward or Miami-Dade County is covered.",
      "Nine street-address ZIP codes serve Boca Raton: 33428, 33431, 33432, 33433, 33434, 33486, 33487, 33496 and 33498, all in Palm Beach County. Directories list 33487 under Highland Beach as well, and the city's own address, on West Palmetto Park Road, is in 33432. The PO Box ZIPs 33427, 33429, 33481, 33488 and 33497 have no street address behind them, so book with the ZIP of wherever the car actually sits.",
    ],
    roadside:
      "A soft tire in a driveway, a condo lot or a Boca Raton plaza? Ask for flat tire help in Boca Raton by calling in shop hours. The wheel comes off for an inspection, a repairable puncture is patched, and the spare is fitted instead if the tire is beyond repair.",
    around: [
      "Glades Road (SR 808) and Palmetto Park Road (CR 798) each have an I-95 exit in Boca Raton, as do Yamato Road (SR 794), Spanish River Boulevard (SR 800) and Congress Avenue (CR 807). Florida's Turnpike has a Glades Road interchange, Military Trail and Powerline Road (SR 845, also called Jog Road) run through the city, US 1 is Federal Highway, and A1A follows the coast.",
      "Mizner Park is the downtown shopping district, and its amphitheatre is named on the city's own site. Old Floresta, Pearl City, Camino Gardens, Sandalfoot Cove, Spanish Village and West Boca Raton are named neighbourhoods, while Sugar Sand Park, Red Reef Park, Spanish River Park and Patch Reef Park are among its parks. None of those names changes the ZIP rule.",
    ],
    beforeWeCome: {
      lede: "If the car sits inside a gated community or an association with rules for outside contractors, a few details help. These are suggestions, nothing more.",
      points: [
        "Ask the association if a service van may come in and whether it needs to be on a list, and pass on any code or name it gives you.",
        "Say whether the car is on a driveway, in a numbered space or in a garage with a height limit.",
        "Pick your route: the van at your address, or a bay fitting at our Sunrise shop, in Broward, with tires shipped free.",
      ],
    },
    conditionsTitle: "Checking tread with a coin",
    conditions: [
      "NHTSA's quick tread check uses a penny: if you can see the top of Lincoln's head in the groove, replace the tire. That marks 2/32 of an inch, the depth NHTSA gives as the point for replacement.",
      "Test more than one groove on each tire, and test all four, because tires can wear unevenly across the tread and from one wheel to the next. When it's time, order on TireDrop and book the van with the same order.",
    ],
    faq: [
      {
        q: "Boca Raton isn't in Broward. Does the van still come?",
        a: "Yes. Palm Beach County is part of the van's range, and all nine Boca Raton ZIPs on this page are Palm Beach County ZIPs. Test yours in the lookup on this page.",
      },
      {
        q: "My address says Highland Beach. Does that matter?",
        a: "Booking works the same either way. 33487 is listed under Boca Raton and under Highland Beach in directories, and the ZIP is a Palm Beach County one.",
      },
      {
        q: "Does the van come to West Boca?",
        a: "Yes. West Boca Raton is a named part of the city, and I-95 isn't a boundary for the van. Enter the ZIP where the car is kept.",
      },
      {
        q: "How does the penny test work?",
        a: "Per NHTSA, put a penny in the tread groove. If you can see the top of Lincoln's head, replace the tire. Try several grooves on each tire, since wear isn't always even.",
      },
      {
        q: "Can I book with a PO Box ZIP such as 33427?",
        a: "No, because mail-only ZIPs like that have no street for the van to visit. Use the ZIP where the car is kept.",
      },
      {
        q: "My community has a guard gate. What do you need?",
        a: "Whatever the association asks of outside vendors, plus the gate code or a name for the guard's list. Send both with the booking so the technician can get in.",
      },
    ],
    nearby: ["boynton-beach-fl", "west-palm-beach-fl", "pompano-beach-fl"],
    nearbyTitle: "Up and down the I-95 corridor",
    seoTitle: "Mobile Tire Service in Boca Raton, FL",
    description:
      "Tires from TireDrop fitted at your Boca Raton, FL home, condo or work by the Extreme Tires van. Boca ZIPs, Glades and Palmetto Park roads, and gate tips.",
  },
  {
    slug: "west-palm-beach-fl",
    name: "West Palm Beach",
    county: "Palm Beach",
    population: 117415,
    // Added 2026-10-18; sources in docs/audits/2026-10-18-city-facts.md.
    zips: ["33401", "33405", "33406", "33407", "33409", "33415", "33417"],
    areas: ["Northwood Village", "Old Northwood", "El Cid", "Flamingo Park", "Grandview Heights", "Pleasant City", "Historic Northwest", "Grassy Waters Preserve"],
    roads: ["Okeechobee Blvd (SR 704)", "Southern Blvd (US 98 / SR 80)", "Palm Beach Lakes Blvd (CR 716)", "Belvedere Rd", "Forest Hill Blvd (SR 882)", "Tamarind Ave", "Clematis St", "Florida's Turnpike", "I-95"],
    route:
      "West Palm Beach is in Palm Beach County, the next county north of Broward, where our Sunrise shop is. I-95 passes through the city, with exits at Forest Hill Blvd (SR 882), Southern Blvd (US 98 / SR 80), Belvedere Rd and Okeechobee Blvd (SR 704), then Palm Beach Lakes Blvd (CR 716). We confirm an arrival window when we book.",
    intro:
      "At the 2020 Census West Palm Beach had 117,415 residents. The Extreme Tires van, which starts at our Sunrise shop, serves Palm Beach County, so tires ordered on TireDrop can be mounted at a West Palm Beach house, an office lot or a building garage.",
    whereWeWork: [
      "The city's own site calls West Palm Beach the first and largest city in Palm Beach County. For a booking the label matters less than the test every address gets: a five-digit ZIP, for the place the car is parked, in Palm Beach, Broward or Miami-Dade County.",
      "Directories give West Palm Beach ZIPs from 33401 to 33422, and street-address ones across the city include 33401, 33405, 33406, 33407, 33409, 33415 and 33417, all in Palm Beach County. Several are shared: 33406 with Lake Clarke Shores, Palm Springs, Glen Ridge and Cloud Lake, 33407 with Riviera Beach and Mangonia Park, 33409 and 33417 with Haverhill, and 33415 with Greenacres and Haverhill. 33402 and 33416 are PO Box ZIPs, with no street attached.",
    ],
    roadside:
      "Spotted a flat in a downtown garage or outside an office? Phone in shop hours for mobile flat tire repair in West Palm Beach. A repairable puncture is dealt with beside the car, and if it can't be repaired, your spare is mounted.",
    around: [
      "Okeechobee Blvd (SR 704), Southern Blvd (US 98 / SR 80), Belvedere Rd and Forest Hill Blvd (SR 882) all have I-95 exits in the city, and Palm Beach Lakes Blvd (CR 716) has one just north of Okeechobee Blvd. Florida's Turnpike and SR 7 serve the city as well. The city's own site names Clematis Street, South Dixie Highway and North Flagler Drive, and Tamarind Avenue is named as well.",
      "The city lists its neighbourhoods as the Downtown Core, Historic Northwest, Northwood and Pleasant City, Northwood Village, Brelsford Park and Providencia Park, the Clearlake District and the Okeechobee Corridor. Old Northwood, El Cid, Flamingo Park and Grandview Heights are named areas too, and Grassy Waters Preserve, Dreher Park and Flagler Park are among the green spaces.",
    ],
    beforeWeCome: {
      lede: "A little detail at booking helps the technician plan a West Palm Beach visit. These are suggestions, not conditions.",
      points: [
        "State whether the car is on the street, in a surface lot or in a garage, and give the height limit if a sign posts one.",
        "For an office or a building, name the property and the level or row, and ask the manager whether a service van may work there.",
        "If the property is gated, include its entry code.",
      ],
    },
    conditionsTitle: "Tires age even when the car sits",
    conditions: [
      "NHTSA notes that some vehicle and tire manufacturers recommend replacing tires that are six to ten years old, regardless of treadwear. For a car that is used little, that date is the one to watch, since the tread can look deep on a tire that has been in service for years.",
      "The age is printed on the sidewall. A tire's identification number ends in four digits, two for the week and two for the year, so a tire ending 3023 was made in week 30 of 2023. Ask the technician to read it with you when the van is there, and check the spare as well.",
    ],
    faq: [
      {
        q: "The shop is in Broward. Does the van really come to West Palm Beach?",
        a: "Yes. West Palm Beach is in the next county north of Broward, and the van covers Palm Beach County by ZIP. Try yours in the lookup on this page.",
      },
      {
        q: "My mail says Riviera Beach, Greenacres or Haverhill. Am I still covered?",
        a: "Yes: the ZIP decides. 33407 lists Riviera Beach, 33415 lists Greenacres and Haverhill, and 33409 and 33417 list Haverhill, all as Palm Beach County ZIPs.",
      },
      {
        q: "Does the van work downtown, around Clematis Street?",
        a: "Yes, on the same ZIP rule. For a garage, give us the property name, the level and any height limit, and if the garage doesn't suit a van, a street space or an open lot nearby works instead.",
      },
      {
        q: "How old is too old for a tire?",
        a: "NHTSA says some vehicle and tire manufacturers recommend replacing tires at six to ten years, regardless of treadwear. The age is in the last four digits of the identification number on the sidewall.",
      },
      {
        q: "Are Northwood Village and El Cid covered?",
        a: "Yes. Both are named areas of West Palm Beach, and the ZIP, not the neighbourhood, decides. Each West Palm Beach ZIP above is a Palm Beach County ZIP.",
      },
      {
        q: "Can I book with a PO Box ZIP like 33402?",
        a: "No: that ZIP is for mail only. Use the ZIP where the car is parked and the lookup on this page confirms it.",
      },
    ],
    nearby: ["boca-raton-fl", "boynton-beach-fl"],
    nearbyTitle: "More Palm Beach County pages",
    seoTitle: "Mobile Tire Service in West Palm Beach, FL",
    description:
      "Tires from TireDrop fitted at your West Palm Beach, FL home or work by the Extreme Tires van. West Palm Beach ZIPs, Okeechobee and Southern Blvd, tire-age tips.",
  },
  {
    slug: "boynton-beach-fl",
    name: "Boynton Beach",
    county: "Palm Beach",
    population: 80380,
    // Added 2026-10-18; sources in docs/audits/2026-10-18-city-facts.md.
    zips: ["33426", "33435", "33436", "33437"],
    areas: ["Downtown Boynton Beach", "Boynton Beach Oceanfront Park", "Renaissance Commons", "Lake Boynton Estates", "Hampshire Gardens", "Leisureville", "Sterling Village", "Quantum Corporate Park"],
    roads: ["Boynton Beach Blvd (SR 804)", "Congress Ave", "Woolbright Rd (CR 792)", "Gateway Blvd", "Seacrest Blvd", "Federal Hwy", "I-95", "A1A"],
    route:
      "Heading north on I-95, Boynton Beach comes after Boca Raton and Delray Beach, with exits at Woolbright Rd (CR 792), Boynton Beach Blvd (SR 804) and Gateway Blvd. The Sunrise shop is in Broward County, so reaching Boynton Beach means crossing into Palm Beach County. We confirm an arrival window when we book.",
    intro:
      "According to the 2020 Census, 80,380 people live in Boynton Beach. The Extreme Tires van can mount tires there, whether they came from a TireDrop order or your own garage, in a driveway, a community parking lot or a workplace.",
    whereWeWork: [
      "Palm Beach County is home to Boynton Beach, and the rule that applies is the one used across the whole area: the ZIP where the car stands decides, not the mailing name and not a county line.",
      "The main Boynton Beach ZIP codes are 33426, 33435, 33436 and 33437, all in Palm Beach County, and directories list 33472 and 33473 under the city as well. 33435 is also listed for Briny Breezes and Ocean Ridge, 33436 for the Village of Golf, and the address the city publishes, on East Ocean Avenue, is in 33435. 33424, 33425 and 33474 are PO Box ZIPs with no street address attached.",
    ],
    roadside:
      "A tire that sank overnight, or one that picked up a nail in a plaza lot? Call in shop hours for flat tire help in Boynton Beach. Repairable damage is mended beside the car, and when it isn't repairable, the spare is mounted.",
    around: [
      "Boynton Beach Boulevard (SR 804), Woolbright Road (CR 792), which the city's history also calls 15th Avenue, and Gateway Boulevard each have an I-95 exit. Congress Avenue, Seacrest Boulevard, Ocean Avenue, Federal Highway, Dixie Highway, US 441 and State Road A1A are other named roads in and around the city.",
      "Delray Beach lies to the north, Hypoluxo and Lantana to the south and the Village of Golf to the west, with Briny Breezes, Gulf Stream, Manalapan and Ocean Ridge across the Intracoastal Waterway to the east. Named areas inside the city include Downtown, Boynton Beach Oceanfront Park, Renaissance Commons, Lake Boynton Estates, Hampshire Gardens, Leisureville, Sterling Village and Quantum Corporate Park.",
    ],
    beforeWeCome: {
      lede: "Communities and complexes differ, so a few details help the technician plan. Treat them as optional.",
      points: [
        "Give your ZIP with the address. In Boynton Beach, 33435 and 33436 are shared with neighbouring towns, and the ZIP is the part we check.",
        "If you live in a community with a gate or a clubhouse office, check its rules for outside vendors and send its code, or the name to give at the gate.",
        "If your old tires show uneven wear, mention it when you book, and read the rotation note below.",
      ],
    },
    conditionsTitle: "Rotation, and the cars that skip it",
    conditions: [
      "NHTSA says that, when the vehicle manufacturer recommends it, tires should be rotated every 5,000 to 8,000 miles, or sooner if uneven wear appears. It adds a caution: some vehicles should not be rotated, so the owner's manual has the final word.",
      "A rotation is a visit in itself, and no purchase is needed. The van does it where the car stands and can balance the wheels while it's there. The rotation tool on this site shows the pattern for your car.",
    ],
    faq: [
      {
        q: "Boynton Beach is in Palm Beach County. Does the van come that far?",
        a: "Yes. Palm Beach County is in the van's range, and the Boynton Beach ZIPs on this page are all Palm Beach County ZIPs. Try yours in the lookup on this page.",
      },
      {
        q: "My mail says Ocean Ridge or Briny Breezes. Does that matter?",
        a: "Neither name matters. Directories list 33435 under Ocean Ridge and Briny Breezes as well as Boynton Beach, and it is a Palm Beach County ZIP.",
      },
      {
        q: "I live in Leisureville, Sterling Village or Hampshire Gardens. Does that change anything?",
        a: "No. Those are named areas within Boynton Beach, and the ZIP code is what counts. The ZIP lookup on this page gives the answer for your address.",
      },
      {
        q: "How often should my tires be rotated?",
        a: "NHTSA's range is every 5,000 to 8,000 miles when the vehicle manufacturer recommends it, or sooner if uneven wear appears. Your manual has the final word, and our rotation tool shows the pattern.",
      },
      {
        q: "Does every car get its tires rotated?",
        a: "No. NHTSA notes that some vehicles should not be rotated, so check the owner's manual before booking. If the manual rules it out, the van can still balance the wheels or fit new tires.",
      },
      {
        q: "What if my ZIP is 33472 or 33473?",
        a: "Both are listed under Boynton Beach in directories, and both are Palm Beach County ZIPs. Use the lookup on this page to be sure.",
      },
    ],
    nearby: ["west-palm-beach-fl", "boca-raton-fl"],
    nearbyTitle: "Elsewhere along I-95",
    seoTitle: "Mobile Tire Service in Boynton Beach, FL",
    description:
      "Tires from TireDrop fitted at your Boynton Beach, FL home or work by the Extreme Tires van. Boynton Beach ZIPs, Congress Ave and I-95 exits, rotation tips.",
  },
];

/**
 * The copy every city page shares: kept short on purpose, so each page is
 * mostly its own city. The template renders these strings and the overlap
 * test reads them, so the measured page and the real page are the same text.
 */
export const CITY_PAGE_SHARED = {
  howItWorks: [
    {
      title: "Pick your tires",
      body: "Order on TireDrop and choose mobile installation at checkout, or book the van for tires you already have.",
    },
    {
      title: "Book the visit",
      body: "We confirm an arrival window when we book.",
    },
    {
      title: "Fitted where it's parked",
      body: "Mounted, balanced, torqued to spec, old set hauled away.",
    },
  ],
  servicesLede: "Each one is done beside the car.",
  scope: [
    "Installs and flat help on side streets, in parking lots, at homes and at workplaces, during shop hours.",
    HIGHWAY_LINE,
    "We confirm an arrival window when we book.",
    "No trip fee on standard appointments.",
    "Alignment, brakes and suspension are shop work in Sunrise.",
  ],
  highwayLine: HIGHWAY_LINE,
  roadsideItems: [
    { title: "Tire change or swap", body: "Your spare, or a tire you bought, goes on." },
    { title: "Flat repair", body: "If it's repairable. A technician inspects the inside first." },
    { title: "Spare installed", body: "Put on, with its pressure set." },
  ],
  shopLine: "Prefer the bay? Ship your tires free to the Sunrise shop.",
  ctaBody: "Pick the tires and the day. We confirm an arrival window when we book.",
  zipLabel: "ZIP code where the car will be parked",
};

export const cityPath = (slug) => `/mobile-service/${slug}`;

export const CITY_PAGE_BY_SLUG = Object.fromEntries(
  CITY_PAGES.map((c) => [c.slug, c]),
);

export const getCityPage = (slug) => CITY_PAGE_BY_SLUG[slug] ?? null;

/** City name → its page path, for the service-area chips. */
export const CITY_PAGE_PATH_BY_NAME = Object.fromEntries(
  CITY_PAGES.map((c) => [c.name, cityPath(c.slug)]),
);
