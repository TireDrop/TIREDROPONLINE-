// Page copy for the 12 /services/:slug pages, merged into SERVICES by
// services.js. The facts (price, duration, includes, symptoms) stay in
// services.js; this file holds only the words around them.
//
// Fields per service:
//   heading    the page H1, written around the plain search phrase
//   intro      what the service is (2 paragraphs, the first names the phrase,
//              South Florida and Sunrise)
//   when       when you need it: signs, mileage and age guidance, each tied
//              to a named source listed in `sources`
//   steps      what the technician does, in order
//   priceFactors  what moves the price. Never a dollar figure: the only
//              prices on these pages are priceFrom/priceUnit in services.js
//   faq        2 to 4 questions, shown on the page (no FAQPage JSON-LD:
//              scripts/schema-check.mjs retired new FAQ markup)
//   closing    the one line under "Signs you need this". Optional: a page
//              with none renders no line
//   guides     related tools and articles already on the site
//   sources    named sources; only makers, regulators, trade bodies and AAA
//              (the hosts in src/lib/competitors.js RESOURCE_DOMAINS)
//   fitsOnlineOrders  true when the appointment is the one that fits tires
//              or wheels bought on TireDrop
//
// House rules: no deals language, no ratings or "since" years, never "safe to
// drive", no promised times beyond the duration in services.js, no em dashes,
// installation and service in South Florida only. src/data/services.test.mjs
// checks the mechanical ones.

const AREA = "Miami-Dade, Broward and Palm Beach counties";

