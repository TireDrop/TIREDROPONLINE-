/**
 * A stand-in for NHTSA vPIC's GetModelsForMakeYear endpoint, for the unit
 * tests and the Playwright checks (the sandbox and CI cannot reach
 * vpic.nhtsa.dot.gov). Answers in vPIC's own JSON shape, per make, model
 * year (or every year, when the URL has none) and vehicle type:
 *
 *   GET /api/vehicles/GetModelsForMakeYear/make/Toyota/modelyear/2019/vehicletype/truck?format=json
 *   GET /api/vehicles/GetModelsForMakeYear/make/BMW/vehicletype/car?format=json
 *   { Count, Message, SearchCriteria, Results: [{ Make_ID, Make_Name, Model_ID,
 *     Model_Name, VehicleTypeId, VehicleTypeName }] }
 *
 * A make it does not know answers with no models, as vPIC does. The lists
 * are the same for every year. BMW and Audi spell their models the way vPIC
 * does (series and M/X/Z names), so the checks cover models the size table
 * has no size for (BMW 4 Series, every Audi).
 *
 * mockVpic() also answers our own /api/vehicles from these fixtures, through
 * the real handler logic (api/_lib/vehicles.js), and the build's snapshot
 * (/data/vpic-models.json) with a 404 unless one is given.
 */
import { vehiclesAnswer } from "../api/_lib/vehicles.js";

const TYPES = {
  car: [2, "Passenger Car"],
  truck: [3, "Truck "],
  mpv: [7, "Multipurpose Passenger Vehicle (MPV)"],
};

// prettier-ignore
export const MODELS = {
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
  BMW: [452, {
    car: [["2 Series", 1715], ["3 Series", 1716], ["4 Series", 1717], ["5 Series", 1718], ["6 Series", 1719], ["7 Series", 1720], ["8 Series", 1721], ["M2", 1722], ["M3", 1723], ["M4", 1724], ["M5", 1725], ["M8", 1726], ["Z4", 1727], ["i3", 1728], ["i4", 1729], ["i8", 1730], ["Alpina B7", 1731]],
    truck: [],
    mpv: [["X1", 1740], ["X2", 1741], ["X3", 1742], ["X4", 1743], ["X5", 1744], ["X6", 1745], ["X7", 1746], ["X3 M", 1747], ["X5 M", 1748], ["X6 M", 1749], ["iX", 1750]],
  }],
  Audi: [582, {
    car: [["A3", 3001], ["A4", 3002], ["A5", 3003], ["A6", 3004], ["A7", 3005], ["A8", 3006], ["S3", 3007], ["S4", 3008], ["S5", 3009], ["RS 5", 3010], ["TT", 3011], ["e-tron GT", 3012]],
    truck: [],
    mpv: [["Q3", 3020], ["Q5", 3021], ["Q7", 3022], ["Q8", 3023], ["SQ5", 3024], ["e-tron", 3025]],
  }],
};

const PATH =
  /GetModelsForMakeYear\/make\/([^/]+)(?:\/modelyear\/(\d+))?\/vehicletype\/(\w+)/i;

/** The vPIC JSON body for one request URL. */
export function vpicBody(url) {
  const m = String(url).match(PATH);
  if (!m) return { Count: 0, Message: "Invalid request", SearchCriteria: null, Results: [] };
  const make = decodeURIComponent(m[1]);
  const year = m[2] ?? "";
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
    SearchCriteria: `Make:${make.toLowerCase()}${year ? ` | ModelYear:${year}` : ""} | VehicleType:${type}`,
    Results: rows,
  };
}

/** A `fetch` that answers every vPIC URL from the fixtures. */
export async function vpicFetch(url) {
  return {
    ok: true,
    status: 200,
    json: async () => vpicBody(url),
  };
}

/**
 * Routes vPIC on a Playwright page or context, plus our /api/vehicles and
 * the build's snapshot. `down: true` is an outage: vPIC answers 503 and
 * /api/vehicles says so (502, upstream), so the size-table fallback can be
 * checked. `snapshot` is served as /data/vpic-models.json (404 without one).
 */
export async function mockVpic(target, { down = false, snapshot = null } = {}) {
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
  await target.route("**/api/vehicles?**", async (route) => {
    const query = Object.fromEntries(new URL(route.request().url()).searchParams);
    const answer = await vehiclesAnswer(query, {
      fetchImpl: down
        ? async () => ({ ok: false, status: 503, json: async () => ({}) })
        : vpicFetch,
      retries: 0,
      memo: false,
    });
    await route.fulfill({
      status: answer.status,
      json: answer.body,
      headers: { "cache-control": answer.cache },
    });
  });
  await target.route("**/data/vpic-models.json", (route) =>
    snapshot
      ? route.fulfill({ json: snapshot })
      : route.fulfill({ status: 404, body: "" }),
  );
}
