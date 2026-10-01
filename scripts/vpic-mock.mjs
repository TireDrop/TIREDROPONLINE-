/**
 * A stand-in for NHTSA vPIC's GetModelsForMakeYear and DecodeVinValues
 * endpoints, for the Playwright checks and the API tests (the sandbox and CI
 * cannot reach vpic.nhtsa.dot.gov).
 * Answers in vPIC's own JSON shape, per make, model year and vehicle type:
 *
 *   GET /api/vehicles/GetModelsForMakeYear/make/Toyota/modelyear/2019/vehicletype/truck?format=json
 *   { Count, Message, SearchCriteria, Results: [{ Make_ID, Make_Name, Model_ID,
 *     Model_Name, VehicleTypeId, VehicleTypeName }] }
 *
 * A make it does not know answers with no models, as vPIC does.
 */

const TYPES = {
  car: [2, "Passenger Car"],
  truck: [3, "Truck "],
  mpv: [7, "Multipurpose Passenger Vehicle (MPV)"],
};

// prettier-ignore
const MODELS = {
  Toyota: [448, {
    car: [["Camry", 2208], ["Corolla", 2209], ["Avalon", 2210], ["Prius", 2211], ["Yaris", 2212], ["86", 2213], ["Mirai", 2214], ["Corolla Hatchback", 2215]],
    truck: [["Tacoma", 2216], ["Tundra", 2217]],
    mpv: [["RAV4", 2218], ["Highlander", 2219], ["4Runner", 2220], ["Sequoia", 2221], ["Land Cruiser", 2222], ["Sienna", 2223], ["C-HR", 2224], ["Scion xB", 2225]],
  }],
  Honda: [474, {
    car: [["Accord", 1861], ["Civic", 1863], ["Insight", 1864], ["Clarity", 1865]],
    truck: [["Ridgeline", 1866]],
    mpv: [["CR-V", 1867], ["HR-V", 1868], ["Pilot", 1869], ["Passport", 1870], ["Odyssey", 1871]],
  }],
  Ford: [460, {
    car: [["Mustang", 1781], ["Fusion", 1782], ["Fiesta", 1783]],
    truck: [["F-150", 1801], ["Ranger", 1802], ["F-250", 1803]],
    mpv: [["Explorer", 1791], ["Escape", 1792], ["Edge", 1793], ["Expedition", 1794], ["Transit Connect", 1795]],
  }],
};

const PATH =
  /GetModelsForMakeYear\/make\/([^/]+)\/modelyear\/(\d+)\/vehicletype\/(\w+)/i;

/**
 * DecodeVinValues fixtures: made-up serial numbers with real check digits,
 * answered in vPIC's flat shape (one row, every value a string, "" when vPIC
 * has nothing). Make comes back in capitals, as vPIC sends it.
 */
// prettier-ignore
export const VIN_FIXTURES = {
  "3MW5U9J03M8B12345": { ModelYear: "2021", Make: "BMW", Model: "M340i", Series: "xDrive", Trim: "", DriveType: "AWD/All-Wheel Drive", BodyClass: "Sedan/Saloon" },
  "4T1B11HK8KU123456": { ModelYear: "2019", Make: "TOYOTA", Model: "Camry", Series: "", Trim: "LE", DriveType: "FWD/Front-Wheel Drive", BodyClass: "Sedan/Saloon" },
  "1FTEW1EP4KFA12345": { ModelYear: "2019", Make: "FORD", Model: "F-150", Series: "XLT", Trim: "SuperCrew", DriveType: "4WD/4-Wheel Drive/4x4", BodyClass: "Pickup" },
};

const DECODE = /DecodeVinValues\/([A-Za-z0-9]+)/i;

/** vPIC's DecodeVinValues body for one VIN (an unknown one decodes to blanks). */
export function vinDecodeBody(vin) {
  const v = String(vin).toUpperCase();
  const hit = VIN_FIXTURES[v];
  const row = {
    VIN: v,
    ModelYear: "",
    Make: "",
    Model: "",
    Series: "",
    Trim: "",
    DriveType: "",
    BodyClass: "",
    ErrorCode: hit ? "0" : "7",
    ErrorText: hit
      ? "0 - VIN decoded clean. Check Digit (9th position) is correct"
      : "7 - Manufacturer is not registered with NHTSA for sale or importation in the U.S. for use on U.S roads; Please contact the manufacturer directly for more information",
    ...(hit ?? {}),
  };
  return {
    Count: 1,
    Message: "Results returned successfully. NOTE: Any missing decoded values should be interpreted as NHTSA does not have data on the specific variable. Missing value should NOT be interpreted as an indication that a feature or technology is unavailable for a vehicle.",
    SearchCriteria: `VIN(s): ${v}`,
    Results: [row],
  };
}

/** The vPIC JSON body for one request URL. */
export function vpicBody(url) {
  const d = String(url).match(DECODE);
  if (d) return vinDecodeBody(d[1]);
  const m = String(url).match(PATH);
  if (!m) return { Count: 0, Message: "Invalid request", SearchCriteria: null, Results: [] };
  const make = decodeURIComponent(m[1]);
  const year = m[2];
  const type = m[3].toLowerCase();
  const [makeId, byType] = MODELS[make] ?? [0, {}];
  const [typeId, typeName] = TYPES[type] ?? [0, ""];
  const rows = (byType[type] ?? []).map(([name, id]) => ({
    Make_ID: makeId,
    Make_Name: make.toUpperCase(),
    Model_ID: id,
    Model_Name: name,
    VehicleTypeId: typeId,
    VehicleTypeName: typeName,
  }));
  return {
    Count: rows.length,
    Message: "Response returned successfully",
    SearchCriteria: `Make:${make.toLowerCase()} | ModelYear:${year} | VehicleType:${type}`,
    Results: rows,
  };
}

/**
 * Routes vPIC on a Playwright page or context. `down: true` answers 503, the
 * way an outage looks, so the size-table fallback can be checked.
 */
export async function mockVpic(target, { down = false } = {}) {
  await target.route("https://vpic.nhtsa.dot.gov/**", (route) =>
    down
      ? route.fulfill({
          status: 503,
          body: "Service Unavailable",
          headers: { "access-control-allow-origin": "*" },
        })
      : route.fulfill({
          json: vpicBody(route.request().url()),
          headers: { "access-control-allow-origin": "*" },
        }),
  );
}
