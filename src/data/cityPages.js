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
//   county        "Broward" (wave 1 is all Broward)
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
//   nearby        2–4 neighbouring city slugs
//   seoTitle      <title> before " | TireDrop" (unique, ≤ 60 with suffix)
//   description   meta description, ≤ 160 characters

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
      "Our shop is right here in Sunrise on West Oakland Park Blvd, near University Dr, and the vans work out of it, so Sunrise is home ground. Pick your tires on TireDrop, choose mobile installation at checkout, and a technician brings them to your driveway, your condo lot or your workplace in Sunrise and fits them there. Rather drive over? The shop is in town, and ship-to-store is free.",
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
    nearby: ["plantation-fl", "tamarac-fl", "weston-fl", "davie-fl"],
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
      "Plantation, a Broward city of 91,750 people at the 2020 Census, is next door to our Sunrise shop, where the vans are based. Buy tires on TireDrop, choose mobile installation, and we fit them at your house in Plantation Acres or Jacaranda, at your office, or wherever the car spends the day. No drop-off, no waiting room, no ride to arrange.",
    whereWeWork: [
      "The main Plantation ZIP codes are 33313, 33317, 33322, 33324 and 33325, and they overlap with the cities around them. 33313 and 33322 also take in parts of Sunrise; 33317, 33324 and 33325 are shared with Davie, and 33325 reaches into Sunrise as well. Because the van goes by ZIP, an address on any of them is covered whether it reads Plantation, Sunrise or Davie.",
      "Neighbourhoods we name here are the ones we could confirm: Plantation Acres, Jacaranda and the Central Park area. Your street doesn't need to be on the list; the ZIP is what counts.",
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
      "Buy tires on TireDrop and have them fitted in your Plantation, FL driveway or office lot. Plantation ZIPs, roads, HOA tips and what the van can do on site.",
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
      "Tamarac, a Broward County city of 71,897 people at the 2020 Census, is next door to our Sunrise shop. Buy tires on TireDrop, choose mobile installation, and a technician from the Extreme Tires shop in Sunrise fits them where you live or work in Tamarac: mounted, balanced, lug nuts torqued to spec and pressures set, with your old set hauled away.",
    whereWeWork: [
      "We name only the Tamarac neighbourhoods we could confirm, and the neighbourhood isn't what decides coverage anyway. The ZIP code where the car is parked is. Broward ZIP codes often cross city lines, so the city name on an address is a poor guide. If the ZIP is in Miami-Dade, Broward or Palm Beach County, the van comes. Type it into the checker below; checkout and the booking form run the same check.",
      "Live behind a gate? Give us the gate code, or the name the guardhouse should have on its list, when you book, and check whether your association wants service vehicles registered ahead of time.",
    ],
    roadside:
      "A flat at home, in a community lot or in a shopping center parking lot in Tamarac doesn't have to wait for a tow. Call during shop hours for flat tire help in Tamarac: the van changes the tire or puts your spare on, and repairs the flat where a repair is possible.",
    around: [
      "Commercial Blvd (SR 870) has junctions with Florida's Turnpike and with US 441 (SR 7) in Tamarac, and it meets University Dr (SR 817) at the line between Sunrise and Tamarac. SR 7 is a major boundary reference in the city, with development on both sides of it. A cross street or a landmark on one of those roads helps when you book.",
      "The neighbourhoods we can confirm by name are Tamarac Lakes, which has named sections (Sections One and Two, Tamarac Lakes North and South, and the Mainlands of Tamarac Lakes), and The Woodlands. If yours isn't on that list, nothing changes: the van goes by the ZIP where the car is parked.",
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
    nearby: ["sunrise-fl", "coral-springs-fl"],
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
      "Coral Springs, a Broward County city of 134,394 people at the 2020 Census, is a short drive from our Sunrise shop up the Sawgrass Expressway or University Dr. Your new set gets ordered on TireDrop; the fitting happens in Coral Springs, on your driveway or in your office lot, because the balancer, tire changer and torque wrenches ride along in the van.",
    whereWeWork: [
      "The main Coral Springs ZIP codes are 33065, 33067, 33071 and 33076. Two of them, 33067 and 33076, also cover parts of Parkland, so if your address says Parkland on one of those ZIPs, you're covered too. All four are Broward County ZIPs.",
      "What we look at is the five-digit code for the spot the car will sit in, never the town printed above it. Unsure about yours? Put it in the checker below and it answers on the spot, using the same rule as checkout.",
    ],
    roadside:
      "Picked up a screw on the way to work, or found a flat in a Coral Springs parking lot after errands? That's what the van's flat tire help in Coral Springs is for, during shop hours: the tire repaired on the spot when it qualifies, swapped for your spare when it doesn't.",
    around: [
      "Coral Springs borders Parkland to the north, Coconut Creek to the east, Margate and North Lauderdale to the southeast and Tamarac to the south, with the Everglades to the west.",
      "The Sawgrass Expressway (SR 869) borders the city on its north and west edges. Its exits include Atlantic Blvd (exit 8), Sample Rd (exit 11), Coral Ridge Dr (exit 14) and University Dr (exit 15, on the Parkland and Coral Springs line). Sample Rd and University Dr is the city's redevelopment hub.",
      "Coral Springs Commerce Park covers 442 acres off the Sawgrass Expressway and is a business park with employers on site, so some cars spend the workday in an office park lot. Fitting tires there while you work is the same job as anywhere else in the city, once the lot has room and the property allows service vehicles.",
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
        a: "Yes, if the lot has space alongside your car for the van and the property allows service vehicles. Give us the building, the lot and where you parked, leave the keys at the front desk or bring them down when the technician calls, and go back to work.",
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
        a: "If the ZIP of the lot is in our area (the checker tells you), yes, as long as there is room beside your car and the property allows service vehicles. Coral Springs Commerce Park is a 442-acre business park off the Sawgrass Expressway, and any lot like it works the same way: give us the building, the lot and where you parked.",
      },
      {
        q: "Is it worth checking my tires after heavy rain in Coral Springs?",
        a: "It is. The City of Coral Springs' Stormwater Master Plan lists \"frequent flooding during strong rain\" as a current challenge. Water that stands on a road can cover debris, so after a heavy downpour check each tire for nails, cuts and bulges, and measure the tread. The technician can say which tire can be fixed and which needs replacing.",
      },
    ],
    nearby: ["tamarac-fl", "sunrise-fl"],
    seoTitle: "Mobile Tire Installation in Coral Springs, FL",
    description:
      "TireDrop tires fitted at your Coral Springs, FL home or office, Parkland ZIPs 33067 and 33076 included, plus flat tire help in driveways and parking lots.",
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
      "Davie, in Broward County, had 105,691 people at the 2020 Census, and it's a short drive from our Sunrise shop down University Dr or along I-595. Choose the tires on TireDrop and the van brings them to a Pine Island Ridge or Forest Ridge driveway, an employer's lot or any other Davie address, then takes the worn set away for recycling.",
    whereWeWork: [
      "Davie spreads across seven main ZIP codes: 33314, 33317, 33324, 33325, 33328, 33330 and 33331. Plenty of them are shared. 33317, 33324 and 33325 also cover parts of Plantation, 33325 reaches into Sunrise, and 33331 is shared with Weston. Since the van works by ZIP, an envelope reading Plantation, Sunrise or Weston changes nothing for a Davie street on one of those codes.",
      "Pine Island Ridge and Forest Ridge are the Davie neighbourhoods we could confirm for this page. If yours isn't named, the ZIP checker below gives the answer.",
    ],
    roadside:
      "A flat in your Pine Island Ridge driveway, an office parking lot or a side street in Forest Ridge: call during shop hours. Mobile flat tire repair in Davie starts with the technician taking the tire off and checking the inside, then repairing it or fitting your spare.",
    around: [
      "Davie's Local Roads Master Plan names thirteen roads, listed above. One of them, Griffin Rd (SR 818), runs through Davie, crosses University Dr (SR 817), has a Florida's Turnpike interchange and forms the Davie and Cooper City border.",
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
        a: "If the lot's ZIP is in our area and the property allows service vehicles, yes. Tell us the building and the lot, check with the property that service vehicles are allowed, and have the keys ready when the technician calls.",
      },
      {
        q: "My address is near Griffin Rd. Is that Davie or Cooper City?",
        a: "Griffin Rd forms the Davie and Cooper City border, so an address near it can read either name. Use the ZIP: if the ZIP where the car is parked is in Miami-Dade, Broward or Palm Beach County, the van comes, and the checker on this page confirms it.",
      },
    ],
    nearby: ["plantation-fl", "weston-fl", "fort-lauderdale-fl", "sunrise-fl"],
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
      "Fort Lauderdale is Broward's largest city, with 182,760 people at the 2020 Census, and a short drive east along Oakland Park Blvd from our Sunrise shop. Buy tires on TireDrop, choose mobile installation, and we fit them at your home, in your building's lot or at your office in Fort Lauderdale, from Victoria Park to Galt Ocean Mile.",
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
      "TireDrop tires fitted at your Fort Lauderdale home, condo lot or office, from Las Olas to Galt Ocean Mile. Condo garage tips, ZIPs and what the van covers.",
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
      "Weston, a Broward County city of 68,107 people at the 2020 Census, is a short drive from our Sunrise shop down the Sawgrass Expressway. The set you pick on TireDrop gets fitted in your Weston driveway or at work, so nobody has to drop the car anywhere, line up a ride back, or sit in a lobby while it's done.",
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
    nearby: ["sunrise-fl", "davie-fl"],
    seoTitle: "Mobile Tire Installation in Weston, FL",
    description:
      "Bought tires on TireDrop? The Extreme Tires van fits them at your Weston, FL home or workplace. Weston ZIPs, gate and HOA tips, and what the van does.",
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
