// The sources the Learn demos cite, keyed by the IDs in
// docs/content/learn-plan.md §6. Only sources the plan lists for a demo are
// here; a demo that needs a new one gets it added to the plan first.
//
// S-IDs are primary (government, industry association, tire maker, consumer
// testing). C-IDs fill the plan's secondary slots: tire makers, AAA or trade
// press only. Never a retailer or installer (house rule, 2026-10-02).

export const SOURCES = {
  S1: {
    label: "NHTSA TireWise",
    url: "https://www.nhtsa.gov/vehicle-safety/tires",
  },
  S2: {
    label: "NHTSA, Tires in the Garage",
    url: "https://www.nhtsa.gov/sites/nhtsa.gov/files/2021-11/Tires_InTheGarage_Infographic_102621_v1_-eng-tag.pdf",
  },
  S3: {
    label: "NHTSA, Tire Safety: Everything Rides On It",
    url: "https://www.nhtsa.gov/document/tire-safety",
  },
  S4: {
    label: "NHTSA Summer Driving Tips",
    url: "https://www.nhtsa.gov/summer-driving-tips",
  },
  S5: {
    label: "NHTSA Recalls",
    url: "https://www.nhtsa.gov/recalls",
  },
  S7: {
    label: "NHTSA, Evaluation of the Effectiveness of TPMS",
    url: "https://crashstats.nhtsa.dot.gov/Api/Public/ViewPublication/811681",
  },
  S8: {
    label: "FMVSS No. 138 (TPMS)",
    url: "https://www.nhtsa.gov/sites/nhtsa.dot.gov/files/fmvss/tirepressure-fmvss-138.pdf",
  },
  S9: {
    label: "49 CFR § 575.104 (UTQG)",
    url: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-V/part-575/subpart-B/section-575.104",
  },
  S13: {
    label: "USTMA Tire Care Essentials",
    url: "https://www.ustires.org/tire-care-safety/tire-care-essentials",
  },
  S14: {
    label: "USTMA Tire Repair Basics",
    url: "https://www.ustires.org/tire-care-safety/tire-repair-basics",
  },
  S16: {
    label: "USTMA Tire Recall Lookup",
    url: "https://recallinfo.ustires.org/TireRecallSearch/Tin",
  },
  S18: {
    label: "Tire Industry Association, Tire Rotation",
    url: "https://www.tireindustry.org/resources/consumer-education/consumer-safety-overview/tire-rotation/",
  },
  S19: {
    label: "Tire Industry Association, Tire Repair",
    url: "https://www.tireindustry.org/resources/consumer-education/consumer-safety-overview/tire-repair/",
  },
  S31: {
    label: "Consumer Reports, worn-tire performance",
    url: "https://www.consumerreports.org/cars/tires/what-happens-to-performance-when-tires-are-worn-a8910439854/",
  },
  S35: {
    label: "Michelin, Load Rating & Speed Rating",
    url: "https://www.michelinman.com/auto/auto-tips-and-advice/tires-101/tire-load-rating-speed-rating",
  },
  S36: {
    label: "Michelin, Tire Markings Explained",
    url: "https://www.michelinman.com/auto/auto-tips-and-advice/tires-101/tire-markings-explained",
  },
  S37: {
    label: "Michelin, Sidewall Bulge or Bubble",
    url: "https://www.michelinman.com/auto/auto-tips-and-advice/tire-damage/sidewall-problems/symptom-bulge-or-bubble",
  },
  S38: {
    label: "Michelin, Tread Problems",
    url: "https://www.michelinman.com/auto/auto-tips-and-advice/tire-damage/tread-problems",
  },
  S39: {
    label: "Michelin, Tire Damage Guide",
    url: "https://www.michelinman.com/auto/auto-tips-and-advice/tire-damage",
  },
  S42: {
    label: "Michelin, Changing Tire Sizes",
    url: "https://www.michelinman.com/auto/auto-tips-and-advice/tire-buying-guide/change-size-spec",
  },
  S45: {
    label: "Michelin, Car Handling Problems",
    url: "https://www.michelinman.com/auto/auto-tips-and-advice/tire-damage/car-handling-problems",
  },
  S46: {
    label: "Bridgestone, Replacement Guidance",
    url: "https://www.bridgestoneamericas.com/en/company/safety/choosing-tires/replacement-guidance",
  },
  S47: {
    label: "Bridgestone, Tire Inspection",
    url: "https://www.bridgestoneamericas.com/en/company/safety/maintaining-tires/tire-inspection",
  },
  S52: {
    label: "Goodyear, Tire Date Code",
    url: "https://www.goodyear.com/en-us/learn/tire-date-code",
  },
  S54: {
    label: "Goodyear, Tire Load Index",
    url: "https://www.goodyear.com/en_US/learn/tire-basics/tire-load-index.html",
  },
  S55: {
    label: "Goodyear, UTQG",
    url: "https://www.goodyear.com/en_US/learn/tire-basics/utqg-rating.html",
  },
  S63: {
    label: "Yokohama, UTQG",
    url: "https://www.yokohamatire.com/tires-101/how-to-read-a-sidewall-1/utqg",
  },
  C2: {
    label: "Bridgestone, Proper Tire Inflation",
    url: "https://www.bridgestoneamericas.com/en/company/safety/maintaining-tires/tire-inflation",
  },
  C3: {
    label: "AAA, Worn Tires Put Drivers at Risk",
    url: "https://newsroom.aaa.com/2018/06/tread-lightly-worn-tires-drivers-risk/",
  },
  C5: {
    label: "Goodyear, What Is a Tire Rotation",
    url: "https://www.goodyear.com/en-us/learn/what-is-a-tire-rotation",
  },
  C11: {
    label: "Bridgestone, The Penny Test",
    url: "https://tires.bridgestone.com/en-us/learn/automotive/tire-maintenance/how-to-check-your-tire-tread-penny-test",
  },
  C14: {
    label: "BFGoodrich, Changing Tire Size",
    url: "https://www.bfgoodrichtires.com/auto/learn/buying-guide/changing-tire-size",
  },
  C27: {
    label: "Tire Review, Quarter Test",
    url: "https://www.tirereview.com/quarter-tire-test-tread-depth/",
  },
};
