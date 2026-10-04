// The mobile tire installation city pages: /mobile-service/<slug>, one per
// city, rendered by src/pages/services/MobileCityPage.jsx under the
// /mobile-service hub. Wave 1 of docs research (local SEO, 2026-10-01).
//
// Plain data with no imports, so cityPages.test.mjs can check it under Node:
// every ZIP passes isInServiceArea(), the copy follows the house rules, and
// no two city pages read alike (the overlap test).
//
// FACTS: only what the research marked verified (or cited). Anything it
// marked unverified is left out, so some cities list no roads or
// neighbourhoods yet. Add them here once confirmed. No drive times, no
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
//   county        "Broward" or "Miami-Dade" (batch 2 added Hialeah); one of SERVICE_COUNTIES
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
//   nearbyTitle   optional: heading for the nearby list when "Nearby" would overstate it (Hialeah)

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
    seoTitle: "Mobile Tire Installation in Sunrise, FL",
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
    seoTitle: "Mobile Tire Installation in Plantation, FL",
    description:
      "Tires from TireDrop fitted in your Plantation, FL driveway or office lot by the Extreme Tires van. Plantation ZIPs, roads, HOA tips and on-site service.",
  },
  {
    slug: "tamarac-fl",
    name: "Tamarac",
    county: "Broward",
    population: 71897,
    // The research's Tamarac ZIPs are unverified, so none are listed; the ZIP
    // checker covers it. Roads and neighbourhoods are the Wikipedia ones the
    // city-depth fact sheet allows (2026-10-04); see docs/audits/2026-10-04-city-depth.md.
    zips: [],
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
      "The neighbourhood isn't what decides coverage. The ZIP code where the car is parked is. Broward ZIP codes often cross city lines, so the city name on an address is a poor guide. If the ZIP is in Miami-Dade, Broward or Palm Beach County, the van comes. Type it into the checker below; checkout and the booking form run the same check.",
      "Live behind a gate? Give us the gate code, or the name the guardhouse should have on its list, when you book, and check whether your association wants service vehicles registered ahead of time.",
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
    seoTitle: "Mobile Tire Installation in Tamarac, FL",
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
    seoTitle: "Mobile Tire Installation in Coral Springs, FL",
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
    seoTitle: "Mobile Tire Installation in Davie, FL",
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
    seoTitle: "Mobile Tire Installation in Fort Lauderdale, FL",
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
    seoTitle: "Mobile Tire Installation in Weston, FL",
    description:
      "Bought tires on TireDrop? The Extreme Tires van fits them at your Weston, FL home or workplace. Weston ZIPs, gate and HOA tips, and what the van does.",
  },
  {
    slug: "pembroke-pines-fl",
    name: "Pembroke Pines",
    county: "Broward",
    population: 171178,
    // Batch 2 (2026-10-05): no ZIPs, roads or neighbourhoods are listed. The
    // plan's candidate ZIPs are unverified and no government source was
    // readable (docs/audits/2026-10-05-local-pages-plan.md), so the ZIP checker
    // decides. Populations are the plan's MED ones (census.gov, two searches).
    // Each page's wording is its own on purpose: the overlap test counts any
    // five-word run found on another page, so batch 2 copy is never recycled.
    zips: [],
    areas: [],
    roads: [],
    route:
      "Pembroke Pines is a Broward County address, so it falls inside the three-county area the Extreme Tires vans work, from their base at the Sunrise shop.",
    intro:
      "Pembroke Pines counted 171,178 residents in the 2020 Census. Whichever driveway or parking space your car sits in, the Extreme Tires van, based at our Sunrise shop, can bring the tire work to it instead of the car going to a waiting room. Buy the set on TireDrop, ask for mobile installation, and the technician mounts, balances and torques the wheels on the spot.",
    whereWeWork: [
      "Three Broward neighbours blur together on the map and in the mailbox: Pembroke Pines, Hollywood and Miramar. A letter for a Pembroke Pines street can be addressed to Hollywood, and a Hollywood house can carry the Pembroke Pines name. Booking sidesteps the puzzle, since coverage is read from the ZIP code of the parking spot, not the town on the envelope.",
      "No Pembroke Pines ZIP list appears here. Ours hasn't been checked against the postal service's, and an unchecked list does more harm than a blank one. Type the ZIP for the parking spot into the box on this page: anything across the three counties of Miami-Dade, Broward and Palm Beach is covered, and checkout applies the identical rule.",
    ],
    roadside:
      "Picture a flat on a weekday morning in Pembroke Pines: a driveway, an office lot, a shopping plaza. For flat tire help in Pembroke Pines, phone during shop hours and the van comes to the car. The tire is repaired on the spot when the damage allows it, and the spare goes on when it does not.",
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
        a: "You could. The shop is in Sunrise, with weekday hours to 6:30 PM and Saturday hours to 4:00 PM, and a bay fitting is charged per tire. People pick the van when they can't spare the car for the visit.",
      },
    ],
    nearby: ["hollywood-fl", "miramar-fl", "davie-fl", "weston-fl"],
    seoTitle: "Mobile Tire Installation in Pembroke Pines, FL",
    description:
      "TireDrop tires fitted at your Pembroke Pines, FL home or work by the Extreme Tires van from Sunrise. ZIP check, Hollywood and Miramar mail, shop option.",
  },
  {
    slug: "hollywood-fl",
    name: "Hollywood",
    county: "Broward",
    population: 153067,
    zips: [],
    areas: [],
    roads: [],
    route:
      "Hollywood sits in Broward County, the county of the Sunrise shop that the Extreme Tires vans work from.",
    intro:
      "The 2020 Census put Hollywood at 153,067 people, and the Extreme Tires van can reach any Hollywood parking spot with a covered ZIP code. Our Sunrise shop is where the vans start out; the van carries the machines, so a set bought on TireDrop is fitted where you leave the car: the driveway, the lot at work or the space behind your building.",
    whereWeWork: [
      "Hollywood, Pembroke Pines and Miramar are close neighbours, and mail doesn't always respect the borders between them: an address can say Hollywood on a street that belongs to a neighbour. Nothing about that slows a booking. The van reads the ZIP code of the place the car will be parked, and the city line on an envelope never enters into it.",
      "We have not printed a Hollywood ZIP list, because we have not been able to confirm one. The ZIP lookup on this page gives a straight answer, and the same rule sits behind checkout and every booking.",
    ],
    roadside:
      "Spotted a flat in a Hollywood lot, by your front door or along a side street? Phone us in shop hours for mobile flat tire repair in Hollywood. The technician reads the damage from the inside of the tire, repairs it if it qualifies and mounts your spare if it does not.",
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
    ],
    nearby: ["pembroke-pines-fl", "miramar-fl", "davie-fl"],
    seoTitle: "Mobile Tire Installation in Hollywood, FL",
    description:
      "Tires from TireDrop fitted at your Hollywood, FL home or work by the Extreme Tires van. ZIP check for shared Hollywood mail, gate tips and shop option.",
  },
  {
    slug: "miramar-fl",
    name: "Miramar",
    county: "Broward",
    population: 134721,
    zips: [],
    areas: [],
    roads: [],
    route:
      "Within the three-county area that the Sunrise shop's vans serve, Miramar falls in Broward.",
    intro:
      "Miramar's 2020 Census count was 134,721. The Extreme Tires van, based at our Sunrise shop, serves Miramar addresses on the strength of their ZIP codes, and it fits new tires in the open: on your driveway, at your workplace or in front of your building. Pick tires on TireDrop, tick the mobile box at checkout and the old set leaves with the technician.",
    whereWeWork: [
      "Miramar touches Pembroke Pines and Hollywood, and some Miramar mail carries a neighbour's name. That is harmless here. What a booking turns on is the five-digit ZIP of the spot where the car will stand; across Miami-Dade, Broward and Palm Beach, a covered ZIP means the van is available.",
      "We print no Miramar ZIP list, since none has been verified. The checker covers every case, and checkout reads from the same rule.",
    ],
    roadside:
      "After the school run, a plaza lot or a night in the driveway, a tire can be down. When you need flat tire help in Miramar, ring us during shop hours. The van can patch a qualifying puncture where the car stands, or swap in your spare when a patch isn't possible.",
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
    ],
    nearby: ["pembroke-pines-fl", "hollywood-fl"],
    seoTitle: "Mobile Tire Installation in Miramar, FL",
    description:
      "TireDrop tires fitted at your Miramar, FL home or workplace by the Extreme Tires van. ZIP check, tread-depth tips, wheels and tires in one visit.",
  },
  {
    slug: "pompano-beach-fl",
    name: "Pompano Beach",
    county: "Broward",
    population: 112046,
    zips: [],
    areas: [],
    roads: [],
    route:
      "Pompano Beach shares a county with our Sunrise shop: both are in Broward.",
    intro:
      "The 2020 Census counted 112,046 people in Pompano Beach. The Extreme Tires van, based at our Sunrise shop, can fit your tires in Pompano Beach: on your driveway, at your workplace or outside your building. Order on TireDrop and pick mobile installation at checkout.",
    whereWeWork: [
      "Pompano Beach and our Sunrise shop are in one county, Broward, so there is no county line to wonder about. What matters is the ZIP of the spot where the car will wait for us, and the form on this page gives the answer as soon as you type it.",
      "Pompano Beach ZIPs, roads and neighbourhoods are left off this page. None has been confirmed, and a wrong entry would mislead more than a blank. The ZIP rule is what the van runs on, so nothing is lost.",
    ],
    roadside:
      "Found a nail at work, a flat in the driveway, or a tire that sinks overnight? Ask for mobile flat tire repair in Pompano Beach by phoning in shop hours. The wheel comes off, the inside of the tire gets checked, and a qualifying puncture is repaired; otherwise your spare goes on.",
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
    ],
    nearby: ["oakland-park-fl", "fort-lauderdale-fl"],
    seoTitle: "Mobile Tire Installation in Pompano Beach, FL",
    description:
      "Tires from TireDrop fitted at your Pompano Beach, FL home or work by the Extreme Tires van. ZIP check, flat repair rules and what the van does.",
  },
  {
    slug: "lauderhill-fl",
    name: "Lauderhill",
    county: "Broward",
    population: 74482,
    zips: [],
    areas: [],
    roads: [],
    route:
      "Lauderhill and the Sunrise shop are both in Broward County, which is the base of the Extreme Tires vans.",
    intro:
      "In the 2020 Census Lauderhill had 74,482 residents. For a car parked in a Lauderhill driveway, apartment lot or workplace, the Extreme Tires van from our Sunrise shop is a booking away: pick the tires on TireDrop, request mobile installation at checkout and the fitting happens beside the car.",
    whereWeWork: [
      "Broward ZIP codes regularly straddle city limits, which means an address that says Lauderhill can share its ZIP with a neighbouring city. Our Sunrise page shows the pattern from the other direction. The van doesn't care which name is on the mail; it cares about the ZIP of the place the car sits.",
      "No Lauderhill ZIP list is printed yet, because none has been confirmed. Type any ZIP into the lookup on this page, and checkout will agree with it.",
    ],
    roadside:
      "A flat in an apartment lot, a soft tire in the driveway or a nail picked up on the road: flat tire help in Lauderhill takes one phone call in shop hours. The van repairs the tire where it sits if it qualifies, and mounts the spare if it doesn't.",
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
      "Rotation moves each tire to a different corner so all four tires wear down at one pace. The Tire Industry Association's suggested interval is somewhere between 5,000 and 7,000 miles, and the manual that came with your car has the last word. On a front-wheel-drive car the front pair steers and does most of the braking, so it wears out first.",
      "You don't need to buy new tires to book it. The van rotates the set beside your car, and can balance them in the same visit. Our rotation tool shows the right pattern for your drivetrain and tread.",
    ],
    faq: [
      {
        q: "Which is easier, the van or the shop?",
        a: "That depends on your day. The shop in Sunrise takes tires shipped free and fits them in a bay, charged per tire; the van saves you the wait and the trip.",
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
    ],
    nearby: ["sunrise-fl", "plantation-fl", "tamarac-fl", "fort-lauderdale-fl"],
    seoTitle: "Mobile Tire Installation in Lauderhill, FL",
    description:
      "TireDrop tires fitted at your Lauderhill, FL home or complex lot by the Extreme Tires van from Sunrise. ZIP check, gate tips, rotation by van.",
  },
  {
    slug: "oakland-park-fl",
    name: "Oakland Park",
    county: "Broward",
    population: 44229,
    zips: [],
    areas: [],
    roads: [],
    route:
      "The shop is on a road called Oakland Park Blvd, in Sunrise. Sunrise and the city of Oakland Park are both in Broward County.",
    intro:
      "Oakland Park's population was 44,229 in the 2020 Census, and its name matches the road our shop stands on. That shop is in Sunrise, though, not in the city of Oakland Park. The Extreme Tires van does the visiting: order tires on TireDrop, ask for mobile installation, and fitting happens wherever the car is parked in Oakland Park.",
    whereWeWork: [
      "Search for a tire shop in Oakland Park and you may land on our address, and the road name is why: 7712 West Oakland Park Blvd, Sunrise, FL 33351 names the road, not the city. The city of Oakland Park itself is covered by the van, on the same ZIP-code rule as every other address we serve.",
      "We haven't verified any Oakland Park ZIPs yet, so none are printed. The ZIP check on this page takes any ZIP, and a booking is read by the same rule.",
    ],
    roadside:
      "Flat outside the office, a soft tire in the driveway or a nail from a side street? Phone in shop hours to get flat tire help in Oakland Park, meaning a repair on the spot when the tire qualifies, or your spare mounted when it doesn't.",
    beforeWeCome: {
      lede: "Whether you book the van or a bay, a short list helps. Consider these suggestions.",
      points: [
        "Choose one route: the van comes to your address, or you take the car to the shop on West Oakland Park Blvd in Sunrise.",
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
    ],
    nearby: ["fort-lauderdale-fl", "pompano-beach-fl", "sunrise-fl"],
    seoTitle: "Mobile Tire Installation in Oakland Park, FL",
    description:
      "Tires from TireDrop fitted at your Oakland Park, FL home or work by the Extreme Tires van. Our shop is in Sunrise: ZIP check, alignment and van tips.",
  },
  {
    slug: "hialeah-fl",
    name: "Hialeah",
    county: "Miami-Dade",
    population: 223109,
    // The first page outside Broward. Kept to the county, the ZIP rule and
    // what the van does: nothing on language, demographics, roads or ZIPs.
    zips: [],
    areas: [],
    roads: [],
    route:
      "The Extreme Tires vans are based at our Sunrise shop in Broward County, so a Hialeah visit starts across the county line. We book by ZIP code, and we confirm an arrival window when we book.",
    intro:
      "By the 2020 Census Hialeah had 223,109 residents, in Miami-Dade County. Our shop is across the county line in Sunrise, but the Extreme Tires van works in Miami-Dade too, so a set bought on TireDrop can be fitted in Hialeah: on a driveway, in a building lot or at a workplace. Choose mobile installation at checkout and the technician does the rest beside the car.",
    whereWeWork: [
      "Miami-Dade is one of three counties the van covers, with Broward and Palm Beach, and a single rule applies in all of them: the five-digit ZIP of the place the car will be parked. If that ZIP is in Miami-Dade, Broward or Palm Beach County, the van comes.",
      "This is our first page for a Miami-Dade city, so it sticks to what we can stand behind: the county, the ZIP rule and what the van does. No ZIP list is printed, because none has been confirmed. The ZIP lookup on this page answers for any ZIP.",
    ],
    roadside:
      "Flat in a Hialeah parking lot, a driveway or a side street? Mobile flat tire repair in Hialeah starts with a call during shop hours. If the damage can be repaired, the technician does it where the car sits; if not, your spare goes on.",
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
    ],
    nearby: ["hollywood-fl", "miramar-fl"],
    nearbyTitle: "Broward city pages, across the county line",
    seoTitle: "Mobile Tire Installation in Hialeah, FL",
    description:
      "Tires from TireDrop fitted at your Hialeah, FL home or work by the Extreme Tires van. Miami-Dade ZIP check, what the van does, free ship-to-store.",
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