export const SERVICE_COPY = {
  "tire-installation": {
    heading: "Tire Installation in South Florida",
    fitsOnlineOrders: true,
    intro: [
      `Tire installation is the work of taking your old tires off the wheels, mounting new ones and putting the wheels back on the car. Extreme Tires does it at the shop in Sunrise, Florida, and by mobile van at your home, office or jobsite in ${AREA}.`,
      "It is the appointment that goes with a tire order. Ship your TireDrop tires to the Sunrise shop or to your own address, then book this service to have them fitted.",
    ],
    when: [
      "Check the tread first. Tires carry built-in wear bars, and Michelin says a tire has reached the minimum once the tread wears down level with them, at 2/32 inch (1.6 mm). Look at the sidewalls too. Cuts, cracks, bulges or blisters can mean structural damage, and Michelin notes that sidewall damage cannot be repaired.",
      "Age counts as well as tread. NHTSA says some vehicle and tire makers recommend replacing tires that are six to 10 years old, whatever the tread looks like. Michelin recommends replacement ten years after the date of manufacture, with a professional inspection at least once a year after five years of service. The last four digits of the DOT code on the sidewall give the week and year the tire was made.",
    ],
    steps: [
      "Check that the tire size and load rating match your vehicle's door placard and the tires you ordered.",
      "Remove the wheels and dismount the old tires. We dispose of them for you.",
      "Mount and seat the new tires on your wheels, with a new valve stem in each one.",
      "Balance every wheel on the spin balancer.",
      "Refit the wheels and torque the lug nuts to the vehicle maker's specification.",
      "Reset the TPMS where your vehicle has it, and set each tire to the pressure on the door placard.",
    ],
    priceFactors: [
      "How many tires you are fitting. The price is per tire.",
      "Wheel size and tire type. Larger wheels, low-profile tires and run-flat tires take more work to mount, and that can change the quote.",
      "Wheel and sensor condition. A corroded wheel, or a TPMS sensor that fails once the tire is off, can add work beyond the base job.",
      "Mobile or bay. Mobile labor is billed at the same rate as the bay, with no trip fee on standard appointments inside the local install area.",
    ],
    faq: [
      {
        q: "Do I need to replace all four tires at once?",
        a: "USTMA recommends replacing all four tires at the same time for the best performance. If you replace only two, USTMA says the new pair goes on the rear axle. Your owner's manual may add its own rules, especially on all-wheel-drive vehicles.",
      },
      {
        q: "How do I find out how old my tires are?",
        a: "Look for the DOT code on the sidewall. The last four digits are the week and year of manufacture, so a code ending in 2423 means the 24th week of 2023.",
      },
      {
        q: "Can the van fit tires I bought on TireDrop at my house?",
        a: `Yes, anywhere in ${AREA}. Book tire installation, give us your address and vehicle, and the van brings the tools to the car. If you would rather come to the shop, the Sunrise bay does the same job.`,
      },
    ],
    closing:
      "If your tires show any of these, they are due for replacement. Booking the fitting is the next step.",
    guides: [
      { to: "/tire-check", label: "Do I need tires yet? A free check" },
      {
        to: "/blog/get-tires-installed-after-buying-online",
        label: "Getting tires installed after buying online",
      },
      { to: "/learn/age/how-old-is-too-old", label: "How old is too old for a tire" },
    ],
    sources: [
      {
        title: "Tires",
        publisher: "NHTSA",
        url: "https://www.nhtsa.gov/vehicle-safety/tires",
      },
      {
        title: "When to Replace Tires: Wear, Age, and Safety Signs",
        publisher: "Michelin",
        url: "https://www.michelinman.com/auto/auto-tips-and-advice/tire-buying-guide/when-do-i-need-new-tires",
      },
      {
        title: "Replacing Tires",
        publisher: "U.S. Tire Manufacturers Association",
        url: "https://www.ustires.org/tire-care-safety/replacing-tires",
      },
    ],
  },

  "tire-balancing": {
    heading: "Tire Balancing in South Florida",
    intro: [
      `Tire balancing corrects uneven weight in a tire and wheel assembly so it spins smoothly at speed. A technician spins each wheel on a balancer, finds the heavy spot and adds small weights to offset it. We balance at the Sunrise shop and by mobile van across ${AREA}.`,
      "AAA describes balancing as adding weights to a vehicle's wheels to correct uneven weight distribution. Done right, it helps the tread wear evenly and cuts down shaking at speed.",
    ],
    when: [
      "The classic sign is vibration. AAA lists shaking in the steering wheel, seat or floor above 45 mph, along with uneven tread wear and less precise handling. Michelin adds irregular or cupped wear patterns to the list.",
      "NHTSA says new tires should always be balanced when they are installed. Balance can also change after a curb strike, a rough road or a poorly mounted tire, so it is worth checking when a new vibration shows up.",
      "Not every vibration is a balance problem. A bent wheel, a worn suspension part or an alignment issue can feel much the same. If balancing does not cure it, the next step is a closer look at the wheel and the suspension.",
    ],
    steps: [
      "Remove the wheels and clean off the old wheel weights.",
      "Mount each wheel on the spin balancer and run a dynamic balance.",
      "Add weights where the balancer shows the heavy spot, and spin the wheel again to confirm.",
      "Refit the wheels and torque the lug nuts to specification.",
      "Take a road test with you if you ask for one.",
    ],
    priceFactors: [
      "How many wheels. The price is per tire, so a full set is priced by the number of wheels.",
      "Wheel size and finish. Large or finished alloy wheels often take adhesive weights placed with care, which can add time.",
      "Whether balance is the real problem. If we find a bent wheel or a damaged tire, we tell you before charging for work that will not fix the shake.",
    ],
    faq: [
      {
        q: "How often should tires be balanced?",
        a: "There is no single interval. NHTSA says new tires should always be balanced when installed, and AAA says you can usually tell when it is time because the car starts to vibrate. Mopar notes that balancing is usually done with new tires or roughly every 5,000 to 6,000 miles. Your owner's manual and how the car feels are the best guides.",
      },
      {
        q: "What is the difference between balancing and alignment?",
        a: "Balancing corrects uneven weight in the tire and wheel assembly. Alignment adjusts the suspension so the wheels point the right way and meet the road squarely. Balance problems usually show up as vibration at speed. Alignment problems usually show up as pulling, an off-center steering wheel or uneven wear. Alignment is bay work at our Sunrise shop.",
      },
      {
        q: "Can you balance my tires at my house?",
        a: `Yes, anywhere in ${AREA}. The van carries a spin balancer, so the wheels are balanced on site.`,
      },
    ],
    closing:
      "Vibration at highway speed is the classic balance symptom. Tell us when it starts and where you feel it, and we will start there.",
    guides: [{ to: "/car-shaking-checker", label: "Car shaking checker" }],
    sources: [
      {
        title: "Wheel Balance vs. Alignment: What's the Difference and Why It Matters",
        publisher: "AAA",
        url: "https://www.aaa.com/autorepair/articles/wheel-balance-vs-alignment-whats-the-difference-and-why-it-matters",
      },
      {
        title: "Wheel Alignment & Balancing Explained",
        publisher: "Michelin",
        url: "https://www.michelinman.com/auto/auto-tips-and-advice/tire-maintenance/wheel-alignment-wheel-balancing",
      },
      {
        title: "Tires",
        publisher: "NHTSA",
        url: "https://www.nhtsa.gov/vehicle-safety/tires",
      },
      {
        title: "Tire Rotation, Balancing, and Alignment: The Basics",
        publisher: "Mopar",
        url: "https://www.mopar.com/en-us/blog/tire-rotation-balancing-and-alignment-the-basics.html",
      },
    ],
  },

  "tire-repair": {
    heading: "Flat Tire Repair in South Florida",
    intro: [
      `Flat tire repair means fixing a puncture so the tire can go back on the car, instead of replacing it. Extreme Tires repairs tires at the Sunrise shop and by mobile van in ${AREA}. We do it the way the tire industry says it should be done, from the inside.`,
      "A proper repair is a combination patch-plug. USTMA says a rubber stem must fill the puncture injury and a patch must seal the innerliner, and that a plug alone is an unacceptable repair.",
    ],
    when: [
      "Not every flat can be repaired. USTMA limits repairs to the tread area, with a puncture no larger than 1/4 inch (6 mm) across. Damage that reaches the shoulder or the sidewall means the tire has to be replaced. The Tire Industry Association adds that a tire worn to 2/32 inch should not be repaired.",
      "The tire has to come off the wheel before anyone can judge it. The Tire Industry Association says the technician must remove the tire from the rim so the inside can be thoroughly inspected, and that string plugs pushed in from the outside are temporary at best.",
      "A tire that is flat, or losing air fast, should not be driven on. Put the spare on or call us.",
    ],
    steps: [
      "Find the puncture and confirm it sits in the repairable tread area and is within the size limit.",
      "Dismount the tire from the wheel.",
      "Inspect the inside of the tire, including the innerliner, for damage.",
      "Remove the damaged material, fill the puncture with a rubber stem and seal the innerliner with a patch.",
      "Remount the tire, rebalance the wheel and set the pressure to the door placard.",
      "If the tire fails inspection, we tell you why and quote a replacement.",
    ],
    priceFactors: [
      "How many tires. The price is per tire.",
      "Whether the tire can be repaired at all. If it cannot, the job becomes a replacement, priced as tire installation plus the new tire.",
      "Tire type. USTMA says not all tires can be repaired, and maker limits can apply to run-flat tires.",
      "Parts found on the way. A damaged valve stem or TPMS sensor discovered once the tire is off may need replacing.",
    ],
    faq: [
      {
        q: "Is a plug enough to fix a flat tire?",
        a: "Not on its own. USTMA says a plug alone is an unacceptable repair, and the Tire Industry Association says a plug by itself or a patch by itself is not acceptable. The industry standard is a combination patch-plug applied from the inside after the tire is off the wheel.",
      },
      {
        q: "Can a nail near the edge of the tire be repaired?",
        a: "Usually not. Repairs are limited to the tread area. USTMA says not to repair damage that extends into the shoulder or belt edge area, and the Tire Industry Association says shoulder or sidewall damage makes a tire unrepairable. If there is any question, the tire comes out of service.",
      },
      {
        q: "Can you fix a flat at my home or office?",
        a: `Yes, anywhere in ${AREA}, during shop hours. The tire still comes off the wheel so we can inspect the inside. If it cannot be repaired, we talk through a replacement.`,
      },
    ],
    closing:
      "A tire that loses air on its own has a cause worth finding. A repair can only be judged from the inside, so the tire comes off the wheel.",
    guides: [
      { to: "/can-my-tire-be-repaired", label: "Can my tire be repaired? A quick check" },
      { to: "/learn/damage/patch-vs-plug", label: "Patch vs plug: what the industry says" },
      { to: "/learn/damage/flat-tire-nail", label: "A nail in your tire: what to do" },
    ],
    sources: [
      {
        title: "Tire Repair Basics",
        publisher: "U.S. Tire Manufacturers Association",
        url: "https://www.ustires.org/tire-care-safety/tire-repair-basics",
      },
      {
        title: "Tire Repair",
        publisher: "Tire Industry Association",
        url: "https://www.tireindustry.org/resources/consumer-education/consumer-safety-overview/tire-repair/",
      },
      {
        title: "When to Replace Tires: Wear, Age, and Safety Signs",
        publisher: "Michelin",
        url: "https://www.michelinman.com/auto/auto-tips-and-advice/tire-buying-guide/when-do-i-need-new-tires",
      },
    ],
  },

  "tire-rotation": {
    heading: "Tire Rotation in South Florida",
    intro: [
      `Tire rotation means moving each tire to a different position on the car so the set wears evenly. Extreme Tires rotates tires at the Sunrise shop and by mobile van at your home, office or jobsite in ${AREA}.`,
      "Front and rear tires do different work. The Tire Industry Association notes that front tires take extra stress from steering, and on front-wheel-drive cars they also carry the drive loads, so they can wear faster. Rotation spreads that wear around so the set lasts longer.",
    ],
    when: [
      "The Tire Industry Association recommends rotating every 5,000 to 7,000 miles, depending on the vehicle. NHTSA gives 5,000 to 8,000 miles where the vehicle maker recommends rotation, or sooner if uneven wear appears. Mopar suggests 6,000 to 8,000 miles. Your owner's manual comes first.",
      "Long commutes and rideshare driving can reach those miles in a few months, so count miles rather than calendar time.",
      "Some vehicles cannot use the usual pattern. Staggered setups with different front and rear sizes and directional tires have limits, and NHTSA says some vehicles should not be rotated at all, so check the manual.",
    ],
    steps: [
      "Look up the rotation pattern for your drivetrain and tire type.",
      "Remove the wheels.",
      "Measure the tread depth at every corner and note any uneven wear.",
      "Move each wheel to its new position in the pattern.",
      "Correct the pressure at each tire and torque the lug nuts to specification.",
      "Tell you what the tread readings show, so you can see where wear is heading.",
    ],
    priceFactors: [
      "The price is per service, not per tire.",
      "Locking lug nuts. We need the key at the appointment, and a missing key can stop the job.",
      "TPMS. Tire Review says a relearn should follow sensor replacement and, when necessary, a rotation. Some vehicles need one, and that adds a TPMS service.",
      "Hardware condition. Seized lug nuts or damaged wheel studs found at the wheel add work beyond a standard rotation.",
    ],
    faq: [
      {
        q: "Is tire rotation really necessary?",
        a: "For most vehicles, yes. The Tire Industry Association says rotation is meant to make all the tires wear evenly and last longer. Check your owner's manual for the schedule and any limits on your vehicle.",
      },
      {
        q: "How often should I rotate my tires?",
        a: "Follow the owner's manual first. If it gives no interval, the Tire Industry Association says every 5,000 to 7,000 miles and NHTSA says 5,000 to 8,000 miles. Rotate sooner if you see uneven wear.",
      },
      {
        q: "Do I need a rotation at every oil change?",
        a: "Not always. Oil change and rotation intervals differ by vehicle. Go by the mileage in your manual and by what the tread shows, and book the rotation when the miles have added up.",
      },
    ],
    closing:
      "None of these is urgent alone. Rotation works as maintenance, so the best time to book it is before the wear shows.",
    guides: [
      { to: "/tire-rotation-pattern", label: "Find your rotation pattern" },
      {
        to: "/blog/tire-rotation-upsell-myth",
        label: "Is tire rotation just an upsell? What manuals say",
      },
    ],
    sources: [
      {
        title: "Tire Rotation",
        publisher: "Tire Industry Association",
        url: "https://www.tireindustry.org/resources/consumer-education/consumer-safety-overview/tire-rotation/",
      },
      {
        title: "Tires",
        publisher: "NHTSA",
        url: "https://www.nhtsa.gov/vehicle-safety/tires",
      },
      {
        title: "Tire Rotation, Balancing, and Alignment: The Basics",
        publisher: "Mopar",
        url: "https://www.mopar.com/en-us/blog/tire-rotation-balancing-and-alignment-the-basics.html",
      },
      {
        title: "TPMS Service: Embrace the Opportunity",
        publisher: "Tire Review",
        url: "https://www.tirereview.com/tpms-service-embrace-the-opportunity/",
      },
    ],
  },

  "wheel-installation": {
    heading: "Wheel Installation in South Florida",
    fitsOnlineOrders: true,
    intro: [
      `Wheel installation is fitting a set of wheels to your vehicle, with the tires mounted and balanced and the hardware checked. Extreme Tires does it at the Sunrise shop and by mobile van across ${AREA}.`,
      "It covers aftermarket upgrades, replacing a bent or curbed wheel and seasonal swaps between two wheel and tire sets. We check fitment and clearance before anything is mounted.",
    ],
    when: [
      "Check the basics before you buy. A wheel has to match your car's bolt pattern, center bore, offset and load needs. The fitment tools on this site help, and a call with your year, make and model settles the rest.",
      "Hub-centric rings matter when a wheel's center bore is larger than your hub. Konig describes them as an alignment tool that centers the wheel on the hub, and recommends using them.",
      "Lug hardware has to match the wheel's seat. Konig says its wheels use conical seat hardware and warns that the wrong lug nut or bolt can cause a wheel to come loose.",
      "Technique matters as much as hardware. The Tire Industry Association teaches the RIST procedure, which stands for Remove, Inspect, Snug, Torque, and says a torque wrench on its own is not enough to produce the right clamping force.",
    ],
    steps: [
      "Verify fitment and clearance for the wheels on your vehicle.",
      "Remove the old wheels and inspect the hub faces and studs.",
      "Mount and balance the tires on the new wheels, or transfer your existing tires.",
      "Fit hub-centric rings where the wheel needs them, and check that the lug hardware matches.",
      "Snug the lug nuts in sequence, then torque them to specification.",
      "Transfer or program the TPMS sensors so the system reads each wheel.",
    ],
    priceFactors: [
      "How many wheels. The price is per wheel.",
      "Tire mounting. Bare wheels need tires mounted and balanced on them, and that is separate from fitting wheels that already have tires on them.",
      "Hardware. If the wheels do not come with the right lug nuts or hub-centric rings, those are added parts.",
      "TPMS. Transferring your sensors costs less work than programming new ones, and sensors that fail on the car need replacing.",
    ],
    faq: [
      {
        q: "Do I need hub-centric rings for aftermarket wheels?",
        a: "If the wheel's center bore is larger than your vehicle's hub, yes. Konig describes the rings as the part that centers the wheel on the hub and recommends always using them. We check the bore during fitment verification.",
      },
      {
        q: "Why does the lug nut seat type matter?",
        a: "The seat is the shape where the lug nut or bolt meets the wheel, such as conical. Konig warns that using the wrong hardware can cause a wheel to come loose, so we check that the hardware matches before we torque anything.",
      },
      {
        q: "Will my TPMS work with new wheels?",
        a: "Usually, once the sensors are transferred or replaced and the vehicle has relearned them. Tire Review says a relearn should always follow sensor replacement. Where new wheels need new sensors, we program them to your vehicle.",
      },
    ],
    closing:
      "New wheels only work if they fit the car. Send us the wheel specs and your vehicle details first, and we will check fitment before anything is mounted.",
    guides: [
      { to: "/wheel-fitment", label: "Wheel fitment guide" },
      { to: "/wheel-offset-calculator", label: "Wheel offset calculator" },
      { to: "/learn/fitment/bolt-pattern", label: "Bolt pattern explained" },
    ],
    sources: [
      {
        title: "Installation Hardware and Accessories",
        publisher: "Konig Wheels",
        url: "https://news.konigwheels.com/wheel-info-tech/installation-accessories/",
      },
      {
        title: "Wheel Torque Focus of Week 4 TIA Training Webinar",
        publisher: "Tire Industry Association",
        url: "https://www.tireindustry.org/resources/resources/press-releases/2020/wheel-torque-focus-of-week-4-tia-training-webinar/",
      },
      {
        title: "TPMS Service: Embrace the Opportunity",
        publisher: "Tire Review",
        url: "https://www.tirereview.com/tpms-service-embrace-the-opportunity/",
      },
    ],
  },

  "oil-change": {
    heading: "Mobile Oil Change in South Florida",
    intro: [
      `An oil change drains the used engine oil, replaces the oil filter and refills the engine with fresh oil. Extreme Tires does oil changes by mobile van at your home, office or jobsite in ${AREA}, and at the Sunrise shop if you would rather bring the car in.`,
      "Our service uses up to five quarts of full-synthetic oil and a new filter. We top off your other fluids, do a multi-point visual inspection and take the used oil away for recycling.",
    ],
    when: [
      "Start with the owner's manual. AAA says to always defer to the maintenance schedule in your owner's manual for oil change intervals. For most engines, AAA recommends changes every 5,000 to 7,500 miles, and says the old 3,000 mile rule is no longer the norm.",
      "Many newer cars have an oil-life monitor. AAA calls these helpful but not always accurate. If your maintenance-required light is on, book the change.",
      "South Florida driving can count as severe service. AAA says to follow the more rigorous schedule in your manual for conditions such as mostly short trips of 5 miles or less and sustained stop-and-go driving.",
      "Use the oil your manual specifies. AAA says the manufacturer's recommendation is the most important factor in choosing an oil type, and fueleconomy.gov says the recommended grade can improve gas mileage by 1 to 2 percent. Give us your year, make and model when you book and ask which grade your vehicle takes.",
    ],
    steps: [
      "Confirm the oil grade and capacity for your vehicle.",
      "Drain the used oil.",
      "Replace the oil filter.",
      "Refill with up to five quarts of full-synthetic oil and check the level.",
      "Top off the other fluids and do the multi-point visual inspection.",
      "Take the used oil away for recycling, and tell you what the inspection found.",
    ],
    priceFactors: [
      "Oil quantity. The from price covers up to five quarts, and an engine that holds more needs more oil, which changes the quote.",
      "Filter type. Some vehicles use a cartridge or specialty filter that costs more than a standard one.",
      "Oil specification. Some engines call for a particular grade or approval, and the oil that meets it can cost more.",
    ],
    faq: [
      {
        q: "How often should I change my oil?",
        a: "Follow your owner's manual first. AAA says most engines now go 5,000 to 7,500 miles between changes, and that severe service, such as short trips or stop-and-go traffic, calls for the shorter schedule in the manual.",
      },
      {
        q: "Is full-synthetic oil worth it?",
        a: "AAA says synthetic oil costs more up front, is rated to last about twice as long as conventional oil and offers better engine protection. What your manufacturer specifies for your engine is still the deciding factor.",
      },
      {
        q: "Can you change my oil at my house?",
        a: "Yes, anywhere in Miami-Dade, Broward and Palm Beach counties. Park on a flat spot such as a driveway or an office lot space, with a little room on the work side. The van takes the used oil away for recycling.",
      },
    ],
    closing:
      "Oil does its job quietly until it stops. Follow the interval in your owner's manual, and book once the light comes on or the miles add up.",
    guides: [
      {
        to: "/blog/mobile-tire-install-condo-office",
        label: "Mobile service at a condo or office",
      },
    ],
    sources: [
      {
        title: "How Often Should You Change Your Oil?",
        publisher: "AAA",
        url: "https://www.aaa.com/autorepair/articles/how-often-should-you-change-your-oil",
      },
      {
        title: "Synthetic vs. Conventional Oil: Which Is Better for Your Car?",
        publisher: "AAA",
        url: "https://www.aaa.com/autorepair/articles/synthetic-vs-conventional-oil-which-is-better-for-your-car",
      },
      {
        title: "Gas Mileage Tips: Keeping Your Vehicle in Shape",
        publisher: "fueleconomy.gov (U.S. Department of Energy)",
        url: "https://www.fueleconomy.gov/feg/maintain.jsp",
      },
    ],
  },

  "tpms-service": {
    heading: "TPMS Sensor Replacement and Service in South Florida",
    intro: [
      `TPMS stands for tire pressure monitoring system. A sensor at each wheel reports tire pressure, and a dashboard light warns you when a tire is low. TPMS service means finding out why the light is on, resetting or reprogramming the system and replacing a failed sensor. Extreme Tires does TPMS sensor replacement at the Sunrise shop and by mobile van across ${AREA}.`,
      "Federal safety standard 138 requires the system on light vehicles. It has the low-pressure light come on when a tire is 25 percent or more below the maker's recommended cold pressure.",
    ],
    when: [
      "NHTSA says that when the TPMS symbol appears, at least one tire is significantly underinflated. Check the pressure as soon as possible. The light should go out once the tires are at the pressure on the door placard, and it can come on during cold mornings.",
      "A light that flashes at startup and then stays on points to a fault in the system, not low air. NHTSA says this signals a malfunction and suggests a system inspection. Our sensor scan checks each sensor and its battery.",
      "Sensors do wear out. Tire Review says sensor batteries fail, and that a sensor with a dead battery can take days to show up as a flashing light. It also notes that rubber seals wear and can leak, especially if a sensor is moved during mounting, and recommends replacing wear items such as seals and grommets whenever a tire comes off the wheel.",
      "A relearn comes after any sensor replacement. Tire Review describes it as programming new sensor IDs, or repositioning existing ones, in the vehicle's control module.",
    ],
    steps: [
      "Check the pressure in every tire and set it to the door placard.",
      "Scan each sensor and test its battery.",
      "Replace any sensor that fails, with new seals where they are needed.",
      "Relearn and program the sensors to your vehicle.",
      "Confirm that the warning light clears.",
    ],
    priceFactors: [
      "How many sensors need replacing. The price is per sensor.",
      "Sensor type. Some vehicles take programmable sensors and others need a specific part, and the cost of the part varies.",
      "Whether a sensor is the cause. A slow leak or a cold-morning pressure drop may need only air or a tire repair, which is priced as that service.",
      "The relearn. Some vehicles need a scan tool to relearn the sensors, which takes longer than a simple reset.",
    ],
    faq: [
      {
        q: "Why is my TPMS light on after I filled the tires?",
        a: "NHTSA says the light turns off once the tires are properly inflated. If it stays on after you set every tire to the door placard pressure, a sensor may have failed or the system may need a relearn. Bring it in for a scan.",
      },
      {
        q: "How long do TPMS sensor batteries last?",
        a: "There is no single answer. Tire Review says sensor batteries fail and that the sensors have a relatively short life. Our scan checks the battery in each sensor.",
      },
      {
        q: "Do I need new sensors with new tires or wheels?",
        a: "Not always. Tire Review recommends replacing wear items such as seals and grommets whenever a tire comes off the wheel, and sensors that test well can be reused. New wheels need either transferred sensors or new ones, and both need a relearn.",
      },
    ],
    closing:
      "A light that stays on is the car asking for attention. Check the pressure first, and if the light comes back, a sensor scan will find out why.",
    guides: [
      {
        to: "/blog/cold-front-tpms-light-florida",
        label: "Why the TPMS light comes on after a cold front",
      },
      {
        to: "/blog/tpms-still-need-tire-gauge",
        label: "Why TPMS does not replace a tire gauge",
      },
      {
        to: "/learn/tesla/tesla-rotation-alignment-tpms",
        label: "Tesla rotation, alignment and TPMS",
      },
    ],
    sources: [
      {
        title: "Tires",
        publisher: "NHTSA",
        url: "https://www.nhtsa.gov/vehicle-safety/tires",
      },
      {
        title: "FMVSS No. 138, Tire Pressure Monitoring Systems (49 CFR 571.138)",
        publisher: "eCFR",
        url: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-V/part-571/subpart-B/section-571.138",
      },
      {
        title: "TPMS Service: Embrace the Opportunity",
        publisher: "Tire Review",
        url: "https://www.tirereview.com/tpms-service-embrace-the-opportunity/",
      },
    ],
  },

  "brake-repair": {
    heading: "Brake Repair in Sunrise, FL",
    intro: [
      "Brake repair restores the parts that slow and stop your car: the pads, the rotors, the calipers and the hydraulic system that moves fluid between them. Extreme Tires does brake repair in the bay at our Sunrise shop, for South Florida customers. It needs a lift and bay equipment, so it is not a van service.",
      "Pads wear by design. They press on the rotors every time you stop, and the friction material gets thinner until it has to be replaced. A technician decides on rotors and calipers by measurement, not by guess.",
    ],
    when: [
      "AAA lists the signs that brakes may need attention: a high-pitched squeal or grinding noise, vibration or pulsing through the pedal, a spongy or soft pedal, longer stopping distances, the car pulling to one side, leaking fluid, a burning smell and a lit ABS warning light. AAA says a squeal or grind can mean the pad has worn down to where its wear indicator touches the rotor.",
      "AAA says brakes are generally due for replacement around every 30,000 miles, depending on driving habits and road conditions, and that stop-and-go traffic and hard braking shorten that. It suggests checking the brakes each time the wheels are rotated, and says pads thinner than roughly a quarter inch likely need replacing.",
      "Your owner's manual lists the vehicle maker's inspection schedule. It takes priority over any general mileage figure.",
    ],
    steps: [
      "Listen to your description and inspect the brakes at each wheel.",
      "Measure pad thickness and rotor condition.",
      "Service the calipers and slide pins.",
      "Replace the hardware and shims, and fit new pads. Rotors are replaced where the measurements call for it.",
      "Inspect the brake fluid.",
      "Road test the car and bed in the new pads.",
    ],
    priceFactors: [
      "How many axles. The price is per axle, so a front and rear job is two.",
      "Rotors. If they are within specification, pads may be enough. AAA says rotors that are cracked or grooved may need replacement, and warped ones are either resurfaced or replaced.",
      "Calipers and hydraulics. A seized caliper, a leaking line or contaminated fluid is extra work beyond the base job, and you hear the estimate before we start it.",
      "The vehicle. Heavier trucks and performance vehicles use larger parts, and electronic parking brakes need extra steps.",
    ],
    faq: [
      {
        q: "How do I know if I need brake repair?",
        a: "Watch for a squeal or grinding noise, a pulsing or soft pedal, longer stops, pulling to one side, leaking fluid or a lit ABS light. These are the signs AAA lists. If one shows up, have the pads, rotors and fluid inspected.",
      },
      {
        q: "How long do brake pads last?",
        a: "AAA gives about 30,000 miles as a general figure, but hard braking and stop-and-go traffic can shorten that. The reliable answer for your car is a measurement of the pads and rotors.",
      },
      {
        q: "Do you do brake repair at my house?",
        a: "No. Brake repair is bay work at the Sunrise shop because it needs a lift and bay equipment. The van covers tires, balancing, oil changes and TPMS. Call with your vehicle and we will price it by phone.",
      },
    ],
    closing:
      "Brake symptoms do not tend to improve on their own. Have the pads, rotors and fluid inspected when you first notice one.",
    guides: [],
    sources: [
      {
        title: "11 Ways to Know You May Need New Brakes",
        publisher: "AAA",
        url: "https://www.aaa.com/autorepair/articles/11-ways-to-know-you-may-need-new-brakes",
      },
    ],
  },

  "wheel-alignment": {
    heading: "Wheel Alignment in Sunrise, FL",
    intro: [
      "Wheel alignment is the adjustment of your wheel angles to the vehicle maker's specifications. The tires and wheels are not changed. The suspension is adjusted so the tires meet the road squarely, which AAA describes as optimizing the tire's contact with the road. Extreme Tires does four-wheel computerized alignment in the Sunrise bay, for South Florida customers.",
      "Three angles matter. Bridgestone defines camber as the inward or outward tilt of the tire seen from the front, toe as how far the tires turn in or out seen from above, and caster as the steering axis angle seen from the side, which balances steering, stability and cornering.",
    ],
    when: [
      "AAA and Bridgestone list the same signs: the car pulling left or right, a steering wheel that sits off center on a straight road, uneven tire wear and steering wheel vibration.",
      "Michelin recommends checking alignment when you put on new tires and after hitting potholes, curbs or road debris, and says an annual alignment check is a reasonable baseline for most drivers. NHTSA says an alignment maximizes the life of your tires.",
      "AAA says lifting or lowering a vehicle, worn suspension parts and aggressive driving can also knock alignment out. Worn parts can keep an alignment from holding, which is why our suspension and lift kit work ends with an alignment check.",
    ],
    steps: [
      "Put the vehicle on the alignment rack and attach sensors to each wheel.",
      "Measure camber, caster and toe at all four wheels and print the before readings.",
      "Check the steering and suspension parts for looseness or wear that would stop an adjustment from holding.",
      "Adjust each angle to factory specification.",
      "Center the steering wheel.",
      "Print the after readings and go through the results with you.",
    ],
    priceFactors: [
      "The from price covers an alignment of all four wheels.",
      "Adjustability. Some vehicles, especially lifted or lowered ones, need extra parts such as adjustable arms or cam bolts to bring the angles back into range.",
      "Worn or bent parts. A worn tie rod or a bent arm has to be replaced before the settings will hold, and that is separate repair work.",
      "Rusted or seized adjusters. Older vehicles can take extra time at the adjusters.",
    ],
    faq: [
      {
        q: "How often should I get a wheel alignment?",
        a: "Michelin says an annual check is a reasonable baseline for most drivers. Check sooner when you fit new tires, hit a pothole or curb, or notice pulling, an off-center steering wheel or uneven wear.",
      },
      {
        q: "Do I need an alignment when I buy new tires?",
        a: "Michelin recommends checking alignment when you put on new tires. A car that is out of specification can wear a new set unevenly, and NHTSA says alignment maximizes tire life, so a check protects the tires you just bought.",
      },
      {
        q: "What is the difference between alignment and balancing?",
        a: "Alignment adjusts the suspension angles so the wheels point the right way. Balancing corrects uneven weight in the tire and wheel assembly. AAA lists pulling, an off-center steering wheel and uneven wear for alignment, and vibration above 45 mph for balance.",
      },
    ],
    closing:
      "Alignment problems show up in the tires first. Having the angles checked when you notice a pull or odd wear helps the next set last longer.",
    guides: [
      {
        to: "/blog/curb-pothole-tire-alignment-signs",
        label: "Hit a curb or pothole? Tire and alignment signs",
      },
      { to: "/learn/damage/pothole-curb-damage", label: "Pothole and curb damage guide" },
    ],
    sources: [
      {
        title: "Wheel Balance vs. Alignment: What's the Difference and Why It Matters",
        publisher: "AAA",
        url: "https://www.aaa.com/autorepair/articles/wheel-balance-vs-alignment-whats-the-difference-and-why-it-matters",
      },
      {
        title: "What You Need to Know About Tire Alignment",
        publisher: "Bridgestone",
        url: "https://tires.bridgestone.com/en-us/learn/automotive/tire-maintenance/tire-alignment",
      },
      {
        title: "Wheel Alignment & Balancing Explained",
        publisher: "Michelin",
        url: "https://www.michelinman.com/auto/auto-tips-and-advice/tire-maintenance/wheel-alignment-wheel-balancing",
      },
      {
        title: "Tires",
        publisher: "NHTSA",
        url: "https://www.nhtsa.gov/vehicle-safety/tires",
      },
    ],
  },

  "suspension-repair": {
    heading: "Suspension Repair in Sunrise, FL",
    intro: [
      "Suspension repair covers the parts that connect your wheels to the car and control how it rides and handles: struts, shocks, bushings, control arms and the hardware that holds them. Extreme Tires does suspension repair in the Sunrise bay for South Florida customers, with a full inspection first and an alignment check afterward.",
      "Shocks and struts control how the springs move, which keeps the tires in contact with the road. Bushings are the cushions in the joints, and control arms hold each wheel in position.",
    ],
    when: [
      "You may notice a bouncy ride, clunking over bumps or nose dive under braking. Tire Review lists cupping, a scalloped wear pattern, as one sign of poor damping, and notes that cupping can also come from improper balancing, so a tire pattern alone does not settle it.",
      "Wear is gradual. Tire Review, citing a Motorist Assurance Program standard, says most ride control units degrade measurably by 50,000 miles, and drivers rarely notice because the change is slow.",
      "Inspection is the way to know. Tire Review says there is no conclusive field test short of teardown or dynamometer testing, that the knee-on-the-bumper test can give false results and that a leaking unit counts as failed, not worn.",
    ],
    steps: [
      "Lift the vehicle and inspect the shocks, struts, bushings, control arms and mounts for leaks, wear and looseness.",
      "Road test the car to confirm the symptoms you described.",
      "Replace the shocks or struts that need it.",
      "Service the bushings and control arms where the inspection calls for it.",
      "Check the alignment after the repair.",
      "Go through what we found, with an estimate for anything beyond the base job.",
    ],
    priceFactors: [
      "How many axles. The price is per axle, and shocks and struts are replaced in pairs so both sides match.",
      "Which parts. Shocks, complete strut assemblies, bushings and control arms vary widely in cost.",
      "Suspension type. Vehicles with air suspension or electronically controlled shocks use different parts, priced separately.",
      "Other wear. A worn ball joint or tie rod found during the inspection is quoted before any work on it begins.",
    ],
    faq: [
      {
        q: "How do I know if my shocks or struts are worn?",
        a: "Look for a bouncy ride, clunking, nose dive and cupped tire wear. There is no simple home test. Tire Review says the knee-on-the-bumper test can give false results. A lift inspection looks for leaks, torn boots and loose parts.",
      },
      {
        q: "How long do shocks and struts last?",
        a: "Tire Review, citing a Motorist Assurance Program standard, says most ride control units degrade measurably by 50,000 miles. Roads and driving habits change that, so an inspection is more reliable than a number.",
      },
      {
        q: "Do I need an alignment after suspension repair?",
        a: "Often, yes. AAA says worn suspension parts can knock alignment out, and replacing struts, arms or bushings can shift the angles. That is why our suspension work includes an alignment check.",
      },
    ],
    closing:
      "Suspension wear is gradual, so the car often feels normal to the person who drives it every day. A clunk, a bounce or nose dive is worth an inspection.",
    guides: [
      { to: "/learn/damage/pothole-curb-damage", label: "Pothole and curb damage guide" },
    ],
    sources: [
      {
        title: "What Really Wears Out Inside Shocks & Struts",
        publisher: "Tire Review",
        url: "https://www.tirereview.com/what-really-wears-out-inside-shocks-struts/",
      },
      {
        title: "Wheel Balance vs. Alignment: What's the Difference and Why It Matters",
        publisher: "AAA",
        url: "https://www.aaa.com/autorepair/articles/wheel-balance-vs-alignment-whats-the-difference-and-why-it-matters",
      },
    ],
  },

  "lift-kits": {
    heading: "Lift Kit Installation in Sunrise, FL",
    intro: [
      "Lift kit installation raises a truck or SUV to give it more ground clearance and room for bigger tires. Kits run from leveling kits, which raise the front to match the rear, up to full suspension lifts. Extreme Tires installs lift kits in the Sunrise bay for South Florida customers.",
      "A lift is a package. Ride height, tire size, wheel offset and alignment all change together, so we spec the kit around the tire and wheel package you want.",
    ],
    when: [
      "People lift for ground clearance, for room to fit oversized tires, or to correct factory rake, where the front sits lower than the rear.",
      "Tires come first. A bigger tire has to clear the fenders, the control arms and the steering at full lock. We talk through tire size before you buy the kit, as part of the fitment consultation.",
      "Lifting changes alignment. AAA says lifting or lowering a vehicle without adjusting the suspension parts can knock alignment out, and Michelin says to reassess alignment after any wheel or tire modification. That is why the job includes a post-install alignment and a torque re-check appointment.",
      "Check Florida's height rules. Florida Statutes section 316.251 sets maximum bumper heights by vehicle weight, so a lifted vehicle can end up above a limit. The statute has exemptions and details, so check it for your vehicle, or ask us before you buy a kit. This is general information, not legal advice.",
    ],
    steps: [
      "Confirm the kit, tire size and wheels for your vehicle in a fitment consultation.",
      "Lift the vehicle, remove the wheels and take off the parts the kit replaces.",
      "Install the kit and torque the hardware to specification.",
      "Check the driveline angles.",
      "Align the vehicle.",
      "Book the torque re-check appointment, so the hardware is checked again after it has settled.",
    ],
    priceFactors: [
      "Kit type and lift height. Leveling kits sit at the low end of the range and full suspension lifts cost more.",
      "Your vehicle. Make, model and drivetrain decide which kit fits and how long the install takes.",
      "Extra parts. Some lifts call for additional parts, such as longer brake lines or driveline components, and the driveline angle check shows which.",
      "Tires and wheels. If you are adding them, they are priced separately as tire and wheel installation.",
    ],
    faq: [
      {
        q: "Will a lift kit change my alignment?",
        a: "Yes. AAA says lifting a vehicle without adjusting the suspension parts can knock alignment out, and Michelin says to reassess alignment after wheel or tire modifications. A post-install alignment is part of the job.",
      },
      {
        q: "Is a lift kit legal in Florida?",
        a: "Florida Statutes section 316.251 sets maximum bumper heights by vehicle weight, and a lift can raise a bumper above them. The rules include exemptions, so check the statute for your vehicle class, or ask us before you buy a kit.",
      },
      {
        q: "Can I fit bigger tires without a lift?",
        a: "Sometimes, within limits. Whether a tire fits depends on its size, the wheel offset and the vehicle. The fitment consultation checks clearance before anything is bought or mounted.",
      },
    ],
    closing:
      "A lift changes more than ride height. Tell us the tires and wheels you want first, and we will spec the kit around them.",
    guides: [
      { to: "/wheel-fitment", label: "Wheel fitment guide" },
      { to: "/learn/fitment/different-tire-size", label: "Fitting a different tire size" },
      { to: "/learn/fitment/wheel-offset-backspacing", label: "Wheel offset and backspacing" },
    ],
    sources: [
      {
        title: "Wheel Balance vs. Alignment: What's the Difference and Why It Matters",
        publisher: "AAA",
        url: "https://www.aaa.com/autorepair/articles/wheel-balance-vs-alignment-whats-the-difference-and-why-it-matters",
      },
      {
        title: "Wheel Alignment & Balancing Explained",
        publisher: "Michelin",
        url: "https://www.michelinman.com/auto/auto-tips-and-advice/tire-maintenance/wheel-alignment-wheel-balancing",
      },
      {
        title: "Florida Statutes, section 316.251: Maximum bumper heights",
        publisher: "The Florida Senate",
        url: "https://www.flsenate.gov/Laws/Statutes/2024/316.251",
      },
    ],
  },

  diagnostics: {
    heading: "Check Engine Light Diagnostics in Sunrise, FL",
    intro: [
      "Check engine light diagnostics means reading the trouble codes your car has stored, reviewing live data from its sensors and inspecting the engine bay to find what set the light off. Extreme Tires does diagnostics and inspections at the Sunrise shop, for South Florida customers.",
      "A code points toward a system, not always to a part. AAA says auto parts stores often pull codes for free but mainly sell parts and cannot fully diagnose the problem, and that replacing a part tied to a code may not fix it.",
    ],
    when: [
      "AAA says a steady check engine light can point to an emissions or fuel-efficiency issue or to a mechanical problem, and to address it right away if the car is running poorly. A flashing light is more serious. AAA says something is critically wrong, and advises pulling off the road safely and calling roadside assistance.",
      "Fueleconomy.gov says the light signals an engine problem that may not change how the car drives, and advises having a mechanic inspect the vehicle when it comes on.",
      "Check the gas cap first. AAA says a loose or faulty cap triggers a malfunction in the emissions system, and tightening it is a free check. If the light stays on afterward, book a scan.",
      "A rough idle, hesitation or a drop in fuel economy are reasons to book a scan even when the light is off.",
    ],
    steps: [
      "Connect to the OBD-II port and read the stored and pending codes.",
      "Review the live sensor data to see what the engine is doing now.",
      "Do a visual inspection under the hood.",
      "Compare the codes, the live data and the inspection to narrow down the cause.",
      "Give you written findings and an estimate to fix it.",
    ],
    priceFactors: [
      "The from price covers the scan, the live data review, the inspection and the written estimate. It is not a repair.",
      "The repair is quoted separately, after diagnosis, for the parts and labor that the findings call for.",
      "Intermittent faults. A fault that is not present during the visit can take more time to trace, and we tell you before we spend it.",
    ],
    faq: [
      {
        q: "What should I do when the check engine light comes on?",
        a: "Tighten the gas cap, then book a scan if the light stays on. AAA says a steady light calls for attention right away if the car is running poorly. A flashing light means something is critically wrong, so pull off the road when it is possible and call for help.",
      },
      {
        q: "Will a free code read at a parts store tell me the same thing?",
        a: "It tells you the code. AAA says parts stores mainly sell parts and cannot fully diagnose the problem, and that replacing the part a code names may not fix it. Our scan adds live data and an under-hood inspection, and ends with written findings.",
      },
      {
        q: "Does the scan price cover the repair?",
        a: "No. The from price covers the scan and the findings. The repair is quoted separately, and you hear the estimate before any work on it starts.",
      },
    ],
    closing:
      "A steady check engine light is a request for a scan, not a verdict. If it is flashing, pull over when you can and call.",
    guides: [],
    sources: [
      {
        title: "My Check Engine Light Is On! What Do I Do?",
        publisher: "AAA",
        url: "https://www.acg.aaa.com/connect/blogs/4c/auto/my-check-engine-light-is-on-what-do-i-do",
      },
      {
        title: "Gas Mileage Tips: Keeping Your Vehicle in Shape",
        publisher: "fueleconomy.gov (U.S. Department of Energy)",
        url: "https://www.fueleconomy.gov/feg/maintain.jsp",
      },
    ],
  },
};
