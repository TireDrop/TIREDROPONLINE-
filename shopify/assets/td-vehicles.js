/*
  TireDrop vehicle picker data: every model year 1981-2027, every make sold
  in the US in that span, and the models for a make + year.

  Models come live from the NHTSA vPIC database (vpic.nhtsa.dot.gov, free,
  public, CORS-open), filtered to passenger cars, trucks and SUVs/vans
  (vehicle types car, truck, mpv). The typical-size table in td-tiremath.js
  (window.TireDrop.FITMENT) is merged in under its own spelling, so every
  vehicle the Find My Tires tool can size still resolves to that size.

  NHTSA does not publish tire sizes, so a vehicle outside the size table is
  still selectable; the tool then asks for the size off the sidewall.

  If vPIC cannot be reached, the list falls back to the size-table models for
  that make, and an "Other / not listed" choice is always offered.

  API: window.TireDropVehicles = {
    YEARS,                      // ["2027", ..., "1981"]
    OTHER,                      // "Other" - value of the not-listed choice
    makesFor(year),             // ["Acura", ...] - all makes when year is ""
    modelsFor(make, year)       // Promise<{ models: [...], source: "nhtsa"|"fallback" }>
  }
*/
(function () {
  "use strict";
  if (window.TireDropVehicles) return;

  var FIRST_YEAR = 1981;
  var LAST_YEAR = 2027;
  var OTHER = "Other";

  var YEARS = [];
  for (var y = LAST_YEAR; y >= FIRST_YEAR; y--) YEARS.push(String(y));

  // [display name, [[firstYear, lastYear], ...], vPIC make (if different), model prefix to keep + strip]
  var MAKES = [
    ["Acura", [[1986, 2027]]],
    ["Alfa Romeo", [[1981, 1995], [2014, 2027]]],
    ["American Motors", [[1981, 1987]]],
    ["Aston Martin", [[1981, 2027]]],
    ["Audi", [[1981, 2027]]],
    ["Bentley", [[1985, 2027]]],
    ["BMW", [[1981, 2027]]],
    ["Buick", [[1981, 2027]]],
    ["Cadillac", [[1981, 2027]]],
    ["Chevrolet", [[1981, 2027]]],
    ["Chrysler", [[1981, 2027]]],
    ["Daewoo", [[1999, 2002]]],
    ["Daihatsu", [[1988, 1992]]],
    ["Datsun", [[1981, 1983]]],
    ["Dodge", [[1981, 2027]]],
    ["Eagle", [[1988, 1998]]],
    ["Ferrari", [[1981, 2027]]],
    ["Fiat", [[1981, 1982], [2012, 2027]]],
    ["Fisker", [[2012, 2012], [2023, 2024]]],
    ["Ford", [[1981, 2027]]],
    ["Genesis", [[2017, 2027]]],
    ["Geo", [[1989, 1997]]],
    ["GMC", [[1981, 2027]]],
    ["Honda", [[1981, 2027]]],
    ["Hummer", [[1992, 2010]]],
    ["Hyundai", [[1986, 2027]]],
    ["INEOS", [[2024, 2027]]],
    ["Infiniti", [[1990, 2027]]],
    ["Isuzu", [[1981, 2013]]],
    ["Jaguar", [[1981, 2027]]],
    ["Jeep", [[1981, 2027]]],
    ["Karma", [[2018, 2027]]],
    ["Kia", [[1994, 2027]]],
    ["Lamborghini", [[1981, 2027]]],
    ["Land Rover", [[1987, 2027]]],
    ["Lexus", [[1990, 2027]]],
    ["Lincoln", [[1981, 2027]]],
    ["Lotus", [[1981, 2027]]],
    ["Lucid", [[2022, 2027]]],
    ["Maserati", [[1981, 2027]]],
    ["Maybach", [[2003, 2012]]],
    ["Mazda", [[1981, 2027]]],
    ["McLaren", [[2012, 2027]]],
    ["Mercedes-Benz", [[1981, 2027]]],
    ["Mercury", [[1981, 2011]]],
    ["Merkur", [[1985, 1989]]],
    ["MINI", [[2002, 2027]]],
    ["Mitsubishi", [[1983, 2027]]],
    ["Nissan", [[1981, 2027]]],
    ["Oldsmobile", [[1981, 2004]]],
    ["Peugeot", [[1981, 1991]]],
    ["Plymouth", [[1981, 2001]]],
    ["Polestar", [[2021, 2027]]],
    ["Pontiac", [[1981, 2010]]],
    ["Porsche", [[1981, 2027]]],
    ["Ram", [[2012, 2027]]],
    ["Renault", [[1981, 1987]]],
    ["Rivian", [[2022, 2027]]],
    ["Rolls-Royce", [[1981, 2027]]],
    ["Saab", [[1981, 2011]]],
    ["Saturn", [[1991, 2010]]],
    ["Scion", [[2004, 2016]], "Toyota", "Scion "],
    ["smart", [[2008, 2019]]],
    ["Subaru", [[1981, 2027]]],
    ["Suzuki", [[1985, 2013]]],
    ["Tesla", [[2008, 2027]]],
    ["Toyota", [[1981, 2027]]],
    ["VinFast", [[2023, 2027]]],
    ["Volkswagen", [[1981, 2027]]],
    ["Volvo", [[1981, 2027]]],
    ["Yugo", [[1986, 1992]]]
  ];

  // Model years the size table covers, so a table model only joins the list
  // for years it can actually size (mirrors FITMENT_YEARS in the tool).
  var TABLE_YEARS = {"Toyota|Camry":[2005,2026],"Toyota|Corolla":[2005,2026],"Toyota|RAV4":[2005,2026],"Toyota|Tacoma":[2005,2026],"Toyota|Highlander":[2005,2026],"Toyota|4Runner":[2005,2026],"Honda|Accord":[2005,2026],"Honda|Civic":[2005,2026],"Honda|CR-V":[2005,2026],"Honda|Pilot":[2005,2026],"Honda|Odyssey":[2005,2026],"Ford|F-150":[2005,2026],"Ford|Explorer":[2005,2026],"Ford|Escape":[2005,2026],"Ford|Mustang":[2005,2026],"Ford|Transit-250":[2015,2026],"Chevrolet|Silverado":[2005,2026],"Chevrolet|Equinox":[2005,2026],"Chevrolet|Tahoe":[2005,2026],"Chevrolet|Malibu":[2005,2025],"Chevrolet|Colorado":[2005,2026],"Nissan|Altima":[2005,2026],"Nissan|Rogue":[2008,2026],"Nissan|Sentra":[2005,2026],"Nissan|Frontier":[2005,2026],"Nissan|Pathfinder":[2005,2026],"Jeep|Wrangler":[2005,2026],"Jeep|Grand Cherokee":[2005,2026],"Jeep|Cherokee":[2014,2026],"Jeep|Gladiator":[2020,2026],"BMW|3 Series":[2005,2026],"BMW|5 Series":[2005,2026],"BMW|X3":[2005,2026],"BMW|X5":[2005,2026],"Mercedes-Benz|C-Class":[2005,2026],"Mercedes-Benz|E-Class":[2005,2026],"Mercedes-Benz|GLC":[2016,2026],"Mercedes-Benz|Sprinter 2500":[2005,2026],"Hyundai|Elantra":[2005,2026],"Hyundai|Sonata":[2005,2026],"Hyundai|Tucson":[2005,2026],"Hyundai|Santa Fe":[2005,2026],"Ram|1500":[2005,2026],"Ram|2500":[2005,2026],"Ram|ProMaster":[2014,2026]};

  var VPIC = "https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/";
  var TYPES = ["car", "truck", "mpv"];
  var cache = {};
  // vPIC files a few sub-brands under the parent make; they get their own entry above.
  var EXCLUDE_PREFIX = { "Toyota": "Scion " };
  // Replica and kit builders that registered under a big make ("Classic Sedan", "'34").
  var JUNK = /^(Classic|Cordova|Malibu) Sedan$|^['"(]/;

  function log() {
    try { if (window.console && console.info) console.info.apply(console, ["[TireDrop vehicles]"].concat([].slice.call(arguments))); } catch (e) {}
  }

  function findMake(name) {
    for (var i = 0; i < MAKES.length; i++) if (MAKES[i][0] === name) return MAKES[i];
    return null;
  }

  function soldIn(entry, year) {
    if (!year) return true;
    var y = Number(year);
    return entry[1].some(function (r) { return y >= r[0] && y <= r[1]; });
  }

  function makesFor(year) {
    return MAKES.filter(function (m) { return soldIn(m, year); }).map(function (m) { return m[0]; });
  }

  // "GLC-Class" and "GLC", "3-Series" and "3 Series" are the same model.
  function norm(s) {
    return String(s).toLowerCase().replace(/class|series/g, "").replace(/[^a-z0-9]/g, "");
  }

  function tableModels(make, year) {
    var fit = (window.TireDrop && window.TireDrop.FITMENT) || {};
    var y = Number(year);
    return Object.keys(fit).filter(function (k) {
      if (k.split("|")[0] !== make) return false;
      var r = TABLE_YEARS[k];
      return !y || !r || (y >= r[0] && y <= r[1]);
    }).map(function (k) { return k.split("|")[1]; });
  }

  function fetchType(vpicMake, year, type) {
    var url = VPIC + encodeURIComponent(vpicMake) + "/modelyear/" + encodeURIComponent(year) + "/vehicletype/" + type + "?format=json";
    return fetch(url, { credentials: "omit" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) { return (d && d.Results) || []; });
  }

  function merge(make, year, names) {
    var byKey = {};
    var out = [];
    // Size-table spellings go in first, so they win a tie.
    tableModels(make, year).forEach(function (m) { byKey[norm(m)] = true; out.push(m); });
    names.forEach(function (m) {
      var clean = String(m || "").trim();
      if (!clean || /^['"(]/.test(clean)) return; // drops replica-builder junk like "'34"
      var k = norm(clean);
      if (!k || byKey[k]) return;
      byKey[k] = true;
      out.push(clean);
    });
    return out.sort(function (a, b) { return a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }); });
  }

  function modelsFor(make, year) {
    var entry = findMake(make);
    if (!entry || !year) return Promise.resolve({ models: [], source: "none" });
    var key = make + "|" + year;
    if (cache[key]) return cache[key];

    var vpicMake = entry[2] || make;
    var prefix = entry[3] || "";
    var p = Promise.all(TYPES.map(function (t) {
      return fetchType(vpicMake, year, t).catch(function (e) { log("fetch failed", make, year, t, e && e.message); return null; });
    })).then(function (parts) {
      var ok = parts.filter(function (x) { return x !== null; });
      if (!ok.length) throw new Error("vPIC unreachable");
      var names = [];
      ok.forEach(function (rows) {
        rows.forEach(function (r) {
          var n = r.Model_Name || "";
          if (prefix) { if (n.indexOf(prefix) !== 0) return; n = n.slice(prefix.length); }
          else if (EXCLUDE_PREFIX[vpicMake] && n.indexOf(EXCLUDE_PREFIX[vpicMake]) === 0) return; // Scion lives under its own make
          if (JUNK.test(n)) return;
          names.push(n);
        });
      });
      return { models: merge(make, year, names), source: "nhtsa" };
    }).catch(function (e) {
      log("falling back to size table for", make, year, e && e.message);
      delete cache[key]; // try the network again next time
      return { models: merge(make, year, []), source: "fallback" };
    });
    cache[key] = p;
    return p;
  }

  window.TireDropVehicles = Object.freeze({ YEARS: YEARS, OTHER: OTHER, makesFor: makesFor, modelsFor: modelsFor });
})();
